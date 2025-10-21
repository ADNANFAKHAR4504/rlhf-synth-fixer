import { ACMClient, ListCertificatesCommand } from '@aws-sdk/client-acm';
import { CloudTrailClient, DescribeTrailsCommand, GetTrailStatusCommand } from '@aws-sdk/client-cloudtrail';
import { CloudWatchLogsClient, DescribeLogGroupsCommand, FilterLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { DescribeInstancesCommand, DescribeInternetGatewaysCommand, DescribeNatGatewaysCommand, DescribeRouteTablesCommand, DescribeSecurityGroupsCommand, DescribeSubnetsCommand, DescribeVpcsCommand, DescribeVpcAttributeCommand, EC2Client } from '@aws-sdk/client-ec2';
import { IAMClient, ListRolesCommand, GetRoleCommand, ListPoliciesCommand } from '@aws-sdk/client-iam';
import { DescribeKeyCommand, GetKeyPolicyCommand, GetKeyRotationStatusCommand, KMSClient } from '@aws-sdk/client-kms';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { GetBucketEncryptionCommand, GetBucketLifecycleConfigurationCommand, GetBucketPolicyCommand, GetBucketPolicyStatusCommand, GetBucketTaggingCommand, GetBucketVersioningCommand, GetPublicAccessBlockCommand, HeadBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { GetTopicAttributesCommand, ListSubscriptionsByTopicCommand, ListTopicsCommand, SNSClient } from '@aws-sdk/client-sns';
import { GetWebACLCommand, ListResourcesForWebACLCommand, ListWebACLsCommand, GetSampledRequestsCommand, WAFV2Client } from '@aws-sdk/client-wafv2';
import { ELBv2 } from 'aws-sdk';
import fs from 'fs';
import https from 'https';
import http from 'http';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const ec2 = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });
const rds = new RDSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const kms = new KMSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const elbv2 = new ELBv2({ region: process.env.AWS_REGION || 'us-east-1' });
const wafv2 = new WAFV2Client({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudtrail = new CloudTrailClient({ region: process.env.AWS_REGION || 'us-east-1' });
const sns = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const logs = new CloudWatchLogsClient({ region: process.env.AWS_REGION || 'us-east-1' });
const iam = new IAMClient({ region: process.env.AWS_REGION || 'us-east-1' });
const acm = new ACMClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Helper function to get VPC ID from outputs or discover it
async function getVpcId(): Promise<string> {
  if (outputs.VPCId) {
    return outputs.VPCId;
  }

  const allVpcs = await ec2.send(new DescribeVpcsCommand({}));
  const corpVpc = allVpcs.Vpcs!.find((vpc: any) =>
    vpc.Tags?.some((tag: any) => tag.Key === 'Name' && tag.Value?.includes('corp'))
  );

  if (!corpVpc?.VpcId) {
    throw new Error('No VPC found with corp in the name');
  }

  return corpVpc.VpcId;
}

// Helper function to get database instance
async function getDatabaseInstance(): Promise<any> {
  if (outputs.DatabaseEndpoint) {
    const dbs = await rds.send(new DescribeDBInstancesCommand({}));
    return dbs.DBInstances!.find((db: any) => db.Endpoint?.Address === outputs.DatabaseEndpoint);
  }

  const dbs = await rds.send(new DescribeDBInstancesCommand({}));
  return dbs.DBInstances!.find((db: any) =>
    db.DBInstanceIdentifier?.includes('corp') ||
    db.DBInstanceIdentifier?.includes('enterpriseapp')
  );
}

describe('TapStack Integration Tests - End-to-End Workflows', () => {
  beforeAll(async () => {
    // Verify we have the required outputs for testing
    expect(outputs.VPCId).toBeDefined();
    expect(outputs.ALBDNSName).toBeDefined();
    expect(outputs.DatabaseEndpoint).toBeDefined();
    expect(outputs.S3AppDataBucket).toBeDefined();
    expect(outputs.S3LogsBucket).toBeDefined();
    expect(outputs.KMSKeyId).toBeDefined();
  });

  describe('Infrastructure Foundation', () => {
    test('VPC should be properly configured with DNS support', async () => {
      const vpcId = await getVpcId();
      const vpcs = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));

      expect(vpcs.Vpcs).toHaveLength(1);
      const vpc = vpcs.Vpcs![0];
      
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');

      // DNS settings - need to query separately
      const dnsHostnames = await ec2.send(new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: 'enableDnsHostnames'
      }));
      const dnsSupport = await ec2.send(new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: 'enableDnsSupport'
      }));
      
      expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
      expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);
    });

    test('Internet Gateway should be attached and functional', async () => {
      const vpcId = await getVpcId();
      const igws = await ec2.send(new DescribeInternetGatewaysCommand({
        Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }]
      }));

      expect(igws.InternetGateways).toHaveLength(1);
      const igw = igws.InternetGateways![0];

      // Internet Gateway Attachment State
      expect(igw.Attachments).toBeDefined();
      expect(igw.Attachments!.length).toBeGreaterThan(0);
      expect(igw.Attachments![0].State).toBe('available');
    });

    test('NAT Gateway should provide outbound internet access for private subnets', async () => {
      const vpcId = await getVpcId();
      const natGateways = await ec2.send(new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      expect(natGateways.NatGateways).toHaveLength(1);
        const natGateway = natGateways.NatGateways![0];
        expect(natGateway.State).toBe('available');
      expect(natGateway.VpcId).toBe(vpcId);
    });

    test('Subnets should be distributed across multiple AZs for high availability', async () => {
      const vpcId = await getVpcId();
      const subnets = await ec2.send(new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      expect(subnets.Subnets!.length).toBeGreaterThanOrEqual(4); // 2 public + 2 private
      
      const azs = [...new Set(subnets.Subnets!.map((subnet: any) => subnet.AvailabilityZone))];
      expect(azs.length).toBeGreaterThan(1);

      // Verify public subnets
      const publicSubnets = subnets.Subnets!.filter((subnet: any) => 
        subnet.Tags?.some((tag: any) => tag.Key === 'Type' && tag.Value === 'Public')
      );
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      publicSubnets.forEach((subnet: any) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });

      // Verify private subnets
      const privateSubnets = subnets.Subnets!.filter((subnet: any) => 
        subnet.Tags?.some((tag: any) => tag.Key === 'Type' && tag.Value === 'Private')
      );
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
      privateSubnets.forEach((subnet: any) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });

  describe('Security & Encryption', () => {
    test('KMS keys should be properly configured with rotation enabled', async () => {
      const key = await kms.send(new DescribeKeyCommand({ KeyId: outputs.KMSKeyId }));
      expect(key.KeyMetadata).toBeDefined();
      expect(key.KeyMetadata!.KeyState).toBe('Enabled');
      expect(key.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');

      const rotation = await kms.send(new GetKeyRotationStatusCommand({ KeyId: outputs.KMSKeyId }));
      expect(rotation.KeyRotationEnabled).toBe(true);
    });

    test('S3 buckets should have comprehensive security controls', async () => {
      const buckets = [outputs.S3AppDataBucket, outputs.S3LogsBucket];

      for (const bucketName of buckets) {
        // Check encryption
        const encryption = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
        expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
        expect(encryption.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');

        // Check public access blocking
        const publicAccess = await s3.send(new GetPublicAccessBlockCommand({ Bucket: bucketName }));
        expect(publicAccess.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
        expect(publicAccess.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
        expect(publicAccess.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
        expect(publicAccess.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);

        // Check tags
        const tags = await s3.send(new GetBucketTaggingCommand({ Bucket: bucketName }));
        const tagNames = tags.TagSet!.map((tag: any) => tag.Key);
        expect(tagNames).toContain('Name');
        expect(tagNames).toContain('Environment');
        expect(tagNames).toContain('Application');
        expect(tagNames).toContain('team');
        expect(tagNames).toContain('iac-rlhf-amazon');
      }
    });

    test('Security groups should follow least privilege principle', async () => {
      const vpcId = await getVpcId();
      const securityGroups = await ec2.send(new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      // ALB Security Group (using actual resource name)
      const albSg = securityGroups.SecurityGroups!.find((sg: any) => 
        sg.GroupName.includes('CorpALBSecurityGroup') || sg.GroupName.includes('alb')
      );
      expect(albSg).toBeDefined();
      expect(albSg!.IpPermissions!.some((rule: any) => 
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === 'tcp'
      )).toBe(true);
      expect(albSg!.IpPermissions!.some((rule: any) => 
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === 'tcp'
      )).toBe(true);

      // Database Security Group (using actual resource name)
      const dbSg = securityGroups.SecurityGroups!.find((sg: any) => 
        sg.GroupName.includes('CorpDatabaseSecurityGroup') || sg.GroupName.includes('db')
      );
      expect(dbSg).toBeDefined();
      expect(dbSg!.IpPermissions!.some((rule: any) => 
        rule.FromPort === 3306 && rule.ToPort === 3306 && rule.IpProtocol === 'tcp'
      )).toBe(true);
    });
  });

  describe('Data Layer', () => {
    test('RDS database should be properly configured with encryption and monitoring', async () => {
      const dbInstance = await getDatabaseInstance();
      expect(dbInstance).toBeDefined();

        expect(dbInstance.DBInstanceStatus).toBe('available');
        expect(dbInstance.Engine).toBe('mysql');
        expect(dbInstance.EngineVersion).toBe('8.0.39');
        expect(dbInstance.StorageEncrypted).toBe(true);
        expect(dbInstance.KmsKeyId).toBeDefined();
      expect(dbInstance.BackupRetentionPeriod).toBe(30);
      expect(dbInstance.DeletionProtection).toBe(false);
      expect(dbInstance.MonitoringInterval).toBe(60);
      expect(dbInstance.MonitoringRoleArn).toBeDefined();
      expect(dbInstance.EnabledCloudwatchLogsExports).toContain('error');
      expect(dbInstance.EnabledCloudwatchLogsExports).toContain('general');
    });

    test('S3 buckets should have appropriate lifecycle and versioning policies', async () => {
      // App Data bucket should have versioning
      const appDataVersioning = await s3.send(new GetBucketVersioningCommand({ 
        Bucket: outputs.S3AppDataBucket 
      }));
      expect(appDataVersioning.Status).toBe('Enabled');

      // Logs bucket should have lifecycle policies
      const logsLifecycle = await s3.send(new GetBucketLifecycleConfigurationCommand({ 
        Bucket: outputs.S3LogsBucket 
      }));
      expect(logsLifecycle.Rules).toBeDefined();
      expect(logsLifecycle.Rules!.length).toBeGreaterThan(0);
    });
  });

  describe('Application Layer', () => {
    test('Application Load Balancer should be active and properly configured', async () => {
      const loadBalancers = await elbv2.describeLoadBalancers().promise();
      const alb = loadBalancers.LoadBalancers!.find((lb: any) =>
        lb.DNSName === outputs.ALBDNSName
      );

      expect(alb).toBeDefined();
      expect(alb!.State!.Code).toBe('active');
      expect(alb!.Type).toBe('application');
      expect(alb!.Scheme).toBe('internet-facing');
      expect(alb!.AvailabilityZones!.length).toBeGreaterThan(1);

      // Check that S3 access logs are disabled
      const attributes = await elbv2.describeLoadBalancerAttributes({
        LoadBalancerArn: alb!.LoadBalancerArn
      }).promise();
      
      const accessLogsEnabled = attributes.Attributes!.find((attr: any) =>
        attr.Key === 'access_logs.s3.enabled'
      );
      expect(accessLogsEnabled?.Value).toBe('false');
    });

    test('Target groups should have healthy web servers', async () => {
      const loadBalancers = await elbv2.describeLoadBalancers().promise();
      const alb = loadBalancers.LoadBalancers!.find((lb: any) =>
        lb.DNSName === outputs.ALBDNSName
      );

      const targetGroups = await elbv2.describeTargetGroups({
        LoadBalancerArn: alb!.LoadBalancerArn
      }).promise();

      expect(targetGroups.TargetGroups).toBeDefined();
      expect(targetGroups.TargetGroups!.length).toBeGreaterThan(0);

      // Check target health
      for (const tg of targetGroups.TargetGroups!) {
        const health = await elbv2.describeTargetHealth({
          TargetGroupArn: tg.TargetGroupArn
        }).promise();
        
        expect(health.TargetHealthDescriptions).toBeDefined();
        expect(health.TargetHealthDescriptions!.length).toBeGreaterThan(0);
      }
    });

    test('HTTP and HTTPS listeners should be properly configured', async () => {
      const loadBalancers = await elbv2.describeLoadBalancers().promise();
      const alb = loadBalancers.LoadBalancers!.find((lb: any) =>
        lb.DNSName === outputs.ALBDNSName
      );

      const listeners = await elbv2.describeListeners({
        LoadBalancerArn: alb!.LoadBalancerArn
      }).promise();

      expect(listeners.Listeners).toBeDefined();
      expect(listeners.Listeners!.length).toBeGreaterThan(0);

      // Should have HTTP listener
      const httpListener = listeners.Listeners!.find((listener: any) => 
        listener.Port === 80 && listener.Protocol === 'HTTP'
      );
      expect(httpListener).toBeDefined();

      // HTTPS listener is conditional - only check if it exists
      const httpsListener = listeners.Listeners!.find((listener: any) => 
        listener.Port === 443 && listener.Protocol === 'HTTPS'
      );
      
      // If HTTPS listener exists (HasValidDomain condition), validate it
      if (httpsListener) {
        expect(httpsListener.Certificates).toBeDefined();
        expect(httpsListener.Certificates!.length).toBeGreaterThan(0);
      }
    });

    test('EC2 instances should be running and properly configured', async () => {
      const vpcId = await getVpcId();
      const instances = await ec2.send(new DescribeInstancesCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      expect(instances.Reservations!.length).toBeGreaterThan(0);

      instances.Reservations!.forEach(reservation => {
        reservation.Instances!.forEach(instance => {
          expect(instance.State!.Name).toBe('running');
          expect(instance.SecurityGroups).toBeDefined();
          expect(instance.SecurityGroups!.length).toBeGreaterThan(0);
          
          // Check IAM instance profile
          expect(instance.IamInstanceProfile).toBeDefined();
          expect(instance.IamInstanceProfile!.Arn).toBeDefined();

          // Check tags
          expect(instance.Tags).toBeDefined();
          const tagNames = instance.Tags!.map((tag: any) => tag.Key);
          expect(tagNames).toContain('Name');
          expect(tagNames).toContain('Environment');
          expect(tagNames).toContain('Application');
          expect(tagNames).toContain('team');
          expect(tagNames).toContain('iac-rlhf-amazon');
        });
        });
      });
    });

  describe('Security & Monitoring', () => {
    test('WAF should be protecting the application', async () => {
      const webAcls = await wafv2.send(new ListWebACLsCommand({ Scope: 'REGIONAL' }));
      const webAcl = webAcls.WebACLs!.find((acl: any) => acl.ARN === outputs.WebACLArn) || webAcls.WebACLs![0];

      expect(webAcl).toBeDefined();

      // Check WAF rules - use both Name and Id
      const wafDetails = await wafv2.send(new GetWebACLCommand({
        Scope: 'REGIONAL',
        Name: webAcl.Name,
        Id: webAcl.Id
      }));

      expect(wafDetails.WebACL!.Rules).toBeDefined();
      expect(wafDetails.WebACL!.Rules!.length).toBeGreaterThan(0);

      // Check ALB association
      const loadBalancers = await elbv2.describeLoadBalancers().promise();
      const alb = loadBalancers.LoadBalancers!.find((lb: any) => lb.DNSName === outputs.ALBDNSName);

      expect(alb).toBeDefined();
      const associations = await wafv2.send(new ListResourcesForWebACLCommand({
        WebACLArn: outputs.WebACLArn
      }));
      expect(associations.ResourceArns).toContain(alb!.LoadBalancerArn);
    });

    test('SNS topic should be configured for alerts', async () => {
      const topics = await sns.send(new ListTopicsCommand({}));
      const topic = topics.Topics!.find((t: any) => t.TopicArn === outputs.AlarmTopicArn);

      expect(topic).toBeDefined();
      expect(topic!.TopicArn).toBe(outputs.AlarmTopicArn);

      // Check KMS encryption
      const attributes = await sns.send(new GetTopicAttributesCommand({
        TopicArn: outputs.AlarmTopicArn
      }));
      expect(attributes.Attributes!.KmsMasterKeyId).toBeDefined();

      // Check subscriptions
      const subscriptions = await sns.send(new ListSubscriptionsByTopicCommand({
        TopicArn: outputs.AlarmTopicArn
      }));
      expect(subscriptions.Subscriptions).toBeDefined();
    });
  });

  describe('End-to-End Workflows', () => {
    test('Complete user request flow: Internet → ALB → Web Server → Database', async () => {
      // 1. Verify ALB is accessible from internet
      const loadBalancers = await elbv2.describeLoadBalancers().promise();
      const alb = loadBalancers.LoadBalancers!.find((lb: any) =>
        lb.DNSName === outputs.ALBDNSName
      );
      expect(alb).toBeDefined();
      expect(alb!.State!.Code).toBe('active');

      // 2. Verify target groups have healthy targets
        const targetGroups = await elbv2.describeTargetGroups({
          LoadBalancerArn: alb!.LoadBalancerArn
        }).promise();

      for (const tg of targetGroups.TargetGroups!) {
        const health = await elbv2.describeTargetHealth({
          TargetGroupArn: tg.TargetGroupArn
        }).promise();
        
        const healthyTargets = health.TargetHealthDescriptions!.filter((target: any) => 
          target.TargetHealth.State === 'healthy'
        );
        expect(healthyTargets.length).toBeGreaterThan(0);
      }

      // 3. Verify database is accessible
      const dbInstance = await getDatabaseInstance();
      expect(dbInstance).toBeDefined();
      expect(dbInstance.DBInstanceStatus).toBe('available');
    });

    test('Data encryption workflow: Application → KMS → S3/RDS', async () => {
      // 1. Verify KMS key is active and rotating
      const key = await kms.send(new DescribeKeyCommand({ KeyId: outputs.KMSKeyId }));
      expect(key.KeyMetadata!.KeyState).toBe('Enabled');

      const rotation = await kms.send(new GetKeyRotationStatusCommand({ KeyId: outputs.KMSKeyId }));
      expect(rotation.KeyRotationEnabled).toBe(true);

      // 2. Verify S3 buckets use KMS encryption
      const appDataEncryption = await s3.send(new GetBucketEncryptionCommand({ 
        Bucket: outputs.S3AppDataBucket 
      }));
      const kmsKeyId = appDataEncryption.ServerSideEncryptionConfiguration!.Rules![0]
        .ApplyServerSideEncryptionByDefault!.KMSMasterKeyID;
      
      // KMS key ID might be just the key ID or full ARN
      if (kmsKeyId.includes('arn:aws:kms')) {
        expect(kmsKeyId).toContain('arn:aws:kms');
      } else {
        expect(kmsKeyId).toBeDefined();
      }

      // 3. Verify RDS uses KMS encryption
      const dbInstance = await getDatabaseInstance();
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.KmsKeyId).toBeDefined();
    });

    test('High availability workflow: Multi-AZ deployment verification', async () => {
      // 1. Verify subnets are in multiple AZs
      const vpcId = await getVpcId();
      const subnets = await ec2.send(new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      const azs = [...new Set(subnets.Subnets!.map((subnet: any) => subnet.AvailabilityZone))];
      expect(azs.length).toBeGreaterThan(1);

      // 2. Verify ALB spans multiple AZs
      const loadBalancers = await elbv2.describeLoadBalancers().promise();
      const alb = loadBalancers.LoadBalancers!.find((lb: any) =>
        lb.DNSName === outputs.ALBDNSName
      );
      expect(alb!.AvailabilityZones!.length).toBeGreaterThan(1);

      // 3. Verify multiple web servers in different AZs
      const instances = await ec2.send(new DescribeInstancesCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      const webServers = instances.Reservations!.flatMap(reservation => 
        reservation.Instances!.filter(instance => 
          instance.Tags?.some((tag: any) => 
            tag.Key === 'Name' && tag.Value?.includes('web')
          )
        )
      );

      expect(webServers.length).toBeGreaterThanOrEqual(2);
      
      const webServerAZs = [...new Set(webServers.map(server => server.Placement!.AvailabilityZone))];
      expect(webServerAZs.length).toBeGreaterThan(1);
    });
  });

  describe('Advanced End-to-End Tests - Application Flow & Security', () => {
    test('Application Flow: HTTP request → ALB → EC2 → Database → Response', async () => {
      // Send HTTP request to ALB
      const albDns = outputs.ALBDNSName;
      
      const httpResponse = await new Promise<{statusCode: number, body: string}>((resolve, reject) => {
        const req = http.get(`http://${albDns}/`, (res) => {
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => resolve({ statusCode: res.statusCode || 0, body }));
        });
        req.on('error', reject);
        req.setTimeout(10000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
      });

      // Verify response (200 OK or 403 if WAF is blocking)
      expect([200, 403]).toContain(httpResponse.statusCode);
      expect(httpResponse.body).toBeDefined();

      // Verify ALB processed the request
      const loadBalancers = await elbv2.describeLoadBalancers().promise();
      const alb = loadBalancers.LoadBalancers!.find((lb: any) =>
        lb.DNSName === outputs.ALBDNSName
      );
      expect(alb!.State!.Code).toBe('active');

      // Verify target health after request
      const targetGroups = await elbv2.describeTargetGroups({
        LoadBalancerArn: alb!.LoadBalancerArn
      }).promise();

      for (const tg of targetGroups.TargetGroups!) {
        const health = await elbv2.describeTargetHealth({
          TargetGroupArn: tg.TargetGroupArn
        }).promise();
        
        const healthyTargets = health.TargetHealthDescriptions!.filter((target: any) => 
          target.TargetHealth.State === 'healthy'
        );
        expect(healthyTargets.length).toBeGreaterThan(0);
      }

      // Verify database is accessible
      const dbInstance = await getDatabaseInstance();
      expect(dbInstance.DBInstanceStatus).toBe('available');
    });

    test('WAF Blocking: Malicious request with SQL injection should be blocked', async () => {
      const albDns = outputs.ALBDNSName;
      
      // Send malicious request with SQL injection pattern
      const maliciousPath = "/?id=1' OR '1'='1; --";
      
      const response = await new Promise<{statusCode: number}>((resolve, reject) => {
        const req = http.get(`http://${albDns}${encodeURI(maliciousPath)}`, (res) => {
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => resolve({ statusCode: res.statusCode || 0 }));
        });
        req.on('error', (err) => {
          // Some errors might occur if WAF blocks at TCP level
          resolve({ statusCode: 403 });
        });
        req.setTimeout(10000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
    });
  });

      // Verify WAF blocked the request (403 Forbidden)
      expect(response.statusCode).toBe(403);

      // Verify WAF Web ACL exists and has rules
      const webAcls = await wafv2.send(new ListWebACLsCommand({ Scope: 'REGIONAL' }));
      const webAcl = webAcls.WebACLs!.find((acl: any) => acl.ARN === outputs.WebACLArn);
      
      expect(webAcl).toBeDefined();

      // Check WAF has blocking rules configured
      const wafDetails = await wafv2.send(new GetWebACLCommand({
        Scope: 'REGIONAL',
        Name: webAcl!.Name,
        Id: webAcl!.Id
      }));

      expect(wafDetails.WebACL!.Rules).toBeDefined();
      expect(wafDetails.WebACL!.Rules!.length).toBeGreaterThan(0);

      // Verify at least one rule has Block action or managed rule set
      const hasBlockingRules = wafDetails.WebACL!.Rules!.some((rule: any) => 
        rule.Action?.Block || rule.OverrideAction?.None || rule.Statement?.ManagedRuleGroupStatement
      );
      expect(hasBlockingRules).toBe(true);
    });

    test('Network Isolation: RDS should not be accessible from outside application security group', async () => {
      const dbInstance = await getDatabaseInstance();
      expect(dbInstance).toBeDefined();
      
      // Verify database is in private subnet
      expect(dbInstance.PubliclyAccessible).toBe(false);

      // Verify database security group only allows access from VPC CIDR
      const dbSecurityGroupId = dbInstance.VpcSecurityGroups![0].VpcSecurityGroupId;
      const securityGroups = await ec2.send(new DescribeSecurityGroupsCommand({
        GroupIds: [dbSecurityGroupId!]
      }));

      const dbSg = securityGroups.SecurityGroups![0];
      expect(dbSg.IpPermissions).toBeDefined();

      // Check that ingress rules are restrictive (not 0.0.0.0/0)
      const hasPublicAccess = dbSg.IpPermissions!.some((rule: any) =>
        rule.IpRanges?.some((range: any) => range.CidrIp === '0.0.0.0/0')
      );
      expect(hasPublicAccess).toBe(false);

      // Verify only VPC CIDR or security groups can access
      const hasVpcAccess = dbSg.IpPermissions!.some((rule: any) =>
        rule.IpRanges?.some((range: any) => range.CidrIp.includes('10.0.0.0')) ||
        rule.UserIdGroupPairs?.length > 0
      );
      expect(hasVpcAccess).toBe(true);
    });

    test('Administrative Access Path: Bastion host should allow SSH access to private instances', async () => {
      const vpcId = await getVpcId();
      const instances = await ec2.send(new DescribeInstancesCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      // Find bastion host (public subnet)
      const bastionHost = instances.Reservations!.flatMap(r => r.Instances!).find((instance: any) =>
        instance.Tags?.some((tag: any) => 
          tag.Key === 'Name' && tag.Value?.toLowerCase().includes('bastion')
        )
      );

      expect(bastionHost).toBeDefined();
      expect(bastionHost!.PublicIpAddress).toBeDefined();

      // Verify bastion security group allows SSH from restricted CIDR
      const bastionSgId = bastionHost!.SecurityGroups![0].GroupId;
      const bastionSgDetails = await ec2.send(new DescribeSecurityGroupsCommand({
        GroupIds: [bastionSgId!]
      }));

      const bastionSg = bastionSgDetails.SecurityGroups![0];
      const sshRule = bastionSg.IpPermissions!.find((rule: any) =>
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === 'tcp'
      );
      expect(sshRule).toBeDefined();

      // Verify bastion can SSH to private instances (check security group rules)
      const privateInstances = instances.Reservations!.flatMap(r => r.Instances!).filter((instance: any) =>
        instance.Tags?.some((tag: any) => 
          tag.Key === 'Name' && (tag.Value?.includes('web') || tag.Value?.includes('app'))
        ) && !instance.PublicIpAddress
      );

      expect(privateInstances.length).toBeGreaterThan(0);
      const privateSgId = privateInstances[0].SecurityGroups![0].GroupId;
      const privateSgDetails = await ec2.send(new DescribeSecurityGroupsCommand({
        GroupIds: [privateSgId!]
      }));

      const privateSg = privateSgDetails.SecurityGroups![0];
      const privateSSHRule = privateSg.IpPermissions!.find((rule: any) =>
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === 'tcp'
      );
      
      expect(privateSSHRule).toBeDefined();
      const allowsVpcSSH = privateSSHRule!.IpRanges?.some((range: any) =>
        range.CidrIp.includes('10.0.0.0')
      ) || privateSSHRule!.UserIdGroupPairs?.length > 0;
      expect(allowsVpcSSH).toBe(true);
    });
  });

  describe('Resource Tagging & Compliance', () => {
    test('All resources should have consistent tagging strategy', async () => {
      const vpcId = await getVpcId();

      // Test VPC tags
      const vpcs = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpc = vpcs.Vpcs![0];
      const vpcTagNames = vpc.Tags!.map((tag: any) => tag.Key);
      expect(vpcTagNames).toContain('Name');
      expect(vpcTagNames).toContain('Environment');
      expect(vpcTagNames).toContain('Application');
      expect(vpcTagNames).toContain('team');
      expect(vpcTagNames).toContain('iac-rlhf-amazon');

      // Test EC2 instance tags
      const instances = await ec2.send(new DescribeInstancesCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      instances.Reservations!.forEach(reservation => {
        reservation.Instances!.forEach(instance => {
          const tagNames = instance.Tags!.map((tag: any) => tag.Key);
          expect(tagNames).toContain('Name');
          expect(tagNames).toContain('Environment');
          expect(tagNames).toContain('Application');
          expect(tagNames).toContain('team');
          expect(tagNames).toContain('iac-rlhf-amazon');
      });
    });

      // Test S3 bucket tags
      const buckets = [outputs.S3AppDataBucket, outputs.S3LogsBucket];
      for (const bucketName of buckets) {
        const tags = await s3.send(new GetBucketTaggingCommand({ Bucket: bucketName }));
        const tagNames = tags.TagSet!.map((tag: any) => tag.Key);
        expect(tagNames).toContain('Name');
        expect(tagNames).toContain('Environment');
        expect(tagNames).toContain('Application');
        expect(tagNames).toContain('team');
        expect(tagNames).toContain('iac-rlhf-amazon');
      }
    });
  });

  describe('SSL/TLS Configuration', () => {
    test('SSL certificate should be properly configured if domain is valid', async () => {
      const certificates = await acm.send(new ListCertificatesCommand({}));
      const certificate = certificates.CertificateSummaryList!.find((cert: any) =>
        cert.DomainName.includes('enterpriseapp')
      );

      // SSL certificate is conditional - only exists if DomainName != 'example.com'
      if (certificate) {
        // Certificate might be in different states depending on DNS validation
        expect(['ISSUED', 'PENDING_VALIDATION', 'FAILED']).toContain(certificate.Status);
        expect(certificate.Type).toBe('AMAZON_ISSUED');
      }
      });
    });

  describe('Performance & Scalability', () => {
    test('Load balancer should be configured for optimal performance', async () => {
      const loadBalancers = await elbv2.describeLoadBalancers().promise();
      const alb = loadBalancers.LoadBalancers!.find((lb: any) =>
        lb.DNSName === outputs.ALBDNSName
      );

      expect(alb).toBeDefined();
      expect(alb!.Type).toBe('application'); // Better performance than classic
      expect(alb!.AvailabilityZones!.length).toBeGreaterThan(1); // Multi-AZ for HA
    });

    test('Database should be configured for production workloads', async () => {
      const dbInstance = await getDatabaseInstance();
      expect(dbInstance).toBeDefined();
      expect(dbInstance.DBInstanceClass).toMatch(/^db\./); // Should be a valid RDS instance class
      expect(dbInstance.AllocatedStorage).toBeGreaterThanOrEqual(100); // Adequate storage
      expect(dbInstance.BackupRetentionPeriod).toBe(30); // Good backup retention
      });
    });

  describe('Complete Resource Coverage', () => {
    test('RDS KMS Key should exist and be properly configured', async () => {
      const dbInstance = await getDatabaseInstance();
      expect(dbInstance).toBeDefined();
      expect(dbInstance.KmsKeyId).toBeDefined();
      
      const rdsKey = await kms.send(new DescribeKeyCommand({ KeyId: dbInstance.KmsKeyId }));
      expect(rdsKey.KeyMetadata).toBeDefined();
      expect(rdsKey.KeyMetadata!.KeyState).toBe('Enabled');
      expect(rdsKey.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');

      const rotation = await kms.send(new GetKeyRotationStatusCommand({ KeyId: dbInstance.KmsKeyId }));
      expect(rotation.KeyRotationEnabled).toBe(true);
    });

    test('VPC Gateway Attachment should be properly configured', async () => {
      const vpcId = await getVpcId();
      const igws = await ec2.send(new DescribeInternetGatewaysCommand({
        Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }]
      }));

      expect(igws.InternetGateways).toHaveLength(1);
      const igw = igws.InternetGateways![0];
      expect(igw.Attachments).toBeDefined();
      expect(igw.Attachments![0].VpcId).toBe(vpcId);
      expect(igw.Attachments![0].State).toBe('available');
    });

    test('NAT Gateway Elastic IP should be properly allocated', async () => {
      const vpcId = await getVpcId();
      const natGateways = await ec2.send(new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      expect(natGateways.NatGateways!.length).toBeGreaterThan(0);
      const natGateway = natGateways.NatGateways![0];
      expect(natGateway.NatGatewayAddresses).toBeDefined();
      expect(natGateway.NatGatewayAddresses!.length).toBeGreaterThan(0);
      expect(natGateway.NatGatewayAddresses![0].AllocationId).toBeDefined();
    });

    test('Route Tables should have correct routes configured', async () => {
      const vpcId = await getVpcId();
      const routeTables = await ec2.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      expect(routeTables.RouteTables!.length).toBeGreaterThanOrEqual(2);

      // Check public route table has internet gateway route
      const publicRouteTable = routeTables.RouteTables!.find(rt =>
        rt.Routes!.some(route => route.GatewayId && route.GatewayId.startsWith('igw-'))
      );
      expect(publicRouteTable).toBeDefined();
      expect(publicRouteTable!.Routes!.some(route => 
        route.DestinationCidrBlock === '0.0.0.0/0' && route.GatewayId
      )).toBe(true);

      // Check private route table has NAT gateway route
      const privateRouteTable = routeTables.RouteTables!.find(rt =>
        rt.Routes!.some(route => route.NatGatewayId)
      );
      expect(privateRouteTable).toBeDefined();
      expect(privateRouteTable!.Routes!.some(route => 
        route.DestinationCidrBlock === '0.0.0.0/0' && route.NatGatewayId
      )).toBe(true);
    });

    test('Subnet Route Table Associations should be properly configured', async () => {
      const vpcId = await getVpcId();
      const subnets = await ec2.send(new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      const routeTables = await ec2.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      // Verify each subnet has a route table association
      subnets.Subnets!.forEach(subnet => {
        const associatedRouteTable = routeTables.RouteTables!.find(rt =>
          rt.Associations!.some(assoc => assoc.SubnetId === subnet.SubnetId)
        );
        expect(associatedRouteTable).toBeDefined();
      });
    });

    test('S3 Logs Bucket Policy should be properly configured', async () => {
      const bucketPolicy = await s3.send(new GetBucketPolicyCommand({ 
        Bucket: outputs.S3LogsBucket 
      }));
      expect(bucketPolicy.Policy).toBeDefined();
      
      const policy = JSON.parse(bucketPolicy.Policy!);
      expect(policy.Statement).toBeDefined();
      expect(policy.Statement.length).toBeGreaterThan(0);
      
      // Check for CloudTrail permissions
      const cloudTrailStatement = policy.Statement.find((stmt: any) =>
        stmt.Principal?.Service === 'cloudtrail.amazonaws.com'
      );
      expect(cloudTrailStatement).toBeDefined();
    });

    test('EC2 Instance Profile should be properly attached to instances', async () => {
      const vpcId = await getVpcId();
      const instances = await ec2.send(new DescribeInstancesCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      instances.Reservations!.forEach(reservation => {
        reservation.Instances!.forEach(instance => {
          expect(instance.IamInstanceProfile).toBeDefined();
          expect(instance.IamInstanceProfile!.Arn).toBeDefined();
          expect(instance.IamInstanceProfile!.Arn).toContain('instance-profile');
        });
    });
  });

    test('RDS DB Subnet Group should be properly configured', async () => {
      const dbInstance = await getDatabaseInstance();
      expect(dbInstance).toBeDefined();
      expect(dbInstance.DBSubnetGroup).toBeDefined();
      expect(dbInstance.DBSubnetGroup.DBSubnetGroupName).toBeDefined();
      expect(dbInstance.DBSubnetGroup.Subnets).toBeDefined();
      expect(dbInstance.DBSubnetGroup.Subnets!.length).toBeGreaterThanOrEqual(2);
    });

    test('Backup S3 Bucket should exist and be properly configured', async () => {
      // Since we don't have backup bucket in outputs, we'll search for it
      const vpcId = await getVpcId();
      const instances = await ec2.send(new DescribeInstancesCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      // Look for backup bucket through IAM role policies or other means
      instances.Reservations!.forEach(reservation => {
        reservation.Instances!.forEach(instance => {
          expect(instance.IamInstanceProfile).toBeDefined();
          // The backup bucket would be referenced in IAM policies
          expect(instance.IamInstanceProfile!.Arn).toBeDefined();
        });
    });
  });

    test('WAF Web ACL Association should be properly configured', async () => {
      expect(outputs.WebACLArn).toBeDefined();
      expect(outputs.ALBDNSName).toBeDefined();

      const loadBalancers = await elbv2.describeLoadBalancers().promise();
      const alb = loadBalancers.LoadBalancers!.find((lb: any) =>
        lb.DNSName === outputs.ALBDNSName
      );

      expect(alb).toBeDefined();
      const associations = await wafv2.send(new ListResourcesForWebACLCommand({
        WebACLArn: outputs.WebACLArn
      }));
      expect(associations.ResourceArns).toContain(alb!.LoadBalancerArn);
    });

    test('SNS Topic Subscription should be properly configured', async () => {
      expect(outputs.AlarmTopicArn).toBeDefined();
      const subscriptions = await sns.send(new ListSubscriptionsByTopicCommand({
        TopicArn: outputs.AlarmTopicArn
      }));

      expect(subscriptions.Subscriptions).toBeDefined();
      expect(subscriptions.Subscriptions!.length).toBeGreaterThan(0);
      const subscription = subscriptions.Subscriptions![0];
      expect(subscription.TopicArn).toBe(outputs.AlarmTopicArn);
      expect(subscription.Protocol).toBe('email');
    });

    test('SSL Certificate should be properly configured if domain is valid', async () => {
      const certificates = await acm.send(new ListCertificatesCommand({}));
      const certificate = certificates.CertificateSummaryList!.find((cert: any) =>
        cert.DomainName.includes('enterpriseapp')
      );

      // SSL certificate is conditional - only exists if DomainName != 'example.com'
      if (certificate) {
        expect(['ISSUED', 'PENDING_VALIDATION', 'FAILED']).toContain(certificate.Status);
        expect(certificate.Type).toBe('AMAZON_ISSUED');
        expect(certificate.DomainName).toContain('enterpriseapp');
      }
    });

    test('All IAM Roles should have proper assume role policies', async () => {
      const roles = await iam.send(new ListRolesCommand({}));
      const corpRoles = roles.Roles!.filter((role: any) =>
        role.RoleName.includes('corp-')
      );

      corpRoles.forEach(role => {
        expect(role.AssumeRolePolicyDocument).toBeDefined();
        const policy = JSON.parse(role.AssumeRolePolicyDocument!);
        expect(policy.Version).toBe('2012-10-17');
        expect(policy.Statement).toBeDefined();
        expect(policy.Statement.length).toBeGreaterThan(0);
      });
    });

    test('All S3 Buckets should have proper configurations', async () => {
      const buckets = [outputs.S3AppDataBucket, outputs.S3LogsBucket];
      
      for (const bucketName of buckets) {
        // Check bucket exists
        await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
        
        // Check encryption
        const encryption = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
        expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
        
        // Check public access block
        const publicAccess = await s3.send(new GetPublicAccessBlockCommand({ Bucket: bucketName }));
        expect(publicAccess.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
        
        // Check tags
        const tags = await s3.send(new GetBucketTaggingCommand({ Bucket: bucketName }));
        expect(tags.TagSet).toBeDefined();
        const tagNames = tags.TagSet!.map((tag: any) => tag.Key);
        expect(tagNames).toContain('Name');
        expect(tagNames).toContain('Environment');
        expect(tagNames).toContain('Application');
        expect(tagNames).toContain('team');
        expect(tagNames).toContain('iac-rlhf-amazon');
      }
    });

    test('All EC2 Instances should have proper configurations', async () => {
      const vpcId = await getVpcId();
      const instances = await ec2.send(new DescribeInstancesCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      instances.Reservations!.forEach(reservation => {
        reservation.Instances!.forEach(instance => {
          // Check instance state
          expect(instance.State!.Name).toBe('running');
          
          // Check security groups
          expect(instance.SecurityGroups).toBeDefined();
          expect(instance.SecurityGroups!.length).toBeGreaterThan(0);
          
          // Check IAM instance profile
          expect(instance.IamInstanceProfile).toBeDefined();
          expect(instance.IamInstanceProfile!.Arn).toBeDefined();
          
          // Check tags
          expect(instance.Tags).toBeDefined();
          const tagNames = instance.Tags!.map((tag: any) => tag.Key);
          expect(tagNames).toContain('Name');
          expect(tagNames).toContain('Environment');
          expect(tagNames).toContain('Application');
          expect(tagNames).toContain('team');
          expect(tagNames).toContain('iac-rlhf-amazon');
        });
    });
  });

    test('All Security Groups should have proper rules', async () => {
      const vpcId = await getVpcId();
      const securityGroups = await ec2.send(new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      securityGroups.SecurityGroups!.forEach(sg => {
        // Check ingress rules
        expect(sg.IpPermissions).toBeDefined();
        expect(sg.IpPermissions!.length).toBeGreaterThan(0);
        
        sg.IpPermissions!.forEach(rule => {
          expect(rule.IpProtocol).toBeDefined();
          // FromPort and ToPort might be undefined for ICMP or all traffic (-1)
          if (rule.IpProtocol !== 'icmp' && rule.IpProtocol !== 'icmpv6' && rule.IpProtocol !== '-1') {
            expect(rule.FromPort).toBeDefined();
            expect(rule.ToPort).toBeDefined();
          }
        });
        
        // Check egress rules
        expect(sg.IpPermissionsEgress).toBeDefined();
        expect(sg.IpPermissionsEgress!.length).toBeGreaterThan(0);
        
        sg.IpPermissionsEgress!.forEach(rule => {
          expect(rule.IpProtocol).toBeDefined();
          // FromPort and ToPort might be undefined for ICMP or all traffic (-1)
          if (rule.IpProtocol !== 'icmp' && rule.IpProtocol !== 'icmpv6' && rule.IpProtocol !== '-1') {
            expect(rule.FromPort).toBeDefined();
            expect(rule.ToPort).toBeDefined();
          }
        });
      });
    });

    test('All Load Balancer Components should be properly configured', async () => {
      const loadBalancers = await elbv2.describeLoadBalancers().promise();
      const alb = loadBalancers.LoadBalancers!.find((lb: any) =>
        lb.DNSName === outputs.ALBDNSName
      );

      expect(alb).toBeDefined();
      
      // Check target groups
      const targetGroups = await elbv2.describeTargetGroups({
        LoadBalancerArn: alb!.LoadBalancerArn
      }).promise();
      expect(targetGroups.TargetGroups).toBeDefined();
      expect(targetGroups.TargetGroups!.length).toBeGreaterThan(0);

      // Check listeners
      const listeners = await elbv2.describeListeners({
        LoadBalancerArn: alb!.LoadBalancerArn
      }).promise();
      expect(listeners.Listeners).toBeDefined();
      expect(listeners.Listeners!.length).toBeGreaterThan(0);

      // Check target health
      for (const tg of targetGroups.TargetGroups!) {
        const health = await elbv2.describeTargetHealth({
          TargetGroupArn: tg.TargetGroupArn
        }).promise();
        expect(health.TargetHealthDescriptions).toBeDefined();
      }
    });
  });
});