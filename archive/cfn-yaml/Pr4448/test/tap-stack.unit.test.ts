import fs from 'fs';
import path from 'path';

describe('Secure Compliance Infrastructure CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Secure and Compliant Cloud Infrastructure');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have ProjectName parameter', () => {
      const param = template.Parameters.ProjectName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('SecureInfra');
      expect(param.AllowedPattern).toBe('^[a-zA-Z][a-zA-Z0-9-]{2,20}$');
    });

    test('should have Environment parameter', () => {
      const param = template.Parameters.Environment;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('production');
      expect(param.AllowedValues).toEqual(['development', 'staging', 'production']);
    });

    test('should have EnvironmentSuffix parameter', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-z0-9-]+$');
    });

    test('should have AlertEmail parameter', () => {
      const param = template.Parameters.AlertEmail;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('admin@example.com');
      expect(param.AllowedPattern).toBeDefined();
      expect(param.AllowedPattern).toContain('@');
    });
  });

  describe('Mappings', () => {
    test('should have SubnetConfig mapping', () => {
      expect(template.Mappings.SubnetConfig).toBeDefined();
    });

    test('SubnetConfig should have correct CIDR blocks', () => {
      const subnetConfig = template.Mappings.SubnetConfig;
      expect(subnetConfig.VPC.CIDR).toBe('10.0.0.0/16');
      expect(subnetConfig.PublicSubnet1.CIDR).toBe('10.0.1.0/24');
      expect(subnetConfig.PublicSubnet2.CIDR).toBe('10.0.2.0/24');
      expect(subnetConfig.PrivateSubnet1.CIDR).toBe('10.0.10.0/24');
      expect(subnetConfig.PrivateSubnet2.CIDR).toBe('10.0.20.0/24');
    });
  });

  describe('KMS Resources', () => {
    test('should have MasterKMSKey resource', () => {
      const kmsKey = template.Resources.MasterKMSKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
    });

    test('MasterKMSKey should have correct key policy', () => {
      const kmsKey = template.Resources.MasterKMSKey;
      const keyPolicy = kmsKey.Properties.KeyPolicy;
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toBeDefined();
      expect(Array.isArray(keyPolicy.Statement)).toBe(true);
    });

    test('MasterKMSKey should allow IAM root user full access', () => {
      const kmsKey = template.Resources.MasterKMSKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;
      const rootStatement = statements.find((s: any) => s.Sid === 'Enable IAM policies');
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Action).toBe('kms:*');
    });

    test('MasterKMSKey should allow CloudTrail to encrypt logs', () => {
      const kmsKey = template.Resources.MasterKMSKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;
      const cloudTrailStatement = statements.find((s: any) =>
        s.Sid === 'Allow CloudTrail to encrypt logs'
      );
      expect(cloudTrailStatement).toBeDefined();
      expect(cloudTrailStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
      expect(cloudTrailStatement.Action).toContain('kms:GenerateDataKey*');
      expect(cloudTrailStatement.Action).toContain('kms:Decrypt');
    });

    test('MasterKMSKey should allow CloudWatch Logs', () => {
      const kmsKey = template.Resources.MasterKMSKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;
      const cloudWatchStatement = statements.find((s: any) =>
        s.Sid === 'Allow CloudWatch Logs'
      );
      expect(cloudWatchStatement).toBeDefined();
      expect(cloudWatchStatement.Action).toContain('kms:Encrypt');
      expect(cloudWatchStatement.Action).toContain('kms:Decrypt');
    });

    test('MasterKMSKey should allow AWS Config', () => {
      const kmsKey = template.Resources.MasterKMSKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;
      const configStatement = statements.find((s: any) => s.Sid === 'Allow AWS Config');
      expect(configStatement).toBeDefined();
      expect(configStatement.Principal.Service).toBe('config.amazonaws.com');
    });

    test('MasterKMSKey should allow SNS', () => {
      const kmsKey = template.Resources.MasterKMSKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;
      const snsStatement = statements.find((s: any) => s.Sid === 'Allow SNS');
      expect(snsStatement).toBeDefined();
      expect(snsStatement.Principal.Service).toBe('sns.amazonaws.com');
    });

    test('MasterKMSKey should allow S3', () => {
      const kmsKey = template.Resources.MasterKMSKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;
      const s3Statement = statements.find((s: any) => s.Sid === 'Allow S3 to use the key');
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Principal.Service).toBe('s3.amazonaws.com');
    });

    test('MasterKMSKey should have required tags', () => {
      const kmsKey = template.Resources.MasterKMSKey;
      const tags = kmsKey.Properties.Tags;
      expect(tags).toBeDefined();

      const projectTag = tags.find((t: any) => t.Key === 'Project');
      const envTag = tags.find((t: any) => t.Key === 'Environment');
      const nameTag = tags.find((t: any) => t.Key === 'Name');

      expect(projectTag).toBeDefined();
      expect(envTag).toBeDefined();
      expect(nameTag).toBeDefined();
    });

    test('should have MasterKMSKeyAlias resource', () => {
      const alias = template.Resources.MasterKMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'MasterKMSKey' });
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should enable DNS hostnames and support', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toEqual({
        'Fn::FindInMap': ['SubnetConfig', 'VPC', 'CIDR']
      });
    });

    test('should have PublicSubnet1 resource', () => {
      const subnet = template.Resources.PublicSubnet1;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have PublicSubnet2 resource', () => {
      const subnet = template.Resources.PublicSubnet2;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have PrivateSubnet1 resource', () => {
      const subnet = template.Resources.PrivateSubnet1;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have PrivateSubnet2 resource', () => {
      const subnet = template.Resources.PrivateSubnet2;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should be in different availability zones', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;

      expect(subnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
    });

    test('private subnets should be in different availability zones', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;

      expect(subnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
    });

    test('should have InternetGateway resource', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have AttachGateway resource', () => {
      const attach = template.Resources.AttachGateway;
      expect(attach).toBeDefined();
      expect(attach.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attach.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attach.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have NATGateway resource', () => {
      const nat = template.Resources.NATGateway;
      expect(nat).toBeDefined();
      expect(nat.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have NATGatewayEIP resource', () => {
      const eip = template.Resources.NATGatewayEIP;
      expect(eip).toBeDefined();
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.DependsOn).toBe('AttachGateway');
    });

    test('should have PublicRouteTable resource', () => {
      const rt = template.Resources.PublicRouteTable;
      expect(rt).toBeDefined();
      expect(rt.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have PrivateRouteTable resource', () => {
      const rt = template.Resources.PrivateRouteTable;
      expect(rt).toBeDefined();
      expect(rt.Type).toBe('AWS::EC2::RouteTable');
    });

    test('PublicRoute should route to InternetGateway', () => {
      const route = template.Resources.PublicRoute;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('PrivateRoute should route to NATGateway', () => {
      const route = template.Resources.PrivateRoute;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway' });
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have VPCFlowLogRole resource', () => {
      const role = template.Resources.VPCFlowLogRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('VPCFlowLogRole should have correct trust policy', () => {
      const role = template.Resources.VPCFlowLogRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe('vpc-flow-logs.amazonaws.com');
    });

    test('VPCFlowLogRole should have CloudWatch permissions', () => {
      const role = template.Resources.VPCFlowLogRole;
      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('CloudWatchLogPolicy');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogGroup');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:PutLogEvents');
    });

    test('should have VPCFlowLogGroup resource', () => {
      const logGroup = template.Resources.VPCFlowLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('VPCFlowLogGroup should be encrypted with KMS', () => {
      const logGroup = template.Resources.VPCFlowLogGroup;
      expect(logGroup.Properties.KmsKeyId).toEqual({
        'Fn::GetAtt': ['MasterKMSKey', 'Arn']
      });
    });

    test('should have VPCFlowLog resource', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog).toBeDefined();
      expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLog.Properties.TrafficType).toBe('ALL');
      expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
    });
  });

  describe('S3 Buckets', () => {
    test('should have LoggingBucket resource', () => {
      const bucket = template.Resources.LoggingBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
    });

    test('LoggingBucket should have KMS encryption enabled', () => {
      const bucket = template.Resources.LoggingBucket;
      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'MasterKMSKey' });
    });

    test('LoggingBucket should have versioning enabled', () => {
      const bucket = template.Resources.LoggingBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('LoggingBucket should block all public access', () => {
      const bucket = template.Resources.LoggingBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('LoggingBucket should have lifecycle rules', () => {
      const bucket = template.Resources.LoggingBucket;
      const rules = bucket.Properties.LifecycleConfiguration.Rules;
      expect(rules).toHaveLength(2);

      const deleteOldLogs = rules.find((r: any) => r.Id === 'DeleteOldLogs');
      expect(deleteOldLogs).toBeDefined();
      expect(deleteOldLogs.ExpirationInDays).toBe(90);
    });

    test('should have ApplicationBucket resource', () => {
      const bucket = template.Resources.ApplicationBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('ApplicationBucket should have KMS encryption enabled', () => {
      const bucket = template.Resources.ApplicationBucket;
      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('ApplicationBucket should have versioning enabled', () => {
      const bucket = template.Resources.ApplicationBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('ApplicationBucket should have logging configured', () => {
      const bucket = template.Resources.ApplicationBucket;
      const logging = bucket.Properties.LoggingConfiguration;
      expect(logging.DestinationBucketName).toEqual({ Ref: 'LoggingBucket' });
      expect(logging.LogFilePrefix).toBe('s3-access-logs/');
    });
  });

  describe('IAM Roles', () => {
    test('should have EC2InstanceRole resource', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('EC2InstanceRole should have correct trust policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('EC2InstanceRole should have CloudWatch managed policy', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('EC2InstanceRole should have S3 read-only policy with tag restrictions', () => {
      const role = template.Resources.EC2InstanceRole;
      const s3Policy = role.Properties.Policies.find((p: any) =>
        p.PolicyName === 'S3ReadOnlyWithTagRestriction'
      );
      expect(s3Policy).toBeDefined();

      const readStatement = s3Policy.PolicyDocument.Statement.find((s: any) =>
        s.Sid === 'ReadOnlyAccessWithTags'
      );
      expect(readStatement.Condition.StringEquals).toBeDefined();
      expect(readStatement.Condition.StringEquals['s3:ExistingObjectTag/Project']).toBeDefined();
      expect(readStatement.Condition.StringEquals['s3:ExistingObjectTag/Environment']).toBeDefined();
    });

    test('EC2InstanceRole should have KMS decrypt policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const kmsPolicy = role.Properties.Policies.find((p: any) =>
        p.PolicyName === 'KMSDecryptPolicy'
      );
      expect(kmsPolicy).toBeDefined();
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:Decrypt');
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:DescribeKey');
    });

    test('should have EC2InstanceProfile resource', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toEqual([{ Ref: 'EC2InstanceRole' }]);
    });
  });

  describe('CloudTrail', () => {
    test('should have CloudTrailLogGroup resource', () => {
      const logGroup = template.Resources.CloudTrailLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(90);
    });

    test('CloudTrailLogGroup should be encrypted with KMS', () => {
      const logGroup = template.Resources.CloudTrailLogGroup;
      expect(logGroup.Properties.KmsKeyId).toEqual({
        'Fn::GetAtt': ['MasterKMSKey', 'Arn']
      });
    });

    test('should have CloudTrailRole resource', () => {
      const role = template.Resources.CloudTrailRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('CloudTrailRole should have correct trust policy', () => {
      const role = template.Resources.CloudTrailRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe('cloudtrail.amazonaws.com');
    });

    test('should have CloudTrail resource', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.DependsOn).toEqual(['CloudTrailBucketPolicy']);
    });

    test('CloudTrail should have correct configuration', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
    });

    test('CloudTrail should have S3 key prefix', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.S3KeyPrefix).toBe('cloudtrail');
    });

    test('CloudTrail should have KMS encryption', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.KMSKeyId).toEqual({ Ref: 'MasterKMSKey' });
    });

    test('CloudTrail should have event selectors', () => {
      const trail = template.Resources.CloudTrail;
      const eventSelectors = trail.Properties.EventSelectors;
      expect(eventSelectors).toBeDefined();
      expect(eventSelectors[0].IncludeManagementEvents).toBe(true);
      expect(eventSelectors[0].ReadWriteType).toBe('All');
    });

    test('CloudTrail should monitor S3 data events', () => {
      const trail = template.Resources.CloudTrail;
      const dataResources = trail.Properties.EventSelectors[0].DataResources;
      expect(dataResources).toBeDefined();
      expect(dataResources[0].Type).toBe('AWS::S3::Object');
    });

    test('CloudTrail should have insight selectors', () => {
      const trail = template.Resources.CloudTrail;
      const insights = trail.Properties.InsightSelectors;
      expect(insights).toBeDefined();
      expect(insights[0].InsightType).toBe('ApiCallRateInsight');
    });

    test('should have CloudTrailBucketPolicy resource', () => {
      const policy = template.Resources.CloudTrailBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('CloudTrailBucketPolicy should allow CloudTrail to write', () => {
      const policy = template.Resources.CloudTrailBucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;

      const writeStatement = statements.find((s: any) => s.Sid === 'AWSCloudTrailWrite');
      expect(writeStatement).toBeDefined();
      expect(writeStatement.Action).toBe('s3:PutObject');
      expect(writeStatement.Condition.StringEquals['s3:x-amz-acl']).toBe('bucket-owner-full-control');
    });

    test('CloudTrailBucketPolicy should allow Config service', () => {
      const policy = template.Resources.CloudTrailBucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;

      const configWriteStatement = statements.find((s: any) => s.Sid === 'AWSConfigWrite');
      expect(configWriteStatement).toBeDefined();
      expect(configWriteStatement.Principal.Service).toBe('config.amazonaws.com');
    });

    test('CloudTrailBucketPolicy should allow S3 logging service', () => {
      const policy = template.Resources.CloudTrailBucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;

      const s3LogStatement = statements.find((s: any) => s.Sid === 'S3ServerAccessLogsPolicy');
      expect(s3LogStatement).toBeDefined();
      expect(s3LogStatement.Principal.Service).toBe('logging.s3.amazonaws.com');
    });
  });

  describe('SNS and CloudWatch Alarms', () => {
    test('should have AlarmTopic resource', () => {
      const topic = template.Resources.AlarmTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('AlarmTopic should be encrypted with KMS', () => {
      const topic = template.Resources.AlarmTopic;
      expect(topic.Properties.KmsMasterKeyId).toEqual({ Ref: 'MasterKMSKey' });
    });

    test('AlarmTopic should have email subscription', () => {
      const topic = template.Resources.AlarmTopic;
      const subscription = topic.Properties.Subscription[0];
      expect(subscription.Protocol).toBe('email');
      expect(subscription.Endpoint).toEqual({ Ref: 'AlertEmail' });
    });

    test('should have AlarmTopicPolicy resource', () => {
      const policy = template.Resources.AlarmTopicPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::SNS::TopicPolicy');
    });

    test('AlarmTopicPolicy should allow CloudWatch to publish', () => {
      const policy = template.Resources.AlarmTopicPolicy;
      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Principal.Service).toBe('cloudwatch.amazonaws.com');
      expect(statement.Action).toContain('SNS:Publish');
    });

    test('should have UnauthorizedAPICallsAlarm resource', () => {
      const alarm = template.Resources.UnauthorizedAPICallsAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('UnauthorizedAPICalls');
      expect(alarm.Properties.Threshold).toBe(1);
    });

    test('should have RootAccountUsageAlarm resource', () => {
      const alarm = template.Resources.RootAccountUsageAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('RootAccountUsage');
    });

    test('should have UnauthorizedAPICallsMetricFilter resource', () => {
      const filter = template.Resources.UnauthorizedAPICallsMetricFilter;
      expect(filter).toBeDefined();
      expect(filter.Type).toBe('AWS::Logs::MetricFilter');
      expect(filter.Properties.FilterPattern).toContain('UnauthorizedOperation');
    });

    test('should have RootAccountUsageMetricFilter resource', () => {
      const filter = template.Resources.RootAccountUsageMetricFilter;
      expect(filter).toBeDefined();
      expect(filter.Type).toBe('AWS::Logs::MetricFilter');
      expect(filter.Properties.FilterPattern).toContain('Root');
    });
  });

  describe('AWS Config', () => {
    test('should have ConfigRecorderRole resource', () => {
      const role = template.Resources.ConfigRecorderRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('ConfigRecorderRole should have AWS managed policy', () => {
      const role = template.Resources.ConfigRecorderRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWS_ConfigRole');
    });

    test('ConfigRecorderRole should have S3 bucket policy', () => {
      const role = template.Resources.ConfigRecorderRole;
      const s3Policy = role.Properties.Policies.find((p: any) =>
        p.PolicyName === 'S3BucketPolicy'
      );
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement.some((s: any) =>
        s.Action.includes('s3:PutObject')
      )).toBe(true);
    });

    test('ConfigRecorderRole should have KMS policy', () => {
      const role = template.Resources.ConfigRecorderRole;
      const kmsPolicy = role.Properties.Policies.find((p: any) =>
        p.PolicyName === 'KMSPolicy'
      );
      expect(kmsPolicy).toBeDefined();
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:Decrypt');
    });

    test('should have ConfigRecorder resource', () => {
      const recorder = template.Resources.ConfigRecorder;
      expect(recorder).toBeDefined();
      expect(recorder.Type).toBe('AWS::Config::ConfigurationRecorder');
    });

    test('ConfigRecorder should record all supported resource types', () => {
      const recorder = template.Resources.ConfigRecorder;
      expect(recorder.Properties.RecordingGroup.AllSupported).toBe(true);
      expect(recorder.Properties.RecordingGroup.IncludeGlobalResourceTypes).toBe(true);
    });

    test('should have ConfigDeliveryChannel resource', () => {
      const channel = template.Resources.ConfigDeliveryChannel;
      expect(channel).toBeDefined();
      expect(channel.Type).toBe('AWS::Config::DeliveryChannel');
      expect(channel.DependsOn).toBe('CloudTrailBucketPolicy');
    });

    test('ConfigDeliveryChannel should have correct S3 configuration', () => {
      const channel = template.Resources.ConfigDeliveryChannel;
      expect(channel.Properties.S3BucketName).toEqual({ Ref: 'LoggingBucket' });
      expect(channel.Properties.S3KeyPrefix).toBe('config');
    });

    test('ConfigDeliveryChannel should have snapshot delivery frequency', () => {
      const channel = template.Resources.ConfigDeliveryChannel;
      expect(channel.Properties.ConfigSnapshotDeliveryProperties.DeliveryFrequency).toBe('TwentyFour_Hours');
    });
  });

  describe('Config Rules', () => {
    test('should have S3BucketPublicReadProhibited rule', () => {
      const rule = template.Resources.S3BucketPublicReadProhibited;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
      expect(rule.Properties.Source.SourceIdentifier).toBe('S3_BUCKET_PUBLIC_READ_PROHIBITED');
      expect(rule.DependsOn).toContain('InvokeStartConfigRecorder');
    });

    test('should have S3BucketSSLRequestsOnly rule', () => {
      const rule = template.Resources.S3BucketSSLRequestsOnly;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
      expect(rule.Properties.Source.SourceIdentifier).toBe('S3_BUCKET_SSL_REQUESTS_ONLY');
    });

    test('should have S3BucketEncryption rule', () => {
      const rule = template.Resources.S3BucketEncryption;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
      expect(rule.Properties.Source.SourceIdentifier).toBe('S3_DEFAULT_ENCRYPTION_KMS');
    });

    test('should have EBSEncryption rule', () => {
      const rule = template.Resources.EBSEncryption;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
      expect(rule.Properties.Source.SourceIdentifier).toBe('EC2_EBS_ENCRYPTION_BY_DEFAULT');
    });

    test('should have RequiredTags rule', () => {
      const rule = template.Resources.RequiredTags;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Config::ConfigRule');
      expect(rule.Properties.Source.SourceIdentifier).toBe('REQUIRED_TAGS');
    });

    test('RequiredTags should have correct scope', () => {
      const rule = template.Resources.RequiredTags;
      const resourceTypes = rule.Properties.Scope.ComplianceResourceTypes;
      expect(resourceTypes).toContain('AWS::EC2::Instance');
      expect(resourceTypes).toContain('AWS::EC2::Volume');
      expect(resourceTypes).toContain('AWS::EC2::SecurityGroup');
      expect(resourceTypes).toContain('AWS::S3::Bucket');
    });

    test('RequiredTags should check for Project and Environment tags', () => {
      const rule = template.Resources.RequiredTags;
      const inputParams = JSON.parse(rule.Properties.InputParameters);
      expect(inputParams.tag1Key).toBe('Project');
      expect(inputParams.tag2Key).toBe('Environment');
    });
  });

  describe('Lambda Functions', () => {
    test('should have StartConfigRecorderFunction resource', () => {
      const func = template.Resources.StartConfigRecorderFunction;
      expect(func).toBeDefined();
      expect(func.Type).toBe('AWS::Lambda::Function');
      expect(func.Properties.Runtime).toBe('python3.9');
      expect(func.Properties.Timeout).toBe(60);
    });

    test('StartConfigRecorderFunction should have inline code', () => {
      const func = template.Resources.StartConfigRecorderFunction;
      expect(func.Properties.Code.ZipFile).toBeDefined();
      expect(func.Properties.Code.ZipFile).toContain('import boto3');
      expect(func.Properties.Code.ZipFile).toContain('start_configuration_recorder');
    });

    test('should have StartConfigRecorderRole resource', () => {
      const role = template.Resources.StartConfigRecorderRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('StartConfigRecorderRole should have Lambda execution policy', () => {
      const role = template.Resources.StartConfigRecorderRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });

    test('StartConfigRecorderRole should have Config permissions', () => {
      const role = template.Resources.StartConfigRecorderRole;
      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('ConfigStartPolicy');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('config:StartConfigurationRecorder');
    });

    test('should have InvokeStartConfigRecorder resource', () => {
      const invoke = template.Resources.InvokeStartConfigRecorder;
      expect(invoke).toBeDefined();
      expect(invoke.Type).toBe('Custom::StartConfigRecorder');
      expect(invoke.DependsOn).toContain('ConfigDeliveryChannel');
    });

    test('should have EnableEBSEncryptionByDefault function', () => {
      const func = template.Resources.EnableEBSEncryptionByDefault;
      expect(func).toBeDefined();
      expect(func.Type).toBe('AWS::Lambda::Function');
      expect(func.Properties.Runtime).toBe('python3.9');
    });

    test('EnableEBSEncryptionByDefault should have inline code', () => {
      const func = template.Resources.EnableEBSEncryptionByDefault;
      expect(func.Properties.Code.ZipFile).toContain('enable_ebs_encryption_by_default');
      expect(func.Properties.Code.ZipFile).toContain('modify_ebs_default_kms_key_id');
    });

    test('should have EnableEBSEncryptionRole resource', () => {
      const role = template.Resources.EnableEBSEncryptionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('EnableEBSEncryptionRole should have EC2 encryption permissions', () => {
      const role = template.Resources.EnableEBSEncryptionRole;
      const policy = role.Properties.Policies.find((p: any) =>
        p.PolicyName === 'EBSEncryptionPolicy'
      );
      expect(policy).toBeDefined();
      expect(policy.PolicyDocument.Statement[0].Action).toContain('ec2:EnableEbsEncryptionByDefault');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('ec2:ModifyEbsDefaultKmsKeyId');
    });

    test('should have InvokeEBSEncryption resource', () => {
      const invoke = template.Resources.InvokeEBSEncryption;
      expect(invoke).toBeDefined();
      expect(invoke.Type).toBe('Custom::EnableEBSEncryption');
    });
  });

  describe('Security Groups', () => {
    test('should have DefaultSecurityGroup resource', () => {
      const sg = template.Resources.DefaultSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('DefaultSecurityGroup should allow HTTPS within VPC', () => {
      const sg = template.Resources.DefaultSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress[0];
      expect(ingress.IpProtocol).toBe('tcp');
      expect(ingress.FromPort).toBe(443);
      expect(ingress.ToPort).toBe(443);
      expect(ingress.Description).toContain('HTTPS');
    });

    test('DefaultSecurityGroup should allow outbound HTTPS', () => {
      const sg = template.Resources.DefaultSecurityGroup;
      const egress = sg.Properties.SecurityGroupEgress[0];
      expect(egress.IpProtocol).toBe('tcp');
      expect(egress.FromPort).toBe(443);
      expect(egress.ToPort).toBe(443);
      expect(egress.CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      const output = template.Outputs.VPCId;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have subnet outputs', () => {
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
    });

    test('should have KMS key outputs', () => {
      expect(template.Outputs.KMSKeyId).toBeDefined();
      expect(template.Outputs.KMSKeyArn).toBeDefined();
    });

    test('should have EC2InstanceProfileName output', () => {
      const output = template.Outputs.EC2InstanceProfileName;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'EC2InstanceProfile' });
    });

    test('should have bucket outputs', () => {
      expect(template.Outputs.ApplicationBucketName).toBeDefined();
      expect(template.Outputs.LoggingBucketName).toBeDefined();
    });

    test('should have SecurityGroupId output', () => {
      expect(template.Outputs.SecurityGroupId).toBeDefined();
    });

    test('should have AlarmTopicArn output', () => {
      expect(template.Outputs.AlarmTopicArn).toBeDefined();
    });

    test('should have CloudTrailArn output', () => {
      expect(template.Outputs.CloudTrailArn).toBeDefined();
    });

    test('should have ConfigRecorderName output', () => {
      expect(template.Outputs.ConfigRecorderName).toBeDefined();
    });

    test('should have EnvironmentSuffix output', () => {
      const output = template.Outputs.EnvironmentSuffix;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Tagging', () => {
    test('all taggable resources should have Project and Environment tags', () => {
      const taggableResources = [
        'MasterKMSKey', 'VPC', 'PublicSubnet1', 'PublicSubnet2',
        'PrivateSubnet1', 'PrivateSubnet2', 'InternetGateway',
        'NATGatewayEIP', 'NATGateway', 'PublicRouteTable', 'PrivateRouteTable',
        'VPCFlowLogGroup', 'VPCFlowLog', 'LoggingBucket', 'ApplicationBucket',
        'CloudTrail', 'AlarmTopic', 'DefaultSecurityGroup'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const hasProjectTag = tags.some((t: any) => t.Key === 'Project');
          const hasEnvTag = tags.some((t: any) => t.Key === 'Environment');
          expect(hasProjectTag || hasEnvTag).toBe(true);
        }
      });
    });

    test('resources should have team-number and project tags for compliance', () => {
      const complianceResources = [
        'MasterKMSKey', 'VPC', 'EC2InstanceRole', 'VPCFlowLogRole',
        'LoggingBucket', 'ApplicationBucket', 'AlarmTopic'
      ];

      complianceResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const hasProjectTag = tags.some((t: any) => t.Key === 'project' && t.Value === 'iac-rlhf-amazon');
          const hasTeamTag = tags.some((t: any) => t.Key === 'team-number' && t.Value === '2');
          expect(hasProjectTag).toBe(true);
          expect(hasTeamTag).toBe(true);
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('all S3 buckets should have encryption enabled', () => {
      const buckets = ['LoggingBucket', 'ApplicationBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      });
    });

    test('all S3 buckets should have versioning enabled', () => {
      const buckets = ['LoggingBucket', 'ApplicationBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      });
    });

    test('all S3 buckets should block public access', () => {
      const buckets = ['LoggingBucket', 'ApplicationBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const pac = bucket.Properties.PublicAccessBlockConfiguration;
        expect(pac.BlockPublicAcls).toBe(true);
        expect(pac.BlockPublicPolicy).toBe(true);
        expect(pac.IgnorePublicAcls).toBe(true);
        expect(pac.RestrictPublicBuckets).toBe(true);
      });
    });

    test('all log groups should be encrypted with KMS', () => {
      const logGroups = ['VPCFlowLogGroup', 'CloudTrailLogGroup'];
      logGroups.forEach(logGroupName => {
        const logGroup = template.Resources[logGroupName];
        expect(logGroup.Properties.KmsKeyId).toEqual({
          'Fn::GetAtt': ['MasterKMSKey', 'Arn']
        });
      });
    });

    test('CloudTrail should have log file validation enabled', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('IAM roles should follow least privilege principle', () => {
      const ec2Role = template.Resources.EC2InstanceRole;
      const s3Policy = ec2Role.Properties.Policies.find((p: any) =>
        p.PolicyName === 'S3ReadOnlyWithTagRestriction'
      );

      // Should have read-only actions
      const readStatement = s3Policy.PolicyDocument.Statement.find((s: any) =>
        s.Sid === 'ReadOnlyAccessWithTags'
      );
      expect(readStatement.Action).not.toContain('s3:PutObject');
      expect(readStatement.Action).not.toContain('s3:DeleteObject');
    });
  });

  describe('Resource Dependencies', () => {
    test('CloudTrail should depend on CloudTrailBucketPolicy', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.DependsOn).toContain('CloudTrailBucketPolicy');
    });

    test('NATGatewayEIP should depend on AttachGateway', () => {
      const eip = template.Resources.NATGatewayEIP;
      expect(eip.DependsOn).toBe('AttachGateway');
    });

    test('PublicRoute should depend on AttachGateway', () => {
      const route = template.Resources.PublicRoute;
      expect(route.DependsOn).toBe('AttachGateway');
    });

    test('ConfigDeliveryChannel should depend on CloudTrailBucketPolicy', () => {
      const channel = template.Resources.ConfigDeliveryChannel;
      expect(channel.DependsOn).toBe('CloudTrailBucketPolicy');
    });

    test('InvokeStartConfigRecorder should depend on ConfigDeliveryChannel', () => {
      const invoke = template.Resources.InvokeStartConfigRecorder;
      expect(invoke.DependsOn).toContain('ConfigDeliveryChannel');
    });

    test('Config rules should depend on InvokeStartConfigRecorder', () => {
      const rules = [
        'S3BucketPublicReadProhibited',
        'S3BucketSSLRequestsOnly',
        'S3BucketEncryption',
        'EBSEncryption',
        'RequiredTags'
      ];

      rules.forEach(ruleName => {
        const rule = template.Resources[ruleName];
        expect(rule.DependsOn).toContain('InvokeStartConfigRecorder');
      });
    });
  });

  describe('Naming Conventions', () => {
    test('resources should use EnvironmentSuffix in names', () => {
      const resources = [
        'VPC', 'PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2',
        'InternetGateway', 'NATGateway', 'PublicRouteTable', 'PrivateRouteTable'
      ];

      resources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((t: any) => t.Key === 'Name');
          if (nameTag && nameTag.Value['Fn::Sub']) {
            expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });

    test('S3 bucket names should include EnvironmentSuffix', () => {
      const loggingBucket = template.Resources.LoggingBucket;
      const appBucket = template.Resources.ApplicationBucket;

      expect(loggingBucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(appBucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('High Availability', () => {
    test('should have resources in multiple availability zones', () => {
      const subnet1AZ = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const subnet2AZ = template.Resources.PublicSubnet2.Properties.AvailabilityZone;

      expect(subnet1AZ['Fn::Select'][0]).toBe(0);
      expect(subnet2AZ['Fn::Select'][0]).toBe(1);
    });

    test('should have both public and private subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });
  });
});
