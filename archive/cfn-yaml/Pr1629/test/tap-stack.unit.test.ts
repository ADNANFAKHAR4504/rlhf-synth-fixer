import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - High Availability Network Infrastructure', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON CloudFormation template
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description for high availability infrastructure', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('High-Availability');
      expect(template.Description).toContain('Multi-AZ');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter with proper validation', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toContain('Environment suffix');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toContain('alphanumeric characters');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(10);
    });

    test('should have SSHAllowedCIDR parameter with security restrictions', () => {
      const param = template.Parameters.SSHAllowedCIDR;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.Description).toContain('private subnets');
      expect(param.Description).toContain('restricted to private ranges');
      expect(param.AllowedPattern).toContain('10\\.');
      expect(param.AllowedPattern).toContain('172\\.');
      expect(param.AllowedPattern).toContain('192\\.168\\.');
      expect(param.ConstraintDescription).toContain('RFC1918');
    });

    test('should have exactly 2 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });
  });

  describe('Core Network Resources', () => {
    test('should have VPC with proper configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      
      // Check naming convention with environment suffix and account ID
      const nameTag = vpc.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toBe('HA-Prod-VPC-${EnvironmentSuffix}-${AWS::AccountId}');
    });

    test('should have Internet Gateway with proper tagging', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      
      const nameTag = igw.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toBe('HA-Prod-IGW-${EnvironmentSuffix}-${AWS::AccountId}');
    });

    test('should have Internet Gateway attachment', () => {
      const attachment = template.Resources.InternetGatewayAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.InternetGatewayId.Ref).toBe('InternetGateway');
      expect(attachment.Properties.VpcId.Ref).toBe('VPC');
    });
  });

  describe('Subnet Resources', () => {
    test('should have public subnet 1 with dynamic AZ selection', () => {
      const subnet = template.Resources.PublicSubnet1;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.VpcId.Ref).toBe('VPC');
      expect(subnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      
      // Check dynamic AZ selection
      expect(subnet.Properties.AvailabilityZone['Fn::Select']).toEqual([0, {'Fn::GetAZs': ''}]);
      
      // Check naming convention
      const nameTag = subnet.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toBe('HA-Prod-PubSub1-${EnvironmentSuffix}-${AWS::AccountId}');
    });

    test('should have public subnet 2 with dynamic AZ selection', () => {
      const subnet = template.Resources.PublicSubnet2;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.VpcId.Ref).toBe('VPC');
      expect(subnet.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      
      // Check dynamic AZ selection (different AZ)
      expect(subnet.Properties.AvailabilityZone['Fn::Select']).toEqual([1, {'Fn::GetAZs': ''}]);
    });

    test('should have private subnet 1 with dynamic AZ selection', () => {
      const subnet = template.Resources.PrivateSubnet1;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.VpcId.Ref).toBe('VPC');
      expect(subnet.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBeUndefined();
      
      // Check dynamic AZ selection
      expect(subnet.Properties.AvailabilityZone['Fn::Select']).toEqual([0, {'Fn::GetAZs': ''}]);
    });

    test('should have private subnet 2 with dynamic AZ selection', () => {
      const subnet = template.Resources.PrivateSubnet2;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.VpcId.Ref).toBe('VPC');
      expect(subnet.Properties.CidrBlock).toBe('10.0.12.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBeUndefined();
      
      // Check dynamic AZ selection (different AZ)
      expect(subnet.Properties.AvailabilityZone['Fn::Select']).toEqual([1, {'Fn::GetAZs': ''}]);
    });
  });

  describe('NAT Gateway Resources', () => {
    test('should have NAT Gateway 1 EIP with dependencies', () => {
      const eip = template.Resources.NatGateway1EIP;
      expect(eip).toBeDefined();
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.DependsOn).toBe('InternetGatewayAttachment');
      
      const nameTag = eip.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toBe('HA-Prod-NAT1-EIP-${EnvironmentSuffix}-${AWS::AccountId}');
    });

    test('should have NAT Gateway 2 EIP with dependencies', () => {
      const eip = template.Resources.NatGateway2EIP;
      expect(eip).toBeDefined();
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('should have NAT Gateway 1 in public subnet 1', () => {
      const natGw = template.Resources.NatGateway1;
      expect(natGw).toBeDefined();
      expect(natGw.Type).toBe('AWS::EC2::NatGateway');
      expect(natGw.Properties.AllocationId['Fn::GetAtt']).toEqual(['NatGateway1EIP', 'AllocationId']);
      expect(natGw.Properties.SubnetId.Ref).toBe('PublicSubnet1');
    });

    test('should have NAT Gateway 2 in public subnet 2', () => {
      const natGw = template.Resources.NatGateway2;
      expect(natGw).toBeDefined();
      expect(natGw.Type).toBe('AWS::EC2::NatGateway');
      expect(natGw.Properties.AllocationId['Fn::GetAtt']).toEqual(['NatGateway2EIP', 'AllocationId']);
      expect(natGw.Properties.SubnetId.Ref).toBe('PublicSubnet2');
    });
  });

  describe('Route Tables and Routes', () => {
    test('should have public route table with internet route', () => {
      const routeTable = template.Resources.PublicRouteTable;
      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId.Ref).toBe('VPC');
      
      const defaultRoute = template.Resources.DefaultPublicRoute;
      expect(defaultRoute).toBeDefined();
      expect(defaultRoute.Type).toBe('AWS::EC2::Route');
      expect(defaultRoute.Properties.RouteTableId.Ref).toBe('PublicRouteTable');
      expect(defaultRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(defaultRoute.Properties.GatewayId.Ref).toBe('InternetGateway');
      expect(defaultRoute.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('should have private route table 1 with NAT Gateway 1 route', () => {
      const routeTable = template.Resources.PrivateRouteTable1;
      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId.Ref).toBe('VPC');
      
      const defaultRoute = template.Resources.DefaultPrivateRoute1;
      expect(defaultRoute).toBeDefined();
      expect(defaultRoute.Type).toBe('AWS::EC2::Route');
      expect(defaultRoute.Properties.RouteTableId.Ref).toBe('PrivateRouteTable1');
      expect(defaultRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(defaultRoute.Properties.NatGatewayId.Ref).toBe('NatGateway1');
    });

    test('should have private route table 2 with NAT Gateway 2 route', () => {
      const routeTable = template.Resources.PrivateRouteTable2;
      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId.Ref).toBe('VPC');
      
      const defaultRoute = template.Resources.DefaultPrivateRoute2;
      expect(defaultRoute).toBeDefined();
      expect(defaultRoute.Type).toBe('AWS::EC2::Route');
      expect(defaultRoute.Properties.RouteTableId.Ref).toBe('PrivateRouteTable2');
      expect(defaultRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(defaultRoute.Properties.NatGatewayId.Ref).toBe('NatGateway2');
    });

    test('should have subnet route table associations', () => {
      // Public subnet associations
      const pubSub1Assoc = template.Resources.PublicSubnet1RouteTableAssociation;
      expect(pubSub1Assoc).toBeDefined();
      expect(pubSub1Assoc.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(pubSub1Assoc.Properties.RouteTableId.Ref).toBe('PublicRouteTable');
      expect(pubSub1Assoc.Properties.SubnetId.Ref).toBe('PublicSubnet1');

      const pubSub2Assoc = template.Resources.PublicSubnet2RouteTableAssociation;
      expect(pubSub2Assoc).toBeDefined();
      expect(pubSub2Assoc.Properties.RouteTableId.Ref).toBe('PublicRouteTable');
      expect(pubSub2Assoc.Properties.SubnetId.Ref).toBe('PublicSubnet2');

      // Private subnet associations
      const privSub1Assoc = template.Resources.PrivateSubnet1RouteTableAssociation;
      expect(privSub1Assoc).toBeDefined();
      expect(privSub1Assoc.Properties.RouteTableId.Ref).toBe('PrivateRouteTable1');
      expect(privSub1Assoc.Properties.SubnetId.Ref).toBe('PrivateSubnet1');

      const privSub2Assoc = template.Resources.PrivateSubnet2RouteTableAssociation;
      expect(privSub2Assoc).toBeDefined();
      expect(privSub2Assoc.Properties.RouteTableId.Ref).toBe('PrivateRouteTable2');
      expect(privSub2Assoc.Properties.SubnetId.Ref).toBe('PrivateSubnet2');
    });
  });

  describe('Security Groups', () => {
    test('should have public web security group with restricted egress', () => {
      const sg = template.Resources.PublicWebSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId.Ref).toBe('VPC');
      expect(sg.Properties.GroupDescription).toContain('restricted egress');
      
      // Check ingress rules
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      expect(ingress[0]).toEqual({
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80,
        CidrIp: '0.0.0.0/0',
        Description: 'Allow HTTP traffic from anywhere'
      });
      expect(ingress[1]).toEqual({
        IpProtocol: 'tcp',
        FromPort: 443,
        ToPort: 443,
        CidrIp: '0.0.0.0/0',
        Description: 'Allow HTTPS traffic from anywhere'
      });

      // Check restricted egress rules (no blanket 0.0.0.0/0 -1 rule)
      const egress = sg.Properties.SecurityGroupEgress;
      expect(egress).toHaveLength(4);
      expect(egress.some((rule: any) => rule.IpProtocol === -1)).toBe(false);
      
      // Check specific egress rules
      const httpEgress = egress.find((rule: any) => rule.FromPort === 80);
      expect(httpEgress).toBeDefined();
      expect(httpEgress.IpProtocol).toBe('tcp');
      expect(httpEgress.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have private SSH security group with restricted access and egress', () => {
      const sg = template.Resources.PrivateSSHSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId.Ref).toBe('VPC');
      expect(sg.Properties.GroupDescription).toContain('private CIDR');
      expect(sg.Properties.GroupDescription).toContain('restricted egress');
      
      // Check ingress rules (only SSH from private CIDR)
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0]).toEqual({
        IpProtocol: 'tcp',
        FromPort: 22,
        ToPort: 22,
        CidrIp: { Ref: 'SSHAllowedCIDR' },
        Description: 'Allow SSH access from specified private CIDR range only'
      });

      // Check restricted egress rules (no blanket -1 rule)
      const egress = sg.Properties.SecurityGroupEgress;
      expect(egress).toHaveLength(5);
      expect(egress.some((rule: any) => rule.IpProtocol === -1)).toBe(false);
      
      // Check VPC SSH rule
      const vpcSshEgress = egress.find((rule: any) => rule.FromPort === 22 && rule.CidrIp === '10.0.0.0/16');
      expect(vpcSshEgress).toBeDefined();
      expect(vpcSshEgress.Description).toBe('Allow SSH to other instances within VPC');
    });
  });

  describe('Network ACL', () => {
    test('should have network ACL with proper rules', () => {
      const nacl = template.Resources.NetworkAcl;
      expect(nacl).toBeDefined();
      expect(nacl.Type).toBe('AWS::EC2::NetworkAcl');
      expect(nacl.Properties.VpcId.Ref).toBe('VPC');
      
      // Check SSH rule
      const sshRule = template.Resources.NetworkAclEntryInboundSSH;
      expect(sshRule).toBeDefined();
      expect(sshRule.Properties.NetworkAclId.Ref).toBe('NetworkAcl');
      expect(sshRule.Properties.RuleNumber).toBe(90);
      expect(sshRule.Properties.Protocol).toBe(6);
      expect(sshRule.Properties.RuleAction).toBe('allow');
      expect(sshRule.Properties.PortRange).toEqual({ From: 22, To: 22 });
      expect(sshRule.Properties.CidrBlock.Ref).toBe('SSHAllowedCIDR');

      // Check HTTP rule
      const httpRule = template.Resources.NetworkAclEntryInboundHTTP;
      expect(httpRule).toBeDefined();
      expect(httpRule.Properties.RuleNumber).toBe(100);
      expect(httpRule.Properties.PortRange).toEqual({ From: 80, To: 80 });

      // Check HTTPS rule
      const httpsRule = template.Resources.NetworkAclEntryInboundHTTPS;
      expect(httpsRule).toBeDefined();
      expect(httpsRule.Properties.RuleNumber).toBe(110);
      expect(httpsRule.Properties.PortRange).toEqual({ From: 443, To: 443 });

      // Check ephemeral ports rule
      const ephemeralRule = template.Resources.NetworkAclEntryInboundEphemeral;
      expect(ephemeralRule).toBeDefined();
      expect(ephemeralRule.Properties.RuleNumber).toBe(120);
      expect(ephemeralRule.Properties.PortRange).toEqual({ From: 1024, To: 65535 });

      // Check outbound rule
      const outboundRule = template.Resources.NetworkAclEntryOutbound;
      expect(outboundRule).toBeDefined();
      expect(outboundRule.Properties.Egress).toBe(true);
      expect(outboundRule.Properties.Protocol).toBe(-1);
    });

    test('should have network ACL associations with private subnets only', () => {
      const privSub1Assoc = template.Resources.PrivateSubnet1NetworkAclAssociation;
      expect(privSub1Assoc).toBeDefined();
      expect(privSub1Assoc.Type).toBe('AWS::EC2::SubnetNetworkAclAssociation');
      expect(privSub1Assoc.Properties.SubnetId.Ref).toBe('PrivateSubnet1');
      expect(privSub1Assoc.Properties.NetworkAclId.Ref).toBe('NetworkAcl');

      const privSub2Assoc = template.Resources.PrivateSubnet2NetworkAclAssociation;
      expect(privSub2Assoc).toBeDefined();
      expect(privSub2Assoc.Properties.SubnetId.Ref).toBe('PrivateSubnet2');
      expect(privSub2Assoc.Properties.NetworkAclId.Ref).toBe('NetworkAcl');
    });
  });

  describe('Resource Count Validation', () => {
    test('should have exactly 31 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(31);
    });

    test('should have all expected resource types', () => {
      const resourceTypes = Object.values(template.Resources).map((resource: any) => resource.Type);
      const expectedTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::VPCGatewayAttachment',
        'AWS::EC2::Subnet', // 4 subnets
        'AWS::EC2::EIP', // 2 EIPs
        'AWS::EC2::NatGateway', // 2 NAT Gateways
        'AWS::EC2::RouteTable', // 3 route tables
        'AWS::EC2::Route', // 3 routes
        'AWS::EC2::SubnetRouteTableAssociation', // 4 associations
        'AWS::EC2::SecurityGroup', // 2 security groups
        'AWS::EC2::NetworkAcl', // 1 network ACL
        'AWS::EC2::NetworkAclEntry', // 4 ACL entries
        'AWS::EC2::SubnetNetworkAclAssociation' // 2 ACL associations
      ];
      
      // Check that all expected types are present
      expectedTypes.forEach(type => {
        expect(resourceTypes.includes(type)).toBe(true);
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should follow naming convention with environment suffix and account ID', () => {
      const resourcesWithNames = [
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2',
        'PrivateSubnet1', 'PrivateSubnet2', 'NatGateway1EIP', 'NatGateway2EIP',
        'NatGateway1', 'NatGateway2', 'PublicRouteTable', 'PrivateRouteTable1',
        'PrivateRouteTable2', 'PublicWebSecurityGroup', 'PrivateSSHSecurityGroup',
        'NetworkAcl'
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Name');
          if (nameTag) {
            expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
            expect(nameTag.Value['Fn::Sub']).toContain('${AWS::AccountId}');
          }
        }
        if (resource.Properties.GroupName) {
          expect(resource.Properties.GroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
          expect(resource.Properties.GroupName['Fn::Sub']).toContain('${AWS::AccountId}');
        }
      });
    });

    test('all resources should have EnvironmentSuffix tag', () => {
      const resourcesWithTags = Object.keys(template.Resources).filter(resourceName => {
        return template.Resources[resourceName].Properties.Tags;
      });

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const envSuffixTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'EnvironmentSuffix');
        expect(envSuffixTag).toBeDefined();
        expect(envSuffixTag.Value.Ref).toBe('EnvironmentSuffix');
      });
    });
  });

  describe('Outputs', () => {
    test('should have comprehensive outputs for integration testing', () => {
      const expectedOutputs = [
        'VPC', 'EnvironmentSuffix', 'StackName', 'AvailabilityZone1', 'AvailabilityZone2',
        'PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2',
        'PublicSubnet1CIDR', 'PublicSubnet2CIDR', 'PrivateSubnet1CIDR', 'PrivateSubnet2CIDR',
        'PublicWebSecurityGroup', 'PrivateSSHSecurityGroup',
        'NatGateway1', 'NatGateway2', 'NatGateway1EIP', 'NatGateway2EIP',
        'InternetGateway', 'PublicRouteTable', 'PrivateRouteTable1', 'PrivateRouteTable2',
        'NetworkAcl', 'VPCCIDR', 'AWSRegion', 'HighAvailabilityEnabled'
      ];

      expect(Object.keys(template.Outputs)).toHaveLength(27);
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
        expect(template.Outputs[outputName].Export).toBeDefined();
        expect(template.Outputs[outputName].Export.Name).toBeDefined();
      });
    });

    test('should have high availability confirmation output', () => {
      const haOutput = template.Outputs.HighAvailabilityEnabled;
      expect(haOutput).toBeDefined();
      expect(haOutput.Description).toContain('high availability');
      expect(haOutput.Value).toBe('true');
    });

    test('should have AZ information outputs', () => {
      const az1Output = template.Outputs.AvailabilityZone1;
      expect(az1Output).toBeDefined();
      expect(az1Output.Value['Fn::Select']).toEqual([0, {'Fn::GetAZs': ''}]);

      const az2Output = template.Outputs.AvailabilityZone2;
      expect(az2Output).toBeDefined();
      expect(az2Output.Value['Fn::Select']).toEqual([1, {'Fn::GetAZs': ''}]);
    });

    test('output export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name['Fn::Sub']).toMatch(/^\${AWS::StackName}-.+$/);
      });
    });
  });

  describe('Security Validation', () => {
    test('should not have any resources with blanket security group egress rules', () => {
      const securityGroups = Object.keys(template.Resources)
        .map(key => template.Resources[key])
        .filter(resource => resource.Type === 'AWS::EC2::SecurityGroup');

      securityGroups.forEach(sg => {
        const egress = sg.Properties.SecurityGroupEgress || [];
        const blanketRules = egress.filter((rule: any) => 
          rule.IpProtocol === -1 || 
          (rule.IpProtocol === '-1' && rule.CidrIp === '0.0.0.0/0')
        );
        expect(blanketRules).toHaveLength(0);
      });
    });

    test('should restrict SSH access to private CIDR ranges only', () => {
      const sshParam = template.Parameters.SSHAllowedCIDR;
      expect(sshParam.Default).toBe('10.0.0.0/16'); // More restrictive than /8
      expect(sshParam.AllowedPattern).not.toContain('0.0.0.0/0');
    });

    test('should have Network ACL only on private subnets', () => {
      const naclAssociations = Object.keys(template.Resources)
        .map(key => ({ key, resource: template.Resources[key] }))
        .filter(({ resource }) => resource.Type === 'AWS::EC2::SubnetNetworkAclAssociation');

      expect(naclAssociations).toHaveLength(2);
      naclAssociations.forEach(({ resource }) => {
        const subnetRef = resource.Properties.SubnetId.Ref;
        expect(subnetRef).toMatch(/^PrivateSubnet/);
      });
    });
  });

  describe('High Availability Validation', () => {
    test('should have resources distributed across multiple AZs', () => {
      // Check subnets use different AZs
      const pubSub1 = template.Resources.PublicSubnet1;
      const pubSub2 = template.Resources.PublicSubnet2;
      const privSub1 = template.Resources.PrivateSubnet1;
      const privSub2 = template.Resources.PrivateSubnet2;

      expect(pubSub1.Properties.AvailabilityZone['Fn::Select']).toEqual([0, {'Fn::GetAZs': ''}]);
      expect(pubSub2.Properties.AvailabilityZone['Fn::Select']).toEqual([1, {'Fn::GetAZs': ''}]);
      expect(privSub1.Properties.AvailabilityZone['Fn::Select']).toEqual([0, {'Fn::GetAZs': ''}]);
      expect(privSub2.Properties.AvailabilityZone['Fn::Select']).toEqual([1, {'Fn::GetAZs': ''}]);
    });

    test('should have NAT Gateways in different AZs for high availability', () => {
      const natGw1 = template.Resources.NatGateway1;
      const natGw2 = template.Resources.NatGateway2;
      
      expect(natGw1.Properties.SubnetId.Ref).toBe('PublicSubnet1');
      expect(natGw2.Properties.SubnetId.Ref).toBe('PublicSubnet2');
    });

    test('should have separate route tables for private subnets', () => {
      const privRT1 = template.Resources.PrivateRouteTable1;
      const privRT2 = template.Resources.PrivateRouteTable2;
      const privRoute1 = template.Resources.DefaultPrivateRoute1;
      const privRoute2 = template.Resources.DefaultPrivateRoute2;

      expect(privRT1).toBeDefined();
      expect(privRT2).toBeDefined();
      expect(privRoute1.Properties.NatGatewayId.Ref).toBe('NatGateway1');
      expect(privRoute2.Properties.NatGatewayId.Ref).toBe('NatGateway2');
    });
  });
});