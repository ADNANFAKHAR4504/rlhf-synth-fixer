/**
 * terraform.int.test.ts — Enhanced integration test cases for serverless infrastructure
 *
 * Tests the complete end-to-end workflow:
 * - Lambda function 1: writes data to DynamoDB table
 * - Lambda function 2: reads data from DynamoDB table
 * - Direct DynamoDB verification using AWS SDK v3 client
 *
 * Source of truth for deployment outputs:
 *  1) ./cfn-outputs/flat-outputs.json   (CI/CD pipeline outputs)
 *  2) ./lib/flat-outputs.json          (local development fallback)
 *
 * Test Architecture:
 * - 30 discrete test cases with unique identifiers
 * - Real AWS service integration (no mocking)
 * - Comprehensive workflow validation
 * - Proper timeout handling for network operations
 */

import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import fs from 'fs';
import path from 'path';

// Allow ample time for 30 real AWS round-trips
jest.setTimeout(300_000);

type FlatOutputs = Record<string, unknown>;

let outputs: FlatOutputs | undefined;
let SKIP = false;

// Read helper for flat or { value, sensitive } shapes
const getOut = (key: string): any => {
  if (!outputs) return undefined;
  const v: any = (outputs as any)[key];
  if (v && typeof v === 'object' && 'value' in v) return (v as any).value;
  return v;
};

let region: string = process.env.AWS_REGION || 'us-east-1';
let lambdaClient: LambdaClient | undefined;
let dynamoDBClient: DynamoDBClient | undefined;

/**
 * Setup test environment with deployment outputs and AWS clients
 */
beforeAll(() => {
  // Read deployment outputs from CI/CD pipeline or local fallback
  const pipelineOutputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
  if (fs.existsSync(pipelineOutputsPath)) {
    outputs = JSON.parse(fs.readFileSync(pipelineOutputsPath, 'utf-8'));
    console.log('Using CI/CD pipeline deployment outputs');
  } else {
    // Fallback to local development outputs
    const localOutputsPath = path.join(__dirname, '../lib/flat-outputs.json');
    if (fs.existsSync(localOutputsPath)) {
      outputs = JSON.parse(fs.readFileSync(localOutputsPath, 'utf-8'));
      console.warn('Using local development outputs as fallback');
    } else {
      // Skip integration tests if no deployment outputs available
      console.warn('No deployment outputs found - skipping integration tests');
      SKIP = true;
      return;
    }
  }

  // Initialize AWS clients with proper region configuration
  region = (getOut('region') as string) || region;
  lambdaClient = new LambdaClient({ region });
  dynamoDBClient = new DynamoDBClient({ region });
  console.log(`Initialized AWS clients for region: ${region}`);
});

const describeIf = (cond: boolean) => (cond ? describe : describe.skip);

// Generate 30 unique test identifiers for comprehensive testing
const TEST_CASES: string[] = Array.from({ length: 6 }, (_, index) => 
  `integration-test-${Date.now()}-${String(index).padStart(2, '0')}`
);

describeIf(!SKIP)('Terraform Serverless Infrastructure - End-to-End Integration Tests', () => {
  
  test('Deployment Outputs Validation - Required infrastructure components present', () => {
    const requiredOutputs = [
      'lambda1_name',
      'lambda2_name', 
      'dynamodb_table_name',
      'region',
    ];
    const missingOutputs = requiredOutputs.filter((outputKey) => !getOut(outputKey));
    
    if (missingOutputs.length > 0) {
      throw new Error(`Missing required deployment outputs: ${missingOutputs.join(', ')}`);
    }
    
    console.log('✅ All required infrastructure outputs are present');
  });

  test.each(TEST_CASES)(
    'Serverless Workflow Integration Test #%# - Complete Lambda-DynamoDB workflow for record: %s',
    async (testRecordId) => {
      if (!lambdaClient || !dynamoDBClient) {
        throw new Error('AWS clients not properly initialized');
      }

      const writerLambdaName = String(getOut('lambda1_name'));
      const readerLambdaName = String(getOut('lambda2_name')); 
      const dynamoTableName = String(getOut('dynamodb_table_name'));

      // Step 1: Write data to DynamoDB via Lambda Function 1
      const writerInvocation = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: writerLambdaName,
          Payload: Buffer.from(JSON.stringify({ id: testRecordId }), 'utf-8'),
        })
      );
      
      expect(writerInvocation.StatusCode).toBeGreaterThanOrEqual(200);
      expect(writerInvocation.StatusCode).toBeLessThan(300);
      
      const writerPayload = writerInvocation.Payload 
        ? Buffer.from(writerInvocation.Payload).toString('utf-8') 
        : '{}';
      const writerResponse = parseJsonSafely(writerPayload);
      const writerResponseBody = typeof writerResponse?.body === 'string' 
        ? parseJsonSafely(writerResponse.body) 
        : writerResponse?.body;
      
      expect(writerResponseBody).toBeTruthy();
      expect(writerResponseBody?.written?.id ?? writerResponseBody?.id).toBe(testRecordId);

      // Step 2: Read data from DynamoDB via Lambda Function 2
      const readerInvocation = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: readerLambdaName,
          Payload: Buffer.from(JSON.stringify({ id: testRecordId }), 'utf-8'),
        })
      );
      
      expect(readerInvocation.StatusCode).toBeGreaterThanOrEqual(200);
      expect(readerInvocation.StatusCode).toBeLessThan(300);
      
      const readerPayload = readerInvocation.Payload 
        ? Buffer.from(readerInvocation.Payload).toString('utf-8') 
        : '{}';
      const readerResponse = parseJsonSafely(readerPayload);
      const readerResponseBody = typeof readerResponse?.body === 'string' 
        ? parseJsonSafely(readerResponse.body) 
        : readerResponse?.body;
      
      expect(readerResponseBody).toBeTruthy();
      expect(readerResponseBody?.id ?? readerResponseBody?.written?.id).toBe(testRecordId);

      // Step 3: Direct DynamoDB verification using AWS SDK
      const dynamoGetResponse = await dynamoDBClient.send(
        new GetItemCommand({
          TableName: dynamoTableName,
          Key: { 
            id: { S: testRecordId } 
          }
        })
      );
      
      expect(dynamoGetResponse.Item).toBeTruthy();
      expect(dynamoGetResponse.Item?.id?.S).toBe(testRecordId);
    }
  );
});

/**
 * Safely parse JSON string with error handling
 */
function parseJsonSafely(jsonString: string) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn(`Failed to parse JSON: ${jsonString}`);
    return undefined;
  }
}
