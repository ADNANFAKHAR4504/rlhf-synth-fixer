# SageMaker Model Training Infrastructure Implementation

Here's the CDK infrastructure code for the SageMaker model training platform:

## tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkingStack } from './networking-stack';
import { SageMakerStack } from './sagemaker-stack';
import { StorageStack } from './storage-stack';
import { BatchStack } from './batch-stack';
import { MonitoringStack } from './monitoring-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const networkingStack = new NetworkingStack(this, 'NetworkingStack', {
      environmentSuffix,
    });

    const storageStack = new StorageStack(this, 'StorageStack', {
      environmentSuffix,
    });

    const monitoringStack = new MonitoringStack(this, 'MonitoringStack', {
      environmentSuffix,
    });

    const sageMakerStack = new SageMakerStack(this, 'SageMakerStack', {
      environmentSuffix,
      vpc: networkingStack.vpc,
      datasetBucket: storageStack.datasetBucket,
      modelBucket: storageStack.modelBucket,
      ecrRepository: storageStack.ecrRepository,
      logGroup: monitoringStack.logGroup,
    });

    const batchStack = new BatchStack(this, 'BatchStack', {
      environmentSuffix,
      vpc: networkingStack.vpc,
      modelBucket: storageStack.modelBucket,
      ecrRepository: storageStack.ecrRepository,
    });
  }
}
```

## networking-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkingStackProps {
  environmentSuffix: string;
}

export class NetworkingStack extends cdk.NestedStack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id);

    this.vpc = new ec2.Vpc(this, 'TrainingVPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.220.0.0/16'),
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // S3 VPC Endpoint
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
    });

    // SageMaker VPC Endpoints
    this.vpc.addInterfaceEndpoint('SageMakerAPIEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SAGEMAKER_API,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    this.vpc.addInterfaceEndpoint('SageMakerRuntimeEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SAGEMAKER_RUNTIME,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // ECR VPC Endpoints
    this.vpc.addInterfaceEndpoint('ECREndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    this.vpc.addInterfaceEndpoint('ECRDockerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });
  }
}
```

## storage-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

interface StorageStackProps {
  environmentSuffix: string;
}

export class StorageStack extends cdk.NestedStack {
  public readonly datasetBucket: s3.Bucket;
  public readonly modelBucket: s3.Bucket;
  public readonly ecrRepository: ecr.Repository;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id);

    this.datasetBucket = new s3.Bucket(this, 'DatasetBucket', {
      bucketName: `training-datasets-${props.environmentSuffix}-${cdk.Stack.of(this).account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.modelBucket = new s3.Bucket(this, 'ModelBucket', {
      bucketName: `model-artifacts-${props.environmentSuffix}-${cdk.Stack.of(this).account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'archive-old-models',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(180),
            },
          ],
        },
      ],
    });

    this.ecrRepository = new ecr.Repository(this, 'TrainingRepository', {
      repositoryName: `training-containers-${props.environmentSuffix}`,
      imageScanOnPush: true,
      lifecycleRules: [
        {
          maxImageCount: 50,
        },
      ],
    });
  }
}
```

## sagemaker-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as sagemaker from 'aws-cdk-lib/aws-sagemaker';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface SageMakerStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  datasetBucket: s3.Bucket;
  modelBucket: s3.Bucket;
  ecrRepository: ecr.Repository;
  logGroup: logs.LogGroup;
}

export class SageMakerStack extends cdk.NestedStack {
  public readonly notebookRole: iam.Role;
  public readonly trainingRole: iam.Role;

  constructor(scope: Construct, id: string, props: SageMakerStackProps) {
    super(scope, id);

    const securityGroup = new ec2.SecurityGroup(this, 'SageMakerSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for SageMaker resources',
      allowAllOutbound: true,
    });

    // IAM Role for Notebook Instance
    this.notebookRole = new iam.Role(this, 'NotebookExecutionRole', {
      assumedBy: new iam.ServicePrincipal('sagemaker.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSageMakerFullAccess'),
      ],
    });

    props.datasetBucket.grantReadWrite(this.notebookRole);
    props.modelBucket.grantReadWrite(this.notebookRole);
    props.ecrRepository.grantPullPush(this.notebookRole);

    // IAM Role for Training Jobs
    this.trainingRole = new iam.Role(this, 'TrainingJobRole', {
      assumedBy: new iam.ServicePrincipal('sagemaker.amazonaws.com'),
      inlinePolicies: {
        TrainingPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'sagemaker:*',
                'ecr:GetAuthorizationToken',
                'ecr:BatchCheckLayerAvailability',
                'ecr:GetDownloadUrlForLayer',
                'ecr:BatchGetImage',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'cloudwatch:PutMetricData',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    props.datasetBucket.grantRead(this.trainingRole);
    props.modelBucket.grantWrite(this.trainingRole);
    props.ecrRepository.grantPull(this.trainingRole);

    // SageMaker Notebook Instance
    const notebookInstance = new sagemaker.CfnNotebookInstance(this, 'NotebookInstance', {
      instanceType: 'ml.t3.medium',
      roleArn: this.notebookRole.roleArn,
      notebookInstanceName: `training-notebook-${props.environmentSuffix}`,
      subnetId: props.vpc.privateSubnets[0].subnetId,
      securityGroupIds: [securityGroup.securityGroupId],
      defaultCodeRepository: 'https://github.com/aws/amazon-sagemaker-examples.git',
    });

    // Training Job Configuration (as a custom resource or through SDK)
    new cdk.CfnOutput(this, 'TrainingRoleArn', {
      value: this.trainingRole.roleArn,
      description: 'ARN of the IAM role for SageMaker training jobs',
    });

    new cdk.CfnOutput(this, 'TrainingJobConfig', {
      value: JSON.stringify({
        RoleArn: this.trainingRole.roleArn,
        EnableManagedSpotTraining: true,
        MaxRuntimeInSeconds: 86400,
        MaxWaitTimeInSeconds: 172800,
        VpcConfig: {
          SecurityGroupIds: [securityGroup.securityGroupId],
          Subnets: props.vpc.privateSubnets.map(subnet => subnet.subnetId),
        },
      }),
      description: 'Configuration for SageMaker training jobs with spot instances',
    });
  }
}
```

## batch-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as batch from 'aws-cdk-lib/aws-batch';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

interface BatchStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  modelBucket: s3.Bucket;
  ecrRepository: ecr.Repository;
}

export class BatchStack extends cdk.NestedStack {
  public readonly batchRole: iam.Role;

  constructor(scope: Construct, id: string, props: BatchStackProps) {
    super(scope, id);

    // IAM Role for Batch Jobs
    this.batchRole = new iam.Role(this, 'BatchJobRole', {
      assumedBy: new iam.ServicePrincipal('batch.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSBatchServiceRole'),
      ],
    });

    const instanceRole = new iam.Role(this, 'BatchInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2ContainerServiceforEC2Role'),
      ],
    });

    props.modelBucket.grantRead(instanceRole);
    props.ecrRepository.grantPull(instanceRole);

    const instanceProfile = new iam.CfnInstanceProfile(this, 'BatchInstanceProfile', {
      roles: [instanceRole.roleName],
    });

    const securityGroup = new ec2.SecurityGroup(this, 'BatchSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for Batch compute environment',
      allowAllOutbound: true,
    });

    // Compute Environment
    const computeEnvironment = new batch.CfnComputeEnvironment(this, 'ComputeEnvironment', {
      type: 'MANAGED',
      state: 'ENABLED',
      computeEnvironmentName: `batch-inference-${props.environmentSuffix}`,
      serviceRole: this.batchRole.roleArn,
      computeResources: {
        type: 'EC2_SPOT',
        minvCpus: 0,
        maxvCpus: 256,
        desiredvCpus: 4,
        instanceTypes: ['optimal'],
        subnets: props.vpc.privateSubnets.map(subnet => subnet.subnetId),
        securityGroupIds: [securityGroup.securityGroupId],
        instanceRole: instanceProfile.attrArn,
        spotIamFleetRole: new iam.Role(this, 'SpotFleetRole', {
          assumedBy: new iam.ServicePrincipal('spotfleet.amazonaws.com'),
          managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2SpotFleetTaggingRole'),
          ],
        }).roleArn,
        bidPercentage: 80,
      },
    });

    // Job Queue
    const jobQueue = new batch.CfnJobQueue(this, 'JobQueue', {
      priority: 1,
      jobQueueName: `inference-queue-${props.environmentSuffix}`,
      state: 'ENABLED',
      computeEnvironmentOrder: [
        {
          order: 1,
          computeEnvironment: computeEnvironment.ref,
        },
      ],
    });

    // Job Definition for inference
    const jobDefinition = new batch.CfnJobDefinition(this, 'JobDefinition', {
      type: 'container',
      jobDefinitionName: `inference-job-${props.environmentSuffix}`,
      containerProperties: {
        image: `${props.ecrRepository.repositoryUri}:latest`,
        vcpus: 4,
        memory: 8192,
        jobRoleArn: new iam.Role(this, 'JobExecutionRole', {
          assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
          inlinePolicies: {
            JobPolicy: new iam.PolicyDocument({
              statements: [
                new iam.PolicyStatement({
                  actions: ['s3:GetObject', 's3:PutObject'],
                  resources: [`${props.modelBucket.bucketArn}/*`],
                }),
              ],
            }),
          },
        }).roleArn,
      },
      retryStrategy: {
        attempts: 3,
      },
      timeout: {
        attemptDurationSeconds: 3600,
      },
    });
  }
}
```

## monitoring-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface MonitoringStackProps {
  environmentSuffix: string;
}

export class MonitoringStack extends cdk.NestedStack {
  public readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id);

    this.logGroup = new logs.LogGroup(this, 'TrainingLogGroup', {
      logGroupName: `/aws/sagemaker/training-jobs-${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const dashboard = new cloudwatch.Dashboard(this, 'TrainingDashboard', {
      dashboardName: `sagemaker-training-${props.environmentSuffix}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Training Job Metrics',
            width: 12,
            height: 6,
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/SageMaker',
                metricName: 'ModelLatency',
                dimensionsMap: {
                  EndpointName: 'ALL',
                },
                statistic: 'Average',
              }),
            ],
            right: [
              new cloudwatch.Metric({
                namespace: 'AWS/SageMaker',
                metricName: 'CPUUtilization',
                dimensionsMap: {
                  Host: 'ALL',
                },
                statistic: 'Average',
              }),
            ],
          }),
          new cloudwatch.GraphWidget({
            title: 'Memory Utilization',
            width: 12,
            height: 6,
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/SageMaker',
                metricName: 'MemoryUtilization',
                dimensionsMap: {
                  Host: 'ALL',
                },
                statistic: 'Average',
              }),
            ],
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Training Job Status',
            width: 24,
            height: 6,
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/SageMaker',
                metricName: 'TrainingJobsCount',
                statistic: 'Sum',
              }),
            ],
          }),
        ],
      ],
    });

    new cloudwatch.Alarm(this, 'TrainingJobFailureAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/SageMaker',
        metricName: 'TrainingJobsFailed',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when training jobs fail',
    });
  }
}