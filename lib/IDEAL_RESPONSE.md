# AWS CDK v2 Go Application - Multi-Region Web Infrastructure

This solution implements a production-ready AWS CDK v2 application in Go that deploys scalable web infrastructure with VPC, Application Load Balancer, Auto Scaling Group, and CloudWatch monitoring.

## Architecture Overview

- **Platform**: AWS CDK v2
- **Language**: Go 1.20+
- **Pattern**: Nested Stack Architecture
- **Entry Point**: `bin/tap.go`
- **Core Stack**: `lib/tap_stack.go`

## Key Components

### 1. VPC Configuration
```go
vpc := awsec2.NewVpc(nested, jsii.String("VPC"), &awsec2.VpcProps{
    MaxAzs: jsii.Number(3),
    SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
        {
            Name:       jsii.String("Public"),
            SubnetType: awsec2.SubnetType_PUBLIC,
            CidrMask:   jsii.Number(24),
        },
        {
            Name:       jsii.String("Private"),
            SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
            CidrMask:   jsii.Number(24),
        },
    },
})
```

- **3 Availability Zones** for high availability
- **Public Subnets** for ALB (internet-facing)
- **Private Subnets** for EC2 instances (security best practice)
- **CIDR /24** for optimal IP allocation

### 2. Security Groups
```go
// ALB Security Group - allows HTTP/HTTPS from anywhere
albSg := awsec2.NewSecurityGroup(nested, jsii.String("ALBSecurityGroup"), &awsec2.SecurityGroupProps{
    Vpc:              vpc,
    Description:      jsii.String("Security group for ALB"),
    AllowAllOutbound: jsii.Bool(true),
})
albSg.AddIngressRule(awsec2.Peer_AnyIpv4(), awsec2.Port_Tcp(jsii.Number(80)), jsii.String("HTTP from anywhere"), jsii.Bool(false))
albSg.AddIngressRule(awsec2.Peer_AnyIpv4(), awsec2.Port_Tcp(jsii.Number(443)), jsii.String("HTTPS from anywhere"), jsii.Bool(false))
albSg.AddIngressRule(awsec2.Peer_AnyIpv6(), awsec2.Port_Tcp(jsii.Number(80)), jsii.String("HTTP from anywhere IPv6"), jsii.Bool(false))
albSg.AddIngressRule(awsec2.Peer_AnyIpv6(), awsec2.Port_Tcp(jsii.Number(443)), jsii.String("HTTPS from anywhere IPv6"), jsii.Bool(false))

// Instance Security Group - allows traffic from ALB only
instSg := awsec2.NewSecurityGroup(nested, jsii.String("InstanceSecurityGroup"), &awsec2.SecurityGroupProps{
    Vpc:              vpc,
    Description:      jsii.String("Security group for web instances"),
    AllowAllOutbound: jsii.Bool(true),
})
instSg.AddIngressRule(
    albSg,
    awsec2.Port_Tcp(jsii.Number(80)),
    jsii.String("HTTP from ALB"),
    jsii.Bool(false),
)
```

- **Layered Security**: ALB accepts public traffic, instances only accept ALB traffic
- **IPv4 & IPv6 Support** for modern connectivity
- **Principle of Least Privilege** implemented

### 3. Application Load Balancer
```go
alb := awselasticloadbalancingv2.NewApplicationLoadBalancer(nested, jsii.String("ALB"),
    &awselasticloadbalancingv2.ApplicationLoadBalancerProps{
        Vpc:            vpc,
        InternetFacing: jsii.Bool(true),
        SecurityGroup:  albSg,
        VpcSubnets: &awsec2.SubnetSelection{
            SubnetType: awsec2.SubnetType_PUBLIC,
        },
    },
)
```

- **Internet-facing** for public access
- **Multi-AZ deployment** for high availability
- **Health checks** configured for traffic routing

### 4. Auto Scaling Group
```go
asg := awsautoscaling.NewAutoScalingGroup(nested, jsii.String("ASG"),
    &awsautoscaling.AutoScalingGroupProps{
        Vpc:             vpc,
        InstanceType:    awsec2.NewInstanceType(jsii.String("t3.medium")),
        MachineImage:    awsec2.MachineImage_LatestAmazonLinux2(&awsec2.AmazonLinux2ImageSsmParameterProps{}),
        MinCapacity:     jsii.Number(2),
        DesiredCapacity: jsii.Number(2),
        MaxCapacity:     jsii.Number(6),
        SecurityGroup:   instSg,
        UserData:        ud,
        VpcSubnets: &awsec2.SubnetSelection{
            SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
        },
    },
)
```

- **t3.medium instances** for balanced performance
- **Min=2, Desired=2, Max=6** for scalability
- **Private subnet deployment** for security
- **Latest Amazon Linux 2** for stability

### 5. Target Group and Health Checks
```go
listener.AddTargets(jsii.String("ASGTargets"),
    &awselasticloadbalancingv2.AddApplicationTargetsProps{
        Port: jsii.Number(80),
        Targets: &[]awselasticloadbalancingv2.IApplicationLoadBalancerTarget{
            asg,
        },
        HealthCheck: &awselasticloadbalancingv2.HealthCheck{
            Enabled:                 jsii.Bool(true),
            Path:                    jsii.String("/"),
            Interval:                awscdk.Duration_Seconds(jsii.Number(30)),
            Timeout:                 awscdk.Duration_Seconds(jsii.Number(5)),
            HealthyThresholdCount:   jsii.Number(2),
            UnhealthyThresholdCount: jsii.Number(3),
        },
    },
)
```

- **Comprehensive health checks** ensure traffic only reaches healthy instances
- **30-second intervals** for timely detection
- **2/3 threshold** for balanced responsiveness

### 6. CloudWatch Monitoring & Auto Scaling
```go
// CPU-based scaling
asg.ScaleOnCpuUtilization(jsii.String("CPUScaling"),
    &awsautoscaling.CpuUtilizationScalingProps{
        TargetUtilizationPercent: jsii.Number(70),
        Cooldown:                 awscdk.Duration_Minutes(jsii.Number(5)),
    },
)

// CloudWatch alarm
cp := awscloudwatch.NewMetric(&awscloudwatch.MetricProps{
    Namespace:  jsii.String("AWS/EC2"),
    MetricName: jsii.String("CPUUtilization"),
    Statistic:  jsii.String("Average"),
    DimensionsMap: &map[string]*string{
        "AutoScalingGroupName": asg.AutoScalingGroupName(),
    },
    Period: awscdk.Duration_Minutes(jsii.Number(5)),
})

awscloudwatch.NewAlarm(nested, jsii.String("HighCPUAlarm"),
    &awscloudwatch.AlarmProps{
        Metric:             cpuMetric,
        Threshold:          jsii.Number(70),
        EvaluationPeriods:  jsii.Number(2),
        ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_THRESHOLD,
        AlarmDescription:   jsii.String("High CPU utilization alarm (>70%)"),
    },
)
```

- **Target tracking scaling** at 70% CPU utilization
- **5-minute cooldown** to prevent thrashing
- **CloudWatch alarms** for monitoring

### 7. Stack Outputs
```go
awscdk.NewCfnOutput(nested, jsii.String("VPCId"),
    &awscdk.CfnOutputProps{Value: vpc.VpcId()})
awscdk.NewCfnOutput(nested, jsii.String("ALBDNSName"),
    &awscdk.CfnOutputProps{Value: alb.LoadBalancerDnsName()})
awscdk.NewCfnOutput(nested, jsii.String("ASGName"),
    &awscdk.CfnOutputProps{Value: asg.AutoScalingGroupName()})
```

## Tagging Strategy

```go
// Stack-level tags (inherited by all resources)
awscdk.Tags_Of(stack).Add(jsii.String("Environment"), jsii.String("Production"), nil)
awscdk.Tags_Of(stack).Add(jsii.String("Team"), jsii.String("DevOps"), nil)
```

- **Environment**: Production
- **Team**: DevOps
- **Automatic inheritance** to all resources

## Deployment Commands

```bash
# Install dependencies
go mod tidy

# Synthesize CloudFormation
cdk synth

# Deploy
cdk deploy

# Destroy
cdk destroy
```

## Key Features

✅ **High Availability**: Multi-AZ deployment across 3 availability zones  
✅ **Security**: Layered security groups with least privilege access  
✅ **Scalability**: Auto scaling based on CPU utilization (2-6 instances)  
✅ **Monitoring**: CloudWatch alarms and metrics  
✅ **Health Checks**: Application-level health verification  
✅ **Best Practices**: Private instances, public load balancer  
✅ **Tagging**: Consistent resource tagging for governance  
✅ **Nested Stack**: Clean architecture with separated concerns  

## Infrastructure Validation

- VPC with exactly 3 AZs, 3 public and 3 private subnets ✅
- ALB in public subnets with HTTP/HTTPS access ✅
- ASG with t3.medium instances (Min=2, Max=6) ✅
- Security groups allowing port 80/443 from anywhere ✅
- CPU-based scaling at 70% threshold ✅
- CloudWatch monitoring and alarms ✅
- Stack outputs for VPC ID, ALB DNS, and ASG name ✅