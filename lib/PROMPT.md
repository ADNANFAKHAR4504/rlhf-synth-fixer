You are an expert AWS Solutions Architect tasked with designing and implementing robust cloud infrastructure.

Your mission is to generate a complete and executable AWS CloudFormation template in YAML format. This template must establish a highly available, scalable, and secure cloud environment across two distinct AWS regions to support a critical application.

**Strict Output Requirements:**
* Your entire response **must be only the CloudFormation YAML template**.
* Do not include any introductory or concluding conversational text, explanations, or markdown outside of the YAML code block itself (comments within the YAML are permitted).
* The template must be self-contained and ready for deployment.

**Architectural Design Specifications:**

1.  **Multi-Region Deployment:**
    * The template must be designed to deploy identical infrastructure into two separate AWS regions, with the specific regions configurable via CloudFormation parameters (e.g., `Region1`, `Region2`).
    * All regional resources must be uniquely named and configured to prevent conflicts and ensure independent operation.

2.  **Networking (Per Region):**
    * **Virtual Private Cloud (VPC):** A dedicated VPC for each region with configurable CIDR blocks.
    * **Subnets:** Within each VPC, create at least two public subnets and two private subnets, each residing in a different Availability Zone for high availability.
    * **Internet Gateway (IGW):** An IGW attached to each VPC to allow outbound internet access from public subnets.
    * **NAT Gateway (NAT GW):** A NAT Gateway deployed in a public subnet in each region, with an associated Elastic IP (EIP), to enable outbound internet access for resources in private subnets.
    * **Route Tables:**
        * Public route tables with a default route to the IGW.
        * Private route tables with a default route to the NAT Gateway.
        * Correct associations between subnets and their respective route tables.

3.  **Application Tier (Per Region):**
    * **Elastic Load Balancer (ELB):** An Application Load Balancer (ALB) deployed in the public subnets of each region. It must distribute incoming HTTP traffic (port 80) to the application instances.
    * **EC2 Instances:** At least two EC2 instances per region, deployed into the private subnets, to serve as application servers. These instances must be registered with the ALB's target group. Include basic `UserData` to install a web server (e.g., Apache/Nginx) for testing.
    * **Security Groups:**
        * An ELB Security Group allowing inbound HTTP (80) and HTTPS (443) traffic from anywhere.
        * An Application Security Group allowing inbound HTTP (80) traffic *only* from the ELB's security group, and SSH (22) from a configurable or broad IP range (for testing, but note for production).
        * A Database Security Group allowing inbound database traffic (e.g., MySQL 3306) *only* from the Application Security Group.

4.  **Database Tier (Per Region):**
    * **Relational Database Service (RDS):** A MySQL-compatible RDS instance deployed into the private subnets of each region.
    * **Multi-AZ Deployment:** The RDS instance must be configured for Multi-AZ deployment to ensure high availability within the region.
    * **DB Subnet Group:** A DB Subnet Group spanning the private subnets.
    * **Database Credentials:** Database username and password must be passed as secure CloudFormation parameters (`NoEcho`).

5.  **Identity and Access Management (IAM):**
    * **IAM Roles:** Create appropriate IAM roles and instance profiles for EC2 instances, adhering to the principle of least privilege. This role should allow the EC2 instances to communicate with necessary AWS services (e.g., SSM for management, S3 for application assets).

**Parameters to Include:**
* `ProjectName`
* `Region1`, `Region2` (default to common regions like `us-east-1`, `us-west-2`)
* `VpcCidr1`, `VpcCidr2`
* `PublicSubnet1Cidr1`, `PrivateSubnet1Cidr1`, `PublicSubnet2Cidr1`, `PrivateSubnet2Cidr1` (for Region 1)
* `PublicSubnet1Cidr2`, `PrivateSubnet1Cidr2`, `PublicSubnet2Cidr2`, `PrivateSubnet2Cidr2` (for Region 2)
* `InstanceType` for EC2
* `AMI` for EC2 (use a mapping to select correct AMI per region)
* `DBInstanceType`
* `DBAllocatedStorage`
* `DBUsername` (NoEcho)
* `DBPassword` (NoEcho)

**High Availability and Fault Tolerance:**
* Ensure the design explicitly incorporates redundancy across regions and within regions (e.g., Multi-AZ deployments, multiple instances behind ELB).

**Self-Correction / Design Review Protocol:**
Before emitting the final YAML template, perform the following internal checks and ensure your design implicitly addresses them:
1.  **Inter-Regional Consistency:** Have all resources for both `Region1` and `Region2` been correctly duplicated and parameterized to avoid naming collisions or logical errors when deployed in the same stack?
2.  **Network Flow Validation:** Can traffic flow correctly from the internet -> ELB -> EC2 (private) -> RDS (private)? Are all route tables, security groups, and subnet associations correctly configured for this flow?
3.  **Security Principle Adherence:** Are IAM roles sufficiently restrictive? Are security group ingress/egress rules correctly scoped to allow necessary communication while blocking unnecessary access?
4.  **High Availability Verification:** Does the design truly provide high availability at each layer (network, compute, database) both within a region (Multi-AZ) and across regions?
5.  **YAML Syntax and Logic:** Is the generated YAML syntactically correct and logically sound for CloudFormation deployment? Are all intrinsic functions (`!Ref`, `!Sub`, `!GetAtt`, `!Select`, `!FindInMap`) used correctly?
```