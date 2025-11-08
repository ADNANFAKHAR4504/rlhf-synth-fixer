// Integration tests for TapStack infrastructure
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
} from '@aws-sdk/client-ec2';
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
} from '@aws-sdk/client-ecs';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeListenersCommand,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import fs from 'fs';

// Load deployment outputs
let outputs: any;
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
  // Handle nested structure (e.g., TapStackpr6073 object)
  const stackKey = Object.keys(outputs).find(key =>
    key.startsWith('TapStack')
  );
  if (stackKey) {
    outputs = outputs[stackKey];
  }
} catch (error) {
  console.log('⚠️  No deployment outputs found, skipping integration tests');
  outputs = null;
}

// Initialize AWS SDK clients
const awsRegion = outputs?.['aws-region'] || 'us-east-1';
const ec2Client = new EC2Client({ region: awsRegion });
const ecsClient = new ECSClient({ region: awsRegion });
const elbClient = new ElasticLoadBalancingV2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const secretsClient = new SecretsManagerClient({ region: awsRegion });

// Skip all tests if no outputs are available
const describeOrSkip = outputs ? describe : describe.skip;

describeOrSkip('TapStack Infrastructure Integration Tests', () => {
  describe('VPC and Network Configuration', () => {
    it('should have VPC deployed with correct configuration', async () => {
      expect(outputs['vpc-id']).toBeDefined();
      expect(outputs['vpc-id']).toMatch(/^vpc-[a-z0-9]+$/);

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs['vpc-id']],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(outputs['vpc-id']);
      expect(vpc.State).toBe('available');
      // Note: EnableDnsSupport and EnableDnsHostnames are not returned in DescribeVpcs
      // They would need separate DescribeVpcAttribute calls to verify
    });

    it('should have public subnets in multiple AZs', async () => {
      expect(outputs['public-subnet-ids']).toBeDefined();
      expect(Array.isArray(outputs['public-subnet-ids'])).toBe(true);
      expect(outputs['public-subnet-ids'].length).toBeGreaterThanOrEqual(2);

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: outputs['public-subnet-ids'],
        })
      );

      expect(response.Subnets).toBeDefined();
      const subnets = response.Subnets!;
      expect(subnets.length).toBe(outputs['public-subnet-ids'].length);

      // Verify subnets are in different AZs
      const azs = new Set(subnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);

      // Verify all subnets belong to the correct VPC
      subnets.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs['vpc-id']);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    it('should have private subnets in multiple AZs', async () => {
      expect(outputs['private-subnet-ids']).toBeDefined();
      expect(Array.isArray(outputs['private-subnet-ids'])).toBe(true);
      expect(outputs['private-subnet-ids'].length).toBeGreaterThanOrEqual(2);

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: outputs['private-subnet-ids'],
        })
      );

      expect(response.Subnets).toBeDefined();
      const subnets = response.Subnets!;
      expect(subnets.length).toBe(outputs['private-subnet-ids'].length);

      // Verify subnets are in different AZs
      const azs = new Set(subnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);

      // Verify all subnets belong to the correct VPC
      subnets.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs['vpc-id']);
      });
    });
  });

  describe('Application Load Balancer', () => {
    it('should have ALB deployed and active', async () => {
      expect(outputs['alb-arn']).toBeDefined();
      expect(outputs['alb-dns-name']).toBeDefined();

      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [outputs['alb-arn']],
        })
      );

      expect(response.LoadBalancers).toHaveLength(1);
      const alb = response.LoadBalancers![0];
      expect(alb.LoadBalancerArn).toBe(outputs['alb-arn']);
      expect(alb.DNSName).toBe(outputs['alb-dns-name']);
      expect(alb.State?.Code).toBe('active');
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.VpcId).toBe(outputs['vpc-id']);
    });

    it('should have HTTP listener configured', async () => {
      const response = await elbClient.send(
        new DescribeListenersCommand({
          LoadBalancerArn: outputs['alb-arn'],
        })
      );

      expect(response.Listeners).toBeDefined();
      const httpListener = response.Listeners!.find(l => l.Port === 80);
      expect(httpListener).toBeDefined();
      expect(httpListener!.Protocol).toBe('HTTP');
      expect(httpListener!.DefaultActions).toBeDefined();

      // Check if HTTPS is enabled
      const httpsEnabled = outputs['https-enabled'] === 'true';
      if (httpsEnabled) {
        // Should redirect to HTTPS
        expect(httpListener!.DefaultActions![0].Type).toBe('redirect');
        expect(httpListener!.DefaultActions![0].RedirectConfig?.Protocol).toBe(
          'HTTPS'
        );
      } else {
        // Should forward to target group
        expect(httpListener!.DefaultActions![0].Type).toBe('forward');
        expect(httpListener!.DefaultActions![0].TargetGroupArn).toBeDefined();
      }
    });

    it('should have target group with health checks', async () => {
      const listenersResponse = await elbClient.send(
        new DescribeListenersCommand({
          LoadBalancerArn: outputs['alb-arn'],
        })
      );

      const listener = listenersResponse.Listeners![0];
      const targetGroupArn = listener.DefaultActions![0].TargetGroupArn;
      expect(targetGroupArn).toBeDefined();

      const tgResponse = await elbClient.send(
        new DescribeTargetGroupsCommand({
          TargetGroupArns: [targetGroupArn!],
        })
      );

      expect(tgResponse.TargetGroups).toHaveLength(1);
      const tg = tgResponse.TargetGroups![0];
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.Port).toBe(8080);
      expect(tg.VpcId).toBe(outputs['vpc-id']);
      expect(tg.HealthCheckEnabled).toBe(true);
      expect(tg.HealthCheckPath).toBe('/health');
      expect(tg.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.HealthyThresholdCount).toBe(2);
      expect(tg.UnhealthyThresholdCount).toBe(3);
    });

    it('should have application URL accessible via HTTP', () => {
      expect(outputs['application-url']).toBeDefined();
      const httpsEnabled = outputs['https-enabled'] === 'true';

      if (httpsEnabled) {
        expect(outputs['application-url']).toMatch(/^https:\/\//);
      } else {
        expect(outputs['application-url']).toMatch(/^http:\/\//);
        expect(outputs['application-url']).toContain(outputs['alb-dns-name']);
      }
    });
  });

  describe('ECS Cluster and Service', () => {
    it('should have ECS cluster deployed and active', async () => {
      expect(outputs['ecs-cluster-name']).toBeDefined();

      const response = await ecsClient.send(
        new DescribeClustersCommand({
          clusters: [outputs['ecs-cluster-name']],
        })
      );

      expect(response.clusters).toHaveLength(1);
      const cluster = response.clusters![0];
      expect(cluster.clusterName).toBe(outputs['ecs-cluster-name']);
      expect(cluster.status).toBe('ACTIVE');
      expect(cluster.registeredContainerInstancesCount).toBeGreaterThanOrEqual(
        0
      );
    });

    it('should have ECS service with Fargate Spot', async () => {
      expect(outputs['ecs-service-name']).toBeDefined();

      const response = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: outputs['ecs-cluster-name'],
          services: [outputs['ecs-service-name']],
        })
      );

      expect(response.services).toHaveLength(1);
      const service = response.services![0];
      expect(service.serviceName).toBe(outputs['ecs-service-name']);
      expect(service.status).toBe('ACTIVE');
      expect(service.desiredCount).toBe(3);
      expect(service.launchType).toBeUndefined(); // Should not be set when using capacity provider
      expect(service.capacityProviderStrategy).toBeDefined();
      expect(service.capacityProviderStrategy).toHaveLength(1);
      expect(service.capacityProviderStrategy![0].capacityProvider).toBe(
        'FARGATE_SPOT'
      );
      expect(service.capacityProviderStrategy![0].weight).toBe(100);
    });

    it('should have ECS service in private subnets', async () => {
      const response = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: outputs['ecs-cluster-name'],
          services: [outputs['ecs-service-name']],
        })
      );

      const service = response.services![0];
      expect(service.networkConfiguration).toBeDefined();
      expect(service.networkConfiguration!.awsvpcConfiguration).toBeDefined();

      const subnets =
        service.networkConfiguration!.awsvpcConfiguration!.subnets!;
      expect(subnets.length).toBeGreaterThanOrEqual(2);

      // Verify subnets match the private subnet IDs
      subnets.forEach(subnet => {
        expect(outputs['private-subnet-ids']).toContain(subnet);
      });
    });
  });

  describe('RDS Database', () => {
    it('should have RDS instance deployed and available', async () => {
      expect(outputs['rds-endpoint']).toBeDefined();

      // Extract DB instance identifier from endpoint
      const dbIdentifier = outputs['rds-endpoint']
        .split('.')[0]
        .replace(/:.*$/, '');

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      expect(response.DBInstances).toHaveLength(1);
      const db = response.DBInstances![0];
      expect(db.DBInstanceStatus).toBe('available');
      expect(db.Engine).toBe('postgres');
      expect(db.DBInstanceClass).toBe('db.t3.medium');
      expect(db.AllocatedStorage).toBe(20);
      expect(db.MultiAZ).toBe(true);
      expect(db.PubliclyAccessible).toBe(false);
      expect(db.VpcSecurityGroups).toBeDefined();
      expect(db.VpcSecurityGroups!.length).toBeGreaterThan(0);
      expect(db.VpcSecurityGroups![0].Status).toBe('active');
    });

    it('should have database endpoint in correct format', () => {
      expect(outputs['rds-endpoint']).toMatch(
        /^[a-z0-9-]+\.[a-z0-9]+\.[a-z0-9-]+\.rds\.amazonaws\.com:\d+$/
      );
    });
  });

  describe('Secrets Manager', () => {
    it('should have database connection secret', async () => {
      expect(outputs['db-secret-arn']).toBeDefined();

      const response = await secretsClient.send(
        new GetSecretValueCommand({
          SecretId: outputs['db-secret-arn'],
        })
      );

      expect(response.SecretString).toBeDefined();
      const secret = JSON.parse(response.SecretString!);

      expect(secret.username).toBe('dbadmin');
      expect(secret.password).toBeDefined();
      expect(secret.password.length).toBeGreaterThan(16);
      expect(secret.engine).toBe('postgres');
      expect(secret.host).toBeDefined();
      // Port can be either number or string depending on how it's stored
      expect(secret.port).toBeDefined();
      expect(String(secret.port)).toBe('5432');
      expect(secret.dbname).toBe('paymentdb');
    });
  });

  describe('CloudWatch Logs', () => {
    it('should have CloudWatch log group configured', () => {
      expect(outputs['cloudwatch-log-group']).toBeDefined();
      expect(outputs['cloudwatch-log-group']).toMatch(/^\/ecs\//);
    });
  });

  describe('ECR Repository', () => {
    it('should have ECR repository URL', () => {
      expect(outputs['ecr-repository-url']).toBeDefined();
      expect(outputs['ecr-repository-url']).toMatch(
        /^[0-9]+\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com\//
      );
    });
  });

  describe('HTTPS Configuration', () => {
    it('should indicate HTTPS status', () => {
      expect(outputs['https-enabled']).toBeDefined();
      expect(['true', 'false']).toContain(outputs['https-enabled']);
    });

    it('should not have certificate when HTTPS is disabled', () => {
      if (outputs['https-enabled'] === 'false') {
        expect(outputs['certificate-arn']).toBeUndefined();
        expect(outputs['hosted-zone-id']).toBeUndefined();
        expect(outputs['hosted-zone-nameservers']).toBeUndefined();
      }
    });
  });

  describe('Resource Tagging and Naming', () => {
    it('should have consistent environment suffix in resource names', () => {
      const resources = [
        outputs['ecs-cluster-name'],
        outputs['ecs-service-name'],
        outputs['cloudwatch-log-group'],
        outputs['ecr-repository-url'],
      ];

      // Extract environment suffix from first resource
      const clusterName = outputs['ecs-cluster-name'];
      const suffix = clusterName.split('-').pop();

      resources.forEach(resource => {
        if (resource) {
          expect(resource).toContain(suffix);
        }
      });
    });
  });

  describe('High Availability Configuration', () => {
    it('should have resources distributed across multiple AZs', async () => {
      // Check public subnets
      const publicSubnetsResponse = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: outputs['public-subnet-ids'],
        })
      );
      const publicAzs = new Set(
        publicSubnetsResponse.Subnets!.map(s => s.AvailabilityZone)
      );
      expect(publicAzs.size).toBeGreaterThanOrEqual(2);

      // Check private subnets
      const privateSubnetsResponse = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: outputs['private-subnet-ids'],
        })
      );
      const privateAzs = new Set(
        privateSubnetsResponse.Subnets!.map(s => s.AvailabilityZone)
      );
      expect(privateAzs.size).toBeGreaterThanOrEqual(2);

      // Check ALB
      const albResponse = await elbClient.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [outputs['alb-arn']],
        })
      );
      const albAzs = albResponse.LoadBalancers![0].AvailabilityZones;
      expect(albAzs!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Security Configuration', () => {
    it('should have database in private subnet only', async () => {
      const dbIdentifier = outputs['rds-endpoint']
        .split('.')[0]
        .replace(/:.*$/, '');

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const db = response.DBInstances![0];
      expect(db.PubliclyAccessible).toBe(false);
    });

    it('should have ECS service with security groups', async () => {
      const response = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: outputs['ecs-cluster-name'],
          services: [outputs['ecs-service-name']],
        })
      );

      const service = response.services![0];
      expect(
        service.networkConfiguration!.awsvpcConfiguration!.securityGroups
      ).toBeDefined();
      expect(
        service.networkConfiguration!.awsvpcConfiguration!.securityGroups!
          .length
      ).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Infrastructure Validation', () => {
    it('should have all required outputs', () => {
      const requiredOutputs = [
        'vpc-id',
        'public-subnet-ids',
        'private-subnet-ids',
        'alb-arn',
        'alb-dns-name',
        'application-url',
        'ecs-cluster-name',
        'ecs-service-name',
        'rds-endpoint',
        'db-secret-arn',
        'ecr-repository-url',
        'cloudwatch-log-group',
        'aws-account-id',
        'aws-region',
        'https-enabled',
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
      });
    });

    it('should have infrastructure ready for application deployment', async () => {
      // Verify VPC is available
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs['vpc-id']],
        })
      );
      expect(vpcResponse.Vpcs![0].State).toBe('available');

      // Verify ALB is active
      const albResponse = await elbClient.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [outputs['alb-arn']],
        })
      );
      expect(albResponse.LoadBalancers![0].State?.Code).toBe('active');

      // Verify ECS cluster is active
      const ecsResponse = await ecsClient.send(
        new DescribeClustersCommand({
          clusters: [outputs['ecs-cluster-name']],
        })
      );
      expect(ecsResponse.clusters![0].status).toBe('ACTIVE');

      // Verify RDS is available
      const dbIdentifier = outputs['rds-endpoint']
        .split('.')[0]
        .replace(/:.*$/, '');
      const rdsResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );
      expect(rdsResponse.DBInstances![0].DBInstanceStatus).toBe('available');
    });
  });
});
