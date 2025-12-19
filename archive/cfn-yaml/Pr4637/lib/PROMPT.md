I’m looking to create a production-grade AWS infrastructure using CloudFormation (YAML) that’s secure, resilient, and compliant with best practices. The goal is to design a highly available environment for a web application that includes networking, compute, database, and monitoring components — all defined in a single CloudFormation template called webapp_infra.yaml.

The setup should start with a VPC supporting both IPv4 and IPv6, containing public and private subnets spread across multiple Availability Zones for fault tolerance. Only specific inbound and outbound traffic should be allowed through tightly scoped security groups. All EC2 instances must be deployed within private subnets and attached to IAM roles granting only the minimal actions required for application functionality. To enable controlled internet access, include a NAT Gateway for outbound traffic from private subnets.

A managed RDS instance should reside in a private subnet with encryption and automated backups enabled. The Application Load Balancer will handle incoming HTTPS traffic using an SSL certificate from ACM, ensuring end-to-end encrypted communication. Logs and performance metrics should be collected using CloudWatch, with detailed monitoring activated for EC2 instances.

For data storage and compliance, provision S3 buckets that are private by default, enforce server-side encryption, and use bucket policies to ensure strict access control. Sensitive configurations should be managed through SSM Parameter Store, while KMS keys protect data at rest across all encrypted services.

Add a Lambda function that automatically remediates any security group misconfigurations, and ensure notifications for any WAF rule changes via SNS. Include ElastiCache clusters configured in multi-AZ mode for high availability. The entire template must be reusable across staging and production environments using parameters, and must pass CloudFormation Linter checks with zero errors.

Lastly, Make sure every resource is tagged consistently with Owner, Environment, and CostCenter. All resources should be deployable in the us-east-1 region while remaining portable to others without modification.
