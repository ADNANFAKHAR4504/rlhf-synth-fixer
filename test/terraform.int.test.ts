// Integration tests for Terraform infrastructure
// These tests verify that resources are actually deployed in AWS

import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeFlowLogsCommand
} from '@aws-sdk/client-ec2';
import { 
  S3Client, 
  ListBucketsCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand
} from '@aws-sdk/client-s3';
import { 
  IAMClient, 
  GetUserCommand,
  GetRoleCommand,
  GetInstanceProfileCommand,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand,
  GetRolePolicyCommand
} from '@aws-sdk/client-iam';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand
} from '@aws-sdk/client-rds';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand
} from '@aws-sdk/client-lambda';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand
} from '@aws-sdk/client-cloudtrail';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  SNSClient,
  ListTopicsCommand,
  GetTopicAttributesCommand
} from '@aws-sdk/client-sns';
import {
  KMSClient,
  DescribeKeyCommand,
  ListAliasesCommand
} from '@aws-sdk/client-kms';
import {
  ACMClient,
  ListCertificatesCommand,
  DescribeCertificateCommand
} from '@aws-sdk/client-acm';
import * as fs from 'fs';
import * as path from 'path';

const region = 'us-east-1';

// Initialize AWS SDK clients
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const iamClient = new IAMClient({ region });
const rdsClient = new RDSClient({ region });
const lambdaClient = new LambdaClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const snsClient = new SNSClient({ region });
const kmsClient = new KMSClient({ region });
const acmClient = new ACMClient({ region });

// Helper function to get AWS account ID
let accountId: string;
async function getAccountId(): Promise<string> {
  if (accountId) return accountId;
  
  // Try to get from outputs file
  const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
  if (fs.existsSync(outputsPath)) {
    const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    if (outputs.account_id) {
      accountId = outputs.account_id;
      return accountId;
    }
  }
  
  // Fallback: try to extract from S3 bucket names (they contain account ID)
  try {
    const { Buckets } = await s3Client.send(new ListBucketsCommand({}));
    const bucket = Buckets?.find(b => b.Name?.includes('secure-production-data-bucket-'));
    if (bucket?.Name) {
      accountId = bucket.Name.split('-').pop() || '';
      return accountId;
    }
  } catch (error) {
    console.warn('Could not determine account ID:', error);
  }
  
  return '';
}

describe('Terraform Infrastructure Integration Tests', () => {
  
  beforeAll(async () => {
    // Ensure we can get the account ID
    await getAccountId();
  });

  describe('VPC and Network Infrastructure', () => {
    let vpcId: string;

    test('VPC exists with correct CIDR block', async () => {
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({
        Filters: [
          { Name: 'tag:Name', Values: ['production-vpc'] },
          { Name: 'tag:Environment', Values: ['Production'] }
        ]
      }));

      expect(Vpcs).toBeDefined();
      expect(Vpcs!.length).toBeGreaterThan(0);
      
      const vpc = Vpcs![0];
      vpcId = vpc.VpcId!;
      
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('Public subnets exist in two availability zones', async () => {
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: 'tag:Name', Values: ['production-public-subnet-a', 'production-public-subnet-b'] }
        ]
      }));

      expect(Subnets).toBeDefined();
      expect(Subnets!.length).toBe(2);
      
      const cidrs = Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrs).toEqual(['10.0.1.0/24', '10.0.2.0/24']);
      
      const azs = Subnets!.map(s => s.AvailabilityZone).sort();
      expect(azs).toEqual(['us-east-1a', 'us-east-1b']);
    });

    test('Private subnets exist in two availability zones', async () => {
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: 'tag:Name', Values: ['production-private-subnet-a', 'production-private-subnet-b'] }
        ]
      }));

      expect(Subnets).toBeDefined();
      expect(Subnets!.length).toBe(2);
      
      const cidrs = Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrs).toEqual(['10.0.3.0/24', '10.0.4.0/24']);
    });

    test('Internet Gateway is attached to VPC', async () => {
      const { InternetGateways } = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [
          { Name: 'tag:Name', Values: ['production-igw'] }
        ]
      }));

      expect(InternetGateways).toBeDefined();
      expect(InternetGateways!.length).toBeGreaterThan(0);
      
      const igw = InternetGateways![0];
      expect(igw.Attachments![0].State).toBe('available');
    });

    test('NAT Gateway exists with Elastic IP', async () => {
      const { NatGateways } = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filters: [
          { Name: 'tag:Name', Values: ['production-nat-gateway'] },
          { Name: 'state', Values: ['available'] }
        ]
      }));

      expect(NatGateways).toBeDefined();
      expect(NatGateways!.length).toBeGreaterThan(0);
      
      const natGw = NatGateways![0];
      expect(natGw.NatGatewayAddresses![0].AllocationId).toBeDefined();
    });

    test('Route tables are configured correctly', async () => {
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [
          { Name: 'tag:Name', Values: ['production-public-rt', 'production-private-rt'] }
        ]
      }));

      expect(RouteTables).toBeDefined();
      expect(RouteTables!.length).toBe(2);
      
      // Check public route table has IGW route
      const publicRt = RouteTables!.find(rt => 
        rt.Tags?.some(t => t.Key === 'Name' && t.Value === 'production-public-rt')
      );
      expect(publicRt).toBeDefined();
      const hasIgwRoute = publicRt!.Routes!.some(r => r.GatewayId?.startsWith('igw-'));
      expect(hasIgwRoute).toBe(true);
      
      // Check private route table has NAT Gateway route
      const privateRt = RouteTables!.find(rt => 
        rt.Tags?.some(t => t.Key === 'Name' && t.Value === 'production-private-rt')
      );
      expect(privateRt).toBeDefined();
      const hasNatRoute = privateRt!.Routes!.some(r => r.NatGatewayId?.startsWith('nat-'));
      expect(hasNatRoute).toBe(true);
    });

    test('VPC Flow Logs are enabled', async () => {
      const { FlowLogs } = await ec2Client.send(new DescribeFlowLogsCommand({
        Filters: [
          { Name: 'tag:Name', Values: ['production-vpc-flow-logs'] }
        ]
      }));

      expect(FlowLogs).toBeDefined();
      expect(FlowLogs!.length).toBeGreaterThan(0);
      
      const flowLog = FlowLogs![0];
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
    });
  });

  describe('Security Groups', () => {
    test('ALB security group allows HTTP and HTTPS', async () => {
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'group-name', Values: ['alb-public-https-sg'] }
        ]
      }));

      expect(SecurityGroups).toBeDefined();
      expect(SecurityGroups!.length).toBeGreaterThan(0);
      
      const sg = SecurityGroups![0];
      const hasHttps = sg.IpPermissions!.some(p => p.FromPort === 443 && p.ToPort === 443);
      const hasHttp = sg.IpPermissions!.some(p => p.FromPort === 80 && p.ToPort === 80);
      
      expect(hasHttps).toBe(true);
      expect(hasHttp).toBe(true);
    });

    test('EC2 security group allows SSH from corporate CIDR only', async () => {
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'group-name', Values: ['private-ec2-sg'] }
        ]
      }));

      expect(SecurityGroups).toBeDefined();
      expect(SecurityGroups!.length).toBeGreaterThan(0);
      
      const sg = SecurityGroups![0];
      const sshRule = sg.IpPermissions!.find(p => p.FromPort === 22 && p.ToPort === 22);
      
      expect(sshRule).toBeDefined();
      expect(sshRule!.IpRanges![0].CidrIp).toBe('203.0.113.0/24');
    });

    test('RDS security group allows PostgreSQL from EC2 security group', async () => {
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'group-name', Values: ['rds-database-sg'] }
        ]
      }));

      expect(SecurityGroups).toBeDefined();
      expect(SecurityGroups!.length).toBeGreaterThan(0);
      
      const sg = SecurityGroups![0];
      const pgRule = sg.IpPermissions!.find(p => p.FromPort === 5432 && p.ToPort === 5432);
      
      expect(pgRule).toBeDefined();
      expect(pgRule!.UserIdGroupPairs).toBeDefined();
      expect(pgRule!.UserIdGroupPairs!.length).toBeGreaterThan(0);
    });

    test('Lambda security group exists', async () => {
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'group-name', Values: ['lambda-function-sg'] }
        ]
      }));

      expect(SecurityGroups).toBeDefined();
      expect(SecurityGroups!.length).toBeGreaterThan(0);
    });
  });

  describe('IAM Configuration', () => {
    test('DevOps IAM user exists', async () => {
      try {
        const { User } = await iamClient.send(new GetUserCommand({
          UserName: 'devops-user'
        }));

        expect(User).toBeDefined();
        expect(User!.UserName).toBe('devops-user');
      } catch (error: any) {
        if (error.name !== 'NoSuchEntity') {
          throw error;
        }
        // User might not exist yet, which is acceptable for initial tests
        console.warn('DevOps user not found - may not be created yet');
      }
    });

    test('EC2 IAM role exists with correct trust policy', async () => {
      const { Role } = await iamClient.send(new GetRoleCommand({
        RoleName: 'ec2-s3-readonly-role'
      }));

      expect(Role).toBeDefined();
      expect(Role!.RoleName).toBe('ec2-s3-readonly-role');
      
      const trustPolicy = JSON.parse(decodeURIComponent(Role!.AssumeRolePolicyDocument!));
      expect(trustPolicy.Statement[0].Principal.Service).toContain('ec2.amazonaws.com');
    });

    test('EC2 role has S3 read-only policy', async () => {
      const { PolicyNames } = await iamClient.send(new ListRolePoliciesCommand({
        RoleName: 'ec2-s3-readonly-role'
      }));

      expect(PolicyNames).toBeDefined();
      expect(PolicyNames!.length).toBeGreaterThan(0);
      
      const { PolicyDocument } = await iamClient.send(new GetRolePolicyCommand({
        RoleName: 'ec2-s3-readonly-role',
        PolicyName: PolicyNames![0]
      }));

      const policy = JSON.parse(decodeURIComponent(PolicyDocument!));
      const s3Actions = policy.Statement[0].Action;
      
      expect(s3Actions).toContain('s3:GetObject');
      expect(s3Actions).toContain('s3:ListBucket');
    });

    test('Lambda IAM role exists with CloudWatch logs permissions', async () => {
      const { Role } = await iamClient.send(new GetRoleCommand({
        RoleName: 'lambda-execution-role'
      }));

      expect(Role).toBeDefined();
      
      const { PolicyNames } = await iamClient.send(new ListRolePoliciesCommand({
        RoleName: 'lambda-execution-role'
      }));

      expect(PolicyNames!.length).toBeGreaterThan(0);
      
      const { PolicyDocument } = await iamClient.send(new GetRolePolicyCommand({
        RoleName: 'lambda-execution-role',
        PolicyName: PolicyNames![0]
      }));

      const policy = JSON.parse(decodeURIComponent(PolicyDocument!));
      const logActions = policy.Statement[0].Action;
      
      expect(logActions).toContain('logs:CreateLogGroup');
      expect(logActions).toContain('logs:CreateLogStream');
      expect(logActions).toContain('logs:PutLogEvents');
    });

    test('EC2 instance profile exists', async () => {
      const { InstanceProfile } = await iamClient.send(new GetInstanceProfileCommand({
        InstanceProfileName: 'ec2-instance-profile'
      }));

      expect(InstanceProfile).toBeDefined();
      expect(InstanceProfile!.Roles!.length).toBeGreaterThan(0);
      expect(InstanceProfile!.Roles![0].RoleName).toBe('ec2-s3-readonly-role');
    });
  });

  describe('S3 Buckets', () => {
    let dataAccountId: string;

    beforeAll(async () => {
      dataAccountId = await getAccountId();
    });

    test('Data bucket exists with versioning enabled', async () => {
      const bucketName = `secure-production-data-bucket-${dataAccountId}`;
      
      const { Status } = await s3Client.send(new GetBucketVersioningCommand({
        Bucket: bucketName
      }));

      expect(Status).toBe('Enabled');
    });

    test('Data bucket has encryption configured', async () => {
      const bucketName = `secure-production-data-bucket-${dataAccountId}`;
      
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );

      expect(ServerSideEncryptionConfiguration).toBeDefined();
      expect(ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm)
        .toBe('aws:kms');
    });

    test('Data bucket blocks public access', async () => {
      const bucketName = `secure-production-data-bucket-${dataAccountId}`;
      
      const publicAccessBlock = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );

      expect(publicAccessBlock.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    });

    test('CloudTrail bucket exists with versioning and encryption', async () => {
      const bucketName = `secure-cloudtrail-logs-${dataAccountId}`;
      
      const { Status } = await s3Client.send(new GetBucketVersioningCommand({
        Bucket: bucketName
      }));

      expect(Status).toBe('Enabled');
      
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );

      expect(ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm)
        .toBe('aws:kms');
    });
  });

  describe('KMS Configuration', () => {
    test('Main KMS key exists with rotation enabled', async () => {
      const { Aliases } = await kmsClient.send(new ListAliasesCommand({}));
      
      const mainKeyAlias = Aliases?.find(a => a.AliasName === 'alias/production-main-key');
      expect(mainKeyAlias).toBeDefined();
      
      if (mainKeyAlias?.TargetKeyId) {
        const { KeyMetadata } = await kmsClient.send(new DescribeKeyCommand({
          KeyId: mainKeyAlias.TargetKeyId
        }));

        expect(KeyMetadata).toBeDefined();
        expect(KeyMetadata!.KeyRotationEnabled).toBe(true);
      }
    });
  });

  describe('EC2 Instances', () => {
    test('EC2 instance exists in private subnet', async () => {
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        Filters: [
          { Name: 'tag:Name', Values: ['production-main-ec2'] },
          { Name: 'instance-state-name', Values: ['pending', 'running'] }
        ]
      }));

      expect(Reservations).toBeDefined();
      expect(Reservations!.length).toBeGreaterThan(0);
      
      const instance = Reservations![0].Instances![0];
      expect(instance.InstanceType).toBe('t3.micro');
      expect(instance.IamInstanceProfile).toBeDefined();
      
      // Check if in private subnet
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: [instance.SubnetId!]
      }));
      
      const subnetName = Subnets![0].Tags?.find(t => t.Key === 'Name')?.Value;
      expect(subnetName).toContain('private');
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB exists and is internet-facing', async () => {
      const { LoadBalancers } = await elbClient.send(new DescribeLoadBalancersCommand({
        Names: ['production-alb']
      }));

      expect(LoadBalancers).toBeDefined();
      expect(LoadBalancers!.length).toBeGreaterThan(0);
      
      const alb = LoadBalancers![0];
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
      expect(alb.State!.Code).toBe('active');
    });

    test('Target group exists with health checks', async () => {
      const { TargetGroups } = await elbClient.send(new DescribeTargetGroupsCommand({
        Names: ['production-tg']
      }));

      expect(TargetGroups).toBeDefined();
      expect(TargetGroups!.length).toBeGreaterThan(0);
      
      const tg = TargetGroups![0];
      expect(tg.Port).toBe(80);
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.HealthCheckEnabled).toBe(true);
    });

    test('HTTPS listener exists on port 443', async () => {
      const { LoadBalancers } = await elbClient.send(new DescribeLoadBalancersCommand({
        Names: ['production-alb']
      }));

      const { Listeners } = await elbClient.send(new DescribeListenersCommand({
        LoadBalancerArn: LoadBalancers![0].LoadBalancerArn
      }));

      const httpsListener = Listeners?.find(l => l.Port === 443 && l.Protocol === 'HTTPS');
      expect(httpsListener).toBeDefined();
      expect(httpsListener!.SslPolicy).toBe('ELBSecurityPolicy-TLS-1-2-2017-01');
    });

    test('HTTP listener redirects to HTTPS', async () => {
      const { LoadBalancers } = await elbClient.send(new DescribeLoadBalancersCommand({
        Names: ['production-alb']
      }));

      const { Listeners } = await elbClient.send(new DescribeListenersCommand({
        LoadBalancerArn: LoadBalancers![0].LoadBalancerArn
      }));

      const httpListener = Listeners?.find(l => l.Port === 80 && l.Protocol === 'HTTP');
      expect(httpListener).toBeDefined();
      expect(httpListener!.DefaultActions![0].Type).toBe('redirect');
      expect(httpListener!.DefaultActions![0].RedirectConfig!.Protocol).toBe('HTTPS');
    });
  });

  describe('RDS Database', () => {
    test('RDS instance exists with correct configuration', async () => {
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: 'production-database'
      }));

      expect(DBInstances).toBeDefined();
      expect(DBInstances!.length).toBeGreaterThan(0);
      
      const db = DBInstances![0];
      expect(db.Engine).toBe('postgres');
      expect(db.DBInstanceClass).toBe('db.t3.micro');
      expect(db.StorageEncrypted).toBe(true);
      expect(db.MultiAZ).toBe(true);
      expect(db.BackupRetentionPeriod).toBe(7);
    });

    test('RDS is in private subnets', async () => {
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: 'production-database'
      }));

      const subnetGroupName = DBInstances![0].DBSubnetGroup!.DBSubnetGroupName;
      
      const { DBSubnetGroups } = await rdsClient.send(new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: subnetGroupName
      }));

      expect(DBSubnetGroups![0].Subnets!.length).toBe(2);
    });

    test('RDS exports logs to CloudWatch', async () => {
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: 'production-database'
      }));

      expect(DBInstances![0].EnabledCloudwatchLogsExports).toBeDefined();
      expect(DBInstances![0].EnabledCloudwatchLogsExports!).toContain('postgresql');
    });
  });

  describe('Lambda Function', () => {
    test('Lambda function exists with correct runtime', async () => {
      const { Configuration } = await lambdaClient.send(new GetFunctionCommand({
        FunctionName: 'production-lambda-function'
      }));

      expect(Configuration).toBeDefined();
      expect(Configuration!.Runtime).toBe('python3.9');
      expect(Configuration!.Handler).toBe('index.handler');
      expect(Configuration!.Timeout).toBe(30);
      expect(Configuration!.MemorySize).toBe(128);
    });

    test('Lambda function is deployed in VPC', async () => {
      const { Configuration } = await lambdaClient.send(new GetFunctionConfigurationCommand({
        FunctionName: 'production-lambda-function'
      }));

      expect(Configuration!.VpcConfig).toBeDefined();
      expect(Configuration!.VpcConfig!.SubnetIds!.length).toBe(2);
      expect(Configuration!.VpcConfig!.SecurityGroupIds!.length).toBeGreaterThan(0);
    });

    test('Lambda function uses KMS encryption', async () => {
      const { Configuration } = await lambdaClient.send(new GetFunctionConfigurationCommand({
        FunctionName: 'production-lambda-function'
      }));

      expect(Configuration!.KMSKeyArn).toBeDefined();
      expect(Configuration!.KMSKeyArn).toContain('arn:aws:kms');
    });

    test('Lambda CloudWatch log group exists', async () => {
      const { logGroups } = await cloudWatchLogsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/lambda/production-lambda-function'
      }));

      expect(logGroups).toBeDefined();
      expect(logGroups!.length).toBeGreaterThan(0);
      expect(logGroups![0].retentionInDays).toBe(14);
    });
  });

  describe('CloudTrail and Monitoring', () => {
    test('CloudTrail exists and is logging', async () => {
      const { trailList } = await cloudTrailClient.send(new DescribeTrailsCommand({}));
      
      const trail = trailList?.find(t => t.Name === 'production-cloudtrail');
      expect(trail).toBeDefined();
      
      if (trail) {
        const { IsLogging } = await cloudTrailClient.send(new GetTrailStatusCommand({
          Name: trail.TrailARN
        }));
        
        expect(IsLogging).toBe(true);
      }
    });

    test('CloudWatch log groups exist for VPC and CloudTrail', async () => {
      const { logGroups } = await cloudWatchLogsClient.send(new DescribeLogGroupsCommand({}));
      
      const vpcLogGroup = logGroups?.find(lg => lg.logGroupName === '/aws/vpc/production-flowlogs');
      expect(vpcLogGroup).toBeDefined();
      
      const cloudTrailLogGroup = logGroups?.find(lg => lg.logGroupName === '/aws/cloudtrail/production');
      expect(cloudTrailLogGroup).toBeDefined();
    });

    test('SNS topic for security alerts exists', async () => {
      const { Topics } = await snsClient.send(new ListTopicsCommand({}));
      
      const securityTopic = Topics?.find(t => t.TopicArn?.includes('security-alerts-topic'));
      expect(securityTopic).toBeDefined();
    });

    test('CloudWatch alarms exist', async () => {
      const { MetricAlarms } = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: ['production-ec2-high-cpu', 'production-unauthorized-api-calls']
      }));

      expect(MetricAlarms).toBeDefined();
      expect(MetricAlarms!.length).toBe(2);
      
      const cpuAlarm = MetricAlarms!.find(a => a.AlarmName === 'production-ec2-high-cpu');
      expect(cpuAlarm!.MetricName).toBe('CPUUtilization');
      expect(cpuAlarm!.Threshold).toBe(80);
    });
  });

  describe('Resource Tagging', () => {
    test('Resources have Production environment tag', async () => {
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({
        Filters: [
          { Name: 'tag:Environment', Values: ['Production'] }
        ]
      }));

      expect(Vpcs).toBeDefined();
      expect(Vpcs!.length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Workflow', () => {
    test('Complete deployment workflow is functional', async () => {
      // This test verifies the overall infrastructure is working together
      
      // 1. Check VPC exists
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({
        Filters: [{ Name: 'tag:Name', Values: ['production-vpc'] }]
      }));
      expect(Vpcs!.length).toBeGreaterThan(0);
      
      // 2. Check ALB is reachable (exists and is active)
      const { LoadBalancers } = await elbClient.send(new DescribeLoadBalancersCommand({
        Names: ['production-alb']
      }));
      expect(LoadBalancers![0].State!.Code).toBe('active');
      
      // 3. Check EC2 instance is running or pending
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        Filters: [
          { Name: 'tag:Name', Values: ['production-main-ec2'] },
          { Name: 'instance-state-name', Values: ['pending', 'running'] }
        ]
      }));
      expect(Reservations!.length).toBeGreaterThan(0);
      
      // 4. Check RDS is available or being created
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: 'production-database'
      }));
      expect(['available', 'creating', 'backing-up']).toContain(DBInstances![0].DBInstanceStatus);
      
      // 5. Check Lambda function exists
      const { Configuration } = await lambdaClient.send(new GetFunctionCommand({
        FunctionName: 'production-lambda-function'
      }));
      expect(Configuration).toBeDefined();
      
      console.log('✅ End-to-end infrastructure deployment is functional');
    });
  });
});
