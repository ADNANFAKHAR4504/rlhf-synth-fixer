import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface InfraStackProps extends cdk.StackProps {
  vpcCidr?: string;
  domainName?: string;
  dbInstanceClass?: ec2.InstanceType;
  ecsInstanceType?: ec2.InstanceType;
  environmentSuffix: string;
  enableDeletionProtection?: boolean;
}

// TapStack implementation with enhanced security and random naming
export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly ecsCluster: ecs.Cluster;
  public readonly database: rds.DatabaseInstance;
  public readonly dbSecret: secretsmanager.Secret;
  public readonly environmentSuffix: string;
  private readonly randomSuffix: string;

  constructor(scope: Construct, id: string, props: InfraStackProps) {
    super(scope, id, props);
    this.environmentSuffix = props.environmentSuffix;
    // Generate a random suffix for unique resource naming
    this.randomSuffix = Math.random().toString(36).substring(2, 8);

    // Configuration with defaults
    const vpcCidr = props.vpcCidr || '10.0.0.0/16';
    const dbInstanceClass =
      props.dbInstanceClass ||
      ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO);
    const ecsInstanceType =
      props.ecsInstanceType ||
      ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL);
    const enableDeletionProtection = props.enableDeletionProtection ?? false;

    // 1. NETWORKING SETUP
    // Create custom VPC with configurable CIDR across 2 AZs
    this.vpc = new ec2.Vpc(
      this,
      `VPC-${this.environmentSuffix}-${this.randomSuffix}`,
      {
        ipAddresses: ec2.IpAddresses.cidr(vpcCidr),
        maxAzs: 2, // Primary + Secondary AZs
        enableDnsHostnames: true,
        enableDnsSupport: true,
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: `PublicSubnet-${this.environmentSuffix}-${this.randomSuffix}`,
            subnetType: ec2.SubnetType.PUBLIC,
          },
          {
            cidrMask: 24,
            name: `PrivateSubnet-${this.environmentSuffix}-${this.randomSuffix}`,
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, // Includes NAT Gateway
          },
          {
            cidrMask: 24,
            name: `DatabaseSubnet-${this.environmentSuffix}-${this.randomSuffix}`,
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED, // For RDS
          },
        ],
        natGateways: 2, // One NAT Gateway per AZ for HA
      }
    );

    // 2. SECURITY - KMS Key for encryption
    const kmsKey = new kms.Key(
      this,
      `KMSKey-${this.environmentSuffix}-${this.randomSuffix}`,
      {
        description: `KMS key for infrastructure encryption - ${this.environmentSuffix}-${this.randomSuffix}`,
        enableKeyRotation: true,
        keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
        keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
        removalPolicy: cdk.RemovalPolicy.RETAIN, // Retain the key for future use
        pendingWindow: cdk.Duration.days(7), // Minimum waiting period for key deletion
        policy: new iam.PolicyDocument({
          statements: [
            // Allow root user full access to the key
            new iam.PolicyStatement({
              sid: 'EnableIAMUserPermissions',
              effect: iam.Effect.ALLOW,
              principals: [new iam.AccountRootPrincipal()],
              actions: ['kms:*'],
              resources: ['*'],
            }),
            // Allow CloudWatch Logs service to use the key
            new iam.PolicyStatement({
              sid: 'AllowCloudWatchLogsAccess',
              effect: iam.Effect.ALLOW,
              principals: [
                new iam.ServicePrincipal(
                  `logs.${cdk.Stack.of(this).region}.amazonaws.com`
                ),
              ],
              actions: [
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:ReEncrypt',
                'kms:GenerateDataKey',
                'kms:DescribeKey',
              ],
              resources: ['*'],
              conditions: {
                ArnEquals: {
                  'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:log-group:/aws/ecs/cluster-${this.environmentSuffix}-${this.randomSuffix}`,
                },
              },
            }),
            // Allow RDS service to use the key for encryption
            new iam.PolicyStatement({
              sid: 'AllowRDSAccess',
              effect: iam.Effect.ALLOW,
              principals: [new iam.ServicePrincipal('rds.amazonaws.com')],
              actions: [
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
              ],
              resources: ['*'],
            }),
            // Allow Secrets Manager service to use the key
            new iam.PolicyStatement({
              sid: 'AllowSecretsManagerAccess',
              effect: iam.Effect.ALLOW,
              principals: [
                new iam.ServicePrincipal('secretsmanager.amazonaws.com'),
              ],
              actions: [
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
              ],
              resources: ['*'],
            }),
          ],
        }),
      }
    );

    // KMS Key Alias for easier reference
    new kms.Alias(
      this,
      `KMSKeyAlias-${this.environmentSuffix}-${this.randomSuffix}`,
      {
        aliasName: `alias/infra-encryption-key-${this.environmentSuffix}-${this.randomSuffix}`,
        targetKey: kmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // 3. DATABASE SETUP
    // Create database credentials in Secrets Manager
    this.dbSecret = new secretsmanager.Secret(
      this,
      `DBSecret-${this.environmentSuffix}-${this.randomSuffix}`,
      {
        description: `RDS PostgreSQL credentials - ${this.environmentSuffix}-${this.randomSuffix}`,
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            username: `pgadmin_${this.randomSuffix}`, // Unique username
          }),
          generateStringKey: 'password',
          excludeCharacters: '"@/\\\'',
          includeSpace: false,
          passwordLength: 32,
        },
        encryptionKey: kmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow destruction for testing
      }
    );

    // Database security group - restrictive access
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      `DBSecurityGroup-${this.environmentSuffix}-${this.randomSuffix}`,
      {
        securityGroupName: `DB-SG-${this.environmentSuffix}-${this.randomSuffix}`,
        vpc: this.vpc,
        description: `Security group for RDS database - ${this.environmentSuffix}-${this.randomSuffix}`,
        allowAllOutbound: false, // Explicit outbound rules for enhanced security
      }
    );

    // RDS PostgreSQL instance with Multi-AZ for automatic failover
    this.database = new rds.DatabaseInstance(
      this,
      `PostgreSQL-${this.environmentSuffix}-${this.randomSuffix}`,
      {
        instanceIdentifier: `postgresql-${this.environmentSuffix}-${this.randomSuffix}`,
        vpc: this.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15,
        }),
        instanceType: dbInstanceClass,
        securityGroups: [dbSecurityGroup],
        credentials: rds.Credentials.fromSecret(this.dbSecret),
        multiAz: true, // Enable automatic failover
        storageEncrypted: true,
        storageEncryptionKey: kmsKey,
        backupRetention: cdk.Duration.days(7),
        deletionProtection: enableDeletionProtection, // Configurable for testing
        deleteAutomatedBackups: false,
        enablePerformanceInsights: true,
        performanceInsightEncryptionKey: kmsKey,
        performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
        cloudwatchLogsExports: ['postgresql'],
        allocatedStorage: 20,
        maxAllocatedStorage: 100, // Enable storage autoscaling
        removalPolicy: enableDeletionProtection
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
        monitoringInterval: cdk.Duration.seconds(60), // Enhanced monitoring
        autoMinorVersionUpgrade: true, // Security updates
        preferredBackupWindow: '03:00-04:00', // Backup during low-traffic hours
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00', // Maintenance window
      }
    );

    // Create read replica for improved read performance
    const readReplica = new rds.DatabaseInstanceReadReplica(
      this,
      `PostgreSQLReplica-${this.environmentSuffix}-${this.randomSuffix}`,
      {
        instanceIdentifier: `postgresql-replica-${this.environmentSuffix}-${this.randomSuffix}`,
        sourceDatabaseInstance: this.database,
        instanceType: dbInstanceClass,
        vpc: this.vpc,
        securityGroups: [dbSecurityGroup],
        deleteAutomatedBackups: false,
        enablePerformanceInsights: true,
        performanceInsightEncryptionKey: kmsKey,
        performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
        autoMinorVersionUpgrade: true, // Security updates
        monitoringInterval: cdk.Duration.seconds(60), // Enhanced monitoring
        removalPolicy: enableDeletionProtection
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
      }
    );

    // Add dependency to ensure proper deletion order
    readReplica.node.addDependency(this.database);

    // 4. COMPUTE - ECS CLUSTER SETUP
    // CloudWatch Log Group for ECS
    const ecsLogGroup = new logs.LogGroup(
      this,
      `ECSLogGroup-${this.environmentSuffix}-${this.randomSuffix}`,
      {
        logGroupName: `/aws/ecs/cluster-${this.environmentSuffix}-${this.randomSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        encryptionKey: kmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow destruction for testing
      }
    );

    // ECS Cluster
    this.ecsCluster = new ecs.Cluster(
      this,
      `ECSCluster-${this.environmentSuffix}-${this.randomSuffix}`,
      {
        vpc: this.vpc,
        clusterName: `cluster-${this.environmentSuffix}-${this.randomSuffix}`,
        // containerInsights: true, // Deprecated - using v2 configuration
        enableFargateCapacityProviders: true, // Enable Fargate capacity providers
      }
    );

    // IAM Role for ECS instances with least privilege principles
    const ecsInstanceRole = new iam.Role(
      this,
      `ECSInstanceRole-${this.environmentSuffix}-${this.randomSuffix}`,
      {
        roleName: `ECSInstanceRole-${this.environmentSuffix}-${this.randomSuffix}`,
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        description: `IAM role for ECS EC2 instances - ${this.environmentSuffix}-${this.randomSuffix}`,
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonEC2ContainerServiceforEC2Role'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'CloudWatchAgentServerPolicy'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AmazonSSMManagedInstanceCore'
          ),
        ],
      }
    );

    // Add minimal permissions for Secrets Manager access (least privilege)
    ecsInstanceRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'SecretsManagerAccess',
        effect: iam.Effect.ALLOW,
        actions: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret',
        ],
        resources: [this.dbSecret.secretArn],
        conditions: {
          StringEquals: {
            'aws:RequestedRegion': cdk.Stack.of(this).region,
          },
        },
      })
    );

    // Add KMS permissions for decrypting secrets
    ecsInstanceRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'KMSDecryptAccess',
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:DescribeKey'],
        resources: [kmsKey.keyArn],
      })
    );

    // Security Group for ECS instances with restrictive rules
    const ecsSecurityGroup = new ec2.SecurityGroup(
      this,
      `ECSSecurityGroup-${this.environmentSuffix}-${this.randomSuffix}`,
      {
        securityGroupName: `ECS-SG-${this.environmentSuffix}-${this.randomSuffix}`,
        vpc: this.vpc,
        description: `Security group for ECS instances - ${this.environmentSuffix}-${this.randomSuffix}`,
        allowAllOutbound: false, // Explicit outbound rules for security
      }
    );

    // Allow HTTPS outbound for container image pulls and AWS API calls
    ecsSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS outbound for container pulls and AWS APIs'
    );

    // Allow HTTP outbound for container image pulls (Docker Hub)
    ecsSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP outbound for container pulls'
    );

    // Allow DNS outbound
    ecsSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(53),
      'DNS TCP outbound'
    );
    ecsSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.udp(53),
      'DNS UDP outbound'
    );

    // Allow ECS instances to connect to RDS with specific port
    dbSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(5432),
      `Allow ECS instances to connect to PostgreSQL - ${this.environmentSuffix}-${this.randomSuffix}`
    );

    // Allow database outbound to ECS for connection responses
    dbSecurityGroup.addEgressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow database responses to ECS'
    );

    // User Data script for ECS instances with security hardening
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'set -euo pipefail', // Fail on error and undefined variables
      'yum update -y --security', // Security updates only initially
      'yum install -y amazon-cloudwatch-agent aws-cli',

      // ECS Configuration
      `echo "ECS_CLUSTER=${this.ecsCluster.clusterName}" >> /etc/ecs/ecs.config`,
      'echo "ECS_ENABLE_CONTAINER_METADATA=true" >> /etc/ecs/ecs.config',
      'echo "ECS_ENABLE_TASK_IAM_ROLE=true" >> /etc/ecs/ecs.config',
      'echo "ECS_ENABLE_TASK_IAM_ROLE_NETWORK_HOST=true" >> /etc/ecs/ecs.config',

      // Security hardening
      'echo "ECS_ENABLE_TASK_ENI=true" >> /etc/ecs/ecs.config',
      'echo "ECS_DISABLE_IMAGE_CLEANUP=false" >> /etc/ecs/ecs.config',
      'echo "ECS_IMAGE_CLEANUP_INTERVAL=10m" >> /etc/ecs/ecs.config',

      // CloudWatch agent configuration
      'systemctl enable amazon-cloudwatch-agent',
      'systemctl start amazon-cloudwatch-agent',

      // System hardening
      'chmod 600 /etc/ecs/ecs.config',
      'systemctl enable ecs',
      'systemctl start ecs',

      // Log rotation
      'echo "/var/log/ecs/*.log {" > /etc/logrotate.d/ecs',
      'echo "  daily" >> /etc/logrotate.d/ecs',
      'echo "  rotate 7" >> /etc/logrotate.d/ecs',
      'echo "  compress" >> /etc/logrotate.d/ecs',
      'echo "  missingok" >> /etc/logrotate.d/ecs',
      'echo "  notifempty" >> /etc/logrotate.d/ecs',
      'echo "}" >> /etc/logrotate.d/ecs'
    );

    // Launch Template for Auto Scaling Group with security hardening
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      `ECSLaunchTemplate-${this.environmentSuffix}-${this.randomSuffix}`,
      {
        launchTemplateName: `ECS-Template-${this.environmentSuffix}-${this.randomSuffix}`,
        instanceType: ecsInstanceType,
        machineImage: ecs.EcsOptimizedImage.amazonLinux2(),
        securityGroup: ecsSecurityGroup,
        userData: userData,
        role: ecsInstanceRole,
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(30, {
              encrypted: true,
              // Use AWS-managed EBS key instead of custom KMS key to avoid InvalidState issues
              // Custom KMS key with DESTROY policy can enter PendingDeletion state causing deployment failures
              volumeType: ec2.EbsDeviceVolumeType.GP3,
              deleteOnTermination: true, // Ensure cleanup
              iops: 3000, // Baseline IOPS for GP3
              throughput: 125, // Baseline throughput for GP3
            }),
          },
        ],
        requireImdsv2: true, // Enforce IMDSv2 for enhanced security
        httpTokens: ec2.LaunchTemplateHttpTokens.REQUIRED,
        httpPutResponseHopLimit: 1, // Restrict IMDS hop count
      }
    );

    // Auto Scaling Group for ECS instances with enhanced configuration
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      `ECSAutoScalingGroup-${this.environmentSuffix}-${this.randomSuffix}`,
      {
        autoScalingGroupName: `ECS-ASG-${this.environmentSuffix}-${this.randomSuffix}`,
        vpc: this.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, // Deploy in private subnets
        },
        launchTemplate: launchTemplate,
        minCapacity: 2,
        maxCapacity: 10,
        desiredCapacity: 2,
        healthChecks: autoscaling.HealthChecks.ec2(), // More comprehensive health checks
        defaultInstanceWarmup: cdk.Duration.minutes(3), // Warm-up period
        groupMetrics: [autoscaling.GroupMetrics.all()], // Enable all metrics
        newInstancesProtectedFromScaleIn: false, // Allow scale-in for cost optimization
        terminationPolicies: [
          autoscaling.TerminationPolicy.NEWEST_INSTANCE, // Terminate newest instances first
          autoscaling.TerminationPolicy.DEFAULT,
        ],
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          maxBatchSize: 1,
          minInstancesInService: 1,
          pauseTime: cdk.Duration.minutes(5),
          waitOnResourceSignals: true,
        }),
      }
    );

    // CPU-based scaling policy
    autoScalingGroup.scaleOnCpuUtilization('CPUScaling', {
      targetUtilizationPercent: 70,
    });

    // Memory-based scaling policy is not supported directly by AutoScalingGroup.
    // To scale based on memory, use custom CloudWatch alarms and scaling policies.

    // Capacity Provider for ECS Cluster with optimized settings
    const capacityProvider = new ecs.AsgCapacityProvider(
      this,
      `CapacityProvider-${this.environmentSuffix}-${this.randomSuffix}`,
      {
        capacityProviderName: `CP-${this.environmentSuffix}-${this.randomSuffix}`,
        autoScalingGroup: autoScalingGroup,
        enableManagedScaling: true,
        enableManagedTerminationProtection: false, // Allow termination for cost optimization
        targetCapacityPercent: 80, // Maintain 80% capacity utilization
        machineImageType: ecs.MachineImageType.AMAZON_LINUX_2,
      }
    );

    this.ecsCluster.addAsgCapacityProvider(capacityProvider);

    // 5. DNS SETUP (Route 53)
    if (props.domainName) {
      const hostedZone = new route53.HostedZone(
        this,
        `HostedZone-${this.environmentSuffix}-${this.randomSuffix}`,
        {
          zoneName: `${this.environmentSuffix}-${this.randomSuffix}.${props.domainName}`, // Unique subdomain
          comment: `Hosted zone for ${this.environmentSuffix}-${this.randomSuffix} environment`,
        }
      );

      // Output the name servers for domain configuration
      new cdk.CfnOutput(this, 'Route53NameServers', {
        value: cdk.Fn.join(',', hostedZone.hostedZoneNameServers || []),
        description: 'Route53 Name Servers for domain configuration',
        exportName: `${this.stackName}-Route53NameServers`,
      });
    }

    // 6. OUTPUTS
    new cdk.CfnOutput(this, 'VPCId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-VPCId`,
    });

    new cdk.CfnOutput(this, 'ECSClusterName', {
      value: this.ecsCluster.clusterName,
      description: 'ECS Cluster Name',
      exportName: `${this.stackName}-ECSClusterName`,
    });

    new cdk.CfnOutput(this, 'RDSEndpoint', {
      value: this.database.instanceEndpoint.hostname,
      description: 'RDS PostgreSQL Endpoint',
      exportName: `${this.stackName}-RDSEndpoint`,
    });

    new cdk.CfnOutput(this, 'SecretsManagerARN', {
      value: this.dbSecret.secretArn,
      description: 'Secrets Manager ARN for database credentials',
      exportName: `${this.stackName}-SecretsManagerARN`,
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for encryption',
      exportName: `${this.stackName}-KMSKeyId`,
    });

    // Add the log group as a dependency to ensure proper cleanup order
    this.ecsCluster.node.addDependency(ecsLogGroup);

    // Tags for all resources with enhanced metadata
    cdk.Tags.of(this).add('Environment', this.environmentSuffix);
    cdk.Tags.of(this).add('Project', 'AWS-Migration');
    cdk.Tags.of(this).add('ManagedBy', 'AWS-CDK');
    cdk.Tags.of(this).add('DeploymentId', this.randomSuffix);
    cdk.Tags.of(this).add('StackName', this.stackName);
    cdk.Tags.of(this).add(
      'DeploymentDate',
      new Date().toISOString().split('T')[0]
    );
    cdk.Tags.of(this).add(
      'CostCenter',
      `InfrastructureTeam-${this.environmentSuffix}`
    );
    cdk.Tags.of(this).add('Owner', 'CloudInfrastructureTeam');
    cdk.Tags.of(this).add('Security', 'Encrypted');
    cdk.Tags.of(this).add('Backup', 'Enabled');
    cdk.Tags.of(this).add('Monitoring', 'Enabled');
  }
}
