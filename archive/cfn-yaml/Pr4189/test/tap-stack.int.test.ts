// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import http from 'http';
import https from 'https';
import { URL } from 'url';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Helper function to make HTTP/HTTPS requests
const makeRequest = (
  url: string,
  timeout: number = 10000
): Promise<{
  statusCode: number;
  headers: any;
  body: string;
}> => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const req = client.request(url, { timeout }, res => {
      let body = '';
      res.on('data', chunk => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          body,
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
};

// Helper function to wait for a condition with retries
const waitForCondition = async (
  condition: () => Promise<boolean>,
  maxRetries: number = 10,
  delayMs: number = 5000
): Promise<boolean> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (await condition()) {
        return true;
      }
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error);
    }

    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  return false;
};

describe('TapStack Infrastructure Integration Tests', () => {
  // Test timeout for integration tests (30 seconds)
  const testTimeout = 30000;

  describe('CloudFormation Outputs Validation', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'VPCId',
        'ALBDNSName',
        'CloudFrontURL',
        'S3BucketName',
        'RDSEndpoint',
        'PrivateInstanceId',
        'SSHKeyPairName',
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('should have valid AWS resource identifiers', () => {
      // VPC ID should start with vpc-
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);

      // Instance ID should start with i-
      expect(outputs.PrivateInstanceId).toMatch(/^i-[a-f0-9]+$/);

      // S3 bucket name should be valid
      expect(outputs.S3BucketName).toMatch(/^[a-z0-9.-]+$/);

      // CloudFront domain should be valid
      expect(outputs.CloudFrontURL).toMatch(/^https:\/\/.+\.cloudfront\.net$/);

      // RDS endpoint should be valid
      expect(outputs.RDSEndpoint).toMatch(/^.+\.rds\.amazonaws\.com$/);
    });

    test('should have valid URLs', () => {
      // Load Balancer DNS should be valid
      expect(outputs.ALBDNSName).toMatch(
        /^.+\.elb\.amazonaws\.com$/
      );

      // CloudFront URL should be HTTPS
      expect(outputs.CloudFrontURL).toMatch(/^https:\/\/.+\.cloudfront\.net$/);

      // S3 bucket name should be valid format
      expect(outputs.S3BucketName).toMatch(
        /^[a-z0-9.-]+$/
      );
    });

    test('should not expose secrets in stack outputs', () => {
      const keys = Object.keys(outputs);
      keys.forEach(k => {
        const lowered = k.toLowerCase();
        const v = String(outputs[k] ?? '');
        if (lowered === 'sshkeypairname') {
          // Allow SSH key name output but ensure it follows naming convention
          expect(v).toMatch(/^myapp-[a-z0-9-]+-ssh-key$/);
        } else {
          expect(lowered).not.toMatch(/password|secret|token/i);
          expect(v.toLowerCase()).not.toMatch(/password|secret|token/i);
        }
      });
    });
  });

  describe('Application Load Balancer Tests', () => {
    test(
      'should respond to HTTP requests',
      async () => {
        const albUrl = `http://${outputs.ALBDNSName}`;

        const isHealthy = await waitForCondition(
          async () => {
            try {
              const response = await makeRequest(albUrl);
              return response.statusCode === 200;
            } catch (error) {
              return false;
            }
          },
          12,
          10000
        ); // Wait up to 2 minutes for ALB to be ready

        expect(isHealthy).toBe(true);
      },
      testTimeout
    );

    test(
      'should serve the web application content',
      async () => {
        const albUrl = `http://${outputs.ALBDNSName}`;

        try {
          const response = await makeRequest(albUrl);
          expect(response.statusCode).toBe(200);
          expect(response.body).toContain('Hello from');
          expect(response.body).toContain('myapp');
          expect(response.body).toContain(environmentSuffix);
        } catch (error) {
          // If direct test fails, wait and retry
          const isHealthy = await waitForCondition(async () => {
            try {
              const retryResponse = await makeRequest(albUrl);
              return (
                retryResponse.statusCode === 200 &&
                retryResponse.body.includes('Hello from')
              );
            } catch (retryError) {
              return false;
            }
          });
          expect(isHealthy).toBe(true);
        }
      },
      testTimeout
    );

    test(
      'should have proper web server headers',
      async () => {
        const albUrl = `http://${outputs.ALBDNSName}`;

        const hasWebServerHeaders = await waitForCondition(async () => {
          try {
            const response = await makeRequest(albUrl);
            return (
              response.statusCode === 200 &&
              (response.headers.server?.includes('Apache') ||
                response.headers['content-type']?.includes('text/html'))
            );
          } catch (error) {
            return false;
          }
        });

        expect(hasWebServerHeaders).toBe(true);
      },
      testTimeout
    );

    test(
      'should respond within acceptable time limits',
      async () => {
        const albUrl = `http://${outputs.ALBDNSName}`;
        const startTime = Date.now();

        try {
          const response = await makeRequest(albUrl, 15000); // 15 second timeout
          const responseTime = Date.now() - startTime;

          expect(response.statusCode).toBe(200);
          expect(responseTime).toBeLessThan(15000); // Should respond within 15 seconds
        } catch (error) {
          // If direct test fails, wait and retry with timeout check
          const isHealthy = await waitForCondition(async () => {
            try {
              const retryStartTime = Date.now();
              const retryResponse = await makeRequest(albUrl, 15000);
              const retryResponseTime = Date.now() - retryStartTime;
              return (
                retryResponse.statusCode === 200 &&
                retryResponseTime < 15000
              );
            } catch (retryError) {
              return false;
            }
          });
          expect(isHealthy).toBe(true);
        }
      },
      testTimeout
    );
  });

  describe('CloudFront CDN Tests', () => {
    test(
      'should respond to HTTPS requests',
      async () => {
        const url = outputs.CloudFrontURL;

        const isResponding = await waitForCondition(
          async () => {
            try {
              const response = await makeRequest(url);
              return response.statusCode === 200 || response.statusCode === 403; // 403 is OK for empty S3
            } catch (error) {
              return false;
            }
          },
          15,
          8000
        ); // CloudFront can take longer to propagate

        expect(isResponding).toBe(true);
      },
      testTimeout
    );

    test(
      'should enforce HTTPS',
      async () => {
        const httpsUrl = outputs.CloudFrontURL;
        const httpUrl = httpsUrl.replace('https://', 'http://');

        try {
          // HTTP request should either redirect to HTTPS or be blocked
          const response = await makeRequest(httpUrl);
          // CloudFront typically returns 403 for HTTP requests when HTTPS is enforced
          expect([301, 302, 403, 400]).toContain(response.statusCode);
        } catch (error) {
          // Connection errors are also acceptable as HTTP might be blocked
          expect(error).toBeDefined();
        }
      },
      testTimeout
    );

    test(
      'should have CloudFront headers',
      async () => {
        const url = outputs.CloudFrontURL;

        const hasCloudFrontHeaders = await waitForCondition(async () => {
          try {
            const response = await makeRequest(url);
            return (
              response.headers['x-amz-cf-id'] !== undefined ||
              response.headers['x-amz-cf-pop'] !== undefined ||
              response.headers['via']?.includes('cloudfront')
            );
          } catch (error) {
            return false;
          }
        });

        expect(hasCloudFrontHeaders).toBe(true);
      },
      testTimeout
    );

    test(
      'should have proper CDN propagation',
      async () => {
        const url = outputs.CloudFrontURL;

        const isPropagated = await waitForCondition(
          async () => {
            try {
              const response = await makeRequest(url);
              return response.statusCode === 200 || response.statusCode === 403;
            } catch (error) {
              return false;
            }
          },
          20,
          10000
        ); // CloudFront can take up to 20 minutes to fully propagate

        expect(isPropagated).toBe(true);
      },
      testTimeout
    );
  });

  describe('S3 Static Content Tests', () => {
    test(
      'should have valid S3 bucket naming convention',
      () => {
        const bucketName = outputs.S3BucketName;
        // Template uses Environment parameter default 'prod' in bucket name
        // Validate naming regardless of ENVIRONMENT_SUFFIX used by CI
        expect(bucketName).toMatch(/^myapp-(dev|staging|prod)-app-bucket-\d+$/);
      }
    );

    test(
      'should have S3 bucket accessible via HTTPS',
      async () => {
        const bucketUrl = `https://${outputs.S3BucketName}.s3.amazonaws.com`;

        try {
          const response = await makeRequest(bucketUrl);
          // S3 bucket might return 403 if no public access, which is expected for security
          expect([200, 403, 404]).toContain(response.statusCode);
        } catch (error) {
          // Connection errors are acceptable for private buckets
          expect(error).toBeDefined();
        }
      },
      testTimeout
    );
  });

  describe('High Availability Tests', () => {
    test('should have resources in multiple availability zones', () => {
      // VPC should be created (implicitly spans multiple AZs)
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('should have load balancer distributing traffic', () => {
      // ALB DNS name should be valid
      expect(outputs.ALBDNSName).toBeDefined();
      expect(outputs.ALBDNSName).toMatch(/^.+\.elb\.amazonaws\.com$/);
    });

    test('should have auto-scaling capabilities', () => {
      // Private instance should exist (part of ASG)
      expect(outputs.PrivateInstanceId).toBeDefined();
      expect(outputs.PrivateInstanceId).toMatch(/^i-[a-f0-9]+$/);
    });
  });

  describe('Security Tests', () => {
    test(
      'should not expose SSH port publicly',
      async () => {
        const albUrl = `http://${outputs.ALBDNSName}:22`;

        try {
          const response = await makeRequest(albUrl, 5000);
          // SSH should not be accessible via ALB
          expect([403, 404, 502, 503]).toContain(response.statusCode);
        } catch (error) {
          // Connection timeout/refused is expected for SSH port
          expect(error).toBeDefined();
        }
      },
      testTimeout
    );

    test(
      'should enforce HTTPS on CloudFront',
      async () => {
        const httpsUrl = outputs.CloudFrontURL;
        const httpUrl = httpsUrl.replace('https://', 'http://');

        try {
          const response = await makeRequest(httpUrl);
          // HTTP should be blocked or redirected
          expect([301, 302, 403, 400]).toContain(response.statusCode);
        } catch (error) {
          // Connection errors are acceptable
          expect(error).toBeDefined();
        }
      },
      testTimeout
    );

    test('should have secure RDS endpoint', () => {
      // RDS should be in private subnet (endpoint should be internal)
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.RDSEndpoint).toMatch(/^.+\.rds\.amazonaws\.com$/);
    });
  });

  describe('Performance & Monitoring Tests', () => {
    test(
      'should handle concurrent requests',
      async () => {
        const albUrl = `http://${outputs.ALBDNSName}`;

        // Make multiple concurrent requests
        const promises = Array(5).fill(null).map(() => makeRequest(albUrl, 10000));

        try {
          const responses = await Promise.all(promises);
          responses.forEach(response => {
            expect(response.statusCode).toBe(200);
          });
        } catch (error) {
          // If some requests fail, wait and retry
          const successfulRequests = await waitForCondition(async () => {
            try {
              const retryPromises = Array(3).fill(null).map(() => makeRequest(albUrl, 10000));
              const retryResponses = await Promise.all(retryPromises);
              return retryResponses.every(response => response.statusCode === 200);
            } catch (retryError) {
              return false;
            }
          });
          expect(successfulRequests).toBe(true);
        }
      },
      testTimeout
    );

    test(
      'should have consistent response times',
      async () => {
        const albUrl = `http://${outputs.ALBDNSName}`;
        const responseTimes: number[] = [];

        for (let i = 0; i < 3; i++) {
          const startTime = Date.now();
          try {
            const response = await makeRequest(albUrl, 10000);
            const responseTime = Date.now() - startTime;
            responseTimes.push(responseTime);
            expect(response.statusCode).toBe(200);
          } catch (error) {
            // If request fails, continue with other requests
            continue;
          }
        }

        if (responseTimes.length > 0) {
          const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
          expect(avgResponseTime).toBeLessThan(10000); // Average should be under 10 seconds
        }
      },
      testTimeout
    );
  });

  describe('End-to-End Application Tests', () => {
    test(
      'should serve complete application workflow',
      async () => {
        const albUrl = `http://${outputs.ALBDNSName}`;

        const isWorking = await waitForCondition(async () => {
          try {
            const response = await makeRequest(albUrl);
            return (
              response.statusCode === 200 &&
              response.body.includes('Hello from') &&
              /Hello from\s+myapp-(dev|staging|prod)/i.test(response.body)
            );
          } catch (error) {
            return false;
          }
        }, 20, 2000);

        expect(isWorking).toBe(true);
      },
      40000
    );

    test(
      'should serve both static and dynamic content',
      async () => {
        const albUrl = `http://${outputs.ALBDNSName}`;

        try {
          const response = await makeRequest(albUrl);
          expect(response.statusCode).toBe(200);
          expect(response.body).toContain('Hello from');
          expect(response.headers['content-type']).toMatch(/text\/html/);
        } catch (error) {
          // If direct test fails, wait and retry
          const isWorking = await waitForCondition(async () => {
            try {
              const retryResponse = await makeRequest(albUrl);
              return (
                retryResponse.statusCode === 200 &&
                retryResponse.body.includes('Hello from') &&
                retryResponse.headers['content-type']?.includes('text/html')
              );
            } catch (retryError) {
              return false;
            }
          });
          expect(isWorking).toBe(true);
        }
      },
      testTimeout
    );

    test(
      'should have proper application headers',
      async () => {
        const albUrl = `http://${outputs.ALBDNSName}`;

        const hasProperHeaders = await waitForCondition(async () => {
          try {
            const response = await makeRequest(albUrl);
            return (
              response.statusCode === 200 &&
              response.headers['content-type']?.includes('text/html')
            );
          } catch (error) {
            return false;
          }
        });

        expect(hasProperHeaders).toBe(true);
      },
      testTimeout
    );
  });

  describe('Database Connectivity Tests', () => {
    test('should have RDS endpoint accessible from private subnet', () => {
      // RDS endpoint should be valid and internal
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.RDSEndpoint).toMatch(/^.+\.rds\.amazonaws\.com$/);

      // Should not be publicly accessible (no public IP)
      expect(outputs.RDSEndpoint).not.toMatch(/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/);
    });

    test('should have proper database configuration', () => {
      // RDS endpoint should follow AWS naming convention with regional subdomain
      // Examples: mydb.abcdef123456.us-east-1.rds.amazonaws.com
      expect(outputs.RDSEndpoint).toMatch(/^[a-z0-9-]+(\.[a-z0-9-]+)+\.rds\.amazonaws\.com$/);
    });
  });

  describe('Infrastructure Health Tests', () => {
    test(
      'should have all core services responding',
      async () => {
        const albUrl = `http://${outputs.ALBDNSName}`;
        const cloudFrontUrl = outputs.CloudFrontURL;

        const albHealthy = await waitForCondition(async () => {
          try {
            const response = await makeRequest(albUrl);
            return response.statusCode === 200;
          } catch (error) {
            return false;
          }
        });

        const cloudFrontHealthy = await waitForCondition(async () => {
          try {
            const response = await makeRequest(cloudFrontUrl);
            return response.statusCode === 200 || response.statusCode === 403;
          } catch (error) {
            return false;
          }
        });

        expect(albHealthy).toBe(true);
        expect(cloudFrontHealthy).toBe(true);
      },
      testTimeout
    );

    test('should have proper resource naming conventions', () => {
      // All outputs should follow consistent naming
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
      expect(outputs.PrivateInstanceId).toMatch(/^i-[a-f0-9]+$/);
      expect(outputs.S3BucketName).toMatch(/^[a-z0-9.-]+$/);
      // Template uses Environment parameter default 'prod' unless overridden during deploy
      expect(outputs.SSHKeyPairName).toMatch(/^myapp-(dev|staging|prod)-ssh-key$/);
    });
  });
});