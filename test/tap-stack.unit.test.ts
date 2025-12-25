import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have correct AWS template format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Cloud Environment Setup');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have BucketName parameter', () => {
      expect(template.Parameters.BucketName).toBeDefined();
      expect(template.Parameters.BucketName.Type).toBe('String');
      expect(template.Parameters.BucketName.Default).toBe('cloud-setup-bucket');
    });

    test('should have InstanceType parameter', () => {
      expect(template.Parameters.InstanceType).toBeDefined();
      expect(template.Parameters.InstanceType.Type).toBe('String');
      expect(template.Parameters.InstanceType.Default).toBe('t3.micro');
      expect(template.Parameters.InstanceType.AllowedValues).toContain('t3.micro');
    });

    test('should have SSHAccessIP parameter', () => {
      expect(template.Parameters.SSHAccessIP).toBeDefined();
      expect(template.Parameters.SSHAccessIP.Type).toBe('String');
      expect(template.Parameters.SSHAccessIP.Default).toBe('203.0.113.0/32');
    });

    test('should have DynamoDBTableName parameter', () => {
      expect(template.Parameters.DynamoDBTableName).toBeDefined();
      expect(template.Parameters.DynamoDBTableName.Type).toBe('String');
      expect(template.Parameters.DynamoDBTableName.Default).toBe('CloudSetupTable');
    });

    test('should have DynamoDBPrimaryKey parameter', () => {
      expect(template.Parameters.DynamoDBPrimaryKey).toBeDefined();
      expect(template.Parameters.DynamoDBPrimaryKey.Type).toBe('String');
      expect(template.Parameters.DynamoDBPrimaryKey.Default).toBe('id');
    });
  });

  describe('Resources', () => {
    describe('VPC and Networking', () => {
      test('should have VPC resource', () => {
        expect(template.Resources.CloudSetupVPC).toBeDefined();
        expect(template.Resources.CloudSetupVPC.Type).toBe('AWS::EC2::VPC');
        expect(template.Resources.CloudSetupVPC.Properties.CidrBlock).toBe('10.0.0.0/16');
        expect(template.Resources.CloudSetupVPC.Properties.EnableDnsHostnames).toBe(true);
      });

      test('should have Internet Gateway', () => {
        expect(template.Resources.CloudSetupInternetGateway).toBeDefined();
        expect(template.Resources.CloudSetupInternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      });

      test('should have VPC Gateway Attachment', () => {
        expect(template.Resources.CloudSetupVPCGatewayAttachment).toBeDefined();
        expect(template.Resources.CloudSetupVPCGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      });

      test('should have Public Subnet', () => {
        expect(template.Resources.CloudSetupPublicSubnet).toBeDefined();
        expect(template.Resources.CloudSetupPublicSubnet.Type).toBe('AWS::EC2::Subnet');
        expect(template.Resources.CloudSetupPublicSubnet.Properties.CidrBlock).toBe('10.0.1.0/24');
        expect(template.Resources.CloudSetupPublicSubnet.Properties.MapPublicIpOnLaunch).toBe(true);
      });

      test('should have Route Table and Routes', () => {
        expect(template.Resources.CloudSetupPublicRouteTable).toBeDefined();
        expect(template.Resources.CloudSetupPublicRoute).toBeDefined();
        expect(template.Resources.CloudSetupSubnetRouteTableAssociation).toBeDefined();
      });
    });

    describe('S3 Bucket', () => {
      test('should have S3 bucket with versioning enabled', () => {
        expect(template.Resources.CloudSetupS3Bucket).toBeDefined();
        expect(template.Resources.CloudSetupS3Bucket.Type).toBe('AWS::S3::Bucket');
        expect(template.Resources.CloudSetupS3Bucket.Properties.VersioningConfiguration).toBeDefined();
        expect(template.Resources.CloudSetupS3Bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      });

      test('should have encryption enabled', () => {
        const bucket = template.Resources.CloudSetupS3Bucket;
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      });

      test('should have public access blocked', () => {
        const bucket = template.Resources.CloudSetupS3Bucket;
        expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
        expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
        expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
        expect(bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
        expect(bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
      });

      test('should be tagged with Project: CloudSetup', () => {
        const bucket = template.Resources.CloudSetupS3Bucket;
        expect(bucket.Properties.Tags).toBeDefined();
        const projectTag = bucket.Properties.Tags.find((tag: any) => tag.Key === 'Project');
        expect(projectTag).toBeDefined();
        expect(projectTag.Value).toBe('CloudSetup');
      });
    });

    describe('EC2 Instance', () => {
      test('should have EC2 instance', () => {
        expect(template.Resources.CloudSetupEC2Instance).toBeDefined();
        expect(template.Resources.CloudSetupEC2Instance.Type).toBe('AWS::EC2::Instance');
        expect(template.Resources.CloudSetupEC2Instance.Properties.Monitoring).toBe(true);
      });

      test('should have instance profile attached', () => {
        const ec2 = template.Resources.CloudSetupEC2Instance;
        expect(ec2.Properties.IamInstanceProfile).toBeDefined();
        expect(ec2.Properties.IamInstanceProfile['Ref']).toBe('EC2InstanceProfile');
      });

      test('should be tagged with Project: CloudSetup', () => {
        const ec2 = template.Resources.CloudSetupEC2Instance;
        expect(ec2.Properties.Tags).toBeDefined();
        const projectTag = ec2.Properties.Tags.find((tag: any) => tag.Key === 'Project');
        expect(projectTag).toBeDefined();
        expect(projectTag.Value).toBe('CloudSetup');
      });
    });

    describe('IAM Role', () => {
      test('should have IAM role for EC2', () => {
        expect(template.Resources.EC2InstanceRole).toBeDefined();
        expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
      });

      test('should have S3 ListBucket permission', () => {
        const role = template.Resources.EC2InstanceRole;
        expect(role.Properties.Policies).toBeDefined();
        expect(role.Properties.Policies[0].PolicyName).toBe('S3ListBucketPolicy');
        const statement = role.Properties.Policies[0].PolicyDocument.Statement[0];
        expect(statement.Action).toBe('s3:ListBucket');
        expect(statement.Effect).toBe('Allow');
      });

      test('should be tagged with Project: CloudSetup', () => {
        const role = template.Resources.EC2InstanceRole;
        expect(role.Properties.Tags).toBeDefined();
        const projectTag = role.Properties.Tags.find((tag: any) => tag.Key === 'Project');
        expect(projectTag).toBeDefined();
        expect(projectTag.Value).toBe('CloudSetup');
      });
    });

    describe('Security Group', () => {
      test('should have security group for EC2', () => {
        expect(template.Resources.EC2SecurityGroup).toBeDefined();
        expect(template.Resources.EC2SecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      });

      test('should allow SSH from specific IP', () => {
        const sg = template.Resources.EC2SecurityGroup;
        expect(sg.Properties.SecurityGroupIngress).toBeDefined();
        expect(sg.Properties.SecurityGroupIngress[0].IpProtocol).toBe('tcp');
        expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(22);
        expect(sg.Properties.SecurityGroupIngress[0].ToPort).toBe(22);
        expect(sg.Properties.SecurityGroupIngress[0].CidrIp['Ref']).toBe('SSHAccessIP');
      });

      test('should be tagged with Project: CloudSetup', () => {
        const sg = template.Resources.EC2SecurityGroup;
        expect(sg.Properties.Tags).toBeDefined();
        const projectTag = sg.Properties.Tags.find((tag: any) => tag.Key === 'Project');
        expect(projectTag).toBeDefined();
        expect(projectTag.Value).toBe('CloudSetup');
      });
    });

    describe('CloudWatch Alarm', () => {
      test('should have CPU alarm', () => {
        expect(template.Resources.CPUAlarmHigh).toBeDefined();
        expect(template.Resources.CPUAlarmHigh.Type).toBe('AWS::CloudWatch::Alarm');
      });

      test('should have threshold set to 70', () => {
        const alarm = template.Resources.CPUAlarmHigh;
        expect(alarm.Properties.Threshold).toBe(70);
        expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
        expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      });

      test('should have SNS topic for notifications', () => {
        expect(template.Resources.CPUAlarmTopic).toBeDefined();
        expect(template.Resources.CPUAlarmTopic.Type).toBe('AWS::SNS::Topic');
      });
    });

    describe('DynamoDB Table', () => {
      test('should have DynamoDB table', () => {
        expect(template.Resources.CloudSetupDynamoDBTable).toBeDefined();
        expect(template.Resources.CloudSetupDynamoDBTable.Type).toBe('AWS::DynamoDB::Table');
      });

      test('should have read capacity set to 5', () => {
        const table = template.Resources.CloudSetupDynamoDBTable;
        expect(table.Properties.ProvisionedThroughput).toBeDefined();
        expect(table.Properties.ProvisionedThroughput.ReadCapacityUnits).toBe(5);
      });

      test('should have encryption enabled', () => {
        const table = template.Resources.CloudSetupDynamoDBTable;
        expect(table.Properties.SSESpecification).toBeDefined();
        expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      });

      test('should be tagged with Project: CloudSetup', () => {
        const table = template.Resources.CloudSetupDynamoDBTable;
        expect(table.Properties.Tags).toBeDefined();
        const projectTag = table.Properties.Tags.find((tag: any) => tag.Key === 'Project');
        expect(projectTag).toBeDefined();
        expect(projectTag.Value).toBe('CloudSetup');
      });

      test('should not have deletion protection enabled', () => {
        const table = template.Resources.CloudSetupDynamoDBTable;
        expect(table.Properties.DeletionProtectionEnabled).toBe(false);
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      expect(template.Outputs).toBeDefined();
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.S3BucketArn).toBeDefined();
      expect(template.Outputs.EC2InstanceId).toBeDefined();
      expect(template.Outputs.EC2InstancePublicIP).toBeDefined();
      expect(template.Outputs.DynamoDBTableName).toBeDefined();
      expect(template.Outputs.DynamoDBTableArn).toBeDefined();
      expect(template.Outputs.IAMRoleArn).toBeDefined();
      expect(template.Outputs.CloudWatchAlarmName).toBeDefined();
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.SubnetId).toBeDefined();
    });

    test('should have export names for all outputs', () => {
      Object.keys(template.Outputs).forEach(key => {
        expect(template.Outputs[key].Export).toBeDefined();
        expect(template.Outputs[key].Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Tagging', () => {
    test('all taggable resources should have Project: CloudSetup tag', () => {
      const taggableResources = [
        'CloudSetupVPC',
        'CloudSetupInternetGateway',
        'CloudSetupPublicSubnet',
        'CloudSetupPublicRouteTable',
        'CloudSetupS3Bucket',
        'EC2InstanceRole',
        'EC2SecurityGroup',
        'CloudSetupEC2Instance',
        'CPUAlarmTopic',
        'CloudSetupDynamoDBTable'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource).toBeDefined();
        if (resource.Properties && resource.Properties.Tags) {
          const projectTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Project');
          expect(projectTag).toBeDefined();
          expect(projectTag.Value).toBe('CloudSetup');
        }
      });
    });
  });
});