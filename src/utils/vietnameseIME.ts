export type VietnameseInputMethod = 'en' | 'vi-telex' | 'vi-vni';

// Vowel transformations
// Vowel variants with tones
// Format: [none, sắc, huyền, hỏi, ngã, nặng]
const VOWEL_TABLE: Record<string, string[]> = {
  a: ['a', 'á', 'à', 'ả', 'ã', 'ạ'],
  ă: ['ă', 'ắ', 'ằ', 'ẳ', 'ẵ', 'ặ'],
  â: ['â', 'ấ', 'ầ', 'ẩ', 'ẫ', 'ậ'],
  e: ['e', 'é', 'è', 'ẻ', 'ẽ', 'ẹ'],
  ê: ['ê', 'ế', 'ề', 'ể', 'ễ', 'ệ'],
  i: ['i', 'í', 'ì', 'ỉ', 'ĩ', 'ị'],
  o: ['o', 'ó', 'ò', 'ỏ', 'õ', 'ọ'],
  ô: ['ô', 'ố', 'ồ', 'ổ', 'ỗ', 'ộ'],
  ơ: ['ơ', 'ớ', 'ờ', 'ở', 'ỡ', 'ợ'],
  u: ['u', 'ú', 'ù', 'ủ', 'ũ', 'ụ'],
  ư: ['ư', 'ứ', 'ừ', 'ử', 'ữ', 'ự'],
  y: ['y', 'ý', 'ỳ', 'ỷ', 'ỹ', 'ỵ'],
};

// Map each accented vowel back to its base vowel and tone index (0: none, 1: sắc, 2: huyền, 3: hỏi, 4: ngã, 5: nặng)
interface VowelInfo {
  base: string; // e.g. 'a', 'ă', 'â', 'e', 'ê', ...
  plain: string; // e.g. 'a', 'e', 'i', 'o', 'u', 'y'
  tone: number; // 0..5
  isUpper: boolean;
}

const CHAR_TO_VOWEL_INFO: Record<string, VowelInfo> = {};
const BASE_VOWELS = ['a', 'ă', 'â', 'e', 'ê', 'i', 'o', 'ô', 'ơ', 'u', 'ư', 'y'];

const PLAIN_BASE_MAP: Record<string, string> = {
  a: 'a', ă: 'a', â: 'a',
  e: 'e', ê: 'e',
  i: 'i',
  o: 'o', ô: 'o', ơ: 'o',
  u: 'u', ư: 'u',
  y: 'y',
};

// Populate reverse lookup map
for (const base of BASE_VOWELS) {
  const list = VOWEL_TABLE[base];
  const plain = PLAIN_BASE_MAP[base] || base;
  list.forEach((char, tone) => {
    CHAR_TO_VOWEL_INFO[char] = { base, plain, tone, isUpper: false };
    CHAR_TO_VOWEL_INFO[char.toUpperCase()] = { base, plain, tone, isUpper: true };
  });
}

// Check if a character is a vowel
export function isVowel(ch: string): boolean {
  return Boolean(CHAR_TO_VOWEL_INFO[ch]);
}

// Helper to remove tones from a vowel
export function removeToneFromVowel(ch: string): string {
  const info = CHAR_TO_VOWEL_INFO[ch];
  if (!info) return ch;
  const target = VOWEL_TABLE[info.base][0];
  return info.isUpper ? target.toUpperCase() : target;
}

// Helper to apply tone to a vowel
export function applyToneToVowel(ch: string, tone: number): string {
  const info = CHAR_TO_VOWEL_INFO[ch];
  if (!info) return ch;
  const target = VOWEL_TABLE[info.base][tone];
  return info.isUpper ? target.toUpperCase() : target;
}

// Find existing tone in a word (0 if none)
export function getWordTone(word: string): number {
  for (const ch of word) {
    const info = CHAR_TO_VOWEL_INFO[ch];
    if (info && info.tone > 0) {
      return info.tone;
    }
  }
  return 0;
}

// Clear tone from all vowels in a word
export function clearTonesInWord(word: string): string {
  let result = '';
  for (const ch of word) {
    const info = CHAR_TO_VOWEL_INFO[ch];
    if (info) {
      result += removeToneFromVowel(ch);
    } else {
      result += ch;
    }
  }
  return result;
}

/**
 * Determine which vowel in the syllable should receive the tone mark.
 * Follows traditional Vietnamese orthography standards (Bộ Giáo dục & Đào tạo).
 */
export function findToneTargetIndex(cleanWord: string): number {
  const lower = cleanWord.toLowerCase();
  const vowelIndices: number[] = [];

  for (let i = 0; i < lower.length; i++) {
    if (isVowel(lower[i])) {
      vowelIndices.push(i);
    }
  }

  if (vowelIndices.length === 0) return -1;
  if (vowelIndices.length === 1) return vowelIndices[0];

  const firstVowelIdx = vowelIndices[0];
  const lastVowelIdx = vowelIndices[vowelIndices.length - 1];
  const hasConsonantAfter = lastVowelIdx < lower.length - 1;

  // 1. Handle 'qu' (in 'qu', 'u' acts as consonant cluster; e.g. 'quán', 'quý', 'quyên', 'quận')
  let effectiveVowelIndices = vowelIndices;
  if (lower.startsWith('qu') && firstVowelIdx === 1) {
    effectiveVowelIndices = vowelIndices.slice(1);
    if (effectiveVowelIndices.length === 0) return vowelIndices[0];
    if (effectiveVowelIndices.length === 1) return effectiveVowelIndices[0];
  } else if (lower.startsWith('gi') && vowelIndices.length >= 2 && firstVowelIdx === 1) {
    // In 'gi' followed by vowel (e.g. 'giá', 'gió', 'già', 'giếng'), 'gi' is initial consonant
    effectiveVowelIndices = vowelIndices.slice(1);
    if (effectiveVowelIndices.length === 0) return vowelIndices[0];
    if (effectiveVowelIndices.length === 1) return effectiveVowelIndices[0];
  }

  // 2. Highest priority: 'ươ' (or 'ưo', 'uơ') diphthong.
  // In ALL cases (trường, nước, mười, rượu, hướng, được, lượn, thưở),
  // the tone ALWAYS lands on 'ơ', NEVER on 'ư'!
  for (let k = 0; k < effectiveVowelIndices.length - 1; k++) {
    const v1 = lower[effectiveVowelIndices[k]];
    const v2 = lower[effectiveVowelIndices[k + 1]];
    if ((v1 === 'ư' && (v2 === 'ơ' || v2 === 'o')) || (v1 === 'u' && v2 === 'ơ')) {
      return effectiveVowelIndices[k + 1];
    }
  }

  // 3. Priority for single diacritic vowels: 'ê', 'ô', 'â', 'ă' (e.g. 'tiếng', 'buồn', 'hoặc', 'xuân')
  for (const idx of effectiveVowelIndices) {
    const ch = lower[idx];
    if (['ê', 'ô', 'â', 'ă'].includes(ch)) {
      return idx;
    }
  }

  // Standalone 'ơ' or 'ư' if present
  for (const idx of effectiveVowelIndices) {
    const ch = lower[idx];
    if (['ơ', 'ư'].includes(ch)) {
      return idx;
    }
  }

  const vowelCluster = effectiveVowelIndices.map(i => lower[i]).join('');

  // 4. Syllables with final consonants (e.g. 'toán', 'hoàn', 'loạng', 'xoét', 'huỳnh', 'hoạt')
  if (hasConsonantAfter) {
    // For 'oa', 'oe' with final consonant -> tone on 2nd vowel (a, e): 'toán', 'hoàn', 'xoét'
    if (vowelCluster.startsWith('oa') || vowelCluster.startsWith('oe')) {
      return effectiveVowelIndices[1];
    }
    // For 'uy' with final consonant -> tone on y: 'huỳnh', 'huých'
    if (vowelCluster.startsWith('uy')) {
      return effectiveVowelIndices[1];
    }
    // General rule with ending consonant: tone on second vowel
    if (effectiveVowelIndices.length >= 2) {
      return effectiveVowelIndices[1];
    }
    return effectiveVowelIndices[0];
  }

  // 5. Open syllables WITHOUT final consonant (traditional standard):
  // 'oa', 'oe': tone on 'o' (e.g. 'òa', 'hòa', 'hóa', 'tòa', 'xóa', 'thỏa', 'òe', 'hòe', 'khỏe', 'lóe')
  if (vowelCluster === 'oa' || vowelCluster === 'oe') {
    return effectiveVowelIndices[0];
  }

  // 'uy': tone on 'u' (e.g. 'úy', 'thúy', 'tùy', 'hủy', 'lũy', 'thủy')
  if (vowelCluster === 'uy') {
    return effectiveVowelIndices[0];
  }

  // 'ia', 'ua', 'ưa': tone on 1st vowel (e.g. 'mía', 'chùa', 'lửa')
  if (['ia', 'ua', 'ưa'].includes(vowelCluster)) {
    return effectiveVowelIndices[0];
  }

  // Diphthongs with off-glide semivowels ('ai', 'ay', 'ao', 'au', 'eo', 'oi', 'ui'):
  // tone on 1st vowel (e.g. 'hải', 'máy', 'cháo', 'sáu', 'kéo', 'nếu', 'tối', 'mùi')
  if (['ai', 'ay', 'ao', 'au', 'eo', 'oi', 'ui'].some(p => vowelCluster.startsWith(p))) {
    return effectiveVowelIndices[0];
  }

  // Default: put tone on 2nd vowel if 2 vowels, else 1st
  return effectiveVowelIndices.length >= 2 ? effectiveVowelIndices[1] : effectiveVowelIndices[0];
}

/**
 * Normalizes misplaced Vietnamese tone accents (such as trừơng -> trường, oà -> òa, uý -> úy).
 */
export function normalizeVietnameseWord(word: string): string {
  if (!word) return word;

  let result = word;

  // Fix misplaced tone on 'ư' instead of 'ơ' in 'ươ'
  result = result
    .replace(/ừơ/g, 'ườ').replace(/ứơ/g, 'ướ').replace(/ửơ/g, 'ưở').replace(/ữơ/g, 'ưỡ').replace(/ựơ/g, 'ượ')
    .replace(/ừo/g, 'ườ').replace(/ứo/g, 'ướ').replace(/ửo/g, 'ưở').replace(/ữo/g, 'ưỡ').replace(/ựo/g, 'ượ')
    .replace(/Ừơ/g, 'Ườ').replace(/Ứơ/g, 'Ướ').replace(/Ửơ/g, 'Ưở').replace(/Ữơ/g, 'Ưỡ').replace(/Ựơ/g, 'Ượ')
    .replace(/ỪƠ/g, 'ƯỜ').replace(/ỨƠ/g, 'ƯỚ').replace(/ỬƠ/g, 'ƯỞ').replace(/ỮƠ/g, 'ƯỠ').replace(/ỰƠ/g, 'ƯỢ')
    .replace(/Ừo/g, 'Ườ').replace(/Ứo/g, 'Ướ').replace(/Ửo/g, 'Ưở').replace(/Ữo/g, 'Ưỡ').replace(/Ựo/g, 'Ượ')
    .replace(/ỪO/g, 'ƯỜ').replace(/ỨO/g, 'ƯỚ').replace(/ỬO/g, 'ƯỞ').replace(/ỮO/g, 'ƯỠ').replace(/ỰO/g, 'ƯỢ');

  // Fix open syllable 'oa' tones: oà -> òa, oá -> óa, etc.
  result = result
    .replace(/oà(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'òa')
    .replace(/oá(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'óa')
    .replace(/oả(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'ỏa')
    .replace(/oã(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'õa')
    .replace(/oạ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'ọa')
    .replace(/Oà(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'Òa')
    .replace(/Oá(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'Óa')
    .replace(/Oả(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'Ỏa')
    .replace(/Oã(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'Õa')
    .replace(/Oạ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'Ọa')
    .replace(/OÀ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'ÒA')
    .replace(/OÁ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'ÓA')
    .replace(/OẢ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'ỎA')
    .replace(/OÃ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'ÕA')
    .replace(/OẠ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'ỌA');

  // Fix open syllable 'oe' tones: oè -> òe, oé -> óe, etc.
  result = result
    .replace(/oè(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'òe')
    .replace(/oé(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'óe')
    .replace(/oẻ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'ỏe')
    .replace(/oẽ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'õe')
    .replace(/oẹ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'ọe')
    .replace(/Oè(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'Òe')
    .replace(/Oé(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'Óe')
    .replace(/Oẻ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'Ỏe')
    .replace(/Oẽ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'Õe')
    .replace(/Oẹ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'Ọe')
    .replace(/OÈ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'ÒE')
    .replace(/OÉ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'ÓE')
    .replace(/OẺ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'ỎE')
    .replace(/OẼ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'ÕE')
    .replace(/OẸ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'ỌE');

  // Fix open syllable 'uy' tones: uý -> úy, uỳ -> ùy (when not preceded by q/Q)
  result = result
    .replace(/(?<![qQ])uý(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'úy')
    .replace(/(?<![qQ])uỳ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'ùy')
    .replace(/(?<![qQ])uỷ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'ủy')
    .replace(/(?<![qQ])uỹ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'ũy')
    .replace(/(?<![qQ])uỵ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'ụy')
    .replace(/(?<![qQ])Uý(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'Úy')
    .replace(/(?<![qQ])Uỳ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'Ùy')
    .replace(/(?<![qQ])Uỷ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'Ủy')
    .replace(/(?<![qQ])Uỹ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'Ũy')
    .replace(/(?<![qQ])Uỵ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'Ụy')
    .replace(/(?<![qQ])UÝ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'ÚY')
    .replace(/(?<![qQ])UỲ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'ÙY')
    .replace(/(?<![qQ])UỶ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'ỦY')
    .replace(/(?<![qQ])UỸ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'ŨY')
    .replace(/(?<![qQ])UỴ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'ỤY');

  return result;
}

/**
 * Apply a tone (1: sắc, 2: huyền, 3: hỏi, 4: ngã, 5: nặng, 0: remove) to a word.
 */
export function applyToneToWord(word: string, tone: number): string {
  const currentTone = getWordTone(word);
  const clean = clearTonesInWord(word);

  // If typing the same tone again, remove the tone (toggle off)
  if (currentTone === tone || tone === 0) {
    return normalizeVietnameseWord(clean);
  }

  const targetIdx = findToneTargetIndex(clean);
  if (targetIdx === -1) return normalizeVietnameseWord(word);

  let result = '';
  for (let i = 0; i < clean.length; i++) {
    if (i === targetIdx) {
      result += applyToneToVowel(clean[i], tone);
    } else {
      result += clean[i];
    }
  }
  return normalizeVietnameseWord(result);
}

/**
 * TELEX Transformation Engine
 * Takes existing word before cursor and the newly pressed key.
 * Returns the transformed word, or null if key wasn't handled as Vietnamese modifier.
 */
export function processTelexKey(currentWord: string, char: string): string | null {
  const key = char.toLowerCase();
  const isKeyUpper = char !== key;

  // 1. Double letter transformations (aa, ee, oo, dd)
  if (currentWord.length > 0) {
    const lastChar = currentWord[currentWord.length - 1];
    const lastLower = lastChar.toLowerCase();

    // 'dd' -> 'đ'
    if (key === 'd' && (lastLower === 'd' || lastLower === 'đ')) {
      if (lastLower === 'đ') {
        // Toggle back to 'dd' if pressed again
        return currentWord.slice(0, -1) + (isKeyUpper ? 'D' : 'd') + (isKeyUpper ? 'D' : 'd');
      }
      const isUpper = lastChar === lastChar.toUpperCase();
      return currentWord.slice(0, -1) + (isUpper ? 'Đ' : 'đ');
    }

    // 'aa' -> 'â'
    if (key === 'a') {
      const tone = getWordTone(currentWord);
      const clean = clearTonesInWord(currentWord);
      const lastClean = clean[clean.length - 1]?.toLowerCase();

      if (lastClean === 'a') {
        const isUpper = clean[clean.length - 1] === clean[clean.length - 1].toUpperCase();
        const replaced = clean.slice(0, -1) + (isUpper ? 'Â' : 'â');
        return applyToneToWord(replaced, tone);
      }
      if (lastClean === 'â') {
        // Toggle back to 'aa'
        const isUpper = clean[clean.length - 1] === clean[clean.length - 1].toUpperCase();
        const replaced = clean.slice(0, -1) + (isUpper ? 'A' : 'a') + (isKeyUpper ? 'A' : 'a');
        return applyToneToWord(replaced, tone);
      }
    }

    // 'ee' -> 'ê'
    if (key === 'e') {
      const tone = getWordTone(currentWord);
      const clean = clearTonesInWord(currentWord);
      const lastClean = clean[clean.length - 1]?.toLowerCase();

      if (lastClean === 'e') {
        const isUpper = clean[clean.length - 1] === clean[clean.length - 1].toUpperCase();
        const replaced = clean.slice(0, -1) + (isUpper ? 'Ê' : 'ê');
        return applyToneToWord(replaced, tone);
      }
      if (lastClean === 'ê') {
        const isUpper = clean[clean.length - 1] === clean[clean.length - 1].toUpperCase();
        const replaced = clean.slice(0, -1) + (isUpper ? 'E' : 'e') + (isKeyUpper ? 'E' : 'e');
        return applyToneToWord(replaced, tone);
      }
    }

    // 'oo' -> 'ô'
    if (key === 'o') {
      const tone = getWordTone(currentWord);
      const clean = clearTonesInWord(currentWord);
      const lastClean = clean[clean.length - 1]?.toLowerCase();

      if (lastClean === 'o') {
        const isUpper = clean[clean.length - 1] === clean[clean.length - 1].toUpperCase();
        const replaced = clean.slice(0, -1) + (isUpper ? 'Ô' : 'ô');
        return applyToneToWord(replaced, tone);
      }
      if (lastClean === 'ô') {
        const isUpper = clean[clean.length - 1] === clean[clean.length - 1].toUpperCase();
        const replaced = clean.slice(0, -1) + (isUpper ? 'O' : 'o') + (isKeyUpper ? 'O' : 'o');
        return applyToneToWord(replaced, tone);
      }
    }

    // Direct vowel combination: if ends with 'ư' and next key is 'o' or 'ơ' -> 'ươ'
    if (key === 'o' || key === 'ơ') {
      const tone = getWordTone(currentWord);
      const clean = clearTonesInWord(currentWord);
      const lower = clean.toLowerCase();
      if (lower.endsWith('ư')) {
        const isLastUpper = clean[clean.length - 1] === clean[clean.length - 1].toUpperCase();
        const replaced = clean.slice(0, -1) + (isLastUpper ? 'Ư' : 'ư') + (isKeyUpper ? 'Ơ' : 'ơ');
        return applyToneToWord(replaced, tone);
      }
    }

    // Direct vowel combination: if ends with 'u' and next key is 'ơ' -> 'ươ'
    if (key === 'ơ') {
      const tone = getWordTone(currentWord);
      const clean = clearTonesInWord(currentWord);
      const lower = clean.toLowerCase();
      if (lower.endsWith('u')) {
        const isLastUpper = clean[clean.length - 1] === clean[clean.length - 1].toUpperCase();
        const replaced = clean.slice(0, -1) + (isLastUpper ? 'Ư' : 'ư') + (isKeyUpper ? 'Ơ' : 'ơ');
        return applyToneToWord(replaced, tone);
      }
    }

    // 'w' modifier -> 'ă', 'ơ', 'ư', 'ươ'
    if (key === 'w') {
      const tone = getWordTone(currentWord);
      const clean = clearTonesInWord(currentWord);
      const lower = clean.toLowerCase();

      // Check for 'uo', 'ưo', 'uơ' anywhere in the word -> 'ươ' (e.g. 'truong' -> 'trương', 'duoc' -> 'được')
      if (lower.includes('uo')) {
        const idx = lower.lastIndexOf('uo');
        const isUUpper = clean[idx] === clean[idx].toUpperCase();
        const isOUpper = clean[idx + 1] === clean[idx + 1].toUpperCase();
        const replaced = clean.slice(0, idx) + (isUUpper ? 'Ư' : 'ư') + (isOUpper ? 'Ơ' : 'ơ') + clean.slice(idx + 2);
        return applyToneToWord(replaced, tone);
      }

      if (lower.includes('ưo')) {
        const idx = lower.lastIndexOf('ưo');
        const isUUpper = clean[idx] === clean[idx].toUpperCase();
        const isOUpper = clean[idx + 1] === clean[idx + 1].toUpperCase();
        const replaced = clean.slice(0, idx) + (isUUpper ? 'Ư' : 'ư') + (isOUpper ? 'Ơ' : 'ơ') + clean.slice(idx + 2);
        return applyToneToWord(replaced, tone);
      }

      if (lower.includes('uơ')) {
        const idx = lower.lastIndexOf('uơ');
        const isUUpper = clean[idx] === clean[idx].toUpperCase();
        const isOUpper = clean[idx + 1] === clean[idx + 1].toUpperCase();
        const replaced = clean.slice(0, idx) + (isUUpper ? 'Ư' : 'ư') + (isOUpper ? 'Ơ' : 'ơ') + clean.slice(idx + 2);
        return applyToneToWord(replaced, tone);
      }

      // Check last vowel: 'a' -> 'ă'
      if (lower.endsWith('a')) {
        const isUpper = clean[clean.length - 1] === clean[clean.length - 1].toUpperCase();
        const replaced = clean.slice(0, -1) + (isUpper ? 'Ă' : 'ă');
        return applyToneToWord(replaced, tone);
      }

      // 'o' -> 'ơ'
      if (lower.endsWith('o')) {
        const isUpper = clean[clean.length - 1] === clean[clean.length - 1].toUpperCase();
        const replaced = clean.slice(0, -1) + (isUpper ? 'Ơ' : 'ơ');
        return applyToneToWord(replaced, tone);
      }

      // 'u' -> 'ư'
      if (lower.endsWith('u')) {
        const isUpper = clean[clean.length - 1] === clean[clean.length - 1].toUpperCase();
        const replaced = clean.slice(0, -1) + (isUpper ? 'Ư' : 'ư');
        return applyToneToWord(replaced, tone);
      }

      // If 'ă' -> toggle back to 'aw'
      if (lower.endsWith('ă')) {
        const isUpper = clean[clean.length - 1] === clean[clean.length - 1].toUpperCase();
        return clean.slice(0, -1) + (isUpper ? 'A' : 'a') + (isKeyUpper ? 'W' : 'w');
      }

      // If 'ơ' -> toggle back to 'ow'
      if (lower.endsWith('ơ')) {
        const isUpper = clean[clean.length - 1] === clean[clean.length - 1].toUpperCase();
        return clean.slice(0, -1) + (isUpper ? 'O' : 'o') + (isKeyUpper ? 'W' : 'w');
      }

      // If 'ư' -> toggle back to 'uw'
      if (lower.endsWith('ư')) {
        const isUpper = clean[clean.length - 1] === clean[clean.length - 1].toUpperCase();
        return clean.slice(0, -1) + (isUpper ? 'U' : 'u') + (isKeyUpper ? 'W' : 'w');
      }

      // Standalone 'w' at beginning of word or after consonant: acts as 'ư'
      if (currentWord.length === 0 || !isVowel(currentWord[currentWord.length - 1])) {
        return currentWord + (isKeyUpper ? 'Ư' : 'ư');
      }
    }
  }

  // 2. Tone Marks: s (sắc), f (huyền), r (hỏi), x (ngã), j (nặng), z (remove)
  const TELEX_TONES: Record<string, number> = {
    s: 1, // sắc
    f: 2, // huyền
    r: 3, // hỏi
    x: 4, // ngã
    j: 5, // nặng
    z: 0, // xóa dấu
  };

  if (key in TELEX_TONES) {
    const targetTone = TELEX_TONES[key];
    // Word must have at least one vowel to apply a tone
    const hasAnyVowel = currentWord.split('').some(isVowel);
    if (hasAnyVowel) {
      const currentTone = getWordTone(currentWord);
      // If typing same tone mark again, revert back by appending raw letter
      if (currentTone === targetTone && targetTone !== 0) {
        const clean = clearTonesInWord(currentWord);
        return clean + char;
      }
      return applyToneToWord(currentWord, targetTone);
    }
  }

  return null;
}

/**
 * VNI Transformation Engine
 * 1: sắc, 2: huyền, 3: hỏi, 4: ngã, 5: nặng
 * 6: mũ (â, ê, ô)
 * 7: râu (ơ, ư)
 * 8: trăng (ă)
 * 9: đ
 * 0: xóa dấu
 */
export function processVniKey(currentWord: string, char: string): string | null {
  if (!currentWord || currentWord.length === 0) return null;

  // Numbers 1-5: Tones
  if (['1', '2', '3', '4', '5', '0'].includes(char)) {
    const num = parseInt(char, 10);
    const hasAnyVowel = currentWord.split('').some(isVowel);
    if (hasAnyVowel) {
      return applyToneToWord(currentWord, num);
    }
  }

  const tone = getWordTone(currentWord);
  const clean = clearTonesInWord(currentWord);
  const lower = clean.toLowerCase();

  // 6: mũ (â, ê, ô)
  if (char === '6') {
    // Find vowel to put mũ on (a, e, o)
    for (let i = clean.length - 1; i >= 0; i--) {
      const c = clean[i];
      const cl = c.toLowerCase();
      const isUpper = c === c.toUpperCase();
      if (cl === 'a') {
        const replaced = clean.slice(0, i) + (isUpper ? 'Â' : 'â') + clean.slice(i + 1);
        return applyToneToWord(replaced, tone);
      }
      if (cl === 'e') {
        const replaced = clean.slice(0, i) + (isUpper ? 'Ê' : 'ê') + clean.slice(i + 1);
        return applyToneToWord(replaced, tone);
      }
      if (cl === 'o') {
        const replaced = clean.slice(0, i) + (isUpper ? 'Ô' : 'ô') + clean.slice(i + 1);
        return applyToneToWord(replaced, tone);
      }
    }
  }

  // 7: râu (ơ, ư, ươ)
  if (char === '7') {
    if (lower.includes('uo') || lower.includes('ưo') || lower.includes('uơ')) {
      const matchPattern = lower.includes('uo') ? 'uo' : lower.includes('ưo') ? 'ưo' : 'uơ';
      const idx = lower.lastIndexOf(matchPattern);
      const isUUpper = clean[idx] === clean[idx].toUpperCase();
      const isOUpper = clean[idx + 1] === clean[idx + 1].toUpperCase();
      const replaced = clean.slice(0, idx) + (isUUpper ? 'Ư' : 'ư') + (isOUpper ? 'Ơ' : 'ơ') + clean.slice(idx + 2);
      return applyToneToWord(replaced, tone);
    }

    for (let i = clean.length - 1; i >= 0; i--) {
      const c = clean[i];
      const cl = c.toLowerCase();
      const isUpper = c === c.toUpperCase();
      if (cl === 'o') {
        const replaced = clean.slice(0, i) + (isUpper ? 'Ơ' : 'ơ') + clean.slice(i + 1);
        return applyToneToWord(replaced, tone);
      }
      if (cl === 'u') {
        const replaced = clean.slice(0, i) + (isUpper ? 'Ư' : 'ư') + clean.slice(i + 1);
        return applyToneToWord(replaced, tone);
      }
    }
  }

  // 8: trăng (ă)
  if (char === '8') {
    for (let i = clean.length - 1; i >= 0; i--) {
      const c = clean[i];
      const cl = c.toLowerCase();
      const isUpper = c === c.toUpperCase();
      if (cl === 'a') {
        const replaced = clean.slice(0, i) + (isUpper ? 'Ă' : 'ă') + clean.slice(i + 1);
        return applyToneToWord(replaced, tone);
      }
    }
  }

  // 9: d -> đ
  if (char === '9') {
    for (let i = clean.length - 1; i >= 0; i--) {
      const c = clean[i];
      const cl = c.toLowerCase();
      const isUpper = c === c.toUpperCase();
      if (cl === 'd') {
        const replaced = clean.slice(0, i) + (isUpper ? 'Đ' : 'đ') + clean.slice(i + 1);
        return applyToneToWord(replaced, tone);
      }
    }
  }

  return null;
}
