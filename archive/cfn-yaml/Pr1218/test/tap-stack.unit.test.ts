import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the CloudFormation template
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    
    // Parse YAML to JSON for testing with CloudFormation intrinsic function support
    const yaml = require('js-yaml');
    
    // Use a simple approach - replace CloudFormation tags with regular strings
    const processedContent = templateContent
      .replace(/!Ref/g, 'Ref')
      .replace(/!Sub/g, 'Sub')
      .replace(/!GetAtt/g, 'GetAtt')
      .replace(/!FindInMap/g, 'FindInMap')
      .replace(/!Join/g, 'Join')
      .replace(/!Select/g, 'Select')
      .replace(/!Split/g, 'Split')
      .replace(/!Base64/g, 'Base64')
      .replace(/!Cidr/g, 'Cidr')
      .replace(/!ImportValue/g, 'ImportValue')
      .replace(/!GetAZs/g, 'GetAZs')
      .replace(/!Condition/g, 'Condition')
      .replace(/!And/g, 'And')
      .replace(/!Equals/g, 'Equals')
      .replace(/!If/g, 'If')
      .replace(/!Not/g, 'Not')
      .replace(/!Or/g, 'Or');
    
    template = yaml.load(processedContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Secure AWS infrastructure with IAM roles, S3 bucket, VPC networking, and CloudWatch monitoring'
      );
    });

    test('should have required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Mappings).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have ProjectName parameter with correct properties', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('tapproject');
      expect(param.Description).toBeDefined();
    });

    test('should have Environment parameter with allowed values', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('should have Owner parameter', () => {
      const param = template.Parameters.Owner;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('DevOps-Team');
      expect(param.Description).toBeDefined();
    });

    test('should have NotificationEmail parameter with email validation', () => {
      const param = template.Parameters.NotificationEmail;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.AllowedPattern).toBe('^$|^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
      expect(param.ConstraintDescription).toBeDefined();
    });
  });

  describe('Mappings', () => {
    test('should have RegionMap with availability zones for multiple regions', () => {
      const regionMap = template.Mappings.RegionMap;
      
      // Test us-west-2
      expect(regionMap['us-west-2']).toBeDefined();
      expect(regionMap['us-west-2'].AvailabilityZone1).toBe('us-west-2a');
      expect(regionMap['us-west-2'].AvailabilityZone2).toBe('us-west-2b');
      
      // Test us-east-1
      expect(regionMap['us-east-1']).toBeDefined();
      expect(regionMap['us-east-1'].AvailabilityZone1).toBe('us-east-1a');
      expect(regionMap['us-east-1'].AvailabilityZone2).toBe('us-east-1b');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC with correct CIDR block', () => {
      const vpc = template.Resources.TapVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have public and private subnets', () => {
      expect(template.Resources.PublicSubnet).toBeDefined();
      expect(template.Resources.PrivateSubnet).toBeDefined();
      
      const publicSubnet = template.Resources.PublicSubnet;
      const privateSubnet = template.Resources.PrivateSubnet;
      
      expect(publicSubnet.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(privateSubnet.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('should have Internet Gateway and NAT Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGatewayEIP).toBeDefined();
    });

    test('should have route tables with correct routes', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PrivateRoute).toBeDefined();
    });

    test('should have subnet route table associations', () => {
      expect(template.Resources.PublicSubnetRouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnetRouteTableAssociation).toBeDefined();
    });
  });

  describe('S3 Bucket Resources', () => {
    test('should have main S3 bucket with encryption', () => {
      const bucket = template.Resources.TapS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should have public access block configuration', () => {
      const bucket = template.Resources.TapS3Bucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have versioning enabled', () => {
      const bucket = template.Resources.TapS3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have CloudTrail S3 bucket', () => {
      expect(template.Resources.CloudTrailS3Bucket).toBeDefined();
      const cloudTrailBucket = template.Resources.CloudTrailS3Bucket;
      expect(cloudTrailBucket.Properties.LifecycleConfiguration).toBeDefined();
    });
  });

  describe('IAM Role Resources', () => {
    test('should have EC2 application role with least privilege', () => {
      const role = template.Resources.EC2ApplicationRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      
      // Check for specific S3 permissions only
      const policies = role.Properties.Policies;
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Action).toEqual([
        's3:GetObject', 's3:PutObject', 's3:DeleteObject'
      ]);
    });

    test('should have Lambda execution role', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('should have CloudWatch events role', () => {
      const role = template.Resources.CloudWatchEventsRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('events.amazonaws.com');
    });

    test('should have EC2 instance profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      const instanceProfile = template.Resources.EC2InstanceProfile;
      expect(instanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should not have wildcard permissions in IAM policies', () => {
      const resources = Object.values(template.Resources);
      resources.forEach((resource: any) => {
        if (resource.Type === 'AWS::IAM::Role' && resource.Properties.Policies) {
          resource.Properties.Policies.forEach((policy: any) => {
            policy.PolicyDocument.Statement.forEach((statement: any) => {
              if (statement.Action) {
                const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
                actions.forEach((action: string) => {
                  expect(action).not.toBe('*');
                });
              }
            });
          });
        }
      });
    });
  });

  describe('CloudTrail and Monitoring Resources', () => {
    test('should have CloudTrail with correct configuration', () => {
      const trail = template.Resources.TapCloudTrail;
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('should have CloudTrail bucket policy', () => {
      expect(template.Resources.CloudTrailBucketPolicy).toBeDefined();
      const bucketPolicy = template.Resources.CloudTrailBucketPolicy;
      expect(bucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('should have CloudWatch alarms for security monitoring', () => {
      expect(template.Resources.UnauthorizedAccessAlarm).toBeDefined();
      expect(template.Resources.S3AccessDeniedAlarm).toBeDefined();
      
      const alarm = template.Resources.UnauthorizedAccessAlarm;
      expect(alarm.Properties.AlarmActions).toBeDefined();
      expect(alarm.Properties.Threshold).toBe(1);
    });

    test('should have SNS topic for notifications', () => {
      expect(template.Resources.SecurityAlarmTopic).toBeDefined();
      expect(template.Resources.SecurityAlarmSubscription).toBeDefined();
    });

    test('should have CloudWatch log group', () => {
      expect(template.Resources.S3CloudWatchLogGroup).toBeDefined();
      const logGroup = template.Resources.S3CloudWatchLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId', 'PublicSubnetId', 'PrivateSubnetId', 'S3BucketName',
        'EC2RoleArn', 'LambdaRoleArn', 'SecurityTopicArn', 'CloudTrailArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have exports for cross-stack references', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toBe('Ref TapVPC');
    });

    test('S3BucketName output should be correct', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBe('S3 Bucket Name');
      expect(output.Value).toBe('Ref TapS3Bucket');
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have consistent tags', () => {
      const resources = Object.values(template.Resources);
      const requiredTags = ['Environment', 'Owner', 'Project'];
      
      resources.forEach((resource: any) => {
        if (resource.Properties.Tags) {
          const tagKeys = resource.Properties.Tags.map((tag: any) => tag.Key);
          requiredTags.forEach(requiredTag => {
            expect(tagKeys).toContain(requiredTag);
          });
        }
      });
    });

    test('resources should have Name tags', () => {
      const resources = Object.values(template.Resources);
      
      resources.forEach((resource: any) => {
        if (resource.Properties.Tags) {
          const tagKeys = resource.Properties.Tags.map((tag: any) => tag.Key);
          expect(tagKeys).toContain('Name');
        }
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
      expect(resourceCount).toBeGreaterThan(10); // Should have many resources
    });

    test('should have multiple parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4); // ProjectName, Environment, Owner, NotificationEmail
    });

    test('should have multiple outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8); // All the required outputs
    });
  });

  describe('Security Best Practices', () => {
    test('S3 buckets should have encryption enabled', () => {
      const s3Buckets = ['TapS3Bucket', 'CloudTrailS3Bucket'];
      
      s3Buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      });
    });

    test('S3 buckets should have public access blocked', () => {
      const s3Buckets = ['TapS3Bucket', 'CloudTrailS3Bucket'];
      
      s3Buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });
    });

    test('CloudTrail should have log file validation enabled', () => {
      const trail = template.Resources.TapCloudTrail;
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('CloudTrail should be multi-region', () => {
      const trail = template.Resources.TapCloudTrail;
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
    });
  });
});
