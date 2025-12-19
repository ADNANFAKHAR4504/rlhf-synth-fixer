import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as synthetics from 'aws-cdk-lib/aws-synthetics';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as backup from 'aws-cdk-lib/aws-backup';
import * as events from 'aws-cdk-lib/aws-events';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  hostedZoneName?: string;
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly cluster: ecs.Cluster;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly auroraCluster: rds.DatabaseCluster;
  public readonly hostedZone: route53.HostedZone;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // VPC Configuration - 3 AZs with private subnets
    this.vpc = new ec2.Vpc(this, `vpc-${environmentSuffix}`, {
      vpcName: `vpc-${environmentSuffix}`,
      maxAzs: 3,
      natGateways: 1, // Cost optimization - single NAT gateway
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `public-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `private-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: `isolated-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `alb-sg-${environmentSuffix}`,
      {
        vpc: this.vpc,
        securityGroupName: `alb-sg-${environmentSuffix}`,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: true,
      }
    );
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

    const ecsSecurityGroup = new ec2.SecurityGroup(
      this,
      `ecs-sg-${environmentSuffix}`,
      {
        vpc: this.vpc,
        securityGroupName: `ecs-sg-${environmentSuffix}`,
        description: 'Security group for ECS tasks',
        allowAllOutbound: true,
      }
    );
    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      `db-sg-${environmentSuffix}`,
      {
        vpc: this.vpc,
        securityGroupName: `db-sg-${environmentSuffix}`,
        description: 'Security group for Aurora database',
        allowAllOutbound: false,
      }
    );
    dbSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from ECS'
    );

    // Aurora Cluster with Multi-AZ
    this.auroraCluster = new rds.DatabaseCluster(
      this,
      `aurora-${environmentSuffix}`,
      {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_14_6,
        }),
        credentials: rds.Credentials.fromGeneratedSecret('dbadmin'),
        writer: rds.ClusterInstance.provisioned(`writer-${environmentSuffix}`, {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T4G,
            ec2.InstanceSize.MEDIUM
          ),
        }),
        readers: [
          rds.ClusterInstance.provisioned(`reader-${environmentSuffix}`, {
            instanceType: ec2.InstanceType.of(
              ec2.InstanceClass.T4G,
              ec2.InstanceSize.MEDIUM
            ),
          }),
        ],
        vpc: this.vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
        securityGroups: [dbSecurityGroup],
        backup: {
          retention: cdk.Duration.days(7),
        },
        storageEncrypted: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // DynamoDB Table for session management
    new dynamodb.Table(this, `session-table-${environmentSuffix}`, {
      tableName: `session-table-${environmentSuffix}`,
      partitionKey: {
        name: 'sessionId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // S3 Bucket for application data
    const appBucket = new s3.Bucket(this, `s3-bucket-${environmentSuffix}`, {
      bucketName: `app-bucket-${environmentSuffix}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ECS Cluster and Fargate Service
    this.cluster = new ecs.Cluster(this, `ecs-cluster-${environmentSuffix}`, {
      clusterName: `ecs-cluster-${environmentSuffix}`,
      vpc: this.vpc,
      containerInsights: true,
    });

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      `task-definition-${environmentSuffix}`,
      {
        family: `task-family-${environmentSuffix}`,
        cpu: 512,
        memoryLimitMiB: 1024,
      }
    );

    const container = taskDefinition.addContainer(
      `container-${environmentSuffix}`,
      {
        image: ecs.ContainerImage.fromRegistry('nginx:latest'), // Replace with actual image
        containerName: `container-${environmentSuffix}`,
        logging: ecs.LogDrivers.awsLogs({
          streamPrefix: `ecs-${environmentSuffix}`,
          logRetention: logs.RetentionDays.ONE_WEEK,
        }),
        environment: {
          REGION: this.region,
          ENVIRONMENT: environmentSuffix,
        },
      }
    );

    container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    });

    // Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      `alb-${environmentSuffix}`,
      {
        loadBalancerName: `alb-${environmentSuffix}`,
        vpc: this.vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
      }
    );

    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `target-group-${environmentSuffix}`,
      {
        targetGroupName: `tg-${environmentSuffix}`,
        vpc: this.vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
      }
    );

    this.loadBalancer.addListener(`listener-${environmentSuffix}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Fargate Service
    const fargateService = new ecs.FargateService(
      this,
      `fargate-service-${environmentSuffix}`,
      {
        serviceName: `fargate-service-${environmentSuffix}`,
        cluster: this.cluster,
        taskDefinition: taskDefinition,
        desiredCount: 2,
        securityGroups: [ecsSecurityGroup],
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      }
    );

    fargateService.attachToApplicationTargetGroup(targetGroup);

    // Route 53 Hosted Zone and Health Checks
    this.hostedZone = new route53.HostedZone(
      this,
      `hosted-zone-${environmentSuffix}`,
      {
        zoneName: props.hostedZoneName || `example-${environmentSuffix}.com`,
      }
    );

    new route53.CfnHealthCheck(this, `health-check-${environmentSuffix}`, {
      healthCheckConfig: {
        type: 'HTTP',
        resourcePath: '/',
        fullyQualifiedDomainName: this.loadBalancer.loadBalancerDnsName,
        port: 80,
        requestInterval: 30,
        failureThreshold: 3,
      },
    });

    // DNS Record pointing to ALB
    new route53.CfnRecordSet(this, `app-record-${environmentSuffix}`, {
      hostedZoneId: this.hostedZone.hostedZoneId,
      name: `app.${this.hostedZone.zoneName}`,
      type: 'A',
      aliasTarget: {
        hostedZoneId: this.loadBalancer.loadBalancerCanonicalHostedZoneId,
        dnsName: this.loadBalancer.loadBalancerDnsName,
        evaluateTargetHealth: true,
      },
    });

    // EventBridge Event Bus
    new events.EventBus(this, `event-bus-${environmentSuffix}`, {
      eventBusName: `event-bus-${environmentSuffix}`,
    });

    // CloudWatch Synthetics Canary
    const canaryRole = new iam.Role(this, `canary-role-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    canaryRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:PutObject', 's3:GetObject'],
        resources: [`${appBucket.bucketArn}/*`],
      })
    );

    canaryRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetBucketLocation'],
        resources: [appBucket.bucketArn],
      })
    );

    canaryRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'cloudwatch:namespace': 'CloudWatchSynthetics',
          },
        },
      })
    );

    new synthetics.CfnCanary(this, `canary-${environmentSuffix}`, {
      name: `canary-${environmentSuffix}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-'),
      executionRoleArn: canaryRole.roleArn,
      code: {
        handler: 'index.handler',
        script: `
          const synthetics = require('Synthetics');
          const log = require('SyntheticsLogger');

          const pageLoadBlueprint = async function () {
            const URL = '${this.loadBalancer.loadBalancerDnsName}';
            let page = await synthetics.getPage();
            const response = await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await synthetics.takeScreenshot('loaded', 'result');
            const pageTitle = await page.title();
            log.info('Page title: ' + pageTitle);
            if (response.status() !== 200) {
              throw 'Failed to load page!';
            }
          };

          exports.handler = async () => {
            return await pageLoadBlueprint();
          };
        `,
      },
      artifactS3Location: `s3://${appBucket.bucketName}/canary`,
      runtimeVersion: 'syn-nodejs-puppeteer-9.1',
      schedule: {
        expression: 'rate(5 minutes)',
      },
      startCanaryAfterCreation: true,
    });

    // AWS Backup Plan
    const backupVault = new backup.BackupVault(
      this,
      `backup-vault-${environmentSuffix}`,
      {
        backupVaultName: `backup-vault-${environmentSuffix}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const backupPlan = new backup.BackupPlan(
      this,
      `backup-plan-${environmentSuffix}`,
      {
        backupPlanName: `backup-plan-${environmentSuffix}`,
        backupVault: backupVault,
        backupPlanRules: [
          new backup.BackupPlanRule({
            ruleName: `daily-backup-${environmentSuffix}`,
            scheduleExpression: events.Schedule.cron({
              hour: '2',
              minute: '0',
            }),
            deleteAfter: cdk.Duration.days(7),
          }),
        ],
      }
    );

    backupPlan.addSelection(`aurora-backup-${environmentSuffix}`, {
      resources: [
        backup.BackupResource.fromRdsDatabaseCluster(this.auroraCluster),
      ],
    });

    // Step Functions State Machine for Operational Tasks
    const checkHealthTask = new tasks.CallAwsService(
      this,
      `check-health-${environmentSuffix}`,
      {
        service: 'elasticloadbalancingv2',
        action: 'describeTargetHealth',
        parameters: {
          TargetGroupArn: targetGroup.targetGroupArn,
        },
        iamResources: ['*'],
      }
    );

    const verifyBackupTask = new tasks.CallAwsService(
      this,
      `verify-backup-${environmentSuffix}`,
      {
        service: 'rds',
        action: 'describeDBClusterSnapshots',
        parameters: {
          DbClusterIdentifier: this.auroraCluster.clusterIdentifier,
        },
        iamResources: ['*'],
      }
    );

    const operationalDefinition = checkHealthTask.next(verifyBackupTask);

    new sfn.StateMachine(this, `operational-sm-${environmentSuffix}`, {
      stateMachineName: `operational-sm-${environmentSuffix}`,
      definition: operationalDefinition,
      timeout: cdk.Duration.minutes(15),
    });

    // Systems Manager Parameter Store
    new ssm.StringParameter(this, `db-endpoint-${environmentSuffix}`, {
      parameterName: `/app/${environmentSuffix}/db-endpoint`,
      stringValue: this.auroraCluster.clusterEndpoint.hostname,
      description: 'Aurora database endpoint',
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, `alb-dns-${environmentSuffix}`, {
      parameterName: `/app/${environmentSuffix}/alb-dns`,
      stringValue: this.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: this.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS',
      exportName: `alb-dns-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.auroraCluster.clusterEndpoint.hostname,
      description: 'Aurora database endpoint',
      exportName: `db-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: this.hostedZone.hostedZoneId,
      description: 'Route 53 Hosted Zone ID',
      exportName: `hosted-zone-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'HostedZoneName', {
      value: this.hostedZone.zoneName,
      description: 'Route 53 Hosted Zone Name',
      exportName: `hosted-zone-name-${environmentSuffix}`,
    });
  }
}
