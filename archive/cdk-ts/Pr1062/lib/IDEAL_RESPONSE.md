```typescript
// tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';

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

    // S3 Buckets for artifacts (cross-region)
    const pipelineArtifactsBucket = new s3.Bucket(this, 'PipelineArtifacts', {
      bucketName: `pipeline-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // West region artifacts bucket
    const westArtifactsBucket = new s3.Bucket(this, 'WestArtifactsBucket', {
      bucketName: `pipeline-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}-west`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudWatch Log Groups for multi-region monitoring
    const logGroup = new logs.LogGroup(this, 'PipelineLogGroup', {
      logGroupName: `/aws/codepipeline/multi-region-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // SNS Topic for notifications
    const notificationTopic = new sns.Topic(this, 'PipelineNotifications', {
      topicName: `pipeline-notifications-${environmentSuffix}`,
      displayName: 'Multi-Region Pipeline Notifications',
    });

    // IAM Role for CodePipeline
    const pipelineRole = new iam.Role(this, 'PipelineRole', {
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      inlinePolicies: {
        PipelinePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:GetBucketVersioning',
                's3:GetObjectVersion',
              ],
              resources: [
                pipelineArtifactsBucket.bucketArn,
                `${pipelineArtifactsBucket.bucketArn}/*`,
                westArtifactsBucket.bucketArn,
                `${westArtifactsBucket.bucketArn}/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudformation:CreateStack',
                'cloudformation:UpdateStack',
                'cloudformation:DescribeStacks',
                'cloudformation:DescribeStackResources',
                'cloudformation:DescribeStackEvents',
                'cloudformation:DeleteStack',
                'cloudformation:GetTemplate',
                'cloudformation:CreateChangeSet',
                'cloudformation:ExecuteChangeSet',
                'cloudformation:DescribeChangeSet',
                'cloudformation:DeleteChangeSet',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'iam:PassRole',
                'iam:CreateRole',
                'iam:PutRolePolicy',
                'iam:DeleteRole',
                'iam:DeleteRolePolicy',
                'iam:GetRole',
                'iam:CreateInstanceProfile',
                'iam:DeleteInstanceProfile',
                'iam:AddRoleToInstanceProfile',
                'iam:RemoveRoleFromInstanceProfile',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ec2:*',
                'autoscaling:*',
                'elasticloadbalancing:*',
                'logs:*',
                'sns:Publish',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // IAM Role for CodeBuild
    const buildRole = new iam.Role(this, 'BuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      inlinePolicies: {
        BuildPolicy: new iam.PolicyDocument({
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
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [
                `${pipelineArtifactsBucket.bucketArn}/*`,
                `${westArtifactsBucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
      },
    });

    // CodeBuild Project with Batch Builds
    const buildProject = new codebuild.Project(this, 'BuildProject', {
      projectName: `multi-region-build-${environmentSuffix}`,
      role: buildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.MEDIUM,
        privileged: true,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        batch: {
          'build-matrix': {
            static: {
              'ignore-failure': false,
            },
            dynamic: {
              env: {
                variables: {
                  DEPLOY_REGION: ['us-east-1', 'us-west-2'],
                  BUILD_TYPE: ['application'],
                },
              },
            },
          },
        },
        phases: {
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              'aws --version',
              'echo Build started on `date`',
              'echo $AWS_DEFAULT_REGION',
              'echo $DEPLOY_REGION',
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'echo Building the application...',
              'mkdir -p build infrastructure',
              'echo "Application built for $DEPLOY_REGION" > build/app.txt',
              'zip -r app-$DEPLOY_REGION.zip build/',
              // Create a simple CloudFormation template for the application
              'cat > infrastructure/app-stack.yaml << EOF',
              'AWSTemplateFormatVersion: "2010-09-09"',
              'Parameters:',
              '  Region:',
              '    Type: String',
              '    Default: us-east-1',
              '  Environment:',
              '    Type: String',
              '    Default: dev',
              'Resources:',
              '  DummyResource:',
              '    Type: AWS::CloudFormation::WaitConditionHandle',
              'Outputs:',
              '  Region:',
              '    Value: !Ref Region',
              '  Environment:',
              '    Value: !Ref Environment',
              'EOF',
            ],
          },
          post_build: {
            commands: ['echo Build completed on `date`'],
          },
        },
        artifacts: {
          files: ['**/*'],
          name: 'BuildArtifact',
        },
      }),
      logging: {
        cloudWatch: {
          logGroup: logGroup,
        },
      },
    });

    // VPC for application infrastructure
    const vpc = new ec2.Vpc(this, 'ApplicationVPC', {
      vpcName: `multi-region-vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 1,
    });

    // Security Group for application servers
    const appSecurityGroup = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
      vpc: vpc,
      securityGroupName: `app-sg-${environmentSuffix}`,
      description: 'Security group for application servers',
      allowAllOutbound: true,
    });

    appSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    appSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Launch Template for EC2 instances
    const instanceRole = new iam.Role(this, 'InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    const launchTemplate = new ec2.LaunchTemplate(this, 'AppLaunchTemplate', {
      launchTemplateName: `app-launch-template-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: appSecurityGroup,
      userData: ec2.UserData.forLinux(),
      role: instanceRole,
    });

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'AppAutoScalingGroup',
      {
        autoScalingGroupName: `app-asg-${environmentSuffix}`,
        vpc: vpc,
        launchTemplate: launchTemplate,
        minCapacity: 1,
        maxCapacity: 5,
        desiredCapacity: 1,
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.minutes(5),
        }),
      }
    );

    // Application Load Balancer
    const loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      'AppLoadBalancer',
      {
        loadBalancerName: `app-alb-${environmentSuffix}`,
        vpc: vpc,
        internetFacing: true,
      }
    );

    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'AppTargetGroup',
      {
        targetGroupName: `app-tg-${environmentSuffix}`,
        vpc: vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targets: [autoScalingGroup],
        healthCheck: {
          enabled: true,
          path: '/',
          protocol: elbv2.Protocol.HTTP,
        },
      }
    );

    loadBalancer.addListener('AppListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // CloudWatch Alarms for monitoring
    const healthyHostAlarm = new cloudwatch.Alarm(this, 'HealthyHostAlarm', {
      alarmName: `healthy-host-alarm-${environmentSuffix}`,
      metric: targetGroup.metricHealthyHostCount(),
      threshold: 1,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
    });

    healthyHostAlarm.addAlarmAction({
      bind: () => ({ alarmActionArn: notificationTopic.topicArn }),
    });

    // Validation CodeBuild Project
    const validationProject = new codebuild.Project(this, 'ValidationProject', {
      projectName: `validation-${environmentSuffix}`,
      role: buildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: [
              'echo "Running deployment validation..."',
              'echo "Simulating health check validation..."',
              'sleep 5',
              'echo "All health checks passed"',
            ],
          },
        },
      }),
    });

    // CodePipeline
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    const pipeline = new codepipeline.Pipeline(this, 'MultiRegionPipeline', {
      pipelineName: `multi-region-pipeline-${environmentSuffix}`,
      role: pipelineRole,
      artifactBucket: pipelineArtifactsBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.S3SourceAction({
              actionName: 'S3Source',
              bucket: pipelineArtifactsBucket,
              bucketKey: 'source.zip',
              output: sourceOutput,
              trigger: codepipeline_actions.S3Trigger.POLL,
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'BuildApplication',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
              executeBatchBuild: true,
            }),
          ],
        },
        {
          stageName: 'Deploy-East',
          actions: [
            new codepipeline_actions.CloudFormationCreateReplaceChangeSetAction(
              {
                actionName: 'CreateChangeSet-East',
                stackName: `app-stack-east-${environmentSuffix}`,
                changeSetName: 'pipeline-changeset',
                adminPermissions: true,
                templatePath: buildOutput.atPath(
                  'infrastructure/app-stack.yaml'
                ),
                parameterOverrides: {
                  Region: 'us-east-1',
                  Environment: environmentSuffix,
                },
                region: 'us-east-1',
                runOrder: 1,
              }
            ),
            new codepipeline_actions.CloudFormationExecuteChangeSetAction({
              actionName: 'ExecuteChangeSet-East',
              stackName: `app-stack-east-${environmentSuffix}`,
              changeSetName: 'pipeline-changeset',
              region: 'us-east-1',
              runOrder: 2,
            }),
          ],
        },
        {
          stageName: 'Deploy-West',
          actions: [
            new codepipeline_actions.CloudFormationCreateReplaceChangeSetAction(
              {
                actionName: 'CreateChangeSet-West',
                stackName: `app-stack-west-${environmentSuffix}`,
                changeSetName: 'pipeline-changeset',
                adminPermissions: true,
                templatePath: buildOutput.atPath(
                  'infrastructure/app-stack.yaml'
                ),
                parameterOverrides: {
                  Region: 'us-west-2',
                  Environment: environmentSuffix,
                },
                region: 'us-west-2',
                runOrder: 1,
              }
            ),
            new codepipeline_actions.CloudFormationExecuteChangeSetAction({
              actionName: 'ExecuteChangeSet-West',
              stackName: `app-stack-west-${environmentSuffix}`,
              changeSetName: 'pipeline-changeset',
              region: 'us-west-2',
              runOrder: 2,
            }),
          ],
        },
        {
          stageName: 'Validate',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'ValidateDeployment',
              project: validationProject,
              input: buildOutput,
              runOrder: 1,
            }),
          ],
        },
      ],
    });

    // CloudTrail for audit logging
    new cloudtrail.Trail(this, 'PipelineTrail', {
      trailName: `multi-region-pipeline-trail-${environmentSuffix}`,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
    });

    // Add failure notifications
    pipeline.onStateChange('PipelineStateChange', {
      target: {
        bind: () => ({ arn: notificationTopic.topicArn }),
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      description: 'Name of the multi-region pipeline',
    });

    new cdk.CfnOutput(this, 'ArtifactsBucketName', {
      value: pipelineArtifactsBucket.bucketName,
      description: 'S3 bucket for pipeline artifacts',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: loadBalancer.loadBalancerDnsName,
      description: 'DNS name of the application load balancer',
    });

    new cdk.CfnOutput(this, 'NotificationTopicArn', {
      value: notificationTopic.topicArn,
      description: 'SNS topic for pipeline notifications',
    });
  }
}

```