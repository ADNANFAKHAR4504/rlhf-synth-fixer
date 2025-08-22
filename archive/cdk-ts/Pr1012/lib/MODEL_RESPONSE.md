I'll create a comprehensive AWS CDK TypeScript project for a CI/CD pipeline. Here's the complete implementation:

## Project Structure

First, let me show you the project structure and then provide the main stack file:

```
my-cicd-project/
├── lib/
│   └── my-cicd-project-stack.ts
├── bin/
│   └── my-cicd-project.ts
├── package.json
├── tsconfig.json
└── cdk.json
```

## Main Stack Implementation

```typescript
// lib/my-cicd-project-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as s3_notifications from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

export class MyCicdProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ===========================================
    // VPC Configuration
    // ===========================================
    const vpc = new ec2.Vpc(this, 'CicdVpc', {
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
        }
      ]
    });

    // ===========================================
    // S3 Bucket for Source Code Repository
    // ===========================================
    const sourceCodeBucket = new s3.Bucket(this, 'SourceCodeBucket', {
      bucketName: `nodejs-app-source-${this.account}-${this.region}`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      eventBridgeEnabled: true, // Enable EventBridge for pipeline triggers
    });

    // S3 Bucket for CodePipeline Artifacts
    const artifactsBucket = new s3.Bucket(this, 'ArtifactsBucket', {
      bucketName: `codepipeline-artifacts-${this.account}-${this.region}`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ===========================================
    // IAM Roles and Policies
    // ===========================================
    
    // EC2 Instance Role for CodeDeploy Agent
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // Allow EC2 to download artifacts from S3
    ec2Role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:ListBucket',
      ],
      resources: [
        artifactsBucket.bucketArn,
        `${artifactsBucket.bucketArn}/*`,
      ],
    }));

    // CodeDeploy Service Role
    const codeDeployRole = new iam.Role(this, 'CodeDeployServiceRole', {
      assumedBy: new iam.ServicePrincipal('codedeploy.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSCodeDeployRole'),
      ],
    });

    // CodeBuild Service Role
    const codeBuildRole = new iam.Role(this, 'CodeBuildServiceRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
    });

    // CodePipeline Service Role
    const codePipelineRole = new iam.Role(this, 'CodePipelineServiceRole', {
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
    });

    // ===========================================
    // EC2 Instance Configuration
    // ===========================================
    
    // Security Group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
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
      'wget https://aws-codedeploy-' + this.region + '.s3.' + this.region + '.amazonaws.com/latest/install',
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

    // EC2 Instance Profile
    const instanceProfile = new iam.InstanceProfile(this, 'EC2InstanceProfile', {
      role: ec2Role,
    });

    // Launch Template for EC2 instances
    const launchTemplate = new ec2.LaunchTemplate(this, 'NodejsAppLaunchTemplate', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: ec2SecurityGroup,
      userData: userData,
      role: ec2Role,
    });

    // Auto Scaling Group for rolling deployments
    const autoScalingGroup = new ec2.AutoScalingGroup(this, 'NodejsAppASG', {
      vpc,
      launchTemplate: launchTemplate,
      minCapacity: 1,
      maxCapacity: 3,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      updatePolicy: ec2.UpdatePolicy.rollingUpdate({
        maxBatchSize: 1,
        minInstancesInService: 1,
        pauseTime: cdk.Duration.minutes(5),
      }),
    });

    // Tag instances for CodeDeploy
    cdk.Tags.of(autoScalingGroup).add('Name', 'NodejsApp');
    cdk.Tags.of(autoScalingGroup).add('Environment', 'Production');

    // ===========================================
    // CodeBuild Project Configuration
    // ===========================================
    
    const buildProject = new codebuild.Project(this, 'NodejsBuildProject', {
      projectName: 'nodejs-app-build',
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
          files: [
            '**/*',
          ],
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
    const codeDeployApplication = new codedeploy.ServerApplication(this, 'NodejsCodeDeployApp', {
      applicationName: 'nodejs-app',
    });

    // CodeDeploy Deployment Group
    const deploymentGroup = new codedeploy.ServerDeploymentGroup(this, 'NodejsDeploymentGroup', {
      application: codeDeployApplication,
      deploymentGroupName: 'nodejs-app-deployment-group',
      role: codeDeployRole,
      autoScalingGroups: [autoScalingGroup],
      deploymentConfig: codedeploy.ServerDeploymentConfig.ALL_AT_ONCE_HALF_AT_A_TIME, // Rolling deployment
      installAgent: true,
      ignorePollAlarmsFailure: false,
      autoRollback: {
        failedDeployment: true,
        stoppedDeployment: true,
      },
    });

    // ===========================================
    // CodePipeline Configuration
    // ===========================================
    
    // Pipeline artifacts
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // Create the pipeline
    const pipeline = new codepipeline.Pipeline(this, 'NodejsCicdPipeline', {
      pipelineName: 'nodejs-app-pipeline',
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
    
    codePipelineRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'codebuild:BatchGetBuilds',
        'codebuild:StartBuild',
      ],
      resources: [buildProject.projectArn],
    }));

    codePipelineRole.addToPolicy(new iam.PolicyStatement({
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
    }));

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
      exportName: 'SourceCodeBucketName',
    });

    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      description: 'CodePipeline name',
      exportName: 'PipelineName',
    });

    new cdk.CfnOutput(this, 'CodeDeployApplicationName', {
      value: codeDeployApplication.applicationName,
      description: 'CodeDeploy application name',
      exportName: 'CodeDeployApplicationName',
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group name',
      exportName: 'AutoScalingGroupName',
    });
  }
}
```

## Supporting Files

### `bin/my-cicd-project.ts`

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MyCicdProjectStack } from '../lib/my-cicd-project-stack';

const app = new cdk.App();
new MyCicdProjectStack(app, 'MyCicdProjectStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```

### `package.json`

```json
{
  "name": "my-cicd-project",
  "version": "0.1.0",
  "bin": {
    "my-cicd-project": "bin/my-cicd-project.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk"
  },
  "devDependencies": {
    "@types/jest": "^29.4.0",
    "@types/node": "18.14.6",
    "jest": "^29.5.0",
    "ts-jest": "^29.0.5",
    "aws-cdk": "2.87.0",
    "ts-node": "^10.9.1",
    "typescript": "~4.9.5"
  },
  "dependencies": {
    "aws-cdk-lib": "2.87.0",
    "constructs": "^10.0.0",
    "source-map-support": "^0.5.21"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": [
      "es2020",
      "dom"
    ],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": [
      "./node_modules/@types"
    ]
  },
  "exclude": [
    "node_modules",
    "cdk.out"
  ]
}
```

### `cdk.json`

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/my-cicd-project.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target": "aws-cdk-lib",
    "@aws-cdk-core:enableStackNameDuplicates": true,
    "aws-cdk:enableDiffNoFail": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true
  }
}
```

## Key Features Explained

### 1. **Source Stage (S3)**
- Uses S3 as the source repository with versioning enabled
- Automatically triggers the pipeline when new code (`nodejs-app.zip`) is uploaded
- EventBridge integration for real-time triggering

### 2. **Build Stage (CodeBuild)**
- Uses standard Node.js 18 build environment
- Runs `npm install` and `npm test`
- Excludes unnecessary files from deployment artifacts
- Comprehensive build specification with pre-build, build, and post-build phases

### 3. **Deploy Stage (CodeDeploy)**
- Supports rolling deployments with zero downtime
- Uses Auto Scaling Groups for high availability
- Automatic rollback on deployment failures
- CodeDeploy agent automatically installed on EC2 instances

### 4. **Infrastructure Components**
- **VPC**: Multi-AZ setup with public and private subnets
- **EC2**: Auto Scaling Group with launch template
- **Security**: Proper IAM roles and security groups
- **Monitoring**: CloudWatch integration for logging

## Deployment Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Deploy the stack:**
   ```bash
   npx cdk deploy
   ```

3. **Upload your Node.js application:**
   - Package your Node.js app as `nodejs-app.zip`
   - Upload to the created S3 bucket
   - The pipeline will automatically trigger

## Application Requirements

Your Node.js application should include:
- `package.json` with dependencies and test scripts
- `server.js` as the main application file
- `appspec.yml` for CodeDeploy configuration
- Test files for the build stage

This implementation provides a robust, production-ready CI/CD pipeline with proper error handling, security, and scalability features.