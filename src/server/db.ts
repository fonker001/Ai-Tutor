import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { UserProfile, LearningPath, ForumPost, UserStats } from '../types.js';

// Encrypted Database Configuration
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'encrypted_db.bin');
// In a production server, this key would be specified via process.env.DB_ENCRYPTION_KEY.
// We fallback to a stable server-side secret key to prevent loss of keys between dev restarts.
const ENCRYPTION_KEY = Buffer.from((process.env.DB_ENCRYPTION_KEY || 'aegis_super_secure_32_byte_key_99').substring(0, 32));
const IV_LENGTH = 16; // AES block size

// In-Memory Database State
interface DatabaseState {
  users: { [id: string]: UserProfile };
  credentials: { [email: string]: { id: string; passwordHash: string; salt: string } };
  learningPaths: { [userId: string]: LearningPath[] };
  forumPosts: ForumPost[];
}

let dbState: DatabaseState = {
  users: {},
  credentials: {},
  learningPaths: {},
  forumPosts: [],
};

// Helper: Secure Password Hashing
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// Helper: AES-256-CBC Encryption
function encrypt(text: string): Buffer {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return Buffer.concat([iv, encrypted]);
}

// Helper: AES-256-CBC Decryption
function decrypt(buffer: Buffer): string {
  const iv = buffer.subarray(0, IV_LENGTH);
  const encryptedText = buffer.subarray(IV_LENGTH);
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}

// Persist State to Disk (Encrypted)
export function saveDatabase() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const plainText = JSON.stringify(dbState);
    const encryptedData = encrypt(plainText);
    fs.writeFileSync(DB_FILE, encryptedData);
  } catch (error) {
    console.error('Failed to encrypt and save local database state:', error);
  }
}

// Load State from Disk (Decrypt)
export function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const encryptedData = fs.readFileSync(DB_FILE);
      const decryptedString = decrypt(encryptedData);
      dbState = JSON.parse(decryptedString);
      console.log('Database decrypted and loaded successfully. Record Counts:', {
        users: Object.keys(dbState.users).length,
        learningPaths: Object.values(dbState.learningPaths).flat().length,
        forumPosts: dbState.forumPosts.length,
      });
    } else {
      console.log('No existing encrypted database found. Initializing seed data.');
      initializeSeedData();
    }
  } catch (error) {
    console.error('Failed to decrypt local database or formatting error. Reinitializing...', error);
    initializeSeedData();
  }

  // GUARANTEE Admin and Demo account credentials are valid and pre-seeded
  ensureUserExists('admin@aegis.edu', 'admin123', 'Aegis Admin', 'Admin', 'admin');
  ensureUserExists('demo@aegis.edu', 'password123', 'Demo Student', 'Student', 'student');
}

// Ensure a user exists with matching login keys
function ensureUserExists(email: string, passwordPlain: string, name: string, role: 'Admin' | 'Student', avatarSeed: string) {
  const normalized = email.toLowerCase().trim();
  const salt = dbState.credentials[normalized]?.salt || crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(passwordPlain, salt);
  const existingCred = dbState.credentials[normalized];
  
  let userId = existingCred?.id;
  if (!userId) {
    userId = role === 'Admin' ? 'user-admin-main' : 'user-demo-student';
  }

  dbState.credentials[normalized] = {
    id: userId,
    passwordHash,
    salt,
  };

  if (!dbState.users[userId]) {
    dbState.users[userId] = {
      id: userId,
      email: normalized,
      name,
      school: role === 'Admin' ? 'Aegis HQ' : 'Aegis Academy',
      avatarSeed,
      background: role === 'Admin' 
        ? 'Main site administrator for Aegis Academy Socratic learning platforms.'
        : 'Returning adult learner returning to tech. I struggle with recursion but love visual flowcharts.',
      preferredTheme: 'slate',
      fontSize: 'normal',
      role,
      userStats: {
        learningStreak: 3,
        lastStudyDate: new Date().toISOString().split('T')[0],
        totalXP: role === 'Admin' ? 9999 : 350,
        totalQuizzesTaken: role === 'Admin' ? 0 : 2,
        averageQuizScore: role === 'Admin' ? 0 : 85,
        studyMinutesByDay: {
          [new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0]]: 25,
          [new Date(Date.now() - 86400000).toISOString().split('T')[0]]: 40,
          [new Date().toISOString().split('T')[0]]: 15,
        },
      },
    };
  } else {
    dbState.users[userId].email = normalized;
    dbState.users[userId].role = role;
  }

  if (!dbState.learningPaths[userId]) {
    dbState.learningPaths[userId] = [];
  }

  saveDatabase();
}

// Pre-populate with default seed data
function initializeSeedData() {
  dbState = {
    users: {},
    credentials: {},
    learningPaths: {},
    forumPosts: [],
  };
  saveDatabase();
}

// Database Getters & Setters
export function getUserByEmail(email: string): UserProfile | null {
  const normalized = email.toLowerCase().trim();
  const cred = dbState.credentials[normalized];
  if (!cred) return null;
  return dbState.users[cred.id] || null;
}

export function getUserById(id: string): UserProfile | null {
  return dbState.users[id] || null;
}

export function registerUser(email: string, passwordPlain: string, name: string): UserProfile {
  const normalized = email.toLowerCase().trim();
  if (dbState.credentials[normalized]) {
    throw new Error('User email already exists.');
  }

  const userId = 'user-' + crypto.randomUUID();
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(passwordPlain, salt);

  dbState.credentials[normalized] = {
    id: userId,
    passwordHash,
    salt,
  };

  const newUser: UserProfile = {
    id: userId,
    email: normalized,
    name,
    school: 'Aegis Academy',
    avatarSeed: name.split(' ')[0].toLowerCase() || 'student',
    preferredTheme: 'slate',
    fontSize: 'normal',
    userStats: {
      learningStreak: 1,
      totalXP: 100,
      totalQuizzesTaken: 0,
      averageQuizScore: 0,
      studyMinutesByDay: {},
    },
  };

  dbState.users[userId] = newUser;
  saveDatabase();
  return newUser;
}

export function verifyUser(email: string, passwordPlain: string): UserProfile | null {
  const normalized = email.toLowerCase().trim();
  const cred = dbState.credentials[normalized];
  if (!cred) return null;

  const currentHash = hashPassword(passwordPlain, cred.salt);
  if (currentHash === cred.passwordHash) {
    return dbState.users[cred.id] || null;
  }
  return null;
}

export function updateUserProfile(userId: string, updates: Partial<UserProfile>): UserProfile {
  const user = dbState.users[userId];
  if (!user) throw new Error('User not found.');

  dbState.users[userId] = {
    ...user,
    ...updates,
    userStats: {
      ...user.userStats,
      ...(updates.userStats || {}),
    },
  };

  saveDatabase();
  return dbState.users[userId];
}

export function getLearningPaths(userId: string): LearningPath[] {
  return dbState.learningPaths[userId] || [];
}

export function saveLearningPath(userId: string, pathObj: LearningPath) {
  if (!dbState.learningPaths[userId]) {
    dbState.learningPaths[userId] = [];
  }
  const idx = dbState.learningPaths[userId].findIndex((p) => p.id === pathObj.id);
  if (idx !== -1) {
    dbState.learningPaths[userId][idx] = pathObj;
  } else {
    dbState.learningPaths[userId].push(pathObj);
  }
  saveDatabase();
}

export function getForumPosts(): ForumPost[] {
  return dbState.forumPosts;
}

export function addForumPost(post: ForumPost) {
  dbState.forumPosts.unshift(post);
  saveDatabase();
}

export function addForumComment(postId: string, comment: any) {
  const post = dbState.forumPosts.find((p) => p.id === postId);
  if (post) {
    post.comments.push(comment);
    saveDatabase();
  }
}

export function likeForumPost(postId: string, userId: string): number {
  const post = dbState.forumPosts.find((p) => p.id === postId);
  if (post) {
    const idx = post.likedBy.indexOf(userId);
    if (idx === -1) {
      post.likedBy.push(userId);
      post.likes += 1;
    } else {
      post.likedBy.splice(idx, 1);
      post.likes -= 1;
    }
    saveDatabase();
    return post.likes;
  }
  return 0;
}

export function getAllUsers(): UserProfile[] {
  return Object.values(dbState.users);
}

export function deleteUser(userId: string) {
  const user = dbState.users[userId];
  if (user) {
    if (user.role === 'Admin') {
      throw new Error('Cannot delete administrative accounts.');
    }
    const emailNormalized = user.email.toLowerCase().trim();
    delete dbState.users[userId];
    delete dbState.credentials[emailNormalized];
    // Clean up student learning paths
    delete dbState.learningPaths[userId];
    
    // Also strip forum references
    dbState.forumPosts = dbState.forumPosts.filter(p => p.authorId !== userId);
    dbState.forumPosts.forEach(post => {
      post.comments = post.comments.filter(c => c.authorId !== userId);
    });
    
    saveDatabase();
  }
}

export function deleteForumPost(postId: string) {
  const index = dbState.forumPosts.findIndex(p => p.id === postId);
  if (index !== -1) {
    dbState.forumPosts.splice(index, 1);
    saveDatabase();
  }
}

export function deleteForumComment(postId: string, commentId: string) {
  const post = dbState.forumPosts.find(p => p.id === postId);
  if (post) {
    post.comments = post.comments.filter(c => c.id !== commentId);
    saveDatabase();
  }
}

export function updatePassword(email: string, passwordPlain: string) {
  const normalized = email.toLowerCase().trim();
  const cred = dbState.credentials[normalized];
  if (!cred) {
    throw new Error('No account found under that email address.');
  }
  const newSalt = crypto.randomBytes(16).toString('hex');
  const newHash = hashPassword(passwordPlain, newSalt);
  dbState.credentials[normalized] = {
    ...cred,
    passwordHash: newHash,
    salt: newSalt
  };
  saveDatabase();
}
