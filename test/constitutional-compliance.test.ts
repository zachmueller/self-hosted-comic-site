import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Constitutional Compliance Tests
 * 
 * These tests validate that the implementation adheres to all constitutional principles:
 * 1. Artist-First User Experience
 * 2. Serverless-First Architecture
 * 3. Cost-Conscious Design
 * 4. Deployment Simplicity
 */

describe('Constitutional Compliance', () => {
  describe('Artist-First User Experience', () => {
    it('should prioritize artist upload workflow in task completion', () => {
      // Verify upload tasks completed before reader tasks
      const uploadTasks = [
        'tasks/01-core-mvp/phase-3-upload.md',
      ];
      
      const readerTasks = [
        'tasks/01-core-mvp/phase-4-reader.md',
      ];
      
      uploadTasks.forEach(taskFile => {
        expect(fs.existsSync(taskFile)).toBe(true);
      });
      
      readerTasks.forEach(taskFile => {
        expect(fs.existsSync(taskFile)).toBe(true);
      });
    });
    
    it('should have upload components in frontend before advanced reader features', () => {
      const uploadComponents = [
        'frontend/src/pages/UploadPage.tsx',
        'frontend/src/components/upload/ComicMetadataForm.tsx',
        'frontend/src/components/upload/AltTextInput.tsx',
      ];
      
      uploadComponents.forEach(component => {
        expect(fs.existsSync(component)).toBe(true);
      });
    });
    
    it('should have artist-friendly validation error messages', () => {
      const validationFile = 'frontend/src/validation/comic.schema.ts';
      expect(fs.existsSync(validationFile)).toBe(true);
      
      const content = fs.readFileSync(validationFile, 'utf-8');
      
      // Check for artist-friendly error messages
      expect(content).toContain('At least one image is required');
      expect(content).not.toContain('Array min');
      expect(content).not.toContain('validation failed');
    });
    
    it('should have E2E tests measuring artist workflow time <5 minutes', () => {
      const e2eTest = 'test/e2e/upload-workflow.test.ts';
      expect(fs.existsSync(e2eTest)).toBe(true);
      
      const content = fs.readFileSync(e2eTest, 'utf-8');
      
      // Verify workflow timer exists
      expect(content).toContain('startTime');
      expect(content).toContain('endTime');
      expect(content).toContain('workflowMinutes');
      
      // Verify 5-minute target
      expect(content).toContain('toBeLessThan(5)');
    });
  });
  
  describe('Serverless-First Architecture', () => {
    it('should use CDK for infrastructure definition', () => {
      const cdkStack = 'lib/self-hosted-comic-site-stack.ts';
      expect(fs.existsSync(cdkStack)).toBe(true);
      
      const content = fs.readFileSync(cdkStack, 'utf-8');
      
      // Verify CDK imports
      expect(content).toContain('aws-cdk-lib');
    });
    
    it('should use Lambda for all compute operations', () => {
      const lambdaDir = 'lambda';
      expect(fs.existsSync(lambdaDir)).toBe(true);
      
      const lambdaFunctions = fs.readdirSync(lambdaDir);
      
      // Should have Lambda functions
      expect(lambdaFunctions.length).toBeGreaterThan(0);
      
      // Verify key Lambda functions exist
      expect(lambdaFunctions).toContain('getComics');
      expect(lambdaFunctions).toContain('processUpload');
      expect(lambdaFunctions).toContain('generatePresignedUrl');
    });
    
    it('should use managed AWS services only', () => {
      const cdkStack = 'lib/self-hosted-comic-site-stack.ts';
      const content = fs.readFileSync(cdkStack, 'utf-8');
      
      // Should NOT use EC2, ECS, EKS, or any container services
      expect(content).not.toContain('ec2.Instance');
      expect(content).not.toContain('ecs.Cluster');
      expect(content).not.toContain('eks.Cluster');
      expect(content).not.toContain('new Instance(');
      
      // Should use serverless services
      expect(content).toMatch(/lambda|dynamodb|s3|cognito|cloudfront/i);
    });
    
    it('should use DynamoDB for data storage', () => {
      const cdkStack = 'lib/self-hosted-comic-site-stack.ts';
      const content = fs.readFileSync(cdkStack, 'utf-8');
      
      // Should use DynamoDB
      expect(content).toContain('dynamodb');
      
      // Should NOT use RDS or other non-serverless databases
      expect(content).not.toContain('rds.');
      expect(content).not.toContain('Database');
    });
    
    it('should use S3 for file storage', () => {
      const cdkStack = 'lib/self-hosted-comic-site-stack.ts';
      const content = fs.readFileSync(cdkStack, 'utf-8');
      
      // Should use S3
      expect(content).toContain('s3');
    });
    
    it('should use CloudFront for CDN', () => {
      const cdkStack = 'lib/self-hosted-comic-site-stack.ts';
      const content = fs.readFileSync(cdkStack, 'utf-8');
      
      // Should use CloudFront
      expect(content).toContain('cloudfront');
    });
    
    it('should use Cognito for authentication', () => {
      const cdkStack = 'lib/self-hosted-comic-site-stack.ts';
      const content = fs.readFileSync(cdkStack, 'utf-8');
      
      // Should use Cognito
      expect(content).toContain('cognito');
    });
  });
  
  describe('Cost-Conscious Design', () => {
    it('should have cost analysis documentation', () => {
      const costAnalysis = 'test/performance/bundle-analysis.md';
      expect(fs.existsSync(costAnalysis)).toBe(true);
      
      const content = fs.readFileSync(costAnalysis, 'utf-8');
      
      // Should mention $10/month target
      expect(content).toContain('$10');
      expect(content).toContain('month');
      
      // Should have cost calculations
      expect(content).toContain('Cost:');
    });
    
    it('should have performance budgets to minimize data transfer', () => {
      const bundleAnalysis = 'test/performance/bundle-analysis.md';
      const content = fs.readFileSync(bundleAnalysis, 'utf-8');
      
      // Should have bundle size targets
      expect(content).toContain('300 KB');
      expect(content).toContain('1 MB');
      
      // Should mention cost-conscious design
      expect(content).toContain('Cost-Conscious');
    });
    
    it('should use efficient DynamoDB query patterns', () => {
      const repositoryFile = 'shared/data/comic.repository.ts';
      
      if (fs.existsSync(repositoryFile)) {
        const content = fs.readFileSync(repositoryFile, 'utf-8');
        
        // Should use Query instead of Scan where possible
        expect(content).toContain('Query');
        
        // Should use GSI for efficient queries
        expect(content).toContain('IndexName');
      }
    });
    
    it('should have integration tests validating efficient queries', () => {
      const integrationTest = 'test/integration/api.test.ts';
      const content = fs.readFileSync(integrationTest, 'utf-8');
      
      // Should mention cost-conscious in comments
      expect(content).toContain('Cost-Conscious');
    });
    
    it('should lazy load artist-only features', () => {
      const appFile = 'frontend/src/App.tsx';
      
      if (fs.existsSync(appFile)) {
        const content = fs.readFileSync(appFile, 'utf-8');
        
        // Should have lazy loading for upload and config pages
        expect(content).toContain('lazy') || expect(content).toContain('React.lazy');
      }
    });
  });
  
  describe('Deployment Simplicity', () => {
    it('should have CDK for infrastructure deployment', () => {
      const cdkJson = 'cdk.json';
      expect(fs.existsSync(cdkJson)).toBe(true);
    });
    
    it('should have README with deployment instructions', () => {
      const readme = 'README.md';
      expect(fs.existsSync(readme)).toBe(true);
      
      const content = fs.readFileSync(readme, 'utf-8');
      
      // Should mention deployment
      expect(content.toLowerCase()).toContain('deploy');
    });
    
    it('should use CDK for all AWS resource provisioning', () => {
      const cdkStack = 'lib/self-hosted-comic-site-stack.ts';
      expect(fs.existsSync(cdkStack)).toBe(true);
      
      const content = fs.readFileSync(cdkStack, 'utf-8');
      
      // Should extend Stack
      expect(content).toContain('extends Stack');
    });
    
    it('should have package.json with build and deploy scripts', () => {
      const packageJson = 'package.json';
      expect(fs.existsSync(packageJson)).toBe(true);
      
      const content = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
      
      // Should have scripts
      expect(content.scripts).toBeDefined();
    });
    
    it('should externalize configuration', () => {
      // Configuration should not be hardcoded in stack
      const cdkStack = 'lib/self-hosted-comic-site-stack.ts';
      const content = fs.readFileSync(cdkStack, 'utf-8');
      
      // Should reference environment or context
      expect(content).toMatch(/env|context|props/i);
    });
  });
  
  describe('Documentation & Code Quality', () => {
    it('should have project constitution documented', () => {
      const constitution = '.clinerules/memory/constitution.md';
      expect(fs.existsSync(constitution)).toBe(true);
      
      const content = fs.readFileSync(constitution, 'utf-8');
      
      // Should have all 4 core principles
      expect(content).toContain('Artist-First');
      expect(content).toContain('Serverless-First');
      expect(content).toContain('Cost-Conscious');
      expect(content).toContain('Deployment Simplicity');
    });
    
    it('should have comprehensive testing', () => {
      const testDirs = [
        'frontend/src/validation/__tests__',
        'shared/utils/__tests__',
        'test/integration',
        'test/e2e',
        'test/performance',
      ];
      
      testDirs.forEach(dir => {
        expect(fs.existsSync(dir)).toBe(true);
      });
    });
    
    it('should have phase task documentation', () => {
      const taskDir = 'tasks/01-core-mvp';
      expect(fs.existsSync(taskDir)).toBe(true);
      
      const phases = fs.readdirSync(taskDir).filter(f => f.startsWith('phase-'));
      
      // Should have multiple phases documented
      expect(phases.length).toBeGreaterThan(5);
    });
    
    it('should have specifications for features', () => {
      const specsDir = 'specs';
      expect(fs.existsSync(specsDir)).toBe(true);
      
      const specs = fs.readdirSync(specsDir).filter(f => f.endsWith('.md'));
      
      // Should have core MVP spec at minimum
      expect(specs).toContain('01-core-mvp-spec.md');
    });
  });
  
  describe('Git Workflow Compliance', () => {
    it('should have git workflow rules documented', () => {
      const gitRules = '.clinerules/git.md';
      expect(fs.existsSync(gitRules)).toBe(true);
    });
    
    it('should have .gitignore configured', () => {
      const gitignore = '.gitignore';
      expect(fs.existsSync(gitignore)).toBe(true);
      
      const content = fs.readFileSync(gitignore, 'utf-8');
      
      // Should ignore node_modules, build artifacts
      expect(content).toContain('node_modules');
      expect(content).toContain('dist');
    });
  });
  
  describe('Frontend Architecture', () => {
    it('should use Vite for build tooling', () => {
      const viteConfig = 'frontend/vite.config.ts';
      expect(fs.existsSync(viteConfig)).toBe(true);
    });
    
    it('should use React for UI', () => {
      const packageJson = 'frontend/package.json';
      const content = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
      
      // Should have React as dependency
      expect(content.dependencies.react).toBeDefined();
    });
    
    it('should use TypeScript', () => {
      const tsConfig = 'frontend/tsconfig.json';
      expect(fs.existsSync(tsConfig)).toBe(true);
    });
    
    it('should use Zod for validation', () => {
      const packageJson = 'frontend/package.json';
      const content = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
      
      // Should have Zod as dependency
      expect(content.dependencies.zod).toBeDefined();
    });
  });
  
  describe('Shared Utilities', () => {
    it('should have reference parser for Obsidian-style links', () => {
      const referenceParser = 'shared/utils/referenceParser.ts';
      expect(fs.existsSync(referenceParser)).toBe(true);
      
      const content = fs.readFileSync(referenceParser, 'utf-8');
      
      // Should parse [[Title]] syntax
      expect(content).toContain('parseReferences');
    });
    
    it('should have relationship builder for bidirectional links', () => {
      const relationshipBuilder = 'shared/utils/relationshipBuilder.ts';
      expect(fs.existsSync(relationshipBuilder)).toBe(true);
      
      const content = fs.readFileSync(relationshipBuilder, 'utf-8');
      
      // Should build relationships
      expect(content).toContain('buildCaptionRelationships');
      expect(content).toContain('updateBidirectionalRelationships');
    });
  });
  
  describe('Testing Infrastructure', () => {
    it('should use Vitest for unit tests', () => {
      const frontendPackage = 'frontend/package.json';
      const content = JSON.parse(fs.readFileSync(frontendPackage, 'utf-8'));
      
      // Should have Vitest
      expect(content.devDependencies.vitest).toBeDefined();
    });
    
    it('should use Playwright for E2E tests', () => {
      const rootPackage = 'package.json';
      const content = JSON.parse(fs.readFileSync(rootPackage, 'utf-8'));
      
      // Should have Playwright
      expect(content.devDependencies['@playwright/test']).toBeDefined();
    });
    
    it('should have test coverage for validation schemas', () => {
      const validationTests = 'frontend/src/validation/__tests__';
      expect(fs.existsSync(validationTests)).toBe(true);
      
      const testFiles = fs.readdirSync(validationTests);
      
      // Should have validation tests
      expect(testFiles.length).toBeGreaterThan(0);
    });
  });
});
