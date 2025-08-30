import { test, expect } from "vitest";
import { parseHCL } from "terraform-config-parser";

test("VPC CIDR block validation", () => {
  const config = parseHCL(`...tap_stack.tf content...`);
  expect(config.resource.aws_vpc.main.cidr_block).toBe("10.0.0.0/16");
});

test("Subnet count validation", () => {
  const config = parseHCL(`...tap_stack.tf content...`);
  expect(config.resource.aws_subnet.public.count).toBe(2);
});

test("Route table destination validation", () => {
  const config = parseHCL(`...tap_stack.tf content...`);
  expect(config.resource.aws_route_table.public.route[0].cidr_block).toBe("0.0.0.0/0");
});