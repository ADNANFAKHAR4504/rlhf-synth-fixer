You are a senior cloud infrastructure engineer specializing in building secure, scalable, and efficient cloud foundations using Infrastructure as Code (IaC). Your task is to generate the complete code for a highly available, enterprise-grade VPC environment using AWS CDK and TypeScript with advanced security controls and scalability patterns.

<problem_statement>
Design and implement a foundational cloud infrastructure setup using AWS CDK in TypeScript. The goal is to provision a highly available, secure, and scalable VPC environment suitable for deploying mission-critical multi-tiered applications. The entire infrastructure must be created programmatically with enterprise security standards, monitoring, and scalability patterns.

The core components of this infrastructure are:

1.  **A VPC**: The network foundation, spanning three Availability Zones (AZs) for high availability with basic security controls.
2.  **Two-Tier Subnets**: Public and private subnets in each of the three AZs for simplified web application deployment.
3.  **Cost-Optimized Internet Access**: Single NAT Gateway in the first AZ for private subnet internet access, optimizing costs while maintaining functionality.
4.  **Web Application Compute**: Single-tier EC2 Auto Scaling Group running nginx web application with standard EBS storage.
5.  **Load Balancing**: Application Load Balancer with health checks for high availability.
6.  **Standard Security**: Basic security controls with Security Groups and NACLs for web application tier.
7.  **Basic Monitoring**: CloudTrail and CloudWatch for operational monitoring and alerting.
    </problem_statement>

<constraints>
* **IaC Tool**: AWS CDK with TypeScript.
* **Cloud & Region**: AWS `us-west-2` with multi-region disaster recovery considerations.
* **VPC Configuration**: Use CIDR block `10.0.0.0/16` with RFC 1918 compliance and span exactly three AZs.
* **Security Compliance**: Follow AWS Well-Architected Security Pillar, CIS benchmarks, and SOC 2 Type II requirements.
* **Code Style**: The code **must** be DRY (Don't Repeat Yourself). Use loops, conditionals, and CDK constructs effectively to create resources across the three AZs.
* **Naming**: All generated resources must follow enterprise naming convention with `tf-` prefix.
* **Scalability**: Design for horizontal scaling with auto-scaling groups and load balancers.
* **Cost Optimization**: Include cost-effective resource sizing with scaling policies.
</constraints>

<instructions>
Carefully analyze the requirements. The central theme is to leverage the programmatic power of the CDK to build this environment efficiently.

1.  **Architectural Outline**: Before writing code, provide a summary of your approach in a `<thinking>` block. Specifically, explain how you will use a loop (e.g., iterating over a list of availability zones) to create the subnets, NAT Gateways, and EC2 instances.

2.  **Generate IaC Code**: Based on your architecture, generate the code within a **single, self-contained TypeScript file**.

3.  **Advanced Network Architecture**:
    - **VPC Design**: Internet Gateway with enhanced security posture
    - **Multi-Tier Routing**: Separate route tables for public, private, and database subnets
    - **NAT Gateway Configuration**: Single cost-optimized NAT Gateway in the first AZ for private subnet internet access
    - **Network Segmentation**: Clean separation between public and private tiers
    - **VPC Endpoints**: S3 and DynamoDB VPC endpoints to reduce internet egress costs and improve security
    - **Network Monitoring**: VPC Flow Logs with enhanced analysis and alerting to CloudWatch and S3

4.  **Basic Security Controls**:
    - **Security Groups**: Single web-app tier security group with principle of least privilege
    - **Network ACLs**: Subnet-level traffic filtering with explicit allow/deny rules
    - **Standard Storage**: Standard EBS volumes without custom encryption
    - **IAM Roles**: Instance profiles with minimal permissions for CloudWatch and SSM
    - **Basic Monitoring**: CloudTrail logging for audit trails

5.  **Scalability & Performance**:
    - **Auto Scaling Group**: Single web-app tier with nginx application and CloudWatch-based scaling policies
    - **Application Load Balancer**: Multi-AZ ALB with health checks for nginx application
    - **Launch Templates**: Versioned launch configurations with nginx user data scripts
    - **CloudWatch Metrics**: Standard metrics for web application performance monitoring

</instructions>

<output_requirements>

**Core Requirements:**

- The entire solution **must** be contained within a single TypeScript file or properly modularized CDK constructs.
- The code must demonstrate enterprise-grade patterns with loops, conditionals, and reusable constructs across three AZs.
- All resources created must follow enterprise naming conventions.
- Use CDK parameters for configurable values (SSH IP ranges, instance types, scaling parameters).

**Security Requirements:**

- Implement basic security with single Security Group, NACLs, and IAM roles.
- Use standard EBS volumes without encryption.
- Configure VPC Flow Logs with CloudWatch.

**Scalability Requirements:**

- Include single Auto Scaling Group with CloudWatch-based scaling policies.
- Implement Application Load Balancer with health checks for nginx application.
- Configure VPC endpoints for cost optimization and security.
- Design for horizontal scaling with launch templates and nginx user data.

**Monitoring:**

- Implement basic CloudTrail logging.
- Include proper resource tagging for cost allocation.

**Outputs:**

- Export ALB DNS name, VPC ID, and subnet IDs.
- Provide Web-App Auto Scaling Group ARN and Launch Template version.
- Include CloudWatch Log Group names.
- Export web-app security group ID for reference by other stacks.
  </output_requirements>
