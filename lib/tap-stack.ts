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
}

// TapStack implementation
export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly ecsCluster: ecs.Cluster;
  public readonly database: rds.DatabaseInstance;
  public readonly dbSecret: secretsmanager.Secret;
  public readonly environmentSuffix: string;

  constructor(scope: Construct, id: string, props: InfraStackProps) {
    super(scope, id, props);
    this.environmentSuffix = props.environmentSuffix;

    // Configuration with defaults
    const vpcCidr = props.vpcCidr || '10.0.0.0/16';
    const dbInstanceClass =
      props.dbInstanceClass ||
      ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO);
    const ecsInstanceType =
      props.ecsInstanceType ||
      ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL);

    // 1. NETWORKING SETUP
    // Create custom VPC with configurable CIDR across 2 AZs
    this.vpc = new ec2.Vpc(this, 'ProductionVPC', {
      ipAddresses: ec2.IpAddresses.cidr(vpcCidr),
      maxAzs: 2, // Primary + Secondary AZs
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, // Includes NAT Gateway
        },
        {
          cidrMask: 24,
          name: 'DatabaseSubnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED, // For RDS
        },
      ],
      natGateways: 2, // One NAT Gateway per AZ for HA
    });

    // 2. SECURITY - KMS Key for encryption
    const kmsKey = new kms.Key(this, 'InfraKMSKey', {
      description: 'KMS key for infrastructure encryption',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
    });

    // KMS Key Alias for easier reference
    new kms.Alias(this, 'InfraKMSKeyAlias', {
      aliasName: 'alias/infra-encryption-key',
      targetKey: kmsKey,
    });

    // 3. DATABASE SETUP
    // (dbSubnetGroup removed, not used)

    // Create database credentials in Secrets Manager
    this.dbSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      description: 'RDS PostgreSQL credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\\'',
        includeSpace: false,
        passwordLength: 32,
      },
      encryptionKey: kmsKey,
    });

    // Database security group - restrictive access
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for RDS database',
        allowAllOutbound: false, // Explicit outbound rules
      }
    );

    // RDS PostgreSQL instance with Multi-AZ for automatic failover
    this.database = new rds.DatabaseInstance(this, 'PostgreSQLDatabase', {
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_1,
      }),
      securityGroups: [dbSecurityGroup],
      credentials: rds.Credentials.fromSecret(this.dbSecret),
      multiAz: true, // Enable automatic failover
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: true,
      deleteAutomatedBackups: false,
      enablePerformanceInsights: true,
      performanceInsightEncryptionKey: kmsKey,
      cloudwatchLogsExports: ['postgresql'],
      allocatedStorage: 20,
      maxAllocatedStorage: 100, // Enable storage autoscaling
    });

    // Create read replica for improved read performance
    new rds.DatabaseInstanceReadReplica(this, 'PostgreSQLReadReplica', {
      sourceDatabaseInstance: this.database,
      instanceType: dbInstanceClass,
      vpc: this.vpc,
      securityGroups: [dbSecurityGroup],
      deleteAutomatedBackups: false,
      enablePerformanceInsights: true,
      performanceInsightEncryptionKey: kmsKey,
    });

    // 4. COMPUTE - ECS CLUSTER SETUP
    // CloudWatch Log Group for ECS
    const ecsLogGroup = new logs.LogGroup(this, 'ECSLogGroup', {
      logGroupName: '/aws/ecs/production-cluster',
      retention: logs.RetentionDays.ONE_WEEK,
      encryptionKey: kmsKey,
    });

    // ECS Cluster
    this.ecsCluster = new ecs.Cluster(this, 'ProductionECSCluster', {
      vpc: this.vpc,
      clusterName: 'production-cluster',
    });

    // IAM Role for ECS instances
    const ecsInstanceRole = new iam.Role(this, 'ECSInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for ECS EC2 instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2ContainerServiceforEC2Role'),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // Add minimal permissions for Secrets Manager access
    ecsInstanceRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [this.dbSecret.secretArn],
      })
    );

    // Security Group for ECS instances
    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'ECSSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for ECS instances',
      allowAllOutbound: true, // ECS instances need internet access for pulling images
    });

    // Allow ECS instances to connect to RDS
    dbSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow ECS instances to connect to PostgreSQL'
    );

    // User Data script for ECS instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      `echo ECS_CLUSTER=${this.ecsCluster.clusterName} >> /etc/ecs/ecs.config`,
      'echo ECS_ENABLE_CONTAINER_METADATA=true >> /etc/ecs/ecs.config',
      'systemctl enable amazon-cloudwatch-agent',
      'systemctl start amazon-cloudwatch-agent'
    );

    // Launch Template for Auto Scaling Group
    const launchTemplate = new ec2.LaunchTemplate(this, 'ECSLaunchTemplate', {
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
            kmsKey: kmsKey,
            volumeType: ec2.EbsDeviceVolumeType.GP3,
          }),
        },
      ],
    });
    // Auto Scaling Group for ECS instances
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'ECSAutoScalingGroup',
      {
        vpc: this.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        launchTemplate: launchTemplate,
        minCapacity: 2,
        maxCapacity: 10,
        desiredCapacity: 2,
        healthChecks: autoscaling.HealthChecks.ec2(),
      }
    );

    // CPU-based scaling policy
    autoScalingGroup.scaleOnCpuUtilization('CPUScaling', {
      targetUtilizationPercent: 70,
    });

    // Memory-based scaling policy is not supported directly by AutoScalingGroup.
    // To scale based on memory, use custom CloudWatch alarms and scaling policies.

    // Capacity Provider for ECS Cluster
    const capacityProvider = new ecs.AsgCapacityProvider(
      this,
      'ECSCapacityProvider',
      {
        autoScalingGroup: autoScalingGroup,
        enableManagedScaling: true,
        enableManagedTerminationProtection: false,
        targetCapacityPercent: 80,
      }
    );

    this.ecsCluster.addAsgCapacityProvider(capacityProvider);

    // 5. DNS SETUP (Route 53)
    if (props.domainName) {
      const hostedZone = new route53.HostedZone(this, 'ProductionHostedZone', {
        zoneName: props.domainName,
      });

      // Output the name servers for domain configuration
      new cdk.CfnOutput(this, 'Route53NameServers', {
        value: cdk.Fn.join(',', hostedZone.hostedZoneNameServers || []),
        description: 'Route53 Name Servers for domain configuration',
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

    // Tags for all resources
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Project', 'Migration');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

  }
}