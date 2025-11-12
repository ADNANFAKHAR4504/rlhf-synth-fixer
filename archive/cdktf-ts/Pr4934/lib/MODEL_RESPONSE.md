I'll help you set up the infrastructure for the university LMS using CDKTF with TypeScript. Here's the complete solution:

## lib/lms-stack.ts

```typescript
import { Construct } from 'constructs';
import { TerraformStack } from 'cdktf';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';

interface LmsStackProps {
  environmentSuffix: string;
}

export class LmsStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: LmsStackProps) {
    super(scope, id);

    // VPC
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `lms-vpc-${props.environmentSuffix}`,
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        Name: `lms-igw-${props.environmentSuffix}`,
      },
    });

    // Public Subnets
    const publicSubnet1 = new Subnet(this, 'public-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: 'us-east-1a',
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `lms-public-subnet-1-${props.environmentSuffix}`,
      },
    });

    const publicSubnet2 = new Subnet(this, 'public-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: 'us-east-1b',
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `lms-public-subnet-2-${props.environmentSuffix}`,
      },
    });

    // Private Subnets
    const privateSubnet1 = new Subnet(this, 'private-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.10.0/24',
      availabilityZone: 'us-east-1a',
      tags: {
        Name: `lms-private-subnet-1-${props.environmentSuffix}`,
      },
    });

    const privateSubnet2 = new Subnet(this, 'private-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: 'us-east-1b',
      tags: {
        Name: `lms-private-subnet-2-${props.environmentSuffix}`,
      },
    });

    // Route Table for Public Subnets
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: vpc.id,
      route: [
        {
          cidrBlock: '0.0.0.0/0',
          gatewayId: igw.id,
        },
      ],
      tags: {
        Name: `lms-public-rt-${props.environmentSuffix}`,
      },
    });

    new RouteTableAssociation(this, 'public-rta-1', {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'public-rta-2', {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    });

    // Security Group for ALB
    const albSg = new SecurityGroup(this, 'alb-sg', {
      name: `lms-alb-sg-${props.environmentSuffix}`,
      description: 'Security group for ALB',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTP',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound',
        },
      ],
    });

    // Security Group for ECS Tasks
    const ecsSg = new SecurityGroup(this, 'ecs-sg', {
      name: `lms-ecs-sg-${props.environmentSuffix}`,
      description: 'Security group for ECS tasks',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 8080,
          toPort: 8080,
          protocol: 'tcp',
          securityGroups: [albSg.id],
          description: 'Allow traffic from ALB',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound',
        },
      ],
    });

    // Security Group for RDS
    const rdsSg = new SecurityGroup(this, 'rds-sg', {
      name: `lms-rds-sg-${props.environmentSuffix}`,
      description: 'Security group for RDS',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          securityGroups: [ecsSg.id],
          description: 'Allow PostgreSQL from ECS',
        },
      ],
    });

    // Secrets Manager for DB credentials
    const dbSecret = new SecretsmanagerSecret(this, 'db-secret', {
      name: `lms-db-credentials-${props.environmentSuffix}`,
      description: 'Database credentials for LMS',
    });

    new SecretsmanagerSecretVersion(this, 'db-secret-version', {
      secretId: dbSecret.id,
      secretString: JSON.stringify({
        username: 'lmsadmin',
        password: 'ChangeMe123!',
        dbname: 'lmsdb',
      }),
    });

    // DB Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `lms-db-subnet-group-${props.environmentSuffix}`,
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      tags: {
        Name: `lms-db-subnet-group-${props.environmentSuffix}`,
      },
    });

    // RDS Instance
    const rdsInstance = new DbInstance(this, 'rds-instance', {
      identifier: `lms-db-${props.environmentSuffix}`,
      engine: 'postgres',
      engineVersion: '14.7',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      dbName: 'lmsdb',
      username: 'lmsadmin',
      password: 'ChangeMe123!',
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSg.id],
      skipFinalSnapshot: true,
      publiclyAccessible: false,
      storageEncrypted: true,
    });

    // ECS Cluster
    const ecsCluster = new EcsCluster(this, 'ecs-cluster', {
      name: `lms-cluster-${props.environmentSuffix}`,
    });

    // ECS Task Definition
    const taskDefinition = new EcsTaskDefinition(this, 'task-def', {
      family: `lms-task-${props.environmentSuffix}`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: '256',
      memory: '512',
      containerDefinitions: JSON.stringify([
        {
          name: 'lms-app',
          image: 'nginx:latest',
          portMappings: [
            {
              containerPort: 8080,
              protocol: 'tcp',
            },
          ],
          environment: [
            {
              name: 'DB_HOST',
              value: rdsInstance.address,
            },
          ],
        },
      ]),
    });

    // Application Load Balancer
    const alb = new Lb(this, 'alb', {
      name: `lms-alb-${props.environmentSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSg.id],
      subnets: [publicSubnet1.id, publicSubnet2.id],
    });

    // Target Group
    const targetGroup = new LbTargetGroup(this, 'tg', {
      name: `lms-tg-${props.environmentSuffix}`,
      port: 8080,
      protocol: 'HTTP',
      vpcId: vpc.id,
      targetType: 'ip',
      healthCheck: {
        enabled: true,
        path: '/',
        port: '8080',
      },
    });

    // Listener
    new LbListener(this, 'listener', {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
    });

    // ECS Service
    new EcsService(this, 'ecs-service', {
      name: `lms-service-${props.environmentSuffix}`,
      cluster: ecsCluster.id,
      taskDefinition: taskDefinition.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: [privateSubnet1.id, privateSubnet2.id],
        securityGroups: [ecsSg.id],
      },
      loadBalancer: [
        {
          targetGroupArn: targetGroup.arn,
          containerName: 'lms-app',
          containerPort: 8080,
        },
      ],
    });
  }
}
```

## lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { LmsStack } from './lms-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
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
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    this.addOverride('terraform.backend.s3.use_lockfile', true);

    new LmsStack(this, `lms-stack-${environmentSuffix}`, {
      environmentSuffix: environmentSuffix,
    });
  }
}
```

This infrastructure sets up a complete ECS Fargate deployment with RDS PostgreSQL, Secrets Manager, and Application Load Balancer for the university LMS system.
