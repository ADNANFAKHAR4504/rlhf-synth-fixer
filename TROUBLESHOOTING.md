# Troubleshooting Guide

## KMS Key "Incorrect State" Error

If you encounter the error: `Client.InvalidKMSKey.InvalidState: The KMS key provided is in an incorrect state`

This typically happens when:

1. **KMS key is pending deletion** from a previous failed deployment
2. **KMS key is disabled**
3. **KMS key permissions are incorrect**

### Solution 1: Check and Cancel Key Deletion

```bash
# List KMS keys for the cluster
aws kms list-keys --region us-east-1 | grep payments-platform-eks-prod

# Describe the key to check its state
aws kms describe-key --key-id <key-id-or-alias> --region us-east-1

# If the key is pending deletion, cancel it
aws kms cancel-key-deletion --key-id <key-id-or-alias> --region us-east-1
```

### Solution 2: Delete and Recreate the Key

If the key is in a bad state, you can delete it (after the deletion window expires) or use a different key name by changing the `cluster_name_prefix` or `environment_suffix` variables.

### Solution 3: Use Default AWS Managed Key (Temporary)

If you need to proceed quickly, you can temporarily remove the custom KMS key from the launch templates and use the default AWS managed key (`aws/ebs`). However, this is not recommended for production.

## Node Group Creation Failures

If node groups fail to create:

1. **Clean up failed node groups** using the provided script:
   ```bash
   ./scripts/cleanup-failed-nodegroups.sh payments-platform-eks-prod
   ```

2. **Check IAM role permissions** - Ensure the node group roles have the necessary permissions

3. **Verify subnet configuration** - Ensure subnets are properly tagged and in the correct availability zones

## Kubernetes Resources Not Deploying

If Kubernetes resources (deployments, services) are not being created:

1. **Check `manage_kubernetes_resources` variable** - Should be `true` by default
2. **Verify network access** - The Terraform runner must be able to access the private EKS endpoint
3. **Check cluster status** - Ensure the cluster is in `ACTIVE` state before creating Kubernetes resources

## Demo Application

The demo application includes:
- **Backend deployment**: `payments-backend-{suffix}` with HTTPd container
- **Frontend deployment**: `payments-frontend-{suffix}` with Nginx container
- **Services**: ClusterIP services for both frontend and backend
- **Namespace**: `payments-{suffix}` with pod security policies

To verify the application is running (after cluster is accessible):

```bash
kubectl get deployments -n payments-prod
kubectl get services -n payments-prod
kubectl get pods -n payments-prod
```

