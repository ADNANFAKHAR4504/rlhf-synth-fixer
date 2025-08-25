I need to build a production AWS CDK v2 app in TypeScript that deploys the same infrastructure to both us-east-1 and us-west-2. Looking for something solid, reliable, and easy to maintain.

Here's what the stack needs to do:

* Tag all resources with Environment: Production
* Create a VPC per region with public and private subnets - instances go in private, internet-facing stuff (ALB) goes in public
* Deploy an Application Load Balancer in public subnets. Handle HTTP traffic (HTTPS removed as requested). Assume ACM certificate exists in each region - get the ARN from context or props and document it
* AutoScalingGroup in private subnets: min 3, max 6 instances. Connect it to the ALB target group for proper traffic flow. Use target group health checks, not just EC2 status checks
* RDS (Multi-AZ) in private subnets. Lock it down so only app instances can access it on the right port. Let CDK handle the secret unless specified otherwise
* CloudWatch alarm: trigger when average CPU on any ASG instance stays above 70% for 5 minutes. Point the alarm action somewhere reasonable (TODO is fine if SNS topic isn't chosen yet)
* S3 bucket with versioning and default encryption. Keep it simple - S3-managed keys are fine unless KMS key is provided
* EC2 instance role following least privilege. Think: read app's S3 bucket if needed, write to CloudWatch Logs, access SSM for Session Manager. No wildcard admin policies
* Security groups that make sense: ALB accepts 80/443 from internet (redirect 80 to 443). ALB to instances on app port only. Instances to RDS on DB port only. Keep outbound tight where practical

Make it work in both regions from the same app:

* The CDK app should create the stack twice with env set to each region. Don't try cross-region tricks with one stack - just deploy two identical stacks side by side
* Any region-specific values (ACM cert ARNs, allowed CIDRs, DB instance class, etc.) should come from context or props, not hard-coded

Deliver two files, fully commented and ready to run:

* bin/my-app.ts - creates the CDK app and instantiates the stack twice (us-east-1 and us-west-2). Pass in any needed context like certificate ARNs
* lib/my-stack.ts - defines the VPC, ALB, target group/listeners, ASG, RDS (Multi-AZ), S3 bucket, CloudWatch alarm, IAM roles, and all security group rules. Add clear comments explaining why each piece exists and how it connects

Some ground rules:

* Prefer CDK constructs over shell scripts and magic. Keep policies tight and resource-scoped
* Keep defaults sensible and leave a short TODO when making trade-offs (e.g., "Using t3.medium for now; revisit for prod load tests")
* No surprise dependencies. If the stack needs an ARN or parameter, expose it cleanly via props or cdk.json context and mention it in a comment

Basic deploy notes:

* cdk bootstrap both regions if needed
* cdk synth to sanity-check
* cdk deploy "*" when ready

That's it. Build something you'd want to own in production.