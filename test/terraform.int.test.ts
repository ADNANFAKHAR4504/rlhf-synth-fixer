import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetInstanceProfileCommand,
  GetRoleCommand,
  IAMClient,
} from '@aws-sdk/client-iam';
import { KMSClient } from '@aws-sdk/client-kms';
import { GetTopicAttributesCommand, SNSClient } from '@aws-sdk/client-sns';
import fs from 'fs';
import path from 'path';

describe('Terraform Infrastructure Integration Tests', () => {
  let outputs: any;
  let primaryEC2: EC2Client;
  let secondaryEC2: EC2Client;
  let iamClient: IAMClient;
  let primaryKMS: KMSClient;
  let secondaryKMS: KMSClient;
  let primaryCWLogs: CloudWatchLogsClient;
  let secondaryCWLogs: CloudWatchLogsClient;
  let primaryCW: CloudWatchClient;
  let secondaryCW: CloudWatchClient;
  let primarySNS: SNSClient;
  let secondarySNS: SNSClient;

  beforeAll(async () => {
    // Load deployment outputs
    const outputsPath = path.join(
      __dirname,
      '../cfn-outputs/flat-outputs.json'
    );

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Deployment outputs not found at ${outputsPath}. Please run deployment first.`
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

    // Parse stringified arrays in the outputs (common issue with deployment output flattening)
    for (const [key, value] of Object.entries(outputs)) {
      if (typeof value === 'string' && key.includes('subnet_ids')) {
        try {
          // Try to parse as JSON array if it looks like a stringified array
          if (value.startsWith('[') && value.endsWith(']')) {
            outputs[key] = JSON.parse(value as string);
          }
        } catch (error) {
          // If parsing fails, keep the original value and let validation catch it
          console.warn(
            `Warning: Could not parse ${key} as JSON array: ${error}`
          );
        }
      }
    }

    // Validate outputs contain expected values and are properly formatted
    const requiredOutputs = [
      'vpc_primary_id',
      'vpc_secondary_id',
      'public_subnet_ids_primary',
      'private_subnet_ids_primary',
      'public_subnet_ids_secondary',
      'private_subnet_ids_secondary',
    ];

    for (const output of requiredOutputs) {
      if (!outputs[output]) {
        throw new Error(
          `Required output '${output}' is missing in deployment outputs`
        );
      }

      // For subnet ID arrays, ensure they are actually arrays and not strings
      if (output.includes('subnet_ids')) {
        if (!Array.isArray(outputs[output])) {
          throw new Error(
            `Output '${output}' should be an array but got: ${typeof outputs[output]} - ${JSON.stringify(outputs[output])}`
          );
        }
        if (outputs[output].length === 0) {
          throw new Error(
            `Required output '${output}' is empty in deployment outputs`
          );
        }
        // Validate each subnet ID looks like a proper AWS subnet ID (not individual characters)
        for (const subnetId of outputs[output]) {
          if (
            typeof subnetId !== 'string' ||
            subnetId.length < 10 ||
            !subnetId.startsWith('subnet-')
          ) {
            throw new Error(`Invalid subnet ID in '${output}': ${subnetId}`);
          }
        }
      }
    }

    // Initialize AWS clients
    const primaryRegion = outputs.primary_region || 'us-east-2';
    const secondaryRegion = outputs.secondary_region || 'us-west-1';

    primaryEC2 = new EC2Client({ region: primaryRegion });
    secondaryEC2 = new EC2Client({ region: secondaryRegion });
    iamClient = new IAMClient({ region: primaryRegion }); // IAM is global
    primaryKMS = new KMSClient({ region: primaryRegion });
    secondaryKMS = new KMSClient({ region: secondaryRegion });
    primaryCWLogs = new CloudWatchLogsClient({ region: primaryRegion });
    secondaryCWLogs = new CloudWatchLogsClient({ region: secondaryRegion });
    primaryCW = new CloudWatchClient({ region: primaryRegion });
    secondaryCW = new CloudWatchClient({ region: secondaryRegion });
    primarySNS = new SNSClient({ region: primaryRegion });
    secondarySNS = new SNSClient({ region: secondaryRegion });
  });

  describe('VPC Infrastructure Tests', () => {
    test('primary VPC exists and has correct configuration', async () => {
      const response = await primaryEC2.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.vpc_primary_id],
        })
      );

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);

      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      // DNS configuration is validated through VPC attributes in Terraform
    });

    test('secondary VPC exists and has correct configuration', async () => {
      const response = await secondaryEC2.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.vpc_secondary_id],
        })
      );

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);

      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.1.0.0/16');
      expect(vpc.State).toBe('available');
      // DNS configuration is validated through VPC attributes in Terraform
    });

    test('public subnets exist in primary region', async () => {
      const response = await primaryEC2.send(
        new DescribeSubnetsCommand({
          SubnetIds: outputs.public_subnet_ids_primary,
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(2);

      const expectedCidrBlocks = ['10.0.1.0/24', '10.0.2.0/24'];
      const actualCidrBlocks = response.Subnets!.map(
        subnet => subnet.CidrBlock
      );

      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.vpc_primary_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(expectedCidrBlocks).toContain(subnet.CidrBlock);
        expect(subnet.State).toBe('available');
      });

      // Ensure all expected CIDR blocks are present
      expectedCidrBlocks.forEach(expectedCidr => {
        expect(actualCidrBlocks).toContain(expectedCidr);
      });
    });

    test('private subnets exist in primary region', async () => {
      const response = await primaryEC2.send(
        new DescribeSubnetsCommand({
          SubnetIds: outputs.private_subnet_ids_primary,
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(2);

      const expectedCidrBlocks = ['10.0.10.0/24', '10.0.11.0/24'];
      const actualCidrBlocks = response.Subnets!.map(
        subnet => subnet.CidrBlock
      );

      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.vpc_primary_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(expectedCidrBlocks).toContain(subnet.CidrBlock);
        expect(subnet.State).toBe('available');
      });

      // Ensure all expected CIDR blocks are present
      expectedCidrBlocks.forEach(expectedCidr => {
        expect(actualCidrBlocks).toContain(expectedCidr);
      });
    });

    test('public subnets exist in secondary region', async () => {
      const response = await secondaryEC2.send(
        new DescribeSubnetsCommand({
          SubnetIds: outputs.public_subnet_ids_secondary,
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(2);

      const expectedCidrBlocks = ['10.1.1.0/24', '10.1.2.0/24'];
      const actualCidrBlocks = response.Subnets!.map(
        subnet => subnet.CidrBlock
      );

      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.vpc_secondary_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(expectedCidrBlocks).toContain(subnet.CidrBlock);
        expect(subnet.State).toBe('available');
      });

      // Ensure all expected CIDR blocks are present
      expectedCidrBlocks.forEach(expectedCidr => {
        expect(actualCidrBlocks).toContain(expectedCidr);
      });
    });

    test('private subnets exist in secondary region', async () => {
      const response = await secondaryEC2.send(
        new DescribeSubnetsCommand({
          SubnetIds: outputs.private_subnet_ids_secondary,
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(2);

      const expectedCidrBlocks = ['10.1.10.0/24', '10.1.11.0/24'];
      const actualCidrBlocks = response.Subnets!.map(
        subnet => subnet.CidrBlock
      );

      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.vpc_secondary_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(expectedCidrBlocks).toContain(subnet.CidrBlock);
        expect(subnet.State).toBe('available');
      });

      // Ensure all expected CIDR blocks are present
      expectedCidrBlocks.forEach(expectedCidr => {
        expect(actualCidrBlocks).toContain(expectedCidr);
      });
    });
  });

  describe('Network Infrastructure Tests', () => {
    test('internet gateways are attached to VPCs', async () => {
      // Primary region IGW
      const primaryIGWResponse = await primaryEC2.send(
        new DescribeInternetGatewaysCommand({
          Filters: [
            { Name: 'attachment.vpc-id', Values: [outputs.vpc_primary_id] },
          ],
        })
      );

      expect(primaryIGWResponse.InternetGateways).toBeDefined();
      expect(primaryIGWResponse.InternetGateways!.length).toBe(1);
      expect(
        primaryIGWResponse.InternetGateways![0].Attachments![0].State
      ).toBe('available');

      // Secondary region IGW
      const secondaryIGWResponse = await secondaryEC2.send(
        new DescribeInternetGatewaysCommand({
          Filters: [
            { Name: 'attachment.vpc-id', Values: [outputs.vpc_secondary_id] },
          ],
        })
      );

      expect(secondaryIGWResponse.InternetGateways).toBeDefined();
      expect(secondaryIGWResponse.InternetGateways!.length).toBe(1);
      expect(
        secondaryIGWResponse.InternetGateways![0].Attachments![0].State
      ).toBe('available');
    });

    test('NAT gateways are deployed and available', async () => {
      // Primary region NAT gateway (1 per region for cost optimization)
      const primaryNATResponse = await primaryEC2.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: 'vpc-id', Values: [outputs.vpc_primary_id] }],
        })
      );

      expect(primaryNATResponse.NatGateways).toBeDefined();
      expect(primaryNATResponse.NatGateways!.length).toBe(1);

      primaryNATResponse.NatGateways!.forEach(nat => {
        expect(nat.State).toBe('available');
        expect(nat.VpcId).toBe(outputs.vpc_primary_id);
      });

      // Secondary region NAT gateway (1 per region for cost optimization)
      const secondaryNATResponse = await secondaryEC2.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: 'vpc-id', Values: [outputs.vpc_secondary_id] }],
        })
      );

      expect(secondaryNATResponse.NatGateways).toBeDefined();
      expect(secondaryNATResponse.NatGateways!.length).toBe(1);

      secondaryNATResponse.NatGateways!.forEach(nat => {
        expect(nat.State).toBe('available');
        expect(nat.VpcId).toBe(outputs.vpc_secondary_id);
      });
    });

    test('route tables have correct routing configuration', async () => {
      // Primary region route tables
      const primaryRTResponse = await primaryEC2.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: 'vpc-id', Values: [outputs.vpc_primary_id] }],
        })
      );

      expect(primaryRTResponse.RouteTables).toBeDefined();
      expect(primaryRTResponse.RouteTables!.length).toBeGreaterThanOrEqual(3); // 1 public + 2 private + 1 default

      // Check for internet gateway routes in public route tables
      const publicRoutes = primaryRTResponse.RouteTables!.filter(rt =>
        rt.Routes?.some(route => route.GatewayId?.startsWith('igw-'))
      );
      expect(publicRoutes.length).toBeGreaterThanOrEqual(1);

      // Check for NAT gateway routes in private route tables
      const privateRoutes = primaryRTResponse.RouteTables!.filter(rt =>
        rt.Routes?.some(route => route.NatGatewayId?.startsWith('nat-'))
      );
      expect(privateRoutes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('IAM Configuration Tests', () => {
    test('IAM role exists and has correct configuration', async () => {
      const roleArn = outputs.financial_app_role_arn;
      const roleName = roleArn.split('/').pop();

      const response = await iamClient.send(
        new GetRoleCommand({
          RoleName: roleName,
        })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role!.Arn).toBe(roleArn);

      // Check assume role policy
      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role!.AssumeRolePolicyDocument!)
      );
      expect(assumeRolePolicy.Statement).toBeDefined();

      const statement = assumeRolePolicy.Statement[0];
      expect(statement.Principal.Service).toContain('ec2.amazonaws.com');
      expect(statement.Principal.Service).toContain('lambda.amazonaws.com');
      expect(statement.Principal.Service).toContain('ecs-tasks.amazonaws.com');
    });

    test('IAM instance profile exists', async () => {
      const instanceProfileName = outputs.financial_app_instance_profile_name;

      const response = await iamClient.send(
        new GetInstanceProfileCommand({
          InstanceProfileName: instanceProfileName,
        })
      );

      expect(response.InstanceProfile).toBeDefined();
      expect(response.InstanceProfile!.Roles).toBeDefined();
      expect(response.InstanceProfile!.Roles!.length).toBe(1);
    });
  });

  describe('Monitoring and Logging Tests', () => {
    test('CloudWatch log groups exist and are properly configured', async () => {
      // Primary region log group
      const primaryLogResponse = await primaryCWLogs.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/aws/financial-app',
        })
      );

      expect(primaryLogResponse.logGroups).toBeDefined();
      const primaryLogGroup = primaryLogResponse.logGroups!.find(
        lg => lg.logGroupName === outputs.log_group_primary_name
      );

      expect(primaryLogGroup).toBeDefined();
      expect(primaryLogGroup!.retentionInDays).toBe(30);
      expect(primaryLogGroup!.kmsKeyId).toBe(outputs.kms_key_primary_arn);

      // Secondary region log group
      const secondaryLogResponse = await secondaryCWLogs.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/aws/financial-app',
        })
      );

      expect(secondaryLogResponse.logGroups).toBeDefined();
      const secondaryLogGroup = secondaryLogResponse.logGroups!.find(
        lg => lg.logGroupName === outputs.log_group_secondary_name
      );

      expect(secondaryLogGroup).toBeDefined();
      expect(secondaryLogGroup!.retentionInDays).toBe(30);
      expect(secondaryLogGroup!.kmsKeyId).toBe(outputs.kms_key_secondary_arn);
    });

    test('CloudWatch alarms exist and are properly configured', async () => {
      // Primary region alarms
      const primaryAlarmResponse = await primaryCW.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: 'financial-app',
        })
      );

      expect(primaryAlarmResponse.MetricAlarms).toBeDefined();
      expect(primaryAlarmResponse.MetricAlarms!.length).toBeGreaterThanOrEqual(
        1
      );

      const primaryCpuAlarm = primaryAlarmResponse.MetricAlarms!.find(
        alarm =>
          alarm.AlarmName?.includes('high-cpu') &&
          alarm.AlarmName?.includes('primary')
      );

      expect(primaryCpuAlarm).toBeDefined();
      expect(primaryCpuAlarm!.MetricName).toBe('CPUUtilization');
      expect(primaryCpuAlarm!.Threshold).toBe(80);
      expect(primaryCpuAlarm!.ComparisonOperator).toBe('GreaterThanThreshold');

      // Secondary region alarms
      const secondaryAlarmResponse = await secondaryCW.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: 'financial-app',
        })
      );

      expect(secondaryAlarmResponse.MetricAlarms).toBeDefined();
      expect(
        secondaryAlarmResponse.MetricAlarms!.length
      ).toBeGreaterThanOrEqual(1);

      const secondaryCpuAlarm = secondaryAlarmResponse.MetricAlarms!.find(
        alarm =>
          alarm.AlarmName?.includes('high-cpu') &&
          alarm.AlarmName?.includes('secondary')
      );

      expect(secondaryCpuAlarm).toBeDefined();
      expect(secondaryCpuAlarm!.MetricName).toBe('CPUUtilization');
      expect(secondaryCpuAlarm!.Threshold).toBe(80);
    });

    test('SNS topics exist and are properly configured', async () => {
      // Primary region SNS topic
      const primaryTopicResponse = await primarySNS.send(
        new GetTopicAttributesCommand({
          TopicArn: outputs.sns_topic_primary_arn,
        })
      );

      expect(primaryTopicResponse.Attributes).toBeDefined();
      expect(primaryTopicResponse.Attributes!.KmsMasterKeyId).toBe(
        outputs.kms_key_primary_id
      );

      // Secondary region SNS topic
      const secondaryTopicResponse = await secondarySNS.send(
        new GetTopicAttributesCommand({
          TopicArn: outputs.sns_topic_secondary_arn,
        })
      );

      expect(secondaryTopicResponse.Attributes).toBeDefined();
      expect(secondaryTopicResponse.Attributes!.KmsMasterKeyId).toBe(
        outputs.kms_key_secondary_id
      );
    });
  });

  describe('Multi-Region Consistency Tests', () => {
    test('both regions have consistent resource counts', async () => {
      // Compare subnet counts
      expect(outputs.public_subnet_ids_primary.length).toBe(
        outputs.public_subnet_ids_secondary.length
      );
      expect(outputs.private_subnet_ids_primary.length).toBe(
        outputs.private_subnet_ids_secondary.length
      );

      // Verify both regions are different
      expect(outputs.primary_region).not.toBe(outputs.secondary_region);

      // Verify VPCs are different
      expect(outputs.vpc_primary_id).not.toBe(outputs.vpc_secondary_id);
    });

    test('cross-region connectivity setup is consistent', async () => {
      // Both regions should have 1 NAT gateway for cost optimization
      const primaryNATResponse = await primaryEC2.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: 'vpc-id', Values: [outputs.vpc_primary_id] }],
        })
      );

      const secondaryNATResponse = await secondaryEC2.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: 'vpc-id', Values: [outputs.vpc_secondary_id] }],
        })
      );

      expect(primaryNATResponse.NatGateways!.length).toBe(1);
      expect(secondaryNATResponse.NatGateways!.length).toBe(1);
    });
  });

  describe('High Availability Tests', () => {
    test('resources are distributed across multiple availability zones', async () => {
      // Check primary region AZ distribution
      const primarySubnetsResponse = await primaryEC2.send(
        new DescribeSubnetsCommand({
          SubnetIds: outputs.public_subnet_ids_primary,
        })
      );

      const primaryAZs = new Set(
        primarySubnetsResponse.Subnets!.map(s => s.AvailabilityZone)
      );
      expect(primaryAZs.size).toBe(2); // Should span 2 AZs

      // Check secondary region AZ distribution
      const secondarySubnetsResponse = await secondaryEC2.send(
        new DescribeSubnetsCommand({
          SubnetIds: outputs.public_subnet_ids_secondary,
        })
      );

      const secondaryAZs = new Set(
        secondarySubnetsResponse.Subnets!.map(s => s.AvailabilityZone)
      );
      expect(secondaryAZs.size).toBe(2); // Should span 2 AZs
    });

    test('NAT gateways are properly configured', async () => {
      // Primary region NAT gateway
      const primaryNATResponse = await primaryEC2.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: 'vpc-id', Values: [outputs.vpc_primary_id] }],
        })
      );

      expect(primaryNATResponse.NatGateways!.length).toBe(1);
      expect(primaryNATResponse.NatGateways![0].State).toBe('available');

      // Secondary region NAT gateway
      const secondaryNATResponse = await secondaryEC2.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: 'vpc-id', Values: [outputs.vpc_secondary_id] }],
        })
      );

      expect(secondaryNATResponse.NatGateways!.length).toBe(1);
      expect(secondaryNATResponse.NatGateways![0].State).toBe('available');
    });
  });
});
