import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If you're testing a yaml template, run `pipenv run cfn-flip-to-json > lib/TapStack.json`
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
        'Secure AWS environment with S3, CloudWatch monitoring, and IAM roles following security best practices'
      );
    });

    test('should have metadata section with interface', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have required capabilities comment', () => {
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have ProjectName parameter', () => {
      expect(template.Parameters.ProjectName).toBeDefined();
    });

    test('ProjectName parameter should have correct properties', () => {
      const projectNameParam = template.Parameters.ProjectName;
      expect(projectNameParam.Type).toBe('String');
      expect(projectNameParam.Default).toBe('myproject');
      expect(projectNameParam.Description).toBe('Project name for resource naming convention');
      expect(projectNameParam.AllowedPattern).toBe('^[a-z0-9-]+$');
    });

    test('should have AdminEmail parameter', () => {
      expect(template.Parameters.AdminEmail).toBeDefined();
    });

    test('AdminEmail parameter should have correct properties', () => {
      const adminEmailParam = template.Parameters.AdminEmail;
      expect(adminEmailParam.Type).toBe('String');
      expect(adminEmailParam.Description).toBe('Email address for security notifications');
      expect(adminEmailParam.AllowedPattern).toBe('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
    });

    test('should have VpcCidr parameter', () => {
      expect(template.Parameters.VpcCidr).toBeDefined();
    });

    test('VpcCidr parameter should have correct properties', () => {
      const vpcCidrParam = template.Parameters.VpcCidr;
      expect(vpcCidrParam.Type).toBe('String');
      expect(vpcCidrParam.Default).toBe('10.0.0.0/16');
      expect(vpcCidrParam.Description).toBe('CIDR block for the VPC');
    });
  });

  describe('Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.ProjectVPC).toBeDefined();
    });

    test('ProjectVPC should be a VPC', () => {
      const vpc = template.Resources.ProjectVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
    });

    test('should have PrivateSubnet resource', () => {
      expect(template.Resources.PrivateSubnet).toBeDefined();
    });

    test('PrivateSubnet should be a subnet', () => {
      const subnet = template.Resources.PrivateSubnet;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have EC2SecurityGroup resource', () => {
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
    });

    test('EC2SecurityGroup should be a security group', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have S3EncryptionKey resource', () => {
      expect(template.Resources.S3EncryptionKey).toBeDefined();
    });

    test('S3EncryptionKey should be a KMS key', () => {
      const key = template.Resources.S3EncryptionKey;
      expect(key.Type).toBe('AWS::KMS::Key');
    });

    test('should have SecureS3Bucket resource', () => {
      expect(template.Resources.SecureS3Bucket).toBeDefined();
    });

    test('SecureS3Bucket should be an S3 bucket', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have S3AccessLogsBucket resource', () => {
      expect(template.Resources.S3AccessLogsBucket).toBeDefined();
    });

    test('should have EC2InstanceRole resource', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
    });

    test('EC2InstanceRole should be an IAM role', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have SecurityAlertsTopic resource', () => {
      expect(template.Resources.SecurityAlertsTopic).toBeDefined();
    });

    test('SecurityAlertsTopic should be an SNS topic', () => {
      const topic = template.Resources.SecurityAlertsTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have UnauthorizedAccessAlarm resource', () => {
      expect(template.Resources.UnauthorizedAccessAlarm).toBeDefined();
    });

    test('UnauthorizedAccessAlarm should be a CloudWatch alarm', () => {
      const alarm = template.Resources.UnauthorizedAccessAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have SecurityCloudTrail resource', () => {
      expect(template.Resources.SecurityCloudTrail).toBeDefined();
    });

    test('SecurityCloudTrail should be a CloudTrail', () => {
      const trail = template.Resources.SecurityCloudTrail;
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
    });
  });

  describe('S3 Bucket Security', () => {
    test('SecureS3Bucket should have encryption enabled', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('SecureS3Bucket should have public access blocked', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    test('SecureS3Bucket should have versioning enabled', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('SecureS3Bucket should have logging enabled', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Properties.LoggingConfiguration).toBeDefined();
    });
  });

  describe('IAM Security', () => {
    test('EC2InstanceRole should have assume role policy for EC2', () => {
      const role = template.Resources.EC2InstanceRole;
      const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    });

    test('EC2InstanceRole should have CloudWatch policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const managedPolicies = role.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('EC2InstanceRole should have S3 access policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const policies = role.Properties.Policies;
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
      expect(s3Policy).toBeDefined();
    });
  });

  describe('Monitoring and Alerts', () => {
    test('UnauthorizedAccessAlarm should monitor VPC flow logs', () => {
      const alarm = template.Resources.UnauthorizedAccessAlarm;
      expect(alarm.Properties.MetricName).toBe('UnauthorizedSSHAttempts');
      expect(alarm.Properties.Namespace).toEqual({
        'Fn::Sub': 'Project/${ProjectName}/Security'
      });
    });

    test('FailedAuthAlarm should monitor CloudTrail logs', () => {
      const alarm = template.Resources.FailedAuthAlarm;
      expect(alarm.Properties.MetricName).toBe('FailedAuthAttempts');
      expect(alarm.Properties.Namespace).toEqual({
        'Fn::Sub': 'Project/${ProjectName}/Security'
      });
    });

    test('SecurityAlertsTopic should be used by alarms', () => {
      const unauthorizedAlarm = template.Resources.UnauthorizedAccessAlarm;
      const failedAuthAlarm = template.Resources.FailedAuthAlarm;
      expect(unauthorizedAlarm.Properties.AlarmActions).toBeDefined();
      expect(failedAuthAlarm.Properties.AlarmActions).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'VpcCidrBlock',
        'PrivateSubnetId',
        'S3BucketName',
        'S3AccessLogsBucketName',
        'EC2RoleArn',
        'EC2InstanceProfileArn',
        'SecurityGroupId',
        'SNSTopicArn',
        'KMSKeyId',
        'KMSKeyAlias',
        'CloudWatchLogGroupName',
        'VPCFlowLogGroupName',
        'CloudTrailLogGroupName',
        'CloudTrailName',
        'UnauthorizedAccessAlarmName',
        'FailedAuthAlarmName',
        'ProjectName',
        'StackName'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID following vpc- format');
      expect(output.Value).toEqual({ Ref: 'ProjectVPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPC-ID'
      });
    });

    test('S3BucketName output should be correct', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBe('Secure S3 bucket name with project prefix');
      expect(output.Value).toEqual({ Ref: 'SecureS3Bucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-S3-Bucket'
      });
    });

    test('EC2RoleArn output should be correct', () => {
      const output = template.Outputs.EC2RoleArn;
      expect(output.Description).toBe('EC2 IAM Role ARN for instance attachment');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['EC2InstanceRole', 'Arn']
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EC2-Role-ARN'
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

    test('should have multiple resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10);
    });

    test('should have exactly three parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have nineteen outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(19);
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow project naming convention', () => {
      const resources = template.Resources;
      Object.keys(resources).forEach(resourceKey => {
        const resource = resources[resourceKey];
        if (resource.Properties && resource.Properties.Tags) {
          const projectTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Project');
          if (projectTag) {
            expect(projectTag.Value).toEqual({ Ref: 'ProjectName' });
          }
        }
      });
    });

    test('export names should follow naming convention', () => {
      // Define the expected export name mappings
      const exportNameMappings: { [key: string]: string } = {
        'VPCId': 'VPC-ID',
        'VpcCidrBlock': 'VPC-CIDR',
        'PrivateSubnetId': 'Private-Subnet-ID',
        'S3BucketName': 'S3-Bucket',
        'S3AccessLogsBucketName': 'S3-Access-Logs-Bucket',
        'EC2RoleArn': 'EC2-Role-ARN',
        'EC2InstanceProfileArn': 'EC2-Instance-Profile-ARN',
        'SecurityGroupId': 'Security-Group-ID',
        'SNSTopicArn': 'SNS-Topic-ARN',
        'KMSKeyId': 'KMS-Key-ID',
        'KMSKeyAlias': 'KMS-Key-Alias',
        'CloudWatchLogGroupName': 'CloudWatch-Log-Group',
        'VPCFlowLogGroupName': 'VPC-Flow-Log-Group',
        'CloudTrailLogGroupName': 'CloudTrail-Log-Group',
        'CloudTrailName': 'CloudTrail-Name',
        'UnauthorizedAccessAlarmName': 'Unauthorized-Access-Alarm',
        'FailedAuthAlarmName': 'Failed-Auth-Alarm',
        'ProjectName': 'Project-Name',
        'StackName': 'Stack-Name'
      };

      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        const expectedExportName = exportNameMappings[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${expectedExportName}`
        });
      });
    });
  });
});
