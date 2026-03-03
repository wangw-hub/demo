import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Briefcase,
    GraduationCap,
    Layers,
    Download,
    Trash2,
    Mail,
    Phone,
    Globe,
    PlusCircle,
    Calendar,
    ChevronDown,
    Camera
} from 'lucide-react';
import html2pdf from 'html2pdf.js';

// ─────────────────────────────────────────────
// 模块级常量：避免每次渲染重新创建
// ─────────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();

/** 可选年份列表：从今年往前 30 年 */
const YEARS = Array.from({ length: 30 }, (_, i) => (CURRENT_YEAR - i).toString());

/** 月份列表，最后一项为"至今"占位符 */
const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', 'Present'];

/** 工作经历条目的默认值 */
const DEFAULT_EXPERIENCE = () => ({
    id: Date.now(),
    company: '',
    position: '',
    startYear: CURRENT_YEAR.toString(),
    startMonth: '01',
    endYear: CURRENT_YEAR.toString(),
    endMonth: 'Present',
    description: '',
});

/** 教育背景条目的默认值 */
const DEFAULT_EDUCATION = () => ({
    id: Date.now(),
    school: '',
    degree: '',
    startYear: (CURRENT_YEAR - 4).toString(),
    startMonth: '09',
    endYear: CURRENT_YEAR.toString(),
    endMonth: '06',
});

/** localStorage 持久化 key */
const STORAGE_KEY = 'resume-builder-data';

// ─────────────────────────────────────────────
// 子组件：日期选择器（提取至顶层，避免每次渲染重建）
// ─────────────────────────────────────────────

/**
 * 年份 + 月份双列选择器
 * @param {string} label - 标签文字
 * @param {string} valueYear - 当前选中年份
 * @param {string} valueMonth - 当前选中月份（可为 'Present'）
 * @param {(v: string) => void} onYearChange - 年份变更回调
 * @param {(v: string) => void} onMonthChange - 月份变更回调
 */
const DateSelector = ({ label, valueYear, valueMonth, onYearChange, onMonthChange }) => (
    <div className="date-selector-container">
        <label className="input-label date-label">{label}</label>
        <div className="date-selector-grid">
            <div className="relative select-wrapper">
                <select
                    value={valueYear}
                    onChange={(e) => onYearChange(e.target.value)}
                    className="input-field select-field"
                >
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown className="select-icon" size={14} />
            </div>
            <div className="relative select-wrapper">
                <select
                    value={valueMonth}
                    onChange={(e) => onMonthChange(e.target.value)}
                    className="input-field select-field"
                >
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown className="select-icon" size={14} />
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────
// 主组件
// ─────────────────────────────────────────────
const App = () => {
    // 从 localStorage 恢复数据，首次使用默认值
    const [data, setData] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.warn('无法读取本地存储数据，使用默认值:', e);
        }
        return {
            personal: { name: '', title: '', email: '', phone: '', website: '', github: '', location: '', about: '' },
            experience: [{ id: 1, company: '', position: '', startYear: '2020', startMonth: '01', endYear: '2024', endMonth: 'Present', description: '' }],
            education: [{ id: 1, school: '', degree: '', startYear: '2016', startMonth: '09', endYear: '2020', endMonth: '06' }],
            skills: ['React', 'JavaScript', 'Node.js'],
        };
    });

    const [skillInput, setSkillInput] = useState('');
    const [editorWidth, setEditorWidth] = useState(450);
    const [photo, setPhoto] = useState(null);

    const isResizing = useRef(false);
    const photoInputRef = useRef();
    const resumeRef = useRef();

    // 数据变更时同步持久化到 localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('无法写入本地存储:', e);
        }
    }, [data]);

    // ── 拖拽分隔条：用 useCallback 稳定引用，确保能正确移除监听器 ──

    /** 停止拖拽，移除全局监听器 */
    const stopResizing = useCallback(() => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /** 拖拽过程中更新编辑区宽度 */
    const handleMouseMove = useCallback((e) => {
        if (!isResizing.current) return;
        const newWidth = Math.max(300, Math.min(e.clientX, window.innerWidth * 0.7));
        setEditorWidth(newWidth);
    }, []);

    /** 开始拖拽，挂载全局监听器 */
    const startResizing = useCallback((e) => {
        isResizing.current = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [handleMouseMove, stopResizing]);

    // 组件卸载时保底清理，防止极端情况下泄漏
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', stopResizing);
        };
    }, [handleMouseMove, stopResizing]);

    // ── 数据变更处理器 ──

    const handlePersonalChange = (e) => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, personal: { ...prev.personal, [name]: value } }));
    };

    const handleListItemChange = (type, id, field, value) => {
        setData(prev => ({
            ...prev,
            [type]: prev[type].map(item => item.id === id ? { ...item, [field]: value } : item),
        }));
    };

    const addItem = (type) => {
        const newItem = type === 'experience' ? DEFAULT_EXPERIENCE() : DEFAULT_EDUCATION();
        setData(prev => ({ ...prev, [type]: [...prev[type], newItem] }));
    };

    const removeItem = (type, id) => {
        setData(prev => ({ ...prev, [type]: prev[type].filter(item => item.id !== id) }));
    };

    const handleSkillAdd = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = skillInput.trim();
            if (value && !data.skills.includes(value)) {
                setData(prev => ({ ...prev, skills: [...prev.skills, value] }));
                setSkillInput('');
            }
        }
    };

    const removeSkill = (index) => {
        setData(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== index) }));
    };

    const downloadPDF = () => {
        const element = resumeRef.current;
        const opt = {
            margin: 0,
            filename: `${data.personal.name || 'Resume'}_CV.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        };
        html2pdf().set(opt).from(element).save();
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setPhoto(ev.target.result);
        reader.readAsDataURL(file);
    };

    return (
        <div className="app-container">
            <div className="bg-decor">
                <div className="decor-blob-1" />
                <div className="decor-blob-2" />
            </div>

            <nav className="navbar glass-effect">
                <div className="nav-logo">
                    <div className="logo-icon">
                        <Layers className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="logo-text">AI Resume Builder</h1>
                        <p className="logo-sub">Premium Design Studio</p>
                    </div>
                </div>
                <button onClick={downloadPDF} className="btn-primary nav-btn">
                    <Download size={18} />
                    <span>导出 PDF</span>
                </button>
            </nav>

            <main className="main-layout">
                {/* ── 左侧编辑区 ── */}
                <div className="editor-side" style={{ width: editorWidth }}>
                    {/* 个人信息 */}
                    <section className="editor-section">
                        <div className="section-header">
                            <User size={20} />
                            <span className="section-title">个人信息</span>
                        </div>

                        <div className="photo-upload-row">
                            <div className="photo-upload-area" onClick={() => photoInputRef.current.click()}>
                                {photo ? (
                                    <img src={photo} alt="头像" className="photo-preview-img" />
                                ) : (
                                    <>
                                        <Camera size={24} className="upload-icon" />
                                        <span className="upload-text">上传证件照</span>
                                    </>
                                )}
                            </div>
                            <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                            {photo && (
                                <button className="photo-remove-btn" onClick={() => setPhoto(null)}>
                                    <Trash2 size={14} /> 移除照片
                                </button>
                            )}
                        </div>

                        <div className="input-grid">
                            <div className="input-group">
                                <label className="input-label">全名</label>
                                <input name="name" onChange={handlePersonalChange} className="input-field" placeholder="张伟" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">意向职位</label>
                                <input name="title" onChange={handlePersonalChange} className="input-field" placeholder="核心研发工程师" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">电子邮箱</label>
                                <input name="email" onChange={handlePersonalChange} className="input-field" placeholder="name@company.com" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">联系电话</label>
                                <input name="phone" onChange={handlePersonalChange} className="input-field" placeholder="138xxxx8888" />
                            </div>
                            <div className="input-group full-width">
                                <label className="input-label">职业主页</label>
                                <input name="website" onChange={handlePersonalChange} className="input-field" placeholder="https://github.com/someone" />
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">个人简述</label>
                            <textarea name="about" onChange={handlePersonalChange} className="input-field textarea-field" placeholder="突出你的核心技术优势和成就..." />
                        </div>
                    </section>

                    {/* 工作经历 */}
                    <section className="editor-section">
                        <div className="section-header-row">
                            <div className="section-header">
                                <Briefcase size={20} />
                                <span className="section-title">工作经历</span>
                            </div>
                            <button onClick={() => addItem('experience')} className="add-btn">
                                <PlusCircle size={14} /> 添加职位
                            </button>
                        </div>

                        <AnimatePresence>
                            {data.experience.map((exp) => (
                                <motion.div
                                    key={exp.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="card glass-effect list-card"
                                >
                                    <button onClick={() => removeItem('experience', exp.id)} className="remove-btn">
                                        <Trash2 size={16} />
                                    </button>
                                    <div className="input-grid">
                                        <div className="input-group">
                                            <label className="input-label">公司</label>
                                            <input placeholder="公司名称" className="input-field" onChange={(e) => handleListItemChange('experience', exp.id, 'company', e.target.value)} />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">职位</label>
                                            <input placeholder="职位" className="input-field" onChange={(e) => handleListItemChange('experience', exp.id, 'position', e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="date-row">
                                        <DateSelector
                                            label="入职时间"
                                            valueYear={exp.startYear}
                                            valueMonth={exp.startMonth}
                                            onYearChange={(v) => handleListItemChange('experience', exp.id, 'startYear', v)}
                                            onMonthChange={(v) => handleListItemChange('experience', exp.id, 'startMonth', v)}
                                        />
                                        <DateSelector
                                            label="离职时间"
                                            valueYear={exp.endYear}
                                            valueMonth={exp.endMonth}
                                            onYearChange={(v) => handleListItemChange('experience', exp.id, 'endYear', v)}
                                            onMonthChange={(v) => handleListItemChange('experience', exp.id, 'endMonth', v)}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">核心职责与成就</label>
                                        <textarea placeholder="描述工作内容..." className="input-field textarea-field-sm" onChange={(e) => handleListItemChange('experience', exp.id, 'description', e.target.value)} />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </section>

                    {/* 教育背景 */}
                    <section className="editor-section">
                        <div className="section-header-row">
                            <div className="section-header">
                                <GraduationCap size={20} />
                                <span className="section-title">教育背景</span>
                            </div>
                            <button onClick={() => addItem('education')} className="add-btn">
                                <PlusCircle size={14} /> 添加教育
                            </button>
                        </div>
                        {data.education.map((edu) => (
                            <div key={edu.id} className="card glass-effect list-card">
                                <button onClick={() => removeItem('education', edu.id)} className="remove-btn">
                                    <Trash2 size={16} />
                                </button>
                                <div className="input-grid">
                                    <div className="input-group">
                                        <label className="input-label">院校名称</label>
                                        <input className="input-field" onChange={(e) => handleListItemChange('education', edu.id, 'school', e.target.value)} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">专业/学位</label>
                                        <input className="input-field" onChange={(e) => handleListItemChange('education', edu.id, 'degree', e.target.value)} />
                                    </div>
                                </div>
                                <div className="date-row">
                                    <DateSelector
                                        label="入学时间"
                                        valueYear={edu.startYear}
                                        valueMonth={edu.startMonth}
                                        onYearChange={(v) => handleListItemChange('education', edu.id, 'startYear', v)}
                                        onMonthChange={(v) => handleListItemChange('education', edu.id, 'startMonth', v)}
                                    />
                                    <DateSelector
                                        label="毕业时间"
                                        valueYear={edu.endYear}
                                        valueMonth={edu.endMonth}
                                        onYearChange={(v) => handleListItemChange('education', edu.id, 'endYear', v)}
                                        onMonthChange={(v) => handleListItemChange('education', edu.id, 'endMonth', v)}
                                    />
                                </div>
                            </div>
                        ))}
                    </section>

                    {/* 核心技能 */}
                    <section className="editor-section last-section">
                        <div className="section-header">
                            <Layers size={20} />
                            <span className="section-title">核心技能</span>
                        </div>
                        <div className="skills-container">
                            {data.skills.map((skill, i) => (
                                <motion.span
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    key={skill}  // ✅ 使用技能名作为 key，而非不稳定的下标
                                    className="skill-pill"
                                >
                                    {skill}
                                    <button onClick={() => removeSkill(i)} className="skill-remove">
                                        <Trash2 size={12} />
                                    </button>
                                </motion.span>
                            ))}
                        </div>
                        <input placeholder="输入技能名回车确认..." className="input-field" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={handleSkillAdd} />
                    </section>
                </div>

                {/* 拖拽分隔条 */}
                <div className="resizer" onMouseDown={startResizing} />

                {/* ── 右侧简历预览区 ── */}
                <div className="preview-side">
                    <div className="preview-container">
                        <div id="resume-preview" ref={resumeRef} className="resume-paper">
                            <div className="resume-header">
                                <div className="resume-header-main">
                                    <div className="resume-header-text">
                                        <div className="resume-name-text">{data.personal.name || '姓名'}</div>
                                        <div className="resume-title-text">{data.personal.title || '核心技术职位'}</div>
                                        <div className="resume-contact-grid">
                                            {data.personal.email && <div className="contact-item"><Mail size={12} /> {data.personal.email}</div>}
                                            {data.personal.phone && <div className="contact-item"><Phone size={12} /> {data.personal.phone}</div>}
                                            {data.personal.location && <div className="contact-item"><Globe size={12} /> {data.personal.location}</div>}
                                            {/* ✅ 职业主页使用语义正确的 Globe 图标 */}
                                            {data.personal.website && <div className="contact-item"><Globe size={12} /> {data.personal.website}</div>}
                                        </div>
                                    </div>
                                    {photo && <img src={photo} alt="头像" className="resume-avatar" />}
                                </div>
                            </div>

                            {data.personal.about && (
                                <div className="resume-section">
                                    <h3 className="resume-section-title-preview">核心自述</h3>
                                    <p className="resume-text">{data.personal.about}</p>
                                </div>
                            )}

                            <div className="resume-section">
                                <h3 className="resume-section-title-preview">履历背景</h3>
                                <div className="experience-list">
                                    {data.experience.map(exp => (
                                        <div key={exp.id} className="experience-item-preview">
                                            <div className="experience-header-preview">
                                                <span className="experience-company">{exp.company || '公司'}</span>
                                                <span className="experience-date">
                                                    {exp.startYear}.{exp.startMonth} - {exp.endMonth === 'Present' ? '至今' : `${exp.endYear}.${exp.endMonth}`}
                                                </span>
                                            </div>
                                            <div className="experience-position">{exp.position || '职位'}</div>
                                            <p className="experience-desc">{exp.description || '工作背景描述...'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="resume-section">
                                <h3 className="resume-section-title-preview">教育历程</h3>
                                <div className="education-list-preview">
                                    {data.education.map(edu => (
                                        <div key={edu.id} className="education-item-preview">
                                            <div className="education-header-preview">
                                                <span className="education-school">{edu.school || '院校'}</span>
                                                <span className="education-date">{edu.startYear}.{edu.startMonth} - {edu.endYear}.{edu.endMonth}</span>
                                            </div>
                                            <div className="education-degree">{edu.degree || '学位'}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="resume-section">
                                <h3 className="resume-section-title-preview">专业储备</h3>
                                <div className="skills-grid-preview">
                                    {/* ✅ 使用技能名作为 key */}
                                    {data.skills.map((skill) => (
                                        <div key={skill} className="skill-item-preview">
                                            <div className="skill-dot" />
                                            {skill}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
