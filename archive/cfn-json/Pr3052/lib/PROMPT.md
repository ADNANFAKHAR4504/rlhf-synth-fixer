# CloudFormation Template Prompt: Multi-Account, Multi-Region CI/CD Pipeline on AWS

## Goal

Generate a **JSON-formatted AWS CloudFormation template** that provisions a **CI/CD pipeline using AWS CodePipeline** to deploy a web application in  AWS account. The pipeline must incorporate best practices for security, compliance, and operations.

---

## Requirements

### 1. CI/CD Pipeline Components

- **Source**: Application source code is hosted on **GitHub**.
- **Build**: Use **AWS CodeBuild** to build the application.
- **Deploy**: Use **AWS CloudFormation StackSets** to deploy across:
  - **Environments**: `Any`
  - **Regions**: `us-east-1`

---

### 2. Pipeline Workflow

- Include a **manual approval step** *before deploying to production*.
- Configure **Amazon SNS notifications** for:
  - Manual approval requests
  - Build success or failure

---

### 3. Security & Compliance

- **Encrypt all S3 artifacts** used by CodePipeline with **AWS KMS**.
- Enable **CloudWatch Logs** for:
  - CodePipeline
  - CodeBuild
  - CodePipeline
  - StackSet deployments (if applicable)
- Define **IAM roles** using the **principle of least privilege**.
- Ensure all resources are **tagged** using a consistent tagging policy, including:
  - `Environment`
  - `Owner`
  - `Project`

---

## Output Expectations

- A **single, valid JSON CloudFormation template** that:
  - Passes AWS CloudFormation validation
  - Sets up the complete CI/CD pipeline as described
  - Includes **parameterization** for reusable components:
    - GitHub repo URL and branch
    - SNS Topic ARNs
    - Account IDs (if needed for StackSets)
- Automatically applies **consistent tags** to all created resources.
- Uses **modular and readable** structure (nested stacks or logical groups where appropriate).

---

## Constraints

- Template must be in **JSON format only** (no YAML).
- **Do not hardcode credentials** (use GitHub token via Secrets Manager or AWS-native integration).
- **Only use native AWS services** (no third-party integrations).

---

## Assumptions

- Required **StackSet admin and execution roles** either exist or are provisioned within the template.
- GitHub access tokens or OAuth credentials are stored securely and referenced properly in CodePipeline.

---

