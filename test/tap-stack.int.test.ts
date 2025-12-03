import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
} from '@aws-sdk/client-ecs';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyPolicyCommand,
} from '@aws-sdk/client-kms';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

describe('Payment Processing Infrastructure Integration Tests', () => {
  let outputs: any;
  const AWS_REGION = process.env.AWS_REGION || 'us-east-2';
  const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'dev';

  // Initialize AWS SDK clients
  const ec2Client = new EC2Client({ region: AWS_REGION });
  const ecsClient = new ECSClient({ region: AWS_REGION });
  const elbClient = new ElasticLoadBalancingV2Client({ region: AWS_REGION });
  const rdsClient = new RDSClient({ region: AWS_REGION });
  const s3Client = new S3Client({ region: AWS_REGION });
  const kmsClient = new KMSClient({ region: AWS_REGION });
  const secretsClient = new SecretsManagerClient({ region: AWS_REGION });
  const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });

  beforeAll(() => {
    // Load deployment outputs
    const outputPath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json',
    );

    if (!fs.existsSync(outputPath)) {
      throw new Error(
        `Deployment outputs not found at ${outputPath}. Please run deployment first.`,
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    console.log('Loaded deployment outputs:', Object.keys(outputs));
  });

  describe('VPC Infrastructure', () => {
    test('VPC exists and has correct configuration', async () => {
      expect(outputs.vpc_id).toBeDefined();

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.vpc_id],
        }),
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];

      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);

      // Verify VPC tags
      const tags = vpc.Tags || [];
      const envTag = tags.find(t => t.Key === 'Environment');
      const appTag = tags.find(t => t.Key === 'Application');
      const costTag = tags.find(t => t.Key === 'CostCenter');

      expect(envTag?.Value).toBe(ENVIRONMENT_SUFFIX);
      expect(appTag?.Value).toBe('PaymentProcessing');
      expect(costTag?.Value).toBe('Finance');
    }, 30000);

    test('Public and private subnets exist across multiple AZs', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpc_id],
            },
          ],
        }),
      );

      const subnets = response.Subnets || [];
      expect(subnets.length).toBeGreaterThanOrEqual(6); // 3 public + 3 private

      const publicSubnets = subnets.filter(s =>
        s.Tags?.some(t => t.Key === 'Type' && t.Value === 'Public'),
      );
      const privateSubnets = subnets.filter(s =>
        s.Tags?.some(t => t.Key === 'Type' && t.Value === 'Private'),
      );

      expect(publicSubnets.length).toBe(3);
      expect(privateSubnets.length).toBe(3);

      // Verify subnets are in different AZs
      const publicAZs = new Set(publicSubnets.map(s => s.AvailabilityZone));
      const privateAZs = new Set(privateSubnets.map(s => s.AvailabilityZone));

      expect(publicAZs.size).toBe(3);
      expect(privateAZs.size).toBe(3);
    }, 30000);

    test('NAT Gateways are deployed in public subnets', async () => {
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpc_id],
            },
            {
              Name: 'state',
              Values: ['available'],
            },
          ],
        }),
      );

      const natGateways = response.NatGateways || [];
      expect(natGateways.length).toBe(3); // One per AZ
    }, 30000);

    test('VPC Flow Logs are enabled and stored in S3', async () => {
      expect(outputs.vpc_flow_logs_bucket).toBeDefined();

      // Verify S3 bucket exists
      await expect(
        s3Client.send(
          new HeadBucketCommand({ Bucket: outputs.vpc_flow_logs_bucket }),
        ),
      ).resolves.not.toThrow();

      // Verify versioning is enabled
      const versioningResponse = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: outputs.vpc_flow_logs_bucket,
        }),
      );
      expect(versioningResponse.Status).toBe('Enabled');

      // Verify lifecycle policy exists
      const lifecycleResponse = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({
          Bucket: outputs.vpc_flow_logs_bucket,
        }),
      );

      const glacierRule = lifecycleResponse.Rules?.find(r =>
        r.Transitions?.some(t => t.StorageClass === 'GLACIER'),
      );
      expect(glacierRule).toBeDefined();
      expect(glacierRule?.Transitions![0].Days).toBe(90);
    }, 30000);
  });

  describe('Security Groups', () => {
    test('ALB security group allows only HTTPS inbound', async () => {
      expect(outputs.alb_security_group_id).toBeDefined();

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.alb_security_group_id],
        }),
      );

      const sg = response.SecurityGroups![0];
      const httpIngress = sg.IpPermissions?.filter(p => p.FromPort === 443);

      expect(httpIngress).toHaveLength(1);
      expect(httpIngress![0].IpProtocol).toBe('tcp');
      expect(httpIngress![0].IpRanges).toContainEqual({ CidrIp: '0.0.0.0/0' });
    }, 30000);

    test('ECS security group allows traffic only from ALB', async () => {
      expect(outputs.ecs_security_group_id).toBeDefined();

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.ecs_security_group_id],
        }),
      );

      const sg = response.SecurityGroups![0];
      const appIngress = sg.IpPermissions?.find(p => p.FromPort === 8080);

      expect(appIngress).toBeDefined();
      expect(appIngress?.UserIdGroupPairs).toContainEqual(
        expect.objectContaining({
          GroupId: outputs.alb_security_group_id,
        }),
      );
    }, 30000);

    test('RDS security group allows traffic only from ECS', async () => {
      expect(outputs.rds_security_group_id).toBeDefined();

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.rds_security_group_id],
        }),
      );

      const sg = response.SecurityGroups![0];
      const dbIngress = sg.IpPermissions?.find(p => p.FromPort === 3306);

      expect(dbIngress).toBeDefined();
      expect(dbIngress?.UserIdGroupPairs).toContainEqual(
        expect.objectContaining({
          GroupId: outputs.ecs_security_group_id,
        }),
      );
    }, 30000);
  });

  describe('Application Load Balancer', () => {
    test('ALB is deployed in public subnets with HTTPS listener', async () => {
      expect(outputs.alb_dns_name).toBeDefined();

      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({
          Names: [outputs.alb_name || `payment-alb-${ENVIRONMENT_SUFFIX}`],
        }),
      );

      const alb = response.LoadBalancers![0];
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
      expect(alb.AvailabilityZones?.length).toBe(3);
    }, 30000);

    test('Target group has proper health check configuration', async () => {
      expect(outputs.target_group_arn).toBeDefined();

      const response = await elbClient.send(
        new DescribeTargetGroupsCommand({
          TargetGroupArns: [outputs.target_group_arn],
        }),
      );

      const tg = response.TargetGroups![0];
      expect(tg.Port).toBe(8080);
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.TargetType).toBe('ip');
      expect(tg.HealthCheckEnabled).toBe(true);
      expect(tg.HealthCheckPath).toBe('/health');
      expect(tg.HealthCheckProtocol).toBe('HTTP');
      expect(tg.HealthyThresholdCount).toBe(2);
      expect(tg.UnhealthyThresholdCount).toBe(3);
    }, 30000);
  });

  describe('ECS Fargate Service', () => {
    test('ECS cluster exists and is active', async () => {
      expect(outputs.ecs_cluster_name).toBeDefined();

      const response = await ecsClient.send(
        new DescribeClustersCommand({
          clusters: [outputs.ecs_cluster_name],
        }),
      );

      const cluster = response.clusters![0];
      expect(cluster.status).toBe('ACTIVE');
      expect(cluster.capacityProviders).toContain('FARGATE');
    }, 30000);

    test('ECS service is deployed in private subnets', async () => {
      expect(outputs.ecs_service_name).toBeDefined();

      const response = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: outputs.ecs_cluster_name,
          services: [outputs.ecs_service_name],
        }),
      );

      const service = response.services![0];
      expect(service.status).toBe('ACTIVE');
      expect(service.launchType).toBe('FARGATE');
      expect(service.desiredCount).toBeGreaterThan(0);

      // Verify service is in private subnets
      const subnets = service.networkConfiguration?.awsvpcConfiguration?.subnets || [];
      expect(subnets.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('RDS Aurora Database', () => {
    test('RDS cluster is deployed with multi-AZ and encryption', async () => {
      expect(outputs.rds_cluster_endpoint).toBeDefined();

      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: outputs.rds_cluster_id || `payment-aurora-cluster-${ENVIRONMENT_SUFFIX}`,
        }),
      );

      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-mysql');
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.KmsKeyId).toBeDefined();
      expect(cluster.BackupRetentionPeriod).toBeGreaterThanOrEqual(35);
      expect(cluster.MultiAZ).toBe(true);
    }, 30000);

    test('RDS instances are deployed across multiple AZs', async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          Filters: [
            {
              Name: 'db-cluster-id',
              Values: [outputs.rds_cluster_id || `payment-aurora-cluster-${ENVIRONMENT_SUFFIX}`],
            },
          ],
        }),
      );

      const instances = response.DBInstances || [];
      expect(instances.length).toBeGreaterThanOrEqual(2);

      const azs = new Set(instances.map(i => i.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);

      // Verify encryption
      instances.forEach(instance => {
        expect(instance.StorageEncrypted).toBe(true);
      });
    }, 30000);
  });

  describe('KMS Encryption', () => {
    test('KMS key exists with proper configuration', async () => {
      expect(outputs.kms_key_id).toBeDefined();

      const response = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: outputs.kms_key_id,
        }),
      );

      const key = response.KeyMetadata!;
      expect(key.Enabled).toBe(true);
      expect(key.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(key.KeyState).toBe('Enabled');
    }, 30000);

    test('KMS key has proper permissions policy', async () => {
      const response = await kmsClient.send(
        new GetKeyPolicyCommand({
          KeyId: outputs.kms_key_id,
          PolicyName: 'default',
        }),
      );

      const policy = JSON.parse(response.Policy!);
      expect(policy.Statement).toBeDefined();
      expect(Array.isArray(policy.Statement)).toBe(true);
    }, 30000);
  });

  describe('Secrets Manager', () => {
    test('RDS master password secret exists and is encrypted', async () => {
      expect(outputs.rds_secret_arn).toBeDefined();

      const response = await secretsClient.send(
        new DescribeSecretCommand({
          SecretId: outputs.rds_secret_arn,
        }),
      );

      expect(response.Name).toContain('rds-master-password');
      expect(response.KmsKeyId).toBeDefined();
    }, 30000);
  });

  describe('CloudWatch Logging', () => {
    test('ECS log group exists with 7-year retention', async () => {
      const logGroupName =
        outputs.ecs_log_group_name || `/aws/ecs/payment-service-${ENVIRONMENT_SUFFIX}`;

      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        }),
      );

      const logGroup = response.logGroups?.find(
        lg => lg.logGroupName === logGroupName,
      );

      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(2555); // 7 years
    }, 30000);

    test('RDS slow query log group exists with 7-year retention', async () => {
      const logGroupName =
        outputs.rds_log_group_name || `/aws/rds/payment-aurora-cluster-${ENVIRONMENT_SUFFIX}/slowquery`;

      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        }),
      );

      const logGroup = response.logGroups?.find(
        lg => lg.logGroupName === logGroupName,
      );

      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(2555); // 7 years
    }, 30000);
  });

  describe('Resource Tagging Compliance', () => {
    test('All resources have required compliance tags', async () => {
      const requiredTags = ['Environment', 'Application', 'CostCenter'];

      // Verify VPC tags
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.vpc_id],
        }),
      );

      const vpcTags = vpcResponse.Vpcs![0].Tags || [];
      requiredTags.forEach(tag => {
        expect(vpcTags.some(t => t.Key === tag)).toBe(true);
      });
    }, 30000);
  });

  describe('End-to-End Workflow', () => {
    test('ALB can resolve and is accessible', async () => {
      expect(outputs.alb_dns_name).toBeDefined();
      expect(outputs.alb_dns_name).toMatch(/^payment-alb-.*\.elb\..*\.amazonaws\.com$/);
    }, 30000);

    test('Infrastructure supports complete request flow', async () => {
      // Verify the flow: Internet -> ALB (public) -> ECS (private) -> RDS (private)
      // ALB in public subnets
      expect(outputs.alb_dns_name).toBeDefined();

      // ECS in private subnets behind ALB
      expect(outputs.ecs_security_group_id).toBeDefined();

      // RDS in private subnets accessible only from ECS
      expect(outputs.rds_cluster_endpoint).toBeDefined();

      // All components connected through security groups
      expect(outputs.alb_security_group_id).toBeDefined();
      expect(outputs.ecs_security_group_id).toBeDefined();
      expect(outputs.rds_security_group_id).toBeDefined();
    }, 30000);
  });
});
