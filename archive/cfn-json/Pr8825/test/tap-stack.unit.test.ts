import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation VPC Template', () => {
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
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('should have Resources section with multiple resources', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(40);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(10);
    });
  });

  describe('Parameters', () => {
    test('EnvironmentSuffix parameter should have validation', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toBeDefined();
    });
  });

  describe('VPC Configuration', () => {
    test('should have VPC resource with correct CIDR', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('VPC should have proper tags with EnvironmentSuffix', () => {
      const tags = template.Resources.VPC.Properties.Tags;
      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have DHCP Options with AmazonProvidedDNS', () => {
      const dhcp = template.Resources.DHCPOptions;
      expect(dhcp).toBeDefined();
      expect(dhcp.Type).toBe('AWS::EC2::DHCPOptions');
      expect(dhcp.Properties.DomainNameServers).toEqual(['AmazonProvidedDNS']);
    });

    test('should have DHCP Options association', () => {
      const assoc = template.Resources.VPCDHCPOptionsAssociation;
      expect(assoc).toBeDefined();
      expect(assoc.Type).toBe('AWS::EC2::VPCDHCPOptionsAssociation');
    });
  });

  describe('Internet Gateway', () => {
    test('should have Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      const attachment = template.Resources.VPCGatewayAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId.Ref).toBe('VPC');
      expect(attachment.Properties.InternetGatewayId.Ref).toBe('InternetGateway');
    });
  });

  describe('Subnets', () => {
    const publicSubnets = ['PublicSubnetA', 'PublicSubnetB', 'PublicSubnetC'];
    const privateSubnets = ['PrivateSubnetA', 'PrivateSubnetB', 'PrivateSubnetC'];

    test('should have 3 public subnets', () => {
      publicSubnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('should have 3 private subnets', () => {
      privateSubnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('public subnets should have correct CIDRs', () => {
      expect(template.Resources.PublicSubnetA.Properties.CidrBlock).toBe('10.0.0.0/24');
      expect(template.Resources.PublicSubnetB.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnetC.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('private subnets should have correct CIDRs', () => {
      expect(template.Resources.PrivateSubnetA.Properties.CidrBlock).toBe('10.0.10.0/24');
      expect(template.Resources.PrivateSubnetB.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(template.Resources.PrivateSubnetC.Properties.CidrBlock).toBe('10.0.12.0/24');
    });

    test('public subnets should be in correct AZs', () => {
      const azA = template.Resources.PublicSubnetA.Properties.AvailabilityZone;
      const azB = template.Resources.PublicSubnetB.Properties.AvailabilityZone;
      const azC = template.Resources.PublicSubnetC.Properties.AvailabilityZone;

      // Accept either hardcoded AZ strings or CloudFormation intrinsics using Fn::Select/Fn::GetAZs
      if (typeof azA === 'string') {
        expect(azA).toBe('us-east-1a');
      } else {
        expect(azA['Fn::Select'][0]).toBe(0);
        expect(azA['Fn::Select'][1]).toEqual({ 'Fn::GetAZs': '' });
      }

      if (typeof azB === 'string') {
        expect(azB).toBe('us-east-1b');
      } else {
        expect(azB['Fn::Select'][0]).toBe(1);
        expect(azB['Fn::Select'][1]).toEqual({ 'Fn::GetAZs': '' });
      }

      if (typeof azC === 'string') {
        expect(azC).toBe('us-east-1c');
      } else {
        expect(azC['Fn::Select'][0]).toBe(2);
        expect(azC['Fn::Select'][1]).toEqual({ 'Fn::GetAZs': '' });
      }
    });

    test('public subnets should auto-assign public IPs', () => {
      publicSubnets.forEach(subnet => {
        expect(template.Resources[subnet].Properties.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('private subnets should not auto-assign public IPs', () => {
      privateSubnets.forEach(subnet => {
        expect(template.Resources[subnet].Properties.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });

  describe('NAT Gateways', () => {
    const natGateways = ['NatGatewayA', 'NatGatewayB', 'NatGatewayC'];
    const eips = ['EIPNatGatewayA', 'EIPNatGatewayB', 'EIPNatGatewayC'];

    test('should have 3 NAT Gateways', () => {
      natGateways.forEach(nat => {
        expect(template.Resources[nat]).toBeDefined();
        expect(template.Resources[nat].Type).toBe('AWS::EC2::NatGateway');
      });
    });

    test('should have 3 Elastic IPs', () => {
      eips.forEach(eip => {
        expect(template.Resources[eip]).toBeDefined();
        expect(template.Resources[eip].Type).toBe('AWS::EC2::EIP');
      });
    });

    test('EIPs should have DependsOn VPCGatewayAttachment', () => {
      eips.forEach(eip => {
        expect(template.Resources[eip].DependsOn).toBe('VPCGatewayAttachment');
      });
    });

    test('EIPs should be VPC domain', () => {
      eips.forEach(eip => {
        expect(template.Resources[eip].Properties.Domain).toBe('vpc');
      });
    });

    test('NAT Gateways should be in public subnets', () => {
      expect(template.Resources.NatGatewayA.Properties.SubnetId.Ref).toBe('PublicSubnetA');
      expect(template.Resources.NatGatewayB.Properties.SubnetId.Ref).toBe('PublicSubnetB');
      expect(template.Resources.NatGatewayC.Properties.SubnetId.Ref).toBe('PublicSubnetC');
    });
  });

  describe('Route Tables and Routes', () => {
    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have 3 private route tables', () => {
      ['PrivateRouteTableA', 'PrivateRouteTableB', 'PrivateRouteTableC'].forEach(rt => {
        expect(template.Resources[rt]).toBeDefined();
        expect(template.Resources[rt].Type).toBe('AWS::EC2::RouteTable');
      });
    });

    test('public route should point to IGW with DependsOn', () => {
      const route = template.Resources.PublicRoute;
      expect(route.Properties.GatewayId.Ref).toBe('InternetGateway');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.DependsOn).toBe('VPCGatewayAttachment');
    });

    test('private routes should point to respective NAT Gateways', () => {
      expect(template.Resources.PrivateRouteA.Properties.NatGatewayId.Ref).toBe('NatGatewayA');
      expect(template.Resources.PrivateRouteB.Properties.NatGatewayId.Ref).toBe('NatGatewayB');
      expect(template.Resources.PrivateRouteC.Properties.NatGatewayId.Ref).toBe('NatGatewayC');
    });

    test('should have route table associations for all subnets', () => {
      const associations = [
        'PublicSubnetARouteTableAssociation',
        'PublicSubnetBRouteTableAssociation',
        'PublicSubnetCRouteTableAssociation',
        'PrivateSubnetARouteTableAssociation',
        'PrivateSubnetBRouteTableAssociation',
        'PrivateSubnetCRouteTableAssociation'
      ];
      associations.forEach(assoc => {
        expect(template.Resources[assoc]).toBeDefined();
        expect(template.Resources[assoc].Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      });
    });
  });

  describe('Network ACLs', () => {
    test('should have custom Network ACL', () => {
      expect(template.Resources.NetworkAcl).toBeDefined();
      expect(template.Resources.NetworkAcl.Type).toBe('AWS::EC2::NetworkAcl');
    });

    test('should have SSH deny rule', () => {
      const sshDeny = template.Resources.NetworkAclEntryInboundSSHDeny;
      expect(sshDeny).toBeDefined();
      expect(sshDeny.Properties.RuleNumber).toBe(100);
      expect(sshDeny.Properties.Protocol).toBe(6);
      expect(sshDeny.Properties.RuleAction).toBe('deny');
      expect(sshDeny.Properties.PortRange.From).toBe(22);
      expect(sshDeny.Properties.PortRange.To).toBe(22);
    });

    test('should have inbound allow-all rule with lower priority', () => {
      const allowAll = template.Resources.NetworkAclEntryInboundAllowAll;
      expect(allowAll.Properties.RuleNumber).toBe(200);
      expect(allowAll.Properties.RuleAction).toBe('allow');
    });

    test('should have NACL associations for all subnets', () => {
      const associations = [
        'PublicSubnetANetworkAclAssociation',
        'PublicSubnetBNetworkAclAssociation',
        'PublicSubnetCNetworkAclAssociation',
        'PrivateSubnetANetworkAclAssociation',
        'PrivateSubnetBNetworkAclAssociation',
        'PrivateSubnetCNetworkAclAssociation'
      ];
      associations.forEach(assoc => {
        expect(template.Resources[assoc]).toBeDefined();
      });
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have CloudWatch Log Group with retention', () => {
      const logGroup = template.Resources.VPCFlowLogsLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(7);
    });

    test('Log Group name should include EnvironmentSuffix', () => {
      const logGroupName = template.Resources.VPCFlowLogsLogGroup.Properties.LogGroupName;
      expect(logGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have IAM Role with RoleName including suffix', () => {
      const role = template.Resources.VPCFlowLogsRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('IAM Role should have correct trust policy', () => {
      const trustPolicy = template.Resources.VPCFlowLogsRole.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe('vpc-flow-logs.amazonaws.com');
    });

    test('IAM Role should have scoped permissions not wildcard', () => {
      const policy = template.Resources.VPCFlowLogsRole.Properties.Policies[0];
      const resource = policy.PolicyDocument.Statement[0].Resource;
      expect(resource['Fn::GetAtt']).toBeDefined();
      expect(resource['Fn::GetAtt'][0]).toBe('VPCFlowLogsLogGroup');
    });

    test('should have VPC Flow Log capturing ALL traffic', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog).toBeDefined();
      expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLog.Properties.TrafficType).toBe('ALL');
      expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output with export', () => {
      const output = template.Outputs.VPCId;
      expect(output).toBeDefined();
      expect(output.Value.Ref).toBe('VPC');
      expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
    });

    test('should have individual subnet outputs with exports', () => {
      const subnetOutputs = [
        'PublicSubnetAId', 'PublicSubnetBId', 'PublicSubnetCId',
        'PrivateSubnetAId', 'PrivateSubnetBId', 'PrivateSubnetCId'
      ];
      subnetOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
        expect(template.Outputs[output].Export).toBeDefined();
      });
    });

    test('should have NAT Gateway outputs', () => {
      ['NatGatewayAId', 'NatGatewayBId', 'NatGatewayCId'].forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
        expect(template.Outputs[output].Export).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(key => {
        expect(template.Outputs[key].Description).toBeDefined();
        expect(template.Outputs[key].Description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Resource Tagging', () => {
    const taggedResources = ['VPC', 'InternetGateway', 'PublicSubnetA', 'PrivateSubnetA', 'NatGatewayA'];

    test('resources should have Environment and CostCenter tags', () => {
      taggedResources.forEach(resource => {
        const tags = template.Resources[resource].Properties.Tags;
        expect(tags.find((t: any) => t.Key === 'Environment')).toBeDefined();
        expect(tags.find((t: any) => t.Key === 'CostCenter')).toBeDefined();
      });
    });

    test('resources should have Name tag with EnvironmentSuffix', () => {
      taggedResources.forEach(resource => {
        const tags = template.Resources[resource].Properties.Tags;
        const nameTag = tags.find((t: any) => t.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });
  });
});
