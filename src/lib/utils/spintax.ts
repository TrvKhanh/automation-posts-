/**
 * Spintax Parser Tool
 * Supports format: {option1|option2|option3} and nested spintax {A|{B|C}}
 */

export function parseSpintax(text: string): string {
  if (!text) return '';

  const spintaxRegex = /\{([^{}]+)\}/g;

  let current = text;
  while (spintaxRegex.test(current)) {
    current = current.replace(spintaxRegex, (_, choicesStr) => {
      const choices = choicesStr.split('|');
      const randomIndex = Math.floor(Math.random() * choices.length);
      return choices[randomIndex];
    });
  }

  return current;
}

export function countSpintaxVariations(text: string): number {
  if (!text) return 1;

  let count = 1;
  const spintaxRegex = /\{([^{}]+)\}/g;
  let match;

  // Simple approximation for non-nested or simple nested spintax
  let current = text;
  while ((match = spintaxRegex.exec(current)) !== null) {
    const choices = match[1].split('|');
    count *= choices.length;
  }

  return Math.max(1, count);
}

export function getSpintaxSamples(text: string, limit: number = 3): string[] {
  if (!text) return [];
  const samples = new Set<string>();
  const maxAttempts = limit * 10;
  let attempts = 0;

  while (samples.size < limit && attempts < maxAttempts) {
    samples.add(parseSpintax(text));
    attempts++;
  }

  return Array.from(samples);
}
