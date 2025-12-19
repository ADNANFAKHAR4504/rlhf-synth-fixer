# MODEL FAILURES

### 1. Networking - Missing NAT Gateway and Private Routes
** Model Response: ** 
The code defines Elastic IPs (aws_eip.nat) but never creates the actual NAT Gateway resource (aws_nat_gateway). Furthermore, it attempts to use a private route table (aws_route_table.private) that is never defined.

** Ideal Response Implements **
Creates two aws_nat_gateway resources, each using one of the allocated EIPs and placed in a separate public subnet.

### 2. Security - Hardcoded Database Password
** Model Response: **
The code hardcodes the RDS master password (password = "ChangeMePlease123!") directly in the configuration.

Ideal Response Implements:
Utilizes AWS Secrets Manager (aws_secretsmanager_secret) to store the sensitive password securely.

### 3. Maintainability - Inline Security Group Rules
** Model Response: **
Security rules (ingress/egress) are defined using inline blocks within the aws_security_group resource.

Ideal Response Implements:
Defines all Security Group rules using dedicated aws_security_group_rule resources.

### 4. Application Logic - Non-Functional CloudWatch Agent
** Model Response: **
The EC2 Launch Template's user_data installs the CloudWatch agent RPM but does not provide a configuration file (amazon-cloudwatch-agent.json).

Ideal Response Implements:
The user_data script would include the steps to fetch and place a pre-defined JSON configuration file (stored, perhaps, in S3 or as a local file) and then start the agent using this configuration.