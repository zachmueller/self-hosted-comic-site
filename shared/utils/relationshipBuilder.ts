/**
 * Build bidirectional relationships between comics
 * Handles relationships from captions, series, and tags
 */

import { parseReferences } from './referenceParser'

export interface DerivedRelationship {
  targetComicId: string
  sourceType: 'caption' | 'series' | 'tag'
  context?: string
}

export interface Comic {
  id: string
  title: string
  caption?: string
  tags?: string[]
  derivedRelationships?: DerivedRelationship[]
}

export interface ComicLookup {
  [title: string]: Comic
}

/**
 * Extract context snippet around a reference in caption
 * Returns text before and after the reference for context
 * 
 * @param caption - The full caption text
 * @param referenceIndex - Index where reference starts
 * @param referenceLength - Length of the reference text
 * @param contextLength - How many characters of context to include (default 50)
 * @returns Context snippet
 */
export function extractContext(
  caption: string,
  referenceIndex: number,
  referenceLength: number,
  contextLength: number = 50
): string {
  const start = Math.max(0, referenceIndex - contextLength)
  const end = Math.min(caption.length, referenceIndex + referenceLength + contextLength)
  
  let context = caption.substring(start, end).trim()
  
  // Add ellipsis if truncated
  if (start > 0) {
    context = '...' + context
  }
  if (end < caption.length) {
    context = context + '...'
  }
  
  return context
}

/**
 * Build relationships from caption references
 * 
 * @param sourceComic - The comic whose caption contains references
 * @param comicsByTitle - Lookup map of comics by title
 * @returns Array of derived relationships
 */
export function buildCaptionRelationships(
  sourceComic: Comic,
  comicsByTitle: ComicLookup
): DerivedRelationship[] {
  if (!sourceComic.caption) {
    return []
  }
  
  const references = parseReferences(sourceComic.caption)
  const relationships: DerivedRelationship[] = []
  
  for (const ref of references) {
    const targetComic = comicsByTitle[ref.title]
    
    if (targetComic && targetComic.id !== sourceComic.id) {
      const context = extractContext(
        sourceComic.caption,
        ref.index,
        ref.fullMatch.length
      )
      
      relationships.push({
        targetComicId: targetComic.id,
        sourceType: 'caption',
        context,
      })
    }
  }
  
  return relationships
}

/**
 * Build relationships from shared tags
 * 
 * @param sourceComic - The source comic
 * @param comicsByTag - Map of tags to comics that have that tag
 * @param maxRelationships - Maximum relationships to create per tag (default 5)
 * @returns Array of derived relationships
 */
export function buildTagRelationships(
  sourceComic: Comic,
  comicsByTag: Map<string, Comic[]>,
  maxRelationships: number = 5
): DerivedRelationship[] {
  if (!sourceComic.tags || sourceComic.tags.length === 0) {
    return []
  }
  
  const relationships: DerivedRelationship[] = []
  const seenComicIds = new Set<string>()
  
  // Process tags to find related comics
  for (const tag of sourceComic.tags) {
    const taggedComics = comicsByTag.get(tag) || []
    
    for (const targetComic of taggedComics) {
      // Skip self-references and already added comics
      if (targetComic.id === sourceComic.id || seenComicIds.has(targetComic.id)) {
        continue
      }
      
      // Limit relationships per tag
      if (relationships.length >= maxRelationships) {
        break
      }
      
      relationships.push({
        targetComicId: targetComic.id,
        sourceType: 'tag',
        context: `Shared tag: ${tag}`,
      })
      
      seenComicIds.add(targetComic.id)
    }
    
    if (relationships.length >= maxRelationships) {
      break
    }
  }
  
  return relationships
}

/**
 * Deduplicate relationships, keeping the one with the most specific source type
 * Priority: caption > series > tag
 * 
 * @param relationships - Array of relationships that may contain duplicates
 * @returns Deduplicated array of relationships
 */
export function deduplicateRelationships(
  relationships: DerivedRelationship[]
): DerivedRelationship[] {
  const byTargetId = new Map<string, DerivedRelationship>()
  
  const priority = { caption: 3, series: 2, tag: 1 }
  
  for (const rel of relationships) {
    const existing = byTargetId.get(rel.targetComicId)
    
    if (!existing || priority[rel.sourceType] > priority[existing.sourceType]) {
      byTargetId.set(rel.targetComicId, rel)
    }
  }
  
  return Array.from(byTargetId.values())
}

/**
 * Build all relationships for a comic
 * Combines caption and tag relationships, deduplicated
 * 
 * @param sourceComic - The comic to build relationships for
 * @param comicsByTitle - Lookup map of comics by title
 * @param comicsByTag - Map of tags to comics
 * @returns Array of derived relationships
 */
export function buildComicRelationships(
  sourceComic: Comic,
  comicsByTitle: ComicLookup,
  comicsByTag: Map<string, Comic[]>
): DerivedRelationship[] {
  const captionRels = buildCaptionRelationships(sourceComic, comicsByTitle)
  const tagRels = buildTagRelationships(sourceComic, comicsByTag)
  
  const allRelationships = [...captionRels, ...tagRels]
  
  return deduplicateRelationships(allRelationships)
}

/**
 * Update bidirectional relationships between comics
 * When comic A references comic B, B should have a reverse relationship to A
 * 
 * @param comics - Array of all comics
 * @returns Updated comics with bidirectional relationships
 */
export function updateBidirectionalRelationships(comics: Comic[]): Comic[] {
  // Create lookups
  const comicsByTitle: ComicLookup = {}
  const comicsByTag = new Map<string, Comic[]>()
  const comicsById = new Map<string, Comic>()
  
  for (const comic of comics) {
    comicsByTitle[comic.title] = comic
    comicsById.set(comic.id, comic)
    
    if (comic.tags) {
      for (const tag of comic.tags) {
        if (!comicsByTag.has(tag)) {
          comicsByTag.set(tag, [])
        }
        comicsByTag.get(tag)!.push(comic)
      }
    }
  }
  
  // Build forward relationships
  const updatedComics = comics.map(comic => ({
    ...comic,
    derivedRelationships: buildComicRelationships(
      comic,
      comicsByTitle,
      comicsByTag
    ),
  }))
  
  // Track reverse relationships to add
  const reverseRelationships = new Map<string, DerivedRelationship[]>()
  
  for (const comic of updatedComics) {
    if (!comic.derivedRelationships) continue
    
    for (const rel of comic.derivedRelationships) {
      if (!reverseRelationships.has(rel.targetComicId)) {
        reverseRelationships.set(rel.targetComicId, [])
      }
      
      // Add reverse relationship
      reverseRelationships.get(rel.targetComicId)!.push({
        targetComicId: comic.id,
        sourceType: rel.sourceType,
        context: rel.context ? `Referenced by: ${comic.title}` : undefined,
      })
    }
  }
  
  // Add reverse relationships to comics
  return updatedComics.map(comic => {
    const reverseRels = reverseRelationships.get(comic.id) || []
    const allRels = [...(comic.derivedRelationships || []), ...reverseRels]
    
    return {
      ...comic,
      derivedRelationships: deduplicateRelationships(allRels),
    }
  })
}
