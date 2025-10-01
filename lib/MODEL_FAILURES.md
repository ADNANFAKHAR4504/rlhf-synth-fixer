### Model response failures vs PROMPT.md requirements

- Deliverable/structure
  - Did not produce a single deployable Terraform file named `tap_stack.tf`; response is a Markdown narrative with scattered snippets.
  - The final "Answer" snippet is incomplete and stops mid-way; many resources and all outputs from earlier sections are missing, so it is not deployable as-is.
  - Included extraneous "Reasoning Trace" content; prompt asks only for the complete Terraform script.
  - Requirement to "create all resources from scratch as new modules" was not followed; no Terraform modules were defined, only direct resources.

- Region and VPC
  - Region constraint was partially implemented via validation (allow only `us-west-2` and `us-east-1`), but GuardDuty was not enabled in "all active regions" as required (only primary and one secondary region considered).
  - Only one VPC is defined (good). Services that cannot reside in a VPC (API Gateway, CloudFront, SNS, DynamoDB) are fine, but the prompt’s wording "All resources must be defined inside a single VPC" should have been acknowledged with explicit justification and private-only placement for components that can be inside the VPC.

- Networking and Security Groups
  - Default SG deny-all was configured, but application SGs (e.g., `web`, `lambda`) allow all egress (`0.0.0.0/0`). This violates the "default deny all inbound/outbound" intent; outbound should be least-privilege.
  - VPC S3 Endpoint was created (good).
  - EC2 instance placed in a private subnet without an ALB or ingress path; the "allow only HTTPS (443) inbound" control is not practically achievable without a public entry point (e.g., ALB in public subnets with HTTPS listener and SG restricted to allowed IP ranges).

- IAM, Access Control, and Change Management
  - Least-privilege is only partially observed. Examples: broad CloudWatch Logs permissions (`arn:aws:logs:*:*:*`) and unrestricted EC2 network interface actions (`Resource = "*"`). These should be scope-restricted.
  - "Logging for all AWS managed policies must be enabled (send logs to CloudWatch)" is not implemented. There is no CloudTrail trail/organization trail, Config rules, or metric filters/alarms to log and monitor managed policy usage.
  - Change management requirement not implemented: Although a `devsecops` role was created, no enforcement exists to require approval for changes to security configurations (e.g., SCPs, IAM deny policies with conditions, AWS Config change triggers with approvals, or CodePipeline manual approvals).

- Encryption (at rest and in transit)
  - S3: Server-side encryption enabled for buckets (good), but missing bucket policies enforcing TLS in transit via `aws:SecureTransport` to ensure HTTPS-only access.
  - RDS: Storage encryption and Multi-AZ were configured, but the parameter to enforce SSL for client connections (e.g., MySQL `require_secure_transport`) was not set.
  - DynamoDB: SSE with CMK enabled (good).
  - EBS: Root volume encrypted (good).
  - SNS: Topic KMS CMK enabled (good).
  - CloudWatch Logs KMS: The final code references `aws_kms_key.logs` for log group encryption, but that key is never defined (broken reference). Other log groups lack explicit KMS configuration.

- Compute and runtimes
  - EC2 instance type is `t3.micro` (good), but AMI is hard-coded to a specific ID that is region-dependent and likely invalid for `us-west-2`. Should use a data source to resolve the latest approved AMI in the selected region.
  - Lambda runtime "latest" requirement not met. Earlier snippet defaulted to `nodejs18.x`; as of 2025, newer runtimes (e.g., `nodejs20.x`) exist. The final "Answer" omitted Lambda entirely, leaving this unimplemented.

- Database (RDS)
  - Earlier snippet configured private-only, Multi-AZ, and ≥7-day backups (good), but the final "Answer" omitted the entire RDS setup, so the deliverable is incomplete.

- API & application delivery
  - API Gateway was set to `EDGE` (edge-optimized), but WAFv2 Web ACL with `scope = REGIONAL` was associated to the API Gateway stage. This is incompatible; WAFv2 REGIONAL cannot be attached to an edge-optimized REST API. Must either use a REGIONAL API with WAFv2 REGIONAL or attach WAF at CloudFront for edge.
  - CloudFront distribution created to serve S3 with versioning enabled on the bucket (good), but CloudFront access logging and S3 server access logging are not enabled (best-practice gap).

- Monitoring and logging
  - Alarms exist for RDS CPU, EC2 CPU, Lambda errors, and DynamoDB throttled requests (good) but could include additional signals for "unusual patterns" (optional enhancement).
  - GuardDuty: Created detectors only in primary and secondary regions; requirement is "enabled in all active regions". Also, findings are not routed to SNS. The SNS topic policy allows GuardDuty, but GuardDuty does not publish directly to SNS; an EventBridge rule targeting SNS is missing.
  - VPC Flow Logs enabled (good).
  - Lambda log groups created (good), but KMS key reference for flow logs is broken, and other log groups lack KMS keys (best-practice gap).
  - No CloudTrail trail to capture IAM and managed policy activity; violates logging requirement for managed policies and broader compliance needs.

- Tagging
  - Many resources include `Environment`, `Owner`, `Project` tags (good). Some resources that support tags are missing them (e.g., certain IAM or logging resources). The requirement states "All resources must include tags"; ensure tags are added everywhere tagging is supported.

- Outputs and references
  - Outputs listed earlier were not included in the final "Answer" block; deliverable lacks required outputs.
  - The earlier output attempted to use `aws_api_gateway_deployment.main.invoke_url`, which is not a valid attribute; should use the stage `invoke_url` or construct from REST API ID, region, and stage name.

- Deployability issues and placeholders
  - `aws_kms_key.logs` referenced but never defined (will fail apply).
  - `aws_key_pair` uses a placeholder public key; this will fail unless replaced. Prompt expects a deployable script; placeholders should be avoided or optionalized.
  - Lambda `filename` points to `function.zip` placeholder; without packaging steps or an existing artifact, apply will fail. Either provide a data/archive_file pipeline or make Lambda optional.
  - Hard-coded AMI ID is not portable and likely invalid in the allowed regions; must use a data source.

- Provider usage
  - Prompt states a `provider.tf` already exists and exposes `var.aws_region`. The response redefines region validation locally and, in earlier sections, adds an additional `aws` provider alias for the secondary region. The final "Answer" omits the alias but also omits the secondary-region resources. The solution should reference the existing provider config cleanly and, if a secondary provider is required, define it consistently with variables declared in the same file.

- Interpretation mismatches
  - "Create all resources from scratch as new modules" was ignored; no modules created.
  - "All requirements must be implemented in a single file" was not met; the final code is incomplete and scattered across narrative sections instead of a single, cohesive `tap_stack.tf` file.

Actionable fixes required to comply:

1. Deliver a complete `tap_stack.tf` containing all variables (with sensible defaults), logic, and outputs only (no extraneous prose).
2. Use a data source for the AMI and remove placeholders (key pair, lambda artifact) or document optional toggles.
3. Restrict SG egress to least-privilege and add an HTTPS ALB if EC2 must be reachable via 443.
4. Implement CloudTrail and (optionally) AWS Config to satisfy managed policy logging and compliance.
5. Enforce TLS in S3 bucket policies and RDS SSL via parameter group.
6. Fix WAF + API Gateway compatibility (REGIONAL API with WAFv2 REGIONAL, or WAF at CloudFront for edge).
7. Enable GuardDuty in all active regions and use EventBridge rules to route findings to SNS.
8. Define and use KMS keys for log groups (or remove broken references) and add missing tags where supported.
