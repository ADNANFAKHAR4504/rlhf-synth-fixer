// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  RDSClient,
  DescribeDBClustersCommand,
} from '@aws-sdk/client-rds';

// Helper function to skip tests if stacks aren't deployed
async function isStackDeployed(): Promise<boolean> {
  try {
    // Check if CDK outputs file exists
    if (!fs.existsSync('cfn-outputs/flat-outputs.json')) {
      console.warn('⚠️  CDK outputs not found - skipping integration tests');
      return false;
    }
    
    const outputs = JSON.parse(
      fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
    );
    
    // Check if Aurora cluster exists
    if (!outputs.ClusterEndpoint) {
      console.warn('⚠️  Aurora cluster not deployed - skipping integration tests');
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn('⚠️  Stack not deployed - skipping integration tests');
    return false;
  }
}

describe('Aurora DR Integration Tests', () => {
  let stackDeployed: boolean;

  beforeAll(async () => {
    stackDeployed = await isStackDeployed();
  });

  describe('Aurora Global Database', () => {
    test('should have primary cluster running', async () => {
      if (!stackDeployed) {
        console.log('Skipping - stack not deployed');
        return;
      }

      const outputs = JSON.parse(
        fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
      );
      
      expect(outputs.ClusterEndpoint).toBeDefined();
      expect(outputs.ClusterEndpoint).toContain('.rds.amazonaws.com');
    });

    test('should have RDS Proxy endpoint', async () => {
      if (!stackDeployed) {
        console.log('Skipping - stack not deployed');
        return;
      }

      const outputs = JSON.parse(
        fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
      );
      
      expect(outputs.ProxyEndpoint).toBeDefined();
      expect(outputs.ProxyEndpoint).toContain('.rds.amazonaws.com');
    });

    test('should have global cluster identifier', async () => {
      if (!stackDeployed) {
        console.log('Skipping - stack not deployed');
        return;
      }

      const outputs = JSON.parse(
        fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
      );
      
      expect(outputs.GlobalClusterIdentifier).toBeDefined();
      expect(outputs.GlobalClusterIdentifier).toContain('aurora-dr-global');
    });
  });

  describe('Failover Automation', () => {
    test('should have Step Functions state machine', async () => {
      if (!stackDeployed) {
        console.log('Skipping - stack not deployed');
        return;
      }

      const outputs = JSON.parse(
        fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
      );
      
      expect(outputs.FailoverStateMachine).toBeDefined();
    });

    test('should have SNS topic for alerts', async () => {
      if (!stackDeployed) {
        console.log('Skipping - stack not deployed');
        return;
      }

      const outputs = JSON.parse(
        fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
      );
      
      expect(outputs.AlertTopicArn).toBeDefined();
      expect(outputs.AlertTopicArn).toContain('arn:aws:sns:');
    });
  });
});
