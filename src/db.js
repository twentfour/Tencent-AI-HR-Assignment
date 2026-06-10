import { supabase } from './supabaseClient';

// ==================== 用户认证 ====================

/**
 * 注册新用户
 */
export async function registerUser(username, password) {
  // 检查用户名是否已存在
  const { data: existing } = await supabase
    .from('users')
    .select('username')
    .eq('username', username)
    .single();

  if (existing) {
    return { success: false, error: '该用户名已被注册' };
  }

  // 创建用户
  const { data, error } = await supabase
    .from('users')
    .insert([{ username, password, created_at: new Date().toISOString() }])
    .select('username')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, username: data.username };
}

/**
 * 登录
 */
export async function loginUser(username, password) {
  const { data, error } = await supabase
    .from('users')
    .select('username, password')
    .eq('username', username)
    .single();

  if (error || !data) {
    return { success: false, error: '用户不存在，请先注册' };
  }

  if (data.password !== password) {
    return { success: false, error: '密码错误' };
  }

  return { success: true, username: data.username };
}

// ==================== 用户进度 ====================

/**
 * 获取用户进度
 */
export async function getUserProgress(username) {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    grade: data.grade,
    careerId: data.career_id,
    existingSkills: data.existing_skills || [],
    completedTasks: data.completed_tasks || [],
    hasTreeholePost: data.has_treehole_post || false,
    screen: data.screen,
  };
}

/**
 * 保存用户进度
 */
export async function saveUserProgress(username, progress) {
  const payload = {
    username,
    grade: progress.grade || null,
    career_id: progress.careerId || null,
    existing_skills: progress.existingSkills || [],
    completed_tasks: progress.completedTasks || [],
    has_treehole_post: progress.hasTreeholePost || false,
    screen: progress.screen || null,
    updated_at: new Date().toISOString(),
  };

  // 使用 upsert：有则更新，无则插入
  const { error } = await supabase
    .from('user_progress')
    .upsert(payload, { onConflict: 'username' });

  if (error) {
    console.error('保存进度失败:', error);
    return false;
  }
  return true;
}

// ==================== 树洞社区 ====================

/**
 * 获取所有树洞帖子
 */
export async function getTreeholePosts() {
  const { data, error } = await supabase
    .from('treehole_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('获取帖子失败:', error);
    return [];
  }

  return data.map(post => ({
    id: post.id,
    title: post.title,
    content: post.content,
    isAnonymous: post.is_anonymous,
    author: post.author,
    avatar: post.avatar,
    time: post.time,
    likes: post.likes,
    replies: post.replies || [],
  }));
}

/**
 * 发布树洞帖子
 */
export async function createTreeholePost(post) {
  const { error } = await supabase
    .from('treehole_posts')
    .insert([{
      title: post.title,
      content: post.content,
      is_anonymous: post.isAnonymous,
      author: post.author,
      avatar: post.avatar,
      time: post.time,
      likes: 0,
      replies: [],
      created_at: new Date().toISOString(),
    }]);

  if (error) {
    console.error('发布帖子失败:', error);
    return false;
  }

  // 更新用户发帖标记
  if (post.username) {
    await supabase
      .from('user_progress')
      .upsert({ username: post.username, has_treehole_post: true, updated_at: new Date().toISOString() }, { onConflict: 'username' });
  }

  return true;
}

/**
 * 更新帖子（点赞/回复）
 */
export async function updateTreeholePost(postId, updates) {
  const { error } = await supabase
    .from('treehole_posts')
    .update(updates)
    .eq('id', postId);

  if (error) {
    console.error('更新帖子失败:', error);
    return false;
  }
  return true;
}
