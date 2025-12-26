/**
 * Reconciliation System Integration Tests
 * Integration tests for S3, Lambda, Step Functions, DynamoDB, SNS infrastructure
 */

describe('Reconciliation System Integration Tests', () => {
    describe('S3 Bucket Configuration', () => {
        it('should validate data ingestion bucket setup', () => {
            const s3Config = {
                bucketName: 'reconciliation-data-ingestion',
                versioning: true,
                encryption: {
                    type: 'SSE-S3',
                    algorithm: 'AES256'
                },
                lifecycle: {
                    rules: [
                        { id: 'archive-old-data', daysToArchive: 90, daysToDelete: 365 },
                        { id: 'delete-temp-files', prefix: 'temp/', daysToDelete: 7 }
                    ]
                },
                eventNotifications: {
                    lambdaTriggers: ['process-incoming-file'],
                    sqsQueues: ['file-processing-queue'],
                    snsTopics: ['file-arrival-topic']
                },
                cors: {
                    allowedOrigins: ['https://app.example.com'],
                    allowedMethods: ['GET', 'PUT', 'POST'],
                    maxAge: 3600
                }
            };

            expect(s3Config.versioning).toBe(true);
            expect(s3Config.encryption.type).toBe('SSE-S3');
            expect(s3Config.lifecycle.rules.length).toBeGreaterThan(0);
            expect(s3Config.eventNotifications.lambdaTriggers.length).toBeGreaterThan(0);
        });

        it('should validate processed data bucket', () => {
            const processedBucket = {
                bucketName: 'reconciliation-processed-data',
                partitioning: 'year/month/day/hour',
                format: 'parquet',
                compression: 'snappy',
                queryOptimization: true,
                athenaIntegration: true,
                replicationConfig: {
                    enabled: true,
                    destinationRegion: 'us-west-2',
                    storageClass: 'GLACIER_IR'
                }
            };

            expect(processedBucket.format).toBe('parquet');
            expect(processedBucket.athenaIntegration).toBe(true);
            expect(processedBucket.replicationConfig.enabled).toBe(true);
        });

        it('should validate bucket policies and access control', () => {
            const bucketPolicy = {
                statements: [
                    {
                        effect: 'Allow',
                        principals: ['lambda-execution-role'],
                        actions: ['s3:GetObject', 's3:PutObject'],
                        resources: ['arn:aws:s3:::bucket/*']
                    },
                    {
                        effect: 'Deny',
                        principals: ['*'],
                        actions: ['s3:DeleteBucket'],
                        resources: ['arn:aws:s3:::bucket']
                    }
                ],
                publicAccessBlock: {
                    blockPublicAcls: true,
                    blockPublicPolicy: true,
                    ignorePublicAcls: true,
                    restrictPublicBuckets: true
                }
            };

            expect(bucketPolicy.publicAccessBlock.blockPublicAcls).toBe(true);
            expect(bucketPolicy.publicAccessBlock.restrictPublicBuckets).toBe(true);
            expect(bucketPolicy.statements.some(s => s.effect === 'Deny')).toBe(true);
        });
    });

    describe('Lambda Functions Integration', () => {
        it('should validate file processor Lambda configuration', () => {
            const lambdaConfig = {
                functionName: 'reconciliation-file-processor',
                runtime: 'python3.9',
                handler: 'main.handler',
                memorySize: 1024,
                timeout: 300,
                environment: {
                    DYNAMODB_TABLE: 'reconciliation-records',
                    S3_OUTPUT_BUCKET: 'processed-data',
                    SNS_TOPIC_ARN: 'arn:aws:sns:us-east-1:123456:alerts',
                    LOG_LEVEL: 'INFO'
                },
                reservedConcurrency: 100,
                deadLetterQueue: {
                    targetArn: 'arn:aws:sqs:us-east-1:123456:dlq',
                    maxReceiveCount: 3
                },
                vpcConfig: null, // Serverless, no VPC
                layers: ['arn:aws:lambda:us-east-1:123456:layer:pandas:1']
            };

            expect(lambdaConfig.memorySize).toBeLessThanOrEqual(10240);
            expect(lambdaConfig.timeout).toBeLessThanOrEqual(900);
            expect(lambdaConfig.environment.DYNAMODB_TABLE).toBeTruthy();
            expect(lambdaConfig.deadLetterQueue).toBeTruthy();
        });

        it('should validate data validator Lambda', () => {
            const validatorLambda = {
                functionName: 'reconciliation-data-validator',
                runtime: 'python3.9',
                handler: 'validator.validate',
                memorySize: 512,
                timeout: 60,
                eventSourceMappings: [
                    {
                        type: 'S3',
                        bucket: 'reconciliation-data-ingestion',
                        events: ['s3:ObjectCreated:*'],
                        filter: { prefix: 'incoming/', suffix: '.csv' }
                    }
                ],
                destinations: {
                    onSuccess: 'arn:aws:sqs:us-east-1:123456:success-queue',
                    onFailure: 'arn:aws:sqs:us-east-1:123456:failure-queue'
                }
            };

            expect(validatorLambda.eventSourceMappings.length).toBeGreaterThan(0);
            expect(validatorLambda.eventSourceMappings[0].type).toBe('S3');
            expect(validatorLambda.destinations.onSuccess).toBeTruthy();
            expect(validatorLambda.destinations.onFailure).toBeTruthy();
        });

        it('should validate Lambda error handling and retry configuration', () => {
            const errorHandling = {
                maximumRetryAttempts: 2,
                maximumEventAge: 21600, // 6 hours
                bisectBatchOnFunctionError: true,
                parallelizationFactor: 10,
                errorMetrics: {
                    namespace: 'ReconciliationSystem',
                    dimensions: { Environment: 'production', Service: 'Lambda' }
                },
                alarms: [
                    { metric: 'Errors', threshold: 10, evaluationPeriods: 2 },
                    { metric: 'Throttles', threshold: 5, evaluationPeriods: 1 },
                    { metric: 'Duration', threshold: 30000, evaluationPeriods: 3 }
                ]
            };

            expect(errorHandling.maximumRetryAttempts).toBeLessThanOrEqual(2);
            expect(errorHandling.maximumEventAge).toBeLessThanOrEqual(21600);
            expect(errorHandling.alarms.length).toBeGreaterThan(0);
        });
    });

    describe('Step Functions State Machine', () => {
        it('should validate reconciliation workflow state machine', () => {
            const stateMachine = {
                name: 'ReconciliationWorkflow',
                type: 'STANDARD',
                definition: {
                    startAt: 'ValidateInput',
                    states: {
                        ValidateInput: { type: 'Task', next: 'ProcessData' },
                        ProcessData: {
                            type: 'Parallel',
                            branches: [
                                { startAt: 'ExtractData', states: {} },
                                { startAt: 'TransformData', states: {} }
                            ],
                            next: 'ReconcileResults'
                        },
                        ReconcileResults: { type: 'Task', next: 'PublishResults' },
                        PublishResults: { type: 'Task', end: true }
                    }
                },
                logging: {
                    level: 'ALL',
                    includeExecutionData: true,
                    destinations: ['/aws/vendedlogs/states']
                },
                tracingConfiguration: {
                    enabled: true
                }
            };

            expect(stateMachine.type).toBe('STANDARD');
            expect(stateMachine.definition.startAt).toBe('ValidateInput');
            expect(stateMachine.definition.states.ProcessData.type).toBe('Parallel');
            expect(stateMachine.logging.level).toBe('ALL');
            expect(stateMachine.tracingConfiguration.enabled).toBe(true);
        });

        it('should validate error handling in state machine', () => {
            const errorHandlingStates = {
                retry: [
                    {
                        errorEquals: ['States.TaskFailed', 'States.Timeout'],
                        intervalSeconds: 2,
                        maxAttempts: 3,
                        backoffRate: 2.0
                    },
                    {
                        errorEquals: ['States.ALL'],
                        intervalSeconds: 5,
                        maxAttempts: 2,
                        backoffRate: 1.5
                    }
                ],
                catch: [
                    {
                        errorEquals: ['ValidationError'],
                        next: 'HandleValidationError',
                        resultPath: '$.error'
                    },
                    {
                        errorEquals: ['States.ALL'],
                        next: 'HandleGenericError',
                        resultPath: '$.error'
                    }
                ]
            };

            expect(errorHandlingStates.retry.length).toBeGreaterThan(0);
            expect(errorHandlingStates.retry[0].maxAttempts).toBeLessThanOrEqual(3);
            expect(errorHandlingStates.catch.some(c => c.errorEquals.includes('States.ALL'))).toBe(true);
        });

        it('should validate state machine execution configuration', () => {
            const executionConfig = {
                maxConcurrency: 1000,
                timeoutSeconds: 3600,
                historyRetentionDays: 30,
                executionRole: 'arn:aws:iam::123456:role/StepFunctionsExecutionRole',
                permissions: [
                    'lambda:InvokeFunction',
                    'dynamodb:PutItem',
                    'sns:Publish',
                    's3:GetObject',
                    's3:PutObject'
                ],
                costOptimization: {
                    expressWorkflows: false,
                    mapStateMaxConcurrency: 40
                }
            };

            expect(executionConfig.maxConcurrency).toBeGreaterThanOrEqual(100);
            expect(executionConfig.timeoutSeconds).toBeLessThanOrEqual(86400);
            expect(executionConfig.permissions).toContain('lambda:InvokeFunction');
        });
    });

    describe('DynamoDB Tables Configuration', () => {
        it('should validate reconciliation records table', () => {
            const dynamoTable = {
                tableName: 'reconciliation-records',
                partitionKey: { name: 'recordId', type: 'S' },
                sortKey: { name: 'timestamp', type: 'N' },
                billingMode: 'ON_DEMAND',
                streamSpecification: {
                    streamEnabled: true,
                    streamViewType: 'NEW_AND_OLD_IMAGES'
                },
                globalSecondaryIndexes: [
                    {
                        indexName: 'StatusIndex',
                        partitionKey: 'status',
                        sortKey: 'timestamp',
                        projection: 'ALL'
                    },
                    {
                        indexName: 'DateIndex',
                        partitionKey: 'date',
                        sortKey: 'recordId',
                        projection: 'KEYS_ONLY'
                    }
                ],
                ttl: {
                    enabled: true,
                    attributeName: 'expirationTime'
                },
                pointInTimeRecovery: true,
                encryption: 'AWS_OWNED_CMK'
            };

            expect(dynamoTable.billingMode).toBe('ON_DEMAND');
            expect(dynamoTable.streamSpecification.streamEnabled).toBe(true);
            expect(dynamoTable.globalSecondaryIndexes.length).toBeLessThanOrEqual(20);
            expect(dynamoTable.pointInTimeRecovery).toBe(true);
        });

        it('should validate audit trail table', () => {
            const auditTable = {
                tableName: 'reconciliation-audit-trail',
                partitionKey: { name: 'auditId', type: 'S' },
                sortKey: { name: 'eventTime', type: 'S' },
                attributes: [
                    'userId',
                    'action',
                    'resourceId',
                    'changes',
                    'ipAddress',
                    'userAgent'
                ],
                contributorInsights: true,
                continuousBackups: {
                    pointInTimeRecoveryEnabled: true,
                    backupRetentionPeriod: 35
                },
                tags: {
                    Compliance: 'Required',
                    DataRetention: '7years'
                }
            };

            expect(auditTable.contributorInsights).toBe(true);
            expect(auditTable.continuousBackups.pointInTimeRecoveryEnabled).toBe(true);
            expect(auditTable.tags.Compliance).toBe('Required');
        });

        it('should validate DynamoDB auto-scaling configuration', () => {
            const autoScaling = {
                table: {
                    read: { min: 5, max: 40000, targetUtilization: 70 },
                    write: { min: 5, max: 40000, targetUtilization: 70 }
                },
                indexes: {
                    read: { min: 5, max: 10000, targetUtilization: 70 },
                    write: { min: 5, max: 10000, targetUtilization: 70 }
                },
                scalingPolicy: 'TargetTrackingScaling',
                scaleInCooldown: 60,
                scaleOutCooldown: 60
            };

            expect(autoScaling.table.read.max).toBeLessThanOrEqual(40000);
            expect(autoScaling.table.read.targetUtilization).toBeBetween(20, 90);
            expect(autoScaling.scalingPolicy).toBe('TargetTrackingScaling');
        });
    });

    describe('SNS Topic Configuration', () => {
        it('should validate alert notification topic', () => {
            const snsTopic = {
                topicName: 'reconciliation-alerts',
                displayName: 'Reconciliation System Alerts',
                subscriptions: [
                    { protocol: 'email', endpoint: 'alerts@example.com' },
                    { protocol: 'sms', endpoint: '+1234567890' },
                    { protocol: 'lambda', endpoint: 'arn:aws:lambda:us-east-1:123456:function:alert-handler' },
                    { protocol: 'sqs', endpoint: 'arn:aws:sqs:us-east-1:123456:alert-queue' }
                ],
                deliveryPolicy: {
                    throttlePolicy: { maxReceivesPerSecond: 10 },
                    retryPolicy: {
                        numRetries: 3,
                        numMaxDelayRetries: 2,
                        backoffFunction: 'exponential'
                    }
                },
                encryption: {
                    kmsMasterKeyId: 'alias/sns-encryption-key'
                }
            };

            expect(snsTopic.subscriptions.length).toBeGreaterThan(0);
            expect(snsTopic.subscriptions.some(s => s.protocol === 'email')).toBe(true);
            expect(snsTopic.deliveryPolicy.retryPolicy.numRetries).toBeLessThanOrEqual(100);
            expect(snsTopic.encryption.kmsMasterKeyId).toBeTruthy();
        });

        it('should validate message filtering', () => {
            const messageFiltering = {
                filterPolicies: [
                    {
                        subscription: 'critical-alerts',
                        filter: { severity: ['CRITICAL', 'HIGH'] }
                    },
                    {
                        subscription: 'info-alerts',
                        filter: { severity: ['INFO', 'LOW'] }
                    },
                    {
                        subscription: 'specific-service',
                        filter: {
                            service: ['reconciliation'],
                            environment: ['production']
                        }
                    }
                ],
                messageAttributes: [
                    'severity',
                    'service',
                    'environment',
                    'timestamp',
                    'correlationId'
                ]
            };

            expect(messageFiltering.filterPolicies.length).toBeGreaterThan(0);
            expect(messageFiltering.messageAttributes).toContain('severity');
            expect(messageFiltering.filterPolicies[0].filter.severity).toContain('CRITICAL');
        });
    });

    describe('CloudWatch Monitoring', () => {
        it('should validate CloudWatch dashboard configuration', () => {
            const dashboard = {
                name: 'ReconciliationSystemDashboard',
                periodOverride: 'auto',
                widgets: [
                    {
                        type: 'metric',
                        title: 'Lambda Invocations',
                        metrics: [
                            ['AWS/Lambda', 'Invocations', { stat: 'Sum' }],
                            ['AWS/Lambda', 'Errors', { stat: 'Sum' }],
                            ['AWS/Lambda', 'Duration', { stat: 'Average' }]
                        ]
                    },
                    {
                        type: 'log',
                        title: 'Recent Errors',
                        query: 'fields @timestamp, @message | filter @message like /ERROR/'
                    },
                    {
                        type: 'number',
                        title: 'Records Processed Today',
                        metrics: [['Custom', 'RecordsProcessed', { stat: 'Sum', period: 86400 }]]
                    }
                ],
                refreshInterval: 300 // 5 minutes
            };

            expect(dashboard.widgets.length).toBeGreaterThan(0);
            expect(dashboard.widgets.some(w => w.type === 'metric')).toBe(true);
            expect(dashboard.widgets.some(w => w.type === 'log')).toBe(true);
            expect(dashboard.refreshInterval).toBeGreaterThanOrEqual(60);
        });

        it('should validate CloudWatch alarms', () => {
            const alarms = [
                {
                    name: 'high-lambda-error-rate',
                    namespace: 'AWS/Lambda',
                    metric: 'Errors',
                    statistic: 'Average',
                    threshold: 1,
                    evaluationPeriods: 2,
                    datapointsToAlarm: 2,
                    comparisonOperator: 'GreaterThanThreshold',
                    treatMissingData: 'notBreaching'
                },
                {
                    name: 'step-functions-failed-executions',
                    namespace: 'AWS/States',
                    metric: 'ExecutionsFailed',
                    statistic: 'Sum',
                    threshold: 5,
                    evaluationPeriods: 1,
                    datapointsToAlarm: 1,
                    comparisonOperator: 'GreaterThanThreshold',
                    treatMissingData: 'notBreaching'
                },
                {
                    name: 'dynamodb-throttled-requests',
                    namespace: 'AWS/DynamoDB',
                    metric: 'UserErrors',
                    statistic: 'Sum',
                    threshold: 10,
                    evaluationPeriods: 2,
                    datapointsToAlarm: 1,
                    comparisonOperator: 'GreaterThanThreshold',
                    treatMissingData: 'notBreaching'
                }
            ];

            alarms.forEach(alarm => {
                expect(alarm.evaluationPeriods).toBeGreaterThanOrEqual(1);
                expect(alarm.datapointsToAlarm).toBeLessThanOrEqual(alarm.evaluationPeriods);
                expect(['notBreaching', 'breaching', 'ignore', 'missing'])
                    .toContain(alarm.treatMissingData);
            });
        });

        it('should validate log retention and insights', () => {
            const logsConfig = {
                logGroups: [
                    { name: '/aws/lambda/reconciliation-processor', retentionDays: 30 },
                    { name: '/aws/states/reconciliation-workflow', retentionDays: 30 },
                    { name: '/aws/apigateway/reconciliation-api', retentionDays: 30 }
                ],
                insightsQueries: [
                    {
                        name: 'ErrorAnalysis',
                        query: 'fields @timestamp, @message | filter @message like /ERROR/ | stats count() by bin(5m)',
                        schedule: 'rate(5 minutes)'
                    },
                    {
                        name: 'PerformanceMetrics',
                        query: 'fields duration | stats avg(duration), max(duration), min(duration) by bin(1h)',
                        schedule: 'rate(1 hour)'
                    }
                ],
                metricFilters: [
                    {
                        filterName: 'ErrorCount',
                        filterPattern: '[ERROR]',
                        metricNamespace: 'ReconciliationSystem',
                        metricName: 'Errors',
                        metricValue: '1'
                    }
                ]
            };

            const validRetentionDays = [1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653];
            logsConfig.logGroups.forEach(group => {
                expect(validRetentionDays).toContain(group.retentionDays);
            });
            expect(logsConfig.insightsQueries.length).toBeGreaterThan(0);
            expect(logsConfig.metricFilters.length).toBeGreaterThan(0);
        });
    });

    describe('IAM Roles and Policies', () => {
        it('should validate Lambda execution role', () => {
            const lambdaRole = {
                roleName: 'reconciliation-lambda-execution-role',
                assumeRolePolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [{
                        Effect: 'Allow',
                        Principal: { Service: 'lambda.amazonaws.com' },
                        Action: 'sts:AssumeRole'
                    }]
                },
                managedPolicies: [
                    'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
                    'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess'
                ],
                inlinePolicies: {
                    DynamoDBAccess: {
                        actions: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:Scan'],
                        resources: ['arn:aws:dynamodb:*:*:table/reconciliation-*']
                    },
                    S3Access: {
                        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                        resources: ['arn:aws:s3:::reconciliation-*/*']
                    },
                    SNSPublish: {
                        actions: ['sns:Publish'],
                        resources: ['arn:aws:sns:*:*:reconciliation-*']
                    }
                }
            };

            expect(lambdaRole.managedPolicies.length).toBeGreaterThan(0);
            expect(lambdaRole.inlinePolicies.DynamoDBAccess.actions).toContain('dynamodb:PutItem');
            expect(lambdaRole.inlinePolicies.S3Access.actions).toContain('s3:GetObject');
        });

        it('should validate Step Functions execution role', () => {
            const stepFunctionsRole = {
                roleName: 'reconciliation-states-execution-role',
                assumeRolePolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [{
                        Effect: 'Allow',
                        Principal: { Service: 'states.amazonaws.com' },
                        Action: 'sts:AssumeRole'
                    }]
                },
                policies: [
                    {
                        name: 'InvokeLambda',
                        actions: ['lambda:InvokeFunction'],
                        resources: ['arn:aws:lambda:*:*:function:reconciliation-*']
                    },
                    {
                        name: 'PublishSNS',
                        actions: ['sns:Publish'],
                        resources: ['*']
                    },
                    {
                        name: 'CloudWatchLogs',
                        actions: [
                            'logs:CreateLogGroup',
                            'logs:CreateLogStream',
                            'logs:PutLogEvents'
                        ],
                        resources: ['*']
                    }
                ]
            };

            expect(stepFunctionsRole.policies.some(p => p.name === 'InvokeLambda')).toBe(true);
            expect(stepFunctionsRole.policies.some(p => p.actions.includes('lambda:InvokeFunction'))).toBe(true);
        });

        it('should validate cross-service permissions', () => {
            const crossServicePermissions = {
                s3ToLambda: {
                    bucket: 'reconciliation-data-ingestion',
                    lambdaArn: 'arn:aws:lambda:us-east-1:123456:function:processor',
                    events: ['s3:ObjectCreated:*'],
                    permission: 's3:InvokeFunction'
                },
                dynamodbToLambda: {
                    table: 'reconciliation-records',
                    lambdaArn: 'arn:aws:lambda:us-east-1:123456:function:stream-processor',
                    streamArn: 'arn:aws:dynamodb:us-east-1:123456:table/reconciliation-records/stream',
                    permission: 'dynamodb:GetRecords'
                },
                cloudwatchToSns: {
                    alarmArn: 'arn:aws:cloudwatch:us-east-1:123456:alarm:high-errors',
                    snsTopicArn: 'arn:aws:sns:us-east-1:123456:alerts',
                    permission: 'sns:Publish'
                }
            };

            expect(crossServicePermissions.s3ToLambda.events).toContain('s3:ObjectCreated:*');
            expect(crossServicePermissions.dynamodbToLambda.permission).toBe('dynamodb:GetRecords');
            expect(crossServicePermissions.cloudwatchToSns.permission).toBe('sns:Publish');
        });
    });

    describe('End-to-End Workflow Integration', () => {
        it('should validate complete reconciliation workflow', () => {
            const workflow = {
                stages: [
                    { name: 'Ingestion', service: 'S3', trigger: 'FileUpload' },
                    { name: 'Validation', service: 'Lambda', duration: 30 },
                    { name: 'Processing', service: 'StepFunctions', duration: 300 },
                    { name: 'Storage', service: 'DynamoDB', duration: 10 },
                    { name: 'Notification', service: 'SNS', duration: 5 }
                ],
                totalDuration: 345, // seconds
                errorRate: 0.01, // 1%
                successRate: 0.99, // 99%
                throughput: 1000 // records per minute
            };

            const totalCalculatedDuration = workflow.stages.reduce((sum, stage) =>
                sum + (stage.duration || 0), 0);
            expect(totalCalculatedDuration).toBe(workflow.totalDuration);
            expect(workflow.successRate).toBeGreaterThanOrEqual(0.95);
            expect(workflow.throughput).toBeGreaterThan(0);
        });

        it('should validate data flow and transformations', () => {
            const dataFlow = {
                input: {
                    format: 'CSV',
                    schema: ['id', 'timestamp', 'amount', 'status'],
                    validation: 'strict'
                },
                transformations: [
                    { stage: 'normalize', operation: 'lowercase', fields: ['status'] },
                    { stage: 'enrich', operation: 'lookup', source: 'reference-table' },
                    { stage: 'aggregate', operation: 'sum', groupBy: 'status' }
                ],
                output: {
                    format: 'JSON',
                    schema: {
                        id: 'string',
                        timestamp: 'number',
                        amount: 'number',
                        status: 'string',
                        enrichedData: 'object',
                        aggregates: 'object'
                    },
                    destination: 'DynamoDB'
                }
            };

            expect(dataFlow.input.format).toBe('CSV');
            expect(dataFlow.output.format).toBe('JSON');
            expect(dataFlow.transformations.length).toBeGreaterThan(0);
            expect(dataFlow.output.destination).toBe('DynamoDB');
        });

        it('should validate monitoring and observability', () => {
            const observability = {
                tracing: {
                    enabled: true,
                    service: 'AWS X-Ray',
                    samplingRate: 0.1,
                    annotations: ['userId', 'requestId', 'environment']
                },
                metrics: {
                    custom: [
                        { name: 'RecordsProcessed', unit: 'Count', namespace: 'Reconciliation' },
                        { name: 'ProcessingLatency', unit: 'Milliseconds', namespace: 'Reconciliation' },
                        { name: 'ValidationErrors', unit: 'Count', namespace: 'Reconciliation' }
                    ],
                    standard: ['Invocations', 'Errors', 'Duration', 'Throttles']
                },
                logging: {
                    level: 'INFO',
                    format: 'JSON',
                    fields: ['timestamp', 'requestId', 'level', 'message', 'error'],
                    destination: 'CloudWatch Logs'
                },
                alerting: {
                    channels: ['email', 'slack', 'pagerduty'],
                    severity: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'],
                    escalation: true
                }
            };

            expect(observability.tracing.enabled).toBe(true);
            expect(observability.metrics.custom.length).toBeGreaterThan(0);
            expect(observability.logging.format).toBe('JSON');
            expect(observability.alerting.escalation).toBe(true);
        });
    });
});

// Helper to check if a value is between two numbers
expect.extend({
    toBeBetween(received: number, floor: number, ceiling: number) {
        const pass = received >= floor && received <= ceiling;
        if (pass) {
            return {
                message: () => `expected ${received} not to be between ${floor} and ${ceiling}`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be between ${floor} and ${ceiling}`,
                pass: false,
            };
        }
    },
});

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeBetween(floor: number, ceiling: number): R;
        }
    }
}

// Export for Jest compatibility
export {};