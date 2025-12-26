# EKS Cluster Security, Compliance, and Governance Infrastructure

## Objective
Create a CloudFormation template that provisions a secure, compliant, and well-governed Amazon EKS cluster with comprehensive security and governance controls.

## Requirements

### 1. EKS Cluster Configuration
- Create an EKS cluster with the latest stable Kubernetes version
- Configure cluster logging for control plane, covering audit, authenticator, and scheduler components
- Enable API server endpoint access with both public and private options
- Configure RBAC with default service account management

### 2. Security and Access Controls
- Implement OIDC Identity Provider for EKS with OpenID Connect
- Create IAM roles for cluster service accounts using IRSA for IAM Roles for Service Accounts
- Define Pod execution role with appropriate permissions
- Configure security groups with least-privilege ingress/egress rules
- Implement network policies and VPC configuration

### 3. Compliance and Governance
- Tag all resources with appropriate compliance labels such as Environment, Team, and CostCenter
- Enable CloudTrail logging for API calls
- Implement VPC Flow Logs for network traffic analysis
- Configure resource tagging strategy for cost allocation and compliance tracking
- Add organizational tags for governance

### 4. Monitoring and Observability
- Configure CloudWatch Logs groups for EKS control plane
- Set up CloudWatch metrics for cluster health
- Create CloudWatch alarms for critical events
- Enable Container Insights for monitoring at pod level

### 5. Infrastructure Components
- VPC with multiple availability zones
- Public and private subnets for high availability
- Internet Gateway and NAT Gateways
- Security groups for cluster and node communication
- IAM roles and policies for cluster operations

## Deliverables

The CloudFormation template must include:

1. **VPC Stack**: Complete networking infrastructure with proper segmentation
2. **IAM Stack**: Roles, policies, and OIDC provider configuration
3. **EKS Cluster**: With logging and endpoint configuration
4. **Security Configuration**: Security groups, NACLs, and policies
5. **Monitoring**: CloudWatch, CloudTrail, and VPC Flow Logs

## Constraints

- Use CloudFormation JSON format exclusively
- All resources must be tagged for compliance tracking
- Support multi-environment deployment across dev, staging, and prod
- Implement security best practices per AWS Security Reference Architecture
- Ensure least-privilege access across all IAM roles and policies
- Must support IRSA for service account authentication
- Enable cluster autoscaling through tagging and configuration

## Deployment Requirements - CRITICAL

1. **Naming Convention**: All resources must include an `environmentSuffix` parameter to ensure uniqueness across deployments. Use format: resource-type concatenated with environmentSuffix

2. **Destroyability**: All resources must use `DeletionPolicy: Delete` or no policy, which defaults to Delete. This is mandatory for test environments. DO NOT use `Retain` or `Snapshot` policies.

3. **Availability Zones**: Use `Fn::GetAZs` to dynamically select availability zones. Never hardcode AZ names like us-east-1a.

4. **Security Groups**: When using `IpProtocol: "-1"` for all protocols, do NOT include FromPort or ToPort fields. These are mutually exclusive.

5. **Dependencies**: Remove redundant `DependsOn` declarations when implicit dependencies exist through `Ref` or `Fn::GetAtt`. CloudFormation automatically handles these.

## AWS Services Required

- Amazon EKS
- Amazon EC2 for node groups
- Amazon VPC
- AWS IAM
- AWS CloudWatch
- AWS CloudTrail
- AWS Secrets Manager for optional certificate storage

## Expected JSON Structure

The template should follow AWS CloudFormation JSON format with:
- AWSTemplateFormatVersion
- Description
- Parameters for configuration flexibility
- All infrastructure components defined
- Outputs for cross-stack references

## Compliance Considerations

- Implement pod security policies
- Enable audit logging
- Enforce network policies
- Implement resource quotas
- Apply principle of least privilege throughout