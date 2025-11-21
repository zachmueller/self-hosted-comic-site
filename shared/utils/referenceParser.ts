/**
 * Parse Obsidian-style reference syntax from comic captions
 * Supports [[Title]] and [[Title|Alias]] formats
 */

export interface ParsedReference {
  fullMatch: string
  title: string
  alias?: string
  index: number
}

/**
 * Regular expression to match [[Title]] or [[Title|Alias]] patterns
 * Captures:
 * - Group 1: The title (required)
 * - Group 2: The alias (optional, after |)
 */
export const referencePattern = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g

/**
 * Parse all references from a caption string
 * 
 * @param caption - The caption text to parse
 * @returns Array of parsed references with title, optional alias, and position
 * 
 * @example
 * parseReferences("See [[Comic A]] and [[Comic B|B]]")
 * // Returns: [
 * //   { fullMatch: "[[Comic A]]", title: "Comic A", index: 4 },
 * //   { fullMatch: "[[Comic B|B]]", title: "Comic B", alias: "B", index: 19 }
 * // ]
 */
export function parseReferences(caption: string): ParsedReference[] {
  if (!caption || typeof caption !== 'string') {
    return []
  }

  const references: ParsedReference[] = []
  
  // Reset regex state to ensure consistent parsing
  referencePattern.lastIndex = 0
  
  let match: RegExpExecArray | null
  
  while ((match = referencePattern.exec(caption)) !== null) {
    references.push({
      fullMatch: match[0],
      title: match[1].trim(),
      alias: match[2]?.trim(),
      index: match.index,
    })
  }
  
  return references
}

/**
 * Extract unique comic titles referenced in a caption
 * 
 * @param caption - The caption text to parse
 * @returns Array of unique comic titles (deduplicated)
 * 
 * @example
 * extractReferencedTitles("[[Comic A]] and [[Comic A]] again")
 * // Returns: ["Comic A"]
 */
export function extractReferencedTitles(caption: string): string[] {
  const refs = parseReferences(caption)
  const uniqueTitles = new Set(refs.map(ref => ref.title))
  return Array.from(uniqueTitles)
}

/**
 * Check if a caption contains any references
 * 
 * @param caption - The caption text to check
 * @returns true if caption contains at least one reference
 */
export function hasReferences(caption: string): boolean {
  if (!caption || typeof caption !== 'string') {
    return false
  }
  
  referencePattern.lastIndex = 0
  return referencePattern.test(caption)
}

/**
 * Replace references in caption with formatted links
 * Useful for rendering references as clickable links
 * 
 * @param caption - The caption text
 * @param formatter - Function to format each reference
 * @returns Caption with references replaced
 * 
 * @example
 * replaceReferences("See [[Comic A]]", (ref) => `<a href="/comic/${ref.title}">${ref.alias || ref.title}</a>`)
 */
export function replaceReferences(
  caption: string,
  formatter: (ref: ParsedReference) => string
): string {
  const refs = parseReferences(caption)
  
  if (refs.length === 0) {
    return caption
  }
  
  // Replace from end to start to maintain correct indices
  let result = caption
  for (let i = refs.length - 1; i >= 0; i--) {
    const ref = refs[i]
    const replacement = formatter(ref)
    result = result.substring(0, ref.index) + replacement + result.substring(ref.index + ref.fullMatch.length)
  }
  
  return result
}
