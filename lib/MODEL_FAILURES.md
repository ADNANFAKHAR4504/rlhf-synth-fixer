### model_failure

# Functional scope (build everything new):

Document failure modes that would prevent a clean, single-attempt deployment of the stack and prescribe corrective actions aligned with the final template.

# Deliverable:

A concise narrative of common pitfalls, symptoms, root causes, and fixes so that CI/CD runs are deterministic and pass without manual intervention.

## Typical failure modes and fixes

* **AMI does not exist**: Using a hardcoded AMI ID can fail as images are retired. Fix by sourcing the AMI from the public SSM parameter for Amazon Linux 2023 in `us-east-1`.
* **Early Validation name collisions**: Explicit physical names (e.g., `BucketName`, `AutoScalingGroupName`, `RoleName`) can collide with remnants from previous stacks. Fix by omitting physical names and relying on logical-ID-derived names; include `ENVIRONMENT_SUFFIX` only in tags and generated paths.
* **ALB access logs “Access Denied”**: Missing or outdated S3 bucket policy prevents the log-delivery service from writing. Fix by granting `logdelivery.elasticloadbalancing.amazonaws.com` `s3:PutObject` into `alb-access-logs/AWSLogs/<account-id>/*`, enabling `BucketOwnerEnforced`, enforcing TLS, and making the ALB depend on the bucket policy.
* **ASG stuck or flapping**: Health checks fail while instances warm up. Fix by serving a fast `/health` endpoint in UserData, using tolerant Target Group thresholds, and increasing `DefaultInstanceWarmup` and `HealthCheckGracePeriod` so scaling and ELB health do not act prematurely.
* **cfn-lint errors in descriptions or labels**: Embedded `${Parameter}` strings in Parameter descriptions or non-ASCII punctuation in SecurityGroup descriptions trigger linter errors. Fix by removing interpolations from descriptions and using ASCII-only text.
* **Private subnets without egress**: Instances cannot install packages or reach metadata if NAT or routes are misconfigured. Fix by confirming NAT and `0.0.0.0/0` routes on private route tables point to the NAT Gateway; ensure security group egress allows required traffic.
* **Insufficient IAM for agents/logs**: Missing log permissions or overly broad SSM policies cause runtime failures or audit issues. Fix by attaching `AmazonSSMManagedInstanceCore` and a narrowly scoped inline policy for Parameter Store, plus CloudWatch logs permissions where needed.

## Validation checklist

* Region is `us-east-1` and enforced by a Rule.
* All Parameters have defaults; CI/CD passes no external values.
* No explicit physical names on sensitive resources.
* Target Group uses `/health`; ASG warmup/grace prevent premature actions.
* S3 logs bucket policy is correct and ALB depends on it.
* `cfn-lint` runs clean with zero errors.
