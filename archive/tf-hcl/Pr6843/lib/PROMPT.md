# Infrastructure Generation Prompt

Hey team,

We need to build out a secure AWS environment using Terraform. The business is asking for enterprise-grade security that'll pass all our compliance audits. 

I'm thinking we go with a single main.tf file that sets up everything we need - VPC, security groups, monitoring, the works. All resource names should start with "prod-" to keep things consistent.

Here's what we need to get done:

**S3 Setup**
Make sure all our S3 buckets are locked down tight - AES-256 encryption, versioning enabled, and definitely no public access. We got burned by that last year. Also set up some lifecycle policies so we don't blow the budget on storage costs.

**Network Architecture** 
Set up a VPC using 10.0.0.0/16. Put the public subnets at 10.0.1.0/24 and 10.0.2.0/24, private ones at 10.0.10.0/24 and 10.0.20.0/24. Spread them across two AZs for redundancy. Don't forget NAT gateways so the private stuff can still reach the internet. And please turn on VPC Flow Logs - security team is always asking for those.

**Database Stuff**
RDS goes in private subnets only. Encrypt everything with KMS, set up backups, and use Secrets Manager for passwords. None of this hardcoded password nonsense.

**Monitoring and Compliance**
Turn on CloudTrail everywhere, get AWS Config running with compliance rules, and enable GuardDuty for threat detection. Also throw in CloudWatch dashboards and WAF protection. The auditors love seeing all this stuff.

**IAM and Access Control**
Keep permissions tight - principle of least privilege and all that. Use roles instead of users where possible, enforce MFA, and log everything. No more root account shenanigans.

**Lambda Functions**
Keep them in private subnets, log everything properly, and don't give them more permissions than they need. Set reasonable timeouts so we don't get surprise bills.

**Encryption Keys**
Set up KMS keys that rotate annually. Use them for everything - S3, EBS, RDS, you name it. Security team insists on customer-managed keys.

**A few things to keep in mind:**

Everything needs to go in one main.tf file - makes it easier to review and deploy. This has to be production-ready stuff that'll pass our security reviews. We need to hit SOC2, PCI-DSS, and GDPR compliance requirements.

Keep costs reasonable but don't sacrifice availability. Multi-AZ everything important, set up proper backups, and make sure we can monitor what's going on.

**Naming and Organization**

Stick with the "prod-" prefix for everything. Keep names descriptive but not crazy long. And please add comments - future you will thank present you.

The final Terraform file should actually work when we run it. Include all the provider stuff, make sure dependencies are right, tag everything consistently, and give us some useful outputs.

**What We're Really After**

Look, at the end of the day we need bulletproof security. Encrypt everything, lock down network access, follow least privilege for permissions, and log absolutely everything. The compliance folks and security team need to sleep well at night.

**The Non-Negotiables**

Seriously, no S3 buckets can be public. Block it at the account level and bucket level. We learned this lesson the hard way.

For compute and storage, encrypt all EBS volumes, make sure EC2 instances use encrypted AMIs, and RDS storage needs encryption too. Don't enable deletion protection on RDS though - makes updates a pain. Everything needs to use SSL/TLS for data in transit.

On the IAM front, use roles instead of hardcoded credentials. Force MFA for users, block root access keys entirely, and keep permissions minimal. Lambda functions should only get the permissions they absolutely need.

**Logging and Monitoring Setup**

Turn on CloudTrail everywhere and dump logs to a central encrypted S3 bucket. Don't enable deletion protection - we need flexibility for maintenance.

Get AWS Config running with rules for:
- S3 encryption checks
- EBS encryption validation  
- RDS encryption verification
- MFA requirements
- Root access key monitoring

Set up automatic fixes where possible. Store all these logs in the same central bucket.

Enable GuardDuty and push findings to CloudWatch. Turn on VPC Flow Logs too - security team uses these for incident response.

For WAF, use the managed rule groups and set up IP blocking for known bad actors.

**Central Logging**

Everything goes to one encrypted S3 bucket with "prod-logs-" prefix. CloudTrail, Config, VPC Flow, GuardDuty - the whole nine yards.

**Network and Encryption**

VPC with public and private subnets, security groups locked down to only what's needed, and flow logs enabled everywhere.

KMS keys should rotate annually and be used for S3, EBS, RDS, CloudTrail, and Config. Skip deletion protection here too.

**Bottom Line**

I need one complete main.tf file that includes everything - providers, VPC, security groups, IAM, S3, CloudTrail, Config, GuardDuty, Flow Logs, WAF, KMS, RDS, EC2, Lambda. All encrypted, all monitored, all prefixed with "prod-", and absolutely no deletion protection anywhere.

The file needs to actually work when we terraform apply it. Include good comments so the team understands what each piece does for security.

Can you put together something that covers all this? The security review is next week and we need this rock solid.