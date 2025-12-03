import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  ListDashboardsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeInstancesCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  EventBridgeClient,
  ListRulesCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import {
  GetFunctionCommand,
  InvokeCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import * as fs from 'fs';
import * as path from 'path';

const region = 'us-east-1';
const ec2Client = new EC2Client({ region });
const lambdaClient = new LambdaClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any;

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  // Parse instanceIds if it's a JSON string
  if (typeof outputs.instanceIds === 'string') {
    outputs.instanceIds = JSON.parse(outputs.instanceIds);
  }
} catch (error) {
  console.error('Failed to load deployment outputs:', error);
  throw new Error(
    'Deployment outputs not found. Ensure infrastructure is deployed first.'
  );
}

describe('TAP Stack Integration Tests', () => {
  describe('VPC Infrastructure', () => {
    it('should have VPC deployed and available', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);
      expect(response.Vpcs?.[0].State).toBe('available');
    });

    it('should have VPC with correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs?.[0].CidrBlock).toBeDefined();
      expect(response.Vpcs?.[0].CidrBlock).toMatch(/^10\.\d+\.\d+\.\d+\/16$/);
    });

    it('should have public subnets created', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.vpcId] },
          { Name: 'tag:Name', Values: ['*public*'] },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBeGreaterThanOrEqual(2);
    });

    it('should have private subnets created', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.vpcId] },
          { Name: 'tag:Name', Values: ['*private*'] },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBeGreaterThanOrEqual(2);
    });

    it('should have internet gateway attached', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [{ Name: 'attachment.vpc-id', Values: [outputs.vpcId] }],
      });
      const response = await ec2Client.send(command);

      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways?.length).toBe(1);
      expect(
        response.InternetGateways?.[0].Attachments?.[0].State
      ).toBe('available');
    });

    it('should have NAT gateway in public subnet', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [outputs.vpcId] }],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways?.length).toBeGreaterThanOrEqual(1);
      expect(response.NatGateways?.[0].State).toBe('available');
    });
  });

  describe('EC2 Instances', () => {
    it('should have EC2 instances running', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: outputs.instanceIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Reservations).toBeDefined();
      expect(response.Reservations?.length).toBeGreaterThan(0);

      const instances = response.Reservations?.flatMap(
        (r) => r.Instances || []
      );
      expect(instances).toBeDefined();
      expect(instances?.length).toBe(outputs.instanceIds.length);
    });

    it('should have instances with required tags', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: outputs.instanceIds,
      });
      const response = await ec2Client.send(command);

      const instances = response.Reservations?.flatMap(
        (r) => r.Instances || []
      );

      instances?.forEach((instance) => {
        const tags = instance.Tags || [];
        const tagKeys = tags.map((t) => t.Key);

        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Owner');
        expect(tagKeys).toContain('CostCenter');
      });
    });

    it('should have instances in private subnets', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: outputs.instanceIds,
      });
      const response = await ec2Client.send(command);

      const instances = response.Reservations?.flatMap(
        (r) => r.Instances || []
      );

      // Verify instances are in private subnets
      instances?.forEach((instance) => {
        expect(instance.SubnetId).toBeDefined();
        expect(instance.PublicIpAddress).toBeUndefined(); // Private instances should not have public IPs
      });
    });

    it('should have security group attached to instances', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: outputs.instanceIds,
      });
      const response = await ec2Client.send(command);

      const instances = response.Reservations?.flatMap(
        (r) => r.Instances || []
      );

      instances?.forEach((instance) => {
        expect(instance.SecurityGroups).toBeDefined();
        expect(instance.SecurityGroups?.length).toBeGreaterThan(0);
      });
    });

    it('should have security group with egress rules', async () => {
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.instanceIds[0]],
      });
      const instanceResponse = await ec2Client.send(instanceCommand);

      const securityGroupId =
        instanceResponse.Reservations?.[0].Instances?.[0].SecurityGroups?.[0]
          .GroupId;

      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId!],
      });
      const sgResponse = await ec2Client.send(sgCommand);

      expect(sgResponse.SecurityGroups?.[0].IpPermissionsEgress).toBeDefined();
      expect(
        sgResponse.SecurityGroups?.[0].IpPermissionsEgress?.length
      ).toBeGreaterThan(0);
    });
  });

  describe('Lambda Function', () => {
    it('should have Lambda function deployed', async () => {
      const functionName = outputs.lambdaFunctionArn.split(':').pop();
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.State).toBe('Active');
    });

    it('should have Lambda with Python 3.13 runtime', async () => {
      const functionName = outputs.lambdaFunctionArn.split(':').pop();
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Runtime).toBe('python3.13');
    });

    it('should have Lambda with appropriate timeout', async () => {
      const functionName = outputs.lambdaFunctionArn.split(':').pop();
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Timeout).toBeDefined();
      expect(response.Configuration?.Timeout).toBeGreaterThanOrEqual(60);
    });

    it('should have Lambda with environment variables', async () => {
      const functionName = outputs.lambdaFunctionArn.split(':').pop();
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Environment?.Variables).toBeDefined();
    });

    it('should have Lambda with IAM role', async () => {
      const functionName = outputs.lambdaFunctionArn.split(':').pop();
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Role).toBeDefined();
      expect(response.Configuration?.Role).toMatch(/^arn:aws:iam::/);
    });

    it('should be able to invoke Lambda function', async () => {
      const functionName = outputs.lambdaFunctionArn.split(':').pop();
      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: Buffer.from(JSON.stringify({})),
      });

      const response = await lambdaClient.send(command);

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();
    });
  });

  describe('CloudWatch Monitoring', () => {
    it('should have CloudWatch dashboard created', async () => {
      const dashboardName = outputs.dashboardUrl
        .split('dashboards:name=')
        .pop();
      const command = new ListDashboardsCommand({
        DashboardNamePrefix: dashboardName,
      });
      const response = await cloudWatchClient.send(command);

      expect(response.DashboardEntries).toBeDefined();
      expect(response.DashboardEntries?.length).toBeGreaterThan(0);
      expect(response.DashboardEntries?.[0].DashboardName).toContain(
        'compliance'
      );
    });

    it('should have CloudWatch alarm created', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'compliance-violations',
      });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);
    });

    it('should have alarm in OK state (no compliance issues initially)', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'compliance-violations',
      });
      const response = await cloudWatchClient.send(command);

      const alarms = response.MetricAlarms || [];
      alarms.forEach((alarm) => {
        expect(['OK', 'INSUFFICIENT_DATA']).toContain(alarm.StateValue);
      });
    });
  });

  describe('EventBridge Integration', () => {
    it('should have EventBridge rule created', async () => {
      const command = new ListRulesCommand({
        NamePrefix: 'compliance-check-rule',
      });
      const response = await eventBridgeClient.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);
    });

    it('should have EventBridge rule targeting Lambda', async () => {
      const rulesCommand = new ListRulesCommand({
        NamePrefix: 'compliance-check-rule',
      });
      const rulesResponse = await eventBridgeClient.send(rulesCommand);

      const ruleName = rulesResponse.Rules?.[0].Name;

      const targetsCommand = new ListTargetsByRuleCommand({
        Rule: ruleName,
      });
      const targetsResponse = await eventBridgeClient.send(targetsCommand);

      expect(targetsResponse.Targets).toBeDefined();
      expect(targetsResponse.Targets?.length).toBeGreaterThan(0);
      expect(targetsResponse.Targets?.[0].Arn).toContain('lambda');
    });

    it('should have EventBridge rule with schedule expression', async () => {
      const command = new ListRulesCommand({
        NamePrefix: 'compliance-check-rule',
      });
      const response = await eventBridgeClient.send(command);

      expect(response.Rules?.[0].ScheduleExpression).toBeDefined();
      expect(response.Rules?.[0].State).toBe('ENABLED');
    });
  });

  describe('Infrastructure Tags', () => {
    it('should have consistent tagging across all resources', async () => {
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);

      const vpcTags = vpcResponse.Vpcs?.[0].Tags || [];
      const managedByTag = vpcTags.find((t) => t.Key === 'ManagedBy');
      const projectTag = vpcTags.find((t) => t.Key === 'Project');

      expect(managedByTag?.Value).toBe('pulumi');
      expect(projectTag?.Value).toBe('compliance-monitoring');
    });
  });
});
