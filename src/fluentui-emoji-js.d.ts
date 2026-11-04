declare module 'fluentui-emoji-js/emojiData.json' {
  interface FluentEmojiDataEntry {
    glyph: string;
    images: {
      '3D'?: string[];
    };
  }

  const emojiData: FluentEmojiDataEntry[];
  export default emojiData;
}
