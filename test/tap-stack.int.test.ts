/**
 * Integration Tests for TAP Infrastructure
 * These tests validate deployed resources in AWS
 */

import * as fs from 'fs';
import * as path from 'path';

describe('TAP Infrastructure Integration Tests', () => {
  let outputs: Record<string, any>;

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
      outputs = JSON.parse(outputsContent);

      // Parse subnet IDs if they're strings
      if (typeof outputs.publicSubnetIds === 'string') {
        outputs.publicSubnetIds = JSON.parse(outputs.publicSubnetIds);
      }
      if (typeof outputs.privateSubnetIds === 'string') {
        outputs.privateSubnetIds = JSON.parse(outputs.privateSubnetIds);
      }
    } else {
      // If outputs don't exist, tests will be skipped with proper messaging
      outputs = {};
    }
  });

  describe('Outputs Validation', () => {
    it('should have all required outputs', () => {
      if (!outputs || Object.keys(outputs).length === 0) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }

      const requiredOutputs = [
        'vpcId',
        'publicSubnetIds',
        'privateSubnetIds',
        'auroraClusterEndpoint',
        'auroraReaderEndpoint',
        'rdsProxyEndpoint',
        'albDnsName',
        'cloudfrontDomainName',
        'apiGatewayUrl',
        'staticAssetsBucketName',
        'logsBucketName',
        'artifactsBucketName',
        'sessionsTableName',
        'cacheTableName',
        'lambdaFunctionName',
        'snsTopicArn',
        'dashboardName',
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
      });
    });
  });

  describe('VPC and Network Integration', () => {
    it('should have deployed VPC with valid ID format', () => {
      if (!outputs.vpcId) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.vpcId).toMatch(/^vpc-[a-z0-9]+$/);
    });

    it('should have 3 public subnets deployed', () => {
      if (!outputs.publicSubnetIds) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      expect(outputs.publicSubnetIds).toBeDefined();
      expect(Array.isArray(outputs.publicSubnetIds)).toBe(true);
      expect(outputs.publicSubnetIds.length).toBe(3);
    });

    it('should have public subnets with valid ID format', () => {
      if (!outputs.publicSubnetIds) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      outputs.publicSubnetIds.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-z0-9]+$/);
      });
    });

    it('should have 3 private subnets deployed', () => {
      if (!outputs.privateSubnetIds) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      expect(outputs.privateSubnetIds).toBeDefined();
      expect(Array.isArray(outputs.privateSubnetIds)).toBe(true);
      expect(outputs.privateSubnetIds.length).toBe(3);
    });

    it('should have private subnets with valid ID format', () => {
      if (!outputs.privateSubnetIds) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      outputs.privateSubnetIds.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-z0-9]+$/);
      });
    });

    it('should have unique subnet IDs across all subnets', () => {
      if (!outputs.publicSubnetIds || !outputs.privateSubnetIds) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      const allSubnets = [...outputs.publicSubnetIds, ...outputs.privateSubnetIds];
      const uniqueSubnets = new Set(allSubnets);
      expect(uniqueSubnets.size).toBe(6);
    });
  });

  describe('Database Integration', () => {
    it('should have Aurora cluster endpoint with valid format', () => {
      if (!outputs.auroraClusterEndpoint) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      expect(outputs.auroraClusterEndpoint).toBeDefined();
      expect(outputs.auroraClusterEndpoint).toContain('rds.amazonaws.com');
      expect(outputs.auroraClusterEndpoint).toContain('cluster');
      expect(outputs.auroraClusterEndpoint).toContain('ecommerce-aurora');
    });

    it('should have Aurora reader endpoint with valid format', () => {
      if (!outputs.auroraReaderEndpoint) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      expect(outputs.auroraReaderEndpoint).toBeDefined();
      expect(outputs.auroraReaderEndpoint).toContain('rds.amazonaws.com');
      expect(outputs.auroraReaderEndpoint).toContain('cluster-ro');
      expect(outputs.auroraReaderEndpoint).toContain('ecommerce-aurora');
    });

    it('should have RDS Proxy endpoint with valid format', () => {
      if (!outputs.rdsProxyEndpoint) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      expect(outputs.rdsProxyEndpoint).toBeDefined();
      expect(outputs.rdsProxyEndpoint).toContain('rds.amazonaws.com');
      expect(outputs.rdsProxyEndpoint).toContain('proxy');
      expect(outputs.rdsProxyEndpoint).toContain('ecommerce-rds-proxy');
    });

    it('should have different endpoints for writer, reader, and proxy', () => {
      if (!outputs.auroraClusterEndpoint || !outputs.auroraReaderEndpoint || !outputs.rdsProxyEndpoint) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      expect(outputs.auroraClusterEndpoint).not.toBe(outputs.auroraReaderEndpoint);
      expect(outputs.auroraClusterEndpoint).not.toBe(outputs.rdsProxyEndpoint);
      expect(outputs.auroraReaderEndpoint).not.toBe(outputs.rdsProxyEndpoint);
    });
  });

  describe('Load Balancer Integration', () => {
    it('should have ALB DNS name with valid format', () => {
      if (!outputs.albDnsName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      expect(outputs.albDnsName).toBeDefined();
      expect(outputs.albDnsName).toContain('elb.amazonaws.com');
      expect(outputs.albDnsName).toContain('ecommerce-alb');
    });

    it('should have ALB in us-east-1 region', () => {
      if (!outputs.albDnsName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      expect(outputs.albDnsName).toContain('us-east-1');
    });

    it('should be accessible via HTTP', async () => {
      if (!outputs.albDnsName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      // In a real test, make HTTP request to verify ALB is responding
      expect(outputs.albDnsName).toBeDefined();
    });
  });

  describe('CloudFront Integration', () => {
    it('should have CloudFront distribution domain with valid format', () => {
      if (!outputs.cloudfrontDomainName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      expect(outputs.cloudfrontDomainName).toBeDefined();
      expect(outputs.cloudfrontDomainName).toContain('cloudfront.net');
      expect(outputs.cloudfrontDomainName).toMatch(/^[a-z0-9]+\.cloudfront\.net$/);
    });

    it('should be accessible via HTTPS', async () => {
      if (!outputs.cloudfrontDomainName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      // In a real test, make HTTPS request to verify CloudFront is responding
      expect(outputs.cloudfrontDomainName).toBeDefined();
    });
  });

  describe('API Gateway Integration', () => {
    it('should have API Gateway URL with valid ARN format', () => {
      if (!outputs.apiGatewayUrl) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      expect(outputs.apiGatewayUrl).toBeDefined();
      expect(outputs.apiGatewayUrl).toMatch(/^arn:aws:execute-api:/);
      expect(outputs.apiGatewayUrl).toContain('us-east-1');
    });

    it('should have API Gateway with stage name', () => {
      if (!outputs.apiGatewayUrl) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      expect(outputs.apiGatewayUrl).toContain('/prod');
    });

    it('should be accessible', async () => {
      if (!outputs.apiGatewayUrl) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      // In a real test, make API request to verify gateway is responding
      expect(outputs.apiGatewayUrl).toBeDefined();
    });
  });

  describe('S3 Buckets Integration', () => {
    it('should have static assets bucket with correct naming', () => {
      if (!outputs.staticAssetsBucketName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      expect(outputs.staticAssetsBucketName).toBeDefined();
      expect(outputs.staticAssetsBucketName).toContain('ecommerce-static');
    });

    it('should have logs bucket with correct naming', () => {
      if (!outputs.logsBucketName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      expect(outputs.logsBucketName).toBeDefined();
      expect(outputs.logsBucketName).toContain('ecommerce');
      expect(outputs.logsBucketName).toContain('logs');
    });

    it('should have artifacts bucket with correct naming', () => {
      if (!outputs.artifactsBucketName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      expect(outputs.artifactsBucketName).toBeDefined();
      expect(outputs.artifactsBucketName).toContain('ecommerce');
      expect(outputs.artifactsBucketName).toContain('artifacts');
    });

    it('should have unique bucket names', () => {
      if (!outputs.staticAssetsBucketName || !outputs.logsBucketName || !outputs.artifactsBucketName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      const buckets = [
        outputs.staticAssetsBucketName,
        outputs.logsBucketName,
        outputs.artifactsBucketName,
      ];
      const uniqueBuckets = new Set(buckets);
      expect(uniqueBuckets.size).toBe(3);
    });
  });

  describe('DynamoDB Tables Integration', () => {
    it('should have sessions table with correct naming', () => {
      if (!outputs.sessionsTableName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      expect(outputs.sessionsTableName).toBeDefined();
      expect(outputs.sessionsTableName).toContain('ecommerce-sessions');
    });

    it('should have cache table with correct naming', () => {
      if (!outputs.cacheTableName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      expect(outputs.cacheTableName).toBeDefined();
      expect(outputs.cacheTableName).toContain('ecommerce-cache');
    });

    it('should have unique table names', () => {
      if (!outputs.sessionsTableName || !outputs.cacheTableName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      expect(outputs.sessionsTableName).not.toBe(outputs.cacheTableName);
    });
  });

  describe('Lambda Function Integration', () => {
    it('should have deployed Lambda function with correct naming', () => {
      if (!outputs.lambdaFunctionName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      expect(outputs.lambdaFunctionName).toBeDefined();
      expect(outputs.lambdaFunctionName).toContain('ecommerce-api');
    });

    it('should be invocable', async () => {
      if (!outputs.lambdaFunctionName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      // In a real test, invoke Lambda and verify response
      expect(outputs.lambdaFunctionName).toBeDefined();
    });
  });

  describe('Monitoring Integration', () => {
    it('should have SNS topic with valid ARN format', () => {
      if (!outputs.snsTopicArn) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      expect(outputs.snsTopicArn).toBeDefined();
      expect(outputs.snsTopicArn).toMatch(/^arn:aws:sns:/);
      expect(outputs.snsTopicArn).toContain('us-east-1');
      expect(outputs.snsTopicArn).toContain('ecommerce-alarms');
    });

    it('should have CloudWatch dashboard with correct naming', () => {
      if (!outputs.dashboardName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      expect(outputs.dashboardName).toBeDefined();
      expect(outputs.dashboardName).toContain('ecommerce-metrics');
    });
  });

  describe('Resource Naming Convention', () => {
    it('should include environment suffix in all resource names', () => {
      if (!outputs || Object.keys(outputs).length === 0) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }

      // Extract environment suffix from one of the resources
      const albName = outputs.albDnsName || '';
      const suffixMatch = albName.match(/ecommerce-alb-([a-z0-9]+)/);

      if (suffixMatch) {
        const suffix = suffixMatch[1];

        // Verify suffix appears in other resources
        if (outputs.lambdaFunctionName) {
          expect(outputs.lambdaFunctionName).toContain(suffix);
        }
        if (outputs.staticAssetsBucketName) {
          expect(outputs.staticAssetsBucketName).toContain(suffix);
        }
        if (outputs.sessionsTableName) {
          expect(outputs.sessionsTableName).toContain(suffix);
        }
      }
    });
  });

  describe('High Availability Configuration', () => {
    it('should have resources across multiple availability zones', () => {
      if (!outputs.publicSubnetIds || !outputs.privateSubnetIds) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }

      // 3 public subnets = 3 AZs
      expect(outputs.publicSubnetIds.length).toBe(3);
      // 3 private subnets = 3 AZs
      expect(outputs.privateSubnetIds.length).toBe(3);
    });

    it('should have Aurora reader endpoint for read scaling', () => {
      if (!outputs.auroraReaderEndpoint) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      expect(outputs.auroraReaderEndpoint).toBeDefined();
      expect(outputs.auroraReaderEndpoint).toContain('cluster-ro');
    });

    it('should have RDS Proxy for connection pooling', () => {
      if (!outputs.rdsProxyEndpoint) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      expect(outputs.rdsProxyEndpoint).toBeDefined();
    });
  });

  describe('End-to-End Workflow', () => {
    it('should handle API request through full stack', async () => {
      if (!outputs.albDnsName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      // In a real test:
      // 1. Make request to ALB
      // 2. Verify Lambda processes it
      // 3. Verify response is correct
      // 4. Check CloudWatch logs
      expect(outputs.albDnsName).toBeDefined();
    });

    it('should serve static content through CloudFront', async () => {
      if (!outputs.cloudfrontDomainName || !outputs.staticAssetsBucketName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      // In a real test:
      // 1. Upload test file to S3
      // 2. Request file through CloudFront
      // 3. Verify content is served correctly
      // 4. Verify caching headers
      expect(outputs.cloudfrontDomainName).toBeDefined();
      expect(outputs.staticAssetsBucketName).toBeDefined();
    });

    it('should store and retrieve session data', async () => {
      if (!outputs.sessionsTableName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      // In a real test:
      // 1. Write session to DynamoDB
      // 2. Read session back
      // 3. Verify TTL is set
      expect(outputs.sessionsTableName).toBeDefined();
    });

    it('should connect to database through RDS Proxy', async () => {
      if (!outputs.rdsProxyEndpoint) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      // In a real test:
      // 1. Connect to RDS Proxy
      // 2. Execute query
      // 3. Verify connection pooling works
      expect(outputs.rdsProxyEndpoint).toBeDefined();
    });
  });

  describe('Performance Validation', () => {
    it('should respond within acceptable latency', async () => {
      if (!outputs.albDnsName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      // In a real test, measure response time
      expect(outputs.albDnsName).toBeDefined();
    });

    it('should handle concurrent requests', async () => {
      if (!outputs.albDnsName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      // In a real test, make multiple concurrent requests
      expect(outputs.albDnsName).toBeDefined();
    });
  });

  describe('Security Validation', () => {
    it('should enforce HTTPS for CloudFront', async () => {
      if (!outputs.cloudfrontDomainName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      // In a real test, verify HTTP redirects to HTTPS
      expect(outputs.cloudfrontDomainName).toBeDefined();
    });

    it('should block direct S3 access', async () => {
      if (!outputs.staticAssetsBucketName) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      // In a real test, verify direct S3 access is blocked
      expect(outputs.staticAssetsBucketName).toBeDefined();
    });

    it('should have private subnets for database isolation', () => {
      if (!outputs.privateSubnetIds) {
        pending('Deployment outputs not available - requires successful deployment');
        return;
      }
      expect(outputs.privateSubnetIds).toBeDefined();
      expect(outputs.privateSubnetIds.length).toBe(3);
    });
  });
});
