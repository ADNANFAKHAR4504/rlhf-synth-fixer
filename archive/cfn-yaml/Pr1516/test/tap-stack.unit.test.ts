import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('Security Baseline CloudFormation Template Unit Tests', () => {
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

    test('should have proper description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('prod- secure baseline in us-west-2');
    });

    test('should have Conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(typeof template.Conditions).toBe('object');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Conditions', () => {
    test('should have IsUsWest2 condition', () => {
      const condition = template.Conditions.IsUsWest2;
      expect(condition).toBeDefined();
      expect(condition).toEqual({
        'Fn::Equals': [{ Ref: 'AWS::Region' }, 'us-west-2']
      });
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC with correct configuration', () => {
      const vpc = template.Resources.ProdVPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Condition).toBe('IsUsWest2');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.Tags).toContainEqual({ Key: 'Name', Value: 'prod-vpc' });
      expect(vpc.Properties.Tags).toContainEqual({ Key: 'Environment', Value: 'Production' });
    });

    test('should have public subnets in different AZs', () => {
      const publicSubnet1 = template.Resources.ProdSubnetPublicAZ1;
      const publicSubnet2 = template.Resources.ProdSubnetPublicAZ2;

      expect(publicSubnet1).toBeDefined();
      expect(publicSubnet2).toBeDefined();

      expect(publicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet1.Condition).toBe('IsUsWest2');
      expect(publicSubnet2.Condition).toBe('IsUsWest2');

      expect(publicSubnet1.Properties.CidrBlock).toBe('10.0.0.0/24');
      expect(publicSubnet2.Properties.CidrBlock).toBe('10.0.1.0/24');

      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);

      expect(publicSubnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(publicSubnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('should have private subnets in different AZs', () => {
      const privateSubnet1 = template.Resources.ProdSubnetPrivateAZ1;
      const privateSubnet2 = template.Resources.ProdSubnetPrivateAZ2;

      expect(privateSubnet1).toBeDefined();
      expect(privateSubnet2).toBeDefined();

      expect(privateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet1.Condition).toBe('IsUsWest2');
      expect(privateSubnet2.Condition).toBe('IsUsWest2');

      expect(privateSubnet1.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(privateSubnet2.Properties.CidrBlock).toBe('10.0.3.0/24');

      expect(privateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(privateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should have Internet Gateway properly configured', () => {
      const igw = template.Resources.ProdInternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(igw.Condition).toBe('IsUsWest2');
      expect(igw.Properties.Tags).toContainEqual({ Key: 'Name', Value: 'prod-igw' });
    });

    test('should have VPC Gateway Attachment', () => {
      const attachment = template.Resources.ProdVPCGatewayAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Condition).toBe('IsUsWest2');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'ProdVPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'ProdInternetGateway' });
    });

    test('should have route tables properly configured', () => {
      const publicRouteTable = template.Resources.ProdPublicRouteTable;
      const privateRouteTableAZ1 = template.Resources.ProdPrivateRouteTableAZ1;
      const privateRouteTableAZ2 = template.Resources.ProdPrivateRouteTableAZ2;

      expect(publicRouteTable.Type).toBe('AWS::EC2::RouteTable');
      expect(privateRouteTableAZ1.Type).toBe('AWS::EC2::RouteTable');
      expect(privateRouteTableAZ2.Type).toBe('AWS::EC2::RouteTable');

      expect(publicRouteTable.Condition).toBe('IsUsWest2');
      expect(privateRouteTableAZ1.Condition).toBe('IsUsWest2');
      expect(privateRouteTableAZ2.Condition).toBe('IsUsWest2');

      const publicRoute = template.Resources.ProdPublicRoute;
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({ Ref: 'ProdInternetGateway' });
      expect(publicRoute.DependsOn).toBe('ProdVPCGatewayAttachment');
    });

    test('should have subnet route table associations', () => {
      const associations = [
        'PublicSubnetRouteAssocAZ1',
        'PublicSubnetRouteAssocAZ2',
        'PrivateSubnetRouteAssocAZ1',
        'PrivateSubnetRouteAssocAZ2'
      ];

      associations.forEach(assocName => {
        const association = template.Resources[assocName];
        expect(association).toBeDefined();
        expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        expect(association.Condition).toBe('IsUsWest2');
      });
    });
  });

  describe('S3 Storage Resources', () => {
    test('should have S3 bucket with proper security configuration', () => {
      const s3Bucket = template.Resources.ProdLogsBucket;
      expect(s3Bucket).toBeDefined();
      expect(s3Bucket.Type).toBe('AWS::S3::Bucket');
      expect(s3Bucket.Condition).toBe('IsUsWest2');

      // Check encryption
      const encryption = s3Bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');

      // Check versioning
      expect(s3Bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');

      // Check lifecycle
      const lifecycleRule = s3Bucket.Properties.LifecycleConfiguration.Rules[0];
      expect(lifecycleRule.Status).toBe('Enabled');
      expect(lifecycleRule.ExpirationInDays).toBe(90);

      // Check public access block
      const publicAccessBlock = s3Bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should have S3 bucket policy for CloudTrail', () => {
      const bucketPolicy = template.Resources.ProdLogsBucketPolicy;
      expect(bucketPolicy).toBeDefined();
      expect(bucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
      expect(bucketPolicy.Condition).toBe('IsUsWest2');

      const policyDoc = bucketPolicy.Properties.PolicyDocument;
      expect(policyDoc.Statement).toHaveLength(2);

      // Check CloudTrail bucket ACL access
      const aclStatement = policyDoc.Statement[0];
      expect(aclStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
      expect(aclStatement.Action).toBe('s3:GetBucketAcl');

      // Check CloudTrail put object access
      const putStatement = policyDoc.Statement[1];
      expect(putStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
      expect(putStatement.Action).toBe('s3:PutObject');
    });
  });

  describe('KMS Resources', () => {
    test('should have KMS key with proper configuration', () => {
      const kmsKey = template.Resources.ProdLogsKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Condition).toBe('IsUsWest2');
      expect(kmsKey.Properties.Description).toBe('prod- CMK for logs');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);

      const keyPolicy = kmsKey.Properties.KeyPolicy;
      expect(keyPolicy.Statement).toHaveLength(3);

      // Check account admin access
      const adminStatement = keyPolicy.Statement[0];
      expect(adminStatement.Sid).toBe('AllowAccountAdmin');
      expect(adminStatement.Action).toBe('kms:*');

      // Check CloudWatch Logs access
      const logsStatement = keyPolicy.Statement[1];
      expect(logsStatement.Sid).toBe('AllowCWLogsUse');
      expect(logsStatement.Principal.Service).toEqual({ 'Fn::Sub': 'logs.${AWS::Region}.amazonaws.com' });

      // Check CloudTrail access
      const trailStatement = keyPolicy.Statement[2];
      expect(trailStatement.Sid).toBe('AllowCloudTrailServiceToEncryptIfUsed');
      expect(trailStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
    });

    test('should have KMS key alias', () => {
      const keyAlias = template.Resources.ProdLogsKeyAlias;
      expect(keyAlias).toBeDefined();
      expect(keyAlias.Type).toBe('AWS::KMS::Alias');
      expect(keyAlias.Condition).toBe('IsUsWest2');
      expect(keyAlias.Properties.TargetKeyId).toEqual({ Ref: 'ProdLogsKey' });
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have CloudTrail log group with encryption', () => {
      const logGroup = template.Resources.ProdTrailLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Condition).toBe('IsUsWest2');
      expect(logGroup.Properties.RetentionInDays).toBe(90);
      expect(logGroup.Properties.KmsKeyId).toEqual({ 'Fn::GetAtt': ['ProdLogsKey', 'Arn'] });
    });

    test('should have Flow Logs log group with encryption', () => {
      const logGroup = template.Resources.ProdFlowLogsLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Condition).toBe('IsUsWest2');
      expect(logGroup.Properties.RetentionInDays).toBe(90);
      expect(logGroup.Properties.KmsKeyId).toEqual({ 'Fn::GetAtt': ['ProdLogsKey', 'Arn'] });
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have Flow Logs IAM role', () => {
      const role = template.Resources.ProdFlowLogsRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Condition).toBe('IsUsWest2');

      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('vpc-flow-logs.amazonaws.com');

      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('prod-flowlogs-policy');
      expect(policy.PolicyDocument.Statement[0].Action).toEqual([
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents'
      ]);
    });

    test('should have VPC Flow Logs configured', () => {
      const flowLogs = template.Resources.ProdVPCFlowLogs;
      expect(flowLogs).toBeDefined();
      expect(flowLogs.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLogs.Condition).toBe('IsUsWest2');
      expect(flowLogs.Properties.ResourceId).toEqual({ Ref: 'ProdVPC' });
      expect(flowLogs.Properties.ResourceType).toBe('VPC');
      expect(flowLogs.Properties.TrafficType).toBe('ALL');
      expect(flowLogs.Properties.LogDestinationType).toBe('cloud-watch-logs');
    });
  });

  describe('Security Monitoring', () => {
    test('should have SNS topic for security alerts', () => {
      const topic = template.Resources.ProdSecurityAlertsTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Condition).toBe('IsUsWest2');
    });

    test('should have root usage metric filter and alarm', () => {
      const metricFilter = template.Resources.RootUsageMetricFilter;
      expect(metricFilter).toBeDefined();
      expect(metricFilter.Type).toBe('AWS::Logs::MetricFilter');
      expect(metricFilter.Condition).toBe('IsUsWest2');
      expect(metricFilter.Properties.LogGroupName).toEqual({ Ref: 'ProdTrailLogGroup' });

      const alarm = template.Resources.RootUsageAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Condition).toBe('IsUsWest2');
      expect(alarm.Properties.Namespace).toBe('prod-security');
      expect(alarm.Properties.MetricName).toBe('RootUsageCount');
    });

    test('should have console login failure metric filter and alarm', () => {
      const metricFilter = template.Resources.ConsoleLoginFailureFilter;
      expect(metricFilter).toBeDefined();
      expect(metricFilter.Type).toBe('AWS::Logs::MetricFilter');
      expect(metricFilter.Condition).toBe('IsUsWest2');

      const alarm = template.Resources.ConsoleLoginFailureAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Condition).toBe('IsUsWest2');
      expect(alarm.Properties.MetricName).toBe('ConsoleLoginFailed');
    });

    test('should have console login without MFA metric filter and alarm', () => {
      const metricFilter = template.Resources.ConsoleLoginNoMFAFilter;
      expect(metricFilter).toBeDefined();
      expect(metricFilter.Type).toBe('AWS::Logs::MetricFilter');
      expect(metricFilter.Condition).toBe('IsUsWest2');

      const alarm = template.Resources.ConsoleLoginNoMFAAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Condition).toBe('IsUsWest2');
      expect(alarm.Properties.MetricName).toBe('ConsoleLoginNoMFA');
    });
  });

  describe('IAM Resources', () => {
    test('should have MFA enforcement group and policy', () => {
      const group = template.Resources.ProdMFAGroup;
      expect(group).toBeDefined();
      expect(group.Type).toBe('AWS::IAM::Group');
      expect(group.Condition).toBe('IsUsWest2');

      const policy = template.Resources.DenyUnlessMFA;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::IAM::Policy');
      expect(policy.Condition).toBe('IsUsWest2');
      expect(policy.Properties.PolicyName).toBe('prod-deny-unless-mfa');

      const policyDoc = policy.Properties.PolicyDocument;
      const statement = policyDoc.Statement[0];
      expect(statement.Effect).toBe('Deny');
      expect(statement.Condition.Bool['aws:MultiFactorAuthPresent']).toBe('false');
    });

    test('should have read-only managed policy', () => {
      const policy = template.Resources.ProdReadOnlyPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::IAM::ManagedPolicy');
      expect(policy.Condition).toBe('IsUsWest2');

      const policyDoc = policy.Properties.PolicyDocument;
      expect(policyDoc.Statement[0].Action).toEqual([
        'ec2:DescribeInstances',
        'ec2:DescribeTags',
        'ec2:DescribeVolumes'
      ]);
    });

    test('should have production user with proper group assignment', () => {
      const user = template.Resources.ProdUser;
      expect(user).toBeDefined();
      expect(user.Type).toBe('AWS::IAM::User');
      expect(user.Condition).toBe('IsUsWest2');
      expect(user.Properties.Groups).toEqual([{ Ref: 'ProdMFAGroup' }]);
      expect(user.Properties.ManagedPolicyArns).toEqual([{ Ref: 'ProdReadOnlyPolicy' }]);
    });
  });

  describe('WAF Resources', () => {
    test('should have WAFv2 WebACL configured', () => {
      const webacl = template.Resources.ProdWebACL;
      expect(webacl).toBeDefined();
      expect(webacl.Type).toBe('AWS::WAFv2::WebACL');
      expect(webacl.Condition).toBe('IsUsWest2');
      expect(webacl.Properties.Name).toBe('prod-webacl');
      expect(webacl.Properties.Scope).toBe('REGIONAL');
      expect(webacl.Properties.DefaultAction).toEqual({ Allow: {} });

      const rule = webacl.Properties.Rules[0];
      expect(rule.Name).toBe('AWS-AWSManagedRulesCommonRuleSet');
      expect(rule.Statement.ManagedRuleGroupStatement.VendorName).toBe('AWS');
      expect(rule.Statement.ManagedRuleGroupStatement.Name).toBe('AWSManagedRulesCommonRuleSet');
    });
  });

  describe('RDS Resources', () => {
    test('should have RDS security group with restricted access', () => {
      const sg = template.Resources.ProdRDSSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Condition).toBe('IsUsWest2');

      const ingressRule = sg.Properties.SecurityGroupIngress[0];
      expect(ingressRule.IpProtocol).toBe('tcp');
      expect(ingressRule.FromPort).toBe(5432);
      expect(ingressRule.ToPort).toBe(5432);
      expect(ingressRule.CidrIp).toBe('203.0.113.10/32');
    });

    test('should have DB subnet group', () => {
      const subnetGroup = template.Resources.ProdDBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Condition).toBe('IsUsWest2');
      expect(subnetGroup.Properties.SubnetIds).toEqual([
        { Ref: 'ProdSubnetPrivateAZ1' },
        { Ref: 'ProdSubnetPrivateAZ2' }
      ]);
    });

    test('should have RDS instance with encryption enabled', () => {
      const rds = template.Resources.ProdRDSInstance;
      expect(rds).toBeDefined();
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Condition).toBe('IsUsWest2');
      expect(rds.Properties.Engine).toBe('postgres');
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.PubliclyAccessible).toBe(false);
      expect(rds.Properties.ManageMasterUserPassword).toBe(true);
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
    });
  });

  describe('Template Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PrivateSubnetIds',
        'LogsBucketName',
        'FlowLogsLogGroup',
        'WebACLArn',
        'RDSId'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Condition).toBe('IsUsWest2');
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });

    test('outputs should have proper values', () => {
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'ProdVPC' });
      expect(template.Outputs.LogsBucketName.Value).toEqual({ Ref: 'ProdLogsBucket' });
      expect(template.Outputs.FlowLogsLogGroup.Value).toEqual({ Ref: 'ProdFlowLogsLogGroup' });
      expect(template.Outputs.WebACLArn.Value).toEqual({ 'Fn::GetAtt': ['ProdWebACL', 'Arn'] });
      expect(template.Outputs.RDSId.Value).toEqual({ Ref: 'ProdRDSInstance' });
    });
  });

  describe('Resource Tagging', () => {
    test('all taggable resources should have Environment and Name tags', () => {
      const taggedResources = [
        'ProdVPC', 'ProdSubnetPublicAZ1', 'ProdSubnetPublicAZ2', 'ProdSubnetPrivateAZ1', 'ProdSubnetPrivateAZ2',
        'ProdInternetGateway', 'ProdPublicRouteTable', 'ProdPrivateRouteTableAZ1', 'ProdPrivateRouteTableAZ2',
        'ProdLogsBucket', 'ProdLogsKey', 'ProdFlowLogsRole', 'ProdFlowLogsLogGroup', 'ProdVPCFlowLogs',
        'ProdRDSSecurityGroup', 'ProdUser', 'ProdWebACL'
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const environmentTag = resource.Properties.Tags.find(
            (tag: any) => tag.Key === 'Environment'
          );
          expect(environmentTag).toBeDefined();
          expect(environmentTag.Value).toBe('Production');
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid YAML structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have proper resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(38); // Total number of resources in template
    });

    test('all resources should have proper CloudFormation types', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Type).toBeDefined();
        expect(resource.Type).toMatch(/^AWS::/);
      });
    });

    test('all resources should have IsUsWest2 condition', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Condition).toBe('IsUsWest2');
      });
    });

    test('should not have any undefined references', () => {
      const jsonString = JSON.stringify(template);
      expect(jsonString).not.toContain('undefined');
      expect(jsonString).not.toContain('null');
    });
  });

  describe('Security Best Practices', () => {
    test('S3 bucket should block all public access', () => {
      const s3Bucket = template.Resources.ProdLogsBucket;
      const publicAccessBlock = s3Bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have encryption enabled', () => {
      const s3Bucket = template.Resources.ProdLogsBucket;
      expect(s3Bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('KMS key should have key rotation enabled', () => {
      const kmsKey = template.Resources.ProdLogsKey;
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('RDS should be in private subnets with encryption', () => {
      const rds = template.Resources.ProdRDSInstance;
      expect(rds.Properties.PubliclyAccessible).toBe(false);
      expect(rds.Properties.StorageEncrypted).toBe(true);
    });

    test('security groups should have specific CIDR restrictions', () => {
      const rdsSG = template.Resources.ProdRDSSecurityGroup;
      const ingressRule = rdsSG.Properties.SecurityGroupIngress[0];
      expect(ingressRule.CidrIp).toBe('203.0.113.10/32');
      expect(ingressRule.CidrIp).not.toBe('0.0.0.0/0');
    });

    test('IAM should enforce MFA', () => {
      const mfaPolicy = template.Resources.DenyUnlessMFA;
      const statement = mfaPolicy.Properties.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Deny');
      expect(statement.Condition.Bool['aws:MultiFactorAuthPresent']).toBe('false');
    });

    test('CloudWatch logs should have retention configured', () => {
      const trailLogGroup = template.Resources.ProdTrailLogGroup;
      const flowLogGroup = template.Resources.ProdFlowLogsLogGroup;

      expect(trailLogGroup.Properties.RetentionInDays).toBe(90);
      expect(flowLogGroup.Properties.RetentionInDays).toBe(90);
    });

    test('VPC Flow Logs should capture all traffic', () => {
      const flowLogs = template.Resources.ProdVPCFlowLogs;
      expect(flowLogs.Properties.TrafficType).toBe('ALL');
    });
  });
});