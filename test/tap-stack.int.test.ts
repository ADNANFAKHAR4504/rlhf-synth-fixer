import AWS from 'aws-sdk';
import axios from 'axios';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('cfn-outputs/flat-outputs.json not found, using environment variables');
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

// CI/CD environment detection
const isCI = process.env.CI === '1' || process.env.CI === 'true';
console.log(`Running in ${isCI ? 'CI' : 'local'} environment with suffix: ${environmentSuffix}`);

// AWS SDK configuration
AWS.config.update({ region: 'us-west-2' });
const ec2 = new AWS.EC2();
const rds = new AWS.RDS();
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();
const apigateway = new AWS.APIGateway();
const wafv2 = new AWS.WAFV2();
const iam = new AWS.IAM();
const kms = new AWS.KMS();

describe('TAP Stack Integration Tests', () => {
  const timeout = 30000; // 30 seconds timeout for integration tests

  describe('VPC and Networking', () => {
    test('should have VPC with correct configuration', async () => {
      const vpcs = await ec2.describeVpcs({
        Filters: [
          { Name: 'tag:Project', Values: ['tap'] },
          { Name: 'tag:Environment', Values: [environmentSuffix] }
        ]
      }).promise();

      expect(vpcs.Vpcs).toHaveLength(1);
      const vpc = vpcs.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      // Note: DNS properties are not directly available in describe response
      // They are verified during deployment and in CloudFormation template
    }, timeout);

    test('should have subnets in multiple AZs', async () => {
      const subnets = await ec2.describeSubnets({
        Filters: [
          { Name: 'tag:Project', Values: ['tap'] },
          { Name: 'tag:Environment', Values: [environmentSuffix] }
        ]
      }).promise();

      expect(subnets.Subnets!.length).toBeGreaterThanOrEqual(6); // 2 AZs * 3 subnet types
      
      const azs = new Set(subnets.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    }, timeout);

    test('should have NAT gateways for private subnet connectivity', async () => {
      const natGateways = await ec2.describeNatGateways({
        Filter: [
          { Name: 'tag:Project', Values: ['tap'] },
          { Name: 'tag:Environment', Values: [environmentSuffix] }
        ]
      }).promise();

      expect(natGateways.NatGateways!.length).toBe(2);
      natGateways.NatGateways!.forEach(nat => {
        expect(nat.State).toBe('available');
      });
    }, timeout);
  });

  describe('Security Groups', () => {
    test('should have security groups with minimal access', async () => {
      const securityGroups = await ec2.describeSecurityGroups({
        Filters: [
          { Name: 'tag:Project', Values: ['tap'] },
          { Name: 'tag:Environment', Values: [environmentSuffix] }
        ]
      }).promise();

      expect(securityGroups.SecurityGroups!.length).toBeGreaterThanOrEqual(3);
      
      // Check EC2 security group has minimal outbound rules
      const ec2SG = securityGroups.SecurityGroups!.find(sg => 
        sg.Description === 'Security group for EC2 instances'
      );
      expect(ec2SG).toBeDefined();
      expect(ec2SG!.IpPermissionsEgress!.length).toBeLessThanOrEqual(3);
    }, timeout);
  });

  describe('EC2 Instance', () => {
    test('should have EC2 instance running in private subnet', async () => {
      const instances = await ec2.describeInstances({
        Filters: [
          { Name: 'tag:Project', Values: ['tap'] },
          { Name: 'tag:Environment', Values: [environmentSuffix] },
          { Name: 'instance-state-name', Values: ['running', 'pending'] }
        ]
      }).promise();

      expect(instances.Reservations!.length).toBeGreaterThan(0);
      const instance = instances.Reservations![0].Instances![0];
      
      expect(instance.InstanceType).toBe('t3.micro');
      expect(instance.SubnetId).toBeDefined();
      
      // Verify instance is in private subnet (no public IP)
      expect(instance.PublicIpAddress).toBeUndefined();
    }, timeout);

    test('should have encrypted EBS volumes', async () => {
      const instances = await ec2.describeInstances({
        Filters: [
          { Name: 'tag:Project', Values: ['tap'] },
          { Name: 'tag:Environment', Values: [environmentSuffix] }
        ]
      }).promise();

      const instance = instances.Reservations![0].Instances![0];
      const volumeIds = instance.BlockDeviceMappings!.map(bdm => bdm.Ebs!.VolumeId!);
      
      const volumes = await ec2.describeVolumes({
        VolumeIds: volumeIds
      }).promise();

      volumes.Volumes!.forEach(volume => {
        expect(volume.Encrypted).toBe(true);
        expect(volume.KmsKeyId).toBeDefined();
      });
    }, timeout);
  });

  describe('RDS Database', () => {
    test('should have encrypted RDS instance in private subnets', async () => {
      const databases = await rds.describeDBInstances({}).promise();
      const tapDb = databases.DBInstances!.find(db => 
        db.DBInstanceIdentifier?.includes('tap') || 
        db.TagList?.some(tag => tag.Key === 'Project' && tag.Value === 'tap')
      );

      expect(tapDb).toBeDefined();
      expect(tapDb!.Engine).toBe('mysql');
      expect(tapDb!.MultiAZ).toBe(true);
      expect(tapDb!.StorageEncrypted).toBe(true);
      expect(tapDb!.KmsKeyId).toBeDefined();
      expect(tapDb!.BackupRetentionPeriod).toBe(7);
      expect(tapDb!.DeletionProtection).toBe(false); // Updated for CI/CD cleanup
    }, timeout);

    test('should have DB subnet group in isolated subnets', async () => {
      const subnetGroups = await rds.describeDBSubnetGroups({}).promise();
      const tapSubnetGroup = subnetGroups.DBSubnetGroups!.find(sg =>
        sg.DBSubnetGroupName?.includes('tap')
      );

      expect(tapSubnetGroup).toBeDefined();
      expect(tapSubnetGroup!.Subnets!.length).toBeGreaterThanOrEqual(2);
    }, timeout);
  });

  describe('S3 Bucket', () => {
    test('should have encrypted S3 bucket with public access blocked', async () => {
      const buckets = await s3.listBuckets().promise();
      const tapBucket = buckets.Buckets!.find(bucket => 
        bucket.Name?.includes('tap')
      );

      expect(tapBucket).toBeDefined();
      
      // Check encryption
      const encryption = await s3.getBucketEncryption({
        Bucket: tapBucket!.Name!
      }).promise();
      
      expect(encryption.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      
      // Check public access block
      const publicAccessBlock = await s3.getPublicAccessBlock({
        Bucket: tapBucket!.Name!
      }).promise();
      
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, timeout);

    test('should have versioning enabled', async () => {
      const buckets = await s3.listBuckets().promise();
      const tapBucket = buckets.Buckets!.find(bucket => 
        bucket.Name?.includes(`tap`) && bucket.Name?.includes(environmentSuffix.toLowerCase())
      );

      const versioning = await s3.getBucketVersioning({
        Bucket: tapBucket!.Name!
      }).promise();
      
      expect(versioning.Status).toBe('Enabled');
    }, timeout);
  });

  describe('Lambda Function', () => {
    test('should have Lambda function in VPC with proper configuration', async () => {
      const functions = await lambda.listFunctions().promise();
      const tapFunction = functions.Functions!.find(fn => 
        fn.FunctionName?.includes(`TapLambda${environmentSuffix}`) ||
        fn.FunctionName?.includes('TapLambda')
      );

      expect(tapFunction).toBeDefined();
      expect(tapFunction!.Runtime).toBe('nodejs18.x');
      expect(tapFunction!.VpcConfig).toBeDefined();
      expect(tapFunction!.VpcConfig!.SubnetIds!.length).toBeGreaterThan(0);
      expect(tapFunction!.VpcConfig!.SecurityGroupIds!.length).toBeGreaterThan(0);
    }, timeout);
  });

  describe('API Gateway', () => {
    test('should have REST API with proper configuration', async () => {
      const apis = await apigateway.getRestApis().promise();
      const tapApi = apis.items!.find(api => api.name === 'TAP API');

      expect(tapApi).toBeDefined();
      expect(tapApi!.endpointConfiguration!.types).toContain('REGIONAL');
    }, timeout);

    test('should be accessible via HTTPS', async () => {
      const apiEndpoint = outputs.TapApiEndpoint || process.env.TAP_API_ENDPOINT;
      
      if (apiEndpoint) {
        try {
          const response = await axios.get(apiEndpoint, { timeout: 10000 });
          expect(response.status).toBe(200);
        } catch (error: any) {
          // API might return different status codes, but should be reachable
          expect(error.response?.status).toBeDefined();
        }
      } else {
        console.warn('API endpoint not found in outputs, skipping connectivity test');
      }
    }, timeout);
  });

  describe('WAF', () => {
    test('should have WAF WebACL with managed rules', async () => {
      const webACLs = await wafv2.listWebACLs({ Scope: 'REGIONAL' }).promise();
      const tapWebACL = webACLs.WebACLs!.find(acl => 
        acl.Name?.includes(`TapWebAcl${environmentSuffix}`) ||
        acl.Name?.includes('TapWebAcl')
      );

      expect(tapWebACL).toBeDefined();
      
      const webACLDetails = await wafv2.getWebACL({
        Scope: 'REGIONAL',
        Id: tapWebACL!.Id!,
        Name: tapWebACL!.Name!
      }).promise();

      expect(webACLDetails.WebACL!.Rules!.length).toBeGreaterThanOrEqual(2);
      
      const ruleNames = webACLDetails.WebACL!.Rules!.map(rule => rule.Name);
      expect(ruleNames).toContain('AWSManagedRulesCommonRuleSet');
      expect(ruleNames).toContain('AWSManagedRulesKnownBadInputsRuleSet');
    }, timeout);
  });

  describe('KMS Key', () => {
    test('should have KMS key with rotation enabled', async () => {
      const keys = await kms.listKeys().promise();
      
      for (const key of keys.Keys!) {
        const keyDetails = await kms.describeKey({ KeyId: key.KeyId! }).promise();
        const tags = await kms.listResourceTags({ KeyId: key.KeyId! }).promise();
        
        const isProjectKey = tags.Tags!.some(tag => 
          tag.TagKey === 'Project' && tag.TagValue === 'tap'
        );
        
        if (isProjectKey) {
          expect(keyDetails.KeyMetadata!.Description).toBe('KMS key for TAP stack encryption');
          
          const rotationStatus = await kms.getKeyRotationStatus({ KeyId: key.KeyId! }).promise();
          expect(rotationStatus.KeyRotationEnabled).toBe(true);
          break;
        }
      }
    }, timeout);
  });

  describe('IAM Password Policy', () => {
    test('should enforce password complexity standards', async () => {
      const passwordPolicy = await iam.getAccountPasswordPolicy().promise();
      
      expect(passwordPolicy.PasswordPolicy.MinimumPasswordLength).toBeGreaterThanOrEqual(12);
      expect(passwordPolicy.PasswordPolicy.RequireUppercaseCharacters).toBe(true);
      expect(passwordPolicy.PasswordPolicy.RequireLowercaseCharacters).toBe(true);
      expect(passwordPolicy.PasswordPolicy.RequireNumbers).toBe(true);
      expect(passwordPolicy.PasswordPolicy.RequireSymbols).toBe(true);
      expect(passwordPolicy.PasswordPolicy.MaxPasswordAge).toBe(90);
      expect(passwordPolicy.PasswordPolicy.PasswordReusePrevention).toBe(12);
    }, timeout);
  });

  describe('Resource Tagging', () => {
    test('should have consistent tagging across all resources', async () => {
      // Test VPC tags
      const vpcs = await ec2.describeVpcs({
        Filters: [{ Name: 'tag:Project', Values: ['tap'] }]
      }).promise();
      
      expect(vpcs.Vpcs!.length).toBeGreaterThan(0);
      const vpc = vpcs.Vpcs![0];
      
      const requiredTags = ['Environment', 'Project', 'Owner'];
      const vpcTags = vpc.Tags!.map(tag => tag.Key);
      
      requiredTags.forEach(tagKey => {
        expect(vpcTags).toContain(tagKey);
      });
      
      const projectTag = vpc.Tags!.find(tag => tag.Key === 'Project');
      expect(projectTag!.Value).toBe('tap');
    }, timeout);
  });

  describe('End-to-End Functionality', () => {
    test('should have all critical resources deployed and healthy', async () => {
      // Verify VPC exists
      const vpcs = await ec2.describeVpcs({
        Filters: [{ Name: 'tag:Project', Values: ['tap'] }]
      }).promise();
      expect(vpcs.Vpcs!.length).toBeGreaterThanOrEqual(1);

      // Verify EC2 instance is running
      const instances = await ec2.describeInstances({
        Filters: [
          { Name: 'tag:Project', Values: ['tap'] },
          { Name: 'instance-state-name', Values: ['running', 'pending'] }
        ]
      }).promise();
      expect(instances.Reservations!.length).toBeGreaterThan(0);

      // Verify RDS is available
      const databases = await rds.describeDBInstances().promise();
      const tapDb = databases.DBInstances!.find(db => 
        db.TagList?.some(tag => tag.Key === 'Project' && tag.Value === 'tap')
      );
      expect(tapDb).toBeDefined();

      // Verify S3 bucket exists
      const buckets = await s3.listBuckets().promise();
      const tapBucket = buckets.Buckets!.find(bucket => 
        bucket.Name?.includes(`tap`) && bucket.Name?.includes(environmentSuffix.toLowerCase())
      );
      expect(tapBucket).toBeDefined();

      // Verify Lambda function exists
      const functions = await lambda.listFunctions().promise();
      const tapFunction = functions.Functions!.find(fn => 
        fn.FunctionName?.includes(`TapLambda${environmentSuffix}`) ||
        fn.FunctionName?.includes('TapLambda')
      );
      expect(tapFunction).toBeDefined();

      // Verify API Gateway exists
      const apis = await apigateway.getRestApis().promise();
      const tapApi = apis.items!.find(api => api.name === 'TAP API');
      expect(tapApi).toBeDefined();
    }, timeout);
  });
});
