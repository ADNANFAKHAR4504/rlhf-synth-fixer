import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the CloudFormation template
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
      expect(template.Description).toContain('PCI-DSS compliant');
    });

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
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toContain('suffix');
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });
  });

  describe('VPC Infrastructure', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS support enabled', () => {
      const vpcProps = template.Resources.VPC.Properties;
      expect(vpcProps.EnableDnsHostnames).toBe(true);
      expect(vpcProps.EnableDnsSupport).toBe(true);
    });

    test('VPC should have PCI compliance tags', () => {
      const tags = template.Resources.VPC.Properties.Tags;
      expect(tags).toContainEqual({ Key: 'DataClassification', Value: 'PCI' });
      expect(tags).toContainEqual({ Key: 'ComplianceScope', Value: 'Payment' });
    });

    test('should have three private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('private subnets should have correct types', () => {
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet3.Type).toBe('AWS::EC2::Subnet');
    });

    test('private subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PrivateSubnet3.Properties.CidrBlock).toBe('10.0.3.0/24');
    });

    test('private subnets should not have public IPs', () => {
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateSubnet3.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('private subnets should span across three availability zones', () => {
      const subnet1Az = template.Resources.PrivateSubnet1.Properties.AvailabilityZone;
      const subnet2Az = template.Resources.PrivateSubnet2.Properties.AvailabilityZone;
      const subnet3Az = template.Resources.PrivateSubnet3.Properties.AvailabilityZone;

      expect(subnet1Az).toEqual({ 'Fn::Select': ['0', { 'Fn::GetAZs': '' }] });
      expect(subnet2Az).toEqual({ 'Fn::Select': ['1', { 'Fn::GetAZs': '' }] });
      expect(subnet3Az).toEqual({ 'Fn::Select': ['2', { 'Fn::GetAZs': '' }] });
    });

    test('private subnets should have PCI compliance tags', () => {
      [template.Resources.PrivateSubnet1, template.Resources.PrivateSubnet2, template.Resources.PrivateSubnet3].forEach(subnet => {
        const tags = subnet.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'DataClassification', Value: 'PCI' });
        expect(tags).toContainEqual({ Key: 'ComplianceScope', Value: 'Payment' });
      });
    });

    test('should have a private route table', () => {
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have route table associations for all subnets', () => {
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet3RouteTableAssociation).toBeDefined();
    });

    test('route table associations should have correct type', () => {
      expect(template.Resources.PrivateSubnet1RouteTableAssociation.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(template.Resources.PrivateSubnet2RouteTableAssociation.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(template.Resources.PrivateSubnet3RouteTableAssociation.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    });

    test('should have S3 VPC endpoint', () => {
      expect(template.Resources.S3VPCEndpoint).toBeDefined();
      expect(template.Resources.S3VPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
    });

    test('S3 VPC endpoint should be gateway type', () => {
      expect(template.Resources.S3VPCEndpoint.Properties.VpcEndpointType).toBe('Gateway');
    });

    test('S3 VPC endpoint should have policy document', () => {
      const policy = template.Resources.S3VPCEndpoint.Properties.PolicyDocument;
      expect(policy).toBeDefined();
      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement).toBeDefined();
      expect(policy.Statement.length).toBeGreaterThan(0);
    });

    test('should have KMS VPC endpoint', () => {
      expect(template.Resources.KMSVPCEndpoint).toBeDefined();
      expect(template.Resources.KMSVPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
    });

    test('KMS VPC endpoint should be interface type', () => {
      expect(template.Resources.KMSVPCEndpoint.Properties.VpcEndpointType).toBe('Interface');
    });

    test('KMS VPC endpoint should have private DNS enabled', () => {
      expect(template.Resources.KMSVPCEndpoint.Properties.PrivateDnsEnabled).toBe(true);
    });

    test('KMS VPC endpoint should be in all three subnets', () => {
      const subnetIds = template.Resources.KMSVPCEndpoint.Properties.SubnetIds;
      expect(subnetIds).toHaveLength(3);
    });
  });

  describe('Security Groups', () => {
    test('should have Lambda security group', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.LambdaSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have KMS endpoint security group', () => {
      expect(template.Resources.KMSEndpointSecurityGroup).toBeDefined();
      expect(template.Resources.KMSEndpointSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('Lambda security group should have egress rule to KMS endpoint', () => {
      const egressRule = template.Resources.LambdaSecurityGroupEgress;
      expect(egressRule).toBeDefined();
      expect(egressRule.Type).toBe('AWS::EC2::SecurityGroupEgress');
      expect(egressRule.Properties.IpProtocol).toBe('tcp');
      expect(egressRule.Properties.FromPort).toBe(443);
      expect(egressRule.Properties.ToPort).toBe(443);
      expect(egressRule.Properties.GroupId).toEqual({ 'Ref': 'LambdaSecurityGroup' });
      expect(egressRule.Properties.DestinationSecurityGroupId).toEqual({ 'Ref': 'KMSEndpointSecurityGroup' });
    });

    test('Lambda security group should not have 0.0.0.0/0 egress', () => {
      // Lambda security group only has one specific egress rule to KMS endpoint
      const egressRule = template.Resources.LambdaSecurityGroupEgress;
      expect(egressRule).toBeDefined();
      // Ensure no other egress rules exist by checking that SecurityGroupEgress property doesn't exist
      expect(template.Resources.LambdaSecurityGroup.Properties.SecurityGroupEgress).toBeUndefined();
    });

    test('KMS endpoint security group should have ingress rule from Lambda', () => {
      const ingressRule = template.Resources.KMSEndpointSecurityGroupIngress;
      expect(ingressRule).toBeDefined();
      expect(ingressRule.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(ingressRule.Properties.IpProtocol).toBe('tcp');
      expect(ingressRule.Properties.FromPort).toBe(443);
      expect(ingressRule.Properties.ToPort).toBe(443);
      expect(ingressRule.Properties.GroupId).toEqual({ 'Ref': 'KMSEndpointSecurityGroup' });
      expect(ingressRule.Properties.SourceSecurityGroupId).toEqual({ 'Ref': 'LambdaSecurityGroup' });
    });

    test('KMS endpoint security group should have no egress rules', () => {
      const egress = template.Resources.KMSEndpointSecurityGroup.Properties.SecurityGroupEgress;
      expect(egress).toEqual([]);
    });

    test('security groups should have PCI compliance tags', () => {
      [template.Resources.LambdaSecurityGroup, template.Resources.KMSEndpointSecurityGroup].forEach(sg => {
        const tags = sg.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'DataClassification', Value: 'PCI' });
        expect(tags).toContainEqual({ Key: 'ComplianceScope', Value: 'Payment' });
      });
    });
  });

  describe('KMS Key', () => {
    test('should have KMS key resource', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have Retain deletion policy', () => {
      expect(template.Resources.KMSKey.DeletionPolicy).toBe('Retain');
    });

    test('KMS key should have key policy', () => {
      const keyPolicy = template.Resources.KMSKey.Properties.KeyPolicy;
      expect(keyPolicy).toBeDefined();
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toBeDefined();
    });

    test('KMS key policy should allow root account', () => {
      const keyPolicy = template.Resources.KMSKey.Properties.KeyPolicy;
      const rootStatement = keyPolicy.Statement.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Action).toBe('kms:*');
    });

    test('KMS key policy should allow S3 service', () => {
      const keyPolicy = template.Resources.KMSKey.Properties.KeyPolicy;
      const s3Statement = keyPolicy.Statement.find((s: any) => s.Sid === 'Allow S3 to use the key');
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Principal.Service).toBe('s3.amazonaws.com');
    });

    test('KMS key policy should allow CloudWatch Logs service', () => {
      const keyPolicy = template.Resources.KMSKey.Properties.KeyPolicy;
      const logsStatement = keyPolicy.Statement.find((s: any) => s.Sid === 'Allow CloudWatch Logs to use the key');
      expect(logsStatement).toBeDefined();
    });

    test('KMS key should have PCI compliance tags', () => {
      const tags = template.Resources.KMSKey.Properties.Tags;
      expect(tags).toContainEqual({ Key: 'DataClassification', Value: 'PCI' });
      expect(tags).toContainEqual({ Key: 'ComplianceScope', Value: 'Payment' });
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.KMSKeyAlias).toBeDefined();
      expect(template.Resources.KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('KMS key alias should reference the key', () => {
      const aliasProps = template.Resources.KMSKeyAlias.Properties;
      expect(aliasProps.TargetKeyId).toEqual({ Ref: 'KMSKey' });
    });
  });

  describe('S3 Buckets', () => {
    test('should have data bucket', () => {
      expect(template.Resources.DataBucket).toBeDefined();
      expect(template.Resources.DataBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('data bucket should have Retain deletion policy', () => {
      expect(template.Resources.DataBucket.DeletionPolicy).toBe('Retain');
    });

    test('data bucket should have KMS encryption', () => {
      const encryption = template.Resources.DataBucket.Properties.BucketEncryption;
      expect(encryption).toBeDefined();
      const sseConfig = encryption.ServerSideEncryptionConfiguration[0];
      expect(sseConfig.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(sseConfig.BucketKeyEnabled).toBe(true);
    });

    test('data bucket should block all public access', () => {
      const publicAccess = template.Resources.DataBucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('data bucket should have versioning enabled', () => {
      const versioning = template.Resources.DataBucket.Properties.VersioningConfiguration;
      expect(versioning.Status).toBe('Enabled');
    });

    test('data bucket should have lifecycle policy', () => {
      const lifecycle = template.Resources.DataBucket.Properties.LifecycleConfiguration;
      expect(lifecycle).toBeDefined();
      expect(lifecycle.Rules).toBeDefined();
      expect(lifecycle.Rules.length).toBeGreaterThan(0);
    });

    test('data bucket should have PCI compliance tags', () => {
      const tags = template.Resources.DataBucket.Properties.Tags;
      expect(tags).toContainEqual({ Key: 'DataClassification', Value: 'PCI' });
      expect(tags).toContainEqual({ Key: 'ComplianceScope', Value: 'Payment' });
    });

    test('should have data bucket policy', () => {
      expect(template.Resources.DataBucketPolicy).toBeDefined();
      expect(template.Resources.DataBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('data bucket policy should deny unencrypted uploads', () => {
      const policy = template.Resources.DataBucketPolicy.Properties.PolicyDocument;
      const denyUnencrypted = policy.Statement.find((s: any) => s.Sid === 'DenyUnencryptedObjectUploads');
      expect(denyUnencrypted).toBeDefined();
      expect(denyUnencrypted.Effect).toBe('Deny');
      expect(denyUnencrypted.Action).toBe('s3:PutObject');
    });

    test('data bucket policy should deny insecure transport', () => {
      const policy = template.Resources.DataBucketPolicy.Properties.PolicyDocument;
      const denyInsecure = policy.Statement.find((s: any) => s.Sid === 'DenyInsecureTransport');
      expect(denyInsecure).toBeDefined();
      expect(denyInsecure.Effect).toBe('Deny');
      expect(denyInsecure.Condition.Bool['aws:SecureTransport']).toBe('false');
    });

    test('should have config bucket', () => {
      expect(template.Resources.ConfigBucket).toBeDefined();
      expect(template.Resources.ConfigBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('config bucket should have KMS encryption', () => {
      const encryption = template.Resources.ConfigBucket.Properties.BucketEncryption;
      expect(encryption).toBeDefined();
      const sseConfig = encryption.ServerSideEncryptionConfiguration[0];
      expect(sseConfig.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('config bucket should block all public access', () => {
      const publicAccess = template.Resources.ConfigBucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Lambda Function', () => {
    test('should have Lambda function', () => {
      expect(template.Resources.DataValidationFunction).toBeDefined();
      expect(template.Resources.DataValidationFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda function should have 1GB memory', () => {
      expect(template.Resources.DataValidationFunction.Properties.MemorySize).toBe(1024);
    });

    test('Lambda function should have 60 second timeout', () => {
      expect(template.Resources.DataValidationFunction.Properties.Timeout).toBe(60);
    });

    test('Lambda function should have nodejs22.x runtime', () => {
      expect(template.Resources.DataValidationFunction.Properties.Runtime).toBe('nodejs22.x');
    });

    test('Lambda function should be in VPC', () => {
      const vpcConfig = template.Resources.DataValidationFunction.Properties.VpcConfig;
      expect(vpcConfig).toBeDefined();
      expect(vpcConfig.SubnetIds).toBeDefined();
      expect(vpcConfig.SecurityGroupIds).toBeDefined();
    });

    test('Lambda function should be in all three subnets', () => {
      const subnetIds = template.Resources.DataValidationFunction.Properties.VpcConfig.SubnetIds;
      expect(subnetIds).toHaveLength(3);
    });

    test('Lambda function should have environment variables', () => {
      const env = template.Resources.DataValidationFunction.Properties.Environment;
      expect(env).toBeDefined();
      expect(env.Variables.DATA_BUCKET).toBeDefined();
      expect(env.Variables.KMS_KEY_ID).toBeDefined();
    });

    test('Lambda function should have inline code', () => {
      const code = template.Resources.DataValidationFunction.Properties.Code;
      expect(code.ZipFile).toBeDefined();
      expect(code.ZipFile).toContain('exports.handler');
    });

    test('Lambda function should have PCI compliance tags', () => {
      const tags = template.Resources.DataValidationFunction.Properties.Tags;
      expect(tags).toContainEqual({ Key: 'DataClassification', Value: 'PCI' });
      expect(tags).toContainEqual({ Key: 'ComplianceScope', Value: 'Payment' });
    });

    test('should have Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('Lambda execution role should have VPC access policy', () => {
      const managedPolicies = template.Resources.LambdaExecutionRole.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
    });

    test('Lambda execution role should have S3 access policy', () => {
      const policies = template.Resources.LambdaExecutionRole.Properties.Policies;
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3Access');
      expect(s3Policy).toBeDefined();
    });

    test('Lambda execution role should have KMS access policy', () => {
      const policies = template.Resources.LambdaExecutionRole.Properties.Policies;
      const kmsPolicy = policies.find((p: any) => p.PolicyName === 'KMSAccess');
      expect(kmsPolicy).toBeDefined();
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have VPC flow logs log group', () => {
      expect(template.Resources.VPCFlowLogsLogGroup).toBeDefined();
      expect(template.Resources.VPCFlowLogsLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('VPC flow logs should have 90-day retention', () => {
      expect(template.Resources.VPCFlowLogsLogGroup.Properties.RetentionInDays).toBe(90);
    });

    test('VPC flow logs should be encrypted with KMS', () => {
      const kmsKeyId = template.Resources.VPCFlowLogsLogGroup.Properties.KmsKeyId;
      expect(kmsKeyId).toBeDefined();
    });

    test('VPC flow logs should have PCI compliance tags', () => {
      const tags = template.Resources.VPCFlowLogsLogGroup.Properties.Tags;
      expect(tags).toContainEqual({ Key: 'DataClassification', Value: 'PCI' });
      expect(tags).toContainEqual({ Key: 'ComplianceScope', Value: 'Payment' });
    });

    test('should have VPC flow logs IAM role', () => {
      expect(template.Resources.VPCFlowLogsRole).toBeDefined();
      expect(template.Resources.VPCFlowLogsRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have VPC flow log', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');
    });

    test('VPC flow log should capture all traffic', () => {
      expect(template.Resources.VPCFlowLog.Properties.TrafficType).toBe('ALL');
    });

    test('VPC flow log should log to CloudWatch', () => {
      expect(template.Resources.VPCFlowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
    });
  });

  describe('AWS Config', () => {
    test('should have Config IAM role', () => {
      expect(template.Resources.ConfigRole).toBeDefined();
      expect(template.Resources.ConfigRole.Type).toBe('AWS::IAM::Role');
    });

    test('Config role should have AWS_ConfigRole managed policy', () => {
      const managedPolicies = template.Resources.ConfigRole.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/service-role/AWS_ConfigRole');
    });

    test('should have encrypted volumes Config rule', () => {
      expect(template.Resources.EncryptedVolumesConfigRule).toBeDefined();
      expect(template.Resources.EncryptedVolumesConfigRule.Type).toBe('AWS::Config::ConfigRule');
    });

    test('encrypted volumes Config rule should have correct source', () => {
      const source = template.Resources.EncryptedVolumesConfigRule.Properties.Source;
      expect(source.Owner).toBe('AWS');
      expect(source.SourceIdentifier).toBe('ENCRYPTED_VOLUMES');
    });

    test('should have S3 SSL Config rule', () => {
      expect(template.Resources.S3BucketSSLRequestsOnlyConfigRule).toBeDefined();
      expect(template.Resources.S3BucketSSLRequestsOnlyConfigRule.Type).toBe('AWS::Config::ConfigRule');
    });

    test('S3 SSL Config rule should have correct source', () => {
      const source = template.Resources.S3BucketSSLRequestsOnlyConfigRule.Properties.Source;
      expect(source.Owner).toBe('AWS');
      expect(source.SourceIdentifier).toBe('S3_BUCKET_SSL_REQUESTS_ONLY');
    });

    test('should have IAM password policy Config rule', () => {
      expect(template.Resources.IAMPasswordPolicyConfigRule).toBeDefined();
      expect(template.Resources.IAMPasswordPolicyConfigRule.Type).toBe('AWS::Config::ConfigRule');
    });

    test('IAM password policy Config rule should have correct source', () => {
      const source = template.Resources.IAMPasswordPolicyConfigRule.Properties.Source;
      expect(source.Owner).toBe('AWS');
      expect(source.SourceIdentifier).toBe('IAM_PASSWORD_POLICY');
    });
  });

  describe('SNS Topic', () => {
    test('should have security alert topic', () => {
      expect(template.Resources.SecurityAlertTopic).toBeDefined();
      expect(template.Resources.SecurityAlertTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('security alert topic should be encrypted with KMS', () => {
      const kmsKeyId = template.Resources.SecurityAlertTopic.Properties.KmsMasterKeyId;
      expect(kmsKeyId).toBeDefined();
    });

    test('security alert topic should have PCI compliance tags', () => {
      const tags = template.Resources.SecurityAlertTopic.Properties.Tags;
      expect(tags).toContainEqual({ Key: 'DataClassification', Value: 'PCI' });
      expect(tags).toContainEqual({ Key: 'ComplianceScope', Value: 'Payment' });
    });
  });

  describe('SSM Parameters', () => {
    test('should have config parameter for data bucket', () => {
      expect(template.Resources.ConfigParameter).toBeDefined();
      expect(template.Resources.ConfigParameter.Type).toBe('AWS::SSM::Parameter');
    });

    test('config parameter should have correct type', () => {
      expect(template.Resources.ConfigParameter.Properties.Type).toBe('String');
    });

    test('config parameter should have PCI tags', () => {
      const tags = template.Resources.ConfigParameter.Properties.Tags;
      expect(tags.DataClassification).toBe('PCI');
      expect(tags.ComplianceScope).toBe('Payment');
    });

    test('should have config parameter for KMS key', () => {
      expect(template.Resources.KMSKeyParameter).toBeDefined();
      expect(template.Resources.KMSKeyParameter.Type).toBe('AWS::SSM::Parameter');
    });

    test('KMS key parameter should have correct type', () => {
      expect(template.Resources.KMSKeyParameter.Properties.Type).toBe('String');
    });
  });

  describe('Resource Count Validation', () => {
    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      // VPC(1) + Subnets(3) + RouteTable(1) + RouteTableAssocs(3) + VPCEndpoints(2) +
      // SecurityGroups(2) + SecurityGroupRules(2) + KMS(2) + S3Buckets(2) + S3BucketPolicies(2) +
      // Lambda(1) + IAMRoles(3) + VPCFlowLogs(3) + Config(4) + SNS(1) + SSM(2) = 32
      expect(resourceCount).toBe(32);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'PrivateSubnet3Id',
        'DataBucketName',
        'KMSKeyId',
        'KMSKeyArn',
        'DataValidationFunctionArn',
        'DataValidationFunctionName',
        'SecurityAlertTopicArn',
        'VPCFlowLogsLogGroup',
        'ConfigBucketName'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should have export', () => {
      const output = template.Outputs.VPCId;
      expect(output.Export).toBeDefined();
    });

    test('DataBucketName output should have correct value', () => {
      const output = template.Outputs.DataBucketName;
      expect(output.Value).toEqual({ Ref: 'DataBucket' });
    });

    test('KMSKeyArn output should use GetAtt', () => {
      const output = template.Outputs.KMSKeyArn;
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['KMSKey', 'Arn'] });
    });

    test('DataValidationFunctionArn output should use GetAtt', () => {
      const output = template.Outputs.DataValidationFunctionArn;
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['DataValidationFunction', 'Arn'] });
    });

    test('should have exactly 12 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(12);
    });
  });

  describe('PCI Compliance Tags', () => {
    test('all taggable resources should have PCI compliance tags', () => {
      const taggableResources = [
        'VPC',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PrivateSubnet3',
        'PrivateRouteTable',
        'LambdaSecurityGroup',
        'KMSEndpointSecurityGroup',
        'KMSKey',
        'DataBucket',
        'ConfigBucket',
        'DataValidationFunction',
        'VPCFlowLogsLogGroup',
        'VPCFlowLog',
        'SecurityAlertTopic',
        'LambdaExecutionRole',
        'VPCFlowLogsRole',
        'ConfigRole'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const hasPCITag = tags.some((t: any) => t.Key === 'DataClassification' && t.Value === 'PCI');
          const hasComplianceTag = tags.some((t: any) => t.Key === 'ComplianceScope' && t.Value === 'Payment');
          expect(hasPCITag).toBe(true);
          expect(hasComplianceTag).toBe(true);
        }
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow naming convention with environment suffix', () => {
      const resourcesWithNames = [
        'VPC',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PrivateSubnet3',
        'PrivateRouteTable',
        'LambdaSecurityGroup',
        'KMSEndpointSecurityGroup',
        'KMSKey',
        'DataBucket',
        'ConfigBucket',
        'DataValidationFunction',
        'VPCFlowLogsLogGroup',
        'SecurityAlertTopic'
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameTag = resource.Properties.Tags?.find((t: any) => t.Key === 'Name');
        if (nameTag) {
          expect(nameTag.Value).toHaveProperty('Fn::Sub');
          expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });

  describe('Deletion Policies', () => {
    test('KMS key should have Retain deletion policy', () => {
      expect(template.Resources.KMSKey.DeletionPolicy).toBe('Retain');
    });

    test('data bucket should have Retain deletion policy', () => {
      expect(template.Resources.DataBucket.DeletionPolicy).toBe('Retain');
    });

    test('other resources should not have Retain deletion policy', () => {
      const retainResources = ['KMSKey', 'DataBucket'];
      Object.keys(template.Resources).forEach(resourceName => {
        if (!retainResources.includes(resourceName)) {
          expect(template.Resources[resourceName].DeletionPolicy).not.toBe('Retain');
        }
      });
    });
  });
});
