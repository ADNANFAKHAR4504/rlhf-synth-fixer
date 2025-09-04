// tests/security/terraform-security-tests.ts
// Security-focused tests for Terraform infrastructure
// Validates security policies and compliance requirements

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const TF_DIR = path.resolve(__dirname, "../lib");
const TIMEOUT = 300000; // 5 minutes

describe("Terraform Security Tests", () => {
  
  beforeAll(() => {
    process.chdir(TF_DIR);
    
    // Ensure terraform is initialized
    try {
      execSync("terraform init -backend=false", { 
        stdio: "pipe", 
        cwd: TF_DIR 
      });
    } catch (e) {
      // May already be initialized
    }
  });

  describe("Security Group Rules Validation", () => {
    
    test("public security groups only allow ports 22 and 80", () => {
      const planOutput = execSync("terraform plan -out=security-plan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const jsonOutput = execSync("terraform show -json security-plan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(jsonOutput);
      const securityGroups = plan.planned_values?.root_module?.resources?.filter(
        (r: any) => r.type === "aws_security_group" && r.name.includes("public")
      ) || [];
      
      securityGroups.forEach((sg: any) => {
        const ingressRules = sg.values.ingress || [];
        ingressRules.forEach((rule: any) => {
          const allowedPorts = [22, 80];
          expect(allowedPorts).toContain(rule.from_port);
          expect(allowedPorts).toContain(rule.to_port);
        });
      });
    }, TIMEOUT);

    test("database security group only allows access from backend", () => {
      const jsonOutput = execSync("terraform show -json security-plan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(jsonOutput);
      const dbSecurityGroups = plan.planned_values?.root_module?.resources?.filter(
        (r: any) => r.type === "aws_security_group" && r.name.includes("database")
      ) || [];
      
      dbSecurityGroups.forEach((sg: any) => {
        const ingressRules = sg.values.ingress || [];
        ingressRules.forEach((rule: any) => {
          // Should only allow from security groups, not CIDR blocks
          expect(rule.cidr_blocks || []).toHaveLength(0);
          expect(rule.security_groups || []).toContain("${aws_security_group.backend.id}");
        });
      });
    }, TIMEOUT);

    test("SSH access is restricted to specific CIDR", () => {
      const jsonOutput = execSync("terraform show -json security-plan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(jsonOutput);
      const securityGroups = plan.planned_values?.root_module?.resources?.filter(
        (r: any) => r.type === "aws_security_group"
      ) || [];
      
      securityGroups.forEach((sg: any) => {
        const ingressRules = sg.values.ingress || [];
        const sshRules = ingressRules.filter((rule: any) => rule.from_port === 22);
        
        sshRules.forEach((rule: any) => {
          // SSH should not be open to 0.0.0.0/0
          expect(rule.cidr_blocks).not.toContain("0.0.0.0/0");
          // Should use variable for allowed CIDR
          expect(rule.cidr_blocks).toContain("${var.allowed_ssh_cidr}");
        });
      });
    }, TIMEOUT);
  });

  describe("IAM Security Validation", () => {
    
    test("MFA policy is properly configured", () => {
      const jsonOutput = execSync("terraform show -json security-plan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(jsonOutput);
      const mfaPolicies = plan.planned_values?.root_module?.resources?.filter(
        (r: any) => r.type === "aws_iam_policy" && r.name.includes("mfa")
      ) || [];
      
      expect(mfaPolicies.length).toBeGreaterThan(0);
      
      mfaPolicies.forEach((policy: any) => {
        const policyDoc = JSON.parse(policy.values.policy);
        expect(policyDoc.Statement).toBeDefined();
        
        const denyStatement = policyDoc.Statement.find(
          (stmt: any) => stmt.Effect === "Deny"
        );
        expect(denyStatement).toBeDefined();
        expect(denyStatement.Condition).toBeDefined();
        expect(denyStatement.Condition.BoolIfExists).toHaveProperty("aws:MultiFactorAuthPresent");
      });
    }, TIMEOUT);

    test("EC2 IAM roles follow least privilege", () => {
      const jsonOutput = execSync("terraform show -json security-plan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(jsonOutput);
      const ec2Policies = plan.planned_values?.root_module?.resources?.filter(
        (r: any) => r.type === "aws_iam_policy" && r.name.includes("ec2")
      ) || [];
      
      ec2Policies.forEach((policy: any) => {
        const policyDoc = JSON.parse(policy.values.policy);
        
        // Should not have admin access
        policyDoc.Statement.forEach((stmt: any) => {
          expect(stmt.Action).not.toContain("*");
          expect(stmt.Resource).toBeDefined();
        });
      });
    }, TIMEOUT);

    test("Lambda execution role has minimal permissions", () => {
      const jsonOutput = execSync("terraform show -json security-plan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(jsonOutput);
      const lambdaPolicies = plan.planned_values?.root_module?.resources?.filter(
        (r: any) => r.type === "aws_iam_policy" && r.name.includes("lambda")
      ) || [];
      
      lambdaPolicies.forEach((policy: any) => {
        const policyDoc = JSON.parse(policy.values.policy);
        
        policyDoc.Statement.forEach((stmt: any) => {
          if (stmt.Effect === "Allow") {
            // Should only have specific EC2 and logs permissions
            const allowedActions = [
              "logs:CreateLogGroup",
              "logs:CreateLogStream", 
              "logs:PutLogEvents",
              "ec2:DescribeInstances",
              "ec2:StopInstances"
            ];
            
            if (Array.isArray(stmt.Action)) {
              stmt.Action.forEach((action: string) => {
                expect(allowedActions.some(allowed => 
                  action === allowed || action.startsWith(allowed.split(":")[0] + ":")
                )).toBe(true);
              });
            }
          }
        });
      });
    }, TIMEOUT);
  });

  describe("Encryption Validation", () => {
    
    test("all EBS volumes are encrypted", () => {
      const jsonOutput = execSync("terraform show -json security-plan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(jsonOutput);
      const ec2Instances = plan.planned_values?.root_module?.resources?.filter(
        (r: any) => r.type === "aws_instance"
      ) || [];
      
      ec2Instances.forEach((instance: any) => {
        const rootBlockDevice = instance.values.root_block_device?.[0];
        expect(rootBlockDevice?.encrypted).toBe(true);
      });
    }, TIMEOUT);

    test("RDS storage is encrypted", () => {
      const jsonOutput = execSync("terraform show -json security-plan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(jsonOutput);
      const rdsInstances = plan.planned_values?.root_module?.resources?.filter(
        (r: any) => r.type === "aws_db_instance"
      ) || [];
      
      rdsInstances.forEach((instance: any) => {
        expect(instance.values.storage_encrypted).toBe(true);
      });
    }, TIMEOUT);

    test("S3 backend uses encryption", () => {
      const providerContent = fs.readFileSync(
        path.join(TF_DIR, "provider.tf"), 
        "utf8"
      );
      
      expect(providerContent).toMatch(/encrypt\s*=\s*true/);
    }, TIMEOUT);
  });

  describe("Network Security", () => {
    
    test("private subnets route through NAT Gateway", () => {
      const jsonOutput = execSync("terraform show -json security-plan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(jsonOutput);
      const privateRouteTables = plan.planned_values?.root_module?.resources?.filter(
        (r: any) => r.type === "aws_route_table" && r.name.includes("private")
      ) || [];
      
      privateRouteTables.forEach((rt: any) => {
        const routes = rt.values.route || [];
        const defaultRoute = routes.find((route: any) => route.cidr_block === "0.0.0.0/0");
        
        expect(defaultRoute).toBeDefined();
        expect(defaultRoute.nat_gateway_id).toBeDefined();
        expect(defaultRoute.gateway_id).toBeUndefined();
      });
    }, TIMEOUT);

    test("public subnets route through Internet Gateway", () => {
      const jsonOutput = execSync("terraform show -json security-plan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(jsonOutput);
      const publicRouteTables = plan.planned_values?.root_module?.resources?.filter(
        (r: any) => r.type === "aws_route_table" && r.name.includes("public")
      ) || [];
      
      publicRouteTables.forEach((rt: any) => {
        const routes = rt.values.route || [];
        const defaultRoute = routes.find((route: any) => route.cidr_block === "0.0.0.0/0");
        
        expect(defaultRoute).toBeDefined();
        expect(defaultRoute.gateway_id).toBeDefined();
        expect(defaultRoute.nat_gateway_id).toBeUndefined();
      });
    }, TIMEOUT);

    test("database subnets are private", () => {
      const jsonOutput = execSync("terraform show -json security-plan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(jsonOutput);
      const dbSubnetGroups = plan.planned_values?.root_module?.resources?.filter(
        (r: any) => r.type === "aws_db_subnet_group"
      ) || [];
      
      const privateSubnets = plan.planned_values?.root_module?.resources?.filter(
        (r: any) => r.type === "aws_subnet" && r.name.includes("private")
      ) || [];
      
      dbSubnetGroups.forEach((dbsg: any) => {
        const subnetIds = dbsg.values.subnet_ids || [];
        // Should reference private subnets
        expect(subnetIds.some((id: string) => 
          id.includes("aws_subnet.private")
        )).toBe(true);
      });
    }, TIMEOUT);
  });

  describe("Compliance Requirements", () => {
    
    test("SNS subscriptions use HTTPS only", () => {
      const jsonOutput = execSync("terraform show -json security-plan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(jsonOutput);
      const snsSubscriptions = plan.planned_values?.root_module?.resources?.filter(
        (r: any) => r.type === "aws_sns_topic_subscription"
      ) || [];
      
      snsSubscriptions.forEach((sub: any) => {
        expect(sub.values.protocol).toBe("https");
        expect(sub.values.endpoint).toMatch(/^https:\/\//);
      });
    }, TIMEOUT);

    test("Lambda function has resource-based conditions", () => {
      const jsonOutput = execSync("terraform show -json security-plan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(jsonOutput);
      const lambdaPolicies = plan.planned_values?.root_module?.resources?.filter(
        (r: any) => r.type === "aws_iam_policy" && r.name.includes("lambda")
      ) || [];
      
      lambdaPolicies.forEach((policy: any) => {
        const policyDoc = JSON.parse(policy.values.policy);
        
        const ec2Statements = policyDoc.Statement.filter((stmt: any) => 
          stmt.Action?.some?.((action: string) => action.startsWith("ec2:"))
        );
        
        ec2Statements.forEach((stmt: any) => {
          expect(stmt.Condition).toBeDefined();
          expect(stmt.Condition.StringEquals).toBeDefined();
          expect(stmt.Condition.StringEquals["ec2:ResourceTag/Project"]).toBeDefined();
        });
      });
    }, TIMEOUT);

    test("production workspace has enhanced settings", () => {
      // Switch to production workspace
      try {
        execSync("terraform workspace new production", { 
          stdio: "pipe", 
          cwd: TF_DIR 
        });
      } catch (e) {
        execSync("terraform workspace select production", { 
          stdio: "pipe", 
          cwd: TF_DIR 
        });
      }
      
      const prodPlan = execSync("terraform plan -out=prod-plan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const jsonOutput = execSync("terraform show -json prod-plan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(jsonOutput);
      
      // Check for production-specific configurations
      const rdsInstances = plan.planned_values?.root_module?.resources?.filter(
        (r: any) => r.type === "aws_db_instance"
      ) || [];
      
      rdsInstances.forEach((rds: any) => {
        expect(rds.values.backup_retention_period).toBe(7);
        expect(rds.values.deletion_protection).toBe(true);
        expect(rds.values.performance_insights_enabled).toBe(true);
      });
      
      // Switch back to default
      execSync("terraform workspace select default", { 
        stdio: "pipe", 
        cwd: TF_DIR 
      });
    }, TIMEOUT);
  });

  afterAll(() => {
    // Clean up generated files
    const filesToClean = ["security-plan", "prod-plan"];
    filesToClean.forEach(file => {
      const filePath = path.join(TF_DIR, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  });
});
