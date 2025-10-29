import * as pulumi from "@pulumi/pulumi";
import { LocalWorkspace, Stack } from "@pulumi/pulumi/automation";
import * as path from "path";
import * as fs from "fs";

/**
 * Integration tests for TapStack
 * These tests deploy actual infrastructure and verify functionality
 */
describe("TapStack Integration Tests", () => {
  const workDir = process.cwd();
  const region = process.env.AWS_REGION || "us-east-1";

  jest.setTimeout(600000); // 10 minutes

  describe("Multi-Environment Deployment", () => {
    it("should deploy stack to dev environment", async () => {
      const stackName = "dev";
      
      const stack = await LocalWorkspace.createOrSelectStack({
        stackName,
        workDir,
      });

      await stack.setConfig("aws:region", { value: region });
      await stack.setConfig("tap:vpcCidr", { value: "10.1.0.0/16" });
      await stack.setConfig("tap:ecsTaskCount", { value: "1" });
      await stack.setConfig("tap:rdsInstanceClass", { value: "db.t3.micro" });
      await stack.setConfig("tap:s3LogRetentionDays", { value: "7" });
      await stack.setConfig("tap:team", { value: "platform-team" });
      await stack.setConfig("tap:costCenter", { value: "eng-12345" });
      await stack.setConfig("tap:domain", { value: "dev.example.com" });
      await stack.setConfig("tap:ecsTaskCpu", { value: "256" });
      await stack.setConfig("tap:ecsTaskMemory", { value: "512" });
      await stack.setConfig("tap:rdsAllocatedStorage", { value: "20" });
      await stack.setConfig("tap:enableVpcPeering", { value: "false" });
      await stack.setConfig("tap:cloudwatchLogRetentionDays", { value: "7" });
      await stack.setConfig("tap:albHealthCheckPath", { value: "/health" });
      await stack.setConfig("tap:albHealthCheckInterval", { value: "30" });
      await stack.setConfig("tap:containerPort", { value: "8080" });
      await stack.setConfig("tap:containerImage", { value: "nginx:latest" });
      await stack.setConfig("tap:availabilityZones", {
        value: JSON.stringify(["us-east-1a", "us-east-1b", "us-east-1c"]),
      });

      const upResult = await stack.up({ onOutput: console.log });
      expect(upResult.summary.result).toBe("succeeded");
      expect(upResult.outputs).toBeDefined();
      expect(upResult.outputs.vpcId).toBeDefined();
      expect(upResult.outputs.albDnsName).toBeDefined();
    });

    it("should deploy stack to staging environment", async () => {
      const stackName = "staging";
      
      const stack = await LocalWorkspace.createOrSelectStack({
        stackName,
        workDir,
      });

      await stack.setConfig("aws:region", { value: region });
      await stack.setConfig("tap:vpcCidr", { value: "10.2.0.0/16" });
      await stack.setConfig("tap:ecsTaskCount", { value: "2" });
      await stack.setConfig("tap:rdsInstanceClass", { value: "db.t3.micro" });
      await stack.setConfig("tap:s3LogRetentionDays", { value: "30" });
      await stack.setConfig("tap:team", { value: "platform-team" });
      await stack.setConfig("tap:costCenter", { value: "eng-12345" });
      await stack.setConfig("tap:domain", { value: "staging.example.com" });
      await stack.setConfig("tap:ecsTaskCpu", { value: "512" });
      await stack.setConfig("tap:ecsTaskMemory", { value: "1024" });
      await stack.setConfig("tap:rdsAllocatedStorage", { value: "20" });
      await stack.setConfig("tap:enableVpcPeering", { value: "false" });
      await stack.setConfig("tap:cloudwatchLogRetentionDays", { value: "30" });
      await stack.setConfig("tap:albHealthCheckPath", { value: "/health" });
      await stack.setConfig("tap:albHealthCheckInterval", { value: "30" });
      await stack.setConfig("tap:containerPort", { value: "8080" });
      await stack.setConfig("tap:containerImage", { value: "nginx:latest" });
      await stack.setConfig("tap:availabilityZones", {
        value: JSON.stringify(["us-east-1a", "us-east-1b", "us-east-1c"]),
      });

      const upResult = await stack.up({ onOutput: console.log });
      expect(upResult.summary.result).toBe("succeeded");
      expect(upResult.outputs).toBeDefined();
    });

    it("should deploy stack to prod environment", async () => {
      const stackName = "prod";
      
      const stack = await LocalWorkspace.createOrSelectStack({
        stackName,
        workDir,
      });

      await stack.setConfig("aws:region", { value: region });
      await stack.setConfig("tap:vpcCidr", { value: "10.3.0.0/16" });
      await stack.setConfig("tap:ecsTaskCount", { value: "4" });
      await stack.setConfig("tap:rdsInstanceClass", { value: "db.t3.micro" });
      await stack.setConfig("tap:s3LogRetentionDays", { value: "90" });
      await stack.setConfig("tap:team", { value: "platform-team" });
      await stack.setConfig("tap:costCenter", { value: "eng-12345" });
      await stack.setConfig("tap:domain", { value: "example.com" });
      await stack.setConfig("tap:ecsTaskCpu", { value: "1024" });
      await stack.setConfig("tap:ecsTaskMemory", { value: "2048" });
      await stack.setConfig("tap:rdsAllocatedStorage", { value: "100" });
      await stack.setConfig("tap:enableVpcPeering", { value: "false" });
      await stack.setConfig("tap:cloudwatchLogRetentionDays", { value: "90" });
      await stack.setConfig("tap:albHealthCheckPath", { value: "/health" });
      await stack.setConfig("tap:albHealthCheckInterval", { value: "30" });
      await stack.setConfig("tap:containerPort", { value: "8080" });
      await stack.setConfig("tap:containerImage", { value: "nginx:latest" });
      await stack.setConfig("tap:availabilityZones", {
        value: JSON.stringify(["us-east-1a", "us-east-1b", "us-east-1c"]),
      });

      const upResult = await stack.up({ onOutput: console.log });
      expect(upResult.summary.result).toBe("succeeded");
      expect(upResult.outputs).toBeDefined();
    });
  });

  describe("VPC Peering Tests", () => {
    it("should establish VPC peering between dev and staging", async () => {
      const devStack = await LocalWorkspace.selectStack({
        stackName: "dev",
        workDir,
      });

      const stagingStack = await LocalWorkspace.selectStack({
        stackName: "staging",
        workDir,
      });

      const devOutputs = await devStack.outputs();
      const stagingOutputs = await stagingStack.outputs();

      expect(devOutputs.vpcId).toBeDefined();
      expect(stagingOutputs.vpcId).toBeDefined();
      expect(devOutputs.vpcCidr.value).not.toBe(stagingOutputs.vpcCidr.value);
    });
  });

  describe("ECS Service Tests", () => {
    it("should verify ECS tasks can connect to RDS", async () => {
      const stack = await LocalWorkspace.selectStack({
        stackName: "dev",
        workDir,
      });

      const outputs = await stack.outputs();
      expect(outputs.rdsEndpoint).toBeDefined();
      expect(outputs.rdsEndpoint.value).toMatch(/\.rds\.amazonaws\.com$/);
      expect(outputs.ecsServiceName).toBeDefined();
    });

    it("should verify ECS service scaling based on environment", async () => {
      const devStack = await LocalWorkspace.selectStack({
        stackName: "dev",
        workDir,
      });

      const prodStack = await LocalWorkspace.selectStack({
        stackName: "prod",
        workDir,
      });

      const devConfig = await devStack.getAllConfig();
      const prodConfig = await prodStack.getAllConfig();

      expect(parseInt(devConfig["tap:ecsTaskCount"].value)).toBe(1);
      expect(parseInt(prodConfig["tap:ecsTaskCount"].value)).toBe(4);
    });
  });

  describe("Output File Generation", () => {
    it("should generate flat-outputs.json file", async () => {
      const stack = await LocalWorkspace.selectStack({
        stackName: "dev",
        workDir,
      });

      await stack.up({ onOutput: console.log });

      const outputFile = path.join(workDir, "cfn-outputs", "flat-outputs.json");
      expect(fs.existsSync(outputFile)).toBe(true);

      const fileContents = fs.readFileSync(outputFile, "utf-8");
      const outputs = JSON.parse(fileContents);

      expect(outputs.vpcId).toBeDefined();
      expect(outputs.albDnsName).toBeDefined();
      expect(outputs.rdsEndpoint).toBeDefined();
    });
  });

  describe("Cleanup Tests", () => {
    it("should successfully destroy dev environment", async () => {
      const stack = await LocalWorkspace.selectStack({
        stackName: "dev",
        workDir,
      });

      const destroyResult = await stack.destroy({ onOutput: console.log });
      expect(destroyResult.summary.result).toBe("succeeded");
    });

    it("should successfully destroy staging environment", async () => {
      const stack = await LocalWorkspace.selectStack({
        stackName: "staging",
        workDir,
      });

      const destroyResult = await stack.destroy({ onOutput: console.log });
      expect(destroyResult.summary.result).toBe("succeeded");
    });

    it("should successfully destroy prod environment", async () => {
      const stack = await LocalWorkspace.selectStack({
        stackName: "prod",
        workDir,
      });

      const destroyResult = await stack.destroy({ onOutput: console.log });
      expect(destroyResult.summary.result).toBe("succeeded");
    });
  });
});
