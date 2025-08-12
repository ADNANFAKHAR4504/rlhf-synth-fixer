**Prompt:**  
You are an AWS Professional Solutions Architect. Write a **CloudFormation YAML template** named **`TapStack.yml`** that designs a **highly secure cloud infrastructure** meeting the following requirements:  
  
**Environment Requirements:**  
1. Deploy **S3 buckets** with **encryption at rest** enabled using **AWS KMS managed keys**.  
2. Create **IAM roles** with permissions following the **least privilege principle** to access the S3 buckets.  
3. Log all CloudFormation configuration changes and stack events to **CloudWatch** for auditing purposes.  
4. All resources must be deployed in the **`us-west-2`** AWS region.  
5. All resource names must be **prefixed with `secureapp`**.  
  
**Constraints:**  
- Ensure **encryption at rest** is enabled for *all* S3 buckets using **KMS-managed keys** (`SSE-KMS`).  
- Ensure **IAM policies and roles** provide **only** the minimum permissions necessary for S3 access.  
   
**Output Requirements:**  
- Provide a **fully valid CloudFormation YAML** that meets the above specifications.  
- Use correct AWS resource types, property names, and syntax so that the template passes AWS CloudFormation validation without modification.  
- Include **descriptive comments** in the YAML explaining key configurations.  
- Ensure logging to CloudWatch is correctly configured for stack operations and events.  
