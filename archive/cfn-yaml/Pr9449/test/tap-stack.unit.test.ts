/**
 * Unit tests for CloudFormation TapStack.yml template
 * Tests validate template structure, resources, parameters, conditions, and outputs
 */
import * as fs from 'fs';
import * as path from 'path';
import { yamlParse } from 'yaml-cfn';

// Load and parse the CloudFormation template using yaml-cfn for intrinsic function support
const templatePath = path.join(__dirname, '../lib/TapStack.yml');
const templateContent = fs.readFileSync(templatePath, 'utf8');
const template = yamlParse(templateContent) as any;

describe('CloudFormation Template Structure', () => {
  test('should have valid AWSTemplateFormatVersion', () => {
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
  });

  test('should have a description', () => {
    expect(template.Description).toBeDefined();
    expect(template.Description).toContain('High-Availability');
    expect(template.Description).toContain('Multi-AZ');
  });

  test('should have Parameters section', () => {
    expect(template.Parameters).toBeDefined();
    expect(typeof template.Parameters).toBe('object');
  });

  test('should have Conditions section', () => {
    expect(template.Conditions).toBeDefined();
    expect(typeof template.Conditions).toBe('object');
  });

  test('should have Resources section', () => {
    expect(template.Resources).toBeDefined();
    expect(typeof template.Resources).toBe('object');
  });

  test('should have Outputs section', () => {
    expect(template.Outputs).toBeDefined();
    expect(typeof template.Outputs).toBe('object');
  });
});

describe('Parameters Validation', () => {
  const params = template.Parameters;

  test('should have EnvironmentSuffix parameter with constraints', () => {
    expect(params.EnvironmentSuffix).toBeDefined();
    expect(params.EnvironmentSuffix.Type).toBe('String');
    expect(params.EnvironmentSuffix.Default).toBe('dev');
    expect(params.EnvironmentSuffix.AllowedPattern).toBeDefined();
    expect(params.EnvironmentSuffix.MinLength).toBe(1);
    expect(params.EnvironmentSuffix.MaxLength).toBe(10);
  });

  test('should have SSHAllowedCIDR parameter with RFC1918 restriction', () => {
    expect(params.SSHAllowedCIDR).toBeDefined();
    expect(params.SSHAllowedCIDR.Type).toBe('String');
    expect(params.SSHAllowedCIDR.Default).toBe('10.0.0.0/16');
    // Should have AllowedPattern for RFC1918 ranges
    expect(params.SSHAllowedCIDR.AllowedPattern).toBeDefined();
    expect(params.SSHAllowedCIDR.ConstraintDescription).toContain('RFC1918');
  });

  test('should have EnableNATGateway parameter with boolean values', () => {
    expect(params.EnableNATGateway).toBeDefined();
    expect(params.EnableNATGateway.Type).toBe('String');
    expect(params.EnableNATGateway.Default).toBe('false');
    expect(params.EnableNATGateway.AllowedValues).toContain('true');
    expect(params.EnableNATGateway.AllowedValues).toContain('false');
  });
});

describe('Conditions Validation', () => {
  test('should have CreateNATGateway condition', () => {
    expect(template.Conditions.CreateNATGateway).toBeDefined();
  });
});

describe('VPC Resources', () => {
  const resources = template.Resources;

  test('should have VPC resource with correct properties', () => {
    expect(resources.VPC).toBeDefined();
    expect(resources.VPC.Type).toBe('AWS::EC2::VPC');
    expect(resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    expect(resources.VPC.Properties.EnableDnsHostnames).toBe(true);
    expect(resources.VPC.Properties.EnableDnsSupport).toBe(true);
  });

  test('should have VPC tagged with Environment', () => {
    const tags = resources.VPC.Properties.Tags;
    expect(tags).toBeDefined();
    const envTag = tags.find((t: any) => t.Key === 'Environment');
    expect(envTag).toBeDefined();
    expect(envTag.Value).toBe('Production');
  });
});

describe('Internet Gateway Resources', () => {
  const resources = template.Resources;

  test('should have InternetGateway resource', () => {
    expect(resources.InternetGateway).toBeDefined();
    expect(resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
  });

  test('should have InternetGatewayAttachment to VPC', () => {
    expect(resources.InternetGatewayAttachment).toBeDefined();
    expect(resources.InternetGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    expect(resources.InternetGatewayAttachment.Properties.VpcId).toBeDefined();
    expect(resources.InternetGatewayAttachment.Properties.InternetGatewayId).toBeDefined();
  });
});

describe('Subnet Resources', () => {
  const resources = template.Resources;

  describe('Public Subnets', () => {
    test('should have PublicSubnet1 in first AZ', () => {
      expect(resources.PublicSubnet1).toBeDefined();
      expect(resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have PublicSubnet2 in second AZ', () => {
      expect(resources.PublicSubnet2).toBeDefined();
      expect(resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have public subnets with Type tag', () => {
      const subnet1Tags = resources.PublicSubnet1.Properties.Tags;
      const typeTag1 = subnet1Tags.find((t: any) => t.Key === 'Type');
      expect(typeTag1.Value).toBe('Public');

      const subnet2Tags = resources.PublicSubnet2.Properties.Tags;
      const typeTag2 = subnet2Tags.find((t: any) => t.Key === 'Type');
      expect(typeTag2.Value).toBe('Public');
    });
  });

  describe('Private Subnets', () => {
    test('should have PrivateSubnet1 in first AZ', () => {
      expect(resources.PrivateSubnet1).toBeDefined();
      expect(resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('should have PrivateSubnet2 in second AZ', () => {
      expect(resources.PrivateSubnet2).toBeDefined();
      expect(resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.12.0/24');
      expect(resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('should have private subnets with Type tag', () => {
      const subnet1Tags = resources.PrivateSubnet1.Properties.Tags;
      const typeTag1 = subnet1Tags.find((t: any) => t.Key === 'Type');
      expect(typeTag1.Value).toBe('Private');

      const subnet2Tags = resources.PrivateSubnet2.Properties.Tags;
      const typeTag2 = subnet2Tags.find((t: any) => t.Key === 'Type');
      expect(typeTag2.Value).toBe('Private');
    });
  });

  test('should use dynamic AZ selection with GetAZs', () => {
    // Check that subnets use !Select with !GetAZs for dynamic AZ assignment
    const pub1AZ = resources.PublicSubnet1.Properties.AvailabilityZone;
    const pub2AZ = resources.PublicSubnet2.Properties.AvailabilityZone;
    
    expect(pub1AZ).toBeDefined();
    expect(pub2AZ).toBeDefined();
    // They should be Select functions referencing GetAZs
    expect(pub1AZ['Fn::Select']).toBeDefined();
    expect(pub2AZ['Fn::Select']).toBeDefined();
  });
});

describe('NAT Gateway Resources (Conditional)', () => {
  const resources = template.Resources;

  test('should have NatGateway1EIP with condition', () => {
    expect(resources.NatGateway1EIP).toBeDefined();
    expect(resources.NatGateway1EIP.Type).toBe('AWS::EC2::EIP');
    expect(resources.NatGateway1EIP.Condition).toBe('CreateNATGateway');
    expect(resources.NatGateway1EIP.Properties.Domain).toBe('vpc');
  });

  test('should have NatGateway2EIP with condition', () => {
    expect(resources.NatGateway2EIP).toBeDefined();
    expect(resources.NatGateway2EIP.Type).toBe('AWS::EC2::EIP');
    expect(resources.NatGateway2EIP.Condition).toBe('CreateNATGateway');
  });

  test('should have NatGateway1 with condition', () => {
    expect(resources.NatGateway1).toBeDefined();
    expect(resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
    expect(resources.NatGateway1.Condition).toBe('CreateNATGateway');
  });

  test('should have NatGateway2 with condition', () => {
    expect(resources.NatGateway2).toBeDefined();
    expect(resources.NatGateway2.Type).toBe('AWS::EC2::NatGateway');
    expect(resources.NatGateway2.Condition).toBe('CreateNATGateway');
  });

  test('should have NAT Gateways in public subnets', () => {
    const nat1SubnetRef = resources.NatGateway1.Properties.SubnetId;
    const nat2SubnetRef = resources.NatGateway2.Properties.SubnetId;
    
    expect(nat1SubnetRef).toEqual({ Ref: 'PublicSubnet1' });
    expect(nat2SubnetRef).toEqual({ Ref: 'PublicSubnet2' });
  });
});

describe('Route Table Resources', () => {
  const resources = template.Resources;

  test('should have public route table', () => {
    expect(resources.PublicRouteTable).toBeDefined();
    expect(resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
  });

  test('should have default public route to internet gateway', () => {
    expect(resources.DefaultPublicRoute).toBeDefined();
    expect(resources.DefaultPublicRoute.Type).toBe('AWS::EC2::Route');
    expect(resources.DefaultPublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    expect(resources.DefaultPublicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
  });

  test('should have public subnet route table associations', () => {
    expect(resources.PublicSubnet1RouteTableAssociation).toBeDefined();
    expect(resources.PublicSubnet1RouteTableAssociation.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    
    expect(resources.PublicSubnet2RouteTableAssociation).toBeDefined();
    expect(resources.PublicSubnet2RouteTableAssociation.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
  });

  test('should have private route tables for each AZ', () => {
    expect(resources.PrivateRouteTable1).toBeDefined();
    expect(resources.PrivateRouteTable1.Type).toBe('AWS::EC2::RouteTable');
    
    expect(resources.PrivateRouteTable2).toBeDefined();
    expect(resources.PrivateRouteTable2.Type).toBe('AWS::EC2::RouteTable');
  });

  test('should have conditional private routes via NAT gateways', () => {
    expect(resources.DefaultPrivateRoute1).toBeDefined();
    expect(resources.DefaultPrivateRoute1.Condition).toBe('CreateNATGateway');
    expect(resources.DefaultPrivateRoute1.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway1' });
    
    expect(resources.DefaultPrivateRoute2).toBeDefined();
    expect(resources.DefaultPrivateRoute2.Condition).toBe('CreateNATGateway');
    expect(resources.DefaultPrivateRoute2.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway2' });
  });

  test('should have private subnet route table associations', () => {
    expect(resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
    expect(resources.PrivateSubnet1RouteTableAssociation.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
    expect(resources.PrivateSubnet1RouteTableAssociation.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable1' });
    
    expect(resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
    expect(resources.PrivateSubnet2RouteTableAssociation.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
    expect(resources.PrivateSubnet2RouteTableAssociation.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable2' });
  });
});

describe('Security Group Resources', () => {
  const resources = template.Resources;

  describe('Public Web Security Group', () => {
    const sg = () => resources.PublicWebSecurityGroup;

    test('should have public web security group', () => {
      expect(sg()).toBeDefined();
      expect(sg().Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should allow HTTP ingress from anywhere', () => {
      const ingress = sg().Properties.SecurityGroupIngress;
      const httpRule = ingress.find((r: any) => r.FromPort === 80 && r.ToPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpRule.IpProtocol).toBe('tcp');
    });

    test('should allow HTTPS ingress from anywhere', () => {
      const ingress = sg().Properties.SecurityGroupIngress;
      const httpsRule = ingress.find((r: any) => r.FromPort === 443 && r.ToPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.IpProtocol).toBe('tcp');
    });

    test('should have restricted egress (not blanket 0.0.0.0/0 all ports)', () => {
      const egress = sg().Properties.SecurityGroupEgress;
      expect(egress).toBeDefined();
      expect(egress.length).toBeGreaterThan(0);
      
      // Should NOT have blanket all-traffic egress
      const blanketEgress = egress.find((r: any) => 
        r.IpProtocol === '-1' && r.CidrIp === '0.0.0.0/0'
      );
      expect(blanketEgress).toBeUndefined();
    });

    test('should allow DNS egress for web services', () => {
      const egress = sg().Properties.SecurityGroupEgress;
      const dnsUdp = egress.find((r: any) => r.FromPort === 53 && r.IpProtocol === 'udp');
      const dnsTcp = egress.find((r: any) => r.FromPort === 53 && r.IpProtocol === 'tcp');
      expect(dnsUdp).toBeDefined();
      expect(dnsTcp).toBeDefined();
    });
  });

  describe('Private SSH Security Group', () => {
    const sg = () => resources.PrivateSSHSecurityGroup;

    test('should have private SSH security group', () => {
      expect(sg()).toBeDefined();
      expect(sg().Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should allow SSH only from SSHAllowedCIDR parameter', () => {
      const ingress = sg().Properties.SecurityGroupIngress;
      expect(ingress.length).toBe(1);
      
      const sshRule = ingress[0];
      expect(sshRule.FromPort).toBe(22);
      expect(sshRule.ToPort).toBe(22);
      expect(sshRule.IpProtocol).toBe('tcp');
      // Should reference the SSHAllowedCIDR parameter
      expect(sshRule.CidrIp).toEqual({ Ref: 'SSHAllowedCIDR' });
    });

    test('should have restricted egress', () => {
      const egress = sg().Properties.SecurityGroupEgress;
      expect(egress).toBeDefined();
      expect(egress.length).toBeGreaterThan(0);
      
      // Should NOT have blanket all-traffic egress
      const blanketEgress = egress.find((r: any) => 
        r.IpProtocol === '-1' && r.CidrIp === '0.0.0.0/0'
      );
      expect(blanketEgress).toBeUndefined();
    });

    test('should allow SSH within VPC for internal management', () => {
      const egress = sg().Properties.SecurityGroupEgress;
      const sshInternal = egress.find((r: any) => 
        r.FromPort === 22 && r.ToPort === 22 && r.CidrIp === '10.0.0.0/16'
      );
      expect(sshInternal).toBeDefined();
    });
  });
});

describe('Network ACL Resources', () => {
  const resources = template.Resources;

  test('should have Network ACL resource', () => {
    expect(resources.NetworkAcl).toBeDefined();
    expect(resources.NetworkAcl.Type).toBe('AWS::EC2::NetworkAcl');
  });

  test('should have NACL associated with private subnets only', () => {
    expect(resources.PrivateSubnet1NetworkAclAssociation).toBeDefined();
    expect(resources.PrivateSubnet1NetworkAclAssociation.Type).toBe('AWS::EC2::SubnetNetworkAclAssociation');
    expect(resources.PrivateSubnet1NetworkAclAssociation.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
    
    expect(resources.PrivateSubnet2NetworkAclAssociation).toBeDefined();
    expect(resources.PrivateSubnet2NetworkAclAssociation.Type).toBe('AWS::EC2::SubnetNetworkAclAssociation');
    expect(resources.PrivateSubnet2NetworkAclAssociation.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
  });

  test('should NOT have NACL associated with public subnets', () => {
    // Check that there are no public subnet NACL associations
    const publicSubnet1NaclAssoc = Object.entries(resources).find(([key, value]: [string, any]) => 
      value.Type === 'AWS::EC2::SubnetNetworkAclAssociation' &&
      JSON.stringify(value.Properties.SubnetId) === JSON.stringify({ Ref: 'PublicSubnet1' })
    );
    const publicSubnet2NaclAssoc = Object.entries(resources).find(([key, value]: [string, any]) => 
      value.Type === 'AWS::EC2::SubnetNetworkAclAssociation' &&
      JSON.stringify(value.Properties.SubnetId) === JSON.stringify({ Ref: 'PublicSubnet2' })
    );
    
    expect(publicSubnet1NaclAssoc).toBeUndefined();
    expect(publicSubnet2NaclAssoc).toBeUndefined();
  });

  describe('NACL Entries', () => {
    test('should have inbound SSH rule', () => {
      expect(resources.NetworkAclEntryInboundSSH).toBeDefined();
      expect(resources.NetworkAclEntryInboundSSH.Type).toBe('AWS::EC2::NetworkAclEntry');
      expect(resources.NetworkAclEntryInboundSSH.Properties.PortRange.From).toBe(22);
      expect(resources.NetworkAclEntryInboundSSH.Properties.PortRange.To).toBe(22);
      expect(resources.NetworkAclEntryInboundSSH.Properties.RuleAction).toBe('allow');
      expect(resources.NetworkAclEntryInboundSSH.Properties.CidrBlock).toEqual({ Ref: 'SSHAllowedCIDR' });
    });

    test('should have inbound HTTP rule', () => {
      expect(resources.NetworkAclEntryInboundHTTP).toBeDefined();
      expect(resources.NetworkAclEntryInboundHTTP.Properties.PortRange.From).toBe(80);
      expect(resources.NetworkAclEntryInboundHTTP.Properties.PortRange.To).toBe(80);
      expect(resources.NetworkAclEntryInboundHTTP.Properties.RuleAction).toBe('allow');
    });

    test('should have inbound HTTPS rule', () => {
      expect(resources.NetworkAclEntryInboundHTTPS).toBeDefined();
      expect(resources.NetworkAclEntryInboundHTTPS.Properties.PortRange.From).toBe(443);
      expect(resources.NetworkAclEntryInboundHTTPS.Properties.PortRange.To).toBe(443);
      expect(resources.NetworkAclEntryInboundHTTPS.Properties.RuleAction).toBe('allow');
    });

    test('should have inbound ephemeral ports rule', () => {
      expect(resources.NetworkAclEntryInboundEphemeral).toBeDefined();
      expect(resources.NetworkAclEntryInboundEphemeral.Properties.PortRange.From).toBe(1024);
      expect(resources.NetworkAclEntryInboundEphemeral.Properties.PortRange.To).toBe(65535);
      expect(resources.NetworkAclEntryInboundEphemeral.Properties.RuleAction).toBe('allow');
    });

    test('should have outbound rule', () => {
      expect(resources.NetworkAclEntryOutbound).toBeDefined();
      expect(resources.NetworkAclEntryOutbound.Properties.Egress).toBe(true);
      expect(resources.NetworkAclEntryOutbound.Properties.RuleAction).toBe('allow');
    });
  });
});

describe('Outputs Validation', () => {
  const outputs = template.Outputs;

  describe('Core Outputs', () => {
    test('should have VPC output', () => {
      expect(outputs.VPC).toBeDefined();
      expect(outputs.VPC.Value).toEqual({ Ref: 'VPC' });
      expect(outputs.VPC.Export).toBeDefined();
    });

    test('should have EnvironmentSuffix output', () => {
      expect(outputs.EnvironmentSuffix).toBeDefined();
      expect(outputs.EnvironmentSuffix.Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('should have StackName output', () => {
      expect(outputs.StackName).toBeDefined();
    });
  });

  describe('Availability Zone Outputs', () => {
    test('should have AZ outputs', () => {
      expect(outputs.AvailabilityZone1).toBeDefined();
      expect(outputs.AvailabilityZone2).toBeDefined();
    });
  });

  describe('Subnet Outputs', () => {
    test('should have all subnet ID outputs', () => {
      expect(outputs.PublicSubnet1).toBeDefined();
      expect(outputs.PublicSubnet2).toBeDefined();
      expect(outputs.PrivateSubnet1).toBeDefined();
      expect(outputs.PrivateSubnet2).toBeDefined();
    });

    test('should have all subnet CIDR outputs', () => {
      expect(outputs.PublicSubnet1CIDR).toBeDefined();
      expect(outputs.PublicSubnet1CIDR.Value).toBe('10.0.1.0/24');
      
      expect(outputs.PublicSubnet2CIDR).toBeDefined();
      expect(outputs.PublicSubnet2CIDR.Value).toBe('10.0.2.0/24');
      
      expect(outputs.PrivateSubnet1CIDR).toBeDefined();
      expect(outputs.PrivateSubnet1CIDR.Value).toBe('10.0.11.0/24');
      
      expect(outputs.PrivateSubnet2CIDR).toBeDefined();
      expect(outputs.PrivateSubnet2CIDR.Value).toBe('10.0.12.0/24');
    });
  });

  describe('Security Group Outputs', () => {
    test('should have security group outputs', () => {
      expect(outputs.PublicWebSecurityGroup).toBeDefined();
      expect(outputs.PrivateSSHSecurityGroup).toBeDefined();
    });
  });

  describe('NAT Gateway Outputs (Conditional)', () => {
    test('should have conditional NAT Gateway outputs', () => {
      expect(outputs.NatGateway1).toBeDefined();
      expect(outputs.NatGateway1.Condition).toBe('CreateNATGateway');
      
      expect(outputs.NatGateway2).toBeDefined();
      expect(outputs.NatGateway2.Condition).toBe('CreateNATGateway');
    });

    test('should have conditional NAT Gateway EIP outputs', () => {
      expect(outputs.NatGateway1EIP).toBeDefined();
      expect(outputs.NatGateway1EIP.Condition).toBe('CreateNATGateway');
      
      expect(outputs.NatGateway2EIP).toBeDefined();
      expect(outputs.NatGateway2EIP.Condition).toBe('CreateNATGateway');
    });
  });

  describe('Networking Outputs', () => {
    test('should have InternetGateway output', () => {
      expect(outputs.InternetGateway).toBeDefined();
    });

    test('should have route table outputs', () => {
      expect(outputs.PublicRouteTable).toBeDefined();
      expect(outputs.PrivateRouteTable1).toBeDefined();
      expect(outputs.PrivateRouteTable2).toBeDefined();
    });

    test('should have NetworkAcl output', () => {
      expect(outputs.NetworkAcl).toBeDefined();
    });

    test('should have VPCCIDR output', () => {
      expect(outputs.VPCCIDR).toBeDefined();
      expect(outputs.VPCCIDR.Value).toBe('10.0.0.0/16');
    });
  });

  describe('Metadata Outputs', () => {
    test('should have region output', () => {
      expect(outputs.AWSRegion).toBeDefined();
    });

    test('should have high availability confirmation output', () => {
      expect(outputs.HighAvailabilityEnabled).toBeDefined();
      expect(outputs.HighAvailabilityEnabled.Value).toBe('true');
    });
  });
});

describe('Resource Tagging Standards', () => {
  const resources = template.Resources;
  const taggedResources = ['VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2', 
    'PrivateSubnet1', 'PrivateSubnet2', 'PublicRouteTable', 'PrivateRouteTable1', 
    'PrivateRouteTable2', 'PublicWebSecurityGroup', 'PrivateSSHSecurityGroup', 'NetworkAcl'];

  test('all major resources should have Environment tag', () => {
    taggedResources.forEach(resourceName => {
      const resource = resources[resourceName];
      if (resource && resource.Properties && resource.Properties.Tags) {
        const envTag = resource.Properties.Tags.find((t: any) => t.Key === 'Environment');
        expect(envTag).toBeDefined();
        expect(envTag.Value).toBe('Production');
      }
    });
  });

  test('all major resources should have Name tag with unique identifier', () => {
    taggedResources.forEach(resourceName => {
      const resource = resources[resourceName];
      if (resource && resource.Properties && resource.Properties.Tags) {
        const nameTag = resource.Properties.Tags.find((t: any) => t.Key === 'Name');
        expect(nameTag).toBeDefined();
        // Name should include account ID for uniqueness
        expect(JSON.stringify(nameTag.Value)).toContain('AWS::AccountId');
      }
    });
  });

  test('all major resources should have EnvironmentSuffix tag', () => {
    taggedResources.forEach(resourceName => {
      const resource = resources[resourceName];
      if (resource && resource.Properties && resource.Properties.Tags) {
        const suffixTag = resource.Properties.Tags.find((t: any) => t.Key === 'EnvironmentSuffix');
        expect(suffixTag).toBeDefined();
        expect(suffixTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      }
    });
  });
});

describe('High Availability Architecture', () => {
  const resources = template.Resources;

  test('should have subnets in two different AZs', () => {
    const pub1AZ = resources.PublicSubnet1.Properties.AvailabilityZone['Fn::Select'][0];
    const pub2AZ = resources.PublicSubnet2.Properties.AvailabilityZone['Fn::Select'][0];
    
    expect(pub1AZ).toBe(0);
    expect(pub2AZ).toBe(1);
  });

  test('should have NAT gateway in each AZ for HA', () => {
    expect(resources.NatGateway1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    expect(resources.NatGateway2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
  });

  test('should have separate route tables for each private subnet', () => {
    expect(resources.PrivateSubnet1RouteTableAssociation.Properties.RouteTableId)
      .toEqual({ Ref: 'PrivateRouteTable1' });
    expect(resources.PrivateSubnet2RouteTableAssociation.Properties.RouteTableId)
      .toEqual({ Ref: 'PrivateRouteTable2' });
  });
});

describe('Security Best Practices', () => {
  const resources = template.Resources;

  test('should not allow SSH from 0.0.0.0/0', () => {
    const sshSG = resources.PrivateSSHSecurityGroup;
    const ingress = sshSG.Properties.SecurityGroupIngress;
    
    const sshFromAnywhere = ingress.find((r: any) => 
      r.FromPort === 22 && r.CidrIp === '0.0.0.0/0'
    );
    expect(sshFromAnywhere).toBeUndefined();
  });

  test('should use parameterized CIDR for SSH access', () => {
    const sshSG = resources.PrivateSSHSecurityGroup;
    const ingress = sshSG.Properties.SecurityGroupIngress;
    
    const sshRule = ingress.find((r: any) => r.FromPort === 22);
    expect(sshRule.CidrIp).toEqual({ Ref: 'SSHAllowedCIDR' });
  });

  test('should have restricted egress on security groups', () => {
    const publicSG = resources.PublicWebSecurityGroup;
    const privateSG = resources.PrivateSSHSecurityGroup;
    
    // Both should have explicit egress rules (not relying on default)
    expect(publicSG.Properties.SecurityGroupEgress).toBeDefined();
    expect(publicSG.Properties.SecurityGroupEgress.length).toBeGreaterThan(0);
    
    expect(privateSG.Properties.SecurityGroupEgress).toBeDefined();
    expect(privateSG.Properties.SecurityGroupEgress.length).toBeGreaterThan(0);
  });

  test('should have NACL as defense in depth for private subnets', () => {
    expect(resources.NetworkAcl).toBeDefined();
    expect(resources.PrivateSubnet1NetworkAclAssociation).toBeDefined();
    expect(resources.PrivateSubnet2NetworkAclAssociation).toBeDefined();
  });

  test('private subnets should not auto-assign public IPs', () => {
    expect(resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
    expect(resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBeUndefined();
  });
});

describe('Resource Count Validation', () => {
  const resources = template.Resources;
  const resourceCount = Object.keys(resources).length;

  test('should have expected number of resources', () => {
    // VPC (1) + IGW (2) + Subnets (4) + NAT EIPs (2) + NAT GWs (2) + 
    // Route Tables (3) + Routes (3) + RT Associations (4) + 
    // Security Groups (2) + NACL (1) + NACL Entries (5) + NACL Associations (2)
    // Total: ~31 resources
    expect(resourceCount).toBeGreaterThanOrEqual(25);
    expect(resourceCount).toBeLessThanOrEqual(35);
  });

  test('should have 4 subnets total', () => {
    const subnetResources = Object.entries(resources).filter(([_, v]: [string, any]) => 
      v.Type === 'AWS::EC2::Subnet'
    );
    expect(subnetResources.length).toBe(4);
  });

  test('should have 2 security groups', () => {
    const sgResources = Object.entries(resources).filter(([_, v]: [string, any]) => 
      v.Type === 'AWS::EC2::SecurityGroup'
    );
    expect(sgResources.length).toBe(2);
  });
});

