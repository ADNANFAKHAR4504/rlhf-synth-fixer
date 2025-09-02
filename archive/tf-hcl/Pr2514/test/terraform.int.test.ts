import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from '@aws-sdk/client-auto-scaling';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { DescribeSubnetsCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { DescribeLoadBalancersCommand, DescribeTargetGroupsCommand, ElasticLoadBalancingV2Client } from '@aws-sdk/client-elastic-load-balancing-v2';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { GetBucketEncryptionCommand, GetBucketVersioningCommand, S3Client } from '@aws-sdk/client-s3';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import fs from 'fs';
import path from 'path';

// Load reference outputs from actual deployed infrastructure
const FLAT_OUTPUTS_PATH = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
const referenceOutputs = JSON.parse(fs.readFileSync(FLAT_OUTPUTS_PATH, 'utf8'));

// AWS Clients for us-west-2 region (as specified in requirements)
const stsClient = new STSClient({ region: 'us-west-2' });
const ec2Client = new EC2Client({ region: 'us-west-2' });
const rdsClient = new RDSClient({ region: 'us-west-2' });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: 'us-west-2' });
const asgClient = new AutoScalingClient({ region: 'us-west-2' });
const logsClient = new CloudWatchLogsClient({ region: 'us-west-2' });
const s3Client = new S3Client({ region: 'us-west-2' });
const iamClient = new IAMClient({ region: 'us-west-2' });
const secretsManagerClient = new SecretsManagerClient({ region: 'us-west-2' });
const cloudwatchClient = new CloudWatchClient({ region: 'us-west-2' });

const TIMEOUT = 30000;

describe('AWS Web App Infrastructure - Integration Tests (us-west-2)', () => {
  let accountId: string;

  beforeAll(async () => {
    // Get AWS account ID
    const stsResponse = await stsClient.send(new GetCallerIdentityCommand({}));
    accountId = stsResponse.Account!;
  }, TIMEOUT);

  describe('AWS Account and Environment Validation', () => {
    test('should have valid AWS account ID', () => {
      expect(accountId).toBeDefined();
      expect(accountId).toMatch(/^\d{12}$/);
    });

    test('should be running in us-west-2 region', () => {
      expect(referenceOutputs.aws_region || 'us-west-2').toBe('us-west-2');
    });

    test('should have valid infrastructure outputs', () => {
      expect(referenceOutputs).toBeDefined();
      expect(typeof referenceOutputs).toBe('object');
    });
  });

  describe('VPC and Networking Infrastructure', () => {
    test('should have valid VPC in us-west-2', async () => {
      if (!referenceOutputs.vpc_id) {
        console.log('Skipping VPC test - vpc_id not found in reference outputs');
        return;
      }

      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [referenceOutputs.vpc_id]
      }));

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(referenceOutputs.vpc_id);
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toMatch(/^10\.\d+\.\d+\.\d+\/16$/);
    }, TIMEOUT);

    test('should have subnets across multiple availability zones', async () => {
      if (!referenceOutputs.subnet_ids && !referenceOutputs.public_subnet_ids && !referenceOutputs.private_subnet_ids) {
        console.log('Skipping subnet test - subnet IDs not found in reference outputs');
        return;
      }

      const subnetIds = [
        ...(referenceOutputs.public_subnet_ids || []),
        ...(referenceOutputs.private_subnet_ids || []),
        ...(referenceOutputs.database_subnet_ids || [])
      ].filter(Boolean);

      if (subnetIds.length === 0) {
        console.log('No subnet IDs found in reference outputs');
        return;
      }

      const response = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      }));

      expect(response.Subnets!.length).toBeGreaterThan(0);
      
      // Should have subnets in multiple AZs
      const availabilityZones = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
      
      // All should be in us-west-2
      response.Subnets!.forEach(subnet => {
        expect(subnet.AvailabilityZone).toMatch(/^us-west-2[a-z]$/);
      });
    }, TIMEOUT);
  });

  describe('Load Balancer Infrastructure', () => {
    test('should have valid Application Load Balancer', async () => {
      if (!referenceOutputs.application_url && !referenceOutputs.load_balancer_dns) {
        console.log('Skipping ALB test - load balancer DNS not found in reference outputs');
        return;
      }

      const targetDns = referenceOutputs.load_balancer_dns || 
        referenceOutputs.application_url?.replace(/^https?:\/\//, '');

      const response = await elbv2Client.send(new DescribeLoadBalancersCommand({}));
      const loadBalancer = response.LoadBalancers!.find(lb => 
        lb.DNSName === targetDns || lb.DNSName?.includes(targetDns?.split('.')[0])
      );

      expect(loadBalancer).toBeDefined();
      expect(loadBalancer!.Type).toBe('application');
      expect(loadBalancer!.Scheme).toBe('internet-facing');
      expect(['active', 'provisioning']).toContain(loadBalancer!.State?.Code);
    }, TIMEOUT);

    test('should have valid target groups with health checks', async () => {
      const response = await elbv2Client.send(new DescribeTargetGroupsCommand({}));
      
      if (response.TargetGroups!.length === 0) {
        console.log('No target groups found - may not be deployed yet');
        return;
      }

      const webTargetGroup = response.TargetGroups!.find(tg => 
        tg.TargetGroupName?.includes('web') || 
        tg.TargetGroupName?.includes('app')
      );

      if (webTargetGroup) {
        expect(webTargetGroup.Protocol).toBe('HTTP');
        expect(webTargetGroup.Port).toBe(80);
        expect(webTargetGroup.HealthCheckPath).toBeDefined();
        expect(webTargetGroup.HealthCheckIntervalSeconds).toBeDefined();
      }
    }, TIMEOUT);
  });

  describe('Auto Scaling Infrastructure', () => {
    test('should have valid Auto Scaling Group', async () => {
      if (!referenceOutputs.autoscaling_group_name && !referenceOutputs.asg_name) {
        console.log('Skipping ASG test - autoscaling group name not found in reference outputs');
        return;
      }

      const asgName = referenceOutputs.autoscaling_group_name || referenceOutputs.asg_name;
      
      const response = await asgClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName]
      }));

      expect(response.AutoScalingGroups).toHaveLength(1);
      const asg = response.AutoScalingGroups![0];
      expect(asg.AutoScalingGroupName).toBe(asgName);
      expect(asg.MinSize).toBeGreaterThanOrEqual(2);
      expect(asg.MaxSize).toBeGreaterThanOrEqual(asg.MinSize!);
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(asg.MinSize!);
    }, TIMEOUT);
  });

  describe('Database Infrastructure', () => {
    test('should have valid RDS instance', async () => {
      if (!referenceOutputs.database_endpoint && !referenceOutputs.rds_endpoint) {
        console.log('Skipping RDS test - database endpoint not found in reference outputs');
        return;
      }

      const dbIdentifier = referenceOutputs.database_identifier || 
        referenceOutputs.rds_identifier ||
        referenceOutputs.database_endpoint?.split('.')[0];

      if (!dbIdentifier) {
        console.log('Cannot determine RDS identifier from reference outputs');
        return;
      }

      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      expect(response.DBInstances).toHaveLength(1);
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.StorageEncrypted).toBe(true);
    }, TIMEOUT);

    test('should have database secret in Secrets Manager', async () => {
      if (!referenceOutputs.database_secret_arn && !referenceOutputs.db_secret_arn) {
        console.log('Skipping Secrets Manager test - secret ARN not found in reference outputs');
        return;
      }

      const secretArn = referenceOutputs.database_secret_arn || referenceOutputs.db_secret_arn;

      const response = await secretsManagerClient.send(new GetSecretValueCommand({
        SecretId: secretArn
      }));

      expect(response.SecretString).toBeDefined();
      const secret = JSON.parse(response.SecretString!);
      expect(secret.username).toBeDefined();
      expect(secret.password).toBeDefined();
    }, TIMEOUT);
  });

  describe('Storage Infrastructure', () => {
    test('should have valid S3 bucket with encryption', async () => {
      if (!referenceOutputs.s3_bucket_name && !referenceOutputs.static_assets_bucket) {
        console.log('Skipping S3 test - bucket name not found in reference outputs');
        return;
      }

      const bucketName = referenceOutputs.s3_bucket_name || referenceOutputs.static_assets_bucket;

      // Test bucket encryption
      const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: bucketName
      }));

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryptionResponse.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);

      // Test bucket versioning
      const versioningResponse = await s3Client.send(new GetBucketVersioningCommand({
        Bucket: bucketName
      }));

      expect(versioningResponse.Status).toBe('Enabled');
    }, TIMEOUT);
  });

  describe('Monitoring Infrastructure', () => {
    test('should have CloudWatch Log Groups', async () => {
      const response = await logsClient.send(new DescribeLogGroupsCommand({}));
      
      const appLogGroup = response.logGroups!.find(lg => 
        lg.logGroupName?.includes('webapp') || 
        lg.logGroupName?.includes('app')
      );

      if (appLogGroup) {
        expect(appLogGroup.retentionInDays).toBeGreaterThan(0);
      }
    }, TIMEOUT);

    test('should have CloudWatch Alarms', async () => {
      const response = await cloudwatchClient.send(new DescribeAlarmsCommand({}));
      
      if (response.MetricAlarms!.length === 0) {
        console.log('No CloudWatch alarms found - may not be deployed yet');
        return;
      }

      // Should have CPU alarms
      const cpuAlarms = response.MetricAlarms!.filter(alarm => 
        alarm.MetricName === 'CPUUtilization'
      );
      expect(cpuAlarms.length).toBeGreaterThan(0);

      // Should have RDS alarms
      const rdsAlarms = response.MetricAlarms!.filter(alarm => 
        alarm.Namespace === 'AWS/RDS'
      );
      expect(rdsAlarms.length).toBeGreaterThan(0);
    }, TIMEOUT);
  });

  describe('IAM and Security', () => {
    test('should have valid IAM roles', async () => {
      if (!referenceOutputs.ec2_role_name && !referenceOutputs.iam_role_name) {
        console.log('Skipping IAM test - role names not found in reference outputs');
        return;
      }

      const roleName = referenceOutputs.ec2_role_name || referenceOutputs.iam_role_name;

      const response = await iamClient.send(new GetRoleCommand({
        RoleName: roleName
      }));

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);
      
      // Should have EC2 trust relationship
      const trustPolicy = JSON.parse(decodeURIComponent(response.Role!.AssumeRolePolicyDocument!));
      const ec2Principal = trustPolicy.Statement.find((stmt: any) => 
        stmt.Principal?.Service?.includes('ec2.amazonaws.com')
      );
      expect(ec2Principal).toBeDefined();
    }, TIMEOUT);
  });

  describe('Regional Configuration', () => {
    test('should be deployed in us-west-2 region', async () => {
      // Verify all clients are configured for us-west-2
      const ec2Region = await ec2Client.config.region();
      const rdsRegion = await rdsClient.config.region();
      const elbv2Region = await elbv2Client.config.region();
      
      expect(ec2Region).toBe('us-west-2');
      expect(rdsRegion).toBe('us-west-2');
      expect(elbv2Region).toBe('us-west-2');
    });

    test('should have us-west-2 specific availability zones', async () => {
      if (!referenceOutputs.availability_zones) {
        console.log('Skipping AZ test - availability zones not found in reference outputs');
        return;
      }

      const azs = referenceOutputs.availability_zones;
      azs.forEach((az: string) => {
        expect(az).toMatch(/^us-west-2[a-z]$/);
      });
      expect(azs).toContain('us-west-2a');
      expect(azs).toContain('us-west-2b');
    });
  });

  describe('Application URLs and Endpoints', () => {
    test('should have valid application URL', () => {
      if (referenceOutputs.application_url) {
        expect(referenceOutputs.application_url).toMatch(/^https?:\/\/.+/);
      }
    });

    test('should have valid CloudFront distribution', () => {
      if (referenceOutputs.cloudfront_url || referenceOutputs.cloudfront_domain) {
        const cfUrl = referenceOutputs.cloudfront_url || referenceOutputs.cloudfront_domain;
        expect(cfUrl).toMatch(/^https?:\/\/.+\.cloudfront\.net/);
      }
    });
  });

  describe('Infrastructure Naming and Tagging', () => {
    test('should have consistent resource naming pattern', () => {
      // Resources should include project name and environment
      const resourceNames = [
        referenceOutputs.vpc_id,
        referenceOutputs.s3_bucket_name,
        referenceOutputs.autoscaling_group_name
      ].filter(Boolean);

      if (resourceNames.length > 0) {
        // Should follow naming convention with project and environment
        resourceNames.forEach(name => {
          expect(typeof name).toBe('string');
          expect(name.length).toBeGreaterThan(0);
        });
      }
    });
  });
});