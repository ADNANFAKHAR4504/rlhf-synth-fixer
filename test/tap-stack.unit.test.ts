import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Template converted from YAML to JSON for testing
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
      expect(template.Description).toContain('Secure and compliant infrastructure');
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = ['Environment', 'Owner', 'EnvironmentSuffix', 'TrustedCIDR', 'DBUsername', 'LatestAmiId'];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('');
      expect(envSuffixParam.Description).toContain('Environment suffix for resource naming');
    });

    test('TrustedCIDR parameter should have security validation', () => {
      const param = template.Parameters.TrustedCIDR;
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBeDefined();
      expect(param.Default).toBe('10.0.0.0/8');
    });

    test('DBUsername parameter should have validation constraints', () => {
      const param = template.Parameters.DBUsername;
      expect(param.Type).toBe('String');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
      expect(param.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
    });
  });

  describe('Core Resources', () => {
    test('should have all essential resources', () => {
      const essentialResources = [
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2', 
        'PrivateSubnet1', 'PrivateSubnet2', 'NatGateway1',
        'EC2SecurityGroup', 'RDSSecurityGroup', 'LambdaSecurityGroup',
        'EC2Role', 'LambdaExecutionRole', 'CloudTrailRole',
        'SecureS3Bucket', 'CloudTrailS3Bucket', 'RDSInstance',
        'EC2Instance', 'LambdaFunction', 'CloudTrail', 'DBSecret'
      ];
      
      essentialResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('VPC should have correct configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have correct subnet configuration', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      
      expect(publicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      
      expect(privateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet1.Properties.CidrBlock).toBe('10.0.10.0/24');
    });
  });

  describe('Security Configuration', () => {
    test('EC2 security group should restrict access to trusted networks', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingressRules = sg.Properties.SecurityGroupIngress;
      ingressRules.forEach(rule => {
        expect(rule.CidrIp).toEqual({ Ref: 'TrustedCIDR' });
      });
    });

    test('RDS security group should only allow access from EC2 and Lambda', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(2);
      expect(ingressRules[0].SourceSecurityGroupId).toEqual({ Ref: 'EC2SecurityGroup' });
      expect(ingressRules[1].SourceSecurityGroupId).toEqual({ Ref: 'LambdaSecurityGroup' });
    });

    test('Lambda security group should restrict outbound to HTTPS only', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      
      const egressRules = sg.Properties.SecurityGroupEgress;
      expect(egressRules).toHaveLength(1);
      expect(egressRules[0].FromPort).toBe(443);
      expect(egressRules[0].ToPort).toBe(443);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('EC2 role should follow least privilege principle', () => {
      const role = template.Resources.EC2Role;
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(2);
      expect(policies[0].PolicyName).toBe('S3ReadOnlyAccess');
      expect(policies[1].PolicyName).toBe('SecretsManagerReadAccess');
    });

    test('Lambda execution role should have VPC and CloudWatch access', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const managedPolicies = role.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
    });
  });

  describe('Storage and Encryption', () => {
    test('S3 buckets should have AES-256 encryption enabled', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(encryption.BucketKeyEnabled).toBe(true);
    });

    test('S3 buckets should block public access', () => {
      const bucket = template.Resources.SecureS3Bucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('RDS instance should have encryption at rest and Multi-AZ', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.MultiAZ).toBe(true);
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.EngineVersion).toBe('8.0.39');
    });
  });

  describe('Secrets Management', () => {
    test('database secret should be properly configured', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      
      const generateConfig = secret.Properties.GenerateSecretString;
      expect(generateConfig.PasswordLength).toBe(32);
      expect(generateConfig.RequireEachIncludedType).toBe(true);
    });

    test('RDS should use Secrets Manager for password management', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.ManageMasterUserPassword).toBe(true);
      expect(rds.Properties.MasterUserSecret.SecretArn).toEqual({ Ref: 'DBSecret' });
    });
  });

  describe('EC2 and Launch Template', () => {
    test('launch template should enforce IMDSv2', () => {
      const launchTemplate = template.Resources.EC2LaunchTemplate;
      expect(launchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
      
      const metadataOptions = launchTemplate.Properties.LaunchTemplateData.MetadataOptions;
      expect(metadataOptions.HttpTokens).toBe('required');
      expect(metadataOptions.HttpEndpoint).toBe('enabled');
    });

    test('EC2 instance should be in private subnet', () => {
      const instance = template.Resources.EC2Instance;
      expect(instance.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
    });
  });

  describe('Lambda Configuration', () => {
    test('Lambda function should be in VPC with no internet access', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      
      const vpcConfig = lambda.Properties.VpcConfig;
      expect(vpcConfig.SubnetIds).toEqual([{ Ref: 'PrivateSubnet1' }, { Ref: 'PrivateSubnet2' }]);
      expect(vpcConfig.SecurityGroupIds).toEqual([{ Ref: 'LambdaSecurityGroup' }]);
    });

    test('Lambda should have access to database secret', () => {
      const lambda = template.Resources.LambdaFunction;
      const envVars = lambda.Properties.Environment.Variables;
      expect(envVars.DB_SECRET_ARN).toEqual({ Ref: 'DBSecret' });
    });
  });

  describe('VPC Endpoints', () => {
    test('should have VPC endpoints for secure AWS service access', () => {
      const expectedEndpoints = [
        'S3VPCEndpoint', 'LambdaVPCEndpoint', 'SecretsManagerVPCEndpoint',
        'SSMVPCEndpoint', 'SSMMessagesVPCEndpoint', 'EC2MessagesVPCEndpoint'
      ];
      
      expectedEndpoints.forEach(endpoint => {
        expect(template.Resources[endpoint]).toBeDefined();
      });
    });

    test('Secrets Manager VPC endpoint should restrict access to database secret', () => {
      const endpoint = template.Resources.SecretsManagerVPCEndpoint;
      const policy = endpoint.Properties.PolicyDocument.Statement[0];
      expect(policy.Resource).toEqual({ Ref: 'DBSecret' });
    });
  });

  describe('Monitoring and Logging', () => {
    test('should have CloudTrail with S3 and CloudWatch integration', () => {
      const cloudtrail = template.Resources.CloudTrail;
      expect(cloudtrail.Type).toBe('AWS::CloudTrail::Trail');
      expect(cloudtrail.Properties.IsMultiRegionTrail).toBe(true);
      expect(cloudtrail.Properties.EnableLogFileValidation).toBe(true);
      expect(cloudtrail.Properties.IsLogging).toBe(true);
    });

    test('should have CloudWatch alarms for EC2 monitoring', () => {
      const cpuAlarm = template.Resources.EC2CPUAlarm;
      const statusAlarm = template.Resources.EC2StatusCheckFailedAlarm;
      
      expect(cpuAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(cpuAlarm.Properties.Threshold).toBe(80);
      
      expect(statusAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(statusAlarm.Properties.MetricName).toBe('StatusCheckFailed');
    });

    test('should have proper log groups with retention policies', () => {
      const cloudTrailLogGroup = template.Resources.CloudTrailLogGroup;
      const lambdaLogGroup = template.Resources.LambdaLogGroup;
      
      expect(cloudTrailLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(cloudTrailLogGroup.Properties.RetentionInDays).toBe(30);
      
      expect(lambdaLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(lambdaLogGroup.Properties.RetentionInDays).toBe(7);
    });
  });

  describe('Outputs', () => {
    test('should have all essential outputs for integration testing', () => {
      const expectedOutputs = [
        'VPCId', 'PublicSubnet1Id', 'PublicSubnet2Id', 'PrivateSubnet1Id', 'PrivateSubnet2Id',
        'EC2InstanceId', 'EC2SecurityGroupId', 'RDSInstanceId', 'RDSEndpoint', 'RDSPort',
        'DBSecretArn', 'S3BucketName', 'S3BucketArn', 'LambdaFunctionName', 'LambdaFunctionArn',
        'CloudTrailArn', 'CloudTrailS3BucketName', 'NATGatewayId', 'InternetGatewayId',
        'SecretsManagerVPCEndpointId', 'LatestAmiId'
      ];
      
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPC output should export with environment suffix', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPC-ID${EnvironmentSuffix}'
      });
    });

    test('RDS outputs should provide connection information', () => {
      const endpointOutput = template.Outputs.RDSEndpoint;
      const portOutput = template.Outputs.RDSPort;
      const secretOutput = template.Outputs.DBSecretArn;
      
      expect(endpointOutput.Value).toEqual({ 'Fn::GetAtt': ['RDSInstance', 'Endpoint.Address'] });
      expect(portOutput.Value).toEqual({ 'Fn::GetAtt': ['RDSInstance', 'Endpoint.Port'] });
      expect(secretOutput.Value).toEqual({ Ref: 'DBSecret' });
    });

    test('Lambda outputs should provide function details', () => {
      const nameOutput = template.Outputs.LambdaFunctionName;
      const arnOutput = template.Outputs.LambdaFunctionArn;
      
      expect(nameOutput.Value).toEqual({ Ref: 'LambdaFunction' });
      expect(arnOutput.Value).toEqual({ 'Fn::GetAtt': ['LambdaFunction', 'Arn'] });
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

    test('should have comprehensive infrastructure resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30); // Comprehensive infrastructure
    });

    test('should have all required parameters for security compliance', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(6);
    });

    test('should have comprehensive outputs for testing', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(15);
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow naming convention with environment suffix', () => {
      const vpc = template.Resources.VPC;
      const s3Bucket = template.Resources.SecureS3Bucket;
      
      expect(vpc.Properties.Tags.find(t => t.Key === 'Name').Value).toEqual({
        'Fn::Sub': 'secure-vpc${EnvironmentSuffix}'
      });
      expect(s3Bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'secure-bucket${EnvironmentSuffix}-${AWS::AccountId}'
      });
    });

    test('export names should follow naming convention with environment suffix', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
        expect(output.Export.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });

    test('all resources should have proper tagging', () => {
      const taggedResources = ['VPC', 'PublicSubnet1', 'PrivateSubnet1', 'EC2Instance', 'RDSInstance', 'SecureS3Bucket'];
      
      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        
        const environmentTag = resource.Properties.Tags.find(t => t.Key === 'Environment');
        const ownerTag = resource.Properties.Tags.find(t => t.Key === 'Owner');
        
        expect(environmentTag).toBeDefined();
        expect(ownerTag).toBeDefined();
        expect(environmentTag.Value).toEqual({ Ref: 'Environment' });
        expect(ownerTag.Value).toEqual({ Ref: 'Owner' });
      });
    });
  });
});
