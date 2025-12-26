We need to build out a CDKTF project in TypeScript that can manage Amazon ECS deployments across multiple AWS accounts and regions. The idea is to make the setup reusable so we can bring up Dev, Test, and Prod without rewriting the stack. Security and compliance need to stay front and center.

Things this setup should handle:

- Make VPC IDs, AMI IDs, and other environment details configurable so the same code works everywhere.
- ECS clusters and services need to be deployed in a consistent way across the regions we specify. The ECS tasks should connect to an Application Load Balancer for traffic routing.
- IAM roles should stick to least privilege - only what ECS, CloudFormation, and supporting pieces really need. The ECS task execution role needs to pull container images and write logs to CloudWatch.
- Data at rest in S3, RDS, and ECS secrets must be encrypted with KMS keys that are created per environment. The S3 buckets should have cross-region replication enabled to the replica bucket.
- CloudWatch logging should be wired up for ECS tasks and services so we can monitor what's happening. The ECS task definitions need to send logs to CloudWatch using the awslogs driver.
- Stack changes should send notifications through SNS in each region so the right team sees them. SNS topics need KMS encryption enabled.
- All resources need proper tagging, especially cost allocation tags, so we can keep track of spend by environment and region.

The deliverable is a working CDKTF setup in TypeScript that meets the above points, validates, and deploys cleanly. It should follow AWS best practices so it's easy to scale and maintain.
