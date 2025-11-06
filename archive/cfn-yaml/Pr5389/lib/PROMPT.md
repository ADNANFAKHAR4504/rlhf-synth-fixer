We are NovaCart, a fast-growing e-commerce startup where our customers' trust is our most valuable asset. So security is not a feature; it is the foundation of our platform. We need you, as our lead Infrastructure Security Engineer, to build the cornerstone of this trust.

Your mission is to create our "Secure Foundation" CloudFormation template secure_infrastructure.yaml. Our customers are counting on us to:

Safeguard their data: This means every S3 bucket must have versioning to prevent accidental data loss, and every RDS database must be encrypted at rest using KMS, making their information unreadable to anyone but us.

Ensure 24/7 availability: Our application must be resilient. You must launch our EC2 instances within a robust VPC that spans multiple availability zones, so a failure in one data center doesn't take our site offline for our customers.

Threat Protection: The bad actors are constantly probing for weaknesses. We need an AWS WAF standing guard in front of our CloudFront distributions, actively blocking common web exploits before they can reach our applications.

Maintain a flawless audit trail: For our own accountability, comprehensive logging with CloudTrail is non-negotiable. We need to know who did what, and when, across our entire environment.

Operate on a "need-to-know" basis: Every IAM Role must have a strict permission boundary and follow the principle of least privilege. Our internal systems must be locked down, with security groups that only open the absolute minimum ports required (like SSH and HTTP) and API Gateway endpoints that rigorously validate all incoming requests.

Build us a template that our developers can extend with confidence and our customers can trust implicitly.