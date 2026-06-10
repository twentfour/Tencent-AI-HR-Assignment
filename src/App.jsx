import React, { useState, useEffect, useCallback, useRef } from 'react';
import { careers, careerQuiz, stickers, treeholeTopics } from './data/careers';
import { registerUser, loginUser, getUserProgress, saveUserProgress, getTreeholePosts, createTreeholePost, updateTreeholePost } from './db';

// ==================== 登录/注册页 ====================
function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login'); // login | register
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        const result = await registerUser(username.trim(), password);
        if (result.success) {
          onLogin(result.username);
        } else {
          setError(result.error);
        }
      } else {
        const result = await loginUser(username.trim(), password);
        if (result.success) {
          onLogin(result.username);
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError('网络错误，请检查网络连接后重试');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page login-page">
      <div className="login-card">
        <div className="logo-icon">🐧</div>
        <h1 className="app-title">未来鹅</h1>
        <p className="app-subtitle">大学生职业成长 AI 陪伴体</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <input
            className="form-input"
            type="text"
            placeholder="用户名"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
          />
          <input
            className="form-input"
            type="password"
            placeholder="密码"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '处理中...' : (mode === 'login' ? '登录' : '注册')}
          </button>
        </form>

        <p className="login-toggle">
          {mode === 'login' ? '还没有账号？' : '已有账号？'}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? '立即注册' : '去登录'}
          </button>
        </p>
      </div>
    </div>
  );
}

// ==================== 年级选择页 ====================
function GradeSelect({ onSelect }) {
  const grades = [
    { id: 'freshman', name: '大一', icon: '🌱', desc: '探索互联网世界', color: '#4CAF50' },
    { id: 'sophomore', name: '大二', icon: '🌿', desc: '思考专业与职业', color: '#2196F3' },
    { id: 'junior', name: '大三', icon: '🌳', desc: '实习探索关键期', color: '#FF9800' },
    { id: 'senior', name: '大四/研究生', icon: '🌟', desc: '正式求职冲刺', color: '#E91E63' },
  ];

  return (
    <div className="page grade-page">
      <div className="grade-header">
        <div className="logo-icon">🐧</div>
        <h1 className="app-title">未来鹅</h1>
        <p className="app-subtitle">大学生职业成长 AI 陪伴体</p>
        <p className="app-desc">选择你的年级，开启专属成长之旅</p>
      </div>
      <div className="grade-cards">
        {grades.map(g => (
          <button
            key={g.id}
            className="grade-card"
            style={{ '--card-color': g.color }}
            onClick={() => onSelect(g.id)}
          >
            <span className="grade-icon">{g.icon}</span>
            <span className="grade-name">{g.name}</span>
            <span className="grade-desc">{g.desc}</span>
          </button>
        ))}
      </div>
      <div className="grade-footer">
        <p>🐧 企鹅陪伴，让成长不孤单</p>
      </div>
    </div>
  );
}

// ==================== 职业测试（低年级） ====================
function CareerQuiz({ onComplete, onSaveProgress }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);

  const currentQ = careerQuiz[step];

  const handleAnswer = (option) => {
    const newAnswers = [...answers, option];
    setAnswers(newAnswers);
    if (step < careerQuiz.length - 1) {
      setStep(step + 1);
    } else {
      const scores = {};
      newAnswers.forEach(opt => {
        Object.entries(opt.scores).forEach(([cid, score]) => {
          scores[cid] = (scores[cid] || 0) + score;
        });
      });
      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      const top3 = sorted.slice(0, 3)
        .map(([id]) => careers.find(c => c.id === id))
        .filter(Boolean);
      setResult(top3);
    }
  };

  const handleSelectCareer = (career) => {
    onComplete(career);
    onSaveProgress({ careerId: career.id, quizDone: true });
  };

  if (result) {
    return (
      <div className="page quiz-result-page">
        <h2 className="page-title">🎯 你的职业方向推荐</h2>
        <p className="page-desc">根据你的回答，以下是适合你的职业方向：</p>
        <div className="result-cards">
          {result.map((c, i) => (
            <button key={c.id} className="result-card" onClick={() => handleSelectCareer(c)}>
              <span className="result-rank">{['🥇','🥈','🥉'][i]}</span>
              <span className="result-icon">{c.icon}</span>
              <div className="result-info">
                <span className="result-name">{c.name}</span>
                <span className="result-cat">{c.category}</span>
                <span className="result-desc">{c.description}</span>
              </div>
            </button>
          ))}
        </div>
        <p className="hint-text">点击选择你心仪的方向，开始成长之旅</p>
      </div>
    );
  }

  return (
    <div className="page quiz-page">
      <div className="quiz-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(step / careerQuiz.length) * 100}%` }} />
        </div>
        <span className="progress-text">{step + 1} / {careerQuiz.length}</span>
      </div>
      <h2 className="quiz-question">{currentQ.question}</h2>
      <div className="quiz-options">
        {currentQ.options.map((opt, i) => (
          <button key={i} className="quiz-option" onClick={() => handleAnswer(opt)}>
            <span className="option-letter">{['A','B','C','D'][i]}</span>
            <span>{opt.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ==================== 职业选择（高年级） ====================
function CareerSelect({ onSelect }) {
  const categories = [...new Set(careers.map(c => c.category))];

  return (
    <div className="page career-select-page">
      <h2 className="page-title">🎯 选择你心仪的职业方向</h2>
      <p className="page-desc">选择你想要发展的方向，我们将为你定制成长路径</p>
      {categories.map(cat => (
        <div key={cat} className="career-category">
          <h3 className="category-title">{cat}</h3>
          <div className="career-grid">
            {careers.filter(c => c.category === cat).map(c => (
              <button key={c.id} className="career-card" onClick={() => onSelect(c)}>
                <span className="career-icon">{c.icon}</span>
                <span className="career-name">{c.name}</span>
                <span className="career-desc">{c.description}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== 技能评估（高年级） ====================
function SkillAssessment({ career, onComplete }) {
  const [checkedSkills, setCheckedSkills] = useState([]);

  const toggleSkill = (skill) => {
    setCheckedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const masteredCount = checkedSkills.length;
  const totalSkills = career.skills.length;
  const level = masteredCount / totalSkills;

  const selectAll = () => setCheckedSkills([...career.skills]);
  const clearAll = () => setCheckedSkills([]);

  return (
    <div className="page skill-page">
      <div className="career-badge">
        <span className="badge-icon">{career.icon}</span>
        <div className="badge-info">
          <span className="badge-name">{career.name}</span>
        </div>
      </div>
      <h2 className="page-title">📋 技能自评</h2>
      <p className="page-desc">请勾选你已经掌握的技能（诚实面对自己哦）</p>
      
      <div className="skill-actions">
        <button className="btn-small-outline" onClick={selectAll}>全选</button>
        <button className="btn-small-outline" onClick={clearAll}>清空</button>
      </div>

      <div className="skill-grid">
        {career.skills.map(skill => (
          <button
            key={skill}
            className={`skill-tag ${checkedSkills.includes(skill) ? 'checked' : ''}`}
            onClick={() => toggleSkill(skill)}
          >
            {checkedSkills.includes(skill) ? '✅ ' : ''}{skill}
          </button>
        ))}
      </div>
      <div className="skill-summary">
        <div className="skill-meter">
          <div className="meter-label">掌握程度</div>
          <div className="meter-bar">
            <div className="meter-fill" style={{ width: `${level * 100}%` }} />
          </div>
          <div className="meter-text">{masteredCount}/{totalSkills} 项技能</div>
        </div>
      </div>
      <button
        className="btn-primary"
        onClick={() => onComplete(career, checkedSkills)}
      >
        查看我的成长方案
      </button>
    </div>
  );
}

// ==================== 成长方案 ====================
function GrowthPlan({
  career,
  isJunior,
  existingSkills,
  savedCompleted,
  onUpdateCompleted,
  onNavToAchievement,
  onNavToTreehole,
  userNickname,
}) {
  const autoCompleted = useRef(false);

  const [completedTasks, setCompletedTasks] = useState(() => {
    if (savedCompleted && savedCompleted.length > 0) return savedCompleted;
    if (!isJunior && existingSkills && existingSkills.length > 0) {
      const skillsLower = existingSkills.map(s => s.toLowerCase());
      const autoIds = career.growthPlan
        .filter(task => {
          return skillsLower.some(skill =>
            task.title.toLowerCase().includes(skill) ||
            task.desc.toLowerCase().includes(skill)
          );
        })
        .map(t => t.id);
      if (autoIds.length > 0) {
        autoCompleted.current = true;
        return autoIds;
      }
    }
    return [];
  });

  const [showReward, setShowReward] = useState(null);

  const allSkillsMastered = !isJunior && existingSkills && existingSkills.length === career.skills.length;

  const toggleTask = useCallback((taskId) => {
    setCompletedTasks(prev => {
      const next = prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId];
      const count = next.length;

      if (count === 1 && !prev.includes(taskId)) {
        setShowReward(stickers[0]);
      } else if (count === 3 && prev.length < 3 && !prev.includes(taskId)) {
        setShowReward(stickers[1]);
      } else if (count === 5 && prev.length < 5 && !prev.includes(taskId)) {
        setShowReward(stickers[2]);
      } else if (count === 8 && prev.length < 8 && !prev.includes(taskId)) {
        setShowReward(stickers[3]);
      }

      if (onUpdateCompleted) {
        onUpdateCompleted(next);
      }

      return next;
    });
  }, [onUpdateCompleted]);

  const completedCount = completedTasks.length;
  const totalTasks = career.growthPlan.length;
  const progress = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;
  const resumeReady = completedCount >= career.resumeReady || allSkillsMastered;
  const allDone = completedCount >= totalTasks;

  return (
    <div className="page growth-page">
      {showReward && (
        <div className="reward-overlay" onClick={() => setShowReward(null)}>
          <div className="reward-modal" onClick={e => e.stopPropagation()}>
            <div className="reward-emoji">{showReward.emoji}</div>
            <div className="reward-name">🎉 获得贴纸：{showReward.name}</div>
            <div className="reward-desc">{showReward.desc}</div>
            <button className="btn-primary" onClick={() => setShowReward(null)}>太棒了！</button>
          </div>
        </div>
      )}

      <div className="career-badge">
        <span className="badge-icon">{career.icon}</span>
        <div className="badge-info">
          <span className="badge-name">{career.name}</span>
          <span className="badge-role">腾讯相关岗位：{career.tencentRole}</span>
        </div>
      </div>

      {!isJunior && existingSkills && (
        <div className="skill-status">
          已掌握 {existingSkills.length}/{career.skills.length} 项技能
          {allSkillsMastered && <span className="skill-mastered-tag">🎉 全部掌握</span>}
        </div>
      )}

      <div className="progress-section">
        <div className="progress-header">
          <span>成长进度</span>
          <span>{completedCount}/{totalTasks} 任务</span>
        </div>
        <div className="progress-bar large">
          <div className="progress-fill" style={{ width: `${progress}%` }}>
            {progress > 15 && <span className="progress-label">{Math.round(progress)}%</span>}
          </div>
        </div>
      </div>

      <div className="plan-list">
        <h3>📝 成长任务清单</h3>
        {career.growthPlan.map(task => (
          <div
            key={task.id}
            className={`plan-item ${completedTasks.includes(task.id) ? 'completed' : ''}`}
          >
            <div className="plan-header">
              <span className="plan-difficulty">
                {'⭐'.repeat(task.difficulty)}
              </span>
              <span className={`plan-type ${task.type}`}>
                {task.type === 'skill' ? '📚 学习' : '🔨 实践'}
              </span>
            </div>
            <h4 className="plan-title">{task.title}</h4>
            <p className="plan-desc">{task.desc}</p>
            <button
              className={`btn-task ${completedTasks.includes(task.id) ? 'done' : ''}`}
              onClick={() => toggleTask(task.id)}
            >
              {completedTasks.includes(task.id) ? '✅ 已完成' : '点击标记完成'}
            </button>
          </div>
        ))}
      </div>

      {allDone && (
        <div className="all-done-banner">
          <div className="done-emoji">🏆</div>
          <h3>恭喜完成全部成长任务！</h3>
          <p>你已经具备了{career.name}的核心能力</p>
        </div>
      )}

      {(allSkillsMastered || resumeReady) && (
        <div className="resume-banner">
          <div className="resume-icon">🚀</div>
          <div>
            <h3>
              {allSkillsMastered
                ? '你已掌握全部核心技能，实力达标！'
                : '你的实力已达到投递标准！'}
            </h3>
            <p>腾讯 {career.tencentRole} 岗位正在招聘，快去投递简历吧！</p>
            <a
              href="https://join.qq.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-resume"
            >
              前往腾讯校招官网 →
            </a>
          </div>
        </div>
      )}

      <div className="growth-actions">
        <button className="btn-secondary" onClick={onNavToTreehole}>
          进入树洞社区 💬
        </button>
        <button className="btn-primary" onClick={onNavToAchievement}>
          查看我的成就 🏅
        </button>
      </div>
    </div>
  );
}

// ==================== 成就/贴纸墙 ====================
function AchievementWall({ completedCount, hasTreeholePost, onBack, onTreehole }) {
  const earnedStickers = stickers.filter(s => {
    if (s.id === 'beginner') return completedCount >= 1;
    if (s.id === 'learner') return completedCount >= 3;
    if (s.id === 'grower') return completedCount >= 5;
    if (s.id === 'master') return completedCount >= 8;
    if (s.id === 'helper') return hasTreeholePost;
    if (s.id === 'ready') return completedCount >= 6;
    return false;
  });

  return (
    <div className="page achievement-page">
      <h2 className="page-title">🏅 我的企鹅贴纸收集册</h2>
      <p className="page-desc">每完成一个里程碑，就能解锁一枚企鹅贴纸！</p>
      <div className="sticker-grid">
        {stickers.map(s => {
          const earned = earnedStickers.find(es => es.id === s.id);
          return (
            <div key={s.id} className={`sticker-card ${earned ? 'earned' : 'locked'}`}>
              <span className="sticker-emoji">{earned ? s.emoji : '🔒'}</span>
              <span className="sticker-name">{earned ? s.name : '???'}</span>
              <span className="sticker-desc">{earned ? s.desc : s.condition}</span>
            </div>
          );
        })}
      </div>
      <div className="achievement-stats">
        <div className="stat-item">
          <span className="stat-num">{earnedStickers.length}</span>
          <span className="stat-label">已收集</span>
        </div>
        <div className="stat-item">
          <span className="stat-num">{stickers.length}</span>
          <span className="stat-label">总贴纸</span>
        </div>
      </div>
      <div className="achievement-actions">
        <button className="btn-secondary" onClick={onBack}>返回成长方案</button>
        <button className="btn-primary" onClick={onTreehole}>进入树洞社区 💬</button>
      </div>
    </div>
  );
}

// ==================== 树洞社区 ====================
function TreeHole({ userData, username, onPostCreated, onReplyCreated }) {
  const [posts, setPosts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', isAnonymous: true });
  const [expandedPost, setExpandedPost] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);

  // 加载帖子
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    const data = await getTreeholePosts();
    setPosts(data);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    const post = {
      title: newPost.title,
      content: newPost.content,
      isAnonymous: newPost.isAnonymous,
      author: newPost.isAnonymous ? '匿名小鹅' : (userData?.nickname || '同学'),
      avatar: newPost.isAnonymous ? '🐧' : '🙂',
      time: new Date().toLocaleString('zh-CN'),
      username: username,
    };
    const success = await createTreeholePost(post);
    if (success) {
      setNewPost({ title: '', content: '', isAnonymous: true });
      setShowForm(false);
      await loadPosts();
      if (onPostCreated) onPostCreated();
    }
  };

  const handleReply = async (postId) => {
    if (!replyContent.trim()) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const newReplies = [...post.replies, {
      id: Date.now(),
      content: replyContent,
      author: userData?.nickname || '热心小鹅',
      avatar: '🐧',
      time: new Date().toLocaleString('zh-CN'),
    }];
    const success = await updateTreeholePost(postId, { replies: newReplies });
    if (success) {
      setReplyContent('');
      setExpandedPost(null);
      await loadPosts();
      if (onReplyCreated) onReplyCreated();
    }
  };

  const handleLike = async (postId) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const success = await updateTreeholePost(postId, { likes: (post.likes || 0) + 1 });
    if (success) {
      await loadPosts();
    }
  };

  return (
    <div className="page treehole-page">
      <div className="treehole-header">
        <h2 className="page-title">🌳 成长树洞</h2>
        <p className="page-desc">在这里，匿名分享你的烦恼与困惑，大家互相温暖</p>
        <div className="treehole-topics">
          <span className="topic-label">大家都在聊：</span>
          {treeholeTopics.map((t, i) => (
            <button
              key={i}
              className="topic-tag"
              onClick={() => {
                setNewPost({ title: t, content: '', isAnonymous: true });
                setShowForm(true);
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <button className="btn-primary full" onClick={() => setShowForm(true)}>
        ✍️ 写下你的烦恼
      </button>

      {showForm && (
        <div className="post-form">
          <h3>发表新帖</h3>
          <input
            type="text"
            className="form-input"
            placeholder="标题（如：对未来感到迷茫...）"
            value={newPost.title}
            onChange={e => setNewPost({ ...newPost, title: e.target.value })}
          />
          <textarea
            className="form-textarea"
            placeholder="写下你想说的..."
            value={newPost.content}
            onChange={e => setNewPost({ ...newPost, content: e.target.value })}
            rows={4}
          />
          <div className="form-options">
            <label className="anonymous-toggle">
              <input
                type="checkbox"
                checked={newPost.isAnonymous}
                onChange={e => setNewPost({ ...newPost, isAnonymous: e.target.checked })}
              />
              <span>🐧 匿名发布</span>
            </label>
          </div>
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => setShowForm(false)}>取消</button>
            <button className="btn-primary" onClick={handleSubmit}>发布</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="empty-state">
          <p>加载中...</p>
        </div>
      ) : (
        <div className="posts-list">
          {posts.map(post => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <span className="post-avatar">{post.avatar}</span>
                <span className="post-author">{post.author}</span>
                <span className="post-time">{post.time}</span>
                {post.isAnonymous && <span className="anon-badge">匿名</span>}
              </div>
              <h4 className="post-title">{post.title}</h4>
              <p className="post-content">{post.content}</p>
              <div className="post-actions">
                <button className="action-btn" onClick={() => handleLike(post.id)}>
                  ❤️ {post.likes || 0}
                </button>
                <button className="action-btn" onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}>
                  💬 {post.replies.length} 回复
                </button>
              </div>

              {expandedPost === post.id && (
                <div className="reply-section">
                  {post.replies.map(r => (
                    <div key={r.id} className="reply-item">
                      <span className="reply-avatar">{r.avatar}</span>
                      <div className="reply-body">
                        <span className="reply-author">{r.author}</span>
                        <p className="reply-content">{r.content}</p>
                        <span className="reply-time">{r.time}</span>
                      </div>
                    </div>
                  ))}
                  <div className="reply-form">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="写下你的回复..."
                      value={replyContent}
                      onChange={e => setReplyContent(e.target.value)}
                    />
                    <button className="btn-small" onClick={() => handleReply(post.id)}>发送</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {posts.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">🌳</span>
              <p>还没有人分享，来做第一个吧</p>
              <p className="empty-hint">你的匿名分享可能会帮助到另一个迷茫的同学</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== 主应用 ====================
export default function App() {
  const [username, setUsername] = useState(null);
  const [screen, setScreen] = useState('login');
  const [grade, setGrade] = useState(null);
  const [career, setCareer] = useState(null);
  const [existingSkills, setExistingSkills] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [hasTreeholePost, setHasTreeholePost] = useState(false);
  const [loading, setLoading] = useState(false);

  const isJunior = grade === 'freshman' || grade === 'sophomore';

  // 登录时从 Supabase 恢复用户数据
  const handleLogin = async (uname) => {
    setUsername(uname);
    setLoading(true);
    const userData = await getUserProgress(uname);
    if (userData) {
      setGrade(userData.grade || null);
      setCareer(userData.careerId ? careers.find(c => c.id === userData.careerId) : null);
      setExistingSkills(userData.existingSkills || []);
      setCompletedTasks(userData.completedTasks || []);
      setHasTreeholePost(userData.hasTreeholePost || false);
      setScreen(userData.screen || 'grade');
    } else {
      setScreen('grade');
    }
    setLoading(false);
  };

  // 保存用户进度到 Supabase
  const saveProgress = useCallback(async (updates = {}) => {
    if (!username) return;
    const progress = {
      grade,
      careerId: career?.id,
      existingSkills,
      completedTasks,
      hasTreeholePost,
      screen,
      ...updates,
    };
    await saveUserProgress(username, progress);
  }, [username, grade, career, existingSkills, completedTasks, hasTreeholePost, screen]);

  // 更新已完成任务
  const handleUpdateCompleted = useCallback(async (tasks) => {
    setCompletedTasks(tasks);
    if (username) {
      await saveUserProgress(username, {
        grade,
        careerId: career?.id,
        existingSkills,
        completedTasks: tasks,
        hasTreeholePost,
        screen,
      });
    }
  }, [username, grade, career, existingSkills, hasTreeholePost, screen]);

  // 保存屏幕状态
  useEffect(() => {
    if (username && screen !== 'login') {
      saveProgress({ screen });
    }
  }, [screen, username, saveProgress]);

  const handleGradeSelect = async (g) => {
    setGrade(g);
    const nextScreen = (g === 'freshman' || g === 'sophomore') ? 'quiz' : 'career-select';
    setScreen(nextScreen);
    await saveProgress({ grade: g, screen: nextScreen });
  };

  const handleQuizComplete = async (c) => {
    setCareer(c);
    setScreen('growth');
    await saveProgress({ careerId: c.id, screen: 'growth' });
  };

  const handleCareerSelect = async (c) => {
    setCareer(c);
    setScreen('skill');
    await saveProgress({ careerId: c.id, screen: 'skill' });
  };

  const handleSkillComplete = async (c, skills) => {
    setCareer(c);
    setExistingSkills(skills);
    setScreen('growth');
    await saveProgress({ careerId: c.id, existingSkills: skills, screen: 'growth' });
  };

  const handleNavToAchievement = async () => {
    // 从数据库同步最新状态
    const progress = await getUserProgress(username);
    if (progress) {
      setHasTreeholePost(progress.hasTreeholePost || false);
      setCompletedTasks(progress.completedTasks || []);
    }
    setScreen('achievement');
    await saveProgress({ screen: 'achievement' });
  };

  const handleNavToTreehole = async () => {
    setScreen('treehole');
    await saveProgress({ screen: 'treehole' });
  };

  // 加载中状态
  if (loading) {
    return (
      <div className="app">
        <div className="page login-page">
          <div className="login-card">
            <div className="logo-icon">🐧</div>
            <h1 className="app-title">未来鹅</h1>
            <p>加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  // 登录页
  if (screen === 'login') {
    return (
      <div className="app">
        <LoginPage onLogin={handleLogin} />
      </div>
    );
  }

  const showNav = !['grade', 'quiz', 'career-select', 'skill', 'login'].includes(screen);

  const renderScreen = () => {
    switch (screen) {
      case 'grade':
        return <GradeSelect onSelect={handleGradeSelect} />;

      case 'quiz':
        return (
          <CareerQuiz
            onComplete={handleQuizComplete}
            onSaveProgress={(data) => saveProgress(data)}
          />
        );

      case 'career-select':
        return <CareerSelect onSelect={handleCareerSelect} />;

      case 'skill':
        return career && (
          <SkillAssessment career={career} onComplete={handleSkillComplete} />
        );

      case 'growth':
        return career && (
          <GrowthPlan
            career={career}
            isJunior={isJunior}
            existingSkills={existingSkills}
            savedCompleted={completedTasks}
            onUpdateCompleted={handleUpdateCompleted}
            onNavToAchievement={handleNavToAchievement}
            onNavToTreehole={handleNavToTreehole}
            userNickname={username}
          />
        );

      case 'achievement':
        return (
          <AchievementWall
            completedCount={completedTasks.length}
            hasTreeholePost={hasTreeholePost}
            onBack={() => setScreen('growth')}
            onTreehole={handleNavToTreehole}
          />
        );

      case 'treehole':
        return (
          <TreeHole
            userData={{ nickname: username }}
            username={username}
            onPostCreated={() => setHasTreeholePost(true)}
            onReplyCreated={() => setHasTreeholePost(true)}
          />
        );

      default:
        return <GradeSelect onSelect={handleGradeSelect} />;
    }
  };

  return (
    <div className="app">
      {screen !== 'login' && screen !== 'grade' && (
        <div className="top-bar">
          <span className="top-user">👤 {username}</span>
          <select
            className="top-grade-select"
            value={grade || ''}
            onChange={(e) => {
              const newGrade = e.target.value;
              if (!newGrade) return;
              setGrade(newGrade);
              const isNewJunior = newGrade === 'freshman' || newGrade === 'sophomore';
              const wasJunior = isJunior;
              if (isNewJunior !== wasJunior) {
                setCareer(null);
                setExistingSkills([]);
                setCompletedTasks([]);
                setScreen(isNewJunior ? 'quiz' : 'career-select');
                saveProgress({
                  grade: newGrade,
                  careerId: null,
                  existingSkills: [],
                  completedTasks: [],
                  screen: isNewJunior ? 'quiz' : 'career-select',
                });
              } else {
                saveProgress({ grade: newGrade });
              }
            }}
          >
            <option value="freshman">大一 🌱</option>
            <option value="sophomore">大二 🌿</option>
            <option value="junior">大三 🌳</option>
            <option value="senior">大四/研究生 🌟</option>
          </select>
          <button className="top-logout" onClick={() => {
            setUsername(null);
            setScreen('login');
            setGrade(null);
            setCareer(null);
            setExistingSkills([]);
            setCompletedTasks([]);
          }}>
            退出
          </button>
        </div>
      )}

      {renderScreen()}

      {showNav && (
        <nav className="bottom-nav">
          <button
            className={`nav-btn ${screen === 'growth' ? 'active' : ''}`}
            onClick={() => setScreen('growth')}
          >
            📝 成长
          </button>
          <button
            className={`nav-btn ${screen === 'achievement' ? 'active' : ''}`}
            onClick={handleNavToAchievement}
          >
            🏅 成就
          </button>
          <button
            className={`nav-btn ${screen === 'treehole' ? 'active' : ''}`}
            onClick={handleNavToTreehole}
          >
            🌳 树洞
          </button>
        </nav>
      )}
    </div>
  );
}
