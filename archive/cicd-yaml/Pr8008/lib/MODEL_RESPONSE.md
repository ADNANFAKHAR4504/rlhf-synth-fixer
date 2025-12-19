# Automated Compliance Auditing System

This solution implements a complete AWS Config-based compliance auditing system using CDK 2.x with TypeScript. The infrastructure continuously monitors AWS resources against compliance policies and sends alerts for violations.

## Architecture Overview

The solution includes:
- AWS Config with configuration recorder and delivery channel
- S3 bucket with lifecycle policies for 7-year retention
- Three custom Lambda-based Config Rules for compliance checking
- SNS topic for compliance violation notifications
- Systems Manager Parameter Store for compliance thresholds
- Cross-region Config aggregation
- CloudWatch Logs with 30-day retention
- Comprehensive IAM roles with least privilege

## File: cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false,
    "@aws-cdk/aws-ecs:enableImdsBlockingDeprecatedFeature": false,
    "@aws-cdk/aws-ecs:disableEcsImdsBlocking": true,
    "@aws-cdk/aws-ecs:reduceEc2FargateCloudWatchPermissions": true,
    "@aws-cdk/aws-dynamodb:resourcePolicyPerReplica": true,
    "@aws-cdk/aws-ec2:ec2SumTImeoutEnabled": true,
    "@aws-cdk/aws-appsync:appSyncGraphQLAPIScopeLambdaPermission": true,
    "@aws-cdk/aws-rds:setCorrectValueForDatabaseInstanceReadReplicaInstanceResourceId": true,
    "@aws-cdk/core:cfnIncludeRejectComplexResourceUpdateCreatePolicyIntrinsics": true,
    "@aws-cdk/aws-lambda-nodejs:sdkV3ExcludeSmithyPackages": true,
    "@aws-cdk/aws-stepfunctions-tasks:fixRunEcsTaskPolicy": true,
    "@aws-cdk/aws-ec2:bastionHostUseAmazonLinux2023ByDefault": true,
    "@aws-cdk/aws-route53-targets:userPoolDomainNameMethodWithoutCustomResource": true,
    "@aws-cdk/aws-elasticloadbalancingV2:albDualstackWithoutPublicIpv4SecurityGroupRulesDefault": true,
    "@aws-cdk/aws-iam:oidcRejectUnauthorizedConnections": true,
    "@aws-cdk/core:enableAdditionalMetadataCollection": true,
    "@aws-cdk/aws-lambda:createNewPoliciesWithAddToRolePolicy": false,
    "@aws-cdk/aws-s3:setUniqueReplicationRoleName": true,
    "@aws-cdk/aws-events:requireEventBusPolicySid": true,
    "@aws-cdk/core:aspectPrioritiesMutating": true,
    "@aws-cdk/aws-dynamodb:retainTableReplica": true,
    "@aws-cdk/aws-stepfunctions:useDistributedMapResultWriterV2": true,
    "@aws-cdk/s3-notifications:addS3TrustKeyPolicyForSnsSubscriptions": true,
    "@aws-cdk/aws-ec2:requirePrivateSubnetsForEgressOnlyInternetGateway": true,
    "@aws-cdk/aws-s3:publicAccessBlockedByDefault": true,
    "@aws-cdk/aws-lambda:useCdkManagedLogGroup": true
  }
}
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
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
Tags.of(app).add('CostCenter', 'compliance-team');
Tags.of(app).add('ComplianceLevel', 'high');

new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});
```

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ComplianceStack } from './compliance-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create the compliance auditing infrastructure
    new ComplianceStack(this, 'ComplianceStack', {
      environmentSuffix,
    });
  }
}
```

## File: lib/compliance-stack.ts

```typescript
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
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWS_ConfigRole'),
      ],
    });

    // Grant Config role permissions to write to S3
    configBucket.grantWrite(configRole);

    // Add tags to role
    cdk.Tags.of(configRole).add('CostCenter', 'compliance-team');
    cdk.Tags.of(configRole).add('ComplianceLevel', 'high');

    // Create AWS Config Recorder
    const configRecorder = new config.CfnConfigurationRecorder(this, 'ConfigRecorder', {
      name: `config-recorder-${environmentSuffix}`,
      roleArn: configRole.roleArn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
      },
    });

    // Create AWS Config Delivery Channel
    const deliveryChannel = new config.CfnDeliveryChannel(this, 'DeliveryChannel', {
      name: `config-delivery-${environmentSuffix}`,
      s3BucketName: configBucket.bucketName,
    });

    // Ensure delivery channel depends on recorder
    deliveryChannel.addDependency(configRecorder);

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
    const minBackupRetentionParam = new ssm.StringParameter(this, 'MinBackupRetention', {
      parameterName: `/compliance/${environmentSuffix}/min-backup-retention-days`,
      stringValue: '7',
      description: 'Minimum backup retention days for RDS instances',
      tier: ssm.ParameterTier.STANDARD,
    });

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
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSConfigRulesExecutionRole'),
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
    const s3EncryptionFunction = new lambda.Function(this, 'S3EncryptionFunction', {
      functionName: `config-s3-encryption-${environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda', 's3-encryption')),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(60),
      environment: {
        SNS_TOPIC_ARN: complianceTopic.topicArn,
        ENVIRONMENT_SUFFIX: environmentSuffix,
      },
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

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
    const amiComplianceRule = new config.CfnConfigRule(this, 'AmiComplianceRule', {
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
    });

    // Ensure rule depends on recorder being active
    amiComplianceRule.addDependency(configRecorder);

    // Create Config Rule for S3 encryption compliance
    const s3EncryptionRule = new config.CfnConfigRule(this, 'S3EncryptionRule', {
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
    });

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
    const configAggregator = new config.CfnConfigurationAggregator(this, 'ConfigAggregator', {
      configurationAggregatorName: `compliance-aggregator-${environmentSuffix}`,
      accountAggregationSources: [
        {
          accountIds: [cdk.Stack.of(this).account],
          allAwsRegions: false,
          awsRegions: ['us-east-1'], // Aggregate from us-east-1 (primary region)
        },
      ],
    });

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
```

## File: lib/lambda/ami-check/index.py

```python
import json
import boto3
import os

# Initialize AWS clients
config_client = boto3.client('config')
ssm_client = boto3.client('ssm')
sns_client = boto3.client('sns')

def lambda_handler(event, context):
    """
    AWS Config custom rule to check if EC2 instances use approved AMIs.
    """
    try:
        # Get the configuration item from the event
        invoking_event = json.loads(event['invokingEvent'])
        configuration_item = invoking_event['configurationItem']

        # Get resource details
        resource_type = configuration_item['resourceType']
        resource_id = configuration_item['resourceId']

        # Only process EC2 instances
        if resource_type != 'AWS::EC2::Instance':
            return {
                'statusCode': 200,
                'body': json.dumps('Not an EC2 instance')
            }

        # Get the AMI ID from the configuration
        ami_id = configuration_item['configuration'].get('imageId')

        if not ami_id:
            compliance_type = 'NON_COMPLIANT'
            annotation = 'Unable to determine AMI ID'
        else:
            # Get approved AMIs from Parameter Store
            approved_amis_param = os.environ.get('APPROVED_AMIS_PARAM')
            try:
                response = ssm_client.get_parameter(Name=approved_amis_param)
                approved_amis = response['Parameter']['Value'].split(',')
                approved_amis = [ami.strip() for ami in approved_amis]
            except Exception as e:
                print(f"Error getting approved AMIs from Parameter Store: {str(e)}")
                approved_amis = []

            # Check if AMI is approved
            if ami_id in approved_amis:
                compliance_type = 'COMPLIANT'
                annotation = f'Instance uses approved AMI: {ami_id}'
            else:
                compliance_type = 'NON_COMPLIANT'
                annotation = f'Instance uses unapproved AMI: {ami_id}. Approved AMIs: {", ".join(approved_amis)}'

                # Send SNS notification for non-compliance
                try:
                    sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
                    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

                    message = f"""
Compliance Violation Detected

Environment: {environment_suffix}
Rule: EC2 Approved AMI Check
Resource: {resource_id}
Status: NON_COMPLIANT
Details: {annotation}

Please take immediate action to remediate this violation.
"""

                    sns_client.publish(
                        TopicArn=sns_topic_arn,
                        Subject=f'Compliance Violation: Unapproved AMI in {environment_suffix}',
                        Message=message
                    )
                except Exception as e:
                    print(f"Error sending SNS notification: {str(e)}")

        # Put evaluation result
        config_client.put_evaluations(
            Evaluations=[
                {
                    'ComplianceResourceType': resource_type,
                    'ComplianceResourceId': resource_id,
                    'ComplianceType': compliance_type,
                    'Annotation': annotation,
                    'OrderingTimestamp': configuration_item['configurationItemCaptureTime']
                }
            ],
            ResultToken=event['resultToken']
        )

        return {
            'statusCode': 200,
            'body': json.dumps(f'Evaluation completed: {compliance_type}')
        }

    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
```

## File: lib/lambda/s3-encryption/index.py

```python
import json
import boto3
import os

# Initialize AWS clients
config_client = boto3.client('config')
s3_client = boto3.client('s3')
sns_client = boto3.client('sns')

def lambda_handler(event, context):
    """
    AWS Config custom rule to check if S3 buckets have encryption enabled.
    """
    try:
        # Get the configuration item from the event
        invoking_event = json.loads(event['invokingEvent'])
        configuration_item = invoking_event['configurationItem']

        # Get resource details
        resource_type = configuration_item['resourceType']
        resource_id = configuration_item['resourceId']

        # Only process S3 buckets
        if resource_type != 'AWS::S3::Bucket':
            return {
                'statusCode': 200,
                'body': json.dumps('Not an S3 bucket')
            }

        bucket_name = configuration_item['resourceName']

        # Check if bucket has encryption enabled
        try:
            response = s3_client.get_bucket_encryption(Bucket=bucket_name)
            encryption_rules = response.get('ServerSideEncryptionConfiguration', {}).get('Rules', [])

            if encryption_rules:
                compliance_type = 'COMPLIANT'
                encryption_type = encryption_rules[0].get('ApplyServerSideEncryptionByDefault', {}).get('SSEAlgorithm', 'Unknown')
                annotation = f'Bucket has encryption enabled with {encryption_type}'
            else:
                compliance_type = 'NON_COMPLIANT'
                annotation = 'Bucket has encryption configuration but no rules defined'
        except s3_client.exceptions.ServerSideEncryptionConfigurationNotFoundError:
            compliance_type = 'NON_COMPLIANT'
            annotation = 'Bucket does not have encryption enabled'

            # Send SNS notification for non-compliance
            try:
                sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
                environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

                message = f"""
Compliance Violation Detected

Environment: {environment_suffix}
Rule: S3 Bucket Encryption Check
Resource: {bucket_name}
Status: NON_COMPLIANT
Details: {annotation}

Please enable encryption on this S3 bucket immediately.
"""

                sns_client.publish(
                    TopicArn=sns_topic_arn,
                    Subject=f'Compliance Violation: Unencrypted S3 Bucket in {environment_suffix}',
                    Message=message
                )
            except Exception as e:
                print(f"Error sending SNS notification: {str(e)}")

        except Exception as e:
            print(f"Error checking bucket encryption: {str(e)}")
            compliance_type = 'NON_COMPLIANT'
            annotation = f'Error checking encryption: {str(e)}'

        # Put evaluation result
        config_client.put_evaluations(
            Evaluations=[
                {
                    'ComplianceResourceType': resource_type,
                    'ComplianceResourceId': resource_id,
                    'ComplianceType': compliance_type,
                    'Annotation': annotation,
                    'OrderingTimestamp': configuration_item['configurationItemCaptureTime']
                }
            ],
            ResultToken=event['resultToken']
        )

        return {
            'statusCode': 200,
            'body': json.dumps(f'Evaluation completed: {compliance_type}')
        }

    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
```

## File: lib/lambda/rds-backup/index.py

```python
import json
import boto3
import os

# Initialize AWS clients
config_client = boto3.client('config')
ssm_client = boto3.client('ssm')
rds_client = boto3.client('rds')
sns_client = boto3.client('sns')

def lambda_handler(event, context):
    """
    AWS Config custom rule to check if RDS instances have sufficient backup retention.
    """
    try:
        # Get the configuration item from the event
        invoking_event = json.loads(event['invokingEvent'])
        configuration_item = invoking_event['configurationItem']

        # Get resource details
        resource_type = configuration_item['resourceType']
        resource_id = configuration_item['resourceId']

        # Only process RDS instances
        if resource_type != 'AWS::RDS::DBInstance':
            return {
                'statusCode': 200,
                'body': json.dumps('Not an RDS instance')
            }

        # Get the backup retention period from the configuration
        backup_retention_period = configuration_item['configuration'].get('backupRetentionPeriod', 0)

        # Get minimum backup retention from Parameter Store
        min_retention_param = os.environ.get('MIN_BACKUP_RETENTION_PARAM')
        try:
            response = ssm_client.get_parameter(Name=min_retention_param)
            min_backup_retention = int(response['Parameter']['Value'])
        except Exception as e:
            print(f"Error getting minimum backup retention from Parameter Store: {str(e)}")
            min_backup_retention = 7  # Default to 7 days

        # Check if backup retention meets minimum requirement
        if backup_retention_period >= min_backup_retention:
            compliance_type = 'COMPLIANT'
            annotation = f'RDS instance has backup retention of {backup_retention_period} days (minimum: {min_backup_retention} days)'
        else:
            compliance_type = 'NON_COMPLIANT'
            annotation = f'RDS instance has insufficient backup retention: {backup_retention_period} days (minimum required: {min_backup_retention} days)'

            # Send SNS notification for non-compliance
            try:
                sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
                environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

                message = f"""
Compliance Violation Detected

Environment: {environment_suffix}
Rule: RDS Backup Retention Check
Resource: {resource_id}
Status: NON_COMPLIANT
Details: {annotation}

Current Retention: {backup_retention_period} days
Required Minimum: {min_backup_retention} days

Please update the backup retention period for this RDS instance.
"""

                sns_client.publish(
                    TopicArn=sns_topic_arn,
                    Subject=f'Compliance Violation: Insufficient RDS Backup Retention in {environment_suffix}',
                    Message=message
                )
            except Exception as e:
                print(f"Error sending SNS notification: {str(e)}")

        # Put evaluation result
        config_client.put_evaluations(
            Evaluations=[
                {
                    'ComplianceResourceType': resource_type,
                    'ComplianceResourceId': resource_id,
                    'ComplianceType': compliance_type,
                    'Annotation': annotation,
                    'OrderingTimestamp': configuration_item['configurationItemCaptureTime']
                }
            ],
            ResultToken=event['resultToken']
        )

        return {
            'statusCode': 200,
            'body': json.dumps(f'Evaluation completed: {compliance_type}')
        }

    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
```

## Deployment Instructions

### Prerequisites

1. AWS CLI configured with appropriate credentials
2. Node.js 18+ installed
3. CDK CLI installed: `npm install -g aws-cdk`
4. Python 3.9+ for Lambda functions

### Deploy the Infrastructure

```bash
# Install dependencies
npm install

# Synthesize CloudFormation template
cdk synth

# Deploy to AWS (with environment suffix)
cdk deploy --context environmentSuffix=dev

# Or deploy without suffix (uses 'dev' as default)
cdk deploy
```

### Verify Deployment

```bash
# Check Config Recorder status
aws configservice describe-configuration-recorder-status

# List Config Rules
aws configservice describe-config-rules

# Check SNS topic
aws sns list-topics

# View Parameter Store values
aws ssm get-parameter --name /compliance/dev/min-backup-retention-days
aws ssm get-parameter --name /compliance/dev/approved-amis
```

### Update Compliance Thresholds

```bash
# Update approved AMIs
aws ssm put-parameter \
  --name /compliance/dev/approved-amis \
  --value "ami-12345,ami-67890" \
  --overwrite

# Update minimum backup retention
aws ssm put-parameter \
  --name /compliance/dev/min-backup-retention-days \
  --value "14" \
  --overwrite
```

### Clean Up

```bash
# Destroy all resources
cdk destroy --context environmentSuffix=dev
```

## Key Features

1. **AWS Config Integration**: Complete configuration recorder and delivery channel setup
2. **Custom Lambda Rules**: Three Python 3.9 Lambda functions for compliance checks
3. **S3 Lifecycle Management**: Automatic archiving after 90 days, deletion after 7 years
4. **SNS Notifications**: Real-time alerts for compliance violations
5. **Parameter Store**: Centralized compliance threshold management
6. **Cross-Region Aggregation**: Config aggregator for us-east-1
7. **CloudWatch Logs**: 30-day retention for Lambda logs
8. **Comprehensive Tagging**: CostCenter and ComplianceLevel tags on all resources
9. **Least Privilege IAM**: Minimal permissions for all roles
10. **Destroyable Resources**: All resources use DESTROY removal policy

## Compliance Rules

### 1. EC2 AMI Compliance
- Checks if EC2 instances use approved AMIs
- Approved AMIs stored in Parameter Store
- Evaluates on instance creation/modification and every 24 hours

### 2. S3 Encryption Compliance
- Checks if S3 buckets have encryption enabled
- Supports any encryption type (SSE-S3, SSE-KMS, etc.)
- Evaluates on bucket creation/modification and every 24 hours

### 3. RDS Backup Retention Compliance
- Checks if RDS instances meet minimum backup retention
- Minimum retention configurable via Parameter Store
- Evaluates on instance creation/modification and every 24 hours

## Architecture Benefits

- **Serverless**: Uses Lambda for custom rules, minimizing costs
- **Automated**: Config Rules run automatically every 24 hours
- **Scalable**: Handles large numbers of resources
- **Flexible**: Compliance thresholds configurable via Parameter Store
- **Auditable**: Complete history stored in S3 with 7-year retention
- **Observable**: CloudWatch Logs for debugging and monitoring
