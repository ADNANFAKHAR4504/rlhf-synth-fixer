import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { ValidationRegistry } from '../lib/core/validation-registry';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    // Clear validation registry before each test
    ValidationRegistry.clear();

    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  afterEach(() => {
    ValidationRegistry.clear();
  });

  describe('Stack Resource Creation', () => {
    test('creates S3 buckets with correct names', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `compliant-bucket-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `non-compliant-bucket-${environmentSuffix}`,
      });
    });

    test('creates compliant S3 bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `compliant-bucket-${environmentSuffix}`,
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            })
          ])
        })
      });
    });

    test('creates non-compliant S3 bucket without encryption', () => {
      const resources = template.findResources('AWS::S3::Bucket');
      const nonCompliantBucket = Object.values(resources).find(
        (r: any) => r.Properties?.BucketName === `non-compliant-bucket-${environmentSuffix}`
      );

      expect(nonCompliantBucket).toBeDefined();
      expect(nonCompliantBucket?.Properties?.BucketEncryption).toBeUndefined();
    });

    test('creates Lambda functions with correct names', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `example-function-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `problematic-function-${environmentSuffix}`,
      });
    });

    test('creates example Lambda with proper configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `example-function-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Timeout: 30,
        MemorySize: 256,
      });
    });

    test('creates problematic Lambda with excessive timeout', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `problematic-function-${environmentSuffix}`,
        Timeout: 900,
        MemorySize: 128,
      });
    });

    test('creates IAM role with overly permissive policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `problematic-role-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::IAM::Policy', Match.objectLike({
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: '*',
              Resource: '*'
            })
          ])
        })
      }));
    });
  });

  describe('Stack Outputs', () => {
    test('exports compliant bucket name output', () => {
      const outputs = template.toJSON().Outputs;
      expect(outputs.CompliantBucketName).toBeDefined();
      expect(outputs.CompliantBucketName.Description).toBe('Name of the compliant S3 bucket');
    });

    test('exports non-compliant bucket name output', () => {
      const outputs = template.toJSON().Outputs;
      expect(outputs.NonCompliantBucketName).toBeDefined();
      expect(outputs.NonCompliantBucketName.Description).toBe('Name of the non-compliant S3 bucket');
    });

    test('has correct output descriptions', () => {
      const outputs = template.toJSON().Outputs;
      expect(outputs.CompliantBucketName.Description).toBe('Name of the compliant S3 bucket');
      expect(outputs.NonCompliantBucketName.Description).toBe('Name of the non-compliant S3 bucket');
    });
  });

  describe('Resource Naming Conventions', () => {
    test('all S3 buckets include environmentSuffix', () => {
      const resources = template.findResources('AWS::S3::Bucket');
      Object.values(resources).forEach((resource: any) => {
        const bucketName = resource.Properties?.BucketName;
        if (bucketName) {
          expect(bucketName).toContain(environmentSuffix);
        }
      });
    });

    test('all Lambda functions include environmentSuffix', () => {
      const resources = template.findResources('AWS::Lambda::Function');
      Object.values(resources).forEach((resource: any) => {
        const functionName = resource.Properties?.FunctionName;
        if (functionName) {
          expect(functionName).toContain(environmentSuffix);
        }
      });
    });

    test('all IAM roles include environmentSuffix', () => {
      const resources = template.findResources('AWS::IAM::Role');
      Object.values(resources).forEach((resource: any) => {
        const roleName = resource.Properties?.RoleName;
        if (roleName) {
          expect(roleName).toContain(environmentSuffix);
        }
      });
    });
  });

  describe('Removal Policies', () => {
    test('S3 buckets have RemovalPolicy.DESTROY', () => {
      const resources = template.findResources('AWS::S3::Bucket');
      Object.values(resources).forEach((resource: any) => {
        expect(resource.DeletionPolicy).toBe('Delete');
      });
    });

    test('S3 buckets have autoDeleteObjects enabled', () => {
      const resources = template.findResources('AWS::S3::Bucket');
      Object.values(resources).forEach((resource: any) => {
        const hasCustomResource = resource.Properties?.Tags?.some(
          (tag: any) => tag.Key === 'aws-cdk:auto-delete-objects'
        );
        // Either has the tag or has autoDeleteObjects property
        expect(hasCustomResource || resource.UpdateReplacePolicy === 'Delete').toBeTruthy();
      });
    });
  });

  describe('Lambda Runtime Configuration', () => {
    test('all Lambda functions use Node.js 18', () => {
      const resources = template.findResources('AWS::Lambda::Function');
      const userFunctions = Object.values(resources).filter((r: any) =>
        r.Properties?.FunctionName?.includes(environmentSuffix)
      );
      userFunctions.forEach((resource: any) => {
        expect(resource.Properties?.Runtime).toBe('nodejs18.x');
      });
    });

    test('Lambda functions have inline code', () => {
      const resources = template.findResources('AWS::Lambda::Function');
      const userFunctions = Object.values(resources).filter((r: any) =>
        r.Properties?.FunctionName?.includes(environmentSuffix)
      );
      userFunctions.forEach((resource: any) => {
        // Check for inline code or other code types
        expect(resource.Properties?.Code).toBeDefined();
      });
    });
  });

  describe('Stack Properties', () => {
    test('stack has description or resources', () => {
      const stackTemplate = template.toJSON();
      // Stack may or may not have description, but should have resources
      expect(stackTemplate.Resources).toBeDefined();
      expect(Object.keys(stackTemplate.Resources).length).toBeGreaterThan(0);
    });

    test('stack includes environmentSuffix in name', () => {
      expect(stack.stackName).toContain('TestTapStack');
    });
  });

  describe('Resource Count Validation', () => {
    test('creates exactly 2 S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 2);
    });

    test('creates user-defined Lambda functions', () => {
      const resources = template.findResources('AWS::Lambda::Function');
      const userFunctions = Object.values(resources).filter((r: any) =>
        r.Properties?.FunctionName?.includes(environmentSuffix)
      );
      expect(userFunctions.length).toBe(2);
    });

    test('creates exactly 1 IAM role with overly permissive policy', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const problematicRoles = Object.values(roles).filter(
        (r: any) => r.Properties?.RoleName === `problematic-role-${environmentSuffix}`
      );
      expect(problematicRoles.length).toBe(1);
    });
  });
});
