## Prompt

I need your expertise on this one. As our go-to AWS Cloud Engineer, I'd like you to spearhead the creation of a new baseline CloudFormation template.

The Goal: We're aiming to build a comprehensive, secure, and production-ready template in YAML that we can use to lock down new AWS environments. The whole idea is to have a reusable script that bakes in our security best practices from the start, especially the principle of least privilege.

The Setup: You'll be working within a standard AWS account that already has a VPC and a few subnets. Your template should be flexible enough to work with these existing resources, so let's use Parameters for things like the VPC ID.

Key Security Features to Build In
I need the template to provision a full suite of security controls. Let's make sure we cover the following areas:

1. Identity & Access Management:

Let's start with a solid IAM role for our EC2 instances. It should only have the bare minimum permissions needed for its job—no wildcards!

We also need to enforce MFA. Could you create an IAM group with a policy that blocks all actions unless the user has logged in with MFA? That'll be our standard for any users accessing sensitive stuff.

2. Data Protection (S3):

Please set up a new S3 bucket that we can use for all our logging.

It's critical that this bucket is secure, so make sure it has server-side encryption (AES-256) and versioning turned on.

Naturally, it should have a bucket policy that completely restricts public access.

3. Auditing, Logging, and Alerting:

Let's get full visibility. Set up a multi-region CloudTrail trail that logs all management events and ships them to that secure S3 bucket.

For network traffic, please enable VPC Flow Logs for the entire VPC. Let's capture everything (ACCEPT and REJECT) and send it to a CloudWatch Logs Group.

We'll assume GuardDuty is running. I'd like you to create an EventBridge rule that watches for GuardDuty findings. If anything with a severity of 7.0 or higher pops up, it should fire off a notification to a new SNS Topic. Let's also add an email subscription to that topic so our security team gets the alert.

4. Network & Infrastructure Security:

Let's lock down the network layers. Please create a Network ACL and attach it to a subnet. Just add a couple of sample rules to show how we can block or allow traffic, like denying SSH from the open internet.

For our databases, provision an RDS DB Subnet Group that only uses private subnets. Then, launch a small sample RDS instance (a db.t3.micro is fine) and double-check that PubliclyAccessible is set to false.

Let's launch a sample EC2 instance. It must be launched with the secure IAM Instance Profile you created earlier and should not have a public IP.

5. Continuous Compliance:

Finally, let's keep an eye on things long-term. Please stand up AWS Config with a configuration recorder.

To get us started, add a couple of managed rules to check for common misconfigurations, like s3-bucket-public-read-prohibited and ec2-instance-no-public-ip.

What I'll Need Back
The final deliverable should be a single, complete CloudFormation template in YAML. Please add plenty of comments throughout the file to explain what each major resource does—it'll help everyone understand the setup down the line. The template should be clean, well-structured, and ready to deploy.