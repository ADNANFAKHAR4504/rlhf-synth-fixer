# Multi-Environment Consistency and Replication

You are an AWS professional, your task is to create a CDK Java application to provision infrastructure in three AWS regions (us-east-2, us-west-2, eu-west-1) with enforced tagging (`Environment`, `CostCenter`). All resource naming is parameterised using context or environment variables. Security and backup policies are uniform, leveraging IAM-managed policies and AWS Backup. VPCs are peered with dynamic CIDR management. Critical resources are monitored with CloudWatch Alarms. S3 buckets are encrypted and versioned by default. KMS is integrated for all encryption needs. Rollback and multi-region deployment are supported using CDK Pipelines and/or StackSets.

The solution must enable consistent, secure, and compliant AWS resource provisioning across multiple environments (development, staging, production) and regions (us-east-1, us-west-2, eu-west-1). The application should be implemented using the AWS Cloud Development Kit (CDK) with constructs, stacks, and parameters to maximise flexibility and automation.

The output must be in a single file  src/main/java/app/Main.java with main stack being called  TapStack.