import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as path from 'path';

export class TapStackSimplified extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Apply common tags to all resources
    cdk.Tags.of(this).add('Project', 'CI-CD-Pipeline');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Owner', 'DevOps-Team');

    // ========== STORAGE RESOURCES ==========
    // Source code bucket with versioning and lifecycle policies
    const sourceBucket = new s3.Bucket(this, 'SourceBucket', {
      bucketName: `cicd-source-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
        {
          id: 'DeleteIncompleteUploads',
          enabled: true,
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Artifacts bucket for pipeline artifacts
    const artifactsBucket = new s3.Bucket(this, 'ArtifactsBucket', {
      bucketName: `cicd-artifacts-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldArtifacts',
          enabled: true,
          expiration: cdk.Duration.days(90),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ========== IAM ROLES ==========
    // CodePipeline service role
    const pipelineRole = new iam.Role(this, 'PipelineRole', {
      roleName: `cicd-pipeline-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      inlinePolicies: {
        PipelinePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetBucketVersioning',
                's3:GetObject',
                's3:GetObjectVersion',
                's3:PutObject',
              ],
              resources: [
                sourceBucket.bucketArn,
                sourceBucket.arnForObjects('*'),
                artifactsBucket.bucketArn,
                artifactsBucket.arnForObjects('*'),
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'codebuild:BatchGetBuilds',
                'codebuild:StartBuild',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'codedeploy:CreateDeployment',
                'codedeploy:GetApplication',
                'codedeploy:GetApplicationRevision',
                'codedeploy:GetDeployment',
                'codedeploy:GetDeploymentConfig',
                'codedeploy:RegisterApplicationRevision',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['lambda:InvokeFunction'],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // CodeBuild service role
    const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      roleName: `cicd-codebuild-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      inlinePolicies: {
        CodeBuildPolicy: new iam.PolicyDocument({
          statements: [
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
              actions: [
                's3:GetObject',
                's3:GetObjectVersion',
                's3:PutObject',
              ],
              resources: [
                artifactsBucket.bucketArn,
                artifactsBucket.arnForObjects('*'),
              ],
            }),
          ],
        }),
      },
    });

    // CodeDeploy service role
    const codeDeployRole = new iam.Role(this, 'CodeDeployRole', {
      roleName: `cicd-codedeploy-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codedeploy.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSCodeDeployRole'),
      ],
    });

    // Lambda execution role
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      roleName: `cicd-lambda-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
      inlinePolicies: {
        LambdaPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'codedeploy:GetDeployment',
                'codedeploy:GetDeploymentConfig',
                'codedeploy:GetApplication',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudwatch:PutMetricData',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'codepipeline:PutJobSuccessResult',
                'codepipeline:PutJobFailureResult',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // ========== BUILD PROJECTS ==========
    // Build project for application compilation
    const buildProject = new codebuild.Project(this, 'BuildProject', {
      projectName: `cicd-build-${environmentSuffix}`,
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        privileged: true,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Pre-build phase started on `date`',
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'echo Building the application...',
              'echo Build completed on `date`',
            ],
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'echo Creating deployment package...',
            ],
          },
        },
        artifacts: {
          files: [
            '**/*',
          ],
        },
      }),
      artifacts: codebuild.Artifacts.s3({
        bucket: artifactsBucket,
        includeBuildId: true,
        packageZip: true,
      }),
    });

    // Test project for running unit and integration tests
    const testProject = new codebuild.Project(this, 'TestProject', {
      projectName: `cicd-test-${environmentSuffix}`,
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Test phase started on `date`',
            ],
          },
          build: {
            commands: [
              'echo Running unit tests...',
              'echo Running integration tests...',
              'echo Running security scans...',
            ],
          },
          post_build: {
            commands: [
              'echo Test phase completed on `date`',
            ],
          },
        },
        reports: {
          TestReports: {
            files: [
              'test-results.xml',
              'coverage-report.xml',
            ],
            'file-format': 'JUNITXML',
          },
        },
      }),
    });

    // ========== DEPLOYMENT RESOURCES ==========
    // Create VPC for deployment targets
    const vpc = new ec2.Vpc(this, 'DeploymentVpc', {
      vpcName: `cicd-vpc-${environmentSuffix}`,
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
    vpc.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Auto Scaling Group for deployment targets
    const asg = new autoscaling.AutoScalingGroup(this, 'DeploymentASG', {
      autoScalingGroupName: `cicd-asg-${environmentSuffix}`,
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      minCapacity: 1,
      maxCapacity: 3,
      desiredCapacity: 2,
      userData: ec2.UserData.forLinux(),
    });

    // Install CodeDeploy agent
    asg.userData.addCommands(
      'yum update -y',
      'yum install -y ruby wget',
      'cd /home/ec2-user',
      'wget https://aws-codedeploy-us-east-1.s3.us-east-1.amazonaws.com/latest/install',
      'chmod +x ./install',
      './install auto',
      'service codedeploy-agent start'
    );

    // CodeDeploy application
    const deploymentApplication = new codedeploy.ServerApplication(this, 'DeploymentApplication', {
      applicationName: `cicd-app-${environmentSuffix}`,
    });

    // CodeDeploy deployment group
    const deploymentGroup = new codedeploy.ServerDeploymentGroup(this, 'DeploymentGroup', {
      application: deploymentApplication,
      deploymentGroupName: `cicd-dg-${environmentSuffix}`,
      role: codeDeployRole,
      autoScalingGroups: [asg],
      deploymentConfig: codedeploy.ServerDeploymentConfig.ALL_AT_ONCE,
      autoRollback: {
        failedDeployment: true,
        stoppedDeployment: true,
      },
    });

    // ========== LAMBDA VALIDATION FUNCTION ==========
    const validationFunction = new lambda.Function(this, 'ValidationFunction', {
      functionName: `cicd-validation-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'deployment-validator.handler',
      code: lambda.Code.fromAsset(path.join(process.cwd(), 'lib', 'lambda')),
      role: lambdaRole,
      timeout: cdk.Duration.minutes(5),
      environment: {
        ENVIRONMENT_SUFFIX: environmentSuffix,
        LOG_LEVEL: 'INFO',
        POWERTOOLS_SERVICE_NAME: 'deployment-validator',
        POWERTOOLS_METRICS_NAMESPACE: 'CICDPipeline',
      },
      tracing: lambda.Tracing.ACTIVE,
      layers: [
        lambda.LayerVersion.fromLayerVersionArn(
          this,
          'PowertoolsLayer',
          `arn:aws:lambda:${cdk.Aws.REGION}:094274105915:layer:AWSLambdaPowertoolsTypeScript:29`
        ),
      ],
    });

    // ========== MONITORING RESOURCES ==========
    // SNS topic for alarm notifications
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `cicd-alarms-${environmentSuffix}`,
      displayName: 'CI/CD Pipeline Alarms',
    });

    // Add email subscription (replace with actual email)
    alarmTopic.addSubscription(
      new snsSubscriptions.EmailSubscription('devops-team@company.com')
    );

    // ========== CI/CD PIPELINE ==========
    // Source artifact
    const sourceArtifact = new codepipeline.Artifact('SourceArtifact');
    
    // Build artifact
    const buildArtifact = new codepipeline.Artifact('BuildArtifact');

    // Create CodePipeline V2 with parameterized features
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `cicd-pipeline-${environmentSuffix}`,
      pipelineType: codepipeline.PipelineType.V2,
      role: pipelineRole,
      artifactBucket: artifactsBucket,
      restartExecutionOnUpdate: true,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipelineActions.S3SourceAction({
              actionName: 'Source',
              bucket: sourceBucket,
              bucketKey: 'source.zip',
              output: sourceArtifact,
              trigger: codepipelineActions.S3Trigger.POLL,
            }),
          ],
        },
        {
          stageName: 'Test',
          actions: [
            new codepipelineActions.CodeBuildAction({
              actionName: 'RunTests',
              project: testProject,
              input: sourceArtifact,
              runOrder: 1,
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipelineActions.CodeBuildAction({
              actionName: 'Build',
              project: buildProject,
              input: sourceArtifact,
              outputs: [buildArtifact],
              runOrder: 1,
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipelineActions.CodeDeployServerDeployAction({
              actionName: 'Deploy',
              input: buildArtifact,
              deploymentGroup: deploymentGroup,
              runOrder: 1,
            }),
          ],
        },
        {
          stageName: 'Validate',
          actions: [
            new codepipelineActions.LambdaInvokeAction({
              actionName: 'ValidateDeployment',
              lambda: validationFunction,
              userParameters: {
                environmentSuffix: environmentSuffix,
                deploymentId: codepipeline.GlobalVariables.CODEDEPLOY_DEPLOYMENT_ID,
              },
              runOrder: 1,
            }),
          ],
        },
      ],
    });

    // CloudWatch alarm for pipeline failures
    const pipelineFailureAlarm = new cloudwatch.Alarm(this, 'PipelineFailureAlarm', {
      alarmName: `cicd-pipeline-failure-${environmentSuffix}`,
      alarmDescription: 'Alarm when CI/CD pipeline fails',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CodePipeline',
        metricName: 'PipelineExecutionFailure',
        dimensionsMap: {
          PipelineName: pipeline.pipelineName,
        },
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Add alarm action
    pipelineFailureAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alarmTopic)
    );

    // ========== OUTPUTS ==========
    new cdk.CfnOutput(this, 'PipelineArn', {
      value: pipeline.pipelineArn,
      description: 'CI/CD Pipeline ARN',
      exportName: `${environmentSuffix}-PipelineArn`,
    });

    new cdk.CfnOutput(this, 'SourceBucketName', {
      value: sourceBucket.bucketName,
      description: 'Source code S3 bucket name',
      exportName: `${environmentSuffix}-SourceBucketName`,
    });

    new cdk.CfnOutput(this, 'ArtifactsBucketName', {
      value: artifactsBucket.bucketName,
      description: 'Artifacts S3 bucket name',
      exportName: `${environmentSuffix}-ArtifactsBucketName`,
    });

    new cdk.CfnOutput(this, 'ValidationFunctionName', {
      value: validationFunction.functionName,
      description: 'Lambda validation function name',
      exportName: `${environmentSuffix}-ValidationFunctionName`,
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'SNS Alarm topic ARN',
      exportName: `${environmentSuffix}-AlarmTopicArn`,
    });

    new cdk.CfnOutput(this, 'DeploymentApplicationName', {
      value: deploymentApplication.applicationName,
      description: 'CodeDeploy application name',
      exportName: `${environmentSuffix}-DeploymentApplicationName`,
    });

    new cdk.CfnOutput(this, 'BuildProjectName', {
      value: buildProject.projectName,
      description: 'CodeBuild build project name',
      exportName: `${environmentSuffix}-BuildProjectName`,
    });

    new cdk.CfnOutput(this, 'TestProjectName', {
      value: testProject.projectName,
      description: 'CodeBuild test project name',
      exportName: `${environmentSuffix}-TestProjectName`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID for deployment resources',
      exportName: `${environmentSuffix}-VpcId`,
    });

    new cdk.CfnOutput(this, 'AsgName', {
      value: asg.autoScalingGroupName,
      description: 'Auto Scaling Group name',
      exportName: `${environmentSuffix}-AsgName`,
    });
  }
}