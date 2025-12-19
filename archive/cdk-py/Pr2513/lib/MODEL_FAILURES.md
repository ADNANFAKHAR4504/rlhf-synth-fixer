# Model Failure

#### Syntax
- The ec2.Instance constructor is expecting security_group (singular) instead of security_groups (plural). 
- Missing final line like outputs
- Synth also fail array of sg for passing multiple sg as arr instead of a single sg to add the rest later.
- Using deprecated resource parameters like `key_name` that is a  deprecated parameter for ec2, it should be `key_pair`.
- SnsAction doesn't exist in the cloudwatch module - it's in cloudwatch_actions.

#### Deployment
- Some errors indicating that the IAM policy for VPC Flow Logs has an incorrect ARN. The policy name which appears to be wrong ahould be FlowLogsRole not VPCFlowLogsDeliveryRolePolicy.
- sSome other error indicates that the S3 bucket for CloudFront logs needs to have ACLs enabled. S3 buckets created by the model have ACLs disabled by default, but CloudFront logging requires ACL access to write logs.
- The model did not leave room for database.
