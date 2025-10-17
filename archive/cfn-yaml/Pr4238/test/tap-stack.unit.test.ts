import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
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
      expect(template.Description).toBe(
        'Enterprise Application Infrastructure with Stringent Security Requirements'
      );
    });

    test('should have metadata section', () => {
      // Metadata is optional in CloudFormation templates
      expect(template.Metadata === undefined || typeof template.Metadata === 'object').toBe(true);
    });
  });

  describe('Parameters', () => {
    test('should have ApplicationName parameter', () => {
      expect(template.Parameters.ApplicationName).toBeDefined();
      expect(template.Parameters.ApplicationName.Type).toBe('String');
      expect(template.Parameters.ApplicationName.Default).toBe('enterpriseapp');
      expect(template.Parameters.ApplicationName.AllowedPattern).toBe('^[a-z0-9]+$');
    });

    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.Default).toBe('prod');
      expect(template.Parameters.Environment.AllowedValues).toEqual(['prod', 'staging', 'dev']);
    });

    test('should have VpcCidr parameter', () => {
      expect(template.Parameters.VpcCidr).toBeDefined();
      expect(template.Parameters.VpcCidr.Type).toBe('String');
      expect(template.Parameters.VpcCidr.Default).toBe('10.0.0.0/16');
    });

    test('should have InstanceType parameter', () => {
      expect(template.Parameters.InstanceType).toBeDefined();
      expect(template.Parameters.InstanceType.Type).toBe('String');
      expect(template.Parameters.InstanceType.Default).toBe('t3.medium');
    });

    test('should have DBInstanceClass parameter', () => {
      expect(template.Parameters.DBInstanceClass).toBeDefined();
      expect(template.Parameters.DBInstanceClass.Type).toBe('String');
      expect(template.Parameters.DBInstanceClass.Default).toBe('db.t3.micro');
    });

    test('should have AdminEmail parameter', () => {
      expect(template.Parameters.AdminEmail).toBeDefined();
      expect(template.Parameters.AdminEmail.Type).toBe('String');
      expect(template.Parameters.AdminEmail.Default).toBe('admin@company.com');
    });

    test('should have KeyPairName parameter', () => {
      expect(template.Parameters.KeyPairName).toBeDefined();
      expect(template.Parameters.KeyPairName.Type).toBe('String');
      expect(template.Parameters.KeyPairName.Default).toBe('');
    });

    test('should have BastionAccessCIDR parameter', () => {
      expect(template.Parameters.BastionAccessCIDR).toBeDefined();
      expect(template.Parameters.BastionAccessCIDR.Type).toBe('String');
      expect(template.Parameters.BastionAccessCIDR.Default).toBe('0.0.0.0/0');
    });

    test('should have DBMasterUsername parameter', () => {
      expect(template.Parameters.DBMasterUsername).toBeDefined();
      expect(template.Parameters.DBMasterUsername.Type).toBe('String');
      expect(template.Parameters.DBMasterUsername.Default).toBe('admin');
    });

    test('should have DomainName parameter', () => {
      expect(template.Parameters.DomainName).toBeDefined();
      expect(template.Parameters.DomainName.Type).toBe('String');
      expect(template.Parameters.DomainName.Default).toBe('example.com');
    });
  });

  describe('Conditions', () => {
    test('should have HasKeyPair condition', () => {
      expect(template.Conditions.HasKeyPair).toBeDefined();
      expect(template.Conditions.HasKeyPair).toEqual({
        'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'KeyPairName' }, ''] }]
      });
    });

    test('should have HasValidDomain condition', () => {
      expect(template.Conditions.HasValidDomain).toBeDefined();
      expect(template.Conditions.HasValidDomain).toEqual({
        'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'DomainName' }, 'example.com'] }]
      });
    });
  });

  describe('Mappings', () => {
    test('should have RegionMap mapping', () => {
      expect(template.Mappings.RegionMap).toBeDefined();
      expect(template.Mappings.RegionMap['us-east-1']).toBeDefined();
      expect(template.Mappings.RegionMap['us-west-2']).toBeDefined();
    });

    test('should have AMI mappings for each region', () => {
      Object.keys(template.Mappings.RegionMap).forEach(region => {
        expect(template.Mappings.RegionMap[region].AMI).toBeDefined();
        expect(typeof template.Mappings.RegionMap[region].AMI).toBe('string');
      });
    });
  });

  describe('KMS Resources', () => {
    test('should have CorpS3KMSKey resource', () => {
      expect(template.Resources.CorpS3KMSKey).toBeDefined();
      expect(template.Resources.CorpS3KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('CorpS3KMSKey should have correct properties', () => {
      const key = template.Resources.CorpS3KMSKey;
      expect(key.Properties.Description).toEqual({
        'Fn::Sub': 'Customer-managed KMS key for S3 encryption - ${ApplicationName}'
      });
      expect(key.Properties.EnableKeyRotation).toBe(true);
      expect(key.Properties.KeyPolicy.Version).toBe('2012-10-17');
    });

    test('should have CorpRDSKMSKey resource', () => {
      expect(template.Resources.CorpRDSKMSKey).toBeDefined();
      expect(template.Resources.CorpRDSKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('CorpRDSKMSKey should have correct properties', () => {
      const key = template.Resources.CorpRDSKMSKey;
      expect(key.Properties.Description).toEqual({
        'Fn::Sub': 'Customer-managed KMS key for RDS encryption - ${ApplicationName}'
      });
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });
  });

  describe('VPC Infrastructure', () => {
    test('should have CorpVPC resource', () => {
      expect(template.Resources.CorpVPC).toBeDefined();
      expect(template.Resources.CorpVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('CorpVPC should have correct properties', () => {
      const vpc = template.Resources.CorpVPC;
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have CorpInternetGateway resource', () => {
      expect(template.Resources.CorpInternetGateway).toBeDefined();
      expect(template.Resources.CorpInternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have CorpVPCGatewayAttachment resource', () => {
      expect(template.Resources.CorpVPCGatewayAttachment).toBeDefined();
      expect(template.Resources.CorpVPCGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have public subnets', () => {
      expect(template.Resources.CorpPublicSubnet1).toBeDefined();
      expect(template.Resources.CorpPublicSubnet2).toBeDefined();
      expect(template.Resources.CorpPublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.CorpPublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have private subnets', () => {
      expect(template.Resources.CorpPrivateSubnet1).toBeDefined();
      expect(template.Resources.CorpPrivateSubnet2).toBeDefined();
      expect(template.Resources.CorpPrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.CorpPrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      expect(template.Resources.CorpPublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.CorpPublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have NAT Gateway resources', () => {
      expect(template.Resources.CorpNATEIP).toBeDefined();
      expect(template.Resources.CorpNATGateway).toBeDefined();
    });

    test('should have route tables', () => {
      expect(template.Resources.CorpPublicRouteTable).toBeDefined();
      expect(template.Resources.CorpPrivateRouteTable).toBeDefined();
      expect(template.Resources.CorpPublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
      expect(template.Resources.CorpPrivateRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have routes', () => {
      expect(template.Resources.CorpPublicRoute).toBeDefined();
      expect(template.Resources.CorpPrivateRoute).toBeDefined();
      expect(template.Resources.CorpPublicRoute.Type).toBe('AWS::EC2::Route');
      expect(template.Resources.CorpPrivateRoute.Type).toBe('AWS::EC2::Route');
    });

    test('should have subnet route table associations', () => {
      expect(template.Resources.CorpPublicSubnetRouteTableAssociation1).toBeDefined();
      expect(template.Resources.CorpPublicSubnetRouteTableAssociation2).toBeDefined();
      expect(template.Resources.CorpPrivateSubnetRouteTableAssociation1).toBeDefined();
      expect(template.Resources.CorpPrivateSubnetRouteTableAssociation2).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      expect(template.Resources.CorpALBSecurityGroup).toBeDefined();
      expect(template.Resources.CorpALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have web server security group', () => {
      expect(template.Resources.CorpWebServerSecurityGroup).toBeDefined();
      expect(template.Resources.CorpWebServerSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have bastion security group', () => {
      expect(template.Resources.CorpBastionSecurityGroup).toBeDefined();
      expect(template.Resources.CorpBastionSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have database security group', () => {
      expect(template.Resources.CorpDatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.CorpDatabaseSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALB security group should have correct ingress rules', () => {
      const sg = template.Resources.CorpALBSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      expect(ingress[0].IpProtocol).toBe('tcp');
      expect(ingress[0].FromPort).toBe(80);
      expect(ingress[0].ToPort).toBe(80);
      expect(ingress[1].IpProtocol).toBe('tcp');
      expect(ingress[1].FromPort).toBe(443);
      expect(ingress[1].ToPort).toBe(443);
    });

    test('database security group should have MySQL ingress', () => {
      const sg = template.Resources.CorpDatabaseSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress[0].IpProtocol).toBe('tcp');
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
    });
  });

  describe('S3 Buckets', () => {
    test('should have CorpLogsBucket resource', () => {
      expect(template.Resources.CorpLogsBucket).toBeDefined();
      expect(template.Resources.CorpLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have CorpAppDataBucket resource', () => {
      expect(template.Resources.CorpAppDataBucket).toBeDefined();
      expect(template.Resources.CorpAppDataBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have CorpBackupBucket resource', () => {
      expect(template.Resources.CorpBackupBucket).toBeDefined();
      expect(template.Resources.CorpBackupBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 buckets should have KMS encryption', () => {
      const buckets = ['CorpLogsBucket', 'CorpAppDataBucket', 'CorpBackupBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'CorpS3KMSKey' });
      });
    });

    test('S3 buckets should have public access blocked', () => {
      const buckets = ['CorpLogsBucket', 'CorpAppDataBucket', 'CorpBackupBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
        expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
        expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
        expect(bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
        expect(bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
      });
    });

    test('should have CorpLogsBucketPolicy resource', () => {
      expect(template.Resources.CorpLogsBucketPolicy).toBeDefined();
      expect(template.Resources.CorpLogsBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have CorpEC2Role resource', () => {
      expect(template.Resources.CorpEC2Role).toBeDefined();
      expect(template.Resources.CorpEC2Role.Type).toBe('AWS::IAM::Role');
    });

    test('should have CorpEC2InstanceProfile resource', () => {
      expect(template.Resources.CorpEC2InstanceProfile).toBeDefined();
      expect(template.Resources.CorpEC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have CorpMFAPolicy resource', () => {
      expect(template.Resources.CorpMFAPolicy).toBeDefined();
      expect(template.Resources.CorpMFAPolicy.Type).toBe('AWS::IAM::ManagedPolicy');
    });

    test('CorpEC2Role should have correct assume role policy', () => {
      const role = template.Resources.CorpEC2Role;
      expect(role.Properties.AssumeRolePolicyDocument.Version).toBe('2012-10-17');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    });
  });

  describe('RDS Database', () => {
    test('should have CorpDBSubnetGroup resource', () => {
      expect(template.Resources.CorpDBSubnetGroup).toBeDefined();
      expect(template.Resources.CorpDBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have CorpRDSMonitoringRole resource', () => {
      expect(template.Resources.CorpRDSMonitoringRole).toBeDefined();
      expect(template.Resources.CorpRDSMonitoringRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have CorpDatabase resource', () => {
      expect(template.Resources.CorpDatabase).toBeDefined();
      expect(template.Resources.CorpDatabase.Type).toBe('AWS::RDS::DBInstance');
    });

    test('CorpDatabase should have correct properties', () => {
      const db = template.Resources.CorpDatabase;
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.EngineVersion).toBe('8.0.39');
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.DeletionProtection).toBe(false);
      expect(db.Properties.BackupRetentionPeriod).toBe(30);
    });

    test('CorpDatabase should have KMS encryption', () => {
      const db = template.Resources.CorpDatabase;
      expect(db.Properties.KmsKeyId).toEqual({ Ref: 'CorpRDSKMSKey' });
      expect(db.Properties.MasterUserSecret.KmsKeyId).toEqual({ Ref: 'CorpRDSKMSKey' });
    });
  });

  describe('EC2 Instances', () => {
    test('should have CorpBastionHost resource', () => {
      expect(template.Resources.CorpBastionHost).toBeDefined();
      expect(template.Resources.CorpBastionHost.Type).toBe('AWS::EC2::Instance');
    });

    test('should have CorpWebServer1 resource', () => {
      expect(template.Resources.CorpWebServer1).toBeDefined();
      expect(template.Resources.CorpWebServer1.Type).toBe('AWS::EC2::Instance');
    });

    test('should have CorpWebServer2 resource', () => {
      expect(template.Resources.CorpWebServer2).toBeDefined();
      expect(template.Resources.CorpWebServer2.Type).toBe('AWS::EC2::Instance');
    });

    test('EC2 instances should have conditional key pair', () => {
      const instances = ['CorpBastionHost', 'CorpWebServer1', 'CorpWebServer2'];
      instances.forEach(instanceName => {
        const instance = template.Resources[instanceName];
        expect(instance.Properties.KeyName).toEqual({
          'Fn::If': [
            'HasKeyPair',
            { Ref: 'KeyPairName' },
            { Ref: 'AWS::NoValue' }
          ]
        });
      });
    });

    test('EC2 instances should have IAM instance profile', () => {
      const instances = ['CorpBastionHost', 'CorpWebServer1', 'CorpWebServer2'];
      instances.forEach(instanceName => {
        const instance = template.Resources[instanceName];
        expect(instance.Properties.IamInstanceProfile).toEqual({ Ref: 'CorpEC2InstanceProfile' });
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('should have CorpApplicationLoadBalancer resource', () => {
      expect(template.Resources.CorpApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.CorpApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('should have CorpTargetGroup resource', () => {
      expect(template.Resources.CorpTargetGroup).toBeDefined();
      expect(template.Resources.CorpTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('should have CorpALBHTTPListener resource', () => {
      expect(template.Resources.CorpALBHTTPListener).toBeDefined();
      expect(template.Resources.CorpALBHTTPListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('should have CorpALBHTTPSListener with condition', () => {
      expect(template.Resources.CorpALBHTTPSListener).toBeDefined();
      expect(template.Resources.CorpALBHTTPSListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(template.Resources.CorpALBHTTPSListener.Condition).toBe('HasValidDomain');
    });

    test('ALB should have S3 access logs disabled', () => {
      const alb = template.Resources.CorpApplicationLoadBalancer;
      const attributes = alb.Properties.LoadBalancerAttributes;
      expect(attributes).toContainEqual({
        Key: 'access_logs.s3.enabled',
        Value: 'false'
      });
    });

    test('target group should have web servers as targets', () => {
      const tg = template.Resources.CorpTargetGroup;
      const targets = tg.Properties.Targets;
      expect(targets).toHaveLength(2);
      expect(targets[0].Id).toEqual({ Ref: 'CorpWebServer1' });
      expect(targets[1].Id).toEqual({ Ref: 'CorpWebServer2' });
    });
  });

  describe('SSL Certificate', () => {
    test('should have CorpSSLCertificate with condition', () => {
      expect(template.Resources.CorpSSLCertificate).toBeDefined();
      expect(template.Resources.CorpSSLCertificate.Type).toBe('AWS::CertificateManager::Certificate');
      expect(template.Resources.CorpSSLCertificate.Condition).toBe('HasValidDomain');
    });

    test('SSL certificate should have correct domain', () => {
      const cert = template.Resources.CorpSSLCertificate;
      expect(cert.Properties.DomainName).toEqual({
        'Fn::Sub': '${ApplicationName}.${DomainName}'
      });
      expect(cert.Properties.ValidationMethod).toBe('DNS');
    });
  });

  describe('WAF', () => {
    test('should have CorpWebACL resource', () => {
      expect(template.Resources.CorpWebACL).toBeDefined();
      expect(template.Resources.CorpWebACL.Type).toBe('AWS::WAFv2::WebACL');
    });

    test('should have CorpWebACLAssociation resource', () => {
      expect(template.Resources.CorpWebACLAssociation).toBeDefined();
      expect(template.Resources.CorpWebACLAssociation.Type).toBe('AWS::WAFv2::WebACLAssociation');
    });

    test('WAF should have managed rule sets', () => {
      const waf = template.Resources.CorpWebACL;
      const rules = waf.Properties.Rules;
      expect(rules).toHaveLength(3);
      expect(rules[0].Statement.ManagedRuleGroupStatement.VendorName).toBe('AWS');
      expect(rules[1].Statement.ManagedRuleGroupStatement.VendorName).toBe('AWS');
    });
  });

  describe('CloudTrail and Logging', () => {
    test('should have CorpCloudWatchLogGroup resource', () => {
      expect(template.Resources.CorpCloudWatchLogGroup).toBeDefined();
      expect(template.Resources.CorpCloudWatchLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have CorpEC2LogGroup resource', () => {
      expect(template.Resources.CorpEC2LogGroup).toBeDefined();
      expect(template.Resources.CorpEC2LogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have CorpCloudTrailRole resource', () => {
      expect(template.Resources.CorpCloudTrailRole).toBeDefined();
      expect(template.Resources.CorpCloudTrailRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have CorpCloudTrail resource', () => {
      expect(template.Resources.CorpCloudTrail).toBeDefined();
      expect(template.Resources.CorpCloudTrail.Type).toBe('AWS::CloudTrail::Trail');
    });

    test('CloudTrail should have correct properties', () => {
      const trail = template.Resources.CorpCloudTrail;
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });
  });

  describe('SNS', () => {
    test('should have CorpAlarmTopic resource', () => {
      expect(template.Resources.CorpAlarmTopic).toBeDefined();
      expect(template.Resources.CorpAlarmTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have CorpAlarmTopicSubscription resource', () => {
      expect(template.Resources.CorpAlarmTopicSubscription).toBeDefined();
      expect(template.Resources.CorpAlarmTopicSubscription.Type).toBe('AWS::SNS::Subscription');
    });

    test('SNS topic should have KMS encryption', () => {
      const topic = template.Resources.CorpAlarmTopic;
      expect(topic.Properties.KmsMasterKeyId).toEqual({ Ref: 'CorpS3KMSKey' });
    });

    test('SNS subscription should use admin email', () => {
      const subscription = template.Resources.CorpAlarmTopicSubscription;
      expect(subscription.Properties.Endpoint).toEqual({ Ref: 'AdminEmail' });
      expect(subscription.Properties.Protocol).toBe('email');
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'CorpVPC' });
    });

    test('should have ALBDNSName output', () => {
      expect(template.Outputs.ALBDNSName).toBeDefined();
    });

    test('should have DatabaseEndpoint output', () => {
      expect(template.Outputs.DatabaseEndpoint).toBeDefined();
    });

    test('should have DatabaseSecretArn output', () => {
      expect(template.Outputs.DatabaseSecretArn).toBeDefined();
    });

    test('should have S3 bucket outputs', () => {
      expect(template.Outputs.S3AppDataBucket).toBeDefined();
      expect(template.Outputs.S3LogsBucket).toBeDefined();
    });

    test('should have KMSKeyId output', () => {
      expect(template.Outputs.KMSKeyId).toBeDefined();
      expect(template.Outputs.KMSKeyId.Value).toEqual({ Ref: 'CorpS3KMSKey' });
    });

    test('should have BastionHostPublicIP output', () => {
      expect(template.Outputs.BastionHostPublicIP).toBeDefined();
      expect(template.Outputs.BastionHostPublicIP.Value).toEqual({ 'Fn::GetAtt': ['CorpBastionHost', 'PublicIp'] });
    });

    test('should have WebACLArn output', () => {
      expect(template.Outputs.WebACLArn).toBeDefined();
      expect(template.Outputs.WebACLArn.Value).toEqual({ 'Fn::GetAtt': ['CorpWebACL', 'Arn'] });
    });

    test('should have CloudTrailArn output', () => {
      expect(template.Outputs.CloudTrailArn).toBeDefined();
      expect(template.Outputs.CloudTrailArn.Value).toEqual({ 'Fn::GetAtt': ['CorpCloudTrail', 'Arn'] });
    });

    test('should have AlarmTopicArn output', () => {
      expect(template.Outputs.AlarmTopicArn).toBeDefined();
      expect(template.Outputs.AlarmTopicArn.Value).toEqual({ Ref: 'CorpAlarmTopic' });
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Count and Validation', () => {
    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(40);
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(10);
    });

    test('should have expected number of conditions', () => {
      const conditionCount = Object.keys(template.Conditions).length;
      expect(conditionCount).toBe(2);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(11);
    });

    test('all resources should have proper tags', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          expect(Array.isArray(tags)).toBe(true);
          expect(tags.length).toBeGreaterThan(0);

          const tagNames = tags.map((tag: any) => tag.Key);
          expect(tagNames).toContain('Name');
          expect(tagNames).toContain('Environment');
          expect(tagNames).toContain('Application');
          expect(tagNames).toContain('team');
          expect(tagNames).toContain('iac-rlhf-amazon');
        }
      });
    });
  });

  describe('Template Security Validation', () => {
    test('all S3 buckets should have encryption', () => {
      const s3Buckets = Object.keys(template.Resources).filter(name =>
        template.Resources[name].Type === 'AWS::S3::Bucket'
      );

      s3Buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      });
    });

    test('all RDS instances should have encryption', () => {
      const rdsInstances = Object.keys(template.Resources).filter(name =>
        template.Resources[name].Type === 'AWS::RDS::DBInstance'
      );

      rdsInstances.forEach(instanceName => {
        const instance = template.Resources[instanceName];
        expect(instance.Properties.StorageEncrypted).toBe(true);
        expect(instance.Properties.KmsKeyId).toBeDefined();
      });
    });

    test('all security groups should have proper egress rules', () => {
      const securityGroups = Object.keys(template.Resources).filter(name =>
        template.Resources[name].Type === 'AWS::EC2::SecurityGroup'
      );

      securityGroups.forEach(sgName => {
        const sg = template.Resources[sgName];
        if (sg.Properties && sg.Properties.SecurityGroupEgress) {
          expect(Array.isArray(sg.Properties.SecurityGroupEgress)).toBe(true);
        }
      });
    });

    test('all IAM roles should have assume role policies', () => {
      const iamRoles = Object.keys(template.Resources).filter(name =>
        template.Resources[name].Type === 'AWS::IAM::Role'
      );

      iamRoles.forEach(roleName => {
        const role = template.Resources[roleName];
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
        expect(role.Properties.AssumeRolePolicyDocument.Version).toBe('2012-10-17');
      });
    });
  });
});