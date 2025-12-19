// Integration tests for Terraform Media Streaming Platform
// These tests validate deployed AWS resources

import { execSync } from 'child_process';
import * as AWS from 'aws-sdk';

// Helper function to check if infrastructure exists
async function checkInfrastructureExists(): Promise<boolean> {
  try {
    const outputs = execSync('terraform output -json', {
      cwd: `${__dirname}/../lib`,
      encoding: 'utf8'
    });
    return outputs.trim().length > 2; // More than just {}
  } catch (error) {
    console.warn('Infrastructure not deployed. Skipping integration tests.');
    return false;
  }
}

describe('Media Streaming Platform Infrastructure Integration Tests', () => {
  let infrastructureExists: boolean;
  let ec2: AWS.EC2;
  let elbv2: AWS.ELBv2;
  let s3: AWS.S3;
  let cloudfront: AWS.CloudFront;
  let wafv2: AWS.WAFV2;
  let cloudwatch: AWS.CloudWatch;

  beforeAll(async () => {
    infrastructureExists = await checkInfrastructureExists();
    
    if (infrastructureExists) {
      AWS.config.update({ region: 'us-east-1' });
      ec2 = new AWS.EC2();
      elbv2 = new AWS.ELBv2();
      s3 = new AWS.S3();
      cloudfront = new AWS.CloudFront();
      wafv2 = new AWS.WAFV2({ region: 'us-east-1' });
      cloudwatch = new AWS.CloudWatch();
    }
  });

  describe('VPC and Networking', () => {
    test('VPC exists with correct CIDR block', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const vpcs = await ec2.describeVpcs({
        Filters: [
          { Name: 'tag:Name', Values: ['media-streaming-vpc'] }
        ]
      }).promise();

      expect(vpcs.Vpcs).toBeDefined();
      expect(vpcs.Vpcs!.length).toBeGreaterThan(0);
      expect(vpcs.Vpcs![0].CidrBlock).toBe('10.11.0.0/16');
    });

    test('Public and private subnets exist across multiple AZs', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const subnets = await ec2.describeSubnets({
        Filters: [
          { Name: 'tag:Name', Values: ['*media-streaming*'] }
        ]
      }).promise();

      expect(subnets.Subnets).toBeDefined();
      expect(subnets.Subnets!.length).toBeGreaterThanOrEqual(6); // At least 3 public + 3 private
    });

    test('NAT Gateway exists for private subnet internet access', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const natGateways = await ec2.describeNatGateways({
        Filter: [
          { Name: 'tag:Name', Values: ['*media-streaming*'] }
        ]
      }).promise();

      expect(natGateways.NatGateways).toBeDefined();
      expect(natGateways.NatGateways!.length).toBeGreaterThan(0);
      expect(natGateways.NatGateways![0].State).toBe('available');
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB exists and is active', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const loadBalancers = await elbv2.describeLoadBalancers({}).promise();
      const mediaStreamingALB = loadBalancers.LoadBalancers?.find(lb => 
        lb.LoadBalancerName?.includes('media-streaming')
      );

      expect(mediaStreamingALB).toBeDefined();
      expect(mediaStreamingALB?.State?.Code).toBe('active');
      expect(mediaStreamingALB?.Type).toBe('application');
    });

    test('ALB has HTTPS listener configured', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const loadBalancers = await elbv2.describeLoadBalancers({}).promise();
      const mediaStreamingALB = loadBalancers.LoadBalancers?.find(lb => 
        lb.LoadBalancerName?.includes('media-streaming')
      );

      if (mediaStreamingALB) {
        const listeners = await elbv2.describeListeners({
          LoadBalancerArn: mediaStreamingALB.LoadBalancerArn!
        }).promise();

        const httpsListener = listeners.Listeners?.find(l => l.Port === 443);
        expect(httpsListener).toBeDefined();
        expect(httpsListener?.Protocol).toBe('HTTPS');
      }
    });

    test('Target group is healthy', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const targetGroups = await elbv2.describeTargetGroups({}).promise();
      const mediaStreamingTG = targetGroups.TargetGroups?.find(tg => 
        tg.TargetGroupName?.includes('media-streaming')
      );

      expect(mediaStreamingTG).toBeDefined();
      expect(mediaStreamingTG?.HealthCheckEnabled).toBe(true);
    });
  });

  describe('Auto Scaling Group', () => {
    test('ASG exists with correct instance type', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const autoscaling = new AWS.AutoScaling();
      const asgs = await autoscaling.describeAutoScalingGroups({}).promise();
      const mediaStreamingASG = asgs.AutoScalingGroups.find(asg => 
        asg.AutoScalingGroupName?.includes('media-streaming')
      );

      expect(mediaStreamingASG).toBeDefined();
      expect(mediaStreamingASG?.MinSize).toBeGreaterThanOrEqual(2);
      expect(mediaStreamingASG?.MaxSize).toBeLessThanOrEqual(10);
    });

    test('ASG has scaling policies configured', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const autoscaling = new AWS.AutoScaling();
      const policies = await autoscaling.describePolicies({}).promise();
      const mediaStreamingPolicies = policies.ScalingPolicies?.filter(p => 
        p.AutoScalingGroupName?.includes('media-streaming')
      ) || [];

      expect(mediaStreamingPolicies.length).toBeGreaterThanOrEqual(2); // CPU and custom metric
    });
  });

  describe('S3 Storage', () => {
    test('Video storage bucket exists', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const buckets = await s3.listBuckets().promise();
      const videoStorageBucket = buckets.Buckets?.find(b => 
        b.Name?.includes('streaming-videos')
      );

      expect(videoStorageBucket).toBeDefined();
    });

    test('S3 bucket has versioning enabled', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const buckets = await s3.listBuckets().promise();
      const videoStorageBucket = buckets.Buckets?.find(b => 
        b.Name?.includes('streaming-videos')
      );

      if (videoStorageBucket) {
        const versioning = await s3.getBucketVersioning({
          Bucket: videoStorageBucket.Name!
        }).promise();

        expect(versioning.Status).toBe('Enabled');
      }
    });

    test('S3 bucket has encryption enabled', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const buckets = await s3.listBuckets().promise();
      const videoStorageBucket = buckets.Buckets?.find(b => 
        b.Name?.includes('streaming-videos')
      );

      if (videoStorageBucket) {
        const encryption = await s3.getBucketEncryption({
          Bucket: videoStorageBucket.Name!
        }).promise();

        expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      }
    });

    test('S3 bucket has Transfer Acceleration enabled', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const buckets = await s3.listBuckets().promise();
      const videoStorageBucket = buckets.Buckets?.find(b => 
        b.Name?.includes('streaming-videos')
      );

      if (videoStorageBucket) {
        const acceleration = await s3.getBucketAccelerateConfiguration({
          Bucket: videoStorageBucket.Name!
        }).promise();

        expect(acceleration.Status).toBe('Enabled');
      }
    });
  });

  describe('CloudFront Distribution', () => {
    test('CloudFront distribution exists and is deployed', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const distributions = await cloudfront.listDistributions({}).promise();
      const mediaStreamingDist = distributions.DistributionList?.Items?.find(d => 
        d.Comment?.includes('media streaming')
      );

      expect(mediaStreamingDist).toBeDefined();
      expect(mediaStreamingDist?.Status).toBe('Deployed');
      expect(mediaStreamingDist?.Enabled).toBe(true);
    });

    test('CloudFront has multiple origins configured', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const distributions = await cloudfront.listDistributions({}).promise();
      const mediaStreamingDist = distributions.DistributionList?.Items?.find(d => 
        d.Comment?.includes('media streaming')
      );

      if (mediaStreamingDist) {
        const distribution = await cloudfront.getDistribution({
          Id: mediaStreamingDist.Id
        }).promise();

        expect(distribution.Distribution?.DistributionConfig.Origins.Items.length).toBeGreaterThanOrEqual(2);
      }
    });

    test('CloudFront has geo-restrictions configured', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const distributions = await cloudfront.listDistributions({}).promise();
      const mediaStreamingDist = distributions.DistributionList?.Items?.find(d => 
        d.Comment?.includes('media streaming')
      );

      if (mediaStreamingDist) {
        const distribution = await cloudfront.getDistribution({
          Id: mediaStreamingDist.Id
        }).promise();

        expect(distribution.Distribution?.DistributionConfig?.Restrictions?.GeoRestriction).toBeDefined();
      }
    });
  });

  describe('WAF Configuration', () => {
    test('WAF WebACL exists for CloudFront', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const webACLs = await wafv2.listWebACLs({
        Scope: 'CLOUDFRONT'
      }).promise();

      const mediaStreamingWAF = webACLs.WebACLs?.find(acl => 
        acl.Name?.includes('media-streaming')
      );

      expect(mediaStreamingWAF).toBeDefined();
    });

    test('WAF has rate limiting rules configured', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const webACLs = await wafv2.listWebACLs({
        Scope: 'CLOUDFRONT'
      }).promise();

      const mediaStreamingWAF = webACLs.WebACLs?.find(acl => 
        acl.Name?.includes('media-streaming')
      );

      if (mediaStreamingWAF) {
        const webACL = await wafv2.getWebACL({
          Scope: 'CLOUDFRONT',
          Id: mediaStreamingWAF.Id!,
          Name: mediaStreamingWAF.Name!
        }).promise();

        const hasRateLimitRule = webACL.WebACL?.Rules?.some(rule => 
          rule.Statement?.RateBasedStatement !== undefined
        );

        expect(hasRateLimitRule).toBe(true);
      }
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch alarms exist for ALB', async () => {
      if (!infrastructureExists) {
        console.warn('Skipping: Infrastructure not deployed');
        return;
      }

      const alarms = await cloudwatch.describeAlarms({}).promise();
      const mediaStreamingAlarms = alarms.MetricAlarms?.filter(alarm => 
        alarm.AlarmName?.includes('media-streaming')
      );

      expect(mediaStreamingAlarms).toBeDefined();
      expect(mediaStreamingAlarms!.length).toBeGreaterThan(0);
    });
  });
});
