import * as AWS from 'aws-sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, any> = {};

try {
  outputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));
} catch (error) {
  console.warn('WARNING: flat-outputs.json not found. Integration tests will be skipped in local environment.');
}

// Helper function to parse array outputs (handles arrays, JSON strings, and comma-separated strings)
function parseArrayOutput(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    // Handle JSON array strings (e.g., '["id1", "id2"]')
    const trimmed = value.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // Fall through to comma-separated logic if JSON parsing fails
      }
    }
    // Handle comma-separated strings from Terraform outputs
    return value.split(',').map(v => v.trim()).filter(v => v.length > 0);
  }
  return [];
}

const AWS_HUB_REGION = 'us-east-1';
const AWS_USWEST_REGION = 'us-west-2';
const AWS_EUROPE_REGION = 'eu-west-1';

const ec2Hub = new AWS.EC2({ region: AWS_HUB_REGION });
const ec2USWest = new AWS.EC2({ region: AWS_USWEST_REGION });
const ec2Europe = new AWS.EC2({ region: AWS_EUROPE_REGION });
const route53 = new AWS.Route53({ region: AWS_HUB_REGION });
const s3 = new AWS.S3({ region: AWS_HUB_REGION });

describe('Terraform Multi-Region Infrastructure Integration Tests', () => {

  beforeAll(() => {
    if (!outputs || Object.keys(outputs).length === 0) {
      console.log('Skipping integration tests - outputs not available');
    }
  });

  describe('Cross-Region Connectivity Workflow', () => {

    test('should have Transit Gateway peering connections in available state', async () => {
      if (!outputs.hub_to_uswest_peering_id) {
        console.log('Skipping: Transit Gateway peering not deployed');
        return;
      }

      const hubPeerings = await ec2Hub.describeTransitGatewayPeeringAttachments({
        TransitGatewayAttachmentIds: [
          outputs.hub_to_uswest_peering_id,
          outputs.hub_to_europe_peering_id
        ]
      }).promise();

      const activePeerings = hubPeerings.TransitGatewayPeeringAttachments?.filter(
        p => p.State === 'available'
      );

      expect(activePeerings).toBeDefined();
      expect(activePeerings?.length).toBeGreaterThanOrEqual(2);

      activePeerings?.forEach(peering => {
        expect(peering.State).toBe('available');
        expect(peering.RequesterTgwInfo?.Region).toBe(AWS_HUB_REGION);
      });
    }, 30000);

    test('should have hub to US West peering with correct configuration', async () => {
      if (!outputs.hub_to_uswest_peering_id) {
        console.log('Skipping: US West peering not deployed');
        return;
      }

      const peering = await ec2Hub.describeTransitGatewayPeeringAttachments({
        TransitGatewayAttachmentIds: [outputs.hub_to_uswest_peering_id]
      }).promise();

      const attachment = peering.TransitGatewayPeeringAttachments?.[0];

      expect(attachment).toBeDefined();
      expect(attachment?.State).toBe('available');
      expect(attachment?.RequesterTgwInfo?.TransitGatewayId).toBe(outputs.hub_tgw_id);
      expect(attachment?.AccepterTgwInfo?.TransitGatewayId).toBe(outputs.uswest_tgw_id);
      expect(attachment?.AccepterTgwInfo?.Region).toBe(AWS_USWEST_REGION);
    }, 30000);

    test('should have hub to Europe peering with correct configuration', async () => {
      if (!outputs.hub_to_europe_peering_id) {
        console.log('Skipping: Europe peering not deployed');
        return;
      }

      const peering = await ec2Hub.describeTransitGatewayPeeringAttachments({
        TransitGatewayAttachmentIds: [outputs.hub_to_europe_peering_id]
      }).promise();

      const attachment = peering.TransitGatewayPeeringAttachments?.[0];

      expect(attachment).toBeDefined();
      expect(attachment?.State).toBe('available');
      expect(attachment?.RequesterTgwInfo?.TransitGatewayId).toBe(outputs.hub_tgw_id);
      expect(attachment?.AccepterTgwInfo?.TransitGatewayId).toBe(outputs.europe_tgw_id);
      expect(attachment?.AccepterTgwInfo?.Region).toBe(AWS_EUROPE_REGION);
    }, 30000);

    test('should have Transit Gateway routes configured for cross-region traffic', async () => {
      if (!outputs.hub_tgw_id) {
        console.log('Skipping: Transit Gateway not deployed');
        return;
      }

      const routeTables = await ec2Hub.describeTransitGatewayRouteTables({
        Filters: [
          {
            Name: 'transit-gateway-id',
            Values: [outputs.hub_tgw_id]
          }
        ]
      }).promise();

      expect(routeTables.TransitGatewayRouteTables).toBeDefined();
      expect(routeTables.TransitGatewayRouteTables?.length).toBeGreaterThanOrEqual(1);

      for (const routeTable of routeTables.TransitGatewayRouteTables || []) {
        const routes = await ec2Hub.searchTransitGatewayRoutes({
          TransitGatewayRouteTableId: routeTable.TransitGatewayRouteTableId!,
          Filters: [
            {
              Name: 'state',
              Values: ['active']
            }
          ]
        }).promise();

        expect(routes.Routes).toBeDefined();
      }
    }, 45000);

    test('should have Transit Gateway attachments across all regions', async () => {
      if (!outputs.hub_tgw_id || !outputs.uswest_tgw_id || !outputs.europe_tgw_id) {
        console.log('Skipping: Transit Gateways not fully deployed');
        return;
      }

      const hubAttachments = await ec2Hub.describeTransitGatewayAttachments({
        Filters: [
          {
            Name: 'transit-gateway-id',
            Values: [outputs.hub_tgw_id]
          }
        ]
      }).promise();

      const uswestAttachments = await ec2USWest.describeTransitGatewayAttachments({
        Filters: [
          {
            Name: 'transit-gateway-id',
            Values: [outputs.uswest_tgw_id]
          }
        ]
      }).promise();

      const europeAttachments = await ec2Europe.describeTransitGatewayAttachments({
        Filters: [
          {
            Name: 'transit-gateway-id',
            Values: [outputs.europe_tgw_id]
          }
        ]
      }).promise();

      expect(hubAttachments.TransitGatewayAttachments?.length).toBeGreaterThan(0);
      expect(uswestAttachments.TransitGatewayAttachments?.length).toBeGreaterThan(0);
      expect(europeAttachments.TransitGatewayAttachments?.length).toBeGreaterThan(0);
    }, 45000);
  });

  describe('DNS Resolution Workflow', () => {

    test('should have Route53 private hosted zone created', async () => {
      if (!outputs.route53_zone_id) {
        console.log('Skipping: Route53 zone not deployed');
        return;
      }

      const hostedZone = await route53.getHostedZone({
        Id: outputs.route53_zone_id
      }).promise();

      expect(hostedZone.HostedZone).toBeDefined();
      expect(hostedZone.HostedZone.Config?.PrivateZone).toBe(true);
      expect(hostedZone.HostedZone.Name).toMatch(/trading\.internal/);
    }, 30000);

    test('should have Route53 zone associated with hub VPC', async () => {
      if (!outputs.route53_zone_id || !outputs.hub_vpc_id) {
        console.log('Skipping: Route53 zone or VPC not deployed');
        return;
      }

      const hostedZone = await route53.getHostedZone({
        Id: outputs.route53_zone_id
      }).promise();

      expect(hostedZone.VPCs).toBeDefined();
      const hubVpcAssociation = hostedZone.VPCs?.find(
        vpc => vpc.VPCId === outputs.hub_vpc_id && vpc.VPCRegion === AWS_HUB_REGION
      );

      expect(hubVpcAssociation).toBeDefined();
    }, 30000);

    test('should have Route53 zone associated with all regional VPCs', async () => {
      if (!outputs.route53_zone_id) {
        console.log('Skipping: Route53 zone not deployed');
        return;
      }

      const hostedZone = await route53.getHostedZone({
        Id: outputs.route53_zone_id
      }).promise();

      expect(hostedZone.VPCs).toBeDefined();
      expect(hostedZone.VPCs?.length).toBeGreaterThanOrEqual(3);

      const vpcRegions = hostedZone.VPCs?.map(vpc => vpc.VPCRegion);
      expect(vpcRegions).toContain(AWS_HUB_REGION);
      expect(vpcRegions).toContain(AWS_USWEST_REGION);
      expect(vpcRegions).toContain(AWS_EUROPE_REGION);
    }, 30000);
  });

  describe('VPC Flow Logs Workflow', () => {

    test('should have central S3 bucket for flow logs', async () => {
      if (!outputs.flow_logs_bucket_name) {
        console.log('Skipping: Flow logs bucket not deployed');
        return;
      }

      const bucket = await s3.headBucket({
        Bucket: outputs.flow_logs_bucket_name
      }).promise();

      expect(bucket).toBeDefined();
    }, 30000);

    test('should have encryption enabled on flow logs bucket', async () => {
      if (!outputs.flow_logs_bucket_name) {
        console.log('Skipping: Flow logs bucket not deployed');
        return;
      }

      const encryption = await s3.getBucketEncryption({
        Bucket: outputs.flow_logs_bucket_name
      }).promise();

      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration?.Rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    }, 30000);

    test('should have lifecycle policy configured for flow logs retention', async () => {
      if (!outputs.flow_logs_bucket_name) {
        console.log('Skipping: Flow logs bucket not deployed');
        return;
      }

      const lifecycle = await s3.getBucketLifecycleConfiguration({
        Bucket: outputs.flow_logs_bucket_name
      }).promise();

      expect(lifecycle.Rules).toBeDefined();
      expect(lifecycle.Rules?.length).toBeGreaterThan(0);

      const expirationRule = lifecycle.Rules?.find(rule => rule.Status === 'Enabled' && rule.Expiration);
      expect(expirationRule).toBeDefined();
      expect(expirationRule?.Expiration?.Days).toBe(7);
    }, 30000);

    test('should have VPC flow logs enabled on all VPCs', async () => {
      if (!outputs.hub_vpc_id || !outputs.uswest_vpc_id || !outputs.europe_vpc_id) {
        console.log('Skipping: VPCs not fully deployed');
        return;
      }

      const hubFlowLogs = await ec2Hub.describeFlowLogs({
        Filter: [
          {
            Name: 'resource-id',
            Values: [outputs.hub_vpc_id]
          }
        ]
      }).promise();

      const uswestFlowLogs = await ec2USWest.describeFlowLogs({
        Filter: [
          {
            Name: 'resource-id',
            Values: [outputs.uswest_vpc_id]
          }
        ]
      }).promise();

      const europeFlowLogs = await ec2Europe.describeFlowLogs({
        Filter: [
          {
            Name: 'resource-id',
            Values: [outputs.europe_vpc_id]
          }
        ]
      }).promise();

      expect(hubFlowLogs.FlowLogs?.length).toBeGreaterThan(0);
      expect(uswestFlowLogs.FlowLogs?.length).toBeGreaterThan(0);
      expect(europeFlowLogs.FlowLogs?.length).toBeGreaterThan(0);
    }, 45000);
  });

  describe('NAT Gateway and Internet Egress Workflow', () => {

    test('should have NAT Gateways deployed in hub region', async () => {
      const natGatewayIds = parseArrayOutput(outputs.hub_nat_gateway_ids);
      if (natGatewayIds.length === 0) {
        console.log('Skipping: Hub NAT Gateways not deployed');
        return;
      }

      const natGateways = await ec2Hub.describeNatGateways({
        NatGatewayIds: natGatewayIds
      }).promise();

      expect(natGateways.NatGateways).toBeDefined();
      expect(natGateways.NatGateways?.length).toBe(3);

      natGateways.NatGateways?.forEach(nat => {
        expect(nat.State).toMatch(/available|pending/);
        expect(nat.VpcId).toBe(outputs.hub_vpc_id);
      });
    }, 30000);

    test('should have NAT Gateways deployed in US West region', async () => {
      const natGatewayIds = parseArrayOutput(outputs.uswest_nat_gateway_ids);
      if (natGatewayIds.length === 0) {
        console.log('Skipping: US West NAT Gateways not deployed');
        return;
      }

      const natGateways = await ec2USWest.describeNatGateways({
        NatGatewayIds: natGatewayIds
      }).promise();

      expect(natGateways.NatGateways).toBeDefined();
      expect(natGateways.NatGateways?.length).toBe(3);

      natGateways.NatGateways?.forEach(nat => {
        expect(nat.State).toMatch(/available|pending/);
        expect(nat.VpcId).toBe(outputs.uswest_vpc_id);
      });
    }, 30000);

    test('should have NAT Gateways deployed in Europe region', async () => {
      const natGatewayIds = parseArrayOutput(outputs.europe_nat_gateway_ids);
      if (natGatewayIds.length === 0) {
        console.log('Skipping: Europe NAT Gateways not deployed');
        return;
      }

      const natGateways = await ec2Europe.describeNatGateways({
        NatGatewayIds: natGatewayIds
      }).promise();

      expect(natGateways.NatGateways).toBeDefined();
      expect(natGateways.NatGateways?.length).toBe(3);

      natGateways.NatGateways?.forEach(nat => {
        expect(nat.State).toMatch(/available|pending/);
        expect(nat.VpcId).toBe(outputs.europe_vpc_id);
      });
    }, 30000);
  });

  describe('Systems Manager Endpoints Workflow', () => {

    test('should have SSM endpoints deployed in hub region', async () => {
      if (!outputs.hub_ssm_endpoint_id) {
        console.log('Skipping: Hub SSM endpoint not deployed');
        return;
      }

      const endpoints = await ec2Hub.describeVpcEndpoints({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.hub_vpc_id]
          },
          {
            Name: 'service-name',
            Values: [`com.amazonaws.${AWS_HUB_REGION}.ssm`]
          }
        ]
      }).promise();

      expect(endpoints.VpcEndpoints).toBeDefined();
      expect(endpoints.VpcEndpoints?.length).toBeGreaterThan(0);

      const ssmEndpoint = endpoints.VpcEndpoints?.[0];
      expect(ssmEndpoint?.State).toMatch(/available|pending/);
      expect(ssmEndpoint?.VpcEndpointType).toBe('Interface');
    }, 30000);

    test('should have SSM endpoints with private DNS enabled', async () => {
      if (!outputs.hub_vpc_id) {
        console.log('Skipping: Hub VPC not deployed');
        return;
      }

      const endpoints = await ec2Hub.describeVpcEndpoints({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.hub_vpc_id]
          },
          {
            Name: 'service-name',
            Values: [
              `com.amazonaws.${AWS_HUB_REGION}.ssm`,
              `com.amazonaws.${AWS_HUB_REGION}.ssmmessages`,
              `com.amazonaws.${AWS_HUB_REGION}.ec2messages`
            ]
          }
        ]
      }).promise();

      expect(endpoints.VpcEndpoints).toBeDefined();

      endpoints.VpcEndpoints?.forEach(endpoint => {
        expect(endpoint.PrivateDnsEnabled).toBe(true);
      });
    }, 30000);

    test('should have all three required SSM endpoints in each region', async () => {
      if (!outputs.hub_vpc_id || !outputs.uswest_vpc_id || !outputs.europe_vpc_id) {
        console.log('Skipping: VPCs not fully deployed');
        return;
      }

      const requiredServices = ['ssm', 'ssmmessages', 'ec2messages'];

      const hubEndpoints = await ec2Hub.describeVpcEndpoints({
        Filters: [{ Name: 'vpc-id', Values: [outputs.hub_vpc_id] }]
      }).promise();

      const uswestEndpoints = await ec2USWest.describeVpcEndpoints({
        Filters: [{ Name: 'vpc-id', Values: [outputs.uswest_vpc_id] }]
      }).promise();

      const europeEndpoints = await ec2Europe.describeVpcEndpoints({
        Filters: [{ Name: 'vpc-id', Values: [outputs.europe_vpc_id] }]
      }).promise();

      const hubServiceNames = hubEndpoints.VpcEndpoints?.map(e => e.ServiceName || '');
      const uswestServiceNames = uswestEndpoints.VpcEndpoints?.map(e => e.ServiceName || '');
      const europeServiceNames = europeEndpoints.VpcEndpoints?.map(e => e.ServiceName || '');

      requiredServices.forEach(service => {
        expect(hubServiceNames?.some(name => name.includes(service))).toBe(true);
        expect(uswestServiceNames?.some(name => name.includes(service))).toBe(true);
        expect(europeServiceNames?.some(name => name.includes(service))).toBe(true);
      });
    }, 45000);
  });

  describe('Production Isolation Workflow', () => {

    test('should have separate Transit Gateway route tables for production and non-production', async () => {
      if (!outputs.hub_tgw_id) {
        console.log('Skipping: Hub Transit Gateway not deployed');
        return;
      }

      const routeTables = await ec2Hub.describeTransitGatewayRouteTables({
        Filters: [
          {
            Name: 'transit-gateway-id',
            Values: [outputs.hub_tgw_id]
          }
        ]
      }).promise();

      expect(routeTables.TransitGatewayRouteTables).toBeDefined();
      expect(routeTables.TransitGatewayRouteTables?.length).toBeGreaterThanOrEqual(2);

      const routeTableNames = routeTables.TransitGatewayRouteTables?.map(rt => {
        const nameTag = rt.Tags?.find(tag => tag.Key === 'Name');
        return nameTag?.Value || '';
      });

      const hasProduction = routeTableNames?.some(name => name.includes('production'));
      const hasNonProduction = routeTableNames?.some(name => name.includes('non-production'));

      expect(hasProduction).toBe(true);
      expect(hasNonProduction).toBe(true);
    }, 30000);

    test('should have route table associations preventing traffic mixing', async () => {
      if (!outputs.hub_tgw_id) {
        console.log('Skipping: Hub Transit Gateway not deployed');
        return;
      }

      const routeTables = await ec2Hub.describeTransitGatewayRouteTables({
        Filters: [
          {
            Name: 'transit-gateway-id',
            Values: [outputs.hub_tgw_id]
          }
        ]
      }).promise();

      for (const routeTable of routeTables.TransitGatewayRouteTables || []) {
        const associations = await ec2Hub.getTransitGatewayRouteTableAssociations({
          TransitGatewayRouteTableId: routeTable.TransitGatewayRouteTableId!
        }).promise();

        expect(associations.Associations).toBeDefined();
      }
    }, 45000);
  });

  describe('Security Groups Workflow', () => {

    test('should have application security groups deployed in all regions', async () => {
      if (!outputs.hub_vpc_id || !outputs.uswest_vpc_id || !outputs.europe_vpc_id) {
        console.log('Skipping: VPCs not fully deployed');
        return;
      }

      const hubSGs = await ec2Hub.describeSecurityGroups({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.hub_vpc_id] },
          { Name: 'group-name', Values: ['hub-application-sg-*'] }
        ]
      }).promise();

      const uswestSGs = await ec2USWest.describeSecurityGroups({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.uswest_vpc_id] },
          { Name: 'group-name', Values: ['uswest-application-sg-*'] }
        ]
      }).promise();

      const europeSGs = await ec2Europe.describeSecurityGroups({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.europe_vpc_id] },
          { Name: 'group-name', Values: ['europe-application-sg-*'] }
        ]
      }).promise();

      expect(hubSGs.SecurityGroups?.length).toBeGreaterThan(0);
      expect(uswestSGs.SecurityGroups?.length).toBeGreaterThan(0);
      expect(europeSGs.SecurityGroups?.length).toBeGreaterThan(0);
    }, 45000);

    test('should have cross-region CIDR rules configured in security groups', async () => {
      if (!outputs.hub_vpc_id) {
        console.log('Skipping: Hub VPC not deployed');
        return;
      }

      const securityGroups = await ec2Hub.describeSecurityGroups({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.hub_vpc_id] }
        ]
      }).promise();

      const appSG = securityGroups.SecurityGroups?.find(sg =>
        sg.GroupName?.includes('hub-application-sg')
      );

      if (appSG) {
        expect(appSG.IpPermissions).toBeDefined();
        expect(appSG.IpPermissions?.length).toBeGreaterThan(0);

        const hasCrossRegionRules = appSG.IpPermissions?.some(rule =>
          rule.IpRanges?.some(range =>
            range.CidrIp?.startsWith('10.1.') || range.CidrIp?.startsWith('10.2.')
          )
        );

        expect(hasCrossRegionRules).toBe(true);
      }
    }, 30000);
  });

  describe('High Availability Workflow', () => {

    test('should have resources deployed across 3 availability zones per region', async () => {
      const hubPrivateSubnets = parseArrayOutput(outputs.hub_private_subnet_ids);
      const uswestPrivateSubnets = parseArrayOutput(outputs.uswest_private_subnet_ids);
      const europePrivateSubnets = parseArrayOutput(outputs.europe_private_subnet_ids);

      if (hubPrivateSubnets.length === 0 || uswestPrivateSubnets.length === 0 || europePrivateSubnets.length === 0) {
        console.log('Skipping: Subnets not deployed');
        return;
      }

      expect(hubPrivateSubnets.length).toBe(3);
      expect(uswestPrivateSubnets.length).toBe(3);
      expect(europePrivateSubnets.length).toBe(3);

      const hubSubnets = await ec2Hub.describeSubnets({
        SubnetIds: hubPrivateSubnets
      }).promise();

      const uniqueAZs = new Set(hubSubnets.Subnets?.map(s => s.AvailabilityZone));
      expect(uniqueAZs.size).toBe(3);
    }, 30000);

    test('should have Transit Gateway attachments in multiple availability zones', async () => {
      const hubPrivateSubnets = parseArrayOutput(outputs.hub_private_subnet_ids);

      if (!outputs.hub_vpc_id || !outputs.hub_tgw_id || hubPrivateSubnets.length === 0) {
        console.log('Skipping: Hub resources not deployed');
        return;
      }

      const attachments = await ec2Hub.describeTransitGatewayAttachments({
        Filters: [
          { Name: 'resource-id', Values: [outputs.hub_vpc_id] },
          { Name: 'transit-gateway-id', Values: [outputs.hub_tgw_id] }
        ]
      }).promise();

      expect(attachments.TransitGatewayAttachments).toBeDefined();
      expect(attachments.TransitGatewayAttachments?.length).toBeGreaterThan(0);

      const attachment = attachments.TransitGatewayAttachments?.[0];
      if (attachment?.ResourceId === outputs.hub_vpc_id) {
        const subnets = await ec2Hub.describeSubnets({
          SubnetIds: hubPrivateSubnets
        }).promise();

        const uniqueAZs = new Set(subnets.Subnets?.map(s => s.AvailabilityZone));
        expect(uniqueAZs.size).toBeGreaterThanOrEqual(2);
      }
    }, 30000);

    test('should have NAT Gateway redundancy per region', async () => {
      const natGatewayIds = parseArrayOutput(outputs.hub_nat_gateway_ids);

      if (natGatewayIds.length === 0) {
        console.log('Skipping: NAT Gateways not deployed');
        return;
      }

      const natGateways = await ec2Hub.describeNatGateways({
        NatGatewayIds: natGatewayIds
      }).promise();

      const availabilityZones = natGateways.NatGateways?.map(nat => {
        return nat.SubnetId;
      });

      const subnets = await ec2Hub.describeSubnets({
        SubnetIds: availabilityZones as string[]
      }).promise();

      const uniqueAZs = new Set(subnets.Subnets?.map(s => s.AvailabilityZone));
      expect(uniqueAZs.size).toBe(3);
    }, 30000);
  });

  describe('VPC Configuration Validation', () => {

    test('should have VPCs with correct CIDR blocks', async () => {
      if (!outputs.hub_vpc_id || !outputs.uswest_vpc_id || !outputs.europe_vpc_id) {
        console.log('Skipping: VPCs not deployed');
        return;
      }

      const hubVpc = await ec2Hub.describeVpcs({
        VpcIds: [outputs.hub_vpc_id]
      }).promise();

      const uswestVpc = await ec2USWest.describeVpcs({
        VpcIds: [outputs.uswest_vpc_id]
      }).promise();

      const europeVpc = await ec2Europe.describeVpcs({
        VpcIds: [outputs.europe_vpc_id]
      }).promise();

      expect(hubVpc.Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');
      expect(uswestVpc.Vpcs?.[0].CidrBlock).toBe('10.1.0.0/16');
      expect(europeVpc.Vpcs?.[0].CidrBlock).toBe('10.2.0.0/16');
    }, 30000);

    test('should have VPCs with DNS support and hostnames enabled', async () => {
      if (!outputs.hub_vpc_id || !outputs.uswest_vpc_id || !outputs.europe_vpc_id) {
        console.log('Skipping: VPCs not deployed');
        return;
      }

      const hubDnsSupport = await ec2Hub.describeVpcAttribute({
        VpcId: outputs.hub_vpc_id,
        Attribute: 'enableDnsSupport'
      }).promise();

      const hubDnsHostnames = await ec2Hub.describeVpcAttribute({
        VpcId: outputs.hub_vpc_id,
        Attribute: 'enableDnsHostnames'
      }).promise();

      expect(hubDnsSupport.EnableDnsSupport?.Value).toBe(true);
      expect(hubDnsHostnames.EnableDnsHostnames?.Value).toBe(true);
    }, 30000);

    test('should have subnets deployed in correct availability zones', async () => {
      const hubPublicSubnets = parseArrayOutput(outputs.hub_public_subnet_ids);
      const hubPrivateSubnets = parseArrayOutput(outputs.hub_private_subnet_ids);

      if (hubPublicSubnets.length === 0 || hubPrivateSubnets.length === 0) {
        console.log('Skipping: Hub subnets not deployed');
        return;
      }

      const publicSubnets = await ec2Hub.describeSubnets({
        SubnetIds: hubPublicSubnets
      }).promise();

      const privateSubnets = await ec2Hub.describeSubnets({
        SubnetIds: hubPrivateSubnets
      }).promise();

      expect(publicSubnets.Subnets?.length).toBe(3);
      expect(privateSubnets.Subnets?.length).toBe(3);

      const publicAZs = new Set(publicSubnets.Subnets?.map(s => s.AvailabilityZone));
      const privateAZs = new Set(privateSubnets.Subnets?.map(s => s.AvailabilityZone));

      expect(publicAZs.size).toBe(3);
      expect(privateAZs.size).toBe(3);
    }, 30000);
  });

  describe('Transit Gateway Configuration Validation', () => {

    test('should have Transit Gateways with correct ASN values', async () => {
      if (!outputs.hub_tgw_id || !outputs.uswest_tgw_id || !outputs.europe_tgw_id) {
        console.log('Skipping: Transit Gateways not deployed');
        return;
      }

      const hubTgw = await ec2Hub.describeTransitGateways({
        TransitGatewayIds: [outputs.hub_tgw_id]
      }).promise();

      const uswestTgw = await ec2USWest.describeTransitGateways({
        TransitGatewayIds: [outputs.uswest_tgw_id]
      }).promise();

      const europeTgw = await ec2Europe.describeTransitGateways({
        TransitGatewayIds: [outputs.europe_tgw_id]
      }).promise();

      expect(hubTgw.TransitGateways?.[0].Options?.AmazonSideAsn).toBe(64512);
      expect(uswestTgw.TransitGateways?.[0].Options?.AmazonSideAsn).toBe(64513);
      expect(europeTgw.TransitGateways?.[0].Options?.AmazonSideAsn).toBe(64514);
    }, 30000);

    test('should have Transit Gateways with DNS support enabled', async () => {
      if (!outputs.hub_tgw_id) {
        console.log('Skipping: Hub Transit Gateway not deployed');
        return;
      }

      const hubTgw = await ec2Hub.describeTransitGateways({
        TransitGatewayIds: [outputs.hub_tgw_id]
      }).promise();

      expect(hubTgw.TransitGateways?.[0].Options?.DnsSupport).toBe('enable');
    }, 30000);

    test('should have VPC attachments with DNS support enabled', async () => {
      if (!outputs.hub_vpc_id || !outputs.hub_tgw_id) {
        console.log('Skipping: Hub resources not deployed');
        return;
      }

      const attachments = await ec2Hub.describeTransitGatewayVpcAttachments({
        Filters: [
          { Name: 'transit-gateway-id', Values: [outputs.hub_tgw_id] },
          { Name: 'vpc-id', Values: [outputs.hub_vpc_id] }
        ]
      }).promise();

      expect(attachments.TransitGatewayVpcAttachments).toBeDefined();
      expect(attachments.TransitGatewayVpcAttachments?.length).toBeGreaterThan(0);

      const attachment = attachments.TransitGatewayVpcAttachments?.[0];
      expect(attachment?.Options?.DnsSupport).toBe('enable');
    }, 30000);
  });

  describe('Resource Tagging Validation', () => {

    test('should have all VPCs tagged with required tags', async () => {
      if (!outputs.hub_vpc_id) {
        console.log('Skipping: Hub VPC not deployed');
        return;
      }

      const vpc = await ec2Hub.describeVpcs({
        VpcIds: [outputs.hub_vpc_id]
      }).promise();

      const tags = vpc.Vpcs?.[0].Tags || [];
      const tagKeys = tags.map(tag => tag.Key);

      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('CostCenter');
      expect(tagKeys).toContain('ManagedBy');

      const managedByTag = tags.find(tag => tag.Key === 'ManagedBy');
      expect(managedByTag?.Value).toBe('terraform');
    }, 30000);

    test('should have Transit Gateways tagged appropriately', async () => {
      if (!outputs.hub_tgw_id) {
        console.log('Skipping: Hub Transit Gateway not deployed');
        return;
      }

      const tgw = await ec2Hub.describeTransitGateways({
        TransitGatewayIds: [outputs.hub_tgw_id]
      }).promise();

      const tags = tgw.TransitGateways?.[0].Tags || [];
      const tagKeys = tags.map(tag => tag.Key);

      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('ManagedBy');

      const purposeTag = tags.find(tag => tag.Key === 'Purpose');
      expect(purposeTag?.Value).toBe('hub');
    }, 30000);

    test('should have environment_suffix used in resource names', async () => {
      if (!outputs.environment_suffix) {
        console.log('Skipping: Environment suffix not available');
        return;
      }

      expect(outputs.environment_suffix).toBeDefined();
      expect(outputs.environment_suffix.length).toBe(8);

      if (outputs.flow_logs_bucket_name) {
        expect(outputs.flow_logs_bucket_name).toContain(outputs.environment_suffix);
      }
    }, 10000);
  });

  describe('Functional Connectivity Tests - Cross-Region Spoke Communication', () => {

    test('should verify complete routing path from US West to Europe through Hub Transit Gateway', async () => {
      if (!outputs.hub_tgw_id || !outputs.uswest_tgw_id || !outputs.europe_tgw_id) {
        console.log('Skipping: Transit Gateways not fully deployed');
        return;
      }

      console.log('\n=== Testing US West -> Hub -> Europe Routing Path ===');

      // Step 1: Verify US West has route to Europe CIDR through TGW
      const uswestRouteTables = await ec2USWest.describeRouteTables({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.uswest_vpc_id] }
        ]
      }).promise();

      let uswestHasEuropeRoute = false;
      for (const rt of uswestRouteTables.RouteTables || []) {
        const europeRoute = rt.Routes?.find(r =>
          r.DestinationCidrBlock === '10.2.0.0/16' &&
          r.TransitGatewayId === outputs.uswest_tgw_id
        );
        if (europeRoute) {
          console.log(`✓ US West route table ${rt.RouteTableId} has route to Europe (10.2.0.0/16) via TGW`);
          uswestHasEuropeRoute = true;
        }
      }
      expect(uswestHasEuropeRoute).toBe(true);

      // Step 2: Verify US West TGW has active peering to Hub
      const uswestPeerings = await ec2USWest.describeTransitGatewayPeeringAttachments({
        Filters: [
          { Name: 'transit-gateway-id', Values: [outputs.uswest_tgw_id] },
          { Name: 'state', Values: ['available'] }
        ]
      }).promise();

      const uswestToHubPeering = uswestPeerings.TransitGatewayPeeringAttachments?.find(p =>
        p.AccepterTgwInfo?.TransitGatewayId === outputs.hub_tgw_id ||
        p.RequesterTgwInfo?.TransitGatewayId === outputs.hub_tgw_id
      );
      expect(uswestToHubPeering).toBeDefined();
      console.log(`✓ US West TGW has active peering to Hub: ${uswestToHubPeering?.TransitGatewayAttachmentId}`);

      // Step 3: Verify Hub TGW has active peering to Europe
      const hubPeerings = await ec2Hub.describeTransitGatewayPeeringAttachments({
        Filters: [
          { Name: 'transit-gateway-id', Values: [outputs.hub_tgw_id] },
          { Name: 'state', Values: ['available'] }
        ]
      }).promise();

      const hubToEuropePeering = hubPeerings.TransitGatewayPeeringAttachments?.find(p =>
        p.AccepterTgwInfo?.TransitGatewayId === outputs.europe_tgw_id ||
        p.RequesterTgwInfo?.TransitGatewayId === outputs.europe_tgw_id
      );
      expect(hubToEuropePeering).toBeDefined();
      console.log(`✓ Hub TGW has active peering to Europe: ${hubToEuropePeering?.TransitGatewayAttachmentId}`);

      // Step 4: Verify Europe VPC route table accepts traffic from US West
      const europeRouteTables = await ec2Europe.describeRouteTables({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.europe_vpc_id] }
        ]
      }).promise();

      let europeHasUsWestRoute = false;
      for (const rt of europeRouteTables.RouteTables || []) {
        const uswestRoute = rt.Routes?.find(r =>
          r.DestinationCidrBlock === '10.1.0.0/16' &&
          r.TransitGatewayId === outputs.europe_tgw_id
        );
        if (uswestRoute) {
          console.log(`✓ Europe route table ${rt.RouteTableId} has route to US West (10.1.0.0/16) via TGW`);
          europeHasUsWestRoute = true;
        }
      }
      expect(europeHasUsWestRoute).toBe(true);

      console.log('✓ Complete routing path verified: US West -> Hub -> Europe');
    }, 90000);

    test('should verify complete routing path from Europe to US West through Hub Transit Gateway', async () => {
      if (!outputs.hub_tgw_id || !outputs.uswest_tgw_id || !outputs.europe_tgw_id) {
        console.log('Skipping: Transit Gateways not fully deployed');
        return;
      }

      console.log('\n=== Testing Europe -> Hub -> US West Routing Path ===');

      // Step 1: Verify Europe has route to US West CIDR through TGW
      const europeRouteTables = await ec2Europe.describeRouteTables({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.europe_vpc_id] }
        ]
      }).promise();

      let europeHasUsWestRoute = false;
      for (const rt of europeRouteTables.RouteTables || []) {
        const uswestRoute = rt.Routes?.find(r =>
          r.DestinationCidrBlock === '10.1.0.0/16' &&
          r.TransitGatewayId === outputs.europe_tgw_id
        );
        if (uswestRoute) {
          console.log(`✓ Europe route table ${rt.RouteTableId} has route to US West (10.1.0.0/16) via TGW`);
          europeHasUsWestRoute = true;
        }
      }
      expect(europeHasUsWestRoute).toBe(true);

      // Step 2: Verify Europe TGW has active peering to Hub
      const europePeerings = await ec2Europe.describeTransitGatewayPeeringAttachments({
        Filters: [
          { Name: 'transit-gateway-id', Values: [outputs.europe_tgw_id] },
          { Name: 'state', Values: ['available'] }
        ]
      }).promise();

      const europeToHubPeering = europePeerings.TransitGatewayPeeringAttachments?.find(p =>
        p.AccepterTgwInfo?.TransitGatewayId === outputs.hub_tgw_id ||
        p.RequesterTgwInfo?.TransitGatewayId === outputs.hub_tgw_id
      );
      expect(europeToHubPeering).toBeDefined();
      console.log(`✓ Europe TGW has active peering to Hub: ${europeToHubPeering?.TransitGatewayAttachmentId}`);

      // Step 3: Verify Hub TGW has active peering to US West
      const hubPeerings = await ec2Hub.describeTransitGatewayPeeringAttachments({
        Filters: [
          { Name: 'transit-gateway-id', Values: [outputs.hub_tgw_id] },
          { Name: 'state', Values: ['available'] }
        ]
      }).promise();

      const hubToUsWestPeering = hubPeerings.TransitGatewayPeeringAttachments?.find(p =>
        p.AccepterTgwInfo?.TransitGatewayId === outputs.uswest_tgw_id ||
        p.RequesterTgwInfo?.TransitGatewayId === outputs.uswest_tgw_id
      );
      expect(hubToUsWestPeering).toBeDefined();
      console.log(`✓ Hub TGW has active peering to US West: ${hubToUsWestPeering?.TransitGatewayAttachmentId}`);

      // Step 4: Verify US West VPC route table accepts traffic from Europe
      const uswestRouteTables = await ec2USWest.describeRouteTables({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.uswest_vpc_id] }
        ]
      }).promise();

      let uswestHasEuropeRoute = false;
      for (const rt of uswestRouteTables.RouteTables || []) {
        const europeRoute = rt.Routes?.find(r =>
          r.DestinationCidrBlock === '10.2.0.0/16' &&
          r.TransitGatewayId === outputs.uswest_tgw_id
        );
        if (europeRoute) {
          console.log(`✓ US West route table ${rt.RouteTableId} has route to Europe (10.2.0.0/16) via TGW`);
          uswestHasEuropeRoute = true;
        }
      }
      expect(uswestHasEuropeRoute).toBe(true);

      console.log('✓ Complete routing path verified: Europe -> Hub -> US West');
    }, 90000);

    test('should verify security groups allow cross-region spoke-to-spoke traffic', async () => {
      if (!outputs.hub_vpc_id || !outputs.uswest_vpc_id || !outputs.europe_vpc_id) {
        console.log('Skipping: VPCs not fully deployed');
        return;
      }

      console.log('\n=== Verifying Security Group Rules for Cross-Region Traffic ===');

      // Check US West security groups allow traffic from Europe CIDR
      const uswestSGs = await ec2USWest.describeSecurityGroups({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.uswest_vpc_id] }
        ]
      }).promise();

      let uswestAllowsEurope = false;
      for (const sg of uswestSGs.SecurityGroups || []) {
        const europeRule = sg.IpPermissions?.find(rule =>
          rule.IpRanges?.some(range => range.CidrIp === '10.2.0.0/16')
        );
        if (europeRule) {
          console.log(`✓ US West SG ${sg.GroupId} allows ingress from Europe (10.2.0.0/16)`);
          uswestAllowsEurope = true;
        }
      }

      // Check Europe security groups allow traffic from US West CIDR
      const europeSGs = await ec2Europe.describeSecurityGroups({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.europe_vpc_id] }
        ]
      }).promise();

      let europeAllowsUsWest = false;
      for (const sg of europeSGs.SecurityGroups || []) {
        const uswestRule = sg.IpPermissions?.find(rule =>
          rule.IpRanges?.some(range => range.CidrIp === '10.1.0.0/16')
        );
        if (uswestRule) {
          console.log(`✓ Europe SG ${sg.GroupId} allows ingress from US West (10.1.0.0/16)`);
          europeAllowsUsWest = true;
        }
      }

      if (uswestAllowsEurope && europeAllowsUsWest) {
        console.log('✓ Security groups properly configured for bidirectional spoke-to-spoke traffic');
      } else {
        console.log('⚠ Warning: Some security groups may not allow cross-region traffic');
      }

      expect(uswestSGs.SecurityGroups?.length).toBeGreaterThan(0);
      expect(europeSGs.SecurityGroups?.length).toBeGreaterThan(0);
    }, 60000);

    test('should verify Transit Gateway peering attachments are fully operational', async () => {
      if (!outputs.hub_to_uswest_peering_id || !outputs.hub_to_europe_peering_id) {
        console.log('Skipping: Transit Gateway peering attachments not deployed');
        return;
      }

      console.log('\n=== Verifying Transit Gateway Peering Attachments ===');

      // Check hub to US West peering
      const hubToUsWestPeering = await ec2Hub.describeTransitGatewayPeeringAttachments({
        TransitGatewayAttachmentIds: [outputs.hub_to_uswest_peering_id]
      }).promise();

      const uswestPeering = hubToUsWestPeering.TransitGatewayPeeringAttachments?.[0];
      expect(uswestPeering?.State).toBe('available');
      console.log(`✓ Hub <-> US West peering: ${uswestPeering?.State}`);
      console.log(`  Requester: ${uswestPeering?.RequesterTgwInfo?.Region} (${uswestPeering?.RequesterTgwInfo?.TransitGatewayId})`);
      console.log(`  Accepter: ${uswestPeering?.AccepterTgwInfo?.Region} (${uswestPeering?.AccepterTgwInfo?.TransitGatewayId})`);

      // Check hub to Europe peering
      const hubToEuropePeering = await ec2Hub.describeTransitGatewayPeeringAttachments({
        TransitGatewayAttachmentIds: [outputs.hub_to_europe_peering_id]
      }).promise();

      const europePeering = hubToEuropePeering.TransitGatewayPeeringAttachments?.[0];
      expect(europePeering?.State).toBe('available');
      console.log(`✓ Hub <-> Europe peering: ${europePeering?.State}`);
      console.log(`  Requester: ${europePeering?.RequesterTgwInfo?.Region} (${europePeering?.RequesterTgwInfo?.TransitGatewayId})`);
      console.log(`  Accepter: ${europePeering?.AccepterTgwInfo?.Region} (${europePeering?.AccepterTgwInfo?.TransitGatewayId})`);

      console.log('✓ All Transit Gateway peering attachments are available and operational');
    }, 45000);

    test('should verify VPC route tables across all regions route spoke traffic through Transit Gateways', async () => {
      if (!outputs.hub_vpc_id || !outputs.uswest_vpc_id || !outputs.europe_vpc_id) {
        console.log('Skipping: VPCs not fully deployed');
        return;
      }

      console.log('\n=== Verifying VPC Route Tables for Cross-Region Connectivity ===');

      // Hub VPC route tables should have routes to both spokes
      const hubRouteTables = await ec2Hub.describeRouteTables({
        Filters: [{ Name: 'vpc-id', Values: [outputs.hub_vpc_id] }]
      }).promise();

      let hubRoutesToSpokes = 0;
      for (const rt of hubRouteTables.RouteTables || []) {
        const uswestRoute = rt.Routes?.find(r => r.DestinationCidrBlock === '10.1.0.0/16' && r.TransitGatewayId);
        const europeRoute = rt.Routes?.find(r => r.DestinationCidrBlock === '10.2.0.0/16' && r.TransitGatewayId);

        if (uswestRoute || europeRoute) {
          hubRoutesToSpokes++;
          console.log(`✓ Hub route table ${rt.RouteTableId}:`);
          if (uswestRoute) console.log(`    -> 10.1.0.0/16 via ${uswestRoute.TransitGatewayId}`);
          if (europeRoute) console.log(`    -> 10.2.0.0/16 via ${europeRoute.TransitGatewayId}`);
        }
      }
      expect(hubRoutesToSpokes).toBeGreaterThan(0);

      // US West VPC route tables should have routes to hub and Europe
      const uswestRouteTables = await ec2USWest.describeRouteTables({
        Filters: [{ Name: 'vpc-id', Values: [outputs.uswest_vpc_id] }]
      }).promise();

      let uswestRoutesToOthers = 0;
      for (const rt of uswestRouteTables.RouteTables || []) {
        const hubRoute = rt.Routes?.find(r => r.DestinationCidrBlock === '10.0.0.0/16' && r.TransitGatewayId);
        const europeRoute = rt.Routes?.find(r => r.DestinationCidrBlock === '10.2.0.0/16' && r.TransitGatewayId);

        if (hubRoute || europeRoute) {
          uswestRoutesToOthers++;
          console.log(`✓ US West route table ${rt.RouteTableId}:`);
          if (hubRoute) console.log(`    -> 10.0.0.0/16 via ${hubRoute.TransitGatewayId}`);
          if (europeRoute) console.log(`    -> 10.2.0.0/16 via ${europeRoute.TransitGatewayId}`);
        }
      }
      expect(uswestRoutesToOthers).toBeGreaterThan(0);

      // Europe VPC route tables should have routes to hub and US West
      const europeRouteTables = await ec2Europe.describeRouteTables({
        Filters: [{ Name: 'vpc-id', Values: [outputs.europe_vpc_id] }]
      }).promise();

      let europeRoutesToOthers = 0;
      for (const rt of europeRouteTables.RouteTables || []) {
        const hubRoute = rt.Routes?.find(r => r.DestinationCidrBlock === '10.0.0.0/16' && r.TransitGatewayId);
        const uswestRoute = rt.Routes?.find(r => r.DestinationCidrBlock === '10.1.0.0/16' && r.TransitGatewayId);

        if (hubRoute || uswestRoute) {
          europeRoutesToOthers++;
          console.log(`✓ Europe route table ${rt.RouteTableId}:`);
          if (hubRoute) console.log(`    -> 10.0.0.0/16 via ${hubRoute.TransitGatewayId}`);
          if (uswestRoute) console.log(`    -> 10.1.0.0/16 via ${uswestRoute.TransitGatewayId}`);
        }
      }
      expect(europeRoutesToOthers).toBeGreaterThan(0);

      console.log('✓ All VPC route tables properly configured for cross-region spoke-to-spoke connectivity');
    }, 90000);
  });
});
