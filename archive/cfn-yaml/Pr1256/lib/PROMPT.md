# Notes for TapStack CloudFormation Setup

I'm putting together a CloudFormation file to define some core AWS infrastructure for TapStack primarily something we can reuse for both dev and prod environments. Everything will be in us-east-1.

The basic idea:

- Well need a VPC with multiple subnets (public + private) across two availability zones. 
- Public subnets will be used by the load balancer and NAT gateways; private ones for app servers and the database.
- An Auto Scaling Group should launch EC2 instances (at least two by default), and those should be behind an ALB.
- Well probably want to attach a WAF with AWS managed rules to protect the ALB.

For storage:
- An S3 bucket for our application artifacts or assets (should have versioning and encryption).
- A separate S3 bucket only for CloudTrail logs.

Database:
- Well use Postgres (version 12 or higher) in RDS. It needs to be Multi-AZ.
- The master password shouldnt be hardcoded it should come from Secrets Manager.

Monitoring & Security:
- CloudWatch alarms for high CPU usage.
- CloudTrail enabled and logging to the dedicated bucket.
- IAM roles for EC2 (mainly to allow S3 access).

Itd also be good if the template supports a Route 53 DNS record for the ALB domain name can be a parameter so its optional.
Everything should carry `Project` and `Environment` tags.

---

Outputs well need:
- VPC ID
- ALB DNS
- RDS endpoint
- S3 bucket names
- WAF Web ACL ID
- Auto Scaling Group name

Ill need all of this wrapped into a single YAML CloudFormation template with parameters for instance type, environment name, project name, and subnet CIDRs.
