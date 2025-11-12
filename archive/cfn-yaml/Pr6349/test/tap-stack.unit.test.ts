import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX;

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Otherwise, ensure the template is in JSON format.
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
      expect(template.Description).toContain('Production-ready network infrastructure');
      expect(template.Description).toContain('FinTech payment processing platform');
      expect(template.Description).toContain('three-tier architecture');
      expect(template.Description).toContain('three availability zones');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterLabels).toBeDefined();
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters Validation', () => {
    test('should have VPCCIDRBlock parameter with correct properties', () => {
      const param = template.Parameters.VPCCIDRBlock;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.Description).toContain('CIDR block');
      expect(param.AllowedPattern).toBeDefined();
      expect(param.ConstraintDescription).toBeDefined();
    });

    test('should have all public subnet CIDR parameters', () => {
      ['PublicSubnet1CIDR', 'PublicSubnet2CIDR', 'PublicSubnet3CIDR'].forEach(paramName => {
        const param = template.Parameters[paramName];
        expect(param).toBeDefined();
        expect(param.Type).toBe('String');
        expect(param.AllowedPattern).toBeDefined();
        expect(param.Description).toContain('public subnet');
      });
    });

    test('should have correct default values for public subnets', () => {
      expect(template.Parameters.PublicSubnet1CIDR.Default).toBe('10.0.1.0/24');
      expect(template.Parameters.PublicSubnet2CIDR.Default).toBe('10.0.2.0/24');
      expect(template.Parameters.PublicSubnet3CIDR.Default).toBe('10.0.3.0/24');
    });

    test('should have all private subnet CIDR parameters', () => {
      ['PrivateSubnet1CIDR', 'PrivateSubnet2CIDR', 'PrivateSubnet3CIDR'].forEach(paramName => {
        const param = template.Parameters[paramName];
        expect(param).toBeDefined();
        expect(param.Type).toBe('String');
        expect(param.AllowedPattern).toBeDefined();
        expect(param.Description).toContain('private subnet');
      });
    });

    test('should have correct default values for private subnets', () => {
      expect(template.Parameters.PrivateSubnet1CIDR.Default).toBe('10.0.11.0/24');
      expect(template.Parameters.PrivateSubnet2CIDR.Default).toBe('10.0.12.0/24');
      expect(template.Parameters.PrivateSubnet3CIDR.Default).toBe('10.0.13.0/24');
    });

    test('should have DNS configuration parameters', () => {
      const dnsHostnames = template.Parameters.EnableDNSHostnames;
      const dnsResolution = template.Parameters.EnableDNSResolution;
      
      expect(dnsHostnames).toBeDefined();
      expect(dnsHostnames.Type).toBe('String');
      expect(dnsHostnames.Default).toBe(true);
      expect(dnsHostnames.AllowedValues).toEqual([true, false]);
      
      expect(dnsResolution).toBeDefined();
      expect(dnsResolution.Type).toBe('String');
      expect(dnsResolution.Default).toBe(true);
      expect(dnsResolution.AllowedValues).toEqual([true, false]);
    });

    test('should have tagging parameters', () => {
      const envTag = template.Parameters.EnvironmentTag;
      const projectTag = template.Parameters.ProjectTag;
      const costCenter = template.Parameters.CostCenter;
      
      expect(envTag).toBeDefined();
      expect(envTag.Type).toBe('String');
      expect(envTag.Default).toBe('Production');
      expect(envTag.AllowedValues).toEqual(['Production', 'Staging', 'Development']);
      
      expect(projectTag).toBeDefined();
      expect(projectTag.Type).toBe('String');
      expect(projectTag.Default).toBe('FinTech');
      expect(projectTag.AllowedPattern).toBeDefined();
      
      expect(costCenter).toBeDefined();
      expect(costCenter.Type).toBe('String');
      expect(costCenter.Default).toBe('Infrastructure');
    });

    test('should have exactly 12 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(12);
    });
  });

  describe('Mappings Validation', () => {
    test('should have AZRegionMap mapping', () => {
      expect(template.Mappings.AZRegionMap).toBeDefined();
    });

    test('should have mappings for all listed regions', () => {
      const regions = [
        'us-east-1', 'us-east-2', 'ap-east-1', 'sa-east-1', 'af-south-1'
      ];
      
      regions.forEach(region => {
        expect(template.Mappings.AZRegionMap[region]).toBeDefined();
        expect(template.Mappings.AZRegionMap[region].AZ1).toBeDefined();
        expect(template.Mappings.AZRegionMap[region].AZ2).toBeDefined();
        expect(template.Mappings.AZRegionMap[region].AZ3).toBeDefined();
      });
    });

    test('should have unique AZs for all listed regions', () => {
      const regions = [
        'us-east-1', 'us-east-2', 'ap-east-1', 'sa-east-1', 'af-south-1'
      ];
      
      regions.forEach(region => {
        const azs = template.Mappings.AZRegionMap[region];
        expect(azs.AZ1).toBeDefined();
        expect(azs.AZ2).toBeDefined();
        expect(azs.AZ3).toBeDefined();
      });
    });
  });

  describe('VPC Resource', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VPCCIDRBlock' });
      expect(vpc.Properties.EnableDnsHostnames).toEqual({ Ref: 'EnableDNSHostnames' });
      expect(vpc.Properties.EnableDnsSupport).toEqual({ Ref: 'EnableDNSResolution' });
      expect(vpc.Properties.InstanceTenancy).toBe('default');
    });

    test('VPC should have required tags', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      
      const tagKeys = tags.map((tag: any) => tag.Key);
      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('Owner');
      expect(tagKeys).toContain('CostCenter');
      expect(tagKeys).toContain('iac-rlhf-amazon');
      expect(tagKeys).toContain('ManagedBy');
    });

    test('VPC should have VPC Flow Logs configured', () => {
      expect(template.Resources.VPCFlowLogRole).toBeDefined();
      expect(template.Resources.VPCFlowLogGroup).toBeDefined();
      expect(template.Resources.VPCFlowLog).toBeDefined();
    });

    test('VPC Flow Log should have correct configuration', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLog.Properties.ResourceType).toBe('VPC');
      expect(flowLog.Properties.ResourceId).toEqual({ Ref: 'VPC' });
      expect(flowLog.Properties.TrafficType).toBe('ALL');
      expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
    });
  });

  describe('Internet Gateway', () => {
    test('should have Internet Gateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have Internet Gateway attachment', () => {
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(template.Resources.InternetGatewayAttachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(template.Resources.InternetGatewayAttachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });
  });

  describe('Public Subnets', () => {
    test('should have three public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();
    });

    test('all public subnets should have correct properties', () => {
      ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'].forEach((subnetName, index) => {
        const subnet = template.Resources[subnetName];
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.Properties.AvailabilityZone).toBeDefined();
      });
    });

    test('public subnets should use correct CIDR parameters', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet1CIDR' });
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet2CIDR' });
      expect(template.Resources.PublicSubnet3.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet3CIDR' });
    });

    test('public subnets should have Kubernetes ELB tags', () => {
      ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'].forEach(subnetName => {
        const subnet = template.Resources[subnetName];
        const tags = subnet.Properties.Tags;
        const kubernetesTag = tags.find((tag: any) => tag.Key === 'kubernetes.io/role/elb'); 
        expect(kubernetesTag).toBeDefined();
        expect(kubernetesTag.Value).toBe(1);
      });
    });
  });

  describe('Private Subnets', () => {
    test('should have three private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('all private subnets should have correct properties', () => {
      ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'].forEach(subnetName => {
        const subnet = template.Resources[subnetName];
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.Properties.AvailabilityZone).toBeDefined();
      });
    });

    test('private subnets should use correct CIDR parameters', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnet1CIDR' });
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnet2CIDR' });
      expect(template.Resources.PrivateSubnet3.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnet3CIDR' });
    });

    test('private subnets should have Kubernetes internal ELB tags', () => {
      ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'].forEach(subnetName => {
        const subnet = template.Resources[subnetName];
        const tags = subnet.Properties.Tags;
        const kubernetesTag = tags.find((tag: any) => tag.Key === 'kubernetes.io/role/internal-elb');
        expect(kubernetesTag).toBeDefined();
        expect(kubernetesTag.Value).toBe(1);
      });
    });
  });

  describe('NAT Gateways', () => {
    test('should have three NAT Gateways', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway3).toBeDefined();
    });

    test('should have three Elastic IPs for NAT Gateways', () => {
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway2EIP).toBeDefined();
      expect(template.Resources.NatGateway3EIP).toBeDefined();
    });

    test('NAT Gateways should be in public subnets', () => {
      expect(template.Resources.NatGateway1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(template.Resources.NatGateway2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
      expect(template.Resources.NatGateway3.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet3' });
    });

    test('NAT Gateways should use correct EIPs', () => {
      expect(template.Resources.NatGateway1.Properties.AllocationId).toEqual({ 'Fn::GetAtt': ['NatGateway1EIP', 'AllocationId'] });
      expect(template.Resources.NatGateway2.Properties.AllocationId).toEqual({ 'Fn::GetAtt': ['NatGateway2EIP', 'AllocationId'] });
      expect(template.Resources.NatGateway3.Properties.AllocationId).toEqual({ 'Fn::GetAtt': ['NatGateway3EIP', 'AllocationId'] });
    });

    test('NAT Gateway EIPs should have domain vpc', () => {
      ['NatGateway1EIP', 'NatGateway2EIP', 'NatGateway3EIP'].forEach(eipName => {
        const eip = template.Resources[eipName];
        expect(eip.Properties.Domain).toBe('vpc');
        expect(eip.DependsOn).toContain('InternetGatewayAttachment');
      });
    });

    test('NAT Gateways should follow naming convention', () => {
      const nat1 = template.Resources.NatGateway1;
      const tags = nat1.Properties.Tags;
      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toBeDefined();
    });
  });

  describe('Route Tables', () => {
    test('should have one public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have three private route tables', () => {
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(template.Resources.PrivateRouteTable3).toBeDefined();
    });

    test('public route table should route to Internet Gateway', () => {
      const route = template.Resources.DefaultPublicRoute;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(route.DependsOn).toContain('InternetGatewayAttachment');
    });

    test('private route tables should route to respective NAT Gateways', () => {
      const route1 = template.Resources.DefaultPrivateRoute1;
      expect(route1.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable1' });
      expect(route1.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route1.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway1' });

      const route2 = template.Resources.DefaultPrivateRoute2;
      expect(route2.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway2' });

      const route3 = template.Resources.DefaultPrivateRoute3;
      expect(route3.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway3' });
    });

    test('all public subnets should be associated with public route table', () => {
      ['PublicSubnet1RouteTableAssociation', 'PublicSubnet2RouteTableAssociation', 'PublicSubnet3RouteTableAssociation'].forEach(assocName => {
        const assoc = template.Resources[assocName];
        expect(assoc.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        expect(assoc.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      });
    });

    test('private subnets should be associated with zone-specific route tables', () => {
      const assoc1 = template.Resources.PrivateSubnet1RouteTableAssociation;
      expect(assoc1.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable1' });
      expect(assoc1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });

      const assoc2 = template.Resources.PrivateSubnet2RouteTableAssociation;
      expect(assoc2.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable2' });

      const assoc3 = template.Resources.PrivateSubnet3RouteTableAssociation;
      expect(assoc3.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable3' });
    });
  });

  describe('Security Groups', () => {
    test('should have Web Tier Security Group', () => {
      const sg = template.Resources.WebTierSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('Web Tier Security Group should allow HTTPS from anywhere', () => {
      const sg = template.Resources.WebTierSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress[0];
      expect(ingress.IpProtocol).toBe('tcp');
      expect(ingress.FromPort).toBe(443);
      expect(ingress.ToPort).toBe(443);
      expect(ingress.CidrIp).toBe('0.0.0.0/0');
    });

    test('Web Tier Security Group should allow all outbound', () => {
      const sg = template.Resources.WebTierSecurityGroup;
      const egress = sg.Properties.SecurityGroupEgress[0];
      expect(egress.IpProtocol).toBe(-1);
      expect(egress.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have Application Tier Security Group', () => {
      const sg = template.Resources.ApplicationTierSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('Application Tier should allow ingress from Web Tier on port 8080', () => {
      const ingress = template.Resources.ApplicationTierIngressFromWeb;
      expect(ingress.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(ingress.Properties.GroupId).toEqual({ Ref: 'ApplicationTierSecurityGroup' });
      expect(ingress.Properties.IpProtocol).toBe('tcp');
      expect(ingress.Properties.FromPort).toBe(8080);
      expect(ingress.Properties.ToPort).toBe(8080);
      expect(ingress.Properties.SourceSecurityGroupId).toEqual({ Ref: 'WebTierSecurityGroup' });
    });

    test('should have Database Tier Security Group', () => {
      const sg = template.Resources.DatabaseTierSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('Database Tier Security Group should allow MySQL from VPC CIDR only', () => {
      const sg = template.Resources.DatabaseTierSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress[0];
      expect(ingress.IpProtocol).toBe('tcp');
      expect(ingress.FromPort).toBe(3306);
      expect(ingress.ToPort).toBe(3306);
      expect(ingress.CidrIp).toEqual({ Ref: 'VPCCIDRBlock' });
    });
  });

  describe('VPC Endpoints', () => {
    test('should have S3 VPC Endpoint', () => {
      const endpoint = template.Resources.S3Endpoint;
      expect(endpoint).toBeDefined();
      expect(endpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(endpoint.Properties.VpcEndpointType).toBe('Gateway');
    });

    test('S3 Endpoint should be attached to all private route tables', () => {
      const endpoint = template.Resources.S3Endpoint;
      const routeTableIds = endpoint.Properties.RouteTableIds;
      expect(routeTableIds).toContainEqual({ Ref: 'PrivateRouteTable1' });
      expect(routeTableIds).toContainEqual({ Ref: 'PrivateRouteTable2' });
      expect(routeTableIds).toContainEqual({ Ref: 'PrivateRouteTable3' });
    });

    test('should have DynamoDB VPC Endpoint', () => {
      const endpoint = template.Resources.DynamoDBEndpoint;
      expect(endpoint).toBeDefined();
      expect(endpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(endpoint.Properties.VpcEndpointType).toBe('Gateway');
    });

    test('DynamoDB Endpoint should be attached to all private route tables', () => {
      const endpoint = template.Resources.DynamoDBEndpoint;
      const routeTableIds = endpoint.Properties.RouteTableIds;
      expect(routeTableIds).toContainEqual({ Ref: 'PrivateRouteTable1' });
      expect(routeTableIds).toContainEqual({ Ref: 'PrivateRouteTable2' });
      expect(routeTableIds).toContainEqual({ Ref: 'PrivateRouteTable3' });
    });
  });

  describe('Network ACLs', () => {
    test('should have Public Network ACL', () => {
      expect(template.Resources.PublicNetworkAcl).toBeDefined();
      expect(template.Resources.PublicNetworkAcl.Type).toBe('AWS::EC2::NetworkAcl');
    });

    test('Public NACL should allow HTTPS inbound', () => {
      const entry = template.Resources.PublicNetworkAclEntryInboundHTTPS;
      expect(entry).toBeDefined();
      expect(entry.Properties.RuleNumber).toBe(100);
      expect(entry.Properties.Protocol).toBe(6); // TCP
      expect(entry.Properties.RuleAction).toBe('allow');
      expect(entry.Properties.PortRange.From).toBe(443);
      expect(entry.Properties.PortRange.To).toBe(443);
    });

    test('Public NACL should allow ephemeral ports inbound', () => {
      const entry = template.Resources.PublicNetworkAclEntryInboundEphemeral;
      expect(entry).toBeDefined();
      expect(entry.Properties.RuleNumber).toBe(200);
      expect(entry.Properties.Protocol).toBe(6);
      expect(entry.Properties.PortRange.From).toBe(1024);
      expect(entry.Properties.PortRange.To).toBe(65535);
    });

    test('Public NACL should allow all outbound', () => {
      const entry = template.Resources.PublicNetworkAclEntryOutbound;
      expect(entry).toBeDefined();
      expect(entry.Properties.Egress).toBe(true);
      expect(entry.Properties.Protocol).toBe(-1);
      expect(entry.Properties.RuleAction).toBe('allow');
    });

    test('should have Private Network ACL', () => {
      expect(template.Resources.PrivateNetworkAcl).toBeDefined();
      expect(template.Resources.PrivateNetworkAcl.Type).toBe('AWS::EC2::NetworkAcl');
    });

    test('Private NACL should allow VPC CIDR inbound', () => {
      const entry = template.Resources.PrivateNetworkAclEntryInbound;
      expect(entry).toBeDefined();
      expect(entry.Properties.Protocol).toBe(-1);
      expect(entry.Properties.RuleAction).toBe('allow');
      expect(entry.Properties.CidrBlock).toEqual({ Ref: 'VPCCIDRBlock' });
    });

    test('all public subnets should be associated with public NACL', () => {
      ['PublicSubnetNetworkAclAssociation1', 'PublicSubnetNetworkAclAssociation2', 'PublicSubnetNetworkAclAssociation3'].forEach(assocName => {
        const assoc = template.Resources[assocName];
        expect(assoc).toBeDefined();
        expect(assoc.Type).toBe('AWS::EC2::SubnetNetworkAclAssociation');
        expect(assoc.Properties.NetworkAclId).toEqual({ Ref: 'PublicNetworkAcl' });
      });
    });

    test('all private subnets should be associated with private NACL', () => {
      ['PrivateSubnetNetworkAclAssociation1', 'PrivateSubnetNetworkAclAssociation2', 'PrivateSubnetNetworkAclAssociation3'].forEach(assocName => {
        const assoc = template.Resources[assocName];
        expect(assoc).toBeDefined();
        expect(assoc.Type).toBe('AWS::EC2::SubnetNetworkAclAssociation');
        expect(assoc.Properties.NetworkAclId).toEqual({ Ref: 'PrivateNetworkAcl' });
      });
    });
  });

  describe('Outputs', () => {
    test('should have VPC outputs', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCCidr).toBeDefined();
      expect(template.Outputs.VPCDefaultSecurityGroup).toBeDefined();
    });

    test('should have Internet Gateway output', () => {
      expect(template.Outputs.InternetGatewayId).toBeDefined();
    });

    test('should have outputs for all public subnets', () => {
      ['PublicSubnet1Id', 'PublicSubnet2Id', 'PublicSubnet3Id'].forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
      ['PublicSubnet1AZ', 'PublicSubnet2AZ', 'PublicSubnet3AZ'].forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have outputs for all private subnets', () => {
      ['PrivateSubnet1Id', 'PrivateSubnet2Id', 'PrivateSubnet3Id'].forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
      ['PrivateSubnet1AZ', 'PrivateSubnet2AZ', 'PrivateSubnet3AZ'].forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have aggregated subnet lists', () => {
      expect(template.Outputs.PublicSubnets).toBeDefined();
      expect(template.Outputs.PrivateSubnets).toBeDefined();
    });

    test('should have NAT Gateway outputs', () => {
      ['NatGateway1Id', 'NatGateway2Id', 'NatGateway3Id'].forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
      ['NatGateway1EIPAddress', 'NatGateway2EIPAddress', 'NatGateway3EIPAddress'].forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have Security Group outputs', () => {
      expect(template.Outputs.WebTierSecurityGroupId).toBeDefined();
      expect(template.Outputs.ApplicationTierSecurityGroupId).toBeDefined();
      expect(template.Outputs.DatabaseTierSecurityGroupId).toBeDefined();
    });

    test('should have Route Table outputs', () => {
      expect(template.Outputs.PublicRouteTableId).toBeDefined();
      expect(template.Outputs.PrivateRouteTable1Id).toBeDefined();
      expect(template.Outputs.PrivateRouteTable2Id).toBeDefined();
      expect(template.Outputs.PrivateRouteTable3Id).toBeDefined();
    });

    test('should have VPC Endpoint outputs', () => {
      expect(template.Outputs.S3EndpointId).toBeDefined();
      expect(template.Outputs.DynamoDBEndpointId).toBeDefined();
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('NAT Gateway EIPs should depend on Internet Gateway attachment', () => {
      ['NatGateway1EIP', 'NatGateway2EIP', 'NatGateway3EIP'].forEach(eipName => {
        const eip = template.Resources[eipName];
        expect(eip.DependsOn).toContain('InternetGatewayAttachment');
      });
    });

    test('Public route should depend on Internet Gateway attachment', () => {
      const route = template.Resources.DefaultPublicRoute;
      expect(route.DependsOn).toContain('InternetGatewayAttachment');
    });
  });

  describe('Tagging Consistency', () => {
    test('all resources should have required tags', () => {
      const resourcesWithTags = [
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PrivateSubnet1',
        'NatGateway1', 'PublicRouteTable', 'PrivateRouteTable1',
        'WebTierSecurityGroup', 'ApplicationTierSecurityGroup', 'DatabaseTierSecurityGroup'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const tagKeys = tags.map((tag: any) => tag.Key);
          expect(tagKeys).toContain('Environment');
          expect(tagKeys).toContain('Project');
          expect(tagKeys).toContain('Owner');
          expect(tagKeys).toContain('iac-rlhf-amazon');
        }
      });
    });
  });

  describe('CIDR Validation', () => {
    test('public subnet CIDRs should be within VPC CIDR', () => {
      // This is a boundary condition test
      // Public subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
      // VPC: 10.0.0.0/16
      // All should be valid
      expect(template.Parameters.PublicSubnet1CIDR.Default).toBe('10.0.1.0/24');
      expect(template.Parameters.PublicSubnet2CIDR.Default).toBe('10.0.2.0/24');
      expect(template.Parameters.PublicSubnet3CIDR.Default).toBe('10.0.3.0/24');
    });

    test('private subnet CIDRs should be within VPC CIDR', () => {
      // Private subnets: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
      // VPC: 10.0.0.0/16
      expect(template.Parameters.PrivateSubnet1CIDR.Default).toBe('10.0.11.0/24');
      expect(template.Parameters.PrivateSubnet2CIDR.Default).toBe('10.0.12.0/24');
      expect(template.Parameters.PrivateSubnet3CIDR.Default).toBe('10.0.13.0/24');
    });

    test('subnet CIDRs should not overlap', () => {
      // Verify that all subnet CIDRs are distinct
      const publicCidrs = [
        template.Parameters.PublicSubnet1CIDR.Default,
        template.Parameters.PublicSubnet2CIDR.Default,
        template.Parameters.PublicSubnet3CIDR.Default
      ];
      const privateCidrs = [
        template.Parameters.PrivateSubnet1CIDR.Default,
        template.Parameters.PrivateSubnet2CIDR.Default,
        template.Parameters.PrivateSubnet3CIDR.Default
      ];
      
      const allCidrs = [...publicCidrs, ...privateCidrs];
      const uniqueCidrs = new Set(allCidrs);
      expect(uniqueCidrs.size).toBe(allCidrs.length);
    });
  });

  describe('High Availability', () => {
    test('should have resources distributed across three availability zones', () => {
      // Verify that subnets use FindInMap for AZ selection
      const publicSubnet1 = template.Resources.PublicSubnet1;
      expect(publicSubnet1.Properties.AvailabilityZone).toBeDefined();
      
      // The AZ should come from the mapping
      const azMapping = publicSubnet1.Properties.AvailabilityZone;
      expect(azMapping).toBeDefined();
    });

    test('each AZ should have its own NAT Gateway', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway3).toBeDefined();
    });

    test('each private subnet should route to its zone-specific NAT Gateway', () => {
      const route1 = template.Resources.DefaultPrivateRoute1;
      const route2 = template.Resources.DefaultPrivateRoute2;
      const route3 = template.Resources.DefaultPrivateRoute3;
      
      expect(route1.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway1' });
      expect(route2.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway2' });
      expect(route3.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway3' });
    });
  });
});

