Your given TapStack.yml code is failing at the deploy stage.

Error:

The resource VpcBPrivateSubnet1 is in a CREATE_FAILED state
This AWS::EC2::Subnet resource is in a CREATE_FAILED state.

Template error: Fn::Select cannot select nonexistent value at index 1


What I need:

Fix the Availability Zone selection issue. The template currently uses !Select [1, !GetAZs ''], which fails in regions with only one AZ (or if AZs are restricted).

Ensure idempotent deployment across all AWS regions, regardless of AZ count.

Provide a full corrected TapStack.yml where subnet creation gracefully handles AZ indexing without causing errors.

Keep multi-AZ support where possible, but make it fallback-safe (e.g., use conditions, parameters, or dynamic logic).

Preserve all other security/compliance features (KMS, IAM, CloudTrail, Config, GuardDuty, Secrets Manager, etc.).

Add inline comments explaining the subnet AZ fix.