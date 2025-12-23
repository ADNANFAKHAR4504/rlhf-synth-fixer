import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';

import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// Optional override for region
const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE || props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Provider with LocalStack compatibility
    const isLocalStack = process.env.AWS_ENDPOINT_URL || process.env.LOCALSTACK_HOSTNAME;
    const awsProviderConfig: any = {
      region: awsRegion,
      defaultTags: defaultTags,
    };

    if (isLocalStack) {
      const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
      awsProviderConfig.accessKey = 'test';
      awsProviderConfig.secretKey = 'test';
      awsProviderConfig.skipCredentialsValidation = true;
      awsProviderConfig.skipMetadataApiCheck = true;
      awsProviderConfig.skipRequestingAccountId = true;
      awsProviderConfig.s3UsePathStyle = true;
      awsProviderConfig.endpoints = [{
        ec2: endpoint,
        cloudwatch: endpoint,
        logs: endpoint,
        iam: endpoint,
        s3: endpoint,
      }];
    }

    new AwsProvider(this, 'aws', awsProviderConfig);

    // Backend (skip for LocalStack)
    if (!isLocalStack) {
      new S3Backend(this, {
        bucket: stateBucket,
        key: `${environmentSuffix}/${id}.tfstate`,
        region: stateBucketRegion,
        encrypt: true,
      });
    }

    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // ──────── VPC Infrastructure ────────

    const vpc = new Vpc(this, 'mainVpc', {
      cidrBlock: '10.0.0.0/16',
      tags: {
        Name: 'main-vpc',
        Environment: 'Production',
      },
    });

    // Public subnets
    const publicSubnets = Array.from({ length: 2 }).map(
      (_, index) =>
        new Subnet(this, `publicSubnet${index + 1}`, {
          vpcId: vpc.id,
          cidrBlock: `10.0.${index}.0/24`,
          availabilityZone: `${awsRegion}${String.fromCharCode(97 + index)}`, // a, b
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `public-subnet-${index + 1}`,
            Environment: 'Production',
          },
        })
    );

    // Private subnets
    const privateSubnets = Array.from({ length: 2 }).map(
      (_, index) =>
        new Subnet(this, `privateSubnet${index + 1}`, {
          vpcId: vpc.id,
          cidrBlock: `10.0.${index + 2}.0/24`,
          availabilityZone: `${awsRegion}${String.fromCharCode(97 + index)}`,
          tags: {
            Name: `private-subnet-${index + 1}`,
            Environment: 'Production',
          },
        })
    );

    const igw = new InternetGateway(this, 'mainIgw', {
      vpcId: vpc.id,
      tags: {
        Name: 'main-igw',
        Environment: 'Production',
      },
    });

    const publicRouteTable = new RouteTable(this, 'publicRouteTable', {
      vpcId: vpc.id,
      route: [
        {
          cidrBlock: '0.0.0.0/0',
          gatewayId: igw.id,
        },
      ],
      tags: {
        Name: 'public-route-table',
        Environment: 'Production',
      },
    });

    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `publicRta${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    const eip = new Eip(this, 'natEip', {
      tags: {
        Name: 'nat-eip',
        Environment: 'Production',
      },
    });

    const natGateway = new NatGateway(this, 'natGateway', {
      subnetId: publicSubnets[0].id,
      allocationId: eip.id,
      tags: {
        Name: 'nat-gateway',
        Environment: 'Production',
      },
    });

    const privateRouteTable = new RouteTable(this, 'privateRouteTable', {
      vpcId: vpc.id,
      route: [
        {
          cidrBlock: '0.0.0.0/0',
          natGatewayId: natGateway.id,
        },
      ],
      tags: {
        Name: 'private-route-table',
        Environment: 'Production',
      },
    });

    privateSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `privateRta${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    const logGroup = new CloudwatchLogGroup(this, 'vpcFlowLogs', {
      name: '/aws/vpc/flow-logs',
      retentionInDays: 30,
      tags: {
        Name: 'vpc-flow-logs',
        Environment: 'Production',
      },
    });

    const iamRole = new IamRole(this, 'flowLogRole', {
      name: 'flow_log_role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'vpc-flow-logs.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: 'flow-log-role',
        Environment: 'Production',
      },
    });

    new IamRolePolicy(this, 'flowLogPolicy', {
      name: 'flow_log_policy',
      role: iamRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
            ],
            Effect: 'Allow',
            Resource: logGroup.arn,
          },
        ],
      }),
    });

    new FlowLog(this, 'vpcFlowLog', {
      iamRoleArn: iamRole.arn,
      logDestination: logGroup.arn,
      logDestinationType: 'cloud-watch-logs',
      trafficType: 'ALL',
      vpcId: vpc.id,
      tags: {
        Name: 'vpc-flow-log',
        Environment: 'Production',
      },
    });

    console.log(`Configured ${privateSubnets.length} private subnets`);
  }
}
