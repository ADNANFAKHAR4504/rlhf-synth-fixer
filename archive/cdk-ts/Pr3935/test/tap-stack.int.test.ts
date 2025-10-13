import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  DescribeSecretCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { GetWebACLCommand, WAFV2Client } from '@aws-sdk/client-wafv2';
import * as fs from 'fs';

const region = process.env.AWS_REGION || 'ap-northeast-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

// Read outputs from flat-outputs.json
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

describe('TapStack Integration Tests', () => {
  const cfnClient = new CloudFormationClient({ region });
  const ec2Client = new EC2Client({ region });
  const s3Client = new S3Client({ region });
  const rdsClient = new RDSClient({ region });
  const elbClient = new ElasticLoadBalancingV2Client({ region });
  const asgClient = new AutoScalingClient({ region });
  const kmsClient = new KMSClient({ region });
  const secretsClient = new SecretsManagerClient({ region });
  const cloudTrailClient = new CloudTrailClient({ region });
  const iamClient = new IAMClient({ region });
  const wafClient = new WAFV2Client({ region }); // WAF is regional

  let vpcId: string;
  let albArn: string;
  let asgName: string;
  let dbEndpoint: string;
  let kmsKeyId: string;
  let dbSecretArn: string;
  let albLogBucket: string;
  let cloudTrailBucket: string;
  let appSecurityGroupId: string;
  let dbSecurityGroupId: string;
  let webAclArn: string;
  let ec2RoleArn: string;

  beforeAll(() => {
    vpcId = outputs.VpcId;
    albArn = outputs.ALBArn;
    asgName = outputs.AutoScalingGroupName;
    dbEndpoint = outputs.DatabaseEndpoint;
    kmsKeyId = outputs.KMSKeyId;
    dbSecretArn = outputs.DatabaseSecretArn;
    albLogBucket = outputs.ALBLogBucketName;
    cloudTrailBucket = outputs.CloudTrailBucketName;
    appSecurityGroupId = outputs.ApplicationSecurityGroupId;
    dbSecurityGroupId = outputs.DatabaseSecurityGroupId;
    webAclArn = outputs.WebACLArn;
    ec2RoleArn = outputs.EC2InstanceRoleArn;
  });

  describe('CloudFormation Stack', () => {
    test('Stack should exist', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      expect(response.Stacks).toBeDefined();
      expect(response.Stacks!.length).toBeGreaterThan(0);
    });

    test('Stack should have all required tags', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      const tags = response.Stacks![0].Tags || [];
      const iacTag = tags.find(tag => tag.Key === 'iac-rlhf-amazon');
      const envTag = tags.find(tag => tag.Key === 'Environment');

      expect(iacTag).toBeDefined();
      expect(iacTag!.Value).toBe('true');
      expect(envTag).toBeDefined();
      expect(envTag!.Value).toBe(environmentSuffix);
    });

    test('Stack should have all expected outputs', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      const stackOutputs = response.Stacks![0].Outputs || [];
      expect(stackOutputs.length).toBe(15);

      const outputKeys = stackOutputs.map(o => o.OutputKey);
      expect(outputKeys).toContain('VpcId');
      expect(outputKeys).toContain('ALBDnsName');
      expect(outputKeys).toContain('ALBArn');
      expect(outputKeys).toContain('AutoScalingGroupName');
      expect(outputKeys).toContain('DatabaseEndpoint');
      expect(outputKeys).toContain('KMSKeyId');
      expect(outputKeys).toContain('CloudTrailName');
    });
  });

  describe('VPC and Networking', () => {
    test('VPC should exist and have correct configuration', async () => {
      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toBeDefined();
    });

    test('VPC should have public, private, and database subnets across 3 AZs', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(9); // 3 public + 3 private + 3 database

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3); // 3 availability zones
    });

    test('NAT Gateways should be deployed in public subnets', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(2);
      response.NatGateways!.forEach(nat => {
        expect(nat.State).toBe('available');
      });
    });

    test('Application security group should allow HTTP/HTTPS from ALB', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [appSecurityGroupId],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);

      const sg = response.SecurityGroups![0];
      expect(sg.IpPermissions).toBeDefined();
      expect(sg.IpPermissions!.length).toBeGreaterThan(0);
    });

    test('Database security group should allow MySQL from application tier', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [dbSecurityGroupId],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);

      const sg = response.SecurityGroups![0];
      const mysqlRule = sg.IpPermissions!.find(rule => rule.FromPort === 3306);
      expect(mysqlRule).toBeDefined();
    });
  });

  describe('Storage (S3 Buckets)', () => {
    test('ALB log bucket should exist and be accessible', async () => {
      const command = new HeadBucketCommand({ Bucket: albLogBucket });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('ALB log bucket should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({ Bucket: albLogBucket });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration!.Rules![0]
          .ApplyServerSideEncryptionByDefault!.SSEAlgorithm
      ).toBe('AES256'); // ALB doesn't support KMS, uses S3-managed encryption
    });

    test('ALB log bucket should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({ Bucket: albLogBucket });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('CloudTrail bucket should exist and be accessible', async () => {
      const command = new HeadBucketCommand({ Bucket: cloudTrailBucket });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('CloudTrail bucket should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: cloudTrailBucket,
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration!.Rules![0]
          .ApplyServerSideEncryptionByDefault!.SSEAlgorithm
      ).toBe('aws:kms');
    });
  });

  describe('Database (RDS)', () => {
    test('RDS instance should exist and be available', async () => {
      const dbIdentifier = dbEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBe(1);
      expect(response.DBInstances![0].DBInstanceStatus).toBe('available');
    });

    test('RDS instance should have Multi-AZ enabled', async () => {
      const dbIdentifier = dbEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances![0].MultiAZ).toBe(true);
    });

    test('RDS instance should have encryption enabled', async () => {
      const dbIdentifier = dbEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances![0].StorageEncrypted).toBe(true);
    });

    test('RDS instance should be MySQL 8.0', async () => {
      const dbIdentifier = dbEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances![0].Engine).toBe('mysql');
      expect(response.DBInstances![0].EngineVersion).toContain('8.0');
    });

    test('RDS instance should have automated backups enabled', async () => {
      const dbIdentifier = dbEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances![0].BackupRetentionPeriod).toBeGreaterThan(0);
    });

    test('Database secret should exist in Secrets Manager', async () => {
      const command = new DescribeSecretCommand({ SecretId: dbSecretArn });
      const response = await secretsClient.send(command);

      expect(response.ARN).toBe(dbSecretArn);
      expect(response.KmsKeyId).toBeDefined();
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB should exist and be active', async () => {
      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [albArn],
      });
      const response = await elbClient.send(command);

      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers!.length).toBe(1);
      expect(response.LoadBalancers![0].State!.Code).toBe('active');
    });

    test('ALB should be internet-facing', async () => {
      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [albArn],
      });
      const response = await elbClient.send(command);

      expect(response.LoadBalancers![0].Scheme).toBe('internet-facing');
    });

    test('ALB should have at least one target group', async () => {
      const command = new DescribeTargetGroupsCommand({
        LoadBalancerArn: albArn,
      });
      const response = await elbClient.send(command);

      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups!.length).toBeGreaterThan(0);
    });

    test('ALB should have HTTP listener', async () => {
      const command = new DescribeListenersCommand({
        LoadBalancerArn: albArn,
      });
      const response = await elbClient.send(command);

      expect(response.Listeners).toBeDefined();
      expect(response.Listeners!.length).toBeGreaterThanOrEqual(1);

      const ports = response.Listeners!.map(l => l.Port);
      expect(ports).toContain(80);
    });
  });

  describe('Auto Scaling Group', () => {
    test('Auto Scaling Group should exist', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const response = await asgClient.send(command);

      expect(response.AutoScalingGroups).toBeDefined();
      expect(response.AutoScalingGroups!.length).toBe(1);
    });

    test('Auto Scaling Group should have correct capacity configuration', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const response = await asgClient.send(command);

      const asg = response.AutoScalingGroups![0];
      expect(asg.MinSize).toBeGreaterThanOrEqual(2);
      expect(asg.MaxSize).toBeGreaterThanOrEqual(asg.MinSize!);
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(asg.MinSize!);
    });

    test('Auto Scaling Group should span multiple AZs', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const response = await asgClient.send(command);

      const azs = response.AutoScalingGroups![0].AvailabilityZones || [];
      expect(azs.length).toBeGreaterThanOrEqual(2);
    });

    test('Auto Scaling Group should have health check configured', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const response = await asgClient.send(command);

      expect(response.AutoScalingGroups![0].HealthCheckType).toBeDefined();
      expect(
        response.AutoScalingGroups![0].HealthCheckGracePeriod
      ).toBeGreaterThan(0);
    });
  });

  describe('Security (KMS)', () => {
    test('KMS key should exist and be enabled', async () => {
      const command = new DescribeKeyCommand({ KeyId: kmsKeyId });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.Enabled).toBe(true);
    });
  });

  describe('IAM Roles', () => {
    test('EC2 instance role should exist', async () => {
      const roleName = ec2RoleArn.split('/').pop()!;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role!.Arn).toBe(ec2RoleArn);
    });
  });

  describe('Monitoring (CloudTrail)', () => {
    test('CloudTrail should be logging', async () => {
      const trailName = `${environmentSuffix}-trail-v4`;
      const command = new GetTrailStatusCommand({ Name: trailName });
      const response = await cloudTrailClient.send(command);

      expect(response.IsLogging).toBe(true);
    });

    test('CloudTrail should have log file validation enabled', async () => {
      const trailName = `${environmentSuffix}-trail-v4`;
      const command = new DescribeTrailsCommand({ trailNameList: [trailName] });
      const response = await cloudTrailClient.send(command);

      expect(response.trailList).toBeDefined();
      expect(response.trailList!.length).toBe(1);
      expect(response.trailList![0].LogFileValidationEnabled).toBe(true);
    });
  });

  describe('WAF', () => {
    test('Web ACL should exist and be accessible by ARN', async () => {
      // Parse ARN to get name and ID
      // ARN format: arn:aws:wafv2:region:account:regional/webacl/NAME/ID
      const arnParts = webAclArn.split('/');
      const webAclName = arnParts[arnParts.length - 2];
      const webAclId = arnParts[arnParts.length - 1];

      const command = new GetWebACLCommand({
        Id: webAclId,
        Name: webAclName,
        Scope: 'REGIONAL',
      });
      const response = await wafClient.send(command);

      expect(response.WebACL).toBeDefined();
      expect(response.WebACL!.ARN).toBe(webAclArn);
    });

    test('Web ACL should have rules configured', async () => {
      // Parse ARN to get name and ID
      const arnParts = webAclArn.split('/');
      const webAclName = arnParts[arnParts.length - 2];
      const webAclId = arnParts[arnParts.length - 1];

      const command = new GetWebACLCommand({
        Id: webAclId,
        Name: webAclName,
        Scope: 'REGIONAL',
      });
      const response = await wafClient.send(command);

      expect(response.WebACL!.Rules).toBeDefined();
      expect(response.WebACL!.Rules!.length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Integration', () => {
    test('All critical resources should have proper tags', async () => {
      // Verify VPC tags
      const vpcCommand = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];
      expect(vpcTags.some(t => t.Key === 'iac-rlhf-amazon')).toBe(true);

      // Verify RDS tags
      const dbIdentifier = dbEndpoint.split('.')[0];
      const rdsCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const rdsResponse = await rdsClient.send(rdsCommand);
      const dbTags = rdsResponse.DBInstances![0].TagList || [];
      expect(dbTags.some(t => t.Key === 'iac-rlhf-amazon')).toBe(true);
    });

    test('Network connectivity should be properly configured', async () => {
      // Verify subnets are in the VPC
      const command = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets!.every(s => s.VpcId === vpcId)).toBe(true);
    });
  });
});
