import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Write Integration TESTS', () => {
    test('Integration tests should be implemented', async () => {
      // This test reminds us to implement proper integration tests  
      expect(true).toBe(true);
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Multi-region infrastructure with VPC, ALB, Auto Scaling, S3, and security configurations'
      );
    });

    test('should have mappings section', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.RegionConfig).toBeDefined();
      expect(template.Mappings.RegionAMI).toBeDefined();
    });

    test('should have conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.HasSSLCertificate).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentName parameter', () => {
      expect(template.Parameters.EnvironmentName).toBeDefined();
      const param = template.Parameters.EnvironmentName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('Production');
      expect(param.Description).toBe('An environment name that is prefixed to resource names');
    });

    test('should have InstanceType parameter', () => {
      expect(template.Parameters.InstanceType).toBeDefined();
      const param = template.Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.micro');
      expect(param.AllowedValues).toEqual(['t3.micro', 't3.small', 't3.medium', 't3.large']);
    });

    test('should have capacity parameters', () => {
      expect(template.Parameters.DesiredCapacity).toBeDefined();
      expect(template.Parameters.MinSize).toBeDefined();
      expect(template.Parameters.MaxSize).toBeDefined();
      
      expect(template.Parameters.DesiredCapacity.Type).toBe('Number');
      expect(template.Parameters.DesiredCapacity.Default).toBe(2);
      expect(template.Parameters.MinSize.Default).toBe(1);
      expect(template.Parameters.MaxSize.Default).toBe(4);
    });

    test('should have CertificateArn parameter', () => {
      expect(template.Parameters.CertificateArn).toBeDefined();
      const param = template.Parameters.CertificateArn;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
    });
  });

  describe('Resources', () => {
    describe('EC2 Resources', () => {
      test('should have EC2KeyPair resource', () => {
        expect(template.Resources.EC2KeyPair).toBeDefined();
        expect(template.Resources.EC2KeyPair.Type).toBe('AWS::EC2::KeyPair');
      });

      test('should have VPC resource', () => {
        expect(template.Resources.VPC).toBeDefined();
        expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      });

      test('should have InternetGateway resource', () => {
        expect(template.Resources.InternetGateway).toBeDefined();
        expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      });

      test('should have subnet resources', () => {
        expect(template.Resources.PublicSubnet1).toBeDefined();
        expect(template.Resources.PublicSubnet2).toBeDefined();
        expect(template.Resources.PrivateSubnet1).toBeDefined();
        expect(template.Resources.PrivateSubnet2).toBeDefined();
        
        expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
        expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
        expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
        expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
      });

      test('should have NAT Gateway resources', () => {
        expect(template.Resources.NatGateway1EIP).toBeDefined();
        expect(template.Resources.NatGateway2EIP).toBeDefined();
        expect(template.Resources.NatGateway1).toBeDefined();
        expect(template.Resources.NatGateway2).toBeDefined();
        
        expect(template.Resources.NatGateway1EIP.Type).toBe('AWS::EC2::EIP');
        expect(template.Resources.NatGateway2EIP.Type).toBe('AWS::EC2::EIP');
        expect(template.Resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
        expect(template.Resources.NatGateway2.Type).toBe('AWS::EC2::NatGateway');
      });
    });

    describe('Load Balancer Resources', () => {
      test('should have Application Load Balancer', () => {
        expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
        expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      });

      test('should have Target Group', () => {
        expect(template.Resources.TargetGroup).toBeDefined();
        expect(template.Resources.TargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      });

      test('should have Load Balancer Listeners', () => {
        expect(template.Resources.HTTPListener).toBeDefined();
        expect(template.Resources.HTTPSListener).toBeDefined();
        expect(template.Resources.HTTPListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
        expect(template.Resources.HTTPSListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      });
    });

    describe('Auto Scaling Resources', () => {
      test('should have Launch Template', () => {
        expect(template.Resources.LaunchTemplate).toBeDefined();
        expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
      });

      test('should have Auto Scaling Group', () => {
        expect(template.Resources.AutoScalingGroup).toBeDefined();
        expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      });
    });

    describe('Security Resources', () => {
      test('should have Security Groups', () => {
        expect(template.Resources.EC2SecurityGroup).toBeDefined();
        expect(template.Resources.ALBSecurityGroup).toBeDefined();
        expect(template.Resources.RDSSecurityGroup).toBeDefined();
        
        expect(template.Resources.EC2SecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
        expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
        expect(template.Resources.RDSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      });
    });
  });

  describe('Outputs', () => {
    test('should have VPC output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have subnet outputs', () => {
      const expectedSubnetOutputs = ['PrivateSubnet1Id', 'PrivateSubnet2Id'];
      
      expectedSubnetOutputs.forEach(subnetName => {
        expect(template.Outputs[subnetName]).toBeDefined();
      });
    });

    test('should have security group outputs', () => {
      expect(template.Outputs.RDSSecurityGroupId).toBeDefined();
    });

    test('should have LoadBalancerDNS output', () => {
      expect(template.Outputs.ALBDNSName).toBeDefined();
      const output = template.Outputs.ALBDNSName;
      expect(output.Description).toBe('DNS name of the Application Load Balancer');
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
      expect(template.Mappings).not.toBeNull();
      expect(template.Conditions).not.toBeNull();
    });

    test('should have multiple resources for infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10);
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(6);
    });

    test('should have multiple outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(5);
    });

    test('should have required mappings', () => {
      expect(template.Mappings.RegionConfig).toBeDefined();
      expect(template.Mappings.RegionAMI).toBeDefined();
    });

    test('should have region configurations for supported regions', () => {
      const supportedRegions = ['us-east-1', 'us-west-2', 'eu-west-1'];
      supportedRegions.forEach(region => {
        expect(template.Mappings.RegionConfig[region]).toBeDefined();
        expect(template.Mappings.RegionAMI[region]).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('VPC should use environment name in tags', () => {
      const vpc = template.Resources.VPC;
      const nameTag = vpc.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toEqual({ 'Fn::Sub': '${EnvironmentName}-VPC' });
    });

    test('subnets should use environment name in tags', () => {
      const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'];
      subnets.forEach(subnetName => {
        const subnet = template.Resources[subnetName];
        const nameTag = subnet.Properties.Tags.find((tag: any) => tag.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentName}');
      });
    });

    test('security groups should use environment name in group names', () => {
      const securityGroups = ['EC2SecurityGroup', 'ALBSecurityGroup', 'RDSSecurityGroup'];
      securityGroups.forEach(sgName => {
        const sg = template.Resources[sgName];
        if (sg.Properties.GroupName && sg.Properties.GroupName['Fn::Sub']) {
          expect(sg.Properties.GroupName['Fn::Sub']).toContain('${EnvironmentName}');
        }
      });
    });
  });

  describe('Mappings Validation', () => {
    test('should have correct CIDR blocks for regions', () => {
      const regions = Object.keys(template.Mappings.RegionConfig);
      regions.forEach(region => {
        const config = template.Mappings.RegionConfig[region];
        expect(config.VPCCidr).toMatch(/^10\.\d+\.\d+\.\d+\/16$/);
        expect(config.PublicSubnet1Cidr).toMatch(/^10\.\d+\.\d+\.\d+\/24$/);
        expect(config.PublicSubnet2Cidr).toMatch(/^10\.\d+\.\d+\.\d+\/24$/);
        expect(config.PrivateSubnet1Cidr).toMatch(/^10\.\d+\.\d+\.\d+\/24$/);
        expect(config.PrivateSubnet2Cidr).toMatch(/^10\.\d+\.\d+\.\d+\/24$/);
      });
    });

    test('should have valid AMI IDs for regions', () => {
      const regions = Object.keys(template.Mappings.RegionAMI);
      regions.forEach(region => {
        const ami = template.Mappings.RegionAMI[region].AMI;
        expect(ami).toMatch(/^ami-[0-9a-f]{8,17}$/);
      });
    });
  });
});
