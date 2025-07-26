# Prompt

You are an experienced **AWS CloudFormation Engineer** specializing in setting up **secure and scalable network infrastructures**. Your task is to generate a **YAML-based CloudFormation template** to provision an initial development environment in the **us-west-2** region with the network and security specifications detailed below.

**Requirements:**

1. **Region:** All resources must be deployed in **`us-west-2`**.
2. **VPC:**
   - Create a VPC with the CIDR block **`10.0.0.0/16`**.
3. **Subnets:**
   - Create **two public subnets** within the VPC:
     - First subnet CIDR: `10.0.1.0/24`
     - Second subnet CIDR: `10.0.2.0/24`
4. **Internet Gateway:**
   - Attach an Internet Gateway to the VPC to allow external internet access.
   - Ensure route tables for both public subnets route `0.0.0.0/0` to the IGW.
5. **Security Group:**
   - Create a Security Group within the VPC that **allows inbound SSH traffic (port 22) from any IPv4 address (`0.0.0.0/0`)**.
6. **CloudFormation Standards:**
   - Use **YAML syntax** only.
   - Use **intrinsic functions** (`Ref`, `GetAtt`, etc.) wherever applicable to manage logical references and outputs.
   - Follow AWS best practices for resource structuring and readability.

**Constraints:**

* Template must be deployable **without any errors**.
* Use only **native CloudFormation YAML**, no external tools like CDK or Terraform.
* All resources must be **explicitly defined** and **referenced** using proper intrinsic functions.
* Outputs section should expose key information such as:
  - VPC ID
  - Subnet IDs
  - Internet Gateway ID
  - Security Group ID

**Expected Output:**

* A fully working, **valid CloudFormation YAML file** that:
  - Provisions the required VPC, subnets, IGW, route tables, and security group.
  - Adheres strictly to the above requirements and constraints.
  - Passes validation via tools like `cfn-lint`.
* Include a short explanation (3–5 bullet points) of how the template meets the requirements.