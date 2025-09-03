
export type QuizQuestion = {
  question: string;
  options: [string, string, string, string];
  answerIndex: 0 | 1 | 2 | 3; 
};

export type Quiz = {
  topic: string;
  questions: QuizQuestion[];
};
