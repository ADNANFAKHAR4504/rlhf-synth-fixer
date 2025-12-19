import {
  ACMClient,
  ListCertificatesCommand
} from '@aws-sdk/client-acm';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand
} from '@aws-sdk/client-auto-scaling';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeInternetGatewaysCommand,
  DescribeLaunchTemplatesCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  GetInstanceProfileCommand,
  GetRoleCommand,
  GetRolePolicyCommand,
  IAMClient
} from '@aws-sdk/client-iam';
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient
} from '@aws-sdk/client-rds';
import {
  GetParameterCommand,
  GetParametersCommand,
  SSMClient
} from '@aws-sdk/client-ssm';
import * as fs from 'fs';

// Configuration - These outputs come from cfn-outputs after terraform apply
let outputs: any = {};
try {
  const rawOutputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );

  // Parse array outputs that might be JSON strings
  outputs = {
    ...rawOutputs
  };

  // Handle public_subnet_ids
  if (typeof rawOutputs.public_subnet_ids === 'string') {
    try {
      outputs.public_subnet_ids = JSON.parse(rawOutputs.public_subnet_ids);
    } catch {
      // If it's not valid JSON, split by comma and clean up
      outputs.public_subnet_ids = rawOutputs.public_subnet_ids
        .replace(/[\[\]"]/g, '')
        .split(',')
        .map((id: string) => id.trim())
        .filter((id: string) => id.length > 0);
    }
  } else if (Array.isArray(rawOutputs.public_subnet_ids)) {
    outputs.public_subnet_ids = rawOutputs.public_subnet_ids;
  } else {
    outputs.public_subnet_ids = [];
  }

  // Handle private_subnet_ids
  if (typeof rawOutputs.private_subnet_ids === 'string') {
    try {
      outputs.private_subnet_ids = JSON.parse(rawOutputs.private_subnet_ids);
    } catch {
      // If it's not valid JSON, split by comma and clean up
      outputs.private_subnet_ids = rawOutputs.private_subnet_ids
        .replace(/[\[\]"]/g, '')
        .split(',')
        .map((id: string) => id.trim())
        .filter((id: string) => id.length > 0);
    }
  } else if (Array.isArray(rawOutputs.private_subnet_ids)) {
    outputs.private_subnet_ids = rawOutputs.private_subnet_ids;
  } else {
    outputs.private_subnet_ids = [];
  }

} catch (err) {
  console.warn('Warning: Outputs file not found or invalid. Integration tests will be skipped.');
  console.error('Error details:', err);
}

// AWS clients - set region explicitly
const region = process.env.AWS_REGION || 'us-west-2';
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const autoScalingClient = new AutoScalingClient({ region });
const ssmClient = new SSMClient({ region });
const iamClient = new IAMClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region });
const acmClient = new ACMClient({ region });

describe('Terraform Web Application Infrastructure Integration Tests', () => {

  beforeAll(() => {
    if (!outputs.vpc_id) {
      console.warn('Required outputs not found. Ensure terraform apply has been run and outputs are available.');
    }
    // Debug log to see the actual output structure
    console.log('Parsed outputs:', JSON.stringify(outputs, null, 2));
  });

  describe('Basic Output Validation', () => {
    test('all required outputs are present', () => {
      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.public_subnet_ids).toBeDefined();
      expect(outputs.private_subnet_ids).toBeDefined();
      expect(outputs.load_balancer_dns_name).toBeDefined();
      expect(outputs.database_endpoint).toBeDefined();
      expect(outputs.auto_scaling_group_name).toBeDefined();
    });

    test('output formats are correct', () => {
      expect(outputs.vpc_id).toMatch(/^vpc-[a-f0-9]+$/);

      // Ensure subnet IDs are arrays
      expect(Array.isArray(outputs.public_subnet_ids)).toBe(true);
      expect(Array.isArray(outputs.private_subnet_ids)).toBe(true);
      expect(outputs.public_subnet_ids.length).toBeGreaterThanOrEqual(2);
      expect(outputs.private_subnet_ids.length).toBeGreaterThanOrEqual(2);

      // Check each subnet ID format
      outputs.public_subnet_ids.forEach((id: string) => {
        expect(typeof id).toBe('string');
        expect(id).toMatch(/^subnet-[a-f0-9]+$/);
      });

      outputs.private_subnet_ids.forEach((id: string) => {
        expect(typeof id).toBe('string');
        expect(id).toMatch(/^subnet-[a-f0-9]+$/);
      });
    });
  });

  describe('VPC Infrastructure Verification', () => {
    test('VPC exists with correct configuration', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);

      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(outputs.vpc_id);
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      expect(vpc.DhcpOptionsId).toBeDefined();

      // Check DNS support via attributes
      const dnsHostnamesCommand = new DescribeVpcAttributeCommand({
        VpcId: outputs.vpc_id,
        Attribute: 'enableDnsHostnames'
      });
      const dnsHostnamesResponse = await ec2Client.send(dnsHostnamesCommand);
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);

      const dnsSupportCommand = new DescribeVpcAttributeCommand({
        VpcId: outputs.vpc_id,
        Attribute: 'enableDnsSupport'
      });
      const dnsSupportResponse = await ec2Client.send(dnsSupportCommand);
      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);

      // Check tags
      const nameTag = vpc.Tags?.find(tag => tag.Key === 'Name');
      expect(nameTag?.Value).toContain('task-274789-tap-vpc');
    }, 30000);

    test('Internet Gateway exists and is attached', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.vpc_id]
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.InternetGateways!.length).toBeGreaterThanOrEqual(1);

      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].VpcId).toBe(outputs.vpc_id);
      expect(igw.Attachments![0].State).toBe('available');
    }, 30000);

    test('public subnets exist with correct configuration', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.public_subnet_ids
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets!.length).toBe(outputs.public_subnet_ids.length);

      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);

        // Check CIDR blocks are within expected ranges
        expect(subnet.CidrBlock).toMatch(/^10\.0\.[12]\.0\/24$/);

        // Check tags
        const nameTag = subnet.Tags?.find(tag => tag.Key === 'Name');
        expect(nameTag?.Value).toContain('task-274789-tap-public-subnet');

        const typeTag = subnet.Tags?.find(tag => tag.Key === 'Type');
        expect(typeTag?.Value).toBe('Public');
      });
    }, 30000);

    test('private subnets exist with correct configuration', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.private_subnet_ids
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets!.length).toBe(outputs.private_subnet_ids.length);

      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);

        // Check CIDR blocks are within expected ranges
        expect(subnet.CidrBlock).toMatch(/^10\.0\.[12]0\.0\/24$/);

        // Check tags
        const nameTag = subnet.Tags?.find(tag => tag.Key === 'Name');
        expect(nameTag?.Value).toContain('task-274789-tap-private-subnet');

        const typeTag = subnet.Tags?.find(tag => tag.Key === 'Type');
        expect(typeTag?.Value).toBe('Private');
      });
    }, 30000);

    test('NAT Gateways exist in public subnets', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          },
          {
            Name: 'state',
            Values: ['available']
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);

      response.NatGateways!.forEach(natGw => {
        expect(natGw.VpcId).toBe(outputs.vpc_id);
        expect(natGw.State).toBe('available');
        expect(outputs.public_subnet_ids).toContain(natGw.SubnetId);
        expect(natGw.NatGatewayAddresses![0].AllocationId).toBeDefined();
      });
    }, 30000);

    test('route tables exist with correct routes', async () => {
      // Test public route table
      const publicRouteTableCommand = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          },
          {
            Name: 'tag:Name',
            Values: ['*task-274789-tap-public-route-table*']
          }
        ]
      });

      const publicResponse = await ec2Client.send(publicRouteTableCommand);
      expect(publicResponse.RouteTables!.length).toBeGreaterThanOrEqual(1);

      const publicRouteTable = publicResponse.RouteTables![0];
      expect(publicRouteTable.VpcId).toBe(outputs.vpc_id);

      // Check for internet gateway route
      const igwRoute = publicRouteTable.Routes?.find(r =>
        r.DestinationCidrBlock === '0.0.0.0/0' && r.GatewayId?.startsWith('igw-')
      );
      expect(igwRoute).toBeDefined();
      expect(igwRoute?.State).toBe('active');

      // Test private route tables
      const privateRouteTableCommand = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          },
          {
            Name: 'tag:Name',
            Values: ['*task-274789-tap-private-route-table*']
          }
        ]
      });

      const privateResponse = await ec2Client.send(privateRouteTableCommand);
      expect(privateResponse.RouteTables!.length).toBeGreaterThanOrEqual(1);

      privateResponse.RouteTables!.forEach(routeTable => {
        expect(routeTable.VpcId).toBe(outputs.vpc_id);

        // Check for NAT gateway route
        const natRoute = routeTable.Routes?.find(r =>
          r.DestinationCidrBlock === '0.0.0.0/0' && r.NatGatewayId?.startsWith('nat-')
        );
        expect(natRoute).toBeDefined();
        expect(natRoute?.State).toBe('active');
      });
    }, 30000);
  });

  describe('Security Group Verification', () => {
    test('ALB security group exists with correct rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          },
          {
            Name: 'tag:Name',
            Values: ['*task-274789-tap-alb-security-group*']
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(1);

      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.vpc_id);
      expect(sg.Description).toContain('Application Load Balancer');

      // Check for HTTPS ingress rule
      const httpsRule = sg.IpPermissions?.find(rule =>
        rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpProtocol).toBe('tcp');
      expect(httpsRule?.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')).toBe(true);

      // Check for HTTP ingress rule
      const httpRule = sg.IpPermissions?.find(rule =>
        rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpProtocol).toBe('tcp');
    }, 30000);

    test('EC2 security group exists with correct rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          },
          {
            Name: 'tag:Name',
            Values: ['*task-274789-tap-ec2-security-group*']
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(1);

      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.vpc_id);
      expect(sg.Description).toContain('EC2 instances');

      // Check for HTTP ingress rule from ALB
      const httpRule = sg.IpPermissions?.find(rule =>
        rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpProtocol).toBe('tcp');
      expect(httpRule?.UserIdGroupPairs?.length).toBeGreaterThan(0);
    }, 30000);

    test('RDS security group exists with correct rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          },
          {
            Name: 'tag:Name',
            Values: ['*task-274789-tap-rds-security-group*']
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(1);

      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.vpc_id);
      expect(sg.Description).toContain('RDS database');

      // Check for PostgreSQL ingress rule
      const pgRule = sg.IpPermissions?.find(rule =>
        rule.FromPort === 5432 && rule.ToPort === 5432
      );
      expect(pgRule).toBeDefined();
      expect(pgRule?.IpProtocol).toBe('tcp');
      expect(pgRule?.UserIdGroupPairs?.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('RDS Database Verification', () => {
    test('RDS instance exists with correct configuration', async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: 'task-274789-tap-postgres'
      });

      const response = await rdsClient.send(command);
      expect(response.DBInstances!.length).toBe(1);

      const db = response.DBInstances![0];
      expect(db.DBInstanceIdentifier).toBe('task-274789-tap-postgres');
      expect(db.Engine).toBe('postgres');
      expect(db.EngineVersion).toMatch(/^15\./);
      expect(db.DBInstanceStatus).toBe('available');
      expect(db.StorageEncrypted).toBe(true);
      expect(db.BackupRetentionPeriod).toBe(7);
      expect(db.VpcSecurityGroups?.length).toBeGreaterThan(0);
    }, 60000);

    test('DB subnet group exists with correct subnets', async () => {
      const command = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: 'task-274789-tap-db-subnet-group'
      });

      const response = await rdsClient.send(command);
      expect(response.DBSubnetGroups!.length).toBe(1);

      const subnetGroup = response.DBSubnetGroups![0];
      expect(subnetGroup.VpcId).toBe(outputs.vpc_id);
      expect(subnetGroup.Subnets?.length).toBeGreaterThanOrEqual(2);

      // Verify all subnets are private subnets
      subnetGroup.Subnets?.forEach(subnet => {
        expect(outputs.private_subnet_ids).toContain(subnet.SubnetIdentifier);
      });
    }, 30000);
  });

  describe('Load Balancer Verification', () => {
    test('Application Load Balancer exists with correct configuration', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: ['task-274789-tap-alb']
      });

      const response = await elbv2Client.send(command);
      expect(response.LoadBalancers!.length).toBe(1);

      const alb = response.LoadBalancers![0];
      expect(alb.LoadBalancerName).toBe('task-274789-tap-alb');
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.State?.Code).toBe('active');
      expect(alb.VpcId).toBe(outputs.vpc_id);
      expect(alb.DNSName).toBe(outputs.load_balancer_dns_name);

      // Verify subnets are public subnets
      alb.AvailabilityZones?.forEach(az => {
        expect(outputs.public_subnet_ids).toContain(az.SubnetId);
      });
    }, 30000);

    test('Target Group exists with correct health check configuration', async () => {
      const command = new DescribeTargetGroupsCommand({
        Names: ['task-274789-tap-tg']
      });

      const response = await elbv2Client.send(command);
      expect(response.TargetGroups!.length).toBe(1);

      const tg = response.TargetGroups![0];
      expect(tg.TargetGroupName).toBe('task-274789-tap-tg');
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.Port).toBe(80);
      expect(tg.VpcId).toBe(outputs.vpc_id);
      expect(tg.HealthCheckPath).toBe('/');
      expect(tg.HealthCheckProtocol).toBe('HTTP');
      expect(tg.HealthyThresholdCount).toBe(2);
      expect(tg.UnhealthyThresholdCount).toBe(2);
    }, 30000);

    test('HTTPS and HTTP listeners exist with correct configuration', async () => {
      // Get ALB ARN first
      const albCommand = new DescribeLoadBalancersCommand({
        Names: ['task-274789-tap-alb']
      });
      const albResponse = await elbv2Client.send(albCommand);
      const albArn = albResponse.LoadBalancers![0].LoadBalancerArn;

      const listenersCommand = new DescribeListenersCommand({
        LoadBalancerArn: albArn
      });

      const response = await elbv2Client.send(listenersCommand);
      expect(response.Listeners!.length).toBeGreaterThanOrEqual(2);

      // Check HTTPS listener
      const httpsListener = response.Listeners?.find(l => l.Port === 443);
      expect(httpsListener).toBeDefined();
      expect(httpsListener?.Protocol).toBe('HTTPS');
      expect(httpsListener?.Certificates?.length).toBeGreaterThan(0);

      // Check HTTP listener
      const httpListener = response.Listeners?.find(l => l.Port === 80);
      expect(httpListener).toBeDefined();
      expect(httpListener?.Protocol).toBe('HTTP');
      expect(httpListener?.DefaultActions?.[0]?.Type).toBe('redirect');
    }, 30000);
  });

  describe('Auto Scaling Verification', () => {
    test('Auto Scaling Group exists with correct configuration', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.auto_scaling_group_name]
      });

      const response = await autoScalingClient.send(command);
      expect(response.AutoScalingGroups!.length).toBe(1);

      const asg = response.AutoScalingGroups![0];
      expect(asg.AutoScalingGroupName).toBe(outputs.auto_scaling_group_name);
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(6);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.HealthCheckType).toBe('ELB');
      expect(asg.HealthCheckGracePeriod).toBe(300);

      // Verify subnets are private subnets
      asg.VPCZoneIdentifier?.split(',').forEach(subnetId => {
        expect(outputs.private_subnet_ids).toContain(subnetId);
      });

      expect(asg.TargetGroupARNs?.length).toBeGreaterThan(0);
    }, 30000);

    test('Launch Template exists with correct configuration', async () => {
      const command = new DescribeLaunchTemplatesCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: ['*task-274789-tap-launch-template*']
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.LaunchTemplates!.length).toBeGreaterThanOrEqual(1);

      const lt = response.LaunchTemplates![0];
      expect(lt.LaunchTemplateName).toContain('task-274789-tap-lt');
    }, 30000);

    test('Auto Scaling policies exist', async () => {
      const command = new DescribePoliciesCommand({
        AutoScalingGroupName: outputs.auto_scaling_group_name
      });

      const response = await autoScalingClient.send(command);
      expect(response.ScalingPolicies!.length).toBeGreaterThanOrEqual(2);

      const scaleUpPolicy = response.ScalingPolicies?.find(p =>
        p.PolicyName?.includes('scale-up')
      );
      expect(scaleUpPolicy).toBeDefined();
      expect(scaleUpPolicy?.ScalingAdjustment).toBe(1);

      const scaleDownPolicy = response.ScalingPolicies?.find(p =>
        p.PolicyName?.includes('scale-down')
      );
      expect(scaleDownPolicy).toBeDefined();
      expect(scaleDownPolicy?.ScalingAdjustment).toBe(-1);
    }, 30000);
  });

  describe('IAM and Security Verification', () => {
    test('EC2 IAM role exists with correct permissions', async () => {
      const roleCommand = new GetRoleCommand({
        RoleName: 'task-274789-tap-ec2-role'
      });

      const roleResponse = await iamClient.send(roleCommand);
      expect(roleResponse.Role?.RoleName).toBe('task-274789-tap-ec2-role');
      expect(roleResponse.Role?.AssumeRolePolicyDocument).toContain('ec2.amazonaws.com');

      const policyCommand = new GetRolePolicyCommand({
        RoleName: 'task-274789-tap-ec2-role',
        PolicyName: 'task-274789-tap-ec2-policy'
      });

      const policyResponse = await iamClient.send(policyCommand);
      const decodedPolicy = decodeURIComponent(policyResponse.PolicyDocument || '');
      expect(decodedPolicy).toContain('ssm:GetParameter');
      expect(decodedPolicy).toContain('logs:CreateLogGroup');
      expect(decodedPolicy).toContain('logs:PutLogEvents');
    }, 30000);

    test('EC2 instance profile exists', async () => {
      const command = new GetInstanceProfileCommand({
        InstanceProfileName: 'task-274789-tap-ec2-profile'
      });

      const response = await iamClient.send(command);
      expect(response.InstanceProfile?.InstanceProfileName).toBe('task-274789-tap-ec2-profile');
      expect(response.InstanceProfile?.Roles?.length).toBe(1);
      expect(response.InstanceProfile?.Roles?.[0]?.RoleName).toBe('task-274789-tap-ec2-role');
    }, 30000);
  });

  describe('Parameter Store Verification', () => {
    test('database password is stored securely', async () => {
      const command = new GetParameterCommand({
        Name: '/task-274789-tap/database/password',
        WithDecryption: false
      });

      const response = await ssmClient.send(command);
      expect(response.Parameter?.Name).toBe('/task-274789-tap/database/password');
      expect(response.Parameter?.Type).toBe('SecureString');
    }, 30000);

    test('application configuration parameters exist', async () => {
      const parameterNames = [
        '/task-274789-tap/database/host',
        '/task-274789-tap/database/port',
        '/task-274789-tap/database/name',
        '/task-274789-tap/database/username',
        '/task-274789-tap/app/log_level',
        '/task-274789-tap/app/environment'
      ];

      const command = new GetParametersCommand({
        Names: parameterNames
      });

      const response = await ssmClient.send(command);
      expect(response.Parameters?.length).toBe(parameterNames.length);
      expect(response.InvalidParameters?.length).toBe(0);

      // Verify specific parameter values
      const dbHost = response.Parameters?.find(p => p.Name?.includes('/database/host'));
      expect(dbHost?.Value).toContain('task-274789-tap-postgres');

      const dbPort = response.Parameters?.find(p => p.Name?.includes('/database/port'));
      expect(dbPort?.Value).toBe('5432');

      const logLevel = response.Parameters?.find(p => p.Name?.includes('/app/log_level'));
      expect(logLevel?.Value).toBe('INFO');

      const environment = response.Parameters?.find(p => p.Name?.includes('/app/environment'));
      expect(environment?.Value).toBe('production');
    }, 30000);
  });

  describe('Monitoring and Logging Verification', () => {
    test('CloudWatch log group exists', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/ec2/task-274789-tap'
      });

      const response = await cloudWatchLogsClient.send(command);
      expect(response.logGroups!.length).toBeGreaterThanOrEqual(1);

      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe('/aws/ec2/task-274789-tap');
      expect(logGroup.retentionInDays).toBe(14);
    }, 30000);

    test('CloudWatch alarms exist for auto scaling', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'task-274789-tap'
      });

      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms!.length).toBeGreaterThanOrEqual(2);

      const highCpuAlarm = response.MetricAlarms?.find(alarm =>
        alarm.AlarmName?.includes('high-cpu')
      );
      expect(highCpuAlarm).toBeDefined();
      expect(highCpuAlarm?.MetricName).toBe('CPUUtilization');
      expect(highCpuAlarm?.Threshold).toBe(80);

      const lowCpuAlarm = response.MetricAlarms?.find(alarm =>
        alarm.AlarmName?.includes('low-cpu')
      );
      expect(lowCpuAlarm).toBeDefined();
      expect(lowCpuAlarm?.MetricName).toBe('CPUUtilization');
      expect(lowCpuAlarm?.Threshold).toBe(20);
    }, 30000);
  });

  describe('SSL/TLS Certificate Verification', () => {
    test('ACM certificate exists and is valid', async () => {
      const command = new ListCertificatesCommand({
        CertificateStatuses: ['ISSUED', 'PENDING_VALIDATION']
      });

      const response = await acmClient.send(command);
      const certificate = response.CertificateSummaryList?.find(cert =>
        cert.DomainName?.includes('task-274789-tap')
      );

      expect(certificate).toBeDefined();
      expect(certificate?.CertificateArn).toBeDefined();
    }, 30000);
  });

  describe('High Availability Verification', () => {
    test('resources are distributed across multiple AZs', async () => {
      // Check subnet distribution
      const allSubnetIds = [...outputs.public_subnet_ids, ...outputs.private_subnet_ids];
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds
      });

      const subnetResponse = await ec2Client.send(subnetCommand);
      const availabilityZones = new Set(subnetResponse.Subnets?.map(s => s.AvailabilityZone));
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);

      // Check NAT Gateway distribution
      const natCommand = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          }
        ]
      });

      const natResponse = await ec2Client.send(natCommand);
      const natAZs = new Set(natResponse.NatGateways?.map(nat => {
        const subnet = subnetResponse.Subnets?.find(s => s.SubnetId === nat.SubnetId);
        return subnet?.AvailabilityZone;
      }));

      expect(natAZs.size).toBeGreaterThanOrEqual(2);
    }, 30000);

    test('database is configured for high availability', async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: 'task-274789-tap-postgres'
      });

      const response = await rdsClient.send(command);
      const db = response.DBInstances![0];

      expect(db.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(db.PreferredBackupWindow).toBeDefined();
      expect(db.PreferredMaintenanceWindow).toBeDefined();
    }, 30000);
  });

  describe('Cost Optimization Verification', () => {
    test('resources use appropriate instance types', async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: 'task-274789-tap-postgres'
      });

      const response = await rdsClient.send(command);
      const db = response.DBInstances![0];

      // Verify database uses cost-effective instance class
      expect(db.DBInstanceClass).toMatch(/^db\.t3\./);

      // Verify storage configuration
      expect(db.StorageType).toBe('gp2');
      expect(db.AllocatedStorage).toBe(20);
    }, 30000);
  });
});
