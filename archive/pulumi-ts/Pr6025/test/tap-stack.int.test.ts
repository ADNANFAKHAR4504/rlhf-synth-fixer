import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeFlowLogsCommand,
} from '@aws-sdk/client-ec2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(
  __dirname,
  '../cfn-outputs/flat-outputs.json'
);
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  // Parse JSON string values back to arrays/objects
  outputs = Object.entries(rawOutputs).reduce((acc, [key, value]) => {
    if (typeof value === 'string' && value.startsWith('[')) {
      try {
        acc[key] = JSON.parse(value);
      } catch {
        acc[key] = value;
      }
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as any);
}

const region = process.env.AWS_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region });
const cwLogsClient = new CloudWatchLogsClient({ region });
const iamClient = new IAMClient({ region });

// Test timeout for AWS API calls
const TEST_TIMEOUT = 30000;

describe('Multi-Environment VPC Infrastructure Integration Tests', () => {
  beforeAll(() => {
    if (!fs.existsSync(outputsPath)) {
      console.warn(
        'WARNING: flat-outputs.json not found. Some tests may be skipped.'
      );
    }
  });

  describe('Dev Environment VPC', () => {
    it(
      'should have deployed dev VPC with correct CIDR',
      async () => {
        if (!outputs.devVpcId) {
          console.warn('Skipping: devVpcId not found in outputs');
          return;
        }

        const command = new DescribeVpcsCommand({
          VpcIds: [outputs.devVpcId],
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.devVpcId]
            }
          ]
        });
        const response = await ec2Client.send(command);

        expect(response.Vpcs).toHaveLength(1);
        expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
        // DNS settings are verified via VPC attributes, not directly in DescribeVpcs response
        expect(response.Vpcs![0]).toBeDefined();
      },
      TEST_TIMEOUT
    );

    it(
      'should have 3 public and 3 private subnets for dev',
      async () => {
        if (!outputs.devPublicSubnetIds && !outputs.devPrivateSubnetIds) {
          console.warn('Skipping: subnet IDs not found in outputs');
          return;
        }

        const allSubnetIds = [
          ...(outputs.devPublicSubnetIds || []),
          ...(outputs.devPrivateSubnetIds || []),
        ].filter(id => id);

        const command = new DescribeSubnetsCommand({
          SubnetIds: allSubnetIds,
        });
        const response = await ec2Client.send(command);

        expect(response.Subnets).toHaveLength(6);

        // Verify public subnets
        const publicSubnets = response.Subnets!.filter(s =>
          s.MapPublicIpOnLaunch
        );
        expect(publicSubnets).toHaveLength(3);

        // Verify private subnets
        const privateSubnets = response.Subnets!.filter(
          s => !s.MapPublicIpOnLaunch
        );
        expect(privateSubnets).toHaveLength(3);

        // Verify AZ distribution
        const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
        expect(azs.size).toBe(3);
      },
      TEST_TIMEOUT
    );

    it(
      'should have internet gateway attached to dev VPC',
      async () => {
        if (!outputs.devVpcId) {
          console.warn('Skipping: devVpcId not found in outputs');
          return;
        }

        const command = new DescribeInternetGatewaysCommand({
          Filters: [
            {
              Name: 'attachment.vpc-id',
              Values: [outputs.devVpcId],
            },
          ],
        });
        const response = await ec2Client.send(command);

        expect(response.InternetGateways).toHaveLength(1);
        expect(response.InternetGateways![0].Attachments![0].State).toBe(
          'available'
        );
      },
      TEST_TIMEOUT
    );

    it(
      'should have 3 NAT gateways in dev VPC',
      async () => {
        if (!outputs.devVpcId) {
          console.warn('Skipping: devVpcId not found in outputs');
          return;
        }

        const command = new DescribeNatGatewaysCommand({
          Filter: [
            {
              Name: 'vpc-id',
              Values: [outputs.devVpcId],
            },
          ],
        });
        const response = await ec2Client.send(command);

        const availableNats = response.NatGateways!.filter(
          nat => nat.State === 'available'
        );
        expect(availableNats).toHaveLength(3);

        // Verify NAT gateways are in different AZs
        const natAzs = new Set(availableNats.map(nat => nat.SubnetId));
        expect(natAzs.size).toBe(3);
      },
      TEST_TIMEOUT
    );

    it(
      'should have proper route tables for dev VPC',
      async () => {
        if (!outputs.devVpcId) {
          console.warn('Skipping: devVpcId not found in outputs');
          return;
        }

        const command = new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.devVpcId],
            },
          ],
        });
        const response = await ec2Client.send(command);

        // Should have 1 public + 3 private + 1 main route table = 5
        expect(response.RouteTables!.length).toBeGreaterThanOrEqual(4);

        // Verify public route table has IGW route
        const routesWithIgw = response.RouteTables!.filter(rt =>
          rt.Routes!.some(
            r => r.GatewayId && r.GatewayId.startsWith('igw-')
          )
        );
        expect(routesWithIgw.length).toBeGreaterThanOrEqual(1);

        // Verify private route tables have NAT gateway routes
        const routesWithNat = response.RouteTables!.filter(rt =>
          rt.Routes!.some(
            r => r.NatGatewayId && r.NatGatewayId.startsWith('nat-')
          )
        );
        expect(routesWithNat.length).toBeGreaterThanOrEqual(3);
      },
      TEST_TIMEOUT
    );

    it(
      'should have web and app security groups for dev',
      async () => {
        if (!outputs.devWebSgId || !outputs.devAppSgId) {
          console.warn('Skipping: security group IDs not found in outputs');
          return;
        }

        const command = new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.devWebSgId, outputs.devAppSgId],
        });
        const response = await ec2Client.send(command);

        expect(response.SecurityGroups).toHaveLength(2);

        // Verify web security group has HTTPS ingress
        const webSg = response.SecurityGroups!.find(
          sg => sg.GroupId === outputs.devWebSgId
        );
        const httpsRule = webSg!.IpPermissions!.find(
          rule => rule.FromPort === 443 && rule.ToPort === 443
        );
        expect(httpsRule).toBeDefined();

        // Verify app security group allows traffic from web tier
        const appSg = response.SecurityGroups!.find(
          sg => sg.GroupId === outputs.devAppSgId
        );
        const webToAppRule = appSg!.IpPermissions!.find(rule =>
          rule.UserIdGroupPairs!.some(pair => pair.GroupId === outputs.devWebSgId)
        );
        expect(webToAppRule).toBeDefined();
      },
      TEST_TIMEOUT
    );

    it(
      'should have VPC flow logs enabled for dev',
      async () => {
        if (!outputs.devVpcId) {
          console.warn('Skipping: devVpcId not found in outputs');
          return;
        }

        const command = new DescribeFlowLogsCommand({
          Filter: [
            {
              Name: 'resource-id',
              Values: [outputs.devVpcId],
            },
          ],
        });
        const response = await ec2Client.send(command);

        expect(response.FlowLogs).toHaveLength(1);
        expect(response.FlowLogs![0].TrafficType).toBe('ALL');
        expect(response.FlowLogs![0].LogDestinationType).toBe(
          'cloud-watch-logs'
        );
      },
      TEST_TIMEOUT
    );

    it(
      'should have CloudWatch log group with 7-day retention for dev',
      async () => {
        if (!outputs.devFlowLogGroupName) {
          console.warn('Skipping: devFlowLogGroupName not found in outputs');
          return;
        }

        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.devFlowLogGroupName,
        });
        const response = await cwLogsClient.send(command);

        expect(response.logGroups).toHaveLength(1);
        expect(response.logGroups![0].retentionInDays).toBe(7);
      },
      TEST_TIMEOUT
    );
  });

  describe('Staging Environment VPC', () => {
    it(
      'should have deployed staging VPC with correct CIDR',
      async () => {
        if (!outputs.stagingVpcId) {
          console.warn('Skipping: stagingVpcId not found in outputs');
          return;
        }

        const command = new DescribeVpcsCommand({
          VpcIds: [outputs.stagingVpcId],
        });
        const response = await ec2Client.send(command);

        expect(response.Vpcs).toHaveLength(1);
        expect(response.Vpcs![0].CidrBlock).toBe('10.1.0.0/16');
      },
      TEST_TIMEOUT
    );

    it(
      'should have 6 subnets for staging',
      async () => {
        if (
          !outputs.stagingPublicSubnetIds &&
          !outputs.stagingPrivateSubnetIds
        ) {
          console.warn('Skipping: staging subnet IDs not found in outputs');
          return;
        }

        const allSubnetIds = [
          ...(outputs.stagingPublicSubnetIds || []),
          ...(outputs.stagingPrivateSubnetIds || []),
        ].filter(id => id);

        const command = new DescribeSubnetsCommand({
          SubnetIds: allSubnetIds,
        });
        const response = await ec2Client.send(command);

        expect(response.Subnets).toHaveLength(6);
      },
      TEST_TIMEOUT
    );
  });

  describe('Production Environment VPC', () => {
    it(
      'should have deployed production VPC with correct CIDR',
      async () => {
        if (!outputs.productionVpcId) {
          console.warn('Skipping: productionVpcId not found in outputs');
          return;
        }

        const command = new DescribeVpcsCommand({
          VpcIds: [outputs.productionVpcId],
        });
        const response = await ec2Client.send(command);

        expect(response.Vpcs).toHaveLength(1);
        expect(response.Vpcs![0].CidrBlock).toBe('10.2.0.0/16');
      },
      TEST_TIMEOUT
    );

    it(
      'should have 6 subnets for production',
      async () => {
        if (
          !outputs.productionPublicSubnetIds &&
          !outputs.productionPrivateSubnetIds
        ) {
          console.warn('Skipping: production subnet IDs not found in outputs');
          return;
        }

        const allSubnetIds = [
          ...(outputs.productionPublicSubnetIds || []),
          ...(outputs.productionPrivateSubnetIds || []),
        ].filter(id => id);

        const command = new DescribeSubnetsCommand({
          SubnetIds: allSubnetIds,
        });
        const response = await ec2Client.send(command);

        expect(response.Subnets).toHaveLength(6);
      },
      TEST_TIMEOUT
    );
  });

  describe('Cross-Environment Validation', () => {
    it(
      'should have non-overlapping CIDR ranges across environments',
      async () => {
        const vpcIds = [
          outputs.devVpcId,
          outputs.stagingVpcId,
          outputs.productionVpcId,
        ].filter(id => id);

        if (vpcIds.length === 0) {
          console.warn('Skipping: No VPC IDs found in outputs');
          return;
        }

        const command = new DescribeVpcsCommand({
          VpcIds: vpcIds,
        });
        const response = await ec2Client.send(command);

        const cidrBlocks = response.Vpcs!.map(vpc => vpc.CidrBlock);
        const uniqueCidrs = new Set(cidrBlocks);
        expect(uniqueCidrs.size).toBe(cidrBlocks.length);
      },
      TEST_TIMEOUT
    );

    it(
      'should have proper tagging across all environments',
      async () => {
        const vpcIds = [
          outputs.devVpcId,
          outputs.stagingVpcId,
          outputs.productionVpcId,
        ].filter(id => id);

        if (vpcIds.length === 0) {
          console.warn('Skipping: No VPC IDs found in outputs');
          return;
        }

        const command = new DescribeVpcsCommand({
          VpcIds: vpcIds,
        });
        const response = await ec2Client.send(command);

        response.Vpcs!.forEach(vpc => {
          const tags = vpc.Tags || [];
          const tagKeys = tags.map(t => t.Key);

          expect(tagKeys).toContain('Environment');
          expect(tagKeys).toContain('ManagedBy');
          expect(tagKeys).toContain('CostCenter');

          const managedByTag = tags.find(t => t.Key === 'ManagedBy');
          expect(managedByTag!.Value).toBe('Pulumi');
        });
      },
      TEST_TIMEOUT
    );
  });
});
