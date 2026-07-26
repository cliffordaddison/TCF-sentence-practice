// Service for auto-translating text (e.g., French to English)
export async function translateToEnglish(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return '';

  try {
    // 1. Try Google Translate public API
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && data[0]) {
        const translatedSegments = data[0].map((seg: any) => seg[0]).filter(Boolean);
        const result = translatedSegments.join('').trim();
        if (result) return result;
      }
    }
  } catch (err) {
    console.warn('Primary translation API unavailable, trying secondary...', err);
  }

  try {
    // 2. Try MyMemory Translation API fallback
    const fallbackUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=fr|en`;
    const res = await fetch(fallbackUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && data.responseData && data.responseData.translatedText) {
        return data.responseData.translatedText.trim();
      }
    }
  } catch (err) {
    console.warn('Secondary translation API failed:', err);
  }

  // 3. Fallback dictionary for basic phrases
  return fallbackDictionaryTranslation(trimmed);
}

function fallbackDictionaryTranslation(text: string): string {
  const dict: Record<string, string> = {
    'bonjour': 'Hello',
    'bonsoir': 'Good evening',
    'merci': 'Thank you',
    'merci beaucoup': 'Thank you very much',
    's\'il vous plaît': 'Please',
    's\'il te plaît': 'Please',
    'au revoir': 'Goodbye',
    'à bientôt': 'See you soon',
    'oui': 'Yes',
    'non': 'No',
    'comment allez-vous ?': 'How are you?',
    'comment vous appelez-vous ?': 'What is your name?',
    'je m\'appelle alex': 'My name is Alex',
    'd\'où venez-vous ?': 'Where are you from?',
    'je viens du canada': 'I come from Canada',
    'où habitez-vous ?': 'Where do you live?',
  };

  const lower = text.toLowerCase().trim();
  if (dict[lower]) {
    return dict[lower];
  }

  // Return formatted original text as fallback indicator
  return text;
}
