// Integration tests for TapStack
// These tests dynamically discover the deployed stack and validate all resources
import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStacksCommand,
  ListStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';

interface DiscoveredResources {
  stackName: string;
  environmentSuffix: string;
  outputs: Record<string, string>;
  resources: Map<string, { logicalId: string; physicalId: string; resourceType: string }>;
}

describe('TapStack Integration Tests', () => {
  let discovered: DiscoveredResources;
  let cfnClient: CloudFormationClient;
  let dynamoClient: DynamoDBClient;
  const region = process.env.AWS_REGION || 'us-east-1';

  beforeAll(async () => {
    // Initialize AWS clients
    cfnClient = new CloudFormationClient({ region });
    dynamoClient = new DynamoDBClient({ region });

    // Dynamically discover the stack and all resources
    discovered = await discoverStackAndResources(cfnClient);
    
    console.log(`✅ Discovered stack: ${discovered.stackName}`);
    console.log(`✅ Environment suffix: ${discovered.environmentSuffix}`);
    console.log(`✅ Found ${Object.keys(discovered.outputs).length} outputs`);
    console.log(`✅ Found ${discovered.resources.size} resources`);
  });

  /**
   * Dynamically discover the CloudFormation stack and all its resources
   */
  async function discoverStackAndResources(cfnClient: CloudFormationClient): Promise<DiscoveredResources> {
    const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
    
    // Try to get stack name from environment variable first
    let stackName: string | undefined = process.env.STACK_NAME;
    
    // If ENVIRONMENT_SUFFIX is provided, construct stack name
    if (!stackName) {
      stackName = `TapStack${environmentSuffix}`;
    }

    // Try to find the stack by exact name first
    if (stackName) {
      try {
        const describeCommand = new DescribeStacksCommand({ StackName: stackName });
        const response = await cfnClient.send(describeCommand);
        if (response.Stacks && response.Stacks.length > 0) {
          const stackStatus = response.Stacks[0].StackStatus;
          if (stackStatus === 'CREATE_COMPLETE' || stackStatus === 'UPDATE_COMPLETE') {
            return await extractStackResources(cfnClient, stackName);
          }
        }
      } catch (error: any) {
        console.log(`Stack ${stackName} not found, falling back to discovery: ${error.message}`);
      }
    }

    // Fallback: Discover stack by pattern
    const listCommand = new ListStacksCommand({
      StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE'],
    });

    const stacks = await cfnClient.send(listCommand);
    
    // Find stacks matching TapStack pattern, prioritizing exact matches
    // Filter out nested stacks (those with hyphens after TapStack)
    const tapStacks = (stacks.StackSummaries || [])
      .filter((stack) => {
        const name = stack.StackName || '';
        // Match TapStack{suffix} pattern but exclude nested stacks
        return name.startsWith('TapStack') && 
               !name.includes('-') && // Exclude nested stacks
               (stack.StackStatus === 'CREATE_COMPLETE' || stack.StackStatus === 'UPDATE_COMPLETE');
      })
      .sort((a, b) => {
        const aTime = a.CreationTime?.getTime() || 0;
        const bTime = b.CreationTime?.getTime() || 0;
        return bTime - aTime; // Newest first
      });

    if (tapStacks.length === 0) {
      throw new Error(
        `No TapStack found. Searched for: TapStack${environmentSuffix} or TapStack*. ` +
        `Please deploy the stack first using: npm run cfn:deploy-json`
      );
    }

    const selectedStack = tapStacks[0];
    return await extractStackResources(cfnClient, selectedStack.StackName!);
  }

  /**
   * Extract all resources and outputs from a stack
   */
  async function extractStackResources(
    cfnClient: CloudFormationClient,
    stackName: string
  ): Promise<DiscoveredResources> {
    // Get stack details including outputs
    const describeCommand = new DescribeStacksCommand({ StackName: stackName });
    const stackResponse = await cfnClient.send(describeCommand);
    
    if (!stackResponse.Stacks || stackResponse.Stacks.length === 0) {
      throw new Error(`Stack ${stackName} not found`);
    }

    const stack = stackResponse.Stacks[0];
    
    // Extract outputs dynamically
    const outputs: Record<string, string> = {};
    if (stack.Outputs) {
      for (const output of stack.Outputs) {
        if (output.OutputKey && output.OutputValue) {
          outputs[output.OutputKey] = output.OutputValue;
        }
      }
    }

    // Extract environment suffix from stack name (TapStack{suffix})
    const environmentSuffix = stackName.replace(/^TapStack/, '') || 'dev';

    // Get all stack resources dynamically
    const resources = new Map<string, { logicalId: string; physicalId: string; resourceType: string }>();
    let nextToken: string | undefined;
    
    do {
      const resourcesCommand = new ListStackResourcesCommand({
        StackName: stackName,
        NextToken: nextToken,
      });
      const resourcesResponse = await cfnClient.send(resourcesCommand);
      
      if (resourcesResponse.StackResourceSummaries) {
        for (const resource of resourcesResponse.StackResourceSummaries) {
          if (resource.LogicalResourceId && resource.PhysicalResourceId) {
            resources.set(resource.LogicalResourceId, {
              logicalId: resource.LogicalResourceId,
              physicalId: resource.PhysicalResourceId,
              resourceType: resource.ResourceType || 'Unknown',
            });
          }
        }
      }
      
      nextToken = resourcesResponse.NextToken;
    } while (nextToken);

    return {
      stackName,
      environmentSuffix,
      outputs,
      resources,
    };
  }

  describe('Stack Outputs Validation', () => {
    test('should have all required stack outputs', () => {
      expect(discovered.outputs.TurnAroundPromptTableName).toBeDefined();
      expect(discovered.outputs.TurnAroundPromptTableArn).toBeDefined();
      expect(discovered.outputs.StackName).toBeDefined();
      expect(discovered.outputs.EnvironmentSuffix).toBeDefined();
    });

    test('environmentSuffix should match deployment environment', () => {
      expect(discovered.outputs.EnvironmentSuffix).toBe(discovered.environmentSuffix);
    });

    test('stack name should include environment suffix', () => {
      expect(discovered.outputs.StackName).toContain(discovered.environmentSuffix);
    });

    test('table name should include environment suffix', () => {
      expect(discovered.outputs.TurnAroundPromptTableName).toContain(discovered.environmentSuffix);
      expect(discovered.outputs.TurnAroundPromptTableName).toBe(`TurnAroundPromptTable${discovered.environmentSuffix}`);
    });

    test('table ARN should be valid format', () => {
      expect(discovered.outputs.TurnAroundPromptTableArn).toMatch(/^arn:aws:dynamodb:[a-z0-9-]+:\d+:table\/.+$/);
    });
  });

  describe('DynamoDB Table Validation (via AWS SDK)', () => {
    let tableInfo: any;

    beforeAll(async () => {
      // Dynamically get table name from discovered outputs
      const tableName = discovered.outputs.TurnAroundPromptTableName;
      if (!tableName) {
        throw new Error('TurnAroundPromptTableName not found in stack outputs');
      }

      const describeCommand = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(describeCommand);
      tableInfo = response.Table;
    });

    test('DynamoDB table should exist and be active', () => {
      expect(tableInfo).toBeDefined();
      expect(tableInfo.TableName).toBe(discovered.outputs.TurnAroundPromptTableName);
      expect(tableInfo.TableStatus).toBe('ACTIVE');
    });

    test('DynamoDB table should have correct billing mode', () => {
      expect(tableInfo.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('DynamoDB table should have correct key schema', () => {
      expect(tableInfo.KeySchema).toHaveLength(1);
      expect(tableInfo.KeySchema[0].AttributeName).toBe('id');
      expect(tableInfo.KeySchema[0].KeyType).toBe('HASH');
    });

    test('DynamoDB table should have correct attribute definitions', () => {
      expect(tableInfo.AttributeDefinitions).toHaveLength(1);
      expect(tableInfo.AttributeDefinitions[0].AttributeName).toBe('id');
      expect(tableInfo.AttributeDefinitions[0].AttributeType).toBe('S');
    });

    test('DynamoDB table should have deletion protection disabled', () => {
      expect(tableInfo.DeletionProtectionEnabled).toBe(false);
    });

    test('DynamoDB table ARN should match output', () => {
      expect(tableInfo.TableArn).toBe(discovered.outputs.TurnAroundPromptTableArn);
    });
  });

  describe('Resource Discovery Validation', () => {
    test('should discover DynamoDB table resource from stack', () => {
      // Dynamically find the DynamoDB table resource
      const tableResource = Array.from(discovered.resources.values()).find(
        (r) => r.resourceType === 'AWS::DynamoDB::Table'
      );
      
      expect(tableResource).toBeDefined();
      expect(tableResource?.logicalId).toBe('TurnAroundPromptTable');
      expect(tableResource?.physicalId).toBe(discovered.outputs.TurnAroundPromptTableName);
    });

    test('should discover all resources from stack', () => {
      // Verify we discovered at least the DynamoDB table
      expect(discovered.resources.size).toBeGreaterThan(0);
      
      // Verify the table resource exists
      const tableResource = discovered.resources.get('TurnAroundPromptTable');
      expect(tableResource).toBeDefined();
      expect(tableResource?.resourceType).toBe('AWS::DynamoDB::Table');
    });
  });

  describe('Resource Configuration Validation', () => {
    test('table should be configured for test environment cleanup', async () => {
      const tableName = discovered.outputs.TurnAroundPromptTableName;
      const describeCommand = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(describeCommand);
      const tableInfo = response.Table;

      // Verify table can be deleted (no deletion protection)
      expect(tableInfo?.DeletionProtectionEnabled).toBe(false);

      // Verify on-demand billing (no reserved capacity to worry about)
      expect(tableInfo?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('stack should support multi-environment deployment', () => {
      // Table name includes environment suffix for isolation
      expect(discovered.outputs.TurnAroundPromptTableName).toMatch(/^TurnAroundPromptTable[a-zA-Z0-9]+$/);

      // Stack name includes environment suffix
      expect(discovered.outputs.StackName).toMatch(/^TapStack[a-zA-Z0-9]+$/);
    });
  });
});
