I'll help you build a comprehensive CI/CD pipeline using AWS CDK TypeScript that meets all your requirements. This will be a production-ready solution with proper security, monitoring, and cross-account deployment capabilities.

## Project Structure

```
lib/
├── tap-stack.ts                 # Main stack orchestrator
├── pipeline/
│   ├── code-pipeline-stack.ts   # CodePipeline configuration
│   ├── build-stage.ts           # CodeBuild configuration
│   └── deploy-stage.ts          # Elastic Beanstalk deployment
├── security/
│   ├── iam-roles.ts             # IAM roles and policies
│   └── secrets-config.ts        # Secrets Manager & Parameter Store
├── monitoring/
│   ├── cloudwatch-alarms.ts     # CloudWatch alarms
│   └── notifications.ts         # SNS/Lambda notifications
├── lambda/
│   └── slack-notifier.ts        # Slack notification Lambda
└── config/
    ├── buildspec.yml             # CodeBuild buildspec
    └── Dockerrun.aws.json        # Elastic Beanstalk Docker config
```

## 1. Main Stack Orchestrator

**lib/tap-stack.ts**

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipelineStack } from './pipeline/code-pipeline-stack';
import { SecurityConfig } from './security/secrets-config';
import { MonitoringStack } from './monitoring/cloudwatch-alarms';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  company?: string;
  division?: string;
  targetAccountId?: string;
  slackWebhookUrl?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const config = this.buildConfig(props);

    // Apply removal policy based on environment
    const removalPolicy = this.isProduction(config.environmentSuffix)
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;

    // Create security configuration
    const securityConfig = new SecurityConfig(this, 'SecurityConfig', {
      config,
      removalPolicy,
    });

    // Create pipeline
    const pipeline = new CodePipelineStack(this, 'Pipeline', {
      config,
      removalPolicy,
      securityConfig,
    });

    // Create monitoring
    new MonitoringStack(this, 'Monitoring', {
      config,
      pipeline: pipeline.pipeline,
      slackWebhookUrl: props?.slackWebhookUrl,
    });

    this.applyTags(config);
  }

  private buildConfig(props?: TapStackProps) {
    return {
      environmentSuffix: props?.environmentSuffix || 'dev',
      company: props?.company || 'acme',
      division: props?.division || 'tech',
      targetAccountId: props?.targetAccountId || this.account,
    };
  }

  private isProduction(environment: string): boolean {
    return environment.toLowerCase().includes('prod');
  }

  private applyTags(config: any) {
    cdk.Tags.of(this).add('Company', config.company);
    cdk.Tags.of(this).add('Division', config.division);
    cdk.Tags.of(this).add('Environment', config.environmentSuffix);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('CostCenter', `${config.company}-${config.division}`);
  }
}
```

## 2. CodePipeline Configuration

**lib/pipeline/code-pipeline-stack.ts**

```typescript
import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { BuildStage } from './build-stage';
import { DeployStage } from './deploy-stage';
import { SecurityConfig } from '../security/secrets-config';

export interface CodePipelineStackProps {
  config: any;
  removalPolicy: cdk.RemovalPolicy;
  securityConfig: SecurityConfig;
}

export class CodePipelineStack extends Construct {
  public readonly pipeline: codepipeline.Pipeline;
  public readonly artifactsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: CodePipelineStackProps) {
    super(scope, id);

    const { config, removalPolicy, securityConfig } = props;
    const resourceName = (resource: string) =>
      `${config.company}-${config.division}-${config.environmentSuffix}-${resource}`;

    // Create artifacts bucket with versioning and encryption
    this.artifactsBucket = new s3.Bucket(this, 'ArtifactsBucket', {
      bucketName: resourceName('pipeline-artifacts'),
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy,
      autoDeleteObjects: removalPolicy === cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(30),
          noncurrentVersionExpiration: cdk.Duration.days(7),
        },
      ],
    });

    // Create source bucket for S3 webhook trigger
    const sourceBucket = new s3.Bucket(this, 'SourceBucket', {
      bucketName: resourceName('pipeline-source'),
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy,
      autoDeleteObjects: removalPolicy === cdk.RemovalPolicy.DESTROY,
      eventBridgeEnabled: true, // Enable EventBridge for webhook-like behavior
    });

    // Create pipeline role
    const pipelineRole = new iam.Role(this, 'PipelineRole', {
      roleName: resourceName('pipeline-role'),
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      inlinePolicies: {
        PipelinePolicy: this.createPipelinePolicy(
          this.artifactsBucket.bucketArn,
          sourceBucket.bucketArn,
          config.targetAccountId
        ),
      },
    });

    // Create build stage
    const buildStage = new BuildStage(this, 'BuildStage', {
      config,
      artifactsBucket: this.artifactsBucket,
      securityConfig,
      removalPolicy,
    });

    // Create deploy stage
    const deployStage = new DeployStage(this, 'DeployStage', {
      config,
      removalPolicy,
    });

    // Define pipeline artifacts
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    const testOutput = new codepipeline.Artifact('TestOutput');

    // Create the pipeline
    this.pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: resourceName('pipeline'),
      role: pipelineRole,
      artifactBucket: this.artifactsBucket,
      restartExecutionOnUpdate: true,
      stages: [
        // Source Stage
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.S3SourceAction({
              actionName: 'S3Source',
              bucket: sourceBucket,
              bucketKey: 'source.zip',
              output: sourceOutput,
              trigger: codepipeline_actions.S3Trigger.EVENTS, // Webhook-like trigger
            }),
          ],
        },
        // Build Stage
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'BuildTypeScriptApp',
              project: buildStage.buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
              environmentVariables: {
                ENVIRONMENT: { value: config.environmentSuffix },
                ARTIFACTS_BUCKET: { value: this.artifactsBucket.bucketName },
              },
            }),
          ],
        },
        // Test Stage
        {
          stageName: 'Test',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'RunUnitTests',
              project: buildStage.testProject,
              input: buildOutput,
              outputs: [testOutput],
              runOrder: 1,
            }),
          ],
        },
        // Manual Approval Stage
        {
          stageName: 'Approval',
          actions: [
            new codepipeline_actions.ManualApprovalAction({
              actionName: 'ManualApproval',
              notificationTopic: deployStage.approvalTopic,
              additionalInformation: `Deploy to ${config.environmentSuffix} environment`,
              runOrder: 1,
            }),
          ],
        },
        // Deploy Stage
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.ElasticBeanstalkDeployAction({
              actionName: 'DeployToElasticBeanstalk',
              applicationName: deployStage.application.applicationName!,
              environmentName: deployStage.environment.environmentName!,
              input: buildOutput,
              runOrder: 1,
            }),
          ],
        },
      ],
    });
  }

  private createPipelinePolicy(
    artifactsBucketArn: string,
    sourceBucketArn: string,
    targetAccountId: string
  ): iam.PolicyDocument {
    return new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:GetObject',
            's3:GetObjectVersion',
            's3:PutObject',
            's3:GetBucketLocation',
            's3:ListBucket',
          ],
          resources: [
            artifactsBucketArn,
            `${artifactsBucketArn}/*`,
            sourceBucketArn,
            `${sourceBucketArn}/*`,
          ],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['sts:AssumeRole'],
          resources: [`arn:aws:iam::${targetAccountId}:role/*`],
          conditions: {
            StringEquals: {
              'iam:ResourceTag/AllowCrossAccountDeployment': 'true',
            },
          },
        }),
      ],
    });
  }
}
```

## 3. Build Stage Configuration

**lib/pipeline/build-stage.ts**

```typescript
import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { SecurityConfig } from '../security/secrets-config';

export interface BuildStageProps {
  config: any;
  artifactsBucket: s3.Bucket;
  securityConfig: SecurityConfig;
  removalPolicy: cdk.RemovalPolicy;
}

export class BuildStage extends Construct {
  public readonly buildProject: codebuild.PipelineProject;
  public readonly testProject: codebuild.PipelineProject;

  constructor(scope: Construct, id: string, props: BuildStageProps) {
    super(scope, id);

    const { config, artifactsBucket, securityConfig } = props;
    const resourceName = (resource: string) =>
      `${config.company}-${config.division}-${config.environmentSuffix}-${resource}`;

    // Create CodeBuild service role
    const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      roleName: resourceName('codebuild-role'),
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      inlinePolicies: {
        CodeBuildPolicy: this.createCodeBuildPolicy(
          artifactsBucket.bucketArn,
          securityConfig
        ),
      },
    });

    // Build project for TypeScript compilation and Docker packaging
    this.buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      projectName: resourceName('build-project'),
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.MEDIUM,
        privileged: true, // Required for Docker
        environmentVariables: {
          AWS_ACCOUNT_ID: { value: cdk.Aws.ACCOUNT_ID },
          AWS_REGION: { value: cdk.Aws.REGION },
          ENVIRONMENT: { value: config.environmentSuffix },
          IMAGE_TAG: { value: 'latest' },
          DOCKER_REGISTRY: {
            value: `${cdk.Aws.ACCOUNT_ID}.dkr.ecr.${cdk.Aws.REGION}.amazonaws.com`,
          },
        },
      },
      cache: codebuild.Cache.s3({
        bucket: artifactsBucket,
        prefix: 'build-cache',
      }),
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '18',
              docker: '24',
            },
            commands: [
              'echo Installing dependencies...',
              'npm ci',
              'npm install -g typescript',
            ],
          },
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              'aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $DOCKER_REGISTRY',
              'echo Retrieving secrets from Secrets Manager...',
              `export DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id ${securityConfig.dbSecret.secretName} --query SecretString --output text | jq -r .password)`,
              `export API_KEY=$(aws secretsmanager get-secret-value --secret-id ${securityConfig.apiKeySecret.secretName} --query SecretString --output text | jq -r .apiKey)`,
            ],
          },
          build: {
            commands: [
              'echo Building TypeScript application...',
              'npm run build',
              'echo Building Docker image...',
              'docker build -t $DOCKER_REGISTRY/$IMAGE_REPO:$IMAGE_TAG .',
              'docker tag $DOCKER_REGISTRY/$IMAGE_REPO:$IMAGE_TAG $DOCKER_REGISTRY/$IMAGE_REPO:$CODEBUILD_BUILD_NUMBER',
            ],
          },
          post_build: {
            commands: [
              'echo Pushing Docker image to ECR...',
              'docker push $DOCKER_REGISTRY/$IMAGE_REPO:$IMAGE_TAG',
              'docker push $DOCKER_REGISTRY/$IMAGE_REPO:$CODEBUILD_BUILD_NUMBER',
              'echo Creating Dockerrun.aws.json for Elastic Beanstalk...',
              'printf \'{"AWSEBDockerrunVersion":"1","Image":{"Name":"%s","Update":"true"},"Ports":[{"ContainerPort":"3000"}]}\' $DOCKER_REGISTRY/$IMAGE_REPO:$IMAGE_TAG > Dockerrun.aws.json',
            ],
          },
        },
        artifacts: {
          files: [
            'Dockerrun.aws.json',
            'dist/**/*',
            'package.json',
            'package-lock.json',
          ],
          name: 'BuildArtifact',
        },
        cache: {
          paths: ['node_modules/**/*'],
        },
      }),
      logging: {
        cloudWatch: {
          logGroup: new cdk.aws_logs.LogGroup(this, 'BuildLogGroup', {
            logGroupName: `/aws/codebuild/${resourceName('build-project')}`,
            retention: cdk.aws_logs.RetentionDays.ONE_WEEK,
            removalPolicy: props.removalPolicy,
          }),
        },
      },
    });

    // Test project for running unit tests
    this.testProject = new codebuild.PipelineProject(this, 'TestProject', {
      projectName: resourceName('test-project'),
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '18',
            },
            commands: ['npm ci'],
          },
          build: {
            commands: [
              'echo Running unit tests...',
              'npm test -- --coverage --watchAll=false',
              'echo Running linting...',
              'npm run lint',
            ],
          },
        },
        reports: {
          coverage_report: {
            files: ['coverage/lcov.info'],
            'file-format': 'LCOV',
          },
          test_report: {
            files: ['test-results/**/*.xml'],
            'file-format': 'JUNITXML',
          },
        },
        artifacts: {
          files: ['coverage/**/*', 'test-results/**/*'],
          name: 'TestArtifact',
        },
      }),
    });
  }

  private createCodeBuildPolicy(
    artifactsBucketArn: string,
    securityConfig: SecurityConfig
  ): iam.PolicyDocument {
    return new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:GetObject',
            's3:PutObject',
            's3:GetBucketLocation',
            's3:ListBucket',
          ],
          resources: [artifactsBucketArn, `${artifactsBucketArn}/*`],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['secretsmanager:GetSecretValue'],
          resources: [
            securityConfig.dbSecret.secretArn,
            securityConfig.apiKeySecret.secretArn,
          ],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['ssm:GetParameter', 'ssm:GetParameters'],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'ecr:GetAuthorizationToken',
            'ecr:BatchCheckLayerAvailability',
            'ecr:GetDownloadUrlForLayer',
            'ecr:PutImage',
            'ecr:InitiateLayerUpload',
            'ecr:UploadLayerPart',
            'ecr:CompleteLayerUpload',
          ],
          resources: ['*'],
        }),
      ],
    });
  }
}
```

## 4. Deploy Stage Configuration

**lib/pipeline/deploy-stage.ts**

```typescript
import * as cdk from 'aws-cdk-lib';
import * as elasticbeanstalk from 'aws-cdk-lib/aws-elasticbeanstalk';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface DeployStageProps {
  config: any;
  removalPolicy: cdk.RemovalPolicy;
}

export class DeployStage extends Construct {
  public readonly application: elasticbeanstalk.CfnApplication;
  public readonly environment: elasticbeanstalk.CfnEnvironment;
  public readonly approvalTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: DeployStageProps) {
    super(scope, id);

    const { config, removalPolicy } = props;
    const resourceName = (resource: string) =>
      `${config.company}-${config.division}-${config.environmentSuffix}-${resource}`;

    // Create SNS topic for manual approval notifications
    this.approvalTopic = new sns.Topic(this, 'ApprovalTopic', {
      topicName: resourceName('approval-topic'),
      displayName: 'Pipeline Approval Notifications',
    });

    // Create Elastic Beanstalk service role
    const ebServiceRole = new iam.Role(this, 'EBServiceRole', {
      roleName: resourceName('eb-service-role'),
      assumedBy: new iam.ServicePrincipal('elasticbeanstalk.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSElasticBeanstalkEnhancedHealth'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AWSElasticBeanstalkManagedUpdatesCustomerRolePolicy'
        ),
      ],
    });

    // Create EC2 instance profile for Elastic Beanstalk
    const ebInstanceRole = new iam.Role(this, 'EBInstanceRole', {
      roleName: resourceName('eb-instance-role'),
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AWSElasticBeanstalkWebTier'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AWSElasticBeanstalkMulticontainerDocker'
        ),
      ],
      inlinePolicies: {
        CustomPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ecr:GetAuthorizationToken',
                'ecr:BatchCheckLayerAvailability',
                'ecr:GetDownloadUrlForLayer',
                'ecr:BatchGetImage',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
      tags: {
        AllowCrossAccountDeployment: 'true',
      },
    });

    const instanceProfile = new iam.CfnInstanceProfile(
      this,
      'InstanceProfile',
      {
        instanceProfileName: resourceName('eb-instance-profile'),
        roles: [ebInstanceRole.roleName],
      }
    );

    // Create Elastic Beanstalk application
    this.application = new elasticbeanstalk.CfnApplication(
      this,
      'Application',
      {
        applicationName: resourceName('app'),
        description: `${config.company} ${config.division} TypeScript Application`,
      }
    );

    if (removalPolicy === cdk.RemovalPolicy.DESTROY) {
      this.application.applyRemovalPolicy(removalPolicy);
    }

    // Create Elastic Beanstalk environment
    this.environment = new elasticbeanstalk.CfnEnvironment(
      this,
      'Environment',
      {
        applicationName: this.application.applicationName!,
        environmentName: resourceName('env'),
        solutionStackName: '64bit Amazon Linux 2023 v4.0.0 running Docker',
        optionSettings: [
          {
            namespace: 'aws:elasticbeanstalk:environment',
            optionName: 'ServiceRole',
            value: ebServiceRole.roleArn,
          },
          {
            namespace: 'aws:autoscaling:launchconfiguration',
            optionName: 'IamInstanceProfile',
            value: instanceProfile.ref,
          },
          {
            namespace: 'aws:autoscaling:launchconfiguration',
            optionName: 'InstanceType',
            value: config.environmentSuffix.includes('prod')
              ? 't3.medium'
              : 't3.small',
          },
          {
            namespace: 'aws:autoscaling:asg',
            optionName: 'MinSize',
            value: config.environmentSuffix.includes('prod') ? '2' : '1',
          },
          {
            namespace: 'aws:autoscaling:asg',
            optionName: 'MaxSize',
            value: config.environmentSuffix.includes('prod') ? '10' : '3',
          },
          {
            namespace: 'aws:elasticbeanstalk:environment',
            optionName: 'EnvironmentType',
            value: 'LoadBalanced',
          },
          {
            namespace: 'aws:elasticbeanstalk:application:environment',
            optionName: 'NODE_ENV',
            value: config.environmentSuffix,
          },
          {
            namespace: 'aws:elasticbeanstalk:application:environment',
            optionName: 'PORT',
            value: '3000',
          },
          {
            namespace: 'aws:elasticbeanstalk:healthreporting:system',
            optionName: 'SystemType',
            value: 'enhanced',
          },
          {
            namespace: 'aws:elasticbeanstalk:managedactions',
            optionName: 'ManagedActionsEnabled',
            value: 'true',
          },
          {
            namespace: 'aws:elasticbeanstalk:managedactions:platformupdate',
            optionName: 'UpdateLevel',
            value: 'minor',
          },
        ],
        tags: [
          {
            key: 'Company',
            value: config.company,
          },
          {
            key: 'Division',
            value: config.division,
          },
          {
            key: 'Environment',
            value: config.environmentSuffix,
          },
        ],
      }
    );

    this.environment.addDependency(this.application);
  }
}
```

## 5. Security Configuration

**lib/security/secrets-config.ts**

```typescript
import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface SecurityConfigProps {
  config: any;
  removalPolicy: cdk.RemovalPolicy;
}

export class SecurityConfig extends Construct {
  public readonly dbSecret: secretsmanager.Secret;
  public readonly apiKeySecret: secretsmanager.Secret;
  public readonly configParams: Map<string, ssm.StringParameter>;

  constructor(scope: Construct, id: string, props: SecurityConfigProps) {
    super(scope, id);

    const { config, removalPolicy } = props;
    const resourceName = (resource: string) =>
      `${config.company}-${config.division}-${config.environmentSuffix}-${resource}`;

    // Create database credentials secret
    this.dbSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: resourceName('db-credentials'),
      description: 'Database credentials for the application',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'admin',
        }),
        generateStringKey: 'password',
        passwordLength: 32,
        excludeCharacters: ' "\'\\',
      },
      removalPolicy,
    });

    // Create API key secret
    this.apiKeySecret = new secretsmanager.Secret(this, 'ApiKeySecret', {
      secretName: resourceName('api-key'),
      description: 'External API key',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          apiKey: cdk.Fn.base64(cdk.Stack.of(this).stackId),
        }),
        generateStringKey: 'apiSecret',
        passwordLength: 48,
      },
      removalPolicy,
    });

    // Create Parameter Store entries for non-sensitive config
    this.configParams = new Map();

    const parameters = {
      'app-config': JSON.stringify({
        appName: `${config.company}-${config.division}`,
        environment: config.environmentSuffix,
        logLevel: config.environmentSuffix.includes('prod') ? 'info' : 'debug',
        features: {
          monitoring: true,
          analytics: config.environmentSuffix.includes('prod'),
        },
      }),
      'database-host': config.environmentSuffix.includes('prod')
        ? 'prod-db.example.com'
        : 'dev-db.example.com',
      'redis-endpoint': config.environmentSuffix.includes('prod')
        ? 'prod-redis.example.com:6379'
        : 'dev-redis.example.com:6379',
      'api-timeout': '30000',
      'max-retries': '3',
    };

    for (const [key, value] of Object.entries(parameters)) {
      const param = new ssm.StringParameter(this, `Param-${key}`, {
        parameterName: `/${config.company}/${config.division}/${config.environmentSuffix}/${key}`,
        stringValue: value,
        description: `Configuration parameter: ${key}`,
        tier: ssm.ParameterTier.STANDARD,
      });

      this.configParams.set(key, param);
    }

    // Add secret rotation for database credentials (production only)
    if (config.environmentSuffix.includes('prod')) {
      new secretsmanager.RotationSchedule(this, 'DbSecretRotation', {
        secret: this.dbSecret,
        rotationLambda: secretsmanager.RotationSchedule.hostedRotation(
          secretsmanager.HostedRotation.mysqlSingleUser()
        ),
        automaticallyAfter: cdk.Duration.days(30),
      });
    }
  }
}
```

## 6. CloudWatch Monitoring

**lib/monitoring/cloudwatch-alarms.ts**

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import { Construct } from 'constructs';
import { SlackNotifier } from './notifications';

export interface MonitoringStackProps {
  config: any;
  pipeline: codepipeline.Pipeline;
  slackWebhookUrl?: string;
}

export class MonitoringStack extends Construct {
  public readonly alertTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id);

    const { config, pipeline, slackWebhookUrl } = props;
    const resourceName = (resource: string) =>
      `${config.company}-${config.division}-${config.environmentSuffix}-${resource}`;

    // Create SNS topic for alerts
    this.alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: resourceName('pipeline-alerts'),
      displayName: 'Pipeline Alert Notifications',
    });

    // Create Slack notifier if webhook URL is provided
    if (slackWebhookUrl) {
      new SlackNotifier(this, 'SlackNotifier', {
        config,
        alertTopic: this.alertTopic,
        slackWebhookUrl,
      });
    }

    // Pipeline failure alarm
    new cloudwatch.Alarm(this, 'PipelineFailureAlarm', {
      alarmName: resourceName('pipeline-failure'),
      alarmDescription: 'Pipeline execution failed',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CodePipeline',
        metricName: 'PipelineExecutionFailure',
        dimensionsMap: {
          PipelineName: pipeline.pipelineName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      actionsEnabled: true,
    }).addAlarmAction(new cloudwatch_actions.SnsAction(this.alertTopic));

    // Pipeline duration alarm (alert if pipeline takes too long)
    new cloudwatch.Alarm(this, 'PipelineDurationAlarm', {
      alarmName: resourceName('pipeline-duration'),
      alarmDescription: 'Pipeline execution taking too long',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CodePipeline',
        metricName: 'PipelineExecutionDuration',
        dimensionsMap: {
          PipelineName: pipeline.pipelineName,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 3600000, // 60 minutes in milliseconds
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      actionsEnabled: true,
    }).addAlarmAction(new cloudwatch_actions.SnsAction(this.alertTopic));

    // Create custom dashboard
    new cloudwatch.Dashboard(this, 'PipelineDashboard', {
      dashboardName: resourceName('pipeline-dashboard'),
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Pipeline Execution Status',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/CodePipeline',
                metricName: 'PipelineExecutionSuccess',
                dimensionsMap: {
                  PipelineName: pipeline.pipelineName,
                },
                statistic: 'Sum',
                period: cdk.Duration.hours(1),
                color: cloudwatch.Color.GREEN,
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/CodePipeline',
                metricName: 'PipelineExecutionFailure',
                dimensionsMap: {
                  PipelineName: pipeline.pipelineName,
                },
                statistic: 'Sum',
                period: cdk.Duration.hours(1),
                color: cloudwatch.Color.RED,
              }),
            ],
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'Pipeline Duration',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/CodePipeline',
                metricName: 'PipelineExecutionDuration',
                dimensionsMap: {
                  PipelineName: pipeline.pipelineName,
                },
                statistic: 'Average',
                period: cdk.Duration.hours(1),
                color: cloudwatch.Color.BLUE,
              }),
            ],
            width: 12,
            height: 6,
          }),
        ],
        [
          new cloudwatch.SingleValueWidget({
            title: 'Success Rate (24h)',
            metrics: [
              new cloudwatch.MathExpression({
                expression: '(m1 / (m1 + m2)) * 100',
                usingMetrics: {
                  m1: new cloudwatch.Metric({
                    namespace: 'AWS/CodePipeline',
                    metricName: 'PipelineExecutionSuccess',
                    dimensionsMap: {
                      PipelineName: pipeline.pipelineName,
                    },
                    statistic: 'Sum',
                    period: cdk.Duration.days(1),
                  }),
                  m2: new cloudwatch.Metric({
                    namespace: 'AWS/CodePipeline',
                    metricName: 'PipelineExecutionFailure',
                    dimensionsMap: {
                      PipelineName: pipeline.pipelineName,
                    },
                    statistic: 'Sum',
                    period: cdk.Duration.days(1),
                  }),
                },
              }),
            ],
            width: 6,
            height: 4,
          }),
          new cloudwatch.SingleValueWidget({
            title: 'Total Executions (24h)',
            metrics: [
              new cloudwatch.MathExpression({
                expression: 'm1 + m2',
                usingMetrics: {
                  m1: new cloudwatch.Metric({
                    namespace: 'AWS/CodePipeline',
                    metricName: 'PipelineExecutionSuccess',
                    dimensionsMap: {
                      PipelineName: pipeline.pipelineName,
                    },
                    statistic: 'Sum',
                    period: cdk.Duration.days(1),
                  }),
                  m2: new cloudwatch.Metric({
                    namespace: 'AWS/CodePipeline',
                    metricName: 'PipelineExecutionFailure',
                    dimensionsMap: {
                      PipelineName: pipeline.pipelineName,
                    },
                    statistic: 'Sum',
                    period: cdk.Duration.days(1),
                  }),
                },
              }),
            ],
            width: 6,
            height: 4,
          }),
        ],
      ],
    });
  }
}
```

## 7. Slack Notification Lambda

**lib/monitoring/notifications.ts**

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambda_nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export interface SlackNotifierProps {
  config: any;
  alertTopic: sns.Topic;
  slackWebhookUrl: string;
}

export class SlackNotifier extends Construct {
  public readonly notificationLambda: lambda_nodejs.NodejsFunction;

  constructor(scope: Construct, id: string, props: SlackNotifierProps) {
    super(scope, id);

    const { config, alertTopic, slackWebhookUrl } = props;
    const resourceName = (resource: string) =>
      `${config.company}-${config.division}-${config.environmentSuffix}-${resource}`;

    // Create Lambda function for Slack notifications
    this.notificationLambda = new lambda_nodejs.NodejsFunction(
      this,
      'SlackNotifierFunction',
      {
        functionName: resourceName('slack-notifier'),
        entry: path.join(__dirname, '../lambda/slack-notifier.ts'),
        handler: 'handler',
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        environment: {
          SLACK_WEBHOOK_URL: slackWebhookUrl,
          ENVIRONMENT: config.environmentSuffix,
          COMPANY: config.company,
          DIVISION: config.division,
        },
        tracing: lambda.Tracing.ACTIVE,
        logRetention: cdk.aws_logs.RetentionDays.ONE_WEEK,
      }
    );

    // Grant Lambda permission to read from SNS
    alertTopic.grantPublish(this.notificationLambda);

    // Subscribe Lambda to SNS topic
    alertTopic.addSubscription(
      new sns_subscriptions.LambdaSubscription(this.notificationLambda)
    );

    // Add additional permissions if needed
    this.notificationLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'codepipeline:GetPipeline',
          'codepipeline:GetPipelineExecution',
          'codepipeline:GetPipelineState',
        ],
        resources: ['*'],
      })
    );
  }
}
```

## 8. Lambda Function for Slack Notifications

**lib/lambda/slack-notifier.ts**

```typescript
import { SNSEvent, Context } from 'aws-lambda';
import {
  CodePipelineClient,
  GetPipelineExecutionCommand,
} from '@aws-sdk/client-codepipeline';
import axios from 'axios';

const codepipelineClient = new CodePipelineClient({});

interface SlackMessage {
  username: string;
  icon_emoji: string;
  attachments: Array<{
    color: string;
    title: string;
    text: string;
    fields: Array<{
      title: string;
      value: string;
      short: boolean;
    }>;
    footer: string;
    ts: number;
  }>;
}

export const handler = async (
  event: SNSEvent,
  context: Context
): Promise<void> => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  const environment = process.env.ENVIRONMENT || 'unknown';
  const company = process.env.COMPANY || 'unknown';
  const division = process.env.DIVISION || 'unknown';

  if (!webhookUrl) {
    console.error('SLACK_WEBHOOK_URL not configured');
    return;
  }

  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.Sns.Message);
      const subject = record.Sns.Subject || 'Pipeline Notification';

      // Parse the message based on type
      let slackMessage: SlackMessage;

      if (message.approval) {
        slackMessage = createApprovalMessage(
          message,
          environment,
          company,
          division
        );
      } else if (message.alarm) {
        slackMessage = createAlarmMessage(
          message,
          environment,
          company,
          division
        );
      } else {
        slackMessage = createGenericMessage(
          subject,
          message,
          environment,
          company,
          division
        );
      }

      // Send to Slack
      await axios.post(webhookUrl, slackMessage);
      console.log('Notification sent to Slack successfully');
    } catch (error) {
      console.error('Error processing SNS message:', error);
      throw error;
    }
  }
};

function createApprovalMessage(
  message: any,
  environment: string,
  company: string,
  division: string
): SlackMessage {
  return {
    username: 'AWS Pipeline Bot',
    icon_emoji: ':rocket:',
    attachments: [
      {
        color: 'warning',
        title: ':hourglass_flowing_sand: Manual Approval Required',
        text: `Pipeline is waiting for manual approval to deploy to ${environment}`,
        fields: [
          {
            title: 'Pipeline',
            value: `${company}-${division}-${environment}`,
            short: true,
          },
          {
            title: 'Stage',
            value: 'Deployment',
            short: true,
          },
          {
            title: 'Action Required',
            value: 'Please review and approve the deployment',
            short: false,
          },
        ],
        footer: 'AWS CodePipeline',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
}

function createAlarmMessage(
  message: any,
  environment: string,
  company: string,
  division: string
): SlackMessage {
  return {
    username: 'AWS Pipeline Bot',
    icon_emoji: ':rotating_light:',
    attachments: [
      {
        color: 'danger',
        title: ':x: Pipeline Alarm Triggered',
        text: message.AlarmDescription || 'A pipeline alarm has been triggered',
        fields: [
          {
            title: 'Alarm Name',
            value: message.AlarmName || 'Unknown',
            short: true,
          },
          {
            title: 'Environment',
            value: environment,
            short: true,
          },
          {
            title: 'State',
            value: message.NewStateValue || 'ALARM',
            short: true,
          },
          {
            title: 'Reason',
            value: message.NewStateReason || 'Threshold exceeded',
            short: false,
          },
        ],
        footer: 'AWS CloudWatch',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
}

function createGenericMessage(
  subject: string,
  message: any,
  environment: string,
  company: string,
  division: string
): SlackMessage {
  return {
    username: 'AWS Pipeline Bot',
    icon_emoji: ':information_source:',
    attachments: [
      {
        color: 'good',
        title: subject,
        text: JSON.stringify(message, null, 2),
        fields: [
          {
            title: 'Environment',
            value: environment,
            short: true,
          },
          {
            title: 'Pipeline',
            value: `${company}-${division}`,
            short: true,
          },
        ],
        footer: 'AWS',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
}
```

## 9. Supporting Configuration Files

**Dockerfile** (in your application root)

```dockerfile
# Multi-stage build for TypeScript application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

**package.json** (Lambda function dependencies)

```json
{
  "name": "slack-notifier-lambda",
  "version": "1.0.0",
  "dependencies": {
    "@aws-sdk/client-codepipeline": "^3.400.0",
    "axios": "^1.5.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.119",
    "@types/node": "^20.5.0",
    "esbuild": "^0.19.2"
  }
}
```

## Usage Example

**bin/tap.ts**

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Development environment
new TapStack(app, 'TapStack-Dev', {
  environmentSuffix: 'dev',
  company: 'acme',
  division: 'tech',
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL_DEV,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// Production environment
new TapStack(app, 'TapStack-Prod', {
  environmentSuffix: 'prod',
  company: 'acme',
  division: 'tech',
  targetAccountId: process.env.PROD_ACCOUNT_ID,
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL_PROD,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```

## Key Features Implemented

### 🔒 Security

- **Secrets Manager** for sensitive data (database credentials, API keys)
- **Parameter Store** for non-sensitive configuration
- **IAM roles** with least privilege principle
- **Cross-account deployment** support with proper role tags
- **Encrypted S3 buckets** for artifacts
- **VPC endpoints** for private communication (can be added)

### 📊 Monitoring & Alerting

- **CloudWatch alarms** for pipeline failures and duration
- **Custom dashboard** with success rates and execution metrics
- **Slack notifications** via Lambda for approvals and alerts
- **Comprehensive logging** with CloudWatch Logs
- **X-Ray tracing** for Lambda functions

### 🚀 CI/CD Features

- **Automated triggers** via S3 EventBridge integration
- **Docker containerization** with ECR
- **Unit test execution** with coverage reports
- **Manual approval** step before production deployment
- **Build caching** for faster builds
- **Artifact versioning** and lifecycle management

### 🏗️ Infrastructure

- **Environment-based removal policies** (DESTROY for non-prod)
- **Comprehensive tagging** for cost tracking
- **Auto-scaling** configuration for Elastic Beanstalk
- **Platform updates** enabled for security patches
- **Enhanced health monitoring** for Elastic Beanstalk

This solution provides a complete, production-ready CI/CD pipeline with all the requested features. The code is modular, maintainable, and follows AWS best practices for security and reliability.
