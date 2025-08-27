## Prompt

The infrastructure should be fully codified using Terraform HCL,
following a modular design pattern to ensure reusability and maintainability.
Terraform version 1.3.0 or higher must be used.
The deployment will span three AWS regions: us-east-1, eu-west-1, and ap-southeast-1
Each environment should have its own Virtual Private Cloud (VPC) with a unique, non-overlapping CIDR block,
containing at least two public and two private subnets distributed across multiple Availability Zones for redundancy.
VPC peering connections must be established between all regional VPCs to allow secure inter-region communication without
traversing the public internet. Route 53 should be implemented to enable multi-regional DNS resolution.
Security groups and network ACLs need to be tightly configured to enforce least privilege access
for both inbound and outbound traffic.
Each region must run an Auto Scaling Group using Spot Instances to optimize costs.
Additionally, a PostgreSQL RDS instance should be deployed with read replicas
distributed across all regions to enhance high availability and read performance.
IAM roles and policies should be defined using reusable modules and must follow the principle of least privilege.
A centralized logging solution using Amazon CloudWatch Logs must be implemented,
with logs aggregated from all regions to ensure unified observability. All resources should be consistently
tagged with environment (e.g., dev, prod) and owner information. Lastly,
a Terraform remote backend with state locking and versioning should be used to manage
infrastructure state reliably across teams and environments.

**Instructions:**

The goal is to build an Infrastructure as Code (IaC) solution using Terraform to deploy a consistent,
multi-environment setup across three AWS regions. This solution must comprehensively address networking,
compute, database, and IAM configurations, following the defined constraints.
Each environment should include a uniquely defined VPC with a non-overlapping CIDR block,
deployed across multiple regions. Auto Scaling Groups should be configured using spot instances for cost efficiency.
while Amazon RDS must be provisioned with read replicas spanning multiple regions to ensure high availability and performance.
Centralized logging must be implemented using a unified configuration to aggregate logs across all regions.
The infrastructure code must use Terraform modules for reusable and maintainable VPC and IAM setup.
The Terraform HCL files should be properly structured into modules and tested for correctness. 
The deployment must be verified to ensure that the Terraform plan executes without errors and that the Terraform state is properly managed and isolated across all environments and regions.

**Instructions**
The infrastructure will be deployed on AWS, utilizing multiple regions for disaster recovery and latency optimization. 
Naming conventions must adhere to company standards, and CIDR ranges must be pre-approved by network security. 
Include tags to differentiate between environments.
