# AWS Infrastructure Deployment Challenge

## Objective
Build a production-ready, highly available AWS infrastructure using Terraform that can handle web application traffic with proper security and scalability.

## Infrastructure Requirements

### Network Architecture
- **VPC Design**: Create a VPC spanning multiple availability zones for redundancy
- **Subnet Strategy**: Deploy both public and private subnets across at least 2 AZs
- **Routing**: Configure proper internet connectivity for public resources while keeping private resources secure

### Load Balancing & Traffic Distribution
- **Application Load Balancer**: Deploy in public subnets to handle incoming web traffic
- **Health Monitoring**: Implement proper health checks for backend instances
- **Traffic Routing**: Distribute requests across multiple backend servers

### Compute Resources
- **Auto Scaling Group**: Deploy EC2 instances in private subnets for security
- **Instance Management**: Maintain minimum 2 instances for high availability
- **Scaling Policies**: Allow automatic scaling based on demand
- **IAM Integration**: Attach appropriate roles for secure AWS service access

### Database Layer
- **RDS Instance**: Deploy managed database in private subnets
- **Multi-AZ**: Enable high availability with automatic failover
- **Security**: Isolate database from direct internet access

### Security Implementation
- **Encryption**: Use AWS KMS customer-managed keys for all data at rest
- **Network Security**: Configure security groups with least privilege access
- **Access Control**: Implement proper IAM roles and policies

## Technical Constraints

- **Cloud Platform**: AWS only
- **Multi-AZ Deployment**: Required across minimum 2 availability zones
- **Network Isolation**: Public subnets for internet-facing resources, private for backend
- **Security**: All data must be encrypted, minimal port exposure
- **Scalability**: Auto-scaling capabilities for handling traffic variations

## Deliverables

1. **Complete Terraform Configuration**: Single main.tf file containing all infrastructure
2. **Resource Naming**: Use random suffixes to prevent naming conflicts
3. **Documentation**: Clear comments explaining resource purposes and configurations
4. **Deployment Ready**: Configuration must deploy successfully with `terraform apply`
5. **Production Standards**: Follow AWS best practices for security, reliability, and cost optimization

## Success Criteria

- Infrastructure deploys without errors
- All resources properly encrypted and secured
- High availability achieved through multi-AZ deployment
- Auto-scaling group maintains minimum instance count
- Load balancer successfully routes traffic to healthy instances
- Database accessible only from private subnets
- All resources properly tagged and documented