Deploy a production-grade ECS Fargate stack in us-east-1 for three microservices: payment-service, fraud-service, and reporting-service. Build all dependencies from scratch including VPC across 3 availability zones, public subnets for ALB, private subnets for ECS tasks, NAT gateways, route tables, ECR repositories, ECS cluster with container insights, Cloud Map namespace, Application Load Balancer, target groups, listeners with path rules, CloudWatch log groups, IAM roles and policies, security groups, autoscaling policies, and CloudFormation outputs.

All resource names must include the EnvironmentSuffix parameter to avoid cross-deployment conflicts.

Architecture requirements:

Serverless only - all tasks run on Fargate with awsvpc networking, no EC2 instances.

Private networking - services run in private subnets with outbound egress via NAT gateways. The ALB sits in public subnets.

Service discovery - use Cloud Map namespace so inter-service calls resolve via service discovery, not hardcoded hostnames.

Security groups follow least-privilege - ALB ingress from the internet on ports 80 and 443 only. Services only accept traffic from the ALB security group or explicitly allowed peer security groups. No 0.0.0.0/0 on task security groups.

Observability - one log group per service with 7-day retention. Container insights enabled on the cluster.

Scalability - each service autoscaling target policy at 70 percent CPU, minimum 2 tasks.

Operability - Execute Command enabled on every task definition with required SSM permissions via the execution role.

Compliance - all resources tagged with Environment=Production and ManagedBy=CloudFormation.

YAML only - the template must be pure CloudFormation YAML, not JSON, and no YAML anchors or aliases.

Resilient parameterization - do not hardcode allowed values for EnvironmentSuffix. Instead enforce a safe naming regex via AllowedPattern. Keep the parameter flexible so values like prod-us, production, or qa can pass.

CloudFormation Parameters required:

EnvironmentSuffix as String with safe naming AllowedPattern and description explaining example values like prod-us, production, qa.

VpcCidr as String with default 10.20.0.0/16.

PublicSubnetCidrsAz1, PublicSubnetCidrsAz2, PublicSubnetCidrsAz3, PrivateSubnetCidrsAz1, PrivateSubnetCidrsAz2, and PrivateSubnetCidrsAz3 as String with /24 ranges within the VPC.

AcmCertificateArn as String for the ALB HTTPS listener ACM certificate.

PaymentImageUri, FraudImageUri, ReportingImageUri as String for private ECR image URIs in format account.dkr.ecr.us-east-1.amazonaws.com/repo:tag.

DesiredCount as Number with default 2 used as the minimum for all services.

Optional parameters with sensible defaults: LogRetentionDays default 7, TargetCpuPercent default 70.

Task sizing:
- payment-service: 1 vCPU and 2 GB memory
- fraud-service: 1 vCPU and 2 GB memory
- reporting-service: 0.5 vCPU and 1 GB memory

ALB configuration:
- HTTPS listener on port 443 using AcmCertificateArn
- HTTP listener on port 80 redirects to HTTPS
- Path-based routing: /payment/* routes to payment target group, /fraud/* routes to fraud target group, /reporting/* routes to reporting target group
- One target group per service with health checks and tuned thresholds/intervals

Cloud Map:
- Private DNS namespace in the VPC
- Register each ECS service into Cloud Map for discovery using payment.namespace, fraud.namespace, and reporting.namespace patterns

Auto Scaling per service:
- Application Auto Scaling target tracking on CPU 70 percent
- Minimum tasks equals DesiredCount which must be at least 2
- Reasonable maximum like 10

Security groups:
- AlbSecurityGroup with EnvironmentSuffix: ingress 80/443 from internet, egress to tasks
- EcsServiceSecurityGroup with EnvironmentSuffix per service or shared: ingress only from ALB security group on the container port, egress to VPC and AWS endpoints for ECR, CloudWatch, and Cloud Map
- Inter-service communication only via Cloud Map and permitted security group rules as needed

IAM roles and policies:
- Task execution role with ECR pull, CloudWatch Logs, ExecuteCommand permissions
- Task role scoped to least-privilege and extendable by the application later

CloudWatch Logs:
- Three dedicated log groups for payment, fraud, and reporting with 7-day retention parameterized

Execute Command:
- Enabled on services and task definitions with required configuration including SSM permissions via execution role

Tags: every resource includes Environment=Production, ManagedBy=CloudFormation, and a Name tag incorporating the EnvironmentSuffix.

Non-goals:
- No external or pre-existing VPCs, ALBs, or clusters referenced. Everything is created in this stack.
- No hardcoded ARNs except through parameters and no environment-specific magic values.

Acceptance criteria:
- Single TapStack.yml renders a deployable stack that passes cfn-lint and CloudFormation validation
- All logical/resource names, ALB target group names, log groups, security groups, and ECS services include the EnvironmentSuffix
- Path rules route correctly to each service and health checks stabilize services
- Each service can scale from 2 to N tasks based on CPU
- Service discovery records resolve inside the VPC
- aws ecs execute-command works against running tasks with appropriate operator IAM

Deliverable:

Provide one file named TapStack.yml containing the complete CloudFormation YAML template with:
1. Metadata with brief description and template version
2. Parameters as listed with defaults where appropriate and AllowedPattern for EnvironmentSuffix
3. Conditions if any
4. Mappings only if truly needed, avoid unnecessary complexity
5. Resources for end-to-end creation of VPC, subnets, routing, IGW, NATs, security groups, ECR repos, ECS cluster, Cloud Map namespace, ALB with target groups and listeners and rules, IAM roles and policies, CloudWatch log groups, task definitions, ECS services, and autoscaling
6. Outputs exporting ARNs, IDs, and hostnames including VpcId, PrivateSubnetIds, PublicSubnetIds, AlbDnsName, AlbArn, ClusterName, CloudMapNamespaceId, CloudMapNamespaceName, PaymentServiceName, FraudServiceName, ReportingServiceName, PaymentServiceDiscoveryName, FraudServiceDiscoveryName, ReportingServiceDiscoveryName, PaymentTargetGroupArn, FraudTargetGroupArn, ReportingTargetGroupArn, LogGroupPayment, LogGroupFraud, LogGroupReporting

Authoring requirements:
- Output must be YAML CloudFormation, not JSON, with no YAML anchors or aliases
- Use clear deterministic Sub name patterns that append the EnvironmentSuffix
- Include explicit DependsOn where resource ordering matters like listeners and rules after target groups, services after cluster and log groups and IAM
- Health checks must set sensible IntervalSeconds, HealthyThresholdCount, UnhealthyThresholdCount, and Matcher for 200-399 status codes, with HealthCheckPath per service like /health or parameterized
- Ports should use distinct container names and ports per service, parameterize ports as needed
- Ensure Auto Scaling resources reference the correct service ARN and scalable dimension
- Keep policies least-privilege while including ECR pulls, logs, ExecuteCommand, and service discovery requirements
- Tag every resource with both mandated tags and a meaningful Name that embeds the EnvironmentSuffix

Output format:

Return a single fenced code block containing the full TapStack.yml content in YAML using a standard yaml code fence. Do not return any additional commentary outside the code block.
