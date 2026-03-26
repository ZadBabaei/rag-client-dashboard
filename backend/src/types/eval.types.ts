export interface EvalTestCase {
  id: string;
  question: string;
  expectedAnswer: string;
  expectedSourceDocuments: string[];
  clientId?: string;
}

export interface EvalResult {
  testCaseId: string;
  question: string;
  generatedAnswer: string;
  expectedAnswer: string;
  retrievedDocuments: string[];
  expectedDocuments: string[];
  metrics: EvalMetrics;
}

export interface EvalMetrics {
  retrievalRecall: number;
  answerAccuracy: number;
  citationFidelity: number;
}

export interface EvalReport {
  timestamp: string;
  totalCases: number;
  results: EvalResult[];
  averageMetrics: EvalMetrics;
}
