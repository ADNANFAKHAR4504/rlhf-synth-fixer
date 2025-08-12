import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let stack: TapStack;
  const environmentSuffix = 'test';
  const region = 'us-east-1';

  beforeEach(() => {
    const app = Testing.app();
    stack = new TapStack(app, 'test-tap-stack', {
      region: region,
      environmentSuffix: environmentSuffix,
      tags: {
        Environment: environmentSuffix,
        Repository: 'test-repo',
        Author: 'test-user',
      },
    });
  });

  describe('Stack Configuration', () => {
    it('should create a TapStack with correct configuration', () => {
      expect(stack).toBeInstanceOf(TapStack);
      expect(stack.vpcId).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.rdsEndpoint).toBeDefined();
    });
  });

  describe('VPC Resources', () => {
    it('should create a VPC with correct CIDR block', () => {
      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      // Check VPC creation
      const vpc = Object.values(resources.aws_vpc || {})[0] as any;
      expect(vpc).toBeDefined();
      expect(vpc.cidr_block).toBe('10.0.0.0/16');
      expect(vpc.enable_dns_hostnames).toBe(true);
      expect(vpc.enable_dns_support).toBe(true);
      expect(vpc.tags.Name).toContain(
        `prod-${environmentSuffix}-vpc-${region}`
      );
    });

    it('should create public subnets with correct configuration', () => {
      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const subnets = resources.aws_subnet || {};
      const publicSubnets = Object.entries(subnets).filter(([key, _]) =>
        key.includes('public-subnet')
      );

      expect(publicSubnets).toHaveLength(2);

      publicSubnets.forEach(([key, subnet]: [string, any]) => {
        expect(subnet.map_public_ip_on_launch).toBe(true);
        expect(subnet.tags.Type).toBe('Public');
        expect(subnet.tags.Name).toContain(
          `prod-${environmentSuffix}-public-subnet`
        );
      });
    });

    it('should create private subnets with correct configuration', () => {
      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const subnets = resources.aws_subnet || {};
      const privateSubnets = Object.entries(subnets).filter(([key, _]) =>
        key.includes('private-subnet')
      );

      expect(privateSubnets).toHaveLength(2);

      privateSubnets.forEach(([key, subnet]: [string, any]) => {
        expect(subnet.map_public_ip_on_launch).toBeUndefined();
        expect(subnet.tags.Type).toBe('Private');
        expect(subnet.tags.Name).toContain(
          `prod-${environmentSuffix}-private-subnet`
        );
      });
    });
    it('should work when tags are not provided (uses default empty object)', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-tap-stack-no-tags', {
        region: 'us-east-1',
        environmentSuffix: 'test',
        // tags intentionally omitted
      });

      // Just validate that the stack can be synthesized without errors
      expect(stack).toBeDefined();

      const synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      // Terraform resources live under `parsed.resource`
      const resources = parsed.resource || {};
      const vpcResources = resources.aws_vpc || {};

      // Get the first VPC resource (if any)
      const vpc = Object.values(vpcResources)[0] as
        | { tags?: { Name?: string } }
        | undefined;

      expect(vpc).toBeTruthy();
      expect(vpc?.tags?.Name).toContain('prod-test-vpc-us-east-1');
    });

    it('should create internet gateway with correct configuration', () => {
      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const igws = resources.aws_internet_gateway || {};
      const igwKeys = Object.keys(igws);

      expect(igwKeys).toHaveLength(1);
      const igw = igws[igwKeys[0]];
      expect(igw.tags.Name).toContain(
        `prod-${environmentSuffix}-igw-${region}`
      );
    });

    it('should create NAT gateways for private subnets', () => {
      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const natGateways = resources.aws_nat_gateway || {};
      expect(Object.keys(natGateways)).toHaveLength(2);

      Object.values(natGateways).forEach((nat: any) => {
        expect(nat.tags.Name).toContain(`prod-${environmentSuffix}-nat-gw`);
      });
    });
  });

  describe('Security Groups', () => {
    it('should create ALB security group with HTTP/HTTPS access', () => {
      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const securityGroups = resources.aws_security_group || {};
      const albSg = Object.entries(securityGroups).find(([key, _]) =>
        key.includes('alb-sg')
      );

      expect(albSg).toBeDefined();
      const [_, sgConfig] = albSg!;
      const sg = sgConfig as any;

      expect(sg.description).toBe(
        'Security group for Application Load Balancer'
      );
      expect(sg.ingress).toHaveLength(2);

      const httpRule = sg.ingress.find((rule: any) => rule.from_port === 80);
      const httpsRule = sg.ingress.find((rule: any) => rule.from_port === 443);

      expect(httpRule).toBeDefined();
      expect(httpRule.protocol).toBe('tcp');
      expect(httpRule.cidr_blocks).toEqual(['0.0.0.0/0']);

      expect(httpsRule).toBeDefined();
      expect(httpsRule.protocol).toBe('tcp');
      expect(httpsRule.cidr_blocks).toEqual(['0.0.0.0/0']);
    });

    it('should create EC2 security group with SSH and HTTP from ALB', () => {
      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const securityGroups = resources.aws_security_group || {};
      const ec2Sg = Object.entries(securityGroups).find(([key, _]) =>
        key.includes('ec2-sg')
      );

      expect(ec2Sg).toBeDefined();
      const [_, sgConfig] = ec2Sg!;
      const sg = sgConfig as any;

      expect(sg.description).toBe('Security group for EC2 instances');
      expect(sg.ingress).toHaveLength(2);

      const sshRule = sg.ingress.find((rule: any) => rule.from_port === 22);
      const httpRule = sg.ingress.find((rule: any) => rule.from_port === 80);

      expect(sshRule).toBeDefined();
      expect(sshRule.protocol).toBe('tcp');
      expect(sshRule.cidr_blocks).toEqual(['0.0.0.0/0']);

      expect(httpRule).toBeDefined();
      expect(httpRule.protocol).toBe('tcp');
      expect(httpRule.security_groups).toBeDefined();
    });

    it('should create RDS security group with MySQL access from EC2', () => {
      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const securityGroups = resources.aws_security_group || {};
      const rdsSg = Object.entries(securityGroups).find(([key, _]) =>
        key.includes('rds-sg')
      );

      expect(rdsSg).toBeDefined();
      const [_, sgConfig] = rdsSg!;
      const sg = sgConfig as any;

      expect(sg.description).toBe('Security group for RDS database');
      expect(sg.ingress).toHaveLength(1);

      const mysqlRule = sg.ingress[0];
      expect(mysqlRule.from_port).toBe(3306);
      expect(mysqlRule.to_port).toBe(3306);
      expect(mysqlRule.protocol).toBe('tcp');
      expect(mysqlRule.security_groups).toBeDefined();
    });
  });

  describe('Compute Resources', () => {
    it('should create EC2 instances in public subnets', () => {
      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const instances = resources.aws_instance || {};
      const appServers = Object.entries(instances).filter(([key, _]) =>
        key.includes('app-server')
      );

      expect(appServers).toHaveLength(2);

      appServers.forEach(([key, instance]: [string, any]) => {
        expect(instance.instance_type).toBe('t3.micro');
        expect(instance.user_data).toContain('#!/bin/bash');
        expect(instance.user_data).toContain('yum install -y httpd');
        expect(instance.tags.Name).toContain(
          `prod-${environmentSuffix}-app-server`
        );
      });
    });

    it('should create RDS instance with correct configuration', () => {
      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const rdsInstances = resources.aws_db_instance || {};
      const dbKeys = Object.keys(rdsInstances);

      expect(dbKeys).toHaveLength(1);
      const rdsInstance = rdsInstances[dbKeys[0]];

      expect(rdsInstance.engine).toBe('mysql');
      expect(rdsInstance.engine_version).toBe('8.0');
      expect(rdsInstance.instance_class).toBe('db.t3.micro');
      expect(rdsInstance.allocated_storage).toBe(20);
      expect(rdsInstance.db_name).toBe('appdb');
      expect(rdsInstance.username).toBe('admin');
      expect(rdsInstance.storage_encrypted).toBe(true);
      expect(rdsInstance.backup_retention_period).toBe(7);
      expect(rdsInstance.skip_final_snapshot).toBe(true);
      expect(rdsInstance.deletion_protection).toBe(false);
    });
  });

  describe('Load Balancer Resources', () => {
    it('should create Application Load Balancer', () => {
      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const loadBalancers = resources.aws_lb || {};
      const albKeys = Object.keys(loadBalancers);

      expect(albKeys).toHaveLength(1);
      const alb = loadBalancers[albKeys[0]];

      expect(alb.internal).toBe(false);
      expect(alb.load_balancer_type).toBe('application');
      expect(alb.enable_deletion_protection).toBe(false);
      expect(alb.tags.Name).toContain(
        `prod-${environmentSuffix}-alb-${region}`
      );
    });

    it('should create target group with health checks', () => {
      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const targetGroups = resources.aws_lb_target_group || {};
      const tgKeys = Object.keys(targetGroups);

      expect(tgKeys).toHaveLength(1);
      const tg = targetGroups[tgKeys[0]];

      expect(tg.port).toBe(80);
      expect(tg.protocol).toBe('HTTP');
      expect(tg.health_check.enabled).toBe(true);
      expect(tg.health_check.healthy_threshold).toBe(2);
      expect(tg.health_check.interval).toBe(30);
      expect(tg.health_check.matcher).toBe('200');
      expect(tg.health_check.path).toBe('/');
    });

    it('should create target group attachments', () => {
      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const attachments = resources.aws_lb_target_group_attachment || {};
      expect(Object.keys(attachments)).toHaveLength(2);

      Object.values(attachments).forEach((attachment: any) => {
        expect(attachment.port).toBe(80);
      });
    });
  });

  describe('IAM Resources', () => {
    it('should create EC2 IAM role with correct permissions', () => {
      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const iamRoles = resources.aws_iam_role || {};
      const ec2Role = Object.entries(iamRoles).find(([key, _]) =>
        key.includes('ec2-role')
      );

      expect(ec2Role).toBeDefined();
      const [_, roleConfig] = ec2Role!;
      const role = roleConfig as any;

      const assumeRolePolicy = JSON.parse(role.assume_role_policy);
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe(
        'ec2.amazonaws.com'
      );
      expect(role.tags.Name).toContain(`prod-${environmentSuffix}-ec2-role`);
    });

    it('should attach CloudWatch and SSM policies to EC2 role', () => {
      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const policyAttachments = resources.aws_iam_role_policy_attachment || {};
      const attachmentKeys = Object.keys(policyAttachments);

      expect(attachmentKeys.length).toBeGreaterThanOrEqual(2);

      const cloudWatchAttachment = Object.entries(policyAttachments).find(
        ([key, _]) => key.includes('cloudwatch-policy')
      );
      const ssmAttachment = Object.entries(policyAttachments).find(([key, _]) =>
        key.includes('ssm-policy')
      );

      expect(cloudWatchAttachment).toBeDefined();
      expect(ssmAttachment).toBeDefined();

      const [_, cwConfig] = cloudWatchAttachment!;
      const [__, ssmConfig] = ssmAttachment!;

      expect((cwConfig as any).policy_arn).toBe(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
      expect((ssmConfig as any).policy_arn).toBe(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
    });
  });

  describe('Secrets Manager', () => {
    it('should create database secret in Secrets Manager', () => {
      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const secrets = resources.aws_secretsmanager_secret || {};
      const secretKeys = Object.keys(secrets);

      expect(secretKeys).toHaveLength(1);
      const secret = secrets[secretKeys[0]];

      expect(secret.description).toBe('Database credentials for RDS instance');
      expect(secret.tags.Name).toContain(
        `prod-${environmentSuffix}-db-credentials`
      );
    });

    it('should create secret version with credentials', () => {
      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const secretVersions = resources.aws_secretsmanager_secret_version || {};
      const versionKeys = Object.keys(secretVersions);

      expect(versionKeys).toHaveLength(1);
      const version = secretVersions[versionKeys[0]];

      const secretString = JSON.parse(version.secret_string);
      expect(secretString.username).toBe('admin');
      expect(secretString.password).toBeDefined();
    });
  });

  describe('CloudWatch Resources', () => {
    it('should create CloudWatch log groups', () => {
      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const logGroups = resources.aws_cloudwatch_log_group || {};
      const logGroupKeys = Object.keys(logGroups);

      expect(logGroupKeys.length).toBeGreaterThanOrEqual(2);

      const ec2LogGroup = Object.entries(logGroups).find(([key, _]) =>
        key.includes('ec2-log-group')
      );
      const rdsLogGroup = Object.entries(logGroups).find(([key, _]) =>
        key.includes('rds-log-group')
      );

      expect(ec2LogGroup).toBeDefined();
      expect(rdsLogGroup).toBeDefined();

      const [_, ec2Config] = ec2LogGroup!;
      const [__, rdsConfig] = rdsLogGroup!;

      expect((ec2Config as any).retention_in_days).toBe(7);
      expect((rdsConfig as any).retention_in_days).toBe(7);
    });
  });

  describe('Resource Naming', () => {
    it('should prefix all resources with "prod-" followed by environment suffix', () => {
      const synthesized = Testing.synth(stack);
      const resources = JSON.parse(synthesized).resource;

      const resourceTypes = Object.keys(resources);
      expect(resourceTypes.length).toBeGreaterThan(0);

      resourceTypes.forEach(resourceType => {
        const resourceInstances = resources[resourceType];
        Object.values(resourceInstances).forEach((resource: any) => {
          if (resource.tags && resource.tags.Name) {
            expect(resource.tags.Name).toMatch(/^prod-test-/);
          }
          if (resource.name) {
            // CloudWatch log group names start with '/', so we need to handle them differently
            if (resource.name.startsWith('/')) {
              expect(resource.name).toContain('prod-test-');
            } else {
              expect(resource.name).toMatch(/^prod-test-/);
            }
          }
          if (resource.identifier) {
            expect(resource.identifier).toMatch(/^prod-test-/);
          }
        });
      });
    });
  });
});
