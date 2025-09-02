# Pulumi TypeScript: Production-Ready Cloud Environment

I need a Pulumi TypeScript implementation that provisions a production-ready, secure, and scalable AWS infrastructure stack. This should follow AWS and DevSecOps best practices. The stack must be **fully deployable in the `ap-south-1` region**, with all resources **explicitly associated with a Pulumi AWS provider** to control the region.

## Key Requirements:

- **Pulumi AWS Provider** must be defined and passed to every resource so that deployment is region-bound and configurable
- All resources should be **prefixed with the environment name** (e.g., `production-*`) for clarity and separation
- All resources must be tagged with `'environment': 'production'` or whatever the environemtn value is set in config

### Networking:

- Create a new **VPC with CIDR block `10.0.0.0/16`**
- Inside the VPC:
  - Create **2 public subnets** and **2 private subnets** in separate Availability Zones
  - Attach an **Internet Gateway** for the public subnets
  - Deploy **NAT Gateways** in one per AZ
- VPC flow logs should be enabled and directed to a CloudWatch Log Group

### Compute:

- Deploy **EC2 instances (Amazon Linux 2023)** in the public subnets inside an **Auto Scaling Group**
  - Allow **SSH only from a specified IP range** take that from config
  - Set up **launch templates** using the latest Amazon Linux 2023 AMI dynamically fetched
  - The ASG should **scale based on CPU utilization thresholds**

### Database:

- Deploy an **Amazon RDS MySQL instance** with:
  - **KMS encryption** for data at rest
  - **Automated backups enabled for at least 7 days**
  - Located in private subnets only

### Storage:

- Create an **S3 bucket** with:
  - **Versioning enabled**
  - **KMS encryption** wherever applicable

### IAM:

- EC2 should have a role with permissions only for:
  - CloudWatch logging
  - S3 read/write
  - SecretsManager read
- RDS should have access to KMS and monitoring

### Output:

- Output the following from the stack:
  - S3 bucket name
  - RDS endpoint
  - ALB DNS name

### Additional Constraints:

- Use modern Pulumi constructs and patterns
- All infrastructure should be created in **a single class or function** that can be instantiated
- All logic and resources should exist in **one `.ts` file**
- Please provide the entire code in a **single markdown code block** ready for execution
