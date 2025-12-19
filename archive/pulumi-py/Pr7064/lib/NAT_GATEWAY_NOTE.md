# NAT Gateway Configuration Note

## Current Status
The NAT Gateway and Elastic IP (EIP) resources are currently **commented out** in the VPC module due to AWS account quota limitations.

## Impact
Without a NAT Gateway:
- Resources in private subnets cannot access the internet
- ECS tasks in private subnets cannot pull Docker images from public registries
- Applications cannot make outbound API calls to external services

## Workarounds
1. **VPC Endpoints** (Implemented): S3 endpoint is configured to allow private subnet access to S3 without internet access
2. **Public Subnets**: For testing, ECS tasks can be deployed in public subnets with public IPs
3. **Private ECR**: Use AWS ECR for container images, accessible via VPC endpoints

## Enabling NAT Gateway
When AWS account EIP quota is increased, uncomment the following in `lib/vpc.py`:

```python
# Create Elastic IP
eip = aws.ec2.Eip(
    f"nat-eip-{environment_suffix}",
    domain="vpc",
    tags={**tags, "Name": f"nat-eip-{environment_suffix}"},
)

# Create NAT Gateway
nat_gateway = aws.ec2.NatGateway(
    f"nat-gateway-{environment_suffix}",
    subnet_id=public_subnets[0].id,
    allocation_id=eip.id,
    tags={**tags, "Name": f"nat-gateway-{environment_suffix}"},
)

# Add route from private subnets to NAT Gateway
private_route = aws.ec2.Route(
    f"private-route-{environment_suffix}",
    route_table_id=private_route_table.id,
    destination_cidr_block="0.0.0.0/0",
    nat_gateway_id=nat_gateway.id,
)
```

## Cost Considerations
- NAT Gateway: ~$0.045/hour + data processing charges
- Elastic IP: Free when attached to running instance, $0.005/hour when not in use
- Alternative: NAT Instance (t3.nano) can be more cost-effective for development environments