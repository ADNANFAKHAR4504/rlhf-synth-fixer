Create a CloudFormation template in YAML for a scientific computing shared storage infrastructure in us-east-2 region.

The scientific computing project processes 10,500 daily simulation results that need to be shared across multiple research teams. Build an infrastructure that provides high-performance shared storage with automated lifecycle management.

Requirements:
- VPC with at least 2 private subnets across different availability zones
- EFS file system configured with provisioned throughput of 100 MiB/s
- EFS mount targets in each availability zone for high availability
- Security group allowing NFS access (port 2049) from within the VPC
- Lambda function to automatically clean up files older than 180 days
- CloudWatch metrics and alarms to monitor EFS storage utilization
- IAM roles and policies for team-based access control
- AWS Backup plan for daily EFS snapshots with 30-day retention
- S3 bucket for archiving data before deletion
- EFS lifecycle policy to transition files to Infrequent Access storage class after 30 days

The solution should leverage AWS DataSync for efficient data transfer between EFS and S3 during archival operations. Additionally, implement AWS Resource Access Manager to enable cross-account sharing of the EFS file system with partner research organizations.

Provide the complete CloudFormation template with proper parameters, mappings, resources, and outputs. Include descriptive comments for each major section.