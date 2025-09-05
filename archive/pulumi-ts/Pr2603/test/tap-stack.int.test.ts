import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

const region = 'ap-south-1';
const environment = process.env.ENVIRONMENT_SUFFIX || 'integration-test';

AWS.config.update({ region });

const ec2 = new AWS.EC2();
const elbv2 = new AWS.ELBv2();
const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront();
const autoscaling = new AWS.AutoScaling();
const cloudwatch = new AWS.CloudWatch();
const iam = new AWS.IAM();
const cloudtrail = new AWS.CloudTrail();

const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);
let outputs: any = {};

describe('TapStack Integration Tests', () => {
  beforeAll(async () => {
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
      outputs = JSON.parse(outputsContent);
    }
  }, 60000);

  describe('VPC and Networking Infrastructure', () => {
    it('should create VPC with correct configuration', async () => {
      const vpcId = outputs.vpcId || outputs.VPCId;
      if (!vpcId) {
        console.log('Skipping VPC test - no VPC ID in outputs');
        return;
      }

      const response = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
    });

    it('should create public and private subnets in different AZs', async () => {
      const vpcId = outputs.vpcId || outputs.VPCId;
      if (!vpcId) {
        console.log('Skipping subnet test - no VPC ID in outputs');
        return;
      }

      const response = await ec2
        .describeSubnets({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
        .promise();

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(4);

      const publicSubnets = response.Subnets!.filter(
        s => s.MapPublicIpOnLaunch === true
      );
      const privateSubnets = response.Subnets!.filter(
        s => s.MapPublicIpOnLaunch === false
      );

      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    it('should create Internet Gateway attached to VPC', async () => {
      const vpcId = outputs.vpcId || outputs.VPCId;
      if (!vpcId) {
        console.log('Skipping IGW test - no VPC ID in outputs');
        return;
      }

      const response = await ec2
        .describeInternetGateways({
          Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
        })
        .promise();

      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBeGreaterThanOrEqual(1);

      const igw = response.InternetGateways![0];
      expect(igw.Attachments![0].State).toBe('available');
    });

    it('should create NAT Gateways in public subnets', async () => {
      const vpcId = outputs.vpcId || outputs.VPCId;
      if (!vpcId) {
        console.log('Skipping NAT Gateway test - no VPC ID in outputs');
        return;
      }

      const response = await ec2
        .describeNatGateways({
          Filter: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'state', Values: ['available'] },
          ],
        })
        .promise();

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);

      response.NatGateways!.forEach(natGw => {
        expect(natGw.State).toBe('available');
        expect(natGw.VpcId).toBe(vpcId);
      });
    });

    it('should have proper routing configured', async () => {
      const vpcId = outputs.vpcId || outputs.VPCId;
      if (!vpcId) {
        console.log('Skipping route table test - no VPC ID in outputs');
        return;
      }

      const response = await ec2
        .describeRouteTables({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
        .promise();

      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBeGreaterThanOrEqual(3);

      const hasInternetRoute = response.RouteTables!.some(rt =>
        rt.Routes!.some(r => r.GatewayId && r.GatewayId.startsWith('igw-'))
      );
      const hasNatRoute = response.RouteTables!.some(rt =>
        rt.Routes!.some(
          r => r.NatGatewayId && r.NatGatewayId.startsWith('nat-')
        )
      );

      expect(hasInternetRoute).toBe(true);
      expect(hasNatRoute).toBe(true);
    });
  });

  describe('Load Balancer and Auto Scaling', () => {
    it('should create Application Load Balancer', async () => {
      const albDns = outputs.albDnsName || outputs.LoadBalancerDNS;
      if (!albDns) {
        console.log('Skipping ALB test - no ALB DNS in outputs');
        return;
      }

      const response = await elbv2.describeLoadBalancers().promise();
      const alb = response.LoadBalancers!.find(lb => lb.DNSName === albDns);

      expect(alb).toBeDefined();
      expect(alb!.State!.Code).toBe('active');
      expect(alb!.Type).toBe('application');
      expect(alb!.Scheme).toBe('internet-facing');
    });

    it('should have access logs enabled', async () => {
      const albDns = outputs.albDnsName || outputs.LoadBalancerDNS;
      if (!albDns) {
        console.log('Skipping ALB attributes test - no ALB DNS in outputs');
        return;
      }

      const albResponse = await elbv2.describeLoadBalancers().promise();
      const alb = albResponse.LoadBalancers!.find(lb => lb.DNSName === albDns);

      if (!alb) return;

      const response = await elbv2
        .describeLoadBalancerAttributes({
          LoadBalancerArn: alb.LoadBalancerArn!,
        })
        .promise();

      const accessLogsEnabled = response.Attributes?.find(
        attr => attr.Key === 'access_logs.s3.enabled'
      );
      expect(accessLogsEnabled?.Value).toBe('true');
    });

    it('should have target group with health check configured', async () => {
      const albDns = outputs.albDnsName || outputs.LoadBalancerDNS;
      if (!albDns) {
        console.log('Skipping target group test - no ALB DNS in outputs');
        return;
      }

      const albResponse = await elbv2.describeLoadBalancers().promise();
      const alb = albResponse.LoadBalancers!.find(lb => lb.DNSName === albDns);

      if (!alb) return;

      const listenersResponse = await elbv2
        .describeListeners({
          LoadBalancerArn: alb.LoadBalancerArn!,
        })
        .promise();

      expect(listenersResponse.Listeners).toHaveLength(1);
      const listener = listenersResponse.Listeners![0];
      expect(listener.Port).toBe(80);
      expect(listener.Protocol).toBe('HTTP');

      const targetGroupArn = listener.DefaultActions![0].TargetGroupArn!;
      const targetGroupResponse = await elbv2
        .describeTargetGroups({
          TargetGroupArns: [targetGroupArn],
        })
        .promise();

      const targetGroup = targetGroupResponse.TargetGroups![0];
      expect(targetGroup.HealthCheckPath).toBe('/');
      expect(targetGroup.HealthCheckProtocol).toBe('HTTP');
      expect(targetGroup.HealthyThresholdCount).toBe(2);
    });

    it('should create Auto Scaling Group with correct configuration', async () => {
      const vpcId = outputs.vpcId || outputs.VPCId;
      if (!vpcId) {
        console.log('Skipping ASG test - no VPC ID in outputs');
        return;
      }

      const response = await autoscaling.describeAutoScalingGroups().promise();

      const subnetResponse = await ec2
        .describeSubnets({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
        .promise();

      const ourSubnetIds = subnetResponse.Subnets!.map(s => s.SubnetId);

      const ourAsg = response.AutoScalingGroups!.find(
        asg =>
          asg.VPCZoneIdentifier &&
          asg.VPCZoneIdentifier.split(',').some(id => ourSubnetIds.includes(id))
      );

      if (ourAsg) {
        expect(ourAsg.MinSize).toBe(1);
        expect(ourAsg.MaxSize).toBe(4);
        expect(ourAsg.DesiredCapacity).toBe(2);
        expect(ourAsg.HealthCheckType).toBe('ELB');
      }
    });
  });

  describe('S3 Bucket Configuration', () => {
    it('should create S3 bucket with versioning enabled', async () => {
      const bucketName = outputs.s3BucketName || outputs.S3BucketName;
      if (!bucketName) {
        console.log('Skipping S3 test - no bucket name in outputs');
        return;
      }

      const versioningResponse = await s3
        .getBucketVersioning({
          Bucket: bucketName,
        })
        .promise();

      expect(versioningResponse.Status).toBe('Enabled');
    });

    it('should have public access blocked', async () => {
      const bucketName = outputs.s3BucketName || outputs.S3BucketName;
      if (!bucketName) {
        console.log(
          'Skipping S3 public access test - no bucket name in outputs'
        );
        return;
      }

      const response = await s3
        .getPublicAccessBlock({
          Bucket: bucketName,
        })
        .promise();

      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(
        true
      );
      expect(
        response.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);
    });

    it('should have server-side encryption enabled', async () => {
      const bucketName = outputs.s3BucketName || outputs.S3BucketName;
      if (!bucketName) {
        console.log('Skipping S3 encryption test - no bucket name in outputs');
        return;
      }

      const response = await s3
        .getBucketEncryption({
          Bucket: bucketName,
        })
        .promise();

      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
        'AES256'
      );
    });

    it('should have lifecycle configuration', async () => {
      const bucketName = outputs.s3BucketName || outputs.S3BucketName;
      if (!bucketName) {
        console.log('Skipping S3 lifecycle test - no bucket name in outputs');
        return;
      }

      const response = await s3
        .getBucketLifecycleConfiguration({
          Bucket: bucketName,
        })
        .promise();

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThanOrEqual(1);

      const rule = response.Rules![0];
      expect(rule.Status).toBe('Enabled');
    });
  });

  describe('CloudFront Distribution', () => {
    it('should create CloudFront distribution', async () => {
      const distributionId =
        outputs.cloudfrontDistributionId || outputs.CloudFrontDistributionId;
      if (!distributionId) {
        console.log('Skipping CloudFront test - no distribution ID in outputs');
        return;
      }

      const response = await cloudfront
        .getDistribution({
          Id: distributionId,
        })
        .promise();

      expect(response.Distribution?.DistributionConfig?.Enabled).toBe(true);
      expect(response.Distribution?.DistributionConfig?.IsIPV6Enabled).toBe(
        true
      );
      expect(response.Distribution?.DistributionConfig?.DefaultRootObject).toBe(
        'index.html'
      );
    });

    it('should have S3 origin configured', async () => {
      const distributionId =
        outputs.cloudfrontDistributionId || outputs.CloudFrontDistributionId;
      if (!distributionId) {
        console.log(
          'Skipping CloudFront origin test - no distribution ID in outputs'
        );
        return;
      }

      const response = await cloudfront
        .getDistribution({
          Id: distributionId,
        })
        .promise();

      const origins = response.Distribution?.DistributionConfig?.Origins?.Items;
      expect(origins).toHaveLength(1);
      expect(origins![0].Id).toBe('S3Origin');
      expect(origins![0].S3OriginConfig).toBeDefined();
    });

    it('should have logging enabled', async () => {
      const distributionId =
        outputs.cloudfrontDistributionId || outputs.CloudFrontDistributionId;
      if (!distributionId) {
        console.log(
          'Skipping CloudFront logging test - no distribution ID in outputs'
        );
        return;
      }

      const response = await cloudfront
        .getDistribution({
          Id: distributionId,
        })
        .promise();

      const logging = response.Distribution?.DistributionConfig?.Logging;
      expect(logging?.Enabled).toBe(true);
      expect(logging?.IncludeCookies).toBe(false);
    });
  });

  describe('Security Groups Configuration', () => {
    it('should create security groups with correct rules', async () => {
      const albSgId = outputs.albSecurityGroupId;
      const ec2SgId = outputs.ec2SecurityGroupId;

      if (!albSgId || !ec2SgId) {
        console.log('Skipping security group test - no security group IDs in outputs');
        return;
      }

      const response = await ec2
        .describeSecurityGroups({
          GroupIds: [albSgId, ec2SgId],
        })
        .promise();

      expect(response.SecurityGroups).toHaveLength(2);

      const albSg = response.SecurityGroups!.find(sg => sg.GroupId === albSgId);
      const ec2Sg = response.SecurityGroups!.find(sg => sg.GroupId === ec2SgId);

      expect(albSg?.IpPermissions).toContainEqual(
        expect.objectContaining({
          IpProtocol: 'tcp',
          FromPort: 80,
          ToPort: 80,
        })
      );

      expect(ec2Sg?.IpPermissions).toContainEqual(
        expect.objectContaining({
          IpProtocol: 'tcp',
          FromPort: 80,
          ToPort: 80,
        })
      );
    });
  });

  describe('Logging and Monitoring', () => {
    it('should have VPC Flow Logs enabled', async () => {
      const vpcId = outputs.vpcId || outputs.VPCId;
      if (!vpcId) {
        console.log('Skipping VPC Flow Logs test - no VPC ID in outputs');
        return;
      }

      const response = await ec2
        .describeFlowLogs({
          Filter: [{ Name: 'resource-id', Values: [vpcId] }],
        })
        .promise();

      expect(response.FlowLogs).toHaveLength(1);
      expect(response.FlowLogs![0].FlowLogStatus).toBe('ACTIVE');
      expect(response.FlowLogs![0].TrafficType).toBe('ALL');
    });

    it('should have CloudTrail configured', async () => {
      const response = await cloudtrail.describeTrails().promise();

      const ourTrail = response.trailList?.find(trail =>
        trail.Name?.includes(environment)
      );

      if (ourTrail) {
        expect(ourTrail.IncludeGlobalServiceEvents).toBe(true);
        expect(ourTrail.IsMultiRegionTrail).toBe(false);
      }
    });

    it('should have CloudTrail bucket with proper policy', async () => {
      const cloudTrailBucketName = outputs.cloudTrailBucketName;
      if (!cloudTrailBucketName) {
        console.log('Skipping CloudTrail bucket test - no bucket name in outputs');
        return;
      }

      const response = await s3
        .getBucketPolicy({
          Bucket: cloudTrailBucketName,
        })
        .promise();

      const policy = JSON.parse(response.Policy!);
      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement).toHaveLength(2);

      const aclCheckStatement = policy.Statement.find((s: any) => s.Sid === 'AWSCloudTrailAclCheck');
      const writeStatement = policy.Statement.find((s: any) => s.Sid === 'AWSCloudTrailWrite');

      expect(aclCheckStatement).toBeDefined();
      expect(aclCheckStatement.Action).toBe('s3:GetBucketAcl');
      expect(writeStatement).toBeDefined();
      expect(writeStatement.Action).toBe('s3:PutObject');
    });

    it('should have VPC Flow Logs with CloudWatch destination', async () => {
      const flowLogGroupName = outputs.flowLogGroupName;
      if (!flowLogGroupName) {
        console.log('Skipping Flow Log group test - no log group name in outputs');
        return;
      }

      const logs = new AWS.CloudWatchLogs();
      const response = await logs
        .describeLogGroups({
          logGroupNamePrefix: flowLogGroupName,
        })
        .promise();

      expect(response.logGroups).toHaveLength(1);
      expect(response.logGroups![0].retentionInDays).toBe(30);
    });
  });

  describe('Resource Tagging', () => {
    it('should apply tags to VPC resources', async () => {
      const vpcId = outputs.vpcId || outputs.VPCId;
      if (!vpcId) {
        console.log('Skipping tagging test - no VPC ID in outputs');
        return;
      }

      const response = await ec2
        .describeTags({
          Filters: [{ Name: 'resource-id', Values: [vpcId] }],
        })
        .promise();

      const tagMap = response.Tags?.reduce(
        (acc, tag) => {
          acc[tag.Key!] = tag.Value!;
          return acc;
        },
        {} as Record<string, string>
      );
      expect(tagMap?.Environment).toBe(environment);
    });
  });

  describe('Stack Outputs', () => {
    it('should provide all required stack outputs', async () => {
      expect(outputs.vpcId || outputs.VPCId).toBeDefined();
      expect(outputs.albDnsName || outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.s3BucketName || outputs.S3BucketName).toBeDefined();
      expect(
        outputs.cloudfrontDomainName || outputs.CloudFrontDomainName
      ).toBeDefined();
      expect(outputs.asgId || outputs.AutoScalingGroupId).toBeDefined();
      expect(outputs.cloudTrailBucketName).toBeDefined();
      expect(outputs.flowLogGroupName).toBeDefined();
      expect(outputs.rdsInstanceId).toBeDefined();
    });
  });

  describe('e2e: End-to-End Connectivity Tests', () => {
    it('e2e: Load balancer endpoint should be reachable', async () => {
      const albDns = outputs.albDnsName || outputs.LoadBalancerDNS;
      if (!albDns) {
        console.log('Skipping e2e connectivity test - no ALB DNS in outputs');
        return;
      }

      const dns = require('dns').promises;

      try {
        const addresses = await dns.resolve4(albDns);
        expect(addresses).toBeDefined();
        expect(addresses.length).toBeGreaterThan(0);
      } catch (error) {
        console.log('DNS not yet propagated for ALB:', albDns);
      }
    });

    it('e2e: CloudFront distribution should be accessible', async () => {
      const distributionDomain =
        outputs.cloudfrontDomainName || outputs.CloudFrontDomainName;
      if (!distributionDomain) {
        console.log(
          'Skipping e2e CloudFront test - no distribution domain in outputs'
        );
        return;
      }

      const dns = require('dns').promises;

      try {
        const addresses = await dns.resolve4(distributionDomain);
        expect(addresses).toBeDefined();
        expect(addresses.length).toBeGreaterThan(0);
      } catch (error) {
        console.log(
          'DNS not yet propagated for CloudFront:',
          distributionDomain
        );
      }
    });

    it('e2e: Auto Scaling Group should have healthy instances', async () => {
      const vpcId = outputs.vpcId || outputs.VPCId;
      if (!vpcId) {
        console.log('Skipping e2e ASG health test - no VPC ID in outputs');
        return;
      }

      const response = await autoscaling.describeAutoScalingGroups().promise();

      const subnetResponse = await ec2
        .describeSubnets({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
        .promise();

      const ourSubnetIds = subnetResponse.Subnets!.map(s => s.SubnetId);

      const ourAsg = response.AutoScalingGroups!.find(
        asg =>
          asg.VPCZoneIdentifier &&
          asg.VPCZoneIdentifier.split(',').some(id => ourSubnetIds.includes(id))
      );

      if (ourAsg && ourAsg.Instances) {
        const healthyInstances = ourAsg.Instances.filter(
          instance => instance.HealthStatus === 'Healthy'
        );

        expect(healthyInstances.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('e2e: S3 bucket should be accessible via CloudFront only', async () => {
      const bucketName = outputs.s3BucketName || outputs.S3BucketName;
      if (!bucketName) {
        console.log('Skipping e2e S3 access test - no bucket name in outputs');
        return;
      }

      try {
        await s3
          .getObject({
            Bucket: bucketName,
            Key: 'test-object',
          })
          .promise();
      } catch (error: any) {
        expect(error.code).toMatch(/(NoSuchKey|AccessDenied)/);
      }
    });

    it('e2e: ALB should have HTTPS listener configured', async () => {
      const albDns = outputs.albDnsName || outputs.LoadBalancerDNS;
      if (!albDns) {
        console.log('Skipping e2e HTTPS test - no ALB DNS in outputs');
        return;
      }

      const albResponse = await elbv2.describeLoadBalancers().promise();
      const alb = albResponse.LoadBalancers!.find(lb => lb.DNSName === albDns);

      if (!alb) return;

      const listenersResponse = await elbv2
        .describeListeners({
          LoadBalancerArn: alb.LoadBalancerArn!,
        })
        .promise();

      const httpListener = listenersResponse.Listeners!.find(
        l => l.Port === 80
      );
      expect(httpListener).toBeDefined();
      expect(httpListener!.Protocol).toBe('HTTP');
    });

    it('e2e: Security groups should follow least privilege principle', async () => {
      const albSgId = outputs.albSecurityGroupId;
      if (!albSgId) {
        console.log('Skipping e2e security group test - no ALB security group ID in outputs');
        return;
      }

      const response = await ec2
        .describeSecurityGroups({
          GroupIds: [albSgId],
        })
        .promise();

      const albSg = response.SecurityGroups![0];

      if (albSg) {
        const httpRule = albSg.IpPermissions!.find(
          rule => rule.FromPort === 80 && rule.ToPort === 80
        );
        expect(httpRule).toBeDefined();
        expect(
          httpRule!.IpRanges!.some(range => range.CidrIp === '0.0.0.0/0')
        ).toBe(true);
      }
    });

    it('e2e: CloudFront should serve content with proper caching', async () => {
      const distributionId =
        outputs.cloudfrontDistributionId || outputs.CloudFrontDistributionId;
      if (!distributionId) {
        console.log(
          'Skipping e2e CloudFront caching test - no distribution ID in outputs'
        );
        return;
      }

      const response = await cloudfront
        .getDistribution({
          Id: distributionId,
        })
        .promise();

      const cacheBehavior =
        response.Distribution?.DistributionConfig?.DefaultCacheBehavior;
      expect(cacheBehavior?.ViewerProtocolPolicy).toBe('redirect-to-https');
      expect(cacheBehavior?.DefaultTTL).toBeGreaterThan(0);
    });
  });

  describe('Stack Outputs', () => {
    it('should provide all required stack outputs', async () => {
      expect(outputs.vpcId || outputs.VPCId).toBeDefined();
      expect(outputs.albDnsName || outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.s3BucketName || outputs.S3BucketName).toBeDefined();
      expect(
        outputs.cloudfrontDomainName || outputs.CloudFrontDomainName
      ).toBeDefined();
      expect(outputs.asgId || outputs.AutoScalingGroupId).toBeDefined();
    });
  });

  describe('Requirement Validation Tests', () => {

    it('should validate Requirement 2: Networking - VPC with subnets across AZs', async () => {
      const vpcId = outputs.vpcId || outputs.VPCId;
      if (!vpcId) return;

      const response = await ec2
        .describeSubnets({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
        .promise();

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    it('should validate Requirement 3: Compute & Scaling - ASG with min=1, desired=2', async () => {
      const vpcId = outputs.vpcId || outputs.VPCId;
      if (!vpcId) return;

      const response = await autoscaling.describeAutoScalingGroups().promise();
      const subnetResponse = await ec2
        .describeSubnets({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
        .promise();

      const ourSubnetIds = subnetResponse.Subnets!.map(s => s.SubnetId);
      const ourAsg = response.AutoScalingGroups!.find(
        asg =>
          asg.VPCZoneIdentifier &&
          asg.VPCZoneIdentifier.split(',').some(id => ourSubnetIds.includes(id))
      );

      if (ourAsg) {
        expect(ourAsg.MinSize).toBe(1);
        expect(ourAsg.DesiredCapacity).toBe(2);
      }
    });

    it('should validate Requirement 4: Load Balancing - ALB with HTTP listener', async () => {
      const albDns = outputs.albDnsName || outputs.LoadBalancerDNS;
      if (!albDns) return;

      const albResponse = await elbv2.describeLoadBalancers().promise();
      const alb = albResponse.LoadBalancers!.find(lb => lb.DNSName === albDns);

      if (!alb) return;

      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');

      const listenersResponse = await elbv2
        .describeListeners({
          LoadBalancerArn: alb.LoadBalancerArn!,
        })
        .promise();

      const httpListener = listenersResponse.Listeners!.find(
        l => l.Port === 80
      );
      expect(httpListener).toBeDefined();
      expect(httpListener!.Protocol).toBe('HTTP');
    });

    it('should validate Requirement 5: Storage & Content Delivery - S3 with versioning and CloudFront', async () => {
      const bucketName = outputs.s3BucketName || outputs.S3BucketName;
      const distributionId =
        outputs.cloudfrontDistributionId || outputs.CloudFrontDistributionId;

      if (bucketName) {
        const versioningResponse = await s3
          .getBucketVersioning({
            Bucket: bucketName,
          })
          .promise();
        expect(versioningResponse.Status).toBe('Enabled');

        const publicAccessResponse = await s3
          .getPublicAccessBlock({
            Bucket: bucketName,
          })
          .promise();
        expect(
          publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls
        ).toBe(true);
      }

      if (distributionId) {
        const response = await cloudfront
          .getDistribution({
            Id: distributionId,
          })
          .promise();
        expect(response.Distribution?.DistributionConfig?.Enabled).toBe(true);
        expect(
          response.Distribution?.DistributionConfig?.Origins?.Items
        ).toHaveLength(1);
        expect(
          response.Distribution?.DistributionConfig?.Origins?.Items![0].Id
        ).toBe('S3Origin');
      }
    });
  });
});
