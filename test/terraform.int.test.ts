import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
const AWS_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || process.env.CDK_DEFAULT_REGION || 'us-east-1';

const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, any> = {};

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  console.log('Loaded outputs:', JSON.stringify(outputs, null, 2));
} catch (error) {
  console.error('FAILED to load outputs:', error);
  outputs = {};
}

const ec2 = new AWS.EC2({ region: AWS_REGION });
const ecs = new AWS.ECS({ region: AWS_REGION });
const elbv2 = new AWS.ELBv2({ region: AWS_REGION });
const rds = new AWS.RDS({ region: AWS_REGION });
const s3 = new AWS.S3({ region: AWS_REGION });
const ecr = new AWS.ECR({ region: AWS_REGION });

// Helper for diagnostic AWS SDK calls with proper error handling
// This function will ALWAYS throw errors - no skipping allowed
async function diagAwsCall(label: string, fn: any, ...args: any[]) {
  try {
    const res = await fn(...args).promise();
    if (!res) {
      throw new Error(`[${label}] AWS API call returned null/undefined response`);
    }
    return res;
  } catch (err: any) {
    const errorMessage = `[${label}] AWS API call failed: ${err.message || JSON.stringify(err)}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}

// Validate that a resource exists - throw error if null/undefined
function assertResourceExists(resource: any, label: string, details?: string) {
  if (resource === null || resource === undefined) {
    const errorMsg = `[${label}] Resource not found or API call failed${details ? ': ' + details : ''}`;
    throw new Error(errorMsg);
  }
}

describe('Payment Processing Infrastructure - Integration Tests', () => {

  // -------------------------
  // Output Validation
  // -------------------------
  describe('Terraform Outputs', () => {
    test('All expected output keys are present', () => {
      const expectedKeys = [
        'alb_dns_name',
        'ecs_cluster_name',
        'rds_endpoint',
        'transaction_logs_bucket',
        'vpc_id'
      ];
      expectedKeys.forEach(key => {
        expect(outputs[key]).toBeDefined();
        expect(outputs[key]).not.toBeNull();
      });
    });

    test('Output values have correct format', () => {
      expect(outputs.alb_dns_name).toMatch(/^payment-alb-dev-.*\.elb\.amazonaws\.com$/);
      expect(outputs.ecs_cluster_name).toBe('payment-cluster-dev');
      expect(outputs.rds_endpoint).toMatch(/^payment-db-dev\..*\.rds\.amazonaws\.com:5432$/);
      expect(outputs.transaction_logs_bucket).toMatch(/^payment-logs-dev-\d+$/);
      expect(outputs.vpc_id).toMatch(/^vpc-[a-f0-9]+$/);
    });
  });

  // -------------------------
  // VPC and Network Resources
  // -------------------------
  describe('VPC and Networking', () => {
    test('VPC exists and has correct configuration', async () => {
      const vpcId = outputs.vpc_id;
      if (!vpcId) {
        throw new Error('VPC ID not found in outputs - check if infrastructure is deployed');
      }

      const res = await diagAwsCall('DescribeVPC', ec2.describeVpcs.bind(ec2), { VpcIds: [vpcId] });
      assertResourceExists(res?.Vpcs?.[0], 'DescribeVPC', `VPC ${vpcId} not found in AWS`);

      expect(res.Vpcs[0].VpcId).toBe(vpcId);
      expect(res.Vpcs[0].State).toBe('available');
      expect(res.Vpcs[0].CidrBlock).toMatch(/^10\.0\.0\.0\/16$/); // Dev CIDR
    });

    test('Public subnets exist and are configured correctly', async () => {
      const vpcId = outputs.vpc_id;
      if (!vpcId) {
        throw new Error('VPC ID not found in outputs');
      }

      const res = await diagAwsCall('DescribePublicSubnets', ec2.describeSubnets.bind(ec2), {
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Name', Values: ['*public*'] }
        ]
      });
      assertResourceExists(res?.Subnets, 'DescribePublicSubnets', 'No public subnets found');

      expect(res.Subnets.length).toBeGreaterThanOrEqual(2); // At least 2 AZs
      res.Subnets.forEach((subnet: any) => {
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe('available');
      });
    });

    test('Private subnets exist and are configured correctly', async () => {
      const vpcId = outputs.vpc_id;
      if (!vpcId) {
        throw new Error('VPC ID not found in outputs');
      }

      const res = await diagAwsCall('DescribePrivateSubnets', ec2.describeSubnets.bind(ec2), {
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Name', Values: ['*private*'] }
        ]
      });
      assertResourceExists(res?.Subnets, 'DescribePrivateSubnets', 'No private subnets found');

      expect(res.Subnets.length).toBeGreaterThanOrEqual(2); // At least 2 AZs
      res.Subnets.forEach((subnet: any) => {
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe('available');
      });
    });

    test('Internet Gateway exists and is attached', async () => {
      const vpcId = outputs.vpc_id;
      if (!vpcId) {
        throw new Error('VPC ID not found in outputs');
      }

      const res = await diagAwsCall('DescribeIGW', ec2.describeInternetGateways.bind(ec2), {
        Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }]
      });
      assertResourceExists(res?.InternetGateways?.[0], 'DescribeIGW', 'No Internet Gateway found attached to VPC');

      expect(res.InternetGateways[0].Attachments[0].VpcId).toBe(vpcId);
      expect(res.InternetGateways[0].Attachments[0].State).toBe('available');
    });

    test('NAT Gateway exists and is available', async () => {
      const vpcId = outputs.vpc_id;
      if (!vpcId) {
        throw new Error('VPC ID not found in outputs');
      }

      const res = await diagAwsCall('DescribeNATGateways', ec2.describeNatGateways.bind(ec2), {
        Filter: [{ Name: 'vpc-id', Values: [vpcId] }]
      });
      assertResourceExists(res?.NatGateways, 'DescribeNATGateways', 'No NAT Gateways found');

      expect(res.NatGateways.length).toBeGreaterThanOrEqual(1);
      res.NatGateways.forEach((nat: any) => {
        expect(nat.State).toBe('available');
      });
    });
  });

  // -------------------------
  // RDS Resources
  // -------------------------
  describe('RDS Database', () => {
    test('RDS instance exists and is available', async () => {
      const dbIdentifier = 'payment-db-dev';
      const res = await diagAwsCall('DescribeDBInstance', rds.describeDBInstances.bind(rds), {
        DBInstanceIdentifier: dbIdentifier
      });
      assertResourceExists(res?.DBInstances?.[0], 'DescribeDBInstance', `RDS instance ${dbIdentifier} not found`);

      const db = res.DBInstances[0];
      expect(db.DBInstanceIdentifier).toBe(dbIdentifier);
      expect(db.DBInstanceStatus).toBe('available');
      expect(db.Engine).toBe('postgres');
      expect(db.EngineVersion).toMatch(/^15\./);
    });

    test('RDS endpoint matches output', async () => {
      const dbIdentifier = 'payment-db-dev';
      const res = await diagAwsCall('DescribeDBInstance', rds.describeDBInstances.bind(rds), {
        DBInstanceIdentifier: dbIdentifier
      });
      assertResourceExists(res?.DBInstances?.[0], 'DescribeDBInstance', `RDS instance ${dbIdentifier} not found`);

      const endpoint = `${res.DBInstances[0].Endpoint.Address}:${res.DBInstances[0].Endpoint.Port}`;
      expect(endpoint).toBe(outputs.rds_endpoint);
    });

    test('RDS is encrypted at rest', async () => {
      const dbIdentifier = 'payment-db-dev';
      const res = await diagAwsCall('DescribeDBInstance', rds.describeDBInstances.bind(rds), {
        DBInstanceIdentifier: dbIdentifier
      });
      assertResourceExists(res?.DBInstances?.[0], 'DescribeDBInstance', `RDS instance ${dbIdentifier} not found`);

      expect(res.DBInstances[0].StorageEncrypted).toBe(true);
    });

    test('RDS has automated backups enabled', async () => {
      const dbIdentifier = 'payment-db-dev';
      const res = await diagAwsCall('DescribeDBInstance', rds.describeDBInstances.bind(rds), {
        DBInstanceIdentifier: dbIdentifier
      });
      assertResourceExists(res?.DBInstances?.[0], 'DescribeDBInstance', `RDS instance ${dbIdentifier} not found`);

      expect(res.DBInstances[0].BackupRetentionPeriod).toBeGreaterThan(0);
    });
  });

  // -------------------------
  // ECS Resources
  // -------------------------
  describe('ECS Cluster and Services', () => {
    test('ECS cluster exists', async () => {
      const clusterName = outputs.ecs_cluster_name;
      if (!clusterName) {
        throw new Error('ECS cluster name not found in outputs');
      }

      const res = await diagAwsCall('DescribeCluster', ecs.describeClusters.bind(ecs), {
        clusters: [clusterName]
      });
      assertResourceExists(res?.clusters?.[0], 'DescribeCluster', `ECS cluster ${clusterName} not found`);

      expect(res.clusters[0].clusterName).toBe(clusterName);
      expect(res.clusters[0].status).toBe('ACTIVE');
    });

    test('ECS service exists and is running', async () => {
      const clusterName = outputs.ecs_cluster_name;
      if (!clusterName) {
        throw new Error('ECS cluster name not found in outputs');
      }

      const res = await diagAwsCall('ListServices', ecs.listServices.bind(ecs), {
        cluster: clusterName
      });
      assertResourceExists(res?.serviceArns, 'ListServices', `No ECS services found in cluster ${clusterName}`);

      expect(res.serviceArns.length).toBeGreaterThan(0);

      const serviceDetails = await diagAwsCall('DescribeServices', ecs.describeServices.bind(ecs), {
        cluster: clusterName,
        services: res.serviceArns
      });
      assertResourceExists(serviceDetails?.services?.[0], 'DescribeServices', 'No service details returned');

      serviceDetails.services.forEach((service: any) => {
        expect(service.status).toBe('ACTIVE');
        expect(service.launchType).toBe('FARGATE');
      });
    });

    test('ECS tasks are running', async () => {
      const clusterName = outputs.ecs_cluster_name;
      if (!clusterName) {
        throw new Error('ECS cluster name not found in outputs');
      }

      const res = await diagAwsCall('ListTasks', ecs.listTasks.bind(ecs), {
        cluster: clusterName,
        desiredStatus: 'RUNNING'
      });
      assertResourceExists(res?.taskArns, 'ListTasks', `No running tasks found in cluster ${clusterName}`);

      expect(res.taskArns.length).toBeGreaterThan(0);
    });
  });

  // -------------------------
  // Load Balancer Resources
  // -------------------------
  describe('Application Load Balancer', () => {
    test('ALB exists and is active', async () => {
      const albDnsName = outputs.alb_dns_name;
      if (!albDnsName) {
        throw new Error('ALB DNS name not found in outputs');
      }

      const res = await diagAwsCall('DescribeLoadBalancers', elbv2.describeLoadBalancers.bind(elbv2), {
        Names: ['payment-alb-dev']
      });
      assertResourceExists(res?.LoadBalancers?.[0], 'DescribeLoadBalancers', 'ALB payment-alb-dev not found');

      const alb = res.LoadBalancers[0];
      expect(alb.DNSName).toBe(albDnsName);
      expect(alb.State.Code).toBe('active');
      expect(alb.Scheme).toBe('internet-facing');
    });

    test('ALB has target groups configured', async () => {
      const res = await diagAwsCall('DescribeTargetGroups', elbv2.describeTargetGroups.bind(elbv2), {
        Names: ['payment-tg-dev']
      });
      assertResourceExists(res?.TargetGroups?.[0], 'DescribeTargetGroups', 'Target group payment-tg-dev not found');

      expect(res.TargetGroups[0].Protocol).toBe('HTTP');
      expect(res.TargetGroups[0].Port).toBe(8080);
      expect(res.TargetGroups[0].HealthCheckEnabled).toBe(true);
    });

    test('ALB has listeners configured', async () => {
      const res = await diagAwsCall('DescribeLoadBalancers', elbv2.describeLoadBalancers.bind(elbv2), {
        Names: ['payment-alb-dev']
      });
      assertResourceExists(res?.LoadBalancers?.[0], 'DescribeLoadBalancers', 'ALB payment-alb-dev not found');

      const albArn = res.LoadBalancers[0].LoadBalancerArn;
      const listeners = await diagAwsCall('DescribeListeners', elbv2.describeListeners.bind(elbv2), {
        LoadBalancerArn: albArn
      });
      assertResourceExists(listeners?.Listeners, 'DescribeListeners', 'No listeners found for ALB');

      expect(listeners.Listeners.length).toBeGreaterThan(0);
      expect(listeners.Listeners.some((l: any) => l.Port === 80)).toBe(true);
    });
  });

  // -------------------------
  // S3 Resources
  // -------------------------
  describe('S3 Transaction Logs Bucket', () => {
    test('S3 bucket exists', async () => {
      const bucketName = outputs.transaction_logs_bucket;
      if (!bucketName) {
        throw new Error('S3 bucket name not found in outputs');
      }

      const res = await diagAwsCall('HeadBucket', s3.headBucket.bind(s3), {
        Bucket: bucketName
      });
      assertResourceExists(res, 'HeadBucket', `S3 bucket ${bucketName} not found`);

      expect(res).toBeDefined();
    });

    test('S3 bucket has encryption enabled', async () => {
      const bucketName = outputs.transaction_logs_bucket;
      if (!bucketName) {
        throw new Error('S3 bucket name not found in outputs');
      }

      const res = await diagAwsCall('GetBucketEncryption', s3.getBucketEncryption.bind(s3), {
        Bucket: bucketName
      });
      assertResourceExists(res?.ServerSideEncryptionConfiguration, 'GetBucketEncryption', `No encryption config found for bucket ${bucketName}`);

      expect(res.ServerSideEncryptionConfiguration.Rules.length).toBeGreaterThan(0);
      expect(res.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket has lifecycle policy configured', async () => {
      const bucketName = outputs.transaction_logs_bucket;
      if (!bucketName) {
        throw new Error('S3 bucket name not found in outputs');
      }

      const res = await diagAwsCall('GetBucketLifecycleConfiguration', s3.getBucketLifecycleConfiguration.bind(s3), {
        Bucket: bucketName
      });
      assertResourceExists(res?.Rules, 'GetBucketLifecycleConfiguration', `No lifecycle policy found for bucket ${bucketName}`);

      expect(res.Rules.length).toBeGreaterThan(0);
      const rule = res.Rules[0];
      expect(rule.Status).toBe('Enabled');
      expect(rule.Transitions.some((t: any) => t.StorageClass === 'STANDARD_IA')).toBe(true);
      expect(rule.Transitions.some((t: any) => t.StorageClass === 'GLACIER')).toBe(true);
    });

    test('S3 bucket has public access block configured', async () => {
      const bucketName = outputs.transaction_logs_bucket;
      if (!bucketName) {
        throw new Error('S3 bucket name not found in outputs');
      }

      const res = await diagAwsCall('GetPublicAccessBlock', s3.getPublicAccessBlock.bind(s3), {
        Bucket: bucketName
      });
      assertResourceExists(res?.PublicAccessBlockConfiguration, 'GetPublicAccessBlock', `No public access block config found for bucket ${bucketName}`);

      const config = res.PublicAccessBlockConfiguration;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });
  });

  // -------------------------
  // ECR Resources
  // -------------------------
  describe('ECR Repository', () => {
    test('ECR repository exists', async () => {
      const repoName = 'payment-api-dev';
      const res = await diagAwsCall('DescribeRepositories', ecr.describeRepositories.bind(ecr), {
        repositoryNames: [repoName]
      });
      assertResourceExists(res?.repositories?.[0], 'DescribeRepositories', `ECR repository ${repoName} not found`);

      expect(res.repositories[0].repositoryName).toBe(repoName);
    });

    test('ECR has image scanning enabled', async () => {
      const repoName = 'payment-api-dev';
      const res = await diagAwsCall('DescribeRepositories', ecr.describeRepositories.bind(ecr), {
        repositoryNames: [repoName]
      });
      assertResourceExists(res?.repositories?.[0], 'DescribeRepositories', `ECR repository ${repoName} not found`);

      expect(res.repositories[0].imageScanningConfiguration.scanOnPush).toBe(true);
    });

    test('ECR has encryption enabled', async () => {
      const repoName = 'payment-api-dev';
      const res = await diagAwsCall('DescribeRepositories', ecr.describeRepositories.bind(ecr), {
        repositoryNames: [repoName]
      });
      assertResourceExists(res?.repositories?.[0], 'DescribeRepositories', `ECR repository ${repoName} not found`);

      expect(res.repositories[0].encryptionConfiguration.encryptionType).toBe('AES256');
    });
  });

  // -------------------------
  // Security and Tagging
  // -------------------------
  describe('Security and Best Practices', () => {
    test('All resources have required tags', async () => {
      const vpcId = outputs.vpc_id;
      if (!vpcId) {
        throw new Error('VPC ID not found in outputs');
      }

      const res = await diagAwsCall('DescribeVPCTags', ec2.describeVpcs.bind(ec2), { VpcIds: [vpcId] });
      assertResourceExists(res?.Vpcs?.[0]?.Tags, 'DescribeVPCTags', `Tags not found for VPC ${vpcId}`);

      const tags = res.Vpcs[0].Tags;
      const tagKeys = tags.map((t: any) => t.Key);
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('ManagedBy');
      expect(tagKeys).toContain('Project');
    });

    test('Security groups have proper ingress rules', async () => {
      const vpcId = outputs.vpc_id;
      if (!vpcId) {
        throw new Error('VPC ID not found in outputs');
      }

      const res = await diagAwsCall('DescribeSecurityGroups', ec2.describeSecurityGroups.bind(ec2), {
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      });
      assertResourceExists(res?.SecurityGroups, 'DescribeSecurityGroups', `No security groups found for VPC ${vpcId}`);

      expect(res.SecurityGroups.length).toBeGreaterThan(0);
      // Verify no security group allows unrestricted access
      res.SecurityGroups.forEach((sg: any) => {
        const hasUnrestrictedAccess = sg.IpPermissions.some((rule: any) =>
          rule.IpRanges.some((ip: any) => ip.CidrIp === '0.0.0.0/0') &&
          rule.FromPort !== 80 && rule.FromPort !== 443
        );
        if (sg.GroupName.includes('alb')) {
          return;
        }
        expect(hasUnrestrictedAccess).toBe(false);
      });
    });
  });
});
