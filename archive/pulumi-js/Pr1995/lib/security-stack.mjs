/**
 * Security Stack - Creates CloudTrail for audit logging and
 * EventBridge rules for automated security responses.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class SecurityStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:stack:SecurityStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create S3 bucket for CloudTrail logs
    const cloudTrailBucket = new aws.s3.Bucket(
      `SecureApp-cloudtrail-${environmentSuffix}`,
      {
        tags: {
          ...tags,
          Name: `SecureApp-cloudtrail-${environmentSuffix}`,
          Purpose: 'CloudTrailLogs',
        },
      },
      { parent: this }
    );

    // Block public access for CloudTrail bucket
    new aws.s3.BucketPublicAccessBlock(
      `SecureApp-cloudtrail-pab-${environmentSuffix}`,
      {
        bucket: cloudTrailBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Create bucket policy for CloudTrail
    const cloudTrailBucketPolicy = new aws.s3.BucketPolicy(
      `SecureApp-cloudtrail-policy-${environmentSuffix}`,
      {
        bucket: cloudTrailBucket.id,
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Sid": "AWSCloudTrailAclCheck",
            "Effect": "Allow",
            "Principal": {
              "Service": "cloudtrail.amazonaws.com"
            },
            "Action": "s3:GetBucketAcl",
            "Resource": "${cloudTrailBucket.arn}"
          },
          {
            "Sid": "AWSCloudTrailWrite",
            "Effect": "Allow",
            "Principal": {
              "Service": "cloudtrail.amazonaws.com"
            },
            "Action": "s3:PutObject",
            "Resource": "${cloudTrailBucket.arn}/*",
            "Condition": {
              "StringEquals": {
                "s3:x-amz-acl": "bucket-owner-full-control"
              }
            }
          }
        ]
      }`,
      },
      { parent: this }
    );

    // Create CloudTrail with simplified configuration
    this.cloudTrail = new aws.cloudtrail.Trail(
      `SecureApp-cloudtrail-${environmentSuffix}`,
      {
        name: `SecureApp-cloudtrail-${environmentSuffix}`,
        s3BucketName: cloudTrailBucket.id,
        includeGlobalServiceEvents: true,
        isMultiRegionTrail: true,
        enableLogFileValidation: true,

        // Simplified event selectors - removing the problematic S3 wildcard
        eventSelectors: [
          {
            readWriteType: 'All',
            includeManagementEvents: true,
          },
        ],

        tags: {
          ...tags,
          Name: `SecureApp-cloudtrail-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [cloudTrailBucketPolicy] }
    );

    // Create EventBridge rule for S3 security events
    const s3SecurityRule = new aws.cloudwatch.EventRule(
      `SecureApp-s3-security-rule-${environmentSuffix}`,
      {
        name: `SecureApp-S3-Security-Events-${environmentSuffix}`,
        description: 'Capture S3 security-related events',
        eventPattern: JSON.stringify({
          source: ['aws.s3'],
          'detail-type': [
            'S3 Object Created',
            'S3 Object Deleted',
            'S3 Bucket Policy Changed',
          ],
        }),
        tags: {
          ...tags,
          Name: `SecureApp-s3-security-rule-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create EventBridge rule for RDS security events
    const rdsSecurityRule = new aws.cloudwatch.EventRule(
      `SecureApp-rds-security-rule-${environmentSuffix}`,
      {
        name: `SecureApp-RDS-Security-Events-${environmentSuffix}`,
        description: 'Capture RDS security-related events',
        eventPattern: JSON.stringify({
          source: ['aws.rds'],
          'detail-type': ['RDS DB Instance Event', 'RDS DB Cluster Event'],
          detail: {
            'Event Categories': ['security'],
          },
        }),
        tags: {
          ...tags,
          Name: `SecureApp-rds-security-rule-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create SNS topic for security alerts
    const securityAlertTopic = new aws.sns.Topic(
      `SecureApp-security-alerts-${environmentSuffix}`,
      {
        displayName: 'SecureApp Security Alerts',
        tags: {
          ...tags,
          Name: `SecureApp-security-alerts-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create EventBridge targets for security alerts
    new aws.cloudwatch.EventTarget(
      `SecureApp-s3-security-target-${environmentSuffix}`,
      {
        rule: s3SecurityRule.name,
        arn: securityAlertTopic.arn,
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `SecureApp-rds-security-target-${environmentSuffix}`,
      {
        rule: rdsSecurityRule.name,
        arn: securityAlertTopic.arn,
      },
      { parent: this }
    );

    // Create Lambda function for automated security response
    const securityResponseLambda = new aws.lambda.Function(
      `SecureApp-security-response-${environmentSuffix}`,
      {
        name: `SecureApp-SecurityResponse-${environmentSuffix}`,
        runtime: 'python3.9',
        handler: 'index.handler',
        role: this.createLambdaRole(environmentSuffix, tags).arn,
        code: new pulumi.asset.AssetArchive({
          'index.py': new pulumi.asset.StringAsset(`
import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    Automated security response handler for SecureApp events.
    """
    try:
        logger.info(f"Received security event: {json.dumps(event)}")
        
        # Parse the event
        event_source = event.get('source', '')
        detail_type = event.get('detail-type', '')
        
        # Implement automated responses based on event type
        if event_source == 'aws.s3':
            handle_s3_security_event(event)
        elif event_source == 'aws.rds':
            handle_rds_security_event(event)
            
        return {
            'statusCode': 200,
            'body': json.dumps('Security event processed successfully')
        }
        
    except Exception as e:
        logger.error(f"Error processing security event: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }

def handle_s3_security_event(event):
    """Handle S3 security events."""
    logger.info("Processing S3 security event")
    # Implement S3-specific security responses
    
def handle_rds_security_event(event):
    """Handle RDS security events.""" 
    logger.info("Processing RDS security event")
    # Implement RDS-specific security responses
        `),
        }),
        tags: {
          ...tags,
          Name: `SecureApp-security-response-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create EventBridge target for Lambda function
    new aws.cloudwatch.EventTarget(
      `SecureApp-lambda-security-target-${environmentSuffix}`,
      {
        rule: s3SecurityRule.name,
        arn: securityResponseLambda.arn,
      },
      { parent: this }
    );

    // Grant EventBridge permission to invoke Lambda
    new aws.lambda.Permission(
      `SecureApp-lambda-eventbridge-permission-${environmentSuffix}`,
      {
        statementId: 'AllowExecutionFromEventBridge',
        action: 'lambda:InvokeFunction',
        function: securityResponseLambda.name,
        principal: 'events.amazonaws.com',
        sourceArn: s3SecurityRule.arn,
      },
      { parent: this }
    );

    // Export values
    this.cloudTrailArn = this.cloudTrail.arn;
    this.securityAlertTopicArn = securityAlertTopic.arn;

    this.registerOutputs({
      cloudTrailArn: this.cloudTrailArn,
      securityAlertTopicArn: this.securityAlertTopicArn,
    });
  }

  createLambdaRole(environmentSuffix, tags) {
    // Create IAM role for Lambda function
    const lambdaRole = new aws.iam.Role(
      `SecureApp-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          ...tags,
          Name: `SecureApp-lambda-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `SecureApp-lambda-basic-execution-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    return lambdaRole;
  }
}
