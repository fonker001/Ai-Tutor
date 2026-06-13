import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  loadDatabase,
  saveDatabase,
  getUserByEmail,
  getUserById,
  registerUser,
  verifyUser,
  updateUserProfile,
  getLearningPaths,
  saveLearningPath,
  getForumPosts,
  addForumPost,
  addForumComment,
  likeForumPost,
  getAllUsers,
  deleteUser,
  deleteForumPost,
  deleteForumComment,
  updatePassword
} from './src/server/db.js';
import { generatePersonalizedPath, gradeAssignment, chatWithTutor, generateExamPaper, gradeExamPaper } from './src/server/ai.js';
import { LearningPath, PathNode, ForumPost, ForumComment } from './src/types.js';

// Load our encrypted local database state
loadDatabase();

const app = express();
const PORT = 3000;

app.use(express.json());

// 1. AUTH API ROUTES
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'All parameters (email, password, name) are required.' });
  }
  try {
    const user = registerUser(email, password, name);
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Both email and password are required.' });
  }
  const user = verifyUser(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  res.json({ success: true, user });
});

app.get('/api/auth/user/:id', (req, res) => {
  const user = getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User profile not found.' });
  res.json({ user });
});

app.post('/api/auth/profile/update', (req, res) => {
  const { userId, updates } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required.' });
  try {
    const user = updateUserProfile(userId, updates);
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PASSWORD RESET API
app.post('/api/auth/reset-password', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Both registered email and new password are required.' });
  }
  try {
    const user = getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'This email is not registered in Aegis Socratic database.' });
    }
    updatePassword(email, password);
    res.json({ success: true, message: 'Password has been safely modified.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Password reset failed.' });
  }
});

// SITE ADMINISTRATIVE CONTROL APIS
app.get('/api/admin/users', (req, res) => {
  const adminId = req.headers['x-admin-userid'] || req.query.adminUserId;
  if (!adminId) {
    return res.status(401).json({ error: 'Unauthorized. Admin ID is required.' });
  }
  const adminUserProfile = getUserById(String(adminId));
  if (!adminUserProfile || adminUserProfile.role !== 'Admin') {
    return res.status(403).json({ error: 'Forbidden. Access requires admin credentials.' });
  }
  res.json({ users: getAllUsers() });
});

app.delete('/api/admin/user/:userIdToDelete', (req, res) => {
  const { adminUserId } = req.body;
  const { userIdToDelete } = req.params;
  if (!adminUserId) {
    return res.status(401).json({ error: 'Admin identifier is required.' });
  }
  const adminUserProfile = getUserById(adminUserId);
  if (!adminUserProfile || adminUserProfile.role !== 'Admin') {
    return res.status(403).json({ error: 'Forbidden. Access requires admin credentials.' });
  }
  try {
    deleteUser(userIdToDelete);
    res.json({ success: true, message: 'Student profile, credentials, and threads deleted.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to remove user.' });
  }
});

app.delete('/api/admin/forum/:postId', (req, res) => {
  const adminId = req.headers['x-admin-userid'] || req.query.adminUserId;
  const { postId } = req.params;
  if (!adminId) {
    return res.status(401).json({ error: 'Admin identifier is required.' });
  }
  const adminUserProfile = getUserById(String(adminId));
  if (!adminUserProfile || adminUserProfile.role !== 'Admin') {
    return res.status(403).json({ error: 'Forbidden. Access requires admin credentials.' });
  }
  deleteForumPost(postId);
  res.json({ success: true, message: 'Post successfully deleted.' });
});

app.delete('/api/admin/forum/:postId/comment/:commentId', (req, res) => {
  const adminId = req.headers['x-admin-userid'] || req.query.adminUserId;
  const { postId, commentId } = req.params;
  if (!adminId) {
    return res.status(401).json({ error: 'Admin identifier is required.' });
  }
  const adminUserProfile = getUserById(String(adminId));
  if (!adminUserProfile || adminUserProfile.role !== 'Admin') {
    return res.status(403).json({ error: 'Forbidden. Access requires admin credentials.' });
  }
  deleteForumComment(postId, commentId);
  res.json({ success: true, message: 'Comment successfully deleted.' });
});

app.post('/api/admin/user/:targetUserId/reset-password', (req, res) => {
  const { adminUserId, newPassword } = req.body;
  const { targetUserId } = req.params;
  if (!adminUserId || !newPassword) {
    return res.status(400).json({ error: 'Missing admin identity or new password.' });
  }
  const adminUserProfile = getUserById(adminUserId);
  if (!adminUserProfile || adminUserProfile.role !== 'Admin') {
    return res.status(403).json({ error: 'Forbidden. Access requires admin credentials.' });
  }
  const student = getUserById(targetUserId);
  if (!student) {
    return res.status(404).json({ error: 'Target student not found.' });
  }
  try {
    updatePassword(student.email, newPassword);
    res.json({ success: true, message: `Password for ${student.name} reset successfully.` });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to reset password.' });
  }
});

// 2. LEARNING PATH API ROUTES
app.get('/api/learning-path/:userId', (req, res) => {
  const paths = getLearningPaths(req.params.userId);
  res.json({ paths });
});

app.post('/api/learning-path/generate', async (req, res) => {
  const { userId, subject, gradeLevel, learningStyle, targetExam, background } = req.body;
  if (!userId || !subject || !gradeLevel || !learningStyle) {
    return res.status(400).json({ error: 'Missing learning preference criteria.' });
  }

  try {
    const user = getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // AI dynamic roadmap node generation
    const generatedNodes = await generatePersonalizedPath(
      subject,
      gradeLevel,
      learningStyle,
      targetExam,
      background
    );

    // Map AI response into PathNode representation
    const nodes: PathNode[] = generatedNodes.map((n: any, index: number) => ({
      id: `node-${Date.now()}-${index}`,
      title: n.title,
      description: n.description,
      section: n.section || 'General Topics',
      order: index + 1,
      content: n.content,
      quiz: n.quiz.map((q: any, qi: number) => ({
        id: `q-${Date.now()}-${index}-${qi}`,
        questionText: q.questionText,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        explanation: q.explanation
      })),
      assignment: {
        prompt: n.assignmentPrompt || 'Discuss how these core learnings can be applied to solve an industry case study.'
      },
      isUnlocked: index === 0, // Unlock the first module initially
      isCompleted: false
    }));

    const pathObj: LearningPath = {
      id: `path-${Date.now()}`,
      userId,
      subject,
      targetExam,
      gradeLevel,
      learningStyle,
      nodes,
      createdAt: new Date().toISOString()
    };

    saveLearningPath(userId, pathObj);
    res.json({ success: true, path: pathObj });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Generation failed.' });
  }
});

// COMPLETE A NODE
app.post('/api/learning-path/complete-node', (req, res) => {
  const { userId, pathId, nodeId } = req.body;
  const paths = getLearningPaths(userId);
  const pathObj = paths.find(p => p.id === pathId);

  if (!pathObj) return res.status(404).json({ error: 'Learning path not found.' });
  const node = pathObj.nodes.find(n => n.id === nodeId);
  if (!node) return res.status(404).json({ error: 'Node not found.' });

  if (!node.isCompleted) {
    node.isCompleted = true;

    // Unlock subsequent node
    const nextNode = pathObj.nodes.find(n => n.order === node.order + 1);
    if (nextNode) {
      nextNode.isUnlocked = true;
    }

    // Award XP
    const user = getUserById(userId);
    if (user) {
      user.userStats.totalXP += 150; // XP per lesson node completion

      // Adjust active Streak
      const todaySlug = new Date().toISOString().split('T')[0];
      if (user.userStats.lastStudyDate !== todaySlug) {
        user.userStats.learningStreak += 1;
        user.userStats.lastStudyDate = todaySlug;
      }
      // Record minutes spent
      user.userStats.studyMinutesByDay[todaySlug] = (user.userStats.studyMinutesByDay[todaySlug] || 0) + 15;
      updateUserProfile(userId, { userStats: user.userStats });
    }

    saveLearningPath(userId, pathObj);
  }

  res.json({ success: true, path: pathObj, user: getUserById(userId) });
});

// SCORE QUIZ
app.post('/api/learning-path/quiz-score', (req, res) => {
  const { userId, pathId, nodeId, score } = req.body;
  const paths = getLearningPaths(userId);
  const pathObj = paths.find(p => p.id === pathId);

  if (!pathObj) return res.status(404).json({ error: 'Learning path not found.' });
  const node = pathObj.nodes.find(n => n.id === nodeId);
  if (!node) return res.status(404).json({ error: 'Node not found.' });

  node.quizScore = score;
  
  const user = getUserById(userId);
  if (user) {
    user.userStats.totalQuizzesTaken += 1;
    // Calculate new average
    const pathsOfUser = getLearningPaths(userId);
    const completedQuizzes = pathsOfUser.flatMap(p => p.nodes).filter(n => n.quizScore !== undefined);
    const sumScore = completedQuizzes.reduce((acc, curr) => acc + (curr.quizScore || 0), 0);
    user.userStats.averageQuizScore = Math.round(sumScore / completedQuizzes.length);

    // Award XP based on accuracy
    user.userStats.totalXP += score * 2 + 50; // Points scaling with accuracy
    updateUserProfile(userId, { userStats: user.userStats });
  }

  saveLearningPath(userId, pathObj);
  res.json({ success: true, path: pathObj, user: getUserById(userId) });
});

// SUBMIT ASSIGNMENT & CALL TUTOR EVALUATION
app.post('/api/assignment/grade', async (req, res) => {
  const { userId, pathId, nodeId, submission } = req.body;
  if (!userId || !pathId || !nodeId || !submission) {
    return res.status(400).json({ error: 'Missing feedback inputs.' });
  }

  const paths = getLearningPaths(userId);
  const pathObj = paths.find(p => p.id === pathId);
  if (!pathObj) return res.status(404).json({ error: 'Learning path not found.' });

  const node = pathObj.nodes.find(n => n.id === nodeId);
  if (!node) return res.status(404).json({ error: 'Node not found.' });

  try {
    // Generate tutor evaluation
    const review = await gradeAssignment(node.assignment.prompt, submission, pathObj.learningStyle);

    node.assignment.submission = submission;
    node.assignment.grade = review.grade;
    node.assignment.feedback = review.feedback;
    node.assignment.submittedAt = new Date().toISOString();

    // Reward XP for homework effort
    const user = getUserById(userId);
    if (user) {
      user.userStats.totalXP += 250;
      updateUserProfile(userId, { userStats: user.userStats });
    }

    saveLearningPath(userId, pathObj);
    res.json({ success: true, path: pathObj, grade: review.grade, feedback: review.feedback, user: getUserById(userId) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'HW evaluation failed.' });
  }
});

// 3. SECURE FORUM API ROUTES
app.get('/api/forum', (req, res) => {
  res.json({ posts: getForumPosts() });
});

app.post('/api/forum', (req, res) => {
  const { userId, title, content, subjectTag } = req.body;
  if (!userId || !title || !content) {
    return res.status(400).json({ error: 'ID, Thread Title, and content are required.' });
  }

  const user = getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const newPost: ForumPost = {
    id: `post-${Date.now()}`,
    title,
    content,
    subjectTag: subjectTag || 'General Discussions',
    authorId: userId,
    authorName: user.name,
    authorRole: 'Student',
    authorSchool: user.school,
    timestamp: new Date().toISOString(),
    likes: 0,
    likedBy: [],
    comments: []
  };

  addForumPost(newPost);
  res.json({ success: true, post: newPost });
});

app.post('/api/forum/:postId/comment', (req, res) => {
  const { userId, content } = req.body;
  const { postId } = req.params;

  if (!userId || !content) {
    return res.status(400).json({ error: 'Commenter and body content are required.' });
  }

  const user = getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User profile not found.' });

  const newComment: ForumComment = {
    id: `comment-${Date.now()}`,
    authorId: userId,
    authorName: user.name,
    authorRole: 'Student', // Standard students commenting
    authorSchool: user.school,
    content,
    timestamp: new Date().toISOString()
  };

  addForumComment(postId, newComment);
  res.json({ success: true, comment: newComment });
});

app.post('/api/forum/:postId/like', (req, res) => {
  const { userId } = req.body;
  const { postId } = req.params;
  if (!userId) return res.status(400).json({ error: 'User ID required to hit like.' });

  const likes = likeForumPost(postId, userId);
  res.json({ success: true, likes });
});

// 4. TUTOR CHAT ENDPOINT
app.post('/api/tutor/chat', async (req, res) => {
  const { userId, messages, subject, learningStyle } = req.body;
  if (!userId || !messages) return res.status(400).json({ error: 'UserId and messages context are required.' });

  const user = getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  try {
    const aiAnswer = await chatWithTutor(messages, {
      name: user.name,
      learningStyle: learningStyle || 'Practical',
      subject: subject || 'General subjects'
    });
    res.json({ success: true, text: aiAnswer });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4.5 EXAM PREP SUITE ROUTES
app.post('/api/exam/generate', async (req, res) => {
  const { userId, subject, examType, learningStyle, background } = req.body;
  if (!userId || !subject) {
    return res.status(400).json({ error: 'Missing userId or subject for exam generation.' });
  }

  try {
    const paper = await generateExamPaper(subject, examType || 'Practice Exam Challenge', learningStyle || 'Practical', background || '');
    res.json({ success: true, exam: paper });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Exam generation failed.' });
  }
});

app.post('/api/exam/grade', async (req, res) => {
  const { userId, subject, examType, essayAnswer, multipleChoiceScore, mcTotal, originalPaperJson } = req.body;
  if (!userId || !essayAnswer || originalPaperJson === undefined) {
    return res.status(400).json({ error: 'Missing parameters for exam grading.' });
  }

  try {
    const result = await gradeExamPaper(
      subject || 'General Topics',
      examType || 'Practice Exam',
      essayAnswer,
      multipleChoiceScore || 0,
      mcTotal || 3,
      originalPaperJson
    );

    // Reward XP for completing an entire exam paper
    const user = getUserById(userId);
    if (user) {
      user.userStats.totalXP += 400; // Large reward for full exam prep suite runs
      user.userStats.totalQuizzesTaken += 1;
      updateUserProfile(userId, { userStats: user.userStats });
    }

    res.json({ success: true, result, user: getUserById(userId) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Exam grading failed.' });
  }
});

// 5. OFFLINE SYNC ENDPOINT
app.post('/api/sync', (req, res) => {
  const { userId, offlineCompletedNodeIds, offlineQuizScores, offlineAssignments } = req.body;
  if (!userId) return res.status(400).json({ error: 'UserId required.' });

  const user = getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const paths = getLearningPaths(userId);
  let updatedAny = false;

  if (paths.length > 0) {
    const mainPath = paths[0]; // Sync onto the first path for simplicity

    // Mark nodes completed
    if (offlineCompletedNodeIds && Array.isArray(offlineCompletedNodeIds)) {
      offlineCompletedNodeIds.forEach(nodeId => {
        const node = mainPath.nodes.find(n => n.id === nodeId);
        if (node && !node.isCompleted) {
          node.isCompleted = true;
          user.userStats.totalXP += 150;
          updatedAny = true;

          // Unlock subsequent order
          const nextN = mainPath.nodes.find(n => n.order === node.order + 1);
          if (nextN) nextN.isUnlocked = true;
        }
      });
    }

    // Capture quiz scores completed offline
    if (offlineQuizScores && Array.isArray(offlineQuizScores)) {
      offlineQuizScores.forEach(item => {
        const node = mainPath.nodes.find(n => n.id === item.nodeId);
        if (node && node.quizScore === undefined) {
          node.quizScore = item.score;
          user.userStats.totalQuizzesTaken += 1;
          user.userStats.totalXP += item.score * 2 + 50;
          updatedAny = true;
        }
      });
    }

    // Capture assignments completed offline
    if (offlineAssignments && Array.isArray(offlineAssignments)) {
      offlineAssignments.forEach(item => {
        const node = mainPath.nodes.find(n => n.id === item.nodeId);
        if (node && !node.assignment.submission) {
          node.assignment.submission = item.submission;
          node.assignment.submittedAt = item.submittedAt || new Date().toISOString();
          node.assignment.grade = '85/100 (Synced)';
          node.assignment.feedback = 'Assessed under offline synchronization. Great initiative preparing this answer while disconnected!';
          user.userStats.totalXP += 200;
          updatedAny = true;
        }
      });
    }

    if (updatedAny) {
      // Re-evaluate average score
      const quizzes = mainPath.nodes.filter(n => n.quizScore !== undefined);
      if (quizzes.length > 0) {
        user.userStats.averageQuizScore = Math.round(
          quizzes.reduce((acc, c) => acc + (c.quizScore || 0), 0) / quizzes.length
        );
      }

      // Update study activity metrics
      const todaySlug = new Date().toISOString().split('T')[0];
      user.userStats.studyMinutesByDay[todaySlug] = (user.userStats.studyMinutesByDay[todaySlug] || 0) + 20;
      updateUserProfile(userId, { userStats: user.userStats });
      saveLearningPath(userId, mainPath);
    }
  }

  res.json({ success: true, user: getUserById(userId), paths: getLearningPaths(userId), updated: updatedAny });
});

// Configure Vite middleware in development or express static build in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Aegis Full-Stack Server] loaded and running on http://localhost:${PORT}`);
  });
}

startServer();
