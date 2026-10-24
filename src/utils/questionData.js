import paragraphsData from '../data/paragraphs.json';

// Build default paragraph entries from paragraphs.json if available
const defaultParagraphQuestions = (() => {
  try {
    const easy = (paragraphsData.easy || []).map(p => ({ id: p.id || Date.now() + Math.random(), question: p.content || p.title || '' }));
    const medium = (paragraphsData.medium || []).map(p => ({ id: p.id || Date.now() + Math.random(), question: p.content || p.title || '' }));
    const hard = (paragraphsData.hard || []).map(p => ({ id: p.id || Date.now() + Math.random(), question: p.content || p.title || '' }));
    if (easy.length || medium.length || hard.length) {
      return { easy, medium, hard };
    }
  } catch (err) {
    // fall back to hardcoded defaults below
  }

  return {
    easy: [
      { id: 1, question: "Tell me about yourself." },
      { id: 2, question: "Why do you want to work in the BPO industry?" },
    ],
    medium: [
      { id: 3, question: "How do you handle difficult customers?" },
      { id: 4, question: "How do you manage stress in a fast-paced environment?" },
    ],
    hard: [
      { id: 5, question: "Describe a situation where you had to resolve a conflict at work." },
    ],
  };
})();

const defaultMockInterviewQuestions = {
  initial: [
    { id: 101, question: "Tell me about yourself." },
    { id: 102, question: "Why should we hire you?" },
  ],
  final: [
    { id: 201, question: "Describe a time you handled a difficult customer." },
  ],
};

const normalizeQuestions = (value, fallback) => {
  if (!Array.isArray(value) || value.length === 0) {
    return fallback;
  }

  return value
    .filter((item) => item && typeof item.question === "string" && item.question.trim())
    .map((item) => ({
      id: item.id || Date.now() + Math.random(),
      question: item.question.trim(),
    }));
};

export const getQuestions = () => {
  if (typeof window === "undefined") {
    return {
      paragraph: defaultParagraphQuestions,
      mock: defaultMockInterviewQuestions,
    };
  }

  try {
    const saved = window.localStorage.getItem("bpoReadyQuestions");
    if (!saved) {
      return {
        paragraph: defaultParagraphQuestions,
        mock: defaultMockInterviewQuestions,
      };
    }

    const parsed = JSON.parse(saved);

    return {
      paragraph: {
        easy: normalizeQuestions(parsed?.paragraph?.easy, defaultParagraphQuestions.easy),
        medium: normalizeQuestions(parsed?.paragraph?.medium, defaultParagraphQuestions.medium),
        hard: normalizeQuestions(parsed?.paragraph?.hard, defaultParagraphQuestions.hard),
      },
      mock: {
        initial: normalizeQuestions(parsed?.mock?.initial, defaultMockInterviewQuestions.initial),
        final: normalizeQuestions(parsed?.mock?.final, defaultMockInterviewQuestions.final),
      },
    };
  } catch (error) {
    console.error("Unable to load stored questions", error);
    return {
      paragraph: defaultParagraphQuestions,
      mock: defaultMockInterviewQuestions,
    };
  }
};

export const saveQuestions = ({ paragraph, mock }) => {
  if (typeof window === "undefined") {
    return;
  }

  const payload = {
    paragraph,
    mock,
  };

  window.localStorage.setItem("bpoReadyQuestions", JSON.stringify(payload));
};
