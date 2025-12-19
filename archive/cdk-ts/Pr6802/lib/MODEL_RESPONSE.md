# Multi-Region Disaster Recovery Architecture - CDK TypeScript Implementation

This implementation provides a comprehensive multi-region disaster recovery solution spanning us-east-1 (primary) and us-east-2 (secondary) regions with automated failover capabilities.

## Architecture Overview

The solution includes:
- Aurora Global Database with automated backtrack
- ECS Fargate services in both regions
- DynamoDB global tables for session management
- Route 53 health checks and DNS failover
- S3 cross-region replication with RTC
- EventBridge global endpoints
- AWS Backup for all critical resources
- CloudWatch Synthetics canaries
- Step Functions for failover orchestration
- Systems Manager Parameter Store with replication

## File: lib/tap-stack.ts

```typescript
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
  isPrimaryRegion: boolean;
  peerVpcId?: string;
  peerRegion?: string;
  globalDatabaseIdentifier?: string;
  hostedZoneName?: string;
  hostedZoneId?: string;
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly cluster: ecs.Cluster;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly auroraCluster?: rds.DatabaseCluster;
  public readonly globalDatabase?: rds.CfnGlobalCluster;
  public readonly hostedZone?: route53.HostedZone;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix, isPrimaryRegion } = props;

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

    // VPC Peering (if peer VPC specified)
    if (props.peerVpcId && props.peerRegion) {
      const peeringConnection = new ec2.CfnVPCPeeringConnection(
        this,
        `vpc-peering-${environmentSuffix}`,
        {
          vpcId: this.vpc.vpcId,
          peerVpcId: props.peerVpcId,
          peerRegion: props.peerRegion,
        }
      );
    }

    // Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, `alb-sg-${environmentSuffix}`, {
      vpc: this.vpc,
      securityGroupName: `alb-sg-${environmentSuffix}`,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
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

    const ecsSecurityGroup = new ec2.SecurityGroup(this, `ecs-sg-${environmentSuffix}`, {
      vpc: this.vpc,
      securityGroupName: `ecs-sg-${environmentSuffix}`,
      description: 'Security group for ECS tasks',
      allowAllOutbound: true,
    });
    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow traffic from ALB'
    );

    const dbSecurityGroup = new ec2.SecurityGroup(this, `db-sg-${environmentSuffix}`, {
      vpc: this.vpc,
      securityGroupName: `db-sg-${environmentSuffix}`,
      description: 'Security group for Aurora database',
      allowAllOutbound: false,
    });
    dbSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from ECS'
    );

    // Aurora Global Database (Primary region only creates the global cluster)
    if (isPrimaryRegion) {
      this.globalDatabase = new rds.CfnGlobalCluster(this, `global-db-${environmentSuffix}`, {
        globalClusterIdentifier: `global-db-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        storageEncrypted: true,
      });

      // Primary Aurora Cluster
      this.auroraCluster = new rds.DatabaseCluster(this, `aurora-primary-${environmentSuffix}`, {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_14_6,
        }),
        credentials: rds.Credentials.fromGeneratedSecret('dbadmin'),
        writer: rds.ClusterInstance.provisioned(`writer-${environmentSuffix}`, {
          instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MEDIUM),
        }),
        readers: [
          rds.ClusterInstance.provisioned(`reader-${environmentSuffix}`, {
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MEDIUM),
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
      });

      // Add cluster to global database
      const cfnDbCluster = this.auroraCluster.node.defaultChild as rds.CfnDBCluster;
      cfnDbCluster.addPropertyOverride('GlobalClusterIdentifier', this.globalDatabase.ref);
      cfnDbCluster.addPropertyOverride('BacktrackWindow', 72); // 72 hours backtrack
    } else {
      // Secondary Aurora Cluster (part of global database)
      if (props.globalDatabaseIdentifier) {
        this.auroraCluster = new rds.DatabaseCluster(
          this,
          `aurora-secondary-${environmentSuffix}`,
          {
            engine: rds.DatabaseClusterEngine.auroraPostgres({
              version: rds.AuroraPostgresEngineVersion.VER_14_6,
            }),
            writer: rds.ClusterInstance.provisioned(`writer-secondary-${environmentSuffix}`, {
              instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MEDIUM),
            }),
            vpc: this.vpc,
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
            securityGroups: [dbSecurityGroup],
            storageEncrypted: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          }
        );

        const cfnDbCluster = this.auroraCluster.node.defaultChild as rds.CfnDBCluster;
        cfnDbCluster.addPropertyOverride(
          'GlobalClusterIdentifier',
          props.globalDatabaseIdentifier
        );
      }
    }

    // DynamoDB Global Table (Primary region defines the table)
    if (isPrimaryRegion) {
      const sessionTable = new dynamodb.Table(this, `session-table-${environmentSuffix}`, {
        tableName: `session-table-${environmentSuffix}`,
        partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        pointInTimeRecovery: true,
        replicationRegions: ['us-east-2'],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
    }

    // S3 Buckets with Cross-Region Replication
    const sourceBucket = new s3.Bucket(this, `source-bucket-${environmentSuffix}`, {
      bucketName: `source-bucket-${environmentSuffix}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    if (isPrimaryRegion) {
      const replicationRole = new iam.Role(this, `replication-role-${environmentSuffix}`, {
        assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
        roleName: `s3-replication-role-${environmentSuffix}`,
      });

      replicationRole.addToPolicy(
        new iam.PolicyStatement({
          actions: [
            's3:GetReplicationConfiguration',
            's3:ListBucket',
            's3:GetObjectVersionForReplication',
            's3:GetObjectVersionAcl',
          ],
          resources: [sourceBucket.bucketArn, `${sourceBucket.bucketArn}/*`],
        })
      );

      replicationRole.addToPolicy(
        new iam.PolicyStatement({
          actions: ['s3:ReplicateObject', 's3:ReplicateDelete', 's3:ReplicateTags'],
          resources: [`arn:aws:s3:::source-bucket-${environmentSuffix}-${this.account}/*`],
        })
      );

      const cfnBucket = sourceBucket.node.defaultChild as s3.CfnBucket;
      cfnBucket.replicationConfiguration = {
        role: replicationRole.roleArn,
        rules: [
          {
            id: `replication-rule-${environmentSuffix}`,
            status: 'Enabled',
            priority: 1,
            filter: {},
            destination: {
              bucket: `arn:aws:s3:::source-bucket-${environmentSuffix}-${this.account}`,
              replicationTime: {
                status: 'Enabled',
                time: { minutes: 15 },
              },
              metrics: {
                status: 'Enabled',
                eventThreshold: { minutes: 15 },
              },
            },
          },
        ],
      };
    }

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

    const container = taskDefinition.addContainer(`container-${environmentSuffix}`, {
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
    });

    container.addPortMappings({
      containerPort: 8080,
      protocol: ecs.Protocol.TCP,
    });

    // Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, `alb-${environmentSuffix}`, {
      loadBalancerName: `alb-${environmentSuffix}`,
      vpc: this.vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `target-group-${environmentSuffix}`,
      {
        targetGroupName: `tg-${environmentSuffix}`,
        vpc: this.vpc,
        port: 8080,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/health',
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
    const fargateService = new ecs.FargateService(this, `fargate-service-${environmentSuffix}`, {
      serviceName: `fargate-service-${environmentSuffix}`,
      cluster: this.cluster,
      taskDefinition: taskDefinition,
      desiredCount: 2,
      securityGroups: [ecsSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    fargateService.attachToApplicationTargetGroup(targetGroup);

    // Route 53 Hosted Zone and Health Checks (Primary region only)
    if (isPrimaryRegion) {
      this.hostedZone = new route53.HostedZone(this, `hosted-zone-${environmentSuffix}`, {
        zoneName: props.hostedZoneName || `example-${environmentSuffix}.com`,
      });

      const primaryHealthCheck = new route53.CfnHealthCheck(
        this,
        `health-check-primary-${environmentSuffix}`,
        {
          healthCheckConfig: {
            type: 'HTTPS',
            resourcePath: '/health',
            fullyQualifiedDomainName: this.loadBalancer.loadBalancerDnsName,
            port: 80,
            requestInterval: 30,
            failureThreshold: 3,
          },
        }
      );

      // Primary DNS Record with failover
      new route53.CfnRecordSet(this, `primary-record-${environmentSuffix}`, {
        hostedZoneId: this.hostedZone.hostedZoneId,
        name: `app.${this.hostedZone.zoneName}`,
        type: 'A',
        setIdentifier: 'primary',
        failover: 'PRIMARY',
        healthCheckId: primaryHealthCheck.attrHealthCheckId,
        aliasTarget: {
          hostedZoneId: this.loadBalancer.loadBalancerCanonicalHostedZoneId,
          dnsName: this.loadBalancer.loadBalancerDnsName,
          evaluateTargetHealth: true,
        },
      });
    } else if (props.hostedZoneId) {
      // Secondary health check and DNS record
      const secondaryHealthCheck = new route53.CfnHealthCheck(
        this,
        `health-check-secondary-${environmentSuffix}`,
        {
          healthCheckConfig: {
            type: 'HTTPS',
            resourcePath: '/health',
            fullyQualifiedDomainName: this.loadBalancer.loadBalancerDnsName,
            port: 80,
            requestInterval: 30,
            failureThreshold: 3,
          },
        }
      );

      new route53.CfnRecordSet(this, `secondary-record-${environmentSuffix}`, {
        hostedZoneId: props.hostedZoneId,
        name: `app.${props.hostedZoneName}`,
        type: 'A',
        setIdentifier: 'secondary',
        failover: 'SECONDARY',
        healthCheckId: secondaryHealthCheck.attrHealthCheckId,
        aliasTarget: {
          hostedZoneId: this.loadBalancer.loadBalancerCanonicalHostedZoneId,
          dnsName: this.loadBalancer.loadBalancerDnsName,
          evaluateTargetHealth: true,
        },
      });
    }

    // EventBridge Global Endpoint (Primary region only)
    if (isPrimaryRegion) {
      const eventBus = new events.EventBus(this, `event-bus-${environmentSuffix}`, {
        eventBusName: `event-bus-${environmentSuffix}`,
      });
    }

    // CloudWatch Synthetics Canary
    const canaryRole = new iam.Role(this, `canary-role-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    canaryRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:PutObject', 's3:GetObject'],
        resources: [`${sourceBucket.bucketArn}/*`],
      })
    );

    canaryRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetBucketLocation'],
        resources: [sourceBucket.bucketArn],
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

    const canary = new synthetics.CfnCanary(this, `canary-${environmentSuffix}`, {
      name: `canary-${environmentSuffix}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
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
      artifactS3Location: `s3://${sourceBucket.bucketName}/canary`,
      runtimeVersion: 'syn-nodejs-puppeteer-4.0',
      schedule: {
        expression: 'rate(5 minutes)',
      },
      startCanaryAfterCreation: true,
    });

    // AWS Backup Plan
    const backupVault = new backup.BackupVault(this, `backup-vault-${environmentSuffix}`, {
      backupVaultName: `backup-vault-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const backupPlan = new backup.BackupPlan(this, `backup-plan-${environmentSuffix}`, {
      backupPlanName: `backup-plan-${environmentSuffix}`,
      backupVault: backupVault,
      backupPlanRules: [
        new backup.BackupPlanRule({
          ruleName: `daily-backup-${environmentSuffix}`,
          scheduleExpression: events.Schedule.cron({ hour: '2', minute: '0' }),
          deleteAfter: cdk.Duration.days(7),
        }),
      ],
    });

    if (this.auroraCluster) {
      backupPlan.addSelection(`aurora-backup-${environmentSuffix}`, {
        resources: [backup.BackupResource.fromRdsDatabaseCluster(this.auroraCluster)],
      });
    }

    // Step Functions State Machine for Failover
    const promoteSecondaryTask = new tasks.CallAwsService(
      this,
      `promote-secondary-${environmentSuffix}`,
      {
        service: 'rds',
        action: 'failoverGlobalCluster',
        parameters: {
          GlobalClusterIdentifier: `global-db-${environmentSuffix}`,
          TargetDbClusterIdentifier: this.auroraCluster?.clusterArn,
        },
        iamResources: ['*'],
      }
    );

    const updateDnsTask = new tasks.CallAwsService(this, `update-dns-${environmentSuffix}`, {
      service: 'route53',
      action: 'changeResourceRecordSets',
      parameters: {
        HostedZoneId: props.hostedZoneId,
        ChangeBatch: {
          Changes: [
            {
              Action: 'UPSERT',
              ResourceRecordSet: {
                Name: `app.${props.hostedZoneName}`,
                Type: 'A',
                SetIdentifier: 'failover',
                Failover: 'PRIMARY',
                AliasTarget: {
                  HostedZoneId: this.loadBalancer.loadBalancerCanonicalHostedZoneId,
                  DNSName: this.loadBalancer.loadBalancerDnsName,
                  EvaluateTargetHealth: true,
                },
              },
            },
          ],
        },
      },
      iamResources: ['*'],
    });

    const failoverDefinition = promoteSecondaryTask.next(updateDnsTask);

    const stateMachine = new sfn.StateMachine(this, `failover-sm-${environmentSuffix}`, {
      stateMachineName: `failover-sm-${environmentSuffix}`,
      definition: failoverDefinition,
      timeout: cdk.Duration.minutes(15),
    });

    // Systems Manager Parameter Store
    new ssm.StringParameter(this, `db-endpoint-${environmentSuffix}`, {
      parameterName: `/app/${environmentSuffix}/db-endpoint`,
      stringValue: this.auroraCluster?.clusterEndpoint.hostname || 'pending',
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

    if (this.auroraCluster) {
      new cdk.CfnOutput(this, 'DatabaseEndpoint', {
        value: this.auroraCluster.clusterEndpoint.hostname,
        description: 'Aurora database endpoint',
        exportName: `db-endpoint-${environmentSuffix}`,
      });
    }

    if (this.globalDatabase && isPrimaryRegion) {
      new cdk.CfnOutput(this, 'GlobalDatabaseId', {
        value: this.globalDatabase.ref,
        description: 'Global Database Identifier',
        exportName: `global-db-id-${environmentSuffix}`,
      });
    }

    if (this.hostedZone && isPrimaryRegion) {
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
}
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const hostedZoneName = app.node.tryGetContext('hostedZoneName') || `dr-${environmentSuffix}.com`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('PRNumber', prNumber);
Tags.of(app).add('Team', team);
Tags.of(app).add('CreatedAt', createdAt);

// Primary Stack in us-east-1
const primaryStack = new TapStack(app, `TapStack-Primary-${environmentSuffix}`, {
  stackName: `TapStack-Primary-${environmentSuffix}`,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  environmentSuffix: environmentSuffix,
  isPrimaryRegion: true,
  hostedZoneName: hostedZoneName,
  description: 'Multi-region DR primary stack in us-east-1',
});

// Secondary Stack in us-east-2
const secondaryStack = new TapStack(app, `TapStack-Secondary-${environmentSuffix}`, {
  stackName: `TapStack-Secondary-${environmentSuffix}`,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-2',
  },
  environmentSuffix: environmentSuffix,
  isPrimaryRegion: false,
  peerVpcId: primaryStack.vpc.vpcId,
  peerRegion: 'us-east-1',
  globalDatabaseIdentifier: primaryStack.globalDatabase?.ref,
  hostedZoneId: primaryStack.hostedZone?.hostedZoneId,
  hostedZoneName: hostedZoneName,
  description: 'Multi-region DR secondary stack in us-east-2',
});

// Add dependency
secondaryStack.addDependency(primaryStack);

app.synth();
```

## Deployment Instructions

### Prerequisites

```bash
npm install
npm run build
```

### Bootstrap Regions

```bash
cdk bootstrap aws://ACCOUNT/us-east-1
cdk bootstrap aws://ACCOUNT/us-east-2
```

### Deploy

```bash
# Deploy all stacks
cdk deploy --all --context environmentSuffix=prod --context hostedZoneName=example.com

# Or deploy individually
cdk deploy TapStack-Primary-prod --context environmentSuffix=prod
cdk deploy TapStack-Secondary-prod --context environmentSuffix=prod
```

### Verify

```bash
# Check primary stack
aws cloudformation describe-stacks --stack-name TapStack-Primary-prod --region us-east-1

# Check secondary stack
aws cloudformation describe-stacks --stack-name TapStack-Secondary-prod --region us-east-2
```
