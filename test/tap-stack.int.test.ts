import * as fs from 'fs';
import * as path from 'path';
import * as childProcess from 'child_process';
import * as util from 'util';

const exec = util.promisify(childProcess.exec);

describe('TAP Stack Integration Tests', () => {
  let outputs: Record<string, any> = {};

  beforeAll(async () => {
    try {
      // Try to get outputs from synthesized JSON
      const stacksPath = path.join(__dirname, '..', 'cdktf.out', 'stacks');
      
      if (fs.existsSync(stacksPath)) {
        const stackDirs = fs.readdirSync(stacksPath);
        for (const stackDir of stackDirs) {
          const outputPath = path.join(stacksPath, stackDir, 'cdk.tf.json');
          if (fs.existsSync(outputPath)) {
            const tfConfig = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
            if (tfConfig.output) {
              outputs = { ...outputs, ...tfConfig.output };
            }
          }
        }
      }

      // If no outputs found in files, try CLI
      if (Object.keys(outputs).length === 0) {
        try {
          const { stdout } = await exec('cdktf output --json');
          outputs = JSON.parse(stdout);
        } catch (cliError) {
          console.warn('Failed to get outputs via CLI:', cliError);
        }
      }
    } catch (error) {
      console.warn('Error getting outputs:', error);
    }
  });

  describe('Infrastructure Deployment Validation', () => {
    test('should have deployment outputs available', () => {
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('should have VPC IDs in outputs', () => {
      const vpcOutputs = Object.entries(outputs)
        .filter(([key]) => key.includes('VpcId'))
        .map(([, value]) => value?.value);
      
      expect(vpcOutputs.length).toBeGreaterThan(0);
      vpcOutputs.forEach(vpcId => {
        expect(vpcId).toMatch(/^vpc-/);
      });
    });

    test('should have ALB DNS names in outputs', () => {
      const albOutputs = Object.entries(outputs)
        .filter(([key]) => key.includes('AlbDnsName'))
        .map(([, value]) => value?.value);
      
      expect(albOutputs.length).toBeGreaterThan(0);
      albOutputs.forEach(dnsName => {
        expect(dnsName).toContain('elb.amazonaws.com');
      });
    });

    test('should have RDS endpoints in outputs', () => {
      const rdsOutputs = Object.entries(outputs)
        .filter(([key]) => key.includes('RdsEndpoint'))
        .map(([, value]) => value?.value);
      
      expect(rdsOutputs.length).toBeGreaterThan(0);
      rdsOutputs.forEach(endpoint => {
        expect(endpoint).toContain('rds.amazonaws.com');
      });
    });
  });

  describe('Multi-region Deployment', () => {
    test('should have resources in us-east-1 region', () => {
      const regionOutputs = Object.entries(outputs)
        .filter(([key]) => key.includes('us-east-1'))
        .map(([, value]) => value?.value);
      
      expect(regionOutputs.length).toBeGreaterThan(0);
    });

    test('should have resources in us-west-2 region', () => {
      const regionOutputs = Object.entries(outputs)
        .filter(([key]) => key.includes('us-west-2'))
        .map(([, value]) => value?.value);
      
      expect(regionOutputs.length).toBeGreaterThan(0);
    });
  });
});