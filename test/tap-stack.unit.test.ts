import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";
import { expect, describe, test, beforeEach } from "@jest/globals";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  S3Module: jest.fn().mockImplementation((scope: any, id: string, lambdaArn: string) => ({
    bucket: {
      id: 'etl-pipeline-bucket-ts123',
      arn: 'arn:aws:s3:::etl-pipeline-bucket-ts123',
      bucketRegionalDomainName: 'etl-pipeline-bucket-ts123.s3.amazonaws.com'
    },
    bucketNotification: {
      id: 'bucket-notification',
      bucket: 'etl-pipeline-bucket-ts123',
      lambdaFunction: [{
        lambdaFunctionArn: lambdaArn,
        events: ['s3:ObjectCreated:*'],
        filterPrefix: 'raw/',
        filterSuffix: '.csv'
      }]
    }
  })),

  LambdaModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    function: {
      id: `lambda-${config.functionName}`,
      functionName: config.functionName,
      arn: `arn:aws:lambda:us-east-1:123456789012:function:${config.functionName}`,
      handler: config.handler,
      runtime: config.runtime,
      timeout: config.timeout,
      memorySize: config.memorySize,
      addOverride: jest.fn()
    },
    role: {
      id: `${config.functionName}-role`,
      name: `${config.functionName}-role`,
      arn: `arn:aws:iam::123456789012:role/${config.functionName}-role`
    },
    dlq: {
      id: `${id}-dlq`,
      name: `${config.functionName}-dlq`,
      arn: `arn:aws:sqs:us-east-1:123456789012:${config.functionName}-dlq`
    }
  })),

  StepFunctionsModule: jest.fn().mockImplementation((scope: any, id: string, validationLambdaArn: string, transformationLambdaArn: string, dynamoTableName: string, snsTopicArn: string) => ({
    stateMachine: {
      id: 'etl-state-machine',
      name: 'etl-pipeline-state-machine',
      arn: 'arn:aws:states:us-east-1:123456789012:stateMachine:etl-pipeline-state-machine',
      roleArn: 'arn:aws:iam::123456789012:role/etl-stepfunctions-role'
    },
    role: {
      id: 'sfn-role',
      name: 'etl-stepfunctions-role',
      arn: 'arn:aws:iam::123456789012:role/etl-stepfunctions-role'
    }
  })),

  DynamoDBModule: jest.fn().mockImplementation((scope: any, id: string) => ({
    table: {
      id: 'metadata-table',
      name: 'etl-pipeline-metadata',
      arn: 'arn:aws:dynamodb:us-east-1:123456789012:table/etl-pipeline-metadata',
      billingMode: 'PAY_PER_REQUEST'
    }
  })),

  SNSModule: jest.fn().mockImplementation((scope: any, id: string) => ({
    topic: {
      id: 'notification-topic',
      name: 'etl-pipeline-notifications',
      arn: 'arn:aws:sns:us-east-1:123456789012:etl-pipeline-notifications'
    }
  })),

  CloudWatchModule: jest.fn().mockImplementation((scope: any, id: string, lambdaFunctions: any[], snsTopicArn: string) => ({
    alarms: lambdaFunctions.map((lambda: any, index: number) => ({
      id: `lambda-error-alarm-${index}`,
      alarmName: `${lambda.functionName}-high-error-rate`,
      comparisonOperator: 'GreaterThanThreshold',
      threshold: 0.05
    }))
  })),

  commonTags: {
    Environment: 'Production',
    Project: 'ETL-Pipeline'
  }
}));

// Mock AWS provider modules
jest.mock("@cdktf/provider-aws", () => ({
  lambdaPermission: {
    LambdaPermission: jest.fn().mockImplementation(() => ({
      id: 's3-invoke-permission',
      statementId: 'AllowS3Invoke'
    }))
  }
}));

// Mock TerraformOutput and S3Backend
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    TerraformOutput: jest.fn(),
    S3Backend: jest.fn(),
    TerraformStack: actual.TerraformStack
  };
});

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
}));

// Mock the addOverride method
const mockAddOverride = jest.fn();
TapStack.prototype.addOverride = mockAddOverride;

describe("TapStack Unit Tests", () => {
  const {
    S3Module,
    LambdaModule,
    StepFunctionsModule,
    DynamoDBModule,
    SNSModule,
    CloudWatchModule
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const aws = require("@cdktf/provider-aws");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Stack Creation and Configuration", () => {
    test("should create TapStack with default configuration", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack");

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1',
          defaultTags: [{
            tags: {
              ManagedBy: 'CDKTF',
              Application: 'ETL-Pipeline'
            }
          }]
        })
      );
    });

    test("should create TapStack with custom aws region from props", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'eu-west-1'
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-west-1'
        })
      );
    });
  });

  describe("S3 Backend Configuration", () => {
    test("should configure S3 backend with default settings", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestStack.tfstate',
          region: 'us-east-1',
          encrypt: true
        })
      );

      expect(mockAddOverride).toHaveBeenCalledWith(
        'terraform.backend.s3.use_lockfile',
        true
      );
    });

    test("should configure S3 backend with custom settings", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        stateBucket: 'my-custom-bucket',
        stateBucketRegion: 'ap-south-1',
        environmentSuffix: 'prod'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'my-custom-bucket',
          key: 'prod/TestStack.tfstate',
          region: 'ap-south-1',
          encrypt: true
        })
      );
    });
  });

  describe("SNS Module Tests", () => {
    test("should create SNSModule first", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(SNSModule).toHaveBeenCalledWith(
        expect.anything(),
        'sns'
      );

      const snsModule = SNSModule.mock.results[0].value;
      expect(snsModule.topic.name).toBe('etl-pipeline-notifications');
      expect(snsModule.topic.arn).toBe('arn:aws:sns:us-east-1:123456789012:etl-pipeline-notifications');
    });
  });

  describe("DynamoDB Module Tests", () => {
    test("should create DynamoDBModule with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(DynamoDBModule).toHaveBeenCalledWith(
        expect.anything(),
        'dynamodb'
      );

      const dynamoModule = DynamoDBModule.mock.results[0].value;
      expect(dynamoModule.table.name).toBe('etl-pipeline-metadata');
      expect(dynamoModule.table.billingMode).toBe('PAY_PER_REQUEST');
    });
  });

  describe("Lambda Module Tests", () => {
    test("should create validation Lambda with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const snsModule = SNSModule.mock.results[0].value;

      const validationLambdaCall = LambdaModule.mock.calls.find(
        (call: any[]) => call[1] === 'validation-lambda'
      );

      expect(validationLambdaCall[2]).toMatchObject({
        functionName: 'etl-validation',
        handler: 'validation.handler',
        runtime: 'nodejs18.x',
        timeout: 300,
        memorySize: 512,
        s3Bucket: 'my-etl-lambda-deployments-123',
        s3Key: 'validation-lambda.zip',
        environmentVariables: {
          SNS_TOPIC_ARN: snsModule.topic.arn,
          BUCKET_NAME: 'placeholder'
        }
      });

      // Check IAM statements
      const iamStatements = validationLambdaCall[2].iamStatements;
      expect(iamStatements).toContainEqual({
        actions: ['s3:GetObject'],
        resources: ['arn:aws:s3:::*/*']
      });
      expect(iamStatements).toContainEqual({
        actions: ['sns:Publish'],
        resources: [snsModule.topic.arn]
      });
    });

    test("should create transformation Lambda with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const transformationLambdaCall = LambdaModule.mock.calls.find(
        (call: any[]) => call[1] === 'transformation-lambda'
      );

      expect(transformationLambdaCall[2]).toMatchObject({
        functionName: 'etl-transformation',
        handler: 'transformation.handler',
        runtime: 'nodejs18.x',
        timeout: 300,
        memorySize: 512,
        s3Bucket: 'my-etl-lambda-deployments-123',
        s3Key: 'transformation-lambda.zip',
        environmentVariables: {
          BUCKET_NAME: 'placeholder'
        }
      });

      // Check IAM statements
      const iamStatements = transformationLambdaCall[2].iamStatements;
      expect(iamStatements).toContainEqual({
        actions: ['s3:GetObject'],
        resources: ['arn:aws:s3:::*/*']
      });
      expect(iamStatements).toContainEqual({
        actions: ['s3:PutObject'],
        resources: ['arn:aws:s3:::*/processed/*']
      });
      expect(iamStatements).toContainEqual({
        actions: ['s3:DeleteObject'],
        resources: ['arn:aws:s3:::*/raw/*']
      });
    });

    test("should update Lambda environment variables with actual bucket name", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const s3Module = S3Module.mock.results[0].value;
      const validationLambda = LambdaModule.mock.results[0].value;
      const transformationLambda = LambdaModule.mock.results[1].value;

      expect(validationLambda.function.addOverride).toHaveBeenCalledWith('environment', {
        variables: {
          SNS_TOPIC_ARN: expect.any(String),
          BUCKET_NAME: s3Module.bucket.id
        }
      });

      expect(transformationLambda.function.addOverride).toHaveBeenCalledWith('environment', {
        variables: {
          BUCKET_NAME: s3Module.bucket.id
        }
      });
    });
  });

  describe("Step Functions Module Tests", () => {
    test("should create StepFunctionsModule with correct parameters", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const validationLambda = LambdaModule.mock.results[0].value;
      const transformationLambda = LambdaModule.mock.results[1].value;
      const dynamoModule = DynamoDBModule.mock.results[0].value;
      const snsModule = SNSModule.mock.results[0].value;

      expect(StepFunctionsModule).toHaveBeenCalledWith(
        expect.anything(),
        'step-functions',
        validationLambda.function.arn,
        transformationLambda.function.arn,
        dynamoModule.table.name,
        snsModule.topic.arn
      );

      const stepFunctions = StepFunctionsModule.mock.results[0].value;
      expect(stepFunctions.stateMachine.name).toBe('etl-pipeline-state-machine');
    });
  });

  describe("S3 Module Tests", () => {
    test("should create S3Module with Lambda notification", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const validationLambda = LambdaModule.mock.results[0].value;

      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        's3',
        validationLambda.function.arn
      );

      const s3Module = S3Module.mock.results[0].value;
      expect(s3Module.bucket.id).toBe('etl-pipeline-bucket-ts123');
      expect(s3Module.bucketNotification.lambdaFunction[0]).toMatchObject({
        lambdaFunctionArn: validationLambda.function.arn,
        events: ['s3:ObjectCreated:*'],
        filterPrefix: 'raw/',
        filterSuffix: '.csv'
      });
    });

    test("should create Lambda permission for S3 invocation", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const validationLambda = LambdaModule.mock.results[0].value;
      const s3Module = S3Module.mock.results[0].value;

      expect(aws.lambdaPermission.LambdaPermission).toHaveBeenCalledWith(
        expect.anything(),
        's3-invoke-permission',
        expect.objectContaining({
          statementId: 'AllowS3Invoke',
          action: 'lambda:InvokeFunction',
          functionName: validationLambda.function.functionName,
          principal: 's3.amazonaws.com',
          sourceArn: s3Module.bucket.arn
        })
      );
    });
  });

  describe("CloudWatch Module Tests", () => {
    test("should create CloudWatchModule with both Lambda functions", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const validationLambda = LambdaModule.mock.results[0].value;
      const transformationLambda = LambdaModule.mock.results[1].value;
      const snsModule = SNSModule.mock.results[0].value;

      expect(CloudWatchModule).toHaveBeenCalledWith(
        expect.anything(),
        'cloudwatch',
        [validationLambda.function, transformationLambda.function],
        snsModule.topic.arn
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required terraform outputs", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const outputCalls = TerraformOutput.mock.calls;
      const outputs = outputCalls.map((call: any) => ({
        id: call[1],
        value: call[2].value,
        description: call[2].description
      }));

      // Check SNS output (from module)
      expect(outputs).toContainEqual({
        id: 'sns-topic-arn',
        value: 'arn:aws:sns:us-east-1:123456789012:etl-pipeline-notifications',
        description: 'SNS Topic ARN for notifications'
      });

      // Check bucket output
      const bucketOutput = outputs.find((o: any) => o.id === 'bucket-name');
      expect(bucketOutput).toMatchObject({
        value: 'etl-pipeline-bucket-ts123',
        description: 'S3 bucket name for ETL pipeline'
      });

      // Check state machine output
      const stateMachineOutput = outputs.find((o: any) => o.id === 'state-machine-arn');
      expect(stateMachineOutput).toMatchObject({
        value: 'arn:aws:states:us-east-1:123456789012:stateMachine:etl-pipeline-state-machine',
        description: 'Step Functions State Machine ARN'
      });

      // Check DynamoDB output
      const dynamoOutput = outputs.find((o: any) => o.id === 'dynamodb-table-name');
      expect(dynamoOutput).toMatchObject({
        value: 'etl-pipeline-metadata',
        description: 'DynamoDB table name for metadata'
      });
    });
  });

  describe("Module Dependencies and Order", () => {
    test("should create modules in correct order", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const snsCallOrder = SNSModule.mock.invocationCallOrder[0];
      const dynamoCallOrder = DynamoDBModule.mock.invocationCallOrder[0];
      const lambdaCallOrder = LambdaModule.mock.invocationCallOrder[0];
      const stepFunctionsCallOrder = StepFunctionsModule.mock.invocationCallOrder[0];
      const s3CallOrder = S3Module.mock.invocationCallOrder[0];
      const cloudWatchCallOrder = CloudWatchModule.mock.invocationCallOrder[0];

      // SNS and DynamoDB should be created first (no dependencies)
      expect(snsCallOrder).toBeLessThan(lambdaCallOrder);
      expect(dynamoCallOrder).toBeLessThan(lambdaCallOrder);

      // Lambda should be created before Step Functions and S3
      expect(lambdaCallOrder).toBeLessThan(stepFunctionsCallOrder);
      expect(lambdaCallOrder).toBeLessThan(s3CallOrder);

      // Step Functions and S3 should be created before CloudWatch
      expect(stepFunctionsCallOrder).toBeLessThan(cloudWatchCallOrder);
      expect(s3CallOrder).toBeLessThan(cloudWatchCallOrder);
    });

    test("should pass correct dependencies between modules", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const snsModule = SNSModule.mock.results[0].value;
      const dynamoModule = DynamoDBModule.mock.results[0].value;
      const validationLambda = LambdaModule.mock.results[0].value;
      const transformationLambda = LambdaModule.mock.results[1].value;

      // Check Step Functions receives correct ARNs
      const stepFunctionsCall = StepFunctionsModule.mock.calls[0];
      expect(stepFunctionsCall[2]).toBe(validationLambda.function.arn);
      expect(stepFunctionsCall[3]).toBe(transformationLambda.function.arn);
      expect(stepFunctionsCall[4]).toBe(dynamoModule.table.name);
      expect(stepFunctionsCall[5]).toBe(snsModule.topic.arn);

      // Check S3 receives validation Lambda ARN
      const s3Call = S3Module.mock.calls[0];
      expect(s3Call[2]).toBe(validationLambda.function.arn);

      // Check CloudWatch receives Lambda functions and SNS ARN
      const cloudWatchCall = CloudWatchModule.mock.calls[0];
      expect(cloudWatchCall[2]).toEqual([
        validationLambda.function,
        transformationLambda.function
      ]);
      expect(cloudWatchCall[3]).toBe(snsModule.topic.arn);
    });
  });

  describe("Environment Configuration", () => {
    test("should use dev as default environment suffix", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'dev/TestStack.tfstate'
        })
      );
    });

    test("should use provided environment suffix", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'staging/TestStack.tfstate'
        })
      );
    });
  });

  describe("Edge Cases and Error Scenarios", () => {
    test("should handle undefined props gracefully", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack");

      expect(stack).toBeDefined();

      // Should use default values
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestStack.tfstate',
          region: 'us-east-1'
        })
      );

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1'
        })
      );
    });

    test("should handle empty string environment suffix", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: ''
      });

      // Should use 'dev' as fallback
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'dev/TestStack.tfstate'
        })
      );
    });
  });

  describe("Complete Infrastructure Stack", () => {
    test("should create all infrastructure components", () => {
      const app = new App();
      const stack = new TapStack(app, "CompleteStackTest");

      expect(stack).toBeDefined();

      // Verify all modules are created
      expect(SNSModule).toHaveBeenCalledTimes(1);
      expect(DynamoDBModule).toHaveBeenCalledTimes(1);
      expect(LambdaModule).toHaveBeenCalledTimes(2); // validation and transformation
      expect(StepFunctionsModule).toHaveBeenCalledTimes(1);
      expect(S3Module).toHaveBeenCalledTimes(1);
      expect(CloudWatchModule).toHaveBeenCalledTimes(1);

      // Verify providers and backend
      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledTimes(1);

      // Verify Lambda permission for S3
      expect(aws.lambdaPermission.LambdaPermission).toHaveBeenCalledTimes(1);
    });
  });

  describe("Region-specific Configuration", () => {
    test("should configure resources for different regions", () => {
      const regions = ['us-west-2', 'eu-central-1', 'ap-northeast-1'];

      regions.forEach(region => {
        jest.clearAllMocks();
        const app = new App();

        new TapStack(app, "TestStack", {
          awsRegion: region
        });

        expect(AwsProvider).toHaveBeenCalledWith(
          expect.anything(),
          'aws',
          expect.objectContaining({
            region: region
          })
        );
      });
    });

    test("should handle state bucket in different region", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'eu-west-1',
        stateBucketRegion: 'us-east-1'
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-west-1'
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          region: 'us-east-1'
        })
      );
    });
  });

  describe("Lambda Configuration Details", () => {
    test("should configure Lambda functions with DLQ", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const lambdaCalls = LambdaModule.mock.calls;
      
      // Both Lambda functions should have DLQ configuration
      lambdaCalls.forEach((call: any) => {
        const config = call[2];
        const result = LambdaModule.mock.results.find(
          (r: any) => r.value.function.functionName === config.functionName
        ).value;
        
        expect(result.dlq).toBeDefined();
        expect(result.dlq.name).toBe(`${config.functionName}-dlq`);
      });
    });

    test("should configure Lambda functions with proper IAM statements", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      // Check validation Lambda IAM statements
      const validationLambdaCall = LambdaModule.mock.calls[0];
      const validationStatements = validationLambdaCall[2].iamStatements;
      
      expect(validationStatements).toContainEqual({
        actions: ['states:StartExecution'],
        resources: ['*']
      });

      // Check transformation Lambda IAM statements  
      const transformationLambdaCall = LambdaModule.mock.calls[1];
      const transformationStatements = transformationLambdaCall[2].iamStatements;
      
      expect(transformationStatements).toContainEqual({
        actions: ['s3:DeleteObject'],
        resources: ['arn:aws:s3:::*/raw/*']
      });
    });
  });
});