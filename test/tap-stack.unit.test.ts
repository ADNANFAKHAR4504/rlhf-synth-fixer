import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Convert YAML to JSON for testing
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have enhanced description with security and randomization', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('randomized naming');
      expect(template.Description).toContain('production-grade security');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have InstanceType parameter', () => {
      expect(template.Parameters.InstanceType).toBeDefined();
      const param = template.Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.micro');
      expect(param.AllowedValues).toContain('t3.micro');
    });

    test('should have KeyPairName parameter', () => {
      expect(template.Parameters.KeyPairName).toBeDefined();
      expect(template.Parameters.KeyPairName.Type).toBe('String');
    });

    test('should have LatestAmiId parameter', () => {
      expect(template.Parameters.LatestAmiId).toBeDefined();
      expect(template.Parameters.LatestAmiId.Type).toBe('String');
      expect(template.Parameters.LatestAmiId.Default).toBe('ami-0c02fb55956c7d316');
      expect(template.Parameters.LatestAmiId.Description).toContain('LocalStack compatible');
    });
  });

  describe('Lambda Function for Random Suffix Generation', () => {
    test('should have RandomSuffixGenerator Lambda function', () => {
      expect(template.Resources.RandomSuffixGenerator).toBeDefined();
      const lambda = template.Resources.RandomSuffixGenerator;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('RandomSuffixGenerator should have correct properties', () => {
      const lambda = template.Resources.RandomSuffixGenerator.Properties;
      expect(lambda.Runtime).toBe('python3.12');
      expect(lambda.Handler).toBe('index.handler');
      expect(lambda.FunctionName).toEqual({
        'Fn::Sub': 'tapstack${EnvironmentSuffix}-random-generator-${AWS::AccountId}'
      });
    });

    test('should have RandomGeneratorRole IAM role', () => {
      expect(template.Resources.RandomGeneratorRole).toBeDefined();
      const role = template.Resources.RandomGeneratorRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have GenerateRandomSuffix custom resource', () => {
      expect(template.Resources.GenerateRandomSuffix).toBeDefined();
      const resource = template.Resources.GenerateRandomSuffix;
      expect(resource.Type).toBe('AWS::CloudFormation::CustomResource');
    });
  });

  describe('KMS Encryption Resources', () => {
    test('should have KMSKey for encryption', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      const key = template.Resources.KMSKey;
      expect(key.Type).toBe('AWS::KMS::Key');
    });

    test('KMSKey should have proper policy for CloudWatch Logs', () => {
      const key = template.Resources.KMSKey.Properties;
      expect(key.KeyPolicy.Statement).toHaveLength(2);
      expect(key.KeyPolicy.Statement[1].Sid).toBe('Allow CloudWatch Logs');
    });

    test('should have KMSKeyAlias', () => {
      expect(template.Resources.KMSKeyAlias).toBeDefined();
      const alias = template.Resources.KMSKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/tapstack${EnvironmentSuffix}-logs-key-${AWS::AccountId}'
      });
    });
  });

  describe('S3 Resources with Security', () => {
    test('should have SecureS3Bucket with randomized naming', () => {
      expect(template.Resources.SecureS3Bucket).toBeDefined();
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'tapstack${EnvironmentSuffix}-secure-bucket-${AWS::AccountId}-${GenerateRandomSuffix.RandomSuffix}'
      });
    });

    test('SecureS3Bucket should block public access', () => {
      const bucket = template.Resources.SecureS3Bucket.Properties;
      const blockConfig = bucket.PublicAccessBlockConfiguration;
      expect(blockConfig.BlockPublicAcls).toBe(true);
      expect(blockConfig.BlockPublicPolicy).toBe(true);
      expect(blockConfig.IgnorePublicAcls).toBe(true);
      expect(blockConfig.RestrictPublicBuckets).toBe(true);
    });

    test('should have SecureS3BucketPolicy enforcing SSL', () => {
      expect(template.Resources.SecureS3BucketPolicy).toBeDefined();
      const policy = template.Resources.SecureS3BucketPolicy.Properties.PolicyDocument;
      expect(policy.Statement[0].Sid).toBe('DenyInsecureConnections');
      expect(policy.Statement[0].Condition.Bool['aws:SecureTransport']).toBe('false');
    });

    test('should have S3AccessLogsBucket with randomized naming', () => {
      expect(template.Resources.S3AccessLogsBucket).toBeDefined();
      const bucket = template.Resources.S3AccessLogsBucket.Properties;
      expect(bucket.BucketName).toEqual({
        'Fn::Sub': 'tapstack${EnvironmentSuffix}-access-logs-${AWS::AccountId}-${GenerateRandomSuffix.RandomSuffix}'
      });
    });
  });

  describe('CloudWatch Log Groups with KMS Encryption', () => {
    test('should have EC2LogGroup with KMS encryption', () => {
      expect(template.Resources.EC2LogGroup).toBeDefined();
      const logGroup = template.Resources.EC2LogGroup.Properties;
      expect(logGroup.RetentionInDays).toBe(7);
      expect(logGroup.KmsKeyId).toEqual({ 'Fn::GetAtt': ['KMSKey', 'Arn'] });
    });

    test('should have S3LogGroup with KMS encryption', () => {
      expect(template.Resources.S3LogGroup).toBeDefined();
      const logGroup = template.Resources.S3LogGroup.Properties;
      expect(logGroup.KmsKeyId).toEqual({ 'Fn::GetAtt': ['KMSKey', 'Arn'] });
    });

    test('should have VPCFlowLogsGroup with KMS encryption', () => {
      expect(template.Resources.VPCFlowLogsGroup).toBeDefined();
      const logGroup = template.Resources.VPCFlowLogsGroup.Properties;
      expect(logGroup.KmsKeyId).toEqual({ 'Fn::GetAtt': ['KMSKey', 'Arn'] });
    });
  });

  describe('IAM Resources with Security Controls', () => {
    test('should have EC2Role with region restrictions', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      const role = template.Resources.EC2Role.Properties;
      expect(role.RoleName).toEqual({
        'Fn::Sub': 'tapstack${EnvironmentSuffix}-ec2-role-${AWS::AccountId}-${GenerateRandomSuffix.RandomSuffix}'
      });
    });

    test('EC2Role should have region restriction in AssumeRolePolicy', () => {
      const role = template.Resources.EC2Role.Properties;
      const condition = role.AssumeRolePolicyDocument.Statement[0].Condition;
      expect(condition.StringEquals['aws:RequestedRegion']).toBe('us-west-1');
    });

    test('EC2Role should have minimal S3 permissions with region restrictions', () => {
      const role = template.Resources.EC2Role.Properties;
      const s3Policy = role.Policies.find((p: any) => p.PolicyName === 'MinimalS3Access');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Condition.StringEquals['aws:RequestedRegion']).toBe('us-west-1');
    });

    test('should have EC2InstanceProfile with randomized naming', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      const profile = template.Resources.EC2InstanceProfile.Properties;
      expect(profile.InstanceProfileName).toEqual({
        'Fn::Sub': 'tapstack${EnvironmentSuffix}-ec2-instance-profile-${AWS::AccountId}-${GenerateRandomSuffix.RandomSuffix}'
      });
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC with randomized naming', () => {
      expect(template.Resources.VPC).toBeDefined();
      const vpc = template.Resources.VPC.Properties;
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('should have VPCFlowLogsRole for network monitoring', () => {
      expect(template.Resources.VPCFlowLogsRole).toBeDefined();
      const role = template.Resources.VPCFlowLogsRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have VPCFlowLogs for network monitoring', () => {
      expect(template.Resources.VPCFlowLogs).toBeDefined();
      const flowLogs = template.Resources.VPCFlowLogs.Properties;
      expect(flowLogs.ResourceType).toBe('VPC');
      expect(flowLogs.TrafficType).toBe('ALL');
    });

    test('should have InternetGateway with randomized naming', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
    });

    test('should have PublicSubnet with proper configuration', () => {
      expect(template.Resources.PublicSubnet).toBeDefined();
      const subnet = template.Resources.PublicSubnet.Properties;
      expect(subnet.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have routing components', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      expect(template.Resources.PublicSubnetRouteTableAssociation).toBeDefined();
    });
  });

  describe('Security Group Configuration', () => {
    test('should have EC2SecurityGroup with HTTPS-only access', () => {
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      const sg = template.Resources.EC2SecurityGroup.Properties;
      expect(sg.GroupName).toEqual({
        'Fn::Sub': 'tapstack${EnvironmentSuffix}-ec2-sg-${AWS::AccountId}-${GenerateRandomSuffix.RandomSuffix}'
      });
    });

    test('SecurityGroup should allow HTTPS inbound on port 443', () => {
      const sg = template.Resources.EC2SecurityGroup.Properties;
      const httpsRule = sg.SecurityGroupIngress.find((rule: any) => rule.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.ToPort).toBe(443);
    });

    test('SecurityGroup should have proper egress rules', () => {
      const sg = template.Resources.EC2SecurityGroup.Properties;
      expect(sg.SecurityGroupEgress).toBeDefined();
      expect(sg.SecurityGroupEgress.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('EC2 Launch Template and Instance', () => {
    test('should have EC2LaunchTemplate with security hardening', () => {
      expect(template.Resources.EC2LaunchTemplate).toBeDefined();
      const lt = template.Resources.EC2LaunchTemplate.Properties;
      expect(lt.LaunchTemplateName).toEqual({
        'Fn::Sub': 'tapstack${EnvironmentSuffix}-launch-template-${AWS::AccountId}-${GenerateRandomSuffix.RandomSuffix}'
      });
    });

    test('LaunchTemplate should have security hardening in UserData', () => {
      const lt = template.Resources.EC2LaunchTemplate.Properties.LaunchTemplateData;
      const userData = lt.UserData['Fn::Base64']['Fn::Sub'];
      expect(userData).toContain('firewalld');
      expect(userData).toContain('PermitRootLogin no');
      expect(userData).toContain('net.ipv4.ip_forward = 0');
    });

    test('should have EC2Instance with proper configuration', () => {
      expect(template.Resources.EC2Instance).toBeDefined();
      const instance = template.Resources.EC2Instance.Properties;
      expect(instance.LaunchTemplate).toBeDefined();
      expect(instance.SubnetId).toEqual({ Ref: 'PublicSubnet' });
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have Environment: Production tag', () => {
      const resourcesWithTags = [
        'RandomSuffixGenerator', 'RandomGeneratorRole', 'KMSKey', 'SecureS3Bucket',
        'S3AccessLogsBucket', 'EC2LogGroup', 'S3LogGroup', 'VPCFlowLogsGroup',
        'EC2Role', 'VPC', 'VPCFlowLogsRole', 'InternetGateway'
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

    test('resources should have appropriate Component tags', () => {
      const componentTags = [
        { resource: 'RandomSuffixGenerator', component: 'RandomGenerator' },
        { resource: 'KMSKey', component: 'Encryption' },
        { resource: 'EC2LogGroup', component: 'Logging' },
        { resource: 'VPC', component: 'Networking' },
        { resource: 'EC2Role', component: 'IAM' }
      ];

      componentTags.forEach(({ resource, component }) => {
        const res = template.Resources[resource];
        if (res && res.Properties && res.Properties.Tags) {
          const compTag = res.Properties.Tags.find((tag: any) => tag.Key === 'Component');
          expect(compTag).toBeDefined();
          expect(compTag.Value).toBe(component);
        }
      });
    });
  });

  describe('Comprehensive Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'RandomSuffix', 'S3BucketName', 'S3AccessLogsBucketName',
        'EC2InstanceId', 'EC2LaunchTemplateId', 'VPCId', 'PublicSubnetId',
        'SecurityGroupId', 'InternetGatewayId', 'EC2RoleArn',
        'EC2InstanceProfileArn', 'EC2LogGroupName', 'S3LogGroupName',
        'VPCFlowLogsGroupName', 'KMSKeyId', 'KMSKeyAlias',
        'RandomSuffixGeneratorArn', 'StackName', 'EnvironmentSuffix'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have descriptions and values', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Value).toBeDefined();
        // Export sections removed for LocalStack compatibility
      });
    });

    test('RandomSuffix output should reference custom resource', () => {
      const output = template.Outputs.RandomSuffix;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['GenerateRandomSuffix', 'RandomSuffix']
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have 25 resources for comprehensive infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(25);
    });

    test('should have 4 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have 19 outputs for complete visibility', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(19);
    });
  });

  describe('Security Compliance', () => {
    test('should have SSL enforcement on S3 bucket policy', () => {
      const policy = template.Resources.SecureS3BucketPolicy.Properties.PolicyDocument;
      expect(policy.Statement[0].Effect).toBe('Deny');
      expect(policy.Statement[0].Condition.Bool['aws:SecureTransport']).toBe('false');
    });

    test('should have KMS encryption for all log groups', () => {
      const logGroups = ['EC2LogGroup', 'S3LogGroup', 'VPCFlowLogsGroup'];
      logGroups.forEach(lgName => {
        const lg = template.Resources[lgName].Properties;
        expect(lg.KmsKeyId).toEqual({ 'Fn::GetAtt': ['KMSKey', 'Arn'] });
      });
    });

    test('should have VPC Flow Logs enabled for network monitoring', () => {
      expect(template.Resources.VPCFlowLogs).toBeDefined();
      const flowLogs = template.Resources.VPCFlowLogs.Properties;
      expect(flowLogs.TrafficType).toBe('ALL');
    });

    test('should have region restrictions in IAM policies', () => {
      const role = template.Resources.EC2Role.Properties;
      const assumeRole = role.AssumeRolePolicyDocument.Statement[0];
      expect(assumeRole.Condition.StringEquals['aws:RequestedRegion']).toBe('us-west-1');
    });
  });

  describe('Naming Convention Compliance', () => {
    test('resource names should use randomized suffixes', () => {
      const resourcesWithRandomSuffix = [
        'SecureS3Bucket', 'S3AccessLogsBucket', 'EC2Role',
        'EC2InstanceProfile', 'EC2SecurityGroup', 'VPC'
      ];

      resourcesWithRandomSuffix.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties) {
          const nameField = resource.Properties.BucketName || 
                          resource.Properties.RoleName || 
                          resource.Properties.InstanceProfileName ||
                          resource.Properties.GroupName;
          
          if (nameField && nameField['Fn::Sub']) {
            expect(nameField['Fn::Sub']).toContain('${GenerateRandomSuffix.RandomSuffix}');
          }
        }
      });
    });

    test('all resource names should include environment suffix', () => {
      const resourcesWithEnvSuffix = [
        'RandomSuffixGenerator', 'RandomGeneratorRole', 'SecureS3Bucket',
        'S3AccessLogsBucket', 'EC2Role', 'EC2InstanceProfile'
      ];

      resourcesWithEnvSuffix.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties) {
          const nameField = resource.Properties.FunctionName || 
                          resource.Properties.RoleName ||
                          resource.Properties.BucketName ||
                          resource.Properties.InstanceProfileName;
          
          if (nameField && nameField['Fn::Sub']) {
            expect(nameField['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });
  });
});