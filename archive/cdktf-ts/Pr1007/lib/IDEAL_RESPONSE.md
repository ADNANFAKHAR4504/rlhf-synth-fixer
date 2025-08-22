# Infrastructure as Code with CDKTF TypeScript

This project implements a production-ready enterprise infrastructure using AWS CDK for Terraform (CDKTF) with TypeScript.

## tap-stack.ts

```typescript
import { Construct } from 'constructs';
import { TerraformStack, Fn } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';
import { Password } from '@cdktf/provider-random/lib/password';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';

// --- Naming Convention Helper ---
const createResourceName = (
  env: string,
  resourceType: string,
  uniqueId: string
): string => {
  return `${env}-${resourceType}-${uniqueId}`;
};

// --- Main Stack for Production Environment ---
export class EnterpriseStack extends TerraformStack {
  constructor(scope: Construct, id: string, env: string) {
    super(scope, id);

    new AwsProvider(this, 'aws', { region: 'us-east-1' });
    new RandomProvider(this, 'random');

    const uniqueSuffix = Fn.substr(Fn.uuid(), 0, 8);

    // --- Remote State Management Resources ---
    const backendBucket = new S3Bucket(this, 'TerraformStateBucket', {
      bucket: `enterprise-tfstate-bucket-${env}-${uniqueSuffix}`,
    });

    new S3BucketVersioningA(this, 'StateBucketVersioning', {
      bucket: backendBucket.id,
      versioningConfiguration: { status: 'Enabled' },
    });

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'StateBucketEncryption',
      {
        bucket: backendBucket.id,
        rule: [
          { applyServerSideEncryptionByDefault: { sseAlgorithm: 'AES256' } },
        ],
      }
    );

    new S3BucketPublicAccessBlock(this, 'StateBucketPublicAccessBlock', {
      bucket: backendBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new DynamodbTable(this, 'TerraformLockTable', {
      name: `enterprise-terraform-locks-${env}-${uniqueSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'LockID',
      attribute: [{ name: 'LockID', type: 'S' }],
    });

    // --- Networking Module ---
    const vpc = new Vpc(this, 'Vpc', {
      cidrBlock: '10.0.0.0/16',
      tags: { Name: createResourceName(env, 'vpc', 'main') },
      lifecycle: { preventDestroy: true },
    });

    const igw = new InternetGateway(this, 'Igw', {
      vpcId: vpc.id,
      tags: { Name: createResourceName(env, 'igw', 'main') },
    });

    const appSubnets = [
      new Subnet(this, 'AppSubnetA', {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: 'us-east-1a',
        tags: { Name: createResourceName(env, 'subnet', 'app-a') },
      }),
      new Subnet(this, 'AppSubnetB', {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: 'us-east-1b',
        tags: { Name: createResourceName(env, 'subnet', 'app-b') },
      }),
    ];

    const dbSubnets = [
      new Subnet(this, 'DbSubnetA', {
        vpcId: vpc.id,
        cidrBlock: '10.0.101.0/24',
        availabilityZone: 'us-east-1a',
        tags: { Name: createResourceName(env, 'subnet', 'db-a') },
      }),
      new Subnet(this, 'DbSubnetB', {
        vpcId: vpc.id,
        cidrBlock: '10.0.102.0/24',
        availabilityZone: 'us-east-1b',
        tags: { Name: createResourceName(env, 'subnet', 'db-b') },
      }),
    ];

    // --- NAT Gateways and Routing for Private Subnets ---
    const natGatewayEip = new Eip(this, 'NatGatewayEip', {
      domain: 'vpc',
      // FIX: Added a unique tag to the EIP for easier identification in the AWS Console.
      tags: { Name: createResourceName(env, 'eip', `nat-${uniqueSuffix}`) },
    });

    const natGateway = new NatGateway(this, 'NatGateway', {
      allocationId: natGatewayEip.id,
      subnetId: appSubnets[0].id, // Place NAT Gateway in a public subnet
    });

    const privateRouteTable = new RouteTable(this, 'PrivateRouteTable', {
      vpcId: vpc.id,
      tags: { Name: createResourceName(env, 'rt', 'private') },
    });

    new Route(this, 'PrivateDefaultRoute', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway.id,
    });

    dbSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `DbRta${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    const publicRouteTable = new RouteTable(this, 'PublicRouteTable', {
      vpcId: vpc.id,
      tags: { Name: createResourceName(env, 'rt', 'public') },
    });
    new Route(this, 'PublicDefaultRoute', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });
    appSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `AppRta${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // --- Security Groups ---
    const appSg = new SecurityGroup(this, 'AppSg', {
      name: createResourceName(env, 'sg', 'app'),
      vpcId: vpc.id,
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
    });
    const dbSg = new SecurityGroup(this, 'DbSg', {
      name: createResourceName(env, 'sg', 'db'),
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          securityGroups: [appSg.id],
        },
      ],
    });

    // --- Compute Module ---
    const latestAmi = new DataAwsAmi(this, 'LatestAmazonLinux', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [{ name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] }],
    });

    const launchTemplate = new LaunchTemplate(this, 'AppLaunchTemplate', {
      name: `${createResourceName(env, 'lt', 'app')}-${uniqueSuffix}`,
      imageId: latestAmi.id,
      instanceType: 't3.micro',
      vpcSecurityGroupIds: [appSg.id],
      tags: { Name: createResourceName(env, 'lt', 'app') },
      lifecycle: { preventDestroy: true },
    });

    new AutoscalingGroup(this, 'AppAsg', {
      name: `${createResourceName(env, 'asg', 'app')}-${uniqueSuffix}`,
      minSize: 2,
      maxSize: 5,
      desiredCapacity: 2,
      vpcZoneIdentifier: appSubnets.map(s => s.id),
      launchTemplate: { id: launchTemplate.id, version: '$Latest' },
      tag: [
        {
          key: 'Name',
          value: createResourceName(env, 'ec2', 'app'),
          propagateAtLaunch: true,
        },
      ],
    });

    // --- Database Module ---
    const dbPassword = new Password(this, 'DbPassword', {
      length: 16,
      special: true,
      overrideSpecial: '_-.',
    });

    const dbSubnetGroup = new DbSubnetGroup(this, 'DbSubnetGroup', {
      name: `${createResourceName(env, 'dbsubnetgroup', 'main')}-${uniqueSuffix}`,
      subnetIds: dbSubnets.map(s => s.id),
      tags: { Name: createResourceName(env, 'dbsubnetgroup', 'main') },
    });

    // FIX: Define a unique identifier for the RDS instance and its components.
    const rdsIdentifier = `${createResourceName(env, 'rds', 'main')}-${uniqueSuffix}`;

    new CloudwatchLogGroup(this, 'RdsLogGroup', {
      // FIX: Use the unique RDS identifier in the log group name to prevent collisions.
      name: `/aws/rds/instance/${rdsIdentifier}/postgresql`,
      retentionInDays: 7,
    });

    new DbInstance(this, 'RdsInstance', {
      // FIX: Use the predefined unique identifier.
      identifier: rdsIdentifier,
      engine: 'postgres',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      multiAz: true,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [dbSg.id],
      username: 'dbadmin',
      password: dbPassword.result,
      skipFinalSnapshot: true,
      tags: { Name: createResourceName(env, 'rds', 'main') },
      lifecycle: { preventDestroy: true },
    });
  }
}
```