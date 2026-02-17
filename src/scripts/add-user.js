import { hashPassword, validatePassword } from "../auth/password.js";
import { addUser } from "../auth/userStore.js";

const args = process.argv.slice(2);

const readArg = (flag) => {
  const index = args.indexOf(flag);
  if (index === -1) return "";
  return args[index + 1] || "";
};

const email = readArg("--email") || readArg("--username");
const password = readArg("--password");
const name = readArg("--name");

if (!email || !password) {
  console.error(
    "วิธีใช้: npm run add-user -- --email user@example.com --password YourPassword --name \"Display Name\""
  );
  process.exit(1);
}

const passwordError = validatePassword(password);
if (passwordError) {
  console.error(passwordError);
  process.exit(1);
}

try {
  const passwordHash = hashPassword(password);
  const user = await addUser({
    email,
    name,
    password: passwordHash
  });
  console.log(`เพิ่มผู้ใช้สำเร็จ: ${user.email}`);
} catch (error) {
  console.error(error?.message || "เพิ่มผู้ใช้ไม่สำเร็จ");
  process.exit(1);
}
