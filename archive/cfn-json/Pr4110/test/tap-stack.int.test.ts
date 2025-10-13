import fs from 'fs';
import path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
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
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketLoggingCommand,
  GetPublicAccessBlockCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyPolicyCommand,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  CloudTrailClient,
  GetTrailCommand,
  GetTrailStatusCommand,
  GetEventSelectorsCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeMetricFiltersCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  WAFV2Client,
  GetWebACLCommand,
  GetLoggingConfigurationCommand,
} from '@aws-sdk/client-wafv2';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
  ListAttachedRolePoliciesCommand,
  GetInstanceProfileCommand,
} from '@aws-sdk/client-iam';

describe('TapStack Integration Tests - Deployed Resources', () => {
  // Load CloudFormation outputs
  const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
  let outputs: any = {};
  let hasDeployment = false;

  // AWS Configuration
  const awsRegion = process.env.AWS_REGION || 'us-east-1';
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

  // Initialize AWS SDK clients
  const ec2Client = new EC2Client({ region: awsRegion });
  const rdsClient = new RDSClient({ region: awsRegion });
  const s3Client = new S3Client({ region: awsRegion });
  const kmsClient = new KMSClient({ region: awsRegion });
  const secretsClient = new SecretsManagerClient({ region: awsRegion });
  const cloudTrailClient = new CloudTrailClient({ region: awsRegion });
  const snsClient = new SNSClient({ region: awsRegion });
  const cloudWatchLogsClient = new CloudWatchLogsClient({ region: awsRegion });
  const cloudWatchClient = new CloudWatchClient({ region: awsRegion });
  const wafClient = new WAFV2Client({ region: awsRegion });
  const iamClient = new IAMClient({ region: awsRegion });

  beforeAll(() => {
    if (fs.existsSync(outputsPath)) {
      const content = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(content);
      hasDeployment = Object.keys(outputs).length > 0;
      console.log('Loaded deployment outputs:', Object.keys(outputs));
    } else {
      console.warn('No deployment outputs found. Integration tests will be skipped.');
    }
  });

  // Helper to skip tests if no deployment
  const skipIfNoDeployment = () => {
    if (!hasDeployment) {
      console.log('Skipping test - no deployment found');
      return true;
    }
    return false;
  };

  // ==================== VPC and Networking Tests ====================
  describe('VPC and Network Infrastructure', () => {
    test('should have VPC deployed with proper configuration', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(vpcId);
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');

      // Check DNS settings (may not be directly accessible via API)
      // DNS settings are configured in CloudFormation template

      // Check tags
      const tags = vpc.Tags || [];
      expect(tags.some(t => t.Key === 'Environment')).toBe(true);
      expect(tags.some(t => t.Key === 'ManagedBy' && t.Value === 'CloudFormation')).toBe(true);
    }, 30000);

    test('should have two subnets in different availability zones', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(2);

      // Verify subnets are in different AZs
      const azs = response.Subnets!.map(s => s.AvailabilityZone);
      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBeGreaterThanOrEqual(2);

      // Verify CIDR blocks
      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toContain('10.0.0.0/20');
      expect(cidrBlocks).toContain('10.0.16.0/20');
    }, 30000);

    test('should have Internet Gateway attached to VPC', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].VpcId).toBe(vpcId);
      expect(igw.Attachments![0].State).toBe('available');
    }, 30000);

    test('should have route table with internet gateway route', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables!.length).toBeGreaterThan(0);

      // Find route table with internet gateway route
      const routeTable = response.RouteTables!.find(rt =>
        rt.Routes?.some(r => r.GatewayId?.startsWith('igw-') && r.DestinationCidrBlock === '0.0.0.0/0')
      );

      expect(routeTable).toBeDefined();
      expect(routeTable!.Associations!.length).toBeGreaterThanOrEqual(2);
    }, 30000);

    test('should have security groups with proper configurations', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      // Filter to only our custom security groups
      const customSecurityGroups = response.SecurityGroups!.filter(sg =>
        sg.GroupName?.includes('ApplicationSecurityGroup') ||
        sg.GroupName?.includes('DatabaseSecurityGroup') ||
        sg.GroupName?.includes('BastionSecurityGroup')
      );

      // Should have at least 3 custom security groups
      expect(customSecurityGroups.length).toBeGreaterThanOrEqual(3);

      // Check ApplicationSecurityGroup
      const appSG = response.SecurityGroups!.find(sg =>
        sg.GroupName?.includes('ApplicationSecurityGroup')
      );
      expect(appSG).toBeDefined();
      expect(appSG!.IpPermissions!.length).toBeGreaterThan(0);

      // Check DatabaseSecurityGroup
      const dbSG = response.SecurityGroups!.find(sg =>
        sg.GroupName?.includes('DatabaseSecurityGroup')
      );
      expect(dbSG).toBeDefined();
      expect(dbSG!.IpPermissions).toHaveLength(1);
      const dbIngress = dbSG!.IpPermissions![0];
      expect(dbIngress.FromPort).toBe(3306);
      expect(dbIngress.ToPort).toBe(3306);
      expect(dbIngress.UserIdGroupPairs).toHaveLength(1);

      // Check BastionSecurityGroup has no SSH ingress
      const bastionSG = response.SecurityGroups!.find(sg =>
        sg.GroupName?.includes('BastionSecurityGroup')
      );
      expect(bastionSG).toBeDefined();
      expect(bastionSG!.IpPermissions).toHaveLength(0);
    }, 30000);
  });

  // ==================== Storage Tests ====================
  describe('S3 Storage and Encryption', () => {
    test('should have S3 logging bucket deployed with encryption', async () => {
      if (skipIfNoDeployment()) return;

      const bucketName = outputs.S3LoggingBucketName;
      expect(bucketName).toBeDefined();

      // Check bucket exists
      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(headCommand)).resolves.toBeDefined();

      // Check encryption
      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');

      // Check public access block
      const publicAccessCommand = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const publicAccessResponse = await s3Client.send(publicAccessCommand);
      const config = publicAccessResponse.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);

      // Check lifecycle policy
      const lifecycleCommand = new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName });
      const lifecycleResponse = await s3Client.send(lifecycleCommand);
      expect(lifecycleResponse.Rules).toHaveLength(1);
      expect(lifecycleResponse.Rules![0].Expiration!.Days).toBe(90);
    }, 30000);

    test('should have application data bucket with KMS encryption', async () => {
      if (skipIfNoDeployment()) return;

      const bucketName = outputs.ApplicationDataBucketName;
      expect(bucketName).toBeDefined();

      // Check bucket exists
      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(headCommand)).resolves.toBeDefined();

      // Check KMS encryption
      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      const rule = encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
      expect(rule.ApplyServerSideEncryptionByDefault!.KMSMasterKeyID).toBeDefined();

      // Check versioning
      const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');

      // Check logging configuration
      const loggingCommand = new GetBucketLoggingCommand({ Bucket: bucketName });
      const loggingResponse = await s3Client.send(loggingCommand);
      expect(loggingResponse.LoggingEnabled).toBeDefined();
      expect(loggingResponse.LoggingEnabled!.TargetBucket).toBe(outputs.S3LoggingBucketName);
      expect(loggingResponse.LoggingEnabled!.TargetPrefix).toBe('application-data/');
    }, 30000);

    test('should have bucket policy allowing CloudTrail to write', async () => {
      if (skipIfNoDeployment()) return;

      const bucketName = outputs.S3LoggingBucketName;
      const policyCommand = new GetBucketPolicyCommand({ Bucket: bucketName });
      const policyResponse = await s3Client.send(policyCommand);

      expect(policyResponse.Policy).toBeDefined();
      const policy = JSON.parse(policyResponse.Policy!);
      expect(policy.Statement).toBeDefined();

      // Check for CloudTrail permissions
      const aclStatement = policy.Statement.find((s: any) => s.Sid === 'AWSCloudTrailAclCheck');
      expect(aclStatement).toBeDefined();
      expect(aclStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
      expect(aclStatement.Action).toBe('s3:GetBucketAcl');

      const writeStatement = policy.Statement.find((s: any) => s.Sid === 'AWSCloudTrailWrite');
      expect(writeStatement).toBeDefined();
      expect(writeStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
      expect(writeStatement.Action).toBe('s3:PutObject');
    }, 30000);
  });

  // ==================== KMS Encryption Tests ====================
  describe('KMS Key and Encryption', () => {
    test('should have KMS key deployed and enabled', async () => {
      if (skipIfNoDeployment()) return;

      const keyId = outputs.KMSKeyId;
      expect(keyId).toBeDefined();

      const command = new DescribeKeyCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.Description).toBe('KMS key for encrypting sensitive data');
      expect(response.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
    }, 30000);

    test('should have KMS key alias configured', async () => {
      if (skipIfNoDeployment()) return;

      const keyId = outputs.KMSKeyId;
      const command = new ListAliasesCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);

      expect(response.Aliases).toBeDefined();
      const alias = response.Aliases!.find(a => a.AliasName === 'alias/secure-infrastructure');
      expect(alias).toBeDefined();
      expect(alias!.TargetKeyId).toBe(keyId);
    }, 30000);

    test('should have KMS key policy allowing services', async () => {
      if (skipIfNoDeployment()) return;

      const keyId = outputs.KMSKeyId;
      const command = new GetKeyPolicyCommand({
        KeyId: keyId,
        PolicyName: 'default',
      });
      const response = await kmsClient.send(command);

      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);
      expect(policy.Statement).toBeDefined();

      // Check for service permissions
      const serviceStatement = policy.Statement.find(
        (s: any) => s.Sid === 'Allow services to use the key'
      );
      expect(serviceStatement).toBeDefined();
      expect(serviceStatement.Principal.Service).toContain('rds.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('s3.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('logs.amazonaws.com');
    }, 30000);
  });

  // ==================== Database Tests ====================
  describe('RDS Database', () => {
    test('should have RDS instance deployed and available', async () => {
      if (skipIfNoDeployment()) return;

      const dbEndpoint = outputs.DatabaseEndpoint;
      expect(dbEndpoint).toBeDefined();

      const dbIdentifier = `secure-db-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toHaveLength(1);
      const db = response.DBInstances![0];
      expect(db.DBInstanceStatus).toBe('available');
      expect(db.Engine).toBe('mysql');
      expect(db.EngineVersion).toBe('8.0.39');
      expect(db.DBInstanceClass).toBe('db.t3.micro');
      expect(db.AllocatedStorage).toBe(20);
    }, 60000);

    test('should have database encrypted with KMS', async () => {
      if (skipIfNoDeployment()) return;

      const dbIdentifier = `secure-db-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      const db = response.DBInstances![0];
      expect(db.StorageEncrypted).toBe(true);
      expect(db.KmsKeyId).toBeDefined();
      expect(db.KmsKeyId).toContain(outputs.KMSKeyId);
    }, 30000);

    test('should have database not publicly accessible', async () => {
      if (skipIfNoDeployment()) return;

      const dbIdentifier = `secure-db-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      const db = response.DBInstances![0];
      expect(db.PubliclyAccessible).toBe(false);
    }, 30000);

    test('should have database in subnet group with multiple AZs', async () => {
      if (skipIfNoDeployment()) return;

      const dbIdentifier = `secure-db-${environmentSuffix}`;
      const dbCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const dbResponse = await rdsClient.send(dbCommand);

      const db = dbResponse.DBInstances![0];
      const subnetGroupName = db.DBSubnetGroup!.DBSubnetGroupName;

      const subnetCommand = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: subnetGroupName,
      });
      const subnetResponse = await rdsClient.send(subnetCommand);

      expect(subnetResponse.DBSubnetGroups).toHaveLength(1);
      const subnetGroup = subnetResponse.DBSubnetGroups![0];
      expect(subnetGroup.Subnets).toHaveLength(2);

      // Verify subnets are in different AZs
      const azs = subnetGroup.Subnets!.map(s => s.SubnetAvailabilityZone!.Name);
      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBe(2);
    }, 30000);

    test('should have database with backup configuration', async () => {
      if (skipIfNoDeployment()) return;

      const dbIdentifier = `secure-db-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      const db = response.DBInstances![0];
      expect(db.BackupRetentionPeriod).toBe(7);
      expect(db.PreferredBackupWindow).toBe('03:00-04:00');
      expect(db.PreferredMaintenanceWindow).toBe('sun:04:00-sun:05:00');
    }, 30000);

    test('should have database with CloudWatch logs enabled', async () => {
      if (skipIfNoDeployment()) return;

      const dbIdentifier = `secure-db-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);

      const db = response.DBInstances![0];
      expect(db.EnabledCloudwatchLogsExports).toBeDefined();
      expect(db.EnabledCloudwatchLogsExports).toContain('error');
      expect(db.EnabledCloudwatchLogsExports).toContain('general');
      expect(db.EnabledCloudwatchLogsExports).toContain('slowquery');
    }, 30000);
  });

  // ==================== Secrets Manager Tests ====================
  describe('Secrets Manager', () => {
    test('should have database password secret created', async () => {
      if (skipIfNoDeployment()) return;

      const secretArn = outputs.DatabaseSecretArn;
      expect(secretArn).toBeDefined();

      const command = new DescribeSecretCommand({ SecretId: secretArn });
      const response = await secretsClient.send(command);

      expect(response.Name).toContain('/secure-app/database/password');
      expect(response.Description).toBe('RDS database master password');
    }, 30000);

    test('should be able to retrieve secret value', async () => {
      if (skipIfNoDeployment()) return;

      const secretArn = outputs.DatabaseSecretArn;
      const command = new GetSecretValueCommand({ SecretId: secretArn });
      const response = await secretsClient.send(command);

      expect(response.SecretString).toBeDefined();
      const secret = JSON.parse(response.SecretString!);
      expect(secret.username).toBe('admin');
      expect(secret.password).toBeDefined();
      expect(secret.password.length).toBe(32);
    }, 30000);
  });

  // ==================== EC2 Instance Tests ====================
  describe('EC2 Instance', () => {
    test('should have EC2 instance deployed and running', async () => {
      if (skipIfNoDeployment()) return;

      const instanceId = outputs.EC2InstanceId;
      expect(instanceId).toBeDefined();

      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });
      const response = await ec2Client.send(command);

      expect(response.Reservations).toHaveLength(1);
      const instance = response.Reservations![0].Instances![0];
      expect(instance.State!.Name).toMatch(/running|pending/);
      expect(instance.InstanceType).toBe('t3.micro');
    }, 30000);

    test('should have EC2 instance in correct security group and subnet', async () => {
      if (skipIfNoDeployment()) return;

      const instanceId = outputs.EC2InstanceId;
      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });
      const response = await ec2Client.send(command);

      const instance = response.Reservations![0].Instances![0];
      expect(instance.VpcId).toBe(outputs.VPCId);
      expect(instance.SecurityGroups).toHaveLength(1);
      expect(instance.SecurityGroups![0].GroupName).toContain('ApplicationSecurityGroup');
    }, 30000);

    test('should have EC2 instance with IAM instance profile', async () => {
      if (skipIfNoDeployment()) return;

      const instanceId = outputs.EC2InstanceId;
      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });
      const response = await ec2Client.send(command);

      const instance = response.Reservations![0].Instances![0];
      expect(instance.IamInstanceProfile).toBeDefined();
      expect(instance.IamInstanceProfile!.Arn).toContain('EC2InstanceProfile');
    }, 30000);
  });

  // ==================== IAM Roles Tests ====================
  describe('IAM Roles and Policies', () => {
    test('should have EC2 role with proper policies', async () => {
      if (skipIfNoDeployment()) return;

      const roleName = `SecureEC2Role-${environmentSuffix}`;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);

      // Check assume role policy
      const assumeRolePolicy = JSON.parse(decodeURIComponent(response.Role!.AssumeRolePolicyDocument!));
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    }, 30000);

    test('should have EC2 role with managed policies attached', async () => {
      if (skipIfNoDeployment()) return;

      const roleName = `SecureEC2Role-${environmentSuffix}`;
      const command = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.AttachedPolicies).toBeDefined();
      const policyArns = response.AttachedPolicies!.map(p => p.PolicyArn);
      expect(policyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    }, 30000);

    test('should have EC2 role with S3 access policy', async () => {
      if (skipIfNoDeployment()) return;

      const roleName = `SecureEC2Role-${environmentSuffix}`;
      const command = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'S3AccessPolicy',
      });
      const response = await iamClient.send(command);

      expect(response.PolicyDocument).toBeDefined();
      const policy = JSON.parse(decodeURIComponent(response.PolicyDocument!));
      expect(policy.Statement).toBeDefined();

      // Check for S3 object access
      const objectStatement = policy.Statement.find((s: any) =>
        s.Action.includes('s3:GetObject') && s.Action.includes('s3:PutObject')
      );
      expect(objectStatement).toBeDefined();
      expect(objectStatement.Resource).toContain(outputs.ApplicationDataBucketName);
    }, 30000);

    test('should have EC2 role with Secrets Manager access', async () => {
      if (skipIfNoDeployment()) return;

      const roleName = `SecureEC2Role-${environmentSuffix}`;
      const command = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'SecretsManagerAccess',
      });
      const response = await iamClient.send(command);

      expect(response.PolicyDocument).toBeDefined();
      const policy = JSON.parse(decodeURIComponent(response.PolicyDocument!));
      expect(policy.Statement[0].Action).toContain('secretsmanager:GetSecretValue');
      expect(policy.Statement[0].Resource).toContain('secure-app/database/password');
    }, 30000);

    test('should have instance profile with EC2 role', async () => {
      if (skipIfNoDeployment()) return;

      const roleName = `SecureEC2Role-${environmentSuffix}`;

      // Get instance profile from EC2 instance
      const instanceId = outputs.EC2InstanceId;
      const ec2Command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });
      const ec2Response = await ec2Client.send(ec2Command);
      const instance = ec2Response.Reservations![0].Instances![0];
      const profileArn = instance.IamInstanceProfile?.Arn;
      expect(profileArn).toBeDefined();
      const profileName = profileArn!.split('/').pop()!;

      const command = new GetInstanceProfileCommand({ InstanceProfileName: profileName });
      const response = await iamClient.send(command);

      expect(response.InstanceProfile).toBeDefined();
      expect(response.InstanceProfile!.Roles).toHaveLength(1);
      expect(response.InstanceProfile!.Roles![0].RoleName).toBe(roleName);
    }, 30000);
  });

  // ==================== CloudTrail Tests ====================
  describe('CloudTrail Audit Logging', () => {
    test('should have CloudTrail configured and logging', async () => {
      if (skipIfNoDeployment()) return;

      const trailArn = outputs.CloudTrailArn;
      expect(trailArn).toBeDefined();

      const trailName = trailArn.split('/').pop()!;
      const command = new GetTrailCommand({ Name: trailName });
      const response = await cloudTrailClient.send(command);

      expect(response.Trail).toBeDefined();
      const trail = response.Trail!;
      expect(trail.S3BucketName).toBe(outputs.S3LoggingBucketName);
      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.LogFileValidationEnabled).toBe(true);
      expect(trail.IncludeGlobalServiceEvents).toBe(true);
    }, 30000);

    test('should have CloudTrail actively logging', async () => {
      if (skipIfNoDeployment()) return;

      const trailArn = outputs.CloudTrailArn;
      const trailName = trailArn.split('/').pop()!;
      const command = new GetTrailStatusCommand({ Name: trailName });
      const response = await cloudTrailClient.send(command);

      expect(response.IsLogging).toBe(true);
    }, 30000);

    test('should have CloudTrail with proper event selectors', async () => {
      if (skipIfNoDeployment()) return;

      const trailArn = outputs.CloudTrailArn;
      const trailName = trailArn.split('/').pop()!;
      const command = new GetEventSelectorsCommand({ TrailName: trailName });
      const response = await cloudTrailClient.send(command);

      expect(response.EventSelectors).toHaveLength(1);
      const selector = response.EventSelectors![0];
      expect(selector.ReadWriteType).toBe('All');
      expect(selector.IncludeManagementEvents).toBe(true);
    }, 30000);

    test('should have CloudTrail log group in CloudWatch', async () => {
      if (skipIfNoDeployment()) return;

      // Get the log group name from CloudTrail
      const trailArn = outputs.CloudTrailArn;
      const trailName = trailArn.split('/').pop()!;
      const trailCommand = new GetTrailCommand({ Name: trailName });
      const trailResponse = await cloudTrailClient.send(trailCommand);
      const logGroupArn = trailResponse.Trail!.CloudWatchLogsLogGroupArn!;

      // Extract log group name from ARN (format: arn:aws:logs:region:account:log-group:LOG_GROUP_NAME:*)
      const logGroupName = logGroupArn.split(':log-group:')[1].split(':')[0];

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await cloudWatchLogsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(logGroupName);
      expect(logGroup.retentionInDays).toBe(90);
    }, 30000);
  });

  // ==================== Monitoring & Alerting Tests ====================
  describe('CloudWatch Monitoring and Alerting', () => {
    test('should have metric filter for unauthorized API calls', async () => {
      if (skipIfNoDeployment()) return;

      // Get the log group name from CloudTrail
      const trailArn = outputs.CloudTrailArn;
      const trailName = trailArn.split('/').pop()!;
      const trailCommand = new GetTrailCommand({ Name: trailName });
      const trailResponse = await cloudTrailClient.send(trailCommand);
      const logGroupArn = trailResponse.Trail!.CloudWatchLogsLogGroupArn!;
      const logGroupName = logGroupArn.split(':log-group:')[1].split(':')[0];

      const command = new DescribeMetricFiltersCommand({
        logGroupName: logGroupName,
        filterNamePrefix: 'UnauthorizedAPICalls',
      });
      const response = await cloudWatchLogsClient.send(command);

      expect(response.metricFilters).toBeDefined();
      expect(response.metricFilters!.length).toBeGreaterThan(0);
      const filter = response.metricFilters![0];
      expect(filter.filterName).toBe('UnauthorizedAPICalls');
      expect(filter.filterPattern).toContain('UnauthorizedOperation');
      expect(filter.filterPattern).toContain('AccessDenied');
      expect(filter.metricTransformations).toHaveLength(1);
      expect(filter.metricTransformations![0].metricName).toBe('UnauthorizedAPICalls');
      expect(filter.metricTransformations![0].metricNamespace).toBe('CloudTrailMetrics');
    }, 30000);

    test('should have metric filter for root account usage', async () => {
      if (skipIfNoDeployment()) return;

      // Get the log group name from CloudTrail
      const trailArn = outputs.CloudTrailArn;
      const trailName = trailArn.split('/').pop()!;
      const trailCommand = new GetTrailCommand({ Name: trailName });
      const trailResponse = await cloudTrailClient.send(trailCommand);
      const logGroupArn = trailResponse.Trail!.CloudWatchLogsLogGroupArn!;
      const logGroupName = logGroupArn.split(':log-group:')[1].split(':')[0];

      const command = new DescribeMetricFiltersCommand({
        logGroupName: logGroupName,
        filterNamePrefix: 'RootAccountUsage',
      });
      const response = await cloudWatchLogsClient.send(command);

      expect(response.metricFilters).toBeDefined();
      expect(response.metricFilters!.length).toBeGreaterThan(0);
      const filter = response.metricFilters![0];
      expect(filter.filterName).toBe('RootAccountUsage');
      expect(filter.filterPattern).toContain('userIdentity.type = "Root"');
      expect(filter.metricTransformations![0].metricName).toBe('RootAccountUsage');
    }, 30000);

    test('should have CloudWatch alarm for unauthorized API calls', async () => {
      if (skipIfNoDeployment()) return;

      const command = new DescribeAlarmsCommand({
        AlarmNames: ['UnauthorizedAPICalls'],
      });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toHaveLength(1);
      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmName).toBe('UnauthorizedAPICalls');
      expect(alarm.MetricName).toBe('UnauthorizedAPICalls');
      expect(alarm.Namespace).toBe('CloudTrailMetrics');
      expect(alarm.Threshold).toBe(1);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Period).toBe(300);
      expect(alarm.EvaluationPeriods).toBe(1);
      expect(alarm.AlarmActions).toHaveLength(1);
      expect(alarm.AlarmActions![0]).toBe(outputs.SNSTopicArn);
    }, 30000);

    test('should have CloudWatch alarm for root account usage', async () => {
      if (skipIfNoDeployment()) return;

      const command = new DescribeAlarmsCommand({
        AlarmNames: ['RootAccountUsage'],
      });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toHaveLength(1);
      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmName).toBe('RootAccountUsage');
      expect(alarm.MetricName).toBe('RootAccountUsage');
      expect(alarm.AlarmActions).toHaveLength(1);
      expect(alarm.AlarmActions![0]).toBe(outputs.SNSTopicArn);
    }, 30000);
  });

  // ==================== SNS Notification Tests ====================
  describe('SNS Notification System', () => {
    test('should have SNS topic created', async () => {
      if (skipIfNoDeployment()) return;

      const topicArn = outputs.SNSTopicArn;
      expect(topicArn).toBeDefined();

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.DisplayName).toBe('Security Alert Notifications');
    }, 30000);

    test('should have SNS topic with email subscription', async () => {
      if (skipIfNoDeployment()) return;

      const topicArn = outputs.SNSTopicArn;
      const command = new ListSubscriptionsByTopicCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Subscriptions).toBeDefined();
      expect(response.Subscriptions!.length).toBeGreaterThan(0);
      const subscription = response.Subscriptions![0];
      expect(subscription.Protocol).toBe('email');
      expect(subscription.Endpoint).toMatch(/@/); // Email format
    }, 30000);
  });

  // ==================== WAF Tests ====================
  describe('WAF Web Application Firewall', () => {
    test('should have WAF WebACL deployed', async () => {
      if (skipIfNoDeployment()) return;

      const webACLArn = outputs.WebACLArn;
      expect(webACLArn).toBeDefined();

      const webACLId = webACLArn.split('/').pop()!;
      const webACLName = webACLArn.split('/')[2];
      const command = new GetWebACLCommand({
        Name: webACLName,
        Scope: 'REGIONAL',
        Id: webACLId,
      });
      const response = await wafClient.send(command);

      expect(response.WebACL).toBeDefined();
      const webACL = response.WebACL!;
      expect(webACL.Name).toContain('SecureWebACL');
      expect(webACL.Rules).toHaveLength(4);
    }, 30000);

    test('should have WAF with rate limiting rule', async () => {
      if (skipIfNoDeployment()) return;

      const webACLArn = outputs.WebACLArn;
      const webACLId = webACLArn.split('/').pop()!;
      const webACLName = webACLArn.split('/')[2];
      const command = new GetWebACLCommand({
        Name: webACLName,
        Scope: 'REGIONAL',
        Id: webACLId,
      });
      const response = await wafClient.send(command);

      const rateRule = response.WebACL!.Rules!.find(r => r.Name === 'RateLimitRule');
      expect(rateRule).toBeDefined();
      expect(rateRule!.Priority).toBe(1);
      expect(rateRule!.Statement).toBeDefined();
      const rateBasedStatement = rateRule!.Statement?.RateBasedStatement;
      expect(rateBasedStatement).toBeDefined();
      expect(rateBasedStatement!.Limit).toBe(2000);
    }, 30000);

    test('should have WAF with AWS managed rule sets', async () => {
      if (skipIfNoDeployment()) return;

      const webACLArn = outputs.WebACLArn;
      const webACLId = webACLArn.split('/').pop()!;
      const webACLName = webACLArn.split('/')[2];
      const command = new GetWebACLCommand({
        Name: webACLName,
        Scope: 'REGIONAL',
        Id: webACLId,
      });
      const response = await wafClient.send(command);

      const rules = response.WebACL!.Rules!;

      // Check for common rule set
      const commonRule = rules.find(r => r.Name === 'AWSManagedRulesCommonRuleSet');
      expect(commonRule).toBeDefined();
      expect(commonRule!.Priority).toBe(2);

      // Check for bad inputs rule set
      const badInputsRule = rules.find(r => r.Name === 'AWSManagedRulesKnownBadInputsRuleSet');
      expect(badInputsRule).toBeDefined();
      expect(badInputsRule!.Priority).toBe(3);

      // Check for SQLi rule set
      const sqliRule = rules.find(r => r.Name === 'AWSManagedRulesSQLiRuleSet');
      expect(sqliRule).toBeDefined();
      expect(sqliRule!.Priority).toBe(4);
    }, 30000);

    test('should have WAF with CloudWatch metrics enabled', async () => {
      if (skipIfNoDeployment()) return;

      const webACLArn = outputs.WebACLArn;
      const webACLId = webACLArn.split('/').pop()!;
      const webACLName = webACLArn.split('/')[2];
      const command = new GetWebACLCommand({
        Name: webACLName,
        Scope: 'REGIONAL',
        Id: webACLId,
      });
      const response = await wafClient.send(command);

      const webACL = response.WebACL!;
      expect(webACL.VisibilityConfig!.CloudWatchMetricsEnabled).toBe(true);
      expect(webACL.VisibilityConfig!.SampledRequestsEnabled).toBe(true);

      // Check all rules have metrics enabled
      webACL.Rules!.forEach(rule => {
        expect(rule.VisibilityConfig!.CloudWatchMetricsEnabled).toBe(true);
        expect(rule.VisibilityConfig!.SampledRequestsEnabled).toBe(true);
      });
    }, 30000);

    test('should have WAF logging configured', async () => {
      if (skipIfNoDeployment()) return;

      const webACLArn = outputs.WebACLArn;
      const command = new GetLoggingConfigurationCommand({
        ResourceArn: webACLArn,
      });
      const response = await wafClient.send(command);

      expect(response.LoggingConfiguration).toBeDefined();
      expect(response.LoggingConfiguration!.LogDestinationConfigs).toHaveLength(1);
      const logDestination = response.LoggingConfiguration!.LogDestinationConfigs![0];
      expect(logDestination).toContain('log-group:aws-waf-logs-secure-infrastructure');
    }, 30000);

    test('should have WAF log group with retention', async () => {
      if (skipIfNoDeployment()) return;

      const expectedLogGroupName = `aws-waf-logs-secure-infrastructure-${environmentSuffix}`;
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: 'aws-waf-logs-secure-infrastructure',
      });
      const response = await cloudWatchLogsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(expectedLogGroupName);
      expect(logGroup.retentionInDays).toBe(30);
    }, 30000);
  });

  // ==================== Cross-Service Integration Tests ====================
  describe('Cross-Service Integration Scenarios', () => {
    test('End-to-End: EC2 can access database via security groups', async () => {
      if (skipIfNoDeployment()) return;

      // Get EC2 instance security group
      const instanceId = outputs.EC2InstanceId;
      const ec2Command = new DescribeInstancesCommand({ InstanceIds: [instanceId] });
      const ec2Response = await ec2Client.send(ec2Command);
      const instance = ec2Response.Reservations![0].Instances![0];
      const ec2SecurityGroupId = instance.SecurityGroups![0].GroupId!;

      // Get database security group
      const dbIdentifier = `secure-db-${environmentSuffix}`;
      const rdsCommand = new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier });
      const rdsResponse = await rdsClient.send(rdsCommand);
      const db = rdsResponse.DBInstances![0];
      const dbSecurityGroupId = db.VpcSecurityGroups![0].VpcSecurityGroupId!;

      // Verify database security group allows EC2 security group
      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [dbSecurityGroupId],
      });
      const sgResponse = await ec2Client.send(sgCommand);
      const dbSG = sgResponse.SecurityGroups![0];

      const ingressRule = dbSG.IpPermissions!.find(
        rule => rule.FromPort === 3306 && rule.ToPort === 3306
      );
      expect(ingressRule).toBeDefined();
      expect(ingressRule!.UserIdGroupPairs).toBeDefined();
      expect(ingressRule!.UserIdGroupPairs![0].GroupId).toBe(ec2SecurityGroupId);
    }, 30000);

    test('End-to-End: S3 encryption uses KMS key', async () => {
      if (skipIfNoDeployment()) return;

      const bucketName = outputs.ApplicationDataBucketName;
      const kmsKeyId = outputs.KMSKeyId;

      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
      expect(rule.ApplyServerSideEncryptionByDefault!.KMSMasterKeyID).toContain(kmsKeyId);
    }, 30000);

    test('End-to-End: RDS uses KMS key for encryption', async () => {
      if (skipIfNoDeployment()) return;

      const kmsKeyId = outputs.KMSKeyId;
      const dbIdentifier = `secure-db-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier });
      const response = await rdsClient.send(command);

      const db = response.DBInstances![0];
      expect(db.StorageEncrypted).toBe(true);
      expect(db.KmsKeyId).toContain(kmsKeyId);
    }, 30000);

    test('End-to-End: S3 bucket logs to logging bucket', async () => {
      if (skipIfNoDeployment()) return;

      const appBucketName = outputs.ApplicationDataBucketName;
      const loggingBucketName = outputs.S3LoggingBucketName;

      const command = new GetBucketLoggingCommand({ Bucket: appBucketName });
      const response = await s3Client.send(command);

      expect(response.LoggingEnabled).toBeDefined();
      expect(response.LoggingEnabled!.TargetBucket).toBe(loggingBucketName);
      expect(response.LoggingEnabled!.TargetPrefix).toBe('application-data/');
    }, 30000);

    test('End-to-End: CloudTrail logs to S3 and CloudWatch', async () => {
      if (skipIfNoDeployment()) return;

      const trailArn = outputs.CloudTrailArn;
      const s3BucketName = outputs.S3LoggingBucketName;
      const trailName = trailArn.split('/').pop()!;

      const command = new GetTrailCommand({ Name: trailName });
      const response = await cloudTrailClient.send(command);

      const trail = response.Trail!;
      expect(trail.S3BucketName).toBe(s3BucketName);
      expect(trail.CloudWatchLogsLogGroupArn).toBeDefined();
      expect(trail.CloudWatchLogsLogGroupArn).toContain(':log-group:');
    }, 30000);

    test('End-to-End: CloudWatch alarms notify SNS topic', async () => {
      if (skipIfNoDeployment()) return;

      const snsTopicArn = outputs.SNSTopicArn;

      // Check unauthorized API calls alarm
      const command1 = new DescribeAlarmsCommand({
        AlarmNames: ['UnauthorizedAPICalls'],
      });
      const response1 = await cloudWatchClient.send(command1);
      expect(response1.MetricAlarms![0].AlarmActions).toContain(snsTopicArn);

      // Check root account usage alarm
      const command2 = new DescribeAlarmsCommand({
        AlarmNames: ['RootAccountUsage'],
      });
      const response2 = await cloudWatchClient.send(command2);
      expect(response2.MetricAlarms![0].AlarmActions).toContain(snsTopicArn);
    }, 30000);

    test('End-to-End: EC2 IAM role allows access to S3 and Secrets Manager', async () => {
      if (skipIfNoDeployment()) return;

      const roleName = `SecureEC2Role-${environmentSuffix}`;

      // Check S3 access
      const s3Command = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'S3AccessPolicy',
      });
      const s3Response = await iamClient.send(s3Command);
      const s3Policy = JSON.parse(decodeURIComponent(s3Response.PolicyDocument!));
      expect(s3Policy.Statement.some((s: any) =>
        s.Action.includes('s3:GetObject') || s.Action.includes('s3:PutObject')
      )).toBe(true);

      // Check Secrets Manager access
      const secretsCommand = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'SecretsManagerAccess',
      });
      const secretsResponse = await iamClient.send(secretsCommand);
      const secretsPolicy = JSON.parse(decodeURIComponent(secretsResponse.PolicyDocument!));
      expect(secretsPolicy.Statement[0].Action).toContain('secretsmanager:GetSecretValue');
    }, 30000);

    test('End-to-End: Metric filters feed CloudWatch alarms', async () => {
      if (skipIfNoDeployment()) return;

      // Get the log group name from CloudTrail
      const trailArn = outputs.CloudTrailArn;
      const trailName = trailArn.split('/').pop()!;
      const trailCommand = new GetTrailCommand({ Name: trailName });
      const trailResponse = await cloudTrailClient.send(trailCommand);
      const logGroupArn = trailResponse.Trail!.CloudWatchLogsLogGroupArn!;
      const logGroupName = logGroupArn.split(':log-group:')[1].split(':')[0];

      // Get metric filter
      const filterCommand = new DescribeMetricFiltersCommand({
        logGroupName: logGroupName,
        filterNamePrefix: 'UnauthorizedAPICalls',
      });
      const filterResponse = await cloudWatchLogsClient.send(filterCommand);
      const filter = filterResponse.metricFilters![0];

      // Get corresponding alarm
      const alarmCommand = new DescribeAlarmsCommand({
        AlarmNames: ['UnauthorizedAPICalls'],
      });
      const alarmResponse = await cloudWatchClient.send(alarmCommand);
      const alarm = alarmResponse.MetricAlarms![0];

      // Verify they're connected
      expect(filter.metricTransformations![0].metricName).toBe(alarm.MetricName);
      expect(filter.metricTransformations![0].metricNamespace).toBe(alarm.Namespace);
    }, 30000);

    test('End-to-End: Database uses Secrets Manager for credentials', async () => {
      if (skipIfNoDeployment()) return;

      // Get secret value
      const secretArn = outputs.DatabaseSecretArn;
      const secretCommand = new GetSecretValueCommand({ SecretId: secretArn });
      const secretResponse = await secretsClient.send(secretCommand);
      const secret = JSON.parse(secretResponse.SecretString!);

      // Verify database is configured with same username
      const dbIdentifier = `secure-db-${environmentSuffix}`;
      const dbCommand = new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier });
      const dbResponse = await rdsClient.send(dbCommand);
      const db = dbResponse.DBInstances![0];

      expect(db.MasterUsername).toBe(secret.username);
    }, 30000);
  });

  // ==================== Security Compliance Tests ====================
  describe('Security Compliance Validation', () => {
    test('All encryption at rest is properly configured', async () => {
      if (skipIfNoDeployment()) return;

      // Check S3 buckets
      const appBucketCommand = new GetBucketEncryptionCommand({
        Bucket: outputs.ApplicationDataBucketName,
      });
      const appBucketResponse = await s3Client.send(appBucketCommand);
      expect(appBucketResponse.ServerSideEncryptionConfiguration).toBeDefined();

      const loggingBucketCommand = new GetBucketEncryptionCommand({
        Bucket: outputs.S3LoggingBucketName,
      });
      const loggingBucketResponse = await s3Client.send(loggingBucketCommand);
      expect(loggingBucketResponse.ServerSideEncryptionConfiguration).toBeDefined();

      // Check RDS
      const dbIdentifier = `secure-db-${environmentSuffix}`;
      const rdsCommand = new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier });
      const rdsResponse = await rdsClient.send(rdsCommand);
      expect(rdsResponse.DBInstances![0].StorageEncrypted).toBe(true);
    }, 30000);

    test('No public access to sensitive resources', async () => {
      if (skipIfNoDeployment()) return;

      // Check RDS is not public
      const dbIdentifier = `secure-db-${environmentSuffix}`;
      const rdsCommand = new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier });
      const rdsResponse = await rdsClient.send(rdsCommand);
      expect(rdsResponse.DBInstances![0].PubliclyAccessible).toBe(false);

      // Check S3 buckets block public access
      const appBucketCommand = new GetPublicAccessBlockCommand({
        Bucket: outputs.ApplicationDataBucketName,
      });
      const appBucketResponse = await s3Client.send(appBucketCommand);
      const appConfig = appBucketResponse.PublicAccessBlockConfiguration!;
      expect(appConfig.BlockPublicAcls).toBe(true);
      expect(appConfig.BlockPublicPolicy).toBe(true);

      const loggingBucketCommand = new GetPublicAccessBlockCommand({
        Bucket: outputs.S3LoggingBucketName,
      });
      const loggingBucketResponse = await s3Client.send(loggingBucketCommand);
      const loggingConfig = loggingBucketResponse.PublicAccessBlockConfiguration!;
      expect(loggingConfig.BlockPublicAcls).toBe(true);
      expect(loggingConfig.BlockPublicPolicy).toBe(true);
    }, 30000);

    test('Audit logging is enabled for all services', async () => {
      if (skipIfNoDeployment()) return;

      // CloudTrail is logging
      const trailArn = outputs.CloudTrailArn;
      const trailName = trailArn.split('/').pop()!;
      const trailStatusCommand = new GetTrailStatusCommand({ Name: trailName });
      const trailStatusResponse = await cloudTrailClient.send(trailStatusCommand);
      expect(trailStatusResponse.IsLogging).toBe(true);

      // RDS logs to CloudWatch
      const dbIdentifier = `secure-db-${environmentSuffix}`;
      const rdsCommand = new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier });
      const rdsResponse = await rdsClient.send(rdsCommand);
      expect(rdsResponse.DBInstances![0].EnabledCloudwatchLogsExports).toBeDefined();
      expect(rdsResponse.DBInstances![0].EnabledCloudwatchLogsExports!.length).toBeGreaterThan(0);

      // S3 access logging is configured
      const s3LoggingCommand = new GetBucketLoggingCommand({
        Bucket: outputs.ApplicationDataBucketName,
      });
      const s3LoggingResponse = await s3Client.send(s3LoggingCommand);
      expect(s3LoggingResponse.LoggingEnabled).toBeDefined();
    }, 30000);

    test('Network isolation is properly configured', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
        ],
      });
      const response = await ec2Client.send(command);

      const dbSG = response.SecurityGroups!.find(sg =>
        sg.GroupName?.includes('DatabaseSecurityGroup')
      );
      expect(dbSG).toBeDefined();
      // Database should only allow traffic from application security group
      expect(dbSG!.IpPermissions).toHaveLength(1);
      expect(dbSG!.IpPermissions![0].UserIdGroupPairs).toHaveLength(1);
      expect(dbSG!.IpPermissions![0].FromPort).toBe(3306);
    }, 30000);

    test('Backup and retention policies are configured', async () => {
      if (skipIfNoDeployment()) return;

      // RDS backups
      const dbIdentifier = `secure-db-${environmentSuffix}`;
      const rdsCommand = new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier });
      const rdsResponse = await rdsClient.send(rdsCommand);
      expect(rdsResponse.DBInstances![0].BackupRetentionPeriod).toBeGreaterThan(0);

      // S3 lifecycle policies
      const s3Command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.S3LoggingBucketName,
      });
      const s3Response = await s3Client.send(s3Command);
      expect(s3Response.Rules).toBeDefined();
      expect(s3Response.Rules!.length).toBeGreaterThan(0);
    }, 30000);
  });
});
