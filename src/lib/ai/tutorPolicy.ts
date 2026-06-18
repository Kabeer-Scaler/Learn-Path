import type { Concept, LessonContent } from "@/lib/types";

export type TutorStrategy = "guiding_question" | "hint" | "explanation";

const GIVE_UP_PATTERN =
  /give up|i tried|just explain|final explanation|i give up/i;

export function isGiveUpMessage(message: string) {
  return GIVE_UP_PATTERN.test(message);
}

export function resolveTutorStrategy(userTurns: number, message: string): TutorStrategy {
  if (userTurns >= 3 || isGiveUpMessage(message)) return "explanation";
  if (userTurns === 2) return "hint";
  return "guiding_question";
}

export function normalizeForLeakCheck(text: string) {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function buildForbiddenTexts(content: LessonContent) {
  const texts = new Set<string>();
  if (content.practiceQuestion?.answer?.trim().length >= 3) {
    texts.add(content.practiceQuestion.answer.trim());
  }
  for (const question of content.quiz ?? []) {
    if (question.correctAnswer?.trim().length >= 3) {
      texts.add(question.correctAnswer.trim());
    }
  }
  return [...texts];
}

export function detectAnswerLeak(
  reply: string,
  forbiddenTexts: string[],
  allowExplanation: boolean
) {
  if (allowExplanation) return null;

  const normalizedReply = normalizeForLeakCheck(reply);
  for (const text of forbiddenTexts) {
    const normalized = normalizeForLeakCheck(text);
    if (normalized.length >= 3 && normalizedReply.includes(normalized)) {
      return `quotes forbidden answer: ${text}`;
    }
  }

  if (/\bthe answer is\b/i.test(reply)) return "contains 'the answer is'";
  if (/\bcorrect (option|answer)\b/i.test(reply)) return "reveals correct answer";
  if (/\btherefore (the )?output\b/i.test(reply)) return "reveals output";
  if (/\bprints \d+\b/i.test(reply)) return "reveals print output";

  return null;
}

function looksLikeFullExplanation(reply: string) {
  return /^\s*\d+[\).\]]\s/m.test(reply) || /\bfirst\b.*\bsecond\b.*\bthird\b/i.test(reply);
}

export function classifyTutorResponse({
  reply,
  requiredStrategy,
  userTurns,
  message,
  forbiddenTexts
}: {
  reply: string;
  requiredStrategy: TutorStrategy;
  userTurns: number;
  message: string;
  concept: Concept;
  forbiddenTexts: string[];
}) {
  const violations: string[] = [];
  const tooLong = reply.split(/\s+/).length > 95;
  const shaming = /obvious|wrong because you|you should know|stupid/i.test(reply);
  const allowExplanation = requiredStrategy === "explanation";
  const leak = detectAnswerLeak(reply, forbiddenTexts, allowExplanation);

  if (tooLong) violations.push("too long");
  if (shaming) violations.push("shaming language");
  if (
    requiredStrategy === "explanation" &&
    userTurns < 3 &&
    !isGiveUpMessage(message)
  ) {
    violations.push("explains too early");
  }
  if (leak) violations.push(leak);
  if (requiredStrategy === "hint" && looksLikeFullExplanation(reply)) {
    violations.push("hint reads like full explanation");
  }

  return { valid: violations.length === 0, violations };
}

export type TutorPromptContext = {
  subject: string;
  lessonTitle: string;
  conceptName: string;
  mastery: number;
  userTurns: number;
  requiredStrategy: TutorStrategy;
  misconception?: string;
  message: string;
  learningObjective?: string;
  explanationExcerpt?: string;
  practiceStem?: string;
  quizStems?: string[];
  retryNote?: string;
};

function strategyInstruction(strategy: TutorStrategy) {
  if (strategy === "hint") {
    return "Give one specific nudge — a clue, not the answer.";
  }
  if (strategy === "explanation") {
    return "They've tried enough times. Explain step by step now.";
  }
  return "Ask one question that helps them reason through it. Don't give the answer.";
}

export function buildTutorUserPrompt(ctx: TutorPromptContext) {
  const lines = [
    `Context: ${ctx.lessonTitle} — ${ctx.conceptName} (${ctx.subject})`,
    `Mastery: ${ctx.mastery.toFixed(2)} (0 = complete beginner, 1 = expert)`
  ];
  if (ctx.learningObjective?.trim()) {
    lines.push(`Objective: ${ctx.learningObjective.trim()}`);
  }
  if (ctx.misconception?.trim()) {
    lines.push(`Known misconception: ${ctx.misconception.trim()}`);
  }
  if (ctx.quizStems?.length) {
    lines.push("Quiz questions:");
    ctx.quizStems.forEach((stem, index) => {
      lines.push(`${index + 1}. ${stem}`);
    });
  }
  if (ctx.practiceStem?.trim()) {
    lines.push(`Practice question: ${ctx.practiceStem.trim()}`);
  }
  if (ctx.explanationExcerpt?.trim()) {
    lines.push(`Lesson excerpt: ${ctx.explanationExcerpt.trim().slice(0, 400)}`);
  }
  lines.push("", `What to do: ${strategyInstruction(ctx.requiredStrategy)}`);
  if (ctx.retryNote) lines.push(`Note: ${ctx.retryNote}`);
  lines.push("", `Student says: "${ctx.message}"`);
  return lines.join("\n");
}
