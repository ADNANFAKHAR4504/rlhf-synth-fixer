## Objective
Provision a secure and fully functional AWS environment using Terraform. The environment must follow best practices for security, network segmentation, and access control.

## Folder Structure
root/
│
└── lib/
├── provider.tf
└── tap_stack.tf

All Terraform HCL files should reside in the `lib` folder.

## Environment Requirements

1. **Region**: Deploy all resources exclusively in `us-west-2`.
2. **S3 Buckets**: Encrypt all data at rest using AWS Key Management Service (KMS).
3. **IAM Policies**: Enforce the principle of least privilege for all users, roles, and policies.
4. **Networking**:  
   - Create a Virtual Private Cloud (VPC) with **public** and **private subnets**.  
   - All EC2 instances must be launched in **private subnets**.  
   - Configure a **Bastion host** in a public subnet for secure SSH access.
5. **RDS**:  
   - Restrict access to **internal VPC traffic only**.  
   - Enable automated backups with **retention of at least 7 days**.
6. **Monitoring & Logging**:  
   - Deploy **CloudWatch alarms** for critical threshold violations.  
   - Enable **VPC Flow Logs** for network traffic monitoring.  
   - Implement **DNS logging** using AWS Route 53.
7. **Security Groups**: Configure rules to allow **minimal inbound access**. No unrestricted ingress traffic.

## Constraints

- All resources must be deployed in `us-west-2`.  
- Encrypt all S3 buckets with AWS KMS.  
- IAM policies must adhere to the principle of least privilege.  
- Use VPC with segregated public and private subnets.  
- EC2 instances must reside in private subnets.  
- SSH access to EC2 via a Bastion host only.  
- RDS traffic restricted to internal VPC.  
- RDS backups must be automated with at least 7 days retention.  
- CloudWatch alarms must monitor critical thresholds.  
- VPC Flow Logs must be enabled for traffic analysis.  
- Security groups must minimize inbound access.  
- Enable Route 53 DNS logging.

## Expected Output

- Terraform HCL files located in the `lib/` folder (`provider.tf`, `tap_stack.tf`, etc.) that:  
  - Deploy all required resources successfully.  
  - Meet all security and compliance requirements.  
  - Pass any provided test cases demonstrating adherence to the specified constraints.

## Proposed Architecture Statement

> The infrastructure is provisioned in the `us-west-2` AWS region, using a VPC with segregated public and private subnets. All networking, identity, and monitoring configurations comply with AWS best practices for security, efficiency, and observability.
