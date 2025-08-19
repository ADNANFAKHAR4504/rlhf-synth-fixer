You are tasked with deploying **serverless infrastructure** on AWS using **Terraform**, targeting the `us-west-2` region..  
Ensure **high availability** by utilizing at least **three availability zones** for all stateful resources (e.g., RDS).  
Implement **best practices** for AWS serverless application deployment as follows:

---

## Requirements

1. **Provider Configuration** (`/lib/provider.tf`):
   - Declare the AWS provider, restricting the region to `us-west-2`.
   - Enable **default tags** for cost management.

2. **Main Infrastructure** (`/lib/main.tf`):
   - Create an **IAM role and policy** for Lambda execution.
   - Deploy **one or more AWS Lambda functions** in the `us-west-2` region.
   - Define a **VPC configuration** that spreads subnets across **at least three availability zones**.
   - Provision a **multi-AZ, highly available RDS cluster**.
   - Set up an **API Gateway** that exposes the Lambda(s) as HTTP endpoints.
   - Apply **resource tags** (`Environment`, `Project`, `Owner`, etc.) to *every* resource.

3. **Validation & Deployment**:
   - Validate configuration by running:
     ```bash
     terraform validate
     terraform plan
     ```
     (Ensure your `lib/` path is correct.)
   - Deploy the infrastructure with:
     ```bash
     terraform apply
     ```

---

## Constraints
- All Lambda functions and related serverless resources must be **confined** to the `us-west-2` region.
- The RDS database must utilize **a minimum of three availability zones** for high availability.

---

## Expected Output
A set of **Terraform HCL** files inside `lib/` that fully automate deployment of the serverless architecture on AWS, including:
- AWS Lambda functions
- API Gateway
- Security roles & policies
- Multi-AZ RDS cluster
- Networking & VPC setup
- Complete tagging for cost management
- Passing validation (`terraform validate`) and successful deployment (`terraform apply`)