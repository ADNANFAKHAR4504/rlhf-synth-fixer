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
import * as fs from 'fs';
import * as path from 'path';

// --- Test Configuration ---
const STACK_NAME = `TapStack${process.env.ENVIRONMENT_SUFFIX || 'dev'}`;
const REGION = process.env.AWS_REGION || 'us-west-2';

// --- Type Definition for Stack Outputs ---
interface StackOutputs {
  ApplicationURL: string;
  RDSEndpoint: string;
  DBSecretARN: string;
  DomainName: string;
  HostedZoneName: string;
}

// --- AWS SDK Clients ---
const ec2Client = new EC2Client({ region: REGION });
const ebClient = new ElasticBeanstalkClient({ region: REGION });
const rdsClient = new RDSClient({ region: REGION });
const route53Client = new Route53Client({ region: REGION });
const secretsManagerClient = new SecretsManagerClient({ region: REGION });

// --- Read Deployed Stack Outputs ---
let outputs: StackOutputs | null = null;
try {
  const rawOutputs = fs.readFileSync(
    path.join(__dirname, 'cfn-outputs.json'),
    'utf8'
  );
  // A simple hack to get outputs from the `aws cloudformation describe-stacks` command
  const outputsObject = JSON.parse(rawOutputs).Stacks[0].Outputs.reduce(
    (acc: any, curr: any) => {
      acc[curr.OutputKey] = curr.OutputValue;
      return acc;
    },
    {}
  );
  // You might need to add your parameters to this file as well during your CI process
  outputsObject.DomainName = 'app.tap.us-west-2.meerio.com'; // Or read from params
  outputsObject.HostedZoneName = 'meerio.com.'; // Or read from params
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

    // Find the RDS instance to get its VPC
    // Note: CloudFormation often lowercases the logical ID for the physical resource name.
    const rdsResponse = await rdsClient.send(
      new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `${STACK_NAME.toLowerCase()}db`,
      })
    );
    if (!rdsResponse.DBInstances || rdsResponse.DBInstances.length === 0) {
      throw new Error(
        `Could not find deployed RDS instance with identifier: ${STACK_NAME.toLowerCase()}db`
      );
    }
    const dbInstance: DBInstance = rdsResponse.DBInstances[0];
    expect(dbInstance.DBInstanceIdentifier).toBeDefined();
    dbInstanceIdentifier = dbInstance.DBInstanceIdentifier!;

    expect(dbInstance.DBSubnetGroup).toBeDefined();
    expect(dbInstance.DBSubnetGroup!.VpcId).toBeDefined();
    vpcId = dbInstance.DBSubnetGroup!.VpcId!;
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

    test('Private subnets should route internet traffic through a NAT Gateway', async () => {
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
            { Name: 'group-name', Values: [`${STACK_NAME}-LBSG`] },
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
            { Name: 'group-name', Values: [`${STACK_NAME}-DBSG`] },
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
            { Name: 'group-name', Values: [`${STACK_NAME}-AppSG`] },
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

    test('Database password secret should exist and be encrypted', async () => {
      const secretArn = outputs!.DBSecretARN;
      const { ARN, Name, KmsKeyId } = await secretsManagerClient.send(
        new DescribeSecretCommand({ SecretId: secretArn })
      );
      expect(ARN).toBe(secretArn);
      expect(Name).toContain('DBSecret');
      expect(KmsKeyId).toBeDefined();
    });
  });

  describe('📦 Database (RDS)', () => {
    test('RDS instance should be available, Multi-AZ, and encrypted', async () => {
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbInstanceIdentifier,
        })
      );
      expect(DBInstances).toBeDefined();
      expect(DBInstances!).toHaveLength(1);
      const db: DBInstance = DBInstances![0];

      expect(db.DBInstanceStatus).toBe('available');
      expect(db.MultiAZ).toBe(true);
      expect(db.StorageEncrypted).toBe(true);
      expect(db.Engine).toBe('postgres');
    }, 120000);
  });

  describe('🚀 Application (Elastic Beanstalk) & DNS', () => {
    test('Elastic Beanstalk environment should be Ready and Healthy', async () => {
      const { Environments } = await ebClient.send(
        new DescribeEnvironmentsCommand({
          EnvironmentNames: [ebEnvironmentName],
        })
      );
      expect(Environments).toBeDefined();
      expect(Environments!).toHaveLength(1);
      const env: EnvironmentDescription = Environments![0];

      expect(env.Status).toBe('Ready');
      expect(env.Health).toBe('Green');
    }, 180000);

    test('Route 53 should have an A record pointing to the application URL', async () => {
      const { HostedZoneName, DomainName, ApplicationURL } = outputs!;

      const { HostedZones } = await route53Client.send(
        new ListHostedZonesByNameCommand({ DNSName: HostedZoneName })
      );
      expect(HostedZones).toBeDefined();
      expect(HostedZones!).toHaveLength(1);
      expect(HostedZones![0].Id).toBeDefined();
      const hostedZoneId = HostedZones![0].Id!.split('/')[2];

      const { ResourceRecordSets } = await route53Client.send(
        new ListResourceRecordSetsCommand({ HostedZoneId: hostedZoneId })
      );
      expect(ResourceRecordSets).toBeDefined();

      const aRecord = ResourceRecordSets!.find(
        (r: ResourceRecordSet) => r.Name === `${DomainName}.` && r.Type === 'A'
      );
      expect(aRecord).toBeDefined();
      expect(aRecord!.AliasTarget).toBeDefined();
      // The Alias DNS Name will be the dualstack Beanstalk endpoint. We check that it contains the environment URL's core part.
      const beanstalkEndpoint = ApplicationURL.replace('http://', '');
      expect(aRecord!.AliasTarget!.DNSName).toContain(beanstalkEndpoint);
    });
  });
});
