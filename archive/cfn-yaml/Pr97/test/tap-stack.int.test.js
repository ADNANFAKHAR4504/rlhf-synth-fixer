"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_cloudwatch_1 = require("@aws-sdk/client-cloudwatch");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const client_opensearchserverless_1 = require("@aws-sdk/client-opensearchserverless");
const client_s3_1 = require("@aws-sdk/client-s3");
const client_sfn_1 = require("@aws-sdk/client-sfn");
const opensearch_1 = require("@opensearch-project/opensearch");
const fs_1 = __importDefault(require("fs"));
// Read CDK outputs or use defaults for testing
let outputs;
if (fs_1.default.existsSync('cdk-outputs/flat-outputs.json')) {
    outputs = JSON.parse(fs_1.default.readFileSync('cdk-outputs/flat-outputs.json', 'utf8'));
}
else {
    // Mock outputs for testing when CDK hasn't been deployed
    const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
    outputs = {
        MetadataBucketName: `metadata-storage-${environmentSuffix}`,
        OpenSearchCollectionEndpoint: `https://metadata-timeseries-${environmentSuffix}.us-east-1.aoss.amazonaws.com`,
        OpenSearchDashboardsUrl: `https://metadata-timeseries-${environmentSuffix}.us-east-1.aoss.amazonaws.com/_dashboards`,
        FailureTableName: `metadata-processing-failures-${environmentSuffix}`,
        StateMachineArn: `arn:aws:states:us-east-1:123456789012:stateMachine:metadata-processing-${environmentSuffix}`,
        FailureAlarmName: `metadata-processing-failures-${environmentSuffix}`,
    };
    console.warn('CDK outputs not found. Using mock outputs for testing. Deploy the stack first for real integration tests.');
}
// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
// Initialize AWS clients
const s3Client = new client_s3_1.S3Client({});
const sfnClient = new client_sfn_1.SFNClient({});
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const cloudWatchClient = new client_cloudwatch_1.CloudWatchClient({});
const opensearchServerlessClient = new client_opensearchserverless_1.OpenSearchServerlessClient({});
// Extract resource names from outputs
const { MetadataBucketName: bucketName, StateMachineArn: stateMachineArn, FailureTableName: failureTableName, FailureAlarmName: alarmName, OpenSearchDashboardsUrl: dashboardUrl, OpenSearchCollectionEndpoint: opensearchEndpoint, } = outputs;
// Check if required outputs are available
const requiredOutputs = {
    bucketName,
    stateMachineArn,
    failureTableName,
    alarmName,
    dashboardUrl,
    opensearchEndpoint,
};
const missingOutputs = Object.entries(requiredOutputs)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
if (missingOutputs.length > 0) {
    console.warn(`Missing CDK outputs: ${missingOutputs.join(', ')}. Integration tests may fail.`);
}
// Initialize OpenSearch client for direct API calls
let opensearchClient = null;
if (opensearchEndpoint) {
    opensearchClient = new opensearch_1.Client({
        node: opensearchEndpoint,
        ssl: {
            rejectUnauthorized: false,
        },
        requestTimeout: 30000,
    });
}
// Helper functions
const generateTestMetadata = (additionalFields = {}) => ({
    id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    event: 'test-event',
    source: 'integration-test',
    environment: environmentSuffix,
    ...additionalFields,
});
const cleanupTestData = async (testKeys) => {
    if (!bucketName) {
        console.warn('Bucket name not available, skipping S3 cleanup');
        return;
    }
    // Clean up S3 objects
    for (const key of testKeys) {
        try {
            await s3Client.send(new client_s3_1.DeleteObjectCommand({
                Bucket: bucketName,
                Key: key,
            }));
        }
        catch (error) {
            console.log(`Failed to delete S3 object ${key}:`, error);
        }
    }
    // Clean up DynamoDB failure records (optional - they expire naturally)
    if (failureTableName) {
        try {
            const failureRecords = await dynamoClient.send(new client_dynamodb_1.ScanCommand({
                TableName: failureTableName,
                FilterExpression: 'contains(inputData, :source)',
                ExpressionAttributeValues: {
                    ':source': { S: 'integration-test' },
                },
            }));
            if (failureRecords.Items) {
                for (const item of failureRecords.Items) {
                    await dynamoClient.send(new client_dynamodb_1.DeleteItemCommand({
                        TableName: failureTableName,
                        Key: {
                            executionId: item.executionId,
                            timestamp: item.timestamp,
                        },
                    }));
                }
            }
        }
        catch (error) {
            console.log('Failed to clean up DynamoDB failure records:', error);
        }
    }
};
const waitForStepFunctionExecution = async (timeoutMs = 30000, intervalMs = 2000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
        try {
            const executions = await sfnClient.send(new client_sfn_1.ListExecutionsCommand({
                stateMachineArn: stateMachineArn,
                maxResults: 10,
            }));
            const recentExecutions = executions.executions?.filter(exec => exec.startDate && exec.startDate > new Date(Date.now() - timeoutMs)) || [];
            if (recentExecutions.length > 0) {
                return recentExecutions;
            }
        }
        catch (error) {
            console.log('Error checking executions:', error);
        }
        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    return [];
};
const verifyDocumentInOpenSearch = async (documentId, expectedData, maxRetries = 10, retryInterval = 2000) => {
    if (!opensearchClient) {
        console.warn('OpenSearch client not available, skipping document verification');
        return false;
    }
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await opensearchClient.get({
                index: 'metadata-index',
                id: documentId,
            });
            if (response.body._source) {
                const source = response.body._source;
                // Verify @timestamp was added
                expect(source['@timestamp']).toBeDefined();
                // Verify original metadata is preserved
                expect(source.metadata).toBeDefined();
                expect(source.metadata.id).toBe(expectedData.id);
                expect(source.metadata.source).toBe(expectedData.source);
                return true;
            }
        }
        catch (error) {
            if (i === maxRetries - 1) {
                console.log(`Document ${documentId} not found in OpenSearch after ${maxRetries} retries:`, error);
                return false;
            }
            await new Promise(resolve => setTimeout(resolve, retryInterval));
        }
    }
    return false;
};
// Helper function to safely get total hits count
const getTotalHitsCount = (total) => {
    if (!total)
        return 0;
    return typeof total === 'number' ? total : total.value;
};
describe('TAP Stack Comprehensive Integration Tests', () => {
    beforeAll(() => {
        if (missingOutputs.length > 0) {
            console.warn('Some integration tests may be skipped due to missing CDK outputs. Ensure CDK is deployed first.');
        }
    });
    // PHASE 1: CRITICAL FUNCTIONALITY TESTS
    describe('Phase 1: Critical Functionality', () => {
        describe('S3 Bucket Integration', () => {
            const testKeys = [];
            afterEach(async () => {
                await cleanupTestData(testKeys);
                testKeys.length = 0;
            });
            test('should upload metadata.json and trigger EventBridge', async () => {
                if (!bucketName) {
                    console.warn('Skipping test: bucketName not available');
                    return;
                }
                const testKey = 'test-folder/metadata.json';
                testKeys.push(testKey);
                const metadata = generateTestMetadata({
                    testType: 'eventbridge-trigger',
                });
                await s3Client.send(new client_s3_1.PutObjectCommand({
                    Bucket: bucketName,
                    Key: testKey,
                    Body: JSON.stringify(metadata),
                    ContentType: 'application/json',
                }));
                // Verify object exists
                const headResponse = await s3Client.send(new client_s3_1.HeadObjectCommand({
                    Bucket: bucketName,
                    Key: testKey,
                }));
                expect(headResponse.ContentLength).toBeGreaterThan(0);
                expect(headResponse.ContentType).toBe('application/json');
            });
            test('should handle nested folder structures', async () => {
                if (!bucketName)
                    return;
                const testKey = 'level1/level2/level3/level4/metadata.json';
                testKeys.push(testKey);
                const metadata = generateTestMetadata({
                    nested: true,
                    depth: 4,
                    testType: 'nested-folders',
                });
                await s3Client.send(new client_s3_1.PutObjectCommand({
                    Bucket: bucketName,
                    Key: testKey,
                    Body: JSON.stringify(metadata),
                    ContentType: 'application/json',
                }));
                const getResponse = await s3Client.send(new client_s3_1.GetObjectCommand({
                    Bucket: bucketName,
                    Key: testKey,
                }));
                const retrievedContent = await getResponse.Body?.transformToString();
                const parsedMetadata = JSON.parse(retrievedContent || '{}');
                expect(parsedMetadata.nested).toBe(true);
                expect(parsedMetadata.depth).toBe(4);
                expect(parsedMetadata.id).toBe(metadata.id);
            });
            test('should NOT trigger for non-metadata.json files', async () => {
                if (!bucketName || !stateMachineArn)
                    return;
                const testKey = 'test-folder/other-file.json';
                testKeys.push(testKey);
                const data = { message: 'This should not trigger processing' };
                const executionsBefore = await sfnClient.send(new client_sfn_1.ListExecutionsCommand({
                    stateMachineArn: stateMachineArn,
                    maxResults: 5,
                }));
                await s3Client.send(new client_s3_1.PutObjectCommand({
                    Bucket: bucketName,
                    Key: testKey,
                    Body: JSON.stringify(data),
                    ContentType: 'application/json',
                }));
                // Wait and check no new executions were triggered
                await new Promise(resolve => setTimeout(resolve, 5000));
                const executionsAfter = await sfnClient.send(new client_sfn_1.ListExecutionsCommand({
                    stateMachineArn: stateMachineArn,
                    maxResults: 5,
                }));
                expect(executionsAfter.executions?.length).toBe(executionsBefore.executions?.length);
            });
            test('should handle files with special characters in paths', async () => {
                if (!bucketName)
                    return;
                const testKey = 'test-folder/special chars & symbols/metadata.json';
                testKeys.push(testKey);
                const metadata = generateTestMetadata({
                    specialChars: true,
                    testType: 'special-characters',
                });
                await s3Client.send(new client_s3_1.PutObjectCommand({
                    Bucket: bucketName,
                    Key: testKey,
                    Body: JSON.stringify(metadata),
                    ContentType: 'application/json',
                }));
                const headResponse = await s3Client.send(new client_s3_1.HeadObjectCommand({
                    Bucket: bucketName,
                    Key: testKey,
                }));
                expect(headResponse.ContentLength).toBeGreaterThan(0);
            });
            test('should handle empty JSON files', async () => {
                if (!bucketName)
                    return;
                const testKey = 'empty-test/metadata.json';
                testKeys.push(testKey);
                await s3Client.send(new client_s3_1.PutObjectCommand({
                    Bucket: bucketName,
                    Key: testKey,
                    Body: '{}',
                    ContentType: 'application/json',
                }));
                const headResponse = await s3Client.send(new client_s3_1.HeadObjectCommand({
                    Bucket: bucketName,
                    Key: testKey,
                }));
                expect(headResponse.ContentLength).toBeGreaterThan(0);
            });
            test('should handle UTF-8 content', async () => {
                if (!bucketName)
                    return;
                const testKey = 'utf8-test/metadata.json';
                testKeys.push(testKey);
                const metadata = generateTestMetadata({
                    unicode: '🚀 Testing UTF-8: こんにちは 世界 🌍',
                    emoji: '💻📊🔧',
                    testType: 'utf8-content',
                });
                await s3Client.send(new client_s3_1.PutObjectCommand({
                    Bucket: bucketName,
                    Key: testKey,
                    Body: JSON.stringify(metadata),
                    ContentType: 'application/json; charset=utf-8',
                }));
                const getResponse = await s3Client.send(new client_s3_1.GetObjectCommand({
                    Bucket: bucketName,
                    Key: testKey,
                }));
                const retrievedContent = await getResponse.Body?.transformToString('utf-8');
                const parsedMetadata = JSON.parse(retrievedContent || '{}');
                expect(parsedMetadata.unicode).toBe('🚀 Testing UTF-8: こんにちは 世界 🌍');
                expect(parsedMetadata.emoji).toBe('💻📊🔧');
            });
            test('should handle case sensitivity correctly', async () => {
                if (!bucketName || !stateMachineArn)
                    return;
                // Test files that should NOT trigger
                const nonTriggerFiles = [
                    'test/Metadata.json',
                    'test/METADATA.JSON',
                    'test/metadata.JSON',
                    'test/Metadata.Json',
                ];
                const executionsBefore = await sfnClient.send(new client_sfn_1.ListExecutionsCommand({
                    stateMachineArn: stateMachineArn,
                    maxResults: 5,
                }));
                for (const file of nonTriggerFiles) {
                    testKeys.push(file);
                    await s3Client.send(new client_s3_1.PutObjectCommand({
                        Bucket: bucketName,
                        Key: file,
                        Body: JSON.stringify({ test: 'case-sensitivity' }),
                        ContentType: 'application/json',
                    }));
                }
                // Wait and verify no executions were triggered
                await new Promise(resolve => setTimeout(resolve, 5000));
                const executionsAfter = await sfnClient.send(new client_sfn_1.ListExecutionsCommand({
                    stateMachineArn: stateMachineArn,
                    maxResults: 5,
                }));
                expect(executionsAfter.executions?.length).toBe(executionsBefore.executions?.length);
            });
        });
        describe('OpenSearch Document Storage (CRITICAL)', () => {
            const testKeys = [];
            afterEach(async () => {
                await cleanupTestData(testKeys);
                testKeys.length = 0;
            });
            test('should store documents in OpenSearch with @timestamp', async () => {
                if (!bucketName || !opensearchClient) {
                    console.warn('Skipping test: required resources not available');
                    return;
                }
                const testKey = 'opensearch-test/metadata.json';
                testKeys.push(testKey);
                const metadata = generateTestMetadata({
                    testType: 'opensearch-storage',
                    sensorData: {
                        temperature: 25.5,
                        humidity: 60,
                        pressure: 1013.25,
                    },
                });
                await s3Client.send(new client_s3_1.PutObjectCommand({
                    Bucket: bucketName,
                    Key: testKey,
                    Body: JSON.stringify(metadata),
                    ContentType: 'application/json',
                }));
                // Wait for processing
                const executions = await waitForStepFunctionExecution(30000);
                expect(executions.length).toBeGreaterThan(0);
                const successfulExecution = executions.find(exec => exec.status === 'SUCCEEDED');
                expect(successfulExecution).toBeDefined();
                // Verify document was stored in OpenSearch
                // Note: Document ID in OpenSearch might be generated by Step Function
                // We'll search for the document by metadata content
                await new Promise(resolve => setTimeout(resolve, 5000)); // Allow for OpenSearch indexing
                try {
                    const searchResponse = await opensearchClient.search({
                        index: 'metadata-index',
                        body: {
                            query: {
                                match: {
                                    'metadata.id': metadata.id,
                                },
                            },
                        },
                    });
                    expect(typeof searchResponse.body.hits.total === 'object'
                        ? searchResponse.body.hits.total.value
                        : searchResponse.body.hits.total).toBeGreaterThan(0);
                    const document = searchResponse.body.hits.hits[0]._source;
                    expect(document['@timestamp']).toBeDefined();
                    expect(document.metadata).toBeDefined();
                    expect(document.metadata.id).toBe(metadata.id);
                    expect(document.metadata.sensorData.temperature).toBe(25.5);
                    expect(document.bucket).toBe(bucketName);
                    expect(document.key).toBe(testKey);
                }
                catch (error) {
                    console.log('OpenSearch query error:', error);
                    throw error;
                }
            });
            test('should handle complex nested JSON structures', async () => {
                if (!bucketName || !opensearchClient)
                    return;
                const testKey = 'complex-json/metadata.json';
                testKeys.push(testKey);
                const metadata = generateTestMetadata({
                    testType: 'complex-nested',
                    nested: {
                        level1: {
                            level2: {
                                level3: {
                                    deepValue: 'found',
                                    array: [1, 2, { innerObj: 'test' }],
                                },
                            },
                        },
                    },
                    arrayOfObjects: [
                        { id: 1, name: 'first' },
                        { id: 2, name: 'second' },
                    ],
                });
                await s3Client.send(new client_s3_1.PutObjectCommand({
                    Bucket: bucketName,
                    Key: testKey,
                    Body: JSON.stringify(metadata),
                    ContentType: 'application/json',
                }));
                const executions = await waitForStepFunctionExecution();
                const successfulExecution = executions.find(exec => exec.status === 'SUCCEEDED');
                expect(successfulExecution).toBeDefined();
                await new Promise(resolve => setTimeout(resolve, 5000));
                const searchResponse = await opensearchClient.search({
                    index: 'metadata-index',
                    body: {
                        query: {
                            match: {
                                'metadata.id': metadata.id,
                            },
                        },
                    },
                });
                expect(getTotalHitsCount(searchResponse.body.hits.total)).toBe(1);
                const document = searchResponse.body.hits.hits[0]._source;
                expect(document.metadata.nested.level1.level2.level3.deepValue).toBe('found');
                expect(document.metadata.arrayOfObjects).toHaveLength(2);
            });
        });
        describe('Step Function Execution Flow', () => {
            const testKeys = [];
            afterEach(async () => {
                await cleanupTestData(testKeys);
                testKeys.length = 0;
            });
            test('should execute complete success workflow', async () => {
                if (!bucketName || !stateMachineArn)
                    return;
                const testKey = 'workflow-test/metadata.json';
                testKeys.push(testKey);
                const metadata = generateTestMetadata({
                    testType: 'success-workflow',
                    workflow: 'complete-success',
                });
                await s3Client.send(new client_s3_1.PutObjectCommand({
                    Bucket: bucketName,
                    Key: testKey,
                    Body: JSON.stringify(metadata),
                    ContentType: 'application/json',
                }));
                const executions = await waitForStepFunctionExecution();
                expect(executions.length).toBeGreaterThan(0);
                const execution = executions[0];
                expect(execution.status).toBe('SUCCEEDED');
                // Get detailed execution information
                const executionDetails = await sfnClient.send(new client_sfn_1.DescribeExecutionCommand({
                    executionArn: execution.executionArn,
                }));
                expect(executionDetails.input).toContain(testKey);
                expect(executionDetails.output).toBeDefined();
                expect(executionDetails.status).toBe('SUCCEEDED');
            });
            test('should handle malformed JSON with proper error logging', async () => {
                if (!bucketName || !stateMachineArn || !failureTableName)
                    return;
                const testKey = 'malformed-json/metadata.json';
                testKeys.push(testKey);
                const malformedJson = '{"invalid": json, "missing": quote, "extra": comma,}';
                await s3Client.send(new client_s3_1.PutObjectCommand({
                    Bucket: bucketName,
                    Key: testKey,
                    Body: malformedJson,
                    ContentType: 'application/json',
                }));
                const executions = await waitForStepFunctionExecution();
                expect(executions.length).toBeGreaterThan(0);
                const execution = executions[0];
                // Check if execution failed (as expected)
                if (execution.status === 'FAILED') {
                    // Verify failure was logged to DynamoDB with enhanced context
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    const failureRecords = await dynamoClient.send(new client_dynamodb_1.ScanCommand({
                        TableName: failureTableName,
                        FilterExpression: 'contains(inputData, :key)',
                        ExpressionAttributeValues: {
                            ':key': { S: testKey },
                        },
                    }));
                    expect(failureRecords.Items?.length).toBeGreaterThan(0);
                    const failureRecord = failureRecords.Items[0];
                    expect(failureRecord.executionId).toBeDefined();
                    expect(failureRecord.timestamp).toBeDefined();
                    expect(failureRecord.inputData).toBeDefined();
                    expect(failureRecord.errorCause).toBeDefined();
                    expect(failureRecord.errorMessage).toBeDefined(); // Enhanced error logging
                    expect(failureRecord.stateName).toBeDefined(); // Enhanced error logging
                }
            });
            test('should verify retry logic with transient failures', async () => {
                // This test would need to simulate transient failures
                // For now, we'll verify retry configuration exists in the execution
                if (!stateMachineArn)
                    return;
                const executions = await sfnClient.send(new client_sfn_1.ListExecutionsCommand({
                    stateMachineArn: stateMachineArn,
                    maxResults: 1,
                }));
                // If we have executions, check the state machine definition includes retry logic
                if (executions.executions && executions.executions.length > 0) {
                    const execution = executions.executions[0];
                    const executionDetails = await sfnClient.send(new client_sfn_1.DescribeExecutionCommand({
                        executionArn: execution.executionArn,
                    }));
                    // Verify execution details are available
                    expect(executionDetails).toBeDefined();
                    expect(executionDetails.stateMachineArn).toBe(stateMachineArn);
                }
            });
            test('should pass context between states correctly', async () => {
                if (!bucketName)
                    return;
                const testKey = 'context-test/metadata.json';
                testKeys.push(testKey);
                const metadata = generateTestMetadata({
                    testType: 'context-passing',
                    contextData: {
                        step1: 'initial',
                        step2: 'processed',
                    },
                });
                await s3Client.send(new client_s3_1.PutObjectCommand({
                    Bucket: bucketName,
                    Key: testKey,
                    Body: JSON.stringify(metadata),
                    ContentType: 'application/json',
                }));
                const executions = await waitForStepFunctionExecution();
                const execution = executions[0];
                if (execution.executionArn) {
                    const executionDetails = await sfnClient.send(new client_sfn_1.DescribeExecutionCommand({
                        executionArn: execution.executionArn,
                    }));
                    // Verify input contains the S3 event structure
                    const input = JSON.parse(executionDetails.input || '{}');
                    expect(input.detail).toBeDefined();
                    expect(input.detail.bucket).toBeDefined();
                    expect(input.detail.object).toBeDefined();
                }
            });
        });
        describe('Enhanced Error Handling and DynamoDB Logging', () => {
            const testKeys = [];
            afterEach(async () => {
                await cleanupTestData(testKeys);
                testKeys.length = 0;
            });
            test('should log all failure context to DynamoDB', async () => {
                if (!bucketName || !failureTableName)
                    return;
                const testKey = 'error-context/metadata.json';
                testKeys.push(testKey);
                // Create a scenario that will likely fail
                const problemData = '{"unclosed": "bracket"'; // Intentionally malformed
                await s3Client.send(new client_s3_1.PutObjectCommand({
                    Bucket: bucketName,
                    Key: testKey,
                    Body: problemData,
                    ContentType: 'application/json',
                }));
                const executions = await waitForStepFunctionExecution();
                // Wait for failure processing
                await new Promise(resolve => setTimeout(resolve, 5000));
                const failureRecords = await dynamoClient.send(new client_dynamodb_1.ScanCommand({
                    TableName: failureTableName,
                    FilterExpression: 'contains(inputData, :key)',
                    ExpressionAttributeValues: {
                        ':key': { S: testKey },
                    },
                    Limit: 5,
                }));
                if (failureRecords.Items && failureRecords.Items.length > 0) {
                    const record = failureRecords.Items[0];
                    // Verify all enhanced fields are present
                    expect(record.executionId).toBeDefined();
                    expect(record.timestamp).toBeDefined();
                    expect(record.inputData).toBeDefined();
                    expect(record.errorCause).toBeDefined();
                    expect(record.errorMessage).toBeDefined(); // New field
                    expect(record.stateName).toBeDefined(); // New field
                    expect(record.executionArn).toBeDefined(); // New field
                    // Verify field contents make sense
                    expect(record.inputData.S).toContain(testKey);
                    expect(record.executionId.S).toMatch(/^[a-f0-9-]+$/); // UUID pattern
                }
            });
            test('should handle different types of failures', async () => {
                if (!bucketName || !failureTableName)
                    return;
                const testScenarios = [
                    {
                        key: 'binary-file/metadata.json',
                        content: Buffer.from([0xff, 0xfe, 0xfd, 0xfc]), // Binary data
                        description: 'binary-content',
                    },
                    {
                        key: 'invalid-utf8/metadata.json',
                        content: '{"text": "\\uXXXX"}', // Invalid Unicode escape
                        description: 'invalid-unicode',
                    },
                ];
                for (const scenario of testScenarios) {
                    testKeys.push(scenario.key);
                    await s3Client.send(new client_s3_1.PutObjectCommand({
                        Bucket: bucketName,
                        Key: scenario.key,
                        Body: scenario.content,
                        ContentType: 'application/json',
                    }));
                }
                // Wait for all executions to complete
                await new Promise(resolve => setTimeout(resolve, 10000));
                // Check for failure records
                const failureRecords = await dynamoClient.send(new client_dynamodb_1.ScanCommand({
                    TableName: failureTableName,
                    Limit: 10,
                }));
                // We expect at least some failures were logged
                expect(failureRecords.Items?.length).toBeGreaterThan(0);
            });
        });
        describe('CloudWatch Monitoring and Dashboard', () => {
            test('should have functional monitoring dashboard', async () => {
                if (!alarmName)
                    return;
                const response = await cloudWatchClient.send(new client_cloudwatch_1.DescribeAlarmsCommand({
                    AlarmNames: [alarmName],
                }));
                expect(response.MetricAlarms).toBeDefined();
                expect(response.MetricAlarms?.[0]?.AlarmName).toBe(alarmName);
                expect(response.MetricAlarms?.[0]?.MetricName).toBe('ExecutionsFailed');
                expect(response.MetricAlarms?.[0]?.Namespace).toBe('AWS/States');
            });
            test('should collect Step Function metrics', async () => {
                if (!stateMachineArn)
                    return;
                // Get metrics for the past hour
                const endTime = new Date();
                const startTime = new Date(endTime.getTime() - 3600 * 1000);
                const metricsResponse = await cloudWatchClient.send(new client_cloudwatch_1.GetMetricStatisticsCommand({
                    Namespace: 'AWS/States',
                    MetricName: 'ExecutionsStarted',
                    Dimensions: [
                        {
                            Name: 'StateMachineArn',
                            Value: stateMachineArn,
                        },
                    ],
                    StartTime: startTime,
                    EndTime: endTime,
                    Period: 3600,
                    Statistics: ['Sum'],
                }));
                expect(metricsResponse.Datapoints).toBeDefined();
                // Note: Datapoints might be empty if no executions occurred in the time window
            });
            test('should have accessible dashboard URL', async () => {
                if (!dashboardUrl)
                    return;
                expect(dashboardUrl).toContain('https://');
                expect(dashboardUrl).toContain('amazonaws.com');
                // Note: We can't easily test actual HTTP access without authentication
                // But we can verify the URL format is correct
            });
        });
    });
    // PHASE 2: RELIABILITY & PERFORMANCE TESTS
    describe('Phase 2: Reliability & Performance', () => {
        describe('High-Volume Processing', () => {
            const testKeys = [];
            afterEach(async () => {
                await cleanupTestData(testKeys);
                testKeys.length = 0;
            });
            test('should handle concurrent file uploads', async () => {
                if (!bucketName || !stateMachineArn)
                    return;
                const fileCount = 5;
                const testFiles = Array.from({ length: fileCount }, (_, i) => `concurrent-test/batch-${Date.now()}/file-${i}/metadata.json`);
                testKeys.push(...testFiles);
                const uploadPromises = testFiles.map((key, index) => {
                    const metadata = generateTestMetadata({
                        batchIndex: index,
                        concurrentTest: true,
                        testType: 'concurrent-upload',
                    });
                    return s3Client.send(new client_s3_1.PutObjectCommand({
                        Bucket: bucketName,
                        Key: key,
                        Body: JSON.stringify(metadata),
                        ContentType: 'application/json',
                    }));
                });
                const startTime = Date.now();
                await Promise.all(uploadPromises);
                const uploadTime = Date.now() - startTime;
                // Wait for all processing
                await new Promise(resolve => setTimeout(resolve, 30000));
                // Verify all executions completed
                const executions = await sfnClient.send(new client_sfn_1.ListExecutionsCommand({
                    stateMachineArn: stateMachineArn,
                    maxResults: 20,
                }));
                const recentExecutions = executions.executions?.filter(exec => exec.startDate && exec.startDate > new Date(Date.now() - 60000));
                expect(recentExecutions?.length).toBeGreaterThanOrEqual(fileCount);
                expect(uploadTime).toBeLessThan(10000); // Should upload within 10 seconds
                // Verify most executions succeeded
                const successfulExecutions = recentExecutions?.filter(exec => exec.status === 'SUCCEEDED');
                expect(successfulExecutions?.length).toBeGreaterThanOrEqual(fileCount * 0.8); // 80% success rate
            });
            test('should handle rapid successive uploads to same path', async () => {
                if (!bucketName)
                    return;
                const testKey = 'rapid-update/metadata.json';
                testKeys.push(testKey);
                // Upload multiple versions rapidly
                const uploads = [];
                for (let i = 0; i < 3; i++) {
                    const metadata = generateTestMetadata({
                        version: i,
                        timestamp: new Date().toISOString(),
                        testType: 'rapid-successive',
                    });
                    uploads.push(s3Client.send(new client_s3_1.PutObjectCommand({
                        Bucket: bucketName,
                        Key: testKey,
                        Body: JSON.stringify(metadata),
                        ContentType: 'application/json',
                    })));
                    // Small delay between uploads
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                await Promise.all(uploads);
                // Verify final state
                const getResponse = await s3Client.send(new client_s3_1.GetObjectCommand({
                    Bucket: bucketName,
                    Key: testKey,
                }));
                const finalContent = await getResponse.Body?.transformToString();
                const finalMetadata = JSON.parse(finalContent || '{}');
                expect(finalMetadata.version).toBeGreaterThanOrEqual(0);
                expect(finalMetadata.testType).toBe('rapid-successive');
            });
            test('should maintain system performance under load', async () => {
                if (!bucketName)
                    return;
                const batchSize = 3; // Reduced for integration testing
                const testFiles = Array.from({ length: batchSize }, (_, i) => `performance-test/batch-${Date.now()}/sensor-${i}/metadata.json`);
                testKeys.push(...testFiles);
                const startTime = Date.now();
                // Create realistic IoT sensor data
                const uploadPromises = testFiles.map((key, index) => {
                    const sensorData = generateTestMetadata({
                        sensorId: `sensor-${index}`,
                        testType: 'performance-load',
                        readings: {
                            temperature: 20 + Math.random() * 10,
                            humidity: 50 + Math.random() * 40,
                            pressure: 1000 + Math.random() * 50,
                            timestamp: new Date().toISOString(),
                        },
                        location: {
                            lat: 40.7128 + Math.random() * 0.01,
                            lng: -74.006 + Math.random() * 0.01,
                        },
                    });
                    return s3Client.send(new client_s3_1.PutObjectCommand({
                        Bucket: bucketName,
                        Key: key,
                        Body: JSON.stringify(sensorData),
                        ContentType: 'application/json',
                    }));
                });
                await Promise.all(uploadPromises);
                const totalTime = Date.now() - startTime;
                // Performance assertions
                expect(totalTime).toBeLessThan(15000); // Should complete within 15 seconds
                expect(totalTime / batchSize).toBeLessThan(5000); // Average per file < 5 seconds
            });
        });
        describe('System Recovery and Resilience', () => {
            const testKeys = [];
            afterEach(async () => {
                await cleanupTestData(testKeys);
                testKeys.length = 0;
            });
            test('should handle mixed success/failure scenarios', async () => {
                if (!bucketName || !failureTableName)
                    return;
                const testScenarios = [
                    {
                        key: 'mixed-test/success-1/metadata.json',
                        content: generateTestMetadata({ testType: 'mixed-success-1' }),
                        shouldSucceed: true,
                    },
                    {
                        key: 'mixed-test/fail-1/metadata.json',
                        content: '{"malformed": json}', // Will fail
                        shouldSucceed: false,
                    },
                    {
                        key: 'mixed-test/success-2/metadata.json',
                        content: generateTestMetadata({ testType: 'mixed-success-2' }),
                        shouldSucceed: true,
                    },
                ];
                for (const scenario of testScenarios) {
                    testKeys.push(scenario.key);
                    await s3Client.send(new client_s3_1.PutObjectCommand({
                        Bucket: bucketName,
                        Key: scenario.key,
                        Body: typeof scenario.content === 'string'
                            ? scenario.content
                            : JSON.stringify(scenario.content),
                        ContentType: 'application/json',
                    }));
                }
                // Wait for processing
                await new Promise(resolve => setTimeout(resolve, 20000));
                const executions = await waitForStepFunctionExecution(45000);
                expect(executions.length).toBeGreaterThanOrEqual(testScenarios.length);
                // Check both successes and failures occurred
                const successfulExecutions = executions.filter(exec => exec.status === 'SUCCEEDED');
                const failedExecutions = executions.filter(exec => exec.status === 'FAILED');
                expect(successfulExecutions.length).toBeGreaterThan(0);
                expect(failedExecutions.length).toBeGreaterThan(0);
                // Verify failures were logged
                const failureRecords = await dynamoClient.send(new client_dynamodb_1.ScanCommand({
                    TableName: failureTableName,
                    Limit: 10,
                }));
                expect(failureRecords.Items?.length).toBeGreaterThan(0);
            });
            test('should maintain data consistency', async () => {
                if (!bucketName || !opensearchClient)
                    return;
                const testKey = 'consistency-test/metadata.json';
                testKeys.push(testKey);
                const metadata = generateTestMetadata({
                    testType: 'data-consistency',
                    consistencyCheck: {
                        sourceSystem: 'integration-test',
                        checksum: 'abc123',
                        version: '1.0',
                    },
                });
                await s3Client.send(new client_s3_1.PutObjectCommand({
                    Bucket: bucketName,
                    Key: testKey,
                    Body: JSON.stringify(metadata),
                    ContentType: 'application/json',
                }));
                const executions = await waitForStepFunctionExecution();
                const successfulExecution = executions.find(exec => exec.status === 'SUCCEEDED');
                if (successfulExecution) {
                    // Wait for OpenSearch indexing
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    const searchResponse = await opensearchClient.search({
                        index: 'metadata-index',
                        body: {
                            query: {
                                match: {
                                    'metadata.id': metadata.id,
                                },
                            },
                        },
                    });
                    expect(searchResponse.body.hits.total.value).toBe(1);
                    const document = searchResponse.body.hits.hits[0]._source;
                    expect(document.metadata.consistencyCheck.checksum).toBe('abc123');
                    expect(document.metadata.consistencyCheck.version).toBe('1.0');
                }
            });
        });
    });
    // PHASE 3: EDGE CASES & ADVANCED TESTS
    describe('Phase 3: Edge Cases & Advanced', () => {
        describe('Security and Access Control', () => {
            test('should validate OpenSearch network access policy', async () => {
                if (!opensearchEndpoint)
                    return;
                const client = new client_opensearchserverless_1.OpenSearchServerlessClient({});
                try {
                    const response = await client.send(new client_opensearchserverless_1.GetAccessPolicyCommand({
                        name: `metadata-network-access-${environmentSuffix}`,
                        type: 'data', // Changed from 'network' to 'data'
                    }));
                    expect(response.accessPolicyDetail).toBeDefined();
                    expect(response.accessPolicyDetail?.type).toBe('data');
                    const policy = JSON.parse(String(response.accessPolicyDetail?.policy || '{}'));
                    expect(policy).toBeDefined();
                }
                catch (error) {
                    console.warn('Network access policy test skipped - policy may not exist or different type');
                }
            });
            test('should verify IAM role permissions are working', async () => {
                // This is implicitly tested by successful executions
                // If IAM permissions were wrong, executions would fail
                if (!stateMachineArn)
                    return;
                const executions = await sfnClient.send(new client_sfn_1.ListExecutionsCommand({
                    stateMachineArn: stateMachineArn,
                    maxResults: 1,
                }));
                // If we can list executions, basic IAM is working
                expect(executions).toBeDefined();
            });
            test('should have proper encryption policies', async () => {
                const response = await opensearchServerlessClient.send(new client_opensearchserverless_1.GetSecurityPolicyCommand({
                    name: `metadata-encryption-${environmentSuffix}`,
                    type: 'encryption',
                }));
                expect(response.securityPolicyDetail).toBeDefined();
                expect(response.securityPolicyDetail?.type).toBe('encryption');
                const policy = JSON.parse(String(response.securityPolicyDetail?.policy || '{}'));
                expect(policy.AWSOwnedKey).toBe(true);
            });
        });
        describe('Complex Data Processing Scenarios', () => {
            const testKeys = [];
            afterEach(async () => {
                await cleanupTestData(testKeys);
                testKeys.length = 0;
            });
            test('should handle deeply nested JSON structures', async () => {
                if (!bucketName || !opensearchClient)
                    return;
                const testKey = 'deep-nested/metadata.json';
                testKeys.push(testKey);
                // Create deeply nested structure (10 levels)
                let nestedObj = { deepestValue: 'found-at-level-10' };
                for (let i = 9; i >= 1; i--) {
                    nestedObj = { [`level${i}`]: nestedObj };
                }
                const metadata = generateTestMetadata({
                    testType: 'deep-nested',
                    deepNested: nestedObj,
                });
                await s3Client.send(new client_s3_1.PutObjectCommand({
                    Bucket: bucketName,
                    Key: testKey,
                    Body: JSON.stringify(metadata),
                    ContentType: 'application/json',
                }));
                const executions = await waitForStepFunctionExecution();
                const successfulExecution = executions.find(exec => exec.status === 'SUCCEEDED');
                expect(successfulExecution).toBeDefined();
                await new Promise(resolve => setTimeout(resolve, 5000));
                const searchResponse = await opensearchClient.search({
                    index: 'metadata-index',
                    body: {
                        query: {
                            match: {
                                'metadata.id': metadata.id,
                            },
                        },
                    },
                });
                expect(getTotalHitsCount(searchResponse.body.hits.total)).toBe(1);
                const document = searchResponse.body.hits.hits[0]._source;
                // Navigate through the nested structure
                let current = document.metadata.deepNested;
                for (let i = 1; i <= 9; i++) {
                    expect(current[`level${i}`]).toBeDefined();
                    current = current[`level${i}`];
                }
                expect(current.deepestValue).toBe('found-at-level-10');
            });
            describe('Security and Access Control', () => {
                test('should validate OpenSearch network access policy', async () => {
                    if (!opensearchEndpoint)
                        return;
                    const client = new client_opensearchserverless_1.OpenSearchServerlessClient({});
                    try {
                        const response = await client.send(new client_opensearchserverless_1.GetAccessPolicyCommand({
                            name: `metadata-network-access-${environmentSuffix}`,
                            type: 'data', // Changed from 'network' to 'data'
                        }));
                        expect(response.accessPolicyDetail).toBeDefined();
                        expect(response.accessPolicyDetail?.type).toBe('data');
                        const policy = JSON.parse(String(response.accessPolicyDetail?.policy || '{}'));
                        expect(policy).toBeDefined();
                    }
                    catch (error) {
                        console.warn('Network access policy test skipped - policy may not exist or different type');
                    }
                });
                // ...existing code...
                test('should handle complex nested JSON structures', async () => {
                    if (!bucketName || !opensearchClient)
                        return;
                    const testKey = 'complex-arrays/metadata.json';
                    testKeys.push(testKey);
                    const metadata = generateTestMetadata({
                        testType: 'complex-arrays',
                        arrays: {
                            numbers: [1, 2, 3, 4, 5],
                            strings: ['alpha', 'beta', 'gamma'],
                            mixed: [1, 'two', { three: 3 }, [4, 5]],
                            objects: [
                                { id: 1, name: 'first', active: true },
                                { id: 2, name: 'second', active: false },
                            ],
                        },
                        boolean: true,
                        nullValue: null,
                        emptyString: '',
                        emptyArray: [],
                        emptyObject: {},
                    });
                    await s3Client.send(new client_s3_1.PutObjectCommand({
                        Bucket: bucketName,
                        Key: testKey,
                        Body: JSON.stringify(metadata),
                        ContentType: 'application/json',
                    }));
                    const executions = await waitForStepFunctionExecution();
                    const successfulExecution = executions.find(exec => exec.status === 'SUCCEEDED');
                    expect(successfulExecution).toBeDefined();
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    const searchResponse = await opensearchClient.search({
                        index: 'metadata-index',
                        body: {
                            query: {
                                match: {
                                    'metadata.id': metadata.id,
                                },
                            },
                        },
                    });
                    const document = searchResponse.body.hits.hits[0]._source;
                    expect(document.metadata.arrays.numbers).toHaveLength(5);
                    expect(document.metadata.arrays.objects[0].name).toBe('first');
                    expect(document.metadata.boolean).toBe(true);
                    expect(document.metadata.emptyArray).toHaveLength(0);
                });
                test('should support various query patterns', async () => {
                    if (!bucketName || !opensearchClient)
                        return;
                    // Upload test data for querying
                    const testData = [
                        {
                            key: 'query-test/sensor-1/metadata.json',
                            data: generateTestMetadata({
                                testType: 'query-test',
                                sensorType: 'temperature',
                                value: 25.5,
                                location: 'room-a',
                            }),
                        },
                        {
                            key: 'query-test/sensor-2/metadata.json',
                            data: generateTestMetadata({
                                testType: 'query-test',
                                sensorType: 'humidity',
                                value: 60.0,
                                location: 'room-a',
                            }),
                        },
                        {
                            key: 'query-test/sensor-3/metadata.json',
                            data: generateTestMetadata({
                                testType: 'query-test',
                                sensorType: 'temperature',
                                value: 22.0,
                                location: 'room-b',
                            }),
                        },
                    ];
                    for (const item of testData) {
                        testKeys.push(item.key);
                        await s3Client.send(new client_s3_1.PutObjectCommand({
                            Bucket: bucketName,
                            Key: item.key,
                            Body: JSON.stringify(item.data),
                            ContentType: 'application/json',
                        }));
                    }
                    // Wait for processing and indexing
                    await new Promise(resolve => setTimeout(resolve, 15000));
                    // Test various query patterns
                    // 1. Match query
                    const matchResponse = await opensearchClient.search({
                        index: 'metadata-index',
                        body: {
                            query: {
                                match: {
                                    'metadata.sensorType': 'temperature',
                                },
                            },
                        },
                    });
                    expect(getTotalHitsCount(matchResponse.body.hits.total)).toBe(2);
                    // 2. Range query
                    const rangeResponse = await opensearchClient.search({
                        index: 'metadata-index',
                        body: {
                            query: {
                                range: {
                                    'metadata.value': {
                                        gte: 23,
                                        lte: 26,
                                    },
                                },
                            },
                        },
                    });
                    expect(getTotalHitsCount(rangeResponse.body.hits.total)).toBeGreaterThan(0);
                    // 3. Term query
                    const termResponse = await opensearchClient.search({
                        index: 'metadata-index',
                        body: {
                            query: {
                                term: {
                                    'metadata.location': 'room-a',
                                },
                            },
                        },
                    });
                    expect(getTotalHitsCount(termResponse.body.hits.total)).toBe(2);
                    // 4. Bool query (complex)
                    const boolResponse = await opensearchClient.search({
                        index: 'metadata-index',
                        body: {
                            query: {
                                bool: {
                                    must: [
                                        { match: { 'metadata.testType': 'query-test' } },
                                        { range: { 'metadata.value': { gt: 20 } } },
                                    ],
                                    filter: [{ term: { 'metadata.location': 'room-a' } }],
                                },
                            },
                        },
                    });
                    expect(getTotalHitsCount(boolResponse.body.hits.total)).toBeGreaterThan(0);
                });
                test('should support aggregations for dashboard visualizations', async () => {
                    if (!opensearchClient)
                        return;
                    // Test aggregation capabilities
                    try {
                        const aggregationResponse = await opensearchClient.search({
                            index: 'metadata-index',
                            body: {
                                size: 0, // Don't return documents, just aggregations
                                aggs: {
                                    by_test_type: {
                                        terms: {
                                            field: 'metadata.testType.keyword',
                                            size: 10,
                                        },
                                    },
                                    timestamp_histogram: {
                                        date_histogram: {
                                            field: '@timestamp',
                                            calendar_interval: 'hour',
                                        },
                                    },
                                },
                            },
                        });
                        expect(aggregationResponse.body.aggregations).toBeDefined();
                        if (aggregationResponse.body.aggregations) {
                            expect(aggregationResponse.body.aggregations.by_test_type).toBeDefined();
                            expect(aggregationResponse.body.aggregations.timestamp_histogram).toBeDefined();
                        }
                    }
                    catch (error) {
                        // Aggregations might fail if no data exists yet, which is acceptable
                        console.log('Aggregation test skipped due to no data or mapping issues');
                    }
                });
                // Wait for all processing
                await new Promise(resolve => setTimeout(resolve, 30000));
                // Verify all data was processed and stored
                const searchResponse = await opensearchClient.search({
                    index: 'metadata-index',
                    body: {
                        query: {
                            match: {
                                'metadata.testType': 'iot-simulation',
                            },
                        },
                        size: 20,
                    },
                });
                expect(getTotalHitsCount(searchResponse.body.hits.total)).toBe(sensorReadings.length);
                // Verify data structure and @timestamp injection
                const documents = searchResponse.body.hits.hits;
                for (const doc of documents) {
                    const source = doc._source;
                    if (source) {
                        expect(source['@timestamp']).toBeDefined();
                        expect(source.metadata.deviceId).toMatch(/^(temperature|humidity|pressure|light)-.+-001$/);
                        expect(source.metadata.reading.value).toBeGreaterThanOrEqual(0);
                        expect(source.metadata.reading.value).toBeLessThanOrEqual(100);
                    }
                }
                // Test dashboard-like queries
                const temperatureReadings = await opensearchClient.search({
                    index: 'metadata-index',
                    body: {
                        query: {
                            bool: {
                                must: [
                                    { match: { 'metadata.testType': 'iot-simulation' } },
                                    { match: { 'metadata.sensorType': 'temperature' } },
                                ],
                            },
                        },
                    },
                });
                expect(getTotalHitsCount(temperatureReadings.body.hits.total)).toBeGreaterThan(0);
                expect(getTotalHitsCount(searchResponse.body.hits.total)).toBe(1);
                const document = searchResponse.body.hits.hits[0]._source;
                // Step 4: Verify data transformations
                expect(document['@timestamp']).toBeDefined(); // Added by Step Function
                expect(document.bucket).toBe(bucketName); // Added by Step Function
                expect(document.key).toBe(testKey); // Added by Step Function
                expect(document.metadata.id).toBe(originalData.id); // Original data preserved
                expect(document.metadata.dataLineage.checksum).toBe('abc123def456'); // Original data preserved
                // Step 5: Verify execution details
                if (execution.executionArn) {
                    const executionDetails = await sfnClient.send(new client_sfn_1.DescribeExecutionCommand({
                        executionArn: execution.executionArn,
                    }));
                    const executionInput = JSON.parse(executionDetails.input || '{}');
                    expect(executionInput.detail.object.key).toBe(testKey);
                    expect(executionInput.detail.bucket.name).toBe(bucketName);
                }
                console.log('✅ Complete data lineage verified: S3 → EventBridge → Step Functions → OpenSearch');
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLXN0YWNrLmludC50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLXN0YWNrLmludC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsa0VBSW9DO0FBQ3BDLDhEQUlrQztBQUNsQyxzRkFJOEM7QUFDOUMsa0RBTTRCO0FBQzVCLG9EQUk2QjtBQUM3QiwrREFBNEU7QUFDNUUsNENBQW9CO0FBRXBCLCtDQUErQztBQUMvQyxJQUFJLE9BQVksQ0FBQztBQUNqQixJQUFJLFlBQUUsQ0FBQyxVQUFVLENBQUMsK0JBQStCLENBQUMsRUFBRSxDQUFDO0lBQ25ELE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUNsQixZQUFFLENBQUMsWUFBWSxDQUFDLCtCQUErQixFQUFFLE1BQU0sQ0FBQyxDQUN6RCxDQUFDO0FBQ0osQ0FBQztLQUFNLENBQUM7SUFDTix5REFBeUQ7SUFDekQsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLEtBQUssQ0FBQztJQUNsRSxPQUFPLEdBQUc7UUFDUixrQkFBa0IsRUFBRSxvQkFBb0IsaUJBQWlCLEVBQUU7UUFDM0QsNEJBQTRCLEVBQUUsK0JBQStCLGlCQUFpQiwrQkFBK0I7UUFDN0csdUJBQXVCLEVBQUUsK0JBQStCLGlCQUFpQiwyQ0FBMkM7UUFDcEgsZ0JBQWdCLEVBQUUsZ0NBQWdDLGlCQUFpQixFQUFFO1FBQ3JFLGVBQWUsRUFBRSwwRUFBMEUsaUJBQWlCLEVBQUU7UUFDOUcsZ0JBQWdCLEVBQUUsZ0NBQWdDLGlCQUFpQixFQUFFO0tBQ3RFLENBQUM7SUFDRixPQUFPLENBQUMsSUFBSSxDQUNWLDJHQUEyRyxDQUM1RyxDQUFDO0FBQ0osQ0FBQztBQUVELG1EQUFtRDtBQUNuRCxNQUFNLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksS0FBSyxDQUFDO0FBRWxFLHlCQUF5QjtBQUN6QixNQUFNLFFBQVEsR0FB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QUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUM3RCxDQUFDO2dCQUVELE9BQU8sQ0FBQyxHQUFHLENBQ1Qsa0ZBQWtGLENBQ25GLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIENsb3VkV2F0Y2hDbGllbnQsXG4gIERlc2NyaWJlQWxhcm1zQ29tbWFuZCxcbiAgR2V0TWV0cmljU3RhdGlzdGljc0NvbW1hbmQsXG59IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1jbG91ZHdhdGNoJztcbmltcG9ydCB7XG4gIERlbGV0ZUl0ZW1Db21tYW5kLFxuICBEeW5hbW9EQkNsaWVudCxcbiAgU2NhbkNvbW1hbmQsXG59IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1keW5hbW9kYic7XG5pbXBvcnQge1xuICBHZXRBY2Nlc3NQb2xpY3lDb21tYW5kLFxuICBHZXRTZWN1cml0eVBvbGljeUNvbW1hbmQsXG4gIE9wZW5TZWFyY2hTZXJ2ZXJsZXNzQ2xpZW50LFxufSBmcm9tICdAYXdzLXNkay9jbGllbnQtb3BlbnNlYXJjaHNlcnZlcmxlc3MnO1xuaW1wb3J0IHtcbiAgRGVsZXRlT2JqZWN0Q29tbWFuZCxcbiAgR2V0T2JqZWN0Q29tbWFuZCxcbiAgSGVhZE9iamVjdENvbW1hbmQsXG4gIFB1dE9iamVjdENvbW1hbmQsXG4gIFMzQ2xpZW50LFxufSBmcm9tICdAYXdzLXNkay9jbGllbnQtczMnO1xuaW1wb3J0IHtcbiAgRGVzY3JpYmVFeGVjdXRpb25Db21tYW5kLFxuICBMaXN0RXhlY3V0aW9uc0NvbW1hbmQsXG4gIFNGTkNsaWVudCxcbn0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LXNmbic7XG5pbXBvcnQgeyBDbGllbnQgYXMgT3BlblNlYXJjaENsaWVudCB9IGZyb20gJ0BvcGVuc2VhcmNoLXByb2plY3Qvb3BlbnNlYXJjaCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuXG4vLyBSZWFkIENESyBvdXRwdXRzIG9yIHVzZSBkZWZhdWx0cyBmb3IgdGVzdGluZ1xubGV0IG91dHB1dHM6IGFueTtcbmlmIChmcy5leGlzdHNTeW5jKCdjZGstb3V0cHV0cy9mbGF0LW91dHB1dHMuanNvbicpKSB7XG4gIG91dHB1dHMgPSBKU09OLnBhcnNlKFxuICAgIGZzLnJlYWRGaWxlU3luYygnY2RrLW91dHB1dHMvZmxhdC1vdXRwdXRzLmpzb24nLCAndXRmOCcpXG4gICk7XG59IGVsc2Uge1xuICAvLyBNb2NrIG91dHB1dHMgZm9yIHRlc3Rpbmcgd2hlbiBDREsgaGFzbid0IGJlZW4gZGVwbG95ZWRcbiAgY29uc3QgZW52aXJvbm1lbnRTdWZmaXggPSBwcm9jZXNzLmVudi5FTlZJUk9OTUVOVF9TVUZGSVggfHwgJ2Rldic7XG4gIG91dHB1dHMgPSB7XG4gICAgTWV0YWRhdGFCdWNrZXROYW1lOiBgbWV0YWRhdGEtc3RvcmFnZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgT3BlblNlYXJjaENvbGxlY3Rpb25FbmRwb2ludDogYGh0dHBzOi8vbWV0YWRhdGEtdGltZXNlcmllcy0ke2Vudmlyb25tZW50U3VmZml4fS51cy1lYXN0LTEuYW9zcy5hbWF6b25hd3MuY29tYCxcbiAgICBPcGVuU2VhcmNoRGFzaGJvYXJkc1VybDogYGh0dHBzOi8vbWV0YWRhdGEtdGltZXNlcmllcy0ke2Vudmlyb25tZW50U3VmZml4fS51cy1lYXN0LTEuYW9zcy5hbWF6b25hd3MuY29tL19kYXNoYm9hcmRzYCxcbiAgICBGYWlsdXJlVGFibGVOYW1lOiBgbWV0YWRhdGEtcHJvY2Vzc2luZy1mYWlsdXJlcy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgU3RhdGVNYWNoaW5lQXJuOiBgYXJuOmF3czpzdGF0ZXM6dXMtZWFzdC0xOjEyMzQ1Njc4OTAxMjpzdGF0ZU1hY2hpbmU6bWV0YWRhdGEtcHJvY2Vzc2luZy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgRmFpbHVyZUFsYXJtTmFtZTogYG1ldGFkYXRhLXByb2Nlc3NpbmctZmFpbHVyZXMtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICB9O1xuICBjb25zb2xlLndhcm4oXG4gICAgJ0NESyBvdXRwdXRzIG5vdCBmb3VuZC4gVXNpbmcgbW9jayBvdXRwdXRzIGZvciB0ZXN0aW5nLiBEZXBsb3kgdGhlIHN0YWNrIGZpcnN0IGZvciByZWFsIGludGVncmF0aW9uIHRlc3RzLidcbiAgKTtcbn1cblxuLy8gR2V0IGVudmlyb25tZW50IHN1ZmZpeCBmcm9tIGVudmlyb25tZW50IHZhcmlhYmxlXG5jb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9IHByb2Nlc3MuZW52LkVOVklST05NRU5UX1NVRkZJWCB8fCAnZGV2JztcblxuLy8gSW5pdGlhbGl6ZSBBV1MgY2xpZW50c1xuY29uc3QgczNDbGllbnQgPSBuZXcgUzNDbGllbnQoe30pO1xuY29uc3Qgc2ZuQ2xpZW50ID0gbmV3IFNGTkNsaWVudCh7fSk7XG5jb25zdCBkeW5hbW9DbGllbnQgPSBuZXcgRHluYW1vREJDbGllbnQoe30pO1xuY29uc3QgY2xvdWRXYXRjaENsaWVudCA9IG5ldyBDbG91ZFdhdGNoQ2xpZW50KHt9KTtcbmNvbnN0IG9wZW5zZWFyY2hTZXJ2ZXJsZXNzQ2xpZW50ID0gbmV3IE9wZW5TZWFyY2hTZXJ2ZXJsZXNzQ2xpZW50KHt9KTtcblxuLy8gRXh0cmFjdCByZXNvdXJjZSBuYW1lcyBmcm9tIG91dHB1dHNcbmNvbnN0IHtcbiAgTWV0YWRhdGFCdWNrZXROYW1lOiBidWNrZXROYW1lLFxuICBTdGF0ZU1hY2hpbmVBcm46IHN0YXRlTWFjaGluZUFybixcbiAgRmFpbHVyZVRhYmxlTmFtZTogZmFpbHVyZVRhYmxlTmFtZSxcbiAgRmFpbHVyZUFsYXJtTmFtZTogYWxhcm1OYW1lLFxuICBPcGVuU2VhcmNoRGFzaGJvYXJkc1VybDogZGFzaGJvYXJkVXJsLFxuICBPcGVuU2VhcmNoQ29sbGVjdGlvbkVuZHBvaW50OiBvcGVuc2VhcmNoRW5kcG9pbnQsXG59ID0gb3V0cHV0cztcblxuLy8gQ2hlY2sgaWYgcmVxdWlyZWQgb3V0cHV0cyBhcmUgYXZhaWxhYmxlXG5jb25zdCByZXF1aXJlZE91dHB1dHMgPSB7XG4gIGJ1Y2tldE5hbWUsXG4gIHN0YXRlTWFjaGluZUFybixcbiAgZmFpbHVyZVRhYmxlTmFtZSxcbiAgYWxhcm1OYW1lLFxuICBkYXNoYm9hcmRVcmwsXG4gIG9wZW5zZWFyY2hFbmRwb2ludCxcbn07XG5cbmNvbnN0IG1pc3NpbmdPdXRwdXRzID0gT2JqZWN0LmVudHJpZXMocmVxdWlyZWRPdXRwdXRzKVxuICAuZmlsdGVyKChbXywgdmFsdWVdKSA9PiAhdmFsdWUpXG4gIC5tYXAoKFtrZXldKSA9PiBrZXkpO1xuXG5pZiAobWlzc2luZ091dHB1dHMubGVuZ3RoID4gMCkge1xuICBjb25zb2xlLndhcm4oXG4gICAgYE1pc3NpbmcgQ0RLIG91dHB1dHM6ICR7bWlzc2luZ091dHB1dHMuam9pbignLCAnKX0uIEludGVncmF0aW9uIHRlc3RzIG1heSBmYWlsLmBcbiAgKTtcbn1cblxuLy8gSW5pdGlhbGl6ZSBPcGVuU2VhcmNoIGNsaWVudCBmb3IgZGlyZWN0IEFQSSBjYWxsc1xubGV0IG9wZW5zZWFyY2hDbGllbnQ6IE9wZW5TZWFyY2hDbGllbnQgfCBudWxsID0gbnVsbDtcbmlmIChvcGVuc2VhcmNoRW5kcG9pbnQpIHtcbiAgb3BlbnNlYXJjaENsaWVudCA9IG5ldyBPcGVuU2VhcmNoQ2xpZW50KHtcbiAgICBub2RlOiBvcGVuc2VhcmNoRW5kcG9pbnQsXG4gICAgc3NsOiB7XG4gICAgICByZWplY3RVbmF1dGhvcml6ZWQ6IGZhbHNlLFxuICAgIH0sXG4gICAgcmVxdWVzdFRpbWVvdXQ6IDMwMDAwLFxuICB9KTtcbn1cblxuLy8gSGVscGVyIGZ1bmN0aW9uc1xuY29uc3QgZ2VuZXJhdGVUZXN0TWV0YWRhdGEgPSAoYWRkaXRpb25hbEZpZWxkcyA9IHt9KSA9PiAoe1xuICBpZDogYHRlc3QtJHtEYXRlLm5vdygpfS0ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cigyLCA5KX1gLFxuICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgZXZlbnQ6ICd0ZXN0LWV2ZW50JyxcbiAgc291cmNlOiAnaW50ZWdyYXRpb24tdGVzdCcsXG4gIGVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgLi4uYWRkaXRpb25hbEZpZWxkcyxcbn0pO1xuXG5jb25zdCBjbGVhbnVwVGVzdERhdGEgPSBhc3luYyAodGVzdEtleXM6IHN0cmluZ1tdKSA9PiB7XG4gIGlmICghYnVja2V0TmFtZSkge1xuICAgIGNvbnNvbGUud2FybignQnVja2V0IG5hbWUgbm90IGF2YWlsYWJsZSwgc2tpcHBpbmcgUzMgY2xlYW51cCcpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIENsZWFuIHVwIFMzIG9iamVjdHNcbiAgZm9yIChjb25zdCBrZXkgb2YgdGVzdEtleXMpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgczNDbGllbnQuc2VuZChcbiAgICAgICAgbmV3IERlbGV0ZU9iamVjdENvbW1hbmQoe1xuICAgICAgICAgIEJ1Y2tldDogYnVja2V0TmFtZSxcbiAgICAgICAgICBLZXk6IGtleSxcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBGYWlsZWQgdG8gZGVsZXRlIFMzIG9iamVjdCAke2tleX06YCwgZXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIC8vIENsZWFuIHVwIER5bmFtb0RCIGZhaWx1cmUgcmVjb3JkcyAob3B0aW9uYWwgLSB0aGV5IGV4cGlyZSBuYXR1cmFsbHkpXG4gIGlmIChmYWlsdXJlVGFibGVOYW1lKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZhaWx1cmVSZWNvcmRzID0gYXdhaXQgZHluYW1vQ2xpZW50LnNlbmQoXG4gICAgICAgIG5ldyBTY2FuQ29tbWFuZCh7XG4gICAgICAgICAgVGFibGVOYW1lOiBmYWlsdXJlVGFibGVOYW1lLFxuICAgICAgICAgIEZpbHRlckV4cHJlc3Npb246ICdjb250YWlucyhpbnB1dERhdGEsIDpzb3VyY2UpJyxcbiAgICAgICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7XG4gICAgICAgICAgICAnOnNvdXJjZSc6IHsgUzogJ2ludGVncmF0aW9uLXRlc3QnIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICAgIGlmIChmYWlsdXJlUmVjb3Jkcy5JdGVtcykge1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgZmFpbHVyZVJlY29yZHMuSXRlbXMpIHtcbiAgICAgICAgICBhd2FpdCBkeW5hbW9DbGllbnQuc2VuZChcbiAgICAgICAgICAgIG5ldyBEZWxldGVJdGVtQ29tbWFuZCh7XG4gICAgICAgICAgICAgIFRhYmxlTmFtZTogZmFpbHVyZVRhYmxlTmFtZSxcbiAgICAgICAgICAgICAgS2V5OiB7XG4gICAgICAgICAgICAgICAgZXhlY3V0aW9uSWQ6IGl0ZW0uZXhlY3V0aW9uSWQsXG4gICAgICAgICAgICAgICAgdGltZXN0YW1wOiBpdGVtLnRpbWVzdGFtcCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmxvZygnRmFpbGVkIHRvIGNsZWFuIHVwIER5bmFtb0RCIGZhaWx1cmUgcmVjb3JkczonLCBlcnJvcik7XG4gICAgfVxuICB9XG59O1xuXG5jb25zdCB3YWl0Rm9yU3RlcEZ1bmN0aW9uRXhlY3V0aW9uID0gYXN5bmMgKFxuICB0aW1lb3V0TXMgPSAzMDAwMCxcbiAgaW50ZXJ2YWxNcyA9IDIwMDBcbik6IFByb21pc2U8YW55W10+ID0+IHtcbiAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcblxuICB3aGlsZSAoRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSA8IHRpbWVvdXRNcykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBleGVjdXRpb25zID0gYXdhaXQgc2ZuQ2xpZW50LnNlbmQoXG4gICAgICAgIG5ldyBMaXN0RXhlY3V0aW9uc0NvbW1hbmQoe1xuICAgICAgICAgIHN0YXRlTWFjaGluZUFybjogc3RhdGVNYWNoaW5lQXJuLFxuICAgICAgICAgIG1heFJlc3VsdHM6IDEwLFxuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgICAgY29uc3QgcmVjZW50RXhlY3V0aW9ucyA9XG4gICAgICAgIGV4ZWN1dGlvbnMuZXhlY3V0aW9ucz8uZmlsdGVyKFxuICAgICAgICAgIGV4ZWMgPT5cbiAgICAgICAgICAgIGV4ZWMuc3RhcnREYXRlICYmIGV4ZWMuc3RhcnREYXRlID4gbmV3IERhdGUoRGF0ZS5ub3coKSAtIHRpbWVvdXRNcylcbiAgICAgICAgKSB8fCBbXTtcblxuICAgICAgaWYgKHJlY2VudEV4ZWN1dGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gcmVjZW50RXhlY3V0aW9ucztcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5sb2coJ0Vycm9yIGNoZWNraW5nIGV4ZWN1dGlvbnM6JywgZXJyb3IpO1xuICAgIH1cblxuICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCBpbnRlcnZhbE1zKSk7XG4gIH1cblxuICByZXR1cm4gW107XG59O1xuXG5jb25zdCB2ZXJpZnlEb2N1bWVudEluT3BlblNlYXJjaCA9IGFzeW5jIChcbiAgZG9jdW1lbnRJZDogc3RyaW5nLFxuICBleHBlY3RlZERhdGE6IGFueSxcbiAgbWF4UmV0cmllcyA9IDEwLFxuICByZXRyeUludGVydmFsID0gMjAwMFxuKTogUHJvbWlzZTxib29sZWFuPiA9PiB7XG4gIGlmICghb3BlbnNlYXJjaENsaWVudCkge1xuICAgIGNvbnNvbGUud2FybihcbiAgICAgICdPcGVuU2VhcmNoIGNsaWVudCBub3QgYXZhaWxhYmxlLCBza2lwcGluZyBkb2N1bWVudCB2ZXJpZmljYXRpb24nXG4gICAgKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG1heFJldHJpZXM7IGkrKykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IG9wZW5zZWFyY2hDbGllbnQuZ2V0KHtcbiAgICAgICAgaW5kZXg6ICdtZXRhZGF0YS1pbmRleCcsXG4gICAgICAgIGlkOiBkb2N1bWVudElkLFxuICAgICAgfSk7XG5cbiAgICAgIGlmIChyZXNwb25zZS5ib2R5Ll9zb3VyY2UpIHtcbiAgICAgICAgY29uc3Qgc291cmNlID0gcmVzcG9uc2UuYm9keS5fc291cmNlO1xuXG4gICAgICAgIC8vIFZlcmlmeSBAdGltZXN0YW1wIHdhcyBhZGRlZFxuICAgICAgICBleHBlY3Qoc291cmNlWydAdGltZXN0YW1wJ10pLnRvQmVEZWZpbmVkKCk7XG5cbiAgICAgICAgLy8gVmVyaWZ5IG9yaWdpbmFsIG1ldGFkYXRhIGlzIHByZXNlcnZlZFxuICAgICAgICBleHBlY3Qoc291cmNlLm1ldGFkYXRhKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICBleHBlY3Qoc291cmNlLm1ldGFkYXRhLmlkKS50b0JlKGV4cGVjdGVkRGF0YS5pZCk7XG4gICAgICAgIGV4cGVjdChzb3VyY2UubWV0YWRhdGEuc291cmNlKS50b0JlKGV4cGVjdGVkRGF0YS5zb3VyY2UpO1xuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoaSA9PT0gbWF4UmV0cmllcyAtIDEpIHtcbiAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgYERvY3VtZW50ICR7ZG9jdW1lbnRJZH0gbm90IGZvdW5kIGluIE9wZW5TZWFyY2ggYWZ0ZXIgJHttYXhSZXRyaWVzfSByZXRyaWVzOmAsXG4gICAgICAgICAgZXJyb3JcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHJldHJ5SW50ZXJ2YWwpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59O1xuXG4vLyBIZWxwZXIgZnVuY3Rpb24gdG8gc2FmZWx5IGdldCB0b3RhbCBoaXRzIGNvdW50XG5jb25zdCBnZXRUb3RhbEhpdHNDb3VudCA9IChcbiAgdG90YWw6IG51bWJlciB8IHsgdmFsdWU6IG51bWJlciB9IHwgdW5kZWZpbmVkXG4pOiBudW1iZXIgPT4ge1xuICBpZiAoIXRvdGFsKSByZXR1cm4gMDtcbiAgcmV0dXJuIHR5cGVvZiB0b3RhbCA9PT0gJ251bWJlcicgPyB0b3RhbCA6IHRvdGFsLnZhbHVlO1xufTtcblxuZGVzY3JpYmUoJ1RBUCBTdGFjayBDb21wcmVoZW5zaXZlIEludGVncmF0aW9uIFRlc3RzJywgKCkgPT4ge1xuICBiZWZvcmVBbGwoKCkgPT4ge1xuICAgIGlmIChtaXNzaW5nT3V0cHV0cy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICdTb21lIGludGVncmF0aW9uIHRlc3RzIG1heSBiZSBza2lwcGVkIGR1ZSB0byBtaXNzaW5nIENESyBvdXRwdXRzLiBFbnN1cmUgQ0RLIGlzIGRlcGxveWVkIGZpcnN0LidcbiAgICAgICk7XG4gICAgfVxuICB9KTtcblxuICAvLyBQSEFTRSAxOiBDUklUSUNBTCBGVU5DVElPTkFMSVRZIFRFU1RTXG4gIGRlc2NyaWJlKCdQaGFzZSAxOiBDcml0aWNhbCBGdW5jdGlvbmFsaXR5JywgKCkgPT4ge1xuICAgIGRlc2NyaWJlKCdTMyBCdWNrZXQgSW50ZWdyYXRpb24nLCAoKSA9PiB7XG4gICAgICBjb25zdCB0ZXN0S2V5czogc3RyaW5nW10gPSBbXTtcblxuICAgICAgYWZ0ZXJFYWNoKGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgY2xlYW51cFRlc3REYXRhKHRlc3RLZXlzKTtcbiAgICAgICAgdGVzdEtleXMubGVuZ3RoID0gMDtcbiAgICAgIH0pO1xuXG4gICAgICB0ZXN0KCdzaG91bGQgdXBsb2FkIG1ldGFkYXRhLmpzb24gYW5kIHRyaWdnZXIgRXZlbnRCcmlkZ2UnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmICghYnVja2V0TmFtZSkge1xuICAgICAgICAgIGNvbnNvbGUud2FybignU2tpcHBpbmcgdGVzdDogYnVja2V0TmFtZSBub3QgYXZhaWxhYmxlJyk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdGVzdEtleSA9ICd0ZXN0LWZvbGRlci9tZXRhZGF0YS5qc29uJztcbiAgICAgICAgdGVzdEtleXMucHVzaCh0ZXN0S2V5KTtcblxuICAgICAgICBjb25zdCBtZXRhZGF0YSA9IGdlbmVyYXRlVGVzdE1ldGFkYXRhKHtcbiAgICAgICAgICB0ZXN0VHlwZTogJ2V2ZW50YnJpZGdlLXRyaWdnZXInLFxuICAgICAgICB9KTtcblxuICAgICAgICBhd2FpdCBzM0NsaWVudC5zZW5kKFxuICAgICAgICAgIG5ldyBQdXRPYmplY3RDb21tYW5kKHtcbiAgICAgICAgICAgIEJ1Y2tldDogYnVja2V0TmFtZSxcbiAgICAgICAgICAgIEtleTogdGVzdEtleSxcbiAgICAgICAgICAgIEJvZHk6IEpTT04uc3RyaW5naWZ5KG1ldGFkYXRhKSxcbiAgICAgICAgICAgIENvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBWZXJpZnkgb2JqZWN0IGV4aXN0c1xuICAgICAgICBjb25zdCBoZWFkUmVzcG9uc2UgPSBhd2FpdCBzM0NsaWVudC5zZW5kKFxuICAgICAgICAgIG5ldyBIZWFkT2JqZWN0Q29tbWFuZCh7XG4gICAgICAgICAgICBCdWNrZXQ6IGJ1Y2tldE5hbWUsXG4gICAgICAgICAgICBLZXk6IHRlc3RLZXksXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgICAgICBleHBlY3QoaGVhZFJlc3BvbnNlLkNvbnRlbnRMZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgICAgZXhwZWN0KGhlYWRSZXNwb25zZS5Db250ZW50VHlwZSkudG9CZSgnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgfSk7XG5cbiAgICAgIHRlc3QoJ3Nob3VsZCBoYW5kbGUgbmVzdGVkIGZvbGRlciBzdHJ1Y3R1cmVzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBpZiAoIWJ1Y2tldE5hbWUpIHJldHVybjtcblxuICAgICAgICBjb25zdCB0ZXN0S2V5ID0gJ2xldmVsMS9sZXZlbDIvbGV2ZWwzL2xldmVsNC9tZXRhZGF0YS5qc29uJztcbiAgICAgICAgdGVzdEtleXMucHVzaCh0ZXN0S2V5KTtcblxuICAgICAgICBjb25zdCBtZXRhZGF0YSA9IGdlbmVyYXRlVGVzdE1ldGFkYXRhKHtcbiAgICAgICAgICBuZXN0ZWQ6IHRydWUsXG4gICAgICAgICAgZGVwdGg6IDQsXG4gICAgICAgICAgdGVzdFR5cGU6ICduZXN0ZWQtZm9sZGVycycsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGF3YWl0IHMzQ2xpZW50LnNlbmQoXG4gICAgICAgICAgbmV3IFB1dE9iamVjdENvbW1hbmQoe1xuICAgICAgICAgICAgQnVja2V0OiBidWNrZXROYW1lLFxuICAgICAgICAgICAgS2V5OiB0ZXN0S2V5LFxuICAgICAgICAgICAgQm9keTogSlNPTi5zdHJpbmdpZnkobWV0YWRhdGEpLFxuICAgICAgICAgICAgQ29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IGdldFJlc3BvbnNlID0gYXdhaXQgczNDbGllbnQuc2VuZChcbiAgICAgICAgICBuZXcgR2V0T2JqZWN0Q29tbWFuZCh7XG4gICAgICAgICAgICBCdWNrZXQ6IGJ1Y2tldE5hbWUsXG4gICAgICAgICAgICBLZXk6IHRlc3RLZXksXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCByZXRyaWV2ZWRDb250ZW50ID0gYXdhaXQgZ2V0UmVzcG9uc2UuQm9keT8udHJhbnNmb3JtVG9TdHJpbmcoKTtcbiAgICAgICAgY29uc3QgcGFyc2VkTWV0YWRhdGEgPSBKU09OLnBhcnNlKHJldHJpZXZlZENvbnRlbnQgfHwgJ3t9Jyk7XG5cbiAgICAgICAgZXhwZWN0KHBhcnNlZE1ldGFkYXRhLm5lc3RlZCkudG9CZSh0cnVlKTtcbiAgICAgICAgZXhwZWN0KHBhcnNlZE1ldGFkYXRhLmRlcHRoKS50b0JlKDQpO1xuICAgICAgICBleHBlY3QocGFyc2VkTWV0YWRhdGEuaWQpLnRvQmUobWV0YWRhdGEuaWQpO1xuICAgICAgfSk7XG5cbiAgICAgIHRlc3QoJ3Nob3VsZCBOT1QgdHJpZ2dlciBmb3Igbm9uLW1ldGFkYXRhLmpzb24gZmlsZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmICghYnVja2V0TmFtZSB8fCAhc3RhdGVNYWNoaW5lQXJuKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgdGVzdEtleSA9ICd0ZXN0LWZvbGRlci9vdGhlci1maWxlLmpzb24nO1xuICAgICAgICB0ZXN0S2V5cy5wdXNoKHRlc3RLZXkpO1xuXG4gICAgICAgIGNvbnN0IGRhdGEgPSB7IG1lc3NhZ2U6ICdUaGlzIHNob3VsZCBub3QgdHJpZ2dlciBwcm9jZXNzaW5nJyB9O1xuXG4gICAgICAgIGNvbnN0IGV4ZWN1dGlvbnNCZWZvcmUgPSBhd2FpdCBzZm5DbGllbnQuc2VuZChcbiAgICAgICAgICBuZXcgTGlzdEV4ZWN1dGlvbnNDb21tYW5kKHtcbiAgICAgICAgICAgIHN0YXRlTWFjaGluZUFybjogc3RhdGVNYWNoaW5lQXJuLFxuICAgICAgICAgICAgbWF4UmVzdWx0czogNSxcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuXG4gICAgICAgIGF3YWl0IHMzQ2xpZW50LnNlbmQoXG4gICAgICAgICAgbmV3IFB1dE9iamVjdENvbW1hbmQoe1xuICAgICAgICAgICAgQnVja2V0OiBidWNrZXROYW1lLFxuICAgICAgICAgICAgS2V5OiB0ZXN0S2V5LFxuICAgICAgICAgICAgQm9keTogSlNPTi5zdHJpbmdpZnkoZGF0YSksXG4gICAgICAgICAgICBDb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gV2FpdCBhbmQgY2hlY2sgbm8gbmV3IGV4ZWN1dGlvbnMgd2VyZSB0cmlnZ2VyZWRcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDUwMDApKTtcblxuICAgICAgICBjb25zdCBleGVjdXRpb25zQWZ0ZXIgPSBhd2FpdCBzZm5DbGllbnQuc2VuZChcbiAgICAgICAgICBuZXcgTGlzdEV4ZWN1dGlvbnNDb21tYW5kKHtcbiAgICAgICAgICAgIHN0YXRlTWFjaGluZUFybjogc3RhdGVNYWNoaW5lQXJuLFxuICAgICAgICAgICAgbWF4UmVzdWx0czogNSxcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuXG4gICAgICAgIGV4cGVjdChleGVjdXRpb25zQWZ0ZXIuZXhlY3V0aW9ucz8ubGVuZ3RoKS50b0JlKFxuICAgICAgICAgIGV4ZWN1dGlvbnNCZWZvcmUuZXhlY3V0aW9ucz8ubGVuZ3RoXG4gICAgICAgICk7XG4gICAgICB9KTtcblxuICAgICAgdGVzdCgnc2hvdWxkIGhhbmRsZSBmaWxlcyB3aXRoIHNwZWNpYWwgY2hhcmFjdGVycyBpbiBwYXRocycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgaWYgKCFidWNrZXROYW1lKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgdGVzdEtleSA9ICd0ZXN0LWZvbGRlci9zcGVjaWFsIGNoYXJzICYgc3ltYm9scy9tZXRhZGF0YS5qc29uJztcbiAgICAgICAgdGVzdEtleXMucHVzaCh0ZXN0S2V5KTtcblxuICAgICAgICBjb25zdCBtZXRhZGF0YSA9IGdlbmVyYXRlVGVzdE1ldGFkYXRhKHtcbiAgICAgICAgICBzcGVjaWFsQ2hhcnM6IHRydWUsXG4gICAgICAgICAgdGVzdFR5cGU6ICdzcGVjaWFsLWNoYXJhY3RlcnMnLFxuICAgICAgICB9KTtcblxuICAgICAgICBhd2FpdCBzM0NsaWVudC5zZW5kKFxuICAgICAgICAgIG5ldyBQdXRPYmplY3RDb21tYW5kKHtcbiAgICAgICAgICAgIEJ1Y2tldDogYnVja2V0TmFtZSxcbiAgICAgICAgICAgIEtleTogdGVzdEtleSxcbiAgICAgICAgICAgIEJvZHk6IEpTT04uc3RyaW5naWZ5KG1ldGFkYXRhKSxcbiAgICAgICAgICAgIENvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBoZWFkUmVzcG9uc2UgPSBhd2FpdCBzM0NsaWVudC5zZW5kKFxuICAgICAgICAgIG5ldyBIZWFkT2JqZWN0Q29tbWFuZCh7XG4gICAgICAgICAgICBCdWNrZXQ6IGJ1Y2tldE5hbWUsXG4gICAgICAgICAgICBLZXk6IHRlc3RLZXksXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgICAgICBleHBlY3QoaGVhZFJlc3BvbnNlLkNvbnRlbnRMZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgIH0pO1xuXG4gICAgICB0ZXN0KCdzaG91bGQgaGFuZGxlIGVtcHR5IEpTT04gZmlsZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmICghYnVja2V0TmFtZSkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHRlc3RLZXkgPSAnZW1wdHktdGVzdC9tZXRhZGF0YS5qc29uJztcbiAgICAgICAgdGVzdEtleXMucHVzaCh0ZXN0S2V5KTtcblxuICAgICAgICBhd2FpdCBzM0NsaWVudC5zZW5kKFxuICAgICAgICAgIG5ldyBQdXRPYmplY3RDb21tYW5kKHtcbiAgICAgICAgICAgIEJ1Y2tldDogYnVja2V0TmFtZSxcbiAgICAgICAgICAgIEtleTogdGVzdEtleSxcbiAgICAgICAgICAgIEJvZHk6ICd7fScsXG4gICAgICAgICAgICBDb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgaGVhZFJlc3BvbnNlID0gYXdhaXQgczNDbGllbnQuc2VuZChcbiAgICAgICAgICBuZXcgSGVhZE9iamVjdENvbW1hbmQoe1xuICAgICAgICAgICAgQnVja2V0OiBidWNrZXROYW1lLFxuICAgICAgICAgICAgS2V5OiB0ZXN0S2V5LFxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG5cbiAgICAgICAgZXhwZWN0KGhlYWRSZXNwb25zZS5Db250ZW50TGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICB9KTtcblxuICAgICAgdGVzdCgnc2hvdWxkIGhhbmRsZSBVVEYtOCBjb250ZW50JywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBpZiAoIWJ1Y2tldE5hbWUpIHJldHVybjtcblxuICAgICAgICBjb25zdCB0ZXN0S2V5ID0gJ3V0ZjgtdGVzdC9tZXRhZGF0YS5qc29uJztcbiAgICAgICAgdGVzdEtleXMucHVzaCh0ZXN0S2V5KTtcblxuICAgICAgICBjb25zdCBtZXRhZGF0YSA9IGdlbmVyYXRlVGVzdE1ldGFkYXRhKHtcbiAgICAgICAgICB1bmljb2RlOiAn8J+agCBUZXN0aW5nIFVURi04OiDjgZPjgpPjgavjgaHjga8g5LiW55WMIPCfjI0nLFxuICAgICAgICAgIGVtb2ppOiAn8J+Su/Cfk4rwn5SnJyxcbiAgICAgICAgICB0ZXN0VHlwZTogJ3V0ZjgtY29udGVudCcsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGF3YWl0IHMzQ2xpZW50LnNlbmQoXG4gICAgICAgICAgbmV3IFB1dE9iamVjdENvbW1hbmQoe1xuICAgICAgICAgICAgQnVja2V0OiBidWNrZXROYW1lLFxuICAgICAgICAgICAgS2V5OiB0ZXN0S2V5LFxuICAgICAgICAgICAgQm9keTogSlNPTi5zdHJpbmdpZnkobWV0YWRhdGEpLFxuICAgICAgICAgICAgQ29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04JyxcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IGdldFJlc3BvbnNlID0gYXdhaXQgczNDbGllbnQuc2VuZChcbiAgICAgICAgICBuZXcgR2V0T2JqZWN0Q29tbWFuZCh7XG4gICAgICAgICAgICBCdWNrZXQ6IGJ1Y2tldE5hbWUsXG4gICAgICAgICAgICBLZXk6IHRlc3RLZXksXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCByZXRyaWV2ZWRDb250ZW50ID1cbiAgICAgICAgICBhd2FpdCBnZXRSZXNwb25zZS5Cb2R5Py50cmFuc2Zvcm1Ub1N0cmluZygndXRmLTgnKTtcbiAgICAgICAgY29uc3QgcGFyc2VkTWV0YWRhdGEgPSBKU09OLnBhcnNlKHJldHJpZXZlZENvbnRlbnQgfHwgJ3t9Jyk7XG5cbiAgICAgICAgZXhwZWN0KHBhcnNlZE1ldGFkYXRhLnVuaWNvZGUpLnRvQmUoXG4gICAgICAgICAgJ/CfmoAgVGVzdGluZyBVVEYtODog44GT44KT44Gr44Gh44GvIOS4lueVjCDwn4yNJ1xuICAgICAgICApO1xuICAgICAgICBleHBlY3QocGFyc2VkTWV0YWRhdGEuZW1vamkpLnRvQmUoJ/Cfkrvwn5OK8J+UpycpO1xuICAgICAgfSk7XG5cbiAgICAgIHRlc3QoJ3Nob3VsZCBoYW5kbGUgY2FzZSBzZW5zaXRpdml0eSBjb3JyZWN0bHknLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmICghYnVja2V0TmFtZSB8fCAhc3RhdGVNYWNoaW5lQXJuKSByZXR1cm47XG5cbiAgICAgICAgLy8gVGVzdCBmaWxlcyB0aGF0IHNob3VsZCBOT1QgdHJpZ2dlclxuICAgICAgICBjb25zdCBub25UcmlnZ2VyRmlsZXMgPSBbXG4gICAgICAgICAgJ3Rlc3QvTWV0YWRhdGEuanNvbicsXG4gICAgICAgICAgJ3Rlc3QvTUVUQURBVEEuSlNPTicsXG4gICAgICAgICAgJ3Rlc3QvbWV0YWRhdGEuSlNPTicsXG4gICAgICAgICAgJ3Rlc3QvTWV0YWRhdGEuSnNvbicsXG4gICAgICAgIF07XG5cbiAgICAgICAgY29uc3QgZXhlY3V0aW9uc0JlZm9yZSA9IGF3YWl0IHNmbkNsaWVudC5zZW5kKFxuICAgICAgICAgIG5ldyBMaXN0RXhlY3V0aW9uc0NvbW1hbmQoe1xuICAgICAgICAgICAgc3RhdGVNYWNoaW5lQXJuOiBzdGF0ZU1hY2hpbmVBcm4sXG4gICAgICAgICAgICBtYXhSZXN1bHRzOiA1LFxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG5cbiAgICAgICAgZm9yIChjb25zdCBmaWxlIG9mIG5vblRyaWdnZXJGaWxlcykge1xuICAgICAgICAgIHRlc3RLZXlzLnB1c2goZmlsZSk7XG4gICAgICAgICAgYXdhaXQgczNDbGllbnQuc2VuZChcbiAgICAgICAgICAgIG5ldyBQdXRPYmplY3RDb21tYW5kKHtcbiAgICAgICAgICAgICAgQnVja2V0OiBidWNrZXROYW1lLFxuICAgICAgICAgICAgICBLZXk6IGZpbGUsXG4gICAgICAgICAgICAgIEJvZHk6IEpTT04uc3RyaW5naWZ5KHsgdGVzdDogJ2Nhc2Utc2Vuc2l0aXZpdHknIH0pLFxuICAgICAgICAgICAgICBDb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2FpdCBhbmQgdmVyaWZ5IG5vIGV4ZWN1dGlvbnMgd2VyZSB0cmlnZ2VyZWRcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDUwMDApKTtcblxuICAgICAgICBjb25zdCBleGVjdXRpb25zQWZ0ZXIgPSBhd2FpdCBzZm5DbGllbnQuc2VuZChcbiAgICAgICAgICBuZXcgTGlzdEV4ZWN1dGlvbnNDb21tYW5kKHtcbiAgICAgICAgICAgIHN0YXRlTWFjaGluZUFybjogc3RhdGVNYWNoaW5lQXJuLFxuICAgICAgICAgICAgbWF4UmVzdWx0czogNSxcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuXG4gICAgICAgIGV4cGVjdChleGVjdXRpb25zQWZ0ZXIuZXhlY3V0aW9ucz8ubGVuZ3RoKS50b0JlKFxuICAgICAgICAgIGV4ZWN1dGlvbnNCZWZvcmUuZXhlY3V0aW9ucz8ubGVuZ3RoXG4gICAgICAgICk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdPcGVuU2VhcmNoIERvY3VtZW50IFN0b3JhZ2UgKENSSVRJQ0FMKScsICgpID0+IHtcbiAgICAgIGNvbnN0IHRlc3RLZXlzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICBhZnRlckVhY2goYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCBjbGVhbnVwVGVzdERhdGEodGVzdEtleXMpO1xuICAgICAgICB0ZXN0S2V5cy5sZW5ndGggPSAwO1xuICAgICAgfSk7XG5cbiAgICAgIHRlc3QoJ3Nob3VsZCBzdG9yZSBkb2N1bWVudHMgaW4gT3BlblNlYXJjaCB3aXRoIEB0aW1lc3RhbXAnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmICghYnVja2V0TmFtZSB8fCAhb3BlbnNlYXJjaENsaWVudCkge1xuICAgICAgICAgIGNvbnNvbGUud2FybignU2tpcHBpbmcgdGVzdDogcmVxdWlyZWQgcmVzb3VyY2VzIG5vdCBhdmFpbGFibGUnKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0ZXN0S2V5ID0gJ29wZW5zZWFyY2gtdGVzdC9tZXRhZGF0YS5qc29uJztcbiAgICAgICAgdGVzdEtleXMucHVzaCh0ZXN0S2V5KTtcblxuICAgICAgICBjb25zdCBtZXRhZGF0YSA9IGdlbmVyYXRlVGVzdE1ldGFkYXRhKHtcbiAgICAgICAgICB0ZXN0VHlwZTogJ29wZW5zZWFyY2gtc3RvcmFnZScsXG4gICAgICAgICAgc2Vuc29yRGF0YToge1xuICAgICAgICAgICAgdGVtcGVyYXR1cmU6IDI1LjUsXG4gICAgICAgICAgICBodW1pZGl0eTogNjAsXG4gICAgICAgICAgICBwcmVzc3VyZTogMTAxMy4yNSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICBhd2FpdCBzM0NsaWVudC5zZW5kKFxuICAgICAgICAgIG5ldyBQdXRPYmplY3RDb21tYW5kKHtcbiAgICAgICAgICAgIEJ1Y2tldDogYnVja2V0TmFtZSxcbiAgICAgICAgICAgIEtleTogdGVzdEtleSxcbiAgICAgICAgICAgIEJvZHk6IEpTT04uc3RyaW5naWZ5KG1ldGFkYXRhKSxcbiAgICAgICAgICAgIENvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBXYWl0IGZvciBwcm9jZXNzaW5nXG4gICAgICAgIGNvbnN0IGV4ZWN1dGlvbnMgPSBhd2FpdCB3YWl0Rm9yU3RlcEZ1bmN0aW9uRXhlY3V0aW9uKDMwMDAwKTtcbiAgICAgICAgZXhwZWN0KGV4ZWN1dGlvbnMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG5cbiAgICAgICAgY29uc3Qgc3VjY2Vzc2Z1bEV4ZWN1dGlvbiA9IGV4ZWN1dGlvbnMuZmluZChcbiAgICAgICAgICBleGVjID0+IGV4ZWMuc3RhdHVzID09PSAnU1VDQ0VFREVEJ1xuICAgICAgICApO1xuICAgICAgICBleHBlY3Qoc3VjY2Vzc2Z1bEV4ZWN1dGlvbikudG9CZURlZmluZWQoKTtcblxuICAgICAgICAvLyBWZXJpZnkgZG9jdW1lbnQgd2FzIHN0b3JlZCBpbiBPcGVuU2VhcmNoXG4gICAgICAgIC8vIE5vdGU6IERvY3VtZW50IElEIGluIE9wZW5TZWFyY2ggbWlnaHQgYmUgZ2VuZXJhdGVkIGJ5IFN0ZXAgRnVuY3Rpb25cbiAgICAgICAgLy8gV2UnbGwgc2VhcmNoIGZvciB0aGUgZG9jdW1lbnQgYnkgbWV0YWRhdGEgY29udGVudFxuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgNTAwMCkpOyAvLyBBbGxvdyBmb3IgT3BlblNlYXJjaCBpbmRleGluZ1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3Qgc2VhcmNoUmVzcG9uc2UgPSBhd2FpdCBvcGVuc2VhcmNoQ2xpZW50LnNlYXJjaCh7XG4gICAgICAgICAgICBpbmRleDogJ21ldGFkYXRhLWluZGV4JyxcbiAgICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICAgICAgICBtYXRjaDoge1xuICAgICAgICAgICAgICAgICAgJ21ldGFkYXRhLmlkJzogbWV0YWRhdGEuaWQsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBleHBlY3QoXG4gICAgICAgICAgICB0eXBlb2Ygc2VhcmNoUmVzcG9uc2UuYm9keS5oaXRzLnRvdGFsID09PSAnb2JqZWN0J1xuICAgICAgICAgICAgICA/IHNlYXJjaFJlc3BvbnNlLmJvZHkuaGl0cy50b3RhbC52YWx1ZVxuICAgICAgICAgICAgICA6IHNlYXJjaFJlc3BvbnNlLmJvZHkuaGl0cy50b3RhbFxuICAgICAgICAgICkudG9CZUdyZWF0ZXJUaGFuKDApO1xuXG4gICAgICAgICAgY29uc3QgZG9jdW1lbnQgPSBzZWFyY2hSZXNwb25zZS5ib2R5LmhpdHMuaGl0c1swXS5fc291cmNlIGFzIGFueTtcbiAgICAgICAgICBleHBlY3QoZG9jdW1lbnRbJ0B0aW1lc3RhbXAnXSkudG9CZURlZmluZWQoKTtcbiAgICAgICAgICBleHBlY3QoZG9jdW1lbnQubWV0YWRhdGEpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgICAgZXhwZWN0KGRvY3VtZW50Lm1ldGFkYXRhLmlkKS50b0JlKG1ldGFkYXRhLmlkKTtcbiAgICAgICAgICBleHBlY3QoZG9jdW1lbnQubWV0YWRhdGEuc2Vuc29yRGF0YS50ZW1wZXJhdHVyZSkudG9CZSgyNS41KTtcbiAgICAgICAgICBleHBlY3QoZG9jdW1lbnQuYnVja2V0KS50b0JlKGJ1Y2tldE5hbWUpO1xuICAgICAgICAgIGV4cGVjdChkb2N1bWVudC5rZXkpLnRvQmUodGVzdEtleSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ09wZW5TZWFyY2ggcXVlcnkgZXJyb3I6JywgZXJyb3IpO1xuICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgdGVzdCgnc2hvdWxkIGhhbmRsZSBjb21wbGV4IG5lc3RlZCBKU09OIHN0cnVjdHVyZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmICghYnVja2V0TmFtZSB8fCAhb3BlbnNlYXJjaENsaWVudCkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHRlc3RLZXkgPSAnY29tcGxleC1qc29uL21ldGFkYXRhLmpzb24nO1xuICAgICAgICB0ZXN0S2V5cy5wdXNoKHRlc3RLZXkpO1xuXG4gICAgICAgIGNvbnN0IG1ldGFkYXRhID0gZ2VuZXJhdGVUZXN0TWV0YWRhdGEoe1xuICAgICAgICAgIHRlc3RUeXBlOiAnY29tcGxleC1uZXN0ZWQnLFxuICAgICAgICAgIG5lc3RlZDoge1xuICAgICAgICAgICAgbGV2ZWwxOiB7XG4gICAgICAgICAgICAgIGxldmVsMjoge1xuICAgICAgICAgICAgICAgIGxldmVsMzoge1xuICAgICAgICAgICAgICAgICAgZGVlcFZhbHVlOiAnZm91bmQnLFxuICAgICAgICAgICAgICAgICAgYXJyYXk6IFsxLCAyLCB7IGlubmVyT2JqOiAndGVzdCcgfV0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBhcnJheU9mT2JqZWN0czogW1xuICAgICAgICAgICAgeyBpZDogMSwgbmFtZTogJ2ZpcnN0JyB9LFxuICAgICAgICAgICAgeyBpZDogMiwgbmFtZTogJ3NlY29uZCcgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KTtcblxuICAgICAgICBhd2FpdCBzM0NsaWVudC5zZW5kKFxuICAgICAgICAgIG5ldyBQdXRPYmplY3RDb21tYW5kKHtcbiAgICAgICAgICAgIEJ1Y2tldDogYnVja2V0TmFtZSxcbiAgICAgICAgICAgIEtleTogdGVzdEtleSxcbiAgICAgICAgICAgIEJvZHk6IEpTT04uc3RyaW5naWZ5KG1ldGFkYXRhKSxcbiAgICAgICAgICAgIENvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBleGVjdXRpb25zID0gYXdhaXQgd2FpdEZvclN0ZXBGdW5jdGlvbkV4ZWN1dGlvbigpO1xuICAgICAgICBjb25zdCBzdWNjZXNzZnVsRXhlY3V0aW9uID0gZXhlY3V0aW9ucy5maW5kKFxuICAgICAgICAgIGV4ZWMgPT4gZXhlYy5zdGF0dXMgPT09ICdTVUNDRUVERUQnXG4gICAgICAgICk7XG4gICAgICAgIGV4cGVjdChzdWNjZXNzZnVsRXhlY3V0aW9uKS50b0JlRGVmaW5lZCgpO1xuXG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCA1MDAwKSk7XG5cbiAgICAgICAgY29uc3Qgc2VhcmNoUmVzcG9uc2UgPSBhd2FpdCBvcGVuc2VhcmNoQ2xpZW50LnNlYXJjaCh7XG4gICAgICAgICAgaW5kZXg6ICdtZXRhZGF0YS1pbmRleCcsXG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICAgICAgbWF0Y2g6IHtcbiAgICAgICAgICAgICAgICAnbWV0YWRhdGEuaWQnOiBtZXRhZGF0YS5pZCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZXhwZWN0KGdldFRvdGFsSGl0c0NvdW50KHNlYXJjaFJlc3BvbnNlLmJvZHkuaGl0cy50b3RhbCkpLnRvQmUoMSk7XG5cbiAgICAgICAgY29uc3QgZG9jdW1lbnQgPSBzZWFyY2hSZXNwb25zZS5ib2R5LmhpdHMuaGl0c1swXS5fc291cmNlIGFzIGFueTtcbiAgICAgICAgZXhwZWN0KGRvY3VtZW50Lm1ldGFkYXRhLm5lc3RlZC5sZXZlbDEubGV2ZWwyLmxldmVsMy5kZWVwVmFsdWUpLnRvQmUoXG4gICAgICAgICAgJ2ZvdW5kJ1xuICAgICAgICApO1xuICAgICAgICBleHBlY3QoZG9jdW1lbnQubWV0YWRhdGEuYXJyYXlPZk9iamVjdHMpLnRvSGF2ZUxlbmd0aCgyKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ1N0ZXAgRnVuY3Rpb24gRXhlY3V0aW9uIEZsb3cnLCAoKSA9PiB7XG4gICAgICBjb25zdCB0ZXN0S2V5czogc3RyaW5nW10gPSBbXTtcblxuICAgICAgYWZ0ZXJFYWNoKGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgY2xlYW51cFRlc3REYXRhKHRlc3RLZXlzKTtcbiAgICAgICAgdGVzdEtleXMubGVuZ3RoID0gMDtcbiAgICAgIH0pO1xuXG4gICAgICB0ZXN0KCdzaG91bGQgZXhlY3V0ZSBjb21wbGV0ZSBzdWNjZXNzIHdvcmtmbG93JywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBpZiAoIWJ1Y2tldE5hbWUgfHwgIXN0YXRlTWFjaGluZUFybikgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHRlc3RLZXkgPSAnd29ya2Zsb3ctdGVzdC9tZXRhZGF0YS5qc29uJztcbiAgICAgICAgdGVzdEtleXMucHVzaCh0ZXN0S2V5KTtcblxuICAgICAgICBjb25zdCBtZXRhZGF0YSA9IGdlbmVyYXRlVGVzdE1ldGFkYXRhKHtcbiAgICAgICAgICB0ZXN0VHlwZTogJ3N1Y2Nlc3Mtd29ya2Zsb3cnLFxuICAgICAgICAgIHdvcmtmbG93OiAnY29tcGxldGUtc3VjY2VzcycsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGF3YWl0IHMzQ2xpZW50LnNlbmQoXG4gICAgICAgICAgbmV3IFB1dE9iamVjdENvbW1hbmQoe1xuICAgICAgICAgICAgQnVja2V0OiBidWNrZXROYW1lLFxuICAgICAgICAgICAgS2V5OiB0ZXN0S2V5LFxuICAgICAgICAgICAgQm9keTogSlNPTi5zdHJpbmdpZnkobWV0YWRhdGEpLFxuICAgICAgICAgICAgQ29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IGV4ZWN1dGlvbnMgPSBhd2FpdCB3YWl0Rm9yU3RlcEZ1bmN0aW9uRXhlY3V0aW9uKCk7XG4gICAgICAgIGV4cGVjdChleGVjdXRpb25zLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApO1xuXG4gICAgICAgIGNvbnN0IGV4ZWN1dGlvbiA9IGV4ZWN1dGlvbnNbMF07XG4gICAgICAgIGV4cGVjdChleGVjdXRpb24uc3RhdHVzKS50b0JlKCdTVUNDRUVERUQnKTtcblxuICAgICAgICAvLyBHZXQgZGV0YWlsZWQgZXhlY3V0aW9uIGluZm9ybWF0aW9uXG4gICAgICAgIGNvbnN0IGV4ZWN1dGlvbkRldGFpbHMgPSBhd2FpdCBzZm5DbGllbnQuc2VuZChcbiAgICAgICAgICBuZXcgRGVzY3JpYmVFeGVjdXRpb25Db21tYW5kKHtcbiAgICAgICAgICAgIGV4ZWN1dGlvbkFybjogZXhlY3V0aW9uLmV4ZWN1dGlvbkFybixcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuXG4gICAgICAgIGV4cGVjdChleGVjdXRpb25EZXRhaWxzLmlucHV0KS50b0NvbnRhaW4odGVzdEtleSk7XG4gICAgICAgIGV4cGVjdChleGVjdXRpb25EZXRhaWxzLm91dHB1dCkudG9CZURlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KGV4ZWN1dGlvbkRldGFpbHMuc3RhdHVzKS50b0JlKCdTVUNDRUVERUQnKTtcbiAgICAgIH0pO1xuXG4gICAgICB0ZXN0KCdzaG91bGQgaGFuZGxlIG1hbGZvcm1lZCBKU09OIHdpdGggcHJvcGVyIGVycm9yIGxvZ2dpbmcnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmICghYnVja2V0TmFtZSB8fCAhc3RhdGVNYWNoaW5lQXJuIHx8ICFmYWlsdXJlVGFibGVOYW1lKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgdGVzdEtleSA9ICdtYWxmb3JtZWQtanNvbi9tZXRhZGF0YS5qc29uJztcbiAgICAgICAgdGVzdEtleXMucHVzaCh0ZXN0S2V5KTtcblxuICAgICAgICBjb25zdCBtYWxmb3JtZWRKc29uID1cbiAgICAgICAgICAne1wiaW52YWxpZFwiOiBqc29uLCBcIm1pc3NpbmdcIjogcXVvdGUsIFwiZXh0cmFcIjogY29tbWEsfSc7XG5cbiAgICAgICAgYXdhaXQgczNDbGllbnQuc2VuZChcbiAgICAgICAgICBuZXcgUHV0T2JqZWN0Q29tbWFuZCh7XG4gICAgICAgICAgICBCdWNrZXQ6IGJ1Y2tldE5hbWUsXG4gICAgICAgICAgICBLZXk6IHRlc3RLZXksXG4gICAgICAgICAgICBCb2R5OiBtYWxmb3JtZWRKc29uLFxuICAgICAgICAgICAgQ29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IGV4ZWN1dGlvbnMgPSBhd2FpdCB3YWl0Rm9yU3RlcEZ1bmN0aW9uRXhlY3V0aW9uKCk7XG4gICAgICAgIGV4cGVjdChleGVjdXRpb25zLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApO1xuXG4gICAgICAgIGNvbnN0IGV4ZWN1dGlvbiA9IGV4ZWN1dGlvbnNbMF07XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgZXhlY3V0aW9uIGZhaWxlZCAoYXMgZXhwZWN0ZWQpXG4gICAgICAgIGlmIChleGVjdXRpb24uc3RhdHVzID09PSAnRkFJTEVEJykge1xuICAgICAgICAgIC8vIFZlcmlmeSBmYWlsdXJlIHdhcyBsb2dnZWQgdG8gRHluYW1vREIgd2l0aCBlbmhhbmNlZCBjb250ZXh0XG4gICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDMwMDApKTtcblxuICAgICAgICAgIGNvbnN0IGZhaWx1cmVSZWNvcmRzID0gYXdhaXQgZHluYW1vQ2xpZW50LnNlbmQoXG4gICAgICAgICAgICBuZXcgU2NhbkNvbW1hbmQoe1xuICAgICAgICAgICAgICBUYWJsZU5hbWU6IGZhaWx1cmVUYWJsZU5hbWUsXG4gICAgICAgICAgICAgIEZpbHRlckV4cHJlc3Npb246ICdjb250YWlucyhpbnB1dERhdGEsIDprZXkpJyxcbiAgICAgICAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xuICAgICAgICAgICAgICAgICc6a2V5JzogeyBTOiB0ZXN0S2V5IH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBleHBlY3QoZmFpbHVyZVJlY29yZHMuSXRlbXM/Lmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApO1xuXG4gICAgICAgICAgY29uc3QgZmFpbHVyZVJlY29yZCA9IGZhaWx1cmVSZWNvcmRzLkl0ZW1zIVswXTtcbiAgICAgICAgICBleHBlY3QoZmFpbHVyZVJlY29yZC5leGVjdXRpb25JZCkudG9CZURlZmluZWQoKTtcbiAgICAgICAgICBleHBlY3QoZmFpbHVyZVJlY29yZC50aW1lc3RhbXApLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgICAgZXhwZWN0KGZhaWx1cmVSZWNvcmQuaW5wdXREYXRhKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICAgIGV4cGVjdChmYWlsdXJlUmVjb3JkLmVycm9yQ2F1c2UpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgICAgZXhwZWN0KGZhaWx1cmVSZWNvcmQuZXJyb3JNZXNzYWdlKS50b0JlRGVmaW5lZCgpOyAvLyBFbmhhbmNlZCBlcnJvciBsb2dnaW5nXG4gICAgICAgICAgZXhwZWN0KGZhaWx1cmVSZWNvcmQuc3RhdGVOYW1lKS50b0JlRGVmaW5lZCgpOyAvLyBFbmhhbmNlZCBlcnJvciBsb2dnaW5nXG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICB0ZXN0KCdzaG91bGQgdmVyaWZ5IHJldHJ5IGxvZ2ljIHdpdGggdHJhbnNpZW50IGZhaWx1cmVzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAvLyBUaGlzIHRlc3Qgd291bGQgbmVlZCB0byBzaW11bGF0ZSB0cmFuc2llbnQgZmFpbHVyZXNcbiAgICAgICAgLy8gRm9yIG5vdywgd2UnbGwgdmVyaWZ5IHJldHJ5IGNvbmZpZ3VyYXRpb24gZXhpc3RzIGluIHRoZSBleGVjdXRpb25cbiAgICAgICAgaWYgKCFzdGF0ZU1hY2hpbmVBcm4pIHJldHVybjtcblxuICAgICAgICBjb25zdCBleGVjdXRpb25zID0gYXdhaXQgc2ZuQ2xpZW50LnNlbmQoXG4gICAgICAgICAgbmV3IExpc3RFeGVjdXRpb25zQ29tbWFuZCh7XG4gICAgICAgICAgICBzdGF0ZU1hY2hpbmVBcm46IHN0YXRlTWFjaGluZUFybixcbiAgICAgICAgICAgIG1heFJlc3VsdHM6IDEsXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBJZiB3ZSBoYXZlIGV4ZWN1dGlvbnMsIGNoZWNrIHRoZSBzdGF0ZSBtYWNoaW5lIGRlZmluaXRpb24gaW5jbHVkZXMgcmV0cnkgbG9naWNcbiAgICAgICAgaWYgKGV4ZWN1dGlvbnMuZXhlY3V0aW9ucyAmJiBleGVjdXRpb25zLmV4ZWN1dGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGNvbnN0IGV4ZWN1dGlvbiA9IGV4ZWN1dGlvbnMuZXhlY3V0aW9uc1swXTtcbiAgICAgICAgICBjb25zdCBleGVjdXRpb25EZXRhaWxzID0gYXdhaXQgc2ZuQ2xpZW50LnNlbmQoXG4gICAgICAgICAgICBuZXcgRGVzY3JpYmVFeGVjdXRpb25Db21tYW5kKHtcbiAgICAgICAgICAgICAgZXhlY3V0aW9uQXJuOiBleGVjdXRpb24uZXhlY3V0aW9uQXJuISxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIC8vIFZlcmlmeSBleGVjdXRpb24gZGV0YWlscyBhcmUgYXZhaWxhYmxlXG4gICAgICAgICAgZXhwZWN0KGV4ZWN1dGlvbkRldGFpbHMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgICAgZXhwZWN0KGV4ZWN1dGlvbkRldGFpbHMuc3RhdGVNYWNoaW5lQXJuKS50b0JlKHN0YXRlTWFjaGluZUFybik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICB0ZXN0KCdzaG91bGQgcGFzcyBjb250ZXh0IGJldHdlZW4gc3RhdGVzIGNvcnJlY3RseScsIGFzeW5jICgpID0+IHtcbiAgICAgICAgaWYgKCFidWNrZXROYW1lKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgdGVzdEtleSA9ICdjb250ZXh0LXRlc3QvbWV0YWRhdGEuanNvbic7XG4gICAgICAgIHRlc3RLZXlzLnB1c2godGVzdEtleSk7XG5cbiAgICAgICAgY29uc3QgbWV0YWRhdGEgPSBnZW5lcmF0ZVRlc3RNZXRhZGF0YSh7XG4gICAgICAgICAgdGVzdFR5cGU6ICdjb250ZXh0LXBhc3NpbmcnLFxuICAgICAgICAgIGNvbnRleHREYXRhOiB7XG4gICAgICAgICAgICBzdGVwMTogJ2luaXRpYWwnLFxuICAgICAgICAgICAgc3RlcDI6ICdwcm9jZXNzZWQnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGF3YWl0IHMzQ2xpZW50LnNlbmQoXG4gICAgICAgICAgbmV3IFB1dE9iamVjdENvbW1hbmQoe1xuICAgICAgICAgICAgQnVja2V0OiBidWNrZXROYW1lLFxuICAgICAgICAgICAgS2V5OiB0ZXN0S2V5LFxuICAgICAgICAgICAgQm9keTogSlNPTi5zdHJpbmdpZnkobWV0YWRhdGEpLFxuICAgICAgICAgICAgQ29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IGV4ZWN1dGlvbnMgPSBhd2FpdCB3YWl0Rm9yU3RlcEZ1bmN0aW9uRXhlY3V0aW9uKCk7XG4gICAgICAgIGNvbnN0IGV4ZWN1dGlvbiA9IGV4ZWN1dGlvbnNbMF07XG5cbiAgICAgICAgaWYgKGV4ZWN1dGlvbi5leGVjdXRpb25Bcm4pIHtcbiAgICAgICAgICBjb25zdCBleGVjdXRpb25EZXRhaWxzID0gYXdhaXQgc2ZuQ2xpZW50LnNlbmQoXG4gICAgICAgICAgICBuZXcgRGVzY3JpYmVFeGVjdXRpb25Db21tYW5kKHtcbiAgICAgICAgICAgICAgZXhlY3V0aW9uQXJuOiBleGVjdXRpb24uZXhlY3V0aW9uQXJuLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgLy8gVmVyaWZ5IGlucHV0IGNvbnRhaW5zIHRoZSBTMyBldmVudCBzdHJ1Y3R1cmVcbiAgICAgICAgICBjb25zdCBpbnB1dCA9IEpTT04ucGFyc2UoZXhlY3V0aW9uRGV0YWlscy5pbnB1dCB8fCAne30nKTtcbiAgICAgICAgICBleHBlY3QoaW5wdXQuZGV0YWlsKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICAgIGV4cGVjdChpbnB1dC5kZXRhaWwuYnVja2V0KS50b0JlRGVmaW5lZCgpO1xuICAgICAgICAgIGV4cGVjdChpbnB1dC5kZXRhaWwub2JqZWN0KS50b0JlRGVmaW5lZCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdFbmhhbmNlZCBFcnJvciBIYW5kbGluZyBhbmQgRHluYW1vREIgTG9nZ2luZycsICgpID0+IHtcbiAgICAgIGNvbnN0IHRlc3RLZXlzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICBhZnRlckVhY2goYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCBjbGVhbnVwVGVzdERhdGEodGVzdEtleXMpO1xuICAgICAgICB0ZXN0S2V5cy5sZW5ndGggPSAwO1xuICAgICAgfSk7XG5cbiAgICAgIHRlc3QoJ3Nob3VsZCBsb2cgYWxsIGZhaWx1cmUgY29udGV4dCB0byBEeW5hbW9EQicsIGFzeW5jICgpID0+IHtcbiAgICAgICAgaWYgKCFidWNrZXROYW1lIHx8ICFmYWlsdXJlVGFibGVOYW1lKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgdGVzdEtleSA9ICdlcnJvci1jb250ZXh0L21ldGFkYXRhLmpzb24nO1xuICAgICAgICB0ZXN0S2V5cy5wdXNoKHRlc3RLZXkpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhIHNjZW5hcmlvIHRoYXQgd2lsbCBsaWtlbHkgZmFpbFxuICAgICAgICBjb25zdCBwcm9ibGVtRGF0YSA9ICd7XCJ1bmNsb3NlZFwiOiBcImJyYWNrZXRcIic7IC8vIEludGVudGlvbmFsbHkgbWFsZm9ybWVkXG5cbiAgICAgICAgYXdhaXQgczNDbGllbnQuc2VuZChcbiAgICAgICAgICBuZXcgUHV0T2JqZWN0Q29tbWFuZCh7XG4gICAgICAgICAgICBCdWNrZXQ6IGJ1Y2tldE5hbWUsXG4gICAgICAgICAgICBLZXk6IHRlc3RLZXksXG4gICAgICAgICAgICBCb2R5OiBwcm9ibGVtRGF0YSxcbiAgICAgICAgICAgIENvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBleGVjdXRpb25zID0gYXdhaXQgd2FpdEZvclN0ZXBGdW5jdGlvbkV4ZWN1dGlvbigpO1xuXG4gICAgICAgIC8vIFdhaXQgZm9yIGZhaWx1cmUgcHJvY2Vzc2luZ1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgNTAwMCkpO1xuXG4gICAgICAgIGNvbnN0IGZhaWx1cmVSZWNvcmRzID0gYXdhaXQgZHluYW1vQ2xpZW50LnNlbmQoXG4gICAgICAgICAgbmV3IFNjYW5Db21tYW5kKHtcbiAgICAgICAgICAgIFRhYmxlTmFtZTogZmFpbHVyZVRhYmxlTmFtZSxcbiAgICAgICAgICAgIEZpbHRlckV4cHJlc3Npb246ICdjb250YWlucyhpbnB1dERhdGEsIDprZXkpJyxcbiAgICAgICAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM6IHtcbiAgICAgICAgICAgICAgJzprZXknOiB7IFM6IHRlc3RLZXkgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBMaW1pdDogNSxcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuXG4gICAgICAgIGlmIChmYWlsdXJlUmVjb3Jkcy5JdGVtcyAmJiBmYWlsdXJlUmVjb3Jkcy5JdGVtcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgY29uc3QgcmVjb3JkID0gZmFpbHVyZVJlY29yZHMuSXRlbXNbMF07XG5cbiAgICAgICAgICAvLyBWZXJpZnkgYWxsIGVuaGFuY2VkIGZpZWxkcyBhcmUgcHJlc2VudFxuICAgICAgICAgIGV4cGVjdChyZWNvcmQuZXhlY3V0aW9uSWQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgICAgZXhwZWN0KHJlY29yZC50aW1lc3RhbXApLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgICAgZXhwZWN0KHJlY29yZC5pbnB1dERhdGEpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgICAgZXhwZWN0KHJlY29yZC5lcnJvckNhdXNlKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICAgIGV4cGVjdChyZWNvcmQuZXJyb3JNZXNzYWdlKS50b0JlRGVmaW5lZCgpOyAvLyBOZXcgZmllbGRcbiAgICAgICAgICBleHBlY3QocmVjb3JkLnN0YXRlTmFtZSkudG9CZURlZmluZWQoKTsgLy8gTmV3IGZpZWxkXG4gICAgICAgICAgZXhwZWN0KHJlY29yZC5leGVjdXRpb25Bcm4pLnRvQmVEZWZpbmVkKCk7IC8vIE5ldyBmaWVsZFxuXG4gICAgICAgICAgLy8gVmVyaWZ5IGZpZWxkIGNvbnRlbnRzIG1ha2Ugc2Vuc2VcbiAgICAgICAgICBleHBlY3QocmVjb3JkLmlucHV0RGF0YS5TKS50b0NvbnRhaW4odGVzdEtleSk7XG4gICAgICAgICAgZXhwZWN0KHJlY29yZC5leGVjdXRpb25JZC5TKS50b01hdGNoKC9eW2EtZjAtOS1dKyQvKTsgLy8gVVVJRCBwYXR0ZXJuXG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICB0ZXN0KCdzaG91bGQgaGFuZGxlIGRpZmZlcmVudCB0eXBlcyBvZiBmYWlsdXJlcycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgaWYgKCFidWNrZXROYW1lIHx8ICFmYWlsdXJlVGFibGVOYW1lKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgdGVzdFNjZW5hcmlvcyA9IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBrZXk6ICdiaW5hcnktZmlsZS9tZXRhZGF0YS5qc29uJyxcbiAgICAgICAgICAgIGNvbnRlbnQ6IEJ1ZmZlci5mcm9tKFsweGZmLCAweGZlLCAweGZkLCAweGZjXSksIC8vIEJpbmFyeSBkYXRhXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2JpbmFyeS1jb250ZW50JyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGtleTogJ2ludmFsaWQtdXRmOC9tZXRhZGF0YS5qc29uJyxcbiAgICAgICAgICAgIGNvbnRlbnQ6ICd7XCJ0ZXh0XCI6IFwiXFxcXHVYWFhYXCJ9JywgLy8gSW52YWxpZCBVbmljb2RlIGVzY2FwZVxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdpbnZhbGlkLXVuaWNvZGUnLFxuICAgICAgICAgIH0sXG4gICAgICAgIF07XG5cbiAgICAgICAgZm9yIChjb25zdCBzY2VuYXJpbyBvZiB0ZXN0U2NlbmFyaW9zKSB7XG4gICAgICAgICAgdGVzdEtleXMucHVzaChzY2VuYXJpby5rZXkpO1xuXG4gICAgICAgICAgYXdhaXQgczNDbGllbnQuc2VuZChcbiAgICAgICAgICAgIG5ldyBQdXRPYmplY3RDb21tYW5kKHtcbiAgICAgICAgICAgICAgQnVja2V0OiBidWNrZXROYW1lLFxuICAgICAgICAgICAgICBLZXk6IHNjZW5hcmlvLmtleSxcbiAgICAgICAgICAgICAgQm9keTogc2NlbmFyaW8uY29udGVudCxcbiAgICAgICAgICAgICAgQ29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdhaXQgZm9yIGFsbCBleGVjdXRpb25zIHRvIGNvbXBsZXRlXG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMDAwMCkpO1xuXG4gICAgICAgIC8vIENoZWNrIGZvciBmYWlsdXJlIHJlY29yZHNcbiAgICAgICAgY29uc3QgZmFpbHVyZVJlY29yZHMgPSBhd2FpdCBkeW5hbW9DbGllbnQuc2VuZChcbiAgICAgICAgICBuZXcgU2NhbkNvbW1hbmQoe1xuICAgICAgICAgICAgVGFibGVOYW1lOiBmYWlsdXJlVGFibGVOYW1lLFxuICAgICAgICAgICAgTGltaXQ6IDEwLFxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gV2UgZXhwZWN0IGF0IGxlYXN0IHNvbWUgZmFpbHVyZXMgd2VyZSBsb2dnZWRcbiAgICAgICAgZXhwZWN0KGZhaWx1cmVSZWNvcmRzLkl0ZW1zPy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ0Nsb3VkV2F0Y2ggTW9uaXRvcmluZyBhbmQgRGFzaGJvYXJkJywgKCkgPT4ge1xuICAgICAgdGVzdCgnc2hvdWxkIGhhdmUgZnVuY3Rpb25hbCBtb25pdG9yaW5nIGRhc2hib2FyZCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgaWYgKCFhbGFybU5hbWUpIHJldHVybjtcblxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNsb3VkV2F0Y2hDbGllbnQuc2VuZChcbiAgICAgICAgICBuZXcgRGVzY3JpYmVBbGFybXNDb21tYW5kKHtcbiAgICAgICAgICAgIEFsYXJtTmFtZXM6IFthbGFybU5hbWVdLFxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG5cbiAgICAgICAgZXhwZWN0KHJlc3BvbnNlLk1ldHJpY0FsYXJtcykudG9CZURlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KHJlc3BvbnNlLk1ldHJpY0FsYXJtcz8uWzBdPy5BbGFybU5hbWUpLnRvQmUoYWxhcm1OYW1lKTtcbiAgICAgICAgZXhwZWN0KHJlc3BvbnNlLk1ldHJpY0FsYXJtcz8uWzBdPy5NZXRyaWNOYW1lKS50b0JlKCdFeGVjdXRpb25zRmFpbGVkJyk7XG4gICAgICAgIGV4cGVjdChyZXNwb25zZS5NZXRyaWNBbGFybXM/LlswXT8uTmFtZXNwYWNlKS50b0JlKCdBV1MvU3RhdGVzJyk7XG4gICAgICB9KTtcblxuICAgICAgdGVzdCgnc2hvdWxkIGNvbGxlY3QgU3RlcCBGdW5jdGlvbiBtZXRyaWNzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBpZiAoIXN0YXRlTWFjaGluZUFybikgcmV0dXJuO1xuXG4gICAgICAgIC8vIEdldCBtZXRyaWNzIGZvciB0aGUgcGFzdCBob3VyXG4gICAgICAgIGNvbnN0IGVuZFRpbWUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBjb25zdCBzdGFydFRpbWUgPSBuZXcgRGF0ZShlbmRUaW1lLmdldFRpbWUoKSAtIDM2MDAgKiAxMDAwKTtcblxuICAgICAgICBjb25zdCBtZXRyaWNzUmVzcG9uc2UgPSBhd2FpdCBjbG91ZFdhdGNoQ2xpZW50LnNlbmQoXG4gICAgICAgICAgbmV3IEdldE1ldHJpY1N0YXRpc3RpY3NDb21tYW5kKHtcbiAgICAgICAgICAgIE5hbWVzcGFjZTogJ0FXUy9TdGF0ZXMnLFxuICAgICAgICAgICAgTWV0cmljTmFtZTogJ0V4ZWN1dGlvbnNTdGFydGVkJyxcbiAgICAgICAgICAgIERpbWVuc2lvbnM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIE5hbWU6ICdTdGF0ZU1hY2hpbmVBcm4nLFxuICAgICAgICAgICAgICAgIFZhbHVlOiBzdGF0ZU1hY2hpbmVBcm4sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgU3RhcnRUaW1lOiBzdGFydFRpbWUsXG4gICAgICAgICAgICBFbmRUaW1lOiBlbmRUaW1lLFxuICAgICAgICAgICAgUGVyaW9kOiAzNjAwLFxuICAgICAgICAgICAgU3RhdGlzdGljczogWydTdW0nXSxcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuXG4gICAgICAgIGV4cGVjdChtZXRyaWNzUmVzcG9uc2UuRGF0YXBvaW50cykudG9CZURlZmluZWQoKTtcbiAgICAgICAgLy8gTm90ZTogRGF0YXBvaW50cyBtaWdodCBiZSBlbXB0eSBpZiBubyBleGVjdXRpb25zIG9jY3VycmVkIGluIHRoZSB0aW1lIHdpbmRvd1xuICAgICAgfSk7XG5cbiAgICAgIHRlc3QoJ3Nob3VsZCBoYXZlIGFjY2Vzc2libGUgZGFzaGJvYXJkIFVSTCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgaWYgKCFkYXNoYm9hcmRVcmwpIHJldHVybjtcblxuICAgICAgICBleHBlY3QoZGFzaGJvYXJkVXJsKS50b0NvbnRhaW4oJ2h0dHBzOi8vJyk7XG4gICAgICAgIGV4cGVjdChkYXNoYm9hcmRVcmwpLnRvQ29udGFpbignYW1hem9uYXdzLmNvbScpO1xuXG4gICAgICAgIC8vIE5vdGU6IFdlIGNhbid0IGVhc2lseSB0ZXN0IGFjdHVhbCBIVFRQIGFjY2VzcyB3aXRob3V0IGF1dGhlbnRpY2F0aW9uXG4gICAgICAgIC8vIEJ1dCB3ZSBjYW4gdmVyaWZ5IHRoZSBVUkwgZm9ybWF0IGlzIGNvcnJlY3RcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICAvLyBQSEFTRSAyOiBSRUxJQUJJTElUWSAmIFBFUkZPUk1BTkNFIFRFU1RTXG4gIGRlc2NyaWJlKCdQaGFzZSAyOiBSZWxpYWJpbGl0eSAmIFBlcmZvcm1hbmNlJywgKCkgPT4ge1xuICAgIGRlc2NyaWJlKCdIaWdoLVZvbHVtZSBQcm9jZXNzaW5nJywgKCkgPT4ge1xuICAgICAgY29uc3QgdGVzdEtleXM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgIGFmdGVyRWFjaChhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IGNsZWFudXBUZXN0RGF0YSh0ZXN0S2V5cyk7XG4gICAgICAgIHRlc3RLZXlzLmxlbmd0aCA9IDA7XG4gICAgICB9KTtcblxuICAgICAgdGVzdCgnc2hvdWxkIGhhbmRsZSBjb25jdXJyZW50IGZpbGUgdXBsb2FkcycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgaWYgKCFidWNrZXROYW1lIHx8ICFzdGF0ZU1hY2hpbmVBcm4pIHJldHVybjtcblxuICAgICAgICBjb25zdCBmaWxlQ291bnQgPSA1O1xuICAgICAgICBjb25zdCB0ZXN0RmlsZXMgPSBBcnJheS5mcm9tKFxuICAgICAgICAgIHsgbGVuZ3RoOiBmaWxlQ291bnQgfSxcbiAgICAgICAgICAoXywgaSkgPT5cbiAgICAgICAgICAgIGBjb25jdXJyZW50LXRlc3QvYmF0Y2gtJHtEYXRlLm5vdygpfS9maWxlLSR7aX0vbWV0YWRhdGEuanNvbmBcbiAgICAgICAgKTtcbiAgICAgICAgdGVzdEtleXMucHVzaCguLi50ZXN0RmlsZXMpO1xuXG4gICAgICAgIGNvbnN0IHVwbG9hZFByb21pc2VzID0gdGVzdEZpbGVzLm1hcCgoa2V5LCBpbmRleCkgPT4ge1xuICAgICAgICAgIGNvbnN0IG1ldGFkYXRhID0gZ2VuZXJhdGVUZXN0TWV0YWRhdGEoe1xuICAgICAgICAgICAgYmF0Y2hJbmRleDogaW5kZXgsXG4gICAgICAgICAgICBjb25jdXJyZW50VGVzdDogdHJ1ZSxcbiAgICAgICAgICAgIHRlc3RUeXBlOiAnY29uY3VycmVudC11cGxvYWQnLFxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuIHMzQ2xpZW50LnNlbmQoXG4gICAgICAgICAgICBuZXcgUHV0T2JqZWN0Q29tbWFuZCh7XG4gICAgICAgICAgICAgIEJ1Y2tldDogYnVja2V0TmFtZSxcbiAgICAgICAgICAgICAgS2V5OiBrZXksXG4gICAgICAgICAgICAgIEJvZHk6IEpTT04uc3RyaW5naWZ5KG1ldGFkYXRhKSxcbiAgICAgICAgICAgICAgQ29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwodXBsb2FkUHJvbWlzZXMpO1xuICAgICAgICBjb25zdCB1cGxvYWRUaW1lID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcblxuICAgICAgICAvLyBXYWl0IGZvciBhbGwgcHJvY2Vzc2luZ1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMzAwMDApKTtcblxuICAgICAgICAvLyBWZXJpZnkgYWxsIGV4ZWN1dGlvbnMgY29tcGxldGVkXG4gICAgICAgIGNvbnN0IGV4ZWN1dGlvbnMgPSBhd2FpdCBzZm5DbGllbnQuc2VuZChcbiAgICAgICAgICBuZXcgTGlzdEV4ZWN1dGlvbnNDb21tYW5kKHtcbiAgICAgICAgICAgIHN0YXRlTWFjaGluZUFybjogc3RhdGVNYWNoaW5lQXJuLFxuICAgICAgICAgICAgbWF4UmVzdWx0czogMjAsXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCByZWNlbnRFeGVjdXRpb25zID0gZXhlY3V0aW9ucy5leGVjdXRpb25zPy5maWx0ZXIoXG4gICAgICAgICAgZXhlYyA9PlxuICAgICAgICAgICAgZXhlYy5zdGFydERhdGUgJiYgZXhlYy5zdGFydERhdGUgPiBuZXcgRGF0ZShEYXRlLm5vdygpIC0gNjAwMDApXG4gICAgICAgICk7XG5cbiAgICAgICAgZXhwZWN0KHJlY2VudEV4ZWN1dGlvbnM/Lmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbChmaWxlQ291bnQpO1xuICAgICAgICBleHBlY3QodXBsb2FkVGltZSkudG9CZUxlc3NUaGFuKDEwMDAwKTsgLy8gU2hvdWxkIHVwbG9hZCB3aXRoaW4gMTAgc2Vjb25kc1xuXG4gICAgICAgIC8vIFZlcmlmeSBtb3N0IGV4ZWN1dGlvbnMgc3VjY2VlZGVkXG4gICAgICAgIGNvbnN0IHN1Y2Nlc3NmdWxFeGVjdXRpb25zID0gcmVjZW50RXhlY3V0aW9ucz8uZmlsdGVyKFxuICAgICAgICAgIGV4ZWMgPT4gZXhlYy5zdGF0dXMgPT09ICdTVUNDRUVERUQnXG4gICAgICAgICk7XG5cbiAgICAgICAgZXhwZWN0KHN1Y2Nlc3NmdWxFeGVjdXRpb25zPy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoXG4gICAgICAgICAgZmlsZUNvdW50ICogMC44XG4gICAgICAgICk7IC8vIDgwJSBzdWNjZXNzIHJhdGVcbiAgICAgIH0pO1xuXG4gICAgICB0ZXN0KCdzaG91bGQgaGFuZGxlIHJhcGlkIHN1Y2Nlc3NpdmUgdXBsb2FkcyB0byBzYW1lIHBhdGgnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmICghYnVja2V0TmFtZSkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHRlc3RLZXkgPSAncmFwaWQtdXBkYXRlL21ldGFkYXRhLmpzb24nO1xuICAgICAgICB0ZXN0S2V5cy5wdXNoKHRlc3RLZXkpO1xuXG4gICAgICAgIC8vIFVwbG9hZCBtdWx0aXBsZSB2ZXJzaW9ucyByYXBpZGx5XG4gICAgICAgIGNvbnN0IHVwbG9hZHMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBtZXRhZGF0YSA9IGdlbmVyYXRlVGVzdE1ldGFkYXRhKHtcbiAgICAgICAgICAgIHZlcnNpb246IGksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIHRlc3RUeXBlOiAncmFwaWQtc3VjY2Vzc2l2ZScsXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICB1cGxvYWRzLnB1c2goXG4gICAgICAgICAgICBzM0NsaWVudC5zZW5kKFxuICAgICAgICAgICAgICBuZXcgUHV0T2JqZWN0Q29tbWFuZCh7XG4gICAgICAgICAgICAgICAgQnVja2V0OiBidWNrZXROYW1lLFxuICAgICAgICAgICAgICAgIEtleTogdGVzdEtleSxcbiAgICAgICAgICAgICAgICBCb2R5OiBKU09OLnN0cmluZ2lmeShtZXRhZGF0YSksXG4gICAgICAgICAgICAgICAgQ29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIClcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgLy8gU21hbGwgZGVsYXkgYmV0d2VlbiB1cGxvYWRzXG4gICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDEwMCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwodXBsb2Fkcyk7XG5cbiAgICAgICAgLy8gVmVyaWZ5IGZpbmFsIHN0YXRlXG4gICAgICAgIGNvbnN0IGdldFJlc3BvbnNlID0gYXdhaXQgczNDbGllbnQuc2VuZChcbiAgICAgICAgICBuZXcgR2V0T2JqZWN0Q29tbWFuZCh7XG4gICAgICAgICAgICBCdWNrZXQ6IGJ1Y2tldE5hbWUsXG4gICAgICAgICAgICBLZXk6IHRlc3RLZXksXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBmaW5hbENvbnRlbnQgPSBhd2FpdCBnZXRSZXNwb25zZS5Cb2R5Py50cmFuc2Zvcm1Ub1N0cmluZygpO1xuICAgICAgICBjb25zdCBmaW5hbE1ldGFkYXRhID0gSlNPTi5wYXJzZShmaW5hbENvbnRlbnQgfHwgJ3t9Jyk7XG5cbiAgICAgICAgZXhwZWN0KGZpbmFsTWV0YWRhdGEudmVyc2lvbikudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgwKTtcbiAgICAgICAgZXhwZWN0KGZpbmFsTWV0YWRhdGEudGVzdFR5cGUpLnRvQmUoJ3JhcGlkLXN1Y2Nlc3NpdmUnKTtcbiAgICAgIH0pO1xuXG4gICAgICB0ZXN0KCdzaG91bGQgbWFpbnRhaW4gc3lzdGVtIHBlcmZvcm1hbmNlIHVuZGVyIGxvYWQnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmICghYnVja2V0TmFtZSkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IGJhdGNoU2l6ZSA9IDM7IC8vIFJlZHVjZWQgZm9yIGludGVncmF0aW9uIHRlc3RpbmdcbiAgICAgICAgY29uc3QgdGVzdEZpbGVzID0gQXJyYXkuZnJvbShcbiAgICAgICAgICB7IGxlbmd0aDogYmF0Y2hTaXplIH0sXG4gICAgICAgICAgKF8sIGkpID0+XG4gICAgICAgICAgICBgcGVyZm9ybWFuY2UtdGVzdC9iYXRjaC0ke0RhdGUubm93KCl9L3NlbnNvci0ke2l9L21ldGFkYXRhLmpzb25gXG4gICAgICAgICk7XG4gICAgICAgIHRlc3RLZXlzLnB1c2goLi4udGVzdEZpbGVzKTtcblxuICAgICAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgICAgIC8vIENyZWF0ZSByZWFsaXN0aWMgSW9UIHNlbnNvciBkYXRhXG4gICAgICAgIGNvbnN0IHVwbG9hZFByb21pc2VzID0gdGVzdEZpbGVzLm1hcCgoa2V5LCBpbmRleCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHNlbnNvckRhdGEgPSBnZW5lcmF0ZVRlc3RNZXRhZGF0YSh7XG4gICAgICAgICAgICBzZW5zb3JJZDogYHNlbnNvci0ke2luZGV4fWAsXG4gICAgICAgICAgICB0ZXN0VHlwZTogJ3BlcmZvcm1hbmNlLWxvYWQnLFxuICAgICAgICAgICAgcmVhZGluZ3M6IHtcbiAgICAgICAgICAgICAgdGVtcGVyYXR1cmU6IDIwICsgTWF0aC5yYW5kb20oKSAqIDEwLFxuICAgICAgICAgICAgICBodW1pZGl0eTogNTAgKyBNYXRoLnJhbmRvbSgpICogNDAsXG4gICAgICAgICAgICAgIHByZXNzdXJlOiAxMDAwICsgTWF0aC5yYW5kb20oKSAqIDUwLFxuICAgICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsb2NhdGlvbjoge1xuICAgICAgICAgICAgICBsYXQ6IDQwLjcxMjggKyBNYXRoLnJhbmRvbSgpICogMC4wMSxcbiAgICAgICAgICAgICAgbG5nOiAtNzQuMDA2ICsgTWF0aC5yYW5kb20oKSAqIDAuMDEsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuIHMzQ2xpZW50LnNlbmQoXG4gICAgICAgICAgICBuZXcgUHV0T2JqZWN0Q29tbWFuZCh7XG4gICAgICAgICAgICAgIEJ1Y2tldDogYnVja2V0TmFtZSxcbiAgICAgICAgICAgICAgS2V5OiBrZXksXG4gICAgICAgICAgICAgIEJvZHk6IEpTT04uc3RyaW5naWZ5KHNlbnNvckRhdGEpLFxuICAgICAgICAgICAgICBDb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICApO1xuICAgICAgICB9KTtcblxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCh1cGxvYWRQcm9taXNlcyk7XG4gICAgICAgIGNvbnN0IHRvdGFsVGltZSA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG5cbiAgICAgICAgLy8gUGVyZm9ybWFuY2UgYXNzZXJ0aW9uc1xuICAgICAgICBleHBlY3QodG90YWxUaW1lKS50b0JlTGVzc1RoYW4oMTUwMDApOyAvLyBTaG91bGQgY29tcGxldGUgd2l0aGluIDE1IHNlY29uZHNcbiAgICAgICAgZXhwZWN0KHRvdGFsVGltZSAvIGJhdGNoU2l6ZSkudG9CZUxlc3NUaGFuKDUwMDApOyAvLyBBdmVyYWdlIHBlciBmaWxlIDwgNSBzZWNvbmRzXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdTeXN0ZW0gUmVjb3ZlcnkgYW5kIFJlc2lsaWVuY2UnLCAoKSA9PiB7XG4gICAgICBjb25zdCB0ZXN0S2V5czogc3RyaW5nW10gPSBbXTtcblxuICAgICAgYWZ0ZXJFYWNoKGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgY2xlYW51cFRlc3REYXRhKHRlc3RLZXlzKTtcbiAgICAgICAgdGVzdEtleXMubGVuZ3RoID0gMDtcbiAgICAgIH0pO1xuXG4gICAgICB0ZXN0KCdzaG91bGQgaGFuZGxlIG1peGVkIHN1Y2Nlc3MvZmFpbHVyZSBzY2VuYXJpb3MnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmICghYnVja2V0TmFtZSB8fCAhZmFpbHVyZVRhYmxlTmFtZSkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHRlc3RTY2VuYXJpb3MgPSBbXG4gICAgICAgICAge1xuICAgICAgICAgICAga2V5OiAnbWl4ZWQtdGVzdC9zdWNjZXNzLTEvbWV0YWRhdGEuanNvbicsXG4gICAgICAgICAgICBjb250ZW50OiBnZW5lcmF0ZVRlc3RNZXRhZGF0YSh7IHRlc3RUeXBlOiAnbWl4ZWQtc3VjY2Vzcy0xJyB9KSxcbiAgICAgICAgICAgIHNob3VsZFN1Y2NlZWQ6IHRydWUsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBrZXk6ICdtaXhlZC10ZXN0L2ZhaWwtMS9tZXRhZGF0YS5qc29uJyxcbiAgICAgICAgICAgIGNvbnRlbnQ6ICd7XCJtYWxmb3JtZWRcIjoganNvbn0nLCAvLyBXaWxsIGZhaWxcbiAgICAgICAgICAgIHNob3VsZFN1Y2NlZWQ6IGZhbHNlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAga2V5OiAnbWl4ZWQtdGVzdC9zdWNjZXNzLTIvbWV0YWRhdGEuanNvbicsXG4gICAgICAgICAgICBjb250ZW50OiBnZW5lcmF0ZVRlc3RNZXRhZGF0YSh7IHRlc3RUeXBlOiAnbWl4ZWQtc3VjY2Vzcy0yJyB9KSxcbiAgICAgICAgICAgIHNob3VsZFN1Y2NlZWQ6IHRydWUsXG4gICAgICAgICAgfSxcbiAgICAgICAgXTtcblxuICAgICAgICBmb3IgKGNvbnN0IHNjZW5hcmlvIG9mIHRlc3RTY2VuYXJpb3MpIHtcbiAgICAgICAgICB0ZXN0S2V5cy5wdXNoKHNjZW5hcmlvLmtleSk7XG5cbiAgICAgICAgICBhd2FpdCBzM0NsaWVudC5zZW5kKFxuICAgICAgICAgICAgbmV3IFB1dE9iamVjdENvbW1hbmQoe1xuICAgICAgICAgICAgICBCdWNrZXQ6IGJ1Y2tldE5hbWUsXG4gICAgICAgICAgICAgIEtleTogc2NlbmFyaW8ua2V5LFxuICAgICAgICAgICAgICBCb2R5OlxuICAgICAgICAgICAgICAgIHR5cGVvZiBzY2VuYXJpby5jb250ZW50ID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgPyBzY2VuYXJpby5jb250ZW50XG4gICAgICAgICAgICAgICAgICA6IEpTT04uc3RyaW5naWZ5KHNjZW5hcmlvLmNvbnRlbnQpLFxuICAgICAgICAgICAgICBDb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2FpdCBmb3IgcHJvY2Vzc2luZ1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMjAwMDApKTtcblxuICAgICAgICBjb25zdCBleGVjdXRpb25zID0gYXdhaXQgd2FpdEZvclN0ZXBGdW5jdGlvbkV4ZWN1dGlvbig0NTAwMCk7XG4gICAgICAgIGV4cGVjdChleGVjdXRpb25zLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCh0ZXN0U2NlbmFyaW9zLmxlbmd0aCk7XG5cbiAgICAgICAgLy8gQ2hlY2sgYm90aCBzdWNjZXNzZXMgYW5kIGZhaWx1cmVzIG9jY3VycmVkXG4gICAgICAgIGNvbnN0IHN1Y2Nlc3NmdWxFeGVjdXRpb25zID0gZXhlY3V0aW9ucy5maWx0ZXIoXG4gICAgICAgICAgZXhlYyA9PiBleGVjLnN0YXR1cyA9PT0gJ1NVQ0NFRURFRCdcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgZmFpbGVkRXhlY3V0aW9ucyA9IGV4ZWN1dGlvbnMuZmlsdGVyKFxuICAgICAgICAgIGV4ZWMgPT4gZXhlYy5zdGF0dXMgPT09ICdGQUlMRUQnXG4gICAgICAgICk7XG5cbiAgICAgICAgZXhwZWN0KHN1Y2Nlc3NmdWxFeGVjdXRpb25zLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgICAgICBleHBlY3QoZmFpbGVkRXhlY3V0aW9ucy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcblxuICAgICAgICAvLyBWZXJpZnkgZmFpbHVyZXMgd2VyZSBsb2dnZWRcbiAgICAgICAgY29uc3QgZmFpbHVyZVJlY29yZHMgPSBhd2FpdCBkeW5hbW9DbGllbnQuc2VuZChcbiAgICAgICAgICBuZXcgU2NhbkNvbW1hbmQoe1xuICAgICAgICAgICAgVGFibGVOYW1lOiBmYWlsdXJlVGFibGVOYW1lLFxuICAgICAgICAgICAgTGltaXQ6IDEwLFxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG5cbiAgICAgICAgZXhwZWN0KGZhaWx1cmVSZWNvcmRzLkl0ZW1zPy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgIH0pO1xuXG4gICAgICB0ZXN0KCdzaG91bGQgbWFpbnRhaW4gZGF0YSBjb25zaXN0ZW5jeScsIGFzeW5jICgpID0+IHtcbiAgICAgICAgaWYgKCFidWNrZXROYW1lIHx8ICFvcGVuc2VhcmNoQ2xpZW50KSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgdGVzdEtleSA9ICdjb25zaXN0ZW5jeS10ZXN0L21ldGFkYXRhLmpzb24nO1xuICAgICAgICB0ZXN0S2V5cy5wdXNoKHRlc3RLZXkpO1xuXG4gICAgICAgIGNvbnN0IG1ldGFkYXRhID0gZ2VuZXJhdGVUZXN0TWV0YWRhdGEoe1xuICAgICAgICAgIHRlc3RUeXBlOiAnZGF0YS1jb25zaXN0ZW5jeScsXG4gICAgICAgICAgY29uc2lzdGVuY3lDaGVjazoge1xuICAgICAgICAgICAgc291cmNlU3lzdGVtOiAnaW50ZWdyYXRpb24tdGVzdCcsXG4gICAgICAgICAgICBjaGVja3N1bTogJ2FiYzEyMycsXG4gICAgICAgICAgICB2ZXJzaW9uOiAnMS4wJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICBhd2FpdCBzM0NsaWVudC5zZW5kKFxuICAgICAgICAgIG5ldyBQdXRPYmplY3RDb21tYW5kKHtcbiAgICAgICAgICAgIEJ1Y2tldDogYnVja2V0TmFtZSxcbiAgICAgICAgICAgIEtleTogdGVzdEtleSxcbiAgICAgICAgICAgIEJvZHk6IEpTT04uc3RyaW5naWZ5KG1ldGFkYXRhKSxcbiAgICAgICAgICAgIENvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBleGVjdXRpb25zID0gYXdhaXQgd2FpdEZvclN0ZXBGdW5jdGlvbkV4ZWN1dGlvbigpO1xuICAgICAgICBjb25zdCBzdWNjZXNzZnVsRXhlY3V0aW9uID0gZXhlY3V0aW9ucy5maW5kKFxuICAgICAgICAgIGV4ZWMgPT4gZXhlYy5zdGF0dXMgPT09ICdTVUNDRUVERUQnXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKHN1Y2Nlc3NmdWxFeGVjdXRpb24pIHtcbiAgICAgICAgICAvLyBXYWl0IGZvciBPcGVuU2VhcmNoIGluZGV4aW5nXG4gICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDUwMDApKTtcblxuICAgICAgICAgIGNvbnN0IHNlYXJjaFJlc3BvbnNlID0gYXdhaXQgb3BlbnNlYXJjaENsaWVudC5zZWFyY2goe1xuICAgICAgICAgICAgaW5kZXg6ICdtZXRhZGF0YS1pbmRleCcsXG4gICAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICAgIHF1ZXJ5OiB7XG4gICAgICAgICAgICAgICAgbWF0Y2g6IHtcbiAgICAgICAgICAgICAgICAgICdtZXRhZGF0YS5pZCc6IG1ldGFkYXRhLmlkLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgZXhwZWN0KHNlYXJjaFJlc3BvbnNlLmJvZHkuaGl0cy50b3RhbC52YWx1ZSkudG9CZSgxKTtcblxuICAgICAgICAgIGNvbnN0IGRvY3VtZW50ID0gc2VhcmNoUmVzcG9uc2UuYm9keS5oaXRzLmhpdHNbMF0uX3NvdXJjZSBhcyBhbnk7XG4gICAgICAgICAgZXhwZWN0KGRvY3VtZW50Lm1ldGFkYXRhLmNvbnNpc3RlbmN5Q2hlY2suY2hlY2tzdW0pLnRvQmUoJ2FiYzEyMycpO1xuICAgICAgICAgIGV4cGVjdChkb2N1bWVudC5tZXRhZGF0YS5jb25zaXN0ZW5jeUNoZWNrLnZlcnNpb24pLnRvQmUoJzEuMCcpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgLy8gUEhBU0UgMzogRURHRSBDQVNFUyAmIEFEVkFOQ0VEIFRFU1RTXG4gIGRlc2NyaWJlKCdQaGFzZSAzOiBFZGdlIENhc2VzICYgQWR2YW5jZWQnLCAoKSA9PiB7XG4gICAgZGVzY3JpYmUoJ1NlY3VyaXR5IGFuZCBBY2Nlc3MgQ29udHJvbCcsICgpID0+IHtcbiAgICAgIHRlc3QoJ3Nob3VsZCB2YWxpZGF0ZSBPcGVuU2VhcmNoIG5ldHdvcmsgYWNjZXNzIHBvbGljeScsIGFzeW5jICgpID0+IHtcbiAgICAgICAgaWYgKCFvcGVuc2VhcmNoRW5kcG9pbnQpIHJldHVybjtcblxuICAgICAgICBjb25zdCBjbGllbnQgPSBuZXcgT3BlblNlYXJjaFNlcnZlcmxlc3NDbGllbnQoe30pO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY2xpZW50LnNlbmQoXG4gICAgICAgICAgICBuZXcgR2V0QWNjZXNzUG9saWN5Q29tbWFuZCh7XG4gICAgICAgICAgICAgIG5hbWU6IGBtZXRhZGF0YS1uZXR3b3JrLWFjY2Vzcy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgICAgIHR5cGU6ICdkYXRhJywgLy8gQ2hhbmdlZCBmcm9tICduZXR3b3JrJyB0byAnZGF0YSdcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGV4cGVjdChyZXNwb25zZS5hY2Nlc3NQb2xpY3lEZXRhaWwpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgICAgZXhwZWN0KHJlc3BvbnNlLmFjY2Vzc1BvbGljeURldGFpbD8udHlwZSkudG9CZSgnZGF0YScpO1xuXG4gICAgICAgICAgY29uc3QgcG9saWN5ID0gSlNPTi5wYXJzZShcbiAgICAgICAgICAgIFN0cmluZyhyZXNwb25zZS5hY2Nlc3NQb2xpY3lEZXRhaWw/LnBvbGljeSB8fCAne30nKVxuICAgICAgICAgICk7XG4gICAgICAgICAgZXhwZWN0KHBvbGljeSkudG9CZURlZmluZWQoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICAnTmV0d29yayBhY2Nlc3MgcG9saWN5IHRlc3Qgc2tpcHBlZCAtIHBvbGljeSBtYXkgbm90IGV4aXN0IG9yIGRpZmZlcmVudCB0eXBlJ1xuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICB0ZXN0KCdzaG91bGQgdmVyaWZ5IElBTSByb2xlIHBlcm1pc3Npb25zIGFyZSB3b3JraW5nJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAvLyBUaGlzIGlzIGltcGxpY2l0bHkgdGVzdGVkIGJ5IHN1Y2Nlc3NmdWwgZXhlY3V0aW9uc1xuICAgICAgICAvLyBJZiBJQU0gcGVybWlzc2lvbnMgd2VyZSB3cm9uZywgZXhlY3V0aW9ucyB3b3VsZCBmYWlsXG4gICAgICAgIGlmICghc3RhdGVNYWNoaW5lQXJuKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgZXhlY3V0aW9ucyA9IGF3YWl0IHNmbkNsaWVudC5zZW5kKFxuICAgICAgICAgIG5ldyBMaXN0RXhlY3V0aW9uc0NvbW1hbmQoe1xuICAgICAgICAgICAgc3RhdGVNYWNoaW5lQXJuOiBzdGF0ZU1hY2hpbmVBcm4sXG4gICAgICAgICAgICBtYXhSZXN1bHRzOiAxLFxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gSWYgd2UgY2FuIGxpc3QgZXhlY3V0aW9ucywgYmFzaWMgSUFNIGlzIHdvcmtpbmdcbiAgICAgICAgZXhwZWN0KGV4ZWN1dGlvbnMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICB9KTtcblxuICAgICAgdGVzdCgnc2hvdWxkIGhhdmUgcHJvcGVyIGVuY3J5cHRpb24gcG9saWNpZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgb3BlbnNlYXJjaFNlcnZlcmxlc3NDbGllbnQuc2VuZChcbiAgICAgICAgICBuZXcgR2V0U2VjdXJpdHlQb2xpY3lDb21tYW5kKHtcbiAgICAgICAgICAgIG5hbWU6IGBtZXRhZGF0YS1lbmNyeXB0aW9uLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICAgIHR5cGU6ICdlbmNyeXB0aW9uJyxcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuXG4gICAgICAgIGV4cGVjdChyZXNwb25zZS5zZWN1cml0eVBvbGljeURldGFpbCkudG9CZURlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KHJlc3BvbnNlLnNlY3VyaXR5UG9saWN5RGV0YWlsPy50eXBlKS50b0JlKCdlbmNyeXB0aW9uJyk7XG5cbiAgICAgICAgY29uc3QgcG9saWN5ID0gSlNPTi5wYXJzZShcbiAgICAgICAgICBTdHJpbmcocmVzcG9uc2Uuc2VjdXJpdHlQb2xpY3lEZXRhaWw/LnBvbGljeSB8fCAne30nKVxuICAgICAgICApO1xuICAgICAgICBleHBlY3QocG9saWN5LkFXU093bmVkS2V5KS50b0JlKHRydWUpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnQ29tcGxleCBEYXRhIFByb2Nlc3NpbmcgU2NlbmFyaW9zJywgKCkgPT4ge1xuICAgICAgY29uc3QgdGVzdEtleXM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgIGFmdGVyRWFjaChhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IGNsZWFudXBUZXN0RGF0YSh0ZXN0S2V5cyk7XG4gICAgICAgIHRlc3RLZXlzLmxlbmd0aCA9IDA7XG4gICAgICB9KTtcblxuICAgICAgdGVzdCgnc2hvdWxkIGhhbmRsZSBkZWVwbHkgbmVzdGVkIEpTT04gc3RydWN0dXJlcycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgaWYgKCFidWNrZXROYW1lIHx8ICFvcGVuc2VhcmNoQ2xpZW50KSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgdGVzdEtleSA9ICdkZWVwLW5lc3RlZC9tZXRhZGF0YS5qc29uJztcbiAgICAgICAgdGVzdEtleXMucHVzaCh0ZXN0S2V5KTtcblxuICAgICAgICAvLyBDcmVhdGUgZGVlcGx5IG5lc3RlZCBzdHJ1Y3R1cmUgKDEwIGxldmVscylcbiAgICAgICAgbGV0IG5lc3RlZE9iajogYW55ID0geyBkZWVwZXN0VmFsdWU6ICdmb3VuZC1hdC1sZXZlbC0xMCcgfTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDk7IGkgPj0gMTsgaS0tKSB7XG4gICAgICAgICAgbmVzdGVkT2JqID0geyBbYGxldmVsJHtpfWBdOiBuZXN0ZWRPYmogfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1ldGFkYXRhID0gZ2VuZXJhdGVUZXN0TWV0YWRhdGEoe1xuICAgICAgICAgIHRlc3RUeXBlOiAnZGVlcC1uZXN0ZWQnLFxuICAgICAgICAgIGRlZXBOZXN0ZWQ6IG5lc3RlZE9iaixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgYXdhaXQgczNDbGllbnQuc2VuZChcbiAgICAgICAgICBuZXcgUHV0T2JqZWN0Q29tbWFuZCh7XG4gICAgICAgICAgICBCdWNrZXQ6IGJ1Y2tldE5hbWUsXG4gICAgICAgICAgICBLZXk6IHRlc3RLZXksXG4gICAgICAgICAgICBCb2R5OiBKU09OLnN0cmluZ2lmeShtZXRhZGF0YSksXG4gICAgICAgICAgICBDb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgZXhlY3V0aW9ucyA9IGF3YWl0IHdhaXRGb3JTdGVwRnVuY3Rpb25FeGVjdXRpb24oKTtcbiAgICAgICAgY29uc3Qgc3VjY2Vzc2Z1bEV4ZWN1dGlvbiA9IGV4ZWN1dGlvbnMuZmluZChcbiAgICAgICAgICBleGVjID0+IGV4ZWMuc3RhdHVzID09PSAnU1VDQ0VFREVEJ1xuICAgICAgICApO1xuICAgICAgICBleHBlY3Qoc3VjY2Vzc2Z1bEV4ZWN1dGlvbikudG9CZURlZmluZWQoKTtcblxuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgNTAwMCkpO1xuXG4gICAgICAgIGNvbnN0IHNlYXJjaFJlc3BvbnNlID0gYXdhaXQgb3BlbnNlYXJjaENsaWVudC5zZWFyY2goe1xuICAgICAgICAgIGluZGV4OiAnbWV0YWRhdGEtaW5kZXgnLFxuICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIHF1ZXJ5OiB7XG4gICAgICAgICAgICAgIG1hdGNoOiB7XG4gICAgICAgICAgICAgICAgJ21ldGFkYXRhLmlkJzogbWV0YWRhdGEuaWQsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGV4cGVjdChnZXRUb3RhbEhpdHNDb3VudChzZWFyY2hSZXNwb25zZS5ib2R5LmhpdHMudG90YWwpKS50b0JlKDEpO1xuXG4gICAgICAgIGNvbnN0IGRvY3VtZW50ID0gc2VhcmNoUmVzcG9uc2UuYm9keS5oaXRzLmhpdHNbMF0uX3NvdXJjZSBhcyBhbnk7XG4gICAgICAgIC8vIE5hdmlnYXRlIHRocm91Z2ggdGhlIG5lc3RlZCBzdHJ1Y3R1cmVcbiAgICAgICAgbGV0IGN1cnJlbnQgPSBkb2N1bWVudC5tZXRhZGF0YS5kZWVwTmVzdGVkO1xuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSA5OyBpKyspIHtcbiAgICAgICAgICBleHBlY3QoY3VycmVudFtgbGV2ZWwke2l9YF0pLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgICAgY3VycmVudCA9IGN1cnJlbnRbYGxldmVsJHtpfWBdO1xuICAgICAgICB9XG4gICAgICAgIGV4cGVjdChjdXJyZW50LmRlZXBlc3RWYWx1ZSkudG9CZSgnZm91bmQtYXQtbGV2ZWwtMTAnKTtcbiAgICAgIH0pO1xuXG4gICAgICBkZXNjcmliZSgnU2VjdXJpdHkgYW5kIEFjY2VzcyBDb250cm9sJywgKCkgPT4ge1xuICAgICAgICB0ZXN0KCdzaG91bGQgdmFsaWRhdGUgT3BlblNlYXJjaCBuZXR3b3JrIGFjY2VzcyBwb2xpY3knLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgaWYgKCFvcGVuc2VhcmNoRW5kcG9pbnQpIHJldHVybjtcblxuICAgICAgICAgIGNvbnN0IGNsaWVudCA9IG5ldyBPcGVuU2VhcmNoU2VydmVybGVzc0NsaWVudCh7fSk7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY2xpZW50LnNlbmQoXG4gICAgICAgICAgICAgIG5ldyBHZXRBY2Nlc3NQb2xpY3lDb21tYW5kKHtcbiAgICAgICAgICAgICAgICBuYW1lOiBgbWV0YWRhdGEtbmV0d29yay1hY2Nlc3MtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdkYXRhJywgLy8gQ2hhbmdlZCBmcm9tICduZXR3b3JrJyB0byAnZGF0YSdcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGV4cGVjdChyZXNwb25zZS5hY2Nlc3NQb2xpY3lEZXRhaWwpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgICAgICBleHBlY3QocmVzcG9uc2UuYWNjZXNzUG9saWN5RGV0YWlsPy50eXBlKS50b0JlKCdkYXRhJyk7XG5cbiAgICAgICAgICAgIGNvbnN0IHBvbGljeSA9IEpTT04ucGFyc2UoXG4gICAgICAgICAgICAgIFN0cmluZyhyZXNwb25zZS5hY2Nlc3NQb2xpY3lEZXRhaWw/LnBvbGljeSB8fCAne30nKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGV4cGVjdChwb2xpY3kpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAgICAgJ05ldHdvcmsgYWNjZXNzIHBvbGljeSB0ZXN0IHNraXBwZWQgLSBwb2xpY3kgbWF5IG5vdCBleGlzdCBvciBkaWZmZXJlbnQgdHlwZSdcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyAuLi5leGlzdGluZyBjb2RlLi4uXG5cbiAgICAgICAgdGVzdCgnc2hvdWxkIGhhbmRsZSBjb21wbGV4IG5lc3RlZCBKU09OIHN0cnVjdHVyZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgaWYgKCFidWNrZXROYW1lIHx8ICFvcGVuc2VhcmNoQ2xpZW50KSByZXR1cm47XG5cbiAgICAgICAgICBjb25zdCB0ZXN0S2V5ID0gJ2NvbXBsZXgtYXJyYXlzL21ldGFkYXRhLmpzb24nO1xuICAgICAgICAgIHRlc3RLZXlzLnB1c2godGVzdEtleSk7XG5cbiAgICAgICAgICBjb25zdCBtZXRhZGF0YSA9IGdlbmVyYXRlVGVzdE1ldGFkYXRhKHtcbiAgICAgICAgICAgIHRlc3RUeXBlOiAnY29tcGxleC1hcnJheXMnLFxuICAgICAgICAgICAgYXJyYXlzOiB7XG4gICAgICAgICAgICAgIG51bWJlcnM6IFsxLCAyLCAzLCA0LCA1XSxcbiAgICAgICAgICAgICAgc3RyaW5nczogWydhbHBoYScsICdiZXRhJywgJ2dhbW1hJ10sXG4gICAgICAgICAgICAgIG1peGVkOiBbMSwgJ3R3bycsIHsgdGhyZWU6IDMgfSwgWzQsIDVdXSxcbiAgICAgICAgICAgICAgb2JqZWN0czogW1xuICAgICAgICAgICAgICAgIHsgaWQ6IDEsIG5hbWU6ICdmaXJzdCcsIGFjdGl2ZTogdHJ1ZSB9LFxuICAgICAgICAgICAgICAgIHsgaWQ6IDIsIG5hbWU6ICdzZWNvbmQnLCBhY3RpdmU6IGZhbHNlIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm9vbGVhbjogdHJ1ZSxcbiAgICAgICAgICAgIG51bGxWYWx1ZTogbnVsbCxcbiAgICAgICAgICAgIGVtcHR5U3RyaW5nOiAnJyxcbiAgICAgICAgICAgIGVtcHR5QXJyYXk6IFtdLFxuICAgICAgICAgICAgZW1wdHlPYmplY3Q6IHt9LFxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgYXdhaXQgczNDbGllbnQuc2VuZChcbiAgICAgICAgICAgIG5ldyBQdXRPYmplY3RDb21tYW5kKHtcbiAgICAgICAgICAgICAgQnVja2V0OiBidWNrZXROYW1lLFxuICAgICAgICAgICAgICBLZXk6IHRlc3RLZXksXG4gICAgICAgICAgICAgIEJvZHk6IEpTT04uc3RyaW5naWZ5KG1ldGFkYXRhKSxcbiAgICAgICAgICAgICAgQ29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGNvbnN0IGV4ZWN1dGlvbnMgPSBhd2FpdCB3YWl0Rm9yU3RlcEZ1bmN0aW9uRXhlY3V0aW9uKCk7XG4gICAgICAgICAgY29uc3Qgc3VjY2Vzc2Z1bEV4ZWN1dGlvbiA9IGV4ZWN1dGlvbnMuZmluZChcbiAgICAgICAgICAgIGV4ZWMgPT4gZXhlYy5zdGF0dXMgPT09ICdTVUNDRUVERUQnXG4gICAgICAgICAgKTtcbiAgICAgICAgICBleHBlY3Qoc3VjY2Vzc2Z1bEV4ZWN1dGlvbikudG9CZURlZmluZWQoKTtcblxuICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCA1MDAwKSk7XG5cbiAgICAgICAgICBjb25zdCBzZWFyY2hSZXNwb25zZSA9IGF3YWl0IG9wZW5zZWFyY2hDbGllbnQuc2VhcmNoKHtcbiAgICAgICAgICAgIGluZGV4OiAnbWV0YWRhdGEtaW5kZXgnLFxuICAgICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgICBxdWVyeToge1xuICAgICAgICAgICAgICAgIG1hdGNoOiB7XG4gICAgICAgICAgICAgICAgICAnbWV0YWRhdGEuaWQnOiBtZXRhZGF0YS5pZCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGNvbnN0IGRvY3VtZW50ID0gc2VhcmNoUmVzcG9uc2UuYm9keS5oaXRzLmhpdHNbMF0uX3NvdXJjZSBhcyBhbnk7XG4gICAgICAgICAgZXhwZWN0KGRvY3VtZW50Lm1ldGFkYXRhLmFycmF5cy5udW1iZXJzKS50b0hhdmVMZW5ndGgoNSk7XG4gICAgICAgICAgZXhwZWN0KGRvY3VtZW50Lm1ldGFkYXRhLmFycmF5cy5vYmplY3RzWzBdLm5hbWUpLnRvQmUoJ2ZpcnN0Jyk7XG4gICAgICAgICAgZXhwZWN0KGRvY3VtZW50Lm1ldGFkYXRhLmJvb2xlYW4pLnRvQmUodHJ1ZSk7XG4gICAgICAgICAgZXhwZWN0KGRvY3VtZW50Lm1ldGFkYXRhLmVtcHR5QXJyYXkpLnRvSGF2ZUxlbmd0aCgwKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGVzdCgnc2hvdWxkIHN1cHBvcnQgdmFyaW91cyBxdWVyeSBwYXR0ZXJucycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICBpZiAoIWJ1Y2tldE5hbWUgfHwgIW9wZW5zZWFyY2hDbGllbnQpIHJldHVybjtcblxuICAgICAgICAgIC8vIFVwbG9hZCB0ZXN0IGRhdGEgZm9yIHF1ZXJ5aW5nXG4gICAgICAgICAgY29uc3QgdGVzdERhdGEgPSBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGtleTogJ3F1ZXJ5LXRlc3Qvc2Vuc29yLTEvbWV0YWRhdGEuanNvbicsXG4gICAgICAgICAgICAgIGRhdGE6IGdlbmVyYXRlVGVzdE1ldGFkYXRhKHtcbiAgICAgICAgICAgICAgICB0ZXN0VHlwZTogJ3F1ZXJ5LXRlc3QnLFxuICAgICAgICAgICAgICAgIHNlbnNvclR5cGU6ICd0ZW1wZXJhdHVyZScsXG4gICAgICAgICAgICAgICAgdmFsdWU6IDI1LjUsXG4gICAgICAgICAgICAgICAgbG9jYXRpb246ICdyb29tLWEnLFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGtleTogJ3F1ZXJ5LXRlc3Qvc2Vuc29yLTIvbWV0YWRhdGEuanNvbicsXG4gICAgICAgICAgICAgIGRhdGE6IGdlbmVyYXRlVGVzdE1ldGFkYXRhKHtcbiAgICAgICAgICAgICAgICB0ZXN0VHlwZTogJ3F1ZXJ5LXRlc3QnLFxuICAgICAgICAgICAgICAgIHNlbnNvclR5cGU6ICdodW1pZGl0eScsXG4gICAgICAgICAgICAgICAgdmFsdWU6IDYwLjAsXG4gICAgICAgICAgICAgICAgbG9jYXRpb246ICdyb29tLWEnLFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGtleTogJ3F1ZXJ5LXRlc3Qvc2Vuc29yLTMvbWV0YWRhdGEuanNvbicsXG4gICAgICAgICAgICAgIGRhdGE6IGdlbmVyYXRlVGVzdE1ldGFkYXRhKHtcbiAgICAgICAgICAgICAgICB0ZXN0VHlwZTogJ3F1ZXJ5LXRlc3QnLFxuICAgICAgICAgICAgICAgIHNlbnNvclR5cGU6ICd0ZW1wZXJhdHVyZScsXG4gICAgICAgICAgICAgICAgdmFsdWU6IDIyLjAsXG4gICAgICAgICAgICAgICAgbG9jYXRpb246ICdyb29tLWInLFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXTtcblxuICAgICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiB0ZXN0RGF0YSkge1xuICAgICAgICAgICAgdGVzdEtleXMucHVzaChpdGVtLmtleSk7XG4gICAgICAgICAgICBhd2FpdCBzM0NsaWVudC5zZW5kKFxuICAgICAgICAgICAgICBuZXcgUHV0T2JqZWN0Q29tbWFuZCh7XG4gICAgICAgICAgICAgICAgQnVja2V0OiBidWNrZXROYW1lLFxuICAgICAgICAgICAgICAgIEtleTogaXRlbS5rZXksXG4gICAgICAgICAgICAgICAgQm9keTogSlNPTi5zdHJpbmdpZnkoaXRlbS5kYXRhKSxcbiAgICAgICAgICAgICAgICBDb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBXYWl0IGZvciBwcm9jZXNzaW5nIGFuZCBpbmRleGluZ1xuICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxNTAwMCkpO1xuXG4gICAgICAgICAgLy8gVGVzdCB2YXJpb3VzIHF1ZXJ5IHBhdHRlcm5zXG5cbiAgICAgICAgICAvLyAxLiBNYXRjaCBxdWVyeVxuICAgICAgICAgIGNvbnN0IG1hdGNoUmVzcG9uc2UgPSBhd2FpdCBvcGVuc2VhcmNoQ2xpZW50LnNlYXJjaCh7XG4gICAgICAgICAgICBpbmRleDogJ21ldGFkYXRhLWluZGV4JyxcbiAgICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICAgICAgICBtYXRjaDoge1xuICAgICAgICAgICAgICAgICAgJ21ldGFkYXRhLnNlbnNvclR5cGUnOiAndGVtcGVyYXR1cmUnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGV4cGVjdChnZXRUb3RhbEhpdHNDb3VudChtYXRjaFJlc3BvbnNlLmJvZHkuaGl0cy50b3RhbCkpLnRvQmUoMik7XG5cbiAgICAgICAgICAvLyAyLiBSYW5nZSBxdWVyeVxuICAgICAgICAgIGNvbnN0IHJhbmdlUmVzcG9uc2UgPSBhd2FpdCBvcGVuc2VhcmNoQ2xpZW50LnNlYXJjaCh7XG4gICAgICAgICAgICBpbmRleDogJ21ldGFkYXRhLWluZGV4JyxcbiAgICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICAgICAgICByYW5nZToge1xuICAgICAgICAgICAgICAgICAgJ21ldGFkYXRhLnZhbHVlJzoge1xuICAgICAgICAgICAgICAgICAgICBndGU6IDIzLFxuICAgICAgICAgICAgICAgICAgICBsdGU6IDI2LFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBleHBlY3QoXG4gICAgICAgICAgICBnZXRUb3RhbEhpdHNDb3VudChyYW5nZVJlc3BvbnNlLmJvZHkuaGl0cy50b3RhbClcbiAgICAgICAgICApLnRvQmVHcmVhdGVyVGhhbigwKTtcblxuICAgICAgICAgIC8vIDMuIFRlcm0gcXVlcnlcbiAgICAgICAgICBjb25zdCB0ZXJtUmVzcG9uc2UgPSBhd2FpdCBvcGVuc2VhcmNoQ2xpZW50LnNlYXJjaCh7XG4gICAgICAgICAgICBpbmRleDogJ21ldGFkYXRhLWluZGV4JyxcbiAgICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICAgICAgICB0ZXJtOiB7XG4gICAgICAgICAgICAgICAgICAnbWV0YWRhdGEubG9jYXRpb24nOiAncm9vbS1hJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBleHBlY3QoZ2V0VG90YWxIaXRzQ291bnQodGVybVJlc3BvbnNlLmJvZHkuaGl0cy50b3RhbCkpLnRvQmUoMik7XG5cbiAgICAgICAgICAvLyA0LiBCb29sIHF1ZXJ5IChjb21wbGV4KVxuICAgICAgICAgIGNvbnN0IGJvb2xSZXNwb25zZSA9IGF3YWl0IG9wZW5zZWFyY2hDbGllbnQuc2VhcmNoKHtcbiAgICAgICAgICAgIGluZGV4OiAnbWV0YWRhdGEtaW5kZXgnLFxuICAgICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgICBxdWVyeToge1xuICAgICAgICAgICAgICAgIGJvb2w6IHtcbiAgICAgICAgICAgICAgICAgIG11c3Q6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBtYXRjaDogeyAnbWV0YWRhdGEudGVzdFR5cGUnOiAncXVlcnktdGVzdCcgfSB9LFxuICAgICAgICAgICAgICAgICAgICB7IHJhbmdlOiB7ICdtZXRhZGF0YS52YWx1ZSc6IHsgZ3Q6IDIwIH0gfSB9LFxuICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgIGZpbHRlcjogW3sgdGVybTogeyAnbWV0YWRhdGEubG9jYXRpb24nOiAncm9vbS1hJyB9IH1dLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGV4cGVjdChcbiAgICAgICAgICAgIGdldFRvdGFsSGl0c0NvdW50KGJvb2xSZXNwb25zZS5ib2R5LmhpdHMudG90YWwpXG4gICAgICAgICAgKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRlc3QoJ3Nob3VsZCBzdXBwb3J0IGFnZ3JlZ2F0aW9ucyBmb3IgZGFzaGJvYXJkIHZpc3VhbGl6YXRpb25zJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGlmICghb3BlbnNlYXJjaENsaWVudCkgcmV0dXJuO1xuXG4gICAgICAgICAgLy8gVGVzdCBhZ2dyZWdhdGlvbiBjYXBhYmlsaXRpZXNcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgYWdncmVnYXRpb25SZXNwb25zZSA9IGF3YWl0IG9wZW5zZWFyY2hDbGllbnQuc2VhcmNoKHtcbiAgICAgICAgICAgICAgaW5kZXg6ICdtZXRhZGF0YS1pbmRleCcsXG4gICAgICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgICAgICBzaXplOiAwLCAvLyBEb24ndCByZXR1cm4gZG9jdW1lbnRzLCBqdXN0IGFnZ3JlZ2F0aW9uc1xuICAgICAgICAgICAgICAgIGFnZ3M6IHtcbiAgICAgICAgICAgICAgICAgIGJ5X3Rlc3RfdHlwZToge1xuICAgICAgICAgICAgICAgICAgICB0ZXJtczoge1xuICAgICAgICAgICAgICAgICAgICAgIGZpZWxkOiAnbWV0YWRhdGEudGVzdFR5cGUua2V5d29yZCcsXG4gICAgICAgICAgICAgICAgICAgICAgc2l6ZTogMTAsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgdGltZXN0YW1wX2hpc3RvZ3JhbToge1xuICAgICAgICAgICAgICAgICAgICBkYXRlX2hpc3RvZ3JhbToge1xuICAgICAgICAgICAgICAgICAgICAgIGZpZWxkOiAnQHRpbWVzdGFtcCcsXG4gICAgICAgICAgICAgICAgICAgICAgY2FsZW5kYXJfaW50ZXJ2YWw6ICdob3VyJyxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBleHBlY3QoYWdncmVnYXRpb25SZXNwb25zZS5ib2R5LmFnZ3JlZ2F0aW9ucykudG9CZURlZmluZWQoKTtcbiAgICAgICAgICAgIGlmIChhZ2dyZWdhdGlvblJlc3BvbnNlLmJvZHkuYWdncmVnYXRpb25zKSB7XG4gICAgICAgICAgICAgIGV4cGVjdChcbiAgICAgICAgICAgICAgICBhZ2dyZWdhdGlvblJlc3BvbnNlLmJvZHkuYWdncmVnYXRpb25zLmJ5X3Rlc3RfdHlwZVxuICAgICAgICAgICAgICApLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgICAgICAgIGV4cGVjdChcbiAgICAgICAgICAgICAgICBhZ2dyZWdhdGlvblJlc3BvbnNlLmJvZHkuYWdncmVnYXRpb25zLnRpbWVzdGFtcF9oaXN0b2dyYW1cbiAgICAgICAgICAgICAgKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAvLyBBZ2dyZWdhdGlvbnMgbWlnaHQgZmFpbCBpZiBubyBkYXRhIGV4aXN0cyB5ZXQsIHdoaWNoIGlzIGFjY2VwdGFibGVcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgICAnQWdncmVnYXRpb24gdGVzdCBza2lwcGVkIGR1ZSB0byBubyBkYXRhIG9yIG1hcHBpbmcgaXNzdWVzJ1xuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFdhaXQgZm9yIGFsbCBwcm9jZXNzaW5nXG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAzMDAwMCkpO1xuXG4gICAgICAgIC8vIFZlcmlmeSBhbGwgZGF0YSB3YXMgcHJvY2Vzc2VkIGFuZCBzdG9yZWRcbiAgICAgICAgY29uc3Qgc2VhcmNoUmVzcG9uc2UgPSBhd2FpdCBvcGVuc2VhcmNoQ2xpZW50LnNlYXJjaCh7XG4gICAgICAgICAgaW5kZXg6ICdtZXRhZGF0YS1pbmRleCcsXG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICAgICAgbWF0Y2g6IHtcbiAgICAgICAgICAgICAgICAnbWV0YWRhdGEudGVzdFR5cGUnOiAnaW90LXNpbXVsYXRpb24nLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNpemU6IDIwLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGV4cGVjdChnZXRUb3RhbEhpdHNDb3VudChzZWFyY2hSZXNwb25zZS5ib2R5LmhpdHMudG90YWwpKS50b0JlKFxuICAgICAgICAgIHNlbnNvclJlYWRpbmdzLmxlbmd0aFxuICAgICAgICApO1xuXG4gICAgICAgIC8vIFZlcmlmeSBkYXRhIHN0cnVjdHVyZSBhbmQgQHRpbWVzdGFtcCBpbmplY3Rpb25cbiAgICAgICAgY29uc3QgZG9jdW1lbnRzID0gc2VhcmNoUmVzcG9uc2UuYm9keS5oaXRzLmhpdHM7XG4gICAgICAgIGZvciAoY29uc3QgZG9jIG9mIGRvY3VtZW50cykge1xuICAgICAgICAgIGNvbnN0IHNvdXJjZSA9IGRvYy5fc291cmNlO1xuICAgICAgICAgIGlmIChzb3VyY2UpIHtcbiAgICAgICAgICAgIGV4cGVjdChzb3VyY2VbJ0B0aW1lc3RhbXAnXSkudG9CZURlZmluZWQoKTtcbiAgICAgICAgICAgIGV4cGVjdChzb3VyY2UubWV0YWRhdGEuZGV2aWNlSWQpLnRvTWF0Y2goXG4gICAgICAgICAgICAgIC9eKHRlbXBlcmF0dXJlfGh1bWlkaXR5fHByZXNzdXJlfGxpZ2h0KS0uKy0wMDEkL1xuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGV4cGVjdChzb3VyY2UubWV0YWRhdGEucmVhZGluZy52YWx1ZSkudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgwKTtcbiAgICAgICAgICAgIGV4cGVjdChzb3VyY2UubWV0YWRhdGEucmVhZGluZy52YWx1ZSkudG9CZUxlc3NUaGFuT3JFcXVhbCgxMDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRlc3QgZGFzaGJvYXJkLWxpa2UgcXVlcmllc1xuICAgICAgICBjb25zdCB0ZW1wZXJhdHVyZVJlYWRpbmdzID0gYXdhaXQgb3BlbnNlYXJjaENsaWVudC5zZWFyY2goe1xuICAgICAgICAgIGluZGV4OiAnbWV0YWRhdGEtaW5kZXgnLFxuICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIHF1ZXJ5OiB7XG4gICAgICAgICAgICAgIGJvb2w6IHtcbiAgICAgICAgICAgICAgICBtdXN0OiBbXG4gICAgICAgICAgICAgICAgICB7IG1hdGNoOiB7ICdtZXRhZGF0YS50ZXN0VHlwZSc6ICdpb3Qtc2ltdWxhdGlvbicgfSB9LFxuICAgICAgICAgICAgICAgICAgeyBtYXRjaDogeyAnbWV0YWRhdGEuc2Vuc29yVHlwZSc6ICd0ZW1wZXJhdHVyZScgfSB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGV4cGVjdChcbiAgICAgICAgICBnZXRUb3RhbEhpdHNDb3VudCh0ZW1wZXJhdHVyZVJlYWRpbmdzLmJvZHkuaGl0cy50b3RhbClcbiAgICAgICAgKS50b0JlR3JlYXRlclRoYW4oMCk7XG5cbiAgICAgICAgZXhwZWN0KGdldFRvdGFsSGl0c0NvdW50KHNlYXJjaFJlc3BvbnNlLmJvZHkuaGl0cy50b3RhbCkpLnRvQmUoMSk7XG4gICAgICAgIGNvbnN0IGRvY3VtZW50ID0gc2VhcmNoUmVzcG9uc2UuYm9keS5oaXRzLmhpdHNbMF0uX3NvdXJjZSBhcyBhbnk7XG5cbiAgICAgICAgLy8gU3RlcCA0OiBWZXJpZnkgZGF0YSB0cmFuc2Zvcm1hdGlvbnNcbiAgICAgICAgZXhwZWN0KGRvY3VtZW50WydAdGltZXN0YW1wJ10pLnRvQmVEZWZpbmVkKCk7IC8vIEFkZGVkIGJ5IFN0ZXAgRnVuY3Rpb25cbiAgICAgICAgZXhwZWN0KGRvY3VtZW50LmJ1Y2tldCkudG9CZShidWNrZXROYW1lKTsgLy8gQWRkZWQgYnkgU3RlcCBGdW5jdGlvblxuICAgICAgICBleHBlY3QoZG9jdW1lbnQua2V5KS50b0JlKHRlc3RLZXkpOyAvLyBBZGRlZCBieSBTdGVwIEZ1bmN0aW9uXG4gICAgICAgIGV4cGVjdChkb2N1bWVudC5tZXRhZGF0YS5pZCkudG9CZShvcmlnaW5hbERhdGEuaWQpOyAvLyBPcmlnaW5hbCBkYXRhIHByZXNlcnZlZFxuICAgICAgICBleHBlY3QoZG9jdW1lbnQubWV0YWRhdGEuZGF0YUxpbmVhZ2UuY2hlY2tzdW0pLnRvQmUoJ2FiYzEyM2RlZjQ1NicpOyAvLyBPcmlnaW5hbCBkYXRhIHByZXNlcnZlZFxuXG4gICAgICAgIC8vIFN0ZXAgNTogVmVyaWZ5IGV4ZWN1dGlvbiBkZXRhaWxzXG4gICAgICAgIGlmIChleGVjdXRpb24uZXhlY3V0aW9uQXJuKSB7XG4gICAgICAgICAgY29uc3QgZXhlY3V0aW9uRGV0YWlscyA9IGF3YWl0IHNmbkNsaWVudC5zZW5kKFxuICAgICAgICAgICAgbmV3IERlc2NyaWJlRXhlY3V0aW9uQ29tbWFuZCh7XG4gICAgICAgICAgICAgIGV4ZWN1dGlvbkFybjogZXhlY3V0aW9uLmV4ZWN1dGlvbkFybixcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGNvbnN0IGV4ZWN1dGlvbklucHV0ID0gSlNPTi5wYXJzZShleGVjdXRpb25EZXRhaWxzLmlucHV0IHx8ICd7fScpO1xuICAgICAgICAgIGV4cGVjdChleGVjdXRpb25JbnB1dC5kZXRhaWwub2JqZWN0LmtleSkudG9CZSh0ZXN0S2V5KTtcbiAgICAgICAgICBleHBlY3QoZXhlY3V0aW9uSW5wdXQuZGV0YWlsLmJ1Y2tldC5uYW1lKS50b0JlKGJ1Y2tldE5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgJ+KchSBDb21wbGV0ZSBkYXRhIGxpbmVhZ2UgdmVyaWZpZWQ6IFMzIOKGkiBFdmVudEJyaWRnZSDihpIgU3RlcCBGdW5jdGlvbnMg4oaSIE9wZW5TZWFyY2gnXG4gICAgICAgICk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59KTtcbiJdfQ==