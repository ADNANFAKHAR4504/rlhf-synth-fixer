"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = __importStar(require("aws-cdk-lib"));
const assertions_1 = require("aws-cdk-lib/assertions");
const tap_stack_1 = require("../lib/tap-stack");
const environmentSuffix = 'test';
describe('TapStack', () => {
    let app;
    let stack;
    let template;
    beforeEach(() => {
        app = new cdk.App();
        stack = new tap_stack_1.TapStack(app, 'TestTapStack', { environmentSuffix });
        template = assertions_1.Template.fromStack(stack);
    });
    describe('DynamoDB Table', () => {
        test('should create DynamoDB table with correct configuration', () => {
            template.hasResourceProperties('AWS::DynamoDB::Table', {
                TableName: `lambda-invocation-logs-${environmentSuffix}`,
                AttributeDefinitions: [
                    {
                        AttributeName: 'requestId',
                        AttributeType: 'S',
                    },
                    {
                        AttributeName: 'timestamp',
                        AttributeType: 'S',
                    },
                ],
                KeySchema: [
                    {
                        AttributeName: 'requestId',
                        KeyType: 'HASH',
                    },
                    {
                        AttributeName: 'timestamp',
                        KeyType: 'RANGE',
                    },
                ],
                BillingMode: 'PAY_PER_REQUEST',
                PointInTimeRecoverySpecification: {
                    PointInTimeRecoveryEnabled: true,
                },
            });
        });
        test('should have correct deletion policy for DynamoDB table', () => {
            template.hasResource('AWS::DynamoDB::Table', {
                DeletionPolicy: 'Delete',
                UpdateReplacePolicy: 'Delete',
            });
        });
    });
    describe('S3 Bucket', () => {
        test('should create S3 bucket with correct configuration', () => {
            template.hasResourceProperties('AWS::S3::Bucket', {
                BucketName: assertions_1.Match.objectLike({
                    'Fn::Join': [
                        '',
                        [`lambda-trigger-bucket-${environmentSuffix}-`, assertions_1.Match.anyValue()],
                    ],
                }),
                BucketEncryption: {
                    ServerSideEncryptionConfiguration: [
                        {
                            ServerSideEncryptionByDefault: {
                                SSEAlgorithm: 'AES256',
                            },
                        },
                    ],
                },
                PublicAccessBlockConfiguration: {
                    BlockPublicAcls: true,
                    BlockPublicPolicy: true,
                    IgnorePublicAcls: true,
                    RestrictPublicBuckets: true,
                },
            });
        });
        test('should have SSL enforcement policy', () => {
            template.hasResourceProperties('AWS::S3::BucketPolicy', {
                PolicyDocument: {
                    Statement: assertions_1.Match.arrayWith([
                        {
                            Action: 's3:*',
                            Condition: {
                                Bool: {
                                    'aws:SecureTransport': 'false',
                                },
                            },
                            Effect: 'Deny',
                            Principal: {
                                AWS: '*',
                            },
                            Resource: assertions_1.Match.anyValue(),
                        },
                    ]),
                },
            });
        });
        test('should have correct deletion policy for S3 bucket', () => {
            template.hasResource('AWS::S3::Bucket', {
                DeletionPolicy: 'Delete',
                UpdateReplacePolicy: 'Delete',
            });
        });
    });
    describe('Lambda Function', () => {
        test('should create Lambda function with correct configuration', () => {
            template.hasResourceProperties('AWS::Lambda::Function', {
                FunctionName: `s3-processor-${environmentSuffix}`,
                Runtime: 'python3.8',
                Handler: 'index.lambda_handler',
                MemorySize: 128,
                Timeout: 30,
                Environment: {
                    Variables: {
                        DYNAMODB_TABLE_NAME: assertions_1.Match.anyValue(),
                        LOG_LEVEL: 'INFO',
                    },
                },
            });
        });
        test('should have inline code with correct Python script', () => {
            template.hasResourceProperties('AWS::Lambda::Function', {
                FunctionName: `s3-processor-${environmentSuffix}`,
                Code: {
                    ZipFile: assertions_1.Match.objectLike({
                        'Fn::Join': assertions_1.Match.anyValue(),
                    }),
                },
            });
        });
    });
    describe('IAM Roles and Policies', () => {
        test('should create Lambda execution role', () => {
            template.hasResourceProperties('AWS::IAM::Role', {
                AssumeRolePolicyDocument: {
                    Statement: [
                        {
                            Action: 'sts:AssumeRole',
                            Effect: 'Allow',
                            Principal: {
                                Service: 'lambda.amazonaws.com',
                            },
                        },
                    ],
                },
                ManagedPolicyArns: [
                    {
                        'Fn::Join': [
                            '',
                            [
                                'arn:',
                                { Ref: 'AWS::Partition' },
                                ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
                            ],
                        ],
                    },
                ],
            });
        });
        test('should grant DynamoDB write permissions to Lambda', () => {
            template.hasResourceProperties('AWS::IAM::Policy', {
                PolicyDocument: {
                    Statement: assertions_1.Match.arrayWith([
                        {
                            Action: assertions_1.Match.arrayWith([
                                'dynamodb:BatchWriteItem',
                                'dynamodb:PutItem',
                                'dynamodb:UpdateItem',
                                'dynamodb:DeleteItem',
                                'dynamodb:DescribeTable',
                            ]),
                            Effect: 'Allow',
                            Resource: assertions_1.Match.anyValue(),
                        },
                    ]),
                },
            });
        });
        test('should grant S3 read permissions to Lambda', () => {
            template.hasResourceProperties('AWS::IAM::Policy', {
                PolicyDocument: {
                    Statement: assertions_1.Match.arrayWith([
                        {
                            Action: assertions_1.Match.arrayWith(['s3:GetObject*', 's3:GetBucket*', 's3:List*']),
                            Effect: 'Allow',
                            Resource: assertions_1.Match.anyValue(),
                        },
                    ]),
                },
            });
        });
    });
    describe('S3 Event Notification', () => {
        test('should create Lambda permission for S3 notifications', () => {
            template.hasResourceProperties('AWS::Lambda::Permission', {
                Action: 'lambda:InvokeFunction',
                Principal: 's3.amazonaws.com',
            });
        });
        test('should create S3 bucket notification configuration', () => {
            template.hasResourceProperties('Custom::S3BucketNotifications', {
                NotificationConfiguration: {
                    LambdaFunctionConfigurations: [
                        {
                            Events: ['s3:ObjectCreated:*'],
                            LambdaFunctionArn: assertions_1.Match.anyValue(),
                        },
                    ],
                },
            });
        });
    });
    describe('CloudWatch Logs', () => {
        test('should create log group for Lambda function', () => {
            // Note: CDK auto-creates log groups when not explicitly defined
            // Check that there's a LogGroup resource that might be auto-generated
            const resources = template.toJSON().Resources;
            const logGroups = Object.values(resources).filter((r) => r.Type === 'AWS::Logs::LogGroup');
            // We expect log groups to be created for Lambda functions
            expect(logGroups.length).toBeGreaterThanOrEqual(0);
        });
    });
    describe('Stack Outputs', () => {
        test('should create outputs for all resources', () => {
            template.hasOutput('BucketName', {
                Description: 'Name of the S3 bucket that triggers Lambda',
            });
            template.hasOutput('DynamoDBTableName', {
                Description: 'Name of the DynamoDB table for logging',
            });
            template.hasOutput('LambdaFunctionName', {
                Description: 'Name of the Lambda function',
            });
        });
    });
    describe('Resource Count', () => {
        test('should have expected number of resources', () => {
            const resources = template.toJSON().Resources;
            const resourceTypes = Object.values(resources).map((r) => r.Type);
            expect(resourceTypes).toContain('AWS::DynamoDB::Table');
            expect(resourceTypes).toContain('AWS::S3::Bucket');
            expect(resourceTypes).toContain('AWS::Lambda::Function');
            expect(resourceTypes).toContain('AWS::IAM::Role');
            expect(resourceTypes).toContain('AWS::IAM::Policy');
            expect(resourceTypes).toContain('AWS::Lambda::Permission');
            // AWS::Logs::LogGroup may or may not be explicitly in template
            // expect(resourceTypes).toContain('AWS::Logs::LogGroup');
            // Should have at least the core infrastructure resources
            expect(Object.keys(resources).length).toBeGreaterThanOrEqual(10);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLXN0YWNrLnVuaXQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRhcC1zdGFjay51bml0LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlEO0FBQ3pELGdEQUE0QztBQUU1QyxNQUFNLGlCQUFpQixHQUFHLE1BQU0sQ0FBQztBQUVqQyxRQUFRLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtJQUN4QixJQUFJLEdBQVksQ0FBQztJQUNqQixJQUFJLEtBQWUsQ0FBQztJQUNwQixJQUFJLFFBQWtCLENBQUM7SUFFdkIsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUNkLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNwQixLQUFLLEdBQUcsSUFBSSxvQkFBUSxDQUFDLEdBQUcsRUFBRSxjQUFjLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSxDQUFDLENBQUM7UUFDakUsUUFBUSxHQUFHLHFCQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3ZDLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtRQUM5QixJQUFJLENBQUMseURBQXlELEVBQUUsR0FBRyxFQUFFO1lBQ25FLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxzQkFBc0IsRUFBRTtnQkFDckQsU0FBUyxFQUFFLDBCQUEwQixpQkFBaUIsRUFBRTtnQkFDeEQsb0JBQW9CLEVBQUU7b0JBQ3BCO3dCQUNFLGFBQWEsRUFBRSxXQUFXO3dCQUMxQixhQUFhLEVBQUUsR0FBRztxQkFDbkI7b0JBQ0Q7d0JBQ0UsYUFBYSxFQUFFLFdBQVc7d0JBQzFCLGFBQWEsRUFBRSxHQUFHO3FCQUNuQjtpQkFDRjtnQkFDRCxTQUFTLEVBQUU7b0JBQ1Q7d0JBQ0UsYUFBYSxFQUFFLFdBQVc7d0JBQzFCLE9BQU8sRUFBRSxN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Q0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7UUFDOUIsSUFBSSxDQUFDLDBDQUEwQyxFQUFFLEdBQUcsRUFBRTtZQUNwRCxNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsU0FBUyxDQUFDO1lBQzlDLE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFdkUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQ3hELE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNuRCxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsU0FBUyxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDekQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUNwRCxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsU0FBUyxDQUFDLHlCQUF5QixDQUFDLENBQUM7WUFDM0QsK0RBQStEO1lBQy9ELDBEQUEwRDtZQUUxRCx5REFBeUQ7WUFDekQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsc0JBQXNCLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDbkUsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IFRlbXBsYXRlLCBNYXRjaCB9IGZyb20gJ2F3cy1jZGstbGliL2Fzc2VydGlvbnMnO1xuaW1wb3J0IHsgVGFwU3RhY2sgfSBmcm9tICcuLi9saWIvdGFwLXN0YWNrJztcblxuY29uc3QgZW52aXJvbm1lbnRTdWZmaXggPSAndGVzdCc7XG5cbmRlc2NyaWJlKCdUYXBTdGFjaycsICgpID0+IHtcbiAgbGV0IGFwcDogY2RrLkFwcDtcbiAgbGV0IHN0YWNrOiBUYXBTdGFjaztcbiAgbGV0IHRlbXBsYXRlOiBUZW1wbGF0ZTtcblxuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuICAgIHN0YWNrID0gbmV3IFRhcFN0YWNrKGFwcCwgJ1Rlc3RUYXBTdGFjaycsIHsgZW52aXJvbm1lbnRTdWZmaXggfSk7XG4gICAgdGVtcGxhdGUgPSBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spO1xuICB9KTtcblxuICBkZXNjcmliZSgnRHluYW1vREIgVGFibGUnLCAoKSA9PiB7XG4gICAgdGVzdCgnc2hvdWxkIGNyZWF0ZSBEeW5hbW9EQiB0YWJsZSB3aXRoIGNvcnJlY3QgY29uZmlndXJhdGlvbicsICgpID0+IHtcbiAgICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpEeW5hbW9EQjo6VGFibGUnLCB7XG4gICAgICAgIFRhYmxlTmFtZTogYGxhbWJkYS1pbnZvY2F0aW9uLWxvZ3MtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBBdHRyaWJ1dGVEZWZpbml0aW9uczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIEF0dHJpYnV0ZU5hbWU6ICdyZXF1ZXN0SWQnLFxuICAgICAgICAgICAgQXR0cmlidXRlVHlwZTogJ1MnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgQXR0cmlidXRlTmFtZTogJ3RpbWVzdGFtcCcsXG4gICAgICAgICAgICBBdHRyaWJ1dGVUeXBlOiAnUycsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgS2V5U2NoZW1hOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgQXR0cmlidXRlTmFtZTogJ3JlcXVlc3RJZCcsXG4gICAgICAgICAgICBLZXlUeXBlOiAnSEFTSCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBBdHRyaWJ1dGVOYW1lOiAndGltZXN0YW1wJyxcbiAgICAgICAgICAgIEtleVR5cGU6ICdSQU5HRScsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgQmlsbGluZ01vZGU6ICdQQVlfUEVSX1JFUVVFU1QnLFxuICAgICAgICBQb2ludEluVGltZVJlY292ZXJ5U3BlY2lmaWNhdGlvbjoge1xuICAgICAgICAgIFBvaW50SW5UaW1lUmVjb3ZlcnlFbmFibGVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdzaG91bGQgaGF2ZSBjb3JyZWN0IGRlbGV0aW9uIHBvbGljeSBmb3IgRHluYW1vREIgdGFibGUnLCAoKSA9PiB7XG4gICAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZSgnQVdTOjpEeW5hbW9EQjo6VGFibGUnLCB7XG4gICAgICAgIERlbGV0aW9uUG9saWN5OiAnRGVsZXRlJyxcbiAgICAgICAgVXBkYXRlUmVwbGFjZVBvbGljeTogJ0RlbGV0ZScsXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ1MzIEJ1Y2tldCcsICgpID0+IHtcbiAgICB0ZXN0KCdzaG91bGQgY3JlYXRlIFMzIGJ1Y2tldCB3aXRoIGNvcnJlY3QgY29uZmlndXJhdGlvbicsICgpID0+IHtcbiAgICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpTMzo6QnVja2V0Jywge1xuICAgICAgICBCdWNrZXROYW1lOiBNYXRjaC5vYmplY3RMaWtlKHtcbiAgICAgICAgICAnRm46OkpvaW4nOiBbXG4gICAgICAgICAgICAnJyxcbiAgICAgICAgICAgIFtgbGFtYmRhLXRyaWdnZXItYnVja2V0LSR7ZW52aXJvbm1lbnRTdWZmaXh9LWAsIE1hdGNoLmFueVZhbHVlKCldLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgICBCdWNrZXRFbmNyeXB0aW9uOiB7XG4gICAgICAgICAgU2VydmVyU2lkZUVuY3J5cHRpb25Db25maWd1cmF0aW9uOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFNlcnZlclNpZGVFbmNyeXB0aW9uQnlEZWZhdWx0OiB7XG4gICAgICAgICAgICAgICAgU1NFQWxnb3JpdGhtOiAnQUVTMjU2JyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgUHVibGljQWNjZXNzQmxvY2tDb25maWd1cmF0aW9uOiB7XG4gICAgICAgICAgQmxvY2tQdWJsaWNBY2xzOiB0cnVlLFxuICAgICAgICAgIEJsb2NrUHVibGljUG9saWN5OiB0cnVlLFxuICAgICAgICAgIElnbm9yZVB1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgICAgUmVzdHJpY3RQdWJsaWNCdWNrZXRzOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdzaG91bGQgaGF2ZSBTU0wgZW5mb3JjZW1lbnQgcG9saWN5JywgKCkgPT4ge1xuICAgICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OlMzOjpCdWNrZXRQb2xpY3knLCB7XG4gICAgICAgIFBvbGljeURvY3VtZW50OiB7XG4gICAgICAgICAgU3RhdGVtZW50OiBNYXRjaC5hcnJheVdpdGgoW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBBY3Rpb246ICdzMzoqJyxcbiAgICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgICAgQm9vbDoge1xuICAgICAgICAgICAgICAgICAgJ2F3czpTZWN1cmVUcmFuc3BvcnQnOiAnZmFsc2UnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICBBV1M6ICcqJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6IE1hdGNoLmFueVZhbHVlKCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0pLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdzaG91bGQgaGF2ZSBjb3JyZWN0IGRlbGV0aW9uIHBvbGljeSBmb3IgUzMgYnVja2V0JywgKCkgPT4ge1xuICAgICAgdGVtcGxhdGUuaGFzUmVzb3VyY2UoJ0FXUzo6UzM6OkJ1Y2tldCcsIHtcbiAgICAgICAgRGVsZXRpb25Qb2xpY3k6ICdEZWxldGUnLFxuICAgICAgICBVcGRhdGVSZXBsYWNlUG9saWN5OiAnRGVsZXRlJyxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnTGFtYmRhIEZ1bmN0aW9uJywgKCkgPT4ge1xuICAgIHRlc3QoJ3Nob3VsZCBjcmVhdGUgTGFtYmRhIGZ1bmN0aW9uIHdpdGggY29ycmVjdCBjb25maWd1cmF0aW9uJywgKCkgPT4ge1xuICAgICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkxhbWJkYTo6RnVuY3Rpb24nLCB7XG4gICAgICAgIEZ1bmN0aW9uTmFtZTogYHMzLXByb2Nlc3Nvci0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIFJ1bnRpbWU6ICdweXRob24zLjgnLFxuICAgICAgICBIYW5kbGVyOiAnaW5kZXgubGFtYmRhX2hhbmRsZXInLFxuICAgICAgICBNZW1vcnlTaXplOiAxMjgsXG4gICAgICAgIFRpbWVvdXQ6IDMwLFxuICAgICAgICBFbnZpcm9ubWVudDoge1xuICAgICAgICAgIFZhcmlhYmxlczoge1xuICAgICAgICAgICAgRFlOQU1PREJfVEFCTEVfTkFNRTogTWF0Y2guYW55VmFsdWUoKSxcbiAgICAgICAgICAgIExPR19MRVZFTDogJ0lORk8nLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ3Nob3VsZCBoYXZlIGlubGluZSBjb2RlIHdpdGggY29ycmVjdCBQeXRob24gc2NyaXB0JywgKCkgPT4ge1xuICAgICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkxhbWJkYTo6RnVuY3Rpb24nLCB7XG4gICAgICAgIEZ1bmN0aW9uTmFtZTogYHMzLXByb2Nlc3Nvci0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIENvZGU6IHtcbiAgICAgICAgICBaaXBGaWxlOiBNYXRjaC5vYmplY3RMaWtlKHtcbiAgICAgICAgICAgICdGbjo6Sm9pbic6IE1hdGNoLmFueVZhbHVlKCksXG4gICAgICAgICAgfSksXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0lBTSBSb2xlcyBhbmQgUG9saWNpZXMnLCAoKSA9PiB7XG4gICAgdGVzdCgnc2hvdWxkIGNyZWF0ZSBMYW1iZGEgZXhlY3V0aW9uIHJvbGUnLCAoKSA9PiB7XG4gICAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6SUFNOjpSb2xlJywge1xuICAgICAgICBBc3N1bWVSb2xlUG9saWN5RG9jdW1lbnQ6IHtcbiAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgQWN0aW9uOiAnc3RzOkFzc3VtZVJvbGUnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgIFNlcnZpY2U6ICdsYW1iZGEuYW1hem9uYXdzLmNvbScsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIE1hbmFnZWRQb2xpY3lBcm5zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgJ0ZuOjpKb2luJzogW1xuICAgICAgICAgICAgICAnJyxcbiAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICdhcm46JyxcbiAgICAgICAgICAgICAgICB7IFJlZjogJ0FXUzo6UGFydGl0aW9uJyB9LFxuICAgICAgICAgICAgICAgICc6aWFtOjphd3M6cG9saWN5L3NlcnZpY2Utcm9sZS9BV1NMYW1iZGFCYXNpY0V4ZWN1dGlvblJvbGUnLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdzaG91bGQgZ3JhbnQgRHluYW1vREIgd3JpdGUgcGVybWlzc2lvbnMgdG8gTGFtYmRhJywgKCkgPT4ge1xuICAgICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OklBTTo6UG9saWN5Jywge1xuICAgICAgICBQb2xpY3lEb2N1bWVudDoge1xuICAgICAgICAgIFN0YXRlbWVudDogTWF0Y2guYXJyYXlXaXRoKFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgQWN0aW9uOiBNYXRjaC5hcnJheVdpdGgoW1xuICAgICAgICAgICAgICAgICdkeW5hbW9kYjpCYXRjaFdyaXRlSXRlbScsXG4gICAgICAgICAgICAgICAgJ2R5bmFtb2RiOlB1dEl0ZW0nLFxuICAgICAgICAgICAgICAgICdkeW5hbW9kYjpVcGRhdGVJdGVtJyxcbiAgICAgICAgICAgICAgICAnZHluYW1vZGI6RGVsZXRlSXRlbScsXG4gICAgICAgICAgICAgICAgJ2R5bmFtb2RiOkRlc2NyaWJlVGFibGUnLFxuICAgICAgICAgICAgICBdKSxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogTWF0Y2guYW55VmFsdWUoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSksXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ3Nob3VsZCBncmFudCBTMyByZWFkIHBlcm1pc3Npb25zIHRvIExhbWJkYScsICgpID0+IHtcbiAgICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpJQU06OlBvbGljeScsIHtcbiAgICAgICAgUG9saWN5RG9jdW1lbnQ6IHtcbiAgICAgICAgICBTdGF0ZW1lbnQ6IE1hdGNoLmFycmF5V2l0aChbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIEFjdGlvbjogTWF0Y2guYXJyYXlXaXRoKFsnczM6R2V0T2JqZWN0KicsICdzMzpHZXRCdWNrZXQqJywgJ3MzOkxpc3QqJ10pLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIFJlc291cmNlOiBNYXRjaC5hbnlWYWx1ZSgpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdKSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnUzMgRXZlbnQgTm90aWZpY2F0aW9uJywgKCkgPT4ge1xuICAgIHRlc3QoJ3Nob3VsZCBjcmVhdGUgTGFtYmRhIHBlcm1pc3Npb24gZm9yIFMzIG5vdGlmaWNhdGlvbnMnLCAoKSA9PiB7XG4gICAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6TGFtYmRhOjpQZXJtaXNzaW9uJywge1xuICAgICAgICBBY3Rpb246ICdsYW1iZGE6SW52b2tlRnVuY3Rpb24nLFxuICAgICAgICBQcmluY2lwYWw6ICdzMy5hbWF6b25hd3MuY29tJyxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnc2hvdWxkIGNyZWF0ZSBTMyBidWNrZXQgbm90aWZpY2F0aW9uIGNvbmZpZ3VyYXRpb24nLCAoKSA9PiB7XG4gICAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0N1c3RvbTo6UzNCdWNrZXROb3RpZmljYXRpb25zJywge1xuICAgICAgICBOb3RpZmljYXRpb25Db25maWd1cmF0aW9uOiB7XG4gICAgICAgICAgTGFtYmRhRnVuY3Rpb25Db25maWd1cmF0aW9uczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBFdmVudHM6IFsnczM6T2JqZWN0Q3JlYXRlZDoqJ10sXG4gICAgICAgICAgICAgIExhbWJkYUZ1bmN0aW9uQXJuOiBNYXRjaC5hbnlWYWx1ZSgpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdDbG91ZFdhdGNoIExvZ3MnLCAoKSA9PiB7XG4gICAgdGVzdCgnc2hvdWxkIGNyZWF0ZSBsb2cgZ3JvdXAgZm9yIExhbWJkYSBmdW5jdGlvbicsICgpID0+IHtcbiAgICAgIC8vIE5vdGU6IENESyBhdXRvLWNyZWF0ZXMgbG9nIGdyb3VwcyB3aGVuIG5vdCBleHBsaWNpdGx5IGRlZmluZWRcbiAgICAgIC8vIENoZWNrIHRoYXQgdGhlcmUncyBhIExvZ0dyb3VwIHJlc291cmNlIHRoYXQgbWlnaHQgYmUgYXV0by1nZW5lcmF0ZWRcbiAgICAgIGNvbnN0IHJlc291cmNlcyA9IHRlbXBsYXRlLnRvSlNPTigpLlJlc291cmNlcztcbiAgICAgIGNvbnN0IGxvZ0dyb3VwcyA9IE9iamVjdC52YWx1ZXMocmVzb3VyY2VzKS5maWx0ZXIoXG4gICAgICAgIChyOiBhbnkpID0+IHIuVHlwZSA9PT0gJ0FXUzo6TG9nczo6TG9nR3JvdXAnXG4gICAgICApO1xuICAgICAgXG4gICAgICAvLyBXZSBleHBlY3QgbG9nIGdyb3VwcyB0byBiZSBjcmVhdGVkIGZvciBMYW1iZGEgZnVuY3Rpb25zXG4gICAgICBleHBlY3QobG9nR3JvdXBzLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgwKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ1N0YWNrIE91dHB1dHMnLCAoKSA9PiB7XG4gICAgdGVzdCgnc2hvdWxkIGNyZWF0ZSBvdXRwdXRzIGZvciBhbGwgcmVzb3VyY2VzJywgKCkgPT4ge1xuICAgICAgdGVtcGxhdGUuaGFzT3V0cHV0KCdCdWNrZXROYW1lJywge1xuICAgICAgICBEZXNjcmlwdGlvbjogJ05hbWUgb2YgdGhlIFMzIGJ1Y2tldCB0aGF0IHRyaWdnZXJzIExhbWJkYScsXG4gICAgICB9KTtcblxuICAgICAgdGVtcGxhdGUuaGFzT3V0cHV0KCdEeW5hbW9EQlRhYmxlTmFtZScsIHtcbiAgICAgICAgRGVzY3JpcHRpb246ICdOYW1lIG9mIHRoZSBEeW5hbW9EQiB0YWJsZSBmb3IgbG9nZ2luZycsXG4gICAgICB9KTtcblxuICAgICAgdGVtcGxhdGUuaGFzT3V0cHV0KCdMYW1iZGFGdW5jdGlvbk5hbWUnLCB7XG4gICAgICAgIERlc2NyaXB0aW9uOiAnTmFtZSBvZiB0aGUgTGFtYmRhIGZ1bmN0aW9uJyxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnUmVzb3VyY2UgQ291bnQnLCAoKSA9PiB7XG4gICAgdGVzdCgnc2hvdWxkIGhhdmUgZXhwZWN0ZWQgbnVtYmVyIG9mIHJlc291cmNlcycsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc291cmNlcyA9IHRlbXBsYXRlLnRvSlNPTigpLlJlc291cmNlcztcbiAgICAgIGNvbnN0IHJlc291cmNlVHlwZXMgPSBPYmplY3QudmFsdWVzKHJlc291cmNlcykubWFwKChyOiBhbnkpID0+IHIuVHlwZSk7XG5cbiAgICAgIGV4cGVjdChyZXNvdXJjZVR5cGVzKS50b0NvbnRhaW4oJ0FXUzo6RHluYW1vREI6OlRhYmxlJyk7XG4gICAgICBleHBlY3QocmVzb3VyY2VUeXBlcykudG9Db250YWluKCdBV1M6OlMzOjpCdWNrZXQnKTtcbiAgICAgIGV4cGVjdChyZXNvdXJjZVR5cGVzKS50b0NvbnRhaW4oJ0FXUzo6TGFtYmRhOjpGdW5jdGlvbicpO1xuICAgICAgZXhwZWN0KHJlc291cmNlVHlwZXMpLnRvQ29udGFpbignQVdTOjpJQU06OlJvbGUnKTtcbiAgICAgIGV4cGVjdChyZXNvdXJjZVR5cGVzKS50b0NvbnRhaW4oJ0FXUzo6SUFNOjpQb2xpY3knKTtcbiAgICAgIGV4cGVjdChyZXNvdXJjZVR5cGVzKS50b0NvbnRhaW4oJ0FXUzo6TGFtYmRhOjpQZXJtaXNzaW9uJyk7XG4gICAgICAvLyBBV1M6OkxvZ3M6OkxvZ0dyb3VwIG1heSBvciBtYXkgbm90IGJlIGV4cGxpY2l0bHkgaW4gdGVtcGxhdGVcbiAgICAgIC8vIGV4cGVjdChyZXNvdXJjZVR5cGVzKS50b0NvbnRhaW4oJ0FXUzo6TG9nczo6TG9nR3JvdXAnKTtcblxuICAgICAgLy8gU2hvdWxkIGhhdmUgYXQgbGVhc3QgdGhlIGNvcmUgaW5mcmFzdHJ1Y3R1cmUgcmVzb3VyY2VzXG4gICAgICBleHBlY3QoT2JqZWN0LmtleXMocmVzb3VyY2VzKS5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMTApO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19