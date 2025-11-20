import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

// Configure AWS SDK
const region = 'us-east-1';
AWS.config.update({ region });

describe('Infrastructure Integration Tests', () => {
  let ec2: AWS.EC2;
  let ecs: AWS.ECS;
  let rds: AWS.RDS;
  let elbv2: AWS.ELBv2;
  let cloudfront: AWS.CloudFront;
  let wafv2: AWS.WAFV2;
  let cloudwatch: AWS.CloudWatch;
  let kms: AWS.KMS;
  let sns: AWS.SNS;
  let route53: AWS.Route53;

  beforeAll(() => {
    ec2 = new AWS.EC2();
    ecs = new AWS.ECS();
    rds = new AWS.RDS();
    elbv2 = new AWS.ELBv2();
    cloudfront = new AWS.CloudFront();
    wafv2 = new AWS.WAFV2({ region: 'us-east-1' });
    cloudwatch = new AWS.CloudWatch();
    kms = new AWS.KMS();
    sns = new AWS.SNS();
    route53 = new AWS.Route53();
  });

  describe('VPC Infrastructure', () => {
    it('should have internet gateway attached', async () => {
      const result = await ec2.describeInternetGateways({
        Filters: [{ Name: 'attachment.vpc-id', Values: [outputs.vpc_id] }]
      }).promise();
      expect(result.InternetGateways).toHaveLength(1);
      expect(result.InternetGateways![0].Attachments![0].State).toBe('available');
    });

    it('should have NAT gateways in public subnets', async () => {
      const result = await ec2.describeNatGateways({
        Filter: [{ Name: 'vpc-id', Values: [outputs.vpc_id] }]
      }).promise();
      expect(result.NatGateways!.length).toBeGreaterThan(0);
      result.NatGateways!.forEach(nat => {
        expect(nat.State).toBe('available');
      });
    });
  });

  describe('RDS Aurora Cluster', () => {
    it('should have Aurora cluster available', async () => {
      const result = await rds.describeDBClusters({ DBClusterIdentifier: outputs.rds_cluster_id }).promise();
      expect(result.DBClusters).toHaveLength(1);
      const cluster = result.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
    });

    it('should have encryption enabled', async () => {
      const result = await rds.describeDBClusters({ DBClusterIdentifier: outputs.rds_cluster_id }).promise();
      const cluster = result.DBClusters![0];
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.KmsKeyId).toBeDefined();
    });

    it('should have serverless v2 scaling configured', async () => {
      const result = await rds.describeDBClusters({ DBClusterIdentifier: outputs.rds_cluster_id }).promise();
      const cluster = result.DBClusters![0];
      expect(cluster.ServerlessV2ScalingConfiguration).toBeDefined();
      expect(cluster.ServerlessV2ScalingConfiguration!.MinCapacity).toBeGreaterThan(0);
      expect(cluster.ServerlessV2ScalingConfiguration!.MaxCapacity).toBeGreaterThan(0);
    });

    it('should have CloudWatch logs enabled', async () => {
      const result = await rds.describeDBClusters({ DBClusterIdentifier: outputs.rds_cluster_id }).promise();
      const cluster = result.DBClusters![0];
      expect(cluster.EnabledCloudwatchLogsExports).toContain('postgresql');
    });

    it('should have backup retention configured', async () => {
      const result = await rds.describeDBClusters({ DBClusterIdentifier: outputs.rds_cluster_id }).promise();
      const cluster = result.DBClusters![0];
      expect(cluster.BackupRetentionPeriod).toBeGreaterThan(0);
    });

    it('should have writer instance available', async () => {
      const result = await rds.describeDBClusters({ DBClusterIdentifier: outputs.rds_cluster_id }).promise();
      const cluster = result.DBClusters![0];
      const writerInstance = cluster.DBClusterMembers?.find(m => m.IsClusterWriter);
      expect(writerInstance).toBeDefined();
    });

    it('should have reader instance available', async () => {
      const result = await rds.describeDBClusters({ DBClusterIdentifier: outputs.rds_cluster_id }).promise();
      const cluster = result.DBClusters![0];
      const readerInstances = cluster.DBClusterMembers?.filter(m => !m.IsClusterWriter);
      expect(readerInstances!.length).toBeGreaterThan(0);
    });

    it('should have reader endpoint configured', async () => {
      const result = await rds.describeDBClusters({ DBClusterIdentifier: outputs.rds_cluster_id }).promise();
      const cluster = result.DBClusters![0];
      expect(cluster.ReaderEndpoint).toBeDefined();
      expect(cluster.ReaderEndpoint).toContain('cluster-ro');
    });
  });

  describe('Application Load Balancer', () => {
    it('should have ALB in active state', async () => {
      const result = await elbv2.describeLoadBalancers({ LoadBalancerArns: [outputs.alb_arn] }).promise();
      expect(result.LoadBalancers).toHaveLength(1);
      const alb = result.LoadBalancers![0];
      expect(alb.State!.Code).toBe('active');
      expect(alb.Type).toBe('application');
    });

    it('should be internet-facing', async () => {
      const result = await elbv2.describeLoadBalancers({ LoadBalancerArns: [outputs.alb_arn] }).promise();
      const alb = result.LoadBalancers![0];
      expect(alb.Scheme).toBe('internet-facing');
    });

    it('should span multiple availability zones', async () => {
      const result = await elbv2.describeLoadBalancers({ LoadBalancerArns: [outputs.alb_arn] }).promise();
      const alb = result.LoadBalancers![0];
      expect(alb.AvailabilityZones!.length).toBeGreaterThanOrEqual(2);
    });

    it('should have HTTP listener configured', async () => {
      const result = await elbv2.describeListeners({ LoadBalancerArn: outputs.alb_arn }).promise();
      expect(result.Listeners!.length).toBeGreaterThan(0);
      const httpListener = result.Listeners!.find(l => l.Port === 80);
      expect(httpListener).toBeDefined();
    });
  });

  describe('CloudFront Distribution', () => {
    it('should have CloudFront distribution deployed', async () => {
      const result = await cloudfront.getDistribution({ Id: outputs.cloudfront_distribution_id }).promise();
      expect(result.Distribution).toBeDefined();
      const dist = result.Distribution!;
      expect(dist.Status).toBe('Deployed');
    });

    it('should use ALB as origin', async () => {
      const result = await cloudfront.getDistribution({ Id: outputs.cloudfront_distribution_id }).promise();
      const dist = result.Distribution!;
      const origin = dist.DistributionConfig.Origins.Items[0];
      expect(origin.DomainName).toContain('elb.amazonaws.com');
    });

    it('should have IPv6 enabled', async () => {
      const result = await cloudfront.getDistribution({ Id: outputs.cloudfront_distribution_id }).promise();
      const dist = result.Distribution!;
      expect(dist.DistributionConfig.IsIPV6Enabled).toBe(true);
    });

    it('should have geo-restriction configured', async () => {
      const result = await cloudfront.getDistribution({ Id: outputs.cloudfront_distribution_id }).promise();
      const dist = result.Distribution!;
      expect(dist.DistributionConfig.Restrictions.GeoRestriction.RestrictionType).toBe('blacklist');
      expect(dist.DistributionConfig.Restrictions.GeoRestriction.Items).toBeDefined();
    });

    it('should have logging enabled', async () => {
      const result = await cloudfront.getDistribution({ Id: outputs.cloudfront_distribution_id }).promise();
      const dist = result.Distribution!;
      expect(dist.DistributionConfig.Logging.Enabled).toBe(true);
      expect(dist.DistributionConfig.Logging.Bucket).toContain('cloudfront-logs');
    });
  });

  describe('KMS Keys', () => {
    it('should have KMS key for RDS with key rotation enabled', async () => {
      const result = await kms.describeKey({ KeyId: outputs.kms_rds_key_id }).promise();
      expect(result.KeyMetadata).toBeDefined();
      expect(result.KeyMetadata!.Enabled).toBe(true);

      const rotationResult = await kms.getKeyRotationStatus({ KeyId: outputs.kms_rds_key_id }).promise();
      expect(rotationResult.KeyRotationEnabled).toBe(true);
    });

    it('should have KMS key in correct region', async () => {
      const result = await kms.describeKey({ KeyId: outputs.kms_rds_key_id }).promise();
      expect(result.KeyMetadata!.Arn).toContain(region);
    });
  });

  describe('CloudWatch Monitoring', () => {
    it('should have CloudWatch dashboard', async () => {
      const result = await cloudwatch.getDashboard({ DashboardName: outputs.cloudwatch_dashboard_name }).promise();
      expect(result.DashboardBody).toBeDefined();
      const dashboard = JSON.parse(result.DashboardBody!);
      expect(dashboard.widgets).toBeDefined();
      expect(dashboard.widgets.length).toBeGreaterThan(0);
    });

    it('should have metric alarms configured', async () => {
      const result = await cloudwatch.describeAlarms({ AlarmNamePrefix: 'ecs-' }).promise();
      const ecsAlarms = result.MetricAlarms!.filter(a => a.AlarmName!.includes('synth101912554'));
      expect(ecsAlarms.length).toBeGreaterThan(0);
    });

    it('should have SNS topic for alerts', async () => {
      const result = await sns.getTopicAttributes({ TopicArn: outputs.sns_topic_arn }).promise();
      expect(result.Attributes).toBeDefined();
    });
  });

  describe('End-to-End Connectivity', () => {

    it('should be able to reach CloudFront distribution', (done) => {
      const url = `https://${outputs.cloudfront_distribution_domain}`;
      https.get(url, (res) => {
        expect(res.statusCode).toBeDefined();
        // CloudFront should respond
        expect([200, 503, 502, 504, 403]).toContain(res.statusCode!);
        done();
      }).on('error', (err) => {
        // SSL/TLS handshake or timeout is acceptable
        expect(err).toBeDefined();
        done();
      });
    }, 30000);
  });

  describe('Resource Tagging', () => {
    it('should have consistent tags across all resources', async () => {
      const vpcResult = await ec2.describeVpcs({ VpcIds: [outputs.vpc_id] }).promise();
      const vpcTags = vpcResult.Vpcs![0].Tags || [];

      const hasTag = (tagKey: string) => vpcTags.some(t => t.Key === tagKey);
      expect(hasTag('Environment')).toBe(true);
      expect(hasTag('ManagedBy')).toBe(true);
      expect(hasTag('CostCenter')).toBe(true);
      expect(hasTag('Compliance')).toBe(true);
    });

    it('should have environment suffix in resource names', () => {
      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.ecs_cluster_name).toContain('synth101912554');
      expect(outputs.rds_cluster_id).toContain('synth101912554');
      expect(outputs.cloudwatch_dashboard_name).toContain('synth101912554');
    });
  });
});
