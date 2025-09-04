You are an expert DevOps engineer specializing in Infrastructure as Code (IaC) with a focus on security and modularity. Your task is to generate production-ready Terraform CDK code using TypeScript to deploy a secure application infrastructure on AWS in the us-east-1 region.

The code must be organized into exactly two files: lib/tap-stack.ts for the main stack definition and lib/modules.ts for reusable infrastructure components.

Project Requirements & Security Mandates:

Region & Naming: All resources must be configured for the us-east-1 region. Use specific, clear naming conventions for resources (e.g., secure-app-vpc, public-frontend-sg, app-kms-key).

VPC Configuration:

The RDS instance must be deployed into a specific private subnet.

Security Best Practices (Strictly Enforce):

S3 Bucket Encryption: All S3 buckets created must have server-side encryption (SSE-S3) enabled by default.

EC2 Instance Accessibility: No EC2 instance should be assigned a public IP address. All instances must reside in private subnets.

Restricted Security Group Ingress: Absolutely no security group should allow unrestricted ingress (0.0.0.0/0) to SSH (port 22) or RDP (port 3389). Traffic should be restricted to known sources.

RDS Instance Placement: The RDS database instance must be placed within the specified VPC and subnet ID.

CloudTrail Logging: Configure a CloudTrail trail to ensure logging is enabled for all management events across the regions

Encrypted RDS Snapshots: Ensure that the RDS instance is configured so that all automated and manual snapshots are encrypted.

KMS Key Rotation: Create a customer-managed KMS key for encrypting the RDS instance. This key must be configured for automatic, annual rotation (enable_key_rotation = true).

Required Code Structure:

Organize the entire output into the following two files:

lib/modules.ts

This file must contain all the reusable, modular components for the infrastructure.

Each component should be a TypeScript class extending TerraformModule.

Create separate, well-defined classes for key resources like Security Groups, S3, RDS, EC2, ALB, and KMS.

These modules should be designed to accept configuration parameters through their constructors to ensure they are reusable.

lib/tap-stack.ts

This file will define the main stack class, which extends TerraformStack.

It must import the modular components from lib/modules.ts.

Within this stack, instantiate the modules to compose the final infrastructure.

Connect the modules as needed (e.g., pass the security group ID from the security group module to the EC2 module).

This is where you will use the specific VPC and subnet IDs for lookup and resource placement.

also give me output at last in tap-stack.ts using terraform output

Expected Output:

Provide two complete, well-commented TypeScript code blocks corresponding to the lib/tap-stack.ts and lib/modules.ts files. The code should be clean, production-ready, and directly usable in a Terraform CDK project. It must pass validation (cdktf synth) and perfectly exemplify the security and structural requirements outlined above.