# Model Response Failure Analysis

## Summary

The model response did **not** produce any Pulumi Go code. Instead, it returned a prose ticket describing the desired solution. Because the assignment required actual infrastructure code, the response failed before deployment even started. Beyond the missing code, the narrative omitted several critical implementation details that are present in the working solution.

## Key issues

| Area | MODEL_RESPONSE | IDEAL_RESPONSE | Impact |
|------|----------------|----------------|--------|
| Deliverable format | A written recap of requirements; no Pulumi program, no Go module, no tests. | Complete Pulumi Go stack creating VPC, KMS, RDS, ECS, API Gateway, IAM roles, secrets, logging, and outputs. | **Critical** – nothing deploys; CI immediately fails. |
| KMS policy | Mentions customer-managed keys but provides no policy or service principal guidance. | Implements a concrete policy that grants CloudWatch Logs, Secrets Manager, Kinesis, and RDS the rights they need, including region-aware log principals. | **High** – without policy the key cannot encrypt logs or secrets. |
| Networking & security | Describes desired network structure in prose but omits concrete CIDRs, AZ handling, security groups, or NAT configuration. | Builds the VPC, discovers AZs dynamically, creates public/private subnets, attaches route tables, and enforces least-privilege security groups for ECS→RDS. | **High** – infrastructure layout and access controls are undefined in the model reply. |
| Observability & outputs | No instructions for log groups, API Gateway logging, or stack outputs. | Provisions KMS-encrypted CloudWatch log groups, registers the API Gateway account, and exports every identifier used by integration tests. | **Medium** – lack of logs/outputs blocks auditability and downstream automation. |

## Training takeaways

1. When the prompt asks for Pulumi Go code, the assistant must generate a compilable Go module, not a summary of requirements.
2. Security-sensitive resources (KMS, Secrets Manager, API Gateway logging) need explicit policies and wiring, not just a mention that “encryption is required.”
3. Integration test compatibility depends on exposing concrete outputs and matching resource names; the model response ignored this, whereas the implementation exports everything the tests expect.
4. For infrastructure tasks, prose-only answers are treated as failures even if the intent is technically accurate. Always deliver runnable code accompanied by tests when requested.
