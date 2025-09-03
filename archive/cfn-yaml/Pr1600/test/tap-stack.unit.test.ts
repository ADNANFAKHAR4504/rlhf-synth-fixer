import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
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
      expect(template.Description).toContain('Production-grade AWS infrastructure');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParameters = [
        'VPCCIDRBlock',
        'PublicSubnet1CIDRBlock',
        'PublicSubnet2CIDRBlock',
        'SSHAllowedCIDR',
        'EnvironmentName',
        'S3BucketPrefix'
      ];

      expectedParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('VPCCIDRBlock parameter should have correct properties', () => {
      const param = template.Parameters.VPCCIDRBlock;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toBe('^10\\.0\\.0\\.0/16$');
    });

    test('EnvironmentName parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('Production');
      expect(param.AllowedValues).toEqual(['Production']);
    });

    test('SSHAllowedCIDR parameter should have correct properties', () => {
      const param = template.Parameters.SSHAllowedCIDR;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('203.0.113.0/24');
      expect(param.AllowedPattern).toBe('^203\\.0\\.113\\.0/24$');
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VPCCIDRBlock' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });
  });

  describe('Subnet Resources', () => {
    test('should have two public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should have correct CIDR blocks', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      
      expect(subnet1.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet1CIDRBlock' });
      expect(subnet2.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet2CIDRBlock' });
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('public subnets should be in different availability zones', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      
      expect(subnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });
  });

  describe('NAT Gateway Resources', () => {
    test('should have NAT Gateway and Elastic IP', () => {
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGatewayEIP).toBeDefined();
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGatewayEIP.Type).toBe('AWS::EC2::EIP');
    });

    test('NAT Gateway should be in public subnet', () => {
      const natGw = template.Resources.NATGateway;
      expect(natGw.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });
  });

  describe('S3 Resources', () => {
    test('should have S3 logging bucket', () => {
      expect(template.Resources.LoggingBucket).toBeDefined();
      expect(template.Resources.LoggingBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.LoggingBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.LoggingBucket;
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.LoggingBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should have S3 bucket policy for secure transport', () => {
      expect(template.Resources.LoggingBucketPolicy).toBeDefined();
      expect(template.Resources.LoggingBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 logging role', () => {
      expect(template.Resources.EC2LoggingRole).toBeDefined();
      expect(template.Resources.EC2LoggingRole.Type).toBe('AWS::IAM::Role');
    });

    test('EC2 role should have correct assume role policy', () => {
      const role = template.Resources.EC2LoggingRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    });

    test('EC2 role should have S3 logging policy', () => {
      const role = template.Resources.EC2LoggingRole;
      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('S3LoggingPolicy');
    });

    test('should have instance profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('Security Group Resources', () => {
    test('should have SSH security group', () => {
      expect(template.Resources.SSHSecurityGroup).toBeDefined();
      expect(template.Resources.SSHSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('SSH security group should allow access from specified CIDR', () => {
      const sg = template.Resources.SSHSecurityGroup;
      const ingressRule = sg.Properties.SecurityGroupIngress[0];
      expect(ingressRule.FromPort).toBe(22);
      expect(ingressRule.ToPort).toBe(22);
      expect(ingressRule.CidrIp).toEqual({ Ref: 'SSHAllowedCIDR' });
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have VPC flow log resources', () => {
      expect(template.Resources.VPCFlowLogRole).toBeDefined();
      expect(template.Resources.VPCFlowLogGroup).toBeDefined();
      expect(template.Resources.VPCFlowLog).toBeDefined();
    });

    test('VPC flow logs should be configured correctly', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLog.Properties.ResourceType).toBe('VPC');
      expect(flowLog.Properties.TrafficType).toBe('ALL');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'S3BucketName',
        'NATGatewayId',
        'InternetGatewayId',
        'EC2LoggingRoleArn',
        'SSHSecurityGroupId',
        'StackName',
        'Region'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('S3BucketName output should be correct', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBe('S3 Logging Bucket Name');
      expect(output.Value).toEqual({ Ref: 'LoggingBucket' });
    });

    test('subnet outputs should be correct', () => {
      const subnet1Output = template.Outputs.PublicSubnet1Id;
      const subnet2Output = template.Outputs.PublicSubnet2Id;
      
      expect(subnet1Output.Description).toBe('Public Subnet 1 ID');
      expect(subnet1Output.Value).toEqual({ Ref: 'PublicSubnet1' });
      expect(subnet2Output.Description).toBe('Public Subnet 2 ID');
      expect(subnet2Output.Value).toEqual({ Ref: 'PublicSubnet2' });
    });
  });

  describe('Resource Tagging', () => {
    test('VPC should have Environment tag', () => {
      const vpc = template.Resources.VPC;
      const environmentTag = vpc.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
      expect(environmentTag).toBeDefined();
      expect(environmentTag.Value).toEqual({ Ref: 'EnvironmentName' });
    });

    test('subnets should have Environment tag', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      
      [subnet1, subnet2].forEach(subnet => {
        const environmentTag = subnet.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
        expect(environmentTag).toBeDefined();
        expect(environmentTag.Value).toEqual({ Ref: 'EnvironmentName' });
      });
    });

    test('S3 bucket should have Environment tag', () => {
      const bucket = template.Resources.LoggingBucket;
      const environmentTag = bucket.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
      expect(environmentTag).toBeDefined();
      expect(environmentTag.Value).toEqual({ Ref: 'EnvironmentName' });
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

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10); // We have many resources for infrastructure
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(6);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(10);
    });
  });

  describe('Security Best Practices', () => {
    test('IAM role should follow least privilege principle', () => {
      const role = template.Resources.EC2LoggingRole;
      const policy = role.Properties.Policies[0];
      const statements = policy.PolicyDocument.Statement;
      
      // Should only allow S3 actions for logging
      const s3Statement = statements.find((stmt: any) => stmt.Sid === 'WriteLogsToS3');
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Action).toEqual(['s3:PutObject', 's3:PutObjectAcl', 's3:GetObjectVersion']);
    });

    test('security group should restrict SSH access', () => {
      const sg = template.Resources.SSHSecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;
      
      // Should only allow SSH from specified CIDR
      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0].FromPort).toBe(22);
      expect(ingressRules[0].CidrIp).toEqual({ Ref: 'SSHAllowedCIDR' });
    });

    test('S3 bucket should enforce HTTPS', () => {
      const bucketPolicy = template.Resources.LoggingBucketPolicy;
      const policyDoc = bucketPolicy.Properties.PolicyDocument;
      const statement = policyDoc.Statement[0];
      
      expect(statement.Condition.Bool['aws:SecureTransport']).toBe('false');
      expect(statement.Effect).toBe('Deny');
    });
  });
});