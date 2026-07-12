import bcrypt from "bcrypt";
import crypto from "crypto";

const addPepper = (password: string) => {
  const pepper = process.env.PASSWORD_PEPPER;
  if (!pepper) throw new Error("No PASSWORD_PEPPER is in .env");
  return crypto.createHmac("sha256", pepper).update(password).digest("hex");
};

/**
 * Can increase salt for more safety but 10 already runs kinda slow
 */
export const hashPw = async (password: string) => {
  //   const startTime = performance.now();
  const pepperPw = addPepper(password);
  const pw = await bcrypt.hash(pepperPw, 10);
  //   const endTime = performance.now();
  //   console.log(endTime - startTime);
  return pw;
};

export const verifyPw = async (password: string, hash: string) => {
  //   const startTime = performance.now();
  const pepperPw = addPepper(password);
  const match = await bcrypt.compare(pepperPw, hash);
  //   const endTime = performance.now();
  //   console.log(endTime - startTime);
  return match;
};
