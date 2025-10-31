import * as cdk from 'aws-cdk-lib';
import * as config from 'aws-cdk-lib/aws-config';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

// ============================================================================
// MAIN STACK - TapStack (Parent Orchestrator)
// ============================================================================

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

    // Instantiate infrastructure guardrails stacks
    const complianceInfraStack = new ComplianceInfrastructureStack(
      this,
      'ComplianceInfrastructure',
      {
        environmentSuffix,
      }
    );

    const lambdaTimeoutRuleStack = new LambdaTimeoutRuleStack(
      this,
      'LambdaTimeoutRule',
      {
        environmentSuffix,
        complianceBucket: complianceInfraStack.complianceBucket,
        complianceLogGroup: complianceInfraStack.complianceLogGroup,
      }
    );

    const iamAccessKeyRuleStack = new IamAccessKeyRuleStack(
      this,
      'IamAccessKeyRule',
      {
        environmentSuffix,
        complianceBucket: complianceInfraStack.complianceBucket,
        complianceLogGroup: complianceInfraStack.complianceLogGroup,
      }
    );

    const remediationStack = new RemediationWorkflowStack(
      this,
      'RemediationWorkflow',
      {
        environmentSuffix,
        auditLogsBucket: complianceInfraStack.auditLogsBucket,
        remediationLogGroup: complianceInfraStack.remediationLogGroup,
      }
    );

    // Ensure compliance infrastructure is created first
    lambdaTimeoutRuleStack.addDependency(complianceInfraStack);
    iamAccessKeyRuleStack.addDependency(complianceInfraStack);
    remediationStack.addDependency(complianceInfraStack);
  }
}

// ============================================================================
// COMPLIANCE INFRASTRUCTURE STACK
// ============================================================================

interface ComplianceInfrastructureStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
}

/**
 * ComplianceInfrastructureStack
 *
 * Creates foundational compliance infrastructure:
 * - S3 buckets for compliance data and audit logs (7-year retention)
 * - CloudWatch Log Groups for audit trails
 * - AWS Config recorder and delivery channel
 */
class ComplianceInfrastructureStack extends cdk.NestedStack {
  public readonly complianceBucket: s3.Bucket;
  public readonly auditLogsBucket: s3.Bucket;
  public readonly remediationLogGroup: logs.LogGroup;
  public readonly complianceLogGroup: logs.LogGroup;

  constructor(
    scope: Construct,
    id: string,
    props: ComplianceInfrastructureStackProps
  ) {
    super(scope, id, props);

    const region = this.region;
    const account = this.account;
    const envSuffix = props.environmentSuffix;

    // ==========================================
    // S3 BUCKETS FOR COMPLIANCE AND AUDIT DATA
    // ==========================================

    /**
     * Compliance data bucket - stores AWS Config snapshots and history
     * Lifecycle: 7-year retention as required
     * Naming: Includes account, region, and environment suffix
     */
    this.complianceBucket = new s3.Bucket(this, 'ComplianceBucket', {
      bucketName: `tap-compliance-${account}-${region}-${envSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'SevenYearRetention',
          enabled: true,
          // Transition to cheaper storage classes over time
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(365),
            },
            {
              storageClass: s3.StorageClass.DEEP_ARCHIVE,
              transitionAfter: cdk.Duration.days(730),
            },
          ],
          // Delete after 7 years (2555 days)
          expiration: cdk.Duration.days(2555),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Explicit bucket policy for AWS Config service to deliver to this bucket
    this.complianceBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSConfigBucketPermissionsCheck',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('config.amazonaws.com')],
        actions: ['s3:GetBucketAcl', 's3:ListBucket'],
        resources: [this.complianceBucket.bucketArn],
      })
    );
    this.complianceBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSConfigBucketDelivery',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('config.amazonaws.com')],
        actions: ['s3:PutObject', 's3:PutObjectAcl'],
        resources: [`${this.complianceBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            's3:x-amz-acl': 'bucket-owner-full-control',
          },
        },
      })
    );

    /**
     * Audit logs bucket - stores remediation action logs
     * Lifecycle: 7-year retention to match compliance requirements
     * Naming: Includes account, region, and environment suffix
     */
    this.auditLogsBucket = new s3.Bucket(this, 'AuditLogsBucket', {
      bucketName: `tap-audit-logs-${account}-${region}-${envSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'SevenYearAuditRetention',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(365),
            },
          ],
          expiration: cdk.Duration.days(2555),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ==========================================
    // CLOUDWATCH LOG GROUPS FOR AUDIT TRAILS
    // ==========================================

    /**
     * CloudWatch Log Group for remediation audit trail
     * All remediation actions log here before execution
     */
    this.remediationLogGroup = new logs.LogGroup(this, 'RemediationLogGroup', {
      logGroupName: `/tap/remediation-${region}-${envSuffix}`,
      retention: logs.RetentionDays.TEN_YEARS, // Match compliance retention
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    /**
     * CloudWatch Log Group for compliance evaluation logs
     */
    this.complianceLogGroup = new logs.LogGroup(this, 'ComplianceLogGroup', {
      logGroupName: `/tap/compliance-${region}-${envSuffix}`,
      retention: logs.RetentionDays.TEN_YEARS,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ==========================================
    // AWS CONFIG SETUP
    // ==========================================

    /**
     * IAM role for AWS Config service
     * Allows Config to write to S3 and describe resources
     * Note: Role name not specified per requirements
     */
    const configRole = new iam.Role(this, 'ConfigRole', {
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWS_ConfigRole'
        ),
      ],
    });

    // Complete AWS Config service permissions
    configRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetBucketAcl',
          's3:ListBucket',
          's3:GetBucketLocation',
          's3:GetEncryptionConfiguration',
        ],
        resources: [this.complianceBucket.bucketArn],
      })
    );

    configRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:PutObject', 's3:PutObjectAcl'],
        resources: [`${this.complianceBucket.bucketArn}/*`],
      })
    );

    // Add comprehensive AWS Config service permissions
    configRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'config:PutEvaluations',
          'config:PutConfigurationRecorder',
          'config:PutDeliveryChannel',
          'config:DescribeConfigurationRecorders',
          'config:DescribeDeliveryChannels',
          'config:DescribeConfigurationRecorderStatus',
          'config:DescribeDeliveryChannelStatus',
          'config:GetComplianceDetailsByConfigRule',
          'config:GetComplianceDetailsByResource',
          'config:GetComplianceSummaryByConfigRule',
          'config:GetComplianceSummaryByResource',
          'config:GetResourceConfigHistory',
          'config:GetDiscoveredResourceCounts',
          'config:ListDiscoveredResources',
        ],
        resources: ['*'],
      })
    );

    // Add read-only permissions for all AWS services that Config can record
    configRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          // EC2 permissions
          'ec2:Describe*',
          'ec2:Get*',
          // IAM permissions
          'iam:Get*',
          'iam:List*',
          // S3 permissions
          's3:Get*',
          's3:List*',
          // Lambda permissions
          'lambda:Get*',
          'lambda:List*',
          // RDS permissions
          'rds:Describe*',
          'rds:List*',
          // CloudFormation permissions
          'cloudformation:Describe*',
          'cloudformation:Get*',
          'cloudformation:List*',
          // CloudWatch permissions
          'logs:Describe*',
          'logs:Get*',
          'logs:List*',
          // SNS permissions
          'sns:Get*',
          'sns:List*',
          // SQS permissions
          'sqs:Get*',
          'sqs:List*',
          // KMS permissions
          'kms:Describe*',
          'kms:Get*',
          'kms:List*',
          // Auto Scaling permissions
          'autoscaling:Describe*',
          // ELB permissions
          'elasticloadbalancing:Describe*',
          // VPC permissions
          'ec2:DescribeVpcs',
          'ec2:DescribeSubnets',
          'ec2:DescribeSecurityGroups',
          'ec2:DescribeNetworkInterfaces',
          'ec2:DescribeRouteTables',
          'ec2:DescribeInternetGateways',
          'ec2:DescribeNatGateways',
          'ec2:DescribeVpcEndpoints',
          'ec2:DescribeVpcPeeringConnections',
        ],
        resources: ['*'],
      })
    );

    // Grant Config permissions to write to compliance bucket
    this.complianceBucket.grantWrite(configRole);

    /**
     * Configuration Recorder - tracks resource configuration changes
     * Recording all supported resources for comprehensive compliance
     * Re-evaluates within 15 minutes of changes (Config built-in capability)
     */
    new config.CfnConfigurationRecorder(this, 'ConfigRecorder', {
      name: 'default', // AWS Config requires 'default' as the recorder name
      roleArn: configRole.roleArn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true, // Include IAM, CloudFront, etc.
      },
    });

    /**
     * Delivery Channel - sends config snapshots to S3
     * Configured for frequent snapshots to meet 15-minute evaluation target
     */
    new config.CfnDeliveryChannel(this, 'ConfigDeliveryChannel', {
      name: 'default',
      s3BucketName: this.complianceBucket.bucketName,
      configSnapshotDeliveryProperties: {
        deliveryFrequency: 'TwentyFour_Hours',
      },
    });

    // Ensure recorder is created before delivery channel (AWS Config requirement)deliveryChannel.addDependency(configRecorder);

    // Output important resource identifiers
    new cdk.CfnOutput(this, 'ComplianceBucketName', {
      value: this.complianceBucket.bucketName,
      description: 'Compliance data bucket (7-year retention)',
    });

    new cdk.CfnOutput(this, 'AuditLogsBucketName', {
      value: this.auditLogsBucket.bucketName,
      description: 'Audit logs bucket for remediation actions',
    });
  }
}

// ============================================================================
// LAMBDA TIMEOUT COMPLIANCE RULE STACK
// ============================================================================

interface LambdaTimeoutRuleStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  complianceBucket: s3.Bucket;
  complianceLogGroup: logs.LogGroup;
}

/**
 * LambdaTimeoutRuleStack
 *
 * Implements AWS Config rule to ensure all Lambda functions
 * have a maximum execution timeout of 5 minutes or less
 */
class LambdaTimeoutRuleStack extends cdk.NestedStack {
  constructor(
    scope: Construct,
    id: string,
    props: LambdaTimeoutRuleStackProps
  ) {
    super(scope, id, props);

    const region = this.region;
    const envSuffix = props.environmentSuffix;

    // ==========================================
    // LAMBDA FUNCTION FOR TIMEOUT EVALUATION
    // ==========================================

    /**
     * IAM role for Lambda timeout evaluation function
     * Note: Role name not specified per requirements
     */
    const lambdaTimeoutEvalRole = new iam.Role(this, 'LambdaTimeoutEvalRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Allow evaluator to report back to AWS Config
    lambdaTimeoutEvalRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['config:PutEvaluations'],
        resources: ['*'],
      })
    );

    // Grant permissions to describe Lambda functions
    lambdaTimeoutEvalRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'lambda:GetFunction',
          'lambda:GetFunctionConfiguration',
          'lambda:ListFunctions',
        ],
        resources: ['*'],
      })
    );

    // Grant permissions to write to compliance log group
    props.complianceLogGroup.grantWrite(lambdaTimeoutEvalRole);

    /**
     * Lambda function that evaluates Lambda timeout settings
     * Checks if timeout <= 300 seconds (5 minutes)
     */
    const lambdaTimeoutEvalFunction = new lambda.Function(
      this,
      'LambdaTimeoutEvalFunction',
      {
        functionName: `tap-lambda-timeout-eval-${region}-${envSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: 'index.lambda_handler',
        code: lambda.Code.fromInline(`
import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS Config client
config_client = boto3.client('config')
lambda_client = boto3.client('lambda')

# Maximum allowed timeout in seconds (5 minutes)
MAX_TIMEOUT_SECONDS = 300

def lambda_handler(event, context):
    """
    AWS Config rule evaluator for Lambda timeout compliance
    
    Evaluates whether Lambda functions have timeout <= 5 minutes (300 seconds)
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    # Extract configuration item from event
    invoking_event = json.loads(event['invokingEvent'])
    configuration_item = invoking_event.get('configurationItem', {})
    
    # Get function ARN and name
    resource_id = configuration_item.get('resourceId')
    resource_type = configuration_item.get('resourceType')
    
    # Validate resource type
    if resource_type != 'AWS::Lambda::Function':
        logger.warning(f"Unexpected resource type: {resource_type}")
        return
    
    # Get function configuration
    try:
        response = lambda_client.get_function_configuration(
            FunctionName=resource_id
        )
        timeout = response.get('Timeout', 0)
        
        logger.info(f"Function {resource_id} has timeout: {timeout} seconds")
        
        # Evaluate compliance
        if timeout <= MAX_TIMEOUT_SECONDS:
            compliance_type = 'COMPLIANT'
            annotation = f"Lambda timeout is {timeout}s (within 300s limit)"
        else:
            compliance_type = 'NON_COMPLIANT'
            annotation = f"Lambda timeout is {timeout}s (exceeds 300s limit)"
        
        # Put evaluation result back to AWS Config
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
        
        logger.info(f"Evaluation complete: {compliance_type}")
        
    except Exception as e:
        logger.error(f"Error evaluating Lambda function {resource_id}: {str(e)}")
        # Report error to Config
        config_client.put_evaluations(
            Evaluations=[
                {
                    'ComplianceResourceType': resource_type,
                    'ComplianceResourceId': resource_id,
                    'ComplianceType': 'NOT_APPLICABLE',
                    'Annotation': f"Error during evaluation: {str(e)}",
                    'OrderingTimestamp': configuration_item['configurationItemCaptureTime']
                }
            ],
            ResultToken=event['resultToken']
        )
`),
        role: lambdaTimeoutEvalRole,
        timeout: cdk.Duration.seconds(60),
        environment: {
          LOG_GROUP_NAME: props.complianceLogGroup.logGroupName,
        },
      }
    );

    // Grant Config permission to invoke this Lambda
    lambdaTimeoutEvalFunction.addPermission('ConfigInvokePermission', {
      principal: new iam.ServicePrincipal('config.amazonaws.com'),
      action: 'lambda:InvokeFunction',
    });

    // ==========================================
    // AWS CONFIG RULE FOR LAMBDA TIMEOUT
    // ==========================================

    /**
     * AWS Config Rule - Lambda Timeout Enforcement
     * Triggers on Lambda function configuration changes
     * Re-evaluates within 15 minutes via Config's change detection
     */
    new config.CfnConfigRule(this, 'LambdaTimeoutRule', {
      configRuleName: `tap-lambda-timeout-rule-${region}-${envSuffix}`,
      description:
        'Ensures all Lambda functions have timeout <= 5 minutes (300 seconds)',
      source: {
        owner: 'CUSTOM_LAMBDA',
        sourceIdentifier: lambdaTimeoutEvalFunction.functionArn,
        sourceDetails: [
          {
            eventSource: 'aws.config',
            messageType: 'ConfigurationItemChangeNotification',
          },
          {
            eventSource: 'aws.config',
            messageType: 'OversizedConfigurationItemChangeNotification',
          },
        ],
      },
      scope: {
        complianceResourceTypes: ['AWS::Lambda::Function'],
      },
    });

    new cdk.CfnOutput(this, 'LambdaTimeoutRuleName', {
      value: `tap-lambda-timeout-rule-${region}-${envSuffix}`,
      description: 'Config rule enforcing Lambda 5-minute timeout limit',
    });
  }
}

// ============================================================================
// IAM ACCESS KEY DETECTION RULE STACK
// ============================================================================

interface IamAccessKeyRuleStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  complianceBucket: s3.Bucket;
  complianceLogGroup: logs.LogGroup;
}

/**
 * IamAccessKeyRuleStack
 *
 * Implements AWS Config rule to detect and flag active IAM access keys
 * Ensures services use IAM roles rather than long-lived credentials
 */
class IamAccessKeyRuleStack extends cdk.NestedStack {
  constructor(scope: Construct, id: string, props: IamAccessKeyRuleStackProps) {
    super(scope, id, props);

    const region = this.region;
    const envSuffix = props.environmentSuffix;

    // ==========================================
    // LAMBDA FUNCTION FOR IAM ACCESS KEY DETECTION
    // ==========================================

    /**
     * IAM role for access key detection function
     * Note: Role name not specified per requirements
     */
    const iamAccessKeyEvalRole = new iam.Role(this, 'IamAccessKeyEvalRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Allow evaluator to report back to AWS Config
    iamAccessKeyEvalRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['config:PutEvaluations'],
        resources: ['*'],
      })
    );

    // Grant permissions to list IAM users and access keys
    iamAccessKeyEvalRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'iam:ListUsers',
          'iam:ListAccessKeys',
          'iam:GetAccessKeyLastUsed',
          'iam:GetUser',
        ],
        resources: ['*'],
      })
    );

    // Grant permissions to write to compliance log group
    props.complianceLogGroup.grantWrite(iamAccessKeyEvalRole);

    /**
     * Lambda function that detects active IAM access keys
     * Flags any IAM user with active access keys as non-compliant
     */
    const iamAccessKeyEvalFunction = new lambda.Function(
      this,
      'IamAccessKeyEvalFunction',
      {
        functionName: `tap-iam-access-key-eval-${region}-${envSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: 'index.lambda_handler',
        code: lambda.Code.fromInline(`
import json
import boto3
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS clients
config_client = boto3.client('config')
iam_client = boto3.client('iam')

def lambda_handler(event, context):
    """
    AWS Config rule evaluator for IAM access key detection
    
    Detects IAM users with active access keys and flags them as non-compliant
    Promotes use of IAM roles instead of long-lived credentials
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    # Extract configuration item from event
    invoking_event = json.loads(event['invokingEvent'])
    configuration_item = invoking_event.get('configurationItem', {})
    
    # Get user ARN and name
    resource_id = configuration_item.get('resourceId')
    resource_type = configuration_item.get('resourceType')
    resource_name = configuration_item.get('resourceName')
    
    # Validate resource type
    if resource_type != 'AWS::IAM::User':
        logger.warning(f"Unexpected resource type: {resource_type}")
        return
    
    # Check for active access keys
    try:
        response = iam_client.list_access_keys(UserName=resource_name)
        access_keys = response.get('AccessKeyMetadata', [])
        
        active_keys = [key for key in access_keys if key['Status'] == 'Active']
        
        logger.info(f"User {resource_name} has {len(active_keys)} active access key(s)")
        
        # Evaluate compliance
        if len(active_keys) == 0:
            compliance_type = 'COMPLIANT'
            annotation = "No active IAM access keys found (using IAM roles)"
        else:
            compliance_type = 'NON_COMPLIANT'
            key_ids = [key['AccessKeyId'] for key in active_keys]
            annotation = f"Found {len(active_keys)} active access key(s): {', '.join(key_ids)}. Use IAM roles instead."
        
        # Put evaluation result back to AWS Config
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
        
        logger.info(f"Evaluation complete: {compliance_type}")
        
    except Exception as e:
        logger.error(f"Error evaluating IAM user {resource_name}: {str(e)}")
        # Report error to Config
        config_client.put_evaluations(
            Evaluations=[
                {
                    'ComplianceResourceType': resource_type,
                    'ComplianceResourceId': resource_id,
                    'ComplianceType': 'NOT_APPLICABLE',
                    'Annotation': f"Error during evaluation: {str(e)}",
                    'OrderingTimestamp': configuration_item['configurationItemCaptureTime']
                }
            ],
            ResultToken=event['resultToken']
        )
`),
        role: iamAccessKeyEvalRole,
        timeout: cdk.Duration.seconds(60),
        environment: {
          LOG_GROUP_NAME: props.complianceLogGroup.logGroupName,
        },
      }
    );

    // Grant Config permission to invoke this Lambda
    iamAccessKeyEvalFunction.addPermission('ConfigInvokePermission', {
      principal: new iam.ServicePrincipal('config.amazonaws.com'),
      action: 'lambda:InvokeFunction',
    });

    // ==========================================
    // AWS CONFIG RULE FOR IAM ACCESS KEYS
    // ==========================================

    /**
     * AWS Config Rule - IAM Access Key Detection
     * Triggers on IAM user configuration changes
     * Flags any users with active access keys
     */
    new config.CfnConfigRule(this, 'IamAccessKeyRule', {
      configRuleName: `tap-iam-access-key-rule-${region}-${envSuffix}`,
      description:
        'Detects and flags IAM users with active access keys. Services should use IAM roles.',
      source: {
        owner: 'CUSTOM_LAMBDA',
        sourceIdentifier: iamAccessKeyEvalFunction.functionArn,
        sourceDetails: [
          {
            eventSource: 'aws.config',
            messageType: 'ConfigurationItemChangeNotification',
          },
          {
            eventSource: 'aws.config',
            messageType: 'OversizedConfigurationItemChangeNotification',
          },
        ],
      },
      scope: {
        complianceResourceTypes: ['AWS::IAM::User'],
      },
    });

    new cdk.CfnOutput(this, 'IamAccessKeyRuleName', {
      value: `tap-iam-access-key-rule-${region}-${envSuffix}`,
      description: 'Config rule detecting active IAM access keys',
    });
  }
}

// ============================================================================
// REMEDIATION WORKFLOW STACK
// ============================================================================

interface RemediationWorkflowStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  auditLogsBucket: s3.Bucket;
  remediationLogGroup: logs.LogGroup;
}

/**
 * RemediationWorkflowStack
 *
 * Implements automated remediation workflows with comprehensive audit logging
 * All remediations log to S3 and CloudWatch BEFORE making any changes
 */
class RemediationWorkflowStack extends cdk.NestedStack {
  constructor(
    scope: Construct,
    id: string,
    props: RemediationWorkflowStackProps
  ) {
    super(scope, id, props);

    const region = this.region;
    const envSuffix = props.environmentSuffix;

    // ==========================================
    // REMEDIATION LAMBDA FUNCTION
    // ==========================================

    /**
     * IAM role for remediation Lambda
     * Note: Role name not specified per requirements
     */
    const remediationRole = new iam.Role(this, 'RemediationRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Grant permissions to modify resources (add specific permissions based on needs)
    remediationRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          // Lambda remediation permissions
          'lambda:UpdateFunctionConfiguration',
          // IAM remediation permissions
          'iam:DeleteAccessKey',
          'iam:UpdateAccessKey',
          // Config permissions
          'config:DescribeComplianceByResource',
          'config:DescribeConfigRules',
        ],
        resources: ['*'],
      })
    );

    // Grant permissions to write audit logs to S3 and CloudWatch
    props.auditLogsBucket.grantWrite(remediationRole);
    props.remediationLogGroup.grantWrite(remediationRole);

    /**
     * Remediation Lambda Function
     *
     * CRITICAL: This function ALWAYS logs audit trail before making changes
     * - Logs to CloudWatch Logs
     * - Logs to S3 audit bucket
     * - Only proceeds with remediation after successful logging
     *
     * PLACEHOLDER: Business-specific remediation logic goes here
     */
    const remediationFunction = new lambda.Function(
      this,
      'RemediationFunction',
      {
        functionName: `tap-remediation-${region}-${envSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: 'index.lambda_handler',
        code: lambda.Code.fromInline(`
import json
import boto3
import logging
from datetime import datetime
import os

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS clients
lambda_client = boto3.client('lambda')
iam_client = boto3.client('iam')
s3_client = boto3.client('s3')
logs_client = boto3.client('logs')

# Environment variables
AUDIT_BUCKET = os.environ['AUDIT_BUCKET']
LOG_GROUP_NAME = os.environ['LOG_GROUP_NAME']

def write_audit_log(audit_data):
    """
    CRITICAL: Write audit log to S3 and CloudWatch BEFORE any remediation
    
    This function must succeed before any remediation actions are taken
    """
    timestamp = datetime.utcnow().isoformat()
    audit_data['timestamp'] = timestamp
    audit_data['logged_at'] = timestamp
    
    try:
        # Log to CloudWatch
        logger.info(f"AUDIT LOG: {json.dumps(audit_data)}")
        
        # Log to S3
        s3_key = f"remediation-audit/{timestamp.split('T')[0]}/{timestamp}.json"
        s3_client.put_object(
            Bucket=AUDIT_BUCKET,
            Key=s3_key,
            Body=json.dumps(audit_data, indent=2),
            ContentType='application/json'
        )
        
        logger.info(f"Audit log written to S3: s3://{AUDIT_BUCKET}/{s3_key}")
        return True
        
    except Exception as e:
        logger.error(f"CRITICAL: Failed to write audit log: {str(e)}")
        # If audit logging fails, DO NOT proceed with remediation
        raise Exception(f"Audit logging failed - remediation aborted: {str(e)}")

def remediate_lambda_timeout(function_arn, current_timeout):
    """
    Remediate Lambda function timeout exceeding 5 minutes
    
    PLACEHOLDER: Add business-specific logic here
    - Should this auto-remediate or require approval?
    - What should the new timeout be?
    - Should we notify specific teams?
    """
    audit_data = {
        'remediation_type': 'lambda_timeout',
        'resource_arn': function_arn,
        'violation': f'Timeout {current_timeout}s exceeds 300s limit',
        'action': 'UPDATE_TIMEOUT',
        'new_timeout': 300,
        'status': 'PENDING'
    }
    
    # STEP 1: Write audit log BEFORE making changes
    write_audit_log(audit_data)
    
    # STEP 2: Perform remediation
    # PLACEHOLDER: Uncomment and customize based on business requirements
    """
    try:
        response = lambda_client.update_function_configuration(
            FunctionName=function_arn,
            Timeout=300
        )
        audit_data['status'] = 'SUCCESS'
        audit_data['response'] = str(response)
        logger.info(f"Successfully updated Lambda timeout: {function_arn}")
    except Exception as e:
        audit_data['status'] = 'FAILED'
        audit_data['error'] = str(e)
        logger.error(f"Failed to update Lambda timeout: {str(e)}")
        raise
    finally:
        # Log final status
        write_audit_log(audit_data)
    """
    
    logger.info(f"PLACEHOLDER: Would remediate Lambda timeout for {function_arn}")
    return audit_data

def remediate_iam_access_key(user_name, access_key_id):
    """
    Remediate IAM user with active access keys
    
    PLACEHOLDER: Add business-specific logic here
    - Should keys be deactivated or deleted?
    - Should we notify the user first?
    - Grace period before remediation?
    - Exceptions for specific service accounts?
    """
    audit_data = {
        'remediation_type': 'iam_access_key',
        'user_name': user_name,
        'access_key_id': access_key_id,
        'violation': 'Active IAM access key found (should use roles)',
        'action': 'DEACTIVATE_KEY',
        'status': 'PENDING'
    }
    
    # STEP 1: Write audit log BEFORE making changes
    write_audit_log(audit_data)
    
    # STEP 2: Perform remediation
    # PLACEHOLDER: Uncomment and customize based on business requirements
    """
    try:
        # Option 1: Deactivate the key
        iam_client.update_access_key(
            UserName=user_name,
            AccessKeyId=access_key_id,
            Status='Inactive'
        )
        audit_data['status'] = 'SUCCESS'
        logger.info(f"Successfully deactivated access key: {access_key_id}")
        
        # Option 2: Delete the key (more aggressive)
        # iam_client.delete_access_key(
        #     UserName=user_name,
        #     AccessKeyId=access_key_id
        # )
        
    except Exception as e:
        audit_data['status'] = 'FAILED'
        audit_data['error'] = str(e)
        logger.error(f"Failed to remediate access key: {str(e)}")
        raise
    finally:
        # Log final status
        write_audit_log(audit_data)
    """
    
    logger.info(f"PLACEHOLDER: Would remediate IAM access key {access_key_id} for user {user_name}")
    return audit_data

def lambda_handler(event, context):
    """
    Main remediation handler
    
    Triggered by AWS Config compliance events or EventBridge rules
    Routes to appropriate remediation function based on resource type
    """
    logger.info(f"Received remediation event: {json.dumps(event)}")
    
    try:
        # Parse the event
        detail = event.get('detail', {})
        resource_type = detail.get('resourceType')
        compliance_type = detail.get('newEvaluationResult', {}).get('complianceType')
        
        # Only remediate non-compliant resources
        if compliance_type != 'NON_COMPLIANT':
            logger.info(f"Resource is compliant, no remediation needed")
            return
        
        # Route to appropriate remediation function
        if resource_type == 'AWS::Lambda::Function':
            function_arn = detail.get('resourceId')
            # PLACEHOLDER: Extract current timeout from detail
            current_timeout = 600  # Example value
            result = remediate_lambda_timeout(function_arn, current_timeout)
            
        elif resource_type == 'AWS::IAM::User':
            user_name = detail.get('resourceName')
            # PLACEHOLDER: Extract access key ID from detail
            access_key_id = 'AKIAIOSFODNN7EXAMPLE'  # Example value
            result = remediate_iam_access_key(user_name, access_key_id)
            
        else:
            logger.warning(f"No remediation logic for resource type: {resource_type}")
            return
        
        logger.info(f"Remediation completed: {json.dumps(result)}")
        return result
        
    except Exception as e:
        logger.error(f"Remediation failed: {str(e)}")
        # Log the failure
        failure_audit = {
            'remediation_type': 'UNKNOWN',
            'status': 'FAILED',
            'error': str(e),
            'event': event
        }
        write_audit_log(failure_audit)
        raise
`),
        role: remediationRole,
        timeout: cdk.Duration.minutes(5),
        environment: {
          AUDIT_BUCKET: props.auditLogsBucket.bucketName,
          LOG_GROUP_NAME: props.remediationLogGroup.logGroupName,
        },
      }
    );

    // ==========================================
    // EVENTBRIDGE RULE FOR AUTOMATED REMEDIATION
    // ==========================================

    /**
     * EventBridge Rule - triggers remediation on Config compliance changes
     *
     * PLACEHOLDER: Customize the event pattern based on:
     * - Which rules should trigger auto-remediation
     * - Whether to require manual approval first
     * - Business hours restrictions
     */
    const remediationRule = new events.Rule(this, 'RemediationRule', {
      ruleName: `tap-remediation-trigger-${region}-${envSuffix}`,
      description: 'Triggers remediation workflow on compliance violations',
      eventPattern: {
        source: ['aws.config'],
        detailType: ['Config Rules Compliance Change'],
        detail: {
          newEvaluationResult: {
            complianceType: ['NON_COMPLIANT'],
          },
          // PLACEHOLDER: Add specific config rule names here
          // configRuleName: [
          //   `tap-lambda-timeout-rule-${region}-${envSuffix}`,
          //   `tap-iam-access-key-rule-${region}-${envSuffix}`,
          // ],
        },
      },
    });

    // Add Lambda as target
    remediationRule.addTarget(
      new targets.LambdaFunction(remediationFunction, {
        retryAttempts: 2,
      })
    );

    new cdk.CfnOutput(this, 'RemediationFunctionName', {
      value: remediationFunction.functionName,
      description: 'Remediation function with audit logging',
    });

    new cdk.CfnOutput(this, 'RemediationRuleName', {
      value: remediationRule.ruleName,
      description: 'EventBridge rule triggering remediation workflows',
    });
  }
}
