import { randomUUID } from "crypto";
import { access, mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configuredUsersFilePath = String(process.env.AUTH_USERS_FILE_PATH || "").trim();
const isVercelRuntime = process.env.VERCEL === "1";
const defaultUsersDataDir = isVercelRuntime ? "/tmp/ppade-data" : path.join(__dirname, "..", "data");
const usersDataDir = configuredUsersFilePath
  ? path.dirname(configuredUsersFilePath)
  : defaultUsersDataDir;
export const usersFilePath = configuredUsersFilePath || path.join(usersDataDir, "users.json");

let writeQueue = Promise.resolve();

export const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

const ensureUsersFile = async () => {
  await mkdir(usersDataDir, { recursive: true });
  try {
    await access(usersFilePath);
  } catch {
    await writeFile(usersFilePath, "[]\n", "utf8");
  }
};

const parseUsers = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const readUsers = async () => {
  await ensureUsersFile();
  const raw = await readFile(usersFilePath, "utf8");
  return parseUsers(raw);
};

const writeUsers = async (users) => {
  await writeFile(usersFilePath, `${JSON.stringify(users, null, 2)}\n`, "utf8");
};

const queueWrite = (fn) => {
  writeQueue = writeQueue.then(fn, fn);
  return writeQueue;
};

export const sanitizeUser = (user) => {
  if (!user) return null;
  const email = normalizeEmail(user.email || user.username);
  return {
    id: user.id,
    email,
    name: user.name || email
  };
};

export const getUserByEmail = async (email) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const users = await readUsers();
  return users.find((user) => normalizeEmail(user.email) === normalized) || null;
};

export const addUser = async ({ email, name, password }) =>
  queueWrite(async () => {
    const normalized = normalizeEmail(email);
    if (!normalized) {
      throw new Error("อีเมลไม่ถูกต้อง");
    }
    const users = await readUsers();
    const exists = users.some((user) => normalizeEmail(user.email) === normalized);
    if (exists) {
      throw new Error("อีเมลนี้มีอยู่แล้ว");
    }
    const now = new Date().toISOString();
    const nextUser = {
      id: randomUUID(),
      email: normalized,
      name: String(name || "").trim() || normalized,
      password,
      createdAt: now,
      updatedAt: now
    };
    users.push(nextUser);
    await writeUsers(users);
    return nextUser;
  });

export const updatePasswordForUserId = async (userId, password) =>
  queueWrite(async () => {
    const users = await readUsers();
    const index = users.findIndex((user) => user.id === userId);
    if (index === -1) return null;
    users[index] = {
      ...users[index],
      password,
      updatedAt: new Date().toISOString()
    };
    await writeUsers(users);
    return users[index];
  });
