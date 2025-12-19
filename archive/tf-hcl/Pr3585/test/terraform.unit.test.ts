// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform single-file stack: tap_stack.tf", () => {
  let content: string;
  
  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    expect(exists).toBe(true);
  });

  test("declares terraform required version >= 1.4.0", () => {
    expect(content).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
  });

  test("declares AWS provider", () => {
    expect(content).toMatch(/provider\s+"aws"\s*{/);
  });

  test("sets region to us-east-1", () => {
    expect(content).toMatch(/region\s*=\s*"us-east-1"/);
  });

  test("creates VPC with CIDR 10.0.0.0/16", () => {
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    expect(content).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
  });

  test("creates 2 public subnets", () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"public_1"/);
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"public_2"/);
  });

  test("creates 2 private subnets", () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private_1"/);
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private_2"/);
  });

  test("creates NAT gateways", () => {
    expect(content).toMatch(/resource\s+"aws_nat_gateway"/);
  });

  test("creates ECS cluster", () => {
    expect(content).toMatch(/resource\s+"aws_ecs_cluster"/);
  });

  test("creates S3 bucket with proper security", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket"/);
    expect(content).toMatch(/aws_s3_bucket_public_access_block/);
    expect(content).toMatch(/block_public_acls\s*=\s*true/);
  });

  test("creates DynamoDB table with provisioned capacity", () => {
    expect(content).toMatch(/resource\s+"aws_dynamodb_table"/);
    expect(content).toMatch(/billing_mode\s*=\s*"PROVISIONED"/);
    expect(content).toMatch(/read_capacity\s*=\s*5/);
    expect(content).toMatch(/write_capacity\s*=\s*5/);
  });

  test("all resources have Environment = Production tag", () => {
    const envTags = content.match(/Environment\s*=\s*"Production"/g);
    expect(envTags).toBeTruthy();
    expect(envTags!.length).toBeGreaterThan(10);
  });

  test("ECS task definition uses Fargate with min CPU/memory", () => {
    expect(content).toMatch(/requires_compatibilities\s*=\s*\["FARGATE"\]/);
    expect(content).toMatch(/cpu\s*=\s*"256"/);
    expect(content).toMatch(/memory\s*=\s*"512"/);
  });
});
