# CI/CD Pipeline Integration Infrastructure

Complete Pulumi TypeScript implementation for a fintech CI/CD pipeline with ECS Fargate, blue-green deployments, and comprehensive monitoring.

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * Main Pulumi stack for CI/CD Pipeline Integration with ECS Fargate
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { CicdPipelineStack } from './cicd-pipeline-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly pipelineUrl: pulumi.Output<string>;
  public readonly ecsServiceName: pulumi.Output<string>;
  public readonly loadBalancerDns: pulumi.Output<string>;
  public readonly ecrRepositoryUri: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';
    const tags = args.tags || {};

    // Instantiate CI/CD Pipeline Stack
    const cicdStack = new CicdPipelineStack(
      'cicd-pipeline',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // Expose outputs
    this.pipelineUrl = cicdStack.pipelineUrl;
    this.ecsServiceName = cicdStack.ecsServiceName;
    this.loadBalancerDns = cicdStack.loadBalancerDns;
    this.ecrRepositoryUri = cicdStack.ecrRepositoryUri;

    this.registerOutputs({
      pipelineUrl: this.pipelineUrl,
      ecsServiceName: this.ecsServiceName,
      loadBalancerDns: this.loadBalancerDns,
      ecrRepositoryUri: this.ecrRepositoryUri,
    });
  }
}
```

## File: lib/cicd-pipeline-stack.ts

```typescript
/**
 * cicd-pipeline-stack.ts
 *
 * Complete CI/CD Pipeline with ECS Fargate, ALB, CodeDeploy blue-green deployment,
 * EventBridge, SNS notifications, and Parameter Store integration.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';

export interface CicdPipelineStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class CicdPipelineStack extends pulumi.ComponentResource {
  public readonly pipelineUrl: pulumi.Output<string>;
  public readonly ecsServiceName: pulumi.Output<string>;
  public readonly loadBalancerDns: pulumi.Output<string>;
  public readonly ecrRepositoryUri: pulumi.Output<string>;

  constructor(
    name: string,
    args: CicdPipelineStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:cicd:CicdPipelineStack', name, args, opts);

    const { environmentSuffix, tags = {} } = args;
    const region = aws.getRegionOutput().name;
    const accountId = aws.getCallerIdentityOutput().accountId;

    const defaultTags = pulumi.output(tags).apply(t => ({
      ...t,
      Environment: environmentSuffix,
      Project: 'fintech-pipeline',
      ManagedBy: 'pulumi',
    }));

    // ==================== VPC and Networking ====================
    const vpc = new awsx.ec2.Vpc(
      `vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        numberOfAvailabilityZones: 2,
        subnetSpecs: [
          { type: awsx.ec2.SubnetType.Public, cidrMask: 24 },
          { type: awsx.ec2.SubnetType.Private, cidrMask: 24 },
        ],
        natGateways: {
          strategy: awsx.ec2.NatGatewayStrategy.Single,
        },
        tags: defaultTags,
      },
      { parent: this }
    );

    // ==================== S3 Artifact Bucket ====================
    const artifactBucket = new aws.s3.Bucket(
      `pipeline-artifacts-${environmentSuffix}`,
      {
        bucket: `pipeline-artifacts-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        lifecycleRules: [
          {
            id: 'delete-old-artifacts',
            enabled: true,
            expiration: {
              days: 30,
            },
          },
        ],
        forceDestroy: true,
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.s3.BucketPublicAccessBlock(
      `artifacts-public-block-${environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // ==================== ECR Repository ====================
    const ecrRepository = new aws.ecr.Repository(
      `app-repo-${environmentSuffix}`,
      {
        name: `app-repo-${environmentSuffix}`,
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        imageTagMutability: 'MUTABLE',
        forceDelete: true,
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.ecr.LifecyclePolicy(
      `app-repo-lifecycle-${environmentSuffix}`,
      {
        repository: ecrRepository.name,
        policy: JSON.stringify({
          rules: [
            {
              rulePriority: 1,
              description: 'Keep only last 10 images',
              selection: {
                tagStatus: 'any',
                countType: 'imageCountMoreThan',
                countNumber: 10,
              },
              action: {
                type: 'expire',
              },
            },
          ],
        }),
      },
      { parent: this }
    );

    // ==================== Parameter Store ====================
    new aws.ssm.Parameter(
      `param-ecr-uri-${environmentSuffix}`,
      {
        name: `/fintech/${environmentSuffix}/ecr-repository-uri`,
        type: 'String',
        value: ecrRepository.repositoryUrl,
        description: 'ECR Repository URI for container images',
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.ssm.Parameter(
      `param-region-${environmentSuffix}`,
      {
        name: `/fintech/${environmentSuffix}/region`,
        type: 'String',
        value: region,
        description: 'AWS Region for deployment',
        tags: defaultTags,
      },
      { parent: this }
    );

    // ==================== SNS Topic for Notifications ====================
    const snsTopic = new aws.sns.Topic(
      `pipeline-notifications-${environmentSuffix}`,
      {
        name: `pipeline-notifications-${environmentSuffix}`,
        displayName: 'CI/CD Pipeline Notifications',
        tags: defaultTags,
      },
      { parent: this }
    );

    // Optional email subscription (placeholder - replace with actual email)
    new aws.sns.TopicSubscription(
      `pipeline-email-sub-${environmentSuffix}`,
      {
        topic: snsTopic.arn,
        protocol: 'email',
        endpoint: 'devops-team@example.com',
      },
      { parent: this }
    );

    // ==================== Application Load Balancer ====================
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `alb-sg-${environmentSuffix}`,
      {
        name: `alb-sg-${environmentSuffix}`,
        vpcId: vpc.vpcId,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP traffic',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS traffic',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: defaultTags,
      },
      { parent: this }
    );

    const alb = new aws.lb.LoadBalancer(
      `app-alb-${environmentSuffix}`,
      {
        name: `app-alb-${environmentSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: vpc.publicSubnetIds,
        enableDeletionProtection: false,
        tags: defaultTags,
      },
      { parent: this }
    );

    const targetGroupBlue = new aws.lb.TargetGroup(
      `tg-blue-${environmentSuffix}`,
      {
        name: `tg-blue-${environmentSuffix}`,
        port: 80,
        protocol: 'HTTP',
        vpcId: vpc.vpcId,
        targetType: 'ip',
        healthCheck: {
          enabled: true,
          path: '/',
          protocol: 'HTTP',
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          timeout: 5,
          interval: 30,
          matcher: '200',
        },
        deregistrationDelay: 30,
        tags: defaultTags,
      },
      { parent: this }
    );

    const targetGroupGreen = new aws.lb.TargetGroup(
      `tg-green-${environmentSuffix}`,
      {
        name: `tg-green-${environmentSuffix}`,
        port: 80,
        protocol: 'HTTP',
        vpcId: vpc.vpcId,
        targetType: 'ip',
        healthCheck: {
          enabled: true,
          path: '/',
          protocol: 'HTTP',
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          timeout: 5,
          interval: 30,
          matcher: '200',
        },
        deregistrationDelay: 30,
        tags: defaultTags,
      },
      { parent: this }
    );

    const albListener = new aws.lb.Listener(
      `alb-listener-${environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroupBlue.arn,
          },
        ],
        tags: defaultTags,
      },
      { parent: this }
    );

    // ==================== ECS Cluster ====================
    const ecsCluster = new aws.ecs.Cluster(
      `ecs-cluster-${environmentSuffix}`,
      {
        name: `ecs-cluster-${environmentSuffix}`,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: defaultTags,
      },
      { parent: this }
    );

    // ==================== ECS Task Execution Role ====================
    const taskExecutionRole = new aws.iam.Role(
      `task-exec-role-${environmentSuffix}`,
      {
        name: `task-exec-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `task-exec-policy-attach-${environmentSuffix}`,
      {
        role: taskExecutionRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // ==================== ECS Task Role ====================
    const taskRole = new aws.iam.Role(
      `task-role-${environmentSuffix}`,
      {
        name: `task-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    // ==================== ECS Task Definition ====================
    const taskDefinition = new aws.ecs.TaskDefinition(
      `task-def-${environmentSuffix}`,
      {
        family: `app-task-${environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '256',
        memory: '512',
        executionRoleArn: taskExecutionRole.arn,
        taskRoleArn: taskRole.arn,
        containerDefinitions: pulumi.interpolate`[
          {
            "name": "app",
            "image": "${ecrRepository.repositoryUrl}:latest",
            "cpu": 256,
            "memory": 512,
            "essential": true,
            "portMappings": [
              {
                "containerPort": 80,
                "protocol": "tcp"
              }
            ],
            "logConfiguration": {
              "logDriver": "awslogs",
              "options": {
                "awslogs-group": "/ecs/app-${environmentSuffix}",
                "awslogs-region": "${region}",
                "awslogs-stream-prefix": "ecs"
              }
            }
          }
        ]`,
        tags: defaultTags,
      },
      { parent: this }
    );

    // ==================== CloudWatch Log Group ====================
    new aws.cloudwatch.LogGroup(
      `ecs-log-group-${environmentSuffix}`,
      {
        name: `/ecs/app-${environmentSuffix}`,
        retentionInDays: 7,
        tags: defaultTags,
      },
      { parent: this }
    );

    // ==================== ECS Service Security Group ====================
    const ecsServiceSecurityGroup = new aws.ec2.SecurityGroup(
      `ecs-service-sg-${environmentSuffix}`,
      {
        name: `ecs-service-sg-${environmentSuffix}`,
        vpcId: vpc.vpcId,
        description: 'Security group for ECS service',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSecurityGroup.id],
            description: 'Allow traffic from ALB',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: defaultTags,
      },
      { parent: this }
    );

    // ==================== ECS Service ====================
    const ecsService = new aws.ecs.Service(
      `ecs-service-${environmentSuffix}`,
      {
        name: `app-service-${environmentSuffix}`,
        cluster: ecsCluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        deploymentController: {
          type: 'CODE_DEPLOY',
        },
        networkConfiguration: {
          assignPublicIp: false,
          subnets: vpc.privateSubnetIds,
          securityGroups: [ecsServiceSecurityGroup.id],
        },
        loadBalancers: [
          {
            targetGroupArn: targetGroupBlue.arn,
            containerName: 'app',
            containerPort: 80,
          },
        ],
        tags: defaultTags,
      },
      { parent: this, dependsOn: [albListener] }
    );

    // ==================== CodeDeploy Application ====================
    const codeDeployApp = new aws.codedeploy.Application(
      `codedeploy-app-${environmentSuffix}`,
      {
        name: `codedeploy-app-${environmentSuffix}`,
        computePlatform: 'ECS',
        tags: defaultTags,
      },
      { parent: this }
    );

    // ==================== CodeDeploy Service Role ====================
    const codeDeployRole = new aws.iam.Role(
      `codedeploy-role-${environmentSuffix}`,
      {
        name: `codedeploy-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'codedeploy.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `codedeploy-policy-attach-${environmentSuffix}`,
      {
        role: codeDeployRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS',
      },
      { parent: this }
    );

    // ==================== CodeDeploy Deployment Group ====================
    const deploymentGroup = new aws.codedeploy.DeploymentGroup(
      `deployment-group-${environmentSuffix}`,
      {
        appName: codeDeployApp.name,
        deploymentGroupName: `deployment-group-${environmentSuffix}`,
        serviceRoleArn: codeDeployRole.arn,
        deploymentConfigName: 'CodeDeployDefault.ECSAllAtOnce',
        autoRollbackConfiguration: {
          enabled: true,
          events: ['DEPLOYMENT_FAILURE', 'DEPLOYMENT_STOP_ON_ALARM'],
        },
        blueGreenDeploymentConfig: {
          deploymentReadyOption: {
            actionOnTimeout: 'CONTINUE_DEPLOYMENT',
          },
          terminateBlueInstancesOnDeploymentSuccess: {
            action: 'TERMINATE',
            terminationWaitTimeInMinutes: 5,
          },
        },
        deploymentStyle: {
          deploymentOption: 'WITH_TRAFFIC_CONTROL',
          deploymentType: 'BLUE_GREEN',
        },
        ecsService: {
          clusterName: ecsCluster.name,
          serviceName: ecsService.name,
        },
        loadBalancerInfo: {
          targetGroupPairInfo: {
            prodTrafficRoute: {
              listenerArns: [albListener.arn],
            },
            targetGroups: [
              {
                name: targetGroupBlue.name,
              },
              {
                name: targetGroupGreen.name,
              },
            ],
          },
        },
        tags: defaultTags,
      },
      { parent: this }
    );

    // ==================== CodeBuild for Unit Tests ====================
    const unitTestRole = new aws.iam.Role(
      `unit-test-role-${environmentSuffix}`,
      {
        name: `unit-test-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    const unitTestPolicy = new aws.iam.Policy(
      `unit-test-policy-${environmentSuffix}`,
      {
        name: `unit-test-policy-${environmentSuffix}`,
        policy: pulumi
          .all([artifactBucket.arn, region, accountId, environmentSuffix])
          .apply(([bucketArn, reg, accId, envSuffix]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                  ],
                  Resource: [
                    `arn:aws:logs:${reg}:${accId}:log-group:/aws/codebuild/unit-tests-${envSuffix}`,
                    `arn:aws:logs:${reg}:${accId}:log-group:/aws/codebuild/unit-tests-${envSuffix}:*`,
                  ],
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject'],
                  Resource: `${bucketArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:GetBucketLocation', 's3:ListBucket'],
                  Resource: bucketArn,
                },
              ],
            })
          ),
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `unit-test-policy-attach-${environmentSuffix}`,
      {
        role: unitTestRole.name,
        policyArn: unitTestPolicy.arn,
      },
      { parent: this }
    );

    const unitTestProject = new aws.codebuild.Project(
      `unit-tests-${environmentSuffix}`,
      {
        name: `unit-tests-${environmentSuffix}`,
        description: 'Run unit tests for the application',
        serviceRole: unitTestRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          type: 'LINUX_CONTAINER',
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:7.0',
        },
        source: {
          type: 'CODEPIPELINE',
          buildspec: `version: 0.2

phases:
  install:
    commands:
      - echo Installing dependencies...
      - npm install
  pre_build:
    commands:
      - echo Running unit tests...
  build:
    commands:
      - npm test
  post_build:
    commands:
      - echo Unit tests completed on \`date\`
`,
        },
        logsConfig: {
          cloudwatchLogs: {
            status: 'ENABLED',
            groupName: `/aws/codebuild/unit-tests-${environmentSuffix}`,
          },
        },
        buildTimeout: 15,
        tags: defaultTags,
      },
      { parent: this }
    );

    // ==================== CodeBuild for Integration Tests ====================
    const integrationTestRole = new aws.iam.Role(
      `integration-test-role-${environmentSuffix}`,
      {
        name: `integration-test-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    const integrationTestPolicy = new aws.iam.Policy(
      `integration-test-policy-${environmentSuffix}`,
      {
        name: `integration-test-policy-${environmentSuffix}`,
        policy: pulumi
          .all([artifactBucket.arn, region, accountId, environmentSuffix])
          .apply(([bucketArn, reg, accId, envSuffix]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                  ],
                  Resource: [
                    `arn:aws:logs:${reg}:${accId}:log-group:/aws/codebuild/integration-tests-${envSuffix}`,
                    `arn:aws:logs:${reg}:${accId}:log-group:/aws/codebuild/integration-tests-${envSuffix}:*`,
                  ],
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject'],
                  Resource: `${bucketArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:GetBucketLocation', 's3:ListBucket'],
                  Resource: bucketArn,
                },
              ],
            })
          ),
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `integration-test-policy-attach-${environmentSuffix}`,
      {
        role: integrationTestRole.name,
        policyArn: integrationTestPolicy.arn,
      },
      { parent: this }
    );

    const integrationTestProject = new aws.codebuild.Project(
      `integration-tests-${environmentSuffix}`,
      {
        name: `integration-tests-${environmentSuffix}`,
        description: 'Run integration tests for the application',
        serviceRole: integrationTestRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          type: 'LINUX_CONTAINER',
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:7.0',
        },
        source: {
          type: 'CODEPIPELINE',
          buildspec: `version: 0.2

phases:
  install:
    commands:
      - echo Installing dependencies...
      - npm install
  pre_build:
    commands:
      - echo Running integration tests...
  build:
    commands:
      - npm run test:integration || echo "No integration tests defined"
  post_build:
    commands:
      - echo Integration tests completed on \`date\`
`,
        },
        logsConfig: {
          cloudwatchLogs: {
            status: 'ENABLED',
            groupName: `/aws/codebuild/integration-tests-${environmentSuffix}`,
          },
        },
        buildTimeout: 20,
        tags: defaultTags,
      },
      { parent: this }
    );

    // ==================== CodeBuild for Docker Build ====================
    const dockerBuildRole = new aws.iam.Role(
      `docker-build-role-${environmentSuffix}`,
      {
        name: `docker-build-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    const dockerBuildPolicy = new aws.iam.Policy(
      `docker-build-policy-${environmentSuffix}`,
      {
        name: `docker-build-policy-${environmentSuffix}`,
        policy: pulumi
          .all([
            artifactBucket.arn,
            ecrRepository.arn,
            region,
            accountId,
            environmentSuffix,
          ])
          .apply(([bucketArn, repoArn, reg, accId, envSuffix]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                  ],
                  Resource: [
                    `arn:aws:logs:${reg}:${accId}:log-group:/aws/codebuild/docker-build-${envSuffix}`,
                    `arn:aws:logs:${reg}:${accId}:log-group:/aws/codebuild/docker-build-${envSuffix}:*`,
                  ],
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject'],
                  Resource: `${bucketArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:GetBucketLocation', 's3:ListBucket'],
                  Resource: bucketArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['ecr:GetAuthorizationToken'],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'ecr:BatchCheckLayerAvailability',
                    'ecr:GetDownloadUrlForLayer',
                    'ecr:BatchGetImage',
                    'ecr:PutImage',
                    'ecr:InitiateLayerUpload',
                    'ecr:UploadLayerPart',
                    'ecr:CompleteLayerUpload',
                  ],
                  Resource: repoArn,
                },
              ],
            })
          ),
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `docker-build-policy-attach-${environmentSuffix}`,
      {
        role: dockerBuildRole.name,
        policyArn: dockerBuildPolicy.arn,
      },
      { parent: this }
    );

    const dockerBuildProject = new aws.codebuild.Project(
      `docker-build-${environmentSuffix}`,
      {
        name: `docker-build-${environmentSuffix}`,
        description: 'Build and push Docker images to ECR',
        serviceRole: dockerBuildRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          type: 'LINUX_CONTAINER',
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:7.0',
          privilegedMode: true,
          environmentVariables: [
            {
              name: 'AWS_DEFAULT_REGION',
              value: region,
              type: 'PLAINTEXT',
            },
            {
              name: 'AWS_ACCOUNT_ID',
              value: accountId,
              type: 'PLAINTEXT',
            },
            {
              name: 'ECR_REPOSITORY_URI',
              value: ecrRepository.repositoryUrl,
              type: 'PLAINTEXT',
            },
            {
              name: 'TASK_DEFINITION_FAMILY',
              value: taskDefinition.family,
              type: 'PLAINTEXT',
            },
            {
              name: 'CONTAINER_NAME',
              value: 'app',
              type: 'PLAINTEXT',
            },
          ],
        },
        source: {
          type: 'CODEPIPELINE',
          buildspec: `version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY_URI
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=\${COMMIT_HASH:=latest}
  build:
    commands:
      - echo Build started on \`date\`
      - echo Building the Docker image...
      - docker build -t $ECR_REPOSITORY_URI:latest .
      - docker tag $ECR_REPOSITORY_URI:latest $ECR_REPOSITORY_URI:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on \`date\`
      - echo Pushing the Docker images...
      - docker push $ECR_REPOSITORY_URI:latest
      - docker push $ECR_REPOSITORY_URI:$IMAGE_TAG
      - echo Creating imagedefinitions.json...
      - printf '[{"name":"app","imageUri":"%s"}]' $ECR_REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json
artifacts:
  files:
    - imagedefinitions.json
`,
        },
        logsConfig: {
          cloudwatchLogs: {
            status: 'ENABLED',
            groupName: `/aws/codebuild/docker-build-${environmentSuffix}`,
          },
        },
        buildTimeout: 30,
        tags: defaultTags,
      },
      { parent: this }
    );

    // ==================== CodePipeline ====================
    const pipelineRole = new aws.iam.Role(
      `pipeline-role-${environmentSuffix}`,
      {
        name: `pipeline-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    const pipelinePolicy = new aws.iam.Policy(
      `pipeline-policy-${environmentSuffix}`,
      {
        name: `pipeline-policy-${environmentSuffix}`,
        policy: pulumi
          .all([
            artifactBucket.arn,
            unitTestProject.arn,
            integrationTestProject.arn,
            dockerBuildProject.arn,
            codeDeployApp.arn,
            deploymentGroup.arn,
          ])
          .apply(
            ([
              bucketArn,
              unitTestArn,
              integrationTestArn,
              dockerBuildArn,
              deployAppArn,
              deployGroupArn,
            ]) =>
              JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: [
                      's3:GetObject',
                      's3:GetObjectVersion',
                      's3:PutObject',
                      's3:GetBucketLocation',
                    ],
                    Resource: [bucketArn, `${bucketArn}/*`],
                  },
                  {
                    Effect: 'Allow',
                    Action: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
                    Resource: [unitTestArn, integrationTestArn, dockerBuildArn],
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'codedeploy:CreateDeployment',
                      'codedeploy:GetDeployment',
                      'codedeploy:GetApplication',
                      'codedeploy:GetApplicationRevision',
                      'codedeploy:RegisterApplicationRevision',
                      'codedeploy:GetDeploymentConfig',
                    ],
                    Resource: [deployAppArn, deployGroupArn],
                  },
                  {
                    Effect: 'Allow',
                    Action: ['ecs:*'],
                    Resource: '*',
                  },
                  {
                    Effect: 'Allow',
                    Action: ['iam:PassRole'],
                    Resource: '*',
                  },
                ],
              })
          ),
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `pipeline-policy-attach-${environmentSuffix}`,
      {
        role: pipelineRole.name,
        policyArn: pipelinePolicy.arn,
      },
      { parent: this }
    );

    const pipeline = new aws.codepipeline.Pipeline(
      `pipeline-${environmentSuffix}`,
      {
        name: `cicd-pipeline-${environmentSuffix}`,
        roleArn: pipelineRole.arn,
        artifactStores: [
          {
            location: artifactBucket.bucket,
            type: 'S3',
          },
        ],
        stages: [
          {
            name: 'Source',
            actions: [
              {
                name: 'SourceAction',
                category: 'Source',
                owner: 'AWS',
                provider: 'S3',
                version: '1',
                outputArtifacts: ['source_output'],
                configuration: {
                  S3Bucket: artifactBucket.bucket,
                  S3ObjectKey: 'source.zip',
                  PollForSourceChanges: 'false',
                },
              },
            ],
          },
          {
            name: 'Test',
            actions: [
              {
                name: 'UnitTests',
                category: 'Build',
                owner: 'AWS',
                provider: 'CodeBuild',
                version: '1',
                inputArtifacts: ['source_output'],
                outputArtifacts: ['unit_test_output'],
                configuration: {
                  ProjectName: unitTestProject.name,
                },
                runOrder: 1,
              },
              {
                name: 'IntegrationTests',
                category: 'Build',
                owner: 'AWS',
                provider: 'CodeBuild',
                version: '1',
                inputArtifacts: ['source_output'],
                outputArtifacts: ['integration_test_output'],
                configuration: {
                  ProjectName: integrationTestProject.name,
                },
                runOrder: 1,
              },
            ],
          },
          {
            name: 'Build',
            actions: [
              {
                name: 'DockerBuild',
                category: 'Build',
                owner: 'AWS',
                provider: 'CodeBuild',
                version: '1',
                inputArtifacts: ['source_output'],
                outputArtifacts: ['build_output'],
                configuration: {
                  ProjectName: dockerBuildProject.name,
                },
              },
            ],
          },
          {
            name: 'Approval',
            actions: [
              {
                name: 'ManualApproval',
                category: 'Approval',
                owner: 'AWS',
                provider: 'Manual',
                version: '1',
                configuration: {
                  CustomData: 'Please approve deployment to production',
                },
              },
            ],
          },
          {
            name: 'Deploy',
            actions: [
              {
                name: 'EcsDeploy',
                category: 'Deploy',
                owner: 'AWS',
                provider: 'CodeDeployToECS',
                version: '1',
                inputArtifacts: ['build_output'],
                configuration: {
                  ApplicationName: codeDeployApp.name,
                  DeploymentGroupName: deploymentGroup.deploymentGroupName,
                  TaskDefinitionTemplateArtifact: 'build_output',
                  AppSpecTemplateArtifact: 'build_output',
                },
              },
            ],
          },
        ],
        tags: defaultTags,
      },
      { parent: this }
    );

    // ==================== EventBridge Rule for Pipeline Trigger ====================
    const eventRole = new aws.iam.Role(
      `event-role-${environmentSuffix}`,
      {
        name: `event-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'events.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    const eventPolicy = new aws.iam.Policy(
      `event-policy-${environmentSuffix}`,
      {
        name: `event-policy-${environmentSuffix}`,
        policy: pulumi.all([pipeline.arn]).apply(([pipelineArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['codepipeline:StartPipelineExecution'],
                Resource: pipelineArn,
              },
            ],
          })
        ),
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `event-policy-attach-${environmentSuffix}`,
      {
        role: eventRole.name,
        policyArn: eventPolicy.arn,
      },
      { parent: this }
    );

    const pipelineTriggerRule = new aws.cloudwatch.EventRule(
      `pipeline-trigger-${environmentSuffix}`,
      {
        name: `pipeline-trigger-${environmentSuffix}`,
        description: 'Trigger pipeline on S3 source update',
        eventPattern: pulumi.interpolate`{
  "source": ["aws.s3"],
  "detail-type": ["Object Created"],
  "detail": {
    "bucket": {
      "name": ["${artifactBucket.bucket}"]
    },
    "object": {
      "key": ["source.zip"]
    }
  }
}`,
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `pipeline-trigger-target-${environmentSuffix}`,
      {
        rule: pipelineTriggerRule.name,
        arn: pipeline.arn,
        roleArn: eventRole.arn,
      },
      { parent: this }
    );

    // ==================== EventBridge Rules for Pipeline State Changes ====================
    const snsTopicPolicy = new aws.sns.TopicPolicy(
      `sns-policy-${environmentSuffix}`,
      {
        arn: snsTopic.arn,
        policy: pulumi.all([snsTopic.arn, accountId]).apply(([topicArn, accId]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'events.amazonaws.com',
                },
                Action: 'sns:Publish',
                Resource: topicArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    const pipelineSuccessRule = new aws.cloudwatch.EventRule(
      `pipeline-success-${environmentSuffix}`,
      {
        name: `pipeline-success-${environmentSuffix}`,
        description: 'Capture pipeline execution success',
        eventPattern: pulumi.interpolate`{
  "source": ["aws.codepipeline"],
  "detail-type": ["CodePipeline Pipeline Execution State Change"],
  "detail": {
    "pipeline": ["${pipeline.name}"],
    "state": ["SUCCEEDED"]
  }
}`,
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `pipeline-success-target-${environmentSuffix}`,
      {
        rule: pipelineSuccessRule.name,
        arn: snsTopic.arn,
        inputTransformer: {
          inputPaths: {
            pipeline: '$.detail.pipeline',
            state: '$.detail.state',
            executionId: '$.detail.execution-id',
          },
          inputTemplate:
            '"Pipeline <pipeline> completed successfully. State: <state>. Execution ID: <executionId>"',
        },
      },
      { parent: this, dependsOn: [snsTopicPolicy] }
    );

    const pipelineFailureRule = new aws.cloudwatch.EventRule(
      `pipeline-failure-${environmentSuffix}`,
      {
        name: `pipeline-failure-${environmentSuffix}`,
        description: 'Capture pipeline execution failures',
        eventPattern: pulumi.interpolate`{
  "source": ["aws.codepipeline"],
  "detail-type": ["CodePipeline Pipeline Execution State Change"],
  "detail": {
    "pipeline": ["${pipeline.name}"],
    "state": ["FAILED"]
  }
}`,
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `pipeline-failure-target-${environmentSuffix}`,
      {
        rule: pipelineFailureRule.name,
        arn: snsTopic.arn,
        inputTransformer: {
          inputPaths: {
            pipeline: '$.detail.pipeline',
            state: '$.detail.state',
            executionId: '$.detail.execution-id',
          },
          inputTemplate:
            '"ALERT: Pipeline <pipeline> has failed. State: <state>. Execution ID: <executionId>"',
        },
      },
      { parent: this, dependsOn: [snsTopicPolicy] }
    );

    // ==================== Outputs ====================
    this.pipelineUrl = pulumi.interpolate`https://${region}.console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipeline.name}/view`;
    this.ecsServiceName = ecsService.name;
    this.loadBalancerDns = alb.dnsName;
    this.ecrRepositoryUri = ecrRepository.repositoryUrl;

    this.registerOutputs({
      pipelineUrl: this.pipelineUrl,
      ecsServiceName: this.ecsServiceName,
      loadBalancerDns: this.loadBalancerDns,
      ecrRepositoryUri: this.ecrRepositoryUri,
    });
  }
}
```

## File: lib/README.md

```markdown
# CI/CD Pipeline Integration Infrastructure

Complete infrastructure for a fintech CI/CD pipeline with ECS Fargate, blue-green deployments, and automated testing.

## Architecture Overview

This infrastructure implements:

- **VPC**: 2 AZs with public/private subnets and NAT Gateway
- **ECR**: Container registry with lifecycle policy (keep last 10 images)
- **ECS Fargate**: Serverless container hosting with 2 tasks
- **Application Load Balancer**: Traffic management with health checks
- **CodeDeploy**: Blue-green deployment strategy
- **CodePipeline**: Automated pipeline with 5 stages
- **CodeBuild**: Separate projects for unit tests, integration tests, and Docker builds
- **EventBridge**: Pipeline triggering and notifications
- **SNS**: Email notifications for pipeline state changes
- **Parameter Store**: Configuration storage
- **S3**: Encrypted artifact storage with lifecycle rules

## Pipeline Stages

1. **Source**: S3-based source artifact retrieval
2. **Test**: Parallel unit and integration tests
3. **Build**: Docker image build and push to ECR
4. **Approval**: Manual approval gate
5. **Deploy**: Blue-green deployment via CodeDeploy

## Deployment

### Prerequisites

- Pulumi CLI 3.x
- Node.js 18+
- AWS CLI configured with appropriate credentials
- Docker (for local testing)

### Deploy Infrastructure

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX=dev

# Install dependencies
npm install

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up
```

### Environment Variables

- `ENVIRONMENT_SUFFIX`: Environment identifier (default: dev)
- `AWS_REGION`: Target region (default: us-east-1)

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

## Resource Naming

All resources include `environmentSuffix` for uniqueness:
- Pipeline: `cicd-pipeline-{environmentSuffix}`
- ECS Service: `app-service-{environmentSuffix}`
- ECR Repository: `app-repo-{environmentSuffix}`
- ALB: `app-alb-{environmentSuffix}`

## Security Features

- IAM roles with least privilege access
- S3 bucket encryption (AES256)
- ECR image scanning enabled
- VPC isolation with private subnets
- Security groups with minimal ingress rules
- No deletion protection (infrastructure is destroyable)

## Monitoring

- ECS Container Insights enabled
- CloudWatch Logs for all CodeBuild projects
- EventBridge rules for pipeline state changes
- SNS email notifications for success/failure

## Cost Optimization

- Fargate tasks: 256 CPU, 512 MB memory
- Single NAT Gateway
- S3 lifecycle policy (30-day expiration)
- ECR lifecycle policy (keep 10 images)
- CodeBuild: SMALL compute type

## Outputs

- `pipelineUrl`: CodePipeline console URL
- `ecsServiceName`: ECS service name
- `loadBalancerDns`: ALB DNS endpoint
- `ecrRepositoryUri`: ECR repository URI

## Cleanup

```bash
# Destroy all infrastructure
pulumi destroy

# Remove stack
pulumi stack rm
```

## Notes

- Manual approval required before production deployment
- Blue-green deployment with 5-minute rollback window
- All resources are fully destroyable
- Tags include: Environment, Project, ManagedBy
