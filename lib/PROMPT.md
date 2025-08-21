You are tasked with creating an AWS CDK application in Python to provision a secure, high-availability web application infrastructure. The CDK stack must be structured so that the `tap.py` file at the root serves as the main entry point (like `app.py`), and the stack implementation resides in `lib/Tapstack.py`. The application should define all resources in code, synthesize them into CloudFormation templates, and be deployable without manual intervention.

---

## Requirements

- **Networking**
  - Provision a VPC spanning at least two availability zones.
  - Include both public and private subnets.
  - Configure route tables to properly isolate public and private traffic.

- **Compute**
  - Deploy an Auto Scaling Group of EC2 instances.
  - Place EC2 instances behind an Elastic Load Balancer.
  - Use Security Groups for layered security.

- **Storage**
  - Create S3 buckets with:
    - Server-side encryption enabled.
    - All public access blocked.
  - Provision DynamoDB tables with point-in-time recovery enabled.

- **Databases**
  - Deploy RDS databases inside private subnets.
  - Ensure databases are not directly accessible from the internet.
  - Store sensitive credentials (e.g., DB password) in AWS Secrets Manager.

- **Identity and Security**
  - Define IAM roles explicitly, enforcing least-privilege access.
  - Enable AWS Config to track and monitor configuration changes.
  - Attach AWS WAF to a CloudFront distribution to protect against common web exploits.

---

## Constraints

- All resources must exist within a **single CDK stack**.
- The infrastructure must be deployed in **us-west-2**.
- Subnets must be distributed across **two availability zones** to ensure redundancy.
- Security Groups must be explicitly defined and applied to EC2 instances.
- No database or sensitive service should be internet-facing.
- Consistent naming conventions must be applied:
  - Format: `project-name-resource-type`.

---

## Proposed Statement

The AWS CDK application will deploy a full infrastructure stack in the **us-west-2 region**, leveraging **at least two availability zones** for resilience and high availability. The stack will include a secure VPC with isolated subnets, EC2 instances running within an Auto Scaling group behind a load balancer, and properly scoped IAM roles enforcing least-privilege permissions. Storage services like S3 and DynamoDB will be provisioned with encryption and recovery features enabled, while RDS databases will run exclusively in private subnets with credentials stored securely in AWS Secrets Manager. To maintain compliance and strengthen defenses, AWS Config will monitor infrastructure changes, and AWS WAF integrated with CloudFront will mitigate common web threats.

All resources will be defined in Python CDK constructs inside `lib/Tapstack.py` and synthesized via `tap.py` into valid CloudFormation templates for automated deployment.