## bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();
new TapStack(app, 'TapStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
});
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'tap-prod-vpc', {
      isDefault: true,
    });

    const kmsKey = new kms.Key(this, 'tap-prod-kms', {
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      description: 'KMS key for TAP production encryption',
      enableKeyRotation: true,
    });

    const securityGroup = new ec2.SecurityGroup(this, 'tap-prod-sg', {
      vpc,
      description: 'Security group for TAP production resources',
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'tap-prod-db-sg', {
      vpc,
      description: 'Security group for TAP production database',
      allowAllOutbound: false,
    });

    dbSecurityGroup.addIngressRule(
      securityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from application servers'
    );

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>TAP Production Server</h1>" > /var/www/html/index.html'
    );

    const launchTemplate = new ec2.LaunchTemplate(this, 'tap-prod-lt', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      userData,
      securityGroup,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            encrypted: true,
            kmsKey,
          }),
        },
      ],
      role: new iam.Role(this, 'tap-prod-ec2-role', {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
        ],
      }),
    });

    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'tap-prod-asg', {
      vpc,
      launchTemplate,
      minCapacity: 2,
      maxCapacity: 6,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.minutes(5),
      }),
      autoScalingGroupName: 'tap-prod-asg',
    });

    autoScalingGroup.scaleOnCpuUtilization('tap-prod-cpu-scaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(5),
    });

    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'tap-prod-alb', {
      vpc,
      internetFacing: true,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      loadBalancerName: 'tap-prod-alb',
      securityGroup,
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'tap-prod-tg', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [autoScalingGroup],
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        path: '/',
        protocol: elbv2.Protocol.HTTP,
        timeout: cdk.Duration.seconds(5),
        unhealthyThresholdCount: 3,
      },
      targetGroupName: 'tap-prod-tg',
    });

    loadBalancer.addListener('tap-prod-listener', {
      port: 80,
      defaultTargetGroups: [targetGroup],
    });

    const dbSubnetGroup = new rds.SubnetGroup(this, 'tap-prod-db-subnet-group', {
      vpc,
      description: 'Subnet group for TAP production database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        availabilityZones: vpc.availabilityZones.slice(0, 2),
      },
      subnetGroupName: 'tap-prod-db-subnet-group',
    });

    const database = new rds.DatabaseInstance(this, 'tap-prod-db', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [dbSecurityGroup],
      multiAz: true,
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: false,
      deletionProtection: true,
      databaseName: 'tapdb',
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: 'tap-prod-db-credentials',
      }),
      instanceIdentifier: 'tap-prod-db',
    });

    new cloudwatch.Alarm(this, 'tap-prod-cpu-alarm', {
      metric: autoScalingGroup.metricCpuUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmName: 'tap-prod-cpu-alarm',
      alarmDescription: 'High CPU utilization alarm for TAP production instances',
    });

    new cloudwatch.Alarm(this, 'tap-prod-db-cpu-alarm', {
      metric: database.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmName: 'tap-prod-db-cpu-alarm',
      alarmDescription: 'High CPU utilization alarm for TAP production database',
    });

    new cloudwatch.Alarm(this, 'tap-prod-db-connections-alarm', {
      metric: database.metricDatabaseConnections(),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmName: 'tap-prod-db-connections-alarm',
      alarmDescription: 'High database connections alarm for TAP production database',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: loadBalancer.loadBalancerDnsName,
      description: 'DNS name of the load balancer',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
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
    "@aws-cdk-lib/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk-lib/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "@aws-cdk-lib/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk-lib/aws-efs:defaultEncryptionAtRest": true,
    "@aws-cdk-lib/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk-lib/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2019": true,
    "@aws-cdk-lib/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk-lib/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk-lib/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk-lib/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk-lib/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk-lib/core:enablePartitionLiterals": true,
    "@aws-cdk-lib/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk-lib/aws-iam:minimizePolicies": true,
    "@aws-cdk-lib/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk-lib/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk-lib/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk-lib/aws-route53-patters:useCertificate": true,
    "@aws-cdk-lib/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk-lib/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk-lib/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk-lib/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk-lib/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk-lib/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk-lib/aws-redshift:columnId": true,
    "@aws-cdk-lib/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk-lib/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk-lib/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk-lib/aws-kms:aliasNameRef": true,
    "@aws-cdk-lib/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk-lib/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk-lib/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk-lib/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk-lib/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk-lib/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk-lib/aws-codepipeline-actions:useNewDefaultBranchForSourceAction": true
  }
}
```