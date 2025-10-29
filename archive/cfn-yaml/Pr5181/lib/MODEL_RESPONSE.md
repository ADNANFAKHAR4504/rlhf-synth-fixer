# model_response

## What’s delivered

A single, production-ready `TapStack.yml` that builds an entirely new stack in **us-east-1** with a `ProdVPC`, two public subnets, internet egress, secure EC2 compute, optional EIP, scoped IAM, a KMS-encrypted versioned S3 bucket, CloudTrail with SSE-KMS, an ASG with CPU-based scaling, and SSM patch automation. The template is parameterized, safe by default, and deployable without mandatory interactive inputs.

## Key design choices

* **Optional SSH key**: `KeyName` defaults empty; `UseKeyName` condition omits the property to avoid parameter validation failures while still allowing SSH when desired.
* **Subnet/AZ agility**: Subnets use `Fn::GetAZs` and `Select` for portability, avoiding AZ literals.
* **Encryption everywhere**: S3 SSE-KMS with a customer CMK and explicit alias; CloudTrail KMS integration; EBS encrypted gp3 boot volumes.
* **Least privilege**: Inline S3 read-only permissions narrowed to the created bucket ARN + `/*`; SSM managed policy attached to the instance role.
* **CloudTrail correctness**: Bucket policy supports ACL check and `PutObject` with `bucket-owner-full-control`; KMS key policy allows CloudTrail usage by encryption context.
* **Scaling fidelity**: Launch Template mirrors the standalone instances; ASG spans both subnets; alarms/policies set to 60% out / 30% in, 2×60s windows.
* **Operational hygiene**: SSM Association runs `AWS-RunPatchBaseline` nightly; consistent tags and resource metadata support ops and cost allocation.

## How requirements are met

* VPC with two **public subnets** across AZs, IGW, and public routing.
* Two EC2 instances, each in a different public subnet; one gets an EIP when `CreateEIP=true`.
* Security Group permits HTTP 80 from `0.0.0.0/0` and SSH 22 from `SSHLocation`.
* IAM role & instance profile grant SSM core and scoped S3 read-only.
* S3 bucket has versioning, strict public access block, SSE-KMS with stack CMK and alias.
* CloudTrail enabled to the bucket with log file validation and SSE-KMS.
* Launch Template + ASG (min 2, max 4, desired 2); CloudWatch alarms/policies handle scaling via CPU.
* Parameters (`KeyName`, `SSHLocation`, `CreateEIP`, `LatestAmiId`) and conditions (`CreateEIPCondition`, `UseKeyName`) implemented.
* Outputs surface all key identifiers and public IPs.
* Naming/tagging uses `prod-` prefix and `{Environment=prod, Project=TapStack}`.

## Notable implementation details

* `EIPAssociation` uses `AllocationId` (required for VPC) rather than the legacy `EIP` property.
* CloudWatch alarm actions reference the scaling policy **ARNs** via `GetAtt`.
* UserData installs and serves a simple HTML page for fast HTTP verification.
* `AWS::CloudFormation::Interface` labels parameters for better UX.

## Future-proofing

* The pattern cleanly extends to add private subnets, NAT gateways, ALB, and RDS if the workload evolves.
* KMS CMK can be reused by other services; bucket policy can be expanded for access logs or data-lake use cases.

