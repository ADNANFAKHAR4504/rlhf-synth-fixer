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
      expect(template.Description).toContain('Production-ready VPC infrastructure');
      expect(template.Description).toContain('PCI DSS compliance');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Description).toContain('Unique suffix');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-z0-9-]+$');
    });
  });

  describe('VPC Configuration', () => {
    test('should have PaymentVPC resource', () => {
      expect(template.Resources.PaymentVPC).toBeDefined();
      expect(template.Resources.PaymentVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.PaymentVPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS hostname and support enabled', () => {
      const vpc = template.Resources.PaymentVPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should have proper tags including environment suffix', () => {
      const vpc = template.Resources.PaymentVPC;
      const nameTags = vpc.Properties.Tags.filter((tag: any) => tag.Key === 'Name');
      expect(nameTags.length).toBe(1);
      expect(nameTags[0].Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('VPC should have all required tags', () => {
      const vpc = template.Resources.PaymentVPC;
      const tagKeys = vpc.Properties.Tags.map((tag: any) => tag.Key);
      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Owner');
      expect(tagKeys).toContain('CostCenter');
    });

    test('VPC should have correct tag values', () => {
      const vpc = template.Resources.PaymentVPC;
      const envTag = vpc.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
      const ownerTag = vpc.Properties.Tags.find((tag: any) => tag.Key === 'Owner');
      const costTag = vpc.Properties.Tags.find((tag: any) => tag.Key === 'CostCenter');
      expect(envTag.Value).toBe('Production');
      expect(ownerTag.Value).toBe('FinanceTeam');
      expect(costTag.Value).toBe('TECH001');
    });
  });

  describe('Internet Gateway', () => {
    test('should have InternetGateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('VPC Gateway Attachment should reference correct VPC and IGW', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'PaymentVPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('InternetGateway should have proper tags', () => {
      const igw = template.Resources.InternetGateway;
      const tagKeys = igw.Properties.Tags.map((tag: any) => tag.Key);
      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Owner');
      expect(tagKeys).toContain('CostCenter');
    });
  });

  describe('Public Subnets', () => {
    test('should have 3 public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();
    });

    test('all public subnets should be of correct type', () => {
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet3.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PublicSubnet3.Properties.CidrBlock).toBe('10.0.3.0/24');
    });

    test('public subnets should map public IP on launch', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet3.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('public subnets should be in different availability zones', () => {
      expect(template.Resources.PublicSubnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(template.Resources.PublicSubnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
      expect(template.Resources.PublicSubnet3.Properties.AvailabilityZone['Fn::Select'][0]).toBe(2);
    });

    test('public subnets should reference correct VPC', () => {
      expect(template.Resources.PublicSubnet1.Properties.VpcId).toEqual({ Ref: 'PaymentVPC' });
      expect(template.Resources.PublicSubnet2.Properties.VpcId).toEqual({ Ref: 'PaymentVPC' });
      expect(template.Resources.PublicSubnet3.Properties.VpcId).toEqual({ Ref: 'PaymentVPC' });
    });

    test('public subnets should have proper tags with environment suffix', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const nameTags = subnet1.Properties.Tags.filter((tag: any) => tag.Key === 'Name');
      expect(nameTags[0].Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Private Subnets', () => {
    test('should have 3 private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('all private subnets should be of correct type', () => {
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet3.Type).toBe('AWS::EC2::Subnet');
    });

    test('private subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.12.0/24');
      expect(template.Resources.PrivateSubnet3.Properties.CidrBlock).toBe('10.0.13.0/24');
    });

    test('private subnets should NOT map public IP on launch', () => {
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateSubnet3.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('private subnets should be in different availability zones', () => {
      expect(template.Resources.PrivateSubnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(template.Resources.PrivateSubnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
      expect(template.Resources.PrivateSubnet3.Properties.AvailabilityZone['Fn::Select'][0]).toBe(2);
    });

    test('private subnets should reference correct VPC', () => {
      expect(template.Resources.PrivateSubnet1.Properties.VpcId).toEqual({ Ref: 'PaymentVPC' });
      expect(template.Resources.PrivateSubnet2.Properties.VpcId).toEqual({ Ref: 'PaymentVPC' });
      expect(template.Resources.PrivateSubnet3.Properties.VpcId).toEqual({ Ref: 'PaymentVPC' });
    });
  });

  describe('NAT Gateways and Elastic IPs', () => {
    test('should have 2 Elastic IPs', () => {
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway2EIP).toBeDefined();
    });

    test('Elastic IPs should be of correct type', () => {
      expect(template.Resources.NatGateway1EIP.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.NatGateway2EIP.Type).toBe('AWS::EC2::EIP');
    });

    test('Elastic IPs should have vpc domain', () => {
      expect(template.Resources.NatGateway1EIP.Properties.Domain).toBe('vpc');
      expect(template.Resources.NatGateway2EIP.Properties.Domain).toBe('vpc');
    });

    test('Elastic IPs should depend on gateway attachment', () => {
      expect(template.Resources.NatGateway1EIP.DependsOn).toBe('AttachGateway');
      expect(template.Resources.NatGateway2EIP.DependsOn).toBe('AttachGateway');
    });

    test('should have 2 NAT Gateways', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
    });

    test('NAT Gateways should be of correct type', () => {
      expect(template.Resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGateway2.Type).toBe('AWS::EC2::NatGateway');
    });

    test('NAT Gateways should reference correct EIPs', () => {
      expect(template.Resources.NatGateway1.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NatGateway1EIP', 'AllocationId']
      });
      expect(template.Resources.NatGateway2.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NatGateway2EIP', 'AllocationId']
      });
    });

    test('NAT Gateways should be in public subnets', () => {
      expect(template.Resources.NatGateway1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(template.Resources.NatGateway2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
    });

    test('NAT Gateways should have proper tags with environment suffix', () => {
      const nat1 = template.Resources.NatGateway1;
      const nameTags = nat1.Properties.Tags.filter((tag: any) => tag.Key === 'Name');
      expect(nameTags[0].Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Route Tables', () => {
    test('should have 1 public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have 3 private route tables', () => {
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(template.Resources.PrivateRouteTable3).toBeDefined();
    });

    test('all route tables should reference correct VPC', () => {
      expect(template.Resources.PublicRouteTable.Properties.VpcId).toEqual({ Ref: 'PaymentVPC' });
      expect(template.Resources.PrivateRouteTable1.Properties.VpcId).toEqual({ Ref: 'PaymentVPC' });
      expect(template.Resources.PrivateRouteTable2.Properties.VpcId).toEqual({ Ref: 'PaymentVPC' });
      expect(template.Resources.PrivateRouteTable3.Properties.VpcId).toEqual({ Ref: 'PaymentVPC' });
    });

    test('should have public route to internet gateway', () => {
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicRoute.Type).toBe('AWS::EC2::Route');
      expect(template.Resources.PublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(template.Resources.PublicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('public route should depend on gateway attachment', () => {
      expect(template.Resources.PublicRoute.DependsOn).toBe('AttachGateway');
    });

    test('should have private routes to NAT gateways', () => {
      expect(template.Resources.PrivateRoute1).toBeDefined();
      expect(template.Resources.PrivateRoute2).toBeDefined();
      expect(template.Resources.PrivateRoute3).toBeDefined();
    });

    test('private routes should route to correct NAT gateways', () => {
      expect(template.Resources.PrivateRoute1.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway1' });
      expect(template.Resources.PrivateRoute2.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway2' });
      expect(template.Resources.PrivateRoute3.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway2' });
    });

    test('private routes should have correct destination CIDR', () => {
      expect(template.Resources.PrivateRoute1.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(template.Resources.PrivateRoute2.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(template.Resources.PrivateRoute3.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });
  });

  describe('Route Table Associations', () => {
    test('should have 3 public subnet associations', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet3RouteTableAssociation).toBeDefined();
    });

    test('public subnet associations should be correct type', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(template.Resources.PublicSubnet2RouteTableAssociation.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(template.Resources.PublicSubnet3RouteTableAssociation.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    });

    test('public subnet associations should reference correct subnets', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(template.Resources.PublicSubnet2RouteTableAssociation.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
      expect(template.Resources.PublicSubnet3RouteTableAssociation.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet3' });
    });

    test('public subnet associations should reference public route table', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(template.Resources.PublicSubnet2RouteTableAssociation.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(template.Resources.PublicSubnet3RouteTableAssociation.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
    });

    test('should have 3 private subnet associations', () => {
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet3RouteTableAssociation).toBeDefined();
    });

    test('private subnet associations should reference correct route tables', () => {
      expect(template.Resources.PrivateSubnet1RouteTableAssociation.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable1' });
      expect(template.Resources.PrivateSubnet2RouteTableAssociation.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable2' });
      expect(template.Resources.PrivateSubnet3RouteTableAssociation.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable3' });
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have CloudWatch Log Group for VPC Flow Logs', () => {
      expect(template.Resources.VPCFlowLogsGroup).toBeDefined();
      expect(template.Resources.VPCFlowLogsGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('Log Group should have 30-day retention', () => {
      expect(template.Resources.VPCFlowLogsGroup.Properties.RetentionInDays).toBe(30);
    });

    test('Log Group name should include environment suffix', () => {
      expect(template.Resources.VPCFlowLogsGroup.Properties.LogGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have IAM Role for VPC Flow Logs', () => {
      expect(template.Resources.VPCFlowLogsRole).toBeDefined();
      expect(template.Resources.VPCFlowLogsRole.Type).toBe('AWS::IAM::Role');
    });

    test('IAM Role should have correct trust policy', () => {
      const role = template.Resources.VPCFlowLogsRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Effect).toBe('Allow');
      expect(trustPolicy.Statement[0].Principal.Service).toBe('vpc-flow-logs.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('IAM Role should have CloudWatch Logs permissions', () => {
      const role = template.Resources.VPCFlowLogsRole;
      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('CloudWatchLogPolicy');
      expect(policy.PolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogGroup');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogStream');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:PutLogEvents');
    });

    test('should have VPC Flow Log resource', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');
    });

    test('VPC Flow Log should capture all traffic', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog.Properties.TrafficType).toBe('ALL');
    });

    test('VPC Flow Log should use CloudWatch Logs destination', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
    });

    test('VPC Flow Log should reference correct VPC', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog.Properties.ResourceType).toBe('VPC');
      expect(flowLog.Properties.ResourceId).toEqual({ Ref: 'PaymentVPC' });
    });

    test('IAM Role name should include environment suffix', () => {
      expect(template.Resources.VPCFlowLogsRole.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('VPC Endpoints', () => {
    test('should have S3 VPC Endpoint', () => {
      expect(template.Resources.S3VPCEndpoint).toBeDefined();
      expect(template.Resources.S3VPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
    });

    test('S3 endpoint should be Gateway type', () => {
      expect(template.Resources.S3VPCEndpoint.Properties.VpcEndpointType).toBe('Gateway');
    });

    test('S3 endpoint should have correct service name', () => {
      expect(template.Resources.S3VPCEndpoint.Properties.ServiceName['Fn::Sub']).toContain('com.amazonaws.${AWS::Region}.s3');
    });

    test('S3 endpoint should be associated with private route tables', () => {
      const routeTables = template.Resources.S3VPCEndpoint.Properties.RouteTableIds;
      expect(routeTables).toContainEqual({ Ref: 'PrivateRouteTable1' });
      expect(routeTables).toContainEqual({ Ref: 'PrivateRouteTable2' });
      expect(routeTables).toContainEqual({ Ref: 'PrivateRouteTable3' });
    });

    test('S3 endpoint should have policy document', () => {
      expect(template.Resources.S3VPCEndpoint.Properties.PolicyDocument).toBeDefined();
      expect(template.Resources.S3VPCEndpoint.Properties.PolicyDocument.Statement).toBeDefined();
    });

    test('should have DynamoDB VPC Endpoint', () => {
      expect(template.Resources.DynamoDBVPCEndpoint).toBeDefined();
      expect(template.Resources.DynamoDBVPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
    });

    test('DynamoDB endpoint should be Gateway type', () => {
      expect(template.Resources.DynamoDBVPCEndpoint.Properties.VpcEndpointType).toBe('Gateway');
    });

    test('DynamoDB endpoint should have correct service name', () => {
      expect(template.Resources.DynamoDBVPCEndpoint.Properties.ServiceName['Fn::Sub']).toContain('com.amazonaws.${AWS::Region}.dynamodb');
    });

    test('DynamoDB endpoint should be associated with private route tables', () => {
      const routeTables = template.Resources.DynamoDBVPCEndpoint.Properties.RouteTableIds;
      expect(routeTables).toContainEqual({ Ref: 'PrivateRouteTable1' });
      expect(routeTables).toContainEqual({ Ref: 'PrivateRouteTable2' });
      expect(routeTables).toContainEqual({ Ref: 'PrivateRouteTable3' });
    });
  });

  describe('Security Groups', () => {
    test('should have Web Tier Security Group', () => {
      expect(template.Resources.WebTierSecurityGroup).toBeDefined();
      expect(template.Resources.WebTierSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('Web Tier SG should allow HTTP from VPC', () => {
      const webSg = template.Resources.WebTierSecurityGroup;
      const httpRule = webSg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.CidrIp).toBe('10.0.0.0/16');
    });

    test('Web Tier SG should allow HTTPS from VPC', () => {
      const webSg = template.Resources.WebTierSecurityGroup;
      const httpsRule = webSg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.ToPort).toBe(443);
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.CidrIp).toBe('10.0.0.0/16');
    });

    test('Web Tier SG should have no 0.0.0.0/0 ingress rules', () => {
      const webSg = template.Resources.WebTierSecurityGroup;
      const openRules = webSg.Properties.SecurityGroupIngress.filter((rule: any) => rule.CidrIp === '0.0.0.0/0');
      expect(openRules.length).toBe(0);
    });

    test('Web Tier SG should allow all outbound traffic', () => {
      const webSg = template.Resources.WebTierSecurityGroup;
      expect(webSg.Properties.SecurityGroupEgress).toBeDefined();
      expect(webSg.Properties.SecurityGroupEgress[0].IpProtocol).toBe(-1);
      expect(webSg.Properties.SecurityGroupEgress[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('Web Tier SG name should include environment suffix', () => {
      expect(template.Resources.WebTierSecurityGroup.Properties.GroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have Application Tier Security Group', () => {
      expect(template.Resources.AppTierSecurityGroup).toBeDefined();
      expect(template.Resources.AppTierSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('App Tier SG should allow port 8080 from Web Tier only', () => {
      const appSg = template.Resources.AppTierSecurityGroup;
      const appRule = appSg.Properties.SecurityGroupIngress[0];
      expect(appRule.FromPort).toBe(8080);
      expect(appRule.ToPort).toBe(8080);
      expect(appRule.IpProtocol).toBe('tcp');
      expect(appRule.SourceSecurityGroupId).toEqual({ Ref: 'WebTierSecurityGroup' });
    });

    test('App Tier SG should have no CIDR-based ingress rules', () => {
      const appSg = template.Resources.AppTierSecurityGroup;
      const cidrRules = appSg.Properties.SecurityGroupIngress.filter((rule: any) => rule.CidrIp);
      expect(cidrRules.length).toBe(0);
    });

    test('both security groups should reference correct VPC', () => {
      expect(template.Resources.WebTierSecurityGroup.Properties.VpcId).toEqual({ Ref: 'PaymentVPC' });
      expect(template.Resources.AppTierSecurityGroup.Properties.VpcId).toEqual({ Ref: 'PaymentVPC' });
    });
  });

  describe('Network ACLs', () => {
    test('should have Public Network ACL', () => {
      expect(template.Resources.PublicNetworkAcl).toBeDefined();
      expect(template.Resources.PublicNetworkAcl.Type).toBe('AWS::EC2::NetworkAcl');
    });

    test('should have Private Network ACL', () => {
      expect(template.Resources.PrivateNetworkAcl).toBeDefined();
      expect(template.Resources.PrivateNetworkAcl.Type).toBe('AWS::EC2::NetworkAcl');
    });

    test('Network ACLs should reference correct VPC', () => {
      expect(template.Resources.PublicNetworkAcl.Properties.VpcId).toEqual({ Ref: 'PaymentVPC' });
      expect(template.Resources.PrivateNetworkAcl.Properties.VpcId).toEqual({ Ref: 'PaymentVPC' });
    });

    test('should have public NACL inbound rules', () => {
      expect(template.Resources.PublicNaclInboundHTTP).toBeDefined();
      expect(template.Resources.PublicNaclInboundHTTPS).toBeDefined();
      expect(template.Resources.PublicNaclInboundEphemeral).toBeDefined();
    });

    test('public NACL should allow HTTP inbound', () => {
      const httpRule = template.Resources.PublicNaclInboundHTTP;
      expect(httpRule.Type).toBe('AWS::EC2::NetworkAclEntry');
      expect(httpRule.Properties.Protocol).toBe(6);
      expect(httpRule.Properties.RuleAction).toBe('allow');
      expect(httpRule.Properties.PortRange.From).toBe(80);
      expect(httpRule.Properties.PortRange.To).toBe(80);
    });

    test('public NACL should allow HTTPS inbound', () => {
      const httpsRule = template.Resources.PublicNaclInboundHTTPS;
      expect(httpsRule.Properties.Protocol).toBe(6);
      expect(httpsRule.Properties.RuleAction).toBe('allow');
      expect(httpsRule.Properties.PortRange.From).toBe(443);
      expect(httpsRule.Properties.PortRange.To).toBe(443);
    });

    test('public NACL should allow ephemeral ports inbound', () => {
      const ephemeralRule = template.Resources.PublicNaclInboundEphemeral;
      expect(ephemeralRule.Properties.PortRange.From).toBe(1024);
      expect(ephemeralRule.Properties.PortRange.To).toBe(65535);
    });

    test('should have public NACL outbound rules', () => {
      expect(template.Resources.PublicNaclOutboundHTTP).toBeDefined();
      expect(template.Resources.PublicNaclOutboundHTTPS).toBeDefined();
      expect(template.Resources.PublicNaclOutboundEphemeral).toBeDefined();
    });

    test('public NACL outbound rules should have Egress set to true', () => {
      expect(template.Resources.PublicNaclOutboundHTTP.Properties.Egress).toBe(true);
      expect(template.Resources.PublicNaclOutboundHTTPS.Properties.Egress).toBe(true);
      expect(template.Resources.PublicNaclOutboundEphemeral.Properties.Egress).toBe(true);
    });

    test('should have private NACL inbound rules', () => {
      expect(template.Resources.PrivateNaclInboundVPC).toBeDefined();
      expect(template.Resources.PrivateNaclInboundEphemeral).toBeDefined();
    });

    test('private NACL should allow all VPC traffic inbound', () => {
      const vpcRule = template.Resources.PrivateNaclInboundVPC;
      expect(vpcRule.Properties.Protocol).toBe(-1);
      expect(vpcRule.Properties.RuleAction).toBe('allow');
      expect(vpcRule.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('private NACL should allow all traffic outbound', () => {
      const outboundRule = template.Resources.PrivateNaclOutboundAll;
      expect(outboundRule.Properties.Protocol).toBe(-1);
      expect(outboundRule.Properties.Egress).toBe(true);
      expect(outboundRule.Properties.RuleAction).toBe('allow');
    });

    test('should have 3 public subnet NACL associations', () => {
      expect(template.Resources.PublicSubnet1NetworkAclAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2NetworkAclAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet3NetworkAclAssociation).toBeDefined();
    });

    test('should have 3 private subnet NACL associations', () => {
      expect(template.Resources.PrivateSubnet1NetworkAclAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2NetworkAclAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet3NetworkAclAssociation).toBeDefined();
    });

    test('public subnets should be associated with public NACL', () => {
      expect(template.Resources.PublicSubnet1NetworkAclAssociation.Properties.NetworkAclId).toEqual({ Ref: 'PublicNetworkAcl' });
      expect(template.Resources.PublicSubnet2NetworkAclAssociation.Properties.NetworkAclId).toEqual({ Ref: 'PublicNetworkAcl' });
      expect(template.Resources.PublicSubnet3NetworkAclAssociation.Properties.NetworkAclId).toEqual({ Ref: 'PublicNetworkAcl' });
    });

    test('private subnets should be associated with private NACL', () => {
      expect(template.Resources.PrivateSubnet1NetworkAclAssociation.Properties.NetworkAclId).toEqual({ Ref: 'PrivateNetworkAcl' });
      expect(template.Resources.PrivateSubnet2NetworkAclAssociation.Properties.NetworkAclId).toEqual({ Ref: 'PrivateNetworkAcl' });
      expect(template.Resources.PrivateSubnet3NetworkAclAssociation.Properties.NetworkAclId).toEqual({ Ref: 'PrivateNetworkAcl' });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'VPCCidr',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PublicSubnet3Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'PrivateSubnet3Id',
        'WebTierSecurityGroupId',
        'AppTierSecurityGroupId',
        'NatGateway1Id',
        'NatGateway2Id'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPC output should have correct structure', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'PaymentVPC' });
      expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
    });

    test('VPC CIDR output should have correct value', () => {
      const output = template.Outputs.VPCCidr;
      expect(output.Value).toBe('10.0.0.0/16');
    });

    test('subnet outputs should reference correct resources', () => {
      expect(template.Outputs.PublicSubnet1Id.Value).toEqual({ Ref: 'PublicSubnet1' });
      expect(template.Outputs.PublicSubnet2Id.Value).toEqual({ Ref: 'PublicSubnet2' });
      expect(template.Outputs.PublicSubnet3Id.Value).toEqual({ Ref: 'PublicSubnet3' });
      expect(template.Outputs.PrivateSubnet1Id.Value).toEqual({ Ref: 'PrivateSubnet1' });
      expect(template.Outputs.PrivateSubnet2Id.Value).toEqual({ Ref: 'PrivateSubnet2' });
      expect(template.Outputs.PrivateSubnet3Id.Value).toEqual({ Ref: 'PrivateSubnet3' });
    });

    test('security group outputs should reference correct resources', () => {
      expect(template.Outputs.WebTierSecurityGroupId.Value).toEqual({ Ref: 'WebTierSecurityGroup' });
      expect(template.Outputs.AppTierSecurityGroupId.Value).toEqual({ Ref: 'AppTierSecurityGroup' });
    });

    test('NAT Gateway outputs should reference correct resources', () => {
      expect(template.Outputs.NatGateway1Id.Value).toEqual({ Ref: 'NatGateway1' });
      expect(template.Outputs.NatGateway2Id.Value).toEqual({ Ref: 'NatGateway2' });
    });

    test('all outputs should have Export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
        expect(template.Outputs[outputKey].Export.Name).toBeDefined();
      });
    });
  });

  describe('Template Validation', () => {
    test('should not have any Retain deletion policies', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).not.toBe('Retain');
        expect(resource.UpdateReplacePolicy).not.toBe('Retain');
      });
    });

    test('should have exactly 51 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(51);
    });

    test('all resources should have proper tags', () => {
      const resourcesWithTags = [
        'PaymentVPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PublicSubnet3',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PrivateSubnet3',
        'NatGateway1EIP',
        'NatGateway2EIP',
        'NatGateway1',
        'NatGateway2',
        'PublicRouteTable',
        'PrivateRouteTable1',
        'PrivateRouteTable2',
        'PrivateRouteTable3',
        'VPCFlowLogsGroup',
        'VPCFlowLogsRole',
        'VPCFlowLog',
        'WebTierSecurityGroup',
        'AppTierSecurityGroup',
        'PublicNetworkAcl',
        'PrivateNetworkAcl'
      ];

      resourcesWithTags.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.Properties.Tags).toBeDefined();
        const tagKeys = resource.Properties.Tags.map((tag: any) => tag.Key);
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Owner');
        expect(tagKeys).toContain('CostCenter');
      });
    });

    test('all named resources should include environment suffix', () => {
      const resourcesWithNames = [
        'PaymentVPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PublicSubnet3',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PrivateSubnet3',
        'NatGateway1EIP',
        'NatGateway2EIP',
        'NatGateway1',
        'NatGateway2',
        'PublicRouteTable',
        'PrivateRouteTable1',
        'PrivateRouteTable2',
        'PrivateRouteTable3'
      ];

      resourcesWithNames.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        const nameTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Name');
        expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });

    test('template should have no hardcoded region references', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).not.toMatch(/us-east-1(?!.*AWS::Region)/);
      expect(templateStr).not.toMatch(/us-west-2(?!.*AWS::Region)/);
    });
  });

  describe('High Availability', () => {
    test('should use 3 availability zones', () => {
      const publicSubnets = [
        template.Resources.PublicSubnet1,
        template.Resources.PublicSubnet2,
        template.Resources.PublicSubnet3
      ];
      const azIndices = publicSubnets.map(subnet => subnet.Properties.AvailabilityZone['Fn::Select'][0]);
      expect(azIndices).toEqual([0, 1, 2]);
    });

    test('should have redundant NAT Gateways in different AZs', () => {
      expect(template.Resources.NatGateway1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(template.Resources.NatGateway2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
    });

    test('should have separate route tables for each private subnet', () => {
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(template.Resources.PrivateRouteTable3).toBeDefined();
    });
  });

  describe('Security Compliance', () => {
    test('private subnets should not have direct internet gateway routes', () => {
      const privateRoutes = [
        template.Resources.PrivateRoute1,
        template.Resources.PrivateRoute2,
        template.Resources.PrivateRoute3
      ];
      privateRoutes.forEach(route => {
        expect(route.Properties.GatewayId).toBeUndefined();
        expect(route.Properties.NatGatewayId).toBeDefined();
      });
    });

    test('security groups should follow least privilege', () => {
      const webSg = template.Resources.WebTierSecurityGroup;
      webSg.Properties.SecurityGroupIngress.forEach((rule: any) => {
        expect(rule.CidrIp).not.toBe('0.0.0.0/0');
      });
    });

    test('VPC Flow Logs should be enabled', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Properties.TrafficType).toBe('ALL');
    });

    test('VPC endpoints should be configured for private access', () => {
      expect(template.Resources.S3VPCEndpoint).toBeDefined();
      expect(template.Resources.DynamoDBVPCEndpoint).toBeDefined();
    });
  });
});
