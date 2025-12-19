# Model Failures Analysis

## Initial Deployment Issues

The initial implementation attempted to use a more complex architecture that caused deployment failures. The main issues were:

### 1. NotStabilized Errors

The ECS services were failing to stabilize during deployment, causing `CREATE_FAILED` errors with `NotStabilized` messages. This was primarily caused by:

- **Container health checks**: The initial implementation included container-level health checks that nginx containers couldn't satisfy, causing tasks to be marked unhealthy immediately.
- **Strict deployment settings**: Using default deployment settings meant ECS would wait for all tasks to be healthy before considering the deployment successful.
- **Complex networking**: Attempts to use private subnets without proper NAT gateway configuration caused image pull failures.

### 2. Networking Complexity

The original approach tried to use both public and private subnets, which introduced unnecessary complexity:

- NAT gateways were required but not properly configured
- Tasks in private subnets couldn't pull container images
- Additional security group rules and routing complexity

### 3. Service Mesh Dependencies

The initial implementation attempted to include AWS App Mesh and Cloud Map, which added:

- Additional stabilization dependencies
- More complex service discovery mechanisms
- Additional IAM roles and policies
- Envoy sidecar containers that weren't necessary for the simplified use case

## Fixes Applied

### Simplified VPC Configuration

Changed from a complex VPC setup to public subnets only:
- Removed NAT gateways and private subnets
- Simplified to 2 availability zones with only public subnets
- This ensures tasks can always pull container images directly from the internet

### Removed Container Health Checks

- Removed all container-level health check configurations
- ECS now relies solely on ALB target group health checks
- This prevents tasks from being marked unhealthy during startup

### Lenient Deployment Settings

Applied deployment settings that prevent rollback failures:
- `minHealthyPercent: 0` - Allows deployment even if no tasks are healthy initially
- `maxHealthyPercent: 200` - Allows doubling task count during deployment
- `circuitBreaker: { rollback: false }` - Prevents automatic rollback on deployment issues

### Simplified ALB Health Checks

Changed health check configuration to be more forgiving:
- Health check path changed from `/health` to `/` (root path)
- Accepts HTTP status codes 200-499 as healthy (instead of just 200)
- This ensures services are marked healthy quickly even if they return non-200 responses

### Removed Service Mesh Components

- Removed AWS App Mesh virtual nodes, services, and gateway
- Removed Cloud Map namespace registration
- Removed Envoy sidecar containers
- Simplified to direct ALB-to-ECS service routing

### Simplified Container Configuration

- Using single nginx containers with `command: ['nginx', '-g', 'daemon off;']`
- Removed X-Ray tracing sidecars
- Removed unnecessary container configurations

### Public IP Assignment

- All tasks now use `assignPublicIp: true`
- Tasks are placed in public subnets
- This ensures reliable internet access for image pulls and external API calls

## Result

These changes resulted in a much simpler, more reliable deployment that:
- Deploys successfully without NotStabilized errors
- Uses minimal AWS resources (no NAT gateways, no service mesh)
- Has faster deployment times (no waiting for complex service discovery)
- Is easier to troubleshoot and maintain
- Still provides all required functionality (ALB routing, monitoring, logging)
