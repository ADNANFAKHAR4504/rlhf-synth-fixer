## Objective:
Define and deploy a secure, highly available cloud infrastructure in the **us-east-1** (N. Virginia) AWS region using AWS CloudFormation. The infrastructure must support **strict environment isolation** between **production** and **development**, where each environment resides in a **separate AWS account**.

## Requirements:

1. **Networking:**
   - Create a Virtual Private Cloud (VPC) in the `us-east-1` region.
   - The VPC must span **two Availability Zones** (AZs).
   - Include **two public subnets** (1 per AZ) and **two private subnets** (1 per AZ).
   - Apply **Network ACLs** (NACLs) and **Security Groups** adhering to AWS **least privilege principles** and best security practices.

2. **Environments:**
   - Deploy separate CloudFormation stacks for **production** and **development** environments.

3. **Compute:**
   - Launch **EC2 instances** within the **private subnets** for both environments.
   - Ensure EC2 instances do **not have public IPs** and only receive traffic via the load balancer.

4. **Load Balancing:**
   - Deploy an **Application Load Balancer (ALB)** in the **public subnets**.
   - ALB should distribute HTTP(S) traffic to the EC2 instances in the private subnets.
   - Ensure the ALB is **internet-facing** and has proper **listener rules and target groups** configured.

5. **Security:**
   - Use **Security Groups** to control access to ALB and EC2 instances:
     - ALB should allow HTTP/HTTPS from the internet.
     - EC2 instances should only accept traffic from the ALB’s security group.
   - Define **Network ACLs** to restrict inbound/outbound traffic appropriately.
   - Ensure **IAM roles and instance profiles** follow the **least privilege model**.

## Constraints:

- **Environment Isolation:** Each stack (prod/dev) must be deployable into **distinct AWS accounts**.
- **Single Template:** Define the complete infrastructure in a **parameterized CloudFormation YAML file** for reuse across environments.
- **Region Fixed:** All resources must be deployed in **us-east-1**.
- **Fully Automated Deployment:** Upon deployment, the stack must provision the entire infrastructure without manual intervention.