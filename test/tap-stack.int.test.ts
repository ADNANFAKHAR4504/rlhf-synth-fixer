import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

const cfnClient = new CloudFormationClient({ region });
const dynamoClient = new DynamoDBClient({ region });

describe('TAP Stack Infrastructure Integration Tests', () => {
  let stackOutputs: any = {};
  let stackResources: any[] = [];

  beforeAll(async () => {
    try {
      // Get stack information
      const stackResponse = await cfnClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );

      if (stackResponse.Stacks && stackResponse.Stacks[0]) {
        stackOutputs =
          stackResponse.Stacks[0].Outputs?.reduce((acc, output) => {
            if (output.OutputKey && output.OutputValue) {
              acc[output.OutputKey] = output.OutputValue;
            }
            return acc;
          }, {} as any) || {};
      }

      // Get stack resources
      const resourcesResponse = await cfnClient.send(
        new DescribeStackResourcesCommand({ StackName: stackName })
      );
      stackResources = resourcesResponse.StackResources || [];
    } catch (error) {
      console.error('Failed to get stack information:', error);
      throw new Error(
        `Stack ${stackName} not found or not accessible. Please deploy the stack first using: npm run cfn:deploy-yaml`
      );
    }
  }, 30000);

  describe('Stack Deployment', () => {
    test('should have deployed stack successfully', () => {
      expect(stackResources.length).toBeGreaterThan(0);
    });

    test('should have all expected outputs', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputKey => {
        expect(stackOutputs[outputKey]).toBeDefined();
      });
    });

    test('should have correct environment suffix in outputs', () => {
      expect(stackOutputs.EnvironmentSuffix).toBe(environmentSuffix);
      expect(stackOutputs.StackName).toBe(stackName);
    });
  });

  describe('DynamoDB Table', () => {
    test('should have TurnAroundPromptTable deployed', () => {
      const tableResource = stackResources.find(
        resource => resource.ResourceType === 'AWS::DynamoDB::Table'
      );
      expect(tableResource).toBeDefined();
      expect(tableResource?.LogicalResourceId).toBe('TurnAroundPromptTable');
    });

    test('should have correct table name with environment suffix', async () => {
      const expectedTableName = `TurnAroundPromptTable${environmentSuffix}`;
      expect(stackOutputs.TurnAroundPromptTableName).toBe(expectedTableName);

      // Verify table exists in DynamoDB
      const tableResponse = await dynamoClient.send(
        new DescribeTableCommand({ TableName: expectedTableName })
      );

      expect(tableResponse.Table).toBeDefined();
      expect(tableResponse.Table?.TableName).toBe(expectedTableName);
    });

    test('should have correct table configuration', async () => {
      const tableName = stackOutputs.TurnAroundPromptTableName;
      const tableResponse = await dynamoClient.send(
        new DescribeTableCommand({ TableName: tableName })
      );

      const table = tableResponse.Table;
      expect(table).toBeDefined();

      // Check billing mode
      expect(table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');

      // Check key schema
      expect(table?.KeySchema).toHaveLength(1);
      expect(table?.KeySchema?.[0].AttributeName).toBe('id');
      expect(table?.KeySchema?.[0].KeyType).toBe('HASH');

      // Check attribute definitions
      expect(table?.AttributeDefinitions).toHaveLength(1);
      expect(table?.AttributeDefinitions?.[0].AttributeName).toBe('id');
      expect(table?.AttributeDefinitions?.[0].AttributeType).toBe('S');
    });

    test('should have deletion protection disabled', async () => {
      const tableName = stackOutputs.TurnAroundPromptTableName;
      const tableResponse = await dynamoClient.send(
        new DescribeTableCommand({ TableName: tableName })
      );

      expect(tableResponse.Table?.DeletionProtectionEnabled).toBe(false);
    });

    test('should have correct table status', async () => {
      const tableName = stackOutputs.TurnAroundPromptTableName;
      const tableResponse = await dynamoClient.send(
        new DescribeTableCommand({ TableName: tableName })
      );

      expect(tableResponse.Table?.TableStatus).toBe('ACTIVE');
    });
  });

  describe('Stack Outputs Validation', () => {
    test('should have valid table ARN output', () => {
      const tableArn = stackOutputs.TurnAroundPromptTableArn;
      expect(tableArn).toBeDefined();
      expect(tableArn).toMatch(/^arn:aws:dynamodb:/);
      expect(tableArn).toContain(`TurnAroundPromptTable${environmentSuffix}`);
    });

    test('should have exports for all outputs', async () => {
      const stackResponse = await cfnClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );

      const outputs = stackResponse.Stacks?.[0].Outputs || [];

      outputs.forEach(output => {
        expect(output.ExportName).toBeDefined();
        expect(output.ExportName).toContain(stackName);
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should have stack-level tags applied', async () => {
      const stackResponse = await cfnClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );

      const stack = stackResponse.Stacks?.[0];
      expect(stack?.Tags).toBeDefined();

      // Check for common deployment tags
      const tags = stack?.Tags || [];
      const tagKeys = tags.map(tag => tag.Key);

      // These tags are typically added during deployment
      expect(
        tagKeys.some(key => key === 'Repository' || key === 'CommitAuthor')
      ).toBeTruthy();
    });
  });

  describe('Template Validation', () => {
    test('should have correct resource count', () => {
      // Should only have 1 resource (DynamoDB table)
      const dynamoResources = stackResources.filter(
        resource => resource.ResourceType === 'AWS::DynamoDB::Table'
      );
      expect(dynamoResources).toHaveLength(1);
    });

    test('should have no IAM resources', () => {
      const iamResources = stackResources.filter(resource =>
        resource.ResourceType?.startsWith('AWS::IAM::')
      );
      expect(iamResources).toHaveLength(0);
    });

    test('should have no VPC resources', () => {
      const vpcResources = stackResources.filter(resource =>
        resource.ResourceType?.startsWith('AWS::EC2::')
      );
      expect(vpcResources).toHaveLength(0);
    });

    test('should have no S3 resources', () => {
      const s3Resources = stackResources.filter(resource =>
        resource.ResourceType?.startsWith('AWS::S3::')
      );
      expect(s3Resources).toHaveLength(0);
    });
  });
});
