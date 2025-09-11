import fs from 'fs';
import path from 'path';

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
      expect(template.Description).toContain('Secure cloud environment with EC2 instances');
    });

    test('should define Resources section', () => {
      expect(template.Resources).toBeDefined();
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    const expectedParameters = [
      'ProjectName',
      'Environment',
      'VpcCidr',
      'SubnetCidr',
      'AllowedSSHCidr',
      'InstanceType',
      'LatestAmiId'
    ];

    expectedParameters.forEach(paramName => {
      test(`should define parameter: ${paramName}`, () => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('ProjectName parameter should have correct properties', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('SecureApp');
      expect(param.AllowedPattern).toBe('^[a-zA-Z][a-zA-Z0-9]*$');
    });

    test('Environment parameter should have allowed values', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
      expect(param.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('VpcCidr parameter should have CIDR validation', () => {
      const param = template.Parameters.VpcCidr;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toBe('^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$');
    });
  });

  describe('Resources', () => {
    const resourceNames = [
      'SecureVPC',
      'InternetGateway',
      'InternetGatewayAttachment',
      'PublicSubnet',
      'PublicRouteTable',
      'DefaultPublicRoute',
      'PublicSubnetRouteTableAssociation',
      'EBSEncryptionKey',
      'EBSEncryptionKeyAlias',
      'EC2SecurityGroup',
      'EC2Role',
      'S3ReadOnlyPolicy',
      'CloudWatchPolicy',
      'EC2InstanceProfile',
      'SecureEC2Instance'
    ];

    resourceNames.forEach(name => {
      test(`should define ${name}`, () => {
        expect(template.Resources[name]).toBeDefined();
      });
    });

    test('SecureVPC should be a VPC resource with correct properties', () => {
      const vpc = template.Resources.SecureVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('PublicSubnet should map public IPs on launch', () => {
      const subnet = template.Resources.PublicSubnet;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('EC2SecurityGroup should have SSH ingress rule', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0].IpProtocol).toBe('tcp');
      expect(ingressRules[0].FromPort).toBe(22);
      expect(ingressRules[0].ToPort).toBe(22);
    });

    test('EC2SecurityGroup should have HTTPS egress rule only', () => {
      const sg = template.Resources.EC2SecurityGroup;
      const egressRules = sg.Properties.SecurityGroupEgress;
      expect(egressRules).toHaveLength(1);
      expect(egressRules[0].IpProtocol).toBe('tcp');
      expect(egressRules[0].FromPort).toBe(443);
      expect(egressRules[0].ToPort).toBe(443);
    });

    test('EBSEncryptionKey should be a KMS key', () => {
      const key = template.Resources.EBSEncryptionKey;
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.KeyPolicy).toBeDefined();
    });

    test('SecureEC2Instance should use encrypted EBS volume', () => {
      const instance = template.Resources.SecureEC2Instance;
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.Monitoring).toBe(true);
      const blockDevices = instance.Properties.BlockDeviceMappings;
      expect(blockDevices).toHaveLength(1);
      expect(blockDevices[0].Ebs.Encrypted).toBe(true);
    });

    test('EC2Role should have CloudWatch managed policy', () => {
      const role = template.Resources.EC2Role;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'VpcId',
      'SubnetId',
      'InstanceId',
      'SecurityGroupId',
      'IAMRoleArn',
      'KMSKeyId'
    ];

    expectedOutputs.forEach(outputName => {
      test(`should define output: ${outputName}`, () => {
        expect(template.Outputs[outputName]).toBeDefined();
      });

      test(`${outputName} output should export value`, () => {
        const output = template.Outputs[outputName];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputName}`,
        });
      });
    });
  });

  describe('Security and Compliance', () => {
    test('EC2 instance should have IAM instance profile', () => {
      const instance = template.Resources.SecureEC2Instance;
      expect(instance.Properties.IamInstanceProfile).toBeDefined();
    });

    test('EBS volume should be encrypted with KMS key', () => {
      const instance = template.Resources.SecureEC2Instance;
      const ebs = instance.Properties.BlockDeviceMappings[0].Ebs;
      expect(ebs.Encrypted).toBe(true);
      expect(ebs.KmsKeyId).toBeDefined();
    });

    test('Security group should restrict SSH access', () => {
      const sg = template.Resources.EC2SecurityGroup;
      const sshRule = sg.Properties.SecurityGroupIngress[0];
      expect(sshRule.CidrIp).toEqual({ Ref: 'AllowedSSHCidr' });
    });

    test('IAM policies should follow least privilege principle', () => {
      const s3Policy = template.Resources.S3ReadOnlyPolicy;
      expect(s3Policy.Type).toBe('AWS::IAM::Policy');
      const statements = s3Policy.Properties.PolicyDocument.Statement;
      expect(statements.some((stmt: any) => stmt.Effect === 'Allow' && stmt.Action.includes('s3:GetObject'))).toBe(true);
    });
  });

  describe('Naming Convention Checks', () => {
    test('resources should use parameter-based naming', () => {
      const vpc = template.Resources.SecureVPC;
      const nameTag = vpc.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value).toEqual({
        'Fn::Sub': '${ProjectName}-VPC-${Environment}'
      });
    });

    test('outputs should use Fn::Sub with StackName in Export', () => {
      for (const key in template.Outputs) {
        const exportName = template.Outputs[key].Export?.Name;
        expect(exportName).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${key}`,
        });
      }
    });
  });
});
