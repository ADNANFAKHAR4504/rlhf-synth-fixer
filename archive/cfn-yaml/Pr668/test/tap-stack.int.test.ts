import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcAttributeCommand,
  Vpc,
  Subnet,
  SecurityGroup,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client, // Import ELBv2 client
  DescribeLoadBalancersCommand, // Import commands
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  ElasticBeanstalkClient,
  DescribeEnvironmentsCommand,
  DescribeConfigurationSettingsCommand,
} from '@aws-sdk/client-elastic-beanstalk';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';

import * as fs from 'fs';
import * as path from 'path';

// --- Test Configuration ---
const STACK_NAME = `TapStack${process.env.ENVIRONMENT_SUFFIX || 'dev'}`;
const REGION = process.env.AWS_REGION || 'us-west-2';

// --- Type Definition for Stack Outputs ---
interface StackOutputs {
  ApplicationURL: string;
  LoadBalancerURL: string; // Updated from ElasticBeanstalkURL
  RDSEndpoint: string;
  DBSecretARN?: string; // Optional as it's conditional
  VPCId: string;
  PrivateSubnetIds: string;
}

// --- AWS SDK Clients ---
const ec2Client = new EC2Client({ region: REGION });
const ebClient = new ElasticBeanstalkClient({ region: REGION });
const rdsClient = new RDSClient({ region: REGION });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: REGION }); // Add ELBv2 client

// --- Read Deployed Stack Outputs ---
let outputs: StackOutputs | null = null;
try {
  const rawOutputs = fs.readFileSync(
    path.join(__dirname, 'cfn-outputs.json'),
    'utf8'
  );
  const outputsObject = JSON.parse(rawOutputs).Stacks[0].Outputs.reduce(
    (acc: any, curr: any) => {
      acc[curr.OutputKey] = curr.OutputValue;
      return acc;
    },
    {}
  );
  outputs = outputsObject as StackOutputs;
} catch (error) {
  console.warn(
    'cfn-outputs.json not found. Integration tests will be skipped.'
  );
}

const testSuite = outputs ? describe : describe.skip;

testSuite('Node.js Production Stack Integration Tests', () => {
  let vpcId: string;

  beforeAll(() => {
    vpcId = outputs!.VPCId;
  });

  describe('🌐 Networking Infrastructure', () => {
    test('VPC should exist with DNS support enabled', async () => {
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      expect(Vpcs).toHaveLength(1);
      const vpc: Vpc = Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');

      const dnsSupport = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: vpcId,
          Attribute: 'enableDnsSupport',
        })
      );
      expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);

      const dnsHostnames = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: vpcId,
          Attribute: 'enableDnsHostnames',
        })
      );
      expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
    });

    test('Should have 2 public and 2 private subnets across different AZs', async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );
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
  });

  describe('🛡️ Security', () => {
    test('DB Security Group should only allow traffic from the App Security Group', async () => {
      const { SecurityGroups: dbSgs } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'tag:Name', Values: [`${STACK_NAME}-DBSG`] },
          ],
        })
      );
      expect(dbSgs).toHaveLength(1);
      const dbSg: SecurityGroup = dbSgs![0];

      const { SecurityGroups: appSgs } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'tag:Name', Values: [`${STACK_NAME}-AppSG`] },
          ],
        })
      );
      expect(appSgs).toHaveLength(1);
      const appSg: SecurityGroup = appSgs![0];

      const ingressRule = dbSg.IpPermissions!.find(p => p.FromPort === 5432);
      expect(ingressRule).toBeDefined();
      expect(ingressRule!.UserIdGroupPairs![0].GroupId).toBe(appSg.GroupId);
    });
  });

  describe('🏗️ Application Infrastructure', () => {
    test('ALB should exist and be configured correctly', async () => {
      const { LoadBalancers } = await elbv2Client.send(
        new DescribeLoadBalancersCommand({
          Names: [`${STACK_NAME}-ALB`],
        })
      );
      expect(LoadBalancers).toHaveLength(1);
      const alb = LoadBalancers![0];
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.State?.Code).toBe('active');

      const { Listeners } = await elbv2Client.send(
        new DescribeListenersCommand({ LoadBalancerArn: alb.LoadBalancerArn })
      );
      const httpsListener = Listeners?.find(l => l.Port === 443);
      const httpListener = Listeners?.find(l => l.Port === 80);

      expect(httpsListener).toBeDefined();
      expect(httpsListener?.Protocol).toBe('HTTPS');
      expect(httpsListener?.Certificates).toHaveLength(1);

      expect(httpListener).toBeDefined();
      expect(httpListener?.Protocol).toBe('HTTP');
      expect(httpListener?.DefaultActions?.[0].Type).toBe('redirect');
    }, 30000);

    test('Elastic Beanstalk environment should be ready and load-balancer-free', async () => {
      const { Environments } = await ebClient.send(
        new DescribeEnvironmentsCommand({
          EnvironmentNames: [`${STACK_NAME}-Env`],
        })
      );
      expect(Environments).toHaveLength(1);
      const env = Environments![0];
      expect(env.Status).toBe('Ready');
      expect(env.Health).toBe('Green');

      const { ConfigurationSettings } = await ebClient.send(
        new DescribeConfigurationSettingsCommand({
          ApplicationName: env.ApplicationName,
          EnvironmentName: env.EnvironmentName,
        })
      );
      const lbSetting = ConfigurationSettings?.[0].OptionSettings?.find(
        o =>
          o.Namespace === 'aws:elasticbeanstalk:environment' &&
          o.OptionName === 'LoadBalancerType'
      );
      expect(lbSetting?.Value).toBe('none');
    }, 30000);

    test('RDS instance should be running, Multi-AZ, and encrypted', async () => {
      const dbInstanceIdentifier = `${STACK_NAME.toLowerCase()}db`;
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbInstanceIdentifier,
        })
      );
      expect(DBInstances).toHaveLength(1);
      const db = DBInstances![0];
      expect(db.DBInstanceStatus).toBe('available');
      expect(db.MultiAZ).toBe(true);
      expect(db.StorageEncrypted).toBe(true);
      expect(db.Engine).toContain('postgres');
    }, 30000);
  });
});
