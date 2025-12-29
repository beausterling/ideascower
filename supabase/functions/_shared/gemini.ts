const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

// Configuration
export const REASONING_MODEL = "gemini-2.0-flash";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// ============ Holiday Detection ============

/**
 * Gets the nth occurrence of a weekday in a given month
 * @param year - The year
 * @param month - The month (0-indexed: 0 = January)
 * @param weekday - The day of week (0 = Sunday, 1 = Monday, etc.)
 * @param n - Which occurrence (1 = first, 2 = second, etc.)
 */
function getNthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): number {
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  let dayOfMonth = 1 + ((weekday - firstWeekday + 7) % 7) + (n - 1) * 7;
  return dayOfMonth;
}

/**
 * Gets the last occurrence of a weekday in a given month
 */
function getLastWeekdayOfMonth(year: number, month: number, weekday: number): number {
  const lastDay = new Date(year, month + 1, 0);
  const lastDayOfMonth = lastDay.getDate();
  const lastWeekday = lastDay.getDay();
  const diff = (lastWeekday - weekday + 7) % 7;
  return lastDayOfMonth - diff;
}

/**
 * Calculates Easter Sunday using the Anonymous Gregorian algorithm
 */
function getEasterSunday(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

/**
 * Returns the holiday name if the date is a major US holiday, otherwise null
 */
function getHolidayContext(date: Date): string | null {
  const month = date.getUTCMonth(); // 0-indexed
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();

  // Fixed date holidays
  if (month === 0 && day === 1) return "New Year's Day";
  if (month === 1 && day === 14) return "Valentine's Day";
  if (month === 2 && day === 17) return "St. Patrick's Day";
  if (month === 3 && day === 1) return "April Fools' Day";
  if (month === 6 && day === 4) return "Independence Day";
  if (month === 9 && day === 31) return "Halloween";
  if (month === 10 && day === 11) return "Veterans Day";
  if (month === 11 && day === 24) return "Christmas Eve";
  if (month === 11 && day === 25) return "Christmas Day";
  if (month === 11 && day === 31) return "New Year's Eve";

  // Floating holidays
  // MLK Day: 3rd Monday of January
  if (month === 0 && day === getNthWeekdayOfMonth(year, 0, 1, 3)) {
    return "Martin Luther King Jr. Day";
  }

  // Presidents' Day: 3rd Monday of February
  if (month === 1 && day === getNthWeekdayOfMonth(year, 1, 1, 3)) {
    return "Presidents' Day";
  }

  // Easter Sunday
  const easter = getEasterSunday(year);
  if (month === easter.month && day === easter.day) {
    return "Easter Sunday";
  }

  // Memorial Day: Last Monday of May
  if (month === 4 && day === getLastWeekdayOfMonth(year, 4, 1)) {
    return "Memorial Day";
  }

  // Labor Day: 1st Monday of September
  if (month === 8 && day === getNthWeekdayOfMonth(year, 8, 1, 1)) {
    return "Labor Day";
  }

  // Columbus Day: 2nd Monday of October
  if (month === 9 && day === getNthWeekdayOfMonth(year, 9, 1, 2)) {
    return "Columbus Day";
  }

  // Thanksgiving: 4th Thursday of November
  if (month === 10 && day === getNthWeekdayOfMonth(year, 10, 4, 4)) {
    return "Thanksgiving";
  }

  return null;
}

// ============ End Holiday Detection ============

export interface BadIdea {
  title: string;
  pitch: string;
  fatalFlaw: string;
  verdict: string;
}

/**
 * Generates a "Bad Idea of the Day" using Gemini REST API.
 * Uses a deterministic seed based on the provided date.
 */
export async function generateDailyBadIdea(targetDate: Date): Promise<BadIdea> {
  // Check if today is a holiday
  const holiday = getHolidayContext(targetDate);

  // Build prompt - only include holiday context if it's a holiday
  const holidayPrefix = holiday
    ? `Today is ${holiday}. Generate a ${holiday}-themed startup idea that sounds revolutionary and profitable on the surface, but has a catastrophic logical, economic, or social flaw that makes it a terrible business.`
    : `Generate a startup idea that sounds revolutionary and profitable on the surface, but has a catastrophic logical, economic, or social flaw that makes it a terrible business.`;

  const prompt = `${holidayPrefix} Do not make it obviously a joke; make it a 'trap' idea. Analyze the flaw deeply.

Respond with a JSON object with these exact fields:
- title: A catchy startup name
- pitch: The elevator pitch that sounds good at first
- fatalFlaw: A deep technical or economic analysis of why it will fail
- verdict: A one-sentence snarky summary`;

  try {
    const response = await fetch(
      `${API_BASE}/${REASONING_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.5,
            topP: 0.95,
            topK: 64,
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                title: { type: "string" },
                pitch: { type: "string" },
                fatalFlaw: { type: "string" },
                verdict: { type: "string" }
              },
              required: ["title", "pitch", "fatalFlaw", "verdict"]
            }
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const text = data.candidates[0].content.parts[0].text;
      return JSON.parse(text) as BadIdea;
    }

    throw new Error("No valid response from Gemini API");
  } catch (error) {
    console.error("Error generating bad idea:", error instanceof Error ? error.message : String(error));
    return {
      title: "Error 404: Idea Not Found",
      pitch: "A service that promises to find ideas but fails due to API errors.",
      fatalFlaw: "Reliability is key.",
      verdict: "Try refreshing."
    };
  }
}

/**
 * Roasts a user's idea using Gemini REST API.
 */
export async function roastUserIdea(idea: string): Promise<string> {
  const prompt = `You are a ruthless venture capitalist who specializes in spotting failure.
Your goal is to deconstruct why this startup idea will fail. Look for market size issues, unit economics, technical impossibility, or competition.
Be harsh, witty, and deeply analytical.

Idea to analyze: "${idea}"`;

  try {
    const response = await fetch(
      `${API_BASE}/${REASONING_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }

    return "The idea was so bad I was left speechless.";
  } catch (error) {
    console.error("Error roasting idea:", error instanceof Error ? error.message : String(error));
    return "My roasting circuits are overheated. Try again later.";
  }
}
