import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;
  let jsonTemplate: any;

  beforeAll(() => {
    // Load JSON template
    const jsonPath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    jsonTemplate = JSON.parse(jsonContent);

    // Use JSON template as primary
    template = jsonTemplate;
  });

  describe('Template Structure', () => {
    test('should have correct AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('secure cloud environment');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });

    test('should have Conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.HasKeyPair).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have EnvironmentName parameter', () => {
      expect(template.Parameters.EnvironmentName).toBeDefined();
      expect(template.Parameters.EnvironmentName.Type).toBe('String');
      expect(template.Parameters.EnvironmentName.Default).toBe('Production');
    });

    test('should have VpcCIDR parameter with validation', () => {
      expect(template.Parameters.VpcCIDR).toBeDefined();
      expect(template.Parameters.VpcCIDR.Type).toBe('String');
      expect(template.Parameters.VpcCIDR.Default).toBe('10.192.0.0/16');
      expect(template.Parameters.VpcCIDR.AllowedPattern).toBeDefined();
    });

    test('should have PublicSubnet1CIDR parameter', () => {
      expect(template.Parameters.PublicSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet1CIDR.Type).toBe('String');
      expect(template.Parameters.PublicSubnet1CIDR.Default).toBe(
        '10.192.10.0/24'
      );
    });

    test('should have PublicSubnet2CIDR parameter', () => {
      expect(template.Parameters.PublicSubnet2CIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet2CIDR.Type).toBe('String');
      expect(template.Parameters.PublicSubnet2CIDR.Default).toBe(
        '10.192.11.0/24'
      );
    });

    test('should have InstanceType parameter with allowed values', () => {
      expect(template.Parameters.InstanceType).toBeDefined();
      expect(template.Parameters.InstanceType.AllowedValues).toContain(
        't3.micro'
      );
      expect(template.Parameters.InstanceType.Default).toBe('t3.micro');
    });

    test('should have KeyPairName parameter as optional', () => {
      expect(template.Parameters.KeyPairName).toBeDefined();
      expect(template.Parameters.KeyPairName.Type).toBe('String');
      expect(template.Parameters.KeyPairName.Default).toBe('MyKeyPair');
    });

    test('should have LatestAmiId parameter', () => {
      expect(template.Parameters.LatestAmiId).toBeDefined();
      expect(template.Parameters.LatestAmiId.Type).toBe(
        'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
      );
    });

    test('should have Auto Scaling parameters', () => {
      expect(template.Parameters.MinSize).toBeDefined();
      expect(template.Parameters.MinSize.Default).toBe(2);
      expect(template.Parameters.MaxSize).toBeDefined();
      expect(template.Parameters.MaxSize.Default).toBe(6);
      expect(template.Parameters.DesiredCapacity).toBeDefined();
      expect(template.Parameters.DesiredCapacity.Default).toBe(2);
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
    });

    test('should have Internet Gateway Attachment', () => {
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment.Type).toBe(
        'AWS::EC2::VPCGatewayAttachment'
      );
    });

    test('should have two public subnets in different AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(
        template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch
      ).toBe(true);

      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(
        template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch
      ).toBe(true);
    });

    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe(
        'AWS::EC2::RouteTable'
      );
    });

    test('should have default public route', () => {
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      expect(template.Resources.DefaultPublicRoute.Type).toBe(
        'AWS::EC2::Route'
      );
      expect(
        template.Resources.DefaultPublicRoute.Properties.DestinationCidrBlock
      ).toBe('0.0.0.0/0');
    });

    test('should have subnet route table associations', () => {
      expect(
        template.Resources.PublicSubnet1RouteTableAssociation
      ).toBeDefined();
      expect(
        template.Resources.PublicSubnet2RouteTableAssociation
      ).toBeDefined();
    });
  });

  describe('Security Resources', () => {
    test('should have WebServer Security Group', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.WebServerSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('should allow HTTP and HTTPS ingress', () => {
      const ingress =
        template.Resources.WebServerSecurityGroup.Properties
          .SecurityGroupIngress;
      const httpRule = ingress.find((r: any) => r.FromPort === 80);
      const httpsRule = ingress.find((r: any) => r.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');

      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have restricted egress rules', () => {
      const egress =
        template.Resources.WebServerSecurityGroup.Properties
          .SecurityGroupEgress;
      expect(egress).toBeDefined();
      expect(egress.length).toBeGreaterThan(0);

      // Check for essential egress rules
      const httpEgress = egress.find((r: any) => r.FromPort === 80);
      const httpsEgress = egress.find((r: any) => r.FromPort === 443);
      const dnsEgress = egress.find((r: any) => r.FromPort === 53);

      expect(httpEgress).toBeDefined();
      expect(httpsEgress).toBeDefined();
      expect(dnsEgress).toBeDefined();
    });

    test('should have EC2 IAM Role', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      expect(template.Resources.EC2Role.Type).toBe('AWS::IAM::Role');
    });

    test('should have EC2 Instance Profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe(
        'AWS::IAM::InstanceProfile'
      );
    });
  });

  describe('Compute Resources', () => {
    test('should have Launch Template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe(
        'AWS::EC2::LaunchTemplate'
      );
    });

    test('Launch Template should use conditional KeyPair', () => {
      const keyName =
        template.Resources.LaunchTemplate.Properties.LaunchTemplateData.KeyName;
      expect(keyName['Fn::If']).toBeDefined();
      expect(keyName['Fn::If'][0]).toBe('HasKeyPair');
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe(
        'AWS::AutoScaling::AutoScalingGroup'
      );
    });

    test('Auto Scaling Group should span multiple AZs', () => {
      const vpcZones =
        template.Resources.AutoScalingGroup.Properties.VPCZoneIdentifier;
      expect(vpcZones).toBeDefined();
      expect(vpcZones.length).toBe(2);
    });

    test('Auto Scaling Group should have proper health check settings', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      expect(asg.HealthCheckType).toBe('EC2');
      expect(asg.HealthCheckGracePeriod).toBe(300);
    });

    test('Auto Scaling Group should reference Launch Template', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      expect(asg.LaunchTemplate).toBeDefined();
      expect(asg.LaunchTemplate.LaunchTemplateId.Ref).toBe('LaunchTemplate');
    });
  });

  describe('Resource Naming Convention', () => {
    test('VPC resources should include EnvironmentSuffix', () => {
      const vpcName = template.Resources.VPC.Properties.Tags.find(
        (t: any) => t.Key === 'Name'
      );
      expect(vpcName.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('Security Group should include EnvironmentSuffix', () => {
      const sgName =
        template.Resources.WebServerSecurityGroup.Properties.GroupName;
      expect(sgName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('Launch Template should include EnvironmentSuffix', () => {
      const ltName =
        template.Resources.LaunchTemplate.Properties.LaunchTemplateName;
      expect(ltName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('Auto Scaling Group should include EnvironmentSuffix', () => {
      const asgName =
        template.Resources.AutoScalingGroup.Properties.AutoScalingGroupName;
      expect(asgName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Outputs', () => {
    test('should have VPC output', () => {
      expect(template.Outputs.VPC).toBeDefined();
      expect(template.Outputs.VPC.Export).toBeDefined();
    });

    test('should have subnet outputs', () => {
      expect(template.Outputs.PublicSubnet1).toBeDefined();
      expect(template.Outputs.PublicSubnet2).toBeDefined();
      expect(template.Outputs.PublicSubnets).toBeDefined();
    });

    test('should have security group output', () => {
      expect(template.Outputs.WebServerSecurityGroup).toBeDefined();
    });

    test('should have Auto Scaling Group output', () => {
      expect(template.Outputs.AutoScalingGroupName).toBeDefined();
    });

    test('should have Launch Template output', () => {
      expect(template.Outputs.LaunchTemplateId).toBeDefined();
    });

    test('should have Internet Gateway output', () => {
      expect(template.Outputs.InternetGateway).toBeDefined();
    });

    test('should have VPC CIDR output', () => {
      expect(template.Outputs.VPCCidr).toBeDefined();
    });

    test('all outputs should have exports with EnvironmentSuffix', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Export).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });
  });

  describe('High Availability Requirements', () => {
    test('should have resources in multiple availability zones', () => {
      const subnet1AZ =
        template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const subnet2AZ =
        template.Resources.PublicSubnet2.Properties.AvailabilityZone;

      expect(subnet1AZ['Fn::Select'][0]).toBe(0);
      expect(subnet2AZ['Fn::Select'][0]).toBe(1);
    });

    test('should have minimum of 2 instances in Auto Scaling', () => {
      expect(template.Parameters.MinSize.Default).toBeGreaterThanOrEqual(2);
      expect(template.Parameters.MinSize.MinValue).toBeGreaterThanOrEqual(2);
    });

    test('Auto Scaling Group should have update policy', () => {
      expect(template.Resources.AutoScalingGroup.UpdatePolicy).toBeDefined();
      expect(
        template.Resources.AutoScalingGroup.UpdatePolicy
          .AutoScalingRollingUpdate
      ).toBeDefined();
    });
  });

  describe('Security Best Practices', () => {
    test('should not have retain deletion policies', () => {
      Object.values(template.Resources).forEach((resource: any) => {
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('should have proper tagging', () => {
      const taggedResources = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PublicRouteTable',
        'WebServerSecurityGroup',
        'EC2Role',
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const envTag = tags.find((t: any) => t.Key === 'Environment');
          const purposeTag = tags.find((t: any) => t.Key === 'Purpose');

          expect(envTag).toBeDefined();
          expect(purposeTag).toBeDefined();
        }
      });
    });

    test('should use principle of least privilege for security group', () => {
      const sg = template.Resources.WebServerSecurityGroup.Properties;

      // SSH should be restricted to VPC only
      const sshRule = sg.SecurityGroupIngress.find(
        (r: any) => r.FromPort === 22
      );
      if (sshRule) {
        expect(sshRule.CidrIp).not.toBe('0.0.0.0/0');
        expect(sshRule.CidrIp.Ref).toBe('VpcCIDR');
      }
    });

    test('should have CloudWatch permissions for EC2 instances', () => {
      const role = template.Resources.EC2Role;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
    });
  });

  describe('Template Validation', () => {
    test('should not have hardcoded values', () => {
      const templateString = JSON.stringify(template);

      // Should not have hardcoded private IP addresses
      expect(templateString).not.toMatch(/192\.168\.\d+\.\d+/);
      expect(templateString).not.toMatch(
        /172\.(1[6-9]|2[0-9]|3[01])\.\d+\.\d+/
      );

      // Should not have hardcoded AWS account IDs
      expect(templateString).not.toMatch(/\d{12}/);
    });

    test('should use intrinsic functions appropriately', () => {
      // Check that Ref is used for parameters
      const vpcCidr = template.Resources.VPC.Properties.CidrBlock;
      expect(vpcCidr.Ref).toBe('VpcCIDR');

      // Check that Fn::Sub is used for naming
      const vpcName = template.Resources.VPC.Properties.Tags.find(
        (t: any) => t.Key === 'Name'
      );
      expect(vpcName.Value['Fn::Sub']).toBeDefined();
    });

    test('should have all required resource types', () => {
      const resourceTypes = Object.values(template.Resources).map(
        (r: any) => r.Type
      );

      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::EC2::InternetGateway');
      expect(resourceTypes).toContain('AWS::EC2::Subnet');
      expect(resourceTypes).toContain('AWS::EC2::RouteTable');
      expect(resourceTypes).toContain('AWS::EC2::SecurityGroup');
      expect(resourceTypes).toContain('AWS::EC2::LaunchTemplate');
      expect(resourceTypes).toContain('AWS::AutoScaling::AutoScalingGroup');
    });

    test('should have proper dependencies', () => {
      // Check that DefaultPublicRoute depends on IGW attachment
      expect(template.Resources.DefaultPublicRoute.DependsOn).toBe(
        'InternetGatewayAttachment'
      );
    });
  });

  describe('Template Completeness', () => {
    test('should have at least 10 parameters', () => {
      const paramCount = Object.keys(template.Parameters).length;
      expect(paramCount).toBeGreaterThanOrEqual(10);
    });

    test('should have at least 14 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(14);
    });

    test('should have at least 9 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(9);
    });

    test('all parameters should have descriptions', () => {
      Object.values(template.Parameters).forEach((param: any) => {
        expect(param.Description).toBeDefined();
        expect(param.Description.length).toBeGreaterThan(0);
      });
    });

    test('all outputs should have descriptions', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });
  });
});
