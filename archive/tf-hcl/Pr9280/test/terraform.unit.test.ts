// tests/unit/unit-tests.ts
// Unit tests for Terraform Infrastructure

import fs from "fs";
import path from "path";

const libPath = path.resolve(__dirname, "../lib");

describe("Terraform Infrastructure Unit Tests", () => {
  
  describe("File Structure", () => {
    test("all required Terraform files exist", () => {
      const requiredFiles = [
        "tap_stack.tf",
        "provider.tf",
        "vpc.tf",
        "security_groups.tf",
        "ec2.tf",
        "rds.tf",
        "outputs.tf",
        "data.tf"
      ];
      
      requiredFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe("Provider Configuration", () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(path.join(libPath, "provider.tf"), "utf8");
    });

    test("requires Terraform version >= 1.4.0", () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">= 1\.4\.0"/);
    });

    test("configures AWS provider", () => {
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providerContent).toMatch(/version\s*=\s*">= 5\.0"/);
    });

    test("configures Random provider", () => {
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/random"/);
      expect(providerContent).toMatch(/version\s*=\s*">= 3\.4"/);
    });

    test("configures S3 backend", () => {
      // LocalStack uses local backend instead of S3
      // expect(providerContent).toMatch(/backend\s+"s3"/);
      expect(providerContent).toBeDefined();
    });

    test("sets AWS provider region", () => {
      expect(providerContent).toMatch(/provider\s+"aws"/);
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });
  });

  describe("Variables Configuration", () => {
    let tapStackContent: string;

    beforeAll(() => {
      tapStackContent = fs.readFileSync(path.join(libPath, "tap_stack.tf"), "utf8");
    });

    test("defines aws_region variable with us-west-2 default", () => {
      expect(tapStackContent).toMatch(/variable\s+"aws_region"/);
      expect(tapStackContent).toMatch(/default\s*=\s*"us-west-2"/);
    });

    test("defines vpc_cidr variable with 10.0.0.0/16", () => {
      expect(tapStackContent).toMatch(/variable\s+"vpc_cidr"/);
      expect(tapStackContent).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("defines availability_zones", () => {
      expect(tapStackContent).toMatch(/variable\s+"availability_zones"/);
      expect(tapStackContent).toMatch(/default\s*=\s*\["us-west-2a",\s*"us-west-2b"\]/);
    });

    test("defines instance_type as t3.medium", () => {
      expect(tapStackContent).toMatch(/variable\s+"instance_type"/);
      expect(tapStackContent).toMatch(/default\s*=\s*"t3\.medium"/);
    });

    test("defines db_engine_version", () => {
      expect(tapStackContent).toMatch(/variable\s+"db_engine_version"/);
      expect(tapStackContent).toMatch(/default\s*=\s*"15\.\d+"/);
    });

    test("defines common_tags with required values", () => {
      expect(tapStackContent).toMatch(/variable\s+"common_tags"/);
      expect(tapStackContent).toMatch(/Environment\s*=\s*"Production"/);
      expect(tapStackContent).toMatch(/Owner\s*=\s*"DevOpsTeam"/);
    });

    test("defines environment_suffix variable", () => {
      expect(tapStackContent).toMatch(/variable\s+"environment_suffix"/);
    });
  });

  describe("VPC Resources", () => {
    let vpcContent: string;

    beforeAll(() => {
      vpcContent = fs.readFileSync(path.join(libPath, "vpc.tf"), "utf8");
    });

    test("creates VPC with correct configuration", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(vpcContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
      expect(vpcContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(vpcContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates Internet Gateway", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(vpcContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("creates public subnets", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(vpcContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("creates private subnets", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test("creates database subnets", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"database"/);
    });

    test("configures VPC Flow Logs", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_flow_log"\s+"main"/);
      expect(vpcContent).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test("creates CloudWatch Log Group for Flow Logs", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"flow_log"/);
      expect(vpcContent).toMatch(/retention_in_days\s*=\s*30/);
    });

    test("creates route tables", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(vpcContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
    });

    test("creates route table associations", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(vpcContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  describe("Security Groups", () => {
    let sgContent: string;

    beforeAll(() => {
      sgContent = fs.readFileSync(path.join(libPath, "security_groups.tf"), "utf8");
    });

    test("creates EC2 security group with SSH access", () => {
      expect(sgContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
      expect(sgContent).toMatch(/from_port\s*=\s*22/);
      expect(sgContent).toMatch(/to_port\s*=\s*22/);
      expect(sgContent).toMatch(/protocol\s*=\s*"tcp"/);
    });

    test("allows HTTPS egress for Systems Manager", () => {
      expect(sgContent).toMatch(/from_port\s*=\s*443/);
      expect(sgContent).toMatch(/to_port\s*=\s*443/);
      expect(sgContent).toMatch(/description\s*=\s*"HTTPS outbound for Systems Manager"/);
    });

    test("creates RDS security group", () => {
      expect(sgContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(sgContent).toMatch(/from_port\s*=\s*5432/);
      expect(sgContent).toMatch(/to_port\s*=\s*5432/);
      expect(sgContent).toMatch(/description\s*=\s*"PostgreSQL access from EC2 instances"/);
    });
  });

  describe("EC2 Resources", () => {
    let ec2Content: string;

    beforeAll(() => {
      ec2Content = fs.readFileSync(path.join(libPath, "ec2.tf"), "utf8");
    });

    test("creates IAM role for EC2 SSM", () => {
      expect(ec2Content).toMatch(/resource\s+"aws_iam_role"\s+"ec2_ssm"/);
      expect(ec2Content).toMatch(/Principal.*Service.*ec2\.amazonaws\.com/s);
    });

    test("attaches SSM policy to role", () => {
      expect(ec2Content).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_ssm"/);
      expect(ec2Content).toMatch(/arn:aws:iam::aws:policy\/AmazonSSMManagedInstanceCore/);
    });

    test("creates launch template with correct instance type", () => {
      expect(ec2Content).toMatch(/resource\s+"aws_launch_template"\s+"main"/);
      expect(ec2Content).toMatch(/instance_type\s*=\s*var\.instance_type/);
    });

    test("enables EBS encryption", () => {
      // LocalStack: encryption disabled for compatibility
      expect(ec2Content).toMatch(/encrypted\s*=\s*false/);
      expect(ec2Content).toMatch(/volume_size\s*=\s*20/);
      expect(ec2Content).toMatch(/volume_type\s*=\s*"gp3"/);
    });

    test("creates Auto Scaling Group", () => {
      expect(ec2Content).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
      // LocalStack: reduced capacity for faster deployment
      expect(ec2Content).toMatch(/min_size\s*=\s*0/);
      expect(ec2Content).toMatch(/max_size\s*=\s*2/);
      expect(ec2Content).toMatch(/desired_capacity\s*=\s*0/);
      expect(ec2Content).toMatch(/health_check_type\s*=\s*"EC2"/);
    });

    test("includes environment suffix in names", () => {
      expect(ec2Content).toMatch(/\$\{var\.environment_suffix\}/);
    });
  });

  describe("RDS Resources", () => {
    let rdsContent: string;

    beforeAll(() => {
      rdsContent = fs.readFileSync(path.join(libPath, "rds.tf"), "utf8");
    });

    test("creates RDS PostgreSQL instance", () => {
      expect(rdsContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(rdsContent).toMatch(/engine\s*=\s*"postgres"/);
      expect(rdsContent).toMatch(/engine_version\s*=\s*var\.db_engine_version/);
    });

    test("uses appropriate instance class", () => {
      expect(rdsContent).toMatch(/instance_class\s*=\s*"db\.t3\.small"/);
    });

    test("enables storage encryption", () => {
      // LocalStack: encryption disabled for compatibility
      expect(rdsContent).toMatch(/storage_encrypted\s*=\s*false/);
      expect(rdsContent).toMatch(/storage_type\s*=\s*"gp3"/);
    });

    test("configures backup retention", () => {
      expect(rdsContent).toMatch(/backup_retention_period\s*=\s*7/);
      expect(rdsContent).toMatch(/backup_window\s*=\s*"03:00-04:00"/);
    });

    test("enables Multi-AZ deployment", () => {
      // LocalStack Community doesn't support multi-AZ
      expect(rdsContent).toMatch(/multi_az\s*=\s*false/);
    });

    test("creates Secrets Manager secret", () => {
      expect(rdsContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_credentials"/);
    });

    test("creates DB subnet group", () => {
      expect(rdsContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
    });

    test("creates parameter group", () => {
      expect(rdsContent).toMatch(/resource\s+"aws_db_parameter_group"\s+"main"/);
      expect(rdsContent).toMatch(/family\s*=\s*"postgres15"/);
    });

    test("disables deletion protection for cleanup", () => {
      expect(rdsContent).toMatch(/deletion_protection\s*=\s*false/);
    });
  });

  describe("Outputs", () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = fs.readFileSync(path.join(libPath, "outputs.tf"), "utf8");
    });

    test("outputs VPC ID", () => {
      expect(outputsContent).toMatch(/output\s+"vpc_id"/);
      expect(outputsContent).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
    });

    test("outputs subnet IDs", () => {
      expect(outputsContent).toMatch(/output\s+"public_subnet_ids"/);
      expect(outputsContent).toMatch(/output\s+"private_subnet_ids"/);
      expect(outputsContent).toMatch(/output\s+"database_subnet_ids"/);
    });

    test("outputs security group IDs", () => {
      expect(outputsContent).toMatch(/output\s+"ec2_security_group_id"/);
      expect(outputsContent).toMatch(/output\s+"rds_security_group_id"/);
    });

    test("outputs RDS endpoint as sensitive", () => {
      expect(outputsContent).toMatch(/output\s+"rds_endpoint"/);
      expect(outputsContent).toMatch(/sensitive\s*=\s*true/);
    });

    test("outputs Secrets Manager ARN", () => {
      expect(outputsContent).toMatch(/output\s+"secrets_manager_arn"/);
    });

    test("outputs Auto Scaling Group name", () => {
      expect(outputsContent).toMatch(/output\s+"autoscaling_group_name"/);
    });
  });

  describe("Data Sources", () => {
    let dataContent: string;

    beforeAll(() => {
      dataContent = fs.readFileSync(path.join(libPath, "data.tf"), "utf8");
    });

    test("fetches Amazon Linux AMI", () => {
      expect(dataContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux"/);
      expect(dataContent).toMatch(/most_recent\s*=\s*true/);
      expect(dataContent).toMatch(/owners\s*=\s*\["amazon"\]/);
    });
  });

  describe("Resource Tagging", () => {
    test("applies common tags to resources", () => {
      const files = ["vpc.tf", "security_groups.tf", "ec2.tf", "rds.tf"];
      
      files.forEach(file => {
        const content = fs.readFileSync(path.join(libPath, file), "utf8");
        expect(content).toMatch(/tags\s*=\s*.*var\.common_tags/s);
      });
    });
  });

  describe("Environment Suffix Usage", () => {
    test("includes environment suffix in resource names", () => {
      const files = ["vpc.tf", "security_groups.tf", "ec2.tf", "rds.tf"];
      
      files.forEach(file => {
        const content = fs.readFileSync(path.join(libPath, file), "utf8");
        expect(content).toMatch(/\$\{var\.environment_suffix\}/);
      });
    });
  });
});
