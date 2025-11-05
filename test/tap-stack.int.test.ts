/* eslint-disable import/no-extraneous-dependencies */
/**
 * Integration Tests for Aurora DR Infrastructure
 *
 * These tests validate DEPLOYED AWS resources.
 * They will FAIL if infrastructure is not deployed.
 *
 * To deploy infrastructure:
 *   cdk deploy --all --region us-east-1
 *
 * Outputs are expected in: cfn-outputs/flat-outputs.json
 */
import fs from 'fs';

interface StackOutputs {
  ClusterEndpoint?: string;
  ProxyEndpoint?: string;
  GlobalClusterIdentifier?: string;
  StateMachineArnOutput?: string;
  AlertTopicArnOutput?: string;
}

// Helper function to load stack outputs
function loadStackOutputs(): StackOutputs | null {
  try {
    if (!fs.existsSync('cfn-outputs/flat-outputs.json')) {
      console.warn(
        '\n⚠️  Integration tests require deployed infrastructure.\n' +
          '   Deploy first: cdk deploy --all\n' +
          '   Then run: npm run test:integration\n'
      );
      return null;
    }

    const outputs = JSON.parse(
      fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
    );

    return outputs as StackOutputs;
  } catch (error) {
    console.error('Error loading stack outputs:', error);
    return null;
  }
}

describe('Aurora DR Integration Tests', () => {
  let outputs: StackOutputs | null;

  beforeAll(() => {
    outputs = loadStackOutputs();
    
    if (!outputs) {
      throw new Error(
        '\n❌ Integration tests REQUIRE deployed infrastructure!\n' +
        '   Deploy first: cdk deploy --all --context environmentSuffix=dev\n' +
        '   Then run: npm run test:integration\n'
      );
    }
  });

  describe('Aurora Global Database', () => {
    test('should have primary cluster endpoint', () => {
      expect(outputs).not.toBeNull();
      expect(outputs!.ClusterEndpoint).toBeDefined();
      expect(outputs!.ClusterEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });

    test('should have RDS Proxy endpoint', () => {
      expect(outputs).not.toBeNull();
      expect(outputs!.ProxyEndpoint).toBeDefined();
      expect(outputs!.ProxyEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });

    test('should have global cluster identifier', () => {
      expect(outputs).not.toBeNull();
      expect(outputs!.GlobalClusterIdentifier).toBeDefined();
      expect(outputs!.GlobalClusterIdentifier).toContain('aurora-dr-global');
    });
  });

  // Note: Failover Automation tests skipped - FailoverStack is commented out in tap-stack.ts
  // Uncomment these tests when FailoverStack is enabled
  /*
  describe('Failover Automation', () => {
    test('should have Step Functions state machine ARN', () => {
      expect(outputs).not.toBeNull();
      expect(outputs!.StateMachineArnOutput).toBeDefined();
      expect(outputs!.StateMachineArnOutput).toMatch(/^arn:aws:states:/);
    });

    test('should have SNS topic ARN for alerts', () => {
      expect(outputs).not.toBeNull();
      expect(outputs!.AlertTopicArnOutput).toBeDefined();
      expect(outputs!.AlertTopicArnOutput).toMatch(/^arn:aws:sns:/);
    });
  });
  */
});
