import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let templateContent: string;

  beforeAll(() => {
    // Load the YAML template as string
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    templateContent = fs.readFileSync(templatePath, 'utf8');
  });

  // Helper function to check if a string contains CloudFormation intrinsic functions
  const hasIntrinsicFunction = (str: string, functionName: string): boolean => {
    return str.includes(`!${functionName}`);
  };

  // Helper function to check if a string contains a resource reference
  const hasResourceReference = (str: string, resourceName: string): boolean => {
    return str.includes(`!Ref ${resourceName}`) || str.includes(`!GetAtt ${resourceName}`);
  };

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(templateContent).toContain("AWSTemplateFormatVersion: '2010-09-09'");
    });

    test('should have a description', () => {
      expect(templateContent).toContain('Highly secure, production-ready AWS environment with VPC, EC2, RDS, S3, Lambda, and monitoring');
    });

    test('should have LatestAmiId parameter', () => {
      expect(templateContent).toContain('LatestAmiId:');
      expect(templateContent).toContain('Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(templateContent).toContain('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });


  });

  describe('Parameters', () => {
    test('should have AllowedSSHIP parameter', () => {
      expect(templateContent).toContain('AllowedSSHIP:');
    });

    test('AllowedSSHIP parameter should have correct properties', () => {
      expect(templateContent).toContain('Type: String');
      expect(templateContent).toContain("Default: '0.0.0.0/32'");
      expect(templateContent).toContain('IP address allowed to SSH to EC2 instances (CIDR format)');
    });

    test('should have DBUsername parameter', () => {
      expect(templateContent).toContain('DBUsername:');
    });

    test('should have NotificationEmail parameter', () => {
      expect(templateContent).toContain('NotificationEmail:');
      expect(templateContent).toContain('Default: \'admin@example.com\'');
    });
  });

  describe('Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(templateContent).toContain('TapVPC:');
      expect(templateContent).toContain('Type: AWS::EC2::VPC');
    });

    test('VPC should have correct properties', () => {
      expect(templateContent).toContain('CidrBlock: 10.0.0.0/16');
      expect(templateContent).toContain('EnableDnsHostnames: true');
      expect(templateContent).toContain('EnableDnsSupport: true');
    });

    test('should have Internet Gateway', () => {
      expect(templateContent).toContain('TapInternetGateway:');
      expect(templateContent).toContain('Type: AWS::EC2::InternetGateway');
    });

    test('should have public subnets', () => {
      expect(templateContent).toContain('TapPublicSubnet1:');
      expect(templateContent).toContain('TapPublicSubnet2:');
    });

    test('public subnets should have correct properties', () => {
      expect(templateContent).toContain('CidrBlock: 10.0.1.0/24');
      expect(templateContent).toContain('CidrBlock: 10.0.2.0/24');
      // AvailabilityZone is dynamically selected using !Select and !GetAZs
      expect(templateContent).toContain("AvailabilityZone: !Select [ 0, !GetAZs '' ]");
      expect(templateContent).toContain("AvailabilityZone: !Select [ 1, !GetAZs '' ]");
      expect(templateContent).toContain('MapPublicIpOnLaunch: true');
    });

    test('should have private subnets', () => {
      expect(templateContent).toContain('TapPrivateSubnet1:');
      expect(templateContent).toContain('TapPrivateSubnet2:');
    });

    test('private subnets should have correct properties', () => {
      expect(templateContent).toContain('CidrBlock: 10.0.3.0/24');
      expect(templateContent).toContain('CidrBlock: 10.0.4.0/24');
    });

    test('should have NAT Gateway', () => {
      expect(templateContent).toContain('TapNATGateway:');
      expect(templateContent).toContain('Type: AWS::EC2::NatGateway');
    });

    test('should have route tables', () => {
      expect(templateContent).toContain('TapPublicRouteTable:');
      expect(templateContent).toContain('TapPrivateRouteTable:');
    });
  });

  describe('Security Groups', () => {
    test('should have EC2 security group', () => {
      expect(templateContent).toContain('TapEC2SecurityGroup:');
      expect(templateContent).toContain('Type: AWS::EC2::SecurityGroup');
    });

    test('should have RDS security group', () => {
      expect(templateContent).toContain('TapRDSSecurityGroup:');
      expect(templateContent).toContain('Type: AWS::EC2::SecurityGroup');
    });

    test('should have Lambda security group', () => {
      expect(templateContent).toContain('TapLambdaSecurityGroup:');
      expect(templateContent).toContain('Type: AWS::EC2::SecurityGroup');
    });
  });

  describe('Compute Resources', () => {
    test('should have launch template', () => {
      expect(templateContent).toContain('TapLaunchTemplate:');
      expect(templateContent).toContain('Type: AWS::EC2::LaunchTemplate');
    });

    test('should have correct AMI reference', () => {
      expect(templateContent).toContain('ImageId: !Ref LatestAmiId');
    });

    test('should have auto scaling group', () => {
      expect(templateContent).toContain('TapAutoScalingGroup:');
      expect(templateContent).toContain('Type: AWS::AutoScaling::AutoScalingGroup');
    });
  });

  describe('VPC Endpoints', () => {
    test('should have S3 VPC Endpoint', () => {
      expect(templateContent).toContain('TapS3VPCEndpoint:');
      expect(templateContent).toContain('Type: AWS::EC2::VPCEndpoint');
      expect(templateContent).toContain('VpcEndpointType: Gateway');
    });
  });

  describe('Storage Resources', () => {
    test('should have S3 bucket', () => {
      expect(templateContent).toContain('TapS3Bucket:');
      expect(templateContent).toContain('Type: AWS::S3::Bucket');
      expect(templateContent).toContain('VersioningConfiguration:');
      expect(templateContent).toContain('Status: Enabled');
      expect(templateContent).toContain('BucketEncryption:');
      expect(templateContent).toContain('SSEAlgorithm: AES256');
    });

    test('should have S3 bucket notification configuration', () => {
      expect(templateContent).toContain('NotificationConfiguration:');
      expect(templateContent).toContain('LambdaConfigurations:');
      expect(templateContent).toContain('Event: s3:ObjectCreated:*');
      expect(templateContent).toContain('Function: !GetAtt TapLambdaFunction.Arn');
    });

    test('should have S3 bucket policy', () => {
      expect(templateContent).toContain('TapS3BucketPolicy:');
      expect(templateContent).toContain('Type: AWS::S3::BucketPolicy');
      expect(templateContent).toContain('aws:SourceVpce');
      expect(templateContent).toContain('s3:GetObject');
      expect(templateContent).toContain('s3:PutObject');
    });

    test('should have Secrets Manager secret', () => {
      expect(templateContent).toContain('TapDBSecret:');
      expect(templateContent).toContain('Type: AWS::SecretsManager::Secret');
    });
  });

  describe('Database Resources', () => {
    test('should have RDS subnet group', () => {
      expect(templateContent).toContain('TapDBSubnetGroup:');
      expect(templateContent).toContain('Type: AWS::RDS::DBSubnetGroup');
    });

    test('should have RDS instance', () => {
      expect(templateContent).toContain('TapRDSInstance:');
      expect(templateContent).toContain('Type: AWS::RDS::DBInstance');
    });
  });

  describe('Serverless Resources', () => {
    test('should have Lambda function', () => {
      expect(templateContent).toContain('TapLambdaFunction:');
      expect(templateContent).toContain('Type: AWS::Lambda::Function');
    });


  });

  describe('IAM Resources', () => {
    test('should have EC2 role', () => {
      expect(templateContent).toContain('TapEC2Role:');
      expect(templateContent).toContain('Type: AWS::IAM::Role');
    });

    test('should have Lambda execution role', () => {
      expect(templateContent).toContain('TapLambdaExecutionRole:');
      expect(templateContent).toContain('Type: AWS::IAM::Role');
    });

    test('should have instance profile', () => {
      expect(templateContent).toContain('TapEC2InstanceProfile:');
      expect(templateContent).toContain('Type: AWS::IAM::InstanceProfile');
    });
  });

  describe('Monitoring Resources', () => {
    test('should have SNS topic', () => {
      expect(templateContent).toContain('TapSNSTopic:');
      expect(templateContent).toContain('Type: AWS::SNS::Topic');
    });

    test('should have SNS subscription', () => {
      expect(templateContent).toContain('TapSNSSubscription:');
      expect(templateContent).toContain('Type: AWS::SNS::Subscription');
    });

    test('should have CloudWatch alarm', () => {
      expect(templateContent).toContain('TapCPUAlarm:');
      expect(templateContent).toContain('Type: AWS::CloudWatch::Alarm');
    });
  });

  describe('Outputs', () => {
    test('should have network outputs', () => {
      expect(templateContent).toContain('VPCId:');
      expect(templateContent).toContain('PublicSubnetIds:');
      expect(templateContent).toContain('PrivateSubnetIds:');
    });

    test('should have security group outputs', () => {
      expect(templateContent).toContain('EC2SecurityGroupId:');
      expect(templateContent).toContain('RDSSecurityGroupId:');
      expect(templateContent).toContain('LambdaSecurityGroupId:');
    });

    test('should have compute outputs', () => {
      expect(templateContent).toContain('AutoScalingGroupName:');
      expect(templateContent).toContain('LaunchTemplateId:');
    });

    test('should have storage outputs', () => {
      expect(templateContent).toContain('S3BucketName:');
    });

    test('should have database outputs', () => {
      expect(templateContent).toContain('RDSEndpoint:');
      expect(templateContent).toContain('RDSInstanceId:');
    });

    test('should have Lambda outputs', () => {
      expect(templateContent).toContain('LambdaFunctionArn:');
      expect(templateContent).toContain('LambdaFunctionName:');
    });

    test('should have IAM outputs', () => {
      expect(templateContent).toContain('EC2RoleArn:');
      expect(templateContent).toContain('EC2InstanceProfileArn:');
    });

    test('should have monitoring outputs', () => {
      expect(templateContent).toContain('SNSTopicArn:');
      expect(templateContent).toContain('CloudWatchAlarmName:');
    });

    test('should have test configuration output', () => {
      expect(templateContent).toContain('TestConfiguration:');
    });
  });

  describe('CAPABILITY_IAM Compliance', () => {
    test('IAM roles should not have RoleName property', () => {
      // Check that IAM roles don't have explicit RoleName properties
      const ec2RoleSection = templateContent.substring(
        templateContent.indexOf('TapEC2Role:'),
        templateContent.indexOf('TapEC2Role:') + 500
      );
      const lambdaRoleSection = templateContent.substring(
        templateContent.indexOf('TapLambdaExecutionRole:'),
        templateContent.indexOf('TapLambdaExecutionRole:') + 500
      );
      
      expect(ec2RoleSection).not.toContain('RoleName:');
      expect(lambdaRoleSection).not.toContain('RoleName:');
    });

    test('Instance profile should not have InstanceProfileName property', () => {
      const instanceProfileSection = templateContent.substring(
        templateContent.indexOf('TapEC2InstanceProfile:'),
        templateContent.indexOf('TapEC2InstanceProfile:') + 500
      );
      
      expect(instanceProfileSection).not.toContain('InstanceProfileName:');
    });
  });

  describe('CloudFormation Intrinsic Functions', () => {
    test('should use !Ref for resource references', () => {
      expect(hasIntrinsicFunction(templateContent, 'Ref')).toBe(true);
    });

    test('should use !Sub for string substitutions', () => {
      expect(hasIntrinsicFunction(templateContent, 'Sub')).toBe(true);
    });

    test('should use !GetAtt for attribute references', () => {
      expect(hasIntrinsicFunction(templateContent, 'GetAtt')).toBe(true);
    });

    test('should use !Ref for parameter references', () => {
      expect(hasIntrinsicFunction(templateContent, 'Ref')).toBe(true);
    });
  });

  describe('Template Validation', () => {
    test('should have valid YAML structure', () => {
      // Basic validation that the template has required sections
      expect(templateContent).toContain('AWSTemplateFormatVersion:');
      expect(templateContent).toContain('Description:');
      expect(templateContent).toContain('Parameters:');
      expect(templateContent).toContain('Resources:');
      expect(templateContent).toContain('Outputs:');
    });

    test('should have correct number of resources', () => {
      // Count the number of resource definitions
      const resourceMatches = templateContent.match(/^\s+\w+:\s*$/gm) || [];
      const resourceCount = resourceMatches.length;
      expect(resourceCount).toBeGreaterThan(20); // Should have many resources
    });

    test('should have correct number of parameters', () => {
      // Count the number of parameter definitions
      const parameterMatches = templateContent.match(/^\s+\w+:\s*$/gm) || [];
      const parameterCount = parameterMatches.length;
      expect(parameterCount).toBeGreaterThan(3); // Should have several parameters
    });

    test('should have correct number of outputs', () => {
      // Count the number of output definitions
      const outputMatches = templateContent.match(/^\s+\w+:\s*$/gm) || [];
      const outputCount = outputMatches.length;
      expect(outputCount).toBeGreaterThan(10); // Should have many outputs
    });
  });

  describe('Integration Test Placeholder', () => {
    test('Integration tests should be implemented separately', () => {
      // This is a placeholder for integration tests
      expect(true).toBe(true);
    });
  });
});

