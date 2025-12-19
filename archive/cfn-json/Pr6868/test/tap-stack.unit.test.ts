import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

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

    test('should have a description for payment processing platform', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Payment Processing Platform');
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required top-level sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix should have correct constraints', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.MinLength).toBe('3');
      expect(param.MaxLength).toBe('10');
      expect(param.AllowedPattern).toBe('[a-z0-9-]+');
    });

    test('should have VpcCidr parameter with default', () => {
      expect(template.Parameters.VpcCidr).toBeDefined();
      expect(template.Parameters.VpcCidr.Default).toBe('10.0.0.0/16');
    });

    test('should have BastionAllowedIP parameter', () => {
      expect(template.Parameters.BastionAllowedIP).toBeDefined();
      expect(template.Parameters.BastionAllowedIP.Type).toBe('String');
    });

    test('should have Environment parameter with allowed values', () => {
      const param = template.Parameters.Environment;
      expect(param).toBeDefined();
      expect(param.AllowedValues).toContain('development');
      expect(param.AllowedValues).toContain('staging');
      expect(param.AllowedValues).toContain('production');
    });

    test('should have Owner parameter with default', () => {
      expect(template.Parameters.Owner).toBeDefined();
      expect(template.Parameters.Owner.Default).toBe('platform-team');
    });

    test('should have CostCenter parameter with default', () => {
      expect(template.Parameters.CostCenter).toBeDefined();
      expect(template.Parameters.CostCenter.Default).toBe('payment-processing');
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.VPC.Properties;
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('VPC should use parameter for CIDR', () => {
      const vpc = template.Resources.VPC.Properties;
      expect(vpc.CidrBlock).toEqual({ Ref: 'VpcCidr' });
    });

    test('VPC should have proper tags including EnvironmentSuffix', () => {
      const vpc = template.Resources.VPC.Properties;
      expect(vpc.Tags).toBeDefined();
      const nameTag = vpc.Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toEqual({ 'Fn::Sub': 'vpc-${EnvironmentSuffix}' });
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      expect(template.Resources.VPCGatewayAttachment).toBeDefined();
      expect(template.Resources.VPCGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });
  });

  describe('Subnet Architecture', () => {
    test('should have exactly 3 public subnets', () => {
      const publicSubnets = Object.keys(template.Resources).filter(key =>
        key.startsWith('PublicSubnet') && template.Resources[key].Type === 'AWS::EC2::Subnet'
      );
      expect(publicSubnets.length).toBe(3);
    });

    test('should have exactly 6 private subnets', () => {
      const privateSubnets = Object.keys(template.Resources).filter(key =>
        key.startsWith('PrivateSubnet') && template.Resources[key].Type === 'AWS::EC2::Subnet'
      );
      expect(privateSubnets.length).toBe(6);
    });

    test('public subnets should have correct CIDR blocks', () => {
      const expectedCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];
      ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'].forEach((subnetName, idx) => {
        expect(template.Resources[subnetName]).toBeDefined();
        expect(template.Resources[subnetName].Properties.CidrBlock).toBe(expectedCidrs[idx]);
      });
    });

    test('private subnets should have correct CIDR blocks', () => {
      const expectedCidrs = [
        '10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24',
        '10.0.14.0/24', '10.0.15.0/24', '10.0.16.0/24'
      ];
      for (let i = 1; i <= 6; i++) {
        const subnetName = `PrivateSubnet${i}`;
        expect(template.Resources[subnetName]).toBeDefined();
        expect(template.Resources[subnetName].Properties.CidrBlock).toBe(expectedCidrs[i - 1]);
      }
    });

    test('public subnets should map public IP on launch', () => {
      ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'].forEach(subnetName => {
        expect(template.Resources[subnetName].Properties.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('subnets should be in different availability zones', () => {
      const azs = new Set();
      ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'].forEach(subnetName => {
        const az = template.Resources[subnetName].Properties.AvailabilityZone;
        azs.add(JSON.stringify(az));
      });
      expect(azs.size).toBe(3);
    });

    test('subnets should include EnvironmentSuffix in names', () => {
      ['PublicSubnet1', 'PrivateSubnet1'].forEach(subnetName => {
        const tags = template.Resources[subnetName].Properties.Tags;
        const nameTag = tags.find((t: any) => t.Key === 'Name');
        expect(nameTag.Value).toEqual(expect.objectContaining({ 'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}') }));
      });
    });
  });

  describe('NAT Gateways and Elastic IPs', () => {
    test('should have exactly 3 Elastic IPs', () => {
      const eips = Object.keys(template.Resources).filter(key =>
        key.startsWith('EIP') && template.Resources[key].Type === 'AWS::EC2::EIP'
      );
      expect(eips.length).toBe(3);
    });

    test('Elastic IPs should have vpc domain', () => {
      ['EIP1', 'EIP2', 'EIP3'].forEach(eipName => {
        expect(template.Resources[eipName]).toBeDefined();
        expect(template.Resources[eipName].Properties.Domain).toBe('vpc');
      });
    });

    test('should have exactly 3 NAT Gateways', () => {
      const natGws = Object.keys(template.Resources).filter(key =>
        key.startsWith('NATGateway') && template.Resources[key].Type === 'AWS::EC2::NatGateway'
      );
      expect(natGws.length).toBe(3);
    });

    test('NAT Gateways should be in public subnets', () => {
      ['NATGateway1', 'NATGateway2', 'NATGateway3'].forEach((natName, idx) => {
        const nat = template.Resources[natName];
        expect(nat.Properties.SubnetId).toEqual({ Ref: `PublicSubnet${idx + 1}` });
      });
    });

    test('NAT Gateways should use corresponding Elastic IPs', () => {
      ['NATGateway1', 'NATGateway2', 'NATGateway3'].forEach((natName, idx) => {
        const nat = template.Resources[natName];
        expect(nat.Properties.AllocationId).toEqual({ 'Fn::GetAtt': [`EIP${idx + 1}`, 'AllocationId'] });
      });
    });

    test('NAT Gateways should include EnvironmentSuffix in tags', () => {
      ['NATGateway1', 'NATGateway2', 'NATGateway3'].forEach(natName => {
        const tags = template.Resources[natName].Properties.Tags;
        const nameTag = tags.find((t: any) => t.Key === 'Name');
        expect(nameTag.Value).toEqual(expect.objectContaining({ 'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}') }));
      });
    });
  });

  describe('Route Tables', () => {
    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have 3 private route tables', () => {
      const privateRouteTables = Object.keys(template.Resources).filter(key =>
        key.startsWith('PrivateRouteTable') && template.Resources[key].Type === 'AWS::EC2::RouteTable'
      );
      expect(privateRouteTables.length).toBe(3);
    });

    test('public route table should have internet gateway route', () => {
      expect(template.Resources.PublicRoute).toBeDefined();
      const route = template.Resources.PublicRoute.Properties;
      expect(route.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('private route tables should have NAT gateway routes', () => {
      for (let i = 1; i <= 3; i++) {
        const routeName = `PrivateRoute${i}`;
        expect(template.Resources[routeName]).toBeDefined();
        const route = template.Resources[routeName].Properties;
        expect(route.DestinationCidrBlock).toBe('0.0.0.0/0');
        expect(route.NatGatewayId).toEqual({ Ref: `NATGateway${i}` });
      }
    });

    test('public subnets should be associated with public route table', () => {
      for (let i = 1; i <= 3; i++) {
        const assocName = `PublicSubnet${i}RouteTableAssociation`;
        expect(template.Resources[assocName]).toBeDefined();
        expect(template.Resources[assocName].Properties.SubnetId).toEqual({ Ref: `PublicSubnet${i}` });
        expect(template.Resources[assocName].Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      }
    });

    test('private subnets should be associated with corresponding private route tables', () => {
      // Private subnets 1,2 -> PrivateRouteTable1; 3,4 -> PrivateRouteTable2; 5,6 -> PrivateRouteTable3
      const associations = [
        { subnet: 1, table: 1 }, { subnet: 2, table: 1 },
        { subnet: 3, table: 2 }, { subnet: 4, table: 2 },
        { subnet: 5, table: 3 }, { subnet: 6, table: 3 }
      ];

      associations.forEach(({ subnet, table }) => {
        const assocName = `PrivateSubnet${subnet}RouteTableAssociation`;
        expect(template.Resources[assocName]).toBeDefined();
        expect(template.Resources[assocName].Properties.SubnetId).toEqual({ Ref: `PrivateSubnet${subnet}` });
        expect(template.Resources[assocName].Properties.RouteTableId).toEqual({ Ref: `PrivateRouteTable${table}` });
      });
    });
  });

  describe('Security Groups', () => {
    test('should have BastionSecurityGroup', () => {
      expect(template.Resources.BastionSecurityGroup).toBeDefined();
      expect(template.Resources.BastionSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have ALBSecurityGroup', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have ApplicationSecurityGroup', () => {
      expect(template.Resources.ApplicationSecurityGroup).toBeDefined();
      expect(template.Resources.ApplicationSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('BastionSecurityGroup should allow SSH from specific IP', () => {
      const sg = template.Resources.BastionSecurityGroup.Properties;
      expect(sg.SecurityGroupIngress).toHaveLength(1);
      expect(sg.SecurityGroupIngress[0].IpProtocol).toBe('tcp');
      expect(sg.SecurityGroupIngress[0].FromPort).toBe(22);
      expect(sg.SecurityGroupIngress[0].ToPort).toBe(22);
      expect(sg.SecurityGroupIngress[0].CidrIp).toEqual({ Ref: 'BastionAllowedIP' });
    });

    test('ALBSecurityGroup should allow HTTP and HTTPS from internet', () => {
      const sg = template.Resources.ALBSecurityGroup.Properties;
      expect(sg.SecurityGroupIngress.length).toBeGreaterThanOrEqual(2);

      const httpRule = sg.SecurityGroupIngress.find((r: any) => r.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');

      const httpsRule = sg.SecurityGroupIngress.find((r: any) => r.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('ApplicationSecurityGroup should allow traffic from ALB and Bastion', () => {
      const sg = template.Resources.ApplicationSecurityGroup.Properties;
      expect(sg.SecurityGroupIngress.length).toBeGreaterThanOrEqual(3);

      // Should allow HTTP from ALB
      const httpFromAlb = sg.SecurityGroupIngress.find((r: any) =>
        r.FromPort === 80 && r.SourceSecurityGroupId
      );
      expect(httpFromAlb).toBeDefined();

      // Should allow HTTPS from ALB
      const httpsFromAlb = sg.SecurityGroupIngress.find((r: any) =>
        r.FromPort === 443 && r.SourceSecurityGroupId
      );
      expect(httpsFromAlb).toBeDefined();

      // Should allow SSH from Bastion
      const sshFromBastion = sg.SecurityGroupIngress.find((r: any) =>
        r.FromPort === 22 && r.SourceSecurityGroupId
      );
      expect(sshFromBastion).toBeDefined();
    });

    test('Security Groups should include EnvironmentSuffix in names', () => {
      ['BastionSecurityGroup', 'ALBSecurityGroup', 'ApplicationSecurityGroup'].forEach(sgName => {
        const tags = template.Resources[sgName].Properties.Tags;
        const nameTag = tags.find((t: any) => t.Key === 'Name');
        expect(nameTag.Value).toEqual(expect.objectContaining({ 'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}') }));
      });
    });

    test('Security Groups should not have 0.0.0.0/0 inbound except ALB', () => {
      const bastion = template.Resources.BastionSecurityGroup.Properties.SecurityGroupIngress;
      bastion.forEach((rule: any) => {
        expect(rule.CidrIp).not.toBe('0.0.0.0/0');
      });

      const app = template.Resources.ApplicationSecurityGroup.Properties.SecurityGroupIngress;
      app.forEach((rule: any) => {
        expect(rule.CidrIp).not.toBe('0.0.0.0/0');
      });
    });
  });

  describe('Network ACLs', () => {
    test('should have PublicNetworkAcl', () => {
      expect(template.Resources.PublicNetworkAcl).toBeDefined();
      expect(template.Resources.PublicNetworkAcl.Type).toBe('AWS::EC2::NetworkAcl');
    });

    test('should have PrivateNetworkAcl', () => {
      expect(template.Resources.PrivateNetworkAcl).toBeDefined();
      expect(template.Resources.PrivateNetworkAcl.Type).toBe('AWS::EC2::NetworkAcl');
    });

    test('PublicNetworkAcl should have inbound rules for HTTP, HTTPS, SSH', () => {
      const inboundRules = Object.keys(template.Resources).filter(key =>
        key.startsWith('PublicNetworkAclEntryInbound')
      );
      expect(inboundRules.length).toBeGreaterThanOrEqual(3);
    });

    test('PrivateNetworkAcl should have inbound rules', () => {
      const inboundRules = Object.keys(template.Resources).filter(key =>
        key.startsWith('PrivateNetworkAclEntryInbound')
      );
      expect(inboundRules.length).toBeGreaterThanOrEqual(3);
    });

    test('Network ACLs should have outbound rules', () => {
      expect(template.Resources.PublicNetworkAclEntryOutbound).toBeDefined();
      expect(template.Resources.PrivateNetworkAclEntryOutbound).toBeDefined();
    });

    test('Public subnets should be associated with PublicNetworkAcl', () => {
      for (let i = 1; i <= 3; i++) {
        const assocName = `PublicSubnet${i}NetworkAclAssociation`;
        expect(template.Resources[assocName]).toBeDefined();
        expect(template.Resources[assocName].Properties.SubnetId).toEqual({ Ref: `PublicSubnet${i}` });
        expect(template.Resources[assocName].Properties.NetworkAclId).toEqual({ Ref: 'PublicNetworkAcl' });
      }
    });

    test('Private subnets should be associated with PrivateNetworkAcl', () => {
      for (let i = 1; i <= 6; i++) {
        const assocName = `PrivateSubnet${i}NetworkAclAssociation`;
        expect(template.Resources[assocName]).toBeDefined();
        expect(template.Resources[assocName].Properties.SubnetId).toEqual({ Ref: `PrivateSubnet${i}` });
        expect(template.Resources[assocName].Properties.NetworkAclId).toEqual({ Ref: 'PrivateNetworkAcl' });
      }
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have FlowLogsLogGroup', () => {
      expect(template.Resources.FlowLogsLogGroup).toBeDefined();
      expect(template.Resources.FlowLogsLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('FlowLogsLogGroup should have 30-day retention', () => {
      const logGroup = template.Resources.FlowLogsLogGroup.Properties;
      expect(logGroup.RetentionInDays).toBe(30);
    });

    test('FlowLogsLogGroup should use KMS encryption', () => {
      const logGroup = template.Resources.FlowLogsLogGroup.Properties;
      expect(logGroup.KmsKeyId).toBeDefined();
    });

    test('should have FlowLogsKMSKey', () => {
      expect(template.Resources.FlowLogsKMSKey).toBeDefined();
      expect(template.Resources.FlowLogsKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('FlowLogsKMSKey should have proper key policy', () => {
      const key = template.Resources.FlowLogsKMSKey.Properties;
      expect(key.KeyPolicy).toBeDefined();
      expect(key.KeyPolicy.Statement).toBeDefined();
    });

    test('should have FlowLogsKMSKeyAlias', () => {
      expect(template.Resources.FlowLogsKMSKeyAlias).toBeDefined();
      expect(template.Resources.FlowLogsKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('should have FlowLogsRole for IAM', () => {
      expect(template.Resources.FlowLogsRole).toBeDefined();
      expect(template.Resources.FlowLogsRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have VPCFlowLog resource', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');
    });

    test('VPCFlowLog should log all traffic', () => {
      const flowLog = template.Resources.VPCFlowLog.Properties;
      expect(flowLog.TrafficType).toBe('ALL');
    });

    test('VPCFlowLog should use CloudWatch Logs', () => {
      const flowLog = template.Resources.VPCFlowLog.Properties;
      expect(flowLog.ResourceType).toBe('VPC');
      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
    });
  });

  describe('Resource Tagging', () => {
    test('all major resources should have Environment tag parameter', () => {
      const taggedResources = [
        'VPC', 'PublicSubnet1', 'PrivateSubnet1',
        'BastionSecurityGroup', 'ALBSecurityGroup', 'ApplicationSecurityGroup'
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        const envTag = resource.Properties.Tags.find((t: any) => t.Key === 'Environment');
        expect(envTag).toBeDefined();
        expect(envTag.Value).toEqual({ Ref: 'Environment' });
      });
    });

    test('all major resources should have Owner tag parameter', () => {
      const taggedResources = [
        'VPC', 'PublicSubnet1', 'PrivateSubnet1'
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const ownerTag = resource.Properties.Tags.find((t: any) => t.Key === 'Owner');
        expect(ownerTag).toBeDefined();
        expect(ownerTag.Value).toEqual({ Ref: 'Owner' });
      });
    });

    test('all major resources should have CostCenter tag parameter', () => {
      const taggedResources = [
        'VPC', 'PublicSubnet1', 'PrivateSubnet1'
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const costTag = resource.Properties.Tags.find((t: any) => t.Key === 'CostCenter');
        expect(costTag).toBeDefined();
        expect(costTag.Value).toEqual({ Ref: 'CostCenter' });
      });
    });
  });

  describe('Deletion Policies', () => {
    test('resources should not have Retain deletion policy', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('resources should not have deletion protection enabled', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties && resource.Properties.DeletionProtectionEnabled !== undefined) {
          expect(resource.Properties.DeletionProtectionEnabled).toBe(false);
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required VPC outputs', () => {
      const requiredOutputs = [
        'VPCId', 'VPCCidr',
        'PublicSubnet1Id', 'PublicSubnet2Id', 'PublicSubnet3Id',
        'PrivateSubnet1Id', 'PrivateSubnet2Id', 'PrivateSubnet3Id',
        'PrivateSubnet4Id', 'PrivateSubnet5Id', 'PrivateSubnet6Id'
      ];

      requiredOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have security group outputs', () => {
      const sgOutputs = [
        'BastionSecurityGroupId',
        'ALBSecurityGroupId',
        'ApplicationSecurityGroupId'
      ];

      sgOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have Flow Logs outputs', () => {
      expect(template.Outputs.FlowLogsLogGroupName).toBeDefined();
      expect(template.Outputs.FlowLogsKMSKeyArn).toBeDefined();
    });

    test('outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
        expect(template.Outputs[outputKey].Description.length).toBeGreaterThan(0);
      });
    });

    test('outputs should have export names with stack reference', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
        expect(output.Export.Name).toEqual(
          expect.objectContaining({ 'Fn::Sub': expect.stringContaining('${AWS::StackName}') })
        );
      });
    });
  });

  describe('High Availability Requirements', () => {
    test('should span exactly 3 availability zones', () => {
      const azs = new Set();
      for (let i = 1; i <= 3; i++) {
        const subnet = template.Resources[`PublicSubnet${i}`];
        azs.add(JSON.stringify(subnet.Properties.AvailabilityZone));
      }
      expect(azs.size).toBe(3);
    });

    test('each AZ should have one NAT Gateway', () => {
      for (let i = 1; i <= 3; i++) {
        const nat = template.Resources[`NATGateway${i}`];
        expect(nat).toBeDefined();
        expect(nat.Properties.SubnetId).toEqual({ Ref: `PublicSubnet${i}` });
      }
    });

    test('each AZ should have one public subnet', () => {
      for (let i = 1; i <= 3; i++) {
        expect(template.Resources[`PublicSubnet${i}`]).toBeDefined();
      }
    });

    test('each AZ should have two private subnets', () => {
      // AZ1: PrivateSubnet1,2; AZ2: PrivateSubnet3,4; AZ3: PrivateSubnet5,6
      const azMap: { [key: string]: number[] } = {};

      for (let i = 1; i <= 6; i++) {
        const subnet = template.Resources[`PrivateSubnet${i}`];
        const az = JSON.stringify(subnet.Properties.AvailabilityZone);
        if (!azMap[az]) azMap[az] = [];
        azMap[az].push(i);
      }

      expect(Object.keys(azMap).length).toBe(3);
      Object.values(azMap).forEach(subnets => {
        expect(subnets.length).toBe(2);
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have exactly 64 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(64);
    });

    test('should have 6 parameters', () => {
      const paramCount = Object.keys(template.Parameters).length;
      expect(paramCount).toBe(6);
    });

    test('should have 16 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(16);
    });
  });
});
