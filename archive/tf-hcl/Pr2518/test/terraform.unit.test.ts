import { describe, test, expect } from "@jest/globals";
import { parseToObject } from "hcl2-parser";
import * as fs from "fs";
import * as path from "path";

test("VPC CIDR block validation", () => {
  const terraformContent = fs.readFileSync(path.join(__dirname, "../lib/tap_stack.tf"), "utf8");
  const config = parseToObject(terraformContent);
  expect(config[0].resource.aws_vpc.main[0].cidr_block).toBe("10.0.0.0/16");
});

test("Subnet count validation", () => {
  const terraformContent = fs.readFileSync(path.join(__dirname, "../lib/tap_stack.tf"), "utf8");
  const config = parseToObject(terraformContent);
  expect(config[0].resource.aws_subnet.public[0].count).toBe(2);
});

test("Route table destination validation", () => {
  const terraformContent = fs.readFileSync(path.join(__dirname, "../lib/tap_stack.tf"), "utf8");
  const config = parseToObject(terraformContent);
  expect(config[0].resource.aws_route_table.public[0].route[0].cidr_block).toBe("0.0.0.0/0");
});