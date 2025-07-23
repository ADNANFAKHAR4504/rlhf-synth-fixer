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
exports.TapStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const cloudwatch = __importStar(require("aws-cdk-lib/aws-cloudwatch"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const events = __importStar(require("aws-cdk-lib/aws-events"));
const targets = __importStar(require("aws-cdk-lib/aws-events-targets"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const opensearchserverless = __importStar(require("aws-cdk-lib/aws-opensearchserverless"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const sfn = __importStar(require("aws-cdk-lib/aws-stepfunctions"));
const tasks = __importStar(require("aws-cdk-lib/aws-stepfunctions-tasks"));
class TapStack extends cdk.Stack {
    // Add private property for metadataBucket
    metadataBucket;
    config = {
        retryAttempts: 3,
        timeoutSeconds: 900,
        alarmEvaluationPeriods: 1,
    };
    constructor(scope, id, props) {
        super(scope, id, props);
        const environmentSuffix = this.getEnvironmentSuffix(props);
        // Initialize metadataBucket in constructor
        this.metadataBucket = new s3.Bucket(this, 'MetadataBucket', {
            bucketName: `metadata-storage-${environmentSuffix}`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            eventBridgeEnabled: true,
            versioned: false,
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        });
        // Storage Layer
        const failureTable = this.createFailureTable(environmentSuffix);
        // Analytics Layer
        const opensearchCollection = this.createOpenSearchCollection(environmentSuffix);
        const { dataAccessPolicy, networkAccessPolicy, encryptionPolicy } = this.createOpenSearchPolicies(environmentSuffix, opensearchCollection);
        // Processing Layer
        const stateMachine = this.createStateMachine(environmentSuffix, this.metadataBucket, opensearchCollection, failureTable);
        // Monitoring Layer
        this.createMonitoringDashboard(environmentSuffix, stateMachine, failureTable, opensearchCollection);
        const alarms = this.createAlarms(environmentSuffix, stateMachine, failureTable, opensearchCollection);
        // Event Rules
        this.createEventRules(environmentSuffix, this.metadataBucket, stateMachine);
        // Resource Dependencies
        this.setupDependencies(opensearchCollection, dataAccessPolicy, networkAccessPolicy, encryptionPolicy);
        // Stack Outputs
        this.createOutputs(this.metadataBucket, failureTable, opensearchCollection, stateMachine, alarms);
    }
    getEnvironmentSuffix(props) {
        return props?.environmentSuffix && props.environmentSuffix !== ''
            ? props.environmentSuffix
            : this.node.tryGetContext('environmentSuffix') || 'dev';
    }
    createFailureTable(environmentSuffix) {
        const table = new dynamodb.Table(this, 'FailureTable', {
            tableName: `metadata-processing-failures-${environmentSuffix}`,
            partitionKey: {
                name: 'executionId',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            pointInTimeRecovery: true,
        });
        // Output will be created in createOutputs method
        return table;
    }
    createOpenSearchCollection(environmentSuffix) {
        const collection = new opensearchserverless.CfnCollection(this, 'OpenSearchCollection', {
            name: `metadata-timeseries-${environmentSuffix}`,
            type: 'TIMESERIES',
            description: 'TimeSeries collection for metadata processing',
        });
        // Outputs will be created in createOutputs method
        return collection;
    }
    createOpenSearchPolicies(environmentSuffix, collection) {
        // Data access policy for OpenSearch Serverless
        const dataAccessPolicy = new opensearchserverless.CfnAccessPolicy(this, 'DataAccessPolicy', {
            name: `metadata-data-access-${environmentSuffix}`,
            type: 'data',
            policy: JSON.stringify([
                {
                    Rules: [
                        {
                            Resource: [`collection/${collection.name}`],
                            Permission: [
                                'aoss:CreateCollectionItems',
                                'aoss:DeleteCollectionItems',
                                'aoss:UpdateCollectionItems',
                                'aoss:DescribeCollectionItems',
                            ],
                            ResourceType: 'collection',
                        },
                        {
                            Resource: [`index/${collection.name}/*`],
                            Permission: [
                                'aoss:CreateIndex',
                                'aoss:DeleteIndex',
                                'aoss:UpdateIndex',
                                'aoss:DescribeIndex',
                                'aoss:ReadDocument',
                                'aoss:WriteDocument',
                            ],
                            ResourceType: 'index',
                        },
                    ],
                    Principal: [`arn:aws:iam::${this.account}:root`],
                },
            ]),
        });
        // Network access policy for OpenSearch Serverless (public access)
        const networkAccessPolicy = new opensearchserverless.CfnSecurityPolicy(this, 'NetworkAccessPolicy', {
            name: `metadata-network-access-${environmentSuffix}`,
            type: 'network',
            policy: JSON.stringify([
                {
                    Description: 'Public access to OpenSearch dashboards',
                    Rules: [
                        {
                            ResourceType: 'dashboard',
                            Resource: [`collection/${collection.name}`],
                        },
                        {
                            ResourceType: 'collection',
                            Resource: [`collection/${collection.name}`],
                        },
                    ],
                    AllowFromPublic: true,
                },
            ]),
        });
        // Encryption policy for OpenSearch Serverless
        const encryptionPolicy = new opensearchserverless.CfnSecurityPolicy(this, 'EncryptionPolicy', {
            name: `metadata-encryption-${environmentSuffix}`,
            type: 'encryption',
            policy: JSON.stringify({
                Rules: [
                    {
                        Resource: [`collection/${collection.name}`],
                        ResourceType: 'collection',
                    },
                ],
                AWSOwnedKey: true,
            }),
        });
        return { dataAccessPolicy, networkAccessPolicy, encryptionPolicy };
    }
    createStateMachine(environmentSuffix, metadataBucket, opensearchCollection, failureTable) {
        // IAM role for Step Functions
        const stepFunctionRole = this.createStateMachineRole(metadataBucket, opensearchCollection, failureTable);
        // Step Function definition
        const getS3Object = new tasks.CallAwsService(this, 'GetS3Object', {
            service: 's3',
            action: 'getObject',
            parameters: {
                'Bucket.$': '$.detail.bucket.name',
                'Key.$': '$.detail.object.key',
            },
            iamResources: [metadataBucket.arnForObjects('*')],
            resultPath: '$.s3Result',
        });
        const addTimestamp = new sfn.Pass(this, 'AddTimestamp', {
            parameters: {
                '@timestamp': sfn.JsonPath.stringAt('$$.State.EnteredTime'),
                'metadata.$': 'States.StringToJson($.s3Result.Body)',
                'bucket.$': '$.detail.bucket.name',
                'key.$': '$.detail.object.key',
            },
            resultPath: '$.processedData',
        });
        // Store document in OpenSearch with proper HTTP request
        const putToOpenSearch = new tasks.CallAwsService(this, 'PutToOpenSearch', {
            service: 'opensearchserverless',
            action: 'index',
            parameters: {
                Index: 'metadata-index',
                'Body.$': '$.processedData',
                'Id.$': 'States.UUID()',
            },
            iamResources: [opensearchCollection.attrArn],
            resultPath: '$.opensearchResult',
        });
        const logFailure = new tasks.DynamoPutItem(this, 'LogFailure', {
            table: failureTable,
            item: {
                executionId: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$$.Execution.Name')),
                timestamp: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$$.State.EnteredTime')),
                inputData: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$$.Execution.Input')),
                errorCause: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.Error.Cause')),
                errorMessage: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.Error.Error')),
                stateName: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$$.State.Name')),
                executionArn: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$$.Execution.RoleArn')),
            },
        });
        const processingFailed = new sfn.Fail(this, 'ProcessingFailed', {
            cause: 'Metadata processing failed',
        });
        // Add retry logic to individual steps
        const processMetadataDefinition = getS3Object
            .addRetry({
            errors: ['States.TaskFailed', 'States.ExecutionLimitExceeded'],
            interval: cdk.Duration.seconds(2),
            maxAttempts: 3,
            backoffRate: 2.0,
        })
            .next(addTimestamp)
            .next(putToOpenSearch.addRetry({
            errors: ['States.TaskFailed'],
            interval: cdk.Duration.seconds(5),
            maxAttempts: 3,
            backoffRate: 2.0,
        }));
        const failureChain = logFailure.next(processingFailed);
        const processMetadataWithCatch = new sfn.Parallel(this, 'ProcessMetadataWithCatch')
            .branch(processMetadataDefinition)
            .addCatch(failureChain, {
            errors: ['States.ALL'],
            resultPath: '$.Error',
        });
        // Step Function state machine
        const stateMachine = new sfn.StateMachine(this, 'MetadataProcessingStateMachine', {
            stateMachineName: `metadata-processing-${environmentSuffix}`,
            definition: processMetadataWithCatch,
            role: stepFunctionRole,
            timeout: cdk.Duration.minutes(15),
        });
        // Output will be created in createOutputs method
        return stateMachine;
    }
    createStateMachineRole(metadataBucket, opensearchCollection, failureTable) {
        return new iam.Role(this, 'StateMachineRole', {
            assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
            inlinePolicies: {
                StepFunctionPolicy: new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: ['s3:GetObject', 's3:GetObjectVersion'],
                            resources: [metadataBucket.arnForObjects('*')],
                        }),
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: [
                                'dynamodb:PutItem',
                                'dynamodb:GetItem',
                                'dynamodb:UpdateItem',
                            ],
                            resources: [failureTable.tableArn],
                        }),
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: [
                                'aoss:APIAccessAll',
                                'aoss:WriteDocument',
                                'aoss:CreateIndex',
                            ],
                            resources: [
                                opensearchCollection.attrArn,
                                `${opensearchCollection.attrArn}/*`,
                            ],
                        }),
                    ],
                }),
            },
        });
    }
    createMonitoringDashboard(environmentSuffix, stateMachine, failureTable, _opensearchCollection) {
        // CloudWatch Dashboard for monitoring
        new cloudwatch.Dashboard(this, 'MonitoringDashboard', {
            dashboardName: `metadata-processing-dashboard-${environmentSuffix}`,
            widgets: [
                [
                    new cloudwatch.GraphWidget({
                        title: 'Step Function Executions',
                        left: [
                            stateMachine.metricStarted(),
                            stateMachine.metricSucceeded(),
                            stateMachine.metricFailed(),
                        ],
                        width: 12,
                    }),
                ],
                [
                    new cloudwatch.GraphWidget({
                        title: 'DynamoDB Failure Table Operations',
                        left: [
                            failureTable.metricConsumedReadCapacityUnits(),
                            failureTable.metricConsumedWriteCapacityUnits(),
                        ],
                        width: 12,
                    }),
                ],
            ],
        });
    }
    createAlarms(environmentSuffix, stateMachine, _failureTable, _opensearchCollection) {
        // CloudWatch alarm for Step Function failures
        const failureAlarm = new cloudwatch.Alarm(this, 'StateMachineFailureAlarm', {
            alarmName: `metadata-processing-failures-${environmentSuffix}`,
            alarmDescription: 'Alarm for Step Function execution failures',
            metric: stateMachine.metricFailed({
                period: cdk.Duration.minutes(1),
            }),
            threshold: 1,
            evaluationPeriods: 1,
            treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        });
        // Output will be created in createOutputs method
        return [failureAlarm];
    }
    createEventRules(environmentSuffix, metadataBucket, stateMachine) {
        // EventBridge rule for S3 object creation events
        const eventRule = new events.Rule(this, 'MetadataFileRule', {
            ruleName: `metadata-file-created-${environmentSuffix}`,
            eventPattern: {
                source: ['aws.s3'],
                detailType: ['Object Created'],
                detail: {
                    bucket: {
                        name: [metadataBucket.bucketName],
                    },
                    object: {
                        key: [{ suffix: 'metadata.json' }],
                    },
                },
            },
        });
        // Add Step Function as target for EventBridge rule
        eventRule.addTarget(new targets.SfnStateMachine(stateMachine));
    }
    setupDependencies(opensearchCollection, dataAccessPolicy, networkAccessPolicy, encryptionPolicy) {
        // Add dependencies
        opensearchCollection.addDependency(encryptionPolicy);
        dataAccessPolicy.addDependency(opensearchCollection);
        networkAccessPolicy.addDependency(opensearchCollection);
    }
    createOutputs(metadataBucket, failureTable, opensearchCollection, stateMachine, alarms) {
        // Outputs
        new cdk.CfnOutput(this, 'MetadataBucketName', {
            value: metadataBucket.bucketName,
            description: 'Name of the S3 bucket for metadata files',
        });
        new cdk.CfnOutput(this, 'OpenSearchCollectionEndpoint', {
            value: opensearchCollection.attrCollectionEndpoint,
            description: 'OpenSearch Serverless collection endpoint',
        });
        new cdk.CfnOutput(this, 'OpenSearchDashboardsUrl', {
            value: opensearchCollection.attrDashboardEndpoint,
            description: 'OpenSearch Dashboards URL',
        });
        new cdk.CfnOutput(this, 'FailureTableName', {
            value: failureTable.tableName,
            description: 'Name of the DynamoDB table for failure tracking',
        });
        new cdk.CfnOutput(this, 'StateMachineArn', {
            value: stateMachine.stateMachineArn,
            description: 'ARN of the Step Function state machine',
        });
        new cdk.CfnOutput(this, 'FailureAlarmName', {
            value: alarms[0].alarmName,
            description: 'Name of the CloudWatch alarm for failures',
        });
    }
}
exports.TapStack = TapStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1RUFBeUQ7QUFDekQsbUVBQXFEO0FBQ3JELCtEQUFpRDtBQUNqRCx3RUFBMEQ7QUFDMUQseURBQTJDO0FBQzNDLDJGQUE2RTtBQUM3RSx1REFBeUM7QUFDekMsbUVBQXFEO0FBQ3JELDJFQUE2RDtBQWE3RCxNQUFhLFFBQVMsU0FBUSxHQUFHLENBQUMsS0FBSztJQUNyQywwQ0FBMEM7SUFDekIsY0FBYyxDQUFZO0lBRTFCLE1BQU0sR0FBNkI7UUFDbEQsYUFBYSxFQUFFLENBQUM7UUFDaEIsY0FBYyxFQUFFLEdBQUc7UUFDbkIsc0JBQXNCLEVBQUUsQ0FBQztLQUMxQixDQUFDO0lBRUYsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFxQjtRQUM3RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUUzRCwyQ0FBMkM7UUFDM0MsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1lBQzFELFVBQVUsRUFBRSxvQkFBb0IsaUJBQWlCLEVBQUU7WUFDbkQsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztZQUN4QyxpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLGtCQUFrQixFQUFFLElBQUk7WUFDeEIsU0FBUyxFQUFFLEtBQUs7WUFDaEIsZ0JBQWdCLEVBQUUsS0FBSztZQUN2QixpQkFBaUIsRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsU0FBUztTQUNsRCxDQUFDLENBQUM7UUFFSCxnQkFBZ0I7UUFD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RCxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLDhCQUE4QixFQUFFO1lBQ3RELEtBQUssRUFBRSxvQkFBb0IsQ0FBQyxzQkFBc0I7WUFDbEQsV0FBVyxFQUFFLDJDQUEyQztTQUN6RCxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLHlCQUF5QixFQUFFO1lBQ2pELEtBQUssRUFBRSxvQkFBb0IsQ0FBQyxxQkFBcUI7WUFDakQsV0FBVyxFQUFFLDJCQUEyQjtTQUN6QyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQzFDLEtBQUssRUFBRSxZQUFZLENBQUMsU0FBUztZQUM3QixXQUFXLEVBQUUsaURBQWlEO1NBQy9ELENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDekMsS0FBSyxFQUFFLFlBQVksQ0FBQyxlQUFlO1lBQ25DLFdBQVcsRUFBRSx3Q0FBd0M7U0FDdEQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUMxQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVM7WUFDMUIsV0FBVyxFQUFFLDJDQUEyQztTQUN6RCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFwZ0JELDRCQW9nQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgY2xvdWR3YXRjaCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaCc7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMnO1xuaW1wb3J0ICogYXMgdGFyZ2V0cyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZXZlbnRzLXRhcmdldHMnO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgb3BlbnNlYXJjaHNlcnZlcmxlc3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLW9wZW5zZWFyY2hzZXJ2ZXJsZXNzJztcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgKiBhcyBzZm4gZnJvbSAnYXdzLWNkay1saWIvYXdzLXN0ZXBmdW5jdGlvbnMnO1xuaW1wb3J0ICogYXMgdGFza3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLXN0ZXBmdW5jdGlvbnMtdGFza3MnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmludGVyZmFjZSBUYXBTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xuICBlbnZpcm9ubWVudFN1ZmZpeD86IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIE1ldGFkYXRhUHJvY2Vzc2luZ0NvbmZpZyB7XG4gIHJldHJ5QXR0ZW1wdHM6IG51bWJlcjtcbiAgdGltZW91dFNlY29uZHM6IG51bWJlcjtcbiAgYWxhcm1FdmFsdWF0aW9uUGVyaW9kczogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgVGFwU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICAvLyBBZGQgcHJpdmF0ZSBwcm9wZXJ0eSBmb3IgbWV0YWRhdGFCdWNrZXRcbiAgcHJpdmF0ZSByZWFkb25seSBtZXRhZGF0YUJ1Y2tldDogczMuQnVja2V0O1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgY29uZmlnOiBNZXRhZGF0YVByb2Nlc3NpbmdDb25maWcgPSB7XG4gICAgcmV0cnlBdHRlbXB0czogMyxcbiAgICB0aW1lb3V0U2Vjb25kczogOTAwLFxuICAgIGFsYXJtRXZhbHVhdGlvblBlcmlvZHM6IDEsXG4gIH07XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBUYXBTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9IHRoaXMuZ2V0RW52aXJvbm1lbnRTdWZmaXgocHJvcHMpO1xuXG4gICAgLy8gSW5pdGlhbGl6ZSBtZXRhZGF0YUJ1Y2tldCBpbiBjb25zdHJ1Y3RvclxuICAgIHRoaXMubWV0YWRhdGFCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdNZXRhZGF0YUJ1Y2tldCcsIHtcbiAgICAgIGJ1Y2tldE5hbWU6IGBtZXRhZGF0YS1zdG9yYWdlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICBhdXRvRGVsZXRlT2JqZWN0czogdHJ1ZSxcbiAgICAgIGV2ZW50QnJpZGdlRW5hYmxlZDogdHJ1ZSxcbiAgICAgIHZlcnNpb25lZDogZmFsc2UsXG4gICAgICBwdWJsaWNSZWFkQWNjZXNzOiBmYWxzZSxcbiAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTEwsXG4gICAgfSk7XG5cbiAgICAvLyBTdG9yYWdlIExheWVyXG4gICAgY29uc3QgZmFpbHVyZVRhYmxlID0gdGhpcy5jcmVhdGVGYWlsdXJlVGFibGUoZW52aXJvbm1lbnRTdWZmaXgpO1xuXG4gICAgLy8gQW5hbHl0aWNzIExheWVyXG4gICAgY29uc3Qgb3BlbnNlYXJjaENvbGxlY3Rpb24gPVxuICAgICAgdGhpcy5jcmVhdGVPcGVuU2VhcmNoQ29sbGVjdGlvbihlbnZpcm9ubWVudFN1ZmZpeCk7XG4gICAgY29uc3QgeyBkYXRhQWNjZXNzUG9saWN5LCBuZXR3b3JrQWNjZXNzUG9saWN5LCBlbmNyeXB0aW9uUG9saWN5IH0gPVxuICAgICAgdGhpcy5jcmVhdGVPcGVuU2VhcmNoUG9saWNpZXMoZW52aXJvbm1lbnRTdWZmaXgsIG9wZW5zZWFyY2hDb2xsZWN0aW9uKTtcblxuICAgIC8vIFByb2Nlc3NpbmcgTGF5ZXJcbiAgICBjb25zdCBzdGF0ZU1hY2hpbmUgPSB0aGlzLmNyZWF0ZVN0YXRlTWFjaGluZShcbiAgICAgIGVudmlyb25tZW50U3VmZml4LFxuICAgICAgdGhpcy5tZXRhZGF0YUJ1Y2tldCxcbiAgICAgIG9wZW5zZWFyY2hDb2xsZWN0aW9uLFxuICAgICAgZmFpbHVyZVRhYmxlXG4gICAgKTtcblxuICAgIC8vIE1vbml0b3JpbmcgTGF5ZXJcbiAgICB0aGlzLmNyZWF0ZU1vbml0b3JpbmdEYXNoYm9hcmQoXG4gICAgICBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgIHN0YXRlTWFjaGluZSxcbiAgICAgIGZhaWx1cmVUYWJsZSxcbiAgICAgIG9wZW5zZWFyY2hDb2xsZWN0aW9uXG4gICAgKTtcblxuICAgIGNvbnN0IGFsYXJtcyA9IHRoaXMuY3JlYXRlQWxhcm1zKFxuICAgICAgZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICBzdGF0ZU1hY2hpbmUsXG4gICAgICBmYWlsdXJlVGFibGUsXG4gICAgICBvcGVuc2VhcmNoQ29sbGVjdGlvblxuICAgICk7XG5cbiAgICAvLyBFdmVudCBSdWxlc1xuICAgIHRoaXMuY3JlYXRlRXZlbnRSdWxlcyhlbnZpcm9ubWVudFN1ZmZpeCwgdGhpcy5tZXRhZGF0YUJ1Y2tldCwgc3RhdGVNYWNoaW5lKTtcblxuICAgIC8vIFJlc291cmNlIERlcGVuZGVuY2llc1xuICAgIHRoaXMuc2V0dXBEZXBlbmRlbmNpZXMoXG4gICAgICBvcGVuc2VhcmNoQ29sbGVjdGlvbixcbiAgICAgIGRhdGFBY2Nlc3NQb2xpY3ksXG4gICAgICBuZXR3b3JrQWNjZXNzUG9saWN5LFxuICAgICAgZW5jcnlwdGlvblBvbGljeVxuICAgICk7XG5cbiAgICAvLyBTdGFjayBPdXRwdXRzXG4gICAgdGhpcy5jcmVhdGVPdXRwdXRzKFxuICAgICAgdGhpcy5tZXRhZGF0YUJ1Y2tldCxcbiAgICAgIGZhaWx1cmVUYWJsZSxcbiAgICAgIG9wZW5zZWFyY2hDb2xsZWN0aW9uLFxuICAgICAgc3RhdGVNYWNoaW5lLFxuICAgICAgYWxhcm1zXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0RW52aXJvbm1lbnRTdWZmaXgocHJvcHM/OiBUYXBTdGFja1Byb3BzKTogc3RyaW5nIHtcbiAgICByZXR1cm4gcHJvcHM/LmVudmlyb25tZW50U3VmZml4ICYmIHByb3BzLmVudmlyb25tZW50U3VmZml4ICE9PSAnJ1xuICAgICAgPyBwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeFxuICAgICAgOiB0aGlzLm5vZGUudHJ5R2V0Q29udGV4dCgnZW52aXJvbm1lbnRTdWZmaXgnKSB8fCAnZGV2JztcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlRmFpbHVyZVRhYmxlKGVudmlyb25tZW50U3VmZml4OiBzdHJpbmcpOiBkeW5hbW9kYi5UYWJsZSB7XG4gICAgY29uc3QgdGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ0ZhaWx1cmVUYWJsZScsIHtcbiAgICAgIHRhYmxlTmFtZTogYG1ldGFkYXRhLXByb2Nlc3NpbmctZmFpbHVyZXMtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgcGFydGl0aW9uS2V5OiB7XG4gICAgICAgIG5hbWU6ICdleGVjdXRpb25JZCcsXG4gICAgICAgIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxuICAgICAgfSxcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ3RpbWVzdGFtcCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIHBvaW50SW5UaW1lUmVjb3Zlcnk6IHRydWUsXG4gICAgfSk7XG5cbiAgICAvLyBPdXRwdXQgd2lsbCBiZSBjcmVhdGVkIGluIGNyZWF0ZU91dHB1dHMgbWV0aG9kXG5cbiAgICByZXR1cm4gdGFibGU7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZU9wZW5TZWFyY2hDb2xsZWN0aW9uKGVudmlyb25tZW50U3VmZml4OiBzdHJpbmcpIHtcbiAgICBjb25zdCBjb2xsZWN0aW9uID0gbmV3IG9wZW5zZWFyY2hzZXJ2ZXJsZXNzLkNmbkNvbGxlY3Rpb24oXG4gICAgICB0aGlzLFxuICAgICAgJ09wZW5TZWFyY2hDb2xsZWN0aW9uJyxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYG1ldGFkYXRhLXRpbWVzZXJpZXMtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB0eXBlOiAnVElNRVNFUklFUycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVGltZVNlcmllcyBjb2xsZWN0aW9uIGZvciBtZXRhZGF0YSBwcm9jZXNzaW5nJyxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gT3V0cHV0cyB3aWxsIGJlIGNyZWF0ZWQgaW4gY3JlYXRlT3V0cHV0cyBtZXRob2RcblxuICAgIHJldHVybiBjb2xsZWN0aW9uO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVPcGVuU2VhcmNoUG9saWNpZXMoXG4gICAgZW52aXJvbm1lbnRTdWZmaXg6IHN0cmluZyxcbiAgICBjb2xsZWN0aW9uOiBvcGVuc2VhcmNoc2VydmVybGVzcy5DZm5Db2xsZWN0aW9uXG4gICkge1xuICAgIC8vIERhdGEgYWNjZXNzIHBvbGljeSBmb3IgT3BlblNlYXJjaCBTZXJ2ZXJsZXNzXG4gICAgY29uc3QgZGF0YUFjY2Vzc1BvbGljeSA9IG5ldyBvcGVuc2VhcmNoc2VydmVybGVzcy5DZm5BY2Nlc3NQb2xpY3koXG4gICAgICB0aGlzLFxuICAgICAgJ0RhdGFBY2Nlc3NQb2xpY3knLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgbWV0YWRhdGEtZGF0YS1hY2Nlc3MtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB0eXBlOiAnZGF0YScsXG4gICAgICAgIHBvbGljeTogSlNPTi5zdHJpbmdpZnkoW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIFJ1bGVzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBSZXNvdXJjZTogW2Bjb2xsZWN0aW9uLyR7Y29sbGVjdGlvbi5uYW1lfWBdLFxuICAgICAgICAgICAgICAgIFBlcm1pc3Npb246IFtcbiAgICAgICAgICAgICAgICAgICdhb3NzOkNyZWF0ZUNvbGxlY3Rpb25JdGVtcycsXG4gICAgICAgICAgICAgICAgICAnYW9zczpEZWxldGVDb2xsZWN0aW9uSXRlbXMnLFxuICAgICAgICAgICAgICAgICAgJ2Fvc3M6VXBkYXRlQ29sbGVjdGlvbkl0ZW1zJyxcbiAgICAgICAgICAgICAgICAgICdhb3NzOkRlc2NyaWJlQ29sbGVjdGlvbkl0ZW1zJyxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFJlc291cmNlVHlwZTogJ2NvbGxlY3Rpb24nLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgUmVzb3VyY2U6IFtgaW5kZXgvJHtjb2xsZWN0aW9uLm5hbWV9LypgXSxcbiAgICAgICAgICAgICAgICBQZXJtaXNzaW9uOiBbXG4gICAgICAgICAgICAgICAgICAnYW9zczpDcmVhdGVJbmRleCcsXG4gICAgICAgICAgICAgICAgICAnYW9zczpEZWxldGVJbmRleCcsXG4gICAgICAgICAgICAgICAgICAnYW9zczpVcGRhdGVJbmRleCcsXG4gICAgICAgICAgICAgICAgICAnYW9zczpEZXNjcmliZUluZGV4JyxcbiAgICAgICAgICAgICAgICAgICdhb3NzOlJlYWREb2N1bWVudCcsXG4gICAgICAgICAgICAgICAgICAnYW9zczpXcml0ZURvY3VtZW50JyxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFJlc291cmNlVHlwZTogJ2luZGV4JyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBQcmluY2lwYWw6IFtgYXJuOmF3czppYW06OiR7dGhpcy5hY2NvdW50fTpyb290YF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSksXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIE5ldHdvcmsgYWNjZXNzIHBvbGljeSBmb3IgT3BlblNlYXJjaCBTZXJ2ZXJsZXNzIChwdWJsaWMgYWNjZXNzKVxuICAgIGNvbnN0IG5ldHdvcmtBY2Nlc3NQb2xpY3kgPSBuZXcgb3BlbnNlYXJjaHNlcnZlcmxlc3MuQ2ZuU2VjdXJpdHlQb2xpY3koXG4gICAgICB0aGlzLFxuICAgICAgJ05ldHdvcmtBY2Nlc3NQb2xpY3knLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgbWV0YWRhdGEtbmV0d29yay1hY2Nlc3MtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB0eXBlOiAnbmV0d29yaycsXG4gICAgICAgIHBvbGljeTogSlNPTi5zdHJpbmdpZnkoW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIERlc2NyaXB0aW9uOiAnUHVibGljIGFjY2VzcyB0byBPcGVuU2VhcmNoIGRhc2hib2FyZHMnLFxuICAgICAgICAgICAgUnVsZXM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFJlc291cmNlVHlwZTogJ2Rhc2hib2FyZCcsXG4gICAgICAgICAgICAgICAgUmVzb3VyY2U6IFtgY29sbGVjdGlvbi8ke2NvbGxlY3Rpb24ubmFtZX1gXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFJlc291cmNlVHlwZTogJ2NvbGxlY3Rpb24nLFxuICAgICAgICAgICAgICAgIFJlc291cmNlOiBbYGNvbGxlY3Rpb24vJHtjb2xsZWN0aW9uLm5hbWV9YF0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgQWxsb3dGcm9tUHVibGljOiB0cnVlLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0pLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBFbmNyeXB0aW9uIHBvbGljeSBmb3IgT3BlblNlYXJjaCBTZXJ2ZXJsZXNzXG4gICAgY29uc3QgZW5jcnlwdGlvblBvbGljeSA9IG5ldyBvcGVuc2VhcmNoc2VydmVybGVzcy5DZm5TZWN1cml0eVBvbGljeShcbiAgICAgIHRoaXMsXG4gICAgICAnRW5jcnlwdGlvblBvbGljeScsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGBtZXRhZGF0YS1lbmNyeXB0aW9uLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgdHlwZTogJ2VuY3J5cHRpb24nLFxuICAgICAgICBwb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBSdWxlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBSZXNvdXJjZTogW2Bjb2xsZWN0aW9uLyR7Y29sbGVjdGlvbi5uYW1lfWBdLFxuICAgICAgICAgICAgICBSZXNvdXJjZVR5cGU6ICdjb2xsZWN0aW9uJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgICBBV1NPd25lZEtleTogdHJ1ZSxcbiAgICAgICAgfSksXG4gICAgICB9XG4gICAgKTtcblxuICAgIHJldHVybiB7IGRhdGFBY2Nlc3NQb2xpY3ksIG5ldHdvcmtBY2Nlc3NQb2xpY3ksIGVuY3J5cHRpb25Qb2xpY3kgfTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlU3RhdGVNYWNoaW5lKFxuICAgIGVudmlyb25tZW50U3VmZml4OiBzdHJpbmcsXG4gICAgbWV0YWRhdGFCdWNrZXQ6IHMzLkJ1Y2tldCxcbiAgICBvcGVuc2VhcmNoQ29sbGVjdGlvbjogb3BlbnNlYXJjaHNlcnZlcmxlc3MuQ2ZuQ29sbGVjdGlvbixcbiAgICBmYWlsdXJlVGFibGU6IGR5bmFtb2RiLlRhYmxlXG4gICk6IHNmbi5TdGF0ZU1hY2hpbmUge1xuICAgIC8vIElBTSByb2xlIGZvciBTdGVwIEZ1bmN0aW9uc1xuICAgIGNvbnN0IHN0ZXBGdW5jdGlvblJvbGUgPSB0aGlzLmNyZWF0ZVN0YXRlTWFjaGluZVJvbGUoXG4gICAgICBtZXRhZGF0YUJ1Y2tldCxcbiAgICAgIG9wZW5zZWFyY2hDb2xsZWN0aW9uLFxuICAgICAgZmFpbHVyZVRhYmxlXG4gICAgKTtcblxuICAgIC8vIFN0ZXAgRnVuY3Rpb24gZGVmaW5pdGlvblxuICAgIGNvbnN0IGdldFMzT2JqZWN0ID0gbmV3IHRhc2tzLkNhbGxBd3NTZXJ2aWNlKHRoaXMsICdHZXRTM09iamVjdCcsIHtcbiAgICAgIHNlcnZpY2U6ICdzMycsXG4gICAgICBhY3Rpb246ICdnZXRPYmplY3QnLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAnQnVja2V0LiQnOiAnJC5kZXRhaWwuYnVja2V0Lm5hbWUnLFxuICAgICAgICAnS2V5LiQnOiAnJC5kZXRhaWwub2JqZWN0LmtleScsXG4gICAgICB9LFxuICAgICAgaWFtUmVzb3VyY2VzOiBbbWV0YWRhdGFCdWNrZXQuYXJuRm9yT2JqZWN0cygnKicpXSxcbiAgICAgIHJlc3VsdFBhdGg6ICckLnMzUmVzdWx0JyxcbiAgICB9KTtcblxuICAgIGNvbnN0IGFkZFRpbWVzdGFtcCA9IG5ldyBzZm4uUGFzcyh0aGlzLCAnQWRkVGltZXN0YW1wJywge1xuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAnQHRpbWVzdGFtcCc6IHNmbi5Kc29uUGF0aC5zdHJpbmdBdCgnJCQuU3RhdGUuRW50ZXJlZFRpbWUnKSxcbiAgICAgICAgJ21ldGFkYXRhLiQnOiAnU3RhdGVzLlN0cmluZ1RvSnNvbigkLnMzUmVzdWx0LkJvZHkpJyxcbiAgICAgICAgJ2J1Y2tldC4kJzogJyQuZGV0YWlsLmJ1Y2tldC5uYW1lJyxcbiAgICAgICAgJ2tleS4kJzogJyQuZGV0YWlsLm9iamVjdC5rZXknLFxuICAgICAgfSxcbiAgICAgIHJlc3VsdFBhdGg6ICckLnByb2Nlc3NlZERhdGEnLFxuICAgIH0pO1xuXG4gICAgLy8gU3RvcmUgZG9jdW1lbnQgaW4gT3BlblNlYXJjaCB3aXRoIHByb3BlciBIVFRQIHJlcXVlc3RcbiAgICBjb25zdCBwdXRUb09wZW5TZWFyY2ggPSBuZXcgdGFza3MuQ2FsbEF3c1NlcnZpY2UodGhpcywgJ1B1dFRvT3BlblNlYXJjaCcsIHtcbiAgICAgIHNlcnZpY2U6ICdvcGVuc2VhcmNoc2VydmVybGVzcycsXG4gICAgICBhY3Rpb246ICdpbmRleCcsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIEluZGV4OiAnbWV0YWRhdGEtaW5kZXgnLFxuICAgICAgICAnQm9keS4kJzogJyQucHJvY2Vzc2VkRGF0YScsXG4gICAgICAgICdJZC4kJzogJ1N0YXRlcy5VVUlEKCknLFxuICAgICAgfSxcbiAgICAgIGlhbVJlc291cmNlczogW29wZW5zZWFyY2hDb2xsZWN0aW9uLmF0dHJBcm5dLFxuICAgICAgcmVzdWx0UGF0aDogJyQub3BlbnNlYXJjaFJlc3VsdCcsXG4gICAgfSk7XG5cbiAgICBjb25zdCBsb2dGYWlsdXJlID0gbmV3IHRhc2tzLkR5bmFtb1B1dEl0ZW0odGhpcywgJ0xvZ0ZhaWx1cmUnLCB7XG4gICAgICB0YWJsZTogZmFpbHVyZVRhYmxlLFxuICAgICAgaXRlbToge1xuICAgICAgICBleGVjdXRpb25JZDogdGFza3MuRHluYW1vQXR0cmlidXRlVmFsdWUuZnJvbVN0cmluZyhcbiAgICAgICAgICBzZm4uSnNvblBhdGguc3RyaW5nQXQoJyQkLkV4ZWN1dGlvbi5OYW1lJylcbiAgICAgICAgKSxcbiAgICAgICAgdGltZXN0YW1wOiB0YXNrcy5EeW5hbW9BdHRyaWJ1dGVWYWx1ZS5mcm9tU3RyaW5nKFxuICAgICAgICAgIHNmbi5Kc29uUGF0aC5zdHJpbmdBdCgnJCQuU3RhdGUuRW50ZXJlZFRpbWUnKVxuICAgICAgICApLFxuICAgICAgICBpbnB1dERhdGE6IHRhc2tzLkR5bmFtb0F0dHJpYnV0ZVZhbHVlLmZyb21TdHJpbmcoXG4gICAgICAgICAgc2ZuLkpzb25QYXRoLnN0cmluZ0F0KCckJC5FeGVjdXRpb24uSW5wdXQnKVxuICAgICAgICApLFxuICAgICAgICBlcnJvckNhdXNlOiB0YXNrcy5EeW5hbW9BdHRyaWJ1dGVWYWx1ZS5mcm9tU3RyaW5nKFxuICAgICAgICAgIHNmbi5Kc29uUGF0aC5zdHJpbmdBdCgnJC5FcnJvci5DYXVzZScpXG4gICAgICAgICksXG4gICAgICAgIGVycm9yTWVzc2FnZTogdGFza3MuRHluYW1vQXR0cmlidXRlVmFsdWUuZnJvbVN0cmluZyhcbiAgICAgICAgICBzZm4uSnNvblBhdGguc3RyaW5nQXQoJyQuRXJyb3IuRXJyb3InKVxuICAgICAgICApLFxuICAgICAgICBzdGF0ZU5hbWU6IHRhc2tzLkR5bmFtb0F0dHJpYnV0ZVZhbHVlLmZyb21TdHJpbmcoXG4gICAgICAgICAgc2ZuLkpzb25QYXRoLnN0cmluZ0F0KCckJC5TdGF0ZS5OYW1lJylcbiAgICAgICAgKSxcbiAgICAgICAgZXhlY3V0aW9uQXJuOiB0YXNrcy5EeW5hbW9BdHRyaWJ1dGVWYWx1ZS5mcm9tU3RyaW5nKFxuICAgICAgICAgIHNmbi5Kc29uUGF0aC5zdHJpbmdBdCgnJCQuRXhlY3V0aW9uLlJvbGVBcm4nKVxuICAgICAgICApLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHByb2Nlc3NpbmdGYWlsZWQgPSBuZXcgc2ZuLkZhaWwodGhpcywgJ1Byb2Nlc3NpbmdGYWlsZWQnLCB7XG4gICAgICBjYXVzZTogJ01ldGFkYXRhIHByb2Nlc3NpbmcgZmFpbGVkJyxcbiAgICB9KTtcblxuICAgIC8vIEFkZCByZXRyeSBsb2dpYyB0byBpbmRpdmlkdWFsIHN0ZXBzXG4gICAgY29uc3QgcHJvY2Vzc01ldGFkYXRhRGVmaW5pdGlvbiA9IGdldFMzT2JqZWN0XG4gICAgICAuYWRkUmV0cnkoe1xuICAgICAgICBlcnJvcnM6IFsnU3RhdGVzLlRhc2tGYWlsZWQnLCAnU3RhdGVzLkV4ZWN1dGlvbkxpbWl0RXhjZWVkZWQnXSxcbiAgICAgICAgaW50ZXJ2YWw6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDIpLFxuICAgICAgICBtYXhBdHRlbXB0czogMyxcbiAgICAgICAgYmFja29mZlJhdGU6IDIuMCxcbiAgICAgIH0pXG4gICAgICAubmV4dChhZGRUaW1lc3RhbXApXG4gICAgICAubmV4dChcbiAgICAgICAgcHV0VG9PcGVuU2VhcmNoLmFkZFJldHJ5KHtcbiAgICAgICAgICBlcnJvcnM6IFsnU3RhdGVzLlRhc2tGYWlsZWQnXSxcbiAgICAgICAgICBpbnRlcnZhbDogY2RrLkR1cmF0aW9uLnNlY29uZHMoNSksXG4gICAgICAgICAgbWF4QXR0ZW1wdHM6IDMsXG4gICAgICAgICAgYmFja29mZlJhdGU6IDIuMCxcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBjb25zdCBmYWlsdXJlQ2hhaW4gPSBsb2dGYWlsdXJlLm5leHQocHJvY2Vzc2luZ0ZhaWxlZCk7XG5cbiAgICBjb25zdCBwcm9jZXNzTWV0YWRhdGFXaXRoQ2F0Y2ggPSBuZXcgc2ZuLlBhcmFsbGVsKFxuICAgICAgdGhpcyxcbiAgICAgICdQcm9jZXNzTWV0YWRhdGFXaXRoQ2F0Y2gnXG4gICAgKVxuICAgICAgLmJyYW5jaChwcm9jZXNzTWV0YWRhdGFEZWZpbml0aW9uKVxuICAgICAgLmFkZENhdGNoKGZhaWx1cmVDaGFpbiwge1xuICAgICAgICBlcnJvcnM6IFsnU3RhdGVzLkFMTCddLFxuICAgICAgICByZXN1bHRQYXRoOiAnJC5FcnJvcicsXG4gICAgICB9KTtcblxuICAgIC8vIFN0ZXAgRnVuY3Rpb24gc3RhdGUgbWFjaGluZVxuICAgIGNvbnN0IHN0YXRlTWFjaGluZSA9IG5ldyBzZm4uU3RhdGVNYWNoaW5lKFxuICAgICAgdGhpcyxcbiAgICAgICdNZXRhZGF0YVByb2Nlc3NpbmdTdGF0ZU1hY2hpbmUnLFxuICAgICAge1xuICAgICAgICBzdGF0ZU1hY2hpbmVOYW1lOiBgbWV0YWRhdGEtcHJvY2Vzc2luZy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGRlZmluaXRpb246IHByb2Nlc3NNZXRhZGF0YVdpdGhDYXRjaCxcbiAgICAgICAgcm9sZTogc3RlcEZ1bmN0aW9uUm9sZSxcbiAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoMTUpLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBPdXRwdXQgd2lsbCBiZSBjcmVhdGVkIGluIGNyZWF0ZU91dHB1dHMgbWV0aG9kXG5cbiAgICByZXR1cm4gc3RhdGVNYWNoaW5lO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVTdGF0ZU1hY2hpbmVSb2xlKFxuICAgIG1ldGFkYXRhQnVja2V0OiBzMy5CdWNrZXQsXG4gICAgb3BlbnNlYXJjaENvbGxlY3Rpb246IG9wZW5zZWFyY2hzZXJ2ZXJsZXNzLkNmbkNvbGxlY3Rpb24sXG4gICAgZmFpbHVyZVRhYmxlOiBkeW5hbW9kYi5UYWJsZVxuICApOiBpYW0uUm9sZSB7XG4gICAgcmV0dXJuIG5ldyBpYW0uUm9sZSh0aGlzLCAnU3RhdGVNYWNoaW5lUm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdzdGF0ZXMuYW1hem9uYXdzLmNvbScpLFxuICAgICAgaW5saW5lUG9saWNpZXM6IHtcbiAgICAgICAgU3RlcEZ1bmN0aW9uUG9saWN5OiBuZXcgaWFtLlBvbGljeURvY3VtZW50KHtcbiAgICAgICAgICBzdGF0ZW1lbnRzOiBbXG4gICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgYWN0aW9uczogWydzMzpHZXRPYmplY3QnLCAnczM6R2V0T2JqZWN0VmVyc2lvbiddLFxuICAgICAgICAgICAgICByZXNvdXJjZXM6IFttZXRhZGF0YUJ1Y2tldC5hcm5Gb3JPYmplY3RzKCcqJyldLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgICdkeW5hbW9kYjpQdXRJdGVtJyxcbiAgICAgICAgICAgICAgICAnZHluYW1vZGI6R2V0SXRlbScsXG4gICAgICAgICAgICAgICAgJ2R5bmFtb2RiOlVwZGF0ZUl0ZW0nLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICByZXNvdXJjZXM6IFtmYWlsdXJlVGFibGUudGFibGVBcm5dLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgICdhb3NzOkFQSUFjY2Vzc0FsbCcsXG4gICAgICAgICAgICAgICAgJ2Fvc3M6V3JpdGVEb2N1bWVudCcsXG4gICAgICAgICAgICAgICAgJ2Fvc3M6Q3JlYXRlSW5kZXgnLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICAgICAgICBvcGVuc2VhcmNoQ29sbGVjdGlvbi5hdHRyQXJuLFxuICAgICAgICAgICAgICAgIGAke29wZW5zZWFyY2hDb2xsZWN0aW9uLmF0dHJBcm59LypgLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVNb25pdG9yaW5nRGFzaGJvYXJkKFxuICAgIGVudmlyb25tZW50U3VmZml4OiBzdHJpbmcsXG4gICAgc3RhdGVNYWNoaW5lOiBzZm4uU3RhdGVNYWNoaW5lLFxuICAgIGZhaWx1cmVUYWJsZTogZHluYW1vZGIuVGFibGUsXG4gICAgX29wZW5zZWFyY2hDb2xsZWN0aW9uOiBvcGVuc2VhcmNoc2VydmVybGVzcy5DZm5Db2xsZWN0aW9uXG4gICkge1xuICAgIC8vIENsb3VkV2F0Y2ggRGFzaGJvYXJkIGZvciBtb25pdG9yaW5nXG4gICAgbmV3IGNsb3Vkd2F0Y2guRGFzaGJvYXJkKHRoaXMsICdNb25pdG9yaW5nRGFzaGJvYXJkJywge1xuICAgICAgZGFzaGJvYXJkTmFtZTogYG1ldGFkYXRhLXByb2Nlc3NpbmctZGFzaGJvYXJkLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHdpZGdldHM6IFtcbiAgICAgICAgW1xuICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcbiAgICAgICAgICAgIHRpdGxlOiAnU3RlcCBGdW5jdGlvbiBFeGVjdXRpb25zJyxcbiAgICAgICAgICAgIGxlZnQ6IFtcbiAgICAgICAgICAgICAgc3RhdGVNYWNoaW5lLm1ldHJpY1N0YXJ0ZWQoKSxcbiAgICAgICAgICAgICAgc3RhdGVNYWNoaW5lLm1ldHJpY1N1Y2NlZWRlZCgpLFxuICAgICAgICAgICAgICBzdGF0ZU1hY2hpbmUubWV0cmljRmFpbGVkKCksXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgd2lkdGg6IDEyLFxuICAgICAgICAgIH0pLFxuICAgICAgICBdLFxuICAgICAgICBbXG4gICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgICAgICAgdGl0bGU6ICdEeW5hbW9EQiBGYWlsdXJlIFRhYmxlIE9wZXJhdGlvbnMnLFxuICAgICAgICAgICAgbGVmdDogW1xuICAgICAgICAgICAgICBmYWlsdXJlVGFibGUubWV0cmljQ29uc3VtZWRSZWFkQ2FwYWNpdHlVbml0cygpLFxuICAgICAgICAgICAgICBmYWlsdXJlVGFibGUubWV0cmljQ29uc3VtZWRXcml0ZUNhcGFjaXR5VW5pdHMoKSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB3aWR0aDogMTIsXG4gICAgICAgICAgfSksXG4gICAgICAgIF0sXG4gICAgICBdLFxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVBbGFybXMoXG4gICAgZW52aXJvbm1lbnRTdWZmaXg6IHN0cmluZyxcbiAgICBzdGF0ZU1hY2hpbmU6IHNmbi5TdGF0ZU1hY2hpbmUsXG4gICAgX2ZhaWx1cmVUYWJsZTogZHluYW1vZGIuVGFibGUsXG4gICAgX29wZW5zZWFyY2hDb2xsZWN0aW9uOiBvcGVuc2VhcmNoc2VydmVybGVzcy5DZm5Db2xsZWN0aW9uXG4gICkge1xuICAgIC8vIENsb3VkV2F0Y2ggYWxhcm0gZm9yIFN0ZXAgRnVuY3Rpb24gZmFpbHVyZXNcbiAgICBjb25zdCBmYWlsdXJlQWxhcm0gPSBuZXcgY2xvdWR3YXRjaC5BbGFybShcbiAgICAgIHRoaXMsXG4gICAgICAnU3RhdGVNYWNoaW5lRmFpbHVyZUFsYXJtJyxcbiAgICAgIHtcbiAgICAgICAgYWxhcm1OYW1lOiBgbWV0YWRhdGEtcHJvY2Vzc2luZy1mYWlsdXJlcy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdBbGFybSBmb3IgU3RlcCBGdW5jdGlvbiBleGVjdXRpb24gZmFpbHVyZXMnLFxuICAgICAgICBtZXRyaWM6IHN0YXRlTWFjaGluZS5tZXRyaWNGYWlsZWQoe1xuICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoMSksXG4gICAgICAgIH0pLFxuICAgICAgICB0aHJlc2hvbGQ6IDEsXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAxLFxuICAgICAgICB0cmVhdE1pc3NpbmdEYXRhOiBjbG91ZHdhdGNoLlRyZWF0TWlzc2luZ0RhdGEuTk9UX0JSRUFDSElORyxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gT3V0cHV0IHdpbGwgYmUgY3JlYXRlZCBpbiBjcmVhdGVPdXRwdXRzIG1ldGhvZFxuXG4gICAgcmV0dXJuIFtmYWlsdXJlQWxhcm1dO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVFdmVudFJ1bGVzKFxuICAgIGVudmlyb25tZW50U3VmZml4OiBzdHJpbmcsXG4gICAgbWV0YWRhdGFCdWNrZXQ6IHMzLkJ1Y2tldCxcbiAgICBzdGF0ZU1hY2hpbmU6IHNmbi5TdGF0ZU1hY2hpbmVcbiAgKSB7XG4gICAgLy8gRXZlbnRCcmlkZ2UgcnVsZSBmb3IgUzMgb2JqZWN0IGNyZWF0aW9uIGV2ZW50c1xuICAgIGNvbnN0IGV2ZW50UnVsZSA9IG5ldyBldmVudHMuUnVsZSh0aGlzLCAnTWV0YWRhdGFGaWxlUnVsZScsIHtcbiAgICAgIHJ1bGVOYW1lOiBgbWV0YWRhdGEtZmlsZS1jcmVhdGVkLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIGV2ZW50UGF0dGVybjoge1xuICAgICAgICBzb3VyY2U6IFsnYXdzLnMzJ10sXG4gICAgICAgIGRldGFpbFR5cGU6IFsnT2JqZWN0IENyZWF0ZWQnXSxcbiAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgYnVja2V0OiB7XG4gICAgICAgICAgICBuYW1lOiBbbWV0YWRhdGFCdWNrZXQuYnVja2V0TmFtZV0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBvYmplY3Q6IHtcbiAgICAgICAgICAgIGtleTogW3sgc3VmZml4OiAnbWV0YWRhdGEuanNvbicgfV0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgU3RlcCBGdW5jdGlvbiBhcyB0YXJnZXQgZm9yIEV2ZW50QnJpZGdlIHJ1bGVcbiAgICBldmVudFJ1bGUuYWRkVGFyZ2V0KG5ldyB0YXJnZXRzLlNmblN0YXRlTWFjaGluZShzdGF0ZU1hY2hpbmUpKTtcbiAgfVxuXG4gIHByaXZhdGUgc2V0dXBEZXBlbmRlbmNpZXMoXG4gICAgb3BlbnNlYXJjaENvbGxlY3Rpb246IG9wZW5zZWFyY2hzZXJ2ZXJsZXNzLkNmbkNvbGxlY3Rpb24sXG4gICAgZGF0YUFjY2Vzc1BvbGljeTogb3BlbnNlYXJjaHNlcnZlcmxlc3MuQ2ZuQWNjZXNzUG9saWN5LFxuICAgIG5ldHdvcmtBY2Nlc3NQb2xpY3k6IG9wZW5zZWFyY2hzZXJ2ZXJsZXNzLkNmblNlY3VyaXR5UG9saWN5LFxuICAgIGVuY3J5cHRpb25Qb2xpY3k6IG9wZW5zZWFyY2hzZXJ2ZXJsZXNzLkNmblNlY3VyaXR5UG9saWN5XG4gICkge1xuICAgIC8vIEFkZCBkZXBlbmRlbmNpZXNcbiAgICBvcGVuc2VhcmNoQ29sbGVjdGlvbi5hZGREZXBlbmRlbmN5KGVuY3J5cHRpb25Qb2xpY3kpO1xuICAgIGRhdGFBY2Nlc3NQb2xpY3kuYWRkRGVwZW5kZW5jeShvcGVuc2VhcmNoQ29sbGVjdGlvbik7XG4gICAgbmV0d29ya0FjY2Vzc1BvbGljeS5hZGREZXBlbmRlbmN5KG9wZW5zZWFyY2hDb2xsZWN0aW9uKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlT3V0cHV0cyhcbiAgICBtZXRhZGF0YUJ1Y2tldDogczMuQnVja2V0LFxuICAgIGZhaWx1cmVUYWJsZTogZHluYW1vZGIuVGFibGUsXG4gICAgb3BlbnNlYXJjaENvbGxlY3Rpb246IG9wZW5zZWFyY2hzZXJ2ZXJsZXNzLkNmbkNvbGxlY3Rpb24sXG4gICAgc3RhdGVNYWNoaW5lOiBzZm4uU3RhdGVNYWNoaW5lLFxuICAgIGFsYXJtczogY2xvdWR3YXRjaC5BbGFybVtdXG4gICkge1xuICAgIC8vIE91dHB1dHNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnTWV0YWRhdGFCdWNrZXROYW1lJywge1xuICAgICAgdmFsdWU6IG1ldGFkYXRhQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ05hbWUgb2YgdGhlIFMzIGJ1Y2tldCBmb3IgbWV0YWRhdGEgZmlsZXMnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ09wZW5TZWFyY2hDb2xsZWN0aW9uRW5kcG9pbnQnLCB7XG4gICAgICB2YWx1ZTogb3BlbnNlYXJjaENvbGxlY3Rpb24uYXR0ckNvbGxlY3Rpb25FbmRwb2ludCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnT3BlblNlYXJjaCBTZXJ2ZXJsZXNzIGNvbGxlY3Rpb24gZW5kcG9pbnQnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ09wZW5TZWFyY2hEYXNoYm9hcmRzVXJsJywge1xuICAgICAgdmFsdWU6IG9wZW5zZWFyY2hDb2xsZWN0aW9uLmF0dHJEYXNoYm9hcmRFbmRwb2ludCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnT3BlblNlYXJjaCBEYXNoYm9hcmRzIFVSTCcsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRmFpbHVyZVRhYmxlTmFtZScsIHtcbiAgICAgIHZhbHVlOiBmYWlsdXJlVGFibGUudGFibGVOYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdOYW1lIG9mIHRoZSBEeW5hbW9EQiB0YWJsZSBmb3IgZmFpbHVyZSB0cmFja2luZycsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnU3RhdGVNYWNoaW5lQXJuJywge1xuICAgICAgdmFsdWU6IHN0YXRlTWFjaGluZS5zdGF0ZU1hY2hpbmVBcm4sXG4gICAgICBkZXNjcmlwdGlvbjogJ0FSTiBvZiB0aGUgU3RlcCBGdW5jdGlvbiBzdGF0ZSBtYWNoaW5lJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdGYWlsdXJlQWxhcm1OYW1lJywge1xuICAgICAgdmFsdWU6IGFsYXJtc1swXS5hbGFybU5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ05hbWUgb2YgdGhlIENsb3VkV2F0Y2ggYWxhcm0gZm9yIGZhaWx1cmVzJyxcbiAgICB9KTtcbiAgfVxufVxuIl19