Hey team,

We're helping a fintech crew move their containerized payments platform onto Amazon EKS while keeping things
production-grade and buttoned up. The AWS provider is already wired up in `lib/provider.tf`, so focus on the
cluster, compute, and security layers.

Here's what we're looking for:

- Deploy an EKS 1.28 control plane in `us-east-1` across private subnets in `us-east-1a`, `us-east-1b`, and
  `us-east-1c`. Pull the VPC ID from AWS Systems Manager Parameter Store so the config stays
  environment-agnostic.
- Stand up two managed node groups via launch templates. Frontend runs on `t3.medium` (min 2, max 6) and
  backend on `t3.large` (min 3, max 10). Each group should use gp3 100 GB volumes, enforce IMDSv2, and
  apply taints (`app=frontend:NoSchedule`, `app=backend:NoSchedule`).
- Enable IRSA, wire IAM roles so pods, node groups, and the cluster autoscaler can authenticate with ECR and
  other dependencies, and switch on API, audit, and authenticator control plane logging.
- Lock down security groups so traffic is limited to the ports Kubernetes actually needs, keeping
  node-to-node chatter inside the cluster and blocking everything else.
- Tag every resource with `Environment=production` and `ManagedBy=terraform`, and output the cluster
  endpoint, CA bundle, and OIDC issuer so kubectl can be configured cleanly.

Nice-to-haves (only if you have breathing room):

- Pre-wire an example namespace plus a service account that relies on IRSA.
- Add CloudWatch metric alarms around node scaling events.

Deliverables (drop them in `lib/` alongside `provider.tf`):

- `eks_cluster.tf`
- `node_groups.tf`
- `iam.tf`
- `autoscaler.tf`
- `network.tf`
- `outputs.tf`
