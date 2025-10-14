### model failure

### 1. Networking – Missing Cross-Region High Availability

Model Response:
All infrastructure resources (VPC, subnets, RDS, and ALB) are provisioned in a single AWS region (us-west-2). This violates the cross-region high availability requirement defined in the ideal response.

Ideal Response Implements:
Deploys mirrored infrastructure stacks in both us-east-1 and us-west-2 regions, ensuring active redundancy and failover between regions.

### 2. Security – Absence of S3 Cross-Region Replication and Encryption Policy Enforcement

Model Response:
The aws_s3_bucket.cloudtrail is created without cross-region replication or replication configuration. While it uses server-side encryption, it doesn’t include a replication configuration or enforce bucket policy for destination encryption consistency.

Ideal Response Implements:
Creates two S3 buckets (primary and replica) with an aws_s3_bucket_replication_configuration, enforcing encrypted replication using KMS and destination bucket policy for consistent data protection.

### 3. IAM & Security – Incomplete Least-Privilege IAM Configuration

Model Response:
Attaches broad managed policies like CloudWatchAgentServerPolicy and AmazonSSMManagedInstanceCore, and defines an inline EC2 IAM role policy granting wide KMS decryption and SSM parameter access to all parameters under the project path.

Ideal Response Implements:
Implements least-privilege IAM roles and policies scoped to resource-level access, including distinct IAM roles for EC2, RDS, and CloudWatch agents, with explicit permissions for only required resources.

### 4. Observability – Missing CloudTrail Organization-Level Integration and Centralized Log Archiving

Model Response:
Configures a single-account CloudTrail (aws_cloudtrail.main) without multi-account organization trail integration, nor centralized log storage in a dedicated logging account.

Ideal Response Implements:
Creates an organization-trail integrated with AWS Organizations, forwarding logs securely to a central S3 bucket with access control policies managed by a separate logging account.

### 5. Application Security – ALB Missing HTTPS Listener and ACM Certificate Integration

Model Response:
The Application Load Balancer (aws_lb.main) exposes only HTTP on port 80, lacking HTTPS/TLS termination. No ACM certificate or HTTPS listener configuration is defined.

resource "aws_lb_listener" "http" {
  port = 80
  protocol = "HTTP"
}

Ideal Response Implements:
Configures an HTTPS listener using an aws_acm_certificate validated via Route 53, enforcing TLS 1.2+ for secure inbound connections and redirecting all HTTP traffic to HTTPS.

### 6. RDS – Missing Secrets Manager Integration for Credential Management

Model Response:
RDS credentials are generated via a random_password and stored in AWS SSM Parameter Store. This limits rotation capabilities and secure retrieval integration.

Ideal Response Implements:
Uses aws_secretsmanager_secret and aws_secretsmanager_secret_version to securely manage and automatically rotate the RDS master password.

### 7. EC2 Launch Template – Partial CloudWatch Agent Configuration

Model Response:
User data installs the CloudWatch agent RPM but omits configuration and service start commands to enable metric collection.

wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm


Ideal Response Implements:
Includes a preconfigured CloudWatch agent JSON configuration fetched from S3 or template, then starts the agent service for full monitoring coverage.

### 8. Route 53 – No Health Check or Failover Routing Policy

Model Response:
Defines a static Route 53 A record alias for the ALB without any health checks or routing policies for multi-region failover.

Ideal Response Implements:
Configures Route 53 with a failover routing policy using health checks to detect ALB availability, automatically routing traffic between regions.

### 9. Maintainability – Inline Security Group Rules

Model Response:
Ingress and egress rules are defined inline within aws_security_group resources.

Ideal Response Implements:
Uses discrete aws_security_group_rule resources for modular and maintainable rule management.

### 10. Compliance – Missing S3 Access Logging and ALB Access Logs

Model Response:
The CloudTrail S3 bucket lacks access logging. Similarly, ALB does not have access logs or S3 logging enabled.

Ideal Response Implements:
Enables S3 server access logs and ALB access logs stored in a dedicated, encrypted S3 logging bucket for auditing and compliance tracking.