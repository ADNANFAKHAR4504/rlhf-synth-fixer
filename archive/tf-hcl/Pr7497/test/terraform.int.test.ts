// test/tap_stack.int.test.ts
// Integration tests for tap stack based on cfn-outputs/flat-outputs.json only

import { readFileSync, existsSync } from 'fs';
import path from 'path';

describe('tap stack - Integration Tests', () => {
  let outputs: any;
  let outputsExist = false;

  beforeAll(() => {
    const outPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    outputsExist = existsSync(outPath);
    if (outputsExist) {
      const raw = readFileSync(outPath, 'utf8');
      outputs = JSON.parse(raw);
    }
  });

  const withOutputs = (fn: () => void) => {
    if (!outputsExist) {
      expect(true).toBe(true);
      return;
    }
    fn();
  };

  describe('presence and basic shape', () => {
    test('outputs file exists and parses', () => {
      expect(outputsExist).toBe(true);
      if (outputsExist) {
        expect(typeof outputs).toBe('object');
      }
    });

    test('has all expected keys', () => {
      withOutputs(() => {
        [
          'aws_load_balancer_controller_role_arn',
          'configure_kubectl',
          'eks_cluster_certificate_authority',
          'eks_cluster_endpoint',
          'eks_cluster_name',
          'eks_cluster_version',
          'eks_oidc_provider_arn',
          'karpenter_installation_status',
          'karpenter_role_arn',
          'private_subnet_ids',
          'public_subnet_ids',
          'vpc_id',
        ].forEach(key => expect(outputs).toHaveProperty(key));
      });
    });
  });

  describe('cluster identity outputs', () => {
    test('EKS cluster name and version match expected values', () => {
      withOutputs(() => {
        expect(outputs.eks_cluster_name).toBe('eks-cluster-dev');
        expect(outputs.eks_cluster_version).toBe('1.29');
      });
    });

    test('kubectl config command matches cluster name and region', () => {
      withOutputs(() => {
        const cmd: string = outputs.configure_kubectl;
        expect(cmd).toContain('aws eks update-kubeconfig');
        expect(cmd).toContain('--region us-east-1');
        expect(cmd).toContain('--name eks-cluster-dev');
      });
    });

    test('cluster endpoint looks like a valid EKS endpoint in us-east-1', () => {
      withOutputs(() => {
        const endpoint: string = outputs.eks_cluster_endpoint;
        const lower = endpoint.toLowerCase();
        expect(lower).toContain('eks.amazonaws.com');
        expect(lower).toContain('us-east-1');
      });
    });

    test('cluster certificate authority is a long base64-like string', () => {
      withOutputs(() => {
        const ca: string = outputs.eks_cluster_certificate_authority;
        expect(typeof ca).toBe('string');
        expect(ca.length).toBeGreaterThan(100);
      });
    });
  });

  describe('OIDC and roles', () => {
    test('EKS OIDC provider ARN matches expected prefix and region', () => {
      withOutputs(() => {
        const arn: string = outputs.eks_oidc_provider_arn;
        expect(arn).toContain('oidc.eks.us-east-1.amazonaws.com/id/');
        expect(arn).toMatch(/^arn:aws:iam::[0-9*]+:oidc-provider\//);
      });
    });

    test('Karpenter and ALB controller roles are IAM role ARNs', () => {
      withOutputs(() => {
        const karp: string = outputs.karpenter_role_arn;
        const alb: string = outputs.aws_load_balancer_controller_role_arn;
        expect(karp).toMatch(/^arn:aws:iam::[0-9*]+:role\//);
        expect(alb).toMatch(/^arn:aws:iam::[0-9*]+:role\//);
      });
    });

    test('karpenter_installation_status contains friendly status message', () => {
      withOutputs(() => {
        const status: string = outputs.karpenter_installation_status;
        expect(status.toLowerCase()).toContain('karpenter');
        expect(status.toLowerCase()).toContain('installed');
      });
    });
  });

  describe('network outputs', () => {
    test('vpc_id looks like a valid VPC ID', () => {
      withOutputs(() => {
        expect(outputs.vpc_id).toMatch(/^vpc-[0-9a-f]+$/);
      });
    });

    test('public and private subnet IDs are JSON arrays with 3 subnet-* each', () => {
      withOutputs(() => {
        const priv = JSON.parse(outputs.private_subnet_ids) as string[];
        const pub = JSON.parse(outputs.public_subnet_ids) as string[];
        expect(Array.isArray(priv)).toBe(true);
        expect(Array.isArray(pub)).toBe(true);
        expect(priv.length).toBe(3);
        expect(pub.length).toBe(3);
        priv.forEach(id => expect(id).toMatch(/^subnet-/));
        pub.forEach(id => expect(id).toMatch(/^subnet-/));
      });
    });
  });

  describe('general sanity', () => {
    test('all outputs are non-empty', () => {
      withOutputs(() => {
        Object.values(outputs).forEach(v => {
          expect(typeof v).toBe('string');
          expect((v as string).length).toBeGreaterThan(0);
        });
      });
    });

    test('no obvious error markers in outputs JSON', () => {
      withOutputs(() => {
        const all = JSON.stringify(outputs).toLowerCase();
        expect(all).not.toContain('error');
        expect(all).not.toContain('failed');
      });
    });
  });
});
