import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput, Fn } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NetworkAcl } from '@cdktf/provider-aws/lib/network-acl';
import { NetworkAclRule } from '@cdktf/provider-aws/lib/network-acl-rule';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

export interface TapStackConfig {
  environmentSuffix: string;
  region: string;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: TapStackConfig) {
    super(scope, id);

    const { environmentSuffix, region } = config;

    // AWS Provider
    new AwsProvider(this, 'aws', {
      region: region,
    });

    // Get current AWS account ID
    const currentAccount = new DataAwsCallerIdentity(this, 'current', {});

    // VPC
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `financial-vpc-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: 'Financial Services Application',
      },
    });

    // Availability Zones
    const availabilityZones = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

    // Public Subnets
    const publicSubnetCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];
    const publicSubnets: Subnet[] = [];

    publicSubnetCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `public-subnet-${index}`, {
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-${index + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
          Purpose: 'Public subnet for external-facing resources',
          Tier: 'Public',
        },
      });
      publicSubnets.push(subnet);
    });

    // Private Subnets
    const privateSubnetCidrs = [
      '10.0.101.0/24',
      '10.0.102.0/24',
      '10.0.103.0/24',
    ];
    const privateSubnets: Subnet[] = [];

    privateSubnetCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `private-subnet-${index}`, {
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: availabilityZones[index],
        mapPublicIpOnLaunch: false,
        tags: {
          Name: `private-subnet-${index + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
          Purpose: 'Private subnet for internal microservices',
          Tier: 'Private',
        },
      });
      privateSubnets.push(subnet);
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        Name: `igw-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Elastic IPs for NAT Gateways
    const eips: Eip[] = [];
    for (let i = 0; i < 3; i++) {
      const eip = new Eip(this, `eip-${i}`, {
        domain: 'vpc',
        tags: {
          Name: `nat-eip-${i + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      });
      eips.push(eip);
    }

    // NAT Gateways (one in each public subnet)
    const natGateways: NatGateway[] = [];
    publicSubnets.forEach((subnet, index) => {
      const nat = new NatGateway(this, `nat-${index}`, {
        allocationId: eips[index].id,
        subnetId: subnet.id,
        tags: {
          Name: `nat-gateway-${index + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      });
      natGateways.push(nat);
    });

    // Public Route Table
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: vpc.id,
      tags: {
        Name: `public-rt-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Route to Internet Gateway for public subnets
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Private Route Tables (one per AZ)
    const privateRouteTables: RouteTable[] = [];
    privateSubnets.forEach((subnet, index) => {
      const privateRt = new RouteTable(this, `private-rt-${index}`, {
        vpcId: vpc.id,
        tags: {
          Name: `private-rt-${index + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      });
      privateRouteTables.push(privateRt);

      // Route to NAT Gateway
      new Route(this, `private-route-${index}`, {
        routeTableId: privateRt.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[index].id,
      });

      // Associate private subnet with its route table
      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRt.id,
      });
    });

    // Network ACL
    const networkAcl = new NetworkAcl(this, 'network-acl', {
      vpcId: vpc.id,
      subnetIds: [
        ...publicSubnets.map(s => s.id),
        ...privateSubnets.map(s => s.id),
      ],
      tags: {
        Name: `network-acl-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Network ACL Rule - Deny inbound SSH from internet
    new NetworkAclRule(this, 'nacl-deny-ssh', {
      networkAclId: networkAcl.id,
      ruleNumber: 100,
      protocol: '6', // TCP
      ruleAction: 'deny',
      cidrBlock: '0.0.0.0/0',
      fromPort: 22,
      toPort: 22,
      egress: false,
    });

    // Network ACL Rule - Allow all other inbound traffic
    new NetworkAclRule(this, 'nacl-allow-inbound', {
      networkAclId: networkAcl.id,
      ruleNumber: 200,
      protocol: '-1', // All protocols
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      egress: false,
    });

    // Network ACL Rule - Allow all outbound traffic
    new NetworkAclRule(this, 'nacl-allow-outbound', {
      networkAclId: networkAcl.id,
      ruleNumber: 100,
      protocol: '-1', // All protocols
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      egress: true,
    });

    // S3 Bucket for VPC Flow Logs
    const flowLogsBucket = new S3Bucket(this, 'flow-logs-bucket', {
      bucket: `vpc-flow-logs-${environmentSuffix}-${currentAccount.accountId}-xy`,
      tags: {
        Name: `vpc-flow-logs-${environmentSuffix}-xy`,
        Environment: environmentSuffix,
      },
    });

    // S3 Bucket Encryption
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'flow-logs-encryption',
      {
        bucket: flowLogsBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    // S3 Bucket Public Access Block
    new S3BucketPublicAccessBlock(this, 'flow-logs-public-access-block', {
      bucket: flowLogsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // S3 Bucket Lifecycle Policy - 90-day retention
    new S3BucketLifecycleConfiguration(this, 'flow-logs-lifecycle', {
      bucket: flowLogsBucket.id,
      rule: [
        {
          id: 'expire-old-logs',
          status: 'Enabled',
          filter: [{}], // Empty filter to apply to all objects
          expiration: [
            {
              days: 90,
            },
          ],
        },
      ],
    });

    // VPC Flow Logs
    new FlowLog(this, 'vpc-flow-log', {
      vpcId: vpc.id,
      trafficType: 'ALL',
      logDestinationType: 's3',
      logDestination: `arn:aws:s3:::${flowLogsBucket.id}`,
      tags: {
        Name: `vpc-flow-log-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // CloudWatch Alarms for NAT Gateways
    natGateways.forEach((nat, index) => {
      new CloudwatchMetricAlarm(this, `nat-alarm-${index}`, {
        alarmName: `nat-gateway-${index + 1}-high-bytes-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'BytesOutToDestination',
        namespace: 'AWS/NATGateway',
        period: 300, // 5 minutes
        statistic: 'Sum',
        threshold: 1073741824, // 1GB in bytes
        actionsEnabled: true,
        alarmDescription: `Alert when NAT Gateway ${index + 1} bytes out exceeds 1GB in 5 minutes`,
        dimensions: {
          NatGatewayId: nat.id,
        },
        tags: {
          Name: `nat-alarm-${index + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      });
    });

    // Outputs
    new TerraformOutput(this, 'vpc_id', {
      value: vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public_subnet_ids', {
      value: Fn.jsonencode(publicSubnets.map(s => s.id)),
      description: 'Public Subnet IDs',
    });

    new TerraformOutput(this, 'private_subnet_ids', {
      value: Fn.jsonencode(privateSubnets.map(s => s.id)),
      description: 'Private Subnet IDs',
    });

    new TerraformOutput(this, 'nat_gateway_ids', {
      value: Fn.jsonencode(natGateways.map(n => n.id)),
      description: 'NAT Gateway IDs',
    });

    new TerraformOutput(this, 'internet_gateway_id', {
      value: igw.id,
      description: 'Internet Gateway ID',
    });

    new TerraformOutput(this, 'flow_logs_bucket', {
      value: flowLogsBucket.id,
      description: 'S3 Bucket for VPC Flow Logs',
    });
  }
}
