import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Blue-Green Deployment Integration Tests', () => {
  let outputs: Record<string, any>;

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    expect(fs.existsSync(outputsPath)).toBe(true);
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  });

  describe('Deployment Outputs Validation', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'alb_dns_name',
        'alb_arn',
        'blue_asg_name',
        'green_asg_name',
        'blue_target_group_arn',
        'green_target_group_arn',
        'rds_cluster_endpoint',
        'rds_proxy_endpoint',
        'artifacts_bucket_name',
        'sns_topic_arn'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('ALB DNS name should be valid', () => {
      expect(outputs.alb_dns_name).toMatch(/^alb-synthvs00a-.*\.us-east-1\.elb\.amazonaws\.com$/);
    });

    test('ALB ARN should be valid', () => {
      expect(outputs.alb_arn).toMatch(/^arn:aws:elasticloadbalancing:us-east-1:\d+:loadbalancer\/app\/alb-synthvs00a\//);
    });

    test('Blue ASG name should include environment suffix', () => {
      expect(outputs.blue_asg_name).toBe('asg-blue-synthvs00a');
    });

    test('Green ASG name should include environment suffix', () => {
      expect(outputs.green_asg_name).toBe('asg-green-synthvs00a');
    });

    test('Blue target group ARN should be valid', () => {
      expect(outputs.blue_target_group_arn).toMatch(/^arn:aws:elasticloadbalancing:us-east-1:\d+:targetgroup\/tg-blue-synthvs00a\//);
    });

    test('Green target group ARN should be valid', () => {
      expect(outputs.green_target_group_arn).toMatch(/^arn:aws:elasticloadbalancing:us-east-1:\d+:targetgroup\/tg-green-synthvs00a\//);
    });

    test('RDS cluster endpoint should be valid', () => {
      expect(outputs.rds_cluster_endpoint).toMatch(/^aurora-cluster-synthvs00a\.cluster-.*\.us-east-1\.rds\.amazonaws\.com$/);
    });

    test('RDS cluster reader endpoint should be valid', () => {
      expect(outputs.rds_cluster_reader_endpoint).toMatch(/^aurora-cluster-synthvs00a\.cluster-ro-.*\.us-east-1\.rds\.amazonaws\.com$/);
    });

    test('RDS proxy endpoint should be valid', () => {
      expect(outputs.rds_proxy_endpoint).toMatch(/^rds-proxy-synthvs00a\.proxy-.*\.us-east-1\.rds\.amazonaws\.com$/);
    });

    test('S3 bucket name should include environment suffix', () => {
      expect(outputs.artifacts_bucket_name).toBe('app-artifacts-synthvs00a');
    });

    test('S3 bucket ARN should be valid', () => {
      expect(outputs.artifacts_bucket_arn).toBe('arn:aws:s3:::app-artifacts-synthvs00a');
    });

    test('SNS topic ARN should be valid', () => {
      expect(outputs.sns_topic_arn).toMatch(/^arn:aws:sns:us-east-1:\d+:cloudwatch-alarms-synthvs00a$/);
    });

    test('Security group IDs should be valid', () => {
      expect(outputs.alb_security_group_id).toMatch(/^sg-[0-9a-f]+$/);
      expect(outputs.ec2_security_group_id).toMatch(/^sg-[0-9a-f]+$/);
      expect(outputs.rds_security_group_id).toMatch(/^sg-[0-9a-f]+$/);
      expect(outputs.rds_proxy_security_group_id).toMatch(/^sg-[0-9a-f]+$/);
    });

    test('IAM resources should be valid', () => {
      expect(outputs.ec2_instance_role_arn).toMatch(/^arn:aws:iam::\d+:role\/ec2-instance-role-synthvs00a$/);
      expect(outputs.ec2_instance_profile_name).toBe('ec2-instance-profile-synthvs00a');
    });
  });

  describe('Blue-Green Traffic Distribution', () => {
    test('Blue environment should have 100% traffic initially', () => {
      expect(Number(outputs.blue_traffic_weight)).toBe(100);
    });

    test('Green environment should have 0% traffic initially', () => {
      expect(Number(outputs.green_traffic_weight)).toBe(0);
    });

    test('Traffic weights should sum to 100', () => {
      const totalWeight = Number(outputs.blue_traffic_weight) + Number(outputs.green_traffic_weight);
      expect(totalWeight).toBe(100);
    });

    test('Both environments should have version information', () => {
      expect(outputs.blue_app_version).toBeDefined();
      expect(outputs.green_app_version).toBeDefined();
      expect(outputs.blue_app_version).toBe('1.0.0');
      expect(outputs.green_app_version).toBe('1.0.0');
    });
  });

  describe('Resource Naming Conventions', () => {
    test('All resource names should include environment suffix', () => {
      const suffix = 'synthvs00a';

      expect(outputs.alb_dns_name).toContain(suffix);
      expect(outputs.blue_asg_name).toContain(suffix);
      expect(outputs.green_asg_name).toContain(suffix);
      expect(outputs.rds_cluster_endpoint).toContain(suffix);
      expect(outputs.rds_proxy_endpoint).toContain(suffix);
      expect(outputs.artifacts_bucket_name).toContain(suffix);
      expect(outputs.sns_topic_arn).toContain(suffix);
      expect(outputs.ec2_instance_role_arn).toContain(suffix);
      expect(outputs.ec2_instance_profile_name).toContain(suffix);
    });

    test('Target group ARNs should include blue/green identifiers', () => {
      expect(outputs.blue_target_group_arn).toContain('tg-blue');
      expect(outputs.green_target_group_arn).toContain('tg-green');
    });

    test('ASG names should include blue/green identifiers', () => {
      expect(outputs.blue_asg_name).toContain('blue');
      expect(outputs.green_asg_name).toContain('green');
    });
  });

  describe('High Availability Configuration', () => {
    test('RDS should have both writer and reader endpoints', () => {
      expect(outputs.rds_cluster_endpoint).toBeDefined();
      expect(outputs.rds_cluster_reader_endpoint).toBeDefined();
      expect(outputs.rds_cluster_endpoint).not.toBe(outputs.rds_cluster_reader_endpoint);
    });

    test('RDS Proxy should be configured for connection pooling', () => {
      expect(outputs.rds_proxy_endpoint).toBeDefined();
      expect(outputs.rds_proxy_endpoint).not.toBe(outputs.rds_cluster_endpoint);
    });

    test('ALB should be in us-east-1 region', () => {
      expect(outputs.alb_dns_name).toContain('us-east-1');
      expect(outputs.rds_cluster_endpoint).toContain('us-east-1');
    });
  });

  describe('Security Configuration', () => {
    test('Each component should have its own security group', () => {
      const securityGroups = [
        outputs.alb_security_group_id,
        outputs.ec2_security_group_id,
        outputs.rds_security_group_id,
        outputs.rds_proxy_security_group_id
      ];

      // All security groups should be defined
      securityGroups.forEach(sg => {
        expect(sg).toBeDefined();
        expect(sg).toMatch(/^sg-[0-9a-f]+$/);
      });

      // All security groups should be unique
      const uniqueSGs = new Set(securityGroups);
      expect(uniqueSGs.size).toBe(securityGroups.length);
    });

    test('IAM role should be configured for EC2 instances', () => {
      expect(outputs.ec2_instance_role_arn).toBeDefined();
      expect(outputs.ec2_instance_profile_name).toBeDefined();
      expect(outputs.ec2_instance_role_arn).toContain('ec2-instance-role');
      expect(outputs.ec2_instance_profile_name).toContain('ec2-instance-profile');
    });
  });

  describe('Monitoring and Alerts', () => {
    test('SNS topic should be configured for CloudWatch alarms', () => {
      expect(outputs.sns_topic_arn).toBeDefined();
      expect(outputs.sns_topic_arn).toContain('cloudwatch-alarms');
    });
  });

  describe('Storage Configuration', () => {
    test('S3 bucket should be configured for artifacts', () => {
      expect(outputs.artifacts_bucket_name).toBeDefined();
      expect(outputs.artifacts_bucket_arn).toBeDefined();
      expect(outputs.artifacts_bucket_name).toContain('artifacts');
    });

    test('S3 bucket name and ARN should be consistent', () => {
      expect(outputs.artifacts_bucket_arn).toContain(outputs.artifacts_bucket_name);
    });
  });

  describe('DNS Configuration', () => {
    test('Application domain should be configured', () => {
      expect(outputs.application_domain).toBeDefined();
      expect(outputs.application_domain).toContain('api.payflow.io');
    });

    test('Application domain should include task identifier', () => {
      expect(outputs.application_domain).toContain('vs00a');
    });
  });

  describe('Infrastructure Dependencies', () => {
    test('All infrastructure components should be deployed', () => {
      // Core networking
      expect(outputs.alb_dns_name).toBeDefined();
      expect(outputs.alb_arn).toBeDefined();

      // Blue environment
      expect(outputs.blue_asg_name).toBeDefined();
      expect(outputs.blue_target_group_arn).toBeDefined();

      // Green environment
      expect(outputs.green_asg_name).toBeDefined();
      expect(outputs.green_target_group_arn).toBeDefined();

      // Database tier
      expect(outputs.rds_cluster_endpoint).toBeDefined();
      expect(outputs.rds_cluster_reader_endpoint).toBeDefined();
      expect(outputs.rds_proxy_endpoint).toBeDefined();

      // Storage
      expect(outputs.artifacts_bucket_name).toBeDefined();

      // Monitoring
      expect(outputs.sns_topic_arn).toBeDefined();
    });

    test('Resource identifiers should follow naming patterns', () => {
      // Check that all resources follow the pattern: <resource-type>-<blue/green?>-<suffix>
      const patterns = {
        alb_security_group_id: /^sg-/,
        ec2_security_group_id: /^sg-/,
        rds_security_group_id: /^sg-/,
        blue_asg_name: /^asg-blue-/,
        green_asg_name: /^asg-green-/,
        artifacts_bucket_name: /^app-artifacts-/
      };

      Object.entries(patterns).forEach(([key, pattern]) => {
        expect(outputs[key]).toMatch(pattern);
      });
    });
  });

  describe('Deployment Readiness', () => {
    test('All critical outputs should be present', () => {
      const criticalOutputs = [
        'alb_dns_name',
        'blue_asg_name',
        'green_asg_name',
        'rds_proxy_endpoint',
        'artifacts_bucket_name'
      ];

      criticalOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output].length).toBeGreaterThan(0);
      });
    });

    test('Blue-green deployment should be ready for traffic switching', () => {
      expect(outputs.blue_target_group_arn).toBeDefined();
      expect(outputs.green_target_group_arn).toBeDefined();
      expect(outputs.blue_traffic_weight).toBeDefined();
      expect(outputs.green_traffic_weight).toBeDefined();
    });
  });
});
