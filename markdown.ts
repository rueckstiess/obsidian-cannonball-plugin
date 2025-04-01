import { remark } from 'remark';
import remarkFrontmatter from 'remark-frontmatter';
// import remarkGfm from 'remark-gfm';
import { inspect } from 'unist-util-inspect';
import { Root } from 'remark-parse/lib';
import remarkCustomTasks from 'remark-custom-tasks'

/**
 * Parse markdown content into an AST using remark
 * @param markdownContent The markdown content to parse
 * @returns The parsed AST as a Root node
 */
export async function parseMarkdownToAST(markdownContent: string): Promise<Root> {
  // const processor = remark().use(remarkCustomTasks)
  // const ast = processor.parse(markdownContent)
  // processor.runSync(ast)

  const processor = remark()
    .use(remarkCustomTasks)
    .use(remarkFrontmatter);

  const ast = processor.parse(markdownContent);
  await processor.run(ast);

  return ast;
}

/**
 * Simple utility to log the AST to the console for debugging
 * @param markdownContent The markdown content to parse and log
 */
export async function logMarkdownAST(markdownContent: string): Promise<void> {
  const ast = await parseMarkdownToAST(markdownContent);
  console.log('Markdown AST:');
  console.log(inspect(ast));
}

/**
 * Convert an AST back to markdown text
 * @param ast The AST to convert
 * @returns The markdown text
 */
export async function astToMarkdown(ast: Root): Promise<string> {
  const markdown = await remark()
    .use(remarkCustomTasks)
    .use(remarkFrontmatter)
    // .use(remarkGfm)
    .stringify(ast, {
      listItemIndent: 'tab',     // Use tab indentation for list items
      bullet: '-',               // Use - for bullet points
      emphasis: '_',             // Use _ for emphasis
      strong: '*',               // Use ** for strong
      fences: true,              // Use ``` for code blocks
      incrementListMarker: true, // Increment ordered list marker
      setext: false              // Use atx-style headings (# headings)
    })

  return markdown;
}



/**
 * Parse markdown to AST and then back to markdown
 * This is useful for testing or normalizing markdown
 * @param markdownContent The markdown content to process
 * @returns The processed markdown content
 */
export async function roundTripMarkdown(markdownContent: string): Promise<string> {
  const ast = await parseMarkdownToAST(markdownContent);
  return astToMarkdown(ast);
}