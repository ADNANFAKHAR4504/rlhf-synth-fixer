// Unit tests for Terraform infrastructure
// Static validation of HCL configuration files

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform Infrastructure Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
  });

  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });
  });

  describe("Variables", () => {
    test("declares environment_suffix variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("environment_suffix has proper default", () => {
      expect(stackContent).toMatch(/default\s*=\s*""/);
    });
  });

  describe("VPC Architecture", () => {
    test("creates VPC with proper CIDR", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("enables DNS hostnames and support", () => {
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates internet gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });
  });

  describe("Multi-AZ Subnets", () => {
    test("creates 3 public subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(stackContent).toMatch(/count\s*=\s*3/);
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("creates 3 private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(stackContent).toMatch(/count\s*=\s*3/);
    });

    test("uses availability zones data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
    });
  });

  describe("NAT Gateways", () => {
    test("creates 3 NAT gateways for high availability", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(stackContent).toMatch(/count\s*=\s*3/);
    });

    test("creates elastic IPs for NAT gateways", () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(stackContent).toMatch(/domain\s*=\s*"vpc"/);
    });
  });

  describe("Route Tables", () => {
    test("creates public route table with IGW route", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(stackContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test("creates private route tables with NAT routes", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(stackContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/);
    });

    test("creates route table associations", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  describe("Security Groups", () => {
    test("creates ALB security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
    });

    test("ALB allows HTTP and HTTPS traffic", () => {
      expect(stackContent).toMatch(/from_port\s*=\s*80/);
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
      expect(stackContent).toMatch(/to_port\s*=\s*80/);
      expect(stackContent).toMatch(/to_port\s*=\s*443/);
    });

    test("creates web security group with restricted access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"web"/);
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });
  });

  describe("Load Balancer", () => {
    test("creates application load balancer", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
      expect(stackContent).toMatch(/internal\s*=\s*false/);
    });

    test("creates target group with health checks", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"web"/);
      expect(stackContent).toMatch(/health_check\s*{/);
      expect(stackContent).toMatch(/enabled\s*=\s*true/);
    });

    test("creates listener", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"web"/);
      expect(stackContent).toMatch(/port\s*=\s*"80"/);
      expect(stackContent).toMatch(/protocol\s*=\s*"HTTP"/);
    });
  });

  describe("Auto Scaling", () => {
    test("uses Amazon Linux AMI data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux"/);
      expect(stackContent).toMatch(/owners\s*=\s*\["amazon"\]/);
    });

    test("creates launch template", () => {
      expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"web"/);
      expect(stackContent).toMatch(/instance_type\s*=\s*"t3\.micro"/);
      expect(stackContent).toMatch(/user_data\s*=/);
    });

    test("creates auto scaling group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"web"/);
      expect(stackContent).toMatch(/min_size\s*=\s*1/);
      expect(stackContent).toMatch(/max_size\s*=\s*6/);
      expect(stackContent).toMatch(/desired_capacity\s*=\s*3/);
    });

    test("ASG uses private subnets", () => {
      expect(stackContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });
  });

  describe("S3 Bucket", () => {
    test("creates S3 bucket with unique naming", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"access_logs"/);
      expect(stackContent).toMatch(/resource\s+"random_id"\s+"bucket_suffix"/);
    });

    test("enables bucket versioning", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"access_logs"/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("configures bucket logging", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_logging"\s+"access_logs"/);
      expect(stackContent).toMatch(/target_prefix\s*=\s*"access-logs\/"/);
    });

    test("blocks public access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"access_logs"/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });
  });

  describe("Tagging", () => {
    test("all resources have Environment = Production tag", () => {
      const environmentTags = stackContent.match(/Environment\s*=\s*"Production"/g);
      expect(environmentTags).not.toBeNull();
      expect(environmentTags!.length).toBeGreaterThan(10);
    });

    test("resources have consistent naming with environment suffix", () => {
      expect(stackContent).toMatch(/production\$\{var\.environment_suffix\}/);
    });
  });

  describe("Outputs", () => {
    test("defines VPC ID output", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
    });

    test("defines load balancer DNS output", () => {
      expect(stackContent).toMatch(/output\s+"load_balancer_dns"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_lb\.main\.dns_name/);
    });

    test("defines S3 bucket name output", () => {
      expect(stackContent).toMatch(/output\s+"s3_bucket_name"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_s3_bucket\.access_logs\.bucket/);
    });

    test("defines autoscaling group name output", () => {
      expect(stackContent).toMatch(/output\s+"autoscaling_group_name"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_autoscaling_group\.web\.name/);
    });
  });

  describe("Provider Configuration", () => {
    test("does NOT declare provider in stack file", () => {
      expect(stackContent).not.toMatch(/provider\s+"aws"\s*{/);
    });

    test("provider.tf contains AWS provider", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test("provider.tf specifies region as us-west-2", () => {
      expect(providerContent).toMatch(/region\s*=\s*"us-west-2"/);
    });
  });
});
