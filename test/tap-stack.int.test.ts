// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || outputs.EnvironmentSuffix || 'dev';

describe('Turn Around Prompt API Integration Tests', () => {
  test('TapStack outputs should be available', () => {
    expect(outputs.SecretArn).toBeDefined();
    expect(outputs.ALBDNSName).toBeDefined();
    expect(outputs.EnvironmentSuffix).toBeDefined();
  });

  test('ALB DNS name should include environment suffix', () => {
    expect(outputs.ALBDNSName).toContain(environmentSuffix);
  });

  test('Secret ARN should be valid', () => {
    expect(outputs.SecretArn).toMatch(/^arn:aws:secretsmanager:/);
  });

  test('VPC ID should be valid', () => {
    expect(outputs.VPCId).toMatch(/^vpc-/);
  });

  test('ECS Cluster name should include environment suffix', () => {
    expect(outputs.ECSClusterName).toContain(environmentSuffix);
  });
});
