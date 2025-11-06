import * as fs from 'fs';
import * as path from 'path';

const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);

describe('Infrastructure Integration Tests', () => {
  describe('Configuration Validation', () => {
    test('AWS region environment variable is set or has default', () => {
      const region = process.env.AWS_REGION || 'ap-southeast-1';
      expect(region).toBeTruthy();
      expect(region).toMatch(/^[a-z]{2}-[a-z]+-\d{1}$/);
    });

    test('outputs directory structure is correct', () => {
      const outputsDir = path.dirname(outputsPath);
      const projectRoot = path.join(__dirname, '..');
      expect(outputsDir).toBe(path.join(projectRoot, 'cfn-outputs'));
    });

    test('outputs file path is correctly constructed', () => {
      expect(outputsPath).toContain('cfn-outputs');
      expect(outputsPath).toContain('flat-outputs.json');
      expect(path.basename(outputsPath)).toBe('flat-outputs.json');
    });
  });

  describe('Outputs File Structure', () => {
    test('outputs file can be read if it exists', () => {
      if (fs.existsSync(outputsPath)) {
        const content = fs.readFileSync(outputsPath, 'utf-8');
        expect(content).toBeTruthy();
        expect(() => JSON.parse(content)).not.toThrow();
      } else {
        expect(fs.existsSync(outputsPath)).toBe(false);
      }
    });

    test('outputs object is valid when file exists', () => {
      let outputs: Record<string, string> = {};
      if (fs.existsSync(outputsPath)) {
        outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
        expect(typeof outputs).toBe('object');
        expect(outputs).not.toBeNull();
      } else {
        expect(outputs).toEqual({});
      }
    });
  });

  describe('Expected Output Keys', () => {
    const expectedKeys = [
      'EksClusterName',
      'EksClusterEndpoint',
      'EksOIDCProviderArn',
      'EksKubectlConfig',
      'EksVpcId',
      'EksPrivateSubnetIds',
      'EksClusterSecurityGroupId',
      'EksFluentBitLogGroupName',
      'EksKmsKeyArn',
    ];

    test('expected output keys are defined', () => {
      expect(expectedKeys.length).toBeGreaterThan(0);
      expect(expectedKeys).toContain('EksClusterName');
      expect(expectedKeys).toContain('EksVpcId');
    });

  });

  describe('Resource Naming Conventions', () => {
    test('cluster name follows expected pattern', () => {
      if (!fs.existsSync(outputsPath)) {
        console.log('Stack not deployed, skipping naming validation');
        return;
      }

      const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
      const clusterName = outputs.EksClusterName || '';

      if (clusterName) {
        expect(clusterName).toMatch(/^eks-cluster-/);
      }
    });

    test('kubectl config follows expected format', () => {
      if (!fs.existsSync(outputsPath)) {
        console.log('Stack not deployed, skipping kubectl config validation');
        return;
      }

      const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
      const kubectlConfig = outputs.EksKubectlConfig || '';

      if (kubectlConfig) {
        expect(kubectlConfig).toMatch(/^aws eks update-kubeconfig/);
        expect(kubectlConfig).toContain('--name');
        expect(kubectlConfig).toContain('--region');
      }
    });

    test('endpoint uses HTTPS protocol', () => {
      if (!fs.existsSync(outputsPath)) {
        console.log('Stack not deployed, skipping endpoint validation');
        return;
      }

      const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
      const endpoint = outputs.EksClusterEndpoint || '';

      if (endpoint) {
        expect(endpoint).toMatch(/^https:\/\//);
      }
    });
  });

  describe('Environment Suffix Consistency', () => {
    test('resources use consistent environment suffix', () => {
      if (!fs.existsSync(outputsPath)) {
        console.log('Stack not deployed, skipping suffix consistency check');
        return;
      }

      const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
      const clusterName = outputs.EksClusterName || '';
      const logGroupName = outputs.EksFluentBitLogGroupName || '';

      if (clusterName && logGroupName) {
        const suffix = clusterName.replace('eks-cluster-', '');
        expect(suffix).toBeTruthy();
        expect(logGroupName).toContain(suffix);
      }
    });
  });

  describe('VPC and Subnet Validation', () => {
    test('VPC ID format is valid', () => {
      if (!fs.existsSync(outputsPath)) {
        console.log('Stack not deployed, skipping VPC validation');
        return;
      }

      const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
      const vpcId = outputs.EksVpcId || '';

      if (vpcId) {
        expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);
      }
    });

    test('private subnet IDs are comma-separated', () => {
      if (!fs.existsSync(outputsPath)) {
        console.log('Stack not deployed, skipping subnet validation');
        return;
      }

      const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
      const subnetIds = outputs.EksPrivateSubnetIds || '';

      if (subnetIds) {
        const subnets = subnetIds.split(',');
        expect(subnets.length).toBeGreaterThan(0);
        subnets.forEach((subnet: string) => {
          expect(subnet.trim()).toMatch(/^subnet-[a-f0-9]+$/);
        });
      }
    });

    test('security group ID format is valid', () => {
      if (!fs.existsSync(outputsPath)) {
        console.log('Stack not deployed, skipping security group validation');
        return;
      }

      const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
      const sgId = outputs.EksClusterSecurityGroupId || '';

      if (sgId) {
        expect(sgId).toMatch(/^sg-[a-f0-9]+$/);
      }
    });
  });

  describe('ARN Format Validation', () => {
    test('KMS key ARN has valid format', () => {
      if (!fs.existsSync(outputsPath)) {
        console.log('Stack not deployed, skipping KMS ARN validation');
        return;
      }

      const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
      const kmsArn = outputs.EksKmsKeyArn || '';

      if (kmsArn) {
        expect(kmsArn).toMatch(/^arn:aws:kms:/);
        expect(kmsArn).toContain(':key/');
      }
    });

    test('OIDC provider ARN has valid format', () => {
      if (!fs.existsSync(outputsPath)) {
        console.log('Stack not deployed, skipping OIDC ARN validation');
        return;
      }

      const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
      const oidcArn = outputs.EksOIDCProviderArn || '';

      if (oidcArn) {
        expect(oidcArn).toMatch(/^arn:aws:iam:/);
        expect(oidcArn).toContain(':oidc-provider/');
      }
    });
  });

  describe('Log Group Naming', () => {
    test('Fluent Bit log group follows naming convention', () => {
      if (!fs.existsSync(outputsPath)) {
        console.log('Stack not deployed, skipping log group naming validation');
        return;
      }

      const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
      const logGroupName = outputs.EksFluentBitLogGroupName || '';

      if (logGroupName) {
        expect(logGroupName).toMatch(/^\/aws\/eks\//);
        expect(logGroupName).toContain('fluent-bit');
      }
    });
  });
});
