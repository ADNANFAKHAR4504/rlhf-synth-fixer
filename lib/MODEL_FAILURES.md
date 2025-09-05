## Common failure patterns for this task
1. **Missing or unusable parameters**
   - Omitting defaults for values that the pipeline expects to be present (e.g., `AlarmEmail`, `PublicKeyMaterial`), causing a change set creation failure.
   - Defining `DbMasterPassword` but forgetting to provide a secure handling path (or setting an empty default) that breaks creation or violates best practices.

2. **IAM wildcards**
   - Using `"Action": "*"` or `"Resource": "*"` in **Allow** blocks, violating the “no wildcard in Allow” requirement and inviting over-privileged roles.

3. **Incorrect resource types or properties**
   - Using an invalid service namespace for CloudWatch Logs resources.
   - Supplying the wrong property names on EC2 (for example, attaching security groups with the wrong attribute on an instance).
   - Adding unnecessary substitutions that trigger linter warnings.

4. **Networking gaps**
   - Only one NAT Gateway or placing the bastion in a private subnet, contradicting the requirement for a public subnet bastion and high-availability egress.
   - Hardcoding AZ names instead of deriving them from `Fn::GetAZs`.

5. **CloudTrail misconfiguration**
   - Forgetting `IsLogging`, failing to wire the role for CloudWatch Logs delivery, or omitting the S3 archival bucket policy that allows the service to write.

6. **RDS configuration errors**
   - Not setting `MasterUsername`, or specifying both `MasterUserPassword` and AWS-managed secrets simultaneously without conditions, leading to creation errors.
   - Making the database publicly accessible or failing to restrict ingress to the database security group.

7. **S3 security regressions**
   - Bucket names that violate DNS rules by mixing uppercase or unsupported characters.
   - Bucket policies that fail to deny insecure transport, or that inadvertently permit public principals.

8. **Tagging inconsistencies**
   - Forgetting to tag some resources, making cost allocation and ownership tracking unreliable.

9. **Outputs omitted or incomplete**
   - Not surfacing critical outputs like VPC and subnet IDs, security groups, bastion identifiers, S3 bucket names/ARNs, RDS endpoint/port, LogGroup details, SNS Topic ARN, Lambda identifiers, and CloudTrail identifiers.

## What “doing it right” looks like
- Every parameter has a sensible default or a safe conditional path so the change set can be created without interactive input.
- IAM policies **enumerate** actions and **scope** resources precisely; denials for MFA enforcement are explicit and targeted to sensitive operations.
- All services (Logs, Trail, Flow Logs, RDS) are wired with the correct roles and resource references.
- The template is region-agnostic and AZ-agnostic, uses environment mappings, and applies consistent tagging.
- The final response is one clean code block containing the full template with no surrounding prose.
