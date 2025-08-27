# Task Processor

A tool for processing tasks from a JSON file using Docker.
This tool is meant only to test IaC tasks from Turing Enterprises.

## ⚠️ IMPORTANT WARNING

**This application should ONLY be run in a fresh, clean AWS account dedicated for testing purposes.**

### Why This Matters

- **Resource Creation**: IaC tasks will create various AWS resources (EC2 instances, VPCs, S3 buckets, etc.)
- **Resource Accumulation**: With 450+ tasks, hundreds of resources may be created across multiple regions
- **Potential Conflicts**: Existing resources in your account may interfere with task execution
- **Cost Impact**: Created resources may incur charges if not properly cleaned up
- **Account Pollution**: Running this in a production or shared account will create clutter

### Recommended Setup

1. **Create a new AWS account** specifically for this testing
2. **Use a dedicated test account** that contains no important resources
3. **Ensure proper permissions** for creating/managing AWS resources
4. **Monitor costs** during execution to avoid unexpected charges

**DO NOT run this application in production accounts or accounts containing important resources.**

## Prerequisites

- Docker installed and running
- AWS CLI configured with valid credentials
- jq installed (`apt-get install jq` or `brew install jq`)
- curl installed (for aws-nuke download)
- sudo privileges (for aws-nuke installation)
- **AWS Account ID environment variable set** (see Setup section)
- **AWS Service Quota limits increased** (see Service Quota Requirements section)

## Service Quota Requirements

**CRITICAL**: Before running this tool, you must increase AWS Service Quota limits to prevent task failures due to resource limits.

### Required Service Quota Increases

For **ALL regions** listed in `aws-nuke-config.yaml` (us-east-1, us-east-2, us-west-1, us-west-2, af-south-1, ap-east-1, ap-northeast-1, ap-northeast-2, ap-northeast-3, ap-south-1, ap-south-2, ap-southeast-1, ap-southeast-2, ap-southeast-3, ap-southeast-4, ca-central-1, ca-west-1, eu-central-1, eu-central-2, eu-north-1, eu-south-1, eu-south-2, eu-west-1, eu-west-2, eu-west-3, il-central-1, me-central-1, me-south-1, sa-east-1), increase the following service quotas to a **minimum of 50**:

- **VPC per region** - Default: 5, Required: 50+
- **NAT Gateway per Availability Zone** - Default: 5, Required: 50+
- **EC2 Instances (Running On-Demand instances)** - Default: 20, Required: 50+
- **EC2 Elastic IP addresses** - Default: 5, Required: 50+
- **RDS DB Instances** - Default: 40, Required: 50+
- **RDS DB Subnet Groups** - Default: 50, Required: 50+

### How to Request Quota Increases

1. **Via AWS Console**:
   - Go to AWS Service Quotas console
   - Select each service (EC2, VPC, RDS, etc.)
   - Find the specific quota and click "Request quota increase"
   - Set new limit to 50 or higher
   - **Repeat for ALL regions** where you plan to run tasks

2. **Via AWS CLI** (example for EC2 instances in us-east-1):

   ```bash
   aws service-quotas request-service-quota-increase \
     --service-code ec2 \
     --quota-code L-1216C47A \
     --desired-value 50 \
     --region us-east-1
   ```

3. **Processing Time**: Quota increase requests typically take 24-48 hours to be approved

### Why This is Critical

- **Task Volume**: With 450+ IaC tasks, multiple resources will be created simultaneously
- **Regional Distribution**: Tasks may create resources across multiple AWS regions
- **Resource Dependencies**: Many IaC patterns create VPCs, subnets, NAT gateways, and EC2 instances together
- **Failure Prevention**: Hitting quota limits will cause task failures and incomplete deployments

**⚠️ IMPORTANT**: Request quota increases well in advance. Do not proceed without adequate quotas as it will result in failed tasks and incomplete testing.

## Setup

1. **Set your AWS Account ID as an environment variable**:

   ```bash
   export AWS_ACCOUNT_ID=123456789012
   ```

   Replace `123456789012` with your actual AWS account ID. This is required for aws-nuke configuration and safety verification.

2. Ensure `tasks.json` is in the same directory
   - Use the same format as the json files exported by Turing. Just change the file name to tasks.json

3. Ensure the `turing-iac-tasks-processor-dockerfile-x-x-x.zip` file is in the same directory
   - The script will automatically extract and build the Docker image from this zip file

4. Ensure an AWS Account alias exists for the AWS Account, only then nuke will be completed.

5. Tag all the resources with key=NUKE_RETAIN and value=true, specially the IAM resources using which you are executing this.

## Usage

After setting up the environment variable, run the script:

```bash
export AWS_ACCOUNT_ID=123456789012  # Replace with your account ID
./process_tasks.sh
```

The script will:

1. **Verify AWS Account ID**: Check that the environment variable matches your current AWS credentials
2. Install aws-nuke automatically if not present
3. Create an aws-nuke configuration file with IAM exclusions for your specific account
4. Extract the zip file containing the Dockerfile (if not already extracted)
5. For each task in `tasks.json`:
   - Remove any existing `tap-app:worker` Docker image
   - Build a fresh `tap-app:worker` Docker image
   - Process the task using the fresh image
   - Remove the Docker image after task completion
   - Run aws-nuke in dry-run mode every 20 tasks to check for accumulated resources
6. Run a final aws-nuke dry-run after processing all tasks

## Exploring Task Code

To explore the code of tasks inside the container:

```bash
docker run -it tap-app:worker bash
```

Inside the container, you can find the code for each task in the `archive/` directory.

## AWS Resource Garbage Collection

The script includes aws-nuke integration to perform garbage collection on the AWS account and prevent resource quota limits:

### Purpose

- **Garbage Collection**: Identifies and reports AWS resources that accumulate during task processing
- **Quota Management**: Helps prevent hitting AWS service limits (EC2 instances, VPCs, security groups, etc.)
- **Resource Monitoring**: Tracks resource creation patterns across multiple IaC tasks
- **Cost Optimization**: Identifies resources that may incur ongoing charges if left running

### How It Works

- **Automatic Installation**: aws-nuke is automatically downloaded and installed if not present
- **Configuration**: A configuration file (`aws-nuke-config.yaml`) is created with comprehensive IAM exclusions
- **Batch Dry-Run Mode**: aws-nuke runs in dry-run mode every 20 tasks and at the end to show what resources would be deleted
- **Safety First**: No actual resource deletion occurs - this is for monitoring and reporting purposes only

### IAM Protection

The following IAM resources are completely excluded from nuke operations to ensure account security:

- IAM Users, Roles, Groups
- IAM Policies (both managed and inline)
- IAM Policy Attachments
- IAM Instance Profiles
- All other IAM-related resources

### Tag-Based Resource Protection

Resources tagged with `NUKE_RETAIN=true` are automatically excluded from all nuke operations. This provides a simple way to protect specific resources from cleanup:

- Tag any AWS resource with `NUKE_RETAIN=true` to exclude it from aws-nuke
- This applies globally across all resource types and regions
- Useful for preserving important test infrastructure or shared resources

### Why This Matters

- **Service Limits**: AWS accounts have default limits (e.g., 20 EC2 instances, 5 VPCs per region)
- **Resource Accumulation**: IaC tasks may create resources that aren't always cleaned up properly
- **Billing Impact**: Some resources (EC2 instances, NAT gateways, load balancers) incur charges while running
- **Account Health**: Regular monitoring helps maintain a clean AWS environment

## Notes

- The script automatically finds any `turing-iac-tasks-processor-dockerfile-*.zip` file in the directory
- The script extracts TASK_ID and TASK_PATH from each task in the JSON file
- Each task is processed with AWS credentials and the appropriate TASK_PATH
- Make sure AWS credentials are properly configured before running the script
- The Docker image build process occurs for every task, ensuring a fresh environment
- This approach prevents any potential contamination between tasks but increases processing time
- aws-nuke performs garbage collection every 20 tasks to identify accumulated resources and prevent quota limits
- This batched approach reduces execution time while maintaining effective resource monitoring and quota management
- The tool helps maintain account hygiene and prevents service limit issues during bulk task processing
