export type FieldErrors<T extends string> = Partial<Record<T, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(input: {
  email: string;
  password: string;
}): FieldErrors<"email" | "password"> {
  const errors: FieldErrors<"email" | "password"> = {};
  const email = input.email.trim();

  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(email.toLowerCase())) {
    errors.email = "Enter a valid email address.";
  }

  if (!input.password) {
    errors.password = "Password is required.";
  }

  return errors;
}

export function validateRegister(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): FieldErrors<"name" | "email" | "password" | "confirmPassword"> {
  const errors: FieldErrors<"name" | "email" | "password" | "confirmPassword"> =
    {};
  const name = input.name.trim();
  const email = input.email.trim();

  if (!name) {
    errors.name = "Name is required.";
  } else if (name.length < 2) {
    errors.name = "Name must be at least 2 characters.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(email.toLowerCase())) {
    errors.email = "Enter a valid email address.";
  }

  if (!input.password) {
    errors.password = "Password is required.";
  } else if (input.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  } else if (input.password.length > 72) {
    errors.password = "Password must be at most 72 characters.";
  }

  if (!input.confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (input.confirmPassword !== input.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export function hasFieldErrors<T extends string>(errors: FieldErrors<T>): boolean {
  return Object.keys(errors).length > 0;
}
