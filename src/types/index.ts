export interface Message {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
}

export interface PaneState {
  id: string;
  targetLang: string;
}

export type LayoutMode = 2 | 3 | 4;
export type SplitDirection = 'horizontal' | 'vertical';

// SUPPORTED_LANGUAGES constant can be added here
export const SUPPORTED_LANGUAGES = [
  { code: 'ko', locale: 'ko-KR', name: '한국어 / 한국어' },
  { code: 'ne', locale: 'ne-NP', name: '네팔어 / नेपाली' },
  { code: 'de', locale: 'de-DE', name: '독일어 / Deutsch' },
  { code: 'ru', locale: 'ru-RU', name: '러시아어 / Русский' },
  { code: 'mn', locale: 'mn-MN', name: '몽골어 / Монгол хэл' },
  { code: 'my', locale: 'my-MM', name: '미얀마어 / မြန်မာစာ' },
  { code: 'vi', locale: 'vi-VN', name: '베트남어 / Tiếng Việt' },
  { code: 'bn', locale: 'bn-BD', name: '벵골어(방글라데시) / বাংলা' },
  { code: 'es', locale: 'es-ES', name: '스페인어 / Español' },
  { code: 'si', locale: 'si-LK', name: '싱할라어(스리랑카) / සිංහල' },
  { code: 'en', locale: 'en-US', name: '영어 / English' },
  { code: 'uz', locale: 'uz-UZ', name: '우즈베크어 / Oʻzbekcha' },
  { code: 'id', locale: 'id-ID', name: '인도네시아어 / Bahasa Indonesia' },
  { code: 'ja', locale: 'ja-JP', name: '일본어 / 日本語' },
  { code: 'zh-CN', locale: 'zh-CN', name: '중국어 / 中文 (简体)' },
  { code: 'kk', locale: 'kk-KZ', name: '카자흐어 / Қазақ тілі' },
  { code: 'ky', locale: 'ky-KG', name: '키르기스어 / Кыргызча' },
  { code: 'fr', locale: 'fr-FR', name: '프랑스어 / Français' },
];
