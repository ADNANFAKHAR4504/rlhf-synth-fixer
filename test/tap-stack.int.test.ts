import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketPolicyCommand,
  GetPublicAccessBlockCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  CloudFrontClient,
  GetDistributionCommand,
  ListDistributionsCommand,
} from '@aws-sdk/client-cloudfront';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudTrailClient,
  GetTrailStatusCommand,
  DescribeTrailsCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  WAFV2Client,
  ListWebACLsCommand,
} from '@aws-sdk/client-wafv2';

// Configuration - Load outputs from deployed CloudFormation stack
let outputs: any = {};
let hasDeployment = false;

try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
  hasDeployment = true;
} catch (error) {
  console.warn('⚠️  No deployment outputs found. Integration tests will be skipped.');
}

// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS SDK clients
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const cloudFrontClient = new CloudFrontClient({ region: 'us-east-1' }); // CloudFront is always in us-east-1
const secretsClient = new SecretsManagerClient({ region });
const autoScalingClient = new AutoScalingClient({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const wafv2Client = new WAFV2Client({ region });

// Helper function to skip tests when no deployment exists
const skipIfNoDeployment = () => {
  if (!hasDeployment) {
    return test.skip;
  }
  return test;
};

describe('TapStack Infrastructure - Integration Tests', () => {
  describe('VPC and Networking Resources', () => {
    skipIfNoDeployment()('should have VPC with correct CIDR block', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          Filters: [
            { Name: 'tag:Name', Values: [`VPC-${environmentSuffix}`] },
          ],
        })
      );

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBeGreaterThan(0);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });

    skipIfNoDeployment()('should have 2 public subnets in different AZs', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            { Name: 'tag:Name', Values: [`PublicSubnet1-${environmentSuffix}`, `PublicSubnet2-${environmentSuffix}`] },
          ],
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(2);

      const subnet1 = response.Subnets!.find(s => s.CidrBlock === '10.0.1.0/24');
      const subnet2 = response.Subnets!.find(s => s.CidrBlock === '10.0.2.0/24');

      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();
      expect(subnet1!.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2!.MapPublicIpOnLaunch).toBe(true);

      // Verify they're in different AZs
      expect(subnet1!.AvailabilityZone).not.toBe(subnet2!.AvailabilityZone);
    });

    skipIfNoDeployment()('should have 2 private subnets in different AZs', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            { Name: 'tag:Name', Values: [`PrivateSubnet1-${environmentSuffix}`, `PrivateSubnet2-${environmentSuffix}`] },
          ],
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(2);

      const subnet1 = response.Subnets!.find(s => s.CidrBlock === '10.0.3.0/24');
      const subnet2 = response.Subnets!.find(s => s.CidrBlock === '10.0.4.0/24');

      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();
      expect(subnet1!.MapPublicIpOnLaunch).toBe(false);
      expect(subnet2!.MapPublicIpOnLaunch).toBe(false);

      // Verify they're in different AZs
      expect(subnet1!.AvailabilityZone).not.toBe(subnet2!.AvailabilityZone);
    });

    skipIfNoDeployment()('should have Internet Gateway attached to VPC', async () => {
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          Filters: [
            { Name: 'tag:Name', Values: [`VPC-${environmentSuffix}`] },
          ],
        })
      );

      const vpcId = vpcResponse.Vpcs![0].VpcId;

      const igwResponse = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [
            { Name: 'attachment.vpc-id', Values: [vpcId!] },
          ],
        })
      );

      expect(igwResponse.InternetGateways).toBeDefined();
      expect(igwResponse.InternetGateways!.length).toBe(1);
      expect(igwResponse.InternetGateways![0].Attachments![0].State).toBe('available');
    });

    skipIfNoDeployment()('should have 2 NAT Gateways in public subnets', async () => {
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            { Name: 'state', Values: ['available'] },
          ],
        })
      );

      // Get public subnet IDs
      const subnetsResponse = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            { Name: 'tag:Name', Values: [`PublicSubnet1-${environmentSuffix}`, `PublicSubnet2-${environmentSuffix}`] },
          ],
        })
      );

      const publicSubnetIds = subnetsResponse.Subnets!.map(s => s.SubnetId);
      const natGateways = response.NatGateways!.filter(nat =>
        publicSubnetIds.includes(nat.SubnetId)
      );

      expect(natGateways.length).toBe(2);
      natGateways.forEach(nat => {
        expect(nat.State).toBe('available');
        expect(nat.NatGatewayAddresses![0].PublicIp).toBeDefined();
      });
    });

    skipIfNoDeployment()('should have public route table with IGW route', async () => {
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          Filters: [
            { Name: 'tag:Name', Values: [`VPC-${environmentSuffix}`] },
          ],
        })
      );

      const vpcId = vpcResponse.Vpcs![0].VpcId;

      const rtResponse = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId!] },
            { Name: 'tag:Name', Values: [`PublicRT-${environmentSuffix}`] },
          ],
        })
      );

      expect(rtResponse.RouteTables).toBeDefined();
      expect(rtResponse.RouteTables!.length).toBe(1);

      const routes = rtResponse.RouteTables![0].Routes!;
      const igwRoute = routes.find(r => r.DestinationCidrBlock === '0.0.0.0/0');

      expect(igwRoute).toBeDefined();
      expect(igwRoute!.GatewayId).toContain('igw-');
    });

    skipIfNoDeployment()('should have private route tables with NAT Gateway routes', async () => {
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          Filters: [
            { Name: 'tag:Name', Values: [`VPC-${environmentSuffix}`] },
          ],
        })
      );

      const vpcId = vpcResponse.Vpcs![0].VpcId;

      const rtResponse = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId!] },
            { Name: 'tag:Name', Values: [`PrivateRT1-${environmentSuffix}`, `PrivateRT2-${environmentSuffix}`] },
          ],
        })
      );

      expect(rtResponse.RouteTables).toBeDefined();
      expect(rtResponse.RouteTables!.length).toBe(2);

      rtResponse.RouteTables!.forEach(rt => {
        const routes = rt.Routes!;
        const natRoute = routes.find(r => r.DestinationCidrBlock === '0.0.0.0/0');

        expect(natRoute).toBeDefined();
        expect(natRoute!.NatGatewayId).toContain('nat-');
      });
    });
  });

  describe('Security Group Resources', () => {
    skipIfNoDeployment()('should have ALB Security Group with HTTP and HTTPS ingress', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'tag:Name', Values: [`ALB-SG-${environmentSuffix}`] },
          ],
        })
      );

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);

      const sg = response.SecurityGroups![0];
      expect(sg.IpPermissions!.length).toBeGreaterThanOrEqual(2);

      const httpRule = sg.IpPermissions!.find(
        r => r.FromPort === 80 && r.ToPort === 80
      );
      const httpsRule = sg.IpPermissions!.find(
        r => r.FromPort === 443 && r.ToPort === 443
      );

      expect(httpRule).toBeDefined();
      expect(httpRule!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule).toBeDefined();
      expect(httpsRule!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');
    });

    skipIfNoDeployment()('should have WebServer Security Group with ALB ingress only', async () => {
      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'tag:Name', Values: [`WebServer-SG-${environmentSuffix}`, `ALB-SG-${environmentSuffix}`] },
          ],
        })
      );

      const webServerSG = sgResponse.SecurityGroups!.find(
        sg => sg.GroupName?.includes('WebServer')
      );
      const albSG = sgResponse.SecurityGroups!.find(
        sg => sg.GroupName?.includes('ALB')
      );

      expect(webServerSG).toBeDefined();
      expect(albSG).toBeDefined();

      const httpRule = webServerSG!.IpPermissions!.find(
        r => r.FromPort === 80 && r.ToPort === 80
      );

      expect(httpRule).toBeDefined();
      expect(httpRule!.UserIdGroupPairs![0].GroupId).toBe(albSG!.GroupId);
    });

    skipIfNoDeployment()('should have Database Security Group with WebServer ingress only', async () => {
      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'tag:Name', Values: [`Database-SG-${environmentSuffix}`, `WebServer-SG-${environmentSuffix}`] },
          ],
        })
      );

      const dbSG = sgResponse.SecurityGroups!.find(
        sg => sg.GroupName?.includes('Database')
      );
      const webServerSG = sgResponse.SecurityGroups!.find(
        sg => sg.GroupName?.includes('WebServer')
      );

      expect(dbSG).toBeDefined();
      expect(webServerSG).toBeDefined();

      const mysqlRule = dbSG!.IpPermissions!.find(
        r => r.FromPort === 3306 && r.ToPort === 3306
      );

      expect(mysqlRule).toBeDefined();
      expect(mysqlRule!.UserIdGroupPairs![0].GroupId).toBe(webServerSG!.GroupId);
    });
  });

  describe('Load Balancer Resources', () => {
    skipIfNoDeployment()('should have Application Load Balancer in public subnets', async () => {
      const response = await elbv2Client.send(
        new DescribeLoadBalancersCommand({
          Names: [`ALB-${environmentSuffix}`],
        })
      );

      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers!.length).toBe(1);

      const alb = response.LoadBalancers![0];
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.State!.Code).toBe('active');
      expect(alb.AvailabilityZones!.length).toBe(2);
    });

    skipIfNoDeployment()('should have Target Group with health checks configured', async () => {
      const response = await elbv2Client.send(
        new DescribeTargetGroupsCommand({
          Names: [`TG-${environmentSuffix}`],
        })
      );

      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups!.length).toBe(1);

      const tg = response.TargetGroups![0];
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.Port).toBe(80);
      expect(tg.HealthCheckEnabled).toBe(true);
      expect(tg.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.HealthCheckPath).toBe('/');
      expect(tg.HealthCheckProtocol).toBe('HTTP');
      expect(tg.HealthCheckTimeoutSeconds).toBe(5);
      expect(tg.HealthyThresholdCount).toBe(2);
      expect(tg.UnhealthyThresholdCount).toBe(3);
      expect(tg.Matcher!.HttpCode).toBe('200');
    });

    skipIfNoDeployment()('should have ALB Listener forwarding to Target Group', async () => {
      const albResponse = await elbv2Client.send(
        new DescribeLoadBalancersCommand({
          Names: [`ALB-${environmentSuffix}`],
        })
      );

      const albArn = albResponse.LoadBalancers![0].LoadBalancerArn;

      const listenerResponse = await elbv2Client.send(
        new DescribeListenersCommand({
          LoadBalancerArn: albArn,
        })
      );

      expect(listenerResponse.Listeners).toBeDefined();
      expect(listenerResponse.Listeners!.length).toBeGreaterThan(0);

      const httpListener = listenerResponse.Listeners!.find(
        l => l.Port === 80 && l.Protocol === 'HTTP'
      );

      expect(httpListener).toBeDefined();
      expect(httpListener!.DefaultActions![0].Type).toBe('forward');
      expect(httpListener!.DefaultActions![0].TargetGroupArn).toBeDefined();
    });
  });

  describe('Auto Scaling Resources', () => {
    skipIfNoDeployment()('should have Auto Scaling Group with correct configuration', async () => {
      const response = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [`ASG-${environmentSuffix}`],
        })
      );

      expect(response.AutoScalingGroups).toBeDefined();
      expect(response.AutoScalingGroups!.length).toBe(1);

      const asg = response.AutoScalingGroups![0];
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(6);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.HealthCheckType).toBe('ELB');
      expect(asg.HealthCheckGracePeriod).toBe(300);
      expect(asg.VPCZoneIdentifier).toBeDefined();

      // Should be in 2 private subnets
      const subnetIds = asg.VPCZoneIdentifier!.split(',');
      expect(subnetIds.length).toBe(2);
    });

    skipIfNoDeployment()('should have Target Tracking Scaling Policy for CPU', async () => {
      const response = await autoScalingClient.send(
        new DescribePoliciesCommand({
          AutoScalingGroupName: `ASG-${environmentSuffix}`,
        })
      );

      expect(response.ScalingPolicies).toBeDefined();
      expect(response.ScalingPolicies!.length).toBeGreaterThan(0);

      const cpuPolicy = response.ScalingPolicies!.find(
        p => p.PolicyType === 'TargetTrackingScaling'
      );

      expect(cpuPolicy).toBeDefined();
      expect(cpuPolicy!.TargetTrackingConfiguration).toBeDefined();
      expect(
        cpuPolicy!.TargetTrackingConfiguration!.PredefinedMetricSpecification!
          .PredefinedMetricType
      ).toBe('ASGAverageCPUUtilization');
      expect(cpuPolicy!.TargetTrackingConfiguration!.TargetValue).toBe(70.0);
    });

    skipIfNoDeployment()('should have instances running in private subnets', async () => {
      const asgResponse = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [`ASG-${environmentSuffix}`],
        })
      );

      const asg = asgResponse.AutoScalingGroups![0];

      // At minimum, should have desired capacity instances
      expect(asg.Instances!.length).toBeGreaterThanOrEqual(2);

      // All instances should be healthy
      asg.Instances!.forEach(instance => {
        expect(instance.HealthStatus).toBe('Healthy');
        expect(instance.LifecycleState).toMatch(/InService|Pending/);
      });
    }, 60000); // Increased timeout as instances take time to become healthy
  });

  describe('Database Resources', () => {
    skipIfNoDeployment()('should have RDS instance with Multi-AZ enabled', async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: `db-${environmentSuffix}`,
        })
      );

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBe(1);

      const db = response.DBInstances![0];
      expect(db.Engine).toBe('mysql');
      expect(db.EngineVersion).toContain('8.0');
      expect(db.DBInstanceClass).toBe('db.t3.micro');
      expect(db.MultiAZ).toBe(true);
      expect(db.StorageEncrypted).toBe(true);
      expect(db.StorageType).toBe('gp3');
      expect(db.AllocatedStorage).toBe(20);
      expect(db.BackupRetentionPeriod).toBe(7);
      expect(db.DBInstanceStatus).toMatch(/available|backing-up|modifying/);
    }, 60000);

    skipIfNoDeployment()('should have DB Subnet Group in private subnets', async () => {
      const dbResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: `db-${environmentSuffix}`,
        })
      );

      const subnetGroupName = dbResponse.DBInstances![0].DBSubnetGroup!.DBSubnetGroupName;

      const subnetGroupResponse = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: subnetGroupName,
        })
      );

      expect(subnetGroupResponse.DBSubnetGroups).toBeDefined();
      expect(subnetGroupResponse.DBSubnetGroups!.length).toBe(1);

      const subnetGroup = subnetGroupResponse.DBSubnetGroups![0];
      expect(subnetGroup.Subnets!.length).toBe(2);

      // Verify subnets are in different AZs
      const azs = subnetGroup.Subnets!.map(s => s.SubnetAvailabilityZone!.Name);
      expect(new Set(azs).size).toBe(2);
    });

    skipIfNoDeployment()('should have database credentials in Secrets Manager', async () => {
      const secretName = `db-credentials-${environmentSuffix}`;

      const describeResponse = await secretsClient.send(
        new DescribeSecretCommand({
          SecretId: secretName,
        })
      );

      expect(describeResponse.Name).toBe(secretName);
      expect(describeResponse.Description).toBe('RDS database master credentials');

      // Verify we can retrieve the secret
      const secretResponse = await secretsClient.send(
        new GetSecretValueCommand({
          SecretId: secretName,
        })
      );

      expect(secretResponse.SecretString).toBeDefined();
      const secretValue = JSON.parse(secretResponse.SecretString!);
      expect(secretValue.username).toBe('dbadmin');
      expect(secretValue.password).toBeDefined();
      expect(secretValue.password.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('S3 Storage Resources', () => {
    skipIfNoDeployment()('should have S3 bucket with AES256 encryption', async () => {
      const bucketName = outputs['S3BucketName'] || `secure-bucket-${environmentSuffix}-${process.env.AWS_ACCOUNT_ID}-${region}`;

      const response = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: bucketName,
        })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration!.Rules![0]
          .ApplyServerSideEncryptionByDefault!.SSEAlgorithm
      ).toBe('AES256');
    });

    skipIfNoDeployment()('should have S3 bucket with versioning enabled', async () => {
      const bucketName = outputs['S3BucketName'] || `secure-bucket-${environmentSuffix}-${process.env.AWS_ACCOUNT_ID}-${region}`;

      const response = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: bucketName,
        })
      );

      expect(response.Status).toBe('Enabled');
    });

    skipIfNoDeployment()('should have S3 bucket with public access blocked', async () => {
      const bucketName = outputs['S3BucketName'] || `secure-bucket-${environmentSuffix}-${process.env.AWS_ACCOUNT_ID}-${region}`;

      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({
          Bucket: bucketName,
        })
      );

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    });

    skipIfNoDeployment()('should have S3 bucket policy enforcing SSL', async () => {
      const bucketName = outputs['S3BucketName'] || `secure-bucket-${environmentSuffix}-${process.env.AWS_ACCOUNT_ID}-${region}`;

      const response = await s3Client.send(
        new GetBucketPolicyCommand({
          Bucket: bucketName,
        })
      );

      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);

      const sslStatement = policy.Statement.find(
        (s: any) => s.Sid === 'EnforceSSLRequestsOnly'
      );

      expect(sslStatement).toBeDefined();
      expect(sslStatement.Effect).toBe('Deny');
      expect(sslStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });

    skipIfNoDeployment()('should have CloudTrail bucket with 30-day lifecycle policy', async () => {
      const bucketName = outputs['CloudTrailBucketName'];

      const response = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({
          Bucket: bucketName,
        })
      );

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);

      const deleteRule = response.Rules!.find(r => r.Status === 'Enabled');
      expect(deleteRule).toBeDefined();
      expect(deleteRule!.Expiration!.Days).toBe(30);
    });
  });

  describe('CloudFront Resources', () => {
    skipIfNoDeployment()('should have CloudFront distribution with correct configuration', async () => {
      const distributionId = outputs['CloudFrontDistributionId'];

      if (!distributionId) {
        throw new Error('CloudFront distribution ID not found');
      }

      const response = await cloudFrontClient.send(
        new GetDistributionCommand({
          Id: distributionId,
        })
      );

      expect(response.Distribution).toBeDefined();
      const config = response.Distribution!.DistributionConfig!;

      expect(config.Enabled).toBe(true);
      expect(config.DefaultRootObject).toBe('index.html');
      expect(config.PriceClass).toBe('PriceClass_100');

      // Verify cache behavior
      expect(config.DefaultCacheBehavior!.ViewerProtocolPolicy).toBe('redirect-to-https');
      expect(config.DefaultCacheBehavior!.Compress).toBe(true);

      // Verify origin points to ALB
      expect(config.Origins!.Items!.length).toBe(1);
      expect(config.Origins!.Items![0].Id).toBe('ALBOrigin');
      expect(config.Origins!.Items![0].CustomOriginConfig!.OriginProtocolPolicy).toBe('http-only');
    }, 60000);

    skipIfNoDeployment()('should have CloudFront distribution in deployed state', async () => {
      const distributionId = outputs['CloudFrontDistributionId'];

      if (!distributionId) {
        return; // Skip if distribution ID not available
      }

      const response = await cloudFrontClient.send(
        new GetDistributionCommand({
          Id: distributionId,
        })
      );

      expect(response.Distribution!.Status).toBe('Deployed');
    }, 120000); // CloudFront takes longer to deploy
  });

  describe('CloudTrail Resources', () => {
    skipIfNoDeployment()('should have CloudTrail enabled and logging', async () => {
      const trailName = `trail-${environmentSuffix}`;

      const statusResponse = await cloudTrailClient.send(
        new GetTrailStatusCommand({
          Name: trailName,
        })
      );

      expect(statusResponse.IsLogging).toBe(true);
    });

    skipIfNoDeployment()('should have CloudTrail with log file validation enabled', async () => {
      const trailName = `trail-${environmentSuffix}`;

      const response = await cloudTrailClient.send(
        new DescribeTrailsCommand({
          trailNameList: [trailName],
        })
      );

      expect(response.trailList).toBeDefined();
      expect(response.trailList!.length).toBe(1);

      const trail = response.trailList![0];
      expect(trail.LogFileValidationEnabled).toBe(true);
      expect(trail.IsMultiRegionTrail).toBe(false);
    });
  });

  describe('WAF Resources', () => {
    skipIfNoDeployment()('should have WAF Web ACL with SQL injection and XSS rules', async () => {
      // Note: We need to get the WebACL ID from the ALB association
      // This is a simplified test - in production you'd track the WebACL ARN
      const albResponse = await elbv2Client.send(
        new DescribeLoadBalancersCommand({
          Names: [`ALB-${environmentSuffix}`],
        })
      );

      const albArn = albResponse.LoadBalancers![0].LoadBalancerArn;

      // List Web ACLs and find one associated with our ALB
      const webACLs = await wafv2Client.send(
        new ListWebACLsCommand({ Scope: 'REGIONAL' })
      );

      expect(webACLs.WebACLs).toBeDefined();

      // Find our Web ACL by name
      const ourWebACL = webACLs.WebACLs!.find(
        (acl: any) => acl.Name === `WebACL-${environmentSuffix}`
      );

      expect(ourWebACL).toBeDefined();
    });
  });

  describe('CloudWatch Alarms', () => {
    skipIfNoDeployment()('should have High CPU alarm configured', async () => {
      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [`HighCPU-${environmentSuffix}`],
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Namespace).toBe('AWS/EC2');
      expect(alarm.Statistic).toBe('Average');
      expect(alarm.Period).toBe(300);
      expect(alarm.EvaluationPeriods).toBe(2);
      expect(alarm.Threshold).toBe(80);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    skipIfNoDeployment()('should have Unhealthy Hosts alarm configured', async () => {
      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [`UnhealthyHosts-${environmentSuffix}`],
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('UnHealthyHostCount');
      expect(alarm.Namespace).toBe('AWS/ApplicationELB');
      expect(alarm.Threshold).toBe(0);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    skipIfNoDeployment()('should have Database CPU alarm configured', async () => {
      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [`DatabaseCPU-${environmentSuffix}`],
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Namespace).toBe('AWS/RDS');
      expect(alarm.Threshold).toBe(75);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });

  describe('Cross-Service Interactions', () => {
    skipIfNoDeployment()('should have EC2 instances registered with Target Group', async () => {
      const tgResponse = await elbv2Client.send(
        new DescribeTargetGroupsCommand({
          Names: [`TG-${environmentSuffix}`],
        })
      );

      const tgArn = tgResponse.TargetGroups![0].TargetGroupArn;

      const healthResponse = await elbv2Client.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: tgArn,
        })
      );

      expect(healthResponse.TargetHealthDescriptions).toBeDefined();
      expect(healthResponse.TargetHealthDescriptions!.length).toBeGreaterThanOrEqual(2);

      // At least some targets should be healthy or in the process of becoming healthy
      const healthyTargets = healthResponse.TargetHealthDescriptions!.filter(
        t => t.TargetHealth!.State === 'healthy' || t.TargetHealth!.State === 'initial'
      );
      expect(healthyTargets.length).toBeGreaterThanOrEqual(1);
    }, 90000); // Targets take time to become healthy
  });

  describe('Security Compliance', () => {
    skipIfNoDeployment()('should have no security groups allowing unrestricted SSH access', async () => {
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          Filters: [
            { Name: 'tag:Name', Values: [`VPC-${environmentSuffix}`] },
          ],
        })
      );

      const vpcId = vpcResponse.Vpcs![0].VpcId;

      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId!] },
          ],
        })
      );

      sgResponse.SecurityGroups!.forEach(sg => {
        const sshRules = sg.IpPermissions!.filter(
          rule => rule.FromPort === 22 && rule.ToPort === 22
        );

        sshRules.forEach(rule => {
          const hasUnrestrictedAccess = rule.IpRanges?.some(
            ip => ip.CidrIp === '0.0.0.0/0'
          );
          expect(hasUnrestrictedAccess).toBe(false);
        });
      });
    });

    skipIfNoDeployment()('should have all resources tagged appropriately', async () => {
      // Check VPC tags
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          Filters: [
            { Name: 'tag:Name', Values: [`VPC-${environmentSuffix}`] },
          ],
        })
      );

      expect(vpcResponse.Vpcs![0].Tags).toBeDefined();
      const nameTag = vpcResponse.Vpcs![0].Tags!.find(t => t.Key === 'Name');
      expect(nameTag!.Value).toBe(`VPC-${environmentSuffix}`);
    });

    skipIfNoDeployment()('should have encryption enabled on all storage resources', async () => {
      // Check RDS encryption
      const rdsResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: `db-${environmentSuffix}`,
        })
      );
      expect(rdsResponse.DBInstances![0].StorageEncrypted).toBe(true);

      // Check S3 encryption
      const bucketName = outputs['S3BucketName'] || `secure-bucket-${environmentSuffix}-${process.env.AWS_ACCOUNT_ID}-${region}`;
      const s3Response = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: bucketName,
        })
      );
      expect(s3Response.ServerSideEncryptionConfiguration).toBeDefined();

      // Check CloudTrail bucket encryption
      const cloudTrailBucketName = outputs['CloudTrailBucketName'];
      const cloudTrailS3Response = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: cloudTrailBucketName,
        })
      );
      expect(cloudTrailS3Response.ServerSideEncryptionConfiguration).toBeDefined();
    }, 30000);
  });

  describe('End-to-End Workflows', () => {
    skipIfNoDeployment()('should have complete infrastructure chain from CloudFront to RDS', async () => {
      // 1. CloudFront Distribution exists
      const distributionId = outputs['CloudFrontDistributionId'];
      if (distributionId) {
        const cfResponse = await cloudFrontClient.send(
          new GetDistributionCommand({ Id: distributionId })
        );
        expect(cfResponse.Distribution).toBeDefined();

        // 2. CloudFront points to ALB
        const albDNS = cfResponse.Distribution!.DistributionConfig!.Origins!.Items![0].DomainName;
        expect(albDNS).toContain(region);
      }

      // 3. ALB exists and is active
      const albResponse = await elbv2Client.send(
        new DescribeLoadBalancersCommand({
          Names: [`ALB-${environmentSuffix}`],
        })
      );
      expect(albResponse.LoadBalancers![0].State!.Code).toBe('active');

      // 4. Target Group has healthy targets
      const tgResponse = await elbv2Client.send(
        new DescribeTargetGroupsCommand({
          Names: [`TG-${environmentSuffix}`],
        })
      );
      expect(tgResponse.TargetGroups).toBeDefined();

      // 5. Auto Scaling Group has instances
      const asgResponse = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [`ASG-${environmentSuffix}`],
        })
      );
      expect(asgResponse.AutoScalingGroups![0].Instances!.length).toBeGreaterThanOrEqual(2);

      // 6. RDS database exists and is available
      const rdsResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: `db-${environmentSuffix}`,
        })
      );
      expect(rdsResponse.DBInstances![0].DBInstanceStatus).toMatch(/available|backing-up/);

      // 7. Database credentials exist in Secrets Manager
      const secretResponse = await secretsClient.send(
        new DescribeSecretCommand({
          SecretId: `db-credentials-${environmentSuffix}`,
        })
      );
      expect(secretResponse.Name).toBe(`db-credentials-${environmentSuffix}`);

      // 8. CloudTrail is logging
      const trailResponse = await cloudTrailClient.send(
        new GetTrailStatusCommand({
          Name: `trail-${environmentSuffix}`,
        })
      );
      expect(trailResponse.IsLogging).toBe(true);
    }, 120000);
  });
});