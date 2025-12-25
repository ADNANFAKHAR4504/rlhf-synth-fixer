# model_failure.md

## Summary
This is an example of a failed model response for the requested `main.tf`. The output below does not satisfy the user's prompt requirements.

## Problems with this output
1. The file splits resources across multiple files (references `module` blocks or a `security.tf` file) rather than providing everything in a single `main.tf`.
2. The `aws_region` variable is not declared in `main.tf` (provider.tf required it).
3. The security group allows ingress on multiple ports including SSH (22) or all ports (0-65535) or uses `0.0.0.0/0` as default.
4. No validation exists for CIDR lists; both IPv4 and IPv6 default to `["0.0.0.0/0"]`.
5. Missing required `vpc_id` variable or it has a default placeholder, violating the constraint that user must supply VPC.
6. Outputs are missing or incomplete (no `security_group_arn`, no ingress summary).
7. Uses external modules (e.g., `module "security_group" { source = "..." }`) instead of native resources.

## Example failing snippet (NOT valid main.tf)
```hcl
variable "vpc_id" {
  default = "vpc-123456" # should not have default
}

resource "aws_security_group" "bad" {
  vpc_id = var.vpc_id
  ingress {
    from_port = 0
    to_port = 65535
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # open to the world - fails requirement
  }
}
