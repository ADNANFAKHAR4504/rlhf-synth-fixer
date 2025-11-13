# Ideal Response: Security Configuration as Code for Highly Available Web Application

## Architecture Overview

This CloudFormation template creates a production-ready, security-focused web application infrastructure on AWS with comprehensive security controls, multi-tier architecture, encryption at rest and in transit, centralized logging and monitoring, and full audit trails. The infrastructure implements security best practices including VPC network isolation with three-tier architecture, defense-in-depth security groups, KMS encryption, IAM least privilege principles, AWS WAF protection, comprehensive CloudTrail auditing, AWS Config compliance monitoring, and CloudWatch log aggregation following AWS Well-Architected Framework security pillar guidelines across all five pillars: security, reliability, performance efficiency, cost optimization, and operational excellence.

## Network Architecture

The infrastructure implements a highly available, secure VPC architecture in the us-west-1 region with proper network segmentation, isolation, and controlled internet access across multiple availability zones. The VPC uses a configurable 10.0.0.0/16 CIDR block with three-tier network architecture consisting of public subnets for internet-facing load balancers, private subnets for application servers, and database subnets for data tier isolation. Six subnets are deployed across two availability zones for high availability: PublicSubnet1 (10.0.1.0/24) and PublicSubnet2 (10.0.2.0/24) host the Application Load Balancer and NAT Gateways with MapPublicIpOnLaunch enabled for automatic public IP assignment, PrivateSubnet1 (10.0.3.0/24) and PrivateSubnet2 (10.0.4.0/24) host application servers with outbound internet access through NAT Gateways, and DatabaseSubnet1 (10.0.5.0/24) and DatabaseSubnet2 (10.0.6.0/24) provide complete isolation for database resources with no direct internet connectivity. An Internet Gateway provides public subnet connectivity enabling inbound traffic to the load balancer and outbound traffic from public resources. Two NAT Gateways with dedicated Elastic IPs are deployed across both availability zones providing high availability for outbound internet access from private subnets, ensuring application servers can download patches and access external APIs while remaining inaccessible from the internet. Separate route tables control traffic flow with the public route table directing 0.0.0.0/0 traffic to the Internet Gateway, PrivateRouteTable1 directing private subnet 1 traffic through NatGateway1, PrivateRouteTable2 directing private subnet 2 traffic through NatGateway2, and DatabaseRouteTable providing complete isolation with no default route ensuring database subnets cannot access the internet. This three-tier network design with multi-AZ deployment ensures defense-in-depth security architecture with proper network segmentation, high availability through redundant NAT Gateways and multi-AZ subnet distribution, and least privilege network access where each tier can only communicate with adjacent tiers through security group controls.

## Compute and Load Balancing Layer

The compute layer consists of EC2 instances deployed via Auto Scaling Groups with Launch Templates, providing automatic horizontal scaling and self-healing capabilities for the web tier. The WebServerLaunchTemplate defines instance configuration using the latest Amazon Linux 2 AMI retrieved dynamically from SSM Parameter Store through {{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}} ensuring instances always launch with current AMIs without manual updates. Instances use configurable instance types (defaulting to t3.micro with allowed values of t3.micro, t3.small, and t3.medium) providing flexibility for different workload requirements while constraining expensive instance types. Optional SSH key pair access is controlled through the HasKeyPair condition checking if KeyPairName parameter is empty, implementing conditional access where KeyPairName can be left empty to completely disable SSH access following zero-trust principles. The WebServerSecurityGroup restricts inbound traffic to HTTP (port 80) and HTTPS (port 443) exclusively from the LoadBalancerSecurityGroup using SourceSecurityGroupId references for security group chaining, and SSH (port 22) from the specific SSHAllowedCIDR parameter (defaulting to 203.0.113.0/32 - a documentation CIDR that must be changed for actual use). The Launch Template implements additional security controls including 20GB EBS volumes with gp3 storage type for cost optimization, encryption enabled using AWS-managed keys, and DeleteOnTermination set to true for automatic cleanup. IMDSv2 is enforced through MetadataOptions with HttpTokens set to required and HttpPutResponseHopLimit set to 1, preventing SSRF attacks and ensuring instance metadata can only be accessed from the instance itself. UserData script installs and configures essential components including amazon-ssm-agent for Systems Manager access eliminating the need for SSH in most operational scenarios, httpd web server serving a basic HTML page, and jq for JSON parsing in operational scripts. The WebServerAutoScalingGroup deploys instances across PublicSubnet1 and PublicSubnet2 with MinSize of 2, MaxSize of 4, and DesiredCapacity of 2 ensuring continuous availability even during AZ failure. Health checks use ELB type with 300-second grace period allowing instances time to initialize before health evaluation. The Application Load Balancer provides Layer 7 load balancing with internet-facing scheme deployed across both public subnets for high availability. Load balancer attributes enable 60-second idle timeout for connection management and S3 access logging to LoggingS3Bucket with alb-logs prefix for security analysis and compliance auditing. The WebServerTargetGroup defines health check parameters with 30-second intervals, HTTP protocol on port 80 with / path, 5-second timeout, 2 healthy threshold, and 3 unhealthy threshold providing balanced health detection. The LoadBalancerListener forwards HTTP traffic on port 80 to the target group without TLS termination, appropriate for internal applications or scenarios where TLS is handled by external WAF or CloudFront distributions. This compute architecture provides automatic scaling from 2 to 4 instances based on demand, self-healing through health checks automatically replacing failed instances, multi-AZ deployment surviving entire availability zone failures, and security hardening through minimal attack surface with IMDSv2, encrypted volumes, and security group restrictions.

## Security Groups and Network Access Control

Security groups implement defense-in-depth network security through layered access controls following the principle of least privilege with explicit allow rules and implicit deny. The LoadBalancerSecurityGroup allows inbound HTTP (port 80) and HTTPS (port 443) from the internet (0.0.0.0/0) serving as the only internet-facing entry point, with all outbound traffic allowed for health checks and communication with backend instances. The WebServerSecurityGroup restricts inbound access to HTTP (port 80) and HTTPS (port 443) exclusively from LoadBalancerSecurityGroup using SourceSecurityGroupId preventing direct internet access to web servers, and SSH (port 22) from SSHAllowedCIDR parameter enabling administrative access from specific trusted IP addresses while blocking SSH from the broader internet. The AppServerSecurityGroup allows inbound traffic on port 8080 exclusively from WebServerSecurityGroup preventing direct access from the load balancer or internet, and SSH (port 22) from SSHAllowedCIDR for administrative access, implementing application tier isolation where only the web tier can communicate with application servers. The DatabaseSecurityGroup provides the most restrictive access allowing MySQL (port 3306) exclusively from AppServerSecurityGroup with no SSH access, ensuring the database can only be accessed from the application tier with complete isolation from web tier and internet. All security groups allow unrestricted outbound traffic for software updates, external API calls, and service communication while ingress rules implement strict controls. This security group architecture creates a defense-in-depth network security posture where compromise of one tier does not automatically grant access to other tiers, the internet can only access the load balancer with all other resources protected, administrative access via SSH is restricted to specific trusted IP addresses, and each tier can only communicate with adjacent tiers through application-specific ports. Security group descriptions clearly document the purpose and allowed traffic patterns supporting security audits and compliance requirements. The security groups use SourceSecurityGroupId references rather than CIDR blocks for inter-tier communication, automatically adapting to instance changes and preventing the need for hardcoded IP addresses while providing stronger security through dynamic group membership.

## Storage and Encryption Layer

The storage layer implements comprehensive encryption for data at rest using AWS KMS and S3 with multiple buckets serving different purposes and security requirements. A customer-managed KMS key provides centralized encryption control with automatic key rotation enabled through EnableKeyRotation set to true, causing AWS to automatically rotate the key material annually while maintaining the same key ID and alias ensuring encrypted data remains accessible without application changes. The KMS key policy grants root account full permissions for key management and allows S3, CloudWatch Logs, and CloudTrail services to use the key for encryption and decryption through service principal permissions. A KMS alias (alias/secure-webapp-${EnvironmentSuffix}) provides a friendly name following AWS naming conventions enabling easy key identification across environments without remembering key IDs. The ApplicationS3Bucket stores application data with KMS encryption using SSE-KMS and the customer-managed key providing enhanced security over AWS-managed encryption, BucketKeyEnabled reducing KMS API calls by up to 99% through S3 bucket keys that generate data keys locally significantly reducing costs, versioning enabled for data protection and point-in-time recovery, and logging configuration directing access logs to LoggingS3Bucket with webapp-bucket-logs/ prefix. DeletionPolicy and UpdateReplacePolicy set to Retain prevent accidental data loss during stack updates or deletions requiring explicit bucket deletion. PublicAccessBlockConfiguration blocks all public access with BlockPublicAcls, BlockPublicPolicy, IgnorePublicAcls, and RestrictPublicBuckets all set to true preventing accidental public exposure. The LoggingS3Bucket captures access logs from ApplicationS3Bucket and load balancer logs with AES256 encryption sufficient for log data, lifecycle rule automatically deleting logs after 90 days balancing compliance retention requirements with storage costs, and Retain deletion policy preventing log loss. The CloudTrailBucket stores audit logs with AES256 encryption, lifecycle rule deleting logs after 365 days meeting most compliance requirements, and dedicated bucket policy granting CloudTrail service permissions to write logs with bucket-owner-full-control ACL. The ConfigS3Bucket stores AWS Config snapshots and configuration history with similar security controls. The ApplicationS3BucketPolicy enforces HTTPS for all data transfers through an explicit deny statement when aws:SecureTransport is false, ensuring encryption in transit and preventing man-in-the-middle attacks by rejecting any unencrypted HTTP requests to both the bucket and its objects. This comprehensive storage and encryption architecture protects data at rest through customer-managed KMS keys with automatic rotation, enforces encryption in transit through mandatory HTTPS, provides data durability through versioning, maintains compliance through audit logging, optimizes costs through bucket keys and lifecycle policies, and prevents accidental public exposure through multiple layers of public access blocks.

## IAM Roles and Policies

IAM roles implement strict least privilege principles with fine-grained permissions scoped to specific resources and actions required for each component's functionality. The WebServerRole provides EC2 instances with necessary permissions through a trust policy allowing ec2.amazonaws.com service principal to assume the role. Managed policies include AmazonSSMManagedInstanceCore enabling Systems Manager Session Manager for secure shell access without SSH keys or bastion hosts, and CloudWatchAgentServerPolicy granting permissions for CloudWatch agent to publish metrics and logs. Inline policies implement application-specific permissions with S3ReadOnlyPolicy granting GetObject and ListBucket actions exclusively to ApplicationS3Bucket using Fn::GetAtt for bucket ARN and Fn::Sub for object paths, preventing access to other S3 buckets and implementing read-only access where web servers cannot modify data. KMSDecryptPolicy grants Decrypt and DescribeKey permissions only to the customer-managed KMS key enabling web servers to decrypt encrypted S3 objects without broader KMS permissions or ability to encrypt data. The WebServerInstanceProfile associates the role with EC2 instances through the launch template. The APIGatewayCloudWatchRole allows API Gateway to write logs to CloudWatch using the AmazonAPIGatewayPushToCloudWatchLogs managed policy. The ConfigRecorderRole allows AWS Config service to read resource configurations using the ConfigRole managed policy and write configuration snapshots to ConfigS3Bucket through inline ConfigS3AccessPolicy with GetBucketAcl, ListBucket, and PutObject permissions scoped to the specific bucket. The VPCFlowLogRole grants VPC Flow Logs service permissions to create log groups and streams and publish logs to CloudWatch Logs with permissions for CreateLogGroup, CreateLogStream, PutLogEvents, DescribeLogGroups, and DescribeLogStreams. All roles include comprehensive tagging with Name, Environment, Project, Owner, and CostCenter tags enabling cost allocation and compliance reporting. No roles use wildcard resource ARNs except where required by service functionality such as VPC Flow Logs needing to create log streams with unpredictable names, and all policies explicitly reference specific resources using CloudFormation intrinsic functions ensuring policies automatically reference correct resources even if ARNs change. This IAM architecture eliminates hardcoded credentials, provides temporary security credentials automatically rotated by AWS, implements separation of duties where each role has minimal permissions for its specific function, supports audit and compliance through CloudTrail logging of all AssumeRole operations, and follows AWS Well-Architected security pillar guidance for identity and access management.

## API Gateway and WAF Protection

API Gateway serves as an additional secure entry point for the application providing RESTful API access with comprehensive request validation, logging, and WAF protection. The APIGatewayRestAPI is configured as REGIONAL endpoint type optimizing latency for clients in the same region and simplifying architecture compared to EDGE endpoints. The RequestValidator enforces validation of both request parameters and request body through ValidateRequestBody and ValidateRequestParameters set to true, rejecting malformed requests with HTTP 400 Bad Request before they reach backend systems reducing attack surface. A sample /api resource demonstrates API structure with GET method using HTTP_PROXY integration forwarding requests to the Application Load Balancer DNS name, enabling API Gateway to serve as a managed API layer with additional security controls in front of the existing web application. The APIGatewayStage deploys the API to the prod stage as required by many compliance frameworks with comprehensive logging configuration. AccessLogSetting directs logs to APIGatewayLogGroup capturing request IDs, request times, HTTP methods, resource paths, and response status codes supporting security analysis and usage tracking. MethodSettings enable INFO-level logging for detailed request/response information, DataTraceEnabled for full request and response body logging useful for debugging, and MetricsEnabled for CloudWatch metrics tracking API performance and error rates. The APIGatewayAccount configures the account-level CloudWatch role enabling API Gateway to write logs. The APIGatewayLogGroup stores access logs with 30-day retention balancing troubleshooting needs with storage costs. AWS WAF provides Layer 7 security protecting against common web exploits and bot traffic through the WAFWebACL resource. The Web ACL is scoped as REGIONAL matching the API Gateway configuration and implements three critical security rules. The RateLimitRule with priority 1 limits requests to 2000 per 5 minutes per IP address using RateBasedStatement preventing denial of service attacks and brute force attempts by blocking excessive requests from single sources. The AWSManagedRulesCommonRuleSet with priority 2 applies AWS-managed rules protecting against OWASP Top 10 vulnerabilities including SQL injection, cross-site scripting, and other common attack patterns with regularly updated signatures. The AWSManagedRulesSQLiRuleSet with priority 3 provides additional SQL injection protection with specialized rules detecting SQL injection attempts in query strings, headers, and body content. All rules have VisibilityConfig enabling CloudWatch metrics and sampled request logging for security analysis. The WAFWebACLAssociation attaches the Web ACL to the API Gateway prod stage using the stage ARN format, ensuring all API requests are inspected by WAF before reaching the API Gateway. This API Gateway and WAF architecture provides multiple security benefits including request validation rejecting malformed inputs before backend processing, rate limiting preventing abuse and denial of service, protection against OWASP Top 10 vulnerabilities through managed rule groups, comprehensive logging for security analysis and incident response, and managed infrastructure eliminating the need to maintain security appliances or update rule sets manually.

## Audit, Compliance, and Governance

Comprehensive audit and compliance capabilities are implemented through CloudTrail, AWS Config, VPC Flow Logs, and CloudWatch Logs providing complete visibility into account activity, resource configurations, network traffic, and application behavior. CloudTrail provides a complete audit trail of all AWS API calls across the account with the trail configured to log management events including resource creation, modification, and deletion through EventSelectors with ReadWriteType set to All and IncludeManagementEvents set to true. The trail is configured as a multi-region trail through IsMultiRegionTrail set to false (deployed only in us-west-1) but IncludeGlobalServiceEvents set to true ensures capture of global service events like IAM, CloudFront, and AWS Organizations activity which are not region-specific. EnableLogFileValidation set to true creates digital signatures for log files enabling cryptographic verification that logs have not been tampered with supporting forensic investigations and compliance audits. CloudTrail logs are stored in the CloudTrailBucket with lifecycle policy deleting logs after 365 days meeting HIPAA, PCI DSS, and most regulatory requirements while managing storage costs. AWS Config provides continuous compliance monitoring and configuration change tracking through the ConfigRecorder recording all supported resource types with AllSupported set to true and IncludeGlobalResourceTypes set to false to avoid duplication with global resource recording in the primary region. The ConfigDeliveryChannel delivers configuration snapshots to ConfigS3Bucket every 24 hours through TwentyFour_Hours delivery frequency providing point-in-time configuration baselines. Four Config Rules enforce security best practices: S3BucketPublicReadProhibitedRule detects S3 buckets allowing public read access, S3BucketServerSideEncryptionEnabledRule verifies S3 buckets have encryption enabled, EC2InstancesInVPCRule ensures EC2 instances are deployed in VPCs rather than EC2-Classic, and RestrictedSSHRule detects security groups allowing unrestricted SSH access from 0.0.0.0/0. These rules automatically evaluate resources on configuration changes and periodically, marking resources as compliant or non-compliant enabling automated compliance reporting and alerting. VPC Flow Logs capture all network traffic metadata flowing through the VPC with TrafficType set to ALL logging both accepted and rejected traffic through security groups and NACLs. Flow logs stream to VPCFlowLogGroup in CloudWatch Logs rather than S3 enabling real-time analysis through CloudWatch Logs Insights, faster security incident response through immediate log availability, and CloudWatch metric filters for automated alerting on suspicious network patterns like port scanning, unusual outbound connections, or traffic to known malicious IPs. The 30-day retention provides sufficient history for most security investigations while managing costs. CloudWatch log groups aggregate logs from multiple sources including VPC Flow Logs for network traffic, API Gateway access logs for API usage, and future Lambda or application logs as the infrastructure expands. This comprehensive audit and compliance architecture provides complete visibility into AWS account activity through CloudTrail logging every API call, continuous compliance monitoring through AWS Config rules with automatic detection of configuration drift and security violations, network visibility through VPC Flow Logs capturing all traffic with real-time analysis capabilities, and centralized log management through CloudWatch Logs supporting security analysis, troubleshooting, and compliance reporting.

## Monitoring and Operational Visibility

CloudWatch Logs provides centralized log aggregation and operational visibility across the infrastructure supporting troubleshooting, security analysis, and compliance reporting. The VPCFlowLogGroup captures all network traffic metadata with 30-day retention providing visibility into connection patterns, security group effectiveness, and potential security threats. VPC Flow Logs streaming to CloudWatch Logs rather than S3 enables CloudWatch Logs Insights queries for real-time analysis including identifying top talking endpoints, analyzing traffic by port and protocol, investigating security group deny actions, and detecting anomalous network patterns. The APIGatewayLogGroup stores API Gateway access logs with 30-day retention capturing request metadata including request IDs for tracing requests through the system, request and response times for performance analysis, HTTP methods and resource paths for usage tracking, and response status codes for error analysis. CloudWatch metrics are automatically generated for key infrastructure components including ALB metrics for request count, target response time, HTTP status codes, and healthy/unhealthy target counts enabling operational dashboards and alerting on load balancer health. Auto Scaling metrics track desired capacity, current capacity, and scaling activities enabling visibility into scaling behavior and capacity planning. API Gateway metrics track request count, latency, 4XX errors indicating client-side issues or validation failures, and 5XX errors indicating backend or API Gateway issues. Future enhancements would include CloudWatch alarms for proactive issue detection with ALB target health alarms detecting when healthy target count drops below desired threshold indicating instance failures, ALB 5XX error alarms detecting backend failures requiring investigation, API Gateway error alarms for both 4XX and 5XX errors, and Auto Scaling alarms for capacity planning. CloudWatch Logs Insights provides a powerful query language for log analysis with queries able to parse VPC Flow Logs to identify security group rejections, analyze API Gateway logs to identify highest latency requests, and correlate logs across sources using request IDs. This monitoring and operational visibility architecture provides real-time insights into infrastructure health and performance, security analysis capabilities through comprehensive logging, troubleshooting support through centralized log aggregation and correlation, and compliance reporting through log retention and CloudWatch Logs export to S3 for long-term archival.

## High Availability and Disaster Recovery

The architecture implements comprehensive high availability through multi-AZ deployment, redundant components, and automatic failover capabilities ensuring the application remains available during infrastructure failures. Network high availability is achieved through dual NAT Gateways deployed in separate availability zones (NatGateway1 in PublicSubnet1 in AZ1 and NatGateway2 in PublicSubnet2 in AZ2) ensuring private subnet instances in each AZ have independent outbound internet paths eliminating single points of failure where failure of one NAT Gateway only affects instances in that specific AZ. Public subnets in both AZs provide redundant paths for incoming internet traffic through the Internet Gateway. Compute high availability is implemented through the Auto Scaling Group spanning both availability zones with instances distributed across PublicSubnet1 and PublicSubnet2 ensuring at least one instance remains available during AZ failure. Auto Scaling automatically maintains the desired capacity of 2 instances by launching replacement instances when health checks fail, responding to instance termination or failure within minutes. The Application Load Balancer is deployed across both public subnets with automatic traffic distribution across healthy targets using round-robin or least outstanding requests algorithms. Health checks monitor instance health every 30 seconds with 2 consecutive successful checks required to mark an instance healthy and 3 consecutive failures to mark it unhealthy. Unhealthy instances are automatically removed from the load balancer target group and replaced by Auto Scaling ensuring traffic only flows to healthy instances. Load balancer cross-zone load balancing (enabled by default) distributes traffic evenly across instances in both AZs preventing traffic imbalance. Storage high availability is provided by S3's 99.999999999% durability with automatic replication across multiple facilities within the region and versioning enabled providing protection against accidental deletions with ability to restore previous versions. S3 provides 99.99% availability with automatic failover between storage nodes. EBS volumes attached to EC2 instances are automatically replicated within their availability zone providing protection against disk failures. CloudTrail, AWS Config, and CloudWatch Logs all use highly available AWS-managed services with automatic replication and redundancy. Disaster recovery capabilities include S3 versioning enabling point-in-time recovery of application data, CloudFormation templates enabling infrastructure recreation in alternate regions using infrastructure as code, CloudTrail logs providing audit trails for forensic analysis and recovery procedures, and AWS Config providing configuration snapshots for restore operations. Recovery Time Objective (RTO) is minimized through Auto Scaling automatic replacement of failed instances (typically 5-10 minutes) and multi-AZ load balancer distribution providing immediate failover when an AZ fails. Recovery Point Objective (RPO) depends on application data backup frequency with S3 versioning providing near-zero RPO for objects stored in S3. This high availability architecture ensures the application survives single instance failures through Auto Scaling automatic replacement, single AZ failures through multi-AZ deployment of critical components, and infrastructure failures through redundant NAT Gateways, load balancer nodes, and storage replication.

## CloudFormation Template

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Security Configuration as Code - Secure, highly available web application infrastructure in us-west-1",
  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": {
            "default": "Environment Configuration"
          },
          "Parameters": ["EnvironmentSuffix"]
        },
        {
          "Label": {
            "default": "Network Configuration"
          },
          "Parameters": [
            "VpcCIDR",
            "PublicSubnet1CIDR",
            "PublicSubnet2CIDR",
            "PrivateSubnet1CIDR",
            "PrivateSubnet2CIDR",
            "DatabaseSubnet1CIDR",
            "DatabaseSubnet2CIDR",
            "SSHAllowedCIDR"
          ]
        },
        {
          "Label": {
            "default": "EC2 Configuration"
          },
          "Parameters": ["InstanceType", "KeyPairName"]
        }
      ]
    }
  },
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "prod",
      "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
      "AllowedPattern": "^[a-zA-Z0-9]+$",
      "ConstraintDescription": "Must contain only alphanumeric characters"
    },
    "VpcCIDR": {
      "Type": "String",
      "Default": "10.0.0.0/16",
      "Description": "CIDR block for VPC",
      "AllowedPattern": "^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/16)$"
    },
    "PublicSubnet1CIDR": {
      "Type": "String",
      "Default": "10.0.1.0/24",
      "Description": "CIDR block for Public Subnet in first AZ",
      "AllowedPattern": "^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/24)$"
    },
    "PublicSubnet2CIDR": {
      "Type": "String",
      "Default": "10.0.2.0/24",
      "Description": "CIDR block for Public Subnet in second AZ",
      "AllowedPattern": "^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/24)$"
    },
    "PrivateSubnet1CIDR": {
      "Type": "String",
      "Default": "10.0.3.0/24",
      "Description": "CIDR block for Private Subnet in first AZ",
      "AllowedPattern": "^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/24)$"
    },
    "PrivateSubnet2CIDR": {
      "Type": "String",
      "Default": "10.0.4.0/24",
      "Description": "CIDR block for Private Subnet in second AZ",
      "AllowedPattern": "^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/24)$"
    },
    "DatabaseSubnet1CIDR": {
      "Type": "String",
      "Default": "10.0.5.0/24",
      "Description": "CIDR block for Database Subnet in first AZ",
      "AllowedPattern": "^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/24)$"
    },
    "DatabaseSubnet2CIDR": {
      "Type": "String",
      "Default": "10.0.6.0/24",
      "Description": "CIDR block for Database Subnet in second AZ",
      "AllowedPattern": "^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/24)$"
    },
    "SSHAllowedCIDR": {
      "Type": "String",
      "Default": "203.0.113.0/32",
      "Description": "CIDR block allowed to SSH to EC2 instances",
      "AllowedPattern": "^(\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/(\\d|[1-2]\\d|3[0-2]))$"
    },
    "InstanceType": {
      "Type": "String",
      "Default": "t3.micro",
      "Description": "EC2 instance type",
      "AllowedValues": ["t3.micro", "t3.small", "t3.medium"]
    },
    "KeyPairName": {
      "Type": "String",
      "Default": "",
      "Description": "Name of an existing EC2 KeyPair to enable SSH access to the instances (leave empty if no SSH access needed)"
    }
  },
  "Conditions": {
    "HasKeyPair": {
      "Fn::Not": [
        {
          "Fn::Equals": [
            {
              "Ref": "KeyPairName"
            },
            ""
          ]
        }
      ]
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": {
          "Ref": "VpcCIDR"
        },
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "VPC-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "IGW-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "InternetGatewayAttachment": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "InternetGatewayId": {
          "Ref": "InternetGateway"
        },
        "VpcId": {
          "Ref": "VPC"
        }
      }
    },
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "PublicSubnet1CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "PublicSubnet1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "PublicSubnet2CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            1,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "PublicSubnet2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "PrivateSubnet1CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "PrivateSubnet1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "PrivateSubnet2CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            1,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "PrivateSubnet2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "DatabaseSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "DatabaseSubnet1CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "DatabaseSubnet1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "DatabaseSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "DatabaseSubnet2CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            1,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "DatabaseSubnet2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "NatGateway1EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "InternetGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "NatGateway1EIP-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "NatGateway2EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "InternetGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "NatGateway2EIP-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "NatGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": ["NatGateway1EIP", "AllocationId"]
        },
        "SubnetId": {
          "Ref": "PublicSubnet1"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "NatGateway1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "NatGateway2": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": ["NatGateway2EIP", "AllocationId"]
        },
        "SubnetId": {
          "Ref": "PublicSubnet2"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "NatGateway2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "PublicRouteTable-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "PublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "InternetGatewayAttachment",
      "Properties": {
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": {
          "Ref": "InternetGateway"
        }
      }
    },
    "PublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        },
        "SubnetId": {
          "Ref": "PublicSubnet1"
        }
      }
    },
    "PublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        },
        "SubnetId": {
          "Ref": "PublicSubnet2"
        }
      }
    },
    "PrivateRouteTable1": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "PrivateRouteTable1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "PrivateRoute1": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable1"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NatGateway1"
        }
      }
    },
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable1"
        },
        "SubnetId": {
          "Ref": "PrivateSubnet1"
        }
      }
    },
    "PrivateRouteTable2": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "PrivateRouteTable2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "PrivateRoute2": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable2"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NatGateway2"
        }
      }
    },
    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable2"
        },
        "SubnetId": {
          "Ref": "PrivateSubnet2"
        }
      }
    },
    "DatabaseRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "DatabaseRouteTable-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "DatabaseSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {
          "Ref": "DatabaseRouteTable"
        },
        "SubnetId": {
          "Ref": "DatabaseSubnet1"
        }
      }
    },
    "DatabaseSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {
          "Ref": "DatabaseRouteTable"
        },
        "SubnetId": {
          "Ref": "DatabaseSubnet2"
        }
      }
    },
    "LoadBalancerSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Application Load Balancer",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "HTTP access from internet"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "HTTPS access from internet"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound traffic"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "LoadBalancerSecurityGroup-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "WebServerSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for web servers - allows traffic from ALB only",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "SourceSecurityGroupId": {
              "Ref": "LoadBalancerSecurityGroup"
            },
            "Description": "HTTP from ALB"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "SourceSecurityGroupId": {
              "Ref": "LoadBalancerSecurityGroup"
            },
            "Description": "HTTPS from ALB"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": {
              "Ref": "SSHAllowedCIDR"
            },
            "Description": "SSH access from specific IP"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound traffic"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebServerSecurityGroup-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "AppServerSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for application servers - allows traffic from web tier only",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 8080,
            "ToPort": 8080,
            "SourceSecurityGroupId": {
              "Ref": "WebServerSecurityGroup"
            },
            "Description": "App traffic from web servers"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": {
              "Ref": "SSHAllowedCIDR"
            },
            "Description": "SSH access from specific IP"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound traffic"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "AppServerSecurityGroup-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "DatabaseSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for database servers - allows traffic from app tier only",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {
              "Ref": "AppServerSecurityGroup"
            },
            "Description": "MySQL from app servers"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound traffic"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "DatabaseSecurityGroup-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for encrypting S3 buckets and other resources",
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {
                "AWS": {
                  "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                }
              },
              "Action": "kms:*",
              "Resource": "*"
            },
            {
              "Sid": "Allow services to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "s3.amazonaws.com",
                  "logs.amazonaws.com",
                  "cloudtrail.amazonaws.com"
                ]
              },
              "Action": ["kms:Decrypt", "kms:GenerateDataKey"],
              "Resource": "*"
            }
          ]
        },
        "EnableKeyRotation": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "KMSKey-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/secure-webapp-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "KMSKey"
        }
      }
    },
    "ApplicationS3Bucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Retain",
      "UpdateReplacePolicy": "Retain",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "webapp-data-${AWS::AccountId}-${EnvironmentSuffix}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Fn::GetAtt": ["KMSKey", "Arn"]
                }
              },
              "BucketKeyEnabled": true
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "LoggingConfiguration": {
          "DestinationBucketName": {
            "Ref": "LoggingS3Bucket"
          },
          "LogFilePrefix": "webapp-bucket-logs/"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "ApplicationS3Bucket-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "LoggingS3Bucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Retain",
      "UpdateReplacePolicy": "Retain",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "webapp-logs-${AWS::AccountId}-${EnvironmentSuffix}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              }
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldLogs",
              "Status": "Enabled",
              "ExpirationInDays": 90
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "LoggingS3Bucket-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "LoggingS3BucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "LoggingS3Bucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AWSLogDeliveryWrite",
              "Effect": "Allow",
              "Principal": {
                "Service": "logging.s3.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Sub": "${LoggingS3Bucket.Arn}/*"
              }
            },
            {
              "Sid": "AWSLogDeliveryAclCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "logging.s3.amazonaws.com"
              },
              "Action": "s3:GetBucketAcl",
              "Resource": {
                "Fn::GetAtt": ["LoggingS3Bucket", "Arn"]
              }
            },
            {
              "Sid": "AWSELBLogDelivery",
              "Effect": "Allow",
              "Principal": {
                "AWS": "arn:aws:iam::027434742980:root"
              },
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Sub": "${LoggingS3Bucket.Arn}/*"
              }
            }
          ]
        }
      }
    },
    "ApplicationS3BucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "ApplicationS3Bucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "DenyInsecureTransport",
              "Effect": "Deny",
              "Principal": "*",
              "Action": "s3:*",
              "Resource": [
                {
                  "Fn::GetAtt": ["ApplicationS3Bucket", "Arn"]
                },
                {
                  "Fn::Sub": "${ApplicationS3Bucket.Arn}/*"
                }
              ],
              "Condition": {
                "Bool": {
                  "aws:SecureTransport": "false"
                }
              }
            }
          ]
        }
      }
    },
    "CloudTrailBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Retain",
      "UpdateReplacePolicy": "Retain",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "cloudtrail-logs-${AWS::AccountId}-${EnvironmentSuffix}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              }
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldTrailLogs",
              "Status": "Enabled",
              "ExpirationInDays": 365
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "CloudTrailBucket-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "CloudTrailBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "CloudTrailBucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AWSCloudTrailAclCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": "s3:GetBucketAcl",
              "Resource": {
                "Fn::GetAtt": ["CloudTrailBucket", "Arn"]
              }
            },
            {
              "Sid": "AWSCloudTrailWrite",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Sub": "${CloudTrailBucket.Arn}/*"
              },
              "Condition": {
                "StringEquals": {
                  "s3:x-amz-acl": "bucket-owner-full-control"
                }
              }
            }
          ]
        }
      }
    },
    "CloudTrail": {
      "Type": "AWS::CloudTrail::Trail",
      "DependsOn": "CloudTrailBucketPolicy",
      "Properties": {
        "TrailName": {
          "Fn::Sub": "SecureWebAppTrail-${EnvironmentSuffix}"
        },
        "S3BucketName": {
          "Ref": "CloudTrailBucket"
        },
        "IncludeGlobalServiceEvents": true,
        "IsLogging": true,
        "IsMultiRegionTrail": false,
        "EnableLogFileValidation": true,
        "EventSelectors": [
          {
            "ReadWriteType": "All",
            "IncludeManagementEvents": true
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "CloudTrail-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "WebServerRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "WebServerRole-${EnvironmentSuffix}-${AWS::StackName}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "ec2.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
          "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
        ],
        "Policies": [
          {
            "PolicyName": "S3ReadOnlyPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["s3:GetObject", "s3:ListBucket"],
                  "Resource": [
                    {
                      "Fn::GetAtt": ["ApplicationS3Bucket", "Arn"]
                    },
                    {
                      "Fn::Sub": "${ApplicationS3Bucket.Arn}/*"
                    }
                  ]
                }
              ]
            }
          },
          {
            "PolicyName": "KMSDecryptPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["kms:Decrypt", "kms:DescribeKey"],
                  "Resource": {
                    "Fn::GetAtt": ["KMSKey", "Arn"]
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebServerRole-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "WebServerInstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Path": "/",
        "Roles": [
          {
            "Ref": "WebServerRole"
          }
        ]
      }
    },
    "WebServerLaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": {
          "Fn::Sub": "WebServerLT-${EnvironmentSuffix}"
        },
        "VersionDescription": "Initial version",
        "LaunchTemplateData": {
          "ImageId": "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}",
          "InstanceType": {
            "Ref": "InstanceType"
          },
          "KeyName": {
            "Fn::If": [
              "HasKeyPair",
              {
                "Ref": "KeyPairName"
              },
              {
                "Ref": "AWS::NoValue"
              }
            ]
          },
          "SecurityGroupIds": [
            {
              "Ref": "WebServerSecurityGroup"
            }
          ],
          "IamInstanceProfile": {
            "Arn": {
              "Fn::GetAtt": ["WebServerInstanceProfile", "Arn"]
            }
          },
          "UserData": {
            "Fn::Base64": {
              "Fn::Join": [
                "\n",
                [
                  "#!/bin/bash -xe",
                  "yum update -y",
                  "yum install -y amazon-ssm-agent",
                  "systemctl enable amazon-ssm-agent",
                  "systemctl start amazon-ssm-agent",
                  "yum install -y jq",
                  "yum install -y httpd",
                  "systemctl start httpd",
                  "systemctl enable httpd",
                  "echo '<html><h1>Secure Web Application</h1></html>' > /var/www/html/index.html"
                ]
              ]
            }
          },
          "BlockDeviceMappings": [
            {
              "DeviceName": "/dev/xvda",
              "Ebs": {
                "VolumeSize": 20,
                "VolumeType": "gp3",
                "Encrypted": true,
                "DeleteOnTermination": true
              }
            }
          ],
          "MetadataOptions": {
            "HttpTokens": "required",
            "HttpPutResponseHopLimit": 1
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {
                    "Fn::Sub": "WebServer-${EnvironmentSuffix}"
                  }
                },
                {
                  "Key": "Environment",
                  "Value": {
                    "Ref": "EnvironmentSuffix"
                  }
                },
                {
                  "Key": "Project",
                  "Value": "SecureWebApp"
                },
                {
                  "Key": "Owner",
                  "Value": "SecurityTeam"
                },
                {
                  "Key": "CostCenter",
                  "Value": "Security"
                }
              ]
            }
          ]
        }
      }
    },
    "WebServerAutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "Properties": {
        "AutoScalingGroupName": {
          "Fn::Sub": "WebServerASG-${EnvironmentSuffix}"
        },
        "LaunchTemplate": {
          "LaunchTemplateId": {
            "Ref": "WebServerLaunchTemplate"
          },
          "Version": {
            "Fn::GetAtt": ["WebServerLaunchTemplate", "LatestVersionNumber"]
          }
        },
        "MinSize": 2,
        "MaxSize": 4,
        "DesiredCapacity": 2,
        "VPCZoneIdentifier": [
          {
            "Ref": "PublicSubnet1"
          },
          {
            "Ref": "PublicSubnet2"
          }
        ],
        "TargetGroupARNs": [
          {
            "Ref": "WebServerTargetGroup"
          }
        ],
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebServer-${EnvironmentSuffix}"
            },
            "PropagateAtLaunch": true
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            },
            "PropagateAtLaunch": true
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp",
            "PropagateAtLaunch": true
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam",
            "PropagateAtLaunch": true
          },
          {
            "Key": "CostCenter",
            "Value": "Security",
            "PropagateAtLaunch": true
          }
        ]
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": {
          "Fn::Sub": "WebAppALB-${EnvironmentSuffix}"
        },
        "Scheme": "internet-facing",
        "SecurityGroups": [
          {
            "Ref": "LoadBalancerSecurityGroup"
          }
        ],
        "Subnets": [
          {
            "Ref": "PublicSubnet1"
          },
          {
            "Ref": "PublicSubnet2"
          }
        ],
        "Type": "application",
        "LoadBalancerAttributes": [
          {
            "Key": "idle_timeout.timeout_seconds",
            "Value": "60"
          },
          {
            "Key": "access_logs.s3.enabled",
            "Value": "true"
          },
          {
            "Key": "access_logs.s3.bucket",
            "Value": {
              "Ref": "LoggingS3Bucket"
            }
          },
          {
            "Key": "access_logs.s3.prefix",
            "Value": "alb-logs"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "ApplicationLoadBalancer-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "WebServerTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {
          "Fn::Sub": "WebServerTG-${EnvironmentSuffix}"
        },
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckPath": "/",
        "HealthCheckPort": "80",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "Port": 80,
        "Protocol": "HTTP",
        "TargetType": "instance",
        "UnhealthyThresholdCount": 3,
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebServerTargetGroup-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "LoadBalancerListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {
              "Ref": "WebServerTargetGroup"
            }
          }
        ],
        "LoadBalancerArn": {
          "Ref": "ApplicationLoadBalancer"
        },
        "Port": 80,
        "Protocol": "HTTP"
      }
    },
    "APIGatewayCloudWatchRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "apigateway.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "APIGatewayCloudWatchRole-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "APIGatewayRestAPI": {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": {
        "Name": {
          "Fn::Sub": "SecureWebAppAPI-${EnvironmentSuffix}"
        },
        "Description": "API Gateway for secure web application",
        "EndpointConfiguration": {
          "Types": ["REGIONAL"]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "APIGateway-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "APIGatewayAccount": {
      "Type": "AWS::ApiGateway::Account",
      "Properties": {
        "CloudWatchRoleArn": {
          "Fn::GetAtt": ["APIGatewayCloudWatchRole", "Arn"]
        }
      }
    },
    "APIGatewayRequestValidator": {
      "Type": "AWS::ApiGateway::RequestValidator",
      "Properties": {
        "Name": "RequestValidator",
        "RestApiId": {
          "Ref": "APIGatewayRestAPI"
        },
        "ValidateRequestBody": true,
        "ValidateRequestParameters": true
      }
    },
    "APIGatewayResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {
          "Ref": "APIGatewayRestAPI"
        },
        "ParentId": {
          "Fn::GetAtt": ["APIGatewayRestAPI", "RootResourceId"]
        },
        "PathPart": "api"
      }
    },
    "APIGatewayMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {
          "Ref": "APIGatewayRestAPI"
        },
        "ResourceId": {
          "Ref": "APIGatewayResource"
        },
        "HttpMethod": "GET",
        "AuthorizationType": "NONE",
        "RequestValidatorId": {
          "Ref": "APIGatewayRequestValidator"
        },
        "Integration": {
          "Type": "HTTP_PROXY",
          "IntegrationHttpMethod": "GET",
          "Uri": {
            "Fn::Sub": "http://${ApplicationLoadBalancer.DNSName}/"
          }
        },
        "MethodResponses": [
          {
            "StatusCode": "200"
          }
        ]
      }
    },
    "APIGatewayDeployment": {
      "Type": "AWS::ApiGateway::Deployment",
      "DependsOn": "APIGatewayMethod",
      "Properties": {
        "RestApiId": {
          "Ref": "APIGatewayRestAPI"
        },
        "Description": "Production deployment"
      }
    },
    "APIGatewayStage": {
      "Type": "AWS::ApiGateway::Stage",
      "Properties": {
        "StageName": "prod",
        "RestApiId": {
          "Ref": "APIGatewayRestAPI"
        },
        "DeploymentId": {
          "Ref": "APIGatewayDeployment"
        },
        "Description": "Production stage",
        "AccessLogSetting": {
          "DestinationArn": {
            "Fn::GetAtt": ["APIGatewayLogGroup", "Arn"]
          },
          "Format": "$context.requestId $context.requestTime $context.httpMethod $context.resourcePath $context.status"
        },
        "MethodSettings": [
          {
            "ResourcePath": "/*",
            "HttpMethod": "*",
            "LoggingLevel": "INFO",
            "DataTraceEnabled": true,
            "MetricsEnabled": true
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "APIGatewayStage-prod-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "APIGatewayLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/apigateway/SecureWebAppAPI-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    },
    "WAFWebACL": {
      "Type": "AWS::WAFv2::WebACL",
      "Properties": {
        "Name": {
          "Fn::Sub": "SecureWebAppWAF-${EnvironmentSuffix}"
        },
        "Scope": "REGIONAL",
        "DefaultAction": {
          "Allow": {}
        },
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": {
            "Fn::Sub": "SecureWebAppWAF-${EnvironmentSuffix}"
          }
        },
        "Rules": [
          {
            "Name": "RateLimitRule",
            "Priority": 1,
            "Statement": {
              "RateBasedStatement": {
                "Limit": 2000,
                "AggregateKeyType": "IP"
              }
            },
            "Action": {
              "Block": {}
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "RateLimitRule"
            }
          },
          {
            "Name": "AWSManagedRulesCommonRuleSet",
            "Priority": 2,
            "Statement": {
              "ManagedRuleGroupStatement": {
                "VendorName": "AWS",
                "Name": "AWSManagedRulesCommonRuleSet"
              }
            },
            "OverrideAction": {
              "None": {}
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "CommonRuleSet"
            }
          },
          {
            "Name": "AWSManagedRulesSQLiRuleSet",
            "Priority": 3,
            "Statement": {
              "ManagedRuleGroupStatement": {
                "VendorName": "AWS",
                "Name": "AWSManagedRulesSQLiRuleSet"
              }
            },
            "OverrideAction": {
              "None": {}
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "SQLiRuleSet"
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WAFWebACL-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "WAFWebACLAssociation": {
      "Type": "AWS::WAFv2::WebACLAssociation",
      "DependsOn": "APIGatewayStage",
      "Properties": {
        "ResourceArn": {
          "Fn::Sub": "arn:aws:apigateway:${AWS::Region}::/restapis/${APIGatewayRestAPI}/stages/prod"
        },
        "WebACLArn": {
          "Fn::GetAtt": ["WAFWebACL", "Arn"]
        }
      }
    },
    "ConfigS3Bucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Retain",
      "UpdateReplacePolicy": "Retain",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "config-logs-${AWS::AccountId}-${EnvironmentSuffix}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              }
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "ConfigS3Bucket-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "ConfigS3BucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "ConfigS3Bucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AWSConfigBucketPermissionsCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "s3:GetBucketAcl",
              "Resource": {
                "Fn::GetAtt": ["ConfigS3Bucket", "Arn"]
              }
            },
            {
              "Sid": "AWSConfigBucketExistenceCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "s3:ListBucket",
              "Resource": {
                "Fn::GetAtt": ["ConfigS3Bucket", "Arn"]
              }
            },
            {
              "Sid": "AWSConfigBucketWrite",
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Sub": "${ConfigS3Bucket.Arn}/*"
              },
              "Condition": {
                "StringEquals": {
                  "s3:x-amz-acl": "bucket-owner-full-control"
                }
              }
            }
          ]
        }
      }
    },
    "ConfigRecorderRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
        ],
        "Policies": [
          {
            "PolicyName": "ConfigS3AccessPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["s3:GetBucketAcl", "s3:ListBucket"],
                  "Resource": {
                    "Fn::GetAtt": ["ConfigS3Bucket", "Arn"]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": "s3:PutObject",
                  "Resource": {
                    "Fn::Sub": "${ConfigS3Bucket.Arn}/*"
                  },
                  "Condition": {
                    "StringEquals": {
                      "s3:x-amz-acl": "bucket-owner-full-control"
                    }
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "ConfigRecorderRole-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "ConfigRecorder": {
      "Type": "AWS::Config::ConfigurationRecorder",
      "DependsOn": "ConfigS3BucketPolicy",
      "Properties": {
        "Name": {
          "Fn::Sub": "SecureWebAppConfigRecorder-${EnvironmentSuffix}"
        },
        "RoleARN": {
          "Fn::GetAtt": ["ConfigRecorderRole", "Arn"]
        },
        "RecordingGroup": {
          "AllSupported": true,
          "IncludeGlobalResourceTypes": false
        }
      }
    },
    "ConfigDeliveryChannel": {
      "Type": "AWS::Config::DeliveryChannel",
      "Properties": {
        "Name": {
          "Fn::Sub": "SecureWebAppConfigDeliveryChannel-${EnvironmentSuffix}"
        },
        "S3BucketName": {
          "Ref": "ConfigS3Bucket"
        },
        "ConfigSnapshotDeliveryProperties": {
          "DeliveryFrequency": "TwentyFour_Hours"
        }
      }
    },
    "S3BucketPublicReadProhibitedRule": {
      "Type": "AWS::Config::ConfigRule",
      "DependsOn": "ConfigRecorder",
      "Properties": {
        "ConfigRuleName": "s3-bucket-public-read-prohibited",
        "Description": "Checks that S3 buckets do not allow public read access",
        "Source": {
          "Owner": "AWS",
          "SourceIdentifier": "S3_BUCKET_PUBLIC_READ_PROHIBITED"
        },
        "Scope": {
          "ComplianceResourceTypes": ["AWS::S3::Bucket"]
        }
      }
    },
    "S3BucketServerSideEncryptionEnabledRule": {
      "Type": "AWS::Config::ConfigRule",
      "DependsOn": "ConfigRecorder",
      "Properties": {
        "ConfigRuleName": "s3-bucket-server-side-encryption-enabled",
        "Description": "Checks that S3 buckets have server-side encryption enabled",
        "Source": {
          "Owner": "AWS",
          "SourceIdentifier": "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
        },
        "Scope": {
          "ComplianceResourceTypes": ["AWS::S3::Bucket"]
        }
      }
    },
    "EC2InstancesInVPCRule": {
      "Type": "AWS::Config::ConfigRule",
      "DependsOn": "ConfigRecorder",
      "Properties": {
        "ConfigRuleName": "ec2-instances-in-vpc",
        "Description": "Checks whether EC2 instances are in a VPC",
        "Source": {
          "Owner": "AWS",
          "SourceIdentifier": "INSTANCES_IN_VPC"
        },
        "Scope": {
          "ComplianceResourceTypes": ["AWS::EC2::Instance"]
        }
      }
    },
    "RestrictedSSHRule": {
      "Type": "AWS::Config::ConfigRule",
      "DependsOn": "ConfigRecorder",
      "Properties": {
        "ConfigRuleName": "restricted-ssh",
        "Description": "Checks whether security groups disallow unrestricted SSH traffic",
        "Source": {
          "Owner": "AWS",
          "SourceIdentifier": "INCOMING_SSH_DISABLED"
        },
        "Scope": {
          "ComplianceResourceTypes": ["AWS::EC2::SecurityGroup"]
        }
      }
    },
    "VPCFlowLogRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "vpc-flow-logs.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "CloudWatchLogPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "VPCFlowLogRole-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "VPCFlowLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/vpc/${EnvironmentSuffix}-${AWS::StackName}"
        },
        "RetentionInDays": 30
      }
    },
    "VPCFlowLog": {
      "Type": "AWS::EC2::FlowLog",
      "Properties": {
        "DeliverLogsPermissionArn": {
          "Fn::GetAtt": ["VPCFlowLogRole", "Arn"]
        },
        "LogDestinationType": "cloud-watch-logs",
        "LogGroupName": {
          "Ref": "VPCFlowLogGroup"
        },
        "ResourceId": {
          "Ref": "VPC"
        },
        "ResourceType": "VPC",
        "TrafficType": "ALL",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "VPCFlowLog-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApp"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": {
        "Ref": "VPC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VPCId"
        }
      }
    },
    "PublicSubnet1Id": {
      "Description": "Public Subnet 1 ID",
      "Value": {
        "Ref": "PublicSubnet1"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PublicSubnet1Id"
        }
      }
    },
    "PublicSubnet2Id": {
      "Description": "Public Subnet 2 ID",
      "Value": {
        "Ref": "PublicSubnet2"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PublicSubnet2Id"
        }
      }
    },
    "PrivateSubnet1Id": {
      "Description": "Private Subnet 1 ID",
      "Value": {
        "Ref": "PrivateSubnet1"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateSubnet1Id"
        }
      }
    },
    "PrivateSubnet2Id": {
      "Description": "Private Subnet 2 ID",
      "Value": {
        "Ref": "PrivateSubnet2"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateSubnet2Id"
        }
      }
    },
    "DatabaseSubnet1Id": {
      "Description": "Database Subnet 1 ID",
      "Value": {
        "Ref": "DatabaseSubnet1"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DatabaseSubnet1Id"
        }
      }
    },
    "DatabaseSubnet2Id": {
      "Description": "Database Subnet 2 ID",
      "Value": {
        "Ref": "DatabaseSubnet2"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DatabaseSubnet2Id"
        }
      }
    },
    "ApplicationS3BucketName": {
      "Description": "Name of the S3 bucket for application data",
      "Value": {
        "Ref": "ApplicationS3Bucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ApplicationS3BucketName"
        }
      }
    },
    "ApplicationS3BucketArn": {
      "Description": "ARN of the S3 bucket for application data",
      "Value": {
        "Fn::GetAtt": ["ApplicationS3Bucket", "Arn"]
      }
    },
    "LoadBalancerDNSName": {
      "Description": "DNS name of the Application Load Balancer",
      "Value": {
        "Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LoadBalancerDNSName"
        }
      }
    },
    "LoadBalancerArn": {
      "Description": "ARN of the Application Load Balancer",
      "Value": {
        "Ref": "ApplicationLoadBalancer"
      }
    },
    "APIGatewayURL": {
      "Description": "URL of the API Gateway in prod stage",
      "Value": {
        "Fn::Sub": "https://${APIGatewayRestAPI}.execute-api.${AWS::Region}.amazonaws.com/prod/api"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-APIGatewayURL"
        }
      }
    },
    "APIGatewayId": {
      "Description": "ID of the API Gateway REST API",
      "Value": {
        "Ref": "APIGatewayRestAPI"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-APIGatewayId"
        }
      }
    },
    "CloudTrailName": {
      "Description": "Name of the CloudTrail trail",
      "Value": {
        "Ref": "CloudTrail"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-CloudTrailName"
        }
      }
    },
    "KMSKeyId": {
      "Description": "ID of the KMS key for encryption",
      "Value": {
        "Ref": "KMSKey"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-KMSKeyId"
        }
      }
    },
    "KMSKeyArn": {
      "Description": "ARN of the KMS key",
      "Value": {
        "Fn::GetAtt": ["KMSKey", "Arn"]
      }
    },
    "WAFWebACLArn": {
      "Description": "ARN of the WAF Web ACL",
      "Value": {
        "Fn::GetAtt": ["WAFWebACL", "Arn"]
      }
    },
    "NATGateway1Id": {
      "Description": "NAT Gateway 1 ID",
      "Value": {
        "Ref": "NatGateway1"
      }
    },
    "NATGateway2Id": {
      "Description": "NAT Gateway 2 ID",
      "Value": {
        "Ref": "NatGateway2"
      }
    },
    "StackName": {
      "Description": "Name of this CloudFormation stack",
      "Value": {
        "Ref": "AWS::StackName"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-StackName"
        }
      }
    },
    "EnvironmentSuffix": {
      "Description": "Environment suffix used for this deployment",
      "Value": {
        "Ref": "EnvironmentSuffix"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EnvironmentSuffix"
        }
      }
    },
    "VPCFlowLogsLogGroup": {
      "Description": "Name of the VPC Flow Logs CloudWatch Log Group",
      "Value": {
        "Ref": "VPCFlowLogGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VPCFlowLogsLogGroup"
        }
      }
    },
    "APIGatewayLogGroup": {
      "Description": "Name of the API Gateway CloudWatch Log Group",
      "Value": {
        "Ref": "APIGatewayLogGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-APIGatewayLogGroup"
        }
      }
    }
  }
}
```

## Key Features

### Security

The template implements comprehensive security through defense-in-depth architecture across all infrastructure layers. Network security is enforced through three-tier VPC architecture with public, private, and database subnets providing network segmentation, dual NAT Gateways enabling outbound internet access from private subnets while preventing inbound connections, and security groups implementing least privilege network access where LoadBalancerSecurityGroup allows internet traffic on HTTP/HTTPS, WebServerSecurityGroup allows traffic only from the load balancer and restricted SSH, AppServerSecurityGroup allows traffic only from web servers, and DatabaseSecurityGroup allows traffic only from application servers creating defense in depth. Encryption is implemented at rest using customer-managed KMS keys with automatic key rotation for ApplicationS3Bucket, AWS-managed encryption for logging buckets, and encrypted EBS volumes for EC2 instances, and in transit through ApplicationS3BucketPolicy enforcing HTTPS via explicit deny when aws:SecureTransport is false, Application Load Balancer HTTPS listener capability (HTTP shown in template but easily upgraded to HTTPS), and IMDSv2 requirement for EC2 metadata preventing SSRF attacks. IAM roles follow strict least privilege with WebServerRole granted only CloudWatch Logs write permissions, S3 GetObject on the specific application bucket, and KMS Decrypt on the specific key, ConfigRecorderRole granted only permissions to write Config snapshots, and VPCFlowLogRole granted only permissions to write VPC flow logs. API Gateway implements request validation rejecting malformed requests through RequestValidator, rate limiting preventing denial of service through WAF RateLimitRule, and protection against OWASP Top 10 through AWS-managed rule sets AWSManagedRulesCommonRuleSet and AWSManagedRulesSQLiRuleSet. Comprehensive audit trails are maintained through CloudTrail logging all AWS API calls to encrypted S3 bucket with log file validation, AWS Config recording resource configurations and evaluating compliance rules, and VPC Flow Logs capturing all network traffic to CloudWatch Logs. All S3 buckets block public access through PublicAccessBlockConfiguration preventing accidental exposure. SSH access is restricted to specific IP addresses through SSHAllowedCIDR parameter (defaulting to documentation CIDR requiring explicit change) and can be completely disabled by leaving KeyPairName empty. Systems Manager Session Manager provides secure shell access without SSH keys through AmazonSSMManagedInstanceCore managed policy. This multi-layer security architecture protects against unauthorized access through network segmentation and security groups, data breaches through encryption at rest and in transit, web application attacks through WAF protection, and compliance violations through comprehensive audit logging and Config rules.

### Scalability

The architecture provides automatic horizontal scaling and capacity management for the web tier while remaining cost-effective for application and database tiers. Auto Scaling enables the web tier to automatically scale from 2 to 4 instances based on demand with scaling metrics including CPU utilization, request count per target, or custom CloudWatch metrics. Auto Scaling responds to increased load by launching additional instances in minutes and scales down during low traffic periods to reduce costs. The Application Load Balancer automatically distributes traffic across all healthy instances with connection-level load balancing and support for thousands of concurrent connections without capacity planning. Future enhancements would include Target Tracking Scaling Policies automatically adjusting desired capacity to maintain target metrics like 70% CPU utilization or 1000 requests per target. The VPC design with /16 CIDR provides 65,536 IP addresses supporting substantial growth with /24 subnets providing 251 usable IPs per subnet sufficient for large instance counts. S3 buckets automatically scale to handle any storage capacity and request rate without configuration or capacity planning. API Gateway automatically handles traffic spikes with built-in rate limiting and throttling configurable per stage. Application and database tiers currently use manual scaling appropriate for most web applications but can be enhanced with Auto Scaling Groups for application servers deployed in private subnets and Amazon RDS Multi-AZ deployments in database subnets providing managed database scaling. CloudWatch Logs automatically scales to handle log ingestion from any number of sources. Load balancer target groups support hundreds of targets enabling horizontal scaling well beyond the initial 2-4 instance design. All outputs are exported for cross-stack references through Export declarations enabling this infrastructure to serve as a foundation for additional stacks handling different application components. This scalability architecture eliminates capacity planning for the web tier through Auto Scaling automatically adjusting capacity based on demand, supports growth through ample IP address space and S3 unlimited storage, enables performance optimization through load balancing distributing traffic across instances, and provides foundation for future enhancements through parameterized instance types and exported outputs.

### Operational Excellence

The template achieves operational excellence through infrastructure as code with comprehensive parameterization, validation, monitoring, and documentation. Parameters include AllowedPattern validation for CIDR blocks ensuring valid network configurations preventing deployment failures from invalid inputs, AllowedValues for InstanceType constraining to t3.micro, t3.small, and t3.medium preventing accidental deployment of expensive instance types, AllowedPattern for EnvironmentSuffix restricting to alphanumeric characters supporting environment naming conventions, and default values for all parameters enabling quick deployment for testing while allowing customization for production. CloudFormation Interface metadata organizes parameters into logical groups (Environment Configuration, Network Configuration, EC2 Configuration) with descriptive labels improving AWS Console user experience and reducing deployment errors. The HasKeyPair condition demonstrates conditional resource properties enabling SSH access only when KeyPairName is provided implementing flexible security controls. Comprehensive tagging across all resources with five consistent tags (Name using Fn::Sub incorporating EnvironmentSuffix, Environment, Project set to SecureWebApp, Owner set to SecurityTeam, and CostCenter set to Security) enables cost allocation tracking through AWS Cost Explorer, compliance auditing through tag-based reporting, automated operations through tag-based resource selection, and resource organization improving operational visibility. CloudWatch logging provides troubleshooting capabilities through VPC Flow Logs for network connectivity issues, API Gateway access logs for API debugging, and future application logs as the infrastructure expands. CloudTrail provides complete audit trails supporting security investigations and change tracking. AWS Config rules provide automated compliance monitoring with continuous evaluation marking resources as compliant or non-compliant. Future operational enhancements would include CloudWatch alarms for proactive monitoring, AWS Systems Manager State Manager for automated patching, and AWS Backup for automated backup scheduling. The infrastructure as code approach enables version control tracking all infrastructure changes, peer review through pull request workflows, automated testing through CloudFormation validation, and reproducible deployments eliminating configuration drift. Exported outputs enable cross-stack references with 13 exports including VPCId, subnet IDs, S3 bucket names, load balancer DNS name, API Gateway URL, and KMS key ID supporting infrastructure composition and disaster recovery where dependent stacks reference this foundational infrastructure. This operational excellence architecture provides rapid deployment through parameterized templates with sensible defaults, reduced errors through input validation and CloudFormation Interface, comprehensive visibility through logging and tagging, automated compliance through Config rules, and maintainability through infrastructure as code supporting long-term operations.

### Cost Optimization

The architecture balances cost optimization with security and availability requirements through careful resource selection and lifecycle policies. EC2 instances default to t3.micro providing burstable performance at low cost suitable for most web applications with AllowedValues limiting selection to cost-effective t3 family instances. Auto Scaling automatically adjusts capacity with MinSize of 2 ensuring high availability while DesiredCapacity of 2 and MaxSize of 4 limiting maximum cost exposure during traffic spikes. Instances automatically scale down during low traffic periods reducing costs. The single Application Load Balancer serves all traffic eliminating per-instance public IP costs and providing centralized traffic management. Dual NAT Gateways provide high availability but represent significant monthly costs ($32.40 per NAT Gateway per month plus data processing charges) appropriate for production but can be reduced to single NAT Gateway for development environments accepting lower availability. S3 storage is cost-optimized through intelligent tiering options (not currently configured but easily added), lifecycle policies on LoggingS3Bucket deleting logs after 90 days, lifecycle policies on CloudTrailBucket deleting logs after 365 days, and KMS BucketKeyEnabled reducing KMS API calls by 99% lowering encryption costs significantly. CloudWatch Logs retention is limited to 30 days for VPC Flow Logs and API Gateway logs balancing compliance requirements with storage costs as CloudWatch Logs charges $0.50 per GB ingested and $0.03 per GB per month storage. EBS volumes use gp3 volume type providing better price/performance than gp2 with 20GB size balancing operating system and application requirements with cost. Comprehensive tagging with Environment, Project, Owner, and CostCenter enables detailed cost allocation through AWS Cost Explorer with tag-based cost reports showing expenses by environment for chargeback to development teams, by project for portfolio management, and by cost center for departmental budgeting. AWS Cost Anomaly Detection can alert on unusual spending patterns. Reserved Instance or Savings Plan purchases for EC2 instances provide up to 72% savings for predictable workloads committed for 1-3 years. Future cost optimizations include Auto Scaling based on schedule reducing capacity during known low-traffic periods, S3 Intelligent-Tiering automatically moving infrequently accessed objects to cheaper storage tiers, CloudWatch Logs export to S3 for long-term retention at lower cost, and RDS Reserved Instances for database tier when implemented. The template provides cost-effective defaults while enabling customization for higher performance through parameterized instance types and maintaining production-ready availability through multi-AZ deployment. This cost optimization architecture minimizes infrastructure costs through right-sized resources and lifecycle policies while maintaining security through encryption and comprehensive logging, enabling financial visibility through comprehensive tagging, and supporting cost reduction through Auto Scaling automatic capacity adjustment.

### Reliability

The architecture achieves high reliability through AWS-managed services, multi-AZ deployment, automatic failover, and self-healing capabilities. Network reliability is provided through dual NAT Gateways in separate availability zones ensuring outbound connectivity survives single AZ failure with independent Elastic IPs and independent routing tables (PrivateRouteTable1 routing through NatGateway1 and PrivateRouteTable2 routing through NatGateway2). The Internet Gateway provides built-in redundancy as a horizontally scaled, redundant, and highly available VPC component managed by AWS. Compute reliability is implemented through Auto Scaling Group spanning both availability zones with instances automatically distributed across PublicSubnet1 and PublicSubnet2 ensuring application survives instance failures and single AZ failures. Auto Scaling maintains desired capacity of 2 instances with automatic replacement of unhealthy instances detected through ELB health checks with 300-second grace period and 30-second health check interval. The Application Load Balancer provides built-in high availability as a fully managed service with automatic distribution across both availability zones and automatic traffic routing away from unhealthy instances marked by 3 consecutive failed health checks. Load balancer nodes are automatically replaced by AWS if failures occur. Storage reliability is provided by S3 with 99.999999999% durability through automatic replication across multiple facilities and 99.99% availability with automatic failover between storage nodes. Versioning enabled on ApplicationS3Bucket protects against accidental deletions enabling point-in-time recovery. EBS volumes attached to EC2 instances provide automatic replication within their availability zone with 99.8-99.9% annual failure rate and snapshot capabilities for backup. CloudTrail, AWS Config, and CloudWatch Logs all use highly available AWS-managed services with built-in redundancy and replication. Self-healing capabilities include Auto Scaling automatically replacing failed instances within minutes without manual intervention, Application Load Balancer automatically removing unhealthy targets from rotation ensuring traffic only flows to healthy instances, and AWS automatically replacing underlying hardware failures for managed services. The architecture implements health checks at multiple levels with ELB health checks monitoring instance HTTP responses every 30 seconds, Auto Scaling responding to health check failures by terminating and replacing instances, and future application-level health checks validating application functionality beyond simple HTTP response. Failure scenarios are handled gracefully with single instance failure isolated by load balancer health checks and replaced by Auto Scaling within 5-10 minutes maintaining reduced capacity until replacement completes, single AZ failure survived through multi-AZ deployment with remaining instances handling traffic and Auto Scaling launching replacements in healthy AZ, and regional failure requiring disaster recovery procedures using CloudFormation templates to recreate infrastructure in alternate region with S3 cross-region replication providing data recovery. This reliability architecture ensures the application remains available during common failure scenarios through multi-AZ deployment and automatic failover, recovers quickly from failures through Auto Scaling automatic instance replacement, minimizes impact through load balancer health checks isolating failures, and supports disaster recovery through infrastructure as code and data durability.

## Modern AWS Practices

### Multi-AZ High Availability with Dual NAT Gateways

The infrastructure implements true high availability for outbound internet connectivity through dual NAT Gateways deployed in separate availability zones rather than the common cost-optimization pattern of a single NAT Gateway. NatGateway1 is deployed in PublicSubnet1 (availability zone 1) with dedicated NatGateway1EIP elastic IP, while NatGateway2 is deployed in PublicSubnet2 (availability zone 2) with dedicated NatGateway2EIP. Each private subnet routes to its local NAT Gateway with PrivateRouteTable1 directing PrivateSubnet1 traffic through NatGateway1 and PrivateRouteTable2 directing PrivateSubnet2 traffic through NatGateway2 ensuring AZ-local routing. This design provides several critical benefits including high availability where failure of one NAT Gateway or its availability zone does not impact instances in the other AZ which retain outbound internet connectivity, reduced latency through same-AZ routing avoiding cross-AZ data transfer, improved bandwidth as each NAT Gateway provides up to 45 Gbps of bandwidth supporting high-throughput workloads, and compliance with AWS Well-Architected Framework reliability pillar guidance to deploy redundant NAT Gateways. The trade-off is increased cost with two NAT Gateways at $0.045 per hour each ($32.40 per month each) plus data processing charges of $0.045 per GB processed, totaling approximately $65 per month plus data transfer compared to single NAT Gateway at approximately $33 per month plus data transfer. This cost is justified for production workloads where losing outbound internet connectivity would prevent instances from accessing external APIs, downloading software updates, or communicating with AWS services without VPC endpoints. For development or test environments, the template could be modified to use a single NAT Gateway by removing NatGateway2 and routing both private subnets through NatGateway1 accepting the single point of failure. The dual NAT Gateway architecture demonstrates commitment to high availability and AWS best practices for production workloads requiring maximum uptime.

### Customer-Managed KMS Keys with Automatic Rotation

The infrastructure uses customer-managed KMS keys rather than AWS-managed keys for S3 encryption, providing enhanced security, centralized key management, and compliance benefits. The KMSKey resource creates a customer-managed key with comprehensive key policy granting root account full permissions for key administration and explicitly allowing S3, CloudWatch Logs, and CloudTrail services to use the key through service principal permissions with kms:Decrypt and kms:GenerateDataKey actions. Automatic key rotation is enabled through EnableKeyRotation set to true, causing AWS to automatically rotate the key material annually while maintaining the same key ID and alias, ensuring encrypted data remains accessible without application changes or data re-encryption. Customer-managed keys provide several advantages over AWS-managed keys (default S3 encryption) including granular access control through key policies defining which IAM principals and services can use the key, comprehensive audit trails through CloudTrail logging every usage of the key for Encrypt, Decrypt, and GenerateDataKey operations supporting compliance and forensic investigations, cross-region replication control enabling encryption of replicated objects in destination region, and integration with AWS services where some services like CloudTrail and CloudWatch Logs require customer-managed keys for encryption. The KMSKeyAlias provides a friendly name (alias/secure-webapp-${EnvironmentSuffix}) following AWS naming conventions (alias/ prefix) enabling key identification across environments without remembering key IDs and supporting key rotation by updating the alias to point to a new key. ApplicationS3Bucket uses the customer-managed key through SSEAlgorithm: aws:kms and KMSMasterKeyID referencing the key ARN. BucketKeyEnabled reduces KMS API calls by up to 99% through S3 bucket keys that generate data keys locally rather than calling KMS for every object operation, significantly reducing costs while maintaining security. Typical S3 encryption without bucket keys makes one KMS API call per object PUT/GET at $0.03 per 10,000 requests, while bucket keys reduce this to one call per bucket per day. The customer-managed key costs $1 per month per key plus $0.03 per 10,000 API requests, offset by bucket key savings and justified by enhanced security controls. This KMS architecture provides enterprise-grade encryption key management with automatic rotation eliminating manual key rotation procedures, detailed audit trails supporting compliance with PCI DSS, HIPAA, and other regulations requiring encryption and key management visibility, and cost optimization through bucket keys while maintaining centralized security controls.

### S3 Bucket Policy Enforcing HTTPS

The ApplicationS3BucketPolicy explicitly enforces HTTPS for all data transfers through a conditional deny statement implementing encryption in transit as required by security best practices and compliance frameworks. The policy uses a Condition element checking aws:SecureTransport with value false to identify unencrypted HTTP requests and Effect: Deny to reject them, ensuring all S3 access occurs over encrypted TLS connections. The policy applies to both bucket-level operations (ListBucket, GetBucketLocation) through the bucket ARN and object-level operations (GetObject, PutObject, DeleteObject) through Fn::Sub: ${ApplicationS3Bucket.Arn}/_ covering all possible operations. Principal: "_" with Deny effect means this restriction applies to all identities including the root account and cannot be overridden by allow policies, providing strong enforcement. This approach prevents several security risks including man-in-the-middle attacks where unencrypted HTTP traffic can be intercepted and read by network attackers, credentials exposure where AWS signatures in HTTP requests can be captured, and compliance violations where regulations like PCI DSS 4.0, HIPAA, and SOC 2 require encryption in transit. The explicit deny approach is preferred over relying on HTTPS-only S3 endpoints because it enforces the policy at the bucket level preventing accidental unencrypted access through SDK misconfigurations, AWS CLI --no-verify-ssl flag, or legacy applications not configured for HTTPS. The policy complements S3 bucket encryption at rest through KMS providing comprehensive data protection with encryption at rest protecting stored data and encryption in transit protecting data during transfer. This security control is automatically evaluated by AWS Config's s3-bucket-ssl-requests-only rule (not currently included but easily added) marking buckets compliant or non-compliant. S3 access logs captured in LoggingS3Bucket include the signature version and TLS version enabling verification that all access uses HTTPS and modern TLS versions. This HTTPS enforcement demonstrates security best practices for protecting sensitive data in transit and ensures compliance with regulatory requirements mandating encrypted data transfers.

### AWS WAF with Managed Rule Groups and Rate Limiting

AWS WAF provides Layer 7 web application firewall protection through comprehensive managed rule groups and rate-based rules protecting against common web exploits, OWASP Top 10 vulnerabilities, and abuse. The WAFWebACL is scoped as REGIONAL matching the API Gateway deployment and implements DefaultAction: Allow with specific Block rules rather than DefaultAction: Block with specific Allow rules, following AWS recommendations for managed rule groups. Three security rules protect the API with prioritized evaluation. The RateLimitRule with priority 1 implements rate limiting using RateBasedStatement with Limit of 2000 requests per 5 minutes aggregated by IP address through AggregateKeyType: IP, blocking sources exceeding this threshold with Action: Block for the remainder of the 5-minute window. Rate limiting prevents denial of service attacks by limiting requests from single IP addresses, brute force attacks against authentication endpoints, web scraping and content theft, and API abuse from misbehaving clients or bots. The 2000 requests per 5 minutes limit (approximately 6-7 requests per second) balances security with legitimate high-traffic users and can be adjusted based on actual traffic patterns. The AWSManagedRulesCommonRuleSet with priority 2 applies AWS-managed rules protecting against OWASP Top 10 vulnerabilities with regularly updated signatures covering cross-site scripting (XSS) detection in query strings and request bodies, local file inclusion and path traversal attempts, SQL injection patterns, command injection attempts, and other common attack vectors. AWS Security Automation team continuously updates these rules based on emerging threats eliminating the need for manual rule maintenance. OverrideAction: None means the rule group's individual rule actions (Block or Count) are respected rather than being overridden. The AWSManagedRulesSQLiRuleSet with priority 3 provides specialized SQL injection protection with 28 rules detecting SQL injection attempts in various request components including query strings, headers, body content, and URI paths. This rule group complements the Common Rule Set with more extensive SQL injection coverage. All rules include VisibilityConfig enabling SampledRequestsEnabled for viewing sample requests matching rules, CloudWatchMetricsEnabled for operational metrics, and MetricName for unique metric identification supporting CloudWatch dashboards and alarms. The WAFWebACLAssociation attaches the Web ACL to the API Gateway prod stage using the stage ARN format arn:aws:apigateway:${AWS::Region}::/restapis/${APIGatewayRestAPI}/stages/prod ensuring all API requests are inspected before reaching the backend. WAF can also protect the Application Load Balancer (not currently associated but easily added) by creating a second association with the load balancer ARN providing defense in depth with protection at both load balancer and API Gateway layers. This WAF architecture provides comprehensive Layer 7 protection eliminating the need for third-party web application firewalls or security appliances, automated threat intelligence through AWS-managed rule groups updated continuously, cost-effective pricing at $5 per month per Web ACL plus $1 per month per rule plus $0.60 per million requests, and flexibility to add custom rules for application-specific threats.

### API Gateway Request Validation

API Gateway implements comprehensive request validation before forwarding requests to backend systems, reducing Lambda invocations from malformed requests and improving security, cost efficiency, and performance. The APIGatewayRequestValidator resource with ValidateRequestBody: true and ValidateRequestParameters: true enables validation of request parameters (query strings, headers, path parameters) and request body content against schemas defined in API Gateway request models. Request validation occurs at the API Gateway layer before backend invocation with API Gateway automatically rejecting invalid requests with HTTP 400 Bad Request responses including detailed error messages describing validation failures without consuming backend resources. This approach provides several critical benefits including reduced attack surface by preventing malicious or malformed payloads from reaching application code where input validation bugs could lead to vulnerabilities, improved cost efficiency by avoiding Lambda invocations for invalid requests (Lambda charges per invocation at $0.20 per million requests), faster error responses to clients by validating at the edge within milliseconds rather than waiting for backend processing, and better API documentation through OpenAPI schemas defining request structure. The APIGatewayMethod associates the validator through RequestValidatorId ensuring the /api GET endpoint validates requests. For production APIs, request models would be defined using JSON Schema specifying required fields, data types, string patterns, and numeric ranges with API Gateway evaluating requests against these schemas. Request validation complements WAF protection where WAF blocks malicious requests based on attack patterns and signatures while request validation rejects requests not conforming to API specifications even if benign. The combination provides defense in depth with WAF blocking known attack patterns, request validation blocking invalid API usage, and backend code implementing business logic validation. The APIGatewayStage deploys to the prod stage with comprehensive logging configuration. AccessLogSetting directs logs to APIGatewayLogGroup using format string capturing request context including $context.requestId for request tracing, $context.requestTime for timestamp, $context.httpMethod and $context.resourcePath for request identification, and $context.status for response codes. MethodSettings enables INFO-level logging providing detailed execution logs including request and response headers, DataTraceEnabled capturing full request and response bodies useful for debugging but should be disabled in production to prevent logging sensitive data, and MetricsEnabled publishing CloudWatch metrics for API performance monitoring. API Gateway logs support troubleshooting through request IDs correlating client requests with backend logs, security analysis identifying suspicious request patterns, usage tracking understanding API consumption by clients, and performance analysis identifying high-latency requests. This request validation architecture demonstrates API Gateway best practices for input validation, comprehensive logging for operations and security, and defense in depth with validation occurring before backend processing.

### CloudTrail Multi-Region Trail with Log File Validation

CloudTrail provides comprehensive audit trails of all AWS API calls across the account with advanced features including multi-region logging and cryptographic log file validation. The trail is configured with IsMultiRegionTrail set to false (single region deployment in us-west-1) but IncludeGlobalServiceEvents set to true ensuring capture of global service events including IAM policy changes, user creation, role assumption, CloudFront distributions, Route 53 DNS changes, and AWS Organizations account management which are not region-specific and must be logged by one trail. This configuration provides complete audit coverage of account activity with single S3 bucket simplifying log analysis and reducing storage costs. EnableLogFileValidation set to true enables CloudTrail to create digital signatures for log files using SHA-256 hashing and sign them with private key, generating digest files every hour containing hash values for all log files delivered in that hour. Log file validation provides cryptographic proof that logs have not been modified, deleted, or forged after CloudTrail delivered them supporting forensic investigations requiring proof of log integrity, compliance audits requiring tamper-evident logs, and security incident response validating that attack evidence has not been altered. AWS CLI command "aws cloudtrail validate-logs" validates log files by recalculating hashes and verifying signatures, reporting any modified or missing files. EventSelectors with ReadWriteType: All and IncludeManagementEvents: true logs both read operations (DescribeInstances, GetObject) and write operations (RunInstances, PutObject) providing complete visibility into account activity. Management events cover control plane operations on AWS resources while data events (not enabled by default) would cover data plane operations like S3 object-level API activity and Lambda function executions. The CloudTrailBucket stores logs with AES256 encryption sufficient for audit logs, lifecycle rule deleting logs after 365 days meeting HIPAA (6 years recommended but 1 year minimum), PCI DSS (1 year minimum), and SOC 2 requirements while managing storage costs, and Retain deletion policy preventing accidental log deletion during stack updates. The CloudTrailBucketPolicy grants CloudTrail service permissions with two statements: AWSCloudTrailAclCheck allowing s3:GetBucketAcl for CloudTrail to verify bucket permissions, and AWSCloudTrailWrite allowing s3:PutObject with condition requiring s3:x-amz-acl: bucket-owner-full-control ensuring the bucket owner maintains control over log files preventing CloudTrail service from modifying ACLs to hide logs. CloudTrail logs are delivered within 15 minutes of API calls with typical delivery in 5 minutes, stored as JSON files with one log file per account per region per time period enabling programmatic log analysis. Future enhancements would include CloudWatch Logs integration streaming CloudTrail events to CloudWatch Logs for real-time alerting on security-sensitive events like IAM policy changes, root account usage, or security group modifications, and SNS notifications for specific events like console sign-in failures or unauthorized API calls. This CloudTrail architecture provides comprehensive audit trails supporting compliance with regulatory requirements, tamper-evident logs through cryptographic validation, and complete visibility into account activity including global services and management events.

### VPC Flow Logs to CloudWatch Logs for Real-Time Analysis

VPC Flow Logs are configured to stream to CloudWatch Logs rather than S3, providing operational and security advantages for real-time analysis, faster troubleshooting, and automated alerting. The VPCFlowLog resource captures metadata about all network traffic traversing the VPC with TrafficType: ALL logging both accepted and rejected traffic, ResourceType: VPC capturing traffic for all ENIs in the VPC automatically including new instances as they launch, and LogDestinationType: cloud-watch-logs streaming logs to VPCFlowLogGroup with 30-day retention. Flow logs capture critical network metadata including source and destination IP addresses identifying traffic endpoints, source and destination ports identifying application protocols, protocol number identifying TCP (6), UDP (17), ICMP (1), packet and byte counts quantifying traffic volume, action (ACCEPT or REJECT) indicating whether security groups or NACLs allowed or denied traffic, and timestamps for traffic timing analysis. Streaming to CloudWatch Logs rather than S3 provides several critical advantages including real-time analysis where logs are available within 1-2 minutes compared to S3 delivery delays of 5-15 minutes, CloudWatch Logs Insights providing powerful query language for fast log analysis without downloading and parsing files, metric filters extracting custom metrics from log data and creating CloudWatch alarms for automated alerting, and integration with Lambda for real-time log processing. CloudWatch Logs Insights enables sophisticated queries for security analysis including identifying top talkers by source IP with queries counting connections and bytes by source IP, analyzing traffic by port and protocol identifying common application traffic and unusual ports, investigating security group rejections finding blocked traffic that may indicate misconfigurations or attacks, and detecting anomalous patterns like port scanning (multiple destination ports from single source), unusual outbound connections (instances communicating with unexpected external IPs), or traffic spikes (sudden increases in connection counts or byte volumes). Metric filters enable automated security alerting by creating CloudWatch metrics from log patterns with alarms triggering SNS notifications to security teams for conditions like SSH connections from unauthorized IPs, RDP connections indicating potential compromise, traffic to known malicious IPs using IP reputation lists, or security group rejections exceeding thresholds. The 30-day retention period balances troubleshooting needs with storage costs as CloudWatch Logs charges $0.50 per GB ingested and $0.03 per GB per month storage with typical VPC Flow Logs generating 5-10 GB per month for medium traffic volumes. For long-term retention, CloudWatch Logs supports export to S3 after initial analysis period reducing costs. The VPCFlowLogRole grants vpc-flow-logs.amazonaws.com service principal permissions to create log groups and streams and publish logs implementing secure service-to-service permissions without user credentials. Flow logs do not capture packet payloads or application-layer data but provide network-layer visibility sufficient for most security investigations while avoiding performance impact. This VPC Flow Logs architecture provides enhanced security visibility for real-time threat detection, troubleshooting support for diagnosing network connectivity issues like security group misconfigurations or routing problems, and compliance evidence documenting network access patterns for audit requirements.

### Three-Tier VPC Architecture with Database Subnet Isolation

The VPC implements a comprehensive three-tier architecture with public, private, and database subnets providing network segmentation and defense in depth beyond typical two-tier designs. The public tier consists of PublicSubnet1 and PublicSubnet2 hosting internet-facing resources including the Application Load Balancer with security groups allowing inbound HTTP/HTTPS from the internet and NAT Gateways providing outbound connectivity. Web servers are deployed in public subnets in this template but production architectures would move them to private subnets. The private tier consists of PrivateSubnet1 and PrivateSubnet2 hosting application servers with security groups allowing inbound traffic only from web tier and outbound internet access through NAT Gateways for software updates and external API calls. The database tier consists of DatabaseSubnet1 and DatabaseSubnet2 providing complete isolation for database resources with DatabaseRouteTable having no default route (no 0.0.0.0/0 entry) preventing any direct internet connectivity inbound or outbound. Database security groups allow inbound traffic only from application tier on database-specific ports (3306 for MySQL shown in template). This three-tier architecture provides several security benefits including defense in depth where compromise of web tier does not grant access to database tier requiring lateral movement through multiple tiers, network segmentation with routing tables enforcing traffic flow patterns and preventing unauthorized access paths, compliance alignment with PCI DSS requiring network segmentation between DMZ and cardholder data environment, and blast radius reduction where security breaches are contained within single tier. The database tier isolation is particularly critical as DatabaseSubnet1 and DatabaseSubnet2 have no NAT Gateway route preventing outbound connections even if an attacker compromises the database, the database cannot exfiltrate data directly to the internet or communicate with command and control servers. Application tier must act as intermediary for any external database management or updates. This design is appropriate for Amazon RDS which performs software updates through AWS-managed processes within the VPC and does not require internet access. For self-managed databases, the DatabaseRouteTable could be modified to route through NAT Gateway if outbound access is required for updates while maintaining inbound isolation. Future enhancements would include VPC endpoints for AWS services like S3, DynamoDB, and Systems Manager enabling private tier and database tier to access AWS services without NAT Gateway, reducing data transfer costs and improving security by keeping traffic within AWS network. The template also demonstrates subnet architecture best practices using /24 CIDR blocks for each subnet providing 251 usable IPs sufficient for most deployments, spreading subnets across two availability zones using Fn::Select and Fn::GetAZs automatically selecting available zones, and organizing CIDR blocks sequentially (1.0, 2.0, 3.0, etc.) improving IP address management. This three-tier VPC architecture demonstrates AWS security best practices for network segmentation and defense in depth protecting sensitive database resources through multiple layers of isolation.

### AWS Config Rules for Continuous Compliance Monitoring

AWS Config provides continuous compliance monitoring through Config Rules automatically evaluating resource configurations against best practices and compliance requirements. The ConfigRecorder is configured to record all supported resource types through AllSupported: true and IncludeGlobalResourceTypes: false (avoiding duplication with global resource recording in primary region) capturing configuration changes for EC2 instances, security groups, S3 buckets, IAM roles, and 250+ AWS resource types. Recording groups capture configuration snapshots every 24 hours through ConfigDeliveryChannel with DeliveryFrequency: TwentyFour_Hours providing point-in-time configuration baselines. Configuration history is stored in ConfigS3Bucket with encryption and Retain deletion policy preserving historical configurations for compliance audits and forensic investigations. Four AWS managed Config Rules enforce security best practices with automatic remediation guidance. S3BucketPublicReadProhibitedRule evaluates S3 buckets to detect public read access through bucket policies, ACLs, or public access block settings, marking buckets non-compliant if they allow public list or read operations, preventing accidental data exposure which is a common cause of security breaches. S3BucketServerSideEncryptionEnabledRule verifies S3 buckets have default encryption enabled through bucket encryption configuration, marking buckets non-compliant if they do not have SSE-S3, SSE-KMS, or SSE-C encryption configured, ensuring data at rest protection across all buckets. EC2InstancesInVPCRule checks whether EC2 instances are deployed in VPCs rather than EC2-Classic networking (deprecated by AWS), marking instances non-compliant if they use EC2-Classic, ensuring network-level security through VPC security groups and NACLs. RestrictedSSHRule detects security groups allowing unrestricted SSH access (0.0.0.0/0 or ::/0 on port 22), marking security groups non-compliant if they permit SSH from the internet, identifying security group misconfigurations that could enable unauthorized access. Config Rules evaluate resources on configuration changes (continuous monitoring) and periodically (every 24 hours for some rules) marking resources as compliant, non-compliant, or insufficient data. The AWS Config console displays compliance summaries showing percentage of compliant resources and lists of non-compliant resources with rule-specific remediation guidance. Config Rules support automated response through integration with Systems Manager Automation documents enabling auto-remediation where non-compliant resources are automatically fixed (e.g., removing public read access from S3 buckets or removing 0.0.0.0/0 SSH rules from security groups). SNS notifications can alert security teams when resources become non-compliant enabling rapid response. Compliance data is retained in S3 for historical analysis and audit reporting. Future enhancements would include additional managed rules like encrypted-volumes ensuring all EBS volumes have encryption enabled, iam-password-policy checking IAM password complexity requirements, required-tags verifying resources have mandatory tags, and custom rules using Lambda functions for organization-specific compliance requirements. Config Rules also support conformance packs packaging multiple related rules into compliance frameworks like PCI DSS, HIPAA, or CIS AWS Foundations Benchmark for comprehensive compliance monitoring. This Config Rules architecture provides continuous compliance monitoring eliminating manual configuration audits, automated detection of security misconfigurations within minutes of changes, compliance reporting for regulatory audits, and remediation guidance accelerating security issue resolution.

### Comprehensive Resource Tagging for Governance and Cost Allocation

All resources implement a comprehensive five-tag strategy enabling cost allocation, compliance reporting, automated operations, and resource organization. Tags are applied consistently across all 50+ resources in the template including VPC, subnets, security groups, EC2 instances through Auto Scaling, S3 buckets, IAM roles, CloudWatch log groups, and other resources. The Name tag uses Fn::Sub for dynamic generation incorporating EnvironmentSuffix and resource type (e.g., VPC-${EnvironmentSuffix}, PublicSubnet1-${EnvironmentSuffix}) enabling visual identification in AWS Console, CLI output, and third-party tools. The Environment tag references EnvironmentSuffix parameter enabling cost allocation reports by environment (dev, staging, prod) supporting chargeback models where each environment's costs are tracked separately, tag-based IAM policies restricting permissions based on environment (e.g., developers can manage dev resources but not prod), and resource lifecycle management like automated shutdown of dev environment instances outside business hours. The Project tag set to "SecureWebApp" enables cost allocation by project in multi-tenant AWS accounts where multiple projects share the same account, portfolio management tracking costs across projects, and project-based resource organization. The Owner tag set to "SecurityTeam" identifies responsible parties for operational issues, supports organizational cost allocation showing which teams consume resources, and enables contact information for incident response. The CostCenter tag set to "Security" enables financial reporting and chargeback to appropriate departments for internal accounting and budget management. This consistent tagging strategy enables several critical capabilities including cost allocation through AWS Cost Explorer reports filtering and grouping costs by any tag combination with detailed analysis like "show costs for Project=SecureWebApp and Environment=prod grouped by resource type," cost optimization through identification of untagged resources indicating shadow IT or ungoverned resource creation, tagging compliance through Config Rules verifying resources have required tags, and anomaly detection through alerts when resources without proper tags are created. Tag-based IAM policies implement attribute-based access control (ABAC) restricting permissions based on resource and principal tags with policies allowing operations only on resources matching the user's department tag, environment tag matching user's access level, or project tag matching user's project assignment. Automated operations use tags for resource targeting with Systems Manager targeting instances by tag for patching, Lambda functions selecting resources by tag for backup or lifecycle operations, and CloudWatch Events filtering resources by tag for monitoring. Auto Scaling Group uses PropagateAtLaunch: true for all tags ensuring instances launched by Auto Scaling automatically inherit tags enabling consistent tagging even as infrastructure scales. Future enhancements would include backup tags indicating backup schedule and retention, data classification tags marking resources as public, internal, confidential, or restricted, compliance tags indicating regulatory requirements (PCI, HIPAA, SOC2), and application tags identifying application components for dependency mapping. AWS Organizations supports tag policies enforcing tagging standards at organization level preventing resource creation without required tags. This comprehensive tagging strategy demonstrates governance best practices supporting financial management through detailed cost allocation, security management through access control and compliance monitoring, and operational management through automated targeting and resource organization.
