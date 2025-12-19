import { Template } from 'aws-cdk-lib/assertions';
import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect } from '@jest/globals';

describe('TapStack CloudFormation Template', () => {
  // Load the pre-converted JSON template
  const templatePath = path.resolve(__dirname, '../lib/TapStack.json');
  const templateJson = fs.readFileSync(templatePath, 'utf-8');
  const template = Template.fromString(templateJson);

  // Test Suite for Stack Metadata
  describe('Stack Metadata', () => {
    it('should have the correct AWSTemplateFormatVersion', () => {
      expect(template.toJSON().AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    it('should have a valid description', () => {
      expect(template.toJSON().Description).toContain('AWS CloudFormation template for a secure, compliant FinTech application infrastructure');
    });
  });

  // Test Suite for Parameters
  describe('Parameters', () => {
    it('should define EnvironmentName parameter with allowed values', () => {
      template.hasParameter('EnvironmentName', {
        Type: 'String',
        AllowedValues: ['production', 'staging', 'development'],
        Default: 'production',
      });
    });

    it('should define VPCCidrBlock parameter with correct pattern', () => {
      template.hasParameter('VPCCidrBlock', {
        Type: 'String',
        Default: '10.0.0.0/16',
        AllowedPattern: '^(\\d{1,3}\\.){3}\\d{1,3}/\\d{1,2}$',
      });
    });

    it('should define subnet CIDR parameters', () => {
      template.hasParameter('PublicSubnet1Cidr', { Type: 'String', Default: '10.0.1.0/24' });
      template.hasParameter('PublicSubnet2Cidr', { Type: 'String', Default: '10.0.2.0/24' });
      template.hasParameter('PrivateSubnet1Cidr', { Type: 'String', Default: '10.0.3.0/24' });
      template.hasParameter('PrivateSubnet2Cidr', { Type: 'String', Default: '10.0.4.0/24' });
    });

    it('should define CostCenter parameter', () => {
      template.hasParameter('CostCenter', { Type: 'String', Default: 'finance' });
    });
  });

  // Test Suite for Resources
  describe('Resources', () => {
    describe('VPC Configuration', () => {
      it('should create a VPC with correct CIDR and DNS settings', () => {
        template.hasResourceProperties('AWS::EC2::VPC', {
          CidrBlock: { Ref: 'VPCCidrBlock' },
          EnableDnsHostnames: true,
          EnableDnsSupport: true,
          Tags: [
            { Key: 'Name', Value: { 'Fn::Sub': '${EnvironmentName}-fintech-vpc' } },
            { Key: 'Environment', Value: { Ref: 'EnvironmentName' } },
            { Key: 'CostCenter', Value: { Ref: 'CostCenter' } },
          ],
        });
      });

      it('should create public and private subnets', () => {
        template.resourceCountIs('AWS::EC2::Subnet', 4);
        template.hasResourceProperties('AWS::EC2::Subnet', {
          VpcId: { Ref: 'FinTechVPC' },
          CidrBlock: { Ref: 'PublicSubnet1Cidr' },
          MapPublicIpOnLaunch: true,
        });
        template.hasResourceProperties('AWS::EC2::Subnet', {
          VpcId: { Ref: 'FinTechVPC' },
          CidrBlock: { Ref: 'PrivateSubnet1Cidr' },
        });
      });
    });

    describe('VPC Flow Logs', () => {
      it('should create VPC Flow Logs with CloudWatch Logs destination', () => {
        template.hasResourceProperties('AWS::EC2::FlowLog', {
          ResourceId: { Ref: 'FinTechVPC' },
          ResourceType: 'VPC',
          TrafficType: 'ALL',
          LogDestinationType: 'cloud-watch-logs',
          LogGroupName: { Ref: 'VPCFlowLogsLogGroup' },
          DeliverLogsPermissionArn: { 'Fn::GetAtt': ['VPCFlowLogsRole', 'Arn'] },
        });
      });

      it('should create a log group for VPC Flow Logs', () => {
        template.hasResourceProperties('AWS::Logs::LogGroup', {
          LogGroupName: { 'Fn::Sub': '/aws/vpc/${EnvironmentName}-flow-logs' },
          RetentionInDays: 90,
        });
      });
    });

    describe('S3 Buckets', () => {
      it('should create DataBucket with encryption and public access block', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
          BucketName: { 'Fn::Sub': '${EnvironmentName}-fintech-data-${AWS::AccountId}' },
          VersioningConfiguration: { Status: 'Enabled' },
          BucketEncryption: {
            ServerSideEncryptionConfiguration: [
              {
                ServerSideEncryptionByDefault: {
                  SSEAlgorithm: 'aws:kms',
                  KMSMasterKeyID: { Ref: 'FinTechKMSKey' },
                },
              },
            ],
          },
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
          },
        });
      });

      it('should create LogBucket with encryption and public access block', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
          BucketName: { 'Fn::Sub': '${EnvironmentName}-fintech-logs-${AWS::AccountId}' },
          VersioningConfiguration: { Status: 'Enabled' },
          BucketEncryption: {
            ServerSideEncryptionConfiguration: [
              {
                ServerSideEncryptionByDefault: {
                  SSEAlgorithm: 'aws:kms',
                  KMSMasterKeyID: { Ref: 'FinTechKMSKey' },
                },
              },
            ],
          },
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
          },
        });
      });
    });

    describe('DynamoDB Table', () => {
      it('should create DynamoDB table with KMS encryption', () => {
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          TableName: { 'Fn::Sub': '${EnvironmentName}-fintech-table' },
          AttributeDefinitions: [{ AttributeName: 'Id', AttributeType: 'S' }],
          KeySchema: [{ AttributeName: 'Id', KeyType: 'HASH' }],
          BillingMode: 'PAY_PER_REQUEST',
          SSESpecification: {
            SSEEnabled: true,
            SSEType: 'KMS',
            KMSMasterKeyId: { Ref: 'FinTechKMSKey' },
          },
        });
      });
    });

    describe('RDS Instance', () => {
      it('should create RDS instance with correct configuration', () => {
        template.hasResourceProperties('AWS::RDS::DBInstance', {
          DBInstanceIdentifier: { 'Fn::Sub': '${EnvironmentName}-fintech-db' },
          AllocatedStorage: 20,
          DBInstanceClass: 'db.t3.micro',
          Engine: 'postgres',
          EngineVersion: '15.8',
          MasterUsername: { 'Fn::Sub': '{{resolve:secretsmanager:${RDSSecret}:SecretString:username}}' },
          MultiAZ: true,
          StorageEncrypted: true,
          KmsKeyId: { Ref: 'FinTechKMSKey' },
          VPCSecurityGroups: [{ Ref: 'RDSSecurityGroup' }],
          DBSubnetGroupName: { Ref: 'RDSSubnetGroup' },
        });
      });

      it('should create RDS security group with correct ingress', () => {
        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
          GroupDescription: 'Security group for RDS instance',
          VpcId: { Ref: 'FinTechVPC' },
          SecurityGroupIngress: [
            {
              IpProtocol: 'tcp',
              FromPort: 5432,
              ToPort: 5432,
              CidrIp: { Ref: 'VPCCidrBlock' },
            },
          ],
        });
      });
    });

    describe('Secrets Manager', () => {
      it('should create Secrets Manager secret for RDS credentials', () => {
        template.hasResourceProperties('AWS::SecretsManager::Secret', {
          Name: { 'Fn::Sub': '${EnvironmentName}-fintech-rds-credentials' },
          GenerateSecretString: {
            SecretStringTemplate: '{"username": "fintechadmin"}',
            GenerateStringKey: 'password',
            PasswordLength: 16,
            ExcludeCharacters: '"@/\\',
          },
          KmsKeyId: { Ref: 'FinTechKMSKey' },
        });
      });
    });

    describe('IAM Roles', () => {
      it('should create AdminRole with MFA condition', () => {
        template.hasResourceProperties('AWS::IAM::Role', {
          RoleName: { 'Fn::Sub': '${EnvironmentName}-admin-role' },
          AssumeRolePolicyDocument: {
            Statement: [
              {
                Effect: 'Allow',
                Principal: { AWS: { 'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root' } },
                Action: 'sts:AssumeRole',
                Condition: { Bool: { 'aws:MultiFactorAuthPresent': 'true' } },
              },
            ],
          },
        });
      });
    });

    describe('CloudTrail', () => {
      it('should create CloudTrail with global service events and S3 logging', () => {
        template.hasResourceProperties('AWS::CloudTrail::Trail', {
          TrailName: { 'Fn::Sub': '${EnvironmentName}-fintech-trail' },
          S3BucketName: { Ref: 'LogBucket' },
          IsMultiRegionTrail: true,
          IncludeGlobalServiceEvents: true,
          EnableLogFileValidation: true,
          IsLogging: true,
          CloudWatchLogsLogGroupArn: { 'Fn::GetAtt': ['CloudTrailLogGroup', 'Arn'] },
          CloudWatchLogsRoleArn: { 'Fn::GetAtt': ['CloudTrailRole', 'Arn'] },
        });
      });

      it('should have no redundant DependsOn for CloudTrail', () => {
        template.hasResource('AWS::CloudTrail::Trail', {
          DependsOn: ['LogBucketPolicy'],
        });
      });
    });

    describe('Lambda', () => {
      it('should create Lambda function for remediation', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: { 'Fn::Sub': '${EnvironmentName}-remediation-lambda' },
          Handler: 'index.handler',
          Runtime: 'python3.9',
          Timeout: 60,
          Role: { 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] },
        });
      });
    });

    describe('Application Load Balancer', () => {
      it('should create ALB with public subnets and security group', () => {
        template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
          Name: { 'Fn::Sub': '${EnvironmentName}-fintech-alb' },
          Subnets: [{ Ref: 'PublicSubnet1' }, { Ref: 'PublicSubnet2' }],
          SecurityGroups: [{ Ref: 'ALBSecurityGroup' }],
          Scheme: 'internet-facing',
          Type: 'application',
        });
      });

      it('should create ALB security group with HTTP and HTTPS ingress', () => {
        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
          GroupDescription: 'Security group for ALB',
          SecurityGroupIngress: [
            { IpProtocol: 'tcp', FromPort: 80, ToPort: 80, CidrIp: '0.0.0.0/0' },
            { IpProtocol: 'tcp', FromPort: 443, ToPort: 443, CidrIp: '0.0.0.0/0' },
          ],
        });
      });
    });
  });

  // Test Suite for Outputs
  describe('Outputs', () => {
    it('should define all expected outputs', () => {
      template.hasOutput('VPCId', { Value: { Ref: 'FinTechVPC' } });
      template.hasOutput('DataBucketName', { Value: { Ref: 'DataBucket' } });
      template.hasOutput('LogBucketName', { Value: { Ref: 'LogBucket' } });
      template.hasOutput('DynamoDBTableName', { Value: { Ref: 'FinTechTable' } });
      template.hasOutput('RDSEndpoint', { Value: { 'Fn::GetAtt': ['RDSInstance', 'Endpoint.Address'] } });
      template.hasOutput('RDSSecretArn', { Value: { Ref: 'RDSSecret' } });
      template.hasOutput('LambdaFunctionArn', { Value: { 'Fn::GetAtt': ['RemediationLambda', 'Arn'] } });
      template.hasOutput('ALBArn', { Value: { 'Fn::GetAtt': ['ApplicationLoadBalancer', 'LoadBalancerArn'] } });
    });

    it('should export all outputs with correct names', () => {
      template.hasOutput('VPCId', { Export: { Name: { 'Fn::Sub': '${EnvironmentName}-VPCId' } } });
      template.hasOutput('DataBucketName', { Export: { Name: { 'Fn::Sub': '${EnvironmentName}-DataBucketName' } } });
      template.hasOutput('LogBucketName', { Export: { Name: { 'Fn::Sub': '${EnvironmentName}-LogBucketName' } } });
      template.hasOutput('DynamoDBTableName', { Export: { Name: { 'Fn::Sub': '${EnvironmentName}-DynamoDBTableName' } } });
      template.hasOutput('RDSEndpoint', { Export: { Name: { 'Fn::Sub': '${EnvironmentName}-RDSEndpoint' } } });
      template.hasOutput('RDSSecretArn', { Export: { Name: { 'Fn::Sub': '${EnvironmentName}-RDSSecretArn' } } });
      template.hasOutput('LambdaFunctionArn', { Export: { Name: { 'Fn::Sub': '${EnvironmentName}-LambdaFunctionArn' } } });
      template.hasOutput('ALBArn', { Export: { Name: { 'Fn::Sub': '${EnvironmentName}-ALBArn' } } });
    });
  });

  // Test Suite for Compliance and Best Practices
  describe('Compliance and Best Practices', () => {
    it('should have no references to existing resources', () => {
      const resources = template.toJSON().Resources;
      Object.values(resources).forEach((resource: any) => {
        expect(resource).not.toHaveProperty('Ref', expect.stringMatching(/^arn:/));
      });
    });

    it('should enforce KMS encryption for S3, DynamoDB, and RDS', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            { ServerSideEncryptionByDefault: { SSEAlgorithm: 'aws:kms', KMSMasterKeyID: { Ref: 'FinTechKMSKey' } } },
          ],
        },
      });
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: { SSEEnabled: true, SSEType: 'KMS', KMSMasterKeyId: { Ref: 'FinTechKMSKey' } },
      });
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
        KmsKeyId: { Ref: 'FinTechKMSKey' },
      });
    });

    it('should enforce MFA for IAM roles', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: { 'Fn::Sub': '${EnvironmentName}-admin-role' },
        AssumeRolePolicyDocument: {
          Statement: [
            { Condition: { Bool: { 'aws:MultiFactorAuthPresent': 'true' } } },
          ],
        },
      });
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: { 'Fn::Sub': '${EnvironmentName}-developer-role' },
        AssumeRolePolicyDocument: {
          Statement: [
            { Condition: { Bool: { 'aws:MultiFactorAuthPresent': 'true' } } },
          ],
        },
      });
    });

    it('should have secure S3 bucket policies', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        Bucket: { Ref: 'DataBucket' },
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Deny',
              Principal: '*',
              Action: 's3:*',
              Resource: [
                { 'Fn::GetAtt': ['DataBucket', 'Arn'] },
                { 'Fn::Sub': '${DataBucket.Arn}/*' },
              ],
              Condition: { Bool: { 'aws:SecureTransport': 'false' } },
            },
          ],
        },
      });
    });
  });
});