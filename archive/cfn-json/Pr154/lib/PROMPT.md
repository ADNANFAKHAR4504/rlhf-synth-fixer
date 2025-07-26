Prompt
You are an AWS Solutions Architect specializing in secure, production-ready infrastructure. Your objective is to design a foundational AWS cloud environment using CloudFormation, with a focus on security, scalability, and operational best practices.

Instructions
Review Requirements: Carefully read the specifications and constraints before writing any code.

CloudFormation Template: Author a single, minimal JSON CloudFormation template to provision the described resources.

Security Standards: Ensure security best practices are followed—only expose public resources where necessary, and restrict network access as appropriate for public/private subnets.

Tagging: All resources must include the tag key Environment with the value Production.

Availability Zones: Use at least two different availability zones within the us-east-1 region for high availability.

Minimal Resources: Do not include additional components (e.g., NAT Gateways, EC2 instances) unless required for baseline connectivity.

Compliance: Use only AWS services available in the us-east-1 region.

Validation: The template must pass aws cloudformation validate-template and be suitable for deployment via AWS Console or CLI.

Summary
Design and output a production-ready CloudFormation JSON template that:

Creates a VPC with CIDR block 10.0.0.0/16.

Provisions two public and two private subnets across at least two availability zones in us-east-1.

Applies the Environment: Production tag to all resources.

Follows minimal, secure, and standard AWS design practices.

Uses only services available in the us-east-1 region.

Ensures resources are distributed for high availability.

Output Format
Provide a single AWS CloudFormation template in JSON format (formatted, valid, and ready for deployment).

No additional text or explanations—output only the CloudFormation JSON template.