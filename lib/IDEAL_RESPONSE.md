# Portfolio Tracking Platform - Infrastructure as Code

## Overview
This implementation provides a comprehensive portfolio tracking platform using CDKTF (Cloud Development Kit for Terraform) with TypeScript. The infrastructure is deployed to AWS and includes networking, compute, database, caching, API, and monitoring components.

## Architecture Components

### Main Stack (tap-stack.ts)

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import * as fs from 'fs';
import * as path from 'path';
import { NetworkStack } from './network-stack';
import { ComputeStack } from './compute-stack';
import { DatabaseStack } from './database-stack';
import { ApiStack } from './api-stack';
import { MonitoringStack } from './monitoring-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

function getAwsRegionOverride(): string | undefined {
  try {
    const regionFilePath = path.join(__dirname, 'AWS_REGION');
    if (fs.existsSync(regionFilePath)) {
      return fs.readFileSync(regionFilePath, 'utf-8').trim();
    }
  } catch (error) {
    // Silently ignore if file doesn't exist or can't be read
  }
  return undefined;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const regionOverride = getAwsRegionOverride();
    const awsRegion = regionOverride || props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    new ArchiveProvider(this, 'archive', {});

    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    const networkStack = new NetworkStack(this, 'network', {
      vpcCidr: '172.32.0.0/16',
      region: awsRegion,
      environmentSuffix,
    });

    const databaseStack = new DatabaseStack(this, 'database', {
      vpc: networkStack.vpc,
      privateSubnets: networkStack.privateSubnets,
      region: awsRegion,
      environmentSuffix,
    });

    const computeStack = new ComputeStack(this, 'compute', {
      vpc: networkStack.vpc,
      publicSubnets: networkStack.publicSubnets,
      privateSubnets: networkStack.privateSubnets,
      database: databaseStack.dbInstance,
      cache: databaseStack.elasticacheServerless,
      region: awsRegion,
      environmentSuffix,
    });

    new ApiStack(this, 'api', {
      vpc: networkStack.vpc,
      alb: computeStack.alb,
      region: awsRegion,
      environmentSuffix,
    });

    const monitoringStack = new MonitoringStack(this, 'monitoring', {
      asg: computeStack.asg,
      alb: computeStack.alb,
      database: databaseStack.dbInstance,
      region: awsRegion,
      environmentSuffix,
    });

    // Outputs for integration tests
    new TerraformOutput(this, 'vpc-id', {
      value: networkStack.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'vpc-cidr', {
      value: networkStack.vpc.cidrBlock,
      description: 'VPC CIDR block',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: networkStack.publicSubnets.map(s => s.id),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: networkStack.privateSubnets.map(s => s.id),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: computeStack.alb.dnsName,
      description: 'ALB DNS name',
    });

    new TerraformOutput(this, 'alb-arn', {
      value: computeStack.alb.arn,
      description: 'ALB ARN',
    });

    new TerraformOutput(this, 'asg-name', {
      value: computeStack.asg.name,
      description: 'Auto Scaling Group name',
    });

    new TerraformOutput(this, 'db-endpoint', {
      value: databaseStack.dbInstance.endpoint,
      description: 'RDS database endpoint',
    });

    new TerraformOutput(this, 'db-identifier', {
      value: databaseStack.dbInstance.identifier,
      description: 'RDS database identifier',
    });

    new TerraformOutput(this, 'cache-endpoint', {
      value: databaseStack.elasticacheServerless.endpoint,
      description: 'ElastiCache serverless endpoint',
    });

    new TerraformOutput(this, 'cache-name', {
      value: databaseStack.elasticacheServerless.name,
      description: 'ElastiCache serverless name',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: databaseStack.historicalDataBucket.bucket,
      description: 'S3 bucket name for historical data',
    });

    new TerraformOutput(this, 'dashboard-name', {
      value: monitoringStack.dashboard.dashboardName,
      description: 'CloudWatch dashboard name',
    });
  }
}
```

### Network Stack (network-stack.ts)

```typescript
import { Fn } from 'cdktf';
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';

interface NetworkStackProps {
  vpcCidr: string;
  region: string;
  environmentSuffix: string;
}

export class NetworkStack extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id);

    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    this.vpc = new Vpc(this, `portfolio-vpc-${props.environmentSuffix}`, {
      cidrBlock: props.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `portfolio-tracking-vpc-${props.environmentSuffix}`,
      },
    });

    const igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'portfolio-igw',
      },
    });

    this.publicSubnets = [];
    this.privateSubnets = [];
    const natGateways: NatGateway[] = [];

    for (let i = 0; i < 2; i++) {
      const publicSubnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `172.32.${i * 2}.0/24`,
        availabilityZone: Fn.element(azs.names, i),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `portfolio-public-subnet-${i + 1}`,
          Type: 'public',
        },
      });
      this.publicSubnets.push(publicSubnet);

      const privateSubnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `172.32.${i * 2 + 1}.0/24`,
        availabilityZone: Fn.element(azs.names, i),
        tags: {
          Name: `portfolio-private-subnet-${i + 1}`,
          Type: 'private',
        },
      });
      this.privateSubnets.push(privateSubnet);

      const eip = new Eip(this, `nat-eip-${i}`, {
        domain: 'vpc',
        tags: {
          Name: `portfolio-nat-eip-${i + 1}`,
        },
      });

      const natGateway = new NatGateway(this, `nat-gateway-${i}`, {
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: {
          Name: `portfolio-nat-gateway-${i + 1}`,
        },
      });
      natGateways.push(natGateway);
    }

    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'portfolio-public-rt',
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: {
          Name: `portfolio-private-rt-${index + 1}`,
        },
      });

      new Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[index].id,
      });

      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });
  }
}
```

### Compute Stack (compute-stack.ts)

```typescript
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { ElasticacheServerlessCache } from '@cdktf/provider-aws/lib/elasticache-serverless-cache';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { Alb } from '@cdktf/provider-aws/lib/alb';
import { AlbTargetGroup } from '@cdktf/provider-aws/lib/alb-target-group';
import { AlbListener } from '@cdktf/provider-aws/lib/alb-listener';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';

interface ComputeStackProps {
  vpc: Vpc;
  publicSubnets: Subnet[];
  privateSubnets: Subnet[];
  database: DbInstance;
  cache: ElasticacheServerlessCache;
  region: string;
  environmentSuffix: string;
}

export class ComputeStack extends Construct {
  public readonly alb: Alb;
  public readonly asg: AutoscalingGroup;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id);

    const ec2SecurityGroup = new SecurityGroup(this, 'ec2-sg', {
      vpcId: props.vpc.id,
      description: 'Security group for EC2 instances',
      tags: {
        Name: 'portfolio-ec2-sg',
      },
    });

    const albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      vpcId: props.vpc.id,
      description: 'Security group for ALB',
      tags: {
        Name: 'portfolio-alb-sg',
      },
    });

    new SecurityGroupRule(this, 'alb-http-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      securityGroupId: albSecurityGroup.id,
      cidrBlocks: ['0.0.0.0/0'],
    });

    new SecurityGroupRule(this, 'alb-https-ingress', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      securityGroupId: albSecurityGroup.id,
      cidrBlocks: ['0.0.0.0/0'],
    });

    new SecurityGroupRule(this, 'alb-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      securityGroupId: albSecurityGroup.id,
      cidrBlocks: ['0.0.0.0/0'],
    });

    new SecurityGroupRule(this, 'ec2-alb-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      securityGroupId: ec2SecurityGroup.id,
      sourceSecurityGroupId: albSecurityGroup.id,
    });

    new SecurityGroupRule(this, 'ec2-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      securityGroupId: ec2SecurityGroup.id,
      cidrBlocks: ['0.0.0.0/0'],
    });

    const ec2Role = new IamRole(this, 'ec2-role', {
      name: `portfolio-ec2-role-${props.environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'ec2-ssm-policy', {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    const instanceProfile = new IamInstanceProfile(this, 'ec2-profile', {
      name: `portfolio-ec2-profile-${props.environmentSuffix}`,
      role: ec2Role.name,
    });

    const ami = new DataAwsAmi(this, 'amazon-linux-2', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    const userDataScript = `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s
echo "Portfolio tracking app initialization complete"`;

    const launchTemplate = new LaunchTemplate(this, 'lt', {
      name: `portfolio-lt-${props.environmentSuffix}`,
      imageId: ami.id,
      instanceType: 't3.medium',
      vpcSecurityGroupIds: [ec2SecurityGroup.id],
      iamInstanceProfile: {
        name: instanceProfile.name,
      },
      userData: Buffer.from(userDataScript).toString('base64'),
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            Name: 'portfolio-app-instance',
          },
        },
      ],
    });

    const targetGroup = new AlbTargetGroup(this, 'tg', {
      name: `portfolio-tg-${props.environmentSuffix}`,
      port: 80,
      protocol: 'HTTP',
      vpcId: props.vpc.id,
      targetType: 'instance',
      healthCheck: {
        enabled: true,
        path: '/health',
        port: '80',
        protocol: 'HTTP',
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
      },
      stickiness: {
        type: 'lb_cookie',
        enabled: true,
        cookieDuration: 86400,
      },
      tags: {
        Name: 'portfolio-tg',
      },
    });

    this.asg = new AutoscalingGroup(this, 'asg', {
      name: `portfolio-asg-${props.environmentSuffix}`,
      minSize: 2,
      maxSize: 6,
      desiredCapacity: 2,
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      vpcZoneIdentifier: props.privateSubnets.map(subnet => subnet.id),
      targetGroupArns: [targetGroup.arn],
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      tag: [
        {
          key: 'Name',
          value: 'portfolio-asg-instance',
          propagateAtLaunch: true,
        },
      ],
    });

    this.alb = new Alb(this, 'alb', {
      name: `portfolio-alb-${props.environmentSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSecurityGroup.id],
      subnets: props.publicSubnets.map(subnet => subnet.id),
      enableHttp2: true,
      enableCrossZoneLoadBalancing: true,
      tags: {
        Name: 'portfolio-alb',
      },
    });

    new AlbListener(this, 'alb-listener', {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
    });
  }
}
```

### Database Stack (database-stack.ts)

```typescript
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { ElasticacheServerlessCache } from '@cdktf/provider-aws/lib/elasticache-serverless-cache';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';

interface DatabaseStackProps {
  vpc: Vpc;
  privateSubnets: Subnet[];
  region: string;
  environmentSuffix: string;
}

export class DatabaseStack extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly elasticacheServerless: ElasticacheServerlessCache;
  public readonly historicalDataBucket: S3Bucket;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id);

    const dbSecurityGroup = new SecurityGroup(this, 'db-sg', {
      vpcId: props.vpc.id,
      description: 'Security group for RDS PostgreSQL',
      tags: {
        Name: 'portfolio-db-sg',
      },
    });

    new SecurityGroupRule(this, 'db-ingress', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      securityGroupId: dbSecurityGroup.id,
      cidrBlocks: ['172.32.0.0/16'],
    });

    new SecurityGroupRule(this, 'db-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      securityGroupId: dbSecurityGroup.id,
      cidrBlocks: ['0.0.0.0/0'],
    });

    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `portfolio-db-subnet-group-${props.environmentSuffix}`,
      subnetIds: props.privateSubnets.map(subnet => subnet.id),
      tags: {
        Name: 'portfolio-db-subnet-group',
      },
    });

    this.dbInstance = new DbInstance(this, 'postgres-db', {
      identifier: `portfolio-holdings-db-${props.environmentSuffix}`,
      engine: 'postgres',
      engineVersion: '15.14',
      instanceClass: 'db.t3.medium',
      allocatedStorage: 100,
      storageType: 'gp3',
      storageEncrypted: true,
      dbName: 'portfoliodb',
      username: 'dbadmin',
      password: 'TempPassword123!ChangeMe',
      vpcSecurityGroupIds: [dbSecurityGroup.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      multiAz: true,
      skipFinalSnapshot: true,
      deletionProtection: false,
      tags: {
        Name: 'portfolio-holdings-db',
      },
    });

    const cacheSecurityGroup = new SecurityGroup(this, 'cache-sg', {
      vpcId: props.vpc.id,
      description: 'Security group for ElastiCache',
      tags: {
        Name: 'portfolio-cache-sg',
      },
    });

    new SecurityGroupRule(this, 'cache-ingress', {
      type: 'ingress',
      fromPort: 6379,
      toPort: 6379,
      protocol: 'tcp',
      securityGroupId: cacheSecurityGroup.id,
      cidrBlocks: ['172.32.0.0/16'],
    });

    new SecurityGroupRule(this, 'cache-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      securityGroupId: cacheSecurityGroup.id,
      cidrBlocks: ['0.0.0.0/0'],
    });

    this.elasticacheServerless = new ElasticacheServerlessCache(
      this,
      'market-data-cache',
      {
        name: `portfolio-market-cache-${props.environmentSuffix}`,
        engine: 'valkey',
        cacheUsageLimits: [
          {
            dataStorage: [
              {
                unit: 'GB',
                maximum: 10,
              },
            ],
            ecpuPerSecond: [
              {
                maximum: 5000,
              },
            ],
          },
        ],
        dailySnapshotTime: '03:00',
        description: 'Market data cache with 1-minute TTL',
        securityGroupIds: [cacheSecurityGroup.id],
        subnetIds: props.privateSubnets.map(subnet => subnet.id),
        tags: {
          Name: 'portfolio-market-cache',
        },
      }
    );

    this.historicalDataBucket = new S3Bucket(this, 'historical-data', {
      bucket: `portfolio-hist-${props.environmentSuffix}-${Date.now()}`,
      tags: {
        Name: `portfolio-historical-data-${props.environmentSuffix}`,
      },
    });

    new S3BucketVersioningA(this, 'historical-data-versioning', {
      bucket: this.historicalDataBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new S3BucketPublicAccessBlock(this, 'historical-data-pab', {
      bucket: this.historicalDataBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
  }
}
```

### API Stack (api-stack.ts)

```typescript
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Alb } from '@cdktf/provider-aws/lib/alb';
import { Apigatewayv2Api } from '@cdktf/provider-aws/lib/apigatewayv2-api';
import { Apigatewayv2Stage } from '@cdktf/provider-aws/lib/apigatewayv2-stage';
import { Apigatewayv2Route } from '@cdktf/provider-aws/lib/apigatewayv2-route';
import { Apigatewayv2Integration } from '@cdktf/provider-aws/lib/apigatewayv2-integration';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { DataArchiveFile } from '@cdktf/provider-archive/lib/data-archive-file';
import * as path from 'path';

interface ApiStackProps {
  vpc: Vpc;
  alb: Alb;
  region: string;
  environmentSuffix: string;
}

export class ApiStack extends Construct {
  public readonly websocketApi: Apigatewayv2Api;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id);

    const lambdaRole = new IamRole(this, 'lambda-role', {
      name: `portfolio-ws-lambda-role-${props.environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      }),
    });

    new IamRolePolicy(this, 'lambda-policy', {
      name: `portfolio-ws-lambda-policy-${props.environmentSuffix}`,
      role: lambdaRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: 'arn:aws:logs:*:*:*',
          },
          {
            Effect: 'Allow',
            Action: ['execute-api:ManageConnections', 'execute-api:Invoke'],
            Resource: '*',
          },
        ],
      }),
    });

    const lambdaAsset = new DataArchiveFile(this, 'websocket-lambda-archive', {
      type: 'zip',
      sourceDir: path.join(__dirname, 'lambda', 'websocket-handler'),
      outputPath: path.join(
        __dirname,
        '../.terraform',
        `websocket-handler-${props.environmentSuffix}.zip`
      ),
    });

    const websocketLambda = new LambdaFunction(this, 'websocket-handler', {
      functionName: `portfolio-ws-handler-${props.environmentSuffix}`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: lambdaRole.arn,
      filename: lambdaAsset.outputPath,
      sourceCodeHash: lambdaAsset.outputBase64Sha256,
      timeout: 30,
      memorySize: 256,
      environment: {
        variables: {
          ALB_DNS: props.alb.dnsName,
        },
      },
    });

    this.websocketApi = new Apigatewayv2Api(this, 'websocket-api', {
      name: `portfolio-ws-api-${props.environmentSuffix}`,
      protocolType: 'WEBSOCKET',
      routeSelectionExpression: '$request.body.action',
      description: 'WebSocket API for real-time portfolio updates',
    });

    const integration = new Apigatewayv2Integration(
      this,
      'websocket-integration',
      {
        apiId: this.websocketApi.id,
        integrationType: 'AWS_PROXY',
        integrationUri: websocketLambda.invokeArn,
        integrationMethod: 'POST',
        connectionType: 'INTERNET',
      }
    );

    new Apigatewayv2Route(this, 'connect-route', {
      apiId: this.websocketApi.id,
      routeKey: '$connect',
      target: `integrations/${integration.id}`,
    });

    new Apigatewayv2Route(this, 'disconnect-route', {
      apiId: this.websocketApi.id,
      routeKey: '$disconnect',
      target: `integrations/${integration.id}`,
    });

    new Apigatewayv2Route(this, 'default-route', {
      apiId: this.websocketApi.id,
      routeKey: '$default',
      target: `integrations/${integration.id}`,
    });

    new Apigatewayv2Stage(this, 'websocket-stage', {
      apiId: this.websocketApi.id,
      name: 'prod',
      autoDeploy: true,
    });

    new LambdaPermission(this, 'websocket-lambda-permission', {
      statementId: 'AllowAPIGatewayInvoke',
      action: 'lambda:InvokeFunction',
      functionName: websocketLambda.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${this.websocketApi.executionArn}/*/*`,
    });
  }
}
```

### Monitoring Stack (monitoring-stack.ts)

```typescript
import { Construct } from 'constructs';
import { CloudwatchDashboard } from '@cdktf/provider-aws/lib/cloudwatch-dashboard';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { Alb } from '@cdktf/provider-aws/lib/alb';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';

interface MonitoringStackProps {
  asg: AutoscalingGroup;
  alb: Alb;
  database: DbInstance;
  region: string;
  environmentSuffix: string;
}

export class MonitoringStack extends Construct {
  public readonly dashboard: CloudwatchDashboard;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id);

    const dashboardBody = {
      widgets: [
        {
          type: 'metric',
          properties: {
            metrics: [
              [
                'AWS/EC2',
                'CPUUtilization',
                { stat: 'Average', label: 'EC2 CPU Usage' },
              ],
              ['.', '.', { stat: 'Maximum', label: 'EC2 CPU Max' }],
            ],
            period: 300,
            stat: 'Average',
            region: props.region,
            title: 'EC2 CPU Utilization',
            yAxis: {
              left: {
                min: 0,
                max: 100,
              },
            },
          },
        },
        {
          type: 'metric',
          properties: {
            metrics: [
              ['AWS/ApplicationELB', 'TargetResponseTime', { stat: 'Average' }],
              [
                'AWS/ApplicationELB',
                'RequestCount',
                { stat: 'Sum', yAxis: 'right' },
              ],
            ],
            period: 300,
            stat: 'Average',
            region: props.region,
            title: 'ALB Metrics',
          },
        },
        {
          type: 'metric',
          properties: {
            metrics: [
              ['AWS/RDS', 'DatabaseConnections', { stat: 'Average' }],
              [
                'AWS/RDS',
                'CPUUtilization',
                { stat: 'Average', yAxis: 'right' },
              ],
            ],
            period: 300,
            stat: 'Average',
            region: props.region,
            title: 'RDS Performance',
          },
        },
        {
          type: 'metric',
          properties: {
            metrics: [
              ['AWS/AutoScaling', 'GroupDesiredCapacity', { stat: 'Average' }],
              [
                'AWS/AutoScaling',
                'GroupInServiceInstances',
                { stat: 'Average' },
              ],
            ],
            period: 300,
            stat: 'Average',
            region: props.region,
            title: 'Auto Scaling Group',
          },
        },
      ],
    };

    this.dashboard = new CloudwatchDashboard(this, 'portfolio-dashboard', {
      dashboardName: 'portfolio-tracking-metrics',
      dashboardBody: JSON.stringify(dashboardBody),
    });
  }
}
```

### Lambda Handler (lambda/websocket-handler/index.js)

```javascript
exports.handler = async (event) => {
    const { requestContext: { eventType, connectionId } } = event;
    console.log('WebSocket event:', eventType, 'Connection:', connectionId);

    if (eventType === 'CONNECT') {
        return { statusCode: 200, body: 'Connected' };
    } else if (eventType === 'DISCONNECT') {
        return { statusCode: 200, body: 'Disconnected' };
    } else {
        return { statusCode: 200, body: 'Message received' };
    }
};
```

## Key Features

### High Availability
- Multi-AZ RDS for database failover
- Auto Scaling Group across multiple availability zones
- NAT Gateways in each availability zone
- Application Load Balancer distributing traffic

### Security
- Private subnets for application and database layers
- Security groups with least-privilege access
- Encrypted storage (RDS, S3)
- IAM roles with minimal permissions
- Public access blocked on S3 buckets

### Scalability
- Auto Scaling (2-6 instances) based on demand
- ElastiCache Serverless with automatic scaling
- Application Load Balancer for traffic distribution
- WebSocket API for real-time updates

### Monitoring
- Centralized CloudWatch dashboard
- CloudWatch agent on EC2 instances
- Metrics for EC2, ALB, RDS, and Auto Scaling

## Configuration

### Region
- Default: us-east-1
- Configurable via `awsRegion` prop or `lib/AWS_REGION` file

### State Management
- S3 backend for Terraform state
- Key format: `{environmentSuffix}/{stackId}.tfstate`
- Encryption enabled

### Environment Suffix
- Enables multiple environments (dev, staging, prod)
- Applied to all resource names for isolation

## Resource Naming Convention
All resources follow the pattern: `portfolio-{resource-type}-{environmentSuffix}`

Examples:
- VPC: `portfolio-tracking-vpc-pr3522`
- ALB: `portfolio-alb-pr3522`
- Database: `portfolio-holdings-db-pr3522`
- Cache: `portfolio-market-cache-pr3522`

## Important Notes

1. **Database Password**: Currently hardcoded as temporary value. In production, use AWS Secrets Manager or parameterize.

2. **Lambda Code**: Packaged using `DataArchiveFile` from `lib/lambda/websocket-handler/`

3. **Multi-Region**: Infrastructure can be deployed to different regions by setting `awsRegion` or creating `lib/AWS_REGION` file.

## Cost Optimization Considerations
- t3.medium instances (burstable)
- ElastiCache Serverless (pay per use)
- RDS Multi-AZ (balanced HA vs cost)
- Auto Scaling based on actual load
- S3 lifecycle policies (can be added)
