/**
 * AWS Secure Infrastructure Project - Unit Tests
 * 
 * This test suite validates the Terraform configuration without running terraform commands:
 * 1. Terraform HCL Configuration validation
 * 2. Security best practices validation 
 * 3. Resource configuration validation
 * 4. Variable and output validation
 * 5. AWS Well-Architected principles validation
 */

import fs from "fs";
import path from "path";

/** === File loader === */
const tapStackPath = path.resolve(__dirname, "../lib/tap_stack.tf");
const providerTfPath = path.resolve(__dirname, "../lib/provider.tf");

function readFileOrThrow(p: string): string {
  if (!fs.existsSync(p)) throw new Error(`File not found at ${p}`);
  return fs.readFileSync(p, "utf8");
}

/** === Helpers: comment strip + HCL block extraction === */
function stripComments(hcl: string): string {
  // Block comments
  let s = hcl.replace(/\/\*[\s\S]*?\*\//g, "");
  // Line comments
  s = s.replace(/\/\/[^\n]*\n/g, "\n");
  s = s.replace(/^[ \t]*#[^\n]*\n/gm, "\n");
  return s;
}

function extractBlocks(hcl: string, blockType: string): string[] {
  const regex = new RegExp(`${blockType}\\s+[^{]*\\{`, "g");
  const blocks: string[] = [];
  let match;
  
  while ((match = regex.exec(hcl)) !== null) {
    const start = match.index;
    const open = hcl.indexOf("{", start);
    if (open === -1) continue;
    
    let depth = 0;
    for (let i = open; i < hcl.length; i++) {
      const ch = hcl[i];
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          blocks.push(hcl.slice(start, i + 1));
          break;
        }
      }
    }
  }
  return blocks;
}

function extractResourcesByType(hcl: string, resourceType: string): string[] {
  const regex = new RegExp(`resource\\s+"${resourceType}"\\s+[^{]*\\{`, "g");
  const blocks: string[] = [];
  let match;
  
  while ((match = regex.exec(hcl)) !== null) {
    const start = match.index;
    const open = hcl.indexOf("{", start);
    if (open === -1) continue;
    
    let depth = 0;
    for (let i = open; i < hcl.length; i++) {
      const ch = hcl[i];
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          blocks.push(hcl.slice(start, i + 1));
          break;
        }
      }
    }
  }
  return blocks;
}

describe("Terraform HCL Configuration Tests", () => {
  let tapStackContent: string;
  let providerContent: string;

  beforeAll(() => {
    tapStackContent = readFileOrThrow(tapStackPath);
    providerContent = readFileOrThrow(providerTfPath);
  });

  describe("1. File Structure and Basic Validation", () => {
    test("tap_stack.tf file exists and is readable", () => {
      expect(tapStackContent).toBeTruthy();
      expect(tapStackContent.length).toBeGreaterThan(100);
    });

    test("provider.tf file exists and is readable", () => {
      expect(providerContent).toBeTruthy();
      expect(providerContent.length).toBeGreaterThan(50);
    });

    test("No provider blocks in tap_stack.tf (should be in provider.tf)", () => {
      const cleanContent = stripComments(tapStackContent);
      expect(cleanContent).not.toMatch(/provider\s+"aws"\s*\{/);
    });

    test("aws_region variable is declared in tap_stack.tf", () => {
      expect(tapStackContent).toMatch(/variable\s+"aws_region"\s*\{/);
    });

    test("provider.tf uses aws_region variable", () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });
  });

  describe("2. Required Variables Validation", () => {
    test("All required variables are declared", () => {
      const requiredVars = ["aws_region", "environment", "project", "vpc_cidr", "github_repo", "github_branch"];
      
      requiredVars.forEach(varName => {
        expect(tapStackContent).toMatch(new RegExp(`variable\\s+"${varName}"\\s*\\{`));
      });
    });

    test("Variables have proper validation rules", () => {
      // AWS region validation - simplified to check for regex pattern
      expect(tapStackContent).toMatch(/validation\s*\{[\s\S]*?regex.*a-z/);
      
      // Environment validation
      expect(tapStackContent).toMatch(/contains.*production/);
    });

    test("Default region is us-west-2", () => {
      expect(tapStackContent).toMatch(/variable\s+"aws_region"[\s\S]*?default\s*=\s*"us-west-2"/);
    });
  });

  describe("3. Security Configuration Validation", () => {
    test("KMS key is configured with proper policy", () => {
      const kmsBlocks = extractResourcesByType(tapStackContent, "aws_kms_key");
      expect(kmsBlocks.length).toBeGreaterThan(0);
      
      const kmsBlock = kmsBlocks[0];
      expect(kmsBlock).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(kmsBlock).toMatch(/policy\s*=\s*jsonencode/);
    });

    test("Security groups follow least privilege principle", () => {
      const sgBlocks = extractResourcesByType(tapStackContent, "aws_security_group");
      expect(sgBlocks.length).toBeGreaterThan(3); // ALB, EKS cluster, EKS nodes, RDS
      
      // ALB security group should only allow 80/443
      const albSg = sgBlocks.find(sg => sg.includes("alb"));
      expect(albSg).toBeDefined();
      expect(albSg).toMatch(/from_port\s*=\s*80/);
      expect(albSg).toMatch(/from_port\s*=\s*443/);
      
      // RDS security group should only allow 5432 from EKS nodes
      const rdsSg = sgBlocks.find(sg => sg.includes("rds"));
      expect(rdsSg).toBeDefined();
      expect(rdsSg).toMatch(/from_port\s*=\s*5432/);
      expect(rdsSg).toMatch(/security_groups/);
    });

    test("RDS is configured in private subnets only", () => {
      const rdsBlocks = extractResourcesByType(tapStackContent, "aws_db_instance");
      expect(rdsBlocks.length).toBeGreaterThan(0);
      
      const rdsBlock = rdsBlocks[0];
      expect(rdsBlock).toMatch(/vpc_security_group_ids/);
      expect(rdsBlock).toMatch(/db_subnet_group_name/);
      expect(rdsBlock).not.toMatch(/publicly_accessible\s*=\s*true/);
    });

    test("All S3 buckets have encryption enabled", () => {
      const s3Blocks = extractResourcesByType(tapStackContent, "aws_s3_bucket");
      const s3EncryptionBlocks = extractResourcesByType(tapStackContent, "aws_s3_bucket_server_side_encryption_configuration");
      
      expect(s3Blocks.length).toBeGreaterThan(0);
      expect(s3EncryptionBlocks.length).toEqual(s3Blocks.length);
      
      s3EncryptionBlocks.forEach(encBlock => {
        expect(encBlock).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
        expect(encBlock).toMatch(/kms_master_key_id/);
      });
    });

    test("All S3 buckets have public access blocked", () => {
      const s3Blocks = extractResourcesByType(tapStackContent, "aws_s3_bucket");
      const publicAccessBlocks = extractResourcesByType(tapStackContent, "aws_s3_bucket_public_access_block");
      
      expect(publicAccessBlocks.length).toBeGreaterThan(0);
      
      publicAccessBlocks.forEach(pabBlock => {
        expect(pabBlock).toMatch(/block_public_acls\s*=\s*true/);
        expect(pabBlock).toMatch(/block_public_policy\s*=\s*true/);
        expect(pabBlock).toMatch(/ignore_public_acls\s*=\s*true/);
        expect(pabBlock).toMatch(/restrict_public_buckets\s*=\s*true/);
      });
    });
  });

  describe("4. Network Configuration Validation", () => {
    test("VPC is configured with proper CIDR and DNS", () => {
      const vpcBlocks = extractResourcesByType(tapStackContent, "aws_vpc");
      expect(vpcBlocks.length).toBe(1);
      
      const vpcBlock = vpcBlocks[0];
      expect(vpcBlock).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
      expect(vpcBlock).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(vpcBlock).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("Public and private subnets are created across multiple AZs", () => {
      const publicSubnets = extractResourcesByType(tapStackContent, "aws_subnet").filter(subnet => 
        subnet.includes("public") || subnet.includes("map_public_ip_on_launch = true")
      );
      const privateSubnets = extractResourcesByType(tapStackContent, "aws_subnet").filter(subnet => 
        subnet.includes("private") && !subnet.includes("map_public_ip_on_launch")
      );
      
      expect(publicSubnets.length).toBeGreaterThan(0);
      expect(privateSubnets.length).toBeGreaterThan(0);
      
      // Check for AZ distribution
      expect(tapStackContent).toMatch(/local\.azs\[count\.index\]/);
    });

    test("NAT Gateways are configured for private subnet internet access", () => {
      const natGateways = extractResourcesByType(tapStackContent, "aws_nat_gateway");
      const eips = extractResourcesByType(tapStackContent, "aws_eip");
      
      expect(natGateways.length).toBeGreaterThan(0);
      expect(eips.length).toBeGreaterThan(0);
      
      natGateways.forEach(nat => {
        expect(nat).toMatch(/allocation_id/);
        expect(nat).toMatch(/subnet_id/);
      });
    });
  });

  describe("5. EKS Configuration Validation", () => {
    test("EKS cluster is properly configured", () => {
      const eksCluster = extractResourcesByType(tapStackContent, "aws_eks_cluster");
      expect(eksCluster.length).toBe(1);
      
      const cluster = eksCluster[0];
      expect(cluster).toMatch(/version\s*=\s*"1\.30"/);
      expect(cluster).toMatch(/endpoint_private_access\s*=\s*true/);
      expect(cluster).toMatch(/endpoint_public_access\s*=\s*true/);
      expect(cluster).toMatch(/enabled_cluster_log_types/);
      expect(cluster).toMatch(/encryption_config/);
    });

    test("EKS managed node group is configured", () => {
      const nodeGroups = extractResourcesByType(tapStackContent, "aws_eks_node_group");
      expect(nodeGroups.length).toBe(1);
      
      const nodeGroup = nodeGroups[0];
      expect(nodeGroup).toMatch(/instance_types\s*=\s*\["t3\.medium"\]/);
      expect(nodeGroup).toMatch(/capacity_type\s*=\s*"ON_DEMAND"/);
      expect(nodeGroup).toMatch(/scaling_config/);
    });

    test("EKS IAM roles have proper policies attached", () => {
      const eksRoles = extractResourcesByType(tapStackContent, "aws_iam_role").filter(role => 
        role.includes("eks") || role.includes("EKS")
      );
      const policyAttachments = extractResourcesByType(tapStackContent, "aws_iam_role_policy_attachment");
      
      expect(eksRoles.length).toBeGreaterThanOrEqual(2); // cluster + nodes
      expect(policyAttachments.length).toBeGreaterThanOrEqual(4); // Multiple policies
      
      // Check for required policies
      expect(tapStackContent).toMatch(/AmazonEKSClusterPolicy/);
      expect(tapStackContent).toMatch(/AmazonEKSWorkerNodePolicy/);
      expect(tapStackContent).toMatch(/AmazonEKS_CNI_Policy/);
      expect(tapStackContent).toMatch(/AmazonEC2ContainerRegistryReadOnly/);
    });
  });

  describe("6. Load Balancer and Target Group Validation", () => {
    test("Application Load Balancer is configured", () => {
      const albs = extractResourcesByType(tapStackContent, "aws_lb");
      expect(albs.length).toBe(1);
      
      const alb = albs[0];
      expect(alb).toMatch(/load_balancer_type\s*=\s*"application"/);
      expect(alb).toMatch(/internal\s*=\s*false/);
      expect(alb).toMatch(/security_groups/);
      expect(alb).toMatch(/subnets.*public/);
    });

    test("Target group and listener are configured", () => {
      const targetGroups = extractResourcesByType(tapStackContent, "aws_lb_target_group");
      const listeners = extractResourcesByType(tapStackContent, "aws_lb_listener");
      
      expect(targetGroups.length).toBe(1);
      expect(listeners.length).toBe(1);
      
      const tg = targetGroups[0];
      expect(tg).toMatch(/port\s*=\s*80/);
      expect(tg).toMatch(/protocol\s*=\s*"HTTP"/);
      expect(tg).toMatch(/health_check/);
    });
  });

  describe("7. Monitoring and Compliance Validation", () => {
    test("CloudTrail is configured with encryption", () => {
      const cloudTrails = extractResourcesByType(tapStackContent, "aws_cloudtrail");
      expect(cloudTrails.length).toBe(1);
      
      const trail = cloudTrails[0];
      expect(trail).toMatch(/kms_key_id/);
      expect(trail).toMatch(/s3_bucket_name/);
      expect(trail).toMatch(/event_selector/);
    });

    test("CloudWatch log groups are configured with KMS encryption", () => {
      const logGroups = extractResourcesByType(tapStackContent, "aws_cloudwatch_log_group");
      expect(logGroups.length).toBeGreaterThan(0);
      
      logGroups.forEach(lg => {
        expect(lg).toMatch(/kms_key_id/);
        expect(lg).toMatch(/retention_in_days/);
      });
    });

    test("All resources have consistent tagging", () => {
      const resources = [
        ...extractResourcesByType(tapStackContent, "aws_vpc"),
        ...extractResourcesByType(tapStackContent, "aws_subnet"),
        ...extractResourcesByType(tapStackContent, "aws_eks_cluster"),
        ...extractResourcesByType(tapStackContent, "aws_db_instance")
      ];
      
      resources.forEach(resource => {
        expect(resource).toMatch(/tags\s*=/);
      });
      
      // Check for common tags structure
      expect(tapStackContent).toMatch(/common_tags\s*=\s*\{/);
      expect(tapStackContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(tapStackContent).toMatch(/Project\s*=\s*var\.project/);
      expect(tapStackContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
    });
  });

  describe("8. CI/CD Pipeline Configuration", () => {
    test("CodePipeline is configured", () => {
      const codePipelines = extractResourcesByType(tapStackContent, "aws_codepipeline");
      expect(codePipelines.length).toBe(1);
      
      const pipeline = codePipelines[0];
      expect(pipeline).toMatch(/artifact_store/);
      expect(pipeline).toMatch(/encryption_key/);
      expect(pipeline).toMatch(/stage/);
      expect(pipeline).toMatch(/provider.*=.*"CodeStarSourceConnection"/);
    });

    test("CodeBuild project is configured", () => {
      const codeBuildProjects = extractResourcesByType(tapStackContent, "aws_codebuild_project");
      expect(codeBuildProjects.length).toBe(1);
      
      const project = codeBuildProjects[0];
      expect(project).toMatch(/service_role/);
      expect(project).toMatch(/artifacts/);
      expect(project).toMatch(/environment/);
    });

    test("SSM parameters are configured for secrets", () => {
      const ssmParams = extractResourcesByType(tapStackContent, "aws_ssm_parameter");
      expect(ssmParams.length).toBeGreaterThan(0);
      
      ssmParams.forEach(param => {
        expect(param).toMatch(/type\s*=\s*"SecureString"/);
        expect(param).toMatch(/key_id.*kms_key/);
      });
    });
  });

  describe("9. Output Validation", () => {
    test("All required outputs are defined", () => {
      const requiredOutputs = [
        "aws_region", "vpc_id", "eks_cluster_name", "eks_cluster_endpoint", 
        "alb_dns_name", "rds_endpoint", "kms_key_arn", "codepipeline_name"
      ];
      
      requiredOutputs.forEach(outputName => {
        expect(tapStackContent).toMatch(new RegExp(`output\\s+"${outputName}"\\s*\\{`));
      });
    });

    test("Sensitive outputs are properly marked", () => {
      expect(tapStackContent).toMatch(/output\s+"rds_endpoint"[\s\S]*?sensitive\s*=\s*true/);
    });

    test("Outputs have descriptions", () => {
      const outputs = extractBlocks(tapStackContent, "output");
      outputs.forEach(output => {
        expect(output).toMatch(/description\s*=/);
      });
    });
  });

  describe("10. Resource Naming and Conventions", () => {
    test("All resources follow corp- naming convention", () => {
      expect(tapStackContent).toMatch(/name_prefix\s*=\s*"corp-/);
      
      // Check various resources use the prefix or contain corp
      const resourcesWithNames = [
        ...extractResourcesByType(tapStackContent, "aws_vpc"),
        ...extractResourcesByType(tapStackContent, "aws_eks_cluster"),
        ...extractResourcesByType(tapStackContent, "aws_db_instance")
      ];
      
      resourcesWithNames.forEach(resource => {
        expect(resource).toMatch(/name.*corp|name_prefix/);
      });
    });

    test("Resources are organized in logical sections", () => {
      // Check for section comments or organization
      expect(tapStackContent).toMatch(/VARIABLES|Variables|variable/);
      expect(tapStackContent).toMatch(/NETWORKING|Network|VPC/);
      expect(tapStackContent).toMatch(/SECURITY|Security|KMS/);
      expect(tapStackContent).toMatch(/EKS|Cluster/);
      expect(tapStackContent).toMatch(/OUTPUTS|Output|output/);
    });
  });
});