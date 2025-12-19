**"Implement a SaaS staging environment (5k test transactions daily, data masking) mirroring production using AWS (us-west-2, YAML, staging). Requirements:**

- **Network:** VPC (10.25.0.0/16), Private Subnets (10.25.10.0/24, 10.25.20.0/24).
- **Database/Security:** RDS Aurora MySQL (clone from prod snapshot), Lambda (Python 3.10) for **data masking before restore**, Secrets Manager.
- **Access Control:** Security Groups (restrict access to **VPN CIDR**), IAM Roles (limited permissions, **MFA for privileged operations**).
- **Storage/Monitoring:** S3 (test data storage), CloudWatch (monitoring, **cost control alarms**)."

Expected Output : SIngle stack (TapStack.yml)
