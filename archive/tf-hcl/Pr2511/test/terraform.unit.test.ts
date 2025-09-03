// tests/unit/terraform.unit.test.ts
// Unit tests for multi-region high availability infrastructure
// Validates tap_stack.tf against PROMPT.md requirements

import fs from "fs";
import path from "path";



const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const PROMPT_REL = "../lib/PROMPT.md";

const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);
const promptPath = path.resolve(__dirname, PROMPT_REL);

describe("Terraform Multi-Region High Availability Infrastructure", () => {
  let stackContent: string;
  let providerContent: string;
  let promptContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
    promptContent = fs.readFileSync(promptPath, "utf8");
  });

  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test("PROMPT.md exists", () => {
      expect(fs.existsSync(promptPath)).toBe(true);
    });
  });

  describe("Provider Configuration", () => {
    test("has primary AWS provider in provider.tf", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test("has secondary AWS provider with alias in provider.tf", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{\s*alias\s*=\s*"secondary"/);
    });

    test("secondary provider configured for us-west-2 in provider.tf", () => {
      expect(providerContent).toMatch(/region\s*=\s*"us-west-2"/);
    });

    test("has aws_region variable in provider.tf", () => {
      expect(providerContent).toMatch(/variable\s+"aws_region"/);
    });

    test("does NOT declare providers in tap_stack.tf (provider.tf owns providers)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });
  });

  describe("Variables Section", () => {
    test("has environment variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment"/);
    });

    test("has instance_type variable", () => {
      expect(stackContent).toMatch(/variable\s+"instance_type"/);
    });

    test("has min_capacity variable", () => {
      expect(stackContent).toMatch(/variable\s+"min_capacity"/);
    });

    test("has desired_capacity variable", () => {
      expect(stackContent).toMatch(/variable\s+"desired_capacity"/);
    });

    test("has max_capacity variable", () => {
      expect(stackContent).toMatch(/variable\s+"max_capacity"/);
    });

    test("has domain_name variable", () => {
      expect(stackContent).toMatch(/variable\s+"domain_name"/);
    });

    test("has key_pair_name variable", () => {
      expect(stackContent).toMatch(/variable\s+"key_pair_name"/);
    });
  });

  describe("Locals Section", () => {
    test("has regions configuration", () => {
      expect(stackContent).toMatch(/regions\s*=\s*{/);
    });

    test("defines primary region as us-east-1", () => {
      expect(stackContent).toMatch(/primary\s*=\s*"us-east-1"/);
    });

    test("defines secondary region as us-west-2", () => {
      expect(stackContent).toMatch(/secondary\s*=\s*"us-west-2"/);
    });

    test("has availability zones configuration", () => {
      expect(stackContent).toMatch(/availability_zones\s*=\s*{/);
    });

    test("has common tags", () => {
      expect(stackContent).toMatch(/common_tags\s*=\s*{/);
    });
  });

  describe("Data Sources", () => {
    test("has Amazon Linux AMI data source for primary region", () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux"/);
    });

    test("has Amazon Linux AMI data source for secondary region", () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_west"/);
    });
  });

  describe("Route 53 Configuration", () => {
    test("has Route 53 hosted zone", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_zone"/);
    });

    test("has Route 53 health checks", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_health_check"/);
    });

    test("has Route 53 records with failover", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route53_record"/);
    });

    test("has failover routing policy", () => {
      expect(stackContent).toMatch(/failover_routing_policy/);
    });
  });

  describe("SSL Certificates", () => {
    test("has ACM certificate for primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_acm_certificate"\s+"primary"/);
    });

    test("has ACM certificate for secondary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_acm_certificate"\s+"secondary"/);
    });
  });

  describe("Primary Region Infrastructure", () => {
    test("has VPC for primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"primary"/);
    });

    test("has internet gateway for primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"primary"/);
    });

    test("has public subnets for primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_primary"/);
    });

    test("has private subnets for primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_primary"/);
    });

    test("has NAT gateways for primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"primary"/);
    });

    test("has security groups for primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"web_primary"/);
    });

    test("has IAM roles for primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
    });

    test("has launch template for primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"primary"/);
    });

    test("has application load balancer for primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"primary"/);
    });

    test("has target group for primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"primary"/);
    });

    test("has ALB listeners for primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"primary_http"/);
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"primary_https"/);
    });

    test("has auto scaling group for primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"primary"/);
    });

    test("has auto scaling policies for primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_up_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_down_primary"/);
    });

    test("has CloudWatch alarms for primary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_high_primary"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_low_primary"/);
    });
  });

  describe("Secondary Region Infrastructure", () => {
    test("has VPC for secondary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"secondary"/);
    });

    test("has internet gateway for secondary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"secondary"/);
    });

    test("has public subnets for secondary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_secondary"/);
    });

    test("has private subnets for secondary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_secondary"/);
    });

    test("has NAT gateways for secondary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"secondary"/);
    });

    test("has security groups for secondary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb_secondary"/);
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"web_secondary"/);
    });

    test("has IAM roles for secondary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role_secondary"/);
    });

    test("has launch template for secondary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"secondary"/);
    });

    test("has application load balancer for secondary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"secondary"/);
    });

    test("has target group for secondary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"secondary"/);
    });

    test("has ALB listeners for secondary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"secondary_http"/);
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"secondary_https"/);
    });

    test("has auto scaling group for secondary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"secondary"/);
    });

    test("has auto scaling policies for secondary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_up_secondary"/);
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_down_secondary"/);
    });

    test("has CloudWatch alarms for secondary region", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_high_secondary"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_low_secondary"/);
    });
  });

  describe("Monitoring and Logging", () => {
    test("has SNS topic for alerts", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
    });

    test("has VPC flow logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_flow_log"/);
    });

    test("has CloudWatch log groups", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
    });

    test("has IAM roles for VPC flow logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"vpc_flow_log_role"/);
    });
  });

  describe("Outputs", () => {
    test("has primary ALB DNS name output", () => {
      expect(stackContent).toMatch(/output\s+"primary_alb_dns_name"/);
    });

    test("has secondary ALB DNS name output", () => {
      expect(stackContent).toMatch(/output\s+"secondary_alb_dns_name"/);
    });

    test("has Route 53 zone ID output", () => {
      expect(stackContent).toMatch(/output\s+"route53_zone_id"/);
    });

    test("has Route 53 name servers output", () => {
      expect(stackContent).toMatch(/output\s+"route53_name_servers"/);
    });

    test("has primary ASG name output", () => {
      expect(stackContent).toMatch(/output\s+"primary_asg_name"/);
    });

    test("has secondary ASG name output", () => {
      expect(stackContent).toMatch(/output\s+"secondary_asg_name"/);
    });

    test("has VPC IDs output", () => {
      expect(stackContent).toMatch(/output\s+"primary_vpc_id"/);
      expect(stackContent).toMatch(/output\s+"secondary_vpc_id"/);
    });

    test("has SNS topic ARN output", () => {
      expect(stackContent).toMatch(/output\s+"sns_topic_arn"/);
    });

    test("has app domain name output", () => {
      expect(stackContent).toMatch(/output\s+"app_domain_name"/);
    });

    test("has region outputs", () => {
      expect(stackContent).toMatch(/output\s+"primary_region"/);
      expect(stackContent).toMatch(/output\s+"secondary_region"/);
    });
  });

  describe("Security Requirements", () => {
    test("EC2 instances use private subnets", () => {
      expect(stackContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private_/);
    });

    test("has security groups with least privilege", () => {
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\./);
    });

    test("has IAM roles with least privilege", () => {
      expect(stackContent).toMatch(/iam_instance_profile/);
    });
  });

  describe("Performance Requirements", () => {
    test("has health checks configured", () => {
      expect(stackContent).toMatch(/health_check/);
    });

    test("has auto scaling policies", () => {
      expect(stackContent).toMatch(/autoscaling_policy/);
    });

    test("has CloudWatch alarms", () => {
      expect(stackContent).toMatch(/cloudwatch_metric_alarm/);
    });
  });

  describe("High Availability Features", () => {
    test("has cross-zone load balancing enabled", () => {
      expect(stackContent).toMatch(/enable_cross_zone_load_balancing\s*=\s*true/);
    });

    test("has instance refresh configured", () => {
      expect(stackContent).toMatch(/instance_refresh/);
    });

    test("has health check grace period", () => {
      expect(stackContent).toMatch(/health_check_grace_period/);
    });
  });
});
