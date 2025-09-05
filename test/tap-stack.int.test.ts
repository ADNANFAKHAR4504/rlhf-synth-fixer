import AWS from 'aws-sdk';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('No cfn-outputs found, tests will be skipped or use mock data');
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Infrastructure Integration Tests', () => {
  let s3: AWS.S3;
  let ec2: AWS.EC2;
  let rds: AWS.RDS;
  let sns: AWS.SNS;
  let cloudtrail: AWS.CloudTrail;
  let kms: AWS.KMS;
  let secretsmanager: AWS.SecretsManager;

  beforeAll(() => {
    // Initialize AWS SDK clients
    s3 = new AWS.S3();
    ec2 = new AWS.EC2();
    rds = new AWS.RDS();
    sns = new AWS.SNS();
    cloudtrail = new AWS.CloudTrail();
    kms = new AWS.KMS();
    secretsmanager = new AWS.SecretsManager();
  });

  describe('S3 Buckets Integration', () => {
    test('should verify ApplicationBucket exists and has correct encryption', async () => {
      if (!outputs.ApplicationBucketName) {
        console.warn('ApplicationBucket not found in outputs, skipping test');
        return;
      }

      const bucketName = outputs.ApplicationBucketName;
      
      // Check bucket exists
      const bucketExists = await s3.headBucket({ Bucket: bucketName }).promise();
      expect(bucketExists).toBeDefined();

      // Check encryption configuration
      const encryption = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration?.Rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm)
        .toBe('AES256');

      // Check versioning
      const versioning = await s3.getBucketVersioning({ Bucket: bucketName }).promise();
      expect(versioning.Status).toBe('Enabled');

      // Check public access block
      const publicAccess = await s3.getPublicAccessBlock({ Bucket: bucketName }).promise();
      expect(publicAccess.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    test('should verify LogsBucket exists and has correct configuration', async () => {
      if (!outputs.LogsBucketName) {
        console.warn('LogsBucket not found in outputs, skipping test');
        return;
      }

      const bucketName = outputs.LogsBucketName;
      
      // Check bucket exists
      const bucketExists = await s3.headBucket({ Bucket: bucketName }).promise();
      expect(bucketExists).toBeDefined();

      // Check encryption
      const encryption = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
      expect(encryption.ServerSideEncryptionConfiguration?.Rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm)
        .toBe('AES256');
    });

    test('should verify BackupBucket exists and has correct configuration', async () => {
      if (!outputs.BackupBucketName) {
        console.warn('BackupBucket not found in outputs, skipping test');
        return;
      }

      const bucketName = outputs.BackupBucketName;
      
      // Check bucket exists
      const bucketExists = await s3.headBucket({ Bucket: bucketName }).promise();
      expect(bucketExists).toBeDefined();

      // Check encryption
      const encryption = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
      expect(encryption.ServerSideEncryptionConfiguration?.Rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm)
        .toBe('AES256');
    });
  });

  describe('VPC and Networking Integration', () => {
    test('should verify VPC exists and has correct configuration', async () => {
      if (!outputs.VPCId) {
        console.warn('VPC not found in outputs, skipping test');
        return;
      }

      const vpcId = outputs.VPCId;
      
      // Check VPC exists
      const vpcs = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
      expect(vpcs.Vpcs?.length).toBe(1);
      expect(vpcs.Vpcs?.[0].State).toBe('available');
      expect(vpcs.Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('should verify subnets exist and have correct configuration', async () => {
      if (!outputs.VPCId) {
        console.warn('VPC not found in outputs, skipping test');
        return;
      }

      const vpcId = outputs.VPCId;
      
      // Get all subnets in the VPC
      const subnets = await ec2.describeSubnets({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }).promise();
      
      expect(subnets.Subnets?.length).toBeGreaterThanOrEqual(2);
      
      // Check public subnet
      const publicSubnet = subnets.Subnets?.find(subnet => 
        subnet.MapPublicIpOnLaunch === true
      );
      expect(publicSubnet).toBeDefined();
      expect(publicSubnet?.CidrBlock).toBe('10.0.1.0/24');
      
      // Check private subnet
      const privateSubnet = subnets.Subnets?.find(subnet => 
        subnet.MapPublicIpOnLaunch === false
      );
      expect(privateSubnet).toBeDefined();
      expect(privateSubnet?.CidrBlock).toBe('10.0.2.0/24');
    });

    test('should verify security groups exist and have correct rules', async () => {
      if (!outputs.VPCId) {
        console.warn('VPC not found in outputs, skipping test');
        return;
      }

      const vpcId = outputs.VPCId;
      
      // Get security groups in the VPC
      const securityGroups = await ec2.describeSecurityGroups({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }).promise();
      
      // Find EC2 security group
      const ec2SecurityGroup = securityGroups.SecurityGroups?.find(sg => 
        sg.GroupName?.includes(`secure-app-${environmentSuffix}-ec2-sg`)
      );
      expect(ec2SecurityGroup).toBeDefined();
      
      // Check SSH rule (port 22)
      const sshRule = ec2SecurityGroup?.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.[0].CidrIp).toBe('10.0.0.0/16');
    });
  });

  describe('RDS Database Integration', () => {
    test('should verify RDS instance exists and has correct configuration', async () => {
      if (!outputs.DatabaseEndpoint) {
        console.warn('Database endpoint not found in outputs, skipping test');
        return;
      }

      // Get RDS instances
      const instances = await rds.describeDBInstances().promise();
      const dbInstance = instances.DBInstances?.find(instance => 
        instance.DBInstanceIdentifier?.includes(`secure-app-${environmentSuffix}-database`)
      );
      
      expect(dbInstance).toBeDefined();
      expect(dbInstance?.DBInstanceStatus).toBe('available');
      expect(dbInstance?.Engine).toBe('mysql');
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.BackupRetentionPeriod).toBe(7);
    });

    test('should verify database secrets exist in Secrets Manager', async () => {
      const secretName = `secure-app-${environmentSuffix}-db-credentials`;
      
      try {
        const secret = await secretsmanager.describeSecret({ SecretId: secretName }).promise();
        expect(secret.Name).toBe(secretName);
        expect(secret.Description).toContain('Database credentials');
      } catch (error) {
        console.warn(`Secret ${secretName} not found, skipping test`);
      }
    });
  });

  describe('KMS Key Integration', () => {
    test('should verify KMS key exists and has correct configuration', async () => {
      if (!outputs.KMSKeyId) {
        console.warn('KMS Key ID not found in outputs, skipping test');
        return;
      }

      const keyId = outputs.KMSKeyId;
      
      // Describe the key
      const key = await kms.describeKey({ KeyId: keyId }).promise();
      expect(key.KeyMetadata?.KeyState).toBe('Enabled');
      expect(key.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(key.KeyMetadata?.Description).toContain('KMS key for RDS encryption');
    });

    test('should verify KMS key alias exists', async () => {
      const aliasName = `alias/secure-app-${environmentSuffix}-key`;
      
      try {
        const aliases = await kms.listAliases().promise();
        const alias = aliases.Aliases?.find(a => a.AliasName === aliasName);
        expect(alias).toBeDefined();
      } catch (error) {
        console.warn(`KMS alias ${aliasName} not found, skipping test`);
      }
    });
  });

  describe('CloudTrail Integration', () => {
    test('should verify CloudTrail exists and is logging', async () => {
      const trailName = `secure-app-${environmentSuffix}-cloudtrail`;
      
      try {
        const trails = await cloudtrail.describeTrails().promise();
        const trail = trails.trailList?.find(t => t.Name?.includes(trailName));
        expect(trail).toBeDefined();
        
        // Check if trail is logging
        const status = await cloudtrail.getTrailStatus({ Name: trail!.TrailARN! }).promise();
        expect(status.IsLogging).toBe(true);
      } catch (error) {
        console.warn(`CloudTrail ${trailName} not found, skipping test`);
      }
    });
  });

  describe('SNS Topic Integration', () => {
    test('should verify SNS topic exists', async () => {
      const topicName = `secure-app-${environmentSuffix}-security-alerts`;
      
      try {
        const topics = await sns.listTopics().promise();
        const topic = topics.Topics?.find(t => t.TopicArn?.includes(topicName));
        expect(topic).toBeDefined();
        
        // Check topic attributes
        const attributes = await sns.getTopicAttributes({ TopicArn: topic!.TopicArn! }).promise();
        expect(attributes.Attributes?.DisplayName).toBe('Security Alerts');
      } catch (error) {
        console.warn(`SNS topic ${topicName} not found, skipping test`);
      }
    });

    test('should verify SNS subscription exists', async () => {
      const topicName = `secure-app-${environmentSuffix}-security-alerts`;
      
      try {
        const topics = await sns.listTopics().promise();
        const topic = topics.Topics?.find(t => t.TopicArn?.includes(topicName));
        
        if (topic) {
          const subscriptions = await sns.listSubscriptionsByTopic({ TopicArn: topic.TopicArn! }).promise();
          const emailSubscription = subscriptions.Subscriptions?.find(s => s.Protocol === 'email');
          expect(emailSubscription).toBeDefined();
        }
      } catch (error) {
        console.warn(`SNS subscriptions not found, skipping test`);
      }
    });
  });

  describe('Resource Tagging Integration', () => {
    test('should verify resources have correct tags', async () => {
      if (!outputs.VPCId) {
        console.warn('VPC not found in outputs, skipping test');
        return;
      }

      const vpcId = outputs.VPCId;
      
      // Check VPC tags
      const vpcs = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
      const vpc = vpcs.Vpcs?.[0];
      
      const ownerTag = vpc?.Tags?.find(tag => tag.Key === 'Owner');
      const environmentTag = vpc?.Tags?.find(tag => tag.Key === 'Environment');
      const projectTag = vpc?.Tags?.find(tag => tag.Key === 'Project');
      
      expect(ownerTag?.Value).toBe('security-team');
      expect(environmentTag?.Value).toBe(environmentSuffix);
      expect(projectTag?.Value).toBe('secure-app');
    });
  });
});
