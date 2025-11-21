import { describe, it, expect } from 'vitest';
import {
  extractContext,
  buildCaptionRelationships,
  buildTagRelationships,
  deduplicateRelationships,
  buildComicRelationships,
  updateBidirectionalRelationships,
  type Comic,
  type ComicLookup,
  type DerivedRelationship,
} from '../relationshipBuilder';

describe('extractContext', () => {
  it('should extract context around a reference with indices', () => {
    const caption = 'This is a story about [[Hero]] who saves the day.';
    const referenceIndex = 22; // Position of [[Hero]]
    const referenceLength = 8; // Length of [[Hero]]
    const result = extractContext(caption, referenceIndex, referenceLength, 20);
    expect(result).toContain('[[Hero]]');
    // With contextLength=20, this extracts a good portion of the caption
    expect(result).toBeTruthy();
  });

  it('should add ellipsis when truncating beginning', () => {
    const caption = 'This is a very long story about [[Hero]] who saves the day.';
    const referenceIndex = 32;
    const referenceLength = 8;
    const result = extractContext(caption, referenceIndex, referenceLength, 10);
    expect(result).toMatch(/^\.\.\./);
  });

  it('should add ellipsis when truncating end', () => {
    const caption = '[[Hero]] saves the day in this exciting adventure story.';
    const referenceIndex = 0;
    const referenceLength = 8;
    const result = extractContext(caption, referenceIndex, referenceLength, 10);
    expect(result).toMatch(/\.\.\.$/);
  });

  it('should handle reference at start of caption', () => {
    const caption = '[[Hero]] wins';
    const referenceIndex = 0;
    const referenceLength = 8;
    const result = extractContext(caption, referenceIndex, referenceLength, 20);
    expect(result).toBe('[[Hero]] wins');
  });

  it('should handle reference at end of caption', () => {
    const caption = 'The adventure continues with [[Hero]]';
    const referenceIndex = 29;
    const referenceLength = 8;
    const result = extractContext(caption, referenceIndex, referenceLength, 20);
    expect(result).toContain('[[Hero]]');
  });

  it('should respect context length parameter', () => {
    const caption = 'A very long caption about [[Hero]] with lots of text around it for context extraction testing.';
    const referenceIndex = 26;
    const referenceLength = 8;
    const shortResult = extractContext(caption, referenceIndex, referenceLength, 10);
    const longResult = extractContext(caption, referenceIndex, referenceLength, 30);
    expect(longResult.length).toBeGreaterThan(shortResult.length);
  });
});

describe('buildCaptionRelationships', () => {
  it('should build relationships from caption references', () => {
    const sourceComic: Comic = {
      id: '1',
      title: 'Origin Story',
      caption: 'The origin of [[Hero]] begins here.',
    };

    const comicsByTitle: ComicLookup = {
      'Hero': { id: '2', title: 'Hero' },
    };

    const relationships = buildCaptionRelationships(sourceComic, comicsByTitle);

    expect(relationships).toHaveLength(1);
    expect(relationships[0].targetComicId).toBe('2');
    expect(relationships[0].sourceType).toBe('caption');
    expect(relationships[0].context).toContain('[[Hero]]');
  });

  it('should handle multiple references in one caption', () => {
    const sourceComic: Comic = {
      id: '1',
      title: 'Team Up',
      caption: 'When [[Hero]] meets [[Villain]], chaos ensues.',
    };

    const comicsByTitle: ComicLookup = {
      'Hero': { id: '2', title: 'Hero' },
      'Villain': { id: '3', title: 'Villain' },
    };

    const relationships = buildCaptionRelationships(sourceComic, comicsByTitle);

    expect(relationships).toHaveLength(2);
    expect(relationships.find(r => r.targetComicId === '2')).toBeDefined();
    expect(relationships.find(r => r.targetComicId === '3')).toBeDefined();
  });

  it('should handle aliased references', () => {
    const sourceComic: Comic = {
      id: '1',
      title: 'Team Up',
      caption: 'When [[Captain America|Cap]] appears.',
    };

    const comicsByTitle: ComicLookup = {
      'Captain America': { id: '2', title: 'Captain America' },
    };

    const relationships = buildCaptionRelationships(sourceComic, comicsByTitle);

    expect(relationships).toHaveLength(1);
    expect(relationships[0].targetComicId).toBe('2');
  });

  it('should ignore references to non-existent comics', () => {
    const sourceComic: Comic = {
      id: '1',
      title: 'Team Up',
      caption: 'Mentions [[Non Existent Comic]] here.',
    };

    const comicsByTitle: ComicLookup = {
      'Hero': { id: '2', title: 'Hero' },
    };

    const relationships = buildCaptionRelationships(sourceComic, comicsByTitle);

    expect(relationships).toHaveLength(0);
  });

  it('should handle comics with no caption', () => {
    const sourceComic: Comic = {
      id: '1',
      title: 'Comic One',
    };

    const comicsByTitle: ComicLookup = {
      'Hero': { id: '2', title: 'Hero' },
    };

    const relationships = buildCaptionRelationships(sourceComic, comicsByTitle);

    expect(relationships).toHaveLength(0);
  });

  it('should not create self-referential relationships', () => {
    const sourceComic: Comic = {
      id: '1',
      title: 'Hero',
      caption: 'This is about [[Hero]] himself.',
    };

    const comicsByTitle: ComicLookup = {
      'Hero': { id: '1', title: 'Hero' },
    };

    const relationships = buildCaptionRelationships(sourceComic, comicsByTitle);

    expect(relationships).toHaveLength(0);
  });
});

describe('buildTagRelationships', () => {
  it('should build relationships from shared tags', () => {
    const sourceComic: Comic = {
      id: '1',
      title: 'Comic One',
      tags: ['adventure', 'hero'],
    };

    const comicsByTag = new Map<string, Comic[]>([
      ['adventure', [
        { id: '1', title: 'Comic One', tags: ['adventure'] },
        { id: '2', title: 'Comic Two', tags: ['adventure'] },
      ]],
    ]);

    const relationships = buildTagRelationships(sourceComic, comicsByTag);

    expect(relationships.length).toBeGreaterThan(0);
    expect(relationships[0].sourceType).toBe('tag');
    expect(relationships[0].context).toContain('Shared tag:');
  });

  it('should not create self-referential relationships', () => {
    const sourceComic: Comic = {
      id: '1',
      title: 'Comic One',
      tags: ['adventure'],
    };

    const comicsByTag = new Map<string, Comic[]>([
      ['adventure', [
        { id: '1', title: 'Comic One', tags: ['adventure'] },
      ]],
    ]);

    const relationships = buildTagRelationships(sourceComic, comicsByTag);

    expect(relationships).toHaveLength(0);
  });

  it('should handle comics with no tags', () => {
    const sourceComic: Comic = {
      id: '1',
      title: 'Comic One',
    };

    const comicsByTag = new Map<string, Comic[]>();

    const relationships = buildTagRelationships(sourceComic, comicsByTag);

    expect(relationships).toHaveLength(0);
  });

  it('should respect maxRelationships parameter', () => {
    const sourceComic: Comic = {
      id: '1',
      title: 'Comic One',
      tags: ['popular'],
    };

    const manyComics: Comic[] = [];
    for (let i = 2; i <= 20; i++) {
      manyComics.push({ id: `${i}`, title: `Comic ${i}`, tags: ['popular'] });
    }

    const comicsByTag = new Map<string, Comic[]>([
      ['popular', [sourceComic, ...manyComics]],
    ]);

    const relationships = buildTagRelationships(sourceComic, comicsByTag, 3);

    expect(relationships.length).toBeLessThanOrEqual(3);
  });

  it('should not duplicate relationships for same comic', () => {
    const sourceComic: Comic = {
      id: '1',
      title: 'Comic One',
      tags: ['adventure', 'action'],
    };

    const targetComic: Comic = {
      id: '2',
      title: 'Comic Two',
      tags: ['adventure', 'action'],
    };

    const comicsByTag = new Map<string, Comic[]>([
      ['adventure', [sourceComic, targetComic]],
      ['action', [sourceComic, targetComic]],
    ]);

    const relationships = buildTagRelationships(sourceComic, comicsByTag);

    // Should only have one relationship to Comic Two, not two
    const comicTwoRels = relationships.filter(r => r.targetComicId === '2');
    expect(comicTwoRels).toHaveLength(1);
  });
});

describe('deduplicateRelationships', () => {
  it('should keep caption relationships over series and tag', () => {
    const relationships: DerivedRelationship[] = [
      { targetComicId: '2', sourceType: 'tag', context: 'tag' },
      { targetComicId: '2', sourceType: 'caption', context: 'caption' },
      { targetComicId: '2', sourceType: 'series', context: 'series' },
    ];

    const result = deduplicateRelationships(relationships);

    expect(result).toHaveLength(1);
    expect(result[0].sourceType).toBe('caption');
  });

  it('should keep series relationships over tag', () => {
    const relationships: DerivedRelationship[] = [
      { targetComicId: '2', sourceType: 'tag', context: 'tag' },
      { targetComicId: '2', sourceType: 'series', context: 'series' },
    ];

    const result = deduplicateRelationships(relationships);

    expect(result).toHaveLength(1);
    expect(result[0].sourceType).toBe('series');
  });

  it('should keep all unique relationships', () => {
    const relationships: DerivedRelationship[] = [
      { targetComicId: '2', sourceType: 'caption' },
      { targetComicId: '3', sourceType: 'caption' },
      { targetComicId: '4', sourceType: 'tag' },
    ];

    const result = deduplicateRelationships(relationships);

    expect(result).toHaveLength(3);
  });

  it('should handle empty array', () => {
    const result = deduplicateRelationships([]);
    expect(result).toHaveLength(0);
  });

  it('should use priority order: caption > series > tag', () => {
    const relationships: DerivedRelationship[] = [
      { targetComicId: '2', sourceType: 'series' },
      { targetComicId: '2', sourceType: 'tag' },
      { targetComicId: '2', sourceType: 'caption' },
      { targetComicId: '3', sourceType: 'tag' },
      { targetComicId: '3', sourceType: 'series' },
    ];

    const result = deduplicateRelationships(relationships);

    expect(result).toHaveLength(2);
    expect(result.find(r => r.targetComicId === '2')?.sourceType).toBe('caption');
    expect(result.find(r => r.targetComicId === '3')?.sourceType).toBe('series');
  });
});

describe('buildComicRelationships', () => {
  it('should combine caption and tag relationships', () => {
    const sourceComic: Comic = {
      id: '1',
      title: 'Comic One',
      caption: 'References [[Comic Two]]',
      tags: ['adventure'],
    };

    const comicsByTitle: ComicLookup = {
      'Comic Two': { id: '2', title: 'Comic Two', tags: ['adventure'] },
    };

    const comicsByTag = new Map<string, Comic[]>([
      ['adventure', [sourceComic, { id: '2', title: 'Comic Two', tags: ['adventure'] }]],
    ]);

    const relationships = buildComicRelationships(sourceComic, comicsByTitle, comicsByTag);

    expect(relationships.length).toBeGreaterThan(0);
    // Caption should take priority over tag for same comic
    const comicTwoRel = relationships.find(r => r.targetComicId === '2');
    expect(comicTwoRel?.sourceType).toBe('caption');
  });

  it('should handle comics with no relationships', () => {
    const sourceComic: Comic = {
      id: '1',
      title: 'Comic One',
    };

    const comicsByTitle: ComicLookup = {};
    const comicsByTag = new Map<string, Comic[]>();

    const relationships = buildComicRelationships(sourceComic, comicsByTitle, comicsByTag);

    expect(relationships).toHaveLength(0);
  });

  it('should deduplicate relationships automatically', () => {
    const sourceComic: Comic = {
      id: '1',
      title: 'Comic One',
      caption: 'References [[Comic Two]]',
      tags: ['adventure'],
    };

    const comicsByTitle: ComicLookup = {
      'Comic Two': { id: '2', title: 'Comic Two', tags: ['adventure'] },
    };

    const comicsByTag = new Map<string, Comic[]>([
      ['adventure', [
        sourceComic,
        { id: '2', title: 'Comic Two', tags: ['adventure'] },
      ]],
    ]);

    const relationships = buildComicRelationships(sourceComic, comicsByTitle, comicsByTag);

    // Should only have one relationship to Comic Two
    const comicTwoRels = relationships.filter(r => r.targetComicId === '2');
    expect(comicTwoRels).toHaveLength(1);
  });
});

describe('updateBidirectionalRelationships', () => {
  it('should add relationships to comics', () => {
    const comics: Comic[] = [
      { id: '1', title: 'Comic One', caption: 'References [[Comic Two]]' },
      { id: '2', title: 'Comic Two' },
    ];

    const updated = updateBidirectionalRelationships(comics);

    expect(updated[0].derivedRelationships).toBeDefined();
    expect(updated[0].derivedRelationships!.length).toBeGreaterThan(0);
  });

  it('should create bidirectional relationships', () => {
    const comics: Comic[] = [
      { id: '1', title: 'Comic One', caption: 'References [[Comic Two]]' },
      { id: '2', title: 'Comic Two' },
    ];

    const updated = updateBidirectionalRelationships(comics);

    // Forward relationship
    const forwardRel = updated[0].derivedRelationships?.find(r => r.targetComicId === '2');
    expect(forwardRel).toBeDefined();

    // Reverse relationship
    const reverseRel = updated[1].derivedRelationships?.find(r => r.targetComicId === '1');
    expect(reverseRel).toBeDefined();
    expect(reverseRel?.context).toContain('Referenced by');
  });

  it('should handle multiple relationships per comic', () => {
    const comics: Comic[] = [
      { id: '1', title: 'Comic One', caption: 'References [[Comic Two]] and [[Comic Three]]' },
      { id: '2', title: 'Comic Two' },
      { id: '3', title: 'Comic Three' },
    ];

    const updated = updateBidirectionalRelationships(comics);

    expect(updated[0].derivedRelationships!.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle comics with no relationships', () => {
    const comics: Comic[] = [
      { id: '1', title: 'Comic One' },
      { id: '2', title: 'Comic Two' },
    ];

    const updated = updateBidirectionalRelationships(comics);

    // Comics with no relationships should have empty or undefined derivedRelationships
    expect(updated[0].derivedRelationships?.length || 0).toBe(0);
    expect(updated[1].derivedRelationships?.length || 0).toBe(0);
  });

  it('should deduplicate bidirectional relationships', () => {
    const comics: Comic[] = [
      { id: '1', title: 'Comic One', caption: 'References [[Comic Two]]', tags: ['adventure'] },
      { id: '2', title: 'Comic Two', tags: ['adventure'] },
    ];

    const updated = updateBidirectionalRelationships(comics);

    // Should have relationships but deduplicated
    const comic1Rels = updated[0].derivedRelationships?.filter(r => r.targetComicId === '2') || [];
    expect(comic1Rels.length).toBe(1);
    expect(comic1Rels[0].sourceType).toBe('caption'); // Caption takes priority
  });

  it('should preserve existing comic data', () => {
    const comics: Comic[] = [
      { id: '1', title: 'Comic One', caption: 'Test caption' },
      { id: '2', title: 'Comic Two', tags: ['test'] },
    ];

    const updated = updateBidirectionalRelationships(comics);

    expect(updated[0].title).toBe('Comic One');
    expect(updated[0].caption).toBe('Test caption');
    expect(updated[1].title).toBe('Comic Two');
    expect(updated[1].tags).toEqual(['test']);
  });
});
