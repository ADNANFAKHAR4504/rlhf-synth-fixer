# CDK TypeScript Infrastructure for Job Board Web Application

Here's the complete CDK TypeScript code for your job board web application infrastructure:

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { WebApplicationStack } from './web-application-stack';

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

    new WebApplicationStack(this, 'WebApplicationStack', {
      environmentSuffix: environmentSuffix,
    });
  }
}
```

## File: lib/web-application-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import { Construct } from 'constructs';

interface WebApplicationStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class WebApplicationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WebApplicationStackProps) {
    super(scope, id, props);

    // Create VPC with specified CIDR
    const vpc = new ec2.Vpc(this, 'JobBoardVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.20.0.0/16'),
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

    // Create EC2 Instance Connect Endpoint for secure SSH access
    new ec2.CfnInstanceConnectEndpoint(this, 'InstanceConnectEndpoint', {
      subnetId: vpc.privateSubnets[0].subnetId,
      securityGroupIds: [],
    });

    // Create S3 bucket for static files
    const staticFilesBucket = new s3.Bucket(this, 'StaticFilesBucket', {
      bucketName: `job-board-static-files-${props.environmentSuffix}-${cdk.Stack.of(this).account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'],
          maxAge: 3000,
        },
      ],
    });

    // Create bucket policy for web hosting
    staticFilesBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [`${staticFilesBucket.bucketArn}/*`],
        principals: [new iam.AnyPrincipal()],
      })
    );

    // Security Group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from anywhere'
    );

    // Security Group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/16'),
      ec2.Port.tcp(22),
      'Allow SSH from internal network'
    );

    // IAM role for EC2 instances
    const ec2Role = new iam.Role(this, 'Ec2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
    });

    // Add S3 access to EC2 role
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
        resources: [staticFilesBucket.bucketArn, `${staticFilesBucket.bucketArn}/*`],
      })
    );

    // User data script for Apache installation
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Job Board Application - Instance $(hostname)</h1>" > /var/www/html/index.html',
      'echo "<p>Serving 3000+ daily users</p>" >> /var/www/html/index.html',
      'yum install -y amazon-cloudwatch-agent',
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      '{',
      '  "metrics": {',
      '    "namespace": "JobBoard/EC2",',
      '    "metrics_collected": {',
      '      "cpu": {',
      '        "measurement": [',
      '          {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},',
      '          {"name": "cpu_usage_iowait", "rename": "CPU_IOWAIT", "unit": "Percent"},',
      '          "cpu_time_system",',
      '          "cpu_time_user"',
      '        ],',
      '        "metrics_collection_interval": 60,',
      '        "totalcpu": false',
      '      },',
      '      "disk": {',
      '        "measurement": [',
      '          {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}',
      '        ],',
      '        "metrics_collection_interval": 60,',
      '        "resources": ["/"]',
      '      },',
      '      "mem": {',
      '        "measurement": [',
      '          {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}',
      '        ],',
      '        "metrics_collection_interval": 60',
      '      }',
      '    }',
      '  }',
      '}',
      'EOF',
      'systemctl restart amazon-cloudwatch-agent'
    );

    // Launch template for EC2 instances
    const launchTemplate = new ec2.LaunchTemplate(this, 'WebServerLaunchTemplate', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      userData: userData,
      role: ec2Role,
      securityGroup: ec2SecurityGroup,
    });

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'WebServerAutoScalingGroup', {
      vpc,
      launchTemplate: launchTemplate,
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

    // Create Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'JobBoardAlb', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
    });

    // Create target group with Automatic Target Weights enabled
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'WebServerTargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [autoScalingGroup],
      healthCheck: {
        path: '/',
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      targetGroupName: `job-board-tg-${props.environmentSuffix}`,
    });

    // Add weighted random algorithm attribute for Automatic Target Weights
    const cfnTargetGroup = targetGroup.node.defaultChild as elbv2.CfnTargetGroup;
    cfnTargetGroup.targetGroupAttributes = [
      {
        key: 'load_balancing.algorithm.type',
        value: 'weighted_random',
      },
      {
        key: 'load_balancing.algorithm.anomaly_mitigation',
        value: 'on',
      },
    ];

    // Create HTTPS listener (using default certificate for demo)
    const listener = alb.addListener('HttpsListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [
        {
          certificateArn: cdk.Fn.sub(
            'arn:aws:acm:${AWS::Region}:${AWS::AccountId}:certificate/dummy-cert-id',
            {}
          ),
        },
      ],
      defaultTargetGroups: [targetGroup],
    });

    // Create SNS topic for alarms
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `job-board-alarms-${props.environmentSuffix}`,
    });

    // CloudWatch Alarms for EC2 health monitoring
    const cpuAlarm = new cloudwatch.Alarm(this, 'HighCpuAlarm', {
      metric: autoScalingGroup.metricCpuUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Alarm when CPU exceeds 80%',
    });

    cpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // Target health alarm
    const unhealthyTargetsAlarm = new cloudwatch.Alarm(this, 'UnhealthyTargetsAlarm', {
      metric: targetGroup.metricUnhealthyHostCount(),
      threshold: 1,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Alarm when unhealthy targets detected',
    });

    unhealthyTargetsAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // Auto scaling based on CPU
    autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.minutes(5),
    });

    // Auto scaling based on ALB request count
    autoScalingGroup.scaleOnRequestCount('RequestCountScaling', {
      targetRequestsPerMinute: 100,
    });

    // Output values
    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
    });

    new cdk.CfnOutput(this, 'StaticFilesBucketName', {
      value: staticFilesBucket.bucketName,
      description: 'Name of the S3 bucket for static files',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'ID of the VPC',
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'ARN of the SNS topic for alarms',
    });
  }
}
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'job-board';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('Application', 'JobBoard');

new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-1',
  },
});
```

## File: cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": ["**"],
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
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"],
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
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false,
    "@aws-cdk/aws-ecs:disableEcsImdsBlocking": true,
    "@aws-cdk/aws-ecs:reduceEc2FargateCloudWatchPermissions": true,
    "@aws-cdk/aws-dynamodb:resourcePolicyPerReplica": true,
    "@aws-cdk/aws-ec2:ec2SumTImeoutEnabled": true,
    "@aws-cdk/aws-appsync:appSyncGraphQLAPIScopeLambdaPermission": true,
    "@aws-cdk/aws-rds:setCorrectValueForDatabaseInstanceReadReplicaInstanceResourceId": true,
    "@aws-cdk/core:cfnIncludeRejectComplexResourceUpdateCreatePolicyIntrinsics": true,
    "@aws-cdk/aws-lambda-nodejs:sdkV3ExcludeSmithyPackages": true,
    "@aws-cdk/aws-stepfunctions-tasks:fixRunEcsTaskPolicy": true,
    "@aws-cdk/aws-ec2:bastionHostUseAmazonLinux2023ByDefault": true,
    "@aws-cdk/aws-route53-targets:userPoolDomainNameMethodWithoutCustomResource": true,
    "@aws-cdk/aws-elasticloadbalancingV2:albDualstackWithoutPublicIpv4SecurityGroupRulesDefault": true,
    "@aws-cdk/aws-iam:oidcRejectUnauthorizedConnections": true,
    "@aws-cdk/core:enableAdditionalMetadataCollection": true,
    "@aws-cdk/aws-lambda:createNewPoliciesWithAddToRolePolicy": false,
    "@aws-cdk/aws-s3:setUniqueReplicationRoleName": true,
    "@aws-cdk/aws-events:requireEventBusPolicySid": true,
    "@aws-cdk/core:aspectPrioritiesMutating": true,
    "@aws-cdk/aws-dynamodb:retainTableReplica": true,
    "@aws-cdk/aws-stepfunctions:useDistributedMapResultWriterV2": true,
    "@aws-cdk/s3-notifications:addS3TrustKeyPolicyForSnsSubscriptions": true,
    "@aws-cdk/aws-ec2:requirePrivateSubnetsForEgressOnlyInternetGateway": true,
    "@aws-cdk/aws-s3:publicAccessBlockedByDefault": true,
    "@aws-cdk/aws-lambda:useCdkManagedLogGroup": true
  }
}
```

This infrastructure provides:

1. A VPC with the specified CIDR (10.20.0.0/16) with public and private subnets across 2 availability zones
2. EC2 instances (t3.micro) running Apache web server with auto-scaling
3. Application Load Balancer with HTTPS on port 443 and Automatic Target Weights enabled
4. Security groups configured as specified
5. S3 bucket for static files with web hosting capabilities
6. CloudWatch monitoring with CPU utilization alarms and unhealthy target detection
7. EC2 Instance Connect Endpoint for secure SSH access without public IPs
8. Auto-scaling based on CPU utilization and request count
9. SNS topic for alarm notifications

The infrastructure is designed for high availability and can scale automatically based on load to handle the 3,000 daily users efficiently.