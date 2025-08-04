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

    test('should define all required parameters', () => {
      expect(Parameters.ProjectName).toBeDefined();
      expect(Parameters.SshCidrBlock).toBeDefined();
      expect(Parameters.InstanceType).toBeDefined();
      // MODIFIED: Added check for the new AMI parameter
      expect(Parameters.LatestAmiId).toBeDefined();
    });

    test('ProjectName parameter should be correctly configured', () => {
      const param = Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('MyWebApp');
      expect(param.Description).toBe('Prefix for resource naming.');
    });

    test('SshCidrBlock parameter should be correctly configured', () => {
      const param = Parameters.SshCidrBlock;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('203.0.113.0/24');
      expect(param.Description).toBe('CIDR block for SSH access.');
    });

    test('InstanceType parameter should be correctly configured', () => {
      const param = Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.micro');
      expect(param.Description).toBe('EC2 instance type.');
    });

    // ADDED: New test for the LatestAmiId parameter
    test('LatestAmiId parameter should be correctly configured', () => {
      const param = Parameters.LatestAmiId;
      expect(param.Type).toBe(
        'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
      );
      expect(param.Default).toBe(
        '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
      );
      expect(param.Description).toBe(
        'AMI ID for the EC2 instances. Fetches the latest Amazon Linux 2 AMI by default.'
      );
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

  // Test suite for the Compute resources
  describe('Compute Stratum', () => {
    const { Resources } = template;
    const instances = [
      Resources.PublicEC2Instance,
      Resources.PrivateEC2InstanceA,
      Resources.PrivateEC2InstanceB,
    ];

    test('should define three EC2 instances', () => {
      expect(instances.length).toBe(3);
      instances.forEach(inst => expect(inst).toBeDefined());
    });

    // REMOVED: This test is no longer valid as LatestAmiId is not a resource.
    // test('AMI should be dynamically retrieved from SSM Parameter Store', () => { ... });

    test('All EC2 Instances should use the correct AMI, InstanceType, and Security Group', () => {
      instances.forEach(instance => {
        expect(instance.Type).toBe('AWS::EC2::Instance');
        expect(instance.Properties.InstanceType).toEqual({
          Ref: 'InstanceType',
        });
        expect(instance.Properties.ImageId).toEqual({ Ref: 'LatestAmiId' });
        // MODIFIED: Updated to check for the simpler { "Ref": "..." }
        expect(instance.Properties.SecurityGroupIds).toEqual([
          { Ref: 'EC2SecurityGroup' },
        ]);
      });
    });

    test('Each EC2 instance should be in the correct subnet', () => {
      expect(Resources.PublicEC2Instance.Properties.SubnetId).toEqual({
        Ref: 'PublicSubnet',
      });
      expect(Resources.PrivateEC2InstanceA.Properties.SubnetId).toEqual({
        Ref: 'PrivateSubnetA',
      });
      expect(Resources.PrivateEC2InstanceB.Properties.SubnetId).toEqual({
        Ref: 'PrivateSubnetB',
      });
    });
  });

  // Test suite for Security and Monitoring configurations
  describe('Security and Monitoring', () => {
    const { Resources } = template;

    describe('EC2 Security Group', () => {
      const sg = Resources.EC2SecurityGroup;

      test('Security Group should be correctly defined', () => {
        expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
        expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
        // MODIFIED: The self-referencing rule was moved, so only 1 rule remains.
        expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);
      });

      test('should allow SSH from the specified CIDR block', () => {
        const sshRule = sg.Properties.SecurityGroupIngress[0];
        expect(sshRule.IpProtocol).toBe('tcp');
        expect(sshRule.FromPort).toBe(22);
        expect(sshRule.ToPort).toBe(22);
        expect(sshRule.CidrIp).toEqual({ Ref: 'SshCidrBlock' });
      });

      // REMOVED: This test is replaced by a new one for the separate ingress resource.
      // test('should allow all internal traffic from within the same security group', () => { ... });
    });

    // ADDED: New test suite for the separate ingress rule resource
    describe('EC2 Security Group Ingress Rule', () => {
      const ingressRule = Resources.EC2SecurityGroupSelfIngress;

      test('should allow all traffic from within the same security group', () => {
        expect(ingressRule.Type).toBe('AWS::EC2::SecurityGroupIngress');
        expect(ingressRule.Properties.GroupId).toEqual({
          Ref: 'EC2SecurityGroup',
        });
        expect(ingressRule.Properties.IpProtocol).toBe('-1');
        expect(ingressRule.Properties.SourceSecurityGroupId).toEqual({
          Ref: 'EC2SecurityGroup',
        });
      });
    });

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

    test('should define all required outputs', () => {
      expect(Outputs.VPCId).toBeDefined();
      expect(Outputs.PublicInstanceId).toBeDefined();
      expect(Outputs.NATGatewayEIP).toBeDefined();
    });

    test('VPCId output should be correctly configured and exported', () => {
      const output = Outputs.VPCId;
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${ProjectName}-VPCId' });
    });

    test('PublicInstanceId output should be correctly configured and exported', () => {
      const output = Outputs.PublicInstanceId;
      expect(output.Value).toEqual({ Ref: 'PublicEC2Instance' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${ProjectName}-PublicInstanceId',
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
