import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { extractFamilyName } from "./students";

type StudentDataEntry = {
  profile: {
    fullName: string;
  };
};

describe("生徒データ", () => {
  it("全生徒の姓ヒントがフルネームと異なる", () => {
    const studentsPath = path.resolve(process.cwd(), "data/students.json");
    const students = JSON.parse(readFileSync(studentsPath, "utf-8")) as Record<
      string,
      StudentDataEntry
    >;

    for (const [studentId, entry] of Object.entries(students)) {
      const { fullName } = entry.profile;
      expect(extractFamilyName(fullName), `${studentId}: ${fullName}`).not.toBe(fullName);
    }
  });
});
