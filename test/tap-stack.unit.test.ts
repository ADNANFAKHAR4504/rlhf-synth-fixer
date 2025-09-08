import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
        'Secure Production AWS Environment with Compliance Controls'
      );
    });
  });

  describe('Parameters', () => {
    test('should have AllowedSSHCIDR parameter', () => {
      expect(template.Parameters.AllowedSSHCIDR).toBeDefined();
    });

    test('AllowedSSHCIDR parameter should have correct properties', () => {
      const param = template.Parameters.AllowedSSHCIDR;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/8');
      expect(param.Description).toBe('CIDR block allowed for SSH access to EC2 instances');
      expect(param.AllowedPattern).toBe('^(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})/(\\d{1,2})$');
    });
  });

  describe('KMS Resources', () => {
    test('should have ProductionKMSKey resource', () => {
      expect(template.Resources.ProductionKMSKey).toBeDefined();
      expect(template.Resources.ProductionKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have ProductionKMSKeyAlias resource', () => {
      expect(template.Resources.ProductionKMSKeyAlias).toBeDefined();
      expect(template.Resources.ProductionKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('KMS Key should have correct properties', () => {
      const key = template.Resources.ProductionKMSKey;
      expect(key.Properties.Description).toBe('KMS Key for Production Environment Encryption');
      expect(key.Properties.KeyPolicy).toBeDefined();
      expect(key.Properties.Tags).toContainEqual({
        Key: 'Environment',
        Value: 'Production'
      });
    });

    test('KMS Key Alias should have correct properties', () => {
      const alias = template.Resources.ProductionKMSKeyAlias;
      expect(alias.Properties.AliasName).toBe('alias/production-encryption-key');
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'ProductionKMSKey' });
    });
  });

  describe('Secrets Manager Resources', () => {
    test('should have DatabaseSecret resource', () => {
      expect(template.Resources.DatabaseSecret).toBeDefined();
      expect(template.Resources.DatabaseSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('DatabaseSecret should have correct properties', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Properties.Name).toEqual({
        'Fn::Sub': 'production/database/credentials-${AWS::StackName}'
      });
      expect(secret.Properties.Description).toBe('Database credentials for production environment');
      expect(secret.Properties.KmsKeyId).toEqual({ Ref: 'ProductionKMSKey' });
    });
  });

  describe('VPC Resources', () => {
    test('should have ProductionVPC resource', () => {
      expect(template.Resources.ProductionVPC).toBeDefined();
      expect(template.Resources.ProductionVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have ProductionInternetGateway resource', () => {
      expect(template.Resources.ProductionInternetGateway).toBeDefined();
      expect(template.Resources.ProductionInternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have subnet resources', () => {
      expect(template.Resources.PublicSubnet).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();

      expect(template.Resources.PublicSubnet.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.ProductionVPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.3.0/24');
    });
  });

  describe('Security Group Resources', () => {
    test('should have EC2SecurityGroup resource', () => {
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      expect(template.Resources.EC2SecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have RDSSecurityGroup resource', () => {
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
      expect(template.Resources.RDSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('EC2SecurityGroup should allow SSH from allowed CIDR', () => {
      const sg = template.Resources.EC2SecurityGroup;
      const ingressRule = sg.Properties.SecurityGroupIngress[0];
      expect(ingressRule.IpProtocol).toBe('tcp');
      expect(ingressRule.FromPort).toBe(22);
      expect(ingressRule.ToPort).toBe(22);
      expect(ingressRule.CidrIp).toEqual({ Ref: 'AllowedSSHCIDR' });
    });

    test('RDSSecurityGroup should allow MySQL from EC2 security group', () => {
      const sg = template.Resources.RDSSecurityGroup;
      const ingressRule = sg.Properties.SecurityGroupIngress[0];
      expect(ingressRule.IpProtocol).toBe('tcp');
      expect(ingressRule.FromPort).toBe(3306);
      expect(ingressRule.ToPort).toBe(3306);
      expect(ingressRule.SourceSecurityGroupId).toEqual({ Ref: 'EC2SecurityGroup' });
    });
  });

  describe('S3 Resources', () => {
    test('should have ProductionS3Bucket resource', () => {
      expect(template.Resources.ProductionS3Bucket).toBeDefined();
      expect(template.Resources.ProductionS3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have CloudTrailS3Bucket resource', () => {
      expect(template.Resources.CloudTrailS3Bucket).toBeDefined();
      expect(template.Resources.CloudTrailS3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 buckets should have encryption enabled', () => {
      const bucket = template.Resources.ProductionS3Bucket;
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');

      const trailBucket = template.Resources.CloudTrailS3Bucket;
      expect(trailBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3 buckets should have public access blocked', () => {
      const bucket = template.Resources.ProductionS3Bucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('S3 buckets should have versioning enabled', () => {
      expect(template.Resources.ProductionS3Bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(template.Resources.CloudTrailS3Bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2InstanceRole resource', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have ProductionUser resource', () => {
      expect(template.Resources.ProductionUser).toBeDefined();
      expect(template.Resources.ProductionUser.Type).toBe('AWS::IAM::User');
    });

    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('EC2InstanceRole should have CloudWatch policy', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('LambdaExecutionRole should have basic execution policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });
  });

  describe('EC2 Resources', () => {
    test('should have ProductionEC2Instance resource', () => {
      expect(template.Resources.ProductionEC2Instance).toBeDefined();
      expect(template.Resources.ProductionEC2Instance.Type).toBe('AWS::EC2::Instance');
    });

    test('should have EC2KeyPair resource', () => {
      expect(template.Resources.EC2KeyPair).toBeDefined();
      expect(template.Resources.EC2KeyPair.Type).toBe('AWS::EC2::KeyPair');
    });

    test('EC2 instance should have correct properties', () => {
      const instance = template.Resources.ProductionEC2Instance;
      expect(instance.Properties.ImageId).toBe('ami-0bbc328167dee8f3c');
      expect(instance.Properties.InstanceType).toBe('t3.micro');
      expect(instance.Properties.KeyName).toEqual({ Ref: 'EC2KeyPair' });
    });
  });

  describe('RDS Resources', () => {
    test('should have ProductionRDSInstance resource', () => {
      expect(template.Resources.ProductionRDSInstance).toBeDefined();
      expect(template.Resources.ProductionRDSInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('should have RDSSubnetGroup resource', () => {
      expect(template.Resources.RDSSubnetGroup).toBeDefined();
      expect(template.Resources.RDSSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have RDSMonitoringRole resource', () => {
      expect(template.Resources.RDSMonitoringRole).toBeDefined();
      expect(template.Resources.RDSMonitoringRole.Type).toBe('AWS::IAM::Role');
    });

    test('RDS instance should have correct properties', () => {
      const rds = template.Resources.ProductionRDSInstance;
      expect(rds.Properties.DBInstanceClass).toBe('db.t3.small');
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.EngineVersion).toBe('8.0.43');
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.PubliclyAccessible).toBe(false);
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
    });
  });

  describe('Lambda Resources', () => {
    test('should have ProductionLambdaFunction resource', () => {
      expect(template.Resources.ProductionLambdaFunction).toBeDefined();
      expect(template.Resources.ProductionLambdaFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda function should have correct properties', () => {
      const lambda = template.Resources.ProductionLambdaFunction;
      expect(lambda.Properties.FunctionName).toBe('production-processing-function');
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
      expect(lambda.Properties.Timeout).toBe(30);
      expect(lambda.Properties.MemorySize).toBe(128);
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have CloudWatch alarms for RDS', () => {
      expect(template.Resources.RDSCPUAlarm).toBeDefined();
      expect(template.Resources.RDSConnectionAlarm).toBeDefined();

      expect(template.Resources.RDSCPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(template.Resources.RDSConnectionAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have log groups', () => {
      expect(template.Resources.VPCFlowLogGroup).toBeDefined();
      expect(template.Resources.S3LogGroup).toBeDefined();
      expect(template.Resources.CloudTrailLogGroup).toBeDefined();

      expect(template.Resources.VPCFlowLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.S3LogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.CloudTrailLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('RDS CPU alarm should have correct threshold', () => {
      const alarm = template.Resources.RDSCPUAlarm;
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
    });
  });

  describe('CloudTrail Resources', () => {
    test('should have ProductionCloudTrail resource', () => {
      expect(template.Resources.ProductionCloudTrail).toBeDefined();
      expect(template.Resources.ProductionCloudTrail.Type).toBe('AWS::CloudTrail::Trail');
    });

    test('should have CloudTrailS3BucketPolicy resource', () => {
      expect(template.Resources.CloudTrailS3BucketPolicy).toBeDefined();
      expect(template.Resources.CloudTrailS3BucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('CloudTrail should have correct properties', () => {
      const trail = template.Resources.ProductionCloudTrail;
      expect(trail.Properties.TrailName).toBe('production-cloudtrail');
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
      expect(trail.Properties.IsLogging).toBe(true);
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have VPC Flow Log resources', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLogRole).toBeDefined();

      expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(template.Resources.VPCFlowLogRole.Type).toBe('AWS::IAM::Role');
    });

    test('VPC Flow Log should capture all traffic', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog.Properties.ResourceType).toBe('VPC');
      expect(flowLog.Properties.TrafficType).toBe('ALL');
      expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'S3BucketName',
        'EC2InstanceId',
        'RDSInstanceEndpoint',
        'LambdaFunctionArn',
        'CloudTrailArn',
        'KMSKeyId'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('Production VPC ID');
      expect(output.Value).toEqual({ Ref: 'ProductionVPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPC-ID'
      });
    });

    test('S3BucketName output should be correct', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBe('Production S3 Bucket Name');
      expect(output.Value).toEqual({ Ref: 'ProductionS3Bucket' });
    });

    test('LambdaFunctionArn output should be correct', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toBe('Production Lambda Function ARN');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ProductionLambdaFunction', 'Arn']
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have at least one resource', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(0);
    });

    test('should have at least one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThan(0);
    });

    test('should have at least one output', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(0);
    });
  });

  describe('Resource Naming Convention', () => {
    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export && output.Export.Name) {
          const exportName = output.Export.Name;
          if (typeof exportName === 'string') {
            expect(exportName).toMatch(/^\$\{AWS::StackName\}-/);
          } else if (typeof exportName === 'object' && exportName['Fn::Sub']) {
            expect(exportName['Fn::Sub']).toMatch(/^\$\{AWS::StackName\}-/);
          }
        }
      });
    });

    test('resources should have Production environment tags', () => {
      const taggedResources = [
        'ProductionKMSKey',
        'DatabaseSecret',
        'ProductionVPC',
        'ProductionS3Bucket',
        'ProductionEC2Instance',
        'ProductionLambdaFunction'
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
          expect(envTag?.Value).toBe('Production');
        }
      });
    });
  });
});
