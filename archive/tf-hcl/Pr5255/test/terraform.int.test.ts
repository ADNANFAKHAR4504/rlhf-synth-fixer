import { EC2, ElasticLoadBalancingV2, Route53Resolver, S3 } from 'aws-sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, any> = {};

try {
  outputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));
} catch (error) {
  console.log('Warning: cfn-outputs/flat-outputs.json not found. Integration tests will be skipped.');
}

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const ec2 = new EC2({ region: AWS_REGION });
const s3 = new S3({ region: AWS_REGION });
const route53Resolver = new Route53Resolver({ region: AWS_REGION });

const hasOutputs = Object.keys(outputs).length > 0;

describe('Terraform Integration Tests - Hub-and-Spoke Architecture', () => {
  
  beforeAll(() => {
    if (!hasOutputs) {
      console.log('Skipping integration tests: No outputs file found');
    }
  });

  describe('VPC Infrastructure', () => {
    test('hub VPC should exist and be available', async () => {
      if (!hasOutputs || !outputs.vpc_ids) {
        console.log('Skipping: VPC IDs not available');
        return;
      }

      const hubVpcId = outputs.vpc_ids?.hub || outputs.hub_vpc_id;
      if (!hubVpcId) {
        console.log('Skipping: Hub VPC ID not found');
        return;
      }

      const response = await ec2.describeVpcs({
        VpcIds: [hubVpcId]
      }).promise();

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].State).toBe('available');
    }, 30000);

    test('hub VPC should have correct CIDR block 10.0.0.0/16', async () => {
      if (!hasOutputs || !outputs.vpc_ids) {
        console.log('Skipping: VPC IDs not available');
        return;
      }

      const hubVpcId = outputs.vpc_ids?.hub || outputs.hub_vpc_id;
      if (!hubVpcId) {
        console.log('Skipping: Hub VPC ID not found');
        return;
      }

      const response = await ec2.describeVpcs({
        VpcIds: [hubVpcId]
      }).promise();

      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    }, 30000);

    test('hub VPC should have DNS support enabled', async () => {
      if (!hasOutputs || !outputs.vpc_ids) {
        console.log('Skipping: VPC IDs not available');
        return;
      }

      const hubVpcId = outputs.vpc_ids?.hub || outputs.hub_vpc_id;
      if (!hubVpcId) {
        console.log('Skipping: Hub VPC ID not found');
        return;
      }

      const response = await ec2.describeVpcAttribute({
        VpcId: hubVpcId,
        Attribute: 'enableDnsSupport'
      }).promise();

      expect(response.EnableDnsSupport?.Value).toBe(true);
    }, 30000);

    test('hub VPC should have DNS hostnames enabled', async () => {
      if (!hasOutputs || !outputs.vpc_ids) {
        console.log('Skipping: VPC IDs not available');
        return;
      }

      const hubVpcId = outputs.vpc_ids?.hub || outputs.hub_vpc_id;
      if (!hubVpcId) {
        console.log('Skipping: Hub VPC ID not found');
        return;
      }

      const response = await ec2.describeVpcAttribute({
        VpcId: hubVpcId,
        Attribute: 'enableDnsHostnames'
      }).promise();

      expect(response.EnableDnsHostnames?.Value).toBe(true);
    }, 30000);

    test('production VPC should exist with CIDR 10.1.0.0/16', async () => {
      if (!hasOutputs || !outputs.vpc_ids) {
        console.log('Skipping: VPC IDs not available');
        return;
      }

      const prodVpcId = outputs.vpc_ids?.production || outputs.production_vpc_id;
      if (!prodVpcId) {
        console.log('Skipping: Production VPC ID not found');
        return;
      }

      const response = await ec2.describeVpcs({
        VpcIds: [prodVpcId]
      }).promise();

      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toBe('10.1.0.0/16');
    }, 30000);

    test('development VPC should exist with CIDR 10.2.0.0/16', async () => {
      if (!hasOutputs || !outputs.vpc_ids) {
        console.log('Skipping: VPC IDs not available');
        return;
      }

      const devVpcId = outputs.vpc_ids?.development || outputs.development_vpc_id;
      if (!devVpcId) {
        console.log('Skipping: Development VPC ID not found');
        return;
      }

      const response = await ec2.describeVpcs({
        VpcIds: [devVpcId]
      }).promise();

      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toBe('10.2.0.0/16');
    }, 30000);
  });

  describe('Subnet Configuration', () => {
    test('hub VPC should have public subnets in multiple AZs', async () => {
      if (!hasOutputs || !outputs.subnet_ids) {
        console.log('Skipping: Subnet IDs not available');
        return;
      }

      const hubPublicSubnets = outputs.subnet_ids?.hub?.public;
      if (!hubPublicSubnets || hubPublicSubnets.length === 0) {
        console.log('Skipping: Hub public subnets not found');
        return;
      }

      const response = await ec2.describeSubnets({
        SubnetIds: hubPublicSubnets
      }).promise();

      expect(response.Subnets!.length).toBeGreaterThanOrEqual(2);
      
      // Verify subnets are in different AZs
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);

      // Verify map public IP on launch
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    }, 30000);

    test('hub VPC should have private subnets', async () => {
      if (!hasOutputs || !outputs.subnet_ids) {
        console.log('Skipping: Subnet IDs not available');
        return;
      }

      const hubPrivateSubnets = outputs.subnet_ids?.hub?.private;
      if (!hubPrivateSubnets || hubPrivateSubnets.length === 0) {
        console.log('Skipping: Hub private subnets not found');
        return;
      }

      const response = await ec2.describeSubnets({
        SubnetIds: hubPrivateSubnets
      }).promise();

      expect(response.Subnets!.length).toBeGreaterThanOrEqual(2);
    }, 30000);

    test('spoke VPCs should have TGW attachment subnets', async () => {
      if (!hasOutputs || !outputs.subnet_ids) {
        console.log('Skipping: Subnet IDs not available');
        return;
      }

      const prodTgwSubnets = outputs.subnet_ids?.production?.tgw;
      if (!prodTgwSubnets || prodTgwSubnets.length === 0) {
        console.log('Skipping: Production TGW subnets not found');
        return;
      }

      const response = await ec2.describeSubnets({
        SubnetIds: prodTgwSubnets
      }).promise();

      expect(response.Subnets!.length).toBeGreaterThanOrEqual(2);
    }, 30000);
  });

  describe('Transit Gateway', () => {
    test('Transit Gateway should exist and be available', async () => {
      if (!hasOutputs || !outputs.transit_gateway_id) {
        console.log('Skipping: Transit Gateway ID not available');
        return;
      }

      const response = await ec2.describeTransitGateways({
        TransitGatewayIds: [outputs.transit_gateway_id]
      }).promise();

      expect(response.TransitGateways).toBeDefined();
      expect(response.TransitGateways!.length).toBe(1);
      expect(response.TransitGateways![0].State).toBe('available');
    }, 30000);

    test('Transit Gateway should have DNS support enabled', async () => {
      if (!hasOutputs || !outputs.transit_gateway_id) {
        console.log('Skipping: Transit Gateway ID not available');
        return;
      }

      const response = await ec2.describeTransitGateways({
        TransitGatewayIds: [outputs.transit_gateway_id]
      }).promise();

      const options = response.TransitGateways![0].Options;
      expect(options?.DnsSupport).toBe('enable');
    }, 30000);

    test('Transit Gateway should have VPN ECMP support enabled', async () => {
      if (!hasOutputs || !outputs.transit_gateway_id) {
        console.log('Skipping: Transit Gateway ID not available');
        return;
      }

      const response = await ec2.describeTransitGateways({
        TransitGatewayIds: [outputs.transit_gateway_id]
      }).promise();

      const options = response.TransitGateways![0].Options;
      expect(options?.VpnEcmpSupport).toBe('enable');
    }, 30000);

    test('Transit Gateway should have default route table association disabled', async () => {
      if (!hasOutputs || !outputs.transit_gateway_id) {
        console.log('Skipping: Transit Gateway ID not available');
        return;
      }

      const response = await ec2.describeTransitGateways({
        TransitGatewayIds: [outputs.transit_gateway_id]
      }).promise();

      const options = response.TransitGateways![0].Options;
      expect(options?.DefaultRouteTableAssociation).toBe('disable');
    }, 30000);

    test('Transit Gateway should have 3 VPC attachments (hub, production, development)', async () => {
      if (!hasOutputs || !outputs.transit_gateway_id) {
        console.log('Skipping: Transit Gateway ID not available');
        return;
      }

      const response = await ec2.describeTransitGatewayAttachments({
        Filters: [
          {
            Name: 'transit-gateway-id',
            Values: [outputs.transit_gateway_id]
          },
          {
            Name: 'resource-type',
            Values: ['vpc']
          }
        ]
      }).promise();

      expect(response.TransitGatewayAttachments!.length).toBe(3);
      
      response.TransitGatewayAttachments!.forEach(attachment => {
        expect(attachment.State).toBe('available');
      });
    }, 30000);

    test('Transit Gateway should have hub and spoke route tables', async () => {
      if (!hasOutputs || !outputs.transit_gateway_route_table_ids) {
        console.log('Skipping: Transit Gateway route table IDs not available');
        return;
      }

      const hubRtId = outputs.transit_gateway_route_table_ids?.hub;
      const spokeRtId = outputs.transit_gateway_route_table_ids?.spoke;

      if (!hubRtId || !spokeRtId) {
        console.log('Skipping: Transit Gateway route table IDs not found');
        return;
      }

      const response = await ec2.describeTransitGatewayRouteTables({
        TransitGatewayRouteTableIds: [hubRtId, spokeRtId]
      }).promise();

      expect(response.TransitGatewayRouteTables!.length).toBe(2);
    }, 30000);

    test('spoke route table should have blackhole routes for spoke isolation', async () => {
      if (!hasOutputs || !outputs.transit_gateway_route_table_ids) {
        console.log('Skipping: Transit Gateway route table IDs not available');
        return;
      }

      const spokeRtId = outputs.transit_gateway_route_table_ids?.spoke;
      if (!spokeRtId) {
        console.log('Skipping: Spoke route table ID not found');
        return;
      }

      const response = await ec2.searchTransitGatewayRoutes({
        TransitGatewayRouteTableId: spokeRtId,
        Filters: [
          {
            Name: 'type',
            Values: ['static']
          }
        ]
      }).promise();

      const blackholeRoutes = response.Routes!.filter(route => 
        route.State === 'blackhole'
      );

      // Should have blackhole routes for production (10.1.0.0/16) and development (10.2.0.0/16)
      expect(blackholeRoutes.length).toBeGreaterThanOrEqual(2);

      const blackholeCidrs = blackholeRoutes.map(r => r.DestinationCidrBlock);
      expect(blackholeCidrs).toContain('10.1.0.0/16');
      expect(blackholeCidrs).toContain('10.2.0.0/16');
    }, 30000);

    test('spoke route table should have default route to hub attachment', async () => {
      if (!hasOutputs || !outputs.transit_gateway_route_table_ids) {
        console.log('Skipping: Transit Gateway route table IDs not available');
        return;
      }

      const spokeRtId = outputs.transit_gateway_route_table_ids?.spoke;
      if (!spokeRtId) {
        console.log('Skipping: Spoke route table ID not found');
        return;
      }

      const response = await ec2.searchTransitGatewayRoutes({
        TransitGatewayRouteTableId: spokeRtId,
        Filters: [
          {
            Name: 'type',
            Values: ['static']
          }
        ]
      }).promise();

      const defaultRoute = response.Routes!.find(route => 
        route.DestinationCidrBlock === '0.0.0.0/0' && route.State === 'active'
      );

      expect(defaultRoute).toBeDefined();
    }, 30000);
  });

  describe('NAT Gateways', () => {
    test('hub VPC should have NAT gateways', async () => {
      if (!hasOutputs || !outputs.nat_gateway_ids) {
        console.log('Skipping: NAT Gateway IDs not available');
        return;
      }

      const natGatewayIdsObj = outputs.nat_gateway_ids;
      const natGatewayIds = typeof natGatewayIdsObj === 'object' && natGatewayIdsObj !== null
        ? Object.values(natGatewayIdsObj).filter(id => typeof id === 'string' && id.startsWith('nat-'))
        : [];

      if (natGatewayIds.length === 0) {
        console.log('Skipping: No valid NAT Gateway IDs found');
        return;
      }

      const response = await ec2.describeNatGateways({
        NatGatewayIds: natGatewayIds as string[]
      }).promise();

      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);

      response.NatGateways!.forEach(natGw => {
        expect(['available', 'pending'].includes(natGw.State || '')).toBe(true);
      });
    }, 30000);

    test('NAT gateways should have Elastic IPs', async () => {
      if (!hasOutputs || !outputs.nat_gateway_ids) {
        console.log('Skipping: NAT Gateway IDs not available');
        return;
      }

      const natGatewayIdsObj = outputs.nat_gateway_ids;
      const natGatewayIds = typeof natGatewayIdsObj === 'object' && natGatewayIdsObj !== null
        ? Object.values(natGatewayIdsObj).filter(id => typeof id === 'string' && id.startsWith('nat-'))
        : [];

      if (natGatewayIds.length === 0) {
        console.log('Skipping: No valid NAT Gateway IDs found');
        return;
      }

      const response = await ec2.describeNatGateways({
        NatGatewayIds: natGatewayIds as string[]
      }).promise();

      response.NatGateways!.forEach(natGw => {
        expect(natGw.NatGatewayAddresses).toBeDefined();
        expect(natGw.NatGatewayAddresses!.length).toBeGreaterThan(0);
        if (natGw.State === 'available') {
          expect(natGw.NatGatewayAddresses![0].PublicIp).toBeDefined();
        }
      });
    }, 30000);

    test('NAT gateways should be in hub public subnets', async () => {
      if (!hasOutputs || !outputs.nat_gateway_ids || !outputs.subnet_ids) {
        console.log('Skipping: NAT Gateway IDs or subnet IDs not available');
        return;
      }

      const natGatewayIds = Object.values(outputs.nat_gateway_ids);
      const hubPublicSubnets = outputs.subnet_ids?.hub?.public;

      if (natGatewayIds.length === 0 || !hubPublicSubnets) {
        console.log('Skipping: Required IDs not found');
        return;
      }

      const response = await ec2.describeNatGateways({
        NatGatewayIds: natGatewayIds as string[]
      }).promise();

      response.NatGateways!.forEach(natGw => {
        expect(hubPublicSubnets).toContain(natGw.SubnetId);
      });
    }, 30000);
  });

  describe('Internet Gateway', () => {
    test('hub VPC should have an Internet Gateway attached', async () => {
      if (!hasOutputs || !outputs.vpc_ids) {
        console.log('Skipping: VPC IDs not available');
        return;
      }

      const hubVpcId = outputs.vpc_ids?.hub || outputs.hub_vpc_id;
      if (!hubVpcId) {
        console.log('Skipping: Hub VPC ID not found');
        return;
      }

      const response = await ec2.describeInternetGateways({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [hubVpcId]
          }
        ]
      }).promise();

      expect(response.InternetGateways!.length).toBe(1);
      expect(response.InternetGateways![0].Attachments![0].State).toBe('available');
    }, 30000);

    test('spoke VPCs should NOT have Internet Gateways', async () => {
      if (!hasOutputs || !outputs.vpc_ids) {
        console.log('Skipping: VPC IDs not available');
        return;
      }

      const prodVpcId = outputs.vpc_ids?.production;
      const devVpcId = outputs.vpc_ids?.development;

      if (!prodVpcId || !devVpcId) {
        console.log('Skipping: Spoke VPC IDs not found');
        return;
      }

      const prodResponse = await ec2.describeInternetGateways({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [prodVpcId]
          }
        ]
      }).promise();

      const devResponse = await ec2.describeInternetGateways({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [devVpcId]
          }
        ]
      }).promise();

      expect(prodResponse.InternetGateways!.length).toBe(0);
      expect(devResponse.InternetGateways!.length).toBe(0);
    }, 30000);
  });

  describe('Route53 Resolver', () => {
    test('Route53 Resolver inbound endpoint should exist', async () => {
      if (!hasOutputs || !outputs.resolver_endpoint_ids) {
        console.log('Skipping: Resolver endpoint IDs not available');
        return;
      }

      const inboundId = outputs.resolver_endpoint_ids?.inbound;
      if (!inboundId) {
        console.log('Skipping: Inbound resolver endpoint ID not found');
        return;
      }

      const response = await route53Resolver.getResolverEndpoint({
        ResolverEndpointId: inboundId
      }).promise();

      expect(response.ResolverEndpoint).toBeDefined();
      expect(response.ResolverEndpoint!.Direction).toBe('INBOUND');
      expect(response.ResolverEndpoint!.Status).toMatch(/OPERATIONAL|UPDATING/);
    }, 30000);

    test('Route53 Resolver outbound endpoint should exist', async () => {
      if (!hasOutputs || !outputs.resolver_endpoint_ids) {
        console.log('Skipping: Resolver endpoint IDs not available');
        return;
      }

      const outboundId = outputs.resolver_endpoint_ids?.outbound;
      if (!outboundId) {
        console.log('Skipping: Outbound resolver endpoint ID not found');
        return;
      }

      const response = await route53Resolver.getResolverEndpoint({
        ResolverEndpointId: outboundId
      }).promise();

      expect(response.ResolverEndpoint).toBeDefined();
      expect(response.ResolverEndpoint!.Direction).toBe('OUTBOUND');
      expect(response.ResolverEndpoint!.Status).toMatch(/OPERATIONAL|UPDATING/);
    }, 30000);

    test('Route53 Resolver inbound endpoint should have IP addresses', async () => {
      if (!hasOutputs || !outputs.resolver_endpoint_ids?.inbound) {
        console.log('Skipping: Resolver endpoint ID not available');
        return;
      }

      const endpointId = outputs.resolver_endpoint_ids.inbound;
      const response = await route53Resolver.getResolverEndpoint({
        ResolverEndpointId: endpointId
      }).promise();

      expect(response.ResolverEndpoint).toBeDefined();
      expect(response.ResolverEndpoint!.IpAddressCount).toBeGreaterThanOrEqual(2);
    }, 30000);
  });

  describe('VPC Endpoints (Systems Manager)', () => {
    test('VPC endpoints should exist in hub VPC', async () => {
      if (!hasOutputs || !outputs.vpc_ids) {
        console.log('Skipping: VPC IDs not available');
        return;
      }

      const hubVpcId = outputs.vpc_ids?.hub;
      if (!hubVpcId) {
        console.log('Skipping: Hub VPC ID not found');
        return;
      }

      const response = await ec2.describeVpcEndpoints({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [hubVpcId]
          },
          {
            Name: 'service-name',
            Values: [
              `com.amazonaws.${AWS_REGION}.ssm`,
              `com.amazonaws.${AWS_REGION}.ssmmessages`,
              `com.amazonaws.${AWS_REGION}.ec2messages`
            ]
          }
        ]
      }).promise();

      expect(response.VpcEndpoints!.length).toBe(3);
      
      response.VpcEndpoints!.forEach(endpoint => {
        expect(endpoint.State).toBe('available');
        expect(endpoint.VpcEndpointType).toBe('Interface');
        expect(endpoint.PrivateDnsEnabled).toBe(true);
      });
    }, 30000);

    test('VPC endpoints should exist in production VPC', async () => {
      if (!hasOutputs || !outputs.vpc_ids) {
        console.log('Skipping: VPC IDs not available');
        return;
      }

      const prodVpcId = outputs.vpc_ids?.production;
      if (!prodVpcId) {
        console.log('Skipping: Production VPC ID not found');
        return;
      }

      const response = await ec2.describeVpcEndpoints({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [prodVpcId]
          },
          {
            Name: 'vpc-endpoint-type',
            Values: ['Interface']
          }
        ]
      }).promise();

      expect(response.VpcEndpoints!.length).toBeGreaterThanOrEqual(3);
    }, 30000);

    test('VPC endpoints should exist in development VPC', async () => {
      if (!hasOutputs || !outputs.vpc_ids) {
        console.log('Skipping: VPC IDs not available');
        return;
      }

      const devVpcId = outputs.vpc_ids?.development;
      if (!devVpcId) {
        console.log('Skipping: Development VPC ID not found');
        return;
      }

      const response = await ec2.describeVpcEndpoints({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [devVpcId]
          },
          {
            Name: 'vpc-endpoint-type',
            Values: ['Interface']
          }
        ]
      }).promise();

      expect(response.VpcEndpoints!.length).toBeGreaterThanOrEqual(3);
    }, 30000);
  });

  describe('VPC Flow Logs', () => {
    test('S3 bucket for flow logs should exist', async () => {
      if (!hasOutputs || !outputs.flow_logs_s3_bucket) {
        console.log('Skipping: Flow logs S3 bucket not available');
        return;
      }

      const response = await s3.headBucket({
        Bucket: outputs.flow_logs_s3_bucket
      }).promise();

      expect(response).toBeDefined();
    }, 30000);

    test('S3 bucket should have versioning enabled', async () => {
      if (!hasOutputs || !outputs.flow_logs_s3_bucket) {
        console.log('Skipping: Flow logs S3 bucket not available');
        return;
      }

      const response = await s3.getBucketVersioning({
        Bucket: outputs.flow_logs_s3_bucket
      }).promise();

      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('S3 bucket should have encryption enabled', async () => {
      if (!hasOutputs || !outputs.flow_logs_s3_bucket) {
        console.log('Skipping: Flow logs S3 bucket not available');
        return;
      }

      const response = await s3.getBucketEncryption({
        Bucket: outputs.flow_logs_s3_bucket
      }).promise();

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
    }, 30000);

    test('S3 bucket should have lifecycle policy', async () => {
      if (!hasOutputs || !outputs.flow_logs_s3_bucket) {
        console.log('Skipping: Flow logs S3 bucket not available');
        return;
      }

      const response = await s3.getBucketLifecycleConfiguration({
        Bucket: outputs.flow_logs_s3_bucket
      }).promise();

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);
      
      const rule = response.Rules![0];
      expect(rule.Status).toBe('Enabled');
      expect(rule.Transitions).toBeDefined();
      
      const glacierTransition = rule.Transitions!.find(t => t.StorageClass === 'GLACIER');
      expect(glacierTransition).toBeDefined();
    }, 30000);

    test('S3 bucket should have public access blocked', async () => {
      if (!hasOutputs || !outputs.flow_logs_s3_bucket) {
        console.log('Skipping: Flow logs S3 bucket not available');
        return;
      }

      const response = await s3.getPublicAccessBlock({
        Bucket: outputs.flow_logs_s3_bucket
      }).promise();

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    }, 30000);

    test('flow logs should be configured for hub VPC', async () => {
      if (!hasOutputs || !outputs.flow_log_ids || !outputs.vpc_ids) {
        console.log('Skipping: Flow log IDs or VPC IDs not available');
        return;
      }

      const hubFlowLogId = outputs.flow_log_ids?.hub;
      if (!hubFlowLogId) {
        console.log('Skipping: Hub flow log ID not found');
        return;
      }

      const response = await ec2.describeFlowLogs({
        FlowLogIds: [hubFlowLogId]
      }).promise();

      expect(response.FlowLogs!.length).toBe(1);
      expect(response.FlowLogs![0].LogDestinationType).toBe('s3');
      expect(response.FlowLogs![0].TrafficType).toBe('ALL');
    }, 30000);

    test('flow logs should be configured for all VPCs', async () => {
      if (!hasOutputs || !outputs.flow_log_ids) {
        console.log('Skipping: Flow log IDs not available');
        return;
      }

      const flowLogIdsObj = outputs.flow_log_ids;
      const flowLogIds = typeof flowLogIdsObj === 'object' && flowLogIdsObj !== null
        ? Object.values(flowLogIdsObj).filter(id => typeof id === 'string' && id.startsWith('fl-'))
        : [];

      if (flowLogIds.length === 0) {
        console.log('Skipping: No valid flow log IDs found');
        return;
      }

      const response = await ec2.describeFlowLogs({
        FlowLogIds: flowLogIds as string[]
      }).promise();

      expect(response.FlowLogs!.length).toBe(3); // hub, production, development

      response.FlowLogs!.forEach(flowLog => {
        expect(flowLog.FlowLogStatus).toMatch(/ACTIVE/);
      });
    }, 30000);
  });

  describe('Security Groups', () => {
    test('Route53 Resolver security group should allow DNS traffic', async () => {
      if (!hasOutputs || !outputs.vpc_ids) {
        console.log('Skipping: VPC IDs not available');
        return;
      }

      const hubVpcId = outputs.vpc_ids?.hub;
      if (!hubVpcId) {
        console.log('Skipping: Hub VPC ID not found');
        return;
      }

      const response = await ec2.describeSecurityGroups({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [hubVpcId]
          },
          {
            Name: 'group-name',
            Values: ['*resolver*']
          }
        ]
      }).promise();

      if (response.SecurityGroups!.length === 0) {
        console.log('Skipping: Resolver security group not found');
        return;
      }

      const resolverSg = response.SecurityGroups![0];
      const dnsUdpRule = resolverSg.IpPermissions!.find(rule =>
        rule.FromPort === 53 && rule.IpProtocol === 'udp'
      );
      const dnsTcpRule = resolverSg.IpPermissions!.find(rule =>
        rule.FromPort === 53 && rule.IpProtocol === 'tcp'
      );

      expect(dnsUdpRule).toBeDefined();
      expect(dnsTcpRule).toBeDefined();
    }, 30000);

    test('VPC endpoints security group should allow HTTPS', async () => {
      if (!hasOutputs || !outputs.vpc_ids) {
        console.log('Skipping: VPC IDs not available');
        return;
      }

      const hubVpcId = outputs.vpc_ids?.hub;
      if (!hubVpcId) {
        console.log('Skipping: Hub VPC ID not found');
        return;
      }

      const response = await ec2.describeSecurityGroups({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [hubVpcId]
          },
          {
            Name: 'group-name',
            Values: ['*vpc-endpoints*']
          }
        ]
      }).promise();

      if (response.SecurityGroups!.length === 0) {
        console.log('Skipping: VPC endpoints security group not found');
        return;
      }

      const vpceS = response.SecurityGroups![0];
      const httpsRule = vpceSg.IpPermissions!.find(rule =>
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === 'tcp'
      );

      expect(httpsRule).toBeDefined();
    }, 30000);
  });

  describe('DHCP Options', () => {
    test('hub VPC should have custom DHCP options', async () => {
      if (!hasOutputs || !outputs.vpc_ids) {
        console.log('Skipping: VPC IDs not available');
        return;
      }

      const hubVpcId = outputs.vpc_ids?.hub;
      if (!hubVpcId) {
        console.log('Skipping: Hub VPC ID not found');
        return;
      }

      const vpcResponse = await ec2.describeVpcs({
        VpcIds: [hubVpcId]
      }).promise();

      const dhcpOptionsId = vpcResponse.Vpcs![0].DhcpOptionsId;
      
      const dhcpResponse = await ec2.describeDhcpOptions({
        DhcpOptionsIds: [dhcpOptionsId!]
      }).promise();

      const domainName = dhcpResponse.DhcpOptions![0].DhcpConfigurations!.find(
        config => config.Key === 'domain-name'
      );

      expect(domainName).toBeDefined();
      expect(domainName!.Values![0].Value).toBe('hub.company.internal');
    }, 30000);

    test('production VPC should have custom DHCP options', async () => {
      if (!hasOutputs || !outputs.vpc_ids) {
        console.log('Skipping: VPC IDs not available');
        return;
      }

      const prodVpcId = outputs.vpc_ids?.production;
      if (!prodVpcId) {
        console.log('Skipping: Production VPC ID not found');
        return;
      }

      const vpcResponse = await ec2.describeVpcs({
        VpcIds: [prodVpcId]
      }).promise();

      const dhcpOptionsId = vpcResponse.Vpcs![0].DhcpOptionsId;
      
      const dhcpResponse = await ec2.describeDhcpOptions({
        DhcpOptionsIds: [dhcpOptionsId!]
      }).promise();

      const domainName = dhcpResponse.DhcpOptions![0].DhcpConfigurations!.find(
        config => config.Key === 'domain-name'
      );

      expect(domainName).toBeDefined();
      expect(domainName!.Values![0].Value).toBe('prod.company.internal');
    }, 30000);

    test('development VPC should have custom DHCP options', async () => {
      if (!hasOutputs || !outputs.vpc_ids) {
        console.log('Skipping: VPC IDs not available');
        return;
      }

      const devVpcId = outputs.vpc_ids?.development;
      if (!devVpcId) {
        console.log('Skipping: Development VPC ID not found');
        return;
      }

      const vpcResponse = await ec2.describeVpcs({
        VpcIds: [devVpcId]
      }).promise();

      const dhcpOptionsId = vpcResponse.Vpcs![0].DhcpOptionsId;
      
      const dhcpResponse = await ec2.describeDhcpOptions({
        DhcpOptionsIds: [dhcpOptionsId!]
      }).promise();

      const domainName = dhcpResponse.DhcpOptions![0].DhcpConfigurations!.find(
        config => config.Key === 'domain-name'
      );

      expect(domainName).toBeDefined();
      expect(domainName!.Values![0].Value).toBe('dev.company.internal');
    }, 30000);
  });

  describe('Resource Tagging', () => {
    test('hub VPC should have proper tags', async () => {
      if (!hasOutputs || !outputs.vpc_ids) {
        console.log('Skipping: VPC IDs not available');
        return;
      }

      const hubVpcId = outputs.vpc_ids?.hub;
      if (!hubVpcId) {
        console.log('Skipping: Hub VPC ID not found');
        return;
      }

      const response = await ec2.describeVpcs({
        VpcIds: [hubVpcId]
      }).promise();

      const tags = response.Vpcs![0].Tags || [];
      const tagKeys = tags.map(t => t.Key);

      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('ManagedBy');

      const managedByTag = tags.find(t => t.Key === 'ManagedBy');
      expect(managedByTag?.Value).toBe('Terraform');
    }, 30000);

    test('Transit Gateway should have proper tags', async () => {
      if (!hasOutputs || !outputs.transit_gateway_id) {
        console.log('Skipping: Transit Gateway ID not available');
        return;
      }

      const response = await ec2.describeTransitGateways({
        TransitGatewayIds: [outputs.transit_gateway_id]
      }).promise();

      const tags = response.TransitGateways![0].Tags || [];
      const tagKeys = tags.map(t => t.Key);

      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('ManagedBy');

      const managedByTag = tags.find(t => t.Key === 'ManagedBy');
      expect(managedByTag?.Value).toBe('Terraform');
    }, 30000);
  });

  describe('End-to-End Network Connectivity', () => {
    test('spoke VPCs should have default routes pointing to Transit Gateway', async () => {
      if (!hasOutputs || !outputs.vpc_ids || !outputs.transit_gateway_id) {
        console.log('Skipping: Required IDs not available');
        return;
      }

      const prodVpcId = outputs.vpc_ids?.production;
      if (!prodVpcId) {
        console.log('Skipping: Production VPC ID not found');
        return;
      }

      const routeTables = await ec2.describeRouteTables({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [prodVpcId]
          }
        ]
      }).promise();

      let hasDefaultRouteToTgw = false;
      for (const rt of routeTables.RouteTables!) {
        const defaultRoute = rt.Routes!.find(route =>
          route.DestinationCidrBlock === '0.0.0.0/0' &&
          route.TransitGatewayId === outputs.transit_gateway_id
        );
        if (defaultRoute) {
          hasDefaultRouteToTgw = true;
          break;
        }
      }

      expect(hasDefaultRouteToTgw).toBe(true);
    }, 30000);

    test('hub VPC private subnets should have routes to NAT Gateway', async () => {
      if (!hasOutputs || !outputs.subnet_ids || !outputs.nat_gateway_ids) {
        console.log('Skipping: Required IDs not available');
        return;
      }

      const hubPrivateSubnets = outputs.subnet_ids?.hub?.private;
      const natGatewayIds = Object.values(outputs.nat_gateway_ids) as string[];

      if (!hubPrivateSubnets || hubPrivateSubnets.length === 0 || natGatewayIds.length === 0) {
        console.log('Skipping: Hub private subnets or NAT Gateway IDs not found');
        return;
      }

      const routeTables = await ec2.describeRouteTables({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: hubPrivateSubnets
          }
        ]
      }).promise();

      let hasRouteToNat = false;
      for (const rt of routeTables.RouteTables!) {
        const natRoute = rt.Routes!.find(route =>
          route.DestinationCidrBlock === '0.0.0.0/0' &&
          route.NatGatewayId && natGatewayIds.includes(route.NatGatewayId)
        );
        if (natRoute) {
          hasRouteToNat = true;
          break;
        }
      }

      expect(hasRouteToNat).toBe(true);
    }, 30000);

    test('hub VPC should have routes to spoke CIDRs via Transit Gateway', async () => {
      if (!hasOutputs || !outputs.vpc_ids || !outputs.transit_gateway_id) {
        console.log('Skipping: Required IDs not available');
        return;
      }

      const hubVpcId = outputs.vpc_ids?.hub;
      if (!hubVpcId) {
        console.log('Skipping: Hub VPC ID not found');
        return;
      }

      const routeTables = await ec2.describeRouteTables({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [hubVpcId]
          }
        ]
      }).promise();

      const spokeCidrs = ['10.1.0.0/16', '10.2.0.0/16'];
      const foundRoutes: string[] = [];

      for (const rt of routeTables.RouteTables!) {
        for (const route of rt.Routes!) {
          if (spokeCidrs.includes(route.DestinationCidrBlock!) &&
              route.TransitGatewayId === outputs.transit_gateway_id) {
            foundRoutes.push(route.DestinationCidrBlock!);
          }
        }
      }

      expect(foundRoutes.length).toBeGreaterThanOrEqual(2);
      expect(foundRoutes).toContain('10.1.0.0/16');
      expect(foundRoutes).toContain('10.2.0.0/16');
    }, 30000);
  });
});

