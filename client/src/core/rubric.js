export const rubric = ['I used the phrase in the correct form.', 'The grammar of my sentence is clean.', 'The phrase sounds natural in this context.'];
export function passedGrade(grade) { return grade.usesItemCorrectly && grade.grammarOk && grade.natural; }
