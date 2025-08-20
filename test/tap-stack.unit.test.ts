// test/tap-stack.vpc-ec2.unit.test.ts
import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template (VPC + EC2)', () => {
  let template: any;

  beforeAll(() => {
    // Ensure you've generated lib/TapStack.json from YAML before running:
    // pipenv run cfn-flip-to-json > lib/TapStack.json
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('has valid format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('has expected description', () => {
      expect(template.Description).toBe(
        'Test environment with VPC, EC2, and monitoring - following AWS best practices',
      );
    });

    test('has metadata with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      const iface = template.Metadata['AWS::CloudFormation::Interface'];
      expect(iface).toBeDefined();
      expect(Array.isArray(iface.ParameterGroups)).toBe(true);
      // Spot-check a group contains parameters we expect
      const envGroup = iface.ParameterGroups.find((g: any) =>
        (g.Parameters || []).includes('EnvironmentName'),
      );
      expect(envGroup).toBeDefined();
    });
  });

  describe('Parameters & Conditions', () => {
    test('required parameters exist', () => {
      expect(template.Parameters.EnvironmentName).toBeDefined();
      expect(template.Parameters.KeyPairName).toBeDefined();
      expect(template.Parameters.LatestAmiId).toBeDefined();
      expect(template.Parameters.AllowedCidr).toBeDefined();
    });

    test('parameter properties are correct', () => {
      const env = template.Parameters.EnvironmentName;
      expect(env.Type).toBe('String');
      expect(env.Default).toBe('TestEnv');
      expect(env.AllowedPattern).toBe('^[a-zA-Z][a-zA-Z0-9-]*$');

      const key = template.Parameters.KeyPairName;
      expect(key.Type).toBe('String');
      expect(key.Default).toBe('');

      const ami = template.Parameters.LatestAmiId;
      expect(ami.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(ami.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');

      const cidr = template.Parameters.AllowedCidr;
      expect(cidr.Type).toBe('String');
      expect(cidr.Default).toBe('0.0.0.0/0');
    });

    test('conditions exist', () => {
      expect(template.Conditions.HasKeyPair).toBeDefined();
    });
  });

  describe('Core Resources exist', () => {
    const mustExist = [
      'VPC',
      'InternetGateway',
      'InternetGatewayAttachment',
      'PublicSubnet',
      'PrivateSubnet',
      'NatGatewayEIP',
      'NatGateway',
      'PublicRouteTable',
      'DefaultPublicRoute',
      'PublicSubnetRouteTableAssociation',
      'PrivateRouteTable',
      'DefaultPrivateRoute',
      'PrivateSubnetRouteTableAssociation',
      'WebSecurityGroup',
      'EC2Role',
      'EC2InstanceProfile',
      'EC2LogGroup',
      'WebServer',
    ];

    test.each(mustExist)('%s is defined', (resName) => {
      expect(template.Resources[resName]).toBeDefined();
    });
  });

  describe('Networking specifics', () => {
    test('VPC has correct CIDR and tags', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      const tags = vpc.Properties.Tags || [];
      const envTag = tags.find((t: any) => t.Key === 'Environment');
      const ownerTag = tags.find((t: any) => t.Key === 'Owner');
      expect(envTag?.Value).toBe('Test');
      expect(ownerTag?.Value).toBe('DevOpsTeam');
    });

    test('Public subnet CIDR correct and MapPublicIpOnLaunch true', () => {
      const sn = template.Resources.PublicSubnet;
      expect(sn.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(sn.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('Private subnet CIDR correct and MapPublicIpOnLaunch false', () => {
      const sn = template.Resources.PrivateSubnet;
      expect(sn.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(sn.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('Default public route goes to IGW', () => {
      const route = template.Resources.DefaultPublicRoute;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('Default private route goes to NAT', () => {
      const route = template.Resources.DefaultPrivateRoute;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway' });
    });
  });

  describe('Security Group', () => {
    test('Ingress rules use AllowedCidr and allow 80/22', () => {
      const sg = template.Resources.WebSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      const rule80 = ingress.find((r: any) => r.FromPort === 80 && r.ToPort === 80);
      const rule22 = ingress.find((r: any) => r.FromPort === 22 && r.ToPort === 22);
      expect(rule80.CidrIp).toEqual({ Ref: 'AllowedCidr' });
      expect(rule22.CidrIp).toEqual({ Ref: 'AllowedCidr' });
    });

    test('Egress allows all', () => {
      const sg = template.Resources.WebSecurityGroup;
      const egress = sg.Properties.SecurityGroupEgress?.[0];
      expect(egress.IpProtocol).toBe(-1);
      expect(egress.CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('IAM and EC2', () => {
    test('EC2 role has required managed policies', () => {
      const role = template.Resources.EC2Role;
      const arns = role.Properties.ManagedPolicyArns;
      expect(arns).toEqual(
        expect.arrayContaining([
          'arn:aws:iam::aws:policy/AmazonS3FullAccess',
          'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
          'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
        ]),
      );
    });

    test('Instance profile references EC2 role', () => {
      const ip = template.Resources.EC2InstanceProfile;
      expect(ip.Properties.Roles).toContainEqual({ Ref: 'EC2Role' });
    });

    test('EC2 instance configured correctly', () => {
      const ec2 = template.Resources.WebServer;
      expect(ec2.Type).toBe('AWS::EC2::Instance');
      expect(ec2.Properties.InstanceType).toBe('t2.micro');
      expect(ec2.Properties.ImageId).toEqual({ Ref: 'LatestAmiId' });
      expect(ec2.Properties.Monitoring).toBe(true);
      expect(ec2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet' });
      expect(ec2.Properties.SecurityGroupIds).toContainEqual({ Ref: 'WebSecurityGroup' });
      expect(ec2.Properties.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
      // UserData exists
      expect(ec2.Properties.UserData).toBeDefined();
      expect(ec2.Properties.UserData['Fn::Base64']).toBeDefined();
    });
  });

  describe('CloudWatch Logs', () => {
    test('Log group exists with retention 14 days and name uses Sub', () => {
      const lg = template.Resources.EC2LogGroup;
      expect(lg.Type).toBe('AWS::Logs::LogGroup');
      expect(lg.Properties.RetentionInDays).toBe(14);
      expect(lg.Properties.LogGroupName).toEqual({ 'Fn::Sub': '/aws/ec2/${EnvironmentName}' });
    });
  });

  describe('Outputs', () => {
    test('all expected outputs exist', () => {
      const expected = [
        'VPCId',
        'PublicSubnetId',
        'PrivateSubnetId',
        'WebServerInstanceId',
        'WebServerPublicIP',
        'WebServerPublicDNS',
        'WebURL',
        'SecurityGroupId',
        'NATGatewayId',
        'CloudWatchLogGroup',
      ];
      expected.forEach((k) => expect(template.Outputs[k]).toBeDefined());
    });

    test('selected outputs reference correct resources', () => {
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
      expect(template.Outputs.PublicSubnetId.Value).toEqual({ Ref: 'PublicSubnet' });
      expect(template.Outputs.PrivateSubnetId.Value).toEqual({ Ref: 'PrivateSubnet' });
      expect(template.Outputs.WebServerInstanceId.Value).toEqual({ Ref: 'WebServer' });
      expect(template.Outputs.WebServerPublicIP.Value).toEqual({ 'Fn::GetAtt': ['WebServer', 'PublicIp'] });
      expect(template.Outputs.WebServerPublicDNS.Value).toEqual({ 'Fn::GetAtt': ['WebServer', 'PublicDnsName'] });
      expect(template.Outputs.SecurityGroupId.Value).toEqual({ Ref: 'WebSecurityGroup' });
      expect(template.Outputs.NATGatewayId.Value).toEqual({ Ref: 'NatGateway' });
      expect(template.Outputs.CloudWatchLogGroup.Value).toEqual({ Ref: 'EC2LogGroup' });
    });
  });
});