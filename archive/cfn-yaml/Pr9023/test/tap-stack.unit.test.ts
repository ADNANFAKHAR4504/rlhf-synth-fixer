import fs from 'fs';
import path from 'path';

describe('TapStack Hub-and-Spoke Network Architecture CloudFormation Template', () => {
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
      expect(template.Description).toBe(
        'Hub-and-Spoke Network Architecture with AWS Transit Gateway'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
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
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have HubVpcCidr parameter', () => {
      expect(template.Parameters.HubVpcCidr).toBeDefined();
      expect(template.Parameters.HubVpcCidr.Default).toBe('10.0.0.0/16');
    });

    test('should have Spoke1VpcCidr parameter', () => {
      expect(template.Parameters.Spoke1VpcCidr).toBeDefined();
      expect(template.Parameters.Spoke1VpcCidr.Default).toBe('10.1.0.0/16');
    });

    test('should have Spoke2VpcCidr parameter', () => {
      expect(template.Parameters.Spoke2VpcCidr).toBeDefined();
      expect(template.Parameters.Spoke2VpcCidr.Default).toBe('10.2.0.0/16');
    });
  });

  describe('VPC Resources', () => {
    test('should have HubVpc resource', () => {
      expect(template.Resources.HubVpc).toBeDefined();
      expect(template.Resources.HubVpc.Type).toBe('AWS::EC2::VPC');
    });

    test('HubVpc should have correct deletion policies', () => {
      const hubVpc = template.Resources.HubVpc;
      expect(hubVpc.DeletionPolicy).toBe('Delete');
      expect(hubVpc.UpdateReplacePolicy).toBe('Delete');
    });

    test('HubVpc should enable DNS support and hostnames', () => {
      const hubVpc = template.Resources.HubVpc;
      expect(hubVpc.Properties.EnableDnsHostnames).toBe(true);
      expect(hubVpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('HubVpc should have correct tags including environmentSuffix', () => {
      const hubVpc = template.Resources.HubVpc;
      const tags = hubVpc.Properties.Tags;

      const nameTag = tags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toBe('hub-vpc-${EnvironmentSuffix}');

      const envTag = tags.find((t: any) => t.Key === 'Environment');
      expect(envTag.Value.Ref).toBe('EnvironmentSuffix');

      expect(tags.find((t: any) => t.Key === 'CostCenter')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'DataClassification')).toBeDefined();
    });

    test('should have Spoke1Vpc resource', () => {
      expect(template.Resources.Spoke1Vpc).toBeDefined();
      expect(template.Resources.Spoke1Vpc.Type).toBe('AWS::EC2::VPC');
    });

    test('should have Spoke2Vpc resource', () => {
      expect(template.Resources.Spoke2Vpc).toBeDefined();
      expect(template.Resources.Spoke2Vpc.Type).toBe('AWS::EC2::VPC');
    });

    test('Spoke VPCs should have correct deletion policies', () => {
      expect(template.Resources.Spoke1Vpc.DeletionPolicy).toBe('Delete');
      expect(template.Resources.Spoke1Vpc.UpdateReplacePolicy).toBe('Delete');
      expect(template.Resources.Spoke2Vpc.DeletionPolicy).toBe('Delete');
      expect(template.Resources.Spoke2Vpc.UpdateReplacePolicy).toBe('Delete');
    });
  });

  describe('Hub VPC Subnets', () => {
    test('should have 3 public subnets in Hub VPC', () => {
      expect(template.Resources.HubPublicSubnet1).toBeDefined();
      expect(template.Resources.HubPublicSubnet2).toBeDefined();
      expect(template.Resources.HubPublicSubnet3).toBeDefined();
    });

    test('Hub public subnets should be in different AZs', () => {
      const subnet1 = template.Resources.HubPublicSubnet1;
      const subnet2 = template.Resources.HubPublicSubnet2;
      const subnet3 = template.Resources.HubPublicSubnet3;

      expect(subnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(subnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
      expect(subnet3.Properties.AvailabilityZone['Fn::Select'][0]).toBe(2);
    });

    test('Hub public subnets should have MapPublicIpOnLaunch enabled', () => {
      expect(template.Resources.HubPublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.HubPublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.HubPublicSubnet3.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('Hub public subnets should have correct deletion policies', () => {
      expect(template.Resources.HubPublicSubnet1.DeletionPolicy).toBe('Delete');
      expect(template.Resources.HubPublicSubnet2.DeletionPolicy).toBe('Delete');
      expect(template.Resources.HubPublicSubnet3.DeletionPolicy).toBe('Delete');
    });

    test('Hub public subnets should include environmentSuffix in naming', () => {
      const subnet1Tags = template.Resources.HubPublicSubnet1.Properties.Tags;
      const nameTag = subnet1Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Spoke VPC Subnets', () => {
    test('Spoke1 should have 3 private subnets', () => {
      expect(template.Resources.Spoke1PrivateSubnet1).toBeDefined();
      expect(template.Resources.Spoke1PrivateSubnet2).toBeDefined();
      expect(template.Resources.Spoke1PrivateSubnet3).toBeDefined();
    });

    test('Spoke2 should have 3 private subnets', () => {
      expect(template.Resources.Spoke2PrivateSubnet1).toBeDefined();
      expect(template.Resources.Spoke2PrivateSubnet2).toBeDefined();
      expect(template.Resources.Spoke2PrivateSubnet3).toBeDefined();
    });

    test('Spoke private subnets should be in different AZs', () => {
      const subnet1 = template.Resources.Spoke1PrivateSubnet1;
      const subnet2 = template.Resources.Spoke1PrivateSubnet2;
      const subnet3 = template.Resources.Spoke1PrivateSubnet3;

      expect(subnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(subnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
      expect(subnet3.Properties.AvailabilityZone['Fn::Select'][0]).toBe(2);
    });

    test('Spoke private subnets should NOT have MapPublicIpOnLaunch', () => {
      expect(template.Resources.Spoke1PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
      expect(template.Resources.Spoke2PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('Spoke subnets should include environmentSuffix in naming', () => {
      const subnet1Tags = template.Resources.Spoke1PrivateSubnet1.Properties.Tags;
      const nameTag = subnet1Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Internet Gateway and NAT Gateways', () => {
    test('should have Internet Gateway for Hub VPC', () => {
      expect(template.Resources.HubInternetGateway).toBeDefined();
      expect(template.Resources.HubInternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have IGW attachment', () => {
      expect(template.Resources.HubIgwAttachment).toBeDefined();
      expect(template.Resources.HubIgwAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have 3 Elastic IPs for NAT Gateways', () => {
      expect(template.Resources.HubNatGateway1Eip).toBeDefined();
      expect(template.Resources.HubNatGateway2Eip).toBeDefined();
      expect(template.Resources.HubNatGateway3Eip).toBeDefined();
    });

    test('Elastic IPs should depend on IGW attachment', () => {
      expect(template.Resources.HubNatGateway1Eip.DependsOn).toBe('HubIgwAttachment');
      expect(template.Resources.HubNatGateway2Eip.DependsOn).toBe('HubIgwAttachment');
      expect(template.Resources.HubNatGateway3Eip.DependsOn).toBe('HubIgwAttachment');
    });

    test('should have 3 NAT Gateways in Hub VPC', () => {
      expect(template.Resources.HubNatGateway1).toBeDefined();
      expect(template.Resources.HubNatGateway2).toBeDefined();
      expect(template.Resources.HubNatGateway3).toBeDefined();
    });

    test('NAT Gateways should have correct deletion policies', () => {
      expect(template.Resources.HubNatGateway1.DeletionPolicy).toBe('Delete');
      expect(template.Resources.HubNatGateway2.DeletionPolicy).toBe('Delete');
      expect(template.Resources.HubNatGateway3.DeletionPolicy).toBe('Delete');
    });

    test('NAT Gateways should be in different subnets', () => {
      expect(template.Resources.HubNatGateway1.Properties.SubnetId.Ref).toBe('HubPublicSubnet1');
      expect(template.Resources.HubNatGateway2.Properties.SubnetId.Ref).toBe('HubPublicSubnet2');
      expect(template.Resources.HubNatGateway3.Properties.SubnetId.Ref).toBe('HubPublicSubnet3');
    });
  });

  describe('Transit Gateway', () => {
    test('should have Transit Gateway resource', () => {
      expect(template.Resources.TransitGateway).toBeDefined();
      expect(template.Resources.TransitGateway.Type).toBe('AWS::EC2::TransitGateway');
    });

    test('Transit Gateway should have default route table association disabled', () => {
      const tgw = template.Resources.TransitGateway;
      expect(tgw.Properties.DefaultRouteTableAssociation).toBe('disable');
      expect(tgw.Properties.DefaultRouteTablePropagation).toBe('disable');
    });

    test('Transit Gateway should have DNS support enabled', () => {
      expect(template.Resources.TransitGateway.Properties.DnsSupport).toBe('enable');
    });

    test('Transit Gateway should include environmentSuffix in naming', () => {
      const tgwTags = template.Resources.TransitGateway.Properties.Tags;
      const nameTag = tgwTags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have Transit Gateway attachments for all VPCs', () => {
      expect(template.Resources.HubTgwAttachment).toBeDefined();
      expect(template.Resources.Spoke1TgwAttachment).toBeDefined();
      expect(template.Resources.Spoke2TgwAttachment).toBeDefined();
    });

    test('Transit Gateway attachments should have correct VPCs', () => {
      expect(template.Resources.HubTgwAttachment.Properties.VpcId.Ref).toBe('HubVpc');
      expect(template.Resources.Spoke1TgwAttachment.Properties.VpcId.Ref).toBe('Spoke1Vpc');
      expect(template.Resources.Spoke2TgwAttachment.Properties.VpcId.Ref).toBe('Spoke2Vpc');
    });

    test('Hub TGW attachment should include all 3 subnets', () => {
      const subnets = template.Resources.HubTgwAttachment.Properties.SubnetIds;
      expect(subnets).toHaveLength(3);
      expect(subnets[0].Ref).toBe('HubPublicSubnet1');
      expect(subnets[1].Ref).toBe('HubPublicSubnet2');
      expect(subnets[2].Ref).toBe('HubPublicSubnet3');
    });

    test('Spoke TGW attachments should include all 3 private subnets', () => {
      const spoke1Subnets = template.Resources.Spoke1TgwAttachment.Properties.SubnetIds;
      expect(spoke1Subnets).toHaveLength(3);

      const spoke2Subnets = template.Resources.Spoke2TgwAttachment.Properties.SubnetIds;
      expect(spoke2Subnets).toHaveLength(3);
    });
  });

  describe('Transit Gateway Route Tables', () => {
    test('should have Hub Transit Gateway route table', () => {
      expect(template.Resources.HubTgwRouteTable).toBeDefined();
      expect(template.Resources.HubTgwRouteTable.Type).toBe('AWS::EC2::TransitGatewayRouteTable');
    });

    test('should have Spoke Transit Gateway route table', () => {
      expect(template.Resources.SpokeTgwRouteTable).toBeDefined();
      expect(template.Resources.SpokeTgwRouteTable.Type).toBe('AWS::EC2::TransitGatewayRouteTable');
    });

    test('Hub route table should be associated with Hub attachment', () => {
      const assoc = template.Resources.HubTgwRouteTableAssociation;
      expect(assoc).toBeDefined();
      expect(assoc.Properties.TransitGatewayAttachmentId.Ref).toBe('HubTgwAttachment');
      expect(assoc.Properties.TransitGatewayRouteTableId.Ref).toBe('HubTgwRouteTable');
    });

    test('Spoke route table should be associated with both Spoke attachments', () => {
      const spoke1Assoc = template.Resources.Spoke1TgwRouteTableAssociation;
      const spoke2Assoc = template.Resources.Spoke2TgwRouteTableAssociation;

      expect(spoke1Assoc.Properties.TransitGatewayRouteTableId.Ref).toBe('SpokeTgwRouteTable');
      expect(spoke2Assoc.Properties.TransitGatewayRouteTableId.Ref).toBe('SpokeTgwRouteTable');
    });

    test('Hub route table should have propagations from both spokes', () => {
      const prop1 = template.Resources.HubTgwRouteTablePropagationSpoke1;
      const prop2 = template.Resources.HubTgwRouteTablePropagationSpoke2;

      expect(prop1).toBeDefined();
      expect(prop1.Properties.TransitGatewayRouteTableId.Ref).toBe('HubTgwRouteTable');
      expect(prop1.Properties.TransitGatewayAttachmentId.Ref).toBe('Spoke1TgwAttachment');

      expect(prop2).toBeDefined();
      expect(prop2.Properties.TransitGatewayAttachmentId.Ref).toBe('Spoke2TgwAttachment');
    });

    test('Spoke route table should only have propagation from Hub (no spoke-to-spoke)', () => {
      const prop = template.Resources.SpokeTgwRouteTablePropagationHub;
      expect(prop).toBeDefined();
      expect(prop.Properties.TransitGatewayRouteTableId.Ref).toBe('SpokeTgwRouteTable');
      expect(prop.Properties.TransitGatewayAttachmentId.Ref).toBe('HubTgwAttachment');
    });
  });

  describe('VPC Route Tables', () => {
    test('should have Hub public route table', () => {
      expect(template.Resources.HubPublicRouteTable).toBeDefined();
      expect(template.Resources.HubPublicRoute).toBeDefined();
    });

    test('Hub public route should route to Internet Gateway', () => {
      const route = template.Resources.HubPublicRoute;
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId.Ref).toBe('HubInternetGateway');
    });

    test('should have route from Hub to Transit Gateway for spoke networks', () => {
      const route = template.Resources.HubRouteToSpokes;
      expect(route).toBeDefined();
      expect(route.Properties.DestinationCidrBlock).toBe('10.0.0.0/8');
      expect(route.Properties.TransitGatewayId.Ref).toBe('TransitGateway');
    });

    test('should have 3 private route tables for Spoke1', () => {
      expect(template.Resources.Spoke1PrivateRouteTable1).toBeDefined();
      expect(template.Resources.Spoke1PrivateRouteTable2).toBeDefined();
      expect(template.Resources.Spoke1PrivateRouteTable3).toBeDefined();
    });

    test('should have 3 private route tables for Spoke2', () => {
      expect(template.Resources.Spoke2PrivateRouteTable1).toBeDefined();
      expect(template.Resources.Spoke2PrivateRouteTable2).toBeDefined();
      expect(template.Resources.Spoke2PrivateRouteTable3).toBeDefined();
    });

    test('Spoke route tables should route default traffic to Transit Gateway', () => {
      const route1 = template.Resources.Spoke1RouteToTgw1;
      expect(route1.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route1.Properties.TransitGatewayId.Ref).toBe('TransitGateway');

      const route2 = template.Resources.Spoke2RouteToTgw1;
      expect(route2.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route2.Properties.TransitGatewayId.Ref).toBe('TransitGateway');
    });

    test('Spoke routes should depend on TGW attachments', () => {
      expect(template.Resources.Spoke1RouteToTgw1.DependsOn).toBe('Spoke1TgwAttachment');
      expect(template.Resources.Spoke2RouteToTgw1.DependsOn).toBe('Spoke2TgwAttachment');
    });
  });

  describe('Security Groups', () => {
    test('should have HTTPS security group', () => {
      expect(template.Resources.HttpsSecurityGroup).toBeDefined();
      expect(template.Resources.HttpsSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('HTTPS security group should allow port 443 from all VPCs', () => {
      const sg = template.Resources.HttpsSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress[0];
      expect(ingress.FromPort).toBe(443);
      expect(ingress.ToPort).toBe(443);
      expect(ingress.CidrIp).toBe('10.0.0.0/8');
    });

    test('should have SSH from Hub security group', () => {
      expect(template.Resources.SshFromHubSecurityGroup).toBeDefined();
    });

    test('SSH security group should only allow from Hub VPC CIDR', () => {
      const sg = template.Resources.SshFromHubSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress[0];
      expect(ingress.FromPort).toBe(22);
      expect(ingress.ToPort).toBe(22);
      expect(ingress.CidrIp.Ref).toBe('HubVpcCidr');
    });

    test('should have security groups for Spoke VPCs', () => {
      expect(template.Resources.Spoke1HttpsSecurityGroup).toBeDefined();
      expect(template.Resources.Spoke1SshSecurityGroup).toBeDefined();
      expect(template.Resources.Spoke2HttpsSecurityGroup).toBeDefined();
      expect(template.Resources.Spoke2SshSecurityGroup).toBeDefined();
    });

    test('Spoke SSH security groups should only allow from Hub VPC', () => {
      const spoke1Ssh = template.Resources.Spoke1SshSecurityGroup;
      const spoke2Ssh = template.Resources.Spoke2SshSecurityGroup;

      expect(spoke1Ssh.Properties.SecurityGroupIngress[0].CidrIp.Ref).toBe('HubVpcCidr');
      expect(spoke2Ssh.Properties.SecurityGroupIngress[0].CidrIp.Ref).toBe('HubVpcCidr');
    });

    test('Security groups should include environmentSuffix in naming', () => {
      const sg = template.Resources.HttpsSecurityGroup;
      const nameTag = sg.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('VPC Endpoints', () => {
    test('should have VPC endpoint security groups for all VPCs', () => {
      expect(template.Resources.HubVpcEndpointSecurityGroup).toBeDefined();
      expect(template.Resources.Spoke1VpcEndpointSecurityGroup).toBeDefined();
      expect(template.Resources.Spoke2VpcEndpointSecurityGroup).toBeDefined();
    });

    test('should have SSM endpoints in all VPCs', () => {
      expect(template.Resources.HubSsmEndpoint).toBeDefined();
      expect(template.Resources.Spoke1SsmEndpoint).toBeDefined();
      expect(template.Resources.Spoke2SsmEndpoint).toBeDefined();
    });

    test('should have SSM Messages endpoints in all VPCs', () => {
      expect(template.Resources.HubSsmMessagesEndpoint).toBeDefined();
      expect(template.Resources.Spoke1SsmMessagesEndpoint).toBeDefined();
      expect(template.Resources.Spoke2SsmMessagesEndpoint).toBeDefined();
    });

    test('should have EC2 Messages endpoints in all VPCs', () => {
      expect(template.Resources.HubEc2MessagesEndpoint).toBeDefined();
      expect(template.Resources.Spoke1Ec2MessagesEndpoint).toBeDefined();
      expect(template.Resources.Spoke2Ec2MessagesEndpoint).toBeDefined();
    });

    test('VPC endpoints should be Interface type', () => {
      expect(template.Resources.HubSsmEndpoint.Properties.VpcEndpointType).toBe('Interface');
      expect(template.Resources.Spoke1SsmEndpoint.Properties.VpcEndpointType).toBe('Interface');
    });

    test('VPC endpoints should have PrivateDnsEnabled', () => {
      expect(template.Resources.HubSsmEndpoint.Properties.PrivateDnsEnabled).toBe(true);
      expect(template.Resources.Spoke1SsmEndpoint.Properties.PrivateDnsEnabled).toBe(true);
      expect(template.Resources.Spoke2SsmEndpoint.Properties.PrivateDnsEnabled).toBe(true);
    });

    test('VPC endpoints should have correct deletion policies', () => {
      expect(template.Resources.HubSsmEndpoint.DeletionPolicy).toBe('Delete');
      expect(template.Resources.Spoke1SsmEndpoint.DeletionPolicy).toBe('Delete');
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have S3 bucket for flow logs', () => {
      expect(template.Resources.FlowLogsBucket).toBeDefined();
      expect(template.Resources.FlowLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('Flow logs bucket should include environmentSuffix and account ID', () => {
      const bucket = template.Resources.FlowLogsBucket;
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${AWS::AccountId}');
    });

    test('Flow logs bucket should have encryption enabled', () => {
      const bucket = template.Resources.FlowLogsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('Flow logs bucket should block public access', () => {
      const bucket = template.Resources.FlowLogsBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have bucket policy for flow logs', () => {
      expect(template.Resources.FlowLogsBucketPolicy).toBeDefined();
      expect(template.Resources.FlowLogsBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('should have flow logs for all VPCs', () => {
      expect(template.Resources.HubVpcFlowLog).toBeDefined();
      expect(template.Resources.Spoke1VpcFlowLog).toBeDefined();
      expect(template.Resources.Spoke2VpcFlowLog).toBeDefined();
    });

    test('Flow logs should capture all traffic', () => {
      expect(template.Resources.HubVpcFlowLog.Properties.TrafficType).toBe('ALL');
      expect(template.Resources.Spoke1VpcFlowLog.Properties.TrafficType).toBe('ALL');
      expect(template.Resources.Spoke2VpcFlowLog.Properties.TrafficType).toBe('ALL');
    });

    test('Flow logs should use S3 destination', () => {
      expect(template.Resources.HubVpcFlowLog.Properties.LogDestinationType).toBe('s3');
      expect(template.Resources.Spoke1VpcFlowLog.Properties.LogDestinationType).toBe('s3');
      expect(template.Resources.Spoke2VpcFlowLog.Properties.LogDestinationType).toBe('s3');
    });

    test('Flow logs should use Parquet format', () => {
      const flowLog = template.Resources.HubVpcFlowLog;
      expect(flowLog.Properties.DestinationOptions.FileFormat).toBe('parquet');
    });

    test('Flow logs should have correct deletion policies', () => {
      expect(template.Resources.HubVpcFlowLog.DeletionPolicy).toBe('Delete');
      expect(template.Resources.Spoke1VpcFlowLog.DeletionPolicy).toBe('Delete');
      expect(template.Resources.Spoke2VpcFlowLog.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Outputs', () => {
    test('should have all VPC ID outputs', () => {
      expect(template.Outputs.HubVpcId).toBeDefined();
      expect(template.Outputs.Spoke1VpcId).toBeDefined();
      expect(template.Outputs.Spoke2VpcId).toBeDefined();
    });

    test('should have all subnet ID outputs', () => {
      expect(template.Outputs.HubPublicSubnet1Id).toBeDefined();
      expect(template.Outputs.HubPublicSubnet2Id).toBeDefined();
      expect(template.Outputs.HubPublicSubnet3Id).toBeDefined();
      expect(template.Outputs.Spoke1PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.Spoke2PrivateSubnet1Id).toBeDefined();
    });

    test('should have Transit Gateway outputs', () => {
      expect(template.Outputs.TransitGatewayId).toBeDefined();
      expect(template.Outputs.HubTgwRouteTableId).toBeDefined();
      expect(template.Outputs.SpokeTgwRouteTableId).toBeDefined();
    });

    test('should have route table outputs', () => {
      expect(template.Outputs.HubPublicRouteTableId).toBeDefined();
      expect(template.Outputs.Spoke1PrivateRouteTable1Id).toBeDefined();
      expect(template.Outputs.Spoke2PrivateRouteTable1Id).toBeDefined();
    });

    test('should have security group outputs', () => {
      expect(template.Outputs.HttpsSecurityGroupId).toBeDefined();
      expect(template.Outputs.SshFromHubSecurityGroupId).toBeDefined();
    });

    test('should have Flow Logs bucket output', () => {
      expect(template.Outputs.FlowLogsBucketName).toBeDefined();
    });

    test('should have NAT Gateway outputs', () => {
      expect(template.Outputs.HubNatGateway1Id).toBeDefined();
      expect(template.Outputs.HubNatGateway2Id).toBeDefined();
      expect(template.Outputs.HubNatGateway3Id).toBeDefined();
    });

    test('should have StackName and EnvironmentSuffix outputs', () => {
      expect(template.Outputs.StackName).toBeDefined();
      expect(template.Outputs.EnvironmentSuffix).toBeDefined();
    });

    test('all outputs should have Export names', () => {
      Object.keys(template.Outputs).forEach((outputKey) => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
        expect(template.Outputs[outputKey].Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Deletion Policies', () => {
    test('all major resources should have Delete policies', () => {
      const resourcesWithDeletionPolicy = [
        'HubVpc', 'Spoke1Vpc', 'Spoke2Vpc',
        'HubInternetGateway',
        'HubPublicSubnet1', 'HubPublicSubnet2', 'HubPublicSubnet3',
        'Spoke1PrivateSubnet1', 'Spoke2PrivateSubnet1',
        'HubNatGateway1', 'HubNatGateway2', 'HubNatGateway3',
        'HubNatGateway1Eip', 'HubNatGateway2Eip', 'HubNatGateway3Eip',
        'TransitGateway',
        'HubTgwAttachment', 'Spoke1TgwAttachment', 'Spoke2TgwAttachment',
        'FlowLogsBucket',
        'HubVpcFlowLog', 'Spoke1VpcFlowLog', 'Spoke2VpcFlowLog'
      ];

      resourcesWithDeletionPolicy.forEach((resourceName) => {
        expect(template.Resources[resourceName].DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('Resource Naming with EnvironmentSuffix', () => {
    test('all named resources should include EnvironmentSuffix', () => {
      const resourcesToCheck = [
        'HubVpc', 'Spoke1Vpc', 'Spoke2Vpc',
        'HubInternetGateway',
        'HubPublicSubnet1',
        'HubNatGateway1',
        'TransitGateway',
        'HttpsSecurityGroup',
        'FlowLogsBucket'
      ];

      resourcesToCheck.forEach((resourceName) => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags || [];
        const nameTag = tags.find((t: any) => t.Key === 'Name');

        if (nameTag) {
          expect(nameTag.Value['Fn::Sub'] || nameTag.Value).toContain('EnvironmentSuffix');
        } else if (resource.Properties.BucketName) {
          expect(resource.Properties.BucketName['Fn::Sub']).toContain('EnvironmentSuffix');
        } else if (resource.Properties.GroupName) {
          expect(resource.Properties.GroupName['Fn::Sub']).toContain('EnvironmentSuffix');
        }
      });
    });
  });

  describe('Tagging Compliance', () => {
    test('all VPCs should have required tags', () => {
      const requiredTags = ['Name', 'Environment', 'CostCenter', 'DataClassification'];
      const vpcs = ['HubVpc', 'Spoke1Vpc', 'Spoke2Vpc'];

      vpcs.forEach((vpcName) => {
        const vpc = template.Resources[vpcName];
        const tags = vpc.Properties.Tags;

        requiredTags.forEach((tagKey) => {
          expect(tags.find((t: any) => t.Key === tagKey)).toBeDefined();
        });
      });
    });
  });
});
