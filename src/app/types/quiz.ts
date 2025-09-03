// src/types/quiz.ts

export type QuizQuestion = {
  question: string;
  options: [string, string, string, string];
  answerIndex: 0 | 1 | 2 | 3; // exactly one correct answer
};

export type Quiz = {
  topic: string;
  questions: QuizQuestion[];
};
