import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as destinations from 'aws-cdk-lib/aws-logs-destinations';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // KMS Key for encryption
    const encryptionKey = new kms.Key(this, 'EncryptionKey', {
      description: `Encryption key for loan processing app ${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // VPC with 3 public and 3 private subnets across 3 AZs
    const vpc = new ec2.Vpc(this, `LoanProcessingVpc-${environmentSuffix}`, {
      maxAzs: 3,
      natGateways: 3,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // S3 Bucket for ALB Access Logs
    const albLogsBucket = new s3.Bucket(
      this,
      `AlbLogsBucket-${environmentSuffix}`,
      {
        bucketName: `loan-app-alb-logs-${environmentSuffix}`,
        versioned: true,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.S3_MANAGED,
        lifecycleRules: [
          {
            expiration: cdk.Duration.days(90),
            transitions: [
              {
                storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                transitionAfter: cdk.Duration.days(30),
              },
            ],
          },
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    // S3 Bucket for Application Logs
    const appLogsBucket = new s3.Bucket(
      this,
      `AppLogsBucket-${environmentSuffix}`,
      {
        bucketName: `loan-app-logs-${environmentSuffix}`,
        versioned: true,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: encryptionKey,
        lifecycleRules: [
          {
            expiration: cdk.Duration.days(365),
            transitions: [
              {
                storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                transitionAfter: cdk.Duration.days(90),
              },
            ],
          },
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    // S3 Bucket for Static Assets
    const staticAssetsBucket = new s3.Bucket(
      this,
      `StaticAssetsBucket-${environmentSuffix}`,
      {
        bucketName: `loan-app-assets-${environmentSuffix}`,
        versioned: true,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.S3_MANAGED,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    // CloudFront Distribution for Static Assets
    const distribution = new cloudfront.Distribution(
      this,
      `StaticAssetsDistribution-${environmentSuffix}`,
      {
        defaultBehavior: {
          origin: new origins.S3Origin(staticAssetsBucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      }
    );

    // ECS Cluster
    const cluster = new ecs.Cluster(
      this,
      `LoanProcessingCluster-${environmentSuffix}`,
      {
        vpc: vpc,
        clusterName: `loan-processing-cluster-${environmentSuffix}`,
      }
    );

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `LoanProcessingAlb-${environmentSuffix}`,
      {
        vpc: vpc,
        internetFacing: true,
        loadBalancerName: `loan-app-alb-${environmentSuffix}`,
      }
    );

    // Enable ALB Access Logs
    alb.logAccessLogs(albLogsBucket);

    // RDS Aurora PostgreSQL Cluster
    const dbCluster = new rds.DatabaseCluster(
      this,
      `LoanProcessingDb-${environmentSuffix}`,
      {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_15_8,
        }),
        credentials: rds.Credentials.fromUsername('dbadmin', {
          excludeCharacters: '/"@',
        }),
        writer: rds.ClusterInstance.provisioned('Writer', {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MEDIUM
          ),
        }),
        readers: [
          rds.ClusterInstance.provisioned('Reader1', {
            instanceType: ec2.InstanceType.of(
              ec2.InstanceClass.T3,
              ec2.InstanceSize.MEDIUM
            ),
          }),
          rds.ClusterInstance.provisioned('Reader2', {
            instanceType: ec2.InstanceType.of(
              ec2.InstanceClass.T3,
              ec2.InstanceSize.MEDIUM
            ),
          }),
        ],
        vpc: vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        storageEncrypted: true,
        storageEncryptionKey: encryptionKey,
        backup: {
          retention: cdk.Duration.days(35),
        },
        iamAuthentication: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // CloudWatch Log Group for ECS Tasks
    const ecsLogGroup = new logs.LogGroup(
      this,
      `EcsLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/ecs/loan-processing-${environmentSuffix}`,
        retention: logs.RetentionDays.THREE_MONTHS,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // CloudWatch Log Group for Lambda Functions
    const lambdaLogGroup = new logs.LogGroup(
      this,
      `LambdaLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/lambda/loan-processing-${environmentSuffix}`,
        retention: logs.RetentionDays.THREE_MONTHS,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Lambda function for async processing
    const processingLambda = new lambda.Function(
      this,
      `ProcessingLambda-${environmentSuffix}`,
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Processing loan application:', JSON.stringify(event));
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Loan application processed' })
          };
        };
      `),
        functionName: `loan-processing-async-${environmentSuffix}`,
        logGroup: lambdaLogGroup,
        reservedConcurrentExecutions: 10,
        vpc: vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        environment: {
          DB_CLUSTER_ARN: dbCluster.clusterArn,
        },
      }
    );

    // Grant Lambda network access to RDS and IAM authentication
    dbCluster.connections.allowDefaultPortFrom(processingLambda);
    dbCluster.grantConnect(processingLambda, 'dbadmin');

    // ECS Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      `LoanProcessingTask-${environmentSuffix}`,
      {
        memoryLimitMiB: 2048,
        cpu: 1024,
      }
    );

    // Add container to task definition
    const container = taskDefinition.addContainer('LoanProcessingContainer', {
      image: ecs.ContainerImage.fromRegistry('nginx:latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'loan-app',
        logGroup: ecsLogGroup,
      }),
      environment: {
        DB_HOST: dbCluster.clusterEndpoint.hostname,
        DB_PORT: dbCluster.clusterEndpoint.port.toString(),
      },
    });

    container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    });

    // ECS Service with Auto Scaling
    const service = new ecs.FargateService(
      this,
      `LoanProcessingService-${environmentSuffix}`,
      {
        cluster: cluster,
        taskDefinition: taskDefinition,
        serviceName: `loan-processing-service-${environmentSuffix}`,
        desiredCount: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      }
    );

    // Grant ECS service access to RDS with IAM authentication
    dbCluster.connections.allowDefaultPortFrom(service);
    dbCluster.grantConnect(taskDefinition.taskRole, 'dbadmin');

    // Configure Auto Scaling
    const scaling = service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Add service to ALB
    const listener = alb.addListener('Listener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
    });

    listener.addTargets('ECS', {
      port: 80,
      targets: [service],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
      },
    });

    // Lambda function for log export
    const logExportLambda = new lambda.Function(
      this,
      `LogExportLambda-${environmentSuffix}`,
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const s3 = new AWS.S3();

        exports.handler = async (event) => {
          console.log('Exporting logs to S3');
          const logData = Buffer.from(JSON.stringify(event)).toString('base64');
          const date = new Date().toISOString().split('T')[0];

          await s3.putObject({
            Bucket: process.env.LOG_BUCKET,
            Key: \`logs/\${date}/\${Date.now()}.json\`,
            Body: logData
          }).promise();

          return { statusCode: 200 };
        };
      `),
        functionName: `loan-processing-log-export-${environmentSuffix}`,
        reservedConcurrentExecutions: 5,
        environment: {
          LOG_BUCKET: appLogsBucket.bucketName,
        },
      }
    );

    // Grant Lambda permission to write to S3
    appLogsBucket.grantWrite(logExportLambda);

    // Create subscription filter for ECS logs
    new logs.SubscriptionFilter(
      this,
      `EcsLogSubscription-${environmentSuffix}`,
      {
        logGroup: ecsLogGroup,
        destination: new destinations.LambdaDestination(logExportLambda),
        filterPattern: logs.FilterPattern.allEvents(),
      }
    );

    // Create subscription filter for Lambda logs
    new logs.SubscriptionFilter(
      this,
      `LambdaLogSubscription-${environmentSuffix}`,
      {
        logGroup: lambdaLogGroup,
        destination: new destinations.LambdaDestination(logExportLambda),
        filterPattern: logs.FilterPattern.allEvents(),
      }
    );

    // Stack Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS',
    });

    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: distribution.distributionDomainName,
      description: 'CloudFront Distribution URL',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: dbCluster.clusterEndpoint.hostname,
      description: 'RDS Aurora Cluster Endpoint',
    });

    new cdk.CfnOutput(this, 'StaticAssetsBucket', {
      value: staticAssetsBucket.bucketName,
      description: 'S3 Bucket for Static Assets',
    });
  }
}
