# CI/CD Pipeline Integration with AWS CDK

Create a AWS CDK stack using typescript to configure the ci/cd pipeline integration.

The pipeline should leverage AWS native services to achieve high availability, secure automation, and reliable delivery of applications. The final deliverable must be single cdk stack that can be deployed and tested.  

## Requirements

### CI/CD Workflow
   - Fully automated pipeline using:
     - AWS CodePipeline (orchestration).  
     - AWS CodeBuild (build automation).  
     - AWS CodeDeploy (deployment automation).  

### Deployment Strategy
   - Implement blue-green deployments to minimize downtime.  
   - Ensure automatic rollback on failure.  

### Artifact Storage
   - Use Amazon S3 to store build artifacts.  

### Tagging
   - Tag all resources with:  
     - `Project: CI-CD-Example`  

### Networking & Availability
   - Deploy in the us-west-2 region.  
   - Support multi-AZ deployments for high availability.  

### Security & IAM
   - Create IAM roles with least privilege for all pipeline components.  
   - Enforce security best practices.  

### Logging & Monitoring
   - Enable logging for all components (CodePipeline, CodeBuild, CodeDeploy, S3).  

### Approval Workflow
   - Include a manual approval step before deploying to production.  

### Documentation
   - Clearly document all resources and steps.  
   - Ensure resources follow naming conventions:  
     - `ci-cd-<resource-type>-<environment>`  

## Constraints

- Pipeline must support blue-green deployments.  
- Infrastructure must be defined in YAML format using CloudFormation.  
- CodePipeline for CI/CD orchestration.  
- CodeBuild for build automation.  
- CodeDeploy for automated deployments.  
- All resources must have the tag `Project: CI-CD-Example`.  
- IAM roles must follow least privilege principles.  
- Enable logging across all pipeline components.  
- Pipeline must support automatic rollback on deployment failure.  
- Store artifacts in S3.  
- Deploy application stack across at least two Availability Zones.  
- Manual approval required before production release.  
- Document all resources for future reference and cost management.  


## Proposed Statement
The solution should target a multi-account AWS environment:
- Primary account → Hosts the CI/CD pipeline tools.  
- Secondary accounts → Used for development, staging, and production deployments.  

All resources must comply with standard naming conventions: