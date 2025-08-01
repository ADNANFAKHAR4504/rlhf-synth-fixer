- Code won’t synthesize as-is – several files are incomplete or omit imports (Duration, RemovalPolicy, etc.), so ```cdk synth``` fails without additional fixes.

- GuardDuty scope incomplete – model's response enables detectors per region but does not configure the Organizations master/account aggregator required for multi-account centralization.

- Shield Advanced gap – model's response simply attaches a protection resource; it omits the prerequisite subscription (and cost notice), so deployment would error for unsubscribed accounts.

- IAM least-privilege only partly demonstrated – example policies still include broad AWS-managed policies; no boundary or inline policy minimization shown.

- S3 KMS & logging inconsistencies – buckets log to themselves (log_bucket=storage_bucket), violating best-practice separation; bucket names rely on self.account/self.region which aren’t defined inside the construct scope without custom code.

- Subnet setup conflicts with SSH rule intent – model's response creates public subnets and an ALB SG open to the world, yet never shows how EC2 instances avoid public SSH; enforcement of “no port 22 from Internet” isn’t demonstrated for EC2 workloads.

- Tagging not propagated through constructs – model's response 'tags' argument is passed to stacks but individual resources inside stacks don’t consistently inherit them.