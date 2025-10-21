### model failure

### 1. Networking – Incorrect Private Subnet Routing

Model Response:
The configuration defined both public and private subnets but did not correctly associate route tables for private subnets. As a result, private subnets lacked outbound internet access for updates or package downloads.

Ideal Response Implements:
Introduces appropriate route table associations and NAT Gateway routing for private subnets, ensuring secure internet access from private instances.

### 2. Configuration – Inconsistent Resource Naming and Domain References

Model Response:
Several resources (VPC, EC2, RDS) used inconsistent naming conventions and generic identifiers such as main-vpc or my-key, leading to unclear resource mapping and maintainability issues.

Ideal Response Implements:
Applies consistent and descriptive naming conventions aligned with project variables (e.g., ${var.project_name}-vpc, ${var.environment}-rds-db), improving clarity and traceability.

### 3. Resource Sizing – Non-Optimized Instance Classes

Model Response:
Used minimal instance classes (t3.micro for EC2 and db.t3.micro for RDS) that are not recommended for production or high availability environments.

Ideal Response Implements:
Upgrades EC2 and RDS instance types to more stable configurations (e.g., t3.small or t3.medium), aligning resource performance with production standards.

### 4. Security – Missing Key Parameterization

Model Response:
Hardcoded EC2 key pair name (key_name = "my-key") instead of using a variable, reducing deployment flexibility and environment portability.

Ideal Response Implements:
Introduces a Terraform variable for the SSH key pair (var.ec2_key_name), allowing dynamic configuration per environment without manual code modification.

### 5. Maintainability – Inline Security Group Rules

Model Response:
Security group ingress and egress rules were defined inline within the aws_security_group resources. This structure is harder to extend or manage when scaling environments.

Ideal Response Implements:
Separates network rules into dedicated aws_security_group_rule resources, improving readability and enabling fine-grained rule management.

### 6. Observability – Partial CloudWatch Integration

Model Response:
The EC2 instance user data installed the CloudWatch agent package but did not include startup commands or configuration steps, leaving metrics uncollected.

Ideal Response Implements:
Enhances user data with proper agent start-up commands and configuration setup, ensuring monitoring visibility from first boot.

### 7. S3 Backend – Missing Explicit Region and Versioning Validation

Model Response:
Defined S3 backend bucket and DynamoDB lock table but did not explicitly enforce backend region configuration in Terraform, potentially causing initialization issues across regions.

Ideal Response Implements:
Adds explicit region and backend parameters in Terraform backend initialization and ensures versioning and encryption are validated on the S3 state bucket.