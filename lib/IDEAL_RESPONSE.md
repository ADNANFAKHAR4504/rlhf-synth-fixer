# Multi-Environment, Self-Contained ECS Infrastructure with CDKTF

This document outlines a robust, reusable, and fully automated infrastructure-as-code solution for deploying a complete Amazon ECS environment. The configuration is written in TypeScript using the Cloud Development Kit for Terraform (CDKTF) and is designed to create identical, isolated stacks for multiple environments (e.g., development and production) from a single codebase.

Unlike simpler configurations, this solution does not depend on pre-existing infrastructure. It **provisions a complete network stack from scratch**, including a VPC, subnets, and gateways for each environment, ensuring maximum isolation and reproducibility.

## Core Features

- **Dynamic Multi-Environment Deployment**: A single `TapStack` class iterates through a configuration array to create distinct, parallel stacks for development, production, or any other defined environment.
- **Automated VPC & Networking**: For each environment, the stack automatically provisions:
  - A new **VPC** with a specified CIDR block.
  - **Public and private subnets** across two availability zones for high availability.
  - An **Internet Gateway** for public traffic and a **NAT Gateway** to allow private subnets outbound access.
  - **Route tables** to correctly manage traffic flow.
- **High-Availability ECS Service**: Deploys a containerized application (Nginx example) on **AWS Fargate**, fronted by an **Application Load Balancer** (ALB) for traffic distribution.
- **Cross-Region Data Resiliency**: Includes a **cross-region S3 replication** setup where a primary S3 bucket automatically replicates its contents to a replica bucket in a different AWS region for disaster recovery.
- **Security by Default**:
  - **Dedicated KMS Keys**: Encrypts CloudWatch logs and SNS topics with a unique, customer-managed KMS key for each environment.
  - **Least-Privilege IAM Roles**: Creates specific IAM roles for ECS task execution and S3 replication with tightly scoped permissions.
  - **Granular Security Groups**: Defines security groups to control traffic between the ALB and the ECS containers.
- **Cost Management**: All created resources are consistently tagged with `Environment`, `ManagedBy`, and `CostCenter` to facilitate accurate cost allocation and tracking.

---

## Project Files

The project is structured into three main files that work together to define and deploy the infrastructure.

### 1. Project Configuration (`cdktf.json`)

This is the main configuration file for the CDKTF project. It defines the language (TypeScript), the entry point for synthesis (`npx ts-node bin/tap.ts`), and the required Terraform providers.

```json
{
  "language": "typescript",
  "app": "npx ts-node bin/tap.ts",
  "projectId": "a1f0fa63-a084-47eb-b26e-817cf3972bae",
  "sendCrashReports": "false",
  "terraformProviders": ["aws@~> 6.0"],
  "terraformModules": [],
  "context": {}
}
```

### 2. Application Entry Point (`bin/tap.ts`)

This file is the starting point of the application. It's responsible for defining the configurations for each environment (dev, prod) and instantiating the main `TapStack` to create all the resources.

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'cdktf';
import { TapStack, EnvironmentConfig } from '../lib/tap-stack';

const app = new App();

// Define all environment configurations.
// The stack now creates its own VPC, so we only need to provide a CIDR block.
const allEnvironments: EnvironmentConfig[] = [
  {
    envName: 'dev',
    awsRegion: 'us-east-1',
    replicaRegion: 'us-west-2',
    vpcCidr: '10.10.0.0/16', // CIDR for the new VPC
    tags: {
      Environment: 'Development',
      ManagedBy: 'CDKTF',
      CostCenter: 'DevTeam',
    },
  },
  {
    envName: 'prod',
    awsRegion: 'us-east-1',
    replicaRegion: 'us-west-2',
    vpcCidr: '10.20.0.0/16', // A different CIDR for the prod VPC
    tags: {
      Environment: 'Production',
      ManagedBy: 'CDKTF',
      CostCenter: 'ProdOps',
    },
  },
];

// A single stack to manage all environments and regions
new TapStack(app, 'unified-ecs-stack', { environments: allEnvironments });

app.synth();
```

### 3. Core Infrastructure Stack (`lib/tap-stack.ts`)

This is the largest and most important file. The `TapStack` class contains the complete definition for all AWS resources. It takes an array of environment configurations and loops through them, creating a full, independent set of resources for each one.

```typescript
import { Fn, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketReplicationConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-replication-configuration';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

// Interface updated to remove dependencies on existing infrastructure
export interface EnvironmentConfig {
  readonly envName: 'dev' | 'test' | 'prod';
  readonly awsRegion: string;
  readonly replicaRegion: string;
  readonly vpcCidr: string; // Now we only need a CIDR block
  readonly tags: { [key: string]: string };
}

export interface MultiEnvStackProps {
  readonly environments: EnvironmentConfig[];
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: MultiEnvStackProps) {
    super(scope, id);

    const uniqueSuffix = Fn.substr(Fn.uuid(), 0, 8);

    for (const config of props.environments) {
      const constructIdSuffix = `-${config.envName}-${config.awsRegion}`;
      const resourceNameSuffix = `-${config.envName}-${config.awsRegion}-${uniqueSuffix}`;

      const primaryProvider = new AwsProvider(
        this,
        `AwsProvider${constructIdSuffix}`,
        {
          region: config.awsRegion,
          alias: `${config.envName}-${config.awsRegion}`,
        }
      );

      const replicaProvider = new AwsProvider(
        this,
        `AwsReplicaProvider${constructIdSuffix}`,
        {
          region: config.replicaRegion,
          alias: `${config.envName}-${config.replicaRegion}`,
        }
      );

      // Create VPC and Networking resources
      const vpc = new Vpc(this, `Vpc${constructIdSuffix}`, {
        provider: primaryProvider,
        cidrBlock: config.vpcCidr,
        enableDnsHostnames: true,
        tags: { ...config.tags, Name: `vpc${constructIdSuffix}` },
      });
      const publicSubnetA = new Subnet(
        this,
        `PublicSubnetA${constructIdSuffix}`,
        {
          provider: primaryProvider,
          vpcId: vpc.id,
          cidrBlock: Fn.cidrsubnet(vpc.cidrBlock, 8, 0),
          availabilityZone: `${config.awsRegion}a`,
          mapPublicIpOnLaunch: true,
          tags: { ...config.tags, Name: `pub-subnet-a${constructIdSuffix}` },
        }
      );
      const publicSubnetB = new Subnet(
        this,
        `PublicSubnetB${constructIdSuffix}`,
        {
          provider: primaryProvider,
          vpcId: vpc.id,
          cidrBlock: Fn.cidrsubnet(vpc.cidrBlock, 8, 1),
          availabilityZone: `${config.awsRegion}b`,
          mapPublicIpOnLaunch: true,
          tags: { ...config.tags, Name: `pub-subnet-b${constructIdSuffix}` },
        }
      );
      const privateSubnetA = new Subnet(
        this,
        `PrivateSubnetA${constructIdSuffix}`,
        {
          provider: primaryProvider,
          vpcId: vpc.id,
          cidrBlock: Fn.cidrsubnet(vpc.cidrBlock, 8, 2),
          availabilityZone: `${config.awsRegion}a`,
          tags: { ...config.tags, Name: `priv-subnet-a${constructIdSuffix}` },
        }
      );
      const privateSubnetB = new Subnet(
        this,
        `PrivateSubnetB${constructIdSuffix}`,
        {
          provider: primaryProvider,
          vpcId: vpc.id,
          cidrBlock: Fn.cidrsubnet(vpc.cidrBlock, 8, 3),
          availabilityZone: `${config.awsRegion}b`,
          tags: { ...config.tags, Name: `priv-subnet-b${constructIdSuffix}` },
        }
      );

      const igw = new InternetGateway(this, `Igw${constructIdSuffix}`, {
        provider: primaryProvider,
        vpcId: vpc.id,
        tags: config.tags,
      });
      const publicRouteTable = new RouteTable(
        this,
        `PublicRouteTable${constructIdSuffix}`,
        {
          provider: primaryProvider,
          vpcId: vpc.id,
          route: [{ cidrBlock: '0.0.0.0/0', gatewayId: igw.id }],
          tags: config.tags,
        }
      );
      new RouteTableAssociation(this, `PublicRtaA${constructIdSuffix}`, {
        provider: primaryProvider,
        subnetId: publicSubnetA.id,
        routeTableId: publicRouteTable.id,
      });
      new RouteTableAssociation(this, `PublicRtaB${constructIdSuffix}`, {
        provider: primaryProvider,
        subnetId: publicSubnetB.id,
        routeTableId: publicRouteTable.id,
      });

      const natEip = new Eip(this, `NatEip${constructIdSuffix}`, {
        provider: primaryProvider,
        domain: 'vpc',
        dependsOn: [igw],
        tags: config.tags,
      });
      const natGw = new NatGateway(this, `NatGw${constructIdSuffix}`, {
        provider: primaryProvider,
        allocationId: natEip.id,
        subnetId: publicSubnetA.id,
        tags: config.tags,
      });
      const privateRouteTable = new RouteTable(
        this,
        `PrivateRouteTable${constructIdSuffix}`,
        {
          provider: primaryProvider,
          vpcId: vpc.id,
          route: [{ cidrBlock: '0.0.0.0/0', natGatewayId: natGw.id }],
          tags: config.tags,
        }
      );
      new RouteTableAssociation(this, `PrivateRtaA${constructIdSuffix}`, {
        provider: primaryProvider,
        subnetId: privateSubnetA.id,
        routeTableId: privateRouteTable.id,
      });
      new RouteTableAssociation(this, `PrivateRtaB${constructIdSuffix}`, {
        provider: primaryProvider,
        subnetId: privateSubnetB.id,
        routeTableId: privateRouteTable.id,
      });

      // S3 Cross-Region Replication Setup
      const replicaBucket = new S3Bucket(
        this,
        `S3ReplicaBucket${constructIdSuffix}`,
        {
          provider: replicaProvider,
          bucket: `webapp-replica-${config.envName}-${config.awsRegion}-${uniqueSuffix}`,
          tags: config.tags,
        }
      );
      const replicaVersioning = new S3BucketVersioningA(
        this,
        `S3ReplicaVersioning${constructIdSuffix}`,
        {
          provider: replicaProvider,
          bucket: replicaBucket.id,
          versioningConfiguration: { status: 'Enabled' },
        }
      );

      const primaryBucket = new S3Bucket(
        this,
        `S3PrimaryBucket${constructIdSuffix}`,
        {
          provider: primaryProvider,
          bucket: `webapp-primary-${config.envName}-${config.awsRegion}-${uniqueSuffix}`,
          tags: config.tags,
        }
      );
      new S3BucketVersioningA(this, `S3PrimaryVersioning${constructIdSuffix}`, {
        provider: primaryProvider,
        bucket: primaryBucket.id,
        versioningConfiguration: { status: 'Enabled' },
      });

      const s3ReplicationRole = new IamRole(
        this,
        `S3ReplicationRole${constructIdSuffix}`,
        {
          provider: primaryProvider,
          name: `s3-replication-role${resourceNameSuffix}`,
          assumeRolePolicy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Action: 'sts:AssumeRole',
                Effect: 'Allow',
                Principal: { Service: 's3.amazonaws.com' },
              },
            ],
          }),
          tags: config.tags,
        }
      );
      const s3ReplicationPolicy = new IamPolicy(
        this,
        `S3ReplicationPolicy${constructIdSuffix}`,
        {
          provider: primaryProvider,
          name: `s3-replication-policy${resourceNameSuffix}`,
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Action: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
                Resource: [primaryBucket.arn],
                Effect: 'Allow',
              },
              {
                Action: [
                  's3:GetObjectVersionForReplication',
                  's3:GetObjectVersionAcl',
                  's3:GetObjectVersionTagging',
                ],
                Resource: [`${primaryBucket.arn}/*`],
                Effect: 'Allow',
              },
              {
                Action: [
                  's3:ReplicateObject',
                  's3:ReplicateDelete',
                  's3:ReplicateTags',
                ],
                Resource: [`${replicaBucket.arn}/*`],
                Effect: 'Allow',
              },
            ],
          }),
          tags: config.tags,
        }
      );
      new IamRolePolicyAttachment(
        this,
        `S3ReplicationAttachment${constructIdSuffix}`,
        {
          provider: primaryProvider,
          role: s3ReplicationRole.name,
          policyArn: s3ReplicationPolicy.arn,
        }
      );

      new S3BucketReplicationConfigurationA(
        this,
        `S3ReplicationConfig${constructIdSuffix}`,
        {
          provider: primaryProvider,
          dependsOn: [replicaVersioning],
          role: s3ReplicationRole.arn,
          bucket: primaryBucket.id,
          rule: [
            {
              id: 'primary-to-replica',
              status: 'Enabled',
              destination: { bucket: replicaBucket.arn },
            },
          ],
        }
      );

      // Security Groups now use the created VPC ID
      const albSg = new SecurityGroup(this, `AlbSg${constructIdSuffix}`, {
        provider: primaryProvider,
        name: `alb-sg${resourceNameSuffix}`,
        vpcId: vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        egress: [
          { protocol: 'tcp', fromPort: 80, toPort: 80, securityGroups: [] },
        ],
        tags: config.tags,
      });
      const ecsSg = new SecurityGroup(this, `EcsSg${constructIdSuffix}`, {
        provider: primaryProvider,
        name: `ecs-sg${resourceNameSuffix}`,
        vpcId: vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSg.id],
          },
        ],
        egress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: config.tags,
      });

      // FIX: Get AWS Account ID to build the KMS Key Policy
      const callerIdentity = new DataAwsCallerIdentity(
        this,
        `CallerIdentity${constructIdSuffix}`,
        {
          provider: primaryProvider,
        }
      );

      // FIX: Define a KMS Key Policy to allow CloudWatch Logs access
      const kmsKeyPolicy = JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: { AWS: `arn:aws:iam::${callerIdentity.accountId}:root` },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow CloudWatch Logs to use the key',
            Effect: 'Allow',
            Principal: {
              Service: `logs.${config.awsRegion}.amazonaws.com`,
            },
            Action: [
              'kms:Encrypt*',
              'kms:Decrypt*',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            Resource: '*',
          },
        ],
      });

      const kmsKey = new KmsKey(this, `KmsKey${constructIdSuffix}`, {
        provider: primaryProvider,
        description: `KMS key for ${config.envName} in ${config.awsRegion}`,
        enableKeyRotation: true,
        policy: kmsKeyPolicy, // FIX: Attach the policy to the key
        tags: config.tags,
      });

      const snsTopic = new SnsTopic(this, `SnsTopic${constructIdSuffix}`, {
        provider: primaryProvider,
        name: `ecs-notifications${resourceNameSuffix}`,
        kmsMasterKeyId: kmsKey.id,
        tags: config.tags,
      });

      const logGroup = new CloudwatchLogGroup(
        this,
        `LogGroup${constructIdSuffix}`,
        {
          provider: primaryProvider,
          name: `/ecs/webapp${resourceNameSuffix}`,
          retentionInDays: 30,
          kmsKeyId: kmsKey.arn,
          dependsOn: [kmsKey],
          tags: config.tags,
        }
      );

      const ecsTaskExecutionRole = new IamRole(
        this,
        `EcsTaskExecRole${constructIdSuffix}`,
        {
          provider: primaryProvider,
          name: `ecs-task-exec-role${resourceNameSuffix}`,
          assumeRolePolicy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Action: 'sts:AssumeRole',
                Effect: 'Allow',
                Principal: { Service: 'ecs-tasks.amazonaws.com' },
              },
            ],
          }),
          tags: config.tags,
        }
      );
      new IamRolePolicyAttachment(
        this,
        `EcsTaskExecPolicyAttach${constructIdSuffix}`,
        {
          provider: primaryProvider,
          role: ecsTaskExecutionRole.name,
          policyArn:
            'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
        }
      );
      const ecsTaskRole = new IamRole(this, `EcsTaskRole${constructIdSuffix}`, {
        provider: primaryProvider,
        name: `ecs-task-role${resourceNameSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: { Service: 'ecs-tasks.amazonaws.com' },
            },
          ],
        }),
        tags: config.tags,
      });
      const ecsTaskPolicy = new IamPolicy(
        this,
        `EcsTaskPolicy${constructIdSuffix}`,
        {
          provider: primaryProvider,
          name: `ecs-task-policy${resourceNameSuffix}`,
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Action: ['s3:GetObject'],
                Effect: 'Allow',
                Resource: [`${primaryBucket.arn}/*`],
              },
            ],
          }),
          tags: config.tags,
        }
      );
      new IamRolePolicyAttachment(
        this,
        `EcsTaskPolicyAttach${constructIdSuffix}`,
        {
          provider: primaryProvider,
          role: ecsTaskRole.name,
          policyArn: ecsTaskPolicy.arn,
        }
      );
      const taskDefinition = new EcsTaskDefinition(
        this,
        `TaskDefinition${constructIdSuffix}`,
        {
          provider: primaryProvider,
          family: `webapp${resourceNameSuffix}`,
          cpu: '256',
          memory: '512',
          networkMode: 'awsvpc',
          requiresCompatibilities: ['FARGATE'],
          executionRoleArn: ecsTaskExecutionRole.arn,
          taskRoleArn: ecsTaskRole.arn,
          containerDefinitions: JSON.stringify([
            {
              name: 'my-app',
              image: 'nginx:latest',
              portMappings: [{ containerPort: 80, hostPort: 80 }],
              logConfiguration: {
                logDriver: 'awslogs',
                options: {
                  'awslogs-group': logGroup.name,
                  'awslogs-region': config.awsRegion,
                  'awslogs-stream-prefix': 'ecs',
                },
              },
            },
          ]),
          tags: config.tags,
        }
      );
      const alb = new Lb(this, `ALB${constructIdSuffix}`, {
        provider: primaryProvider,
        name: `alb${resourceNameSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSg.id],
        subnets: [publicSubnetA.id, publicSubnetB.id],
        tags: config.tags,
      });
      const targetGroup = new LbTargetGroup(
        this,
        `TargetGroup${constructIdSuffix}`,
        {
          provider: primaryProvider,
          name: `tg${resourceNameSuffix}`,
          port: 80,
          protocol: 'HTTP',
          vpcId: vpc.id,
          targetType: 'ip',
          tags: config.tags,
        }
      );
      new LbListener(this, `Listener${constructIdSuffix}`, {
        provider: primaryProvider,
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultAction: [{ type: 'forward', targetGroupArn: targetGroup.arn }],
      });
      const cluster = new EcsCluster(this, `EcsCluster${constructIdSuffix}`, {
        provider: primaryProvider,
        name: `ecs-cluster${resourceNameSuffix}`,
        tags: config.tags,
      });
      new EcsService(this, `EcsService${constructIdSuffix}`, {
        provider: primaryProvider,
        name: `ecs-service${resourceNameSuffix}`,
        cluster: cluster.id,
        taskDefinition: taskDefinition.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: [privateSubnetA.id, privateSubnetB.id],
          securityGroups: [ecsSg.id],
        },
        loadBalancer: [
          {
            targetGroupArn: targetGroup.arn,
            containerName: 'my-app',
            containerPort: 80,
          },
        ],
        tags: config.tags,
      });

      new TerraformOutput(this, `PrimaryS3BucketName${constructIdSuffix}`, {
        value: primaryBucket.bucket,
      });
      new TerraformOutput(this, `EcsClusterName${constructIdSuffix}`, {
        value: cluster.name,
      });
      new TerraformOutput(this, `AlbDnsName${constructIdSuffix}`, {
        value: alb.dnsName,
      });
      new TerraformOutput(this, `SnsTopicArn${constructIdSuffix}`, {
        value: snsTopic.arn,
      });
    }
  }
}
```
