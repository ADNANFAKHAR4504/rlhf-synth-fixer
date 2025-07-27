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
        'AWS CloudFormation template for a secure, scalable cloud environment.'
      );
    });
  });

  describe('Parameters', () => {
    test('should not have KeyPairName parameter (using dynamic key pair creation)', () => {
      expect(template.Parameters.KeyPairName).toBeUndefined();
    });

    test('should have SSHCidr parameter', () => {
      expect(template.Parameters.SSHCidr).toBeDefined();
      expect(template.Parameters.SSHCidr.Type).toBe('String');
      expect(template.Parameters.SSHCidr.Default).toBe('0.0.0.0/0');
    });

    test('should have LatestAmiId parameter', () => {
      expect(template.Parameters.LatestAmiId).toBeDefined();
      expect(template.Parameters.LatestAmiId.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
    });

    test('should have StackNameSuffix parameter', () => {
      expect(template.Parameters.StackNameSuffix).toBeDefined();
      expect(template.Parameters.StackNameSuffix.Type).toBe('String');
      expect(template.Parameters.StackNameSuffix.Default).toBe('tapstack-dev');
      expect(template.Parameters.StackNameSuffix.AllowedPattern).toBe('^[a-z0-9][a-z0-9-]*[a-z0-9]$');
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('should have public and private subnets', () => {
      expect(template.Resources.PublicSubnet).toBeDefined();
      expect(template.Resources.PrivateSubnet).toBeDefined();
      expect(template.Resources.PublicSubnet.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet.Type).toBe('AWS::EC2::Subnet');
    });

    test('subnets should use dynamic availability zones', () => {
      const publicSubnet = template.Resources.PublicSubnet;
      const privateSubnet = template.Resources.PrivateSubnet;
      
      expect(publicSubnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(privateSubnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
    });

    test('should have Internet Gateway and NAT Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have route tables and associations', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PublicSubnetRouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnetRouteTableAssociation).toBeDefined();
    });
  });

  describe('EC2 Resources', () => {
    test('should have EC2 security group', () => {
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      expect(template.Resources.EC2SecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('security group should allow SSH on port 22', () => {
      const sg = template.Resources.EC2SecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;
      
      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0].IpProtocol).toBe('tcp');
      expect(ingressRules[0].FromPort).toBe(22);
      expect(ingressRules[0].ToPort).toBe(22);
    });

    test('should have EC2 instance', () => {
      expect(template.Resources.EC2Instance).toBeDefined();
      expect(template.Resources.EC2Instance.Type).toBe('AWS::EC2::Instance');
    });

    test('EC2 instance should be t2.micro', () => {
      const instance = template.Resources.EC2Instance;
      expect(instance.Properties.InstanceType).toBe('t2.micro');
    });

    test('should have key pair creator resources', () => {
      expect(template.Resources.KeyPairCreatorRole).toBeDefined();
      expect(template.Resources.KeyPairCreatorRole.Type).toBe('AWS::IAM::Role');
      
      expect(template.Resources.KeyPairCreatorFunction).toBeDefined();
      expect(template.Resources.KeyPairCreatorFunction.Type).toBe('AWS::Lambda::Function');
      
      expect(template.Resources.KeyPairResource).toBeDefined();
      expect(template.Resources.KeyPairResource.Type).toBe('AWS::CloudFormation::CustomResource');
    });

    test('EC2 instance should use dynamic key pair', () => {
      const instance = template.Resources.EC2Instance;
      expect(instance.Properties.KeyName).toEqual({
        'Fn::GetAtt': ['KeyPairResource', 'KeyPairName']
      });
    });
  });

  describe('S3 and Lambda Resources', () => {
    test('should have S3 bucket', () => {
      expect(template.Resources.S3Bucket).toBeDefined();
      expect(template.Resources.S3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have unique name', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'cf-task-s3bucket-${StackNameSuffix}'
      });
    });

    test('S3 bucket should have Lambda notification configuration', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.NotificationConfiguration).toBeDefined();
      expect(bucket.Properties.NotificationConfiguration.LambdaConfigurations).toHaveLength(1);
    });

    test('should have Lambda function', () => {
      expect(template.Resources.LambdaFunction).toBeDefined();
      expect(template.Resources.LambdaFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda function should use latest Python runtime', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.Runtime).toBe('python3.12');
    });

    test('should have Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('Lambda execution role should have required policies', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
      expect(role.Properties.Policies).toHaveLength(2);
    });

    test('should have Lambda invoke permission', () => {
      expect(template.Resources.LambdaInvokePermission).toBeDefined();
      expect(template.Resources.LambdaInvokePermission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('SNS Resources', () => {
    test('should have SNS topic', () => {
      expect(template.Resources.SNSTopic).toBeDefined();
      expect(template.Resources.SNSTopic.Type).toBe('AWS::SNS::Topic');
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have Environment: Production tag', () => {
      const resourcesWithTags = [
        'VPC', 'PublicSubnet', 'PrivateSubnet', 'InternetGateway',
        'PublicRouteTable', 'PrivateRouteTable', 'NATGateway',
        'EC2SecurityGroup', 'EC2Instance', 'S3Bucket', 'SNSTopic',
        'LambdaExecutionRole', 'LambdaFunction', 'KeyPairCreatorRole',
        'KeyPairCreatorFunction'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
          expect(envTag).toBeDefined();
          expect(envTag.Value).toBe('Production');
        }
      });
    });

    test('resources should follow cf-task naming convention', () => {
      const expectedNames = {
        VPC: 'cf-task-vpc',
        PublicSubnet: 'cf-task-public-subnet',
        PrivateSubnet: 'cf-task-private-subnet',
        InternetGateway: 'cf-task-igw',
        PublicRouteTable: 'cf-task-public-rt',
        PrivateRouteTable: 'cf-task-private-rt',
        NATGateway: 'cf-task-nat',
        EC2SecurityGroup: 'cf-task-sg',
        EC2Instance: 'cf-task-ec2',
        S3Bucket: 'cf-task-s3bucket',
        LambdaExecutionRole: 'cf-task-lambda-role',
        LambdaFunction: 'cf-task-lambda',
        KeyPairCreatorRole: 'cf-task-keypair-creator-role',
        KeyPairCreatorFunction: 'cf-task-keypair-creator'
      };

      Object.entries(expectedNames).forEach(([resourceName, expectedName]) => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Name');
          if (nameTag) {
            expect(nameTag.Value).toBe(expectedName);
          }
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId', 'PublicSubnetId', 'PrivateSubnetId', 'EC2InstanceId',
        'EC2PublicIP', 'S3BucketName', 'SNSTopicArn', 'LambdaFunctionArn',
        'NATGatewayId', 'KeyPairName'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have export names', () => {
      const expectedExports = {
        'VPCId': '${StackNameSuffix}-VPC-ID',
        'PublicSubnetId': '${StackNameSuffix}-PublicSubnet-ID',
        'PrivateSubnetId': '${StackNameSuffix}-PrivateSubnet-ID',
        'EC2InstanceId': '${StackNameSuffix}-EC2-ID',
        'EC2PublicIP': '${StackNameSuffix}-EC2-PublicIP',
        'S3BucketName': '${StackNameSuffix}-S3Bucket-Name',
        'SNSTopicArn': '${StackNameSuffix}-SNSTopic-ARN',
        'LambdaFunctionArn': '${StackNameSuffix}-Lambda-ARN',
        'NATGatewayId': '${StackNameSuffix}-NATGateway-ID',
        'KeyPairName': '${StackNameSuffix}-KeyPair-Name'
      };

      Object.entries(expectedExports).forEach(([outputKey, expectedExport]) => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toEqual({
          'Fn::Sub': expectedExport
        });
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

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(23); // All the resources including key pair creator resources
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3); // SSHCidr, LatestAmiId, StackNameSuffix
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(10); // Added KeyPairName output
    });
  });

  describe('Key Pair Creator Resources', () => {
    test('KeyPairCreatorRole should have correct policies', () => {
      const role = template.Resources.KeyPairCreatorRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
      
      const ec2Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'EC2KeyPairPolicy');
      expect(ec2Policy).toBeDefined();
      expect(ec2Policy.PolicyDocument.Statement[0].Action).toContain('ec2:CreateKeyPair');
      expect(ec2Policy.PolicyDocument.Statement[0].Action).toContain('ec2:DeleteKeyPair');
      expect(ec2Policy.PolicyDocument.Statement[0].Action).toContain('ec2:DescribeKeyPairs');
    });

    test('KeyPairCreatorFunction should have correct runtime and handler', () => {
      const lambdaFunction = template.Resources.KeyPairCreatorFunction;
      expect(lambdaFunction.Properties.Runtime).toBe('python3.12');
      expect(lambdaFunction.Properties.Handler).toBe('index.handler');
      expect(lambdaFunction.Properties.Timeout).toBe(60);
    });

    test('KeyPairCreatorFunction should have inline Python code', () => {
      const lambdaFunction = template.Resources.KeyPairCreatorFunction;
      expect(lambdaFunction.Properties.Code.ZipFile).toBeDefined();
      expect(typeof lambdaFunction.Properties.Code.ZipFile).toBe('string');
      expect(lambdaFunction.Properties.Code.ZipFile).toContain('import boto3');
      expect(lambdaFunction.Properties.Code.ZipFile).toContain('import cfnresponse');
      expect(lambdaFunction.Properties.Code.ZipFile).toContain('def handler(event, context):');
    });

    test('KeyPairResource should not have DependsOn property (lint fix)', () => {
      const keyPairResource = template.Resources.KeyPairResource;
      expect(keyPairResource.DependsOn).toBeUndefined();
    });

    test('KeyPairResource should use GetAtt for ServiceToken', () => {
      const keyPairResource = template.Resources.KeyPairResource;
      expect(keyPairResource.Properties.ServiceToken).toEqual({
        'Fn::GetAtt': ['KeyPairCreatorFunction', 'Arn']
      });
    });
  });

  describe('Template Consistency Validation', () => {
    test('should have StackNameSuffix parameter for lowercase S3 bucket naming', () => {
      const templateString = JSON.stringify(template);
      expect(templateString).toContain('StackNameSuffix');
      expect(template.Parameters.StackNameSuffix).toBeDefined();
    });

    test('should use StackNameSuffix consistently for S3 bucket naming', () => {
      const s3Bucket = template.Resources.S3Bucket;
      expect(s3Bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'cf-task-s3bucket-${StackNameSuffix}'
      });

      const lambdaPolicy = template.Resources.LambdaExecutionRole.Properties.Policies
        .find((p: any) => p.PolicyName === 'LambdaS3Policy');
      expect(lambdaPolicy.PolicyDocument.Statement[0].Resource).toEqual({
        'Fn::Sub': 'arn:aws:s3:::cf-task-s3bucket-${StackNameSuffix}/*'
      });
    });

    test('all outputs should use StackNameSuffix for export names', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        if (output.Export && output.Export.Name) {
          expect(output.Export.Name).toEqual({
            'Fn::Sub': expect.stringContaining('${StackNameSuffix}')
          });
        }
      });
    });
  });
});