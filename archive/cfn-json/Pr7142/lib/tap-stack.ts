import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  environmentName?: string;
  isPrimaryRegion?: boolean;
  secondaryRegion?: string;
  alertEmail?: string;
  hostedZoneName?: string;
  lambdaReservedConcurrency?: number;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const {
      environmentSuffix,
      environmentName = 'production',
      isPrimaryRegion = true,
      secondaryRegion = 'us-west-2',
      alertEmail = 'alerts@example.com',
      hostedZoneName = 'payment-system-demo.com',
      lambdaReservedConcurrency = 100,
    } = props;

    // Conditions
    const isPrimary = isPrimaryRegion;
    const isSecondary = !isPrimaryRegion;

    // DynamoDB Global Table
    const paymentTable = new dynamodb.CfnGlobalTable(this, 'PaymentProcessingTable', {
      tableName: `payment-transactions-${environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      streamSpecification: {
        streamViewType: 'NEW_AND_OLD_IMAGES',
      },
      attributeDefinitions: [
        { attributeName: 'transactionId', attributeType: 'S' },
        { attributeName: 'timestamp', attributeType: 'N' },
        { attributeName: 'customerId', attributeType: 'S' },
      ],
      keySchema: [
        { attributeName: 'transactionId', keyType: 'HASH' },
        { attributeName: 'timestamp', keyType: 'RANGE' },
      ],
      globalSecondaryIndexes: [
        {
          indexName: 'CustomerIndex',
          keySchema: [
            { attributeName: 'customerId', keyType: 'HASH' },
            { attributeName: 'timestamp', keyType: 'RANGE' },
          ],
          projection: { projectionType: 'ALL' },
        },
      ],
      replicas: [
        {
          region: 'us-east-1',
          pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
          tags: [
            { key: 'Environment', value: environmentName },
            { key: 'Region', value: 'us-east-1' },
            { key: 'Service', value: 'PaymentProcessing' },
          ],
        },
        {
          region: secondaryRegion,
          pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
          tags: [
            { key: 'Environment', value: environmentName },
            { key: 'Region', value: secondaryRegion },
            { key: 'Service', value: 'PaymentProcessing' },
          ],
        },
      ],
    });

    // S3 Buckets
    const transactionLogsBucket = new s3.CfnBucket(this, 'TransactionLogsBucket', {
      bucketName: `transaction-logs-${cdk.Aws.REGION}-${environmentSuffix}`,
      versioningConfiguration: { status: 'Enabled' },
      lifecycleConfiguration: {
        rules: [
          {
            id: 'TransitionToIA',
            status: 'Enabled',
            transitions: [
              { transitionInDays: 30, storageClass: 'STANDARD_IA' },
              { transitionInDays: 90, storageClass: 'GLACIER' },
            ],
          },
        ],
      },
      publicAccessBlockConfiguration: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      bucketEncryption: {
        serverSideEncryptionConfiguration: [
          {
            serverSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      },
      tags: [
        { key: 'Environment', value: environmentName },
        { key: 'Region', value: cdk.Aws.REGION },
      ],
    });
    transactionLogsBucket.cfnOptions.condition = new cdk.CfnCondition(this, 'IsPrimaryBucket', {
      expression: cdk.Fn.conditionEquals(isPrimaryRegion, true)
    });

    const transactionLogsBucketSecondary = new s3.CfnBucket(this, 'TransactionLogsBucketSecondary', {
      bucketName: `transaction-logs-${cdk.Aws.REGION}-${environmentSuffix}`,
      versioningConfiguration: { status: 'Enabled' },
      lifecycleConfiguration: {
        rules: [
          {
            id: 'TransitionToIA',
            status: 'Enabled',
            transitions: [
              { transitionInDays: 30, storageClass: 'STANDARD_IA' },
              { transitionInDays: 90, storageClass: 'GLACIER' },
            ],
          },
        ],
      },
      publicAccessBlockConfiguration: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      bucketEncryption: {
        serverSideEncryptionConfiguration: [
          {
            serverSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      },
      tags: [
        { key: 'Environment', value: environmentName },
        { key: 'Region', value: cdk.Aws.REGION },
      ],
    });
    transactionLogsBucketSecondary.cfnOptions.condition = new cdk.CfnCondition(this, 'IsSecondaryBucket', {
      expression: cdk.Fn.conditionNot(new cdk.CfnCondition(this, 'IsPrimaryCondBucket', { expression: cdk.Fn.conditionEquals(isPrimaryRegion, true) }))
    });

    // IAM Role for S3 Replication
    const replicationRole = new iam.CfnRole(this, 'ReplicationRole', {
      roleName: `s3-replication-role-${environmentSuffix}`,
      assumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 's3.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      },
      policies: [
        {
          policyName: 'ReplicationPolicy',
          policyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
                Resource: transactionLogsBucket.attrArn,
              },
              {
                Effect: 'Allow',
                Action: ['s3:GetObjectVersionForReplication', 's3:GetObjectVersionAcl', 's3:GetObjectVersionTagging'],
                Resource: `${transactionLogsBucket.attrArn}/*`,
              },
              {
                Effect: 'Allow',
                Action: ['s3:ReplicateObject', 's3:ReplicateDelete', 's3:ReplicateTags'],
                Resource: `arn:aws:s3:::transaction-logs-${secondaryRegion}-${environmentSuffix}/*`,
              },
            ],
          },
        },
      ],
      tags: [{ key: 'Environment', value: environmentName }],
    });
    replicationRole.cfnOptions.condition = new cdk.CfnCondition(this, 'IsPrimaryReplication', {
      expression: cdk.Fn.conditionEquals(isPrimaryRegion, true)
    });

    // Secrets Manager Secret
    const apiSecret = new secretsmanager.CfnSecret(this, 'ApiSecret', {
      name: `payment-api-keys-${environmentSuffix}`,
      description: 'API keys for payment processing gateway',
      secretString: cdk.Fn.sub('{"apiKey":"PLACEHOLDER_KEY","apiSecret":"PLACEHOLDER_SECRET","region":"${AWS::Region}"}'),
      replicaRegions: isPrimary ? [{ region: secondaryRegion }] : undefined,
      tags: [
        { key: 'Environment', value: environmentName },
        { key: 'Region', value: cdk.Aws.REGION },
      ],
    });

    // Lambda Execution Role
    const lambdaExecutionRole = new iam.CfnRole(this, 'LambdaExecutionRole', {
      roleName: `payment-lambda-role-${environmentSuffix}`,
      assumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'lambda.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      },
      managedPolicyArns: ['arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'],
      policies: [
        {
          policyName: 'DynamoDBAccess',
          policyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'dynamodb:PutItem',
                  'dynamodb:GetItem',
                  'dynamodb:Query',
                  'dynamodb:UpdateItem',
                  'dynamodb:BatchWriteItem',
                ],
                Resource: [
                  paymentTable.attrArn,
                  cdk.Fn.sub(`${paymentTable.attrArn}/index/*`),
                ],
              },
            ],
          },
        },
        {
          policyName: 'SecretsManagerAccess',
          policyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
                Resource: apiSecret.ref,
              },
            ],
          },
        },
        {
          policyName: 'S3LogAccess',
          policyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:PutObject', 's3:PutObjectAcl'],
                Resource: isPrimary
                  ? `${transactionLogsBucket.attrArn}/*`
                  : `${transactionLogsBucketSecondary.attrArn}/*`,
              },
            ],
          },
        },
      ],
      tags: [{ key: 'Environment', value: environmentName }],
    });

    // Lambda Functions
    const paymentProcessingFunction = new lambda.CfnFunction(this, 'PaymentProcessingFunction', {
      functionName: `payment-processor-${environmentSuffix}`,
      runtime: 'python3.11',
      handler: 'index.lambda_handler',
      role: lambdaExecutionRole.attrArn,
      timeout: 30,
      memorySize: 512,
      reservedConcurrentExecutions: lambdaReservedConcurrency,
      environment: {
        variables: {
          REGION: cdk.Aws.REGION,
          ENVIRONMENT: environmentName,
          TABLE_NAME: paymentTable.ref,
          SECRET_ARN: apiSecret.ref,
          LOGS_BUCKET: isPrimary ? transactionLogsBucket.ref : transactionLogsBucketSecondary.ref,
          IS_PRIMARY: isPrimaryRegion.toString(),
        },
      },
      code: {
        zipFile: `import json\nimport boto3\nimport os\nfrom datetime import datetime\nimport uuid

dynamodb = boto3.resource('dynamodb')
secrets_client = boto3.client('secretsmanager')
s3_client = boto3.client('s3')

table_name = os.environ['TABLE_NAME']
secret_arn = os.environ['SECRET_ARN']
logs_bucket = os.environ['LOGS_BUCKET']
region = os.environ['REGION']
is_primary = os.environ['IS_PRIMARY']

def lambda_handler(event, context):
    try:
        # Parse payment request
        body = json.loads(event.get('body', '{}'))
        
        # Retrieve API credentials from Secrets Manager
        secret = secrets_client.get_secret_value(SecretId=secret_arn)
        credentials = json.loads(secret['SecretString'])
        
        # Generate transaction ID
        transaction_id = str(uuid.uuid4())
        timestamp = int(datetime.now().timestamp() * 1000)
        
        # Prepare transaction record
        transaction = {
            'transactionId': transaction_id,
            'timestamp': timestamp,
            'customerId': body.get('customerId', 'unknown'),
            'amount': body.get('amount', 0),
            'currency': body.get('currency', 'USD'),
            'status': 'pending',
            'region': region,
            'isPrimary': is_primary,
            'createdAt': datetime.now().isoformat()
        }
        
        # Store in DynamoDB
        table = dynamodb.Table(table_name)
        table.put_item(Item=transaction)
        
        # Log to S3
        log_key = f'transactions/{datetime.now().strftime("%Y/%m/%d")}/{transaction_id}.json'
        s3_client.put_object(
            Bucket=logs_bucket,
            Key=log_key,
            Body=json.dumps(transaction),
            ContentType='application/json'
        )
        
        # Return success response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'transactionId': transaction_id,
                'status': 'success',
                'region': region,
                'timestamp': timestamp
            })
        }
        
    except Exception as e:
        print(f'Error processing payment: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'Payment processing failed',
                'message': str(e)
            })
        }`,
      },
      tags: [
        { key: 'Environment', value: environmentName },
        { key: 'Region', value: cdk.Aws.REGION },
      ],
    });

    const functionUrl = new lambda.CfnUrl(this, 'FunctionUrl', {
      targetFunctionArn: paymentProcessingFunction.attrArn,
      authType: 'NONE',
      cors: {
        allowOrigins: ['*'],
        allowMethods: ['POST'],
        allowHeaders: ['Content-Type'],
      },
    });

    const functionUrlPermission = new lambda.CfnPermission(this, 'FunctionUrlPermission', {
      functionName: paymentProcessingFunction.ref,
      action: 'lambda:InvokeFunctionUrl',
      principal: '*',
      functionUrlAuthType: 'NONE',
    });

    const healthCheckFunction = new lambda.CfnFunction(this, 'HealthCheckFunction', {
      functionName: `health-check-${environmentSuffix}`,
      runtime: 'python3.11',
      handler: 'index.lambda_handler',
      role: lambdaExecutionRole.attrArn,
      timeout: 10,
      memorySize: 256,
      environment: {
        variables: {
          REGION: cdk.Aws.REGION,
          TABLE_NAME: paymentTable.ref,
        },
      },
      code: {
        zipFile: `import json\nimport boto3\nimport os

dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    try:
        table_name = os.environ['TABLE_NAME']
        region = os.environ['REGION']
        
        # Check DynamoDB connectivity
        table = dynamodb.Table(table_name)
        table.table_status
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'status': 'healthy',
                'region': region,
                'service': 'payment-processing'
            })
        }
    except Exception as e:
        return {
            'statusCode': 503,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'status': 'unhealthy',
                'error': str(e)
            })
        }`,
      },
      tags: [
        { key: 'Environment', value: environmentName },
        { key: 'Region', value: cdk.Aws.REGION },
      ],
    });

    const healthCheckUrl = new lambda.CfnUrl(this, 'HealthCheckUrl', {
      targetFunctionArn: healthCheckFunction.attrArn,
      authType: 'NONE',
    });

    const healthCheckUrlPermission = new lambda.CfnPermission(this, 'HealthCheckUrlPermission', {
      functionName: healthCheckFunction.ref,
      action: 'lambda:InvokeFunctionUrl',
      principal: '*',
      functionUrlAuthType: 'NONE',
    });

    // Route 53 Resources
    const hostedZone = new route53.CfnHostedZone(this, 'HostedZone', {
      name: hostedZoneName,
      hostedZoneConfig: {
        comment: 'Hosted zone for multi-region payment processing system',
      },
      hostedZoneTags: [
        { key: 'Environment', value: environmentName },
        { key: 'Service', value: 'PaymentProcessing' },
      ],
    });
    hostedZone.cfnOptions.condition = new cdk.CfnCondition(this, 'IsPrimaryHostedZone', {
      expression: cdk.Fn.conditionEquals(isPrimaryRegion, true)
    });

    // Health Check
    const healthCheck = new route53.CfnHealthCheck(this, 'HealthCheck', {
      healthCheckConfig: {
        type: 'HTTPS',
        resourcePath: '/',
        fullyQualifiedDomainName: cdk.Fn.select(2, cdk.Fn.split('/', healthCheckUrl.attrFunctionUrl)),
        port: 443,
        requestInterval: 30,
        failureThreshold: 3,
      },
      healthCheckTags: [
        { key: 'Name', value: `payment-health-${cdk.Aws.REGION}-${environmentSuffix}` },
        { key: 'Region', value: cdk.Aws.REGION },
      ],
    });

    const dnsRecord = new route53.CfnRecordSet(this, 'DNSRecord', {
      hostedZoneId: hostedZone.ref,
      name: cdk.Fn.sub(`api.${hostedZoneName}`),
      type: 'CNAME',
      setIdentifier: cdk.Fn.sub(`${cdk.Aws.REGION}-endpoint`),
      weight: 100,
      ttl: '60',
      resourceRecords: [cdk.Fn.select(2, cdk.Fn.split('/', functionUrl.attrFunctionUrl))],
      healthCheckId: healthCheck.ref,
    });
    dnsRecord.cfnOptions.condition = new cdk.CfnCondition(this, 'IsPrimaryDNS', {
      expression: cdk.Fn.conditionEquals(isPrimaryRegion, true)
    });

    // SNS Topic and Alarms
    const alertTopic = new sns.CfnTopic(this, 'AlertTopic', {
      topicName: `payment-alerts-${environmentSuffix}`,
      displayName: 'Payment Processing Alerts',
      subscription: [
        {
          endpoint: alertEmail,
          protocol: 'email',
        },
      ],
      tags: [
        { key: 'Environment', value: environmentName },
        { key: 'Region', value: cdk.Aws.REGION },
      ],
    });

    // CloudWatch Alarms
    const lambdaErrorAlarm = new cloudwatch.CfnAlarm(this, 'LambdaErrorAlarm', {
      alarmName: `lambda-errors-${environmentSuffix}`,
      alarmDescription: 'Alert when Lambda function errors exceed threshold',
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      statistic: 'Sum',
      period: 300,
      evaluationPeriods: 2,
      threshold: 10,
      comparisonOperator: 'GreaterThanThreshold',
      dimensions: [
        { name: 'FunctionName', value: paymentProcessingFunction.ref },
      ],
      alarmActions: [alertTopic.ref],
      treatMissingData: 'notBreaching',
    });

    const lambdaThrottleAlarm = new cloudwatch.CfnAlarm(this, 'LambdaThrottleAlarm', {
      alarmName: `lambda-throttles-${environmentSuffix}`,
      alarmDescription: 'Alert when Lambda function is throttled',
      metricName: 'Throttles',
      namespace: 'AWS/Lambda',
      statistic: 'Sum',
      period: 300,
      evaluationPeriods: 1,
      threshold: 5,
      comparisonOperator: 'GreaterThanThreshold',
      dimensions: [
        { name: 'FunctionName', value: paymentProcessingFunction.ref },
      ],
      alarmActions: [alertTopic.ref],
    });

    const dynamoDBReadThrottleAlarm = new cloudwatch.CfnAlarm(this, 'DynamoDBReadThrottleAlarm', {
      alarmName: `dynamodb-read-throttle-${environmentSuffix}`,
      alarmDescription: 'Alert when DynamoDB read capacity is throttled',
      metricName: 'ReadThrottleEvents',
      namespace: 'AWS/DynamoDB',
      statistic: 'Sum',
      period: 300,
      evaluationPeriods: 2,
      threshold: 10,
      comparisonOperator: 'GreaterThanThreshold',
      dimensions: [
        { name: 'TableName', value: paymentTable.ref },
      ],
      alarmActions: [alertTopic.ref],
      treatMissingData: 'notBreaching',
    });

    const dynamoDBWriteThrottleAlarm = new cloudwatch.CfnAlarm(this, 'DynamoDBWriteThrottleAlarm', {
      alarmName: `dynamodb-write-throttle-${environmentSuffix}`,
      alarmDescription: 'Alert when DynamoDB write capacity is throttled',
      metricName: 'WriteThrottleEvents',
      namespace: 'AWS/DynamoDB',
      statistic: 'Sum',
      period: 300,
      evaluationPeriods: 2,
      threshold: 10,
      comparisonOperator: 'GreaterThanThreshold',
      dimensions: [
        { name: 'TableName', value: paymentTable.ref },
      ],
      alarmActions: [alertTopic.ref],
      treatMissingData: 'notBreaching',
    });

    const replicationLatencyAlarm = new cloudwatch.CfnAlarm(this, 'ReplicationLatencyAlarm', {
      alarmName: `s3-replication-latency-${environmentSuffix}`,
      alarmDescription: 'Alert when S3 replication latency exceeds 15 minutes',
      metricName: 'ReplicationLatency',
      namespace: 'AWS/S3',
      statistic: 'Maximum',
      period: 900,
      evaluationPeriods: 1,
      threshold: 900,
      comparisonOperator: 'GreaterThanThreshold',
      dimensions: [
        { name: 'SourceBucket', value: transactionLogsBucket.ref },
        { name: 'DestinationBucket', value: `transaction-logs-${secondaryRegion}-${environmentSuffix}` },
        { name: 'RuleId', value: 'ReplicateAllObjects' },
      ],
      alarmActions: [alertTopic.ref],
    });
    replicationLatencyAlarm.cfnOptions.condition = new cdk.CfnCondition(this, 'IsPrimaryReplicationAlarm', {
      expression: cdk.Fn.conditionEquals(isPrimaryRegion, true)
    });

    // Outputs
    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      description: 'Name of the DynamoDB Global Table',
      value: paymentTable.ref,
      exportName: cdk.Fn.sub(`${cdk.Aws.STACK_NAME}-TableName`),
    });

    new cdk.CfnOutput(this, 'DynamoDBTableArn', {
      description: 'ARN of the DynamoDB Global Table',
      value: paymentTable.attrArn,
      exportName: cdk.Fn.sub(`${cdk.Aws.STACK_NAME}-TableArn`),
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      description: 'Name of the S3 bucket for transaction logs',
      value: isPrimary ? transactionLogsBucket.ref : transactionLogsBucketSecondary.ref,
      exportName: cdk.Fn.sub(`${cdk.Aws.STACK_NAME}-BucketName`),
    });

    new cdk.CfnOutput(this, 'S3BucketArn', {
      description: 'ARN of the S3 bucket',
      value: isPrimary ? transactionLogsBucket.attrArn : transactionLogsBucketSecondary.attrArn,
      exportName: cdk.Fn.sub(`${cdk.Aws.STACK_NAME}-BucketArn`),
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      description: 'ARN of the payment processing Lambda function',
      value: paymentProcessingFunction.attrArn,
      exportName: cdk.Fn.sub(`${cdk.Aws.STACK_NAME}-LambdaArn`),
    });

    new cdk.CfnOutput(this, 'LambdaFunctionUrl', {
      description: 'URL of the payment processing Lambda function',
      value: functionUrl.attrFunctionUrl,
      exportName: cdk.Fn.sub(`${cdk.Aws.STACK_NAME}-FunctionUrl`),
    });

    new cdk.CfnOutput(this, 'HealthCheckUrlOutput', {
      description: 'URL of the health check endpoint',
      value: healthCheckUrl.attrFunctionUrl,
      exportName: cdk.Fn.sub(`${cdk.Aws.STACK_NAME}-HealthCheckUrl`),
    });

    new cdk.CfnOutput(this, 'SecretArn', {
      description: 'ARN of the Secrets Manager secret',
      value: apiSecret.ref,
      exportName: cdk.Fn.sub(`${cdk.Aws.STACK_NAME}-SecretArn`),
    });

    new cdk.CfnOutput(this, 'SNSTopicArn', {
      description: 'ARN of the SNS topic for alerts',
      value: alertTopic.ref,
      exportName: cdk.Fn.sub(`${cdk.Aws.STACK_NAME}-AlertTopicArn`),
    });

    if (isPrimary) {
      new cdk.CfnOutput(this, 'HostedZoneId', {
        description: 'ID of the Route 53 hosted zone',
        value: hostedZone.ref,
        exportName: cdk.Fn.sub(`${cdk.Aws.STACK_NAME}-HostedZoneId`),
      });
    }

    new cdk.CfnOutput(this, 'HealthCheckId', {
      description: 'ID of the Route 53 health check',
      value: healthCheck.ref,
      exportName: cdk.Fn.sub(`${cdk.Aws.STACK_NAME}-HealthCheckId`),
    });
  }
}