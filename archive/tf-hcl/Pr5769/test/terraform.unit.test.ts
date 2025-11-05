import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");

describe("Terraform Multi-Environment Infrastructure - Unit Tests", () => {
  describe("Root Configuration Files", () => {
    test("main.tf exists and is readable", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      expect(fs.existsSync(mainTfPath)).toBe(true);
      const content = fs.readFileSync(mainTfPath, "utf8");
      expect(content.length).toBeGreaterThan(0);
    });

    test("variables.tf exists and defines required variables", () => {
      const varPath = path.join(LIB_DIR, "variables.tf");
      expect(fs.existsSync(varPath)).toBe(true);
      const content = fs.readFileSync(varPath, "utf8");

      // Check for critical variables
      expect(content).toMatch(/variable\s+"environment"/);
      expect(content).toMatch(/variable\s+"environment_suffix"/);
      expect(content).toMatch(/variable\s+"vpc_cidr"/);
      expect(content).toMatch(/variable\s+"aws_region"/);
    });

    test("outputs.tf exists", () => {
      const outputPath = path.join(LIB_DIR, "outputs.tf");
      expect(fs.existsSync(outputPath)).toBe(true);
    });

    test("main.tf declares AWS provider", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = fs.readFileSync(mainTfPath, "utf8");
      expect(content).toMatch(/provider\s+"aws"\s*{/);
    });

    test("main.tf uses Terraform >= 1.5.0", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = fs.readFileSync(mainTfPath, "utf8");
      expect(content).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
    });

    test("main.tf configures S3 backend", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = fs.readFileSync(mainTfPath, "utf8");
      expect(content).toMatch(/backend\s+"s3"\s*{/);
    });
  });

  describe("Environment Configuration Files", () => {
    test("dev.tfvars exists and contains environment configuration", () => {
      const devPath = path.join(LIB_DIR, "dev.tfvars");
      expect(fs.existsSync(devPath)).toBe(true);
      const content = fs.readFileSync(devPath, "utf8");
      expect(content).toMatch(/environment\s*=\s*"dev"/);
      expect(content).toMatch(/vpc_cidr\s*=\s*"10\.1\.0\.0\/16"/);
      expect(content).toMatch(/rds_instance_class\s*=\s*"db\.t3\.micro"/);
    });

    test("staging.tfvars exists and contains environment configuration", () => {
      const stagingPath = path.join(LIB_DIR, "staging.tfvars");
      expect(fs.existsSync(stagingPath)).toBe(true);
      const content = fs.readFileSync(stagingPath, "utf8");
      expect(content).toMatch(/environment\s*=\s*"staging"/);
      expect(content).toMatch(/vpc_cidr\s*=\s*"10\.2\.0\.0\/16"/);
      expect(content).toMatch(/rds_instance_class\s*=\s*"db\.t3\.small"/);
    });

    test("prod.tfvars exists and contains environment configuration", () => {
      const prodPath = path.join(LIB_DIR, "prod.tfvars");
      expect(fs.existsSync(prodPath)).toBe(true);
      const content = fs.readFileSync(prodPath, "utf8");
      expect(content).toMatch(/environment\s*=\s*"prod"/);
      expect(content).toMatch(/vpc_cidr\s*=\s*"10\.3\.0\.0\/16"/);
      expect(content).toMatch(/rds_instance_class\s*=\s*"db\.t3\.medium"/);
    });

    test("all tfvars files define environment_suffix", () => {
      const tfvarsFiles = ["dev.tfvars", "staging.tfvars", "prod.tfvars"];

      tfvarsFiles.forEach(file => {
        const filePath = path.join(LIB_DIR, file);
        const content = fs.readFileSync(filePath, "utf8");
        expect(content).toMatch(/environment_suffix/);
      });
    });
  });

  describe("Module Structure", () => {
    test("modules directory exists", () => {
      const modulesPath = path.join(LIB_DIR, "modules");
      expect(fs.existsSync(modulesPath)).toBe(true);
      expect(fs.statSync(modulesPath).isDirectory()).toBe(true);
    });

    const requiredModules = [
      "vpc",
      "security_groups",
      "kms",
      "s3",
      "rds",
      "alb",
      "ecs",
      "cloudwatch"
    ];

    requiredModules.forEach(moduleName => {
      describe(`${moduleName} module`, () => {
        test(`${moduleName} module directory exists`, () => {
          const modulePath = path.join(LIB_DIR, "modules", moduleName);
          expect(fs.existsSync(modulePath)).toBe(true);
          expect(fs.statSync(modulePath).isDirectory()).toBe(true);
        });

        test(`${moduleName} module has main.tf`, () => {
          const mainPath = path.join(LIB_DIR, "modules", moduleName, "main.tf");
          expect(fs.existsSync(mainPath)).toBe(true);
        });

        test(`${moduleName} module has variables.tf`, () => {
          const varPath = path.join(LIB_DIR, "modules", moduleName, "variables.tf");
          expect(fs.existsSync(varPath)).toBe(true);
        });

        test(`${moduleName} module has outputs.tf`, () => {
          const outPath = path.join(LIB_DIR, "modules", moduleName, "outputs.tf");
          expect(fs.existsSync(outPath)).toBe(true);
        });
      });
    });
  });

  describe("VPC Module", () => {
    test("creates VPC resource", () => {
      const vpcMainPath = path.join(LIB_DIR, "modules", "vpc", "main.tf");
      const content = fs.readFileSync(vpcMainPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test("creates public and private subnets", () => {
      const vpcMainPath = path.join(LIB_DIR, "modules", "vpc", "main.tf");
      const content = fs.readFileSync(vpcMainPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test("creates NAT gateways", () => {
      const vpcMainPath = path.join(LIB_DIR, "modules", "vpc", "main.tf");
      const content = fs.readFileSync(vpcMainPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_nat_gateway"/);
    });

    test("uses environment_suffix in resource names", () => {
      const vpcMainPath = path.join(LIB_DIR, "modules", "vpc", "main.tf");
      const content = fs.readFileSync(vpcMainPath, "utf8");
      expect(content).toMatch(/\$\{var\.environment_suffix\}/);
    });
  });

  describe("Security Groups Module", () => {
    test("creates security groups", () => {
      const sgMainPath = path.join(LIB_DIR, "modules", "security_groups", "main.tf");
      const content = fs.readFileSync(sgMainPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_security_group"/);
    });

    test("uses environment_suffix in resource names", () => {
      const sgMainPath = path.join(LIB_DIR, "modules", "security_groups", "main.tf");
      const content = fs.readFileSync(sgMainPath, "utf8");
      expect(content).toMatch(/\$\{var\.environment_suffix\}/);
    });
  });

  describe("KMS Module", () => {
    test("creates KMS key", () => {
      const kmsMainPath = path.join(LIB_DIR, "modules", "kms", "main.tf");
      const content = fs.readFileSync(kmsMainPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_kms_key"/);
    });

    test("uses environment_suffix in resource names", () => {
      const kmsMainPath = path.join(LIB_DIR, "modules", "kms", "main.tf");
      const content = fs.readFileSync(kmsMainPath, "utf8");
      expect(content).toMatch(/\$\{var\.environment_suffix\}/);
    });
  });

  describe("S3 Module", () => {
    test("creates S3 bucket", () => {
      const s3MainPath = path.join(LIB_DIR, "modules", "s3", "main.tf");
      const content = fs.readFileSync(s3MainPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_s3_bucket"/);
    });

    test("enables versioning", () => {
      const s3MainPath = path.join(LIB_DIR, "modules", "s3", "main.tf");
      const content = fs.readFileSync(s3MainPath, "utf8");
      expect(content).toMatch(/aws_s3_bucket_versioning/);
    });

    test("configures encryption", () => {
      const s3MainPath = path.join(LIB_DIR, "modules", "s3", "main.tf");
      const content = fs.readFileSync(s3MainPath, "utf8");
      expect(content).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
    });

    test("uses environment_suffix in bucket names", () => {
      const s3MainPath = path.join(LIB_DIR, "modules", "s3", "main.tf");
      const content = fs.readFileSync(s3MainPath, "utf8");
      expect(content).toMatch(/\$\{var\.environment_suffix\}/);
    });
  });

  describe("RDS Module", () => {
    test("creates RDS instance", () => {
      const rdsMainPath = path.join(LIB_DIR, "modules", "rds", "main.tf");
      const content = fs.readFileSync(rdsMainPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_db_instance"/);
    });

    test("creates DB subnet group", () => {
      const rdsMainPath = path.join(LIB_DIR, "modules", "rds", "main.tf");
      const content = fs.readFileSync(rdsMainPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_db_subnet_group"/);
    });

    test("uses PostgreSQL engine", () => {
      const rdsMainPath = path.join(LIB_DIR, "modules", "rds", "main.tf");
      const content = fs.readFileSync(rdsMainPath, "utf8");
      expect(content).toMatch(/engine\s*=\s*"postgres"/);
    });

    test("uses environment_suffix in resource names", () => {
      const rdsMainPath = path.join(LIB_DIR, "modules", "rds", "main.tf");
      const content = fs.readFileSync(rdsMainPath, "utf8");
      expect(content).toMatch(/\$\{var\.environment_suffix\}/);
    });

    test("configures backup retention", () => {
      const rdsMainPath = path.join(LIB_DIR, "modules", "rds", "main.tf");
      const content = fs.readFileSync(rdsMainPath, "utf8");
      expect(content).toMatch(/backup_retention_period/);
    });
  });

  describe("ALB Module", () => {
    test("creates Application Load Balancer", () => {
      const albMainPath = path.join(LIB_DIR, "modules", "alb", "main.tf");
      const content = fs.readFileSync(albMainPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_lb"\s+"main"/);
    });

    test("creates target group", () => {
      const albMainPath = path.join(LIB_DIR, "modules", "alb", "main.tf");
      const content = fs.readFileSync(albMainPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_lb_target_group"/);
    });

    test("creates listener", () => {
      const albMainPath = path.join(LIB_DIR, "modules", "alb", "main.tf");
      const content = fs.readFileSync(albMainPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_lb_listener"/);
    });

    test("uses environment_suffix in resource names", () => {
      const albMainPath = path.join(LIB_DIR, "modules", "alb", "main.tf");
      const content = fs.readFileSync(albMainPath, "utf8");
      expect(content).toMatch(/\$\{var\.environment_suffix\}/);
    });
  });

  describe("ECS Module", () => {
    test("creates ECS cluster", () => {
      const ecsMainPath = path.join(LIB_DIR, "modules", "ecs", "main.tf");
      const content = fs.readFileSync(ecsMainPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_ecs_cluster"/);
    });

    test("creates task definition", () => {
      const ecsMainPath = path.join(LIB_DIR, "modules", "ecs", "main.tf");
      const content = fs.readFileSync(ecsMainPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_ecs_task_definition"/);
    });

    test("creates Fargate service", () => {
      const ecsMainPath = path.join(LIB_DIR, "modules", "ecs", "main.tf");
      const content = fs.readFileSync(ecsMainPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_ecs_service"/);
      expect(content).toMatch(/launch_type\s*=\s*"FARGATE"/);
    });

    test("creates IAM roles", () => {
      const ecsMainPath = path.join(LIB_DIR, "modules", "ecs", "main.tf");
      const content = fs.readFileSync(ecsMainPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_iam_role"/);
    });

    test("uses environment_suffix in resource names", () => {
      const ecsMainPath = path.join(LIB_DIR, "modules", "ecs", "main.tf");
      const content = fs.readFileSync(ecsMainPath, "utf8");
      expect(content).toMatch(/\$\{var\.environment_suffix\}/);
    });
  });

  describe("CloudWatch Module", () => {
    test("creates log group", () => {
      const cwMainPath = path.join(LIB_DIR, "modules", "cloudwatch", "main.tf");
      const content = fs.readFileSync(cwMainPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
    });

    test("configures retention period", () => {
      const cwMainPath = path.join(LIB_DIR, "modules", "cloudwatch", "main.tf");
      const content = fs.readFileSync(cwMainPath, "utf8");
      expect(content).toMatch(/retention_in_days/);
    });

    test("uses environment_suffix in resource names", () => {
      const cwMainPath = path.join(LIB_DIR, "modules", "cloudwatch", "main.tf");
      const content = fs.readFileSync(cwMainPath, "utf8");
      expect(content).toMatch(/\$\{var\.environment_suffix\}/);
    });
  });

  describe("Resource Naming Conventions", () => {
    test("resources include environment prefix", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = fs.readFileSync(mainTfPath, "utf8");

      // All modules receive environment parameter
      const moduleBlocks = content.match(/module\s+"[^"]+"\s*{[^}]+}/gs) || [];
      moduleBlocks.forEach(block => {
        expect(block).toMatch(/environment\s*=/);
      });
    });

    test("resources include environment_suffix", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = fs.readFileSync(mainTfPath, "utf8");

      // All modules receive environment_suffix parameter
      const moduleBlocks = content.match(/module\s+"[^"]+"\s*{[^}]+}/gs) || [];
      moduleBlocks.forEach(block => {
        expect(block).toMatch(/environment_suffix\s*=/);
      });
    });
  });

  describe("Default Tags Configuration", () => {
    test("provider configures default tags", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = fs.readFileSync(mainTfPath, "utf8");
      expect(content).toMatch(/default_tags\s*{/);
      expect(content).toMatch(/Environment\s*=/);
      expect(content).toMatch(/Project\s*=/);
      expect(content).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });
  });

  describe("Data Sources", () => {
    test("uses availability zones data source", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = fs.readFileSync(mainTfPath, "utf8");
      expect(content).toMatch(/data\s+"aws_availability_zones"/);
    });

    test("references Route53 zone conditionally", () => {
      const mainTfPath = path.join(LIB_DIR, "main.tf");
      const content = fs.readFileSync(mainTfPath, "utf8");
      expect(content).toMatch(/data\s+"aws_route53_zone"/);
      expect(content).toMatch(/count\s*=.*route53_zone_name/);
    });
  });

  describe("Region Configuration", () => {
    test("AWS_REGION file exists and contains us-east-1", () => {
      const regionPath = path.join(LIB_DIR, "AWS_REGION");
      expect(fs.existsSync(regionPath)).toBe(true);
      const region = fs.readFileSync(regionPath, "utf8").trim();
      expect(region).toBe("us-east-1");
    });
  });
});
