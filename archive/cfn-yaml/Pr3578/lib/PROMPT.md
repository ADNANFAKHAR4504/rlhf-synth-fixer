I need to create a production-ready AWS environment using CloudFormation YAML that sets up a secure and scalable infrastructure for a web application deployment. The template should be named secure-environment-setup.yaml and should fully comply with AWS best practices for security, availability, and cost efficiency.

Here’s the situation:
We’re deploying a web application in the us-east-1 region, using a dedicated VPC to isolate resources from other environments. The application will run in public subnets, while its associated Amazon RDS database will be placed in private subnets for security. Each subnet should have proper network ACLs configured to further harden the environment.

Security and compliance are a top priority. The infrastructure must define IAM roles and policies following the principle of least privilege — one for the application and another for the database access layer. Any sensitive data should be stored in an encrypted S3 bucket, with strict bucket policies and KMS-managed encryption keys to ensure proper data protection.

The system must use CloudWatch for centralized logging, monitoring, and alerting, including alarms for critical metrics like CPU utilization and memory usage. To handle varying loads, set up Auto Scaling with an Elastic Load Balancer (ELB) distributing traffic across EC2 instances in the public subnet.

All components, including VPC, subnets, EC2 instances, RDS, S3 buckets, IAM roles, and CloudWatch configurations, should have consistent naming conventions prefixed with prod- and include resource tagging for easy management. The RDS instance should be configured in multi-AZ mode for high availability and deployed exclusively in private subnets with no public access.

Additionally, enable AWS Config to continuously track configuration changes and support compliance auditing. If required, configure VPC peering to connect securely to other VPCs within the same organization. All aspects of the setup should reflect AWS Security Configuration as Code principles — from encryption at rest to IAM role isolation.

Finally, ensure the design remains cost-aware by optimizing Auto Scaling policies and referencing AWS Pricing Calculator estimates for major resources. The resulting CloudFormation stack should be fully validated and capable of being deployed without modification, following AWS’s security, scalability, and governance best practices.
