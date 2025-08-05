import fs from 'fs';
import path from 'path';

describe('Secure Web Environment CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json'); 
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have a valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have correct description', () => {
      expect(template.Description).toBe(
        'CloudFormation template for a secure web environment using the default VPC with default parameters'
      );
    });
  });

  describe('Parameters', () => {
    test('should define AllowedIPAddress parameter correctly', () => {
      const param = template.Parameters.AllowedIPAddress;
      expect(param.Type).toBe('String');
      expect(param.Description).toBe('IP address allowed for SSH access');
      expect(param.AllowedPattern).toBe('^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/32$');
      expect(param.ConstraintDescription).toBe('Must be a valid CIDR IP address');
      expect(param.Default).toBe('203.0.113.10/32');
    });

    test('should define ExistingVPCId parameter correctly', () => {
      const param = template.Parameters.ExistingVPCId;
      expect(param.Type).toBe('String');
      expect(param.Description).toBe('ID of the existing default VPC (e.g., vpc-xxxxxxxx)');
      expect(param.Default).toBe('vpc-0b094aa4091786d92');
    });
  });

  describe('Resources', () => {
    test('should define all expected resources', () => {
      const expectedResources = [
        'PublicSubnet',
        'InstanceSecurityGroup',
        'EC2Role',
        'EC2InstanceProfile',
        'ConfigParameter',
        'ElasticIP',
        'EC2Instance',
        'EIPAssociation'
      ];
      expectedResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('PublicSubnet should have correct configuration', () => {
      const subnet = template.Resources.PublicSubnet;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'ExistingVPCId' });
      expect(subnet.Properties.CidrBlock).toBe('172.31.64.0/20');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.Properties.Tags).toContainEqual({ Key: 'Name', Value: 'SecureWebSubnet' });
    });

    test('InstanceSecurityGroup should restrict SSH to AllowedIPAddress', () => {
      const sg = template.Resources.InstanceSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'ExistingVPCId' });
      expect(sg.Properties.SecurityGroupIngress).toContainEqual({
        IpProtocol: 'tcp',
        FromPort: 22,
        ToPort: 22,
        CidrIp: { Ref: 'AllowedIPAddress' }
      });
      expect(sg.Properties.Tags).toContainEqual({ Key: 'Name', Value: 'SecureWebSG' });
    });

    test('EC2Role should have correct IAM policies', () => {
      const role = template.Resources.EC2Role;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
      expect(role.Properties.Policies[0].PolicyName).toBe('S3ReadOnlyPolicy');
      expect(role.Properties.Policies[0].PolicyDocument.Statement[0].Action).toEqual([
        's3:Get*',
        's3:List*'
      ]);
    });

    test('EC2InstanceProfile should reference EC2Role', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Properties.Roles).toEqual([{ Ref: 'EC2Role' }]);
    });

    test('ConfigParameter should be in Parameter Store', () => {
      const param = template.Resources.ConfigParameter;
      expect(param.Type).toBe('AWS::SSM::Parameter');
      expect(param.Properties.Name).toBe('/secure-web/config');
      expect(param.Properties.Type).toBe('String');
      expect(param.Properties.Value).toBe('example-config-value');
    });

    test('ElasticIP should be set for VPC', () => {
      const eip = template.Resources.ElasticIP;
      expect(eip.Properties.Domain).toBe('vpc');
    });

    test('EC2Instance should have correct configuration', () => {
      const instance = template.Resources.EC2Instance;
      expect(instance.Properties.InstanceType).toBe('t2.micro');
      expect(instance.Properties.ImageId).toBe('ami-0e0d5cba8c90ba8c5');
      expect(instance.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet' });
      expect(instance.Properties.SecurityGroupIds).toEqual([{ Ref: 'InstanceSecurityGroup' }]);
      expect(instance.Properties.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
      expect(instance.Properties.Tags).toContainEqual({ Key: 'Name', Value: 'SecureWebInstance' });
    });

    test('EIPAssociation should link EIP to EC2Instance', () => {
      const assoc = template.Resources.EIPAssociation;
      expect(assoc.Properties.InstanceId).toEqual({ Ref: 'EC2Instance' });
      expect(assoc.Properties.EIP).toEqual({ Ref: 'ElasticIP' });
    });
  });

  describe('Outputs', () => {
    test('should define all expected outputs', () => {
      const expectedOutputs = ['InstancePublicIP', 'VPCId', 'InstanceId'];
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('InstancePublicIP should reference ElasticIP', () => {
      expect(template.Outputs.InstancePublicIP.Value).toEqual({ Ref: 'ElasticIP' });
    });

    test('VPCId should reference ExistingVPCId', () => {
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'ExistingVPCId' });
    });

    test('InstanceId should reference EC2Instance', () => {
      expect(template.Outputs.InstanceId.Value).toEqual({ Ref: 'EC2Instance' });
    });
  });
});
