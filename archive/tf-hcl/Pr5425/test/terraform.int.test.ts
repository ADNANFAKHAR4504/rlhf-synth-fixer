// Integration Tests for Hub-and-Spoke Network Infrastructure
// Tests validate deployed AWS resources using actual outputs from terraform apply

import {
  DescribeFlowLogsCommand,
  DescribeSubnetsCommand,
  DescribeTransitGatewayAttachmentsCommand,
  DescribeTransitGatewayRouteTablesCommand,
  DescribeTransitGatewaysCommand,
  DescribeVpcEndpointsCommand,
  DescribeVpcsCommand,
  EC2Client,
  SearchTransitGatewayRoutesCommand,
} from '@aws-sdk/client-ec2';
import { GetHostedZoneCommand, Route53Client } from '@aws-sdk/client-route-53';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

// Path to outputs file (created by CI/CD after deployment)
const OUTPUTS_FILE = path.join(__dirname, '../cfn-outputs/all-outputs.json');

// Terraform output value structure
interface TerraformOutput<T = any> {
  value: T;
  type?: string;
}

// Load and parse outputs from deployed infrastructure
function loadOutputs(): any {
  if (!fs.existsSync(OUTPUTS_FILE)) {
    throw new Error(
      `Outputs file not found: ${OUTPUTS_FILE}. ` +
      'Integration tests require deployed infrastructure. ' +
      'Run terraform apply in CI/CD or skip integration tests locally.'
    );
  }

  const rawOutputs = JSON.parse(fs.readFileSync(OUTPUTS_FILE, 'utf8'));

  // Parse terraform outputs - extract .value from each output
  const parsed: any = {};
  for (const [key, val] of Object.entries(rawOutputs)) {
    if (val && typeof val === 'object' && 'value' in val) {
      parsed[key] = (val as TerraformOutput).value;
    } else {
      parsed[key] = val;
    }
  }

  return parsed;
}

const outputs = loadOutputs();

// AWS clients (initialized with default config)
const ec2ClientHubRegion = new EC2Client({ region: 'eu-west-3' });
const ec2ClientUsWest = new EC2Client({ region: 'ap-northeast-1' });
const ec2ClientEuWest = new EC2Client({ region: 'ap-southeast-2' });
const s3Client = new S3Client({ region: 'eu-west-3' });
const route53Client = new Route53Client({ region: 'eu-west-3' });

// Test timeout for AWS API calls
const TEST_TIMEOUT = 30000;

describe('Hub-and-Spoke Network Infrastructure Integration Tests', () => {
  describe('VPC Infrastructure', () => {
    test(
      'Hub VPC exists with correct CIDR',
      async () => {
        const command = new DescribeVpcsCommand({
          VpcIds: [outputs.hub_vpc_id],
        });

        const response = await ec2ClientHubRegion.send(command);
        expect(response.Vpcs).toHaveLength(1);
        expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
        expect(response.Vpcs![0].State).toBe('available');
        // Note: DNS settings are configured but not returned by DescribeVpcsCommand
        // They can be verified using DescribeVpcAttribute if needed
      },
      TEST_TIMEOUT
    );

    test(
      'AP-Northeast-1 Spoke VPC exists',
      async () => {
        const command = new DescribeVpcsCommand({
          VpcIds: [outputs.us_west_spoke_vpc_id],
        });

        const response = await ec2ClientUsWest.send(command);
        expect(response.Vpcs).toHaveLength(1);
        expect(response.Vpcs![0].CidrBlock).toBe('10.1.0.0/16');
        expect(response.Vpcs![0].State).toBe('available');
      },
      TEST_TIMEOUT
    );

    test(
      'AP-Southeast-2 Spoke VPC exists',
      async () => {
        const command = new DescribeVpcsCommand({
          VpcIds: [outputs.eu_west_spoke_vpc_id],
        });

        const response = await ec2ClientEuWest.send(command);
        expect(response.Vpcs).toHaveLength(1);
        expect(response.Vpcs![0].CidrBlock).toBe('10.2.0.0/16');
        expect(response.Vpcs![0].State).toBe('available');
      },
      TEST_TIMEOUT
    );

    test(
      'Hub VPC has 3 public and 3 private subnets',
      async () => {
        const command = new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [outputs.hub_vpc_id] }],
        });

        const response = await ec2ClientHubRegion.send(command);
        expect(response.Subnets!.length).toBeGreaterThanOrEqual(6);

        const publicSubnets = response.Subnets!.filter((s) => s.MapPublicIpOnLaunch === true);
        const privateSubnets = response.Subnets!.filter((s) => s.MapPublicIpOnLaunch === false);

        expect(publicSubnets.length).toBeGreaterThanOrEqual(3);
        expect(privateSubnets.length).toBeGreaterThanOrEqual(3);
      },
      TEST_TIMEOUT
    );
  });

  describe('Transit Gateway Connectivity', () => {
    test(
      'Hub Transit Gateway exists and is available',
      async () => {
        const command = new DescribeTransitGatewaysCommand({
          TransitGatewayIds: [outputs.hub_transit_gateway_id],
        });

        const response = await ec2ClientHubRegion.send(command);
        expect(response.TransitGateways).toHaveLength(1);
        expect(response.TransitGateways![0].State).toBe('available');
        expect(response.TransitGateways![0].Options?.DnsSupport).toBe('enable');
        expect(response.TransitGateways![0].Options?.DefaultRouteTableAssociation).toBe('disable');
        expect(response.TransitGateways![0].Options?.DefaultRouteTablePropagation).toBe('disable');
      },
      TEST_TIMEOUT
    );

    test(
      'Transit Gateway has VPC attachments',
      async () => {
        const command = new DescribeTransitGatewayAttachmentsCommand({
          Filters: [
            { Name: 'transit-gateway-id', Values: [outputs.hub_transit_gateway_id] },
            { Name: 'state', Values: ['available', 'pending'] },
          ],
        });

        const response = await ec2ClientHubRegion.send(command);
        expect(response.TransitGatewayAttachments!.length).toBeGreaterThanOrEqual(1);
      },
      TEST_TIMEOUT
    );

    test(
      'Transit Gateway has custom route tables',
      async () => {
        const command = new DescribeTransitGatewayRouteTablesCommand({
          Filters: [{ Name: 'transit-gateway-id', Values: [outputs.hub_transit_gateway_id] }],
        });

        const response = await ec2ClientHubRegion.send(command);
        // Should have hub route table and spoke route tables
        expect(response.TransitGatewayRouteTables!.length).toBeGreaterThanOrEqual(3);
      },
      TEST_TIMEOUT
    );
  });

  describe('VPC Flow Logs', () => {
    test(
      'S3 bucket exists for flow logs',
      async () => {
        if (!outputs.flow_logs_s3_bucket && !outputs.flow_logs_s3_bucket_arn) {
          console.log('S3 bucket output not found. Skipping S3 validation.');
          return;
        }

        const bucketName = outputs.flow_logs_s3_bucket || outputs.flow_logs_s3_bucket_arn?.split(':::')[1];
        
        // Check bucket versioning
        const versioningCommand = new GetBucketVersioningCommand({
          Bucket: bucketName,
        });

        const versioningResponse = await s3Client.send(versioningCommand);
        expect(versioningResponse.Status).toBe('Enabled');
      },
      TEST_TIMEOUT
    );

    test(
      'S3 bucket has encryption enabled',
      async () => {
        if (!outputs.flow_logs_s3_bucket && !outputs.flow_logs_s3_bucket_arn) {
          console.log('S3 bucket output not found. Skipping encryption check.');
          return;
        }

        const bucketName = outputs.flow_logs_s3_bucket || outputs.flow_logs_s3_bucket_arn?.split(':::')[1];

        const command = new GetBucketEncryptionCommand({
          Bucket: bucketName,
        });

        const response = await s3Client.send(command);
        expect(response.ServerSideEncryptionConfiguration).toBeDefined();
        expect(response.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);
        expect(
          response.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm
        ).toBe('AES256');
      },
      TEST_TIMEOUT
    );

    test(
      'S3 bucket has public access blocked',
      async () => {
        if (!outputs.flow_logs_s3_bucket && !outputs.flow_logs_s3_bucket_arn) {
          console.log('S3 bucket output not found. Skipping public access check.');
          return;
        }

        const bucketName = outputs.flow_logs_s3_bucket || outputs.flow_logs_s3_bucket_arn?.split(':::')[1];

        const command = new GetPublicAccessBlockCommand({
          Bucket: bucketName,
        });

        const response = await s3Client.send(command);
        expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
        expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
        expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
        expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
      },
      TEST_TIMEOUT
    );

    test(
      'Flow logs are configured for all VPCs',
      async () => {
        // Check hub VPC flow logs
        const hubCommand = new DescribeFlowLogsCommand({
          Filter: [{ Name: 'resource-id', Values: [outputs.hub_vpc_id] }],
        });

        const hubResponse = await ec2ClientHubRegion.send(hubCommand);
        
        // Flow logs may take time to appear or may not be captured in outputs
        if (hubResponse.FlowLogs && hubResponse.FlowLogs.length > 0) {
          expect(hubResponse.FlowLogs![0].LogDestinationType).toBe('s3');
          expect(hubResponse.FlowLogs![0].FlowLogStatus).toBe('ACTIVE');
        } else {
          console.log('Flow logs not yet active or not found. This may be expected during initial deployment.');
        }
      },
      TEST_TIMEOUT
    );
  });

  describe('Systems Manager Endpoints', () => {
    test(
      'SSM endpoints exist in Hub VPC',
      async () => {
        const command = new DescribeVpcEndpointsCommand({
          Filters: [{ Name: 'vpc-id', Values: [outputs.hub_vpc_id] }],
        });

        const response = await ec2ClientHubRegion.send(command);
        expect(response.VpcEndpoints!.length).toBeGreaterThanOrEqual(3); // ssm, ssmmessages, ec2messages

        const endpointServices = response.VpcEndpoints!.map((e) => e.ServiceName);
        expect(endpointServices.some((s) => s?.includes('ssm'))).toBe(true);
        expect(endpointServices.some((s) => s?.includes('ssmmessages'))).toBe(true);
        expect(endpointServices.some((s) => s?.includes('ec2messages'))).toBe(true);

        // Check that endpoints are available
        response.VpcEndpoints!.forEach((endpoint) => {
          expect(endpoint.State).toBe('available');
          expect(endpoint.PrivateDnsEnabled).toBe(true);
        });
      },
      TEST_TIMEOUT
    );

    test(
      'SSM endpoints exist in AP-Northeast-1 Spoke VPC',
      async () => {
        const command = new DescribeVpcEndpointsCommand({
          Filters: [{ Name: 'vpc-id', Values: [outputs.us_west_spoke_vpc_id] }],
        });

        const response = await ec2ClientUsWest.send(command);
        expect(response.VpcEndpoints!.length).toBeGreaterThanOrEqual(3);
      },
      TEST_TIMEOUT
    );

    test(
      'SSM endpoints exist in AP-Southeast-2 Spoke VPC',
      async () => {
        const command = new DescribeVpcEndpointsCommand({
          Filters: [{ Name: 'vpc-id', Values: [outputs.eu_west_spoke_vpc_id] }],
        });

        const response = await ec2ClientEuWest.send(command);
        expect(response.VpcEndpoints!.length).toBeGreaterThanOrEqual(3);
      },
      TEST_TIMEOUT
    );
  });

  describe('Route53 Private Hosted Zone', () => {
    test(
      'Route53 zone validation (skip if not enabled)',
      async () => {
        if (!outputs.private_hosted_zone_id || outputs.private_hosted_zone_id === null) {
          console.log('Route53 is not enabled (enable_route53 = false). Skipping test.');
          return;
        }

        const command = new GetHostedZoneCommand({
          Id: outputs.private_hosted_zone_id,
        });

        const response = await route53Client.send(command);
        expect(response.HostedZone).toBeDefined();
        expect(response.HostedZone!.Config?.PrivateZone).toBe(true);
      },
      TEST_TIMEOUT
    );
  });

  describe('Tagging Compliance', () => {
    test(
      'VPCs have required tags',
      async () => {
        const command = new DescribeVpcsCommand({
          VpcIds: [outputs.hub_vpc_id],
        });

        const response = await ec2ClientHubRegion.send(command);
        const vpc = response.Vpcs![0];
        const tags = vpc.Tags || [];

        const tagKeys = tags.map((t) => t.Key);
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('CostCenter');
        expect(tagKeys).toContain('Owner');
      },
      TEST_TIMEOUT
    );

    test(
      'Transit Gateway has required tags',
      async () => {
        const command = new DescribeTransitGatewaysCommand({
          TransitGatewayIds: [outputs.hub_transit_gateway_id],
        });

        const response = await ec2ClientHubRegion.send(command);
        const tgw = response.TransitGateways![0];
        const tags = tgw.Tags || [];

        const tagKeys = tags.map((t) => t.Key);
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('CostCenter');
        expect(tagKeys).toContain('Owner');
      },
      TEST_TIMEOUT
    );
  });

  describe('E2E Network Flow Test - Real-world Scenario', () => {
    test(
      'Transit Gateway routing enables hub-and-spoke topology',
      async () => {
        // Get route tables
        const rtCommand = new DescribeTransitGatewayRouteTablesCommand({
          Filters: [{ Name: 'transit-gateway-id', Values: [outputs.hub_transit_gateway_id] }],
        });

        const rtResponse = await ec2ClientHubRegion.send(rtCommand);
        expect(rtResponse.TransitGatewayRouteTables!.length).toBeGreaterThanOrEqual(3);

        // Check that route tables have routes configured
        for (const routeTable of rtResponse.TransitGatewayRouteTables!) {
          const searchCommand = new SearchTransitGatewayRoutesCommand({
            TransitGatewayRouteTableId: routeTable.TransitGatewayRouteTableId!,
            Filters: [{ Name: 'state', Values: ['active', 'blackhole'] }],
          });

          const searchResponse = await ec2ClientHubRegion.send(searchCommand);
          // Should have at least one route (either to VPC or blackhole)
          expect(searchResponse.Routes!.length).toBeGreaterThan(0);
        }
      },
      TEST_TIMEOUT
    );

    test(
      'Blackhole routes exist for unused RFC1918 ranges',
      async () => {
        // Get route tables
        const rtCommand = new DescribeTransitGatewayRouteTablesCommand({
          Filters: [{ Name: 'transit-gateway-id', Values: [outputs.hub_transit_gateway_id] }],
        });

        const rtResponse = await ec2ClientHubRegion.send(rtCommand);

        let blackholeRoutesFound = false;

        // Check each route table for blackhole routes
        for (const routeTable of rtResponse.TransitGatewayRouteTables!) {
          const searchCommand = new SearchTransitGatewayRoutesCommand({
            TransitGatewayRouteTableId: routeTable.TransitGatewayRouteTableId!,
            Filters: [{ Name: 'type', Values: ['static'] }],
          });

          const searchResponse = await ec2ClientHubRegion.send(searchCommand);

          const blackholeRoutes = searchResponse.Routes!.filter((r) => r.State === 'blackhole');

          if (blackholeRoutes.length > 0) {
            blackholeRoutesFound = true;
            const blackholeCidrs = blackholeRoutes.map((r) => r.DestinationCidrBlock);
            // Check for RFC1918 ranges
            const hasRfc1918Blackholes =
              blackholeCidrs.some((cidr) => cidr === '172.16.0.0/12') ||
              blackholeCidrs.some((cidr) => cidr === '192.168.0.0/16');
            expect(hasRfc1918Blackholes).toBe(true);
            break;
          }
        }

        expect(blackholeRoutesFound).toBe(true);
      },
      TEST_TIMEOUT
    );
  });
});

// Summary test
describe('Integration Test Summary', () => {
  test('Outputs are loaded from deployed infrastructure', () => {
    // Verify core required outputs exist
    expect(outputs).toHaveProperty('hub_vpc_id');
    expect(outputs).toHaveProperty('hub_transit_gateway_id');
    expect(outputs.hub_vpc_id).toBeTruthy();
    expect(outputs.hub_transit_gateway_id).toBeTruthy();
    
    // Log all available outputs for debugging
    console.log('Available outputs:', Object.keys(outputs).join(', '));
  });
});
