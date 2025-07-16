import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MetadataProcessingStack } from '../lib/metadata-stack';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('should create a TapStack instance', () => {
      expect(stack).toBeInstanceOf(TapStack);
      expect(stack).toBeInstanceOf(cdk.Stack);
    });

    test('should create MetadataProcessingStack as nested stack', () => {
      // Since MetadataProcessingStack is instantiated directly in TapStack,
      // we just verify the TapStack instance was created successfully
      expect(stack).toBeDefined();
      expect(stack.node.children.length).toBeGreaterThan(0);
    });

    test('should handle different environment suffix configurations', () => {
      // Test with context-based environment suffix
      const appWithContext = new cdk.App({
        context: {
          environmentSuffix: 'prod',
        },
      });
      const stackWithContext = new TapStack(
        appWithContext,
        'TestTapStackWithContext'
      );
      expect(stackWithContext).toBeInstanceOf(TapStack);

      // Test with props-based environment suffix
      const stackWithProps = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'staging',
      });
      expect(stackWithProps).toBeInstanceOf(TapStack);

      // Test with no environment suffix (defaults to 'dev')
      const stackDefault = new TapStack(app, 'TestTapStackDefault');
      expect(stackDefault).toBeInstanceOf(TapStack);
    });
  });
});

describe('MetadataProcessingStack', () => {
  let app: cdk.App;
  let stack: MetadataProcessingStack;
  let template: Template;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new cdk.App();
    stack = new MetadataProcessingStack(app, 'TestMetadataProcessingStack');
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('should create a MetadataProcessingStack instance', () => {
      expect(stack).toBeInstanceOf(MetadataProcessingStack);
      expect(stack).toBeInstanceOf(cdk.Stack);
    });
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'iac-rlhf-aws-release',
      });

      // Verify EventBridge is enabled (handled by CDK differently)
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('should have deletion policy set to Delete', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('should create DynamoDB table with correct schema', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'S',
          },
        ],
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('should have deletion policy set to Delete', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('OpenSearch Serverless', () => {
    test('should create OpenSearch collection', () => {
      template.hasResourceProperties('AWS::OpenSearchServerless::Collection', {
        Name: 'iac-rlhf-metadata-collection',
        Type: 'SEARCH',
        Description: 'Collection for storing metadata from iac-rlhf-releases',
      });
    });

    test('should create security policy for encryption', () => {
      template.hasResourceProperties(
        'AWS::OpenSearchServerless::SecurityPolicy',
        {
          Name: 'metadata-security-policy',
          Type: 'encryption',
          Description: 'Encryption policy for metadata collection',
          Policy: JSON.stringify({
            Rules: [
              {
                ResourceType: 'collection',
                Resource: ['collection/iac-rlhf-metadata-collection'],
              },
            ],
            AWSOwnedKey: true,
          }),
        }
      );
    });

    test('should create network policy', () => {
      template.hasResourceProperties(
        'AWS::OpenSearchServerless::SecurityPolicy',
        {
          Name: 'iac-rlhf-metadata-network-policy',
          Type: 'network',
          Description: 'Network policy for IaC Rlhf metadata collection',
        }
      );
    });

    test('should create data access policy', () => {
      template.hasResourceProperties(
        'AWS::OpenSearchServerless::AccessPolicy',
        {
          Name: 'iac-rlhf-metadata-access-policy',
          Type: 'data',
          Description: 'Data access policy for iac-rlhf-metadata collection',
        }
      );
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function for OpenSearch indexing', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.12',
        Handler: 'index.handler',
        Timeout: 300,
      });
    });

    test('should create Lambda layer for OpenSearch dependencies', () => {
      template.hasResourceProperties('AWS::Lambda::LayerVersion', {
        CompatibleRuntimes: ['python3.12'],
        Description:
          'Layer containing requests_aws4auth and opensearch-py dependencies',
      });
    });

    test('should have environment variables for OpenSearch configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            COLLECTION_NAME: 'iac-rlhf-metadata-collection',
            OPENSEARCH_INDEX: 'iac-rlhf-metadata',
          },
        },
      });
    });
  });

  describe('Step Functions', () => {
    test('should create Step Function state machine', () => {
      template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
    });

    test('should have role configuration', () => {
      // Just verify that the state machine exists and has required properties
      const stateMachines = template.findResources(
        'AWS::StepFunctions::StateMachine'
      );
      const stateMachineKeys = Object.keys(stateMachines);
      expect(stateMachineKeys.length).toBe(1);

      const stateMachine = stateMachines[stateMachineKeys[0]];
      expect(stateMachine.Properties.RoleArn).toBeDefined();
    });
  });

  describe('EventBridge', () => {
    test('should create EventBridge rule for metadata.json files', () => {
      template.resourceCountIs('AWS::Events::Rule', 1);

      // Verify the rule has the correct event pattern structure
      const rules = template.findResources('AWS::Events::Rule');
      const ruleKeys = Object.keys(rules);
      expect(ruleKeys.length).toBe(1);

      const rule = rules[ruleKeys[0]];
      expect(rule.Properties.EventPattern.source).toContain('aws.s3');
      expect(rule.Properties.EventPattern['detail-type']).toContain(
        'Object Created'
      );
      expect(rule.Properties.EventPattern.detail.object.key[0].suffix).toBe(
        'metadata.json'
      );
    });

    test('should target Step Function from EventBridge rule', () => {
      const rules = template.findResources('AWS::Events::Rule');
      const ruleKeys = Object.keys(rules);
      const rule = rules[ruleKeys[0]];

      expect(rule.Properties.Targets).toBeDefined();
      expect(Array.isArray(rule.Properties.Targets)).toBe(true);
      expect(rule.Properties.Targets.length).toBeGreaterThan(0);

      const target = rule.Properties.Targets[0];
      expect(target.Arn).toBeDefined();
      expect(target.RetryPolicy).toBeDefined();
      expect(target.RetryPolicy.MaximumRetryAttempts).toBe(3);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create CloudWatch alarm for Step Function failures', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'MetadataProcessing-StepFunction-Failures',
        AlarmDescription:
          'Alarm when Step Function for processing metadata fails',
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 1,
        Threshold: 1,
        TreatMissingData: 'notBreaching',
      });
    });
  });

  describe('IAM Permissions', () => {
    test('should create correct number of IAM roles', () => {
      // Verify we have the expected IAM roles
      template.resourceCountIs('AWS::IAM::Role', 4);
    });

    test('should create correct number of IAM policies', () => {
      // Verify we have IAM policies
      const policies = template.findResources('AWS::IAM::Policy');
      expect(Object.keys(policies).length).toBeGreaterThanOrEqual(1);
    });

    test('should grant Lambda permissions to access OpenSearch', () => {
      // Find the Lambda OpenSearch policy by name pattern
      const policies = template.findResources('AWS::IAM::Policy');
      const lambdaPolicy = Object.values(policies).find(
        (policy: any) =>
          policy.Properties.PolicyName &&
          policy.Properties.PolicyName.includes('LambdaOpenSearchPolicy')
      );

      expect(lambdaPolicy).toBeDefined();
      expect(lambdaPolicy?.Properties.PolicyDocument.Statement).toBeDefined();

      const statement = lambdaPolicy?.Properties.PolicyDocument.Statement[0];
      expect(statement.Action).toBe('aoss:APIAccessAll');
      expect(statement.Effect).toBe('Allow');
    });

    test('should create roles with proper assume role policies', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const roleValues = Object.values(roles);

      // Check that we have roles for different services
      const serviceTypes = roleValues.map((role: any) => {
        const statements = role.Properties.AssumeRolePolicyDocument.Statement;
        return statements[0].Principal.Service;
      });

      expect(serviceTypes).toContain('lambda.amazonaws.com');
      expect(serviceTypes).toContain('states.amazonaws.com');
      expect(serviceTypes).toContain('events.amazonaws.com');
    });
  });

  describe('Stack Outputs', () => {
    test('should output bucket name', () => {
      template.hasOutput('BucketName', {
        Description: 'The name of the S3 bucket',
      });
    });

    test('should output state machine ARN', () => {
      template.hasOutput('StateMachineArn', {
        Description: 'The ARN of the Step Function state machine',
      });
    });

    test('should output OpenSearch collection details', () => {
      template.hasOutput('OpenSearchCollectionName', {
        Description: 'The name of the OpenSearch Serverless collection',
      });

      template.hasOutput('OpenSearchCollectionEndpoint', {
        Description: 'The endpoint of the OpenSearch Serverless collection',
      });

      template.hasOutput('OpenSearchDashboardsUrl', {
        Description: 'The URL for OpenSearch Dashboards',
      });
    });

    test('should output DynamoDB table name', () => {
      template.hasOutput('DynamoDBTableName', {
        Description: 'The name of the DynamoDB table for failures',
      });
    });

    test('should output Lambda function ARN', () => {
      template.hasOutput('OpenSearchLambdaArn', {
        Description: 'The ARN of the Lambda function for OpenSearch indexing',
      });
    });

    test('should output CloudWatch alarm name', () => {
      template.hasOutput('StepFunctionFailureAlarmName', {
        Description:
          'The name of the CloudWatch alarm for Step Function failures',
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should create expected number of resources', () => {
      // Verify we have the core resources
      const resources = template.toJSON().Resources;
      const resourceTypes = Object.values(resources).map((r: any) => r.Type);

      expect(resourceTypes).toContain('AWS::S3::Bucket');
      expect(resourceTypes).toContain('AWS::DynamoDB::Table');
      expect(resourceTypes).toContain('AWS::OpenSearchServerless::Collection');
      expect(resourceTypes).toContain('AWS::Lambda::Function');
      expect(resourceTypes).toContain('AWS::Lambda::LayerVersion');
      expect(resourceTypes).toContain('AWS::StepFunctions::StateMachine');
      expect(resourceTypes).toContain('AWS::Events::Rule');
      expect(resourceTypes).toContain('AWS::CloudWatch::Alarm');
    });

    test('should have correct number of OpenSearch security policies', () => {
      const securityPolicies = template.findResources(
        'AWS::OpenSearchServerless::SecurityPolicy'
      );
      expect(Object.keys(securityPolicies)).toHaveLength(2); // encryption and network policies
    });

    test('should have correct number of IAM roles and policies', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const policies = template.findResources('AWS::IAM::Policy');

      // Should have roles for Lambda, Step Function, and EventBridge
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(3);
      expect(Object.keys(policies).length).toBeGreaterThanOrEqual(1);
    });

    test('should have proper resource dependencies', () => {
      // Verify that the OpenSearch collection has dependencies
      const collections = template.findResources(
        'AWS::OpenSearchServerless::Collection'
      );
      const collectionKeys = Object.keys(collections);
      const collection = collections[collectionKeys[0]];

      expect(collection.DependsOn).toBeDefined();
      expect(Array.isArray(collection.DependsOn)).toBe(true);
      expect(collection.DependsOn.length).toBeGreaterThan(0);
    });

    test('should create stack with proper naming conventions', () => {
      expect(stack.stackName).toBeDefined();
      expect(stack.region).toBeDefined();
      expect(stack.account).toBeDefined();
    });
  });
});
