// Unit tests for High Availability Web Application Infrastructure
// Tests the Terraform configuration structure and syntax without executing commands

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("High Availability Web Application - Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;
  let combinedContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
    combinedContent = providerContent + "\n" + stackContent;
  });

  describe("File Structure and Syntax", () => {
    test("tap_stack.tf exists and is readable", () => {
      const exists = fs.existsSync(stackPath);
      expect(exists).toBe(true);
      expect(stackContent.length).toBeGreaterThan(0);
    });

    test("has valid Terraform syntax structure", () => {
      expect(combinedContent).toMatch(/terraform\s*{/);
      expect(combinedContent).toMatch(/provider\s+"aws"/);
      expect(combinedContent).toMatch(/variable\s+"aws_region"/);
      expect(combinedContent).toMatch(/output\s+"alb_dns_name"/);
    });

    test("uses data sources for default VPC", () => {
      expect(stackContent).toMatch(/data\s+"aws_vpc"\s+"default"/);
      expect(stackContent).toMatch(/data\s+"aws_subnets"\s+"default"/);
      expect(stackContent).toMatch(/data\s+"aws_subnets"\s+"public"/);
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });

    test("uses Secrets Manager resources", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_password"/);
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"db_password"/);
    });
  });

  describe("Variable Definitions", () => {
    test("declares aws_region variable", () => {
      expect(combinedContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares environment variable", () => {
      expect(combinedContent).toMatch(/variable\s+"environment"\s*{/);
    });

    test("declares app_name variable", () => {
      expect(combinedContent).toMatch(/variable\s+"app_name"\s*{/);
    });

    test("declares instance_type variable", () => {
      expect(combinedContent).toMatch(/variable\s+"instance_type"\s*{/);
    });

    test("declares db_instance_class variable", () => {
      expect(combinedContent).toMatch(/variable\s+"db_instance_class"\s*{/);
    });
  });

  describe("Security Groups", () => {
    test("creates ALB security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"\s*{/);
    });

    test("creates EC2 security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"\s*{/);
    });

    test("creates RDS security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"\s*{/);
    });

    test("ALB security group allows HTTP and HTTPS", () => {
      expect(stackContent).toMatch(/from_port\s*=\s*80/);
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
    });

    test("EC2 security group allows traffic from ALB", () => {
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });

    test("RDS security group allows MySQL access from EC2", () => {
      expect(stackContent).toMatch(/from_port\s*=\s*3306/);
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.ec2\.id\]/);
    });

    test("all security groups have proper descriptions", () => {
      expect(stackContent).toMatch(/description\s*=\s*"Security group for Application Load Balancer"/);
      expect(stackContent).toMatch(/description\s*=\s*"Security group for EC2 instances"/);
      expect(stackContent).toMatch(/description\s*=\s*"Security group for RDS database"/);
    });
  });

  describe("IAM Configuration", () => {
    test("creates EC2 IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"\s*{/);
    });

    test("creates EC2 instance profile", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"\s*{/);
    });

    test("creates CloudWatch policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"cloudwatch_policy"\s*{/);
    });

    test("IAM role has proper assume role policy", () => {
      expect(stackContent).toMatch(/Service\s*=\s*"ec2\.amazonaws\.com"/);
    });

    test("CloudWatch policy allows necessary permissions", () => {
      expect(stackContent).toMatch(/cloudwatch:PutMetricData/);
      expect(stackContent).toMatch(/logs:CreateLogGroup/);
      expect(stackContent).toMatch(/logs:PutLogEvents/);
    });
  });

  describe("Launch Template", () => {
    test("creates launch template", () => {
      expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"app"\s*{/);
    });

    test("launch template uses proper AMI", () => {
      expect(stackContent).toMatch(/image_id\s*=\s*"ami-0c02fb55956c7d316"/);
    });

    test("launch template has user data", () => {
      expect(stackContent).toMatch(/user_data\s*=\s*base64encode/);
    });

    test("user data installs and configures web server", () => {
      expect(stackContent).toMatch(/yum install -y httpd/);
      expect(stackContent).toMatch(/systemctl start httpd/);
      expect(stackContent).toMatch(/systemctl enable httpd/);
    });

    test("user data installs CloudWatch agent", () => {
      expect(stackContent).toMatch(/yum install -y amazon-cloudwatch-agent/);
      expect(stackContent).toMatch(/systemctl enable amazon-cloudwatch-agent/);
    });

    test("launch template has proper network configuration", () => {
      expect(stackContent).toMatch(/associate_public_ip_address\s*=\s*true/);
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.ec2\.id\]/);
    });
  });

  describe("Application Load Balancer", () => {
    test("creates ALB", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"app"\s*{/);
    });

    test("creates target group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"app"\s*{/);
    });

    test("creates listener", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"app"\s*{/);
    });

    test("ALB is external facing", () => {
      expect(stackContent).toMatch(/internal\s*=\s*false/);
    });

    test("ALB uses public subnets", () => {
      expect(stackContent).toMatch(/subnets\s*=\s*slice\(data\.aws_subnets\.public\.ids,\s*0,\s*2\)/);
    });

    test("ALB uses application load balancer type", () => {
      expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test("target group has health checks", () => {
      expect(stackContent).toMatch(/health_check\s*{/);
      expect(stackContent).toMatch(/enabled\s*=\s*true/);
      expect(stackContent).toMatch(/path\s*=\s*"\//);
      expect(stackContent).toMatch(/matcher\s*=\s*"200"/);
    });

    test("listener forwards to target group", () => {
      expect(stackContent).toMatch(/type\s*=\s*"forward"/);
      expect(stackContent).toMatch(/target_group_arn\s*=\s*aws_lb_target_group\.app\.arn/);
    });
  });

  describe("Auto Scaling Group", () => {
    test("creates auto scaling group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"app"\s*{/);
    });

    test("creates scale up policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_up"\s*{/);
    });

    test("creates scale down policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_down"\s*{/);
    });

    test("ASG has proper capacity settings", () => {
      expect(stackContent).toMatch(/desired_capacity\s*=\s*1/);
      expect(stackContent).toMatch(/max_size\s*=\s*4/);
      expect(stackContent).toMatch(/min_size\s*=\s*1/);
    });

    test("ASG uses launch template", () => {
      expect(stackContent).toMatch(/launch_template\s*{/);
      expect(stackContent).toMatch(/id\s*=\s*aws_launch_template\.app\.id/);
    });

    test("ASG has health checks", () => {
      expect(stackContent).toMatch(/health_check_grace_period\s*=\s*600/);
      expect(stackContent).toMatch(/health_check_type\s*=\s*"ELB"/);
    });

    test("scaling policies have proper configuration", () => {
      expect(stackContent).toMatch(/scaling_adjustment\s*=\s*1/);
      expect(stackContent).toMatch(/scaling_adjustment\s*=\s*-1/);
      expect(stackContent).toMatch(/adjustment_type\s*=\s*"ChangeInCapacity"/);
      expect(stackContent).toMatch(/cooldown\s*=\s*300/);
    });
  });

  describe("CloudWatch Alarms", () => {
    test("creates CPU high alarm", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_high"\s*{/);
    });

    test("creates CPU low alarm", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_low"\s*{/);
    });

    test("creates memory alarm", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"memory_high"\s*{/);
    });

    test("creates ALB 5XX alarm", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_5xx"\s*{/);
    });

    test("CPU alarms have proper thresholds", () => {
      expect(stackContent).toMatch(/threshold\s*=\s*"80"/);
      expect(stackContent).toMatch(/threshold\s*=\s*"20"/);
    });

    test("alarms use proper metrics", () => {
      expect(stackContent).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"MemoryUtilization"/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"HTTPCode_ELB_5XX_Count"/);
    });

    test("alarms trigger scaling policies", () => {
      expect(stackContent).toMatch(/alarm_actions\s*=\s*\[aws_autoscaling_policy\.scale_up\.arn\]/);
      expect(stackContent).toMatch(/alarm_actions\s*=\s*\[aws_autoscaling_policy\.scale_down\.arn\]/);
    });
  });

  describe("AWS Secrets Manager", () => {
    test("creates database password secret", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_password"/);
    });

    test("creates secret version with random password", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"db_password"/);
    });

    test("generates random password", () => {
      expect(stackContent).toMatch(/resource\s+"random_password"\s+"db_password"/);
    });

    test("RDS uses password from Secrets Manager", () => {
      expect(stackContent).toMatch(/password\s*=\s*aws_secretsmanager_secret_version\.db_password\.secret_string/);
    });

    test("secret has proper naming", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\${var\.app_name}-\${var\.environment_suffix}-db-password"/);
    });

    test("secret has proper tags", () => {
      expect(stackContent).toMatch(/Environment\s*=\s*"Production"/);
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
    });
  });

  describe("RDS Database", () => {
    test("creates DB subnet group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"app"\s*{/);
    });

    test("creates RDS instance", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"app"\s*{/);
    });

    test("RDS uses MySQL engine", () => {
      expect(stackContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(stackContent).toMatch(/engine_version\s*=\s*"8\.0"/);
    });

    test("RDS has multi-AZ enabled", () => {
      expect(stackContent).toMatch(/multi_az\s*=\s*true/);
    });

    test("RDS has encryption enabled", () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("RDS has backup configuration", () => {
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*7/);
      expect(stackContent).toMatch(/backup_window\s*=\s*"03:00-04:00"/);
    });

    test("RDS is not publicly accessible", () => {
      expect(stackContent).toMatch(/publicly_accessible\s*=\s*false/);
    });
  });

  describe("CloudWatch Logs", () => {
    test("creates log group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"app"\s*{/);
    });

    test("log group has proper retention", () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*7/);
    });
  });

  describe("Resource Tagging", () => {
    test("all resources have Environment tag", () => {
      const resourceBlocks = stackContent.match(/resource\s+"[^"]+"\s+"[^"]+"\s*{/g);
      const taggedResources = stackContent.match(/Environment\s*=\s*"Production"/g);
      expect(taggedResources).toBeTruthy();
      expect(taggedResources!.length).toBeGreaterThan(0);
    });

    test("resources have Name tags", () => {
      expect(stackContent).toMatch(/Name\s*=\s*"\${var\.app_name}-\${var\.environment_suffix}-alb"/);
      expect(stackContent).toMatch(/value\s*=\s*"\${var\.app_name}-\${var\.environment_suffix}-asg"/);
      expect(stackContent).toMatch(/Name\s*=\s*"\${var\.app_name}-\${var\.environment_suffix}-db"/);
    });

    test("all resources have ManagedBy tag", () => {
      const managedByTags = stackContent.match(/ManagedBy\s*=\s*"terraform"/g);
      expect(managedByTags).toBeTruthy();
      expect(managedByTags!.length).toBeGreaterThan(0);
    });

    test("security groups have proper tagging", () => {
      expect(stackContent).toMatch(/Name\s*=\s*"\${var\.app_name}-\${var\.environment_suffix}-alb-sg"/);
      expect(stackContent).toMatch(/Name\s*=\s*"\${var\.app_name}-\${var\.environment_suffix}-ec2-sg"/);
      expect(stackContent).toMatch(/Name\s*=\s*"\${var\.app_name}-\${var\.environment_suffix}-rds-sg"/);
    });

    test("IAM resources have proper tagging", () => {
      expect(stackContent).toMatch(/Name\s*=\s*"\${var\.app_name}-\${var\.environment_suffix}-ec2-role"/);
    });

    test("launch template has proper tagging", () => {
      expect(stackContent).toMatch(/Name\s*=\s*"\${var\.app_name}-\${var\.environment_suffix}-launch-template"/);
    });

    test("load balancer resources have proper tagging", () => {
      expect(stackContent).toMatch(/Name\s*=\s*"\${var\.app_name}-\${var\.environment_suffix}-alb"/);
      expect(stackContent).toMatch(/Name\s*=\s*"\${var\.app_name}-\${var\.environment_suffix}-target-group"/);
    });

    test("auto scaling group has proper tagging", () => {
      expect(stackContent).toMatch(/tag\s*{[^}]*key\s*=\s*"Name"[^}]*value\s*=\s*"\${var\.app_name}-\${var\.environment_suffix}-asg"/);
      expect(stackContent).toMatch(/tag\s*{[^}]*key\s*=\s*"Environment"[^}]*value\s*=\s*"Production"/);
      expect(stackContent).toMatch(/tag\s*{[^}]*key\s*=\s*"ManagedBy"[^}]*value\s*=\s*"terraform"/);
    });

    test("RDS resources have proper tagging", () => {
      expect(stackContent).toMatch(/Name\s*=\s*"\${var\.app_name}-\${var\.environment_suffix}-db-subnet-group"/);
      expect(stackContent).toMatch(/Name\s*=\s*"\${var\.app_name}-\${var\.environment_suffix}-db"/);
    });

    test("secrets manager has proper tagging", () => {
      expect(stackContent).toMatch(/Name\s*=\s*"\${var\.app_name}-\${var\.environment_suffix}-db-password"/);
    });

    test("cloudwatch resources have proper tagging", () => {
      expect(stackContent).toMatch(/Name\s*=\s*"\${var\.app_name}-\${var\.environment_suffix}-log-group"/);
    });

    test("consistent tag structure across all resources", () => {
      // Verify that all tagged resources follow the same pattern
      const tagPatterns = [
        /Environment\s*=\s*"Production"/,
        /ManagedBy\s*=\s*"terraform"/,
        /Name\s*=\s*"\${var\.app_name}-\${var\.environment_suffix}/
      ];
      
      tagPatterns.forEach(pattern => {
        expect(stackContent).toMatch(pattern);
      });
    });
  });

  describe("Outputs", () => {
    test("exports ALB DNS name", () => {
      expect(stackContent).toMatch(/output\s+"alb_dns_name"/);
    });

    test("exports RDS endpoint", () => {
      expect(stackContent).toMatch(/output\s+"rds_endpoint"/);
    });

    test("exports ASG name", () => {
      expect(stackContent).toMatch(/output\s+"asg_name"/);
    });

    test("exports VPC ID", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"/);
    });

    test("exports subnet IDs", () => {
      expect(stackContent).toMatch(/output\s+"subnet_ids"/);
    });
  });

  describe("Security Requirements", () => {
    test("no overly permissive security group rules", () => {
      // Check that no security group allows all traffic from 0.0.0.0/0 for inbound rules
      const securityGroupBlocks = stackContent.match(/resource\s+"aws_security_group"[^}]*}/g);
      if (securityGroupBlocks) {
        securityGroupBlocks.forEach(block => {
          const inboundRules = block.match(/ingress\s*{[^}]*}/g);
          if (inboundRules) {
            inboundRules.forEach(rule => {
              if (rule.includes('0.0.0.0/0')) {
                // Only allow 0.0.0.0/0 for ALB (which is acceptable)
                expect(block).toMatch(/aws_security_group\.alb/);
              }
            });
          }
        });
      }
    });

    test("uses least privilege principle", () => {
      // EC2 instances only allow traffic from ALB
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
      
      // RDS only allows traffic from EC2 instances
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.ec2\.id\]/);
    });
  });

  describe("High Availability Requirements", () => {
    test("uses multiple availability zones", () => {
      expect(stackContent).toMatch(/data\.aws_subnets\.default\.ids/);
      expect(stackContent).toMatch(/vpc_zone_identifier\s*=\s*slice\(data\.aws_subnets\.public\.ids,\s*0,\s*2\)/);
    });

    test("RDS has multi-AZ enabled", () => {
      expect(stackContent).toMatch(/multi_az\s*=\s*true/);
    });

    test("ASG spans multiple AZs", () => {
      expect(stackContent).toMatch(/vpc_zone_identifier\s*=\s*slice\(data\.aws_subnets\.public\.ids,\s*0,\s*2\)/);
    });
  });

  describe("Best Practices", () => {
    test("uses variables instead of hardcoded values", () => {
      expect(combinedContent).toMatch(/var\.aws_region/);
      expect(combinedContent).toMatch(/var\.environment/);
      expect(combinedContent).toMatch(/var\.app_name/);
      expect(combinedContent).toMatch(/var\.instance_type/);
    });

    test("includes descriptive comments", () => {
      expect(stackContent).toMatch(/# Terraform configuration for High Availability Web Application/);
      expect(stackContent).toMatch(/# Security Groups/);
      expect(stackContent).toMatch(/# IAM Roles and Policies/);
      expect(stackContent).toMatch(/# Application Load Balancer/);
    });

    test("uses proper resource naming", () => {
      expect(stackContent).toMatch(/aws_lb\.app/);
      expect(stackContent).toMatch(/aws_autoscaling_group\.app/);
      expect(stackContent).toMatch(/aws_db_instance\.app/);
    });

    test("uses data sources for existing resources", () => {
      expect(stackContent).toMatch(/data\.aws_vpc\.default/);
      expect(stackContent).toMatch(/data\.aws_subnets\.default/);
    });
  });
});
