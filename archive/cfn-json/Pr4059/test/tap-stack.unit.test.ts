import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Comprehensive Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ============================================================================
  // A. Template Structure & Validation
  // ============================================================================
  describe('Template Structure & Validation', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(
        template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups
      ).toBeDefined();
    });

    test('should have all required top-level sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Metadata).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have correct output count', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(12);
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(template).not.toBeNull();
    });

    test('should have CloudFormation Interface with 3 parameter groups', () => {
      const paramGroups =
        template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      expect(paramGroups).toHaveLength(3);
      expect(paramGroups[0].Label.default).toBe('Network Configuration');
      expect(paramGroups[1].Label.default).toBe('Instance Configuration');
      expect(paramGroups[2].Label.default).toBe('Notification Configuration');
    });

    test('should have RegionAMIMap mapping', () => {
      expect(template.Mappings.RegionAMIMap).toBeDefined();
      expect(Object.keys(template.Mappings.RegionAMIMap).length).toBeGreaterThan(
        0
      );
    });
  });

  // ============================================================================
  // B. Parameters Deep Validation
  // ============================================================================
  describe('Parameters Deep Validation', () => {
    test('should have all required parameters', () => {
      const requiredParams = [
        'VPCCidr',
        'PublicSubnet1Cidr',
        'PublicSubnet2Cidr',
        'PrivateSubnet1Cidr',
        'PrivateSubnet2Cidr',
        'InstanceType',
        'EmailAddress',
        'EnableDetailedMonitoring',
        'EnvironmentTag',
        'EnvironmentSuffix',
      ];

      requiredParams.forEach((param) => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    describe('VPCCidr Parameter', () => {
      test('should have correct type and default', () => {
        const param = template.Parameters.VPCCidr;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('10.0.0.0/16');
        expect(param.Description).toContain('CIDR');
      });

      test('should have valid CIDR pattern constraint', () => {
        const param = template.Parameters.VPCCidr;
        expect(param.AllowedPattern).toBeDefined();
        expect(param.AllowedPattern).toContain('/');
      });
    });

    describe('Subnet CIDR Parameters', () => {
      test('PublicSubnet1Cidr should have correct configuration', () => {
        const param = template.Parameters.PublicSubnet1Cidr;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('10.0.1.0/24');
        expect(param.Description).toContain('public subnet 1');
      });

      test('PublicSubnet2Cidr should have correct configuration', () => {
        const param = template.Parameters.PublicSubnet2Cidr;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('10.0.2.0/24');
        expect(param.Description).toContain('public subnet 2');
      });

      test('PrivateSubnet1Cidr should have correct configuration', () => {
        const param = template.Parameters.PrivateSubnet1Cidr;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('10.0.10.0/24');
        expect(param.Description).toContain('private subnet 1');
      });

      test('PrivateSubnet2Cidr should have correct configuration', () => {
        const param = template.Parameters.PrivateSubnet2Cidr;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('10.0.20.0/24');
        expect(param.Description).toContain('private subnet 2');
      });
    });

    describe('InstanceType Parameter', () => {
      test('should have correct type and allowed values', () => {
        const param = template.Parameters.InstanceType;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('t3.micro');
        expect(param.AllowedValues).toEqual([
          't3.micro',
          't3.small',
          't3.medium',
          't3.large',
        ]);
      });
    });

    describe('EmailAddress Parameter', () => {
      test('should have email pattern validation', () => {
        const param = template.Parameters.EmailAddress;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('default@email.com');
        expect(param.AllowedPattern).toContain('@');
        expect(param.Description).toContain('Email');
      });
    });

    describe('EnableDetailedMonitoring Parameter', () => {
      test('should be boolean string with allowed values', () => {
        const param = template.Parameters.EnableDetailedMonitoring;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('true');
        expect(param.AllowedValues).toEqual(['true', 'false']);
      });
    });

    describe('EnvironmentTag Parameter', () => {
      test('should have environment allowed values', () => {
        const param = template.Parameters.EnvironmentTag;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('Production');
        expect(param.AllowedValues).toEqual([
          'Development',
          'Staging',
          'Production',
        ]);
      });
    });

    describe('EnvironmentSuffix Parameter', () => {
      test('should have optional pattern validation', () => {
        const param = template.Parameters.EnvironmentSuffix;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('dev');
        expect(param.AllowedPattern).toBe('^[a-zA-Z0-9-]+$');
        expect(param.Description).toContain('Environment name for tagging');
      });
    });
  });

  // ============================================================================
  // C. VPC & Networking Resources
  // ============================================================================
  describe('VPC & Networking Resources', () => {
    describe('VPC', () => {
      test('should have correct type and properties', () => {
        const vpc = template.Resources.VPC;
        expect(vpc.Type).toBe('AWS::EC2::VPC');
        expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VPCCidr' });
        expect(vpc.Properties.EnableDnsHostnames).toBe(true);
        expect(vpc.Properties.EnableDnsSupport).toBe(true);
      });

      test('should have correct tags', () => {
        const vpc = template.Resources.VPC;
        expect(vpc.Properties.Tags).toBeDefined();
        expect(vpc.Properties.Tags).toHaveLength(2);
        expect(vpc.Properties.Tags[0].Key).toBe('Name');
        expect(vpc.Properties.Tags[1].Key).toBe('Environment');
      });
    });

    describe('InternetGateway', () => {
      test('should have correct type and tags', () => {
        const igw = template.Resources.InternetGateway;
        expect(igw.Type).toBe('AWS::EC2::InternetGateway');
        expect(igw.Properties.Tags).toBeDefined();
        expect(igw.Properties.Tags).toHaveLength(2);
      });
    });

    describe('AttachGateway', () => {
      test('should attach IGW to VPC', () => {
        const attach = template.Resources.AttachGateway;
        expect(attach.Type).toBe('AWS::EC2::VPCGatewayAttachment');
        expect(attach.Properties.VpcId).toEqual({ Ref: 'VPC' });
        expect(attach.Properties.InternetGatewayId).toEqual({
          Ref: 'InternetGateway',
        });
      });
    });

    describe('PublicSubnet1', () => {
      test('should have correct configuration', () => {
        const subnet = template.Resources.PublicSubnet1;
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
        expect(subnet.Properties.CidrBlock).toEqual({
          Ref: 'PublicSubnet1Cidr',
        });
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      });

      test('should be in AZ 0', () => {
        const subnet = template.Resources.PublicSubnet1;
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': ['0', { 'Fn::GetAZs': '' }],
        });
      });

      test('should have correct tags', () => {
        const subnet = template.Resources.PublicSubnet1;
        expect(subnet.Properties.Tags).toHaveLength(3);
        const typeTag = subnet.Properties.Tags.find(
          (t: any) => t.Key === 'Type'
        );
        expect(typeTag.Value).toBe('Public');
      });
    });

    describe('PublicSubnet2', () => {
      test('should have correct configuration', () => {
        const subnet = template.Resources.PublicSubnet2;
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      });

      test('should be in AZ 1', () => {
        const subnet = template.Resources.PublicSubnet2;
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': ['1', { 'Fn::GetAZs': '' }],
        });
      });
    });

    describe('PrivateSubnet1', () => {
      test('should have correct configuration', () => {
        const subnet = template.Resources.PrivateSubnet1;
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
        expect(subnet.Properties.CidrBlock).toEqual({
          Ref: 'PrivateSubnet1Cidr',
        });
        expect(subnet.Properties.MapPublicIpOnLaunch).toBeUndefined();
      });

      test('should be in AZ 0', () => {
        const subnet = template.Resources.PrivateSubnet1;
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': ['0', { 'Fn::GetAZs': '' }],
        });
      });

      test('should have Private type tag', () => {
        const subnet = template.Resources.PrivateSubnet1;
        const typeTag = subnet.Properties.Tags.find(
          (t: any) => t.Key === 'Type'
        );
        expect(typeTag.Value).toBe('Private');
      });
    });

    describe('PrivateSubnet2', () => {
      test('should have correct configuration', () => {
        const subnet = template.Resources.PrivateSubnet2;
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.MapPublicIpOnLaunch).toBeUndefined();
      });

      test('should be in AZ 1', () => {
        const subnet = template.Resources.PrivateSubnet2;
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': ['1', { 'Fn::GetAZs': '' }],
        });
      });
    });

    describe('NAT Gateways', () => {
      test('NATGateway1EIP should depend on AttachGateway', () => {
        const eip = template.Resources.NATGateway1EIP;
        expect(eip.Type).toBe('AWS::EC2::EIP');
        expect(eip.DependsOn).toBe('AttachGateway');
        expect(eip.Properties.Domain).toBe('vpc');
      });

      test('NATGateway2EIP should depend on AttachGateway', () => {
        const eip = template.Resources.NATGateway2EIP;
        expect(eip.Type).toBe('AWS::EC2::EIP');
        expect(eip.DependsOn).toBe('AttachGateway');
        expect(eip.Properties.Domain).toBe('vpc');
      });

      test('NATGateway1 should have correct configuration', () => {
        const nat = template.Resources.NATGateway1;
        expect(nat.Type).toBe('AWS::EC2::NatGateway');
        expect(nat.Properties.AllocationId).toEqual({
          'Fn::GetAtt': ['NATGateway1EIP', 'AllocationId'],
        });
        expect(nat.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      });

      test('NATGateway2 should have correct configuration', () => {
        const nat = template.Resources.NATGateway2;
        expect(nat.Type).toBe('AWS::EC2::NatGateway');
        expect(nat.Properties.AllocationId).toEqual({
          'Fn::GetAtt': ['NATGateway2EIP', 'AllocationId'],
        });
        expect(nat.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
      });

      test('NAT Gateways should have correct tags', () => {
        const nat1 = template.Resources.NATGateway1;
        const nat2 = template.Resources.NATGateway2;
        expect(nat1.Properties.Tags).toHaveLength(2);
        expect(nat2.Properties.Tags).toHaveLength(2);
      });
    });

    describe('Route Tables', () => {
      test('PublicRouteTable should exist with correct properties', () => {
        const rt = template.Resources.PublicRouteTable;
        expect(rt.Type).toBe('AWS::EC2::RouteTable');
        expect(rt.Properties.VpcId).toEqual({ Ref: 'VPC' });
      });

      test('PublicRoute should route to Internet Gateway', () => {
        const route = template.Resources.PublicRoute;
        expect(route.Type).toBe('AWS::EC2::Route');
        expect(route.DependsOn).toBe('AttachGateway');
        expect(route.Properties.RouteTableId).toEqual({
          Ref: 'PublicRouteTable',
        });
        expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
        expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      });

      test('PrivateRouteTable1 should exist with correct properties', () => {
        const rt = template.Resources.PrivateRouteTable1;
        expect(rt.Type).toBe('AWS::EC2::RouteTable');
        expect(rt.Properties.VpcId).toEqual({ Ref: 'VPC' });
      });

      test('PrivateRoute1 should route to NATGateway1', () => {
        const route = template.Resources.PrivateRoute1;
        expect(route.Type).toBe('AWS::EC2::Route');
        expect(route.Properties.RouteTableId).toEqual({
          Ref: 'PrivateRouteTable1',
        });
        expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
        expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway1' });
      });

      test('PrivateRouteTable2 should exist with correct properties', () => {
        const rt = template.Resources.PrivateRouteTable2;
        expect(rt.Type).toBe('AWS::EC2::RouteTable');
        expect(rt.Properties.VpcId).toEqual({ Ref: 'VPC' });
      });

      test('PrivateRoute2 should route to NATGateway2', () => {
        const route = template.Resources.PrivateRoute2;
        expect(route.Type).toBe('AWS::EC2::Route');
        expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway2' });
      });
    });

    describe('Route Table Associations', () => {
      test('PublicSubnet1 should be associated with PublicRouteTable', () => {
        const assoc = template.Resources.PublicSubnet1RouteTableAssociation;
        expect(assoc.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        expect(assoc.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
        expect(assoc.Properties.RouteTableId).toEqual({
          Ref: 'PublicRouteTable',
        });
      });

      test('PublicSubnet2 should be associated with PublicRouteTable', () => {
        const assoc = template.Resources.PublicSubnet2RouteTableAssociation;
        expect(assoc.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
        expect(assoc.Properties.RouteTableId).toEqual({
          Ref: 'PublicRouteTable',
        });
      });

      test('PrivateSubnet1 should be associated with PrivateRouteTable1', () => {
        const assoc = template.Resources.PrivateSubnet1RouteTableAssociation;
        expect(assoc.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
        expect(assoc.Properties.RouteTableId).toEqual({
          Ref: 'PrivateRouteTable1',
        });
      });

      test('PrivateSubnet2 should be associated with PrivateRouteTable2', () => {
        const assoc = template.Resources.PrivateSubnet2RouteTableAssociation;
        expect(assoc.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
        expect(assoc.Properties.RouteTableId).toEqual({
          Ref: 'PrivateRouteTable2',
        });
      });
    });
  });

  // ============================================================================
  // D. Security Resources
  // ============================================================================
  describe('Security Resources', () => {
    describe('PrivateSecurityGroup', () => {
      test('should have correct type and description', () => {
        const sg = template.Resources.PrivateSecurityGroup;
        expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
        expect(sg.Properties.GroupDescription).toBe(
          'Security group for private instances'
        );
        expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
      });

      test('should have correct ingress rules', () => {
        const sg = template.Resources.PrivateSecurityGroup;
        const ingress = sg.Properties.SecurityGroupIngress;
        expect(ingress).toHaveLength(3);

        const sshRule = ingress.find((r: any) => r.FromPort === 22);
        expect(sshRule.ToPort).toBe(22);
        expect(sshRule.IpProtocol).toBe('tcp');
        expect(sshRule.CidrIp).toEqual({ Ref: 'VPCCidr' });

        const httpsRule = ingress.find((r: any) => r.FromPort === 443);
        expect(httpsRule.ToPort).toBe(443);

        const httpRule = ingress.find((r: any) => r.FromPort === 80);
        expect(httpRule.ToPort).toBe(80);
      });

      test('should have correct egress rules', () => {
        const sg = template.Resources.PrivateSecurityGroup;
        const egress = sg.Properties.SecurityGroupEgress;
        expect(egress).toHaveLength(1);
        expect(egress[0].IpProtocol).toBe('-1');
        expect(egress[0].CidrIp).toBe('0.0.0.0/0');
      });

      test('should have correct tags', () => {
        const sg = template.Resources.PrivateSecurityGroup;
        expect(sg.Properties.Tags).toHaveLength(2);
      });
    });

    describe('SNSTopicPolicy', () => {
      test('should have correct type and topics', () => {
        const policy = template.Resources.SNSTopicPolicy;
        expect(policy.Type).toBe('AWS::SNS::TopicPolicy');
        expect(policy.Properties.Topics).toEqual([{ Ref: 'SNSTopic' }]);
      });

      test('should allow CloudWatch and EventBridge to publish', () => {
        const policy = template.Resources.SNSTopicPolicy;
        const statement = policy.Properties.PolicyDocument.Statement[0];
        expect(statement.Effect).toBe('Allow');
        expect(statement.Principal.Service).toEqual([
          'cloudwatch.amazonaws.com',
          'events.amazonaws.com',
        ]);
        expect(statement.Action).toBe('SNS:Publish');
        expect(statement.Resource).toEqual({ Ref: 'SNSTopic' });
      });
    });
  });

  // ============================================================================
  // E. IAM Resources
  // ============================================================================
  describe('IAM Resources', () => {
    describe('EC2InstanceRole', () => {
      test('should have correct type and trust policy', () => {
        const role = template.Resources.EC2InstanceRole;
        expect(role.Type).toBe('AWS::IAM::Role');
        const trustPolicy = role.Properties.AssumeRolePolicyDocument;
        expect(trustPolicy.Version).toBe('2012-10-17');
        expect(trustPolicy.Statement[0].Effect).toBe('Allow');
        expect(trustPolicy.Statement[0].Principal.Service).toBe(
          'ec2.amazonaws.com'
        );
        expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
      });

      test('should have managed policy arns', () => {
        const role = template.Resources.EC2InstanceRole;
        expect(role.Properties.ManagedPolicyArns).toHaveLength(2);
        expect(role.Properties.ManagedPolicyArns).toContain(
          'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
        );
        expect(role.Properties.ManagedPolicyArns).toContain(
          'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
        );
      });

      test('should have EC2MinimalAccess inline policy', () => {
        const role = template.Resources.EC2InstanceRole;
        const policies = role.Properties.Policies;
        expect(policies).toHaveLength(1);
        expect(policies[0].PolicyName).toBe('EC2MinimalAccess');
      });

      test('EC2MinimalAccess should have correct EC2 permissions', () => {
        const role = template.Resources.EC2InstanceRole;
        const policy = role.Properties.Policies[0].PolicyDocument;
        const ec2Statement = policy.Statement[0];
        expect(ec2Statement.Effect).toBe('Allow');
        expect(ec2Statement.Action).toContain('ec2:DescribeInstances');
        expect(ec2Statement.Action).toContain('ec2:DescribeImages');
        expect(ec2Statement.Action).toContain('ec2:DescribeTags');
        expect(ec2Statement.Action).toContain('ec2:DescribeVolumes');
        expect(ec2Statement.Resource).toBe('*');
      });

      test('EC2MinimalAccess should have correct CloudWatch permissions', () => {
        const role = template.Resources.EC2InstanceRole;
        const policy = role.Properties.Policies[0].PolicyDocument;
        const cwStatement = policy.Statement[1];
        expect(cwStatement.Action).toContain('cloudwatch:PutMetricData');
        expect(cwStatement.Action).toContain('cloudwatch:GetMetricStatistics');
        expect(cwStatement.Action).toContain('cloudwatch:ListMetrics');
      });

      test('EC2MinimalAccess should have scoped CloudWatch Logs permissions', () => {
        const role = template.Resources.EC2InstanceRole;
        const policy = role.Properties.Policies[0].PolicyDocument;
        const logsStatement = policy.Statement[2];
        expect(logsStatement.Action).toContain('logs:CreateLogGroup');
        expect(logsStatement.Action).toContain('logs:CreateLogStream');
        expect(logsStatement.Action).toContain('logs:PutLogEvents');
        expect(logsStatement.Resource).toEqual({
          'Fn::Sub':
            'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*',
        });
      });

      test('should have correct tags', () => {
        const role = template.Resources.EC2InstanceRole;
        expect(role.Properties.Tags).toHaveLength(2);
      });
    });

    describe('EC2InstanceProfile', () => {
      test('should reference EC2InstanceRole', () => {
        const profile = template.Resources.EC2InstanceProfile;
        expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
        expect(profile.Properties.Roles).toEqual([{ Ref: 'EC2InstanceRole' }]);
      });
    });
  });

  // ============================================================================
  // F. Compute Resources
  // ============================================================================
  describe('Compute Resources', () => {
    describe('LaunchTemplate', () => {
      test('should have correct type and name', () => {
        const lt = template.Resources.LaunchTemplate;
        expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
        expect(lt.Properties.LaunchTemplateName).toEqual({
          'Fn::Sub': '${EnvironmentSuffix}-LaunchTemplate',
        });
      });

      test('should use region-specific AMI from mapping', () => {
        const lt = template.Resources.LaunchTemplate;
        const imageId = lt.Properties.LaunchTemplateData.ImageId;
        expect(imageId).toEqual({
          'Fn::FindInMap': ['RegionAMIMap', { Ref: 'AWS::Region' }, 'AmiId'],
        });
      });

      test('should reference instance type parameter', () => {
        const lt = template.Resources.LaunchTemplate;
        expect(lt.Properties.LaunchTemplateData.InstanceType).toEqual({
          Ref: 'InstanceType',
        });
      });

      test('should attach instance profile', () => {
        const lt = template.Resources.LaunchTemplate;
        expect(lt.Properties.LaunchTemplateData.IamInstanceProfile).toEqual({
          Arn: { 'Fn::GetAtt': ['EC2InstanceProfile', 'Arn'] },
        });
      });

      test('should attach security group', () => {
        const lt = template.Resources.LaunchTemplate;
        expect(lt.Properties.LaunchTemplateData.SecurityGroupIds).toEqual([
          { Ref: 'PrivateSecurityGroup' },
        ]);
      });

      test('should have encrypted EBS volume', () => {
        const lt = template.Resources.LaunchTemplate;
        const blockDevices =
          lt.Properties.LaunchTemplateData.BlockDeviceMappings;
        expect(blockDevices).toHaveLength(1);
        expect(blockDevices[0].DeviceName).toBe('/dev/xvda');
        expect(blockDevices[0].Ebs.VolumeSize).toBe(20);
        expect(blockDevices[0].Ebs.VolumeType).toBe('gp3');
        expect(blockDevices[0].Ebs.Encrypted).toBe(true);
        expect(blockDevices[0].Ebs.DeleteOnTermination).toBe(true);
      });

      test('should have monitoring enabled based on parameter', () => {
        const lt = template.Resources.LaunchTemplate;
        expect(lt.Properties.LaunchTemplateData.Monitoring.Enabled).toEqual({
          Ref: 'EnableDetailedMonitoring',
        });
      });

      test('should enforce IMDSv2', () => {
        const lt = template.Resources.LaunchTemplate;
        const metadata = lt.Properties.LaunchTemplateData.MetadataOptions;
        expect(metadata.HttpTokens).toBe('required');
        expect(metadata.HttpPutResponseHopLimit).toBe(1);
      });

      test('should have user data', () => {
        const lt = template.Resources.LaunchTemplate;
        const userData = lt.Properties.LaunchTemplateData.UserData;
        expect(userData).toEqual({
          'Fn::Base64':
            "#!/bin/bash\nyum update -y\nyum install -y amazon-cloudwatch-agent\necho 'Instance launched successfully' > /var/log/startup.log",
        });
      });

      test('should have tag specifications for instance and volume', () => {
        const lt = template.Resources.LaunchTemplate;
        const tagSpecs = lt.Properties.LaunchTemplateData.TagSpecifications;
        expect(tagSpecs).toHaveLength(2);

        const instanceTags = tagSpecs.find(
          (ts: any) => ts.ResourceType === 'instance'
        );
        expect(instanceTags).toBeDefined();
        expect(instanceTags.Tags).toHaveLength(2);

        const volumeTags = tagSpecs.find(
          (ts: any) => ts.ResourceType === 'volume'
        );
        expect(volumeTags).toBeDefined();
        expect(volumeTags.Tags).toHaveLength(2);
      });
    });

    describe('PrivateInstance1', () => {
      test('should have correct type and launch template', () => {
        const instance = template.Resources.PrivateInstance1;
        expect(instance.Type).toBe('AWS::EC2::Instance');
        expect(instance.Properties.LaunchTemplate.LaunchTemplateId).toEqual({
          Ref: 'LaunchTemplate',
        });
      });

      test('should use latest launch template version', () => {
        const instance = template.Resources.PrivateInstance1;
        expect(instance.Properties.LaunchTemplate.Version).toEqual({
          'Fn::GetAtt': ['LaunchTemplate', 'LatestVersionNumber'],
        });
      });

      test('should be in PrivateSubnet1', () => {
        const instance = template.Resources.PrivateInstance1;
        expect(instance.Properties.SubnetId).toEqual({
          Ref: 'PrivateSubnet1',
        });
      });

      test('should have correct tags', () => {
        const instance = template.Resources.PrivateInstance1;
        expect(instance.Properties.Tags).toHaveLength(2);
        const nameTag = instance.Properties.Tags.find(
          (t: any) => t.Key === 'Name'
        );
        expect(nameTag.Value).toEqual({
          'Fn::Sub': '${EnvironmentSuffix}-PrivateInstance1',
        });
      });
    });

    describe('PrivateInstance2', () => {
      test('should have correct type and launch template', () => {
        const instance = template.Resources.PrivateInstance2;
        expect(instance.Type).toBe('AWS::EC2::Instance');
        expect(instance.Properties.LaunchTemplate.LaunchTemplateId).toEqual({
          Ref: 'LaunchTemplate',
        });
      });

      test('should use latest launch template version', () => {
        const instance = template.Resources.PrivateInstance2;
        expect(instance.Properties.LaunchTemplate.Version).toEqual({
          'Fn::GetAtt': ['LaunchTemplate', 'LatestVersionNumber'],
        });
      });

      test('should be in PrivateSubnet2', () => {
        const instance = template.Resources.PrivateInstance2;
        expect(instance.Properties.SubnetId).toEqual({
          Ref: 'PrivateSubnet2',
        });
      });
    });
  });

  // ============================================================================
  // G. Monitoring & Notification Resources
  // ============================================================================
  describe('Monitoring & Notification Resources', () => {
    describe('SNSTopic', () => {
      test('should have correct type and configuration', () => {
        const topic = template.Resources.SNSTopic;
        expect(topic.Type).toBe('AWS::SNS::Topic');
        expect(topic.Properties.TopicName).toEqual({
          'Fn::Sub': '${EnvironmentSuffix}-Notifications',
        });
        expect(topic.Properties.DisplayName).toBe('Stack Event Notifications');
      });

      test('should have email subscription', () => {
        const topic = template.Resources.SNSTopic;
        expect(topic.Properties.Subscription).toHaveLength(1);
        expect(topic.Properties.Subscription[0].Endpoint).toEqual({
          Ref: 'EmailAddress',
        });
        expect(topic.Properties.Subscription[0].Protocol).toBe('email');
      });

      test('should be encrypted', () => {
        const topic = template.Resources.SNSTopic;
        expect(topic.Properties.KmsMasterKeyId).toBe('alias/aws/sns');
      });

      test('should have correct tags', () => {
        const topic = template.Resources.SNSTopic;
        expect(topic.Properties.Tags).toHaveLength(2);
      });
    });

    describe('CPUAlarmInstance1', () => {
      test('should have correct type and configuration', () => {
        const alarm = template.Resources.CPUAlarmInstance1;
        expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
        expect(alarm.Properties.AlarmName).toEqual({
          'Fn::Sub': '${EnvironmentSuffix}-Instance1-CPUAlarm',
        });
        expect(alarm.Properties.MetricName).toBe('CPUUtilization');
        expect(alarm.Properties.Namespace).toBe('AWS/EC2');
      });

      test('should have correct threshold and evaluation', () => {
        const alarm = template.Resources.CPUAlarmInstance1;
        expect(alarm.Properties.Threshold).toBe(80);
        expect(alarm.Properties.ComparisonOperator).toBe(
          'GreaterThanThreshold'
        );
        expect(alarm.Properties.EvaluationPeriods).toBe(2);
        expect(alarm.Properties.Period).toBe(300);
        expect(alarm.Properties.Statistic).toBe('Average');
      });

      test('should monitor PrivateInstance1', () => {
        const alarm = template.Resources.CPUAlarmInstance1;
        expect(alarm.Properties.Dimensions).toHaveLength(1);
        expect(alarm.Properties.Dimensions[0].Name).toBe('InstanceId');
        expect(alarm.Properties.Dimensions[0].Value).toEqual({
          Ref: 'PrivateInstance1',
        });
      });

      test('should publish to SNS topic', () => {
        const alarm = template.Resources.CPUAlarmInstance1;
        expect(alarm.Properties.AlarmActions).toEqual([{ Ref: 'SNSTopic' }]);
        expect(alarm.Properties.TreatMissingData).toBe('breaching');
      });
    });

    describe('CPUAlarmInstance2', () => {
      test('should have correct configuration', () => {
        const alarm = template.Resources.CPUAlarmInstance2;
        expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
        expect(alarm.Properties.MetricName).toBe('CPUUtilization');
        expect(alarm.Properties.Threshold).toBe(80);
      });

      test('should monitor PrivateInstance2', () => {
        const alarm = template.Resources.CPUAlarmInstance2;
        expect(alarm.Properties.Dimensions[0].Value).toEqual({
          Ref: 'PrivateInstance2',
        });
      });
    });

    describe('StatusCheckAlarmInstance1', () => {
      test('should have correct configuration', () => {
        const alarm = template.Resources.StatusCheckAlarmInstance1;
        expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
        expect(alarm.Properties.MetricName).toBe('StatusCheckFailed');
        expect(alarm.Properties.Statistic).toBe('Maximum');
      });

      test('should have correct threshold', () => {
        const alarm = template.Resources.StatusCheckAlarmInstance1;
        expect(alarm.Properties.Threshold).toBe(1);
        expect(alarm.Properties.ComparisonOperator).toBe(
          'GreaterThanOrEqualToThreshold'
        );
      });

      test('should monitor PrivateInstance1', () => {
        const alarm = template.Resources.StatusCheckAlarmInstance1;
        expect(alarm.Properties.Dimensions[0].Value).toEqual({
          Ref: 'PrivateInstance1',
        });
      });
    });

    describe('StatusCheckAlarmInstance2', () => {
      test('should have correct configuration', () => {
        const alarm = template.Resources.StatusCheckAlarmInstance2;
        expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
        expect(alarm.Properties.MetricName).toBe('StatusCheckFailed');
      });

      test('should monitor PrivateInstance2', () => {
        const alarm = template.Resources.StatusCheckAlarmInstance2;
        expect(alarm.Properties.Dimensions[0].Value).toEqual({
          Ref: 'PrivateInstance2',
        });
      });
    });

    describe('StackEventRule', () => {
      test('should have correct type and configuration', () => {
        const rule = template.Resources.StackEventRule;
        expect(rule.Type).toBe('AWS::Events::Rule');
        expect(rule.Properties.Name).toEqual({
          'Fn::Sub': '${EnvironmentSuffix}-StackEventRule',
        });
        expect(rule.Properties.State).toBe('ENABLED');
      });

      test('should have correct event pattern', () => {
        const rule = template.Resources.StackEventRule;
        const eventPattern = rule.Properties.EventPattern;
        expect(eventPattern.source).toEqual(['aws.cloudformation']);
        expect(eventPattern['detail-type']).toEqual([
          'CloudFormation Stack Status Change',
        ]);
        expect(eventPattern.detail['stack-id']).toEqual([
          { Ref: 'AWS::StackId' },
        ]);
      });

      test('should target SNS topic', () => {
        const rule = template.Resources.StackEventRule;
        expect(rule.Properties.Targets).toHaveLength(1);
        expect(rule.Properties.Targets[0].Arn).toEqual({ Ref: 'SNSTopic' });
        expect(rule.Properties.Targets[0].Id).toBe('SNSTopic');
      });
    });
  });

  // ============================================================================
  // H. Storage & Logging Resources
  // ============================================================================
  describe('Storage & Logging Resources', () => {
    describe('LogGroup', () => {
      test('should have correct type and configuration', () => {
        const logGroup = template.Resources.LogGroup;
        expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
        expect(logGroup.Properties.LogGroupName).toEqual({
          'Fn::Sub': '/aws/ec2/${EnvironmentSuffix}',
        });
        expect(logGroup.Properties.RetentionInDays).toBe(30);
      });
    });

    describe('S3Bucket', () => {
      test('should have correct type and naming', () => {
        const bucket = template.Resources.S3Bucket;
        expect(bucket.Type).toBe('AWS::S3::Bucket');
        expect(bucket.Properties.BucketName).toEqual({
          'Fn::Sub': '${EnvironmentSuffix}-${AWS::AccountId}-data',
        });
      });

      test('should have encryption enabled', () => {
        const bucket = template.Resources.S3Bucket;
        const encryption = bucket.Properties.BucketEncryption;
        expect(
          encryption.ServerSideEncryptionConfiguration
        ).toHaveLength(1);
        expect(
          encryption.ServerSideEncryptionConfiguration[0]
            .ServerSideEncryptionByDefault.SSEAlgorithm
        ).toBe('AES256');
      });

      test('should have versioning enabled', () => {
        const bucket = template.Resources.S3Bucket;
        expect(bucket.Properties.VersioningConfiguration.Status).toBe(
          'Enabled'
        );
      });

      test('should block all public access', () => {
        const bucket = template.Resources.S3Bucket;
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });

      test('should have correct tags', () => {
        const bucket = template.Resources.S3Bucket;
        expect(bucket.Properties.Tags).toHaveLength(2);
      });
    });

    describe('S3BucketPolicy', () => {
      test('should have correct type and bucket reference', () => {
        const policy = template.Resources.S3BucketPolicy;
        expect(policy.Type).toBe('AWS::S3::BucketPolicy');
        expect(policy.Properties.Bucket).toEqual({ Ref: 'S3Bucket' });
      });

      test('should deny insecure connections', () => {
        const policy = template.Resources.S3BucketPolicy;
        const statement = policy.Properties.PolicyDocument.Statement[0];
        expect(statement.Sid).toBe('DenyInsecureConnections');
        expect(statement.Effect).toBe('Deny');
        expect(statement.Principal).toBe('*');
        expect(statement.Action).toBe('s3:*');
      });

      test('should have correct resource ARNs', () => {
        const policy = template.Resources.S3BucketPolicy;
        const statement = policy.Properties.PolicyDocument.Statement[0];
        expect(statement.Resource).toHaveLength(2);
        expect(statement.Resource[0]).toEqual({
          'Fn::Sub': 'arn:${AWS::Partition}:s3:::${S3Bucket}/*',
        });
        expect(statement.Resource[1]).toEqual({
          'Fn::Sub': 'arn:${AWS::Partition}:s3:::${S3Bucket}',
        });
      });

      test('should enforce SSL/TLS via condition', () => {
        const policy = template.Resources.S3BucketPolicy;
        const statement = policy.Properties.PolicyDocument.Statement[0];
        expect(statement.Condition).toEqual({
          Bool: {
            'aws:SecureTransport': 'false',
          },
        });
      });
    });
  });

  // ============================================================================
  // I. Outputs
  // ============================================================================
  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'SNSTopicArn',
        'S3BucketName',
        'PrivateInstance1Id',
        'PrivateInstance2Id',
        'EC2InstanceRoleArn',
      ];

      expectedOutputs.forEach((outputName) => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    describe('VPCId Output', () => {
      test('should have correct configuration', () => {
        const output = template.Outputs.VPCId;
        expect(output.Description).toBe('VPC ID');
        expect(output.Value).toEqual({ Ref: 'VPC' });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': '${EnvironmentSuffix}-VPC-ID',
        });
      });
    });

    describe('Subnet Outputs', () => {
      test('PublicSubnet1Id should be correct', () => {
        const output = template.Outputs.PublicSubnet1Id;
        expect(output.Value).toEqual({ Ref: 'PublicSubnet1' });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': '${EnvironmentSuffix}-PublicSubnet1-ID',
        });
      });

      test('PublicSubnet2Id should be correct', () => {
        const output = template.Outputs.PublicSubnet2Id;
        expect(output.Value).toEqual({ Ref: 'PublicSubnet2' });
      });

      test('PrivateSubnet1Id should be correct', () => {
        const output = template.Outputs.PrivateSubnet1Id;
        expect(output.Value).toEqual({ Ref: 'PrivateSubnet1' });
      });

      test('PrivateSubnet2Id should be correct', () => {
        const output = template.Outputs.PrivateSubnet2Id;
        expect(output.Value).toEqual({ Ref: 'PrivateSubnet2' });
      });
    });

    describe('SNSTopicArn Output', () => {
      test('should have correct configuration', () => {
        const output = template.Outputs.SNSTopicArn;
        expect(output.Description).toBe('SNS Topic ARN for notifications');
        expect(output.Value).toEqual({ Ref: 'SNSTopic' });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': '${EnvironmentSuffix}-SNSTopic-ARN',
        });
      });
    });

    describe('S3BucketName Output', () => {
      test('should have correct configuration', () => {
        const output = template.Outputs.S3BucketName;
        expect(output.Description).toBe('S3 Bucket Name');
        expect(output.Value).toEqual({ Ref: 'S3Bucket' });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': '${EnvironmentSuffix}-S3Bucket-Name',
        });
      });
    });

    describe('Instance Outputs', () => {
      test('PrivateInstance1Id should be correct', () => {
        const output = template.Outputs.PrivateInstance1Id;
        expect(output.Description).toBe('Private Instance 1 ID');
        expect(output.Value).toEqual({ Ref: 'PrivateInstance1' });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': '${EnvironmentSuffix}-PrivateInstance1-ID',
        });
      });

      test('PrivateInstance2Id should be correct', () => {
        const output = template.Outputs.PrivateInstance2Id;
        expect(output.Description).toBe('Private Instance 2 ID');
        expect(output.Value).toEqual({ Ref: 'PrivateInstance2' });
      });
    });

    describe('EC2InstanceRoleArn Output', () => {
      test('should have correct configuration', () => {
        const output = template.Outputs.EC2InstanceRoleArn;
        expect(output.Description).toBe('EC2 Instance Role ARN');
        expect(output.Value).toEqual({
          'Fn::GetAtt': ['EC2InstanceRole', 'Arn'],
        });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': '${EnvironmentSuffix}-EC2InstanceRole-ARN',
        });
      });
    });
  });

  // ============================================================================
  // J. Intrinsic Functions & Advanced Validations
  // ============================================================================
  describe('Intrinsic Functions & Advanced Validations', () => {
    test('should use Fn::Sub for dynamic naming', () => {
      const vpcName = template.Resources.VPC.Properties.Tags[0].Value;
      expect(vpcName).toEqual({ 'Fn::Sub': '${EnvironmentSuffix}-VPC' });
    });

    test('should use Fn::GetAtt for resource attributes', () => {
      const nat1Allocation =
        template.Resources.NATGateway1.Properties.AllocationId;
      expect(nat1Allocation).toEqual({
        'Fn::GetAtt': ['NATGateway1EIP', 'AllocationId'],
      });
    });

    test('should use Fn::Select and Fn::GetAZs for AZ selection', () => {
      const subnet1AZ =
        template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      expect(subnet1AZ).toEqual({
        'Fn::Select': ['0', { 'Fn::GetAZs': '' }],
      });
    });

    test('should use Fn::FindInMap for region-specific values', () => {
      const amiId =
        template.Resources.LaunchTemplate.Properties.LaunchTemplateData.ImageId;
      expect(amiId).toEqual({
        'Fn::FindInMap': ['RegionAMIMap', { Ref: 'AWS::Region' }, 'AmiId'],
      });
    });

    test('should use Ref for parameter and resource references', () => {
      const vpcCidr = template.Resources.VPC.Properties.CidrBlock;
      expect(vpcCidr).toEqual({ Ref: 'VPCCidr' });
    });

    test('should have DependsOn for resource ordering', () => {
      expect(template.Resources.NATGateway1EIP.DependsOn).toBe(
        'AttachGateway'
      );
      expect(template.Resources.PublicRoute.DependsOn).toBe('AttachGateway');
    });
  });

  // ============================================================================
  // K. Security & Compliance Validation
  // ============================================================================
  describe('Security & Compliance Validation', () => {
    test('all EBS volumes should be encrypted', () => {
      const lt = template.Resources.LaunchTemplate;
      const ebs =
        lt.Properties.LaunchTemplateData.BlockDeviceMappings[0].Ebs;
      expect(ebs.Encrypted).toBe(true);
    });

    test('IMDSv2 should be enforced', () => {
      const lt = template.Resources.LaunchTemplate;
      const metadata = lt.Properties.LaunchTemplateData.MetadataOptions;
      expect(metadata.HttpTokens).toBe('required');
    });

    test('S3 bucket should be encrypted', () => {
      const bucket = template.Resources.S3Bucket;
      const encryption = bucket.Properties.BucketEncryption;
      expect(
        encryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('SNS topic should be encrypted', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic.Properties.KmsMasterKeyId).toBe('alias/aws/sns');
    });

    test('S3 bucket should block all public access', () => {
      const bucket = template.Resources.S3Bucket;
      const pac = bucket.Properties.PublicAccessBlockConfiguration;
      expect(pac.BlockPublicAcls).toBe(true);
      expect(pac.BlockPublicPolicy).toBe(true);
      expect(pac.IgnorePublicAcls).toBe(true);
      expect(pac.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should enforce SSL/TLS', () => {
      const policy = template.Resources.S3BucketPolicy;
      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Deny');
      expect(statement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });

    test('security group ingress should be scoped to VPC CIDR', () => {
      const sg = template.Resources.PrivateSecurityGroup;
      sg.Properties.SecurityGroupIngress.forEach((rule: any) => {
        expect(rule.CidrIp).toEqual({ Ref: 'VPCCidr' });
      });
    });

    test('IAM policies should follow least privilege', () => {
      const role = template.Resources.EC2InstanceRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const logsStatement = policy.Statement[2];
      expect(logsStatement.Resource).toEqual({
        'Fn::Sub':
          'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*',
      });
    });

    test('no hardcoded credentials should exist', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).not.toMatch(/AKIA[0-9A-Z]{16}/);
      expect(templateStr).not.toMatch(/password/i);
      expect(templateStr).not.toMatch(/secret/i);
    });

    test('S3 versioning should be enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });
  });

  // ============================================================================
  // L. Tagging Compliance
  // ============================================================================
  describe('Tagging Compliance', () => {
    test('all taggable resources should have Name and Environment tags', () => {
      const taggableResources = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'NATGateway1',
        'NATGateway2',
        'PublicRouteTable',
        'PrivateRouteTable1',
        'PrivateRouteTable2',
        'PrivateSecurityGroup',
        'EC2InstanceRole',
        'PrivateInstance1',
        'PrivateInstance2',
        'SNSTopic',
        'S3Bucket',
      ];

      taggableResources.forEach((resourceName) => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const tagKeys = resource.Properties.Tags.map((t: any) => t.Key);
          expect(tagKeys).toContain('Name');
          expect(tagKeys).toContain('Environment');
        }
      });
    });

    test('Name tags should use Fn::Sub for dynamic naming', () => {
      const vpc = template.Resources.VPC;
      const nameTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value).toEqual({ 'Fn::Sub': '${EnvironmentSuffix}-VPC' });
    });

    test('Environment tags should reference EnvironmentTag parameter', () => {
      const vpc = template.Resources.VPC;
      const envTag = vpc.Properties.Tags.find(
        (t: any) => t.Key === 'Environment'
      );
      expect(envTag.Value).toEqual({ Ref: 'EnvironmentTag' });
    });
  });

  // ============================================================================
  // M. Regional Migration Validation
  // ============================================================================
  describe('Regional Migration Validation', () => {
    test('should have AMI mappings for multiple regions', () => {
      const regions = Object.keys(template.Mappings.RegionAMIMap);
      expect(regions.length).toBeGreaterThanOrEqual(5);
      expect(regions).toContain('us-east-1');
      expect(regions).toContain('us-east-2');
      expect(regions).toContain('us-west-1');
      expect(regions).toContain('us-west-2');
      expect(regions).toContain('eu-west-1');
    });

    test('should use AWS::Partition for ARNs', () => {
      const policy = template.Resources.S3BucketPolicy;
      const resource = policy.Properties.PolicyDocument.Statement[0].Resource[0];
      expect(resource).toEqual({
        'Fn::Sub': 'arn:${AWS::Partition}:s3:::${S3Bucket}/*',
      });
    });

    test('should use Fn::GetAZs for dynamic AZ selection', () => {
      const subnet1AZ =
        template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      expect(subnet1AZ).toEqual({
        'Fn::Select': ['0', { 'Fn::GetAZs': '' }],
      });
    });

  });
});
