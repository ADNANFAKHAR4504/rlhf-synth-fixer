## What I need

Create a CloudFormation template named `TapStack.yaml` that defines and provisions a complete web application infrastructure as described below. The template must be fully deployable in the AWS us-west-2 region without modification, and should cleanly create/update all required resources when run through the AWS CloudFormation console, CLI, or SDK (e.g., via `aws cloudformation deploy`).

The final file should represent a production-ready IaC setup that can be launched directly as a stack.

## Requirements

1. Application Load Balancer (ALB) - Internet-facing, configured for HTTPS using an SSL certificate from AWS Certificate Manager (ACM). Include HTTP to HTTPS redirect and security groups as needed.

2. Auto Scaling Group (ASG) - Launch EC2 instances behind the ALB. The group must scale automatically based on incoming traffic, and have rollback enabled if deployment fails.

3. Amazon RDS Instance - Include an RDS database with automatic backups enabled (define BackupRetentionPeriod, PreferredBackupWindow, etc.).

4. CloudWatch Integration:
   - Store application logs in CloudWatch Logs.
   - Define at least one CloudWatch Dashboard showing metrics such as ALB 5xx errors, ASG CPU utilization, and RDS free storage space.

5. IAM Roles - Create IAM roles and policies for Lambda functions or other AWS services that need to access application resources. At least one role should be assigned to a Lambda function that interacts with part of the stack (e.g., reading from CloudWatch or logging).

6. Tags - All resources must include the tag Environment: Production.

7. Parameters - Provide parameters for resource names and critical settings (e.g., AppName, VpcId, SubnetIds, DBName, DBUser, DBPassword with NoEcho, CertificateArn, etc.) to support customization at deployment time.

8. Region - All resources must deploy in us-west-2.

9. Rollback - Ensure CloudFormation rollback is enabled by default.

10. Outputs - Include meaningful outputs:
    - ALB DNS Name (e.g., WebAppURL)
    - RDS Endpoint (e.g., DatabaseEndpoint)
    - CloudWatch Dashboard Name or URL

## Template expectations

- The entire infrastructure definition must reside in a single file named TapStack.yaml.
- Use YAML format only (no JSON or mixed syntax).
- Leverage CloudFormation best practices (e.g., logical IDs, intrinsic functions like !Ref, !Sub, !Join, !GetAtt).
- The deployment should complete successfully, creating all required AWS resources as described.

## Deliverable

File name: TapStack.yaml
Format: CloudFormation YAML
Goal: Fully deployable, production-ready CloudFormation stack defining the described web application infrastructure end-to-end in AWS us-west-2.
