import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand
} from '@aws-sdk/client-ec2';
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand
} from '@aws-sdk/client-ecs';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand
} from '@aws-sdk/client-rds';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure - Integration Tests', () => {
  const region = 'ap-southeast-1';
  let outputs: any;

  // AWS Clients
  const ec2Client = new EC2Client({ region });
  const ecsClient = new ECSClient({ region });
  const rdsClient = new RDSClient({ region });
  const elbClient = new ElasticLoadBalancingV2Client({ region });
  const s3Client = new S3Client({ region });

  beforeAll(() => {
    // Load Terraform outputs
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
      // Flatten the outputs structure
      outputs = {};
      Object.entries(rawOutputs).forEach(([key, value]: [string, any]) => {
        outputs[key] = value.value;
      });
    } else {
      throw new Error(`Outputs file not found at ${outputsPath}`);
    }
  });

  describe('VPC Infrastructure', () => {
    test('VPC should exist and be available', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);
      expect(response.Vpcs?.[0].State).toBe('available');
      expect(response.Vpcs?.[0].CidrBlock).toBe(outputs.vpc_cidr);
    });

    test('VPC should have correct CIDR block', () => {
      expect(outputs.vpc_cidr).toMatch(/^10\.[1-3]\.0\.0\/16$/);
    });

    test('VPC should have DNS support enabled', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });
      const response = await ec2Client.send(command);

      // Type assertion for AWS SDK v3 Vpc type
      const vpc = response.Vpcs?.[0] as any;
      expect(vpc?.EnableDnsSupport?.Value).toBe(true);
      expect(vpc?.EnableDnsHostnames?.Value).toBe(true);
    });

    test('should have public subnets', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.vpc_id] },
          { Name: 'tag:Tier', Values: ['public'] }
        ]
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBeGreaterThanOrEqual(2);
      response.Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('should have private subnets', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.vpc_id] },
          { Name: 'tag:Tier', Values: ['private'] }
        ]
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBeGreaterThanOrEqual(2);
    });

    test('should have database subnets', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.vpc_id] },
          { Name: 'tag:Tier', Values: ['database'] }
        ]
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBeGreaterThanOrEqual(2);
    });

    test('should have NAT gateway', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          { Name: 'vpc-id', Values: [outputs.vpc_id] },
          { Name: 'state', Values: ['available'] }
        ]
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways?.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Security Groups', () => {
    test('ALB security group should exist and allow HTTP/HTTPS', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.vpc_id] },
          { Name: 'tag:Name', Values: ['*alb-sg-*'] }
        ]
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBeGreaterThanOrEqual(1);

      const sg = response.SecurityGroups?.[0];
      const hasHttp = sg?.IpPermissions?.some(rule =>
        rule.FromPort === 80 && rule.ToPort === 80
      );
      const hasHttps = sg?.IpPermissions?.some(rule =>
        rule.FromPort === 443 && rule.ToPort === 443
      );

      expect(hasHttp || hasHttps).toBe(true);
    });

    test('ECS security group should exist', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.vpc_id] },
          { Name: 'tag:Name', Values: ['*ecs-sg-*'] }
        ]
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBeGreaterThanOrEqual(1);
    });

    test('RDS security group should exist', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.vpc_id] },
          { Name: 'tag:Name', Values: ['*rds-sg-*'] }
        ]
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB should exist and be active', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: [outputs.alb_dns_name.split('.')[0]]
      });
      const response = await elbClient.send(command);

      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers?.length).toBe(1);
      expect(response.LoadBalancers?.[0].State?.Code).toBe('active');
    });

    test('ALB should have correct DNS name', () => {
      expect(outputs.alb_dns_name).toMatch(/^alb-.*\.elb\.amazonaws\.com$/);
    });

    test('ALB should have correct scheme', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: [outputs.alb_dns_name.split('.')[0]]
      });
      const response = await elbClient.send(command);

      expect(response.LoadBalancers?.[0].Scheme).toBe('internet-facing');
    });

    test('target group should exist and be healthy', async () => {
      const command = new DescribeTargetGroupsCommand({
        Names: [outputs.alb_dns_name.split('.')[0].replace('alb-', 'ecs-tg-')]
      });
      const response = await elbClient.send(command);

      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups?.length).toBeGreaterThanOrEqual(1);
    }, 15000);

    test('ALB should have HTTP listener', async () => {
      const lbCommand = new DescribeLoadBalancersCommand({
        Names: [outputs.alb_dns_name.split('.')[0]]
      });
      const lbResponse = await elbClient.send(lbCommand);
      const lbArn = lbResponse.LoadBalancers?.[0].LoadBalancerArn;

      const listenerCommand = new DescribeListenersCommand({
        LoadBalancerArn: lbArn
      });
      const response = await elbClient.send(listenerCommand);

      expect(response.Listeners).toBeDefined();
      expect(response.Listeners?.length).toBeGreaterThanOrEqual(1);

      const hasHttp = response.Listeners?.some(listener =>
        listener.Port === 80 && listener.Protocol === 'HTTP'
      );
      expect(hasHttp).toBe(true);
    });
  });

  describe('ECS Infrastructure', () => {
    test('ECS cluster should exist and be active', async () => {
      const command = new DescribeClustersCommand({
        clusters: [outputs.ecs_cluster_name]
      });
      const response = await ecsClient.send(command);

      expect(response.clusters).toBeDefined();
      expect(response.clusters?.length).toBe(1);
      expect(response.clusters?.[0].status).toBe('ACTIVE');
    });

    test('ECS cluster should have correct name format', () => {
      expect(outputs.ecs_cluster_name).toMatch(/^ecs-cluster-/);
    });

    test('ECS service should exist and be stable', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ecs_cluster_name,
        services: [outputs.ecs_service_name]
      });
      const response = await ecsClient.send(command);

      expect(response.services).toBeDefined();
      expect(response.services?.length).toBe(1);
      expect(response.services?.[0].status).toBe('ACTIVE');
    });

    test('ECS service should have correct desired count', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ecs_cluster_name,
        services: [outputs.ecs_service_name]
      });
      const response = await ecsClient.send(command);

      expect(response.services?.[0].desiredCount).toBe(outputs.ecs_task_count);
    });

    test('ECS task definition should use Fargate', async () => {
      const serviceCommand = new DescribeServicesCommand({
        cluster: outputs.ecs_cluster_name,
        services: [outputs.ecs_service_name]
      });
      const serviceResponse = await ecsClient.send(serviceCommand);
      const taskDefArn = serviceResponse.services?.[0].taskDefinition;

      const taskDefCommand = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefArn
      });
      const response = await ecsClient.send(taskDefCommand);

      expect(response.taskDefinition?.requiresCompatibilities).toContain('FARGATE');
      expect(response.taskDefinition?.networkMode).toBe('awsvpc');
    });
  });

  describe('RDS Aurora Infrastructure', () => {
    test('RDS cluster should exist and be available', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.rds_cluster_id
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters?.length).toBe(1);
      expect(response.DBClusters?.[0].Status).toBe('available');
    }, 20000);

    test('RDS cluster should be Aurora PostgreSQL', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.rds_cluster_id
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters?.[0].Engine).toBe('aurora-postgresql');
    });

    test('RDS cluster should have encryption enabled', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.rds_cluster_id
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters?.[0].StorageEncrypted).toBe(true);
    });

    test('RDS cluster should have automated backups enabled', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.rds_cluster_id
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters?.[0].BackupRetentionPeriod).toBeGreaterThan(0);
    });

    test('RDS cluster should have correct endpoint', () => {
      expect(outputs.rds_cluster_endpoint).toMatch(/\.rds\.amazonaws\.com$/);
      expect(outputs.rds_cluster_endpoint).toContain(outputs.rds_cluster_id);
    });

    test('RDS instance should exist and be available', async () => {
      const command = new DescribeDBInstancesCommand({
        Filters: [
          { Name: 'db-cluster-id', Values: [outputs.rds_cluster_id] }
        ]
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances?.length).toBeGreaterThanOrEqual(1);
      expect(response.DBInstances?.[0].DBInstanceStatus).toBe('available');
    }, 20000);
  });

  describe('S3 Audit Logs Bucket', () => {
    test('S3 bucket should exist', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.audit_logs_bucket_name
      });

      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('S3 bucket should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.audit_logs_bucket_name
      });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.audit_logs_bucket_name
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules?.length).toBeGreaterThan(0);
    });

    test('S3 bucket should have lifecycle policy', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.audit_logs_bucket_name
      });
      const response = await s3Client.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);

      // Check for STANDARD_IA transition
      const hasIATransition = response.Rules?.some(rule =>
        rule.Transitions?.some(t => t.StorageClass === 'STANDARD_IA')
      );
      expect(hasIATransition).toBe(true);
    });

    test('S3 bucket name should follow naming convention', () => {
      expect(outputs.audit_logs_bucket_name).toMatch(/^audit-logs-.*-\d+$/);
    });
  });

  describe('Environment Configuration', () => {
    test('environment summary should have all required fields', () => {
      expect(outputs.environment_summary).toBeDefined();
      expect(outputs.environment_summary.environment).toBeDefined();
      expect(outputs.environment_summary.region).toBe(region);
      expect(outputs.environment_summary.vpc_cidr).toBeDefined();
      expect(outputs.environment_summary.alb_endpoint).toBeDefined();
      expect(outputs.environment_summary.rds_endpoint).toBeDefined();
    });

    test('region should be ap-southeast-1', () => {
      expect(outputs.environment_summary.region).toBe('ap-southeast-1');
    });

    test('all resources should have consistent environment naming', () => {
      const envSuffix = outputs.environment_summary.environment;
      expect(outputs.ecs_cluster_name).toContain(envSuffix);
      expect(outputs.ecs_service_name).toContain(envSuffix);
      expect(outputs.rds_cluster_id).toContain(envSuffix);
      expect(outputs.audit_logs_bucket_name).toContain(envSuffix);
    });
  });

  describe('Tagging Compliance', () => {
    test('VPC should have required tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });
      const response = await ec2Client.send(command);
      const tags = response.Vpcs?.[0].Tags || [];

      const hasEnvironmentTag = tags.some(tag => tag.Key === 'Environment');
      const hasManagedByTag = tags.some(tag => tag.Key === 'ManagedBy' && tag.Value === 'terraform');
      const hasProjectTag = tags.some(tag => tag.Key === 'Project');

      expect(hasEnvironmentTag).toBe(true);
      expect(hasManagedByTag).toBe(true);
      expect(hasProjectTag).toBe(true);
    });

    test('ECS cluster should have required tags', async () => {
      const command = new DescribeClustersCommand({
        clusters: [outputs.ecs_cluster_name],
        include: ['TAGS']
      });
      const response = await ecsClient.send(command);
      const tags = response.clusters?.[0].tags || [];

      const hasEnvironmentTag = tags.some(tag => tag.key === 'Environment');
      const hasManagedByTag = tags.some(tag => tag.key === 'ManagedBy');

      expect(hasEnvironmentTag).toBe(true);
      expect(hasManagedByTag).toBe(true);
    });
  });
});
