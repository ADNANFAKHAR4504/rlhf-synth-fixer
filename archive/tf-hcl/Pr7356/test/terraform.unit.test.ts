// Unit tests for Terraform multi-file infrastructure
// Validates resource configurations across all .tf files

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");

// Helper to read Terraform file content
function readTfFile(filename: string): string {
  const filePath = path.join(LIB_DIR, filename);
  return fs.readFileSync(filePath, "utf8");
}

// Helper to check if file exists
function tfFileExists(filename: string): boolean {
  const filePath = path.join(LIB_DIR, filename);
  return fs.existsSync(filePath);
}

describe("Terraform Infrastructure - File Structure", () => {
  const requiredFiles = [
    "provider.tf",
    "variables.tf",
    "vpc.tf",
    "security-groups.tf",
    "kms.tf",
    "iam.tf",
    "rds.tf",
    "ecs.tf",
    "alb.tf",
    "s3.tf",
    "cloudfront.tf",
    "waf.tf",
    "cloudwatch.tf",
    "route53.tf",
    "outputs.tf"
  ];

  test.each(requiredFiles)("%s exists", (filename) => {
    expect(tfFileExists(filename)).toBe(true);
  });
});

describe("Terraform Infrastructure - Provider Configuration", () => {
  test("provider.tf configures AWS provider", () => {
    const content = readTfFile("provider.tf");
    expect(content).toMatch(/provider\s+"aws"/);
  });

  test("provider.tf has required_providers block", () => {
    const content = readTfFile("provider.tf");
    expect(content).toMatch(/required_providers/);
    expect(content).toMatch(/aws\s*=\s*{/);
  });
});

describe("Terraform Infrastructure - Variables", () => {
  test("variables.tf defines environment_suffix", () => {
    const content = readTfFile("variables.tf");
    expect(content).toMatch(/variable\s+"environment_suffix"/);
  });

  test("variables.tf defines aws_region", () => {
    const content = readTfFile("variables.tf");
    expect(content).toMatch(/variable\s+"aws_region"/);
  });
});

describe("Terraform Infrastructure - VPC Resources", () => {
  test("vpc.tf creates VPC resource", () => {
    const content = readTfFile("vpc.tf");
    expect(content).toMatch(/resource\s+"aws_vpc"/);
    expect(content).toMatch(/payment-vpc/);
  });

  test("vpc.tf creates public subnets across AZs", () => {
    const content = readTfFile("vpc.tf");
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    expect(content).toMatch(/count\s*=\s*3/); // 3 AZs
  });

  test("vpc.tf creates private app subnets", () => {
    const content = readTfFile("vpc.tf");
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private_app"/);
  });

  test("vpc.tf creates private database subnets", () => {
    const content = readTfFile("vpc.tf");
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private_db"/);
  });

  test("vpc.tf creates internet gateway", () => {
    const content = readTfFile("vpc.tf");
    expect(content).toMatch(/resource\s+"aws_internet_gateway"/);
  });

  test("vpc.tf creates NAT gateways for high availability", () => {
    const content = readTfFile("vpc.tf");
    expect(content).toMatch(/resource\s+"aws_eip"\s+"nat"/);
    expect(content).toMatch(/resource\s+"aws_nat_gateway"/);
  });
});

describe("Terraform Infrastructure - Security Groups", () => {
  test("security-groups.tf creates ALB security group", () => {
    const content = readTfFile("security-groups.tf");
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
  });

  test("security-groups.tf creates ECS security group", () => {
    const content = readTfFile("security-groups.tf");
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"ecs_tasks"/);
  });

  test("security-groups.tf creates database security group", () => {
    const content = readTfFile("security-groups.tf");
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"aurora"/);
  });
});

describe("Terraform Infrastructure - KMS Encryption", () => {
  test("kms.tf creates KMS keys for encryption at rest", () => {
    const content = readTfFile("kms.tf");
    expect(content).toMatch(/resource\s+"aws_kms_key"/);
  });

  test("kms.tf creates database encryption key", () => {
    const content = readTfFile("kms.tf");
    expect(content).toMatch(/database\s+encryption|payment-db-key/i);
  });

  test("kms.tf creates S3 encryption key", () => {
    const content = readTfFile("kms.tf");
    expect(content).toMatch(/s3\s+encryption|payment-s3-key/i);
  });

  test("kms.tf creates CloudWatch encryption key", () => {
    const content = readTfFile("kms.tf");
    expect(content).toMatch(/cloudwatch|payment-logs-key/i);
  });
});

describe("Terraform Infrastructure - IAM Roles", () => {
  test("iam.tf creates ECS task execution role", () => {
    const content = readTfFile("iam.tf");
    expect(content).toMatch(/resource\s+"aws_iam_role"/);
    expect(content).toMatch(/ecs.*task.*execution|task.*execution.*role/i);
  });

  test("iam.tf creates ECS task role", () => {
    const content = readTfFile("iam.tf");
    expect(content).toMatch(/ecs.*task.*role|task.*role/i);
  });

  test("iam.tf includes external ID condition for security", () => {
    const content = readTfFile("iam.tf");
    expect(content).toMatch(/ExternalId|sts:ExternalId/);
  });
});

describe("Terraform Infrastructure - RDS Aurora", () => {
  test("rds.tf creates Aurora cluster", () => {
    const content = readTfFile("rds.tf");
    expect(content).toMatch(/resource\s+"aws_rds_cluster"/);
  });

  test("rds.tf enables encryption at rest", () => {
    const content = readTfFile("rds.tf");
    expect(content).toMatch(/storage_encrypted\s*=\s*true/);
  });

  test("rds.tf creates Aurora instances", () => {
    const content = readTfFile("rds.tf");
    expect(content).toMatch(/resource\s+"aws_rds_cluster_instance"/);
  });

  test("rds.tf configures automated backups", () => {
    const content = readTfFile("rds.tf");
    expect(content).toMatch(/backup_retention_period/);
  });

  test("rds.tf enables deletion without protection for CI/CD", () => {
    const content = readTfFile("rds.tf");
    expect(content).toMatch(/deletion_protection\s*=\s*false/);
    expect(content).toMatch(/skip_final_snapshot\s*=\s*true/);
  });
});

describe("Terraform Infrastructure - ECS Fargate", () => {
  test("ecs.tf creates ECS cluster", () => {
    const content = readTfFile("ecs.tf");
    expect(content).toMatch(/resource\s+"aws_ecs_cluster"/);
  });

  test("ecs.tf creates task definition", () => {
    const content = readTfFile("ecs.tf");
    expect(content).toMatch(/resource\s+"aws_ecs_task_definition"/);
  });

  test("ecs.tf creates ECS service", () => {
    const content = readTfFile("ecs.tf");
    expect(content).toMatch(/resource\s+"aws_ecs_service"/);
  });

  test("ecs.tf configures minimum 3 tasks for high availability", () => {
    const content = readTfFile("ecs.tf");
    expect(content).toMatch(/desired_count\s*=\s*3/);
  });

  test("ecs.tf uses Fargate launch type", () => {
    const content = readTfFile("ecs.tf");
    expect(content).toMatch(/FARGATE/);
  });
});

describe("Terraform Infrastructure - Application Load Balancer", () => {
  test("alb.tf creates ALB resource", () => {
    const content = readTfFile("alb.tf");
    expect(content).toMatch(/resource\s+"aws_lb"/);
  });

  test("alb.tf creates target group", () => {
    const content = readTfFile("alb.tf");
    expect(content).toMatch(/resource\s+"aws_lb_target_group"/);
  });

  test("alb.tf creates HTTPS listener", () => {
    const content = readTfFile("alb.tf");
    expect(content).toMatch(/resource\s+"aws_lb_listener"/);
    expect(content).toMatch(/protocol\s*=\s*"HTTPS"/i);
  });

  test("alb.tf disables deletion protection for CI/CD", () => {
    const content = readTfFile("alb.tf");
    expect(content).toMatch(/enable_deletion_protection\s*=\s*false/);
  });
});

describe("Terraform Infrastructure - S3 and CloudFront", () => {
  test("s3.tf creates S3 bucket for static assets", () => {
    const content = readTfFile("s3.tf");
    expect(content).toMatch(/resource\s+"aws_s3_bucket"/);
  });

  test("s3.tf enables versioning", () => {
    const content = readTfFile("s3.tf");
    expect(content).toMatch(/aws_s3_bucket_versioning/);
  });

  test("cloudfront.tf creates CloudFront distribution", () => {
    const content = readTfFile("cloudfront.tf");
    expect(content).toMatch(/resource\s+"aws_cloudfront_distribution"/);
  });

  test("cloudfront.tf references S3 origin", () => {
    const content = readTfFile("cloudfront.tf");
    expect(content).toMatch(/origin\s*{/);
  });
});

describe("Terraform Infrastructure - WAF", () => {
  test("waf.tf creates WAF WebACL", () => {
    const content = readTfFile("waf.tf");
    expect(content).toMatch(/resource\s+"aws_wafv2_web_acl"/);
  });

  test("waf.tf includes SQL injection protection", () => {
    const content = readTfFile("waf.tf");
    expect(content).toMatch(/AWSManagedRulesSQLiRuleSet|SQLi/i);
  });

  test("waf.tf includes XSS protection", () => {
    const content = readTfFile("waf.tf");
    expect(content).toMatch(/AWSManagedRulesKnownBadInputsRuleSet|XSS/i);
  });
});

describe("Terraform Infrastructure - CloudWatch Monitoring", () => {
  test("cloudwatch.tf creates metric filters", () => {
    const content = readTfFile("cloudwatch.tf");
    expect(content).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"/);
  });

  test("cloudwatch.tf creates alarms", () => {
    const content = readTfFile("cloudwatch.tf");
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
  });

  test("cloudwatch.tf configures monitoring", () => {
    const content = readTfFile("cloudwatch.tf");
    expect(content).toMatch(/error_count|high_error_rate|unhealthy_targets/i);
  });
});

describe("Terraform Infrastructure - Route 53", () => {
  test("route53.tf creates health checks", () => {
    const content = readTfFile("route53.tf");
    expect(content).toMatch(/resource\s+"aws_route53_health_check"/);
  });
});

describe("Terraform Infrastructure - Outputs", () => {
  test("outputs.tf defines output values", () => {
    const content = readTfFile("outputs.tf");
    expect(content).toMatch(/output\s+"/);
  });

  test("outputs.tf includes VPC outputs", () => {
    const content = readTfFile("outputs.tf");
    expect(content).toMatch(/vpc.*id|output.*"vpc/i);
  });

  test("outputs.tf includes ALB outputs", () => {
    const content = readTfFile("outputs.tf");
    expect(content).toMatch(/alb.*dns|load.*balancer/i);
  });
});

describe("Terraform Infrastructure - PCI DSS Compliance", () => {
  test("resources use environment_suffix for naming", () => {
    const files = ["vpc.tf", "ecs.tf", "rds.tf", "alb.tf"];
    files.forEach(file => {
      const content = readTfFile(file);
      expect(content).toMatch(/\$\{var\.environment_suffix\}/);
    });
  });

  test("all resources include required tags", () => {
    const files = ["vpc.tf", "ecs.tf", "alb.tf"];
    files.forEach(file => {
      const content = readTfFile(file);
      expect(content).toMatch(/tags\s*=\s*{/);
      expect(content).toMatch(/CostCenter|Compliance/);
    });
  });
});
