import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

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
      expect(typeof template.Description).toBe('string');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('should have Project parameter', () => {
      expect(template.Parameters.Project).toBeDefined();
    });

    test('should have CostCenter parameter', () => {
      expect(template.Parameters.CostCenter).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct type', () => {
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
    });

    test('Environment parameter should have allowed values', () => {
      expect(template.Parameters.Environment.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('all parameters should have descriptions', () => {
      Object.keys(template.Parameters).forEach(paramKey => {
        expect(template.Parameters[paramKey].Description).toBeDefined();
      });
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
    });

    test('VPC should have correct type', () => {
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have CIDR 10.0.0.0/16', () => {
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS support enabled', () => {
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should have DNS hostnames enabled', () => {
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
    });

    test('VPC should have tags including EnvironmentSuffix', () => {
      const tags = template.Resources.VPC.Properties.Tags;
      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('VPC should have all required tags', () => {
      const tags = template.Resources.VPC.Properties.Tags;
      const tagKeys = tags.map((tag: any) => tag.Key);
      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('CostCenter');
    });
  });

  describe('Internet Gateway', () => {
    test('should have InternetGateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
    });

    test('InternetGateway should have correct type', () => {
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
    });

    test('AttachGateway should reference VPC and IGW', () => {
      const attachment = template.Resources.AttachGateway.Properties;
      expect(attachment.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });
  });

  describe('Subnet Resources', () => {
    test('should have exactly 9 subnets', () => {
      const subnets = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::EC2::Subnet'
      );
      expect(subnets.length).toBe(9);
    });

    test('should have 3 public subnets', () => {
      const publicSubnets = ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'];
      publicSubnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('should have 3 private subnets', () => {
      const privateSubnets = ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'];
      privateSubnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('should have 3 database subnets', () => {
      const databaseSubnets = ['DatabaseSubnet1', 'DatabaseSubnet2', 'DatabaseSubnet3'];
      databaseSubnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('public subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PublicSubnet3.Properties.CidrBlock).toBe('10.0.3.0/24');
    });

    test('private subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.12.0/24');
      expect(template.Resources.PrivateSubnet3.Properties.CidrBlock).toBe('10.0.13.0/24');
    });

    test('database subnets should have correct CIDR blocks', () => {
      expect(template.Resources.DatabaseSubnet1.Properties.CidrBlock).toBe('10.0.21.0/24');
      expect(template.Resources.DatabaseSubnet2.Properties.CidrBlock).toBe('10.0.22.0/24');
      expect(template.Resources.DatabaseSubnet3.Properties.CidrBlock).toBe('10.0.23.0/24');
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet3.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('private subnets should not have MapPublicIpOnLaunch', () => {
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
      expect(template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBeUndefined();
      expect(template.Resources.PrivateSubnet3.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('all subnets should reference VPC', () => {
      const subnets = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::EC2::Subnet'
      );
      subnets.forEach(subnet => {
        expect(template.Resources[subnet].Properties.VpcId).toEqual({ Ref: 'VPC' });
      });
    });

    test('all subnets should have Tier tags', () => {
      const publicSubnets = ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'];
      const privateSubnets = ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'];
      const databaseSubnets = ['DatabaseSubnet1', 'DatabaseSubnet2', 'DatabaseSubnet3'];

      publicSubnets.forEach(subnet => {
        const tags = template.Resources[subnet].Properties.Tags;
        const tierTag = tags.find((tag: any) => tag.Key === 'Tier');
        expect(tierTag.Value).toBe('public');
      });

      privateSubnets.forEach(subnet => {
        const tags = template.Resources[subnet].Properties.Tags;
        const tierTag = tags.find((tag: any) => tag.Key === 'Tier');
        expect(tierTag.Value).toBe('private');
      });

      databaseSubnets.forEach(subnet => {
        const tags = template.Resources[subnet].Properties.Tags;
        const tierTag = tags.find((tag: any) => tag.Key === 'Tier');
        expect(tierTag.Value).toBe('database');
      });
    });
  });

  describe('NAT Gateway Resources', () => {
    test('should have 3 NAT Gateways', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.NATGateway2).toBeDefined();
      expect(template.Resources.NATGateway3).toBeDefined();
    });

    test('NAT Gateways should have correct type', () => {
      expect(template.Resources.NATGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGateway2.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGateway3.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have 3 Elastic IPs', () => {
      expect(template.Resources.EIP1).toBeDefined();
      expect(template.Resources.EIP2).toBeDefined();
      expect(template.Resources.EIP3).toBeDefined();
    });

    test('Elastic IPs should have correct type', () => {
      expect(template.Resources.EIP1.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.EIP2.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.EIP3.Type).toBe('AWS::EC2::EIP');
    });

    test('Elastic IPs should have domain vpc', () => {
      expect(template.Resources.EIP1.Properties.Domain).toBe('vpc');
      expect(template.Resources.EIP2.Properties.Domain).toBe('vpc');
      expect(template.Resources.EIP3.Properties.Domain).toBe('vpc');
    });

    test('Elastic IPs should depend on AttachGateway', () => {
      expect(template.Resources.EIP1.DependsOn).toBe('AttachGateway');
      expect(template.Resources.EIP2.DependsOn).toBe('AttachGateway');
      expect(template.Resources.EIP3.DependsOn).toBe('AttachGateway');
    });

    test('NAT Gateways should be in public subnets', () => {
      expect(template.Resources.NATGateway1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(template.Resources.NATGateway2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
      expect(template.Resources.NATGateway3.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet3' });
    });

    test('NAT Gateways should reference their Elastic IPs', () => {
      expect(template.Resources.NATGateway1.Properties.AllocationId).toEqual({ 'Fn::GetAtt': ['EIP1', 'AllocationId'] });
      expect(template.Resources.NATGateway2.Properties.AllocationId).toEqual({ 'Fn::GetAtt': ['EIP2', 'AllocationId'] });
      expect(template.Resources.NATGateway3.Properties.AllocationId).toEqual({ 'Fn::GetAtt': ['EIP3', 'AllocationId'] });
    });
  });

  describe('Route Tables', () => {
    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
    });

    test('should have 3 private route tables', () => {
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(template.Resources.PrivateRouteTable3).toBeDefined();
    });

    test('should have 3 database route tables', () => {
      expect(template.Resources.DatabaseRouteTable1).toBeDefined();
      expect(template.Resources.DatabaseRouteTable2).toBeDefined();
      expect(template.Resources.DatabaseRouteTable3).toBeDefined();
    });

    test('public route table should have IGW route', () => {
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(template.Resources.PublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('private route tables should have NAT Gateway routes', () => {
      expect(template.Resources.PrivateRoute1.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway1' });
      expect(template.Resources.PrivateRoute2.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway2' });
      expect(template.Resources.PrivateRoute3.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway3' });
    });

    test('database route tables should not have internet routes', () => {
      expect(template.Resources.DatabaseRoute1).toBeUndefined();
      expect(template.Resources.DatabaseRoute2).toBeUndefined();
      expect(template.Resources.DatabaseRoute3).toBeUndefined();
    });

    test('should have route table associations for all subnets', () => {
      expect(template.Resources.PublicSubnetRouteTableAssociation1).toBeDefined();
      expect(template.Resources.PublicSubnetRouteTableAssociation2).toBeDefined();
      expect(template.Resources.PublicSubnetRouteTableAssociation3).toBeDefined();
      expect(template.Resources.PrivateSubnetRouteTableAssociation1).toBeDefined();
      expect(template.Resources.PrivateSubnetRouteTableAssociation2).toBeDefined();
      expect(template.Resources.PrivateSubnetRouteTableAssociation3).toBeDefined();
      expect(template.Resources.DatabaseSubnetRouteTableAssociation1).toBeDefined();
      expect(template.Resources.DatabaseSubnetRouteTableAssociation2).toBeDefined();
      expect(template.Resources.DatabaseSubnetRouteTableAssociation3).toBeDefined();
    });
  });

  describe('Network ACLs', () => {
    test('should have public network ACL', () => {
      expect(template.Resources.PublicNetworkAcl).toBeDefined();
      expect(template.Resources.PublicNetworkAcl.Type).toBe('AWS::EC2::NetworkAcl');
    });

    test('should have private network ACL', () => {
      expect(template.Resources.PrivateNetworkAcl).toBeDefined();
      expect(template.Resources.PrivateNetworkAcl.Type).toBe('AWS::EC2::NetworkAcl');
    });

    test('should have database network ACL', () => {
      expect(template.Resources.DatabaseNetworkAcl).toBeDefined();
      expect(template.Resources.DatabaseNetworkAcl.Type).toBe('AWS::EC2::NetworkAcl');
    });

    test('public NACL should allow HTTP inbound', () => {
      expect(template.Resources.PublicNetworkAclInboundHTTP).toBeDefined();
      const rule = template.Resources.PublicNetworkAclInboundHTTP.Properties;
      expect(rule.Protocol).toBe(6);
      expect(rule.PortRange.From).toBe(80);
      expect(rule.PortRange.To).toBe(80);
    });

    test('public NACL should allow HTTPS inbound', () => {
      expect(template.Resources.PublicNetworkAclInboundHTTPS).toBeDefined();
      const rule = template.Resources.PublicNetworkAclInboundHTTPS.Properties;
      expect(rule.Protocol).toBe(6);
      expect(rule.PortRange.From).toBe(443);
      expect(rule.PortRange.To).toBe(443);
    });

    test('database NACL should allow MySQL from private subnets', () => {
      expect(template.Resources.DatabaseNetworkAclInboundMySQL1).toBeDefined();
      const rule = template.Resources.DatabaseNetworkAclInboundMySQL1.Properties;
      expect(rule.Protocol).toBe(6);
      expect(rule.PortRange.From).toBe(3306);
      expect(rule.PortRange.To).toBe(3306);
    });

    test('database NACL should allow PostgreSQL from private subnets', () => {
      expect(template.Resources.DatabaseNetworkAclInboundPostgres1).toBeDefined();
      const rule = template.Resources.DatabaseNetworkAclInboundPostgres1.Properties;
      expect(rule.Protocol).toBe(6);
      expect(rule.PortRange.From).toBe(5432);
      expect(rule.PortRange.To).toBe(5432);
    });

    test('should have NACL associations for all subnets', () => {
      expect(template.Resources.PublicSubnetNetworkAclAssociation1).toBeDefined();
      expect(template.Resources.PrivateSubnetNetworkAclAssociation1).toBeDefined();
      expect(template.Resources.DatabaseSubnetNetworkAclAssociation1).toBeDefined();
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have VPC Flow Logs resource', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');
    });

    test('should have CloudWatch Logs Log Group', () => {
      expect(template.Resources.VPCFlowLogsLogGroup).toBeDefined();
      expect(template.Resources.VPCFlowLogsLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have IAM Role for VPC Flow Logs', () => {
      expect(template.Resources.VPCFlowLogsRole).toBeDefined();
      expect(template.Resources.VPCFlowLogsRole.Type).toBe('AWS::IAM::Role');
    });

    test('Log Group should have 7-day retention', () => {
      expect(template.Resources.VPCFlowLogsLogGroup.Properties.RetentionInDays).toBe(7);
    });

    test('Flow Log should capture all traffic', () => {
      expect(template.Resources.VPCFlowLog.Properties.TrafficType).toBe('ALL');
    });

    test('Flow Log should reference VPC', () => {
      expect(template.Resources.VPCFlowLog.Properties.ResourceId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.VPCFlowLog.Properties.ResourceType).toBe('VPC');
    });
  });

  describe('Resource Naming with EnvironmentSuffix', () => {
    test('all resources with Name tags should include EnvironmentSuffix', () => {
      const resourcesWithTags = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Properties?.Tags
      );

      resourcesWithTags.forEach(resourceKey => {
        const tags = template.Resources[resourceKey].Properties.Tags;
        const nameTag = tags.find((tag: any) => tag.Key === 'Name');
        if (nameTag) {
          expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('route table names should not have hardcoded environment', () => {
      const routeTableNames = [
        template.Resources.PublicRouteTable.Properties.Tags.find((t: any) => t.Key === 'Name').Value['Fn::Sub'],
        template.Resources.PrivateRouteTable1.Properties.Tags.find((t: any) => t.Key === 'Name').Value['Fn::Sub'],
        template.Resources.DatabaseRouteTable1.Properties.Tags.find((t: any) => t.Key === 'Name').Value['Fn::Sub'],
      ];

      routeTableNames.forEach(name => {
        expect(name).toContain('${Environment}');
        expect(name).not.toMatch(/^prod-/);
        expect(name).not.toMatch(/^dev-/);
        expect(name).not.toMatch(/^staging-/);
      });
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have all public subnet outputs', () => {
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
      expect(template.Outputs.PublicSubnet3Id).toBeDefined();
    });

    test('should have all private subnet outputs', () => {
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet3Id).toBeDefined();
    });

    test('should have all database subnet outputs', () => {
      expect(template.Outputs.DatabaseSubnet1Id).toBeDefined();
      expect(template.Outputs.DatabaseSubnet2Id).toBeDefined();
      expect(template.Outputs.DatabaseSubnet3Id).toBeDefined();
    });

    test('should have all NAT Gateway outputs', () => {
      expect(template.Outputs.NATGateway1Id).toBeDefined();
      expect(template.Outputs.NATGateway2Id).toBeDefined();
      expect(template.Outputs.NATGateway3Id).toBeDefined();
    });

    test('should have InternetGatewayId output', () => {
      expect(template.Outputs.InternetGatewayId).toBeDefined();
    });

    test('should have VPCFlowLogsLogGroupName output', () => {
      expect(template.Outputs.VPCFlowLogsLogGroupName).toBeDefined();
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
      });
    });
  });

  describe('No Retain Policies', () => {
    test('no resources should have Retain deletion policy', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
        if (resource.UpdateReplacePolicy) {
          expect(resource.UpdateReplacePolicy).not.toBe('Retain');
        }
      });
    });

    test('no resources should have deletion protection', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties?.DeletionProtectionEnabled !== undefined) {
          expect(resource.Properties.DeletionProtectionEnabled).toBe(false);
        }
      });
    });
  });

  describe('PCI DSS Compliance', () => {
    test('should have network segmentation with 3 tiers', () => {
      const subnets = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::EC2::Subnet'
      );

      const tiers = new Set();
      subnets.forEach(subnet => {
        const tags = template.Resources[subnet].Properties.Tags;
        const tierTag = tags.find((tag: any) => tag.Key === 'Tier');
        if (tierTag) tiers.add(tierTag.Value);
      });

      expect(tiers.size).toBe(3);
      expect(tiers.has('public')).toBe(true);
      expect(tiers.has('private')).toBe(true);
      expect(tiers.has('database')).toBe(true);
    });

    test('should have Network ACLs for tier isolation', () => {
      const nacls = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::EC2::NetworkAcl'
      );
      expect(nacls.length).toBeGreaterThanOrEqual(3);
    });

    test('should have VPC Flow Logs for audit trail', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
    });
  });

  describe('Resource Count Validation', () => {
    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(50);
    });

    test('should have 4 parameters', () => {
      const paramCount = Object.keys(template.Parameters).length;
      expect(paramCount).toBe(4);
    });

    test('should have 15 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(15);
    });
  });
});
