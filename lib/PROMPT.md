We need to build out a CDKTF project in TypeScript that can manage Amazon ECS deployments across multiple AWS accounts and regions. The idea is to make the setup reusable so we can bring up Dev, Test, and Prod (and other environments later) without rewriting the stack. Security and compliance need to stay front and center.

Things this setup should handle:

- Make VPC IDs, AMI IDs, and other environment details configurable so the same code works everywhere.
- ECS clusters and services need to be deployed in a consistent way across the regions we specify.
- IAM roles should stick to least privilege—only what ECS, CloudFormation, and supporting pieces really need.
- Data at rest (S3, RDS, ECS secrets, etc.) must be encrypted with KMS keys that are created per environment.
- CloudWatch logging should be wired up for ECS tasks and services.
- Stack changes should send notifications through SNS in each region so the right team sees them.
- All resources need proper tagging, especially cost allocation tags, so we can keep track of spend by environment and region.

The deliverable is a working CDKTF setup in TypeScript that meets the above points, validates, and deploys cleanly. It should follow AWS best practices so it’s easy to scale and maintain.
