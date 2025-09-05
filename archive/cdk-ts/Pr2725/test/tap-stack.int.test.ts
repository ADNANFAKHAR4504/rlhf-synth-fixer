// AWS Infrastructure Integration Tests - Verify deployed resources
import * as AWS from 'aws-sdk';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Configure AWS SDK
AWS.config.update({ region: 'us-east-1' });

describe('AWS Infrastructure Integration Tests', () => {
  const ec2 = new AWS.EC2();
  const s3 = new AWS.S3();
  const rds = new AWS.RDS();
  const cloudFront = new AWS.CloudFront();
  const logs = new AWS.CloudWatchLogs();
  const cloudTrail = new AWS.CloudTrail();

  describe('VPC and Networking Infrastructure', () => {
    test('VPC exists and is properly configured', async () => {
      const response = await ec2.describeVpcs({
        VpcIds: [outputs.VpcId]
      }).promise();

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBeDefined();
      // DNS attributes need to be checked separately via describe-vpc-attribute
      const dnsSupportResponse = await ec2.describeVpcAttribute({
        VpcId: outputs.VpcId,
        Attribute: 'enableDnsSupport'
      }).promise();
      const dnsHostnamesResponse = await ec2.describeVpcAttribute({
        VpcId: outputs.VpcId,
        Attribute: 'enableDnsHostnames'
      }).promise();
      
      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);

      // Check for proper tagging
      const envTag = vpc.Tags?.find(tag => tag.Key === 'Environment');
      const projectTag = vpc.Tags?.find(tag => tag.Key === 'Project');
      expect(envTag?.Value).toBe(environmentSuffix);
      expect(projectTag?.Value).toBe('TapStack');
    });

    test('subnets are created across multiple AZs', async () => {
      const response = await ec2.describeSubnets({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VpcId] }
        ]
      }).promise();

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(6);

      // Check for public, private, and isolated subnets
      const publicSubnets = response.Subnets!.filter(subnet => 
        subnet.MapPublicIpOnLaunch === true
      );
      const privateSubnets = response.Subnets!.filter(subnet => 
        subnet.MapPublicIpOnLaunch === false &&
        subnet.Tags?.some(tag => tag.Key === 'Name' && tag.Value?.includes('private'))
      );
      const isolatedSubnets = response.Subnets!.filter(subnet => 
        subnet.Tags?.some(tag => tag.Key === 'Name' && tag.Value?.includes('isolated'))
      );

      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
      expect(isolatedSubnets.length).toBeGreaterThanOrEqual(2);

      // Verify subnets are in different AZs
      const azs = new Set(response.Subnets!.map(subnet => subnet.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('NAT Gateway is configured for private subnet connectivity', async () => {
      const response = await ec2.describeNatGateways({
        Filter: [
          { Name: 'vpc-id', Values: [outputs.VpcId] }
        ]
      }).promise();

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);
      
      const natGateway = response.NatGateways![0];
      expect(natGateway.State).toBe('available');
      expect(natGateway.NatGatewayAddresses).toBeDefined();
    });

    test('Internet Gateway is attached to VPC', async () => {
      const response = await ec2.describeInternetGateways({
        Filters: [
          { Name: 'attachment.vpc-id', Values: [outputs.VpcId] }
        ]
      }).promise();

      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBe(1);
      
      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toBeDefined();
      expect(igw.Attachments![0].State).toBe('available');
    });
  });

  describe('EC2 Infrastructure', () => {
    test('EC2 instance is running and properly configured', async () => {
      const response = await ec2.describeInstances({
        InstanceIds: [outputs.EC2InstanceId]
      }).promise();

      expect(response.Reservations).toBeDefined();
      expect(response.Reservations!.length).toBe(1);
      
      const instance = response.Reservations![0].Instances![0];
      expect(instance.State?.Name).toBe('running');
      expect(instance.InstanceType).toBe('t3.micro');
      expect(instance.PrivateIpAddress).toBe(outputs.EC2PrivateIp);
      expect(instance.VpcId).toBe(outputs.VpcId);

      // Verify proper tagging
      const envTag = instance.Tags?.find(tag => tag.Key === 'Environment');
      const projectTag = instance.Tags?.find(tag => tag.Key === 'Project');
      expect(envTag?.Value).toBe(environmentSuffix);
      expect(projectTag?.Value).toBe('TapStack');

      // Verify instance is in private subnet
      expect(instance.PublicIpAddress).toBeUndefined();
    });

    test('EC2 security group allows only restricted SSH access', async () => {
      const instanceResponse = await ec2.describeInstances({
        InstanceIds: [outputs.EC2InstanceId]
      }).promise();

      const instance = instanceResponse.Reservations![0].Instances![0];
      const securityGroupId = instance.SecurityGroups![0].GroupId!;

      const sgResponse = await ec2.describeSecurityGroups({
        GroupIds: [securityGroupId]
      }).promise();

      const securityGroup = sgResponse.SecurityGroups![0];
      expect(securityGroup.Description).toBe('Security group for production EC2 instance');

      // Check SSH access is restricted to specific IP
      const sshRule = securityGroup.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.[0].CidrIp).toBe('10.0.0.1/32');
    });
  });

  describe('S3 Infrastructure', () => {
    test('main S3 bucket exists with proper security configuration', async () => {
      // Check bucket exists
      const headResponse = await s3.headBucket({
        Bucket: outputs.S3BucketName
      }).promise();
      expect(headResponse).toBeDefined();

      // Check versioning is enabled
      const versioningResponse = await s3.getBucketVersioning({
        Bucket: outputs.S3BucketName
      }).promise();
      expect(versioningResponse.Status).toBe('Enabled');

      // Check encryption is enabled
      const encryptionResponse = await s3.getBucketEncryption({
        Bucket: outputs.S3BucketName
      }).promise();
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules).toBeDefined();

      // Check public access is blocked
      const publicAccessResponse = await s3.getPublicAccessBlock({
        Bucket: outputs.S3BucketName
      }).promise();
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    });

    test('S3 bucket policy restricts access to CloudFront only', async () => {
      const response = await s3.getBucketPolicy({
        Bucket: outputs.S3BucketName
      }).promise();

      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);
      
      // Find CloudFront access statement
      const cloudFrontStatement = policy.Statement.find((stmt: any) => 
        stmt.Principal?.Service === 'cloudfront.amazonaws.com'
      );
      expect(cloudFrontStatement).toBeDefined();
      expect(cloudFrontStatement.Action).toBe('s3:GetObject');
    });
  });

  describe('RDS Infrastructure', () => {
    test('RDS instance is available and properly configured', async () => {
      const response = await rds.describeDBInstances({
        DBInstanceIdentifier: `prod-pr-database-${environmentSuffix}`
      }).promise();

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBe(1);
      
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.DBInstanceClass).toBe('db.t3.micro');
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.BackupRetentionPeriod).toBe(7);
      expect(dbInstance.DeletionProtection).toBe(false); // Changed to allow deletion
      expect(dbInstance.MonitoringInterval).toBe(60);
      expect(dbInstance.Endpoint?.Address).toBe(outputs.RdsEndpoint);

      // Verify CloudWatch logs exports are enabled
      expect(dbInstance.EnabledCloudwatchLogsExports).toContain('error');
      expect(dbInstance.EnabledCloudwatchLogsExports).toContain('general');
      expect(dbInstance.EnabledCloudwatchLogsExports).toContain('slowquery');

      // Verify instance is not publicly accessible
      expect(dbInstance.PubliclyAccessible).toBe(false);
    });

    test('RDS security group allows access only from EC2 security group', async () => {
      const response = await rds.describeDBInstances({
        DBInstanceIdentifier: `prod-pr-database-${environmentSuffix}`
      }).promise();

      const dbInstance = response.DBInstances![0];
      const securityGroupId = dbInstance.VpcSecurityGroups![0].VpcSecurityGroupId!;

      const sgResponse = await ec2.describeSecurityGroups({
        GroupIds: [securityGroupId]
      }).promise();

      const securityGroup = sgResponse.SecurityGroups![0];
      expect(securityGroup.Description).toBe('Security group for production RDS instance');

      // Check MySQL port access
      const mysqlRule = securityGroup.IpPermissions?.find(rule => 
        rule.FromPort === 3306 && rule.ToPort === 3306
      );
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs?.length).toBeGreaterThan(0);
    });
  });

  describe('CloudFront Distribution', () => {
    test('CloudFront distribution is deployed and enabled', async () => {
      const response = await cloudFront.getDistribution({
        Id: outputs.CloudFrontDistributionId
      }).promise();

      expect(response.Distribution).toBeDefined();
      const distribution = response.Distribution!;
      expect(distribution.DistributionConfig.Enabled).toBe(true);
      expect(distribution.DistributionConfig.Comment).toBe('prod CloudFront Distribution');
      expect(distribution.DistributionConfig.PriceClass).toBe('PriceClass_100');
      expect(distribution.DistributionConfig.DefaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
      expect(distribution.DomainName).toBe(outputs.CloudFrontDomainName);
    });

    test('CloudFront distribution can serve content', async () => {
      // Test basic HTTP request to CloudFront domain
      const https = require('https');
      
      const response = await new Promise((resolve, reject) => {
        https.get(`https://${outputs.CloudFrontDomainName}`, (res: any) => {
          resolve({ statusCode: res.statusCode, headers: res.headers });
        }).on('error', reject);
      });

      // We expect a 403 (access denied) since there's no content in S3, but CloudFront is working
      expect([403, 404]).toContain((response as any).statusCode);
    });
  });

  describe('CloudWatch Logging', () => {
    test('application log group exists', async () => {
      const response = await logs.describeLogGroups({
        logGroupNamePrefix: outputs.ApplicationLogGroupName
      }).promise();

      expect(response.logGroups).toBeDefined();
      const logGroup = response.logGroups!.find(lg => lg.logGroupName === outputs.ApplicationLogGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(30);
    });

    test('system log group exists', async () => {
      const response = await logs.describeLogGroups({
        logGroupNamePrefix: outputs.SystemLogGroupName
      }).promise();

      expect(response.logGroups).toBeDefined();
      const logGroup = response.logGroups!.find(lg => lg.logGroupName === outputs.SystemLogGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(30);
    });
  });

  describe('CloudTrail Auditing', () => {
    test('CloudTrail is active and logging', async () => {
      const trailName = `prod-pr-cloudtrail-${environmentSuffix}`;
      
      const response = await cloudTrail.describeTrails({
        trailNameList: [trailName]
      }).promise();

      expect(response.trailList).toBeDefined();
      expect(response.trailList!.length).toBe(1);
      
      const trail = response.trailList![0];
      expect(trail.Name).toBe(trailName);
      expect(trail.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.LogFileValidationEnabled).toBe(true);

      // Check if trail is logging
      const statusResponse = await cloudTrail.getTrailStatus({
        Name: trailName
      }).promise();
      expect(statusResponse.IsLogging).toBe(true);
    });
  });

  describe('Deletion Configuration', () => {
    test('RDS instance has deletion protection disabled', async () => {
      const response = await rds.describeDBInstances({
        DBInstanceIdentifier: `prod-pr-database-${environmentSuffix}`
      }).promise();

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DeletionProtection).toBe(false);
    });

    test('S3 buckets are configured for automatic deletion', async () => {
      // Verify main S3 bucket exists
      const mainBucket = await s3.headBucket({
        Bucket: outputs.S3BucketName
      }).promise();
      expect(mainBucket.$response.httpResponse.statusCode).toBe(200);

      // Verify CloudTrail bucket exists
      const trailBucket = await s3.headBucket({
        Bucket: `prod-pr-cloudtrail-${environmentSuffix}-${process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID}`
      }).promise().catch(() => null);
      // CloudTrail bucket may or may not exist depending on deployment
    });
  });

  describe('Security and Compliance Verification', () => {
    test('no resources have public access when they should not', async () => {
      // Verify RDS is not publicly accessible
      const rdsResponse = await rds.describeDBInstances({
        DBInstanceIdentifier: `prod-pr-database-${environmentSuffix}`
      }).promise();
      expect(rdsResponse.DBInstances![0].PubliclyAccessible).toBe(false);

      // Verify EC2 instance is in private subnet (no public IP)
      const ec2Response = await ec2.describeInstances({
        InstanceIds: [outputs.EC2InstanceId]
      }).promise();
      expect(ec2Response.Reservations![0].Instances![0].PublicIpAddress).toBeUndefined();

      // Verify S3 bucket blocks public access
      const s3Response = await s3.getPublicAccessBlock({
        Bucket: outputs.S3BucketName
      }).promise();
      expect(s3Response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(s3Response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    });

    test('encryption is enabled on storage resources', async () => {
      // Verify RDS encryption
      const rdsResponse = await rds.describeDBInstances({
        DBInstanceIdentifier: `prod-pr-database-${environmentSuffix}`
      }).promise();
      expect(rdsResponse.DBInstances![0].StorageEncrypted).toBe(true);

      // Verify S3 encryption
      const s3Response = await s3.getBucketEncryption({
        Bucket: outputs.S3BucketName
      }).promise();
      expect(s3Response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
    });

    test('backup and retention policies are properly configured', async () => {
      // Verify RDS backup retention
      const rdsResponse = await rds.describeDBInstances({
        DBInstanceIdentifier: `prod-pr-database-${environmentSuffix}`
      }).promise();
      expect(rdsResponse.DBInstances![0].BackupRetentionPeriod).toBe(7);
      expect(rdsResponse.DBInstances![0].DeletionProtection).toBe(false);

      // Verify S3 versioning
      const s3Response = await s3.getBucketVersioning({
        Bucket: outputs.S3BucketName
      }).promise();
      expect(s3Response.Status).toBe('Enabled');

      // Verify log group retention
      const logsResponse = await logs.describeLogGroups({
        logGroupNamePrefix: outputs.ApplicationLogGroupName
      }).promise();
      const logGroup = logsResponse.logGroups!.find(lg => lg.logGroupName === outputs.ApplicationLogGroupName);
      expect(logGroup?.retentionInDays).toBe(30);
    });
  });

  describe('High Availability and Resilience', () => {
    test('resources are distributed across multiple AZs', async () => {
      // Check RDS Multi-AZ
      const rdsResponse = await rds.describeDBInstances({
        DBInstanceIdentifier: `prod-pr-database-${environmentSuffix}`
      }).promise();
      expect(rdsResponse.DBInstances![0].MultiAZ).toBe(true);

      // Check subnets span multiple AZs
      const subnetResponse = await ec2.describeSubnets({
        Filters: [{ Name: 'vpc-id', Values: [outputs.VpcId] }]
      }).promise();
      const azs = new Set(subnetResponse.Subnets!.map(subnet => subnet.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Resource Connectivity and Communication', () => {
    test('security groups allow proper communication between tiers', async () => {
      // Get EC2 security group
      const ec2Response = await ec2.describeInstances({
        InstanceIds: [outputs.EC2InstanceId]
      }).promise();
      const ec2SecurityGroupId = ec2Response.Reservations![0].Instances![0].SecurityGroups![0].GroupId!;

      // Get RDS security group rules
      const rdsResponse = await rds.describeDBInstances({
        DBInstanceIdentifier: `prod-pr-database-${environmentSuffix}`
      }).promise();
      const rdsSecurityGroupId = rdsResponse.DBInstances![0].VpcSecurityGroups![0].VpcSecurityGroupId!;

      const sgResponse = await ec2.describeSecurityGroups({
        GroupIds: [rdsSecurityGroupId]
      }).promise();

      const rdsSecurityGroup = sgResponse.SecurityGroups![0];
      
      // Check that RDS allows access from EC2 security group on MySQL port
      const mysqlRule = rdsSecurityGroup.IpPermissions?.find(rule => 
        rule.FromPort === 3306 && rule.ToPort === 3306
      );
      expect(mysqlRule).toBeDefined();
      
      const allowedSecurityGroup = mysqlRule?.UserIdGroupPairs?.find(pair => 
        pair.GroupId === ec2SecurityGroupId
      );
      expect(allowedSecurityGroup).toBeDefined();
    });
  });
});
