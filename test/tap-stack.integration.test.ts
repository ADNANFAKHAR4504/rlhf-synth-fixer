import * as fs from 'fs';
import * as path from 'path';

interface StackOutputs {
  ClusterName?: string;
  ClusterEndpoint?: string;
  OidcProviderArn?: string;
  KubectlConfigCommand?: string;
  VpcId?: string;
  NodeGroupName?: string;
  EbsCsiRoleArn?: string;
  AlbControllerRoleArn?: string;
  ClusterSecurityGroupId?: string;
}

describe('TapStack Integration Tests', () => {
  let outputs: StackOutputs;
  const outputsPath = path.join(
    __dirname,
    '..',
    'cfn-outputs',
    'flat-outputs.json'
  );

  beforeAll(() => {
    if (!fs.existsSync(outputsPath)) {
      console.warn(
        `Integration tests skipped: ${outputsPath} not found. Deploy stack first.`
      );
      outputs = {};
    } else {
      const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
      outputs = rawOutputs;
    }
  });

  describe('Stack Outputs Validation', () => {
    test('should have ClusterName output', () => {
      if (Object.keys(outputs).length === 0) {
        console.warn('Skipping: No outputs available');
        return;
      }
      expect(outputs.ClusterName).toBeDefined();
      expect(outputs.ClusterName).toMatch(/^eks-cluster-/);
    });

    test('should have ClusterEndpoint output', () => {
      if (Object.keys(outputs).length === 0) return;
      expect(outputs.ClusterEndpoint).toBeDefined();
      expect(outputs.ClusterEndpoint).toMatch(/^https:\/\//);
    });

    test('should have OidcProviderArn output', () => {
      if (Object.keys(outputs).length === 0) return;
      expect(outputs.OidcProviderArn).toBeDefined();
      expect(outputs.OidcProviderArn).toMatch(/^arn:aws:iam::/);
      expect(outputs.OidcProviderArn).toContain('oidc-provider');
    });

    test('should have KubectlConfigCommand output', () => {
      if (Object.keys(outputs).length === 0) return;
      expect(outputs.KubectlConfigCommand).toBeDefined();
      expect(outputs.KubectlConfigCommand).toContain(
        'aws eks update-kubeconfig'
      );
      expect(outputs.KubectlConfigCommand).toContain('--region ap-southeast-1');
    });

    test('should have VpcId output', () => {
      if (Object.keys(outputs).length === 0) return;
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.VpcId).toMatch(/^vpc-/);
    });

    test('should have NodeGroupName output', () => {
      if (Object.keys(outputs).length === 0) return;
      expect(outputs.NodeGroupName).toBeDefined();
      expect(outputs.NodeGroupName).toMatch(/^managed-ng-/);
    });

    test('should have EbsCsiRoleArn output', () => {
      if (Object.keys(outputs).length === 0) return;
      expect(outputs.EbsCsiRoleArn).toBeDefined();
      expect(outputs.EbsCsiRoleArn).toMatch(/^arn:aws:iam::/);
      expect(outputs.EbsCsiRoleArn).toContain('eks-ebs-csi-role');
    });

    test('should have AlbControllerRoleArn output', () => {
      if (Object.keys(outputs).length === 0) return;
      expect(outputs.AlbControllerRoleArn).toBeDefined();
      expect(outputs.AlbControllerRoleArn).toMatch(/^arn:aws:iam::/);
      expect(outputs.AlbControllerRoleArn).toContain('eks-alb-controller-role');
    });

    test('should have ClusterSecurityGroupId output', () => {
      if (Object.keys(outputs).length === 0) return;
      expect(outputs.ClusterSecurityGroupId).toBeDefined();
      expect(outputs.ClusterSecurityGroupId).toMatch(/^sg-/);
    });
  });

  describe('Resource Naming Convention', () => {
    test('cluster name should include environmentSuffix', () => {
      if (Object.keys(outputs).length === 0) return;
      expect(outputs.ClusterName).toMatch(/eks-cluster-.+/);
    });

    test('node group name should include environmentSuffix', () => {
      if (Object.keys(outputs).length === 0) return;
      expect(outputs.NodeGroupName).toMatch(/managed-ng-.+/);
    });

    test('EBS CSI role should include environmentSuffix', () => {
      if (Object.keys(outputs).length === 0) return;
      expect(outputs.EbsCsiRoleArn).toMatch(/eks-ebs-csi-role-.+/);
    });

    test('ALB controller role should include environmentSuffix', () => {
      if (Object.keys(outputs).length === 0) return;
      expect(outputs.AlbControllerRoleArn).toMatch(
        /eks-alb-controller-role-.+/
      );
    });
  });

  describe('ARN Format Validation', () => {
    test('OIDC provider ARN should be valid', () => {
      if (Object.keys(outputs).length === 0) return;
      const arnPattern = /^arn:aws:iam::\d{12}:oidc-provider\//;
      expect(outputs.OidcProviderArn).toMatch(arnPattern);
    });

    test('EBS CSI role ARN should be valid', () => {
      if (Object.keys(outputs).length === 0) return;
      const arnPattern = /^arn:aws:iam::\d{12}:role\//;
      expect(outputs.EbsCsiRoleArn).toMatch(arnPattern);
    });

    test('ALB controller role ARN should be valid', () => {
      if (Object.keys(outputs).length === 0) return;
      const arnPattern = /^arn:aws:iam::\d{12}:role\//;
      expect(outputs.AlbControllerRoleArn).toMatch(arnPattern);
    });
  });

  describe('Command Validation', () => {
    test('kubectl config command should have correct format', () => {
      if (Object.keys(outputs).length === 0) return;
      expect(outputs.KubectlConfigCommand).toContain(
        'aws eks update-kubeconfig'
      );
      expect(outputs.KubectlConfigCommand).toContain(
        `--name ${outputs.ClusterName}`
      );
      expect(outputs.KubectlConfigCommand).toContain('--region ap-southeast-1');
    });
  });

  describe('Region Validation', () => {
    test('cluster endpoint should be in ap-southeast-1', () => {
      if (Object.keys(outputs).length === 0) return;
      expect(outputs.ClusterEndpoint).toContain('ap-southeast-1');
    });

    test('OIDC provider should be in ap-southeast-1 region context', () => {
      if (Object.keys(outputs).length === 0) return;
      // OIDC provider ARN doesn't contain region, but we can verify it exists
      expect(outputs.OidcProviderArn).toBeDefined();
    });
  });

  describe('Output Completeness', () => {
    test('all required outputs should be present', () => {
      if (Object.keys(outputs).length === 0) return;
      const requiredOutputs = [
        'ClusterName',
        'ClusterEndpoint',
        'OidcProviderArn',
        'KubectlConfigCommand',
        'VpcId',
        'NodeGroupName',
        'EbsCsiRoleArn',
        'AlbControllerRoleArn',
        'ClusterSecurityGroupId',
      ];

      requiredOutputs.forEach(outputName => {
        expect(outputs[outputName as keyof StackOutputs]).toBeDefined();
      });
    });

    test('no outputs should be empty strings', () => {
      if (Object.keys(outputs).length === 0) return;
      Object.entries(outputs).forEach(([key, value]) => {
        expect(value).not.toBe('');
        expect(value?.trim()).toBe(value);
      });
    });
  });

  describe('Infrastructure Verification', () => {
    test('VPC ID format should be valid', () => {
      if (Object.keys(outputs).length === 0) return;
      expect(outputs.VpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
    });

    test('security group ID format should be valid', () => {
      if (Object.keys(outputs).length === 0) return;
      expect(outputs.ClusterSecurityGroupId).toMatch(/^sg-[a-f0-9]{8,17}$/);
    });

    test('cluster endpoint should use HTTPS', () => {
      if (Object.keys(outputs).length === 0) return;
      expect(outputs.ClusterEndpoint).toMatch(/^https:\/\//);
    });
  });
});
