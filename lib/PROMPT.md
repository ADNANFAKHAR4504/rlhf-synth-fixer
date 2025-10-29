> You are an expert AWS CDK engineer specializing in designing **secure, compliant multi-VPC network architectures** using TypeScript.
> Your mission is to **analyze the provided input specification** and generate a **complete CDK program** that deploys a **hub-and-spoke network** with centralized egress, inter-VPC routing via Transit Gateway, and DNS resolution through Route 53 Resolver.
>
> **Deliverables:**
>
> * `main.ts` — CDK entrypoint that initializes the app and stack.
> * `tapstack.ts` — Full CDK stack defining all networking resources (VPCs, subnets, TGW, NAT instances, NACLs, Route 53 Resolver, VPC Flow Logs, IAM roles, tags, etc.) wired together logically.
>
> ---
>
> ### 📘 Input Specification
>
> ```json
> {
>   "problem": "Create a CDK program to deploy a hub-and-spoke network architecture with centralized egress control. The configuration must: 1. Create a hub VPC with CIDR 10.0.0.0/16 across 3 availability zones with public, private, and database subnets. 2. Deploy 3 spoke VPCs for Dev (10.1.0.0/16), Staging (10.2.0.0/16), and Production (10.3.0.0/16) environments. 3. Establish AWS Transit Gateway to connect all VPCs with appropriate route tables for inter-VPC communication. 4. Configure centralized NAT instances in the hub VPC for all outbound internet traffic from spoke VPCs. 5. Implement Route 53 Resolver endpoints in the hub VPC for centralized DNS resolution. 6. Set up VPC Flow Logs for all VPCs storing data in S3 with 7-day retention. 7. Create Systems Manager Session Manager endpoints in each VPC for secure instance access. 8. Deploy Network ACLs that allow only necessary traffic between VPCs based on environment type. 9. Configure Transit Gateway route tables to prevent direct communication between Dev and Production VPCs. 10. Tag all resources with Environment, CostCenter, and Owner tags for compliance tracking.",
>   "background": "A financial services company is establishing a new AWS presence to support their expanding operations in Asia-Pacific. They require a hub-and-spoke network architecture that connects multiple business units while maintaining strict network isolation and compliance requirements.",
>   "environment": "Multi-VPC hub-and-spoke architecture deployed in us-east-2 using Transit Gateway for inter-VPC connectivity, centralized NAT instances for egress control, and Route 53 Resolver for DNS. Requires CDK 2.x with TypeScript, Node.js 16+, and AWS CLI configured. The hub VPC spans 3 AZs with public, private, and database subnet tiers. Spoke VPCs for Dev, Staging, and Production environments connect through Transit Gateway with custom routing rules.",
>   "constraints": [
>     "NAT instances must use t3.medium instances with auto-recovery enabled",
>     "VPC Flow Logs must use custom format capturing srcaddr, dstaddr, srcport, dstport, protocol, packets, bytes, start, end, action",
>     "Transit Gateway must use separate route tables for each spoke VPC attachment",
>     "All VPCs must have DNS hostnames and DNS resolution enabled",
>     "Network ACLs must explicitly deny traffic from Dev to Production subnets",
>     "S3 bucket for VPC Flow Logs must have server-side encryption enabled",
>     "Route 53 Resolver endpoints must be deployed in at least 2 availability zones",
>     "All EC2 instances must be deployed without public IP addresses"
>   ]
> }
> ```
>
> ---
>
> ### 🧩 Output Requirements
>
> 1. Generate **CDK v2** TypeScript code using modules from `aws-ec2`, `aws-ssm`, `aws-s3`, `aws-iam`, `aws-route53resolver`, and `aws-logs`.
> 2. Include:
>
>    * Hub VPC with 3 AZ subnets (public, private, database).
>    * Three spoke VPCs for Dev, Staging, Production.
>    * A **Transit Gateway** with unique route tables for each spoke and routing preventing Dev ↔ Prod traffic.
>    * **Centralized NAT instances** (t3.medium, auto-recovery = true) in hub public subnets.
>    * **Route 53 Resolver** inbound/outbound endpoints in at least 2 AZs.
>    * **VPC Flow Logs** stored to encrypted S3 bucket (7-day retention, custom log format).
>    * **Session Manager endpoints** in all VPCs.
>    * **Network ACLs** restricting cross-env traffic as specified.
>    * **Tags** for Environment, CostCenter, Owner.
> 3. Enforce no public IP assignment on EC2 instances.
> 4. Use least-privilege IAM roles and explicit dependency linking (`.grantReadWrite`, `addRoute`, etc.).
> 5. Add clear inline comments marking sections (`// 🔹 Hub VPC`, `// 🔹 Transit Gateway`, etc.).
> 6. Output **only the two code files** (`main.ts` and `tapstack.ts`) in fenced markdown blocks.
> 7. No extra prose or explanations — just the ready-to-run code.
>
> ---
>
> ### 🎯 Goal
>
> Deliver a **fully functional, compliant, and secure hub-and-spoke network** using AWS CDK (TypeScript).
> Focus on:
>
> * Correct inter-VPC routing via Transit Gateway
> * Centralized egress with NAT instances
> * DNS resolution with Route 53 Resolver
> * Network segmentation and compliance enforcement
> * Maintainability and clarity of resource connections