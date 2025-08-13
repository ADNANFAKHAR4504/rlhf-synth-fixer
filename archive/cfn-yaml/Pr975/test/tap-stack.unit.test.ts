import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let templateContent: string;

  beforeAll(() => {
    // Load the YAML template as string for testing
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    templateContent = fs.readFileSync(templatePath, 'utf8');
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(templateContent).toContain('AWSTemplateFormatVersion: \'2010-09-09\'');
    });

    test('should have a description', () => {
      expect(templateContent).toContain('Description:');
      expect(templateContent).toContain('Secure multi-AZ VPC with Lambda, S3 VPC Endpoint, KMS encryption, and CloudTrail logging');
    });

    test('should have all required sections', () => {
      expect(templateContent).toContain('Parameters:');
      expect(templateContent).toContain('Conditions:');
      expect(templateContent).toContain('Resources:');
      expect(templateContent).toContain('Outputs:');
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParameters = [
        'VpcCidr:',
        'NumberOfAZs:',
        'LambdaRuntime:',
        'FunctionNamePrefix:',
        'Environment:'
      ];

      expectedParameters.forEach(paramName => {
        expect(templateContent).toContain(paramName);
      });
    });

    test('VpcCidr parameter should have correct properties', () => {
      expect(templateContent).toContain('VpcCidr:');
      expect(templateContent).toContain('Type: String');
      expect(templateContent).toContain('Default: \'10.0.0.0/16\'');
      expect(templateContent).toContain('Description: \'CIDR block for the VPC\'');
    });

    test('NumberOfAZs parameter should have correct properties', () => {
      expect(templateContent).toContain('NumberOfAZs:');
      expect(templateContent).toContain('Type: Number');
      expect(templateContent).toContain('Default: 2');
      expect(templateContent).toContain('MinValue: 2');
      expect(templateContent).toContain('MaxValue: 4');
    });

    test('LambdaRuntime parameter should have correct properties', () => {
      expect(templateContent).toContain('LambdaRuntime:');
      expect(templateContent).toContain('Type: String');
      expect(templateContent).toContain('Default: \'python3.9\'');
      expect(templateContent).toContain('python3.8');
      expect(templateContent).toContain('python3.9');
      expect(templateContent).toContain('python3.10');
      expect(templateContent).toContain('python3.11');
    });

    test('Environment parameter should have correct properties', () => {
      expect(templateContent).toContain('Environment:');
      expect(templateContent).toContain('Type: String');
      expect(templateContent).toContain('Default: \'dev\'');
      expect(templateContent).toContain('dev');
      expect(templateContent).toContain('test');
      expect(templateContent).toContain('prod');
    });
  });

  describe('Conditions', () => {
    test('should have UseThreeAZs condition', () => {
      expect(templateContent).toContain('UseThreeAZs:');
    });

    test('should have UseFourAZs condition', () => {
      expect(templateContent).toContain('UseFourAZs:');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(templateContent).toContain('VPC:');
      expect(templateContent).toContain('Type: AWS::EC2::VPC');
    });

    test('should have Internet Gateway', () => {
      expect(templateContent).toContain('InternetGateway:');
      expect(templateContent).toContain('Type: AWS::EC2::InternetGateway');
    });

    test('should have Internet Gateway Attachment', () => {
      expect(templateContent).toContain('InternetGatewayAttachment:');
      expect(templateContent).toContain('Type: AWS::EC2::VPCGatewayAttachment');
    });

    test('should have public subnets', () => {
      expect(templateContent).toContain('PublicSubnet1:');
      expect(templateContent).toContain('PublicSubnet2:');
      expect(templateContent).toContain('Type: AWS::EC2::Subnet');
    });

    test('should have private subnets', () => {
      expect(templateContent).toContain('PrivateSubnet1:');
      expect(templateContent).toContain('PrivateSubnet2:');
    });

    test('should have conditional subnets for 3+ AZs', () => {
      expect(templateContent).toContain('PublicSubnet3:');
      expect(templateContent).toContain('PrivateSubnet3:');
      expect(templateContent).toContain('Condition: UseThreeAZs');
    });

    test('should have conditional subnets for 4 AZs', () => {
      expect(templateContent).toContain('PublicSubnet4:');
      expect(templateContent).toContain('PrivateSubnet4:');
      expect(templateContent).toContain('Condition: UseFourAZs');
    });

    test('should have NAT Gateways', () => {
      expect(templateContent).toContain('NatGateway1:');
      expect(templateContent).toContain('NatGateway2:');
      expect(templateContent).toContain('Type: AWS::EC2::NatGateway');
    });

    test('should have NAT Gateway EIPs', () => {
      expect(templateContent).toContain('NatGateway1EIP:');
      expect(templateContent).toContain('NatGateway2EIP:');
      expect(templateContent).toContain('Type: AWS::EC2::EIP');
    });

    test('should have route tables', () => {
      expect(templateContent).toContain('PublicRouteTable:');
      expect(templateContent).toContain('PrivateRouteTable1:');
      expect(templateContent).toContain('PrivateRouteTable2:');
      expect(templateContent).toContain('Type: AWS::EC2::RouteTable');
    });

    test('should have Network ACLs', () => {
      expect(templateContent).toContain('PrivateNetworkAcl:');
      expect(templateContent).toContain('Type: AWS::EC2::NetworkAcl');
    });
  });

  describe('Security Resources', () => {
    test('should have security groups', () => {
      expect(templateContent).toContain('PublicSecurityGroup:');
      expect(templateContent).toContain('LambdaSecurityGroup:');
      expect(templateContent).toContain('Type: AWS::EC2::SecurityGroup');
      // Note: No GroupName properties - uses CAPABILITY_IAM instead of CAPABILITY_NAMED_IAM
    });

    test('should have KMS keys', () => {
      expect(templateContent).toContain('S3KMSKey:');
      expect(templateContent).toContain('CloudTrailKMSKey:');
      expect(templateContent).toContain('Type: AWS::KMS::Key');
    });

    test('should have KMS key aliases', () => {
      expect(templateContent).toContain('S3KMSKeyAlias:');
      expect(templateContent).toContain('CloudTrailKMSKeyAlias:');
      expect(templateContent).toContain('Type: AWS::KMS::Alias');
    });
  });

  describe('S3 Resources', () => {
    test('should have S3 buckets', () => {
      expect(templateContent).toContain('S3Bucket:');
      expect(templateContent).toContain('CloudTrailS3Bucket:');
      expect(templateContent).toContain('Type: AWS::S3::Bucket');
    });

    test('S3 buckets should have retention policies', () => {
      expect(templateContent).toContain('DeletionPolicy: Retain');
      expect(templateContent).toContain('UpdateReplacePolicy: Retain');
    });

    test('should have S3 bucket policies', () => {
      expect(templateContent).toContain('S3BucketPolicy:');
      expect(templateContent).toContain('CloudTrailS3BucketPolicy:');
      expect(templateContent).toContain('Type: AWS::S3::BucketPolicy');
    });

    test('should have S3 VPC Endpoint', () => {
      expect(templateContent).toContain('S3VPCEndpoint:');
      expect(templateContent).toContain('Type: AWS::EC2::VPCEndpoint');
    });
  });

  describe('Lambda Resources', () => {
    test('should have Lambda execution role', () => {
      expect(templateContent).toContain('LambdaExecutionRole:');
      expect(templateContent).toContain('Type: AWS::IAM::Role');
      // Note: No RoleName property - uses CAPABILITY_IAM instead of CAPABILITY_NAMED_IAM
    });

    test('should have Lambda function', () => {
      expect(templateContent).toContain('LambdaFunction:');
      expect(templateContent).toContain('Type: AWS::Lambda::Function');
    });

    test('Lambda function should have VPC configuration', () => {
      expect(templateContent).toContain('VpcConfig:');
      expect(templateContent).toContain('SecurityGroupIds:');
      expect(templateContent).toContain('SubnetIds:');
    });

    test('Lambda function should have environment variables', () => {
      expect(templateContent).toContain('Environment:');
      expect(templateContent).toContain('Variables:');
      expect(templateContent).toContain('BUCKET_NAME:');
      expect(templateContent).toContain('KMS_KEY_ARN:');
    });

    test('Lambda function should have inline code', () => {
      expect(templateContent).toContain('Code:');
      expect(templateContent).toContain('ZipFile:');
      expect(templateContent).toContain('def lambda_handler');
    });
  });

  describe('CloudTrail Resources', () => {
    test('should have CloudTrail', () => {
      expect(templateContent).toContain('CloudTrail:');
      expect(templateContent).toContain('Type: AWS::CloudTrail::Trail');
    });

    test('CloudTrail should have correct properties', () => {
      expect(templateContent).toContain('S3BucketName:');
      expect(templateContent).toContain('KMSKeyId:');
      expect(templateContent).toContain('IsLogging: true');
      expect(templateContent).toContain('IsMultiRegionTrail: true');
      expect(templateContent).toContain('IncludeGlobalServiceEvents: true');
    });

    test('CloudTrail should have event selectors', () => {
      expect(templateContent).toContain('EventSelectors:');
      expect(templateContent).toContain('ReadWriteType: All');
      expect(templateContent).toContain('IncludeManagementEvents: true');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId:',
        'PublicSubnet1Id:',
        'PublicSubnet2Id:',
        'PrivateSubnet1Id:',
        'PrivateSubnet2Id:',
        'LambdaSecurityGroupId:',
        'S3BucketName:',
        'CloudTrailS3BucketName:',
        'S3KMSKeyArn:',
        'CloudTrailKMSKeyArn:',
        'LambdaFunctionArn:',
        'LambdaExecutionRoleArn:',
        'CloudTrailArn:',
        'S3VPCEndpointId:'
      ];

      expectedOutputs.forEach(outputName => {
        expect(templateContent).toContain(outputName);
      });
    });

    test('outputs should have descriptions', () => {
      expect(templateContent).toContain('Description:');
      expect(templateContent).toContain('Value:');
      expect(templateContent).toContain('Export:');
    });
  });

  describe('Resource Dependencies', () => {
    test('CloudTrail should depend on CloudTrailS3BucketPolicy', () => {
      expect(templateContent).toContain('DependsOn: CloudTrailS3BucketPolicy');
    });

    test('NAT Gateways should depend on Internet Gateway Attachment', () => {
      expect(templateContent).toContain('DependsOn: InternetGatewayAttachment');
    });
  });

  describe('Security Configuration', () => {
    test('S3 buckets should have encryption enabled', () => {
      expect(templateContent).toContain('BucketEncryption:');
      expect(templateContent).toContain('ServerSideEncryptionConfiguration:');
      expect(templateContent).toContain('SSEAlgorithm: aws:kms');
    });

    test('S3 buckets should have public access blocked', () => {
      expect(templateContent).toContain('PublicAccessBlockConfiguration:');
      expect(templateContent).toContain('BlockPublicAcls: true');
      expect(templateContent).toContain('BlockPublicPolicy: true');
      expect(templateContent).toContain('IgnorePublicAcls: true');
      expect(templateContent).toContain('RestrictPublicBuckets: true');
    });

    test('KMS keys should have rotation enabled', () => {
      expect(templateContent).toContain('EnableKeyRotation: true');
    });

    test('Lambda security group should have restricted egress', () => {
      expect(templateContent).toContain('SecurityGroupEgress:');
      expect(templateContent).toContain('IpProtocol: tcp');
      expect(templateContent).toContain('FromPort: 443');
      expect(templateContent).toContain('ToPort: 443');
    });
  });

  describe('Template Validation', () => {
    test('should have valid structure', () => {
      expect(templateContent).toBeDefined();
      expect(typeof templateContent).toBe('string');
      expect(templateContent.length).toBeGreaterThan(0);
    });

    test('should not have any undefined or null required sections', () => {
      expect(templateContent).toContain('AWSTemplateFormatVersion');
      expect(templateContent).toContain('Description');
      expect(templateContent).toContain('Parameters');
      expect(templateContent).toContain('Resources');
      expect(templateContent).toContain('Outputs');
    });

    test('should have reasonable number of resources', () => {
      const resourceMatches = templateContent.match(/Type: AWS::/g);
      expect(resourceMatches).toBeDefined();
      expect(resourceMatches!.length).toBeGreaterThan(20); // Should have many resources
    });

    test('should have reasonable number of outputs', () => {
      const outputMatches = templateContent.match(/Description:/g);
      expect(outputMatches).toBeDefined();
      expect(outputMatches!.length).toBeGreaterThan(10); // Should have many outputs
    });
  });

  describe('Resource Naming Convention', () => {
    test('resource names should follow naming convention', () => {
      const resourceMatches = templateContent.match(/^  [A-Z][a-zA-Z0-9]*:/gm);
      expect(resourceMatches).toBeDefined();
      resourceMatches!.forEach(match => {
        const resourceName = match.trim().replace(':', '');
        // Resource names should be PascalCase
        expect(resourceName).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
      });
    });

    test('output names should follow naming convention', () => {
      const outputMatches = templateContent.match(/^  [A-Z][a-zA-Z0-9]*:/gm);
      expect(outputMatches).toBeDefined();
      outputMatches!.forEach(match => {
        const outputName = match.trim().replace(':', '');
        // Output names should be PascalCase
        expect(outputName).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should use KMS encryption for S3', () => {
      expect(templateContent).toContain('KMSMasterKeyID:');
      expect(templateContent).toContain('SSEAlgorithm: aws:kms');
    });

    test('should have versioning enabled for S3', () => {
      expect(templateContent).toContain('VersioningConfiguration:');
      expect(templateContent).toContain('Status: Enabled');
    });

    test('should have CloudTrail logging enabled', () => {
      expect(templateContent).toContain('IsLogging: true');
      expect(templateContent).toContain('IsMultiRegionTrail: true');
    });

    test('should have VPC endpoint for S3 access', () => {
      expect(templateContent).toContain('VpcEndpointType: Gateway');
      expect(templateContent).toContain('com.amazonaws');
      expect(templateContent).toContain('.s3');
    });

    test('should have restrictive security group rules', () => {
      expect(templateContent).toContain('SecurityGroupEgress:');
      expect(templateContent).toContain('IpProtocol: tcp');
      expect(templateContent).toContain('FromPort: 443');
      expect(templateContent).toContain('ToPort: 443');
    });
  });

  describe('Lambda Function Code', () => {
    test('should contain proper Lambda function code', () => {
      expect(templateContent).toContain('import json');
      expect(templateContent).toContain('import boto3');
      expect(templateContent).toContain('def lambda_handler');
      expect(templateContent).toContain('s3_client.put_object');
      expect(templateContent).toContain('ServerSideEncryption');
      expect(templateContent).toContain('SSEKMSKeyId');
    });

    test('should handle errors properly', () => {
      expect(templateContent).toContain('try:');
      expect(templateContent).toContain('except Exception as e:');
      expect(templateContent).toContain('logger.error');
    });

    test('should use environment variables', () => {
      expect(templateContent).toContain('os.environ[\'BUCKET_NAME\']');
      expect(templateContent).toContain('os.environ[\'KMS_KEY_ARN\']');
    });
  });
});
