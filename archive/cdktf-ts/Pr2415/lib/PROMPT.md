We need to put together a CDKTF (TypeScript) setup that helps set up environment into AWS while sticking to best practices for security, high availability, and operations. The setup should work in us-east-1 and the code should be monolithic and all code should be in one main file.

Here’s what the build needs to include:

- A VPC that spans at least two Availability Zones, with two public subnets and two private subnets.
- Each public subnet should run an EC2 instance. These instances need to be locked down: only SSH and HTTP access, and only from a specific set of predefined IP ranges. No open inbound rules.
- The database tier should use Amazon RDS with Multi-AZ deployment for resilience.
- S3 buckets should be used for file storage, with encryption at rest turned on by default.
- CloudWatch alarms must be wired up to monitor EC2 health and trigger notifications to a specific email address if thresholds are breached.
- IAM roles and policies should follow least privilege. Every resource should only get the access it really needs.
- Add an Application Load Balancer to spread incoming traffic across the EC2 instances in the public subnets.
- Make sure all resources (EC2, RDS, S3, etc.) are tagged according to the project tagging policy (Environment, Owner, Project).

Expected output is a working CDKTF (TypeScript) project that generates the infrastructure above. The code should validate successfully, deploy cleanly, and be flexible enough to run in the region.
