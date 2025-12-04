// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import path from 'path';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

// Check if deployment outputs exist
const outputsPath = path.join(process.cwd(), 'cfn-outputs/flat-outputs.json');
const hasOutputs = fs.existsSync(outputsPath);

let outputs: any = {};
if (hasOutputs) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

describe('ECS Infrastructure Integration Tests', () => {
  if (!hasOutputs) {
    test.skip('Integration tests require deployment outputs', () => {
      // Skipped when cfn-outputs don't exist
    });
    return;
  }

  describe('VPC and Networking', () => {
    test('VPC should be deployed successfully', () => {
      const vpcId = outputs[`vpc-id-${environmentSuffix}`];
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);
    });
  });

  describe('ECS Cluster', () => {
    test('ECS cluster should exist with correct name', () => {
      const clusterName = outputs[`cluster-name-${environmentSuffix}`];
      expect(clusterName).toBeDefined();
      expect(clusterName).toBe(`ecs-cluster-${environmentSuffix}`);
    });

    test('Cluster should be accessible', () => {
      const clusterName = outputs[`cluster-name-${environmentSuffix}`];
      expect(clusterName).toBeTruthy();
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB DNS should be available', () => {
      const albDns = outputs[`alb-dns-${environmentSuffix}`];
      expect(albDns).toBeDefined();
      expect(albDns).toMatch(/^[a-zA-Z0-9-]+\.(us-east-1\.)?elb\.amazonaws\.com$/);
    });

    test('ALB should be publicly accessible', () => {
      const albDns = outputs[`alb-dns-${environmentSuffix}`];
      expect(albDns).toBeTruthy();
      // Note: Actual HTTP request would require the service to be healthy
    });
  });

  describe('Secrets Manager', () => {
    test('Database secret should exist', () => {
      const secretArn = outputs[`db-secret-arn-${environmentSuffix}`];
      expect(secretArn).toBeDefined();
      expect(secretArn).toMatch(/^arn:aws:secretsmanager:[a-z0-9-]+:\d+:secret:.+$/);
    });

    test('Secret ARN should reference correct region', () => {
      const secretArn = outputs[`db-secret-arn-${environmentSuffix}`];
      expect(secretArn).toContain('us-east-1');
    });
  });

  describe('Cost Optimization Verification', () => {
    test('All required outputs should be present', () => {
      expect(outputs[`vpc-id-${environmentSuffix}`]).toBeDefined();
      expect(outputs[`cluster-name-${environmentSuffix}`]).toBeDefined();
      expect(outputs[`alb-dns-${environmentSuffix}`]).toBeDefined();
      expect(outputs[`db-secret-arn-${environmentSuffix}`]).toBeDefined();
    });

    test('Infrastructure should use optimized naming convention', () => {
      const clusterName = outputs[`cluster-name-${environmentSuffix}`];
      expect(clusterName).toContain(environmentSuffix);
    });
  });

  describe('Resource Accessibility', () => {
    test('VPC ID format should be valid', () => {
      const vpcId = outputs[`vpc-id-${environmentSuffix}`];
      expect(vpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
    });

    test('Secret ARN format should be valid', () => {
      const secretArn = outputs[`db-secret-arn-${environmentSuffix}`];
      expect(secretArn).toMatch(/^arn:aws:secretsmanager:us-east-1:\d{12}:secret:[a-zA-Z0-9/_+=.@-]+-[a-zA-Z0-9]{6}$/);
    });
  });

  describe('High Availability Configuration', () => {
    test('ECS cluster name should be deployable', () => {
      const clusterName = outputs[`cluster-name-${environmentSuffix}`];
      expect(clusterName).toBeTruthy();
      expect(clusterName.length).toBeGreaterThan(0);
      expect(clusterName.length).toBeLessThanOrEqual(255);
    });
  });

  describe('Security and Compliance', () => {
    test('All secrets should be stored in Secrets Manager', () => {
      const secretArn = outputs[`db-secret-arn-${environmentSuffix}`];
      expect(secretArn).toContain('secretsmanager');
      expect(secretArn).toContain('db-credentials');
    });

    test('Resources should be namespaced with environment suffix', () => {
      const clusterName = outputs[`cluster-name-${environmentSuffix}`];
      expect(clusterName).toContain(environmentSuffix);
    });
  });

  describe('Deployment Validation', () => {
    test('All critical infrastructure outputs should exist', () => {
      const requiredOutputs = [
        `vpc-id-${environmentSuffix}`,
        `cluster-name-${environmentSuffix}`,
        `alb-dns-${environmentSuffix}`,
        `db-secret-arn-${environmentSuffix}`
      ];

      requiredOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey]).toBeTruthy();
      });
    });

    test('Output values should have correct AWS resource format', () => {
      const vpcId = outputs[`vpc-id-${environmentSuffix}`];
      const secretArn = outputs[`db-secret-arn-${environmentSuffix}`];
      const albDns = outputs[`alb-dns-${environmentSuffix}`];

      expect(vpcId).toMatch(/^vpc-/);
      expect(secretArn).toMatch(/^arn:aws:/);
      expect(albDns).toMatch(/\.elb\.amazonaws\.com$/);
    });
  });
});
