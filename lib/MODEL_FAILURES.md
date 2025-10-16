Purpose: Produce a precise failure report explaining why a model’s CloudFormation answer deviates from the ideal response, and describe exact, actionable fixes in plain language.

How to work: Read both the ideal response and the model response. Compare them resource-by-resource and setting-by-setting. Use the rubric below. Your output must be complete, unambiguous, and implementation-ready, but expressed in prose (no code, no pseudo-code, no placeholders).

What to verify (must-pass rubric):

1. Parameters and conditions
   • Latest AMI must be provided via an SSM parameter type for EC2 image ID, not via static AMI mappings.
   • Database engine version must default to empty, have a “HasDBEngineVersion” condition, and only set EngineVersion when the condition is true.
   • No extra or renamed parameters beyond those in the ideal response.

2. Networking layout
   • One VPC with DNS support. Two public subnets (ALB only), two private subnets (compute), two DB subnets, across two AZs, no public IPs enabled on subnets.
   • Gateway endpoints present for S3 and DynamoDB; interface endpoints for SSM, SSMMessages, EC2Messages, CloudWatch Logs, EventBridge, and KMS.
   • Route tables exist and are associated correctly with all subnets.

3. Security groups
   • ALB security group allows TCP/80 from the allowed CIDR only.
   • EC2 security group allows TCP/80 only from the ALB security group; egress confined to VPC endpoints and DB subnets as per the ideal design.
   • RDS security group allows the DB port only from the EC2 security group.

4. KMS
   • Three KMS keys: database, S3, and logs; all with key rotation enabled and correct service principals (RDS, CloudTrail, CloudWatch Logs).
   • Policies use the correct service conditions and caller account constraints.

5. S3 buckets and policies
   • Bucket names are deterministic and lowercase, derived from account ID and region for trail logs, ALB logs, app logs.
   • All buckets have versioning enabled, block public access, and enforce TLS-only access.
   • ALB logs bucket policy uses the correct service principal for ALB log delivery (the Elastic Load Balancing log delivery service), not account IDs.
   • Lifecycle and encryption settings align with the ideal response.

6. CloudTrail
   • A single trail with logging enabled, validation on, data events configured, and wired to CloudWatch Logs via the correct role.
   • Bucket policy condition keys use the lowercase “aws:” namespace, not “AWS:”.
   • Trail name and S3 destination align with the ideal response.

7. CloudWatch Logs
   • Log groups for application, ALB, WAF, and CloudTrail exist, have KMS encryption, and use the specified retention.

8. Compute (Launch Template and Auto Scaling)
   • Launch Template enforces IMDSv2, installs CloudWatch Agent and a web server, and writes a recognizable index page.
   • Auto Scaling Group spans the private subnets and attaches to the target group; health checks and grace period match the ideal response.

9. Database
   • Secrets Manager controls the master password; the excluded character set is exactly the one specified in the ideal response (backslash, double-quote, at sign, forward slash, and a trailing backslash).
   • Multi-AZ, encryption with the DB KMS key, backups and retention, deletion protection, and logs export configured per the ideal response.
   • Engine version behavior is conditional as described in section 1.

10. WAF
    • Regional scope with AWS managed rule groups; rules use a non-blocking override action for the managed sets (no custom blocking actions that would drift from the ideal behavior).
    • Association to the ALB is present.

11. CloudFront (conditional)
    • Created only when the corresponding parameter indicates it.
    • Origin points to the ALB, with viewer protocol policy and behaviors matching the ideal response.

12. Outputs
    • Output keys and values match the ideal response exactly, including names and derivations; no handcrafted ARNs or renamed outputs.

Common failure patterns to flag as blocking:
• Static AMI mappings instead of an SSM parameter for the latest AMI.
• Using account IDs or incorrect principals for ALB log delivery instead of the correct ALB log delivery service principal.
• Using “AWS:” instead of “aws:” in policy conditions.
• Bucket naming that is not account- and region-deterministic.
• WAF rules that hard-block managed groups rather than using non-blocking override actions.
• Outputs that invent ARNs or diverge in key names.
• Security group egress that is overly broad or not aligned to endpoints and DB subnets.

Report format (follow exactly):

1. Summary (no more than five lines)
   Give a crisp overview of whether the model response conforms, and highlight the biggest risks.

2. Blocking issues
   For each blocking issue, name the resource or setting, state precisely what is wrong, why it violates the ideal response, and provide an explicit prose correction (what to change and to what). One paragraph per issue.

3. High and medium issues
   List remaining material deviations with the same structure as above, but note impact as high or medium. Keep them actionable and specific.

4. Low and stylistic issues
   Note minor drifts, naming inconsistencies, or unnecessary noise that could cause confusion or test failures later. Keep these concise.

5. Expected test impact
   Map each blocking and high issue to the kind of unit or integration test that would fail (for example, ALB access logs delivery, CloudTrail status, WAF association, VPC endpoint reachability).

6. Validation plan
   Describe, in plain language, how to re-validate after fixes: run a linter, deploy or update the stack, and re-run unit and integration tests. Reference which rubric items confirm the fixes.

Tone and constraints:
• Be definitive and specific. Do not speculate.
• Do not include code, pseudocode, or placeholders.
• Refer to resources and properties by their exact names, and describe the required values and behaviors in clear prose.
• Prefer precise language such as “replace the principal with the Elastic Load Balancing log delivery service” or “set the database engine version only when the condition that checks for a non-empty value is true.”
• Every correction must be independently actionable without seeing code.
