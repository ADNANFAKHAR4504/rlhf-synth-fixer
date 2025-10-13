import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import { Construct } from 'constructs';

interface SimplifiedStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class SimplifiedStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: SimplifiedStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Network
    const vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: `healthcare-vpc-${environmentSuffix}`,
      maxAzs: 3,
      natGateways: 1,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
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

    // Security
    const kmsKey = new kms.Key(this, 'KMSKey', {
      alias: `healthcare-key-${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `healthcare-db-${environmentSuffix}`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 32,
      },
      encryptionKey: kmsKey,
    });

    // Database
    const database = new rds.DatabaseCluster(this, 'Database', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_5,
      }),
      credentials: rds.Credentials.fromSecret(databaseSecret),
      writer: rds.ClusterInstance.serverlessV2('Writer', {
        autoMinorVersionUpgrade: true,
      }),
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 2,
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // EFS
    const fileSystem = new efs.FileSystem(this, 'FileSystem', {
      vpc: vpc,
      encrypted: true,
      kmsKey: kmsKey,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: `healthcare-${environmentSuffix}`,
      vpc: vpc,
      containerInsights: true,
    });

    // ALB
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: vpc,
      internetFacing: true,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc: vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
    });

    alb.addListener('Listener', {
      port: 80,
      defaultTargetGroups: [targetGroup],
    });

    // Task Definition
    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
      taskRole: taskRole,
    });

    databaseSecret.grantRead(taskDefinition.taskRole);

    const container = taskDefinition.addContainer('app', {
      image: ecs.ContainerImage.fromRegistry('nginx:alpine'),
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: 'healthcare',
        logRetention: logs.RetentionDays.ONE_WEEK,
      }),
      environment: {
        ENVIRONMENT: environmentSuffix,
      },
    });

    container.addPortMappings({
      containerPort: 80,
    });

    // EFS Volume
    taskDefinition.addVolume({
      name: 'efs',
      efsVolumeConfiguration: {
        fileSystemId: fileSystem.fileSystemId,
      },
    });

    container.addMountPoints({
      containerPath: '/data',
      sourceVolume: 'efs',
      readOnly: false,
    });

    // Service
    const service = new ecs.FargateService(this, 'Service', {
      cluster: cluster,
      taskDefinition: taskDefinition,
      desiredCount: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    service.attachToApplicationTargetGroup(targetGroup);
    fileSystem.connections.allowDefaultPortFrom(service);

    // Cache
    const cacheSubnetGroup = new elasticache.CfnSubnetGroup(
      this,
      'CacheSubnetGroup',
      {
        description: 'Cache subnet group',
        subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId),
      }
    );

    const cacheSG = new ec2.SecurityGroup(this, 'CacheSG', {
      vpc: vpc,
      allowAllOutbound: false,
    });

    cacheSG.addIngressRule(ec2.Peer.ipv4(vpc.vpcCidrBlock), ec2.Port.tcp(6379));

    new elasticache.CfnReplicationGroup(this, 'Cache', {
      replicationGroupId: `cache-${environmentSuffix}`,
      replicationGroupDescription: 'Session cache',
      engine: 'redis',
      cacheNodeType: 'cache.t3.micro',
      numCacheClusters: 1,
      cacheSubnetGroupName: cacheSubnetGroup.ref,
      securityGroupIds: [cacheSG.securityGroupId],
      atRestEncryptionEnabled: true,
      transitEncryptionEnabled: false,
      automaticFailoverEnabled: false, // Single node, no automatic failover
    });

    // Outputs
    new cdk.CfnOutput(this, 'ALBEndpoint', {
      value: alb.loadBalancerDnsName,
      exportName: `${environmentSuffix}-alb-endpoint`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.clusterEndpoint.hostname,
      exportName: `${environmentSuffix}-db-endpoint`,
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      exportName: `${environmentSuffix}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'EFSId', {
      value: fileSystem.fileSystemId,
      exportName: `${environmentSuffix}-efs-id`,
    });
  }
}
