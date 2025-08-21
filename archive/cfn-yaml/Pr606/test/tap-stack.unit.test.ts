import fs from 'fs';
import path from 'path';

// Simple assertion helpers to avoid Jest dependency issues
function simpleAssert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function simpleEqual(actual: any, expected: any, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${message}. Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`
    );
  }
}

function simpleContains(str: string, substring: string, message: string) {
  if (!str.includes(substring)) {
    throw new Error(
      `${message}. String "${str}" does not contain "${substring}"`
    );
  }
}

describe('Financial Services CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      simpleEqual(
        template.AWSTemplateFormatVersion,
        '2010-09-09',
        'CloudFormation format version should be 2010-09-09'
      );
    });

    test('should have a comprehensive description', () => {
      simpleAssert(template.Description, 'Description should be defined');
      simpleContains(
        template.Description,
        'Secure Financial Services Environment',
        'Description should contain Financial Services'
      );
    });

    test('should have all required sections', () => {
      simpleAssert(template.Parameters, 'Parameters section should be defined');
      simpleAssert(template.Mappings, 'Mappings section should be defined');
      simpleAssert(template.Resources, 'Resources section should be defined');
      simpleAssert(template.Outputs, 'Outputs section should be defined');
    });
  });

  describe('Parameters', () => {
    test('should have ApplicationName parameter', () => {
      const param = template.Parameters.ApplicationName;
      simpleAssert(param, 'ApplicationName parameter should be defined');
      simpleEqual(
        param.Type,
        'String',
        'ApplicationName should be String type'
      );
      simpleEqual(
        param.Default,
        'FinancialApp',
        'ApplicationName default should be FinancialApp'
      );
      simpleAssert(
        param.AllowedPattern,
        'ApplicationName should have AllowedPattern'
      );
    });

    test('should have Environment parameter', () => {
      const param = template.Parameters.Environment;
      simpleAssert(param, 'Environment parameter should be defined');
      simpleEqual(param.Type, 'String', 'Environment should be String type');
      simpleEqual(param.Default, 'prod', 'Environment default should be prod');
      simpleAssert(
        param.AllowedValues.includes('prod'),
        'Should allow prod environment'
      );
      simpleAssert(
        param.AllowedValues.includes('stage'),
        'Should allow stage environment'
      );
      simpleAssert(
        param.AllowedValues.includes('dev'),
        'Should allow dev environment'
      );
    });

    test('should have InstanceType parameter', () => {
      const param = template.Parameters.InstanceType;
      simpleAssert(param, 'InstanceType parameter should be defined');
      simpleEqual(param.Type, 'String', 'InstanceType should be String type');
      simpleEqual(
        param.Default,
        't3.micro',
        'InstanceType default should be t3.micro'
      );
      simpleAssert(
        param.AllowedValues.includes('t3.micro'),
        'Should allow t3.micro'
      );
    });
  });

  describe('Mappings', () => {
    test('should have RegionMap with multi-region AMI support', () => {
      const regionMap = template.Mappings.RegionMap;
      simpleAssert(regionMap, 'RegionMap should be defined');

      // Check us-east-2
      simpleAssert(
        regionMap['us-east-2'],
        'us-east-2 region should be defined'
      );
      simpleAssert(
        regionMap['us-east-2'].AMI,
        'AMI should be defined for us-east-2'
      );
      simpleEqual(
        regionMap['us-east-2'].AMI,
        'ami-0c02fb55956c7d316',
        'Should have correct AMI ID for us-east-2'
      );

      // Check us-west-2
      simpleAssert(
        regionMap['us-west-2'],
        'us-west-2 region should be defined'
      );
      simpleAssert(
        regionMap['us-west-2'].AMI,
        'AMI should be defined for us-west-2'
      );
      simpleEqual(
        regionMap['us-west-2'].AMI,
        'ami-0aff18ec83b712f05',
        'Should have correct AMI ID for us-west-2'
      );
    });
  });

  describe('KMS Resources', () => {
    test('should have RDS encryption key', () => {
      const key = template.Resources.RDSEncryptionKey;
      simpleAssert(key, 'RDSEncryptionKey should be defined');
      simpleEqual(key.Type, 'AWS::KMS::Key', 'Should be KMS Key type');
      simpleEqual(
        key.Properties.EnableKeyRotation,
        true,
        'Key rotation should be enabled'
      );
    });

    test('should have KMS key alias', () => {
      const alias = template.Resources.RDSEncryptionKeyAlias;
      simpleAssert(alias, 'RDSEncryptionKeyAlias should be defined');
      simpleEqual(alias.Type, 'AWS::KMS::Alias', 'Should be KMS Alias type');
    });
  });

  describe('S3 Resources', () => {
    test('should have application data bucket', () => {
      const bucket = template.Resources.ApplicationDataBucket;
      simpleAssert(bucket, 'ApplicationDataBucket should be defined');
      simpleEqual(bucket.Type, 'AWS::S3::Bucket', 'Should be S3 Bucket type');
      simpleEqual(
        bucket.Properties.VersioningConfiguration.Status,
        'Enabled',
        'Versioning should be enabled'
      );
      simpleAssert(
        bucket.Properties.BucketEncryption,
        'Bucket encryption should be defined'
      );
    });

    test('should have CloudTrail logs bucket', () => {
      const bucket = template.Resources.CloudTrailLogsBucket;
      simpleAssert(bucket, 'CloudTrailLogsBucket should be defined');
      simpleEqual(bucket.Type, 'AWS::S3::Bucket', 'Should be S3 Bucket type');
      simpleEqual(
        bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls,
        true,
        'Public access should be blocked'
      );
    });

    test('should have CloudTrail bucket policy', () => {
      const policy = template.Resources.CloudTrailLogsBucketPolicy;
      simpleAssert(policy, 'CloudTrailLogsBucketPolicy should be defined');
      simpleEqual(
        policy.Type,
        'AWS::S3::BucketPolicy',
        'Should be S3 BucketPolicy type'
      );
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC', () => {
      const vpc = template.Resources.ApplicationVPC;
      simpleAssert(vpc, 'ApplicationVPC should be defined');
      simpleEqual(vpc.Type, 'AWS::EC2::VPC', 'Should be EC2 VPC type');
      simpleEqual(
        vpc.Properties.CidrBlock,
        '10.0.0.0/16',
        'Should have correct CIDR block'
      );
      simpleEqual(
        vpc.Properties.EnableDnsHostnames,
        true,
        'DNS hostnames should be enabled'
      );
    });

    test('should have public subnet', () => {
      const subnet = template.Resources.PublicSubnet;
      simpleAssert(subnet, 'PublicSubnet should be defined');
      simpleEqual(subnet.Type, 'AWS::EC2::Subnet', 'Should be EC2 Subnet type');
      simpleEqual(
        subnet.Properties.MapPublicIpOnLaunch,
        true,
        'Should map public IP on launch'
      );
    });

    test('should have private subnet', () => {
      const subnet = template.Resources.PrivateSubnet;
      simpleAssert(subnet, 'PrivateSubnet should be defined');
      simpleEqual(subnet.Type, 'AWS::EC2::Subnet', 'Should be EC2 Subnet type');
      simpleEqual(
        subnet.Properties.CidrBlock,
        '10.0.2.0/24',
        'Should have correct CIDR block'
      );
    });

    test('should have internet gateway and routing', () => {
      const igw = template.Resources.InternetGateway;
      const attachment = template.Resources.AttachGateway;
      const routeTable = template.Resources.PublicRouteTable;
      const route = template.Resources.PublicRoute;

      simpleAssert(igw, 'InternetGateway should be defined');
      simpleEqual(
        igw.Type,
        'AWS::EC2::InternetGateway',
        'Should be InternetGateway type'
      );
      simpleAssert(attachment, 'AttachGateway should be defined');
      simpleAssert(routeTable, 'PublicRouteTable should be defined');
      simpleAssert(route, 'PublicRoute should be defined');
    });
  });

  describe('Security Groups', () => {
    test('should have application security group with HTTPS only', () => {
      const sg = template.Resources.ApplicationSecurityGroup;
      simpleAssert(sg, 'ApplicationSecurityGroup should be defined');
      simpleEqual(
        sg.Type,
        'AWS::EC2::SecurityGroup',
        'Should be SecurityGroup type'
      );

      const ingressRules = sg.Properties.SecurityGroupIngress;
      simpleAssert(
        ingressRules.length === 1,
        'Should have exactly 1 ingress rule'
      );
      simpleEqual(ingressRules[0].FromPort, 443, 'Should allow HTTPS port 443');
      simpleEqual(ingressRules[0].ToPort, 443, 'Should allow HTTPS port 443');
    });

    test('should have database security group', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      simpleAssert(sg, 'DatabaseSecurityGroup should be defined');
      simpleEqual(
        sg.Type,
        'AWS::EC2::SecurityGroup',
        'Should be SecurityGroup type'
      );

      const ingressRules = sg.Properties.SecurityGroupIngress;
      simpleEqual(
        ingressRules[0].FromPort,
        3306,
        'Should allow MySQL port 3306'
      );
      simpleEqual(ingressRules[0].ToPort, 3306, 'Should allow MySQL port 3306');
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 instance role', () => {
      const role = template.Resources.EC2InstanceRole;
      simpleAssert(role, 'EC2InstanceRole should be defined');
      simpleEqual(role.Type, 'AWS::IAM::Role', 'Should be IAM Role type');
      simpleAssert(
        role.Properties.ManagedPolicyArns.includes(
          'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
        ),
        'Should have CloudWatch policy'
      );
    });

    test('should have EC2 instance policy with least privilege', () => {
      const policy = template.Resources.EC2InstancePolicy;
      simpleAssert(policy, 'EC2InstancePolicy should be defined');
      simpleEqual(policy.Type, 'AWS::IAM::Policy', 'Should be IAM Policy type');
    });

    test('should have EC2 instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      simpleAssert(profile, 'EC2InstanceProfile should be defined');
      simpleEqual(
        profile.Type,
        'AWS::IAM::InstanceProfile',
        'Should be IAM InstanceProfile type'
      );
    });
  });

  describe('EC2 Resources', () => {
    test('should have application instance with updated AMI', () => {
      const instance = template.Resources.ApplicationInstance;
      simpleAssert(instance, 'ApplicationInstance should be defined');
      simpleEqual(
        instance.Type,
        'AWS::EC2::Instance',
        'Should be EC2 Instance type'
      );
      simpleEqual(
        instance.Properties.Monitoring,
        true,
        'Monitoring should be enabled'
      );
    });

    test('should have EC2 recovery alarm', () => {
      const alarm = template.Resources.EC2RecoveryAlarm;
      simpleAssert(alarm, 'EC2RecoveryAlarm should be defined');
      simpleEqual(
        alarm.Type,
        'AWS::CloudWatch::Alarm',
        'Should be CloudWatch Alarm type'
      );
      simpleAssert(
        alarm.Properties.AlarmActions.length === 1,
        'Should have 1 alarm action'
      );
    });
  });

  describe('RDS Resources', () => {
    test('should have DB subnet group', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      simpleAssert(subnetGroup, 'DBSubnetGroup should be defined');
      simpleEqual(
        subnetGroup.Type,
        'AWS::RDS::DBSubnetGroup',
        'Should be RDS DBSubnetGroup type'
      );
    });

    test('should have database instance with latest MySQL version', () => {
      const db = template.Resources.DatabaseInstance;
      simpleAssert(db, 'DatabaseInstance should be defined');
      simpleEqual(
        db.Type,
        'AWS::RDS::DBInstance',
        'Should be RDS DBInstance type'
      );
      simpleEqual(db.Properties.Engine, 'mysql', 'Should use MySQL engine');
      simpleEqual(
        db.Properties.EngineVersion,
        '8.4.5',
        'Should use MySQL 8.4.5'
      );
    });

    test('should have proper database security configuration', () => {
      const db = template.Resources.DatabaseInstance;
      simpleEqual(
        db.Properties.PubliclyAccessible,
        false,
        'Should not be publicly accessible'
      );
      simpleEqual(
        db.Properties.DeletionProtection,
        true,
        'Should have deletion protection'
      );
      simpleEqual(
        db.Properties.BackupRetentionPeriod,
        30,
        'Should have 30-day backup retention'
      );
      simpleEqual(
        db.DeletionPolicy,
        'Snapshot',
        'Should have Snapshot deletion policy'
      );
      simpleEqual(
        db.UpdateReplacePolicy,
        'Snapshot',
        'Should have Snapshot update replace policy'
      );
    });
  });

  describe('CloudTrail Resources', () => {
    test('should have CloudTrail for audit logging', () => {
      const trail = template.Resources.CloudTrailAuditLog;
      simpleAssert(trail, 'CloudTrailAuditLog should be defined');
      simpleEqual(
        trail.Type,
        'AWS::CloudTrail::Trail',
        'Should be CloudTrail Trail type'
      );
      simpleEqual(
        trail.Properties.IsMultiRegionTrail,
        true,
        'Should be multi-region trail'
      );
      simpleEqual(
        trail.Properties.IncludeGlobalServiceEvents,
        true,
        'Should include global service events'
      );
    });
  });

  describe('Outputs', () => {
    test('should have KMS key ARN output', () => {
      const output = template.Outputs.KMSKeyArn;
      simpleAssert(output, 'KMSKeyArn output should be defined');
      simpleContains(
        output.Description,
        'KMS key',
        'Should have KMS key description'
      );
    });

    test('should have S3 bucket outputs', () => {
      const appBucket = template.Outputs.ApplicationDataBucketName;
      const trailBucket = template.Outputs.CloudTrailLogsBucketName;

      simpleAssert(appBucket, 'ApplicationDataBucketName should be defined');
      simpleAssert(trailBucket, 'CloudTrailLogsBucketName should be defined');
    });

    test('should have database endpoint output', () => {
      const output = template.Outputs.DatabaseEndpoint;
      simpleAssert(output, 'DatabaseEndpoint output should be defined');
      simpleContains(
        output.Description,
        'database endpoint',
        'Should have database endpoint description'
      );
    });

    test('should have all required outputs', () => {
      const expectedOutputs = [
        'KMSKeyArn',
        'ApplicationDataBucketName',
        'CloudTrailLogsBucketName',
        'SecurityGroupId',
        'VPCId',
        'EC2InstanceId',
        'DatabaseEndpoint',
        'CloudTrailArn',
      ];

      expectedOutputs.forEach(outputName => {
        simpleAssert(
          template.Outputs[outputName],
          `Output ${outputName} should be defined`
        );
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should have encrypted storage for RDS', () => {
      const db = template.Resources.DatabaseInstance;
      simpleEqual(
        db.Properties.StorageEncrypted,
        true,
        'RDS storage should be encrypted'
      );
    });

    test('should have S3 buckets with encryption', () => {
      const appBucket = template.Resources.ApplicationDataBucket;
      const trailBucket = template.Resources.CloudTrailLogsBucket;

      simpleAssert(
        appBucket.Properties.BucketEncryption,
        'App bucket should have encryption'
      );
      simpleAssert(
        trailBucket.Properties.BucketEncryption,
        'Trail bucket should have encryption'
      );
    });

    test('should have S3 buckets with public access blocked', () => {
      const appBucket = template.Resources.ApplicationDataBucket;
      const trailBucket = template.Resources.CloudTrailLogsBucket;

      simpleEqual(
        appBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls,
        true,
        'App bucket should block public ACLs'
      );
      simpleEqual(
        trailBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls,
        true,
        'Trail bucket should block public ACLs'
      );
    });

    test('should have KMS key rotation enabled', () => {
      const key = template.Resources.RDSEncryptionKey;
      simpleEqual(
        key.Properties.EnableKeyRotation,
        true,
        'KMS key rotation should be enabled'
      );
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      simpleAssert(template, 'Template should be defined');
      simpleEqual(typeof template, 'object', 'Template should be an object');
    });

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      simpleAssert(resourceCount >= 20, 'Should have at least 20 resources'); // Comprehensive template
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      simpleEqual(parameterCount, 3, 'Should have exactly 3 parameters');
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      simpleEqual(outputCount, 8, 'Should have exactly 8 outputs');
    });
  });
});
