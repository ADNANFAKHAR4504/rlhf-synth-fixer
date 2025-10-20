**model_failure**

A failed response would show any of the following issues:

* The CloudFormation template contains syntax or logical errors such as unreferenced parameters, missing dependencies, or invalid intrinsic functions.
* The solution violates AWS constraints, for example using uppercase characters in S3 bucket names or omitting encryption policies.
* The design misses one or more mandatory resources (like CloudTrail, IAM role, or CPU alarm) or uses pre-existing resources instead of creating new ones.
* The IAM role grants overly broad permissions instead of least-privilege access.
* Bucket policies fail to enforce TLS or public access blocking.
* Key policies omit service principals (S3 or CloudTrail), preventing the stack from deploying.
* Conditional logic (for SSH or KeyName) is missing or incorrectly implemented.
* Tags are inconsistent or missing, violating the project tagging standard.
* The response reads like auto-generated text instead of thoughtful human explanation — overly generic, repetitive, or lacking context.

In short, a failure occurs when the response feels synthetic, introduces deployment errors, or neglects the compliance and security rigor required by the specification.
