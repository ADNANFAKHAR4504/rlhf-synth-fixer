import fs from "fs";
import path from "path";

const STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");

describe("Terraform Infrastructure Unit Tests", () => {
  let stackContent: string;

  beforeAll(() => {
    if (!fs.existsSync(STACK_PATH)) {
      throw new Error(`tap_stack.tf not found at ${STACK_PATH}`);
    }
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
  });

  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
    });

    test("provider.tf exists", () => {
      const providerPath = path.resolve(__dirname, "../lib/provider.tf");
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test("user_data.sh exists", () => {
      const userDataPath = path.resolve(__dirname, "../lib/user_data.sh");
      expect(fs.existsSync(userDataPath)).toBe(true);
    });
  });

  describe("Infrastructure Resources", () => {
    test("declares locals block with unique naming", () => {
      expect(stackContent).toMatch(/locals\s*{/);
      expect(stackContent).toMatch(/task_id\s*=\s*"task-274789"/);
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\$\{local\.task_id\}-tap"/);
      expect(stackContent).toMatch(/common_tags\s*=/);
    });

    test("declares all required variables", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
      expect(stackContent).toMatch(/variable\s+"project"\s*{/);
      expect(stackContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
      expect(stackContent).toMatch(/variable\s+"public_subnet_cidrs"\s*{/);
      expect(stackContent).toMatch(/variable\s+"private_subnet_cidrs"\s*{/);
      expect(stackContent).toMatch(/variable\s+"instance_type"\s*{/);
      expect(stackContent).toMatch(/variable\s+"min_size"\s*{/);
      expect(stackContent).toMatch(/variable\s+"max_size"\s*{/);
      expect(stackContent).toMatch(/variable\s+"desired_capacity"\s*{/);
      expect(stackContent).toMatch(/variable\s+"db_instance_class"\s*{/);
      expect(stackContent).toMatch(/variable\s+"db_allocated_storage"\s*{/);
      expect(stackContent).toMatch(/variable\s+"db_name"\s*{/);
      expect(stackContent).toMatch(/variable\s+"db_username"\s*{/);
    });

    test("uses data source for availability zones", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
      expect(stackContent).toMatch(/state\s*=\s*"available"/);
    });

    test("uses data source for AMI lookup", () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux"\s*{/);
      expect(stackContent).toMatch(/most_recent\s*=\s*true/);
      expect(stackContent).toMatch(/owners\s*=\s*\["amazon"\]/);
    });

    test("creates VPC resource with proper configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
      expect(stackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags,/);
    });

    test("creates Internet Gateway with proper naming", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
      expect(stackContent).toMatch(/Name\s*=\s*"\$\{local\.name_prefix\}-igw"/);
    });

    test("creates multiple public subnets with correct configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*length\(var\.public_subnet_cidrs\)/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*var\.public_subnet_cidrs\[count\.index\]/);
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
      expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
    });

    test("creates multiple private subnets with correct configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*length\(var\.private_subnet_cidrs\)/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*var\.private_subnet_cidrs\[count\.index\]/);
      expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
    });

    test("creates multiple Elastic IPs for NAT Gateways", () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*length\(var\.public_subnet_cidrs\)/);
      expect(stackContent).toMatch(/domain\s*=\s*"vpc"/);
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test("creates multiple NAT Gateways for high availability", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*length\(var\.public_subnet_cidrs\)/);
      expect(stackContent).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
      expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
    });

    test("creates public route table with internet gateway route", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
      expect(stackContent).toMatch(/route\s*{[\s\S]*?cidr_block\s*=\s*"0\.0\.0\.0\/0"[\s\S]*?gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test("creates multiple private route tables with NAT gateway routes", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*length\(var\.private_subnet_cidrs\)/);
      expect(stackContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/);
    });

    test("creates route table associations", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*length\(var\.public_subnet_cidrs\)/);
      expect(stackContent).toMatch(/count\s*=\s*length\(var\.private_subnet_cidrs\)/);
    });
  });

  describe("Security Groups", () => {
    test("creates ALB security group with HTTPS and HTTP rules", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"\s*{/);
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\$\{local\.name_prefix\}-alb-sg"/);
      expect(stackContent).toMatch(/description\s*=\s*"Security group for Application Load Balancer"/);

      // Check for HTTPS ingress
      expect(stackContent).toMatch(/ingress\s*{[\s\S]*?from_port\s*=\s*443[\s\S]*?to_port\s*=\s*443[\s\S]*?protocol\s*=\s*"tcp"/);

      // Check for HTTP ingress
      expect(stackContent).toMatch(/ingress\s*{[\s\S]*?from_port\s*=\s*80[\s\S]*?to_port\s*=\s*80[\s\S]*?protocol\s*=\s*"tcp"/);
    });

    test("creates EC2 security group with ALB access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"\s*{/);
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\$\{local\.name_prefix\}-ec2-sg"/);
      expect(stackContent).toMatch(/description\s*=\s*"Security group for EC2 instances"/);
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });

    test("creates RDS security group with EC2 access only", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"\s*{/);
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\$\{local\.name_prefix\}-rds-sg"/);
      expect(stackContent).toMatch(/description\s*=\s*"Security group for RDS database"/);
      expect(stackContent).toMatch(/from_port\s*=\s*5432/);
      expect(stackContent).toMatch(/to_port\s*=\s*5432/);
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.ec2\.id\]/);
    });
  });

  describe("Database Configuration", () => {
    test("creates DB subnet group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"\s*{/);
      expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });

    test("generates random password for database", () => {
      expect(stackContent).toMatch(/resource\s+"random_password"\s+"db_password"\s*{/);
      expect(stackContent).toMatch(/length\s*=\s*16/);
      expect(stackContent).toMatch(/special\s*=\s*true/);
    });

    test("stores DB password in Parameter Store", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_password"\s*{/);
      expect(stackContent).toMatch(/type\s*=\s*"SecureString"/);
      expect(stackContent).toMatch(/value\s*=\s*random_password\.db_password\.result/);
    });

    test("creates RDS instance with proper configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"\s*{/);
      expect(stackContent).toMatch(/engine\s*=\s*"postgres"/);
      expect(stackContent).toMatch(/engine_version\s*=\s*"15\.7"/);
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*7/);
      expect(stackContent).toMatch(/skip_final_snapshot\s*=\s*true/);
    });
  });

  describe("IAM Configuration", () => {
    test("creates IAM role for EC2 instances", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"\s*{/);
      expect(stackContent).toMatch(/Service = "ec2\.amazonaws\.com"/);
    });

    test("creates IAM policy with proper permissions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"\s*{/);
      expect(stackContent).toMatch(/ssm:GetParameter/);
      expect(stackContent).toMatch(/logs:CreateLogGroup/);
      expect(stackContent).toMatch(/logs:PutLogEvents/);
    });

    test("creates IAM instance profile", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"\s*{/);
      expect(stackContent).toMatch(/role\s*=\s*aws_iam_role\.ec2_role\.name/);
    });
  });

  describe("Auto Scaling and Load Balancing", () => {
    test("creates launch template with proper configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"main"\s*{/);
      expect(stackContent).toMatch(/image_id\s*=\s*data\.aws_ami\.amazon_linux\.id/);
      expect(stackContent).toMatch(/instance_type\s*=\s*var\.instance_type/);
      expect(stackContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.ec2\.id\]/);
    });

    test("creates Application Load Balancer", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"main"\s*{/);
      expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
      expect(stackContent).toMatch(/internal\s*=\s*false/);
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
      expect(stackContent).toMatch(/subnets\s*=\s*aws_subnet\.public\[\*\]\.id/);
    });

    test("creates ALB target group with health checks", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"\s*{/);
      expect(stackContent).toMatch(/port\s*=\s*80/);
      expect(stackContent).toMatch(/protocol\s*=\s*"HTTP"/);
      expect(stackContent).toMatch(/health_check\s*{/);
      expect(stackContent).toMatch(/healthy_threshold\s*=\s*2/);
      expect(stackContent).toMatch(/path\s*=\s*"\/"/);
    });

    test("creates HTTPS listener with certificate", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"https"\s*{/);
      expect(stackContent).toMatch(/port\s*=\s*"443"/);
      expect(stackContent).toMatch(/protocol\s*=\s*"HTTPS"/);
      expect(stackContent).toMatch(/certificate_arn\s*=\s*aws_acm_certificate\.main\.arn/);
    });

    test("creates HTTP listener with HTTPS redirect", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"http"\s*{/);
      expect(stackContent).toMatch(/port\s*=\s*"80"/);
      expect(stackContent).toMatch(/protocol\s*=\s*"HTTP"/);
      expect(stackContent).toMatch(/type\s*=\s*"redirect"/);
      expect(stackContent).toMatch(/status_code\s*=\s*"HTTP_301"/);
    });

    test("creates Auto Scaling Group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"\s*{/);
      expect(stackContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private\[\*\]\.id/);
      expect(stackContent).toMatch(/target_group_arns\s*=\s*\[aws_lb_target_group\.main\.arn\]/);
      expect(stackContent).toMatch(/health_check_type\s*=\s*"ELB"/);
      expect(stackContent).toMatch(/min_size\s*=\s*var\.min_size/);
      expect(stackContent).toMatch(/max_size\s*=\s*var\.max_size/);
      expect(stackContent).toMatch(/desired_capacity\s*=\s*var\.desired_capacity/);
    });
  });

  describe("SSL/TLS Configuration", () => {
    test("creates TLS private key", () => {
      expect(stackContent).toMatch(/resource\s+"tls_private_key"\s+"main"\s*{/);
      expect(stackContent).toMatch(/algorithm\s*=\s*"RSA"/);
      expect(stackContent).toMatch(/rsa_bits\s*=\s*2048/);
    });

    test("creates self-signed certificate", () => {
      expect(stackContent).toMatch(/resource\s+"tls_self_signed_cert"\s+"main"\s*{/);
      expect(stackContent).toMatch(/private_key_pem\s*=\s*tls_private_key\.main\.private_key_pem/);
      expect(stackContent).toMatch(/validity_period_hours\s*=\s*8760/);
    });

    test("creates ACM certificate", () => {
      expect(stackContent).toMatch(/resource\s+"aws_acm_certificate"\s+"main"\s*{/);
      expect(stackContent).toMatch(/private_key\s*=\s*tls_private_key\.main\.private_key_pem/);
      expect(stackContent).toMatch(/certificate_body\s*=\s*tls_self_signed_cert\.main\.cert_pem/);
    });
  });

  describe("Monitoring and Logging", () => {
    test("creates CloudWatch log group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"app_logs"\s*{/);
      expect(stackContent).toMatch(/retention_in_days\s*=\s*14/);
    });

    test("creates scaling policies", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_up"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_down"\s*{/);
      expect(stackContent).toMatch(/scaling_adjustment\s*=\s*1/);
      expect(stackContent).toMatch(/scaling_adjustment\s*=\s*-1/);
    });

    test("creates CloudWatch alarms", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"low_cpu"\s*{/);
      expect(stackContent).toMatch(/metric_name\s*=\s*"CPUUtilization"/);
      expect(stackContent).toMatch(/threshold\s*=\s*"80"/);
      expect(stackContent).toMatch(/threshold\s*=\s*"20"/);
    });
  });

  describe("Parameter Store Configuration", () => {
    test("stores application configuration in Parameter Store", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"app_config"\s*{/);
      expect(stackContent).toMatch(/for_each\s*=/);
      expect(stackContent).toMatch(/database\/host/);
      expect(stackContent).toMatch(/database\/port/);
      expect(stackContent).toMatch(/database\/name/);
      expect(stackContent).toMatch(/database\/username/);
      expect(stackContent).toMatch(/app\/log_level/);
      expect(stackContent).toMatch(/app\/environment/);
    });
  });

  describe("Outputs", () => {
    test("declares all required outputs with descriptions", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"\s*{/);
      expect(stackContent).toMatch(/description\s*=\s*"ID of the VPC"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_vpc\.main\.id/);

      expect(stackContent).toMatch(/output\s+"public_subnet_ids"\s*{/);
      expect(stackContent).toMatch(/description\s*=\s*"IDs of the public subnets"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_subnet\.public\[\*\]\.id/);

      expect(stackContent).toMatch(/output\s+"private_subnet_ids"\s*{/);
      expect(stackContent).toMatch(/description\s*=\s*"IDs of the private subnets"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_subnet\.private\[\*\]\.id/);

      expect(stackContent).toMatch(/output\s+"load_balancer_dns_name"\s*{/);
      expect(stackContent).toMatch(/description\s*=\s*"DNS name of the load balancer"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_lb\.main\.dns_name/);

      expect(stackContent).toMatch(/output\s+"database_endpoint"\s*{/);
      expect(stackContent).toMatch(/description\s*=\s*"RDS instance endpoint"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_db_instance\.main\.endpoint/);
      expect(stackContent).toMatch(/sensitive\s*=\s*true/);

      expect(stackContent).toMatch(/output\s+"auto_scaling_group_name"\s*{/);
      expect(stackContent).toMatch(/description\s*=\s*"Name of the Auto Scaling Group"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_autoscaling_group\.main\.name/);
    });
  });

  describe("Code Quality and Best Practices", () => {
    test("uses consistent unique naming throughout", () => {
      expect(stackContent).toMatch(/\$\{local\.name_prefix\}/);
      expect(stackContent).toMatch(/task-274789/);
    });

    test("uses merge function for consistent tagging", () => {
      expect(stackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags,/);
    });

    test("no hardcoded credentials in files", () => {
      expect(stackContent).not.toMatch(/password\s*=\s*"[^"]*"/);
      expect(stackContent).not.toMatch(/secret\s*=\s*"[^"]*"/);
    });

    test("proper separation of concerns", () => {
      expect(stackContent).not.toMatch(/provider\s+"aws"\s*{/);
    });

    test("all variables have proper type definitions", () => {
      const variableMatches = stackContent.match(/variable\s+"[^"]+"\s*{[^}]*}/g) || [];
      variableMatches.forEach(variable => {
        expect(variable).toMatch(/type\s*=/);
      });
    });

    test("all variables have descriptions", () => {
      const variableMatches = stackContent.match(/variable\s+"[^"]+"\s*{[^}]*}/g) || [];
      variableMatches.forEach(variable => {
        expect(variable).toMatch(/description\s*=/);
      });
    });

    test("uses modern Terraform syntax", () => {
      expect(stackContent).toMatch(/domain\s*=\s*"vpc"/); // Modern EIP syntax
      expect(stackContent).not.toMatch(/vpc\s*=\s*true/); // Legacy EIP syntax
    });

    test("proper dependency management", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test("consistent resource naming convention", () => {
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\$\{local\.name_prefix\}/);
    });
  });

  describe("Security Validation", () => {
    test("security groups follow principle of least privilege", () => {
      // ALB security group should only allow HTTP/HTTPS
      expect(stackContent).toMatch(/from_port\s*=\s*80/);
      expect(stackContent).toMatch(/from_port\s*=\s*443/);

      // EC2 security group should only allow traffic from ALB
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);

      // RDS security group should only allow traffic from EC2
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.ec2\.id\]/);
    });

    test("database storage is encrypted", () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("database passwords are stored securely", () => {
      expect(stackContent).toMatch(/type\s*=\s*"SecureString"/);
      expect(stackContent).toMatch(/random_password\.db_password\.result/);
    });

    test("subnets are properly segregated", () => {
      expect(stackContent).toMatch(/Type\s*=\s*"Public"/);
      expect(stackContent).toMatch(/Type\s*=\s*"Private"/);
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });
  });
});
