You are a highly experienced Prompt Engineer. Your task is to generate Terraform HCL code for Infrastructure as Code (IaC) that satisfies the following requirements.

**Constraints:**
- Resource names must strictly follow the pattern `projectname-resource`, where `projectname` is a variable in your configuration. The provided data must remain intact and must not be altered in any way.
- The setup must include an S3 bucket with versioning enabled, located in the `us-west-1` AWS region.
- A DynamoDB table must be created with on-demand capacity and a partition key named `id`.

**Environment and Requirements:**
- Create a Terraform configuration to set up a basic cloud environment.
- The environment must contain:
  1. An S3 bucket with versioning enabled, located in the `us-west-1` region.
  2. A DynamoDB table with on-demand capacity and a partition key named `id`.
- Ensure all resource names follow the pattern `projectname-resource`, with `projectname` defined as a configurable variable within the script.
- The resulting configuration must be valid Terraform HCL, suitable for a single AWS account in the `us-west-1` region.
- The configuration should be easily replicable across environments and allow for straightforward future expansion of resources.
- Output should be a single `.tf` file containing all necessary code to deploy the resources without errors.

**Proposed Statement:**
The setup is intended for a single AWS account in the `us-west-1` region. The configuration should allow easy replication into other environments and enable future expansion of resources. All resource naming must use a specific variable for the project name.

**Instructions:**
Generate a complete, functional Terraform HCL configuration that satisfies all requirements above. Do not modify the constraints or data in any way. Ensure the output is ready to be saved as a `.tf` file and applied directly.

