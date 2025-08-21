import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const accountId = cdk.Stack.of(this).account;
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') || 'dev';

    // 1. S3 Bucket with SSE-S3 encryption
    const corpBucket = new s3.Bucket(this, 'corp-secure-bucket', {
      bucketName: `corp-secure-data-${environmentSuffix}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'corp-lifecycle-rule',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    // 2. IAM Role with account boundary
    const corpExecutionRole = new iam.Role(this, 'corp-execution-role', {
      roleName: `corp-secure-execution-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        'corp-s3-policy': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [corpBucket.bucketArn + '/*'],
              conditions: {
                StringEquals: {
                  'aws:SourceAccount': accountId,
                },
              },
            }),
          ],
        }),
      },
    });

    // IAM User with MFA enforcement
    const corpUser = new iam.User(this, 'corp-secure-user', {
      userName: `corp-secure-service-user-${environmentSuffix}`,
    });

    // MFA enforcement policy
    const mfaPolicy = new iam.Policy(this, 'corp-mfa-enforcement-policy', {
      policyName: `corp-mfa-enforcement-${environmentSuffix}`,
      statements: [
        new iam.PolicyStatement({
          sid: 'DenyAllExceptListedIfNoMFA',
          effect: iam.Effect.DENY,
          notActions: [
            'iam:CreateVirtualMFADevice',
            'iam:EnableMFADevice',
            'iam:GetUser',
            'iam:ListMFADevices',
            'iam:ListVirtualMFADevices',
            'iam:ResyncMFADevice',
            'sts:GetSessionToken',
          ],
          resources: ['*'],
          conditions: {
            BoolIfExists: {
              'aws:MultiFactorAuthPresent': 'false',
            },
          },
        }),
      ],
    });

    corpUser.attachInlinePolicy(mfaPolicy);

    // 3. VPC for RDS instance
    const corpVpc = new ec2.Vpc(this, 'corp-secure-vpc', {
      vpcName: `corp-secure-vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'corp-public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'corp-private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Security group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'corp-rds-sg', {
      vpc: corpVpc,
      description: 'Security group for corp RDS instance',
      allowAllOutbound: false,
    });

    rdsSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/16'),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from VPC'
    );

    // 4. RDS Instance (not internet-accessible)
    const corpDatabase = new rds.DatabaseInstance(
      this,
      'corp-secure-database',
      {
        instanceIdentifier: `corp-secure-db-${environmentSuffix}`,
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        credentials: rds.Credentials.fromGeneratedSecret('corp_admin', {
          secretName: `corp/db/credentials/${environmentSuffix}`,
        }),
        vpc: corpVpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [rdsSecurityGroup],
        multiAz: false,
        allowMajorVersionUpgrade: false,
        autoMinorVersionUpgrade: true,
        backupRetention: cdk.Duration.days(7),
        deletionProtection: false,
        storageEncrypted: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // 5. GuardDuty - Reuse existing detector if available
    // Since GuardDuty only allows one detector per account per region,
    // we'll use a custom resource to either create or reference existing detector
    const guardDutyHandler = new cdk.CustomResource(this, 'guardduty-handler', {
      serviceToken: new lambda.Function(this, 'guardduty-lambda', {
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import boto3
import cfnresponse
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    try:
        guardduty = boto3.client('guardduty')
        
        if event['RequestType'] == 'Create':
            # Check if detector already exists
            response = guardduty.list_detectors()
            
            if response['DetectorIds']:
                # Use existing detector
                detector_id = response['DetectorIds'][0]
                logger.info(f"Using existing GuardDuty detector: {detector_id}")
                
                # Update existing detector with our desired configuration
                try:
                    guardduty.update_detector(
                        DetectorId=detector_id,
                        Enable=True,
                        FindingPublishingFrequency='FIFTEEN_MINUTES'
                    )
                    
                    # Enable desired features on existing detector
                    features = ['S3_DATA_EVENTS', 'EKS_AUDIT_LOGS', 'EBS_MALWARE_PROTECTION', 'RDS_LOGIN_EVENTS', 'LAMBDA_NETWORK_LOGS']
                    for feature in features:
                        try:
                            guardduty.update_detector_feature_configuration(
                                DetectorId=detector_id,
                                Feature=feature,
                                Status='ENABLED'
                            )
                            logger.info(f"Enabled feature: {feature}")
                        except Exception as e:
                            logger.warning(f"Could not enable feature {feature}: {e}")
                            
                except Exception as e:
                    logger.warning(f"Could not update detector: {e}")
                    
            else:
                # Create new detector
                response = guardduty.create_detector(
                    Enable=True,
                    FindingPublishingFrequency='FIFTEEN_MINUTES',
                    Features=[
                        {'Name': 'S3_DATA_EVENTS', 'Status': 'ENABLED'},
                        {'Name': 'EKS_AUDIT_LOGS', 'Status': 'ENABLED'},
                        {'Name': 'EBS_MALWARE_PROTECTION', 'Status': 'ENABLED'},
                        {'Name': 'RDS_LOGIN_EVENTS', 'Status': 'ENABLED'},
                        {'Name': 'LAMBDA_NETWORK_LOGS', 'Status': 'ENABLED'}
                    ]
                )
                detector_id = response['DetectorId']
                logger.info(f"Created new GuardDuty detector: {detector_id}")
                
        elif event['RequestType'] == 'Update':
            # Handle updates by reusing existing detector
            response = guardduty.list_detectors()
            detector_id = response['DetectorIds'][0] if response['DetectorIds'] else 'none'
            logger.info(f"Updated GuardDuty detector: {detector_id}")
            
        elif event['RequestType'] == 'Delete':
            # Don't delete the detector on stack deletion
            logger.info("Skipping GuardDuty detector deletion")
            detector_id = 'none'
        
        cfnresponse.send(event, context, cfnresponse.SUCCESS, {'DetectorId': detector_id})
        
    except Exception as e:
        logger.error(f"Error: {e}")
        cfnresponse.send(event, context, cfnresponse.FAILED, {'Error': str(e)})
        `),
        timeout: cdk.Duration.minutes(5),
        initialPolicy: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'guardduty:CreateDetector',
              'guardduty:ListDetectors',
              'guardduty:UpdateDetector',
              'guardduty:UpdateDetectorFeatureConfiguration',
              'guardduty:GetDetector',
            ],
            resources: ['*'],
          }),
        ],
      }).functionArn,
      properties: {
        timestamp: Date.now().toString(),
      },
    });

    // Get the detector ID from the custom resource
    const detectorId = guardDutyHandler.getAtt('DetectorId');

    // 6. API Gateway with comprehensive logging
    const apiLogGroup = new logs.LogGroup(this, 'corp-api-logs', {
      logGroupName: `/aws/apigateway/corp-secure-api-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda function for API Gateway
    const corpLambda = new lambda.Function(this, 'corp-api-function', {
      functionName: `corp-secure-api-handler-${environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    logger.info(f"Received request: {json.dumps(event)}")
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'X-Corp-Security': 'enabled'
        },
        'body': json.dumps({
            'message': 'Corp secure API is working',
            'requestId': context.aws_request_id
        })
    }
      `),
      role: corpExecutionRole,
      environment: {
        BUCKET_NAME: corpBucket.bucketName,
        DB_ENDPOINT: corpDatabase.instanceEndpoint.hostname,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    // API Gateway with logging enabled
    const corpApi = new apigateway.RestApi(this, 'corp-secure-api', {
      restApiName: `corp-secure-rest-api-${environmentSuffix}`,
      description: 'Corp secure REST API with comprehensive logging',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(
          apiLogGroup
        ),
        accessLogFormat: apigateway.AccessLogFormat.custom(
          JSON.stringify({
            requestId: apigateway.AccessLogField.contextRequestId(),
            sourceIp: apigateway.AccessLogField.contextIdentitySourceIp(),
            method: apigateway.AccessLogField.contextHttpMethod(),
            path: apigateway.AccessLogField.contextPath(),
            status: apigateway.AccessLogField.contextStatus(),
            responseTime: apigateway.AccessLogField.contextResponseLatency(),
            userAgent: apigateway.AccessLogField.contextIdentityUserAgent(),
            error: apigateway.AccessLogField.contextErrorMessage(),
          })
        ),
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'POST'],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountPrincipal(accountId)],
            actions: ['execute-api:Invoke'],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'aws:SourceAccount': accountId,
              },
            },
          }),
        ],
      }),
    });

    const integration = new apigateway.LambdaIntegration(corpLambda, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    corpApi.root.addMethod('GET', integration, {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Content-Type': true,
          },
        },
      ],
    });

    // Output important resource ARNs and endpoints
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: corpBucket.bucketName,
      description: 'Corp secure S3 bucket name',
      exportName: `${this.stackName}-S3BucketName`,
    });

    new cdk.CfnOutput(this, 'S3BucketArn', {
      value: corpBucket.bucketArn,
      description: 'Corp secure S3 bucket ARN',
      exportName: `${this.stackName}-S3BucketArn`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: corpDatabase.instanceEndpoint.hostname,
      description: 'Corp secure database endpoint',
      exportName: `${this.stackName}-DatabaseEndpoint`,
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: corpDatabase.instanceEndpoint.port.toString(),
      description: 'Corp secure database port',
      exportName: `${this.stackName}-DatabasePort`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: corpApi.url,
      description: 'Corp secure API Gateway URL',
      exportName: `${this.stackName}-ApiGatewayUrl`,
    });

    new cdk.CfnOutput(this, 'GuardDutyDetectorId', {
      value: detectorId.toString(),
      description: 'Corp GuardDuty detector ID (managed by custom resource)',
      exportName: `${this.stackName}-GuardDutyDetectorId`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: corpVpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-VpcId`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: corpLambda.functionName,
      description: 'Lambda function name',
      exportName: `${this.stackName}-LambdaFunctionName`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: corpLambda.functionArn,
      description: 'Lambda function ARN',
      exportName: `${this.stackName}-LambdaFunctionArn`,
    });

    new cdk.CfnOutput(this, 'IAMUserName', {
      value: corpUser.userName,
      description: 'IAM user name',
      exportName: `${this.stackName}-IAMUserName`,
    });

    new cdk.CfnOutput(this, 'IAMUserArn', {
      value: corpUser.userArn,
      description: 'IAM user ARN',
      exportName: `${this.stackName}-IAMUserArn`,
    });

    new cdk.CfnOutput(this, 'IAMRoleName', {
      value: corpExecutionRole.roleName,
      description: 'IAM execution role name',
      exportName: `${this.stackName}-IAMRoleName`,
    });

    new cdk.CfnOutput(this, 'IAMRoleArn', {
      value: corpExecutionRole.roleArn,
      description: 'IAM execution role ARN',
      exportName: `${this.stackName}-IAMRoleArn`,
    });
  }
}
