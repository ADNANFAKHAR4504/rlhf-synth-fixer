We’re setting up an **infrastructure-as-code project using CDKTF** that should let us manage deployment of Amazon ECS across AWS accounts and region. The goal is to make the stack reusable and consistent, so we can stand up Dev, Test, and Prod (and future environments) with minimal changes, while keeping security and compliance tight.

Here are the main things this setup needs to cover:

1. **Parameterization for flexibility** – VPC IDs, AMI IDs, and other environment-specific details should be there. The same code works across different accounts and regions.
2. **ECS replication** – ECS clusters and services should be deployed consistently in the specified AWS region.
3. **IAM roles** – Any IAM roles created must follow least-privilege, with only the permissions required for ECS, CloudFormation execution, and supporting resources.
4. **Data protection** – KMS keys should be provisioned per environment and used to encrypt all data at rest, whether it’s RDS, S3, or ECS secrets.
5. **Logging and monitoring** – CloudWatch logging should be enabled for ECS tasks and services.
6. **Event notifications** – Stack actions and updates need to publish to SNS topics across region so the right teams get notified in real time.
7. **Tagging and cost tracking** – Every resource should have consistent tags, including cost allocation tags, so we can break down spend by environment and region.

**Expected output:** A complete CDKTF project written in TypeScript that deploys ECS cluster and related resources across account and region, meeting all the above requirements. It should pass validation, deploy cleanly, and follow AWS best practices for scalability, security, and maintainability.
