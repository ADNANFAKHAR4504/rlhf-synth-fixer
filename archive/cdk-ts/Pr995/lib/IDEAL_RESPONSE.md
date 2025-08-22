# Ideal Response (Implemented IaC Solution)

## Architecture

- Dual-region deployment: identical stacks in `us-east-1` (primary) and `us-west-2` (secondary).
- Networking: `ec2.Vpc` with 2 AZs, subnets per AZ: public, private-with-egress, isolated (DB). 2 NAT Gateways. IGW created automatically.
- Compute: EC2 Auto Scaling Group in private subnets; user data bootstraps a simple HTTP server.
- Load Balancing: Internet-facing ALB (HTTP-only by design), cross-AZ targeting ASG on port 8080.
- Database: RDS PostgreSQL 16, Multi-AZ, 100 GB with autoscaling, KMS-encrypted, 7-day backups, CloudWatch logs.
- Storage: S3 bucket for static assets, KMS-encrypted, versioned, blocked public access, SSL enforced.

## Security and Compliance

- KMS: One CMK with rotation enabled; used by S3, RDS, and CloudWatch Logs. Added resource policies for `logs.<region>.amazonaws.com` (Encrypt/Decrypt/GenerateDataKey/DescribeKey/CreateGrant).
- IAM: EC2 role with minimal managed policies (SSM, CloudWatch Agent). S3 read-only grants to instance role. Security Groups scoped (ALB → ASG 8080, ASG → RDS 5432).
- Data Lifecycle: All stateful resources configured for clean teardown:
  - S3 buckets: `autoDeleteObjects: true`, `removalPolicy: DESTROY`.
  - RDS: `deletionProtection: false`, `removalPolicy: DESTROY`, generated Secret destroyed.
  - KMS: `removalPolicy: DESTROY` with 7-day pending window.

## DNS and Availability

- Optional Route53 Failover: When `domainName` and `hostedZoneId` are provided, create HTTP health check and PRIMARY/SECONDARY A-records aliasing to regional ALBs. Otherwise, skip DNS.

## CI/CD (within constraints)

- CodePipeline using S3 Source + CodeBuild (no CodeCommit). Encrypted source and artifacts buckets. No-op buildspec by default, easily extended.

## Observability

- CloudWatch Logs: dedicated log group, KMS-encrypted.
- Alarms: ASG CPU, ALB 5xx, RDS CPU, with reasonable thresholds and 1-minute periods.

## CDK Design Choices

- Listener-managed targets (`addListener` + `addTargets`) to ensure target groups are not re-used across ALB replacements.
- Avoid explicit ALB names to prevent token validation issues.
- Conditional Route53 to avoid failed deployments without a domain/hosted zone.
- HTTP-only ALB to respect the no-ACM constraint; TLS can be re-enabled by adding ACM and HTTPS listeners when available.

## What’s Excluded by Constraint

- TLS via ACM certificates (intentionally omitted; can be restored later).
- AWS Config recorder and managed rules (removed to avoid account policy failures).
- CodeCommit-based pipeline sources (replaced with S3 Source to avoid org restrictions).

## Operations

- Deploy two stacks from `bin/tap.ts`. Context controls `environmentSuffix`, and optionally `domainName`/`hostedZoneId`.
- To trigger CI, upload `source.zip` to the emitted `PipelineSourceBucketName`.
- Integration tests read outputs from `cfn-outputs/flat-outputs.json` and validate ALB/S3/RDS via AWS SDK.

## Tests

- Unit: CDK assertions for core resources and properties; includes Route53 branch coverage.
- Integration: Validates stack presence, ALB, S3 bucket, RDS endpoint, and pipeline buckets from emitted outputs.

## bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const domainName = app.node.tryGetContext('domainName');
const hostedZoneId = app.node.tryGetContext('hostedZoneId');

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, `TapStack-${environmentSuffix}-use1`, {
  stackName: `TapStack-${environmentSuffix}-use1`,
  environmentSuffix,
  domainName,
  hostedZoneId,
  isPrimaryRegion: true,
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
});

new TapStack(app, `TapStack-${environmentSuffix}-usw2`, {
  stackName: `TapStack-${environmentSuffix}-usw2`,
  environmentSuffix,
  domainName,
  hostedZoneId,
  isPrimaryRegion: false,
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-west-2' },
});
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import {
  aws_autoscaling as autoscaling,
  aws_cloudwatch as cloudwatch,
  aws_codebuild as codebuild,
  aws_codepipeline as codepipeline,
  aws_codepipeline_actions as cpactions,
  aws_ec2 as ec2,
  aws_elasticloadbalancingv2 as elbv2,
  aws_iam as iam,
  aws_kms as kms,
  aws_logs as logs,
  aws_rds as rds,
  aws_route53 as route53,
  aws_s3 as s3,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  domainName?: string;
  hostedZoneId?: string;
  isPrimaryRegion?: boolean;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';
    const isPrimaryRegion = props?.isPrimaryRegion ?? true;
    const region = cdk.Stack.of(this).region;

    const encryptionKey = new kms.Key(this, 'AppKmsKey', {
      alias: `alias/app-${environmentSuffix}-${region}`,
      enableKeyRotation: true,
      description: 'KMS key for application resources',
      pendingWindow: cdk.Duration.days(7),
    });
    encryptionKey.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    encryptionKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowCWLogsUseOfTheKey',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal(`logs.${region}.amazonaws.com`)],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:DescribeKey',
        ],
        resources: ['*'],
        conditions: {
          ArnLike: {
            'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${region}:${this.account}:*`,
          },
        },
      })
    );
    encryptionKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowCWLogsCreateGrant',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal(`logs.${region}.amazonaws.com`)],
        actions: ['kms:CreateGrant'],
        resources: ['*'],
        conditions: { Bool: { 'kms:GrantIsForAWSResource': true } },
      })
    );

    const vpc = new ec2.Vpc(this, 'AppVpc', {
      vpcName: `app-vpc-${environmentSuffix}-${region}`,
      maxAzs: 2,
      natGateways: 2,
      subnetConfiguration: [
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC },
        { name: 'private-egress', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        { name: 'isolated-db', subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      ],
    });

    const staticAssetsBucket = new s3.Bucket(this, 'StaticAssetsBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      enforceSSL: true,
      versioned: true,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const instanceRole = new iam.Role(this, 'Ec2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
      description: 'EC2 role for application servers',
    });
    staticAssetsBucket.grantRead(instanceRole);

    const albSg = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'Allow web traffic to ALB',
      allowAllOutbound: true,
    });
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP');

    const asgSg = new ec2.SecurityGroup(this, 'AsgSecurityGroup', {
      vpc,
      description: 'Allow ALB to reach EC2',
      allowAllOutbound: true,
    });
    asgSg.addIngressRule(albSg, ec2.Port.tcp(8080), 'ALB to app');

    const rdsSg = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc,
      description: 'RDS access from app instances',
      allowAllOutbound: true,
    });
    rdsSg.addIngressRule(asgSg, ec2.Port.tcp(5432), 'App to Postgres');

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'dnf update -y || yum update -y',
      'dnf install -y httpd || yum install -y httpd',
      'echo "ok $(hostname)" > /var/www/html/index.html',
      'systemctl enable httpd',
      'systemctl start httpd'
    );

    const asg = new autoscaling.AutoScalingGroup(this, 'AppAsg', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      role: instanceRole,
      securityGroup: asgSg,
      userData,
      minCapacity: 2,
      maxCapacity: 6,
      desiredCapacity: 2,
      healthCheck: autoscaling.HealthCheck.elb({ grace: cdk.Duration.minutes(5) }),
    });

    const alb = new elbv2.ApplicationLoadBalancer(this, 'AppAlb', {
      vpc,
      internetFacing: true,
      securityGroup: albSg,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });
    const httpListener = alb.addListener('HttpOnlyListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      open: true,
    });
    httpListener.addTargets('AppFleet', {
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [asg],
      healthCheck: { path: '/', healthyThresholdCount: 2, interval: cdk.Duration.seconds(30) },
    });

    const dbInstance = new rds.DatabaseInstance(this, 'AppDb', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.of('16', '16') }),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      credentials: rds.Credentials.fromGeneratedSecret('postgres'),
      multiAz: true,
      allocatedStorage: 100,
      maxAllocatedStorage: 200,
      storageEncrypted: true,
      storageEncryptionKey: encryptionKey,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      securityGroups: [rdsSg],
      backupRetention: cdk.Duration.days(7),
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      parameterGroup: rds.ParameterGroup.fromParameterGroupName(this, 'DefaultPg', 'default.postgres16'),
    });
    dbInstance.connections.allowDefaultPortFrom(asgSg);
    if (dbInstance.secret) dbInstance.secret.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    new logs.LogGroup(this, 'AppLogGroup', {
      logGroupName: `/app/${environmentSuffix}/${region}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new cloudwatch.Alarm(this, 'AsgHighCpuAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        statistic: 'Average',
        dimensionsMap: { AutoScalingGroupName: asg.autoScalingGroupName },
        period: cdk.Duration.minutes(1),
      }),
      threshold: 80,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'Alb5xxAlarm', {
      metric: alb.metricHttpCodeElb(elbv2.HttpCodeElb.ELB_5XX_COUNT, { period: cdk.Duration.minutes(1) }),
      threshold: 5,
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'RdsHighCpuAlarm', {
      metric: dbInstance.metricCPUUtilization({ period: cdk.Duration.minutes(1) }),
      threshold: 80,
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const domainName = props?.domainName || this.node.tryGetContext('domainName');
    const hostedZoneId = props?.hostedZoneId || this.node.tryGetContext('hostedZoneId');
    if (domainName && hostedZoneId) {
      const zone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZoneForR53', {
        hostedZoneId,
        zoneName: domainName.split('.').slice(1).join('.'),
      });

      const healthCheck = new route53.CfnHealthCheck(this, 'AlbHealthCheck', {
        healthCheckConfig: {
          type: 'HTTP',
          fullyQualifiedDomainName: alb.loadBalancerDnsName,
          resourcePath: '/',
          requestInterval: 30,
          failureThreshold: 3,
        },
      });

      new route53.CfnRecordSet(this, 'FailoverAliasRecord', {
        hostedZoneId: zone.hostedZoneId,
        name: domainName,
        type: 'A',
        setIdentifier: isPrimaryRegion ? 'primary' : 'secondary',
        failover: isPrimaryRegion ? 'PRIMARY' : 'SECONDARY',
        aliasTarget: {
          dnsName: alb.loadBalancerDnsName,
          hostedZoneId: alb.loadBalancerCanonicalHostedZoneId,
          evaluateTargetHealth: true,
        },
        healthCheckId: healthCheck.attrHealthCheckId,
      });
    }

    const pipelineSourceBucket = new s3.Bucket(this, 'PipelineSourceBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const artifactBucket = new s3.Bucket(this, 'PipelineArtifactsBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const sourceOutput = new codepipeline.Artifact();

    const buildProject = new codebuild.Project(this, 'CdkBuildProject', {
      projectName: `cdk-build-${environmentSuffix}-${region}`,
      environment: { buildImage: codebuild.LinuxBuildImage.STANDARD_7_0 },
      encryptionKey,
      artifacts: codebuild.Artifacts.s3({
        bucket: artifactBucket,
        includeBuildId: true,
        packageZip: true,
        path: 'builds',
      }),
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: { commands: ['echo "noop install"'] },
          build: { commands: ['echo "noop build"'] },
        },
        artifacts: { files: ['**/*'] },
      }),
    });

    const pipeline = new codepipeline.Pipeline(this, 'AppPipeline', {
      pipelineName: `app-pipeline-${environmentSuffix}-${region}`,
      artifactBucket,
      restartExecutionOnUpdate: true,
    });

    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new cpactions.S3SourceAction({
          actionName: 'S3Source',
          bucket: pipelineSourceBucket,
          bucketKey: 'source.zip',
          output: sourceOutput,
          trigger: cpactions.S3Trigger.NONE,
        }),
      ],
    });

    pipeline addStage({
      stageName: 'Build',
      actions: [
        new cpactions.CodeBuildAction({
          actionName: 'Build',
          project: buildProject,
          input: sourceOutput,
          outputs: [new codepipeline.Artifact('BuildOutput')],
        }),
      ],
    });

    new cdk.CfnOutput(this, 'AlbDnsName', { value: alb.loadBalancerDnsName });
    new cdk.CfnOutput(this, 'StaticBucketName', { value: staticAssetsBucket.bucketName });
    new cdk.CfnOutput(this, 'DbEndpoint', { value: dbInstance.instanceEndpoint.hostname });
    new cdk.CfnOutput(this, 'PipelineSourceBucketName', { value: pipelineSourceBucket.bucketName });
    new cdk.CfnOutput(this, 'PipelineName', { value: pipeline.pipelineName });
  }
}
```

## cdk.json

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
    "@aws-cdk/aws-ecs:enableImdsBlockingDeprecatedFeature": false,
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
