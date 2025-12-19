// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Validates terraform configuration without executing terraform commands

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const VARIABLES_REL = "../lib/variables.tf";

const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);
const variablesPath = path.resolve(__dirname, VARIABLES_REL);

describe("Terraform Production VPC Infrastructure", () => {
  let stackContent: string;
  let providerContent: string;
  let variablesContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
    variablesContent = fs.readFileSync(variablesPath, "utf8");
  });

  describe("File Structure", () => {
    test("tap_stack.tf exists and is readable", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
      expect(stackContent.length).toBeGreaterThan(0);
    });

    test("provider.tf exists and is readable", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
      expect(providerContent.length).toBeGreaterThan(0);
    });

    test("variables.tf exists and is readable", () => {
      expect(fs.existsSync(variablesPath)).toBe(true);
      expect(variablesContent.length).toBeGreaterThan(0);
    });
  });

  describe("Provider Configuration", () => {
    test("provider.tf contains AWS provider with version >= 5.0", () => {
      expect(providerContent).toMatch(/required_providers\s*{[\s\S]*aws\s*=\s*{[\s\S]*source\s*=\s*"hashicorp\/aws"/);
      expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test("tap_stack.tf does NOT declare provider (separation of concerns)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
      expect(stackContent).not.toMatch(/\bterraform\s*{[\s\S]*required_providers/);
    });

    test("provider.tf configures AWS region from variable", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{\s*region\s*=\s*var\.aws_region/);
    });
  });

  describe("Variables Configuration", () => {
    test("defines aws_region variable with us-east-1 default", () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(variablesContent).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test("defines ssh_allowed_ip variable for security", () => {
      expect(variablesContent).toMatch(/variable\s+"ssh_allowed_ip"\s*{/);
      expect(variablesContent).toMatch(/default\s*=\s*"203\.0\.113\.0\/32"/);
    });

    test("tap_stack.tf uses variables correctly", () => {
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\[var\.ssh_allowed_ip\]/);
    });
  });

  describe("VPC and Networking Resources", () => {
    test("creates VPC with correct CIDR and DNS settings", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"prod_vpc"\s*{/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates Internet Gateway attached to VPC", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"prod_igw"\s*{/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.prod_vpc\.id/);
    });

    test("creates public subnets with correct configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_subnets"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*2/);
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("creates private subnets without public IP assignment", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_subnets"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*2/);
      expect(stackContent).not.toMatch(/private_subnets[\s\S]*map_public_ip_on_launch\s*=\s*true/);
    });

    test("creates NAT Gateways with Elastic IPs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat_eips"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"prod_nat_gateways"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*2/);
      expect(stackContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test("configures route tables for public and private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public_route_table"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private_route_tables"\s*{/);
      expect(stackContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.prod_igw\.id/);
      expect(stackContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.prod_nat_gateways/);
    });

    test("creates VPC Flow Logs with CloudWatch integration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"prod_vpc_flow_log"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"\s*{/);
      expect(stackContent).toMatch(/traffic_type\s*=\s*"ALL"/);
      expect(stackContent).toMatch(/name\s*=\s*"ProdVPCFlowLogs"/);
    });
  });

  describe("Compute Layer Resources", () => {
    test("creates Auto Scaling Group with correct sizing", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"prod_asg"\s*{/);
      expect(stackContent).toMatch(/min_size\s*=\s*2/);
      expect(stackContent).toMatch(/max_size\s*=\s*6/);
      expect(stackContent).toMatch(/desired_capacity\s*=\s*2/);
    });

    test("creates Launch Template with specified AMI", () => {
      expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"prod_launch_template"\s*{/);
      expect(stackContent).toMatch(/image_id\s*=\s*"ami-0abcdef1234567890"/);
      expect(stackContent).toMatch(/instance_type\s*=\s*"t2\.micro"/);
    });

    test("configures user data for Apache installation", () => {
      expect(stackContent).toMatch(/user_data\s*=\s*base64encode/);
      expect(stackContent).toMatch(/yum install -y httpd/);
      expect(stackContent).toMatch(/systemctl start httpd/);
    });

    test("creates EC2 security group with correct rules", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ec2_sg"\s*{/);
      expect(stackContent).toMatch(/from_port\s*=\s*80/); // HTTP
      expect(stackContent).toMatch(/from_port\s*=\s*443/); // HTTPS
      expect(stackContent).toMatch(/from_port\s*=\s*22/); // SSH
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\[var\.ssh_allowed_ip\]/);
    });

    test("creates IAM role with S3 read-only access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_s3_readonly"\s*{/);
      expect(stackContent).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/AmazonS3ReadOnlyAccess"/);
    });
  });

  describe("Database Layer Resources", () => {
    test("creates RDS instance with correct configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"prod_rds"\s*{/);
      expect(stackContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(stackContent).toMatch(/engine_version\s*=\s*"8\.0"/);
      expect(stackContent).toMatch(/instance_class\s*=\s*"db\.t3\.micro"/);
      expect(stackContent).toMatch(/publicly_accessible\s*=\s*false/);
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("creates DB subnet group spanning private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"prod_db_subnet_group"\s*{/);
      expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private_subnets\[\*\]\.id/);
    });

    test("creates RDS security group with MySQL access from EC2", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"rds_sg"\s*{/);
      expect(stackContent).toMatch(/from_port\s*=\s*3306/);
      expect(stackContent).toMatch(/to_port\s*=\s*3306/);
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.ec2_sg\.id\]/);
    });
  });

  describe("Monitoring and Alerts", () => {
    test("creates SNS topic for alerts", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"prod_alert_topic"\s*{/);
      expect(stackContent).toMatch(/name\s*=\s*"ProdAlertTopic"/);
    });

    test("creates email subscription for SNS topic", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"alert_email"\s*{/);
      expect(stackContent).toMatch(/protocol\s*=\s*"email"/);
      expect(stackContent).toMatch(/endpoint\s*=\s*"alerts@company\.com"/);
    });

    test("creates CloudWatch alarm for CPU utilization", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"\s*{/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
      expect(stackContent).toMatch(/namespace\s*=\s*"AWS\/EC2"/);
      expect(stackContent).toMatch(/threshold\s*=\s*80/);
      expect(stackContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.prod_alert_topic\.arn\]/);
    });
  });

  describe("Tagging and Naming", () => {
    test("all resources use Prod prefix in names", () => {
      expect(stackContent).toMatch(/Name\s*=\s*"ProdVPC"/);
      expect(stackContent).toMatch(/Name\s*=\s*"ProdIGW"/);
      expect(stackContent).toMatch(/name\s*=\s*"ProdAutoScalingGroup"/);
      expect(stackContent).toMatch(/name\s*=\s*"ProdAlertTopic"/);
    });

    test("all resources have Environment and Project tags", () => {
      const environmentTags = stackContent.match(/Environment\s*=\s*"Production"/g);
      const projectTags = stackContent.match(/Project\s*=\s*"BusinessCriticalVPC"/g);
      
      expect(environmentTags).toBeTruthy();
      expect(projectTags).toBeTruthy();
      expect(environmentTags!.length).toBeGreaterThan(10); // Multiple resources tagged
      expect(projectTags!.length).toBeGreaterThan(10); // Multiple resources tagged
    });
  });

  describe("Data Sources", () => {
    test("uses availability zones data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
      expect(stackContent).toMatch(/state\s*=\s*"available"/);
    });
  });

  describe("Outputs", () => {
    test("defines outputs for integration testing", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"\s*{/);
      expect(stackContent).toMatch(/output\s+"public_subnet_ids"\s*{/);
      expect(stackContent).toMatch(/output\s+"private_subnet_ids"\s*{/);
      expect(stackContent).toMatch(/output\s+"autoscaling_group_name"\s*{/);
      expect(stackContent).toMatch(/output\s+"rds_endpoint"\s*{/);
      expect(stackContent).toMatch(/output\s+"sns_topic_arn"\s*{/);
      expect(stackContent).toMatch(/output\s+"cloudwatch_alarm_name"\s*{/);
    });

    test("sensitive output is marked as sensitive", () => {
      expect(stackContent).toMatch(/output\s+"rds_endpoint"\s*{[\s\S]*sensitive\s*=\s*true/);
    });
  });
});
