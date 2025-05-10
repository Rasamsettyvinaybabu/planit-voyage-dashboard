
import { useEffect, useState } from "react";

type PasswordStrengthProps = {
  password: string;
};

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const [strength, setStrength] = useState<
    "empty" | "weak" | "medium" | "strong"
  >("empty");
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!password) {
      setStrength("empty");
      setScore(0);
      return;
    }

    let newScore = 0;

    // Length check
    if (password.length >= 8) newScore += 1;
    if (password.length >= 12) newScore += 1;

    // Complexity checks
    if (/[A-Z]/.test(password)) newScore += 1;
    if (/[a-z]/.test(password)) newScore += 1;
    if (/[0-9]/.test(password)) newScore += 1;
    if (/[^A-Za-z0-9]/.test(password)) newScore += 1;

    setScore(newScore);

    if (newScore <= 2) setStrength("weak");
    else if (newScore <= 4) setStrength("medium");
    else setStrength("strong");
  }, [password]);

  if (strength === "empty") return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 h-1">
        <div
          className={`h-full flex-1 rounded-full ${
            strength === "weak"
              ? "bg-red-500"
              : strength === "medium"
              ? "bg-yellow-500"
              : "bg-green-500"
          }`}
        ></div>
        <div
          className={`h-full flex-1 rounded-full ${
            strength === "weak"
              ? "bg-gray-200"
              : strength === "medium"
              ? "bg-yellow-500"
              : "bg-green-500"
          }`}
        ></div>
        <div
          className={`h-full flex-1 rounded-full ${
            strength === "weak" || strength === "medium"
              ? "bg-gray-200"
              : "bg-green-500"
          }`}
        ></div>
      </div>
      <p
        className={`text-xs mt-1 ${
          strength === "weak"
            ? "text-red-500"
            : strength === "medium"
            ? "text-yellow-600"
            : "text-green-600"
        }`}
      >
        {strength === "weak"
          ? "Weak password"
          : strength === "medium"
          ? "Medium password"
          : "Strong password"}
      </p>
    </div>
  );
}
