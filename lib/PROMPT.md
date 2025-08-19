I need a production-ready AWS CDK v2 app in TypeScript that rolls out the same stack to two regions: us-east-1 and us-west-2. Keep it boring, reliable, and easy to maintain.

What the stack should actually do:

* Tag everything with Environment: Production.
* One VPC per region. Public and private subnets. Instances live in private subnets; the Internet stuff (ALB) goes in public.
* Put an Application Load Balancer in the public subnets. Terminate TLS at the ALB and redirect HTTP to HTTPS. Assume the ACM certificate already exists in each region—take the ARN from context or props and document it.
* AutoScalingGroup in the private subnets: min 3, max 6. Wire it to the ALB target group so traffic flows correctly. Health checks should be through the target group, not just EC2 status checks.
* RDS (Multi-AZ) in the private subnets. Lock it down so only the app instances can talk to it over the right port. Let CDK manage the secret unless you’re told otherwise.
* CloudWatch alarm: if average CPU on any instance in the ASG stays over 70% for 5 minutes, fire it. Point the alarm action somewhere sane (OK to leave a TODO if we haven’t picked an SNS topic).
* S3 bucket with versioning and default encryption turned on. Don’t get fancy; server-side encryption with S3-managed keys is fine unless a KMS key is provided.
* EC2 instance role that actually follows least privilege. Think: read the app’s S3 bucket if needed, write to CloudWatch Logs, talk to SSM if we want Session Manager. No wildcard admin policies.
* Security groups that make sense: ALB accepts 80/443 from the world (and redirects 80 to 443). ALB to instances on the app port only. Instances to RDS on the DB port only. Outbound kept tight where practical.

Make it run in both regions from the same app:

* The CDK app should instantiate the stack twice with env set to each region. Don’t try to do cross-region gymnastics with one stack; just deploy two identical stacks side by side.
* Any region-specific values (ACM cert ARNs, allowed CIDRs, DB instance class, etc.) should come from context or props so we don’t hard-code them.

Hand back two files, fully commented and runnable:

* bin/my-app.ts — creates the CDK app and instantiates the stack twice (us-east-1 and us-west-2). Pass in any needed context like certificate ARNs.
* lib/my-stack.ts — defines the VPC, ALB, target group/listeners, ASG, RDS (Multi-AZ), S3 bucket, CloudWatch alarm, IAM roles, and all security group rules. Add clear comments on why each piece exists and how it connects.

A few ground rules so we don’t talk past each other:

* Prefer CDK constructs over shell scripts and magic. Keep policies tight and resource-scoped.
* Keep defaults sensible and leave a short TODO when you’re making a trade-off (e.g., “Using t3.medium for now; revisit for prod load tests”).
* No surprise dependencies. If the stack needs an ARN or a parameter, expose it cleanly via props or cdk.json context and mention it in a comment.

Minimal deploy notes (don’t overthink it):

* cdk bootstrap both regions if needed.
* cdk synth to sanity-check.
* cdk deploy “\*” when you’re ready.

That’s the brief. Build the thing you’d want to own in production.