import { test, expect } from "vitest";
import { execSync } from "child_process";

test("Terraform integration test", () => {
  execSync("terraform init");
  execSync("terraform apply -auto-approve");

  const output = execSync("terraform output -json").toString();
  const state = JSON.parse(output);

  expect(state.vpc_id.value).toBeDefined();
  expect(state.subnet_ids.value.length).toBe(2);
  expect(state.igw_id.value).toBeDefined();
});