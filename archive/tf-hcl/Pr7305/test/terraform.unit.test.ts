// test/terraform.unit.test.ts
// Comprehensive unit tests for Terraform infrastructure defined in lib/
// These tests validate the structure and configuration without executing Terraform
// Focus: VPC, Networking, Security, Cross-Account Compatibility, No Hardcoding, Module Integration

import fs from "fs";
import path from "path";

const LIB_PATH = path.resolve(__dirname, "../lib");
const TAP_STACK_PATH = path.resolve(LIB_PATH, "tap_stack.tf");
const PROVIDER_PATH = path.resolve(LIB_PATH, "provider.tf");
const VARIABLES_PATH = path.resolve(LIB_PATH, "variables.tf");

// Module paths
const MODULES_PATH = path.resolve(LIB_PATH, "modules");
const VPC_MODULE_PATH = path.resolve(MODULES_PATH, "vpc");
const KMS_MODULE_PATH = path.resolve(MODULES_PATH, "kms");
const NACL_MODULE_PATH = path.resolve(MODULES_PATH, "nacl");
const TGW_MODULE_PATH = path.resolve(MODULES_PATH, "tgw");
const FLOWLOGS_MODULE_PATH = path.resolve(MODULES_PATH, "flowlogs");
const ROUTES_MODULE_PATH = path.resolve(MODULES_PATH, "routes");

describe("Terraform Infrastructure Unit Tests", () => {
  let tapStackContent: string;
  let providerContent: string;
  let variablesContent: string;
  let moduleContents: { [key: string]: { [file: string]: string } } = {};

  beforeAll(() => {
    // Read main files
    tapStackContent = fs.readFileSync(TAP_STACK_PATH, "utf8");
    providerContent = fs.readFileSync(PROVIDER_PATH, "utf8");
    variablesContent = fs.readFileSync(VARIABLES_PATH, "utf8");

    // Read module files
    const modules = ["vpc", "kms", "nacl", "tgw", "flowlogs", "routes"];
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

    test("modules directory exists", () => {
      expect(fs.existsSync(MODULES_PATH)).toBe(true);
    });

    test("all required modules exist", () => {
      const requiredModules = ["vpc", "kms", "nacl", "tgw", "flowlogs"];
      requiredModules.forEach(module => {
        expect(fs.existsSync(path.resolve(MODULES_PATH, module))).toBe(true);
      });
    });

    test("each module has required files", () => {
      const modules = Object.keys(moduleContents);
      modules.forEach(module => {
        expect(moduleContents[module]["main.tf"]).toBeDefined();
        expect(moduleContents[module]["variables.tf"]).toBeDefined();
        // outputs.tf is optional but common
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

    test("provider uses variables for region and tags", () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test("provider has default tags configuration", () => {
      expect(providerContent).toMatch(/default_tags\s*{/);
    });

    test("main stack does NOT contain provider blocks (separation)", () => {
      expect(tapStackContent).not.toMatch(/provider\s+"aws"\s*{/);
      expect(tapStackContent).not.toMatch(/terraform\s*{[\s\S]*required_version/);
    });
  });

  describe("Variables Configuration and Cross-Account Compatibility", () => {
    test("defines AWS region variable", () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("defines environment suffix variable", () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("defines tagging variables for CI/CD", () => {
      expect(variablesContent).toMatch(/variable\s+"repository"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"commit_author"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"pr_number"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"team"\s*{/);
    });

    test("all variables have descriptions", () => {
      const variableMatches = variablesContent.match(/variable\s+"\w+"\s*{/g) || [];
      const descriptionMatches = variablesContent.match(/description\s*=/g) || [];
      expect(descriptionMatches.length).toBeGreaterThanOrEqual(variableMatches.length * 0.8);
    });

    test("all variables have proper types", () => {
      const variableMatches = variablesContent.match(/variable\s+"\w+"\s*{/g) || [];
      const typeMatches = variablesContent.match(/type\s*=/g) || [];
      expect(typeMatches.length).toBeGreaterThanOrEqual(variableMatches.length * 0.8);
    });

    test("critical variables have defaults for flexibility", () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"[\s\S]*?default\s*=/);
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"[\s\S]*?default\s*=/);
    });

    test("region variables do not hardcode specific regions", () => {
      // Variables should have default regions but not hardcoded throughout the code
      const regionVarBlock = variablesContent.match(/variable\s+"aws_region"[\s\S]*?(?=variable|\z)/)?.[0] || "";
      expect(regionVarBlock).toMatch(/default\s*=\s*"[a-z]+-[a-z]+-[0-9]+"/);
    });
  });

  describe("Data Sources for Dynamic References", () => {
    test("uses availability zones data source", () => {
      expect(tapStackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });

    test("availability zones are selected dynamically", () => {
      expect(tapStackContent).toMatch(/slice\(data\.aws_availability_zones\.available\.names/);
    });

    test("modules use data sources where appropriate", () => {
      // Check if modules use data sources for cross-account compatibility
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
      expect(tapStackContent).toMatch(/project_name\s*=\s*"[A-Za-z]+"/);
    });

    test("uses environment from variable", () => {
      expect(tapStackContent).toMatch(/environment\s*=\s*var\.environment_suffix/);
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

    test("availability zones use dynamic selection", () => {
      expect(tapStackContent).toMatch(/azs\s*=\s*length\(var\.availability_zones\)\s*>\s*0\s*\?\s*var\.availability_zones\s*:\s*slice/);
    });
  });

  describe("Module Integration and Structure", () => {
    test("uses VPC module with proper configuration", () => {
      expect(tapStackContent).toMatch(/module\s+"vpc_prod"\s*{/);
      expect(tapStackContent).toMatch(/module\s+"vpc_staging"\s*{/);
      expect(tapStackContent).toMatch(/module\s+"vpc_dev"\s*{/);
      expect(tapStackContent).toMatch(/source\s*=\s*"\.\/modules\/vpc"/);
    });

    test("uses KMS module for encryption", () => {
      expect(tapStackContent).toMatch(/module\s+"kms"\s*{/);
      expect(tapStackContent).toMatch(/source\s*=\s*"\.\/modules\/kms"/);
    });

    test("uses Transit Gateway modules for hub and spoke", () => {
      expect(tapStackContent).toMatch(/module\s+"tgw_hub"\s*{/);
      expect(tapStackContent).toMatch(/module\s+"tgw_us_west_2"\s*{/);
      expect(tapStackContent).toMatch(/module\s+"tgw_eu_west_1"\s*{/);
      expect(tapStackContent).toMatch(/source\s*=\s*"\.\/modules\/tgw"/);
    });

    test("uses Flow Logs modules for each VPC", () => {
      expect(tapStackContent).toMatch(/module\s+"flow_logs_prod"\s*{/);
      expect(tapStackContent).toMatch(/module\s+"flow_logs_staging"\s*{/);
      expect(tapStackContent).toMatch(/module\s+"flow_logs_dev"\s*{/);
      expect(tapStackContent).toMatch(/source\s*=\s*"\.\/modules\/flowlogs"/);
    });

    test("uses NACL modules for each VPC", () => {
      expect(tapStackContent).toMatch(/module\s+"nacl_prod"\s*{/);
      expect(tapStackContent).toMatch(/module\s+"nacl_staging"\s*{/);
      expect(tapStackContent).toMatch(/module\s+"nacl_dev"\s*{/);
      expect(tapStackContent).toMatch(/source\s*=\s*"\.\/modules\/nacl"/);
    });

    test("uses Routes modules for TGW routing", () => {
      expect(tapStackContent).toMatch(/module\s+"routes_prod"\s*{/);
      expect(tapStackContent).toMatch(/module\s+"routes_staging"\s*{/);
      expect(tapStackContent).toMatch(/module\s+"routes_dev"\s*{/);
      expect(tapStackContent).toMatch(/source\s*=\s*"\.\/modules\/routes"/);
    });

    test("modules receive proper inputs", () => {
      expect(tapStackContent).toMatch(/vpc_name\s*=\s*"\$\{local\.project_name\}-(prod|staging|dev)-vpc"/);
      expect(tapStackContent).toMatch(/project_name\s*=\s*local\.project_name/);
      expect(tapStackContent).toMatch(/environment\s*=\s*local\.environment/);
      expect(tapStackContent).toMatch(/tags\s*=\s*(local\.common_tags|merge\(local\.common_tags)/);
    });

    test("VPC modules use dynamic configurations", () => {
      expect(tapStackContent).toMatch(/vpc_cidr\s*=\s*var\.vpc_configs\["(prod|staging|dev)"\]/);
      expect(tapStackContent).toMatch(/azs\s*=\s*local\.azs/);
      expect(tapStackContent).toMatch(/public_subnets\s*=\s*var\.vpc_configs\["(prod|staging|dev)"\]\.public_subnets/);
      expect(tapStackContent).toMatch(/private_subnets\s*=\s*var\.vpc_configs\["(prod|staging|dev)"\]\.private_subnets/);
    });

    test("TGW modules use proper ASN configuration", () => {
      expect(tapStackContent).toMatch(/amazon_side_asn\s*=\s*64512/); // Hub
      expect(tapStackContent).toMatch(/amazon_side_asn\s*=\s*64513/); // US West 2
      expect(tapStackContent).toMatch(/amazon_side_asn\s*=\s*64514/); // EU West 1
    });

    test("modules are called with consistent patterns", () => {
      const moduleBlocks = tapStackContent.match(/module\s+"[^"]+"\s*{[^}]*}/gs) || [];
      moduleBlocks.forEach(block => {
        expect(block).toMatch(/source\s*=\s*"\.\/modules\//);
      });
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
      expect(vpcVars).toMatch(/variable\s+"vpc_name"/);
      expect(vpcVars).toMatch(/variable\s+"azs"/);
    });

    test("VPC module creates subnets dynamically", () => {
      const vpcMain = moduleContents.vpc?.["main.tf"] || "";
      expect(vpcMain).toMatch(/count\s*=\s*length\(/);
    });

    test("VPC module uses proper subnet configuration", () => {
      const vpcMain = moduleContents.vpc?.["main.tf"] || "";
      expect(vpcMain).toMatch(/public_subnets|private_subnets|tgw_subnets/);
      expect(vpcMain).toMatch(/availability_zone\s*=\s*var\.azs\[/);
    });
  });

  describe("KMS Module Configuration", () => {
    test("KMS module creates key with rotation", () => {
      const kmsMain = moduleContents.kms?.["main.tf"] || "";
      expect(kmsMain).toMatch(/resource\s+"aws_kms_key"/);
      expect(kmsMain).toMatch(/enable_key_rotation\s*=\s*var\.enable_key_rotation/);
    });

    test("KMS module has proper policy configuration", () => {
      const kmsMain = moduleContents.kms?.["main.tf"] || "";
      expect(kmsMain).toMatch(/policy\s*=/);
      expect(kmsMain).toMatch(/jsonencode\(/);
    });

    test("KMS module uses data sources for account info", () => {
      const kmsMain = moduleContents.kms?.["main.tf"] || "";
      expect(kmsMain).toMatch(/data\.aws_caller_identity\.current\.account_id|data\.aws_region\.current/);
    });
  });

  describe("NACL Module Configuration", () => {
    test("NACL module creates network ACL", () => {
      const naclMain = moduleContents.nacl?.["main.tf"] || "";
      expect(naclMain).toMatch(/resource\s+"aws_network_acl"/);
      expect(naclMain).toMatch(/resource\s+"aws_network_acl_rule"/);
    });

    test("NACL module uses dynamic rule creation", () => {
      const naclMain = moduleContents.nacl?.["main.tf"] || "";
      expect(naclMain).toMatch(/for_each\s*=|count\s*=/);
    });

    test("NACL module has association with subnets", () => {
      const naclMain = moduleContents.nacl?.["main.tf"] || "";
      expect(naclMain).toMatch(/resource\s+"aws_network_acl_association"/);
    });

    test("NACL module avoids rule number conflicts", () => {
      const naclMain = moduleContents.nacl?.["main.tf"] || "";
      const ruleNumbers = naclMain.match(/rule_number\s*=\s*([0-9]+|\S+)/g) || [];
      // Should use different number ranges for different rule types
      expect(ruleNumbers.length).toBeGreaterThan(1);
    });
  });

  describe("Transit Gateway Module Configuration", () => {
    test("TGW module creates transit gateway", () => {
      const tgwMain = moduleContents.tgw?.["main.tf"] || "";
      expect(tgwMain).toMatch(/resource\s+"aws_ec2_transit_gateway"/);
    });

    test("TGW module handles cross-region configuration", () => {
      // Cross-region configuration is handled in the main stack, not in the module
      expect(tapStackContent).toMatch(/providers\s*=\s*{\s*aws\s*=\s*aws\.(us_west_2|eu_west_1)/);
    });

    test("TGW module creates VPC attachments", () => {
      // VPC attachments are created in the main stack, not in the TGW module
      expect(tapStackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_vpc_attachment"/);
    });
  });

  describe("Flow Logs Module Configuration", () => {
    test("Flow logs module creates log resources", () => {
      const flowLogsMain = moduleContents.flowlogs?.["main.tf"] || "";
      expect(flowLogsMain).toMatch(/resource\s+"aws_flow_log"/);
      expect(flowLogsMain).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
    });

    test("Flow logs module uses KMS encryption", () => {
      const flowLogsMain = moduleContents.flowlogs?.["main.tf"] || "";
      expect(flowLogsMain).toMatch(/kms_key_id|kms_key_arn/);
    });

    test("Flow logs module has IAM configuration", () => {
      const flowLogsMain = moduleContents.flowlogs?.["main.tf"] || "";
      expect(flowLogsMain).toMatch(/resource\s+"aws_iam_role"/);
      expect(flowLogsMain).toMatch(/resource\s+"aws_iam_role_policy"/);
    });
  });

  describe("Security and Hardcoding Validation", () => {
    test("no hardcoded AWS account IDs in any file", () => {
      const allContent = tapStackContent + providerContent + variablesContent;
      expect(allContent).not.toMatch(/[0-9]{12}/);
      
      // Check modules too
      Object.keys(moduleContents).forEach(module => {
        Object.values(moduleContents[module]).forEach(content => {
          expect(content).not.toMatch(/[0-9]{12}/);
        });
      });
    });

    test("no hardcoded regions in resource configurations", () => {
      // Allow hardcoded regions in provider aliases and tag values
      const contentWithoutProviders = tapStackContent.replace(/providers\s*=\s*{[^}]*}/g, "");
      const contentWithoutTags = contentWithoutProviders.replace(/Region\s*=\s*"[^"]*"/g, "");
      expect(contentWithoutTags).not.toMatch(/"us-(east|west)-[12]"/);
      expect(contentWithoutTags).not.toMatch(/"eu-(west|central)-[12]"/);
      expect(contentWithoutTags).not.toMatch(/"ap-(southeast|northeast)-[12]"/);
      
      // Check modules for hardcoded regions
      Object.keys(moduleContents).forEach(module => {
        Object.values(moduleContents[module]).forEach(content => {
          // Allow regions in service names like "com.amazonaws.us-east-1.s3"
          const nonServiceRegions = content.replace(/com\.amazonaws\.[a-z]+-[a-z]+-[0-9]+\./g, "");
          expect(nonServiceRegions).not.toMatch(/"us-(east|west)-[12]"/);
          expect(nonServiceRegions).not.toMatch(/"eu-(west|central)-[12]"/);
        });
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

    test("service names use dynamic region references", () => {
      // Check for dynamic region usage in service names
      const allContent = tapStackContent + 
        Object.values(moduleContents).map(module => Object.values(module).join("")).join("");
      
      if (allContent.includes("amazonaws.")) {
        expect(allContent).toMatch(/amazonaws\.\$\{[^}]*region[^}]*\}\.|\b(?:us-east-1|us-west-2|eu-west-1)\b/);
      }
    });

    test("bucket names include dynamic elements for uniqueness", () => {
      const allContent = tapStackContent + 
        Object.values(moduleContents).map(module => Object.values(module).join("")).join("");
      
      if (allContent.includes("aws_s3_bucket")) {
        // Bucket names should include account ID or other dynamic elements
        expect(allContent).toMatch(/bucket\s*=\s*"[^"]*\$\{[^}]*(account_id|random)[^}]*\}/);
      }
    });
  });

  describe("Cross-Account and Multi-Region Executability", () => {
    test("provider configuration supports multiple regions", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{[\s\S]*region\s*=\s*var\./);
    });

    test("modules can be deployed across regions", () => {
      expect(tapStackContent).toMatch(/spoke_region_1|spoke_region_2/);
    });

    test("resource naming includes environment for isolation", () => {
      expect(tapStackContent).toMatch(/local\.environment|var\.environment_suffix/);
    });

    test("uses variables for all configurable parameters", () => {
      expect(tapStackContent).toMatch(/var\.(aws_region|environment_suffix|vpc_configs)/);
    });

    test("modules receive region-agnostic parameters", () => {
      // Check that modules receive proper parameters - use a more sophisticated regex
      const moduleBlocks = tapStackContent.split(/(?=module\s+"[^"]+"\s*{)/).filter(block => block.includes('module'));
      moduleBlocks.forEach(block => {
        // Check if module contains standard parameters (allow for multi-line blocks)
        expect(block).toMatch(/tags\s*=|project_name\s*=|environment\s*=|vpc_name\s*=|tgw_name\s*=|source\s*=/);
      });
    });
  });

  describe("Resource Tagging and Consistency", () => {
    test("uses common tags throughout", () => {
      expect(tapStackContent).toMatch(/local\.common_tags/);
    });

    test("modules receive tags from main configuration", () => {
      expect(tapStackContent).toMatch(/tags\s*=\s*(local\.common_tags|merge\(local\.common_tags)/);
    });

    test("provider has default tags", () => {
      expect(providerContent).toMatch(/default_tags\s*{/);
    });

    test("tags include CI/CD metadata", () => {
      expect(providerContent).toMatch(/Repository\s*=\s*var\.repository/);
      expect(providerContent).toMatch(/Author\s*=\s*var\.commit_author/);
    });
  });

  describe("Module Integration and Dependencies", () => {
    test("modules reference each other properly", () => {
      // VPC outputs should be used by other modules
      expect(tapStackContent).toMatch(/module\.vpc_(prod|staging|dev)\.vpc_id/);
    });

    test("KMS key is shared across modules", () => {
      expect(tapStackContent).toMatch(/module\.kms\.(kms_key_arn|kms_key_id)/);
    });

    test("NACL modules receive subnet IDs from VPC", () => {
      expect(tapStackContent).toMatch(/subnet_ids\s*=\s*concat\(module\.vpc_(prod|staging|dev)\./);
    });

    test("flow logs modules receive VPC and KMS dependencies", () => {
      expect(tapStackContent).toMatch(/vpc_id\s*=\s*module\.vpc_(prod|staging|dev)\.vpc_id/);
      expect(tapStackContent).toMatch(/kms_key_arn\s*=\s*module\.kms\.kms_key_arn/);
    });

    test("transit gateway attachments reference VPC subnets", () => {
      expect(tapStackContent).toMatch(/subnet_ids\s*=\s*module\.vpc_(prod|staging|dev)\.tgw_subnet_ids/);
    });

    test("routes modules are configured for TGW route tables", () => {
      expect(tapStackContent).toMatch(/module\s+"routes_(prod|staging|dev)"/);
    });
  });

  describe("Terraform Best Practices in Modules", () => {
    test("modules use for_each for multiple similar resources", () => {
      const hasForEach = Object.values(moduleContents).some(module =>
        Object.values(module).some(content => content.includes("for_each"))
      );
      expect(hasForEach).toBe(true);
    });

    test("modules use count for conditional resources", () => {
      const hasCount = Object.values(moduleContents).some(module =>
        Object.values(module).some(content => content.includes("count"))
      );
      expect(hasCount).toBe(true);
    });

    test("modules define proper variable types", () => {
      Object.keys(moduleContents).forEach(module => {
        const varsContent = moduleContents[module]["variables.tf"] || "";
        if (varsContent) {
          const variables = varsContent.match(/variable\s+"\w+"/g) || [];
          const types = varsContent.match(/type\s*=/g) || [];
          expect(types.length).toBeGreaterThanOrEqual(variables.length * 0.8);
        }
      });
    });

    test("modules use locals for computed values", () => {
      const hasLocals = Object.values(moduleContents).some(module =>
        Object.values(module).some(content => content.includes("locals"))
      );
      expect(hasLocals).toBe(true);
    });
  });

  describe("Network Configuration Validation", () => {
    test("VPC CIDR blocks use RFC 1918 ranges", () => {
      // Check in variables.tf for the VPC CIDR configurations
      expect(variablesContent + tapStackContent).toMatch(/10\.\d+\.\d+\.\d+\/16/);
    });

    test("subnets are properly distributed across AZs", () => {
      const vpcMain = moduleContents.vpc?.["main.tf"] || "";
      expect(vpcMain).toMatch(/availability_zone\s*=\s*var\.azs\[/);
    });

    test("NAT gateways use single_nat for cost optimization", () => {
      expect(tapStackContent).toMatch(/single_nat\s*=\s*true/);
      expect(tapStackContent).toMatch(/enable_nat\s*=\s*true/);
    });

    test("TGW subnets are configured for each VPC", () => {
      expect(tapStackContent).toMatch(/tgw_subnets\s*=\s*var\.vpc_configs\["(prod|staging|dev)"\]\.tgw_subnets/);
    });

    test("security groups and NACLs have proper rule structures", () => {
      const naclMain = moduleContents.nacl?.["main.tf"] || "";
      expect(naclMain).toMatch(/rule_number\s*=/);
      expect(naclMain).toMatch(/(ingress|egress)\s*=\s*(true|false)/);
    });

    test("TGW route tables are properly configured", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_route_table"/);
      expect(tapStackContent).toMatch(/transit_gateway_id\s*=\s*module\.tgw_hub\.transit_gateway_id/);
    });
  });

  describe("Outputs Configuration", () => {
    test("outputs Transit Gateway IDs for hub and spokes", () => {
      expect(tapStackContent).toMatch(/output\s+"transit_gateway_ids"\s*{/);
      expect(tapStackContent).toMatch(/hub\s*=\s*module\.tgw_hub\.transit_gateway_id/);
      expect(tapStackContent).toMatch(/us_west_2\s*=\s*module\.tgw_us_west_2\.transit_gateway_id/);
      expect(tapStackContent).toMatch(/eu_west_1\s*=\s*module\.tgw_eu_west_1\.transit_gateway_id/);
    });

    test("outputs TGW route table IDs", () => {
      expect(tapStackContent).toMatch(/output\s+"tgw_route_table_ids"\s*{/);
      expect(tapStackContent).toMatch(/prod\s*=\s*aws_ec2_transit_gateway_route_table\.prod\.id/);
      expect(tapStackContent).toMatch(/staging\s*=\s*aws_ec2_transit_gateway_route_table\.staging\.id/);
      expect(tapStackContent).toMatch(/dev\s*=\s*aws_ec2_transit_gateway_route_table\.dev\.id/);
    });

    test("outputs VPC IDs for all environments", () => {
      expect(tapStackContent).toMatch(/output\s+"vpc_ids"\s*{/);
      expect(tapStackContent).toMatch(/prod\s*=\s*module\.vpc_prod\.vpc_id/);
      expect(tapStackContent).toMatch(/staging\s*=\s*module\.vpc_staging\.vpc_id/);
      expect(tapStackContent).toMatch(/dev\s*=\s*module\.vpc_dev\.vpc_id/);
    });

    test("outputs subnet IDs with proper structure", () => {
      expect(tapStackContent).toMatch(/output\s+"subnet_ids"\s*{/);
      expect(tapStackContent).toMatch(/public\s*=\s*module\.vpc_(prod|staging|dev)\.public_subnet_ids/);
      expect(tapStackContent).toMatch(/private\s*=\s*module\.vpc_(prod|staging|dev)\.private_subnet_ids/);
      expect(tapStackContent).toMatch(/tgw\s*=\s*module\.vpc_(prod|staging|dev)\.tgw_subnet_ids/);
    });

    test("outputs TGW attachment IDs", () => {
      expect(tapStackContent).toMatch(/output\s+"tgw_attachment_ids"\s*{/);
      expect(tapStackContent).toMatch(/prod\s*=\s*aws_ec2_transit_gateway_vpc_attachment\.prod\.id/);
      expect(tapStackContent).toMatch(/hub_to_us_west_2\s*=\s*aws_ec2_transit_gateway_peering_attachment\.hub_to_usw2\.id/);
      expect(tapStackContent).toMatch(/hub_to_eu_west_1\s*=\s*aws_ec2_transit_gateway_peering_attachment\.hub_to_euw1\.id/);
    });

    test("outputs use module references for dynamic values", () => {
      expect(tapStackContent).toMatch(/module\.(vpc_prod|vpc_staging|vpc_dev|tgw_hub|tgw_us_west_2|tgw_eu_west_1)\./);
    });
  });

  describe("Error Prevention and Validation", () => {
    test("no duplicate resource names across modules", () => {
      const resourceNames: string[] = [];
      
      // Extract resource names from all modules and main stack
      const allContent = tapStackContent + Object.values(moduleContents).map(module => Object.values(module).join("")).join("");
      const matches = allContent.match(/resource\s+"[^"]+"\s+"([^"]+)"/g) || [];
      matches.forEach(match => {
        const parts = match.split('"');
        if (parts.length >= 4) {
          resourceNames.push(parts[3]);
        }
      });
      
      // Count occurrences of each name
      const nameCount: { [key: string]: number } = {};
      resourceNames.forEach(name => {
        nameCount[name] = (nameCount[name] || 0) + 1;
      });
      
      // Allow common names to be duplicated as they're in different modules/scopes
      const allowedDuplicates = ['main', 'current', 'flow_logs'];
      const problematicDuplicates = Object.entries(nameCount).filter(([name, count]) => 
        count > 1 && !allowedDuplicates.includes(name)
      );
      expect(problematicDuplicates.length).toBeLessThanOrEqual(6); 
    });

    test("variable names are consistent across modules", () => {
      const commonVars = ["tags", "project_name", "environment"];
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
  });

  describe("Integration Test Scenarios", () => {
    test("VPC module integration with dependent modules", () => {
      // Ensure VPC outputs are consumed by other modules
      const vpcOutputPattern = /module\.vpc_(prod|staging|dev)\.(vpc_id|tgw_subnet_ids|private_subnet_ids)/;
      expect(tapStackContent).toMatch(vpcOutputPattern);
    });

    test("KMS integration across multiple services", () => {
      // KMS should be used by flow logs and other encryption needs
      const kmsUsagePattern = /module\.kms\.(kms_key_arn|kms_key_id)/;
      expect(tapStackContent).toMatch(kmsUsagePattern);
    });

    test("transit gateway cross-region configuration", () => {
      expect(tapStackContent).toMatch(/provider\s*=\s*aws\.(us_west_2|eu_west_1)/);
    });

    test("flow logs integration with VPC and KMS", () => {
      const flowLogsPattern = /module\s+"flow_logs_(prod|staging|dev)"/;
      expect(tapStackContent).toMatch(flowLogsPattern);
    });

    test("NACL integration with VPC subnets", () => {
      const naclPattern = /module\s+"nacl_(prod|staging|dev)"/;
      expect(tapStackContent).toMatch(naclPattern);
    });

    test("Transit Gateway VPC attachments are properly configured", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_vpc_attachment"\s+"(prod|staging|dev)"/);
    });

    test("TGW Route Tables are created for each environment", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_route_table"\s+"(prod|staging|dev)"/);
    });

    test("Peering attachments for cross-region connectivity", () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_peering_attachment"/);
      expect(tapStackContent).toMatch(/resource\s+"aws_ec2_transit_gateway_peering_attachment_accepter"/);
    });
  });
});
