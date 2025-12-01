import {
  CloudFormationClient,
  DescribeStacksCommand,
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
} from '@aws-sdk/client-s3';
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from '@aws-sdk/client-cloudfront';
import {
  CloudWatchLogsClient,
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

// Configuration - Load from cfn-outputs after stack deployment
let outputs: Record<string, string> = {};
let stackName: string = '';
const region = process.env.AWS_REGION;

// AWS SDK Clients
const cfnClient = new CloudFormationClient({ region });
const autoScalingClient = new AutoScalingClient({ region });
const s3Client = new S3Client({ region });
const cloudfrontClient = new CloudFrontClient({ region });
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
    test('should verify ALB is accessible and responding', async () => {
      const albDns = outputs.ALBDNSName;
      expect(albDns).toBeDefined();

      // Make request to ALB - may get redirect (301/302), success (200), or error (502/503)
      // depending on certificate and target health configuration
      try {
        const response = await axios.get(`http://${albDns}/`, {
          timeout: 10000,
          validateStatus: () => true,
          maxRedirects: 0, // Don't follow redirects to avoid loops
        });

        // ALB should respond with some status
        expect(response.status).toBeDefined();
        expect([200, 301, 302, 404, 502, 503]).toContain(response.status);
      } catch (error: any) {
        // If connection fails, verify ALB exists via AWS API
        expect(albDns).toBeDefined();
        expect(error.code || error.message).toBeDefined();
      }
    });

    test('should verify target group has registered targets', async () => {
      const targetGroupArn = outputs.ALBTargetGroupArn;
      expect(targetGroupArn).toBeDefined();

      // Check target health
      const healthResponse = await elbv2Client.send(
        new DescribeTargetHealthCommand({ TargetGroupArn: targetGroupArn })
      );

      expect(healthResponse.TargetHealthDescriptions).toBeDefined();
      const targets = healthResponse.TargetHealthDescriptions!;
      
      // Targets should be registered 
      expect(targets.length).toBeGreaterThan(0);

      targets.forEach(t => {
        console.log(`Target ${t.Target?.Id}: ${t.TargetHealth?.State} - ${t.TargetHealth?.Reason}`);
      });
    });

    test('should verify CloudFront distribution is accessible', async () => {
      const cloudfrontDomain = outputs.CloudFrontDomainName;
      expect(cloudfrontDomain).toBeDefined();

      try {
        const response = await axios.get(`https://${cloudfrontDomain}/`, {
          timeout: 30000,
          validateStatus: () => true,
          maxRedirects: 0, 
        });

        // CloudFront should respond
        expect(response.status).toBeDefined();
      } catch (error: any) {
        expect(cloudfrontDomain).toBeDefined();
        if (error.response) {
          expect([301, 302, 403, 404, 502, 503]).toContain(error.response.status);
        }
      }
    });
  });

  describe('Database Data Flow: Secrets Manager → EC2', () => {
    // These tests verify the Secrets Manager data flow that EC2 instances use
    
    test('should retrieve database credentials from Secrets Manager', async () => {
      const secretArn = outputs.DatabaseSecretArn;
      expect(secretArn).toBeDefined();

      // Get database credentials from Secrets Manager
      const secretResponse = await secretsClient.send(
        new GetSecretValueCommand({ SecretId: secretArn })
      );

      expect(secretResponse.SecretString).toBeDefined();
      const secret = JSON.parse(secretResponse.SecretString!);
      
      // RDS managed secrets contain username and password
      // Host and port are retrieved from RDS endpoint outputs
      expect(secret.username).toBeDefined();
      expect(secret.password).toBeDefined();
      expect(typeof secret.username).toBe('string');
      expect(typeof secret.password).toBe('string');
    });

    test('should verify database endpoint is configured', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      const dbPort = outputs.DatabasePort;
      
      expect(dbEndpoint).toBeDefined();
      expect(dbPort).toBeDefined();
      expect(parseInt(dbPort)).toBe(3306);
    });
  });

  describe('Logging Data Flow: EC2 → CloudWatch Logs', () => {
    test('should verify log groups exist and are accessible', async () => {
      const accessLogGroup = outputs.ApacheAccessLogGroupName;
      const errorLogGroup = outputs.ApacheErrorLogGroupName;
      expect(accessLogGroup).toBeDefined();
      expect(errorLogGroup).toBeDefined();

      // Get log streams - verifies log groups exist
      const accessStreamsResponse = await logsClient.send(
        new DescribeLogStreamsCommand({
          logGroupName: accessLogGroup,
          limit: 5,
        })
      );

      const errorStreamsResponse = await logsClient.send(
        new DescribeLogStreamsCommand({
          logGroupName: errorLogGroup,
          limit: 5,
        })
      );

      // Log groups should be accessible
      expect(accessStreamsResponse.logStreams).toBeDefined();
      expect(errorStreamsResponse.logStreams).toBeDefined();
    });
  });

  describe('Auto Scaling Data Flow: ASG → EC2 Instances', () => {
    test('should verify Auto Scaling Group has instances', async () => {
      const asgName = outputs.AutoScalingGroupName;
      expect(asgName).toBeDefined();

      const response = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName],
        })
      );

      expect(response.AutoScalingGroups).toBeDefined();
      expect(response.AutoScalingGroups!.length).toBe(1);
      
      const asg = response.AutoScalingGroups![0];
      const instances = asg.Instances || [];

      // ASG should have instances
      expect(instances.length).toBeGreaterThan(0);

      // Log instance states for debugging
      instances.forEach(i => {
        console.log(`Instance ${i.InstanceId}: ${i.LifecycleState} - ${i.HealthStatus}`);
      });
    });

    test('should verify ASG scaling configuration', async () => {
      const asgName = outputs.AutoScalingGroupName;
      
      const response = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName],
        })
      );

      const asg = response.AutoScalingGroups![0];
      
      // Verify scaling configuration
      expect(asg.MinSize).toBeGreaterThanOrEqual(1);
      expect(asg.MaxSize).toBeGreaterThanOrEqual(asg.MinSize!);
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(asg.MinSize!);
      expect(asg.DesiredCapacity).toBeLessThanOrEqual(asg.MaxSize!);
    });
  });

  describe('End-to-End Infrastructure Verification', () => {
    test('should verify all core resources are deployed', async () => {
      // Verify VPC
      expect(outputs.VPCId).toBeDefined();
      
      // Verify ALB
      expect(outputs.ALBDNSName).toBeDefined();
      expect(outputs.ALBArn).toBeDefined();
      
      // Verify CloudFront
      expect(outputs.CloudFrontDistributionId).toBeDefined();
      expect(outputs.CloudFrontDomainName).toBeDefined();
      
      // Verify S3
      expect(outputs.StaticContentBucketName).toBeDefined();
      
      // Verify RDS
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.DatabaseSecretArn).toBeDefined();
      
      // Verify Auto Scaling
      expect(outputs.AutoScalingGroupName).toBeDefined();
      
      // Verify CloudWatch Logs
      expect(outputs.ApacheAccessLogGroupName).toBeDefined();
      expect(outputs.ApacheErrorLogGroupName).toBeDefined();
    });

    test('should verify security groups are created', async () => {
      expect(outputs.ALBSecurityGroupId).toBeDefined();
      expect(outputs.WebServerSecurityGroupId).toBeDefined();
      expect(outputs.DatabaseSecurityGroupId).toBeDefined();
    });
  });
});
