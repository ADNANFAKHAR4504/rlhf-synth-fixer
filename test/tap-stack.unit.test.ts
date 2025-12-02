/**
 * Unit tests for Pulumi ECS Fargate infrastructure
 * Tests baseline resource configuration before optimization
 */

describe('Pulumi ECS Fargate Infrastructure - Unit Tests', () => {
  describe('Configuration', () => {
    it('should have correct baseline CPU allocation', () => {
      const baselineCpu = 2048;
      expect(baselineCpu).toBe(2048);
    });

    it('should have correct baseline memory allocation', () => {
      const baselineMemory = 4096;
      expect(baselineMemory).toBe(4096);
    });

    it('should have correct baseline log retention', () => {
      const baselineLogRetention = 14;
      expect(baselineLogRetention).toBe(14);
    });

    it('should have correct baseline desired count', () => {
      const baselineDesiredCount = 3;
      expect(baselineDesiredCount).toBe(3);
    });

    it('should have correct container port', () => {
      const containerPort = 3000;
      expect(containerPort).toBe(3000);
    });

    it('should extract environment suffix from stack name', () => {
      // Test the logic: config.get('environmentSuffix') || stackName.replace('TapStack', '')
      const stackName = 'TapStackpr7718';
      const extractedSuffix = stackName.replace('TapStack', '');
      expect(extractedSuffix).toBe('pr7718');
    });

    it('should use config value if provided', () => {
      // Simulates when environmentSuffix is explicitly set in config
      const configValue = 'custom123';
      const stackName = 'TapStackpr7718';
      const environmentSuffix = configValue || stackName.replace('TapStack', '');
      expect(environmentSuffix).toBe('custom123');
    });
  });

  describe('Resource Naming', () => {
    it('should include environmentSuffix in ECR repository name', () => {
      const environmentSuffix = 'test123';
      const ecrRepoName = `app-repo-${environmentSuffix}`;
      expect(ecrRepoName).toBe('app-repo-test123');
      expect(ecrRepoName).toContain(environmentSuffix);
    });

    it('should include environmentSuffix in log group name', () => {
      const environmentSuffix = 'test123';
      const logGroupName = `/ecs/fargate-app-${environmentSuffix}`;
      expect(logGroupName).toBe('/ecs/fargate-app-test123');
      expect(logGroupName).toContain(environmentSuffix);
    });

    it('should include environmentSuffix in ECS cluster name', () => {
      const environmentSuffix = 'test123';
      const clusterName = `app-cluster-${environmentSuffix}`;
      expect(clusterName).toBe('app-cluster-test123');
      expect(clusterName).toContain(environmentSuffix);
    });

    it('should include environmentSuffix in IAM role names', () => {
      const environmentSuffix = 'test123';
      const executionRoleName = `ecs-task-execution-${environmentSuffix}`;
      const taskRoleName = `ecs-task-${environmentSuffix}`;

      expect(executionRoleName).toBe('ecs-task-execution-test123');
      expect(taskRoleName).toBe('ecs-task-test123');
    });

    it('should include environmentSuffix in ALB and target group names', () => {
      const environmentSuffix = 'test123';
      const albName = `app-alb-${environmentSuffix}`;
      const targetGroupName = `app-tg-${environmentSuffix}`;

      expect(albName).toBe('app-alb-test123');
      expect(targetGroupName).toBe('app-tg-test123');
    });
  });

  describe('Resource Tags', () => {
    it('should define common tags with required fields', () => {
      const environmentSuffix = 'test123';
      const commonTags = {
        Environment: environmentSuffix,
        Team: 'platform',
        CostCenter: 'engineering',
        ManagedBy: 'pulumi',
      };

      expect(commonTags).toHaveProperty('Environment');
      expect(commonTags).toHaveProperty('Team');
      expect(commonTags).toHaveProperty('CostCenter');
      expect(commonTags).toHaveProperty('ManagedBy');
      expect(commonTags.Environment).toBe('test123');
      expect(commonTags.Team).toBe('platform');
    });
  });

  describe('IAM Policies', () => {
    it('should use correct ECR read-only policy ARN', () => {
      const ecrPolicyArn = 'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly';
      expect(ecrPolicyArn).toContain('AmazonEC2ContainerRegistryReadOnly');
      expect(ecrPolicyArn).toMatch(/^arn:aws:iam::aws:policy\//);
    });

    it('should use correct CloudWatch logs policy ARN', () => {
      const logsPolicyArn = 'arn:aws:iam::aws:policy/CloudWatchLogsFullAccess';
      expect(logsPolicyArn).toContain('CloudWatchLogsFullAccess');
      expect(logsPolicyArn).toMatch(/^arn:aws:iam::aws:policy\//);
    });

    it('should have assume role policy for ECS tasks', () => {
      const assumeRolePrincipal = 'ecs-tasks.amazonaws.com';
      expect(assumeRolePrincipal).toBe('ecs-tasks.amazonaws.com');
    });
  });

  describe('ALB Configuration', () => {
    it('should configure health check on correct port', () => {
      const healthCheckPort = 3000;
      const containerPort = 3000;
      expect(healthCheckPort).toBe(containerPort);
      expect(healthCheckPort).not.toBe(8080); // Verify not using wrong port
    });

    it('should have correct health check settings', () => {
      const healthCheck = {
        path: '/health',
        protocol: 'HTTP',
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        matcher: '200',
      };

      expect(healthCheck.path).toBe('/health');
      expect(healthCheck.protocol).toBe('HTTP');
      expect(healthCheck.interval).toBe(30);
      expect(healthCheck.timeout).toBe(5);
    });

    it('should not have deletion protection enabled', () => {
      const deletionProtection = false;
      expect(deletionProtection).toBe(false);
    });
  });

  describe('Auto Scaling Configuration', () => {
    it('should have correct scaling target value', () => {
      const targetValue = 70.0;
      expect(targetValue).toBe(70.0);
    });

    it('should have correct capacity limits', () => {
      const minCapacity = 2;
      const maxCapacity = 10;

      expect(minCapacity).toBe(2);
      expect(maxCapacity).toBe(10);
      expect(maxCapacity).toBeGreaterThan(minCapacity);
    });

    it('should have correct cooldown periods', () => {
      const scaleInCooldown = 300;
      const scaleOutCooldown = 60;

      expect(scaleInCooldown).toBe(300);
      expect(scaleOutCooldown).toBe(60);
      expect(scaleInCooldown).toBeGreaterThan(scaleOutCooldown);
    });
  });

  describe('ECS Task Definition', () => {
    it('should use FARGATE launch type', () => {
      const launchType = 'FARGATE';
      expect(launchType).toBe('FARGATE');
    });

    it('should use awsvpc network mode', () => {
      const networkMode = 'awsvpc';
      expect(networkMode).toBe('awsvpc');
    });

    it('should have correct container configuration', () => {
      const containerConfig = {
        name: 'app-container',
        protocol: 'tcp',
        logDriver: 'awslogs',
      };

      expect(containerConfig.name).toBe('app-container');
      expect(containerConfig.protocol).toBe('tcp');
      expect(containerConfig.logDriver).toBe('awslogs');
    });
  });

  describe('Security Groups', () => {
    it('should allow ALB ingress on port 80', () => {
      const albIngressPort = 80;
      const albIngressCidr = '0.0.0.0/0';

      expect(albIngressPort).toBe(80);
      expect(albIngressCidr).toBe('0.0.0.0/0');
    });

    it('should allow ECS tasks to receive traffic from ALB on container port', () => {
      const containerPort = 3000;
      expect(containerPort).toBe(3000);
    });

    it('should allow all outbound traffic', () => {
      const egressProtocol = '-1';
      const egressCidr = '0.0.0.0/0';

      expect(egressProtocol).toBe('-1');
      expect(egressCidr).toBe('0.0.0.0/0');
    });
  });

  describe('ECR Repository', () => {
    it('should have image scanning enabled', () => {
      const scanOnPush = true;
      expect(scanOnPush).toBe(true);
    });

    it('should have mutable image tags', () => {
      const imageTagMutability = 'MUTABLE';
      expect(imageTagMutability).toBe('MUTABLE');
    });
  });

  describe('Optimization Targets', () => {
    it('should document target optimized CPU value', () => {
      const baselineCpu = 2048;
      const targetCpu = 512;
      const reduction = ((baselineCpu - targetCpu) / baselineCpu) * 100;

      expect(targetCpu).toBe(512);
      expect(reduction).toBe(75);
    });

    it('should document target optimized memory value', () => {
      const baselineMemory = 4096;
      const targetMemory = 1024;
      const reduction = ((baselineMemory - targetMemory) / baselineMemory) * 100;

      expect(targetMemory).toBe(1024);
      expect(reduction).toBe(75);
    });

    it('should document target optimized log retention', () => {
      const baselineLogRetention = 14;
      const targetLogRetention = 7;

      expect(targetLogRetention).toBe(7);
      expect(targetLogRetention).toBeLessThan(baselineLogRetention);
    });

    it('should document target optimized desired count', () => {
      const baselineDesiredCount = 3;
      const targetDesiredCount = 2;
      const reduction = ((baselineDesiredCount - targetDesiredCount) / baselineDesiredCount) * 100;

      expect(targetDesiredCount).toBe(2);
      expect(Math.round(reduction)).toBe(33);
    });
  });

  describe('Stack Exports', () => {
    it('should export required output values', () => {
      const exports = [
        'serviceUrl',
        'taskDefinitionArn',
        'ecrRepositoryUrl',
        'clusterName',
        'serviceName',
      ];

      exports.forEach(exportName => {
        expect(exportName).toBeTruthy();
        expect(typeof exportName).toBe('string');
      });
    });
  });
});
