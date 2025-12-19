import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';
import { TerraformOutput } from 'cdktf';

// Common tags for all resources
export const commonTags = {
  Environment: 'Production',
  Project: 'ETL-Pipeline',
};

// S3 Module
export class S3Module extends Construct {
  public bucket: aws.s3Bucket.S3Bucket;
  public bucketNotification: aws.s3BucketNotification.S3BucketNotification;

  constructor(scope: Construct, id: string, lambdaArn: string) {
    super(scope, id);

    // Create S3 bucket with encryption
    this.bucket = new aws.s3Bucket.S3Bucket(this, 'etl-bucket', {
      bucket: 'etl-pipeline-bucket-ts123',
      tags: commonTags,
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      },
    });

    // Bucket versioning
    new aws.s3BucketVersioning.S3BucketVersioningA(this, 'bucket-versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Lifecycle policy for processed files
    new aws.s3BucketLifecycleConfiguration.S3BucketLifecycleConfiguration(
      this,
      'lifecycle-policy',
      {
        bucket: this.bucket.id,
        rule: [
          {
            id: 'archive-processed',
            status: 'Enabled',
            filter: [
              {
                prefix: 'processed/',
              },
            ],
            transition: [
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
      }
    );

    // S3 Event Notification
    this.bucketNotification = new aws.s3BucketNotification.S3BucketNotification(
      this,
      'bucket-notification',
      {
        bucket: this.bucket.id,
        lambdaFunction: [
          {
            lambdaFunctionArn: lambdaArn,
            events: ['s3:ObjectCreated:*'],
            filterPrefix: 'raw/',
            filterSuffix: '.csv',
          },
        ],
      }
    );
  }
}

// Lambda Module
export interface LambdaConfig {
  functionName: string;
  handler: string;
  runtime: string;
  timeout: number;
  memorySize: number;
  s3Bucket: string;
  s3Key: string;
  environmentVariables?: { [key: string]: string };
  iamStatements: aws.dataAwsIamPolicyDocument.DataAwsIamPolicyDocumentStatement[];
}

export class LambdaModule extends Construct {
  public function: aws.lambdaFunction.LambdaFunction;
  public role: aws.iamRole.IamRole;
  public dlq: aws.sqsQueue.SqsQueue;

  constructor(scope: Construct, id: string, config: LambdaConfig) {
    super(scope, id);

    // Create DLQ
    this.dlq = new aws.sqsQueue.SqsQueue(this, `${id}-dlq`, {
      name: `${config.functionName}-dlq`,
      messageRetentionSeconds: 1209600, // 14 days
      tags: commonTags,
    });

    // IAM Role for Lambda
    const assumeRolePolicy =
      new aws.dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
        this,
        `${id}-assume-role`,
        {
          statement: [
            {
              actions: ['sts:AssumeRole'],
              principals: [
                {
                  type: 'Service',
                  identifiers: ['lambda.amazonaws.com'],
                },
              ],
            },
          ],
        }
      );

    this.role = new aws.iamRole.IamRole(this, `${id}-role`, {
      name: `${config.functionName}-role`,
      assumeRolePolicy: assumeRolePolicy.json,
      tags: commonTags,
    });

    // Attach basic execution policy
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      `${id}-basic-execution`,
      {
        role: this.role.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      }
    );

    // Attach X-Ray policy
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      `${id}-xray-policy`,
      {
        role: this.role.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      }
    );

    // Custom policy
    const customPolicy =
      new aws.dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
        this,
        `${id}-policy-doc`,
        {
          statement: [
            ...config.iamStatements,
            {
              actions: ['sqs:SendMessage', 'sqs:GetQueueAttributes'],
              resources: [this.dlq.arn],
            },
          ],
        }
      );

    new aws.iamRolePolicy.IamRolePolicy(this, `${id}-policy`, {
      name: `${config.functionName}-policy`,
      role: this.role.id,
      policy: customPolicy.json,
    });

    // Lambda Function
    this.function = new aws.lambdaFunction.LambdaFunction(
      this,
      `${id}-function`,
      {
        functionName: config.functionName,
        role: this.role.arn,
        handler: config.handler,
        runtime: config.runtime,
        timeout: config.timeout,
        memorySize: config.memorySize,
        s3Bucket: config.s3Bucket, // Use S3 instead of filename
        s3Key: config.s3Key,
        environment: {
          variables: {
            ...config.environmentVariables,
          },
        },
        tracingConfig: {
          mode: 'Active',
        },
        deadLetterConfig: {
          targetArn: this.dlq.arn,
        },
        tags: commonTags,
      }
    );
  }
}

// Step Functions Module
export class StepFunctionsModule extends Construct {
  public stateMachine: aws.sfnStateMachine.SfnStateMachine;
  public role: aws.iamRole.IamRole;

  constructor(
    scope: Construct,
    id: string,
    validationLambdaArn: string,
    transformationLambdaArn: string,
    dynamoTableName: string,
    snsTopicArn: string
  ) {
    super(scope, id);

    // IAM Role for Step Functions
    const assumeRolePolicy =
      new aws.dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
        this,
        'sfn-assume-role',
        {
          statement: [
            {
              actions: ['sts:AssumeRole'],
              principals: [
                {
                  type: 'Service',
                  identifiers: ['states.amazonaws.com'],
                },
              ],
            },
          ],
        }
      );

    this.role = new aws.iamRole.IamRole(this, 'sfn-role', {
      name: 'etl-stepfunctions-role',
      assumeRolePolicy: assumeRolePolicy.json,
      tags: commonTags,
    });

    // Step Functions policy
    const sfnPolicy = new aws.dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
      this,
      'sfn-policy-doc',
      {
        statement: [
          {
            actions: ['lambda:InvokeFunction'],
            resources: [validationLambdaArn, transformationLambdaArn],
          },
          {
            actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
            resources: [`arn:aws:dynamodb:*:*:table/${dynamoTableName}`],
          },
          {
            actions: ['sns:Publish'],
            resources: [snsTopicArn],
          },
          {
            actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
            resources: ['*'],
          },
        ],
      }
    );

    new aws.iamRolePolicy.IamRolePolicy(this, 'sfn-policy', {
      name: 'etl-stepfunctions-policy',
      role: this.role.id,
      policy: sfnPolicy.json,
    });

    // In StepFunctionsModule, update the state machine definition
    const definition = {
      Comment: 'ETL Pipeline State Machine',
      StartAt: 'ValidateFile',
      States: {
        ValidateFile: {
          Type: 'Task',
          Resource: validationLambdaArn,
          TimeoutSeconds: 300,
          Retry: [
            {
              ErrorEquals: [
                'Lambda.ServiceException',
                'Lambda.AWSLambdaException',
              ],
              IntervalSeconds: 2,
              MaxAttempts: 3,
              BackoffRate: 2,
            },
          ],
          Catch: [
            {
              ErrorEquals: ['States.ALL'],
              Next: 'NotifyError',
              ResultPath: '$.error',
            },
          ],
          Next: 'CheckValidation',
        },
        CheckValidation: {
          Type: 'Choice',
          Choices: [
            {
              Variable: '$.isValid',
              BooleanEquals: true,
              Next: 'TransformFile',
            },
          ],
          Default: 'NotifyError',
        },
        TransformFile: {
          Type: 'Task',
          Resource: transformationLambdaArn,
          TimeoutSeconds: 300,
          Retry: [
            {
              ErrorEquals: [
                'Lambda.ServiceException',
                'Lambda.AWSLambdaException',
              ],
              IntervalSeconds: 2,
              MaxAttempts: 3,
              BackoffRate: 2,
            },
          ],
          Catch: [
            {
              ErrorEquals: ['States.ALL'],
              Next: 'NotifyError',
              ResultPath: '$.error',
            },
          ],
          Next: 'RecordSuccess',
        },
        RecordSuccess: {
          Type: 'Task',
          Resource: 'arn:aws:states:::dynamodb:putItem',
          Parameters: {
            TableName: dynamoTableName,
            Item: {
              file_name: {
                'S.$': '$.fileName', // Correct JSONPath reference
              },
              process_start_time: {
                'S.$': '$.startTime',
              },
              process_end_time: {
                'S.$': '$$.State.EnteredTime',
              },
              status: {
                S: 'SUCCESS', // Static value
              },
              error_message: {
                S: '', // Static value
              },
            },
          },
          End: true,
        },
        NotifyError: {
          Type: 'Task',
          Resource: 'arn:aws:states:::sns:publish',
          Parameters: {
            TopicArn: snsTopicArn,
            'Message.$': "States.Format('ETL Pipeline Error: {}', $.error)", // Correct JSONPath
            Subject: 'ETL Pipeline Processing Failed',
          },
          Next: 'RecordFailure',
        },
        RecordFailure: {
          Type: 'Task',
          Resource: 'arn:aws:states:::dynamodb:putItem',
          Parameters: {
            TableName: dynamoTableName,
            Item: {
              file_name: {
                'S.$': '$.fileName',
              },
              process_start_time: {
                'S.$': '$.startTime',
              },
              process_end_time: {
                'S.$': '$$.State.EnteredTime',
              },
              status: {
                S: 'FAILED',
              },
              error_message: {
                'S.$': '$.error',
              },
            },
          },
          End: true,
        },
      },
    };

    this.stateMachine = new aws.sfnStateMachine.SfnStateMachine(
      this,
      'etl-state-machine',
      {
        name: 'etl-pipeline-state-machine',
        roleArn: this.role.arn,
        definition: JSON.stringify(definition),
        tracingConfiguration: {
          enabled: true,
        },
        tags: commonTags,
      }
    );
  }
}

export class KMSModule extends Construct {
  public key: aws.kmsKey.KmsKey;
  public alias: aws.kmsAlias.KmsAlias;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.key = new aws.kmsKey.KmsKey(this, 'etl-kms-key', {
      description: 'KMS key for ETL Pipeline encryption',
      enableKeyRotation: true,
      tags: commonTags,
    });

    this.alias = new aws.kmsAlias.KmsAlias(this, 'etl-kms-alias', {
      name: 'alias/etl-pipeline',
      targetKeyId: this.key.keyId,
    });
  }
}

// DynamoDB Module
export class DynamoDBModule extends Construct {
  public table: aws.dynamodbTable.DynamodbTable;

  constructor(scope: Construct, id: string, kmsKeyArn: string) {
    super(scope, id);

    this.table = new aws.dynamodbTable.DynamodbTable(this, 'metadata-table', {
      name: 'etl-pipeline-metadata',
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'file_name',
      attribute: [
        {
          name: 'file_name',
          type: 'S',
        },
      ],
      serverSideEncryption: {
        enabled: true,
        kmsKeyArn: kmsKeyArn, // Use customer-managed KMS key
      },
      tags: commonTags,
    });
  }
}

// SNS Module
export class SNSModule extends Construct {
  public topic: aws.snsTopic.SnsTopic;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.topic = new aws.snsTopic.SnsTopic(this, 'notification-topic', {
      name: 'etl-pipeline-notifications',
      kmsMasterKeyId: 'alias/aws/sns',
      tags: commonTags,
    });

    new TerraformOutput(this, 'sns-topic-arn', {
      value: this.topic.arn,
      description: 'SNS Topic ARN for notifications',
    });
  }
}

// CloudWatch Module
export class CloudWatchModule extends Construct {
  constructor(
    scope: Construct,
    id: string,
    lambdaFunctions: aws.lambdaFunction.LambdaFunction[],
    snsTopicArn: string
  ) {
    super(scope, id);

    lambdaFunctions.forEach((lambda, index) => {
      new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
        this,
        `lambda-error-alarm-${index}`,
        {
          alarmName: `${lambda.functionName}-high-error-rate`,
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 1,
          metricName: 'Errors',
          namespace: 'AWS/Lambda',
          period: 300,
          statistic: 'Average',
          threshold: 0.05,
          alarmDescription: 'Error rate exceeds 5% for Lambda function',
          dimensions: {
            FunctionName: lambda.functionName,
          },
          alarmActions: [snsTopicArn],
          tags: commonTags,
        }
      );
    });
  }
}
