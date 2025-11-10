import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - VPC Infrastructure', () => {
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

    test('should have descriptive description for VPC infrastructure', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('VPC');
      expect(template.Description).toContain('payment processing');
    });

    test('should have all required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix should have correct type and default', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
      expect(param.Description).toContain('resource names');
    });

    test('should have exactly one parameter', () => {
      expect(Object.keys(template.Parameters)).toHaveLength(1);
    });
  });

  describe('VPC Configuration', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block 10.0.0.0/16', () => {
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS support enabled', () => {
      const vpcProps = template.Resources.VPC.Properties;
      expect(vpcProps.EnableDnsHostnames).toBe(true);
      expect(vpcProps.EnableDnsSupport).toBe(true);
    });

    test('VPC should be tagged with environmentSuffix', () => {
      const tags = template.Resources.VPC.Properties.Tags;
      const nameTag = tags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value).toEqual({ 'Fn::Sub': 'vpc-${EnvironmentSuffix}' });
    });

    test('VPC should have required tags', () => {
      const tags = template.Resources.VPC.Properties.Tags;
      const envTag = tags.find((t: any) => t.Key === 'Environment');
      const projTag = tags.find((t: any) => t.Key === 'Project');
      expect(envTag.Value).toBe('Production');
      expect(projTag.Value).toBe('PaymentGateway');
    });
  });

  describe('Internet Gateway', () => {
    test('should have Internet Gateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
    });

    test('should have VPC Gateway Attachment', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe(
        'AWS::EC2::VPCGatewayAttachment'
      );
    });

    test('Gateway Attachment should reference VPC and IGW', () => {
      const attachment = template.Resources.AttachGateway.Properties;
      expect(attachment.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });
  });

  describe('Subnet Configuration', () => {
    test('should have exactly 9 subnets (3 public, 3 private, 3 isolated)', () => {
      const subnets = Object.keys(template.Resources).filter((key) =>
        template.Resources[key].Type === 'AWS::EC2::Subnet'
      );
      expect(subnets).toHaveLength(9);
    });

    test('should have 3 public subnets with correct CIDR blocks', () => {
      const publicSubnets = ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'];
      const expectedCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];

      publicSubnets.forEach((subnetName, index) => {
        const subnet = template.Resources[subnetName];
        expect(subnet).toBeDefined();
        expect(subnet.Properties.CidrBlock).toBe(expectedCidrs[index]);
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('should have 3 private subnets with correct CIDR blocks', () => {
      const privateSubnets = [
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PrivateSubnet3',
      ];
      const expectedCidrs = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'];

      privateSubnets.forEach((subnetName, index) => {
        const subnet = template.Resources[subnetName];
        expect(subnet).toBeDefined();
        expect(subnet.Properties.CidrBlock).toBe(expectedCidrs[index]);
        expect(subnet.Properties.MapPublicIpOnLaunch).toBeUndefined();
      });
    });

    test('should have 3 isolated subnets with correct CIDR blocks', () => {
      const isolatedSubnets = [
        'IsolatedSubnet1',
        'IsolatedSubnet2',
        'IsolatedSubnet3',
      ];
      const expectedCidrs = ['10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24'];

      isolatedSubnets.forEach((subnetName, index) => {
        const subnet = template.Resources[subnetName];
        expect(subnet).toBeDefined();
        expect(subnet.Properties.CidrBlock).toBe(expectedCidrs[index]);
      });
    });

    test('all subnets should span 3 availability zones', () => {
      const allSubnets = [
        'PublicSubnet1',
        'PublicSubnet2',
        'PublicSubnet3',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PrivateSubnet3',
        'IsolatedSubnet1',
        'IsolatedSubnet2',
        'IsolatedSubnet3',
      ];

      allSubnets.forEach((subnetName, index) => {
        const subnet = template.Resources[subnetName];
        const azIndex = index % 3;
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [azIndex.toString(), { 'Fn::GetAZs': '' }],
        });
      });
    });

    test('all subnets should have environmentSuffix in tags', () => {
      const allSubnets = Object.keys(template.Resources).filter(
        (key) => template.Resources[key].Type === 'AWS::EC2::Subnet'
      );

      allSubnets.forEach((subnetName) => {
        const subnet = template.Resources[subnetName];
        const nameTag = subnet.Properties.Tags.find((t: any) => t.Key === 'Name');
        expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('should have exactly 3 NAT Gateways', () => {
      const natGateways = Object.keys(template.Resources).filter(
        (key) => template.Resources[key].Type === 'AWS::EC2::NatGateway'
      );
      expect(natGateways).toHaveLength(3);
    });

    test('should have exactly 3 Elastic IPs for NAT Gateways', () => {
      const eips = Object.keys(template.Resources).filter(
        (key) => template.Resources[key].Type === 'AWS::EC2::EIP'
      );
      expect(eips).toHaveLength(3);
    });

    test('each EIP should depend on AttachGateway', () => {
      ['EIP1', 'EIP2', 'EIP3'].forEach((eipName) => {
        const eip = template.Resources[eipName];
        expect(eip.DependsOn).toBe('AttachGateway');
        expect(eip.Properties.Domain).toBe('vpc');
      });
    });

    test('each NAT Gateway should be in a public subnet', () => {
      const natGateways = {
        NatGateway1: 'PublicSubnet1',
        NatGateway2: 'PublicSubnet2',
        NatGateway3: 'PublicSubnet3',
      };

      Object.entries(natGateways).forEach(([natName, subnetName]) => {
        const nat = template.Resources[natName];
        expect(nat.Properties.SubnetId).toEqual({ Ref: subnetName });
      });
    });

    test('each NAT Gateway should reference its corresponding EIP', () => {
      const pairs = {
        NatGateway1: 'EIP1',
        NatGateway2: 'EIP2',
        NatGateway3: 'EIP3',
      };

      Object.entries(pairs).forEach(([natName, eipName]) => {
        const nat = template.Resources[natName];
        expect(nat.Properties.AllocationId).toEqual({
          'Fn::GetAtt': [eipName, 'AllocationId'],
        });
      });
    });
  });

  describe('Route Tables', () => {
    test('should have 7 route tables (1 public, 3 private, 3 isolated)', () => {
      const routeTables = Object.keys(template.Resources).filter(
        (key) => template.Resources[key].Type === 'AWS::EC2::RouteTable'
      );
      expect(routeTables).toHaveLength(7);
    });

    test('public route table should have internet gateway route', () => {
      expect(template.Resources.PublicRoute).toBeDefined();
      const route = template.Resources.PublicRoute;
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(route.DependsOn).toBe('AttachGateway');
    });

    test('each private route table should have NAT gateway route', () => {
      const privateRoutes = {
        PrivateRoute1: 'NatGateway1',
        PrivateRoute2: 'NatGateway2',
        PrivateRoute3: 'NatGateway3',
      };

      Object.entries(privateRoutes).forEach(([routeName, natName]) => {
        const route = template.Resources[routeName];
        expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
        expect(route.Properties.NatGatewayId).toEqual({ Ref: natName });
      });
    });

    test('isolated route tables should have NO internet routes', () => {
      const isolatedRoutes = Object.keys(template.Resources).filter(
        (key) =>
          template.Resources[key].Type === 'AWS::EC2::Route' &&
          key.includes('Isolated')
      );
      expect(isolatedRoutes).toHaveLength(0);
    });

    test('all 9 subnets should have route table associations', () => {
      const associations = Object.keys(template.Resources).filter(
        (key) =>
          template.Resources[key].Type === 'AWS::EC2::SubnetRouteTableAssociation'
      );
      expect(associations).toHaveLength(9);
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have VPC Flow Log resource', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');
    });

    test('Flow Log should capture ALL traffic', () => {
      const flowLog = template.Resources.VPCFlowLog.Properties;
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.ResourceType).toBe('VPC');
      expect(flowLog.ResourceId).toEqual({ Ref: 'VPC' });
    });

    test('Flow Log should send to CloudWatch Logs', () => {
      const flowLog = template.Resources.VPCFlowLog.Properties;
      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
      expect(flowLog.LogGroupName).toEqual({ Ref: 'FlowLogsLogGroup' });
    });

    test('should have CloudWatch Log Group for Flow Logs', () => {
      expect(template.Resources.FlowLogsLogGroup).toBeDefined();
      expect(template.Resources.FlowLogsLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('Log Group should have 7-day retention', () => {
      const logGroup = template.Resources.FlowLogsLogGroup.Properties;
      expect(logGroup.RetentionInDays).toBe(7);
    });

    test('Log Group name should include environmentSuffix', () => {
      const logGroup = template.Resources.FlowLogsLogGroup.Properties;
      expect(logGroup.LogGroupName).toEqual({
        'Fn::Sub': '/aws/vpc/flowlogs-${EnvironmentSuffix}',
      });
    });

    test('should have IAM role for Flow Logs', () => {
      expect(template.Resources.FlowLogsRole).toBeDefined();
      expect(template.Resources.FlowLogsRole.Type).toBe('AWS::IAM::Role');
    });

    test('Flow Logs role should have correct trust policy', () => {
      const role = template.Resources.FlowLogsRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe(
        'vpc-flow-logs.amazonaws.com'
      );
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('Flow Logs role should have CloudWatch permissions', () => {
      const role = template.Resources.FlowLogsRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const actions = policy.Statement[0].Action;
      expect(actions).toContain('logs:CreateLogGroup');
      expect(actions).toContain('logs:CreateLogStream');
      expect(actions).toContain('logs:PutLogEvents');
    });

    test('Flow Log should reference the IAM role', () => {
      const flowLog = template.Resources.VPCFlowLog.Properties;
      expect(flowLog.DeliverLogsPermissionArn).toEqual({
        'Fn::GetAtt': ['FlowLogsRole', 'Arn'],
      });
    });
  });

  describe('S3 Gateway Endpoint', () => {
    test('should have S3 VPC Endpoint resource', () => {
      expect(template.Resources.S3Endpoint).toBeDefined();
      expect(template.Resources.S3Endpoint.Type).toBe('AWS::EC2::VPCEndpoint');
    });

    test('S3 Endpoint should be gateway type', () => {
      const endpoint = template.Resources.S3Endpoint.Properties;
      expect(endpoint.ServiceName).toEqual({
        'Fn::Sub': 'com.amazonaws.${AWS::Region}.s3',
      });
    });

    test('S3 Endpoint should be attached to private and isolated route tables', () => {
      const endpoint = template.Resources.S3Endpoint.Properties;
      const routeTableIds = endpoint.RouteTableIds;

      expect(routeTableIds).toHaveLength(6);
      expect(routeTableIds).toContainEqual({ Ref: 'PrivateRouteTable1' });
      expect(routeTableIds).toContainEqual({ Ref: 'PrivateRouteTable2' });
      expect(routeTableIds).toContainEqual({ Ref: 'PrivateRouteTable3' });
      expect(routeTableIds).toContainEqual({ Ref: 'IsolatedRouteTable1' });
      expect(routeTableIds).toContainEqual({ Ref: 'IsolatedRouteTable2' });
      expect(routeTableIds).toContainEqual({ Ref: 'IsolatedRouteTable3' });
    });

    test('S3 Endpoint should NOT be attached to public route table', () => {
      const endpoint = template.Resources.S3Endpoint.Properties;
      const routeTableIds = endpoint.RouteTableIds;
      expect(routeTableIds).not.toContainEqual({ Ref: 'PublicRouteTable' });
    });
  });

  describe('Network ACLs', () => {
    test('should have 3 Network ACLs (public, private, isolated)', () => {
      const nacls = Object.keys(template.Resources).filter(
        (key) => template.Resources[key].Type === 'AWS::EC2::NetworkAcl'
      );
      expect(nacls).toHaveLength(3);
    });

    test('should have Network ACL entries for each NACL', () => {
      const naclEntries = Object.keys(template.Resources).filter(
        (key) => template.Resources[key].Type === 'AWS::EC2::NetworkAclEntry'
      );
      expect(naclEntries.length).toBeGreaterThanOrEqual(6);
    });

    test('public NACL should allow all inbound traffic', () => {
      const entry = template.Resources.PublicNetworkAclInboundRule;
      expect(entry.Properties.NetworkAclId).toEqual({
        Ref: 'PublicNetworkAcl',
      });
      expect(entry.Properties.Protocol).toBe(-1);
      expect(entry.Properties.RuleAction).toBe('allow');
      expect(entry.Properties.CidrBlock).toBe('0.0.0.0/0');
    });

    test('public NACL should allow all outbound traffic', () => {
      const entry = template.Resources.PublicNetworkAclOutboundRule;
      expect(entry.Properties.Egress).toBe(true);
      expect(entry.Properties.RuleAction).toBe('allow');
    });

    test('private NACL should allow all traffic', () => {
      const inbound = template.Resources.PrivateNetworkAclInboundRule;
      const outbound = template.Resources.PrivateNetworkAclOutboundRule;
      expect(inbound.Properties.RuleAction).toBe('allow');
      expect(outbound.Properties.RuleAction).toBe('allow');
    });

    test('isolated NACL should only allow VPC CIDR traffic', () => {
      const inbound = template.Resources.IsolatedNetworkAclInboundRule;
      const outbound = template.Resources.IsolatedNetworkAclOutboundRule;
      expect(inbound.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(outbound.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('all 9 subnets should have NACL associations', () => {
      const associations = Object.keys(template.Resources).filter(
        (key) =>
          template.Resources[key].Type === 'AWS::EC2::SubnetNetworkAclAssociation'
      );
      expect(associations).toHaveLength(9);
    });
  });

  describe('Resource Tagging', () => {
    test('all taggable resources should have Environment tag', () => {
      const taggableTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::Subnet',
        'AWS::EC2::NatGateway',
        'AWS::EC2::RouteTable',
        'AWS::EC2::NetworkAcl',
      ];

      Object.entries(template.Resources).forEach(([name, resource]: [string, any]) => {
        if (taggableTypes.includes(resource.Type)) {
          const tags = resource.Properties.Tags;
          expect(tags).toBeDefined();
          const envTag = tags.find((t: any) => t.Key === 'Environment');
          expect(envTag).toBeDefined();
          expect(envTag.Value).toBe('Production');
        }
      });
    });

    test('all taggable resources should have Project tag', () => {
      const taggableTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::Subnet',
        'AWS::EC2::NatGateway',
        'AWS::EC2::RouteTable',
        'AWS::EC2::NetworkAcl',
      ];

      Object.entries(template.Resources).forEach(([name, resource]: [string, any]) => {
        if (taggableTypes.includes(resource.Type)) {
          const tags = resource.Properties.Tags;
          const projTag = tags.find((t: any) => t.Key === 'Project');
          expect(projTag).toBeDefined();
          expect(projTag.Value).toBe('PaymentGateway');
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should export VPC ID', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
      expect(template.Outputs.VPCId.Export).toBeDefined();
    });

    test('should export all 3 public subnet IDs', () => {
      ['PublicSubnet1Id', 'PublicSubnet2Id', 'PublicSubnet3Id'].forEach(
        (outputName) => {
          expect(template.Outputs[outputName]).toBeDefined();
          expect(template.Outputs[outputName].Export).toBeDefined();
        }
      );
    });

    test('should export all 3 private subnet IDs', () => {
      ['PrivateSubnet1Id', 'PrivateSubnet2Id', 'PrivateSubnet3Id'].forEach(
        (outputName) => {
          expect(template.Outputs[outputName]).toBeDefined();
          expect(template.Outputs[outputName].Export).toBeDefined();
        }
      );
    });

    test('should export all 3 isolated subnet IDs', () => {
      ['IsolatedSubnet1Id', 'IsolatedSubnet2Id', 'IsolatedSubnet3Id'].forEach(
        (outputName) => {
          expect(template.Outputs[outputName]).toBeDefined();
          expect(template.Outputs[outputName].Export).toBeDefined();
        }
      );
    });

    test('should export all 3 NAT Gateway IDs', () => {
      ['NatGateway1Id', 'NatGateway2Id', 'NatGateway3Id'].forEach(
        (outputName) => {
          expect(template.Outputs[outputName]).toBeDefined();
          expect(template.Outputs[outputName].Export).toBeDefined();
        }
      );
    });

    test('should export all route table IDs', () => {
      const routeTableOutputs = [
        'PublicRouteTableId',
        'PrivateRouteTable1Id',
        'PrivateRouteTable2Id',
        'PrivateRouteTable3Id',
        'IsolatedRouteTable1Id',
        'IsolatedRouteTable2Id',
        'IsolatedRouteTable3Id',
      ];

      routeTableOutputs.forEach((outputName) => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Export).toBeDefined();
      });
    });

    test('all outputs should have export names with stack name prefix', () => {
      Object.entries(template.Outputs).forEach(([key, output]: [string, any]) => {
        expect(output.Export.Name['Fn::Sub']).toBe(
          `\${AWS::StackName}-${key}`
        );
      });
    });

    test('should have at least 19 outputs for integration', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(19);
    });
  });

  describe('Resource Dependencies', () => {
    test('EIPs should depend on Internet Gateway attachment', () => {
      ['EIP1', 'EIP2', 'EIP3'].forEach((eipName) => {
        expect(template.Resources[eipName].DependsOn).toBe('AttachGateway');
      });
    });

    test('Public Route should depend on Internet Gateway attachment', () => {
      expect(template.Resources.PublicRoute.DependsOn).toBe('AttachGateway');
    });

    test('NAT Gateways should reference EIPs via GetAtt', () => {
      expect(template.Resources.NatGateway1.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['EIP1', 'AllocationId'],
      });
    });
  });

  describe('Deletion and Update Policies', () => {
    test('all resources should be deletable (no Retain policies)', () => {
      Object.entries(template.Resources).forEach(([name, resource]: [string, any]) => {
        expect(resource.DeletionPolicy).not.toBe('Retain');
        expect(resource.UpdateReplacePolicy).not.toBe('Retain');
      });
    });

    test('no resources should have DeletionProtection enabled', () => {
      Object.entries(template.Resources).forEach(([name, resource]: [string, any]) => {
        if (resource.Properties) {
          expect(resource.Properties.DeletionProtectionEnabled).not.toBe(true);
        }
      });
    });
  });

  describe('Resource Count', () => {
    test('should have exactly 60 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(60);
    });

    test('should have correct count of each resource type', () => {
      const resourceCounts: { [key: string]: number } = {};
      Object.values(template.Resources).forEach((resource: any) => {
        const type = resource.Type;
        resourceCounts[type] = (resourceCounts[type] || 0) + 1;
      });

      expect(resourceCounts['AWS::EC2::VPC']).toBe(1);
      expect(resourceCounts['AWS::EC2::InternetGateway']).toBe(1);
      expect(resourceCounts['AWS::EC2::Subnet']).toBe(9);
      expect(resourceCounts['AWS::EC2::EIP']).toBe(3);
      expect(resourceCounts['AWS::EC2::NatGateway']).toBe(3);
      expect(resourceCounts['AWS::EC2::RouteTable']).toBe(7);
      expect(resourceCounts['AWS::EC2::Route']).toBe(4);
      expect(resourceCounts['AWS::EC2::SubnetRouteTableAssociation']).toBe(9);
      expect(resourceCounts['AWS::EC2::NetworkAcl']).toBe(3);
      expect(resourceCounts['AWS::EC2::NetworkAclEntry']).toBe(6);
      expect(resourceCounts['AWS::EC2::SubnetNetworkAclAssociation']).toBe(9);
      expect(resourceCounts['AWS::EC2::FlowLog']).toBe(1);
      expect(resourceCounts['AWS::Logs::LogGroup']).toBe(1);
      expect(resourceCounts['AWS::IAM::Role']).toBe(1);
      expect(resourceCounts['AWS::EC2::VPCEndpoint']).toBe(1);
      expect(resourceCounts['AWS::EC2::VPCGatewayAttachment']).toBe(1);
    });
  });

  describe('PCI DSS Compliance Requirements', () => {
    test('isolated subnets should have no internet routes', () => {
      const isolatedRoutes = Object.entries(template.Resources).filter(
        ([name, resource]: [string, any]) =>
          resource.Type === 'AWS::EC2::Route' &&
          name.includes('Isolated')
      );
      expect(isolatedRoutes).toHaveLength(0);
    });

    test('isolated Network ACL should restrict to VPC CIDR only', () => {
      const inbound = template.Resources.IsolatedNetworkAclInboundRule;
      const outbound = template.Resources.IsolatedNetworkAclOutboundRule;
      expect(inbound.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(outbound.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC Flow Logs should be enabled for audit trail', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Properties.TrafficType).toBe('ALL');
    });

    test('private subnets should route through NAT Gateways', () => {
      ['PrivateRoute1', 'PrivateRoute2', 'PrivateRoute3'].forEach((routeName) => {
        const route = template.Resources[routeName];
        expect(route.Properties.NatGatewayId).toBeDefined();
      });
    });

    test('high availability with 3 AZs and 3 NAT Gateways', () => {
      const natGateways = Object.keys(template.Resources).filter(
        (key) => template.Resources[key].Type === 'AWS::EC2::NatGateway'
      );
      expect(natGateways).toHaveLength(3);
    });
  });
});
