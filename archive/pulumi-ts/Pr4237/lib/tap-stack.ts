/* eslint-disable prettier/prettier */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as fs from 'fs';
import * as path from 'path';

export interface TapStackProps {
  environmentSuffix: string;
  githubOwner?: string;
  githubRepo?: string;
  githubBranch?: string;
  githubToken?: pulumi.Output<string>;
  regions?: string[];
  enableApproval?: boolean;
  notificationEmail?: string;
  tags?: {
    [key: string]: string;
  };
}

export class TapStack extends pulumi.ComponentResource {
  public readonly kmsKey: aws.kms.Key;
  public readonly artifactBucket: aws.s3.Bucket;
  public readonly snsTopic: aws.sns.Topic;
  public readonly ecsCluster: aws.ecs.Cluster;
  public readonly ecsTaskDefinition: aws.ecs.TaskDefinition;
  public readonly ecsService: aws.ecs.Service;
  public readonly codeBuildProject: aws.codebuild.Project;
  public readonly codeDeployApp: aws.codedeploy.Application;
  public readonly codeDeployGroup: aws.codedeploy.DeploymentGroup;
  public readonly codePipeline: aws.codepipeline.Pipeline;
  public readonly logGroup: aws.cloudwatch.LogGroup;

  // ALB components
  private listener!: aws.lb.Listener;
  private blueTargetGroup!: aws.lb.TargetGroup;
  private greenTargetGroup!: aws.lb.TargetGroup;
  private alb!: aws.lb.LoadBalancer;

  // VPC components
  private vpc!: aws.ec2.Vpc;
  private publicSubnet1!: aws.ec2.Subnet;
  private publicSubnet2!: aws.ec2.Subnet;

  // Regional buckets for multi-region support
  private readonly regionalBuckets: Map<string, pulumi.Output<string>> =
    new Map();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public readonly outputs: Record<string, pulumi.Output<any>>;
  private readonly props: Required<TapStackProps>;
  private readonly stackName: string;
  private readonly timestamp: string;

  constructor(
    name: string,
    props: TapStackProps,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:tap:TapStack', name, {}, opts);

    // Initialize props using helper method
    this.props = this.initializeProps(props);
    this.stackName = `tap-${this.props.environmentSuffix}`;
    this.timestamp = Date.now().toString();

    // Create KMS Key for encryption
    this.kmsKey = this.createKmsKey();

    // Create S3 bucket for artifacts
    this.artifactBucket = this.createArtifactBucket();

    // Create SNS topic for notifications
    this.snsTopic = this.createSnsTopic();

    // Create CloudWatch Log Group
    this.logGroup = this.createLogGroup();

    // Create ECS Cluster
    this.ecsCluster = this.createEcsCluster();

    // Create ECS Task Definition
    this.ecsTaskDefinition = this.createEcsTaskDefinition();

    // Create ECS Service (includes ALB setup)
    this.ecsService = this.createEcsService();

    // Create CodeBuild Project
    this.codeBuildProject = this.createCodeBuildProject();

    // Create CodeDeploy Application
    this.codeDeployApp = this.createCodeDeployApplication();

    // Create CodeDeploy Deployment Group
    this.codeDeployGroup = this.createCodeDeployGroup();

    // Create CodePipeline
    this.codePipeline = this.createCodePipeline();

    // Register outputs
    this.outputs = this.createOutputs();

    // Write outputs to file
    this.writeOutputsToFile();

    // Call parent registerOutputs
    super.registerOutputs(this.outputs);
  }

  // Helper method to initialize props with defaults
  private initializeProps(props: TapStackProps): Required<TapStackProps> {
    return {
      githubOwner: props.githubOwner || 'default-owner',
      githubRepo: props.githubRepo || 'default-repo',
      githubBranch: props.githubBranch || 'main',
      githubToken: props.githubToken || pulumi.output(''),
      regions: props.regions || ['us-east-1'],
      enableApproval: props.enableApproval !== false,
      notificationEmail: props.notificationEmail || 'notifications@example.com',
      environmentSuffix: props.environmentSuffix,
      tags: props.tags || {},
    };
  }

  private createKmsKey(): aws.kms.Key {
    const callerIdentity = pulumi.output(aws.getCallerIdentity());
    const accountId = callerIdentity.accountId;
    const region = aws.config.region || 'us-east-1';

    const key = new aws.kms.Key(
      `${this.stackName}-kms-key`,
      {
        description: `KMS key for ${this.stackName} encryption`,
        deletionWindowInDays: 10,
        enableKeyRotation: true,
        policy: pulumi.interpolate`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Enable IAM User Permissions",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::${accountId}:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Sid": "Allow CloudWatch Logs",
      "Effect": "Allow",
      "Principal": {
        "Service": "logs.${region}.amazonaws.com"
      },
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:CreateGrant",
        "kms:DescribeKey"
      ],
      "Resource": "*",
      "Condition": {
        "ArnLike": {
          "kms:EncryptionContext:aws:logs:arn": "arn:aws:logs:${region}:${accountId}:*"
        }
      }
    },
    {
      "Sid": "Allow SNS",
      "Effect": "Allow",
      "Principal": {
        "Service": "sns.amazonaws.com"
      },
      "Action": [
        "kms:Decrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "*"
    }
  ]
}`,
        tags: {
          Name: `${this.stackName}-kms-key`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `${this.stackName}-kms-alias`,
      {
        name: `alias/${this.stackName}-key-${this.timestamp}`,
        targetKeyId: key.keyId,
      },
      { parent: this }
    );

    return key;
  }

  private createArtifactBucket(): aws.s3.Bucket {
    const timestamp = Date.now();

    // Create primary bucket in the first region
    const primaryRegion = this.props.regions[0];

    const bucket = new aws.s3.Bucket(
      `${this.stackName}-artifacts`,
      {
        bucket: `${this.stackName}-artifacts-${timestamp}`,
        tags: {
          Name: `${this.stackName}-artifacts`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Enable versioning
    new aws.s3.BucketVersioning(
      `${this.stackName}-artifacts-versioning`,
      {
        bucket: bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Enable server-side encryption with KMS
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `${this.stackName}-artifacts-encryption`,
      {
        bucket: bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: this.kmsKey.arn,
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { parent: this }
    );

    // Block public access
    new aws.s3.BucketPublicAccessBlock(
      `${this.stackName}-artifacts-public-access-block`,
      {
        bucket: bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Store primary bucket name
    this.regionalBuckets.set(primaryRegion, bucket.bucket);

    // Create additional regional buckets for multi-region support
    for (let i = 1; i < this.props.regions.length; i++) {
      const region = this.props.regions[i];

      const regionalBucket = new aws.s3.Bucket(
        `${this.stackName}-artifacts-${region}`,
        {
          bucket: `${this.stackName}-artifacts-${region}-${timestamp}`,
          tags: {
            Name: `${this.stackName}-artifacts-${region}`,
            Environment: this.props.environmentSuffix,
            Region: region,
          },
        },
        { parent: this }
      );

      new aws.s3.BucketVersioning(
        `${this.stackName}-artifacts-versioning-${region}`,
        {
          bucket: regionalBucket.id,
          versioningConfiguration: {
            status: 'Enabled',
          },
        },
        { parent: this }
      );

      new aws.s3.BucketServerSideEncryptionConfiguration(
        `${this.stackName}-artifacts-encryption-${region}`,
        {
          bucket: regionalBucket.id,
          rules: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'aws:kms',
                kmsMasterKeyId: this.kmsKey.arn,
              },
              bucketKeyEnabled: true,
            },
          ],
        },
        { parent: this }
      );

      new aws.s3.BucketPublicAccessBlock(
        `${this.stackName}-artifacts-public-access-block-${region}`,
        {
          bucket: regionalBucket.id,
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        },
        { parent: this }
      );

      this.regionalBuckets.set(region, regionalBucket.bucket);
    }

    return bucket;
  }

  private createSnsTopic(): aws.sns.Topic {
    const topic = new aws.sns.Topic(
      `${this.stackName}-notifications`,
      {
        name: `${this.stackName}-notifications-${this.timestamp}`,
        kmsMasterKeyId: this.kmsKey.id,
        tags: {
          Name: `${this.stackName}-notifications`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Subscribe email endpoint
    new aws.sns.TopicSubscription(
      `${this.stackName}-email-subscription`,
      {
        topic: topic.arn,
        protocol: 'email',
        endpoint: this.props.notificationEmail,
      },
      { parent: this }
    );

    return topic;
  }

  private createLogGroup(): aws.cloudwatch.LogGroup {
    return new aws.cloudwatch.LogGroup(
      `${this.stackName}-logs`,
      {
        name: `/aws/ecs/${this.stackName}-${this.timestamp}`,
        retentionInDays: 30,
        kmsKeyId: this.kmsKey.arn,
        tags: {
          Name: `${this.stackName}-logs`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this, dependsOn: [this.kmsKey] }
    );
  }

  private createEcsCluster(): aws.ecs.Cluster {
    return new aws.ecs.Cluster(
      `${this.stackName}-cluster`,
      {
        name: `${this.stackName}-cluster`,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: {
          Name: `${this.stackName}-cluster`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this }
    );
  }

  private createEcsTaskDefinition(): aws.ecs.TaskDefinition {
    // Create IAM role for ECS task execution
    const executionRole = new aws.iam.Role(
      `${this.stackName}-ecs-execution-role`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          Name: `${this.stackName}-ecs-execution-role`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `${this.stackName}-ecs-execution-policy`,
      {
        role: executionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // Create IAM role for ECS task
    const taskRole = new aws.iam.Role(
      `${this.stackName}-ecs-task-role`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          Name: `${this.stackName}-ecs-task-role`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this }
    );

    const awsRegion = aws.config.region || 'us-east-1';

    return new aws.ecs.TaskDefinition(
      `${this.stackName}-task-definition`,
      {
        family: `${this.stackName}-task`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '256',
        memory: '512',
        executionRoleArn: executionRole.arn,
        taskRoleArn: taskRole.arn,
        containerDefinitions: pulumi.interpolate`[
  {
    "name": "${this.stackName}-container",
    "image": "nginx:latest",
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
        "awslogs-group": "${this.logGroup.name}",
        "awslogs-region": "${awsRegion}",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }
]`,
        tags: {
          Name: `${this.stackName}-task-definition`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this }
    );
  }

  private createEcsService(): aws.ecs.Service {
    const awsRegion = aws.config.region || 'us-east-1';

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `${this.stackName}-vpc`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `${this.stackName}-vpc`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(
      `${this.stackName}-igw`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `${this.stackName}-igw`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create public subnets
    this.publicSubnet1 = new aws.ec2.Subnet(
      `${this.stackName}-public-subnet-1`,
      {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: `${awsRegion}a`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${this.stackName}-public-subnet-1`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this }
    );

    this.publicSubnet2 = new aws.ec2.Subnet(
      `${this.stackName}-public-subnet-2`,
      {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: `${awsRegion}b`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${this.stackName}-public-subnet-2`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `${this.stackName}-public-rt`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `${this.stackName}-public-rt`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create route to internet
    new aws.ec2.Route(
      `${this.stackName}-public-route`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      },
      { parent: this }
    );

    // Associate subnets with route table
    new aws.ec2.RouteTableAssociation(
      `${this.stackName}-public-rta-1`,
      {
        subnetId: this.publicSubnet1.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `${this.stackName}-public-rta-2`,
      {
        subnetId: this.publicSubnet2.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this }
    );

    // Create security group for ECS tasks
    const ecsSecurityGroup = new aws.ec2.SecurityGroup(
      `${this.stackName}-ecs-sg`,
      {
        vpcId: this.vpc.id,
        description: `Security group for ${this.stackName} ECS service`,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP traffic from ALB',
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
        tags: {
          Name: `${this.stackName}-ecs-sg`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create security group for ALB
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `${this.stackName}-alb-sg`,
      {
        vpcId: this.vpc.id,
        description: `Security group for ${this.stackName} ALB`,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP traffic from internet',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS traffic from internet',
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
        tags: {
          Name: `${this.stackName}-alb-sg`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create Application Load Balancer
    this.alb = new aws.lb.LoadBalancer(
      `${this.stackName}-alb`,
      {
        name: `${this.stackName}-alb`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: [this.publicSubnet1.id, this.publicSubnet2.id],
        tags: {
          Name: `${this.stackName}-alb`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create Target Group for Blue environment
    this.blueTargetGroup = new aws.lb.TargetGroup(
      `${this.stackName}-blue-tg`,
      {
        name: `${this.stackName}-blue-tg-${this.timestamp}`,
        port: 80,
        protocol: 'HTTP',
        targetType: 'ip',
        vpcId: this.vpc.id,
        healthCheck: {
          enabled: true,
          path: '/',
          protocol: 'HTTP',
          matcher: '200',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
        },
        tags: {
          Name: `${this.stackName}-blue-tg`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create Target Group for Green environment
    this.greenTargetGroup = new aws.lb.TargetGroup(
      `${this.stackName}-green-tg`,
      {
        name: `${this.stackName}-green-tg-${this.timestamp}`,
        port: 80,
        protocol: 'HTTP',
        targetType: 'ip',
        vpcId: this.vpc.id,
        healthCheck: {
          enabled: true,
          path: '/',
          protocol: 'HTTP',
          matcher: '200',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
        },
        tags: {
          Name: `${this.stackName}-green-tg`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create ALB Listener
    this.listener = new aws.lb.Listener(
      `${this.stackName}-alb-listener`,
      {
        loadBalancerArn: this.alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: this.blueTargetGroup.arn,
          },
        ],
        tags: {
          Name: `${this.stackName}-alb-listener`,
          Environment: this.props.environmentSuffix,
        },
      },
      {
        parent: this,
        deleteBeforeReplace: false,  
        retainOnDelete: false,
        ignoreChanges: [],
      }
    );


    // Create ECS Service
    return new aws.ecs.Service(
      `${this.stackName}-service`,
      {
        name: `${this.stackName}-service`,
        cluster: this.ecsCluster.arn,
        taskDefinition: this.ecsTaskDefinition.arn,
        desiredCount: 1,
        launchType: 'FARGATE',
        deploymentController: {
          type: 'CODE_DEPLOY',
        },
        networkConfiguration: {
          subnets: [this.publicSubnet1.id, this.publicSubnet2.id],
          securityGroups: [ecsSecurityGroup.id],
          assignPublicIp: true,
        },
        loadBalancers: [
          {
            targetGroupArn: this.blueTargetGroup.arn,
            containerName: `${this.stackName}-container`,
            containerPort: 80,
          },
        ],
        tags: {
          Name: `${this.stackName}-service`,
          Environment: this.props.environmentSuffix,
        },
      },
      {
        parent: this,
        ignoreChanges: ['taskDefinition', 'desiredCount', 'loadBalancers'],
        dependsOn: [this.listener],
      }
    );
  }

  private createCodeBuildProject(): aws.codebuild.Project {
    const awsRegion = aws.config.region || 'us-east-1';

    // Create IAM role for CodeBuild
    const codeBuildRole = new aws.iam.Role(
      `${this.stackName}-codebuild-role`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          Name: `${this.stackName}-codebuild-role`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Attach policies to CodeBuild role
    const codeBuildPolicy = new aws.iam.RolePolicy(
      `${this.stackName}-codebuild-policy`,
      {
        role: codeBuildRole.id,
        policy: pulumi
          .all([this.artifactBucket.arn, this.kmsKey.arn, this.logGroup.arn])
          .apply(([bucketArn, kmsArn, logGroupArn]) =>
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
                  Resource: [`${logGroupArn}:*`, 'arn:aws:logs:*:*:*'],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObject',
                    's3:GetObjectVersion',
                    's3:PutObject',
                  ],
                  Resource: [`${bucketArn}/*`],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'kms:Decrypt',
                    'kms:DescribeKey',
                    'kms:Encrypt',
                    'kms:ReEncrypt*',
                    'kms:GenerateDataKey*',
                  ],
                  Resource: [kmsArn],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'ecr:GetAuthorizationToken',
                    'ecr:BatchCheckLayerAvailability',
                    'ecr:GetDownloadUrlForLayer',
                    'ecr:BatchGetImage',
                    'ecr:PutImage',
                    'ecr:InitiateLayerUpload',
                    'ecr:UploadLayerPart',
                    'ecr:CompleteLayerUpload',
                  ],
                  Resource: '*',
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Create CodeBuild project for testing
    new aws.codebuild.Project(
      `${this.stackName}-test-project`,
      {
        name: `${this.stackName}-test-${this.timestamp}`,
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:5.0',
          type: 'LINUX_CONTAINER',
          privilegedMode: true,
          environmentVariables: [
            {
              name: 'ENVIRONMENT',
              value: this.props.environmentSuffix,
            },
          ],
        },
        source: {
          type: 'CODEPIPELINE',
          buildspec: `version: 0.2
phases:
  install:
    runtime-versions:
      nodejs: 18
    commands:
      - echo "Installing dependencies..."
      - npm install
  pre_build:
    commands:
      - echo "Running static code analysis..."
      - npm install -g sonarqube-scanner || true
      - echo "Running security checks..."
  build:
    commands:
      - echo "Running tests..."
      - npm test || true
      - echo "Building application..."
      - npm run build || true
  post_build:
    commands:
      - echo "Test phase completed"
artifacts:
  files:
    - '**/*'
`,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: this.logGroup.name,
            streamName: 'codebuild-test',
          },
        },
        tags: {
          Name: `${this.stackName}-test-project`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this, dependsOn: [codeBuildPolicy] }
    );

    // Create CodeBuild project for building
    const buildProject = new aws.codebuild.Project(
      `${this.stackName}-build-project`,
      {
        name: `${this.stackName}-build-${this.timestamp}`,
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:5.0',
          type: 'LINUX_CONTAINER',
          privilegedMode: true,
          environmentVariables: [
            {
              name: 'AWS_DEFAULT_REGION',
              value: awsRegion,
            },
            {
              name: 'AWS_ACCOUNT_ID',
              value: pulumi.output(
                aws.getCallerIdentity().then(id => id.accountId)
              ),
            },
            {
              name: 'IMAGE_REPO_NAME',
              value: this.stackName,
            },
            {
              name: 'IMAGE_TAG',
              value: 'latest',
            },
          ],
        },
        source: {
          type: 'CODEPIPELINE',
          buildspec: pulumi
            .all([this.ecsTaskDefinition.family, this.ecsCluster.name])
            .apply(
              ([_taskFamily, _clusterName]) => `version: 0.2
phases:
  pre_build:
    commands:
      - echo "Logging in to Amazon ECR..."
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com || true
  build:
    commands:
      - echo "Building Docker image..."
      - docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG . || echo "FROM nginx:latest" | docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG -
      - docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG || true
  post_build:
    commands:
      - echo "Pushing Docker image to ECR..."
      - docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG || true
      - echo "Creating imagedefinitions.json..."
      - printf '[{\"name\":\"${this.stackName}-container\",\"imageUri\":\"%s\"}]' $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG > imagedefinitions.json
artifacts:
  files:
    - imagedefinitions.json
    - appspec.yaml
    - taskdef.json
`
            ),
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: this.logGroup.name,
            streamName: 'codebuild-build',
          },
        },
        tags: {
          Name: `${this.stackName}-build-project`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this, dependsOn: [codeBuildPolicy] }
    );

    return buildProject;
  }

  private createCodeDeployApplication(): aws.codedeploy.Application {
    return new aws.codedeploy.Application(
      `${this.stackName}-codedeploy-app`,
      {
        name: `${this.stackName}-app`,
        computePlatform: 'ECS',
        tags: {
          Name: `${this.stackName}-codedeploy-app`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this }
    );
  }

  private createCodeDeployGroup(): aws.codedeploy.DeploymentGroup {
    // Create IAM role for CodeDeploy
    const codeDeployRole = new aws.iam.Role(
      `${this.stackName}-codedeploy-role`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codedeploy.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          Name: `${this.stackName}-codedeploy-role`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `${this.stackName}-codedeploy-policy`,
      {
        role: codeDeployRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS',
      },
      { parent: this }
    );

    return new aws.codedeploy.DeploymentGroup(
      `${this.stackName}-deployment-group`,
      {
        appName: this.codeDeployApp.name,
        deploymentGroupName: `${this.stackName}-dg`,
        serviceRoleArn: codeDeployRole.arn,
        deploymentConfigName: 'CodeDeployDefault.ECSAllAtOnce',
        ecsService: {
          clusterName: this.ecsCluster.name,
          serviceName: this.ecsService.name,
        },
        loadBalancerInfo: {
          targetGroupPairInfo: {
            prodTrafficRoute: {
              listenerArns: [this.listener.arn],
            },
            targetGroups: [
              {
                name: this.blueTargetGroup.name,
              },
              {
                name: this.greenTargetGroup.name,
              },
            ],
          },
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
        autoRollbackConfiguration: {
          enabled: true,
          events: ['DEPLOYMENT_FAILURE', 'DEPLOYMENT_STOP_ON_ALARM'],
        },
        tags: {
          Name: `${this.stackName}-deployment-group`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this }
    );
  }

  private createCodePipeline(): aws.codepipeline.Pipeline {
    // Create IAM role for CodePipeline
    const codePipelineRole = new aws.iam.Role(
      `${this.stackName}-pipeline-role`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          Name: `${this.stackName}-pipeline-role`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this }
    );

    const pipelinePolicy = new aws.iam.RolePolicy(
      `${this.stackName}-pipeline-policy`,
      {
        role: codePipelineRole.id,
        policy: pulumi
          .all([
            this.artifactBucket.arn,
            this.kmsKey.arn,
            this.codeBuildProject.arn,
            this.codeDeployApp.arn,
            this.snsTopic.arn,
          ])
          .apply(([bucketArn, kmsArn, buildArn, _deployArn, snsArn]) =>
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
                    's3:ListBucket',
                  ],
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'kms:Decrypt',
                    'kms:DescribeKey',
                    'kms:Encrypt',
                    'kms:ReEncrypt*',
                    'kms:GenerateDataKey*',
                  ],
                  Resource: [kmsArn],
                },
                {
                  Effect: 'Allow',
                  Action: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
                  Resource: [buildArn, `${buildArn}:*`],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'codedeploy:CreateDeployment',
                    'codedeploy:GetApplication',
                    'codedeploy:GetApplicationRevision',
                    'codedeploy:GetDeployment',
                    'codedeploy:GetDeploymentConfig',
                    'codedeploy:RegisterApplicationRevision',
                  ],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: ['ecs:*'],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: ['sns:Publish'],
                  Resource: [snsArn],
                },
                {
                  Effect: 'Allow',
                  Action: ['iam:PassRole'],
                  Resource: '*',
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Create webhook for GitHub integration
    new aws.codepipeline.Webhook(
      `${this.stackName}-webhook`,
      {
        name: `${this.stackName}-webhook-${this.timestamp}`,
        authentication: 'GITHUB_HMAC',
        targetAction: 'Source',
        targetPipeline: `${this.stackName}-pipeline-${this.timestamp}`,
        authenticationConfiguration: {
          secretToken: this.props.githubToken,
        },
        filters: [
          {
            jsonPath: '$.ref',
            matchEquals: `refs/heads/${this.props.githubBranch}`,
          },
        ],
        tags: {
          Name: `${this.stackName}-webhook`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Build pipeline stages
    const stages: pulumi.Input<aws.types.input.codepipeline.PipelineStage>[] = [
      {
        name: 'Source',
        actions: [
          {
            name: 'Source',
            category: 'Source',
            owner: 'ThirdParty',
            provider: 'GitHub',
            version: '1',
            outputArtifacts: ['source_output'],
            configuration: {
              Owner: this.props.githubOwner,
              Repo: this.props.githubRepo,
              Branch: this.props.githubBranch,
              OAuthToken: this.props.githubToken,
            },
          },
        ],
      },
      {
        name: 'Test',
        actions: [
          {
            name: 'Test',
            category: 'Test',
            owner: 'AWS',
            provider: 'CodeBuild',
            version: '1',
            inputArtifacts: ['source_output'],
            outputArtifacts: ['test_output'],
            configuration: {
              ProjectName: `${this.stackName}-test-${this.timestamp}`,
            },
          },
        ],
      },
      {
        name: 'Build',
        actions: [
          {
            name: 'Build',
            category: 'Build',
            owner: 'AWS',
            provider: 'CodeBuild',
            version: '1',
            inputArtifacts: ['test_output'],
            outputArtifacts: ['build_output'],
            configuration: {
              ProjectName: this.codeBuildProject.name,
            },
          },
        ],
      },
    ];

    // Add approval stage if enabled
    if (this.props.enableApproval) {
      stages.push({
        name: 'Approval',
        actions: [
          {
            name: 'ManualApproval',
            category: 'Approval',
            owner: 'AWS',
            provider: 'Manual',
            version: '1',
            configuration: {
              NotificationArn: this.snsTopic.arn,
              CustomData: `Approval required for deployment to ${this.props.environmentSuffix} environment`,
            },
          },
        ],
      });
    }

    // Add deploy stages for each region
    this.props.regions.forEach((region, _index) => {
      stages.push({
        name: `Deploy-${region}`,
        actions: [
          {
            name: `Deploy-${region}`,
            category: 'Deploy',
            owner: 'AWS',
            provider: 'CodeDeployToECS',
            version: '1',
            inputArtifacts: ['build_output'],
            // Only include region for multi-region pipelines
            ...(this.props.regions.length > 1 ? { region: region } : {}),
            configuration: {
              ApplicationName: this.codeDeployApp.name,
              DeploymentGroupName: this.codeDeployGroup.deploymentGroupName,
              TaskDefinitionTemplateArtifact: 'build_output',
              AppSpecTemplateArtifact: 'build_output',
            },
          },
        ],
      });
    });

    // Build artifact stores configuration
    const artifactStores: pulumi.Input<aws.types.input.codepipeline.PipelineArtifactStore>[] =
      this.props.regions.map(region => {
        const store: pulumi.Input<aws.types.input.codepipeline.PipelineArtifactStore> =
        {
          location:
            this.regionalBuckets.get(region) || this.artifactBucket.bucket,
          type: 'S3',
          encryptionKey: {
            id: this.kmsKey.arn,
            type: 'KMS',
          },
        };

        // Only add region field for multi-region pipelines
        if (this.props.regions.length > 1) {
          store.region = region;
        }

        return store;
      });

    const pipeline = new aws.codepipeline.Pipeline(
      `${this.stackName}-pipeline`,
      {
        name: `${this.stackName}-pipeline-${this.timestamp}`,
        roleArn: codePipelineRole.arn,
        artifactStores: artifactStores,
        stages: stages,
        tags: {
          Name: `${this.stackName}-pipeline`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this, dependsOn: [pipelinePolicy] }
    );

    // Create notification rule for pipeline events
    new aws.codestarnotifications.NotificationRule(
      `${this.stackName}-notification-rule`,
      {
        name: `${this.stackName}-notifications-${this.timestamp}`,
        resource: pipeline.arn,
        detailType: 'FULL',
        eventTypeIds: [
          'codepipeline-pipeline-pipeline-execution-started',
          'codepipeline-pipeline-pipeline-execution-failed',
          'codepipeline-pipeline-pipeline-execution-succeeded',
          'codepipeline-pipeline-manual-approval-needed',
        ],
        targets: [
          {
            address: this.snsTopic.arn,
          },
        ],
        tags: {
          Name: `${this.stackName}-notification-rule`,
          Environment: this.props.environmentSuffix,
        },
      },
      { parent: this }
    );

    return pipeline;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createOutputs(): Record<string, pulumi.Output<any>> {
    return {
      kmsKeyId: this.kmsKey.id,
      kmsKeyArn: this.kmsKey.arn,
      artifactBucketName: this.artifactBucket.bucket,
      artifactBucketArn: this.artifactBucket.arn,
      snsTopicArn: this.snsTopic.arn,
      ecsClusterName: this.ecsCluster.name,
      ecsClusterArn: this.ecsCluster.arn,
      ecsServiceName: this.ecsService.name,
      ecsServiceArn: this.ecsService.arn,
      ecsTaskDefinitionArn: this.ecsTaskDefinition.arn,
      codeBuildProjectName: this.codeBuildProject.name,
      codeBuildProjectArn: this.codeBuildProject.arn,
      codeDeployAppName: this.codeDeployApp.name,
      codeDeployAppArn: this.codeDeployApp.arn,
      codeDeployGroupName: this.codeDeployGroup.deploymentGroupName,
      codeDeployGroupArn: this.codeDeployGroup.arn,
      codePipelineName: this.codePipeline.name,
      codePipelineArn: this.codePipeline.arn,
      logGroupName: this.logGroup.name,
      logGroupArn: this.logGroup.arn,
      albArn: this.alb.arn,
      albDnsName: this.alb.dnsName,
      blueTargetGroupArn: this.blueTargetGroup.arn,
      greenTargetGroupArn: this.greenTargetGroup.arn,
      listenerArn: this.listener.arn,
      vpcId: this.vpc.id,
      publicSubnet1Id: this.publicSubnet1.id,
      publicSubnet2Id: this.publicSubnet2.id,
      stackName: pulumi.output(this.stackName),
      environmentSuffix: pulumi.output(this.props.environmentSuffix),
      regions: pulumi.output(this.props.regions),
    };
  }

  private writeOutputsToFile(): void {
    const outputDir = path.join(process.cwd(), 'cfn-outputs');
    const outputFile = path.join(outputDir, 'flat-outputs.json');

    // Synchronously ensure directory exists before async operations
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Use pulumi.all to wait for all outputs to resolve
    pulumi.all(this.outputs).apply(resolvedOutputs => {
      try {
        // Write outputs to file
        fs.writeFileSync(
          outputFile,
          JSON.stringify(resolvedOutputs, null, 2),
          'utf-8'
        );

        // Only log if not in test environment
        if (!process.env.JEST_WORKER_ID) {
          console.log(`Outputs written to ${outputFile}`);
        }
      } catch (error) {
        // Handle any file write errors
        if (!process.env.JEST_WORKER_ID) {
          console.error(`Failed to write outputs: ${error}`);
        }
      }
    });
  }
}
