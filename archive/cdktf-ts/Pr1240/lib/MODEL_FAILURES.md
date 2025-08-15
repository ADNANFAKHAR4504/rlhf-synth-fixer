Here are 5 expert-level faults in **MODEL_RESPONSE.md** compared to **IDEAL_RESPONSE.md**:

1. **No centralized or cross-region KMS key policy integration**
   - The model defines separate KMS keys per region but does not configure cross-region key grants or replication policies for services that might need to access encrypted data between `us-east-1` and `us-west-2`.
   - The ideal solution uses a consistent, coordinated encryption policy so workloads in both regions can interoperate securely.

2. **Incomplete VPC Flow Logs implementation**
   - While CloudWatch log groups and IAM roles for VPC Flow Logs are created, the model never actually provisions the `aws_flow_log` resource to enable them on the VPCs.
   - In the ideal output, flow logging is fully enabled for all VPCs to meet monitoring requirements.

3. **IAM policies still too broad in some areas**
   - Some statements grant `Resource: "*"` (e.g., ECS execution role ECR permissions, KMS policies for S3 and ECS) instead of scoping resources explicitly to ARNs as in the ideal version.
   - The ideal solution enforces least privilege by limiting actions to specific resources and using condition keys.

4. **No CloudWatch metric alarms or monitoring alerts**
   - The model sets up CloudWatch log groups but omits metric filters, alarms, or dashboards to actively monitor system health and trigger alerts, which are present in the ideal implementation.
   - This misses a core “monitoring” requirement.

5. **Public subnet security best practice not fully enforced**
   - The model sets `mapPublicIpOnLaunch: false` but still creates internet gateways and routes all `0.0.0.0/0` traffic without NAT gateways for egress filtering.
   - The ideal version uses NAT gateways for private subnets, restricts outbound access, and applies more granular security group rules.
