import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { NewsArticle } from '../types';

export async function exportArticleToDocx(article: NewsArticle) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: article.title,
            heading: HeadingLevel.TITLE,
            spacing: { after: 200 },
          }),
          ...(article.subtitle
            ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: article.subtitle,
                      italics: true,
                      bold: true,
                      color: 'E50914',
                      size: 24,
                    }),
                  ],
                  spacing: { after: 200 },
                }),
              ]
            : []),
          new Paragraph({
            children: [
              new TextRun({
                text: `Chuyên mục: ${article.category} | Xuất bản: ${article.publishedAt}`,
                size: 20,
                color: '666666',
              }),
            ],
            spacing: { after: 300 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: article.excerpt,
                bold: true,
                size: 22,
              }),
            ],
            spacing: { after: 250 },
          }),
          ...article.content.map(
            (p) =>
              new Paragraph({
                text: p,
                spacing: { after: 200, line: 360 },
              })
          ),
          new Paragraph({
            children: [
              new TextRun({
                text: `Từ khóa: ${article.tags.map((t) => '#' + t).join(', ')}`,
                italics: true,
                size: 18,
                color: '888888',
              }),
            ],
            spacing: { before: 400 },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${article.slug || 'bai-viet-sparkle'}.docx`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
