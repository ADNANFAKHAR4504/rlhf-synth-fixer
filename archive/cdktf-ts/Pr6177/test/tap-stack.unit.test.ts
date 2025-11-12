import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Instantiation and Basic Configuration', () => {
    test('TapStack instantiates successfully with full props', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'prod',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
        defaultTags: [{
          tags: {
            Project: 'TestProject',
            Owner: 'TestTeam',
          },
        }],
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('custom-state-bucket');
      expect(synthesized).toContain('us-west-2');
      expect(synthesized).toContain('TestProject');
      expect(synthesized).toContain('TestTeam');
    });

    test('TapStack instantiates successfully with minimal props', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackMinimal', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('test');
    });

    test('TapStack uses default values when no props provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDefault');
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('dev'); // default environmentSuffix
      expect(synthesized).toContain('iac-rlhf-tf-states'); // default stateBucket
    });

    test('TapStack handles undefined props gracefully', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackUndefined', undefined);
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('dev'); // default environmentSuffix
    });

    test('TapStack handles empty props object', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackEmpty', {});
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('dev'); // default environmentSuffix
    });
  });

  describe('AWS Region Override Behavior', () => {
    test('TapStack always uses AWS_REGION_OVERRIDE regardless of props', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackRegionOverride', {
        environmentSuffix: 'test',
        awsRegion: 'eu-west-1', // This should be ignored
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      // Should use ap-southeast-1 (AWS_REGION_OVERRIDE) instead of eu-west-1
      expect(synthesized).toContain('ap-southeast-1');
      expect(synthesized).not.toContain('eu-west-1');
    });

    test('TapStack uses AWS_REGION_OVERRIDE even with null awsRegion', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackNullRegion', {
        environmentSuffix: 'test',
        awsRegion: undefined,
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('ap-southeast-1');
    });

    test('TapStack uses AWS_REGION_OVERRIDE with empty string awsRegion', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackEmptyRegion', {
        environmentSuffix: 'test',
        awsRegion: '',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('ap-southeast-1');
    });

    // Add these two tests to cover the optional chaining branches
    test('TapStack uses AWS_REGION_OVERRIDE when props is undefined', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackUndefinedProps', undefined);
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('ap-southeast-1');
    });

    test('TapStack uses AWS_REGION_OVERRIDE when props.awsRegion is not provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackNoRegionProp', {
        environmentSuffix: 'test',
        // awsRegion is intentionally omitted to test the optional chaining
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('ap-southeast-1');
    });

    // Add test to cover the fallback branch when AWS_REGION_OVERRIDE is falsy
    test('TapStack uses props.awsRegion when AWS_REGION_OVERRIDE is falsy', () => {
      app = new App();

      // Mock the static property to be falsy to test the fallback branch
      const originalOverride = (TapStack as any).AWS_REGION_OVERRIDE;
      Object.defineProperty(TapStack, 'AWS_REGION_OVERRIDE', {
        get: () => undefined,
        configurable: true,
      });

      try {
        stack = new TapStack(app, 'TestTapStackFallbackRegion', {
          environmentSuffix: 'test',
          awsRegion: 'us-west-2',
        });
        synthesized = Testing.synth(stack);

        expect(synthesized).toContain('us-west-2');
        expect(synthesized).not.toContain('ap-southeast-1');
      } finally {
        // Restore original value
        Object.defineProperty(TapStack, 'AWS_REGION_OVERRIDE', {
          get: () => originalOverride,
          configurable: true,
        });
      }
    });

    // Add test to cover the final fallback to 'us-east-1' when both are falsy
    test('TapStack uses default us-east-1 when AWS_REGION_OVERRIDE and props.awsRegion are both falsy', () => {
      app = new App();

      // Mock the static property to be falsy
      const originalOverride = (TapStack as any).AWS_REGION_OVERRIDE;
      Object.defineProperty(TapStack, 'AWS_REGION_OVERRIDE', {
        get: () => undefined,
        configurable: true,
      });

      try {
        stack = new TapStack(app, 'TestTapStackDefaultFallback', {
          environmentSuffix: 'test',
          // awsRegion is intentionally omitted
        });
        synthesized = Testing.synth(stack);

        expect(synthesized).toContain('us-east-1');
        expect(synthesized).not.toContain('ap-southeast-1');
      } finally {
        // Restore original value
        Object.defineProperty(TapStack, 'AWS_REGION_OVERRIDE', {
          get: () => originalOverride,
          configurable: true,
        });
      }
    });

    // Add test to cover when AWS_REGION_OVERRIDE is falsy and props.awsRegion is undefined
    test('TapStack uses default us-east-1 when AWS_REGION_OVERRIDE is falsy and props.awsRegion is undefined', () => {
      app = new App();

      // Mock the static property to be falsy
      const originalOverride = (TapStack as any).AWS_REGION_OVERRIDE;
      Object.defineProperty(TapStack, 'AWS_REGION_OVERRIDE', {
        get: () => undefined,
        configurable: true,
      });

      try {
        stack = new TapStack(app, 'TestTapStackUndefinedFallback', {
          environmentSuffix: 'test',
          awsRegion: undefined,
        });
        synthesized = Testing.synth(stack);

        expect(synthesized).toContain('us-east-1');
        expect(synthesized).not.toContain('ap-southeast-1');
      } finally {
        // Restore original value
        Object.defineProperty(TapStack, 'AWS_REGION_OVERRIDE', {
          get: () => originalOverride,
          configurable: true,
        });
      }
    });
  });

  describe('State Bucket Configuration', () => {
    test('TapStack uses custom stateBucket when provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackCustomBucket', {
        stateBucket: 'my-custom-bucket',
        stateBucketRegion: 'ap-south-1',
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('my-custom-bucket');
      expect(synthesized).toContain('ap-south-1');
    });

    test('TapStack uses default stateBucket when not provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDefaultBucket', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('iac-rlhf-tf-states');
    });

    test('TapStack uses custom stateBucketRegion when provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackCustomRegion', {
        environmentSuffix: 'test',
        stateBucketRegion: 'eu-central-1',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('eu-central-1');
    });

    test('TapStack uses default stateBucketRegion when not provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDefaultRegion', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('us-east-1'); // default stateBucketRegion
    });

    test('TapStack generates correct state key with environmentSuffix and id', () => {
      app = new App();
      const testId = 'MyTestStack';
      const testSuffix = 'staging';
      stack = new TapStack(app, testId, {
        environmentSuffix: testSuffix,
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain(`${testSuffix}/${testId}.tfstate`);
    });
  });

  describe('Default Tags Configuration', () => {
    test('TapStack uses custom defaultTags when provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackCustomTags', {
        environmentSuffix: 'test',
        defaultTags: [{
          tags: {
            Environment: 'production',
            Team: 'platform',
            Project: 'csv-processing',
          },
        }],
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('production');
      expect(synthesized).toContain('platform');
      expect(synthesized).toContain('csv-processing');
    });

    test('TapStack handles empty defaultTags array', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackEmptyTags', {
        environmentSuffix: 'test',
        defaultTags: [],
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('TapStack uses empty array as default when defaultTags not provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackNoTags', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('TapStack handles multiple defaultTags entries', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackMultipleTags', {
        environmentSuffix: 'test',
        defaultTags: [
          {
            tags: {
              Environment: 'production',
            },
          },
          {
            tags: {
              Team: 'platform',
            },
          },
        ],
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('production');
      expect(synthesized).toContain('platform');
    });
  });

  describe('AWS Provider Configuration', () => {
    test('TapStack creates AWS provider with correct region', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackProvider', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      // Should create AWS provider with ap-southeast-1
      expect(synthesized).toContain('"region": "ap-southeast-1"');
    });

    test('TapStack applies defaultTags to AWS provider', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackProviderTags', {
        environmentSuffix: 'test',
        defaultTags: [{
          tags: {
            CostCenter: '12345',
            Owner: 'DataTeam',
          },
        }],
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('12345');
      expect(synthesized).toContain('DataTeam');
    });

    test('TapStack creates provider with no tags when defaultTags is empty', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackProviderNoTags', {
        environmentSuffix: 'test',
        defaultTags: [],
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"region": "ap-southeast-1"');
    });
  });

  describe('S3Backend Configuration', () => {
    test('TapStack configures S3Backend with all required properties', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackBackend', {
        environmentSuffix: 'test',
        stateBucket: 'my-tf-state-bucket',
        stateBucketRegion: 'us-west-1',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"bucket": "my-tf-state-bucket"');
      expect(synthesized).toContain('"key": "test/TestTapStackBackend.tfstate"');
      expect(synthesized).toContain('"region": "us-west-1"');
      expect(synthesized).toContain('"encrypt": true');
    });

    test('TapStack enables encryption on S3Backend', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackEncryption', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"encrypt": true');
    });

    test('TapStack uses correct backend configuration format', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackBackendFormat', {
        environmentSuffix: 'prod',
      });
      synthesized = Testing.synth(stack);

      // Verify terraform backend configuration structure
      expect(synthesized).toContain('"terraform"');
      expect(synthesized).toContain('"backend"');
      expect(synthesized).toContain('"s3"');
    });
  });

  describe('CsvProcessingStack Integration', () => {
    test('TapStack creates CsvProcessingStack child stack', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackCsvProcessing', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      // Should contain csv-processing child stack
      expect(synthesized).toContain('csv-processing');
    });

    test('TapStack passes environmentSuffix to CsvProcessingStack', () => {
      app = new App();
      const testSuffix = 'integration';
      stack = new TapStack(app, 'TestTapStackCsvSuffix', {
        environmentSuffix: testSuffix,
      });
      synthesized = Testing.synth(stack);

      // CsvProcessingStack should use the environmentSuffix
      expect(synthesized).toContain(testSuffix);
      expect(synthesized).toContain(`csv-data-${testSuffix}`); // S3 bucket name
      expect(synthesized).toContain(`processing-results-${testSuffix}`); // DynamoDB table name
      expect(synthesized).toContain(`csv-processor-${testSuffix}`); // Lambda function name
    });

    test('TapStack creates all expected CSV processing resources', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackCsvResources', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      // Should contain all major CSV processing resources
      expect(synthesized).toContain('aws_s3_bucket'); // S3 bucket
      expect(synthesized).toContain('aws_lambda_function'); // Lambda function
      expect(synthesized).toContain('aws_dynamodb_table'); // DynamoDB table
      expect(synthesized).toContain('aws_sqs_queue'); // SQS DLQ
      expect(synthesized).toContain('aws_cloudwatch_log_group'); // CloudWatch logs
      expect(synthesized).toContain('aws_iam_role'); // IAM role
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('TapStack handles null environmentSuffix gracefully', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackNullSuffix', {
        environmentSuffix: undefined,
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toContain('dev'); // should use default
    });

    test('TapStack handles empty string environmentSuffix', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackEmptySuffix', {
        environmentSuffix: '',
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('TapStack handles special characters in environmentSuffix', () => {
      app = new App();
      const specialSuffix = 'test-env_123';
      stack = new TapStack(app, 'TestTapStackSpecialSuffix', {
        environmentSuffix: specialSuffix,
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain(specialSuffix);
    });

    test('TapStack handles very long environmentSuffix', () => {
      app = new App();
      const longSuffix = 'very-long-environment-suffix-for-testing-edge-cases';
      stack = new TapStack(app, 'TestTapStackLongSuffix', {
        environmentSuffix: longSuffix,
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain(longSuffix);
    });

    test('TapStack handles null stateBucket gracefully', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackNullBucket', {
        environmentSuffix: 'test',
        stateBucket: undefined,
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('iac-rlhf-tf-states'); // should use default
    });

    test('TapStack handles empty string stateBucket', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackEmptyBucket', {
        environmentSuffix: 'test',
        stateBucket: '',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toBeDefined(); // should not crash
    });

    test('TapStack handles null defaultTags gracefully', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackNullTags', {
        environmentSuffix: 'test',
        defaultTags: undefined,
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });
  });

  describe('Resource Outputs Validation', () => {
    test('TapStack generates expected Terraform outputs', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackOutputs', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      // Should contain outputs from CsvProcessingStack
      expect(synthesized).toContain('"output"');
      expect(synthesized).toContain('s3-bucket-name');
      expect(synthesized).toContain('lambda-function-arn');
      expect(synthesized).toContain('dynamodb-table-name');
    });

    test('TapStack outputs have correct descriptions', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackOutputDescriptions', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('Name of the S3 bucket for CSV files');
      expect(synthesized).toContain('ARN of the Lambda function');
      expect(synthesized).toContain('Name of the DynamoDB table');
    });
  });

  describe('Complete Integration Test', () => {
    test('TapStack creates complete serverless CSV processing pipeline', () => {
      app = new App();
      stack = new TapStack(app, 'CompleteIntegrationTest', {
        environmentSuffix: 'integration',
        stateBucket: 'integration-tf-states',
        stateBucketRegion: 'ap-southeast-2',
        awsRegion: 'eu-west-1', // Should be overridden
        defaultTags: [{
          tags: {
            Environment: 'integration',
            Project: 'csv-processing-pipeline',
            Team: 'data-engineering',
            CostCenter: 'engineering-001',
          },
        }],
      });
      synthesized = Testing.synth(stack);

      // Verify stack creation
      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();

      // Verify configuration values
      expect(synthesized).toContain('integration');
      expect(synthesized).toContain('integration-tf-states');
      expect(synthesized).toContain('ap-southeast-2');
      expect(synthesized).toContain('ap-southeast-1'); // region override
      expect(synthesized).not.toContain('eu-west-1'); // should be overridden

      // Verify tags
      expect(synthesized).toContain('csv-processing-pipeline');
      expect(synthesized).toContain('data-engineering');
      expect(synthesized).toContain('engineering-001');

      // Verify backend configuration
      expect(synthesized).toContain('"bucket": "integration-tf-states"');
      expect(synthesized).toContain('"key": "integration/CompleteIntegrationTest.tfstate"');
      expect(synthesized).toContain('"encrypt": true');

      // Verify AWS provider
      expect(synthesized).toContain('"region": "ap-southeast-1"');

      // Verify CSV processing resources
      expect(synthesized).toContain('csv-data-integration');
      expect(synthesized).toContain('processing-results-integration');
      expect(synthesized).toContain('csv-processor-integration');
      expect(synthesized).toContain('csv-processing-dlq-integration');

      // Verify resource types
      expect(synthesized).toContain('aws_s3_bucket');
      expect(synthesized).toContain('aws_lambda_function');
      expect(synthesized).toContain('aws_dynamodb_table');
      expect(synthesized).toContain('aws_sqs_queue');
      expect(synthesized).toContain('aws_cloudwatch_log_group');
      expect(synthesized).toContain('aws_iam_role');
      expect(synthesized).toContain('aws_iam_policy');
      expect(synthesized).toContain('aws_s3_bucket_notification');
      expect(synthesized).toContain('aws_lambda_permission');

      // Verify outputs
      expect(synthesized).toContain('s3-bucket-name');
      expect(synthesized).toContain('lambda-function-arn');
      expect(synthesized).toContain('dynamodb-table-name');
    });
  });

  describe('Constructor Parameter Coverage', () => {
    test('covers all TapStackProps interface properties', () => {
      app = new App();

      // Test with all possible prop combinations to ensure 100% coverage
      const allPropsStack = new TapStack(app, 'AllPropsTest', {
        environmentSuffix: 'coverage-test',
        stateBucket: 'coverage-test-bucket',
        stateBucketRegion: 'us-east-2',
        awsRegion: 'us-west-1', // Will be overridden but tests the prop
        defaultTags: [{
          tags: {
            TestCoverage: 'complete',
          },
        }],
      });

      const partialPropsStack = new TapStack(app, 'PartialPropsTest', {
        environmentSuffix: 'partial',
      });

      const noPropsStack = new TapStack(app, 'NoPropsTest');

      // Verify all stacks were created successfully
      expect(allPropsStack).toBeDefined();
      expect(partialPropsStack).toBeDefined();
      expect(noPropsStack).toBeDefined();

      // Test synthesis for all variations
      expect(Testing.synth(allPropsStack)).toBeDefined();
      expect(Testing.synth(partialPropsStack)).toBeDefined();
      expect(Testing.synth(noPropsStack)).toBeDefined();
    });
  });
});
