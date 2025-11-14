import {
  DescribeFlowLogsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcEndpointsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetBucketLifecycleConfigurationCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// Load stack outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  const flatOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

  // Extract ENVIRONMENT_SUFFIX from environment variable or default
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

  // Construct the stack key: TapStack + environmentSuffix
  const stackKey = `TapStack${environmentSuffix}`;

  // Extract outputs from the nested key
  if (flatOutputs[stackKey]) {
    outputs = flatOutputs[stackKey];
  } else {
    // Fallback: try to find any TapStack key if exact match not found
    const stackKeys = Object.keys(flatOutputs).filter(key => key.startsWith('TapStack'));
    if (stackKeys.length > 0) {
      outputs = flatOutputs[stackKeys[0]];
      console.warn(`Using outputs from ${stackKeys[0]} instead of ${stackKey}`);
    }
  }
}

// Determine AWS region from outputs or environment variable
const AWS_REGION = outputs.AwsRegion || process.env.AWS_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region: AWS_REGION });
const s3Client = new S3Client({ region: AWS_REGION });

// Extract expected AZs based on region
const EXPECTED_AZS = [`${AWS_REGION}a`, `${AWS_REGION}b`];

describe('VPC Infrastructure Integration Tests', () => {
  // Skip tests if outputs are not available
  const runTests = Object.keys(outputs).length > 0;
  const testOrSkip = runTests ? test : test.skip;

  describe('VPC Configuration', () => {
    testOrSkip('VPC exists and is available', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();
      expect(typeof vpcId).toBe('string');
      expect(vpcId).toMatch(/^vpc-/);

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
    });

    testOrSkip('VPC has required tags', async () => {
      const vpcId = outputs.VpcId;
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];
      const envTag = tags.find((t) => t.Key === 'Environment');
      const projectTag = tags.find((t) => t.Key === 'Project');
      const nameTag = tags.find((t) => t.Key === 'Name');

      expect(envTag?.Value).toBe('production');
      expect(projectTag?.Value).toBe('payment-platform');
      expect(nameTag?.Value).toContain('payment-platform-vpc');
    });
  });

  describe('Subnet Configuration', () => {
    testOrSkip('all subnets are available and correctly configured', async () => {
      const publicSubnetIds = Array.isArray(outputs.PublicSubnetIds)
        ? outputs.PublicSubnetIds
        : [];
      const privateSubnetIds = Array.isArray(outputs.PrivateSubnetIds)
        ? outputs.PrivateSubnetIds
        : [];
      const isolatedSubnetIds = Array.isArray(outputs.IsolatedSubnetIds)
        ? outputs.IsolatedSubnetIds
        : [];

      const allSubnetIds = [
        ...publicSubnetIds,
        ...privateSubnetIds,
        ...isolatedSubnetIds,
      ];

      // Should have 6 subnets total (2 public, 2 private, 2 isolated)
      expect(allSubnetIds.length).toBe(6);

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(6);
      response.Subnets!.forEach((subnet) => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.VpcId);
      });
    });

    testOrSkip('public subnets have correct configuration', async () => {
      const publicSubnetIds = Array.isArray(outputs.PublicSubnetIds)
        ? outputs.PublicSubnetIds
        : [];
      expect(publicSubnetIds.length).toBe(2);

      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(2);

      // Check CIDR blocks
      const cidrs = response.Subnets!.map((s) => s.CidrBlock).sort();
      expect(cidrs).toContain('10.0.1.0/24');
      expect(cidrs).toContain('10.0.2.0/24');

      response.Subnets!.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        const tier = subnet.Tags?.find((t) => t.Key === 'Tier');
        expect(tier?.Value).toBe('public');
        const envTag = subnet.Tags?.find((t) => t.Key === 'Environment');
        expect(envTag?.Value).toBe('production');
        const projectTag = subnet.Tags?.find((t) => t.Key === 'Project');
        expect(projectTag?.Value).toBe('payment-platform');
      });
    });

    testOrSkip('private subnets exist and are properly configured', async () => {
      const privateSubnetIds = Array.isArray(outputs.PrivateSubnetIds)
        ? outputs.PrivateSubnetIds
        : [];
      expect(privateSubnetIds.length).toBe(2);

      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(2);

      // Check CIDR blocks
      const cidrs = response.Subnets!.map((s) => s.CidrBlock).sort();
      expect(cidrs).toContain('10.0.11.0/24');
      expect(cidrs).toContain('10.0.12.0/24');

      response.Subnets!.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        const tier = subnet.Tags?.find((t) => t.Key === 'Tier');
        expect(tier?.Value).toBe('private');
        const envTag = subnet.Tags?.find((t) => t.Key === 'Environment');
        expect(envTag?.Value).toBe('production');
      });
    });

    testOrSkip('isolated subnets exist and are properly configured', async () => {
      const isolatedSubnetIds = Array.isArray(outputs.IsolatedSubnetIds)
        ? outputs.IsolatedSubnetIds
        : [];
      expect(isolatedSubnetIds.length).toBe(2);

      const command = new DescribeSubnetsCommand({
        SubnetIds: isolatedSubnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(2);

      // Check CIDR blocks
      const cidrs = response.Subnets!.map((s) => s.CidrBlock).sort();
      expect(cidrs).toContain('10.0.21.0/24');
      expect(cidrs).toContain('10.0.22.0/24');

      response.Subnets!.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        const tier = subnet.Tags?.find((t) => t.Key === 'Tier');
        expect(tier?.Value).toBe('isolated');
        const envTag = subnet.Tags?.find((t) => t.Key === 'Environment');
        expect(envTag?.Value).toBe('production');
      });
    });

    testOrSkip('subnets are distributed across two availability zones', async () => {
      const publicSubnetIds = Array.isArray(outputs.PublicSubnetIds)
        ? outputs.PublicSubnetIds
        : [];
      const privateSubnetIds = Array.isArray(outputs.PrivateSubnetIds)
        ? outputs.PrivateSubnetIds
        : [];
      const isolatedSubnetIds = Array.isArray(outputs.IsolatedSubnetIds)
        ? outputs.IsolatedSubnetIds
        : [];

      const allSubnetIds = [
        ...publicSubnetIds,
        ...privateSubnetIds,
        ...isolatedSubnetIds,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      });
      const response = await ec2Client.send(command);

      const azs = new Set(
        response.Subnets!.map((s) => s.AvailabilityZone).filter(Boolean)
      );
      expect(azs.size).toBe(2);

      // Check that AZs match expected format for the region
      EXPECTED_AZS.forEach((expectedAz) => {
        expect(azs.has(expectedAz)).toBe(true);
      });
    });
  });

  describe('Internet Gateway', () => {
    testOrSkip('internet gateway is attached to VPC', async () => {
      const vpcId = outputs.VpcId;
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].State).toBe('available');
      expect(igw.Attachments![0].VpcId).toBe(vpcId);

      // Check tags
      const tags = igw.Tags || [];
      const nameTag = tags.find((t) => t.Key === 'Name');
      expect(nameTag?.Value).toContain('payment-platform-igw');
      const envTag = tags.find((t) => t.Key === 'Environment');
      expect(envTag?.Value).toBe('production');
    });
  });

  describe('NAT Gateways', () => {
    testOrSkip('NAT gateways exist in each availability zone', async () => {
      const vpcId = outputs.VpcId;
      const publicSubnetIds = Array.isArray(outputs.PublicSubnetIds)
        ? outputs.PublicSubnetIds
        : [];

      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      // Should have 2 NAT gateways (one per AZ)
      expect(response.NatGateways?.length).toBeGreaterThanOrEqual(2);

      const natGateways = response.NatGateways!.filter(
        (ngw) => ngw.State === 'available'
      );
      expect(natGateways.length).toBeGreaterThanOrEqual(2);

      // Verify NAT gateways are in public subnets
      const natSubnetIds = natGateways.map((ngw) => ngw.SubnetId);
      publicSubnetIds.forEach((publicSubnetId) => {
        expect(natSubnetIds).toContain(publicSubnetId);
      });

      // Check tags
      natGateways.forEach((ngw) => {
        const tags = ngw.Tags || [];
        const nameTag = tags.find((t) => t.Key === 'Name');
        expect(nameTag?.Value).toContain('payment-platform-nat');
        const envTag = tags.find((t) => t.Key === 'Environment');
        expect(envTag?.Value).toBe('production');
      });
    });

    testOrSkip('NAT gateways have Elastic IPs attached', async () => {
      const vpcId = outputs.VpcId;
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const natGateways = response.NatGateways!.filter(
        (ngw) => ngw.State === 'available'
      );

      natGateways.forEach((ngw) => {
        expect(ngw.NatGatewayAddresses).toBeDefined();
        expect(ngw.NatGatewayAddresses!.length).toBeGreaterThan(0);
        expect(ngw.NatGatewayAddresses![0].AllocationId).toBeDefined();
      });
    });
  });

  describe('Route Tables', () => {
    testOrSkip('public subnets have route to internet gateway', async () => {
      const publicSubnetIds = Array.isArray(outputs.PublicSubnetIds)
        ? outputs.PublicSubnetIds
        : [];

      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: publicSubnetIds,
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables!.length).toBeGreaterThan(0);

      response.RouteTables!.forEach((rt) => {
        const igwRoute = rt.Routes?.find(
          (route) =>
            route.DestinationCidrBlock === '0.0.0.0/0' && route.GatewayId
        );
        expect(igwRoute).toBeDefined();
        expect(igwRoute?.GatewayId).toMatch(/^igw-/);
      });
    });

    testOrSkip('private subnets have routes to NAT gateways', async () => {
      const privateSubnetIds = Array.isArray(outputs.PrivateSubnetIds)
        ? outputs.PrivateSubnetIds
        : [];

      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: privateSubnetIds,
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables!.length).toBeGreaterThan(0);

      response.RouteTables!.forEach((rt) => {
        const natRoute = rt.Routes?.find(
          (route) =>
            route.DestinationCidrBlock === '0.0.0.0/0' && route.NatGatewayId
        );
        expect(natRoute).toBeDefined();
        expect(natRoute?.NatGatewayId).toMatch(/^nat-/);
      });
    });

    testOrSkip('isolated subnets have no internet routes', async () => {
      const isolatedSubnetIds = Array.isArray(outputs.IsolatedSubnetIds)
        ? outputs.IsolatedSubnetIds
        : [];

      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: isolatedSubnetIds,
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables!.length).toBeGreaterThan(0);

      response.RouteTables!.forEach((rt) => {
        const internetRoute = rt.Routes?.find(
          (route) =>
            route.DestinationCidrBlock === '0.0.0.0/0' &&
            (route.GatewayId || route.NatGatewayId)
        );
        expect(internetRoute).toBeUndefined();
      });
    });
  });

  describe('Security Groups', () => {
    testOrSkip('web security group allows HTTPS traffic', async () => {
      const webSgId = outputs.WebSecurityGroupId;
      expect(webSgId).toBeDefined();

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [webSgId],
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.VpcId);

      const httpsRule = sg.IpPermissions?.find(
        (rule) =>
          rule.FromPort === 443 &&
          rule.ToPort === 443 &&
          rule.IpProtocol === 'tcp'
      );

      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpRanges?.some((ip) => ip.CidrIp === '0.0.0.0/0')).toBe(
        true
      );

      // Check tags
      const tags = sg.Tags || [];
      const nameTag = tags.find((t) => t.Key === 'Name');
      expect(nameTag?.Value).toContain('payment-platform-web-sg');
      const envTag = tags.find((t) => t.Key === 'Environment');
      expect(envTag?.Value).toBe('production');
    });

    testOrSkip('app security group allows traffic on port 8080', async () => {
      const appSgId = outputs.AppSecurityGroupId;
      expect(appSgId).toBeDefined();

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [appSgId],
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups![0];
      const appRule = sg.IpPermissions?.find(
        (rule) =>
          rule.FromPort === 8080 &&
          rule.ToPort === 8080 &&
          rule.IpProtocol === 'tcp'
      );

      expect(appRule).toBeDefined();
      // Verify source is web security group
      expect(appRule?.UserIdGroupPairs).toBeDefined();
      expect(appRule?.UserIdGroupPairs!.length).toBeGreaterThan(0);
      expect(appRule?.UserIdGroupPairs![0].GroupId).toBe(
        outputs.WebSecurityGroupId
      );

      // Check tags
      const tags = sg.Tags || [];
      const nameTag = tags.find((t) => t.Key === 'Name');
      expect(nameTag?.Value).toContain('payment-platform-app-sg');
    });

    testOrSkip('database security group allows PostgreSQL traffic', async () => {
      const dbSgId = outputs.DatabaseSecurityGroupId;
      expect(dbSgId).toBeDefined();

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [dbSgId],
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups![0];
      const dbRule = sg.IpPermissions?.find(
        (rule) =>
          rule.FromPort === 5432 &&
          rule.ToPort === 5432 &&
          rule.IpProtocol === 'tcp'
      );

      expect(dbRule).toBeDefined();
      // Verify source is app security group
      expect(dbRule?.UserIdGroupPairs).toBeDefined();
      expect(dbRule?.UserIdGroupPairs!.length).toBeGreaterThan(0);
      expect(dbRule?.UserIdGroupPairs![0].GroupId).toBe(
        outputs.AppSecurityGroupId
      );

      // Check tags
      const tags = sg.Tags || [];
      const nameTag = tags.find((t) => t.Key === 'Name');
      expect(nameTag?.Value).toContain('payment-platform-db-sg');
    });

    testOrSkip('all security groups have required tags', async () => {
      const sgIds = [
        outputs.WebSecurityGroupId,
        outputs.AppSecurityGroupId,
        outputs.DatabaseSecurityGroupId,
      ].filter(Boolean);

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: sgIds,
      });
      const response = await ec2Client.send(command);

      response.SecurityGroups!.forEach((sg) => {
        const envTag = sg.Tags?.find((t) => t.Key === 'Environment');
        const projectTag = sg.Tags?.find((t) => t.Key === 'Project');

        expect(envTag?.Value).toBe('production');
        expect(projectTag?.Value).toBe('payment-platform');
      });
    });

    testOrSkip('all security groups allow all outbound traffic', async () => {
      const sgIds = [
        outputs.WebSecurityGroupId,
        outputs.AppSecurityGroupId,
        outputs.DatabaseSecurityGroupId,
      ].filter(Boolean);

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: sgIds,
      });
      const response = await ec2Client.send(command);

      response.SecurityGroups!.forEach((sg) => {
        const egressRule = sg.IpPermissionsEgress?.find(
          (rule) =>
            rule.IpProtocol === '-1' &&
            rule.FromPort === undefined &&
            rule.ToPort === undefined
        );
        expect(egressRule).toBeDefined();
        expect(egressRule?.IpRanges?.some((ip) => ip.CidrIp === '0.0.0.0/0')).toBe(
          true
        );
      });
    });
  });

  describe('VPC Flow Logs', () => {
    testOrSkip('VPC has flow logs enabled', async () => {
      const vpcId = outputs.VpcId;
      const command = new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.FlowLogs?.length).toBeGreaterThan(0);
      const flowLog = response.FlowLogs![0];
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.LogDestinationType).toBe('s3');
      expect(flowLog.DeliverLogsStatus).toBe('SUCCESS');
    });

    testOrSkip('S3 bucket for flow logs exists and is accessible', async () => {
      const vpcId = outputs.VpcId;
      const flowLogsCommand = new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [vpcId],
          },
        ],
      });
      const flowLogsResponse = await ec2Client.send(flowLogsCommand);
      const flowLog = flowLogsResponse.FlowLogs![0];
      const bucketArn = flowLog.LogDestination!;
      const bucketName = bucketArn.split(':::')[1];

      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({
        Bucket: bucketName,
      });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    testOrSkip('S3 bucket has lifecycle policy with 7-day retention', async () => {
      const vpcId = outputs.VpcId;
      const flowLogsCommand = new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [vpcId],
          },
        ],
      });
      const flowLogsResponse = await ec2Client.send(flowLogsCommand);
      const flowLog = flowLogsResponse.FlowLogs![0];
      const bucketArn = flowLog.LogDestination!;
      const bucketName = bucketArn.split(':::')[1];

      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);
      const rule = response.Rules!.find((r) => r.Status === 'Enabled');
      expect(rule).toBeDefined();
      expect(rule?.Expiration?.Days).toBe(7);
    });

    testOrSkip('S3 bucket has public access blocked', async () => {
      const vpcId = outputs.VpcId;
      const flowLogsCommand = new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [vpcId],
          },
        ],
      });
      const flowLogsResponse = await ec2Client.send(flowLogsCommand);
      const flowLog = flowLogsResponse.FlowLogs![0];
      const bucketArn = flowLog.LogDestination!;
      const bucketName = bucketArn.split(':::')[1];

      const command = new GetPublicAccessBlockCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(
        true
      );
      expect(
        response.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);
    });
  });

  describe('VPC Endpoints', () => {
    testOrSkip('Systems Manager VPC endpoint exists', async () => {
      const vpcId = outputs.VpcId;
      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'service-name',
            Values: [`com.amazonaws.${AWS_REGION}.ssm`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.VpcEndpoints?.length).toBeGreaterThan(0);
      const endpoint = response.VpcEndpoints![0];
      expect(endpoint.State).toBe('available');
      expect(endpoint.VpcEndpointType).toBe('Interface');
      expect(endpoint.PrivateDnsEnabled).toBe(true);

      // Check tags
      const tags = endpoint.Tags || [];
      const nameTag = tags.find((t) => t.Key === 'Name');
      expect(nameTag?.Value).toContain('payment-platform-ssm-endpoint');
      const envTag = tags.find((t) => t.Key === 'Environment');
      expect(envTag?.Value).toBe('production');
    });

    testOrSkip('VPC endpoint is in private subnets', async () => {
      const vpcId = outputs.VpcId;
      const privateSubnetIds = Array.isArray(outputs.PrivateSubnetIds)
        ? outputs.PrivateSubnetIds
        : [];

      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'service-name',
            Values: [`com.amazonaws.${AWS_REGION}.ssm`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const endpoint = response.VpcEndpoints![0];
      expect(endpoint.SubnetIds).toBeDefined();
      expect(endpoint.SubnetIds!.length).toBeGreaterThan(0);

      endpoint.SubnetIds!.forEach((subnetId) => {
        expect(privateSubnetIds).toContain(subnetId);
      });
    });

    testOrSkip('VPC endpoint has proper security group', async () => {
      const vpcId = outputs.VpcId;
      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'service-name',
            Values: [`com.amazonaws.${AWS_REGION}.ssm`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const endpoint = response.VpcEndpoints![0];
      expect(endpoint.Groups).toBeDefined();
      expect(endpoint.Groups!.length).toBeGreaterThan(0);

      // Verify security group allows HTTPS from VPC
      const sgId = endpoint.Groups![0].GroupId!;
      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [sgId],
      });
      const sgResponse = await ec2Client.send(sgCommand);
      const sg = sgResponse.SecurityGroups![0];

      const httpsRule = sg.IpPermissions?.find(
        (rule) =>
          rule.FromPort === 443 &&
          rule.ToPort === 443 &&
          rule.IpProtocol === 'tcp'
      );
      expect(httpsRule).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    testOrSkip('all resources have consistent tagging', async () => {
      const vpcId = outputs.VpcId;
      const publicSubnetIds = Array.isArray(outputs.PublicSubnetIds)
        ? outputs.PublicSubnetIds
        : [];
      const privateSubnetIds = Array.isArray(outputs.PrivateSubnetIds)
        ? outputs.PrivateSubnetIds
        : [];

      // Check VPC tags
      const vpcCommand = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpc = vpcResponse.Vpcs![0];
      const vpcEnvTag = vpc.Tags?.find((t) => t.Key === 'Environment');
      const vpcProjectTag = vpc.Tags?.find((t) => t.Key === 'Project');
      expect(vpcEnvTag?.Value).toBe('production');
      expect(vpcProjectTag?.Value).toBe('payment-platform');

      // Check subnet tags
      const subnetIds = [...publicSubnetIds, ...privateSubnetIds];
      const subnetCommand = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
      const subnetResponse = await ec2Client.send(subnetCommand);
      subnetResponse.Subnets!.forEach((subnet) => {
        const envTag = subnet.Tags?.find((t) => t.Key === 'Environment');
        const projectTag = subnet.Tags?.find((t) => t.Key === 'Project');
        expect(envTag?.Value).toBe('production');
        expect(projectTag?.Value).toBe('payment-platform');
      });
    });
  });
});

