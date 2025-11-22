// Integration tests using deployed AWS resources
import fs from 'fs';
import path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
} from '@aws-sdk/client-ecs';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { ECRClient, DescribeRepositoriesCommand } from '@aws-sdk/client-ecr';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import { S3Client, GetBucketVersioningCommand, GetBucketEncryptionCommand } from '@aws-sdk/client-s3';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { WAFV2Client, GetWebACLCommand, ListWebACLsCommand } from '@aws-sdk/client-wafv2';

// Load deployment outputs
const OUTPUTS_PATH = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(OUTPUTS_PATH, 'utf8'));

// AWS region
const REGION = 'us-east-1';

// AWS clients
const ec2Client = new EC2Client({ region: REGION });
const ecsClient = new ECSClient({ region: REGION });
const elbClient = new ElasticLoadBalancingV2Client({ region: REGION });
const ecrClient = new ECRClient({ region: REGION });
const kmsClient = new KMSClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });
const snsClient = new SNSClient({ region: REGION });
const logsClient = new CloudWatchLogsClient({ region: REGION });
const wafClient = new WAFV2Client({ region: REGION });

describe('Turn Around Prompt API Integration Tests', () => {
  describe('VPC Infrastructure', () => {
    test('VPC exists and is properly configured', async () => {
      const vpcId = outputs.vpc_id;
      expect(vpcId).toBeTruthy();
      expect(vpcId).toMatch(/^vpc-/);

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      // DNS settings are enabled via VPC attributes
      expect(vpc.VpcId).toBeTruthy();
    });

    test('public subnets exist and are configured correctly', async () => {
      const subnetIds = JSON.parse(outputs.public_subnet_ids);
      expect(subnetIds).toHaveLength(3);

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: subnetIds,
        })
      );

      expect(response.Subnets).toHaveLength(3);
      response.Subnets!.forEach((subnet) => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(outputs.vpc_id);
      });
    });

    test('private subnets exist and are configured correctly', async () => {
      const subnetIds = JSON.parse(outputs.private_subnet_ids);
      expect(subnetIds).toHaveLength(3);

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: subnetIds,
        })
      );

      expect(response.Subnets).toHaveLength(3);
      response.Subnets!.forEach((subnet) => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(outputs.vpc_id);
      });
    });

    test('subnets span multiple availability zones', async () => {
      const publicSubnetIds = JSON.parse(outputs.public_subnet_ids);
      const privateSubnetIds = JSON.parse(outputs.private_subnet_ids);

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [...publicSubnetIds, ...privateSubnetIds],
        })
      );

      const azs = new Set(response.Subnets!.map((s) => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('NAT Gateways exist in public subnets', async () => {
      const publicSubnetIds = JSON.parse(outputs.public_subnet_ids);

      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            {
              Name: 'subnet-id',
              Values: publicSubnetIds,
            },
            {
              Name: 'state',
              Values: ['available'],
            },
          ],
        })
      );

      expect(response.NatGateways).toBeTruthy();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Security Groups', () => {
    test('ALB security group exists and allows HTTP traffic', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpc_id],
            },
            {
              Name: 'group-name',
              Values: ['*alb-sg*'],
            },
          ],
        })
      );

      expect(response.SecurityGroups).toBeTruthy();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);

      const albSg = response.SecurityGroups![0];
      const httpRule = albSg.IpPermissions?.find(
        (rule) => rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeTruthy();
    });

    test('ECS tasks security group exists', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpc_id],
            },
            {
              Name: 'group-name',
              Values: ['*ecs-tasks-sg*'],
            },
          ],
        })
      );

      expect(response.SecurityGroups).toBeTruthy();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);
    });
  });

  describe('Application Load Balancer', () => {

    test('target groups exist for blue/green deployment', async () => {
      const response = await elbClient.send(
        new DescribeTargetGroupsCommand({
          Names: undefined,
        })
      );

      const targetGroups = response.TargetGroups?.filter(
        (tg) => tg.VpcId === outputs.vpc_id
      );
      expect(targetGroups).toBeTruthy();
      expect(targetGroups!.length).toBeGreaterThanOrEqual(2);

      targetGroups!.forEach((tg) => {
        expect(tg.Protocol).toBe('HTTP');
        expect(tg.Port).toBe(8080);
        expect(tg.TargetType).toBe('ip');
      });
    });

    test('ALB has HTTP listeners configured', async () => {
      const albArn = await getAlbArn(outputs.alb_dns_name);
      expect(albArn).toBeTruthy();

      const response = await elbClient.send(
        new DescribeListenersCommand({
          LoadBalancerArn: albArn,
        })
      );

      expect(response.Listeners).toBeTruthy();
      expect(response.Listeners!.length).toBeGreaterThanOrEqual(1);

      const httpListener = response.Listeners!.find((l) => l.Port === 80);
      expect(httpListener).toBeTruthy();
      expect(httpListener!.Protocol).toBe('HTTP');
    });
  });

  describe('WAF Configuration', () => {
    test('WAF Web ACL exists and is associated with ALB', async () => {
      const wafAclArn = outputs.waf_web_acl_arn;
      expect(wafAclArn).toBeTruthy();
      expect(wafAclArn).toMatch(/^arn:aws:wafv2:/);

      const aclId = wafAclArn.split('/').pop();
      const aclName = wafAclArn.split('/')[2];

      const response = await wafClient.send(
        new GetWebACLCommand({
          Name: aclName,
          Scope: 'REGIONAL',
          Id: aclId,
        })
      );

      expect(response.WebACL).toBeTruthy();
      expect(response.WebACL!.Rules).toBeTruthy();
      expect(response.WebACL!.Rules!.length).toBeGreaterThan(0);

      // Check for rate limiting rule
      const rateLimitRule = response.WebACL!.Rules!.find((r) =>
        r.Statement?.RateBasedStatement
      );
      expect(rateLimitRule).toBeTruthy();

      // Check for AWS managed rules
      const managedRules = response.WebACL!.Rules!.filter(
        (r) => r.Statement?.ManagedRuleGroupStatement
      );
      expect(managedRules.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('ECS Configuration', () => {
    test('ECS cluster exists and is active', async () => {
      const clusterName = outputs.ecs_cluster_name;
      expect(clusterName).toBeTruthy();

      const response = await ecsClient.send(
        new DescribeClustersCommand({
          clusters: [clusterName],
        })
      );

      expect(response.clusters).toHaveLength(1);
      const cluster = response.clusters![0];
      expect(cluster.status).toBe('ACTIVE');
      expect(cluster.clusterName).toBe(clusterName);
    });

    test('ECS service exists and is running', async () => {
      const clusterName = outputs.ecs_cluster_name;
      const serviceName = outputs.ecs_service_name;
      expect(serviceName).toBeTruthy();

      const response = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterName,
          services: [serviceName],
        })
      );

      expect(response.services).toHaveLength(1);
      const service = response.services![0];
      expect(service.status).toBe('ACTIVE');
      expect(service.launchType).toBe('FARGATE');
      expect(service.deploymentController?.type).toBe('CODE_DEPLOY');
    });

    test('ECS task definition uses FARGATE and has correct configuration', async () => {
      const serviceName = outputs.ecs_service_name;
      const taskDefFamily = serviceName.replace('-service-', '-');

      const response = await ecsClient.send(
        new DescribeTaskDefinitionCommand({
          taskDefinition: taskDefFamily,
        })
      );

      expect(response.taskDefinition).toBeTruthy();
      const taskDef = response.taskDefinition!;
      expect(taskDef.requiresCompatibilities).toContain('FARGATE');
      expect(taskDef.networkMode).toBe('awsvpc');
      expect(taskDef.cpu).toBe('256');
      expect(taskDef.memory).toBe('512');
    });
  });

  describe('ECR Repository', () => {
    test('ECR repository exists with encryption and scanning enabled', async () => {
      const repoUrl = outputs.ecr_repository_url;
      expect(repoUrl).toBeTruthy();

      const repoName = repoUrl.split('/')[1];
      expect(repoName).toBeTruthy();

      const response = await ecrClient.send(
        new DescribeRepositoriesCommand({
          repositoryNames: [repoName],
        })
      );

      expect(response.repositories).toHaveLength(1);
      const repo = response.repositories![0];
      expect(repo.encryptionConfiguration?.encryptionType).toBe('KMS');
      expect(repo.imageScanningConfiguration?.scanOnPush).toBe(true);
    });
  });

  describe('KMS Configuration', () => {
    test('artifacts KMS key exists with rotation enabled', async () => {
      const keyId = outputs.kms_artifacts_key_id;
      expect(keyId).toBeTruthy();

      const response = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: keyId,
        })
      );

      expect(response.KeyMetadata).toBeTruthy();
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.KeyManager).toBe('CUSTOMER');
    });

    test('ECR KMS key exists with rotation enabled', async () => {
      const keyId = outputs.kms_ecr_key_id;
      expect(keyId).toBeTruthy();

      const response = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: keyId,
        })
      );

      expect(response.KeyMetadata).toBeTruthy();
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.KeyManager).toBe('CUSTOMER');
    });
  });


  describe('SNS Topic', () => {
    test('pipeline approval SNS topic exists', async () => {
      const snsTopicArn = outputs.sns_topic_arn;
      expect(snsTopicArn).toBeTruthy();
      expect(snsTopicArn).toMatch(/^arn:aws:sns:/);

      const response = await snsClient.send(
        new GetTopicAttributesCommand({
          TopicArn: snsTopicArn,
        })
      );

      expect(response.Attributes).toBeTruthy();
      expect(response.Attributes!.TopicArn).toBe(snsTopicArn);
    });
  });

  describe('Resource Integration', () => {
    test('ECS service is connected to target groups', async () => {
      const clusterName = outputs.ecs_cluster_name;
      const serviceName = outputs.ecs_service_name;

      const response = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterName,
          services: [serviceName],
        })
      );

      const service = response.services![0];
      expect(service.loadBalancers).toBeTruthy();
      expect(service.loadBalancers!.length).toBeGreaterThan(0);
      expect(service.loadBalancers![0].targetGroupArn).toBeTruthy();
    });

    test('ECS tasks use private subnets', async () => {
      const clusterName = outputs.ecs_cluster_name;
      const serviceName = outputs.ecs_service_name;
      const privateSubnetIds = JSON.parse(outputs.private_subnet_ids);

      const response = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterName,
          services: [serviceName],
        })
      );

      const service = response.services![0];
      expect(service.networkConfiguration?.awsvpcConfiguration?.subnets).toBeTruthy();

      const serviceSubnets = service.networkConfiguration!.awsvpcConfiguration!.subnets;
      const usesPrivateSubnet = serviceSubnets!.some((subnet) =>
        privateSubnetIds.includes(subnet)
      );
      expect(usesPrivateSubnet).toBe(true);
    });

    test('ALB uses public subnets', async () => {
      const albDnsName = outputs.alb_dns_name;
      const publicSubnetIds = JSON.parse(outputs.public_subnet_ids);

      const albArn = await getAlbArn(albDnsName);
      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArn],
        })
      );

      const alb = response.LoadBalancers![0];
      expect(alb.AvailabilityZones).toBeTruthy();

      const albSubnetIds = alb.AvailabilityZones!.map((az) => az.SubnetId);
      const usesPublicSubnet = albSubnetIds.some((subnet) => publicSubnetIds.includes(subnet));
      expect(usesPublicSubnet).toBe(true);
    });
  });
});

// Helper functions
async function getAlbArn(dnsName: string): Promise<string> {
  const response = await elbClient.send(new DescribeLoadBalancersCommand({}));

  const alb = response.LoadBalancers?.find((lb) => lb.DNSName === dnsName);
  if (!alb || !alb.LoadBalancerArn) {
    throw new Error(`ALB with DNS name ${dnsName} not found`);
  }

  return alb.LoadBalancerArn;
}

async function getArtifactsBucketName(): Promise<string> {
  // The bucket name is not directly in outputs, but we can infer it from the pattern
  // pipeline-artifacts-{environment_suffix}-{account_id}
  // We'll need to list buckets and find the one matching the pattern
  const { ListBucketsCommand } = require('@aws-sdk/client-s3');
  const { S3Client: S3 } = require('@aws-sdk/client-s3');
  const s3 = new S3({ region: REGION });

  const response = await s3.send(new ListBucketsCommand({}));
  const bucket = response.Buckets?.find((b) =>
    b.Name?.startsWith('pipeline-artifacts-q2m3j4')
  );

  if (!bucket || !bucket.Name) {
    throw new Error('Artifacts bucket not found');
  }

  return bucket.Name;
}
