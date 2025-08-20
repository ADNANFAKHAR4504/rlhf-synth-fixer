This prompt describes the requirements for generating Terraform HCL code for a cloud infrastructure setup using AWS.

Requirements:
- The configuration must create an S3 bucket with versioning enabled in the `us-west-1` region.
- A DynamoDB table must be provisioned with on-demand capacity and a partition key named `id`.
- All resource names must follow the format: `${projectname}-${resource}`. The `projectname` should be a configurable variable.
- The solution should be appropriate for a single AWS account in the `us-west-1` region, but easily adaptable for other environments.
- All configuration should be contained in a single `.tf` file.
- The code should be straightforward, valid, and suitable for future expansion.
- The configuration must be ready to apply without modification and should not alter the specified constraints or data.

Objective:
Generate a complete, functional Terraform HCL configuration file that satisfies all requirements above. The output should be ready to use as a standalone `.tf` file for deployment.

Instructions:
- Use the `projectname` variable for all resource names as specified.
- Ensure the code is valid and free of errors.
- Do not modify or omit any of the requirements.