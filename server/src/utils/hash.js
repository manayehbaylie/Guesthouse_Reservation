import bcrypt from "bcrypt";

// Hash Password
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Compare Password
export const comparePassword = async (
  password,
  hashedPassword
) => {
  return await bcrypt.compare(
    password,
    hashedPassword
  );
};