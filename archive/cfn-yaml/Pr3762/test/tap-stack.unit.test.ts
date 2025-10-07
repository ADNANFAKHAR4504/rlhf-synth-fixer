import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Travel Platform CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Scalable Travel Platform API with Caching, Monitoring, and Event-Driven Integration'
      );
    });

    test('should not contain hardcoded account IDs', () => {
      const templateString = JSON.stringify(template);
      expect(templateString).not.toMatch(/\b\d{12}\b/);
    });
  });

  describe('Parameters', () => {
    test('should have required parameters', () => {
      const expectedParams = ['EnvironmentSuffix', 'CacheNodeType'];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });
  });

  describe('Core Resources', () => {
    test('should have TravelDataTable', () => {
      const table = template.Resources.TravelDataTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have Lambda functions', () => {
      const searchLambda = template.Resources.SearchLambdaFunction;
      expect(searchLambda).toBeDefined();
      expect(searchLambda.Type).toBe('AWS::Lambda::Function');
    });
  });

  describe('Required Tags', () => {
    test('taggable resources should have iac-rlhf-amazon tag', () => {
      const resources = template.Resources;
      const taggedResources = Object.keys(resources).filter(key => {
        const resource = resources[key];
        return resource.Properties?.Tags;
      });

      if (taggedResources.length > 0) {
        taggedResources.forEach(resourceName => {
          const resource = resources[resourceName];
          const tags = resource.Properties.Tags;
          const hasRequiredTag = tags.some((tag: any) =>
            tag.Key === 'iac-rlhf-amazon' && tag.Value === 'true'
          );
          expect(hasRequiredTag).toBe(true);
        });
      }
    });
  });

  describe('Lambda Functions Real-World Use Cases', () => {
    test('should have meaningful Lambda function descriptions', () => {
      const lambdas = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::Lambda::Function')
        .map(key => template.Resources[key]);

      expect(lambdas.length).toBeGreaterThan(0);

      lambdas.forEach(lambda => {
        expect(lambda.Properties.Description).toBeDefined();
        expect(lambda.Properties.Description.length).toBeGreaterThan(10);

        const description = lambda.Properties.Description.toLowerCase();
        expect(description).not.toContain('hello world');

        const businessKeywords = ['search', 'cost', 'monitoring', 'process', 'travel', 'api', 'cache'];
        const hasBusinessKeyword = businessKeywords.some(keyword =>
          description.includes(keyword)
        );
        expect(hasBusinessKeyword).toBe(true);
      });
    });
  });
});
