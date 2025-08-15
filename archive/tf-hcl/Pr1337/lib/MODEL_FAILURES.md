# Common Failure Patterns

## Structural Issues
❌ **File Splitting**: Attempting to split into multiple files despite explicit instructions.

❌ **Module Usage**: Including external modules when prohibited.

❌ **Provider Redundancy**: Re-declaring AWS provider when instructed not to.

## Technical Errors
❌ **AZ Handling**: Hardcoding AZ names instead of using data source.

❌ **Subnet Math**: Incorrect CIDR calculations for subnet ranges.

❌ **Security Group Rules**: Missing egress rules or incorrect protocol specifications.

❌ **ACM Validation**: Omitting the required Route53 validation records.

## Common Omissions
❌ **Missing Lifecycle Policies**: Forgetting `create_before_destroy` on stateful resources.

❌ **Incomplete Scaling**: Only implementing scale-out without scale-in policies.

❌ **Tagging Inconsistency**: Not applying tags uniformly across all resources.

❌ **Output Gaps**: Missing critical outputs like ALB DNS name or subnet IDs.