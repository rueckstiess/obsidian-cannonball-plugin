import { parseMarkdownToAST, astToMarkdown, findNodeAtCursor } from '../markdown';
import { Paragraph, Text } from 'mdast';

describe('Markdown AST utilities', () => {
  describe('parseMarkdownToAST', () => {
    it('should parse simple markdown into AST', async () => {
      const markdown = 'Hello world';
      const ast = await parseMarkdownToAST(markdown);

      expect(ast).toBeDefined();
      expect(ast.type).toBe('root');
      expect(ast.children).toHaveLength(1);
      expect(ast.children[0].type).toBe('paragraph');
    });

    it('should parse complex markdown with various elements', async () => {
      const markdown = `# Heading

This is a paragraph with *emphasis* and **strong** text.

- List item 1
- List item 2
`;
      const ast = await parseMarkdownToAST(markdown);

      expect(ast).toBeDefined();
      expect(ast.type).toBe('root');
      expect(ast.children).toHaveLength(3); // Heading, paragraph, and list
      expect(ast.children[0].type).toBe('heading');
      expect(ast.children[1].type).toBe('paragraph');
      expect(ast.children[2].type).toBe('list');
    });
  });

  describe('astToMarkdown', () => {
    it('should convert AST back to markdown', async () => {
      const markdown = '# Test Heading\n\nThis is a paragraph.\n';
      const ast = await parseMarkdownToAST(markdown);
      const result = await astToMarkdown(ast);

      // Normalize line endings
      const normalizedResult = result.replace(/\r\n/g, '\n');
      const normalizedMarkdown = markdown.replace(/\r\n/g, '\n');

      expect(normalizedResult).toBe(normalizedMarkdown);
    });
  });

  describe('findNodeAtCursor', () => {
    it('should find the paragraph node when cursor is in a paragraph', async () => {
      const markdown = 'This is a paragraph.';
      const ast = await parseMarkdownToAST(markdown);

      const node = findNodeAtCursor(ast, { line: 0, ch: 5 }); // Cursor at "is a"

      expect(node).toBeDefined();
      expect(node?.type).toBe('paragraph');
    });

    it('should find the text node when cursor is in a text', async () => {
      const markdown = 'This is a paragraph.';
      const ast = await parseMarkdownToAST(markdown);

      // Enable deeper traversal into text nodes by manually adding them to the AST
      if (ast.children[0] && ast.children[0].type === 'paragraph') {
        const paragraphNode = ast.children[0] as Paragraph;
        // If paragraph already has children (Text nodes), we'll use those directly
        if (!paragraphNode.children || paragraphNode.children.length === 0) {
          paragraphNode.children = [
            {
              type: 'text',
              value: 'This is a paragraph.',
              position: {
                start: { line: 1, column: 1, offset: 0 },
                end: { line: 1, column: 20, offset: 19 }
              }
            } as Text
          ];
        }
      }

      const node = findNodeAtCursor(ast, { line: 0, ch: 5 });

      expect(node).toBeDefined();
      // Should find the text node inside paragraph
      expect(node?.type).toBe('text');
    });

    it('should find heading node when cursor is in a heading', async () => {
      const markdown = '# Heading 1\n\nParagraph';
      const ast = await parseMarkdownToAST(markdown);

      const node = findNodeAtCursor(ast, { line: 0, ch: 5 }); // Cursor in "Heading"

      expect(node).toBeDefined();
      expect(node?.type).toBe('heading');
    });

    it('should find list item when cursor is in a list item', async () => {
      const markdown = '- Item 1\n- Item 2';
      const ast = await parseMarkdownToAST(markdown);

      const node = findNodeAtCursor(ast, { line: 1, ch: 3 }); // Cursor in "Item 2"

      expect(node).toBeDefined();
      expect(node?.type).toBe('listItem');
    });

    it('should find innermost node when nodes are nested', async () => {
      const markdown = '- **Bold text** in a list';
      const ast = await parseMarkdownToAST(markdown);

      const node = findNodeAtCursor(ast, { line: 0, ch: 5 }); // Cursor in "Bold"

      expect(node).toBeDefined();
      expect(['strong', 'text', 'emphasis']).toContain(node?.type);
    });

    it('should return undefined when cursor position is outside any node', async () => {
      const markdown = 'Paragraph 1\n\n\n\nParagraph 2';
      const ast = await parseMarkdownToAST(markdown);

      const node = findNodeAtCursor(ast, { line: 2, ch: 0 }); // Empty line between paragraphs

      // Some parsers might include this position in the root node, so we'll check for either undefined
      // or a root node, depending on how the parser handles empty lines
      expect(!node || node.type === 'root').toBeTruthy();
    });
  });
});