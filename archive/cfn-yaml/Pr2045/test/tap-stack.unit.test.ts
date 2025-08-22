import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

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
      expect(template.Description).toBe(
        'Cloud Environment Setup - VPC with EC2 instance and Apache HTTP server'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('should have ProjectName parameter', () => {
      expect(template.Parameters.ProjectName).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });

    test('ProjectName parameter should have correct properties', () => {
      const projectParam = template.Parameters.ProjectName;
      expect(projectParam.Type).toBe('String');
      expect(projectParam.Default).toBe('cloud-env');
      expect(projectParam.Description).toBe(
        'Project name for resource naming convention'
      );
      expect(projectParam.AllowedPattern).toBe('^[a-zA-Z0-9-]+$');
      expect(projectParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters and hyphens'
      );
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have Internet Gateway Attachment', () => {
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });
  });

  describe('Subnet Resources', () => {
    test('should have PublicSubnet1', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
    });

    test('PublicSubnet1 should have correct properties', () => {
      const subnet = template.Resources.PublicSubnet1;
      expect(subnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should have PublicSubnet2', () => {
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('PublicSubnet2 should have correct properties', () => {
      const subnet = template.Resources.PublicSubnet2;
      expect(subnet.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });
  });

  describe('Route Table Resources', () => {
    test('should have PublicRouteTable', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have DefaultPublicRoute', () => {
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      expect(template.Resources.DefaultPublicRoute.Type).toBe('AWS::EC2::Route');
    });

    test('DefaultPublicRoute should route to Internet Gateway', () => {
      const route = template.Resources.DefaultPublicRoute;
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(route.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('should have subnet route table associations', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet1RouteTableAssociation.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    });
  });

  describe('Security Group Resources', () => {
    test('should have WebServerSecurityGroup', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.WebServerSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('WebServerSecurityGroup should have correct ingress rules', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      
      expect(ingress).toHaveLength(2);
      
      // HTTP rule
      const httpRule = ingress.find((r: any) => r.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      
      // SSH rule
      const sshRule = ingress.find((r: any) => r.FromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule.IpProtocol).toBe('tcp');
      expect(sshRule.ToPort).toBe(22);
      expect(sshRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('WebServerSecurityGroup should allow all egress', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const egress = sg.Properties.SecurityGroupEgress;
      
      expect(egress).toHaveLength(1);
      expect(egress[0].IpProtocol).toBe(-1);
      expect(egress[0].CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2InstanceRole', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('EC2InstanceRole should have correct trust policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      
      expect(trustPolicy.Version).toBe('2012-10-17');
      expect(trustPolicy.Statement).toHaveLength(1);
      expect(trustPolicy.Statement[0].Effect).toBe('Allow');
      expect(trustPolicy.Statement[0].Principal.Service).toContain('ec2.amazonaws.com');
    });

    test('EC2InstanceRole should have EC2DescribeInstances policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const policies = role.Properties.Policies;
      
      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('EC2DescribeInstances');
      
      const policyDoc = policies[0].PolicyDocument;
      expect(policyDoc.Statement[0].Action).toContain('ec2:DescribeInstances');
      expect(policyDoc.Statement[0].Action).toContain('ec2:DescribeInstanceStatus');
    });

    test('should have EC2InstanceProfile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('EC2 Resources', () => {
    test('should have WebServerInstance', () => {
      expect(template.Resources.WebServerInstance).toBeDefined();
      expect(template.Resources.WebServerInstance.Type).toBe('AWS::EC2::Instance');
    });

    test('WebServerInstance should have correct properties', () => {
      const instance = template.Resources.WebServerInstance;
      
      expect(instance.Properties.InstanceType).toBe('t2.micro');
      expect(instance.Properties.KeyName).toBe('my-key');
      expect(instance.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(instance.Properties.SecurityGroupIds).toContainEqual({ Ref: 'WebServerSecurityGroup' });
      expect(instance.Properties.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
    });

    test('WebServerInstance should have UserData for Apache installation', () => {
      const instance = template.Resources.WebServerInstance;
      expect(instance.Properties.UserData).toBeDefined();
      expect(instance.Properties.UserData['Fn::Base64']).toBeDefined();
      
      const userData = instance.Properties.UserData['Fn::Base64']['Fn::Sub'];
      expect(userData).toContain('yum install -y httpd');
      expect(userData).toContain('systemctl start httpd');
      expect(userData).toContain('systemctl enable httpd');
    });

    test('should have WebServerElasticIP', () => {
      expect(template.Resources.WebServerElasticIP).toBeDefined();
      expect(template.Resources.WebServerElasticIP.Type).toBe('AWS::EC2::EIP');
    });

    test('WebServerElasticIP should have correct properties', () => {
      const eip = template.Resources.WebServerElasticIP;
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('should have WebServerEIPAssociation', () => {
      expect(template.Resources.WebServerEIPAssociation).toBeDefined();
      expect(template.Resources.WebServerEIPAssociation.Type).toBe('AWS::EC2::EIPAssociation');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'WebServerInstanceId',
        'WebServerPublicIP',
        'WebServerURL',
        'SecurityGroupId',
        'InternetGatewayId',
        'PublicRouteTableId'
      ];

      requiredOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('ID of the VPC');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPCId',
      });
    });

    test('WebServerURL output should be correct', () => {
      const output = template.Outputs.WebServerURL;
      expect(output.Description).toBe('URL of the web server');
      expect(output.Value).toEqual({
        'Fn::Sub': 'http://${WebServerElasticIP}',
      });
    });

    test('outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('VPC name should follow naming convention', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags[0].Key).toBe('Name');
      expect(vpc.Properties.Tags[0].Value).toEqual({
        'Fn::Sub': 'vpc-${ProjectName}-${EnvironmentSuffix}'
      });
    });

    test('Security Group should have proper tags for naming convention', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const nameTag = sg.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toEqual({
        'Fn::Sub': 'sg-webserver-${ProjectName}-${EnvironmentSuffix}'
      });
    });

    test('IAM Role name should follow naming convention', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'role-ec2-${ProjectName}-${EnvironmentSuffix}'
      });
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
      const expectedResources = [
        'VPC',
        'InternetGateway',
        'InternetGatewayAttachment',
        'PublicSubnet1',
        'PublicSubnet2',
        'PublicRouteTable',
        'DefaultPublicRoute',
        'PublicSubnet1RouteTableAssociation',
        'PublicSubnet2RouteTableAssociation',
        'WebServerSecurityGroup',
        'EC2InstanceRole',
        'EC2InstanceProfile',
        'WebServerElasticIP',
        'WebServerInstance',
        'WebServerEIPAssociation'
      ];
      
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(expectedResources.length);
      
      expectedResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    test('should have exactly two parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });

    test('should have exactly nine outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(9);
    });
  });

  describe('Network Configuration', () => {
    test('VPC CIDR should be 10.0.0.0/16 as required', () => {
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('Subnet CIDRs should be correct', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('Subnets should be in different availability zones', () => {
      const subnet1AZ = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const subnet2AZ = template.Resources.PublicSubnet2.Properties.AvailabilityZone;
      
      expect(subnet1AZ['Fn::Select'][0]).toBe(0);
      expect(subnet2AZ['Fn::Select'][0]).toBe(1);
    });

    test('Route table should route external traffic to Internet Gateway', () => {
      const route = template.Resources.DefaultPublicRoute;
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });
  });

  describe('Security Configuration', () => {
    test('Security group should allow HTTP on port 80', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const httpRule = sg.Properties.SecurityGroupIngress.find((r: any) => r.FromPort === 80);
      
      expect(httpRule).toBeDefined();
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('Security group should allow SSH on port 22', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const sshRule = sg.Properties.SecurityGroupIngress.find((r: any) => r.FromPort === 22);
      
      expect(sshRule).toBeDefined();
      expect(sshRule.IpProtocol).toBe('tcp');
      expect(sshRule.ToPort).toBe(22);
      expect(sshRule.CidrIp).toBe('0.0.0.0/0');
    });


    test('IAM role should allow EC2 to describe instances', () => {
      const role = template.Resources.EC2InstanceRole;
      const policy = role.Properties.Policies[0];
      
      expect(policy.PolicyDocument.Statement[0].Action).toContain('ec2:DescribeInstances');
      expect(policy.PolicyDocument.Statement[0].Effect).toBe('Allow');
    });
  });
});