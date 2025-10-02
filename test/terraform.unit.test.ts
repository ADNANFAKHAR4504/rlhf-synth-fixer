// tests/unit/unit-tests.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Validates infrastructure components, security, and AWS best practices

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform stack: tap_stack.tf - File Existence", () => {
  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  test("user_data.sh exists", () => {
    const userDataPath = path.resolve(__dirname, "../lib/user_data.sh");
    expect(fs.existsSync(userDataPath)).toBe(true);
  });
});

describe("Terraform stack: tap_stack.tf - Provider Configuration", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("declares aws_region variable", () => {
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });
});

describe("Terraform stack: tap_stack.tf - VPC and Networking", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares VPC resource with correct CIDR", () => {
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    expect(content).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
  });

  test("declares public subnets", () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    expect(content).toMatch(/map_public_ip_on_launch\s*=\s*true/);
  });

  test("declares private subnets", () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
  });

  test("declares Internet Gateway", () => {
    expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
  });

  test("declares NAT Gateway", () => {
    expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
  });

  test("declares Elastic IP for NAT", () => {
    expect(content).toMatch(/resource\s+"aws_eip"\s+"nat"/);
    expect(content).toMatch(/domain\s*=\s*"vpc"/);
  });

  test("declares route tables", () => {
    expect(content).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"/);
  });
});

describe("Terraform stack: tap_stack.tf - Security Groups", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares ALB security group", () => {
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
  });

  test("ALB security group allows HTTPS (443)", () => {
    expect(content).toMatch(/from_port\s*=\s*443/);
    expect(content).toMatch(/to_port\s*=\s*443/);
  });

  test("declares EC2 security group", () => {
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
  });

  test("declares RDS security group", () => {
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
  });

  test("RDS security group restricts MySQL port 3306", () => {
    expect(content).toMatch(/from_port\s*=\s*3306/);
    expect(content).toMatch(/to_port\s*=\s*3306/);
  });

  test("declares ElastiCache security group", () => {
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"elasticache"/);
  });

  test("ElastiCache security group restricts Redis port 6379", () => {
    expect(content).toMatch(/from_port\s*=\s*6379/);
    expect(content).toMatch(/to_port\s*=\s*6379/);
  });
});

describe("Terraform stack: tap_stack.tf - IAM Roles and Policies", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares EC2 IAM role", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
  });

  test("declares EC2 instance profile", () => {
    expect(content).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
  });

  test("declares CloudWatch logs policy", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_cloudwatch_logs"/);
    expect(content).toMatch(/logs:CreateLogGroup/);
    expect(content).toMatch(/logs:PutLogEvents/);
  });

  test("declares CloudWatch metrics policy", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_cloudwatch_metrics"/);
    expect(content).toMatch(/cloudwatch:PutMetricData/);
  });

  test("declares X-Ray policy", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_xray"/);
    expect(content).toMatch(/xray:PutTraceSegments/);
  });
});

describe("Terraform stack: tap_stack.tf - RDS MySQL Database", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares RDS subnet group", () => {
    expect(content).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
  });

  test("declares RDS instance", () => {
    expect(content).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
  });

  test("RDS uses MySQL engine", () => {
    expect(content).toMatch(/engine\s*=\s*"mysql"/);
  });

  test("RDS has multi-AZ enabled", () => {
    expect(content).toMatch(/multi_az\s*=\s*true/);
  });

  test("RDS has encryption enabled", () => {
    expect(content).toMatch(/storage_encrypted\s*=\s*true/);
  });

  test("RDS is not publicly accessible", () => {
    expect(content).toMatch(/publicly_accessible\s*=\s*false/);
  });

  test("RDS has backup retention configured", () => {
    expect(content).toMatch(/backup_retention_period\s*=\s*7/);
  });

  test("RDS has CloudWatch logs exports enabled", () => {
    expect(content).toMatch(/enabled_cloudwatch_logs_exports/);
  });
});

describe("Terraform stack: tap_stack.tf - ElastiCache Redis", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares ElastiCache subnet group", () => {
    expect(content).toMatch(/resource\s+"aws_elasticache_subnet_group"\s+"main"/);
  });

  test("declares ElastiCache replication group", () => {
    expect(content).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"main"/);
  });

  test("Redis has at-rest encryption enabled", () => {
    expect(content).toMatch(/at_rest_encryption_enabled\s*=\s*true/);
  });

  test("Redis has transit encryption enabled", () => {
    expect(content).toMatch(/transit_encryption_enabled\s*=\s*true/);
  });

  test("Redis has automatic failover enabled", () => {
    expect(content).toMatch(/automatic_failover_enabled\s*=\s*true/);
  });

  test("Redis has multi-AZ enabled", () => {
    expect(content).toMatch(/multi_az_enabled\s*=\s*true/);
  });
});

describe("Terraform stack: tap_stack.tf - Application Load Balancer", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares ALB", () => {
    expect(content).toMatch(/resource\s+"aws_lb"\s+"main"/);
  });

  test("ALB is application type", () => {
    expect(content).toMatch(/load_balancer_type\s*=\s*"application"/);
  });

  test("ALB is internet-facing", () => {
    expect(content).toMatch(/internal\s*=\s*false/);
  });

  test("declares target group", () => {
    expect(content).toMatch(/resource\s+"aws_lb_target_group"\s+"main"/);
  });

  test("target group has health check configured", () => {
    expect(content).toMatch(/health_check\s*{/);
    expect(content).toMatch(/path\s*=\s*"\/health"/);
  });

  test("target group has stickiness enabled", () => {
    expect(content).toMatch(/stickiness\s*{/);
    expect(content).toMatch(/enabled\s*=\s*true/);
  });

  test("declares HTTPS listener", () => {
    expect(content).toMatch(/resource\s+"aws_lb_listener"\s+"https"/);
    expect(content).toMatch(/port\s*=\s*"443"/);
    expect(content).toMatch(/protocol\s*=\s*"HTTPS"/);
  });

  test("declares HTTP listener with redirect", () => {
    expect(content).toMatch(/resource\s+"aws_lb_listener"\s+"http"/);
    expect(content).toMatch(/type\s*=\s*"redirect"/);
  });
});

describe("Terraform stack: tap_stack.tf - Auto Scaling", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares launch template", () => {
    expect(content).toMatch(/resource\s+"aws_launch_template"\s+"main"/);
  });

  test("launch template uses t3.medium instance type by default", () => {
    expect(content).toMatch(/instance_type\s*=\s*var\.instance_type/);
    expect(content).toMatch(/default\s*=\s*"t3\.medium"/);
  });

  test("launch template has IAM instance profile", () => {
    expect(content).toMatch(/iam_instance_profile\s*{/);
  });

  test("launch template has user data", () => {
    expect(content).toMatch(/user_data\s*=/);
  });

  test("launch template has monitoring enabled", () => {
    expect(content).toMatch(/monitoring\s*{/);
    expect(content).toMatch(/enabled\s*=\s*true/);
  });

  test("declares auto scaling group", () => {
    expect(content).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
  });

  test("ASG has health check configured", () => {
    expect(content).toMatch(/health_check_type\s*=\s*"ELB"/);
  });

  test("declares CPU target tracking policy", () => {
    expect(content).toMatch(/resource\s+"aws_autoscaling_policy"\s+"cpu_target_tracking"/);
    expect(content).toMatch(/ASGAverageCPUUtilization/);
  });

  test("declares ALB request count tracking policy", () => {
    expect(content).toMatch(/resource\s+"aws_autoscaling_policy"\s+"alb_request_count"/);
    expect(content).toMatch(/ALBRequestCountPerTarget/);
  });
});

describe("Terraform stack: tap_stack.tf - Monitoring and Observability", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares CloudWatch alarms", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
  });

  test("declares high CPU alarm", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"/);
  });

  test("declares unhealthy hosts alarm", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"unhealthy_hosts"/);
  });

  test("declares RDS CPU alarm", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_high_cpu"/);
  });

  test("declares Redis CPU alarm", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"redis_high_cpu"/);
  });

  test("declares X-Ray sampling rule", () => {
    expect(content).toMatch(/resource\s+"aws_xray_sampling_rule"\s+"main"/);
  });

  test("declares CloudWatch log groups", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
  });
});

describe("Terraform stack: tap_stack.tf - Security Services", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares KMS key", () => {
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
  });

  test("KMS key has rotation enabled", () => {
    expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("declares GuardDuty detector", () => {
    expect(content).toMatch(/resource\s+"aws_guardduty_detector"\s+"main"/);
  });

  test("GuardDuty is enabled", () => {
    expect(content).toMatch(/enable\s*=\s*true/);
  });
});

describe("Terraform stack: tap_stack.tf - Tagging", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("resources have Environment tag", () => {
    expect(content).toMatch(/Environment\s*=\s*var\.environment/);
  });

  test("resources have Owner tag", () => {
    expect(content).toMatch(/Owner\s*=\s*var\.owner/);
  });

  test("resources have Project tag", () => {
    expect(content).toMatch(/Project\s*=\s*var\.project_name/);
  });
});

describe("Terraform stack: tap_stack.tf - Outputs", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares VPC output", () => {
    expect(content).toMatch(/output\s+"vpc_id"/);
  });

  test("declares ALB DNS output", () => {
    expect(content).toMatch(/output\s+"alb_dns_name"/);
  });

  test("declares RDS endpoint output", () => {
    expect(content).toMatch(/output\s+"rds_endpoint"/);
  });

  test("declares Redis endpoint output", () => {
    expect(content).toMatch(/output\s+"redis_primary_endpoint"/);
  });

  test("sensitive outputs are marked as sensitive", () => {
    const rdsOutputMatch = content.match(/output\s+"rds_endpoint"[\s\S]*?(?=output\s+"|$)/);
    const redisOutputMatch = content.match(/output\s+"redis_primary_endpoint"[\s\S]*?(?=output\s+"|$)/);

    expect(rdsOutputMatch).toBeTruthy();
    expect(rdsOutputMatch![0]).toMatch(/sensitive\s*=\s*true/);

    expect(redisOutputMatch).toBeTruthy();
    expect(redisOutputMatch![0]).toMatch(/sensitive\s*=\s*true/);
  });
});
