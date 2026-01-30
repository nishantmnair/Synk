/**
 * AI features (Plan Date, Pro Tip, Daily Prompt).
 * All calls go through the backend; the Gemini API key lives only on the server.
 * No user key or client-side key required.
 */
import { aiApi } from './djangoApi';

export interface DateIdeaResult {
  title: string;
  description: string;
  location: string;
  category?: string;
}

const FALLBACK_DATE_IDEA: DateIdeaResult = {
  title: 'Cozy Movie Marathon',
  description: 'A themed movie night with homemade popcorn and your favorite films.',
  location: 'Home Sweet Home',
  category: 'Date idea',
};

export const generateDateIdea = async (vibe: string, hint?: number): Promise<DateIdeaResult> => {
  try {
    const result = await aiApi.planDate(vibe, hint);
    return {
      title: result.title ?? 'Date idea',
      description: result.description ?? '',
      location: result.location ?? 'Anywhere',
      category: result.category ?? 'Date idea',
    };
  } catch (error) {
    console.error('Plan Date request failed:', error);
    return FALLBACK_DATE_IDEA;
  }
};

export const getProTip = async (milestones: { name: string; status: string }[]): Promise<string> => {
  try {
    const result = await aiApi.proTip(milestones);
    return result?.tip ?? 'The best journey is the one you take together. Keep dreaming big!';
  } catch (error) {
    return 'The best journey is the one you take together. Keep dreaming big!';
  }
};

export const getDailyConnectionPrompt = async (): Promise<string> => {
  try {
    const result = await aiApi.dailyPrompt();
    return result?.prompt ?? "If we could teleport anywhere for just one hour today, where would we go?";
  } catch (error) {
    return "If we could teleport anywhere for just one hour today, where would we go?";
  }
};
