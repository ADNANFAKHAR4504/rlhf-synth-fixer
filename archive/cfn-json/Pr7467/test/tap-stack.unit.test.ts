import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Security Configuration Management', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with parameterized CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCIDR' });
    });

    test('should create VPC with DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });
  });

  describe('Internet Gateway Configuration', () => {
    test('should create Internet Gateway with correct type', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should attach Internet Gateway to VPC', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });
  });

  describe('Public Subnet Configuration', () => {
    test('should create public subnet with dynamic AZ selection', () => {
      const subnet = template.Resources.PublicSubnet;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnetCIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
    });

    test('should create public subnet with MapPublicIpOnLaunch enabled', () => {
      const subnet = template.Resources.PublicSubnet;
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should create public subnet in VPC', () => {
      const subnet = template.Resources.PublicSubnet;
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });
  });

  describe('Private Subnet Configuration', () => {
    test('should create private subnet with dynamic AZ selection', () => {
      const subnet = template.Resources.PrivateSubnet;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnetCIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
    });

    test('should create private subnet with MapPublicIpOnLaunch disabled', () => {
      const subnet = template.Resources.PrivateSubnet;
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should create private subnet in VPC', () => {
      const subnet = template.Resources.PrivateSubnet;
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('should create NAT Gateway EIP with vpc domain and gateway dependency', () => {
      const eip = template.Resources.NATGatewayEIP;
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.DependsOn).toBe('AttachGateway');
    });

    test('should create NAT Gateway in public subnet with EIP allocation', () => {
      const natGateway = template.Resources.NATGateway;
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet' });
      expect(natGateway.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NATGatewayEIP', 'AllocationId']
      });
    });
  });

  describe('Route Table Configuration', () => {
    test('should create public route table in VPC', () => {
      const routeTable = template.Resources.PublicRouteTable;
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create public route to internet gateway with 0.0.0.0/0', () => {
      const route = template.Resources.PublicRoute;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(route.DependsOn).toBe('AttachGateway');
    });

    test('should associate public subnet with public route table', () => {
      const association = template.Resources.PublicSubnetRouteTableAssociation;
      expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(association.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet' });
      expect(association.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
    });

    test('should create private route table in VPC', () => {
      const routeTable = template.Resources.PrivateRouteTable;
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create private route to NAT gateway', () => {
      const route = template.Resources.PrivateRoute;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway' });
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable' });
    });

    test('should associate private subnet with private route table', () => {
      const association = template.Resources.PrivateSubnetRouteTableAssociation;
      expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(association.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet' });
      expect(association.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable' });
    });
  });

  describe('EC2 Security Group Configuration', () => {
    test('should create EC2 security group in VPC', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create EC2 security group with SSH and HTTPS access from parameterized CIDR', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);

      const sshRule = sg.Properties.SecurityGroupIngress[0];
      expect(sshRule.IpProtocol).toBe('tcp');
      expect(sshRule.FromPort).toBe(22);
      expect(sshRule.ToPort).toBe(22);
      expect(sshRule.CidrIp).toEqual({ Ref: 'AllowedCIDR' });
      expect(sshRule.Description).toBe('SSH access from specific CIDR block');

      const httpsRule = sg.Properties.SecurityGroupIngress[1];
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.FromPort).toBe(443);
      expect(httpsRule.ToPort).toBe(443);
      expect(httpsRule.CidrIp).toEqual({ Ref: 'AllowedCIDR' });
      expect(httpsRule.Description).toBe('HTTPS access from specific CIDR block');
    });

    test('should create EC2 security group with all outbound traffic allowed', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg.Properties.SecurityGroupEgress).toHaveLength(1);

      const egressRule = sg.Properties.SecurityGroupEgress[0];
      expect(egressRule.IpProtocol).toBe('-1');
      expect(egressRule.CidrIp).toBe('0.0.0.0/0');
      expect(egressRule.Description).toBe('Allow all outbound traffic');
    });
  });

  describe('Lambda Security Group Configuration', () => {
    test('should create Lambda security group in VPC', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create Lambda security group with all outbound traffic allowed', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg.Properties.SecurityGroupEgress).toHaveLength(1);

      const egressRule = sg.Properties.SecurityGroupEgress[0];
      expect(egressRule.IpProtocol).toBe('-1');
      expect(egressRule.CidrIp).toBe('0.0.0.0/0');
      expect(egressRule.Description).toBe('Allow all outbound traffic');
    });
  });

  describe('KMS Key Configuration', () => {
    test('should create KMS key with automatic rotation enabled', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should create KMS key with IAM root permissions', () => {
      const kmsKey = template.Resources.KMSKey;
      const keyPolicy = kmsKey.Properties.KeyPolicy;

      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toHaveLength(2);

      const rootStatement = keyPolicy.Statement[0];
      expect(rootStatement.Sid).toBe('Enable IAM User Permissions');
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Principal.AWS).toEqual({
        'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root'
      });
      expect(rootStatement.Action).toBe('kms:*');
      expect(rootStatement.Resource).toBe('*');
    });

    test('should create KMS key with service permissions for S3, Lambda, Logs, and EC2', () => {
      const kmsKey = template.Resources.KMSKey;
      const serviceStatement = kmsKey.Properties.KeyPolicy.Statement[1];

      expect(serviceStatement.Sid).toBe('Allow services to use the key');
      expect(serviceStatement.Effect).toBe('Allow');
      expect(serviceStatement.Principal.Service).toHaveLength(4);
      expect(serviceStatement.Principal.Service).toContain('s3.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('lambda.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('logs.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('ec2.amazonaws.com');
      expect(serviceStatement.Action).toContain('kms:Decrypt');
      expect(serviceStatement.Action).toContain('kms:GenerateDataKey');
    });

    test('should create KMS key alias with environment suffix', () => {
      const alias = template.Resources.KMSKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/security-config-${EnvironmentSuffix}'
      });
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'KMSKey' });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create S3 bucket with KMS encryption using customer-managed key', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn']
      });
      expect(encryption.BucketKeyEnabled).toBe(true);
    });

    test('should create S3 bucket with DeletionPolicy and UpdateReplacePolicy set to Retain', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.DeletionPolicy).toBe('Retain');
      expect(bucket.UpdateReplacePolicy).toBe('Retain');
    });

    test('should create S3 bucket with public access completely blocked', () => {
      const bucket = template.Resources.S3Bucket;
      const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });

    test('should create S3 bucket with versioning enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should create S3 bucket with logging configuration to separate logging bucket', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.LoggingConfiguration.DestinationBucketName).toEqual({
        Ref: 'S3LoggingBucket'
      });
      expect(bucket.Properties.LoggingConfiguration.LogFilePrefix).toBe('access-logs/');
    });

    test('should create S3 bucket policy denying insecure transport', () => {
      const policy = template.Resources.S3BucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.Bucket).toEqual({ Ref: 'S3Bucket' });

      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Sid).toBe('DenyInsecureTransport');
      expect(statement.Effect).toBe('Deny');
      expect(statement.Principal).toBe('*');
      expect(statement.Action).toBe('s3:*');
      expect(statement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });
  });

  describe('S3 Logging Bucket Configuration', () => {
    test('should create separate S3 logging bucket', () => {
      const bucket = template.Resources.S3LoggingBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should create S3 logging bucket with DeletionPolicy and UpdateReplacePolicy set to Retain', () => {
      const bucket = template.Resources.S3LoggingBucket;
      expect(bucket.DeletionPolicy).toBe('Retain');
      expect(bucket.UpdateReplacePolicy).toBe('Retain');
    });

    test('should create S3 logging bucket with AES256 encryption', () => {
      const bucket = template.Resources.S3LoggingBucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should create S3 logging bucket with 90-day lifecycle policy', () => {
      const bucket = template.Resources.S3LoggingBucket;
      const lifecycleRule = bucket.Properties.LifecycleConfiguration.Rules[0];

      expect(lifecycleRule.Id).toBe('DeleteOldLogs');
      expect(lifecycleRule.Status).toBe('Enabled');
      expect(lifecycleRule.ExpirationInDays).toBe(90);
    });

    test('should create S3 logging bucket with public access completely blocked', () => {
      const bucket = template.Resources.S3LoggingBucket;
      const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('EC2 Instance Role Configuration', () => {
    test('should create EC2 instance role with correct assume role policy', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Type).toBe('AWS::IAM::Role');

      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement).toHaveLength(1);
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should create EC2 instance role with SSM and CloudWatch managed policies', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.ManagedPolicyArns).toHaveLength(2);
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
    });

    test('should create EC2 instance role with S3 access policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'EC2S3AccessPolicy');

      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:PutObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:ListBucket');
      expect(s3Policy.PolicyDocument.Statement[0].Resource).toHaveLength(2);
    });

    test('should create EC2 instance role with KMS access policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const kmsPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'EC2KMSAccessPolicy');

      expect(kmsPolicy).toBeDefined();
      expect(kmsPolicy.PolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:Decrypt');
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:GenerateDataKey');
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:DescribeKey');
      expect(kmsPolicy.PolicyDocument.Statement[0].Resource).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn']
      });
    });
  });

  describe('EC2 Instance Configuration', () => {
    test('should create EC2 instance with parameterized instance type', () => {
      const ec2 = template.Resources.EC2Instance;
      expect(ec2.Type).toBe('AWS::EC2::Instance');
      expect(ec2.Properties.InstanceType).toEqual({ Ref: 'EC2InstanceType' });
    });

    test('should create EC2 instance with SSM parameter for AMI lookup', () => {
      const ec2 = template.Resources.EC2Instance;
      expect(ec2.Properties.ImageId).toBe('{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}');
    });

    test('should create EC2 instance in private subnet with security group', () => {
      const ec2 = template.Resources.EC2Instance;
      expect(ec2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet' });
      expect(ec2.Properties.SecurityGroupIds).toHaveLength(1);
      expect(ec2.Properties.SecurityGroupIds[0]).toEqual({ Ref: 'EC2SecurityGroup' });
    });

    test('should create EC2 instance with IAM instance profile', () => {
      const ec2 = template.Resources.EC2Instance;
      expect(ec2.Properties.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
    });

    test('should create EC2 instance with user data for SSM and CloudWatch agent', () => {
      const ec2 = template.Resources.EC2Instance;
      expect(ec2.Properties.UserData).toBeDefined();
      expect(ec2.Properties.UserData['Fn::Base64']).toBeDefined();

      const userDataLines = ec2.Properties.UserData['Fn::Base64']['Fn::Join'][1];
      expect(userDataLines).toContain('#!/bin/bash');
      expect(userDataLines).toContain('yum install -y amazon-ssm-agent');
      expect(userDataLines).toContain('yum install -y amazon-cloudwatch-agent');
    });
  });

  describe('Lambda Execution Role Configuration', () => {
    test('should create Lambda execution role with correct assume role policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');

      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement).toHaveLength(1);
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should create Lambda execution role with VPC access managed policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toHaveLength(1);
      expect(role.Properties.ManagedPolicyArns[0]).toBe(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
    });

    test('should create Lambda execution role with CloudWatch Logs policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const logsPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'LambdaCloudWatchLogsPolicy');

      expect(logsPolicy).toBeDefined();
      expect(logsPolicy.PolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(logsPolicy.PolicyDocument.Statement[0].Action).toHaveLength(3);
      expect(logsPolicy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogGroup');
      expect(logsPolicy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogStream');
      expect(logsPolicy.PolicyDocument.Statement[0].Action).toContain('logs:PutLogEvents');
      expect(logsPolicy.PolicyDocument.Statement[0].Resource).toEqual({
        'Fn::Sub': 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'
      });
    });

    test('should create Lambda execution role with S3 read-only policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'LambdaS3ReadOnlyPolicy');

      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:ListBucket');
      expect(s3Policy.PolicyDocument.Statement[0].Resource).toHaveLength(2);
    });

    test('should create Lambda execution role with KMS decrypt policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const kmsPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'LambdaKMSDecryptPolicy');

      expect(kmsPolicy).toBeDefined();
      expect(kmsPolicy.PolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:Decrypt');
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:DescribeKey');
      expect(kmsPolicy.PolicyDocument.Statement[0].Resource).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn']
      });
    });
  });

  describe('Lambda Function Configuration', () => {
    test('should create Lambda function with parameterized runtime and handler', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toEqual({ Ref: 'LambdaRuntime' });
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
    });

    test('should create Lambda function with execution role', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
      });
    });

    test('should create Lambda function with parameterized memory size and 30 second timeout', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.MemorySize).toEqual({ Ref: 'LambdaMemorySize' });
      expect(lambda.Properties.Timeout).toBe(30);
    });

    test('should create Lambda function in VPC with private subnet and Lambda security group', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toHaveLength(1);
      expect(lambda.Properties.VpcConfig.SecurityGroupIds[0]).toEqual({
        Ref: 'LambdaSecurityGroup'
      });
      expect(lambda.Properties.VpcConfig.SubnetIds).toHaveLength(1);
      expect(lambda.Properties.VpcConfig.SubnetIds[0]).toEqual({ Ref: 'PrivateSubnet' });
    });

    test('should create Lambda function with environment variables', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.Environment.Variables.ENVIRONMENT).toEqual({
        Ref: 'EnvironmentSuffix'
      });
      expect(lambda.Properties.Environment.Variables.S3_BUCKET).toEqual({ Ref: 'S3Bucket' });
    });

    test('should create Lambda function with inline Python code', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile['Fn::Join']).toBeDefined();
      expect(lambda.Properties.Code.ZipFile['Fn::Join'][0]).toBe('\n');

      const codeLines = lambda.Properties.Code.ZipFile['Fn::Join'][1];
      expect(codeLines).toContain('import json');
      expect(codeLines).toContain('def lambda_handler(event, context):');
    });
  });

  describe('Lambda Log Group Configuration', () => {
    test('should create Lambda log group with parameterized retention', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toEqual({ Ref: 'LogRetentionInDays' });
    });

    test('should create Lambda log group with correct name pattern', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/SecurityConfigFunction-${EnvironmentSuffix}'
      });
    });
  });

  describe('VPC Flow Logs Configuration', () => {
    test('should create VPC Flow Log role with correct assume role policy', () => {
      const role = template.Resources.VPCFlowLogRole;
      expect(role.Type).toBe('AWS::IAM::Role');

      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('vpc-flow-logs.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should create VPC Flow Log role with CloudWatch Logs permissions', () => {
      const role = template.Resources.VPCFlowLogRole;
      const policy = role.Properties.Policies[0];

      expect(policy.PolicyName).toBe('CloudWatchLogPolicy');
      expect(policy.PolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogGroup');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogStream');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:PutLogEvents');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:DescribeLogGroups');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:DescribeLogStreams');
    });

    test('should create VPC Flow Log Group with parameterized retention', () => {
      const logGroup = template.Resources.VPCFlowLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toEqual({ Ref: 'LogRetentionInDays' });
    });

    test('should create VPC Flow Log with ALL traffic type', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
      expect(flowLog.Properties.ResourceType).toBe('VPC');
      expect(flowLog.Properties.TrafficType).toBe('ALL');
      expect(flowLog.Properties.ResourceId).toEqual({ Ref: 'VPC' });
      expect(flowLog.Properties.DeliverLogsPermissionArn).toEqual({
        'Fn::GetAtt': ['VPCFlowLogRole', 'Arn']
      });
    });
  });

  describe('CloudTrail Configuration', () => {
    test('should create CloudTrail S3 bucket with KMS encryption', () => {
      const bucket = template.Resources.CloudTrailBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn']
      });
      expect(encryption.BucketKeyEnabled).toBe(true);
    });

    test('should create CloudTrail S3 bucket with DeletionPolicy and UpdateReplacePolicy set to Retain', () => {
      const bucket = template.Resources.CloudTrailBucket;
      expect(bucket.DeletionPolicy).toBe('Retain');
      expect(bucket.UpdateReplacePolicy).toBe('Retain');
    });

    test('should create CloudTrail S3 bucket with public access completely blocked', () => {
      const bucket = template.Resources.CloudTrailBucket;
      const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });

    test('should create CloudTrail S3 bucket with 365-day lifecycle policy', () => {
      const bucket = template.Resources.CloudTrailBucket;
      const lifecycleRule = bucket.Properties.LifecycleConfiguration.Rules[0];

      expect(lifecycleRule.Id).toBe('DeleteOldTrailLogs');
      expect(lifecycleRule.Status).toBe('Enabled');
      expect(lifecycleRule.ExpirationInDays).toBe(365);
    });

    test('should create CloudTrail bucket policy allowing CloudTrail service ACL check', () => {
      const policy = template.Resources.CloudTrailBucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');

      const statements = policy.Properties.PolicyDocument.Statement;
      const aclCheckStatement = statements.find((s: any) => s.Sid === 'AWSCloudTrailAclCheck');
      expect(aclCheckStatement.Effect).toBe('Allow');
      expect(aclCheckStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
      expect(aclCheckStatement.Action).toBe('s3:GetBucketAcl');
    });

    test('should create CloudTrail bucket policy allowing CloudTrail service to write logs', () => {
      const policy = template.Resources.CloudTrailBucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      const writeStatement = statements.find((s: any) => s.Sid === 'AWSCloudTrailWrite');

      expect(writeStatement.Effect).toBe('Allow');
      expect(writeStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
      expect(writeStatement.Action).toBe('s3:PutObject');
      expect(writeStatement.Condition.StringEquals['s3:x-amz-acl']).toBe('bucket-owner-full-control');
    });

    test('should create CloudTrail with multi-region and global service events enabled', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('should create CloudTrail with management events and ReadWriteType All', () => {
      const trail = template.Resources.CloudTrail;
      const eventSelectors = trail.Properties.EventSelectors[0];

      expect(eventSelectors.ReadWriteType).toBe('All');
      expect(eventSelectors.IncludeManagementEvents).toBe(true);
    });

    test('should create CloudTrail with S3 bucket and CloudWatch Logs integration', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.DependsOn).toBe('CloudTrailBucketPolicy');
      expect(trail.Properties.S3BucketName).toEqual({ Ref: 'CloudTrailBucket' });
      expect(trail.Properties.CloudWatchLogsLogGroupArn).toEqual({
        'Fn::GetAtt': ['CloudTrailLogGroup', 'Arn']
      });
      expect(trail.Properties.CloudWatchLogsRoleArn).toEqual({
        'Fn::GetAtt': ['CloudTrailLogRole', 'Arn']
      });
    });
  });

  describe('CloudWatch Alarms Configuration', () => {
    test('should create EC2 CPU alarm with 80% threshold', () => {
      const alarm = template.Resources.EC2CPUAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should create EC2 CPU alarm monitoring correct EC2 instance', () => {
      const alarm = template.Resources.EC2CPUAlarm;
      expect(alarm.Properties.Dimensions).toHaveLength(1);
      expect(alarm.Properties.Dimensions[0].Name).toBe('InstanceId');
      expect(alarm.Properties.Dimensions[0].Value).toEqual({ Ref: 'EC2Instance' });
    });

    test('should create Lambda error alarm with 5-error threshold', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Statistic).toBe('Sum');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(1);
      expect(alarm.Properties.Threshold).toBe(5);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should create Lambda error alarm monitoring correct Lambda function', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Properties.Dimensions).toHaveLength(1);
      expect(alarm.Properties.Dimensions[0].Name).toBe('FunctionName');
      expect(alarm.Properties.Dimensions[0].Value).toEqual({ Ref: 'LambdaFunction' });
    });
  });
});
