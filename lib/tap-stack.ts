import { Construct } from 'constructs';
import { TerraformStack, S3Backend } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
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

    // --- Remote State Management Resources ---
    const backendBucket = new S3Bucket(this, 'TerraformStateBucket', {
      bucket: `enterprise-tfstate-bucket-${env}`,
      versioning: {
        enabled: true,
      },
    });

    const lockTable = new DynamodbTable(this, 'TerraformLockTable', {
      name: `enterprise-terraform-locks-${env}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'LockID',
      attribute: [{ name: 'LockID', type: 'S' }],
    });

    new S3Backend(this, {
      bucket: backendBucket.bucket,
      key: 'enterprise-stack.tfstate',
      region: 'us-east-1',
      dynamodbTable: lockTable.name,
      encrypt: true,
    });

    // --- Networking Module ---
    const vpc = new Vpc(this, 'Vpc', {
      cidrBlock: '10.0.0.0/16',
      tags: { Name: createResourceName(env, 'vpc', 'main') },
      lifecycle: {
        preventDestroy: true,
      },
    });

    const igw = new InternetGateway(this, 'Igw', {
      vpcId: vpc.id,
      tags: { Name: createResourceName(env, 'igw', 'main') },
    });

    const publicRouteTable = new RouteTable(this, 'PublicRouteTable', {
      vpcId: vpc.id,
      tags: { Name: createResourceName(env, 'rt', 'public') },
    });

    new Route(this, 'DefaultRoute', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
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

    appSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `AppRta${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

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

    // --- Compute Module ---
    const launchTemplate = new LaunchTemplate(this, 'AppLaunchTemplate', {
      name: createResourceName(env, 'lt', 'app'),
      imageId: 'ami-0c55b159cbfafe1f0', // Example AMI
      instanceType: 't3.micro',
      tags: { Name: createResourceName(env, 'lt', 'app') },
      lifecycle: {
        preventDestroy: true,
      },
    });

    new AutoscalingGroup(this, 'AppAsg', {
      name: createResourceName(env, 'asg', 'app'),
      minSize: 2,
      maxSize: 5,
      desiredCapacity: 2,
      vpcZoneIdentifier: appSubnets.map(s => s.id),
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      tag: [
        {
          key: 'Name',
          value: createResourceName(env, 'ec2', 'app'),
          propagateAtLaunch: true,
        },
      ],
    });

    // --- Database Module ---
    const dbSubnetGroup = new DbSubnetGroup(this, 'DbSubnetGroup', {
      name: createResourceName(env, 'dbsubnetgroup', 'main'),
      subnetIds: dbSubnets.map(s => s.id),
      tags: { Name: createResourceName(env, 'dbsubnetgroup', 'main') },
    });

    new DbInstance(this, 'RdsInstance', {
      identifier: createResourceName(env, 'rds', 'main'),
      engine: 'postgres',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      multiAz: true,
      dbSubnetGroupName: dbSubnetGroup.name,
      username: 'dbadmin',
      password: 'a-secure-password-from-secrets-manager', // Placeholder
      skipFinalSnapshot: true,
      tags: { Name: createResourceName(env, 'rds', 'main') },
      lifecycle: {
        preventDestroy: true,
      },
    });
  }
}
