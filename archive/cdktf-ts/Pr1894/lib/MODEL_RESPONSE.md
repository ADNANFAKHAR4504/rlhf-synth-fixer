I'll create a comprehensive CDKTF project in TypeScript that meets all your requirements. This will be a production-ready infrastructure-as-code solution for deploying ECS across multiple AWS accounts and regions.

## Core Configuration Files

### package.json

```json
{
  "name": "ecs-cdktf-infrastructure",
  "version": "1.0.0",
  "description": "Multi-account, multi-region ECS deployment using CDKTF",
  "main": "main.js",
  "scripts": {
    "get": "cdktf get",
    "build": "tsc",
    "synth": "cdktf synth",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy",
    "diff": "cdktf diff",
    "validate": "cdktf validate"
  },
  "dependencies": {
    "@cdktf/provider-aws": "^19.0.0",
    "cdktf": "^0.20.0",
    "constructs": "^10.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"],
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "exclude": ["node_modules", "cdktf.out"]
}
```

### cdktf.json

```json
{
  "language": "typescript",
  "app": "npx ts-node main.ts",
  "projectId": "ecs-infrastructure",
  "sendCrashReports": "false",
  "terraformProviders": ["aws@~> 5.0"],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

## Configuration Management

### config/common.ts

```typescript
export interface CommonTags {
  Project: string;
  ManagedBy: string;
  Environment: string;
  CostCenter: string;
  Owner: string;
  Region: string;
}

export const getCommonTags = (
  environment: string,
  region: string
): CommonTags => ({
  Project: 'ECS-Infrastructure',
  ManagedBy: 'CDKTF',
  Environment: environment,
  CostCenter: `${environment}-ops`,
  Owner: 'platform-team',
  Region: region,
});

export const KMS_KEY_POLICY = {
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'Enable IAM User Permissions',
      Effect: 'Allow',
      Principal: {
        AWS: 'arn:aws:iam::${data.aws_caller_identity.current.account_id}:root',
      },
      Action: 'kms:*',
      Resource: '*',
    },
    {
      Sid: 'Allow ECS Service',
      Effect: 'Allow',
      Principal: {
        Service: 'ecs-tasks.amazonaws.com',
      },
      Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
      Resource: '*',
    },
  ],
};
```

### config/environments.ts

```typescript
export interface EnvironmentConfig {
  accountId: string;
  region: string;
  vpcId?: string;
  privateSubnetIds: string[];
  publicSubnetIds: string[];
  amiId?: string;
  instanceType: string;
  minCapacity: number;
  maxCapacity: number;
  desiredCapacity: number;
  enableLogging: boolean;
  enableMonitoring: boolean;
  notificationEmail: string;
  kmsKeyRotation: boolean;
}

export const environments: Record<string, EnvironmentConfig> = {
  dev: {
    accountId: '111111111111',
    region: 'us-west-2',
    privateSubnetIds: ['subnet-dev-private-1', 'subnet-dev-private-2'],
    publicSubnetIds: ['subnet-dev-public-1', 'subnet-dev-public-2'],
    instanceType: 't3.medium',
    minCapacity: 1,
    maxCapacity: 3,
    desiredCapacity: 2,
    enableLogging: true,
    enableMonitoring: true,
    notificationEmail: 'dev-team@company.com',
    kmsKeyRotation: true,
  },
  test: {
    accountId: '222222222222',
    region: 'us-west-2',
    privateSubnetIds: ['subnet-test-private-1', 'subnet-test-private-2'],
    publicSubnetIds: ['subnet-test-public-1', 'subnet-test-public-2'],
    instanceType: 't3.large',
    minCapacity: 2,
    maxCapacity: 5,
    desiredCapacity: 3,
    enableLogging: true,
    enableMonitoring: true,
    notificationEmail: 'test-team@company.com',
    kmsKeyRotation: true,
  },
  prod: {
    accountId: '333333333333',
    region: 'us-east-1',
    privateSubnetIds: [
      'subnet-prod-private-1',
      'subnet-prod-private-2',
      'subnet-prod-private-3',
    ],
    publicSubnetIds: [
      'subnet-prod-public-1',
      'subnet-prod-public-2',
      'subnet-prod-public-3',
    ],
    instanceType: 't3.xlarge',
    minCapacity: 3,
    maxCapacity: 10,
    desiredCapacity: 5,
    enableLogging: true,
    enableMonitoring: true,
    notificationEmail: 'prod-team@company.com',
    kmsKeyRotation: true,
  },
};
```

## Construct Implementations

### KMS

```typescript
import { Construct } from 'constructs';
import {
  KmsKey,
  KmsAlias,
  DataAwsCallerIdentity,
} from '@cdktf/provider-aws/lib';
import { CommonTags, KMS_KEY_POLICY } from '../config/common';

export interface KmsConstructProps {
  environment: string;
  tags: CommonTags;
  enableKeyRotation: boolean;
}

export class KmsConstruct extends Construct {
  public readonly key: KmsKey;
  public readonly alias: KmsAlias;

  constructor(scope: Construct, id: string, props: KmsConstructProps) {
    super(scope, id);

    const callerIdentity = new DataAwsCallerIdentity(this, 'current');

    // Create KMS key for encryption
    this.key = new KmsKey(this, 'encryption-key', {
      description: `ECS encryption key for ${props.environment} environment`,
      keyUsage: 'ENCRYPT_DECRYPT',
      keySpec: 'SYMMETRIC_DEFAULT',
      enableKeyRotation: props.enableKeyRotation,
      deletionWindowInDays: 7,
      policy: JSON.stringify(KMS_KEY_POLICY).replace(
        '${data.aws_caller_identity.current.account_id}',
        callerIdentity.accountId
      ),
      tags: {
        ...props.tags,
        Name: `ecs-${props.environment}-encryption-key`,
        Purpose: 'ECS-Encryption',
      },
    });

    // Create alias for the key
    this.alias = new KmsAlias(this, 'encryption-key-alias', {
      name: `alias/ecs-${props.environment}-encryption`,
      targetKeyId: this.key.keyId,
    });
  }
}
```

### IAM-Roles

```typescript
import { Construct } from 'constructs';
import {
  IamRole,
  IamRolePolicyAttachment,
  IamPolicy,
  DataAwsIamPolicyDocument,
} from '@cdktf/provider-aws/lib';
import { CommonTags } from '../config/common';

export interface IamRolesConstructProps {
  environment: string;
  tags: CommonTags;
  kmsKeyArn: string;
}

export class IamRolesConstruct extends Construct {
  public readonly ecsTaskRole: IamRole;
  public readonly ecsExecutionRole: IamRole;
  public readonly ecsInstanceRole: IamRole;

  constructor(scope: Construct, id: string, props: IamRolesConstructProps) {
    super(scope, id);

    // ECS Task Role
    const ecsTaskAssumeRolePolicy = new DataAwsIamPolicyDocument(
      this,
      'ecs-task-assume-role-policy',
      {
        statement: [
          {
            actions: ['sts:AssumeRole'],
            principals: [
              {
                type: 'Service',
                identifiers: ['ecs-tasks.amazonaws.com'],
              },
            ],
          },
        ],
      }
    );

    this.ecsTaskRole = new IamRole(this, 'ecs-task-role', {
      name: `ecs-task-role-${props.environment}`,
      assumeRolePolicy: ecsTaskAssumeRolePolicy.json,
      tags: {
        ...props.tags,
        Name: `ecs-task-role-${props.environment}`,
        Purpose: 'ECS-Task-Execution',
      },
    });

    // ECS Task Role Policy for KMS and CloudWatch
    const ecsTaskPolicyDocument = new DataAwsIamPolicyDocument(
      this,
      'ecs-task-policy-document',
      {
        statement: [
          {
            effect: 'Allow',
            actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
            resources: [props.kmsKeyArn],
          },
          {
            effect: 'Allow',
            actions: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            resources: ['arn:aws:logs:*:*:*'],
          },
        ],
      }
    );

    const ecsTaskPolicy = new IamPolicy(this, 'ecs-task-policy', {
      name: `ecs-task-policy-${props.environment}`,
      policy: ecsTaskPolicyDocument.json,
    });

    new IamRolePolicyAttachment(this, 'ecs-task-policy-attachment', {
      role: this.ecsTaskRole.name,
      policyArn: ecsTaskPolicy.arn,
    });

    // ECS Execution Role
    this.ecsExecutionRole = new IamRole(this, 'ecs-execution-role', {
      name: `ecs-execution-role-${props.environment}`,
      assumeRolePolicy: ecsTaskAssumeRolePolicy.json,
      tags: {
        ...props.tags,
        Name: `ecs-execution-role-${props.environment}`,
        Purpose: 'ECS-Task-Execution',
      },
    });

    // Attach AWS managed policy for ECS task execution
    new IamRolePolicyAttachment(this, 'ecs-execution-role-policy', {
      role: this.ecsExecutionRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    // Additional policy for KMS access
    const ecsExecutionPolicyDocument = new DataAwsIamPolicyDocument(
      this,
      'ecs-execution-policy-document',
      {
        statement: [
          {
            effect: 'Allow',
            actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
            resources: [props.kmsKeyArn],
          },
        ],
      }
    );

    const ecsExecutionPolicy = new IamPolicy(this, 'ecs-execution-policy', {
      name: `ecs-execution-policy-${props.environment}`,
      policy: ecsExecutionPolicyDocument.json,
    });

    new IamRolePolicyAttachment(this, 'ecs-execution-policy-attachment', {
      role: this.ecsExecutionRole.name,
      policyArn: ecsExecutionPolicy.arn,
    });

    // ECS Instance Role (for EC2 launch type)
    const ec2AssumeRolePolicy = new DataAwsIamPolicyDocument(
      this,
      'ec2-assume-role-policy',
      {
        statement: [
          {
            actions: ['sts:AssumeRole'],
            principals: [
              {
                type: 'Service',
                identifiers: ['ec2.amazonaws.com'],
              },
            ],
          },
        ],
      }
    );

    this.ecsInstanceRole = new IamRole(this, 'ecs-instance-role', {
      name: `ecs-instance-role-${props.environment}`,
      assumeRolePolicy: ec2AssumeRolePolicy.json,
      tags: {
        ...props.tags,
        Name: `ecs-instance-role-${props.environment}`,
        Purpose: 'ECS-Instance',
      },
    });

    // Attach AWS managed policy for ECS container instance
    new IamRolePolicyAttachment(this, 'ecs-instance-role-policy', {
      role: this.ecsInstanceRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role',
    });
  }
}
```

### Monitoring

```typescript
import { Construct } from 'constructs';
import {
  CloudwatchLogGroup,
  CloudwatchMetricAlarm,
  CloudwatchDashboard,
} from '@cdktf/provider-aws/lib';
import { CommonTags } from '../config/common';

export interface MonitoringConstructProps {
  environment: string;
  clusterName: string;
  serviceName: string;
  tags: CommonTags;
  kmsKeyId: string;
  snsTopicArn: string;
}

export class MonitoringConstruct extends Construct {
  public readonly logGroup: CloudwatchLogGroup;
  public readonly cpuAlarm: CloudwatchMetricAlarm;
  public readonly memoryAlarm: CloudwatchMetricAlarm;

  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    // CloudWatch Log Group
    this.logGroup = new CloudwatchLogGroup(this, 'ecs-log-group', {
      name: `/ecs/${props.environment}/${props.serviceName}`,
      retentionInDays: props.environment === 'prod' ? 90 : 30,
      kmsKeyId: props.kmsKeyId,
      tags: {
        ...props.tags,
        Name: `ecs-logs-${props.environment}-${props.serviceName}`,
        Purpose: 'ECS-Logging',
      },
    });

    // CPU Utilization Alarm
    this.cpuAlarm = new CloudwatchMetricAlarm(this, 'cpu-utilization-alarm', {
      alarmName: `ecs-${props.environment}-${props.serviceName}-cpu-high`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/ECS',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: `High CPU utilization for ECS service ${props.serviceName} in ${props.environment}`,
      alarmActions: [props.snsTopicArn],
      dimensions: {
        ServiceName: props.serviceName,
        ClusterName: props.clusterName,
      },
      tags: {
        ...props.tags,
        Name: `ecs-cpu-alarm-${props.environment}`,
        Purpose: 'ECS-Monitoring',
      },
    });

    // Memory Utilization Alarm
    this.memoryAlarm = new CloudwatchMetricAlarm(
      this,
      'memory-utilization-alarm',
      {
        alarmName: `ecs-${props.environment}-${props.serviceName}-memory-high`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'MemoryUtilization',
        namespace: 'AWS/ECS',
        period: 300,
        statistic: 'Average',
        threshold: 85,
        alarmDescription: `High memory utilization for ECS service ${props.serviceName} in ${props.environment}`,
        alarmActions: [props.snsTopicArn],
        dimensions: {
          ServiceName: props.serviceName,
          ClusterName: props.clusterName,
        },
        tags: {
          ...props.tags,
          Name: `ecs-memory-alarm-${props.environment}`,
          Purpose: 'ECS-Monitoring',
        },
      }
    );

    // CloudWatch Dashboard
    new CloudwatchDashboard(this, 'ecs-dashboard', {
      dashboardName: `ECS-${props.environment}-${props.serviceName}`,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: 'metric',
            x: 0,
            y: 0,
            width: 12,
            height: 6,
            properties: {
              metrics: [
                [
                  'AWS/ECS',
                  'CPUUtilization',
                  'ServiceName',
                  props.serviceName,
                  'ClusterName',
                  props.clusterName,
                ],
                ['.', 'MemoryUtilization', '.', '.', '.', '.'],
              ],
              period: 300,
              stat: 'Average',
              region: props.tags.Region,
              title: 'ECS Service Metrics',
            },
          },
        ],
      }),
    });
  }
}
```

### Notifications

```typescript
import { Construct } from 'constructs';
import {
  SnsTopic,
  SnsTopicSubscription,
  SnsTopicPolicy,
  DataAwsIamPolicyDocument,
} from '@cdktf/provider-aws/lib';
import { CommonTags } from '../config/common';

export interface NotificationsConstructProps {
  environment: string;
  tags: CommonTags;
  notificationEmail: string;
  kmsKeyId: string;
}

export class NotificationsConstruct extends Construct {
  public readonly topic: SnsTopic;

  constructor(
    scope: Construct,
    id: string,
    props: NotificationsConstructProps
  ) {
    super(scope, id);

    // SNS Topic for notifications
    this.topic = new SnsTopic(this, 'notifications-topic', {
      name: `ecs-${props.environment}-notifications`,
      displayName: `ECS ${props.environment} Notifications`,
      kmsMasterKeyId: props.kmsKeyId,
      tags: {
        ...props.tags,
        Name: `ecs-notifications-${props.environment}`,
        Purpose: 'ECS-Notifications',
      },
    });

    // Email subscription
    new SnsTopicSubscription(this, 'email-subscription', {
      topicArn: this.topic.arn,
      protocol: 'email',
      endpoint: props.notificationEmail,
    });

    // SNS Topic Policy to allow CloudWatch alarms
    const topicPolicyDocument = new DataAwsIamPolicyDocument(
      this,
      'topic-policy-document',
      {
        statement: [
          {
            effect: 'Allow',
            principals: [
              {
                type: 'Service',
                identifiers: ['cloudwatch.amazonaws.com'],
              },
            ],
            actions: ['sns:Publish'],
            resources: [this.topic.arn],
          },
          {
            effect: 'Allow',
            principals: [
              {
                type: 'Service',
                identifiers: ['events.amazonaws.com'],
              },
            ],
            actions: ['sns:Publish'],
            resources: [this.topic.arn],
          },
        ],
      }
    );

    new SnsTopicPolicy(this, 'topic-policy', {
      arn: this.topic.arn,
      policy: topicPolicyDocument.json,
    });
  }
}
```

### ECS-Cluster

```typescript
import { Construct } from 'constructs';
import {
  EcsCluster,
  EcsService,
  EcsTaskDefinition,
  EcsCapacityProvider,
  LaunchTemplate,
  AutoscalingGroup,
  IamInstanceProfile,
  SecurityGroup,
  SecurityGroupRule,
  DataAwsAmi,
} from '@cdktf/provider-aws/lib';
import { CommonTags } from '../config/common';
import { EnvironmentConfig } from '../config/environments';

export interface EcsClusterConstructProps {
  environment: string;
  config: EnvironmentConfig;
  tags: CommonTags;
  taskRoleArn: string;
  executionRoleArn: string;
  instanceRoleArn: string;
  logGroupName: string;
  kmsKeyId: string;
}

export class EcsClusterConstruct extends Construct {
  public readonly cluster: EcsCluster;
  public readonly service: EcsService;
  public readonly taskDefinition: EcsTaskDefinition;

  constructor(scope: Construct, id: string, props: EcsClusterConstructProps) {
    super(scope, id);

    // Get latest ECS-optimized AMI if not specified
    const ecsAmi = new DataAwsAmi(this, 'ecs-ami', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-ecs-hvm-*-x86_64-ebs'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // Security Group for ECS instances
    const ecsSecurityGroup = new SecurityGroup(this, 'ecs-security-group', {
      name: `ecs-sg-${props.environment}`,
      description: `Security group for ECS cluster in ${props.environment}`,
      vpcId: props.config.vpcId,
      tags: {
        ...props.tags,
        Name: `ecs-sg-${props.environment}`,
        Purpose: 'ECS-Security',
      },
    });

    // Allow HTTP traffic
    new SecurityGroupRule(this, 'ecs-sg-http-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/8'],
      securityGroupId: ecsSecurityGroup.id,
    });

    // Allow HTTPS traffic
    new SecurityGroupRule(this, 'ecs-sg-https-ingress', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/8'],
      securityGroupId: ecsSecurityGroup.id,
    });

    // Allow all outbound traffic
    new SecurityGroupRule(this, 'ecs-sg-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: ecsSecurityGroup.id,
    });

    // IAM Instance Profile for ECS instances
    const instanceProfile = new IamInstanceProfile(
      this,
      'ecs-instance-profile',
      {
        name: `ecs-instance-profile-${props.environment}`,
        role: props.instanceRoleArn.split('/').pop()!,
      }
    );

    // Launch Template for ECS instances
    const launchTemplate = new LaunchTemplate(this, 'ecs-launch-template', {
      name: `ecs-launch-template-${props.environment}`,
      imageId: props.config.amiId || ecsAmi.id,
      instanceType: props.config.instanceType,
      keyName: `ecs-key-${props.environment}`, // Assume key pair exists
      vpcSecurityGroupIds: [ecsSecurityGroup.id],
      iamInstanceProfile: {
        name: instanceProfile.name,
      },
      userData: Buffer.from(
        `#!/bin/bash
echo ECS_CLUSTER=ecs-cluster-${props.environment} >> /etc/ecs/ecs.config
echo ECS_ENABLE_CONTAINER_METADATA=true >> /etc/ecs/ecs.config
yum update -y
yum install -y awslogs
systemctl enable awslogsd
systemctl start awslogsd
`
      ).toString('base64'),
      blockDeviceMappings: [
        {
          deviceName: '/dev/xvda',
          ebs: {
            volumeSize: 30,
            volumeType: 'gp3',
            encrypted: true,
            kmsKeyId: props.kmsKeyId,
            deleteOnTermination: true,
          },
        },
      ],
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            ...props.tags,
            Name: `ecs-instance-${props.environment}`,
            Purpose: 'ECS-Container-Instance',
          },
        },
      ],
    });

    // Auto Scaling Group
    const autoScalingGroup = new AutoscalingGroup(this, 'ecs-asg', {
      name: `ecs-asg-${props.environment}`,
      minSize: props.config.minCapacity,
      maxSize: props.config.maxCapacity,
      desiredCapacity: props.config.desiredCapacity,
      vpcZoneIdentifier: props.config.privateSubnetIds,
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      tag: Object.entries({
        ...props.tags,
        Name: `ecs-asg-${props.environment}`,
        Purpose: 'ECS-Auto-Scaling',
      }).map(([key, value]) => ({
        key,
        value,
        propagateAtLaunch: true,
      })),
    });

    // ECS Capacity Provider
    const capacityProvider = new EcsCapacityProvider(
      this,
      'ecs-capacity-provider',
      {
        name: `ecs-cp-${props.environment}`,
        autoScalingGroupProvider: {
          autoScalingGroupArn: autoScalingGroup.arn,
          managedScaling: {
            status: 'ENABLED',
            targetCapacity: 80,
            minimumScalingStepSize: 1,
            maximumScalingStepSize: 3,
          },
          managedTerminationProtection: 'ENABLED',
        },
        tags: {
          ...props.tags,
          Name: `ecs-cp-${props.environment}`,
          Purpose: 'ECS-Capacity-Provider',
        },
      }
    );

    // ECS Cluster
    this.cluster = new EcsCluster(this, 'ecs-cluster', {
      name: `ecs-cluster-${props.environment}`,
      capacityProviders: [capacityProvider.name],
      defaultCapacityProviderStrategy: [
        {
          capacityProvider: capacityProvider.name,
          weight: 1,
          base: 1,
        },
      ],
      setting: [
        {
          name: 'containerInsights',
          value: props.config.enableMonitoring ? 'enabled' : 'disabled',
        },
      ],
      tags: {
        ...props.tags,
        Name: `ecs-cluster-${props.environment}`,
        Purpose: 'ECS-Cluster',
      },
    });

    // ECS Task Definition
    this.taskDefinition = new EcsTaskDefinition(this, 'ecs-task-definition', {
      family: `app-task-${props.environment}`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['EC2'],
      cpu: '256',
      memory: '512',
      executionRoleArn: props.executionRoleArn,
      taskRoleArn: props.taskRoleArn,
      containerDefinitions: JSON.stringify([
        {
          name: 'app-container',
          image: 'nginx:latest', // Replace with your application image
          memory: 512,
          essential: true,
          portMappings: [
            {
              containerPort: 80,
              hostPort: 0,
              protocol: 'tcp',
            },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': props.logGroupName,
              'awslogs-region': props.config.region,
              'awslogs-stream-prefix': 'ecs',
            },
          },
          environment: [
            {
              name: 'ENVIRONMENT',
              value: props.environment,
            },
          ],
        },
      ]),
      tags: {
        ...props.tags,
        Name: `ecs-task-${props.environment}`,
        Purpose: 'ECS-Task-Definition',
      },
    });

    // ECS Service
    this.service = new EcsService(this, 'ecs-service', {
      name: `app-service-${props.environment}`,
      cluster: this.cluster.id,
      taskDefinition: this.taskDefinition.arn,
      desiredCount: props.config.desiredCapacity,
      launchType: 'EC2',
      networkConfiguration: {
        subnets: props.config.privateSubnetIds,
        securityGroups: [ecsSecurityGroup.id],
        assignPublicIp: false,
      },
      deploymentConfiguration: {
        maximumPercent: 200,
        minimumHealthyPercent: 50,
      },
      enableExecuteCommand: true,
      tags: {
        ...props.tags,
        Name: `ecs-service-${props.environment}`,
        Purpose: 'ECS-Service',
      },
    });
  }
}
```

## Stack Implementation

### stacks/ecs-stack.ts

```typescript
import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '@cdktf
```
