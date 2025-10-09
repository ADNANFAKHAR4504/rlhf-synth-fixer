import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Development Environment CloudFormation Template', () => {
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
        'Development Environment deployment template for us-east-1'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toHaveLength(5);
    });

    test('should have conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.CreateDbSnapshot).toBeDefined();
    });
  });

  describe('Parameters', () => {
    const expectedParameters = [
      'EnvironmentSuffix',
      'AvailabilityZone1',
      'AvailabilityZone2',
      'OfficeIpCidr',
      'KeyName',
      'LatestAmiId',
      'DbUsername',
      'DbSnapshotOnDelete',
      'NumberOfDevelopers',
      'AlarmEmail'
    ];

    test('should have all required parameters', () => {
      expectedParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });

    test('AvailabilityZone parameters should have correct properties', () => {
      const az1 = template.Parameters.AvailabilityZone1;
      const az2 = template.Parameters.AvailabilityZone2;
      
      expect(az1.Type).toBe('AWS::EC2::AvailabilityZone::Name');
      expect(az1.Default).toBe('us-east-1a');
      expect(az2.Type).toBe('AWS::EC2::AvailabilityZone::Name');
      expect(az2.Default).toBe('us-east-1b');
    });

    test('OfficeIpCidr parameter should have correct properties', () => {
      const param = template.Parameters.OfficeIpCidr;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('203.32.0.1/32');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('KeyName parameter should have correct properties', () => {
      const param = template.Parameters.KeyName;
      expect(param.Type).toBe('AWS::EC2::KeyPair::KeyName');
      expect(param.Default).toBe('mohit-nuke-ec2-kay-pair');
    });

    test('LatestAmiId parameter should have correct properties', () => {
      const param = template.Parameters.LatestAmiId;
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(param.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });

    test('DbUsername parameter should have correct properties', () => {
      const param = template.Parameters.DbUsername;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('postgres');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
      expect(param.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
    });

    test('DbSnapshotOnDelete parameter should have correct properties', () => {
      const param = template.Parameters.DbSnapshotOnDelete;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('true');
      expect(param.AllowedValues).toEqual(['true', 'false']);
    });

    test('NumberOfDevelopers parameter should have correct properties', () => {
      const param = template.Parameters.NumberOfDevelopers;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(10);
      expect(param.MinValue).toBe(1);
      expect(param.MaxValue).toBe(100);
    });

    test('AlarmEmail parameter should have correct properties', () => {
      const param = template.Parameters.AlarmEmail;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('test@gmail.com');
      expect(param.AllowedPattern).toBeDefined();
    });
  });

  describe('Network Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.DevVPC).toBeDefined();
      expect(template.Resources.DevVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct properties', () => {
      const vpc = template.Resources.DevVPC;
      expect(vpc.Properties.CidrBlock).toBe('10.20.0.0/16');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('should have all required subnets', () => {
      expect(template.Resources.PublicSubnet).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('Public subnet should have correct properties', () => {
      const subnet = template.Resources.PublicSubnet;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.20.1.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('Private subnets should have correct properties', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      
      expect(subnet1.Properties.CidrBlock).toBe('10.20.10.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.20.20.0/24');
    });

    test('should have Internet Gateway and attachment', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
    });

    test('should have NAT Gateway and EIP', () => {
      expect(template.Resources.NatGateway).toBeDefined();
      expect(template.Resources.NatGatewayEIP).toBeDefined();
    });

    test('should have route tables and routes', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PrivateRoute).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have all required security groups', () => {
      expect(template.Resources.BastionSG).toBeDefined();
      expect(template.Resources.AppSG).toBeDefined();
      expect(template.Resources.DbSG).toBeDefined();
    });

    test('BastionSG should have correct properties', () => {
      const sg = template.Resources.BastionSG;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress[0].IpProtocol).toBe('tcp');
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(22);
      expect(sg.Properties.SecurityGroupIngress[0].ToPort).toBe(22);
    });

    test('AppSG should allow SSH from bastion', () => {
      const sg = template.Resources.AppSG;
      expect(sg.Properties.SecurityGroupIngress[0].SourceSecurityGroupId.Ref).toBe('BastionSG');
    });

    test('DbSG should allow PostgreSQL from app', () => {
      const sg = template.Resources.DbSG;
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(5432);
      expect(sg.Properties.SecurityGroupIngress[0].ToPort).toBe(5432);
      expect(sg.Properties.SecurityGroupIngress[0].SourceSecurityGroupId.Ref).toBe('AppSG');
    });
  });

  describe('Compute Resources', () => {
    test('should have Bastion instance', () => {
      expect(template.Resources.BastionInstance).toBeDefined();
      expect(template.Resources.BastionInstance.Type).toBe('AWS::EC2::Instance');
    });

    test('Bastion instance should have correct properties', () => {
      const instance = template.Resources.BastionInstance;
      expect(instance.Properties.InstanceType).toBe('t3.micro');
      expect(instance.Properties.KeyName.Ref).toBe('KeyName');
      expect(instance.Properties.SubnetId.Ref).toBe('PublicSubnet');
    });
  });

  describe('Database Resources', () => {
    test('should have DB secret', () => {
      expect(template.Resources.DBSecret).toBeDefined();
      expect(template.Resources.DBSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('DB secret should have correct properties', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
      expect(secret.Properties.GenerateSecretString.ExcludeCharacters).toBe('\"@/\\');
    });

    test('should have DB subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have PostgreSQL instance', () => {
      expect(template.Resources.PostgreSQLInstance).toBeDefined();
      expect(template.Resources.PostgreSQLInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('PostgreSQL instance should have correct properties', () => {
      const db = template.Resources.PostgreSQLInstance;
      expect(db.Properties.Engine).toBe('postgres');
      expect(db.Properties.AllocatedStorage).toBe(20);
      expect(db.Properties.DBInstanceClass).toBe('db.t3.medium');
      expect(db.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('PostgreSQL instance should have conditional deletion policy', () => {
      const db = template.Resources.PostgreSQLInstance;
      expect(db.DeletionPolicy['Fn::If'][0]).toBe('CreateDbSnapshot');
      expect(db.DeletionPolicy['Fn::If'][1]).toBe('Snapshot');
      expect(db.DeletionPolicy['Fn::If'][2]).toBe('Delete');
    });

    test('should have secret attachment', () => {
      expect(template.Resources.SecretRDSInstanceAttachment).toBeDefined();
      expect(template.Resources.SecretRDSInstanceAttachment.Type).toBe('AWS::SecretsManager::SecretTargetAttachment');
    });
  });

  describe('Storage Resources', () => {
    test('should have S3 bucket', () => {
      expect(template.Resources.S3Bucket).toBeDefined();
      expect(template.Resources.S3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have correct properties', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.BucketName).toBe('cfn-bucket-12345');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.DeletionPolicy).toBe('Retain');
    });

    test('S3 bucket should have security configurations', () => {
      const bucket = template.Resources.S3Bucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.S3Bucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });
  });

  describe('Monitoring Resources', () => {
    test('should have log groups', () => {
      expect(template.Resources.BastionLogGroup).toBeDefined();
      expect(template.Resources.RDSLogGroup).toBeDefined();
    });

    test('log groups should have correct retention', () => {
      expect(template.Resources.BastionLogGroup.Properties.RetentionInDays).toBe(7);
      expect(template.Resources.RDSLogGroup.Properties.RetentionInDays).toBe(7);
    });

    test('should have alarm topic', () => {
      expect(template.Resources.AlarmTopic).toBeDefined();
      expect(template.Resources.AlarmTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have CloudWatch alarms', () => {
      expect(template.Resources.BastionCPUAlarm).toBeDefined();
      expect(template.Resources.RDSCPUAlarm).toBeDefined();
    });

    test('alarms should have correct thresholds', () => {
      expect(template.Resources.BastionCPUAlarm.Properties.Threshold).toBe(80);
      expect(template.Resources.RDSCPUAlarm.Properties.Threshold).toBe(80);
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'VpcId',
      'PublicSubnetId',
      'PrivateSubnet1Id',
      'PrivateSubnet2Id',
      'BastionSecurityGroupId',
      'AppSecurityGroupId',
      'DbSecurityGroupId',
      'BastionPublicIP',
      'RDSEndpoint',
      'S3BucketName',
      'DBSecretArn'
    ];

    test('should have all required outputs', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VpcId output should be correct', () => {
      const output = template.Outputs.VpcId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value.Ref).toBe('DevVPC');
      expect(output.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-VPC-${EnvironmentSuffix}');
    });

    test('RDSEndpoint output should be correct', () => {
      const output = template.Outputs.RDSEndpoint;
      expect(output.Description).toBe('Endpoint of the RDS instance');
      expect(output.Value['Fn::GetAtt'][0]).toBe('PostgreSQLInstance');
      expect(output.Value['Fn::GetAtt'][1]).toBe('Endpoint.Address');
    });

    test('DBSecretArn output should be correct', () => {
      const output = template.Outputs.DBSecretArn;
      expect(output.Description).toBe('ARN of the database secret in Secrets Manager');
      expect(output.Value.Ref).toBe('DBSecret');
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
      expect(template.Conditions).not.toBeNull();
    });

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(29);
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(10);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(11);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources with Name tag should follow naming convention', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties && resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Name');
          if (nameTag) {
            expect(nameTag.Value['Fn::Sub']).toContain('${AWS::StackName}');
            expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
          expect(output.Export.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('all resources should have consistent tags', () => {
      const expectedTags = ['Environment', 'Project', 'Owner'];
      
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties && resource.Properties.Tags) {
          const tagKeys = resource.Properties.Tags.map((tag: any) => tag.Key);
          
          expectedTags.forEach(expectedTag => {
            expect(tagKeys).toContain(expectedTag);
          });
          
          const projectTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Project');
          expect(projectTag.Value).toBe('DevEnv');
          
          const ownerTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Owner');
          expect(ownerTag.Value).toBe('DevTeam');
        }
      });
    });
  });

  describe('Conditions', () => {
    test('CreateDbSnapshot condition should be defined correctly', () => {
      const condition = template.Conditions.CreateDbSnapshot;
      expect(condition['Fn::Equals'][0].Ref).toBe('DbSnapshotOnDelete');
      expect(condition['Fn::Equals'][1]).toBe('true');
    });
  });

  describe('Cross-Resource References', () => {
    test('resources should reference each other correctly', () => {
      // VPC references
      expect(template.Resources.PublicSubnet.Properties.VpcId.Ref).toBe('DevVPC');
      expect(template.Resources.PrivateSubnet1.Properties.VpcId.Ref).toBe('DevVPC');
      expect(template.Resources.PrivateSubnet2.Properties.VpcId.Ref).toBe('DevVPC');
      
      // Security group references
      expect(template.Resources.BastionInstance.Properties.SecurityGroupIds[0].Ref).toBe('BastionSG');
      expect(template.Resources.AppSG.Properties.SecurityGroupIngress[0].SourceSecurityGroupId.Ref).toBe('BastionSG');
      expect(template.Resources.DbSG.Properties.SecurityGroupIngress[0].SourceSecurityGroupId.Ref).toBe('AppSG');
      
      // Database references
      expect(template.Resources.SecretRDSInstanceAttachment.Properties.SecretId.Ref).toBe('DBSecret');
      expect(template.Resources.SecretRDSInstanceAttachment.Properties.TargetId.Ref).toBe('PostgreSQLInstance');
    });
  });
});