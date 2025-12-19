Role: You are a world-class DevOps engineer and Terraform expert specializing in architecting secure, scalable, and highly available multi-region infrastructures on AWS. Your code is exemplary, follows all best practices, and is production-ready.

Context: My organization is launching a global application that requires a robust foundation on AWS. The infrastructure must be defined as code using Terraform (HCL) to ensure reproducibility, version control, and automated deployments.

Goal: Your task is to generate a complete set of Terraform configuration files that will set up this multi-region cloud environment. The configuration must be flawless, pass all plan/apply validations, and strictly adhere to all security and architectural requirements listed below.

Detailed Requirements & Constraints (MUST be addressed in full):

Multi-Region Deployment:

Deploy identical resources in three specific AWS regions: us-east-1, eu-central-1, and ap-southeast-2.

The configuration must use a provider aliasing strategy to manage these multiple regions efficiently from a single Terraform state.

Networking (VPC & Subnets):

In each of the three regions, create one VPC.

Each VPC must have a CIDR block that is unique and does not overlap with the others (e.g., 10.0.0.0/16 for us-east-1, 10.1.0.0/16 for eu-central-1, 10.2.0.0/16 for ap-southeast-2).

For each Availability Zone (AZ) within a region's VPC, you must create:

One Public Subnet: Its traffic should be routable to and from the internet via an Internet Gateway.

One Private Subnet: Its traffic should NOT be routable directly from the internet.

You must determine the number of AZs per region programmatically (using data sources) to maximize availability, not hard-code it.

All subnets must have appropriate route tables:

Public Route Table: Associated with all public subnets, containing a route 0.0.0.0/0 -> igw.

Private Route Table(s): Associated with all private subnets. It should have a route to the VPC-local network but no route to an Internet Gateway.

Security (Non-Negotiable Least Privilege):

Create security groups that rigorously follow the principle of least privilege.

Public Security Group (for resources in public subnets):

Allow inbound TCP traffic only on ports 80 (HTTP) and 443 (HTTPS) from any IPv4 address (0.0.0.0/0).

Allow all outbound traffic (for updates and fetching packages).

Private Security Group (for resources in private subnets):

By default, allow no inbound traffic from the public internet.

Example of a necessary rule: Allow all inbound traffic from within the VPC's CIDR block (e.g., 10.0.0.0/16) for internal communication between services. Specify this.

Allow all outbound traffic.

Code Quality & Maintainability:

USE REUSABLE TERRAFORM MODULES. Do not write all code in a single main.tf file. The structure must be modular.

Create a reusable module for the VPC setup (including subnets, route tables, gateways, and security groups). This module will be called once for each region.

Use consistent and descriptive naming conventions. All resources must have tags and names that include the environment (e.g., prod, staging) and the region (e.g., use1, euc1, apse2) for easy identification. (Assume environment is "prod").

Use variables for configurable values like CIDR blocks, common tags, and region lists to avoid hard-coding.

Validation & Execution:

The generated code must be syntactically correct and valid HCL.

It must be designed to execute successfully with terraform init, terraform plan (showing no errors or unexpected actions), and terraform apply.

Expected Output Format: Provide the complete code for the following files. Do not describe the code, write the actual HCL code.

providers.tf: Configure the AWS provider with aliases for all three regions.

variables.tf: Define all input variables (e.g., aws_regions, environment, vpc_cidrs).

main.tf: This is the root module. It should call the reusable VPC module for each region, passing the respective provider and region-specific variables.

modules/vpc_setup/main.tf: The main file for the reusable VPC module.

modules/vpc_setup/variables.tf: The variables required by the VPC module.

modules/vpc_setup/outputs.tf: Outputs from the VPC module (e.g., VPC ID, public/private subnet IDs).

outputs.tf (in root): Outputs from the root module, potentially exposing important IDs from each region.

Final Instruction: Generate the complete code for these files now, ensuring every requirement and constraint from the above list is perfectly implemented. The code should be ready to run.

give me all in single file only