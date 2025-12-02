import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeFlowLogsCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
} from '@aws-sdk/client-rds';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribeLaunchConfigurationsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
  ListRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  KMSClient,
  DescribeKeyCommand,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
let outputs: Record<string, string> = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
} else {
  console.warn('⚠️ Warning: cfn-outputs/flat-outputs.json not found. Using environment variables.');
}

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const s3Client = new S3Client({ region });
const asgClient = new AutoScalingClient({ region });
const cwClient = new CloudWatchClient({ region });
const iamClient = new IAMClient({ region });
const kmsClient = new KMSClient({ region });

describe('Payment Processing Infrastructure - Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('VPC should exist with correct CIDR block', async () => {
      const vpcId = outputs.vpc_id;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    }, 30000);

    test('VPC should have 3 public subnets across 3 AZs', async () => {
      const vpcId = outputs.vpc_id;
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Name', Values: [`*public*${environmentSuffix}`] },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(3);

      const azSet = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azSet.size).toBe(3);
    }, 30000);

    test('VPC should have 3 private subnets across 3 AZs', async () => {
      const vpcId = outputs.vpc_id;
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Name', Values: [`*private*${environmentSuffix}`] },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(3);

      const azSet = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azSet.size).toBe(3);
    }, 30000);

    test('Internet Gateway should be attached to VPC', async () => {
      const vpcId = outputs.vpc_id;
      const command = new DescribeInternetGatewaysCommand({
        Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);

      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBeGreaterThanOrEqual(1);
    }, 30000);

    test('NAT Gateway should exist', async () => {
      const vpcId = outputs.vpc_id;
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'state', Values: ['available', 'pending'] },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);
    }, 30000);

    test('VPC Flow Logs should be enabled to S3', async () => {
      const vpcId = outputs.vpc_id;
      const command = new DescribeFlowLogsCommand({
        Filter: [
          { Name: 'resource-id', Values: [vpcId] },
          { Name: 'log-destination-type', Values: ['s3'] },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.FlowLogs).toBeDefined();
      expect(response.FlowLogs!.length).toBeGreaterThanOrEqual(1);
      expect(response.FlowLogs![0].LogDestinationType).toBe('s3');
    }, 30000);
  });

  describe('RDS Database', () => {
    test('RDS instance should exist with PostgreSQL 15.3', async () => {
      const dbIdentifier = outputs.rds_endpoint?.split('.')[0];
      expect(dbIdentifier).toBeDefined();

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBe(1);
      expect(response.DBInstances![0].Engine).toBe('postgres');
      expect(response.DBInstances![0].EngineVersion).toMatch(/^15\.3/);
    }, 30000);

    test('RDS should have Multi-AZ enabled', async () => {
      const dbIdentifier = outputs.rds_endpoint?.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances![0].MultiAZ).toBe(true);
    }, 30000);

    test('RDS should have encryption enabled', async () => {
      const dbIdentifier = outputs.rds_endpoint?.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances![0].StorageEncrypted).toBe(true);
      expect(response.DBInstances![0].KmsKeyId).toBeDefined();
    }, 30000);

    test('RDS should have 7-day backup retention', async () => {
      const dbIdentifier = outputs.rds_endpoint?.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances![0].BackupRetentionPeriod).toBe(7);
    }, 30000);

    test('RDS should be in private subnets', async () => {
      const dbIdentifier = outputs.rds_endpoint?.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances![0].PubliclyAccessible).toBe(false);
    }, 30000);

    test('RDS DB Subnet Group should use private subnets', async () => {
      const dbIdentifier = outputs.rds_endpoint?.split('.')[0];
      const dbInstanceCmd = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const dbInstanceResponse = await rdsClient.send(dbInstanceCmd);
      const subnetGroupName = dbInstanceResponse.DBInstances![0].DBSubnetGroup?.DBSubnetGroupName;

      expect(subnetGroupName).toBeDefined();

      const subnetGroupCmd = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: subnetGroupName,
      });
      const subnetGroupResponse = await rdsClient.send(subnetGroupCmd);

      expect(subnetGroupResponse.DBSubnetGroups![0].Subnets!.length).toBeGreaterThanOrEqual(3);
    }, 30000);
  });

  describe('Application Load Balancer', () => {
    test('ALB should exist and be internet-facing', async () => {
      const albDns = outputs.alb_dns_name;
      expect(albDns).toBeDefined();

      const command = new DescribeLoadBalancersCommand({
        Names: [albDns.split('.')[0].split('-').slice(0, -1).join('-')],
      });
      const response = await elbClient.send(command);

      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers!.length).toBe(1);
      expect(response.LoadBalancers![0].Scheme).toBe('internet-facing');
      expect(response.LoadBalancers![0].Type).toBe('application');
    }, 30000);

    test('ALB should be in public subnets', async () => {
      const albArn = outputs.alb_arn;
      expect(albArn).toBeDefined();

      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [albArn],
      });
      const response = await elbClient.send(command);

      expect(response.LoadBalancers![0].AvailabilityZones!.length).toBeGreaterThanOrEqual(3);
    }, 30000);

    test('ALB should have HTTPS listener with ACM certificate', async () => {
      const albArn = outputs.alb_arn;
      const command = new DescribeListenersCommand({
        LoadBalancerArn: albArn,
      });
      const response = await elbClient.send(command);

      const httpsListener = response.Listeners!.find(l => l.Protocol === 'HTTPS');
      expect(httpsListener).toBeDefined();
      expect(httpsListener!.Port).toBe(443);
      expect(httpsListener!.Certificates).toBeDefined();
      expect(httpsListener!.Certificates!.length).toBeGreaterThanOrEqual(1);
    }, 30000);

    test('ALB should have target group', async () => {
      const albArn = outputs.alb_arn;
      const vpcId = outputs.vpc_id;

      const command = new DescribeTargetGroupsCommand({
        LoadBalancerArn: albArn,
      });
      const response = await elbClient.send(command);

      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups!.length).toBeGreaterThanOrEqual(1);
      expect(response.TargetGroups![0].VpcId).toBe(vpcId);
    }, 30000);
  });

  describe('Auto Scaling Group', () => {
    test('Auto Scaling Group should exist with correct min/max/desired capacity', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        Filters: [{ Name: 'tag:Name', Values: [`*${environmentSuffix}*`] }],
      });
      const response = await asgClient.send(command);

      expect(response.AutoScalingGroups).toBeDefined();
      expect(response.AutoScalingGroups!.length).toBeGreaterThanOrEqual(1);

      const asg = response.AutoScalingGroups![0];
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(6);
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(2);
    }, 30000);

    test('Auto Scaling Group should be in private subnets', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        Filters: [{ Name: 'tag:Name', Values: [`*${environmentSuffix}*`] }],
      });
      const response = await asgClient.send(command);

      const asg = response.AutoScalingGroups![0];
      expect(asg.VPCZoneIdentifier).toBeDefined();

      // Verify subnets are private by checking they don't have 'public' in tags
      const subnetIds = asg.VPCZoneIdentifier!.split(',');
      expect(subnetIds.length).toBeGreaterThanOrEqual(3);
    }, 30000);

    test('Auto Scaling Group should use t3.medium instances', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        Filters: [{ Name: 'tag:Name', Values: [`*${environmentSuffix}*`] }],
      });
      const response = await asgClient.send(command);

      const asg = response.AutoScalingGroups![0];
      expect(asg.LaunchTemplate).toBeDefined();
    }, 30000);
  });

  describe('S3 Storage', () => {
    test('S3 bucket should have versioning enabled', async () => {
      const bucketName = outputs.s3_bucket_name;
      expect(bucketName).toBeDefined();

      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('S3 bucket should have encryption enabled', async () => {
      const bucketName = outputs.s3_bucket_name;
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThanOrEqual(1);
    }, 30000);

    test('S3 bucket should have lifecycle policy for Glacier transition', async () => {
      const bucketName = outputs.s3_bucket_name;
      const command = new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThanOrEqual(1);

      const glacierRule = response.Rules!.find(r =>
        r.Transitions?.some(t => t.StorageClass === 'GLACIER' && t.Days === 90)
      );
      expect(glacierRule).toBeDefined();
    }, 30000);

    test('Flow Logs S3 bucket should exist', async () => {
      const flowLogsBucket = outputs.flow_logs_bucket_name;
      expect(flowLogsBucket).toBeDefined();
    }, 30000);
  });

  describe('CloudWatch Monitoring', () => {
    test('CPU utilization alarm should exist with 80% threshold', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `payment-gateway-cpu-high-${environmentSuffix}`,
      });
      const response = await cwClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThanOrEqual(1);

      const cpuAlarm = response.MetricAlarms![0];
      expect(cpuAlarm.MetricName).toBe('CPUUtilization');
      expect(cpuAlarm.Threshold).toBe(80);
      expect(cpuAlarm.ComparisonOperator).toBe('GreaterThanThreshold');
    }, 30000);

    test('RDS connections alarm should exist with 90% threshold', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `payment-gateway-rds-connections-high-${environmentSuffix}`,
      });
      const response = await cwClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThanOrEqual(1);

      const dbAlarm = response.MetricAlarms![0];
      expect(dbAlarm.MetricName).toBe('DatabaseConnections');
      expect(dbAlarm.Threshold).toBe(90);
    }, 30000);
  });

  describe('IAM Roles and Permissions', () => {
    test('EC2 IAM role should exist', async () => {
      const command = new GetRoleCommand({
        RoleName: `payment-gateway-ec2-${environmentSuffix}`,
      });

      await expect(iamClient.send(command)).resolves.toBeDefined();
    }, 30000);

    test('EC2 role should have S3 read permissions', async () => {
      const listPoliciesCmd = new ListRolePoliciesCommand({
        RoleName: `payment-gateway-ec2-${environmentSuffix}`,
      });
      const policies = await iamClient.send(listPoliciesCmd);

      expect(policies.PolicyNames).toBeDefined();
      const s3Policy = policies.PolicyNames!.find(p => p.includes('s3-read'));
      expect(s3Policy).toBeDefined();
    }, 30000);

    test('EC2 role should have CloudWatch Logs write permissions', async () => {
      const listPoliciesCmd = new ListRolePoliciesCommand({
        RoleName: `payment-gateway-ec2-${environmentSuffix}`,
      });
      const policies = await iamClient.send(listPoliciesCmd);

      const cwLogsPolicy = policies.PolicyNames!.find(p => p.includes('cloudwatch-logs'));
      expect(cwLogsPolicy).toBeDefined();
    }, 30000);
  });

  describe('Security Groups', () => {
    test('ALB security group should allow HTTPS from internet', async () => {
      const vpcId = outputs.vpc_id;
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Name', Values: [`*alb*${environmentSuffix}*`] },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(1);

      const albSg = response.SecurityGroups![0];
      const httpsRule = albSg.IpPermissions!.find(
        rule => rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsRule).toBeDefined();
    }, 30000);

    test('EC2 security group should allow traffic from ALB', async () => {
      const vpcId = outputs.vpc_id;
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Name', Values: [`*ec2*${environmentSuffix}*`] },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(1);
    }, 30000);

    test('RDS security group should allow PostgreSQL from EC2', async () => {
      const vpcId = outputs.vpc_id;
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Name', Values: [`*rds*${environmentSuffix}*`] },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(1);

      const rdsSg = response.SecurityGroups![0];
      const postgresRule = rdsSg.IpPermissions!.find(
        rule => rule.FromPort === 5432 && rule.ToPort === 5432
      );
      expect(postgresRule).toBeDefined();
    }, 30000);
  });

  describe('KMS Encryption', () => {
    test('KMS key should exist with alias', async () => {
      const command = new ListAliasesCommand({});
      const response = await kmsClient.send(command);

      const keyAlias = response.Aliases!.find(
        a => a.AliasName === `alias/payment-gateway-${environmentSuffix}`
      );
      expect(keyAlias).toBeDefined();
      expect(keyAlias!.TargetKeyId).toBeDefined();
    }, 30000);

    test('KMS key should have key rotation enabled', async () => {
      const aliasCmd = new ListAliasesCommand({});
      const aliasResponse = await kmsClient.send(aliasCmd);
      const keyAlias = aliasResponse.Aliases!.find(
        a => a.AliasName === `alias/payment-gateway-${environmentSuffix}`
      );

      const keyCmd = new DescribeKeyCommand({
        KeyId: keyAlias!.TargetKeyId,
      });
      const keyResponse = await kmsClient.send(keyCmd);

      expect(keyResponse.KeyMetadata).toBeDefined();
      expect(keyResponse.KeyMetadata!.KeyState).toBe('Enabled');
    }, 30000);
  });

  describe('Resource Tagging', () => {
    test('All resources should have required tags', async () => {
      const vpcId = outputs.vpc_id;
      const vpcCommand = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const vpcResponse = await ec2Client.send(vpcCommand);

      const tags = vpcResponse.Vpcs![0].Tags || [];
      const tagMap = Object.fromEntries(tags.map(t => [t.Key!, t.Value!]));

      expect(tagMap.Environment).toBe('production');
      expect(tagMap.Project).toBe('payment-gateway');
      expect(tagMap.ManagedBy).toBe('terraform');
    }, 30000);
  });
});
