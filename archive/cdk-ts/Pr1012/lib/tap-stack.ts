import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

// ? Import your stacks here
// import { MyStack } from './my-stack';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix;

    // ===========================================
    // VPC Configuration
    // ===========================================
    const vpc = new ec2.Vpc(this, 'CicdVpc', {
      vpcName: `nodejs-cicd-vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // ==========================================
    // S3 Bucket for Source Code Repository
    // ==========================================
    const sourceCodeBucket = new s3.Bucket(this, 'SourceCodeBucket', {
      bucketName: `nodejs-app-source-${environmentSuffix}-${this.account}-${this.region}`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      eventBridgeEnabled: true, // Enable EventBridge for pipeline triggers
    });

    // S3 Bucket for CodePipeline Artifacts
    const artifactsBucket = new s3.Bucket(this, 'ArtifactsBucket', {
      bucketName: `codepipeline-artifacts-${environmentSuffix}-${this.account}-${this.region}`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ===========================================
    // IAM Roles and Policies
    // ===========================================

    // EC2 Instance Role for CodeDeploy Agent
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      roleName: `nodejs-ec2-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Allow EC2 to download artifacts from S3
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:ListBucket'],
        resources: [
          artifactsBucket.bucketArn,
          `${artifactsBucket.bucketArn}/*`,
        ],
      })
    );

    // CodeDeploy Service Role
    const codeDeployRole = new iam.Role(this, 'CodeDeployServiceRole', {
      roleName: `nodejs-codedeploy-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codedeploy.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSCodeDeployRole'
        ),
      ],
    });

    // CodeBuild Service Role
    const codeBuildRole = new iam.Role(this, 'CodeBuildServiceRole', {
      roleName: `nodejs-codebuild-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
    });

    // CodePipeline Service Role
    const codePipelineRole = new iam.Role(this, 'CodePipelineServiceRole', {
      roleName: `nodejs-codepipeline-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
    });

    // ===========================================
    // EC2 Instance Configuration
    // ===========================================

    // Security Group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      securityGroupName: `nodejs-ec2-sg-${environmentSuffix}`,
      description: 'Security group for Node.js application EC2 instances',
      allowAllOutbound: true,
    });

    // Allow HTTP traffic
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    // Allow HTTPS traffic
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Allow Node.js application port (assuming port 3000)
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(3000),
      'Allow Node.js application traffic'
    );

    // User data script to install CodeDeploy agent and Node.js
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      // Update system
      'yum update -y',

      // Install Node.js 18.x
      'curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -',
      'yum install -y nodejs',

      // Install CodeDeploy agent
      'yum install -y ruby wget',
      'cd /home/ec2-user',
      'wget https://aws-codedeploy-' +
        this.region +
        '.s3.' +
        this.region +
        '.amazonaws.com/latest/install',
      'chmod +x ./install',
      './install auto',

      // Start CodeDeploy agent
      'service codedeploy-agent start',
      'chkconfig codedeploy-agent on',

      // Create application directory
      'mkdir -p /var/www/nodejs-app',
      'chown ec2-user:ec2-user /var/www/nodejs-app',

      // Install PM2 for process management
      'npm install -g pm2',

      // Create a simple systemd service for the application
      'cat > /etc/systemd/system/nodejs-app.service << EOF',
      '[Unit]',
      'Description=Node.js Application',
      'After=network.target',
      '',
      '[Service]',
      'Type=simple',
      'User=ec2-user',
      'WorkingDirectory=/var/www/nodejs-app',
      'ExecStart=/usr/bin/node server.js',
      'Restart=on-failure',
      'RestartSec=10',
      'Environment=NODE_ENV=production',
      'Environment=PORT=3000',
      '',
      '[Install]',
      'WantedBy=multi-user.target',
      'EOF',

      'systemctl daemon-reload'
    );

    // EC2 Instance Profile is created automatically when using role in LaunchTemplate

    // Launch Template for EC2 instances
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      'NodejsAppLaunchTemplate',
      {
        launchTemplateName: `nodejs-app-lt-${environmentSuffix}`,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        securityGroup: ec2SecurityGroup,
        userData: userData,
        role: ec2Role,
      }
    );

    // Auto Scaling Group for rolling deployments
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'NodejsAppASG',
      {
        autoScalingGroupName: `nodejs-app-asg-${environmentSuffix}`,
        vpc,
        launchTemplate, // from your code
        minCapacity: 1,
        maxCapacity: 3,
        desiredCapacity: 2,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      }
    );

    // Tag instances for CodeDeploy
    cdk.Tags.of(autoScalingGroup).add('Name', `NodejsApp-${environmentSuffix}`);
    cdk.Tags.of(autoScalingGroup).add('Environment', environmentSuffix);

    // ===========================================
    // CodeBuild Project Configuration
    // ===========================================

    const buildProject = new codebuild.Project(this, 'NodejsBuildProject', {
      projectName: `nodejs-app-build-${environmentSuffix}`,
      description: 'Build project for Node.js application',
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0, // Includes Node.js 18
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              'echo Build started on `date`',
              'echo Installing dependencies...',
              'npm install',
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'echo Running tests...',
              'npm test',
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
          files: ['**/*'],
          'exclude-paths': [
            'node_modules/**/*',
            '.git/**/*',
            '.gitignore',
            'README.md',
          ],
        },
      }),
    });

    // Grant CodeBuild permissions
    sourceCodeBucket.grantRead(buildProject);
    artifactsBucket.grantReadWrite(buildProject);

    // ===========================================
    // CodeDeploy Configuration
    // ===========================================

    // CodeDeploy Application
    const codeDeployApplication = new codedeploy.ServerApplication(
      this,
      'NodejsCodeDeployApp',
      {
        applicationName: `nodejs-app-${environmentSuffix}`,
      }
    );

    // CodeDeploy Deployment Group
    const deploymentGroup = new codedeploy.ServerDeploymentGroup(
      this,
      'NodejsDeploymentGroup',
      {
        application: codeDeployApplication,
        deploymentGroupName: `nodejs-app-deployment-group-${environmentSuffix}`,
        role: codeDeployRole,
        autoScalingGroups: [autoScalingGroup],
        deploymentConfig: codedeploy.ServerDeploymentConfig.HALF_AT_A_TIME, // Rolling deployment
        installAgent: true,
        ignorePollAlarmsFailure: false,
        autoRollback: {
          failedDeployment: true,
          stoppedDeployment: true,
        },
      }
    );

    // ===========================================
    // CodePipeline Configuration
    // ===========================================

    // Pipeline artifacts
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // Create the pipeline
    const pipeline = new codepipeline.Pipeline(this, 'NodejsCicdPipeline', {
      pipelineName: `nodejs-app-pipeline-${environmentSuffix}`,
      role: codePipelineRole,
      artifactBucket: artifactsBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.S3SourceAction({
              actionName: 'S3Source',
              bucket: sourceCodeBucket,
              bucketKey: 'nodejs-app.zip', // Expected source code archive name
              output: sourceOutput,
              trigger: codepipeline_actions.S3Trigger.EVENTS, // Trigger on S3 events
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'CodeBuild',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.CodeDeployServerDeployAction({
              actionName: 'CodeDeploy',
              input: buildOutput,
              deploymentGroup: deploymentGroup,
            }),
          ],
        },
      ],
    });

    // Grant necessary permissions to CodePipeline
    sourceCodeBucket.grantRead(codePipelineRole);
    artifactsBucket.grantReadWrite(codePipelineRole);

    codePipelineRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
        resources: [buildProject.projectArn],
      })
    );

    codePipelineRole.addToPolicy(
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
      })
    );

    // ===========================================
    // CloudWatch Event Rule for S3 Trigger
    // ===========================================

    // The S3SourceAction with S3Trigger.EVENTS automatically creates the necessary
    // EventBridge rule to trigger the pipeline when objects are uploaded to S3

    // ===========================================
    // Outputs
    // ===========================================

    new cdk.CfnOutput(this, 'SourceCodeBucketName', {
      value: sourceCodeBucket.bucketName,
      description: 'S3 bucket name for source code',
      exportName: `SourceCodeBucketName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      description: 'CodePipeline name',
      exportName: `PipelineName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CodeDeployApplicationName', {
      value: codeDeployApplication.applicationName,
      description: 'CodeDeploy application name',
      exportName: `CodeDeployApplicationName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group name',
      exportName: `AutoScalingGroupName-${environmentSuffix}`,
    });

    // Additional outputs for better integration testing
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ArtifactsBucketName', {
      value: artifactsBucket.bucketName,
      description: 'S3 bucket name for pipeline artifacts',
      exportName: `ArtifactsBucketName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BuildProjectName', {
      value: buildProject.projectName,
      description: 'CodeBuild project name',
      exportName: `BuildProjectName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DeploymentGroupName', {
      value: deploymentGroup.deploymentGroupName,
      description: 'CodeDeploy deployment group name',
      exportName: `DeploymentGroupName-${environmentSuffix}`,
    });
  }
}
