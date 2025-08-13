
---

# `ideal_response.md`

This file documents exactly what an ideal assistant output should do when producing `main.tf` for the user's prompt.

```md
# ideal_response.md

## Ideal Response Requirements

The ideal response (the correct `main.tf`) should:

1. Be a single HCL file named `main.tf` containing:
   - `terraform { required_providers { ... } required_version = ... }`
   - All `variable` declarations required by the prompt
   - `locals` used to construct ingress rules
   - `aws_security_group` resource which contains only ingress rules for TCP 80 and TCP 443
   - No references to external modules
   - No default permissive CIDRs like `0.0.0.0/0` or `::/0` in user-provided variables

2. Variables:
   - `aws_region` declared (default "us-east-1") and validated non-empty
   - `vpc_id` required, no default
   - `allowed_ipv4_cidrs` default `[]` and validated (CIDR format check)
   - `allowed_ipv6_cidrs` default `[]` and validated
   - Validation that the two CIDR lists are not both empty (fail plan with clear error)
   - `allow_all_outbound` boolean default `true`
   - `security_group_name` and `security_group_description` with defaults
   - `tags` map default with Owner & Environment keys

3. Ingress construction:
   - Create rules only for ports 80 and 443
   - For each IPv4 CIDR create ingress with `cidr_blocks`
   - For each IPv6 CIDR create ingress with `ipv6_cidr_blocks`
   - No other ingress allowed

4. Egress:
   - If `allow_all_outbound = true`, create a single egress rule allowing all outbound
   - If `allow_all_outbound = false`, create conservative egress rules (HTTPS + DNS) and document reasoning in comments

5. Outputs:
   - `security_group_id`
   - `security_group_arn`
   - `security_group_name`
   - `ingress_rules` — list/map summarizing port and CIDR for easy verification

6. Documentation:
   - Top-of-file comments explaining how to run `terraform init`, `plan`, `apply`
   - Example `terraform apply` CLI with `-var` examples for IPv4 and IPv6
   - How to verify in AWS Console or with `aws cli`

7. Extra:
   - Clear, actionable error messages for validation checks
   - Use HCL2 and Terraform >= 1.3 syntax
   - Minimal but secure defaults, inline comments explaining security rationale

## Why this is ideal
- It enforces secure defaults and avoids accidental exposure.
- It is self-contained and ready to use (provider still in provider.tf).
- It gives clear instructions for users to test and verify the resource in a controlled manner.

