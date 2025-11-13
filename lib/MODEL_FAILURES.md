# Model Response Failures Analysis

The baseline model response did not provision a production-ready EKS foundation for the fintech payments
platform. It omitted critical security and operational requirements that would block deployment.

## Critical Failures

### 1. No private control plane or subnet scoping

**Impact Level:** Critical  
**MODEL_RESPONSE Issue:**  
Exposed the EKS API publicly and ignored the mandate to deploy control plane and nodes exclusively in
private subnets across three availability zones.  
**IDEAL_RESPONSE Fix:**  
Enforced `endpoint_private_access = true`, disabled public access, and reused the VPC plus private subnets
from SSM so the cluster anchors to tagged private subnets in all three AZs.  
**Root Cause:**  
Overlooked security isolation patterns for production EKS.  
**AWS Documentation Reference:**  
[EKS Best Practices – Networking](https://docs.aws.amazon.com/eks/latest/userguide/cluster-endpoint.html)  
**Cost/Security/Performance Impact:**  
Large attack surface for the control plane and compliance failure.

### 2. Missing IRSA, autoscaler IAM, and service account wiring

**Impact Level:** Critical  
**MODEL_RESPONSE Issue:**  
Did not create an OIDC provider, IRSA roles, or service accounts for workloads or the cluster autoscaler,
preventing least-privilege pod access and automated scaling.  
**IDEAL_RESPONSE Fix:**  
Provisioned the OIDC provider, IRSA roles with scoped policies covering ECR, Secrets Manager, and
autoscaling, then linked service accounts in Kubernetes with the required annotations.  
**Root Cause:**  
Ignored the requirement to enable IRSA for both application pods and autoscaler.  
**AWS Documentation Reference:**  
[IAM Roles for Service Accounts](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html)  
**Cost/Security/Performance Impact:**  
Autoscaler inoperable, pods forced to use node IAM role, violating least privilege.

### 3. No environment-aware tagging or resource naming discipline

**Impact Level:** High  
**MODEL_RESPONSE Issue:**  
Resources lacked the mandated `Environment=production`, `ManagedBy=terraform`, and environment suffix
tagging, risking conflicts across environments and failing audit tagging policy.  
**IDEAL_RESPONSE Fix:**  
Introduced shared locals to apply the required tags and suffix to every resource, including security groups,
IAM roles, launch templates, and outputs.  
**Root Cause:**  
Did not incorporate organisation tagging standards into the design.  
**AWS Documentation Reference:**  
[Resource Tagging Best Practices](https://docs.aws.amazon.com/whitepapers/latest/tagging-best-practices/tagging-best-practices.html)  
**Cost/Security/Performance Impact:**  
Operational confusion, broken automation filters, and compliance gaps.

### 4. Security groups allowed broad traffic

**Impact Level:** High  
**MODEL_RESPONSE Issue:**  
Permitted all egress and ingress on worker nodes, violating the directive to limit flows to required
Kubernetes ports.  
**IDEAL_RESPONSE Fix:**  
Restricted security group rules to API server, kubelet, DNS, and node-to-node traffic, while retaining
necessary HTTPS egress for AWS APIs.  
**Root Cause:**  
Defaulted to permissive networking instead of the requested tight isolation.  
**AWS Documentation Reference:**  
[Amazon EKS Security Groups](https://docs.aws.amazon.com/eks/latest/userguide/sec-group-reqs.html)  
**Cost/Security/Performance Impact:**  
Increases blast radius and jeopardises PCI-style segmentation.

### 5. Lacked outputs required by automation

**Impact Level:** Medium  
**MODEL_RESPONSE Issue:**  
Did not surface the cluster endpoint, CA bundle, OIDC issuer, or node group names needed by tests and
kubectl bootstrap.  
**IDEAL_RESPONSE Fix:**  
Added structured outputs for all integration entry points plus autoscaler and IRSA role ARNs.  
**Root Cause:**  
Failure to align Terraform outputs with downstream automation requirements.  
**AWS Documentation Reference:**  
[Configuring kubectl for Amazon EKS](https://docs.aws.amazon.com/eks/latest/userguide/create-kubeconfig.html)  
**Cost/Security/Performance Impact:**  
Breaks CI/CD post-deploy steps and manual access provisioning.

## Summary

- Total failures: 2 Critical, 2 High, 1 Medium, 0 Low  
- Primary knowledge gaps: EKS security hardening, IRSA/least-privilege IAM design, production tagging
  standards  
- Training value: Updating the model to recognise these gaps will materially improve security, compliance, and
  operability for future Terraform EKS solutions.
