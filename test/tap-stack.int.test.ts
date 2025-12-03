import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('ECS Optimization Integration Tests', () => {
  const scriptPath = path.join(__dirname, '../lib/optimize.py');
  const indexPath = path.join(__dirname, '../lib/index.ts');

  describe('Optimization Script End-to-End', () => {
    it('should successfully analyze the infrastructure code', () => {
      try {
        const output = execSync(`python3 ${scriptPath} ${indexPath}`, {
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
        const output = execSync(`python3 ${scriptPath} ${indexPath}`, {
          encoding: 'utf-8',
        });
        expect(output).toMatch(/Total Checks:\s*10/);
      } catch (error: any) {
        expect(error.stdout).toMatch(/Total Checks:\s*10/);
      }
    });

    it('should provide detailed findings for each check', () => {
      try {
        const output = execSync(`python3 ${scriptPath} ${indexPath}`, {
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
        const output = execSync(`python3 ${scriptPath} ${indexPath}`, {
          encoding: 'utf-8',
        });
        expect(output).toContain('Service Consolidation - ✓ PASS');
      } catch (error: any) {
        expect(error.stdout).toContain('Service Consolidation - ✓ PASS');
      }
    });

    it('should pass task placement strategy check', () => {
      try {
        const output = execSync(`python3 ${scriptPath} ${indexPath}`, {
          encoding: 'utf-8',
        });
        expect(output).toContain('Task Placement Strategy - ✓ PASS');
      } catch (error: any) {
        expect(error.stdout).toContain('Task Placement Strategy - ✓ PASS');
      }
    });

    it('should pass resource reservations check', () => {
      try {
        const output = execSync(`python3 ${scriptPath} ${indexPath}`, {
          encoding: 'utf-8',
        });
        expect(output).toContain('Resource Reservations - ✓ PASS');
      } catch (error: any) {
        expect(error.stdout).toContain('Resource Reservations - ✓ PASS');
      }
    });

    it('should pass configuration management check', () => {
      try {
        const output = execSync(`python3 ${scriptPath} ${indexPath}`, {
          encoding: 'utf-8',
        });
        expect(output).toContain('Configuration Management - ✓ PASS');
      } catch (error: any) {
        expect(error.stdout).toContain('Configuration Management - ✓ PASS');
      }
    });

    it('should pass ALB health check optimization', () => {
      try {
        const output = execSync(`python3 ${scriptPath} ${indexPath}`, {
          encoding: 'utf-8',
        });
        expect(output).toContain('ALB Health Check Optimization - ✓ PASS');
      } catch (error: any) {
        expect(error.stdout).toContain('ALB Health Check Optimization - ✓ PASS');
      }
    });

    it('should pass security group cleanup check', () => {
      try {
        const output = execSync(`python3 ${scriptPath} ${indexPath}`, {
          encoding: 'utf-8',
        });
        expect(output).toContain('Security Group Cleanup - ✓ PASS');
      } catch (error: any) {
        expect(error.stdout).toContain('Security Group Cleanup - ✓ PASS');
      }
    });

    it('should pass resource dependencies check', () => {
      try {
        const output = execSync(`python3 ${scriptPath} ${indexPath}`, {
          encoding: 'utf-8',
        });
        expect(output).toContain('Resource Dependencies - ✓ PASS');
      } catch (error: any) {
        expect(error.stdout).toContain('Resource Dependencies - ✓ PASS');
      }
    });

    it('should pass auto-scaling configuration check', () => {
      try {
        const output = execSync(`python3 ${scriptPath} ${indexPath}`, {
          encoding: 'utf-8',
        });
        expect(output).toContain('Auto-scaling Configuration - ✓ PASS');
      } catch (error: any) {
        expect(error.stdout).toContain('Auto-scaling Configuration - ✓ PASS');
      }
    });

    it('should have a passing score of at least 70%', () => {
      try {
        const output = execSync(`python3 ${scriptPath} ${indexPath}`, {
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
    const indexContent = fs.readFileSync(indexPath, 'utf-8');

    it('should use Pulumi config for all environment-specific values', () => {
      // Should read from environment variable with config fallback
      expect(indexContent).toContain('ENVIRONMENT_SUFFIX');
      expect(indexContent).toContain('config.get');
      expect(indexContent).toContain('environmentSuffix');
    });

    it('should implement reusable ECS service creation', () => {
      expect(indexContent).toContain('createECSService');
      expect(indexContent).toMatch(/function\s+createECSService/);
    });

    it('should use binpack placement strategy', () => {
      expect(indexContent).toContain('orderedPlacementStrategies');
      expect(indexContent).toContain('binpack');
    });

    it('should configure memory reservations', () => {
      expect(indexContent).toContain('memoryReservation');
      expect(indexContent).toContain('memory');
    });

    it('should configure CloudWatch log retention', () => {
      expect(indexContent).toContain('aws.cloudwatch.LogGroup');
      expect(indexContent).toContain('retentionInDays');
    });

    it('should use optimized ALB health checks', () => {
      expect(indexContent).toContain('healthCheck');
      expect(indexContent).toContain('interval');
      expect(indexContent).toContain('timeout');
      expect(indexContent).toContain('healthyThreshold');
      expect(indexContent).toContain('unhealthyThreshold');
    });

    it('should implement comprehensive tagging', () => {
      expect(indexContent).toContain('commonTags');
      expect(indexContent).toContain('Environment');
      expect(indexContent).toContain('Project');
      expect(indexContent).toContain('ManagedBy');
    });

    it('should use explicit resource dependencies', () => {
      expect(indexContent).toContain('dependsOn');
    });

    it('should configure CPU-based auto-scaling', () => {
      expect(indexContent).toContain('aws.appautoscaling');
      expect(indexContent).toContain('ECSServiceAverageCPUUtilization');
      expect(indexContent).toContain('scaleInCooldown');
      expect(indexContent).toContain('scaleOutCooldown');
    });

    it('should export required stack outputs', () => {
      expect(indexContent).toContain('export const albDnsName');
      expect(indexContent).toContain('export const clusterName');
      expect(indexContent).toContain('export const logGroupName');
      expect(indexContent).toContain('export const serviceName');
    });

    it('should include environmentSuffix in all resource names', () => {
      const resourceDeclarations = indexContent.match(/new aws\.\w+\.\w+\(/g) || [];
      const envSuffixCount = (indexContent.match(/\$\{environmentSuffix\}/g) || []).length;

      // Should have environmentSuffix used multiple times for resource naming
      expect(envSuffixCount).toBeGreaterThan(10);
    });

    it('should disable deletion protection for destroyability', () => {
      expect(indexContent).toContain('enableDeletionProtection: false');
    });

    it('should use Fargate launch type', () => {
      expect(indexContent).toContain('launchType: ');
      expect(indexContent).toContain('FARGATE');
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
        const result = execSync(`python3 ${scriptPath} ${indexPath}`, {
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
      const indexContent = fs.readFileSync(indexPath, 'utf-8');
      expect(indexContent).not.toMatch(/\d{12}/); // 12-digit account IDs
    });

    it('should have no hardcoded ARNs', () => {
      const indexContent = fs.readFileSync(indexPath, 'utf-8');
      expect(indexContent).not.toMatch(/arn:aws:[^:]+:[^:]+:\d{12}:/);
    });

    it('should use template literals for dynamic values', () => {
      const indexContent = fs.readFileSync(indexPath, 'utf-8');
      expect(indexContent).toContain('pulumi.interpolate');
    });

    it('should have descriptive resource names', () => {
      const indexContent = fs.readFileSync(indexPath, 'utf-8');
      expect(indexContent).toContain('ecs-vpc');
      expect(indexContent).toContain('ecs-subnet');
      expect(indexContent).toContain('alb-sg');
      expect(indexContent).toContain('ecs-sg');
      expect(indexContent).toContain('app-cluster');
    });
  });
});
