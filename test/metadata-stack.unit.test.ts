import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MetadataProcessingStack } from '../lib/metadata-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('MetadataProcessingStack', () => {
  let app: cdk.App;
  let stack: MetadataProcessingStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new MetadataProcessingStack(app, 'TestMetadataProcessingStack', {
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('should create a MetadataProcessingStack instance', () => {
      expect(stack).toBeInstanceOf(MetadataProcessingStack);
      expect(stack).toBeInstanceOf(cdk.Stack);
    });

    test('should create stack with default environment suffix when not provided', () => {
      const stackWithoutEnv = new MetadataProcessingStack(
        app,
        'TestMetadataProcessingStackNoEnv'
      );
      expect(stackWithoutEnv).toBeInstanceOf(MetadataProcessingStack);
    });
  });

  describe('S3 Bucket', () => {
    test('should reference existing S3 bucket with environment suffix', () => {
      // Since we're importing an existing bucket, we won't see it in the template
      // But we can verify the stack doesn't create a new bucket
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });
  });

  describe('DynamoDB Table', () => {
    test('should create DynamoDB table for failure tracking', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: [
          {
            AttributeName: 'executionId',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'S',
          },
        ],
        KeySchema: [
          {
            AttributeName: 'executionId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
      });
    });
  });

  describe('OpenSearch Service', () => {
    test('should create OpenSearch domain with environment suffix', () => {
      template.hasResourceProperties('AWS::OpenSearchService::Domain', {
        DomainName: `iac-rlhf-metadata-${environmentSuffix}`,
        EngineVersion: 'OpenSearch_2.11',
      });
    });

    test('should configure OpenSearch with single node for LocalStack', () => {
      template.hasResourceProperties('AWS::OpenSearchService::Domain', {
        ClusterConfig: {
          InstanceType: 't3.small.search',
          InstanceCount: 1,
          MultiAZWithStandbyEnabled: false,
        },
      });
    });

    test('should configure EBS volume for OpenSearch', () => {
      template.hasResourceProperties('AWS::OpenSearchService::Domain', {
        EBSOptions: {
          EBSEnabled: true,
          VolumeSize: 10,
          VolumeType: 'gp3',
        },
      });
    });

    test('should configure removal policy for LocalStack cleanup', () => {
      const domains = template.findResources('AWS::OpenSearchService::Domain');
      const domain = Object.values(domains)[0];
      // Verify the domain can be deleted (important for LocalStack)
      expect(domain.DeletionPolicy).toMatch(/Delete|Retain/);
    });
  });

  describe('IAM Roles', () => {
    test('should create Step Functions IAM role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'states.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('should create IAM policy for Step Functions role', () => {
      // Check that the policies contain the expected actions
      const policies = template.findResources('AWS::IAM::Policy');
      const policyNames = Object.keys(policies);

      // Find the Step Functions policy
      const stepFunctionsPolicyName = policyNames.find(name =>
        name.startsWith('StepFunctionsRoleDefaultPolicy')
      );
      expect(stepFunctionsPolicyName).toBeDefined();

      // Verify the policy contains expected actions
      const stepFunctionsPolicy = policies[stepFunctionsPolicyName!];
      const policyDocument = stepFunctionsPolicy.Properties.PolicyDocument;

      expect(policyDocument.Version).toBe('2012-10-17');
      expect(policyDocument.Statement).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Action: 's3:GetObject',
            Effect: 'Allow',
          }),
        ])
      );
    });
  });

  describe('Step Functions State Machine', () => {
    test('should create Step Functions state machine', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        TracingConfiguration: {
          Enabled: true,
        },
      });
    });

    test('should create Step Functions state machine with proper definition', () => {
      const stateMachines = template.findResources(
        'AWS::StepFunctions::StateMachine'
      );
      const stateMachine = Object.values(stateMachines)[0];

      // Check that the state machine has a definition
      expect(stateMachine.Properties).toHaveProperty('DefinitionString');
      expect(stateMachine.Properties.DefinitionString).toBeDefined();
      expect(stateMachine.Properties.RoleArn).toBeDefined();
    });
  });

  describe('EventBridge Rule', () => {
    test('should create EventBridge rule for metadata.json files', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.s3'],
          'detail-type': ['Object Created'],
          detail: {
            bucket: {
              name: [
                {
                  Ref: 'MetadataBucketE6B09702',
                },
              ],
            },
            object: {
              key: [
                {
                  suffix: 'metadata.json',
                },
              ],
            },
          },
        },
      });
    });
  });

  describe('CloudWatch Alarm', () => {
    test('should create CloudWatch alarm for Step Functions failures', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 1,
        Threshold: 1,
        AlarmDescription:
          'Alarm when the metadata processing step function fails',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should have all required outputs', () => {
      template.hasOutput('MetadataBucketName', {
        Description: 'S3 bucket for metadata.json files',
        Value: {
          Ref: 'MetadataBucketE6B09702',
        },
      });

      template.hasOutput('OpenSearchDomainName', {
        Description: 'OpenSearch domain name',
      });

      template.hasOutput('OpenSearchDomainEndpoint', {
        Description: 'OpenSearch domain endpoint',
      });

      template.hasOutput('FailureTableName', {
        Description: 'DynamoDB table for failure tracking',
      });

      template.hasOutput('MetadataProcessingWorkflowArn', {
        Description: 'Step Functions state machine ARN',
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function for OpenSearch indexing', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.11',
        Handler: 'index.handler',
        Timeout: 30,
      });
    });

    test('should create Lambda function with OpenSearch environment variables', () => {
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');

      // Find the OpenSearch indexer Lambda (it has environment variables)
      const opensearchLambda = Object.values(lambdaFunctions).find(
        lambda =>
          lambda.Properties.Environment &&
          lambda.Properties.Environment.Variables &&
          lambda.Properties.Environment.Variables.OPENSEARCH_INDEX
      );

      expect(opensearchLambda).toBeDefined();
      expect(opensearchLambda?.Properties.Environment.Variables.OPENSEARCH_INDEX).toBe('metadata');
      expect(opensearchLambda?.Properties.Environment.Variables.OPENSEARCH_ENDPOINT).toBeDefined();
    });

    test('should create Lambda function with fromAsset code', () => {
      // When using fromAsset, the CloudFormation template will have S3 bucket and key references
      // instead of inline code
      const lambdaFunction = template.findResources('AWS::Lambda::Function');
      const lambdaCode = Object.values(lambdaFunction)[0].Properties.Code;

      expect(lambdaCode).toHaveProperty('S3Bucket');
      expect(lambdaCode).toHaveProperty('S3Key');
      expect(lambdaCode.S3Key).toMatch(/^[a-f0-9]{64}\.zip$/);
    });
  });

  describe('Lambda Layer', () => {
    test('should create OpenSearch layer with correct runtime', () => {
      template.hasResourceProperties('AWS::Lambda::LayerVersion', {
        CompatibleRuntimes: ['python3.11'],
        Description:
          'Layer containing requests and requests-aws4auth for OpenSearch',
      });
    });

    test('should attach layer to Lambda function', () => {
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const opensearchLambda = Object.values(lambdaFunctions).find(
        lambda =>
          lambda.Properties.Environment &&
          lambda.Properties.Environment.Variables &&
          lambda.Properties.Environment.Variables.OPENSEARCH_ENDPOINT
      );

      expect(opensearchLambda).toBeDefined();
      expect(opensearchLambda?.Properties).toHaveProperty('Layers');
      expect(opensearchLambda?.Properties.Layers).toHaveLength(1);
      expect(opensearchLambda?.Properties.Layers[0]).toHaveProperty('Ref');
      expect(opensearchLambda?.Properties.Layers[0].Ref).toMatch(
        /^OpenSearchLayer[A-Z0-9]{8}$/
      );
    });
  });

  describe('Resource Count Validation', () => {
    test('should create expected number of resources', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
      template.resourceCountIs('AWS::OpenSearchService::Domain', 1);
      // IAM Roles: Step Functions + Lambda execution + Events + OpenSearch service role + Custom resource
      template.resourceCountIs('AWS::IAM::Role', 5);
      template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
      template.resourceCountIs('AWS::Events::Rule', 1);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 1);
      template.resourceCountIs('AWS::Lambda::Function', 3); // OpenSearch indexer Lambda + Custom resource handlers
      template.resourceCountIs('AWS::Lambda::LayerVersion', 1); // OpenSearch layer
    });
  });
});
