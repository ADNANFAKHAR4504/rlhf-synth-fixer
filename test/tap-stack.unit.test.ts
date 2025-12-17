import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  test('should be valid JSON', () => {
    expect(template).toBeDefined();
    expect(typeof template).toBe('object');
  });

  describe('Tagging Requirements', () => {
    const taggableResourceTypes = [
      'AWS::KMS::Key',
      'AWS::EC2::VPC',
      'AWS::EC2::Subnet',
      'AWS::EC2::RouteTable',
      'AWS::EC2::SecurityGroup',
      'AWS::S3::Bucket',
      'AWS::IAM::Role',
      // 'AWS::RDS::DBSubnetGroup', // Removed for LocalStack compatibility
      'AWS::RDS::DBInstance',
      'AWS::Logs::LogGroup',
      'AWS::Lambda::Function',
      'AWS::CloudTrail::Trail',
      'AWS::SNS::Topic',
      'AWS::CloudWatch::Alarm',
      'AWS::SecretsManager::Secret'
    ];

    const nonTaggableResourceTypes = [
      'AWS::KMS::Alias',
      'AWS::EC2::SubnetRouteTableAssociation',
      'AWS::S3::BucketPolicy',
      'AWS::IAM::InstanceProfile',
      // EC2 Instances support Tags; don't treat as non-taggable
      'AWS::Logs::MetricFilter',
      'AWS::Config::ConfigurationRecorder',
      'AWS::Config::DeliveryChannel',
      'AWS::Config::ConfigRule'
    ];

    test('taggable resources should have Environment and Owner tags', () => {
      Object.entries(template.Resources).forEach(([resourceName, resource]: [string, any]) => {
        if (taggableResourceTypes.includes(resource.Type)) {
          expect(resource.Properties.Tags).toBeDefined();

          const tags = resource.Properties.Tags;
          const environmentTag = tags.find((tag: any) => tag.Key === 'Environment');
          const ownerTag = tags.find((tag: any) => tag.Key === 'Owner');

          expect(environmentTag).toBeDefined();
          expect(ownerTag).toBeDefined();
          expect(environmentTag.Value).toEqual({ Ref: 'Environment' });
          expect(ownerTag.Value).toEqual({ Ref: 'Owner' });
        }
      });
    });

    test('non-taggable resources should not have Tags property', () => {
      Object.entries(template.Resources).forEach(([resourceName, resource]: [string, any]) => {
        if (nonTaggableResourceTypes.includes(resource.Type)) {
          expect(resource.Properties.Tags).toBeUndefined();
        }
      });
    });
  });

  describe('Availability Zone Requirements', () => {
    test('should not have hardcoded availability zones', () => {
      const templateString = JSON.stringify(template);

      // Check for common hardcoded AZ patterns
      expect(templateString).not.toMatch(/us-east-1[a-z]/);
      expect(templateString).not.toMatch(/us-west-[1-2][a-z]/);
      expect(templateString).not.toMatch(/eu-west-1[a-z]/);
      expect(templateString).not.toMatch(/ap-southeast-[1-2][a-z]/);

      // Verify subnets use Fn::GetAZs and Fn::Select
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(privateSubnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(privateSubnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
    });
  });

  describe('EC2 AMI Requirements', () => {
    test('should use parameter for AMI ID', () => {
      const ec2Instance = template.Resources.EC2Instance;
      expect(ec2Instance.Properties.ImageId).toEqual({ Ref: 'LatestAmiId' });

      const latestAmiParam = template.Parameters.LatestAmiId;
      // Using AWS::EC2::Image::Id type with hardcoded AMI for LocalStack compatibility
      expect(latestAmiParam.Type).toBe('AWS::EC2::Image::Id');
      expect(latestAmiParam.Default).toBeDefined();
    });
  });

  describe('Security Group Requirements', () => {
    test('EC2 security group should only allow SSH/22 from AllowedSshCidr', () => {
      const ec2SecurityGroup = template.Resources.EC2SecurityGroup;
      const ingressRules = ec2SecurityGroup.Properties.SecurityGroupIngress;

      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0].IpProtocol).toBe('tcp');
      expect(ingressRules[0].FromPort).toBe(22);
      expect(ingressRules[0].ToPort).toBe(22);
      expect(ingressRules[0].CidrIp).toEqual({ Ref: 'AllowedSshCidr' });
    });

    test('RDS security group should only allow MySQL from EC2 security group', () => {
      const rdsSecurityGroup = template.Resources.RDSSecurityGroup;
      const ingressRules = rdsSecurityGroup.Properties.SecurityGroupIngress;

      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0].IpProtocol).toBe('tcp');
      expect(ingressRules[0].FromPort).toBe(3306);
      expect(ingressRules[0].ToPort).toBe(3306);
      expect(ingressRules[0].SourceSecurityGroupId).toEqual({ Ref: 'EC2SecurityGroup' });
    });
  });

  describe('S3 Encryption Requirements', () => {
    test('S3 buckets should use SSE-KMS encryption', () => {
      const s3Bucket = template.Resources.S3Bucket;
      const cloudTrailBucket = template.Resources.CloudTrailBucket;
      const configBucket = template.Resources.ConfigBucket;

      [s3Bucket, cloudTrailBucket, configBucket].forEach(bucket => {
        const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
        expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'S3KMSKey' });
      });
    });

    test('S3 bucket policy should deny unencrypted PUTs', () => {
      const s3BucketPolicy = template.Resources.S3BucketPolicy;
      const statements = s3BucketPolicy.Properties.PolicyDocument.Statement;

      const denyUnencryptedStatement = statements.find((stmt: any) => stmt.Sid === 'DenyUnencryptedPuts');
      const requireKMSStatement = statements.find((stmt: any) => stmt.Sid === 'RequireKMSEncryption');

      expect(denyUnencryptedStatement).toBeDefined();
      expect(denyUnencryptedStatement.Effect).toBe('Deny');
      expect(denyUnencryptedStatement.Action).toBe('s3:PutObject');
      expect(denyUnencryptedStatement.Condition.StringNotEquals['s3:x-amz-server-side-encryption']).toBe('aws:kms');

      expect(requireKMSStatement).toBeDefined();
      expect(requireKMSStatement.Effect).toBe('Deny');
      expect(requireKMSStatement.Action).toBe('s3:PutObject');
    });
  });

  describe('IAM Wildcard Requirements', () => {
    test('IAM policies should not contain wildcards in actions or resources', () => {
      Object.entries(template.Resources).forEach(([resourceName, resource]: [string, any]) => {
        if (resource.Type === 'AWS::IAM::Role' && resource.Properties.Policies) {
          resource.Properties.Policies.forEach((policy: any) => {
            policy.PolicyDocument.Statement.forEach((statement: any) => {
              // Check for wildcard actions
              if (Array.isArray(statement.Action)) {
                statement.Action.forEach((action: string) => {
                  expect(action).not.toBe('*');
                });
              } else if (typeof statement.Action === 'string') {
                expect(statement.Action).not.toBe('*');
              }

              // Check for wildcard resources (allow specific exceptions)
              if (statement.Resource === '*') {
                // Only allow * for KMS keys in key policies
                expect(resourceName).toMatch(/KMSKey/);
              }
            });
          });
        }
      });
    });
  });

  describe('RDS Requirements', () => {
    test('RDS should be encrypted with KMS', () => {
      const rdsInstance = template.Resources.RDSInstance;
      expect(rdsInstance.Properties.StorageEncrypted).toBe(true);
      expect(rdsInstance.Properties.KmsKeyId).toEqual({ Ref: 'RDSKMSKey' });
    });

    test('RDS should use MySQL with AllowedValues', () => {
      const rdsInstance = template.Resources.RDSInstance;
      expect(rdsInstance.Properties.Engine).toBe('mysql');

      const dbEngineVersionParam = template.Parameters.DBEngineVersion;
      expect(dbEngineVersionParam.AllowedValues).toBeDefined();
      expect(dbEngineVersionParam.AllowedValues).toContain('8.0.43');
    });

    test('RDS should use Secrets Manager for password', () => {
      const rdsInstance = template.Resources.RDSInstance;
      const mup = rdsInstance.Properties.MasterUserPassword;
      // Using Secrets Manager dynamic reference with static SecretString for LocalStack compatibility
      const mupString = mup && mup['Fn::Sub'];
      expect(typeof mupString).toBe('string');
      expect(mupString).toMatch(/{{resolve:secretsmanager/);
    });
  });

  describe('VPC Requirements', () => {
    test('VPC should only have private subnets (no IGW/public subnets)', () => {
      // Check that there's no Internet Gateway
      const hasIGW = Object.values(template.Resources).some((resource: any) =>
        resource.Type === 'AWS::EC2::InternetGateway'
      );
      expect(hasIGW).toBe(false);

      // Check that subnets are private (MapPublicIpOnLaunch = false)
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(privateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(privateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
    });
  });

  describe('CloudTrail Requirements', () => {
    test('CloudTrail should be multi-region with logging enabled', () => {
      const cloudTrail = template.Resources.CloudTrail;
      expect(cloudTrail.Properties.IsMultiRegionTrail).toBe(true);
      expect(cloudTrail.Properties.IsLogging).toBe(true);
      expect(cloudTrail.Properties.EnableLogFileValidation).toBe(true);
    });
  });

  describe('CloudWatch Requirements', () => {
    test('should have MetricFilter for UnauthorizedOperation/AccessDenied', () => {
      const metricFilter = template.Resources.UnauthorizedAccessMetricFilter;
      expect(metricFilter.Type).toBe('AWS::Logs::MetricFilter');
      expect(metricFilter.Properties.FilterPattern).toBe('{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }');
    });

    test('should have alarm for UnauthorizedOperation/AccessDenied', () => {
      const alarm = template.Resources.UnauthorizedAccessAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('UnauthorizedAccess');
      expect(alarm.Properties.Namespace).toBe('Security');
    });
  });

  describe('AWS Config Requirements', () => {
    test('should use only ConfigurationRecorder, DeliveryChannel, and ConfigRule', () => {
      const configResources = Object.values(template.Resources).filter((resource: any) =>
        resource.Type.startsWith('AWS::Config::')
      );

      const expectedTypes = [
        'AWS::Config::ConfigurationRecorder',
        'AWS::Config::DeliveryChannel',
        'AWS::Config::ConfigRule'
      ];

      configResources.forEach((resource: any) => {
        expect(expectedTypes).toContain(resource.Type);
      });

      expect(configResources.length).toBe(3);
    });
  });
});