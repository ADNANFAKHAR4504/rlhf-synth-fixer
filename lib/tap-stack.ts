import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as config from 'aws-cdk-lib/aws-config';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { DatabaseConstruct } from './constructs/database';
import { NetworkingConstruct } from './constructs/networking';
import { SecurityConstruct } from './constructs/security';

export interface TapStackProps extends cdk.StackProps {
  allowedSshIpRange: string;
  environment: 'dev' | 'staging' | 'prod';
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Create KMS key for encryption
    const kmsKey = new kms.Key(this, 'TapKmsKey', {
      description: 'KMS key for TAP infrastructure encryption',
      enableKeyRotation: true,
      alias: `alias/tap-${props.environment}-key`,
    });

    // Apply tags to all resources
    cdk.Tags.of(this).add('Environment', props.environment);
    cdk.Tags.of(this).add('Project', 'TAP');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('CostCenter', 'Infrastructure');

    // Create VPC with public/private subnets across multiple AZs
    const networking = new NetworkingConstruct(this, 'Networking', {
      environment: props.environment,
    });

    // Create security groups and ACM certificate
    const security = new SecurityConstruct(this, 'Security', {
      vpc: networking.vpc,
      allowedSshIpRange: props.allowedSshIpRange,
      environment: props.environment,
    });

    // Create encrypted S3 bucket
    const dataBucket = new s3.Bucket(this, 'DataBucket', {
      bucketName: `tap-${props.environment}-data-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create IAM role for Lambda with least privilege
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for TAP Lambda functions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    // Grant specific permissions to Lambda role
    dataBucket.grantRead(lambdaRole);
    kmsKey.grantDecrypt(lambdaRole);

    // Create CloudWatch log group for Lambda
    const logGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/tap-${props.environment}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create encrypted RDS database
    const database = new DatabaseConstruct(this, 'Database', {
      vpc: networking.vpc,
      securityGroup: security.databaseSecurityGroup,
      kmsKey: kmsKey,
      environment: props.environment,
    });

    // Grant Lambda access to database secret
    database.cluster.secret?.grantRead(lambdaRole);

    // Create Lambda function with CloudWatch logs enabled
    const exampleFunction = new lambda.Function(this, 'ExampleFunction', {
      functionName: `tap-${props.environment}-example`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Event received:', JSON.stringify(event));
          console.log('Database endpoint:', process.env.DB_ENDPOINT);
          console.log('Database name:', process.env.DB_NAME);
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Success' })
          };
        };
      `),
      role: lambdaRole,
      vpc: networking.vpc,
      vpcSubnets: {
        subnets: networking.privateSubnets,
      },
      securityGroups: [security.lambdaSecurityGroup],
      environment: {
        BUCKET_NAME: dataBucket.bucketName,
        ENVIRONMENT: props.environment,
        DB_ENDPOINT: database.cluster.clusterEndpoint.hostname,
        DB_PORT: database.cluster.clusterEndpoint.port.toString(),
        DB_NAME: `tap_${props.environment}`,
        DB_SECRET_ARN: database.cluster.secret?.secretArn || '',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logGroup: logGroup,
      tracing: lambda.Tracing.ACTIVE,
    });

    // Create SNS topic for compliance alerts
    const complianceTopic = new sns.Topic(this, 'ComplianceTopic', {
      topicName: `tap-${props.environment}-compliance-alerts`,
      masterKey: kmsKey,
    });

    // Configure AWS Config rules
    this.setupAwsConfigRules(complianceTopic);

    // Output important values
    new cdk.CfnOutput(this, 'VpcId', {
      value: networking.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: dataBucket.bucketName,
      description: 'Data bucket name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.cluster.clusterEndpoint.hostname,
      description: 'Database endpoint',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: exampleFunction.functionArn,
      description: 'Lambda function ARN',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: exampleFunction.functionName,
      description: 'Lambda function name',
    });
  }

  private setupAwsConfigRules(complianceTopic: sns.Topic): void {
    // S3 bucket encryption rule
    new config.ManagedRule(this, 'S3BucketEncryptionRule', {
      identifier:
        config.ManagedRuleIdentifiers.S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED,
      description: 'Checks that S3 buckets have server-side encryption enabled',
    });

    // RDS encryption rule
    new config.ManagedRule(this, 'RDSEncryptionRule', {
      identifier: config.ManagedRuleIdentifiers.RDS_STORAGE_ENCRYPTED,
      description: 'Checks that RDS instances have encryption at rest enabled',
    });

    // Security group SSH rule
    new config.ManagedRule(this, 'RestrictedSSHRule', {
      identifier:
        config.ManagedRuleIdentifiers.EC2_SECURITY_GROUP_ATTACHED_TO_ENI,
      description:
        'Checks that security groups are attached to network interfaces',
    });

    // Lambda VPC rule
    new config.ManagedRule(this, 'LambdaVPCRule', {
      identifier: config.ManagedRuleIdentifiers.LAMBDA_INSIDE_VPC,
      description: 'Checks that Lambda functions are deployed inside VPC',
    });

    // CloudWatch alarm for non-compliant resources
    const nonCompliantMetric = new cloudwatch.Metric({
      namespace: 'AWS/Config',
      metricName: 'ComplianceByConfigRule',
      dimensionsMap: {
        ComplianceType: 'NON_COMPLIANT',
      },
      statistic: 'Sum',
    });

    new cloudwatch.Alarm(this, 'NonComplianceAlarm', {
      metric: nonCompliantMetric,
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription:
        'Alert when resources are non-compliant with Config rules',
    }).addAlarmAction(new cloudwatchActions.SnsAction(complianceTopic));
  }
}
