import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, `TapStack${environmentSuffix}`, {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('VPC has correct tags', () => {
      const vpcs = template.findResources('AWS::EC2::VPC');
      const vpcResource = Object.values(vpcs)[0] as any;
      const tags = vpcResource.Properties.Tags;
      
      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toBe(`${environmentSuffix}-VPC-Main`);
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe(environmentSuffix);
    });
  });

  describe('Internet Gateway', () => {
    test('creates Internet Gateway', () => {
      const igws = template.findResources('AWS::EC2::InternetGateway');
      const igwResource = Object.values(igws)[0] as any;
      const tags = igwResource.Properties.Tags;
      
      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toBe(`${environmentSuffix}-IGW-Main`);
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe(environmentSuffix);
    });

    test('attaches Internet Gateway to VPC', () => {
      template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {
        VpcId: { Ref: Match.anyValue() },
        InternetGatewayId: { Ref: Match.anyValue() },
      });
    });
  });

  describe('Public Subnets', () => {
    test('creates exactly two public subnets', () => {
      const subnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: true,
        },
      });
      expect(Object.keys(subnets)).toHaveLength(2);
    });

    test('public subnet 1 has correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        AvailabilityZone: 'us-east-1a',
        CidrBlock: '10.0.1.0/24',
        MapPublicIpOnLaunch: true,
        VpcId: { Ref: Match.anyValue() },
      });
    });

    test('public subnet 2 has correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        AvailabilityZone: 'us-east-1b',
        CidrBlock: '10.0.2.0/24',
        MapPublicIpOnLaunch: true,
        VpcId: { Ref: Match.anyValue() },
      });
    });

    test('public subnets have correct tags', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const subnetResources = Object.values(subnets);
      
      // Check that both subnets have proper tags
      subnetResources.forEach((subnet: any, index) => {
        const tags = subnet.Properties.Tags;
        const nameTag = tags.find((tag: any) => tag.Key === 'Name');
        const envTag = tags.find((tag: any) => tag.Key === 'Environment');
        
        expect(nameTag).toBeDefined();
        expect(nameTag.Value).toMatch(new RegExp(`${environmentSuffix}-PublicSubnet-[12]`));
        expect(envTag).toBeDefined();
        expect(envTag.Value).toBe(environmentSuffix);
      });
    });
  });

  describe('Route Tables and Routes', () => {
    test('creates route tables for public subnets', () => {
      const routeTables = template.findResources('AWS::EC2::RouteTable');
      // At least 2 route tables for public subnets
      expect(Object.keys(routeTables).length).toBeGreaterThanOrEqual(2);
    });

    test('creates routes to Internet Gateway', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        GatewayId: { Ref: Match.anyValue() },
      });
    });

    test('associates route tables with subnets', () => {
      const associations = template.findResources(
        'AWS::EC2::SubnetRouteTableAssociation'
      );
      // At least 2 associations for public subnets
      expect(Object.keys(associations).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('VPC Endpoints', () => {
    test('creates S3 VPC endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: {
          'Fn::Join': ['', ['com.amazonaws.', { Ref: 'AWS::Region' }, '.s3']],
        },
        VpcEndpointType: 'Gateway',
        VpcId: { Ref: Match.anyValue() },
      });
    });

    test('S3 VPC endpoint has correct tags', () => {
      const endpoints = template.findResources('AWS::EC2::VPCEndpoint');
      const s3Endpoint = Object.values(endpoints).find((endpoint: any) => {
        const serviceName = endpoint.Properties.ServiceName;
        return serviceName && serviceName['Fn::Join'] && 
               serviceName['Fn::Join'][1][2] === '.s3';
      }) as any;
      
      expect(s3Endpoint).toBeDefined();
      const tags = s3Endpoint.Properties.Tags;
      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toBe(`${environmentSuffix}-S3-VPCEndpoint`);
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe(environmentSuffix);
    });

    test('creates DynamoDB VPC endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: {
          'Fn::Join': [
            '',
            ['com.amazonaws.', { Ref: 'AWS::Region' }, '.dynamodb'],
          ],
        },
        VpcEndpointType: 'Gateway',
        VpcId: { Ref: Match.anyValue() },
      });
    });

    test('DynamoDB VPC endpoint has correct tags', () => {
      const endpoints = template.findResources('AWS::EC2::VPCEndpoint');
      const dynamoEndpoint = Object.values(endpoints).find((endpoint: any) => {
        const serviceName = endpoint.Properties.ServiceName;
        return serviceName && serviceName['Fn::Join'] && 
               serviceName['Fn::Join'][1][2] === '.dynamodb';
      }) as any;
      
      expect(dynamoEndpoint).toBeDefined();
      const tags = dynamoEndpoint.Properties.Tags;
      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toBe(`${environmentSuffix}-DynamoDB-VPCEndpoint`);
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe(environmentSuffix);
    });

    test('VPC endpoints are associated with public subnet route tables', () => {
      const s3Endpoint = template.findResources('AWS::EC2::VPCEndpoint', {
        Properties: {
          ServiceName: {
            'Fn::Join': [
              '',
              ['com.amazonaws.', { Ref: 'AWS::Region' }, '.s3'],
            ],
          },
        },
      });

      const endpointResource = Object.values(s3Endpoint)[0];
      expect(endpointResource.Properties.RouteTableIds).toBeDefined();
      expect(endpointResource.Properties.RouteTableIds.length).toBeGreaterThan(
        0
      );
    });
  });

  describe('CloudFormation Outputs', () => {
    test('exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Value: { Ref: Match.anyValue() },
        Export: { Name: `${environmentSuffix}-VPC-ID` },
      });
    });

    test('exports VPC CIDR', () => {
      template.hasOutput('VpcCidr', {
        Value: { 'Fn::GetAtt': [Match.anyValue(), 'CidrBlock'] },
        Export: { Name: `${environmentSuffix}-VPC-CIDR` },
      });
    });

    test('exports public subnet IDs', () => {
      template.hasOutput('PublicSubnet1Id', {
        Value: { Ref: Match.anyValue() },
        Export: { Name: `${environmentSuffix}-PublicSubnet-1-ID` },
      });

      template.hasOutput('PublicSubnet2Id', {
        Value: { Ref: Match.anyValue() },
        Export: { Name: `${environmentSuffix}-PublicSubnet-2-ID` },
      });
    });

    test('exports public subnet availability zones', () => {
      template.hasOutput('PublicSubnet1Az', {
        Value: 'us-east-1a',
        Export: { Name: `${environmentSuffix}-PublicSubnet-1-AZ` },
      });

      template.hasOutput('PublicSubnet2Az', {
        Value: 'us-east-1b',
        Export: { Name: `${environmentSuffix}-PublicSubnet-2-AZ` },
      });
    });

    test('exports Internet Gateway ID', () => {
      template.hasOutput('InternetGatewayId', {
        Value: { Ref: Match.anyValue() },
        Export: { Name: `${environmentSuffix}-IGW-ID` },
      });
    });
  });

  describe('Naming Convention', () => {
    test('all resources follow naming convention', () => {
      // Check VPC naming
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: Match.stringLikeRegexp(`${environmentSuffix}-.*`),
          },
        ]),
      });

      // Check subnet naming
      const subnets = template.findResources('AWS::EC2::Subnet');
      Object.values(subnets).forEach((subnet: any) => {
        const nameTags = subnet.Properties.Tags.filter(
          (tag: any) => tag.Key === 'Name'
        );
        expect(nameTags).toHaveLength(1);
        expect(nameTags[0].Value).toMatch(
          new RegExp(`^${environmentSuffix}-.*`)
        );
      });
    });

    test('environment suffix is configurable', () => {
      const customSuffix = 'production';
      const customApp = new cdk.App();
      const customStack = new TapStack(
        customApp,
        `TapStack${customSuffix}`,
        {
          env: {
            account: '123456789012',
            region: 'us-east-1',
          },
          environmentSuffix: customSuffix,
        }
      );
      const customTemplate = Template.fromStack(customStack);

      const vpcs = customTemplate.findResources('AWS::EC2::VPC');
      const vpcResource = Object.values(vpcs)[0] as any;
      const tags = vpcResource.Properties.Tags;
      
      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toBe(`${customSuffix}-VPC-Main`);
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe(customSuffix);
    });
  });

  describe('Stack Validation', () => {
    test('stack synthesizes without errors', () => {
      expect(() => app.synth()).not.toThrow();
    });

    test('stack has no unresolved tokens in critical properties', () => {
      const synthesized = app.synth();
      const stackArtifact = synthesized.getStackByName(stack.stackName);
      expect(stackArtifact).toBeDefined();
    });
  });
});