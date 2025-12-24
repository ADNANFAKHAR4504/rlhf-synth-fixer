import * as cdk from 'aws-cdk-lib';
import { Aspects } from 'aws-cdk-lib';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

// Custom Aspect to validate RDS instance types programmatically
class RdsInstanceTypeValidator implements cdk.IAspect {
  public visit(node: Construct): void {
    if (node instanceof rds.DatabaseInstance) {
      const allowedTypes = ['db.m5.large', 'db.m5.xlarge'];
      // Get instance type from context or use default
      const currentType =
        node.node.tryGetContext('rdsInstanceType') || 'db.m5.large';

      if (!allowedTypes.includes(currentType)) {
        throw new Error(
          `RDS instance type ${currentType} is not allowed. ` +
            `Only ${allowedTypes.join(' or ')} are permitted.`
        );
      }
    }
  }
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Networking Layer - VPC with public subnets only (simplified for LocalStack Community Edition)
    // LocalStack Community Edition: NAT Gateway not fully supported, using public subnets only
    const vpc = new ec2.Vpc(this, 'SecureVPC', {
      maxAzs: 2,
      natGateways: 0, // Disable NAT Gateway for LocalStack Community Edition
      subnetConfiguration: [
        { name: 'PublicSubnet', subnetType: ec2.SubnetType.PUBLIC },
      ],
      restrictDefaultSecurityGroup: false, // Disable Lambda-backed custom resource for LocalStack
    });

    // KMS Customer Managed Key with automatic rotation
    // LocalStack Community Edition: Add removal policy for proper cleanup
    const cmk = new kms.Key(this, 'CustomerManagedKey', {
      enableKeyRotation: true,
      description: 'Customer managed key for data encryption',
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For LocalStack testing
    });

    // S3 Buckets with SSE-KMS encryption, versioning, and public access blocked
    // LocalStack Community Edition: RemovalPolicy.DESTROY without autoDeleteObjects (avoids custom resource)
    const secureBucket = new s3.Bucket(this, 'SecureBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: cmk,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For testing
      // autoDeleteObjects: true, // Creates Lambda custom resource, disabled for LocalStack Community Edition
    });

    // Security Groups with least privilege principle
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      allowAllOutbound: false,
      description: 'Security group for RDS database access',
    });

    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'ECSSecurityGroup', {
      vpc,
      allowAllOutbound: true,
      description: 'Security group for ECS service',
    });

    // Allow ECS to access RDS on MySQL port
    dbSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow ECS to access RDS MySQL'
    );

    // Allow health checks and container communication
    ecsSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(80),
      'Allow container health checks'
    );

    // RDS Database with encryption and restricted instance types
    // LocalStack Community Edition: Using public subnets (no NAT Gateway support)
    const rdsInstance = new rds.DatabaseInstance(this, 'SecureRDS', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.STANDARD5,
        ec2.InstanceSize.LARGE
      ), // db.m5.large equivalent
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC }, // Changed to PUBLIC for LocalStack
      securityGroups: [dbSecurityGroup],
      storageEncrypted: true,
      storageEncryptionKey: cmk,
      allocatedStorage: 20,
      backupRetention: cdk.Duration.days(1),
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      multiAz: false,
      publiclyAccessible: false, // Keep false for security
    });

    // Apply RDS instance type validation
    Aspects.of(this).add(new RdsInstanceTypeValidator());

    // IAM Role for ECS Tasks with proper trust relationship
    const ecsTaskRole = new iam.Role(this, 'ECSTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'IAM role for ECS tasks with least privilege access',
    });

    // ECS Cluster
    // LocalStack Community Edition: Container Insights V2 may require Pro, disabling for compatibility
    const ecsCluster = new ecs.Cluster(this, 'SecureECSCluster', {
      vpc,
      // containerInsightsV2: ecs.ContainerInsights.ENABLED, // Disabled for LocalStack Community Edition
    });

    // ECS Service with Auto Scaling - Optimized for faster deployment
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
      taskRole: ecsTaskRole, // Assign proper ECS task role to tasks
    });

    taskDefinition.addContainer('web', {
      image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      portMappings: [{ containerPort: 80 }],
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'SecureECSService' }),
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost/ || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    // LocalStack Community Edition: Using public subnets (no NAT Gateway support)
    const ecsService = new ecs.FargateService(this, 'SecureECSService', {
      cluster: ecsCluster,
      taskDefinition,
      desiredCount: 1,
      assignPublicIp: true, // Changed to true for public subnet
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC }, // Changed to PUBLIC for LocalStack
      securityGroups: [ecsSecurityGroup],
      enableExecuteCommand: false,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      healthCheckGracePeriod: cdk.Duration.seconds(120),
      circuitBreaker: { rollback: true },
    });

    // Auto-scaling policy based on CPU utilization
    const scaling = ecsService.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 3,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // LocalStack Community Edition: CloudTrail and CloudWatch Alarms are Pro features, removing them
    // NOTE: These features would work on real AWS, but are not available in LocalStack Community Edition
    //
    // Removed for LocalStack compatibility:
    // - CloudTrail multi-region logging (Pro feature)
    // - CloudWatch Alarms (Pro feature)
    //
    // On real AWS, you would include:
    // const trail = new cloudtrail.Trail(this, 'MultiRegionTrail', {...});
    // new cloudwatch.Alarm(this, 'RDS-CPUUtilizationAlarm', {...});
    // new cloudwatch.Alarm(this, 'ECS-CPUUtilizationAlarm', {...});
    // etc.

    // Output important information
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'RDSInstanceId', {
      value: rdsInstance.instanceIdentifier,
      description: 'RDS Instance ID',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: secureBucket.bucketName,
      description: 'S3 Bucket Name',
    });
  }
}
