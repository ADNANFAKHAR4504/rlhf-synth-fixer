# CI/CD Pipeline Setup with AWS CloudFormation (CDK - TypeScript)

## Overview
You are tasked with designing and implementing a **robust, multi-stage CI/CD pipeline** for a cloud-native application using **AWS CloudFormation (CDK in TypeScript)**.  
The pipeline must integrate with **GitHub**, leverage **AWS CodePipeline**, and ensure secure, reliable, and cost-efficient deployments across multiple AWS regions.

---

## Requirements

### Pipeline Orchestration
- Use **AWS CodePipeline** to orchestrate the CI/CD workflow.
- Implement a **multi-stage deployment approach** with stages:
  - **Development**
  - **Testing**
  - **Production**

### Source Control
- Integrate **GitHub** as the source repository.
- Ensure integrity of source code using **Git clone URL validation** with AWS CodeCommit as backup.

### Build & Test
- Use **AWS CodeBuild** for:
  - Building the application.
  - Running **unit tests** and **integration tests** in the **testing stage**.

### Deployment
- Deploy resources using **AWS CloudFormation stacks**.
- Implement **rollback strategies** upon deployment failure.
- Include a **manual approval step** before production deployment.

### Security & Compliance
- Apply **IAM roles** with **least privilege** access for pipeline components.
- Use **AWS KMS** to encrypt sensitive information.
- Store secrets (e.g., GitHub token, DB credentials) securely in **AWS Secrets Manager**.

### Monitoring & Notifications
- Configure **Amazon SNS** for pipeline event notifications.
- Enable **CloudWatch logging & monitoring** for pipeline activities.

### High Availability & Cost Optimization
- Ensure high availability by deploying the pipeline in **multiple AWS regions**.
- Optimize for cost efficiency by selecting appropriate AWS services and instance types.
- Use **DynamoDB** for storing build artifacts metadata.

---

## Deliverables
- **TypeScript CDK code** defining the CI/CD pipeline.
- The pipeline must be:
  - Secure
  - Highly available
  - Cost-optimized
  - Fully automated (with manual approval for production)
- All tests (unit + integration) must pass when the pipeline executes.

---

all stack  resorunce creation is in one file ,  and entrypoint is in Bin folder , also test case shoud be diffrent file