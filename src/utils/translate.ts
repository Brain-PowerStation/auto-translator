export async function translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
  if (!text.trim()) return '';
  if (sourceLang === targetLang) return text;

  try {
    // translate.googleapis.com 대신 구글 확장프로그램 공식 엔드포인트 사용 (차단 확률이 훨씬 낮음)
    const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${sourceLang}&tl=${targetLang}&q=${encodeURIComponent(text)}`;
    let response = await fetch(url);
    
    // 만약 실패했다면 0.5초 후 1회 재시도
    if (!response.ok) {
      await new Promise(resolve => setTimeout(resolve, 500));
      response = await fetch(url);
    }
    
    const data = await response.json();
    
    // clients5 엔드포인트는 ["번역문장1", "번역문장2"] 형태의 배열을 반환함
    if (Array.isArray(data)) {
      return data.join('');
    }
    return text;
  } catch (error) {
    console.error('Translation error:', error);
    return '번역 오류 발생';
  }
}
