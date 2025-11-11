— Failure 1
Problem: ECS task container secrets used SSM parameter names instead of full SSM Parameter ARNs in the TaskDefinition `Secrets -> ValueFrom` fields. ECS requires the full SSM parameter ARN for referencing Parameter Store values in container secrets.
Solution: Updated all task definitions (`ApiTaskDefinition`, `WorkerTaskDefinition`, `SchedulerTaskDefinition`) to use full SSM parameter ARN format: `arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter${SSMParameterPrefix}/<name>`. (Fixed)
Affected area: ECS Task Definitions / Secrets

— Failure 2
Problem: Application AutoScaling `ScalableTarget` `ResourceId` used an invalid substitution referencing a nested attribute (e.g., `${ApiService.Name}`). CloudFormation `!Sub` cannot directly reference attributes via dot notation.
Solution: Replaced invalid substitutions with valid `!Sub` expressions resolving to `Ref` values (`service/${ECSCluster}/${ApiService}` and `service/${ECSCluster}/${WorkerService}`). Removed explicit `RoleARN` to allow default service-linked role usage. (Fixed)
Affected area: Application Auto Scaling (ScalableTarget)

— Failure 3
Problem: CloudWatch Dashboard JSON included invalid placeholder metric entries like `[ ".", "." ]`, causing validation errors.
Solution: Corrected the `DashboardBody` JSON to include valid metric definitions for API CPU, Worker CPU, and ALB TargetResponseTime with proper references. (Fixed)
Affected area: CloudWatch Dashboard

— Failure 4
Problem: ECS cluster creation failed with: “Invalid request provided: Unable to assume the service linked role.” This occurs if the ECS service-linked role doesn’t exist.
Solution: Added `AWS::IAM::ServiceLinkedRole` (`ECSServiceLinkedRole`) with `AWSServiceName: ecs.amazonaws.com` to ensure the role exists during stack creation. (Fixed)
Affected area: IAM / ECS Cluster Creation

— Failure 5
Problem: HTTPS Listener creation failed due to a placeholder ACM certificate ARN not existing in the target region/account.
Solution: Made HTTPS listener conditional—created only if a valid certificate ARN is provided. Added fallback to HTTP-only deployment when placeholder is used. Removed strict `DependsOn` between services and listeners to prevent dependency failure. (Fixed)
Affected area: Load Balancer / Listeners

— Failure 6
Problem: `DependsOn` attribute was incorrectly placed inside `Properties` for ECS services, causing CloudFormation validation error: “extraneous key [DependsOn] is not permitted.”
Solution: Moved `DependsOn` attributes (`ApiService`, `WorkerService`, `SchedulerService`) to the top level of each resource definition. (Fixed)
Affected area: CloudFormation Resource Schema / ECS Services

— Failure 7
Problem: ECS services failed ALB health checks during initialization, triggering the ECS deployment circuit breaker.
Solution: Increased `HealthCheckGracePeriodSeconds` across ECS services (`ApiService`: 300s, `WorkerService`: 300s, `SchedulerService`: 600s) and expanded ALB health check success codes to `200–399` to handle redirects. (Fixed)
Affected area: ECS Service / Deployment Stability

— Failure 8
Problem: CloudFormation attempted to deploy ECS services before the ECS cluster was fully registered, resulting in “Cluster not found” errors.
Solution: Added explicit `DependsOn: ECSCluster` to all ECS services to ensure proper creation order. (Fixed)
Affected area: CloudFormation Dependencies / ECS Cluster Lifecycle

— Failure 9
Problem: Placeholder `nginx` images listened on port 80 while target groups expected port 8080 and path `/health`, causing instant health check failures.
Solution: Standardized port mappings and target groups to port 80, updated ingress rules, and aligned health checks to `GET /`. (Fixed)
Affected area: Load Balancer Target Groups / ECS Task Definitions

— Failure 10
Problem: Application Auto Scaling failed to register `WorkerScalingTarget` due to incorrect `ResourceId` format (`service/<cluster>/<service-ARN>`).
Solution: Updated scaling targets to use `!GetAtt <Service>.Name`, generating valid format `service/<cluster-name>/<service-name>`. (Fixed)
Affected area: Application Auto Scaling / ResourceId Formatting

Summary

- Total issues: 10
- Severity breakdown (qualitative):
  - Critical: 3 (Failures 1, 4, 5)
  - High: 3 (Failures 7, 8, 9)
  - Medium: 3 (Failures 2, 6, 10)
  - Low: 1 (Failure 3)
  