```
You are an expert Prompt Engineer, Your task is to generate IAC code using CLOUDFORMATION YAML. Please make sure that the provided data should remain intact and it should not change in anyway, use the below data to generate the IAC:

Contraints:

The CloudFormation stack must be created in the us-west-2 region. | All resources must be tagged according to the organization's tagging policy, which includes the following mandatory tags: 'Environment', 'Project', and 'Owner'. | Implement least privilege permissions for IAM roles and policies. | Ensure S3 buckets created are encrypted at rest using AWS managed keys (SSE-S3).

Environment:

You are tasked with analyzing and ensuring the quality of an existing CloudFormation template that sets up a secure AWS infrastructure. The infrastructure consists primarily of S3 buckets, EC2 instances, and IAM roles. Your duties include: 1. Verifying the stack creation in the 'us-west-2' region. 2. Ensuring all resources adhere to the organization's tagging policy, requiring the tags 'Environment', 'Project', and 'Owner'. 3. Enforcing least privilege permissions on IAM roles and policies. 4. Ensuring that all S3 buckets have server-side encryption enabled using AWS managed keys (SSE-S3). Expected output is a modified or new CloudFormation YAML file that meets the above requirements.

Proposed Statement:

The target environment is an AWS infrastructure in the us-west-2 region with a focus on security and compliance according to organizational standards.
```
