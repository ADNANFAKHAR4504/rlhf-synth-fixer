# Model Failures: Comparison of Model Response vs. Ideal Response

- Missing parameterization for instance type, instance count, key name, environment suffix, and DB password.
- Hardcoded values for environment, instance type, or region instead of using parameters.
- Region not set to `us-east-1` as required.
- S3 buckets and EBS volumes not encrypted with AWS KMS.
- Logging resources (S3 log bucket, CloudTrail) omitted or misconfigured.
- AutoScalingGroup missing `UpdatePolicy` for non-disruptive updates.
- Resources missing required `Environment` tags.
- IAM roles/policies too permissive or not following least-privilege principle.
- S3 bucket missing Lambda notification configuration and permission resource.
- Deprecated Lambda runtime used (e.g., nodejs12.x instead of nodejs22.x).
- No use of cross-stack references (`Export`, `ImportValue`, `Fn::ImportValue`) for modularization.
- No cost optimization (autoscaling, on-demand/spot instances, or over-provisioned resources).