You are an expert AWS Cloud Development Kit (CDK) engineer who outputs production‑ready TypeScript CDK code (CloudFormation via CDK v2). Generate one TypeScript file named failureRecoveryInfrastructure.ts that implements a failure recovery and high‑availability infrastructure exactly as described below. Do NOT change, remove, or reinterpret any of the provided data — keep every requirement, constraint, and environment detail intact.

Important naming and suffix rule: All resource names must use the naming convention prefix 'prod-' followed by the service name and role (for example 'prod-ec2-web'). Where names must be globally unique or environment-specific, append a configurable String suffix. Put the default suffix in one clear place near the top of the file (eg. const nameSuffix = '-prdev01') and document how to change it. Use resource names formatted like: prod-[service]-[role][nameSuffix]. Ensure the provided VPC name 'prod-app-vpc' and CIDR 10.0.0.0/16 are used exactly as specified.

Problem to solve :
Design and implement a failure recovery and high availability infrastructure using AWS CloudFormation (via CDK) and TypeScript that serves a stateful web application backed by Amazon EC2, Elastic Load Balancing, Auto Scaling, and Amazon RDS (MySQL). The solution must meet these numbered requirements exactly:

1. Utilize AWS resources to ensure the infrastructure operates with high availability and is capable of automatically recovering from the failure of any single component.  
2. Distribute incoming web traffic via an Elastic Load Balancer across multiple EC2 instances in different availability zones.  
3. Deploy EC2 instances using an Auto Scaling Group which monitors traffic and scales in or out according to demand based on CPU utilization.  
4. Maintain session persistence for users connecting to the web application.  
5. Implement a secure VPC setup with public and private subnets, and enforce least privilege access using Security Groups and Network ACLs.  
6. Securely store and manage application logs using AWS S3, configure lifecycle rules for automated archive of logs.  
7. Design database solutions leveraging Amazon RDS MySQL instances, ensuring data replication and automated backups.  
8. Monitor application health using CloudWatch, setting up alarms to notify on performance degradation.  
9. Enable encrypted data storage and transmission.  
10. Provide comprehensive stack outputs listing all critical resource identifiers for further reference.

Environment:
- Multi-region AWS Cloud environment using us-east-1 as the primary region and us-west-2 as the secondary region.  
- Deploy all resources to AWS account ID 123456789012.  
- The VPC must be named exactly 'prod-app-vpc' and use CIDR 10.0.0.0/16.  
- Naming conventions include the prefix 'prod-' followed by the service name and role (e.g., 'prod-ec2-web').

Constraints & implementation details
- The infrastructure must support auto-scaling policies to automatically adjust instance counts based on CPU usage.  
- A minimum of two public subnets and two private subnets must be present in different availability zones for high availability.  
- Implement Elastic Load Balancing to distribute network traffic evenly across instances within different availability zones.  
- Amazon RDS instance must be multi‑AZ for failover support.  
- Backups must be enabled for all RDS instances with a minimum retention period of 7 days.  
- The application must run on EC2 instances within an Auto Scaling Group that spans multiple availability zones.  
- Ensure EC2 instances support cross‑zone load balancing.  
- Use Amazon S3 to store application logs with lifecycle policies to transition logs to Glacier after 30 days.  
- Configure Route 53 for DNS failover and health checks.  
- Implement VPC for networking isolation with a CIDR block of size /16.  
- All subnets should be associated with the VPC and have proper route tables for internal communication.  
- Implement Security Groups and NACLs to allow only necessary inbound and outbound traffic.  
- Utilize IAM roles for EC2 instances to access S3 buckets set up for logging.  
- Configure CloudWatch to monitor EC2 and RDS instances for performance, setting alarms for failure conditions.  
- Set up CloudFormation stacks to manage infrastructure as code systematically and allow updates without downtime.  
- Design the infrastructure to support rolling updates and zero‑downtime deployments.  
- Encrypt all data at rest and in transit using AWS KMS‑managed keys.  
- Provide detailed CloudFormation stack outputs listing key resources such as Instance IDs, ELB DNS, and RDS endpoints.  
- Establish policies to automatically recover failed instances with Elastic Load Balancer.

Deliverable requirements:
- Produce a single TypeScript file named failureRecoveryInfrastructure.ts containing a CDK v2 app and stack(s). The file must be self-contained, well‑commented, and ready to run with node 18+ and CDK v2.  
- Put configuration options (regions list, account id, VPC CIDR, environment name, and the String nameSuffix) at the top of the file in a clearly labeled configuration block and document how to change them. Do NOT change the provided values by default.  
- Create constructs/stacks for: VPC (public/private subnets across AZs), Security Groups & NACLs, Auto Scaling Group + Launch Template/Configuration, Application Load Balancer (with cross‑zone load balancing and sticky sessions for session persistence), RDS MySQL multi‑AZ instance(s) with encryption and 7‑day backups, S3 bucket(s) for logs with lifecycle to Glacier after 30 days (and versioning enabled), CloudWatch alarms and dashboards, Route 53 health checks and DNS failover records, IAM roles for EC2 with least privilege (access to S3 logging buckets), and KMS key(s) for encryption. Use AWS managed KMS keys where applicable or create customer managed keys and document key policy basics.  
- Implement Auto Scaling CPU‑based scaling policies and ensure minimum 2 instances in the ASG. Include scaling cooldowns and metrics thresholds as sensible defaults and document how to tune them.  
- Ensure ALB target groups include health checks and ALB configured to distribute across AZs; enable session stickiness for session persistence (document the chosen stickiness method and rationale).  
- Implement NACLs with minimal, documented rules; Security Groups should strictly limit inbound access (HTTP/HTTPS from ALB, SSH only from admin CIDR if provided via config), and allow necessary outbound access.  
- Ensure RDS is created multi‑AZ, with storage encrypted using KMS, automated backups enabled (retention >= 7 days), and snapshots/backup window documented. Use Secrets Manager to hold DB credentials (do not hardcode credentials in code).  
- Implement S3 lifecycle rules to transition objects to Glacier after 30 days; ensure S3 bucket encryption at rest (SSE‑KMS) and enforce bucket policy to allow only HTTPS requests.  
- Configure CloudWatch alarms for EC2 CPU (scale out/in triggers), RDS high CPU or replica lag, and ELB unhealthy host counts. Add SNS topic subscriptions (email placeholder) for alarm notifications and include cross‑region considerations.  
- Configure Route 53 failover/weighted records and health checks for DNS failover between us‑east‑1 and us‑west‑2 for the application endpoint (CloudFront or ALB) as appropriate. Document TTL and failover behavior.  
- Provide CloudFormation stack outputs for: VPC id, subnet ids (public/private), ALB DNS name, ASG name, EC2 instance ids (or a sample listing), RDS endpoint (host & port), S3 log bucket name, KMS key ARN, SNS topic ARN, Route53 record name.  
- Include inline comments throughout the TypeScript explaining design choices and where to change parameters (regions list, nameSuffix, instance types, min/max ASG sizes, admin CIDR for SSH).  
- Add a short “post‑deployment validation” checklist as a code comment or top-of-file comment block describing CLI/console checks to verify S3 versioning & lifecycle, RDS encryption & backups, ALB health & stickiness, CloudWatch alarms, and Route53 failover.  
- Add at least one example unit test (jest) or a small validation script that syntactically asserts key properties of synthesized CloudFormation (for example: S3 bucket has lifecycle rule, RDS has MultiAZ true, ALB has crossZoneLoadBalancing enabled, ASG minSize >= 2). Include instructions to run the test.  
- Ensure the code supports rolling updates / zero‑downtime deployments for the ASG (use rolling replacement configuration, e.g., AWS CodeDeploy blue/green or ASG instance refresh / UpdatePolicy via CloudFormation—document the chosen approach).  
- All encryption must use KMS and TLS for in‑transit; document the KMS keys used and any required key policies or roles.  
- Keep secrets out of source; use AWS Secrets Manager (create a secret resource and store DB credentials) and reference that secret in RDS and any scripts—do NOT place plaintext passwords in the code.  
- Ensure all resource names that require uniqueness append the configurable String suffix and show where to change that suffix. Do not alter the provided VPC name or CIDR.

Testing & verification:
- Show how to synth (cdk synth) and deploy (cdk deploy --all / per-stack) across the two regions using the CDK context/parameters. Document how to deploy primary and secondary regions in the README comment.  
- Provide post‑deployment smoke tests (curl ALB/CloudFront endpoint, check DB connectivity using a read-only query using credentials from Secrets Manager, verify S3 log writes by uploading a sample log file, check CloudWatch alarms & SNS notifications).  
- Provide instructions to tear down (cdk destroy) and note any caution about deleting RDS snapshots/data.

Non‑functional requirements:
- Use secure defaults (least privilege, no public S3 access, encryption at rest for RDS and S3).  
- Modular, readable, idiomatic CDK TypeScript code (use Constructs where appropriate).  
- Document any AWS service caveats (for example KMS/regional constraints, RDS multi‑AZ semantics, Route53 cross‑region failover behavior).  
- The output must be a single file named failureRecoveryInfrastructure.ts (plus an optional test file sample) — include clear comments and a top configuration block with the immutable values you provided (account id 123456789012, VPC name, CIDR). Do not split the main stack across multiple files unless you also provide a single-file alternative; the user specifically expects failureRecoveryInfrastructure.ts.

Final notes:
- Do NOT change or reinterpret any of the requirement text, constraint items, environment descriptions, or naming conventions above — implement them verbatim.  
- Ensure the String suffix is appended to resource names where needed and document how to change the suffix.  
- Produce only CDK TypeScript code (CloudFormation via CDK). Do not produce Terraform, Pulumi, or other IaC outputs.

Now generate the complete TypeScript CDK file failureRecoveryInfrastructure.ts and include the test example and post-deployment validation checklist as comments at the top of the file.

