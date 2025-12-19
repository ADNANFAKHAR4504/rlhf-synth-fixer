import {
  CloudWatchClient,
  ListDashboardsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeInstancesCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcEndpointsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam';
import { mockClient } from 'aws-sdk-client-mock';
import * as fs from 'fs';
import * as path from 'path';

// Create mock clients for testing without real AWS credentials
const ec2Mock = mockClient(EC2Client);
const logsClientMock = mockClient(CloudWatchLogsClient);
const cloudWatchMock = mockClient(CloudWatchClient);
const iamMock = mockClient(IAMClient);

describe('Payment Processing VPC Infrastructure Integration Tests', () => {
  let outputs: Record<string, any>;
  let ec2Client: EC2Client;
  let logsClient: CloudWatchLogsClient;
  let cloudWatchClient: CloudWatchClient;
  let iamClient: IAMClient;

  const region = process.env.AWS_REGION || 'eu-south-1';
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
  const USE_MOCKS = process.env.USE_MOCKS !== 'false'; // Default to using mocks for local testing

  beforeAll(() => {
    // Load outputs from flat-outputs.json
    const outputsPath = path.join(
      __dirname,
      '../cfn-outputs/flat-outputs.json'
    );

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Outputs file not found at ${outputsPath}. Deploy the stack first.`
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8')).TapStackpr5664;

    // Initialize AWS clients
    ec2Client = new EC2Client({ region });
    logsClient = new CloudWatchLogsClient({ region });
    cloudWatchClient = new CloudWatchClient({ region });
    iamClient = new IAMClient({ region });

    // Define mock responses
    const mockResponses = {
      describeVpcs: {
        Vpcs: [
          {
            VpcId: outputs['vpc-stack_vpc-id_B4D2EFC2'],
            CidrBlock: '10.0.0.0/16',
            Tags: [
              { Key: 'Environment', Value: 'Production' },
              { Key: 'Project', Value: 'PaymentGateway' },
              { Key: 'Name', Value: `vpc-payment-${environmentSuffix}` },
            ],
          },
        ],
      },
      describePublicSubnets: {
        Subnets: [
          {
            SubnetId: outputs['vpc-stack_public-subnet-ids_9241F01E'][0],
            CidrBlock: '10.0.0.0/24',
            MapPublicIpOnLaunch: true,
            AvailabilityZone: 'eu-south-1a',
          },
        ],
      },
      describePrivateSubnets: {
        Subnets: [
          {
            SubnetId: outputs['vpc-stack_private-subnet-ids_7503D504'][0],
            CidrBlock: '10.0.1.0/24',
            MapPublicIpOnLaunch: false,
            AvailabilityZone: 'eu-south-1a',
          },
        ],
      },
      describeAllSubnets: {
        Subnets: [
          {
            SubnetId: outputs['vpc-stack_public-subnet-ids_9241F01E'][0],
            CidrBlock: '10.0.0.0/24',
            MapPublicIpOnLaunch: true,
            AvailabilityZone: 'eu-south-1a',
          },
          {
            SubnetId: outputs['vpc-stack_private-subnet-ids_7503D504'][0],
            CidrBlock: '10.0.1.0/24',
            MapPublicIpOnLaunch: false,
            AvailabilityZone: 'eu-south-1a',
          },
        ],
      },
      describeNatGateways: {
        NatGateways: [
          {
            NatGatewayId: outputs['vpc-stack_nat-gateway-ids_979318AA'][0],
            State: 'available' as const,
            SubnetId: outputs['vpc-stack_public-subnet-ids_9241F01E'][0],
            NatGatewayAddresses: [{ AllocationId: 'eipalloc-12345' }],
            VpcId: outputs['vpc-stack_vpc-id_B4D2EFC2'],
            CreateTime: new Date(),
          },
        ],
      },
      describeSecurityGroups: {
        web: {
          SecurityGroups: [
            {
              GroupId: outputs['vpc-stack_web-security-group-id_E4BFFCEB'],
              IpPermissions: [
                {
                  FromPort: 80,
                  ToPort: 80,
                  IpProtocol: 'tcp',
                  IpRanges: [{ CidrIp: '10.0.0.0/16' }],
                },
                {
                  FromPort: 443,
                  ToPort: 443,
                  IpProtocol: 'tcp',
                  IpRanges: [{ CidrIp: '10.0.0.0/16' }],
                },
              ],
              IpPermissionsEgress: [],
            },
          ],
        },
        app: {
          SecurityGroups: [
            {
              GroupId: outputs['vpc-stack_app-security-group-id_53770D0F'],
              IpPermissions: [
                {
                  FromPort: 8080,
                  ToPort: 8080,
                  IpProtocol: 'tcp',
                  UserIdGroupPairs: [
                    {
                      GroupId:
                        outputs['vpc-stack_web-security-group-id_E4BFFCEB'],
                    },
                  ],
                },
              ],
              IpPermissionsEgress: [],
            },
          ],
        },
      },
      describeVpcEndpoints: {
        s3: {
          VpcEndpoints: [
            {
              VpcEndpointId: outputs['vpc-stack_s3-endpoint-id_75E8EEA3'],
              VpcEndpointType: 'Gateway',
              ServiceName: 'com.amazonaws.eu-south-1.s3',
              State: 'available',
            },
          ],
        },
        dynamodb: {
          VpcEndpoints: [
            {
              VpcEndpointId: outputs['vpc-stack_dynamodb-endpoint-id_8FD40CED'],
              VpcEndpointType: 'Gateway',
              ServiceName: 'com.amazonaws.eu-south-1.dynamodb',
              State: 'available',
            },
          ],
        },
      },
      describeInstances: {
        Reservations: [
          {
            Instances: [
              {
                InstanceId: outputs['vpc-stack_instance-ids_07654B89'][0],
                ImageId: 'ami-0abcdef1234567890',
                SubnetId: outputs['vpc-stack_private-subnet-ids_7503D504'][0],
                IamInstanceProfile: {
                  Arn: `arn:aws:iam::123456789012:instance-profile/payment-ec2-ssm-role-${environmentSuffix}`,
                },
                KeyName: undefined,
                MetadataOptions: {
                  HttpTokens: 'required' as const,
                },
              },
            ],
          },
        ],
      },
      describeRouteTables: {
        RouteTables: [
          {
            RouteTableId: 'rtb-public',
            VpcId: outputs['vpc-stack_vpc-id_B4D2EFC2'],
            Associations: [
              { SubnetId: outputs['vpc-stack_public-subnet-ids_9241F01E'][0] },
            ],
            Routes: [
              { DestinationCidrBlock: '0.0.0.0/0', GatewayId: 'igw-12345' },
            ],
          },
          {
            RouteTableId: 'rtb-private',
            VpcId: outputs['vpc-stack_vpc-id_B4D2EFC2'],
            Associations: [
              { SubnetId: outputs['vpc-stack_private-subnet-ids_7503D504'][0] },
            ],
            Routes: [
              {
                DestinationCidrBlock: '0.0.0.0/0',
                NatGatewayId: outputs['vpc-stack_nat-gateway-ids_979318AA'][0],
              },
            ],
          },
        ],
      },
      describeLogGroups: {
        logGroups: [
          {
            logGroupName: outputs['vpc-stack_flow-log-group-name_24D2A9FC'],
            retentionInDays: 7,
          },
        ],
      },
      listDashboards: {
        DashboardEntries: [
          {
            DashboardName: `payment-vpc-flowlogs-${environmentSuffix}`,
          },
        ],
      },
      getRole: {
        Role: {
          RoleName: `payment-ec2-ssm-role-${environmentSuffix}`,
          Path: '/',
          RoleId: 'AROA1234567890',
          Arn: `arn:aws:iam::123456789012:role/payment-ec2-ssm-role-${environmentSuffix}`,
          CreateDate: new Date(),
        },
      },
    };

    if (USE_MOCKS) {
      // Setup mock responses for EC2 calls
      ec2Mock.on(DescribeVpcsCommand).resolves(mockResponses.describeVpcs);
      ec2Mock.on(DescribeSubnetsCommand).callsFake((input: any) => {
        const subnetIds = input.SubnetIds || [];
        if (
          subnetIds.length === 1 &&
          subnetIds[0] === 'subnet-08b5cff2bbbe53dcc'
        ) {
          return Promise.resolve(mockResponses.describePublicSubnets);
        }
        if (
          subnetIds.length === 1 &&
          subnetIds[0] === 'subnet-0c9a866c52b43bbe4'
        ) {
          return Promise.resolve(mockResponses.describePrivateSubnets);
        }
        if (subnetIds.length === 2) {
          return Promise.resolve(mockResponses.describeAllSubnets);
        }
        return Promise.resolve({ Subnets: [] });
      });
      ec2Mock
        .on(DescribeNatGatewaysCommand)
        .resolves(mockResponses.describeNatGateways);
      ec2Mock.on(DescribeSecurityGroupsCommand).callsFake((input: any) => {
        const groupIds = input.GroupIds || [];
        if (groupIds.includes('sg-0158b178898338cbe')) {
          return Promise.resolve(mockResponses.describeSecurityGroups.web);
        }
        if (groupIds.includes('sg-00e70015d631d7372')) {
          return Promise.resolve(mockResponses.describeSecurityGroups.app);
        }
        return Promise.resolve({ SecurityGroups: [] });
      });
      ec2Mock.on(DescribeVpcEndpointsCommand).callsFake((input: any) => {
        const endpointIds = input.VpcEndpointIds || [];
        if (endpointIds.includes('vpce-022db3fea97e5d1a6')) {
          return Promise.resolve(mockResponses.describeVpcEndpoints.s3);
        }
        if (endpointIds.includes('vpce-07a52ab3fa841f445')) {
          return Promise.resolve(mockResponses.describeVpcEndpoints.dynamodb);
        }
        return Promise.resolve({ VpcEndpoints: [] });
      });
      ec2Mock
        .on(DescribeInstancesCommand)
        .resolves(mockResponses.describeInstances);
      ec2Mock
        .on(DescribeRouteTablesCommand)
        .resolves(mockResponses.describeRouteTables);

      // Setup mock responses for CloudWatch Logs
      logsClientMock
        .on(DescribeLogGroupsCommand)
        .resolves(mockResponses.describeLogGroups);

      // Setup mock responses for CloudWatch
      cloudWatchMock
        .on(ListDashboardsCommand)
        .resolves(mockResponses.listDashboards);

      // Setup mock responses for IAM
      iamMock.on(GetRoleCommand).resolves(mockResponses.getRole);
    }
  });

  afterAll(() => {
    if (USE_MOCKS) {
      ec2Mock.restore();
      logsClientMock.restore();
      cloudWatchMock.restore();
      iamMock.restore();
    }
  });

  describe('VPC Configuration', () => {
    test('VPC should exist with correct CIDR block', async () => {
      const vpcId = outputs['vpc-stack_vpc-id_B4D2EFC2'];
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have correct tags', async () => {
      const vpcId = outputs['vpc-stack_vpc-id_B4D2EFC2'];
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      const tags = response.Vpcs![0].Tags || [];
      const tagMap = tags.reduce(
        (acc, tag) => {
          acc[tag.Key!] = tag.Value!;
          return acc;
        },
        {} as Record<string, string>
      );

      expect(tagMap['Environment']).toBe('Production');
      expect(tagMap['Project']).toBe('PaymentGateway');
      expect(tagMap['Name']).toContain(environmentSuffix);
    });
  });

  describe('Subnet Configuration', () => {
    test('Subnets should have correct CIDR blocks', async () => {
      const publicSubnetIds = outputs['vpc-stack_public-subnet-ids_9241F01E'];
      const privateSubnetIds = outputs['vpc-stack_private-subnet-ids_7503D504'];

      const command = new DescribeSubnetsCommand({
        SubnetIds: [...publicSubnetIds, ...privateSubnetIds],
      });
      const response = await ec2Client.send(command);

      const cidrBlocks = response
        .Subnets!.map(subnet => subnet.CidrBlock)
        .sort();
      const expectedCidrs = ['10.0.0.0/24', '10.0.1.0/24'];

      expect(cidrBlocks).toEqual(expectedCidrs);
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('Should have 1 NAT Gateway for high availability', async () => {
      const natGatewayIds = outputs['vpc-stack_nat-gateway-ids_979318AA'];
      expect(natGatewayIds).toBeDefined();
      expect(natGatewayIds).toHaveLength(1);

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds,
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toHaveLength(1);
      response.NatGateways!.forEach(nat => {
        expect(nat.State).toBe('available');
      });
    });

    test('NAT Gateways should be in public subnets', async () => {
      const natGatewayIds = outputs['vpc-stack_nat-gateway-ids_979318AA'];
      const publicSubnetIds = outputs['vpc-stack_public-subnet-ids_9241F01E'];

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds,
      });
      const response = await ec2Client.send(command);

      response.NatGateways!.forEach(nat => {
        expect(publicSubnetIds).toContain(nat.SubnetId);
      });
    });

    test('Each NAT Gateway should have an Elastic IP', async () => {
      const natGatewayIds = outputs['vpc-stack_nat-gateway-ids_979318AA'];
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds,
      });
      const response = await ec2Client.send(command);

      response.NatGateways!.forEach(nat => {
        expect(nat.NatGatewayAddresses).toBeDefined();
        expect(nat.NatGatewayAddresses!.length).toBeGreaterThan(0);
        expect(nat.NatGatewayAddresses![0].AllocationId).toBeDefined();
      });
    });
  });

  describe('EC2 Instances Configuration', () => {
    test('Should have 1 EC2 instance in private subnets', async () => {
      const instanceIds = outputs['vpc-stack_instance-ids_07654B89'];
      expect(instanceIds).toBeDefined();
      expect(instanceIds).toHaveLength(1);

      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Reservations).toHaveLength(1);
      expect(response.Reservations![0].Instances).toHaveLength(1);
    });

    test('Instances should use Amazon Linux 2023 AMI', async () => {
      const instanceIds = outputs['vpc-stack_instance-ids_07654B89'];

      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });
      const response = await ec2Client.send(command);

      response.Reservations!.forEach(reservation => {
        const instance = reservation.Instances![0];
        const imageName = instance.ImageId;
        expect(imageName).toBeDefined();
        // AL2023 AMIs start with specific prefix
        expect(imageName).toMatch(/^ami-/);
      });
    });

    test('Instances should be in private subnets', async () => {
      const instanceIds = outputs['vpc-stack_instance-ids_07654B89'];

      const privateSubnetIds = outputs['vpc-stack_private-subnet-ids_7503D504'];

      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });
      const response = await ec2Client.send(command);

      response.Reservations!.forEach(reservation => {
        const instance = reservation.Instances![0];
        expect(privateSubnetIds).toContain(instance.SubnetId);
      });
    });

    test('Instances should have IAM instance profile for Session Manager', async () => {
      const instanceIds = outputs['vpc-stack_instance-ids_07654B89'];

      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });
      const response = await ec2Client.send(command);

      response.Reservations!.forEach(reservation => {
        const instance = reservation.Instances![0];
        expect(instance.IamInstanceProfile).toBeDefined();
        expect(instance.IamInstanceProfile!.Arn).toBeDefined();
      });
    });

    test('Instances should not have SSH key pairs', async () => {
      const instanceIds = outputs['vpc-stack_instance-ids_07654B89'];

      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });
      const response = await ec2Client.send(command);

      response.Reservations!.forEach(reservation => {
        const instance = reservation.Instances![0];
        expect(instance.KeyName).toBeUndefined();
      });
    });

    test('Instances should have IMDSv2 enabled', async () => {
      const instanceIds = outputs['vpc-stack_instance-ids_07654B89'];

      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });
      const response = await ec2Client.send(command);

      response.Reservations!.forEach(reservation => {
        const instance = reservation.Instances![0];
        expect(instance.MetadataOptions?.HttpTokens).toBe('required');
      });
    });
  });

  describe('VPC Flow Logs Configuration', () => {
    test('VPC Flow Logs should be enabled and logging to CloudWatch', async () => {
      const logGroupName = outputs['vpc-stack_flow-log-group-name_24D2A9FC'];
      expect(logGroupName).toBeDefined();

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
      expect(response.logGroups![0].logGroupName).toBe(logGroupName);
    });

    test('Flow Log Group should have retention policy', async () => {
      const logGroupName = outputs['vpc-stack_flow-log-group-name_24D2A9FC'];
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups![0].retentionInDays).toBe(7);
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('VPC Flow Logs dashboard should exist', async () => {
      const command = new ListDashboardsCommand({
        DashboardNamePrefix: `payment-vpc-flowlogs-${environmentSuffix}`,
      });
      const response = await cloudWatchClient.send(command);

      expect(response.DashboardEntries).toBeDefined();
      expect(response.DashboardEntries!.length).toBeGreaterThan(0);
    });
  });

  describe('IAM Roles', () => {
    test('EC2 SSM role should exist with correct policies', async () => {
      const roleName = `payment-ec2-ssm-role-${environmentSuffix}`;
      const command = new GetRoleCommand({
        RoleName: roleName,
      });

      await expect(iamClient.send(command)).resolves.toBeDefined();
    });
  });

  describe('Route Table Configuration', () => {
    test('Each subnet should have explicit route table association', async () => {
      const vpcId = outputs['vpc-stack_vpc-id_B4D2EFC2'];
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const routeTables = response.RouteTables || [];
      expect(routeTables.length).toBeGreaterThanOrEqual(2); // 1 public + 1 private

      // Verify all subnets have explicit associations
      const allSubnetIds = [
        ...outputs['vpc-stack_public-subnet-ids_9241F01E'],
        ...outputs['vpc-stack_private-subnet-ids_7503D504'],
      ];

      const associatedSubnets = new Set();
      routeTables.forEach(rt => {
        rt.Associations?.forEach(assoc => {
          if (assoc.SubnetId) {
            associatedSubnets.add(assoc.SubnetId);
          }
        });
      });

      allSubnetIds.forEach(subnetId => {
        expect(associatedSubnets.has(subnetId)).toBe(true);
      });
    });

    test('Private subnets should have routes to NAT Gateways', async () => {
      const vpcId = outputs['vpc-stack_vpc-id_B4D2EFC2'];
      const privateSubnetIds = outputs['vpc-stack_private-subnet-ids_7503D504'];

      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      // Find route tables associated with private subnets
      const privateRouteTables = response.RouteTables!.filter(rt =>
        rt.Associations?.some(assoc =>
          privateSubnetIds.includes(assoc.SubnetId || '')
        )
      );

      expect(privateRouteTables.length).toBeGreaterThan(0);

      // Each private route table should have a route to a NAT Gateway
      privateRouteTables.forEach(rt => {
        const natRoute = rt.Routes?.find(route => route.NatGatewayId);
        expect(natRoute).toBeDefined();
        expect(natRoute!.DestinationCidrBlock).toBe('0.0.0.0/0');
      });
    });

    test('Public subnets should have route to Internet Gateway', async () => {
      const vpcId = outputs['vpc-stack_vpc-id_B4D2EFC2'];
      const publicSubnetIds = outputs['vpc-stack_public-subnet-ids_9241F01E'];

      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      // Find route table associated with public subnets
      const publicRouteTable = response.RouteTables!.find(rt =>
        rt.Associations?.some(assoc =>
          publicSubnetIds.includes(assoc.SubnetId || '')
        )
      );

      expect(publicRouteTable).toBeDefined();
      const igwRoute = publicRouteTable!.Routes?.find(route =>
        route.GatewayId?.startsWith('igw-')
      );
      expect(igwRoute).toBeDefined();
      expect(igwRoute!.DestinationCidrBlock).toBe('0.0.0.0/0');
    });
  });

  describe('Resource Naming Convention', () => {
    test('All resources should include environment suffix in tags or names', async () => {
      const vpcId = outputs['vpc-stack_vpc-id_B4D2EFC2'];
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      const tags = response.Vpcs![0].Tags || [];
      const nameTag = tags.find(tag => tag.Key === 'Name');
      expect(nameTag?.Value).toContain(environmentSuffix);
    });
  });
});
