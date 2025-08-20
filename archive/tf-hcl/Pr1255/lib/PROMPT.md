You are an expert DevOps and Cloud Security Engineer. Implement a **highly secure AWS cloud environment** using **Terraform** in **HCL format**, saved as `tap_stack.tf`. Follow the companys security guidelines and resource naming conventions. The environment must:

1. **IAM & MFA** Define IAM roles and policies strictly following least privilege. Enforce MFA for all IAM users accessing the console.
2. **Encryption** Encrypt all AWS resources at rest with AWS KMS (AWS-managed keys).
3. **Monitoring & Logging** Implement detailed CloudWatch monitoring and logging for all resources.
4. **Security Groups** Allow traffic only from explicit IP ranges; deny unrestricted access.
5. **Compliance** Use AWS Config to enforce and track compliance with security standards.
6. **Network Segmentation** Create multiple VPCs (name primary VPC `SecureAppVPC`) to isolate critical infrastructure from other services.
7. **API Protection** Integrate AWS WAF with API Gateway to protect against attacks, including DDoS.
8. **Multi-Region Deployment** Deploy in both `us-west-1` and `eu-central-1` regions.
9. **Environment Separation** Use Terraform workspaces to clearly separate development and production environments.
10. **Threat Detection** Enable AWS GuardDuty to trigger automated alerts for suspicious activity.

**Expected Output:**
A single Terraform configuration file (`tap_stack.tf`) that:

* Successfully provisions all listed AWS resources in **both `us-west-1` and `eu-central-1`**.
* Implements **least privilege IAM roles and policies** with MFA enforced for all users.
* Ensures **all storage, databases, and logs are encrypted at rest** using AWS-managed KMS keys.
* Configures **CloudWatch logging and monitoring** for every deployed resource, with alarms for security events.
* Creates **security groups with only explicitly defined IP ranges** and **no `0.0.0.0/0` access**.
* Enforces **AWS Config compliance rules** that match organizational policies.
* Uses **separate VPCs** to segment critical infrastructure from general workloads.
* Protects all API Gateway endpoints with **AWS WAF** rules for DDoS mitigation.
* Manages **development and production** infrastructure separation through Terraform workspaces.
* Activates **AWS GuardDuty** to automatically generate alerts for suspicious activity.
* Passes `terraform validate` without errors and shows the correct planned changes in `terraform plan`.
* Is fully deployable without manual intervention and adheres to **security best practices** and **company compliance requirements**.