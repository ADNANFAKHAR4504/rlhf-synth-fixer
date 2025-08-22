import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON template for testing
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
        'Secure AWS environment for regulated applications with encryption, monitoring, and compliance controls'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups[0].Label.default).toBe('Environment Configuration');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC with correct configuration', () => {
      expect(template.Resources.SecureVPC).toBeDefined();
      expect(template.Resources.SecureVPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.SecureVPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(template.Resources.SecureVPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.SecureVPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have public subnet', () => {
      expect(template.Resources.PublicSubnet).toBeDefined();
      expect(template.Resources.PublicSubnet.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnet', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.2.0/24');
      
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.3.0/24');
    });

    test('should have NAT Gateway and EIP', () => {
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGatewayEIP).toBeDefined();
      expect(template.Resources.NATGatewayEIP.Type).toBe('AWS::EC2::EIP');
    });

    test('should have route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PrivateRoute).toBeDefined();
    });

    test('should have subnet route table associations', () => {
      expect(template.Resources.PublicSubnetRouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have Web Security Group with least privilege', () => {
      const webSG = template.Resources.WebSecurityGroup;
      expect(webSG).toBeDefined();
      expect(webSG.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingress = webSG.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      expect(ingress[0].FromPort).toBe(443);
      expect(ingress[0].ToPort).toBe(443);
      expect(ingress[1].FromPort).toBe(80);
      expect(ingress[1].ToPort).toBe(80);
    });

    test('should have Database Security Group', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup;
      expect(dbSG).toBeDefined();
      expect(dbSG.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingress = dbSG.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have EC2 Role with correct policies', () => {
      const ec2Role = template.Resources.EC2Role;
      expect(ec2Role).toBeDefined();
      expect(ec2Role.Type).toBe('AWS::IAM::Role');
      expect(ec2Role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      expect(ec2Role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('should have EC2 Instance Profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have VPC Flow Logs Role', () => {
      expect(template.Resources.VPCFlowLogsRole).toBeDefined();
      expect(template.Resources.VPCFlowLogsRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have CloudTrail Role', () => {
      expect(template.Resources.CloudTrailRole).toBeDefined();
      expect(template.Resources.CloudTrailRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have Config Role', () => {
      expect(template.Resources.ConfigRole).toBeDefined();
      expect(template.Resources.ConfigRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('S3 Buckets', () => {
    test('should have Secure S3 Bucket with encryption and versioning', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(encryption.BucketKeyEnabled).toBe(true);
      
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have Logging Bucket with encryption', () => {
      const bucket = template.Resources.LoggingBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should have Logging Bucket Policy for CloudTrail', () => {
      const policy = template.Resources.LoggingBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      
      const statements = policy.Properties.PolicyDocument.Statement;
      expect(statements).toHaveLength(5);
      expect(statements[0].Sid).toBe('AWSCloudTrailAclCheck');
      expect(statements[1].Sid).toBe('AWSCloudTrailWrite');
      expect(statements[2].Sid).toBe('AWSConfigBucketPermissionsCheck');
      expect(statements[3].Sid).toBe('AWSConfigBucketExistenceCheck');
      expect(statements[4].Sid).toBe('AWSConfigBucketDelivery');
    });
  });

  describe('RDS Database', () => {
    test('should have DB Subnet Group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have RDS instance with correct configuration', () => {
      const rds = template.Resources.SecureRDSInstance;
      expect(rds).toBeDefined();
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      
      const props = rds.Properties;
      expect(props.Engine).toBe('mysql');
      expect(props.EngineVersion).toBe('8.0.39');
      expect(props.StorageEncrypted).toBe(true);
      expect(props.BackupRetentionPeriod).toBe(7);
      expect(props.DeletionProtection).toBe(false); // Must be destroyable
      expect(props.PubliclyAccessible).toBe(false);
      expect(props.EnableCloudwatchLogsExports).toContain('error');
      expect(props.EnableCloudwatchLogsExports).toContain('general');
      expect(props.EnableCloudwatchLogsExports).toContain('slowquery');
    });

    test('should have RDS Secret in Secrets Manager', () => {
      const secret = template.Resources.RDSSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(16);
    });
  });

  describe('Monitoring and Logging', () => {
    test('should have CloudWatch Log Groups', () => {
      expect(template.Resources.S3LogGroup).toBeDefined();
      expect(template.Resources.VPCFlowLogsGroup).toBeDefined();
      expect(template.Resources.CloudTrailLogGroup).toBeDefined();
      
      expect(template.Resources.S3LogGroup.Properties.RetentionInDays).toBe(30);
      expect(template.Resources.VPCFlowLogsGroup.Properties.RetentionInDays).toBe(30);
      expect(template.Resources.CloudTrailLogGroup.Properties.RetentionInDays).toBe(90);
    });

    test('should have VPC Flow Logs', () => {
      const flowLogs = template.Resources.VPCFlowLogs;
      expect(flowLogs).toBeDefined();
      expect(flowLogs.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLogs.Properties.TrafficType).toBe('ALL');
      expect(flowLogs.Properties.LogDestinationType).toBe('cloud-watch-logs');
    });

    test('should have CloudTrail', () => {
      const trail = template.Resources.SecureCloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.DependsOn).toBe('LoggingBucketPolicy');
      
      const props = trail.Properties;
      expect(props.IsLogging).toBe(true);
      expect(props.IsMultiRegionTrail).toBe(true);
      expect(props.EnableLogFileValidation).toBe(true);
      expect(props.IncludeGlobalServiceEvents).toBe(true);
    });

    test('should have CloudWatch Alarms', () => {
      expect(template.Resources.UnauthorizedAPICallsAlarm).toBeDefined();
      expect(template.Resources.UnauthorizedAPICallsAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      
      expect(template.Resources.RootAccountUsageAlarm).toBeDefined();
      expect(template.Resources.RootAccountUsageAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });
  });

  describe('AWS Config', () => {
    test('should have Config Recorder', () => {
      const recorder = template.Resources.ConfigurationRecorder;
      expect(recorder).toBeDefined();
      expect(recorder.Type).toBe('AWS::Config::ConfigurationRecorder');
      expect(recorder.Properties.RecordingGroup.AllSupported).toBe(true);
      expect(recorder.Properties.RecordingGroup.IncludeGlobalResourceTypes).toBe(true);
    });

    test('should have Config Delivery Channel', () => {
      const channel = template.Resources.ConfigDeliveryChannel;
      expect(channel).toBeDefined();
      expect(channel.Type).toBe('AWS::Config::DeliveryChannel');
    });

    test('should have Config Rules', () => {
      expect(template.Resources.S3BucketSSLRequestsOnlyRule).toBeDefined();
      expect(template.Resources.S3BucketSSLRequestsOnlyRule.Type).toBe('AWS::Config::ConfigRule');
      
      expect(template.Resources.RDSStorageEncryptedRule).toBeDefined();
      expect(template.Resources.RDSStorageEncryptedRule.Type).toBe('AWS::Config::ConfigRule');
    });
  });

  describe('EC2 Instance', () => {
    test('should have Web Server Instance', () => {
      const instance = template.Resources.WebServerInstance;
      expect(instance).toBeDefined();
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.InstanceType).toBe('t3.micro');
      expect(instance.Properties.ImageId).toEqual({'Ref': 'LatestAmiId'});
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnetId',
        'PrivateSubnetId',
        'S3BucketName',
        'RDSEndpoint',
        'WebServerInstanceId'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have correct export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should use environment suffix in names', () => {
      const resourcesToCheck = [
        'SecureVPC',
        'InternetGateway',
        'PublicSubnet',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'NATGateway',
        'WebSecurityGroup',
        'DatabaseSecurityGroup',
        'EC2Role',
        'SecureS3Bucket',
        'LoggingBucket',
        'DBSubnetGroup',
        'SecureRDSInstance',
        'RDSSecret',
        'SecureCloudTrail',
        'ConfigurationRecorder'
      ];

      resourcesToCheck.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Name');
          if (nameTag) {
            expect(JSON.stringify(nameTag.Value)).toContain('EnvironmentSuffix');
          }
        } else if (resource.Properties.Name || resource.Properties.RoleName || 
                   resource.Properties.BucketName || resource.Properties.DBInstanceIdentifier ||
                   resource.Properties.TrailName || resource.Properties.AlarmName) {
          const nameProperty = resource.Properties.Name || resource.Properties.RoleName || 
                              resource.Properties.BucketName || resource.Properties.DBInstanceIdentifier ||
                              resource.Properties.TrailName || resource.Properties.AlarmName;
          expect(JSON.stringify(nameProperty)).toContain('EnvironmentSuffix');
        }
      });
    });
  });

  describe('Security and Compliance', () => {
    test('all S3 buckets should have encryption enabled', () => {
      const buckets = ['SecureS3Bucket', 'LoggingBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      });
    });

    test('all S3 buckets should block public access', () => {
      const buckets = ['SecureS3Bucket', 'LoggingBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });
    });

    test('RDS should have storage encryption enabled', () => {
      expect(template.Resources.SecureRDSInstance.Properties.StorageEncrypted).toBe(true);
    });

    test('RDS should have automated backups enabled', () => {
      expect(template.Resources.SecureRDSInstance.Properties.BackupRetentionPeriod).toBeGreaterThan(0);
    });

    test('security groups should follow least privilege principle', () => {
      const webSG = template.Resources.WebSecurityGroup.Properties.SecurityGroupIngress;
      const dbSG = template.Resources.DatabaseSecurityGroup.Properties.SecurityGroupIngress;
      
      // Web SG should only allow HTTP and HTTPS
      expect(webSG.every((rule: any) => [80, 443].includes(rule.FromPort))).toBe(true);
      
      // DB SG should only allow MySQL port from Web SG
      expect(dbSG[0].FromPort).toBe(3306);
      expect(dbSG[0].SourceSecurityGroupId).toBeDefined();
    });

    test('CloudTrail should have log file validation enabled', () => {
      expect(template.Resources.SecureCloudTrail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('VPC Flow Logs should capture all traffic', () => {
      expect(template.Resources.VPCFlowLogs.Properties.TrafficType).toBe('ALL');
    });
  });

  describe('Deletion Policy', () => {
    test('RDS instance should not have deletion protection', () => {
      expect(template.Resources.SecureRDSInstance.Properties.DeletionProtection).toBe(false);
    });

    test('no resources should have Retain deletion policy', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });
  });
});