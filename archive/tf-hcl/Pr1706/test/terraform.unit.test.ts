// tests/unit/unit-tests.ts
// Unit tests for Terraform infrastructure modules

import fs from "fs";
import path from "path";

// Helper function to read file content
function readTerraformFile(filename: string): string {
  const filepath = path.resolve(__dirname, "../lib", filename);
  if (!fs.existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }
  return fs.readFileSync(filepath, "utf8");
}

describe("Terraform Infrastructure Unit Tests", () => {
  describe("File Structure", () => {
    const requiredFiles = [
      "provider.tf",
      "variables.tf",
      "vpc.tf",
      "security_groups.tf",
      "iam.tf",
      "rds.tf",
      "alb.tf",
      "elastic_beanstalk.tf",
      "outputs.tf",
      "tap_stack.tf"
    ];

    requiredFiles.forEach(file => {
      test(`${file} exists`, () => {
        const filepath = path.resolve(__dirname, "../lib", file);
        expect(fs.existsSync(filepath)).toBe(true);
      });
    });
  });

  describe("Provider Configuration", () => {
    test("configures AWS provider", () => {
      const content = readTerraformFile("provider.tf");
      expect(content).toMatch(/provider\s+"aws"\s*{/);
      expect(content).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test("configures Random provider", () => {
      const content = readTerraformFile("provider.tf");
      expect(content).toMatch(/provider\s+"random"\s*{/);
    });

    test("configures S3 backend", () => {
      const content = readTerraformFile("provider.tf");
      expect(content).toMatch(/backend\s+"s3"\s*{/);
    });

    test("requires Terraform version >= 1.4.0", () => {
      const content = readTerraformFile("provider.tf");
      expect(content).toMatch(/required_version\s*=\s*">= 1\.4\.0"/);
    });
  });

  describe("Variables", () => {
    test("defines environment_suffix variable", () => {
      const content = readTerraformFile("variables.tf");
      expect(content).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("defines aws_region variable", () => {
      const content = readTerraformFile("variables.tf");
      expect(content).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("defines vpc_cidr variable", () => {
      const content = readTerraformFile("variables.tf");
      expect(content).toMatch(/variable\s+"vpc_cidr"\s*{/);
    });

    test("defines db_instance_class variable", () => {
      const content = readTerraformFile("variables.tf");
      expect(content).toMatch(/variable\s+"db_instance_class"\s*{/);
    });
  });

  describe("VPC Configuration", () => {
    test("creates VPC resource", () => {
      const content = readTerraformFile("vpc.tf");
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      expect(content).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(content).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates Internet Gateway", () => {
      const content = readTerraformFile("vpc.tf");
      expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
    });

    test("creates public subnets", () => {
      const content = readTerraformFile("vpc.tf");
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(content).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("creates private subnets", () => {
      const content = readTerraformFile("vpc.tf");
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
    });

    test("creates NAT Gateways for high availability", () => {
      const content = readTerraformFile("vpc.tf");
      expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
      expect(content).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
    });

    test("uses environment_suffix in resource names", () => {
      const content = readTerraformFile("vpc.tf");
      expect(content).toMatch(/var\.environment_suffix/);
    });
  });

  describe("Security Groups", () => {
    test("creates ALB security group", () => {
      const content = readTerraformFile("security_groups.tf");
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"alb"\s*{/);
      expect(content).toMatch(/from_port\s*=\s*80/);
      expect(content).toMatch(/from_port\s*=\s*443/);
    });

    test("creates EB instances security group", () => {
      const content = readTerraformFile("security_groups.tf");
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"eb_instances"\s*{/);
    });

    test("creates RDS security group", () => {
      const content = readTerraformFile("security_groups.tf");
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"rds"\s*{/);
      expect(content).toMatch(/from_port\s*=\s*3306/);
    });

    test("implements least privilege access", () => {
      const content = readTerraformFile("security_groups.tf");
      // RDS should only accept from EB instances
      expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.eb_instances\.id\]/);
    });
  });

  describe("IAM Roles", () => {
    test("creates Elastic Beanstalk service role", () => {
      const content = readTerraformFile("iam.tf");
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"eb_service_role"\s*{/);
      expect(content).toMatch(/elasticbeanstalk\.amazonaws\.com/);
    });

    test("creates EC2 instance role", () => {
      const content = readTerraformFile("iam.tf");
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"eb_ec2_role"\s*{/);
      expect(content).toMatch(/ec2\.amazonaws\.com/);
    });

    test("creates instance profile", () => {
      const content = readTerraformFile("iam.tf");
      expect(content).toMatch(/resource\s+"aws_iam_instance_profile"\s+"eb_ec2_profile"\s*{/);
    });

    test("attaches required policies", () => {
      const content = readTerraformFile("iam.tf");
      expect(content).toMatch(/AWSElasticBeanstalkEnhancedHealth/);
      expect(content).toMatch(/AWSElasticBeanstalkWebTier/);
    });
  });

  describe("RDS Database", () => {
    test("creates RDS instance", () => {
      const content = readTerraformFile("rds.tf");
      expect(content).toMatch(/resource\s+"aws_db_instance"\s+"main"\s*{/);
      expect(content).toMatch(/engine\s*=\s*"mysql"/);
    });

    test("enables encryption", () => {
      const content = readTerraformFile("rds.tf");
      expect(content).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("configures backup retention", () => {
      const content = readTerraformFile("rds.tf");
      expect(content).toMatch(/backup_retention_period\s*=\s*7/);
    });

    test("uses Secrets Manager for password", () => {
      const content = readTerraformFile("rds.tf");
      expect(content).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_password"\s*{/);
      expect(content).toMatch(/resource\s+"random_password"\s+"db_password"\s*{/);
    });

    test("creates DB subnet group", () => {
      const content = readTerraformFile("rds.tf");
      expect(content).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"\s*{/);
    });

    test("disables deletion protection for testing", () => {
      const content = readTerraformFile("rds.tf");
      expect(content).toMatch(/deletion_protection\s*=\s*false/);
    });
  });

  describe("Application Load Balancer", () => {
    test("creates ALB resource", () => {
      const content = readTerraformFile("alb.tf");
      expect(content).toMatch(/resource\s+"aws_lb"\s+"main"\s*{/);
      expect(content).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test("configures as internet-facing", () => {
      const content = readTerraformFile("alb.tf");
      expect(content).toMatch(/internal\s*=\s*false/);
    });

    test("creates target group", () => {
      const content = readTerraformFile("alb.tf");
      expect(content).toMatch(/resource\s+"aws_lb_target_group"\s+"main"\s*{/);
      expect(content).toMatch(/health_check\s*{/);
    });

    test("creates listener", () => {
      const content = readTerraformFile("alb.tf");
      expect(content).toMatch(/resource\s+"aws_lb_listener"\s+"main"\s*{/);
      expect(content).toMatch(/default_action\s*{/);
    });
  });

  describe("Elastic Beanstalk", () => {
    test("creates EB application", () => {
      const content = readTerraformFile("elastic_beanstalk.tf");
      expect(content).toMatch(/resource\s+"aws_elastic_beanstalk_application"\s+"main"\s*{/);
    });

    test("creates EB environment", () => {
      const content = readTerraformFile("elastic_beanstalk.tf");
      expect(content).toMatch(/resource\s+"aws_elastic_beanstalk_environment"\s+"main"\s*{/);
      expect(content).toMatch(/tier\s*=\s*"WebServer"/);
    });

    test("configures VPC settings", () => {
      const content = readTerraformFile("elastic_beanstalk.tf");
      expect(content).toMatch(/namespace\s*=\s*"aws:ec2:vpc"/);
    });

    test("configures auto-scaling", () => {
      const content = readTerraformFile("elastic_beanstalk.tf");
      expect(content).toMatch(/namespace\s*=\s*"aws:autoscaling:asg"/);
      expect(content).toMatch(/MinSize/);
      expect(content).toMatch(/MaxSize/);
    });

    test("uses solution stack from variables", () => {
      const content = readTerraformFile("elastic_beanstalk.tf");
      expect(content).toMatch(/solution_stack_name\s*=\s*var\.eb_solution_stack/);
    });
  });

  describe("Outputs", () => {
    test("exports VPC ID", () => {
      const content = readTerraformFile("outputs.tf");
      expect(content).toMatch(/output\s+"vpc_id"\s*{/);
    });

    test("exports ALB DNS name", () => {
      const content = readTerraformFile("outputs.tf");
      expect(content).toMatch(/output\s+"alb_dns_name"\s*{/);
    });

    test("exports EB environment URL", () => {
      const content = readTerraformFile("outputs.tf");
      expect(content).toMatch(/output\s+"eb_environment_url"\s*{/);
    });

    test("exports RDS endpoint", () => {
      const content = readTerraformFile("outputs.tf");
      expect(content).toMatch(/output\s+"rds_endpoint"\s*{/);
    });

    test("exports database secret ARN", () => {
      const content = readTerraformFile("outputs.tf");
      expect(content).toMatch(/output\s+"db_secret_arn"\s*{/);
    });
  });
});
