import fs from 'fs';
import path from 'path';

describe('NovaCart Secure Foundation CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON template (converted from YAML)
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found at: ${templatePath}`);
    }
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // KMS KEY VALIDATION
  describe('KMS Keys and Encryption', () => {
    test('should have MasterKMSKey resource', () => {
      expect(template.Resources.MasterKMSKey).toBeDefined();
      const key = template.Resources.MasterKMSKey;
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('MasterKMSKey should have proper key policy statements', () => {
      const key = template.Resources.MasterKMSKey;
      const statements = key.Properties.KeyPolicy.Statement;

      // Should have admin permissions
      const adminStatement = statements.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      expect(adminStatement).toBeDefined();
      expect(adminStatement.Effect).toBe('Allow');
      expect(adminStatement.Action).toBe('kms:*');

      // Should have CloudTrail permissions
      const cloudtrailEncrypt = statements.find((s: any) => s.Sid === 'Allow CloudTrail to encrypt logs');
      expect(cloudtrailEncrypt).toBeDefined();
      expect(cloudtrailEncrypt.Principal.Service).toBe('cloudtrail.amazonaws.com');

      // Should have CloudWatch Logs permissions
      const cloudwatchLogs = statements.find((s: any) => s.Sid === 'Allow CloudWatch Logs');
      expect(cloudwatchLogs).toBeDefined();
      expect(cloudwatchLogs.Principal.Service).toBeDefined();

      // Should have S3 permissions
      const s3Statement = statements.find((s: any) => s.Sid === 'Allow S3 service');
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Principal.Service).toBe('s3.amazonaws.com');
    });

    test('should have MasterKMSKeyAlias', () => {
      expect(template.Resources.MasterKMSKeyAlias).toBeDefined();
      const alias = template.Resources.MasterKMSKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'MasterKMSKey' });
      expect(alias.Properties.AliasName['Fn::Sub']).toContain('master-key');
    });
  });

  // VPC AND NETWORK VALIDATION
  describe('VPC and Network Configuration', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have InternetGateway and attachment', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.AttachGateway).toBeDefined();
      const attach = template.Resources.AttachGateway;
      expect(attach.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attach.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attach.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have public and private subnets in different AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();

      // Verify public subnets don't auto-assign public IPs
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);

      // Verify subnets reference VPC
      expect(template.Resources.PublicSubnet1.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.PrivateSubnet1.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should have route tables and associations', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();

      const route = template.Resources.PublicRoute;
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(route.DependsOn).toContain('AttachGateway');
    });
  });

  // SECURITY GROUPS VALIDATION
  describe('Security Groups', () => {
    test('should have WebServerSecurityGroup with minimal rules', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      expect(ingress[0].IpProtocol).toBe('tcp');
      expect(ingress[0].FromPort).toBe(80);
      expect(ingress[0].ToPort).toBe(80);
      expect(ingress[0].CidrIp).toBe('10.0.0.0/16'); // VPC only

      expect(ingress[1].FromPort).toBe(22);
      expect(ingress[1].CidrIp).toEqual({ Ref: 'AllowedSSHIP' }); // Restricted SSH

      const egress = sg.Properties.SecurityGroupEgress;
      expect(egress[0].FromPort).toBe(443); // HTTPS outbound
      expect(egress[1].FromPort).toBe(3306); // MySQL to RDS
    });

    test('should have DatabaseSecurityGroup with VPC-only access', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].CidrIp).toBe('10.0.0.0/16'); // VPC only
      expect(sg.Properties.SecurityGroupEgress).toBeUndefined(); // No egress needed
    });
  });

  // IAM ROLES AND POLICIES VALIDATION
  describe('IAM Roles and Permission Boundaries', () => {
    test('should have PermissionBoundaryPolicy', () => {
      const policy = template.Resources.PermissionBoundaryPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::IAM::ManagedPolicy');

      const statements = policy.Properties.PolicyDocument.Statement;
      expect(statements.length).toBeGreaterThan(0);

      // Should deny IAM operations
      const denyStatement = statements.find((s: any) => s.Effect === 'Deny');
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Action).toContain('iam:*');
    });

    test('should have EC2InstanceRole with permission boundary', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.PermissionsBoundary).toEqual({ Ref: 'PermissionBoundaryPolicy' });

      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');

      // Should have CloudWatch Agent policy
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
    });

    test('should have EC2InstanceProfile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toContainEqual({ Ref: 'EC2InstanceRole' });
    });

    test('should have LambdaExecutionRole with DLQ permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Properties.PermissionsBoundary).toEqual({ Ref: 'PermissionBoundaryPolicy' });

      const policies = role.Properties.Policies;
      const lambdaPolicy = policies.find((p: any) => p.PolicyName === 'LambdaBasicPermissions');
      expect(lambdaPolicy).toBeDefined();

      const sqsStatement = lambdaPolicy.PolicyDocument.Statement.find(
        (s: any) => s.Action && s.Action.includes('sqs:SendMessage')
      );
      expect(sqsStatement).toBeDefined();
    });

    test('should have CloudTrailLogRole', () => {
      const role = template.Resources.CloudTrailLogRole;
      expect(role).toBeDefined();
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service)
        .toBe('cloudtrail.amazonaws.com');
      expect(role.Properties.PermissionsBoundary).toEqual({ Ref: 'PermissionBoundaryPolicy' });
    });

    test('should have RDSMonitoringRole', () => {
      const role = template.Resources.RDSMonitoringRole;
      expect(role).toBeDefined();
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service)
        .toBe('monitoring.rds.amazonaws.com');
      expect(role.Properties.PermissionsBoundary).toEqual({ Ref: 'PermissionBoundaryPolicy' });
    });
  });

  // S3 BUCKETS VALIDATION
  describe('S3 Buckets', () => {
    const s3Buckets = ['AppDataBucket', 'AppConfigBucket', 'CloudTrailBucket'];

    test('should have all required S3 buckets', () => {
      s3Buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket).toBeDefined();
        expect(bucket.Type).toBe('AWS::S3::Bucket');
      });
    });

    test('all buckets should have versioning enabled', () => {
      s3Buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      });
    });

    test('all buckets should have KMS encryption', () => {
      s3Buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
        expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({
          'Fn::GetAtt': ['MasterKMSKey', 'Arn'],
        });
      });
    });

    test('all buckets should have public access block', () => {
      s3Buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const pubAccess = bucket.Properties.PublicAccessBlockConfiguration;
        expect(pubAccess.BlockPublicAcls).toBe(true);
        expect(pubAccess.BlockPublicPolicy).toBe(true);
        expect(pubAccess.IgnorePublicAcls).toBe(true);
        expect(pubAccess.RestrictPublicBuckets).toBe(true);
      });
    });

    test('CloudTrailBucket should have lifecycle configuration', () => {
      const bucket = template.Resources.CloudTrailBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      const rules = bucket.Properties.LifecycleConfiguration.Rules;
      expect(rules[0].Status).toBe('Enabled');
      expect(rules[0].NoncurrentVersionExpirationInDays).toBe(90);
    });

    test('should have CloudTrailBucketPolicy with correct permissions', () => {
      const policy = template.Resources.CloudTrailBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Properties.Bucket).toEqual({ Ref: 'CloudTrailBucket' });

      const statements = policy.Properties.PolicyDocument.Statement;
      const aclCheck = statements.find((s: any) => s.Sid === 'AWSCloudTrailAclCheck');
      expect(aclCheck).toBeDefined();
      expect(aclCheck.Principal.Service).toBe('cloudtrail.amazonaws.com');

      const write = statements.find((s: any) => s.Sid === 'AWSCloudTrailWrite');
      expect(write).toBeDefined();
      expect(write.Action).toBe('s3:PutObject');
      expect(write.Condition.StringEquals['s3:x-amz-acl']).toBe('bucket-owner-full-control');
    });

    test('should have AppDataBucketPolicyForCloudFront with condition for CloudFront access', () => {
      const policy = template.Resources.AppDataBucketPolicyForCloudFront;
      expect(policy).toBeDefined();
      expect(policy.Condition).toBe('CreateCloudFront');
      expect(policy.Properties.Bucket).toEqual({ Ref: 'AppDataBucket' });
    });
  });

  // RDS DATABASE VALIDATION
  describe('RDS Database', () => {
    test('should have DBSubnetGroup', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
      expect(subnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should have DBPasswordSecret with KMS encryption', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.KmsKeyId).toEqual({ Ref: 'MasterKMSKey' });
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
    });

    test('should have RDSDatabase with security configuration', () => {
      const db = template.Resources.RDSDatabase;
      expect(db).toBeDefined();
      expect(db.Type).toBe('AWS::RDS::DBInstance');

      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.KmsKeyId).toEqual({ 'Fn::GetAtt': ['MasterKMSKey', 'Arn'] });
      expect(db.Properties.MultiAZ).toBe(true);
      expect(db.Properties.BackupRetentionPeriod).toBe(7);
      expect(db.Properties.MonitoringInterval).toBe(60);
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.EngineVersion).toBe('8.0.43');
      expect(db.Properties.DBInstanceClass).toBe('db.t3.medium');
      expect(db.Properties.StorageType).toBe('gp3');
    });

    test('RDSDatabase should use Secrets Manager for credentials', () => {
      const db = template.Resources.RDSDatabase;
      const username = db.Properties.MasterUsername;
      const password = db.Properties.MasterUserPassword;

      expect(username['Fn::Sub']).toContain('resolve:secretsmanager');
      expect(password['Fn::Sub']).toContain('resolve:secretsmanager');
      expect(username['Fn::Sub']).toContain('DBPasswordSecret');
    });

    test('RDSDatabase should have CloudWatch logs export enabled', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.EnableCloudwatchLogsExports).toContain('error');
      expect(db.Properties.EnableCloudwatchLogsExports).toContain('general');
      expect(db.Properties.EnableCloudwatchLogsExports).toContain('slowquery');
    });
  });

  // CLOUDTRAIL VALIDATION
  describe('CloudTrail', () => {
    test('should have CloudTrailLogGroup with KMS encryption', () => {
      const logGroup = template.Resources.CloudTrailLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(90);
      expect(logGroup.Properties.KmsKeyId).toEqual({ 'Fn::GetAtt': ['MasterKMSKey', 'Arn'] });
    });

    test('should have CloudTrail with correct configuration', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');

      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(false);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
      expect(trail.Properties.KMSKeyId).toEqual({ 'Fn::GetAtt': ['MasterKMSKey', 'Arn'] });
      expect(trail.Properties.S3BucketName).toEqual({ Ref: 'CloudTrailBucket' });
    });

    test('CloudTrail should have CloudWatch Logs integration', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.CloudWatchLogsLogGroupArn).toEqual({
        'Fn::GetAtt': ['CloudTrailLogGroup', 'Arn'],
      });
      expect(trail.Properties.CloudWatchLogsRoleArn).toEqual({
        'Fn::GetAtt': ['CloudTrailLogRole', 'Arn'],
      });
    });

    test('CloudTrail should have event selectors for S3 buckets', () => {
      const trail = template.Resources.CloudTrail;
      const selectors = trail.Properties.EventSelectors;
      expect(selectors).toBeDefined();
      expect(selectors[0].IncludeManagementEvents).toBe(true);
      expect(selectors[0].ReadWriteType).toBe('All');
      expect(selectors[0].DataResources[0].Type).toBe('AWS::S3::Object');
      expect(selectors[0].DataResources[0].Values.length).toBe(2);
    });

    test('CloudTrail should depend on CloudTrailBucketPolicy', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.DependsOn).toContain('CloudTrailBucketPolicy');
    });
  });

  // WAF AND CLOUDFRONT VALIDATION
  describe('WAF and CloudFront', () => {
    test('CreateCloudFront condition should exist', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.CreateCloudFront).toBeDefined();
      expect(template.Conditions.CreateCloudFront['Fn::Equals']).toEqual([
        { Ref: 'AWS::Region' },
        'us-east-1'
      ]);
    });

    test('WebACL should be created only in us-east-1', () => {
      const webacl = template.Resources.WebACL;
      expect(webacl).toBeDefined();
      expect(webacl.Condition).toBe('CreateCloudFront');
      expect(webacl.Type).toBe('AWS::WAFv2::WebACL');
      expect(webacl.Properties.Scope).toBe('CLOUDFRONT');
    });

    test('WebACL should have AWS managed rules', () => {
      const webacl = template.Resources.WebACL;
      const rules = webacl.Properties.Rules;
      expect(rules.length).toBeGreaterThan(0);

      const commonRuleSet = rules.find((r: any) => r.Name === 'AWSManagedRulesCommonRuleSet');
      expect(commonRuleSet).toBeDefined();
      expect(commonRuleSet.Statement.ManagedRuleGroupStatement.VendorName).toBe('AWS');
    });

    test('CloudFrontDistribution should be created only in us-east-1', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      expect(distribution).toBeDefined();
      expect(distribution.Condition).toBe('CreateCloudFront');
      expect(distribution.Type).toBe('AWS::CloudFront::Distribution');
    });

    test('CloudFrontDistribution should use WAF', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      expect(distribution.Properties.DistributionConfig.WebACLId).toEqual({
        'Fn::GetAtt': ['WebACL', 'Arn'],
      });
    });

    test('CloudFrontDistribution should enforce HTTPS', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const config = distribution.Properties.DistributionConfig;
      expect(config.DefaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('CloudFrontDistribution should use Origin Access Control', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const origins = distribution.Properties.DistributionConfig.Origins;
      expect(origins[0].OriginAccessControlId).toEqual({
        Ref: 'CloudFrontOriginAccessControl',
      });
    });

    test('should have CloudFrontOriginAccessControl with condition', () => {
      const oac = template.Resources.CloudFrontOriginAccessControl;
      expect(oac).toBeDefined();
      expect(oac.Condition).toBe('CreateCloudFront');
      expect(oac.Type).toBe('AWS::CloudFront::OriginAccessControl');
      expect(oac.Properties.OriginAccessControlConfig.SigningProtocol).toBe('sigv4');
    });
  });

  // LAMBDA VALIDATION
  describe('Lambda Function', () => {
    test('should have LambdaDeadLetterQueue with KMS encryption', () => {
      const dlq = template.Resources.LambdaDeadLetterQueue;
      expect(dlq).toBeDefined();
      expect(dlq.Type).toBe('AWS::SQS::Queue');
      expect(dlq.Properties.KmsMasterKeyId).toEqual({ Ref: 'MasterKMSKey' });
      expect(dlq.Properties.MessageRetentionPeriod).toBe(1209600); // 14 days
    });

    test('should have SampleLambdaFunction with DLQ configuration', () => {
      const func = template.Resources.SampleLambdaFunction;
      expect(func).toBeDefined();
      expect(func.Type).toBe('AWS::Lambda::Function');
      expect(func.Properties.DeadLetterConfig.TargetArn).toEqual({
        'Fn::GetAtt': ['LambdaDeadLetterQueue', 'Arn'],
      });
      expect(func.Properties.Runtime).toBe('python3.9');
      expect(func.Properties.Timeout).toBe(30);
      expect(func.Properties.MemorySize).toBe(128);
    });

    test('Lambda function should have environment variables', () => {
      const func = template.Resources.SampleLambdaFunction;
      expect(func.Properties.Environment.Variables.ENVIRONMENT).toEqual({
        Ref: 'EnvironmentName',
      });
      expect(func.Properties.Environment.Variables.PROJECT).toEqual({
        Ref: 'ProjectName',
      });
    });

    test('should have LambdaLogGroup with KMS encryption', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
      expect(logGroup.Properties.KmsKeyId).toEqual({ 'Fn::GetAtt': ['MasterKMSKey', 'Arn'] });
    });
  });

  // API GATEWAY VALIDATION
  describe('API Gateway', () => {
    test('should have RestApi', () => {
      const api = template.Resources.RestApi;
      expect(api).toBeDefined();
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('should have ApiRequestValidator', () => {
      const validator = template.Resources.ApiRequestValidator;
      expect(validator).toBeDefined();
      expect(validator.Properties.ValidateRequestBody).toBe(true);
      expect(validator.Properties.ValidateRequestParameters).toBe(true);
    });

    test('should have ApiModel with JSON schema', () => {
      const model = template.Resources.ApiModel;
      expect(model).toBeDefined();
      expect(model.Properties.ContentType).toBe('application/json');
      expect(model.Properties.Schema).toBeDefined();
      expect(model.Properties.Schema.type).toBe('object');
      expect(model.Properties.Schema.required).toContain('customerId');
      expect(model.Properties.Schema.required).toContain('items');
    });

    test('ApiMethod should use request validator', () => {
      const method = template.Resources.ApiMethod;
      expect(method).toBeDefined();
      expect(method.Properties.RequestValidatorId).toEqual({ Ref: 'ApiRequestValidator' });
      expect(method.Properties.RequestModels['application/json']).toEqual({ Ref: 'ApiModel' });
    });

    test('ApiMethod should integrate with Lambda', () => {
      const method = template.Resources.ApiMethod;
      const integration = method.Properties.Integration;
      expect(integration.Type).toBe('AWS');
      expect(integration.Uri['Fn::Sub']).toContain('lambda');
      expect(integration.Uri['Fn::Sub']).toContain('SampleLambdaFunction');
    });

    test('should have ApiGatewayInvokeLambdaPermission', () => {
      const permission = template.Resources.ApiGatewayInvokeLambdaPermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
    });
  });

  // EC2 INSTANCES VALIDATION
  describe('EC2 Instances', () => {
    test('should have WebServerInstance in private subnet', () => {
      const instance = template.Resources.WebServerInstance;
      expect(instance).toBeDefined();
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(instance.Properties.Monitoring).toBe(true);
    });

    test('WebServerInstance should have encrypted EBS volume', () => {
      const instance = template.Resources.WebServerInstance;
      const blockDevice = instance.Properties.BlockDeviceMappings[0];
      expect(blockDevice.Ebs.Encrypted).toBe(true);
      expect(blockDevice.Ebs.KmsKeyId).toEqual({ 'Fn::GetAtt': ['MasterKMSKey', 'Arn'] });
      expect(blockDevice.Ebs.VolumeType).toBe('gp3');
      expect(blockDevice.Ebs.DeleteOnTermination).toBe(true);
    });

    test('WebServerInstance should use dynamic AMI', () => {
      const instance = template.Resources.WebServerInstance;
      expect(instance.Properties.ImageId).toContain('resolve:ssm');
      expect(instance.Properties.ImageId).toContain('al2023-ami-kernel-default-x86_64');
    });

    test('WebServerInstance should have IAM instance profile', () => {
      const instance = template.Resources.WebServerInstance;
      expect(instance.Properties.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
    });

    test('should have WebServerInstanceAz2 in different AZ', () => {
      const instance = template.Resources.WebServerInstanceAz2;
      expect(instance).toBeDefined();
      expect(instance.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
    });
  });

  // CLOUDWATCH ALARMS VALIDATION
  describe('CloudWatch Alarms', () => {
    test('should have EC2CPUAlarm', () => {
      const alarm = template.Resources.EC2CPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
    });

    test('should have EC2CPUAlarmAz2', () => {
      const alarm = template.Resources.EC2CPUAlarmAz2;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.Dimensions[0].Value).toEqual({ Ref: 'WebServerInstanceAz2' });
    });

    test('should have RDSCPUAlarm', () => {
      const alarm = template.Resources.RDSCPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.Namespace).toBe('AWS/RDS');
      expect(alarm.Properties.Dimensions[0].Name).toBe('DBInstanceIdentifier');
      expect(alarm.Properties.Dimensions[0].Value).toEqual({ Ref: 'RDSDatabase' });
    });
  });

  // RESOURCE TAGGING VALIDATION
  describe('Resource Tagging', () => {
    const requiredTags = ['Name', 'Project', 'Department', 'Owner', 'team', 'iac-rlhf-amazon'];
    const resourcesWithTags = [
      'VPC',
      'InternetGateway',
      'PublicSubnet1',
      'PrivateSubnet1',
      'WebServerSecurityGroup',
      'DatabaseSecurityGroup',
      'EC2InstanceRole',
      'AppDataBucket',
      'RDSDatabase',
      'CloudTrail',
      'SampleLambdaFunction',
    ];

    test('all tagged resources should have required tags', () => {
      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (!resource || !resource.Properties.Tags) return;

        const tags = resource.Properties.Tags;
        const tagKeys = tags.map((t: any) => t.Key);

        requiredTags.forEach(requiredTag => {
          const tag = tags.find((t: any) => t.Key === requiredTag);
          expect(tag).toBeDefined();
        });
      });
    });

    test('all resources should reference parameter values for tags', () => {
      const vpc = template.Resources.VPC;
      const projectTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Project');
      expect(projectTag.Value).toEqual({ Ref: 'ProjectName' });

      const deptTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Department');
      expect(deptTag.Value).toEqual({ Ref: 'Department' });
    });
  });

  // OUTPUTS VALIDATION
  describe('Outputs', () => {
    const requiredOutputs = [
      'VpcId',
      'WafWebAclArn',
      'CloudFrontDomainName',
      'CloudTrailLogGroupArn',
      'RdsInstanceEndpoint',
      'S3BucketName',
      'AppDataBucketName',
      'AppConfigBucketName',
      'DBPasswordSecretArn',
      'ApiGatewayId',
      'DlqUrl',
      'ApiGatewayUrl',
      'Ec2InstanceId',
      'Ec2InstanceIdAz2',
      'KmsKeyId',
      'LambdaFunctionArn',
      'SecurityStatus',
    ];

    test('should have all required outputs', () => {
      requiredOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('WafWebAclArn output should be conditional', () => {
      const output = template.Outputs.WafWebAclArn;
      expect(output).toBeDefined();
      expect(output.Condition).toBe('CreateCloudFront');
      expect(output.Value).toBeDefined();
      expect(output.Value['Fn::GetAtt']).toEqual(['WebACL', 'Arn']);
    });

    test('CloudFrontDomainName output should be conditional', () => {
      const output = template.Outputs.CloudFrontDomainName;
      expect(output).toBeDefined();
      expect(output.Condition).toBe('CreateCloudFront');
      expect(output.Value).toBeDefined();
      expect(output.Value['Fn::GetAtt']).toEqual(['CloudFrontDistribution', 'DomainName']);
    });

    test('SecurityStatus should provide comprehensive status', () => {
      const output = template.Outputs.SecurityStatus;
      expect(output.Value['Fn::Sub']).toContain('Security Baseline Status');
      expect(output.Value['Fn::Sub']).toContain('Multi-AZ VPC');
      expect(output.Value['Fn::Sub']).toContain('KMS encryption');
    });
  });

  // CROSS-VERIFICATION AND DEPENDENCIES
  describe('Resource Dependencies and Cross-Verification', () => {
    test('all security groups should reference VPC', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      const dbSG = template.Resources.DatabaseSecurityGroup;
      expect(webSG.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(dbSG.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('all IAM roles should have permission boundaries', () => {
      const roles = [
        'EC2InstanceRole',
        'LambdaExecutionRole',
        'RDSMonitoringRole',
        'CloudTrailLogRole',
      ];
      roles.forEach(roleName => {
        const role = template.Resources[roleName];
        expect(role.Properties.PermissionsBoundary).toEqual({
          Ref: 'PermissionBoundaryPolicy',
        });
      });
    });

    test('all encrypted resources should reference MasterKMSKey', () => {
      const encryptedResources = [
        { resource: 'AppDataBucket', path: ['Properties', 'BucketEncryption', 'ServerSideEncryptionConfiguration', '0', 'ServerSideEncryptionByDefault', 'KMSMasterKeyID'] },
        { resource: 'CloudTrailBucket', path: ['Properties', 'BucketEncryption', 'ServerSideEncryptionConfiguration', '0', 'ServerSideEncryptionByDefault', 'KMSMasterKeyID'] },
        { resource: 'RDSDatabase', path: ['Properties', 'KmsKeyId'] },
        { resource: 'CloudTrailLogGroup', path: ['Properties', 'KmsKeyId'] },
        { resource: 'LambdaLogGroup', path: ['Properties', 'KmsKeyId'] },
      ];

      encryptedResources.forEach(({ resource, path }) => {
        const res = template.Resources[resource];
        let value = res;
        path.forEach(p => {
          value = value[p];
        });
        expect(value['Fn::GetAtt']).toEqual(['MasterKMSKey', 'Arn']);
      });
    });

    test('RDS should use database security group', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.VPCSecurityGroups[0]['Fn::GetAtt']).toEqual([
        'DatabaseSecurityGroup',
        'GroupId',
      ]);
    });

    test('EC2 instances should use web server security group', () => {
      const instance1 = template.Resources.WebServerInstance;
      const instance2 = template.Resources.WebServerInstanceAz2;
      expect(instance1.Properties.SecurityGroupIds[0]['Fn::GetAtt']).toEqual([
        'WebServerSecurityGroup',
        'GroupId',
      ]);
      expect(instance2.Properties.SecurityGroupIds[0]['Fn::GetAtt']).toEqual([
        'WebServerSecurityGroup',
        'GroupId',
      ]);
    });
  });

  // BOUNDARY CONDITIONS AND EDGE CASES
  describe('Boundary Conditions and Edge Cases', () => {
    test('DBMasterUsername should enforce length constraints', () => {
      const param = template.Parameters.DBMasterUsername;
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
    });

    test('environment name should enforce lowercase pattern', () => {
      const param = template.Parameters.EnvironmentName;
      expect(param.AllowedPattern).toBe('^[a-z][a-z0-9-]*$');
      // Should start with lowercase letter
      expect('TestEnv'.match(param.AllowedPattern)).toBeNull();
      expect('test-env'.match(param.AllowedPattern)).not.toBeNull();
    });

    test('CIDR patterns should validate IP ranges', () => {
      const vpcParam = template.Parameters.VPCCidr;
      expect(vpcParam.AllowedPattern).toContain('/');
      // Should validate CIDR notation
      expect(vpcParam.Default).toMatch(/\d+\.\d+\.\d+\.\d+\/\d+/);
    });

    test('EC2 instance type should be limited to allowed values', () => {
      const param = template.Parameters.EC2InstanceType;
      expect(param.AllowedValues.length).toBe(4);
      expect(param.AllowedValues).not.toContain('m5.large'); // Not in allowed list
    });
  });

  // INVERSE CHECKS (What should NOT exist)
  describe('Inverse Checks - Security Hardening', () => {
    test('public subnets should NOT auto-assign public IPs', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('S3 buckets should NOT allow public access', () => {
      const buckets = ['AppDataBucket', 'AppConfigBucket', 'CloudTrailBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const pubAccess = bucket.Properties.PublicAccessBlockConfiguration;
        expect(pubAccess.BlockPublicAcls).toBe(true);
        expect(pubAccess.RestrictPublicBuckets).toBe(true);
      });
    });

    test('permission boundary should deny IAM operations', () => {
      const policy = template.Resources.PermissionBoundaryPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      const denyStatement = statements.find((s: any) => s.Effect === 'Deny');
      expect(denyStatement.Action).toContain('iam:*');
      expect(denyStatement.Action).toContain('organizations:*');
    });
  });

  // PERFORMANCE AND RESOURCE LIMITS
  describe('Performance and Resource Configuration', () => {
    test('Lambda function should have reasonable timeout', () => {
      const func = template.Resources.SampleLambdaFunction;
      expect(func.Properties.Timeout).toBe(30);
      expect(func.Properties.MemorySize).toBe(128);
    });

    test('RDS should use gp3 storage for better performance', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.StorageType).toBe('gp3');
    });

    test('CloudWatch alarms should use appropriate periods', () => {
      const alarms = [
        template.Resources.EC2CPUAlarm,
        template.Resources.RDSCPUAlarm,
      ];
      alarms.forEach(alarm => {
        expect(alarm.Properties.Period).toBe(300); // 5 minutes
        expect(alarm.Properties.EvaluationPeriods).toBe(2);
      });
    });

    test('CloudFront should use HTTP/2', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      expect(distribution.Properties.DistributionConfig.HttpVersion).toBe('http2');
    });
  });
});
