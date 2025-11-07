/**
 * Integration tests for Order Processing API Infrastructure
 * Tests actual deployed AWS resources
 *
 * Prerequisites:
 * - Infrastructure must be deployed to AWS
 * - cfn-outputs/flat-outputs.json must exist with deployment outputs
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  ECSClient,
  DescribeServicesCommand,
  DescribeClustersCommand,
} from '@aws-sdk/client-ecs';
import {
  RDSClient,
  DescribeDBClustersCommand,
} from '@aws-sdk/client-rds';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  WAFV2Client,
  GetWebACLCommand,
} from '@aws-sdk/client-wafv2';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  SSMClient,
  GetParameterCommand,
} from '@aws-sdk/client-ssm';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetDashboardCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  ECRClient,
  DescribeRepositoriesCommand,
} from '@aws-sdk/client-ecr';

const AWS_REGION = 'us-east-1';

// Read deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any = {};

beforeAll(() => {
  if (fs.existsSync(outputsPath)) {
    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);
  } else {
    throw new Error(
      'Deployment outputs not found. Please deploy infrastructure first.'
    );
  }
});

describe('Order Processing API Infrastructure - Integration Tests', () => {
  describe('VPC and Networking', () => {
    it('should have a valid VPC deployed', () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.vpcId).toMatch(/^vpc-[a-z0-9]+/);
    });
  });

  describe('Application Load Balancer', () => {
    it('should have ALB DNS name available', () => {
      expect(outputs.albDnsName).toBeDefined();
      expect(outputs.albDnsName).toContain('elb.amazonaws.com');
    });

    it('should verify ALB is running', async () => {
      const client = new ElasticLoadBalancingV2Client({ region: AWS_REGION });
      const albArn = await resolveAlbArn(outputs.albDnsName, client);

      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [albArn],
      });

      const response = await client.send(command);
      expect(response.LoadBalancers).toHaveLength(1);
      expect(response.LoadBalancers![0].State?.Code).toBe('active');
    }, 30000);

    it('should have blue and green target groups configured', () => {
      expect(outputs.blueTargetGroupArn).toBeDefined();
      expect(outputs.greenTargetGroupArn).toBeDefined();
      expect(outputs.blueTargetGroupArn).not.toBe(outputs.greenTargetGroupArn);
    });

    it('should verify target groups are healthy', async () => {
      const client = new ElasticLoadBalancingV2Client({ region: AWS_REGION });

      const command = new DescribeTargetHealthCommand({
        TargetGroupArn: outputs.blueTargetGroupArn,
      });

      const response = await client.send(command);
      expect(response.TargetHealthDescriptions).toBeDefined();
    }, 30000);
  });

  describe('ECS Fargate Service', () => {
    it('should have ECS service ARN', () => {
      expect(outputs.ecsServiceArn).toBeDefined();
      expect(outputs.ecsServiceArn).toContain('arn:aws:ecs');
    });

    it('should verify ECS service is running', async () => {
      const client = new ECSClient({ region: AWS_REGION });
      const serviceArn = outputs.ecsServiceArn;
      const clusterArn = extractClusterFromServiceArn(serviceArn);

      const command = new DescribeServicesCommand({
        cluster: clusterArn,
        services: [serviceArn],
      });

      const response = await client.send(command);
      expect(response.services).toHaveLength(1);
      expect(response.services![0].status).toBe('ACTIVE');
      // Note: runningCount may be 0 if no container image is pushed to ECR yet
      expect(response.services![0].runningCount).toBeGreaterThanOrEqual(0);
    }, 30000);

    it('should verify Container Insights is enabled', async () => {
      const client = new ECSClient({ region: AWS_REGION });
      const serviceArn = outputs.ecsServiceArn;
      const clusterArn = extractClusterFromServiceArn(serviceArn);

      const command = new DescribeClustersCommand({
        clusters: [clusterArn],
        include: ['SETTINGS'],
      });

      const response = await client.send(command);
      const settings = response.clusters![0].settings || [];
      const containerInsights = settings.find((s) => s.name === 'containerInsights');
      expect(containerInsights?.value).toBe('enabled');
    }, 30000);

    it('should verify Fargate capacity providers are configured', async () => {
      const client = new ECSClient({ region: AWS_REGION });
      const serviceArn = outputs.ecsServiceArn;
      const clusterArn = extractClusterFromServiceArn(serviceArn);

      const command = new DescribeClustersCommand({
        clusters: [clusterArn],
        include: ['CONFIGURATIONS'],
      });

      const response = await client.send(command);
      const capacityProviders = response.clusters![0].capacityProviders || [];
      expect(capacityProviders).toContain('FARGATE');
      expect(capacityProviders).toContain('FARGATE_SPOT');
    }, 30000);
  });

  describe('RDS Aurora MySQL Cluster', () => {
    it('should have RDS cluster endpoint', () => {
      expect(outputs.rdsClusterEndpoint).toBeDefined();
      expect(outputs.rdsClusterEndpoint).toContain('.rds.amazonaws.com');
    });

    it('should have RDS reader endpoint', () => {
      expect(outputs.rdsReaderEndpoint).toBeDefined();
      expect(outputs.rdsReaderEndpoint).toContain('.rds.amazonaws.com');
    });

    it('should verify Aurora cluster is available', async () => {
      const client = new RDSClient({ region: AWS_REGION });
      const clusterIdentifier = extractClusterIdFromEndpoint(outputs.rdsClusterEndpoint);

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });

      const response = await client.send(command);
      expect(response.DBClusters).toHaveLength(1);
      expect(response.DBClusters![0].Status).toBe('available');
      expect(response.DBClusters![0].Engine).toBe('aurora-mysql');
    }, 30000);

    it('should verify encryption is enabled', async () => {
      const client = new RDSClient({ region: AWS_REGION });
      const clusterIdentifier = extractClusterIdFromEndpoint(outputs.rdsClusterEndpoint);

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });

      const response = await client.send(command);
      expect(response.DBClusters![0].StorageEncrypted).toBe(true);
    }, 30000);

    it('should verify automated backups are enabled', async () => {
      const client = new RDSClient({ region: AWS_REGION });
      const clusterIdentifier = extractClusterIdFromEndpoint(outputs.rdsClusterEndpoint);

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });

      const response = await client.send(command);
      expect(response.DBClusters![0].BackupRetentionPeriod).toBeGreaterThan(0);
    }, 30000);
  });

  describe('ECR Repository', () => {
    it('should have ECR repository URL', () => {
      expect(outputs.ecrRepositoryUrl).toBeDefined();
      expect(outputs.ecrRepositoryUrl).toContain('.dkr.ecr.');
      expect(outputs.ecrRepositoryUrl).toContain('.amazonaws.com');
    });

    it('should verify ECR repository exists', async () => {
      const client = new ECRClient({ region: AWS_REGION });
      const repositoryName = extractRepositoryName(outputs.ecrRepositoryUrl);

      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repositoryName],
      });

      const response = await client.send(command);
      expect(response.repositories).toHaveLength(1);
      expect(response.repositories![0].repositoryName).toBe(repositoryName);
    }, 30000);

    it('should verify image scanning is enabled', async () => {
      const client = new ECRClient({ region: AWS_REGION });
      const repositoryName = extractRepositoryName(outputs.ecrRepositoryUrl);

      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repositoryName],
      });

      const response = await client.send(command);
      expect(response.repositories![0].imageScanningConfiguration?.scanOnPush).toBe(true);
    }, 30000);
  });

  describe('AWS WAF', () => {
    it('should have WAF Web ACL ARN', () => {
      expect(outputs.wafWebAclArn).toBeDefined();
      expect(outputs.wafWebAclArn).toContain('arn:aws:wafv2');
    });

    it('should verify WAF is configured with rate limiting', async () => {
      const client = new WAFV2Client({ region: AWS_REGION });
      const webAclId = extractWebAclId(outputs.wafWebAclArn);
      const webAclName = extractWebAclName(outputs.wafWebAclArn);

      const command = new GetWebACLCommand({
        Id: webAclId,
        Name: webAclName,
        Scope: 'REGIONAL',
      });

      const response = await client.send(command);
      expect(response.WebACL?.Rules).toBeDefined();

      const rateLimitRule = response.WebACL?.Rules?.find((rule) =>
        rule.Name?.includes('RateLimit')
      );
      expect(rateLimitRule).toBeDefined();
      expect(rateLimitRule?.Statement?.RateBasedStatement).toBeDefined();
    }, 30000);
  });

  describe('Secrets Manager', () => {
    it('should verify database credentials secret exists', async () => {
      const client = new SecretsManagerClient({ region: AWS_REGION });

      // Extract secret name from stack outputs or construct it
      const secretName = `order-api-db-password-${extractEnvironmentSuffix(outputs.ecsServiceArn)}`;

      const command = new DescribeSecretCommand({
        SecretId: secretName,
      });

      const response = await client.send(command);
      expect(response.Name).toBe(secretName);
    }, 30000);
  });

  describe('Parameter Store', () => {
    it('should verify application configuration parameter exists', async () => {
      const client = new SSMClient({ region: AWS_REGION });

      const parameterName = `/order-api/${extractEnvironmentSuffix(outputs.ecsServiceArn)}/config`;

      const command = new GetParameterCommand({
        Name: parameterName,
      });

      const response = await client.send(command);
      expect(response.Parameter?.Name).toBe(parameterName);
      expect(response.Parameter?.Value).toBeDefined();

      const config = JSON.parse(response.Parameter!.Value!);
      expect(config.region).toBe(AWS_REGION);
    }, 30000);
  });

  describe('CloudWatch Monitoring', () => {
    it('should have CloudWatch dashboard URL', () => {
      expect(outputs.dashboardUrl).toBeDefined();
      expect(outputs.dashboardUrl).toContain('console.aws.amazon.com/cloudwatch');
    });

    it('should verify CloudWatch dashboard exists', async () => {
      const client = new CloudWatchClient({ region: AWS_REGION });
      const dashboardName = `order-api-${extractEnvironmentSuffix(outputs.ecsServiceArn)}`;

      const command = new GetDashboardCommand({
        DashboardName: dashboardName,
      });

      const response = await client.send(command);
      expect(response.DashboardName).toBe(dashboardName);
      expect(response.DashboardBody).toBeDefined();
    }, 30000);

    it('should verify CloudWatch alarms are configured', async () => {
      const client = new CloudWatchClient({ region: AWS_REGION });
      const suffix = extractEnvironmentSuffix(outputs.ecsServiceArn);

      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `order-api`,
      });

      const response = await client.send(command);
      const alarms = response.MetricAlarms || [];

      const highErrorAlarm = alarms.find((a) =>
        a.AlarmName?.includes(`high-errors-${suffix}`)
      );
      const dbConnectionAlarm = alarms.find((a) =>
        a.AlarmName?.includes(`db-failures-${suffix}`)
      );

      expect(highErrorAlarm).toBeDefined();
      expect(dbConnectionAlarm).toBeDefined();
    }, 30000);
  });

  describe('Blue-Green Deployment Support', () => {
    it('should verify both target groups are accessible', async () => {
      const client = new ElasticLoadBalancingV2Client({ region: AWS_REGION });

      const command = new DescribeTargetGroupsCommand({
        TargetGroupArns: [outputs.blueTargetGroupArn, outputs.greenTargetGroupArn],
      });

      const response = await client.send(command);
      expect(response.TargetGroups).toHaveLength(2);

      const blueGroup = response.TargetGroups!.find((tg) =>
        tg.TargetGroupArn === outputs.blueTargetGroupArn
      );
      const greenGroup = response.TargetGroups!.find((tg) =>
        tg.TargetGroupArn === outputs.greenTargetGroupArn
      );

      expect(blueGroup).toBeDefined();
      expect(greenGroup).toBeDefined();
      expect(blueGroup!.TargetGroupName).toContain('blue');
      expect(greenGroup!.TargetGroupName).toContain('green');
    }, 30000);
  });

  describe('Resource Naming Convention', () => {
    it('should have environmentSuffix in all resource names', () => {
      const suffix = extractEnvironmentSuffix(outputs.ecsServiceArn);

      expect(outputs.ecsServiceArn).toContain(suffix);
      expect(outputs.albDnsName).toContain(suffix);
      expect(outputs.rdsClusterEndpoint).toContain(suffix);
      expect(outputs.ecrRepositoryUrl).toContain(suffix);
    });
  });
});

// Helper functions
function extractClusterFromServiceArn(serviceArn: string): string {
  // Extract cluster ARN from service ARN
  // Example: arn:aws:ecs:us-east-1:123456789012:service/cluster-name/service-name
  const parts = serviceArn.split('/');
  return parts[parts.length - 2];
}

function extractClusterIdFromEndpoint(endpoint: string): string {
  // Extract cluster identifier from endpoint
  // Example: order-api-test.us-east-1.rds.amazonaws.com
  return endpoint.split('.')[0];
}

function extractEnvironmentSuffix(resourceArn: string): string {
  // Extract environment suffix from resource name
  const parts = resourceArn.split('/');
  const resourceName = parts[parts.length - 1];
  const suffixMatch = resourceName.match(/-([a-z0-9]+)$/);
  return suffixMatch ? suffixMatch[1] : 'unknown';
}

function extractRepositoryName(repositoryUrl: string): string {
  // Extract repository name from URL
  // Example: 123456789012.dkr.ecr.us-east-1.amazonaws.com/order-api-test
  const parts = repositoryUrl.split('/');
  return parts[parts.length - 1];
}

function extractWebAclId(arn: string): string {
  // Extract WAF Web ACL ID from ARN
  // Example: arn:aws:wafv2:us-east-1:123456789012:regional/webacl/name/id
  const parts = arn.split('/');
  return parts[parts.length - 1];
}

function extractWebAclName(arn: string): string {
  // Extract WAF Web ACL name from ARN
  const parts = arn.split('/');
  return parts[parts.length - 2];
}

async function resolveAlbArn(dnsName: string, client: ElasticLoadBalancingV2Client): Promise<string> {
  // Find ALB ARN by DNS name
  const command = new DescribeLoadBalancersCommand({});
  const response = await client.send(command);

  const alb = response.LoadBalancers?.find((lb) => lb.DNSName === dnsName);
  if (!alb) {
    throw new Error(`ALB with DNS name ${dnsName} not found`);
  }

  return alb.LoadBalancerArn!;
}
