# Multi-Account Infrastructure Migration with CDKTF

This solution provides a CDKTF TypeScript configuration for migrating from a single AWS account to a multi-account architecture.

## Architecture Overview

The solution implements:
- Reusable constructs for RDS, ECS, and ALB
- VPC infrastructure per environment
- Cross-account IAM roles
- S3 backend with state locking
- VPC peering between environments

## File: lib/networking-stack.ts

```typescript
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';

export interface NetworkingStackProps {
  environment: string;
  cidrBlock: string;
}

export class NetworkingStack extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly albSecurityGroup: SecurityGroup;
  public readonly ecsSecurityGroup: SecurityGroup;
  public readonly rdsSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id);

    const { environment, cidrBlock } = props;

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `vpc-${environment}`,
        Environment: environment,
      },
    });

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `igw-${environment}`,
      },
    });

    // Create Public Subnets (2 AZs)
    this.publicSubnets = [];
    const azs = ['us-east-1a', 'us-east-1b'];

    azs.forEach((az, index) => {
      const subnet = new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: `${cidrBlock.split('.')[0]}.${cidrBlock.split('.')[1]}.${index}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-${environment}-${az}`,
        },
      });
      this.publicSubnets.push(subnet);
    });

    // Create Private Subnets (2 AZs)
    this.privateSubnets = [];
    azs.forEach((az, index) => {
      const subnet = new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: `${cidrBlock.split('.')[0]}.${cidrBlock.split('.')[1]}.${index + 10}.0/24`,
        availabilityZone: az,
        tags: {
          Name: `private-subnet-${environment}-${az}`,
        },
      });
      this.privateSubnets.push(subnet);
    });

    // Create Public Route Table
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      route: [
        {
          cidrBlock: '0.0.0.0/0',
          gatewayId: igw.id,
        },
      ],
      tags: {
        Name: `public-rt-${environment}`,
      },
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Create Security Groups
    this.albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: `alb-sg-${environment}`,
      description: 'Security group for ALB',
      vpcId: this.vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
    });

    this.ecsSecurityGroup = new SecurityGroup(this, 'ecs-sg', {
      name: `ecs-sg-${environment}`,
      description: 'Security group for ECS tasks',
      vpcId: this.vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          securityGroups: [this.albSecurityGroup.id],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
    });

    this.rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `rds-sg-${environment}`,
      description: 'Security group for RDS',
      vpcId: this.vpc.id,
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          securityGroups: [this.ecsSecurityGroup.id],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
    });
  }
}
```

## File: lib/database-construct.ts

```typescript
import { Construct } from 'constructs';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';

export interface DatabaseConstructProps {
  environment: string;
  subnetIds: string[];
  securityGroupIds: string[];
  instanceClass?: string;
  allocatedStorage?: number;
  engineVersion?: string;
}

export class DatabaseConstruct extends Construct {
  public readonly instance: DbInstance;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    const {
      environment,
      subnetIds,
      securityGroupIds,
      instanceClass = 'db.t3.micro',
      allocatedStorage = 20,
      engineVersion = '14.7',
    } = props;

    // Create DB Subnet Group
    const subnetGroup = new DbSubnetGroup(this, 'subnet-group', {
      name: `rds-subnet-group-${environment}`,
      subnetIds: subnetIds,
      tags: {
        Name: `rds-subnet-group-${environment}`,
      },
    });

    // Create RDS Instance
    this.instance = new DbInstance(this, 'instance', {
      identifier: `postgres-${environment}`,
      engine: 'postgres',
      engineVersion: engineVersion,
      instanceClass: instanceClass,
      allocatedStorage: allocatedStorage,
      dbName: 'myapp',
      username: 'admin',
      password: 'changeme123',
      dbSubnetGroupName: subnetGroup.name,
      vpcSecurityGroupIds: securityGroupIds,
      multiAz: true,
      storageEncrypted: true,
      backupRetentionPeriod: 7,
      skipFinalSnapshot: true,
      tags: {
        Name: `postgres-${environment}`,
        Environment: environment,
      },
    });
  }
}
```

## File: lib/ecs-construct.ts

```typescript
import { Construct } from 'constructs';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';

export interface EcsConstructProps {
  environment: string;
  subnetIds: string[];
  securityGroupIds: string[];
  targetGroupArn: string;
  containerImage?: string;
  containerPort?: number;
}

export class EcsConstruct extends Construct {
  public readonly cluster: EcsCluster;
  public readonly service: EcsService;

  constructor(scope: Construct, id: string, props: EcsConstructProps) {
    super(scope, id);

    const {
      environment,
      subnetIds,
      securityGroupIds,
      targetGroupArn,
      containerImage = 'nginx:latest',
      containerPort = 80,
    } = props;

    // Create ECS Cluster
    this.cluster = new EcsCluster(this, 'cluster', {
      name: `ecs-cluster-${environment}`,
      tags: {
        Name: `ecs-cluster-${environment}`,
      },
    });

    // Create Task Execution Role
    const executionRole = new IamRole(this, 'execution-role', {
      name: `ecs-execution-role-${environment}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
            Effect: 'Allow',
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'execution-role-policy', {
      role: executionRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    // Create Task Role
    const taskRole = new IamRole(this, 'task-role', {
      name: `ecs-task-role-${environment}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
            Effect: 'Allow',
          },
        ],
      }),
    });

    // Create Task Definition
    const taskDefinition = new EcsTaskDefinition(this, 'task-definition', {
      family: `app-task-${environment}`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: '256',
      memory: '512',
      executionRoleArn: executionRole.arn,
      taskRoleArn: taskRole.arn,
      containerDefinitions: JSON.stringify([
        {
          name: 'app',
          image: containerImage,
          portMappings: [
            {
              containerPort: containerPort,
              protocol: 'tcp',
            },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': `/ecs/${environment}/app`,
              'awslogs-region': 'us-east-1',
              'awslogs-stream-prefix': 'ecs',
            },
          },
        },
      ]),
    });

    // Create ECS Service
    this.service = new EcsService(this, 'service', {
      name: `app-service-${environment}`,
      cluster: this.cluster.id,
      taskDefinition: taskDefinition.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: subnetIds,
        securityGroups: securityGroupIds,
        assignPublicIp: false,
      },
      loadBalancer: [
        {
          targetGroupArn: targetGroupArn,
          containerName: 'app',
          containerPort: containerPort,
        },
      ],
    });
  }
}
```

## File: lib/alb-construct.ts

```typescript
import { Construct } from 'constructs';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';

export interface AlbConstructProps {
  environment: string;
  vpcId: string;
  subnetIds: string[];
  securityGroupIds: string[];
}

export class AlbConstruct extends Construct {
  public readonly alb: Lb;
  public readonly targetGroup: LbTargetGroup;

  constructor(scope: Construct, id: string, props: AlbConstructProps) {
    super(scope, id);

    const { environment, vpcId, subnetIds, securityGroupIds } = props;

    // Create ALB
    this.alb = new Lb(this, 'alb', {
      name: `alb-${environment}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: securityGroupIds,
      subnets: subnetIds,
      tags: {
        Name: `alb-${environment}`,
      },
    });

    // Create Target Group
    this.targetGroup = new LbTargetGroup(this, 'target-group', {
      name: `tg-${environment}`,
      port: 80,
      protocol: 'HTTP',
      vpcId: vpcId,
      targetType: 'ip',
      healthCheck: {
        enabled: true,
        path: '/',
        protocol: 'HTTP',
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
      },
    });

    // Create Listener
    new LbListener(this, 'listener', {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: this.targetGroup.arn,
        },
      ],
    });
  }
}
```

## File: lib/cross-account-role.ts

```typescript
import { Construct } from 'constructs';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';

export interface CrossAccountRoleProps {
  environment: string;
  operationsAccountId: string;
}

export class CrossAccountRole extends Construct {
  public readonly role: IamRole;

  constructor(scope: Construct, id: string, props: CrossAccountRoleProps) {
    super(scope, id);

    const { environment, operationsAccountId } = props;

    // Create cross-account role
    this.role = new IamRole(this, 'deployment-role', {
      name: `deployment-role-${environment}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${operationsAccountId}:root`,
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `deployment-role-${environment}`,
      },
    });

    // Attach deployment permissions
    new IamRolePolicy(this, 'deployment-policy', {
      name: `deployment-policy-${environment}`,
      role: this.role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'ec2:*',
              'ecs:*',
              'rds:*',
              'elasticloadbalancing:*',
              's3:*',
              'iam:*',
            ],
            Resource: '*',
          },
        ],
      }),
    });
  }
}
```

## File: lib/vpc-peering-construct.ts

```typescript
import { Construct } from 'constructs';
import { VpcPeeringConnection } from '@cdktf/provider-aws/lib/vpc-peering-connection';
import { VpcPeeringConnectionAccepter } from '@cdktf/provider-aws/lib/vpc-peering-connection-accepter';

export interface VpcPeeringConstructProps {
  vpcId: string;
  peerVpcId: string;
  peerAccountId: string;
  environment: string;
}

export class VpcPeeringConstruct extends Construct {
  public readonly peeringConnection: VpcPeeringConnection;

  constructor(scope: Construct, id: string, props: VpcPeeringConstructProps) {
    super(scope, id);

    const { vpcId, peerVpcId, peerAccountId, environment } = props;

    // Create VPC Peering Connection
    this.peeringConnection = new VpcPeeringConnection(this, 'peering', {
      vpcId: vpcId,
      peerVpcId: peerVpcId,
      peerOwnerId: peerAccountId,
      autoAccept: false,
      tags: {
        Name: `vpc-peering-${environment}`,
      },
    });
  }
}
```

## File: lib/environment-stack.ts

```typescript
import { Construct } from 'constructs';
import { NetworkingStack } from './networking-stack';
import { DatabaseConstruct } from './database-construct';
import { AlbConstruct } from './alb-construct';
import { EcsConstruct } from './ecs-construct';
import { CrossAccountRole } from './cross-account-role';

export interface EnvironmentStackProps {
  environment: string;
  environmentSuffix: string;
  cidrBlock: string;
  operationsAccountId: string;
}

export class EnvironmentStack extends Construct {
  constructor(scope: Construct, id: string, props: EnvironmentStackProps) {
    super(scope, id);

    const { environment, environmentSuffix, cidrBlock, operationsAccountId } = props;

    // Create networking infrastructure
    const networking = new NetworkingStack(this, 'networking', {
      environment: `${environment}-${environmentSuffix}`,
      cidrBlock: cidrBlock,
    });

    // Create ALB
    const alb = new AlbConstruct(this, 'alb', {
      environment: `${environment}-${environmentSuffix}`,
      vpcId: networking.vpc.id,
      subnetIds: networking.publicSubnets.map((s) => s.id),
      securityGroupIds: [networking.albSecurityGroup.id],
    });

    // Create RDS Database
    new DatabaseConstruct(this, 'database', {
      environment: `${environment}-${environmentSuffix}`,
      subnetIds: networking.privateSubnets.map((s) => s.id),
      securityGroupIds: [networking.rdsSecurityGroup.id],
    });

    // Create ECS Cluster and Service
    new EcsConstruct(this, 'ecs', {
      environment: `${environment}-${environmentSuffix}`,
      subnetIds: networking.privateSubnets.map((s) => s.id),
      securityGroupIds: [networking.ecsSecurityGroup.id],
      targetGroupArn: alb.targetGroup.arn,
    });

    // Create Cross-Account Role
    new CrossAccountRole(this, 'cross-account-role', {
      environment: `${environment}-${environmentSuffix}`,
      operationsAccountId: operationsAccountId,
    });
  }
}
```

## File: lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { EnvironmentStack } from './environment-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags || [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Determine environment and CIDR based on environment suffix
    const envConfig = {
      dev: { cidrBlock: '10.0.0.0/16' },
      staging: { cidrBlock: '10.1.0.0/16' },
      prod: { cidrBlock: '10.2.0.0/16' },
    };

    const environment = environmentSuffix.includes('dev')
      ? 'dev'
      : environmentSuffix.includes('staging')
      ? 'staging'
      : 'prod';

    const config = envConfig[environment as keyof typeof envConfig];

    // Create environment stack
    new EnvironmentStack(this, 'environment', {
      environment: environment,
      environmentSuffix: environmentSuffix,
      cidrBlock: config.cidrBlock,
      operationsAccountId: '123456789012',
    });
  }
}
```

## Migration Plan

### Phase 1: Preparation
1. Set up operations account with shared ECR repository
2. Create IAM roles in each target account
3. Configure AWS credentials for multi-account access
4. Back up existing RDS snapshots

### Phase 2: Dev Environment
1. Deploy dev infrastructure using CDKTF
2. Restore RDS snapshot to new dev account
3. Update DNS records to point to new ALB
4. Test application connectivity
5. Monitor for 24 hours

### Phase 3: Staging Environment
1. Deploy staging infrastructure
2. Migrate staging data
3. Update DNS records
4. Perform integration testing

### Phase 4: Production Environment
1. Deploy production infrastructure
2. Set up VPC peering between all environments
3. Schedule maintenance window for migration
4. Migrate production data with minimal downtime
5. Update DNS with blue/green deployment
6. Monitor and validate

### Rollback Procedures
- Keep original infrastructure running for 7 days
- Maintain ability to route traffic back to original account
- Keep RDS snapshots for 30 days
- Document rollback steps for each phase