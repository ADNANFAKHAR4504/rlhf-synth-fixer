#!/bin/bash
set -e  # Exit on any error

# Amazon Linux 2023 uses dnf instead of yum
dnf update -y
dnf install -y httpd
dnf install -y amazon-cloudwatch-agent
dnf install -y aws-cli
dnf install -qy nodejs20

# Verify Node.js installation
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

systemctl start httpd
systemctl enable httpd
mkdir -p /opt/webapp-test
cd /opt/webapp-test
cat > package.json << 'EOF'
{
  "name": "webapp-test",
  "version": "1.0.0",
  "description": "Lightweight test application for infrastructure testing",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "test": "node test.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "aws-sdk": "^2.1490.0"
  }
}
EOF
npm install
cat > app.js << 'EOF'
const express = require('express');
const AWS = require('aws-sdk');
const fs = require('fs');

const app = express();
const port = 3000;

// Configure AWS SDK
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Test results storage
let testResults = {
  s3: { status: 'pending', lastTest: null, error: null },
  dynamodb: { status: 'pending', lastTest: null, error: null },
  integration: { status: 'pending', lastTest: null, error: null },
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    region: process.env.AWS_REGION || 'us-east-1',
  });
});

// S3 test endpoint
app.get('/test/s3', async (req, res) => {
  try {
    const bucketName = process.env.S3_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('S3_BUCKET_NAME environment variable not set');
    }

    const testKey = `test/${Date.now()}.json`;
    const testData = {
      testId: `s3-test-${Date.now()}`,
      timestamp: new Date().toISOString(),
      region: process.env.AWS_REGION || 'us-east-1',
    };

    // Upload test file
    await s3
      .putObject({
        Bucket: bucketName,
        Key: testKey,
        Body: JSON.stringify(testData),
        ContentType: 'application/json',
      })
      .promise();

    // Download and verify
    const result = await s3
      .getObject({
        Bucket: bucketName,
        Key: testKey,
      })
      .promise();

    const downloadedData = JSON.parse(result.Body.toString());

    testResults.s3 = {
      status: 'success',
      lastTest: new Date().toISOString(),
      error: null,
      testData: downloadedData,
    };

    res.json({
      status: 'success',
      message: 'S3 test completed successfully',
      testData: downloadedData,
    });
  } catch (error) {
    testResults.s3 = {
      status: 'error',
      lastTest: new Date().toISOString(),
      error: error.message,
    };
    res.status(500).json({
      status: 'error',
      message: 'S3 test failed',
      error: error.message,
    });
  }
});

// DynamoDB test endpoint
app.get('/test/dynamodb', async (req, res) => {
  try {
    const tableName = process.env.DYNAMODB_TABLE_NAME;
    if (!tableName) {
      throw new Error('DYNAMODB_TABLE_NAME environment variable not set');
    }

    const testId = `dynamodb-test-${Date.now()}`;
    const timestamp = Date.now();
    const testData = {
      id: testId,
      timestamp: timestamp,
      region: process.env.AWS_REGION || 'us-east-1',
      testType: 'integration-test',
      createdAt: new Date().toISOString(),
    };

    // Put item
    await dynamodb
      .put({
        TableName: tableName,
        Item: testData,
      })
      .promise();

    // Get item back
    const result = await dynamodb
      .get({
        TableName: tableName,
        Key: {
          id: testId,
          timestamp: timestamp,
        },
      })
      .promise();

    testResults.dynamodb = {
      status: 'success',
      lastTest: new Date().toISOString(),
      error: null,
      testData: result.Item,
    };

    res.json({
      status: 'success',
      message: 'DynamoDB test completed successfully',
      testData: result.Item,
    });
  } catch (error) {
    testResults.dynamodb = {
      status: 'error',
      lastTest: new Date().toISOString(),
      error: error.message,
    };
    res.status(500).json({
      status: 'error',
      message: 'DynamoDB test failed',
      error: error.message,
    });
  }
});

// Integration test endpoint (E2E workflow)
app.get('/test/integration', async (req, res) => {
  try {
    const bucketName = process.env.S3_BUCKET_NAME;
    const tableName = process.env.DYNAMODB_TABLE_NAME;

    if (!bucketName || !tableName) {
      throw new Error('Required environment variables not set');
    }

    const workflowId = `integration-${Date.now()}`;
    const timestamp = Date.now();

    // Step 1: Create data
    const workflowData = {
      id: workflowId,
      timestamp: timestamp,
      region: process.env.AWS_REGION || 'us-east-1',
      testType: 'e2e-workflow',
      status: 'processing',
      createdAt: new Date().toISOString(),
    };

    // Step 2: Store in DynamoDB
    await dynamodb
      .put({
        TableName: tableName,
        Item: workflowData,
      })
      .promise();

    // Step 3: Store metadata in S3
    const s3Key = `workflows/${workflowId}.json`;
    await s3
      .putObject({
        Bucket: bucketName,
        Key: s3Key,
        Body: JSON.stringify(workflowData),
        ContentType: 'application/json',
      })
      .promise();

    // Step 4: Update status in DynamoDB
    await dynamodb
      .update({
        TableName: tableName,
        Key: {
          id: workflowId,
          timestamp: timestamp,
        },
        UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':status': 'completed',
          ':updatedAt': new Date().toISOString(),
        },
      })
      .promise();

    // Step 5: Verify both services
    const [dbResult, s3Result] = await Promise.all([
      dynamodb
        .get({
          TableName: tableName,
          Key: { id: workflowId, timestamp: timestamp },
        })
        .promise(),
      s3
        .getObject({
          Bucket: bucketName,
          Key: s3Key,
        })
        .promise(),
    ]);

    testResults.integration = {
      status: 'success',
      lastTest: new Date().toISOString(),
      error: null,
      workflowData: workflowData,
    };

    res.json({
      status: 'success',
      message: 'E2E integration test completed successfully',
      workflowId: workflowId,
      dynamoDBData: dbResult.Item,
      s3Data: JSON.parse(s3Result.Body.toString()),
    });
  } catch (error) {
    testResults.integration = {
      status: 'error',
      lastTest: new Date().toISOString(),
      error: error.message,
    };
    res.status(500).json({
      status: 'error',
      message: 'E2E integration test failed',
      error: error.message,
    });
  }
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    timestamp: new Date().toISOString(),
    region: process.env.AWS_REGION || 'us-east-1',
    testResults: testResults,
    environment: {
      AWS_REGION: process.env.AWS_REGION,
      S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
      DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME,
    },
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: `WebApp Test Application - ${process.env.ENVIRONMENT_SUFFIX || 'dev'}`,
    version: '1.0.0',
    endpoints: [
      'GET /health - Health check',
      'GET /test/s3 - S3 connectivity test',
      'GET /test/dynamodb - DynamoDB connectivity test',
      'GET /test/integration - E2E workflow test',
      'GET /status - Test results and status',
    ],
  });
});

// Export for testing
module.exports = app;

// Start server if this file is run directly
if (require.main === module) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Test application running on port ${port}`);
  });
}
EOF
cat > /etc/systemd/system/webapp-test.service << 'EOF'
[Unit]
Description=WebApp Test Application
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/webapp-test
ExecStart=/usr/bin/node app.js
Restart=always
RestartSec=10
Environment=AWS_REGION=__AWS_REGION__
Environment=S3_BUCKET_NAME=__S3_BUCKET_NAME__
Environment=DYNAMODB_TABLE_NAME=__DYNAMODB_TABLE_NAME__
Environment=ENVIRONMENT_SUFFIX=__ENVIRONMENT_SUFFIX__

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable webapp-test
systemctl start webapp-test
cat > /etc/httpd/conf.d/webapp-test.conf << 'EOF'
ProxyPreserveHost On
ProxyPass /test/ http://localhost:3000/test/
ProxyPassReverse /test/ http://localhost:3000/test/
ProxyPass /health http://localhost:3000/health
ProxyPassReverse /health http://localhost:3000/health
ProxyPass /status http://localhost:3000/status
ProxyPassReverse /status http://localhost:3000/status
EOF
systemctl restart httpd
echo "<h1>WebApp __PREFIX__ - __ENVIRONMENT_SUFFIX__</h1><p><a href='/test/'>Test Application</a></p>" > /var/www/html/index.html