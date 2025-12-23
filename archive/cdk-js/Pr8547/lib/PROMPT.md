A startup runs 10 EC2 instances serving around 2,000 daily users and needs to ensure proactive monitoring and basic log tracking. The system must alert on high disk usage, securely store logs, and expose simple visibility into system health. Please produce one self-contained AWS CDK (JavaScript) template file that provisions the following with sensible defaults and parameters for customization:

Core requirements

    •	Amazon EC2: Launch 10 t3.micro instances inside a new VPC. Each instance should have basic user data for log forwarding (e.g., CloudWatch Agent installation).
    •	Security Groups: Allow inbound HTTP (port 80) and SSH (port 22) from parameterized CIDRs. Restrict all other inbound access.
    •	CloudWatch Alarms: Create alarms for disk usage > 80% on each instance, configured to send notifications via SNS. Include optional alarms for CPU or memory if easy to extend.
    •	SNS Topic: For alert notifications (parameterize subscription email).
    •	CloudWatch Logs: Configure EC2 instances to send system and application logs to CloudWatch Logs (with proper log groups and retention settings).
    •	S3 Bucket: Store archived instance logs with lifecycle rules to move old logs to infrequent access or delete after 90 days.
    •	IAM Roles and Instance Profiles:
    •	Instance Role with least-privilege permissions for CloudWatch and S3 log uploads.
    •	Role/policy for alarms to publish to SNS.
    •	CloudWatch Dashboard: A simple dashboard showing disk usage, CPU, and status of all EC2 instances. Output the dashboard URL.
    •	Parameters:
    •	EnvironmentSuffix (e.g., dev/stage/prod)
    •	InstanceCount (default 10)
    •	AlertEmail (SNS subscription)
    •	AllowedHttpCidr and AllowedSshCidr
    •	LogRetentionDays
    •	Tags & Outputs:
    •	Consistent resource tagging including EnvironmentSuffix
    •	Outputs for instance IDs, SNS topic ARN, dashboard URL, and log group names.
