import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('VPC Network Architecture CloudFormation Template', () => {
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

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
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
      expect(envSuffixParam.Description).toBe('Environment suffix for resource naming');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('production');
      expect(envParam.Description).toBe('Environment name for tagging');
    });

    test('should have Department parameter', () => {
      expect(template.Parameters.Department).toBeDefined();
    });

    test('Department parameter should have correct properties', () => {
      const deptParam = template.Parameters.Department;
      expect(deptParam.Type).toBe('String');
      expect(deptParam.Default).toBe('finance');
      expect(deptParam.Description).toBe('Department name for cost allocation');
    });

    test('should have exactly three parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });
  });

  describe('Mappings', () => {
    test('should have SubnetConfig mapping', () => {
      expect(template.Mappings.SubnetConfig).toBeDefined();
    });

    test('should have us-east-1 region configuration', () => {
      expect(template.Mappings.SubnetConfig['us-east-1']).toBeDefined();
    });

    test('should have us-west-2 region configuration', () => {
      expect(template.Mappings.SubnetConfig['us-west-2']).toBeDefined();
    });

    test('us-east-1 should have all subnet CIDR blocks', () => {
      const usEast1Config = template.Mappings.SubnetConfig['us-east-1'];
      expect(usEast1Config.PublicSubnet1).toBe('10.0.0.0/24');
      expect(usEast1Config.PublicSubnet2).toBe('10.0.1.0/24');
      expect(usEast1Config.PublicSubnet3).toBe('10.0.2.0/24');
      expect(usEast1Config.PrivateSubnet1).toBe('10.0.10.0/24');
      expect(usEast1Config.PrivateSubnet2).toBe('10.0.11.0/24');
      expect(usEast1Config.PrivateSubnet3).toBe('10.0.12.0/24');
    });

    test('us-west-2 should have all subnet CIDR blocks', () => {
      const usWest2Config = template.Mappings.SubnetConfig['us-west-2'];
      expect(usWest2Config.PublicSubnet1).toBe('10.0.0.0/24');
      expect(usWest2Config.PublicSubnet2).toBe('10.0.1.0/24');
      expect(usWest2Config.PublicSubnet3).toBe('10.0.2.0/24');
      expect(usWest2Config.PrivateSubnet1).toBe('10.0.10.0/24');
      expect(usWest2Config.PrivateSubnet2).toBe('10.0.11.0/24');
      expect(usWest2Config.PrivateSubnet3).toBe('10.0.12.0/24');
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
    });

    test('VPC should have DNS support enabled', () => {
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should have proper tags', () => {
      const tags = template.Resources.VPC.Properties.Tags;
      expect(tags).toHaveLength(3);

      const nameTag = tags.find((t: any) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toEqual({ 'Fn::Sub': 'vpc-${EnvironmentSuffix}' });

      const envTag = tags.find((t: any) => t.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toEqual({ Ref: 'Environment' });

      const deptTag = tags.find((t: any) => t.Key === 'Department');
      expect(deptTag).toBeDefined();
      expect(deptTag.Value).toEqual({ Ref: 'Department' });
    });
  });

  describe('Internet Gateway Resources', () => {
    test('should have InternetGateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
    });

    test('InternetGateway should be correct type', () => {
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('InternetGateway should have tags', () => {
      const tags = template.Resources.InternetGateway.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.length).toBeGreaterThan(0);
    });

    test('should have AttachGateway resource', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
    });

    test('AttachGateway should be correct type', () => {
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('AttachGateway should reference VPC and InternetGateway', () => {
      const props = template.Resources.AttachGateway.Properties;
      expect(props.VpcId).toEqual({ Ref: 'VPC' });
      expect(props.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });
  });

  describe('Public Subnet Resources', () => {
    test('should have PublicSubnet1 resource', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
    });

    test('PublicSubnet1 should be correct type', () => {
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
    });

    test('PublicSubnet1 should reference VPC', () => {
      expect(template.Resources.PublicSubnet1.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('PublicSubnet1 should use mapping for CIDR', () => {
      const cidr = template.Resources.PublicSubnet1.Properties.CidrBlock;
      expect(cidr['Fn::FindInMap']).toEqual(['SubnetConfig', { Ref: 'AWS::Region' }, 'PublicSubnet1']);
    });

    test('PublicSubnet1 should map public IP on launch', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have PublicSubnet2 resource', () => {
      expect(template.Resources.PublicSubnet2).toBeDefined();
    });

    test('PublicSubnet2 should map public IP on launch', () => {
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have PublicSubnet3 resource', () => {
      expect(template.Resources.PublicSubnet3).toBeDefined();
    });

    test('PublicSubnet3 should map public IP on launch', () => {
      expect(template.Resources.PublicSubnet3.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('all public subnets should have Environment tag', () => {
      ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'].forEach(subnetName => {
        const tags = template.Resources[subnetName].Properties.Tags;
        const envTag = tags.find((t: any) => t.Key === 'Environment');
        expect(envTag).toBeDefined();
        expect(envTag.Value).toEqual({ Ref: 'Environment' });
      });
    });
  });

  describe('Private Subnet Resources', () => {
    test('should have PrivateSubnet1 resource', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
    });

    test('PrivateSubnet1 should be correct type', () => {
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
    });

    test('PrivateSubnet1 should reference VPC', () => {
      expect(template.Resources.PrivateSubnet1.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('PrivateSubnet1 should use mapping for CIDR', () => {
      const cidr = template.Resources.PrivateSubnet1.Properties.CidrBlock;
      expect(cidr['Fn::FindInMap']).toEqual(['SubnetConfig', { Ref: 'AWS::Region' }, 'PrivateSubnet1']);
    });

    test('PrivateSubnet1 should not map public IP on launch', () => {
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('should have PrivateSubnet2 resource', () => {
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should have PrivateSubnet3 resource', () => {
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('all private subnets should have Environment tag', () => {
      ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'].forEach(subnetName => {
        const tags = template.Resources[subnetName].Properties.Tags;
        const envTag = tags.find((t: any) => t.Key === 'Environment');
        expect(envTag).toBeDefined();
        expect(envTag.Value).toEqual({ Ref: 'Environment' });
      });
    });
  });

  describe('Elastic IP Resources', () => {
    test('should have EIP1 resource', () => {
      expect(template.Resources.EIP1).toBeDefined();
    });

    test('EIP1 should be correct type', () => {
      expect(template.Resources.EIP1.Type).toBe('AWS::EC2::EIP');
    });

    test('EIP1 should have vpc domain', () => {
      expect(template.Resources.EIP1.Properties.Domain).toBe('vpc');
    });

    test('EIP1 should have Name tag', () => {
      const tags = template.Resources.EIP1.Properties.Tags;
      const nameTag = tags.find((t: any) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toBe('eip-nat-1a');
    });

    test('should have EIP2 resource', () => {
      expect(template.Resources.EIP2).toBeDefined();
    });

    test('EIP2 should have vpc domain', () => {
      expect(template.Resources.EIP2.Properties.Domain).toBe('vpc');
    });

    test('should have EIP3 resource', () => {
      expect(template.Resources.EIP3).toBeDefined();
    });

    test('EIP3 should have vpc domain', () => {
      expect(template.Resources.EIP3.Properties.Domain).toBe('vpc');
    });
  });

  describe('NAT Gateway Resources', () => {
    test('should have NATGateway1 resource', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
    });

    test('NATGateway1 should be correct type', () => {
      expect(template.Resources.NATGateway1.Type).toBe('AWS::EC2::NatGateway');
    });

    test('NATGateway1 should reference EIP1 and PublicSubnet1', () => {
      const props = template.Resources.NATGateway1.Properties;
      expect(props.AllocationId).toEqual({ 'Fn::GetAtt': ['EIP1', 'AllocationId'] });
      expect(props.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });

    test('NATGateway1 should have Environment tag', () => {
      const tags = template.Resources.NATGateway1.Properties.Tags;
      const envTag = tags.find((t: any) => t.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toEqual({ Ref: 'Environment' });
    });

    test('should have NATGateway2 resource', () => {
      expect(template.Resources.NATGateway2).toBeDefined();
    });

    test('NATGateway2 should reference EIP2 and PublicSubnet2', () => {
      const props = template.Resources.NATGateway2.Properties;
      expect(props.AllocationId).toEqual({ 'Fn::GetAtt': ['EIP2', 'AllocationId'] });
      expect(props.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
    });

    test('should have NATGateway3 resource', () => {
      expect(template.Resources.NATGateway3).toBeDefined();
    });

    test('NATGateway3 should reference EIP3 and PublicSubnet3', () => {
      const props = template.Resources.NATGateway3.Properties;
      expect(props.AllocationId).toEqual({ 'Fn::GetAtt': ['EIP3', 'AllocationId'] });
      expect(props.SubnetId).toEqual({ Ref: 'PublicSubnet3' });
    });
  });

  describe('Public Route Table Resources', () => {
    test('should have PublicRouteTable resource', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
    });

    test('PublicRouteTable should be correct type', () => {
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('PublicRouteTable should reference VPC', () => {
      expect(template.Resources.PublicRouteTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should have PublicRoute resource', () => {
      expect(template.Resources.PublicRoute).toBeDefined();
    });

    test('PublicRoute should be correct type', () => {
      expect(template.Resources.PublicRoute.Type).toBe('AWS::EC2::Route');
    });

    test('PublicRoute should depend on AttachGateway', () => {
      expect(template.Resources.PublicRoute.DependsOn).toBe('AttachGateway');
    });

    test('PublicRoute should route to InternetGateway', () => {
      const props = template.Resources.PublicRoute.Properties;
      expect(props.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(props.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(props.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have PublicSubnetRouteTableAssociation1', () => {
      expect(template.Resources.PublicSubnetRouteTableAssociation1).toBeDefined();
    });

    test('PublicSubnetRouteTableAssociation1 should be correct type', () => {
      expect(template.Resources.PublicSubnetRouteTableAssociation1.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    });

    test('PublicSubnetRouteTableAssociation1 should associate PublicSubnet1', () => {
      const props = template.Resources.PublicSubnetRouteTableAssociation1.Properties;
      expect(props.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(props.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
    });

    test('should have PublicSubnetRouteTableAssociation2', () => {
      expect(template.Resources.PublicSubnetRouteTableAssociation2).toBeDefined();
    });

    test('PublicSubnetRouteTableAssociation2 should associate PublicSubnet2', () => {
      const props = template.Resources.PublicSubnetRouteTableAssociation2.Properties;
      expect(props.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
      expect(props.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
    });

    test('should have PublicSubnetRouteTableAssociation3', () => {
      expect(template.Resources.PublicSubnetRouteTableAssociation3).toBeDefined();
    });

    test('PublicSubnetRouteTableAssociation3 should associate PublicSubnet3', () => {
      const props = template.Resources.PublicSubnetRouteTableAssociation3.Properties;
      expect(props.SubnetId).toEqual({ Ref: 'PublicSubnet3' });
      expect(props.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
    });
  });

  describe('Private Route Table Resources', () => {
    test('should have PrivateRouteTable1 resource', () => {
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
    });

    test('PrivateRouteTable1 should be correct type', () => {
      expect(template.Resources.PrivateRouteTable1.Type).toBe('AWS::EC2::RouteTable');
    });

    test('PrivateRouteTable1 should reference VPC', () => {
      expect(template.Resources.PrivateRouteTable1.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should have PrivateRoute1 resource', () => {
      expect(template.Resources.PrivateRoute1).toBeDefined();
    });

    test('PrivateRoute1 should route to NATGateway1', () => {
      const props = template.Resources.PrivateRoute1.Properties;
      expect(props.RouteTableId).toEqual({ Ref: 'PrivateRouteTable1' });
      expect(props.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(props.NatGatewayId).toEqual({ Ref: 'NATGateway1' });
    });

    test('should have PrivateSubnetRouteTableAssociation1', () => {
      expect(template.Resources.PrivateSubnetRouteTableAssociation1).toBeDefined();
    });

    test('PrivateSubnetRouteTableAssociation1 should associate PrivateSubnet1', () => {
      const props = template.Resources.PrivateSubnetRouteTableAssociation1.Properties;
      expect(props.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(props.RouteTableId).toEqual({ Ref: 'PrivateRouteTable1' });
    });

    test('should have PrivateRouteTable2 resource', () => {
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
    });

    test('PrivateRoute2 should route to NATGateway2', () => {
      const props = template.Resources.PrivateRoute2.Properties;
      expect(props.NatGatewayId).toEqual({ Ref: 'NATGateway2' });
    });

    test('PrivateSubnetRouteTableAssociation2 should associate PrivateSubnet2', () => {
      const props = template.Resources.PrivateSubnetRouteTableAssociation2.Properties;
      expect(props.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
      expect(props.RouteTableId).toEqual({ Ref: 'PrivateRouteTable2' });
    });

    test('should have PrivateRouteTable3 resource', () => {
      expect(template.Resources.PrivateRouteTable3).toBeDefined();
    });

    test('PrivateRoute3 should route to NATGateway3', () => {
      const props = template.Resources.PrivateRoute3.Properties;
      expect(props.NatGatewayId).toEqual({ Ref: 'NATGateway3' });
    });

    test('PrivateSubnetRouteTableAssociation3 should associate PrivateSubnet3', () => {
      const props = template.Resources.PrivateSubnetRouteTableAssociation3.Properties;
      expect(props.SubnetId).toEqual({ Ref: 'PrivateSubnet3' });
      expect(props.RouteTableId).toEqual({ Ref: 'PrivateRouteTable3' });
    });
  });

  describe('VPC Flow Logs Resources', () => {
    test('should have FlowLogsRole resource', () => {
      expect(template.Resources.FlowLogsRole).toBeDefined();
    });

    test('FlowLogsRole should be correct type', () => {
      expect(template.Resources.FlowLogsRole.Type).toBe('AWS::IAM::Role');
    });

    test('FlowLogsRole should have assume role policy for vpc-flow-logs', () => {
      const assumePolicy = template.Resources.FlowLogsRole.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement).toHaveLength(1);
      expect(assumePolicy.Statement[0].Principal.Service).toBe('vpc-flow-logs.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('FlowLogsRole should have CloudWatch logs policy', () => {
      const policies = template.Resources.FlowLogsRole.Properties.Policies;
      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('CloudWatchLogPolicy');

      const policyDoc = policies[0].PolicyDocument;
      expect(policyDoc.Statement[0].Effect).toBe('Allow');
      expect(policyDoc.Statement[0].Action).toContain('logs:CreateLogGroup');
      expect(policyDoc.Statement[0].Action).toContain('logs:CreateLogStream');
      expect(policyDoc.Statement[0].Action).toContain('logs:PutLogEvents');
    });

    test('should have FlowLogsLogGroup resource', () => {
      expect(template.Resources.FlowLogsLogGroup).toBeDefined();
    });

    test('FlowLogsLogGroup should be correct type', () => {
      expect(template.Resources.FlowLogsLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('FlowLogsLogGroup should have 30-day retention', () => {
      expect(template.Resources.FlowLogsLogGroup.Properties.RetentionInDays).toBe(30);
    });

    test('FlowLogsLogGroup should have correct name', () => {
      expect(template.Resources.FlowLogsLogGroup.Properties.LogGroupName).toBe('/aws/vpc/flowlogs');
    });

    test('should have VPCFlowLog resource', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
    });

    test('VPCFlowLog should be correct type', () => {
      expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');
    });

    test('VPCFlowLog should capture all traffic', () => {
      const props = template.Resources.VPCFlowLog.Properties;
      expect(props.ResourceType).toBe('VPC');
      expect(props.TrafficType).toBe('ALL');
      expect(props.LogDestinationType).toBe('cloud-watch-logs');
    });

    test('VPCFlowLog should reference VPC and FlowLogsLogGroup', () => {
      const props = template.Resources.VPCFlowLog.Properties;
      expect(props.ResourceId).toEqual({ Ref: 'VPC' });
      expect(props.LogGroupName).toEqual({ Ref: 'FlowLogsLogGroup' });
    });

    test('VPCFlowLog should use FlowLogsRole', () => {
      const props = template.Resources.VPCFlowLog.Properties;
      expect(props.DeliverLogsPermissionArn).toEqual({ 'Fn::GetAtt': ['FlowLogsRole', 'Arn'] });
    });
  });

  describe('Network ACL Resources', () => {
    test('should have NetworkAcl resource', () => {
      expect(template.Resources.NetworkAcl).toBeDefined();
    });

    test('NetworkAcl should be correct type', () => {
      expect(template.Resources.NetworkAcl.Type).toBe('AWS::EC2::NetworkAcl');
    });

    test('NetworkAcl should reference VPC', () => {
      expect(template.Resources.NetworkAcl.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should have InboundHTTPRule resource', () => {
      expect(template.Resources.InboundHTTPRule).toBeDefined();
    });

    test('InboundHTTPRule should allow port 80', () => {
      const props = template.Resources.InboundHTTPRule.Properties;
      expect(props.Protocol).toBe(6);
      expect(props.RuleAction).toBe('allow');
      expect(props.PortRange.From).toBe(80);
      expect(props.PortRange.To).toBe(80);
      expect(props.RuleNumber).toBe(100);
    });

    test('should have InboundHTTPSRule resource', () => {
      expect(template.Resources.InboundHTTPSRule).toBeDefined();
    });

    test('InboundHTTPSRule should allow port 443', () => {
      const props = template.Resources.InboundHTTPSRule.Properties;
      expect(props.Protocol).toBe(6);
      expect(props.RuleAction).toBe('allow');
      expect(props.PortRange.From).toBe(443);
      expect(props.PortRange.To).toBe(443);
      expect(props.RuleNumber).toBe(110);
    });

    test('should have InboundSSHRule resource', () => {
      expect(template.Resources.InboundSSHRule).toBeDefined();
    });

    test('InboundSSHRule should allow port 22 from private network', () => {
      const props = template.Resources.InboundSSHRule.Properties;
      expect(props.Protocol).toBe(6);
      expect(props.RuleAction).toBe('allow');
      expect(props.PortRange.From).toBe(22);
      expect(props.PortRange.To).toBe(22);
      expect(props.CidrBlock).toBe('10.0.0.0/8');
      expect(props.RuleNumber).toBe(120);
    });

    test('should have OutboundRule resource', () => {
      expect(template.Resources.OutboundRule).toBeDefined();
    });

    test('OutboundRule should allow all egress traffic', () => {
      const props = template.Resources.OutboundRule.Properties;
      expect(props.Protocol).toBe(-1);
      expect(props.Egress).toBe(true);
      expect(props.RuleAction).toBe('allow');
      expect(props.CidrBlock).toBe('0.0.0.0/0');
      expect(props.RuleNumber).toBe(100);
    });
  });

  describe('Outputs', () => {
    test('should have VPCID output', () => {
      expect(template.Outputs.VPCID).toBeDefined();
    });

    test('VPCID output should have correct structure', () => {
      const output = template.Outputs.VPCID;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-VPCID' });
    });

    test('should have all public subnet outputs', () => {
      expect(template.Outputs.PublicSubnet1ID).toBeDefined();
      expect(template.Outputs.PublicSubnet2ID).toBeDefined();
      expect(template.Outputs.PublicSubnet3ID).toBeDefined();
    });

    test('PublicSubnet1ID output should have correct structure', () => {
      const output = template.Outputs.PublicSubnet1ID;
      expect(output.Description).toBe('Public Subnet 1 ID');
      expect(output.Value).toEqual({ Ref: 'PublicSubnet1' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-PublicSubnet1' });
    });

    test('should have all private subnet outputs', () => {
      expect(template.Outputs.PrivateSubnet1ID).toBeDefined();
      expect(template.Outputs.PrivateSubnet2ID).toBeDefined();
      expect(template.Outputs.PrivateSubnet3ID).toBeDefined();
    });

    test('PrivateSubnet1ID output should have correct structure', () => {
      const output = template.Outputs.PrivateSubnet1ID;
      expect(output.Description).toBe('Private Subnet 1 ID');
      expect(output.Value).toEqual({ Ref: 'PrivateSubnet1' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-PrivateSubnet1' });
    });

    test('should have all NAT Gateway IP outputs', () => {
      expect(template.Outputs.NATGateway1IP).toBeDefined();
      expect(template.Outputs.NATGateway2IP).toBeDefined();
      expect(template.Outputs.NATGateway3IP).toBeDefined();
    });

    test('NATGateway1IP output should have correct structure', () => {
      const output = template.Outputs.NATGateway1IP;
      expect(output.Description).toBe('NAT Gateway 1 Elastic IP');
      expect(output.Value).toEqual({ Ref: 'EIP1' });
    });

    test('should have exactly 10 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(10);
    });
  });

  describe('Resource Count Validation', () => {
    test('should have exactly 37 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(37);
    });

    test('should have all expected resource types', () => {
      const resourceTypes = Object.keys(template.Resources).map(key => template.Resources[key].Type);

      expect(resourceTypes.filter(t => t === 'AWS::EC2::VPC')).toHaveLength(1);
      expect(resourceTypes.filter(t => t === 'AWS::EC2::InternetGateway')).toHaveLength(1);
      expect(resourceTypes.filter(t => t === 'AWS::EC2::VPCGatewayAttachment')).toHaveLength(1);
      expect(resourceTypes.filter(t => t === 'AWS::EC2::Subnet')).toHaveLength(6);
      expect(resourceTypes.filter(t => t === 'AWS::EC2::EIP')).toHaveLength(3);
      expect(resourceTypes.filter(t => t === 'AWS::EC2::NatGateway')).toHaveLength(3);
      expect(resourceTypes.filter(t => t === 'AWS::EC2::RouteTable')).toHaveLength(4);
      expect(resourceTypes.filter(t => t === 'AWS::EC2::Route')).toHaveLength(4);
      expect(resourceTypes.filter(t => t === 'AWS::EC2::SubnetRouteTableAssociation')).toHaveLength(6);
      expect(resourceTypes.filter(t => t === 'AWS::IAM::Role')).toHaveLength(1);
      expect(resourceTypes.filter(t => t === 'AWS::Logs::LogGroup')).toHaveLength(1);
      expect(resourceTypes.filter(t => t === 'AWS::EC2::FlowLog')).toHaveLength(1);
      expect(resourceTypes.filter(t => t === 'AWS::EC2::NetworkAcl')).toHaveLength(1);
      expect(resourceTypes.filter(t => t === 'AWS::EC2::NetworkAclEntry')).toHaveLength(4);
    });
  });

  describe('High Availability Validation', () => {
    test('each AZ should have one NAT Gateway', () => {
      const natSubnets = [
        template.Resources.NATGateway1.Properties.SubnetId,
        template.Resources.NATGateway2.Properties.SubnetId,
        template.Resources.NATGateway3.Properties.SubnetId
      ];

      expect(natSubnets).toHaveLength(3);
      expect(natSubnets[0]).toEqual({ Ref: 'PublicSubnet1' });
      expect(natSubnets[1]).toEqual({ Ref: 'PublicSubnet2' });
      expect(natSubnets[2]).toEqual({ Ref: 'PublicSubnet3' });
    });
  });

  describe('Security and Compliance', () => {
    test('all resources should have proper tagging', () => {
      const taggedResources = Object.keys(template.Resources).filter(key => {
        const resource = template.Resources[key];
        return resource.Properties && resource.Properties.Tags;
      });

      expect(taggedResources.length).toBeGreaterThan(15);
    });

    test('VPC Flow Logs should be enabled', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Properties.TrafficType).toBe('ALL');
    });

    test('Network ACLs should restrict access', () => {
      const aclRules = ['InboundHTTPRule', 'InboundHTTPSRule', 'InboundSSHRule', 'OutboundRule'];
      aclRules.forEach(ruleName => {
        expect(template.Resources[ruleName]).toBeDefined();
      });
    });
  });
});
