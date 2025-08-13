/**
 * test/TapStack.unit.test.ts
 *
 * Comprehensive Jest tests for the "Secure AWS Environment - Production-Ready Deployment"
 * CloudFormation template (TapStack.json only).
 */

import fs from 'fs';
import path from 'path';

/* If the CI pipeline passes ENVIRONMENT, use it; else default to prod */
const environment = process.env.ENVIRONMENT || 'prod';

describe('Secure Environment CloudFormation Template', () => {
  let template: any;

  /* -------------------------------------------------------------------- */
  /* Load the template (JSON only) once for all test blocks               */
  /* -------------------------------------------------------------------- */
  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}. Please ensure TapStack.json exists.`);
    }
    
    try {
      const raw = fs.readFileSync(templatePath, 'utf8');
      template = JSON.parse(raw);
    } catch (error: any) {
      throw new Error(`Failed to parse template JSON: ${error.message}`);
    }
  });

  /* -------------------------------------------------------------------- */
  /* Basic smoke tests                                                     */
  /* -------------------------------------------------------------------- */
  describe('Basic Template Checks', () => {
    test('template is loaded successfully', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('description matches expected value', () => {
      expect(template.Description).toBe(
        'Secure AWS Environment - Production-Ready Deployment with Comprehensive Security Controls'
      );
    });

    test('AWSTemplateFormatVersion is correct', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('template has all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  /* -------------------------------------------------------------------- */
  /* Parameter validation                                                  */
  /* -------------------------------------------------------------------- */
  describe('Parameters', () => {
    test('Environment parameter has correct schema', () => {
      const p = template.Parameters.Environment;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('prod');
      expect(p.Description).toBe('Environment name for resource tagging and configuration');
    });

    test('DBUsername parameter has correct constraints', () => {
      const p = template.Parameters.DBUsername;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('admin');
      expect(p.MinLength).toBe(1);
      expect(p.MaxLength).toBe(16);
      expect(p.AllowedPattern).toBe('^[a-zA-Z][a-zA-Z0-9]*$');
      expect(p.ConstraintDescription).toBe('Must begin with a letter and contain only alphanumeric characters');
    });

    test('VpcCidrBlock parameter has correct validation', () => {
      const p = template.Parameters.VpcCidrBlock;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('10.0.0.0/16');
      expect(p.AllowedPattern).toBe('^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$');
    });

    test('CloudTrailLogRetentionDays parameter has correct constraints', () => {
      const p = template.Parameters.CloudTrailLogRetentionDays;
      expect(p.Type).toBe('Number');
      expect(p.Default).toBe(90);
      expect(p.MinValue).toBe(1);
      expect(p.MaxValue).toBe(3653);
    });

    test('template defines exactly 4 parameters', () => {
      expect(Object.keys(template.Parameters)).toHaveLength(4);
    });
  });

  /* -------------------------------------------------------------------- */
  /* Conditions validation                                                 */
  /* -------------------------------------------------------------------- */
  describe('Conditions', () => {
    test('IsProduction condition exists and has correct logic', () => {
      const condition = template.Conditions.IsProduction;
      expect(condition).toEqual({
        'Fn::Equals': [
          { 'Ref': 'Environment' },
          'prod'
        ]
      });
    });

    test('template defines exactly 1 condition', () => {
      expect(Object.keys(template.Conditions)).toHaveLength(1);
    });
  });

  /* -------------------------------------------------------------------- */
  /* KMS & Encryption Tests                                               */
  /* -------------------------------------------------------------------- */
  describe('KMS & Encryption', () => {
    test('MasterEncryptionKey has comprehensive key policy', () => {
      const key = template.Resources.MasterEncryptionKey;
      expect(key.Type).toBe('AWS::KMS::Key');
      
      const statements = key.Properties.KeyPolicy.Statement;
      expect(statements).toHaveLength(4);
      
      // Check for IAM root permissions
      const rootStatement = statements.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Principal.AWS).toEqual({
        'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root'
      });

      // Check for service permissions
      const services = ['cloudtrail.amazonaws.com', 'logs.amazonaws.com', 's3.amazonaws.com'];
      services.forEach(service => {
        const serviceStatement = statements.find((s: any) => 
          s.Principal && s.Principal.Service === service
        );
        expect(serviceStatement).toBeDefined();
      });
    });

    test('MasterKeyAlias is properly configured', () => {
      const alias = template.Resources.MasterKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/${AWS::StackName}-master-key'
      });
      expect(alias.Properties.TargetKeyId).toEqual({ 'Ref': 'MasterEncryptionKey' });
    });
  });

  /* -------------------------------------------------------------------- */
  /* VPC & Networking Tests                                               */
  /* -------------------------------------------------------------------- */
  describe('VPC & Networking', () => {
    test('VPC has correct configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ 'Ref': 'VpcCidrBlock' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('public subnets are configured correctly with dynamic CIDR', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toEqual({
        'Fn::Select': [0, { 'Fn::Cidr': [{ 'Ref': 'VpcCidrBlock' }, 6, 8] }]
      });
      expect(subnet2.Properties.CidrBlock).toEqual({
        'Fn::Select': [1, { 'Fn::Cidr': [{ 'Ref': 'VpcCidrBlock' }, 6, 8] }]
      });
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      
      // Check AZ selection
      expect(subnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
    });

    test('private subnets are configured correctly with dynamic CIDR', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toEqual({
        'Fn::Select': [2, { 'Fn::Cidr': [{ 'Ref': 'VpcCidrBlock' }, 6, 8] }]
      });
      expect(subnet2.Properties.CidrBlock).toEqual({
        'Fn::Select': [3, { 'Fn::Cidr': [{ 'Ref': 'VpcCidrBlock' }, 6, 8] }]
      });
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('Internet Gateway is properly configured', () => {
      const igw = template.Resources.InternetGateway;
      const attachment = template.Resources.InternetGatewayAttachment;
      
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('NAT Gateway has EIP and correct subnet placement', () => {
      const natGw1 = template.Resources.NatGateway1;
      const eip1 = template.Resources.NatGateway1EIP;

      expect(eip1.Type).toBe('AWS::EC2::EIP');
      expect(eip1.Properties.Domain).toBe('vpc');
      expect(eip1.DependsOn).toBe('InternetGatewayAttachment');

      expect(natGw1.Type).toBe('AWS::EC2::NatGateway');
      expect(natGw1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(natGw1.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NatGateway1EIP', 'AllocationId']
      });
    });

    test('route tables are properly configured', () => {
      const publicRoute = template.Resources.DefaultPublicRoute;
      const privateRoute = template.Resources.DefaultPrivateRoute;

      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(publicRoute.DependsOn).toBe('InternetGatewayAttachment');

      expect(privateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway1' });
    });

    test('route table associations are correct', () => {
      const pubAssoc1 = template.Resources.PublicSubnet1RouteTableAssociation;
      const pubAssoc2 = template.Resources.PublicSubnet2RouteTableAssociation;
      const privAssoc1 = template.Resources.PrivateSubnet1RouteTableAssociation;
      const privAssoc2 = template.Resources.PrivateSubnet2RouteTableAssociation;

      expect(pubAssoc1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(pubAssoc2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
      expect(privAssoc1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(privAssoc2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
    });
  });

  /* -------------------------------------------------------------------- */
  /* Security Groups & Network ACLs Tests                                */
  /* -------------------------------------------------------------------- */
  describe('Security Groups & Network ACLs', () => {
    test('Database security group restricts access to private subnets only', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup;
      const ingress = dbSG.Properties.SecurityGroupIngress;
      
      expect(ingress).toHaveLength(2);
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
      expect(ingress[0].IpProtocol).toBe('tcp');
      expect(ingress[0].CidrIp).toEqual({
        'Fn::Select': [2, { 'Fn::Cidr': [{ 'Ref': 'VpcCidrBlock' }, 6, 8] }]
      });
      expect(ingress[1].CidrIp).toEqual({
        'Fn::Select': [3, { 'Fn::Cidr': [{ 'Ref': 'VpcCidrBlock' }, 6, 8] }]
      });
    });

    test('security groups have proper descriptions', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup;
      expect(dbSG.Properties.GroupDescription).toBe('Security group for RDS database - allows access from private subnets only');
    });

    test('Private Network ACL is properly configured', () => {
      const nacl = template.Resources.PrivateNetworkACL;
      const inboundRule = template.Resources.PrivateNetworkAclEntryInbound;
      const outboundRule = template.Resources.PrivateNetworkAclEntryOutbound;

      expect(nacl.Type).toBe('AWS::EC2::NetworkAcl');
      expect(inboundRule.Properties.NetworkAclId).toEqual({ Ref: 'PrivateNetworkACL' });
      expect(inboundRule.Properties.RuleAction).toBe('allow');
      expect(inboundRule.Properties.CidrBlock).toEqual({ Ref: 'VpcCidrBlock' });
      
      expect(outboundRule.Properties.Egress).toBe(true);
      expect(outboundRule.Properties.CidrBlock).toBe('0.0.0.0/0');
    });
  });

  /* -------------------------------------------------------------------- */
  /* IAM Roles & Policies Tests                                          */
  /* -------------------------------------------------------------------- */
  describe('IAM Roles & Policies', () => {
    test('RDSMonitoringRole has correct assume role policy', () => {
      const role = template.Resources.RDSMonitoringRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('monitoring.rds.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('RDSMonitoringRole has required managed policies', () => {
      const role = template.Resources.RDSMonitoringRole;
      const managedPolicies = role.Properties.ManagedPolicyArns;
      
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole');
    });

    test('CloudTrailRole has correct assume role policy', () => {
      const role = template.Resources.CloudTrailRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('cloudtrail.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('CloudTrailRole has inline policies for S3 and CloudWatch', () => {
      const role = template.Resources.CloudTrailRole;
      const policies = role.Properties.Policies;
      
      const s3Policy = policies.find((p: any) => p.PolicyName === 'CloudTrailS3Policy');
      expect(s3Policy).toBeDefined();
      
      const statements = s3Policy.PolicyDocument.Statement;
      const s3Statement = statements.find((s: any) => 
        s.Action.includes('s3:PutObject')
      );
      const logsStatement = statements.find((s: any) => 
        s.Action.includes('logs:CreateLogStream')
      );
      
      expect(s3Statement).toBeDefined();
      expect(logsStatement).toBeDefined();
    });

    test('OperationsGroup has read-only policies', () => {
      const group = template.Resources.OperationsGroup;
      expect(group.Type).toBe('AWS::IAM::Group');
      
      const policy = group.Properties.Policies[0];
      expect(policy.PolicyName).toBe('ReadOnlyAccess');
      
      const actions = policy.PolicyDocument.Statement[0].Action;
      expect(actions).toContain('ec2:Describe*');
      expect(actions).toContain('rds:Describe*');
      expect(actions).toContain('cloudtrail:DescribeTrails');
    });
  });

  /* -------------------------------------------------------------------- */
  /* S3 Buckets Tests                                                    */
  /* -------------------------------------------------------------------- */
  describe('S3 Buckets', () => {
    test('SecureS3Bucket has proper encryption configuration', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({
        Ref: 'MasterEncryptionKey'
      });
      expect(encryption.BucketKeyEnabled).toBe(true);
    });

    test('SecureS3Bucket blocks all public access', () => {
      const bucket = template.Resources.SecureS3Bucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('SecureS3Bucket has versioning enabled', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('SecureS3BucketPolicy denies insecure connections and unencrypted uploads', () => {
      const policy = template.Resources.SecureS3BucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      
      const statements = policy.Properties.PolicyDocument.Statement;
      const secureTransportStatement = statements.find((s: any) => s.Sid === 'DenyInsecureConnections');
      const encryptionStatement = statements.find((s: any) => s.Sid === 'DenyUnencryptedObjectUploads');
      
      expect(secureTransportStatement.Effect).toBe('Deny');
      expect(secureTransportStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
      
      expect(encryptionStatement.Effect).toBe('Deny');
      expect(encryptionStatement.Action).toBe('s3:PutObject');
    });

    test('CloudTrailS3Bucket has proper configuration', () => {
      const bucket = template.Resources.CloudTrailS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({
        Ref: 'MasterEncryptionKey'
      });
      
      const lifecycle = bucket.Properties.LifecycleConfiguration.Rules[0];
      expect(lifecycle.Id).toBe('CloudTrailLogRetention');
      expect(lifecycle.ExpirationInDays).toEqual({
        Ref: 'CloudTrailLogRetentionDays'
      });
    });

    test('CloudTrailS3BucketPolicy allows CloudTrail access', () => {
      const policy = template.Resources.CloudTrailS3BucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      
      const aclStatement = statements.find((s: any) => s.Sid === 'AWSCloudTrailAclCheck');
      const writeStatement = statements.find((s: any) => s.Sid === 'AWSCloudTrailWrite');
      
      expect(aclStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
      expect(aclStatement.Action).toBe('s3:GetBucketAcl');
      
      expect(writeStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
      expect(writeStatement.Action).toBe('s3:PutObject');
    });
  });

  /* -------------------------------------------------------------------- */
  /* Database Tests                                                       */
  /* -------------------------------------------------------------------- */
  describe('Database Infrastructure', () => {
    test('DatabaseSubnetGroup uses private subnets only', () => {
      const subnetGroup = template.Resources.DatabaseSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' }
      ]);
    });

    test('DatabaseSecret uses KMS encryption', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.KmsKeyId).toEqual({ Ref: 'MasterEncryptionKey' });
      
      const generateString = secret.Properties.GenerateSecretString;
      expect(generateString.PasswordLength).toBe(32);
      expect(generateString.ExcludeCharacters).toBe('"@/\\');
    });

    test('SecureDatabase has proper configuration', () => {
      const db = template.Resources.SecureDatabase;
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.DBInstanceClass).toBe('db.t3.micro');
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.EngineVersion).toBe('8.0.42');
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.AutoMinorVersionUpgrade).toBe(true);
    });

    test('SecureDatabase has proper deletion policies', () => {
      const db = template.Resources.SecureDatabase;
      expect(db.DeletionPolicy).toBe('Snapshot');
      expect(db.UpdateReplacePolicy).toBe('Snapshot');
    });

    test('SecureDatabase uses conditional MultiAZ and DeletionProtection', () => {
      const db = template.Resources.SecureDatabase;
      expect(db.Properties.MultiAZ).toEqual({
        'Fn::If': ['IsProduction', true, false]
      });
      expect(db.Properties.DeletionProtection).toEqual({
        'Fn::If': ['IsProduction', true, false]
      });
    });

    test('SecureDatabase uses Secrets Manager for password', () => {
      const db = template.Resources.SecureDatabase;
      expect(db.Properties.MasterUserPassword).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}'
      });
    });

    test('SecureDatabase has monitoring configuration', () => {
      const db = template.Resources.SecureDatabase;
      expect(db.Properties.MonitoringInterval).toBe(60);
      expect(db.Properties.MonitoringRoleArn).toEqual({
        'Fn::GetAtt': ['RDSMonitoringRole', 'Arn']
      });
      expect(db.Properties.EnablePerformanceInsights).toBe(false);
    });
  });

  /* -------------------------------------------------------------------- */
  /* CloudTrail Tests                                                     */
  /* -------------------------------------------------------------------- */
  describe('CloudTrail', () => {
    test('CloudTrail has proper configuration', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(false);
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
      expect(trail.Properties.KMSKeyId).toEqual({ Ref: 'MasterEncryptionKey' });
    });

    test('CloudTrail has proper S3 configuration', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.S3BucketName).toEqual({ Ref: 'CloudTrailS3Bucket' });
      expect(trail.Properties.S3KeyPrefix).toBe('cloudtrail-logs');
    });

    test('CloudTrail has EventSelectors for S3 data events', () => {
      const trail = template.Resources.CloudTrail;
      const eventSelectors = trail.Properties.EventSelectors[0];
      
      expect(eventSelectors.ReadWriteType).toBe('All');
      expect(eventSelectors.IncludeManagementEvents).toBe(true);
      
      const dataResource = eventSelectors.DataResources[0];
      expect(dataResource.Type).toBe('AWS::S3::Object');
      expect(dataResource.Values[0]).toEqual({
        'Fn::Sub': 'arn:aws:s3:::${SecureS3Bucket}/*'
      });
    });

    test('CloudTrail has CloudWatch Logs integration', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.CloudWatchLogsLogGroupArn).toEqual({
        'Fn::GetAtt': ['CloudTrailLogGroup', 'Arn']
      });
      expect(trail.Properties.CloudWatchLogsRoleArn).toEqual({
        'Fn::GetAtt': ['CloudTrailRole', 'Arn']
      });
    });

    test('CloudTrail depends on S3BucketPolicy', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.DependsOn).toBe('CloudTrailS3BucketPolicy');
    });
  });

  /* -------------------------------------------------------------------- */
  /* CloudWatch Tests                                                     */
  /* -------------------------------------------------------------------- */
  describe('CloudWatch', () => {
    test('Log groups use KMS encryption', () => {
      const cloudTrailLogGroup = template.Resources.CloudTrailLogGroup;
      const s3LogGroup = template.Resources.S3LogGroup;
      const databaseLogGroup = template.Resources.DatabaseLogGroup;

      [cloudTrailLogGroup, s3LogGroup, databaseLogGroup].forEach(logGroup => {
        expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
        expect(logGroup.Properties.KmsKeyId).toEqual({
          'Fn::GetAtt': ['MasterEncryptionKey', 'Arn']
        });
      });
    });

    test('Log groups have conditional retention periods', () => {
      const cloudTrailLogGroup = template.Resources.CloudTrailLogGroup;
      expect(cloudTrailLogGroup.Properties.RetentionInDays).toEqual({
        'Fn::If': ['IsProduction', 90, 30]
      });
    });

    test('CloudWatch alarms are properly configured', () => {
      const cpuAlarm = template.Resources.DatabaseCPUAlarm;
      const connectionAlarm = template.Resources.DatabaseConnectionAlarm;

      expect(cpuAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(cpuAlarm.Properties.MetricName).toBe('CPUUtilization');
      expect(cpuAlarm.Properties.Namespace).toBe('AWS/RDS');
      expect(cpuAlarm.Properties.Threshold).toBe(80);

      expect(connectionAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(connectionAlarm.Properties.MetricName).toBe('DatabaseConnections');
      expect(connectionAlarm.Properties.Namespace).toBe('AWS/RDS');
      expect(connectionAlarm.Properties.Threshold).toBe(15);
    });

    test('Database alarms have proper dimensions', () => {
      const cpuAlarm = template.Resources.DatabaseCPUAlarm;
      const connectionAlarm = template.Resources.DatabaseConnectionAlarm;

      expect(cpuAlarm.Properties.Dimensions[0].Name).toBe('DBInstanceIdentifier');
      expect(cpuAlarm.Properties.Dimensions[0].Value).toEqual({ Ref: 'SecureDatabase' });
      
      expect(connectionAlarm.Properties.Dimensions[0].Name).toBe('DBInstanceIdentifier');
      expect(connectionAlarm.Properties.Dimensions[0].Value).toEqual({ Ref: 'SecureDatabase' });
    });
  });

  /* -------------------------------------------------------------------- */
  /* Outputs Tests                                                        */
  /* -------------------------------------------------------------------- */
  describe('Outputs', () => {
    test('VPCId output is properly configured', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('ID of the secure VPC');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPC-ID'
      });
    });

    test('subnet outputs are properly configured', () => {
      const publicOutput = template.Outputs.PublicSubnetIds;
      const privateOutput = template.Outputs.PrivateSubnetIds;
      
      expect(publicOutput.Value).toEqual({
        'Fn::Join': [',', [
          { Ref: 'PublicSubnet1' },
          { Ref: 'PublicSubnet2' }
        ]]
      });
      expect(privateOutput.Value).toEqual({
        'Fn::Join': [',', [
          { Ref: 'PrivateSubnet1' },
          { Ref: 'PrivateSubnet2' }
        ]]
      });
    });

    test('Database and S3 outputs are properly configured', () => {
      const dbOutput = template.Outputs.DatabaseEndpoint;
      const s3Output = template.Outputs.S3BucketName;
      
      expect(dbOutput.Value).toEqual({
        'Fn::GetAtt': ['SecureDatabase', 'Endpoint.Address']
      });
      expect(s3Output.Value).toEqual({ Ref: 'SecureS3Bucket' });
    });

    test('Security-related outputs are included', () => {
      const kmsOutput = template.Outputs.KMSKeyId;
      const cloudTrailOutput = template.Outputs.CloudTrailArn;
      
      expect(kmsOutput.Value).toEqual({ Ref: 'MasterEncryptionKey' });
      expect(cloudTrailOutput.Value).toEqual({
        'Fn::GetAtt': ['CloudTrail', 'Arn']
      });
    });

    test('CloudTrail bucket output is included', () => {
      const bucketOutput = template.Outputs.CloudTrailS3Bucket;
      expect(bucketOutput.Value).toEqual({ Ref: 'CloudTrailS3Bucket' });
    });

    test('all outputs have proper export names', () => {
      const outputKeys = Object.keys(template.Outputs);
      outputKeys.forEach(key => {
        const output = template.Outputs[key];
        if (output.Export) {
          expect(output.Export.Name).toEqual({
            'Fn::Sub': expect.stringMatching(/^\$\{AWS::StackName\}-.+$/)
          });
        }
      });
    });

    test('template defines exactly 8 outputs', () => {
      expect(Object.keys(template.Outputs)).toHaveLength(8);
    });
  });

  /* -------------------------------------------------------------------- */
  /* Resource Tagging Tests                                               */
  /* -------------------------------------------------------------------- */
  describe('Resource Tagging', () => {
    test('key resources have Environment tags', () => {
      const resourcesWithTags = [
        'MasterEncryptionKey', 'VPC', 'PublicSubnet1', 'PrivateSubnet1',
        'DatabaseSecurityGroup', 'SecureS3Bucket', 'SecureDatabase', 'CloudTrail'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags || [];
        const envTag = tags.find((tag: any) => tag.Key === 'Environment');
        expect(envTag).toBeDefined();
        expect(envTag.Value).toEqual({ Ref: 'Environment' });
      });
    });

    test('key resources have Name tags with stack reference', () => {
      const resourcesWithNameTags = [
        'MasterEncryptionKey', 'VPC', 'InternetGateway', 'PublicSubnet1',
        'PrivateSubnet1', 'DatabaseSecurityGroup', 'SecureS3Bucket'
      ];

      resourcesWithNameTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags || [];
        const nameTag = tags.find((tag: any) => tag.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag.Value).toEqual({
          'Fn::Sub': expect.stringMatching(/^\$\{AWS::StackName\}-.+$/)
        });
      });
    });
  });

  /* -------------------------------------------------------------------- */
  /* Security Compliance Tests                                            */
  /* -------------------------------------------------------------------- */
  describe('Security Compliance', () => {
    test('all storage resources use encryption', () => {
      const s3Bucket = template.Resources.SecureS3Bucket;
      const cloudTrailBucket = template.Resources.CloudTrailS3Bucket;
      const database = template.Resources.SecureDatabase;
      const logGroups = [
        template.Resources.CloudTrailLogGroup,
        template.Resources.S3LogGroup,
        template.Resources.DatabaseLogGroup
      ];

      // S3 encryption
      expect(s3Bucket.Properties.BucketEncryption).toBeDefined();
      expect(cloudTrailBucket.Properties.BucketEncryption).toBeDefined();
      
      // RDS encryption
      expect(database.Properties.StorageEncrypted).toBe(true);
      expect(database.Properties.KmsKeyId).toBeDefined();
      
      // CloudWatch Logs encryption
      logGroups.forEach(logGroup => {
        expect(logGroup.Properties.KmsKeyId).toBeDefined();
      });
    });

    test('database follows security best practices', () => {
      const db = template.Resources.SecureDatabase;
      const dbSG = template.Resources.DatabaseSecurityGroup;

      // Database in private subnet
      expect(db.Properties.DBSubnetGroupName).toEqual({ Ref: 'DatabaseSubnetGroup' });
      
      // Database security group restricts access
      const ingress = dbSG.Properties.SecurityGroupIngress;
      ingress.forEach((rule: any) => {
        expect(rule.FromPort).toBe(3306);
        expect(rule.CidrIp).toBeDefined(); // Should be from private subnets
      });
    });

    test('S3 buckets follow security best practices', () => {
      const bucket = template.Resources.SecureS3Bucket;
      const policy = template.Resources.SecureS3BucketPolicy;

      // Public access blocked
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);

      // Secure transport required
      const statements = policy.Properties.PolicyDocument.Statement;
      const secureTransportStatement = statements.find((s: any) => 
        s.Condition && s.Condition.Bool && s.Condition.Bool['aws:SecureTransport'] === 'false'
      );
      expect(secureTransportStatement.Effect).toBe('Deny');
    });

    test('IAM roles follow least privilege principle', () => {
      const rdsRole = template.Resources.RDSMonitoringRole;
      const cloudTrailRole = template.Resources.CloudTrailRole;
      const opsGroup = template.Resources.OperationsGroup;

      // RDS role only has monitoring permissions
      expect(rdsRole.Properties.ManagedPolicyArns).toEqual([
        'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      ]);

      // CloudTrail role only has S3 and CloudWatch permissions
      const cloudTrailPolicy = cloudTrailRole.Properties.Policies[0];
      const statements = cloudTrailPolicy.PolicyDocument.Statement;
      statements.forEach((statement: any) => {
        const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
        actions.forEach((action: string) => {
          expect(action.startsWith('s3:') || action.startsWith('logs:')).toBe(true);
        });
      });

      // Operations group only has read permissions
      const opsPolicy = opsGroup.Properties.Policies[0];
      const opsActions = opsPolicy.PolicyDocument.Statement[0].Action;
      opsActions.forEach((action: string) => {
        expect(action.includes('Describe') || action.includes('List') || action.includes('Get')).toBe(true);
      });
    });
  });

  /* -------------------------------------------------------------------- */
  /* CloudTrail Comprehensive Tests                                       */
  /* -------------------------------------------------------------------- */
  describe('CloudTrail Comprehensive Configuration', () => {
    test('CloudTrail has all required security features', () => {
      const trail = template.Resources.CloudTrail;
      
      // Encryption
      expect(trail.Properties.KMSKeyId).toBeDefined();
      
      // Log file validation
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
      
      // Regional trail (not global)
      expect(trail.Properties.IsMultiRegionTrail).toBe(false);
      
      // Global service events included
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
    });

    test('CloudTrail logs both management and data events', () => {
      const trail = template.Resources.CloudTrail;
      const eventSelectors = trail.Properties.EventSelectors[0];
      
      expect(eventSelectors.ReadWriteType).toBe('All');
      expect(eventSelectors.IncludeManagementEvents).toBe(true);
      expect(eventSelectors.DataResources).toBeDefined();
      expect(eventSelectors.DataResources).toHaveLength(1);
    });
  });
});
