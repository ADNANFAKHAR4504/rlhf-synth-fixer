import { test, expect } from "@jest/globals";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

test("Terraform integration test", () => {
  // Initialize Terraform
  execSync("terraform init", { cwd: "lib" });
  
  // Validate the Terraform configuration (doesn't require AWS credentials)
  const validateOutput = execSync("terraform validate", { cwd: "lib" }).toString();
  expect(validateOutput).toMatch(/Success.*configuration is valid/i);
  
  // Check that terraform fmt doesn't find any formatting issues
  try {
    const fmtOutput = execSync("terraform fmt -check", { cwd: "lib" }).toString();
    expect(fmtOutput).toBe(""); // Empty output means no formatting issues
  } catch (error) {
    // If terraform fmt -check finds issues, it exits with code 3
    // We can run terraform fmt to see what would be changed
    const fmtDiff = execSync("terraform fmt -check -diff", { cwd: "lib", encoding: "utf8" });
    throw new Error(`Terraform formatting issues found:\n${fmtDiff}`);
  }
  
  // Verify the configuration files exist and contain expected resources
  const stackContent = fs.readFileSync(path.join(process.cwd(), "lib/tap_stack.tf"), "utf8");
  const providerContent = fs.readFileSync(path.join(process.cwd(), "lib/provider.tf"), "utf8");
  
  expect(stackContent).toContain('resource "aws_vpc" "main"');
  expect(stackContent).toContain('resource "aws_subnet" "public"');
  expect(stackContent).toContain('resource "aws_internet_gateway" "gw"');
  expect(stackContent).toContain('resource "aws_route_table" "public"');
  expect(providerContent).toContain('provider "aws"');
  expect(providerContent).toContain('terraform {');
});