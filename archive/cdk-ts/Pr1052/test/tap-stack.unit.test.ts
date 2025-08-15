import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Initialization', () => {
    test('uses environment suffix from props', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'custom',
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: 'tap-custom-vpc1' }),
        ]),
      });
    });

    test('uses environment suffix from context when not in props', () => {
      const contextApp = new cdk.App({
        context: { environmentSuffix: 'context' },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack');
      const contextTemplate = Template.fromStack(contextStack);

      contextTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: 'tap-context-vpc1' }),
        ]),
      });
    });

    test('uses default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      const defaultTemplate = Template.fromStack(defaultStack);

      defaultTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: 'tap-dev-vpc1' }),
        ]),
      });
    });
  });

  describe('VPC Configuration', () => {
    test('creates two VPCs with correct CIDR blocks', () => {
      // VPC1 with 10.0.0.0/16
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: 'tap-test-vpc1' }),
        ]),
      });

      // VPC2 with 192.168.0.0/16
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '192.168.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: 'tap-test-vpc2' }),
        ]),
      });

      // Should have exactly 2 VPCs
      template.resourceCountIs('AWS::EC2::VPC', 2);
    });

    test('creates Internet Gateways for both VPCs', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 2);
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 2);
    });
  });

  describe('Subnet Configuration', () => {
    test('creates public and private subnets in both VPCs', () => {
      // Total of 8 subnets (4 per VPC: 2 public, 2 private)
      template.resourceCountIs('AWS::EC2::Subnet', 8);

      // Check for public subnets with MapPublicIpOnLaunch
      const publicSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: true,
        },
      });
      expect(Object.keys(publicSubnets).length).toBe(4); // 2 public per VPC

      // Check for private subnets
      const privateSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: false,
        },
      });
      expect(Object.keys(privateSubnets).length).toBe(4); // 2 private per VPC
    });

    test('creates subnets with correct CIDR calculations', () => {
      // VPC1 subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.0.0/24',
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.1.0/24',
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.2.0/24',
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.3.0/24',
      });

      // VPC2 subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '192.168.0.0/24',
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '192.168.1.0/24',
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '192.168.2.0/24',
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '192.168.3.0/24',
      });
    });

    test('distributes subnets across multiple availability zones', () => {
      // Check that subnets are distributed (CDK uses dummy AZs in tests)
      const subnets = template.findResources('AWS::EC2::Subnet');
      const azs = new Set<string>();

      Object.values(subnets).forEach((subnet: any) => {
        if (subnet.Properties.AvailabilityZone) {
          azs.add(subnet.Properties.AvailabilityZone);
        }
      });

      // Should have at least 2 availability zones
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('creates NAT Gateways for both VPCs', () => {
      // Should have exactly 2 NAT Gateways (one per VPC)
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('allocates Elastic IPs for NAT Gateways', () => {
      // Should have 2 EIPs for NAT Gateways
      template.resourceCountIs('AWS::EC2::EIP', 2);
    });

    test('creates routes for private subnets to NAT Gateway', () => {
      // Check for routes with NAT Gateway as target
      const routes = template.findResources('AWS::EC2::Route', {
        Properties: {
          DestinationCidrBlock: '0.0.0.0/0',
        },
      });

      // Count routes with NatGatewayId
      const natRoutes = Object.values(routes).filter(
        (route: any) => route.Properties.NatGatewayId !== undefined
      );

      expect(natRoutes.length).toBe(4); // 2 private subnets per VPC
    });
  });

  describe('EC2 Instance Configuration', () => {
    test('creates EC2 instance with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: 'tap-test-ec2-instance' }),
        ]),
      });
    });

    test('places EC2 instance in VPC1 public subnet', () => {
      const instances = template.findResources('AWS::EC2::Instance');
      const instance = Object.values(instances)[0] as any;

      // Check that SubnetId references a VPC1 public subnet
      expect(instance.Properties.SubnetId).toBeDefined();
      expect(instance.Properties.SubnetId.Ref).toContain('VPC1PublicSubnet');
    });

    test('configures EC2 instance with user data for Apache', () => {
      const instances = template.findResources('AWS::EC2::Instance');
      const instance = Object.values(instances)[0] as any;

      // User data should be base64 encoded
      expect(instance.Properties.UserData).toBeDefined();
      expect(instance.Properties.UserData['Fn::Base64']).toContain('httpd');
      expect(instance.Properties.UserData['Fn::Base64']).toContain(
        'systemctl start httpd'
      );
    });
  });

  describe('Security Configuration', () => {
    test('creates security group for EC2 instance', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription:
          'Security group for EC2 instance allowing HTTP access',
        GroupName: 'tap-test-ec2-sg',
        SecurityGroupIngress: [
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTP access on port 80',
            FromPort: 80,
            IpProtocol: 'tcp',
            ToPort: 80,
          },
          {
            CidrIp: '169.254.171.0/24',
            Description: 'Allow HTTP access from VPC Lattice',
            FromPort: 80,
            IpProtocol: 'tcp',
            ToPort: 80,
          },
        ],
      });
    });

    test('allows all outbound traffic from security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupEgress: [
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow all outbound traffic by default',
            IpProtocol: '-1',
          },
        ],
      });
    });
  });

  describe('IAM Configuration', () => {
    test('creates IAM role for EC2 instance', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
        },
        RoleName: 'tap-test-ec2-role',
        Description: 'IAM role for EC2 instance with SSM access',
      });
    });

    test('attaches SSM managed policy to EC2 role', () => {
      const roles = template.findResources('AWS::IAM::Role', {
        Properties: {
          RoleName: 'tap-test-ec2-role',
        },
      });

      const role = Object.values(roles)[0] as any;
      expect(role.Properties.ManagedPolicyArns).toBeDefined();
      expect(role.Properties.ManagedPolicyArns.length).toBeGreaterThan(0);

      // Check that SSM policy is included
      const ssmPolicy = role.Properties.ManagedPolicyArns[0];
      expect(JSON.stringify(ssmPolicy)).toContain(
        'AmazonSSMManagedInstanceCore'
      );
    });

    test('creates instance profile for EC2 instance', () => {
      template.resourceCountIs('AWS::IAM::InstanceProfile', 1);
    });
  });

  describe('Route Tables and Associations', () => {
    test('creates route tables for all subnets', () => {
      // Should have 8 route tables (one for each subnet)
      template.resourceCountIs('AWS::EC2::RouteTable', 8);
    });

    test('creates subnet route table associations', () => {
      // Should have 8 associations (one for each subnet)
      template.resourceCountIs('AWS::EC2::SubnetRouteTableAssociation', 8);
    });

    test('creates internet gateway routes for public subnets', () => {
      // Check for routes with IGW as target
      const routes = template.findResources('AWS::EC2::Route', {
        Properties: {
          DestinationCidrBlock: '0.0.0.0/0',
        },
      });

      // Count routes with GatewayId (IGW routes)
      const igwRoutes = Object.values(routes).filter(
        (route: any) => route.Properties.GatewayId !== undefined
      );

      expect(igwRoutes.length).toBe(4); // 2 public subnets per VPC
    });
  });

  describe('CloudFormation Outputs', () => {
    test('exports VPC IDs', () => {
      template.hasOutput('VPC1Id', {
        Description: 'ID of VPC1 (10.0.0.0/16)',
        Export: {
          Name: Match.stringLikeRegexp('.*-VPC1-ID'),
        },
      });

      template.hasOutput('VPC2Id', {
        Description: 'ID of VPC2 (192.168.0.0/16)',
        Export: {
          Name: Match.stringLikeRegexp('.*-VPC2-ID'),
        },
      });
    });

    test('exports EC2 instance information', () => {
      template.hasOutput('EC2InstanceId', {
        Description: 'ID of EC2 instance in VPC1 public subnet',
        Export: {
          Name: Match.stringLikeRegexp('.*-EC2-Instance-ID'),
        },
      });

      template.hasOutput('EC2InstancePublicIP', {
        Description: 'Public IP address of EC2 instance',
        Export: {
          Name: Match.stringLikeRegexp('.*-EC2-Instance-Public-IP'),
        },
      });
    });

    test('exports subnet IDs', () => {
      template.hasOutput('VPC1PublicSubnets', {
        Description: 'Public subnet IDs in VPC1',
      });

      template.hasOutput('VPC1PrivateSubnets', {
        Description: 'Private subnet IDs in VPC1',
      });

      template.hasOutput('VPC2PublicSubnets', {
        Description: 'Public subnet IDs in VPC2',
      });

      template.hasOutput('VPC2PrivateSubnets', {
        Description: 'Private subnet IDs in VPC2',
      });
    });
  });

  describe('Resource Naming', () => {
    test('uses environment suffix in resource names', () => {
      // Check VPC names
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: 'tap-test-vpc1' }),
        ]),
      });

      // Check security group name
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'tap-test-ec2-sg',
      });

      // Check IAM role name
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-test-ec2-role',
      });

      // Check EC2 instance name
      template.hasResourceProperties('AWS::EC2::Instance', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: 'tap-test-ec2-instance' }),
        ]),
      });
    });
  });

  describe('High Availability', () => {
    test('deploys resources across multiple availability zones', () => {
      // Check that subnets are distributed across AZs
      const subnets = template.findResources('AWS::EC2::Subnet');
      const azSet = new Set<string>();

      Object.values(subnets).forEach((subnet: any) => {
        const az = subnet.Properties.AvailabilityZone;
        if (az) {
          azSet.add(az);
        }
      });

      // Should have at least 2 AZs
      expect(azSet.size).toBeGreaterThanOrEqual(2);

      // Should have 8 subnets total distributed across AZs
      expect(Object.keys(subnets).length).toBe(8);
    });
  });

  describe('Network Isolation', () => {
    test('VPCs have non-overlapping CIDR blocks', () => {
      const vpcs = template.findResources('AWS::EC2::VPC');
      const cidrBlocks = Object.values(vpcs).map(
        (vpc: any) => vpc.Properties.CidrBlock
      );

      expect(cidrBlocks).toContain('10.0.0.0/16');
      expect(cidrBlocks).toContain('192.168.0.0/16');
      expect(cidrBlocks.length).toBe(2);

      // Ensure they are different
      expect(cidrBlocks[0]).not.toBe(cidrBlocks[1]);
    });
  });

  describe('Stack Dependencies', () => {
    test('NAT Gateway depends on Internet Gateway attachment', () => {
      const natGateways = template.findResources('AWS::EC2::NatGateway');

      Object.values(natGateways).forEach((natGateway: any) => {
        expect(natGateway.DependsOn).toBeDefined();
        expect(natGateway.DependsOn).toEqual(
          expect.arrayContaining([
            expect.stringMatching(/.*DefaultRoute.*/),
            expect.stringMatching(/.*RouteTableAssociation.*/),
          ])
        );
      });
    });

    test('EC2 instance depends on IAM role', () => {
      const instances = template.findResources('AWS::EC2::Instance');
      const instance = Object.values(instances)[0] as any;

      expect(instance.DependsOn).toBeDefined();
      expect(instance.DependsOn).toContain('EC2RoleF978FC1C');
    });
  });

  describe('VPC Lattice Configuration', () => {
    test('creates VPC Lattice Service Network', () => {
      template.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
        Name: 'tap-test-service-network',
        AuthType: 'AWS_IAM',
      });
    });

    test('creates VPC Lattice Service', () => {
      template.hasResourceProperties('AWS::VpcLattice::Service', {
        Name: 'tap-test-web-service',
        AuthType: 'AWS_IAM',
      });
    });

    test('creates VPC Lattice Target Group', () => {
      template.hasResourceProperties('AWS::VpcLattice::TargetGroup', {
        Name: 'tap-test-web-tg',
        Type: 'INSTANCE',
      });
    });

    test('creates VPC Lattice Listener', () => {
      template.resourceCountIs('AWS::VpcLattice::Listener', 1);
    });

    test('associates VPCs with Service Network', () => {
      template.resourceCountIs('AWS::VpcLattice::ServiceNetworkVpcAssociation', 2);
    });

    test('associates Service with Service Network', () => {
      template.resourceCountIs('AWS::VpcLattice::ServiceNetworkServiceAssociation', 1);
    });
  });

  describe('VPC Endpoints Configuration', () => {
    test('creates VPC Endpoints for Systems Manager', () => {
      template.resourceCountIs('AWS::EC2::VPCEndpoint', 3);
    });

    test('creates SSM VPC Endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Interface',
        PrivateDnsEnabled: true,
      });
    });

    test('creates SSM Messages VPC Endpoint', () => {
      const endpoints = template.findResources('AWS::EC2::VPCEndpoint');
      const ssmMessagesEndpoint = Object.values(endpoints).find((endpoint: any) => {
        const serviceName = endpoint.Properties.ServiceName;
        if (typeof serviceName === 'object' && serviceName['Fn::Join']) {
          const parts = serviceName['Fn::Join'][1];
          return parts.some((part: any) => part === '.ssmmessages');
        }
        return false;
      });
      expect(ssmMessagesEndpoint).toBeDefined();
    });

    test('creates EC2 Messages VPC Endpoint', () => {
      const endpoints = template.findResources('AWS::EC2::VPCEndpoint');
      const ec2MessagesEndpoint = Object.values(endpoints).find((endpoint: any) => {
        const serviceName = endpoint.Properties.ServiceName;
        if (typeof serviceName === 'object' && serviceName['Fn::Join']) {
          const parts = serviceName['Fn::Join'][1];
          return parts.some((part: any) => part === '.ec2messages');
        }
        return false;
      });
      expect(ec2MessagesEndpoint).toBeDefined();
    });

    test('creates security group for VPC Endpoints', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for VPC endpoints allowing HTTPS traffic',
        GroupName: 'tap-test-vpc-endpoint-sg',
      });
    });
  });

  describe('CloudFormation Outputs - VPC Lattice', () => {
    test('exports VPC Lattice Service Network IDs', () => {
      template.hasOutput('VPCLatticeServiceNetworkId', {
        Description: 'ID of VPC Lattice Service Network',
      });

      template.hasOutput('VPCLatticeServiceNetworkArn', {
        Description: 'ARN of VPC Lattice Service Network',
      });
    });

    test('exports VPC Lattice Web Service IDs', () => {
      template.hasOutput('WebServiceId', {
        Description: 'ID of VPC Lattice Web Service',
      });

      template.hasOutput('WebServiceArn', {
        Description: 'ARN of VPC Lattice Web Service',
      });
    });

    test('exports VPC Endpoint IDs', () => {
      template.hasOutput('SSMEndpointId', {
        Description: 'ID of SSM VPC Endpoint',
      });

      template.hasOutput('SSMMessagesEndpointId', {
        Description: 'ID of SSM Messages VPC Endpoint',
      });

      template.hasOutput('EC2MessagesEndpointId', {
        Description: 'ID of EC2 Messages VPC Endpoint',
      });
    });
  });

  describe('IAM Permissions for VPC Lattice', () => {
    test('EC2 role has VPC Lattice permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'vpc-lattice:InvokeService',
                'vpc-lattice:GetService',
                'vpc-lattice:ListServices',
              ],
              Resource: '*',
            },
          ],
        },
      });
    });
  });
});
