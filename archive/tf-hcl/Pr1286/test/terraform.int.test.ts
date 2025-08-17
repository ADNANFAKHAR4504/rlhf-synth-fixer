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
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetInstanceProfileCommand,
  GetRoleCommand,
  IAMClient,
} from '@aws-sdk/client-iam';
import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
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
      if (
        typeof value === 'string' &&
        (key.includes('subnet_ids') || key.includes('gateway_ids'))
      ) {
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
      'environment_suffix',
      'name_prefix',
      'random_suffix',
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
    const primaryRegion = outputs.primary_region || 'us-east-1';
    const secondaryRegion = outputs.secondary_region || 'us-west-2';

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

  describe('Environment and Naming Tests', () => {
    test('environment suffix and naming are properly configured', () => {
      expect(outputs.environment_suffix).toBeDefined();
      expect(outputs.name_prefix).toBeDefined();
      expect(outputs.random_suffix).toBeDefined();

      expect(outputs.name_prefix).toMatch(
        new RegExp(
          `financial-app-${outputs.environment_suffix}-${outputs.random_suffix}`
        )
      );
      expect(outputs.random_suffix).toMatch(/^[a-z0-9]{6}$/); // 6-character alphanumeric lowercase
    });
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

      // Check VPC has correct tags with environment suffix
      const nameTags = vpc.Tags?.filter(tag => tag.Key === 'Name');
      expect(nameTags?.length).toBe(1);
      expect(nameTags![0].Value).toContain(outputs.name_prefix);
      expect(nameTags![0].Value).toContain('-vpc-primary');

      const envTags = vpc.Tags?.filter(tag => tag.Key === 'Environment');
      expect(envTags?.length).toBe(1);
      expect(envTags![0].Value).toBe(outputs.environment_suffix);
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

      // Check VPC has correct tags with environment suffix
      const nameTags = vpc.Tags?.filter(tag => tag.Key === 'Name');
      expect(nameTags?.length).toBe(1);
      expect(nameTags![0].Value).toContain(outputs.name_prefix);
      expect(nameTags![0].Value).toContain('-vpc-secondary');
    });

    test('public subnets exist in primary region with correct naming', async () => {
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

        // Check subnet has correct tags with environment suffix
        const nameTags = subnet.Tags?.filter(tag => tag.Key === 'Name');
        expect(nameTags?.length).toBe(1);
        expect(nameTags![0].Value).toContain(outputs.name_prefix);
        expect(nameTags![0].Value).toContain('-public-subnet-primary-');

        const envTags = subnet.Tags?.filter(tag => tag.Key === 'Environment');
        expect(envTags?.length).toBe(1);
        expect(envTags![0].Value).toBe(outputs.environment_suffix);
      });

      // Ensure all expected CIDR blocks are present
      expectedCidrBlocks.forEach(expectedCidr => {
        expect(actualCidrBlocks).toContain(expectedCidr);
      });
    });

    test('private subnets exist in primary region with correct naming', async () => {
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

        // Check subnet has correct tags with environment suffix
        const nameTags = subnet.Tags?.filter(tag => tag.Key === 'Name');
        expect(nameTags?.length).toBe(1);
        expect(nameTags![0].Value).toContain(outputs.name_prefix);
        expect(nameTags![0].Value).toContain('-private-subnet-primary-');
      });

      // Ensure all expected CIDR blocks are present
      expectedCidrBlocks.forEach(expectedCidr => {
        expect(actualCidrBlocks).toContain(expectedCidr);
      });
    });

    test('public subnets exist in secondary region with correct naming', async () => {
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

        // Check subnet has correct tags with environment suffix
        const nameTags = subnet.Tags?.filter(tag => tag.Key === 'Name');
        expect(nameTags?.length).toBe(1);
        expect(nameTags![0].Value).toContain(outputs.name_prefix);
        expect(nameTags![0].Value).toContain('-public-subnet-secondary-');
      });

      // Ensure all expected CIDR blocks are present
      expectedCidrBlocks.forEach(expectedCidr => {
        expect(actualCidrBlocks).toContain(expectedCidr);
      });
    });

    test('private subnets exist in secondary region with correct naming', async () => {
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

        // Check subnet has correct tags with environment suffix
        const nameTags = subnet.Tags?.filter(tag => tag.Key === 'Name');
        expect(nameTags?.length).toBe(1);
        expect(nameTags![0].Value).toContain(outputs.name_prefix);
        expect(nameTags![0].Value).toContain('-private-subnet-secondary-');
      });

      // Ensure all expected CIDR blocks are present
      expectedCidrBlocks.forEach(expectedCidr => {
        expect(actualCidrBlocks).toContain(expectedCidr);
      });
    });
  });

  describe('Network Infrastructure Tests', () => {
    test('internet gateways are attached to VPCs with correct naming', async () => {
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

      // Check IGW has correct tags
      const primaryIGW = primaryIGWResponse.InternetGateways![0];
      const nameTags = primaryIGW.Tags?.filter(tag => tag.Key === 'Name');
      expect(nameTags?.length).toBe(1);
      expect(nameTags![0].Value).toContain(outputs.name_prefix);
      expect(nameTags![0].Value).toContain('-igw-primary');

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

      // Check secondary IGW has correct tags
      const secondaryIGW = secondaryIGWResponse.InternetGateways![0];
      const secondaryNameTags = secondaryIGW.Tags?.filter(
        tag => tag.Key === 'Name'
      );
      expect(secondaryNameTags?.length).toBe(1);
      expect(secondaryNameTags![0].Value).toContain(outputs.name_prefix);
      expect(secondaryNameTags![0].Value).toContain('-igw-secondary');
    });

    test('NAT gateways are deployed and available (optimized for cost)', async () => {
      // Primary region NAT gateway (1 per region for cost optimization)
      const primaryNATResponse = await primaryEC2.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: 'vpc-id', Values: [outputs.vpc_primary_id] }],
        })
      );

      expect(primaryNATResponse.NatGateways).toBeDefined();
      expect(primaryNATResponse.NatGateways!.length).toBe(1); // Only 1 for cost optimization

      primaryNATResponse.NatGateways!.forEach(nat => {
        expect(nat.State).toBe('available');
        expect(nat.VpcId).toBe(outputs.vpc_primary_id);

        // Check NAT gateway has correct tags
        const nameTags = nat.Tags?.filter(tag => tag.Key === 'Name');
        expect(nameTags?.length).toBe(1);
        expect(nameTags![0].Value).toContain(outputs.name_prefix);
        expect(nameTags![0].Value).toContain('-nat-primary-');
      });

      // Secondary region NAT gateway (1 per region for cost optimization)
      const secondaryNATResponse = await secondaryEC2.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: 'vpc-id', Values: [outputs.vpc_secondary_id] }],
        })
      );

      expect(secondaryNATResponse.NatGateways).toBeDefined();
      expect(secondaryNATResponse.NatGateways!.length).toBe(1); // Only 1 for cost optimization

      secondaryNATResponse.NatGateways!.forEach(nat => {
        expect(nat.State).toBe('available');
        expect(nat.VpcId).toBe(outputs.vpc_secondary_id);

        // Check NAT gateway has correct tags
        const nameTags = nat.Tags?.filter(tag => tag.Key === 'Name');
        expect(nameTags?.length).toBe(1);
        expect(nameTags![0].Value).toContain(outputs.name_prefix);
        expect(nameTags![0].Value).toContain('-nat-secondary-');
      });
    });

    test('route tables have correct routing configuration and naming', async () => {
      // Primary region route tables
      const primaryRTResponse = await primaryEC2.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: 'vpc-id', Values: [outputs.vpc_primary_id] }],
        })
      );

      expect(primaryRTResponse.RouteTables).toBeDefined();
      expect(primaryRTResponse.RouteTables!.length).toBeGreaterThanOrEqual(3); // 1 public + 2 private + 1 default

      // Check for internet gateway routes in public route tables
      const publicRoutes = primaryRTResponse.RouteTables!.filter(rt => {
        const hasIGWRoute = rt.Routes?.some(route =>
          route.GatewayId?.startsWith('igw-')
        );
        const hasCorrectTag = rt.Tags?.some(
          tag =>
            tag.Key === 'Name' &&
            tag.Value?.includes(outputs.name_prefix) &&
            tag.Value?.includes('-public-rt-primary')
        );
        return hasIGWRoute && hasCorrectTag;
      });
      expect(publicRoutes.length).toBeGreaterThanOrEqual(1);

      // Check for NAT gateway routes in private route tables
      const privateRoutes = primaryRTResponse.RouteTables!.filter(rt => {
        const hasNATRoute = rt.Routes?.some(route =>
          route.NatGatewayId?.startsWith('nat-')
        );
        const hasCorrectTag = rt.Tags?.some(
          tag =>
            tag.Key === 'Name' &&
            tag.Value?.includes(outputs.name_prefix) &&
            tag.Value?.includes('-private-rt-primary-')
        );
        return hasNATRoute && hasCorrectTag;
      });
      expect(privateRoutes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('IAM Configuration Tests', () => {
    test('IAM role exists and has correct configuration with environment suffix', async () => {
      const roleArn = outputs.financial_app_role_arn;
      const roleName = roleArn.split('/').pop();

      expect(roleName).toContain(outputs.name_prefix);
      expect(roleName).toContain('-role');

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

      // Check role has correct tags
      expect(response.Role!.Tags).toBeDefined();
      const nameTags = response.Role!.Tags?.filter(tag => tag.Key === 'Name');
      expect(nameTags?.length).toBe(1);
      expect(nameTags![0].Value).toContain(outputs.name_prefix);
      expect(nameTags![0].Value).toContain('-role');

      const envTags = response.Role!.Tags?.filter(
        tag => tag.Key === 'Environment'
      );
      expect(envTags?.length).toBe(1);
      expect(envTags![0].Value).toBe(outputs.environment_suffix);
    });

    test('IAM instance profile exists with correct naming', async () => {
      const instanceProfileName = outputs.financial_app_instance_profile_name;

      expect(instanceProfileName).toContain(outputs.name_prefix);
      expect(instanceProfileName).toContain('-profile');

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
    test('CloudWatch log groups exist and are properly configured with naming', async () => {
      // Primary region log group
      const primaryLogResponse = await primaryCWLogs.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: `/aws/${outputs.name_prefix}`,
        })
      );

      expect(primaryLogResponse.logGroups).toBeDefined();
      const primaryLogGroup = primaryLogResponse.logGroups!.find(
        lg => lg.logGroupName === outputs.log_group_primary_name
      );

      expect(primaryLogGroup).toBeDefined();
      expect(primaryLogGroup!.retentionInDays).toBe(30);
      expect(primaryLogGroup!.kmsKeyId).toBe(outputs.kms_key_primary_arn);
      expect(primaryLogGroup!.logGroupName).toContain(outputs.name_prefix);
      expect(primaryLogGroup!.logGroupName).toContain('/primary');

      // Secondary region log group
      const secondaryLogResponse = await secondaryCWLogs.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: `/aws/${outputs.name_prefix}`,
        })
      );

      expect(secondaryLogResponse.logGroups).toBeDefined();
      const secondaryLogGroup = secondaryLogResponse.logGroups!.find(
        lg => lg.logGroupName === outputs.log_group_secondary_name
      );

      expect(secondaryLogGroup).toBeDefined();
      expect(secondaryLogGroup!.retentionInDays).toBe(30);
      expect(secondaryLogGroup!.kmsKeyId).toBe(outputs.kms_key_secondary_arn);
      expect(secondaryLogGroup!.logGroupName).toContain(outputs.name_prefix);
      expect(secondaryLogGroup!.logGroupName).toContain('/secondary');
    });

    test('CloudWatch alarms exist and are properly configured with naming', async () => {
      // Primary region alarms
      const primaryAlarmResponse = await primaryCW.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: outputs.name_prefix,
        })
      );

      expect(primaryAlarmResponse.MetricAlarms).toBeDefined();
      expect(primaryAlarmResponse.MetricAlarms!.length).toBeGreaterThanOrEqual(
        1
      );

      const primaryCpuAlarm = primaryAlarmResponse.MetricAlarms!.find(
        alarm =>
          alarm.AlarmName?.includes('high-cpu') &&
          alarm.AlarmName?.includes('primary') &&
          alarm.AlarmName?.includes(outputs.name_prefix)
      );

      expect(primaryCpuAlarm).toBeDefined();
      expect(primaryCpuAlarm!.MetricName).toBe('CPUUtilization');
      expect(primaryCpuAlarm!.Threshold).toBe(80);
      expect(primaryCpuAlarm!.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(primaryCpuAlarm!.AlarmName).toBe(
        outputs.cloudwatch_alarm_primary_name
      );

      // Secondary region alarms
      const secondaryAlarmResponse = await secondaryCW.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: outputs.name_prefix,
        })
      );

      expect(secondaryAlarmResponse.MetricAlarms).toBeDefined();
      expect(
        secondaryAlarmResponse.MetricAlarms!.length
      ).toBeGreaterThanOrEqual(1);

      const secondaryCpuAlarm = secondaryAlarmResponse.MetricAlarms!.find(
        alarm =>
          alarm.AlarmName?.includes('high-cpu') &&
          alarm.AlarmName?.includes('secondary') &&
          alarm.AlarmName?.includes(outputs.name_prefix)
      );

      expect(secondaryCpuAlarm).toBeDefined();
      expect(secondaryCpuAlarm!.MetricName).toBe('CPUUtilization');
      expect(secondaryCpuAlarm!.Threshold).toBe(80);
      expect(secondaryCpuAlarm!.AlarmName).toBe(
        outputs.cloudwatch_alarm_secondary_name
      );
    });

    test('SNS topics exist and are properly configured with naming', async () => {
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

      // Check topic name contains environment suffix
      expect(outputs.sns_topic_primary_arn).toContain(outputs.name_prefix);
      expect(outputs.sns_topic_primary_arn).toContain('-alerts-primary');

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

      // Check topic name contains environment suffix
      expect(outputs.sns_topic_secondary_arn).toContain(outputs.name_prefix);
      expect(outputs.sns_topic_secondary_arn).toContain('-alerts-secondary');
    });
  });

  describe('Security Infrastructure Tests', () => {
    test('security groups have correct configuration and restricted access', async () => {
      // Primary region security groups
      const primarySGResponse = await primaryEC2.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: 'vpc-id', Values: [outputs.vpc_primary_id] }],
        })
      );

      expect(primarySGResponse.SecurityGroups).toBeDefined();
      const primaryFinancialSG = primarySGResponse.SecurityGroups!.find(
        sg =>
          sg.GroupName?.includes(outputs.name_prefix) &&
          sg.GroupName?.includes('-sg-primary') &&
          !sg.GroupName?.includes('default')
      );

      expect(primaryFinancialSG).toBeDefined();
      expect(primaryFinancialSG!.GroupName).toContain(outputs.name_prefix);
      expect(primaryFinancialSG!.GroupName).toContain('-sg-primary');

      // Check ingress rules - should not allow 0.0.0.0/0 for HTTP/HTTPS
      const httpIngressRules = primaryFinancialSG!.IpPermissions!.filter(
        rule => rule.FromPort === 80 || rule.FromPort === 443
      );

      httpIngressRules.forEach(rule => {
        const hasBroadAccess = rule.IpRanges?.some(
          range => range.CidrIp === '0.0.0.0/0'
        );
        expect(hasBroadAccess).toBe(false); // Should NOT have broad internet access

        // Should have VPC CIDR blocks instead
        const hasVpcAccess = rule.IpRanges?.some(
          range =>
            range.CidrIp === '10.0.0.0/16' ||
            range.CidrIp === '172.16.0.0/12' ||
            range.CidrIp === '192.168.0.0/16'
        );
        expect(hasVpcAccess).toBe(true);
      });

      // Secondary region security groups
      const secondarySGResponse = await secondaryEC2.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: 'vpc-id', Values: [outputs.vpc_secondary_id] }],
        })
      );

      expect(secondarySGResponse.SecurityGroups).toBeDefined();
      const secondaryFinancialSG = secondarySGResponse.SecurityGroups!.find(
        sg =>
          sg.GroupName?.includes(outputs.name_prefix) &&
          sg.GroupName?.includes('-sg-secondary') &&
          !sg.GroupName?.includes('default')
      );

      expect(secondaryFinancialSG).toBeDefined();
      expect(secondaryFinancialSG!.GroupName).toContain(outputs.name_prefix);
      expect(secondaryFinancialSG!.GroupName).toContain('-sg-secondary');

      // Same security checks for secondary region
      const secondaryHttpIngressRules =
        secondaryFinancialSG!.IpPermissions!.filter(
          rule => rule.FromPort === 80 || rule.FromPort === 443
        );

      secondaryHttpIngressRules.forEach(rule => {
        const hasBroadAccess = rule.IpRanges?.some(
          range => range.CidrIp === '0.0.0.0/0'
        );
        expect(hasBroadAccess).toBe(false);

        const hasVpcAccess = rule.IpRanges?.some(
          range =>
            range.CidrIp === '10.1.0.0/16' ||
            range.CidrIp === '172.16.0.0/12' ||
            range.CidrIp === '192.168.0.0/16'
        );
        expect(hasVpcAccess).toBe(true);
      });
    });

    test('KMS keys are functional and properly configured with naming', async () => {
      // Primary region KMS key
      const primaryKeyResponse = await primaryKMS.send(
        new DescribeKeyCommand({
          KeyId: outputs.kms_key_primary_id,
        })
      );

      expect(primaryKeyResponse.KeyMetadata).toBeDefined();
      expect(primaryKeyResponse.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(primaryKeyResponse.KeyMetadata!.KeyState).toBe('Enabled');

      // Check key rotation is enabled
      const primaryRotationResponse = await primaryKMS.send(
        new GetKeyRotationStatusCommand({
          KeyId: outputs.kms_key_primary_id,
        })
      );
      expect(primaryRotationResponse.KeyRotationEnabled).toBe(true);

      // Secondary region KMS key
      const secondaryKeyResponse = await secondaryKMS.send(
        new DescribeKeyCommand({
          KeyId: outputs.kms_key_secondary_id,
        })
      );

      expect(secondaryKeyResponse.KeyMetadata).toBeDefined();
      expect(secondaryKeyResponse.KeyMetadata!.KeyUsage).toBe(
        'ENCRYPT_DECRYPT'
      );
      expect(secondaryKeyResponse.KeyMetadata!.KeyState).toBe('Enabled');

      // Check key rotation is enabled
      const secondaryRotationResponse = await secondaryKMS.send(
        new GetKeyRotationStatusCommand({
          KeyId: outputs.kms_key_secondary_id,
        })
      );
      expect(secondaryRotationResponse.KeyRotationEnabled).toBe(true);
    });

    test('KMS aliases are properly configured with naming', async () => {
      // Check primary region aliases
      const primaryAliasResponse = await primaryKMS.send(
        new ListAliasesCommand({})
      );
      const primaryFinancialAlias = primaryAliasResponse.Aliases?.find(
        alias =>
          alias.AliasName?.includes(outputs.name_prefix) &&
          alias.AliasName?.includes('-primary')
      );

      expect(primaryFinancialAlias).toBeDefined();
      expect(primaryFinancialAlias!.TargetKeyId).toBe(
        outputs.kms_key_primary_id
      );
      expect(primaryFinancialAlias!.AliasName).toBe(
        outputs.kms_alias_primary_name
      );

      // Check secondary region aliases
      const secondaryAliasResponse = await secondaryKMS.send(
        new ListAliasesCommand({})
      );
      const secondaryFinancialAlias = secondaryAliasResponse.Aliases?.find(
        alias =>
          alias.AliasName?.includes(outputs.name_prefix) &&
          alias.AliasName?.includes('-secondary')
      );

      expect(secondaryFinancialAlias).toBeDefined();
      expect(secondaryFinancialAlias!.TargetKeyId).toBe(
        outputs.kms_key_secondary_id
      );
      expect(secondaryFinancialAlias!.AliasName).toBe(
        outputs.kms_alias_secondary_name
      );
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

    test('cost-optimized NAT gateways are properly configured', async () => {
      // Primary region NAT gateway
      const primaryNATResponse = await primaryEC2.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: 'vpc-id', Values: [outputs.vpc_primary_id] }],
        })
      );

      expect(primaryNATResponse.NatGateways!.length).toBe(1); // Cost optimized
      expect(primaryNATResponse.NatGateways![0].State).toBe('available');

      // Secondary region NAT gateway
      const secondaryNATResponse = await secondaryEC2.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: 'vpc-id', Values: [outputs.vpc_secondary_id] }],
        })
      );

      expect(secondaryNATResponse.NatGateways!.length).toBe(1); // Cost optimized
      expect(secondaryNATResponse.NatGateways![0].State).toBe('available');
    });
  });

  describe('Comprehensive Infrastructure Validation', () => {
    test('all infrastructure components are properly tagged with environment suffix', async () => {
      // All outputs that contain names should include the environment suffix
      const nameOutputs = [
        'name_prefix',
        'kms_alias_primary_name',
        'kms_alias_secondary_name',
        'log_group_primary_name',
        'log_group_secondary_name',
        'cloudwatch_alarm_primary_name',
        'cloudwatch_alarm_secondary_name',
      ];

      nameOutputs.forEach(output => {
        if (outputs[output]) {
          expect(outputs[output]).toContain(outputs.environment_suffix);
        }
      });

      // ARNs should contain the name prefix
      const arnOutputs = [
        'financial_app_role_arn',
        'sns_topic_primary_arn',
        'sns_topic_secondary_arn',
      ];

      arnOutputs.forEach(output => {
        if (outputs[output]) {
          expect(outputs[output]).toContain(outputs.name_prefix);
        }
      });
    });

    test('random suffix is properly incorporated in all resource names', () => {
      expect(outputs.random_suffix).toMatch(/^[a-z0-9]{6}$/);
      expect(outputs.name_prefix).toContain(outputs.random_suffix);
    });

    test('infrastructure supports clean rollback capability', async () => {
      // All resources should be configured for clean deletion
      // KMS keys should have short deletion window for testing
      const primaryKeyResponse = await primaryKMS.send(
        new DescribeKeyCommand({
          KeyId: outputs.kms_key_primary_id,
        })
      );

      // Key should be in enabled state (not pending deletion)
      expect(primaryKeyResponse.KeyMetadata!.KeyState).toBe('Enabled');

      // Test environment should be properly isolated by name prefix
      expect(outputs.name_prefix).toContain('financial-app');
      expect(outputs.name_prefix).toContain(outputs.environment_suffix);
      expect(outputs.name_prefix).toContain(outputs.random_suffix);
    });
  });
});
