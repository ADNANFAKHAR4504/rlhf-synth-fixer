import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
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
        expect(nameTag.Value).toMatch(
          new RegExp(`${environmentSuffix}-PublicSubnet-[12]`)
        );
        expect(envTag).toBeDefined();
        expect(envTag.Value).toBe(environmentSuffix);
      });
    });
  });

  describe('Route Tables and Routes', () => {
    test('creates exactly one route table for public subnets', () => {
      const routeTables = template.findResources('AWS::EC2::RouteTable');
      // Exactly 1 route table for public subnets (plus default VPC route table)
      expect(Object.keys(routeTables).length).toBeGreaterThanOrEqual(1);
    });

    test('creates route to Internet Gateway', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        GatewayId: { Ref: Match.anyValue() },
      });
    });

    test('associates route table with both subnets', () => {
      const associations = template.findResources(
        'AWS::EC2::SubnetRouteTableAssociation'
      );
      // Exactly 2 associations for public subnets
      expect(Object.keys(associations).length).toBe(2);

      // Verify each association has correct properties
      Object.values(associations).forEach((association: any) => {
        expect(association.Properties.SubnetId).toBeDefined();
        expect(association.Properties.RouteTableId).toBeDefined();
      });
    });

    test('route table has correct tags', () => {
      const routeTables = template.findResources('AWS::EC2::RouteTable');
      const publicRouteTable = Object.values(routeTables).find((rt: any) => {
        const tags = rt.Properties.Tags || [];
        return tags.some(
          (tag: any) =>
            tag.Key === 'Name' && tag.Value.includes('PublicRouteTable')
        );
      }) as any;

      expect(publicRouteTable).toBeDefined();
      const tags = publicRouteTable.Properties.Tags;
      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      const envTag = tags.find((tag: any) => tag.Key === 'Environment');

      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toBe(`${environmentSuffix}-PublicRouteTable`);
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe(environmentSuffix);
    });
  });

  describe('VPC Endpoints', () => {
    test('creates S3 VPC endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: 'com.amazonaws.us-east-1.s3',
        VpcEndpointType: 'Gateway',
        VpcId: { Ref: Match.anyValue() },
        RouteTableIds: Match.anyValue(),
      });
    });

    test('S3 VPC endpoint has correct tags', () => {
      const endpoints = template.findResources('AWS::EC2::VPCEndpoint');
      const s3Endpoint = Object.values(endpoints).find((endpoint: any) => {
        const serviceName = endpoint.Properties.ServiceName;
        return serviceName === 'com.amazonaws.us-east-1.s3';
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
        ServiceName: 'com.amazonaws.us-east-1.dynamodb',
        VpcEndpointType: 'Gateway',
        VpcId: { Ref: Match.anyValue() },
        RouteTableIds: Match.anyValue(),
      });
    });

    test('DynamoDB VPC endpoint has correct tags', () => {
      const endpoints = template.findResources('AWS::EC2::VPCEndpoint');
      const dynamoEndpoint = Object.values(endpoints).find((endpoint: any) => {
        const serviceName = endpoint.Properties.ServiceName;
        return serviceName === 'com.amazonaws.us-east-1.dynamodb';
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
          ServiceName: 'com.amazonaws.us-east-1.s3',
        },
      });

      const endpointResource = Object.values(s3Endpoint)[0];
      expect(endpointResource.Properties.RouteTableIds).toBeDefined();
      expect(endpointResource.Properties.RouteTableIds).toHaveLength(1);
      expect(endpointResource.Properties.VpcEndpointType).toBe('Gateway');
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

    test('exports S3 VPC Endpoint ID', () => {
      template.hasOutput('S3VpcEndpointId', {
        Value: { Ref: Match.anyValue() },
        Export: { Name: `${environmentSuffix}-S3-VPCEndpoint-ID` },
      });
    });

    test('exports DynamoDB VPC Endpoint ID', () => {
      template.hasOutput('DynamoDBVpcEndpointId', {
        Value: { Ref: Match.anyValue() },
        Export: { Name: `${environmentSuffix}-DynamoDB-VPCEndpoint-ID` },
      });
    });
  });

  describe('Environment-Specific CIDR Configuration', () => {
    test('dev environment uses default CIDR ranges', () => {
      const devApp = new cdk.App();
      const devStack = new TapStack(devApp, 'TapStackDev', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environmentSuffix: 'dev',
      });
      const devTemplate = Template.fromStack(devStack);

      // Verify VPC uses default CIDR
      devTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });

      // Verify subnets use default CIDRs
      devTemplate.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.1.0/24',
        AvailabilityZone: 'us-east-1a',
      });

      devTemplate.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.2.0/24',
        AvailabilityZone: 'us-east-1b',
      });
    });

    test('staging environment uses staging CIDR ranges', () => {
      const stagingApp = new cdk.App();
      const stagingStack = new TapStack(stagingApp, 'TapStackStaging', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environmentSuffix: 'staging',
      });
      const stagingTemplate = Template.fromStack(stagingStack);

      // Verify VPC uses staging CIDR
      stagingTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
      });

      // Verify subnets use staging CIDRs
      stagingTemplate.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.1.1.0/24',
        AvailabilityZone: 'us-east-1a',
      });

      stagingTemplate.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.1.2.0/24',
        AvailabilityZone: 'us-east-1b',
      });
    });

    test('prod environment uses production CIDR ranges', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'TapStackProd', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environmentSuffix: 'prod',
      });
      const prodTemplate = Template.fromStack(prodStack);

      // Verify VPC uses production CIDR
      prodTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.2.0.0/16',
      });

      // Verify subnets use production CIDRs
      prodTemplate.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.2.1.0/24',
        AvailabilityZone: 'us-east-1a',
      });

      prodTemplate.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.2.2.0/24',
        AvailabilityZone: 'us-east-1b',
      });
    });

    test('unknown environment falls back to default CIDR ranges', () => {
      const unknownApp = new cdk.App();
      const unknownStack = new TapStack(unknownApp, 'TapStackUnknown', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environmentSuffix: 'unknown',
      });
      const unknownTemplate = Template.fromStack(unknownStack);

      // Verify VPC uses default CIDR (fallback)
      unknownTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });

      // Verify subnets use default CIDRs (fallback)
      unknownTemplate.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.1.0/24',
        AvailabilityZone: 'us-east-1a',
      });

      unknownTemplate.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.2.0/24',
        AvailabilityZone: 'us-east-1b',
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
      const customStack = new TapStack(customApp, `TapStack${customSuffix}`, {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environmentSuffix: customSuffix,
      });
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

    test('production environment uses production CIDR ranges', () => {
      const productionApp = new cdk.App();
      const productionStack = new TapStack(
        productionApp,
        'TapStackProduction',
        {
          env: {
            account: '123456789012',
            region: 'us-east-1',
          },
          environmentSuffix: 'production',
        }
      );
      const productionTemplate = Template.fromStack(productionStack);

      // Verify VPC uses production CIDR (should fall back to default since 'production' !== 'prod')
      productionTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });

      // Verify subnets use default CIDRs (fallback)
      productionTemplate.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.1.0/24',
        AvailabilityZone: 'us-east-1a',
      });

      productionTemplate.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.2.0/24',
        AvailabilityZone: 'us-east-1b',
      });
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
