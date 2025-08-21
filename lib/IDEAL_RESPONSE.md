# Multi-Account, Multi-Region ECS Infrastructure with CDKTF

This document outlines a secure and reusable infrastructure-as-code solution for deploying Amazon ECS clusters and services on AWS account and region. The configuration is written in TypeScript using the Cloud Development Kit for Terraform (CDKTF), enabling consistent, scalable, and maintainable deployments for development, testing, and production environments.

## Core Features

- **Reusable Stack**: A single `EcsStack` class encapsulates all necessary resources, ensuring that each environment is provisioned with a consistent and identical setup.
- **Security by Default**:
  - **Least Privilege IAM**: The ECS Task Execution Role is granted only the necessary permissions to pull container images and send logs.
  - **Encryption at Rest**: All sensitive data, including CloudWatch logs and SNS topics, is encrypted using dedicated, customer-managed KMS keys for each environment.
- **Comprehensive Monitoring & Notifications**:
  - **CloudWatch Logging**: All ECS task logs are automatically sent to a dedicated CloudWatch Log Group for monitoring and auditing.
  - **SNS Notifications**: An SNS topic is created for each environment to publish notifications about stack actions and updates.
- **Cost Management**: All resources are consistently tagged with `Project`, `Owner`, `Environment`, and a `cost-center` tag to facilitate accurate cost allocation and tracking.

---

## Infrastructure Code (`main.ts`)

The following TypeScript code defines the complete CDKTF project. It uses a configuration map to define environment-specific parameters and iterates through them to create a distinct stack for each stage.

```typescript
import { App, TerraformStack, TerraformOutput, Fn } from 'cdktf';
import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

// --- Reusable ECS Stack ---
interface EcsStackProps {
  provider: AwsProvider;
  environmentName: 'dev' | 'test' | 'prod';
  vpcId: string;
  subnetIds: string[];
  amiId: string;
  tags: { [key: string]: string };
}

class EcsStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id);

    const { provider, environmentName, vpcId, subnetIds, amiId, tags } = props;
    const resourcePrefix = `${environmentName}-webapp`;

    // --- KMS Key for Encryption ---
    const kmsKey = new KmsKey(this, 'KmsKey', {
      provider,
      description: `KMS key for ${resourcePrefix} environment`,
      enableKeyRotation: true,
      tags: { ...tags, Name: `${resourcePrefix}-kms-key` },
    });

    // --- IAM Roles (Least Privilege) ---
    const ecsTaskExecutionRole = new IamRole(this, 'EcsTaskExecutionRole', {
      provider,
      name: `${resourcePrefix}-ecs-task-execution-role`,
      assumeRolePolicy: new DataAwsIamPolicyDocument(
        this,
        'EcsTaskAssumePolicy',
        {
          provider,
          statement: [
            {
              actions: ['sts:AssumeRole'],
              principals: [
                { type: 'Service', identifiers: ['ecs-tasks.amazonaws.com'] },
              ],
            },
          ],
        }
      ).json,
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      ],
      tags,
    });

    // --- CloudWatch Log Group ---
    const logGroup = new CloudwatchLogGroup(this, 'LogGroup', {
      provider,
      name: `/ecs/${resourcePrefix}`,
      retentionInDays: 30,
      kmsKeyId: kmsKey.id,
      tags,
    });

    // --- ECS Task Definition ---
    const taskDefinition = new EcsTaskDefinition(this, 'TaskDefinition', {
      provider,
      family: `${resourcePrefix}-task`,
      requiresCompatibilities: ['FARGATE'],
      networkMode: 'awsvpc',
      cpu: '256',
      memory: '512',
      executionRoleArn: ecsTaskExecutionRole.arn,
      containerDefinitions: Fn.jsonencode([
        {
          name: 'my-app',
          image: 'nginx',
          portMappings: [{ containerPort: 80, hostPort: 80 }],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': logGroup.name,
              'awslogs-region': provider.region!,
              'awslogs-stream-prefix': 'ecs',
            },
          },
        },
      ]),
      tags,
    });

    // --- ECS Cluster and Service ---
    const cluster = new EcsCluster(this, 'EcsCluster', {
      provider,
      name: `${resourcePrefix}-cluster`,
      tags,
    });

    new EcsService(this, 'EcsService', {
      provider,
      name: `${resourcePrefix}-service`,
      cluster: cluster.id,
      taskDefinition: taskDefinition.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: subnetIds,
        assignPublicIp: true, // Set to false for private services
      },
      tags,
    });

    // --- SNS Topic for Notifications ---
    const snsTopic = new SnsTopic(this, 'SnsTopic', {
      provider,
      name: `${resourcePrefix}-stack-updates`,
      kmsMasterKeyId: kmsKey.id,
      tags,
    });

    // --- Outputs ---
    new TerraformOutput(this, 'ecs_cluster_name', { value: cluster.name });
    new TerraformOutput(this, 'sns_topic_arn', { value: snsTopic.arn });
  }
}

// --- Main Application ---
const app = new App();

// --- Environment Configurations ---
const environments = {
  dev: {
    account: '111122223333', // Replace with your Dev account ID
    region: 'us-east-1',
    vpcId: 'vpc-0123456789abcdef0', // Replace with your Dev VPC ID
    subnetIds: ['subnet-01234567', 'subnet-89abcdef'], // Replace with your Dev Subnet IDs
    amiId: 'ami-0c55b159cbfafe1f0',
  },
  test: {
    account: '444455556666', // Replace with your Test account ID
    region: 'us-west-2',
    vpcId: 'vpc-fedcba9876543210f', // Replace with your Test VPC ID
    subnetIds: ['subnet-fedcba98', 'subnet-76543210'], // Replace with your Test Subnet IDs
    amiId: 'ami-0c55b159cbfafe1f0', // Replace with a valid AMI for us-west-2
  },
  prod: {
    account: '777788889999', // Replace with your Prod account ID
    region: 'us-east-1',
    vpcId: 'vpc-aabbccddeeff00112', // Replace with your Prod VPC ID
    subnetIds: ['subnet-aabbccdd', 'subnet-eeff0011'], // Replace with your Prod Subnet IDs
    amiId: 'ami-0c55b159cbfafe1f0',
  },
};

const commonTags = {
  Project: 'WebApp',
  Owner: 'DevOpsTeam',
  'cost-center': '12345', // Example cost allocation tag
};

// --- Instantiate a Stack for Each Environment ---
for (const [envName, config] of Object.entries(environments)) {
  const provider = new AwsProvider(app, `aws-provider-${envName}`, {
    region: config.region,
    // For multi-account, you would configure assume_role here or use named profiles
    // assumeRole: {
    //   roleArn: `arn:aws:iam::${config.account}:role/TerraformExecutionRole`,
    // },
  });

  new EcsStack(app, `${envName}-ecs-stack`, {
    provider,
    environmentName: envName as 'dev' | 'test' | 'prod',
    vpcId: config.vpcId,
    subnetIds: config.subnetIds,
    amiId: config.amiId,
    tags: { ...commonTags, Environment: envName },
  });
}

app.synth();
```
