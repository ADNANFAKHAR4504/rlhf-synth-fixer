// test/terraform.unit.test.ts
import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";

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
        "vpc_cidr",
        "instance_type",
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

      // vpc_cidr default should be 10.0.0.0/16
      const vpcVar = tf.match(/variable\s+"vpc_cidr"\s*{([\s\S]*?)}/);
      assert.ok(vpcVar, "variable vpc_cidr not found");
      assert.match(
        vpcVar![0],
        /default\s*=\s*"10\.0\.0\.0\/16"/,
        "vpc_cidr default should be 10.0.0.0/16"
      );
    });
  });

  describe("Data sources", () => {
    it("Has aws_availability_zones data source", () => {
      assert.match(
        tf,
        /data\s+"aws_availability_zones"\s+"available"/,
        'data "aws_availability_zones" "available" is missing'
      );
    });

    it("Uses data.aws_availability_zones.available.names in locals.azs slice", () => {
      assert.match(
        tf,
        /locals\s*{[\s\S]*azs\s*=\s*slice\s*\(\s*data\.aws_availability_zones\.available\.names/,
        "locals.azs does not slice data.aws_availability_zones.available.names"
      );
    });

    it("Has aws_ami al2 data source and launch template uses it", () => {
      assert.match(
        tf,
        /data\s+"aws_ami"\s+"al2"/,
        'data "aws_ami" "al2" is missing'
      );
      assert.match(
        tf,
        /resource\s+"aws_launch_template"\s+"app"[\s\S]*image_id\s*=\s*data\.aws_ami\.al2\.id/,
        "launch template should use data.aws_ami.al2.id"
      );
    });
  });

  describe("Networking - VPC & Subnets", () => {
    it("Defines a VPC with var vpc_cidr and DNS features enabled", () => {
      assert.match(tf, /resource\s+"aws_vpc"\s+"main"/, "aws_vpc.main resource missing");
      assert.match(
        tf,
        /cidr_block\s*=\s*var\.vpc_cidr/,
        "aws_vpc.main cidr_block should reference var.vpc_cidr"
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
      assert.match(tf, /resource\s+"aws_subnet"\s+"public"/, "aws_subnet.public missing");
      assert.match(tf, /resource\s+"aws_subnet"\s+"private"/, "aws_subnet.private missing");
      assert.match(
        tf,
        /map_public_ip_on_launch\s*=\s*true/,
        "public subnet should set map_public_ip_on_launch = true"
      );
    });

    it("Creates an Internet Gateway, NAT EIP (domain=vpc) and NAT Gateway", () => {
      assert.match(
        tf,
        /resource\s+"aws_internet_gateway"\s+"igw"/,
        "aws_internet_gateway.igw missing"
      );
      assert.match(tf, /resource\s+"aws_eip"\s+"nat"/, "aws_eip.nat missing");
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
      assert.match(
        tf,
        /resource\s+"aws_eip"\s+"nat"[\s\S]*domain\s*=\s*"vpc"/,
        "aws_eip.nat should set domain = \"vpc\""
      );
    });

    it("Defines public and private route tables and associations", () => {
      assert.match(tf, /resource\s+"aws_route_table"\s+"public"/, "aws_route_table.public missing");
      assert.match(tf, /resource\s+"aws_route_table"\s+"private"/, "aws_route_table.private missing");
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
      assert.match(tf, /resource\s+"aws_security_group"\s+"alb_sg"/, "aws_security_group.alb_sg missing");
      const alb80 = /ingress\s*{[\s\S]*from_port\s*=\s*80[\s\S]*cidr_blocks\s*=\s*\[["']0\.0\.0\.0\/0["']\][\s\S]*}/;
      const alb443 = /ingress\s*{[\s\S]*from_port\s*=\s*443[\s\S]*cidr_blocks\s*=\s*\[["']0\.0\.0\.0\/0["']\][\s\S]*}/;
      assert.match(tf, alb80, "ALB SG missing ingress for port 80 from 0.0.0.0/0");
      assert.match(tf, alb443, "ALB SG missing ingress for port 443 from 0.0.0.0/0");
    });

    it("Defines App/EC2 SG allowing port 80 from ALB SG only", () => {
      assert.match(tf, /resource\s+"aws_security_group"\s+"app_sg"/, "aws_security_group.app_sg missing");
      assert.match(
        tf,
        /security_groups\s*=\s*\[\s*aws_security_group\.alb_sg\.id\s*\]/,
        "app_sg ingress should reference aws_security_group.alb_sg.id"
      );
      assert.match(
        tf,
        /from_port\s*=\s*80[\s\S]*to_port\s*=\s*80/,
        "app_sg should allow port 80"
      );
    });
  });

  describe("Load Balancer & Target Group", () => {
    it("Defines an ALB with public subnets and correct security group", () => {
      assert.match(tf, /resource\s+"aws_lb"\s+"app"/, "aws_lb.app missing");
      assert.match(
        tf,
        /security_groups\s*=\s*\[\s*aws_security_group\.alb_sg\.id\s*\]/,
        "aws_lb.app should reference alb_sg id"
      );
      assert.match(
        tf,
        /subnets\s*=\s*\[for s in aws_subnet\.public : s\.id\]/,
        "aws_lb.app subnets should be public subnets"
      );
    });

    it("Creates a target group and a plain HTTP listener forwarding to it", () => {
      assert.match(tf, /resource\s+"aws_lb_target_group"\s+"app_tg"/, "aws_lb_target_group.app_tg missing");
      assert.match(tf, /resource\s+"aws_lb_listener"\s+"http_forward"/, "http_forward listener missing");
      assert.match(
        tf,
        /default_action\s*{[\s\S]*type\s*=\s*"forward"[\s\S]*target_group_arn\s*=\s*aws_lb_target_group\.app_tg\.arn[\s\S]*}/,
        "HTTP listener should forward to app_tg"
      );
    });
  });

  describe("Compute - Launch Template & ASG", () => {
    it("Defines a launch template using the AMI data source and attaches app_sg", () => {
      assert.match(tf, /resource\s+"aws_launch_template"\s+"app"/, "aws_launch_template.app missing");
      assert.match(
        tf,
        /image_id\s*=\s*data\.aws_ami\.al2\.id/,
        "launch template should use data.aws_ami.al2.id"
      );
      assert.match(
        tf,
        /vpc_security_group_ids\s*=\s*\[\s*aws_security_group\.app_sg\.id\s*\]/,
        "launch template should reference app_sg id"
      );
    });

    it("Defines an autoscaling group attached to private subnets and target group", () => {
      assert.match(tf, /resource\s+"aws_autoscaling_group"\s+"app"/, "aws_autoscaling_group.app missing");
      assert.match(
        tf,
        /vpc_zone_identifier\s*=\s*\[for s in aws_subnet\.private : s\.id\]/,
        "ASG should use private subnets"
      );
      assert.match(
        tf,
        /target_group_arns\s*=\s*\[\s*aws_lb_target_group\.app_tg\.arn\s*\]/,
        "ASG should reference target group arn"
      );
      assert.match(tf, /desired_capacity\s*=\s*2/, "ASG should set desired_capacity = 2");
    });
  });

  describe("Scaling Policies & CloudWatch alarms", () => {
    it("Has SimpleScaling policies for scale out/in", () => {
      assert.match(tf, /resource\s+"aws_autoscaling_policy"\s+"scale_out"/, "scale_out policy missing");
      assert.match(
        tf,
        /resource\s+"aws_autoscaling_policy"\s+"scale_out"[\s\S]*policy_type\s*=\s*"SimpleScaling"/,
        "scale_out should use SimpleScaling"
      );
      assert.match(
        tf,
        /resource\s+"aws_autoscaling_policy"\s+"scale_out"[\s\S]*adjustment_type\s*=\s*"ChangeInCapacity"/,
        "scale_out adjustment_type should be ChangeInCapacity"
      );
      assert.match(
        tf,
        /resource\s+"aws_autoscaling_policy"\s+"scale_out"[\s\S]*scaling_adjustment\s*=\s*1/,
        "scale_out scaling_adjustment should be 1"
      );

      assert.match(tf, /resource\s+"aws_autoscaling_policy"\s+"scale_in"/, "scale_in policy missing");
      assert.match(
        tf,
        /resource\s+"aws_autoscaling_policy"\s+"scale_in"[\s\S]*policy_type\s*=\s*"SimpleScaling"/,
        "scale_in should use SimpleScaling"
      );
      assert.match(
        tf,
        /resource\s+"aws_autoscaling_policy"\s+"scale_in"[\s\S]*scaling_adjustment\s*=\s*-1/,
        "scale_in scaling_adjustment should be -1"
      );
    });

    it("Defines a high CPU alarm (threshold 60) tied to scale_out and an ALB unhealthy-hosts alarm", () => {
      assert.match(
        tf,
        /resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_high"/,
        "cpu_high alarm missing"
      );
      assert.match(
        tf,
        /resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_high"[\s\S]*namespace\s*=\s*"AWS\/EC2"/,
        "cpu_high alarm should use AWS/EC2 namespace"
      );
      assert.match(
        tf,
        /resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_high"[\s\S]*threshold\s*=\s*60/,
        "cpu_high alarm threshold should be 60"
      );
      assert.match(
        tf,
        /resource\s+"aws_cloudwatch_metric_alarm"\s+"cpu_high"[\s\S]*alarm_actions\s*=\s*\[\s*aws_autoscaling_policy\.scale_out\.arn\s*\]/,
        "cpu_high alarm should trigger scale_out policy"
      );

      assert.match(
        tf,
        /resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_unhealthy"/,
        "alb_unhealthy alarm missing"
      );
      assert.match(
        tf,
        /resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_unhealthy"[\s\S]*namespace\s*=\s*"AWS\/ApplicationELB"/,
        "alb_unhealthy should use AWS/ApplicationELB namespace"
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
        "app_sg_id",
      ];

      for (const o of expectedOutputs) {
        const outRe = new RegExp(`output\\s+"${o}"\\s*{`, "g");
        assert.ok(outRe.test(tf), `output "${o}" not found in ${MAIN_TF_PATH}`);
      }
    });
  });

  describe("Tags & naming", () => {
    it("Uses local.tags & name_prefix patterns for resource names", () => {
      assert.match(tf, /locals\s*{[\s\S]*tags\s*=/, "locals.tags not defined");
      assert.match(
        tf,
        /name_prefix\s*=\s*"\$\{var\.project_name}-\$\{var\.env}"/,
        "locals.name_prefix pattern not found (expected ${var.project_name}-${var.env})"
      );
      assert.match(
        tf,
        /tags\s*=\s*merge\s*\(\s*local\.tags\s*,\s*{[\s\S]*Name\s*=/,
        "tags should use merge(local.tags, { Name = ... }) pattern"
      );
    });
  });

  describe("Safety / anti-pattern checks", () => {
    it("Does not contain terraform init/apply commands", () => {
      assert.ok(!/terraform\s+init/.test(tf), "Found 'terraform init' text in tap_stack.tf");
      assert.ok(!/terraform\s+apply/.test(tf), "Found 'terraform apply' text in tap_stack.tf");
    });

    it("Does not declare any provider block (provider.tf handles it)", () => {
      const anyProvider = /provider\s+"aws"\s*{/;
      assert.ok(!anyProvider.test(tf), "Provider block must not be in tap_stack.tf");
    });
  });
});
