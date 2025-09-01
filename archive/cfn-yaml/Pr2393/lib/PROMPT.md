# AWS CI/CD Pipeline Infrastructure (CloudFormation)

## Objective
Design and implement an **AWS CloudFormation template** to orchestrate a secure, highly available **CI/CD pipeline** that automates application delivery across multiple environments.

## Requirements

### 1. Source Control
- The pipeline must pull source code from a specified **GitHub repository** (parameterized).
- Support for future integration with **AWS CodeCommit**.

### 2. Build & Test
- Use **AWS CodeBuild** to compile and test the application.
- Enforce **logging and auditing** of build logs.
- Ensure all build artifacts are encrypted with **AWS KMS**.

### 3. Deployment
- Deploy the application to **AWS Elastic Beanstalk** environments:
  - **Development**
  - **Testing**
  - **Production**
- Enable **rollback mechanisms** to maintain application availability on deployment failure.
- Deploy across **us-east-1** and **us-west-2** regions.

### 4. Notifications
- Notify the development team of **build and deployment status** via **SNS topics**.
- Notifications must cover both **success** and **failure** cases.

### 5. Security & Compliance
- Follow **least privilege principle** for IAM roles and policies.
- Enforce **encrypted connections** to **S3 buckets**.
- Utilize **AWS KMS** for all sensitive data encryption at rest.
- Enable detailed **logging for all pipeline stages** for auditing and compliance.
- Apply **organizational tagging standards** for cost and usage tracking.

### 6. Parameterization & Flexibility
- Template parameters must allow easy customization of:
  - Repository details (URL, branch).
  - Elastic Beanstalk environment configurations.
  - SNS topic subscriptions (e.g., email addresses).

### 7. Best Practices
- Ensure all resources include:
  - **Tags** (`Environment`, `Project`, `Owner`, `CostCenter`).
- Ensure template is **modular, reusable, and secure**.
- Validate deployment in a **sandbox AWS account** before production rollout.

---

## Expected Deliverables
- A valid **CloudFormation YAML template** meeting the requirements above.
- Ability to validate and deploy the stack in **us-east-1** and **us-west-2**.
- Documentation on parameter usage, security practices, and rollback behavior.

--- 