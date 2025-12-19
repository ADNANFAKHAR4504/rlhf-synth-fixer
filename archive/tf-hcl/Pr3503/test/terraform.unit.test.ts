// tests/unit/terraform.unit.test.ts
// Unit tests for Terraform infrastructure code

import fs from "fs";
import path from "path";

const MAIN_TF_PATH = path.resolve(__dirname, "../lib/main.tf");
const PROVIDER_TF_PATH = path.resolve(__dirname, "../lib/provider.tf");

describe("Terraform Infrastructure Unit Tests", () => {
  let mainContent: string;
  let providerContent: string;

  beforeAll(() => {
    if (fs.existsSync(MAIN_TF_PATH)) {
      mainContent = fs.readFileSync(MAIN_TF_PATH, "utf8");
    }
    if (fs.existsSync(PROVIDER_TF_PATH)) {
      providerContent = fs.readFileSync(PROVIDER_TF_PATH, "utf8");
    }
  });

  describe("File Structure", () => {
    test("main.tf exists", () => {
      expect(fs.existsSync(MAIN_TF_PATH)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(PROVIDER_TF_PATH)).toBe(true);
    });
  });

  describe("Provider Configuration", () => {
    test("provider.tf contains terraform block", () => {
      expect(providerContent).toMatch(/terraform\s*{/);
    });

    test("provider.tf specifies AWS provider version ~> 5.0", () => {
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providerContent).toMatch(/version\s*=\s*">= 5\.0"/);
    });

    test("provider.tf includes random provider", () => {
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/random"/);
    });
  });

  describe("Variable Declarations", () => {
    test("declares aws_region variable", () => {
      expect(mainContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares project_name variable", () => {
      expect(mainContent).toMatch(/variable\s+"project_name"\s*{/);
    });

    test("declares environment_suffix variable", () => {
      expect(mainContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("declares environment variable", () => {
      expect(mainContent).toMatch(/variable\s+"environment"\s*{/);
    });

    test("declares vpc_cidr variable", () => {
      expect(mainContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
    });

    test("declares db_master_username variable", () => {
      expect(mainContent).toMatch(/variable\s+"db_master_username"\s*{/);
    });

    test("vpc_cidr has correct default value", () => {
      const vpcCidrMatch = mainContent.match(/variable\s+"vpc_cidr"[^}]*default\s*=\s*"([\d\.\/]+)"/s);
      expect(vpcCidrMatch).not.toBeNull();
      expect(vpcCidrMatch![1]).toBe("172.26.0.0/16");
    });
  });

  describe("Networking Resources", () => {
    test("declares VPC resource", () => {
      expect(mainContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    });

    test("declares Internet Gateway", () => {
      expect(mainContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
    });

    test("declares public subnets", () => {
      expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
    });

    test("declares private subnets", () => {
      expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
    });

    test("declares database subnets", () => {
      expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"database"\s*{/);
    });

    test("declares route tables", () => {
      expect(mainContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(mainContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
    });

    test("declares route table associations", () => {
      expect(mainContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*{/);
      expect(mainContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"\s*{/);
    });
  });

  describe("Security Groups", () => {
    test("declares ALB security group", () => {
      expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"alb"\s*{/);
    });

    test("declares EC2 security group", () => {
      expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"\s*{/);
    });

    test("declares RDS security group", () => {
      expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"rds"\s*{/);
    });

    test("declares ElastiCache security group", () => {
      expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"elasticache"\s*{/);
    });

    test("declares Lambda security group", () => {
      expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"lambda"\s*{/);
    });

    test("ALB security group allows HTTP and HTTPS", () => {
      // Check for ingress rules with correct port numbers
      const httpMatch = mainContent.match(/from_port\s*=\s*80/);
      expect(httpMatch).not.toBeNull();
      const httpsMatch = mainContent.match(/from_port\s*=\s*443/);
      expect(httpsMatch).not.toBeNull();
    });
  });

  describe("Storage Resources", () => {
    test("declares S3 bucket for attachments", () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket"\s+"attachments"\s*{/);
    });

    test("enables S3 versioning", () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"attachments"\s*{/);
    });

    test("configures S3 encryption", () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"attachments"\s*{/);
    });

    test("configures S3 lifecycle", () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"attachments"\s*{/);
    });
  });

  describe("Compute Resources", () => {
    test("declares Application Load Balancer", () => {
      expect(mainContent).toMatch(/resource\s+"aws_lb"\s+"main"\s*{/);
    });

    test("declares ALB target group", () => {
      expect(mainContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"\s*{/);
    });

    test("declares ALB listener", () => {
      expect(mainContent).toMatch(/resource\s+"aws_lb_listener"\s+"main"\s*{/);
    });

    test("declares launch template", () => {
      expect(mainContent).toMatch(/resource\s+"aws_launch_template"\s+"main"\s*{/);
    });

    test("declares Auto Scaling Group", () => {
      expect(mainContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"\s*{/);
    });

    test("declares Auto Scaling Policy", () => {
      expect(mainContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"cpu_target"\s*{/);
    });

    test("launch template uses t3.small instances", () => {
      const instanceTypeMatch = mainContent.match(/instance_type\s*=\s*"t3\.small"/);
      expect(instanceTypeMatch).not.toBeNull();
    });
  });

  describe("Database Resources", () => {
    test("declares RDS Aurora cluster", () => {
      expect(mainContent).toMatch(/resource\s+"aws_rds_cluster"\s+"main"\s*{/);
    });

    test("declares DB subnet group", () => {
      expect(mainContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"\s*{/);
    });

    test("declares RDS cluster instances", () => {
      expect(mainContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"writer"\s*{/);
      expect(mainContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"reader"\s*{/);
    });

    test("uses Aurora Serverless v2", () => {
      const serverlessMatch = mainContent.match(/instance_class\s*=\s*"db\.serverless"/);
      expect(serverlessMatch).not.toBeNull();
    });

    test("enables automated backups", () => {
      const backupMatch = mainContent.match(/backup_retention_period\s*=\s*(\d+)/);
      expect(backupMatch).not.toBeNull();
      expect(parseInt(backupMatch![1])).toBeGreaterThan(0);
    });
  });

  describe("Caching Layer", () => {
    test("declares ElastiCache parameter group", () => {
      expect(mainContent).toMatch(/resource\s+"aws_elasticache_parameter_group"\s+"redis"\s*{/);
    });

    test("declares ElastiCache subnet group", () => {
      expect(mainContent).toMatch(/resource\s+"aws_elasticache_subnet_group"\s+"main"\s*{/);
    });

    test("declares ElastiCache replication group", () => {
      expect(mainContent).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"main"\s*{/);
    });

    test("uses cache.t3.micro node type", () => {
      const nodeTypeMatch = mainContent.match(/node_type\s*=\s*"cache\.t3\.micro"/);
      expect(nodeTypeMatch).not.toBeNull();
    });

    test("enables Redis at-rest encryption", () => {
      const encryptionMatch = mainContent.match(/at_rest_encryption_enabled\s*=\s*true/);
      expect(encryptionMatch).not.toBeNull();
    });
  });

  describe("WebSocket API", () => {
    test("declares API Gateway WebSocket API", () => {
      expect(mainContent).toMatch(/resource\s+"aws_apigatewayv2_api"\s+"websocket"\s*{/);
    });

    test("declares WebSocket routes", () => {
      expect(mainContent).toMatch(/resource\s+"aws_apigatewayv2_route"\s+"connect"\s*{/);
      expect(mainContent).toMatch(/resource\s+"aws_apigatewayv2_route"\s+"disconnect"\s*{/);
      expect(mainContent).toMatch(/resource\s+"aws_apigatewayv2_route"\s+"default"\s*{/);
    });

    test("declares WebSocket integration", () => {
      expect(mainContent).toMatch(/resource\s+"aws_apigatewayv2_integration"\s+"websocket"\s*{/);
    });

    test("declares Lambda function for WebSocket", () => {
      expect(mainContent).toMatch(/resource\s+"aws_lambda_function"\s+"websocket_handler"\s*{/);
    });

    test("declares DynamoDB table for connections", () => {
      expect(mainContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"websocket_connections"\s*{/);
    });
  });

  describe("Secrets Management", () => {
    test("declares AWS Secrets Manager for database credentials", () => {
      expect(mainContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_credentials"\s*{/);
    });

    test("declares AWS Secrets Manager secret version for database", () => {
      expect(mainContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"db_credentials"\s*{/);
    });

    test("declares AWS Secrets Manager for Redis auth token", () => {
      expect(mainContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"redis_auth"\s*{/);
    });

    test("declares AWS Secrets Manager secret version for Redis", () => {
      expect(mainContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"redis_auth"\s*{/);
    });

    test("includes recovery window for secrets", () => {
      const recoveryMatch = mainContent.match(/recovery_window_in_days\s*=\s*\d+/);
      expect(recoveryMatch).not.toBeNull();
    });

    test("IAM policies include Secrets Manager permissions", () => {
      expect(mainContent).toMatch(/secretsmanager:GetSecretValue/);
    });
  });

  describe("EventBridge Scheduler", () => {
    test("declares EventBridge Scheduler schedule group", () => {
      expect(mainContent).toMatch(/resource\s+"aws_scheduler_schedule_group"\s+"project_tasks"\s*{/);
    });

    test("declares daily report schedule", () => {
      expect(mainContent).toMatch(/resource\s+"aws_scheduler_schedule"\s+"daily_report"\s*{/);
    });

    test("declares weekly deadline reminder schedule", () => {
      expect(mainContent).toMatch(/resource\s+"aws_scheduler_schedule"\s+"weekly_deadline_reminder"\s*{/);
    });

    test("declares hourly task check schedule", () => {
      expect(mainContent).toMatch(/resource\s+"aws_scheduler_schedule"\s+"hourly_task_check"\s*{/);
    });

    test("task processor Lambda function exists", () => {
      expect(mainContent).toMatch(/resource\s+"aws_lambda_function"\s+"task_processor"\s*{/);
    });

    test("scheduler IAM role has Lambda invoke permissions", () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"scheduler"\s*{/);
      expect(mainContent).toMatch(/lambda:InvokeFunction/);
    });

    test("SNS topic for notifications exists", () => {
      expect(mainContent).toMatch(/resource\s+"aws_sns_topic"\s+"notifications"\s*{/);
    });

    test("DynamoDB table for scheduled tasks exists", () => {
      expect(mainContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"scheduled_tasks"\s*{/);
    });

    test("hourly task check uses flexible time window", () => {
      const flexibleWindowMatch = mainContent.match(/flexible_time_window\s*{\s*mode\s*=\s*"FLEXIBLE"/);
      expect(flexibleWindowMatch).not.toBeNull();
    });
  });

  describe("Monitoring", () => {
    test("declares CloudWatch dashboard", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"main"\s*{/);
    });

    test("declares CloudWatch alarms", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"\s*{/);
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"\s*{/);
    });

    test("declares CloudWatch log groups", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"application"\s*{/);
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda"\s*{/);
    });

    test("declares CloudWatch log group for task processor", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"task_processor"\s*{/);
    });
  });

  describe("Outputs", () => {
    test("outputs VPC ID", () => {
      expect(mainContent).toMatch(/output\s+"vpc_id"\s*{/);
    });

    test("outputs ALB DNS name", () => {
      expect(mainContent).toMatch(/output\s+"alb_dns_name"\s*{/);
    });

    test("outputs S3 bucket name", () => {
      expect(mainContent).toMatch(/output\s+"s3_bucket_name"\s*{/);
    });

    test("outputs WebSocket API endpoint", () => {
      expect(mainContent).toMatch(/output\s+"websocket_api_endpoint"\s*{/);
    });

    test("outputs RDS endpoints", () => {
      expect(mainContent).toMatch(/output\s+"rds_cluster_endpoint"\s*{/);
      expect(mainContent).toMatch(/output\s+"rds_reader_endpoint"\s*{/);
    });
  });

  describe("Resource Naming Convention", () => {
    test("resources use environment_suffix in names", () => {
      const suffixCount = (mainContent.match(/\$\{var\.environment_suffix\}/g) || []).length;
      expect(suffixCount).toBeGreaterThan(20);
    });

    test("resources use consistent project_name prefix", () => {
      const prefixCount = (mainContent.match(/\$\{var\.project_name\}/g) || []).length;
      expect(prefixCount).toBeGreaterThan(20);
    });
  });

  describe("Security Best Practices", () => {
    test("uses random password for RDS", () => {
      expect(mainContent).toMatch(/resource\s+"random_password"\s+"db_password"\s*{/);
    });

    test("uses random password for Redis auth", () => {
      expect(mainContent).toMatch(/resource\s+"random_password"\s+"redis_auth"\s*{/);
    });

    test("marks sensitive outputs", () => {
      const sensitiveCount = (mainContent.match(/sensitive\s*=\s*true/g) || []).length;
      expect(sensitiveCount).toBeGreaterThan(3);
    });

    test("outputs Secrets Manager ARNs", () => {
      expect(mainContent).toMatch(/output\s+"db_secret_arn"\s*{/);
      expect(mainContent).toMatch(/output\s+"redis_secret_arn"\s*{/);
    });

    test("outputs SNS topic ARN", () => {
      expect(mainContent).toMatch(/output\s+"sns_topic_arn"\s*{/);
    });

    test("outputs EventBridge Scheduler group name", () => {
      expect(mainContent).toMatch(/output\s+"scheduler_group_name"\s*{/);
    });

    test("outputs task processor function name", () => {
      expect(mainContent).toMatch(/output\s+"task_processor_function_name"\s*{/);
    });

    test("outputs scheduled tasks table name", () => {
      expect(mainContent).toMatch(/output\s+"scheduled_tasks_table"\s*{/);
    });
  });
});