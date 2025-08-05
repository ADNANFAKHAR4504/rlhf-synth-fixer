# Model Failures - Task 291182

## Error 1: Missing Package Dependencies

- AI provided code without installation instructions
- Required packages: pulumi, pulumi-aws
- Error: "ModuleNotFoundError: No module named 'pulumi'"

## Error 2: Missing AWS Credentials Configuration

- AI didn't include AWS credential setup
- Error: "No valid credential sources found"
- Missing: AWS access key configuration or IAM role setup

## Error 3: Incorrect IPv6 CIDR Block Configuration

- AI used incorrect method for IPv6 subnet CIDR blocks
- Subnets need proper IPv6 CIDR derived from VPC CIDR
- Missing Egress-Only Internet Gateway for private IPv6 traffic

## Error 4: Incomplete Auto Scaling Configuration

- AI used deprecated LaunchConfiguration instead of LaunchTemplate
- Missing proper network interface configuration for IPv6
- Incorrect user data encoding
