I'll create a complete AWS CDK v2 app in Go that meets all your requirements. Here's the implementation:

## Project Structure

```
.
├── go.mod
├── go.sum
├── main.go
└── README.md
```

## go.mod

```go
module cdk-web-stacks

go 1.20

require (
    github.com/aws/aws-cdk-go/awscdk/v2 v2.100.0
    github.com/aws/constructs-go/constructs/v10 v10.3.0
    github.com/aws/jsii-runtime-go v1.90.0
)
```

## main.go

```go
package main

import (
    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsautoscaling"
    "github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatch"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awselasticloadbalancingv2"
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"
)

// WebStackProps defines the properties for our web stack
type WebStackProps struct {
    awscdk.StackProps
}

// NewWebStack creates a new web stack with VPC, ALB, and ASG
func NewWebStack(scope constructs.Construct, id string, props *WebStackProps) awscdk.Stack {
    var sprops awscdk.StackProps
    if props != nil {
        sprops = props.StackProps
    }

    // Create the stack
    stack := awscdk.NewStack(scope, &id, &sprops)

    // Apply tags at stack level
    awscdk.Tags_Of(stack).Add(jsii.String("Environment"), jsii.String("Production"), nil)
    awscdk.Tags_Of(stack).Add(jsii.String("Team"), jsii.String("DevOps"), nil)

    // Create VPC with 3 AZs, public and private subnets
    vpc := awsec2.NewVpc(stack, jsii.String("VPC"), &awsec2.VpcProps{
        MaxAzs: jsii.Number(3),
        SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
            {
                CidrMask:   jsii.Number(24),
                Name:       jsii.String("Public"),
                SubnetType: awsec2.SubnetType_PUBLIC,
            },
            {
                CidrMask:   jsii.Number(24),
                Name:       jsii.String("Private"),
                SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
            },
        },
    })

    // Create security group for ALB
    albSecurityGroup := awsec2.NewSecurityGroup(stack, jsii.String("ALBSecurityGroup"), &awsec2.SecurityGroupProps{
        Vpc:         vpc,
        Description: jsii.String("Security group for Application Load Balancer"),
        AllowAllOutbound: jsii.Bool(true),
    })

    // Allow inbound HTTP and HTTPS traffic from anywhere
    albSecurityGroup.AddIngressRule(
        awsec2.Peer_AnyIpv4(),
        awsec2.Port_Tcp(jsii.Number(80)),
        jsii.String("Allow HTTP traffic from anywhere"),
        jsii.Bool(false),
    )
    albSecurityGroup.AddIngressRule(
        awsec2.Peer_AnyIpv4(),
        awsec2.Port_Tcp(jsii.Number(443)),
        jsii.String("Allow HTTPS traffic from anywhere"),
        jsii.Bool(false),
    )
    albSecurityGroup.AddIngressRule(
        awsec2.Peer_AnyIpv6(),
        awsec2.Port_Tcp(jsii.Number(80)),
        jsii.String("Allow HTTP traffic from anywhere IPv6"),
        jsii.Bool(false),
    )
    albSecurityGroup.AddIngressRule(
        awsec2.Peer_AnyIpv6(),
        awsec2.Port_Tcp(jsii.Number(443)),
        jsii.String("Allow HTTPS traffic from anywhere IPv6"),
        jsii.Bool(false),
    )

    // Create Application Load Balancer
    alb := awselasticloadbalancingv2.NewApplicationLoadBalancer(stack, jsii.String("ALB"), &awselasticloadbalancingv2.ApplicationLoadBalancerProps{
        Vpc:            vpc,
        InternetFacing: jsii.Bool(true),
        SecurityGroup:  albSecurityGroup,
        VpcSubnets: &awsec2.SubnetSelection{
            SubnetType: awsec2.SubnetType_PUBLIC,
        },
    })

    // Create security group for EC2 instances
    instanceSecurityGroup := awsec2.NewSecurityGroup(stack, jsii.String("InstanceSecurityGroup"), &awsec2.SecurityGroupProps{
        Vpc:         vpc,
        Description: jsii.String("Security group for EC2 instances"),
        AllowAllOutbound: jsii.Bool(true),
    })

    // Allow inbound traffic from ALB security group
    instanceSecurityGroup.AddIngressRule(
        awsec2.Peer_SecurityGroupId(albSecurityGroup.SecurityGroupId()),
        awsec2.Port_Tcp(jsii.Number(80)),
        jsii.String("Allow HTTP traffic from ALB"),
        jsii.Bool(false),
    )

    // Create user data script for EC2 instances
    userData := awsec2.UserData_ForLinux(&awsec2.LinuxUserDataOptions{})
    userData.AddCommands(
        jsii.String("#!/bin/bash"),
        jsii.String("yum update -y"),
        jsii.String("yum install -y httpd"),
        jsii.String("systemctl start httpd"),
        jsii.String("systemctl enable httpd"),
        jsii.String("echo '<h1>Hello from $(hostname -f)</h1>' > /var/www/html/index.html"),
        jsii.String("echo '<p>Stack: "+id+"</p>' >> /var/www/html/index.html"),
    )

    // Create Auto Scaling Group
    asg := awsautoscaling.NewAutoScalingGroup(stack, jsii.String("ASG"), &awsautoscaling.AutoScalingGroupProps{
        Vpc: vpc,
        InstanceType: awsec2.NewInstanceType(jsii.String("t3.medium")),
        MachineImage: awsec2.MachineImage_LatestAmazonLinux2(&awsec2.AmazonLinux2ImageSsmParameterProps{
            Generation: awsec2.AmazonLinuxGeneration_AMAZON_LINUX_2,
        }),
        MinCapacity:   jsii.Number(2),
        DesiredCapacity: jsii.Number(2),
        MaxCapacity:   jsii.Number(6),
        SecurityGroup: instanceSecurityGroup,
        UserData:     userData,
        VpcSubnets: &awsec2.SubnetSelection{
            SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
        },
    })

    // Create target group and register ASG
    targetGroup := awselasticloadbalancingv2.NewApplicationTargetGroup(stack, jsii.String("TargetGroup"), &awselasticloadbalancingv2.ApplicationTargetGroupProps{
        Port:   jsii.Number(80),
        Vpc:    vpc,
        Protocol: awselasticloadbalancingv2.ApplicationProtocol_HTTP,
        TargetType: awselasticloadbalancingv2.TargetType_INSTANCE,
        HealthCheck: &awselasticloadbalancingv2.HealthCheck{
            Enabled:             jsii.Bool(true),
            HealthyHttpCodes:    jsii.String("200"),
            HealthyThresholdCount: jsii.Number(2),
            UnhealthyThresholdCount: jsii.Number(3),
            Timeout:             awscdk.Duration_Seconds(jsii.Number(5)),
            Interval:            awscdk.Duration_Seconds(jsii.Number(30)),
            Path:                jsii.String("/"),
            Protocol:            awselasticloadbalancingv2.Protocol_HTTP,
        },
    })

    // Attach ASG to target group
    asg.AttachToApplicationTargetGroup(targetGroup)

    // Create ALB listener
    awselasticloadbalancingv2.NewApplicationListener(stack, jsii.String("Listener"), &awselasticloadbalancingv2.ApplicationListenerProps{
        LoadBalancer: alb,
        Port:         jsii.Number(80),
        DefaultAction: awselasticloadbalancingv2.ListenerAction_Forward(&[]*awselasticloadbalancingv2.ApplicationTargetGroup{
            targetGroup,
        }, &awselasticloadbalancingv2.ForwardOptions{}),
    })

    // Create CPU-based scaling policy
    cpuScalingPolicy := asg.ScaleOnCpuUtilization(jsii.String("CPUScaling"), &awsautoscaling.CpuUtilizationScalingProps{
        TargetUtilizationPercent: jsii.Number(70),
        ScaleInCooldown:  awscdk.Duration_Minutes(jsii.Number(5)),
        ScaleOutCooldown: awscdk.Duration_Minutes(jsii.Number(5)),
    })

    // Create CloudWatch alarm for high CPU
    cpuAlarm := awscloudwatch.NewAlarm(stack, jsii.String("HighCPUAlarm"), &awscloudwatch.AlarmProps{
        Metric: asg.MetricCpuUtilization(&awscloudwatch.MetricOptions{
            Period: awscdk.Duration_Minutes(jsii.Number(5)),
        }),
        Threshold:         jsii.Number(70),
        EvaluationPeriods: jsii.Number(2),
        ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_THRESHOLD,
        AlarmDescription:  jsii.String("High CPU utilization alarm"),
    })

    // Stack outputs
    awscdk.NewCfnOutput(stack, jsii.String("VPCId"), &awscdk.CfnOutputProps{
        Value:       vpc.VpcId(),
        Description: jsii.String("VPC ID"),
        ExportName:  jsii.String(id + "-VPCId"),
    })

    awscdk.NewCfnOutput(stack, jsii.String("ALBDNSName"), &awscdk.CfnOutputProps{
        Value:       alb.LoadBalancerDnsName(),
        Description: jsii.String("Application Load Balancer DNS Name"),
        ExportName:  jsii.String(id + "-ALBDNSName"),
    })

    awscdk.NewCfnOutput(stack, jsii.String("ASGName"), &awscdk.CfnOutputProps{
        Value:       asg.AutoScalingGroupName(),
        Description: jsii.String("Auto Scaling Group Name"),
        ExportName:  jsii.String(id + "-ASGName"),
    })

    return stack
}

func main() {
    defer jsii.Close()

    app := awscdk.NewApp(nil)

    // Get default account from environment
    account := awscdk.Aws_ACCOUNT_ID()

    // Create US East 1 stack
    NewWebStack(app, "WebStackUSEast1", &WebStackProps{
        StackProps: awscdk.StackProps{
            Env: &awscdk.Environment{
                Account: account,
                Region:  jsii.String("us-east-1"),
            },
            Description: jsii.String("Web Stack deployed in US East 1"),
        },
    })

    // Create US West 2 stack
    NewWebStack(app, "WebStackUSWest2", &WebStackProps{
        StackProps: awscdk.StackProps{
            Env: &awscdk.Environment{
                Account: account,
                Region:  jsii.String("us-west-2"),
            },
            Description: jsii.String("Web Stack deployed in US West 2"),
        },
    })

    app.Synth(nil)
}
```

## Setup and Deployment Instructions

### 1. Initialize the project

```bash
# Create project directory
mkdir cdk-web-stacks
cd cdk-web-stacks

# Initialize Go module
go mod init cdk-web-stacks

# Create the main.go file (copy the code above)
# Create go.mod file (copy the content above)

# Download dependencies
go mod tidy
```

### 2. Install AWS CDK CLI (if not already installed)

```bash
npm install -g aws-cdk
```

### 3. Bootstrap CDK (if not already done)

```bash
# Bootstrap both regions
cdk bootstrap aws://ACCOUNT-NUMBER/us-east-1
cdk bootstrap aws://ACCOUNT-NUMBER/us-west-2
```

### 4. Deploy the stacks

```bash
# Synthesize CloudFormation templates
cdk synth

# Deploy both stacks
cdk deploy --all

# Or deploy individually
cdk deploy WebStackUSEast1
cdk deploy WebStackUSWest2
```

## Key Features Implemented

### 1. **Reusable Stack Design**
- `NewWebStack` function creates identical infrastructure
- Parameterized with region-specific properties
- Clean separation of concerns

### 2. **VPC Configuration**
- **MaxAzs = 3** ensures distribution across 3 availability zones
- **Public subnets** for ALB (internet-facing)
- **Private subnets** for EC2 instances (security best practice)

### 3. **Load Balancer & Health Checks**
- Application Load Balancer on port 80
- Comprehensive health checks with configurable thresholds
- Only routes traffic to healthy instances

### 4. **Auto Scaling Group**
- **t3.medium** instances as specified
- **Min=2, Desired=2, Max=6** capacity settings
- Automatically registers with ALB target group

### 5. **Security Groups**
- ALB security group allows HTTP/HTTPS from anywhere (IPv4 & IPv6)
- Instance security group only allows traffic from ALB
- Proper egress rules maintained

### 6. **Monitoring & Scaling**
- CPU-based target tracking scaling (70% threshold)
- CloudWatch alarm for monitoring
- Configurable cooldown periods

### 7. **Tags & Outputs**
- Stack-level tags inherited by all resources
- Exports VPC ID, ALB DNS name, and ASG name
- Cross-stack reference capability

### 8. **User Data Script**
- Installs and configures Apache web server
- Creates simple HTML page showing hostname and stack name
- Enables testing of load balancing

## Testing the Deployment

After deployment, you can test the infrastructure:

```bash
# Get ALB DNS names from outputs
aws cloudformation describe-stacks --stack-name WebStackUSEast1 --query 'Stacks[0].Outputs'
aws cloudformation describe-stacks --stack-name WebStackUSWest2 --query 'Stacks[0].Outputs'

# Test the load balancer endpoints
curl http://ALB-DNS-NAME-FROM-OUTPUT
```

## Cleanup

```bash
# Destroy both stacks
cdk destroy --all
```

This implementation provides a production-ready, scalable web infrastructure that can be deployed identically across multiple regions with proper monitoring, security, and high availability.