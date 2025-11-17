# EKS Cluster for Transaction Processing Platform

## Platform and Language

Create infrastructure using **AWS CDK with TypeScript**.

## Background

A fintech startup needs to deploy a microservices architecture on AWS EKS to handle transaction processing workloads. The platform must support auto-scaling based on queue depth, provide secure network isolation between services, and enable zero-downtime deployments during market hours.

## Environment

Production EKS cluster deployment in us-east-1 region spanning 3 availability zones. Uses EKS 1.28 with managed node groups combining On-Demand and Spot instances. Requires CDK 2.x with TypeScript, kubectl 1.28+, and AWS CLI v2 configured. VPC with private subnets for worker nodes and public subnets for load balancers. NAT gateways provide outbound internet access. Integration with AWS Systems Manager for node access without SSH.

## Requirements

Create a CDK TypeScript program to deploy an EKS cluster for a transaction processing platform. The configuration must:

1. Create an EKS cluster version 1.28 with OIDC provider enabled for IRSA.
2. Configure two managed node groups: 'critical' with 2-4 t3.medium On-Demand instances and 'workers' with 3-10 t3.large Spot instances.
3. Deploy AWS Load Balancer Controller using EKS add-ons with proper IAM service account.
4. Create Fargate profile for kube-system and aws-load-balancer-controller namespaces.
5. Enable control plane logging for api, audit, authenticator, controllerManager, and scheduler.
6. Configure cluster autoscaler with IAM role and deploy it to the cluster.
7. Set up pod security standards at namespace level with baseline enforcement.
8. Create three application namespaces: payments, processing, and monitoring with appropriate labels.
9. Configure node group tags for cluster autoscaler discovery.
10. Output cluster endpoint, OIDC issuer URL, and kubectl configuration command.

## Expected Output

A fully functional EKS cluster with mixed compute options, automated scaling, and security controls ready for microservices deployment.

## Constraints

- EKS cluster must use managed node groups with Spot instances for cost optimization
- Implement IRSA (IAM Roles for Service Accounts) for pod-level AWS permissions
- Deploy AWS Load Balancer Controller as an EKS add-on for ingress management
- Configure OIDC identity provider for the EKS cluster
- Use Fargate profiles for system-critical workloads only
- Enable EKS control plane logging to CloudWatch for audit and diagnostic logs
- Implement pod security standards using EKS Pod Security Policy replacement
- Configure cluster autoscaler with proper IAM permissions and node group tags
