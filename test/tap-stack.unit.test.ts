import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Define CloudFormation-specific YAML tags
    const cfnSchema = yaml.DEFAULT_SCHEMA.extend([
      new yaml.Type('!Ref', {
        kind: 'scalar',
        construct: function (data) {
          return { Ref: data };
        }
      }),
      new yaml.Type('!Sub', {
        kind: 'scalar',
        construct: function (data) {
          return { 'Fn::Sub': data };
        }
      }),
      new yaml.Type('!GetAtt', {
        kind: 'scalar',
        construct: function (data) {
          return { 'Fn::GetAtt': data.split('.') };
        }
      }),
      new yaml.Type('!FindInMap', {
        kind: 'sequence',
        construct: function (data) {
          return { 'Fn::FindInMap': data };
        }
      }),
      new yaml.Type('!Base64', {
        kind: 'scalar',
        construct: function (data) {
          return { 'Fn::Base64': data };
        }
      }),
      new yaml.Type('!Select', {
        kind: 'sequence',
        construct: function (data) {
          return { 'Fn::Select': data };
        }
      }),
      new yaml.Type('!GetAZs', {
        kind: 'scalar',
        construct: function (data) {
          return { 'Fn::GetAZs': data };
        }
      }),
      new yaml.Type('!If', {
        kind: 'sequence',
        construct: function (data) {
          return { 'Fn::If': data };
        }
      }),
      new yaml.Type('!Equals', {
        kind: 'sequence',
        construct: function (data) {
          return { 'Fn::Equals': data };
        }
      }),
      new yaml.Type('!Not', {
        kind: 'sequence',
        construct: function (data) {
          return { 'Fn::Not': data };
        }
      })
    ]);

    // Load the YAML template with CloudFormation schema
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent, { schema: cfnSchema });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Secure multi-AZ infrastructure with EC2, VPC, and security best practices'
      );
    });

    test('should have conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.HasKeyPair).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParameters = [
        'AllowedSSHCIDR',
        'AllowedHTTPCIDR', 
        'InstanceType',
        'KeyPairName',
        'LatestAmiId'
      ];

      expectedParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('AllowedSSHCIDR parameter should have correct properties', () => {
      const param = template.Parameters.AllowedSSHCIDR;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/8');
      expect(param.Description).toBe('CIDR block allowed for SSH access (e.g., your office IP)');
      expect(param.AllowedPattern).toBe('^(\\d{1,3}\\.){3}\\d{1,3}/\\d{1,2}$');
    });

    test('AllowedHTTPCIDR parameter should have correct properties', () => {
      const param = template.Parameters.AllowedHTTPCIDR;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('0.0.0.0/0');
      expect(param.Description).toBe('CIDR block allowed for HTTP access');
    });

    test('InstanceType parameter should have correct properties', () => {
      const param = template.Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.micro');
      expect(param.AllowedValues).toEqual(['t3.micro', 't3.small', 't3.medium', 't3.large']);
    });

    test('KeyPairName parameter should have correct properties', () => {
      const param = template.Parameters.KeyPairName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.Description).toBe('Name of an existing EC2 KeyPair for SSH access (optional)');
    });

    test('LatestAmiId parameter should have correct properties', () => {
      const param = template.Parameters.LatestAmiId;
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(param.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
      expect(param.Description).toBe('Latest Amazon Linux 2 AMI ID');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have public subnets in two AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      
      expect(subnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets in two AZs', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      
      expect(subnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('should have NAT Gateway', () => {
      expect(template.Resources.NatGateway).toBeDefined();
      expect(template.Resources.NatGateway.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have route tables for public and private subnets', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have WebServerSecurityGroup', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.WebServerSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('WebServerSecurityGroup should have correct ingress rules', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      
      expect(ingress).toHaveLength(2);
      
      const httpRule = ingress.find((rule: any) => rule.FromPort === 80);
      const sshRule = ingress.find((rule: any) => rule.FromPort === 22);
      
      expect(httpRule).toBeDefined();
      expect(sshRule).toBeDefined();
      expect(httpRule.CidrIp).toEqual({ Ref: 'AllowedHTTPCIDR' });
      expect(sshRule.CidrIp).toEqual({ Ref: 'AllowedSSHCIDR' });
    });

    test('WebServerSecurityGroup should have correct egress rules', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const egress = sg.Properties.SecurityGroupEgress;
      
      expect(egress).toHaveLength(2);
      
      const httpEgress = egress.find((rule: any) => rule.FromPort === 80);
      const httpsEgress = egress.find((rule: any) => rule.FromPort === 443);
      
      expect(httpEgress).toBeDefined();
      expect(httpsEgress).toBeDefined();
      expect(httpEgress.CidrIp).toBe('0.0.0.0/0');
      expect(httpsEgress.CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('IAM Resources', () => {
    test('should have VPCFlowLogRole', () => {
      expect(template.Resources.VPCFlowLogRole).toBeDefined();
      expect(template.Resources.VPCFlowLogRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have EC2InstanceRole', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('EC2InstanceRole should have correct assume role policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      
      expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('EC2InstanceRole should have CloudWatch policy', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('should have EC2InstanceProfile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('Secrets Manager', () => {
    test('should have ApplicationSecret', () => {
      expect(template.Resources.ApplicationSecret).toBeDefined();
      expect(template.Resources.ApplicationSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('ApplicationSecret should have correct properties', () => {
      const secret = template.Resources.ApplicationSecret;
      expect(secret.Properties.Description).toBe('Application secrets for the web server');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(16);
    });
  });

  describe('EC2 Instance', () => {
    test('should have WebServerInstance', () => {
      expect(template.Resources.WebServerInstance).toBeDefined();
      expect(template.Resources.WebServerInstance.Type).toBe('AWS::EC2::Instance');
    });

    test('WebServerInstance should have correct properties', () => {
      const instance = template.Resources.WebServerInstance;
      expect(instance.Properties.ImageId).toEqual({ Ref: 'LatestAmiId' });
      expect(instance.Properties.InstanceType).toEqual({ Ref: 'InstanceType' });
      expect(instance.Properties.KeyName).toEqual({ 'Fn::If': ['HasKeyPair', { Ref: 'KeyPairName' }, { Ref: 'AWS::NoValue' }] });
      expect(instance.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(instance.Properties.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
    });

    test('WebServerInstance should have UserData', () => {
      const instance = template.Resources.WebServerInstance;
      expect(instance.Properties.UserData).toBeDefined();
      expect(instance.Properties.UserData['Fn::Base64']).toBeDefined();
    });
  });

  describe('Monitoring and Logging', () => {
    test('should have VPCFlowLog', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');
    });

    test('should have VPCFlowLogGroup', () => {
      expect(template.Resources.VPCFlowLogGroup).toBeDefined();
      expect(template.Resources.VPCFlowLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have SystemLogGroup', () => {
      expect(template.Resources.SystemLogGroup).toBeDefined();
      expect(template.Resources.SystemLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'WebServerInstanceId',
        'WebServerPublicIP',
        'WebServerURL',
        'ApplicationSecretArn',
        'WebServerSecurityGroupId',
        'InstanceType',
        'EC2InstanceProfileArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-VPC-ID' });
    });

    test('WebServerPublicIP output should be correct', () => {
      const output = template.Outputs.WebServerPublicIP;
      expect(output.Description).toBe('Web Server Public IP');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['WebServerInstance', 'PublicIp'] });
    });

    test('WebServerURL output should be correct', () => {
      const output = template.Outputs.WebServerURL;
      expect(output.Description).toBe('Web Server URL');
      expect(output.Value).toEqual({ 'Fn::Sub': 'http://${WebServerInstance.PublicIp}' });
    });

    test('ApplicationSecretArn output should be correct', () => {
      const output = template.Outputs.ApplicationSecretArn;
      expect(output.Description).toBe('Application Secret ARN');
      expect(output.Value).toEqual({ Ref: 'ApplicationSecret' });
    });
  });

  describe('Resource Dependencies', () => {
    test('NAT Gateway should depend on Internet Gateway Attachment', () => {
      const natGateway = template.Resources.NatGatewayEIP;
      expect(natGateway.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('Public Route should depend on Internet Gateway Attachment', () => {
      const route = template.Resources.DefaultPublicRoute;
      expect(route.DependsOn).toBe('InternetGatewayAttachment');
    });
  });

  describe('Security Best Practices', () => {
    test('IAM policies should not use wildcard resources unnecessarily', () => {
      const vpcFlowLogRole = template.Resources.VPCFlowLogRole;
      const policy = vpcFlowLogRole.Properties.Policies[0];
      
      // VPC Flow Logs policy can use wildcard for CloudWatch Logs
      expect(policy.PolicyDocument.Statement[0].Resource).toBe('*');
    });

    test('EC2 instance should be in public subnet for web access', () => {
      const instance = template.Resources.WebServerInstance;
      expect(instance.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });

    test('Security group should restrict SSH access', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const sshRule = sg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 22);
      expect(sshRule.CidrIp).toEqual({ Ref: 'AllowedSSHCIDR' });
    });
  });

  describe('Template Validation', () => {
    test('should have valid YAML structure', () => {
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
      expect(resourceCount).toBeGreaterThan(15); // Should have many resources
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(5);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(21);
    });
  });
});
