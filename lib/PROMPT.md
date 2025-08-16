
You are an expert in **Infrastructure as Code (IaC)** and **Terraform (v0.14 or higher)**. Your task is to design and implement a **secure, highly available, multi-region AWS infrastructure** following the **project requirements and constraints** below.

## Infrastructure components

- **Global Load Balancing:** Deploy load balancers across at least two AWS regions (e.g., `us-east-1` and `eu-west-2`) for global traffic distribution.

- **Web Tier:** EC2 web servers with auto-scaling groups for elasticity and high availability.

- **Database Tier:** Amazon RDS with Multi-AZ enabled for redundancy.

- **Storage Tier:** Amazon S3 buckets for static content, with bucket policies restricting unauthorized access.

### Security & compliance requirements

- All sensitive data (credentials, configs) must be securely managed in **AWS Secrets Manager**.
* Apply **IAM roles & policies** with **least privilege** access.
- Enable **data encryption at rest** (via **AWS KMS**) and **in transit** (SSL/TLS).
* Configure **security groups** to allow only required ports and sources.

### Observability

* Aggregate logs from all services using **AWS CloudWatch** (logs and metrics).


### Code requirements

* Ensure **Terraform code passes `terraform validate`** without errors.
- All resources must be provisioned via Terraform (no manual setup).
* Favor managed AWS services over raw VMs where possible.
- There is no need for the terraform modular approach, code could be in a single well commented file
* The **Terraform code should be thoroughly documented** with inline comments explaining design choices, security considerations, and resource configurations.

