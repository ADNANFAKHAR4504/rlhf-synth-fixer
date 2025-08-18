## bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

new TapStack(app, 'TapStack-us-east-1', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: 'us-east-1' 
  },
  region: 'us-east-1',
  isPrimary: true,
});

new TapStack(app, 'TapStack-us-west-2', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: 'us-west-2' 
  },
  region: 'us-west-2',
  isPrimary: false,
});
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipelineactions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as config from 'aws-cdk-lib/aws-config';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  region: string;
  isPrimary: boolean;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { region, isPrimary } = props;

    // KMS Key for encryption
    const kmsKey = new kms.Key(this, 'TapKmsKey', {
      description: `TAP KMS Key for ${region}`,
      enableKeyRotation: true,
    });

    // VPC with public and private subnets
    const vpc = new ec2.Vpc(this, 'TapVpc', {
      maxAzs: 3,
      natGateways: 3,
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
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL traffic from EC2'
    );

    // IAM Role for EC2 instances
    const ec2Role = new iam.Role(this, 'Ec2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    ec2Role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
      ],
      resources: ['arn:aws:s3:::tap-static-assets-*/*'],
    }));

    ec2Role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'kms:Decrypt',
        'kms:GenerateDataKey',
      ],
      resources: [kmsKey.keyArn],
    }));

    // CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'TapLogGroup', {
      logGroupName: `/aws/ec2/tap-${region}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: kmsKey,
    });

    // User Data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>TAP Web Server - ' + region + '</h1>" > /var/www/html/index.html',
      'yum install -y amazon-cloudwatch-agent',
      'systemctl start amazon-cloudwatch-agent',
      'systemctl enable amazon-cloudwatch-agent'
    );

    // Launch Template
    const launchTemplate = new ec2.LaunchTemplate(this, 'TapLaunchTemplate', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      machineImage: ec2.MachineImage.latestAmazonLinux(),
      userData,
      role: ec2Role,
      securityGroup: ec2SecurityGroup,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            encrypted: true,
            kmsKey: kmsKey,
          }),
        },
      ],
    });

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'TapAsg', {
      vpc,
      launchTemplate,
      minCapacity: 2,
      maxCapacity: 6,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.minutes(5),
      }),
    });

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'TapAlb', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TapTargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [autoScalingGroup],
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
        path: '/',
        protocol: elbv2.Protocol.HTTP,
      },
    });

    // HTTP Listener (redirects to HTTPS)
    alb.addListener('HttpListener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        permanent: true,
      }),
    });

    // Database credentials
    const dbCredentials = new secretsmanager.Secret(this, 'DbCredentials', {
      description: 'RDS MySQL credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
      encryptionKey: kmsKey,
    });

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DbSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // RDS Database
    const database = new rds.DatabaseInstance(this, 'TapDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      credentials: rds.Credentials.fromSecret(dbCredentials),
      multiAz: true,
      subnetGroup: dbSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      backupRetention: cdk.Duration.days(7),
      deletionProtection: true,
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      performanceInsightEncryptionKey: kmsKey,
    });

    // S3 Bucket for static assets
    const staticAssetsBucket = new s3.Bucket(this, 'StaticAssetsBucket', {
      bucketName: `tap-static-assets-${region}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // S3 Bucket Policy for restricted access
    staticAssetsBucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [ec2Role],
      actions: ['s3:GetObject'],
      resources: [staticAssetsBucket.arnForObjects('*')],
    }));

    // CloudWatch Alarms
    const cpuAlarm = new cloudwatch.Alarm(this, 'HighCpuAlarm', {
      metric: autoScalingGroup.metricCpuUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const dbConnectionsAlarm = new cloudwatch.Alarm(this, 'HighDbConnectionsAlarm', {
      metric: database.metricDatabaseConnections(),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Auto Scaling Policies
    autoScalingGroup.scaleOnMetric('ScaleOnCpu', {
      metric: autoScalingGroup.metricCpuUtilization(),
      scalingSteps: [
        { upper: 50, change: -1 },
        { lower: 70, change: +1 },
        { lower: 85, change: +2 },
      ],
    });

    if (isPrimary) {
      // Route 53 Hosted Zone (only in primary region)
      const hostedZone = new route53.HostedZone(this, 'TapHostedZone', {
        zoneName: 'tap-app.com',
      });

      // ACM Certificate (only in primary region)
      const certificate = new acm.Certificate(this, 'TapCertificate', {
        domainName: 'tap-app.com',
        subjectAlternativeNames: ['*.tap-app.com'],
        validation: acm.CertificateValidation.fromDns(hostedZone),
      });

      // HTTPS Listener
      alb.addListener('HttpsListener', {
        port: 443,
        certificates: [certificate],
        defaultTargetGroups: [targetGroup],
      });

      // Route 53 Records with Health Checks
      const healthCheck = new route53.CfnHealthCheck(this, 'TapHealthCheck', {
        type: 'HTTPS',
        resourcePath: '/',
        fullyQualifiedDomainName: alb.loadBalancerDnsName,
        port: 443,
        requestInterval: 30,
        failureThreshold: 3,
      });

      new route53.ARecord(this, 'TapARecord', {
        zone: hostedZone,
        target: route53.RecordTarget.fromAlias(new route53targets.LoadBalancerTarget(alb)),
        recordName: 'tap-app.com',
      });

      // CodeBuild Project
      const buildProject = new codebuild.Project(this, 'TapBuildProject', {
        source: codebuild.Source.gitHub({
          owner: 'your-github-username',
          repo: 'tap-application',
          webhook: true,
        }),
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
          computeType: codebuild.ComputeType.SMALL,
        },
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            pre_build: {
              commands: [
                'echo Logging in to Amazon ECR...',
                'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com',
              ],
            },
            build: {
              commands: [
                'echo Build started on `date`',
                'echo Building the Docker image...',
                'docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .',
                'docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG',
              ],
            },
            post_build: {
              commands: [
                'echo Build completed on `date`',
                'echo Pushing the Docker image...',
                'docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG',
              ],
            },
          },
        }),
        encryptionKey: kmsKey,
      });

      // S3 Bucket for CodePipeline artifacts
      const artifactsBucket = new s3.Bucket(this, 'ArtifactsBucket', {
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: kmsKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      });

      // CodePipeline
      const sourceOutput = new codepipeline.Artifact();
      const buildOutput = new codepipeline.Artifact();

      new codepipeline.Pipeline(this, 'TapPipeline', {
        artifactBucket: artifactsBucket,
        stages: [
          {
            stageName: 'Source',
            actions: [
              new codepipelineactions.GitHubSourceAction({
                actionName: 'GitHub_Source',
                owner: 'your-github-username',
                repo: 'tap-application',
                oauthToken: cdk.SecretValue.secretsManager('github-token'),
                output: sourceOutput,
                branch: 'main',
              }),
            ],
          },
          {
            stageName: 'Build',
            actions: [
              new codepipelineactions.CodeBuildAction({
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
              new codepipelineactions.CloudFormationCreateUpdateStackAction({
                actionName: 'Deploy',
                templatePath: buildOutput.atPath('template.yaml'),
                stackName: 'TapApplicationStack',
                adminPermissions: true,
              }),
            ],
          },
        ],
      });
    }

    // AWS Config Rules
    new config.ManagedRule(this, 'S3BucketPublicAccessProhibited', {
      identifier: config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_ACCESS_PROHIBITED,
    });

    new config.ManagedRule(this, 'Ec2SecurityGroupAttachedToEni', {
      identifier: config.ManagedRuleIdentifiers.EC2_SECURITY_GROUP_ATTACHED_TO_ENI,
    });

    new config.ManagedRule(this, 'RdsStorageEncrypted', {
      identifier: config.ManagedRuleIdentifiers.RDS_STORAGE_ENCRYPTED,
    });

    new config.ManagedRule(this, 'IamRootAccessKeyCheck', {
      identifier: config.ManagedRuleIdentifiers.IAM_ROOT_ACCESS_KEY_CHECK,
    });

    // Tags for all resources
    cdk.Tags.of(this).add('Project', 'TAP');
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Region', region);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the load balancer',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: staticAssetsBucket.bucketName,
      description: 'S3 bucket for static assets',
    });
  }
}
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
    "@aws-cdk/core:target": "aws-cdk-lib",
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-ssm:parameterValueSelect": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true
  }
}
```