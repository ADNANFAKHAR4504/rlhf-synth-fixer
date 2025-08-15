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
        'TAP Stack - Task Assignment Platform CloudFormation Template'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParameters = [
        'EnvironmentSuffix',
        'VpcCidr',
        'PublicSubnet1Cidr',
        'PublicSubnet2Cidr',
        'PrivateSubnet1Cidr',
        'PrivateSubnet2Cidr',
        'EC2InstanceType',

        'DBInstanceClass',
        'DBEngine',
        'DBEngineVersion',
        'DBName',
        'DBUsername'
      ];

      expectedParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
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

    test('VpcCidr parameter should have correct properties', () => {
      const vpcCidrParam = template.Parameters.VpcCidr;
      expect(vpcCidrParam.Type).toBe('String');
      expect(vpcCidrParam.Default).toBe('10.0.0.0/16');
      expect(vpcCidrParam.Description).toBe('CIDR block for VPC');
      expect(vpcCidrParam.AllowedPattern).toBeDefined();
    });

    test('EC2InstanceType parameter should have correct properties', () => {
      const ec2TypeParam = template.Parameters.EC2InstanceType;
      expect(ec2TypeParam.Type).toBe('String');
      expect(ec2TypeParam.Default).toBe('t3.medium');
      expect(ec2TypeParam.AllowedValues).toEqual([
        't3.micro',
        't3.small',
        't3.medium',
        't3.large',
        't3.xlarge'
      ]);
    });

    test('DBEngine parameter should have correct properties', () => {
      const dbEngineParam = template.Parameters.DBEngine;
      expect(dbEngineParam.Type).toBe('String');
      expect(dbEngineParam.Default).toBe('mysql');
      expect(dbEngineParam.AllowedValues).toEqual(['mysql', 'postgres']);
    });

    test('RDS master password should use managed credentials', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.ManageMasterUserPassword).toBe(true);
      expect(rds.Properties.MasterUserPassword).toBeUndefined();
    });
  });

  describe('Mappings', () => {
    test('should have RegionMap with multiple regions', () => {
      expect(template.Mappings.RegionMap).toBeDefined();
      const regions = Object.keys(template.Mappings.RegionMap);
      expect(regions.length).toBeGreaterThan(1);
      expect(regions).toContain('us-east-1');
      expect(regions).toContain('us-west-2');
    });

    test('should have DBEngineMap with correct engine configurations', () => {
      expect(template.Mappings.DBEngineMap).toBeDefined();
      expect(template.Mappings.DBEngineMap.mysql).toBeDefined();
      expect(template.Mappings.DBEngineMap.postgres).toBeDefined();
      
      expect(template.Mappings.DBEngineMap.mysql.Port).toBe(3306);
      expect(template.Mappings.DBEngineMap.mysql.Family).toBe('mysql8.0');
      expect(template.Mappings.DBEngineMap.postgres.Port).toBe(5432);
      expect(template.Mappings.DBEngineMap.postgres.Family).toBe('postgres15');
    });
  });

  describe('Conditions', () => {
    test('should have database engine conditions', () => {
      expect(template.Conditions.IsMySQL).toBeDefined();
      // Note: IsPostgreSQL condition removed as it was unused
    });
  });

  describe('Resources', () => {
    test('should have all required resource types', () => {
      const expectedResourceTypes = [
        'AWS::DynamoDB::Table',
        'AWS::KMS::Key',
        'AWS::KMS::Alias',
        'AWS::EC2::VPC',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::VPCGatewayAttachment',
        'AWS::EC2::Subnet',
        'AWS::EC2::EIP',
        'AWS::EC2::NatGateway',
        'AWS::EC2::RouteTable',
        'AWS::EC2::Route',
        'AWS::EC2::SubnetRouteTableAssociation',
        'AWS::EC2::SecurityGroup',
        'AWS::EC2::Instance',
        'AWS::S3::Bucket',
        'AWS::S3::BucketPolicy',
        'AWS::IAM::Role',
        'AWS::IAM::InstanceProfile',
        'AWS::RDS::DBSubnetGroup',
        'AWS::RDS::DBParameterGroup',
        'AWS::RDS::DBInstance',
        // Newly added components
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        'AWS::ElasticLoadBalancingV2::Listener',
        'AWS::WAFv2::WebACL',
        'AWS::WAFv2::WebACLAssociation',
        'AWS::Lambda::Function',
        'AWS::SNS::Topic',
        'AWS::SNS::TopicPolicy',
        'AWS::CloudWatch::Alarm'
      ];

      const actualResourceTypes = Object.values(template.Resources).map((r: any) => r.Type);
      expectedResourceTypes.forEach(expectedType => {
        expect(actualResourceTypes).toContain(expectedType);
      });
    });

    describe('DynamoDB Table', () => {
      test('TurnAroundPromptTable should have correct properties', () => {
        const table = template.Resources.TurnAroundPromptTable;
        expect(table.Type).toBe('AWS::DynamoDB::Table');
        expect(table.DeletionPolicy).toBe('Delete');
        expect(table.UpdateReplacePolicy).toBe('Delete');
        
        const properties = table.Properties;
        expect(properties.TableName).toEqual({
          'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}'
        });
        expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
        expect(properties.DeletionProtectionEnabled).toBe(false);
      });

      test('TurnAroundPromptTable should have correct attribute definitions', () => {
        const table = template.Resources.TurnAroundPromptTable;
        const attributeDefinitions = table.Properties.AttributeDefinitions;
        expect(attributeDefinitions).toHaveLength(1);
        expect(attributeDefinitions[0].AttributeName).toBe('id');
        expect(attributeDefinitions[0].AttributeType).toBe('S');
      });

      test('TurnAroundPromptTable should have correct key schema', () => {
        const table = template.Resources.TurnAroundPromptTable;
        const keySchema = table.Properties.KeySchema;
        expect(keySchema).toHaveLength(1);
        expect(keySchema[0].AttributeName).toBe('id');
        expect(keySchema[0].KeyType).toBe('HASH');
      });

      test('TurnAroundPromptTable should have proper tags', () => {
        const table = template.Resources.TurnAroundPromptTable;
        const tags = table.Properties.Tags;
        expect(tags).toHaveLength(2);
        expect(tags[0].Key).toBe('Name');
        expect(tags[1].Key).toBe('Environment');
      });
    });

    describe('KMS Keys', () => {
      test('should have EBS, RDS, and Lambda KMS keys', () => {
        expect(template.Resources.EBSKMSKey).toBeDefined();
        expect(template.Resources.RDSKMSKey).toBeDefined();
        expect(template.Resources.LambdaKMSKey).toBeDefined();
      });

      test('KMS keys should have proper deletion policies', () => {
        expect(template.Resources.EBSKMSKey.DeletionPolicy).toBe('Retain');
        expect(template.Resources.RDSKMSKey.DeletionPolicy).toBe('Retain');
        expect(template.Resources.LambdaKMSKey.DeletionPolicy).toBe('Retain');
      });

      test('KMS keys should have proper key policies', () => {
        const ebsKey = template.Resources.EBSKMSKey;
        expect(ebsKey.Properties.KeyPolicy.Statement).toHaveLength(2);
        expect(ebsKey.Properties.KeyPolicy.Statement[0].Sid).toBe('Enable IAM User Permissions');
        expect(ebsKey.Properties.KeyPolicy.Statement[1].Sid).toBe('Allow use of the key for EBS');
      });
    });

    describe('VPC and Networking', () => {
      test('VPC should have correct properties', () => {
        const vpc = template.Resources.VPC;
        expect(vpc.Type).toBe('AWS::EC2::VPC');
        expect(vpc.Properties.EnableDnsHostnames).toBe(true);
        expect(vpc.Properties.EnableDnsSupport).toBe(true);
        expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
      });

      test('should have public and private subnets', () => {
        expect(template.Resources.PublicSubnet1).toBeDefined();
        expect(template.Resources.PublicSubnet2).toBeDefined();
        expect(template.Resources.PrivateSubnet1).toBeDefined();
        expect(template.Resources.PrivateSubnet2).toBeDefined();
      });

      test('public subnets should have MapPublicIpOnLaunch enabled', () => {
        expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
        expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      });

      test('should have NAT gateways with EIPs', () => {
        expect(template.Resources.NatGateway1).toBeDefined();
        expect(template.Resources.NatGateway2).toBeDefined();
        expect(template.Resources.NatGateway1EIP).toBeDefined();
        expect(template.Resources.NatGateway2EIP).toBeDefined();
      });
    });

    describe('Security Groups', () => {
      test('should have all required security groups', () => {
        expect(template.Resources.ALBSecurityGroup).toBeDefined();
        expect(template.Resources.EC2SecurityGroup).toBeDefined();
        expect(template.Resources.RDSSecurityGroup).toBeDefined();
        expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      });

      test('ALB security group should allow HTTP and HTTPS', () => {
        const albSg = template.Resources.ALBSecurityGroup;
        const ingress = albSg.Properties.SecurityGroupIngress;
        expect(ingress).toHaveLength(2);
        
        const httpRule = ingress.find((r: any) => r.FromPort === 80);
        const httpsRule = ingress.find((r: any) => r.FromPort === 443);
        expect(httpRule).toBeDefined();
        expect(httpsRule).toBeDefined();
      });

      test('EC2 security group should allow HTTP from ALB and SSH from CIDR', () => {
        const ec2Sg = template.Resources.EC2SecurityGroup;
        const ingress = ec2Sg.Properties.SecurityGroupIngress;
        expect(ingress).toHaveLength(2);
        
        const httpRule = ingress.find((r: any) => r.FromPort === 80);
        expect(httpRule).toBeDefined();
        expect(httpRule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
        expect(httpRule.Description).toBe('HTTP access from ALB');
        
        const sshRule = ingress.find((r: any) => r.FromPort === 22);
        expect(sshRule).toBeDefined();
        expect(sshRule.CidrIp).toEqual({ Ref: 'SSHAccessCidr' });
        expect(sshRule.Description).toBe('SSH access from defined IP whitelist');
      });
    });

    describe('S3 Buckets', () => {
      test('should have access logs and RDS backup buckets', () => {
        expect(template.Resources.S3AccessLogsBucket).toBeDefined();
        expect(template.Resources.RDSBackupBucket).toBeDefined();
      });

      test('S3 buckets should have proper deletion policies', () => {
        expect(template.Resources.S3AccessLogsBucket.DeletionPolicy).toBe('Retain');
        expect(template.Resources.RDSBackupBucket.DeletionPolicy).toBe('Retain');
      });

      test('S3 buckets should have encryption enabled', () => {
        const accessLogsBucket = template.Resources.S3AccessLogsBucket;
        expect(accessLogsBucket.Properties.BucketEncryption).toBeDefined();
        expect(accessLogsBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      });

      test('S3 buckets should block public access', () => {
        const accessLogsBucket = template.Resources.S3AccessLogsBucket;
        expect(accessLogsBucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
        expect(accessLogsBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      });
    });

    describe('IAM Roles', () => {
      test('should have all required IAM roles', () => {
        expect(template.Resources.EC2InstanceRole).toBeDefined();
        expect(template.Resources.RDSServiceRole).toBeDefined();
        expect(template.Resources.LambdaExecutionRole).toBeDefined();
      });

      test('IAM roles should have proper deletion policies', () => {
        expect(template.Resources.EC2InstanceRole.DeletionPolicy).toBe('Retain');
        expect(template.Resources.RDSServiceRole.DeletionPolicy).toBe('Retain');
        expect(template.Resources.LambdaExecutionRole.DeletionPolicy).toBe('Retain');
      });

      test('EC2 instance role should have CloudWatch policy', () => {
        const ec2Role = template.Resources.EC2InstanceRole;
        expect(ec2Role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      });

      test('RDS service role should have monitoring policy', () => {
        const rdsRole = template.Resources.RDSServiceRole;
        expect(rdsRole.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole');
      });
    });

    describe('EC2 Instances', () => {
      test('should have two EC2 instances', () => {
        expect(template.Resources.EC2Instance1).toBeDefined();
        expect(template.Resources.EC2Instance2).toBeDefined();
      });

      test('EC2 instances should have proper deletion policies', () => {
        expect(template.Resources.EC2Instance1.DeletionPolicy).toBe('Delete');
        expect(template.Resources.EC2Instance2.DeletionPolicy).toBe('Delete');
      });

      test('EC2 instances should use KMS encryption', () => {
        const ec2Instance = template.Resources.EC2Instance1;
        const blockDevice = ec2Instance.Properties.BlockDeviceMappings[0];
        expect(blockDevice.Ebs.Encrypted).toBe(true);
        expect(blockDevice.Ebs.KmsKeyId).toEqual({ Ref: 'EBSKMSKey' });
      });

      test('EC2 instances should have CloudWatch agent configuration', () => {
        const ec2Instance = template.Resources.EC2Instance1;
        expect(ec2Instance.Properties.UserData).toBeDefined();
        expect(ec2Instance.Properties.UserData['Fn::Base64']).toBeDefined();
      });
    });

    describe('RDS Database', () => {
      test('should have RDS instance with proper configuration', () => {
        const rds = template.Resources.RDSInstance;
        expect(rds.Type).toBe('AWS::RDS::DBInstance');
        expect(rds.DeletionPolicy).toBe('Snapshot');
        expect(rds.UpdateReplacePolicy).toBe('Snapshot');
      });

      test('RDS should use KMS encryption', () => {
        const rds = template.Resources.RDSInstance;
        expect(rds.Properties.StorageEncrypted).toBe(true);
        expect(rds.Properties.KmsKeyId).toEqual({ Ref: 'RDSKMSKey' });
      });

      test('RDS should have Multi-AZ enabled', () => {
        const rds = template.Resources.RDSInstance;
        expect(rds.Properties.MultiAZ).toBe(true);
      });

      test('RDS should have proper monitoring configuration', () => {
        const rds = template.Resources.RDSInstance;
        expect(rds.Properties.MonitoringInterval).toBe(60);
        expect(rds.Properties.MonitoringRoleArn).toEqual({ 'Fn::GetAtt': ['RDSServiceRole', 'Arn'] });
      });

      test('RDS should have conditional CloudWatch logs export', () => {
        const rds = template.Resources.RDSInstance;
        expect(rds.Properties.EnableCloudwatchLogsExports).toBeDefined();
        expect(rds.Properties.EnableCloudwatchLogsExports['Fn::If']).toBeDefined();
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'ALBSecurityGroupId',
        'EC2SecurityGroupId',
        'RDSSecurityGroupId',
        'RDSInstanceId',
        'RDSInstanceEndpoint',
        'S3AccessLogsBucketName',
        'RDSBackupBucketName',
        'StackName',
        'EnvironmentSuffix',
        // Newly added outputs
        'ALBArn',
        'ALBDNSName',
        'WebACLArn',
        'LambdaFunctionName',
        'AlarmTopicArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('TurnAroundPromptTableName output should be correct', () => {
      const output = template.Outputs.TurnAroundPromptTableName;
      expect(output.Description).toBe('Name of the DynamoDB table');
      expect(output.Value).toEqual({ Ref: 'TurnAroundPromptTable' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-TurnAroundPromptTableName'
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPCId'
      });
    });

    test('RDSInstanceEndpoint output should be correct', () => {
      const output = template.Outputs.RDSInstanceEndpoint;
      expect(output.Description).toBe('RDS Instance Endpoint');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['RDSInstance', 'Endpoint.Address']
      });
    });

    test('RDSMasterUserSecret output should be correct', () => {
      const output = template.Outputs.RDSMasterUserSecret;
      expect(output.Description).toBe('ARN of the Secrets Manager secret containing the RDS master user credentials');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['RDSInstance', 'MasterUserSecret.SecretArn']
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-RDSMasterUserSecret'
      });
    });

    // Newly added outputs
    test('ALBArn output should be correct', () => {
      const output = template.Outputs.ALBArn;
      expect(output.Description).toBe('ARN of the Application Load Balancer');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'LoadBalancerArn'] });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-ALBArn' });
    });

    test('ALBDNSName output should be correct', () => {
      const output = template.Outputs.ALBDNSName;
      expect(output.Description).toBe('DNS name of the Application Load Balancer');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'] });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-ALBDNSName' });
    });

    test('WebACLArn output should be correct', () => {
      const output = template.Outputs.WebACLArn;
      expect(output.Description).toBe('ARN of the associated WAFv2 WebACL');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['WebACL', 'Arn'] });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-WebACLArn' });
    });

    test('LambdaFunctionName output should be correct', () => {
      const output = template.Outputs.LambdaFunctionName;
      expect(output.Description).toBe('Name of the application Lambda function');
      expect(output.Value).toEqual({ Ref: 'AppFunction' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-LambdaFunctionName' });
    });

    test('AlarmTopicArn output should be correct', () => {
      const output = template.Outputs.AlarmTopicArn;
      expect(output.Description).toBe('SNS Topic ARN for CloudWatch alarms');
      expect(output.Value).toEqual({ Ref: 'AlarmTopic' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-AlarmTopicArn' });
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
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
      expect(resourceCount).toBeGreaterThan(20); // Should have many resources
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(13);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(22);
    });
  });

  describe('Resource Naming Convention', () => {
    test('resource names should follow naming convention with environment suffix', () => {
      const resources = template.Resources;
      
      // Check a few key resources
      const vpc = resources.VPC;
      expect(vpc.Properties.Tags[0].Value).toEqual({
        'Fn::Sub': '${EnvironmentSuffix}-vpc'
      });

      const dynamoTable = resources.TurnAroundPromptTable;
      expect(dynamoTable.Properties.TableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}'
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`
        });
      });
    });
  });

  describe('Security and Compliance', () => {
    test('all KMS keys should have proper key policies', () => {
      const kmsKeys = ['EBSKMSKey', 'RDSKMSKey', 'LambdaKMSKey'];
      kmsKeys.forEach(keyName => {
        const key = template.Resources[keyName];
        expect(key.Properties.KeyPolicy.Statement).toBeDefined();
        expect(key.Properties.KeyPolicy.Statement.length).toBeGreaterThan(0);
      });
    });

    test('S3 buckets should have encryption and public access blocking', () => {
      const s3Buckets = ['S3AccessLogsBucket', 'RDSBackupBucket'];
      s3Buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      });
    });

    test('security groups should have proper ingress rules', () => {
      const securityGroups = ['ALBSecurityGroup', 'EC2SecurityGroup', 'RDSSecurityGroup'];
      securityGroups.forEach(sgName => {
        const sg = template.Resources[sgName];
        expect(sg.Properties.SecurityGroupIngress).toBeDefined();
        // Note: Egress rules are optional and use AWS defaults if not specified
      });
    });
  });
});
