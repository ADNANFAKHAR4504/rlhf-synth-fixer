**bin/tap.ts**

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();
new TapStack(app, 'TapStack', {
  env: { region: 'us-east-1' },
});
```

**lib/tap-stack.ts**

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const commonTags = {
      project: 'cloudformation-setup',
      owner: 'current_user'
    };

    const vpc = new ec2.Vpc(this, 'TapVpc', {
      maxAzs: 2,
      cidr: '10.0.0.0/16',
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
      ],
    });
    cdk.Tags.of(vpc).add('project', commonTags.project);
    cdk.Tags.of(vpc).add('owner', commonTags.owner);

    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'Security group for ALB',
      allowAllOutbound: false,
    });
    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));
    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443));
    cdk.Tags.of(albSecurityGroup).add('project', commonTags.project);
    cdk.Tags.of(albSecurityGroup).add('owner', commonTags.owner);

    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });
    ec2SecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22));
    ec2SecurityGroup.addIngressRule(albSecurityGroup, ec2.Port.tcp(80));
    ec2SecurityGroup.addIngressRule(albSecurityGroup, ec2.Port.tcp(443));
    cdk.Tags.of(ec2SecurityGroup).add('project', commonTags.project);
    cdk.Tags.of(ec2SecurityGroup).add('owner', commonTags.owner);

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc,
      description: 'Security group for RDS',
      allowAllOutbound: false,
    });
    rdsSecurityGroup.addIngressRule(ec2SecurityGroup, ec2.Port.tcp(3306));
    cdk.Tags.of(rdsSecurityGroup).add('project', commonTags.project);
    cdk.Tags.of(rdsSecurityGroup).add('owner', commonTags.owner);

    const ec2Role = new iam.Role(this, 'Ec2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
    });
    cdk.Tags.of(ec2Role).add('project', commonTags.project);
    cdk.Tags.of(ec2Role).add('owner', commonTags.owner);

    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });
    cdk.Tags.of(lambdaRole).add('project', commonTags.project);
    cdk.Tags.of(lambdaRole).add('owner', commonTags.owner);

    const kmsKey = new kms.Key(this, 'TapKmsKey', {
      description: 'KMS key for encryption',
      enableKeyRotation: true,
    });
    cdk.Tags.of(kmsKey).add('project', commonTags.project);
    cdk.Tags.of(kmsKey).add('owner', commonTags.owner);

    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
    });
    cdk.Tags.of(launchTemplate).add('project', commonTags.project);
    cdk.Tags.of(launchTemplate).add('owner', commonTags.owner);

    const asg = new autoscaling.AutoScalingGroup(this, 'AutoScalingGroup', {
      vpc,
      launchTemplate,
      minCapacity: 2,
      maxCapacity: 6,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });
    cdk.Tags.of(asg).add('project', commonTags.project);
    cdk.Tags.of(asg).add('owner', commonTags.owner);

    const alb = new elbv2.ApplicationLoadBalancer(this, 'ApplicationLoadBalancer', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });
    cdk.Tags.of(alb).add('project', commonTags.project);
    cdk.Tags.of(alb).add('owner', commonTags.owner);

    const listener = alb.addListener('Listener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'OK',
      }),
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [asg],
      healthCheck: {
        path: '/',
        protocol: elbv2.Protocol.HTTP,
      },
    });
    cdk.Tags.of(targetGroup).add('project', commonTags.project);
    cdk.Tags.of(targetGroup).add('owner', commonTags.owner);

    listener.addTargetGroups('TargetGroups', {
      targetGroups: [targetGroup],
    });

    const dbSubnetGroup = new rds.SubnetGroup(this, 'DbSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });
    cdk.Tags.of(dbSubnetGroup).add('project', commonTags.project);
    cdk.Tags.of(dbSubnetGroup).add('owner', commonTags.owner);

    const rdsInstance = new rds.DatabaseInstance(this, 'RdsInstance', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: false,
      deletionProtection: false,
    });
    cdk.Tags.of(rdsInstance).add('project', commonTags.project);
    cdk.Tags.of(rdsInstance).add('owner', commonTags.owner);

    const s3Bucket = new s3.Bucket(this, 'S3Bucket', {
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });
    cdk.Tags.of(s3Bucket).add('project', commonTags.project);
    cdk.Tags.of(s3Bucket).add('owner', commonTags.owner);

    const logGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: '/aws/lambda/tap-function',
      retention: logs.RetentionDays.ONE_WEEK,
    });
    cdk.Tags.of(logGroup).add('project', commonTags.project);
    cdk.Tags.of(logGroup).add('owner', commonTags.owner);

    const lambdaFunction = new lambda.Function(this, 'LambdaFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline('exports.handler = async () => ({ statusCode: 200, body: "Hello" });'),
      role: lambdaRole,
      logGroup: logGroup,
    });
    cdk.Tags.of(lambdaFunction).add('project', commonTags.project);
    cdk.Tags.of(lambdaFunction).add('owner', commonTags.owner);

    const cpuAlarm = new cloudwatch.Alarm(this, 'CpuAlarm', {
      metric: asg.metricCpuUtilization(),
      threshold: 70,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });
    cdk.Tags.of(cpuAlarm).add('project', commonTags.project);
    cdk.Tags.of(cpuAlarm).add('owner', commonTags.owner);

    const scaleUpPolicy = new autoscaling.StepScalingPolicy(this, 'ScaleUpPolicy', {
      autoScalingGroup: asg,
      metric: asg.metricCpuUtilization(),
      scalingSteps: [
        { upper: 70, change: +1 },
        { lower: 85, change: +2 },
      ],
      adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
    });

    const scaleDownPolicy = new autoscaling.StepScalingPolicy(this, 'ScaleDownPolicy', {
      autoScalingGroup: asg,
      metric: asg.metricCpuUtilization(),
      scalingSteps: [
        { upper: 30, change: -1 },
        { upper: 10, change: -2 },
      ],
      adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'ALB DNS Name',
    });
  }
}
```

**cdk.json**

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
    "@aws-cdk-lib/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk-lib/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "@aws-cdk-lib/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk-lib/aws-efs:defaultEncryptionAtRest": true,
    "@aws-cdk-lib/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk-lib/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2019": true,
    "@aws-cdk-lib/core:stackRelativeExports": true,
    "@aws-cdk/aws-ecr-assets:dockerIgnoreSupport": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
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
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true
  }
}
```