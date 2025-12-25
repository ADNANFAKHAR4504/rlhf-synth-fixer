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
        'Secure and scalable AWS infrastructure template with multi-region support'
      );
    });

    test('should have required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    const expectedParameters = [
      'Environment',
      'Owner', 
      'Project',
      'AllowedCIDR',
      'DBUsername',
      'EnvironmentSuffix'
    ];

    test('should have all required parameters', () => {
      expectedParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.AllowedValues).toEqual(['dev', 'staging', 'prod']);
      expect(envParam.Default).toBe('dev');
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9-]+$');
      expect(envSuffixParam.MinLength).toBe(1);
      expect(envSuffixParam.MaxLength).toBe(20);
    });

    test('AllowedCIDR parameter should have correct pattern', () => {
      const cidrParam = template.Parameters.AllowedCIDR;
      expect(cidrParam.AllowedPattern).toBe('^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$');
      expect(cidrParam.Default).toBe('10.0.0.0/8');
    });
  });

  describe('Mappings', () => {
    test('should have RegionMap mapping', () => {
      expect(template.Mappings.RegionMap).toBeDefined();
    });

    test('RegionMap should contain supported regions', () => {
      const regionMap = template.Mappings.RegionMap;
      expect(regionMap['us-east-1']).toBeDefined();
      expect(regionMap['us-west-2']).toBeDefined();
      expect(regionMap['eu-west-1']).toBeDefined();
      
      expect(regionMap['us-east-1'].AMI).toBeDefined();
      expect(regionMap['us-west-2'].AMI).toBeDefined();
      expect(regionMap['eu-west-1'].AMI).toBeDefined();
    });
  });

  describe('Resources', () => {
    const expectedResources = [
      'KMSKey',
      'KMSKeyAlias',
      'VPC',
      'InternetGateway',
      'AttachGateway',
      'PublicSubnet1',
      'PublicSubnet2',
      'PrivateSubnet1',
      'PrivateSubnet2',
      'PublicRouteTable',
      'PublicRoute',
      'PublicSubnetRouteTableAssociation1',
      'PublicSubnetRouteTableAssociation2',
      'BastionSecurityGroup',
      'WebServerSecurityGroup',
      'DatabaseSecurityGroup',
      'S3Bucket',
      'S3LoggingBucket',
      'ApplicationLogGroup',
      'EC2Role',
      'EC2InstanceProfile',
      'DeveloperGroup',
      'DBSubnetGroup',
      'DBPasswordSecret',
      'RDSDatabase',
      'CloudTrailLogGroup',
      'CloudTrailLogStream',
      'CloudTrailRole',
      'CloudTrail',
      'CloudTrailBucket',
      'CloudTrailBucketPolicy',
      'CloudFormationStateBucket',
      'LaunchTemplate'
    ];

    test('should have all required resources', () => {
      expectedResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    test('KMS Key should have correct properties', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
      expect(kmsKey.Properties.KeyPolicy.Statement).toHaveLength(4);
    });

    test('VPC should have correct CIDR and DNS settings', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('Public subnets should have correct CIDR blocks', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('Private subnets should have correct CIDR blocks', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      
      expect(subnet1.Properties.CidrBlock).toBe('10.0.10.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('Security groups should have correct ingress rules', () => {
      const bastionSG = template.Resources.BastionSecurityGroup;
      const webSG = template.Resources.WebServerSecurityGroup;
      const dbSG = template.Resources.DatabaseSecurityGroup;

      expect(bastionSG.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(bastionSG.Properties.SecurityGroupIngress[0].FromPort).toBe(22);

      expect(webSG.Properties.SecurityGroupIngress).toHaveLength(2);
      expect(webSG.Properties.SecurityGroupIngress[0].FromPort).toBe(443);
      expect(webSG.Properties.SecurityGroupIngress[1].FromPort).toBe(22);

      expect(dbSG.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(dbSG.Properties.SecurityGroupIngress[0].FromPort).toBe(3306);
    });

    test('S3 buckets should have encryption and public access blocked', () => {
      const appBucket = template.Resources.S3Bucket;
      const logBucket = template.Resources.S3LoggingBucket;
      const cfnStateBucket = template.Resources.CloudFormationStateBucket;

      [appBucket, logBucket, cfnStateBucket].forEach(bucket => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
        expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
        expect(bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
        expect(bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
      });
      
      // CloudFormation state bucket should have versioning enabled
      expect(cfnStateBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('RDS database should be encrypted and private', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.PubliclyAccessible).toBe(false);
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.DeletionPolicy).toBe('Snapshot');
    });

    test('CloudWatch Log Groups should have KMS encryption', () => {
      const appLogGroup = template.Resources.ApplicationLogGroup;
      const trailLogGroup = template.Resources.CloudTrailLogGroup;

      [appLogGroup, trailLogGroup].forEach(logGroup => {
        expect(logGroup.Properties.KmsKeyId).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should include environment suffix in names', () => {
      const resourcesWithSuffix = [
        'VPC',
        'BastionSecurityGroup', 
        'WebServerSecurityGroup',
        'DatabaseSecurityGroup',
        'EC2Role',
        'EC2InstanceProfile',
        'DeveloperGroup',
        'DBSubnetGroup',
        'LaunchTemplate',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PublicRouteTable'
      ];

      resourcesWithSuffix.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameProperty = resource.Properties.GroupName || 
                           resource.Properties.RoleName ||
                           resource.Properties.InstanceProfileName ||
                           resource.Properties.DBSubnetGroupName ||
                           resource.Properties.LaunchTemplateName ||
                           (resource.Properties.Tags && resource.Properties.Tags.find((tag: any) => tag.Key === 'Name')?.Value);

        if (nameProperty && nameProperty['Fn::Sub']) {
          expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('S3 buckets should have unique naming with account ID', () => {
      const appBucket = template.Resources.S3Bucket;
      const logBucket = template.Resources.S3LoggingBucket;
      const trailBucket = template.Resources.CloudTrailBucket;

      [appBucket, logBucket, trailBucket].forEach(bucket => {
        expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${AWS::AccountId}');
        expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });
  });

  describe('Conditions', () => {
    test('should have IsProd condition', () => {
      expect(template.Conditions.IsProd).toBeDefined();
      expect(template.Conditions.IsProd['Fn::Equals']).toEqual([
        { 'Ref': 'Environment' },
        'prod'
      ]);
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'VPCId',
      'S3BucketName',
      'DatabaseEndpoint',
      'DatabaseSecretArn',
      'CloudFormationStateBucketName',
      'KMSKeyId',
      'LaunchTemplateId',
      'WebServerSecurityGroupId'
    ];

    test('should have all required outputs', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have descriptions and export names', () => {
      expectedOutputs.forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output.Description).toBeDefined();
        expect(output.Value).toBeDefined();
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Security Configuration', () => {
    test('KMS key policy should allow CloudWatch Logs service', () => {
      const kmsKey = template.Resources.KMSKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;
      
      const logsStatement = statements.find((stmt: any) => 
        stmt.Sid === 'Allow CloudWatch Logs to encrypt logs'
      );
      expect(logsStatement).toBeDefined();
      expect(logsStatement.Principal.Service['Fn::Sub']).toBe('logs.${AWS::Region}.amazonaws.com');
    });

    test('IAM developer group should require MFA', () => {
      const devGroup = template.Resources.DeveloperGroup;
      const policy = devGroup.Properties.Policies[0];
      
      const denyStatement = policy.PolicyDocument.Statement.find((stmt: any) =>
        stmt.Sid === 'DenyAllExceptUnlessSignedInWithMFA'
      );
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Effect).toBe('Deny');
      expect(denyStatement.Condition.BoolIfExists['aws:MultiFactorAuthPresent']).toBe('false');
    });

    test('EC2 role should have least privilege S3 access', () => {
      const ec2Role = template.Resources.EC2Role;
      const s3Policy = ec2Role.Properties.Policies.find((policy: any) => 
        policy.PolicyName === 'S3AccessPolicy'
      );
      
      expect(s3Policy).toBeDefined();
      const statements = s3Policy.PolicyDocument.Statement;
      expect(statements).toHaveLength(2);
      
      const objectStatement = statements.find((stmt: any) =>
        stmt.Action.includes('s3:GetObject')
      );
      expect(objectStatement.Resource['Fn::Sub']).toBe('arn:aws:s3:::${S3Bucket}/*');
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

    test('should have reasonable number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20);
      expect(resourceCount).toBeLessThan(50);
    });

    test('should have correct parameter count', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(6);
    });

    test('should have correct output count', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });
  });

  describe('CloudTrail Configuration', () => {
    test('CloudTrail should be properly configured', () => {
      const cloudTrail = template.Resources.CloudTrail;
      expect(cloudTrail.Properties.IsMultiRegionTrail).toBe(true);
      expect(cloudTrail.Properties.IncludeGlobalServiceEvents).toBe(true);
      expect(cloudTrail.Properties.EnableLogFileValidation).toBe(true);
      expect(cloudTrail.Properties.IsLogging).toBe(true);
      expect(cloudTrail.Properties.KMSKeyId).toBeDefined();
    });

    test('CloudTrail bucket policy should be restrictive', () => {
      const policy = template.Resources.CloudTrailBucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      
      expect(statements).toHaveLength(3);
      statements.forEach((stmt: any) => {
        expect(stmt.Condition).toBeDefined();
        expect(stmt.Principal.Service).toBe('cloudtrail.amazonaws.com');
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('VPC Gateway attachment should depend on both VPC and IGW', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment.Properties.VpcId.Ref).toBe('VPC');
      expect(attachment.Properties.InternetGatewayId.Ref).toBe('InternetGateway');
    });

    test('Public route should depend on gateway attachment', () => {
      const route = template.Resources.PublicRoute;
      expect(route.DependsOn).toBe('AttachGateway');
    });

    test('RDS should reference correct security group and subnet group', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.VPCSecurityGroups[0].Ref).toBe('DatabaseSecurityGroup');
      expect(rds.Properties.DBSubnetGroupName.Ref).toBe('DBSubnetGroup');
    });
  });
});