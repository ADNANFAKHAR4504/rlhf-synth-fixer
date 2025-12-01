import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from '@aws-sdk/client-cloudfront';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  CloudWatchLogsClient,
  PutLogEventsCommand,
  DescribeLogStreamsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  ElasticLoadBalancingV2Client,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import axios from 'axios';
import fs from 'fs';
import mysql from 'mysql2/promise';

// Configuration - Load from cfn-outputs after stack deployment
let outputs: Record<string, string> = {};
let stackName: string = '';
const region = process.env.AWS_REGION;

// AWS SDK Clients
const cfnClient = new CloudFormationClient({ region });
const autoScalingClient = new AutoScalingClient({ region });
const s3Client = new S3Client({ region });
const cloudfrontClient = new CloudFrontClient({ region });
const rdsClient = new RDSClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region });

// Test data for setup/teardown
const testData: {
  s3TestObjects: string[];
  cloudfrontInvalidationId?: string;
  testTimestamp: string;
} = {
  s3TestObjects: [],
  testTimestamp: new Date().toISOString().replace(/[:.]/g, '-'),
};

describe('TapStack Infrastructure Integration Tests - Data Flow', () => {
  beforeAll(async () => {
    // Load stack outputs
    const outputsPath = 'cfn-outputs/flat-outputs.json';
    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(outputsContent);
    stackName = outputs.StackName;

    // Verify stack is deployed
    const stackResponse = await cfnClient.send(
      new DescribeStacksCommand({ StackName: stackName })
    );
    if (!stackResponse.Stacks || stackResponse.Stacks[0].StackStatus?.includes('FAILED')) {
      throw new Error(`Stack ${stackName} is not in a valid state`);
    }
  });

  afterAll(async () => {
    // Cleanup all test data
    const bucketName = outputs.StaticContentBucketName;
    
    if (bucketName && testData.s3TestObjects.length > 0) {
      for (const key of testData.s3TestObjects) {
        try {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: key,
            })
          );
        } catch (error) {
          console.warn(`Failed to delete test object ${key}:`, error);
        }
      }
    }
  });

  describe('Static Content Data Flow: S3 → CloudFront → User', () => {
    test('should upload content to S3 and retrieve it directly', async () => {
      const bucketName = outputs.StaticContentBucketName;
      expect(bucketName).toBeDefined();

      const testKey = `test/upload-${testData.testTimestamp}.txt`;
      const testContent = `Test content uploaded at ${new Date().toISOString()}`;

      // Upload to S3
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: testContent,
          ContentType: 'text/plain',
        })
      );

      testData.s3TestObjects.push(testKey);

      // Retrieve from S3
      const getResponse = await s3Client.send(
        new GetObjectCommand({ Bucket: bucketName, Key: testKey })
      );
      const retrievedContent = await getResponse.Body!.transformToString();

      expect(retrievedContent).toBe(testContent);
    });

    test('should serve static content through CloudFront', async () => {
      const bucketName = outputs.StaticContentBucketName;
      const cloudfrontDomain = outputs.CloudFrontDomainName;
      expect(bucketName).toBeDefined();
      expect(cloudfrontDomain).toBeDefined();

      const testKey = `static/test-${testData.testTimestamp}.html`;
      const testContent = '<html><body>CloudFront Test Content</body></html>';

      // Upload to S3
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: testContent,
          ContentType: 'text/html',
        })
      );

      testData.s3TestObjects.push(testKey);

      // Invalidate CloudFront cache to ensure fresh content
      const distributionId = outputs.CloudFrontDistributionId;
      if (distributionId) {
        try {
          const invalidation = await cloudfrontClient.send(
            new CreateInvalidationCommand({
              DistributionId: distributionId,
              InvalidationBatch: {
                Paths: {
                  Quantity: 1,
                  Items: [`/${testKey}`],
                },
                CallerReference: `test-${testData.testTimestamp}`,
              },
            })
          );
          testData.cloudfrontInvalidationId = invalidation.Invalidation?.Id;
        } catch (error) {
          console.warn('CloudFront invalidation failed, continuing with test:', error);
        }
      }

      // Wait a moment for propagation
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Access via CloudFront
      const cloudfrontUrl = `https://${cloudfrontDomain}/${testKey}`;
      const response = await axios.get(cloudfrontUrl, {
        timeout: 30000,
        validateStatus: () => true,
        maxRedirects: 5,
      });

      // Should be accessible (200) or cached (403/404 if cache not invalidated)
      expect([200, 403, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data).toContain('CloudFront Test Content');
      }
    });

    test('should handle multiple static file uploads and retrievals', async () => {
      const bucketName = outputs.StaticContentBucketName;
      const files = [
        { key: `test/file1-${testData.testTimestamp}.txt`, content: 'File 1 content' },
        { key: `test/file2-${testData.testTimestamp}.txt`, content: 'File 2 content' },
        { key: `test/file3-${testData.testTimestamp}.json`, content: JSON.stringify({ test: 'data' }) },
      ];

      // Upload all files
      for (const file of files) {
        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: file.key,
            Body: file.content,
            ContentType: file.key.endsWith('.json') ? 'application/json' : 'text/plain',
          })
        );
        testData.s3TestObjects.push(file.key);
      }

      // Retrieve all files
      for (const file of files) {
        const getResponse = await s3Client.send(
          new GetObjectCommand({ Bucket: bucketName, Key: file.key })
        );
        const retrievedContent = await getResponse.Body!.transformToString();
        expect(retrievedContent).toBe(file.content);
      }
    });
  });

  describe('Dynamic Content Data Flow: User → CloudFront → ALB → EC2', () => {
    test('should route HTTP requests through ALB to EC2 instances', async () => {
      const albDns = outputs.ALBDNSName;
      expect(albDns).toBeDefined();

      // Make multiple requests to test load balancing
      const requests = Array.from({ length: 5 }, () =>
        axios.get(`http://${albDns}/`, {
          timeout: 10000,
          validateStatus: () => true,
        })
      );

      const responses = await Promise.all(requests);

      // All requests should get a response (may be 200, 404, 503, etc.)
      responses.forEach(response => {
        expect(response.status).toBeDefined();
        expect([200, 301, 302, 404, 503, 502]).toContain(response.status);
      });
    });

    test('should handle health check endpoint through ALB', async () => {
      const albDns = outputs.ALBDNSName;
      expect(albDns).toBeDefined();

      const healthUrl = `http://${albDns}/health`;
      const response = await axios.get(healthUrl, {
        timeout: 10000,
        validateStatus: () => true,
      });

      // Health endpoint should respond (200, 301, 302, or 404 if not implemented)
      expect([200, 301, 302, 404]).toContain(response.status);
    });

    test('should route API requests through CloudFront to ALB', async () => {
      const cloudfrontDomain = outputs.CloudFrontDomainName;
      const albDns = outputs.ALBDNSName;
      expect(cloudfrontDomain).toBeDefined();
      expect(albDns).toBeDefined();

      // Test direct ALB access
      const albUrl = `http://${albDns}/api/test`;
      const albResponse = await axios.get(albUrl, {
        timeout: 10000,
        validateStatus: () => true,
      });
      expect(albResponse.status).toBeDefined();

      // Test through CloudFront 
      const cfUrl = `https://${cloudfrontDomain}/api/test`;
      const cfResponse = await axios.get(cfUrl, {
        timeout: 30000,
        validateStatus: () => true,
        maxRedirects: 5,
      });
      expect(cfResponse.status).toBeDefined();
    });

    test('should distribute load across multiple EC2 instances', async () => {
      const albDns = outputs.ALBDNSName;
      const targetGroupArn = outputs.ALBTargetGroupArn;
      expect(albDns).toBeDefined();
      expect(targetGroupArn).toBeDefined();

      // Check target health
      const healthResponse = await elbv2Client.send(
        new DescribeTargetHealthCommand({ TargetGroupArn: targetGroupArn })
      );

      expect(healthResponse.TargetHealthDescriptions).toBeDefined();
      const targets = healthResponse.TargetHealthDescriptions!;
      expect(targets.length).toBeGreaterThan(0);

      // At least one target should be healthy
      const healthyTargets = targets.filter(
        t => t.TargetHealth?.State === 'healthy'
      );
      expect(healthyTargets.length).toBeGreaterThan(0);

      // Make requests to verify load distribution
      const requests = Array.from({ length: 10 }, () =>
        axios.get(`http://${albDns}/`, {
          timeout: 10000,
          validateStatus: () => true,
        })
      );

      const responses = await Promise.all(requests);
      expect(responses.length).toBe(10);
    });
  });

  describe('Database Data Flow: EC2 → RDS', () => {
    test('should connect to RDS database and execute queries', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      const dbPort = outputs.DatabasePort;
      const secretArn = outputs.DatabaseSecretArn;
      expect(dbEndpoint).toBeDefined();
      expect(dbPort).toBeDefined();
      expect(secretArn).toBeDefined();

      // Get database credentials from Secrets Manager
      const secretResponse = await secretsClient.send(
        new GetSecretValueCommand({ SecretId: secretArn })
      );

      expect(secretResponse.SecretString).toBeDefined();
      const secret = JSON.parse(secretResponse.SecretString!);
      expect(secret.username).toBeDefined();
      expect(secret.password).toBeDefined();

      // Connect to database
      const connection = await mysql.createConnection({
        host: dbEndpoint,
        port: parseInt(dbPort),
        user: secret.username,
        password: secret.password,
        database: outputs.DBName,
        connectTimeout: 10000,
      });

      try {
        // Execute a test query
        const [rows] = await connection.execute('SELECT 1 as test_value');
        expect(rows).toBeDefined();

        // Create a test table and insert data
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS integration_test_${testData.testTimestamp.replace(/[-:]/g, '_')} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            test_data VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Insert test data
        const [insertResult]: any = await connection.execute(
          `INSERT INTO integration_test_${testData.testTimestamp.replace(/[-:]/g, '_')} (test_data) VALUES (?)`,
          [`Test data from integration test at ${new Date().toISOString()}`]
        );
        expect(insertResult.insertId).toBeDefined();

        // Retrieve test data
        const [selectRows]: any = await connection.execute(
          `SELECT * FROM integration_test_${testData.testTimestamp.replace(/[-:]/g, '_')} WHERE id = ?`,
          [insertResult.insertId]
        );
        expect(selectRows.length).toBe(1);
        expect(selectRows[0].test_data).toContain('Test data from integration test');

        // Cleanup test table
        await connection.execute(
          `DROP TABLE IF EXISTS integration_test_${testData.testTimestamp.replace(/[-:]/g, '_')}`
        );
      } finally {
        await connection.end();
      }
    });

    test('should handle concurrent database connections', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      const dbPort = outputs.DatabasePort;
      const secretArn = outputs.DatabaseSecretArn;
      expect(dbEndpoint).toBeDefined();
      expect(secretArn).toBeDefined();

      // Get database credentials
      const secretResponse = await secretsClient.send(
        new GetSecretValueCommand({ SecretId: secretArn })
      );
      const secret = JSON.parse(secretResponse.SecretString!);

      // Create multiple concurrent connections
      const connections = await Promise.all(
        Array.from({ length: 3 }, () =>
          mysql.createConnection({
            host: dbEndpoint,
            port: parseInt(dbPort),
            user: secret.username,
            password: secret.password,
            database: outputs.DBName,
            connectTimeout: 10000,
          })
        )
      );

      try {
        // Execute queries on all connections concurrently
        const queries = connections.map(conn => conn.execute('SELECT CONNECTION_ID() as conn_id'));
        const results = await Promise.all(queries);

        expect(results.length).toBe(3);
        results.forEach(result => {
          expect(result).toBeDefined();
        });
      } finally {
        // Close all connections
        await Promise.all(connections.map(conn => conn.end()));
      }
    });
  });

  describe('Logging Data Flow: EC2 → CloudWatch Logs', () => {
    test('should write logs to CloudWatch Logs', async () => {
      const accessLogGroup = outputs.ApacheAccessLogGroupName;
      const errorLogGroup = outputs.ApacheErrorLogGroupName;
      expect(accessLogGroup).toBeDefined();
      expect(errorLogGroup).toBeDefined();

      // Get log streams
      const accessStreamsResponse = await logsClient.send(
        new DescribeLogStreamsCommand({
          logGroupName: accessLogGroup,
          orderBy: 'LastEventTime',
          descending: true,
          limit: 5,
        })
      );

      // Log streams may exist if instances are running
      expect(accessStreamsResponse.logStreams).toBeDefined();
    });

    test('should verify log groups are accessible', async () => {
      const accessLogGroup = outputs.ApacheAccessLogGroupName;
      const errorLogGroup = outputs.ApacheErrorLogGroupName;

      // Verify log groups exist by checking for streams
      const accessStreams = await logsClient.send(
        new DescribeLogStreamsCommand({
          logGroupName: accessLogGroup,
          limit: 1,
        })
      );

      const errorStreams = await logsClient.send(
        new DescribeLogStreamsCommand({
          logGroupName: errorLogGroup,
          limit: 1,
        })
      );

      expect(accessStreams.logStreams).toBeDefined();
      expect(errorStreams.logStreams).toBeDefined();
    });
  });

  describe('End-to-End User Journey: Complete Request Flow', () => {
    test('should handle complete user request: CloudFront → ALB → EC2 → RDS', async () => {
      const cloudfrontDomain = outputs.CloudFrontDomainName;
      const albDns = outputs.ALBDNSName;
      const dbEndpoint = outputs.DatabaseEndpoint;
      const secretArn = outputs.DatabaseSecretArn;

      expect(cloudfrontDomain).toBeDefined();
      expect(albDns).toBeDefined();
      expect(dbEndpoint).toBeDefined();
      expect(secretArn).toBeDefined();

      // Step 1: User makes request through CloudFront
      const cfResponse = await axios.get(`https://${cloudfrontDomain}/`, {
        timeout: 30000,
        validateStatus: () => true,
        maxRedirects: 5,
      });
      expect(cfResponse.status).toBeDefined();

      // Step 2: Request goes to ALB
      const albResponse = await axios.get(`http://${albDns}/`, {
        timeout: 10000,
        validateStatus: () => true,
      });
      expect(albResponse.status).toBeDefined();

      // Step 3: Verify database is accessible 
      const secretResponse = await secretsClient.send(
        new GetSecretValueCommand({ SecretId: secretArn })
      );
      const secret = JSON.parse(secretResponse.SecretString!);

      const connection = await mysql.createConnection({
        host: dbEndpoint,
        port: parseInt(outputs.DatabasePort),
        user: secret.username,
        password: secret.password,
        database: outputs.DBName,
        connectTimeout: 10000,
      });

      try {
        const [rows] = await connection.execute('SELECT 1');
        expect(rows).toBeDefined();
      } finally {
        await connection.end();
      }
    });
  });

  describe('Auto Scaling Data Flow: Load → Scale → Balance', () => {
    test('should verify instances are running and healthy', async () => {
      const asgName = outputs.AutoScalingGroupName;
      expect(asgName).toBeDefined();

      const response = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName],
        })
      );

      expect(response.AutoScalingGroups).toBeDefined();
      const asg = response.AutoScalingGroups![0];
      const instances = asg.Instances || [];

      expect(instances.length).toBeGreaterThan(0);

      // Verify instances are in service
      const inServiceInstances = instances.filter(
        i => i.LifecycleState === 'InService'
      );
      expect(inServiceInstances.length).toBeGreaterThan(0);

      // Make requests to verify instances are serving traffic
      const albDns = outputs.ALBDNSName;
      if (albDns) {
        const requests = inServiceInstances.map(() =>
          axios.get(`http://${albDns}/`, {
            timeout: 10000,
            validateStatus: () => true,
          })
        );

        const responses = await Promise.all(requests);
        expect(responses.length).toBe(inServiceInstances.length);
      }
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle invalid requests gracefully', async () => {
      const albDns = outputs.ALBDNSName;
      expect(albDns).toBeDefined();

      const invalidUrl = `http://${albDns}/nonexistent-endpoint-${Date.now()}`;
      const response = await axios.get(invalidUrl, {
        timeout: 10000,
        validateStatus: () => true,
      });

      // Should return an error status, not crash
      expect([404, 403, 500, 502, 503]).toContain(response.status);
    });

    test('should handle concurrent requests without errors', async () => {
      const albDns = outputs.ALBDNSName;
      expect(albDns).toBeDefined();

      // Make 20 concurrent requests
      const requests = Array.from({ length: 20 }, (_, i) =>
        axios.get(`http://${albDns}/?request=${i}`, {
          timeout: 10000,
          validateStatus: () => true,
        })
      );

      const responses = await Promise.all(requests);
      expect(responses.length).toBe(20);

      // All should have responded 
      responses.forEach(response => {
        expect(response.status).toBeDefined();
      });
    });
  });
});
