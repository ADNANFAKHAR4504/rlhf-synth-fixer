You are to create a Terraform configuration in HCL to set up a secure and highly available AWS environment. The solution must meet the following constraints:

Terraform Backend (S3 )

Store Terraform state files in an S3 bucket using the backend "s3" configuration.

VPC with High Availability

Create a VPC containing both public and private subnets.

Deploy the subnets across two Availability Zones for redundancy and high availability.

Limit permissions strictly to the actions required for reading/writing state files.

Code Structure Constraint

The solution must consist of only two files:

modules.ts: Contains all resources and modules (VPC, IAM, subnets, backend configuration, etc.).

tapstack.ts: Imports resources from modules.ts and composes the environment.

Output Requirements:

Include all necessary modules, resources, and variables.

The configuration must pass terraform validate without errors.

Follow Terraform best practices for naming, tagging, and modular structure.