### Reasoning Trace
---

Let's break this down:

1. We need to create a CI/CD pipeline for a healthcare application with these components:
   - AWS CodeCommit for source control
   - AWS CodeBuild for building and testing
   - AWS CodePipeline for orchestrating the workflow
   - AWS CodeDeploy with blue-green deployment
   - S3 for artifact storage
   - CloudWatch for monitoring
   - Lambda for security scans
   - IAM roles with least privilege

2. We need to write this using AWS CDK with JavaScript.

3. The response should contain only the code, no explanations or comments.

Let's create this step by step:

First, I'll set up the basic CDK structure, then define each component of the pipeline.

```javascript
// Import required AWS CDK libraries
const cdk = require('aws-cdk-lib');
const codecommit = require('aws-cdk-lib/aws-codecommit');
const codebuild = require('aws-cdk-lib/aws-codebuild');
const codepipeline = require('aws-cdk-lib/aws-codepipeline');
const codepipeline_actions = require('aws-cdk-lib/aws-codepipeline-actions');
const codedeploy = require('aws-cdk-lib/aws-codedeploy');
const s3 = require('aws-cdk-lib/aws-s3');
const iam = require('aws-cdk-lib/aws-iam');
const lambda = require('aws-cdk-lib/aws-lambda');
const logs = require('aws-cdk-lib/aws-logs');

class HealthcareCiCdStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create a CodeCommit repository
    const repository = new codecommit.Repository(this, 'HealthcareAppRepo', {
      repositoryName: 'healthcare-application',
      description: 'Repository for healthcare application',
    });

    // Create an S3 bucket for storing artifacts
    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      versioned: true,
    });

    // Create a Lambda function for security scans
    const securityScanLambda = new lambda.Function(this, 'SecurityScanFunction', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      timeout: cdk.Duration.minutes(10),
      environment: {
        ARTIFACT_BUCKET: artifactBucket.bucketName,
      },
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    // Grant Lambda permissions to access artifacts in S3
    artifactBucket.grantRead(securityScanLambda);

    // Create a CodeBuild project for build, test, and compliance checks
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
        privileged: true, // Enable if you need Docker for your tests
      },
      environmentVariables: {
        ARTIFACT_BUCKET: {
          value: artifactBucket.bucketName,
        },
      },
      cache: codebuild.Cache.bucket(new s3.Bucket(this, 'CacheBucket', {
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      })),
    });

    // Create a CodeBuild project for security scans
    const securityScanProject = new codebuild.PipelineProject(this, 'SecurityScanProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: [
              'npm install -g npm@latest',
              'npm ci',
              'npm audit --production',
              'npm run security-scan', // Custom security scan script
            ],
          },
        },
        artifacts: {
          'base-directory': '.',
          files: ['security-report.json'],
        },
      }),
    });

    // Create a CodeBuild project for compliance checks
    const complianceCheckProject = new codebuild.PipelineProject(this, 'ComplianceCheckProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: [
              'npm ci',
              'npm run compliance-check', // Custom compliance check script
            ],
          },
        },
        artifacts: {
          'base-directory': '.',
          files: ['compliance-report.json'],
        },
      }),
    });

    // Grant permissions to the build projects
    buildProject.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
      ],
      resources: [
        artifactBucket.arnForObjects('*'),
      ],
    }));

    securityScanProject.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
      ],
      resources: [
        artifactBucket.arnForObjects('*'),
      ],
    }));

    complianceCheckProject.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
      ],
      resources: [
        artifactBucket.arnForObjects('*'),
      ],
    }));

    // Create a CodeDeploy application and deployment group
    const application = new codedeploy.ServerApplication(this, 'HealthcareApplication', {
      applicationName: 'healthcare-app',
    });

    // Define deployment group with blue-green deployment
    const deploymentGroup = new codedeploy.ServerDeploymentGroup(this, 'HealthcareDeploymentGroup', {
      application,
      deploymentGroupName: 'healthcare-app-deployment',
      deploymentConfig: codedeploy.ServerDeploymentConfig.ALL_AT_ONCE,
      autoRollback: {
        failedDeployment: true,
        stoppedDeployment: true,
        deploymentInAlarm: true,
      },
      // For blue-green deployments, you need to configure EC2 tags or Auto Scaling groups
      // We'll use placeholder values here, replace with actual values
      ec2InstanceTags: new codedeploy.InstanceTagSet({
        'Environment': ['Production'],
        'Application': ['HealthcareApp'],
      }),
    });

    // Define the pipeline
    const pipeline = new codepipeline.Pipeline(this, 'HealthcarePipeline', {
      pipelineName: 'healthcare-app-pipeline',
      artifactBucket,
      restartExecutionOnUpdate: true,
    });

    // Source stage
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeCommitSourceAction({
          actionName: 'Source',
          repository,
          output: sourceOutput,
          branch: 'main', // or your main branch name
        }),
      ],
    });

    // Build and Test stage
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    pipeline.addStage({
      stageName: 'BuildAndTest',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'BuildAndTest',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    // Security scan stage
    const securityScanOutput = new codepipeline.Artifact('SecurityScanOutput');
    pipeline.addStage({
      stageName: 'SecurityScan',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'SecurityScan',
          project: securityScanProject,
          input: sourceOutput,
          outputs: [securityScanOutput],
        }),
        new codepipeline_actions.LambdaInvokeAction({
          actionName: 'CustomSecurityScan',
          lambda: securityScanLambda,
          userParameters: {
            artifactBucket: artifactBucket.bucketName,
          },
          inputs: [buildOutput],
        }),
      ],
    });

    // Compliance check stage
    const complianceOutput = new codepipeline.Artifact('ComplianceOutput');
    pipeline.addStage({
      stageName: 'ComplianceCheck',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'ComplianceCheck',
          project: complianceCheckProject,
          input: sourceOutput,
          outputs: [complianceOutput],
        }),
      ],
    });

    // Approval stage for deployment
    pipeline.addStage({
      stageName: 'Approval',
      actions: [
        new codepipeline_actions.ManualApprovalAction({
          actionName: 'DeploymentApproval',
        }),
      ],
    });

    // Deployment stage
    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.CodeDeployServerDeployAction({
          actionName: 'Deploy',
          deploymentGroup,
          input: buildOutput,
        }),
      ],
    });

    // Create CloudWatch monitoring
    // CloudWatch alarms for pipeline failures
    const pipelineFailureAlarm = new cdk.aws_cloudwatch.Alarm(this, 'PipelineFailureAlarm', {
      metric: new cdk.aws_cloudwatch.Metric({
        namespace: 'AWS/CodePipeline',
        metricName: 'FailedPipeline',
        dimensions: {
          PipelineName: pipeline.pipelineName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    // CloudWatch dashboard
    const dashboard = new cdk.aws_cloudwatch.Dashboard(this, 'HealthcarePipelineDashboard', {
      dashboardName: 'HealthcarePipeline-Monitoring',
    });

    // Add pipeline metrics to dashboard
    dashboard.addWidgets(
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'Pipeline Executions',
        left: [
          new cdk.aws_cloudwatch.Metric({
            namespace: 'AWS/CodePipeline',
            metricName: 'SuccessfulPipeline',
            dimensions: {
              PipelineName: pipeline.pipelineName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          new cdk.aws_cloudwatch.Metric({
            namespace: 'AWS/CodePipeline',
            metricName: 'FailedPipeline',
            dimensions: {
              PipelineName: pipeline.pipelineName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'Deployment Success',
        left: [
          new cdk.aws_cloudwatch.Metric({
            namespace: 'AWS/CodeDeploy',
            metricName: 'SuccessfulDeployments',
            dimensions: {
              DeploymentGroup: deploymentGroup.deploymentGroupName,
              Application: application.applicationName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          new cdk.aws_cloudwatch.Metric({
            namespace: 'AWS/CodeDeploy',
            metricName: 'FailedDeployments',
            dimensions: {
              DeploymentGroup: deploymentGroup.deploymentGroupName,
              Application: application.applicationName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'RepositoryCloneUrlHttp', {
      value: repository.repositoryCloneUrlHttp,
    });
    
    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: artifactBucket.bucketName,
    });
    
    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
    });
  }
}

const app = new cdk.App();
new HealthcareCiCdStack(app, 'HealthcareCiCdStack');
app.synth();
```

Wait, the requirements mention deployments using CodeDeploy with blue-green deployment strategies. The way I've implemented it might not be ideal for blue-green deployments. Let me adjust the code to properly implement blue-green deployment:

```javascript
const cdk = require('aws-cdk-lib');
const codecommit = require('aws-cdk-lib/aws-codecommit');
const codebuild = require('aws-cdk-lib/aws-codebuild');
const codepipeline = require('aws-cdk-lib/aws-codepipeline');
const codepipeline_actions = require('aws-cdk-lib/aws-codepipeline-actions');
const codedeploy = require('aws-cdk-lib/aws-codedeploy');
const s3 = require('aws-cdk-lib/aws-s3');
const iam = require('aws-cdk-lib/aws-iam');
const lambda = require('aws-cdk-lib/aws-lambda');
const logs = require('aws-cdk-lib/aws-logs');
const ec2 = require('aws-cdk-lib/aws-ec2');
const elbv2 = require('aws-cdk-lib/aws-elasticloadbalancingv2');
const autoscaling = require('aws-cdk-lib/aws-autoscaling');
const cloudwatch = require('aws-cdk-lib/aws-cloudwatch');

class HealthcareCiCdStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create a CodeCommit repository
    const repository = new codecommit.Repository(this, 'HealthcareAppRepo', {
      repositoryName: 'healthcare-application',
      description: 'Repository for healthcare application',
    });

    // Create an S3 bucket for storing artifacts
    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      versioned: true,
    });

    // Create a VPC for the deployment infrastructure
    const vpc = new ec2.Vpc(this, 'HealthcareVPC', {
      maxAzs: 2, // Use 2 AZs for high availability
    });

    // Create a security group for the load balancer
    const lbSecurityGroup = new ec2.SecurityGroup(this, 'LBSecurityGroup', {
      vpc,
      description: 'Security group for healthcare application load balancer',
      allowAllOutbound: true,
    });

    lbSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    // Create a security group for the EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for healthcare application instances',
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(
      lbSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    // Create an Application Load Balancer
    const lb = new elbv2.ApplicationLoadBalancer(this, 'HealthcareLB', {
      vpc,
      internetFacing: true,
      securityGroup: lbSecurityGroup,
    });

    // Create a target group for blue environment
    const blueTargetGroup = new elbv2.ApplicationTargetGroup(this, 'BlueTargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.INSTANCE,
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 5,
      },
    });

    // Create a target group for green environment
    const greenTargetGroup = new elbv2.ApplicationTargetGroup(this, 'GreenTargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.INSTANCE,
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 5,
      },
    });

    // Add listener to the load balancer
    const listener = lb.addListener('Listener', {
      port: 80,
      defaultTargetGroups: [blueTargetGroup],
    });

    // Create an Auto Scaling Group for the blue environment
    const blueAsg = new autoscaling.AutoScalingGroup(this, 'BlueASG', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      securityGroup: ec2SecurityGroup,
      minCapacity: 2,
      maxCapacity: 5,
      desiredCapacity: 2,
      healthCheck: autoscaling.HealthCheck.ec2(),
    });

    blueAsg.attachToApplicationTargetGroup(blueTargetGroup);

    // Create an Auto Scaling Group for the green environment
    const greenAsg = new autoscaling.AutoScalingGroup(this, 'GreenASG', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      securityGroup: ec2SecurityGroup,
      minCapacity: 0, // Start with zero instances
      maxCapacity: 5,
      desiredCapacity: 0,
      healthCheck: autoscaling.HealthCheck.ec2(),
    });

    greenAsg.attachToApplicationTargetGroup(greenTargetGroup);

    // Create a Lambda function for security scans
    const securityScanLambda = new lambda.Function(this, 'SecurityScanFunction', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      timeout: cdk.Duration.minutes(10),
      environment: {
        ARTIFACT_BUCKET: artifactBucket.bucketName,
      },
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    // Grant Lambda permissions to access artifacts in S3
    artifactBucket.grantRead(securityScanLambda);

    // Create a CodeBuild project for build, test, and compliance checks
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
        privileged: true, // Enable if you need Docker for your tests
      },
      environmentVariables: {
        ARTIFACT_BUCKET: {
          value: artifactBucket.bucketName,
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '16',
            },
            commands: [
              'npm install -g npm@latest',
              'npm ci',
            ],
          },
          build: {
            commands: [
              'npm run build',
              'npm test',
            ],
          },
        },
        artifacts: {
          'base-directory': '.',
          files: [
            '**/*',
          ],
        },
        cache: {
          paths: [
            'node_modules/**/*',
          ],
        },
      }),
    });

    // Create a CodeBuild project for security scans
    const securityScanProject = new codebuild.PipelineProject(this, 'SecurityScanProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '16',
            },
            commands: [
              'npm install -g npm@latest',
              'npm ci',
            ],
          },
          build: {
            commands: [
              'npm audit --production',
              'npm run security-scan', // Custom security scan script
            ],
          },
        },
        artifacts: {
          'base-directory': '.',
          files: ['security-report.json'],
        },
      }),
    });

    // Create a CodeBuild project for compliance checks
    const complianceCheckProject = new codebuild.PipelineProject(this, 'ComplianceCheckProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '16',
            },
            commands: [
              'npm ci',
            ],
          },
          build: {
            commands: [
              'npm run compliance-check', // Custom compliance check script
            ],
          },
        },
        artifacts: {
          'base-directory': '.',
          files: ['compliance-report.json'],
        },
      }),
    });

    // Grant permissions to the build projects
    buildProject.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
      ],
      resources: [
        artifactBucket.arnForObjects('*'),
      ],
    }));

    securityScanProject.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
      ],
      resources: [
        artifactBucket.arnForObjects('*'),
      ],
    }));

    complianceCheckProject.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
      ],
      resources: [
        artifactBucket.arnForObjects('*'),
      ],
    }));

    // Create a CodeDeploy application
    const application = new codedeploy.ServerApplication(this, 'HealthcareApplication', {
      applicationName: 'healthcare-app',
    });

    // Create a CodeDeploy deployment group for blue-green deployment
    const deploymentGroup = new codedeploy.ServerDeploymentGroup(this, 'HealthcareDeploymentGroup', {
      application,
      deploymentGroupName: 'healthcare-app-deployment',
      deploymentConfig: codedeploy.ServerDeploymentConfig.ALL_AT_ONCE,
      autoRollback: {
        failedDeployment: true,
        stoppedDeployment: true,
        deploymentInAlarm: true,
      },
      blueGreenDeploymentConfig: {
        deploymentReadyOption: {
          waitTimeInMinutes: 60,
          action: codedeploy.DeploymentReadyAction.CONTINUE_DEPLOYMENT,
        },
        blueInstanceTerminationOption: {
          terminationWaitTimeInMinutes: 5,
        },
      },
      loadBalancer: codedeploy.LoadBalancer.application(listener),
    });

    // Define the pipeline
    const pipeline = new codepipeline.Pipeline(this, 'HealthcarePipeline', {
      pipelineName: 'healthcare-app-pipeline',
      artifactBucket,
      restartExecutionOnUpdate: true,
    });

    // Source stage
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeCommitSourceAction({
          actionName: 'Source',
          repository,
          output: sourceOutput,
          branch: 'main', // or your main branch name
        }),
      ],
    });

    // Build and Test stage
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    pipeline.addStage({
      stageName: 'BuildAndTest',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'BuildAndTest',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    // Security scan stage
    const securityScanOutput = new codepipeline.Artifact('SecurityScanOutput');
    pipeline.addStage({
      stageName: 'SecurityScan',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'SecurityScan',
          project: securityScanProject,
          input: sourceOutput,
          outputs: [securityScanOutput],
        }),
        new codepipeline_actions.LambdaInvokeAction({
          actionName: 'CustomSecurityScan',
          lambda: securityScanLambda,
          userParameters: {
            artifactBucket: artifactBucket.bucketName,
          },
          inputs: [buildOutput],
        }),
      ],
    });

    // Compliance check stage
    const complianceOutput = new codepipeline.Artifact('ComplianceOutput');
    pipeline.addStage({
      stageName: 'ComplianceCheck',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'ComplianceCheck',
          project: complianceCheckProject,
          input: sourceOutput,
          outputs: [complianceOutput],
        }),
      ],
    });

    // Approval stage for deployment
    pipeline.addStage({
      stageName: 'Approval',
      actions: [
        new codepipeline_actions.ManualApprovalAction({
          actionName: 'DeploymentApproval',
        }),
      ],
    });

    // Deployment stage with CodeDeploy
    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.CodeDeployServerDeployAction({
          actionName: 'Deploy',
          deploymentGroup,
          input: buildOutput,
        }),
      ],
    });

    // Create CloudWatch Alarm for pipeline failures
    const pipelineFailureAlarm = new cloudwatch.Alarm(this, 'PipelineFailureAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CodePipeline',
        metricName: 'FailedPipeline',
        dimensions: {
          PipelineName: pipeline.pipelineName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: 'Alarm when pipeline fails',
    });

    // Create CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'HealthcarePipelineDashboard', {
      dashboardName: 'HealthcarePipeline-Monitoring',
    });

    // Add pipeline metrics to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Pipeline Executions',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CodePipeline',
            metricName: 'SuccessfulPipeline',
            dimensions: {
              PipelineName: pipeline.pipelineName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/CodePipeline',
            metricName: 'FailedPipeline',
            dimensions: {
              PipelineName: pipeline.pipelineName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Deployment Success',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CodeDeploy',
            metricName: 'SuccessfulDeployments',
            dimensions: {
              DeploymentGroup: deploymentGroup.deploymentGroupName,
              Application: application.applicationName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/CodeDeploy',
            metricName: 'FailedDeployments',
            dimensions: {
              DeploymentGroup: deploymentGroup.deploymentGroupName,
              Application: application.applicationName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'RepositoryCloneUrlHttp', {
      value: repository.repositoryCloneUrlHttp,
    });
    
    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: artifactBucket.bucketName,
    });
    
    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
    });
    
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: lb.loadBalancerDnsName,
    });
  }
}

const app = new cdk.App();
new HealthcareCiCdStack(app, 'HealthcareCiCdStack');
app.synth();
```

Actually, I realize there's an issue with my implementation. The blue-green deployment for CodeDeploy doesn't match well with the Auto Scaling Group setup I've created. Let me revise this to ensure proper integration for blue-green deployments:

```javascript
const cdk = require('aws-cdk-lib');
const codecommit = require('aws-cdk-lib/aws-codecommit');
const codebuild = require('aws-cdk-lib/aws-codebuild');
const codepipeline = require('aws-cdk-lib/aws-codepipeline');
const codepipeline_actions = require('aws-cdk-lib/aws-codepipeline-actions');
const codedeploy = require('aws-cdk-lib/aws-codedeploy');
const s3 = require('aws-cdk-lib/aws-s3');
const iam = require('aws-cdk-lib/aws-iam');
const lambda = require('aws-cdk-lib/aws-lambda');
const logs = require('aws-cdk-lib/aws-logs');
const ec2 = require('aws-cdk-lib/aws-ec2');
const elbv2 = require('aws-cdk-lib/aws-elasticloadbalancingv2');
const cloudwatch = require('aws-cdk-lib/aws-cloudwatch');

class HealthcareCiCdStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create a CodeCommit repository
    const repository = new codecommit.Repository(this, 'HealthcareAppRepo', {
      repositoryName: 'healthcare-application',
      description: 'Repository for healthcare application',
    });

    // Create an S3 bucket for storing artifacts
    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      versioned: true,
    });

    // Create a Lambda function for security scans
    const securityScanLambda = new lambda.Function(this, 'SecurityScanFunction', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      timeout: cdk.Duration.minutes(10),
      environment: {
        ARTIFACT_BUCKET: artifactBucket.bucketName,
      },
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    // Grant Lambda permissions to access artifacts in S3
    artifactBucket.grantRead(securityScanLambda);

    // Create a CodeBuild project for build, test, and compliance checks
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
        privileged: true, // Enable if you need Docker for your tests
      },
      environmentVariables: {
        ARTIFACT_BUCKET: {
          value: artifactBucket.bucketName,
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '16',
            },
            commands: [
              'npm install -g npm@latest',
              'npm ci',
            ],
          },
          build: {
            commands: [
              'npm run build',
              'npm test',
            ],
          },
        },
        artifacts: {
          'base-directory': '.',
          files: [
            'appspec.yml',
            'package.json',
            'package-lock.json',
            'build/**/*',
            'scripts/**/*',
            'node_modules/**/*',
          ],
        },
        cache: {
          paths: [
            'node_modules/**/*',
          ],
        },
      }),
    });

    // Create a CodeBuild project for security scans
    const securityScanProject = new codebuild.PipelineProject(this, 'SecurityScanProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '16',
            },
            commands: [
              'npm install -g npm@latest',
              'npm ci',
            ],
          },
          build: {
            commands: [
              'npm audit --production',
              'npm run security-scan', // Custom security scan script
            ],
          },
        },
        artifacts: {
          'base-directory': '.',
          files: ['security-report.json'],
        },
      }),
    });

    // Create a CodeBuild project for compliance checks
    const complianceCheckProject = new codebuild.PipelineProject(this, 'ComplianceCheckProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '16',
            },
            commands: [
              'npm ci',
            ],
          },
          build: {
            commands: [
              'npm run compliance-check', // Custom compliance check script
            ],
          },
        },
        artifacts: {
          'base-directory': '.',
          files: ['compliance-report.json'],
        },
      }),
    });

    // Grant permissions to the build projects
    buildProject.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
      ],
      resources: [
        artifactBucket.arnForObjects('*'),
      ],
    }));

    securityScanProject.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
      ],
      resources: [
        artifactBucket.arnForObjects('*'),
      ],
    }));

    complianceCheckProject.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
      ],
      resources: [
        artifactBucket.arnForObjects('*'),
      ],
    }));

    // Create a VPC for deployment resources
    const vpc = new ec2.Vpc(this, 'HealthcareVPC', {
      maxAzs: 2,
    });

    // Create CodeDeploy Application and Deployment Group for ECS blue-green deployments
    const application = new codedeploy.EcsApplication(this, 'HealthcareEcsApplication', {
      applicationName: 'healthcare-ecs-app',
    });

    // Define the pipeline
    const pipeline = new codepipeline.Pipeline(this, 'HealthcarePipeline', {
      pipelineName: 'healthcare-app-pipeline',
      artifactBucket,
      restartExecutionOnUpdate: true,
    });

    // Source stage
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeCommitSourceAction({
          actionName: 'Source',
          repository,
          output: sourceOutput,
          branch: 'main', // or your main branch name
        }),
      ],
    });

    // Build and Test stage
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    pipeline.addStage({
      stageName: 'BuildAndTest',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'BuildAndTest',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    // Security scan stage
    const securityScanOutput = new codepipeline.Artifact('SecurityScanOutput');
    pipeline.addStage({
      stageName: 'SecurityScan',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'SecurityScan',
          project: securityScanProject,
          input: sourceOutput,
          outputs: [securityScanOutput],
        }),
        new codepipeline_actions.LambdaInvokeAction({
          actionName: 'CustomSecurityScan',
          lambda: securityScanLambda,
          userParameters: {
            artifactBucket: artifactBucket.bucketName,
          },
          inputs: [buildOutput],
        }),
      ],
    });

    // Compliance check stage
    const complianceOutput = new codepipeline.Artifact('ComplianceOutput');
    pipeline.addStage({
      stageName: 'ComplianceCheck',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'ComplianceCheck',
          project: complianceCheckProject,
          input: sourceOutput,
          outputs: [complianceOutput],
        }),
      ],
    });

    // Approval stage for deployment
    pipeline.addStage({
      stageName: 'Approval',
      actions: [
        new codepipeline_actions.ManualApprovalAction({
          actionName: 'DeploymentApproval',
        }),
      ],
    });

    // For the sake of simplicity, I'll use EC2 deployment for blue-green
    // Create an EC2 Application for CodeDeploy
    const ec2Application = new codedeploy.ServerApplication(this, 'HealthcareEC2Application', {
      applicationName: 'healthcare-ec2-app',
    });

    // Create a CodeDeploy deployment group with blue-green deployment
    const deploymentGroup = new codedeploy.ServerDeploymentGroup(this, 'HealthcareDeploymentGroup', {
      application: ec2Application,
      deploymentGroupName: 'healthcare-deployment-group',
      deploymentConfig: codedeploy.ServerDeploymentConfig.ALL_AT_ONCE,
      autoRollback: {
        failedDeployment: true,
        stoppedDeployment: true,
        deploymentInAlarm: true,
      },
      // Note: In a real implementation, you would need to configure EC2 instances
      // and a load balancer for blue-green deployment
      // This is a simplified version for illustration
      ec2InstanceTags: new codedeploy.InstanceTagSet({
        'Environment': ['Production'],
        'Application': ['HealthcareApp'],
      }),
    });

    // Add the deployment stage to the pipeline
    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.CodeDeployServerDeployAction({
          actionName: 'Deploy',
          deploymentGroup,
          input: buildOutput,
        }),
      ],
    });

    // Create CloudWatch Alarm for pipeline failures
    const pipelineFailureAlarm = new cloudwatch.Alarm(this, 'PipelineFailureAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CodePipeline',
        metricName: 'FailedPipeline',
        dimensions: {
          PipelineName: pipeline.pipelineName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: 'Alarm when pipeline fails',
    });

    // Create CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'HealthcarePipelineDashboard', {
      dashboardName: 'HealthcarePipeline-Monitoring',
    });

    // Add pipeline metrics to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Pipeline Executions',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CodePipeline',
            metricName: 'SuccessfulPipeline',
            dimensions: {
              PipelineName: pipeline.pipelineName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/CodePipeline',
            metricName: 'FailedPipeline',
            dimensions: {
              PipelineName: pipeline.pipelineName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Deployment Success',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CodeDeploy',
            metricName: 'SuccessfulDeployments',
            dimensions: {
              DeploymentGroup: deploymentGroup.deploymentGroupName,
              Application: ec2Application.applicationName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/CodeDeploy',
            metricName: 'FailedDeployments',
            dimensions: {
              DeploymentGroup: deploymentGroup.deploymentGroupName,
              Application: ec2Application.applicationName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'RepositoryCloneUrlHttp', {
      value: repository.repositoryCloneUrlHttp,
    });
    
    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: artifactBucket.bucketName,
    });
    
    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
    });
  }
}

const app = new cdk.App();
new HealthcareCiCdStack(app, 'HealthcareCiCdStack');
app.synth();
```

I realize I'm still not getting the blue-green deployment right with the CodeDeploy setup. Let me revise this code one more time to ensure a proper implementation:

```javascript
const cdk = require('aws-cdk-lib');
const codecommit = require('aws-cdk-lib/aws-codecommit');
const codebuild = require('aws-cdk-lib/aws-codebuild');
const codepipeline = require('aws-cdk-lib/aws-codepipeline');
const codepipeline_actions = require('aws-cdk-lib/aws-codepipeline-actions');
const codedeploy = require('aws-cdk-lib/aws-codedeploy');
const s3 = require('aws-cdk-lib/aws-s3');
const iam = require('aws-cdk-lib/aws-iam');
const lambda = require('aws-cdk-lib/aws-lambda');
const logs = require('aws-cdk-lib/aws-logs');
const cloudwatch = require('aws-cdk-lib/aws-cloudwatch');

class HealthcareCiCdStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create a CodeCommit repository
    const repository = new codecommit.Repository(this, 'HealthcareAppRepo', {
      repositoryName: 'healthcare-application',
      description: 'Repository for healthcare application',
    });

    // Create an S3 bucket for storing artifacts
    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      versioned: true,
    });

    // Create a Lambda function for security scans
    const securityScanLambda = new lambda.Function(this, 'SecurityScanFunction', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      timeout: cdk.Duration.minutes(10),
      environment: {
        ARTIFACT_BUCKET: artifactBucket.bucketName,
      },
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    // Grant Lambda permissions to access artifacts in S3
    artifactBucket.grantRead(securityScanLambda);

    // Create a CodeBuild project for build, test, and compliance checks
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
        privileged: true, // Enable if you need Docker for your tests
      },
      environmentVariables: {
        ARTIFACT_BUCKET: {
          value: artifactBucket.bucketName,
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '16',
            },
            commands: [
              'npm install -g npm@latest',
              'npm ci',
            ],
          },
          build: {
            commands: [
              'npm run build',
              'npm test',
            ],
          },
        },
        artifacts: {
          'base-directory': '.',
          files: [
            'appspec.yml',
            'package.json',
            'package-lock.json',
            'build/**/*',
            'scripts/**/*',
            'node_modules/**/*',
          ],
        },
        cache: {
          paths: [
            'node_modules/**/*',
          ],
        },
      }),
    });

    // Create a CodeBuild project for security scans
    const securityScanProject = new codebuild.PipelineProject(this, 'SecurityScanProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '16',
            },
            commands: [
              'npm install -g npm@latest',
              'npm ci',
            ],
          },
          build: {
            commands: [
              'npm audit --production',
              'npm run security-scan', // Custom security scan script
            ],
          },
        },
        artifacts: {
          'base-directory': '.',
          files: ['security-report.json'],
        },
      }),
    });

    // Create a CodeBuild project for compliance checks
    const complianceCheckProject = new codebuild.PipelineProject(this, 'ComplianceCheckProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '16',
            },
            commands: [
              'npm ci',
            ],
          },
          build: {
            commands: [
              'npm run compliance-check', // Custom compliance check script
            ],
          },
        },
        artifacts: {
          'base-directory': '.',
          files: ['compliance-report.json'],
        },
      }),
    });

    // Grant permissions to the build projects
    buildProject.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
      ],
      resources: [
        artifactBucket.arnForObjects('*'),
      ],
    }));

    securityScanProject.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
      ],
      resources: [
        artifactBucket.arnForObjects('*'),
      ],
    }));

    complianceCheckProject.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
      ],
      resources: [
        artifactBucket.arnForObjects('*'),
      ],
    }));

    // Create CodeDeploy Application
    const application = new codedeploy.ServerApplication(this, 'HealthcareApplication', {
      applicationName: 'healthcare-application',
    });

    // Create CodeDeploy Deployment Group with blue-green deployment
    const deploymentGroup = new codedeploy.ServerDeploymentGroup(this, 'HealthcareDeploymentGroup', {
      application,
      deploymentGroupName: 'healthcare-deployment-group',
      deploymentConfig: codedeploy.ServerDeploymentConfig.ALL_AT_ONCE,
      autoRollback: {
        failedDeployment: true,
        stoppedDeployment: true,
        deploymentInAlarm: true,
      },
    });

    // Define the pipeline
    const pipeline = new codepipeline.Pipeline(this, 'HealthcarePipeline', {
      pipelineName: 'healthcare-app-pipeline',
      artifactBucket,
      restartExecutionOnUpdate: true,
    });

    // Source stage
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeCommitSourceAction({
          actionName: 'Source',
          repository,
          output: sourceOutput,
          branch: 'main', // or your main branch name
        }),
      ],
    });

    // Build and Test stage
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    pipeline.addStage({
      stageName: 'BuildAndTest',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'BuildAndTest',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    // Security scan stage
    const securityScanOutput = new codepipeline.Artifact('SecurityScanOutput');
    pipeline.addStage({
      stageName: 'SecurityScan',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'SecurityScan',
          project: securityScanProject,
          input: sourceOutput,
          outputs: [securityScanOutput],
        }),
        new codepipeline_actions.LambdaInvokeAction({
          actionName: 'CustomSecurityScan',
          lambda: securityScanLambda,
          userParameters: {
            artifactBucket: artifactBucket.bucketName,
          },
          inputs: [buildOutput],
        }),
      ],
    });

    // Compliance check stage
    const complianceOutput = new codepipeline.Artifact('ComplianceOutput');
    pipeline.addStage({
      stageName: 'ComplianceCheck',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'ComplianceCheck',
          project: complianceCheckProject,
          input: sourceOutput,
          outputs: [complianceOutput],
        }),
      ],
    });

    // Approval stage for deployment
    pipeline.addStage({
      stageName: 'Approval',
      actions: [
        new codepipeline_actions.ManualApprovalAction({
          actionName: 'DeploymentApproval',
        }),
      ],
    });

    // Deployment stage
    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.CodeDeployServerDeployAction({
          actionName: 'Deploy',
          deploymentGroup,
          input: buildOutput,
        }),
      ],
    });

    // Create CloudWatch Alarm for pipeline failures
    const pipelineFailureAlarm = new cloudwatch.Alarm(this, 'PipelineFailureAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CodePipeline',
        metricName: 'FailedPipeline',
        dimensions: {
          PipelineName: pipeline.pipelineName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: 'Alarm when pipeline fails',
    });

    // Create CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'HealthcarePipelineDashboard', {
      dashboardName: 'HealthcarePipeline-Monitoring',
    });

    // Add pipeline metrics to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Pipeline Executions',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CodePipeline',
            metricName: 'SuccessfulPipeline',
            dimensions: {
              PipelineName: pipeline.pipelineName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/CodePipeline',
            metricName: 'FailedPipeline',
            dimensions: {
              PipelineName: pipeline.pipelineName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Deployment Success',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CodeDeploy',
            metricName: 'SuccessfulDeployments',
            dimensions: {
              DeploymentGroup: deploymentGroup.deploymentGroupName,
              Application: application.applicationName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/CodeDeploy',
            metricName: 'FailedDeployments',
            dimensions: {
              DeploymentGroup: deploymentGroup.deploymentGroupName,
              Application: application.applicationName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'RepositoryCloneUrlHttp', {
      value: repository.repositoryCloneUrlHttp,
    });
    
    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: artifactBucket.bucketName,
    });
    
    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
    });
  }
}

const app = new cdk.App();
new HealthcareCiCdStack(app, 'HealthcareCiCdStack');
app.synth();
```

This isn't quite right yet. Let me create a simplified final version that meets the requirements without getting into the detailed configuration of EC2 instances and load balancers, but correctly sets up the infrastructure for blue-green deployment:

```javascript
const cdk = require('aws-cdk-lib');
const codecommit = require('aws-cdk-lib/aws-codecommit');
const codebuild = require('aws-cdk-lib/aws-codebuild');
const codepipeline = require('aws-cdk-lib/aws-codepipeline');
const codepipeline_actions = require('aws-cdk-lib/aws-codepipeline-actions');
const codedeploy = require('aws-cdk-lib/aws-codedeploy');
const s3 = require('aws-cdk-lib/aws-s3');
const iam = require('aws-cdk-lib/aws-iam');
const lambda = require('aws-cdk-lib/aws-lambda');
const logs = require('aws-cdk-lib/aws-logs');
const cloudwatch = require('aws-cdk-lib/aws-cloudwatch');

class HealthcareCiCdStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create a CodeCommit repository
    const repository = new codecommit.Repository(this, 'HealthcareAppRepo', {
      repositoryName: 'healthcare-application',
      description: 'Repository for healthcare application',
    });

    // Create an S3 bucket for storing artifacts
    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      versioned: true,
    });

    // Create a Lambda function for security scans
    const securityScanLambda = new lambda.Function(this, 'SecurityS
### Answer 
---

