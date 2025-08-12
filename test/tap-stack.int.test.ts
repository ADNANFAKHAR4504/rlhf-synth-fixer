import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  Vpc,
  Subnet,
  RouteTable,
  SecurityGroup,
} from '@aws-sdk/client-ec2';
import {
  ElasticBeanstalkClient,
  DescribeEnvironmentsCommand,
  DescribeConfigurationSettingsCommand,
  EnvironmentDescription,
} from '@aws-sdk/client-elastic-beanstalk';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DBInstance,
} from '@aws-sdk/client-rds';
import {
  Route53Client,
  ListResourceRecordSetsCommand,
  ListHostedZonesByNameCommand,
  ResourceRecordSet,
} from '@aws-sdk/client-route-53';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import * as fs from 'fs';
import * as path from 'path';

// --- Test Configuration ---
const STACK_NAME = `TapStack${process.env.ENVIRONMENT_SUFFIX || 'dev'}`;
const REGION = process.env.AWS_REGION || 'us-west-2';

// --- Type Definition for Stack Outputs ---
interface StackOutputs {
  ApplicationURL: string;
  ElasticBeanstalkURL: string;
  RDSEndpoint: string;
  DBSecretARN?: string; // Optional as it's conditional
  VPCId: string;
  PrivateSubnetIds: string;
  DomainName?: string;
  HostedZoneName?: string;
}

// --- AWS SDK Clients ---
const ec2Client = new EC2Client({ region: REGION });
const ebClient = new ElasticBeanstalkClient({ region: REGION });
const rdsClient = new RDSClient({ region: REGION });
const route53Client = new Route53Client({ region: REGION });
const secretsManagerClient = new SecretsManagerClient({ region: REGION });
const cwLogsClient = new CloudWatchLogsClient({ region: REGION });

// --- Read Deployed Stack Outputs ---
let outputs: StackOutputs | null = null;
try {
  const rawOutputs = fs.readFileSync(
    path.join(__dirname, 'cfn-outputs.json'),
    'utf8'
  );
  // Parse outputs from CloudFormation describe-stacks command
  const outputsObject = JSON.parse(rawOutputs).Stacks[0].Outputs.reduce(
    (acc: any, curr: any) => {
      acc[curr.OutputKey] = curr.OutputValue;
      return acc;
    },
    {}
  );
  // Add parameters that might not be in outputs
  outputsObject.DomainName =
    outputsObject.DomainName || 'app.tap.us-west-2.meerio.com';
  outputsObject.HostedZoneName = outputsObject.HostedZoneName || 'meerio.com.';
  outputs = outputsObject as StackOutputs;
} catch (error) {
  console.warn(
    'cfn-outputs.json not found or is invalid. Integration tests will be skipped. Make sure to deploy the stack and generate the outputs file.'
  );
}

const testSuite = outputs ? describe : describe.skip;

testSuite('Node.js Production Stack Integration Tests', () => {
  let vpcId: string;
  let ebEnvironmentName: string;
  let dbInstanceIdentifier: string;

  beforeAll(async () => {
    // Use VPC ID from outputs if available
    if (outputs && outputs.VPCId) {
      vpcId = outputs.VPCId;
    }

    // Find the deployed Elastic Beanstalk environment
    const ebResponse = await ebClient.send(
      new DescribeEnvironmentsCommand({
        EnvironmentNames: [`${STACK_NAME}-Env`],
      })
    );
    if (!ebResponse.Environments || ebResponse.Environments.length === 0) {
      throw new Error(
        `Could not find deployed Elastic Beanstalk environment named ${STACK_NAME}-Env`
      );
    }
    const environment: EnvironmentDescription = ebResponse.Environments[0];
    expect(environment.EnvironmentName).toBeDefined();
    ebEnvironmentName = environment.EnvironmentName!;

    // Find the RDS instance
    dbInstanceIdentifier = `${STACK_NAME.toLowerCase()}db`;
    const rdsResponse = await rdsClient.send(
      new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceIdentifier,
      })
    );
    if (!rdsResponse.DBInstances || rdsResponse.DBInstances.length === 0) {
      throw new Error(
        `Could not find deployed RDS instance with identifier: ${dbInstanceIdentifier}`
      );
    }
    const dbInstance: DBInstance = rdsResponse.DBInstances[0];

    // If VPC ID wasn't in outputs, get it from RDS
    if (!vpcId && dbInstance.DBSubnetGroup) {
      vpcId = dbInstance.DBSubnetGroup.VpcId!;
    }
  }, 60000);

  describe('🌐 Networking Infrastructure', () => {
    test('VPC should exist and be in an available state', async () => {
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      expect(Vpcs).toBeDefined();
      expect(Vpcs!).toHaveLength(1);
      const vpc: Vpc = Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      expect(vpc.EnableDnsSupport).toBe(true);
      expect(vpc.EnableDnsHostnames).toBe(true);
    });

    test('Should have 2 public and 2 private subnets across different AZs', async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );
      expect(Subnets).toBeDefined();
      const subnets: Subnet[] = Subnets!;

      const publicSubnets = subnets.filter(s => s.MapPublicIpOnLaunch === true);
      const privateSubnets = subnets.filter(
        s => s.MapPublicIpOnLaunch === false
      );

      expect(publicSubnets).toHaveLength(2);
      expect(privateSubnets).toHaveLength(2);

      const publicAzs = new Set(publicSubnets.map(s => s.AvailabilityZone));
      const privateAzs = new Set(privateSubnets.map(s => s.AvailabilityZone));
      expect(publicAzs.size).toBe(2);
      expect(privateAzs.size).toBe(2);
    });

    test('Should have 2 NAT Gateways for high availability', async () => {
      const { NatGateways } = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'state', Values: ['available'] },
          ],
        })
      );
      expect(NatGateways).toBeDefined();
      expect(NatGateways!).toHaveLength(2);

      // Verify NAT Gateways are in different AZs
      const natAzs = new Set(NatGateways!.map(ng => ng.SubnetId));
      expect(natAzs.size).toBe(2);
    });

    test('Private subnets should route internet traffic through NAT Gateways', async () => {
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'tag:Name', Values: [`${STACK_NAME}-PrivateRouteTable*`] },
          ],
        })
      );

      expect(RouteTables).toBeDefined();
      expect(RouteTables!).toHaveLength(2);

      RouteTables!.forEach((rt: RouteTable) => {
        expect(rt.Routes).toBeDefined();
        const natRoute = rt.Routes!.find(
          r => r.DestinationCidrBlock === '0.0.0.0/0'
        );
        expect(natRoute).toBeDefined();
        expect(natRoute!.NatGatewayId).toBeDefined();
      });
    });
  });

  describe('🛡️ Security', () => {
    test('LoadBalancer Security Group should allow public HTTP/HTTPS traffic', async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'tag:Name', Values: [`${STACK_NAME}-LBSG`] },
          ],
        })
      );
      expect(SecurityGroups).toBeDefined();
      expect(SecurityGroups!).toHaveLength(1);
      const albSg: SecurityGroup = SecurityGroups![0];

      expect(albSg.IpPermissions).toBeDefined();
      const httpRule = albSg.IpPermissions!.find(
        p => p.FromPort === 80 && p.ToPort === 80 && p.IpProtocol === 'tcp'
      );
      const httpsRule = albSg.IpPermissions!.find(
        p => p.FromPort === 443 && p.ToPort === 443 && p.IpProtocol === 'tcp'
      );

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');
    });

    test('DB Security Group should only allow traffic from the App Security Group', async () => {
      const { SecurityGroups: dbSgs } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'tag:Name', Values: [`${STACK_NAME}-DBSG`] },
          ],
        })
      );
      expect(dbSgs).toBeDefined();
      expect(dbSgs!).toHaveLength(1);
      const dbSg: SecurityGroup = dbSgs![0];

      const { SecurityGroups: appSgs } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'tag:Name', Values: [`${STACK_NAME}-AppSG`] },
          ],
        })
      );
      expect(appSgs).toBeDefined();
      expect(appSgs!).toHaveLength(1);
      const appSg: SecurityGroup = appSgs![0];

      expect(dbSg.IpPermissions).toBeDefined();
      const ingressRule = dbSg.IpPermissions!.find(p => p.FromPort === 5432);
      expect(ingressRule).toBeDefined();
      expect(ingressRule!.UserIdGroupPairs).toBeDefined();
      expect(ingressRule!.UserIdGroupPairs!).toHaveLength(1);
      expect(ingressRule!.UserIdGroupPairs![0].GroupId).toBe(appSg.GroupId);
    });
  });
});
