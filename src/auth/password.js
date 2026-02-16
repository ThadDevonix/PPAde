import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

const defaultIterations = 120000;
const defaultKeyLength = 64;
const defaultDigest = "sha512";

export const hashPassword = (password) => {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(
    password,
    salt,
    defaultIterations,
    defaultKeyLength,
    defaultDigest
  ).toString("hex");

  return {
    salt,
    hash,
    iterations: defaultIterations,
    keyLength: defaultKeyLength,
    digest: defaultDigest
  };
};

export const verifyPassword = (password, storedPassword) => {
  if (!storedPassword || typeof storedPassword !== "object") return false;
  const salt = storedPassword.salt;
  const hash = storedPassword.hash;
  const iterations = Number(storedPassword.iterations) || defaultIterations;
  const keyLength = Number(storedPassword.keyLength) || defaultKeyLength;
  const digest = storedPassword.digest || defaultDigest;

  if (!salt || !hash) return false;

  const computed = pbkdf2Sync(password, salt, iterations, keyLength, digest).toString("hex");
  const hashBuffer = Buffer.from(hash, "hex");
  const computedBuffer = Buffer.from(computed, "hex");
  if (hashBuffer.length !== computedBuffer.length) return false;
  return timingSafeEqual(hashBuffer, computedBuffer);
};

export const validatePassword = (password) => {
  if (typeof password !== "string") return "กรุณากรอกรหัสผ่าน";
  if (password.length < 8) return "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
  return "";
};
