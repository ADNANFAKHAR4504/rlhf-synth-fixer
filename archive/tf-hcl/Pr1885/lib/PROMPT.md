# Build a Production Web App Infrastructure with Terraform

## The Challenge
You need to set up a web application infrastructure on AWS that can handle real traffic. The app processes user data and needs to stay up 24/7. Use Terraform to build this in us-east-1.

## What You Need to Build

### High Availability
- Deploy across 2+ availability zones for redundancy
- Use the default VPC to keep things simple

### Load Balancing
- Put an Application Load Balancer in front of your app
- Handle both HTTP and HTTPS traffic
- Set up health checks to remove bad instances

### Auto Scaling
- Make your app instances scale up/down based on CPU usage
- Set reasonable min/max instance limits

### Database
- Use RDS with multi-AZ enabled
- Turn on automatic backups (keep for 7 days)
- Lock down database access with security groups

### Security
- Create IAM roles that follow least privilege
- Use security groups to control network access
- Tag everything with "Environment: Production"

### Monitoring
- Set up CloudWatch for logs and metrics
- Create alarms for CPU, memory, and other key metrics

## Success Check
- Everything deploys without errors
- Load balancer distributes traffic
- Auto-scaling works when CPU changes
- Database is accessible from app instances
- Monitoring is working
- All resources are properly tagged
