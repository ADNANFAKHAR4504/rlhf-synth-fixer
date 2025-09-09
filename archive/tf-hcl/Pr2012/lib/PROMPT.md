# Secure AWS IAM Terraform Configuration

Write a Terraform configuration in HCL to set up a secure AWS IAM environment.

I need the configuration to do the following:

* Deploy all resources in the `us-west-2` region.
* Manage IAM users and roles.
* **Enforce Multi-Factor Authentication (MFA)** for all IAM users.
* Create an IAM policy that **restricts access to a specific IP range**. You
    can use a placeholder CIDR block like `203.0.113.0/24`.
* Follow the **principle of least privilege** for all permissions.
* Organize the code into **reusable Terraform modules**, for example, a module
    for IAM users.
* Configure a **remote backend using an S3 bucket** to store the state file.
    Make sure the S3 bucket has versioning and server-side encryption enabled.
* Use **Terraform workspaces** to manage separate environments like `dev`,
    `staging`, and `prod`.

Finally, please ensure the generated Terraform code is well-commented and can
pass basic checks like `terraform fmt` for formatting and `terraform validate`
for syntax.
