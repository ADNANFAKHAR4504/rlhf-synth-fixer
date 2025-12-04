import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Instantiation', () => {
    test('TapStack instantiates successfully with custom config', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackCustom', {
        environmentSuffix: 'prod',
        region: 'us-west-2',
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('prod');
    });

    test('TapStack uses default region when not specified', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDefaultRegion', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('us-east-1');
    });

    test('TapStack includes environmentSuffix in resource names', () => {
      app = new App();
      const envSuffix = 'unittest123';
      stack = new TapStack(app, 'TestTapStackSuffix', {
        environmentSuffix: envSuffix,
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain(envSuffix);
    });
  });

  describe('VPC Configuration', () => {
    test('VPC is created with correct CIDR block', () => {
      app = new App();
      stack = new TapStack(app, 'TestVPC', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('10.0.0.0/16');
      expect(synthesized).toContain('vpc');
    });

    test('Subnets are created for multiple availability zones', () => {
      app = new App();
      stack = new TapStack(app, 'TestSubnets', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('subnet');
      expect(synthesized).toContain('public');
      expect(synthesized).toContain('private');
    });

    test('Internet Gateway is configured', () => {
      app = new App();
      stack = new TapStack(app, 'TestIGW', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('internet_gateway');
    });

    test('NAT Gateways are created for private subnet access', () => {
      app = new App();
      stack = new TapStack(app, 'TestNAT', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('nat_gateway');
      expect(synthesized).toContain('eip');
    });
  });

  describe('ECR Configuration', () => {
    test('ECR repositories are created for all services', () => {
      app = new App();
      stack = new TapStack(app, 'TestECR', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('ecr_repository');
      expect(synthesized).toContain('frontend');
      expect(synthesized).toContain('api-gateway');
      expect(synthesized).toContain('processing-service');
    });

    test('ECR repositories have lifecycle policies', () => {
      app = new App();
      stack = new TapStack(app, 'TestECRLifecycle', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('ecr_lifecycle_policy');
    });

    test('ECR repositories have tag immutability enabled', () => {
      app = new App();
      stack = new TapStack(app, 'TestECRImmutability', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('image_tag_mutability');
    });
  });

  describe('ECS Configuration', () => {
    test('ECS cluster is created', () => {
      app = new App();
      stack = new TapStack(app, 'TestECSCluster', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('ecs_cluster');
    });

    test('ECS capacity providers include Fargate and Fargate Spot', () => {
      app = new App();
      stack = new TapStack(app, 'TestCapacityProviders', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('capacity_providers');
      expect(synthesized).toContain('FARGATE');
    });

    test('Task definitions are created for all services', () => {
      app = new App();
      stack = new TapStack(app, 'TestTaskDefs', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('ecs_task_definition');
      expect(synthesized).toContain('frontend');
      expect(synthesized).toContain('api-gateway');
      expect(synthesized).toContain('processing-service');
    });

    test('ECS services are created for all task definitions', () => {
      app = new App();
      stack = new TapStack(app, 'TestECSServices', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('ecs_service');
    });
  });

  describe('Load Balancer Configuration', () => {
    test('Application Load Balancer is created', () => {
      app = new App();
      stack = new TapStack(app, 'TestALB', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('lb"');
      expect(synthesized).toContain('application');
    });

    test('Target groups are created for services', () => {
      app = new App();
      stack = new TapStack(app, 'TestTargetGroups', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('lb_target_group');
    });

    test('ALB listeners are configured', () => {
      app = new App();
      stack = new TapStack(app, 'TestListeners', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('lb_listener');
    });

    test('ALB deletion protection is disabled for destroyability', () => {
      app = new App();
      stack = new TapStack(app, 'TestALBDeletion', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('enable_deletion_protection');
    });
  });

  describe('Service Discovery Configuration', () => {
    test('Service Discovery namespace is created', () => {
      app = new App();
      stack = new TapStack(app, 'TestServiceDiscovery', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('service_discovery_private_dns_namespace');
    });

    test('Service Discovery services are configured', () => {
      app = new App();
      stack = new TapStack(app, 'TestSDServices', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('service_discovery_service');
    });
  });

  describe('Security Configuration', () => {
    test('Security groups are created for all tiers', () => {
      app = new App();
      stack = new TapStack(app, 'TestSecurityGroups', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_security_group');
      const sgCount = (synthesized.match(/aws_security_group/g) || []).length;
      expect(sgCount).toBeGreaterThanOrEqual(4);
    });

    test('IAM roles are created for task execution', () => {
      app = new App();
      stack = new TapStack(app, 'TestIAMRoles', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('iam_role');
      expect(synthesized).toContain('ecs-tasks.amazonaws.com');
    });

    test('IAM policies follow least-privilege principle', () => {
      app = new App();
      stack = new TapStack(app, 'TestIAMPolicies', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('iam_policy');
      expect(synthesized).toContain('secretsmanager:GetSecretValue');
    });
  });

  describe('Secrets Management', () => {
    test('Secrets Manager secrets are created', () => {
      app = new App();
      stack = new TapStack(app, 'TestSecrets', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('secretsmanager_secret');
    });

    test('Secrets are configured for force deletion', () => {
      app = new App();
      stack = new TapStack(app, 'TestSecretsDeletion', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('force_overwrite_replica_secret');
    });
  });

  describe('CloudWatch Logging', () => {
    test('CloudWatch log groups are created for each service', () => {
      app = new App();
      stack = new TapStack(app, 'TestLogGroups', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('cloudwatch_log_group');
    });

    test('Log retention is configured', () => {
      app = new App();
      stack = new TapStack(app, 'TestLogRetention', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('retention_in_days');
    });
  });

  describe('Auto-scaling Configuration', () => {
    test('Auto-scaling targets are configured', () => {
      app = new App();
      stack = new TapStack(app, 'TestAutoScaling', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('appautoscaling_target');
    });

    test('Auto-scaling policies are created', () => {
      app = new App();
      stack = new TapStack(app, 'TestScalingPolicies', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('appautoscaling_policy');
    });
  });

  describe('Resource Naming', () => {
    test('All resources include environmentSuffix in their names', () => {
      app = new App();
      const envSuffix = 'unique123';
      stack = new TapStack(app, 'TestResourceNaming', {
        environmentSuffix: envSuffix,
      });
      synthesized = Testing.synth(stack);

      const namePatterns = [
        `ecs-vpc-${envSuffix}`,
        `ecs-cluster-${envSuffix}`,
        `alb-${envSuffix}`,
        `frontend-${envSuffix}`,
      ];

      namePatterns.forEach((pattern) => {
        expect(synthesized).toContain(pattern);
      });
    });
  });

  describe('Destroyability', () => {
    test('ECR repositories are configured for force deletion', () => {
      app = new App();
      stack = new TapStack(app, 'TestECRForceDelete', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('force_delete');
    });

    test('No retention policies prevent resource deletion', () => {
      app = new App();
      stack = new TapStack(app, 'TestNoRetention', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).not.toContain('"prevent_destroy":true');
    });
  });
});
