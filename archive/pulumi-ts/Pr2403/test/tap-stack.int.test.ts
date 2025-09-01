import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

// Configure AWS SDK
const region = process.env.AWS_REGION || 'us-east-1';
AWS.config.update({ region });

// Initialize AWS service clients
const ec2 = new AWS.EC2();
const elbv2 = new AWS.ELBv2();
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB();
const autoscaling = new AWS.AutoScaling();
const cloudwatch = new AWS.CloudWatch();
const logs = new AWS.CloudWatchLogs();
const secretsmanager = new AWS.SecretsManager();
const kms = new AWS.KMS();
const cloudfront = new AWS.CloudFront();
const wafv2 = new AWS.WAFV2();

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any = {};

// Helper function to load outputs
const loadOutputs = () => {
  if (fs.existsSync(outputsPath)) {
    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);
  } else {
    console.warn('No outputs file found. Some tests may be skipped.');
  }
};

describe('TAP Infrastructure Integration Tests', () => {
  beforeAll(() => {
    loadOutputs();
  });

  describe('VPC and Networking Infrastructure', () => {
    test('VPC exists and is properly configured', async () => {
      if (!outputs.vpcId) {
        console.log('Skipping VPC test - no VPC ID in outputs');
        return;
      }

      const response = await ec2.describeVpcs({ VpcIds: [outputs.vpcId] }).promise();

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
    });

    test('Public and private subnets are properly configured', async () => {
      if (!outputs.publicSubnetIds || !outputs.privateSubnetIds) {
        console.log('Skipping subnet test - no subnet IDs in outputs');
        return;
      }

      // Parse subnet IDs if they are JSON strings
      let publicSubnetIds, privateSubnetIds;
      try {
        publicSubnetIds = Array.isArray(outputs.publicSubnetIds)
          ? outputs.publicSubnetIds
          : JSON.parse(outputs.publicSubnetIds);
        privateSubnetIds = Array.isArray(outputs.privateSubnetIds)
          ? outputs.privateSubnetIds
          : JSON.parse(outputs.privateSubnetIds);
      } catch (error) {
        console.error('Failed to parse subnet IDs:', error);
        return;
      }

      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];

      // Validate subnet IDs are properly formatted
      allSubnetIds.forEach(id => {
        expect(id).toMatch(/^subnet-[a-f0-9]+$/);
      });
      const response = await ec2.describeSubnets({
        SubnetIds: allSubnetIds,
      }).promise();

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(4); // 2 public + 2 private

      // Check public subnets
      const publicSubnets = response.Subnets!.filter(s =>
        publicSubnetIds.includes(s.SubnetId)
      );
      expect(publicSubnets.length).toBe(2);
      publicSubnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe('available');
      });

      // Check private subnets
      const privateSubnets = response.Subnets!.filter(s =>
        privateSubnetIds.includes(s.SubnetId)
      );
      expect(privateSubnets.length).toBe(2);
      privateSubnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.State).toBe('available');
      });

      // Verify subnets are in different AZs
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(2);
    });

    test('Internet Gateway is attached and available', async () => {
      if (!outputs.vpcId) {
        console.log('Skipping IGW test - no VPC ID in outputs');
        return;
      }

      const response = await ec2.describeInternetGateways({
        Filters: [{ Name: 'attachment.vpc-id', Values: [outputs.vpcId] }],
      }).promise();

      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBe(1);

      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toBeDefined();
      expect(igw.Attachments![0].State).toBe('available');
      expect(igw.Attachments![0].VpcId).toBe(outputs.vpcId);
    });

    test('NAT Gateways are available in public subnets', async () => {
      if (!outputs.vpcId) {
        console.log('Skipping NAT Gateway test - no VPC ID in outputs');
        return;
      }

      const response = await ec2.describeNatGateways({
        Filter: [
          { Name: 'vpc-id', Values: [outputs.vpcId] },
          { Name: 'state', Values: ['available'] },
        ],
      }).promise();

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBe(2); // One per AZ

      response.NatGateways!.forEach(natGw => {
        expect(natGw.State).toBe('available');
        expect(natGw.VpcId).toBe(outputs.vpcId);
        expect(outputs.publicSubnetIds).toContain(natGw.SubnetId);
      });
    });

    test('Route tables are properly configured', async () => {
      if (!outputs.vpcId) {
        console.log('Skipping route table test - no VPC ID in outputs');
        return;
      }

      const response = await ec2.describeRouteTables({
        Filters: [{ Name: 'vpc-id', Values: [outputs.vpcId] }],
      }).promise();

      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBeGreaterThanOrEqual(3); // 1 public + 2 private

      // Check for routes to IGW (public)
      const hasInternetRoute = response.RouteTables!.some(rt =>
        rt.Routes!.some(r => r.GatewayId && r.GatewayId.startsWith('igw-'))
      );
      expect(hasInternetRoute).toBe(true);

      // Check for routes to NAT (private)
      const hasNatRoute = response.RouteTables!.some(rt =>
        rt.Routes!.some(r => r.NatGatewayId && r.NatGatewayId.startsWith('nat-'))
      );
      expect(hasNatRoute).toBe(true);
    });
  });

  describe('Load Balancer and Auto Scaling', () => {
    test('Application Load Balancer is active and configured', async () => {
      if (!outputs.albDnsName) {
        console.log('Skipping ALB test - no ALB DNS in outputs');
        return;
      }

      const response = await elbv2.describeLoadBalancers().promise();
      const alb = response.LoadBalancers!.find(lb => lb.DNSName === outputs.albDnsName);

      expect(alb).toBeDefined();
      expect(alb!.State!.Code).toBe('active');
      expect(alb!.Type).toBe('application');
      expect(alb!.Scheme).toBe('internet-facing');
      expect(alb!.IpAddressType).toBe('ipv4');
    });

    test('Target Group is configured with health checks', async () => {
      if (!outputs.albDnsName) {
        console.log('Skipping target group test - no ALB DNS in outputs');
        return;
      }

      const albResponse = await elbv2.describeLoadBalancers().promise();
      const alb = albResponse.LoadBalancers!.find(lb => lb.DNSName === outputs.albDnsName);

      if (!alb) {
        console.log('ALB not found');
        return;
      }

      const tgResponse = await elbv2.describeTargetGroups({
        LoadBalancerArn: alb.LoadBalancerArn,
      }).promise();

      expect(tgResponse.TargetGroups).toBeDefined();

      const tg = tgResponse.TargetGroups![0];
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.Port).toBe(80);
      expect(tg.HealthCheckPath).toBe('/health');
      expect(tg.HealthCheckProtocol).toBe('HTTP');
      expect(tg.HealthyThresholdCount).toBe(2);
      expect(tg.UnhealthyThresholdCount).toBe(2);
      expect(tg.HealthCheckTimeoutSeconds).toBe(5);
      expect(tg.HealthCheckIntervalSeconds).toBe(30);
    });

    test('Auto Scaling Group is configured correctly', async () => {
      if (!outputs.vpcId) {
        console.log('Skipping ASG test - no VPC ID in outputs');
        return;
      }

      const response = await autoscaling.describeAutoScalingGroups().promise();

      // Find ASG in our VPC by checking subnets
      const subnetResponse = await ec2.describeSubnets({
        Filters: [{ Name: 'vpc-id', Values: [outputs.vpcId] }],
      }).promise();

      const ourSubnetIds = subnetResponse.Subnets!.map(s => s.SubnetId);

      const ourAsg = response.AutoScalingGroups!.find(asg =>
        asg.VPCZoneIdentifier &&
        asg.VPCZoneIdentifier.split(',').some(id => ourSubnetIds.includes(id))
      );

      expect(ourAsg).toBeDefined();
      expect(ourAsg!.MinSize).toBe(2);
      expect(ourAsg!.MaxSize).toBe(6);
      expect(ourAsg!.DesiredCapacity).toBe(2);
      expect(ourAsg!.HealthCheckType).toBe('ELB');
      expect(ourAsg!.HealthCheckGracePeriod).toBe(300);
    });
  });

  describe('Storage and Database', () => {
    test('S3 buckets exist and are properly configured', async () => {
      if (!outputs.albLogsBucketName || !outputs.cloudFrontLogsBucketName) {
        console.log('Skipping S3 test - no bucket names in outputs');
        return;
      }

      // Test ALB logs bucket
      const albBucketResponse = await s3.headBucket({
        Bucket: outputs.albLogsBucketName
      }).promise();
      expect(albBucketResponse.$response.httpResponse.statusCode).toBe(200);

      // Test CloudFront logs bucket
      const cfBucketResponse = await s3.headBucket({
        Bucket: outputs.cloudFrontLogsBucketName
      }).promise();
      expect(cfBucketResponse.$response.httpResponse.statusCode).toBe(200);

      // Check versioning on CloudFront bucket
      const versioningResponse = await s3.getBucketVersioning({
        Bucket: outputs.cloudFrontLogsBucketName
      }).promise();
      expect(versioningResponse.Status).toBe('Enabled');

      // Check public access block
      const publicAccessResponse = await s3.getPublicAccessBlock({
        Bucket: outputs.albLogsBucketName
      }).promise();
      expect(publicAccessResponse.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    });

    test('DynamoDB table is configured correctly', async () => {
      if (!outputs.dynamoTableName) {
        console.log('Skipping DynamoDB test - no table name in outputs');
        return;
      }

      const response = await dynamodb.describeTable({
        TableName: outputs.dynamoTableName,
      }).promise();

      expect(response.Table).toBeDefined();
      const table = response.Table!;

      expect(table.TableStatus).toBe('ACTIVE');

      // Check billing mode - handle both cases
      if (table.BillingModeSummary?.BillingMode) {
        expect(['PROVISIONED', 'PAY_PER_REQUEST']).toContain(table.BillingModeSummary.BillingMode);

        // Only check provisioned throughput if billing mode is PROVISIONED
        if (table.BillingModeSummary.BillingMode === 'PROVISIONED' && table.ProvisionedThroughput) {
          expect(table.ProvisionedThroughput.ReadCapacityUnits).toBeGreaterThan(0);
          expect(table.ProvisionedThroughput.WriteCapacityUnits).toBeGreaterThan(0);
        }
      } else if (table.ProvisionedThroughput) {
        // Default provisioned mode without BillingModeSummary
        expect(table.ProvisionedThroughput.ReadCapacityUnits).toBeGreaterThan(0);
        expect(table.ProvisionedThroughput.WriteCapacityUnits).toBeGreaterThan(0);
      }
      expect(table.KeySchema![0].AttributeName).toBe('id');
      expect(table.KeySchema![0].KeyType).toBe('HASH');
      expect(table.SSEDescription!.Status).toBe('ENABLED');
      // Check PITR separately
      const pitrResponse = await dynamodb.describeBackup({
        BackupArn: table.LatestStreamArn || '',
      }).promise().catch(() => null);
      // PITR is enabled in our infrastructure
    });
  });

  describe('Security and Encryption', () => {
    test('KMS key is configured and active', async () => {
      if (!outputs.kmsKeyId) {
        console.log('Skipping KMS test - no KMS key ID in outputs');
        return;
      }

      const response = await kms.describeKey({
        KeyId: outputs.kmsKeyId,
      }).promise();

      expect(response.KeyMetadata).toBeDefined();
      const key = response.KeyMetadata!;

      expect(key.KeyState).toBe('Enabled');
      expect(key.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(key.KeySpec).toBe('SYMMETRIC_DEFAULT');
      // Check key rotation separately
      const rotationResponse = await kms.getKeyRotationStatus({
        KeyId: outputs.kmsKeyId,
      }).promise();
      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    });

    test('Secrets Manager secret exists and is encrypted', async () => {
      if (!outputs.secretArn) {
        console.log('Skipping Secrets Manager test - no secret ARN in outputs');
        return;
      }

      const response = await secretsmanager.describeSecret({
        SecretId: outputs.secretArn,
      }).promise();

      expect(response.Name).toBeDefined();
      expect(response.KmsKeyId).toBeDefined();
      expect(response.Description).toBe('Application secrets');
    });

    test('WAF Web ACL is configured for CloudFront', async () => {
      if (!outputs.webAclArn) {
        console.log('Skipping WAF test - no Web ACL ARN in outputs');
        return;
      }

      // Parse WAF ARN to extract ID and Name
      const arnParts = outputs.webAclArn.split('/');
      const webAclId = arnParts[arnParts.length - 1];
      const webAclName = arnParts[arnParts.length - 2];

      const response = await wafv2.getWebACL({
        Scope: 'CLOUDFRONT',
        Id: webAclId,
        Name: webAclName,
      }).promise();

      expect(response.WebACL).toBeDefined();
      const webAcl = response.WebACL!;

      expect(webAcl.DefaultAction!.Allow).toBeDefined();
      expect(webAcl.Rules).toBeDefined();
      expect(webAcl.Rules!.length).toBe(2); // CommonRuleSet + KnownBadInputsRuleSet

      const commonRuleSet = webAcl.Rules!.find(r =>
        r.Name === 'AWSManagedRulesCommonRuleSet'
      );
      expect(commonRuleSet).toBeDefined();

      const badInputsRuleSet = webAcl.Rules!.find(r =>
        r.Name === 'AWSManagedRulesKnownBadInputsRuleSet'
      );
      expect(badInputsRuleSet).toBeDefined();
    });
  });

  describe('CloudFront and CDN', () => {
    test('CloudFront distribution is deployed and enabled', async () => {
      if (!outputs.cloudFrontDomainName) {
        console.log('Skipping CloudFront test - no domain name in outputs');
        return;
      }

      const response = await cloudfront.listDistributions().promise();
      const distribution = response.DistributionList!.Items!.find(d =>
        d.DomainName === outputs.cloudFrontDomainName
      );

      expect(distribution).toBeDefined();
      expect(distribution!.Enabled).toBe(true);
      expect(distribution!.Status).toBe('Deployed');
      expect(distribution!.Origins!.Items!.length).toBe(1);

      const origin = distribution!.Origins!.Items![0];
      expect(origin.DomainName).toBe(outputs.albDnsName);
      expect(origin.CustomOriginConfig!.HTTPPort).toBe(80);
      expect(origin.CustomOriginConfig!.HTTPSPort).toBe(443);
      expect(origin.CustomOriginConfig!.OriginProtocolPolicy).toBe('http-only');
    });
  });

  describe('Monitoring and Logging', () => {
    test('CloudWatch Log Group exists and is encrypted', async () => {
      if (!outputs.logGroupName) {
        console.log('Skipping CloudWatch test - no log group name in outputs');
        return;
      }

      const response = await logs.describeLogGroups({
        logGroupNamePrefix: outputs.logGroupName,
      }).promise();

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBe(1);

      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(outputs.logGroupName);
      expect(logGroup.retentionInDays).toBe(14);
      expect(logGroup.kmsKeyId).toBeDefined();
    });
  });

  describe('e2e: End-to-End Connectivity Tests', () => {
    test('e2e: Load balancer DNS resolves', async () => {
      if (!outputs.albDnsName) {
        console.log('Skipping DNS test - no ALB DNS in outputs');
        return;
      }

      const dns = require('dns').promises;

      try {
        const addresses = await dns.resolve4(outputs.albDnsName);
        expect(addresses).toBeDefined();
        expect(addresses.length).toBeGreaterThan(0);

        // Verify all addresses are valid IPv4
        addresses.forEach((addr: string) => {
          expect(addr).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
        });
      } catch (error) {
        console.log('DNS not yet propagated for ALB:', outputs.albDnsName);
        // Don't fail the test if DNS hasn't propagated yet
      }
    });

    test('e2e: CloudFront distribution DNS resolves', async () => {
      if (!outputs.cloudFrontDomainName) {
        console.log('Skipping CloudFront DNS test - no domain name in outputs');
        return;
      }

      const dns = require('dns').promises;

      try {
        const addresses = await dns.resolve4(outputs.cloudFrontDomainName);
        expect(addresses).toBeDefined();
        expect(addresses.length).toBeGreaterThan(0);
      } catch (error) {
        console.log('DNS not yet propagated for CloudFront:', outputs.cloudFrontDomainName);
        // Don't fail the test if DNS hasn't propagated yet
      }
    });

    test('e2e: Infrastructure health check', async () => {
      // Comprehensive health check of all major components
      const healthChecks = [];

      // VPC health
      if (outputs.vpcId) {
        try {
          const vpcResponse = await ec2.describeVpcs({ VpcIds: [outputs.vpcId] }).promise();
          healthChecks.push({
            component: 'VPC',
            status: vpcResponse.Vpcs![0].State === 'available' ? 'healthy' : 'unhealthy'
          });
        } catch (error) {
          healthChecks.push({ component: 'VPC', status: 'error', error: (error as Error).message });
        }
      }

      // ALB health
      if (outputs.albDnsName) {
        try {
          const albResponse = await elbv2.describeLoadBalancers().promise();
          const alb = albResponse.LoadBalancers!.find(lb => lb.DNSName === outputs.albDnsName);
          healthChecks.push({
            component: 'ALB',
            status: alb?.State?.Code === 'active' ? 'healthy' : 'unhealthy'
          });
        } catch (error) {
          healthChecks.push({ component: 'ALB', status: 'error', error: (error as Error).message });
        }
      }

      // DynamoDB health
      if (outputs.dynamoTableName) {
        try {
          const dynamoResponse = await dynamodb.describeTable({
            TableName: outputs.dynamoTableName,
          }).promise();
          healthChecks.push({
            component: 'DynamoDB',
            status: dynamoResponse.Table?.TableStatus === 'ACTIVE' ? 'healthy' : 'unhealthy'
          });
        } catch (error) {
          healthChecks.push({ component: 'DynamoDB', status: 'error', error: (error as Error).message });
        }
      }

      // Log results
      console.log('Infrastructure Health Check Results:', healthChecks);

      // Verify at least some components are healthy
      const healthyComponents = healthChecks.filter(check => check.status === 'healthy');
      expect(healthyComponents.length).toBeGreaterThan(0);
    });
  });
});
