
---

# `model_response.md`

This file shows a model response that **partially** meets the prompt requirements (useful as a baseline). It contains some issues but is much closer than `model_failure.md`.

```md
# model_response.md

## Summary
This model response creates a `main.tf` that mostly follows the requirements, but has a few shortcomings.

## What it does well
- Declares `aws_region`, `vpc_id`, and CIDR variables.
- Creates an `aws_security_group` with ingress rules limited to ports 80 and 443.
- Uses dynamic ingress blocks for IPv4 and IPv6.
- Exposes outputs: `security_group_id`, `security_group_name`.

## Shortcomings (why it's not ideal)
1. It uses `0.0.0.0/0` as a default for `allowed_ipv4_cidrs` which violates "no permissive defaults".
2. Validation is missing that ensures at least one of IPv4 or IPv6 CIDRs is provided.
3. There is no `required_providers` / `required_version` block in `main.tf`.
4. Egress logic is missing or too permissive (always allows all outbound).
5. Ingress summary output is not provided.

## Example snippet showing the key issue
```hcl
variable "allowed_ipv4_cidrs" {
  type = list(string)
  default = ["0.0.0.0/0"] # Problem: permissive by default
}
