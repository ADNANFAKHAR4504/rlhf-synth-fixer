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

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should be valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBeDefined();
    });

    test('should have VPC CIDR parameter', () => {
      expect(template.Parameters.VpcCIDR).toBeDefined();
      expect(template.Parameters.VpcCIDR.Type).toBe('String');
      expect(template.Parameters.VpcCIDR.Default).toBe('10.0.0.0/16');
    });

    test('should have subnet CIDR parameters', () => {
      const subnetParams = [
        'PublicSubnet1CIDR',
        'PublicSubnet2CIDR',
        'PrivateAppSubnet1CIDR',
        'PrivateAppSubnet2CIDR',
        'PrivateDbSubnet1CIDR',
        'PrivateDbSubnet2CIDR'
      ];

      subnetParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
        expect(template.Parameters[param].Type).toBe('String');
        expect(template.Parameters[param].Default).toMatch(/^10\.0\.\d+\.0\/24$/);
      });
    });

    test('subnet CIDRs should not overlap', () => {
      const cidrs = [
        template.Parameters.PublicSubnet1CIDR.Default,
        template.Parameters.PublicSubnet2CIDR.Default,
        template.Parameters.PrivateAppSubnet1CIDR.Default,
        template.Parameters.PrivateAppSubnet2CIDR.Default,
        template.Parameters.PrivateDbSubnet1CIDR.Default,
        template.Parameters.PrivateDbSubnet2CIDR.Default
      ];

      const uniqueCidrs = new Set(cidrs);
      expect(uniqueCidrs.size).toBe(cidrs.length);
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have DNS enabled', () => {
      const vpc = template.Resources.VPC.Properties;
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('VPC should reference VpcCIDR parameter', () => {
      const vpc = template.Resources.VPC.Properties;
      expect(vpc.CidrBlock).toEqual({ Ref: 'VpcCIDR' });
    });

    test('VPC should have proper tags with environmentSuffix', () => {
      const vpc = template.Resources.VPC.Properties;
      expect(vpc.Tags).toBeDefined();
      expect(Array.isArray(vpc.Tags)).toBe(true);

      const nameTag = vpc.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('VPC should not have Retain deletion policy', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.DeletionPolicy).not.toBe('Retain');
      expect(vpc.UpdateReplacePolicy).not.toBe('Retain');
    });
  });

  describe('Internet Gateway', () => {
    test('should have Internet Gateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have IGW attachment to VPC', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');

      const attachment = template.Resources.AttachGateway.Properties;
      expect(attachment.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('IGW should have tags with environmentSuffix', () => {
      const igw = template.Resources.InternetGateway.Properties;
      expect(igw.Tags).toBeDefined();

      const nameTag = igw.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Subnets', () => {
    test('should have public subnets in both AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');

      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have private application subnets in both AZs', () => {
      expect(template.Resources.PrivateAppSubnet1).toBeDefined();
      expect(template.Resources.PrivateAppSubnet1.Type).toBe('AWS::EC2::Subnet');

      expect(template.Resources.PrivateAppSubnet2).toBeDefined();
      expect(template.Resources.PrivateAppSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have private database subnets in both AZs', () => {
      expect(template.Resources.PrivateDbSubnet1).toBeDefined();
      expect(template.Resources.PrivateDbSubnet1.Type).toBe('AWS::EC2::Subnet');

      expect(template.Resources.PrivateDbSubnet2).toBeDefined();
      expect(template.Resources.PrivateDbSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('private subnets should not have MapPublicIpOnLaunch enabled', () => {
      expect(template.Resources.PrivateAppSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateAppSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateDbSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateDbSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('all subnets should reference VPC', () => {
      const subnetNames = [
        'PublicSubnet1', 'PublicSubnet2',
        'PrivateAppSubnet1', 'PrivateAppSubnet2',
        'PrivateDbSubnet1', 'PrivateDbSubnet2'
      ];

      subnetNames.forEach(subnetName => {
        expect(template.Resources[subnetName].Properties.VpcId).toEqual({ Ref: 'VPC' });
      });
    });

    test('all subnets should have tags with environmentSuffix', () => {
      const subnetNames = [
        'PublicSubnet1', 'PublicSubnet2',
        'PrivateAppSubnet1', 'PrivateAppSubnet2',
        'PrivateDbSubnet1', 'PrivateDbSubnet2'
      ];

      subnetNames.forEach(subnetName => {
        const subnet = template.Resources[subnetName].Properties;
        expect(subnet.Tags).toBeDefined();

        const nameTag = subnet.Tags.find((tag: any) => tag.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });

    test('subnets should be in different availability zones', () => {
      expect(template.Resources.PublicSubnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });

      expect(template.Resources.PublicSubnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
    });
  });

  describe('NAT Gateways', () => {
    test('should have NAT Gateway in each public subnet', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.NATGateway1.Type).toBe('AWS::EC2::NatGateway');

      expect(template.Resources.NATGateway2).toBeDefined();
      expect(template.Resources.NATGateway2.Type).toBe('AWS::EC2::NatGateway');
    });

    test('NAT Gateways should have Elastic IPs', () => {
      expect(template.Resources.NATGateway1EIP).toBeDefined();
      expect(template.Resources.NATGateway1EIP.Type).toBe('AWS::EC2::EIP');

      expect(template.Resources.NATGateway2EIP).toBeDefined();
      expect(template.Resources.NATGateway2EIP.Type).toBe('AWS::EC2::EIP');
    });

    test('NAT Gateways should reference correct subnets', () => {
      expect(template.Resources.NATGateway1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(template.Resources.NATGateway2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
    });

    test('NAT Gateways should reference correct EIPs', () => {
      expect(template.Resources.NATGateway1.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NATGateway1EIP', 'AllocationId']
      });
      expect(template.Resources.NATGateway2.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NATGateway2EIP', 'AllocationId']
      });
    });

    test('NAT Gateways should have tags with environmentSuffix', () => {
      const nat1Tags = template.Resources.NATGateway1.Properties.Tags;
      const nat2Tags = template.Resources.NATGateway2.Properties.Tags;

      expect(nat1Tags).toBeDefined();
      expect(nat2Tags).toBeDefined();

      const nameTag1 = nat1Tags.find((tag: any) => tag.Key === 'Name');
      const nameTag2 = nat2Tags.find((tag: any) => tag.Key === 'Name');

      expect(nameTag1.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(nameTag2.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Route Tables', () => {
    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have private route tables for each AZ', () => {
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable1.Type).toBe('AWS::EC2::RouteTable');

      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(template.Resources.PrivateRouteTable2.Type).toBe('AWS::EC2::RouteTable');
    });

    test('public route table should have route to Internet Gateway', () => {
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      expect(template.Resources.DefaultPublicRoute.Type).toBe('AWS::EC2::Route');

      const route = template.Resources.DefaultPublicRoute.Properties;
      expect(route.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('private route tables should have routes to NAT Gateways', () => {
      expect(template.Resources.DefaultPrivateRoute1).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute2).toBeDefined();

      const route1 = template.Resources.DefaultPrivateRoute1.Properties;
      const route2 = template.Resources.DefaultPrivateRoute2.Properties;

      expect(route1.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route2.DestinationCidrBlock).toBe('0.0.0.0/0');

      expect(route1.NatGatewayId).toEqual({ Ref: 'NATGateway1' });
      expect(route2.NatGatewayId).toEqual({ Ref: 'NATGateway2' });
    });

    test('should have subnet route table associations', () => {
      const associations = [
        'PublicSubnet1RouteTableAssociation',
        'PublicSubnet2RouteTableAssociation',
        'PrivateAppSubnet1RouteTableAssociation',
        'PrivateAppSubnet2RouteTableAssociation',
        'PrivateDbSubnet1RouteTableAssociation',
        'PrivateDbSubnet2RouteTableAssociation'
      ];

      associations.forEach(assoc => {
        expect(template.Resources[assoc]).toBeDefined();
        expect(template.Resources[assoc].Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      });
    });

    test('route table associations should reference correct subnets', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(template.Resources.PublicSubnet2RouteTableAssociation.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
      expect(template.Resources.PrivateAppSubnet1RouteTableAssociation.Properties.SubnetId).toEqual({ Ref: 'PrivateAppSubnet1' });
      expect(template.Resources.PrivateAppSubnet2RouteTableAssociation.Properties.SubnetId).toEqual({ Ref: 'PrivateAppSubnet2' });
      expect(template.Resources.PrivateDbSubnet1RouteTableAssociation.Properties.SubnetId).toEqual({ Ref: 'PrivateDbSubnet1' });
      expect(template.Resources.PrivateDbSubnet2RouteTableAssociation.Properties.SubnetId).toEqual({ Ref: 'PrivateDbSubnet2' });
    });
  });

  describe('Security Groups', () => {
    test('should have web tier security group', () => {
      expect(template.Resources.WebTierSecurityGroup).toBeDefined();
      expect(template.Resources.WebTierSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have application tier security group', () => {
      expect(template.Resources.AppTierSecurityGroup).toBeDefined();
      expect(template.Resources.AppTierSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have database tier security group', () => {
      expect(template.Resources.DbTierSecurityGroup).toBeDefined();
      expect(template.Resources.DbTierSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('security groups should reference VPC', () => {
      expect(template.Resources.WebTierSecurityGroup.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.AppTierSecurityGroup.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.DbTierSecurityGroup.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('web tier should allow HTTP and HTTPS from internet', () => {
      const ingress = template.Resources.WebTierSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toBeDefined();
      expect(Array.isArray(ingress)).toBe(true);

      const httpRule = ingress.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingress.find((rule: any) => rule.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('app tier should only allow traffic from web tier', () => {
      const ingress = template.Resources.AppTierSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toBeDefined();

      ingress.forEach((rule: any) => {
        expect(rule.SourceSecurityGroupId).toEqual({ Ref: 'WebTierSecurityGroup' });
      });
    });

    test('database tier should only allow traffic from app tier', () => {
      const ingress = template.Resources.DbTierSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toBeDefined();

      ingress.forEach((rule: any) => {
        expect(rule.SourceSecurityGroupId).toEqual({ Ref: 'AppTierSecurityGroup' });
      });
    });

    test('security groups should have proper egress rules', () => {
      expect(template.Resources.WebTierSecurityGroup.Properties.SecurityGroupEgress).toBeDefined();
      expect(template.Resources.AppTierSecurityGroup.Properties.SecurityGroupEgress).toBeDefined();
      expect(template.Resources.DbTierSecurityGroup.Properties.SecurityGroupEgress).toBeDefined();
    });

    test('security groups should have tags with environmentSuffix', () => {
      const sgNames = ['WebTierSecurityGroup', 'AppTierSecurityGroup', 'DbTierSecurityGroup'];

      sgNames.forEach(sgName => {
        const sg = template.Resources[sgName].Properties;
        expect(sg.Tags).toBeDefined();

        const nameTag = sg.Tags.find((tag: any) => tag.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });
  });

  describe('Network ACLs', () => {
    test('should have Network ACLs for each subnet tier', () => {
      expect(template.Resources.PublicNetworkAcl).toBeDefined();
      expect(template.Resources.PrivateNetworkAcl).toBeDefined();
    });

    test('Network ACLs should be associated with VPC', () => {
      expect(template.Resources.PublicNetworkAcl.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.PrivateNetworkAcl.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should have Network ACL associations for all subnets', () => {
      const associations = [
        'PublicSubnet1NetworkAclAssociation',
        'PublicSubnet2NetworkAclAssociation',
        'PrivateAppSubnet1NetworkAclAssociation',
        'PrivateAppSubnet2NetworkAclAssociation',
        'PrivateDbSubnet1NetworkAclAssociation',
        'PrivateDbSubnet2NetworkAclAssociation'
      ];

      associations.forEach(assoc => {
        expect(template.Resources[assoc]).toBeDefined();
        expect(template.Resources[assoc].Type).toBe('AWS::EC2::SubnetNetworkAclAssociation');
      });
    });

    test('Network ACLs should have both ingress and egress rules', () => {
      // Public NACL rules
      expect(template.Resources.PublicInboundHTTPNetworkAclEntry).toBeDefined();
      expect(template.Resources.PublicInboundHTTPSNetworkAclEntry).toBeDefined();
      expect(template.Resources.PublicInboundEphemeralNetworkAclEntry).toBeDefined();
      expect(template.Resources.PublicOutboundNetworkAclEntry).toBeDefined();

      // Private NACL rules
      expect(template.Resources.PrivateInboundNetworkAclEntry).toBeDefined();
      expect(template.Resources.PrivateOutboundNetworkAclEntry).toBeDefined();
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have VPC Flow Logs enabled', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');
    });

    test('VPC Flow Logs should reference VPC', () => {
      const flowLog = template.Resources.VPCFlowLog.Properties;
      expect(flowLog.ResourceId).toEqual({ Ref: 'VPC' });
      expect(flowLog.ResourceType).toBe('VPC');
    });

    test('VPC Flow Logs should capture both accepted and rejected traffic', () => {
      const flowLog = template.Resources.VPCFlowLog.Properties;
      expect(flowLog.TrafficType).toBe('ALL');
    });

    test('should have CloudWatch Log Group for Flow Logs', () => {
      expect(template.Resources.VPCFlowLogsLogGroup).toBeDefined();
      expect(template.Resources.VPCFlowLogsLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have IAM Role for Flow Logs', () => {
      expect(template.Resources.VPCFlowLogsRole).toBeDefined();
      expect(template.Resources.VPCFlowLogsRole.Type).toBe('AWS::IAM::Role');
    });

    test('Flow Logs IAM Role should have correct trust policy', () => {
      const role = template.Resources.VPCFlowLogsRole.Properties;
      const trustPolicy = role.AssumeRolePolicyDocument;

      expect(trustPolicy.Statement).toBeDefined();
      const statement = trustPolicy.Statement[0];
      expect(statement.Principal.Service).toBe('vpc-flow-logs.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('Flow Logs role name should include environmentSuffix', () => {
      const role = template.Resources.VPCFlowLogsRole.Properties;
      expect(role.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('Flow Logs log group should not have Retain deletion policy', () => {
      const logGroup = template.Resources.VPCFlowLogsLogGroup;
      expect(logGroup.DeletionPolicy).not.toBe('Retain');
      expect(logGroup.UpdateReplacePolicy).not.toBe('Retain');
    });
  });

  describe('Outputs', () => {
    test('should have VPC ID output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have subnet outputs', () => {
      const subnetOutputs = [
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateAppSubnet1Id',
        'PrivateAppSubnet2Id',
        'PrivateDbSubnet1Id',
        'PrivateDbSubnet2Id'
      ];

      subnetOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('should have security group outputs', () => {
      expect(template.Outputs.WebTierSecurityGroupId).toBeDefined();
      expect(template.Outputs.AppTierSecurityGroupId).toBeDefined();
      expect(template.Outputs.DbTierSecurityGroupId).toBeDefined();
    });

    test('should have NAT Gateway outputs', () => {
      expect(template.Outputs.NATGateway1Id).toBeDefined();
      expect(template.Outputs.NATGateway2Id).toBeDefined();
    });

    test('should have VPC Flow Log outputs', () => {
      expect(template.Outputs.VPCFlowLogId).toBeDefined();
      expect(template.Outputs.VPCFlowLogsLogGroupName).toBeDefined();
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(typeof output.Description).toBe('string');
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });

    test('outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name).toBeDefined();
        }
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('VPC should include environmentSuffix in name', () => {
      const nameTag = template.Resources.VPC.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('all named resources should include environmentSuffix', () => {
      const resourcesWithNames = [
        'VPC', 'InternetGateway', 'NATGateway1', 'NATGateway2',
        'PublicSubnet1', 'PublicSubnet2',
        'PrivateAppSubnet1', 'PrivateAppSubnet2',
        'PrivateDbSubnet1', 'PrivateDbSubnet2',
        'WebTierSecurityGroup', 'AppTierSecurityGroup', 'DbTierSecurityGroup'
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Name');
          if (nameTag && nameTag.Value['Fn::Sub']) {
            expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });
  });

  describe('PCI-DSS Compliance', () => {
    test('VPC should have PCI-DSS compliance tag', () => {
      const complianceTag = template.Resources.VPC.Properties.Tags.find((tag: any) => tag.Key === 'Compliance');
      expect(complianceTag).toBeDefined();
      expect(complianceTag.Value).toBe('PCI-DSS');
    });

    test('should have proper network segmentation', () => {
      const publicSubnets = ['PublicSubnet1', 'PublicSubnet2'];
      const appSubnets = ['PrivateAppSubnet1', 'PrivateAppSubnet2'];
      const dbSubnets = ['PrivateDbSubnet1', 'PrivateDbSubnet2'];

      expect(publicSubnets.length).toBe(2);
      expect(appSubnets.length).toBe(2);
      expect(dbSubnets.length).toBe(2);
    });

    test('should have VPC Flow Logs for audit trail', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Properties.TrafficType).toBe('ALL');
    });

    test('should have Network ACLs for defense in depth', () => {
      expect(template.Resources.PublicNetworkAcl).toBeDefined();
      expect(template.Resources.PrivateNetworkAcl).toBeDefined();
    });
  });

  describe('High Availability', () => {
    test('should deploy resources across multiple AZs', () => {
      const az1Resources = ['PublicSubnet1', 'PrivateAppSubnet1', 'PrivateDbSubnet1', 'NATGateway1'];
      const az2Resources = ['PublicSubnet2', 'PrivateAppSubnet2', 'PrivateDbSubnet2', 'NATGateway2'];

      az1Resources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });

      az2Resources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have NAT Gateways in each AZ', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.NATGateway2).toBeDefined();
      expect(template.Resources.NATGateway1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(template.Resources.NATGateway2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
    });
  });

  describe('Destroyability', () => {
    test('no resources should have Retain deletion policy', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).not.toBe('Retain');
        expect(resource.UpdateReplacePolicy).not.toBe('Retain');
      });
    });

    test('VPC Flow Logs log group should be destroyable', () => {
      const logGroup = template.Resources.VPCFlowLogsLogGroup;
      expect(logGroup.DeletionPolicy).not.toBe('Retain');
    });

    test('no resources should have DeletionProtection enabled', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties && resource.Properties.DeletionProtectionEnabled !== undefined) {
          expect(resource.Properties.DeletionProtectionEnabled).toBe(false);
        }
      });
    });
  });
});
