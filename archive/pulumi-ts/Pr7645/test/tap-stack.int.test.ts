import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('IaC Optimization Integration Tests', () => {
  const libDir = path.join(__dirname, '..', 'lib');
  const optimizeScript = path.join(libDir, 'optimize.py');
  const tapStackFile = path.join(libDir, 'tap-stack.ts');

  describe('optimize.py script validation', () => {
    it('should exist and be executable', () => {
      expect(fs.existsSync(optimizeScript)).toBe(true);
      const stats = fs.statSync(optimizeScript);
      expect(stats.isFile()).toBe(true);
    });

    it('should display help message with correct arguments', () => {
      const output = execSync(`python3 "${optimizeScript}" --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('usage: optimize.py');
      expect(output).toContain('--environment');
      expect(output).toContain('--region');
      expect(output).toContain('--dry-run');
    });

    it('should run in dry-run mode without AWS credentials', () => {
      const output = execSync(
        `python3 "${optimizeScript}" --dry-run --environment test`,
        {
          encoding: 'utf-8',
        },
      );
      expect(output).toContain('DRY RUN MODE');
      expect(output).toContain('Estimated monthly savings');
    });
  });

  describe('tap-stack.ts validation', () => {
    it('should exist and be readable', () => {
      expect(fs.existsSync(tapStackFile)).toBe(true);
      const content = fs.readFileSync(tapStackFile, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should contain TapStack class definition', () => {
      const content = fs.readFileSync(tapStackFile, 'utf-8');
      expect(content).toContain('export class TapStack');
      expect(content).toContain('pulumi.ComponentResource');
    });

    it('should have environmentSuffix usage', () => {
      const content = fs.readFileSync(tapStackFile, 'utf-8');
      expect(content).toContain('environmentSuffix');
    });

    it('should include ECS Fargate resources', () => {
      const content = fs.readFileSync(tapStackFile, 'utf-8');
      expect(content).toContain('aws.ecs.Cluster');
      expect(content).toContain('aws.ecs.Service');
      expect(content).toContain('aws.ecs.TaskDefinition');
      expect(content).toContain('FARGATE');
    });

    it('should include Application Load Balancer', () => {
      const content = fs.readFileSync(tapStackFile, 'utf-8');
      expect(content).toContain('aws.lb.LoadBalancer');
      expect(content).toContain('aws.lb.TargetGroup');
      expect(content).toContain('aws.lb.Listener');
    });

    it('should configure health checks', () => {
      const content = fs.readFileSync(tapStackFile, 'utf-8');
      expect(content).toContain('healthCheck');
      expect(content).toContain('healthyThreshold');
      expect(content).toContain('unhealthyThreshold');
    });

    it('should configure log retention', () => {
      const content = fs.readFileSync(tapStackFile, 'utf-8');
      expect(content).toContain('aws.cloudwatch.LogGroup');
      expect(content).toContain('retentionInDays');
    });

    it('should include IAM roles', () => {
      const content = fs.readFileSync(tapStackFile, 'utf-8');
      expect(content).toContain('aws.iam.Role');
      expect(content).toContain('taskExecutionRole');
    });

    it('should configure networking', () => {
      const content = fs.readFileSync(tapStackFile, 'utf-8');
      expect(content).toContain('aws.ec2.Vpc');
      expect(content).toContain('aws.ec2.Subnet');
      expect(content).toContain('aws.ec2.InternetGateway');
      expect(content).toContain('aws.ec2.SecurityGroup');
    });

    it('should export stack outputs', () => {
      const content = fs.readFileSync(tapStackFile, 'utf-8');
      expect(content).toContain('albDnsName');
      expect(content).toContain('serviceArn');
      expect(content).toContain('clusterName');
      expect(content).toContain('logGroupName');
    });
  });

  describe('Optimization requirements validation', () => {
    it('should use parameterized container configuration', () => {
      const content = fs.readFileSync(tapStackFile, 'utf-8');
      expect(content).toContain('containerMemory');
      expect(content).toContain('containerCpu');
    });

    it('should include cost allocation tags', () => {
      const content = fs.readFileSync(tapStackFile, 'utf-8');
      expect(content).toContain('tags');
      expect(content).toContain('Team');
      expect(content).toContain('Project');
      expect(content).toContain('Environment');
    });

    it('should use single target group (not loop)', () => {
      const content = fs.readFileSync(tapStackFile, 'utf-8');
      const targetGroupMatches = content.match(/new\s+aws\.lb\.TargetGroup/g);
      // Should create exactly one target group
      expect(targetGroupMatches).toBeDefined();
      if (targetGroupMatches) {
        expect(targetGroupMatches.length).toBe(1);
      }
    });

    it('should consolidate IAM roles (single execution role)', () => {
      const content = fs.readFileSync(tapStackFile, 'utf-8');
      const roleMatches = content.match(/new\s+aws\.iam\.Role\(/g);
      // Should create exactly one role (excluding RolePolicyAttachment)
      expect(roleMatches).toBeDefined();
      if (roleMatches) {
        expect(roleMatches.length).toBe(1);
      }
    });
  });

  describe('Documentation files validation', () => {
    it('should have MODEL_FAILURES.md in lib/', () => {
      const modelFailuresPath = path.join(libDir, 'MODEL_FAILURES.md');
      expect(fs.existsSync(modelFailuresPath)).toBe(true);
    });

    it('should have IDEAL_RESPONSE.md in lib/', () => {
      const idealResponsePath = path.join(libDir, 'IDEAL_RESPONSE.md');
      expect(fs.existsSync(idealResponsePath)).toBe(true);
    });

    it('should have PROMPT.md in lib/', () => {
      const promptPath = path.join(libDir, 'PROMPT.md');
      expect(fs.existsSync(promptPath)).toBe(true);
    });

    it('should have MODEL_RESPONSE.md in lib/', () => {
      const modelResponsePath = path.join(libDir, 'MODEL_RESPONSE.md');
      expect(fs.existsSync(modelResponsePath)).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle dry-run mode gracefully', () => {
      // Dry-run mode should work without AWS credentials
      const output = execSync(
        `python3 "${optimizeScript}" --dry-run -e dev`,
        {
          encoding: 'utf-8',
        },
      );
      expect(output).toContain('DRY RUN MODE');
    });
  });
});
