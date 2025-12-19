import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import * as aws from '@cdktf/provider-aws';
import {
  S3Module,
  LambdaModule,
  KMSModule,
  StepFunctionsModule,
  DynamoDBModule,
  SNSModule,
  CloudWatchModule,
} from './modules';
// import { MyStack } from './my-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
  lambdaDeploymentBucket?: string;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            ManagedBy: 'CDKTF',
            Application: 'ETL-Pipeline',
          },
        },
      ],
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // ? Add your stack instantiations here
    // Create SNS Topic
    const snsModule = new SNSModule(this, 'sns');

    const kmsModule = new KMSModule(this, 'kms');

    // Create DynamoDB Table
    const dynamoModule = new DynamoDBModule(
      this,
      'dynamodb',
      kmsModule.key.arn
    );

    // Create a temporary S3 bucket reference for initial Lambda creation
    const tempBucketName = `etl-pipeline-bucket-${environmentSuffix}-${awsRegion}`;

    // Create Validation Lambda
    const validationLambda = new LambdaModule(this, 'validation-lambda', {
      functionName: 'etl-validation',
      handler: 'validation.handler',
      runtime: 'nodejs18.x',
      timeout: 300,
      memorySize: 512,
      s3Bucket:
        props?.lambdaDeploymentBucket || 'my-etl-lambda-deployments-123', // Your bucket name
      s3Key: 'validation-lambda.zip',
      environmentVariables: {
        SNS_TOPIC_ARN: snsModule.topic.arn,
        BUCKET_NAME: tempBucketName,
        STATE_MACHINE_SSM_PARAM: '/etl/state-machine-arn',
      },
      iamStatements: [
        // These will be updated after S3 creation
      ],
    });

    // Create Transformation Lambda
    const transformationLambda = new LambdaModule(
      this,
      'transformation-lambda',
      {
        functionName: 'etl-transformation',
        handler: 'transformation.handler',
        runtime: 'nodejs18.x',
        timeout: 300,
        memorySize: 512,
        s3Bucket:
          props?.lambdaDeploymentBucket || 'my-etl-lambda-deployments-123', // Your bucket name
        s3Key: 'transformation-lambda.zip',
        environmentVariables: {
          BUCKET_NAME: 'placeholder', // Will be updated after S3 creation
        },
        iamStatements: [
          // These will be updated after S3 creation
        ],
      }
    );

    // Create Step Functions
    const stepFunctions = new StepFunctionsModule(
      this,
      'step-functions',
      validationLambda.function.arn,
      transformationLambda.function.arn,
      dynamoModule.table.name,
      snsModule.topic.arn
    );

    // Create S3 Bucket with Notifications
    const s3Module = new S3Module(this, 's3', validationLambda.function.arn);

    // Allow S3 to invoke Lambda
    new aws.lambdaPermission.LambdaPermission(this, 's3-invoke-permission', {
      statementId: 'AllowS3Invoke',
      action: 'lambda:InvokeFunction',
      functionName: validationLambda.function.functionName,
      principal: 's3.amazonaws.com',
      sourceArn: s3Module.bucket.arn,
    });

    // Store state machine ARN in SSM
    new aws.ssmParameter.SsmParameter(this, 'state-machine-arn-param', {
      name: '/etl/state-machine-arn',
      type: 'String',
      value: stepFunctions.stateMachine.arn,
    });

    // After creating resources, update environment variables properly
    validationLambda.function.addOverride(
      'environment.variables.BUCKET_NAME',
      s3Module.bucket.id
    );
    transformationLambda.function.addOverride(
      'environment.variables.BUCKET_NAME',
      s3Module.bucket.id
    );

    // Create CloudWatch Alarms
    new CloudWatchModule(
      this,
      'cloudwatch',
      [validationLambda.function, transformationLambda.function],
      snsModule.topic.arn
    );

    const validationPolicyDoc =
      new aws.dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
        this,
        'validation-lambda-updated-policy',
        {
          statement: [
            {
              actions: ['s3:GetObject'],
              resources: [
                `${s3Module.bucket.arn}/*`,
                `${s3Module.bucket.arn}/raw/*`,
              ],
            },
            {
              actions: ['s3:PutObject'],
              resources: [`${s3Module.bucket.arn}/failed/*`],
            },
            {
              actions: ['sns:Publish'],
              resources: [snsModule.topic.arn],
            },
            {
              actions: ['states:StartExecution'],
              resources: [stepFunctions.stateMachine.arn],
            },
            {
              actions: ['sqs:SendMessage', 'sqs:GetQueueAttributes'],
              resources: [validationLambda.dlq.arn],
            },
            {
              actions: ['ssm:GetParameter'],
              resources: ['arn:aws:ssm:*:*:parameter/etl/state-machine-arn'],
            },
          ],
        }
      );

    new aws.iamRolePolicy.IamRolePolicy(
      this,
      'validation-lambda-updated-policy-attachment',
      {
        name: 'etl-validation-updated-policy',
        role: validationLambda.role.id,
        policy: validationPolicyDoc.json,
      }
    );

    const transformationPolicyDoc =
      new aws.dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
        this,
        'transformation-lambda-updated-policy',
        {
          statement: [
            {
              actions: ['s3:GetObject'],
              resources: [
                `${s3Module.bucket.arn}/*`,
                `${s3Module.bucket.arn}/raw/*`,
              ],
            },
            {
              actions: ['s3:PutObject'],
              resources: [`${s3Module.bucket.arn}/processed/*`],
            },
            {
              actions: ['s3:DeleteObject'],
              resources: [`${s3Module.bucket.arn}/raw/*`],
            },
            {
              actions: ['sqs:SendMessage', 'sqs:GetQueueAttributes'],
              resources: [transformationLambda.dlq.arn],
            },
          ],
        }
      );

    new aws.iamRolePolicy.IamRolePolicy(
      this,
      'transformation-lambda-updated-policy-attachment',
      {
        name: 'etl-transformation-updated-policy',
        role: transformationLambda.role.id,
        policy: transformationPolicyDoc.json,
      }
    );

    // Outputs
    new TerraformOutput(this, 'bucket-name', {
      value: s3Module.bucket.id,
      description: 'S3 bucket name for ETL pipeline',
    });

    new TerraformOutput(this, 'state-machine-arn', {
      value: stepFunctions.stateMachine.arn,
      description: 'Step Functions State Machine ARN',
    });

    new TerraformOutput(this, 'dynamodb-table-name', {
      value: dynamoModule.table.name,
      description: 'DynamoDB table name for metadata',
    });

    new TerraformOutput(this, 'sns-topic-arn', {
      value: snsModule.topic.arn, // adjust based on your actual variable name
      description: 'SNS Topic ARN for notifications',
    });

    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
