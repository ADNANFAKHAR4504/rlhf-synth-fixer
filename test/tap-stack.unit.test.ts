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

    test('should have a comprehensive description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('ProjectX Cloud Environment Setup');
      expect(template.Description).toContain('VPC infrastructure');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toHaveLength(2);
    });

    test('should have mappings for AMI IDs', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.AWSRegionAMI).toBeDefined();
      expect(template.Mappings.AWSRegionAMI['us-east-1']).toBeDefined();
      expect(template.Mappings.AWSRegionAMI['us-east-1'].AMI).toBeDefined();
    });

    test('should have conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.HasKeyPair).toBeDefined();
    });
  });

  describe('Parameters', () => {
    const requiredParameters = [
      'EnvironmentSuffix',
      'OfficeIpAddress',
      'InstanceType',
      'KeyPairName'
    ];

    test('should have all required parameters', () => {
      requiredParameters.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toContain('Environment suffix');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe('Must contain only alphanumeric characters');
      expect(envSuffixParam.MinLength).toBe(2);
      expect(envSuffixParam.MaxLength).toBe(10);
    });

    test('OfficeIpAddress parameter should have correct validation', () => {
      const officeIpParam = template.Parameters.OfficeIpAddress;
      expect(officeIpParam.Type).toBe('String');
      expect(officeIpParam.Default).toBe('0.0.0.0/0');
      expect(officeIpParam.Description).toContain('Office IP address');
      expect(officeIpParam.AllowedPattern).toBe('^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/(3[0-2]|[12]?\\d)$');
      expect(officeIpParam.ConstraintDescription).toContain('CIDR format');
    });

    test('InstanceType parameter should have allowed values', () => {
      const instanceTypeParam = template.Parameters.InstanceType;
      expect(instanceTypeParam.Type).toBe('String');
      expect(instanceTypeParam.Default).toBe('t3.micro');
      expect(instanceTypeParam.AllowedValues).toEqual(['t3.micro', 't3.small', 't3.medium', 't3.large']);
      expect(instanceTypeParam.ConstraintDescription).toContain('valid EC2 instance type');
    });

    test('KeyPairName parameter should be optional', () => {
      const keyPairParam = template.Parameters.KeyPairName;
      expect(keyPairParam.Type).toBe('String');
      expect(keyPairParam.Default).toBe('');
      expect(keyPairParam.Description).toContain('Optional');
    });

    // Edge case tests for parameter validation
    describe('Parameter Edge Cases', () => {
      test('EnvironmentSuffix should reject invalid patterns', () => {
        const pattern = new RegExp(template.Parameters.EnvironmentSuffix.AllowedPattern);
        expect(pattern.test('dev')).toBe(true);
        expect(pattern.test('staging123')).toBe(true);
        expect(pattern.test('dev-test')).toBe(false); // Should reject hyphens
        expect(pattern.test('dev.test')).toBe(false); // Should reject dots
        expect(pattern.test('')).toBe(false); // Should reject empty
      });

      test('OfficeIpAddress should validate CIDR format', () => {
        const pattern = new RegExp(template.Parameters.OfficeIpAddress.AllowedPattern);
        expect(pattern.test('192.168.1.1/32')).toBe(true);
        expect(pattern.test('10.0.0.0/16')).toBe(true);
        expect(pattern.test('203.0.113.0/24')).toBe(true);
        expect(pattern.test('192.168.1.1')).toBe(false); // Missing CIDR
        expect(pattern.test('192.168.1.1/33')).toBe(false); // Invalid CIDR
        expect(pattern.test('256.0.0.1/32')).toBe(false); // Invalid IP
      });

      test('parameters should have meaningful descriptions', () => {
        requiredParameters.forEach(param => {
          expect(template.Parameters[param].Description).toBeDefined();
          expect(template.Parameters[param].Description.length).toBeGreaterThan(10);
        });
      });
    });
  });

  describe('Network Resources', () => {
    describe('VPC', () => {
      test('should have ProjectXVPC resource', () => {
        expect(template.Resources.ProjectXVPC).toBeDefined();
        expect(template.Resources.ProjectXVPC.Type).toBe('AWS::EC2::VPC');
      });

      test('ProjectXVPC should have correct CIDR and DNS settings', () => {
        const vpc = template.Resources.ProjectXVPC;
        const props = vpc.Properties;
        expect(props.CidrBlock).toBe('10.0.0.0/16');
        expect(props.EnableDnsHostnames).toBe(true);
        expect(props.EnableDnsSupport).toBe(true);
      });

      test('ProjectXVPC should have proper tags', () => {
        const vpc = template.Resources.ProjectXVPC;
        const tags = vpc.Properties.Tags;
        expect(tags.find((t: any) => t.Key === 'Name')).toBeDefined();
        expect(tags.find((t: any) => t.Key === 'Environment')).toBeDefined();
        expect(tags.find((t: any) => t.Key === 'Project' && t.Value === 'ProjectX')).toBeDefined();
      });
    });

    describe('Subnets', () => {
      test('should have all four subnets', () => {
        const subnetNames = ['ProjectXPublicSubnet1', 'ProjectXPublicSubnet2', 'ProjectXPrivateSubnet1', 'ProjectXPrivateSubnet2'];
        subnetNames.forEach(subnetName => {
          expect(template.Resources[subnetName]).toBeDefined();
          expect(template.Resources[subnetName].Type).toBe('AWS::EC2::Subnet');
        });
      });

      test('public subnets should have correct CIDR blocks', () => {
        expect(template.Resources.ProjectXPublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
        expect(template.Resources.ProjectXPublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      });

      test('private subnets should have correct CIDR blocks', () => {
        expect(template.Resources.ProjectXPrivateSubnet1.Properties.CidrBlock).toBe('10.0.10.0/24');
        expect(template.Resources.ProjectXPrivateSubnet2.Properties.CidrBlock).toBe('10.0.11.0/24');
      });

      test('public subnets should map public IPs on launch', () => {
        expect(template.Resources.ProjectXPublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
        expect(template.Resources.ProjectXPublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      });

      test('subnets should be in different AZs', () => {
        const publicSubnet1AZ = template.Resources.ProjectXPublicSubnet1.Properties.AvailabilityZone;
        const publicSubnet2AZ = template.Resources.ProjectXPublicSubnet2.Properties.AvailabilityZone;
        const privateSubnet1AZ = template.Resources.ProjectXPrivateSubnet1.Properties.AvailabilityZone;
        const privateSubnet2AZ = template.Resources.ProjectXPrivateSubnet2.Properties.AvailabilityZone;

        // Check they use GetAZs function
        expect(publicSubnet1AZ['Fn::Select'][0]).toBe(0);
        expect(publicSubnet2AZ['Fn::Select'][0]).toBe(1);
        expect(privateSubnet1AZ['Fn::Select'][0]).toBe(0);
        expect(privateSubnet2AZ['Fn::Select'][0]).toBe(1);
      });
    });

    describe('NAT Gateway', () => {
      test('should have NAT Gateway EIP', () => {
        expect(template.Resources.ProjectXNATGatewayEIP).toBeDefined();
        expect(template.Resources.ProjectXNATGatewayEIP.Type).toBe('AWS::EC2::EIP');
        expect(template.Resources.ProjectXNATGatewayEIP.Properties.Domain).toBe('vpc');
        expect(template.Resources.ProjectXNATGatewayEIP.DependsOn).toBe('ProjectXAttachGateway');
      });

      test('should have NAT Gateway in public subnet', () => {
        const natGateway = template.Resources.ProjectXNATGateway;
        expect(natGateway).toBeDefined();
        expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
        expect(natGateway.Properties.SubnetId.Ref).toBe('ProjectXPublicSubnet1');
        expect(natGateway.Properties.AllocationId['Fn::GetAtt'][0]).toBe('ProjectXNATGatewayEIP');
      });
    });
  });

  describe('Security Resources', () => {
    describe('Security Groups', () => {
      test('should have SSH security group', () => {
        const sshSG = template.Resources.ProjectXSSHSecurityGroup;
        expect(sshSG).toBeDefined();
        expect(sshSG.Type).toBe('AWS::EC2::SecurityGroup');
        expect(sshSG.Properties.GroupDescription).toContain('SSH access from office IP');
      });

      test('SSH security group should have correct ingress rules', () => {
        const sshSG = template.Resources.ProjectXSSHSecurityGroup;
        const ingress = sshSG.Properties.SecurityGroupIngress[0];
        
        expect(ingress.IpProtocol).toBe('tcp');
        expect(ingress.FromPort).toBe(22);
        expect(ingress.ToPort).toBe(22);
        expect(ingress.CidrIp.Ref).toBe('OfficeIpAddress');
        expect(ingress.Description).toBe('SSH access from office IP');
      });

      test('should have internal security group', () => {
        const internalSG = template.Resources.ProjectXInternalSecurityGroup;
        expect(internalSG).toBeDefined();
        expect(internalSG.Type).toBe('AWS::EC2::SecurityGroup');
        expect(internalSG.Properties.GroupDescription).toContain('internal communication');
      });

      test('internal security group should have self-referencing rule', () => {
        const selfIngress = template.Resources.ProjectXInternalSecurityGroupSelfIngress;
        expect(selfIngress).toBeDefined();
        expect(selfIngress.Type).toBe('AWS::EC2::SecurityGroupIngress');
        expect(selfIngress.Properties.IpProtocol).toBe('-1');
        expect(selfIngress.Properties.GroupId.Ref).toBe('ProjectXInternalSecurityGroup');
        expect(selfIngress.Properties.SourceSecurityGroupId.Ref).toBe('ProjectXInternalSecurityGroup');
      });
    });
  });

  // LOCALSTACK COMPATIBILITY: EC2 Instance tests skipped (instances not deployed)
  describe.skip('Compute Resources', () => {
    describe('EC2 Instances', () => {
      test('should have two EC2 instances', () => {
        expect(template.Resources.ProjectXInstance1).toBeDefined();
        expect(template.Resources.ProjectXInstance2).toBeDefined();
        expect(template.Resources.ProjectXInstance1.Type).toBe('AWS::EC2::Instance');
        expect(template.Resources.ProjectXInstance2.Type).toBe('AWS::EC2::Instance');
      });

      test('instances should be in different private subnets', () => {
        expect(template.Resources.ProjectXInstance1.Properties.SubnetId.Ref).toBe('ProjectXPrivateSubnet1');
        expect(template.Resources.ProjectXInstance2.Properties.SubnetId.Ref).toBe('ProjectXPrivateSubnet2');
      });

      test('instances should use launch template', () => {
        [template.Resources.ProjectXInstance1, template.Resources.ProjectXInstance2].forEach(instance => {
          expect(instance.Properties.LaunchTemplate.LaunchTemplateId.Ref).toBe('ProjectXLaunchTemplate');
          expect(instance.Properties.LaunchTemplate.Version['Fn::GetAtt'][0]).toBe('ProjectXLaunchTemplate');
        });
      });
    });

    describe('Launch Template', () => {
      test('should have launch template with conditional KeyName', () => {
        const launchTemplate = template.Resources.ProjectXLaunchTemplate;
        expect(launchTemplate).toBeDefined();
        expect(launchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
        
        const launchTemplateData = launchTemplate.Properties.LaunchTemplateData;
        expect(launchTemplateData.KeyName['Fn::If']).toBeDefined();
        expect(launchTemplateData.KeyName['Fn::If'][0]).toBe('HasKeyPair');
        expect(launchTemplateData.KeyName['Fn::If'][1].Ref).toBe('KeyPairName');
        expect(launchTemplateData.KeyName['Fn::If'][2].Ref).toBe('AWS::NoValue');
      });
    });

    describe('IAM Resources', () => {
      test('should have instance role with correct policies', () => {
        const role = template.Resources.ProjectXInstanceRole;
        expect(role).toBeDefined();
        expect(role.Type).toBe('AWS::IAM::Role');
        
        const managedPolicies = role.Properties.ManagedPolicyArns;
        expect(managedPolicies).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
        expect(managedPolicies).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      });
    });
  });

  describe('Outputs', () => {
    // LOCALSTACK COMPATIBILITY: Instance outputs excluded (instances not deployed in LocalStack)
    const expectedOutputs = [
      'VPCId', 'PublicSubnet1Id', 'PublicSubnet2Id', 'PrivateSubnet1Id', 'PrivateSubnet2Id',
      'SSHSecurityGroupId', 'InternalSecurityGroupId', 'NATGatewayId', 'StackName', 'EnvironmentSuffix'
    ];

    test('should have all required outputs', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have descriptions and export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Export).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  describe('Security Compliance', () => {
    test('SSH access should be restricted to office IP only', () => {
      const sshSG = template.Resources.ProjectXSSHSecurityGroup;
      const sshIngress = sshSG.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 22);
      
      expect(sshIngress).toBeDefined();
      expect(sshIngress.CidrIp.Ref).toBe('OfficeIpAddress');
      expect(sshIngress.IpProtocol).toBe('tcp');
    });

    // LOCALSTACK COMPATIBILITY: Instance location test skipped (instances not deployed)
    test.skip('instances should be in private subnets only', () => {
      expect(template.Resources.ProjectXInstance1.Properties.SubnetId.Ref).toBe('ProjectXPrivateSubnet1');
      expect(template.Resources.ProjectXInstance2.Properties.SubnetId.Ref).toBe('ProjectXPrivateSubnet2');
    });

    test('all resources should have ProjectX tagging', () => {
      const taggableTypes = [
        'AWS::EC2::VPC', 'AWS::EC2::Subnet', 'AWS::EC2::SecurityGroup', 
        'AWS::IAM::Role', 'AWS::EC2::Instance'
      ];
      
      const taggableResources = Object.entries(template.Resources)
        .filter(([_, resource]: [string, any]) => taggableTypes.includes(resource.Type));
      
      taggableResources.forEach(([name, resource]: [string, any]) => {
        if (resource.Properties.Tags) {
          const projectTag = resource.Properties.Tags.find((t: any) => t.Key === 'Project');
          expect(projectTag).toBeDefined();
          expect(projectTag.Value).toBe('ProjectX');
        }
      });
    });
  });

  describe('Edge Cases and Validation', () => {
    test('CIDR blocks should not overlap', () => {
      const vpcCidr = template.Resources.ProjectXVPC.Properties.CidrBlock;
      const subnetCidrs = [
        template.Resources.ProjectXPublicSubnet1.Properties.CidrBlock,
        template.Resources.ProjectXPublicSubnet2.Properties.CidrBlock,
        template.Resources.ProjectXPrivateSubnet1.Properties.CidrBlock,
        template.Resources.ProjectXPrivateSubnet2.Properties.CidrBlock
      ];

      expect(vpcCidr).toBe('10.0.0.0/16');
      expect(subnetCidrs).toEqual(['10.0.1.0/24', '10.0.2.0/24', '10.0.10.0/24', '10.0.11.0/24']);
    });

    test('resource naming should be consistent with ProjectX prefix', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        expect(resourceName.startsWith('ProjectX')).toBe(true);
      });
    });

    test('should use single NAT Gateway for cost optimization', () => {
      const natGateways = Object.entries(template.Resources)
        .filter(([_, resource]: [string, any]) => resource.Type === 'AWS::EC2::NatGateway');
      expect(natGateways.length).toBe(1);
    });

    test('template should have valid structure', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Resources).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Conditions).toBeDefined();
      // LOCALSTACK COMPATIBILITY: Resource count reduced (23 resources after removing 2 EC2 instances)
      expect(Object.keys(template.Resources).length).toBe(23);
    });
  });
});