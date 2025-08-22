# CI/CD Pipeline Setup using AWS CDK

## Overview
We need to create a  cdk typescript stack to set up a **CI/CD pipeline** on **AWS**.  
The pipeline should handle the complete process of fetching the source code, building it, and deploying it to multiple regions in a **secure** and **automated** way.

The final deliverable will be a YAML template named **`cicd_pipeline.yaml`** that can be deployed directly using AWS CloudFormation.

---

## Project Information
- **Project Name:** IaC - AWS Nova Model Breaking
- **Environment:** AWS CloudFormation
- **Difficulty Level:** Hard
- **Final Output:** `cicd_pipeline.yaml`

---

## Requirements

### 1. S3 Bucket for Artifacts
- Create an **S3 bucket** to store pipeline artifacts.
- Enable **AES-256 encryption** to secure stored data.
- Enable **versioning** so older artifacts are retained when replaced.

### 2. CI/CD Pipeline (AWS CodePipeline)
- Use **AWS CodePipeline** to define the pipeline.
- The pipeline should have **three stages**:
  1. **Source** → Fetch code from **CodeCommit**.
  2. **Build** → Use **CodeBuild** to compile, test, and package the application.
  3. **Deploy** → Deploy the final artifacts to **us-east-1** and **us-west-2**.
- The pipeline must be **automatically triggered** whenever a new commit is pushed to the **main** branch.

### 3. Source Stage (AWS CodeCommit)
- Create a **CodeCommit repository** to host the application's source code.
- Set up the pipeline to pull the latest code from the **main** branch.

### 4. Build Stage (AWS CodeBuild)
- Use **AWS CodeBuild** for building and packaging the application.
- Use **environment variables** to manage build configurations.
- Enable **detailed build logs** for better debugging and monitoring.

### 5. Multi-Region Deployment
- The pipeline must support deployments in **two AWS regions**:
  - **us-east-1**
  - **us-west-2**

### 6. IAM Roles & Permissions
- Create **IAM roles** to provide the required permissions for:
  - CodePipeline  
  - CodeCommit  
  - CodeBuild  
  - S3  
- Follow the **principle of least privilege** to ensure security.

### 7. Logging & Monitoring
- Enable logging for:
  - CodePipeline execution
  - CodeBuild builds
  - S3 bucket access
- This helps track issues and improve visibility into the pipeline's behavior.

### 8. YAML Template
- The entire CloudFormation template must be written in **valid YAML**.
- It should pass **CloudFormation validation** without errors.

---

## Key Constraints
- Must use **AWS CodePipeline** for CI/CD.
- Must include **three stages**: Source → Build → Deploy.
- Must integrate **CodeCommit** as the source repository.
- Must use **CodeBuild** for building the project.
- Must deploy to **us-east-1** and **us-west-2**.
- Must configure **environment variables** in CodeBuild.
- Must store artifacts in an **S3 bucket** with **AES-256 encryption** and **versioning enabled**.
- Must use **IAM roles** for secure permissions.
- Must have **detailed logging** for all stages.
- Must trigger the pipeline on **every commit** to the **main** branch.
- Must be in single file

---

## Final Goal
Set up a **robust** and **secure** CI/CD pipeline using AWS cdk stack that integrates:
- **CodePipeline** for orchestration
- **CodeCommit** for source control
- **CodeBuild** for building and testing
- **S3** for artifact storage
- **IAM roles** for permission management

The outcome should be a **production-ready**, **multi-region** CI/CD setup that can be deployed seamlessly.