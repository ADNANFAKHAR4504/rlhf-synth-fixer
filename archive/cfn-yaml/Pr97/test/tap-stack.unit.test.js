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
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
describe('TapStack', () => {
    let app;
    let stack;
    let template;
    beforeEach(() => {
        app = new cdk.App();
        stack = new tap_stack_1.TapStack(app, 'TestTapStack', { environmentSuffix });
        template = assertions_1.Template.fromStack(stack);
    });
    describe('Stack Creation', () => {
        test('should create a TapStack instance', () => {
            expect(stack).toBeInstanceOf(tap_stack_1.TapStack);
            expect(stack).toBeInstanceOf(cdk.Stack);
        });
    });
    describe('Environment Suffix Logic', () => {
        test('should use environmentSuffix from props when provided', () => {
            const testApp = new cdk.App();
            const testStack = new tap_stack_1.TapStack(testApp, 'TestStackWithProps', {
                environmentSuffix: 'prod'
            });
            const testTemplate = assertions_1.Template.fromStack(testStack);
            testTemplate.hasResourceProperties('AWS::S3::Bucket', {
                BucketName: 'metadata-storage-prod',
            });
        });
        test('should use environmentSuffix from context when props not provided', () => {
            const testApp = new cdk.App();
            testApp.node.setContext('environmentSuffix', 'staging');
            const testStack = new tap_stack_1.TapStack(testApp, 'TestStackWithContext', {});
            const testTemplate = assertions_1.Template.fromStack(testStack);
            testTemplate.hasResourceProperties('AWS::S3::Bucket', {
                BucketName: 'metadata-storage-staging',
            });
        });
        test('should default to dev when no environmentSuffix provided', () => {
            const testApp = new cdk.App();
            const testStack = new tap_stack_1.TapStack(testApp, 'TestStackDefault', {});
            const testTemplate = assertions_1.Template.fromStack(testStack);
            testTemplate.hasResourceProperties('AWS::S3::Bucket', {
                BucketName: 'metadata-storage-dev',
            });
        });
        test('should prioritize props over context', () => {
            const testApp = new cdk.App();
            testApp.node.setContext('environmentSuffix', 'context-env');
            const testStack = new tap_stack_1.TapStack(testApp, 'TestStackPriority', {
                environmentSuffix: 'props-env'
            });
            const testTemplate = assertions_1.Template.fromStack(testStack);
            testTemplate.hasResourceProperties('AWS::S3::Bucket', {
                BucketName: 'metadata-storage-props-env',
            });
        });
    });
    describe('Infrastructure Resources', () => {
        test('should create S3 bucket with correct configuration', () => {
            template.hasResourceProperties('AWS::S3::Bucket', {
                BucketName: `metadata-storage-${environmentSuffix}`,
                PublicAccessBlockConfiguration: {
                    BlockPublicAcls: true,
                    BlockPublicPolicy: true,
                    IgnorePublicAcls: true,
                    RestrictPublicBuckets: true,
                },
            });
        });
        test('should create DynamoDB table with proper schema', () => {
            template.hasResourceProperties('AWS::DynamoDB::Table', {
                TableName: `metadata-processing-failures-${environmentSuffix}`,
                BillingMode: 'PAY_PER_REQUEST',
                KeySchema: [
                    {
                        AttributeName: 'executionId',
                        KeyType: 'HASH',
                    },
                    {
                        AttributeName: 'timestamp',
                        KeyType: 'RANGE',
                    },
                ],
                AttributeDefinitions: [
                    {
                        AttributeName: 'executionId',
                        AttributeType: 'S',
                    },
                    {
                        AttributeName: 'timestamp',
                        AttributeType: 'S',
                    },
                ],
                PointInTimeRecoverySpecification: {
                    PointInTimeRecoveryEnabled: true,
                },
            });
        });
        test('should create OpenSearch collection with proper configuration', () => {
            template.hasResourceProperties('AWS::OpenSearchServerless::Collection', {
                Name: `metadata-timeseries-${environmentSuffix}`,
                Type: 'TIMESERIES',
                Description: 'TimeSeries collection for metadata processing',
            });
        });
        test('should create Step Function state machine with proper configuration', () => {
            template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
                StateMachineName: `metadata-processing-${environmentSuffix}`,
            });
        });
        test('should create EventBridge rule with correct pattern', () => {
            template.hasResourceProperties('AWS::Events::Rule', {
                Name: `metadata-file-created-${environmentSuffix}`,
                State: 'ENABLED',
                EventPattern: {
                    source: ['aws.s3'],
                    'detail-type': ['Object Created'],
                    detail: {
                        object: {
                            key: [{ suffix: 'metadata.json' }],
                        },
                    },
                },
            });
        });
        test('should create CloudWatch alarm with proper configuration', () => {
            template.hasResourceProperties('AWS::CloudWatch::Alarm', {
                AlarmName: `metadata-processing-failures-${environmentSuffix}`,
                MetricName: 'ExecutionsFailed',
                Namespace: 'AWS/States',
                Statistic: 'Sum',
                Period: 60,
                EvaluationPeriods: 1,
                Threshold: 1,
                ComparisonOperator: 'GreaterThanOrEqualToThreshold',
                TreatMissingData: 'notBreaching',
            });
        });
    });
    describe('OpenSearch Security Policies', () => {
        test('should create data access policy', () => {
            template.hasResourceProperties('AWS::OpenSearchServerless::AccessPolicy', {
                Name: `metadata-data-access-${environmentSuffix}`,
                Type: 'data',
            });
        });
        test('should create network access policy', () => {
            template.hasResourceProperties('AWS::OpenSearchServerless::SecurityPolicy', {
                Name: `metadata-network-access-${environmentSuffix}`,
                Type: 'network',
            });
        });
        test('should create encryption policy', () => {
            template.hasResourceProperties('AWS::OpenSearchServerless::SecurityPolicy', {
                Name: `metadata-encryption-${environmentSuffix}`,
                Type: 'encryption',
            });
        });
    });
    describe('IAM Roles and Policies', () => {
        test('should create Step Function role', () => {
            template.hasResourceProperties('AWS::IAM::Role', {
                AssumeRolePolicyDocument: {
                    Statement: [
                        {
                            Action: 'sts:AssumeRole',
                            Effect: 'Allow',
                            Principal: {
                                Service: 'states.amazonaws.com',
                            },
                        },
                    ],
                },
            });
        });
        test('should create EventBridge role for Step Function', () => {
            template.hasResourceProperties('AWS::IAM::Role', {
                AssumeRolePolicyDocument: {
                    Statement: [
                        {
                            Action: 'sts:AssumeRole',
                            Effect: 'Allow',
                            Principal: {
                                Service: 'events.amazonaws.com',
                            },
                        },
                    ],
                },
            });
        });
        test('should grant Step Function permissions to S3', () => {
            const roles = template.findResources('AWS::IAM::Role');
            const stepFunctionRole = Object.values(roles).find(role => role.Properties?.RoleName?.includes?.('StateMachineRole') ||
                role.Properties?.AssumeRolePolicyDocument?.Statement?.[0]?.Principal?.Service === 'states.amazonaws.com');
            expect(stepFunctionRole).toBeDefined();
            expect(stepFunctionRole.Properties.Policies).toBeDefined();
            const inlinePolicy = stepFunctionRole.Properties.Policies.find((policy) => policy.PolicyName === 'StepFunctionPolicy');
            expect(inlinePolicy).toBeDefined();
            expect(inlinePolicy.PolicyDocument.Statement).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    Action: expect.arrayContaining(['s3:GetObject']),
                    Effect: 'Allow',
                }),
            ]));
        });
        test('should grant Step Function permissions to DynamoDB', () => {
            const roles = template.findResources('AWS::IAM::Role');
            const stepFunctionRole = Object.values(roles).find(role => role.Properties?.RoleName?.includes?.('StateMachineRole') ||
                role.Properties?.AssumeRolePolicyDocument?.Statement?.[0]?.Principal?.Service === 'states.amazonaws.com');
            expect(stepFunctionRole).toBeDefined();
            expect(stepFunctionRole.Properties.Policies).toBeDefined();
            const inlinePolicy = stepFunctionRole.Properties.Policies.find((policy) => policy.PolicyName === 'StepFunctionPolicy');
            expect(inlinePolicy).toBeDefined();
            expect(inlinePolicy.PolicyDocument.Statement).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    Action: expect.arrayContaining(['dynamodb:PutItem']),
                    Effect: 'Allow',
                }),
            ]));
        });
        test('should grant Step Function permissions to OpenSearch', () => {
            const roles = template.findResources('AWS::IAM::Role');
            const stepFunctionRole = Object.values(roles).find(role => role.Properties?.RoleName?.includes?.('StateMachineRole') ||
                role.Properties?.AssumeRolePolicyDocument?.Statement?.[0]?.Principal?.Service === 'states.amazonaws.com');
            expect(stepFunctionRole).toBeDefined();
            expect(stepFunctionRole.Properties.Policies).toBeDefined();
            const inlinePolicy = stepFunctionRole.Properties.Policies.find((policy) => policy.PolicyName === 'StepFunctionPolicy');
            expect(inlinePolicy).toBeDefined();
            expect(inlinePolicy.PolicyDocument.Statement).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    Action: expect.arrayContaining(['aoss:APIAccessAll']),
                    Effect: 'Allow',
                }),
            ]));
        });
    });
    describe('Resource Dependencies', () => {
        test('should have proper resource dependencies', () => {
            const collections = template.findResources('AWS::OpenSearchServerless::Collection');
            const collectionLogicalId = Object.keys(collections)[0];
            const collection = collections[collectionLogicalId];
            expect(collection.DependsOn).toContain('EncryptionPolicy');
        });
        test('should have data access policy depend on collection', () => {
            const accessPolicies = template.findResources('AWS::OpenSearchServerless::AccessPolicy');
            const dataAccessPolicyLogicalId = Object.keys(accessPolicies).find(key => accessPolicies[key].Properties.Type === 'data');
            if (dataAccessPolicyLogicalId) {
                const dataAccessPolicy = accessPolicies[dataAccessPolicyLogicalId];
                expect(dataAccessPolicy.DependsOn).toContain('OpenSearchCollection');
            }
        });
        test('should have network access policy depend on collection', () => {
            const securityPolicies = template.findResources('AWS::OpenSearchServerless::SecurityPolicy');
            const networkAccessPolicyLogicalId = Object.keys(securityPolicies).find(key => securityPolicies[key].Properties.Type === 'network');
            if (networkAccessPolicyLogicalId) {
                const networkAccessPolicy = securityPolicies[networkAccessPolicyLogicalId];
                expect(networkAccessPolicy.DependsOn).toContain('OpenSearchCollection');
            }
        });
    });
    describe('Resource Counts', () => {
        test('should have expected number of major resources', () => {
            template.resourceCountIs('AWS::S3::Bucket', 1);
            template.resourceCountIs('AWS::DynamoDB::Table', 1);
            template.resourceCountIs('AWS::OpenSearchServerless::Collection', 1);
            template.resourceCountIs('AWS::OpenSearchServerless::AccessPolicy', 1);
            template.resourceCountIs('AWS::OpenSearchServerless::SecurityPolicy', 2);
            template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
            template.resourceCountIs('AWS::Events::Rule', 1);
            template.resourceCountIs('AWS::CloudWatch::Alarm', 1);
        });
        test('should have proper number of IAM roles', () => {
            // Should have at least 2 IAM roles (Step Function + EventBridge)
            // Plus additional roles for Lambda functions created by CDK
            const roles = template.findResources('AWS::IAM::Role');
            expect(Object.keys(roles).length).toBeGreaterThanOrEqual(2);
        });
    });
    describe('Stack Outputs', () => {
        test('should have all required outputs', () => {
            template.hasOutput('MetadataBucketName', {});
            template.hasOutput('OpenSearchCollectionEndpoint', {});
            template.hasOutput('OpenSearchDashboardsUrl', {});
            template.hasOutput('FailureTableName', {});
            template.hasOutput('StateMachineArn', {});
            template.hasOutput('FailureAlarmName', {});
        });
        test('should have outputs with correct descriptions', () => {
            template.hasOutput('MetadataBucketName', {
                Description: 'Name of the S3 bucket for metadata files',
            });
            template.hasOutput('OpenSearchCollectionEndpoint', {
                Description: 'OpenSearch Serverless collection endpoint',
            });
            template.hasOutput('OpenSearchDashboardsUrl', {
                Description: 'OpenSearch Dashboards URL',
            });
            template.hasOutput('FailureTableName', {
                Description: 'Name of the DynamoDB table for failure tracking',
            });
            template.hasOutput('StateMachineArn', {
                Description: 'ARN of the Step Function state machine',
            });
            template.hasOutput('FailureAlarmName', {
                Description: 'Name of the CloudWatch alarm for failures',
            });
        });
    });
    describe('Edge Cases and Error Handling', () => {
        test('should handle undefined props gracefully', () => {
            const testApp = new cdk.App();
            const testStack = new tap_stack_1.TapStack(testApp, 'TestStackUndefined', undefined);
            const testTemplate = assertions_1.Template.fromStack(testStack);
            testTemplate.hasResourceProperties('AWS::S3::Bucket', {
                BucketName: 'metadata-storage-dev',
            });
        });
        test('should handle empty props gracefully', () => {
            const testApp = new cdk.App();
            const testStack = new tap_stack_1.TapStack(testApp, 'TestStackEmpty', {});
            const testTemplate = assertions_1.Template.fromStack(testStack);
            testTemplate.hasResourceProperties('AWS::S3::Bucket', {
                BucketName: 'metadata-storage-dev',
            });
        });
        test('should handle null environmentSuffix in props', () => {
            const testApp = new cdk.App();
            const testStack = new tap_stack_1.TapStack(testApp, 'TestStackNull', {
                environmentSuffix: undefined
            });
            const testTemplate = assertions_1.Template.fromStack(testStack);
            testTemplate.hasResourceProperties('AWS::S3::Bucket', {
                BucketName: 'metadata-storage-dev',
            });
        });
        test('should handle empty string environmentSuffix', () => {
            const testApp = new cdk.App();
            const testStack = new tap_stack_1.TapStack(testApp, 'TestStackEmpty', {
                environmentSuffix: ''
            });
            const testTemplate = assertions_1.Template.fromStack(testStack);
            testTemplate.hasResourceProperties('AWS::S3::Bucket', {
                BucketName: 'metadata-storage-dev',
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLXN0YWNrLnVuaXQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRhcC1zdGFjay51bml0LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQWtEO0FBQ2xELGdEQUE0QztBQUU1QyxNQUFNLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksS0FBSyxDQUFDO0FBRWxFLFFBQVEsQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFO0lBQ3hCLElBQUksR0FBWSxDQUFDO0lBQ2pCLElBQUksS0FBZSxDQUFDO0lBQ3BCLElBQUksUUFBa0IsQ0FBQztJQUV2QixVQUFVLENBQUMsR0FBRyxFQUFFO1FBQ2QsR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ3BCLEtBQUssR0FBRyxJQUFJLG9CQUFRLENBQUMsR0FBRyxFQUFFLGNBQWMsRUFBRSxFQUFFLGlCQUFpQixFQUFFLENBQUMsQ0FBQztRQUNqRSxRQUFRLEdBQUcscUJBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdkMsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFO1FBQzlCLElBQUksQ0FBQyxtQ0FBbUMsRUFBRSxHQUFHLEVBQUU7WUFDN0MsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLGNBQWMsQ0FBQyxvQkFBUSxDQUFDLENBQUM7WUFDdkMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUMsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQywwQkFBMEIsRUFBRSxHQUFHLEVBQUU7UUFDeEMsSUFBSSxDQUFDLHVEQUF1RCxFQUFFLEdBQUcsRUFBRTtZQUNq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QUFHLElBQUksb0JBQVEsQ0FBQyxPQUFPLEVBQUUsZUFBZSxFQUFFO2dCQUN2RCxpQkFBaUIsRUFBRSxTQUFTO2FBQzdCLENBQUMsQ0FBQztZQUNILE1BQU0sWUFBWSxHQUFHLHFCQUFRLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRW5ELFlBQVksQ0FBQyxxQkFBcUIsQ0FBQyxpQkFBaUIsRUFBRTtnQkFDcEQsVUFBVSxFQUFFLHNCQUFzQjthQUNuQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw4Q0FBOEMsRUFBRSxHQUFHLEVBQUU7WUFDeEQsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDOUIsTUFBTSxTQUFTLEdBQUcsSUFBSSxvQkFBUSxDQUFDLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRTtnQkFDeEQsaUJBQWlCLEVBQUUsRUFBRTthQUN0QixDQUFDLENBQUM7WUFDSCxNQUFNLFlBQVksR0FBRyxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUVuRCxZQUFZLENBQUMscUJBQXFCLENBQUMsaUJBQWlCLEVBQUU7Z0JBQ3BELFVBQVUsRUFBRSxzQkFBc0I7YUFDbkMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IFRlbXBsYXRlIH0gZnJvbSAnYXdzLWNkay1saWIvYXNzZXJ0aW9ucyc7XG5pbXBvcnQgeyBUYXBTdGFjayB9IGZyb20gJy4uL2xpYi90YXAtc3RhY2snO1xuXG5jb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9IHByb2Nlc3MuZW52LkVOVklST05NRU5UX1NVRkZJWCB8fCAnZGV2JztcblxuZGVzY3JpYmUoJ1RhcFN0YWNrJywgKCkgPT4ge1xuICBsZXQgYXBwOiBjZGsuQXBwO1xuICBsZXQgc3RhY2s6IFRhcFN0YWNrO1xuICBsZXQgdGVtcGxhdGU6IFRlbXBsYXRlO1xuXG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIGFwcCA9IG5ldyBjZGsuQXBwKCk7XG4gICAgc3RhY2sgPSBuZXcgVGFwU3RhY2soYXBwLCAnVGVzdFRhcFN0YWNrJywgeyBlbnZpcm9ubWVudFN1ZmZpeCB9KTtcbiAgICB0ZW1wbGF0ZSA9IFRlbXBsYXRlLmZyb21TdGFjayhzdGFjayk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdTdGFjayBDcmVhdGlvbicsICgpID0+IHtcbiAgICB0ZXN0KCdzaG91bGQgY3JlYXRlIGEgVGFwU3RhY2sgaW5zdGFuY2UnLCAoKSA9PiB7XG4gICAgICBleHBlY3Qoc3RhY2spLnRvQmVJbnN0YW5jZU9mKFRhcFN0YWNrKTtcbiAgICAgIGV4cGVjdChzdGFjaykudG9CZUluc3RhbmNlT2YoY2RrLlN0YWNrKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0Vudmlyb25tZW50IFN1ZmZpeCBMb2dpYycsICgpID0+IHtcbiAgICB0ZXN0KCdzaG91bGQgdXNlIGVudmlyb25tZW50U3VmZml4IGZyb20gcHJvcHMgd2hlbiBwcm92aWRlZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHRlc3RBcHAgPSBuZXcgY2RrLkFwcCgpO1xuICAgICAgY29uc3QgdGVzdFN0YWNrID0gbmV3IFRhcFN0YWNrKHRlc3RBcHAsICdUZXN0U3RhY2tXaXRoUHJvcHMnLCB7IFxuICAgICAgICBlbnZpcm9ubWVudFN1ZmZpeDogJ3Byb2QnIFxuICAgICAgfSk7XG4gICAgICBjb25zdCB0ZXN0VGVtcGxhdGUgPSBUZW1wbGF0ZS5mcm9tU3RhY2sodGVzdFN0YWNrKTtcblxuICAgICAgdGVzdFRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpTMzo6QnVja2V0Jywge1xuICAgICAgICBCdWNrZXROYW1lOiAnbWV0YWRhdGEtc3RvcmFnZS1wcm9kJyxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnc2hvdWxkIHVzZSBlbnZpcm9ubWVudFN1ZmZpeCBmcm9tIGNvbnRleHQgd2hlbiBwcm9wcyBub3QgcHJvdmlkZWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCB0ZXN0QXBwID0gbmV3IGNkay5BcHAoKTtcbiAgICAgIHRlc3RBcHAubm9kZS5zZXRDb250ZXh0KCdlbnZpcm9ubWVudFN1ZmZpeCcsICdzdGFnaW5nJyk7XG4gICAgICBjb25zdCB0ZXN0U3RhY2sgPSBuZXcgVGFwU3RhY2sodGVzdEFwcCwgJ1Rlc3RTdGFja1dpdGhDb250ZXh0Jywge30pO1xuICAgICAgY29uc3QgdGVzdFRlbXBsYXRlID0gVGVtcGxhdGUuZnJvbVN0YWNrKHRlc3RTdGFjayk7XG5cbiAgICAgIHRlc3RUZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6UzM6OkJ1Y2tldCcsIHtcbiAgICAgICAgQnVja2V0TmFtZTogJ21ldGFkYXRhLXN0b3JhZ2Utc3RhZ2luZycsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ3Nob3VsZCBkZWZhdWx0IHRvIGRldiB3aGVuIG5vIGVudmlyb25tZW50U3VmZml4IHByb3ZpZGVkJywgKCkgPT4ge1xuICAgICAgY29uc3QgdGVzdEFwcCA9IG5ldyBjZGsuQXBwKCk7XG4gICAgICBjb25zdCB0ZXN0U3RhY2sgPSBuZXcgVGFwU3RhY2sodGVzdEFwcCwgJ1Rlc3RTdGFja0RlZmF1bHQnLCB7fSk7XG4gICAgICBjb25zdCB0ZXN0VGVtcGxhdGUgPSBUZW1wbGF0ZS5mcm9tU3RhY2sodGVzdFN0YWNrKTtcblxuICAgICAgdGVzdFRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpTMzo6QnVja2V0Jywge1xuICAgICAgICBCdWNrZXROYW1lOiAnbWV0YWRhdGEtc3RvcmFnZS1kZXYnLFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdzaG91bGQgcHJpb3JpdGl6ZSBwcm9wcyBvdmVyIGNvbnRleHQnLCAoKSA9PiB7XG4gICAgICBjb25zdCB0ZXN0QXBwID0gbmV3IGNkay5BcHAoKTtcbiAgICAgIHRlc3RBcHAubm9kZS5zZXRDb250ZXh0KCdlbnZpcm9ubWVudFN1ZmZpeCcsICdjb250ZXh0LWVudicpO1xuICAgICAgY29uc3QgdGVzdFN0YWNrID0gbmV3IFRhcFN0YWNrKHRlc3RBcHAsICdUZXN0U3RhY2tQcmlvcml0eScsIHsgXG4gICAgICAgIGVudmlyb25tZW50U3VmZml4OiAncHJvcHMtZW52JyBcbiAgICAgIH0pO1xuICAgICAgY29uc3QgdGVzdFRlbXBsYXRlID0gVGVtcGxhdGUuZnJvbVN0YWNrKHRlc3RTdGFjayk7XG5cbiAgICAgIHRlc3RUZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6UzM6OkJ1Y2tldCcsIHtcbiAgICAgICAgQnVja2V0TmFtZTogJ21ldGFkYXRhLXN0b3JhZ2UtcHJvcHMtZW52JyxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnSW5mcmFzdHJ1Y3R1cmUgUmVzb3VyY2VzJywgKCkgPT4ge1xuICAgIHRlc3QoJ3Nob3VsZCBjcmVhdGUgUzMgYnVja2V0IHdpdGggY29ycmVjdCBjb25maWd1cmF0aW9uJywgKCkgPT4ge1xuICAgICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OlMzOjpCdWNrZXQnLCB7XG4gICAgICAgIEJ1Y2tldE5hbWU6IGBtZXRhZGF0YS1zdG9yYWdlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgUHVibGljQWNjZXNzQmxvY2tDb25maWd1cmF0aW9uOiB7XG4gICAgICAgICAgQmxvY2tQdWJsaWNBY2xzOiB0cnVlLFxuICAgICAgICAgIEJsb2NrUHVibGljUG9saWN5OiB0cnVlLFxuICAgICAgICAgIElnbm9yZVB1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgICAgUmVzdHJpY3RQdWJsaWNCdWNrZXRzOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdzaG91bGQgY3JlYXRlIER5bmFtb0RCIHRhYmxlIHdpdGggcHJvcGVyIHNjaGVtYScsICgpID0+IHtcbiAgICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpEeW5hbW9EQjo6VGFibGUnLCB7XG4gICAgICAgIFRhYmxlTmFtZTogYG1ldGFkYXRhLXByb2Nlc3NpbmctZmFpbHVyZXMtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBCaWxsaW5nTW9kZTogJ1BBWV9QRVJfUkVRVUVTVCcsXG4gICAgICAgIEtleVNjaGVtYTogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIEF0dHJpYnV0ZU5hbWU6ICdleGVjdXRpb25JZCcsXG4gICAgICAgICAgICBLZXlUeXBlOiAnSEFTSCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBBdHRyaWJ1dGVOYW1lOiAndGltZXN0YW1wJyxcbiAgICAgICAgICAgIEtleVR5cGU6ICdSQU5HRScsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgQXR0cmlidXRlRGVmaW5pdGlvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBBdHRyaWJ1dGVOYW1lOiAnZXhlY3V0aW9uSWQnLFxuICAgICAgICAgICAgQXR0cmlidXRlVHlwZTogJ1MnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgQXR0cmlidXRlTmFtZTogJ3RpbWVzdGFtcCcsXG4gICAgICAgICAgICBBdHRyaWJ1dGVUeXBlOiAnUycsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgUG9pbnRJblRpbWVSZWNvdmVyeVNwZWNpZmljYXRpb246IHtcbiAgICAgICAgICBQb2ludEluVGltZVJlY292ZXJ5RW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnc2hvdWxkIGNyZWF0ZSBPcGVuU2VhcmNoIGNvbGxlY3Rpb24gd2l0aCBwcm9wZXIgY29uZmlndXJhdGlvbicsICgpID0+IHtcbiAgICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpPcGVuU2VhcmNoU2VydmVybGVzczo6Q29sbGVjdGlvbicsIHtcbiAgICAgICAgTmFtZTogYG1ldGFkYXRhLXRpbWVzZXJpZXMtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBUeXBlOiAnVElNRVNFUklFUycsXG4gICAgICAgIERlc2NyaXB0aW9uOiAnVGltZVNlcmllcyBjb2xsZWN0aW9uIGZvciBtZXRhZGF0YSBwcm9jZXNzaW5nJyxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnc2hvdWxkIGNyZWF0ZSBTdGVwIEZ1bmN0aW9uIHN0YXRlIG1hY2hpbmUgd2l0aCBwcm9wZXIgY29uZmlndXJhdGlvbicsICgpID0+IHtcbiAgICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpTdGVwRnVuY3Rpb25zOjpTdGF0ZU1hY2hpbmUnLCB7XG4gICAgICAgIFN0YXRlTWFjaGluZU5hbWU6IGBtZXRhZGF0YS1wcm9jZXNzaW5nLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnc2hvdWxkIGNyZWF0ZSBFdmVudEJyaWRnZSBydWxlIHdpdGggY29ycmVjdCBwYXR0ZXJuJywgKCkgPT4ge1xuICAgICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkV2ZW50czo6UnVsZScsIHtcbiAgICAgICAgTmFtZTogYG1ldGFkYXRhLWZpbGUtY3JlYXRlZC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIFN0YXRlOiAnRU5BQkxFRCcsXG4gICAgICAgIEV2ZW50UGF0dGVybjoge1xuICAgICAgICAgIHNvdXJjZTogWydhd3MuczMnXSxcbiAgICAgICAgICAnZGV0YWlsLXR5cGUnOiBbJ09iamVjdCBDcmVhdGVkJ10sXG4gICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICBvYmplY3Q6IHtcbiAgICAgICAgICAgICAga2V5OiBbeyBzdWZmaXg6ICdtZXRhZGF0YS5qc29uJyB9XSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnc2hvdWxkIGNyZWF0ZSBDbG91ZFdhdGNoIGFsYXJtIHdpdGggcHJvcGVyIGNvbmZpZ3VyYXRpb24nLCAoKSA9PiB7XG4gICAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6Q2xvdWRXYXRjaDo6QWxhcm0nLCB7XG4gICAgICAgIEFsYXJtTmFtZTogYG1ldGFkYXRhLXByb2Nlc3NpbmctZmFpbHVyZXMtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBNZXRyaWNOYW1lOiAnRXhlY3V0aW9uc0ZhaWxlZCcsXG4gICAgICAgIE5hbWVzcGFjZTogJ0FXUy9TdGF0ZXMnLFxuICAgICAgICBTdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICBQZXJpb2Q6IDYwLFxuICAgICAgICBFdmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICAgICAgVGhyZXNob2xkOiAxLFxuICAgICAgICBDb21wYXJpc29uT3BlcmF0b3I6ICdHcmVhdGVyVGhhbk9yRXF1YWxUb1RocmVzaG9sZCcsXG4gICAgICAgIFRyZWF0TWlzc2luZ0RhdGE6ICdub3RCcmVhY2hpbmcnLFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdPcGVuU2VhcmNoIFNlY3VyaXR5IFBvbGljaWVzJywgKCkgPT4ge1xuICAgIHRlc3QoJ3Nob3VsZCBjcmVhdGUgZGF0YSBhY2Nlc3MgcG9saWN5JywgKCkgPT4ge1xuICAgICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6Ok9wZW5TZWFyY2hTZXJ2ZXJsZXNzOjpBY2Nlc3NQb2xpY3knLCB7XG4gICAgICAgIE5hbWU6IGBtZXRhZGF0YS1kYXRhLWFjY2Vzcy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIFR5cGU6ICdkYXRhJyxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnc2hvdWxkIGNyZWF0ZSBuZXR3b3JrIGFjY2VzcyBwb2xpY3knLCAoKSA9PiB7XG4gICAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6T3BlblNlYXJjaFNlcnZlcmxlc3M6OlNlY3VyaXR5UG9saWN5Jywge1xuICAgICAgICBOYW1lOiBgbWV0YWRhdGEtbmV0d29yay1hY2Nlc3MtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBUeXBlOiAnbmV0d29yaycsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ3Nob3VsZCBjcmVhdGUgZW5jcnlwdGlvbiBwb2xpY3knLCAoKSA9PiB7XG4gICAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6T3BlblNlYXJjaFNlcnZlcmxlc3M6OlNlY3VyaXR5UG9saWN5Jywge1xuICAgICAgICBOYW1lOiBgbWV0YWRhdGEtZW5jcnlwdGlvbi0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIFR5cGU6ICdlbmNyeXB0aW9uJyxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnSUFNIFJvbGVzIGFuZCBQb2xpY2llcycsICgpID0+IHtcbiAgICB0ZXN0KCdzaG91bGQgY3JlYXRlIFN0ZXAgRnVuY3Rpb24gcm9sZScsICgpID0+IHtcbiAgICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpJQU06OlJvbGUnLCB7XG4gICAgICAgIEFzc3VtZVJvbGVQb2xpY3lEb2N1bWVudDoge1xuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBBY3Rpb246ICdzdHM6QXNzdW1lUm9sZScsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgU2VydmljZTogJ3N0YXRlcy5hbWF6b25hd3MuY29tJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnc2hvdWxkIGNyZWF0ZSBFdmVudEJyaWRnZSByb2xlIGZvciBTdGVwIEZ1bmN0aW9uJywgKCkgPT4ge1xuICAgICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OklBTTo6Um9sZScsIHtcbiAgICAgICAgQXNzdW1lUm9sZVBvbGljeURvY3VtZW50OiB7XG4gICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIEFjdGlvbjogJ3N0czpBc3N1bWVSb2xlJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlOiAnZXZlbnRzLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdzaG91bGQgZ3JhbnQgU3RlcCBGdW5jdGlvbiBwZXJtaXNzaW9ucyB0byBTMycsICgpID0+IHtcbiAgICAgIGNvbnN0IHJvbGVzID0gdGVtcGxhdGUuZmluZFJlc291cmNlcygnQVdTOjpJQU06OlJvbGUnKTtcbiAgICAgIGNvbnN0IHN0ZXBGdW5jdGlvblJvbGUgPSBPYmplY3QudmFsdWVzKHJvbGVzKS5maW5kKHJvbGUgPT4gXG4gICAgICAgIHJvbGUuUHJvcGVydGllcz8uUm9sZU5hbWU/LmluY2x1ZGVzPy4oJ1N0YXRlTWFjaGluZVJvbGUnKSB8fFxuICAgICAgICByb2xlLlByb3BlcnRpZXM/LkFzc3VtZVJvbGVQb2xpY3lEb2N1bWVudD8uU3RhdGVtZW50Py5bMF0/LlByaW5jaXBhbD8uU2VydmljZSA9PT0gJ3N0YXRlcy5hbWF6b25hd3MuY29tJ1xuICAgICAgKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHN0ZXBGdW5jdGlvblJvbGUpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3Qoc3RlcEZ1bmN0aW9uUm9sZSEuUHJvcGVydGllcy5Qb2xpY2llcykudG9CZURlZmluZWQoKTtcbiAgICAgIFxuICAgICAgY29uc3QgaW5saW5lUG9saWN5ID0gc3RlcEZ1bmN0aW9uUm9sZSEuUHJvcGVydGllcy5Qb2xpY2llcy5maW5kKChwb2xpY3k6IGFueSkgPT4gXG4gICAgICAgIHBvbGljeS5Qb2xpY3lOYW1lID09PSAnU3RlcEZ1bmN0aW9uUG9saWN5J1xuICAgICAgKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KGlubGluZVBvbGljeSkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChpbmxpbmVQb2xpY3kuUG9saWN5RG9jdW1lbnQuU3RhdGVtZW50KS50b0VxdWFsKFxuICAgICAgICBleHBlY3QuYXJyYXlDb250YWluaW5nKFtcbiAgICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgICBBY3Rpb246IGV4cGVjdC5hcnJheUNvbnRhaW5pbmcoWydzMzpHZXRPYmplY3QnXSksXG4gICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgfSksXG4gICAgICAgIF0pXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnc2hvdWxkIGdyYW50IFN0ZXAgRnVuY3Rpb24gcGVybWlzc2lvbnMgdG8gRHluYW1vREInLCAoKSA9PiB7XG4gICAgICBjb25zdCByb2xlcyA9IHRlbXBsYXRlLmZpbmRSZXNvdXJjZXMoJ0FXUzo6SUFNOjpSb2xlJyk7XG4gICAgICBjb25zdCBzdGVwRnVuY3Rpb25Sb2xlID0gT2JqZWN0LnZhbHVlcyhyb2xlcykuZmluZChyb2xlID0+IFxuICAgICAgICByb2xlLlByb3BlcnRpZXM/LlJvbGVOYW1lPy5pbmNsdWRlcz8uKCdTdGF0ZU1hY2hpbmVSb2xlJykgfHxcbiAgICAgICAgcm9sZS5Qcm9wZXJ0aWVzPy5Bc3N1bWVSb2xlUG9saWN5RG9jdW1lbnQ/LlN0YXRlbWVudD8uWzBdPy5QcmluY2lwYWw/LlNlcnZpY2UgPT09ICdzdGF0ZXMuYW1hem9uYXdzLmNvbSdcbiAgICAgICk7XG4gICAgICBcbiAgICAgIGV4cGVjdChzdGVwRnVuY3Rpb25Sb2xlKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHN0ZXBGdW5jdGlvblJvbGUhLlByb3BlcnRpZXMuUG9saWNpZXMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBcbiAgICAgIGNvbnN0IGlubGluZVBvbGljeSA9IHN0ZXBGdW5jdGlvblJvbGUhLlByb3BlcnRpZXMuUG9saWNpZXMuZmluZCgocG9saWN5OiBhbnkpID0+IFxuICAgICAgICBwb2xpY3kuUG9saWN5TmFtZSA9PT0gJ1N0ZXBGdW5jdGlvblBvbGljeSdcbiAgICAgICk7XG4gICAgICBcbiAgICAgIGV4cGVjdChpbmxpbmVQb2xpY3kpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoaW5saW5lUG9saWN5LlBvbGljeURvY3VtZW50LlN0YXRlbWVudCkudG9FcXVhbChcbiAgICAgICAgZXhwZWN0LmFycmF5Q29udGFpbmluZyhbXG4gICAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgICAgQWN0aW9uOiBleHBlY3QuYXJyYXlDb250YWluaW5nKFsnZHluYW1vZGI6UHV0SXRlbSddKSxcbiAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICB9KSxcbiAgICAgICAgXSlcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdzaG91bGQgZ3JhbnQgU3RlcCBGdW5jdGlvbiBwZXJtaXNzaW9ucyB0byBPcGVuU2VhcmNoJywgKCkgPT4ge1xuICAgICAgY29uc3Qgcm9sZXMgPSB0ZW1wbGF0ZS5maW5kUmVzb3VyY2VzKCdBV1M6OklBTTo6Um9sZScpO1xuICAgICAgY29uc3Qgc3RlcEZ1bmN0aW9uUm9sZSA9IE9iamVjdC52YWx1ZXMocm9sZXMpLmZpbmQocm9sZSA9PiBcbiAgICAgICAgcm9sZS5Qcm9wZXJ0aWVzPy5Sb2xlTmFtZT8uaW5jbHVkZXM/LignU3RhdGVNYWNoaW5lUm9sZScpIHx8XG4gICAgICAgIHJvbGUuUHJvcGVydGllcz8uQXNzdW1lUm9sZVBvbGljeURvY3VtZW50Py5TdGF0ZW1lbnQ/LlswXT8uUHJpbmNpcGFsPy5TZXJ2aWNlID09PSAnc3RhdGVzLmFtYXpvbmF3cy5jb20nXG4gICAgICApO1xuICAgICAgXG4gICAgICBleHBlY3Qoc3RlcEZ1bmN0aW9uUm9sZSkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChzdGVwRnVuY3Rpb25Sb2xlIS5Qcm9wZXJ0aWVzLlBvbGljaWVzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgXG4gICAgICBjb25zdCBpbmxpbmVQb2xpY3kgPSBzdGVwRnVuY3Rpb25Sb2xlIS5Qcm9wZXJ0aWVzLlBvbGljaWVzLmZpbmQoKHBvbGljeTogYW55KSA9PiBcbiAgICAgICAgcG9saWN5LlBvbGljeU5hbWUgPT09ICdTdGVwRnVuY3Rpb25Qb2xpY3knXG4gICAgICApO1xuICAgICAgXG4gICAgICBleHBlY3QoaW5saW5lUG9saWN5KS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KGlubGluZVBvbGljeS5Qb2xpY3lEb2N1bWVudC5TdGF0ZW1lbnQpLnRvRXF1YWwoXG4gICAgICAgIGV4cGVjdC5hcnJheUNvbnRhaW5pbmcoW1xuICAgICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICAgIEFjdGlvbjogZXhwZWN0LmFycmF5Q29udGFpbmluZyhbJ2Fvc3M6QVBJQWNjZXNzQWxsJ10pLFxuICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgIH0pLFxuICAgICAgICBdKVxuICAgICAgKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ1Jlc291cmNlIERlcGVuZGVuY2llcycsICgpID0+IHtcbiAgICB0ZXN0KCdzaG91bGQgaGF2ZSBwcm9wZXIgcmVzb3VyY2UgZGVwZW5kZW5jaWVzJywgKCkgPT4ge1xuICAgICAgY29uc3QgY29sbGVjdGlvbnMgPSB0ZW1wbGF0ZS5maW5kUmVzb3VyY2VzKCdBV1M6Ok9wZW5TZWFyY2hTZXJ2ZXJsZXNzOjpDb2xsZWN0aW9uJyk7XG4gICAgICBjb25zdCBjb2xsZWN0aW9uTG9naWNhbElkID0gT2JqZWN0LmtleXMoY29sbGVjdGlvbnMpWzBdO1xuICAgICAgY29uc3QgY29sbGVjdGlvbiA9IGNvbGxlY3Rpb25zW2NvbGxlY3Rpb25Mb2dpY2FsSWRdO1xuICAgICAgXG4gICAgICBleHBlY3QoY29sbGVjdGlvbi5EZXBlbmRzT24pLnRvQ29udGFpbignRW5jcnlwdGlvblBvbGljeScpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnc2hvdWxkIGhhdmUgZGF0YSBhY2Nlc3MgcG9saWN5IGRlcGVuZCBvbiBjb2xsZWN0aW9uJywgKCkgPT4ge1xuICAgICAgY29uc3QgYWNjZXNzUG9saWNpZXMgPSB0ZW1wbGF0ZS5maW5kUmVzb3VyY2VzKCdBV1M6Ok9wZW5TZWFyY2hTZXJ2ZXJsZXNzOjpBY2Nlc3NQb2xpY3knKTtcbiAgICAgIGNvbnN0IGRhdGFBY2Nlc3NQb2xpY3lMb2dpY2FsSWQgPSBPYmplY3Qua2V5cyhhY2Nlc3NQb2xpY2llcykuZmluZChrZXkgPT4gXG4gICAgICAgIGFjY2Vzc1BvbGljaWVzW2tleV0uUHJvcGVydGllcy5UeXBlID09PSAnZGF0YSdcbiAgICAgICk7XG4gICAgICBcbiAgICAgIGlmIChkYXRhQWNjZXNzUG9saWN5TG9naWNhbElkKSB7XG4gICAgICAgIGNvbnN0IGRhdGFBY2Nlc3NQb2xpY3kgPSBhY2Nlc3NQb2xpY2llc1tkYXRhQWNjZXNzUG9saWN5TG9naWNhbElkXTtcbiAgICAgICAgZXhwZWN0KGRhdGFBY2Nlc3NQb2xpY3kuRGVwZW5kc09uKS50b0NvbnRhaW4oJ09wZW5TZWFyY2hDb2xsZWN0aW9uJyk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdzaG91bGQgaGF2ZSBuZXR3b3JrIGFjY2VzcyBwb2xpY3kgZGVwZW5kIG9uIGNvbGxlY3Rpb24nLCAoKSA9PiB7XG4gICAgICBjb25zdCBzZWN1cml0eVBvbGljaWVzID0gdGVtcGxhdGUuZmluZFJlc291cmNlcygnQVdTOjpPcGVuU2VhcmNoU2VydmVybGVzczo6U2VjdXJpdHlQb2xpY3knKTtcbiAgICAgIGNvbnN0IG5ldHdvcmtBY2Nlc3NQb2xpY3lMb2dpY2FsSWQgPSBPYmplY3Qua2V5cyhzZWN1cml0eVBvbGljaWVzKS5maW5kKGtleSA9PiBcbiAgICAgICAgc2VjdXJpdHlQb2xpY2llc1trZXldLlByb3BlcnRpZXMuVHlwZSA9PT0gJ25ldHdvcmsnXG4gICAgICApO1xuICAgICAgXG4gICAgICBpZiAobmV0d29ya0FjY2Vzc1BvbGljeUxvZ2ljYWxJZCkge1xuICAgICAgICBjb25zdCBuZXR3b3JrQWNjZXNzUG9saWN5ID0gc2VjdXJpdHlQb2xpY2llc1tuZXR3b3JrQWNjZXNzUG9saWN5TG9naWNhbElkXTtcbiAgICAgICAgZXhwZWN0KG5ldHdvcmtBY2Nlc3NQb2xpY3kuRGVwZW5kc09uKS50b0NvbnRhaW4oJ09wZW5TZWFyY2hDb2xsZWN0aW9uJyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdSZXNvdXJjZSBDb3VudHMnLCAoKSA9PiB7XG4gICAgdGVzdCgnc2hvdWxkIGhhdmUgZXhwZWN0ZWQgbnVtYmVyIG9mIG1ham9yIHJlc291cmNlcycsICgpID0+IHtcbiAgICAgIHRlbXBsYXRlLnJlc291cmNlQ291bnRJcygnQVdTOjpTMzo6QnVja2V0JywgMSk7XG4gICAgICB0ZW1wbGF0ZS5yZXNvdXJjZUNvdW50SXMoJ0FXUzo6RHluYW1vREI6OlRhYmxlJywgMSk7XG4gICAgICB0ZW1wbGF0ZS5yZXNvdXJjZUNvdW50SXMoJ0FXUzo6T3BlblNlYXJjaFNlcnZlcmxlc3M6OkNvbGxlY3Rpb24nLCAxKTtcbiAgICAgIHRlbXBsYXRlLnJlc291cmNlQ291bnRJcygnQVdTOjpPcGVuU2VhcmNoU2VydmVybGVzczo6QWNjZXNzUG9saWN5JywgMSk7XG4gICAgICB0ZW1wbGF0ZS5yZXNvdXJjZUNvdW50SXMoJ0FXUzo6T3BlblNlYXJjaFNlcnZlcmxlc3M6OlNlY3VyaXR5UG9saWN5JywgMik7XG4gICAgICB0ZW1wbGF0ZS5yZXNvdXJjZUNvdW50SXMoJ0FXUzo6U3RlcEZ1bmN0aW9uczo6U3RhdGVNYWNoaW5lJywgMSk7XG4gICAgICB0ZW1wbGF0ZS5yZXNvdXJjZUNvdW50SXMoJ0FXUzo6RXZlbnRzOjpSdWxlJywgMSk7XG4gICAgICB0ZW1wbGF0ZS5yZXNvdXJjZUNvdW50SXMoJ0FXUzo6Q2xvdWRXYXRjaDo6QWxhcm0nLCAxKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ3Nob3VsZCBoYXZlIHByb3BlciBudW1iZXIgb2YgSUFNIHJvbGVzJywgKCkgPT4ge1xuICAgICAgLy8gU2hvdWxkIGhhdmUgYXQgbGVhc3QgMiBJQU0gcm9sZXMgKFN0ZXAgRnVuY3Rpb24gKyBFdmVudEJyaWRnZSlcbiAgICAgIC8vIFBsdXMgYWRkaXRpb25hbCByb2xlcyBmb3IgTGFtYmRhIGZ1bmN0aW9ucyBjcmVhdGVkIGJ5IENES1xuICAgICAgY29uc3Qgcm9sZXMgPSB0ZW1wbGF0ZS5maW5kUmVzb3VyY2VzKCdBV1M6OklBTTo6Um9sZScpO1xuICAgICAgZXhwZWN0KE9iamVjdC5rZXlzKHJvbGVzKS5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMik7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdTdGFjayBPdXRwdXRzJywgKCkgPT4ge1xuICAgIHRlc3QoJ3Nob3VsZCBoYXZlIGFsbCByZXF1aXJlZCBvdXRwdXRzJywgKCkgPT4ge1xuICAgICAgdGVtcGxhdGUuaGFzT3V0cHV0KCdNZXRhZGF0YUJ1Y2tldE5hbWUnLCB7fSk7XG4gICAgICB0ZW1wbGF0ZS5oYXNPdXRwdXQoJ09wZW5TZWFyY2hDb2xsZWN0aW9uRW5kcG9pbnQnLCB7fSk7XG4gICAgICB0ZW1wbGF0ZS5oYXNPdXRwdXQoJ09wZW5TZWFyY2hEYXNoYm9hcmRzVXJsJywge30pO1xuICAgICAgdGVtcGxhdGUuaGFzT3V0cHV0KCdGYWlsdXJlVGFibGVOYW1lJywge30pO1xuICAgICAgdGVtcGxhdGUuaGFzT3V0cHV0KCdTdGF0ZU1hY2hpbmVBcm4nLCB7fSk7XG4gICAgICB0ZW1wbGF0ZS5oYXNPdXRwdXQoJ0ZhaWx1cmVBbGFybU5hbWUnLCB7fSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdzaG91bGQgaGF2ZSBvdXRwdXRzIHdpdGggY29ycmVjdCBkZXNjcmlwdGlvbnMnLCAoKSA9PiB7XG4gICAgICB0ZW1wbGF0ZS5oYXNPdXRwdXQoJ01ldGFkYXRhQnVja2V0TmFtZScsIHtcbiAgICAgICAgRGVzY3JpcHRpb246ICdOYW1lIG9mIHRoZSBTMyBidWNrZXQgZm9yIG1ldGFkYXRhIGZpbGVzJyxcbiAgICAgIH0pO1xuICAgICAgdGVtcGxhdGUuaGFzT3V0cHV0KCdPcGVuU2VhcmNoQ29sbGVjdGlvbkVuZHBvaW50Jywge1xuICAgICAgICBEZXNjcmlwdGlvbjogJ09wZW5TZWFyY2ggU2VydmVybGVzcyBjb2xsZWN0aW9uIGVuZHBvaW50JyxcbiAgICAgIH0pO1xuICAgICAgdGVtcGxhdGUuaGFzT3V0cHV0KCdPcGVuU2VhcmNoRGFzaGJvYXJkc1VybCcsIHtcbiAgICAgICAgRGVzY3JpcHRpb246ICdPcGVuU2VhcmNoIERhc2hib2FyZHMgVVJMJyxcbiAgICAgIH0pO1xuICAgICAgdGVtcGxhdGUuaGFzT3V0cHV0KCdGYWlsdXJlVGFibGVOYW1lJywge1xuICAgICAgICBEZXNjcmlwdGlvbjogJ05hbWUgb2YgdGhlIER5bmFtb0RCIHRhYmxlIGZvciBmYWlsdXJlIHRyYWNraW5nJyxcbiAgICAgIH0pO1xuICAgICAgdGVtcGxhdGUuaGFzT3V0cHV0KCdTdGF0ZU1hY2hpbmVBcm4nLCB7XG4gICAgICAgIERlc2NyaXB0aW9uOiAnQVJOIG9mIHRoZSBTdGVwIEZ1bmN0aW9uIHN0YXRlIG1hY2hpbmUnLFxuICAgICAgfSk7XG4gICAgICB0ZW1wbGF0ZS5oYXNPdXRwdXQoJ0ZhaWx1cmVBbGFybU5hbWUnLCB7XG4gICAgICAgIERlc2NyaXB0aW9uOiAnTmFtZSBvZiB0aGUgQ2xvdWRXYXRjaCBhbGFybSBmb3IgZmFpbHVyZXMnLFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdFZGdlIENhc2VzIGFuZCBFcnJvciBIYW5kbGluZycsICgpID0+IHtcbiAgICB0ZXN0KCdzaG91bGQgaGFuZGxlIHVuZGVmaW5lZCBwcm9wcyBncmFjZWZ1bGx5JywgKCkgPT4ge1xuICAgICAgY29uc3QgdGVzdEFwcCA9IG5ldyBjZGsuQXBwKCk7XG4gICAgICBjb25zdCB0ZXN0U3RhY2sgPSBuZXcgVGFwU3RhY2sodGVzdEFwcCwgJ1Rlc3RTdGFja1VuZGVmaW5lZCcsIHVuZGVmaW5lZCk7XG4gICAgICBjb25zdCB0ZXN0VGVtcGxhdGUgPSBUZW1wbGF0ZS5mcm9tU3RhY2sodGVzdFN0YWNrKTtcblxuICAgICAgdGVzdFRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpTMzo6QnVja2V0Jywge1xuICAgICAgICBCdWNrZXROYW1lOiAnbWV0YWRhdGEtc3RvcmFnZS1kZXYnLFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdzaG91bGQgaGFuZGxlIGVtcHR5IHByb3BzIGdyYWNlZnVsbHknLCAoKSA9PiB7XG4gICAgICBjb25zdCB0ZXN0QXBwID0gbmV3IGNkay5BcHAoKTtcbiAgICAgIGNvbnN0IHRlc3RTdGFjayA9IG5ldyBUYXBTdGFjayh0ZXN0QXBwLCAnVGVzdFN0YWNrRW1wdHknLCB7fSk7XG4gICAgICBjb25zdCB0ZXN0VGVtcGxhdGUgPSBUZW1wbGF0ZS5mcm9tU3RhY2sodGVzdFN0YWNrKTtcblxuICAgICAgdGVzdFRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpTMzo6QnVja2V0Jywge1xuICAgICAgICBCdWNrZXROYW1lOiAnbWV0YWRhdGEtc3RvcmFnZS1kZXYnLFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdzaG91bGQgaGFuZGxlIG51bGwgZW52aXJvbm1lbnRTdWZmaXggaW4gcHJvcHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCB0ZXN0QXBwID0gbmV3IGNkay5BcHAoKTtcbiAgICAgIGNvbnN0IHRlc3RTdGFjayA9IG5ldyBUYXBTdGFjayh0ZXN0QXBwLCAnVGVzdFN0YWNrTnVsbCcsIHsgXG4gICAgICAgIGVudmlyb25tZW50U3VmZml4OiB1bmRlZmluZWQgXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IHRlc3RUZW1wbGF0ZSA9IFRlbXBsYXRlLmZyb21TdGFjayh0ZXN0U3RhY2spO1xuXG4gICAgICB0ZXN0VGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OlMzOjpCdWNrZXQnLCB7XG4gICAgICAgIEJ1Y2tldE5hbWU6ICdtZXRhZGF0YS1zdG9yYWdlLWRldicsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ3Nob3VsZCBoYW5kbGUgZW1wdHkgc3RyaW5nIGVudmlyb25tZW50U3VmZml4JywgKCkgPT4ge1xuICAgICAgY29uc3QgdGVzdEFwcCA9IG5ldyBjZGsuQXBwKCk7XG4gICAgICBjb25zdCB0ZXN0U3RhY2sgPSBuZXcgVGFwU3RhY2sodGVzdEFwcCwgJ1Rlc3RTdGFja0VtcHR5JywgeyBcbiAgICAgICAgZW52aXJvbm1lbnRTdWZmaXg6ICcnIFxuICAgICAgfSk7XG4gICAgICBjb25zdCB0ZXN0VGVtcGxhdGUgPSBUZW1wbGF0ZS5mcm9tU3RhY2sodGVzdFN0YWNrKTtcblxuICAgICAgdGVzdFRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpTMzo6QnVja2V0Jywge1xuICAgICAgICBCdWNrZXROYW1lOiAnbWV0YWRhdGEtc3RvcmFnZS1kZXYnLFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXX0=