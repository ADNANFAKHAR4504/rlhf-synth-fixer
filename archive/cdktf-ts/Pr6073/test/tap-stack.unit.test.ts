import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  describe('Stack Creation', () => {
    it('should create stack with default props', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-stack');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toBeDefined();
      expect(synthesized).toMatchSnapshot();
    });

    it('should create stack with custom environmentSuffix', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-stack', {
        environmentSuffix: 'custom-env',
      });
      const synthesized = JSON.parse(Testing.synth(stack));

      const vpc = Object.values(synthesized.resource.aws_vpc)[0] as any;
      expect(vpc.tags.Name).toBe('vpc-custom-env');
    });

    it('should create stack with custom AWS region', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-stack', {
        awsRegion: 'us-west-2',
      });
      const synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.provider.aws[0].region).toBe('us-west-2');
    });

    it('should respect AWS_REGION_OVERRIDE environment variable', () => {
      const originalEnv = process.env.AWS_REGION_OVERRIDE;
      process.env.AWS_REGION_OVERRIDE = 'eu-west-1';

      const app = Testing.app();
      const stack = new TapStack(app, 'test-stack', {
        awsRegion: 'us-east-1',
      });
      const synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.provider.aws[0].region).toBe('eu-west-1');

      if (originalEnv) {
        process.env.AWS_REGION_OVERRIDE = originalEnv;
      } else {
        delete process.env.AWS_REGION_OVERRIDE;
      }
    });

    it('should create stack with custom default tags', () => {
      const app = Testing.app();
      const customTags = {
        tags: {
          Environment: 'staging',
          Project: 'test-project',
          Owner: 'test-team',
        },
      };

      const stack = new TapStack(app, 'test-stack', {
        defaultTags: customTags,
      });
      const synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.provider.aws[0].default_tags).toEqual([customTags]);
    });

    it('should configure S3 backend with correct parameters', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-stack', {
        environmentSuffix: 'test-env',
        stateBucket: 'my-terraform-state',
        stateBucketRegion: 'us-west-2',
      });
      const synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform.backend.s3.bucket).toBe(
        'my-terraform-state'
      );
      expect(synthesized.terraform.backend.s3.key).toBe(
        'test-env/test-stack.tfstate'
      );
      expect(synthesized.terraform.backend.s3.region).toBe('us-west-2');
      expect(synthesized.terraform.backend.s3.encrypt).toBe(true);
    });
  });

  describe('VPC and Networking', () => {
    let synthesized: any;

    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-stack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    it('should create VPC with correct CIDR block', () => {
      const vpc = Object.values(synthesized.resource.aws_vpc)[0] as any;
      expect(vpc.cidr_block).toBe('10.0.0.0/16');
      expect(vpc.enable_dns_hostnames).toBe(true);
      expect(vpc.enable_dns_support).toBe(true);
    });

    it('should create VPC with proper tags', () => {
      const vpc = Object.values(synthesized.resource.aws_vpc)[0] as any;
      expect(vpc.tags.Name).toBe('vpc-test');
      expect(vpc.tags.Environment).toBe('production');
      expect(vpc.tags.Project).toBe('payment-app');
    });

    it('should create Internet Gateway', () => {
      const igw = Object.values(synthesized.resource.aws_internet_gateway)[0] as any;
      expect(igw.tags.Name).toBe('igw-test');
    });

    it('should create 3 public subnets', () => {
      const publicSubnets = Object.values(synthesized.resource.aws_subnet).filter(
        (subnet: any) => subnet.tags?.Type === 'public'
      );
      expect(publicSubnets).toHaveLength(3);
    });

    it('should create public subnets with correct CIDR blocks', () => {
      const publicSubnets = Object.values(synthesized.resource.aws_subnet).filter(
        (subnet: any) => subnet.tags?.Type === 'public'
      ) as any[];

      for (let i = 0; i < 3; i++) {
        const subnet = publicSubnets.find(
          (s: any) => s.cidr_block === `10.0.${i}.0/24`
        );
        expect(subnet).toBeDefined();
        expect(subnet.map_public_ip_on_launch).toBe(true);
      }
    });

    it('should create 3 private subnets', () => {
      const privateSubnets = Object.values(synthesized.resource.aws_subnet).filter(
        (subnet: any) => subnet.tags?.Type === 'private'
      );
      expect(privateSubnets).toHaveLength(3);
    });

    it('should create private subnets with correct CIDR blocks', () => {
      const privateSubnets = Object.values(synthesized.resource.aws_subnet).filter(
        (subnet: any) => subnet.tags?.Type === 'private'
      ) as any[];

      for (let i = 0; i < 3; i++) {
        const subnet = privateSubnets.find(
          (s: any) => s.cidr_block === `10.0.${i + 10}.0/24`
        );
        expect(subnet).toBeDefined();
        expect(subnet.map_public_ip_on_launch).toBe(false);
      }
    });

    it('should create 3 Elastic IPs for NAT Gateways', () => {
      const eips = Object.keys(synthesized.resource.aws_eip || {});
      expect(eips).toHaveLength(3);
    });

    it('should create Elastic IPs with VPC domain', () => {
      const eip = Object.values(synthesized.resource.aws_eip)[0] as any;
      expect(eip.domain).toBe('vpc');
    });

    it('should create 3 NAT Gateways', () => {
      const natGateways = Object.keys(synthesized.resource.aws_nat_gateway || {});
      expect(natGateways).toHaveLength(3);
    });

    it('should create public route table', () => {
      const routeTables = Object.values(synthesized.resource.aws_route_table) as any[];
      const publicRt = routeTables.find((rt: any) =>
        rt.tags.Name.includes('public-rt')
      );
      expect(publicRt).toBeDefined();
    });

    it('should create route to Internet Gateway', () => {
      const routes = Object.values(synthesized.resource.aws_route) as any[];
      const igwRoute = routes.find(
        (r: any) => r.destination_cidr_block === '0.0.0.0/0' && r.gateway_id
      );
      expect(igwRoute).toBeDefined();
    });

    it('should create 3 route table associations for public subnets', () => {
      const associations = Object.keys(
        synthesized.resource.aws_route_table_association || {}
      );
      expect(associations.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Security Groups', () => {
    let synthesized: any;

    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-stack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    it('should create ALB security group', () => {
      const securityGroups = Object.values(
        synthesized.resource.aws_security_group
      ) as any[];
      const albSg = securityGroups.find((sg: any) => sg.name === 'alb-sg-test');
      expect(albSg).toBeDefined();
      expect(albSg.description).toBe('Security group for Application Load Balancer');
    });

    it('should create ECS security group', () => {
      const securityGroups = Object.values(
        synthesized.resource.aws_security_group
      ) as any[];
      const ecsSg = securityGroups.find((sg: any) => sg.name === 'ecs-sg-test');
      expect(ecsSg).toBeDefined();
    });

    it('should create RDS security group', () => {
      const securityGroups = Object.values(
        synthesized.resource.aws_security_group
      ) as any[];
      const rdsSg = securityGroups.find((sg: any) => sg.name === 'rds-sg-test');
      expect(rdsSg).toBeDefined();
    });

    it('should allow HTTPS traffic to ALB', () => {
      const rules = Object.values(
        synthesized.resource.aws_security_group_rule
      ) as any[];
      const httpsRule = rules.find(
        (r: any) =>
          r.type === 'ingress' &&
          r.from_port === 443 &&
          r.to_port === 443 &&
          r.protocol === 'tcp' &&
          r.cidr_blocks?.includes('0.0.0.0/0')
      );
      expect(httpsRule).toBeDefined();
    });

    it('should allow HTTP traffic to ALB', () => {
      const rules = Object.values(
        synthesized.resource.aws_security_group_rule
      ) as any[];
      const httpRule = rules.find(
        (r: any) =>
          r.type === 'ingress' &&
          r.from_port === 80 &&
          r.to_port === 80 &&
          r.protocol === 'tcp' &&
          r.cidr_blocks?.includes('0.0.0.0/0')
      );
      expect(httpRule).toBeDefined();
    });

    it('should allow ALB to ECS on port 8080', () => {
      const rules = Object.values(
        synthesized.resource.aws_security_group_rule
      ) as any[];
      const ecsRule = rules.find(
        (r: any) =>
          r.type === 'ingress' &&
          r.from_port === 8080 &&
          r.to_port === 8080 &&
          r.protocol === 'tcp' &&
          r.source_security_group_id
      );
      expect(ecsRule).toBeDefined();
    });

    it('should allow ECS to RDS on port 5432', () => {
      const rules = Object.values(
        synthesized.resource.aws_security_group_rule
      ) as any[];
      const rdsRule = rules.find(
        (r: any) =>
          r.type === 'ingress' &&
          r.from_port === 5432 &&
          r.to_port === 5432 &&
          r.protocol === 'tcp' &&
          r.source_security_group_id
      );
      expect(rdsRule).toBeDefined();
    });

    it('should allow all outbound traffic from security groups', () => {
      const rules = Object.values(
        synthesized.resource.aws_security_group_rule
      ) as any[];
      const egressRules = rules.filter(
        (r: any) =>
          r.type === 'egress' &&
          r.from_port === 0 &&
          r.to_port === 0 &&
          r.protocol === '-1'
      );
      expect(egressRules.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('ECR Repository', () => {
    let synthesized: any;

    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-stack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    it('should create ECR repository with environmentSuffix', () => {
      const repo = Object.values(synthesized.resource.aws_ecr_repository)[0] as any;
      expect(repo.name).toBe('payment-app-test');
    });

    it('should enable image scanning on push', () => {
      const repo = Object.values(synthesized.resource.aws_ecr_repository)[0] as any;
      expect(repo.image_scanning_configuration.scan_on_push).toBe(true);
    });

    it('should set image tag mutability to MUTABLE', () => {
      const repo = Object.values(synthesized.resource.aws_ecr_repository)[0] as any;
      expect(repo.image_tag_mutability).toBe('MUTABLE');
    });
  });

  describe('RDS Database', () => {
    let synthesized: any;

    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-stack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    it('should create DB subnet group', () => {
      const subnetGroup = Object.values(
        synthesized.resource.aws_db_subnet_group
      )[0] as any;
      expect(subnetGroup.name).toBe('db-subnet-group-test');
    });

    it('should create RDS PostgreSQL instance', () => {
      const rds = Object.values(synthesized.resource.aws_db_instance)[0] as any;
      expect(rds.identifier).toBe('payment-db-test');
      expect(rds.engine).toBe('postgres');
      expect(rds.instance_class).toBe('db.t3.medium');
    });

    it('should enable Multi-AZ deployment', () => {
      const rds = Object.values(synthesized.resource.aws_db_instance)[0] as any;
      expect(rds.multi_az).toBe(true);
    });

    it('should enable storage encryption', () => {
      const rds = Object.values(synthesized.resource.aws_db_instance)[0] as any;
      expect(rds.storage_encrypted).toBe(true);
    });

    it('should configure backup retention period', () => {
      const rds = Object.values(synthesized.resource.aws_db_instance)[0] as any;
      expect(rds.backup_retention_period).toBe(7);
    });

    it('should disable deletion protection', () => {
      const rds = Object.values(synthesized.resource.aws_db_instance)[0] as any;
      expect(rds.deletion_protection).toBe(false);
    });

    it('should skip final snapshot', () => {
      const rds = Object.values(synthesized.resource.aws_db_instance)[0] as any;
      expect(rds.skip_final_snapshot).toBe(true);
    });

    it('should not be publicly accessible', () => {
      const rds = Object.values(synthesized.resource.aws_db_instance)[0] as any;
      expect(rds.publicly_accessible).toBe(false);
    });

    it('should enable CloudWatch logs exports', () => {
      const rds = Object.values(synthesized.resource.aws_db_instance)[0] as any;
      expect(rds.enabled_cloudwatch_logs_exports).toEqual(['postgresql', 'upgrade']);
    });

    it('should have password configured', () => {
      const rds = Object.values(synthesized.resource.aws_db_instance)[0] as any;
      expect(rds.password).toBeDefined();
      expect(rds.password).toBe('TemporaryPassword123!');
    });
  });

  describe('Secrets Manager', () => {
    let synthesized: any;

    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-stack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    it('should create Secrets Manager secret', () => {
      const secret = Object.values(
        synthesized.resource.aws_secretsmanager_secret
      )[0] as any;
      expect(secret.name).toBe('payment-db-connection-test-v1');
      expect(secret.description).toBe(
        'Database connection string for payment application'
      );
    });

    it('should create secret version with database connection details', () => {
      const secretVersion = Object.values(
        synthesized.resource.aws_secretsmanager_secret_version
      )[0] as any;
      expect(secretVersion).toBeDefined();
      expect(secretVersion.secret_string).toContain('host');
      expect(secretVersion.secret_string).toContain('password');
    });
  });

  describe('ECS Cluster', () => {
    let synthesized: any;

    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-stack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    it('should create CloudWatch log group', () => {
      const logGroup = Object.values(
        synthesized.resource.aws_cloudwatch_log_group
      )[0] as any;
      expect(logGroup.name).toBe('/ecs/payment-app-test');
      expect(logGroup.retention_in_days).toBe(7);
    });

    it('should create ECS cluster with Container Insights', () => {
      const cluster = Object.values(synthesized.resource.aws_ecs_cluster)[0] as any;
      expect(cluster.name).toBe('payment-cluster-test');
      expect(cluster.setting).toEqual([
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ]);
    });

    it('should create ECS task execution role', () => {
      const roles = Object.values(synthesized.resource.aws_iam_role) as any[];
      const execRole = roles.find(
        (r: any) => r.name === 'ecs-task-execution-role-test'
      );
      expect(execRole).toBeDefined();
    });

    it('should create ECS task role', () => {
      const roles = Object.values(synthesized.resource.aws_iam_role) as any[];
      const taskRole = roles.find((r: any) => r.name === 'ecs-task-role-test');
      expect(taskRole).toBeDefined();
    });

    it('should attach ECS task execution policy', () => {
      const attachments = Object.values(
        synthesized.resource.aws_iam_role_policy_attachment
      ) as any[];
      const execPolicyAttachment = attachments.find(
        (a: any) =>
          a.policy_arn ===
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'
      );
      expect(execPolicyAttachment).toBeDefined();
    });

    it('should create secrets access policy', () => {
      const policy = Object.values(synthesized.resource.aws_iam_policy)[0] as any;
      expect(policy.name).toBe('ecs-secrets-policy-test');
    });
  });

  describe('Application Load Balancer', () => {
    let synthesized: any;

    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-stack', {
        environmentSuffix: 'test',
        enableHttps: false, // Disable HTTPS for these tests
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    it('should not create ACM certificate when HTTPS is disabled by default', () => {
      const cert = synthesized.resource.aws_acm_certificate;
      // With default config (no enableHttps specified), it defaults to true
      // but without customDomain or existingCertificateArn, no cert is created
      expect(cert).toBeUndefined();
    });

    it('should create Application Load Balancer', () => {
      const alb = Object.values(synthesized.resource.aws_lb)[0] as any;
      expect(alb.name).toBe('payment-alb-test');
      expect(alb.internal).toBe(false);
      expect(alb.load_balancer_type).toBe('application');
    });

    it('should disable deletion protection', () => {
      const alb = Object.values(synthesized.resource.aws_lb)[0] as any;
      expect(alb.enable_deletion_protection).toBe(false);
    });

    it('should enable HTTP/2', () => {
      const alb = Object.values(synthesized.resource.aws_lb)[0] as any;
      expect(alb.enable_http2).toBe(true);
    });

    it('should create target group', () => {
      const tg = Object.values(synthesized.resource.aws_lb_target_group)[0] as any;
      expect(tg.name).toBe('payment-tg-test');
      expect(tg.port).toBe(8080);
      expect(tg.protocol).toBe('HTTP');
      expect(tg.target_type).toBe('ip');
    });

    it('should configure health check', () => {
      const tg = Object.values(synthesized.resource.aws_lb_target_group)[0] as any;
      expect(tg.health_check.enabled).toBe(true);
      expect(tg.health_check.path).toBe('/health');
      expect(tg.health_check.protocol).toBe('HTTP');
      expect(tg.health_check.matcher).toBe('200');
    });

    it('should set deregistration delay as string', () => {
      const tg = Object.values(synthesized.resource.aws_lb_target_group)[0] as any;
      expect(tg.deregistration_delay).toBe('30');
      expect(typeof tg.deregistration_delay).toBe('string');
    });

    it('should not create HTTPS listener when HTTPS not configured', () => {
      const listeners = Object.values(synthesized.resource.aws_lb_listener) as any[];
      const httpsListener = listeners.find((l: any) => l.port === 443);
      expect(httpsListener).toBeUndefined();
    });

    it('should create HTTP listener with forward (not redirect) when HTTPS not configured', () => {
      const listeners = Object.values(synthesized.resource.aws_lb_listener) as any[];
      const httpListener = listeners.find((l: any) => l.port === 80);
      expect(httpListener).toBeDefined();
      expect(httpListener.protocol).toBe('HTTP');
      expect(httpListener.default_action[0].type).toBe('forward');
    });

    it('should not create path-based routing rules when HTTPS not configured', () => {
      const rules = synthesized.resource.aws_lb_listener_rule;
      expect(rules).toBeUndefined();
    });
  });

  describe('ECS Task Definition and Service', () => {
    let synthesized: any;

    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-stack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    it('should create ECS task definition', () => {
      const taskDef = Object.values(
        synthesized.resource.aws_ecs_task_definition
      )[0] as any;
      expect(taskDef.family).toBe('payment-app-test');
      expect(taskDef.network_mode).toBe('awsvpc');
      expect(taskDef.requires_compatibilities).toEqual(['FARGATE']);
      expect(taskDef.cpu).toBe('256');
      expect(taskDef.memory).toBe('512');
    });

    it('should create ECS service', () => {
      const service = Object.values(synthesized.resource.aws_ecs_service)[0] as any;
      expect(service.name).toBe('payment-service-test');
      expect(service.desired_count).toBe(3);
      expect(service.platform_version).toBe('LATEST');
      // Note: launch_type should NOT be set when using capacity_provider_strategy
      expect(service.launch_type).toBeUndefined();
    });

    it('should use Fargate Spot capacity provider', () => {
      const service = Object.values(synthesized.resource.aws_ecs_service)[0] as any;
      expect(service.capacity_provider_strategy).toEqual([
        {
          capacity_provider: 'FARGATE_SPOT',
          weight: 100,
          base: 0,
        },
      ]);
    });

    it('should configure network settings', () => {
      const service = Object.values(synthesized.resource.aws_ecs_service)[0] as any;
      expect(service.network_configuration.assign_public_ip).toBe(false);
    });

    it('should enable execute command', () => {
      const service = Object.values(synthesized.resource.aws_ecs_service)[0] as any;
      expect(service.enable_execute_command).toBe(true);
    });

    it('should set health check grace period', () => {
      const service = Object.values(synthesized.resource.aws_ecs_service)[0] as any;
      expect(service.health_check_grace_period_seconds).toBe(60);
    });
  });

  describe('Auto Scaling', () => {
    let synthesized: any;

    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-stack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    it('should create auto scaling target', () => {
      const target = Object.values(
        synthesized.resource.aws_appautoscaling_target
      )[0] as any;
      expect(target.max_capacity).toBe(10);
      expect(target.min_capacity).toBe(3);
      expect(target.scalable_dimension).toBe('ecs:service:DesiredCount');
      expect(target.service_namespace).toBe('ecs');
    });

    it('should create CPU-based auto scaling policy', () => {
      const policy = Object.values(
        synthesized.resource.aws_appautoscaling_policy
      )[0] as any;
      expect(policy.name).toBe('payment-cpu-scaling-test');
      expect(policy.policy_type).toBe('TargetTrackingScaling');
    });

    it('should configure target tracking for CPU utilization', () => {
      const policy = Object.values(
        synthesized.resource.aws_appautoscaling_policy
      )[0] as any;
      const config = policy.target_tracking_scaling_policy_configuration;
      expect(config.target_value).toBe(70.0);
      expect(config.predefined_metric_specification.predefined_metric_type).toBe(
        'ECSServiceAverageCPUUtilization'
      );
      expect(config.scale_in_cooldown).toBe(300);
      expect(config.scale_out_cooldown).toBe(60);
    });
  });

  describe('Outputs', () => {
    let synthesized: any;

    beforeEach(() => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-stack', {
        environmentSuffix: 'test',
        awsRegion: 'us-east-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    it('should output VPC ID', () => {
      expect(synthesized.output['vpc-id']).toBeDefined();
    });

    it('should output public subnet IDs', () => {
      expect(synthesized.output['public-subnet-ids']).toBeDefined();
    });

    it('should output private subnet IDs', () => {
      expect(synthesized.output['private-subnet-ids']).toBeDefined();
    });

    it('should output ALB DNS name', () => {
      expect(synthesized.output['alb-dns-name']).toBeDefined();
    });

    it('should output ALB ARN', () => {
      expect(synthesized.output['alb-arn']).toBeDefined();
    });

    it('should output ECS cluster name', () => {
      expect(synthesized.output['ecs-cluster-name']).toBeDefined();
    });

    it('should output ECS service name', () => {
      expect(synthesized.output['ecs-service-name']).toBeDefined();
    });

    it('should output ECR repository URL', () => {
      expect(synthesized.output['ecr-repository-url']).toBeDefined();
    });

    it('should output RDS endpoint', () => {
      expect(synthesized.output['rds-endpoint']).toBeDefined();
    });

    it('should output database secret ARN', () => {
      expect(synthesized.output['db-secret-arn']).toBeDefined();
    });

    it('should output CloudWatch log group', () => {
      expect(synthesized.output['cloudwatch-log-group']).toBeDefined();
    });

    it('should output AWS account ID', () => {
      expect(synthesized.output['aws-account-id']).toBeDefined();
    });

    it('should output AWS region', () => {
      expect(synthesized.output['aws-region']).toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {
    it('should include environmentSuffix in all resource names', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-stack', {
        environmentSuffix: 'prod123',
      });
      const synthesized = JSON.parse(Testing.synth(stack));

      // Check VPC
      const vpc = Object.values(synthesized.resource.aws_vpc)[0] as any;
      expect(vpc.tags.Name).toContain('prod123');

      // Check Security Groups
      const securityGroups = Object.values(
        synthesized.resource.aws_security_group
      ) as any[];
      securityGroups.forEach((sg: any) => {
        expect(sg.name).toContain('prod123');
      });

      // Check ALB
      const alb = Object.values(synthesized.resource.aws_lb)[0] as any;
      expect(alb.name).toContain('prod123');

      // Check ECS
      const cluster = Object.values(synthesized.resource.aws_ecs_cluster)[0] as any;
      expect(cluster.name).toContain('prod123');

      // Check RDS
      const rds = Object.values(synthesized.resource.aws_db_instance)[0] as any;
      expect(rds.identifier).toContain('prod123');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty environmentSuffix by using default', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-stack', {
        environmentSuffix: '',
      });
      const synthesized = JSON.parse(Testing.synth(stack));

      const vpc = Object.values(synthesized.resource.aws_vpc)[0] as any;
      expect(vpc.tags.Name).toBe('vpc-dev');
    });

    it('should handle undefined props', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-stack', undefined);
      const synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized).toBeDefined();
      expect(synthesized.resource.aws_vpc).toBeDefined();
    });

    it('should handle missing stateBucket by using default', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-stack', {
        environmentSuffix: 'test',
      });
      const synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
    });

    it('should handle AWS_REGION_OVERRIDE being empty string', () => {
      const originalEnv = process.env.AWS_REGION_OVERRIDE;
      process.env.AWS_REGION_OVERRIDE = '';

      const app = Testing.app();
      const stack = new TapStack(app, 'test-stack', {
        awsRegion: 'us-west-2',
      });
      const synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.provider.aws[0].region).toBe('us-west-2');

      if (originalEnv) {
        process.env.AWS_REGION_OVERRIDE = originalEnv;
      } else {
        delete process.env.AWS_REGION_OVERRIDE;
      }
    });
  });

  describe('HTTPS Configuration', () => {
    describe('HTTP Only Mode (enableHttps: false)', () => {
      let synthesized: any;

      beforeEach(() => {
        const app = Testing.app();
        const stack = new TapStack(app, 'test-stack', {
          environmentSuffix: 'test',
          enableHttps: false,
        });
        synthesized = JSON.parse(Testing.synth(stack));
      });

      it('should not create ACM certificate', () => {
        expect(synthesized.resource.aws_acm_certificate).toBeUndefined();
      });

      it('should not create Route53 hosted zone', () => {
        expect(synthesized.resource.aws_route53_zone).toBeUndefined();
      });

      it('should not create Route53 records', () => {
        expect(synthesized.resource.aws_route53_record).toBeUndefined();
      });

      it('should not create HTTPS listener', () => {
        const listeners = Object.values(synthesized.resource.aws_lb_listener) as any[];
        const httpsListener = listeners.find((l: any) => l.port === 443);
        expect(httpsListener).toBeUndefined();
      });

      it('should create HTTP listener with forward action', () => {
        const listeners = Object.values(synthesized.resource.aws_lb_listener) as any[];
        const httpListener = listeners.find((l: any) => l.port === 80);
        expect(httpListener).toBeDefined();
        expect(httpListener.default_action[0].type).toBe('forward');
      });

      it('should not create listener rules for path routing', () => {
        expect(synthesized.resource.aws_lb_listener_rule).toBeUndefined();
      });

      it('should output HTTP URL', () => {
        expect(synthesized.output['application-url']).toBeDefined();
        // URL will contain the ALB DNS name reference
        expect(synthesized.output['application-url'].value).toContain('http://');
      });

      it('should indicate HTTPS is disabled in outputs', () => {
        expect(synthesized.output['https-enabled']).toBeDefined();
        expect(synthesized.output['https-enabled'].value).toBe('false');
      });
    });

    describe('HTTPS with Custom Domain', () => {
      let synthesized: any;

      beforeEach(() => {
        const app = Testing.app();
        const stack = new TapStack(app, 'test-stack', {
          environmentSuffix: 'test',
          enableHttps: true,
          customDomain: 'api.example.com',
        });
        synthesized = JSON.parse(Testing.synth(stack));
      });

      it('should create Route53 hosted zone', () => {
        const hostedZone = Object.values(synthesized.resource.aws_route53_zone)[0] as any;
        expect(hostedZone).toBeDefined();
        expect(hostedZone.name).toBe('example.com');
      });

      it('should create ACM certificate for custom domain', () => {
        const cert = Object.values(synthesized.resource.aws_acm_certificate)[0] as any;
        expect(cert).toBeDefined();
        expect(cert.domain_name).toBe('api.example.com');
        expect(cert.validation_method).toBe('DNS');
      });

      it('should create DNS validation record', () => {
        const records = Object.values(synthesized.resource.aws_route53_record) as any[];
        const validationRecord = records.find((r: any) =>
          r.name && r.name.includes('domain_validation_options')
        );
        expect(validationRecord).toBeDefined();
      });

      it('should create ALB alias record', () => {
        const records = Object.values(synthesized.resource.aws_route53_record) as any[];
        const aliasRecord = records.find((r: any) => r.type === 'A' && r.alias);
        expect(aliasRecord).toBeDefined();
      });

      it('should create HTTPS listener', () => {
        const listeners = Object.values(synthesized.resource.aws_lb_listener) as any[];
        const httpsListener = listeners.find((l: any) => l.port === 443);
        expect(httpsListener).toBeDefined();
        expect(httpsListener.protocol).toBe('HTTPS');
      });

      it('should create HTTP listener with redirect to HTTPS', () => {
        const listeners = Object.values(synthesized.resource.aws_lb_listener) as any[];
        const httpListener = listeners.find((l: any) => l.port === 80);
        expect(httpListener).toBeDefined();
        expect(httpListener.default_action[0].type).toBe('redirect');
        expect(httpListener.default_action[0].redirect.protocol).toBe('HTTPS');
      });

      it('should create path-based routing rules', () => {
        const rules = Object.values(synthesized.resource.aws_lb_listener_rule) as any[];
        expect(rules.length).toBeGreaterThanOrEqual(2);
        const apiRule = rules.find((r: any) => r.priority === 100);
        const adminRule = rules.find((r: any) => r.priority === 101);
        expect(apiRule).toBeDefined();
        expect(adminRule).toBeDefined();
      });

      it('should output hosted zone nameservers', () => {
        expect(synthesized.output['hosted-zone-nameservers']).toBeDefined();
      });

      it('should output HTTPS URL with custom domain', () => {
        expect(synthesized.output['application-url']).toBeDefined();
        expect(synthesized.output['application-url'].value).toBe('https://api.example.com');
      });
    });

    describe('HTTPS with Existing Certificate', () => {
      let synthesized: any;
      const certArn = 'arn:aws:acm:us-east-1:123456789012:certificate/existing-cert';

      beforeEach(() => {
        const app = Testing.app();
        const stack = new TapStack(app, 'test-stack', {
          environmentSuffix: 'test',
          enableHttps: true,
          existingCertificateArn: certArn,
        });
        synthesized = JSON.parse(Testing.synth(stack));
      });

      it('should not create new ACM certificate', () => {
        expect(synthesized.resource.aws_acm_certificate).toBeUndefined();
      });

      it('should not create Route53 hosted zone', () => {
        expect(synthesized.resource.aws_route53_zone).toBeUndefined();
      });

      it('should not create Route53 records', () => {
        expect(synthesized.resource.aws_route53_record).toBeUndefined();
      });

      it('should create HTTPS listener with existing certificate', () => {
        const listeners = Object.values(synthesized.resource.aws_lb_listener) as any[];
        const httpsListener = listeners.find((l: any) => l.port === 443);
        expect(httpsListener).toBeDefined();
        expect(httpsListener.certificate_arn).toBe(certArn);
      });

      it('should create HTTP listener with redirect', () => {
        const listeners = Object.values(synthesized.resource.aws_lb_listener) as any[];
        const httpListener = listeners.find((l: any) => l.port === 80);
        expect(httpListener.default_action[0].type).toBe('redirect');
      });

      it('should indicate HTTPS is enabled', () => {
        expect(synthesized.output['https-enabled'].value).toBe('true');
      });
    });

    describe('Edge Cases for Branch Coverage', () => {
      it('should handle single-part domain correctly', () => {
        const app = Testing.app();
        const stack = new TapStack(app, 'test-stack', {
          environmentSuffix: 'test',
          enableHttps: true,
          customDomain: 'localhost',
        });
        const synthesized = JSON.parse(Testing.synth(stack));

        // Should create hosted zone with the single-part domain as-is
        const hostedZone = Object.values(
          synthesized.resource.aws_route53_zone
        )[0] as any;
        expect(hostedZone).toBeDefined();
        expect(hostedZone.name).toBe('localhost');
      });

      it('should output HTTP URL when custom domain with HTTPS disabled', () => {
        const app = Testing.app();
        const stack = new TapStack(app, 'test-stack', {
          environmentSuffix: 'test',
          enableHttps: false,
          customDomain: 'myapp.example.com',
        });
        const synthesized = JSON.parse(Testing.synth(stack));

        // Should output HTTP URL (not HTTPS) because enableHttps is false
        expect(synthesized.output['application-url']).toBeDefined();
        expect(synthesized.output['application-url'].value).toBe(
          'http://myapp.example.com'
        );
        expect(synthesized.output['https-enabled'].value).toBe('false');
      });
    });
  });
});
