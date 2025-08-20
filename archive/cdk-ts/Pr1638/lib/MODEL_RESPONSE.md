# AWS CDK TypeScript Infrastructure Code

I'll help you create a comprehensive cloud environment with AWS CDK TypeScript that meets all your requirements. Here's the complete infrastructure code organized into separate files:

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';

export interface TapStackProps extends cdk.StackProps {
  environment: string;
  owner: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const environment = props.environment;
    const owner = props.owner;

    // Common tags for all resources
    const commonTags = {
      Environment: environment,
      Owner: owner,
      Project: 'CloudEnvironmentSetup'
    };

    // Apply tags to the stack
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('Owner', owner);
    cdk.Tags.of(this).add('Project', 'CloudEnvironmentSetup');

    // Create VPC
    const vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 2,
      natGateways: 1,
      vpcName: `${environment}-vpc`,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Group for EC2 instances (HTTP/HTTPS only)
    const webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc,
      description: 'Security group for web servers',
      securityGroupName: `${environment}-web-sg`,
    });

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Security Group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      description: 'Security group for database',
      securityGroupName: `${environment}-db-sg`,
    });

    dbSecurityGroup.addIngressRule(
      webSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL traffic from web servers'
    );

    // IAM Role for EC2 instances with least privilege
    const ec2Role = new iam.Role(this, 'EC2Role', {
      roleName: `${environment}-ec2-role`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // Add policy for Parameter Store access
    ec2Role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ssm:GetParameter',
        'ssm:GetParameters',
        'ssm:GetParametersByPath',
      ],
      resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/${environment}/*`],
    }));

    const instanceProfile = new iam.InstanceProfile(this, 'EC2InstanceProfile', {
      role: ec2Role,
      instanceProfileName: `${environment}-ec2-profile`,
    });

    // Systems Manager Parameters for environment configuration
    new ssm.StringParameter(this, 'DatabaseEndpointParameter', {
      parameterName: `/${environment}/database/endpoint`,
      stringValue: 'placeholder-will-be-updated',
      description: `Database endpoint for ${environment} environment`,
    });

    new ssm.StringParameter(this, 'S3BucketNameParameter', {
      parameterName: `/${environment}/s3/bucket-name`,
      stringValue: 'placeholder-will-be-updated',
      description: `S3 bucket name for ${environment} environment`,
    });

    new ssm.StringParameter(this, 'EnvironmentConfigParameter', {
      parameterName: `/${environment}/config/app-version`,
      stringValue: '1.0.0',
      description: `Application version for ${environment} environment`,
    });

    // S3 Bucket with versioning
    const s3Bucket = new s3.Bucket(this, 'S3Bucket', {
      bucketName: `${environment}-cloud-setup-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Update S3 parameter with actual bucket name
    new ssm.StringParameter(this, 'S3BucketNameParameterActual', {
      parameterName: `/${environment}/s3/bucket-name-actual`,
      stringValue: s3Bucket.bucketName,
      description: `Actual S3 bucket name for ${environment} environment`,
    });

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc,
      subnetGroupName: `${environment}-db-subnet-group`,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // RDS Instance with encryption
    const database = new rds.DatabaseInstance(this, 'Database', {
      instanceIdentifier: `${environment}-mysql-db`,
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [dbSecurityGroup],
      storageEncrypted: true,
      multiAz: false,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      deleteAutomatedBackups: true,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: `${environment}-db-credentials`,
      }),
    });

    // Update database endpoint parameter
    new ssm.StringParameter(this, 'DatabaseEndpointParameterActual', {
      parameterName: `/${environment}/database/endpoint-actual`,
      stringValue: database.instanceEndpoint.hostname,
      description: `Actual database endpoint for ${environment} environment`,
    });

    // User Data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Hello from ' + environment + ' environment</h1>" > /var/www/html/index.html',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c default -s'
    );

    // EC2 Instances
    const ec2Instance = new ec2.Instance(this, 'WebServer', {
      instanceName: `${environment}-web-server`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup: webSecurityGroup,
      role: ec2Role,
      userData: userData,
    });

    // CloudWatch Alarm for EC2 CPU utilization
    const cpuAlarm = new cloudwatch.Alarm(this, 'CPUAlarm', {
      alarmName: `${environment}-high-cpu`,
      metric: ec2Instance.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      alarmDescription: 'Alert when CPU utilization exceeds 80%',
    });

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `${environment}-alerts`,
    });

    cpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'EcsCluster', {
      clusterName: `${environment}-cluster`,
      vpc,
      containerInsights: true,
    });

    // ECS Fargate Service with Application Load Balancer
    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'FargateService', {
      cluster,
      serviceName: `${environment}-fargate-service`,
      memoryLimitMiB: 512,
      cpu: 256,
      desiredCount: 1,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry('nginx:latest'),
        containerPort: 80,
        environment: {
          ENVIRONMENT: environment,
          OWNER: owner,
        },
      },
      publicLoadBalancer: true,
      redirectHTTP: true,
    });

    // Configure auto-scaling for Fargate service
    const scalableTarget = fargateService.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 10,
    });

    scalableTarget.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
    });

    scalableTarget.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${environment}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: `${environment}-s3-bucket`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
      exportName: `${environment}-db-endpoint`,
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: ec2Instance.instanceId,
      description: 'EC2 Instance ID',
      exportName: `${environment}-ec2-instance`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerUrl', {
      value: fargateService.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer URL',
      exportName: `${environment}-alb-url`,
    });

    new cdk.CfnOutput(this, 'EcsClusterName', {
      value: cluster.clusterName,
      description: 'ECS Cluster Name',
      exportName: `${environment}-ecs-cluster`,
    });
  }
}
```

## bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment from context or default to 'dev'
const environment = app.node.tryGetContext('environment') || 'staging';
const owner = app.node.tryGetContext('owner') || 'cloud-team';

// Create the stack
new TapStack(app, `TapStack-${environment}`, {
  environment,
  owner,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2',
  },
  stackName: `cloud-environment-${environment}`,
  description: `Cloud Environment Setup for ${environment}`,
});

// Add tags to the entire app
cdk.Tags.of(app).add('Project', 'CloudEnvironmentSetup');
cdk.Tags.of(app).add('ManagedBy', 'CDK');
```

## cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
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
    "@aws-cdk/core:target": "aws-cdk-lib@2.1.0",
    "@aws-cdk-lib/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-s3-deployment:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:bucketNotificationsHandlerRoleArn": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-cloudformation:parseTemplateAssets": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLoggingConfiguration": true
  }
}
```

## package.json

```json
{
  "name": "cloud-environment-setup",
  "version": "1.0.0",
  "bin": {
    "cloud-environment-setup": "bin/tap.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "deploy:staging": "cdk deploy --context environment=staging --context owner=cloud-team",
    "deploy:production": "cdk deploy --context environment=production --context owner=cloud-team",
    "destroy:staging": "cdk destroy --context environment=staging",
    "destroy:production": "cdk destroy --context environment=production"
  },
  "devDependencies": {
    "@types/jest": "^29.4.0",
    "@types/node": "18.14.6",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "aws-cdk": "2.147.0",
    "ts-node": "^10.9.1",
    "typescript": "~4.9.5"
  },
  "dependencies": {
    "aws-cdk-lib": "2.147.0",
    "constructs": "^10.0.0",
    "source-map-support": "^0.5.21"
  }
}
```

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": [
      "ES2020"
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

This infrastructure code provides:

1. **Environment Separation**: Uses context parameters for staging/production environments
2. **EC2 with CloudWatch**: Instances with monitoring and CPU alarms
3. **S3 with Versioning**: Encrypted buckets with versioning enabled
4. **RDS with Encryption**: MySQL database with encryption at rest
5. **IAM Least Privilege**: Roles with minimal required permissions
6. **Security Groups**: HTTP/HTTPS traffic only
7. **us-west-2 Region**: Configured in the bin file
8. **Proper Tagging**: Environment and Owner tags on all resources
9. **Parameter Store**: Environment-specific configuration management
10. **ECS Fargate + ALB**: Modern containerized workloads with auto-scaling

**Deployment Commands:**
- For staging: `npm run deploy:staging`
- For production: `npm run deploy:production`
- For cleanup: `npm run destroy:staging` or `npm run destroy:production`

The code follows CDK best practices with proper construct organization, type safety, and maintainable structure.