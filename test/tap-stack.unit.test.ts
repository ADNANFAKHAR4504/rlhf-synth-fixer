import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

interface CloudFormationTemplate {
  AWSTemplateFormatVersion: string;
  Description: string;
  Metadata?: Record<string, unknown>;
  Parameters: {
    [key: string]: {
      Type: string;
      Description?: string;
      AllowedPattern?: string;
      ConstraintDescription?: string;
      Default?: string;
    };
  };
  Resources: {
    [key: string]: {
      Type: string;
      Properties: {
        [key: string]: unknown;
        Tags?: Array<{ Key: string; Value: string }>;
      };
    };
  };
  Outputs: {
    [key: string]: {
      Description: string;
      Value: unknown;
    };
  };
}

describe('Secure Web Environment CloudFormation Template', () => {
  let template: CloudFormationTemplate;

  beforeAll(() => {
    const templatePath: string = path.join(__dirname, '../lib/cloudformation-template.yml');
    const templateContent: string = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent) as CloudFormationTemplate;
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('secure web environment using the default VPC with default parameters');
    });

    test('should not have a metadata section', () => {
      expect(template.Metadata).toBeUndefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = ['AllowedIPAddress', 'ExistingVPCId'];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('AllowedIPAddress parameter should have correct properties', () => {
      const param = template.Parameters.AllowedIPAddress;
      expect(param.Type).toBe('String');
      expect(param.Description).toBe('IP address allowed for SSH access');
      expect(param.AllowedPattern).toBe('^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/32$');
      expect(param.ConstraintDescription).toBe('Must be a valid CIDR IP address');
      expect(param.Default).toBe('203.0.113.10/32');
    });

    test('ExistingVPCId parameter should have correct properties', () => {
      const param = template.Parameters.ExistingVPCId;
      expect(param.Type).toBe('String');
      expect(param.Description).toBe('ID of the existing default VPC (e.g., vpc-xxxxxxxx)');
      expect(param.Default).toBe('vpc-0b094aa4091786d92'); // Verify the specific default VPC ID
    });
  });

  describe('Resources', () => {
    test('should have all required resources', () => {
      const expectedResources = [
        'PublicSubnet',
        'InstanceSecurityGroup',
        'EC2Role',
        'EC2InstanceProfile',
        'ConfigParameter',
        'ElasticIP',
        'EC2Instance',
        'EIPAssociation',
      ];
      expectedResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should not have removed resources', () => {
      const removedResources = ['VPC', 'InternetGateway', 'VPCGatewayAttachment', 'RouteTable', 'Route', 'SubnetRouteTableAssociation'];
      removedResources.forEach(resource => {
        expect(template.Resources[resource]).toBeUndefined();
      });
    });

    test('PublicSubnet should have correct properties', () => {
      const subnet = template.Resources.PublicSubnet;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'ExistingVPCId' });
      expect(subnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet.Properties.Tags).toContainEqual({ Key: 'Name', Value: 'SecureWebSubnet' });
    });

    test('InstanceSecurityGroup should have correct properties', () => {
      type SecurityGroupIngress = {
        IpProtocol: string;
        FromPort: number;
        ToPort: number;
        CidrIp: { Ref: string };
      };

      const sg = template.Resources.InstanceSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe('Security group for EC2 instance with restricted SSH access');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'ExistingVPCId' });
      expect(Array.isArray(sg.Properties.SecurityGroupIngress)).toBeTruthy();
      expect((sg.Properties.SecurityGroupIngress as SecurityGroupIngress[]).length).toBe(1);
      const securityGroupIngress = sg.Properties.SecurityGroupIngress as SecurityGroupIngress[];
      expect(securityGroupIngress[0]).toEqual({
        IpProtocol: 'tcp',
        FromPort: 22,
        ToPort: 22,
        CidrIp: { Ref: 'AllowedIPAddress' },
      });
      expect(sg.Properties.Tags).toContainEqual({ Key: 'Name', Value: 'SecureWebSG' });
    });

    test('EC2Role should have correct policies', () => {
      const role = template.Resources.EC2Role;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument).toEqual({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      });
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      expect(role.Properties.Policies).toHaveLength(1);
      const policies = role.Properties.Policies as Array<{
        PolicyName: string;
        PolicyDocument: {
          Statement: Array<{
            Action: string[] | string;
            Resource: string;
          }>;
        };
      }>;
      expect(policies[0].PolicyName).toBe('S3ReadOnlyPolicy');
      expect(policies[0].PolicyDocument.Statement[0].Action).toEqual(['s3:Get*', 's3:List*']);
      expect(policies[0].PolicyDocument.Statement[0].Resource).toBe('*');
      expect(role.Properties.Tags).toContainEqual({ Key: 'Name', Value: 'EC2S3ReadOnlyRole' });
    });

    test('EC2InstanceProfile should link to EC2Role', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toEqual([{ Ref: 'EC2Role' }]);
    });

    test('ConfigParameter should have correct properties', () => {
      const param = template.Resources.ConfigParameter;
      expect(param.Type).toBe('AWS::SSM::Parameter');
      expect(param.Properties.Name).toBe('/secure-web/config');
      expect(param.Properties.Type).toBe('String');
      expect(param.Properties.Value).toBe('example-config-value');
      expect(param.Properties.Description).toBe('Configuration value for EC2 instance');
    });

    test('ElasticIP should be correctly configured', () => {
      const eip = template.Resources.ElasticIP;
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
    });

    test('EC2Instance should have correct properties', () => {
      const instance = template.Resources.EC2Instance;
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.InstanceType).toBe('t2.micro');
      expect(instance.Properties.ImageId).toBe('ami-0c55b159cbfafe1f0');
      expect(instance.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet' });
      expect(instance.Properties.SecurityGroupIds).toEqual([{ Ref: 'InstanceSecurityGroup' }]);
      expect(instance.Properties.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
      const userData = instance.Properties.UserData as { [key: string]: any };
      expect(userData['Fn::Base64']['Fn::Sub']).toContain('aws ssm get-parameter --name "/secure-web/config"');
      expect(instance.Properties.Tags).toContainEqual({ Key: 'Name', Value: 'SecureWebInstance' });
    });

    test('EIPAssociation should link ElasticIP to EC2Instance', () => {
      const association = template.Resources.EIPAssociation;
      expect(association.Type).toBe('AWS::EC2::EIPAssociation');
      expect(association.Properties.InstanceId).toEqual({ Ref: 'EC2Instance' });
      expect(association.Properties.EIP).toEqual({ Ref: 'ElasticIP' });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = ['InstancePublicIP', 'VPCId', 'InstanceId'];
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('InstancePublicIP output should be correct', () => {
      const output = template.Outputs.InstancePublicIP;
      expect(output.Description).toBe('Public IP address of the EC2 instance');
      expect(output.Value).toEqual({ Ref: 'ElasticIP' });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('ID of the existing VPC used');
      expect(output.Value).toEqual({ Ref: 'ExistingVPCId' });
    });

    test('InstanceId output should be correct', () => {
      const output = template.Outputs.InstanceId;
      expect(output.Description).toBe('ID of the EC2 instance');
      expect(output.Value).toEqual({ Ref: 'EC2Instance' });
    });
  });

  describe('Template Validation', () => {
    test('should have valid YAML structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(8); // PublicSubnet, InstanceSecurityGroup, EC2Role, EC2InstanceProfile, ConfigParameter, ElasticIP, EC2Instance, EIPAssociation
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2); // AllowedIPAddress, ExistingVPCId
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(3); // InstancePublicIP, VPCId, InstanceId
    });
  });
});