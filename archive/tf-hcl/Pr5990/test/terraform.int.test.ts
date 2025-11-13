// Integration tests for E-Commerce Product Catalog API Infrastructure
// These tests validate the deployed Terraform infrastructure

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const OUTPUTS_FILE = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");

describe("Terraform Infrastructure Integration Tests", () => {
  let outputs: any;

  beforeAll(() => {
    // Load deployment outputs
    if (fs.existsSync(OUTPUTS_FILE)) {
      const content = fs.readFileSync(OUTPUTS_FILE, "utf8");
      outputs = JSON.parse(content);
    } else {
      console.warn(`Outputs file not found: ${OUTPUTS_FILE}`);
      outputs = {};
    }
  });

  describe("Deployment Outputs", () => {
    test("alb_dns_name output exists", () => {
      expect(outputs).toHaveProperty("alb_dns_name");
      expect(outputs.alb_dns_name).toBeTruthy();
    });

    test("autoscaling_group_name output exists", () => {
      expect(outputs).toHaveProperty("autoscaling_group_name");
      expect(outputs.autoscaling_group_name).toBeTruthy();
    });

    test("vpc_id output exists", () => {
      expect(outputs).toHaveProperty("vpc_id");
      expect(outputs.vpc_id).toMatch(/^vpc-/);
    });

    test("nat_gateway_ip output exists", () => {
      expect(outputs).toHaveProperty("nat_gateway_ip");
      // Validate IP address format
      expect(outputs.nat_gateway_ip).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
    });
  });

  describe("VPC Resources", () => {
    test("VPC exists and is accessible", () => {
      if (!outputs.vpc_id) {
        console.warn("Skipping test - vpc_id not found in outputs");
        return;
      }

      const result = execSync(
        `aws ec2 describe-vpcs --vpc-ids ${outputs.vpc_id} --query 'Vpcs[0].State' --output text`,
        { encoding: "utf8" }
      );
      expect(result.trim()).toBe("available");
    });

    test("Public subnets exist", () => {
      expect(outputs).toHaveProperty("public_subnet_ids");
      const subnetIds = JSON.parse(outputs.public_subnet_ids || "[]");
      expect(subnetIds.length).toBe(2);
    });

    test("Private subnets exist", () => {
      expect(outputs).toHaveProperty("private_subnet_ids");
      const subnetIds = JSON.parse(outputs.private_subnet_ids || "[]");
      expect(subnetIds.length).toBe(2);
    });
  });

  describe("Application Load Balancer", () => {
    test("ALB is active", () => {
      if (!outputs.alb_arn) {
        console.warn("Skipping test - alb_arn not found in outputs");
        return;
      }

      const result = execSync(
        `aws elbv2 describe-load-balancers --load-balancer-arns ${outputs.alb_arn} --query 'LoadBalancers[0].State.Code' --output text`,
        { encoding: "utf8" }
      );
      expect(result.trim()).toBe("active");
    });

    test("ALB has HTTP listener", () => {
      if (!outputs.alb_arn) {
        console.warn("Skipping test - alb_arn not found in outputs");
        return;
      }

      const result = execSync(
        `aws elbv2 describe-listeners --load-balancer-arn ${outputs.alb_arn} --query 'Listeners[?Port==\`80\`].Protocol' --output text`,
        { encoding: "utf8" }
      );
      expect(result.trim()).toBe("HTTP");
    });
  });

  describe("Auto Scaling Group", () => {
    test("ASG exists with correct min/max size", () => {
      if (!outputs.autoscaling_group_name) {
        console.warn("Skipping test - autoscaling_group_name not found in outputs");
        return;
      }

      const result = execSync(
        `aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names ${outputs.autoscaling_group_name} --query 'AutoScalingGroups[0].[MinSize,MaxSize]' --output json`,
        { encoding: "utf8" }
      );
      const [minSize, maxSize] = JSON.parse(result);
      expect(minSize).toBe(2);
      expect(maxSize).toBe(10);
    });

    test("ASG has target group attached", () => {
      if (!outputs.autoscaling_group_name) {
        console.warn("Skipping test - autoscaling_group_name not found in outputs");
        return;
      }

      const result = execSync(
        `aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names ${outputs.autoscaling_group_name} --query 'AutoScalingGroups[0].TargetGroupARNs' --output json`,
        { encoding: "utf8" }
      );
      const targetGroups = JSON.parse(result);
      expect(targetGroups.length).toBeGreaterThan(0);
    });
  });

  describe("Security Groups", () => {
    test("ALB security group allows HTTP", () => {
      if (!outputs.security_group_alb_id) {
        console.warn("Skipping test - security_group_alb_id not found in outputs");
        return;
      }

      const result = execSync(
        `aws ec2 describe-security-groups --group-ids ${outputs.security_group_alb_id} --query 'SecurityGroups[0].IpPermissions[?FromPort==\`80\`].FromPort' --output text`,
        { encoding: "utf8" }
      );
      expect(result.trim()).toBe("80");
    });

    test("EC2 security group allows traffic from ALB", () => {
      if (!outputs.security_group_ec2_id) {
        console.warn("Skipping test - security_group_ec2_id not found in outputs");
        return;
      }

      const result = execSync(
        `aws ec2 describe-security-groups --group-ids ${outputs.security_group_ec2_id} --query 'SecurityGroups[0].IpPermissions' --output json`,
        { encoding: "utf8" }
      );
      const permissions = JSON.parse(result);
      const hasIngressFrom80 = permissions.some((p: any) => p.FromPort === 80);
      expect(hasIngressFrom80).toBe(true);
    });
  });

  describe("CloudWatch Alarms", () => {
    test("High CPU alarm exists", () => {
      const result = execSync(
        `aws cloudwatch describe-alarms --alarm-name-prefix "high-cpu" --query 'MetricAlarms[?contains(AlarmName, \`synth\`)].AlarmName' --output json`,
        { encoding: "utf8" }
      );
      const alarms = JSON.parse(result);
      expect(alarms.length).toBeGreaterThan(0);
    });

    test("Low CPU alarm exists", () => {
      const result = execSync(
        `aws cloudwatch describe-alarms --alarm-name-prefix "low-cpu" --query 'MetricAlarms[?contains(AlarmName, \`synth\`)].AlarmName' --output json`,
        { encoding: "utf8" }
      );
      const alarms = JSON.parse(result);
      expect(alarms.length).toBeGreaterThan(0);
    });
  });
});
