# model_failure

## Why a model might fail this task:

The template may omit the top-level Resources block, define duplicate top-level sections, or place intrinsics in forbidden locations, causing schema errors during lint or deploy. Hardcoded AllowedValues for environment identifiers can reduce portability or cause rejected updates, and missing default parameter values will block non-interactive pipeline runs. Unreachable condition branches or nested `Fn::If` expressions can trigger linter warnings and brittle logic.

## Common misconfigurations:

Security groups may expose the database publicly or fail to limit ingress to the EC2 security group. Private subnets might lack NAT egress via route tables, breaking package updates and agent telemetry. ASG configuration may not ensure a minimum of two instances across AZs, undermining high availability. RDS could be placed in public subnets, lack encryption, miss a subnet group, or omit a parameter group family compatible with the selected engine version.

## Deployment breakers:

Improper `UserData` substitutions for the CloudWatch Agent can produce JSON parsing errors, preventing the agent from starting and starving memory metrics. Missing IAM instance profile attachments or incorrect ARNs will fail instance launches. Alarm dimensions that reference nonexistent resources or wrong namespaces will fail validation. Secrets Manager references may be malformed, resulting in credential resolution errors at RDS creation time.

## Linting and synthesis issues:

Duplicate `Mappings` or `Conditions` sections, invalid YAML indentation, or stray keys outside `Resources` and `Outputs` will trigger cfn-lint errors. Use of JSON instead of YAML or mixing both inconsistently can cause parse failures. Attempting dynamic `DeletionPolicy` or `UpdateReplacePolicy` via intrinsics will be rejected. Misusing `Fn::Sub` without a variables map inside complex `UserData` often breaks lint and runtime.

## Remediation guidance:

Consolidate all resources under a single `Resources` key, keep exactly one `Mappings` and one `Conditions` section, and validate with cfn-lint before synthesizing from CDK. Provide defaults for all Parameters, restrict environment names with a regex instead of enumerations, and suffix every logical name with EnvironmentSuffix. Verify SG scoping, NAT routes for private subnets, ASG size bounds, RDS subnet and parameter groups, and Secrets Manager references. Ensure CloudWatch Agent configuration is valid JSON and pass substitutions using the two-argument form of `Fn::Sub` to avoid runtime substitution errors.
