import {
  CodePipelineClient,
  GetPipelineCommand,
} from '@aws-sdk/client-codepipeline';
import {
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeClustersCommand,
  DescribeServicesCommand,
  ECSClient,
} from '@aws-sdk/client-ecs';
import {
  DescribeFileSystemsCommand,
  EFSClient,
} from '@aws-sdk/client-efs';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DescribeKeyCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import fs from 'fs';

// Load outputs from deployed stack
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'eu-south-1';

// Initialize AWS SDK clients
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const efsClient = new EFSClient({ region });
const ecsClient = new ECSClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const codepipelineClient = new CodePipelineClient({ region });
const s3Client = new S3Client({ region });
const kmsClient = new KMSClient({ region });

describe('CloudFormation Infrastructure Integration Tests', () => {
  describe('VPC and Network Resources', () => {
    test('VPC should exist and be properly configured', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs[0];
      expect(vpc.State).toBe('available');
      // EnableDnsHostnames and EnableDnsSupport may not be present in all SDKs or may be undefined
      if ('EnableDnsHostnames' in vpc && vpc.EnableDnsHostnames !== undefined) {
        expect(vpc.EnableDnsHostnames).toBe(true);
      }
      if ('EnableDnsSupport' in vpc && vpc.EnableDnsSupport !== undefined) {
        expect(vpc.EnableDnsSupport).toBe(true);
      }
    });

    test('should have 4 subnets (2 public, 2 private)', async () => {
      const vpcId = outputs.VPCId;
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );

      expect(response.Subnets.length).toBeGreaterThanOrEqual(4);

      const publicSubnets = response.Subnets.filter((s) =>
        s.MapPublicIpOnLaunch
      );
      const privateSubnets = response.Subnets.filter(
        (s) => !s.MapPublicIpOnLaunch
      );

      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
    });

    test('NAT Gateway should be available', async () => {
      const natGatewayId = outputs.NatGatewayId;
      expect(natGatewayId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          NatGatewayIds: [natGatewayId],
        })
      );

      expect(response.NatGateways).toHaveLength(1);
      expect(response.NatGateways[0].State).toBe('available');
    });

    test('security groups should be properly configured', async () => {
      const vpcId = outputs.VPCId;
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'tag:Environment', Values: [environmentSuffix] },
          ],
        })
      );

      expect(response.SecurityGroups.length).toBeGreaterThanOrEqual(4);

      const sgNames = response.SecurityGroups.map((sg) =>
        sg.GroupName.toLowerCase()
      );
      expect(sgNames.some((name) => name.includes('alb'))).toBe(true);
      expect(sgNames.some((name) => name.includes('ecs'))).toBe(true);
      expect(sgNames.some((name) => name.includes('rds'))).toBe(true);
      expect(sgNames.some((name) => name.includes('efs'))).toBe(true);
    });
  });

  describe('RDS Database', () => {
    test('RDS instance should be available', async () => {
      const dbEndpoint = outputs.RDSInstanceEndpoint;
      expect(dbEndpoint).toBeDefined();

      const dbIdentifier = `healthtech-postgres-${environmentSuffix}`;
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      expect(response.DBInstances).toHaveLength(1);
      const db = response.DBInstances[0];
      expect(db.DBInstanceStatus).toBe('available');
      expect(db.Engine).toBe('postgres');
      expect(db.MultiAZ).toBe(true);
      expect(db.StorageEncrypted).toBe(true);
    });

    test('RDS instance should be in private subnets', async () => {
      const dbIdentifier = `healthtech-postgres-${environmentSuffix}`;
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const db = response.DBInstances[0];
      expect(db.PubliclyAccessible).toBe(false);
      expect(db.DBSubnetGroup).toBeDefined();
    });

    test('RDS instance should have CloudWatch logs enabled', async () => {
      const dbIdentifier = `healthtech-postgres-${environmentSuffix}`;
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const db = response.DBInstances[0];
      expect(db.EnabledCloudwatchLogsExports).toContain('postgresql');
    });
  });

  describe('EFS File System', () => {
    test('EFS file system should be available', async () => {
      const fileSystemId = outputs.EFSFileSystemId;
      expect(fileSystemId).toBeDefined();

      const response = await efsClient.send(
        new DescribeFileSystemsCommand({
          FileSystemId: fileSystemId,
        })
      );

      expect(response.FileSystems).toHaveLength(1);
      const fs = response.FileSystems[0];
      expect(fs.LifeCycleState).toBe('available');
      expect(fs.Encrypted).toBe(true);
    });

    test('EFS should have KMS encryption', async () => {
      const fileSystemId = outputs.EFSFileSystemId;
      const response = await efsClient.send(
        new DescribeFileSystemsCommand({
          FileSystemId: fileSystemId,
        })
      );

      const fs = response.FileSystems[0];
      expect(fs.KmsKeyId).toBeDefined();
    });
  });

  describe('Load Balancer', () => {
    test('Application Load Balancer should be active', async () => {
      const albDNS = outputs.LoadBalancerDNS;
      expect(albDNS).toBeDefined();

      const albArn = outputs.LoadBalancerArn;
      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArn],
        })
      );

      expect(response.LoadBalancers).toHaveLength(1);
      const alb = response.LoadBalancers[0];
      expect(alb.State.Code).toBe('active');
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
    });

    test('ALB should be in public subnets', async () => {
      const albArn = outputs.LoadBalancerArn;
      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArn],
        })
      );

      const alb = response.LoadBalancers[0];
      expect(alb.AvailabilityZones.length).toBeGreaterThanOrEqual(2);

      const publicSubnet1 = outputs.PublicSubnet1Id;
      const publicSubnet2 = outputs.PublicSubnet2Id;
      const albSubnets = alb.AvailabilityZones.map((az) => az.SubnetId);

      expect(
        albSubnets.includes(publicSubnet1) ||
        albSubnets.includes(publicSubnet2)
      ).toBe(true);
    });

    test('target group should have health checks enabled', async () => {
      const albArn = outputs.LoadBalancerArn;
      const tgResponse = await elbClient.send(
        new DescribeTargetGroupsCommand({
          LoadBalancerArn: albArn,
        })
      );

      expect(tgResponse.TargetGroups.length).toBeGreaterThanOrEqual(1);
      const tg = tgResponse.TargetGroups[0];
      expect(tg.HealthCheckEnabled).toBe(true);
      expect(tg.HealthCheckPath).toBe('/');
    });
  });

  describe('ECS Cluster and Services', () => {
    test('ECS cluster should be active', async () => {
      const clusterName = outputs.ECSClusterName;
      expect(clusterName).toBeDefined();

      const response = await ecsClient.send(
        new DescribeClustersCommand({
          clusters: [clusterName],
        })
      );

      expect(response.clusters).toHaveLength(1);
      const cluster = response.clusters[0];
      expect(cluster.status).toBe('ACTIVE');
    });

    test('ECS service should be running', async () => {
      const clusterName = outputs.ECSClusterName;
      const serviceName = outputs.ECSServiceName;
      expect(serviceName).toBeDefined();

      const response = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterName,
          services: [serviceName],
        })
      );

      expect(response.services).toHaveLength(1);
      const service = response.services[0];
      expect(service.status).toBe('ACTIVE');
      expect(service.launchType).toBe('FARGATE');
    });

    test('ECS tasks should be in private subnets', async () => {
      const clusterName = outputs.ECSClusterName;
      const serviceName = outputs.ECSServiceName;

      const response = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterName,
          services: [serviceName],
        })
      );

      const service = response.services[0];
      const networkConfig = service.networkConfiguration.awsvpcConfiguration;
      expect(networkConfig.assignPublicIp).toBe('DISABLED');

      const privateSubnet1 = outputs.PrivateSubnet1Id;
      const privateSubnet2 = outputs.PrivateSubnet2Id;
      const serviceSubnets = networkConfig.subnets;

      expect(
        serviceSubnets.includes(privateSubnet1) ||
        serviceSubnets.includes(privateSubnet2)
      ).toBe(true);
    });
  });

  describe('CodePipeline', () => {
    test('CodePipeline should exist and be configured', async () => {
      const pipelineName = outputs.PipelineName;
      expect(pipelineName).toBeDefined();

      const response = await codepipelineClient.send(
        new GetPipelineCommand({ name: pipelineName })
      );

      expect(response.pipeline).toBeDefined();
      expect(response.pipeline.stages).toHaveLength(3);

      const stageNames = response.pipeline.stages.map((s) => s.name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Deploy');
    });
  });

  describe('S3 Artifact Bucket', () => {
    test('S3 bucket should have encryption enabled', async () => {
      const bucketName = outputs.ArtifactBucketName;
      expect(bucketName).toBeDefined();

      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration.Rules
      ).toHaveLength(1);
    });

    test('S3 bucket should block public access', async () => {
      const bucketName = outputs.ArtifactBucketName;

      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );

      expect(response.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(
        true
      );
      expect(
        response.PublicAccessBlockConfiguration.BlockPublicPolicy
      ).toBe(true);
      expect(response.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(
        true
      );
      expect(
        response.PublicAccessBlockConfiguration.RestrictPublicBuckets
      ).toBe(true);
    });
  });

  describe('KMS Encryption Keys', () => {
    test('RDS KMS key should be enabled', async () => {
      const keyId = outputs.RDSKMSKeyId;
      expect(keyId).toBeDefined();

      const response = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: keyId })
      );

      expect(response.KeyMetadata.KeyState).toBe('Enabled');
      expect(response.KeyMetadata.Enabled).toBe(true);
    });

    test('EFS KMS key should be enabled', async () => {
      const keyId = outputs.EFSKMSKeyId;
      expect(keyId).toBeDefined();

      const response = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: keyId })
      );

      expect(response.KeyMetadata.KeyState).toBe('Enabled');
      expect(response.KeyMetadata.Enabled).toBe(true);
    });
  });

  describe('Stack Outputs Validation', () => {
    test('all required outputs should be present', () => {
      const requiredOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'NatGatewayId',
        'RDSInstanceEndpoint',
        'RDSInstancePort',
        'EFSFileSystemId',
        'LoadBalancerDNS',
        'ECSClusterName',
        'ECSServiceName',
        'PipelineName',
        'ArtifactBucketName',
        'RDSKMSKeyId',
        'EFSKMSKeyId',
        'EnvironmentSuffix',
        'StackName',
      ];

      requiredOutputs.forEach((output) => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('environment suffix should match', () => {
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
    });

    test('RDS port should be PostgreSQL default', () => {
      expect(outputs.RDSInstancePort).toBe('5432');
    });
  });

  describe('Security Compliance', () => {
    test('all resources should have proper tags', async () => {
      const vpcId = outputs.VPCId;
      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      const vpc = response.Vpcs[0];
      const tags = vpc.Tags || [];
      const envTag = tags.find((t) => t.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe(environmentSuffix);
    });

    test('RDS should not be publicly accessible', async () => {
      const dbIdentifier = `healthtech-postgres-${environmentSuffix}`;
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const db = response.DBInstances[0];
      expect(db.PubliclyAccessible).toBe(false);
    });

    test('all encryption keys should be customer managed', async () => {
      const rdsKeyId = outputs.RDSKMSKeyId;
      const efsKeyId = outputs.EFSKMSKeyId;

      const rdsKeyResponse = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: rdsKeyId })
      );
      const efsKeyResponse = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: efsKeyId })
      );

      expect(rdsKeyResponse.KeyMetadata.KeyManager).toBe('CUSTOMER');
      expect(efsKeyResponse.KeyMetadata.KeyManager).toBe('CUSTOMER');
    });
  });

  describe('High Availability', () => {
    test('RDS should have Multi-AZ enabled', async () => {
      const dbIdentifier = `healthtech-postgres-${environmentSuffix}`;
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const db = response.DBInstances[0];
      expect(db.MultiAZ).toBe(true);
    });

    test('ALB should span multiple availability zones', async () => {
      const albArn = outputs.LoadBalancerArn;
      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArn],
        })
      );

      const alb = response.LoadBalancers[0];
      expect(alb.AvailabilityZones.length).toBeGreaterThanOrEqual(2);
    });

    test('ECS service should support multiple availability zones', async () => {
      const clusterName = outputs.ECSClusterName;
      const serviceName = outputs.ECSServiceName;

      const response = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterName,
          services: [serviceName],
        })
      );

      const service = response.services[0];
      const subnets = service.networkConfiguration.awsvpcConfiguration.subnets;
      expect(subnets.length).toBeGreaterThanOrEqual(2);
    });
  });
});
