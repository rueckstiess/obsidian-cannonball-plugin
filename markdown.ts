import { remark } from 'remark';
import remarkFrontmatter from 'remark-frontmatter';
// import remarkGfm from 'remark-gfm';
import { inspect } from 'unist-util-inspect';
import { Root } from 'remark-parse/lib';
import remarkCustomTasks from 'remark-custom-tasks'
import { Node } from 'mdast';
/**
 * Parse markdown content into an AST using remark
 * @param markdownContent The markdown content to parse
 * @returns The parsed AST as a Root node
 */
export async function parseMarkdownToAST(markdownContent: string): Promise<Root> {
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

/**
 * Finds the most specific mdast node at the current cursor position
 * 
 * @param ast - The markdown AST (Root node)
 * @param cursorPosition - The current cursor position with line and column
 * @returns The most specific node at the cursor position, or undefined if none found
 */
export function findNodeAtCursor(ast: Root, cursorPosition: { line: number, ch: number }): Node | undefined {
  // Convert Obsidian's ch (character) to column used in mdast
  // mdast uses 1-based line numbers and column numbers
  const cursor = {
    line: cursorPosition.line + 1,
    column: cursorPosition.ch + 1
  };

  let matchingNode: Node | undefined = undefined;
  let smallestArea = Infinity;

  // Recursive function to visit all nodes
  function visitNode(node: Node): void {
    if (isNodeAtPosition(node, cursor)) {
      // Calculate the "area" of the node (smaller means more specific)
      const area = calculateNodeArea(node);

      if (area < smallestArea) {
        smallestArea = area;
        matchingNode = node;
      }
    }

    // Continue traversing the tree
    if ('children' in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        visitNode(child);
      }
    }
  }

  // Start traversing from the root
  visitNode(ast);

  return matchingNode;
}

/**
 * Checks if a cursor position is within a node's position
 */
function isNodeAtPosition(node: Node, cursor: { line: number, column: number }): boolean {
  if (!node.position) return false;

  const { start, end } = node.position;

  // Check if cursor is within the node's position boundaries
  if (cursor.line < start.line || cursor.line > end.line) {
    return false;
  }

  // If cursor is at start line, column must be >= start column
  if (cursor.line === start.line && cursor.column < start.column) {
    return false;
  }

  // If cursor is at end line, column must be <= end column
  if (cursor.line === end.line && cursor.column > end.column) {
    return false;
  }

  return true;
}

/**
 * Calculates the "area" of a node based on its position
 * Smaller area = more specific node
 */
function calculateNodeArea(node: Node): number {
  if (!node.position) return Infinity;

  const { start, end } = node.position;

  // If the node spans multiple lines
  if (end.line > start.line) {
    return (end.line - start.line) * 1000 + (end.column - start.column);
  }

  // If the node is on a single line
  return end.column - start.column;
}

