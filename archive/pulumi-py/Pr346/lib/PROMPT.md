### **Executive Mandate: Secure and Highly Available AWS Infrastructure Provisioning via Pulumi Python**

**Project Overview:**
This mandate outlines the critical requirements for architecting and deploying a foundational, secure, and highly available cloud environment within Amazon Web Services (AWS) using Pulumi with Python. The resulting infrastructure will serve as the bedrock for deploying production-grade applications, demanding adherence to stringent security protocols, operational best practices, and a robust, maintainable Infrastructure as Code (IaC) solution.

**Strategic Objectives:**
The primary objective is to establish a resilient AWS network and compute layer that incorporates principles of least privilege, network segmentation, and automated resource management, thereby minimizing operational overhead and enhancing security posture.

**Technical Specifications & Constraints:**

1.  **Geographical Deployment Constraint:**
    * All AWS resources defined within this Pulumi program *must* be provisioned exclusively within the `us-east-1` AWS Region. This regional constraint is non-negotiable and must be programmatically enforced.

2.  **Virtual Private Cloud (VPC) Foundation:**
    * A dedicated AWS Virtual Private Cloud (VPC) is to be provisioned with a primary IPv4 CIDR block of `10.0.0.0/16`.
    * The VPC must be configured to enable both DNS hostnames and DNS support to ensure seamless internal and external name resolution for deployed resources.

3.  **High-Availability Network Segmentation:**
    * Two (2) distinct public subnets are required to facilitate highly available internet-facing services.
    * Each public subnet *must* be strategically placed within a *separate and distinct AWS Availability Zone* within the `us-east-1` region. The Pulumi script should dynamically query and select two available zones to ensure adaptability.
    * These subnets must be configured to automatically assign public IPv4 addresses to EC2 instances launched within them.
    * An Internet Gateway (IGW) must be established and correctly associated with the VPC.
    * A dedicated public route table must be configured with a default route (`0.0.0.0/0`) directing internet-bound traffic through the IGW, and this route table must be explicitly associated with both public subnets.

4.  **Secure EC2 Compute Tier Deployment:**
    * Two (2) Amazon EC2 instances are to be deployed as core compute resources.
    * Each instance *must* leverage the *latest available Amazon Linux 2 AMI* (HVM virtualization type, x86_64 architecture, gp2 root volume type). The AMI lookup mechanism must be dynamic to ensure continuous use of the most current and patched image.
    * A dedicated AWS Security Group must be meticulously crafted to govern inbound network access to these EC2 instances. This security group *must* permit SSH (TCP port 22) ingress *only* from a **single, explicitly defined, and configurable IPv4 CIDR block** (e.g., `my_ip_address`). This parameter must be retrieved securely via Pulumi configuration.
    * The security group should permit all outbound traffic (`0.0.0.0/0` on all protocols) for initial operational flexibility; however, the design should implicitly allow for future refinement to adhere to the principle of least privilege for egress.

5.  **Granular IAM Role and Policy Enforcement:**
    * A dedicated AWS Identity and Access Management (IAM) Role must be created with a trust policy that explicitly permits EC2 instances to assume this role (`ec2.amazonaws.com`).
    * An inline IAM Policy must be attached to this role, granting *read-only* access to **all** Amazon S3 resources. This policy must be precisely defined to include actions such as `s3:Get*`, `s3:List*`, `s3:Describe*`, and `s3:HeadBucket` across all S3 resources (`*`).
    * An IAM Instance Profile must be created and linked to the aforementioned IAM Role.
    * This IAM Instance Profile *must* be attached to both deployed EC2 instances, ensuring they inherit the specified S3 read-only permissions.

6.  **Enterprise-Grade Resource Tagging:**
    * A comprehensive and automated tagging strategy must be implemented. The following standardized tags *must* be applied to *every single AWS resource* provisioned by this Pulumi program (including, but not limited to: VPC, Internet Gateway, Route Tables, Route Table Associations, Subnets, Security Groups, EC2 Instances, IAM Role, IAM Policy, and Instance Profiles):
        * `Environment: 'Production'`
        * `ManagedBy: 'Pulumi'`
        * `Project: 'CloudEnvironmentSetup'`
    * The tagging mechanism should be centralized and programmatically enforced to ensure consistency and facilitate governance, cost allocation, and operational insights.

**Expected Deliverables:**

The successful completion of this mandate requires the delivery of a production-ready, self-contained, and meticulously engineered Python Pulumi program (`__main__.py`). This deliverable must embody the following characteristics:

* **Executable Codebase:** A complete, well-structured Python script ready for immediate execution via `pulumi up`.
* **Declarative Precision:** All infrastructure components must be defined declaratively, reflecting the desired end-state rather than imperative steps.
* **Robust Dependency Resolution:** The script must correctly manage all implicit and explicit resource dependencies, preventing race conditions and ensuring stable, predictable deployments. This includes careful handling of IAM role propagation.
* **Absolute Idempotency:** Repeated executions of the Pulumi program must consistently yield the same infrastructure state, without creating duplicate resources, introducing drift, or generating errors.
* **Configurability & Parameterization:** Sensitive or environment-specific values (e.g., `my_ip_address`) must be externalized and managed via Pulumi's configuration system, demonstrating secure and flexible parameterization.
* **Exemplary Code Quality:** Adherence to PEP 8 standards, logical modularization, comprehensive inline comments, and clear variable naming are paramount. The code should be easily auditable and maintainable by other infrastructure engineers.
* **Verifiable Outputs:** Critical resource identifiers, connection endpoints (e.g., EC2 public IPs), and IAM ARNs must be explicitly exported as Pulumi stack outputs to facilitate post-deployment validation and integration with downstream systems.

**Success Validation Criteria:**

The solution will be rigorously evaluated against:
* **Functional Correctness:** All specified AWS resources are created and configured precisely as detailed.
* **Security Compliance:** Strict adherence to the SSH access restriction and the principle of least privilege for IAM roles.
* **High Availability:** Proper distribution of subnets across distinct Availability Zones.
* **Automation Efficacy:** The Pulumi script's ability to automate the entire provisioning process reliably.
* **Code Excellence:** The overall quality, readability, and maintainability of the Python codebase.
* **Deployment Stability:** Zero errors or warnings during `pulumi up` operations, and successful `pulumi destroy` for teardown.
* **Output Verification:** All exported stack outputs accurately reflect the deployed infrastructure.