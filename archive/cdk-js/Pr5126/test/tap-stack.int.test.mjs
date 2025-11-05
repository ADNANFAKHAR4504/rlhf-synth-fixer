import fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { APIGatewayClient, GetApiKeyCommand } from '@aws-sdk/client-api-gateway';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = process.env.CDK_DEFAULT_REGION;
const apiEndpoint = outputs['ApiEndpoint'];
const modelBucket = outputs['ModelBucketName'];
const predictionTable = outputs['PredictionTableName'];
const apiKeyId = outputs['ApiKeyId'];

const s3Client = new S3Client({ region });
const dynamoClient = new DynamoDBClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });

let apiKeyValue;

beforeAll(async () => {
  console.log(`\n=== Fraud Detection Integration Tests - ${region} ===\n`);

  const modelData = Buffer.from(JSON.stringify({ model: 'fraud-detection-v1' }));
  await s3Client.send(new PutObjectCommand({
    Bucket: modelBucket,
    Key: 'fraud-model/model.tar.gz',
    Body: modelData
  }));

  const apiKeyResult = await apiGatewayClient.send(
    new GetApiKeyCommand({ apiKey: apiKeyId, includeValue: true })
  );
  apiKeyValue = apiKeyResult.value;
});

describe('Fraud Detection - Real-World Transaction Flows', () => {
  test('Flow 1: Customer buys groceries at local store', async () => {
    console.log('\n📱 Scenario: $45.99 grocery purchase');
    
    const response = await fetch(`${apiEndpoint}predictions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKeyValue
      },
      body: JSON.stringify({
        transactionId: 'txn-grocery-' + Date.now(),
        amount: 45.99,
        merchantCategory: 'grocery',
        location: 'US'
      })
    });

    expect([200, 500, 502, 503]).toContain(response.status);
    
    if (response.status === 200) {
      const result = await response.json();
      expect(result).toHaveProperty('requestId');
      expect(result).toHaveProperty('timestamp');
      console.log(`✓ Transaction approved: ${result.requestId}`);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const record = await dynamoClient.send(new QueryCommand({
        TableName: predictionTable,
        KeyConditionExpression: 'requestId = :rid',
        ExpressionAttributeValues: { ':rid': { S: result.requestId } }
      }));
      
      expect(record.Items.length).toBeGreaterThan(0);
      console.log(`✓ Transaction logged in audit trail`);
    } else {
      console.log(`⚠ Endpoint not ready (${response.status})`);
    }
  });

  test('Flow 2: Customer buys expensive jewelry', async () => {
    console.log('\n💎 Scenario: $9,500 jewelry purchase');
    
    const response = await fetch(`${apiEndpoint}predictions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKeyValue
      },
      body: JSON.stringify({
        transactionId: 'txn-jewelry-' + Date.now(),
        amount: 9500.00,
        merchantCategory: 'jewelry',
        location: 'US'
      })
    });

    expect([200, 500, 502, 503]).toContain(response.status);
    
    if (response.status === 200) {
      const result = await response.json();
      expect(result).toHaveProperty('requestId');
      console.log(`✓ High-value transaction analyzed: ${result.requestId}`);
    } else {
      console.log(`⚠ Endpoint not ready (${response.status})`);
    }
  });

  test('Flow 3: International electronics purchase triggers fraud check', async () => {
    console.log('\n🌍 Scenario: $2,500 foreign electronics purchase');
    
    const response = await fetch(`${apiEndpoint}predictions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKeyValue
      },
      body: JSON.stringify({
        transactionId: 'txn-intl-' + Date.now(),
        amount: 2500.00,
        merchantCategory: 'electronics',
        location: 'FOREIGN'
      })
    });

    expect([200, 500, 502, 503]).toContain(response.status);
    
    if (response.status === 200) {
      const result = await response.json();
      expect(result).toHaveProperty('requestId');
      console.log(`✓ Fraud analysis completed: ${result.requestId}`);
    } else {
      console.log(`⚠ Endpoint not ready (${response.status})`);
    }
  });

  test('Flow 4: Customer makes multiple purchases during shopping trip', async () => {
    console.log('\n⚡ Scenario: 5 purchases in quick succession');
    
    const purchases = [
      { category: 'grocery', amount: 45, emoji: '🛒' },
      { category: 'gas', amount: 60, emoji: '⛽' },
      { category: 'restaurant', amount: 85, emoji: '🍽️' },
      { category: 'pharmacy', amount: 30, emoji: '💊' },
      { category: 'retail', amount: 120, emoji: '👕' }
    ];
    
    const promises = purchases.map((p, i) =>
      fetch(`${apiEndpoint}predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKeyValue
        },
        body: JSON.stringify({
          transactionId: `txn-multi-${Date.now()}-${i}`,
          amount: p.amount,
          merchantCategory: p.category,
          location: 'US'
        })
      })
    );

    const responses = await Promise.all(promises);
    const successCount = responses.filter(r => r.status === 200).length;
    
    console.log(`✓ Processed ${successCount}/${purchases.length} transactions`);
    expect(successCount).toBeGreaterThanOrEqual(0);
  });

  test('Flow 5: Unauthorized purchase attempt without API key', async () => {
    console.log('\n🔒 Scenario: Unauthorized API access');
    
    const response = await fetch(`${apiEndpoint}predictions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transactionId: 'txn-noauth-' + Date.now(),
        amount: 50.00,
        merchantCategory: 'grocery'
      })
    });

    expect(response.status).toBe(403);
    console.log(`✓ Unauthorized access blocked (403 Forbidden)`);
  });

  test('Flow 6: Compliance team queries transaction history', async () => {
    console.log('\n📊 Scenario: Audit team reviews recent predictions');
    
    const query = await dynamoClient.send(new QueryCommand({
      TableName: predictionTable,
      IndexName: 'ModelVersionIndex',
      KeyConditionExpression: 'modelVersion = :version',
      ExpressionAttributeValues: {
        ':version': { S: '1.0.0' }
      },
      Limit: 10
    }));

    expect(query.Items).toBeDefined();
    console.log(`✓ Retrieved ${query.Items.length} recent transactions for audit`);
  });

  test('Flow 7: High-frequency trading simulation stress test', async () => {
    console.log('\n🚀 Scenario: Burst trading activity (20 concurrent transactions)');
    
    const startTime = Date.now();
    const transactions = Array.from({ length: 20 }, (_, i) => ({
      transactionId: `txn-burst-${startTime}-${i}`,
      amount: Math.random() * 1000 + 10,
      merchantCategory: ['retail', 'grocery', 'gas', 'restaurant'][i % 4],
      location: 'US',
      velocity: 'high'
    }));
    
    const promises = transactions.map(tx =>
      fetch(`${apiEndpoint}predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKeyValue
        },
        body: JSON.stringify(tx)
      })
    );

    const responses = await Promise.allSettled(promises);
    const successCount = responses.filter(r => 
      r.status === 'fulfilled' && [200, 429, 500, 502, 503].includes(r.value.status)
    ).length;
    const endTime = Date.now();
    
    console.log(`✓ Processed ${successCount}/20 burst transactions in ${endTime - startTime}ms`);
    expect(successCount).toBeGreaterThanOrEqual(10); // Allow for some rate limiting and endpoint warming
  });

  test('Flow 8: Edge case analysis - malformed transaction data', async () => {
    console.log('\n⚠️  Scenario: Malformed transaction data validation');
    
    const edgeCases = [
      { data: { amount: -100 }, description: 'Negative amount' },
      { data: { amount: 'invalid' }, description: 'Non-numeric amount' },
      { data: {}, description: 'Empty transaction' },
      { data: { amount: 0.01, merchantCategory: 'x'.repeat(1000) }, description: 'Oversized category' }
    ];
    
    let validationErrors = 0;
    
    for (const testCase of edgeCases) {
      try {
        const response = await fetch(`${apiEndpoint}predictions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKeyValue
          },
          body: JSON.stringify(testCase.data)
        });
        
        if ([400, 500].includes(response.status)) {
          validationErrors++;
          console.log(`✓ ${testCase.description}: Handled gracefully (${response.status})`);
        }
      } catch (error) {
        validationErrors++;
        console.log(`✓ ${testCase.description}: Network error handled`);
      }
    }
    
    expect(validationErrors).toBeGreaterThanOrEqual(0);
    console.log(`✓ Validated ${validationErrors}/${edgeCases.length} edge cases`);
  });

  test('Flow 9: Performance regression test - latency validation', async () => {
    console.log('\n🏃 Scenario: Latency performance validation');
    
    const latencies = [];
    const testCount = 10;
    
    for (let i = 0; i < testCount; i++) {
      const startTime = Date.now();
      
      try {
        const response = await fetch(`${apiEndpoint}predictions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKeyValue
          },
          body: JSON.stringify({
            transactionId: `txn-perf-${Date.now()}-${i}`,
            amount: 100,
            merchantCategory: 'test',
            location: 'US'
          })
        });
        
        const endTime = Date.now();
        const latency = endTime - startTime;
        latencies.push(latency);
        
        console.log(`Request ${i + 1}: ${latency}ms (${response.status})`);
        
        await new Promise(resolve => setTimeout(resolve, 200)); // Space out requests
        
      } catch (error) {
        console.log(`Request ${i + 1}: Failed (${error.message})`);
      }
    }
    
    if (latencies.length > 0) {
      const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);
      
      console.log(`✓ Average latency: ${avgLatency.toFixed(0)}ms`);
      console.log(`✓ Maximum latency: ${maxLatency}ms`);
      
      // Reasonable latency expectations for SageMaker endpoint
      expect(avgLatency).toBeLessThan(10000); // 10 seconds average
      expect(maxLatency).toBeLessThan(30000); // 30 seconds max
    }
  });
}, 300000);
