import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as config from 'aws-cdk-lib/aws-config';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

interface ComplianceStackProps {
  environmentSuffix: string;
}

export class ComplianceStack extends Construct {
  constructor(scope: Construct, id: string, props: ComplianceStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Create S3 bucket for AWS Config data with lifecycle policies
    const configBucket = new s3.Bucket(this, 'ConfigBucket', {
      bucketName: `compliance-config-${environmentSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'archive-after-90-days',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
        {
          id: 'delete-after-7-years',
          enabled: true,
          expiration: cdk.Duration.days(2555), // 7 years
        },
      ],
    });

    // Add tags to bucket
    cdk.Tags.of(configBucket).add('CostCenter', 'compliance-team');
    cdk.Tags.of(configBucket).add('ComplianceLevel', 'high');

    // Create IAM role for AWS Config
    const configRole = new iam.Role(this, 'ConfigRole', {
      roleName: `config-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWS_ConfigRole'
        ),
      ],
    });

    // Grant Config role permissions to write to S3
    configBucket.grantWrite(configRole);

    // Add tags to role
    cdk.Tags.of(configRole).add('CostCenter', 'compliance-team');
    cdk.Tags.of(configRole).add('ComplianceLevel', 'high');

    // Create AWS Config Recorder
    const configRecorder = new config.CfnConfigurationRecorder(
      this,
      'ConfigRecorder',
      {
        name: `config-recorder-${environmentSuffix}`,
        roleArn: configRole.roleArn,
        recordingGroup: {
          allSupported: true,
          includeGlobalResourceTypes: true,
        },
      }
    );

    // Create AWS Config Delivery Channel
    const deliveryChannel = new config.CfnDeliveryChannel(
      this,
      'DeliveryChannel',
      {
        name: `config-delivery-${environmentSuffix}`,
        s3BucketName: configBucket.bucketName,
      }
    );

    // Ensure recorder depends on delivery channel (delivery channel must exist first)
    configRecorder.addDependency(deliveryChannel);

    // Create SNS topic for compliance violations
    const complianceTopic = new sns.Topic(this, 'ComplianceTopic', {
      topicName: `compliance-alerts-${environmentSuffix}`,
      displayName: 'Compliance Violation Alerts',
    });

    // Add email subscription - in production, replace with actual email
    complianceTopic.addSubscription(
      new subscriptions.EmailSubscription('compliance-team@example.com')
    );

    // Add tags to topic
    cdk.Tags.of(complianceTopic).add('CostCenter', 'compliance-team');
    cdk.Tags.of(complianceTopic).add('ComplianceLevel', 'high');

    // Store compliance thresholds in Parameter Store
    const minBackupRetentionParam = new ssm.StringParameter(
      this,
      'MinBackupRetention',
      {
        parameterName: `/compliance/${environmentSuffix}/min-backup-retention-days`,
        stringValue: '7',
        description: 'Minimum backup retention days for RDS instances',
        tier: ssm.ParameterTier.STANDARD,
      }
    );

    const approvedAmisParam = new ssm.StringParameter(this, 'ApprovedAmis', {
      parameterName: `/compliance/${environmentSuffix}/approved-amis`,
      stringValue: 'ami-0c55b159cbfafe1f0,ami-0abcdef1234567890',
      description: 'Comma-separated list of approved AMI IDs',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Add tags to parameters
    cdk.Tags.of(minBackupRetentionParam).add('CostCenter', 'compliance-team');
    cdk.Tags.of(minBackupRetentionParam).add('ComplianceLevel', 'high');
    cdk.Tags.of(approvedAmisParam).add('CostCenter', 'compliance-team');
    cdk.Tags.of(approvedAmisParam).add('ComplianceLevel', 'high');

    // Create IAM role for Lambda functions
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      roleName: `config-lambda-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSConfigRulesExecutionRole'
        ),
      ],
    });

    // Grant Lambda read access to Parameter Store
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ssm:GetParameter', 'ssm:GetParameters'],
        resources: [
          minBackupRetentionParam.parameterArn,
          approvedAmisParam.parameterArn,
        ],
      })
    );

    // Grant Lambda permissions to publish to SNS
    complianceTopic.grantPublish(lambdaRole);

    // Grant Lambda permissions to describe resources
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ec2:DescribeInstances',
          's3:GetBucketEncryption',
          's3:GetEncryptionConfiguration',
          'rds:DescribeDBInstances',
        ],
        resources: ['*'],
      })
    );

    // Add tags to Lambda role
    cdk.Tags.of(lambdaRole).add('CostCenter', 'compliance-team');
    cdk.Tags.of(lambdaRole).add('ComplianceLevel', 'high');

    // Create Lambda function for EC2 AMI compliance check
    const amiCheckFunction = new lambda.Function(this, 'AmiCheckFunction', {
      functionName: `config-ami-check-${environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda', 'ami-check')),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(60),
      environment: {
        SNS_TOPIC_ARN: complianceTopic.topicArn,
        APPROVED_AMIS_PARAM: approvedAmisParam.parameterName,
        ENVIRONMENT_SUFFIX: environmentSuffix,
      },
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    // Add tags to Lambda
    cdk.Tags.of(amiCheckFunction).add('CostCenter', 'compliance-team');
    cdk.Tags.of(amiCheckFunction).add('ComplianceLevel', 'high');

    // Grant Config permission to invoke Lambda
    amiCheckFunction.addPermission('ConfigInvokePermission', {
      principal: new iam.ServicePrincipal('config.amazonaws.com'),
      action: 'lambda:InvokeFunction',
    });

    // Create Lambda function for S3 encryption compliance check
    const s3EncryptionFunction = new lambda.Function(
      this,
      'S3EncryptionFunction',
      {
        functionName: `config-s3-encryption-${environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'index.lambda_handler',
        code: lambda.Code.fromAsset(
          path.join(__dirname, 'lambda', 's3-encryption')
        ),
        role: lambdaRole,
        timeout: cdk.Duration.seconds(60),
        environment: {
          SNS_TOPIC_ARN: complianceTopic.topicArn,
          ENVIRONMENT_SUFFIX: environmentSuffix,
        },
        logRetention: logs.RetentionDays.ONE_MONTH,
      }
    );

    // Add tags to Lambda
    cdk.Tags.of(s3EncryptionFunction).add('CostCenter', 'compliance-team');
    cdk.Tags.of(s3EncryptionFunction).add('ComplianceLevel', 'high');

    // Grant Config permission to invoke Lambda
    s3EncryptionFunction.addPermission('ConfigInvokePermission', {
      principal: new iam.ServicePrincipal('config.amazonaws.com'),
      action: 'lambda:InvokeFunction',
    });

    // Create Lambda function for RDS backup retention compliance check
    const rdsBackupFunction = new lambda.Function(this, 'RdsBackupFunction', {
      functionName: `config-rds-backup-${environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda', 'rds-backup')),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(60),
      environment: {
        SNS_TOPIC_ARN: complianceTopic.topicArn,
        MIN_BACKUP_RETENTION_PARAM: minBackupRetentionParam.parameterName,
        ENVIRONMENT_SUFFIX: environmentSuffix,
      },
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    // Add tags to Lambda
    cdk.Tags.of(rdsBackupFunction).add('CostCenter', 'compliance-team');
    cdk.Tags.of(rdsBackupFunction).add('ComplianceLevel', 'high');

    // Grant Config permission to invoke Lambda
    rdsBackupFunction.addPermission('ConfigInvokePermission', {
      principal: new iam.ServicePrincipal('config.amazonaws.com'),
      action: 'lambda:InvokeFunction',
    });

    // Create Config Rule for EC2 AMI compliance
    const amiComplianceRule = new config.CfnConfigRule(
      this,
      'AmiComplianceRule',
      {
        configRuleName: `ec2-approved-ami-${environmentSuffix}`,
        description: 'Checks if EC2 instances use approved AMIs',
        source: {
          owner: 'CUSTOM_LAMBDA',
          sourceIdentifier: amiCheckFunction.functionArn,
          sourceDetails: [
            {
              eventSource: 'aws.config',
              messageType: 'ConfigurationItemChangeNotification',
            },
            {
              eventSource: 'aws.config',
              messageType: 'OversizedConfigurationItemChangeNotification',
              maximumExecutionFrequency: 'TwentyFour_Hours',
            },
          ],
        },
        scope: {
          complianceResourceTypes: ['AWS::EC2::Instance'],
        },
      }
    );

    // Ensure rule depends on recorder being active
    amiComplianceRule.addDependency(configRecorder);

    // Create Config Rule for S3 encryption compliance
    const s3EncryptionRule = new config.CfnConfigRule(
      this,
      'S3EncryptionRule',
      {
        configRuleName: `s3-bucket-encryption-${environmentSuffix}`,
        description: 'Checks if S3 buckets have encryption enabled',
        source: {
          owner: 'CUSTOM_LAMBDA',
          sourceIdentifier: s3EncryptionFunction.functionArn,
          sourceDetails: [
            {
              eventSource: 'aws.config',
              messageType: 'ConfigurationItemChangeNotification',
            },
            {
              eventSource: 'aws.config',
              messageType: 'OversizedConfigurationItemChangeNotification',
              maximumExecutionFrequency: 'TwentyFour_Hours',
            },
          ],
        },
        scope: {
          complianceResourceTypes: ['AWS::S3::Bucket'],
        },
      }
    );

    // Ensure rule depends on recorder being active
    s3EncryptionRule.addDependency(configRecorder);

    // Create Config Rule for RDS backup retention compliance
    const rdsBackupRule = new config.CfnConfigRule(this, 'RdsBackupRule', {
      configRuleName: `rds-backup-retention-${environmentSuffix}`,
      description: 'Checks if RDS instances have sufficient backup retention',
      source: {
        owner: 'CUSTOM_LAMBDA',
        sourceIdentifier: rdsBackupFunction.functionArn,
        sourceDetails: [
          {
            eventSource: 'aws.config',
            messageType: 'ConfigurationItemChangeNotification',
          },
          {
            eventSource: 'aws.config',
            messageType: 'OversizedConfigurationItemChangeNotification',
            maximumExecutionFrequency: 'TwentyFour_Hours',
          },
        ],
      },
      scope: {
        complianceResourceTypes: ['AWS::RDS::DBInstance'],
      },
    });

    // Ensure rule depends on recorder being active
    rdsBackupRule.addDependency(configRecorder);

    // Create IAM role for Config Aggregator
    const aggregatorRole = new iam.Role(this, 'AggregatorRole', {
      roleName: `config-aggregator-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
    });

    // Grant aggregator permissions
    aggregatorRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['config:Get*', 'config:List*', 'config:Describe*'],
        resources: ['*'],
      })
    );

    // Add tags to aggregator role
    cdk.Tags.of(aggregatorRole).add('CostCenter', 'compliance-team');
    cdk.Tags.of(aggregatorRole).add('ComplianceLevel', 'high');

    // Create Config Aggregator for cross-region aggregation
    const configAggregator = new config.CfnConfigurationAggregator(
      this,
      'ConfigAggregator',
      {
        configurationAggregatorName: `compliance-aggregator-${environmentSuffix}`,
        accountAggregationSources: [
          {
            accountIds: [cdk.Stack.of(this).account],
            allAwsRegions: false,
            awsRegions: ['us-east-1'], // Aggregate from us-east-1 (primary region)
          },
        ],
      }
    );

    // Add tags to aggregator
    cdk.Tags.of(configAggregator).add('CostCenter', 'compliance-team');
    cdk.Tags.of(configAggregator).add('ComplianceLevel', 'high');

    // Outputs
    new cdk.CfnOutput(this, 'ConfigBucketName', {
      value: configBucket.bucketName,
      description: 'S3 bucket for AWS Config data',
    });

    new cdk.CfnOutput(this, 'ComplianceTopicArn', {
      value: complianceTopic.topicArn,
      description: 'SNS topic for compliance alerts',
    });

    new cdk.CfnOutput(this, 'AmiCheckFunctionName', {
      value: amiCheckFunction.functionName,
      description: 'Lambda function for EC2 AMI compliance check',
    });

    new cdk.CfnOutput(this, 'S3EncryptionFunctionName', {
      value: s3EncryptionFunction.functionName,
      description: 'Lambda function for S3 encryption compliance check',
    });

    new cdk.CfnOutput(this, 'RdsBackupFunctionName', {
      value: rdsBackupFunction.functionName,
      description: 'Lambda function for RDS backup compliance check',
    });
  }
}
