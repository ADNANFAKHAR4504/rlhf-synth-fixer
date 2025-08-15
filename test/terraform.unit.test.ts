// test/terraform.unit.test.ts
import * as fs from "fs";
import * as path from "path";
import * as assert from "assert";

/**
 * Unit tests for ../lib/tap_stack.tf
 * - Does not call terraform
 * - Uses text/regex checks to validate expected blocks & attributes
 */

const MAIN_TF_PATH = path.join(__dirname, "../lib/tap_stack.tf");

function fileExists(p: string) {
  return fs.existsSync(p) && fs.statSync(p).isFile();
}

function readFile(p: string) {
  return fs.readFileSync(p, "utf8");
}

function regexCount(content: string, re: RegExp) {
  const matches = content.match(re);
  return matches ? matches.length : 0;
}

describe("TAP Stack Terraform Configuration (tap_stack.tf)", () => {
  let tf: string;

  it("Configuration file exists", () => {
    assert.ok(fileExists(MAIN_TF_PATH), `Expected ${MAIN_TF_PATH} to exist`);
    tf = readFile(MAIN_TF_PATH);
    assert.ok(tf.length > 0, `${MAIN_TF_PATH} is empty`);
  });

  describe("Variables", () => {
    it("Defines required variables with description and default", () => {
      const required = [
        "aws_region",
        "project_name",
        "env",
        "domain_name",
        "hosted_zone_id",
      ];

      for (const v of required) {
        const varBlockRe = new RegExp(
          `variable\\s+"${v}"\\s*{([\\s\\S]*?)}`,
          "g"
        );
        const m = tf.match(varBlockRe);
        assert.ok(
          m && m.length >= 1,
          `variable "${v}" block not found in ${MAIN_TF_PATH}`
        );

        const block = m ? m[0] : "";
        assert.match(
          block,
          /description\s*=/,
          `variable "${v}" is missing description`
        );
        assert.match(
          block,
          /default\s*=/,
          `variable "${v}" is missing default`
        );
      }
    });
  });

  describe("Data sources", () => {
    it("Has aws_availability_zones data source", () => {
      assert.match(
        tf,
        /data\s+"aws_availability_zones"\s+"available"/,
        "data \"aws_availability_zones\" \"available\" is missing"
      );
    });

    it("Uses data.aws_availability_zones.available.names in locals.azs slice", () => {
      assert.match(
        tf,
        /locals\s*{[\s\S]*azs\s*=\s*slice\s*\(\s*data\.aws_availability_zones\.available\.names/,
        "locals.azs does not slice data.aws_availability_zones.available.names"
      );
    });
  });

  describe("Networking - VPC & Subnets", () => {
    it("Defines a VPC with /16 cidr and dns hostnames enabled", () => {
      assert.match(
        tf,
        /resource\s+"aws_vpc"\s+"main"/,
        "aws_vpc.main resource missing"
      );
      assert.match(
        tf,
        /cidr_block\s*=\s*"10\.0\.0\.0\/16"/,
        "aws_vpc.main cidr_block not set to 10.0.0.0/16"
      );
      assert.match(
        tf,
        /enable_dns_hostnames\s*=\s*true/,
        "enable_dns_hostnames not true on aws_vpc.main"
      );
      assert.match(
        tf,
        /enable_dns_support\s*=\s*true/,
        "enable_dns_support not true on aws_vpc.main"
      );
    });

    it("Defines public and private subnets iterating over AZs", () => {
      assert.match(
        tf,
        /resource\s+"aws_subnet"\s+"public"/,
        "aws_subnet.public missing"
      );
      assert.match(
        tf,
        /resource\s+"aws_subnet"\s+"private"/,
        "aws_subnet.private missing"
      );
      assert.match(
        tf,
        /map_public_ip_on_launch\s*=\s*true/,
        "public subnet should set map_public_ip_on_launch = true"
      );
    });

    it("Creates an Internet Gateway, NAT EIP and NAT Gateway", () => {
      assert.match(
        tf,
        /resource\s+"aws_internet_gateway"\s+"igw"/,
        "aws_internet_gateway.igw missing"
      );
      assert.match(
        tf,
        /resource\s+"aws_eip"\s+"nat"/,
        "aws_eip.nat missing"
      );
      assert.match(
        tf,
        /resource\s+"aws_nat_gateway"\s+"nat"/,
        "aws_nat_gateway.nat missing"
      );
      assert.match(
        tf,
        /allocation_id\s*=\s*aws_eip\.nat\.id/,
        "nat gateway should reference aws_eip.nat.id"
      );
    });

    it("Defines public and private route tables and associations", () => {
      assert.match(
        tf,
        /resource\s+"aws_route_table"\s+"public"/,
        "aws_route_table.public missing"
      );
      assert.match(
        tf,
        /resource\s+"aws_route_table"\s+"private"/,
        "aws_route_table.private missing"
      );
      assert.match(
        tf,
        /resource\s+"aws_route_table_association"\s+"public_assoc"/,
        "aws_route_table_association.public_assoc missing"
      );
      assert.match(
        tf,
        /resource\s+"aws_route_table_association"\s+"private_assoc"/,
        "aws_route_table_association.private_assoc missing"
      );
    });
  });

  describe("Security Groups", () => {
    it("Defines ALB SG allowing HTTP/HTTPS from 0.0.0.0/0", () => {
      assert.match(
        tf,
        /resource\s+"aws_security_group"\s+"alb_sg"/,
        "aws_security_group.alb_sg missing"
      );
      const alb80 = /ingress\s*{[\s\S]*from_port\s*=\s*80[\s\S]*cidr_blocks\s*=\s*\[["']0\.0\.0\.0\/0["']\][\s\S]*}/;
      const alb443 = /ingress\s*{[\s\S]*from_port\s*=\s*443[\s\S]*cidr_blocks\s*=\s*\[["']0\.0\.0\.0\/0["']\][\s\S]*}/;
      assert.match(tf, alb80, "ALB SG missing ingress for port 80 from 0.0.0.0/0");
      assert.match(tf, alb443, "ALB SG missing ingress for port 443 from 0.0.0.0/0");
    });

    it("Defines EC2 SG allowing port 80 from ALB SG only", () => {
      assert.match(
        tf,
        /resource\s+"aws_security_group"\s+"ec2_sg"/,
        "aws_security_group.ec2_sg missing"
      );
      assert.match(
        tf,
        /security_groups\s*=\s*\[ *aws_security_group\.alb_sg\.id *\]/,
        "ec2_sg ingress should reference aws_security_group.alb_sg.id"
      );
      assert.match(
        tf,
        /from_port\s*=\s*80[\s\S]*to_port\s*=\s*80/,
        "ec2_sg should allow port 80"
      );
    });
  });

  describe("ACM & DNS validation", () => {
    it("Creates ACM certificate using us-east-1 provider and DNS validation", () => {
      assert.match(
        tf,
        /resource\s+"aws_acm_certificate"\s+"cert"/,
        "aws_acm_certificate.cert missing"
      );
      assert.match(
        tf,
        /provider\s*=\s*aws\.us_east_1/,
        "ACM certificate should use provider = aws.us_east_1"
      );
      assert.match(
        tf,
        /validation_method\s*=\s*"DNS"/,
        "ACM certificate should use DNS validation"
      );
    });

    it("Creates Route53 records for certificate validation and ACM validation resource", () => {
      assert.match(
        tf,
        /resource\s+"aws_route53_record"\s+"cert_validation"/,
        "aws_route53_record.cert_validation missing"
      );
      assert.match(
        tf,
        /resource\s+"aws_acm_certificate_validation"\s+"cert_validation"/,
        "aws_acm_certificate_validation.cert_validation missing"
      );
      assert.match(
        tf,
        /zone_id\s*=\s*var\.hosted_zone_id/,
        "aws_route53_record.cert_validation should use var.hosted_zone_id"
      );
    });
  });

  describe("Load Balancer & Target Group", () => {
    it("Defines an ALB with public subnets and correct security group", () => {
      assert.match(tf, /resource\s+"aws_lb"\s+"alb"/, "aws_lb.alb missing");
      assert.match(
        tf,
        /security_groups\s*=\s*\[ *aws_security_group\.alb_sg\.id *\]/,
        "aws_lb.alb should reference alb_sg id"
      );
      assert.match(
        tf,
        /subnets\s*=\s*\[for s in aws_subnet\.public : s\.id\]/,
        "aws_lb.alb subnets should be public subnets"
      );
    });

    it("Creates a target group and HTTP->HTTPS redirect listener + HTTPS listener with ACM cert", () => {
      assert.match(
        tf,
        /resource\s+"aws_lb_target_group"\s+"tg"/,
        "aws_lb_target_group.tg missing"
      );
      assert.match(
        tf,
        /resource\s+"aws_lb_listener"\s+"http"/,
        "http listener missing"
      );
      assert.match(
        tf,
        /type\s*=\s*"redirect"[\s\S]*redirect\s*{[\s\S]*port\s*=\s*"443"[\s\S]*protocol\s*=\s*"HTTPS"/,
        "HTTP listener should redirect to HTTPS 443"
      );
      assert.match(
        tf,
        /resource\s+"aws_lb_listener"\s+"https"/,
        "https listener missing"
      );
      assert.match(
        tf,
        /certificate_arn\s*=\s*aws_acm_certificate_validation\.cert_validation\.certificate_arn/,
        "HTTPS listener should use certificate from aws_acm_certificate_validation"
      );
    });
  });

  describe("Compute - Launch Template & ASG", () => {
    it("Defines a launch template using the AMI data source and attaches security group", () => {
      assert.match(
        tf,
        /resource\s+"aws_launch_template"\s+"lt"/,
        "aws_launch_template.lt missing"
      );
      assert.match(
        tf,
        /image_id\s*=\s*data\.aws_ami\.amazon_linux\.id/,
        "launch template should use data.aws_ami.amazon_linux.id"
      );
      assert.match(
        tf,
        /vpc_security_group_ids\s*=\s*\[ *aws_security_group\.ec2_sg\.id *\]/,
        "launch template should reference ec2_sg id"
      );
    });

    it("Defines an autoscaling group attached to private subnets and target group", () => {
      assert.match(
        tf,
        /resource\s+"aws_autoscaling_group"\s+"asg"/,
        "aws_autoscaling_group.asg missing"
      );
      assert.match(
        tf,
        /vpc_zone_identifier\s*=\s*\[for s in aws_subnet\.private : s\.id\]/,
        "ASG should use private subnets"
      );
      assert.match(
        tf,
        /target_group_arns\s*=\s*\[ *aws_lb_target_group\.tg\.arn *\]/,
        "ASG should reference target group arn"
      );
      assert.match(
        tf,
        /desired_capacity\s*=\s*2/,
        "ASG should set desired_capacity = 2"
      );
    });

    it("Has a scaling policy using ASGAverageCPUUtilization target tracking", () => {
      assert.match(
        tf,
        /resource\s+"aws_autoscaling_policy"\s+"scale_out"/,
        "aws_autoscaling_policy.scale_out missing"
      );
      assert.match(
        tf,
        /predefined_metric_type\s*=\s*"ASGAverageCPUUtilization"/,
        "scaling policy should use ASGAverageCPUUtilization"
      );
      assert.match(
        tf,
        /target_value\s*=\s*60/,
        "scaling policy target_value should be 60"
      );
    });
  });

  describe("CloudWatch alarms", () => {
    it("Defines an alarm for high CPU with threshold 70", () => {
      assert.match(
        tf,
        /resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"/,
        "high_cpu alarm missing"
      );
      assert.match(
        tf,
        /threshold\s*=\s*70/,
        "high_cpu alarm threshold should be 70"
      );
    });

    it("Defines an UnHealthyHostCount alarm tied to ALB/Target Group", () => {
      assert.match(
        tf,
        /resource\s+"aws_cloudwatch_metric_alarm"\s+"unhealthy_hosts"/,
        "unhealthy_hosts alarm missing"
      );
      assert.match(
        tf,
        /namespace\s*=\s*"AWS\/ApplicationELB"/,
        "unhealthy_hosts should use AWS/ApplicationELB namespace"
      );
    });
  });

  describe("Outputs", () => {
    it("Exports expected outputs", () => {
      const expectedOutputs = [
        "vpc_id",
        "vpc_cidr",
        "public_subnet_ids",
        "private_subnet_ids",
        "alb_dns_name",
        "target_group_arn",
        "asg_name",
        "alb_sg_id",
        "ec2_sg_id",
        "acm_certificate_arn",
      ];

      for (const o of expectedOutputs) {
        const outRe = new RegExp(`output\\s+"${o}"\\s*{`, "g");
        assert.ok(
          outRe.test(tf),
          `output "${o}" not found in ${MAIN_TF_PATH}`
        );
      }
    });
  });

  describe("Tags & naming", () => {
    it("Uses local.tags & name_prefix patterns for resource names", () => {
      assert.match(
        tf,
        /locals\s*{[\s\S]*tags\s*=/,
        "locals.tags not defined"
      );
      assert.match(
        tf,
        /name_prefix\s*=\s*".*-\${var\.env}"/,
        "locals.name_prefix pattern not found (expected var.project_name-var.env)"
      );
      assert.match(
        tf,
        /tags\s*=\s*merge\s*\(local\.tags,\s*{[\s\S]*Name\s*=/,
        "tags should use merge(local.tags, { Name = ... }) pattern"
      );
    });
  });

  describe("Safety / anti-pattern checks", () => {
    it("Does not contain terraform init/apply commands", () => {
      assert.ok(!/terraform\s+init/.test(tf), "Found 'terraform init' text in tap_stack.tf");
      assert.ok(!/terraform\s+apply/.test(tf), "Found 'terraform apply' text in tap_stack.tf");
    });

    it("Does not declare provider block for main provider (should be in provider.tf)", () => {
      const providerPlain = /provider\s+"aws"\s*{[^}]*region\s*=/;
      const aliased = /provider\s+"aws"\s*{[^}]*alias\s*=\s*"us_east_1"[^}]*}/;
      if (providerPlain.test(tf) && !aliased.test(tf)) {
        assert.fail(
          "Found a non-aliased aws provider block in tap_stack.tf. Only aws.us_east_1 alias is allowed here."
        );
      }
    });
  });
});
