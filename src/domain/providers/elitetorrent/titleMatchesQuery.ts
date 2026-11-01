// EliteTorrent's WordPress `?s=` search matches any single word of the query,
// so "el libro de la vida" also returns "El libro de la selva", "Sentido de la
// Vida", and unrelated noise. A global edit distance (Levenshtein, Dice,
// fuse.js) does NOT help here: "El libro de la selva" differs from "El libro de
// la vida" by a single word and scores almost identical, so it slips through.
//
// Instead, require every significant word of the query to appear in the title.
// That is what actually removes the noise: "la selva" lacks "vida", "Sentido de
// la Vida" lacks "libro", so both drop.

const STOPWORDS = new Set([
  // Spanish
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "lo",
  "al",
  "del",
  "de",
  "a",
  "ante",
  "con",
  "en",
  "para",
  "por",
  "sin",
  "sobre",
  "tras",
  "y",
  "e",
  "o",
  "u",
  "que",
  "su",
  "sus",
  // English (titles are sometimes mixed)
  "the",
  "of",
  "and",
  "an",
]);

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics (ñ → n, á → a)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalize(value).split(" ").filter(Boolean);
}

/** Significant query words (stopwords and 1-char tokens dropped). Empty for a
 * query made only of stopwords, in which case the filter does not apply. */
function keywords(query: string): string[] {
  return tokenize(query).filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

// A keyword matches a title token on equality or prefix (prefix covers simple
// plurals/inflections: "libro" → "libros"), requiring 4+ chars to avoid loose
// short matches.
function keywordInTitle(keyword: string, titleTokens: string[]): boolean {
  return titleTokens.some(
    (token) =>
      token === keyword ||
      (keyword.length >= 4 && token.startsWith(keyword)) ||
      (token.length >= 4 && keyword.startsWith(token)),
  );
}

/**
 * Whether `title` is relevant to `query`. By default (threshold 1) every
 * significant query word must be present; lower the threshold to allow a
 * fraction of missing words.
 */
export function titleMatchesQuery(
  query: string,
  title: string,
  threshold = 1,
): boolean {
  const keys = keywords(query);
  if (keys.length === 0) return true;

  const titleTokens = tokenize(title);
  const matched = keys.filter((k) => keywordInTitle(k, titleTokens)).length;

  return matched / keys.length >= threshold;
}
