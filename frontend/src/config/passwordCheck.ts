export const getPasswordErrors = (password: string | null | undefined) => {
  const errors: string[] = [];
  if (!password) return ["Password is required"];
  if (password.length < 8) errors.push("Password must be at least 8 characters long");
  if (!/[A-Z]/.test(password)) errors.push("An uppercase letter is missing");
  if (!/[a-z]/.test(password)) errors.push("A lowercase letter is missing");
  if (!/[0-9]/.test(password)) errors.push("A number is missing");
  if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
    errors.push("A special character is missing");
  }
  return errors;
};