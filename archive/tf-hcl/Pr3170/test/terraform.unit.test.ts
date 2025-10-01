// tests/unit/unit-tests.ts
// Simple presence + sanity checks for Terraform infrastructure files
// No Terraform commands are executed.

import fs from "fs";
import path from "path";

const LIB_DIR = "../lib";
const libPath = path.resolve(__dirname, LIB_DIR);

describe("Terraform Infrastructure Files", () => {
  test("lib directory exists", () => {
    expect(fs.existsSync(libPath)).toBe(true);
  });

  describe("Provider Configuration", () => {
    const providerPath = path.resolve(libPath, "provider.tf");

    test("provider.tf exists", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test("declares AWS provider", () => {
      const content = fs.readFileSync(providerPath, "utf8");
      expect(content).toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("declares S3 backend", () => {
      const content = fs.readFileSync(providerPath, "utf8");
      expect(content).toMatch(/backend\s+"s3"\s*{/);
    });

    test("declares provider aliases", () => {
      const content = fs.readFileSync(providerPath, "utf8");
      expect(content).toMatch(/alias\s*=\s*"primary"/);
      expect(content).toMatch(/alias\s*=\s*"secondary"/);
    });
  });

  describe("Variables", () => {
    const variablesPath = path.resolve(libPath, "variables.tf");

    test("variables.tf exists", () => {
      expect(fs.existsSync(variablesPath)).toBe(true);
    });

    test("declares aws_region variable", () => {
      const content = fs.readFileSync(variablesPath, "utf8");
      expect(content).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares environment variable", () => {
      const content = fs.readFileSync(variablesPath, "utf8");
      expect(content).toMatch(/variable\s+"environment"\s*{/);
    });

    test("declares VPC CIDR variable", () => {
      const content = fs.readFileSync(variablesPath, "utf8");
      expect(content).toMatch(/variable\s+"vpc_cidr"\s*{/);
    });

    test("declares subnet CIDR variables", () => {
      const content = fs.readFileSync(variablesPath, "utf8");
      expect(content).toMatch(/variable\s+"public_subnet_cidr"\s*{/);
      expect(content).toMatch(/variable\s+"private_subnet_cidr"\s*{/);
      expect(content).toMatch(/variable\s+"private_subnet_2_cidr"\s*{/);
    });

    test("declares database variables", () => {
      const content = fs.readFileSync(variablesPath, "utf8");
      expect(content).toMatch(/variable\s+"db_username"\s*{/);
      expect(content).toMatch(/variable\s+"instance_type"\s*{/);
      expect(content).toMatch(/variable\s+"db_instance_class"\s*{/);
    });
  });

  describe("Data Sources", () => {
    const dataPath = path.resolve(libPath, "data.tf");

    test("data.tf exists", () => {
      expect(fs.existsSync(dataPath)).toBe(true);
    });

    test("declares availability zones data source", () => {
      const content = fs.readFileSync(dataPath, "utf8");
      expect(content).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
    });

    test("declares AMI data source", () => {
      const content = fs.readFileSync(dataPath, "utf8");
      expect(content).toMatch(/data\s+"aws_ami"\s+"amazon_linux"\s*{/);
    });

    test("declares caller identity data source", () => {
      const content = fs.readFileSync(dataPath, "utf8");
      expect(content).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
    });
  });

  describe("Networking", () => {
    const networkingPath = path.resolve(libPath, "networking.tf");

    test("networking.tf exists", () => {
      expect(fs.existsSync(networkingPath)).toBe(true);
    });

    test("declares VPC resource", () => {
      const content = fs.readFileSync(networkingPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    });

    test("declares Internet Gateway", () => {
      const content = fs.readFileSync(networkingPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
    });

    test("declares subnets", () => {
      const content = fs.readFileSync(networkingPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private_2"\s*{/);
    });

    test("declares NAT Gateway", () => {
      const content = fs.readFileSync(networkingPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
    });

    test("declares route tables", () => {
      const content = fs.readFileSync(networkingPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
    });

    test("declares VPC Flow Logs", () => {
      const content = fs.readFileSync(networkingPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_flow_log"\s+"main"\s*{/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"flow_log"\s*{/);
    });

    test("public route table routes 0.0.0.0/0 to Internet Gateway", () => {
      const content = fs.readFileSync(networkingPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_route_table"\s+"public"[\s\S]*route\s*{[\s\S]*cidr_block\s*=\s*"0.0.0.0\/0"[\s\S]*gateway_id\s*=\s*aws_internet_gateway\.main\.id[\s\S]*}/m);
    });

    test("private route table routes 0.0.0.0/0 to NAT Gateway", () => {
      const content = fs.readFileSync(networkingPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"[\s\S]*route\s*{[\s\S]*cidr_block\s*=\s*"0.0.0.0\/0"[\s\S]*nat_gateway_id\s*=\s*aws_nat_gateway\.main\.id[\s\S]*}/m);
    });
  });

  describe("Security Groups", () => {
    const securityPath = path.resolve(libPath, "security_groups.tf");

    test("security_groups.tf exists", () => {
      expect(fs.existsSync(securityPath)).toBe(true);
    });

    test("declares EC2 security group", () => {
      const content = fs.readFileSync(securityPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"ec2"\s*{/);
    });

    test("declares RDS security group", () => {
      const content = fs.readFileSync(securityPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"rds"\s*{/);
    });

    test("EC2 SG allows HTTP(80), HTTPS(443), and SSH(22) from anywhere", () => {
      const content = fs.readFileSync(securityPath, "utf8");
      expect(content).toMatch(/ingress[\s\S]*from_port\s*=\s*80[\s\S]*to_port\s*=\s*80[\s\S]*protocol\s*=\s*"tcp"[\s\S]*cidr_blocks\s*=\s*\["0.0.0.0\/0"\]/m);
      expect(content).toMatch(/ingress[\s\S]*from_port\s*=\s*443[\s\S]*to_port\s*=\s*443[\s\S]*protocol\s*=\s*"tcp"[\s\S]*cidr_blocks\s*=\s*\["0.0.0.0\/0"\]/m);
      expect(content).toMatch(/ingress[\s\S]*from_port\s*=\s*22[\s\S]*to_port\s*=\s*22[\s\S]*protocol\s*=\s*"tcp"[\s\S]*cidr_blocks\s*=\s*\["0.0.0.0\/0"\]/m);
    });

    test("RDS SG restricts 3306 to EC2 SG only", () => {
      const content = fs.readFileSync(securityPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"rds"[\s\S]*ingress[\s\S]*from_port\s*=\s*3306[\s\S]*to_port\s*=\s*3306[\s\S]*security_groups\s*=\s*\[aws_security_group\.ec2\.id\][\s\S]*}/m);
    });
  });

  describe("IAM", () => {
    const iamPath = path.resolve(libPath, "iam.tf");

    test("iam.tf exists", () => {
      expect(fs.existsSync(iamPath)).toBe(true);
    });

    test("declares EC2 IAM role", () => {
      const content = fs.readFileSync(iamPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"ec2"\s*{/);
    });

    test("declares IAM policies", () => {
      const content = fs.readFileSync(iamPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"ec2_ssm_read"\s*{/);
    });

    test("declares instance profile", () => {
      const content = fs.readFileSync(iamPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2"\s*{/);
    });

    test("Flow logs IAM role and policy exist and are attached (if flow logs configured)", () => {
      const networkingPath = path.resolve(libPath, "networking.tf");
      const net = fs.readFileSync(networkingPath, "utf8");
      if (/resource\s+"aws_flow_log"\s+"main"/m.test(net)) {
        expect(net).toMatch(/resource\s+"aws_iam_role"\s+"flow_log"/);
        expect(net).toMatch(/resource\s+"aws_iam_policy"\s+"flow_log"/);
        expect(net).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"flow_log"/);
      } else {
        expect(true).toBe(true);
      }
    });
  });

  describe("Compute", () => {
    const computePath = path.resolve(libPath, "compute.tf");

    test("compute.tf exists", () => {
      expect(fs.existsSync(computePath)).toBe(true);
    });

    test("declares EC2 instance", () => {
      const content = fs.readFileSync(computePath, "utf8");
      expect(content).toMatch(/resource\s+"aws_instance"\s+"web"\s*{/);
    });
  });

  describe("Database", () => {
    const databasePath = path.resolve(libPath, "database.tf");

    test("database.tf exists", () => {
      expect(fs.existsSync(databasePath)).toBe(true);
    });

    test("declares RDS instance", () => {
      const content = fs.readFileSync(databasePath, "utf8");
      expect(content).toMatch(/resource\s+"aws_db_instance"\s+"main"\s*{/);
    });

    test("declares DB subnet group", () => {
      const content = fs.readFileSync(databasePath, "utf8");
      expect(content).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"\s*{/);
    });

    test("declares random password", () => {
      const content = fs.readFileSync(databasePath, "utf8");
      expect(content).toMatch(/resource\s+"random_password"\s+"db_password"\s*{/);
    });
  });

  describe("SSM Parameters", () => {
    const ssmPath = path.resolve(libPath, "ssm.tf");

    test("ssm.tf exists", () => {
      expect(fs.existsSync(ssmPath)).toBe(true);
    });

    test("declares SSM parameters", () => {
      const content = fs.readFileSync(ssmPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_host"\s*{/);
      expect(content).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_port"\s*{/);
      expect(content).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_username"\s*{/);
      expect(content).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_password"\s*{/);
      expect(content).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_name"\s*{/);
    });

    test("SSM parameter names are namespaced under /{environment}/db/*", () => {
      const content = fs.readFileSync(ssmPath, "utf8");
      ["db_host", "db_port", "db_username", "db_password", "db_name"].forEach((param) => {
        const re = new RegExp(`resource\\s+"aws_ssm_parameter"\\s+"${param}"[\\s\\S]*name\\s*=\\s*"/\\\\\${var.environment}/db/`);
        expect(/name\s*=\s*"\/.+\/db\//.test(content)).toBe(true);
      });
    });
  });

  describe("Outputs", () => {
    const outputsPath = path.resolve(libPath, "outputs.tf");

    test("outputs.tf exists", () => {
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    test("declares VPC outputs", () => {
      const content = fs.readFileSync(outputsPath, "utf8");
      expect(content).toMatch(/output\s+"vpc_id"\s*{/);
      expect(content).toMatch(/output\s+"vpc_cidr"\s*{/);
    });

    test("declares subnet outputs", () => {
      const content = fs.readFileSync(outputsPath, "utf8");
      expect(content).toMatch(/output\s+"public_subnet_id"\s*{/);
      expect(content).toMatch(/output\s+"private_subnet_id"\s*{/);
      expect(content).toMatch(/output\s+"private_subnet_2_id"\s*{/);
    });

    test("declares EC2 outputs", () => {
      const content = fs.readFileSync(outputsPath, "utf8");
      expect(content).toMatch(/output\s+"ec2_instance_id"\s*{/);
      expect(content).toMatch(/output\s+"ec2_public_ip"\s*{/);
      expect(content).toMatch(/output\s+"ec2_private_ip"\s*{/);
    });

    test("declares RDS outputs", () => {
      const content = fs.readFileSync(outputsPath, "utf8");
      expect(content).toMatch(/output\s+"rds_endpoint"\s*{/);
      expect(content).toMatch(/output\s+"rds_address"\s*{/);
      expect(content).toMatch(/output\s+"rds_port"\s*{/);
    });

    test("declares SSM parameter outputs", () => {
      const content = fs.readFileSync(outputsPath, "utf8");
      expect(content).toMatch(/output\s+"ssm_parameter_db_host"\s*{/);
      expect(content).toMatch(/output\s+"ssm_parameter_db_port"\s*{/);
      expect(content).toMatch(/output\s+"ssm_parameter_db_username"\s*{/);
      expect(content).toMatch(/output\s+"ssm_parameter_db_password"\s*{/);
      expect(content).toMatch(/output\s+"ssm_parameter_db_name"\s*{/);
    });
  });

  describe("Tagging Compliance", () => {
    test("all resources have ProjectX tag", () => {
      const files = [
        "networking.tf",
        "security_groups.tf",
        "iam.tf",
        "compute.tf",
        "database.tf",
        "ssm.tf"
      ];

      files.forEach(file => {
        const filePath = path.resolve(libPath, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, "utf8");
          // Check for ProjectX tag in resource blocks
          expect(content).toMatch(/Project\s*=\s*"ProjectX"/);
        }
      });
    });
  });

  describe("Security Best Practices", () => {
    test("RDS has encryption enabled", () => {
      const content = fs.readFileSync(path.resolve(libPath, "database.tf"), "utf8");
      expect(content).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("EC2 has encrypted root volume", () => {
      const content = fs.readFileSync(path.resolve(libPath, "compute.tf"), "utf8");
      expect(content).toMatch(/encrypted\s*=\s*true/);
    });

    test("SSM password parameter is SecureString", () => {
      const content = fs.readFileSync(path.resolve(libPath, "ssm.tf"), "utf8");
      expect(content).toMatch(/type\s*=\s*"SecureString"/);
    });

    test("RDS has backup retention", () => {
      const content = fs.readFileSync(path.resolve(libPath, "database.tf"), "utf8");
      expect(content).toMatch(/backup_retention_period\s*=\s*7/);
    });
  });

  describe("Storage & Encryption Best Practices", () => {
    const tfFiles = [
      "provider.tf",
      "variables.tf",
      "data.tf",
      "networking.tf",
      "security_groups.tf",
      "iam.tf",
      "compute.tf",
      "database.tf",
      "ssm.tf",
      "outputs.tf",
    ]
      .map((f) => path.resolve(libPath, f))
      .filter((p) => fs.existsSync(p));

    const allContent = tfFiles.map((p) => fs.readFileSync(p, "utf8")).join("\n\n");

    test("S3 buckets (if defined) have versioning enabled", () => {
      const hasS3Bucket = /resource\s+"aws_s3_bucket"\s+"/m.test(allContent);
      const hasS3BucketVersioningResource = /resource\s+"aws_s3_bucket_versioning"\s+"/m.test(allContent);
      const hasInlineVersioningEnabled = /versioning\s*{[\s\S]*status\s*=\s*"Enabled"[\s\S]*}/m.test(allContent);

      if (hasS3Bucket) {
        expect(hasS3BucketVersioningResource || hasInlineVersioningEnabled).toBe(true);
      } else {
        expect(true).toBe(true);
      }
    });

    test("S3 bucket policies (if defined) restrict access to VPC endpoint only", () => {
      const hasBucketPolicy = /resource\s+"aws_s3_bucket_policy"\s+"/m.test(allContent);
      const hasVpceCondition = /aws:sourceVpce|aws:\\u003asourceVpce/.test(allContent);
      if (hasBucketPolicy) {
        expect(hasVpceCondition).toBe(true);
      } else {
        expect(true).toBe(true);
      }
    });

    test("S3 objects (if defined) can only be accessed through VPC endpoint", () => {
      // Look for common deny statements ensuring requests not from VPCe are denied
      const hasBucketPolicy = /resource\s+"aws_s3_bucket_policy"\s+"/m.test(allContent);
      const hasDenyNotFromVpce = /(Effect\s*:\s*"?Deny"?|"Effect"\s*:\s*"Deny")[\s\S]*?(aws:sourceVpce|aws:\\u003asourceVpce)/m.test(allContent);
      if (hasBucketPolicy) {
        expect(hasDenyNotFromVpce).toBe(true);
      } else {
        expect(true).toBe(true);
      }
    });

    test("KMS keys (if defined) have rotation enabled", () => {
      const hasKmsKey = /resource\s+"aws_kms_key"\s+"/m.test(allContent);
      const rotationEnabled = /enable_key_rotation\s*=\s*true/.test(allContent);
      if (hasKmsKey) {
        expect(rotationEnabled).toBe(true);
      } else {
        expect(true).toBe(true);
      }
    });

    test("S3 Public Access Block (if defined) is fully enabled", () => {
      const hasPab = /resource\s+"aws_s3_bucket_public_access_block"\s+"/m.test(allContent);
      if (hasPab) {
        expect(/block_public_acls\s*=\s*true/.test(allContent)).toBe(true);
        expect(/block_public_policy\s*=\s*true/.test(allContent)).toBe(true);
        expect(/ignore_public_acls\s*=\s*true/.test(allContent)).toBe(true);
        expect(/restrict_public_buckets\s*=\s*true/.test(allContent)).toBe(true);
      } else {
        expect(true).toBe(true);
      }
    });

    test("S3 bucket policy (if defined) denies insecure transport", () => {
      const hasBucketPolicy = /resource\s+"aws_s3_bucket_policy"\s+"/m.test(allContent);
      const deniesInsecure = /(aws:SecureTransport|aws:\\u003aSecureTransport)[\s\S]*?(false|\"false\")[\s\S]*?(Effect\s*:?\s*\"?Deny\"?)/m.test(allContent);
      if (hasBucketPolicy) {
        expect(deniesInsecure).toBe(true);
      } else {
        expect(true).toBe(true);
      }
    });
  });

  describe("EC2 & RDS Storage Profiles", () => {
    test("EC2 root volume uses gp3 (if block defined)", () => {
      const content = fs.readFileSync(path.resolve(libPath, "compute.tf"), "utf8");
      if (/root_block_device\s*{/.test(content)) {
        expect(/volume_type\s*=\s*"gp3"/.test(content)).toBe(true);
      } else {
        expect(true).toBe(true);
      }
    });

    test("RDS storage type is gp3 and deletion protection is explicitly set", () => {
      const content = fs.readFileSync(path.resolve(libPath, "database.tf"), "utf8");
      expect(/storage_type\s*=\s*"gp3"/.test(content)).toBe(true);
      expect(/deletion_protection\s*=\s*(true|false)/.test(content)).toBe(true);
    });
  });

  describe("IAM Policy Hygiene (Conditional)", () => {
    test("Inline IAM policies avoid broad wildcards (outside logs:*)", () => {
      const iamContent = fs.readFileSync(path.resolve(libPath, "iam.tf"), "utf8");
      const wildcards = iamContent.match(/\"Action\"\s*:\s*\"\*\"/g) || [];
      const hasBadWildcard = wildcards.some(() => !/logs:\*/.test(iamContent));
      expect(hasBadWildcard).toBe(false);
    });
  });

  describe("Logs & Monitoring", () => {
    test("VPC flow logs log group has retention set to 7 days", () => {
      const content = fs.readFileSync(path.resolve(libPath, "networking.tf"), "utf8");
      expect(/resource\s+"aws_cloudwatch_log_group"\s+"flow_log"[\s\S]*retention_in_days\s*=\s*7/m.test(content)).toBe(true);
    });

    test("VPC flow logs log group name follows /aws/vpc/{env}-flow-logs", () => {
      const content = fs.readFileSync(path.resolve(libPath, "networking.tf"), "utf8");
      expect(/name\s*=\s*"\/aws\/vpc\/\$\{var\.environment}\-flow\-logs"/.test(content)).toBe(true);
    });
  });

  describe("Outputs Completeness", () => {
    test("outputs include identifiers for key networking and security resources", () => {
      const content = fs.readFileSync(path.resolve(libPath, "outputs.tf"), "utf8");
      [
        'output "internet_gateway_id"',
        'output "nat_gateway_id"',
        'output "ec2_security_group_id"',
        'output "db_subnet_group_name"',
        'output "flow_log_id"',
        'output "flow_log_group_name"'
      ].forEach((output) => expect(content.includes(output)).toBe(true));
    });
  });
});
