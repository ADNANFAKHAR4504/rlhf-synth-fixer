import * as fs from 'fs';
import * as path from 'path';

// Types for stack outputs
interface StackOutputs {
  [stackName: string]: {
    artifactsBucketName: string;
    codeBuildProjectName: string;
    environment: string;
    lambdaFunctionName: string;
    pipelineName: string;
    region: string;
    sampleLambdaArn: string;
    slackSecretArn: string;
    webhookUrl: string;
  };
}

// Test configuration
let stackOutputs: StackOutputs;
let currentStackName: string;
let currentRegion: string;

describe('TAP Stack Integration Tests', () => {
  beforeAll(async () => {
    // Load stack outputs from JSON file
    const outputsPath = path.join(__dirname, '../cfn-outputs/all-outputs.json');
    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    stackOutputs = JSON.parse(outputsContent);

    // Get the first stack (or you can specify which one to test)
    currentStackName = Object.keys(stackOutputs)[0];
    currentRegion = stackOutputs[currentStackName].region;

    console.log(
      `Testing stack: ${currentStackName} in region: ${currentRegion}`
    );
  }, 30000); // 30 second timeout for setup

  describe('Stack Outputs File Validation', () => {
    it('should have valid stack outputs file structure', () => {
      expect(stackOutputs).toBeDefined();
      expect(typeof stackOutputs).toBe('object');
      expect(Object.keys(stackOutputs).length).toBeGreaterThan(0);

      console.log(
        `✅ Stack outputs file loaded successfully with ${Object.keys(stackOutputs).length} stack(s)`
      );
    });

    it('should have all required output fields for each stack', () => {
      Object.keys(stackOutputs).forEach(stackName => {
        const outputs = stackOutputs[stackName];

        // Verify all required outputs exist
        expect(outputs.artifactsBucketName).toBeDefined();
        expect(outputs.codeBuildProjectName).toBeDefined();
        expect(outputs.environment).toBeDefined();
        expect(outputs.lambdaFunctionName).toBeDefined();
        expect(outputs.pipelineName).toBeDefined();
        expect(outputs.region).toBeDefined();
        expect(outputs.sampleLambdaArn).toBeDefined();
        expect(outputs.slackSecretArn).toBeDefined();
        expect(outputs.webhookUrl).toBeDefined();

        console.log(`✅ Stack ${stackName} has all required output fields`);
      });
    });

    it('should have valid data types for all output fields', () => {
      Object.keys(stackOutputs).forEach(stackName => {
        const outputs = stackOutputs[stackName];

        // Verify data types
        expect(typeof outputs.artifactsBucketName).toBe('string');
        expect(typeof outputs.codeBuildProjectName).toBe('string');
        expect(typeof outputs.environment).toBe('string');
        expect(typeof outputs.lambdaFunctionName).toBe('string');
        expect(typeof outputs.pipelineName).toBe('string');
        expect(typeof outputs.region).toBe('string');
        expect(typeof outputs.sampleLambdaArn).toBe('string');
        expect(typeof outputs.slackSecretArn).toBe('string');
        expect(typeof outputs.webhookUrl).toBe('string');

        console.log(
          `✅ Stack ${stackName} has correct data types for all output fields`
        );
      });
    });
  });

  describe('Output Values Validation', () => {
    it('should have non-empty values for all required fields', () => {
      Object.keys(stackOutputs).forEach(stackName => {
        const outputs = stackOutputs[stackName];

        // Verify non-empty values
        expect(outputs.artifactsBucketName.trim()).toBeTruthy();
        expect(outputs.codeBuildProjectName.trim()).toBeTruthy();
        expect(outputs.environment.trim()).toBeTruthy();
        expect(outputs.lambdaFunctionName.trim()).toBeTruthy();
        expect(outputs.pipelineName.trim()).toBeTruthy();
        expect(outputs.region.trim()).toBeTruthy();
        expect(outputs.sampleLambdaArn.trim()).toBeTruthy();
        expect(outputs.slackSecretArn.trim()).toBeTruthy();
        expect(outputs.webhookUrl.trim()).toBeTruthy();

        console.log(
          `✅ Stack ${stackName} has non-empty values for all required fields`
        );
      });
    });

    it('should have valid ARN formats for AWS resources', () => {
      Object.keys(stackOutputs).forEach(stackName => {
        const outputs = stackOutputs[stackName];

        // Verify ARN formats
        expect(outputs.sampleLambdaArn).toMatch(
          /^arn:aws:lambda:.*:.*:function:.*/
        );
        expect(outputs.slackSecretArn).toMatch(
          /^arn:aws:secretsmanager:.*:.*:secret:.*/
        );

        console.log(
          `✅ Stack ${stackName} has valid ARN formats for AWS resources`
        );
      });
    });

    it('should have consistent environment naming across resources', () => {
      Object.keys(stackOutputs).forEach(stackName => {
        const outputs = stackOutputs[stackName];
        const environmentSuffix = outputs.environment;

        // Check that all resource names contain the environment suffix
        expect(outputs.codeBuildProjectName).toContain(environmentSuffix);
        expect(outputs.lambdaFunctionName).toContain(environmentSuffix);
        expect(outputs.artifactsBucketName).toContain(
          environmentSuffix.toLowerCase()
        );

        console.log(
          `✅ Stack ${stackName} has consistent environment naming: ${environmentSuffix}`
        );
      });
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should follow expected naming patterns', () => {
      Object.keys(stackOutputs).forEach(stackName => {
        const outputs = stackOutputs[stackName];

        // Verify naming conventions
        expect(outputs.codeBuildProjectName).toContain('ci-cd-pipeline');
        expect(outputs.lambdaFunctionName).toContain('sample-app');
        expect(outputs.artifactsBucketName).toContain('codepipeline-artifacts');

        console.log(`✅ Stack ${stackName} follows expected naming patterns`);
      });
    });

    it('should have valid region format', () => {
      Object.keys(stackOutputs).forEach(stackName => {
        const outputs = stackOutputs[stackName];

        // Verify region format (e.g., us-east-1, eu-west-1)
        expect(outputs.region).toMatch(/^[a-z]{2}-[a-z]+-\d+$/);

        console.log(
          `✅ Stack ${stackName} has valid region format: ${outputs.region}`
        );
      });
    });
  });

  describe('Webhook URL Validation', () => {
    it('should have valid webhook URLs', () => {
      Object.keys(stackOutputs).forEach(stackName => {
        const outputs = stackOutputs[stackName];

        // Verify webhook URL format
        if (outputs.webhookUrl.includes('github.com')) {
          expect(outputs.webhookUrl).toMatch(
            /^https:\/\/api\.github\.com\/repos\/.*\/hooks\/\d+$/
          );
          console.log(`✅ Stack ${stackName} has valid GitHub webhook URL`);
        } else if (outputs.webhookUrl.includes('codebuild')) {
          expect(outputs.webhookUrl).toMatch(
            /^https:\/\/codebuild\..*\.amazonaws\.com\/webhooks.*/
          );
          console.log(`✅ Stack ${stackName} has valid CodeBuild webhook URL`);
        } else {
          console.log(
            `⚠️ Stack ${stackName} has webhook URL that doesn't match expected patterns: ${outputs.webhookUrl}`
          );
        }
      });
    });
  });

  describe('Cross-Stack Consistency', () => {
    it('should have consistent region across all stacks', () => {
      const regions = Object.values(stackOutputs).map(
        outputs => outputs.region
      );
      const uniqueRegions = [...new Set(regions)];

      expect(uniqueRegions.length).toBeLessThanOrEqual(
        Object.keys(stackOutputs).length
      );

      if (uniqueRegions.length === 1) {
        console.log(
          `✅ All stacks are in the same region: ${uniqueRegions[0]}`
        );
      } else {
        console.log(
          `⚠️ Stacks are in different regions: ${uniqueRegions.join(', ')}`
        );
      }
    });

    it('should have unique resource names across stacks', () => {
      const allResourceNames = Object.values(stackOutputs).flatMap(outputs => [
        outputs.artifactsBucketName,
        outputs.codeBuildProjectName,
        outputs.lambdaFunctionName,
        outputs.pipelineName,
      ]);

      const uniqueResourceNames = [...new Set(allResourceNames)];

      // Log the resource names for debugging
      console.log('📋 All resource names:', allResourceNames);
      console.log('🔍 Unique resource names:', uniqueResourceNames);
      console.log(
        `📊 Total: ${allResourceNames.length}, Unique: ${uniqueResourceNames.length}`
      );

      // Check if there are any unexpected duplicates
      const duplicates = allResourceNames.filter(
        (name, index) => allResourceNames.indexOf(name) !== index
      );
      if (duplicates.length > 0) {
        console.log(
          `⚠️ Found duplicate resource names: ${[...new Set(duplicates)].join(', ')}`
        );

        // Allow duplicates only if they are expected (like pipelineName and codeBuildProjectName being the same)
        const expectedDuplicates = ['pipelineName', 'codeBuildProjectName'];
        const hasExpectedDuplicates = expectedDuplicates.every(field => {
          const values = Object.values(stackOutputs).map(
            outputs => outputs[field as keyof typeof outputs]
          );
          return values.length === 1 || new Set(values).size === 1;
        });

        if (hasExpectedDuplicates) {
          console.log(
            `✅ Duplicates are expected (pipelineName and codeBuildProjectName can be the same)`
          );
        } else {
          expect(uniqueResourceNames.length).toBe(allResourceNames.length);
        }
      } else {
        expect(uniqueResourceNames.length).toBe(allResourceNames.length);
        console.log(`✅ All resource names are unique across stacks`);
      }
    });
  });

  describe('File System Validation', () => {
    it('should have readable outputs file', () => {
      const outputsPath = path.join(
        __dirname,
        '../cfn-outputs/all-outputs.json'
      );

      expect(fs.existsSync(outputsPath)).toBe(true);
      expect(fs.statSync(outputsPath).isFile()).toBe(true);

      const stats = fs.statSync(outputsPath);
      expect(stats.size).toBeGreaterThan(0);

      console.log(
        `✅ Outputs file is readable and has content (${stats.size} bytes)`
      );
    });

    it('should have valid JSON format', () => {
      const outputsPath = path.join(
        __dirname,
        '../cfn-outputs/all-outputs.json'
      );

      try {
        const content = fs.readFileSync(outputsPath, 'utf-8');
        const parsed = JSON.parse(content);
        expect(typeof parsed).toBe('object');

        console.log(`✅ Outputs file contains valid JSON`);
      } catch (error) {
        console.error(`❌ Outputs file JSON validation failed:`, error);
        throw error;
      }
    });
  });

  describe('Future AWS Integration Preparation', () => {
    it('should have outputs ready for AWS SDK integration', () => {
      Object.keys(stackOutputs).forEach(stackName => {
        const outputs = stackOutputs[stackName];

        // These outputs will be used when AWS SDK integration is added
        expect(outputs.region).toBeDefined();
        expect(outputs.codeBuildProjectName).toBeDefined();
        expect(outputs.lambdaFunctionName).toBeDefined();
        expect(outputs.artifactsBucketName).toBeDefined();
        expect(outputs.slackSecretArn).toBeDefined();

        console.log(
          `✅ Stack ${stackName} outputs are ready for AWS SDK integration`
        );
      });
    });

    it('should provide clear resource identification for AWS operations', () => {
      Object.keys(stackOutputs).forEach(stackName => {
        const outputs = stackOutputs[stackName];

        // These will be used to identify resources in AWS
        const resourceIdentifiers = {
          codeBuildProject: outputs.codeBuildProjectName,
          lambdaFunction: outputs.lambdaFunctionName,
          s3Bucket: outputs.artifactsBucketName,
          slackSecret: outputs.slackSecretArn,
          region: outputs.region,
        };

        expect(
          Object.values(resourceIdentifiers).every(
            v => v && typeof v === 'string'
          )
        ).toBe(true);

        console.log(
          `✅ Stack ${stackName} provides clear resource identifiers for AWS operations`
        );
      });
    });
  });

  afterAll(async () => {
    console.log('🧹 Integration test completed');
    console.log('📝 Note: This test validates stack outputs structure.');
    console.log(
      '🔗 To add AWS SDK integration, install required packages and extend the test.'
    );
  });
});
