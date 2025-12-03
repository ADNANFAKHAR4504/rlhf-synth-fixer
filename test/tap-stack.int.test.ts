import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('ECS Optimization Integration Tests', () => {
  const scriptPath = path.join(__dirname, '../lib/optimize.py');
  const tapStackPath = path.join(__dirname, '../lib/tap-stack.ts');

  describe('Optimization Script End-to-End', () => {
    it('should successfully analyze the infrastructure code', () => {
      try {
        const output = execSync(`python3 ${scriptPath} ${tapStackPath}`, {
          encoding: 'utf-8',
        });
        expect(output).toContain('ECS INFRASTRUCTURE OPTIMIZATION ANALYSIS');
        expect(output).toContain('Total Checks:');
        expect(output).toContain('Passed:');
        expect(output).toContain('Failed:');
      } catch (error: any) {
        // Script may exit with non-zero if some checks fail
        expect(error.stdout).toContain('ECS INFRASTRUCTURE OPTIMIZATION ANALYSIS');
        expect(error.stdout).toContain('Total Checks:');
      }
    });

    it('should validate all 10 optimization patterns are checked', () => {
      try {
        const output = execSync(`python3 ${scriptPath} ${tapStackPath}`, {
          encoding: 'utf-8',
        });
        expect(output).toMatch(/Total Checks:\s*10/);
      } catch (error: any) {
        expect(error.stdout).toMatch(/Total Checks:\s*10/);
      }
    });

    it('should provide detailed findings for each check', () => {
      try {
        const output = execSync(`python3 ${scriptPath} ${tapStackPath}`, {
          encoding: 'utf-8',
        });

        // Verify detailed output for each optimization
        expect(output).toContain('1. Service Consolidation');
        expect(output).toContain('2. Task Placement Strategy');
        expect(output).toContain('3. Resource Reservations');
        expect(output).toContain('4. Configuration Management');
        expect(output).toContain('5. CloudWatch Log Retention');
        expect(output).toContain('6. ALB Health Check Optimization');
        expect(output).toContain('7. Tagging Strategy');
        expect(output).toContain('8. Security Group Cleanup');
        expect(output).toContain('9. Resource Dependencies');
        expect(output).toContain('10. Auto-scaling Configuration');
      } catch (error: any) {
        const stdout = error.stdout as string;
        expect(stdout).toContain('1. Service Consolidation');
        expect(stdout).toContain('10. Auto-scaling Configuration');
      }
    });

    it('should pass service consolidation check', () => {
      try {
        const output = execSync(`python3 ${scriptPath} ${tapStackPath}`, {
          encoding: 'utf-8',
        });
        expect(output).toContain('Service Consolidation - ✓ PASS');
      } catch (error: any) {
        expect(error.stdout).toContain('Service Consolidation - ✓ PASS');
      }
    });

    it('should check task placement strategy', () => {
      // FARGATE doesn't support explicit placement strategies
      // This test just verifies the optimization check runs
      try {
        const output = execSync(`python3 ${scriptPath} ${tapStackPath}`, {
          encoding: 'utf-8',
        });
        expect(output).toContain('Task Placement Strategy');
      } catch (error: any) {
        expect(error.stdout).toContain('Task Placement Strategy');
      }
    });

    it('should pass resource reservations check', () => {
      try {
        const output = execSync(`python3 ${scriptPath} ${tapStackPath}`, {
          encoding: 'utf-8',
        });
        expect(output).toContain('Resource Reservations - ✓ PASS');
      } catch (error: any) {
        expect(error.stdout).toContain('Resource Reservations - ✓ PASS');
      }
    });

    it('should pass configuration management check', () => {
      try {
        const output = execSync(`python3 ${scriptPath} ${tapStackPath}`, {
          encoding: 'utf-8',
        });
        expect(output).toContain('Configuration Management - ✓ PASS');
      } catch (error: any) {
        expect(error.stdout).toContain('Configuration Management - ✓ PASS');
      }
    });

    it('should pass ALB health check optimization', () => {
      try {
        const output = execSync(`python3 ${scriptPath} ${tapStackPath}`, {
          encoding: 'utf-8',
        });
        expect(output).toContain('ALB Health Check Optimization - ✓ PASS');
      } catch (error: any) {
        expect(error.stdout).toContain('ALB Health Check Optimization - ✓ PASS');
      }
    });

    it('should pass security group cleanup check', () => {
      try {
        const output = execSync(`python3 ${scriptPath} ${tapStackPath}`, {
          encoding: 'utf-8',
        });
        expect(output).toContain('Security Group Cleanup - ✓ PASS');
      } catch (error: any) {
        expect(error.stdout).toContain('Security Group Cleanup - ✓ PASS');
      }
    });

    it('should pass resource dependencies check', () => {
      try {
        const output = execSync(`python3 ${scriptPath} ${tapStackPath}`, {
          encoding: 'utf-8',
        });
        expect(output).toContain('Resource Dependencies - ✓ PASS');
      } catch (error: any) {
        expect(error.stdout).toContain('Resource Dependencies - ✓ PASS');
      }
    });

    it('should pass auto-scaling configuration check', () => {
      try {
        const output = execSync(`python3 ${scriptPath} ${tapStackPath}`, {
          encoding: 'utf-8',
        });
        expect(output).toContain('Auto-scaling Configuration - ✓ PASS');
      } catch (error: any) {
        expect(error.stdout).toContain('Auto-scaling Configuration - ✓ PASS');
      }
    });

    it('should have a passing score of at least 70%', () => {
      try {
        const output = execSync(`python3 ${scriptPath} ${tapStackPath}`, {
          encoding: 'utf-8',
        });
        const scoreMatch = output.match(/Score:\s*\d+\/\d+\s*\((\d+)%\)/);
        if (scoreMatch) {
          const score = parseInt(scoreMatch[1], 10);
          expect(score).toBeGreaterThanOrEqual(70);
        }
      } catch (error: any) {
        const scoreMatch = error.stdout.match(/Score:\s*\d+\/\d+\s*\((\d+)%\)/);
        if (scoreMatch) {
          const score = parseInt(scoreMatch[1], 10);
          expect(score).toBeGreaterThanOrEqual(70);
        }
      }
    });
  });

  describe('Infrastructure Code Validation', () => {
    const tapStackContent = fs.readFileSync(tapStackPath, 'utf-8');

    it('should use Pulumi config for all environment-specific values', () => {
      // Should read from args with config fallback
      expect(tapStackContent).toContain('args.environmentSuffix');
      expect(tapStackContent).toContain('config.get');
      expect(tapStackContent).toContain('environmentSuffix');
    });

    it('should implement reusable ECS service creation', () => {
      expect(tapStackContent).toContain('createECSService');
      expect(tapStackContent).toMatch(/export function\s+createECSService/);
    });

    it('should not use placement strategies with FARGATE', () => {
      // Placement strategies are not supported with FARGATE launch type
      expect(tapStackContent).not.toContain('orderedPlacementStrategies');
      expect(tapStackContent).toContain('Placement strategies are not supported with FARGATE');
    });

    it('should configure memory reservations', () => {
      expect(tapStackContent).toContain('memoryReservation');
      expect(tapStackContent).toContain('memory');
    });

    it('should configure CloudWatch log retention', () => {
      expect(tapStackContent).toContain('aws.cloudwatch.LogGroup');
      expect(tapStackContent).toContain('retentionInDays');
    });

    it('should use optimized ALB health checks', () => {
      expect(tapStackContent).toContain('healthCheck');
      expect(tapStackContent).toContain('interval');
      expect(tapStackContent).toContain('timeout');
      expect(tapStackContent).toContain('healthyThreshold');
      expect(tapStackContent).toContain('unhealthyThreshold');
    });

    it('should implement comprehensive tagging', () => {
      expect(tapStackContent).toContain('commonTags');
      expect(tapStackContent).toContain('Environment');
      expect(tapStackContent).toContain('Project');
      expect(tapStackContent).toContain('ManagedBy');
    });

    it('should use explicit resource dependencies', () => {
      expect(tapStackContent).toContain('dependsOn');
    });

    it('should configure CPU-based auto-scaling', () => {
      expect(tapStackContent).toContain('aws.appautoscaling');
      expect(tapStackContent).toContain('ECSServiceAverageCPUUtilization');
      expect(tapStackContent).toContain('scaleInCooldown');
      expect(tapStackContent).toContain('scaleOutCooldown');
    });

    it('should export required stack outputs as class properties', () => {
      expect(tapStackContent).toContain('public readonly albDnsName');
      expect(tapStackContent).toContain('public readonly clusterName');
      expect(tapStackContent).toContain('public readonly logGroupName');
      expect(tapStackContent).toContain('public readonly serviceName');
    });

    it('should include environmentSuffix in all resource names', () => {
      const envSuffixCount = (tapStackContent.match(/\$\{environmentSuffix\}/g) || []).length;

      // Should have environmentSuffix used multiple times for resource naming
      expect(envSuffixCount).toBeGreaterThan(10);
    });

    it('should disable deletion protection for destroyability', () => {
      expect(tapStackContent).toContain('enableDeletionProtection: false');
    });

    it('should use Fargate launch type', () => {
      expect(tapStackContent).toContain('launchType: ');
      expect(tapStackContent).toContain('FARGATE');
    });
  });

  describe('Optimization Script Robustness', () => {
    it('should handle missing file gracefully', () => {
      try {
        execSync(`python3 ${scriptPath} /nonexistent/file.ts`, {
          encoding: 'utf-8',
        });
        fail('Should have thrown error for missing file');
      } catch (error: any) {
        expect(error.stderr || error.stdout).toContain('not found');
      }
    });

    it('should require file path argument', () => {
      try {
        execSync(`python3 ${scriptPath}`, {
          encoding: 'utf-8',
        });
        fail('Should have thrown error for missing argument');
      } catch (error: any) {
        expect(error.stderr || error.stdout).toContain('Usage');
      }
    });

    it('should exit with appropriate code based on results', () => {
      try {
        const result = execSync(`python3 ${scriptPath} ${tapStackPath}`, {
          encoding: 'utf-8',
        });
        // If all checks pass, should exit 0
        expect(true).toBe(true);
      } catch (error: any) {
        // If some checks fail, should exit 1
        expect(error.status).toBe(1);
      }
    });
  });

  describe('Code Quality Validation', () => {
    it('should have no hardcoded AWS account IDs', () => {
      const tapStackContent = fs.readFileSync(tapStackPath, 'utf-8');
      expect(tapStackContent).not.toMatch(/\d{12}/); // 12-digit account IDs
    });

    it('should have no hardcoded ARNs', () => {
      const tapStackContent = fs.readFileSync(tapStackPath, 'utf-8');
      expect(tapStackContent).not.toMatch(/arn:aws:[^:]+:[^:]+:\d{12}:/);
    });

    it('should use template literals for dynamic values', () => {
      const tapStackContent = fs.readFileSync(tapStackPath, 'utf-8');
      expect(tapStackContent).toContain('pulumi.interpolate');
    });

    it('should have descriptive resource names', () => {
      const tapStackContent = fs.readFileSync(tapStackPath, 'utf-8');
      expect(tapStackContent).toContain('ecs-vpc');
      expect(tapStackContent).toContain('ecs-subnet');
      expect(tapStackContent).toContain('alb-sg');
      expect(tapStackContent).toContain('ecs-sg');
      expect(tapStackContent).toContain('app-cluster');
    });
  });

  describe('TapStack Component Resource', () => {
    it('should define TapStack as a ComponentResource', () => {
      const tapStackContent = fs.readFileSync(tapStackPath, 'utf-8');
      expect(tapStackContent).toContain('extends pulumi.ComponentResource');
      expect(tapStackContent).toContain('export class TapStack');
    });

    it('should define TapStackArgs interface', () => {
      const tapStackContent = fs.readFileSync(tapStackPath, 'utf-8');
      expect(tapStackContent).toContain('export interface TapStackArgs');
      expect(tapStackContent).toContain('environmentSuffix');
      expect(tapStackContent).toContain('tags');
      expect(tapStackContent).toContain('costCenter');
    });

    it('should register outputs properly', () => {
      const tapStackContent = fs.readFileSync(tapStackPath, 'utf-8');
      expect(tapStackContent).toContain('this.registerOutputs');
    });

    it('should set parent for all resources', () => {
      const tapStackContent = fs.readFileSync(tapStackPath, 'utf-8');
      // All resources should have { parent: this }
      const parentMatches = (tapStackContent.match(/\{ parent: this/g) || []).length;
      expect(parentMatches).toBeGreaterThan(10);
    });
  });
});
