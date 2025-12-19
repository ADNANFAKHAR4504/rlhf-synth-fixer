import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Read JSON version of template (converted from YAML using cfn-flip)
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
        'Production-ready secure AWS infrastructure following security best practices'
      );
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'EnvironmentSuffix',
        'PublicEC2AMI',
        'PrivateEC2AMI',
        'AllowedSSHCIDR',
        'DBUsername',
        'Environment',
      ];

      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('Environment parameter should have allowed values', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.AllowedValues).toContain('development');
      expect(envParam.AllowedValues).toContain('staging');
      expect(envParam.AllowedValues).toContain('production');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
    });

    test('should have two public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(
        template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch
      ).toBe(true);
      expect(
        template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch
      ).toBe(true);
    });

    test('should have two private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(
        template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch
      ).toBe(false);
      expect(
        template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch
      ).toBe(false);
    });

    test('should have NAT Gateways for private subnets', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway2EIP).toBeDefined();
    });

    test('should have route tables configured correctly', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute1).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute2).toBeDefined();
    });

    test('subnets should be in different availability zones', () => {
      const pub1AZ =
        template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const pub2AZ =
        template.Resources.PublicSubnet2.Properties.AvailabilityZone;
      expect(pub1AZ).not.toEqual(pub2AZ);
    });
  });

  describe('Security Groups', () => {
    test('should have all required security groups', () => {
      expect(template.Resources.PublicSecurityGroup).toBeDefined();
      expect(template.Resources.PrivateSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
    });

    test('PublicSecurityGroup should restrict SSH access', () => {
      const sg = template.Resources.PublicSecurityGroup;
      const sshRule = sg.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 22
      );
      expect(sshRule).toBeDefined();
      expect(sshRule.CidrIp.Ref).toBe('AllowedSSHCIDR');
    });

    test('DatabaseSecurityGroup should only allow access from app security groups', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      sg.Properties.SecurityGroupIngress.forEach((rule: any) => {
        expect(rule.SourceSecurityGroupId).toBeDefined();
        expect(rule.CidrIp).toBeUndefined();
      });
    });
  });

  describe('EC2 Instances', () => {
    test('should have public and private EC2 instances', () => {
      expect(template.Resources.PublicEC2Instance).toBeDefined();
      expect(template.Resources.PrivateEC2Instance).toBeDefined();
    });

    test('EC2 instances should use parameter AMIs', () => {
      expect(template.Resources.PublicEC2Instance.Properties.ImageId.Ref).toBe(
        'PublicEC2AMI'
      );
      expect(template.Resources.PrivateEC2Instance.Properties.ImageId.Ref).toBe(
        'PrivateEC2AMI'
      );
    });

    test('public EC2 should be in public subnet', () => {
      expect(template.Resources.PublicEC2Instance.Properties.SubnetId.Ref).toBe(
        'PublicSubnet1'
      );
    });

    test('private EC2 should be in private subnet', () => {
      expect(
        template.Resources.PrivateEC2Instance.Properties.SubnetId.Ref
      ).toBe('PrivateSubnet1');
    });

    test('EC2 instances should have IAM instance profiles', () => {
      expect(
        template.Resources.PublicEC2Instance.Properties.IamInstanceProfile
      ).toBeDefined();
      expect(
        template.Resources.PrivateEC2Instance.Properties.IamInstanceProfile
      ).toBeDefined();
    });
  });

  describe('RDS Database', () => {
    test('should have RDS database instance', () => {
      expect(template.Resources.DatabaseInstance).toBeDefined();
      expect(template.Resources.DatabaseInstance.Type).toBe(
        'AWS::RDS::DBInstance'
      );
    });

    test('database should have encryption enabled', () => {
      const db = template.Resources.DatabaseInstance.Properties;
      expect(db.StorageEncrypted).toBe(true);
      expect(db.KmsKeyId).toBeDefined();
    });

    test('database should have automated backups with 7-day retention', () => {
      const db = template.Resources.DatabaseInstance.Properties;
      expect(db.BackupRetentionPeriod).toBe(7);
      expect(db.PreferredBackupWindow).toBeDefined();
    });

    test('database should not have deletion protection for testing', () => {
      const db = template.Resources.DatabaseInstance.Properties;
      expect(db.DeletionProtection).toBe(false);
    });

    test('database should be in private subnets', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      const subnetGroup = template.Resources.DBSubnetGroup.Properties;
      expect(subnetGroup.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetGroup.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });
  });

  describe('S3 Buckets', () => {
    test('should have all required S3 buckets', () => {
      expect(template.Resources.SecureS3Bucket).toBeDefined();
      expect(template.Resources.LoggingBucket).toBeDefined();
      expect(template.Resources.CloudTrailBucket).toBeDefined();
    });

    test('all S3 buckets should have encryption enabled', () => {
      const buckets = ['SecureS3Bucket', 'LoggingBucket', 'CloudTrailBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        const encryption =
          bucket.Properties.BucketEncryption
            .ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
          'AES256'
        );
      });
    });

    test('all S3 buckets should block public access', () => {
      const buckets = ['SecureS3Bucket', 'LoggingBucket', 'CloudTrailBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });
    });

    test('SecureS3Bucket should have logging enabled', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Properties.LoggingConfiguration).toBeDefined();
      expect(
        bucket.Properties.LoggingConfiguration.DestinationBucketName.Ref
      ).toBe('LoggingBucket');
    });
  });

  describe('Lambda Function', () => {
    test('should have security monitoring Lambda function', () => {
      expect(template.Resources.SecurityMonitoringLambda).toBeDefined();
      expect(template.Resources.SecurityMonitoringLambda.Type).toBe(
        'AWS::Lambda::Function'
      );
    });

    test('Lambda should have CloudWatch Logs configured', () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(14);
    });

    test('Lambda should have VPC configuration', () => {
      const lambda = template.Resources.SecurityMonitoringLambda;
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds).toBeDefined();
    });

    test('Lambda should have environment variables configured', () => {
      const lambda = template.Resources.SecurityMonitoringLambda;
      expect(lambda.Properties.Environment).toBeDefined();
      expect(
        lambda.Properties.Environment.Variables.SNS_TOPIC_ARN
      ).toBeDefined();
    });
  });

  describe('IAM Resources', () => {
    test('should have all required IAM roles', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
    });

    test('should have IAM user with MFA enforcement', () => {
      expect(template.Resources.SecureUser).toBeDefined();
      expect(template.Resources.MFAEnforcementPolicy).toBeDefined();
    });

    test('IAM roles should use managed policies instead of inline', () => {
      const ec2Role = template.Resources.EC2Role;
      expect(ec2Role.Properties.ManagedPolicyArns).toBeDefined();
      expect(ec2Role.Properties.ManagedPolicyArns.length).toBeGreaterThan(0);
    });

    test('MFA enforcement policy should deny actions without MFA', () => {
      const policy = template.Resources.MFAEnforcementPolicy;
      const denyStatement = policy.Properties.PolicyDocument.Statement.find(
        (s: any) => s.Sid === 'DenyAllExceptUnlessSignedInWithMFA'
      );
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Effect).toBe('Deny');
      expect(
        denyStatement.Condition.BoolIfExists['aws:MultiFactorAuthPresent']
      ).toBe('false');
    });
  });

  describe('CloudTrail and Monitoring', () => {
    test('should have CloudTrail configured', () => {
      expect(template.Resources.CloudTrail).toBeDefined();
      expect(template.Resources.CloudTrail.Type).toBe('AWS::CloudTrail::Trail');
    });

    test('CloudTrail should be multi-region and have log validation', () => {
      const trail = template.Resources.CloudTrail.Properties;
      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.EnableLogFileValidation).toBe(true);
    });

    test('should have SNS topic for security alerts', () => {
      expect(template.Resources.SecurityAlertsTopic).toBeDefined();
      expect(template.Resources.SecurityAlertsTopic.Type).toBe(
        'AWS::SNS::Topic'
      );
    });

    test('should have EventBridge rule for Security Group changes', () => {
      expect(template.Resources.SecurityGroupChangeRule).toBeDefined();
      const rule = template.Resources.SecurityGroupChangeRule;
      expect(rule.Properties.EventPattern.detail.eventName).toContain(
        'AuthorizeSecurityGroupIngress'
      );
      expect(rule.Properties.EventPattern.detail.eventName).toContain(
        'CreateSecurityGroup'
      );
    });
  });

  describe('KMS Encryption', () => {
    test('should have KMS key for infrastructure encryption', () => {
      expect(template.Resources.InfrastructureKMSKey).toBeDefined();
      expect(template.Resources.InfrastructureKMSKey.Type).toBe(
        'AWS::KMS::Key'
      );
    });

    test('KMS key should have key rotation enabled', () => {
      const key = template.Resources.InfrastructureKMSKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('KMS key should have proper key policy', () => {
      const key = template.Resources.InfrastructureKMSKey;
      const statements = key.Properties.KeyPolicy.Statement;
      expect(statements).toBeDefined();
      expect(statements.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Deletion Policies', () => {
    test('all resources should have Delete policy for testing environment', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).toBe('Delete');
        }
      });
    });

    test('no resources should have Retain policy', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all nameable resources should include environment suffix', () => {
      const namedResources = [
        'InfrastructureKMSKey',
        'VPC',
        'PublicSecurityGroup',
        'PrivateSecurityGroup',
        'DatabaseSecurityGroup',
        'EC2Role',
        'SecureUser',
        'DatabaseInstance',
        'SecureS3Bucket',
        'SecurityMonitoringLambda',
        'CloudTrail',
      ];

      namedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties) {
          const props = resource.Properties;
          // Check various naming properties
          const nameProps = [
            props.Name,
            props.FunctionName,
            props.RoleName,
            props.UserName,
            props.DBInstanceIdentifier,
            props.BucketName,
            props.TrailName,
            props.GroupName,
          ].filter(p => p !== undefined);

          if (nameProps.length > 0) {
            const hasEnvSuffix = nameProps.some(prop => {
              if (typeof prop === 'string') {
                return prop.includes('${EnvironmentSuffix}');
              }
              if (prop && prop['Fn::Sub']) {
                return prop['Fn::Sub'].includes('${EnvironmentSuffix}');
              }
              if (prop && prop['Fn::Join']) {
                // Check if the Fn::Join includes EnvironmentSuffix
                const joinArray = prop['Fn::Join'][1];
                if (Array.isArray(joinArray)) {
                  return joinArray.some(
                    item =>
                      (typeof item === 'object' &&
                        item.Ref === 'EnvironmentSuffix') ||
                      (typeof item === 'string' &&
                        item.includes('${EnvironmentSuffix}'))
                  );
                }
              }
              return false;
            });
            expect(hasEnvSuffix).toBe(true);
          }
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have all essential outputs', () => {
      const essentialOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'DatabaseEndpoint',
        'SecureS3BucketName',
        'LambdaFunctionArn',
        'SNSTopicArn',
        'StackName',
        'EnvironmentSuffix',
      ];

      essentialOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Security Best Practices', () => {
    test('EC2 instances should have security groups attached', () => {
      expect(
        template.Resources.PublicEC2Instance.Properties.SecurityGroupIds
      ).toBeDefined();
      expect(
        template.Resources.PrivateEC2Instance.Properties.SecurityGroupIds
      ).toBeDefined();
    });

    test('RDS should not be publicly accessible', () => {
      const db = template.Resources.DatabaseInstance.Properties;
      expect(db.PubliclyAccessible).toBe(false);
    });

    test('Lambda functions should not have unrestricted permissions', () => {
      const lambdaRole = template.Resources.LambdaExecutionRole;
      const policies = lambdaRole.Properties.ManagedPolicyArns;
      expect(policies).not.toContain(
        'arn:aws:iam::aws:policy/AdministratorAccess'
      );
    });

    test('S3 buckets should have versioning enabled where appropriate', () => {
      const secureBucket = template.Resources.SecureS3Bucket;
      expect(secureBucket.Properties.VersioningConfiguration).toBeDefined();
      expect(secureBucket.Properties.VersioningConfiguration.Status).toBe(
        'Enabled'
      );
    });
  });

  describe('Template Completeness', () => {
    test('should have at least 40 resources for comprehensive infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(40);
    });

    test('should have proper dependencies between resources', () => {
      // Check that CloudTrail depends on bucket policy
      expect(template.Resources.CloudTrail.DependsOn).toContain(
        'CloudTrailBucketPolicy'
      );

      // Check that NAT Gateways depend on Internet Gateway attachment
      expect(template.Resources.NatGateway1EIP.DependsOn).toContain(
        'InternetGatewayAttachment'
      );
    });
  });
});
