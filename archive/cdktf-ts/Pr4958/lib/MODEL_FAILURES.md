The model's code is fundamentally broken. It's not just a bad implementation; it's insecure and won't run. It seems to have been written by just copy-pasting resource blocks without understanding how they connect.

## Major Problems (Security & Will-Not-Run)

- **App Containers are on the Public Internet**
  This is the worst problem. The model's code puts the ECS tasks in public subnets (`primaryPublicSubnet1`, `primaryPublicSubnet2`) and gives them public IPs (`assignPublicIp: true`). The ideal response correctly puts them in private subnets, forcing all traffic to go through the load balancer. The model's way is a massive, critical security hole.

- **The Database Password is Wrong**
  The code will never connect to the database. It creates a secret in Secrets Manager with one hardcoded password (`Fn.base64encode(Fn.uuid())` on line 733) and then creates the RDS cluster with a _completely different_ hardcoded password (`Fn.base64encode(Fn.uuid())` on line 805). The application will fetch the secret, try to log in, and fail. The ideal response correctly generates _one_ password and reuses that variable for both the secret and the database.

- **No NAT Gateway (App Can't Start)**
  The model's code creates public subnets and private subnets, but it never creates a NAT Gateway. It also puts the ECS tasks in the public subnets. This is wrong in two ways:
  1.  The tasks are exposed (see point 1).
  2.  If the tasks _were_ in the private subnets (as they should be), they would have no way to access the internet to pull the container image (`nginx:latest`). The service would fail to start. The ideal response correctly creates a NAT Gateway and routes the private subnets' outbound traffic through it.

## Missed Requirements & Bad Design

- **Code is Copy-Pasted (Not DRY)**
  The model's code is a maintenance nightmare. It defines the entire VPC, all subnets, SGs, ALB, and ECS service for `us-east-1`, and then just copy-pastes the _entire_ block of hundreds of lines for `us-west-2`. The ideal response does this cleanly by writing _one_ function (`createRegionalInfra`) and just calling it twice.

- **Secret Rotation is Just Missing**
  The requirement for automatic secret rotation was completely ignored. The model creates a role for it (`secrets-rotation-role`) but never actually creates the Lambda function or the `SecretsmanagerSecretRotation` resource to _use_ the role. The ideal response correctly stubs all three resources.

- **Health Checks Will Fail**
  The model configures the ALB Target Group (`primary-tg`, line 926) and the container definition (`primaryTaskDefinition`, line 850) to poll a `/health` endpoint. But the container image it uses is `nginx:latest`, which **does not have a `/health` endpoint**. The health checks will fail 100% of the time, the service will never be "healthy," and Route 53 will just keep failing over.

- **Hardcoded Names and AZs**
  Everything is hardcoded. The VPC is named `primary-vpc`, the AZs are `us-east-1a`, `us-east-1b`, etc. This code will fail to deploy if you (or anyone in your AWS account) has a resource with that name or if AZ `us-east-1a` is constrained. The ideal response correctly uses a `randomSuffix` for all names and uses `DataAwsAvailabilityZones` to pick AZs dynamically.

- **IAM Roles are Way Too Permissive**
  The `ecsSecretsPolicy` (line 634) just uses `Resource: '*'` for Secrets Manager, KMS, and CloudWatch Logs. This violates "least privilege." The ideal response correctly scopes the policy to the specific ARN of the secret (`Resource: secretArn`).
