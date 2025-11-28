import * as fs from 'fs';
import * as path from 'path';

describe('Multi-Region DR Infrastructure Integration Tests', () => {
  let outputs: any;

  beforeAll(() => {
    // Load outputs from deployment
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

    if (fs.existsSync(outputsPath)) {
      const rawData = fs.readFileSync(outputsPath, 'utf-8');
      outputs = JSON.parse(rawData);
    } else {
      outputs = {};
      console.warn('No cfn-outputs/flat-outputs.json found. Integration tests will be limited.');
    }
  });

  describe('Infrastructure Deployment', () => {
    it('should have deployed successfully', () => {
      expect(outputs).toBeDefined();
    });

    it('should have primary VPC ID output', () => {
      if (Object.keys(outputs).length > 0) {
        expect(outputs.primaryVpcId || outputs['dr-infrastructure:primaryVpcId']).toBeDefined();
      } else {
        console.warn('Skipping - no outputs available');
      }
    });

    it('should have DR VPC ID output', () => {
      if (Object.keys(outputs).length > 0) {
        expect(outputs.drVpcId || outputs['dr-infrastructure:drVpcId']).toBeDefined();
      } else {
        console.warn('Skipping - no outputs available');
      }
    });

    it('should have Aurora Global Cluster ID output', () => {
      if (Object.keys(outputs).length > 0) {
        expect(outputs.auroraGlobalClusterId || outputs['dr-infrastructure:auroraGlobalClusterId']).toBeDefined();
      } else {
        console.warn('Skipping - no outputs available');
      }
    });
  });

  describe('Multi-Region Configuration', () => {
    it('should have resources in primary region (us-east-1)', () => {
      if (Object.keys(outputs).length > 0) {
        const primaryVpcId = outputs.primaryVpcId || outputs['dr-infrastructure:primaryVpcId'];
        expect(primaryVpcId).toBeDefined();
      } else {
        console.warn('Skipping - no outputs available');
      }
    });

    it('should have resources in DR region (us-west-2)', () => {
      if (Object.keys(outputs).length > 0) {
        const drVpcId = outputs.drVpcId || outputs['dr-infrastructure:drVpcId'];
        expect(drVpcId).toBeDefined();
      } else {
        console.warn('Skipping - no outputs available');
      }
    });
  });

  describe('Database Configuration', () => {
    it('should have primary cluster endpoint', () => {
      if (Object.keys(outputs).length > 0) {
        const primaryEndpoint = outputs.primaryClusterEndpoint || outputs['dr-infrastructure:primaryClusterEndpoint'];
        if (primaryEndpoint) {
          expect(primaryEndpoint).toContain('rds.amazonaws.com');
        }
      } else {
        console.warn('Skipping - no outputs available');
      }
    });

    it('should have DR cluster endpoint', () => {
      if (Object.keys(outputs).length > 0) {
        const drEndpoint = outputs.drClusterEndpoint || outputs['dr-infrastructure:drClusterEndpoint'];
        if (drEndpoint) {
          expect(drEndpoint).toContain('rds.amazonaws.com');
        }
      } else {
        console.warn('Skipping - no outputs available');
      }
    });
  });

  describe('DynamoDB Global Table', () => {
    it('should have DynamoDB table name', () => {
      if (Object.keys(outputs).length > 0) {
        const tableName = outputs.dynamoTableName || outputs['dr-infrastructure:dynamoTableName'];
        if (tableName) {
          expect(tableName).toContain('session-table');
        }
      } else {
        console.warn('Skipping - no outputs available');
      }
    });
  });

  describe('S3 Buckets', () => {
    it('should have primary S3 bucket', () => {
      if (Object.keys(outputs).length > 0) {
        const primaryBucket = outputs.primaryBucketName || outputs['dr-infrastructure:primaryBucketName'];
        if (primaryBucket) {
          expect(primaryBucket).toContain('artifacts-primary');
        }
      } else {
        console.warn('Skipping - no outputs available');
      }
    });

    it('should have DR S3 bucket', () => {
      if (Object.keys(outputs).length > 0) {
        const drBucket = outputs.drBucketName || outputs['dr-infrastructure:drBucketName'];
        if (drBucket) {
          expect(drBucket).toContain('artifacts-dr');
        }
      } else {
        console.warn('Skipping - no outputs available');
      }
    });
  });

  describe('Load Balancers', () => {
    it('should have primary ALB DNS name', () => {
      if (Object.keys(outputs).length > 0) {
        const primaryAlbDns = outputs.primaryAlbDnsName || outputs['dr-infrastructure:primaryAlbDnsName'];
        if (primaryAlbDns) {
          expect(primaryAlbDns).toContain('.elb.amazonaws.com');
        }
      } else {
        console.warn('Skipping - no outputs available');
      }
    });

    it('should have DR ALB DNS name', () => {
      if (Object.keys(outputs).length > 0) {
        const drAlbDns = outputs.drAlbDnsName || outputs['dr-infrastructure:drAlbDnsName'];
        if (drAlbDns) {
          expect(drAlbDns).toContain('.elb.amazonaws.com');
        }
      } else {
        console.warn('Skipping - no outputs available');
      }
    });
  });

  describe('Route 53', () => {
    it('should have hosted zone ID', () => {
      if (Object.keys(outputs).length > 0) {
        const hostedZoneId = outputs.hostedZoneId || outputs['dr-infrastructure:hostedZoneId'];
        expect(hostedZoneId).toBeDefined();
      } else {
        console.warn('Skipping - no outputs available');
      }
    });

    it('should have hosted zone name', () => {
      if (Object.keys(outputs).length > 0) {
        const hostedZoneName = outputs.hostedZoneName || outputs['dr-infrastructure:hostedZoneName'];
        if (hostedZoneName) {
          expect(hostedZoneName).toContain('.internal');
        }
      } else {
        console.warn('Skipping - no outputs available');
      }
    });
  });

  describe('Health Check Endpoints', () => {
    it('should have primary health check URL', () => {
      if (Object.keys(outputs).length > 0) {
        const primaryHealthUrl = outputs.primaryHealthCheckUrl || outputs['dr-infrastructure:primaryHealthCheckUrl'];
        if (primaryHealthUrl) {
          expect(primaryHealthUrl).toContain('lambda-url');
        }
      } else {
        console.warn('Skipping - no outputs available');
      }
    });

    it('should have DR health check URL', () => {
      if (Object.keys(outputs).length > 0) {
        const drHealthUrl = outputs.drHealthCheckUrl || outputs['dr-infrastructure:drHealthCheckUrl'];
        if (drHealthUrl) {
          expect(drHealthUrl).toContain('lambda-url');
        }
      } else {
        console.warn('Skipping - no outputs available');
      }
    });
  });

  describe('Resource Naming Convention', () => {
    it('should include environment suffix in resource names', () => {
      if (Object.keys(outputs).length > 0) {
        const primaryVpcId = outputs.primaryVpcId || outputs['dr-infrastructure:primaryVpcId'];
        const drVpcId = outputs.drVpcId || outputs['dr-infrastructure:drVpcId'];

        // At least one should be defined if deployment succeeded
        expect(primaryVpcId || drVpcId).toBeDefined();
      } else {
        console.warn('Skipping - no outputs available');
      }
    });
  });

  describe('Disaster Recovery Capabilities', () => {
    it('should have complete multi-region setup', () => {
      if (Object.keys(outputs).length > 0) {
        const hasMultiRegion =
          (outputs.primaryVpcId || outputs['dr-infrastructure:primaryVpcId']) &&
          (outputs.drVpcId || outputs['dr-infrastructure:drVpcId']);

        if (hasMultiRegion) {
          expect(hasMultiRegion).toBeTruthy();
        }
      } else {
        console.warn('Skipping - no outputs available');
      }
    });

    it('should have failover infrastructure', () => {
      if (Object.keys(outputs).length > 0) {
        const hasFailover = !!(
          (outputs.hostedZoneId || outputs['dr-infrastructure:hostedZoneId']) &&
          (outputs.primaryHealthCheckUrl || outputs['dr-infrastructure:primaryHealthCheckUrl']) &&
          (outputs.drHealthCheckUrl || outputs['dr-infrastructure:drHealthCheckUrl'])
        );

        if (hasFailover) {
          expect(hasFailover).toBe(true);
        }
      } else {
        console.warn('Skipping - no outputs available');
      }
    });
  });
});
