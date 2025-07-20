// This is a unit test suite for the Web Server CloudFormation JSON template.
// It validates the structure, parameters, resources, and outputs of the template.
// It uses Jest for testing. Ensure you have Jest installed (`npm install jest`).

import fs from 'fs';
import path from 'path';

describe('Web Server CloudFormation Template Tests', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON version of the CloudFormation template.
    // Ensure the path is correct for your project structure.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have a valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a correct description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain(
        'CloudFormation template for a secure production web server infrastructure.'
      );
    });
  });

  describe('Parameters', () => {
    test('should have LatestAmiId parameter with correct properties', () => {
      const param = template.Parameters.LatestAmiId;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(param.Default).toBe(
        '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
      );
    });
  });

  describe('Resources', () => {
    test('should define exactly four resources', () => {
      expect(Object.keys(template.Resources).length).toBe(4);
    });

    test('should have a correctly configured IAM Role (WebServerInstanceRole)', () => {
      const role = template.Resources.WebServerInstanceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      const policy = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(policy.Effect).toBe('Allow');
      expect(policy.Principal.Service).toContain('ec2.amazonaws.com');
      expect(policy.Action).toContain('sts:AssumeRole');
      expect(role.Properties.Tags).toEqual(
        expect.arrayContaining([
          { Key: 'Environment', Value: 'Production' },
          { Key: 'Project', Value: 'GlobalResilience' },
        ])
      );
    });

    test('should have a correctly configured IAM Instance Profile (WebServerInstanceProfile)', () => {
      const profile = template.Resources.WebServerInstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toEqual([{ Ref: 'WebServerInstanceRole' }]);
    });

    test('should have a correctly configured Security Group (WebServerSecurityGroup)', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe(
        'Allow inbound HTTP and HTTPS from the office IP range'
      );
      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(2);
      expect(ingressRules).toEqual(
        expect.arrayContaining([
          {
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '203.0.113.0/24',
          },
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '203.0.113.0/24',
          },
        ])
      );
    });

    test('should have a correctly configured EC2 Instance (WebServerInstance)', () => {
      const instance = template.Resources.WebServerInstance;
      expect(instance.Type).toBe('AWS::EC2::Instance');
      const props = instance.Properties;
      expect(props.InstanceType).toBe('t2.micro');
      expect(props.ImageId).toEqual({ Ref: 'LatestAmiId' });
      expect(props.IamInstanceProfile).toEqual({ Ref: 'WebServerInstanceProfile' });
      expect(props.SecurityGroupIds).toEqual([
        { 'Fn::GetAtt': ['WebServerSecurityGroup', 'GroupId'] },
      ]);
      expect(props.UserData).toBeDefined();
      expect(props.Tags).toEqual(
        expect.arrayContaining([
          { Key: 'Name', Value: 'Production-WebServer' },
          { Key: 'Environment', Value: 'Production' },
          { Key: 'Project', Value: 'GlobalResilience' },
        ])
      );
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = ['InstanceId', 'InstancePublicIp', 'SecurityGroupId'];
      expectedOutputs.forEach((outputName) => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
      expect(Object.keys(template.Outputs).length).toBe(3);
    });

    test('InstanceId output should be correct', () => {
      const output = template.Outputs.InstanceId;
      expect(output.Description).toBe('The Instance ID of the web server.');
      expect(output.Value).toEqual({ Ref: 'WebServerInstance' });
    });

    test('InstancePublicIp output should be correct', () => {
      const output = template.Outputs.InstancePublicIp;
      expect(output.Description).toBe('The Public IP address of the web server.');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['WebServerInstance', 'PublicIp'],
      });
    });

    test('SecurityGroupId output should be correct', () => {
      const output = template.Outputs.SecurityGroupId;
      expect(output.Description).toBe("The ID of the web server's security group.");
      expect(output.Value).toEqual({ Ref: 'WebServerSecurityGroup' });
    });
  });
});
