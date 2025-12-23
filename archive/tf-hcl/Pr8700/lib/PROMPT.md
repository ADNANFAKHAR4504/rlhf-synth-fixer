Hey team,

Our trading platform is moving to containers and we need to set up an EKS cluster that runs everything on Fargate. The business wants to avoid managing EC2 instances entirely, so we're going all-in on serverless containers. I'm building this with Terraform using HCL.

Here's the setup: we need a VPC where the EKS control plane can talk to our Fargate pods, and those pods need to pull images from ECR and call AWS APIs. The pods will run in private subnets for security, but they need internet access through NAT gateways to pull container images and reach external services.

## What we need

Create a VPC in us-east-1 with public and private subnets across at least two availability zones. The public subnets get an internet gateway so NAT gateways deployed there can provide outbound connectivity. The private subnets are where our Fargate pods will run, and they route through the NAT gateways for internet access.

Set up the EKS cluster and configure it to use Fargate compute profiles exclusively. Create one Fargate profile for the kube-system namespace where Kubernetes system pods run, and another profile for our application workloads in the default namespace. The Fargate pod execution role needs permissions to pull images from ECR and write logs to CloudWatch.

The connectivity flow is: EKS Control Plane ↔ Fargate Pods in Private Subnets → NAT Gateways in Public Subnets → Internet Gateway → ECR for images and external APIs. Security groups control which pods can talk to the control plane and which services the pods can reach.

Configure security groups so the EKS control plane can communicate with the Fargate pods on the necessary ports, and allow the pods to reach the control plane API endpoint. The pods need outbound access to ECR for pulling images, to CloudWatch for logging, and to any external APIs the trading platform needs.

Set up IAM roles where the cluster role has the AmazonEKSClusterPolicy managed policy attached, and the Fargate pod execution role has AmazonEKSFargatePodExecutionRolePolicy. This lets the control plane manage resources and the pods execute with proper permissions.

Make all resource names include the environmentSuffix variable for uniqueness. Deploy to us-east-1. Everything needs to be fully destroyable without retain policies for CI/CD automation. Export the cluster endpoint, security group IDs, and other values as outputs.
