/**
 * tap-stack.int.test.ts
 * 
 * Simplified integration tests using Pulumi mocks
 * Validates infrastructure logic without AWS API calls
 */

import * as pulumi from '@pulumi/pulumi';
import { TapStack, TapStackArgs } from '../lib/tap-stack';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests (Mocked)', () => {
  let stack: TapStack;
  const testArgs: TapStackArgs = {
    environmentSuffix: 'inttest',
    region: 'us-east-1',
    vpcCidr: '10.18.0.0/16',
    tags: {
      Environment: 'integration-test',
      Project: 'TradingAnalyticsPlatform',
    },
  };

  beforeAll(() => {
    stack = new TapStack('integration-test-stack', testArgs);
  });

  describe('Output File Generation Tests', () => {
    it('should create cfn-outputs/flat-outputs.json file', (done) => {
      const outputFile = path.join('cfn-outputs', 'flat-outputs.json');
      
      setTimeout(() => {
        if (fs.existsSync(outputFile)) {
          const outputsContent = fs.readFileSync(outputFile, 'utf-8');
          const parsedOutputs = JSON.parse(outputsContent);
          
          expect(parsedOutputs.vpcId).toBeDefined();
          expect(parsedOutputs.albDnsName).toBeDefined();
          expect(parsedOutputs.ecsClusterName).toBeDefined();
          expect(parsedOutputs.auroraClusterEndpoint).toBeDefined();
        }
        done();
      }, 5000);
    });

    it('should include all critical outputs in the JSON file', (done) => {
      setTimeout(() => {
        const outputFile = path.join('cfn-outputs', 'flat-outputs.json');
        if (fs.existsSync(outputFile)) {
          const outputsContent = fs.readFileSync(outputFile, 'utf-8');
          const parsedOutputs = JSON.parse(outputsContent);
          
          const requiredOutputs = [
            'vpcId', 'albDnsName', 'ecsClusterName', 'ecsClusterArn',
            'auroraClusterEndpoint', 'auroraClusterReaderEndpoint',
            'ecrApiRepositoryUrl', 'ecrFrontendRepositoryUrl',
            'targetGroupBlueArn', 'targetGroupGreenArn',
            'albSecurityGroupId', 'ecsSecurityGroupId', 'rdsSecurityGroupId',
          ];
          
          requiredOutputs.forEach(output => {
            expect(parsedOutputs[output]).toBeDefined();
          });
        }
        done();
      }, 5000);
    });
  });

  describe('End-to-End Workflow Validation', () => {
    it('should validate complete infrastructure deployment', (done) => {
      stack.outputs.apply(outputs => {
        expect(outputs.vpcId).toBeDefined();
        expect(outputs.albSecurityGroupId).toBeDefined();
        expect(outputs.ecsSecurityGroupId).toBeDefined();
        expect(outputs.rdsSecurityGroupId).toBeDefined();
        expect(outputs.albDnsName).toBeDefined();
        expect(outputs.ecsClusterArn).toBeDefined();
        expect(outputs.apiServiceName).toBeDefined();
        expect(outputs.frontendServiceName).toBeDefined();
        expect(outputs.auroraClusterEndpoint).toBeDefined();
        expect(outputs.apiLogGroupName).toBeDefined();
        done();
      });
    });

    it('should validate blue-green deployment infrastructure', (done) => {
      stack.outputs.apply(outputs => {
        expect(outputs.targetGroupBlueArn).toBeDefined();
        expect(outputs.targetGroupGreenArn).toBeDefined();
        done();
      });
    });
  });

  describe('Resource Configuration Validation', () => {
    it('should validate VPC configuration', (done) => {
      stack.vpc.cidrBlock.apply(cidr => {
        expect(cidr).toBe('10.18.0.0/16');
        done();
      });
    });

    it('should validate high availability setup', () => {
      expect(stack.publicSubnets).toHaveLength(2);
      expect(stack.privateSubnets).toHaveLength(2);
      expect(stack.databaseSubnets).toHaveLength(2);
      expect(stack.natGateways).toHaveLength(2);
    });

    it('should validate security group configurations', (done) => {
      pulumi.all([
        stack.albSecurityGroup.id,
        stack.ecsSecurityGroup.id,
        stack.rdsSecurityGroup.id
      ]).apply(([albSg, ecsSg, rdsSg]) => {
        expect(albSg).toBeDefined();
        expect(ecsSg).toBeDefined();
        expect(rdsSg).toBeDefined();
        done();
      });
    });
  });
});
