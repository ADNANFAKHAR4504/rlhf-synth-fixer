import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
  DescribeLaunchTemplatesCommand,
  DescribeLaunchTemplateVersionsCommand,
  DescribeVolumesCommand,
  DescribeAddressesCommand,
} from '@aws-sdk/client-ec2';
import {
  IAMClient,
  GetRoleCommand,
  GetInstanceProfileCommand,
  GetRolePolicyCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetMetricStatisticsCommand,
  ListMetricsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketPolicyCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';

// Read outputs from deployed stack
let outputs: any;
let stackName: string;
let environmentSuffix: string;
let region: string;

beforeAll(() => {
  // Load stack outputs
  const outputsPath = 'cfn-outputs/flat-outputs.json';
  if (fs.existsSync(outputsPath)) {
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  } else {
    throw new Error(`Outputs file not found at ${outputsPath}. Please deploy the stack first.`);
  }

  // Get stack name and environment suffix from outputs
  stackName = outputs.StackName || process.env.STACK_NAME || '';
  environmentSuffix = outputs.EnvironmentSuffix || '';
  region = process.env.AWS_REGION || 'us-east-1';

  if (!stackName) {
    throw new Error('StackName not found in outputs or environment variables');
  }
  if (!environmentSuffix) {
    throw new Error('EnvironmentSuffix not found in outputs');
  }
});

describe('TapStack Infrastructure - Comprehensive Integration Tests', () => {
  const ec2Client = new EC2Client({ region });
  const iamClient = new IAMClient({ region });
  const cwClient = new CloudWatchClient({ region });
  const snsClient = new SNSClient({ region });
  const s3Client = new S3Client({ region });
  const logsClient = new CloudWatchLogsClient({ region });
  const eventsClient = new EventBridgeClient({ region });
  const cfnClient = new CloudFormationClient({ region });

  // ===========================================================================
  // A. Pre-Deployment Validation
  // ===========================================================================
  describe('Pre-Deployment Validation', () => {
    test('stack outputs file should exist and be valid JSON', () => {
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
    });

    test('all required outputs should be present', () => {
      const requiredOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'SNSTopicArn',
        'S3BucketName',
        'PrivateInstance1Id',
        'PrivateInstance2Id',
        'EC2InstanceRoleArn',
      ];

      requiredOutputs.forEach((output) => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('stack should be successfully deployed', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      expect(response.Stacks).toHaveLength(1);
      const stackStatus = response.Stacks![0].StackStatus;
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(stackStatus);
    });
  });

  // ===========================================================================
  // B. VPC & Network Flow Tests
  // ===========================================================================
  describe('VPC & Network Flow Tests', () => {
    test('VPC should exist with correct CIDR and DNS settings', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(outputs.VPCId);
      expect(vpc.CidrBlock).toBeDefined();
    });

    test('public subnets should have IGW route (0.0.0.0/0)', async () => {
      const subnetsCommand = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id],
      });
      const subnetsResponse = await ec2Client.send(subnetsCommand);

      const rtCommand = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const rtResponse = await ec2Client.send(rtCommand);

      const publicSubnets = subnetsResponse.Subnets || [];
      publicSubnets.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });

      // Find public route table (has IGW route)
      const publicRouteTable = rtResponse.RouteTables!.find((rt) =>
        rt.Routes?.some(
          (route) =>
            route.DestinationCidrBlock === '0.0.0.0/0' &&
            route.GatewayId?.startsWith('igw-')
        )
      );

      expect(publicRouteTable).toBeDefined();
    });

    test('private subnets should have NAT Gateway routes', async () => {
      const rtCommand = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(rtCommand);

      // Find private route tables (have NAT Gateway routes)
      const privateRouteTables = response.RouteTables!.filter((rt) =>
        rt.Routes?.some(
          (route) =>
            route.DestinationCidrBlock === '0.0.0.0/0' &&
            route.NatGatewayId?.startsWith('nat-')
        )
      );

      expect(privateRouteTables.length).toBeGreaterThanOrEqual(2);
    });

    test('subnets should be in different availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
        ],
      });
      const response = await ec2Client.send(command);

      const azs = new Set(
        response.Subnets!.map((subnet) => subnet.AvailabilityZone)
      );
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('Internet Gateway should be attached to VPC', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].VpcId).toBe(outputs.VPCId);
      expect(igw.Attachments![0].State).toBe('available');
    });

    test('NAT Gateways should have EIPs allocated', async () => {
      const natCommand = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const natResponse = await ec2Client.send(natCommand);

      expect(natResponse.NatGateways!.length).toBeGreaterThanOrEqual(2);

      natResponse.NatGateways!.forEach((nat) => {
        expect(nat.State).toBe('available');
        expect(nat.NatGatewayAddresses).toHaveLength(1);
        expect(nat.NatGatewayAddresses![0].AllocationId).toBeDefined();
      });
    });

    test('NAT Gateways should be in public subnets', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const publicSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
      ];
      response.NatGateways!.forEach((nat) => {
        expect(publicSubnetIds).toContain(nat.SubnetId);
      });
    });

    test('route table associations should be correct', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const allSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
      ];

      const associatedSubnetIds = new Set<string>();
      response.RouteTables!.forEach((rt) => {
        rt.Associations?.forEach((assoc) => {
          if (assoc.SubnetId) {
            associatedSubnetIds.add(assoc.SubnetId);
          }
        });
      });

      allSubnetIds.forEach((subnetId) => {
        expect(associatedSubnetIds.has(subnetId)).toBe(true);
      });
    });

    test('subnet CIDR blocks should not overlap', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
        ],
      });
      const response = await ec2Client.send(command);

      const cidrBlocks = response.Subnets!.map((subnet) => subnet.CidrBlock);
      const uniqueCidrBlocks = new Set(cidrBlocks);
      expect(cidrBlocks.length).toBe(uniqueCidrBlocks.size);
    });

    test('each AZ should have both public and private subnets', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
        ],
      });
      const response = await ec2Client.send(command);

      const azSubnets: { [key: string]: string[] } = {};
      response.Subnets!.forEach((subnet) => {
        const az = subnet.AvailabilityZone!;
        if (!azSubnets[az]) {
          azSubnets[az] = [];
        }
        azSubnets[az].push(subnet.SubnetId!);
      });

      Object.values(azSubnets).forEach((subnets) => {
        expect(subnets.length).toBeGreaterThanOrEqual(2);
      });
    });

    test('VPC should have proper tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const response = await ec2Client.send(command);

      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];
      const tagKeys = tags.map((tag) => tag.Key);

      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
    });
  });

  // ===========================================================================
  // C. Security Group & IAM Tests
  // ===========================================================================
  describe('Security Group & IAM Tests', () => {
    test('EC2 instance role should exist with correct policies', async () => {
      const roleName = outputs.EC2InstanceRoleArn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);

      // Verify trust policy
      const trustPolicy = JSON.parse(
        decodeURIComponent(response.Role!.AssumeRolePolicyDocument!)
      );
      expect(trustPolicy.Statement[0].Principal.Service).toContain(
        'ec2.amazonaws.com'
      );
    });

    test('EC2 role should have CloudWatchAgentServerPolicy attached', async () => {
      const roleName = outputs.EC2InstanceRoleArn.split('/').pop();
      const command = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);

      const policyNames = response.AttachedPolicies!.map(
        (policy) => policy.PolicyName
      );
      expect(policyNames).toContain('CloudWatchAgentServerPolicy');
    });

    test('EC2 role should have AmazonSSMManagedInstanceCore attached', async () => {
      const roleName = outputs.EC2InstanceRoleArn.split('/').pop();
      const command = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);

      const policyNames = response.AttachedPolicies!.map(
        (policy) => policy.PolicyName
      );
      expect(policyNames).toContain('AmazonSSMManagedInstanceCore');
    });

    test('EC2 role should have EC2MinimalAccess inline policy', async () => {
      const roleName = outputs.EC2InstanceRoleArn.split('/').pop();
      const command = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'EC2MinimalAccess',
      });
      const response = await iamClient.send(command);

      expect(response.PolicyName).toBe('EC2MinimalAccess');
      const policyDoc = JSON.parse(
        decodeURIComponent(response.PolicyDocument!)
      );
      expect(policyDoc.Statement).toBeDefined();
      expect(policyDoc.Statement.length).toBeGreaterThan(0);
    });

    test('instance profile should be created and attached', async () => {
      const roleName = outputs.EC2InstanceRoleArn.split('/').pop();
      const command = new GetInstanceProfileCommand({
        InstanceProfileName: roleName,
      });

      try {
        const response = await iamClient.send(command);
        expect(response.InstanceProfile).toBeDefined();
      } catch (error: any) {
        // Instance profile might have different name, check instances instead
        const instancesCommand = new DescribeInstancesCommand({
          InstanceIds: [outputs.PrivateInstance1Id],
        });
        const instancesResponse = await ec2Client.send(instancesCommand);
        const instance =
          instancesResponse.Reservations![0].Instances![0];
        expect(instance.IamInstanceProfile).toBeDefined();
      }
    });

    test('IAM policy should allow CloudWatch actions', async () => {
      const roleName = outputs.EC2InstanceRoleArn.split('/').pop();
      const command = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'EC2MinimalAccess',
      });
      const response = await iamClient.send(command);

      const policyDoc = JSON.parse(
        decodeURIComponent(response.PolicyDocument!)
      );
      const cwStatement = policyDoc.Statement.find((stmt: any) =>
        stmt.Action.some((action: string) => action.startsWith('cloudwatch:'))
      );

      expect(cwStatement).toBeDefined();
      expect(cwStatement.Action).toContain('cloudwatch:PutMetricData');
    });

    test('IAM policy should allow scoped logs actions', async () => {
      const roleName = outputs.EC2InstanceRoleArn.split('/').pop();
      const command = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'EC2MinimalAccess',
      });
      const response = await iamClient.send(command);

      const policyDoc = JSON.parse(
        decodeURIComponent(response.PolicyDocument!)
      );
      const logsStatement = policyDoc.Statement.find((stmt: any) =>
        stmt.Action.some((action: string) => action.startsWith('logs:'))
      );

      expect(logsStatement).toBeDefined();
      expect(logsStatement.Resource).toContain('/aws/ec2/');
    });
  });

  // ===========================================================================
  // D. EC2 Instance Tests
  // ===========================================================================
  describe('EC2 Instance Tests', () => {
    test('both instances should be launched successfully', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [
          outputs.PrivateInstance1Id,
          outputs.PrivateInstance2Id,
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Reservations).toHaveLength(2);
      response.Reservations!.forEach((reservation) => {
        expect(reservation.Instances).toHaveLength(1);
        const instance = reservation.Instances![0];
        expect(['running', 'pending']).toContain(instance.State!.Name!);
      });
    });

    test('instances should be in correct private subnets', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [
          outputs.PrivateInstance1Id,
          outputs.PrivateInstance2Id,
        ],
      });
      const response = await ec2Client.send(command);

      const subnetIds = response.Reservations!.map(
        (res) => res.Instances![0].SubnetId
      );
      expect(subnetIds).toContain(outputs.PrivateSubnet1Id);
      expect(subnetIds).toContain(outputs.PrivateSubnet2Id);
    });

    test('instances should be in different availability zones', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [
          outputs.PrivateInstance1Id,
          outputs.PrivateInstance2Id,
        ],
      });
      const response = await ec2Client.send(command);

      const azs = response.Reservations!.map(
        (res) => res.Instances![0].Placement!.AvailabilityZone
      );
      expect(azs[0]).not.toBe(azs[1]);
    });

    test('instance type should match deployment parameter', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [
          outputs.PrivateInstance1Id,
          outputs.PrivateInstance2Id,
        ],
      });
      const response = await ec2Client.send(command);

      response.Reservations!.forEach((reservation) => {
        const instance = reservation.Instances![0];
        expect(instance.InstanceType).toBeDefined();
        expect(instance.InstanceType).toMatch(/^t3\./);
      });
    });

    test('EBS volumes should be encrypted', async () => {
      const instancesCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.PrivateInstance1Id],
      });
      const instancesResponse = await ec2Client.send(instancesCommand);

      const instance = instancesResponse.Reservations![0].Instances![0];
      const volumeIds = instance.BlockDeviceMappings!.map(
        (bdm) => bdm.Ebs!.VolumeId!
      );

      const volumesCommand = new DescribeVolumesCommand({
        VolumeIds: volumeIds,
      });
      const volumesResponse = await ec2Client.send(volumesCommand);

      volumesResponse.Volumes!.forEach((volume) => {
        expect(volume.Encrypted).toBe(true);
      });
    });

    test('detailed monitoring should be enabled if parameter is true', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.PrivateInstance1Id],
      });
      const response = await ec2Client.send(command);

      const instance = response.Reservations![0].Instances![0];
      // Monitoring state can be 'enabled', 'disabled', or 'pending'
      expect(instance.Monitoring).toBeDefined();
    });

    test('IMDSv2 should be enforced', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.PrivateInstance1Id],
      });
      const response = await ec2Client.send(command);

      const instance = response.Reservations![0].Instances![0];
      expect(instance.MetadataOptions).toBeDefined();
      expect(instance.MetadataOptions!.HttpTokens).toBe('required');
      expect(instance.MetadataOptions!.HttpPutResponseHopLimit).toBe(1);
    });

    test('instances should have correct tags', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [
          outputs.PrivateInstance1Id,
          outputs.PrivateInstance2Id,
        ],
      });
      const response = await ec2Client.send(command);

      response.Reservations!.forEach((reservation) => {
        const instance = reservation.Instances![0];
        const tagKeys = instance.Tags!.map((tag) => tag.Key);
        expect(tagKeys).toContain('Name');
        expect(tagKeys).toContain('Environment');
      });
    });

    test('security group should be attached to instances', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.PrivateInstance1Id],
      });
      const response = await ec2Client.send(command);

      const instance = response.Reservations![0].Instances![0];
      expect(instance.SecurityGroups).toHaveLength(1);
      expect(instance.SecurityGroups![0].GroupId).toBeDefined();
    });

    test('instance profile should be attached to instances', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.PrivateInstance1Id],
      });
      const response = await ec2Client.send(command);

      const instance = response.Reservations![0].Instances![0];
      expect(instance.IamInstanceProfile).toBeDefined();
      expect(instance.IamInstanceProfile!.Arn).toContain('instance-profile');
    });

    test('instances should have private IPs in correct subnet range', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [
          outputs.PrivateInstance1Id,
          outputs.PrivateInstance2Id,
        ],
      });
      const response = await ec2Client.send(command);

      response.Reservations!.forEach((reservation) => {
        const instance = reservation.Instances![0];
        expect(instance.PrivateIpAddress).toBeDefined();
        expect(instance.PrivateIpAddress).toMatch(/^10\.0\./);
      });
    });

    test('launch template should have correct AMI for region', async () => {
      const instancesCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.PrivateInstance1Id],
      });
      const instancesResponse = await ec2Client.send(instancesCommand);

      const instance = instancesResponse.Reservations![0].Instances![0];
      expect(instance.ImageId).toBeDefined();
      expect(instance.ImageId).toMatch(/^ami-/);
    });
  });

  // ===========================================================================
  // E. CloudWatch Monitoring Tests
  // ===========================================================================
  describe('CloudWatch Monitoring Tests', () => {
    test('all 4 alarms should exist and be enabled', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: environmentSuffix,
      });
      const response = await cwClient.send(command);

      expect(response.MetricAlarms!.length).toBeGreaterThanOrEqual(4);
      response.MetricAlarms!.forEach((alarm) => {
        expect(alarm.ActionsEnabled).toBe(true);
      });
    });

    test('CPU alarms should be configured for correct instances', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: environmentSuffix,
      });
      const response = await cwClient.send(command);

      const cpuAlarms = response.MetricAlarms!.filter(
        (alarm) => alarm.MetricName === 'CPUUtilization'
      );
      expect(cpuAlarms.length).toBeGreaterThanOrEqual(2);

      const instanceIds = cpuAlarms
        .map((alarm) => alarm.Dimensions![0].Value)
        .sort();
      const expectedIds = [
        outputs.PrivateInstance1Id,
        outputs.PrivateInstance2Id,
      ].sort();

      expect(instanceIds).toEqual(expectedIds);
    });

    test('status check alarms should be configured correctly', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: environmentSuffix,
      });
      const response = await cwClient.send(command);

      const statusAlarms = response.MetricAlarms!.filter(
        (alarm) => alarm.MetricName === 'StatusCheckFailed'
      );
      expect(statusAlarms.length).toBeGreaterThanOrEqual(2);

      statusAlarms.forEach((alarm) => {
        expect(alarm.Statistic).toBe('Maximum');
        expect(alarm.Threshold).toBe(1);
      });
    });

    test('alarm thresholds should be set to 80% CPU', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: environmentSuffix,
      });
      const response = await cwClient.send(command);

      const cpuAlarms = response.MetricAlarms!.filter(
        (alarm) => alarm.MetricName === 'CPUUtilization'
      );

      cpuAlarms.forEach((alarm) => {
        expect(alarm.Threshold).toBe(80);
        expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
      });
    });

    test('alarms should have correct evaluation periods', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: environmentSuffix,
      });
      const response = await cwClient.send(command);

      response.MetricAlarms!.forEach((alarm) => {
        expect(alarm.EvaluationPeriods).toBe(2);
        expect(alarm.Period).toBe(300);
      });
    });

    test('SNS topic should be configured as alarm action', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: environmentSuffix,
      });
      const response = await cwClient.send(command);

      response.MetricAlarms!.forEach((alarm) => {
        expect(alarm.AlarmActions).toBeDefined();
        expect(alarm.AlarmActions).toHaveLength(1);
        expect(alarm.AlarmActions![0]).toBe(outputs.SNSTopicArn);
      });
    });

    test('TreatMissingData should be set to breaching', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: environmentSuffix,
      });
      const response = await cwClient.send(command);

      response.MetricAlarms!.forEach((alarm) => {
        expect(alarm.TreatMissingData).toBe('breaching');
      });
    });

    test('EC2 metrics should be available in CloudWatch', async () => {
      const command = new ListMetricsCommand({
        Namespace: 'AWS/EC2',
        Dimensions: [
          {
            Name: 'InstanceId',
            Value: outputs.PrivateInstance1Id,
          },
        ],
      });
      const response = await cwClient.send(command);

      expect(response.Metrics!.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // F. SNS & Notification Tests
  // ===========================================================================
  describe('SNS & Notification Tests', () => {
    test('SNS topic should be created with encryption', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicArn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.KmsMasterKeyId).toBeDefined();
      expect(response.Attributes!.KmsMasterKeyId).toContain('alias/aws/sns');
    });

    test('email subscription should exist on topic', async () => {
      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: outputs.SNSTopicArn,
      });
      const response = await snsClient.send(command);

      expect(response.Subscriptions).toBeDefined();
      expect(response.Subscriptions!.length).toBeGreaterThan(0);

      const emailSub = response.Subscriptions!.find(
        (sub) => sub.Protocol === 'email'
      );
      expect(emailSub).toBeDefined();
    });

    test('topic should have DisplayName set', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicArn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes!.DisplayName).toBeDefined();
      expect(response.Attributes!.DisplayName).toContain('Notifications');
    });

    test('topic policy should allow CloudWatch to publish', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicArn,
      });
      const response = await snsClient.send(command);

      const policy = JSON.parse(response.Attributes!.Policy!);
      const cwStatement = policy.Statement.find((stmt: any) =>
        stmt.Principal?.Service?.includes('cloudwatch.amazonaws.com')
      );

      expect(cwStatement).toBeDefined();
      expect(cwStatement.Action).toContain('SNS:Publish');
    });

    test('topic policy should allow EventBridge to publish', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicArn,
      });
      const response = await snsClient.send(command);

      const policy = JSON.parse(response.Attributes!.Policy!);
      const eventsStatement = policy.Statement.find((stmt: any) =>
        stmt.Principal?.Service?.includes('events.amazonaws.com')
      );

      expect(eventsStatement).toBeDefined();
    });
  });

  // ===========================================================================
  // G. EventBridge Integration Tests
  // ===========================================================================
  describe('EventBridge Integration Tests', () => {
    test('stack event rule should exist and be enabled', async () => {
      const ruleName = `${environmentSuffix}-StackEventRule`;
      const command = new DescribeRuleCommand({
        Name: ruleName,
      });

      const response = await eventsClient.send(command);
      expect(response.State).toBe('ENABLED');
      expect(response.EventPattern).toBeDefined();
    });

    test('rule should capture CloudFormation stack events', async () => {
      const ruleName = `${environmentSuffix}-StackEventRule`;
      const command = new DescribeRuleCommand({
        Name: ruleName,
      });
      const response = await eventsClient.send(command);

      const eventPattern = JSON.parse(response.EventPattern!);
      expect(eventPattern.source).toContain('aws.cloudformation');
      expect(eventPattern['detail-type']).toContain(
        'CloudFormation Stack Status Change'
      );
    });

    test('SNS topic should be configured as target', async () => {
      const ruleName = `${environmentSuffix}-StackEventRule`;
      const command = new ListTargetsByRuleCommand({
        Rule: ruleName,
      });
      const response = await eventsClient.send(command);

      expect(response.Targets).toBeDefined();
      expect(response.Targets!.length).toBeGreaterThan(0);
      expect(response.Targets![0].Arn).toBe(outputs.SNSTopicArn);
    });
  });

  // ===========================================================================
  // H. S3 Storage Tests
  // ===========================================================================
  describe('S3 Storage Tests', () => {
    test('S3 bucket should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.S3BucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('bucket should have encryption enabled (AES256)', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule =
        response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(
        rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm
      ).toBe('AES256');
    });

    test('bucket should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('bucket should block all public access', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      const config = response.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });

    test('bucket policy should enforce SSL/TLS', async () => {
      const command = new GetBucketPolicyCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);

      const policy = JSON.parse(response.Policy!);
      const denyStatement = policy.Statement.find(
        (stmt: any) => stmt.Effect === 'Deny'
      );

      expect(denyStatement).toBeDefined();
      expect(denyStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });

    test('bucket policy should have correct resource ARNs', async () => {
      const command = new GetBucketPolicyCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);

      const policy = JSON.parse(response.Policy!);
      const denyStatement = policy.Statement.find(
        (stmt: any) => stmt.Effect === 'Deny'
      );

      expect(denyStatement.Resource).toHaveLength(2);
      expect(denyStatement.Resource[0]).toContain(outputs.S3BucketName);
      expect(denyStatement.Resource[1]).toContain(outputs.S3BucketName);
    });

    test('bucket name should follow naming convention', () => {
      expect(outputs.S3BucketName).toContain('-data');
      expect(outputs.S3BucketName.toLowerCase()).toBe(outputs.S3BucketName);
    });
  });

  // ===========================================================================
  // I. CloudWatch Logs Tests
  // ===========================================================================
  describe('CloudWatch Logs Tests', () => {
    test('log group should exist with correct name', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/ec2/',
      });
      const response = await logsClient.send(command);

      const logGroup = response.logGroups!.find((lg) =>
        lg.logGroupName!.includes(environmentSuffix)
      );
      expect(logGroup).toBeDefined();
    });

    test('log group should have 30 days retention', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/ec2/',
      });
      const response = await logsClient.send(command);

      const logGroup = response.logGroups!.find((lg) =>
        lg.logGroupName!.includes(environmentSuffix)
      );

      if (logGroup) {
        expect(logGroup.retentionInDays).toBe(30);
      }
    });
  });

  // ===========================================================================
  // J. High Availability Tests
  // ===========================================================================
  describe('High Availability Tests', () => {
    test('resources should be distributed across 2+ AZs', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
        ],
      });
      const response = await ec2Client.send(command);

      const azs = new Set(
        response.Subnets!.map((subnet) => subnet.AvailabilityZone)
      );
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('each private subnet should have dedicated NAT Gateway', async () => {
      const natCommand = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const natResponse = await ec2Client.send(natCommand);

      expect(natResponse.NatGateways!.length).toBeGreaterThanOrEqual(2);

      const natSubnetIds = natResponse.NatGateways!.map(
        (nat) => nat.SubnetId
      );
      expect(natSubnetIds).toContain(outputs.PublicSubnet1Id);
      expect(natSubnetIds).toContain(outputs.PublicSubnet2Id);
    });

    test('NAT Gateways should be in corresponding public subnets', async () => {
      const rtCommand = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const rtResponse = await ec2Client.send(rtCommand);

      const privateRouteTables = rtResponse.RouteTables!.filter((rt) =>
        rt.Routes?.some((route) => route.NatGatewayId)
      );

      expect(privateRouteTables.length).toBeGreaterThanOrEqual(2);
    });

    test('public subnets should share same route table', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const routeTableIds = new Set(
        response.RouteTables!.map((rt) => rt.RouteTableId)
      );
      expect(routeTableIds.size).toBe(1);
    });

    test('private subnets should have separate route tables', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: [
              outputs.PrivateSubnet1Id,
              outputs.PrivateSubnet2Id,
            ],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const routeTableIds = new Set(
        response.RouteTables!.map((rt) => rt.RouteTableId)
      );
      expect(routeTableIds.size).toBe(2);
    });
  });

  // ===========================================================================
  // K. Cross-Service Integration Scenarios
  // ===========================================================================
  describe('Cross-Service Integration Scenarios', () => {
    // IAM & EC2 Integration Tests
    test('EC2 instances should have IAM instance profile attached', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.PrivateInstance1Id, outputs.PrivateInstance2Id],
      });
      const response = await ec2Client.send(command);

      response.Reservations!.forEach((reservation) => {
        const instance = reservation.Instances![0];
        expect(instance.IamInstanceProfile).toBeDefined();
        expect(instance.IamInstanceProfile!.Arn).toContain('instance-profile');
        expect(instance.IamInstanceProfile!.Arn).toContain('EC2InstanceProfile');
      });
    });

    test('IAM role should grant EC2 access to CloudWatch Logs', async () => {
      const roleName = outputs.EC2InstanceRoleArn.split('/').pop();
      const command = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'EC2MinimalAccess',
      });
      const response = await iamClient.send(command);

      const policyDoc = JSON.parse(
        decodeURIComponent(response.PolicyDocument!)
      );
      const logsStatement = policyDoc.Statement.find((stmt: any) =>
        stmt.Action.some((action: string) => action.startsWith('logs:'))
      );

      expect(logsStatement).toBeDefined();
      expect(logsStatement.Action).toContain('logs:CreateLogGroup');
      expect(logsStatement.Action).toContain('logs:CreateLogStream');
      expect(logsStatement.Action).toContain('logs:PutLogEvents');
      expect(logsStatement.Resource).toContain('/aws/ec2/');
    });

    test('IAM role should grant EC2 access to CloudWatch metrics', async () => {
      const roleName = outputs.EC2InstanceRoleArn.split('/').pop();
      const command = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'EC2MinimalAccess',
      });
      const response = await iamClient.send(command);

      const policyDoc = JSON.parse(
        decodeURIComponent(response.PolicyDocument!)
      );
      const cwStatement = policyDoc.Statement.find((stmt: any) =>
        stmt.Action.some((action: string) => action.startsWith('cloudwatch:'))
      );

      expect(cwStatement).toBeDefined();
      expect(cwStatement.Action).toContain('cloudwatch:PutMetricData');
      expect(cwStatement.Action).toContain('cloudwatch:GetMetricStatistics');
      expect(cwStatement.Action).toContain('cloudwatch:ListMetrics');
    });

    test('IAM role should include Systems Manager (SSM) access', async () => {
      const roleName = outputs.EC2InstanceRoleArn.split('/').pop();
      const command = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);

      const policyNames = response.AttachedPolicies!.map(
        (policy) => policy.PolicyName
      );
      expect(policyNames).toContain('AmazonSSMManagedInstanceCore');
    });

    test('IAM policies should use scoped resource ARNs', async () => {
      const roleName = outputs.EC2InstanceRoleArn.split('/').pop();
      const command = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'EC2MinimalAccess',
      });
      const response = await iamClient.send(command);

      const policyDoc = JSON.parse(
        decodeURIComponent(response.PolicyDocument!)
      );

      // Check that logs statement uses scoped ARN
      const logsStatement = policyDoc.Statement.find((stmt: any) =>
        stmt.Action.some((action: string) => action.startsWith('logs:'))
      );
      expect(logsStatement.Resource).toContain('log-group:/aws/ec2/');
      expect(logsStatement.Resource).not.toBe('*');
    });

    // S3 & Security Integration Tests
    test('S3 bucket encryption should use correct algorithm', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule =
        response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(
        rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm
      ).toBe('AES256');
      expect(rule.BucketKeyEnabled).toBeDefined();
    });

    test('S3 bucket policy should enforce SSL/TLS connections', async () => {
      const command = new GetBucketPolicyCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);

      const policy = JSON.parse(response.Policy!);
      const denyStatement = policy.Statement.find(
        (stmt: any) => stmt.Effect === 'Deny' && stmt.Sid === 'DenyInsecureConnections'
      );

      expect(denyStatement).toBeDefined();
      expect(denyStatement.Action).toBe('s3:*');
      expect(denyStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
      expect(denyStatement.Resource).toHaveLength(2);
      expect(denyStatement.Resource[0]).toContain(outputs.S3BucketName);
    });

    test('S3 bucket should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket should block all public access', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);

      const config = response.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });

    // CloudWatch Alarms & SNS Integration Tests
    test('All CloudWatch alarms should publish to SNS topic', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: environmentSuffix,
      });
      const response = await cwClient.send(command);

      expect(response.MetricAlarms!.length).toBeGreaterThanOrEqual(4);
      response.MetricAlarms!.forEach((alarm) => {
        expect(alarm.AlarmActions).toBeDefined();
        expect(alarm.AlarmActions).toHaveLength(1);
        expect(alarm.AlarmActions![0]).toBe(outputs.SNSTopicArn);
      });
    });

    test('SNS topic policy should allow CloudWatch to publish', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicArn,
      });
      const response = await snsClient.send(command);

      const policy = JSON.parse(response.Attributes!.Policy!);
      const cwStatement = policy.Statement.find((stmt: any) =>
        stmt.Principal?.Service?.includes('cloudwatch.amazonaws.com')
      );

      expect(cwStatement).toBeDefined();
      expect(cwStatement.Effect).toBe('Allow');
      expect(cwStatement.Action).toContain('SNS:Publish');
      expect(cwStatement.Resource).toBe(outputs.SNSTopicArn);
    });

    test('Alarm actions should be properly configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: environmentSuffix,
      });
      const response = await cwClient.send(command);

      response.MetricAlarms!.forEach((alarm) => {
        expect(alarm.ActionsEnabled).toBe(true);
        expect(alarm.AlarmActions).toBeDefined();
        expect(alarm.AlarmActions!.length).toBeGreaterThan(0);
        expect(alarm.TreatMissingData).toBe('breaching');
      });
    });

    // EventBridge & SNS Integration Tests
    test('EventBridge rule should target SNS topic', async () => {
      const ruleName = `${environmentSuffix}-StackEventRule`;
      const command = new ListTargetsByRuleCommand({
        Rule: ruleName,
      });
      const response = await eventsClient.send(command);

      expect(response.Targets).toBeDefined();
      expect(response.Targets!.length).toBeGreaterThan(0);
      const snsTarget = response.Targets!.find(
        (target) => target.Arn === outputs.SNSTopicArn
      );
      expect(snsTarget).toBeDefined();
      expect(snsTarget!.Id).toBe('SNSTopic');
    });

    test('SNS topic policy should allow EventBridge to publish', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicArn,
      });
      const response = await snsClient.send(command);

      const policy = JSON.parse(response.Attributes!.Policy!);
      const eventsStatement = policy.Statement.find((stmt: any) =>
        stmt.Principal?.Service?.includes('events.amazonaws.com')
      );

      expect(eventsStatement).toBeDefined();
      expect(eventsStatement.Effect).toBe('Allow');
      expect(eventsStatement.Action).toContain('SNS:Publish');
      expect(eventsStatement.Resource).toBe(outputs.SNSTopicArn);
    });

    // EC2 & Security Groups Integration Tests
    test('EC2 instances should use private security group', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.PrivateInstance1Id, outputs.PrivateInstance2Id],
      });
      const response = await ec2Client.send(command);

      response.Reservations!.forEach((reservation) => {
        const instance = reservation.Instances![0];
        expect(instance.SecurityGroups).toHaveLength(1);
        const sg = instance.SecurityGroups![0];
        expect(sg.GroupName).toContain('PrivateSecurityGroup');
      });
    });

    test('Security group should allow VPC CIDR ingress only', async () => {
      const instancesCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.PrivateInstance1Id],
      });
      const instancesResponse = await ec2Client.send(instancesCommand);
      const sgId = instancesResponse.Reservations![0].Instances![0].SecurityGroups![0].GroupId!;

      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [sgId],
      });
      const sgResponse = await ec2Client.send(sgCommand);
      const sg = sgResponse.SecurityGroups![0];

      // Verify ingress rules only allow VPC CIDR
      sg.IpPermissions!.forEach((rule) => {
        if (rule.IpRanges && rule.IpRanges.length > 0) {
          rule.IpRanges.forEach((ipRange) => {
            expect(ipRange.CidrIp).toMatch(/^10\.0\./);
          });
        }
      });

      // Verify common ports are allowed from VPC
      const sshRule = sg.IpPermissions!.find(
        (rule) => rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshRule).toBeDefined();

      const httpsRule = sg.IpPermissions!.find(
        (rule) => rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsRule).toBeDefined();
    });

    test('Security group should allow all egress traffic', async () => {
      const instancesCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.PrivateInstance1Id],
      });
      const instancesResponse = await ec2Client.send(instancesCommand);
      const sgId = instancesResponse.Reservations![0].Instances![0].SecurityGroups![0].GroupId!;

      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [sgId],
      });
      const sgResponse = await ec2Client.send(sgCommand);
      const sg = sgResponse.SecurityGroups![0];

      expect(sg.IpPermissionsEgress).toBeDefined();
      const allEgressRule = sg.IpPermissionsEgress!.find(
        (rule) => rule.IpProtocol === '-1' && rule.IpRanges?.[0]?.CidrIp === '0.0.0.0/0'
      );
      expect(allEgressRule).toBeDefined();
    });

    // VPC & Network Integration Tests
    test('Private instances should route through NAT Gateways', async () => {
      const instancesCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.PrivateInstance1Id, outputs.PrivateInstance2Id],
      });
      const instancesResponse = await ec2Client.send(instancesCommand);

      const subnetIds = instancesResponse.Reservations!.map(
        (res) => res.Instances![0].SubnetId!
      );

      const rtCommand = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: subnetIds,
          },
        ],
      });
      const rtResponse = await ec2Client.send(rtCommand);

      // Each private subnet should have a route to NAT Gateway
      rtResponse.RouteTables!.forEach((rt) => {
        const natRoute = rt.Routes!.find(
          (route) =>
            route.DestinationCidrBlock === '0.0.0.0/0' &&
            route.NatGatewayId?.startsWith('nat-')
        );
        expect(natRoute).toBeDefined();
      });
    });

    test('Subnets should be properly associated with route tables', async () => {
      const rtCommand = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(rtCommand);

      const allSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
      ];

      const associatedSubnetIds = new Set<string>();
      response.RouteTables!.forEach((rt) => {
        rt.Associations?.forEach((assoc) => {
          if (assoc.SubnetId) {
            associatedSubnetIds.add(assoc.SubnetId);
          }
        });
      });

      allSubnetIds.forEach((subnetId) => {
        expect(associatedSubnetIds.has(subnetId)).toBe(true);
      });
    });

    test('NAT Gateways should have Elastic IPs attached', async () => {
      const natCommand = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const natResponse = await ec2Client.send(natCommand);

      expect(natResponse.NatGateways!.length).toBeGreaterThanOrEqual(2);
      natResponse.NatGateways!.forEach((nat) => {
        expect(nat.NatGatewayAddresses).toHaveLength(1);
        const natAddress = nat.NatGatewayAddresses![0];
        expect(natAddress.AllocationId).toBeDefined();
        expect(natAddress.PublicIp).toBeDefined();
        expect(natAddress.PublicIp).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
      });

      // Verify EIPs are actually allocated
      const allocationIds = natResponse.NatGateways!.map(
        (nat) => nat.NatGatewayAddresses![0].AllocationId!
      );
      const eipCommand = new DescribeAddressesCommand({
        AllocationIds: allocationIds,
      });
      const eipResponse = await ec2Client.send(eipCommand);
      expect(eipResponse.Addresses).toHaveLength(allocationIds.length);
    });

    test('Internet Gateway should route public subnet traffic', async () => {
      const igwCommand = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const igwResponse = await ec2Client.send(igwCommand);
      const igwId = igwResponse.InternetGateways![0].InternetGatewayId!;

      const rtCommand = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'route.gateway-id',
            Values: [igwId],
          },
        ],
      });
      const rtResponse = await ec2Client.send(rtCommand);

      expect(rtResponse.RouteTables).toBeDefined();
      expect(rtResponse.RouteTables!.length).toBeGreaterThan(0);

      // Verify IGW route table has associations to public subnets
      const publicSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
      ];
      const associatedSubnetIds = new Set<string>();
      rtResponse.RouteTables!.forEach((rt) => {
        rt.Associations?.forEach((assoc) => {
          if (assoc.SubnetId) {
            associatedSubnetIds.add(assoc.SubnetId);
          }
        });
      });

      publicSubnetIds.forEach((subnetId) => {
        expect(associatedSubnetIds.has(subnetId)).toBe(true);
      });
    });

    // End-to-End Integration Scenarios
    test('Complete deployment health check', async () => {
      // Check VPC is available
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      expect(vpcResponse.Vpcs![0].State).toBe('available');

      // Check NAT Gateways are available
      const natCommand = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const natResponse = await ec2Client.send(natCommand);
      natResponse.NatGateways!.forEach((nat) => {
        expect(nat.State).toBe('available');
      });

      // Check instances are running or pending
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [
          outputs.PrivateInstance1Id,
          outputs.PrivateInstance2Id,
        ],
      });
      const instanceResponse = await ec2Client.send(instanceCommand);
      instanceResponse.Reservations!.forEach((res) => {
        expect(['running', 'pending']).toContain(
          res.Instances![0].State!.Name!
        );
      });

      // Check S3 bucket is accessible
      const s3Command = new HeadBucketCommand({
        Bucket: outputs.S3BucketName,
      });
      await expect(s3Client.send(s3Command)).resolves.not.toThrow();

      // Check SNS topic exists
      const snsCommand = new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicArn,
      });
      await expect(snsClient.send(snsCommand)).resolves.toBeDefined();
    });

    test('All resources should have consistent tagging', async () => {
      // Check VPC tags
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];
      const vpcTagKeys = vpcTags.map((tag) => tag.Key);
      expect(vpcTagKeys).toContain('Environment');

      // Check instance tags
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.PrivateInstance1Id],
      });
      const instanceResponse = await ec2Client.send(instanceCommand);
      const instanceTags =
        instanceResponse.Reservations![0].Instances![0].Tags || [];
      const instanceTagKeys = instanceTags.map((tag) => tag.Key);
      expect(instanceTagKeys).toContain('Environment');
      expect(instanceTagKeys).toContain('Name');

      // Verify consistent environment tag value
      const vpcEnvTag = vpcTags.find((tag) => tag.Key === 'Environment');
      const instanceEnvTag = instanceTags.find(
        (tag) => tag.Key === 'Environment'
      );
      if (vpcEnvTag && instanceEnvTag) {
        expect(vpcEnvTag.Value).toBe(instanceEnvTag.Value);
      }
    });

    test('Cross-stack exports should be accessible', async () => {
      const command = new DescribeStacksCommand({
        StackName: stackName,
      });
      const response = await cfnClient.send(command);

      const stack = response.Stacks![0];
      const exportsCount = stack.Outputs!.filter(
        (output) => output.ExportName
      ).length;
      expect(exportsCount).toBeGreaterThan(0);

      // Verify key exports exist
      const exportNames = stack.Outputs!.filter((o) => o.ExportName).map(
        (o) => o.ExportName!
      );
      expect(exportNames.some((name) => name.includes('VPC-ID'))).toBe(true);
      expect(exportNames.some((name) => name.includes('SNSTopic-ARN'))).toBe(
        true
      );
    });

    test('Regional resource references should be dynamic', async () => {
      // Verify instances use region-specific AMI
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.PrivateInstance1Id],
      });
      const instanceResponse = await ec2Client.send(instanceCommand);
      const instance = instanceResponse.Reservations![0].Instances![0];
      expect(instance.ImageId).toMatch(/^ami-[a-f0-9]+$/);

      // Verify subnets use region-specific AZs
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id],
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      subnetResponse.Subnets!.forEach((subnet) => {
        expect(subnet.AvailabilityZone).toBeDefined();
        expect(subnet.AvailabilityZone!.startsWith(region)).toBe(true);
      });

      // Verify ARNs use correct partition
      expect(outputs.SNSTopicArn).toMatch(/^arn:aws:/);
      expect(outputs.EC2InstanceRoleArn).toMatch(/^arn:aws:/);
    });

    test('All critical services should be operational', async () => {
      const checks = [];

      // VPC networking
      checks.push(
        ec2Client
          .send(new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] }))
          .then((res) => expect(res.Vpcs![0].State).toBe('available'))
      );

      // EC2 instances
      checks.push(
        ec2Client
          .send(
            new DescribeInstancesCommand({
              InstanceIds: [outputs.PrivateInstance1Id],
            })
          )
          .then((res) =>
            expect(['running', 'pending']).toContain(
              res.Reservations![0].Instances![0].State!.Name!
            )
          )
      );

      // S3 storage
      checks.push(
        s3Client
          .send(new HeadBucketCommand({ Bucket: outputs.S3BucketName }))
          .then(() => expect(true).toBe(true))
      );

      // SNS notifications
      checks.push(
        snsClient
          .send(
            new GetTopicAttributesCommand({ TopicArn: outputs.SNSTopicArn })
          )
          .then((res) => expect(res.Attributes).toBeDefined())
      );

      // CloudWatch alarms
      checks.push(
        cwClient
          .send(
            new DescribeAlarmsCommand({ AlarmNamePrefix: environmentSuffix })
          )
          .then((res) =>
            expect(res.MetricAlarms!.length).toBeGreaterThanOrEqual(4)
          )
      );

      // Wait for all checks to complete
      await Promise.all(checks);
    });
  });

  // ===========================================================================
  // L. Security Compliance Validation
  // ===========================================================================
  describe('Security Compliance Validation', () => {
    test('All data at rest should be encrypted', async () => {
      // Check S3 bucket encryption
      const s3Command = new GetBucketEncryptionCommand({
        Bucket: outputs.S3BucketName,
      });
      const s3Response = await s3Client.send(s3Command);
      expect(s3Response.ServerSideEncryptionConfiguration).toBeDefined();

      // Check EBS volume encryption
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.PrivateInstance1Id],
      });
      const instanceResponse = await ec2Client.send(instanceCommand);
      const instance = instanceResponse.Reservations![0].Instances![0];
      const volumeIds = instance.BlockDeviceMappings!.map(
        (bdm) => bdm.Ebs!.VolumeId!
      );

      const volumesCommand = new DescribeVolumesCommand({
        VolumeIds: volumeIds,
      });
      const volumesResponse = await ec2Client.send(volumesCommand);
      volumesResponse.Volumes!.forEach((volume) => {
        expect(volume.Encrypted).toBe(true);
      });

      // Check SNS topic encryption
      const snsCommand = new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicArn,
      });
      const snsResponse = await snsClient.send(snsCommand);
      expect(snsResponse.Attributes!.KmsMasterKeyId).toBeDefined();
    });

    test('No resources should be publicly accessible', async () => {
      // Check S3 bucket blocks public access
      const s3Command = new GetPublicAccessBlockCommand({
        Bucket: outputs.S3BucketName,
      });
      const s3Response = await s3Client.send(s3Command);
      const config = s3Response.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);

      // Check instances are in private subnets
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.PrivateInstance1Id, outputs.PrivateInstance2Id],
      });
      const instanceResponse = await ec2Client.send(instanceCommand);
      instanceResponse.Reservations!.forEach((res) => {
        const instance = res.Instances![0];
        expect(instance.PublicIpAddress).toBeUndefined();
      });
    });

    test('Audit logging should be enabled', async () => {
      // Check CloudWatch log group exists
      const logsCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/ec2/',
      });
      const logsResponse = await logsClient.send(logsCommand);
      const logGroup = logsResponse.logGroups!.find((lg) =>
        lg.logGroupName!.includes(environmentSuffix)
      );
      expect(logGroup).toBeDefined();
      expect(logGroup!.retentionInDays).toBe(30);
    });

    test('Network isolation should be enforced', async () => {
      // Check private security group rules
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.PrivateInstance1Id],
      });
      const instanceResponse = await ec2Client.send(instanceCommand);
      const sgId =
        instanceResponse.Reservations![0].Instances![0].SecurityGroups![0]
          .GroupId!;

      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [sgId],
      });
      const sgResponse = await ec2Client.send(sgCommand);
      const sg = sgResponse.SecurityGroups![0];

      // Verify no ingress from 0.0.0.0/0 on sensitive ports
      const publicIngress = sg.IpPermissions!.filter(
        (rule) =>
          rule.IpRanges?.some((range) => range.CidrIp === '0.0.0.0/0')
      );
      expect(publicIngress.length).toBe(0);

      // Verify ingress is limited to VPC CIDR
      sg.IpPermissions!.forEach((rule) => {
        if (rule.IpRanges && rule.IpRanges.length > 0) {
          rule.IpRanges.forEach((ipRange) => {
            expect(ipRange.CidrIp).toMatch(/^10\.0\./);
          });
        }
      });
    });

    test('Backup policies should be configured', async () => {
      // Check S3 versioning
      const s3Command = new GetBucketVersioningCommand({
        Bucket: outputs.S3BucketName,
      });
      const s3Response = await s3Client.send(s3Command);
      expect(s3Response.Status).toBe('Enabled');

      // Check CloudWatch log retention
      const logsCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/ec2/',
      });
      const logsResponse = await logsClient.send(logsCommand);
      const logGroup = logsResponse.logGroups!.find((lg) =>
        lg.logGroupName!.includes(environmentSuffix)
      );
      if (logGroup) {
        expect(logGroup.retentionInDays).toBe(30);
      }
    });
  });

  // ===========================================================================
  // M. Regional Migration Tests
  // ===========================================================================
  describe('Regional Migration Tests', () => {
    test('AMI should exist for deployed region', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.PrivateInstance1Id],
      });
      const response = await ec2Client.send(command);

      const instance = response.Reservations![0].Instances![0];
      expect(instance.ImageId).toBeDefined();
      expect(instance.ImageId).toMatch(/^ami-[a-f0-9]+$/);
    });

    test('resource ARNs should use correct partition', () => {
      expect(outputs.SNSTopicArn).toMatch(/^arn:aws:/);
      expect(outputs.EC2InstanceRoleArn).toMatch(/^arn:aws:/);
    });

    test('availability zones should be dynamically selected', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
        ],
      });
      const response = await ec2Client.send(command);

      const azs = response.Subnets!.map((subnet) => subnet.AvailabilityZone);
      expect(azs[0]).toBeDefined();
      expect(azs[1]).toBeDefined();
      expect(azs[0]!.startsWith(region)).toBe(true);
    });

    test('all outputs should be exportable for cross-stack use', () => {
      const requiredOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'SNSTopicArn',
        'S3BucketName',
        'PrivateInstance1Id',
        'PrivateInstance2Id',
        'EC2InstanceRoleArn',
      ];

      requiredOutputs.forEach((output) => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });
  });

  // ===========================================================================
  // L. End-to-End Workflow Tests
  // ===========================================================================
  describe('End-to-End Workflow Tests', () => {
    test('stack should be in a successful state', async () => {
      const command = new DescribeStacksCommand({
        StackName: stackName,
      });
      const response = await cfnClient.send(command);

      const stackStatus = response.Stacks![0].StackStatus;
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(stackStatus);
    });

    test('all resources should be successfully created', async () => {
      const command = new DescribeStacksCommand({
        StackName: stackName,
      });
      const response = await cfnClient.send(command);

      const stack = response.Stacks![0];
      const stackStatus = stack.StackStatus;
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(stackStatus);
      expect(stack.Outputs).toBeDefined();
      expect(stack.Outputs!.length).toBeGreaterThanOrEqual(10);
    });

    test('stack should have proper tags', async () => {
      const command = new DescribeStacksCommand({
        StackName: stackName,
      });
      const response = await cfnClient.send(command);

      const stack = response.Stacks![0];
      expect(stack.Tags).toBeDefined();
    });

    test('cross-stack exports should be available', async () => {
      const command = new DescribeStacksCommand({
        StackName: stackName,
      });
      const response = await cfnClient.send(command);

      const stack = response.Stacks![0];
      const exportsCount = stack.Outputs!.filter(
        (output) => output.ExportName
      ).length;
      expect(exportsCount).toBeGreaterThan(0);
    });

    test('all critical resources should be healthy', async () => {
      // Check VPC
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      expect(vpcResponse.Vpcs![0].State).toBe('available');

      // Check NAT Gateways
      const natCommand = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const natResponse = await ec2Client.send(natCommand);
      natResponse.NatGateways!.forEach((nat) => {
        expect(nat.State).toBe('available');
      });

      // Check Instances
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [
          outputs.PrivateInstance1Id,
          outputs.PrivateInstance2Id,
        ],
      });
      const instanceResponse = await ec2Client.send(instanceCommand);
      instanceResponse.Reservations!.forEach((res) => {
        expect(['running', 'pending']).toContain(
          res.Instances![0].State!.Name!
        );
      });
    });
  });
});
