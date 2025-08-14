import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON template converted from YAML
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('template should have correct format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('template should have proper description', () => {
      expect(template.Description).toContain('IaC - AWS Nova Model Breaking');
      expect(template.Description).toContain('Secure AWS Environment');
    });

    test('should have required parameters with correct defaults', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.ProjectName).toBeDefined();
      expect(template.Parameters.SSHCidrIp).toBeDefined();
      expect(template.Parameters.SSHCidrIp.Default).toBe('203.0.113.0/24');
    });
  });

  describe('Region Validation', () => {
    test('should have region validation condition', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.IsUSWest2).toBeDefined();
      expect(template.Conditions.IsUSWest2['Fn::Equals']).toEqual([
        { 'Ref': 'AWS::Region' },
        'us-west-2'
      ]);
    });

    test('should have region validation resource', () => {
      expect(template.Resources.RegionValidation).toBeDefined();
      expect(template.Resources.RegionValidation.Type).toBe('AWS::CloudFormation::WaitConditionHandle');
      expect(template.Resources.RegionValidation.Condition).toBe('IsUSWest2');
    });
  });

  describe('KMS Key Configuration', () => {
    test('S3EncryptionKey should be properly configured', () => {
      const key = template.Resources.S3EncryptionKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.Description).toContain('KMS Key for S3 bucket encryption');
    });

    test('KMS key should have proper policy with least privilege', () => {
      const key = template.Resources.S3EncryptionKey;
      const policy = key.Properties.KeyPolicy;
      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement).toHaveLength(2); // Admin, S3 Service (role permissions moved to IAM policies)
    });

    test('should have KMS key alias', () => {
      const alias = template.Resources.S3EncryptionKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.TargetKeyId).toEqual({ 'Ref': 'S3EncryptionKey' });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('MainS3Bucket should have proper security configuration', () => {
      const bucket = template.Resources.MainS3Bucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('MainS3Bucket should have encryption enabled', () => {
      const bucket = template.Resources.MainS3Bucket;
      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ 'Ref': 'S3EncryptionKey' });
    });

    test('MainS3Bucket should have access logging configured', () => {
      const bucket = template.Resources.MainS3Bucket;
      const logging = bucket.Properties.LoggingConfiguration;
      expect(logging).toBeDefined();
      expect(logging.DestinationBucketName).toEqual({ 'Ref': 'S3AccessLogsBucket' });
      expect(logging.LogFilePrefix).toBe('main-bucket-access-logs/');
    });

    test('S3AccessLogsBucket should be properly configured', () => {
      const logsBucket = template.Resources.S3AccessLogsBucket;
      expect(logsBucket).toBeDefined();
      expect(logsBucket.Type).toBe('AWS::S3::Bucket');
      
      const publicAccess = logsBucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Security Groups', () => {
    test('SSHSecurityGroup should allow only SSH on port 22', () => {
      const sg = template.Resources.SSHSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0].IpProtocol).toBe('tcp');
      expect(ingressRules[0].FromPort).toBe(22);
      expect(ingressRules[0].ToPort).toBe(22);
      // CIDR is a parameter reference, not a hardcoded value
      expect(ingressRules[0].CidrIp).toEqual({ 'Ref': 'SSHCidrIp' });
    });

    test('SSHSecurityGroup should have minimal egress rules', () => {
      const sg = template.Resources.SSHSecurityGroup;
      const egressRules = sg.Properties.SecurityGroupEgress;
      expect(egressRules).toHaveLength(2);
      
      // Check for HTTP and HTTPS outbound only
      const httpRule = egressRules.find((rule: any) => rule.FromPort === 80);
      const httpsRule = egressRules.find((rule: any) => rule.FromPort === 443);
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });
  });

  describe('IAM Roles - Least Privilege', () => {
    test('EC2InstanceRole should have minimal S3 permissions', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(2); // S3 policy and logs policy
      
      // Find S3 policy by checking PolicyName structure
      const s3Policy = policies.find((p: any) => {
        const policyName = p.PolicyName;
        return (typeof policyName === 'object' && policyName['Fn::Sub'] && policyName['Fn::Sub'].includes('s3-policy')) ||
               (typeof policyName === 'string' && policyName.includes('s3-policy'));
      });
      expect(s3Policy).toBeDefined();
      
      const s3Statements = s3Policy.PolicyDocument.Statement;
      expect(s3Statements).toHaveLength(3); // Object actions, List bucket, KMS
    });

    test('LambdaExecutionRole should have minimal permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const managedPolicies = role.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
      
      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(1); // Only S3 read policy
    });

    test('should have EC2 instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toEqual([{ 'Ref': 'EC2InstanceRole' }]);
    });
  });

  describe('VPC and Networking', () => {
    test('VPC should have proper CIDR and DNS settings', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('PublicSubnet should use dynamic AZ selection', () => {
      const subnet = template.Resources.PublicSubnet;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet.Properties.CidrBlock).toBe('10.0.1.0/24');
    });

    test('should have internet gateway and routing configured', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      expect(template.Resources.PublicSubnetRouteTableAssociation).toBeDefined();
    });
  });

  describe('CloudWatch Logs', () => {
    test('ApplicationLogGroup should be properly configured', () => {
      const logGroup = template.Resources.ApplicationLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('Template Outputs', () => {
    test('should have all required outputs', () => {
      const outputs = template.Outputs;
      expect(outputs).toBeDefined();
      
      const requiredOutputs = [
        'VPCId', 'PublicSubnetId', 'SSHSecurityGroupId', 
        'MainS3BucketName', 'MainS3BucketArn', 
        'EC2InstanceRoleArn', 'EC2InstanceProfileArn', 
        'LambdaExecutionRoleArn', 'KMSKeyId', 'KMSKeyArn'
      ];
      
      requiredOutputs.forEach(outputName => {
        expect(outputs[outputName]).toBeDefined();
        expect(outputs[outputName].Description).toBeDefined();
        expect(outputs[outputName].Value).toBeDefined();
        expect(outputs[outputName].Export).toBeDefined();
      });
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have proper tags', () => {
      const resourcesWithTags = [
        'S3EncryptionKey', 'S3AccessLogsBucket', 'MainS3Bucket',
        'VPC', 'InternetGateway', 'PublicSubnet', 'PublicRouteTable',
        'SSHSecurityGroup', 'EC2InstanceRole', 'LambdaExecutionRole',
        'ApplicationLogGroup'
      ];
      
      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        
        const tags = resource.Properties.Tags;
        const nameTag = tags.find((tag: any) => tag.Key === 'Name');
        const projectTag = tags.find((tag: any) => tag.Key === 'Project');
        const envTag = tags.find((tag: any) => tag.Key === 'Environment');
        
        expect(nameTag).toBeDefined();
        expect(projectTag).toBeDefined();
        expect(envTag).toBeDefined();
      });
    });
  });
});
