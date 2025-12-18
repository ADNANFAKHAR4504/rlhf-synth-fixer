Prompt
You are an AWS Cloud Infrastructure Engineer specializing in Infrastructure as Code (IaC). Your task is to translate the following Terraform-based environment setup into an AWS CDK solution using TypeScript, with a clear focus on resource naming conventions, modularity, and best practices.

Instructions
Analyze Requirements:
Review all problem constraints and requirements carefully. Ensure the resulting CDK solution matches the desired AWS infrastructure and resource naming standards.

CDK Implementation:

Use AWS CDK (TypeScript) instead of Terraform.

Follow the file structure:

bin/tap.ts: Entry point, bootstraps the CDK app and stack.

lib/tap-stack.ts: Defines the main stack and resources.

cdk.json: CDK project configuration.

Implement the following in your stack:

VPC with CIDR block 10.0.0.0/16

Public subnet: 10.0.1.0/24

Private subnet: 10.0.2.0/24

Internet Gateway attached to the VPC

Public subnet routes traffic through the Internet Gateway

Use environment variables or CDK context for the environment name (e.g., dev, prod).

Ensure all resources use the naming convention: env-resource-type (e.g., dev-vpc).

Output Files:

Output must consist of three files:

bin/tap.ts

lib/tap-stack.ts

cdk.json

Best Practices:

Follow modular CDK patterns.

Ensure code is concise and easily maintainable.

Use latest stable version of AWS CDK.

Summary
You are to deliver an AWS CDK project (TypeScript) that:

Provisions a VPC (10.0.0.0/16) with one public subnet (10.0.1.0/24) and one private subnet (10.0.2.0/24) in the us-east-1 region.

Attaches an Internet Gateway to the VPC and routes public subnet traffic through it.

Names all resources as per the env-resource-type convention, where env is provided as a parameter or context variable.

Organizes the solution into the required CDK file structure.

Output Format
Output the complete content for the following three files:

bin/tap.ts

lib/tap-stack.ts

cdk.json

Do not include any explanatory text or comments outside the code.

Output only the code/file contents as per the required structure.