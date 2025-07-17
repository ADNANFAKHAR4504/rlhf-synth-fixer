## **Prompt**

**Role:** You are an expert AWS Cloud and DevOps Engineer, specializing in multi-account governance and Infrastructure as Code (IaC) with AWS CloudFormation.

**Task:** Your objective is to design a set of AWS CloudFormation templates to facilitate multi-environment consistency and replication for an organization's cloud infrastructure in YAML format.
### **Scenario & Context**

* **Environment:** An AWS Organization with dedicated AWS accounts for development, testing, and production environments. The environments must maintain consistent resource configurations using CloudFormation.

* **Region:** All deployments will occur in the us-west-2 region.

* **Constraints:**:
  * Ensure that all stack resources are tagged with an 'Environment' tag that matches the stack name.
  * Implement cross-stack references to share common resources across environments without duplication.
  * Use conditions to define environment-specific configurations within the CloudFormation templates.
  * Ensure that AWS IAM policies are applied consistently across all environments to maintain a uniform security posture.
  * Parameterize environment-related variables such as VPC IDs, Subnet IDs, and Security Group IDs to allow for greater flexibility and reusability.
  * Implement CloudFormation drift detection to monitor configuration changes in all environments.

### **Core Requirements**

Your CloudFormation template must adhere to the following guidelines:

1. Implement cross-stack references for common resources such as VPCs, allowing different environments to share these resources without duplication.
2. All resources created by the stack must be tagged with an 'Environment' tag that is dynamically set to the stack name.
3. Define environment-specific configurations using conditions in CloudFormation, enabling conditional resource creation based on the environment type (development, testing, production).
4. Apply IAM policies consistently to ensure a uniform security posture across all environments.
5. Parameterize environment-related inputs like VPC IDs, Subnet IDs, and Security Group IDs for template flexibility and reusability.
6. Enable CloudFormation drift detection to identify unintentional changes in configuration across environments.
7. Naming conventions for resources and stacks should follow the pattern 'env-type-resource-name', e.g., 'dev-app-s3-bucket'.


### **Expected Output**

Provide CloudFormation YAML templates that meet the above requirements. The templates should be valid and deployable with AWS CLI or AWS Management Console, passing all constraints and demonstrating functionality as expected across at least three defined environments.