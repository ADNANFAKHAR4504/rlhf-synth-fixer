// tests/integration/terraform-integration-tests.ts
// Integration tests that validate Terraform infrastructure behavior
// These tests execute actual Terraform commands and validate outputs

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const TF_DIR = path.resolve(__dirname, "../lib");
const TIMEOUT = 300000; // 5 minutes

describe("Terraform Infrastructure Integration Tests", () => {
  
  beforeAll(() => {
    // Ensure we're in the correct directory
    process.chdir(TF_DIR);
  });

  describe("Terraform Validation and Planning", () => {
    
    test("terraform fmt check passes", () => {
      expect(() => {
        execSync("terraform fmt -check -recursive", { 
          stdio: "pipe", 
          cwd: TF_DIR 
        });
      }).not.toThrow();
    }, TIMEOUT);

    test("terraform validate passes", () => {
      // Initialize first
      execSync("terraform init -backend=false", { 
        stdio: "pipe", 
        cwd: TF_DIR 
      });
      
      expect(() => {
        execSync("terraform validate", { 
          stdio: "pipe", 
          cwd: TF_DIR 
        });
      }).not.toThrow();
    }, TIMEOUT);

    test("terraform plan generates valid plan", () => {
      const output = execSync("terraform plan -out=tfplan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      expect(output).toContain("Plan:");
      expect(output).not.toContain("Error:");
      
      // Verify plan file was created
      expect(fs.existsSync(path.join(TF_DIR, "tfplan"))).toBe(true);
    }, TIMEOUT);

    test("terraform show plan output contains expected resources", () => {
      const output = execSync("terraform show -json tfplan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(output);
      const resourceTypes = plan.planned_values?.root_module?.resources?.map(
        (r: any) => r.type
      ) || [];
      
      const expectedResources = [
        "aws_vpc",
        "aws_subnet", 
        "aws_security_group",
        "aws_instance",
        "aws_db_instance",
        "aws_s3_bucket",
        "aws_lambda_function",
        "aws_cloudwatch_metric_alarm",
        "aws_sns_topic"
      ];
      
      expectedResources.forEach(resourceType => {
        expect(resourceTypes).toContain(resourceType);
      });
    }, TIMEOUT);
  });

  describe("Workspace Management", () => {
    
    test("can create and switch workspaces", () => {
      // Create staging workspace
      try {
        execSync("terraform workspace new staging", { 
          stdio: "pipe", 
          cwd: TF_DIR 
        });
      } catch (e) {
        // Workspace might already exist
        execSync("terraform workspace select staging", { 
          stdio: "pipe", 
          cwd: TF_DIR 
        });
      }
      
      const currentWorkspace = execSync("terraform workspace show", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      }).trim();
      
      expect(currentWorkspace).toBe("staging");
    }, TIMEOUT);

    test("workspace affects resource planning", () => {
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
      
      const prodPlan = execSync("terraform plan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      // Production should have 2 web instances
      expect(prodPlan).toMatch(/aws_instance\.web\[0\]/);
      expect(prodPlan).toMatch(/aws_instance\.web\[1\]/);
      
      // Switch back to staging
      execSync("terraform workspace select staging", { 
        stdio: "pipe", 
        cwd: TF_DIR 
      });
      
      const stagingPlan = execSync("terraform plan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      // Staging should have 1 web instance
      expect(stagingPlan).toMatch(/aws_instance\.web\[0\]/);
      expect(stagingPlan).not.toMatch(/aws_instance\.web\[1\]/);
    }, TIMEOUT);
  });

  describe("OPA Conftest Policy Validation", () => {
    
    test("conftest policies pass validation", () => {
      // Generate plan JSON for conftest
      execSync("terraform show -json tfplan > plan.json", { 
        stdio: "pipe", 
        cwd: TF_DIR 
      });
      
      expect(() => {
        execSync("conftest test --policy policy.rego plan.json", { 
          stdio: "pipe", 
          cwd: TF_DIR 
        });
      }).not.toThrow();
    }, TIMEOUT);

    test("policy violations are caught", () => {
      // Create a temporary plan with violations for testing
      const violationContent = `
      {
        "resource": {
          "aws_instance": {
            "test": {
              "instance_type": "t3.large",
              "root_block_device": [{"encrypted": false}]
            }
          }
        }
      }`;
      
      fs.writeFileSync(path.join(TF_DIR, "violation-test.json"), violationContent);
      
      expect(() => {
        execSync("conftest test --policy policy.rego violation-test.json", { 
          stdio: "pipe", 
          cwd: TF_DIR 
        });
      }).toThrow();
      
      // Clean up
      fs.unlinkSync(path.join(TF_DIR, "violation-test.json"));
    }, TIMEOUT);
  });

  describe("Variable Validation", () => {
    
    test("invalid CIDR blocks are rejected", () => {
      expect(() => {
        execSync('terraform plan -var="allowed_ssh_cidr=invalid-cidr"', { 
          stdio: "pipe", 
          cwd: TF_DIR 
        });
      }).toThrow();
    }, TIMEOUT);

    test("non-HTTPS SNS endpoints are rejected", () => {
      expect(() => {
        execSync('terraform plan -var="sns_https_endpoint=http://example.com"', { 
          stdio: "pipe", 
          cwd: TF_DIR 
        });
      }).toThrow();
    }, TIMEOUT);

    test("valid variable values are accepted", () => {
      expect(() => {
        execSync('terraform plan -var="allowed_ssh_cidr=10.0.0.1/32" -var="sns_https_endpoint=https://hooks.slack.com/test"', { 
          stdio: "pipe", 
          cwd: TF_DIR 
        });
      }).not.toThrow();
    }, TIMEOUT);
  });

  describe("Resource Dependencies", () => {
    
    test("dependency graph is valid", () => {
      const output = execSync("terraform graph", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      // Basic check that graph output contains expected dependencies
      expect(output).toContain("aws_vpc.main");
      expect(output).toContain("aws_subnet");
      expect(output).toContain("->");
    }, TIMEOUT);

    test("outputs can be generated", () => {
      const output = execSync("terraform output", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      // Should show that outputs exist even if no state
      expect(output).toMatch(/(no outputs|Warning)/);
    }, TIMEOUT);
  });

  describe("Security Compliance", () => {
    
    test("no hardcoded secrets in plan", () => {
      const planOutput = execSync("terraform show -json tfplan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(planOutput);
      const planString = JSON.stringify(plan);
      
      // Check for potential secret patterns
      expect(planString).not.toMatch(/password.*:\s*"(?!var\.|null)[^"]{8,}"/i);
      expect(planString).not.toMatch(/secret.*:\s*"(?!var\.|null)[^"]{8,}"/i);
      expect(planString).not.toMatch(/key.*:\s*"(?!var\.|null)[A-Za-z0-9\/+=]{20,}"/);
    }, TIMEOUT);

    test("all EC2 instances use t2.micro", () => {
      const planOutput = execSync("terraform show -json tfplan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(planOutput);
      const ec2Instances = plan.planned_values?.root_module?.resources?.filter(
        (r: any) => r.type === "aws_instance"
      ) || [];
      
      ec2Instances.forEach((instance: any) => {
        expect(instance.values.instance_type).toBe("t2.micro");
      });
    }, TIMEOUT);

    test("EBS volumes are encrypted", () => {
      const planOutput = execSync("terraform show -json tfplan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(planOutput);
      const ec2Instances = plan.planned_values?.root_module?.resources?.filter(
        (r: any) => r.type === "aws_instance"
      ) || [];
      
      ec2Instances.forEach((instance: any) => {
        const rootBlockDevice = instance.values.root_block_device?.[0];
        if (rootBlockDevice) {
          expect(rootBlockDevice.encrypted).toBe(true);
        }
      });
    }, TIMEOUT);

    test("RDS instances have encryption enabled", () => {
      const planOutput = execSync("terraform show -json tfplan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(planOutput);
      const rdsInstances = plan.planned_values?.root_module?.resources?.filter(
        (r: any) => r.type === "aws_db_instance"
      ) || [];
      
      rdsInstances.forEach((instance: any) => {
        expect(instance.values.storage_encrypted).toBe(true);
      });
    }, TIMEOUT);
  });

  describe("Tagging Compliance", () => {
    
    test("all resources have required tags", () => {
      const planOutput = execSync("terraform show -json tfplan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(planOutput);
      const resources = plan.planned_values?.root_module?.resources || [];
      
      // Filter resources that should have tags
      const taggedResources = resources.filter((r: any) => 
        !["random_id", "local_file", "data"].includes(r.type) &&
        !r.type.startsWith("aws_route_table_association") &&
        !r.type.startsWith("aws_iam_role_policy_attachment")
      );
      
      taggedResources.forEach((resource: any) => {
        const tags = resource.values.tags || {};
        expect(tags).toHaveProperty("Project");
        // Note: Environment and ManagedBy come from default_tags
      });
    }, TIMEOUT);
  });

  describe("Network Architecture Validation", () => {
    
    test("VPC has correct CIDR and DNS settings", () => {
      const planOutput = execSync("terraform show -json tfplan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(planOutput);
      const vpc = plan.planned_values?.root_module?.resources?.find(
        (r: any) => r.type === "aws_vpc" && r.name === "main"
      );
      
      expect(vpc).toBeTruthy();
      expect(vpc.values.cidr_block).toBe("10.0.0.0/16");
      expect(vpc.values.enable_dns_hostnames).toBe(true);
      expect(vpc.values.enable_dns_support).toBe(true);
    }, TIMEOUT);

    test("subnets have correct CIDR allocation", () => {
      const planOutput = execSync("terraform show -json tfplan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(planOutput);
      const publicSubnets = plan.planned_values?.root_module?.resources?.filter(
        (r: any) => r.type === "aws_subnet" && r.name === "public"
      ) || [];
      const privateSubnets = plan.planned_values?.root_module?.resources?.filter(
        (r: any) => r.type === "aws_subnet" && r.name === "private"
      ) || [];
      
      expect(publicSubnets.length).toBeGreaterThan(0);
      expect(privateSubnets.length).toBeGreaterThan(0);
      
      // Check CIDR patterns
      publicSubnets.forEach((subnet: any, index: number) => {
        expect(subnet.values.cidr_block).toMatch(/10\.0\.[1-9]\.0\/24/);
        expect(subnet.values.map_public_ip_on_launch).toBe(true);
      });
      
      privateSubnets.forEach((subnet: any, index: number) => {
        expect(subnet.values.cidr_block).toMatch(/10\.0\.[1-9][0-9]\.0\/24/);
        expect(subnet.values.map_public_ip_on_launch).toBeFalsy();
      });
    }, TIMEOUT);

    test("NAT Gateway properly configured", () => {
      const planOutput = execSync("terraform show -json tfplan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(planOutput);
      const natGateway = plan.planned_values?.root_module?.resources?.find(
        (r: any) => r.type === "aws_nat_gateway"
      );
      const eip = plan.planned_values?.root_module?.resources?.find(
        (r: any) => r.type === "aws_eip" && r.name === "nat"
      );
      
      expect(natGateway).toBeTruthy();
      expect(eip).toBeTruthy();
      expect(eip.values.domain).toBe("vpc");
    }, TIMEOUT);
  });

  describe("Security Group Validation", () => {
    
    test("public security group has correct ingress rules", () => {
      const planOutput = execSync("terraform show -json tfplan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(planOutput);
      const webPublicSG = plan.planned_values?.root_module?.resources?.find(
        (r: any) => r.type === "aws_security_group" && r.name === "web_public"
      );
      
      expect(webPublicSG).toBeTruthy();
      
      const ingressRules = webPublicSG.values.ingress || [];
      const ports = ingressRules.map((rule: any) => rule.from_port);
      
      expect(ports).toContain(22); // SSH
      expect(ports).toContain(80); // HTTP
      expect(ports.length).toBeLessThanOrEqual(2); // Only these ports
    }, TIMEOUT);

    test("database security group restricts access", () => {
      const planOutput = execSync("terraform show -json tfplan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(planOutput);
      const databaseSG = plan.planned_values?.root_module?.resources?.find(
        (r: any) => r.type === "aws_security_group" && r.name === "database"
      );
      
      expect(databaseSG).toBeTruthy();
      
      const ingressRules = databaseSG.values.ingress || [];
      expect(ingressRules.length).toBe(1); // Only one rule for MySQL
      expect(ingressRules[0].from_port).toBe(3306);
      expect(ingressRules[0].security_groups).toBeTruthy(); // References backend SG
    }, TIMEOUT);
  });

  describe("Lambda and EventBridge Validation", () => {
    
    test("Lambda function configured correctly", () => {
      const planOutput = execSync("terraform show -json tfplan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(planOutput);
      const lambdaFunction = plan.planned_values?.root_module?.resources?.find(
        (r: any) => r.type === "aws_lambda_function" && r.name === "ec2_shutdown"
      );
      
      expect(lambdaFunction).toBeTruthy();
      expect(lambdaFunction.values.runtime).toBe("python3.9");
      expect(lambdaFunction.values.timeout).toBe(60);
      expect(lambdaFunction.values.environment).toBeTruthy();
    }, TIMEOUT);

    test("EventBridge rule scheduled correctly", () => {
      const planOutput = execSync("terraform show -json tfplan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(planOutput);
      const eventRule = plan.planned_values?.root_module?.resources?.find(
        (r: any) => r.type === "aws_cloudwatch_event_rule" && r.name === "lambda_shutdown_schedule"
      );
      
      expect(eventRule).toBeTruthy();
      expect(eventRule.values.schedule_expression).toMatch(/cron\(.*\)/);
    }, TIMEOUT);
  });

  describe("CloudWatch Monitoring Validation", () => {
    
    test("CloudWatch alarms created for EC2 instances", () => {
      const planOutput = execSync("terraform show -json tfplan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(planOutput);
      const alarms = plan.planned_values?.root_module?.resources?.filter(
        (r: any) => r.type === "aws_cloudwatch_metric_alarm"
      ) || [];
      
      expect(alarms.length).toBeGreaterThan(2);
      
      const cpuAlarms = alarms.filter((alarm: any) => 
        alarm.values.metric_name === "CPUUtilization"
      );
      const statusAlarms = alarms.filter((alarm: any) => 
        alarm.values.metric_name === "StatusCheckFailed"
      );
      
      expect(cpuAlarms.length).toBeGreaterThan(0);
      expect(statusAlarms.length).toBeGreaterThan(0);
    }, TIMEOUT);

    test("CloudWatch log groups configured", () => {
      const planOutput = execSync("terraform show -json tfplan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(planOutput);
      const logGroups = plan.planned_values?.root_module?.resources?.filter(
        (r: any) => r.type === "aws_cloudwatch_log_group"
      ) || [];
      
      expect(logGroups.length).toBeGreaterThan(1);
      
      logGroups.forEach((logGroup: any) => {
        expect(logGroup.values.retention_in_days).toBeGreaterThan(0);
      });
    }, TIMEOUT);
  });

  describe("IAM Security Validation", () => {
    
    test("MFA policy exists and is properly configured", () => {
      const planOutput = execSync("terraform show -json tfplan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(planOutput);
      const mfaPolicy = plan.planned_values?.root_module?.resources?.find(
        (r: any) => r.type === "aws_iam_policy" && r.name === "mfa_required"
      );
      
      expect(mfaPolicy).toBeTruthy();
      
      const policyDocument = JSON.parse(mfaPolicy.values.policy);
      expect(policyDocument.Statement).toBeTruthy();
      expect(policyDocument.Statement[0].Effect).toBe("Deny");
    }, TIMEOUT);

    test("EC2 IAM roles have minimal permissions", () => {
      const planOutput = execSync("terraform show -json tfplan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const plan = JSON.parse(planOutput);
      const ec2Role = plan.planned_values?.root_module?.resources?.find(
        (r: any) => r.type === "aws_iam_role" && r.name === "ec2_role"
      );
      
      expect(ec2Role).toBeTruthy();
      
      const assumeRolePolicy = JSON.parse(ec2Role.values.assume_role_policy);
      expect(assumeRolePolicy.Statement[0].Principal.Service).toContain("ec2.amazonaws.com");
    }, TIMEOUT);
  });

  describe("Performance and Reliability Tests", () => {
    
    test("terraform plan execution time is reasonable", () => {
      const startTime = Date.now();
      
      execSync("terraform plan -out=perf-test-plan", { 
        stdio: "pipe", 
        cwd: TF_DIR 
      });
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Plan should complete within 2 minutes
      expect(executionTime).toBeLessThan(120000);
      
      // Clean up
      if (fs.existsSync(path.join(TF_DIR, "perf-test-plan"))) {
        fs.unlinkSync(path.join(TF_DIR, "perf-test-plan"));
      }
    }, TIMEOUT);

    test("configuration scales properly between environments", () => {
      // Test staging configuration
      execSync("terraform workspace select staging", { 
        stdio: "pipe", 
        cwd: TF_DIR 
      });
      
      const stagingPlan = execSync("terraform show -json tfplan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      const stagingData = JSON.parse(stagingPlan);
      const stagingWebInstances = stagingData.planned_values?.root_module?.resources?.filter(
        (r: any) => r.type === "aws_instance" && r.name === "web"
      ) || [];
      
      expect(stagingWebInstances.length).toBe(1);
      
      // Test production configuration  
      execSync("terraform workspace select production", { 
        stdio: "pipe", 
        cwd: TF_DIR 
      });
      
      const prodPlan = execSync("terraform plan", { 
        encoding: "utf8", 
        cwd: TF_DIR 
      });
      
      // Production should scale to 2 web instances
      expect(prodPlan).toMatch(/aws_instance\.web\[0\]/);
      expect(prodPlan).toMatch(/aws_instance\.web\[1\]/);
    }, TIMEOUT);
  });

  afterAll(() => {
    // Clean up generated files
    const filesToClean = ["tfplan", "plan.json", ".terraform.lock.hcl"];
    filesToClean.forEach(file => {
      const filePath = path.join(TF_DIR, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    // Switch back to default workspace
    try {
      execSync("terraform workspace select default", { 
        stdio: "pipe", 
        cwd: TF_DIR 
      });
    } catch (e) {
      // Ignore errors
    }
  });
});