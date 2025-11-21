import { describe, it, expect } from 'vitest'
import {
  parseReferences,
  extractReferencedTitles,
  hasReferences,
  replaceReferences,
  referencePattern,
} from '../referenceParser'

describe('referenceParser', () => {
  describe('parseReferences', () => {
    it('should extract simple [[Title]] reference', () => {
      const caption = 'Check out [[Another Comic]] for more!'
      const refs = parseReferences(caption)
      
      expect(refs).toHaveLength(1)
      expect(refs[0]).toEqual({
        fullMatch: '[[Another Comic]]',
        title: 'Another Comic',
        alias: undefined,
        index: 10,
      })
    })

    it('should extract [[Title|Alias]] reference', () => {
      const caption = 'See [[Full Title|Short Name]] here'
      const refs = parseReferences(caption)
      
      expect(refs).toHaveLength(1)
      expect(refs[0]).toEqual({
        fullMatch: '[[Full Title|Short Name]]',
        title: 'Full Title',
        alias: 'Short Name',
        index: 4,
      })
    })

    it('should extract multiple references', () => {
      const caption = 'Related to [[Comic A]] and [[Comic B|B]] and [[Comic C]]'
      const refs = parseReferences(caption)
      
      expect(refs).toHaveLength(3)
      expect(refs[0].title).toBe('Comic A')
      expect(refs[0].alias).toBeUndefined()
      expect(refs[1].title).toBe('Comic B')
      expect(refs[1].alias).toBe('B')
      expect(refs[2].title).toBe('Comic C')
      expect(refs[2].alias).toBeUndefined()
    })

    it('should trim whitespace from titles and aliases', () => {
      const caption = '[[  Spaced Title  |  Spaced Alias  ]]'
      const refs = parseReferences(caption)
      
      expect(refs).toHaveLength(1)
      expect(refs[0].title).toBe('Spaced Title')
      expect(refs[0].alias).toBe('Spaced Alias')
    })

    it('should handle references at start of caption', () => {
      const caption = '[[First Comic]] is referenced first'
      const refs = parseReferences(caption)
      
      expect(refs).toHaveLength(1)
      expect(refs[0].index).toBe(0)
    })

    it('should handle references at end of caption', () => {
      const caption = 'This references [[Last Comic]]'
      const refs = parseReferences(caption)
      
      expect(refs).toHaveLength(1)
      expect(refs[0].title).toBe('Last Comic')
    })

    it('should handle multiple references to same comic', () => {
      const caption = '[[Comic A]] and then [[Comic A]] again'
      const refs = parseReferences(caption)
      
      expect(refs).toHaveLength(2)
      expect(refs[0].title).toBe('Comic A')
      expect(refs[1].title).toBe('Comic A')
      expect(refs[0].index).not.toBe(refs[1].index)
    })

    it('should return empty array for caption without references', () => {
      const caption = 'Just a normal caption with no references'
      const refs = parseReferences(caption)
      
      expect(refs).toEqual([])
    })

    it('should return empty array for empty caption', () => {
      const refs = parseReferences('')
      expect(refs).toEqual([])
    })

    it('should return empty array for null/undefined caption', () => {
      expect(parseReferences(null as any)).toEqual([])
      expect(parseReferences(undefined as any)).toEqual([])
    })

    it('should handle incomplete reference syntax', () => {
      const caption = 'This has [[incomplete reference'
      const refs = parseReferences(caption)
      
      expect(refs).toEqual([])
    })

    it('should handle nested brackets correctly', () => {
      // Nested brackets are not supported - the regex will not match
      const caption = '[[Comic [with] brackets]]'
      const refs = parseReferences(caption)
      
      // Current regex doesn't handle nested brackets
      expect(refs).toHaveLength(0)
    })

    it('should handle pipe in title before alias', () => {
      const caption = '[[Title|Alias]]'
      const refs = parseReferences(caption)
      
      expect(refs).toHaveLength(1)
      expect(refs[0].title).toBe('Title')
      expect(refs[0].alias).toBe('Alias')
    })

    it('should handle special characters in titles', () => {
      const caption = '[[Comic #1: The Beginning!]]'
      const refs = parseReferences(caption)
      
      expect(refs).toHaveLength(1)
      expect(refs[0].title).toBe('Comic #1: The Beginning!')
    })

    it('should handle very long caption with many references', () => {
      const longCaption = Array.from({ length: 10 }, (_, i) => 
        `[[Comic ${i + 1}]]`
      ).join(' and ')
      
      const refs = parseReferences(longCaption)
      
      expect(refs).toHaveLength(10)
      refs.forEach((ref, i) => {
        expect(ref.title).toBe(`Comic ${i + 1}`)
      })
    })

    it('should handle references with numbers', () => {
      const caption = '[[Comic 123]] and [[456 Comics]]'
      const refs = parseReferences(caption)
      
      expect(refs).toHaveLength(2)
      expect(refs[0].title).toBe('Comic 123')
      expect(refs[1].title).toBe('456 Comics')
    })

    it('should handle references with hyphens and underscores', () => {
      const caption = '[[My-Comic_Title]]'
      const refs = parseReferences(caption)
      
      expect(refs).toHaveLength(1)
      expect(refs[0].title).toBe('My-Comic_Title')
    })
  })

  describe('extractReferencedTitles', () => {
    it('should extract unique titles', () => {
      const caption = '[[Comic A]] and [[Comic B]] and [[Comic A]]'
      const titles = extractReferencedTitles(caption)
      
      expect(titles).toHaveLength(2)
      expect(titles).toContain('Comic A')
      expect(titles).toContain('Comic B')
    })

    it('should return empty array for no references', () => {
      const titles = extractReferencedTitles('No references here')
      expect(titles).toEqual([])
    })

    it('should deduplicate titles', () => {
      const caption = '[[Same Comic]] and [[Same Comic]] and [[Same Comic]]'
      const titles = extractReferencedTitles(caption)
      
      expect(titles).toEqual(['Same Comic'])
    })
  })

  describe('hasReferences', () => {
    it('should return true when caption has references', () => {
      expect(hasReferences('[[Comic A]]')).toBe(true)
      expect(hasReferences('Text [[Comic B]] more text')).toBe(true)
      expect(hasReferences('[[Comic C|Alias]]')).toBe(true)
    })

    it('should return false when caption has no references', () => {
      expect(hasReferences('No references')).toBe(false)
      expect(hasReferences('')).toBe(false)
      expect(hasReferences('Just [single] brackets')).toBe(false)
    })

    it('should return false for null/undefined', () => {
      expect(hasReferences(null as any)).toBe(false)
      expect(hasReferences(undefined as any)).toBe(false)
    })

    it('should handle incomplete syntax', () => {
      expect(hasReferences('[[incomplete')).toBe(false)
      expect(hasReferences('incomplete]]')).toBe(false)
    })
  })

  describe('replaceReferences', () => {
    it('should replace references with formatted output', () => {
      const caption = 'See [[Comic A]] and [[Comic B]]'
      const result = replaceReferences(caption, (ref) => 
        `<a href="/comic/${ref.title}">${ref.title}</a>`
      )
      
      expect(result).toBe('See <a href="/comic/Comic A">Comic A</a> and <a href="/comic/Comic B">Comic B</a>')
    })

    it('should use alias in replacement when provided', () => {
      const caption = 'See [[Full Title|Alias]]'
      const result = replaceReferences(caption, (ref) => 
        `<a>${ref.alias || ref.title}</a>`
      )
      
      expect(result).toBe('See <a>Alias</a>')
    })

    it('should handle multiple references correctly', () => {
      const caption = '[[A]], [[B]], [[C]]'
      const results: string[] = []
      const result = replaceReferences(caption, (ref) => {
        results.push(ref.title)
        return `[${ref.title}]`
      })
      
      // Verify all references were replaced
      expect(result).toBe('[A], [B], [C]')
      // Verify all three titles were processed (order may vary)
      expect(results).toHaveLength(3)
      expect(results).toContain('A')
      expect(results).toContain('B')
      expect(results).toContain('C')
    })

    it('should return unchanged caption when no references', () => {
      const caption = 'No references here'
      const result = replaceReferences(caption, () => 'REPLACED')
      
      expect(result).toBe(caption)
    })

    it('should preserve text around references', () => {
      const caption = 'Start [[Middle]] End'
      const result = replaceReferences(caption, () => 'X')
      
      expect(result).toBe('Start X End')
    })

    it('should handle adjacent references', () => {
      const caption = '[[A]][[B]]'
      const result = replaceReferences(caption, (ref) => ref.title.toLowerCase())
      
      expect(result).toBe('ab')
    })
  })

  describe('referencePattern', () => {
    it('should be a global regex', () => {
      expect(referencePattern.global).toBe(true)
    })

    it('should match basic reference', () => {
      referencePattern.lastIndex = 0
      const match = referencePattern.exec('[[Title]]')
      
      expect(match).not.toBeNull()
      expect(match![1]).toBe('Title')
    })

    it('should match reference with alias', () => {
      referencePattern.lastIndex = 0
      const match = referencePattern.exec('[[Title|Alias]]')
      
      expect(match).not.toBeNull()
      expect(match![1]).toBe('Title')
      expect(match![2]).toBe('Alias')
    })
  })
})
