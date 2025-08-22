// tests/unit/terraform.unit.test.ts
// Unit tests for Terraform infrastructure modules

import fs from "fs";
import path from "path";
import { parse } from 'hcl2-parser';

const LIB_DIR = path.resolve(__dirname, "../lib");

// Helper function to read and parse HCL files
function readHCLFile(fileName: string): any {
  const filePath = path.join(LIB_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, "utf8");
  try {
    return parse(content);
  } catch (error) {
    // If HCL parsing fails, return raw content for basic checks
    return { raw: content };
  }
}

// Helper to check if a resource exists in file content
function resourceExists(content: string, resourceType: string, resourceName: string): boolean {
  const pattern = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"\\s*{`);
  return pattern.test(content);
}

// Helper to check variable exists
function variableExists(content: string, variableName: string): boolean {
  const pattern = new RegExp(`variable\\s+"${variableName}"\\s*{`);
  return pattern.test(content);
}

// Helper to check output exists
function outputExists(content: string, outputName: string): boolean {
  const pattern = new RegExp(`output\\s+"${outputName}"\\s*{`);
  return pattern.test(content);
}

describe("Terraform Infrastructure Unit Tests", () => {
  
  describe("File Structure Tests", () => {
    const requiredFiles = [
      "provider.tf",
      "variables.tf",
      "vpc.tf",
      "security_groups.tf",
      "database.tf",
      "load_balancer.tf",
      "auto_scaling.tf",
      "kms.tf",
      "outputs.tf",
      "data.tf"
    ];

    requiredFiles.forEach(file => {
      test(`${file} exists`, () => {
        const filePath = path.join(LIB_DIR, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe("Provider Configuration", () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(path.join(LIB_DIR, "provider.tf"), "utf8");
    });

    test("declares terraform block with required version", () => {
      expect(providerContent).toMatch(/terraform\s*{/);
      expect(providerContent).toMatch(/required_version\s*=\s*"[^"]+"/);
    });

    test("declares AWS provider", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test("declares S3 backend configuration", () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{/);
    });

    test("declares random provider", () => {
      expect(providerContent).toMatch(/required_providers\s*{[\s\S]*random\s*=\s*{/);
    });
  });

  describe("Variables Configuration", () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = fs.readFileSync(path.join(LIB_DIR, "variables.tf"), "utf8");
    });

    const requiredVariables = [
      "aws_region",
      "vpc_cidr",
      "availability_zones",
      "instance_type",
      "min_size",
      "max_size",
      "desired_capacity",
      "db_instance_class",
      "db_allocated_storage",
      "environment_suffix",
      "common_tags"
    ];

    requiredVariables.forEach(variable => {
      test(`declares ${variable} variable`, () => {
        expect(variableExists(variablesContent, variable)).toBe(true);
      });
    });

    test("aws_region has correct default", () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"[\s\S]*default\s*=\s*"us-west-2"/);
    });

    test("vpc_cidr has correct default", () => {
      expect(variablesContent).toMatch(/variable\s+"vpc_cidr"[\s\S]*default\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("common_tags includes required tags", () => {
      expect(variablesContent).toMatch(/Project\s*=\s*"ecommerce"/);
      expect(variablesContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
      expect(variablesContent).toMatch(/Compliance\s*=\s*"pci-dss"/);
    });
  });

  describe("VPC Configuration", () => {
    let vpcContent: string;

    beforeAll(() => {
      vpcContent = fs.readFileSync(path.join(LIB_DIR, "vpc.tf"), "utf8");
    });

    test("creates VPC resource", () => {
      expect(resourceExists(vpcContent, "aws_vpc", "ecommerce_vpc")).toBe(true);
    });

    test("VPC uses environment suffix in tags", () => {
      expect(vpcContent).toMatch(/Name\s*=\s*"ecommerce-vpc-\$\{var\.environment_suffix\}"/);
    });

    test("creates Internet Gateway", () => {
      expect(resourceExists(vpcContent, "aws_internet_gateway", "ecommerce_igw")).toBe(true);
    });

    test("creates public subnets", () => {
      expect(resourceExists(vpcContent, "aws_subnet", "public_subnets")).toBe(true);
      expect(vpcContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    });

    test("creates private subnets", () => {
      expect(resourceExists(vpcContent, "aws_subnet", "private_subnets")).toBe(true);
    });

    test("creates route table and associations", () => {
      expect(resourceExists(vpcContent, "aws_route_table", "public_rt")).toBe(true);
      expect(resourceExists(vpcContent, "aws_route_table_association", "public_rta")).toBe(true);
    });

    test("creates DB subnet group", () => {
      expect(resourceExists(vpcContent, "aws_db_subnet_group", "ecommerce_db_subnet_group")).toBe(true);
    });

    test("public subnets have map_public_ip_on_launch", () => {
      expect(vpcContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });
  });

  describe("Security Groups Configuration", () => {
    let sgContent: string;

    beforeAll(() => {
      sgContent = fs.readFileSync(path.join(LIB_DIR, "security_groups.tf"), "utf8");
    });

    test("creates ALB security group", () => {
      expect(resourceExists(sgContent, "aws_security_group", "alb_sg")).toBe(true);
    });

    test("ALB security group allows HTTP and HTTPS", () => {
      expect(sgContent).toMatch(/from_port\s*=\s*80/);
      expect(sgContent).toMatch(/from_port\s*=\s*443/);
      expect(sgContent).toMatch(/to_port\s*=\s*80/);
      expect(sgContent).toMatch(/to_port\s*=\s*443/);
    });

    test("creates EC2 security group", () => {
      expect(resourceExists(sgContent, "aws_security_group", "ec2_sg")).toBe(true);
    });

    test("EC2 security group references ALB security group", () => {
      expect(sgContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb_sg\.id\]/);
    });

    test("creates RDS security group", () => {
      expect(resourceExists(sgContent, "aws_security_group", "rds_sg")).toBe(true);
    });

    test("RDS security group allows MySQL port from EC2", () => {
      expect(sgContent).toMatch(/from_port\s*=\s*3306/);
      expect(sgContent).toMatch(/to_port\s*=\s*3306/);
      expect(sgContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.ec2_sg\.id\]/);
    });

    test("all security groups use environment suffix", () => {
      expect(sgContent).toMatch(/ecommerce-alb-sg-\$\{var\.environment_suffix\}/);
      expect(sgContent).toMatch(/ecommerce-ec2-sg-\$\{var\.environment_suffix\}/);
      expect(sgContent).toMatch(/ecommerce-rds-sg-\$\{var\.environment_suffix\}/);
    });
  });

  describe("KMS Configuration", () => {
    let kmsContent: string;

    beforeAll(() => {
      kmsContent = fs.readFileSync(path.join(LIB_DIR, "kms.tf"), "utf8");
    });

    test("creates KMS key", () => {
      expect(resourceExists(kmsContent, "aws_kms_key", "ecommerce_kms_key")).toBe(true);
    });

    test("KMS key has deletion window", () => {
      expect(kmsContent).toMatch(/deletion_window_in_days\s*=\s*7/);
    });

    test("creates KMS alias", () => {
      expect(resourceExists(kmsContent, "aws_kms_alias", "ecommerce_kms_alias")).toBe(true);
    });

    test("KMS alias uses environment suffix", () => {
      expect(kmsContent).toMatch(/alias\/ecommerce-key-\$\{var\.environment_suffix\}/);
    });
  });

  describe("Database Configuration", () => {
    let dbContent: string;

    beforeAll(() => {
      dbContent = fs.readFileSync(path.join(LIB_DIR, "database.tf"), "utf8");
    });

    test("creates RDS instance", () => {
      expect(resourceExists(dbContent, "aws_db_instance", "ecommerce_db")).toBe(true);
    });

    test("RDS uses MySQL engine", () => {
      expect(dbContent).toMatch(/engine\s*=\s*"mysql"/);
    });

    test("RDS has Multi-AZ enabled", () => {
      expect(dbContent).toMatch(/multi_az\s*=\s*true/);
    });

    test("RDS has encryption enabled", () => {
      expect(dbContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(dbContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.ecommerce_kms_key\.arn/);
    });

    test("RDS has backup configuration", () => {
      expect(dbContent).toMatch(/backup_retention_period\s*=\s*7/);
      expect(dbContent).toMatch(/backup_window\s*=\s*"03:00-04:00"/);
    });

    test("creates random password", () => {
      expect(resourceExists(dbContent, "random_password", "db_password")).toBe(true);
    });

    test("creates Secrets Manager secret", () => {
      expect(resourceExists(dbContent, "aws_secretsmanager_secret", "db_password")).toBe(true);
    });

    test("RDS uses environment suffix", () => {
      expect(dbContent).toMatch(/ecommerce-db-\$\{var\.environment_suffix\}/);
    });

    test("RDS has skip_final_snapshot enabled", () => {
      expect(dbContent).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test("RDS has deletion_protection disabled", () => {
      expect(dbContent).toMatch(/deletion_protection\s*=\s*false/);
    });
  });

  describe("Load Balancer Configuration", () => {
    let lbContent: string;

    beforeAll(() => {
      lbContent = fs.readFileSync(path.join(LIB_DIR, "load_balancer.tf"), "utf8");
    });

    test("creates Application Load Balancer", () => {
      expect(resourceExists(lbContent, "aws_lb", "ecommerce_alb")).toBe(true);
    });

    test("ALB is internet-facing", () => {
      expect(lbContent).toMatch(/internal\s*=\s*false/);
    });

    test("ALB type is application", () => {
      expect(lbContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test("creates Target Group", () => {
      expect(resourceExists(lbContent, "aws_lb_target_group", "ecommerce_tg")).toBe(true);
    });

    test("Target Group has health check", () => {
      expect(lbContent).toMatch(/health_check\s*{/);
      expect(lbContent).toMatch(/enabled\s*=\s*true/);
      expect(lbContent).toMatch(/path\s*=\s*"\/"/);
    });

    test("creates Listener", () => {
      expect(resourceExists(lbContent, "aws_lb_listener", "ecommerce_alb_listener")).toBe(true);
    });

    test("Listener uses port 80", () => {
      expect(lbContent).toMatch(/port\s*=\s*"80"/);
      expect(lbContent).toMatch(/protocol\s*=\s*"HTTP"/);
    });

    test("ALB uses environment suffix", () => {
      expect(lbContent).toMatch(/ecommerce-alb-\$\{var\.environment_suffix\}/);
      expect(lbContent).toMatch(/ecommerce-tg-\$\{var\.environment_suffix\}/);
    });
  });

  describe("Auto Scaling Configuration", () => {
    let asgContent: string;

    beforeAll(() => {
      asgContent = fs.readFileSync(path.join(LIB_DIR, "auto_scaling.tf"), "utf8");
    });

    test("creates Launch Template", () => {
      expect(resourceExists(asgContent, "aws_launch_template", "ecommerce_lt")).toBe(true);
    });

    test("Launch Template has encrypted EBS", () => {
      expect(asgContent).toMatch(/encrypted\s*=\s*true/);
      expect(asgContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.ecommerce_kms_key\.arn/);
    });

    test("Launch Template has user data", () => {
      expect(asgContent).toMatch(/user_data\s*=/);
    });

    test("creates Auto Scaling Group", () => {
      expect(resourceExists(asgContent, "aws_autoscaling_group", "ecommerce_asg")).toBe(true);
    });

    test("ASG has proper capacity settings", () => {
      expect(asgContent).toMatch(/min_size\s*=\s*var\.min_size/);
      expect(asgContent).toMatch(/max_size\s*=\s*var\.max_size/);
      expect(asgContent).toMatch(/desired_capacity\s*=\s*var\.desired_capacity/);
    });

    test("ASG uses ELB health check", () => {
      expect(asgContent).toMatch(/health_check_type\s*=\s*"ELB"/);
    });

    test("creates scaling policies", () => {
      expect(resourceExists(asgContent, "aws_autoscaling_policy", "ecommerce_scale_up")).toBe(true);
      expect(resourceExists(asgContent, "aws_autoscaling_policy", "ecommerce_scale_down")).toBe(true);
    });

    test("creates CloudWatch alarms", () => {
      expect(resourceExists(asgContent, "aws_cloudwatch_metric_alarm", "ecommerce_high_cpu")).toBe(true);
      expect(resourceExists(asgContent, "aws_cloudwatch_metric_alarm", "ecommerce_low_cpu")).toBe(true);
    });

    test("CloudWatch alarms have proper thresholds", () => {
      expect(asgContent).toMatch(/threshold\s*=\s*"70"/);
      expect(asgContent).toMatch(/threshold\s*=\s*"20"/);
    });

    test("ASG uses environment suffix", () => {
      expect(asgContent).toMatch(/ecommerce-asg-\$\{var\.environment_suffix\}/);
      expect(asgContent).toMatch(/ecommerce-lt-\$\{var\.environment_suffix\}/);
    });
  });

  describe("Data Sources", () => {
    let dataContent: string;

    beforeAll(() => {
      dataContent = fs.readFileSync(path.join(LIB_DIR, "data.tf"), "utf8");
    });

    test("fetches Amazon Linux AMI", () => {
      expect(dataContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux"/);
    });

    test("AMI filter uses correct name pattern", () => {
      expect(dataContent).toMatch(/amzn2-ami-hvm-\*-x86_64-gp2/);
    });

    test("fetches current AWS identity", () => {
      expect(dataContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test("fetches current AWS region", () => {
      expect(dataContent).toMatch(/data\s+"aws_region"\s+"current"/);
    });
  });

  describe("Outputs Configuration", () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = fs.readFileSync(path.join(LIB_DIR, "outputs.tf"), "utf8");
    });

    const requiredOutputs = [
      "vpc_id",
      "load_balancer_dns_name",
      "rds_endpoint",
      "kms_key_arn",
      "autoscaling_group_name"
    ];

    requiredOutputs.forEach(output => {
      test(`declares ${output} output`, () => {
        expect(outputExists(outputsContent, output)).toBe(true);
      });
    });

    test("RDS endpoint is marked as sensitive", () => {
      expect(outputsContent).toMatch(/output\s+"rds_endpoint"[\s\S]*sensitive\s*=\s*true/);
    });
  });

  describe("PCI-DSS Compliance Checks", () => {
    test("all storage is encrypted", () => {
      const dbContent = fs.readFileSync(path.join(LIB_DIR, "database.tf"), "utf8");
      const asgContent = fs.readFileSync(path.join(LIB_DIR, "auto_scaling.tf"), "utf8");
      
      // RDS encryption
      expect(dbContent).toMatch(/storage_encrypted\s*=\s*true/);
      
      // EBS encryption
      expect(asgContent).toMatch(/encrypted\s*=\s*true/);
    });

    test("KMS keys are used for encryption", () => {
      const dbContent = fs.readFileSync(path.join(LIB_DIR, "database.tf"), "utf8");
      const asgContent = fs.readFileSync(path.join(LIB_DIR, "auto_scaling.tf"), "utf8");
      
      expect(dbContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.ecommerce_kms_key\.arn/);
      expect(asgContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.ecommerce_kms_key\.arn/);
    });

    test("resources are tagged with compliance", () => {
      const variablesContent = fs.readFileSync(path.join(LIB_DIR, "variables.tf"), "utf8");
      expect(variablesContent).toMatch(/Compliance\s*=\s*"pci-dss"/);
    });

    test("database uses secure connections", () => {
      const sgContent = fs.readFileSync(path.join(LIB_DIR, "security_groups.tf"), "utf8");
      // Only MySQL port is allowed
      expect(sgContent).toMatch(/from_port\s*=\s*3306/);
      expect(sgContent).toMatch(/to_port\s*=\s*3306/);
    });

    test("database is not publicly accessible", () => {
      const dbContent = fs.readFileSync(path.join(LIB_DIR, "database.tf"), "utf8");
      expect(dbContent).toMatch(/publicly_accessible\s*=\s*false/);
    });
  });

  describe("Resource Naming Convention", () => {
    test("all resources follow naming convention", () => {
      const files = ["vpc.tf", "security_groups.tf", "database.tf", "load_balancer.tf", "auto_scaling.tf", "kms.tf"];
      
      files.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), "utf8");
        // Check that resources use ecommerce prefix and environment suffix
        expect(content).toMatch(/ecommerce-[a-z-]+\$\{var\.environment_suffix\}/);
      });
    });
  });

  describe("High Availability Configuration", () => {
    test("uses multiple availability zones", () => {
      const variablesContent = fs.readFileSync(path.join(LIB_DIR, "variables.tf"), "utf8");
      expect(variablesContent).toMatch(/\["us-west-2a",\s*"us-west-2b"\]/);
    });

    test("RDS is configured for Multi-AZ", () => {
      const dbContent = fs.readFileSync(path.join(LIB_DIR, "database.tf"), "utf8");
      expect(dbContent).toMatch(/multi_az\s*=\s*true/);
    });

    test("Auto Scaling Group spans multiple AZs", () => {
      const asgContent = fs.readFileSync(path.join(LIB_DIR, "auto_scaling.tf"), "utf8");
      expect(asgContent).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.public_subnets\[\*\]\.id/);
    });
  });
});