import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
      stateBucket: 'test-state-bucket',
      stateBucketRegion: 'us-east-1',
      awsRegion: 'us-east-1',
    });
    synthesized = JSON.parse(Testing.synth(stack));
  });

  describe('Stack Structure', () => {
    test('should instantiate successfully with props', () => {
      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized.resource).toBeDefined();
    });

    test('should use default values when no props provided', () => {
      const defaultStack = new TapStack(app, 'DefaultStack');
      const defaultSynthesized = JSON.parse(Testing.synth(defaultStack));
      
      expect(defaultStack).toBeDefined();
      expect(defaultSynthesized).toBeDefined();
    });

    test('should have terraform backend configuration', () => {
      expect(synthesized.terraform.backend).toBeDefined();
      expect(synthesized.terraform.backend.s3).toBeDefined();
      expect(synthesized.terraform.backend.s3.bucket).toBe('test-state-bucket');
      expect(synthesized.terraform.backend.s3.key).toBe('test/TestTapStack.tfstate');
    });
  });

  describe('VPC Resources', () => {
    test('should create VPC with correct CIDR and DNS settings', () => {
      const vpc = Object.values(synthesized.resource.aws_vpc)[0] as any;
      
      expect(vpc.cidr_block).toBe('10.0.0.0/16');
      expect(vpc.enable_dns_hostnames).toBe(true);
      expect(vpc.enable_dns_support).toBe(true);
      expect(vpc.tags.Name).toBe('tap-vpc-test');
    });

    test('should create public subnets with correct configuration', () => {
      const subnets = Object.values(synthesized.resource.aws_subnet).filter(
        (subnet: any) => subnet.map_public_ip_on_launch === true
      );
      
      expect(subnets).toHaveLength(2);
      subnets.forEach((subnet: any) => {
        expect(subnet.cidr_block).toMatch(/^10\.0\.[12]\.0\/24$/);
        expect(subnet.availability_zone).toMatch(/^us-east-1[ab]$/);
        expect(subnet.tags.Type).toBe('Public');
      });
    });

    test('should create private subnets with correct configuration', () => {
      const subnets = Object.values(synthesized.resource.aws_subnet).filter(
        (subnet: any) => subnet.map_public_ip_on_launch !== true
      );
      
      expect(subnets).toHaveLength(2);
      subnets.forEach((subnet: any) => {
        expect(subnet.cidr_block).toMatch(/^10\.0\.(10|20)\.0\/24$/);
        expect(subnet.availability_zone).toMatch(/^us-east-1[ab]$/);
        expect(subnet.tags.Type).toBe('Private');
      });
    });

    test('should create internet gateway and NAT gateways', () => {
      const igw = Object.values(synthesized.resource.aws_internet_gateway)[0];
      const natGateways = Object.values(synthesized.resource.aws_nat_gateway);
      const eips = Object.values(synthesized.resource.aws_eip);
      
      expect(igw).toBeDefined();
      expect(natGateways).toHaveLength(2);
      expect(eips).toHaveLength(2);
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group with HTTPS access', () => {
      const securityGroups = Object.values(synthesized.resource.aws_security_group);
      const securityGroupRules = Object.values(synthesized.resource.aws_security_group_rule);
      
      const httpsRule = securityGroupRules.find((rule: any) => 
        rule.from_port === 443 && rule.to_port === 443 && rule.type === 'ingress'
      );
      
      expect(httpsRule).toBeDefined();
      expect((httpsRule as any).cidr_blocks).toContain('0.0.0.0/0');
    });

    test('should create EC2 security group with restricted access', () => {
      const securityGroupRules = Object.values(synthesized.resource.aws_security_group_rule);
      
      const sshRule = securityGroupRules.find((rule: any) => 
        rule.from_port === 22 && rule.to_port === 22 && rule.type === 'ingress'
      );
      
      expect(sshRule).toBeDefined();
      expect((sshRule as any).cidr_blocks).toContain('10.0.0.0/16');
    });

    test('should create RDS security group with database port access', () => {
      const securityGroupRules = Object.values(synthesized.resource.aws_security_group_rule);
      
      const mysqlRule = securityGroupRules.find((rule: any) => 
        rule.from_port === 3306 && rule.to_port === 3306 && rule.type === 'ingress'
      );
      
      expect(mysqlRule).toBeDefined();
      expect((mysqlRule as any).source_security_group_id).toBeDefined();
    });
  });

  describe('EC2 Instances', () => {
    test('should create EC2 instances with proper configuration', () => {
      const instances = Object.values(synthesized.resource.aws_instance);
      
      expect(instances).toHaveLength(2);
      instances.forEach((instance: any) => {
        expect(instance.instance_type).toBe('t3.medium');
        expect(instance.monitoring).toBe(true);
        expect(instance.root_block_device.encrypted).toBe(true);
        expect(instance.ebs_block_device[0].encrypted).toBe(true);
      });
    });

    test('should create IAM role for EC2 instances', () => {
      const roles = Object.values(synthesized.resource.aws_iam_role);
      const instanceProfiles = Object.values(synthesized.resource.aws_iam_instance_profile);
      
      const ec2Role = roles.find((role: any) => 
        role.name && role.name.includes('tap-app-server-test-role')
      );
      
      expect(ec2Role).toBeDefined();
      expect(instanceProfiles).toHaveLength(2);
    });

    test('should create auto-recovery alarms for EC2 instances', () => {
      const alarms = Object.values(synthesized.resource.aws_cloudwatch_metric_alarm);
      
      const recoveryAlarms = alarms.filter((alarm: any) => 
        alarm.alarm_name && alarm.alarm_name.includes('auto-recovery')
      );
      
      expect(recoveryAlarms).toHaveLength(2);
      recoveryAlarms.forEach((alarm: any) => {
        expect(alarm.metric_name).toBe('StatusCheckFailed_System');
        expect(alarm.alarm_actions).toContain('arn:aws:automate:${data.aws_region.current.name}:ec2:recover');
      });
    });
  });

  describe('RDS Database', () => {
    test('should create RDS instance with proper configuration', () => {
      const rdsInstances = Object.values(synthesized.resource.aws_db_instance);
      const subnetGroups = Object.values(synthesized.resource.aws_db_subnet_group);
      
      expect(rdsInstances).toHaveLength(1);
      expect(subnetGroups).toHaveLength(1);
      
      const rdsInstance = rdsInstances[0] as any;
      expect(rdsInstance.engine).toBe('mysql');
      expect(rdsInstance.instance_class).toBe('db.t3.medium');
      expect(rdsInstance.publicly_accessible).toBe(false);
      expect(rdsInstance.storage_encrypted).toBe(true);
      expect(rdsInstance.deletion_protection).toBe(false);
      expect(rdsInstance.manage_master_user_password).toBe(true);
    });

    test('should have RDS in private subnets', () => {
      const subnetGroup = Object.values(synthesized.resource.aws_db_subnet_group)[0] as any;
      
      expect(subnetGroup.subnet_ids).toHaveLength(2);
    });
  });

  describe('Load Balancer', () => {
    test('should create ALB with proper configuration', () => {
      const albs = Object.values(synthesized.resource.aws_lb);
      const targetGroups = Object.values(synthesized.resource.aws_lb_target_group);
      const listeners = Object.values(synthesized.resource.aws_lb_listener);
      
      expect(albs).toHaveLength(1);
      expect(targetGroups).toHaveLength(1);
      expect(listeners).toHaveLength(1);
      
      const alb = albs[0] as any;
      expect(alb.load_balancer_type).toBe('application');
      expect(alb.internal).toBe(false);
      expect(alb.enable_deletion_protection).toBe(false);
    });

    test('should have target group with health check configuration', () => {
      const targetGroup = Object.values(synthesized.resource.aws_lb_target_group)[0] as any;
      
      expect(targetGroup.port).toBe(80);
      expect(targetGroup.protocol).toBe('HTTP');
      expect(targetGroup.health_check.path).toBe('/health');
      expect(targetGroup.health_check.matcher).toBe('200');
    });
  });

  describe('Lambda Security Module', () => {
    test('should create Lambda function with proper configuration', () => {
      const lambdaFunctions = Object.values(synthesized.resource.aws_lambda_function);
      const lambdaRoles = Object.values(synthesized.resource.aws_iam_role).filter((role: any) => 
        role.name && role.name.includes('security-automation-lambda-role')
      );
      
      expect(lambdaFunctions).toHaveLength(1);
      expect(lambdaRoles).toHaveLength(1);
      
      const lambdaFunction = lambdaFunctions[0] as any;
      expect(lambdaFunction.runtime).toBe('python3.11');
      expect(lambdaFunction.handler).toBe('index.handler');
      expect(lambdaFunction.timeout).toBe(60);
    });

    test('should create CloudWatch event rule for Lambda trigger', () => {
      const eventRules = Object.values(synthesized.resource.aws_cloudwatch_event_rule);
      const eventTargets = Object.values(synthesized.resource.aws_cloudwatch_event_target);
      
      const scheduleRule = eventRules.find((rule: any) => 
        rule.schedule_expression === 'rate(1 hour)'
      );
      
      expect(scheduleRule).toBeDefined();
      expect(eventTargets).toHaveLength(2); // Lambda trigger + SNS target
    });
  });

  describe('Security Services', () => {
    test('should enable Security Hub', () => {
      const securityHub = Object.values(synthesized.resource.aws_securityhub_account);
      const standards = Object.values(synthesized.resource.aws_securityhub_standards_subscription);
      
      expect(securityHub).toHaveLength(1);
      expect(standards).toHaveLength(1);
      
      const hub = securityHub[0] as any;
      expect(hub.enable_default_standards).toBe(true);
      expect(hub.auto_enable_controls).toBe(true);
    });

    test('should create CloudTrail with proper configuration', () => {
      const cloudtrails = Object.values(synthesized.resource.aws_cloudtrail);
      
      expect(cloudtrails).toHaveLength(1);
      
      const trail = cloudtrails[0] as any;
      expect(trail.include_global_service_events).toBe(true);
      expect(trail.is_multi_region_trail).toBe(true);
      expect(trail.enable_log_file_validation).toBe(true);
    });

    test('should create WAF Web ACL with managed rules', () => {
      const wafAcls = Object.values(synthesized.resource.aws_wafv2_web_acl);
      
      expect(wafAcls).toHaveLength(1);
      
      const waf = wafAcls[0] as any;
      expect(waf.scope).toBe('REGIONAL');
      expect(waf.rule).toHaveLength(3);
      
      const ruleNames = waf.rule.map((rule: any) => rule.name);
      expect(ruleNames).toContain('RateLimitRule');
      expect(ruleNames).toContain('AWSManagedRulesCommonRuleSet');
      expect(ruleNames).toContain('AWSManagedRulesKnownBadInputsRuleSet');
    });

    test('should create SNS topic for security alerts', () => {
      const snsTopics = Object.values(synthesized.resource.aws_sns_topic);
      const snsSubscriptions = Object.values(synthesized.resource.aws_sns_topic_subscription);
      
      expect(snsTopics).toHaveLength(1);
      expect(snsSubscriptions).toHaveLength(1);
      
      const subscription = snsSubscriptions[0] as any;
      expect(subscription.protocol).toBe('email');
    });
  });

  describe('Storage and Encryption', () => {
    test('should create S3 buckets with encryption', () => {
      const s3Buckets = Object.values(synthesized.resource.aws_s3_bucket);
      const s3Encryption = Object.values(synthesized.resource.aws_s3_bucket_server_side_encryption_configuration);
      
      expect(s3Buckets).toHaveLength(2); // Lambda code bucket and logs bucket
      expect(s3Encryption).toHaveLength(2);
      
      s3Encryption.forEach((encryption: any) => {
        expect(encryption.rule[0].apply_server_side_encryption_by_default.sse_algorithm).toBe('AES256');
      });
    });

    test('should create Secrets Manager secret for API keys', () => {
      const secrets = Object.values(synthesized.resource.aws_secretsmanager_secret);
      const secretVersions = Object.values(synthesized.resource.aws_secretsmanager_secret_version);
      
      expect(secrets).toHaveLength(1);
      expect(secretVersions).toHaveLength(1);
      
      const secret = secrets[0] as any;
      expect(secret.kms_key_id).toBe('alias/aws/secretsmanager');
    });

    test('should create DynamoDB table with encryption and backup', () => {
      const dynamoTables = Object.values(synthesized.resource.aws_dynamodb_table);
      
      expect(dynamoTables).toHaveLength(1);
      
      const table = dynamoTables[0] as any;
      expect(table.billing_mode).toBe('PAY_PER_REQUEST');
      expect(table.server_side_encryption.enabled).toBe(true);
      expect(table.point_in_time_recovery.enabled).toBe(true);
    });

    test('should enable EBS default encryption', () => {
      const ebsEncryption = Object.values(synthesized.resource.aws_ebs_encryption_by_default);
      
      expect(ebsEncryption).toHaveLength(1);
      expect((ebsEncryption[0] as any).enabled).toBe(true);
    });
  });

  describe('Monitoring and Logging', () => {
    test('should create CloudWatch dashboard', () => {
      const dashboards = Object.values(synthesized.resource.aws_cloudwatch_dashboard);
      
      expect(dashboards).toHaveLength(1);
      
      const dashboard = dashboards[0] as any;
      expect(dashboard.dashboard_name).toMatch(/security-monitoring-dashboard-test/);
    });

    test('should create CloudWatch alarms for resources', () => {
      const alarms = Object.values(synthesized.resource.aws_cloudwatch_metric_alarm);
      
      // Should have CPU alarms for EC2, RDS, ALB, and auto-recovery alarms
      expect(alarms.length).toBeGreaterThanOrEqual(5);
      
      const cpuAlarms = alarms.filter((alarm: any) => 
        alarm.metric_name === 'CPUUtilization'
      );
      expect(cpuAlarms).toHaveLength(3); // 2 EC2 + 1 RDS
    });

    test('should create log groups with retention', () => {
      const logGroups = Object.values(synthesized.resource.aws_cloudwatch_log_group);
      
      expect(logGroups.length).toBeGreaterThanOrEqual(2);
      
      logGroups.forEach((logGroup: any) => {
        expect(logGroup.retention_in_days).toBeGreaterThan(0);
      });
    });
  });

  describe('IAM and Security Policies', () => {
    test('should create IAM password policy', () => {
      const passwordPolicies = Object.values(synthesized.resource.aws_iam_account_password_policy);
      
      expect(passwordPolicies).toHaveLength(1);
      
      const policy = passwordPolicies[0] as any;
      expect(policy.minimum_password_length).toBe(14);
      expect(policy.require_lowercase_characters).toBe(true);
      expect(policy.require_uppercase_characters).toBe(true);
      expect(policy.require_numbers).toBe(true);
      expect(policy.require_symbols).toBe(true);
    });

    test('should have proper IAM roles with least privilege', () => {
      const roles = Object.values(synthesized.resource.aws_iam_role);
      const rolePolicies = Object.values(synthesized.resource.aws_iam_role_policy);
      const policyAttachments = Object.values(synthesized.resource.aws_iam_role_policy_attachment);
      
      expect(roles.length).toBeGreaterThanOrEqual(4);
      expect(policyAttachments.length).toBeGreaterThanOrEqual(2);
      
      // Verify Lambda role has specific permissions
      const lambdaRole = roles.find((role: any) => 
        role.name && role.name.includes('security-automation-lambda-role')
      );
      expect(lambdaRole).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const outputs = synthesized.output;
      
      expect(outputs['vpc-id']).toBeDefined();
      expect(outputs['alb-dns']).toBeDefined();
      expect(outputs['rds-endpoint']).toBeDefined();
      expect(outputs['lambda-s3-bucket']).toBeDefined();
      expect(outputs['ec2-instance-ids']).toBeDefined();
      expect(outputs['security-hub-arn']).toBeDefined();
      expect(outputs['cloudtrail-arn']).toBeDefined();
      expect(outputs['lambda-function-arn']).toBeDefined();
      expect(outputs['sns-topic-arn']).toBeDefined();
      expect(outputs['dashboard-url']).toBeDefined();
    });

    test('should mark sensitive outputs appropriately', () => {
      const rdsOutput = synthesized.output['rds-endpoint'];
      
      expect(rdsOutput.sensitive).toBe(true);
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('should include environment suffix in resource names', () => {
      // Test VPC name
      const vpc = Object.values(synthesized.resource.aws_vpc)[0] as any;
      expect(vpc.tags.Name).toBe('tap-vpc-test');
      
      // Test security group names
      const securityGroups = Object.values(synthesized.resource.aws_security_group);
      securityGroups.forEach((sg: any) => {
        expect(sg.name).toContain('test');
      });
    });

    test('should have consistent tagging across resources', () => {
      const resourceTypes = [
        'aws_vpc', 'aws_subnet', 'aws_instance', 'aws_db_instance', 
        'aws_lb', 'aws_s3_bucket', 'aws_lambda_function'
      ];
      
      resourceTypes.forEach(resourceType => {
        const resources = synthesized.resource[resourceType];
        if (resources) {
          Object.values(resources).forEach((resource: any) => {
            if (resource.tags) {
              expect(resource.tags.Environment).toBe('production');
              expect(resource.tags.Owner).toBe('platform-team');
            }
          });
        }
      });
    });
  });
});