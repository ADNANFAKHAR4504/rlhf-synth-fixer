# Healthcare CI/CD Pipeline Infrastructure

This document contains the complete AWS CDK TypeScript implementation for a secure CI/CD pipeline that deploys containerized healthcare applications to ECS with RDS PostgreSQL database management.

## File: lib/network-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface NetworkStackProps {
  environmentSuffix: string;
}

export class NetworkStack extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly ecsSecurityGroup: ec2.SecurityGroup;
  public readonly rdsSecurityGroup: ec2.SecurityGroup;
  public readonly efsSecurityGroup: ec2.SecurityGroup;
  public readonly albSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id);

    // Create VPC with public and private subnets
    this.vpc = new ec2.Vpc(this, 'HealthcareVpc', {
      vpcName: `healthcare-vpc-${props.environmentSuffix}`,
      maxAzs: 2,
      natGateways: 1, // Cost optimization: single NAT gateway
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // ALB Security Group - accepts traffic from internet
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `alb-sg-${props.environmentSuffix}`,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from anywhere'
    );

    // ECS Security Group - accepts traffic only from ALB
    this.ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `ecs-sg-${props.environmentSuffix}`,
      description: 'Security group for ECS tasks',
      allowAllOutbound: true,
    });

    this.ecsSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow traffic from ALB'
    );

    // RDS Security Group - accepts traffic only from ECS
    this.rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `rds-sg-${props.environmentSuffix}`,
      description: 'Security group for RDS PostgreSQL',
      allowAllOutbound: false,
    });

    this.rdsSecurityGroup.addIngressRule(
      this.ecsSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL traffic from ECS tasks'
    );

    // EFS Security Group - accepts traffic only from ECS
    this.efsSecurityGroup = new ec2.SecurityGroup(this, 'EfsSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `efs-sg-${props.environmentSuffix}`,
      description: 'Security group for EFS',
      allowAllOutbound: false,
    });

    this.efsSecurityGroup.addIngressRule(
      this.ecsSecurityGroup,
      ec2.Port.tcp(2049),
      'Allow NFS traffic from ECS tasks'
    );

    // Add tags
    cdk.Tags.of(this.vpc).add('Name', `healthcare-vpc-${props.environmentSuffix}`);
  }
}
```

## File: lib/database-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DatabaseStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
}

export class DatabaseStack extends Construct {
  public readonly database: rds.DatabaseInstance;
  public readonly secret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id);

    // Create secret for database credentials
    this.secret = new secretsmanager.Secret(this, 'DbCredentials', {
      secretName: `healthcare-db-credentials-${props.environmentSuffix}`,
      description: 'Database credentials for healthcare application',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'healthcareadmin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 32,
      },
    });

    // Create RDS PostgreSQL instance
    this.database = new rds.DatabaseInstance(this, 'HealthcareDatabase', {
      instanceIdentifier: `healthcare-db-${props.environmentSuffix}`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_3,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [props.securityGroup],
      credentials: rds.Credentials.fromSecret(this.secret),
      databaseName: 'healthcaredb',
      allocatedStorage: 20,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      multiAz: false, // Cost optimization for test environment
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Destroyable for test
      deletionProtection: false, // Must be false for test environment
    });

    // Enable automatic rotation every 30 days
    this.secret.addRotationSchedule('RotationSchedule', {
      automaticallyAfter: cdk.Duration.days(30),
      hostedRotation: secretsmanager.HostedRotation.postgresqlSingleUser(),
    });

    // Outputs
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.dbInstanceEndpointAddress,
      exportName: `healthcare-db-endpoint-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: this.secret.secretArn,
      exportName: `healthcare-db-secret-${props.environmentSuffix}`,
    });
  }
}
```

## File: lib/storage-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface StorageStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
}

export class StorageStack extends Construct {
  public readonly fileSystem: efs.FileSystem;
  public readonly accessPoint: efs.AccessPoint;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id);

    // Create EFS file system
    this.fileSystem = new efs.FileSystem(this, 'HealthcareEfs', {
      vpc: props.vpc,
      fileSystemName: `healthcare-efs-${props.environmentSuffix}`,
      encrypted: true,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_7_DAYS,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      throughputMode: efs.ThroughputMode.BURSTING,
      securityGroup: props.securityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Destroyable for test
    });

    // Create access point for ECS tasks
    this.accessPoint = new efs.AccessPoint(this, 'EcsAccessPoint', {
      fileSystem: this.fileSystem,
      path: '/ecs-data',
      posixUser: {
        uid: '1000',
        gid: '1000',
      },
      createAcl: {
        ownerUid: '1000',
        ownerGid: '1000',
        permissions: '755',
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'FileSystemId', {
      value: this.fileSystem.fileSystemId,
      exportName: `healthcare-efs-id-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AccessPointId', {
      value: this.accessPoint.accessPointId,
      exportName: `healthcare-efs-ap-${props.environmentSuffix}`,
    });
  }
}
```

## File: lib/ecs-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface EcsStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  ecsSecurityGroup: ec2.SecurityGroup;
  albSecurityGroup: ec2.SecurityGroup;
  fileSystem: efs.FileSystem;
  accessPoint: efs.AccessPoint;
  dbSecret: secretsmanager.Secret;
}

export class EcsStack extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly service: ecs.FargateService;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id);

    // Create ECS Cluster
    this.cluster = new ecs.Cluster(this, 'HealthcareCluster', {
      clusterName: `healthcare-cluster-${props.environmentSuffix}`,
      vpc: props.vpc,
      containerInsights: true,
    });

    // Create Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'HealthcareAlb', {
      loadBalancerName: `healthcare-alb-${props.environmentSuffix}`,
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Create Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'HealthcareTg', {
      targetGroupName: `healthcare-tg-${props.environmentSuffix}`,
      vpc: props.vpc,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // Add listener
    this.loadBalancer.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Create Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'HealthcareTask', {
      family: `healthcare-task-${props.environmentSuffix}`,
      cpu: 512,
      memoryLimitMiB: 1024,
    });

    // Add EFS volume to task definition
    taskDefinition.addVolume({
      name: 'efs-storage',
      efsVolumeConfiguration: {
        fileSystemId: props.fileSystem.fileSystemId,
        transitEncryption: 'ENABLED',
        authorizationConfig: {
          accessPointId: props.accessPoint.accessPointId,
          iam: 'ENABLED',
        },
      },
    });

    // Grant EFS permissions to task role
    props.fileSystem.grant(taskDefinition.taskRole, 'elasticfilesystem:ClientMount', 'elasticfilesystem:ClientWrite');

    // Create CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'HealthcareLogGroup', {
      logGroupName: `/ecs/healthcare-${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add container to task definition
    const container = taskDefinition.addContainer('HealthcareContainer', {
      containerName: `healthcare-app-${props.environmentSuffix}`,
      image: ecs.ContainerImage.fromRegistry('nginx:latest'), // Placeholder image
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: 'healthcare',
        logGroup: logGroup,
      }),
      secrets: {
        DB_HOST: ecs.Secret.fromSecretsManager(props.dbSecret, 'host'),
        DB_PORT: ecs.Secret.fromSecretsManager(props.dbSecret, 'port'),
        DB_NAME: ecs.Secret.fromSecretsManager(props.dbSecret, 'dbname'),
        DB_USERNAME: ecs.Secret.fromSecretsManager(props.dbSecret, 'username'),
        DB_PASSWORD: ecs.Secret.fromSecretsManager(props.dbSecret, 'password'),
      },
      environment: {
        ENVIRONMENT: props.environmentSuffix,
      },
    });

    // Mount EFS volume
    container.addMountPoints({
      containerPath: '/mnt/efs',
      sourceVolume: 'efs-storage',
      readOnly: false,
    });

    // Add port mapping
    container.addPortMappings({
      containerPort: 8080,
      protocol: ecs.Protocol.TCP,
    });

    // Grant secret read permissions
    props.dbSecret.grantRead(taskDefinition.taskRole);

    // Create Fargate Service in private subnets
    this.service = new ecs.FargateService(this, 'HealthcareService', {
      serviceName: `healthcare-service-${props.environmentSuffix}`,
      cluster: this.cluster,
      taskDefinition: taskDefinition,
      desiredCount: 2,
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
      securityGroups: [props.ecsSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, // Private subnets with NAT
      },
      assignPublicIp: false, // No public IP - private subnet only
    });

    // Attach service to target group
    this.service.attachToApplicationTargetGroup(targetGroup);

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDns', {
      value: this.loadBalancer.loadBalancerDnsName,
      exportName: `healthcare-alb-dns-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: this.cluster.clusterName,
      exportName: `healthcare-cluster-name-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ServiceName', {
      value: this.service.serviceName,
      exportName: `healthcare-service-name-${props.environmentSuffix}`,
    });
  }
}
```

## File: lib/pipeline-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';

export interface PipelineStackProps {
  environmentSuffix: string;
  ecsCluster: ecs.Cluster;
  ecsService: ecs.FargateService;
}

export class PipelineStack extends Construct {
  public readonly pipeline: codepipeline.Pipeline;
  public readonly repository: codecommit.Repository;

  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id);

    // Create CodeCommit repository
    this.repository = new codecommit.Repository(this, 'HealthcareRepo', {
      repositoryName: `healthcare-app-${props.environmentSuffix}`,
      description: 'Healthcare application source code repository',
    });

    // Create S3 bucket for pipeline artifacts
    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      bucketName: `healthcare-artifacts-${props.environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create CodeBuild project for building Docker images
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      projectName: `healthcare-build-${props.environmentSuffix}`,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true, // Required for Docker builds
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com',
              'REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/healthcare-app',
              'COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)',
              'IMAGE_TAG=${COMMIT_HASH:=latest}',
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'echo Building the Docker image...',
              'docker build -t $REPOSITORY_URI:latest .',
              'docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG',
            ],
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'echo Pushing the Docker images...',
              'docker push $REPOSITORY_URI:latest',
              'docker push $REPOSITORY_URI:$IMAGE_TAG',
              'echo Writing image definitions file...',
              'printf \'[{"name":"healthcare-app-%s","imageUri":"%s"}]\' "$ENVIRONMENT_SUFFIX" "$REPOSITORY_URI:$IMAGE_TAG" > imagedefinitions.json',
            ],
          },
        },
        artifacts: {
          files: ['imagedefinitions.json'],
        },
      }),
      environmentVariables: {
        AWS_DEFAULT_REGION: {
          value: cdk.Stack.of(this).region,
        },
        AWS_ACCOUNT_ID: {
          value: cdk.Stack.of(this).account,
        },
        ENVIRONMENT_SUFFIX: {
          value: props.environmentSuffix,
        },
      },
    });

    // Grant ECR permissions to CodeBuild
    buildProject.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'ecr:GetAuthorizationToken',
          'ecr:BatchCheckLayerAvailability',
          'ecr:GetDownloadUrlForLayer',
          'ecr:BatchGetImage',
          'ecr:PutImage',
          'ecr:InitiateLayerUpload',
          'ecr:UploadLayerPart',
          'ecr:CompleteLayerUpload',
        ],
        resources: ['*'],
      })
    );

    // Create artifacts
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // Create pipeline
    this.pipeline = new codepipeline.Pipeline(this, 'HealthcarePipeline', {
      pipelineName: `healthcare-pipeline-${props.environmentSuffix}`,
      artifactBucket: artifactBucket,
      restartExecutionOnUpdate: true,
    });

    // Add source stage
    this.pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeCommitSourceAction({
          actionName: 'CodeCommit',
          repository: this.repository,
          branch: 'main',
          output: sourceOutput,
          trigger: codepipeline_actions.CodeCommitTrigger.EVENTS,
        }),
      ],
    });

    // Add build stage
    this.pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'DockerBuild',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    // Add deploy stage
    this.pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.EcsDeployAction({
          actionName: 'DeployToEcs',
          service: props.ecsService,
          input: buildOutput,
        }),
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'PipelineName', {
      value: this.pipeline.pipelineName,
      exportName: `healthcare-pipeline-name-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'RepositoryCloneUrlHttp', {
      value: this.repository.repositoryCloneUrlHttp,
      exportName: `healthcare-repo-url-${props.environmentSuffix}`,
    });
  }
}
```

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkStack } from './network-stack';
import { DatabaseStack } from './database-stack';
import { StorageStack } from './storage-stack';
import { EcsStack } from './ecs-stack';
import { PipelineStack } from './pipeline-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create network infrastructure
    const network = new NetworkStack(this, 'Network', {
      environmentSuffix,
    });

    // Create database
    const database = new DatabaseStack(this, 'Database', {
      environmentSuffix,
      vpc: network.vpc,
      securityGroup: network.rdsSecurityGroup,
    });

    // Create EFS storage
    const storage = new StorageStack(this, 'Storage', {
      environmentSuffix,
      vpc: network.vpc,
      securityGroup: network.efsSecurityGroup,
    });

    // Create ECS cluster and service
    const ecs = new EcsStack(this, 'Ecs', {
      environmentSuffix,
      vpc: network.vpc,
      ecsSecurityGroup: network.ecsSecurityGroup,
      albSecurityGroup: network.albSecurityGroup,
      fileSystem: storage.fileSystem,
      accessPoint: storage.accessPoint,
      dbSecret: database.secret,
    });

    // Create CI/CD pipeline
    const pipeline = new PipelineStack(this, 'Pipeline', {
      environmentSuffix,
      ecsCluster: ecs.cluster,
      ecsService: ecs.service,
    });

    // Add dependencies
    database.node.addDependency(network);
    storage.node.addDependency(network);
    ecs.node.addDependency(database);
    ecs.node.addDependency(storage);
    pipeline.node.addDependency(ecs);
  }
}
```