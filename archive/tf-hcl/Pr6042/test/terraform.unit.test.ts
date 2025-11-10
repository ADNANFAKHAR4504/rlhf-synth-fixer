import fs from 'fs';
import path from 'path';

describe('RDS PostgreSQL Terraform Stack - Simple Unit Tests', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  // -------------------------
  // Variables
  // -------------------------
  describe('Variables', () => {
    [
      "aws_region",
      "project_name",
      "environment",
      "db_name",
      "db_username",
      "db_password",
      "db_instance_class",
      "allocated_storage",
      "max_allocated_storage",
      "owner_tag",
      "cost_center"
    ].forEach(variableName => {
      test(`Variable "${variableName}" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`variable\\s+"${variableName}"`));
      });
    });
  });

  // -------------------------
  // Resources
  // -------------------------
  describe('Resources', () => {
    [
      "aws_vpc.main",
      "aws_internet_gateway.main",
      "aws_eip.nat",
      "aws_subnet.public",
      "aws_subnet.private_db",
      "aws_subnet.private_app",
      "aws_nat_gateway.main",
      "aws_route_table.public",
      "aws_route_table.private",
      "aws_route_table_association.public",
      "aws_route_table_association.private_db",
      "aws_route_table_association.private_app",
      "aws_security_group.rds",
      "random_password.db_password",
      "aws_secretsmanager_secret.db_password",
      "aws_secretsmanager_secret_version.db_password",
      "aws_db_subnet_group.main",
      "aws_db_parameter_group.postgres",
      "aws_iam_role.enhanced_monitoring",
      "aws_iam_role_policy_attachment.enhanced_monitoring",
      "aws_db_instance.postgres",
      "aws_sns_topic.db_alarms",
      "aws_sns_topic_subscription.db_alarms_email",
      "aws_cloudwatch_metric_alarm.cpu_utilization",
      "aws_cloudwatch_metric_alarm.db_connections",
      "aws_cloudwatch_metric_alarm.read_latency",
      "aws_cloudwatch_metric_alarm.write_latency",
      "aws_cloudwatch_metric_alarm.free_storage",
      "aws_cloudwatch_dashboard.rds_monitoring"
    ].forEach(resourceFullName => {
      const [resourceType, resourceName] = resourceFullName.split('.');
      test(`Resource "${resourceType}" named "${resourceName}" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"`));
      });
    });
  });

  // -------------------------
  // Outputs
  // -------------------------
  describe('Outputs', () => {
    [
      "db_instance_endpoint",
      "db_instance_address",
      "db_instance_port",
      "db_instance_id",
      "db_parameter_group_name",
      "db_subnet_group_name",
      "vpc_id",
      "private_subnet_ids",
      "app_subnet_ids",
      "security_group_id",
      "sns_topic_arn",
      "cloudwatch_dashboard_url",
      "connection_string",
      "monitoring_role_arn",
      "nat_gateway_ids",
      "db_password_secret_arn",
      "db_password_secret_name"
    ].forEach(outputName => {
      test(`Output "${outputName}" is defined`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${outputName}"`));
      });
    });
  });

  // -------------------------
  // Security & Secrets
  // -------------------------
  describe('Security & Secrets Configuration', () => {
    test('Random password resource has proper configuration', () => {
      expect(tfContent).toMatch(/random_password.*db_password/);
      expect(tfContent).toMatch(/length\s*=\s*32/);
      expect(tfContent).toMatch(/special\s*=\s*true/);
      expect(tfContent).toMatch(/min_special/);
      expect(tfContent).toMatch(/min_upper/);
      expect(tfContent).toMatch(/min_lower/);
      expect(tfContent).toMatch(/min_numeric/);
    });

    test('Secrets Manager secret is configured', () => {
      expect(tfContent).toMatch(/aws_secretsmanager_secret.*db_password/);
      expect(tfContent).toMatch(/recovery_window_in_days/);
    });

    test('Secrets Manager secret version stores complete credentials', () => {
      expect(tfContent).toMatch(/aws_secretsmanager_secret_version.*db_password/);
      expect(tfContent).toMatch(/username/);
      expect(tfContent).toMatch(/password/);
      expect(tfContent).toMatch(/engine/);
      expect(tfContent).toMatch(/host/);
      expect(tfContent).toMatch(/port/);
      expect(tfContent).toMatch(/dbname/);
    });

    test('RDS instance uses random password', () => {
      expect(tfContent).toMatch(/random_password\.db_password\.result/);
    });

    test('No hardcoded passwords in variables', () => {
      const passwordVarMatch = tfContent.match(/variable\s+"db_password"[\s\S]*?(?=variable\s+|resource\s+|output\s+|$)/);
      expect(passwordVarMatch).toBeTruthy();
      if (passwordVarMatch) {
        expect(passwordVarMatch[0]).not.toMatch(/default\s*=\s*"[^"]{8,}"/);
      }
    });
  });

});
