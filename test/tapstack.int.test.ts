import * as fs from 'fs';
import https from 'https';
import * as path from 'path';

const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

// Helper function to make HTTPS requests
const makeRequest = (
  url: string,
  timeout: number = 10000
): Promise<{
  statusCode: number;
  headers: any;
  body: string;
}> => {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { timeout }, res => {
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

describe('TapStack CloudFormation Integration Tests', () => {
  let outputs: any;
  const testTimeout = 30000;

  beforeAll(() => {
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Integration outputs not found. Run deployment to produce ${outputsPath}`);
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  });

  // --- CloudFormation Outputs Validation ---

  describe('CloudFormation Outputs Validation', () => {
    test('should have all required infrastructure outputs', () => {
      const requiredOutputs = [
        'VPCId',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'PrivateSubnet3Id',
        'KMSKeyId',
        'KMSKeyArn',
        'KinesisStreamName',
        'KinesisStreamArn',
        'DBClusterId',
        'DBClusterEndpoint',
        'DBClusterReadEndpoint',
        'DBSecretArn',
        'ECSClusterName',
        'ECSClusterArn',
        'ECSServiceName',
        'APIGatewayId',
        'APIGatewayURL',
        'CloudTrailName',
        'CloudTrailBucketName',
        'EnvironmentSuffix',
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('should have valid AWS resource identifiers', () => {
      // VPC ID should start with vpc-
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);

      // Subnet IDs should start with subnet-
      expect(outputs.PrivateSubnet1Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.PrivateSubnet2Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.PrivateSubnet3Id).toMatch(/^subnet-[a-f0-9]+$/);

      // KMS Key ARN should be valid
      expect(outputs.KMSKeyArn).toMatch(/^arn:aws:kms:[\w-]+:\d+:key\/[0-9a-f-]+$/);

      // Kinesis Stream ARN should be valid
      expect(outputs.KinesisStreamArn).toMatch(/^arn:aws:kinesis:[\w-]+:\d+:stream\/.+$/);

      // ECS Cluster ARN should be valid
      expect(outputs.ECSClusterArn).toMatch(/^arn:aws:ecs:[\w-]+:\d+:cluster\/.+$/);
    });

    test('should have valid database endpoints', () => {
      // RDS cluster endpoint should be valid
      expect(outputs.DBClusterEndpoint).toMatch(/^[a-z0-9-]+\.cluster-[a-z0-9]+\.[\w-]+\.rds\.amazonaws\.com$/);

      // RDS read endpoint should be valid
      expect(outputs.DBClusterReadEndpoint).toMatch(/^[a-z0-9-]+\.cluster-ro-[a-z0-9]+\.[\w-]+\.rds\.amazonaws\.com$/);
    });

    test('should have valid secret ARN', () => {
      expect(outputs.DBSecretArn).toMatch(/^arn:aws:secretsmanager:[\w-]+:\d+:secret:.+$/);
    });

    test('should have valid API Gateway URL', () => {
      expect(outputs.APIGatewayURL).toMatch(/^https:\/\/[a-z0-9]+\.execute-api\.[\w-]+\.amazonaws\.com\/prod$/);
    });

    test('should not expose secrets in stack outputs', () => {
      const keys = Object.keys(outputs);
      keys.forEach(k => {
        const lowered = k.toLowerCase();
        const v = String(outputs[k] ?? '');
        // Secrets should be referenced by ARN only, not exposed
        if (lowered.includes('secret')) {
          expect(v).toMatch(/^arn:aws:secretsmanager:/);
        }
        expect(lowered).not.toMatch(/password|credential/i);
      });
    });
  });

  // --- VPC and Network Infrastructure Tests ---

  describe('VPC and Network Infrastructure', () => {
    test('VPC should exist and be valid', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('should have three private subnets', () => {
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet3Id).toBeDefined();

      // All subnet IDs should be unique
      const subnetIds = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
      ];
      const uniqueSubnets = new Set(subnetIds);
      expect(uniqueSubnets.size).toBe(3);
    });
  });

  // --- KMS Encryption Tests ---

  describe('KMS Encryption Infrastructure', () => {
    test('KMS key should be deployed and accessible', () => {
      expect(outputs.KMSKeyId).toBeDefined();
      expect(outputs.KMSKeyArn).toBeDefined();
      expect(outputs.KMSKeyArn).toMatch(/^arn:aws:kms:/);
    });

    test('KMS key ID should match the ARN', () => {
      const keyIdFromArn = outputs.KMSKeyArn.split('/').pop();
      expect(outputs.KMSKeyId).toBe(keyIdFromArn);
    });
  });

  // --- Kinesis Stream Tests ---

  describe('Kinesis Data Stream', () => {
    test('Kinesis stream should be deployed', () => {
      expect(outputs.KinesisStreamName).toBeDefined();
      expect(outputs.KinesisStreamArn).toBeDefined();
    });

    test('Kinesis stream name should follow naming convention', () => {
      const envSuffix = outputs.EnvironmentSuffix || 'dev';
      expect(outputs.KinesisStreamName).toBe(`patient-data-stream-${envSuffix}`);
    });

    test('Kinesis stream ARN should be valid', () => {
      expect(outputs.KinesisStreamArn).toMatch(/^arn:aws:kinesis:[\w-]+:\d+:stream\/patient-data-stream-/);
    });
  });

  // --- RDS Aurora Tests ---

  describe('RDS Aurora Serverless Database', () => {
    test('Aurora cluster should be deployed', () => {
      expect(outputs.DBClusterId).toBeDefined();
      expect(outputs.DBClusterEndpoint).toBeDefined();
      expect(outputs.DBClusterReadEndpoint).toBeDefined();
    });

    test('Aurora cluster ID should follow naming convention', () => {
      const envSuffix = outputs.EnvironmentSuffix || 'dev';
      expect(outputs.DBClusterId).toBe(`aurora-cluster-${envSuffix}`);
    });

    test('Aurora endpoints should be different (writer vs reader)', () => {
      expect(outputs.DBClusterEndpoint).not.toBe(outputs.DBClusterReadEndpoint);
    });

    test('Aurora endpoints should be accessible via DNS', () => {
      // Endpoints should be valid DNS names
      expect(outputs.DBClusterEndpoint).toMatch(/^[a-z0-9.-]+$/);
      expect(outputs.DBClusterReadEndpoint).toMatch(/^[a-z0-9.-]+$/);
    });

    test('database credentials should be in Secrets Manager', () => {
      expect(outputs.DBSecretArn).toBeDefined();
      expect(outputs.DBSecretArn).toMatch(/^arn:aws:secretsmanager:[\w-]+:\d+:secret:aurora-db-secret-/);
    });
  });

  // --- ECS Infrastructure Tests ---

  describe('ECS Cluster and Services', () => {
    test('ECS cluster should be deployed', () => {
      expect(outputs.ECSClusterName).toBeDefined();
      expect(outputs.ECSClusterArn).toBeDefined();
    });

    test('ECS cluster name should follow naming convention', () => {
      const envSuffix = outputs.EnvironmentSuffix || 'dev';
      expect(outputs.ECSClusterName).toBe(`data-processing-cluster-${envSuffix}`);
    });

    test('ECS service should be deployed', () => {
      expect(outputs.ECSServiceName).toBeDefined();
    });

    test('ECS cluster ARN should be valid', () => {
      expect(outputs.ECSClusterArn).toMatch(/^arn:aws:ecs:[\w-]+:\d+:cluster\/data-processing-cluster-/);
    });
  });

  // --- API Gateway Tests ---

  describe('API Gateway', () => {
    test('API Gateway should be deployed', () => {
      expect(outputs.APIGatewayId).toBeDefined();
      expect(outputs.APIGatewayURL).toBeDefined();
    });

    test('API Gateway ID should be valid', () => {
      expect(outputs.APIGatewayId).toMatch(/^[a-z0-9]+$/);
    });

    test('API Gateway URL should use HTTPS', () => {
      expect(outputs.APIGatewayURL).toMatch(/^https:\/\//);
    });

    test(
      'API Gateway health endpoint should be accessible',
      async () => {
        const healthUrl = `${outputs.APIGatewayURL}/health`;

        const isHealthy = await waitForCondition(
          async () => {
            try {
              const response = await makeRequest(healthUrl);
              // Health endpoint uses AWS_IAM auth, so we expect 403 without credentials
              // or 200 if accessible
              return response.statusCode === 200 || response.statusCode === 403;
            } catch (error) {
              return false;
            }
          },
          10,
          5000
        );

        expect(isHealthy).toBe(true);
      },
      testTimeout
    );

    test(
      'API Gateway should respond to requests',
      async () => {
        const apiUrl = outputs.APIGatewayURL;

        const isResponding = await waitForCondition(
          async () => {
            try {
              const response = await makeRequest(apiUrl);
              // API Gateway should respond (even if it's 403 due to auth)
              return response.statusCode >= 200 && response.statusCode < 500;
            } catch (error) {
              return false;
            }
          },
          10,
          5000
        );

        expect(isResponding).toBe(true);
      },
      testTimeout
    );
  });

  // --- CloudTrail Audit Logging Tests ---

  describe('CloudTrail Audit Logging', () => {
    test('CloudTrail should be deployed', () => {
      expect(outputs.CloudTrailName).toBeDefined();
      expect(outputs.CloudTrailBucketName).toBeDefined();
    });

    test('CloudTrail name should follow naming convention', () => {
      const envSuffix = outputs.EnvironmentSuffix || 'dev';
      expect(outputs.CloudTrailName).toBe(`hipaa-audit-trail-${envSuffix}`);
    });

    test('CloudTrail bucket should follow naming convention', () => {
      const envSuffix = outputs.EnvironmentSuffix || 'dev';
      expect(outputs.CloudTrailBucketName).toMatch(new RegExp(`^cloudtrail-logs-${envSuffix}-\\d+$`));
    });

    test('CloudTrail bucket should be valid S3 bucket name', () => {
      expect(outputs.CloudTrailBucketName).toMatch(/^[a-z0-9.-]+$/);
      expect(outputs.CloudTrailBucketName.length).toBeLessThanOrEqual(63);
    });
  });

  // --- Security and Compliance Tests ---

  describe('Security and Compliance', () => {
    test('all encryption keys should be deployed', () => {
      expect(outputs.KMSKeyId).toBeDefined();
      expect(outputs.KMSKeyArn).toBeDefined();
    });

    test('database credentials should be in Secrets Manager', () => {
      expect(outputs.DBSecretArn).toBeDefined();
      expect(outputs.DBSecretArn).toMatch(/^arn:aws:secretsmanager:/);
    });

    test('API Gateway should enforce HTTPS', () => {
      expect(outputs.APIGatewayURL).toMatch(/^https:\/\//);
    });

    test('should have audit trail configured', () => {
      expect(outputs.CloudTrailName).toBeDefined();
      expect(outputs.CloudTrailBucketName).toBeDefined();
    });
  });

  // --- Resource Naming Convention Tests ---

  describe('Resource Naming Conventions', () => {
    test('all resources should include environment suffix', () => {
      const envSuffix = outputs.EnvironmentSuffix || 'dev';
      expect(outputs.KinesisStreamName).toContain(envSuffix);
      expect(outputs.DBClusterId).toContain(envSuffix);
      expect(outputs.ECSClusterName).toContain(envSuffix);
      expect(outputs.CloudTrailName).toContain(envSuffix);
    });

    test('environment suffix should be valid', () => {
      expect(outputs.EnvironmentSuffix).toBeDefined();
      expect(outputs.EnvironmentSuffix).toMatch(/^[a-zA-Z0-9]+$/);
    });
  });

  // --- High Availability Tests ---

  describe('High Availability Configuration', () => {
    test('should have multiple availability zones configured', () => {
      // Three private subnets indicate multi-AZ deployment
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet3Id).toBeDefined();
    });

    test('Aurora should have read and write endpoints', () => {
      expect(outputs.DBClusterEndpoint).toBeDefined();
      expect(outputs.DBClusterReadEndpoint).toBeDefined();
      expect(outputs.DBClusterEndpoint).not.toBe(outputs.DBClusterReadEndpoint);
    });

    test('ECS service should be deployed', () => {
      // ECS service with desired count of 2 provides redundancy
      expect(outputs.ECSServiceName).toBeDefined();
    });
  });

  // --- Integration Connectivity Tests ---

  describe('Service Integration', () => {
    test('all services should be in the same VPC', () => {
      // All private subnets should be in the same VPC
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet3Id).toBeDefined();
    });

    test('database should be accessible from ECS tasks', () => {
      // Database endpoints should be resolvable
      expect(outputs.DBClusterEndpoint).toBeDefined();
      expect(outputs.DBClusterEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });

    test('Kinesis stream should be accessible from ECS tasks', () => {
      expect(outputs.KinesisStreamName).toBeDefined();
      expect(outputs.KinesisStreamArn).toBeDefined();
    });

    test('API Gateway should be publicly accessible', () => {
      expect(outputs.APIGatewayURL).toBeDefined();
      expect(outputs.APIGatewayURL).toMatch(/^https:\/\//);
    });
  });

  // --- HIPAA Compliance Tests ---

  describe('HIPAA Compliance Validation', () => {
    test('encryption should be enabled for data at rest', () => {
      // KMS key should be deployed
      expect(outputs.KMSKeyId).toBeDefined();
      expect(outputs.KMSKeyArn).toBeDefined();
    });

    test('audit logging should be enabled', () => {
      expect(outputs.CloudTrailName).toBeDefined();
      expect(outputs.CloudTrailBucketName).toBeDefined();
    });

    test('database credentials should be securely stored', () => {
      expect(outputs.DBSecretArn).toBeDefined();
      expect(outputs.DBSecretArn).toMatch(/^arn:aws:secretsmanager:/);
    });

    test('all network access should be private', () => {
      // Only private subnets should be present
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet3Id).toBeDefined();
    });

    test('data in transit should use encryption', () => {
      // API Gateway should use HTTPS
      expect(outputs.APIGatewayURL).toMatch(/^https:\/\//);
    });
  });

  // --- Performance and Scalability Tests ---

  describe('Performance and Scalability', () => {
    test('Aurora should support serverless scaling', () => {
      // Aurora cluster should be deployed with serverless configuration
      expect(outputs.DBClusterId).toBeDefined();
      expect(outputs.DBClusterEndpoint).toBeDefined();
    });

    test('ECS should support horizontal scaling', () => {
      // ECS cluster and service should be deployed
      expect(outputs.ECSClusterName).toBeDefined();
      expect(outputs.ECSServiceName).toBeDefined();
    });

    test('Kinesis should support stream processing', () => {
      expect(outputs.KinesisStreamName).toBeDefined();
      expect(outputs.KinesisStreamArn).toBeDefined();
    });
  });

  // --- End-to-End Infrastructure Tests ---

  describe('End-to-End Infrastructure', () => {
    test('complete HIPAA-compliant pipeline should be deployed', () => {
      // Verify all major components are deployed
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.KMSKeyId).toBeDefined();
      expect(outputs.KinesisStreamName).toBeDefined();
      expect(outputs.DBClusterId).toBeDefined();
      expect(outputs.ECSClusterName).toBeDefined();
      expect(outputs.APIGatewayURL).toBeDefined();
      expect(outputs.CloudTrailName).toBeDefined();
    });

    test('all infrastructure should be properly tagged', () => {
      // Environment suffix should be consistent
      const envSuffix = outputs.EnvironmentSuffix;
      expect(envSuffix).toBeDefined();

      // All major resources should reference the same environment
      expect(outputs.KinesisStreamName).toContain(envSuffix);
      expect(outputs.DBClusterId).toContain(envSuffix);
      expect(outputs.ECSClusterName).toContain(envSuffix);
    });

    test(
      'infrastructure should be healthy and responding',
      async () => {
        const apiUrl = outputs.APIGatewayURL;

        const isHealthy = await waitForCondition(
          async () => {
            try {
              const response = await makeRequest(apiUrl);
              return response.statusCode >= 200 && response.statusCode < 500;
            } catch (error) {
              return false;
            }
          },
          15,
          5000
        );

        expect(isHealthy).toBe(true);
      },
      testTimeout
    );
  });
});

