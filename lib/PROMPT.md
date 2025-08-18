# Problem Specification: CI/CD Pipeline Integration with AWS CloudFormation

## Environment
The goal of this challenge is to design and implement an **expert-level CI/CD pipeline** using **AWS CDK - Typescript**.  

The pipeline should leverage AWS native services to achieve high availability, secure automation, and reliable delivery of applications. The final deliverable must be a **valid YAML CloudFormation template** that can be deployed and tested.  

---

## Requirements

1. **CI/CD Workflow**
   - Fully automated pipeline using:
     - **AWS CodePipeline** (orchestration).  
     - **AWS CodeBuild** (build automation).  
     - **AWS CodeDeploy** (deployment automation).  

2. **Deployment Strategy**
   - Implement **blue-green deployments** to minimize downtime.  
   - Ensure **automatic rollback** on failure.  

3. **Artifact Storage**
   - Use **Amazon S3** to store build artifacts.  

4. **Tagging**
   - Tag all resources with:  
     - `Project: CI-CD-Example`  

5. **Networking & Availability**
   - Deploy in the **us-west-2** region.  
   - Support **multi-AZ deployments** for high availability.  

6. **Security & IAM**
   - Create **IAM roles with least privilege** for all pipeline components.  
   - Enforce **security best practices**.  

7. **Logging & Monitoring**
   - Enable **logging** for all components (CodePipeline, CodeBuild, CodeDeploy, S3).  

8. **Approval Workflow**
   - Include a **manual approval step** before deploying to production.  

9. **Documentation**
   - Clearly document all resources and steps.  
   - Ensure resources follow naming conventions:  
     - `ci-cd-<resource-type>-<environment>`  

---

## Constraints

- Pipeline must support **blue-green deployments**.  
- Infrastructure must be defined in **YAML format** using CloudFormation.  
- **CodePipeline** for CI/CD orchestration.  
- **CodeBuild** for build automation.  
- **CodeDeploy** for automated deployments.  
- All resources must have the tag `Project: CI-CD-Example`.  
- IAM roles must follow **least privilege** principles.  
- Enable logging across all pipeline components.  
- Pipeline must support **automatic rollback** on deployment failure.  
- Store artifacts in **S3**.  
- Deploy application stack across at least **two Availability Zones**.  
- **Manual approval** required before production release.  
- Document all resources for future reference and cost management.  

---

## Proposed Statement
The solution should target a **multi-account AWS environment**:
- **Primary account** → Hosts the CI/CD pipeline tools.  
- **Secondary accounts** → Used for **development**, **staging**, and **production deployments**.  

All resources must comply with **standard naming conventions**: