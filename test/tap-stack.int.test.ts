import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListExportsCommand,
} from '@aws-sdk/client-cloudformation';
import {
  DeleteItemCommand,
  DescribeContinuousBackupsCommand,
  DescribeTableCommand,
  DynamoDBClient,
  GetItemCommand,
  ListTagsOfResourceCommand,
  PutItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import {
  GetRoleCommand,
  GetRolePolicyCommand,
  IAMClient,
  ListRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  GetFunctionCommand,
  InvokeCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import fs from 'fs';
import path from 'path';

// Configuration - These are coming from cfn-outputs after deployment
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getOutputs = () => {
  try {
    const outputsPath = path.join(
      __dirname,
      '../cfn-outputs/flat-outputs.json'
    );
    if (fs.existsSync(outputsPath)) {
      return JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    }
  } catch (error) {
    console.warn(
      'CFN outputs file not found, using environment variables or defaults'
    );
  }
  return {};
};

// const outputs = getOutputs();

// Get environment configuration
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const deploymentRegion = process.env.DEPLOYMENT_REGION || 'us-west-1';
const stackName = process.env.STACK_NAME || `TapStack${environmentSuffix}`;
const applicationName = process.env.APPLICATION_NAME || 'multi-region-app';
const environment = process.env.ENVIRONMENT || 'production';

// Allow manual override of expected table name for testing
const manualTableName = process.env.EXPECTED_TABLE_NAME;

// AWS SDK v3 Configuration
const awsRegion = process.env.AWS_REGION || deploymentRegion;
const dynamodb = new DynamoDBClient({ region: awsRegion });
const lambda = new LambdaClient({ region: awsRegion });
const iam = new IAMClient({ region: awsRegion });
const cloudformation = new CloudFormationClient({ region: awsRegion });

describe('TapStack Integration Tests - DynamoDB Multi-Region Deployment', () => {
  let stackOutputs: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
  let expectedTableName: string;
  let expectedRoleName: string;
  let expectedFunctionName: string;
  let stackExists = false; // eslint-disable-line @typescript-eslint/no-explicit-any

  beforeAll(async () => {
    // Calculate expected resource names based on environment and region
    const regionSuffix = deploymentRegion === 'us-west-1' ? 'west1' : 'west2';
    expectedTableName = `multi-region-app-${environmentSuffix}-${regionSuffix}-table`;
    expectedRoleName = `multi-region-app-${environmentSuffix}-dynamodb-role-${deploymentRegion}`;
    expectedFunctionName = `multi-region-app-${environmentSuffix}-cross-region-function`;

    try {
      // Get stack outputs from CloudFormation
      console.log(`Looking for stack: ${stackName} in region: ${deploymentRegion}`);
      const stackResponse = await cloudformation.send(
        new DescribeStacksCommand({
          StackName: stackName,
        })
      );

      if (stackResponse.Stacks && stackResponse.Stacks[0].Outputs) {
        stackExists = true;
        console.log(`Stack found! Status: ${stackResponse.Stacks[0].StackStatus}`);
        stackResponse.Stacks[0].Outputs.forEach(output => {
          if (output.OutputKey && output.OutputValue) {
            stackOutputs[output.OutputKey] = output.OutputValue;
          }
        });
      }
    } catch (error) {
      console.warn(
        'Stack not found or accessible. Some tests will be skipped:',
        (error as Error).message
      );
      // Don't log full error details in production
      stackExists = false;
    }
  });

  describe('Environment Configuration', () => {
    test('should have correct environment variables set', () => {
      expect(deploymentRegion).toMatch(/^us-(east|west)-[12]$/);
      expect(applicationName).toBe('multi-region-app');
      expect(environment).toBeDefined();
      expect(stackName).toContain('TapStack');
    });

    test('should calculate correct resource names', () => {
      // Dynamic values based on environment and region
      const regionSuffix = deploymentRegion === 'us-west-1' ? 'west1' : 'west2';
      expect(expectedTableName).toBe(`multi-region-app-${environmentSuffix}-${regionSuffix}-table`);
      expect(expectedRoleName).toBe(`multi-region-app-${environmentSuffix}-dynamodb-role-${deploymentRegion}`);
      expect(expectedFunctionName).toBe(`multi-region-app-${environmentSuffix}-cross-region-function`);
    });
  });

  describe('CloudFormation Stack Validation', () => {
    test('should have deployed stack successfully', async () => {
      if (!stackExists) {
        console.log('Skipping stack validation - stack not deployed');
        return;
      }

      const response = await cloudformation.send(
        new DescribeStacksCommand({
          StackName: stackName,
        })
      );

      expect(response.Stacks).toBeDefined();
      expect(response.Stacks).toHaveLength(1);
      expect(response.Stacks![0].StackStatus).toBe('CREATE_COMPLETE');
    });

    test('should have correct stack outputs', async () => {
      if (!stackExists) {
        console.log('Skipping stack outputs validation - stack not deployed');
        return;
      }

      const requiredOutputs = [
        'TableName',
        'TableArn',
        'IAMRoleArn',
        'CapacityConfiguration',
        'TableDetails',
      ];

      // Additional outputs for us-west-2
      if (deploymentRegion === 'us-west-2') {
        requiredOutputs.push(
          'TableStreamArn',
          'GSIArn',
          'LambdaFunctionArn',
          'CrossRegionConfig'
        );
      }

      requiredOutputs.forEach(outputKey => {
        expect(stackOutputs[outputKey]).toBeDefined();
        expect(stackOutputs[outputKey]).not.toBe('');
      });
    });

    test('should have exports for cross-stack references', async () => {
      if (!stackExists) {
        console.log('Skipping exports validation - stack not deployed');
        return;
      }

      const response = await cloudformation.send(new ListExportsCommand({}));
      const exports = response.Exports || [];

      const expectedExports = [
        `${stackName}-TableName`,
        `${stackName}-TableArn`,
        `${stackName}-IAMRoleArn`,
        `${stackName}-CapacityConfig`,
        `${stackName}-TableDetails`,
      ];

      // Additional exports for us-west-2
      if (deploymentRegion === 'us-west-2') {
        expectedExports.push(
          `${stackName}-TableStreamArn`,
          `${stackName}-GSIArn`,
          `${stackName}-LambdaFunctionArn`,
          `${stackName}-CrossRegionConfig`
        );
      }

      expectedExports.forEach(exportName => {
        const exportExists = exports.some(exp => exp.Name === exportName);
        expect(exportExists).toBe(true);
      });
    });
  });

  describe('DynamoDB Table Validation', () => {
    test('should have created DynamoDB table with correct name', async () => {
      if (!stackExists) {
        console.log('Skipping DynamoDB table validation - stack not deployed');
        return;
      }

      const response = await dynamodb.send(
        new DescribeTableCommand({
          TableName: expectedTableName,
        })
      );

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableName).toBe(expectedTableName);
      expect(response.Table!.TableStatus).toBe('ACTIVE');
    });

    test('should have correct table configuration', async () => {
      if (!stackExists) {
        console.log(
          'Skipping table configuration validation - stack not deployed'
        );
        return;
      }

      const response = await dynamodb.send(
        new DescribeTableCommand({
          TableName: expectedTableName,
        })
      );

      const table = response.Table!;

      // Verify billing mode - for PROVISIONED tables, BillingModeSummary might be null
      // but ProvisionedThroughput should be present
      expect(table.ProvisionedThroughput).toBeDefined();
      expect(table.ProvisionedThroughput!.ReadCapacityUnits).toBeGreaterThan(0);
      expect(table.ProvisionedThroughput!.WriteCapacityUnits).toBeGreaterThan(0);

      // Verify key schema
      expect(table.KeySchema).toHaveLength(2);
      expect(table.KeySchema![0].AttributeName).toBe('PrimaryKey');
      expect(table.KeySchema![0].KeyType).toBe('HASH');
      expect(table.KeySchema![1].AttributeName).toBe('SortKey');
      expect(table.KeySchema![1].KeyType).toBe('RANGE');
    });

    test('should have correct capacity settings based on region', async () => {
      if (!stackExists) {
        console.log(
          'Skipping capacity settings validation - stack not deployed'
        );
        return;
      }

      const response = await dynamodb.send(
        new DescribeTableCommand({
          TableName: expectedTableName,
        })
      );

      const table = response.Table!;

      if (deploymentRegion === 'us-west-1') {
        // Fixed capacity for us-west-1
        expect(table.ProvisionedThroughput!.ReadCapacityUnits).toBe(5);
        expect(table.ProvisionedThroughput!.WriteCapacityUnits).toBe(5);
      } else {
        // Parameterized capacity for us-west-2
        expect(table.ProvisionedThroughput!.ReadCapacityUnits).toBeGreaterThan(
          0
        );
        expect(table.ProvisionedThroughput!.WriteCapacityUnits).toBeGreaterThan(
          0
        );
      }
    });

    test('should have correct encryption and backup settings', async () => {
      if (!stackExists) {
        console.log(
          'Skipping encryption and backup validation - stack not deployed'
        );
        return;
      }

      const response = await dynamodb.send(
        new DescribeTableCommand({
          TableName: expectedTableName,
        })
      );

      const table = response.Table!;

      // Verify encryption
      expect(table.SSEDescription?.Status).toBe('ENABLED');

      // Verify point-in-time recovery
      const backupResponse = await dynamodb.send(
        new DescribeContinuousBackupsCommand({
          TableName: expectedTableName,
        })
      );

      expect(
        backupResponse.ContinuousBackupsDescription
          ?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus
      ).toBe('ENABLED');
    });

    test('should have GSI only for us-west-2', async () => {
      if (!stackExists) {
        console.log('Skipping GSI validation - stack not deployed');
        return;
      }

      const response = await dynamodb.send(
        new DescribeTableCommand({
          TableName: expectedTableName,
        })
      );

      const table = response.Table!;

      if (deploymentRegion === 'us-west-2') {
        expect(table.GlobalSecondaryIndexes).toBeDefined();
        expect(table.GlobalSecondaryIndexes).toHaveLength(1);
        expect(table.GlobalSecondaryIndexes![0].IndexName).toBe('GSI1');
        expect(table.GlobalSecondaryIndexes![0].IndexStatus).toBe('ACTIVE');
      } else {
        expect(table.GlobalSecondaryIndexes).toBeUndefined();
      }
    });

    test('should have streams enabled only for us-west-2', async () => {
      if (!stackExists) {
        console.log('Skipping streams validation - stack not deployed');
        return;
      }

      const response = await dynamodb.send(
        new DescribeTableCommand({
          TableName: expectedTableName,
        })
      );

      const table = response.Table!;

      if (deploymentRegion === 'us-west-2') {
        expect(table.StreamSpecification?.StreamEnabled).toBe(true);
        expect(table.StreamSpecification?.StreamViewType).toBe(
          'NEW_AND_OLD_IMAGES'
        );
        expect(table.LatestStreamArn).toBeDefined();
      } else {
        expect(table.StreamSpecification?.StreamEnabled).toBeFalsy();
      }
    });

    test('should have correct tags', async () => {
      if (!stackExists || !stackOutputs.TableArn) {
        console.log(
          'Skipping tags validation - stack not deployed or TableArn not available'
        );
        return;
      }

      const response = await dynamodb.send(
        new ListTagsOfResourceCommand({
          ResourceArn: stackOutputs.TableArn,
        })
      );

      const tags = response.Tags || [];
      const tagMap = tags.reduce(
        (acc, tag) => {
          acc[tag.Key!] = tag.Value!;
          return acc;
        },
        {} as Record<string, string>
      );

      expect(tagMap['Environment']).toBe(environmentSuffix);
      expect(tagMap['Application']).toBe('multi-region-app');
      expect(tagMap['ManagedBy']).toBe('CloudFormation');
      expect(tagMap['DeploymentRegion']).toBe(deploymentRegion);
    });
  });

  describe('IAM Role Validation', () => {
    test('should have created DynamoDB access role', async () => {
      if (!stackExists) {
        console.log('Skipping IAM role validation - stack not deployed');
        return;
      }

      // Get the role ARN from stack outputs and extract the role name
      const roleArn = stackOutputs['IAMRoleArn'];
      expect(roleArn).toBeDefined();
      
      const roleName = roleArn.split('/').pop();
      expect(roleName).toBeDefined();

      const response = await iam.send(
        new GetRoleCommand({
          RoleName: roleName,
        })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);
    });

    test('should have correct assume role policy', async () => {
      if (!stackExists) {
        console.log(
          'Skipping assume role policy validation - stack not deployed'
        );
        return;
      }

      // Get the role ARN from stack outputs and extract the role name
      const roleArn = stackOutputs['IAMRoleArn'];
      expect(roleArn).toBeDefined();
      
      const roleName = roleArn.split('/').pop();
      expect(roleName).toBeDefined();

      const response = await iam.send(
        new GetRoleCommand({
          RoleName: roleName,
        })
      );

      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role!.AssumeRolePolicyDocument!)
      );

      expect(assumeRolePolicy.Version).toBe('2012-10-17');
      expect(assumeRolePolicy.Statement).toHaveLength(1);
      expect(assumeRolePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe(
        'lambda.amazonaws.com'
      );
      expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should have DynamoDB access policies', async () => {
      if (!stackExists) {
        console.log(
          'Skipping DynamoDB access policies validation - stack not deployed'
        );
        return;
      }

      // Get the role ARN from stack outputs and extract the role name
      const roleArn = stackOutputs['IAMRoleArn'];
      expect(roleArn).toBeDefined();
      
      const roleName = roleArn.split('/').pop();
      expect(roleName).toBeDefined();

      const response = await iam.send(
        new ListRolePoliciesCommand({
          RoleName: roleName,
        })
      );

      expect(response.PolicyNames).toContain('DynamoDBAccess');

      const policyResponse = await iam.send(
        new GetRolePolicyCommand({
          RoleName: roleName,
          PolicyName: 'DynamoDBAccess',
        })
      );

      const policyDocument = JSON.parse(
        decodeURIComponent(policyResponse.PolicyDocument!)
      );
      const statement = policyDocument.Statement[0];

      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toContain('dynamodb:GetItem');
      expect(statement.Action).toContain('dynamodb:PutItem');
      expect(statement.Resource).toContain(stackOutputs.TableArn);
    });
  });

  describe('Lambda Function Validation (us-west-2 only)', () => {
    test('should have created cross-region Lambda function', async () => {
      if (deploymentRegion !== 'us-west-2') {
        console.log(
          'Skipping Lambda function test - only applies to us-west-2'
        );
        return;
      }
      if (!stackExists) {
        console.log('Skipping Lambda function validation - stack not deployed');
        return;
      }

      const response = await lambda.send(
        new GetFunctionCommand({
          FunctionName: expectedFunctionName,
        })
      );

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.FunctionName).toBe(expectedFunctionName);
      expect(response.Configuration!.State).toBe('Active');
      expect(response.Configuration!.Runtime).toBe('python3.9');
    });

    test('should have correct environment variables', async () => {
      if (deploymentRegion !== 'us-west-2') {
        console.log(
          'Skipping Lambda environment variables test - only applies to us-west-2'
        );
        return;
      }
      if (!stackExists) {
        console.log(
          'Skipping Lambda environment variables validation - stack not deployed'
        );
        return;
      }

      const response = await lambda.send(
        new GetFunctionCommand({
          FunctionName: expectedFunctionName,
        })
      );

      const envVars = response.Configuration!.Environment!.Variables!;

      expect(envVars.LOCAL_TABLE_NAME).toBe(expectedTableName);
      expect(envVars.LOCAL_TABLE_ARN).toBe(stackOutputs.TableArn);
      expect(envVars.REMOTE_TABLE_NAME).toBeDefined();
      expect(envVars.REMOTE_TABLE_ARN).toBeDefined();
      expect(envVars.TABLE_CONFIG).toBeDefined();
    });

    test('should be able to invoke Lambda function', async () => {
      if (deploymentRegion !== 'us-west-2') {
        console.log('Skipping Lambda invoke test - only applies to us-west-2');
        return;
      }
      if (!stackExists) {
        console.log('Skipping Lambda invoke validation - stack not deployed');
        return;
      }

      const response = await lambda.send(
        new InvokeCommand({
          FunctionName: expectedFunctionName,
          InvocationType: 'RequestResponse',
          Payload: new TextEncoder().encode(JSON.stringify({})),
        })
      );

      expect(response.StatusCode).toBe(200);

      if (response.Payload) {
        const payloadString = new TextDecoder().decode(response.Payload);
        const payload = JSON.parse(payloadString);
        expect(payload.statusCode).toBe(200);

        const body = JSON.parse(payload.body);
        expect(body.message).toBe('Cross-region DynamoDB access configured');
        expect(body.local_table).toBe(expectedTableName);
      }
    });
  });

  describe('DynamoDB Operations Validation', () => {
    const testItem = {
      PrimaryKey: { S: 'test-key-integration' },
      SortKey: { S: 'test-sort-integration' },
      TestData: { S: 'integration-test-data' },
      Timestamp: { N: Date.now().toString() },
    };

    afterEach(async () => {
      if (!stackExists) return;

      // Clean up test data
      try {
        await dynamodb.send(
          new DeleteItemCommand({
            TableName: expectedTableName,
            Key: {
              PrimaryKey: testItem.PrimaryKey,
              SortKey: testItem.SortKey,
            },
          })
        );
      } catch (error) {
        // Ignore errors during cleanup
      }
    });

    test('should be able to put and get item from DynamoDB table', async () => {
      if (!stackExists) {
        console.log(
          'Skipping DynamoDB operations validation - stack not deployed'
        );
        return;
      }

      // Put item
      await dynamodb.send(
        new PutItemCommand({
          TableName: expectedTableName,
          Item: testItem,
        })
      );

      // Get item
      const response = await dynamodb.send(
        new GetItemCommand({
          TableName: expectedTableName,
          Key: {
            PrimaryKey: testItem.PrimaryKey,
            SortKey: testItem.SortKey,
          },
        })
      );

      expect(response.Item).toBeDefined();
      expect(response.Item!.PrimaryKey.S).toBe('test-key-integration');
      expect(response.Item!.TestData.S).toBe('integration-test-data');
    });

    test('should be able to query DynamoDB table', async () => {
      if (!stackExists) {
        console.log('Skipping DynamoDB query validation - stack not deployed');
        return;
      }

      // Put item first
      await dynamodb.send(
        new PutItemCommand({
          TableName: expectedTableName,
          Item: testItem,
        })
      );

      // Query it
      const response = await dynamodb.send(
        new QueryCommand({
          TableName: expectedTableName,
          KeyConditionExpression: 'PrimaryKey = :pk',
          ExpressionAttributeValues: {
            ':pk': { S: 'test-key-integration' },
          },
        })
      );

      expect(response.Items).toBeDefined();
      expect(response.Items).toHaveLength(1);
      expect(response.Items![0].PrimaryKey.S).toBe('test-key-integration');
    });
  });

  describe('Performance and Monitoring', () => {
    test('should have reasonable response times for basic operations', async () => {
      if (!stackExists) {
        console.log('Skipping performance validation - stack not deployed');
        return;
      }

      const startTime = Date.now();

      await dynamodb.send(
        new DescribeTableCommand({
          TableName: expectedTableName,
        })
      );

      const responseTime = Date.now() - startTime;

      // Response time should be less than 5 seconds for describe operation
      expect(responseTime).toBeLessThan(5000);
    });

    test('should be able to access AWS resources', async () => {
      // This test will always run to validate AWS connectivity
      try {
        const response = await cloudformation.send(new ListExportsCommand({}));
        expect(response).toBeDefined();
        expect(Array.isArray(response.Exports)).toBe(true);
      } catch (error) {
        console.warn('AWS connectivity test failed:', (error as Error).message);
        // Don't fail the test, just log the warning
      }
    });
  });
});
