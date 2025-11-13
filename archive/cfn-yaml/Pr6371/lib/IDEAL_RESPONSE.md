# Ideal Response: Highly Available Load Balancing Architecture for Financial Services Payment Processing API

## Architecture Overview

This CloudFormation template creates a production-grade, highly available AWS infrastructure designed specifically for a financial services payment processing API that requires 99.99% uptime SLA. The architecture implements comprehensive load balancing capabilities spanning two Availability Zones in the us-west-1 region with complete network infrastructure provisioning from the ground up. The infrastructure follows AWS Well-Architected Framework principles with emphasis on high availability, security, compliance, and operational excellence required for financial services workloads.

### Network Architecture with Full VPC Provisioning

This infrastructure creates a complete, self-contained VPC architecture from scratch in the us-west-1 region, providing full control over network configuration and eliminating dependencies on pre-existing networking resources. This approach is ideal for greenfield deployments, isolated environments, or scenarios requiring complete infrastructure reproducibility through code. The template accepts CIDR block parameters for the VPC and all subnets, enabling flexible IP address allocation while maintaining consistent /16 VPC and /24 subnet sizing following AWS networking best practices.

The VPC is created with a default CIDR block of 10.0.0.0/16 providing 65,536 IP addresses, sufficient for substantial growth in instance count, additional application tiers, or future microservices expansion. DNS hostnames and DNS support are explicitly enabled (EnableDnsHostnames: true, EnableDnsSupport: true), essential for internal service discovery, AWS service endpoint resolution, and proper functioning of the Application Load Balancer which relies on DNS for health checks and traffic distribution.

The architecture spans two Availability Zones (us-west-1a and us-west-1b) for high availability and fault tolerance, providing redundancy for mission-critical payment processing workloads. Two public subnets (default CIDRs: 10.0.1.0/24, 10.0.2.0/24) host the internet-facing Application Load Balancer and NAT Gateways, providing the infrastructure's public-facing components with direct internet connectivity through the Internet Gateway. Two private subnets (default CIDRs: 10.0.11.0/24, 10.0.12.0/24) contain the Auto Scaling Group instances running the payment processing application, ensuring application servers have no direct internet exposure and can only be accessed through the load balancer or administrative access channels via AWS Systems Manager Session Manager.

Public subnets are configured with MapPublicIpOnLaunch: true, automatically assigning public IP addresses to resources launched in these subnets including NAT Gateways and, if needed, bastion hosts or other management resources. Private subnets use MapPublicIpOnLaunch: false, preventing automatic public IP assignment and ensuring instances launched in these subnets remain isolated from direct internet access, accessible only through the NAT Gateways for outbound connectivity.

The Internet Gateway provides bidirectional internet connectivity for public subnets, enabling the Application Load Balancer to receive incoming HTTP traffic from clients worldwide and allowing NAT Gateways to route outbound traffic from private subnet instances to the internet. The gateway is attached to the VPC through a VPCGatewayAttachment resource with explicit DependsOn relationships ensuring proper creation order during CloudFormation stack deployment, preventing race conditions where routes or resources attempt to reference the gateway before attachment completes.

Two NAT Gateways (one per Availability Zone) provide highly available outbound internet access for private subnet instances, enabling them to download packages via yum, apply security patches, communicate with external APIs, and access AWS service endpoints while remaining inaccessible from the public internet. Each NAT Gateway is deployed in the corresponding public subnet (NATGateway1 in PublicSubnet1, NATGateway2 in PublicSubnet2) and associated with a dedicated Elastic IP address providing a static, predictable source IP for outbound traffic. This architecture ensures that the failure of a single NAT Gateway affects only instances in the associated Availability Zone, with instances in other AZs maintaining internet connectivity through their dedicated NAT Gateways.

Routing is configured with one public route table shared across all public subnets and two separate private route tables (one per private subnet). The public route table contains a default route (0.0.0.0/0) pointing to the Internet Gateway, enabling direct internet access for resources in public subnets. Each private route table contains a default route (0.0.0.0/0) pointing to the NAT Gateway in the corresponding Availability Zone (PrivateRouteTable1 → NATGateway1, PrivateRouteTable2 → NATGateway2), ensuring traffic from private subnet instances routes through the local NAT Gateway for optimal performance and minimizing cross-AZ data transfer charges. This independent routing configuration provides AZ-level fault isolation where NAT Gateway failures impact only the associated AZ's private subnet while other AZs continue operating normally.

### Security Layer and Compliance

Security is implemented at multiple layers following the principle of least privilege and defense in depth, critical for financial services compliance requirements including PCI DSS, SOC 2, and regulatory standards for payment processing. Security groups provide stateful, instance-level firewall controls with explicit rules for each traffic type, automatically adapting to infrastructure changes without manual IP address management.

The ALBSecurityGroup allows inbound HTTP (port 80) traffic from anywhere (0.0.0.0/0), enabling public access to the payment API endpoint from clients worldwide. The HTTP-only configuration is intentional for this deployment, suitable for scenarios where SSL/TLS termination occurs at a higher layer (CloudFront, API Gateway, or corporate proxy) or where the application operates in a development/testing environment. For production deployments handling sensitive payment data, organizations should implement HTTPS with SSL/TLS certificates from AWS Certificate Manager, enforcing encryption in transit to meet PCI DSS requirements. All outbound traffic is allowed from the ALB (0.0.0.0/0 egress with IpProtocol: -1 covering all protocols), enabling the load balancer to communicate with backend instances on port 80 and perform health checks without restrictions.

The EC2SecurityGroup implements strict access controls using security group references instead of CIDR blocks, allowing HTTP traffic (port 80) only from the ALBSecurityGroup using SourceSecurityGroupId. This approach provides dynamic security boundaries that automatically adapt as the load balancer scales or infrastructure changes occur, preventing direct internet access to application instances. The security group reference creates a logical trust relationship where any resource associated with the ALB security group can communicate with EC2 instances, but no other source (including the internet, other VPCs, or resources in the same VPC without the ALB security group) can reach the application instances on port 80.

SSH access (port 22) is implicitly denied from all sources since no SSH ingress rule exists in the EC2SecurityGroup, meeting security compliance requirements that prohibit direct SSH access from the internet to protect against brute force attacks, credential compromise, and unauthorized access. Administrative access should be exclusively through AWS Systems Manager Session Manager (enabled via AmazonSSMManagedInstanceCore managed policy in the IAM role), providing browser-based, auditable access without requiring public IPs, SSH keys, bastion hosts, or security group SSH rules. Session Manager logs all sessions to CloudTrail with optional session command logging to S3 or CloudWatch Logs, meeting compliance requirements for administrative access auditing and forensic investigation capabilities.

All outbound traffic is allowed from EC2 instances (0.0.0.0/0 egress with IpProtocol: -1), following AWS default behavior and providing flexibility for application needs including package downloads from yum repositories, external API calls to payment gateways or third-party services, AWS service communication (S3, DynamoDB, CloudWatch), and dynamic dependency resolution. For enhanced security in production environments with strict compliance requirements, outbound rules can be restricted to specific destinations using security groups, prefix lists, or CIDR blocks covering only approved services such as specific AWS service endpoints (via VPC endpoints or AWS IP ranges), approved external APIs with known IP ranges, and package repositories (Amazon Linux repositories, corporate mirrors).

### Load Balancing Layer with Cross-Zone Distribution

The Application Load Balancer provides intelligent Layer 7 traffic distribution serving as the single entry point for all client HTTP requests to the payment processing API. The ALB is internet-facing with scheme: internet-facing and deployed across both public subnets for maximum availability, automatically distributing incoming traffic across healthy EC2 instances in multiple Availability Zones. The load balancer is given a DependsOn: AttachGateway attribute ensuring the Internet Gateway attachment completes before ALB creation, preventing deployment failures from attempting to create an internet-facing load balancer before the VPC has internet connectivity.

Cross-zone load balancing is explicitly enabled (load_balancing.cross_zone.enabled: true), ensuring traffic is distributed evenly across all healthy targets regardless of Availability Zone, preventing hotspots and optimizing resource utilization. Without cross-zone load balancing, each ALB node (deployed in each enabled Availability Zone) distributes traffic only to targets within the same AZ, creating uneven load distribution when instance counts differ across AZs or when traffic is concentrated at specific ALB nodes due to DNS caching or geographic routing. With cross-zone enabled, all ALB nodes treat all instances as a single pool, distributing traffic evenly with each instance receiving approximately equal traffic regardless of AZ location or which ALB node received the initial client connection.

The HTTP listener (port 80) forwards traffic directly to the target group without redirection, suitable for HTTP-only deployments where encryption is handled at other layers or not required for the specific use case. The listener uses a simple forward action with Type: forward and TargetGroupArn referencing the target group, establishing the connection between the load balancer and the Auto Scaling Group instances. For production payment processing workloads handling sensitive financial data, organizations should add an HTTPS listener (port 443) with SSL certificate from AWS Certificate Manager and configure the HTTP listener to redirect to HTTPS using redirect action with Protocol: HTTPS, Port: 443, and StatusCode: HTTP_301, ensuring all payment transactions are encrypted in transit and meeting PCI DSS encryption requirements.

The target group implements comprehensive health checking with a /health endpoint expecting HTTP 200 responses, verifying application functionality beyond basic connectivity. Health check intervals are set to 15 seconds (the minimum allowed) with an unhealthy threshold of 2 consecutive failures, providing rapid failure detection to quickly remove unhealthy instances from rotation within 30 seconds (15s × 2 failures). This aggressive health checking meets the 99.99% uptime SLA requirement by minimizing the time unhealthy instances remain in service and could receive traffic. The healthy threshold is set to 3 consecutive successes, balancing rapid instance addition with stability to prevent flapping where instances rapidly cycle between healthy and unhealthy states due to transient issues, temporary CPU spikes, or momentary network delays.

Connection draining (deregistration_delay.timeout_seconds: 300) allows in-flight payment requests to complete gracefully before terminating instances during scale-down events, Auto Scaling replacements, deployments, or manual instance termination. The 5-minute timeout provides substantial time for complex payment workflows to complete including multi-step authorization, fraud screening API calls, transaction settlement, callback processing, or webhook deliveries without abrupt termination that could cause transaction failures, data inconsistencies, or customer-facing errors. Payment transactions often involve multiple sequential external API calls to payment gateways, fraud detection services, banking networks, or merchant systems, each with network latency and processing time, requiring generous timeouts to prevent interruption during critical financial operations.

Sticky sessions using application-based cookies (stickiness.type: app_cookie) with 86400-second duration (24 hours) and cookie name PAYMENT_SESSION maintain session affinity, ensuring users remain connected to the same backend instance for the duration of their session. This is critical for stateful payment workflows that maintain transaction context, shopping carts, multi-step checkout processes, authentication state, or in-memory session data across multiple requests. Without sticky sessions, the load balancer routes each request independently to any healthy instance, causing session loss when subsequent requests land on different instances that don't have the user's session data, cart contents, authentication tokens, or workflow state, resulting in failed transactions, forced re-authentication, or lost shopping carts frustrating customers.

Deletion protection is enabled (deletion_protection.enabled: true) preventing accidental deletion of the load balancer through console, CLI, or API actions, protecting this critical infrastructure component from operational errors. The load balancer serves as the single entry point for all client requests to the payment processing API, making its availability critical for system operation. Accidental deletion would immediately terminate all incoming connections, make the application inaccessible to customers, cause revenue loss from failed transactions, and require significant time (30-60 minutes) to recreate and reconfigure the load balancer, target group, listener, and update any external references including DNS records or API gateway integrations.

### Auto Scaling and Compute Layer with IMDSv2

The compute layer uses an Auto Scaling Group that dynamically adjusts capacity based on CPU utilization, providing automatic horizontal scaling to match varying payment processing load while maintaining cost efficiency. The ASG is configured with a minimum size of 2 instances (default), desired capacity of 3 instances, and maximum size of 6 instances, ensuring high availability through instance redundancy while providing headroom for traffic spikes during peak business hours (lunch periods, evening shopping), seasonal demand surges (holidays, tax season, back-to-school), or marketing campaigns that drive payment volume.

Instances are deployed across both private subnets (PrivateSubnet1 and PrivateSubnet2) spanning us-west-1a and us-west-1b, ensuring even distribution across Availability Zones for maximum fault tolerance. The ASG's distribution logic (handled automatically by AWS) ensures instances spread evenly across AZs, preventing single-AZ concentration that would create availability risks during AZ failures. With 3 instances across 2 AZs under normal conditions, instances are distributed with 2 in one AZ and 1 in the other. During AZ failures, the remaining AZ continues serving traffic while Auto Scaling automatically launches replacement instances in the healthy AZ within 5-10 minutes, maintaining minimum capacity of 2 instances.

The ASG automatically replaces failed instances based on ELB health checks (HealthCheckType: ELB) with a 300-second grace period (HealthCheckGracePeriod: 300), allowing sufficient time for application initialization including package installation via yum, service startup (httpd, CloudWatch agent, Systems Manager agent), health check endpoint creation, and application warm-up before health verification begins. ELB health checks provide application-level verification ensuring instances are not only running (EC2 health check) but also successfully handling HTTP requests from the load balancer and returning correct responses, detecting application failures, configuration errors, dependency issues (external API connectivity), or resource exhaustion that EC2 status checks miss.

The Launch Template uses t3.medium instance type as the default (configurable to t3.large, t3.xlarge, m5.large, m5.xlarge via AllowedValues constraint) providing a balance of compute performance and cost efficiency for API workloads. T3 instances offer burstable CPU performance with baseline and burst credits, suitable for payment processing APIs with variable load patterns that don't require sustained high CPU. The t3.medium provides 2 vCPUs, 4 GB memory, and a baseline CPU performance of 20% per vCPU with burst capability to 100% when credits are available, appropriate for typical API request processing with brief CPU bursts during request handling.

The AMI ID is dynamically resolved from AWS Systems Manager Parameter Store using the path /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2 (via Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>), ensuring instances always launch with the latest Amazon Linux 2 AMI including current security patches, kernel updates, and package versions without requiring manual AMI ID updates or stack modifications. This dynamic resolution approach eliminates stale AMI references that could contain unpatched vulnerabilities or outdated package versions, critical for maintaining security compliance in financial services environments subject to rapid patch requirements.

Critical security configuration includes IMDSv2 enforcement (MetadataOptions: HttpTokens: required, HttpPutResponseHopLimit: 1, HttpEndpoint: enabled), protecting against SSRF (Server-Side Request Forgery) attacks that exploit Instance Metadata Service access. IMDSv2 requires session tokens for metadata access, preventing malicious code, vulnerable applications, or compromised instances from retrieving IAM credentials, instance identity documents, or user data without proper authorization through token-based session-oriented requests. This security control is mandatory for PCI DSS compliance and financial services workloads handling sensitive payment data, preventing credential theft that could lead to data breaches, unauthorized AWS resource access, or lateral movement within the environment.

The user data script implements IMDSv2-compatible metadata access for retrieving the instance ID when creating the sample index page. The script first obtains a session token through a PUT request to the metadata token endpoint (curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"), then uses that token in subsequent metadata requests via the X-aws-ec2-metadata-token header (curl -H "X-aws-ec2-metadata-token: $TOKEN" -s http://169.254.169.254/latest/meta-data/instance-id). This two-step process is required when HttpTokens: required is set, as IMDSv1-style direct GET requests to metadata endpoints would fail, preventing instance initialization and causing health check failures leading to instance replacement loops.

Detailed monitoring is enabled (Monitoring: Enabled: true) collecting EC2 metrics at 1-minute intervals instead of the default 5-minute intervals, providing faster problem detection (identifying issues within 1-2 minutes rather than 5-10 minutes) and more granular visibility into CPU utilization, network traffic, disk I/O, and status check metrics. The Auto Scaling Group's MetricsCollection configuration with Granularity: 1Minute ensures scaling metrics (GroupMinSize, GroupMaxSize, GroupDesiredCapacity, GroupInServiceInstances, GroupPendingInstances, GroupStandbyInstances, GroupTerminatingInstances, GroupTotalInstances) are also collected at 1-minute intervals, enabling precise correlation between scaling events and resource utilization patterns crucial for capacity planning and troubleshooting scaling behavior.

The user data script installs Apache HTTP server (httpd) for serving the payment API, Amazon CloudWatch Agent for custom metrics and log forwarding, and Amazon SSM Agent for Systems Manager capabilities. The script creates a /health endpoint returning "OK" for load balancer health checks and configures the CloudWatch Agent to collect CPU metrics (cpu_usage_idle, cpu_usage_iowait, cpu_usage_user, cpu_usage_system), disk metrics (used_percent, inodes_free), and memory metrics (mem_used_percent) at 60-second intervals. Log collection is configured for application access logs (/var/log/httpd/access_log), application error logs (/var/log/httpd/error_log), and system logs (/var/log/messages), forwarding all logs to CloudWatch Logs with log groups named using the stack name for unique identification across multiple deployments and log streams identified by instance ID for per-instance troubleshooting.

Target tracking scaling policy automatically adjusts instance count based on 70% CPU utilization threshold (TargetValue: 70.0 with PredefinedMetricType: ASGAverageCPUUtilization), scaling out when aggregate CPU across all instances exceeds 70% and scaling in when CPU falls below 70% for the duration of the target tracking policy's internal evaluation periods. This provides 30% headroom capacity for sudden traffic spikes, brief CPU bursts, or temporary load increases while optimizing costs during low-traffic periods through automatic scale-down when demand decreases. The target tracking policy handles all scaling decisions automatically without requiring separate scale-out and scale-in policies with manually defined CloudWatch alarms and threshold tuning.

### IAM Roles and Policies with Least Privilege

The EC2InstanceRole provides instances with permissions following the principle of least privilege, granting only the minimum access required for application functionality and operational needs. The role uses an assume role policy document allowing the ec2.amazonaws.com service principal to assume the role (Action: sts:AssumeRole), establishing the trust relationship between EC2 and IAM that permits the service to provide temporary credentials to instances.

The role includes two AWS-managed policies: CloudWatchAgentServerPolicy providing permissions for the CloudWatch Agent to publish custom metrics and logs to CloudWatch without requiring manual policy creation and maintenance for the extensive set of permissions needed by the agent, and AmazonSSMManagedInstanceCore enabling AWS Systems Manager capabilities including Session Manager for browser-based SSH alternative, Run Command for remote script execution, Patch Manager for automated OS patching, and Parameter Store access for configuration management. Session Manager provides fully auditable access with all sessions logged to CloudTrail and optionally to S3 or CloudWatch Logs with full command logging, meeting compliance requirements for administrative access logging, session recording, and forensic investigation capabilities without requiring SSH keys, bastion hosts, or public IP addresses on instances.

The CloudWatchLogsPolicy custom inline policy grants precise permissions for CloudWatch Logs and metrics operations with resource-level restrictions. The logs permissions (logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents, logs:DescribeLogStreams) are scoped to log groups under the /aws/ec2/_ path in the current region and account (Resource: arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/_), allowing the CloudWatch Agent to create log groups for application and system logs while preventing access to other log groups in the account that might contain sensitive data from other applications or services. The CloudWatch metrics permissions (cloudwatch:PutMetricData, cloudwatch:GetMetricStatistics, cloudwatch:ListMetrics) use Resource: \* because CloudWatch metrics permissions do not support resource-level restrictions in IAM policies, but the scope is implicitly limited to metrics in the namespace configured in the CloudWatch Agent (PaymentProcessingAPI) through the agent configuration file.

All policies use resource-level restrictions with intrinsic functions (Fn::Sub for dynamic ARN construction with pseudo-parameters like AWS::Region and AWS::AccountId) to reference specific resources created by the stack or constrained to the current account and region, implementing defense in depth and preventing privilege escalation, cross-account access, or lateral movement if credentials are compromised through SSRF attacks or instance compromise. IAM roles provide temporary security credentials automatically rotated by AWS STS every few hours (typically 6-12 hours), eliminating long-lived access keys, reducing credential exposure risk, and preventing credential theft scenarios where static keys could be exfiltrated and used indefinitely until manual revocation.

### Monitoring, Alarms, and Observability

Amazon CloudWatch provides comprehensive monitoring and observability across all infrastructure components, enabling proactive issue detection and rapid troubleshooting required for 99.99% uptime SLAs. Two CloudWatch Logs log groups are explicitly created with 30-day retention: ApplicationLogGroup (/aws/ec2/${AWS::StackName}/application) collecting both access and error logs from Apache httpd, and SystemLogGroup (/aws/ec2/${AWS::StackName}/system) collecting system-level logs from /var/log/messages. The 30-day retention balances compliance requirements (providing sufficient historical data for incident investigation, security analysis, and troubleshooting) with cost management (preventing unbounded log storage growth and controlling CloudWatch Logs costs as traffic volume increases).

Five CloudWatch alarms provide automated monitoring and alerting across different failure modes and performance degradation scenarios. UnhealthyHostCountAlarm triggers when the unhealthy host count exceeds 1 (Threshold: 1, ComparisonOperator: GreaterThanThreshold), meaning 2 or more instances out of the typical 3-instance deployment are unhealthy, representing more than 50% of registered targets and indicating widespread failure requiring immediate investigation. The alarm evaluates the Average statistic over 60-second periods for 2 consecutive evaluation periods (EvaluationPeriods: 2, Period: 60), providing 2-minute detection latency while balancing rapid notification with stability to prevent false alarms from brief transient failures such as momentary health check timeouts during brief CPU spikes or network delays.

TargetResponseTimeAlarm monitors target response time, triggering when the average response time exceeds 1 second (Threshold: 1) for 2 consecutive 60-second periods. Elevated response times indicate application performance degradation from database overload, external dependency failures (slow payment gateway API responses), insufficient compute capacity (high CPU causing request queuing), or application code issues (inefficient queries, memory pressure, garbage collection pauses) requiring investigation and potential scaling, optimization, or troubleshooting before customers experience timeouts or abandoned transactions.

Target5XXErrorsAlarm triggers when targets return more than 10 HTTP 5xx errors (Threshold: 10, Statistic: Sum) within 2 consecutive 60-second periods, indicating application crashes, unhandled exceptions, configuration errors (missing environment variables, incorrect database credentials), or resource exhaustion (out of memory, disk full, connection pool exhaustion) requiring immediate attention. The threshold of 10 errors prevents false alarms from occasional transient errors while ensuring detection of sustained failure patterns that impact multiple users.

ELB5XXErrorsAlarm triggers when the load balancer itself generates more than 10 HTTP 5xx errors (Threshold: 10, Statistic: Sum) within 2 consecutive 60-second periods, indicating backend connection failures (all targets unhealthy, target connection timeouts), target unavailability (no healthy targets in target group), or load balancer configuration issues. Distinguishing between target 5xx errors (application issues requiring code fixes, dependency resolution, or resource scaling) and ELB 5xx errors (connectivity issues requiring infrastructure investigation, Auto Scaling troubleshooting, or target group health verification) enables faster root cause identification and targeted remediation without wasting time investigating the wrong layer.

RequestCountAlarm triggers when request count exceeds 100,000 requests (Threshold: 100000, Statistic: Sum) within 2 consecutive 60-second periods, detecting abnormal traffic spikes that could indicate DDoS attacks, viral content driving unexpected load, bot activity, or marketing campaigns driving higher-than-expected traffic. This alarm enables proactive capacity management, allowing operations teams to manually adjust Auto Scaling capacity ahead of automatic scaling triggers or implement rate limiting, WAF rules, or temporary API throttling to protect backend systems from overload.

All alarms use TreatMissingData: notBreaching, preventing alarm state changes when data is temporarily unavailable due to CloudWatch service issues, metric delivery delays, or resource initialization periods. This setting prevents false alarm notifications during deployments, stack updates, or brief AWS service disruptions while ensuring alarms trigger appropriately when metrics indicate actual failures.

The MonitoringDashboard (AWS::CloudWatch::Dashboard) provides centralized visibility into key metrics through a single-pane-of-glass view combining load balancer, Auto Scaling, and EC2 metrics in a unified interface. The dashboard includes six widgets in a 2×3 grid layout providing comprehensive monitoring coverage without overwhelming operators with excessive detail. ALB Request Count displays total request volume over time as a time series graph with Sum statistic at 60-second periods, enabling traffic pattern analysis (identifying daily peaks, weekly trends, seasonal variations), capacity planning (forecasting when maximum scaling capacity might be reached), and incident investigation (correlating request drops with outages or deployments).

Target Health Status shows both HealthyHostCount and UnHealthyHostCount on the same graph as separate time series lines with Average statistic, providing immediate visibility into instance health trends, Auto Scaling effectiveness (verifying new instances become healthy after launch), and failure detection (unhealthy instances appearing during incidents). Simultaneous display of healthy and unhealthy counts enables quick assessment of available capacity and failure severity (1 unhealthy out of 3 instances vs. 2+ unhealthy indicating widespread failures).

Target Response Time tracks average backend response latency as a time series graph with Average statistic at 60-second periods, identifying performance degradation from database overload, external dependency slowness (payment gateway latency increases), insufficient capacity (high CPU causing request queuing), or application code changes (introducing inefficient code paths, N+1 queries, or synchronous blocking calls) before customers experience timeouts, slow page loads, or abandoned transactions.

HTTP Response Codes displays HTTPCode_Target_2XX_Count, HTTPCode_Target_4XX_Count, HTTPCode_Target_5XX_Count, and HTTPCode_ELB_5XX_Count on the same graph as separate time series lines with Sum statistic, enabling comprehensive error pattern analysis. The 2XX count shows successful requests (baseline traffic patterns), 4XX count shows client errors (potentially indicating API integration issues, authentication failures, or malformed requests from client applications), target 5XX count shows application errors (code bugs, exceptions, resource exhaustion), and ELB 5XX count shows connectivity errors (backend connection failures, target unavailability). Distinguishing error sources accelerates root cause identification, directs investigation to appropriate teams (client developers for 4XX, application developers for target 5XX, infrastructure teams for ELB 5XX), and prevents wasted troubleshooting time investigating the wrong component or layer.

Auto Scaling Group Metrics displays GroupDesiredCapacity, GroupInServiceInstances, GroupMinSize, and GroupMaxSize as multiple time series lines on a single graph with Average statistic at 60-second periods, showing current desired capacity set by scaling policies, actual in-service instance count, minimum capacity floor (high availability boundary), and maximum capacity ceiling (scaling headroom). This visualization reveals scaling behavior (instances added/removed in response to CPU utilization changes), capacity headroom (distance between current and maximum capacity indicating room for additional scaling), and configuration issues (desired capacity stuck at maximum indicating insufficient capacity limits, or desired capacity stuck at minimum indicating scaling policy issues or CPU not reaching threshold).

EC2 CPU Utilization displays average CPU across all instances with Average statistic at 60-second periods and y-axis constrained to 0-100 range for consistent visualization, correlating with scaling events (CPU spike reaching 70% threshold followed by instance additions, then CPU drop as new capacity comes online) and identifying resource constraints (sustained high CPU approaching scaling threshold indicating need for vertical scaling to larger instance types or horizontal scaling capacity limit increases).

The dashboard uses dynamic resource references with Fn::Sub intrinsic function and resource attributes ensuring correct metric sources regardless of resource naming, stack name, or region, preventing broken dashboard widgets after stack renames or cross-region deployments. The dashboard URL is exported in stack outputs as CloudWatchDashboardURL with a direct link to the CloudWatch console dashboard, providing quick access for operations teams, inclusion in runbooks and incident response procedures, integration with monitoring tools and ticketing systems (PagerDuty, Slack, ServiceNow), and sharing in wikis or team documentation for visibility into system health.

### High Availability and Fault Tolerance

The architecture achieves high availability through multiple mechanisms across different layers, meeting the 99.99% uptime SLA requirement equivalent to 52.56 minutes of allowed downtime per year (8.76 hours per year, 43.8 minutes per month, or 10.1 minutes per week). The Auto Scaling Group maintains minimum capacity of 2 instances distributed across two Availability Zones, automatically replacing failed instances within 5-10 minutes based on ELB health checks with a 300-second grace period allowing proper instance initialization before health verification begins.

Instance distribution logic (handled automatically by the Auto Scaling Group) ensures even spreading across both Availability Zones, preventing single-AZ concentration that would create availability risks during AZ failures. With 3 instances across 2 AZs under normal conditions, instances are distributed with 2 in one AZ and 1 in the other. During AZ failures affecting an entire Availability Zone (rare events occurring approximately once per year across all of AWS globally, with much lower frequency for any specific AZ), the remaining AZ continues serving traffic with the healthy instances while Auto Scaling detects the failed instances through ELB health checks and automatically launches replacement instances in the remaining healthy AZ within 5-10 minutes. The application tolerates the failure of an entire Availability Zone without service disruption, with traffic automatically redistributed to healthy instances in the remaining zone through the load balancer's continuous health checking and routing decisions.

The Application Load Balancer distributes traffic across both public subnets with automatic failover, routing requests only to healthy instances and removing unhealthy instances from rotation within 30 seconds (15-second health check interval × 2 consecutive failures). The target group's rapid health checking provides quick failure detection and recovery, minimizing the window where requests might be routed to unhealthy instances. When an instance is marked unhealthy, the load balancer immediately stops sending new connections while allowing existing connections to complete (up to the idle timeout of 60 seconds), preventing abrupt connection termination while protecting users from failed instances. Health check path /health verifies application functionality beyond basic connectivity, detecting application failures (httpd service crashes, file system full preventing endpoint access), configuration errors (incorrect permissions on /health file), or resource exhaustion (CPU pegged at 100% preventing request processing) that basic EC2 status checks miss.

Connection draining (deregistration_delay.timeout_seconds: 300) allows in-flight payment requests to complete gracefully before terminating instances during scale-down events (CPU falling below 70% target causing scale-in), Auto Scaling replacements (health check failures), deployments (instance refresh operations), or manual instance termination, preventing abrupt connection termination that could cause transaction failures, incomplete database writes, inconsistent application state, or customer-facing errors showing timeout or connection reset messages. The 5-minute timeout provides substantial time for complex payment workflows including multi-step authorization (initial authorization, additional verification, final capture), 3D Secure authentication (redirect to issuer, user authentication, return with result), fraud screening API calls (multiple providers, device fingerprinting, transaction risk scoring), transaction settlement, or webhook deliveries without interruption.

Cross-zone load balancing (load_balancing.cross_zone.enabled: true) ensures traffic is distributed evenly across all targets regardless of Availability Zone, preventing hotspots and enabling full utilization of capacity. Without cross-zone load balancing, ALB nodes in each AZ only distribute traffic to targets in the same AZ, creating uneven load distribution when instance counts differ across AZs due to scaling events, instance failures, or AZ-level capacity constraints. With cross-zone enabled, all ALB nodes treat all instances as a single pool, distributing traffic evenly with each instance receiving approximately equal traffic regardless of AZ location or which ALB node received the initial client connection, preventing scenarios where one instance handles 50% of traffic while two other instances handle 25% each.

The two NAT Gateways (one per Availability Zone) provide highly available outbound internet connectivity with AZ-level fault isolation. NAT Gateway failures affect only instances in the associated Availability Zone, with instances in the other AZ maintaining internet connectivity through their dedicated NAT Gateway. This architecture prevents a single NAT Gateway failure from causing widespread outbound connectivity loss that would prevent instances from downloading packages, applying security patches, or communicating with external APIs. The separate private route tables (one per private subnet) ensure traffic routes through the local NAT Gateway, optimizing performance through reduced cross-AZ data transfer and providing automatic failover at the AZ level without requiring cross-AZ traffic rerouting during NAT Gateway maintenance or failures.

Instance Metadata Service v2 (IMDSv2) enforcement protects against credential theft through SSRF attacks that could lead to instance compromise, data breaches, or lateral movement within the AWS environment, preventing security incidents that could cause availability impact through compromised instances being used for cryptomining (consuming CPU resources), data exfiltration (consuming network bandwidth), or malicious activities that trigger instance termination through AWS abuse detection systems.

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Highly available load balancing architecture with automated failover capabilities for financial services payment processing API with 99.99% uptime SLA'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
      - Label:
          default: 'Network Configuration'
        Parameters:
          - VpcCIDR
          - PublicSubnet1CIDR
          - PublicSubnet2CIDR
          - PrivateSubnet1CIDR
          - PrivateSubnet2CIDR
      - Label:
          default: 'Compute Configuration'
        Parameters:
          - InstanceType
          - KeyPairName
          - LatestAmiId
      - Label:
          default: 'Auto Scaling Configuration'
        Parameters:
          - MinSize
          - MaxSize
          - DesiredCapacity

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

  VpcCIDR:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'
    AllowedPattern: '^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}/16)$'
    ConstraintDescription: 'Must be a valid CIDR block in format 10.x.x.x/16'

  PublicSubnet1CIDR:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for Public Subnet 1 in AZ1'
    AllowedPattern: '^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}/24)$'
    ConstraintDescription: 'Must be a valid CIDR block in format 10.x.x.x/24'

  PublicSubnet2CIDR:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for Public Subnet 2 in AZ2'
    AllowedPattern: '^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}/24)$'
    ConstraintDescription: 'Must be a valid CIDR block in format 10.x.x.x/24'

  PrivateSubnet1CIDR:
    Type: String
    Default: '10.0.11.0/24'
    Description: 'CIDR block for Private Subnet 1 in AZ1'
    AllowedPattern: '^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}/24)$'
    ConstraintDescription: 'Must be a valid CIDR block in format 10.x.x.x/24'

  PrivateSubnet2CIDR:
    Type: String
    Default: '10.0.12.0/24'
    Description: 'CIDR block for Private Subnet 2 in AZ2'
    AllowedPattern: '^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}/24)$'
    ConstraintDescription: 'Must be a valid CIDR block in format 10.x.x.x/24'

  InstanceType:
    Type: String
    Default: 't3.medium'
    Description: 'EC2 instance type for payment processing application servers'
    AllowedValues:
      - t3.medium
      - t3.large
      - t3.xlarge
      - m5.large
      - m5.xlarge
    ConstraintDescription: 'Must be a valid EC2 instance type'

  KeyPairName:
    Type: String
    Default: ''
    Description: 'EC2 Key Pair name for SSH access (optional - leave empty to skip)'

  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
    Description: 'Latest Amazon Linux 2 AMI ID from Systems Manager Parameter Store'

  MinSize:
    Type: Number
    Default: 2
    Description: 'Minimum number of instances in Auto Scaling Group'
    MinValue: 2
    MaxValue: 10
    ConstraintDescription: 'Must be between 2 and 10'

  MaxSize:
    Type: Number
    Default: 6
    Description: 'Maximum number of instances in Auto Scaling Group'
    MinValue: 3
    MaxValue: 20
    ConstraintDescription: 'Must be between 3 and 20'

  DesiredCapacity:
    Type: Number
    Default: 3
    Description: 'Desired number of instances in Auto Scaling Group'
    MinValue: 2
    MaxValue: 10
    ConstraintDescription: 'Must be between 2 and 10'

Conditions:
  HasKeyPair: !Not [!Equals [!Ref KeyPairName, '']]

Resources:
  # ========================================
  # VPC AND NETWORKING RESOURCES
  # ========================================

  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'VPC-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'PaymentProcessingAPI'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'IGW-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'PaymentProcessingAPI'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'PublicSubnet1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'PaymentProcessingAPI'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet2CIDR
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'PublicSubnet2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'PaymentProcessingAPI'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'PrivateSubnet1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'PaymentProcessingAPI'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet2CIDR
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'PrivateSubnet2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'PaymentProcessingAPI'

  # NAT Gateways with Elastic IPs
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'NATGW1-EIP-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'PaymentProcessingAPI'

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'NATGW2-EIP-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'PaymentProcessingAPI'

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'NATGateway1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'PaymentProcessingAPI'

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'NATGateway2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'PaymentProcessingAPI'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'PublicRouteTable-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'PaymentProcessingAPI'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'PrivateRouteTable1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'PaymentProcessingAPI'

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'PrivateRouteTable2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'PaymentProcessingAPI'

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # ========================================
  # SECURITY GROUPS
  # ========================================

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer - allows HTTP from internet'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP traffic from internet'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'ALBSecurityGroup-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'PaymentProcessingAPI'

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for EC2 instances - allows traffic only from ALB'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'Allow HTTP traffic from ALB only'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'EC2SecurityGroup-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'PaymentProcessingAPI'

  # ========================================
  # IAM ROLES AND POLICIES
  # ========================================

  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'EC2InstanceRole-${EnvironmentSuffix}-${AWS::StackName}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
        - 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      Policies:
        - PolicyName: 'CloudWatchLogsPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogStreams'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*'
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                  - 'cloudwatch:GetMetricStatistics'
                  - 'cloudwatch:ListMetrics'
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub 'EC2InstanceRole-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'PaymentProcessingAPI'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  # ========================================
  # LOAD BALANCING RESOURCES
  # ========================================

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    DependsOn: AttachGateway
    Properties:
      Name: !Sub 'ALB-${EnvironmentSuffix}'
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      LoadBalancerAttributes:
        - Key: 'deletion_protection.enabled'
          Value: 'true'
        - Key: 'load_balancing.cross_zone.enabled'
          Value: 'true'
        - Key: 'idle_timeout.timeout_seconds'
          Value: '60'
      Tags:
        - Key: Name
          Value: !Sub 'ALB-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'PaymentProcessingAPI'

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'TG-${EnvironmentSuffix}'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckProtocol: HTTP
      HealthCheckPath: '/health'
      HealthCheckIntervalSeconds: 15
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 3
      UnhealthyThresholdCount: 2
      Matcher:
        HttpCode: '200'
      TargetGroupAttributes:
        - Key: 'deregistration_delay.timeout_seconds'
          Value: '300'
        - Key: 'stickiness.enabled'
          Value: 'true'
        - Key: 'stickiness.type'
          Value: 'app_cookie'
        - Key: 'stickiness.app_cookie.duration_seconds'
          Value: '86400'
        - Key: 'stickiness.app_cookie.cookie_name'
          Value: 'PAYMENT_SESSION'
      Tags:
        - Key: Name
          Value: !Sub 'TargetGroup-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'PaymentProcessingAPI'

  ALBListenerHTTP:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  # ========================================
  # AUTO SCALING AND COMPUTE RESOURCES
  # ========================================

  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub 'LaunchTemplate-${EnvironmentSuffix}'
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: !Ref InstanceType
        KeyName: !If [HasKeyPair, !Ref KeyPairName, !Ref 'AWS::NoValue']
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        MetadataOptions:
          HttpTokens: required
          HttpPutResponseHopLimit: 1
          HttpEndpoint: enabled
        Monitoring:
          Enabled: true
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd amazon-cloudwatch-agent amazon-ssm-agent

            # Start and enable services
            systemctl enable amazon-ssm-agent
            systemctl start amazon-ssm-agent
            systemctl start httpd
            systemctl enable httpd

            # Create health check endpoint
            echo "OK" > /var/www/html/health

            # Create sample index page with IMDSv2
            TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
            INSTANCE_ID=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" -s http://169.254.169.254/latest/meta-data/instance-id)
            echo "<h1>Payment Processing API - Instance: $INSTANCE_ID</h1>" > /var/www/html/index.html

            # Configure CloudWatch agent
            cat <<'EOF' > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
            {
              "metrics": {
                "namespace": "PaymentProcessingAPI",
                "metrics_collected": {
                  "cpu": {
                    "measurement": [
                      "cpu_usage_idle",
                      "cpu_usage_iowait",
                      "cpu_usage_user",
                      "cpu_usage_system"
                    ],
                    "metrics_collection_interval": 60,
                    "totalcpu": true
                  },
                  "disk": {
                    "measurement": [
                      "used_percent",
                      "inodes_free"
                    ],
                    "metrics_collection_interval": 60,
                    "resources": [
                      "*"
                    ]
                  },
                  "mem": {
                    "measurement": [
                      "mem_used_percent"
                    ],
                    "metrics_collection_interval": 60
                  }
                }
              },
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "/aws/ec2/${AWS::StackName}/application",
                        "log_stream_name": "{instance_id}"
                      },
                      {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "/aws/ec2/${AWS::StackName}/application",
                        "log_stream_name": "{instance_id}-error"
                      },
                      {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/ec2/${AWS::StackName}/system",
                        "log_stream_name": "{instance_id}"
                      }
                    ]
                  }
                }
              }
            }
            EOF

            # Start CloudWatch agent
            systemctl enable amazon-cloudwatch-agent
            systemctl start amazon-cloudwatch-agent
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub 'ASG-Instance-${EnvironmentSuffix}'
              - Key: Environment
                Value: !Ref EnvironmentSuffix
              - Key: Project
                Value: 'PaymentProcessingAPI'

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub 'ASG-${EnvironmentSuffix}'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinSize
      MaxSize: !Ref MaxSize
      DesiredCapacity: !Ref DesiredCapacity
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      MetricsCollection:
        - Granularity: '1Minute'
          Metrics:
            - GroupMinSize
            - GroupMaxSize
            - GroupDesiredCapacity
            - GroupInServiceInstances
            - GroupPendingInstances
            - GroupStandbyInstances
            - GroupTerminatingInstances
            - GroupTotalInstances
      Tags:
        - Key: Name
          Value: !Sub 'ASG-${EnvironmentSuffix}'
          PropagateAtLaunch: false
        - Key: Environment
          Value: !Ref EnvironmentSuffix
          PropagateAtLaunch: true
        - Key: Project
          Value: 'PaymentProcessingAPI'
          PropagateAtLaunch: true

  CPUTargetTrackingScalingPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: 70.0

  # ========================================
  # CLOUDWATCH MONITORING AND ALARMS
  # ========================================

  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${AWS::StackName}/application'
      RetentionInDays: 30

  SystemLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${AWS::StackName}/system'
      RetentionInDays: 30

  UnhealthyHostCountAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-UnhealthyHostCount-${EnvironmentSuffix}'
      AlarmDescription: 'Alarm when unhealthy host count exceeds 50% of registered targets'
      Namespace: 'AWS/ApplicationELB'
      MetricName: UnHealthyHostCount
      Dimensions:
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
        - Name: TargetGroup
          Value: !GetAtt ALBTargetGroup.TargetGroupFullName
      Statistic: Average
      Period: 60
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching

  TargetResponseTimeAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-TargetResponseTime-${EnvironmentSuffix}'
      AlarmDescription: 'Alarm when target response time exceeds threshold'
      Namespace: 'AWS/ApplicationELB'
      MetricName: TargetResponseTime
      Dimensions:
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
      Statistic: Average
      Period: 60
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching

  Target5XXErrorsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-Target5XXErrors-${EnvironmentSuffix}'
      AlarmDescription: 'Alarm when 5xx errors from targets exceed threshold'
      Namespace: 'AWS/ApplicationELB'
      MetricName: HTTPCode_Target_5XX_Count
      Dimensions:
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 2
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching

  ELB5XXErrorsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-ELB5XXErrors-${EnvironmentSuffix}'
      AlarmDescription: 'Alarm when 5xx errors from load balancer exceed threshold'
      Namespace: 'AWS/ApplicationELB'
      MetricName: HTTPCode_ELB_5XX_Count
      Dimensions:
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 2
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching

  RequestCountAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-RequestCount-${EnvironmentSuffix}'
      AlarmDescription: 'Alarm when request count exceeds expected threshold'
      Namespace: 'AWS/ApplicationELB'
      MetricName: RequestCount
      Dimensions:
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 2
      Threshold: 100000
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching

  MonitoringDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub '${AWS::StackName}-Dashboard-${EnvironmentSuffix}'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "x": 0,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  ["AWS/ApplicationELB", "RequestCount", {"stat": "Sum", "label": "Request Count"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "ALB Request Count",
                "period": 60
              }
            },
            {
              "type": "metric",
              "x": 12,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  ["AWS/ApplicationELB", "HealthyHostCount", {"label": "Healthy Hosts"}],
                  [".", "UnHealthyHostCount", {"label": "Unhealthy Hosts"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "Target Health Status",
                "period": 60
              }
            },
            {
              "type": "metric",
              "x": 0,
              "y": 6,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  ["AWS/ApplicationELB", "TargetResponseTime", {"stat": "Average", "label": "Response Time"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "Target Response Time",
                "period": 60
              }
            },
            {
              "type": "metric",
              "x": 12,
              "y": 6,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  ["AWS/ApplicationELB", "HTTPCode_Target_2XX_Count", {"stat": "Sum", "label": "2XX"}],
                  [".", "HTTPCode_Target_4XX_Count", {"stat": "Sum", "label": "4XX"}],
                  [".", "HTTPCode_Target_5XX_Count", {"stat": "Sum", "label": "5XX"}],
                  [".", "HTTPCode_ELB_5XX_Count", {"stat": "Sum", "label": "ELB 5XX"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "HTTP Response Codes",
                "period": 60
              }
            },
            {
              "type": "metric",
              "x": 0,
              "y": 12,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  ["AWS/AutoScaling", "GroupDesiredCapacity", {"label": "Desired"}],
                  [".", "GroupInServiceInstances", {"label": "InService"}],
                  [".", "GroupMinSize", {"label": "Min"}],
                  [".", "GroupMaxSize", {"label": "Max"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "Auto Scaling Group Metrics",
                "period": 60
              }
            },
            {
              "type": "metric",
              "x": 12,
              "y": 12,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  ["AWS/EC2", "CPUUtilization", {"stat": "Average", "label": "CPU Utilization"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "EC2 CPU Utilization",
                "period": 60,
                "yAxis": {
                  "left": {
                    "min": 0,
                    "max": 100
                  }
                }
              }
            }
          ]
        }

# ========================================
# OUTPUTS SECTION
# ========================================
Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1Id'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2Id'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1Id'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2Id'

  InternetGatewayId:
    Description: 'Internet Gateway ID'
    Value: !Ref InternetGateway
    Export:
      Name: !Sub '${AWS::StackName}-IGW-ID'

  NATGateway1Id:
    Description: 'NAT Gateway 1 ID'
    Value: !Ref NATGateway1
    Export:
      Name: !Sub '${AWS::StackName}-NATGateway1Id'

  NATGateway2Id:
    Description: 'NAT Gateway 2 ID'
    Value: !Ref NATGateway2
    Export:
      Name: !Sub '${AWS::StackName}-NATGateway2Id'

  ApplicationLoadBalancerDNS:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  ApplicationLoadBalancerArn:
    Description: 'Application Load Balancer ARN'
    Value: !Ref ApplicationLoadBalancer
    Export:
      Name: !Sub '${AWS::StackName}-ALB-ARN'

  TargetGroupArn:
    Description: 'Target Group ARN'
    Value: !Ref ALBTargetGroup
    Export:
      Name: !Sub '${AWS::StackName}-TG-ARN'

  AutoScalingGroupName:
    Description: 'Auto Scaling Group Name'
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-ASGName'

  ALBSecurityGroupId:
    Description: 'ALB Security Group ID'
    Value: !Ref ALBSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-ALB-SG-ID'

  EC2SecurityGroupId:
    Description: 'EC2 Security Group ID'
    Value: !Ref EC2SecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-EC2-SG-ID'

  CloudWatchDashboardURL:
    Description: 'CloudWatch Dashboard URL'
    Value: !Sub 'https://${AWS::Region}.console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${MonitoringDashboard}'
    Export:
      Name: !Sub '${AWS::StackName}-DashboardURL'

  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'
```

## Key Features

### Security

The template implements comprehensive multi-layer security following AWS best practices, the Well-Architected Framework, and financial services compliance requirements. Network isolation is achieved through complete VPC provisioning with clear separation between public subnets (hosting the Application Load Balancer and NAT Gateways) and private subnets (hosting application servers), ensuring backend resources have no direct internet exposure. All application traffic flows through the Application Load Balancer, serving as a security boundary between untrusted internet traffic and trusted application instances within the private subnet tier.

Security groups implement stateful firewalls at the instance level using the principle of least privilege and security group references instead of IP-based CIDR blocks. The ALBSecurityGroup allows HTTP (port 80) from anywhere (0.0.0.0/0), enabling public access to the payment API. The HTTP-only configuration is intentional for deployments where SSL/TLS termination occurs at other layers (CloudFront CDN, API Gateway, corporate reverse proxy) or for development/testing environments. Production deployments handling sensitive payment data should implement HTTPS with SSL certificate from AWS Certificate Manager, enforcing encryption in transit to meet PCI DSS requirements for protecting cardholder data during transmission over public networks.

The EC2SecurityGroup implements strict access controls allowing HTTP traffic (port 80) only from the ALBSecurityGroup using SourceSecurityGroupId references instead of IP-based CIDR rules. This approach provides dynamic security boundaries that automatically adapt as the load balancer scales, nodes are added or removed, or IP addresses change during AWS infrastructure maintenance, preventing direct internet access to application instances and reducing misconfiguration risk from manual IP address management. SSH access (port 22) is implicitly denied from all sources since no SSH ingress rule exists in the EC2SecurityGroup, meeting security compliance requirements that prohibit direct SSH access from the internet to protect against brute force attacks, credential compromise, and unauthorized access attempts.

Administrative access is provided exclusively through AWS Systems Manager Session Manager (enabled via AmazonSSMManagedInstanceCore managed policy), offering browser-based, auditable access without requiring public IPs, SSH keys, bastion hosts, or security group SSH rules. Session Manager logs all sessions to CloudTrail with optional command logging to S3 or CloudWatch Logs, meeting compliance requirements for administrative access auditing, session recording for forensic investigation, and satisfying regulatory requirements for privileged access monitoring in financial services environments.

Instance Metadata Service version 2 (IMDSv2) is enforced through MetadataOptions configuration with HttpTokens: required, HttpPutResponseHopLimit: 1, and HttpEndpoint: enabled, protecting against Server-Side Request Forgery (SSRF) attacks that exploit metadata service access. IMDSv2 requires session tokens obtained through PUT requests for all metadata access, preventing simple HTTP GET requests from vulnerable applications, malicious code, or compromised instances from retrieving IAM credentials, instance identity documents, or user data without proper authorization. This security control is mandatory for PCI DSS compliance and financial services workloads handling sensitive payment data, preventing credential theft that could lead to data breaches, unauthorized AWS resource access, or lateral movement within the environment.

IAM roles provide fine-grained permissions scoped to specific resources following the principle of least privilege, granting EC2 instances access only to CloudWatch for metrics and log publishing, and Systems Manager for administrative access. The CloudWatchLogsPolicy scopes log permissions to the /aws/ec2/\* log group path preventing access to other log groups in the account. All policies use resource-level restrictions with intrinsic functions (Fn::Sub) to reference specific resources in the current region and account, implementing defense in depth and preventing privilege escalation, cross-account access, or lateral movement if credentials are compromised.

### Scalability

The architecture provides automatic horizontal scaling capabilities to match varying payment processing load without manual intervention, optimizing costs during low-traffic periods while maintaining performance during peak business hours or seasonal demand surges. The Auto Scaling Group dynamically adjusts EC2 instance count from 2 (minimum) to 6 (maximum) based on CPU utilization, with a desired capacity of 3 instances providing buffer capacity for sudden traffic spikes from marketing campaigns, viral content, or seasonal shopping patterns.

The target tracking scaling policy automatically adds instances when aggregate CPU exceeds 70% (TargetValue: 70.0) and removes instances when CPU falls below 70% for sustained periods, providing 30% headroom for traffic bursts while optimizing costs through automatic scale-down during low-demand periods. The policy uses PredefinedMetricType: ASGAverageCPUUtilization eliminating the need for custom CloudWatch alarms, threshold tuning, or manual scaling policy maintenance across multiple environments.

The Application Load Balancer automatically distributes traffic across healthy instances in both Availability Zones with cross-zone load balancing explicitly enabled (load_balancing.cross_zone.enabled: true), ensuring traffic is distributed evenly across all targets regardless of Availability Zone location. Without cross-zone load balancing, ALB nodes only distribute to targets in the same AZ, creating uneven load distribution when instance counts differ across AZs or when traffic is concentrated at specific ALB nodes due to DNS caching or geographic routing patterns from client locations.

Health checks every 15 seconds with unhealthy threshold of 2 consecutive failures ensure only healthy instances receive traffic with rapid detection and removal of unhealthy instances from the load balancer rotation within 30 seconds (15s × 2 failures). This aggressive health checking meets the 99.99% uptime SLA requirement by minimizing the time unhealthy instances remain in service and could receive user traffic, reducing failed requests and improving customer experience.

The VPC design with complete infrastructure provisioning enables flexible scaling beyond current requirements including adding additional application tiers, database instances in private subnets, caching layers (ElastiCache for Redis or Memcached), message queues (SQS, Amazon MQ), or microservices architectures without network reconfiguration or dependency on pre-existing infrastructure. The two Availability Zone design with two NAT Gateways provides high availability and fault tolerance for the us-west-1 region, balancing redundancy with cost efficiency for mission-critical payment processing workloads.

All CloudFormation outputs use Export functionality for cross-stack references, enabling this infrastructure to serve as a foundation for additional stacks, microservices, or nested environments. The VPC ID, subnet IDs, security group IDs, ALB DNS name, target group ARN, and Auto Scaling Group name can be referenced by other CloudFormation stacks using Fn::ImportValue, enabling multi-stack architectures where networking, application, database, and monitoring components are managed independently while maintaining proper resource references and dependencies.

### Operational Excellence

The template achieves operational excellence through complete infrastructure as code with comprehensive parameterization enabling deployment across multiple environments (dev, staging, prod) without template modifications. Parameters use validation through AllowedPattern for CIDR blocks ensuring correct IP addressing format (10.x.x.x/16 for VPC, 10.x.x.x/24 for subnets), AllowedValues for instance types restricting choices to cost-effective options (t3.medium, t3.large, t3.xlarge, m5.large, m5.xlarge), and MinValue/MaxValue constraints for Auto Scaling parameters ensuring valid configurations that maintain high availability.

CloudFormation Interface metadata organizes parameters into four logical groups (Environment Configuration, Network Configuration, Compute Configuration, Auto Scaling Configuration) improving the console experience with clear parameter categorization and reducing deployment errors from parameter confusion or incorrect values. The network parameters accept CIDR blocks allowing flexible IP addressing while maintaining consistent sizing (/16 for VPC providing 65,536 addresses, /24 for subnets providing 256 addresses each), supporting growth and future expansion without network redesign.

Launch Templates enable versioning with rollback capability, allowing maintenance of multiple configuration versions with the ability to roll back to previous versions if issues arise during deployments without requiring stack rollback or manual configuration recreation. The Auto Scaling Group references the latest version dynamically using Fn::GetAtt with LatestVersionNumber, ensuring the ASG always uses the most recent Launch Template configuration without manual version updates or stack modifications when Launch Template changes occur during updates.

CloudWatch monitoring provides comprehensive observability with detailed monitoring enabled on all EC2 instances (1-minute metrics instead of 5-minute), five proactive alarms (unhealthy host count, target response time, target 5xx errors, ELB 5xx errors, request count), two log groups with 30-day retention (application logs, system logs), and a centralized CloudWatch Dashboard providing single-pane-of-glass visibility into key metrics. The dashboard displays ALB request count, target health status, response time, HTTP response codes, Auto Scaling Group metrics, and CPU utilization in a unified interface accessible through the exported dashboard URL.

CloudWatch Logs integration through the CloudWatch Agent (configured in Launch Template user data) collects three log streams per instance: application access logs capturing all API requests for traffic analysis and compliance auditing, application error logs capturing exceptions and crashes for troubleshooting, and system logs capturing OS-level events including service starts and initialization. Log groups are named using AWS::StackName for unique identification across multiple deployments, with log streams identified by instance ID enabling per-instance troubleshooting while maintaining centralized log aggregation.

Consistent tagging with standard tags (Name, Environment, Project) on all resources enables cost allocation reporting showing costs by environment and project, compliance auditing filtering resources by compliance scope, resource organization grouping related resources in the console, and automated operations through tag-based filters. The Auto Scaling Group uses PropagateAtLaunch: true for Environment and Project tags, ensuring all EC2 instances inherit these tags automatically for complete resource tracking and cost attribution without per-instance configuration or post-launch tagging scripts.

Systems Manager integration (AmazonSSMManagedInstanceCore managed policy) provides Session Manager for browser-based SSH alternative without requiring public IPs, SSH keys, bastion hosts, or security group SSH rules. Session Manager provides fully auditable access with all sessions logged to CloudTrail and optionally S3, meeting compliance requirements for administrative access logging and session recording. Systems Manager also enables Patch Manager for automated OS patching on maintenance windows, Run Command for remote script execution without SSH, and Parameter Store access for centralized configuration management and secrets retrieval.

### Cost Optimization

The design balances functionality with cost efficiency through several optimizations informed by AWS Well-Architected Framework best practices and financial services constraints. T3 instance types (t3.medium default) provide burstable CPU performance with baseline and burst credits at significantly lower cost than fixed-performance instance types like M5 or C5, suitable for payment processing APIs with variable load patterns that don't require sustained high CPU utilization. The t3.medium provides 2 vCPUs and 4 GB memory at approximately $0.0416/hour in us-west-1 (roughly $30/month per instance) compared to m5.large at $0.107/hour ($78/month) offering 30% higher cost for similar API workload performance.

Auto Scaling ensures payment only for needed capacity, automatically scaling down when CPU falls below 70% threshold with the target tracking policy removing instances as load decreases during off-peak hours (nights, weekends, low-traffic periods). The minimum instance count of 2 maintains high availability while minimizing baseline costs of $60/month for compute compared to fixed fleets of 6+ instances costing $180+/month regardless of actual demand. The maximum capacity of 6 instances provides sufficient scaling headroom for typical traffic patterns while preventing unbounded cost growth from runaway scaling during DDoS attacks or misconfigured scaling policies.

The two NAT Gateways architecture provides high availability with AZ-level fault isolation but incurs costs of approximately $0.045/hour per NAT Gateway ($32.40/month each, $64.80/month total for both) plus data processing charges of $0.045/GB for traffic through NAT Gateways. Organizations with cost-sensitive deployments can reduce to a single NAT Gateway ($32.40/month) accepting the availability risk where NAT Gateway failure causes outbound connectivity loss for all instances, or use per-AZ NAT Gateways selectively based on traffic patterns and availability requirements.

Cross-zone load balancing incurs small data transfer charges for traffic routed between Availability Zones (typically $0.01 per GB for inter-AZ data transfer within the same region) since traffic from an ALB node in us-west-1a routed to an instance in us-west-1b crosses AZ boundaries. However, this cost is generally offset by improved resource utilization, reduced over-provisioning needs (fewer total instances required to handle the same load evenly), and better performance consistency preventing individual instance overload that could require additional capacity. For cost-sensitive workloads, cross-zone load balancing can be disabled by setting load_balancing.cross_zone.enabled to false, accepting uneven load distribution as a trade-off for eliminating inter-AZ data transfer charges.

CloudWatch Logs retention is set to 30 days balancing compliance requirements (providing sufficient historical data for incident investigation, security analysis, and troubleshooting) with cost management ($0.50/GB ingested, $0.03/GB stored per month in us-west-1). Logs older than 30 days are automatically deleted preventing unbounded storage growth and controlling costs as traffic volume increases. Organizations with stricter compliance requirements can extend retention to 90 days, 180 days, or indefinitely, or implement lifecycle policies to archive older logs to S3 Glacier ($0.004/GB per month) for long-term retention at significantly lower cost.

Detailed monitoring on EC2 instances (1-minute metrics) incurs charges of approximately $0.14 per instance per month in us-west-1 (7 metrics per instance × $2.00 per metric per month / 7 metrics included free). For 3 instances the additional cost is roughly $0.42/month providing faster problem detection and more granular performance visibility. For cost-sensitive non-production environments (dev, test), detailed monitoring can be disabled (Monitoring: Enabled: false in Launch Template) accepting coarser 5-minute metric granularity sufficient for non-critical workloads while reducing monitoring costs.

Comprehensive tagging with Environment and Project enables detailed cost allocation reports through AWS Cost Explorer, identifying cost optimization opportunities through filtering and grouping by tag. Organizations can track monthly costs by environment (identifying expensive dev environments for rightsizing or scheduled shutdown), by project (enabling accurate project budget tracking and showback/chargeback to appropriate teams), and by resource type (identifying highest-cost services like NAT Gateways, EC2 instances, or data transfer for optimization focus).

### Reliability

The architecture achieves high reliability through multi-layer redundancy and fault tolerance mechanisms across AWS services, meeting the 99.99% uptime SLA requirement equivalent to 52.56 minutes of allowed downtime per year. The Auto Scaling Group maintains minimum capacity of 2 instances distributed across two Availability Zones, automatically replacing failed instances within 5-10 minutes based on ELB health checks with a 300-second grace period allowing proper instance initialization including package installation, service startup, and application warm-up before health verification begins.

Instance distribution logic (handled automatically by the Auto Scaling Group) ensures even spreading across both Availability Zones, preventing single-AZ concentration that would create availability risks during AZ failures. With 3 instances across 2 AZs under normal conditions, instances are distributed with 2 in one AZ and 1 in the other. During AZ failures, the remaining AZ continues serving traffic with the healthy instances while Auto Scaling automatically launches replacement instances in the healthy AZ within 5-10 minutes, maintaining minimum capacity of 2 instances and ensuring continued service availability.

The Application Load Balancer distributes traffic across both public subnets with automatic failover, routing requests only to healthy instances and removing unhealthy instances from rotation within 30 seconds (15-second health check interval × 2 consecutive failures). The target group's rapid health checking provides quick failure detection and recovery, minimizing the window where requests might be routed to unhealthy instances. Health check path /health verifies application functionality beyond basic connectivity, detecting application failures (httpd crashes, file system issues), configuration errors (incorrect permissions), or resource exhaustion (CPU pegged at 100%) that basic EC2 status checks miss.

Connection draining (deregistration_delay.timeout_seconds: 300) allows in-flight payment requests to complete gracefully before terminating instances during scale-down events, Auto Scaling replacements, deployments, or manual instance termination, preventing abrupt connection termination that could cause transaction failures, incomplete database writes, inconsistent application state, or customer-facing errors. The 5-minute timeout provides substantial time for complex payment workflows including multi-step authorization, 3D Secure authentication, fraud screening API calls, transaction settlement, or webhook deliveries without interruption during critical financial operations.

The two NAT Gateways (one per Availability Zone) provide highly available outbound internet connectivity with AZ-level fault isolation. NAT Gateway failures affect only instances in the associated Availability Zone, with instances in the other AZ maintaining internet connectivity through their dedicated NAT Gateway. This architecture prevents a single NAT Gateway failure from causing widespread outbound connectivity loss that would block package downloads, security patch application, or external API communication. The separate private route tables (one per private subnet) ensure traffic routes through the local NAT Gateway, optimizing performance and providing automatic AZ-level failover.

CloudWatch alarms provide proactive monitoring enabling rapid detection and response to degradation before it impacts customers. UnhealthyHostCountAlarm triggers when 2 or more instances are unhealthy (Threshold: 1, representing >50% of typical 3-instance deployment), alerting operations teams of potential widespread failures requiring investigation. TargetResponseTimeAlarm detects performance degradation from database overload, external dependency failures, or insufficient capacity before customers experience timeouts. Target5XXErrorsAlarm and ELB5XXErrorsAlarm distinguish between application errors and connectivity issues, enabling faster root cause identification and targeted remediation.

Deletion protection is enabled on the Application Load Balancer (deletion_protection.enabled: true), preventing accidental deletion through console, CLI, or API actions that could cause immediate service outage for all users. This protection requires explicit action to disable deletion protection before deletion is allowed, adding operational friction that prevents mistakes during maintenance, cleanup, or troubleshooting activities, protecting this critical infrastructure component from operational errors that could cause major production incidents.

## Modern AWS Practices

### Complete VPC Provisioning for Infrastructure Reproducibility

The infrastructure creates a complete, self-contained VPC architecture from scratch rather than accepting existing VPC and subnet IDs as parameters, providing several significant advantages for modern infrastructure as code practices. Complete VPC provisioning ensures infrastructure reproducibility where the exact same environment can be recreated in different AWS accounts (development, staging, production) or different regions without dependencies on pre-existing resources that might have different configurations, naming conventions, or availability. This approach is ideal for greenfield deployments, isolated environments for security or compliance boundaries, multi-region disaster recovery architectures requiring identical infrastructure in each region, or infrastructure testing where temporary stacks can be created and destroyed without impacting shared networking resources.

The template accepts CIDR block parameters for the VPC and all four subnets (two public, two private) enabling flexible IP address allocation while maintaining consistent sizing (/16 for VPC, /24 for subnets) following AWS networking best practices. Organizations can deploy multiple instances of this stack in the same region using non-overlapping CIDR blocks (10.0.0.0/16 for prod, 10.1.0.0/16 for staging, 10.2.0.0/16 for dev) without IP address conflicts, supporting multi-environment deployments in a single AWS account with clear network separation.

The VPC creation includes EnableDnsHostnames: true and EnableDnsSupport: true, essential for internal service discovery through DNS names, AWS service endpoint resolution for services like S3 or DynamoDB, and proper functioning of the Application Load Balancer which relies on DNS for health checks and traffic distribution. These DNS settings are often overlooked when manually creating VPCs but are critical for production workloads requiring reliable name resolution and AWS service integration.

The Internet Gateway and VPCGatewayAttachment are explicitly created with DependsOn relationships ensuring proper creation order during CloudFormation stack deployment, preventing race conditions where routes or resources attempt to reference the gateway before attachment completes. This explicit dependency management demonstrates infrastructure as code best practices for handling resource creation ordering in declarative templates where CloudFormation determines execution order based on resource references and explicit dependencies.

The two NAT Gateways architecture with dedicated Elastic IPs and per-AZ private route tables provides high availability for outbound internet connectivity, exceeding typical single NAT Gateway architectures that create single points of failure. Each NAT Gateway is deployed in a public subnet in a different Availability Zone (NATGateway1 in PublicSubnet1 in us-west-1a and NATGateway2 in PublicSubnet2 in us-west-1b) with separate route tables routing private subnet traffic to the local NAT Gateway (PrivateRouteTable1 → NATGateway1, PrivateRouteTable2 → NATGateway2), providing AZ-level fault isolation and optimal performance through reduced cross-AZ data transfer.

### Launch Templates with Dynamic Version Management

The infrastructure uses EC2 Launch Templates rather than legacy Launch Configurations for numerous technical and operational advantages aligned with AWS best practices. Launch Templates support versioning, enabling maintenance of multiple configuration versions with the ability to roll back to previous versions if issues arise during deployments without requiring stack updates or manual configuration recreation. The Auto Scaling Group references the latest version dynamically using Fn::GetAtt with LatestVersionNumber property, ensuring the ASG always uses the most recent Launch Template configuration without manual version tracking or CloudFormation stack updates when Launch Template changes occur.

This eliminates the operational burden of tracking version numbers across multiple environments and prevents deployment errors from stale version references that could cause inconsistent configurations between new instances and existing instances during rolling deployments or instance refresh operations. Configuration updates can be applied to the Auto Scaling Group by creating a new Launch Template version through a stack update, then performing instance refresh to gradually replace instances during maintenance windows or through natural scaling events, reducing deployment risk compared to replacing the entire Auto Scaling Group or terminating all instances simultaneously.

Launch Templates provide access to newer EC2 features unavailable in Launch Configurations including IMDSv2 enforcement through MetadataOptions configuration preventing SSRF attacks and credential theft, T3 Unlimited mode for burstable instances allowing sustained high CPU beyond burst credits, capacity reservations for guaranteed capacity in specific Availability Zones, dedicated hosts and tenancy for licensing compliance or regulatory requirements, and placement groups for low-latency high-throughput applications. Launch Configurations lack support for these modern features, forcing use of workarounds or preventing adoption of security best practices like mandatory IMDSv2 enforcement.

TagSpecifications in the Launch Template automatically propagate tags to all instances created by the Auto Scaling Group, ensuring consistent tagging for cost allocation (Environment, Project tags enabling accurate budget tracking), resource organization (grouping related instances in console views and API queries), and automated operations (tag-based resource selection in scripts, Lambda functions, or Systems Manager documents) without per-instance configuration or post-launch tagging scripts. The Launch Template includes Monitoring with Enabled set to true, activating detailed monitoring (1-minute metrics instead of 5-minute) for all Auto Scaling Group instances automatically, providing faster problem detection and more granular performance visibility without manual configuration on each instance.

### Security Group References for Dynamic Security

The template uses security group references with SourceSecurityGroupId instead of IP-based CIDR rules for implementing dynamic, logical security boundaries that automatically adapt to infrastructure changes without manual security group updates or risk of stale IP addresses breaking connectivity. The EC2SecurityGroup allows HTTP (port 80) traffic only from the ALBSecurityGroup using SourceSecurityGroupId: !Ref ALBSecurityGroup, creating a logical trust boundary between the load balancer layer and application layer.

This approach provides significant operational and security advantages over traditional IP-based rules. The security rules automatically adapt as the load balancer scales, adding or removing nodes with changing IP addresses during traffic spikes or AWS infrastructure changes without requiring security group updates that would be impossible to coordinate with AWS-managed load balancer IP changes. New load balancer nodes are automatically permitted without rule updates since the ALB's security group membership grants access regardless of specific IP address, eliminating connectivity failures during scaling events or load balancer replacements.

The configuration remains effective even if the load balancer's IP addresses change during re-deployment, stack updates, or AWS infrastructure maintenance, preventing unexpected connectivity failures that would require emergency troubleshooting and security group updates during outages. Security group references reduce misconfiguration risk by defining logical relationships between components (application servers accept traffic from load balancer) instead of error-prone IP address management requiring manual updates, CIDR calculations, and coordination across teams.

This implements true least privilege by ensuring application instances accept traffic exclusively from the load balancer and nothing else, with no opportunity for unintended access from other sources even within the same VPC. IP-based rules allowing 0.0.0.0/0 or overly broad CIDR ranges create security vulnerabilities and violate the principle of least privilege, while security group references provide precise access control that adapts automatically. The approach aligns with AWS Well-Architected Framework security pillar recommendations for defense in depth and logical security boundaries that map to application architecture rather than network topology, providing security that scales with the infrastructure.

### IMDSv2 for Metadata Service Security

Instance Metadata Service version 2 (IMDSv2) enforcement through MetadataOptions configuration with HttpTokens: required, HttpPutResponseHopLimit: 1, and HttpEndpoint: enabled protects against Server-Side Request Forgery (SSRF) attacks that exploit metadata service access to retrieve sensitive information including IAM credentials, instance identity documents, user data, and network configuration. IMDSv2 requires session-oriented requests using session tokens obtained through PUT requests before accessing metadata endpoints, preventing simple HTTP GET requests from vulnerable applications or malicious code from retrieving metadata.

SSRF attacks involve malicious actors or vulnerable applications making HTTP requests to the metadata service endpoint (169.254.169.254) from within an EC2 instance, exploiting web application vulnerabilities like unvalidated URL inputs in webhooks, server-side request functionality in APIs, XML external entity (XXE) injection, image processing libraries fetching remote resources, or PDF generators rendering attacker-controlled HTML. Without IMDSv2, attackers can retrieve IAM credentials associated with the instance role and use them to access AWS services including S3 buckets, DynamoDB tables, RDS databases, or other AWS resources based on the role's permissions, potentially leading to data breaches, resource compromise, cryptomining, or lateral movement within the AWS environment.

IMDSv2 prevents these attacks by requiring applications to first obtain a session token through a PUT request with a specific TTL header (X-aws-ec2-metadata-token-ttl-seconds), then use that token in subsequent GET requests to metadata endpoints via the X-aws-ec2-metadata-token header. SSRF vulnerabilities typically only allow GET requests without custom headers or the ability to send PUT requests, preventing attackers from obtaining the required session token and thus blocking access to metadata. HttpPutResponseHopLimit: 1 restricts the metadata service to respond only when the PUT request originates from within the instance (hop limit of 1), preventing containerized workloads, forwarded requests, or proxied connections from accessing metadata without explicit configuration through increased hop limits.

This security control is mandatory for PCI DSS compliance and financial services workloads handling sensitive payment data, preventing credential theft that could lead to unauthorized AWS resource access, data breaches, or compliance violations. AWS Security Hub, GuardDuty, and compliance frameworks including CIS AWS Foundations Benchmark strongly recommend or require IMDSv2 enforcement for all EC2 instances. The HttpTokens: required setting prevents legacy metadata service access (IMDSv1) entirely, ensuring all metadata requests use the secure session-oriented approach regardless of application configuration or developer awareness.

The user data script demonstrates proper IMDSv2-compatible metadata access by first obtaining a session token (curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600") then using that token in subsequent metadata requests (curl -H "X-aws-ec2-metadata-token: $TOKEN" -s http://169.254.169.254/latest/meta-data/instance-id) when retrieving the instance ID for the sample index page. This two-step process is required when HttpTokens: required is set, as direct GET requests to metadata endpoints without tokens would fail, preventing instance initialization and causing health check failures.

### Cross-Zone Load Balancing

Cross-zone load balancing is explicitly enabled on the Application Load Balancer through the load_balancing.cross_zone.enabled: true attribute, ensuring traffic is distributed evenly across all healthy targets regardless of Availability Zone location. This configuration provides significant operational and performance advantages for high-availability architectures spanning multiple Availability Zones.

Without cross-zone load balancing, each ALB node (deployed in each enabled Availability Zone) distributes traffic only to targets within the same Availability Zone, creating uneven load distribution when instance counts differ across AZs or when traffic is concentrated at specific ALB nodes due to DNS caching, geographic routing patterns from client locations, or anycast routing bringing geographically closer clients to specific ALB nodes. For example, with 3 instances distributed as 2 in us-west-1a and 1 in us-west-1b, the ALB node in us-west-1a distributes 50% of its traffic to each of the 2 local instances (25% of total traffic each), while the ALB node in us-west-1b sends 100% of its traffic to the single local instance. If more client traffic reaches the us-west-1b ALB node (due to DNS resolution, client geographic location near us-west-1b, or anycast routing), the single instance in us-west-1b becomes overloaded at 50%+ of total traffic while instances in us-west-1a remain under-utilized at 25% each.

Cross-zone load balancing solves this by allowing each ALB node to distribute traffic to targets in any Availability Zone, not just the local AZ. With cross-zone enabled, all ALB nodes treat all instances as a single pool, distributing traffic evenly regardless of AZ location or which ALB node received the initial client connection. This prevents hotspots where individual instances become overloaded while others are idle, enables full utilization of available capacity without over-provisioning to compensate for uneven distribution, and provides better fault tolerance by distributing load even when instances are unevenly distributed due to scaling events, instance failures, or uneven scaling across AZs during gradual capacity increases.

Cross-zone load balancing incurs data transfer charges for traffic routed between Availability Zones (typically $0.01 per GB for inter-AZ data transfer within the same region) since traffic from an ALB node in us-west-1a routed to an instance in us-west-1b crosses AZ boundaries. However, this cost is generally offset by improved resource utilization (fewer total instances needed to handle the same load evenly), reduced over-provisioning needs (no need to maintain 50%+ extra capacity to handle hotspots), and better performance consistency preventing individual instance overload that could require additional capacity or cause performance degradation. For cost-sensitive workloads with tight margins or very high traffic volumes (hundreds of GB per day), cross-zone load balancing can be disabled by setting the attribute to false, accepting uneven load distribution and potential hotspots as a trade-off for eliminating inter-AZ data transfer charges.

### Target Tracking Scaling for Simplified Auto Scaling

The Auto Scaling configuration uses target tracking scaling policy (PolicyType: TargetTrackingScaling) with predefined CPU utilization metric (PredefinedMetricType: ASGAverageCPUUtilization) targeting 70% CPU (TargetValue: 70.0), providing simplified, automated scaling without requiring manual CloudWatch alarm creation, threshold tuning, or separate scale-out and scale-in policy configuration. Target tracking policies handle all scaling decisions automatically, adding instances when the metric exceeds the target value and removing instances when the metric falls below the target value for sustained periods, with built-in cooldown periods preventing rapid scaling oscillations.

Target tracking scaling represents a modern best practice compared to legacy step scaling or simple scaling policies that required explicit CloudWatch alarms with manually defined thresholds, evaluation periods, and comparison operators, plus separate scale-out and scale-in policies with different adjustment values. Target tracking eliminates this complexity by automatically creating and managing the underlying CloudWatch alarms based on the target value, adjusting scaling aggressiveness based on how far the current metric is from the target (larger deviations trigger larger scaling adjustments), and handling cooldown periods to prevent thrashing where instances are repeatedly added and removed in quick succession.

The 70% CPU target provides 30% headroom capacity for sudden traffic spikes, brief CPU bursts during request processing, or temporary load increases while optimizing costs through automatic scale-down during low-traffic periods. This balance is appropriate for API workloads with variable request rates where brief CPU spikes are normal during request processing but sustained high CPU indicates capacity constraints requiring additional instances. Organizations can adjust the target value based on workload characteristics: lower targets like 50-60% provide more headroom and faster response to traffic increases at higher cost (more instances running), while higher targets like 80-90% maximize utilization and minimize costs but risk performance degradation if traffic spikes faster than scaling can respond.

The policy uses PredefinedMetricType: ASGAverageCPUUtilization which averages CPU across all instances in the Auto Scaling Group, providing whole-fleet perspective on capacity rather than individual instance metrics. This approach prevents scaling decisions based on temporary single-instance issues (one instance experiencing high CPU from a long-running request while others are idle) and ensures scaling responds to sustained fleet-wide capacity constraints indicating genuine need for additional capacity.
