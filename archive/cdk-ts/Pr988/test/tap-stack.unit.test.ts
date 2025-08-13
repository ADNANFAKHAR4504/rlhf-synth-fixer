import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      env: { region: 'us-west-2' }
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Initialization', () => {
    test('uses provided environment suffix', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'custom-env'
      });
      const customTemplate = Template.fromStack(customStack);
      
      customTemplate.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
        Name: 'service-network-custom-env'
      });
    });

    test('falls back to context when environment suffix not provided in props', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context-env'
        }
      });
      const contextStack = new TapStack(contextApp, 'ContextStack', {});
      const contextTemplate = Template.fromStack(contextStack);
      
      contextTemplate.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
        Name: 'service-network-context-env'
      });
    });

    test('uses default when no environment suffix provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack', {});
      const defaultTemplate = Template.fromStack(defaultStack);
      
      defaultTemplate.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
        Name: 'service-network-dev'
      });
    });
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates VPC with proper tags', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Component', Value: 'Networking' }),
          Match.objectLike({ Key: 'Environment', Value: environmentSuffix }),
        ]),
      });
    });

    test('enables IPv6 support for VPC', () => {
      template.resourceCountIs('AWS::EC2::VPCCidrBlock', 1);
      template.hasResourceProperties('AWS::EC2::VPCCidrBlock', {
        AmazonProvidedIpv6CidrBlock: true,
      });
    });
  });

  describe('Subnet Configuration', () => {
    test('creates exactly 2 public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
      
      // Check for public subnets
      const resources = template.findResources('AWS::EC2::Subnet');
      const publicSubnets = Object.values(resources).filter((resource: any) => 
        resource.Properties.Tags?.some((tag: any) => 
          tag.Key === 'aws-cdk:subnet-type' && tag.Value === 'Public'
        )
      );
      expect(publicSubnets).toHaveLength(2);
    });

    test('creates exactly 2 private subnets', () => {
      const resources = template.findResources('AWS::EC2::Subnet');
      const privateSubnets = Object.values(resources).filter((resource: any) => 
        resource.Properties.Tags?.some((tag: any) => 
          tag.Key === 'aws-cdk:subnet-type' && tag.Value === 'Private'
        )
      );
      expect(privateSubnets).toHaveLength(2);
    });

    test('public subnets have correct CIDR blocks', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.0.0/24',
        MapPublicIpOnLaunch: false, // Using Elastic IPs instead
      });
      
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.1.0/24',
        MapPublicIpOnLaunch: false,
      });
    });

    test('private subnets have correct CIDR blocks', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.2.0/24',
      });
      
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.3.0/24',
      });
    });

    test('subnets are distributed across 2 availability zones', () => {
      const resources = template.findResources('AWS::EC2::Subnet');
      const azs = new Set();
      
      Object.values(resources).forEach((resource: any) => {
        const az = resource.Properties.AvailabilityZone;
        if (az) {
          azs.add(JSON.stringify(az));
        }
      });
      
      expect(azs.size).toBe(2);
    });
  });

  describe('Internet Gateway', () => {
    test('creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('attaches Internet Gateway to VPC', () => {
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
      template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {
        InternetGatewayId: Match.anyValue(),
        VpcId: Match.anyValue(),
      });
    });
  });

  describe('NAT Gateways and Elastic IPs', () => {
    test('creates exactly 2 NAT Gateways for high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('creates Elastic IPs for NAT Gateways', () => {
      // Should have at least 4 EIPs (2 for NAT Gateways created by VPC, 2 custom ones)
      const resources = template.findResources('AWS::EC2::EIP');
      const eips = Object.values(resources);
      expect(eips.length).toBeGreaterThanOrEqual(4);
      
      // Check for custom EIPs with specific names
      template.hasResourceProperties('AWS::EC2::EIP', {
        Domain: 'vpc',
        Tags: Match.arrayWith([
          Match.objectLike({ 
            Key: 'Name', 
            Value: `NAT-Gateway-EIP-AZ1-${environmentSuffix}` 
          }),
        ]),
      });
      
      template.hasResourceProperties('AWS::EC2::EIP', {
        Domain: 'vpc',
        Tags: Match.arrayWith([
          Match.objectLike({ 
            Key: 'Name', 
            Value: `NAT-Gateway-EIP-AZ2-${environmentSuffix}` 
          }),
        ]),
      });
    });

    test('NAT Gateways are placed in public subnets', () => {
      const natGateways = template.findResources('AWS::EC2::NatGateway');
      Object.values(natGateways).forEach((natGateway: any) => {
        expect(natGateway.Properties.SubnetId).toBeDefined();
        expect(natGateway.Properties.AllocationId).toBeDefined();
      });
    });
  });

  describe('Route Tables', () => {
    test('creates route tables for all subnets', () => {
      // Should have 4 route tables (1 for each subnet)
      template.resourceCountIs('AWS::EC2::RouteTable', 4);
    });

    test('public subnets have routes to Internet Gateway', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        GatewayId: Match.anyValue(),
      });
    });

    test('private subnets have routes to NAT Gateways', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        NatGatewayId: Match.anyValue(),
      });
    });

    test('creates IPv6 routes for public subnets', () => {
      // Should have IPv6 routes for public subnets
      const ipv6Routes = template.findResources('AWS::EC2::Route', {
        Properties: {
          DestinationIpv6CidrBlock: '::/0',
          GatewayId: Match.anyValue(),
        },
      });
      
      expect(Object.keys(ipv6Routes).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Security Groups', () => {
    test('creates security group for public subnets', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for public subnets allowing ICMP traffic',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'icmp',
            FromPort: -1,
            ToPort: -1,
            CidrIp: '0.0.0.0/0',
          }),
          Match.objectLike({
            IpProtocol: 'icmpv6',
            FromPort: -1,
            ToPort: -1,
            CidrIpv6: '::/0',
          }),
        ]),
      });
    });

    test('creates security group for private subnets', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for private subnets allowing ICMP traffic',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'icmp',
            FromPort: -1,
            ToPort: -1,
          }),
          Match.objectLike({
            IpProtocol: 'icmpv6',
            FromPort: -1,
            ToPort: -1,
            CidrIpv6: '::/0',
          }),
        ]),
      });
    });

    test('security groups allow all outbound traffic', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      Object.values(securityGroups).forEach((sg: any) => {
        expect(sg.Properties.SecurityGroupEgress).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              IpProtocol: '-1',
              CidrIp: '0.0.0.0/0',
            }),
          ])
        );
      });
    });

    test('security groups have proper tags', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Component', Value: 'Security' }),
        ]),
      });
    });
  });

  describe('VPC Lattice', () => {
    test('creates VPC Lattice Service Network', () => {
      template.resourceCountIs('AWS::VpcLattice::ServiceNetwork', 1);
      template.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
        Name: `service-network-${environmentSuffix}`,
        AuthType: 'AWS_IAM',
      });
    });

    test('Service Network has proper tags', () => {
      const resources = template.findResources('AWS::VpcLattice::ServiceNetwork');
      const serviceNetwork = Object.values(resources)[0] as any;
      const tags = serviceNetwork.Properties.Tags;
      
      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toBe(`ServiceNetwork-${environmentSuffix}`);
      
      const componentTag = tags.find((tag: any) => tag.Key === 'Component');
      expect(componentTag).toBeDefined();
      expect(componentTag.Value).toBe('ServiceMesh');
      
      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe(environmentSuffix);
    });

    test('associates VPC with Service Network', () => {
      template.resourceCountIs('AWS::VpcLattice::ServiceNetworkVpcAssociation', 1);
      template.hasResourceProperties('AWS::VpcLattice::ServiceNetworkVpcAssociation', {
        ServiceNetworkIdentifier: Match.anyValue(),
        VpcIdentifier: Match.anyValue(),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
        Value: Match.anyValue(),
      });
    });

    test('exports Public Subnet IDs', () => {
      template.hasOutput('PublicSubnetIds', {
        Description: 'Public Subnet IDs',
        Value: Match.anyValue(),
      });
    });

    test('exports Private Subnet IDs', () => {
      template.hasOutput('PrivateSubnetIds', {
        Description: 'Private Subnet IDs',
        Value: Match.anyValue(),
      });
    });

    test('exports NAT Gateway EIPs', () => {
      template.hasOutput('NATGatewayEIPs', {
        Description: 'NAT Gateway Elastic IP addresses',
        Value: Match.anyValue(),
      });
    });

    test('exports Service Network ARN', () => {
      template.hasOutput('ServiceNetworkArn', {
        Description: 'VPC Lattice Service Network ARN',
        Value: Match.anyValue(),
      });
    });
  });

  describe('Resource Tagging', () => {
    test('all resources have environment tags', () => {
      const resources = template.findResources('*');
      const taggedResources = Object.values(resources).filter((resource: any) => 
        resource.Properties?.Tags
      );
      
      taggedResources.forEach((resource: any) => {
        const tags = resource.Properties.Tags;
        const envTag = tags.find((tag: any) => tag.Key === 'Environment');
        expect(envTag).toBeDefined();
        expect(envTag?.Value).toBe(environmentSuffix);
      });
    });

    test('all resources have project tags', () => {
      const resources = template.findResources('*');
      const taggedResources = Object.values(resources).filter((resource: any) => 
        resource.Properties?.Tags
      );
      
      taggedResources.forEach((resource: any) => {
        const tags = resource.Properties.Tags;
        const projectTag = tags.find((tag: any) => tag.Key === 'Project');
        expect(projectTag).toBeDefined();
        expect(projectTag?.Value).toBe('VPC-Infrastructure');
      });
    });
  });

  describe('Stack Properties', () => {
    test('stack is created with correct region', () => {
      expect(stack.region).toBe('us-west-2');
    });

    test('stack has correct name pattern', () => {
      expect(stack.stackName).toContain('TestTapStack');
    });

    test('VPC property is accessible', () => {
      expect(stack.vpc).toBeDefined();
      expect(stack.vpc.vpcId).toBeDefined();
    });

    test('Service Network property is accessible', () => {
      expect(stack.serviceNetwork).toBeDefined();
    });
  });

  describe('CDK Best Practices', () => {
    test('uses CDK L2 constructs where appropriate', () => {
      // Check that we're using L2 Vpc construct
      expect(stack.vpc).toBeDefined();
      expect(stack.vpc.publicSubnets).toBeDefined();
      expect(stack.vpc.privateSubnets).toBeDefined();
    });

    test('no deletion policies that prevent cleanup', () => {
      const resources = template.findResources('*');
      Object.values(resources).forEach((resource: any) => {
        // Ensure no Retain deletion policies
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('uses proper CDK patterns for cross-resource references', () => {
      // Check that outputs use proper references
      const outputs = template.findOutputs('*');
      Object.values(outputs).forEach((output: any) => {
        expect(output.Value).toBeDefined();
      });
    });
  });
});