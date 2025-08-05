import fs from 'fs';
import path from 'path';

describe('Secure Web Environment CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON template generated from YAML
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
    });

    test('should not have a metadata section', () => {
      expect(template.Metadata).toBeUndefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = ['AllowedSSHIPAddress', 'KeyPairName', 'AmiId'];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('AllowedSSHIPAddress parameter should have correct properties', () => {
      const param = template.Parameters.AllowedSSHIPAddress;
      expect(param.Type).toBe('String');
      expect(param.Description).toBe('The IP address allowed to SSH to the EC2 instance (e.g., 203.0.113.0/32)');
      expect(param.AllowedPattern).toBe('^(\\d{1,3}\\.){3}\\d{1,3}/\\d{1,2}$');
      expect(param.ConstraintDescription).toBe('Must be a valid IP CIDR range (e.g., 203.0.113.0/32)');
    });

    test('KeyPairName parameter should have correct properties', () => {
      const param = template.Parameters.KeyPairName;
      expect(param.Type).toBe('AWS::EC2::KeyPair::KeyName');
      expect(param.Description).toBe('The name of the key pair to use for SSH access');
      expect(param.ConstraintDescription).toBe('Must be the name of an existing EC2 KeyPair');
    });

    test('AmiId parameter should have correct properties', () => {
      const param = template.Parameters.AmiId;
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(param.Default).toBe('/aws/service/ami-amazon-latest/amzn2-ami-hvm-x86_64-gp2');
      expect(param.Description).toBe('Latest Amazon Linux 2 AMI ID');
    });
  });

  describe('Resources', () => {
    test('should have all required resources', () => {
      const expectedResources = [
        'VPC',
        'InternetGateway',
        'AttachGateway',
        'Subnet',
        'RouteTable',
        'Route',
        'SubnetRouteTableAssociation',
        'SecurityGroup',
        'EC2Role',
        'InstanceProfile',
        'SSMParameter',
        'EC2Instance',
        'ElasticIP'
      ];
      expectedResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('VPC should have correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('VPC should have correct tags', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      expect(tags).toContainEqual({ Key: 'Name', Value: 'MyVPC' });
      expect(tags).toContainEqual({ Key: 'batchName', Value: 'Batch 003 -Expert-CloudFormation-YAML' });
      expect(tags).toContainEqual({ Key: 'projectId', Value: '166' });
      expect(tags).toContainEqual({ Key: 'projectName', Value: 'IaC - AWS Nova Model Breaking' });
      expect(tags).toContainEqual({ Key: 'ProblemID', Value: 'Cloud_Environment_Setup_CloudFormation_YAML_9kfhjsre9e3f' });
    });

    test('InternetGateway should have correct properties', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(igw.Properties.Tags).toContainEqual({ Key: 'Name', Value: 'MyIGW' });
    });

    test('AttachGateway should connect VPC and InternetGateway', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('Subnet should have correct properties', () => {
      const subnet = template.Resources.Subnet;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(subnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet.Properties.Tags).toContainEqual({ Key: 'Name', Value: 'MySubnet' });
    });

    test('RouteTable and Route should be correctly configured', () => {
      const routeTable = template.Resources.RouteTable;
      const route = template.Resources.Route;
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'RouteTable' });
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('SubnetRouteTableAssociation should link correctly', () => {
      const association = template.Resources.SubnetRouteTableAssociation;
      expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(association.Properties.SubnetId).toEqual({ Ref: 'Subnet' });
      expect(association.Properties.RouteTableId).toEqual({ Ref: 'RouteTable' });
    });

    test('SecurityGroup should have correct properties', () => {
      const sg = template.Resources.SecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe('Allow SSH from specific IP');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(sg.Properties.SecurityGroupIngress[0]).toEqual({
        IpProtocol: 'tcp',
        FromPort: 22,
        ToPort: 22,
        CidrIp: { Ref: 'AllowedSSHIPAddress' }
      });
      expect(sg.Properties.Tags).toContainEqual({ Key: 'Name', Value: 'MySecurityGroup' });
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
            Action: 'sts:AssumeRole'
          }
        ]
      });
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess');
      expect(role.Properties.Policies).toHaveLength(1);
      expect(role.Properties.Policies[0].PolicyName).toBe('SSMGetParameter');
      expect(role.Properties.Policies[0].PolicyDocument.Statement[0].Action).toBe('ssm:GetParameter');
      expect(role.Properties.Policies[0].PolicyDocument.Statement[0].Resource).toEqual({
        'Fn::Sub': 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/MyConfig'
      });
    });

    test('InstanceProfile should link to EC2Role', () => {
      const profile = template.Resources.InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toEqual([{ Ref: 'EC2Role' }]);
    });

    test('SSMParameter should have correct properties', () => {
      const param = template.Resources.SSMParameter;
      expect(param.Type).toBe('AWS::SSM::Parameter');
      expect(param.Properties.Name).toBe('MyConfig');
      expect(param.Properties.Type).toBe('String');
      expect(param.Properties.Value).toBe('some_sensitive_value');
      expect(param.Properties.Description).toBe('Sensitive configuration value for EC2 initialization');
      expect(param.Properties.Tags).toContainEqual({ Key: 'Name', Value: 'MyConfigParameter' });
    });

    test('EC2Instance should have correct properties', () => {
      const instance = template.Resources.EC2Instance;
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.InstanceType).toBe('t3.micro');
      expect(instance.Properties.ImageId).toEqual({ Ref: 'AmiId' });
      expect(instance.Properties.KeyName).toEqual({ Ref: 'KeyPairName' });
      expect(instance.Properties.SubnetId).toEqual({ Ref: 'Subnet' });
      expect(instance.Properties.SecurityGroupIds).toEqual([{ Ref: 'SecurityGroup' }]);
      expect(instance.Properties.IamInstanceProfile).toEqual({ Ref: 'InstanceProfile' });
      expect(instance.Properties.Tags).toContainEqual({ Key: 'Name', Value: 'MyEC2Instance' });
    });

    test('EC2Instance user data should reference SSMParameter', () => {
      const instance = template.Resources.EC2Instance;
      expect(instance.Properties.UserData).toBeDefined();
      expect(instance.Properties.UserData['Fn::Base64']['Fn::Sub']).toContain('aws ssm get-parameter --name MyConfig');
    });

    test('ElasticIP should be correctly configured', () => {
      const eip = template.Resources.ElasticIP;
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.Properties.InstanceId).toEqual({ Ref: 'EC2Instance' });
      expect(eip.Properties.Tags).toContainEqual({ Key: 'Name', Value: 'MyElasticIP' });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = ['InstancePublicIP', 'InstanceId', 'VPCId'];
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('InstancePublicIP output should be correct', () => {
      const output = template.Outputs.InstancePublicIP;
      expect(output.Description).toBe('Public IP address of the EC2 instance');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['ElasticIP', 'PublicIp'] });
    });

    test('InstanceId output should be correct', () => {
      const output = template.Outputs.InstanceId;
      expect(output.Description).toBe('ID of the EC2 instance');
      expect(output.Value).toEqual({ Ref: 'EC2Instance' });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('ID of the VPC');
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
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
      expect(resourceCount).toBe(13); // VPC, IGW, attachment, subnet, route table, route, association, SG, role, profile, SSM param, EC2, EIP
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3); // AllowedSSHIPAddress, KeyPairName, AmiId
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(3); // InstancePublicIP, InstanceId, VPCId
    });
  });

  describe('Resource Tagging', () => {
    const expectedTags = [
      { Key: 'batchName', Value: 'Batch 003 -Expert-CloudFormation-YAML' },
      { Key: 'projectId', Value: '166' },
      { Key: 'projectName', Value: 'IaC - AWS Nova Model Breaking' },
      { Key: 'ProblemID', Value: 'Cloud_Environment_Setup_CloudFormation_YAML_9kfhjsre9e3f' }
    ];

    test('VPC should have required tags', () => {
      const tags = template.Resources.VPC.Properties.Tags;
      expectedTags.forEach(tag => expect(tags).toContainEqual(tag));
    });

    test('Subnet should have required tags', () => {
      const tags = template.Resources.Subnet.Properties.Tags;
      expectedTags.forEach(tag => expect(tags).toContainEqual(tag));
    });

    test('SecurityGroup should have required tags', () => {
      const tags = template.Resources.SecurityGroup.Properties.Tags;
      expectedTags.forEach(tag => expect(tags).toContainEqual(tag));
    });

    test('EC2Role should have required tags', () => {
      const tags = template.Resources.EC2Role.Properties.Tags;
      expectedTags.forEach(tag => expect(tags).toContainEqual(tag));
    });

    test('SSMParameter should have required tags', () => {
      const tags = template.Resources.SSMParameter.Properties.Tags;
      expectedTags.forEach(tag => expect(tags).toContainEqual(tag));
    });

    test('EC2Instance should have required tags', () => {
      const tags = template.Resources.EC2Instance.Properties.Tags;
      expectedTags.forEach(tag => expect(tags).toContainEqual(tag));
    });
  });
});