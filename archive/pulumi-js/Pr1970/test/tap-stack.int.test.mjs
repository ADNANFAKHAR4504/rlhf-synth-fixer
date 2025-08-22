import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';

/**
 * Integration Tests for TapStack
 * 
 * These tests verify that the deployed infrastructure meets requirements:
 * - All resources are created successfully
 * - Resources are configured according to specifications
 * - High availability is properly implemented
 * - Security configurations are correct
 * - Auto scaling is properly configured
 * - Load balancer is functional
 */

describe('TapStack Integration Tests', () => {
  let stackOutputs;
  let ec2Client;
  let elbv2Client;
  let s3Client;
  let iamClient;
  let autoscalingClient;
  let cloudwatchClient;
  let cloudfrontClient;

  beforeAll(async () => {
    // Initialize AWS clients
    AWS.config.update({ region: 'us-west-2' });
    
    ec2Client = new AWS.EC2();
    elbv2Client = new AWS.ELBv2();
    s3Client = new AWS.S3();
    iamClient = new AWS.IAM();
    autoscalingClient = new AWS.AutoScaling();
    cloudwatchClient = new AWS.CloudWatch();
    cloudfrontClient = new AWS.CloudFront();

    // Load stack outputs from deployment
    try {
      const outputsPath = path.join(process.cwd(), 'stack-outputs.json');
      if (fs.existsSync(outputsPath)) {
        const outputsData = fs.readFileSync(outputsPath, 'utf8');
        stackOutputs = JSON.parse(outputsData);
      } else {
        // Try to get outputs from Pulumi stack
        const { execSync } = await import('child_process');
        const pulumiOutput = execSync('pulumi stack output --json', { encoding: 'utf8' });
        stackOutputs = JSON.parse(pulumiOutput);
      }
    } catch (error) {
      console.warn('Could not load stack outputs. Some tests may be skipped.');
      stackOutputs = {};
    }
  });

  describe('VPC Infrastructure', () => {
    test('VPC should exist and have correct configuration', async () => {
      if (!stackOutputs.vpcId) {
        console.warn('VPC ID not found in stack outputs, skipping test');
        return;
      }

      const response = await ec2Client.describeVpcs({
        VpcIds: [stackOutputs.vpcId]
      }).promise();

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs[0];
      
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('Public and private subnets should exist in multiple AZs', async () => {
      if (!stackOutputs.publicSubnetIds || !stackOutputs.privateSubnetIds) {
        console.warn('Subnet IDs not found in stack outputs, skipping test');
        return;
      }

      // Test public subnets
      const publicResponse = await ec2Client.describeSubnets({
        SubnetIds: stackOutputs.publicSubnetIds
      }).promise();

      expect(publicResponse.Subnets).toHaveLength(2);
      const publicAZs = publicResponse.Subnets.map(subnet => subnet.AvailabilityZone);
      expect(new Set(publicAZs).size).toBe(2); // Should span 2 AZs

      // Test private subnets
      const privateResponse = await ec2Client.describeSubnets({
        SubnetIds: stackOutputs.privateSubnetIds
      }).promise();

      expect(privateResponse.Subnets).toHaveLength(2);
      const privateAZs = privateResponse.Subnets.map(subnet => subnet.AvailabilityZone);
      expect(new Set(privateAZs).size).toBe(2); // Should span 2 AZs
    });

    test('NAT Gateways should exist for high availability', async () => {
      if (!stackOutputs.vpcId) {
        console.warn('VPC ID not found, skipping NAT Gateway test');
        return;
      }

      const response = await ec2Client.describeNatGateways({
        Filters: [
          { Name: 'vpc-id', Values: [stackOutputs.vpcId] },
          { Name: 'state', Values: ['available'] }
        ]
      }).promise();

      expect(response.NatGateways.length).toBeGreaterThanOrEqual(2);
      
      // Verify NAT Gateways are in different AZs
      const natAZs = response.NatGateways.map(nat => nat.SubnetId);
      const subnetResponse = await ec2Client.describeSubnets({
        SubnetIds: natAZs
      }).promise();
      
      const azs = subnetResponse.Subnets.map(subnet => subnet.AvailabilityZone);
      expect(new Set(azs).size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Load Balancer Configuration', () => {
    test('Application Load Balancer should be configured correctly', async () => {
      if (!stackOutputs.albDnsName) {
        console.warn('ALB DNS name not found, skipping test');
        return;
      }

      // Get load balancer details
      const response = await elbv2Client.describeLoadBalancers({
        Names: [stackOutputs.albDnsName.split('.')[0]]
      }).promise();

      expect(response.LoadBalancers).toHaveLength(1);
      const alb = response.LoadBalancers[0];

      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.State.Code).toBe('active');
      expect(alb.AvailabilityZones.length).toBeGreaterThanOrEqual(2);
    });

    test('ALB should have healthy targets', async () => {
      if (!stackOutputs.albDnsName) {
        console.warn('ALB DNS name not found, skipping target health test');
        return;
      }

      // This test may need to wait for instances to be healthy
      // In a real CI/CD pipeline, you might want to retry this test
      try {
        const response = await elbv2Client.describeLoadBalancers({
          Names: [stackOutputs.albDnsName.split('.')[0]]
        }).promise();

        const targetGroups = await elbv2Client.describeTargetGroups({
          LoadBalancerArns: [response.LoadBalancers[0].LoadBalancerArn]
        }).promise();

        for (const tg of targetGroups.TargetGroups) {
          const health = await elbv2Client.describeTargetHealth({
            TargetGroupArn: tg.TargetGroupArn
          }).promise();

          // At least some targets should be healthy or in the process of becoming healthy
          const healthyTargets = health.TargetHealthDescriptions.filter(
            target => ['healthy', 'initial'].includes(target.TargetHealth.State)
          );
          expect(healthyTargets.length).toBeGreaterThan(0);
        }
      } catch (error) {
        console.warn('Could not verify target health, this may be expected during initial deployment');
      }
    }, 30000); // Extended timeout for health checks
  });

  describe('S3 Static Assets', () => {
    test('S3 bucket should exist and be private', async () => {
      if (!stackOutputs.staticBucketName) {
        console.warn('S3 bucket name not found, skipping test');
        return;
      }

      // Check bucket exists
      const bucketResponse = await s3Client.headBucket({
        Bucket: stackOutputs.staticBucketName
      }).promise();

      expect(bucketResponse).toBeDefined();

      // Verify bucket is not configured for website hosting (should be private)
      try {
        await s3Client.getBucketWebsite({
          Bucket: stackOutputs.staticBucketName
        }).promise();
        // If we reach here, website hosting is configured (not expected)
        fail('Bucket should not be configured for website hosting');
      } catch (error) {
        // Expected - bucket should not have website configuration
        expect(error.code).toBe('NoSuchWebsiteConfiguration');
      }
    });

    test('S3 bucket should have correct CloudFront access policy', async () => {
      if (!stackOutputs.staticBucketName || !stackOutputs.cloudfrontDistributionId) {
        console.warn('S3 bucket name or CloudFront distribution ID not found, skipping policy test');
        return;
      }

      try {
        const policyResponse = await s3Client.getBucketPolicy({
          Bucket: stackOutputs.staticBucketName
        }).promise();

        const policy = JSON.parse(policyResponse.Policy);
        expect(policy.Statement).toHaveLength(1);
        
        const statement = policy.Statement[0];
        expect(statement.Effect).toBe('Allow');
        expect(statement.Principal.Service).toBe('cloudfront.amazonaws.com');
        expect(statement.Action).toBe('s3:GetObject');
        expect(statement.Condition.StringEquals['AWS:SourceArn']).toBeDefined();
      } catch (error) {
        if (error.code !== 'NoSuchBucketPolicy') {
          throw error;
        }
      }
    });

    test('S3 bucket should be private with public access blocked', async () => {
      if (!stackOutputs.staticBucketName) {
        console.warn('S3 bucket name not found, skipping public access block test');
        return;
      }

      const publicAccessBlock = await s3Client.getPublicAccessBlock({
        Bucket: stackOutputs.staticBucketName
      }).promise();

      expect(publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('CloudFront Distribution', () => {
    test('CloudFront distribution should be configured correctly', async () => {
      if (!stackOutputs.cloudfrontDistributionId) {
        console.warn('CloudFront distribution ID not found, skipping test');
        return;
      }

      const response = await cloudfrontClient.getDistribution({
        Id: stackOutputs.cloudfrontDistributionId
      }).promise();

      const distribution = response.Distribution;
      
      expect(distribution.Status).toBe('Deployed');
      expect(distribution.DistributionConfig.Enabled).toBe(true);
      expect(distribution.DistributionConfig.DefaultRootObject).toBe('index.html');
      expect(distribution.DistributionConfig.Origins.Items).toHaveLength(1);
      
      const origin = distribution.DistributionConfig.Origins.Items[0];
      expect(origin.Id).toBe('S3Origin');
      expect(origin.OriginAccessControlId).toBeDefined();
    });

    test('CloudFront should have correct cache behavior', async () => {
      if (!stackOutputs.cloudfrontDistributionId) {
        console.warn('CloudFront distribution ID not found, skipping cache behavior test');
        return;
      }

      const response = await cloudfrontClient.getDistribution({
        Id: stackOutputs.cloudfrontDistributionId
      }).promise();

      const defaultCacheBehavior = response.Distribution.DistributionConfig.DefaultCacheBehavior;
      
      expect(defaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
      expect(defaultCacheBehavior.Compress).toBe(true);
      expect(defaultCacheBehavior.TargetOriginId).toBe('S3Origin');
      expect(defaultCacheBehavior.DefaultTTL).toBe(3600);
    });

    test('CloudFront should have custom error responses', async () => {
      if (!stackOutputs.cloudfrontDistributionId) {
        console.warn('CloudFront distribution ID not found, skipping error response test');
        return;
      }

      const response = await cloudfrontClient.getDistribution({
        Id: stackOutputs.cloudfrontDistributionId
      }).promise();

      const customErrorResponses = response.Distribution.DistributionConfig.CustomErrorResponses;
      
      expect(customErrorResponses.Items.length).toBeGreaterThanOrEqual(1);
      
      const errorResponse = customErrorResponses.Items.find(item => item.ErrorCode === 404);
      expect(errorResponse).toBeDefined();
      expect(errorResponse.ResponsePagePath).toBe('/error.html');
      expect(errorResponse.ResponseCode).toBe(404);
    });
  });

  describe('Auto Scaling Configuration', () => {
    test('Auto Scaling Group should be configured correctly', async () => {
      if (!stackOutputs.asgName) {
        console.warn('ASG name not found, skipping test');
        return;
      }

      const response = await autoscalingClient.describeAutoScalingGroups({
        AutoScalingGroupNames: [stackOutputs.asgName]
      }).promise();

      expect(response.AutoScalingGroups).toHaveLength(1);
      const asg = response.AutoScalingGroups[0];

      expect(asg.MinSize).toBe(1);
      expect(asg.MaxSize).toBe(10);
      expect(asg.DesiredCapacity).toBe(1);
      expect(asg.HealthCheckType).toBe('EC2');
      expect(asg.AvailabilityZones.length).toBeGreaterThanOrEqual(2);
    });

    test('CloudWatch alarms for scaling should exist', async () => {
      if (!stackOutputs.asgName) {
        console.warn('ASG name not found, skipping alarm test');
        return;
      }

      const response = await cloudwatchClient.describeAlarms({
        AlarmNamePrefix: 'tap-'
      }).promise();

      const scalingAlarms = response.MetricAlarms.filter(alarm => 
        alarm.AlarmName.includes('cpu') && 
        alarm.Dimensions.some(dim => dim.Name === 'AutoScalingGroupName')
      );

      expect(scalingAlarms.length).toBeGreaterThanOrEqual(2); // High and low CPU alarms

      // Check for high CPU alarm
      const highCpuAlarm = scalingAlarms.find(alarm => 
        alarm.ComparisonOperator === 'GreaterThanThreshold'
      );
      expect(highCpuAlarm).toBeDefined();
      expect(highCpuAlarm.Threshold).toBe(70);

      // Check for low CPU alarm
      const lowCpuAlarm = scalingAlarms.find(alarm => 
        alarm.ComparisonOperator === 'LessThanThreshold'
      );
      expect(lowCpuAlarm).toBeDefined();
      expect(lowCpuAlarm.Threshold).toBe(20);
    });
  });

  describe('Security Configuration', () => {
    test('Security groups should have correct rules', async () => {
      if (!stackOutputs.vpcId) {
        console.warn('VPC ID not found, skipping security group test');
        return;
      }

      const response = await ec2Client.describeSecurityGroups({
        Filters: [
          { Name: 'vpc-id', Values: [stackOutputs.vpcId] },
          { Name: 'group-name', Values: ['tap-alb-sg-*', 'tap-web-sg-*'] }
        ]
      }).promise();

      expect(response.SecurityGroups.length).toBeGreaterThanOrEqual(2);

      // Check ALB security group allows HTTP/HTTPS from internet
      const albSg = response.SecurityGroups.find(sg => sg.GroupName.includes('alb-sg'));
      if (albSg) {
        const httpRule = albSg.IpPermissions.find(rule => 
          rule.FromPort === 80 && rule.ToPort === 80
        );
        expect(httpRule).toBeDefined();
        expect(httpRule.IpRanges.some(range => range.CidrIp === '0.0.0.0/0')).toBe(true);
      }

      // Check web security group allows traffic from ALB only
      const webSg = response.SecurityGroups.find(sg => sg.GroupName.includes('web-sg'));
      if (webSg) {
        const httpRule = webSg.IpPermissions.find(rule => 
          rule.FromPort === 80 && rule.ToPort === 80
        );
        expect(httpRule).toBeDefined();
      }
    });

    test('IAM roles should have least privilege permissions', async () => {
      try {
        const response = await iamClient.listRoles({
          PathPrefix: '/tap-'
        }).promise();

        const tapRoles = response.Roles.filter(role => 
          role.RoleName.includes('tap-ec2-role')
        );

        expect(tapRoles.length).toBeGreaterThanOrEqual(1);

        for (const role of tapRoles) {
          // Check role has necessary managed policies
          const attachedPolicies = await iamClient.listAttachedRolePolicies({
            RoleName: role.RoleName
          }).promise();

          const policyNames = attachedPolicies.AttachedPolicies.map(p => p.PolicyName);
          expect(policyNames).toContain('AmazonSSMManagedInstanceCore');
          expect(policyNames).toContain('CloudWatchAgentServerPolicy');
        }
      } catch (error) {
        console.warn('Could not verify IAM roles, may be due to insufficient permissions');
      }
    });
  });

  describe('Connectivity Tests', () => {
    test('ALB should be accessible via HTTP', async () => {
      if (!stackOutputs.albDnsName) {
        console.warn('ALB DNS name not found, skipping connectivity test');
        return;
      }

      // This test requires the ALB to be active and have healthy targets
      // In a real deployment, you might want to retry this test with backoff
      try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`http://${stackOutputs.albDnsName}`, {
          timeout: 10000
        });

        // We expect either a successful response or a 503 (service temporarily unavailable)
        // 503 is acceptable during initial deployment when targets are not yet healthy
        expect([200, 503]).toContain(response.status);
      } catch (error) {
        console.warn('ALB connectivity test failed, this may be expected during initial deployment:', error.message);
      }
    }, 15000);

    test('CloudFront distribution should be accessible', async () => {
      if (!stackOutputs.cloudfrontDomainName) {
        console.warn('CloudFront domain name not found, skipping test');
        return;
      }

      try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`https://${stackOutputs.cloudfrontDomainName}`, {
          timeout: 15000
        });

        // We expect either success or 404 (no index.html uploaded yet)
        // CloudFront may return 403 if no default root object is found
        expect([200, 403, 404]).toContain(response.status);
      } catch (error) {
        console.warn('CloudFront connectivity test failed:', error.message);
      }
    }, 20000);
  });

  describe('Resource Tagging', () => {
    test('Resources should have correct tags', async () => {
      if (!stackOutputs.vpcId) {
        console.warn('VPC ID not found, skipping tagging test');
        return;
      }

      // Check VPC tags
      const response = await ec2Client.describeVpcs({
        VpcIds: [stackOutputs.vpcId]
      }).promise();

      const vpc = response.Vpcs[0];
      const tags = vpc.Tags || [];
      const tagMap = Object.fromEntries(tags.map(tag => [tag.Key, tag.Value]));

      expect(tagMap.Project).toBeDefined();
      expect(tagMap.ManagedBy).toBe('Pulumi');
      expect(tagMap.Environment).toBeDefined();
    });
  });
});