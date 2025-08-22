import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Secure CloudFormation Template', () => {
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
        'Secure AWS environment with comprehensive security controls and best practices'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
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

  describe('Security Resources', () => {
    describe('KMS Key', () => {
      test('should have KMS key for encryption', () => {
        expect(template.Resources.SecureKMSKey).toBeDefined();
        expect(template.Resources.SecureKMSKey.Type).toBe('AWS::KMS::Key');
      });

      test('KMS key should have proper key policy', () => {
        const kmsKey = template.Resources.SecureKMSKey;
        const keyPolicy = kmsKey.Properties.KeyPolicy;
        expect(keyPolicy.Statement).toBeDefined();
        expect(keyPolicy.Statement.length).toBeGreaterThan(0);
        
        // Check for root account permissions
        const rootPermission = keyPolicy.Statement.find((s: any) => 
          s.Sid === 'Enable IAM User Permissions'
        );
        expect(rootPermission).toBeDefined();
        expect(rootPermission.Effect).toBe('Allow');
      });

      test('should have KMS key alias', () => {
        expect(template.Resources.SecureKMSKeyAlias).toBeDefined();
        expect(template.Resources.SecureKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
      });
    });

    describe('CloudTrail', () => {
      test('should have CloudTrail for audit logging', () => {
        expect(template.Resources.SecureCloudTrail).toBeDefined();
        expect(template.Resources.SecureCloudTrail.Type).toBe('AWS::CloudTrail::Trail');
      });

      test('CloudTrail should have encryption enabled', () => {
        const trail = template.Resources.SecureCloudTrail;
        expect(trail.Properties.KMSKeyId).toBeDefined();
        expect(trail.Properties.EnableLogFileValidation).toBe(true);
        expect(trail.Properties.IsMultiRegionTrail).toBe(true);
        expect(trail.Properties.IsLogging).toBe(true);
      });

      test('should have CloudWatch Log Group for CloudTrail', () => {
        expect(template.Resources.CloudTrailLogGroup).toBeDefined();
        expect(template.Resources.CloudTrailLogGroup.Type).toBe('AWS::Logs::LogGroup');
      });
    });

    describe('CloudWatch Alarms', () => {
      test('should have unauthorized API calls alarm', () => {
        expect(template.Resources.UnauthorizedAPICallsAlarm).toBeDefined();
        expect(template.Resources.UnauthorizedAPICallsAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      });

      test('should have root account usage alarm', () => {
        expect(template.Resources.RootAccountUsageAlarm).toBeDefined();
        expect(template.Resources.RootAccountUsageAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      });
    });
  });

  describe('Network Resources', () => {
    describe('VPC', () => {
      test('should have VPC', () => {
        expect(template.Resources.SecureVPC).toBeDefined();
        expect(template.Resources.SecureVPC.Type).toBe('AWS::EC2::VPC');
      });

      test('VPC should have correct CIDR block', () => {
        const vpc = template.Resources.SecureVPC;
        expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
        expect(vpc.Properties.EnableDnsHostnames).toBe(true);
        expect(vpc.Properties.EnableDnsSupport).toBe(true);
      });
    });

    describe('Subnets', () => {
      test('should have private subnets', () => {
        expect(template.Resources.PrivateSubnet1).toBeDefined();
        expect(template.Resources.PrivateSubnet2).toBeDefined();
        expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
        expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
      });

      test('private subnets should not auto-assign public IPs', () => {
        expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
        expect(template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
      });

      test('should have public subnet for NAT Gateway', () => {
        expect(template.Resources.PublicSubnet).toBeDefined();
        expect(template.Resources.PublicSubnet.Type).toBe('AWS::EC2::Subnet');
      });

      test('subnets should use dynamic availability zones', () => {
        const subnet1 = template.Resources.PrivateSubnet1;
        const subnet2 = template.Resources.PrivateSubnet2;
        const publicSubnet = template.Resources.PublicSubnet;
        
        expect(subnet1.Properties.AvailabilityZone).toBeDefined();
        expect(subnet2.Properties.AvailabilityZone).toBeDefined();
        expect(publicSubnet.Properties.AvailabilityZone).toBeDefined();
      });
    });

    describe('Gateways', () => {
      test('should have Internet Gateway', () => {
        expect(template.Resources.InternetGateway).toBeDefined();
        expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      });

      test('should have NAT Gateway', () => {
        expect(template.Resources.NATGateway).toBeDefined();
        expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
      });

      test('should have Elastic IP for NAT Gateway', () => {
        expect(template.Resources.NATGatewayEIP).toBeDefined();
        expect(template.Resources.NATGatewayEIP.Type).toBe('AWS::EC2::EIP');
      });
    });

    describe('Route Tables', () => {
      test('should have public and private route tables', () => {
        expect(template.Resources.PublicRouteTable).toBeDefined();
        expect(template.Resources.PrivateRouteTable).toBeDefined();
      });

      test('should have routes configured', () => {
        expect(template.Resources.PublicRoute).toBeDefined();
        expect(template.Resources.PrivateRoute).toBeDefined();
      });

      test('should have route table associations', () => {
        expect(template.Resources.PublicSubnetRouteTableAssociation).toBeDefined();
        expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
        expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
      });
    });

    describe('Security Groups', () => {
      test('should have EC2 security group', () => {
        expect(template.Resources.EC2SecurityGroup).toBeDefined();
        expect(template.Resources.EC2SecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      });

      test('should have bastion security group', () => {
        expect(template.Resources.BastionSecurityGroup).toBeDefined();
        expect(template.Resources.BastionSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      });

      test('should have ALB security group', () => {
        expect(template.Resources.ALBSecurityGroup).toBeDefined();
        expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      });

      test('should have Lambda security group', () => {
        expect(template.Resources.LambdaSecurityGroup).toBeDefined();
        expect(template.Resources.LambdaSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      });

      test('security groups should have restrictive rules', () => {
        const ec2Sg = template.Resources.EC2SecurityGroup;
        expect(ec2Sg.Properties.SecurityGroupIngress).toBeDefined();
        expect(ec2Sg.Properties.SecurityGroupEgress).toBeDefined();
      });
    });
  });

  describe('Storage Resources', () => {
    describe('S3 Buckets', () => {
      test('should have logging bucket', () => {
        expect(template.Resources.LoggingBucket).toBeDefined();
        expect(template.Resources.LoggingBucket.Type).toBe('AWS::S3::Bucket');
      });

      test('should have Lambda deployment bucket', () => {
        expect(template.Resources.LambdaDeploymentBucket).toBeDefined();
        expect(template.Resources.LambdaDeploymentBucket.Type).toBe('AWS::S3::Bucket');
      });

      test('buckets should have encryption enabled', () => {
        const loggingBucket = template.Resources.LoggingBucket;
        const lambdaBucket = template.Resources.LambdaDeploymentBucket;
        
        expect(loggingBucket.Properties.BucketEncryption).toBeDefined();
        expect(lambdaBucket.Properties.BucketEncryption).toBeDefined();
      });

      test('buckets should have public access blocked', () => {
        const loggingBucket = template.Resources.LoggingBucket;
        const lambdaBucket = template.Resources.LambdaDeploymentBucket;
        
        expect(loggingBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
        expect(loggingBucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
        expect(loggingBucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
        expect(loggingBucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
        
        expect(lambdaBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
        expect(lambdaBucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
        expect(lambdaBucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
        expect(lambdaBucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
      });

      test('buckets should have versioning enabled', () => {
        const loggingBucket = template.Resources.LoggingBucket;
        const lambdaBucket = template.Resources.LambdaDeploymentBucket;
        
        expect(loggingBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
        expect(lambdaBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      });

      test('should have bucket policy for CloudTrail', () => {
        expect(template.Resources.LoggingBucketPolicy).toBeDefined();
        expect(template.Resources.LoggingBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
      });
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 role', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      expect(template.Resources.EC2Role.Type).toBe('AWS::IAM::Role');
    });

    test('should have EC2 instance profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have CloudTrail role', () => {
      expect(template.Resources.CloudTrailRole).toBeDefined();
      expect(template.Resources.CloudTrailRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have Lambda zip creator role', () => {
      expect(template.Resources.LambdaZipCreatorRole).toBeDefined();
      expect(template.Resources.LambdaZipCreatorRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have MFA required group', () => {
      expect(template.Resources.MFARequiredGroup).toBeDefined();
      expect(template.Resources.MFARequiredGroup.Type).toBe('AWS::IAM::Group');
    });

    test('MFA group should have deny policy for non-MFA actions', () => {
      const mfaGroup = template.Resources.MFARequiredGroup;
      const policy = mfaGroup.Properties.Policies[0];
      expect(policy.PolicyName).toBe('RequireMFA');
      expect(policy.PolicyDocument.Statement[0].Effect).toBe('Deny');
    });
  });

  describe('Lambda Resources', () => {
    test('should have Lambda zip creator function', () => {
      expect(template.Resources.LambdaZipCreatorFunction).toBeDefined();
      expect(template.Resources.LambdaZipCreatorFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have Lambda zip creator custom resource', () => {
      expect(template.Resources.LambdaZipCreator).toBeDefined();
      expect(template.Resources.LambdaZipCreator.Type).toBe('AWS::CloudFormation::CustomResource');
    });

    test('should have secure Lambda function', () => {
      expect(template.Resources.SecureLambdaFunction).toBeDefined();
      expect(template.Resources.SecureLambdaFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda function should have VPC configuration', () => {
      const lambda = template.Resources.SecureLambdaFunction;
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds).toBeDefined();
    });

    test('Lambda function should have KMS key configuration', () => {
      const lambda = template.Resources.SecureLambdaFunction;
      expect(lambda.Properties.KmsKeyArn).toBeDefined();
    });
  });

  describe('Secrets Manager', () => {
    test('should have EC2 user data secret', () => {
      expect(template.Resources.EC2UserDataSecret).toBeDefined();
      expect(template.Resources.EC2UserDataSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('secret should be encrypted with KMS', () => {
      const secret = template.Resources.EC2UserDataSecret;
      expect(secret.Properties.KmsKeyId).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have VPC outputs', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
    });

    test('should have KMS key output', () => {
      expect(template.Outputs.KMSKeyId).toBeDefined();
    });

    test('should have Lambda deployment bucket output', () => {
      expect(template.Outputs.LambdaDeploymentBucket).toBeDefined();
    });

    test('should have CloudTrail output', () => {
      expect(template.Outputs.CloudTrailArn).toBeDefined();
    });

    test('should have Lambda function output', () => {
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('CloudTrail should depend on bucket policy', () => {
      const trail = template.Resources.SecureCloudTrail;
      expect(trail.DependsOn).toContain('LoggingBucketPolicy');
    });

    test('NAT Gateway EIP should depend on Internet Gateway attachment', () => {
      const eip = template.Resources.NATGatewayEIP;
      expect(eip.DependsOn).toBe('AttachGateway');
    });

    test('Secure Lambda function should depend on zip creator', () => {
      const lambda = template.Resources.SecureLambdaFunction;
      expect(lambda.DependsOn).toBe('LambdaZipCreator');
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources with Name tag should include environment suffix', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties?.Tags) {
          const nameTag = resource.Properties.Tags.find((t: any) => t.Key === 'Name');
          if (nameTag) {
            expect(nameTag.Value).toEqual(
              expect.objectContaining({ 'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}') })
            );
          }
        }
      });
    });

    test('bucket names should include account ID and environment suffix', () => {
      const loggingBucket = template.Resources.LoggingBucket;
      const lambdaBucket = template.Resources.LambdaDeploymentBucket;
      
      expect(loggingBucket.Properties.BucketName).toEqual(
        expect.objectContaining({ 'Fn::Sub': expect.stringContaining('${AWS::AccountId}') })
      );
      expect(loggingBucket.Properties.BucketName).toEqual(
        expect.objectContaining({ 'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}') })
      );
      
      expect(lambdaBucket.Properties.BucketName).toEqual(
        expect.objectContaining({ 'Fn::Sub': expect.stringContaining('${AWS::AccountId}') })
      );
      expect(lambdaBucket.Properties.BucketName).toEqual(
        expect.objectContaining({ 'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}') })
      );
    });
  });

  describe('Security Best Practices', () => {
    test('should not have any resources with Retain deletion policy', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('all IAM roles should follow least privilege principle', () => {
      const roles = ['EC2Role', 'LambdaExecutionRole', 'CloudTrailRole', 'LambdaZipCreatorRole'];
      roles.forEach(roleName => {
        const role = template.Resources[roleName];
        expect(role).toBeDefined();
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      });
    });

    test('Lambda functions should have environment variables defined', () => {
      const lambda = template.Resources.SecureLambdaFunction;
      expect(lambda.Properties.Environment).toBeDefined();
      expect(lambda.Properties.Environment.Variables).toBeDefined();
    });

    test('CloudTrail should have log file validation enabled', () => {
      const trail = template.Resources.SecureCloudTrail;
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('CloudWatch log groups should have retention period', () => {
      const logGroup = template.Resources.CloudTrailLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBeDefined();
      expect(logGroup.Properties.RetentionInDays).toBe(90);
    });
  });

  describe('Template Completeness', () => {
    test('should have all expected resource types', () => {
      const expectedResourceTypes = [
        'AWS::KMS::Key',
        'AWS::KMS::Alias',
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::NatGateway',
        'AWS::EC2::EIP',
        'AWS::EC2::RouteTable',
        'AWS::EC2::Route',
        'AWS::EC2::SubnetRouteTableAssociation',
        'AWS::EC2::SecurityGroup',
        'AWS::S3::Bucket',
        'AWS::S3::BucketPolicy',
        'AWS::IAM::Role',
        'AWS::IAM::InstanceProfile',
        'AWS::IAM::Group',
        'AWS::Lambda::Function',
        'AWS::CloudFormation::CustomResource',
        'AWS::SecretsManager::Secret',
        'AWS::CloudTrail::Trail',
        'AWS::Logs::LogGroup',
        'AWS::CloudWatch::Alarm'
      ];

      const actualResourceTypes = new Set(
        Object.values(template.Resources).map((r: any) => r.Type)
      );

      expectedResourceTypes.forEach(type => {
        expect(actualResourceTypes).toContain(type);
      });
    });

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30); // Expect at least 30 resources for comprehensive security
    });
  });
});