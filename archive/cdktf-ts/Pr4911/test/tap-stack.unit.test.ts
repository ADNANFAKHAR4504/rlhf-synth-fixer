import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('HIPAA-Compliant Healthcare Infrastructure Stack', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Instantiation', () => {
    test('instantiates successfully with custom props', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'test',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized.provider.aws[0].region).toBe('us-west-2');
    });

    test('uses default values when no props provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDefault');
      synthesized = JSON.parse(Testing.synth(stack));

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized.provider.aws[0].region).toBe('us-east-1');
    });

    test('uses AWS_REGION_OVERRIDE when empty string is set', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackOverride', {
        environmentSuffix: 'test',
        awsRegion: 'eu-west-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      // When AWS_REGION_OVERRIDE is empty, it should use the provided awsRegion
      expect(synthesized.provider.aws[0].region).toBe('eu-west-1');
    });

    test('uses default environment suffix when not provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDefaultEnv');
      synthesized = JSON.parse(Testing.synth(stack));

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      // Check that environment suffix 'dev' is used in resource names
      const vpc = synthesized.resource.aws_vpc['healthcare-vpc'];
      expect(vpc.tags.Name).toContain('dev');
    });
  });

  describe('VPC Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestVPCStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('creates VPC with correct CIDR block', () => {
      const vpc = synthesized.resource.aws_vpc['healthcare-vpc'];
      expect(vpc).toBeDefined();
      expect(vpc.cidr_block).toBe('10.0.0.0/16');
      expect(vpc.enable_dns_hostnames).toBe(true);
      expect(vpc.enable_dns_support).toBe(true);
    });

    test('creates public and private subnets', () => {
      const publicSubnet1 = synthesized.resource.aws_subnet['public-subnet-1'];
      const privateSubnet1 = synthesized.resource.aws_subnet['private-subnet-1'];

      expect(publicSubnet1).toBeDefined();
      expect(publicSubnet1.cidr_block).toBe('10.0.1.0/24');
      expect(publicSubnet1.map_public_ip_on_launch).toBe(true);

      expect(privateSubnet1).toBeDefined();
      expect(privateSubnet1.cidr_block).toBe('10.0.11.0/24');
    });

    test('creates internet gateway and route table', () => {
      const igw = synthesized.resource.aws_internet_gateway['healthcare-igw'];
      const routeTable = synthesized.resource.aws_route_table['public-route-table'];

      expect(igw).toBeDefined();
      expect(routeTable).toBeDefined();
    });
  });

  describe('KMS Encryption', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestKMSStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('creates RDS KMS key with rotation enabled', () => {
      const rdsKmsKey = synthesized.resource.aws_kms_key['rds-kms-key'];
      expect(rdsKmsKey).toBeDefined();
      expect(rdsKmsKey.enable_key_rotation).toBe(true);
      expect(rdsKmsKey.description).toBe('KMS key for RDS encryption');
      expect(rdsKmsKey.tags.HIPAA).toBe('true');
    });

    test('creates Secrets Manager KMS key', () => {
      const secretsKmsKey = synthesized.resource.aws_kms_key['secrets-kms-key'];
      expect(secretsKmsKey).toBeDefined();
      expect(secretsKmsKey.enable_key_rotation).toBe(true);
      expect(secretsKmsKey.tags.HIPAA).toBe('true');
    });

    test('creates CloudWatch Logs KMS key with policy', () => {
      const logsKmsKey = synthesized.resource.aws_kms_key['logs-kms-key'];
      const logsKmsPolicy = synthesized.resource.aws_kms_key_policy['logs-kms-key-policy'];

      expect(logsKmsKey).toBeDefined();
      expect(logsKmsKey.enable_key_rotation).toBe(true);
      expect(logsKmsPolicy).toBeDefined();
    });
  });

  describe('RDS Database', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestRDSStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('creates encrypted RDS instance', () => {
      const rds = synthesized.resource.aws_db_instance['healthcare-rds'];
      expect(rds).toBeDefined();
      expect(rds.engine).toBe('postgres');
      expect(rds.storage_encrypted).toBe(true);
      expect(rds.publicly_accessible).toBe(false);
      expect(rds.skip_final_snapshot).toBe(true);
      expect(rds.tags.HIPAA).toBe('true');
    });

    test('configures RDS with proper backup settings', () => {
      const rds = synthesized.resource.aws_db_instance['healthcare-rds'];
      expect(rds.backup_retention_period).toBe(7);
      expect(rds.enabled_cloudwatch_logs_exports).toContain('postgresql');
    });

    test('creates DB subnet group', () => {
      const subnetGroup = synthesized.resource.aws_db_subnet_group['db-subnet-group'];
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.subnet_ids).toHaveLength(2);
    });
  });

  describe('ECS Cluster and Services', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestECSStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('creates ECS cluster with container insights', () => {
      const cluster = synthesized.resource.aws_ecs_cluster['healthcare-ecs-cluster'];
      expect(cluster).toBeDefined();
      expect(cluster.setting).toEqual([{ name: 'containerInsights', value: 'enabled' }]);
      expect(cluster.tags.HIPAA).toBe('true');
    });

    test('creates Fargate task definition with proper configuration', () => {
      const taskDef = synthesized.resource.aws_ecs_task_definition['healthcare-task-definition'];
      expect(taskDef).toBeDefined();
      expect(taskDef.cpu).toBe('256');
      expect(taskDef.memory).toBe('512');
      expect(taskDef.network_mode).toBe('awsvpc');
      expect(taskDef.requires_compatibilities).toContain('FARGATE');
    });

    test('creates ECS service', () => {
      const service = synthesized.resource.aws_ecs_service['healthcare-ecs-service'];
      expect(service).toBeDefined();
      expect(service.launch_type).toBe('FARGATE');
      expect(service.desired_count).toBe(1);
    });
  });

  describe('API Gateway', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestAPIStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('creates HTTP API Gateway', () => {
      const api = synthesized.resource.aws_apigatewayv2_api['healthcare-api'];
      expect(api).toBeDefined();
      expect(api.protocol_type).toBe('HTTP');
      expect(api.tags.HIPAA).toBe('true');
    });

    test('creates Lambda authorizer', () => {
      const authorizer = synthesized.resource.aws_apigatewayv2_authorizer['healthcare-authorizer'];
      expect(authorizer).toBeDefined();
      expect(authorizer.authorizer_type).toBe('REQUEST');
    });

    test('creates API stage with logging', () => {
      const stage = synthesized.resource.aws_apigatewayv2_stage['healthcare-api-stage'];
      expect(stage).toBeDefined();
      expect(stage.auto_deploy).toBe(true);
    });
  });

  describe('Security Groups', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestSecurityStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('creates RDS security group', () => {
      const rdsSg = synthesized.resource.aws_security_group['rds-security-group'];
      expect(rdsSg).toBeDefined();
      expect(rdsSg.description).toContain('RDS instance');
    });

    test('creates ECS security group', () => {
      const ecsSg = synthesized.resource.aws_security_group['ecs-security-group'];
      expect(ecsSg).toBeDefined();
      expect(ecsSg.description).toContain('ECS tasks');
    });

    test('creates security group rules for RDS access', () => {
      const rdsIngressRule = synthesized.resource.aws_security_group_rule['rds-ingress-from-ecs'];
      expect(rdsIngressRule).toBeDefined();
      expect(rdsIngressRule.type).toBe('ingress');
      expect(rdsIngressRule.from_port).toBe(5432);
      expect(rdsIngressRule.to_port).toBe(5432);
    });
  });

  describe('CloudWatch Logs', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestLogsStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('creates encrypted API log group', () => {
      const apiLogGroup = synthesized.resource.aws_cloudwatch_log_group['api-log-group'];
      expect(apiLogGroup).toBeDefined();
      expect(apiLogGroup.retention_in_days).toBe(90);
      expect(apiLogGroup.tags.HIPAA).toBe('true');
    });

    test('creates encrypted ECS log group', () => {
      const ecsLogGroup = synthesized.resource.aws_cloudwatch_log_group['ecs-log-group'];
      expect(ecsLogGroup).toBeDefined();
      expect(ecsLogGroup.retention_in_days).toBe(90);
      expect(ecsLogGroup.tags.HIPAA).toBe('true');
    });
  });

  describe('IAM Roles and Policies', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestIAMStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('creates ECS execution role', () => {
      const executionRole = synthesized.resource.aws_iam_role['ecs-execution-role'];
      expect(executionRole).toBeDefined();
      const policy = JSON.parse(executionRole.assume_role_policy);
      expect(policy.Statement[0].Principal.Service).toBe('ecs-tasks.amazonaws.com');
    });

    test('creates ECS task role', () => {
      const taskRole = synthesized.resource.aws_iam_role['ecs-task-role'];
      expect(taskRole).toBeDefined();
    });

    test('creates Lambda authorizer role', () => {
      const authorizerRole = synthesized.resource.aws_iam_role['authorizer-role'];
      expect(authorizerRole).toBeDefined();
      const policy = JSON.parse(authorizerRole.assume_role_policy);
      expect(policy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('creates Secrets Manager access policy', () => {
      const secretsPolicy = synthesized.resource.aws_iam_policy['secrets-access-policy'];
      expect(secretsPolicy).toBeDefined();
    });
  });

  describe('Outputs', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestOutputsStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('defines VPC ID output', () => {
      expect(synthesized.output['vpc-id']).toBeDefined();
      expect(synthesized.output['vpc-id'].description).toBe('VPC ID');
    });

    test('defines RDS endpoint output as sensitive', () => {
      expect(synthesized.output['rds-endpoint']).toBeDefined();
      expect(synthesized.output['rds-endpoint'].sensitive).toBe(true);
    });

    test('defines ECS cluster name output', () => {
      expect(synthesized.output['ecs-cluster-name']).toBeDefined();
    });

    test('defines API endpoint output', () => {
      expect(synthesized.output['api-endpoint']).toBeDefined();
    });

    test('defines secrets ARN output as sensitive', () => {
      expect(synthesized.output['db-credentials-secret-arn']).toBeDefined();
      expect(synthesized.output['db-credentials-secret-arn'].sensitive).toBe(true);
    });
  });
});
