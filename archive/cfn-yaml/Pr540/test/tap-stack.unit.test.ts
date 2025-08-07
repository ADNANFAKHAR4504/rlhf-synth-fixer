import * as fs from 'fs';
import * as path from 'path';

describe('Secure VPC Infrastructure CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have VpcCidrBlock parameter', () => {
      const param = template.Parameters.VpcCidrBlock;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('should have ApplicationPort parameter', () => {
      const param = template.Parameters.ApplicationPort;
      expect(param).toBeDefined();
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(80);
      expect(param.MinValue).toBe(1);
      expect(param.MaxValue).toBe(65535);
    });
  });

  describe('VPC Resources', () => {
    test('should have SecureVPC', () => {
      const vpc = template.Resources.SecureVPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.InstanceTenancy).toBe('default');
    });

    test('should have Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have Internet Gateway Attachment', () => {
      const attachment = template.Resources.InternetGatewayAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have NAT Gateway Elastic IP', () => {
      const eip = template.Resources.NATGatewayElasticIP;
      expect(eip).toBeDefined();
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('should have NAT Gateway', () => {
      const natGw = template.Resources.NATGateway;
      expect(natGw).toBeDefined();
      expect(natGw.Type).toBe('AWS::EC2::NatGateway');
    });
  });

  describe('Subnet Resources', () => {
    test('should have two public subnets', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;

      expect(publicSubnet1).toBeDefined();
      expect(publicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(
        publicSubnet1.Properties.AvailabilityZone['Fn::Select']
      ).toBeDefined();
      expect(publicSubnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(
        0
      );
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);

      expect(publicSubnet2).toBeDefined();
      expect(publicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(
        publicSubnet2.Properties.AvailabilityZone['Fn::Select']
      ).toBeDefined();
      expect(publicSubnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(
        1
      );
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should have two private subnets', () => {
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(privateSubnet1).toBeDefined();
      expect(privateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(
        privateSubnet1.Properties.AvailabilityZone['Fn::Select']
      ).toBeDefined();
      expect(privateSubnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(
        0
      );

      expect(privateSubnet2).toBeDefined();
      expect(privateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(
        privateSubnet2.Properties.AvailabilityZone['Fn::Select']
      ).toBeDefined();
      expect(privateSubnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(
        1
      );
    });

    test('should use CIDR function for subnet allocation', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(publicSubnet1.Properties.CidrBlock['Fn::Select']).toBeDefined();
      expect(publicSubnet2.Properties.CidrBlock['Fn::Select']).toBeDefined();
      expect(privateSubnet1.Properties.CidrBlock['Fn::Select']).toBeDefined();
      expect(privateSubnet2.Properties.CidrBlock['Fn::Select']).toBeDefined();
    });
  });

  describe('Route Tables and Routes', () => {
    test('should have public route table with internet gateway route', () => {
      const routeTable = template.Resources.PublicRouteTable;
      const route = template.Resources.PublicDefaultRoute;

      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');

      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('should have private route table with NAT gateway route', () => {
      const routeTable = template.Resources.PrivateRouteTable;
      const route = template.Resources.PrivateDefaultRoute;

      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');

      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('should have route table associations', () => {
      const associations = [
        'PublicSubnet1RouteTableAssociation',
        'PublicSubnet2RouteTableAssociation',
        'PrivateSubnet1RouteTableAssociation',
        'PrivateSubnet2RouteTableAssociation',
      ];

      associations.forEach(assocName => {
        const association = template.Resources[assocName];
        expect(association).toBeDefined();
        expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      });
    });
  });

  describe('Security Groups', () => {
    test('should have public security group with HTTPS only', () => {
      const sg = template.Resources.PublicSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules).toBeDefined();
      expect(ingressRules.length).toBe(1);

      const httpsRule = ingressRules[0];
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.FromPort).toBe(443);
      expect(httpsRule.ToPort).toBe(443);
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have private security group with restricted access', () => {
      const sg = template.Resources.PrivateSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules).toBeDefined();
      expect(ingressRules.length).toBe(1);

      const appRule = ingressRules[0];
      expect(appRule.IpProtocol).toBe('tcp');
      expect(appRule.SourceSecurityGroupId).toBeDefined();
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 least privilege role', () => {
      const role = template.Resources.EC2LeastPrivilegeRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');

      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe(
        'ec2.amazonaws.com'
      );
      expect(trustPolicy.Statement[0].Effect).toBe('Allow');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should have SSM policy with least privilege', () => {
      const policy = template.Resources.EC2SSMPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::IAM::Policy');

      const policyDoc = policy.Properties.PolicyDocument;
      expect(policyDoc.Statement).toBeDefined();
      expect(policyDoc.Statement.length).toBe(2);

      // Check SSM permissions
      const ssmStatement = policyDoc.Statement[0];
      expect(ssmStatement.Action).toContain('ssm:UpdateInstanceInformation');

      const ssmMessagesStatement = policyDoc.Statement[1];
      expect(ssmMessagesStatement.Action).toContain(
        'ssmmessages:CreateControlChannel'
      );
      expect(ssmMessagesStatement.Action).toContain(
        'ssmmessages:CreateDataChannel'
      );
      expect(ssmMessagesStatement.Action).toContain(
        'ssmmessages:OpenControlChannel'
      );
      expect(ssmMessagesStatement.Action).toContain(
        'ssmmessages:OpenDataChannel'
      );
    });

    test('should have instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toBeDefined();
    });
  });

  describe('Security and Compliance', () => {
    test('should have proper resource tagging', () => {
      const resourcesWithTags = [
        'SecureVPC',
        'InternetGateway',
        'NATGatewayElasticIP',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'NATGateway',
        'PublicRouteTable',
        'PrivateRouteTable',
        'PublicSecurityGroup',
        'PrivateSecurityGroup',
        'EC2LeastPrivilegeRole',
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        expect(Array.isArray(resource.Properties.Tags)).toBe(true);
        expect(resource.Properties.Tags.length).toBeGreaterThan(0);
      });
    });

    test('should implement security best practices', () => {
      // Public subnets should not auto-assign public IPs
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);

      // Private security group should not allow internet access
      const privateSG = template.Resources.PrivateSecurityGroup;
      const ingressRules = privateSG.Properties.SecurityGroupIngress;
      ingressRules.forEach((rule: any) => {
        expect(rule.CidrIp).not.toBe('0.0.0.0/0');
        expect(rule.SourceSecurityGroupId).toBeDefined();
      });
    });

    test('should have region restrictions in IAM policies', () => {
      const policy = template.Resources.EC2SSMPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;

      statements.forEach((statement: any) => {
        expect(statement.Condition).toBeDefined();
        expect(statement.Condition.StringEquals).toBeDefined();
        expect(
          statement.Condition.StringEquals['aws:RequestedRegion']
        ).toBeDefined();
      });
    });
  });

  describe('High Availability', () => {
    test('should deploy across multiple availability zones', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(publicSubnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(
        0
      );
      expect(publicSubnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(
        1
      );
      expect(privateSubnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(
        0
      );
      expect(privateSubnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(
        1
      );
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnetIds',
        'PrivateSubnetIds',
        'PublicSecurityGroupId',
        'InstanceProfileArn',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
        expect(template.Outputs[outputName].Export).toBeDefined();
      });
    });

    test('should have comma-delimited subnet outputs', () => {
      const publicSubnets = template.Outputs.PublicSubnetIds;
      const privateSubnets = template.Outputs.PrivateSubnetIds;

      expect(publicSubnets.Value['Fn::Sub']).toContain(',');
      expect(privateSubnets.Value['Fn::Sub']).toContain(',');
    });

    test('should have additional useful outputs', () => {
      const additionalOutputs = [
        'PrivateSecurityGroupId',
        'NATGatewayId',
        'InternetGatewayId',
      ];

      additionalOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Export).toBeDefined();
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
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
    });

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(22); // All VPC infrastructure resources
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2); // VpcCidrBlock and ApplicationPort
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8); // 5 required + 3 additional
    });
  });
});
