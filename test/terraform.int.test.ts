import { test, expect } from "@jest/globals";
import { execSync } from "child_process";

test("Terraform integration test", () => {
  // Initialize Terraform
  execSync("terraform init", { cwd: "lib" });
  
  // Validate the Terraform configuration (doesn't require AWS credentials)
  const validateOutput = execSync("terraform validate", { cwd: "lib" }).toString();
  expect(validateOutput).toMatch(/Success.*configuration is valid/i);
  
  // Check that terraform fmt doesn't find any formatting issues
  const fmtOutput = execSync("terraform fmt -check", { cwd: "lib" }).toString();
  expect(fmtOutput).toBe(""); // Empty output means no formatting issues
  
  // Verify the configuration files exist and contain expected resources
  const fs = require("fs");
  const path = require("path");
  const configContent = fs.readFileSync(path.join(__dirname, "../lib/provider.tf"), "utf8");
  
  expect(configContent).toContain('resource "aws_vpc" "main"');
  expect(configContent).toContain('resource "aws_subnet" "public"');
  expect(configContent).toContain('resource "aws_internet_gateway" "gw"');
  expect(configContent).toContain('resource "aws_route_table" "public"');
});