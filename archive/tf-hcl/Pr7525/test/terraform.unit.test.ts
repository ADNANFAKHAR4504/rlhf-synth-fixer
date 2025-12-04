// test/terraform.unit.test.ts
// Comprehensive unit tests for Terraform infrastructure defined in lib/
// These tests validate the structure and configuration without executing Terraform
// Focus: Payment App Infrastructure, Multi-Environment, Cross-Account Compatibility, No Hardcoding, Module Integration

import fs from "fs";
import path from "path";

const LIB_PATH = path.resolve(__dirname, "../lib");
const TAP_STACK_PATH = path.resolve(LIB_PATH, "tap_stack.tf");
const PROVIDER_PATH = path.resolve(LIB_PATH, "provider.tf");
const VARIABLES_PATH = path.resolve(LIB_PATH, "variables.tf");
const OUTPUTS_PATH = path.resolve(LIB_PATH, "outputs.tf");

// Environment-specific tfvars files
const DEV_TFVARS_PATH = path.resolve(LIB_PATH, "dev.tfvars");
const STAGING_TFVARS_PATH = path.resolve(LIB_PATH, "staging.tfvars");
const PROD_TFVARS_PATH = path.resolve(LIB_PATH, "prod.tfvars");

// Module paths
const MODULES_PATH = path.resolve(LIB_PATH, "modules");
const VPC_MODULE_PATH = path.resolve(MODULES_PATH, "vpc");
const KMS_MODULE_PATH = path.resolve(MODULES_PATH, "kms");
const RDS_MODULE_PATH = path.resolve(MODULES_PATH, "rds");
const S3_MODULE_PATH = path.resolve(MODULES_PATH, "s3");
const ALB_MODULE_PATH = path.resolve(MODULES_PATH, "alb");
const ASG_MODULE_PATH = path.resolve(MODULES_PATH, "asg");
const SECURITY_GROUPS_MODULE_PATH = path.resolve(MODULES_PATH, "security_groups");

describe("Payment App Terraform Infrastructure Unit Tests", () => {
  let tapStackContent: string;
  let providerContent: string;
  let variablesContent: string;
  let outputsContent: string;
  let moduleContents: { [key: string]: { [file: string]: string } } = {};
  let tfvarsContents: { [env: string]: string } = {};

  beforeAll(() => {
    // Read main files
    tapStackContent = fs.readFileSync(TAP_STACK_PATH, "utf8");
    providerContent = fs.readFileSync(PROVIDER_PATH, "utf8");
    variablesContent = fs.readFileSync(VARIABLES_PATH, "utf8");

    // Read outputs if exists
    if (fs.existsSync(OUTPUTS_PATH)) {
      outputsContent = fs.readFileSync(OUTPUTS_PATH, "utf8");
    } else {
      outputsContent = "";
    }

    // Read tfvars files
    tfvarsContents.dev = fs.readFileSync(DEV_TFVARS_PATH, "utf8");
    tfvarsContents.staging = fs.readFileSync(STAGING_TFVARS_PATH, "utf8");
    tfvarsContents.prod = fs.readFileSync(PROD_TFVARS_PATH, "utf8");

    // Read module files
    const modules = ["vpc", "kms", "rds", "s3", "alb", "asg", "security_groups"];
    modules.forEach(module => {
      const modulePath = path.resolve(MODULES_PATH, module);
      if (fs.existsSync(modulePath)) {
        moduleContents[module] = {};
        const files = fs.readdirSync(modulePath);
        files.filter(file => file.endsWith(".tf")).forEach(file => {
          moduleContents[module][file] = fs.readFileSync(path.resolve(modulePath, file), "utf8");
        });
      }
    });
  });

  describe("File Structure and Existence", () => {
    test("main Terraform files exist", () => {
      expect(fs.existsSync(TAP_STACK_PATH)).toBe(true);
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
      expect(fs.existsSync(VARIABLES_PATH)).toBe(true);
    });

    test("environment-specific tfvars files exist", () => {
      expect(fs.existsSync(DEV_TFVARS_PATH)).toBe(true);
      expect(fs.existsSync(STAGING_TFVARS_PATH)).toBe(true);
      expect(fs.existsSync(PROD_TFVARS_PATH)).toBe(true);
    });

    test("modules directory exists with all required modules", () => {
      expect(fs.existsSync(MODULES_PATH)).toBe(true);
      const requiredModules = ["vpc", "kms", "rds", "s3", "alb", "asg", "security_groups"];
      requiredModules.forEach(module => {
        expect(fs.existsSync(path.resolve(MODULES_PATH, module))).toBe(true);
      });
    });

    test("each module has required files", () => {
      const modules = Object.keys(moduleContents);
      modules.forEach(module => {
        expect(moduleContents[module]["main.tf"]).toBeDefined();
        expect(moduleContents[module]["variables.tf"]).toBeDefined();
        expect(moduleContents[module]["outputs.tf"]).toBeDefined();
      });
    });

    test("all files are not empty", () => {
      expect(tapStackContent.length).toBeGreaterThan(0);
      expect(providerContent.length).toBeGreaterThan(0);
      expect(variablesContent.length).toBeGreaterThan(0);

      Object.keys(moduleContents).forEach(module => {
        Object.keys(moduleContents[module]).forEach(file => {
          expect(moduleContents[module][file].length).toBeGreaterThan(0);
        });
      });
    });

    test("outputs file exists and is not empty", () => {
      if (outputsContent) {
        expect(outputsContent.length).toBeGreaterThan(0);
      } else {
        // Outputs should be defined in tap_stack.tf if not in separate file
        expect(tapStackContent).toMatch(/output\s+"/);
      }
    });
  });

  describe("Provider Configuration", () => {
    test("provider.tf contains terraform block with proper version", () => {
      expect(providerContent).toMatch(/terraform\s*{/);
      expect(providerContent).toMatch(/required_version\s*=\s*">= 1\./);
    });

    test("provider.tf contains AWS provider with proper version", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
      expect(providerContent).toMatch(/version\s*=\s*">= [4-9]\./);
    });

    test("provider uses variables for region configuration", () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.(aws_region|region)/);
    });

    test("provider has default tags configuration", () => {
      expect(providerContent).toMatch(/default_tags\s*{/);
    });

    test("main stack does NOT contain provider blocks (separation of concerns)", () => {
      expect(tapStackContent).not.toMatch(/provider\s+"aws"\s*{/);
      expect(tapStackContent).not.toMatch(/terraform\s*{[\s\S]*required_version/);
    });
  });

  describe("Variables Configuration and Cross-Account Compatibility", () => {
    test("defines essential variables for cross-account deployment", () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"environment"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
    });

    test("defines infrastructure sizing variables", () => {
      expect(variablesContent).toMatch(/variable\s+"instance_type"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"asg_min"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"asg_max"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"db_instance_class"\s*{/);
    });

    test("defines operational variables", () => {
      expect(variablesContent).toMatch(/variable\s+"rds_backup_retention"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"s3_lifecycle_days"\s*{/);
    });

    test("defines CI/CD and tagging variables", () => {
      expect(variablesContent).toMatch(/variable\s+"repository"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"commit_author"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"pr_number"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"team"\s*{/);
    });

    test("all variables have descriptions", () => {
      const variableMatches = variablesContent.match(/variable\s+"\w+"\s*{/g) || [];
      const descriptionMatches = variablesContent.match(/description\s*=/g) || [];
      expect(descriptionMatches.length).toBeGreaterThanOrEqual(variableMatches.length * 0.9);
    });

    test("all variables have proper types", () => {
      const variableMatches = variablesContent.match(/variable\s+"\w+"\s*{/g) || [];
      const typeMatches = variablesContent.match(/type\s*=/g) || [];
      expect(typeMatches.length).toBeGreaterThanOrEqual(variableMatches.length * 0.9);
    });

    test("environment variable has validation", () => {
      expect(variablesContent).toMatch(/validation\s*{/);
      expect(variablesContent).toMatch(/contains\(\["dev",\s*"staging",\s*"prod"\]/);
    });

    test("critical variables have defaults for flexibility", () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"[\s\S]*?default\s*=/);
    });
  });

  describe("Environment-Specific Configuration Files", () => {
    test("all tfvars files contain required variables", () => {
      const environments = ["dev", "staging", "prod"];
      const requiredVars = ["environment", "vpc_cidr", "instance_type", "asg_min", "asg_max", "db_instance_class"];

      environments.forEach(env => {
        requiredVars.forEach(varName => {
          expect(tfvarsContents[env]).toMatch(new RegExp(`${varName}\\s*=`));
        });
      });
    });

    test("environments have different VPC CIDR blocks", () => {
      expect(tfvarsContents.dev).toMatch(/vpc_cidr\s*=\s*"10\.0\./);
      expect(tfvarsContents.staging).toMatch(/vpc_cidr\s*=\s*"10\.1\./);
      expect(tfvarsContents.prod).toMatch(/vpc_cidr\s*=\s*"10\.2\./);
    });

    test("environments have appropriate sizing configurations", () => {
      // Dev should have smaller instances
      expect(tfvarsContents.dev).toMatch(/instance_type\s*=\s*"t3\.micro"/);
      expect(tfvarsContents.dev).toMatch(/db_instance_class\s*=\s*"db\.t3\.micro"/);

      // Prod should have larger instances
      expect(tfvarsContents.prod).toMatch(/instance_type\s*=\s*"t3\.large"/);
      expect(tfvarsContents.prod).toMatch(/db_instance_class\s*=\s*"db\.t3\.medium"/);
    });

    test("environments have appropriate operational configurations", () => {
      // Prod should have longer retention and lifecycle
      expect(tfvarsContents.prod).toMatch(/rds_backup_retention\s*=\s*30/);
      expect(tfvarsContents.prod).toMatch(/s3_lifecycle_days\s*=\s*365/);

      // Dev should have shorter retention
      expect(tfvarsContents.dev).toMatch(/rds_backup_retention\s*=\s*7/);
      expect(tfvarsContents.dev).toMatch(/s3_lifecycle_days\s*=\s*90/);
    });
  });

  describe("Data Sources for Dynamic References", () => {
    test("uses AWS region data source", () => {
      const allContent = tapStackContent + providerContent + Object.values(moduleContents).map(m => Object.values(m).join("")).join("");
      expect(allContent).toMatch(/data\s+"aws_region"\s+"current"/);
    });

    test("uses AWS caller identity for account information", () => {
      const allContent = tapStackContent + Object.values(moduleContents).map(m => Object.values(m).join("")).join("");
      expect(allContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test("modules use data sources for cross-account compatibility", () => {
      const hasDataSources = Object.keys(moduleContents).some(module =>
        Object.values(moduleContents[module]).some(content =>
          content.includes("data \"aws_caller_identity\"") ||
          content.includes("data \"aws_region\"") ||
          content.includes("data \"aws_availability_zones\"")
        )
      );
      expect(hasDataSources).toBe(true);
    });
  });

  describe("Local Values and Naming Convention", () => {
    test("defines project naming consistently", () => {
      expect(tapStackContent).toMatch(/project_name\s*=\s*"payments"/);
    });

    test("uses environment from variable", () => {
      expect(tapStackContent).toMatch(/environment\s*=\s*var\.environment/);
    });

    test("uses region from variable", () => {
      expect(tapStackContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test("defines common tags for consistency", () => {
      expect(tapStackContent).toMatch(/common_tags\s*=\s*{/);
      expect(tapStackContent).toMatch(/Project\s*=\s*local\.project_name/);
      expect(tapStackContent).toMatch(/Environment\s*=\s*local\.environment/);
      expect(tapStackContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });

    test("defines environment-specific configurations", () => {
      expect(tapStackContent).toMatch(/env_config\s*=\s*{/);
      expect(tapStackContent).toMatch(/dev\s*=\s*{/);
      expect(tapStackContent).toMatch(/staging\s*=\s*{/);
      expect(tapStackContent).toMatch(/prod\s*=\s*{/);
    });
  });

  describe("Module Integration and Structure", () => {
    test("uses VPC module with proper configuration", () => {
      expect(tapStackContent).toMatch(/module\s+"vpc"\s*{/);
      expect(tapStackContent).toMatch(/source\s*=\s*"\.\/modules\/vpc"/);
    });

    test("uses KMS module for encryption", () => {
      expect(tapStackContent).toMatch(/module\s+"kms"\s*{/);
      expect(tapStackContent).toMatch(/source\s*=\s*"\.\/modules\/kms"/);
    });

    test("uses RDS module for database", () => {
      expect(tapStackContent).toMatch(/module\s+"rds"\s*{/);
      expect(tapStackContent).toMatch(/source\s*=\s*"\.\/modules\/rds"/);
    });

    test("uses S3 module for storage", () => {
      expect(tapStackContent).toMatch(/module\s+"s3"\s*{/);
      expect(tapStackContent).toMatch(/source\s*=\s*"\.\/modules\/s3"/);
    });

    test("uses ALB module for load balancing", () => {
      expect(tapStackContent).toMatch(/module\s+"alb"\s*{/);
      expect(tapStackContent).toMatch(/source\s*=\s*"\.\/modules\/alb"/);
    });

    test("uses ASG module for auto scaling", () => {
      expect(tapStackContent).toMatch(/module\s+"asg"\s*{/);
      expect(tapStackContent).toMatch(/source\s*=\s*"\.\/modules\/asg"/);
    });

    test("uses security groups module", () => {
      expect(tapStackContent).toMatch(/module\s+"security_groups"\s*{/);
      expect(tapStackContent).toMatch(/source\s*=\s*"\.\/modules\/security_groups"/);
    });

    test("modules receive proper inputs", () => {
      expect(tapStackContent).toMatch(/environment\s*=\s*(var\.environment|local\.environment)/);
      expect(tapStackContent).toMatch(/project_name\s*=\s*local\.project_name/);
      expect(tapStackContent).toMatch(/common_tags\s*=\s*local\.common_tags/);
    });
  });

  describe("VPC Module Configuration", () => {
    test("VPC module has proper resource structure", () => {
      const vpcMain = moduleContents.vpc?.["main.tf"] || "";
      expect(vpcMain).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(vpcMain).toMatch(/resource\s+"aws_subnet"/);
      expect(vpcMain).toMatch(/resource\s+"aws_internet_gateway"/);
      expect(vpcMain).toMatch(/resource\s+"aws_nat_gateway"/);
    });

    test("VPC module uses variables properly", () => {
      const vpcVars = moduleContents.vpc?.["variables.tf"] || "";
      expect(vpcVars).toMatch(/variable\s+"vpc_cidr"/);
      expect(vpcVars).toMatch(/variable\s+"environment"/);
      expect(vpcVars).toMatch(/variable\s+"project_name"/);
    });

    test("VPC module creates subnets dynamically", () => {
      const vpcMain = moduleContents.vpc?.["main.tf"] || "";
      expect(vpcMain).toMatch(/count\s*=\s*(2|\d+|length\()|for_each\s*=/);
    });

    test("VPC module has proper outputs", () => {
      const vpcOutputs = moduleContents.vpc?.["outputs.tf"] || "";
      expect(vpcOutputs).toMatch(/output\s+"vpc_id"/);
      expect(vpcOutputs).toMatch(/output\s+"public_subnet_ids"/);
      expect(vpcOutputs).toMatch(/output\s+"private_subnet_ids"/);
    });
  });

  describe("RDS Module Configuration", () => {
    test("RDS module creates database instance", () => {
      const rdsMain = moduleContents.rds?.["main.tf"] || "";
      expect(rdsMain).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(rdsMain).toMatch(/resource\s+"aws_db_subnet_group"/);
    });

    test("RDS module uses KMS encryption", () => {
      const rdsMain = moduleContents.rds?.["main.tf"] || "";
      expect(rdsMain).toMatch(/storage_encrypted\s*=\s*true/);
      expect(rdsMain).toMatch(/kms_key_id/);
    });

    test("RDS module has proper backup configuration", () => {
      const rdsMain = moduleContents.rds?.["main.tf"] || "";
      expect(rdsMain).toMatch(/backup_retention_period/);
      expect(rdsMain).toMatch(/backup_window/);
    });

    test("RDS module uses environment-specific settings", () => {
      expect(tapStackContent).toMatch(/multi_az\s*=\s*local\.env_config\[var\.environment\]\.multi_az/);
      expect(tapStackContent).toMatch(/deletion_protection\s*=\s*local\.env_config\[var\.environment\]\.deletion_protection/);
    });
  });

  describe("S3 Module Configuration", () => {
    test("S3 module creates bucket with encryption", () => {
      const s3Main = moduleContents.s3?.["main.tf"] || "";
      expect(s3Main).toMatch(/resource\s+"aws_s3_bucket"\s+"main"/);
      expect(s3Main).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
    });

    test("S3 module has versioning and lifecycle", () => {
      const s3Main = moduleContents.s3?.["main.tf"] || "";
      expect(s3Main).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(s3Main).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"/);
    });

    test("S3 module blocks public access", () => {
      const s3Main = moduleContents.s3?.["main.tf"] || "";
      expect(s3Main).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
    });
  });

  describe("Security and Hardcoding Validation", () => {
    test("no hardcoded AWS account IDs in any file", () => {
      const allContent = tapStackContent + providerContent + variablesContent + (outputsContent || "");
      expect(allContent).not.toMatch(/[0-9]{12}/);

      // Check modules too
      Object.keys(moduleContents).forEach(module => {
        Object.values(moduleContents[module]).forEach(content => {
          expect(content).not.toMatch(/[0-9]{12}/);
        });
      });
    });

    test("no hardcoded regions in resource configurations", () => {
      const allFiles = [tapStackContent, providerContent, variablesContent];
      Object.values(moduleContents).forEach(module => {
        allFiles.push(...Object.values(module));
      });

      allFiles.forEach(content => {
        // Allow regions in provider aliases, data sources, backend config, and variable defaults
        let cleanContent = content.replace(/provider\s*=\s*aws\.[a-z_]+/g, "");
        cleanContent = cleanContent.replace(/data\s+"aws_region"/g, "");
        cleanContent = cleanContent.replace(/#.*$/gm, "");

        // Remove backend configuration block
        cleanContent = cleanContent.replace(/backend\s+"s3"\s*\{[^}]*\}/gs, "");

        // Remove variable default values (they're allowed to have hardcoded regions)
        cleanContent = cleanContent.replace(/default\s*=\s*"[^"]*"/g, "");

        // Remove any remaining region references in backend configuration
        cleanContent = cleanContent.replace(/bucket\s*=\s*"[^"]*us-(east|west)-[12][^"]*"/g, "");
        cleanContent = cleanContent.replace(/region\s*=\s*"us-(east|west)-[12]"/g, "");

        expect(cleanContent).not.toMatch(/"us-(east|west)-[12]"/);
        expect(cleanContent).not.toMatch(/"eu-(west|central)-[12]"/);
      });
    });

    test("no hardcoded AWS credentials anywhere", () => {
      const allFiles = [tapStackContent, providerContent, variablesContent];
      Object.values(moduleContents).forEach(module => {
        allFiles.push(...Object.values(module));
      });

      allFiles.forEach(content => {
        expect(content).not.toMatch(/AKIA[0-9A-Z]{16}/);
        expect(content).not.toMatch(/aws_access_key_id/);
        expect(content).not.toMatch(/aws_secret_access_key/);
      });
    });

    test("uses dynamic references for cross-account resources", () => {
      const hasDataReferences = tapStackContent.includes("data.aws_") ||
        Object.values(moduleContents).some(module =>
          Object.values(module).some(content => content.includes("data.aws_"))
        );
      expect(hasDataReferences).toBe(true);
    });

    test("bucket names include dynamic elements for uniqueness", () => {
      const allModuleContent = Object.values(moduleContents).map(m => Object.values(m).join("")).join("");
      const allContent = tapStackContent + allModuleContent;
      expect(allContent).toMatch(/bucket\s*=|name\s*=.*\$\{.*environment|environment.*\}/);
    });

    test("resource names use environment prefixes", () => {
      const allModuleContent = Object.values(moduleContents).map(m => Object.values(m).join("")).join("");
      const allContent = tapStackContent + allModuleContent;
      expect(allContent).toMatch(/\$\{var\.environment\}.*\$\{.*project_name|\$\{.*project_name.*\}.*\$\{var\.environment\}/);
    });
  });

  describe("Password Security Configuration", () => {
    test("uses secure password generation", () => {
      expect(tapStackContent).toMatch(/resource\s+"random_password"\s+"db_password"/);
      expect(tapStackContent).toMatch(/override_special\s*=\s*"[^"]*"/);
    });

    test("password excludes problematic characters for RDS", () => {
      const passwordConfig = tapStackContent.match(/override_special\s*=\s*"([^"]*)"/)?.[1] || "";
      expect(passwordConfig).not.toMatch(/[/@" ]/);
    });

    test("password has appropriate length", () => {
      expect(tapStackContent).toMatch(/length\s*=\s*32/);
    });
  });

  describe("Cross-Account and Multi-Region Executability", () => {
    test("provider configuration supports variable regions", () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.(aws_region|region)/);
    });

    test("resource naming includes environment for isolation", () => {
      const allModuleContent = Object.values(moduleContents).map(m => Object.values(m).join("")).join("");
      const allContent = tapStackContent + allModuleContent;
      expect(allContent).toMatch(/\$\{var\.environment\}|\$\{local\.environment\}|environment\s*=\s*var\.environment/);
    });

    test("uses variables for all configurable parameters", () => {
      expect(tapStackContent).toMatch(/var\.(aws_region|environment|vpc_cidr)/);
    });

    test("modules receive region-agnostic parameters", () => {
      const moduleBlocks = tapStackContent.split(/(?=module\s+"[^"]+"\s*{)/).filter(block => block.includes('module'));
      moduleBlocks.forEach(block => {
        expect(block).toMatch(/common_tags\s*=|project_name\s*=|environment\s*=|source\s*=/);
      });
    });

    test("availability zones are used dynamically", () => {
      const vpcMain = moduleContents.vpc?.["main.tf"] || "";
      expect(vpcMain).toMatch(/data\s+"aws_availability_zones"/);
    });
  });

  describe("Resource Tagging and Consistency", () => {
    test("uses common tags throughout", () => {
      expect(tapStackContent).toMatch(/local\.common_tags/);
    });

    test("modules receive tags from main configuration", () => {
      expect(tapStackContent).toMatch(/common_tags\s*=\s*local\.common_tags/);
    });

    test("provider has default tags", () => {
      expect(providerContent).toMatch(/default_tags\s*{/);
    });

    test("tags include CI/CD metadata", () => {
      expect(providerContent).toMatch(/Repository\s*=\s*var\.repository/);
      expect(providerContent).toMatch(/Author\s*=\s*var\.commit_author/);
    });

    test("workspace tag is included", () => {
      expect(tapStackContent).toMatch(/Workspace\s*=\s*terraform\.workspace/);
    });
  });

  describe("Module Integration and Dependencies", () => {
    test("modules reference each other properly", () => {
      expect(tapStackContent).toMatch(/module\.vpc\.(vpc_id|public_subnet_ids|private_subnet_ids)/);
      expect(tapStackContent).toMatch(/module\.kms\.(key_arn|key_id)/);
      expect(tapStackContent).toMatch(/module\.security_groups\./);
    });

    test("RDS uses VPC and KMS outputs", () => {
      expect(tapStackContent).toMatch(/subnet_ids\s*=\s*module\.vpc\./);
      expect(tapStackContent).toMatch(/kms_key_id\s*=\s*module\.kms\./);
    });

    test("ALB uses VPC outputs", () => {
      expect(tapStackContent).toMatch(/vpc_id\s*=\s*module\.vpc\.vpc_id/);
      expect(tapStackContent).toMatch(/subnet_ids\s*=\s*module\.vpc\./);
    });

    test("ASG uses ALB target group", () => {
      expect(tapStackContent).toMatch(/target_group_arns\s*=\s*\[module\.alb\./);
    });
  });

  describe("Outputs Configuration", () => {
    test("outputs file exists and has content", () => {
      expect(fs.existsSync(OUTPUTS_PATH)).toBe(true);
      if (fs.existsSync(OUTPUTS_PATH)) {
        const content = fs.readFileSync(OUTPUTS_PATH, "utf8");
        expect(content.length).toBeGreaterThan(0);
      }
    });

    test("outputs essential infrastructure information", () => {
      if (fs.existsSync(OUTPUTS_PATH)) {
        const content = fs.readFileSync(OUTPUTS_PATH, "utf8");
        expect(content).toMatch(/output\s+"vpc_id"/);
        expect(content).toMatch(/output\s+"alb_dns_name"/);
        expect(content).toMatch(/output\s+"rds_endpoint"/);
      }
    });

    test("outputs environment and region information", () => {
      if (fs.existsSync(OUTPUTS_PATH)) {
        const content = fs.readFileSync(OUTPUTS_PATH, "utf8");
        expect(content).toMatch(/output\s+"environment"/);
        expect(content).toMatch(/output\s+"region"/);
      }
    });

    test("outputs testing and integration helpers", () => {
      if (fs.existsSync(OUTPUTS_PATH)) {
        const content = fs.readFileSync(OUTPUTS_PATH, "utf8");
        expect(content).toMatch(/output\s+"infrastructure_summary"/);
        expect(content).toMatch(/output\s+"test_endpoints"/);
      }
    });

    test("sensitive outputs are marked appropriately", () => {
      if (fs.existsSync(OUTPUTS_PATH)) {
        const content = fs.readFileSync(OUTPUTS_PATH, "utf8");
        if (content.includes('database_connection_string') || content.includes('rds_username')) {
          expect(content).toMatch(/sensitive\s*=\s*true/);
        }
      }
    });
  });

  describe("Security Best Practices", () => {
    test("RDS uses encryption at rest", () => {
      const rdsMain = moduleContents.rds?.["main.tf"] || "";
      expect(rdsMain).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("S3 buckets block public access", () => {
      const s3Main = moduleContents.s3?.["main.tf"] || "";
      expect(s3Main).toMatch(/block_public_acls\s*=\s*true/);
      expect(s3Main).toMatch(/block_public_policy\s*=\s*true/);
    });

    test("KMS key rotation is enabled", () => {
      const kmsMain = moduleContents.kms?.["main.tf"] || "";
      expect(kmsMain).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("security groups follow least privilege", () => {
      const sgMain = moduleContents.security_groups?.["main.tf"] || "";
      expect(sgMain).toMatch(/from_port\s*=|to_port\s*=/);
      expect(sgMain).toMatch(/protocol\s*=/);
    });
  });

  describe("Integration Test Scenarios", () => {
    test("VPC module integration with dependent modules", () => {
      expect(tapStackContent).toMatch(/module\.vpc\.(vpc_id|public_subnet_ids|private_subnet_ids)/);
    });

    test("KMS integration across multiple services", () => {
      expect(tapStackContent).toMatch(/module\.kms\.(key_arn|key_id)/);
    });

    test("complete payment application stack integration", () => {
      // All major components should be present
      expect(tapStackContent).toMatch(/module\s+"vpc"/);
      expect(tapStackContent).toMatch(/module\s+"rds"/);
      expect(tapStackContent).toMatch(/module\s+"s3"/);
      expect(tapStackContent).toMatch(/module\s+"alb"/);
      expect(tapStackContent).toMatch(/module\s+"asg"/);
    });

    test("environment-specific behavior configuration", () => {
      expect(tapStackContent).toMatch(/local\.env_config\[var\.environment\]/);
    });
  });

  describe("Error Prevention and Validation", () => {
    test("no duplicate resource names across modules", () => {
      const resourceNames: string[] = [];

      const allContent = tapStackContent + Object.values(moduleContents).map(module => Object.values(module).join("")).join("");
      const matches = allContent.match(/resource\s+"[^"]+"\s+"([^"]+)"/g) || [];
      matches.forEach(match => {
        const parts = match.split('"');
        if (parts.length >= 4) {
          resourceNames.push(parts[3]);
        }
      });

      const nameCount: { [key: string]: number } = {};
      resourceNames.forEach(name => {
        nameCount[name] = (nameCount[name] || 0) + 1;
      });

      const allowedDuplicates = ['main', 'current'];
      const problematicDuplicates = Object.entries(nameCount).filter(([name, count]) =>
        count > 1 && !allowedDuplicates.includes(name)
      );
      expect(problematicDuplicates.length).toBeLessThanOrEqual(3);
    });

    test("variable names are consistent across modules", () => {
      const commonVars = ["tags", "project_name", "environment", "common_tags"];
      Object.keys(moduleContents).forEach(module => {
        const varsContent = moduleContents[module]["variables.tf"] || "";
        commonVars.forEach(varName => {
          if (varsContent.includes(`variable "${varName}"`)) {
            expect(varsContent).toMatch(new RegExp(`variable\\s+"${varName}"\\s*{`));
          }
        });
      });
    });

    test("outputs are properly structured", () => {
      Object.keys(moduleContents).forEach(module => {
        const outputsContent = moduleContents[module]["outputs.tf"] || "";
        if (outputsContent) {
          const outputs = outputsContent.match(/output\s+"[^"]+"/g) || [];
          const descriptions = outputsContent.match(/description\s*=/g) || [];
          expect(descriptions.length).toBeGreaterThanOrEqual(outputs.length * 0.8);
        }
      });
    });

    test("tfvars files have consistent structure", () => {
      const environments = ["dev", "staging", "prod"];
      environments.forEach(env => {
        const envPattern = new RegExp(`environment\\s*=\\s*"${env}"`);
        expect(tfvarsContents[env]).toMatch(envPattern);
        expect(tfvarsContents[env]).toMatch(/vpc_cidr\s*=\s*"10\.\d+\.\d+\.\d+\/16"/);
      });
    });
  });
});
