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

    // KMS for encryption at rest
    const encryptionKey = new kms.Key(this, 'AppKmsKey', {
      alias: `alias/app-${environmentSuffix}-${region}`,
      enableKeyRotation: true,
      description: 'KMS key for application resources',
      pendingWindow: cdk.Duration.days(7),
    });
    encryptionKey.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Allow CloudWatch Logs service in this region to use the key
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
        conditions: {
          Bool: { 'kms:GrantIsForAWSResource': true },
        },
      })
    );

    // VPC: public, private-egress, isolated (for RDS), 2 AZs, 2 NAT GWs
    const vpc = new ec2.Vpc(this, 'AppVpc', {
      vpcName: `app-vpc-${environmentSuffix}-${region}`,
      maxAzs: 2,
      natGateways: 2,
      subnetConfiguration: [
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC },
        {
          name: 'private-egress',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        { name: 'isolated-db', subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      ],
    });

    // S3 for static assets (no public access)
    const staticAssetsBucket = new s3.Bucket(this, 'StaticAssetsBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      enforceSSL: true,
      versioned: true,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM role for EC2 instances (SSM + CloudWatch)
    const instanceRole = new iam.Role(this, 'Ec2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'EC2 role for application servers',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });
    staticAssetsBucket.grantRead(instanceRole);

    // Security groups
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

    // User data (simple HTTP server placeholder)
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'dnf update -y || yum update -y',
      'dnf install -y httpd || yum install -y httpd',
      'echo "ok $(hostname)" > /var/www/html/index.html',
      'systemctl enable httpd',
      'systemctl start httpd'
    );

    // Auto Scaling Group
    const asg = new autoscaling.AutoScalingGroup(this, 'AppAsg', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      role: instanceRole,
      securityGroup: asgSg,
      userData,
      minCapacity: 2,
      maxCapacity: 6,
      desiredCapacity: 2,
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.minutes(5),
      }),
    });

    // ALB with cross-zone enabled by default, HTTP only
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
      healthCheck: {
        path: '/',
        healthyThresholdCount: 2,
        interval: cdk.Duration.seconds(30),
      },
    });

    // RDS PostgreSQL Multi-AZ, encrypted, backups
    const dbCredentials = rds.Credentials.fromGeneratedSecret('postgres');
    const dbInstance = new rds.DatabaseInstance(this, 'AppDb', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.of('16', '16'),
      }),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      credentials: dbCredentials,
      multiAz: true,
      allocatedStorage: 100,
      maxAllocatedStorage: 200,
      storageEncrypted: true,
      storageEncryptionKey: encryptionKey,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      securityGroups: [rdsSg],
      backupRetention: cdk.Duration.days(7),
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      parameterGroup: rds.ParameterGroup.fromParameterGroupName(
        this,
        'DefaultPg',
        'default.postgres16'
      ),
    });
    dbInstance.connections.allowDefaultPortFrom(asgSg);
    if (dbInstance.secret) {
      dbInstance.secret.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    }

    // CloudWatch logs and alarms
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
      metric: alb.metricHttpCodeElb(elbv2.HttpCodeElb.ELB_5XX_COUNT, {
        period: cdk.Duration.minutes(1),
      }),
      threshold: 5,
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'RdsHighCpuAlarm', {
      metric: dbInstance.metricCPUUtilization({
        period: cdk.Duration.minutes(1),
      }),
      threshold: 80,
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Route53 failover (alias to ALB) with health check - only if context provided
    const domainName =
      props?.domainName || this.node.tryGetContext('domainName');
    const hostedZoneId =
      props?.hostedZoneId || this.node.tryGetContext('hostedZoneId');
    if (domainName && hostedZoneId) {
      const parentZoneName = domainName.split('.').slice(1).join('.');
      const zone = route53.HostedZone.fromHostedZoneAttributes(
        this,
        'HostedZoneForR53',
        {
          hostedZoneId,
          zoneName: parentZoneName,
        }
      );

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

    // CI/CD (no CodeCommit): S3 Source + CodeBuild + CodePipeline
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

    pipeline.addStage({
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

    // Outputs
    new cdk.CfnOutput(this, 'AlbDnsName', { value: alb.loadBalancerDnsName });
    new cdk.CfnOutput(this, 'StaticBucketName', {
      value: staticAssetsBucket.bucketName,
    });
    new cdk.CfnOutput(this, 'DbEndpoint', {
      value: dbInstance.instanceEndpoint.hostname,
    });
    new cdk.CfnOutput(this, 'PipelineSourceBucketName', {
      value: pipelineSourceBucket.bucketName,
    });
    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
    });
  }
}
