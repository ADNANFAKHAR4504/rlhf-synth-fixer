import fs from 'fs';
import path from 'path';

// This is the main test suite for the Foundational Networking and Compute Stack
describe('TapStack CloudFormation Template', () => {
  const templatePath = path.join(__dirname, '../lib/TapStack.json');
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  const template = JSON.parse(templateContent);

  // Test suite for the basic structure and metadata of the template
  describe('Template Structure', () => {
    test('should have a valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a compliant description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description).toBe(
        'AWS CloudFormation template to create a foundational, multi-AZ networking and compute environment in us-east-1.'
      );
    });
  });

  // Test suite for the template parameters
  describe('Parameters', () => {
    const { Parameters } = template;

    test('should define required parameters', () => {
      expect(Parameters.ProjectName).toBeDefined();
    });

    test('ProjectName parameter should be correctly configured', () => {
      const param = Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('MyWebApp');
      expect(param.Description).toBe('Prefix for resource naming.');
    });
  });

  // Test suite for the Networking Infrastructure resources
  describe('Networking Infrastructure', () => {
    const { Resources } = template;

    describe('VPC', () => {
      const vpc = Resources.VPC;
      test('VPC should be correctly configured', () => {
        expect(vpc.Type).toBe('AWS::EC2::VPC');
        expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
        expect(vpc.Properties.EnableDnsSupport).toBe(true);
        expect(vpc.Properties.EnableDnsHostnames).toBe(true);
        expect(vpc.Properties.Tags[0].Value).toEqual({
          'Fn::Sub': '${ProjectName}-VPC',
        });
      });
    });

    describe('Subnets', () => {
      test('should create three subnets', () => {
        expect(Resources.PublicSubnet).toBeDefined();
        expect(Resources.PrivateSubnetA).toBeDefined();
        expect(Resources.PrivateSubnetB).toBeDefined();
      });

      test('Public Subnet should be correctly configured', () => {
        const subnet = Resources.PublicSubnet;
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
        expect(subnet.Properties.CidrBlock).toBe('10.0.1.0/24');
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
        // Verify it uses the first AZ
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [0, { 'Fn::GetAZs': '' }],
        });
      });

      test('Private Subnets should be correctly configured across different AZs', () => {
        const privateA = Resources.PrivateSubnetA;
        const privateB = Resources.PrivateSubnetB;
        expect(privateA.Type).toBe('AWS::EC2::Subnet');
        expect(privateA.Properties.CidrBlock).toBe('10.0.2.0/24');
        // Verify it uses the second AZ
        expect(privateA.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [1, { 'Fn::GetAZs': '' }],
        });

        expect(privateB.Type).toBe('AWS::EC2::Subnet');
        expect(privateB.Properties.CidrBlock).toBe('10.0.3.0/24');
        // Verify it uses the third AZ
        expect(privateB.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [2, { 'Fn::GetAZs': '' }],
        });
      });
    });

    describe('Gateways and Routing', () => {
      test('Internet Gateway and attachment should be defined', () => {
        expect(Resources.InternetGateway.Type).toBe(
          'AWS::EC2::InternetGateway'
        );
        expect(Resources.VPCGatewayAttachment.Type).toBe(
          'AWS::EC2::VPCGatewayAttachment'
        );
        expect(Resources.VPCGatewayAttachment.Properties.VpcId).toEqual({
          Ref: 'VPC',
        });
        expect(
          Resources.VPCGatewayAttachment.Properties.InternetGatewayId
        ).toEqual({ Ref: 'InternetGateway' });
      });

      test('NAT Gateway and EIP should be defined in the public subnet', () => {
        expect(Resources.ElasticIP.Type).toBe('AWS::EC2::EIP');
        expect(Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
        expect(Resources.NATGateway.Properties.SubnetId).toEqual({
          Ref: 'PublicSubnet',
        });
        expect(Resources.NATGateway.Properties.AllocationId).toEqual({
          'Fn::GetAtt': ['ElasticIP', 'AllocationId'],
        });
      });

      test('Public Route Table should route to the Internet Gateway', () => {
        expect(Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
        expect(Resources.PublicRoute.Type).toBe('AWS::EC2::Route');
        expect(Resources.PublicRoute.Properties.RouteTableId).toEqual({
          Ref: 'PublicRouteTable',
        });
        expect(Resources.PublicRoute.Properties.DestinationCidrBlock).toBe(
          '0.0.0.0/0'
        );
        expect(Resources.PublicRoute.Properties.GatewayId).toEqual({
          Ref: 'InternetGateway',
        });
        expect(
          Resources.PublicRouteTableAssociation.Properties.SubnetId
        ).toEqual({ Ref: 'PublicSubnet' });
      });

      test('Private Route Table should route to the NAT Gateway', () => {
        expect(Resources.PrivateRouteTable.Type).toBe('AWS::EC2::RouteTable');
        expect(Resources.PrivateRoute.Type).toBe('AWS::EC2::Route');
        expect(Resources.PrivateRoute.Properties.RouteTableId).toEqual({
          Ref: 'PrivateRouteTable',
        });
        expect(Resources.PrivateRoute.Properties.DestinationCidrBlock).toBe(
          '0.0.0.0/0'
        );
        expect(Resources.PrivateRoute.Properties.NatGatewayId).toEqual({
          Ref: 'NATGateway',
        });
        // Verify association for both private subnets
        expect(
          Resources.PrivateSubnetARouteTableAssociation.Properties.RouteTableId
        ).toEqual({ Ref: 'PrivateRouteTable' });
        expect(
          Resources.PrivateSubnetBRouteTableAssociation.Properties.RouteTableId
        ).toEqual({ Ref: 'PrivateRouteTable' });
      });
    });
  });

  // NOTE: EC2 instances removed for LocalStack compatibility
  // LocalStack Community edition has limited EC2 instance support and parameter handling issues

  // Test suite for Security and Monitoring configurations
  describe('Security and Monitoring', () => {
    const { Resources } = template;

    // NOTE: EC2 Security Group removed for LocalStack compatibility

    describe('VPC Flow Logs', () => {
      test('CloudWatch Log Group for Flow Logs should be correctly configured', () => {
        const logGroup = Resources.VPCFlowLogsCloudWatchLogsLogGroup;
        expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
        expect(logGroup.Properties.RetentionInDays).toBe(7);
      });

      test('IAM Role for Flow Logs should have the correct trust policy and permissions', () => {
        const role = Resources.VPCFlowLogsCloudWatchLogsRole;
        const assumePolicy =
          role.Properties.AssumeRolePolicyDocument.Statement[0];
        expect(role.Type).toBe('AWS::IAM::Role');
        expect(assumePolicy.Principal.Service).toContain(
          'vpc-flow-logs.amazonaws.com'
        );
        expect(assumePolicy.Effect).toBe('Allow');
        expect(assumePolicy.Action).toContain('sts:AssumeRole');
      });

      test('VPC Flow Log resource should be enabled for all traffic', () => {
        const flowLog = Resources.VPCFlowLogs;
        expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
        expect(flowLog.Properties.ResourceId).toEqual({ Ref: 'VPC' });
        expect(flowLog.Properties.ResourceType).toBe('VPC');
        expect(flowLog.Properties.TrafficType).toBe('ALL');
        expect(flowLog.Properties.LogGroupName).toEqual({
          Ref: 'VPCFlowLogsCloudWatchLogsLogGroup',
        });
      });
    });
  });

  // Test suite to verify all required outputs are present and correctly configured
  describe('Outputs', () => {
    const { Outputs } = template;

    test('should define networking outputs', () => {
      expect(Outputs.VPCId).toBeDefined();
      expect(Outputs.PublicSubnetId).toBeDefined();
      expect(Outputs.PrivateSubnetAId).toBeDefined();
      expect(Outputs.PrivateSubnetBId).toBeDefined();
      expect(Outputs.NATGatewayEIP).toBeDefined();
    });

    test('VPCId output should be correctly configured and exported', () => {
      const output = Outputs.VPCId;
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${ProjectName}-VPCId' });
    });

    test('Subnet outputs should be correctly configured and exported', () => {
      const publicSubnet = Outputs.PublicSubnetId;
      expect(publicSubnet.Value).toEqual({ Ref: 'PublicSubnet' });
      expect(publicSubnet.Export.Name).toEqual({
        'Fn::Sub': '${ProjectName}-PublicSubnetId',
      });

      const privateA = Outputs.PrivateSubnetAId;
      expect(privateA.Value).toEqual({ Ref: 'PrivateSubnetA' });
      expect(privateA.Export.Name).toEqual({
        'Fn::Sub': '${ProjectName}-PrivateSubnetAId',
      });

      const privateB = Outputs.PrivateSubnetBId;
      expect(privateB.Value).toEqual({ Ref: 'PrivateSubnetB' });
      expect(privateB.Export.Name).toEqual({
        'Fn::Sub': '${ProjectName}-PrivateSubnetBId',
      });
    });

    test('NATGatewayEIP output should be correctly configured and exported', () => {
      const output = Outputs.NATGatewayEIP;
      expect(output.Value).toEqual({ Ref: 'ElasticIP' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${ProjectName}-NATGatewayEIP',
      });
    });
  });
});
