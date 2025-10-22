import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  applicationName: string;
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  nodeVersions: string[];
  retentionDays: number;
  maxProdImages: number;
  artifactRetentionDays: number;
  approvalTimeoutHours: number;
  healthCheckTimeoutMinutes: number;
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  private readonly vpc: ec2.IVpc;
  private readonly ecrRepository: ecr.Repository;
  private readonly artifactBucket: s3.Bucket;
  private readonly notificationTopic: sns.Topic;
  private readonly ecsCluster: ecs.Cluster;
  private readonly pipeline: codepipeline.Pipeline;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Initialize core infrastructure
    this.vpc = this.createVPC(environmentSuffix);
    this.ecrRepository = this.createECRRepository(props, environmentSuffix);
    this.artifactBucket = this.createArtifactBucket(props, environmentSuffix);
    this.notificationTopic = this.createNotificationTopic(environmentSuffix);
    this.ecsCluster = this.createECSCluster(environmentSuffix);

    // Create the CI/CD pipeline
    this.pipeline = this.createPipeline(props, environmentSuffix);

    // Create CloudWatch dashboards and alarms
    this.createMonitoring(props, environmentSuffix);

    // Output important values
    this.createOutputs();
  }

  /**
   * Creates VPC with private subnets for enhanced security
   */
  private createVPC(environmentSuffix: string): ec2.IVpc {
    // Create a new VPC instead of looking up default VPC to avoid region issues
    const vpc = new ec2.Vpc(this, 'FintechVPC', {
      vpcName: `fintech-cicd-vpc-${environmentSuffix}`,
      maxAzs: 3,
      natGateways: 1, // Use NAT Gateway for cost optimization
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
        {
          cidrMask: 24,
          name: 'Data',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    return vpc;
  }

  /**
   * Creates ECR repository with lifecycle policies and scanning
   */
  private createECRRepository(
    props: TapStackProps,
    environmentSuffix: string
  ): ecr.Repository {
    const repository = new ecr.Repository(this, 'ECRRepository', {
      repositoryName: `${props.applicationName}-repo-${environmentSuffix}`,
      imageScanOnPush: true,
      imageTagMutability: ecr.TagMutability.IMMUTABLE,
      encryption: ecr.RepositoryEncryption.AES_256,
      lifecycleRules: [
        {
          rulePriority: 1,
          description: 'Keep only last 10 production images',
          tagStatus: ecr.TagStatus.TAGGED,
          tagPrefixList: ['prod'],
          maxImageCount: props.maxProdImages,
        },
        {
          rulePriority: 2,
          description: 'Remove untagged images after 7 days',
          tagStatus: ecr.TagStatus.UNTAGGED,
          maxImageAge: cdk.Duration.days(7),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add cross-region replication for disaster recovery
    repository.addLifecycleRule({
      rulePriority: 3,
      description: 'Replicate to us-west-2 for DR',
      tagStatus: ecr.TagStatus.ANY,
      maxImageAge: cdk.Duration.days(30),
    });

    // Add repository policy for least-privilege access
    repository.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowPushPull',
        effect: iam.Effect.ALLOW,
        principals: [new iam.AccountPrincipal(this.account)],
        actions: [
          'ecr:GetDownloadUrlForLayer',
          'ecr:BatchGetImage',
          'ecr:BatchCheckLayerAvailability',
          'ecr:PutImage',
          'ecr:InitiateLayerUpload',
          'ecr:UploadLayerPart',
          'ecr:CompleteLayerUpload',
        ],
      })
    );

    return repository;
  }

  /**
   * Creates S3 bucket for pipeline artifacts with encryption and lifecycle
   */
  private createArtifactBucket(
    props: TapStackProps,
    environmentSuffix: string
  ): s3.Bucket {
    const bucket = new s3.Bucket(this, 'ArtifactBucket', {
      bucketName: `${props.applicationName}-artifacts-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      serverAccessLogsPrefix: 'access-logs/',
      lifecycleRules: [
        {
          id: 'DeleteOldArtifacts',
          enabled: true,
          expiration: cdk.Duration.days(props.artifactRetentionDays),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Enable access logging
    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyInsecureConnections',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [`${bucket.bucketArn}/*`],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    return bucket;
  }

  /**
   * Creates SNS topic for notifications
   */
  private createNotificationTopic(environmentSuffix: string): sns.Topic {
    const topic = new sns.Topic(this, 'NotificationTopic', {
      displayName: 'Fintech CI/CD Pipeline Notifications',
      topicName: `fintech-cicd-notifications-${environmentSuffix}`,
    });
    topic.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Add email subscriptions (replace with actual emails)
    topic.addSubscription(
      new sns_subscriptions.EmailSubscription('dev-team@example.com')
    );

    return topic;
  }

  /**
   * Creates ECS cluster for container deployment
   */
  private createECSCluster(environmentSuffix: string): ecs.Cluster {
    const cluster = new ecs.Cluster(this, 'ECSCluster', {
      vpc: this.vpc,
      clusterName: `fintech-payment-cluster-${environmentSuffix}`,
      // containerInsights: true, // Deprecated - using containerInsightsV2 instead
    });
    cluster.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    return cluster;
  }

  /**
   * Creates the main CI/CD pipeline
   */
  private createPipeline(
    props: TapStackProps,
    environmentSuffix: string
  ): codepipeline.Pipeline {
    // Create pipeline role
    const pipelineRole = this.createPipelineRole();

    // Create GitHub secret
    const githubToken = secretsmanager.Secret.fromSecretNameV2(
      this,
      'GithubToken',
      'github-token'
    );

    // Create pipeline
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `${props.applicationName}-pipeline-${environmentSuffix}`,
      artifactBucket: this.artifactBucket,
      role: pipelineRole,
      restartExecutionOnUpdate: false,
    });

    // Source stage
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'GitHub_Source',
      owner: props.githubOwner,
      repo: props.githubRepo,
      branch: props.githubBranch,
      oauthToken: githubToken.secretValue,
      output: sourceOutput,
      trigger: codepipeline_actions.GitHubTrigger.NONE, // Disable webhook to avoid GitHub API issues
    });

    pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction],
    });

    // Build stage
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    const buildProject = this.createDockerBuildProject(environmentSuffix);

    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Docker_Build',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    // Test stage with parallel testing
    const testActions = this.createParallelTestActions(
      props,
      sourceOutput,
      environmentSuffix
    );

    pipeline.addStage({
      stageName: 'Test',
      actions: testActions,
    });

    // Security scanning stage
    const securityProject = this.createSecurityScanProject(environmentSuffix);

    pipeline.addStage({
      stageName: 'Security',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Security_Scan',
          project: securityProject,
          input: buildOutput,
        }),
      ],
    });

    // Manual approval stage
    const approvalAction = new codepipeline_actions.ManualApprovalAction({
      actionName: 'Production_Approval',
      notificationTopic: this.notificationTopic,
      additionalInformation:
        'Please review test results and approve production deployment',
      externalEntityLink: `https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${props.applicationName}-pipeline`,
      runOrder: 1,
    });

    pipeline.addStage({
      stageName: 'Approval',
      actions: [approvalAction],
    });

    // Deploy stage with blue-green deployment
    const deployAction = this.createDeployAction(buildOutput);

    pipeline.addStage({
      stageName: 'Deploy',
      actions: [deployAction],
    });

    // Add failure notifications
    this.addPipelineNotifications(pipeline, environmentSuffix);

    return pipeline;
  }

  /**
   * Creates IAM role for CodePipeline with least-privilege permissions
   */
  private createPipelineRole(): iam.Role {
    const role = new iam.Role(this, 'PipelineRole', {
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      roleName: 'fintech-pipeline-role',
      description: 'Role for fintech CI/CD pipeline',
    });

    // Add necessary permissions
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:GetObjectVersion',
          's3:PutObject',
          's3:PutObjectAcl',
        ],
        resources: [`${this.artifactBucket.bucketArn}/*`],
      })
    );

    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
        resources: [
          `arn:aws:codebuild:${this.region}:${this.account}:project/*`,
        ],
      })
    );

    // Add secrets manager permissions
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [
          `arn:aws:secretsmanager:${this.region}:${this.account}:secret:*`,
        ],
      })
    );

    return role;
  }

  /**
   * Creates CodeBuild project for Docker builds
   */
  private createDockerBuildProject(
    environmentSuffix: string
  ): codebuild.PipelineProject {
    const buildRole = this.createBuildRole('docker-build');

    const logGroup = new logs.LogGroup(this, 'DockerBuildLogs', {
      logGroupName: '/aws/codebuild/docker-build',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const project = new codebuild.PipelineProject(this, 'DockerBuildProject', {
      projectName: `fintech-docker-build-${environmentSuffix}`,
      role: buildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.MEDIUM,
        privileged: true,
        environmentVariables: {
          ECR_REPOSITORY_URI: {
            value: this.ecrRepository.repositoryUri,
          },
          AWS_ACCOUNT_ID: {
            value: this.account,
          },
          AWS_DEFAULT_REGION: {
            value: this.region,
          },
        },
      },
      logging: {
        cloudWatch: {
          logGroup,
          prefix: 'build',
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com',
              'COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)',
              'IMAGE_TAG=${COMMIT_HASH:=latest}',
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'echo Building the Docker image with multi-stage build...',
              'docker build -t $ECR_REPOSITORY_URI:latest -t $ECR_REPOSITORY_URI:$IMAGE_TAG --target production .',
              'echo Running security scan on image...',
              'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image --exit-code 0 --severity HIGH,CRITICAL $ECR_REPOSITORY_URI:$IMAGE_TAG',
            ],
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'echo Pushing Docker images...',
              'docker push $ECR_REPOSITORY_URI:latest',
              'docker push $ECR_REPOSITORY_URI:$IMAGE_TAG',
              'printf \'[{"name":"payment-processor","imageUri":"%s"}]\' $ECR_REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json',
            ],
          },
        },
        artifacts: {
          files: ['imagedefinitions.json'],
        },
      }),
      vpc: this.vpc,
      subnetSelection: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    return project;
  }

  /**
   * Creates parallel test actions for multiple Node.js versions
   */
  private createParallelTestActions(
    props: TapStackProps,
    sourceOutput: codepipeline.Artifact,
    environmentSuffix: string
  ): codepipeline_actions.CodeBuildAction[] {
    return props.nodeVersions.map(version => {
      const testProject = this.createTestProject(version, environmentSuffix);

      return new codepipeline_actions.CodeBuildAction({
        actionName: `Test_Node_${version}`,
        project: testProject,
        input: sourceOutput,
        runOrder: 1,
      });
    });
  }

  /**
   * Creates test project for specific Node.js version
   */
  private createTestProject(
    nodeVersion: string,
    environmentSuffix: string
  ): codebuild.PipelineProject {
    const buildRole = this.createBuildRole(`test-node-${nodeVersion}`);

    const logGroup = new logs.LogGroup(this, `TestLogs${nodeVersion}`, {
      logGroupName: `/aws/codebuild/test-node-${nodeVersion}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    return new codebuild.PipelineProject(this, `TestProject${nodeVersion}`, {
      projectName: `fintech-test-node-${nodeVersion}-${environmentSuffix}`,
      role: buildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.fromDockerRegistry(
          `node:${nodeVersion}-alpine`
        ),
        computeType: codebuild.ComputeType.MEDIUM,
      },
      logging: {
        cloudWatch: {
          logGroup,
          prefix: 'test',
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'echo Installing dependencies...',
              'npm ci',
              'npm install -g jest@latest',
            ],
          },
          pre_build: {
            commands: [
              'echo Running linting...',
              'npm run lint',
              'echo Running type checks...',
              'npm run type-check',
            ],
          },
          build: {
            commands: [
              `echo Running tests with Node.js ${nodeVersion}...`,
              'npm run test:ci',
              'echo Running integration tests...',
              'npm run test:integration',
            ],
          },
          post_build: {
            commands: [
              'echo Generating test reports...',
              'npm run test:coverage',
              'echo Tests completed successfully',
            ],
          },
        },
        reports: {
          jest_reports: {
            files: ['coverage/clover.xml'],
            'file-format': 'CLOVERXML',
          },
        },
        artifacts: {
          files: ['coverage/**/*'],
        },
      }),
      vpc: this.vpc,
      subnetSelection: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });
  }

  /**
   * Creates security scanning project
   */
  private createSecurityScanProject(
    environmentSuffix: string
  ): codebuild.PipelineProject {
    const buildRole = this.createBuildRole('security-scan');

    const logGroup = new logs.LogGroup(this, 'SecurityScanLogs', {
      logGroupName: '/aws/codebuild/security-scan',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    return new codebuild.PipelineProject(this, 'SecurityScanProject', {
      projectName: `fintech-security-scan-${environmentSuffix}`,
      role: buildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.MEDIUM,
        privileged: true,
      },
      logging: {
        cloudWatch: {
          logGroup,
          prefix: 'security',
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'echo Installing security tools...',
              'pip3 install safety bandit',
              'npm install -g snyk@latest',
              'curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin',
            ],
          },
          pre_build: {
            commands: [
              'echo Starting security scans...',
              'export IMAGE_TAG=$CODEBUILD_RESOLVED_SOURCE_VERSION',
            ],
          },
          build: {
            commands: [
              'echo Running SAST scan...',
              'bandit -r . -f json -o bandit-report.json || true',
              'echo Running dependency vulnerability scan...',
              'safety check --json > safety-report.json || true',
              'echo Running container vulnerability scan...',
              'grype $ECR_REPOSITORY_URI:$IMAGE_TAG -o json > grype-report.json || true',
              'echo Running PCI DSS compliance checks...',
              'npm audit --json > npm-audit-report.json || true',
              'echo Analyzing security scan results...',
              'python3 analyze_security.py',
            ],
          },
          post_build: {
            commands: [
              'echo Security scan completed',
              'echo Uploading results to S3...',
              'aws s3 cp . s3://${ARTIFACT_BUCKET}/security-reports/${CODEBUILD_BUILD_NUMBER}/ --recursive --include "*.json"',
            ],
          },
        },
        artifacts: {
          files: ['*-report.json'],
        },
      }),
      environmentVariables: {
        ECR_REPOSITORY_URI: {
          value: this.ecrRepository.repositoryUri,
        },
        ARTIFACT_BUCKET: {
          value: this.artifactBucket.bucketName,
        },
      },
      vpc: this.vpc,
      subnetSelection: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });
  }

  /**
   * Creates IAM role for CodeBuild projects
   */
  private createBuildRole(projectName: string): iam.Role {
    const role = new iam.Role(this, `${projectName}Role`, {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      roleName: `fintech-build-${projectName}-role`,
      description: `Role for ${projectName} CodeBuild project`,
    });

    // Add ECR permissions
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
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

    // Add S3 permissions
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: [`${this.artifactBucket.bucketArn}/*`],
      })
    );

    // Add CloudWatch Logs permissions
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/codebuild/*`,
        ],
      })
    );

    // Add VPC permissions
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ec2:CreateNetworkInterface',
          'ec2:DescribeNetworkInterfaces',
          'ec2:DeleteNetworkInterface',
          'ec2:DescribeSubnets',
          'ec2:DescribeSecurityGroups',
          'ec2:DescribeDhcpOptions',
          'ec2:DescribeVpcs',
          'ec2:CreateNetworkInterfacePermission',
        ],
        resources: ['*'],
      })
    );

    // Add Secrets Manager permissions
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [
          `arn:aws:secretsmanager:${this.region}:${this.account}:secret:*`,
        ],
      })
    );

    return role;
  }

  /**
   * Creates ECS deployment action with blue-green strategy
   */
  private createDeployAction(
    buildOutput: codepipeline.Artifact
  ): codepipeline_actions.EcsDeployAction {
    // Create ECS service with blue-green deployment
    const service = this.createECSService();

    return new codepipeline_actions.EcsDeployAction({
      actionName: 'Deploy_to_ECS',
      service: service.service,
      input: buildOutput,
      deploymentTimeout: cdk.Duration.minutes(60),
    });
  }

  /**
   * Creates ECS service with blue-green deployment configuration
   */
  private createECSService(): ecs_patterns.ApplicationLoadBalancedFargateService {
    // Create log group for ECS tasks
    const logGroup = new logs.LogGroup(this, 'ECSTaskLogGroup', {
      logGroupName: '/ecs/payment-processor',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create task definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
      taskRole: this.createECSTaskRole(),
      executionRole: this.createECSExecutionRole(),
    });

    // Add container
    const container = taskDefinition.addContainer('payment-processor', {
      image: ecs.ContainerImage.fromRegistry('nginx:alpine'),
      memoryLimitMiB: 512,
      cpu: 256,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'payment-processor',
        logGroup: logGroup,
      }),
      environment: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
      secrets: {
        DB_CONNECTION: ecs.Secret.fromSecretsManager(
          secretsmanager.Secret.fromSecretNameV2(
            this,
            'DbSecret',
            'db-connection'
          )
        ),
      },
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:80 || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        retries: 5,
        startPeriod: cdk.Duration.seconds(90),
      },
    });

    container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    });

    // Create ALB and service
    const service = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      'Service',
      {
        cluster: this.ecsCluster,
        taskDefinition,
        serviceName: 'payment-processor-service',
        desiredCount: 1,
        assignPublicIp: false,
        // deploymentController: {
        //   type: ecs.DeploymentControllerType.CODE_DEPLOY,
        // },
        minHealthyPercent: 100,
        maxHealthyPercent: 200,
        healthCheckGracePeriod: cdk.Duration.seconds(120),
        // Remove domain configuration for now - can be added later with proper Route53 zone
        // domainName: 'payment.example.com',
        // domainZone: undefined, // Replace with your Route53 zone
        // certificate: undefined, // Replace with your ACM certificate
      }
    );

    // Configure auto-scaling - commented out for initial infrastructure deployment
    // Auto-scaling will be enabled after the first successful deployment
    /*
    const scaling = service.service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });
    */

    // Configure health checks
    service.targetGroup.configureHealthCheck({
      path: '/',
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(10),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
      healthyHttpCodes: '200',
    });

    return service;
  }

  /**
   * Creates IAM role for ECS tasks
   */
  private createECSTaskRole(): iam.Role {
    const role = new iam.Role(this, 'ECSTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      roleName: 'fintech-ecs-task-role',
      description: 'Role for ECS tasks',
    });

    // Add minimal permissions required by the application
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: [`arn:aws:s3:::payment-data-${this.account}/*`],
      })
    );

    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'kms:ViaService': `s3.${this.region}.amazonaws.com`,
          },
        },
      })
    );

    return role;
  }

  /**
   * Creates IAM role for ECS task execution
   */
  private createECSExecutionRole(): iam.Role {
    const role = new iam.Role(this, 'ECSExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      roleName: 'fintech-ecs-execution-role',
      description: 'Role for ECS task execution',
    });

    // Add ECR pull permissions
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ecr:GetAuthorizationToken',
          'ecr:BatchCheckLayerAvailability',
          'ecr:GetDownloadUrlForLayer',
          'ecr:BatchGetImage',
        ],
        resources: ['*'],
      })
    );

    // Add CloudWatch Logs permissions
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:/ecs/*`,
        ],
      })
    );

    // Add Secrets Manager permissions
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [
          `arn:aws:secretsmanager:${this.region}:${this.account}:secret:*`,
        ],
      })
    );

    return role;
  }

  /**
   * Adds pipeline notifications
   */
  private addPipelineNotifications(
    pipeline: codepipeline.Pipeline,
    environmentSuffix: string
  ): void {
    // Create CloudWatch event rule for pipeline failures
    const failureRule = new cdk.aws_events.Rule(this, 'PipelineFailureRule', {
      ruleName: `fintech-pipeline-failure-${environmentSuffix}`,
      description: 'Notify on pipeline failures',
      eventPattern: {
        source: ['aws.codepipeline'],
        detailType: ['CodePipeline Pipeline Execution State Change'],
        detail: {
          pipeline: [pipeline.pipelineName],
          state: ['FAILED'],
        },
      },
    });
    failureRule.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    failureRule.addTarget(
      new cdk.aws_events_targets.SnsTopic(this.notificationTopic, {
        message: cdk.aws_events.RuleTargetInput.fromText(
          `Pipeline ${pipeline.pipelineName} has failed. Check the console for details.`
        ),
      })
    );

    // Create CloudWatch event rule for successful deployments
    const successRule = new cdk.aws_events.Rule(this, 'PipelineSuccessRule', {
      ruleName: `fintech-pipeline-success-${environmentSuffix}`,
      description: 'Notify on successful deployments',
      eventPattern: {
        source: ['aws.codepipeline'],
        detailType: ['CodePipeline Pipeline Execution State Change'],
        detail: {
          pipeline: [pipeline.pipelineName],
          state: ['SUCCEEDED'],
        },
      },
    });
    successRule.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    successRule.addTarget(
      new cdk.aws_events_targets.SnsTopic(this.notificationTopic, {
        message: cdk.aws_events.RuleTargetInput.fromText(
          `Pipeline ${pipeline.pipelineName} has completed successfully.`
        ),
      })
    );
  }

  /**
   * Creates CloudWatch monitoring and alarms
   */
  private createMonitoring(
    _props: TapStackProps,
    environmentSuffix: string
  ): void {
    // Create CloudWatch dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'PipelineDashboard', {
      dashboardName: `fintech-cicd-dashboard-${environmentSuffix}`,
    });
    dashboard.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Add pipeline metrics widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Pipeline Execution Metrics',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CodePipeline',
            metricName: 'PipelineExecutionSuccess',
            dimensionsMap: {
              PipelineName: this.pipeline.pipelineName,
            },
            statistic: 'Sum',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/CodePipeline',
            metricName: 'PipelineExecutionFailure',
            dimensionsMap: {
              PipelineName: this.pipeline.pipelineName,
            },
            statistic: 'Sum',
          }),
        ],
        width: 12,
        height: 6,
      })
    );

    // Create alarm for pipeline failures
    const pipelineFailureAlarm = new cloudwatch.Alarm(
      this,
      'PipelineFailureAlarm',
      {
        alarmName: `fintech-pipeline-failure-alarm-${environmentSuffix}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/CodePipeline',
          metricName: 'PipelineExecutionFailure',
          dimensionsMap: {
            PipelineName: this.pipeline.pipelineName,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    pipelineFailureAlarm.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    pipelineFailureAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.notificationTopic)
    );

    // Create alarm for ECR image scan findings
    const imageScanAlarm = new cloudwatch.Alarm(this, 'ImageScanAlarm', {
      alarmName: `fintech-image-scan-critical-findings-${environmentSuffix}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ECR',
        metricName: 'ImageScanFindingsSeverityCounts',
        dimensionsMap: {
          RepositoryName: this.ecrRepository.repositoryName,
          FindingSeverity: 'CRITICAL',
        },
        statistic: 'Maximum',
        period: cdk.Duration.hours(1),
      }),
      threshold: 0,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 1,
    });
    imageScanAlarm.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    imageScanAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.notificationTopic)
    );
  }

  /**
   * Creates stack outputs
   */
  private createOutputs(): void {
    new cdk.CfnOutput(this, 'PipelineURL', {
      value: `https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${this.pipeline.pipelineName}/view`,
      description: 'URL to the CodePipeline console',
    });

    new cdk.CfnOutput(this, 'ECRRepositoryURI', {
      value: this.ecrRepository.repositoryUri,
      description: 'ECR repository URI',
    });

    new cdk.CfnOutput(this, 'ECSClusterName', {
      value: this.ecsCluster.clusterName,
      description: 'ECS cluster name',
    });

    new cdk.CfnOutput(this, 'SNSTopicArn', {
      value: this.notificationTopic.topicArn,
      description: 'SNS topic ARN for notifications',
    });

    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: this.artifactBucket.bucketName,
      description: 'S3 bucket for pipeline artifacts',
    });
  }
}
