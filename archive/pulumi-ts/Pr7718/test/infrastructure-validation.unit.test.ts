/**
 * Infrastructure validation unit tests
 * Validates infrastructure code structure and configuration
 */

import * as fs from 'fs';
import * as path from 'path';

const INFRA_FILE_PATH = path.join(__dirname, '../lib/index.ts');
const infraCode = fs.readFileSync(INFRA_FILE_PATH, 'utf-8');

describe('Infrastructure Code Validation', () => {
  describe('Imports and Dependencies', () => {
    it('should import required Pulumi packages', () => {
      expect(infraCode).toContain("import * as pulumi from '@pulumi/pulumi'");
      expect(infraCode).toContain("import * as aws from '@pulumi/aws'");
    });

    it('should initialize Pulumi Config', () => {
      expect(infraCode).toContain('new pulumi.Config()');
      expect(infraCode).toContain("config.get('environmentSuffix')");
      expect(infraCode).toContain('pulumi.getStack()');
    });
  });

  describe('Configuration Constants', () => {
    it('should define baseline CPU value', () => {
      expect(infraCode).toContain('const cpu = 2048');
      expect(infraCode).toMatch(/cpu.*2048.*BASELINE/);
    });

    it('should define baseline memory value', () => {
      expect(infraCode).toContain('const memory = 4096');
      expect(infraCode).toMatch(/memory.*4096.*BASELINE/);
    });

    it('should define baseline log retention', () => {
      expect(infraCode).toContain('retentionInDays: 14');
      expect(infraCode).toMatch(/retentionInDays:\s*14.*BASELINE/);
    });

    it('should define baseline desired count', () => {
      expect(infraCode).toContain('desiredCount: 3');
      expect(infraCode).toMatch(/desiredCount:\s*3.*BASELINE/);
    });

    it('should define container port', () => {
      expect(infraCode).toContain('const containerPort = 3000');
    });

    it('should define common tags', () => {
      expect(infraCode).toContain('const commonTags');
      expect(infraCode).toContain("Environment: environmentSuffix");
      expect(infraCode).toContain("Team: 'platform'");
      expect(infraCode).toContain("CostCenter: 'engineering'");
      expect(infraCode).toContain("ManagedBy: 'pulumi'");
    });
  });

  describe('ECR Repository', () => {
    it('should create ECR repository with environmentSuffix', () => {
      expect(infraCode).toContain('new aws.ecr.Repository');
      expect(infraCode).toContain('app-repo-${environmentSuffix}');
    });

    it('should configure image scanning', () => {
      expect(infraCode).toContain('imageScanningConfiguration');
      expect(infraCode).toContain('scanOnPush: true');
    });

    it('should set image tag mutability', () => {
      expect(infraCode).toContain("imageTagMutability: 'MUTABLE'");
    });

    it('should apply common tags to ECR', () => {
      const ecrBlock = infraCode.substring(
        infraCode.indexOf('new aws.ecr.Repository'),
        infraCode.indexOf('new aws.ecr.Repository') + 300
      );
      expect(ecrBlock).toContain('tags: commonTags');
    });
  });

  describe('CloudWatch Log Group', () => {
    it('should create log group with correct name pattern', () => {
      expect(infraCode).toContain('new aws.cloudwatch.LogGroup');
      expect(infraCode).toContain('/ecs/fargate-app-${environmentSuffix}');
    });

    it('should set retention to 14 days (baseline)', () => {
      const logGroupBlock = infraCode.substring(
        infraCode.indexOf('new aws.cloudwatch.LogGroup'),
        infraCode.indexOf('new aws.cloudwatch.LogGroup') + 300
      );
      expect(logGroupBlock).toContain('retentionInDays: 14');
    });

    it('should apply common tags to log group', () => {
      const logGroupBlock = infraCode.substring(
        infraCode.indexOf('new aws.cloudwatch.LogGroup'),
        infraCode.indexOf('new aws.cloudwatch.LogGroup') + 300
      );
      expect(logGroupBlock).toContain('tags: commonTags');
    });
  });

  describe('IAM Roles', () => {
    it('should create task execution role', () => {
      expect(infraCode).toContain('new aws.iam.Role');
      expect(infraCode).toContain('ecs-task-execution-${environmentSuffix}');
    });

    it('should create task role', () => {
      expect(infraCode).toContain('ecs-task-${environmentSuffix}');
    });

    it('should use correct assume role policy', () => {
      expect(infraCode).toContain('aws.iam.assumeRolePolicyForPrincipal');
      expect(infraCode).toContain("Service: 'ecs-tasks.amazonaws.com'");
    });

    it('should attach ECR read-only policy', () => {
      expect(infraCode).toContain('new aws.iam.RolePolicyAttachment');
      expect(infraCode).toContain('AmazonEC2ContainerRegistryReadOnly');
    });

    it('should attach CloudWatch logs policy', () => {
      expect(infraCode).toContain('CloudWatchLogsFullAccess');
    });
  });

  describe('VPC and Networking', () => {
    it('should use default VPC', () => {
      expect(infraCode).toContain('aws.ec2.getVpc');
      expect(infraCode).toContain('default: true');
    });

    it('should get default subnets', () => {
      expect(infraCode).toContain('aws.ec2.getSubnets');
      expect(infraCode).toContain("name: 'vpc-id'");
    });

    it('should create ALB security group', () => {
      expect(infraCode).toContain('new aws.ec2.SecurityGroup');
      expect(infraCode).toContain('alb-sg-${environmentSuffix}');
    });

    it('should create ECS security group', () => {
      expect(infraCode).toContain('ecs-sg-${environmentSuffix}');
    });

    it('should configure ALB ingress on port 80', () => {
      expect(infraCode).toContain('fromPort: 80');
      expect(infraCode).toContain('toPort: 80');
    });

    it('should configure ECS ingress on container port', () => {
      expect(infraCode).toContain('fromPort: containerPort');
      expect(infraCode).toContain('toPort: containerPort');
    });
  });

  describe('Application Load Balancer', () => {
    it('should create ALB', () => {
      expect(infraCode).toContain('new aws.lb.LoadBalancer');
      expect(infraCode).toContain('app-alb-${environmentSuffix}');
    });

    it('should set ALB as internet-facing', () => {
      expect(infraCode).toContain('internal: false');
    });

    it('should set ALB type to application', () => {
      expect(infraCode).toContain("loadBalancerType: 'application'");
    });

    it('should disable deletion protection', () => {
      expect(infraCode).toContain('enableDeletionProtection: false');
    });
  });

  describe('Target Group', () => {
    it('should create target group', () => {
      expect(infraCode).toContain('new aws.lb.TargetGroup');
      expect(infraCode).toContain('app-tg-${environmentSuffix}');
    });

    it('should set target type to ip', () => {
      expect(infraCode).toContain("targetType: 'ip'");
    });

    it('should configure health check on port 3000', () => {
      expect(infraCode).toContain('port: String(containerPort)');
      expect(infraCode).toContain("// Fixed: was 8080, now 3000");
    });

    it('should configure health check path', () => {
      expect(infraCode).toContain("path: '/health'");
    });

    it('should configure health check protocol', () => {
      const healthCheckBlock = infraCode.substring(
        infraCode.indexOf('healthCheck:'),
        infraCode.indexOf('healthCheck:') + 400
      );
      expect(healthCheckBlock).toContain("protocol: 'HTTP'");
    });

    it('should configure health check interval and timeout', () => {
      expect(infraCode).toContain('interval: 30');
      expect(infraCode).toContain('timeout: 5');
      expect(infraCode).toContain('healthyThreshold: 2');
      expect(infraCode).toContain('unhealthyThreshold: 3');
    });
  });

  describe('ALB Listener', () => {
    it('should create ALB listener', () => {
      expect(infraCode).toContain('new aws.lb.Listener');
      expect(infraCode).toContain('app-listener-${environmentSuffix}');
    });

    it('should listen on port 80', () => {
      expect(infraCode).toContain('port: 80');
    });

    it('should use HTTP protocol', () => {
      const listenerBlock = infraCode.substring(
        infraCode.indexOf('new aws.lb.Listener'),
        infraCode.indexOf('new aws.lb.Listener') + 400
      );
      expect(listenerBlock).toContain("protocol: 'HTTP'");
    });

    it('should forward to target group', () => {
      expect(infraCode).toContain("type: 'forward'");
      expect(infraCode).toContain('targetGroupArn: targetGroup.arn');
    });
  });

  describe('ECS Cluster', () => {
    it('should create ECS cluster', () => {
      expect(infraCode).toContain('new aws.ecs.Cluster');
      expect(infraCode).toContain('app-cluster-${environmentSuffix}');
    });

    it('should enable Container Insights', () => {
      expect(infraCode).toContain("name: 'containerInsights'");
      expect(infraCode).toContain("value: 'enabled'");
    });
  });

  describe('ECS Task Definition', () => {
    it('should create task definition', () => {
      expect(infraCode).toContain('new aws.ecs.TaskDefinition');
      expect(infraCode).toContain('app-task-${environmentSuffix}');
    });

    it('should use FARGATE', () => {
      expect(infraCode).toContain("requiresCompatibilities: ['FARGATE']");
    });

    it('should use awsvpc network mode', () => {
      expect(infraCode).toContain("networkMode: 'awsvpc'");
    });

    it('should set CPU and memory', () => {
      expect(infraCode).toContain('cpu: String(cpu)');
      expect(infraCode).toContain('memory: String(memory)');
    });

    it('should reference execution and task roles', () => {
      expect(infraCode).toContain('executionRoleArn: taskExecutionRole.arn');
      expect(infraCode).toContain('taskRoleArn: taskRole.arn');
    });

    it('should use container definitions with interpolation', () => {
      expect(infraCode).toContain('containerDefinitions: pulumi.interpolate');
    });

    it('should reference ECR repository URL', () => {
      expect(infraCode).toContain('${ecrRepository.repositoryUrl}:latest');
    });

    it('should configure container port mapping', () => {
      expect(infraCode).toContain('"containerPort": ${containerPort}');
    });

    it('should configure log driver', () => {
      expect(infraCode).toContain('"logDriver": "awslogs"');
      expect(infraCode).toContain('"awslogs-group": "${logGroup.name}"');
    });
  });

  describe('ECS Service', () => {
    it('should create ECS service', () => {
      expect(infraCode).toContain('new aws.ecs.Service');
      expect(infraCode).toContain('app-service-${environmentSuffix}');
    });

    it('should set desired count to 3 (baseline)', () => {
      expect(infraCode).toContain('desiredCount: 3');
    });

    it('should use FARGATE launch type', () => {
      const serviceBlock = infraCode.substring(
        infraCode.indexOf('new aws.ecs.Service'),
        infraCode.indexOf('new aws.ecs.Service') + 800
      );
      expect(serviceBlock).toContain("launchType: 'FARGATE'");
    });

    it('should assign public IP', () => {
      expect(infraCode).toContain('assignPublicIp: true');
    });

    it('should configure load balancer', () => {
      expect(infraCode).toContain('loadBalancers:');
      expect(infraCode).toContain('targetGroupArn: targetGroup.arn');
      expect(infraCode).toContain("containerName: 'app-container'");
    });

    it('should enable execute command', () => {
      expect(infraCode).toContain('enableExecuteCommand: true');
    });

    it('should depend on ALB listener', () => {
      expect(infraCode).toContain('dependsOn: [albListener]');
    });
  });

  describe('Auto Scaling', () => {
    it('should create scaling target', () => {
      expect(infraCode).toContain('new aws.appautoscaling.Target');
      expect(infraCode).toContain('ecs-target-${environmentSuffix}');
    });

    it('should set capacity limits', () => {
      expect(infraCode).toContain('maxCapacity: 10');
      expect(infraCode).toContain('minCapacity: 2');
    });

    it('should configure resource ID', () => {
      expect(infraCode).toContain('resourceId: pulumi.interpolate`service/${ecsCluster.name}/${ecsService.name}`');
    });

    it('should set scalable dimension', () => {
      expect(infraCode).toContain("scalableDimension: 'ecs:service:DesiredCount'");
    });

    it('should create scaling policy', () => {
      expect(infraCode).toContain('new aws.appautoscaling.Policy');
      expect(infraCode).toContain('ecs-scaling-${environmentSuffix}');
    });

    it('should use target tracking policy', () => {
      expect(infraCode).toContain("policyType: 'TargetTrackingScaling'");
    });

    it('should target 70% CPU utilization', () => {
      expect(infraCode).toContain('targetValue: 70.0');
    });

    it('should use CPU utilization metric', () => {
      expect(infraCode).toContain("predefinedMetricType: 'ECSServiceAverageCPUUtilization'");
    });

    it('should configure cooldown periods', () => {
      expect(infraCode).toContain('scaleInCooldown: 300');
      expect(infraCode).toContain('scaleOutCooldown: 60');
    });
  });

  describe('Stack Exports', () => {
    it('should export serviceUrl', () => {
      expect(infraCode).toContain('export const serviceUrl');
      expect(infraCode).toContain('pulumi.interpolate`http://${alb.dnsName}`');
    });

    it('should export taskDefinitionArn', () => {
      expect(infraCode).toContain('export const taskDefinitionArn = taskDefinition.arn');
    });

    it('should export ecrRepositoryUrl', () => {
      expect(infraCode).toContain('export const ecrRepositoryUrl = ecrRepository.repositoryUrl');
    });

    it('should export clusterName', () => {
      expect(infraCode).toContain('export const clusterName = ecsCluster.name');
    });

    it('should export serviceName', () => {
      expect(infraCode).toContain('export const serviceName = ecsService.name');
    });
  });

  describe('Optimization Markers', () => {
    it('should mark CPU as BASELINE', () => {
      expect(infraCode).toContain('// BASELINE - will be optimized by optimize.py to 512');
    });

    it('should mark memory as BASELINE', () => {
      expect(infraCode).toContain('// BASELINE - will be optimized by optimize.py to 1024');
    });

    it('should mark log retention as BASELINE', () => {
      expect(infraCode).toContain('// BASELINE - will be optimized by optimize.py to 7 days');
    });

    it('should mark desired count as BASELINE', () => {
      expect(infraCode).toContain('// BASELINE - will be optimized by optimize.py to 2 tasks');
    });
  });

  describe('Code Quality', () => {
    it('should not have console.log statements', () => {
      expect(infraCode).not.toMatch(/console\.log/);
    });

    it('should not have hardcoded account IDs', () => {
      expect(infraCode).not.toMatch(/\b\d{12}\b/);
    });

    it('should not have hardcoded regions (except in comments)', () => {
      const codeWithoutComments = infraCode.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      expect(codeWithoutComments).not.toMatch(/us-east-1|us-west-2|eu-west-1/);
    });

    it('should use template literals for resource names', () => {
      expect(infraCode).toContain('${environmentSuffix}');
    });

    it('should apply tags to all resources', () => {
      // Count resource creations
      const resourceMatches = infraCode.match(/new aws\.\w+\.\w+/g) || [];
      const tagsMatches = infraCode.match(/tags: commonTags/g) || [];

      // Most resources should have tags (some like policy attachments don't support tags)
      expect(tagsMatches.length).toBeGreaterThan(10);
    });
  });
});
