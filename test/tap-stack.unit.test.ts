// Unit tests for CloudFormation template JSON structure validation
import fs from 'fs';
import path from 'path';

describe('CloudFormation Template Unit Tests', () => {
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

    test('should have appropriate description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Production-grade AWS networking infrastructure');
      expect(template.Description).toContain('VPC');
      expect(template.Description).toContain('dual AZ');
    });

    test('should have required sections', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters Validation', () => {
    test('should have EnvironmentSuffix parameter with correct constraints', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.Description).toContain('Environment suffix');
    });

    test('should have VPC CIDR parameter with IP validation', () => {
      const param = template.Parameters.VpcCidr;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toBeDefined();
      expect(param.AllowedPattern).toContain('([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])');
    });

    test('should have all subnet CIDR parameters', () => {
      const subnetParams = ['PublicSubnet1Cidr', 'PublicSubnet2Cidr', 'PrivateSubnet1Cidr', 'PrivateSubnet2Cidr'];
      
      subnetParams.forEach(paramName => {
        const param = template.Parameters[paramName];
        expect(param).toBeDefined();
        expect(param.Type).toBe('String');
        expect(param.AllowedPattern).toBeDefined();
        expect(param.Description).toContain('CIDR block');
      });

      // Check default values
      expect(template.Parameters.PublicSubnet1Cidr.Default).toBe('10.0.1.0/24');
      expect(template.Parameters.PublicSubnet2Cidr.Default).toBe('10.0.2.0/24');
      expect(template.Parameters.PrivateSubnet1Cidr.Default).toBe('10.0.11.0/24');
      expect(template.Parameters.PrivateSubnet2Cidr.Default).toBe('10.0.12.0/24');
    });

    test('should have tagging parameters', () => {
      const tagParams = ['Environment', 'Project', 'Owner'];
      
      tagParams.forEach(paramName => {
        const param = template.Parameters[paramName];
        expect(param).toBeDefined();
        expect(param.Type).toBe('String');
      });

      expect(template.Parameters.Environment.AllowedValues).toEqual(['development', 'staging', 'production']);
      expect(template.Parameters.Project.Default).toBe('TAP');
      expect(template.Parameters.Owner.Default).toBe('Infrastructure Team');
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource with correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.DeletionPolicy).toBe('Delete');
      expect(vpc.Properties.CidrBlock.Ref).toBe('VpcCidr');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      
      // Check tags
      expect(vpc.Properties.Tags).toHaveLength(4);
      const nameTag = vpc.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toBe('${Project}-VPC-${EnvironmentSuffix}');
    });

    test('should have Internet Gateway with proper attachment', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(igw.DeletionPolicy).toBe('Delete');
      
      const attachment = template.Resources.InternetGatewayAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.InternetGatewayId.Ref).toBe('InternetGateway');
      expect(attachment.Properties.VpcId.Ref).toBe('VPC');
    });
  });

  describe('Subnet Resources', () => {
    test('should have public subnets in different AZs', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      
      [subnet1, subnet2].forEach(subnet => {
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.DeletionPolicy).toBe('Delete');
        expect(subnet.Properties.VpcId.Ref).toBe('VPC');
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      });

      // Check different AZs
      expect(subnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(subnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
      
      // Check CIDR references
      expect(subnet1.Properties.CidrBlock.Ref).toBe('PublicSubnet1Cidr');
      expect(subnet2.Properties.CidrBlock.Ref).toBe('PublicSubnet2Cidr');
    });

    test('should have private subnets in different AZs', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      
      [subnet1, subnet2].forEach(subnet => {
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.DeletionPolicy).toBe('Delete');
        expect(subnet.Properties.VpcId.Ref).toBe('VPC');
        expect(subnet.Properties.MapPublicIpOnLaunch).toBeUndefined(); // Should not auto-assign public IPs
      });

      // Check different AZs
      expect(subnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(subnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
      
      // Check CIDR references
      expect(subnet1.Properties.CidrBlock.Ref).toBe('PrivateSubnet1Cidr');
      expect(subnet2.Properties.CidrBlock.Ref).toBe('PrivateSubnet2Cidr');
    });
  });

  describe('NAT Gateway Resources', () => {
    test('should have Elastic IPs for NAT Gateways', () => {
      const eip1 = template.Resources.NatGateway1EIP;
      const eip2 = template.Resources.NatGateway2EIP;
      
      [eip1, eip2].forEach(eip => {
        expect(eip.Type).toBe('AWS::EC2::EIP');
        expect(eip.DeletionPolicy).toBe('Delete');
        expect(eip.DependsOn).toBe('InternetGatewayAttachment');
        expect(eip.Properties.Domain).toBe('vpc');
        expect(eip.Properties.Tags).toHaveLength(4);
      });
    });

    test('should have NAT Gateways in public subnets', () => {
      const nat1 = template.Resources.NatGateway1;
      const nat2 = template.Resources.NatGateway2;
      
      [nat1, nat2].forEach(nat => {
        expect(nat.Type).toBe('AWS::EC2::NatGateway');
        expect(nat.DeletionPolicy).toBe('Delete');
        expect(nat.Properties.Tags).toHaveLength(4);
      });

      // Check allocation IDs reference EIPs
      expect(nat1.Properties.AllocationId['Fn::GetAtt']).toEqual(['NatGateway1EIP', 'AllocationId']);
      expect(nat2.Properties.AllocationId['Fn::GetAtt']).toEqual(['NatGateway2EIP', 'AllocationId']);
      
      // Check subnet placement
      expect(nat1.Properties.SubnetId.Ref).toBe('PublicSubnet1');
      expect(nat2.Properties.SubnetId.Ref).toBe('PublicSubnet2');
    });
  });

  describe('Route Table Resources', () => {
    test('should have public route table with IGW route', () => {
      const routeTable = template.Resources.PublicRouteTable;
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.DeletionPolicy).toBe('Delete');
      expect(routeTable.Properties.VpcId.Ref).toBe('VPC');
      
      const defaultRoute = template.Resources.DefaultPublicRoute;
      expect(defaultRoute.Type).toBe('AWS::EC2::Route');
      expect(defaultRoute.DependsOn).toBe('InternetGatewayAttachment');
      expect(defaultRoute.Properties.RouteTableId.Ref).toBe('PublicRouteTable');
      expect(defaultRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(defaultRoute.Properties.GatewayId.Ref).toBe('InternetGateway');
    });

    test('should have public subnet route table associations', () => {
      const assoc1 = template.Resources.PublicSubnet1RouteTableAssociation;
      const assoc2 = template.Resources.PublicSubnet2RouteTableAssociation;
      
      [assoc1, assoc2].forEach(assoc => {
        expect(assoc.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        expect(assoc.Properties.RouteTableId.Ref).toBe('PublicRouteTable');
      });

      expect(assoc1.Properties.SubnetId.Ref).toBe('PublicSubnet1');
      expect(assoc2.Properties.SubnetId.Ref).toBe('PublicSubnet2');
    });

    test('should have private route tables with NAT Gateway routes', () => {
      const routeTable1 = template.Resources.PrivateRouteTable1;
      const routeTable2 = template.Resources.PrivateRouteTable2;
      
      [routeTable1, routeTable2].forEach(rt => {
        expect(rt.Type).toBe('AWS::EC2::RouteTable');
        expect(rt.DeletionPolicy).toBe('Delete');
        expect(rt.Properties.VpcId.Ref).toBe('VPC');
      });

      const defaultRoute1 = template.Resources.DefaultPrivateRoute1;
      const defaultRoute2 = template.Resources.DefaultPrivateRoute2;
      
      expect(defaultRoute1.Properties.RouteTableId.Ref).toBe('PrivateRouteTable1');
      expect(defaultRoute1.Properties.NatGatewayId.Ref).toBe('NatGateway1');
      expect(defaultRoute2.Properties.RouteTableId.Ref).toBe('PrivateRouteTable2');
      expect(defaultRoute2.Properties.NatGatewayId.Ref).toBe('NatGateway2');
    });

    test('should have private subnet route table associations', () => {
      const assoc1 = template.Resources.PrivateSubnet1RouteTableAssociation;
      const assoc2 = template.Resources.PrivateSubnet2RouteTableAssociation;
      
      expect(assoc1.Properties.RouteTableId.Ref).toBe('PrivateRouteTable1');
      expect(assoc1.Properties.SubnetId.Ref).toBe('PrivateSubnet1');
      expect(assoc2.Properties.RouteTableId.Ref).toBe('PrivateRouteTable2');
      expect(assoc2.Properties.SubnetId.Ref).toBe('PrivateSubnet2');
    });
  });

  describe('Security Group Resources', () => {
    test('should have public security group with ICMP rules', () => {
      const sg = template.Resources.PublicSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.DeletionPolicy).toBe('Delete');
      expect(sg.Properties.VpcId.Ref).toBe('VPC');
      expect(sg.Properties.GroupDescription).toContain('ICMP');
      
      // Check ingress rules
      const icmpIngress = sg.Properties.SecurityGroupIngress.find((rule: any) => rule.IpProtocol === 'icmp');
      expect(icmpIngress).toBeDefined();
      expect(icmpIngress.FromPort).toBe(-1);
      expect(icmpIngress.ToPort).toBe(-1);
      expect(icmpIngress.CidrIp).toBe('0.0.0.0/0');
      
      // Check egress rules
      const icmpEgress = sg.Properties.SecurityGroupEgress.find((rule: any) => rule.IpProtocol === 'icmp');
      expect(icmpEgress).toBeDefined();
      expect(icmpEgress.FromPort).toBe(-1);
      expect(icmpEgress.ToPort).toBe(-1);
      expect(icmpEgress.CidrIp).toBe('0.0.0.0/0');
      
      const allEgress = sg.Properties.SecurityGroupEgress.find((rule: any) => rule.IpProtocol === -1);
      expect(allEgress).toBeDefined();
      expect(allEgress.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have private security group with ICMP rules', () => {
      const sg = template.Resources.PrivateSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.DeletionPolicy).toBe('Delete');
      expect(sg.Properties.VpcId.Ref).toBe('VPC');
      expect(sg.Properties.GroupDescription).toContain('ICMP');
      
      // Check ingress rules
      const icmpIngress = sg.Properties.SecurityGroupIngress.find((rule: any) => rule.IpProtocol === 'icmp');
      expect(icmpIngress).toBeDefined();
      expect(icmpIngress.FromPort).toBe(-1);
      expect(icmpIngress.ToPort).toBe(-1);
      expect(icmpIngress.CidrIp).toBe('0.0.0.0/0');
      
      // Check egress rules
      const icmpEgress = sg.Properties.SecurityGroupEgress.find((rule: any) => rule.IpProtocol === 'icmp');
      expect(icmpEgress).toBeDefined();
      
      const allEgress = sg.Properties.SecurityGroupEgress.find((rule: any) => rule.IpProtocol === -1);
      expect(allEgress).toBeDefined();
    });
  });

  describe('Outputs Validation', () => {
    test('should have VPC-related outputs', () => {
      const outputs = template.Outputs;
      
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId.Value.Ref).toBe('VPC');
      expect(outputs.VPCId.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-VPC-ID');
      
      expect(outputs.VPCCidrBlock).toBeDefined();
      expect(outputs.VPCCidrBlock.Value.Ref).toBe('VpcCidr');
      
      expect(outputs.InternetGatewayId).toBeDefined();
      expect(outputs.InternetGatewayId.Value.Ref).toBe('InternetGateway');
    });

    test('should have subnet outputs', () => {
      const outputs = template.Outputs;
      
      // Public subnets
      expect(outputs.PublicSubnet1Id.Value.Ref).toBe('PublicSubnet1');
      expect(outputs.PublicSubnet2Id.Value.Ref).toBe('PublicSubnet2');
      expect(outputs.PublicSubnet1AZ.Value['Fn::GetAtt']).toEqual(['PublicSubnet1', 'AvailabilityZone']);
      expect(outputs.PublicSubnet2AZ.Value['Fn::GetAtt']).toEqual(['PublicSubnet2', 'AvailabilityZone']);
      
      // Private subnets
      expect(outputs.PrivateSubnet1Id.Value.Ref).toBe('PrivateSubnet1');
      expect(outputs.PrivateSubnet2Id.Value.Ref).toBe('PrivateSubnet2');
      expect(outputs.PrivateSubnet1AZ.Value['Fn::GetAtt']).toEqual(['PrivateSubnet1', 'AvailabilityZone']);
      expect(outputs.PrivateSubnet2AZ.Value['Fn::GetAtt']).toEqual(['PrivateSubnet2', 'AvailabilityZone']);
    });

    test('should have NAT Gateway outputs', () => {
      const outputs = template.Outputs;
      
      expect(outputs.NatGateway1Id.Value.Ref).toBe('NatGateway1');
      expect(outputs.NatGateway2Id.Value.Ref).toBe('NatGateway2');
      expect(outputs.NatGateway1EIP.Value.Ref).toBe('NatGateway1EIP');
      expect(outputs.NatGateway2EIP.Value.Ref).toBe('NatGateway2EIP');
    });

    test('should have route table outputs', () => {
      const outputs = template.Outputs;
      
      expect(outputs.PublicRouteTableId.Value.Ref).toBe('PublicRouteTable');
      expect(outputs.PrivateRouteTable1Id.Value.Ref).toBe('PrivateRouteTable1');
      expect(outputs.PrivateRouteTable2Id.Value.Ref).toBe('PrivateRouteTable2');
    });

    test('should have security group outputs', () => {
      const outputs = template.Outputs;
      
      expect(outputs.PublicSecurityGroupId.Value.Ref).toBe('PublicSecurityGroup');
      expect(outputs.PrivateSecurityGroupId.Value.Ref).toBe('PrivateSecurityGroup');
    });

    test('should have stack metadata outputs', () => {
      const outputs = template.Outputs;
      
      expect(outputs.StackName.Value.Ref).toBe('AWS::StackName');
      expect(outputs.EnvironmentSuffix.Value.Ref).toBe('EnvironmentSuffix');
    });
  });

  describe('Resource Dependencies and References', () => {
    test('should have proper DependsOn relationships', () => {
      // EIPs should depend on IGW attachment
      expect(template.Resources.NatGateway1EIP.DependsOn).toBe('InternetGatewayAttachment');
      expect(template.Resources.NatGateway2EIP.DependsOn).toBe('InternetGatewayAttachment');
      
      // Public route should depend on IGW attachment
      expect(template.Resources.DefaultPublicRoute.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('should have consistent resource references', () => {
      // NAT Gateways should reference correct EIPs and subnets
      expect(template.Resources.NatGateway1.Properties.AllocationId['Fn::GetAtt']).toEqual(['NatGateway1EIP', 'AllocationId']);
      expect(template.Resources.NatGateway2.Properties.AllocationId['Fn::GetAtt']).toEqual(['NatGateway2EIP', 'AllocationId']);
      
      // Private routes should reference correct NAT Gateways
      expect(template.Resources.DefaultPrivateRoute1.Properties.NatGatewayId.Ref).toBe('NatGateway1');
      expect(template.Resources.DefaultPrivateRoute2.Properties.NatGatewayId.Ref).toBe('NatGateway2');
    });
  });

  describe('Resource Tagging Validation', () => {
    test('should have consistent tagging across all resources', () => {
      const resourcesWithTags = [
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2', 
        'PrivateSubnet1', 'PrivateSubnet2', 'NatGateway1EIP', 'NatGateway2EIP',
        'NatGateway1', 'NatGateway2', 'PublicRouteTable', 'PrivateRouteTable1',
        'PrivateRouteTable2', 'PublicSecurityGroup', 'PrivateSecurityGroup'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        
        const tags = resource.Properties.Tags;
        const tagKeys = tags.map((tag: any) => tag.Key);
        
        expect(tagKeys).toContain('Name');
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Project');
        expect(tagKeys).toContain('Owner');
      });
    });
  });

  describe('Deletion Policies', () => {
    test('should have Delete policies for all resources', () => {
      const resourcesWithDeletionPolicy = [
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2',
        'PrivateSubnet1', 'PrivateSubnet2', 'NatGateway1EIP', 'NatGateway2EIP',
        'NatGateway1', 'NatGateway2', 'PublicRouteTable', 'PrivateRouteTable1',
        'PrivateRouteTable2', 'PublicSecurityGroup', 'PrivateSecurityGroup'
      ];

      resourcesWithDeletionPolicy.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).toBe('Delete');
      });
    });
  });
});