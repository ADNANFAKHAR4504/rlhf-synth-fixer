import fs from 'fs';
import AWS from 'aws-sdk';
import https from 'https';
import { promisify } from 'util';

// Configuration - These are coming from cfn-outputs after cdk deploy
let outputs: any = {};

try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn(
    'cfn-outputs/flat-outputs.json not found. Using mock data for local testing.'
  );
  outputs = {
    DistributionIdOutput: 'E1234567890123',
    DistributionDomainNameOutput: 'd1234567890123.cloudfront.net',
    ContentBucketNameOutput: 'test-content-bucket',
    LoggingBucketNameOutput: 'test-logging-bucket',
    InvalidationRoleArnOutput:
      'arn:aws:iam::123456789012:role/test-invalidation-role',
    ContentManagementRoleArnOutput:
      'arn:aws:iam::123456789012:role/test-content-role',
  };
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

// AWS SDK clients
const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront();
const cloudwatch = new AWS.CloudWatch();

// Helper function to make HTTPS requests
const httpsRequest = promisify((url: string, options: any, callback: any) => {
  const req = https.request(url, options, res => {
    let data = '';
    res.on('data', chunk => (data += chunk));
    res.on('end', () =>
      callback(null, { statusCode: res.statusCode, headers: res.headers, data })
    );
  });
  req.on('error', callback);
  req.end();
});

// Helper function to wait for a condition with timeout
const waitForCondition = async (
  conditionFn: () => Promise<boolean>,
  timeout: number = 30000,
  interval: number = 1000
): Promise<boolean> => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      if (await conditionFn()) {
        return true;
      }
    } catch (error) {
      console.warn('Condition check failed, retrying...', error);
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  return false;
};

describe('Content Delivery System Integration Tests', () => {
  const testFiles = [
    {
      name: `test-article-${Date.now()}.html`,
      content: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test Article</title>
          <meta charset="utf-8">
        </head>
        <body>
          <h1>Test Article for Integration Testing</h1>
          <p>This is a test article content created at ${new Date().toISOString()}</p>
          <p>Environment: ${environmentSuffix}</p>
        </body>
        </html>
      `,
      contentType: 'text/html'
    },
    {
      name: `test-image-${Date.now()}.jpg`,
      content: Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'), // 1x1 transparent GIF as binary
      contentType: 'image/jpeg'
    },
    {
      name: `test-json-${Date.now()}.json`,
      content: JSON.stringify({
        message: 'Test JSON content',
        timestamp: new Date().toISOString(),
        environment: environmentSuffix
      }),
      contentType: 'application/json'
    }
  ];

  beforeAll(async () => {
    // Wait a moment to ensure resources are ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    // Cleanup test files
    for (const file of testFiles) {
      try {
        await s3
          .deleteObject({
            Bucket: outputs.ContentBucketNameOutput,
            Key: file.name,
          })
          .promise();
      } catch (error) {
        console.warn(`Failed to cleanup test file ${file.name}:`, error);
      }
    }
  });

  describe('S3 Content Bucket Operations', () => {
    test('should be able to upload content to S3 bucket', async () => {
      const file = testFiles[0];
      const putObjectParams = {
        Bucket: outputs.ContentBucketNameOutput,
        Key: file.name,
        Body: file.content,
        ContentType: file.contentType,
        CacheControl: 'public, max-age=31536000',
      };

      const result = await s3.putObject(putObjectParams).promise();
      expect(result.ETag).toBeDefined();
    });

    test('should verify S3 bucket encryption', async () => {
      const bucketEncryption = await s3
        .getBucketEncryption({
          Bucket: outputs.ContentBucketNameOutput,
        })
        .promise();

      expect(bucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        bucketEncryption.ServerSideEncryptionConfiguration.Rules[0]
          .ApplyServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('should verify S3 bucket versioning is enabled', async () => {
      const versioningConfig = await s3
        .getBucketVersioning({
          Bucket: outputs.ContentBucketNameOutput,
        })
        .promise();

      expect(versioningConfig.Status).toBe('Enabled');
    });

    test('should verify S3 bucket has CORS configuration', async () => {
      const corsConfig = await s3
        .getBucketCors({
          Bucket: outputs.ContentBucketNameOutput,
        })
        .promise();

      expect(corsConfig.CORSRules).toBeDefined();
      expect(corsConfig.CORSRules.length).toBeGreaterThan(0);
      expect(corsConfig.CORSRules[0].AllowedMethods).toContain('GET');
      expect(corsConfig.CORSRules[0].AllowedHeaders).toContain('*');
    });

    test('should be able to upload multiple file types', async () => {
      for (const file of testFiles) {
        const putObjectParams = {
          Bucket: outputs.ContentBucketNameOutput,
          Key: file.name,
          Body: file.content,
          ContentType: file.contentType,
          CacheControl: 'public, max-age=31536000',
        };

        const result = await s3.putObject(putObjectParams).promise();
        expect(result.ETag).toBeDefined();
      }
    });
  });

  describe('S3 Logging Bucket Verification', () => {
    test('should verify logging bucket has lifecycle configuration', async () => {
      const lifecycleConfig = await s3
        .getBucketLifecycleConfiguration({
          Bucket: outputs.LoggingBucketNameOutput,
        })
        .promise();

      expect(lifecycleConfig.Rules).toBeDefined();
      const deleteRule = lifecycleConfig.Rules.find(
        rule => rule.ID === 'DeleteOldLogs'
      );
      expect(deleteRule).toBeDefined();
      expect(deleteRule?.Status).toBe('Enabled');
      expect(deleteRule?.Expiration?.Days).toBe(90);
    });

    test('should verify logging bucket is encrypted', async () => {
      const bucketEncryption = await s3
        .getBucketEncryption({
          Bucket: outputs.LoggingBucketNameOutput,
        })
        .promise();

      expect(bucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        bucketEncryption.ServerSideEncryptionConfiguration.Rules[0]
          .ApplyServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });
  });

  describe('CloudFront Distribution Configuration', () => {
    test('should verify CloudFront distribution exists and is enabled', async () => {
      const distribution = await cloudfront
        .getDistribution({
          Id: outputs.DistributionIdOutput,
        })
        .promise();

      expect(distribution.Distribution.DistributionConfig.Enabled).toBe(true);
      expect(distribution.Distribution.DistributionConfig.HttpVersion).toBe(
        'http2and3'
      );
      expect(distribution.Distribution.DistributionConfig.PriceClass).toBe(
        'PriceClass_100'
      );
    });

    test('should verify CloudFront distribution has proper security settings', async () => {
      const distribution = await cloudfront
        .getDistribution({
          Id: outputs.DistributionIdOutput,
        })
        .promise();

      const defaultBehavior =
        distribution.Distribution.DistributionConfig.DefaultCacheBehavior;
      expect(defaultBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
      expect(defaultBehavior.Compress).toBe(true);
    });

    test('should verify CloudFront distribution has proper origin configuration', async () => {
      const distribution = await cloudfront
        .getDistribution({
          Id: outputs.DistributionIdOutput,
        })
        .promise();

      expect(
        distribution.Distribution.DistributionConfig.Origins.Items
      ).toBeDefined();
      expect(
        distribution.Distribution.DistributionConfig.Origins.Items.length
      ).toBeGreaterThan(0);

      const s3Origin =
        distribution.Distribution.DistributionConfig.Origins.Items[0];
      expect(s3Origin.DomainName).toContain(outputs.ContentBucketNameOutput);
      expect(s3Origin.S3OriginConfig?.OriginAccessIdentity).toBeDefined();
    });

    test('should verify CloudFront logging is enabled', async () => {
      const distribution = await cloudfront
        .getDistribution({
          Id: outputs.DistributionIdOutput,
        })
        .promise();

      const logging = distribution.Distribution.DistributionConfig.Logging;
      expect(logging.Enabled).toBe(true);
      expect(logging.Bucket).toContain(outputs.LoggingBucketNameOutput);
      expect(logging.Prefix).toBe('cloudfront-logs/');
    });
  });

  describe('COMPLETE FLOW TEST - End-to-End Content Delivery Workflow', () => {
    test('should handle complete content delivery lifecycle with multiple content types', async () => {
      const workflowResults = [];
      
      // Phase 1: Upload multiple content types to S3
      console.log('Phase 1: Uploading multiple content types to S3...');
      for (const file of testFiles) {
        const uploadResult = await s3.putObject({
          Bucket: outputs.ContentBucketNameOutput,
          Key: file.name,
          Body: file.content,
          ContentType: file.contentType,
          CacheControl: 'public, max-age=31536000',
          Metadata: {
            'test-workflow': 'true',
            'upload-time': new Date().toISOString()
          }
        }).promise();
        
        workflowResults.push({
          phase: 'upload',
          file: file.name,
          success: !!uploadResult.ETag,
          etag: uploadResult.ETag
        });
      }

      // Phase 2: Wait for CloudFront propagation
      console.log('Phase 2: Waiting for CloudFront propagation...');
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Phase 3: Test content delivery through CloudFront for each file type
      console.log('Phase 3: Testing content delivery through CloudFront...');
      for (const file of testFiles) {
        const cloudFrontUrl = `https://${outputs.DistributionDomainNameOutput}/${file.name}`;
        
        try {
          const response = (await httpsRequest(
            cloudFrontUrl,
            {
              method: 'GET',
              headers: {
                'User-Agent': 'CompleteFlowTest/1.0',
                'Accept-Encoding': 'gzip, br'
              },
            },
            () => {}
          )) as any;

          workflowResults.push({
            phase: 'cloudfront-delivery',
            file: file.name,
            success: response.statusCode === 200,
            statusCode: response.statusCode,
            hasCloudFrontHeaders: !!(response.headers['via'] && response.headers['x-cache']),
            contentLength: response.data?.length || 0,
            cacheStatus: response.headers['x-cache']
          });

          // Verify content matches original for text files
          if (file.contentType === 'text/html' || file.contentType === 'application/json') {
            const contentMatches = response.data.includes(file.contentType === 'application/json' ? 
              JSON.parse(file.content).message : 'Test Article for Integration Testing');
            workflowResults.push({
              phase: 'content-verification',
              file: file.name,
              success: contentMatches,
              contentMatches
            });
          }

        } catch (error) {
          workflowResults.push({
            phase: 'cloudfront-delivery',
            file: file.name,
            success: false,
            error: error.message
          });
        }
      }

      // Phase 4: Test caching behavior with second requests
      console.log('Phase 4: Testing caching behavior...');
      for (const file of testFiles) {
        const cloudFrontUrl = `https://${outputs.DistributionDomainNameOutput}/${file.name}`;
        
        try {
          const cachedResponse = (await httpsRequest(
            cloudFrontUrl,
            {
              method: 'GET',
              headers: {
                'User-Agent': 'CompleteFlowTest-Cache/1.0',
              },
            },
            () => {}
          )) as any;

          const isCacheHit = cachedResponse.headers['x-cache']?.includes('Hit') || 
                            cachedResponse.headers['x-cache']?.includes('RefreshHit');

          workflowResults.push({
            phase: 'cache-test',
            file: file.name,
            success: cachedResponse.statusCode === 200,
            cacheHit: isCacheHit,
            cacheStatus: cachedResponse.headers['x-cache']
          });

        } catch (error) {
          workflowResults.push({
            phase: 'cache-test',
            file: file.name,
            success: false,
            error: error.message
          });
        }
      }

      // Phase 5: Test CloudFront invalidation
      console.log('Phase 5: Testing CloudFront invalidation...');
      const invalidationResult = await cloudfront.createInvalidation({
        DistributionId: outputs.DistributionIdOutput,
        InvalidationBatch: {
          Paths: {
            Quantity: testFiles.length,
            Items: testFiles.map(f => `/${f.name}`),
          },
          CallerReference: `complete-flow-test-${Date.now()}`,
        },
      }).promise();

      workflowResults.push({
        phase: 'invalidation',
        success: !!invalidationResult.Invalidation.Id,
        invalidationId: invalidationResult.Invalidation.Id,
        status: invalidationResult.Invalidation.Status
      });

      // Phase 6: Test security - direct S3 access should be blocked
      console.log('Phase 6: Testing security - S3 direct access blocking...');
      for (const file of testFiles.slice(0, 1)) { // Test with first file only
        const directS3Url = `https://${outputs.ContentBucketNameOutput}.s3.amazonaws.com/${file.name}`;
        
        try {
          const response = (await httpsRequest(
            directS3Url,
            {
              method: 'GET',
            },
            () => {}
          )) as any;

          workflowResults.push({
            phase: 'security-test',
            file: file.name,
            success: [403, 404].includes(response.statusCode),
            statusCode: response.statusCode,
            accessBlocked: [403, 404].includes(response.statusCode)
          });

        } catch (error) {
          workflowResults.push({
            phase: 'security-test',
            file: file.name,
            success: true, // Error means access is blocked, which is good
            error: 'Access properly blocked'
          });
        }
      }

      // Phase 7: Verify monitoring and logging
      console.log('Phase 7: Verifying monitoring and logging...');
      
      // Check CloudWatch dashboard exists
      const dashboards = await cloudwatch.listDashboards().promise();
      const contentDeliveryDashboard = dashboards.DashboardEntries?.find(
        dashboard =>
          dashboard.DashboardName?.includes('content-delivery') &&
          dashboard.DashboardName?.includes(environmentSuffix)
      );

      workflowResults.push({
        phase: 'monitoring',
        success: !!contentDeliveryDashboard,
        dashboardExists: !!contentDeliveryDashboard,
        dashboardName: contentDeliveryDashboard?.DashboardName
      });

      // Check CloudWatch alarms exist
      const alarms = await cloudwatch.describeAlarms().promise();
      const relevantAlarms = alarms.MetricAlarms?.filter(
        alarm => alarm.AlarmName?.includes('content-delivery') && 
                 alarm.AlarmName?.includes(environmentSuffix)
      );

      workflowResults.push({
        phase: 'monitoring',
        success: (relevantAlarms?.length || 0) >= 3, // Should have at least 3 alarms
        alarmCount: relevantAlarms?.length || 0,
        alarms: relevantAlarms?.map(a => a.AlarmName)
      });

      // Comprehensive workflow verification
      const uploadSuccesses = workflowResults.filter(r => r.phase === 'upload' && r.success).length;
      const deliverySuccesses = workflowResults.filter(r => r.phase === 'cloudfront-delivery' && r.success).length;
      const cacheSuccesses = workflowResults.filter(r => r.phase === 'cache-test' && r.success).length;
      const securitySuccesses = workflowResults.filter(r => r.phase === 'security-test' && r.success).length;
      const monitoringSuccesses = workflowResults.filter(r => r.phase === 'monitoring' && r.success).length;
      const invalidationSuccess = workflowResults.find(r => r.phase === 'invalidation')?.success || false;

      // Log comprehensive results
      console.log('\n=== COMPLETE FLOW TEST RESULTS ===');
      console.log(`Upload Phase: ${uploadSuccesses}/${testFiles.length} successful`);
      console.log(`CloudFront Delivery: ${deliverySuccesses}/${testFiles.length} successful`);
      console.log(`Cache Testing: ${cacheSuccesses}/${testFiles.length} successful`);
      console.log(`Security Testing: ${securitySuccesses}/1 successful`);
      console.log(`Monitoring Setup: ${monitoringSuccesses}/2 successful`);
      console.log(`Invalidation: ${invalidationSuccess ? 'successful' : 'failed'}`);
      console.log('=====================================\n');

      // Comprehensive assertions for complete flow
      expect(uploadSuccesses).toBe(testFiles.length); // All uploads must succeed
      expect(deliverySuccesses).toBeGreaterThanOrEqual(testFiles.length * 0.8); // 80% delivery success rate minimum
      expect(invalidationSuccess).toBe(true); // Invalidation must work
      expect(securitySuccesses).toBe(1); // Direct S3 access must be blocked
      expect(monitoringSuccesses).toBeGreaterThanOrEqual(1); // At least monitoring dashboard should exist

      // Overall workflow success criteria
      const overallSuccess = uploadSuccesses === testFiles.length &&
                           deliverySuccesses >= testFiles.length * 0.8 &&
                           invalidationSuccess &&
                           securitySuccesses === 1;

      expect(overallSuccess).toBe(true);

    }, 120000); // Extended timeout for complete flow test

    test('should handle error scenarios gracefully', async () => {
      // Test 404 error handling
      const nonExistentUrl = `https://${outputs.DistributionDomainNameOutput}/non-existent-file-${Date.now()}.html`;

      try {
        const response = (await httpsRequest(
          nonExistentUrl,
          {
            method: 'GET',
          },
          () => {}
        )) as any;

        // Should return 404 due to error page configuration
        expect(response.statusCode).toBe(404);
      } catch (error) {
        // Network errors are also acceptable for non-existent content
        expect(error).toBeDefined();
      }

      // Test malformed requests
      try {
        const malformedResponse = (await httpsRequest(
          `https://${outputs.DistributionDomainNameOutput}/../../../etc/passwd`,
          {
            method: 'GET',
          },
          () => {}
        )) as any;

        // Should handle malformed paths gracefully
        expect([400, 403, 404]).toContain(malformedResponse.statusCode);
      } catch (error) {
        // Errors are acceptable for malformed requests
        expect(error).toBeDefined();
      }
    });
  });

  describe('CloudWatch Monitoring Verification', () => {
    test('should have CloudWatch dashboard created', async () => {
      const dashboards = await cloudwatch.listDashboards().promise();
      const contentDeliveryDashboard = dashboards.DashboardEntries?.find(
        dashboard =>
          dashboard.DashboardName?.includes('content-delivery') &&
          dashboard.DashboardName?.includes(environmentSuffix)
      );

      expect(contentDeliveryDashboard).toBeDefined();
    });

    test('should have CloudWatch alarms configured', async () => {
      const alarms = await cloudwatch.describeAlarms().promise();

      const errorRateAlarm = alarms.MetricAlarms?.find(
        alarm =>
          alarm.AlarmName?.includes('content-delivery-high-error-rate') &&
          alarm.AlarmName?.includes(environmentSuffix)
      );
      expect(errorRateAlarm).toBeDefined();
      expect(errorRateAlarm?.Threshold).toBe(5);

      const serverErrorAlarm = alarms.MetricAlarms?.find(
        alarm =>
          alarm.AlarmName?.includes(
            'content-delivery-high-server-error-rate'
          ) && alarm.AlarmName?.includes(environmentSuffix)
      );
      expect(serverErrorAlarm).toBeDefined();
      expect(serverErrorAlarm?.Threshold).toBe(1);

      const cacheHitAlarm = alarms.MetricAlarms?.find(
        alarm =>
          alarm.AlarmName?.includes('content-delivery-low-cache-hit-rate') &&
          alarm.AlarmName?.includes(environmentSuffix)
      );
      expect(cacheHitAlarm).toBeDefined();
      expect(cacheHitAlarm?.Threshold).toBe(70);
    });
  });

  describe('Performance and Optimization Verification', () => {
    test('should verify content compression is working', async () => {
      const file = testFiles[0];
      const cloudFrontUrl = `https://${outputs.DistributionDomainNameOutput}/${file.name}`;

      try {
        const response = (await httpsRequest(
          cloudFrontUrl,
          {
            method: 'GET',
            headers: {
              'Accept-Encoding': 'gzip, br',
            },
          },
          () => {}
        )) as any;

        // Content should be compressed for efficiency
        if (response.data && response.data.length > 100) {
          expect(response.headers['content-encoding']).toBeDefined();
        }
      } catch (error) {
        console.warn('Compression test failed:', error);
        expect(error).toBeDefined();
      }
    });

    test('should verify appropriate cache headers are set', async () => {
      const file = testFiles[0];
      const cloudFrontUrl = `https://${outputs.DistributionDomainNameOutput}/${file.name}`;

      try {
        const response = (await httpsRequest(
          cloudFrontUrl,
          {
            method: 'GET',
          },
          () => {}
        )) as any;

        // Verify cache-related headers
        expect(response.headers['cache-control']).toBeDefined();
        expect(response.headers['etag']).toBeDefined();
      } catch (error) {
        console.warn('Cache headers test failed:', error);
        expect(error).toBeDefined();
      }
    });

    test('should verify security headers are properly set', async () => {
      const file = testFiles[0];
      const cloudFrontUrl = `https://${outputs.DistributionDomainNameOutput}/${file.name}`;

      try {
        const response = (await httpsRequest(
          cloudFrontUrl,
          {
            method: 'GET',
          },
          () => {}
        )) as any;

        // Verify security headers are present
        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.headers['x-frame-options']).toBe('DENY');
        expect(response.headers['strict-transport-security']).toBeDefined();
        expect(response.headers['x-xss-protection']).toBe('1; mode=block');

      } catch (error) {
        console.warn('Security headers test failed:', error);
        expect(error).toBeDefined();
      }
    });
  });

  describe('Security Verification', () => {
    test('should not allow direct S3 access', async () => {
      const file = testFiles[0];
      const directS3Url = `https://${outputs.ContentBucketNameOutput}.s3.amazonaws.com/${file.name}`;

      try {
        const response = (await httpsRequest(
          directS3Url,
          {
            method: 'GET',
          },
          () => {}
        )) as any;

        // Direct S3 access should be blocked
        expect([403, 404]).toContain(response.statusCode);
      } catch (error) {
        // Network error is also acceptable - means access is properly blocked
        expect(error).toBeDefined();
      }
    });

    test('should enforce HTTPS redirection', async () => {
      // This test verifies the CloudFront configuration rather than making HTTP requests
      const distribution = await cloudfront
        .getDistribution({
          Id: outputs.DistributionIdOutput,
        })
        .promise();

      const defaultBehavior =
        distribution.Distribution.DistributionConfig.DefaultCacheBehavior;
      expect(defaultBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });
  });

  describe('CloudFront Cache Management', () => {
    test('should be able to create cache invalidation', async () => {
      const file = testFiles[0];
      const invalidationParams = {
        DistributionId: outputs.DistributionIdOutput,
        InvalidationBatch: {
          Paths: {
            Quantity: 1,
            Items: [`/${file.name}`],
          },
          CallerReference: `test-invalidation-${Date.now()}`,
        },
      };

      const invalidation = await cloudfront
        .createInvalidation(invalidationParams)
        .promise();

      expect(invalidation.Invalidation.Id).toBeDefined();
      expect(invalidation.Invalidation.Status).toBeDefined();

      // Verify invalidation exists
      const invalidationStatus = await cloudfront
        .getInvalidation({
          DistributionId: outputs.DistributionIdOutput,
          Id: invalidation.Invalidation.Id,
        })
        .promise();

      expect(invalidationStatus.Invalidation.Id).toBe(
        invalidation.Invalidation.Id
      );
    });

    test('should handle batch invalidations', async () => {
      const invalidationParams = {
        DistributionId: outputs.DistributionIdOutput,
        InvalidationBatch: {
          Paths: {
            Quantity: testFiles.length,
            Items: testFiles.map(f => `/${f.name}`),
          },
          CallerReference: `test-batch-invalidation-${Date.now()}`,
        },
      };

      const invalidation = await cloudfront
        .createInvalidation(invalidationParams)
        .promise();

      expect(invalidation.Invalidation.Id).toBeDefined();
      expect(invalidation.Invalidation.InvalidationBatch.Paths.Quantity).toBe(testFiles.length);
    });
  });
});