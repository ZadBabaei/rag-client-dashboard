import testCases from "./testCases.json";
import { answerAccuracy, citationFidelity, retrievalRecall } from "./metrics";
import { embedText } from "../services/embedding.service";
import { assembleContext, generate, parseCitations } from "../services/llm.service";
import { searchSimilar } from "../services/vectorSearch.service";
import type { EvalResult, EvalTestCase } from "../types/eval.types";

const NO_INFO_MESSAGE = "I couldn't find any relevant information in the documents to answer your question.";

interface EvalRunResult {
  results: EvalResult[];
  averages: {
    retrievalRecall: number;
    answerAccuracy: number;
    citationFidelity: number;
  };
}

function roundMetric(value: number): number {
  return Number(value.toFixed(3));
}

export async function runEval(): Promise<EvalRunResult> {
  const results: EvalResult[] = [];

  for (const [index, testCase] of (testCases as EvalTestCase[]).entries()) {
    const normalizedQuestion = testCase.question.trim();
    const embedding = await embedText(normalizedQuestion);
    const chunks = await searchSimilar(embedding, {
      clientId: typeof testCase.clientId === "string" && testCase.clientId.trim().length > 0 ? testCase.clientId : undefined,
      limit: 10,
    });

    const answer =
      chunks.length === 0 || chunks.every((chunk) => chunk.similarity < 0.3)
        ? NO_INFO_MESSAGE
        : await generate(assembleContext(chunks, normalizedQuestion));

    const citations = parseCitations(answer);
    const retrievedDocuments = [...new Set(chunks.map((chunk) => chunk.documentName))];

    const metrics = {
      retrievalRecall: roundMetric(retrievalRecall(retrievedDocuments, testCase.expectedSourceDocuments)),
      answerAccuracy: roundMetric(await answerAccuracy(answer, testCase.expectedAnswer)),
      citationFidelity: roundMetric(citationFidelity(citations, chunks.map((chunk) => chunk.documentName))),
    };

    results.push({
      testCaseId: testCase.id || `case-${index + 1}`,
      question: testCase.question,
      generatedAnswer: answer,
      expectedAnswer: testCase.expectedAnswer,
      retrievedDocuments,
      expectedDocuments: testCase.expectedSourceDocuments,
      metrics,
    });
  }

  const averages = results.reduce(
    (accumulator, result) => ({
      retrievalRecall: accumulator.retrievalRecall + result.metrics.retrievalRecall,
      answerAccuracy: accumulator.answerAccuracy + result.metrics.answerAccuracy,
      citationFidelity: accumulator.citationFidelity + result.metrics.citationFidelity,
    }),
    { retrievalRecall: 0, answerAccuracy: 0, citationFidelity: 0 },
  );

  const normalizedAverages = {
    retrievalRecall: roundMetric(averages.retrievalRecall / results.length),
    answerAccuracy: roundMetric(averages.answerAccuracy / results.length),
    citationFidelity: roundMetric(averages.citationFidelity / results.length),
  };

  console.table(
    results.map((result) => ({
      testCaseId: result.testCaseId,
      retrievalRecall: result.metrics.retrievalRecall,
      answerAccuracy: result.metrics.answerAccuracy,
      citationFidelity: result.metrics.citationFidelity,
    })),
  );

  return {
    results,
    averages: normalizedAverages,
  };
}

if (require.main === module) {
  void runEval()
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
