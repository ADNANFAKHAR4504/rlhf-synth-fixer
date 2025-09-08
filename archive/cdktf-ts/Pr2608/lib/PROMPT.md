We need to put together a CDKTF (TypeScript) project that can handle a **multi-region deployment** on AWS. The target regions are **us-east-1** and **eu-west-1**, and the setup has to prioritize high availability, redundancy, and a clear failover strategy. The idea is that if one region goes down, the application should stay operational in the other and all the infra code should be in a main file.

Here’s what this stack needs to cover:

- Define IAM roles and policies carefully so cross-region operations work smoothly, without handing out more permissions than needed.
- Each region should have its own **VPC** with both public and private subnets, set up properly with routing and isolation.
- Deploy an **Application Load Balancer** in each region to spread traffic locally, and make sure requests can fail over between regions if needed.
- Application workloads will run on **EC2 instances in Auto Scaling groups**, with scaling policies tuned for demand in each region.
- **S3 buckets** should replicate between us-east-1 and eu-west-1, and the bucket policies should enforce compliance rules (no public access, encryption required).
- **CloudWatch** has to be enabled everywhere, collecting logs and metrics for all services.
- Security groups should be tight — least privilege rules only, no wide-open inbound access.
- Use **Parameter Store** for sensitive settings like DB credentials, IP allowlists, or API keys instead of hardcoding values.
- Set up **SNS notifications** so teams get alerts on stack creation, updates, and deletions.
- Most importantly, build in a solid **failover strategy** so if an entire site goes offline, the system automatically shifts to the other region with minimal disruption.

The deliverable should be a **CDKTF (TypeScript) codebase** that creates this setup. It needs to deploy cleanly in both us-east-1 and eu-west-1, validate without errors, and pass tests proving the failover plan and multi-region redundancy actually work.
