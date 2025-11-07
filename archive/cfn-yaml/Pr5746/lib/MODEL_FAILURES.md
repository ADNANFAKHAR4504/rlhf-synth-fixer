### **model_failure**

The model output contains partial or incorrect implementation of the requested zero-trust baseline.
It may miss critical compliance or security requirements such as MFA enforcement in KMS key policies, omission of IAM password policy configuration, incomplete boundary policies, or missing AWS Config rules.
Some resources could use overly broad permissions or wildcard ARNs, violating the least-privilege principle.
Deployment might fail due to dependency issues, recorder or delivery channel conflicts, or missing encryption settings on CloudWatch and S3.
The template would therefore not fully meet the “build everything new” zero-trust and compliance expectations described in the prompt.
