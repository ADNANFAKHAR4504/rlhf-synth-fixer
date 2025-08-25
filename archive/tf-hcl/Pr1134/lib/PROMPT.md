Here's a comprehensive prompt designed to guide the creation of a Terraform configuration for a CI/CD pipeline, adhering to all specified requirements and best practices.

---

## Terraform CI/CD Pipeline for AWS Application

---

### Objective

As a senior DevOps engineer, your task is to design and implement a robust **CI/CD pipeline** using **Terraform** to deploy an application to AWS. This pipeline will leverage **GitHub** for source code management and **CircleCI** for automated testing and deployment, ensuring a streamlined, secure, and reliable delivery process. The deployment will target a **staging environment** within a specific AWS account.

---

### Core Architectural Components

The Terraform configuration must define the following AWS and CI/CD components:

- **AWS S3 Bucket**: Dedicated for storing application artifacts, with versioning enabled.
- **AWS IAM Role and Policy**: A finely-tuned IAM role that CircleCI will assume to interact with AWS, adhering to the principle of **least privilege**.
- **GitHub Repository Integration**: The pipeline must be configured to react to code changes in a specified GitHub repository.
- **CircleCI Configuration (`.circleci/config.yml`)**: This file will orchestrate the entire CI/CD workflow, including build, test, and deployment stages.

---

### Technical Specifications & Constraints

- **Infrastructure as Code (IaC)**: The entire AWS infrastructure and relevant configurations must be defined using **Terraform configuration files (.tf)**.
- **Cloud Provider & Region**: All AWS resources must be deployed in the **`us-east-1`** region.
- **AWS Account Context**: The deployment is for a **staging environment** under AWS Account ID `123456789012`. The Terraform AWS provider should be explicitly configured to use this account ID (e.g., via `assume_role` or by assuming the CircleCI environment's credentials are tied to this account).
- **Naming Convention**: All created AWS resources **must follow the naming convention**: `<resource-type>-myproject-<identifier>`. For example:
- S3 bucket: `s3-myproject-artifacts`
- IAM role: `iam-myproject-circleci-role`
- **Artifact Storage**:
- An **S3 bucket** must be created for artifact storage.
- This S3 bucket **must have versioning enabled**.
- **CI/CD Pipeline with CircleCI**:
- The CircleCI pipeline must be triggered by **code changes** in a **GitHub repository**.
- The pipeline (`.circleci/config.yml`) must include explicit **automated testing steps** that validate the application code _before_ deployment.
- The deployment (`terraform apply`) should only proceed if all automated tests pass successfully.
- **Sensitive Data Handling**: AWS credentials and other sensitive data required by CircleCI for deployment **must be handled using environment variables** within the CircleCI project or workflow (e.g., `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`). These should _not_ be hardcoded in Terraform or `.circleci/config.yml`.

---

### Expected Output

Provide a functional setup within a single response, including the following:

1. **Terraform Configuration Files**: A set of `.tf` files (`main.tf`, `variables.tf`, `outputs.tf`, `versions.tf` as appropriate) that define the S3 bucket, IAM role/policy, and any other necessary AWS resources.
2. **CircleCI Configuration File**: A complete `.circleci/config.yml` file that defines the CI/CD workflow, including build, test, and Terraform deployment steps.
3. **README.md Content**: The content for a `README.md` file that explains:
- The architecture of the CI/CD pipeline.
- How to set up the GitHub repository, AWS credentials (including the IAM role for CircleCI), and CircleCI project.
- Instructions on triggering and monitoring deployments.
- Expected outcomes of a successful pipeline run.

The entire solution should be designed for **demonstrability through an initial test deployment**, implying readiness for practical application.

---
