// Integration tests for Compliance Analysis System
// These tests dynamically discover the deployed stack and validate all resources
import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStacksCommand,
  ListStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeVpcAttributeCommand, VpcAttributeName } from '@aws-sdk/client-ec2';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { EventBridgeClient, DescribeRuleCommand } from '@aws-sdk/client-eventbridge';
import { CloudWatchClient, GetDashboardCommand } from '@aws-sdk/client-cloudwatch';

interface DiscoveredResources {
  stackName: string;
  environmentSuffix: string;
  outputs: Record<string, string>;
  resources: Map<string, { logicalId: string; physicalId: string; resourceType: string }>;
}

describe('Compliance Analysis System Integration Tests', () => {
  let discovered: DiscoveredResources;
  let region: string;
  let cfnClient: CloudFormationClient;
  let rdsClient: RDSClient;
  let ec2Client: EC2Client;
  let lambdaClient: LambdaClient;
  let snsClient: SNSClient;
  let iamClient: IAMClient;
  let logsClient: CloudWatchLogsClient;
  let eventsClient: EventBridgeClient;
  let cloudwatchClient: CloudWatchClient;

  beforeAll(async () => {
    region = process.env.AWS_REGION || 'us-east-1';
    
    // Initialize AWS clients
    cfnClient = new CloudFormationClient({ region });
    rdsClient = new RDSClient({ region });
    ec2Client = new EC2Client({ region });
    lambdaClient = new LambdaClient({ region });
    snsClient = new SNSClient({ region });
    iamClient = new IAMClient({ region });
    logsClient = new CloudWatchLogsClient({ region });
    eventsClient = new EventBridgeClient({ region });
    cloudwatchClient = new CloudWatchClient({ region });

    // Dynamically discover the stack and resources
    discovered = await discoverStackAndResources(cfnClient);
    
    console.log(`✅ Discovered stack: ${discovered.stackName}`);
    console.log(`✅ Environment suffix: ${discovered.environmentSuffix}`);
    console.log(`✅ Found ${Object.keys(discovered.outputs).length} outputs`);
    console.log(`✅ Found ${discovered.resources.size} resources`);
  }, 30000); // 30 second timeout for discovery

  /**
   * Dynamically discover the CloudFormation stack and all its resources
   */
  async function discoverStackAndResources(cfnClient: CloudFormationClient): Promise<DiscoveredResources> {
    // Try to get stack name from environment variable first
    let stackName: string | undefined = process.env.STACK_NAME;
    
    // If ENVIRONMENT_SUFFIX is provided, construct stack name
    if (!stackName && process.env.ENVIRONMENT_SUFFIX) {
      stackName = `TapStack${process.env.ENVIRONMENT_SUFFIX}`;
    }

    // If we have a stack name, verify it exists
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
        'No TapStack found. Please deploy the stack first using: ./scripts/deploy.sh'
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
    
    // Extract outputs
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

    // Get all stack resources
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

  describe('Stack Discovery', () => {
    test('should discover a valid CloudFormation stack', () => {
      expect(discovered.stackName).toBeDefined();
      expect(discovered.stackName).toMatch(/^TapStack/);
      expect(discovered.environmentSuffix).toBeDefined();
    });

    test('should have required stack outputs', () => {
      expect(discovered.outputs).toBeDefined();
      expect(discovered.outputs.VPCId).toBeDefined();
      expect(discovered.outputs.DatabaseEndpoint).toBeDefined();
      expect(discovered.outputs.EBSScannerFunctionArn).toBeDefined();
      expect(discovered.outputs.SGScannerFunctionArn).toBeDefined();
      expect(discovered.outputs.SNSTopicArn).toBeDefined();
    });

    test('should discover all stack resources', () => {
      expect(discovered.resources.size).toBeGreaterThan(0);
      expect(discovered.resources.has('ComplianceVPC')).toBe(true);
      expect(discovered.resources.has('ComplianceDatabase')).toBe(true);
      expect(discovered.resources.has('EBSScannerFunction')).toBe(true);
      expect(discovered.resources.has('SGScannerFunction')).toBe(true);
    });
  });

  describe('VPC Resources', () => {
    test('VPC should exist and be accessible', async () => {
      const vpcResource = discovered.resources.get('ComplianceVPC');
      expect(vpcResource).toBeDefined();
      
      const vpcId = vpcResource!.physicalId;
      const describeCommand = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(describeCommand);
      
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].VpcId).toBe(vpcId);
      expect(response.Vpcs![0].State).toBe('available');
    });

    test('VPC should have DNS support enabled', async () => {
      const vpcResource = discovered.resources.get('ComplianceVPC');
      const vpcId = vpcResource!.physicalId;
      
      // Check DNS support attribute
      const dnsSupportCommand = new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: VpcAttributeName.enableDnsSupport,
      });
      const dnsSupportResponse = await ec2Client.send(dnsSupportCommand);
      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
      
      // Check DNS hostnames attribute
      const dnsHostnamesCommand = new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: VpcAttributeName.enableDnsHostnames,
      });
      const dnsHostnamesResponse = await ec2Client.send(dnsHostnamesCommand);
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
    });

    test('Private subnets should exist', async () => {
      const subnet1Resource = discovered.resources.get('PrivateSubnet1');
      const subnet2Resource = discovered.resources.get('PrivateSubnet2');
      
      expect(subnet1Resource).toBeDefined();
      expect(subnet2Resource).toBeDefined();
      
      const subnet1Id = subnet1Resource!.physicalId;
      const subnet2Id = subnet2Resource!.physicalId;
      
      const describeCommand = new DescribeSubnetsCommand({
        SubnetIds: [subnet1Id, subnet2Id],
      });
      const response = await ec2Client.send(describeCommand);
      
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(2);
      response.Subnets!.forEach((subnet) => {
        expect(subnet.State).toBe('available');
      });
    });
  });

  describe('Security Groups', () => {
    test('Security groups should exist', async () => {
      const lambdaSGResource = discovered.resources.get('LambdaSecurityGroup');
      const rdsSGResource = discovered.resources.get('RDSSecurityGroup');
      
      expect(lambdaSGResource).toBeDefined();
      expect(rdsSGResource).toBeDefined();
      
      const lambdaSGId = lambdaSGResource!.physicalId;
      const rdsSGId = rdsSGResource!.physicalId;
      
      const describeCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [lambdaSGId, rdsSGId],
      });
      const response = await ec2Client.send(describeCommand);
      
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(2);
    });
  });

  describe('RDS Database', () => {
    test('RDS database should exist and be available', async () => {
      const dbResource = discovered.resources.get('ComplianceDatabase');
      expect(dbResource).toBeDefined();
      
      const dbIdentifier = dbResource!.physicalId;
      const describeCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(describeCommand);
      
      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBe(1);
      expect(response.DBInstances![0].DBInstanceStatus).toBe('available');
      expect(response.DBInstances![0].StorageEncrypted).toBe(true);
    });

    test('Database endpoint should match output', async () => {
      const dbResource = discovered.resources.get('ComplianceDatabase');
      const dbIdentifier = dbResource!.physicalId;
      const describeCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(describeCommand);
      
      const actualEndpoint = response.DBInstances![0].Endpoint?.Address;
      const expectedEndpoint = discovered.outputs.DatabaseEndpoint;
      
      expect(actualEndpoint).toBe(expectedEndpoint);
    });
  });

  describe('Lambda Functions', () => {
    test('EBS Scanner Lambda function should exist', async () => {
      const functionResource = discovered.resources.get('EBSScannerFunction');
      expect(functionResource).toBeDefined();
      
      const functionName = functionResource!.physicalId;
      const getCommand = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(getCommand);
      
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.FunctionName).toBe(functionName);
      expect(response.Configuration!.State).toBe('Active');
    });

    test('SG Scanner Lambda function should exist', async () => {
      const functionResource = discovered.resources.get('SGScannerFunction');
      expect(functionResource).toBeDefined();
      
      const functionName = functionResource!.physicalId;
      const getCommand = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(getCommand);
      
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.FunctionName).toBe(functionName);
      expect(response.Configuration!.State).toBe('Active');
    });

    test('Validation Lambda function should exist', async () => {
      const functionResource = discovered.resources.get('ValidationFunction');
      expect(functionResource).toBeDefined();
      
      const functionName = functionResource!.physicalId;
      const getCommand = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(getCommand);
      
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.FunctionName).toBe(functionName);
      expect(response.Configuration!.State).toBe('Active');
    });

    test('Lambda functions should have VPC configuration', async () => {
      const functionResource = discovered.resources.get('EBSScannerFunction');
      const functionName = functionResource!.physicalId;
      const getCommand = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(getCommand);
      
      expect(response.Configuration!.VpcConfig).toBeDefined();
      expect(response.Configuration!.VpcConfig!.SubnetIds).toBeDefined();
      expect(response.Configuration!.VpcConfig!.SubnetIds!.length).toBeGreaterThan(0);
      expect(response.Configuration!.VpcConfig!.SecurityGroupIds).toBeDefined();
      expect(response.Configuration!.VpcConfig!.SecurityGroupIds!.length).toBeGreaterThan(0);
    });
  });

  describe('IAM Roles', () => {
    test('EBS Scanner IAM role should exist', async () => {
      const roleResource = discovered.resources.get('EBSScannerRole');
      expect(roleResource).toBeDefined();
      
      const roleName = roleResource!.physicalId.split('/').pop()!;
      const getCommand = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(getCommand);
      
      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);
    });

    test('SG Scanner IAM role should exist', async () => {
      const roleResource = discovered.resources.get('SGScannerRole');
      expect(roleResource).toBeDefined();
      
      const roleName = roleResource!.physicalId.split('/').pop()!;
      const getCommand = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(getCommand);
      
      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);
    });
  });

  describe('SNS Topic', () => {
    test('SNS topic should exist', async () => {
      const topicResource = discovered.resources.get('ComplianceSNSTopic');
      expect(topicResource).toBeDefined();
      
      const topicArn = topicResource!.physicalId;
      const getCommand = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(getCommand);
      
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(topicArn);
    });

    test('SNS topic ARN should match output', () => {
      const topicResource = discovered.resources.get('ComplianceSNSTopic');
      const topicArn = topicResource!.physicalId;
      const outputArn = discovered.outputs.SNSTopicArn;
      
      expect(topicArn).toBe(outputArn);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('EBS Scanner log group should exist', async () => {
      const logGroupResource = discovered.resources.get('EBSScannerLogGroup');
      expect(logGroupResource).toBeDefined();
      
      const logGroupName = logGroupResource!.physicalId;
      const describeCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(describeCommand);
      
      expect(response.logGroups).toBeDefined();
      const logGroup = response.logGroups!.find((lg) => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
    });

    test('SG Scanner log group should exist', async () => {
      const logGroupResource = discovered.resources.get('SGScannerLogGroup');
      expect(logGroupResource).toBeDefined();
      
      const logGroupName = logGroupResource!.physicalId;
      const describeCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(describeCommand);
      
      expect(response.logGroups).toBeDefined();
      const logGroup = response.logGroups!.find((lg) => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
    });
  });

  describe('EventBridge Rules', () => {
    test('EBS Scan schedule rule should exist', async () => {
      const ruleResource = discovered.resources.get('EBSScanScheduleRule');
      expect(ruleResource).toBeDefined();
      
      const ruleName = ruleResource!.physicalId;
      const describeCommand = new DescribeRuleCommand({ Name: ruleName });
      const response = await eventsClient.send(describeCommand);
      
      expect(response.Name).toBe(ruleName);
      expect(response.State).toBe('ENABLED');
    });

    test('SG Scan schedule rule should exist', async () => {
      const ruleResource = discovered.resources.get('SGScanScheduleRule');
      expect(ruleResource).toBeDefined();
      
      const ruleName = ruleResource!.physicalId;
      const describeCommand = new DescribeRuleCommand({ Name: ruleName });
      const response = await eventsClient.send(describeCommand);
      
      expect(response.Name).toBe(ruleName);
      expect(response.State).toBe('ENABLED');
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('Compliance dashboard should exist', async () => {
      const dashboardResource = discovered.resources.get('ComplianceDashboard');
      expect(dashboardResource).toBeDefined();
      
      const dashboardName = dashboardResource!.physicalId;
      const getCommand = new GetDashboardCommand({ DashboardName: dashboardName });
      const response = await cloudwatchClient.send(getCommand);
      
      expect(response.DashboardBody).toBeDefined();
      const dashboardBody = JSON.parse(response.DashboardBody!);
      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Integration', () => {
    test('VPC ID in outputs should match actual VPC', async () => {
      const vpcResource = discovered.resources.get('ComplianceVPC');
      const vpcId = vpcResource!.physicalId;
      const outputVpcId = discovered.outputs.VPCId;
      
      expect(vpcId).toBe(outputVpcId);
    });

    test('Lambda function ARNs in outputs should match actual functions', async () => {
      const ebsFunctionResource = discovered.resources.get('EBSScannerFunction');
      const ebsFunctionName = ebsFunctionResource!.physicalId;
      const getCommand = new GetFunctionCommand({ FunctionName: ebsFunctionName });
      const response = await lambdaClient.send(getCommand);
      
      const actualArn = response.Configuration!.FunctionArn;
      const outputArn = discovered.outputs.EBSScannerFunctionArn;
      
      expect(actualArn).toBe(outputArn);
    });
  });
});

