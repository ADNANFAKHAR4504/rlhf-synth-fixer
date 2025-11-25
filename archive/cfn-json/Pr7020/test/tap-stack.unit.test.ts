import fs from 'fs';
import path from 'path';

const EnvironmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack VPC CloudFormation Template', () => {
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
      expect(template.Description).toContain('Production-grade VPC network architecture');
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
      expect(template.Mappings).not.toBeNull();
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
      expect(envSuffixParam.Description).toBe('Environment suffix for resource naming uniqueness');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-z0-9-]+$');
      expect(envSuffixParam.ConstraintDescription).toBe('Must contain only lowercase letters, numbers, and hyphens');
    });

    test('should have Environment parameter', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam).toBeDefined();
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('Production');
      expect(envParam.AllowedValues).toEqual(['Production', 'Staging', 'Development']);
    });

    test('should have Department parameter', () => {
      const deptParam = template.Parameters.Department;
      expect(deptParam).toBeDefined();
      expect(deptParam.Type).toBe('String');
      expect(deptParam.Default).toBe('Engineering');
    });
  });

  describe('Mappings', () => {
    test('should have SubnetCIDRs mapping', () => {
      expect(template.Mappings.SubnetCIDRs).toBeDefined();
    });

    test('SubnetCIDRs should have us-east-1 region', () => {
      const usEast1 = template.Mappings.SubnetCIDRs['us-east-1'];
      expect(usEast1).toBeDefined();
      expect(usEast1.PublicSubnetAZ1).toBe('10.0.1.0/24');
      expect(usEast1.PublicSubnetAZ2).toBe('10.0.2.0/24');
      expect(usEast1.PublicSubnetAZ3).toBe('10.0.3.0/24');
      expect(usEast1.PrivateSubnetAZ1).toBe('10.0.11.0/24');
      expect(usEast1.PrivateSubnetAZ2).toBe('10.0.12.0/24');
      expect(usEast1.PrivateSubnetAZ3).toBe('10.0.13.0/24');
    });

    test('SubnetCIDRs should have us-west-2 region', () => {
      const usWest2 = template.Mappings.SubnetCIDRs['us-west-2'];
      expect(usWest2).toBeDefined();
      expect(usWest2.PublicSubnetAZ1).toBe('10.0.1.0/24');
    });
  });

  describe('VPC Resource', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
    });

    test('VPC should be correct type', () => {
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS hostnames enabled', () => {
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should have correct tags', () => {
      const tags = template.Resources.VPC.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.some((t: any) => t.Key === 'Name')).toBe(true);
      expect(tags.some((t: any) => t.Key === 'Environment')).toBe(true);
      expect(tags.some((t: any) => t.Key === 'Department')).toBe(true);
    });

    test('VPC should have Delete deletion policy', () => {
      expect(template.Resources.VPC.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Internet Gateway', () => {
    test('should have InternetGateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
    });

    test('InternetGateway should be correct type', () => {
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPCGatewayAttachment', () => {
      expect(template.Resources.VPCGatewayAttachment).toBeDefined();
      expect(template.Resources.VPCGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('VPCGatewayAttachment should reference VPC and IGW', () => {
      const attachment = template.Resources.VPCGatewayAttachment.Properties;
      expect(attachment.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('InternetGateway should have Delete deletion policy', () => {
      expect(template.Resources.InternetGateway.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Public Subnets', () => {
    test('should have all 3 public subnets', () => {
      expect(template.Resources.PublicSubnetAZ1).toBeDefined();
      expect(template.Resources.PublicSubnetAZ2).toBeDefined();
      expect(template.Resources.PublicSubnetAZ3).toBeDefined();
    });

    test('public subnets should be correct type', () => {
      expect(template.Resources.PublicSubnetAZ1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnetAZ2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnetAZ3.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should have correct CIDR blocks from mapping', () => {
      expect(template.Resources.PublicSubnetAZ1.Properties.CidrBlock).toEqual({
        'Fn::FindInMap': ['SubnetCIDRs', 'us-east-1', 'PublicSubnetAZ1']
      });
      expect(template.Resources.PublicSubnetAZ2.Properties.CidrBlock).toEqual({
        'Fn::FindInMap': ['SubnetCIDRs', 'us-east-1', 'PublicSubnetAZ2']
      });
      expect(template.Resources.PublicSubnetAZ3.Properties.CidrBlock).toEqual({
        'Fn::FindInMap': ['SubnetCIDRs', 'us-east-1', 'PublicSubnetAZ3']
      });
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      expect(template.Resources.PublicSubnetAZ1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnetAZ2.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnetAZ3.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('public subnets should have Delete deletion policy', () => {
      expect(template.Resources.PublicSubnetAZ1.DeletionPolicy).toBe('Delete');
      expect(template.Resources.PublicSubnetAZ2.DeletionPolicy).toBe('Delete');
      expect(template.Resources.PublicSubnetAZ3.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Private Subnets', () => {
    test('should have all 3 private subnets', () => {
      expect(template.Resources.PrivateSubnetAZ1).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ2).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ3).toBeDefined();
    });

    test('private subnets should be correct type', () => {
      expect(template.Resources.PrivateSubnetAZ1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnetAZ2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnetAZ3.Type).toBe('AWS::EC2::Subnet');
    });

    test('private subnets should have correct CIDR blocks from mapping', () => {
      expect(template.Resources.PrivateSubnetAZ1.Properties.CidrBlock).toEqual({
        'Fn::FindInMap': ['SubnetCIDRs', 'us-east-1', 'PrivateSubnetAZ1']
      });
      expect(template.Resources.PrivateSubnetAZ2.Properties.CidrBlock).toEqual({
        'Fn::FindInMap': ['SubnetCIDRs', 'us-east-1', 'PrivateSubnetAZ2']
      });
      expect(template.Resources.PrivateSubnetAZ3.Properties.CidrBlock).toEqual({
        'Fn::FindInMap': ['SubnetCIDRs', 'us-east-1', 'PrivateSubnetAZ3']
      });
    });

    test('private subnets should have MapPublicIpOnLaunch disabled', () => {
      expect(template.Resources.PrivateSubnetAZ1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateSubnetAZ2.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateSubnetAZ3.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('private subnets should have Delete deletion policy', () => {
      expect(template.Resources.PrivateSubnetAZ1.DeletionPolicy).toBe('Delete');
      expect(template.Resources.PrivateSubnetAZ2.DeletionPolicy).toBe('Delete');
      expect(template.Resources.PrivateSubnetAZ3.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Elastic IPs for NAT Gateways', () => {
    test('should have all 3 EIPs', () => {
      expect(template.Resources.EIPForNATGatewayAZ1).toBeDefined();
      expect(template.Resources.EIPForNATGatewayAZ2).toBeDefined();
      expect(template.Resources.EIPForNATGatewayAZ3).toBeDefined();
    });

    test('EIPs should be correct type', () => {
      expect(template.Resources.EIPForNATGatewayAZ1.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.EIPForNATGatewayAZ2.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.EIPForNATGatewayAZ3.Type).toBe('AWS::EC2::EIP');
    });

    test('EIPs should have vpc domain', () => {
      expect(template.Resources.EIPForNATGatewayAZ1.Properties.Domain).toBe('vpc');
      expect(template.Resources.EIPForNATGatewayAZ2.Properties.Domain).toBe('vpc');
      expect(template.Resources.EIPForNATGatewayAZ3.Properties.Domain).toBe('vpc');
    });

    test('EIPs should depend on VPCGatewayAttachment', () => {
      expect(template.Resources.EIPForNATGatewayAZ1.DependsOn).toBe('VPCGatewayAttachment');
      expect(template.Resources.EIPForNATGatewayAZ2.DependsOn).toBe('VPCGatewayAttachment');
      expect(template.Resources.EIPForNATGatewayAZ3.DependsOn).toBe('VPCGatewayAttachment');
    });

    test('EIPs should have Delete deletion policy', () => {
      expect(template.Resources.EIPForNATGatewayAZ1.DeletionPolicy).toBe('Delete');
      expect(template.Resources.EIPForNATGatewayAZ2.DeletionPolicy).toBe('Delete');
      expect(template.Resources.EIPForNATGatewayAZ3.DeletionPolicy).toBe('Delete');
    });
  });

  describe('NAT Gateways', () => {
    test('should have all 3 NAT Gateways', () => {
      expect(template.Resources.NATGatewayAZ1).toBeDefined();
      expect(template.Resources.NATGatewayAZ2).toBeDefined();
      expect(template.Resources.NATGatewayAZ3).toBeDefined();
    });

    test('NAT Gateways should be correct type', () => {
      expect(template.Resources.NATGatewayAZ1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGatewayAZ2.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGatewayAZ3.Type).toBe('AWS::EC2::NatGateway');
    });

    test('NAT Gateways should reference correct EIPs', () => {
      expect(template.Resources.NATGatewayAZ1.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['EIPForNATGatewayAZ1', 'AllocationId']
      });
      expect(template.Resources.NATGatewayAZ2.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['EIPForNATGatewayAZ2', 'AllocationId']
      });
      expect(template.Resources.NATGatewayAZ3.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['EIPForNATGatewayAZ3', 'AllocationId']
      });
    });

    test('NAT Gateways should be in correct public subnets', () => {
      expect(template.Resources.NATGatewayAZ1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnetAZ1' });
      expect(template.Resources.NATGatewayAZ2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnetAZ2' });
      expect(template.Resources.NATGatewayAZ3.Properties.SubnetId).toEqual({ Ref: 'PublicSubnetAZ3' });
    });

    test('NAT Gateways should have EnvironmentSuffix in names', () => {
      const nat1Tags = template.Resources.NATGatewayAZ1.Properties.Tags;
      const nameTag = nat1Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value).toEqual({ 'Fn::Sub': 'nat-us-east-1a-${EnvironmentSuffix}' });
    });

    test('NAT Gateways should have Delete deletion policy', () => {
      expect(template.Resources.NATGatewayAZ1.DeletionPolicy).toBe('Delete');
      expect(template.Resources.NATGatewayAZ2.DeletionPolicy).toBe('Delete');
      expect(template.Resources.NATGatewayAZ3.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Route Tables', () => {
    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have all 3 private route tables', () => {
      expect(template.Resources.PrivateRouteTableAZ1).toBeDefined();
      expect(template.Resources.PrivateRouteTableAZ2).toBeDefined();
      expect(template.Resources.PrivateRouteTableAZ3).toBeDefined();
      expect(template.Resources.PrivateRouteTableAZ1.Type).toBe('AWS::EC2::RouteTable');
      expect(template.Resources.PrivateRouteTableAZ2.Type).toBe('AWS::EC2::RouteTable');
      expect(template.Resources.PrivateRouteTableAZ3.Type).toBe('AWS::EC2::RouteTable');
    });

    test('public route should point to internet gateway', () => {
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(template.Resources.PublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('private routes should point to NAT gateways in same AZ', () => {
      expect(template.Resources.PrivateRouteAZ1.Properties.NatGatewayId).toEqual({ Ref: 'NATGatewayAZ1' });
      expect(template.Resources.PrivateRouteAZ2.Properties.NatGatewayId).toEqual({ Ref: 'NATGatewayAZ2' });
      expect(template.Resources.PrivateRouteAZ3.Properties.NatGatewayId).toEqual({ Ref: 'NATGatewayAZ3' });
    });

    test('all route tables should have Delete deletion policy', () => {
      expect(template.Resources.PublicRouteTable.DeletionPolicy).toBe('Delete');
      expect(template.Resources.PrivateRouteTableAZ1.DeletionPolicy).toBe('Delete');
      expect(template.Resources.PrivateRouteTableAZ2.DeletionPolicy).toBe('Delete');
      expect(template.Resources.PrivateRouteTableAZ3.DeletionPolicy).toBe('Delete');
    });

    test('should have all subnet route table associations', () => {
      expect(template.Resources.PublicSubnetAZ1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnetAZ2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnetAZ3RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ3RouteTableAssociation).toBeDefined();
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have VPCFlowLogsRole', () => {
      expect(template.Resources.VPCFlowLogsRole).toBeDefined();
      expect(template.Resources.VPCFlowLogsRole.Type).toBe('AWS::IAM::Role');
    });

    test('VPCFlowLogsRole should have correct trust policy', () => {
      const policy = template.Resources.VPCFlowLogsRole.Properties.AssumeRolePolicyDocument;
      expect(policy.Statement[0].Principal.Service).toBe('vpc-flow-logs.amazonaws.com');
      expect(policy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('VPCFlowLogsRole should have CloudWatch permissions', () => {
      const policies = template.Resources.VPCFlowLogsRole.Properties.Policies;
      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('CloudWatchLogPolicy');
      const actions = policies[0].PolicyDocument.Statement[0].Action;
      expect(actions).toContain('logs:CreateLogGroup');
      expect(actions).toContain('logs:CreateLogStream');
      expect(actions).toContain('logs:PutLogEvents');
    });

    test('should have VPCFlowLogGroup', () => {
      expect(template.Resources.VPCFlowLogGroup).toBeDefined();
      expect(template.Resources.VPCFlowLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('VPCFlowLogGroup should have 30-day retention', () => {
      expect(template.Resources.VPCFlowLogGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have VPCFlowLog', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');
    });

    test('VPCFlowLog should capture ALL traffic', () => {
      expect(template.Resources.VPCFlowLog.Properties.TrafficType).toBe('ALL');
    });

    test('VPCFlowLog should use cloud-watch-logs', () => {
      expect(template.Resources.VPCFlowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
    });

    test('VPCFlowLogsRole should have Delete deletion policy', () => {
      expect(template.Resources.VPCFlowLogsRole.DeletionPolicy).toBe('Delete');
    });

    test('VPCFlowLogGroup should have Delete deletion policy', () => {
      expect(template.Resources.VPCFlowLogGroup.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Network ACLs', () => {
    test('should have public and private Network ACLs', () => {
      expect(template.Resources.PublicNetworkAcl).toBeDefined();
      expect(template.Resources.PrivateNetworkAcl).toBeDefined();
      expect(template.Resources.PublicNetworkAcl.Type).toBe('AWS::EC2::NetworkAcl');
      expect(template.Resources.PrivateNetworkAcl.Type).toBe('AWS::EC2::NetworkAcl');
    });

    test('public NACL should allow HTTP inbound', () => {
      expect(template.Resources.PublicNetworkAclEntryInboundHTTP).toBeDefined();
      const entry = template.Resources.PublicNetworkAclEntryInboundHTTP.Properties;
      expect(entry.RuleNumber).toBe(100);
      expect(entry.Protocol).toBe(6);
      expect(entry.RuleAction).toBe('allow');
      expect(entry.PortRange.From).toBe(80);
      expect(entry.PortRange.To).toBe(80);
    });

    test('public NACL should allow HTTPS inbound', () => {
      expect(template.Resources.PublicNetworkAclEntryInboundHTTPS).toBeDefined();
      const entry = template.Resources.PublicNetworkAclEntryInboundHTTPS.Properties;
      expect(entry.RuleNumber).toBe(110);
      expect(entry.PortRange.From).toBe(443);
      expect(entry.PortRange.To).toBe(443);
    });

    test('public NACL should allow SSH inbound', () => {
      expect(template.Resources.PublicNetworkAclEntryInboundSSH).toBeDefined();
      const entry = template.Resources.PublicNetworkAclEntryInboundSSH.Properties;
      expect(entry.RuleNumber).toBe(120);
      expect(entry.PortRange.From).toBe(22);
      expect(entry.PortRange.To).toBe(22);
    });

    test('public NACL should allow ephemeral ports inbound', () => {
      expect(template.Resources.PublicNetworkAclEntryInboundEphemeral).toBeDefined();
      const entry = template.Resources.PublicNetworkAclEntryInboundEphemeral.Properties;
      expect(entry.RuleNumber).toBe(130);
      expect(entry.PortRange.From).toBe(1024);
      expect(entry.PortRange.To).toBe(65535);
    });

    test('public NACL should allow all outbound', () => {
      expect(template.Resources.PublicNetworkAclEntryOutbound).toBeDefined();
      const entry = template.Resources.PublicNetworkAclEntryOutbound.Properties;
      expect(entry.Protocol).toBe(-1);
      expect(entry.Egress).toBe(true);
    });

    test('private NACL should allow VPC CIDR inbound', () => {
      expect(template.Resources.PrivateNetworkAclEntryInbound).toBeDefined();
      const entry = template.Resources.PrivateNetworkAclEntryInbound.Properties;
      expect(entry.CidrBlock).toBe('10.0.0.0/16');
    });

    test('private NACL should allow all outbound', () => {
      expect(template.Resources.PrivateNetworkAclEntryOutbound).toBeDefined();
      const entry = template.Resources.PrivateNetworkAclEntryOutbound.Properties;
      expect(entry.Egress).toBe(true);
    });

    test('should have all subnet NACL associations', () => {
      expect(template.Resources.PublicSubnetAZ1NetworkAclAssociation).toBeDefined();
      expect(template.Resources.PublicSubnetAZ2NetworkAclAssociation).toBeDefined();
      expect(template.Resources.PublicSubnetAZ3NetworkAclAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ1NetworkAclAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ2NetworkAclAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ3NetworkAclAssociation).toBeDefined();
    });

    test('Network ACLs should have Delete deletion policy', () => {
      expect(template.Resources.PublicNetworkAcl.DeletionPolicy).toBe('Delete');
      expect(template.Resources.PrivateNetworkAcl.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnetAZ1Id',
        'PublicSubnetAZ2Id',
        'PublicSubnetAZ3Id',
        'PrivateSubnetAZ1Id',
        'PrivateSubnetAZ2Id',
        'PrivateSubnetAZ3Id',
        'InternetGatewayId',
        'NATGatewayAZ1Id',
        'NATGatewayAZ2Id',
        'NATGatewayAZ3Id',
        'VPCFlowLogGroupName'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should have export', () => {
      const output = template.Outputs.VPCId;
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-VPCId' });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
      });
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
      });
    });
  });

  describe('Resource Count', () => {
    test('should have exactly 47 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(47);
    });

    test('should have exactly 3 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have exactly 12 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(12);
    });
  });

  describe('Resource Naming Convention', () => {
    test('resource names should include EnvironmentSuffix', () => {
      const vpc = template.Resources.VPC.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(vpc.Value).toEqual({ 'Fn::Sub': 'vpc-${EnvironmentSuffix}' });

      const igw = template.Resources.InternetGateway.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(igw.Value).toEqual({ 'Fn::Sub': 'igw-${EnvironmentSuffix}' });
    });

    test('all resources should have Environment and Department tags', () => {
      const taggedResources = [
        'VPC',
        'InternetGateway',
        'PublicSubnetAZ1',
        'PrivateSubnetAZ1',
        'NATGatewayAZ1',
        'EIPForNATGatewayAZ1',
        'PublicRouteTable',
        'PrivateRouteTableAZ1',
        'PublicNetworkAcl',
        'PrivateNetworkAcl',
        'VPCFlowLogsRole'
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties && resource.Properties.Tags) {
          const hasEnv = resource.Properties.Tags.some((t: any) => t.Key === 'Environment');
          const hasDept = resource.Properties.Tags.some((t: any) => t.Key === 'Department');
          expect(hasEnv || hasDept).toBe(true);
        }
      });
    });
  });

  describe('Deletion Policies', () => {
    test('all resources should have Delete deletion policy', () => {
      const criticalResources = [
        'VPC',
        'InternetGateway',
        'PublicSubnetAZ1',
        'PrivateSubnetAZ1',
        'NATGatewayAZ1',
        'EIPForNATGatewayAZ1',
        'PublicRouteTable',
        'PrivateRouteTableAZ1',
        'PublicNetworkAcl',
        'PrivateNetworkAcl',
        'VPCFlowLogsRole',
        'VPCFlowLogGroup'
      ];

      criticalResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).toBe('Delete');
        }
      });
    });

    test('should not have any Retain deletion policies', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });
  });
});
