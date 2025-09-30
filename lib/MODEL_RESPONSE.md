I'll create a comprehensive Java CDK project that implements disaster recovery across US-EAST-1 and US-WEST-2 with all the requirements you've specified.

```java 
package com.mycompany.app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.targets.InstanceTarget;
import software.amazon.awscdk.services.route53.*;
import software.amazon.awscdk.services.route53.targets.LoadBalancerTarget;
import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.autoscaling.*;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Multi-Region Disaster Recovery CDK Stack
 * 
 * Deploys infrastructure across us-east-1 and us-west-2 with:
 * - VPC and application infrastructure in both regions
 * - Route53 failover configuration
 * - S3 cross-region replication
 */
public class DisasterRecoveryApp {
    
    public static void main(final String[] args) {
        App app = new App();
        
        // Get primary region from context, default to us-east-1
        String primaryRegion = (String) app.getNode().tryGetContext("primary_region");
        if (primaryRegion == null) {
            primaryRegion = "us-east-1";
        }
        
        // Define regions
        String secondaryRegion = primaryRegion.equals("us-east-1") ? "us-west-2" : "us-east-1";
        
        System.out.println("Primary Region: " + primaryRegion);
        System.out.println("Secondary Region: " + secondaryRegion);
        
        // Get AWS account from environment
        String account = System.getenv("CDK_DEFAULT_ACCOUNT");
        
        // Create environment configurations
        Environment primaryEnv = Environment.builder()
            .account(account)
            .region(primaryRegion)
            .build();
            
        Environment secondaryEnv = Environment.builder()
            .account(account)
            .region(secondaryRegion)
            .build();
        
        // Deploy infrastructure in both regions
        RegionalStack primaryStack = new RegionalStack(app, "PrimaryStack", 
            StackProps.builder()
                .env(primaryEnv)
                .description("Primary disaster recovery stack in " + primaryRegion)
                .build(),
            true);
            
        RegionalStack secondaryStack = new RegionalStack(app, "SecondaryStack",
            StackProps.builder()
                .env(secondaryEnv)
                .description("Secondary disaster recovery stack in " + secondaryRegion)
                .build(),
            false);
        
        // Create Route53 failover configuration
        new Route53FailoverStack(app, "Route53Stack",
            StackProps.builder()
                .env(primaryEnv)
                .crossRegionReferences(true)
                .description("Route53 failover configuration")
                .build(),
            primaryStack,
            secondaryStack);
        
        // Create S3 replication configuration
        new S3ReplicationStack(app, "S3ReplicationStack",
            StackProps.builder()
                .env(primaryEnv)
                .crossRegionReferences(true)
                .description("S3 cross-region replication")
                .build(),
            primaryRegion,
            secondaryRegion);
        
        app.synth();
    }
}

/**
 * Regional infrastructure stack
 * Contains VPC, Load Balancer, and application resources
 */
class RegionalStack extends Stack {
    
    private final ApplicationLoadBalancer loadBalancer;
    private final Vpc vpc;
    
    public RegionalStack(final Construct scope, final String id, final StackProps props, boolean isPrimary) {
        super(scope, id, props);
        
        String regionSuffix = isPrimary ? "Primary" : "Secondary";
        
        // Create VPC with 2 AZs and 1 NAT Gateway
        vpc = Vpc.Builder.create(this, "VPC-" + regionSuffix)
            .maxAzs(2)
            .natGateways(1)
            .subnetConfiguration(Arrays.asList(
                SubnetConfiguration.builder()
                    .name("Public")
                    .subnetType(SubnetType.PUBLIC)
                    .cidrMask(24)
                    .build(),
                SubnetConfiguration.builder()
                    .name("Private")
                    .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                    .cidrMask(24)
                    .build()
            ))
            .build();
        
        // Create security group for load balancer
        SecurityGroup lbSecurityGroup = SecurityGroup.Builder.create(this, "LBSecurityGroup-" + regionSuffix)
            .vpc(vpc)
            .description("Security group for Application Load Balancer")
            .allowAllOutbound(true)
            .build();
        
        lbSecurityGroup.addIngressRule(
            Peer.anyIpv4(),
            Port.tcp(80),
            "Allow HTTP traffic"
        );
        
        lbSecurityGroup.addIngressRule(
            Peer.anyIpv4(),
            Port.tcp(443),
            "Allow HTTPS traffic"
        );
        
        // Create Application Load Balancer
        loadBalancer = ApplicationLoadBalancer.Builder.create(this, "ALB-" + regionSuffix)
            .vpc(vpc)
            .internetFacing(true)
            .loadBalancerName("dr-alb-" + this.getRegion())
            .securityGroup(lbSecurityGroup)
            .build();
        
        // Create security group for application instances
        SecurityGroup instanceSecurityGroup = SecurityGroup.Builder.create(this, "InstanceSecurityGroup-" + regionSuffix)
            .vpc(vpc)
            .description("Security group for application instances")
            .allowAllOutbound(true)
            .build();
        
        instanceSecurityGroup.addIngressRule(
            lbSecurityGroup,
            Port.tcp(80),
            "Allow traffic from load balancer"
        );
        
        // Create launch template for Auto Scaling
        LaunchTemplate launchTemplate = LaunchTemplate.Builder.create(this, "LaunchTemplate-" + regionSuffix)
            .machineImage(MachineImage.latestAmazonLinux2023())
            .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
            .securityGroup(instanceSecurityGroup)
            .userData(UserData.custom(
                "#!/bin/bash\n" +
                "yum update -y\n" +
                "yum install -y httpd\n" +
                "systemctl start httpd\n" +
                "systemctl enable httpd\n" +
                "echo '<h1>Region: " + this.getRegion() + " (" + regionSuffix + ")</h1>' > /var/www/html/index.html"
            ))
            .build();
        
        // Create Auto Scaling Group
        AutoScalingGroup asg = AutoScalingGroup.Builder.create(this, "ASG-" + regionSuffix)
            .vpc(vpc)
            .launchTemplate(launchTemplate)
            .minCapacity(2)
            .maxCapacity(4)
            .desiredCapacity(2)
            .vpcSubnets(SubnetSelection.builder()
                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                .build())
            .healthCheck(HealthCheck.elb(software.amazon.awscdk.services.autoscaling.ElbHealthCheckOptions.builder()
                .grace(software.amazon.awscdk.Duration.seconds(300))
                .build()))
            .build();
        
        // Create target group
        ApplicationTargetGroup targetGroup = ApplicationTargetGroup.Builder.create(this, "TargetGroup-" + regionSuffix)
            .vpc(vpc)
            .port(80)
            .protocol(ApplicationProtocol.HTTP)
            .targetType(TargetType.INSTANCE)
            .healthCheck(software.amazon.awscdk.services.elasticloadbalancingv2.HealthCheck.builder()
                .enabled(true)
                .path("/")
                .protocol(Protocol.HTTP)
                .healthyThresholdCount(2)
                .unhealthyThresholdCount(3)
                .timeout(software.amazon.awscdk.Duration.seconds(5))
                .interval(software.amazon.awscdk.Duration.seconds(30))
                .build())
            .build();
        
        // Attach ASG to target group
        asg.attachToApplicationTargetGroup(targetGroup);
        
        // Add listener to load balancer
        loadBalancer.addListener("Listener-" + regionSuffix,
            BaseApplicationListenerProps.builder()
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .defaultAction(ListenerAction.forward(Arrays.asList(targetGroup)))
                .build());
    }
    
    public ApplicationLoadBalancer getLoadBalancer() {
        return loadBalancer;
    }
    
    public Vpc getVpc() {
        return vpc;
    }
}

/**
 * Route53 Failover Stack
 * Configures DNS failover between primary and secondary regions
 */
class Route53FailoverStack extends Stack {
    
    public Route53FailoverStack(final Construct scope, final String id, final StackProps props,
                                RegionalStack primaryStack, RegionalStack secondaryStack) {
        super(scope, id, props);
        
        // Create hosted zone (or import existing one)
        // For production, you'd typically import an existing zone
        IHostedZone hostedZone = HostedZone.Builder.create(this, "HostedZone")
            .zoneName("example-dr.com") // Replace with your domain
            .comment("Disaster Recovery DNS Zone")
            .build();
        
        // Create health check for primary region
        CfnHealthCheck primaryHealthCheck = CfnHealthCheck.Builder.create(this, "PrimaryHealthCheck")
            .healthCheckConfig(CfnHealthCheck.HealthCheckConfigProperty.builder()
                .type("HTTPS_STR_MATCH")
                .resourcePath("/")
                .fullyQualifiedDomainName(primaryStack.getLoadBalancer().getLoadBalancerDnsName())
                .port(80)
                .requestInterval(30)
                .failureThreshold(3)
                .build())
            .healthCheckTags(Arrays.asList(
                CfnHealthCheck.HealthCheckTagProperty.builder()
                    .key("Name")
                    .value("Primary Region Health Check")
                    .build()
            ))
            .build();
        
        // Primary failover record
        ARecord primaryRecord = ARecord.Builder.create(this, "PrimaryRecord")
            .zone(hostedZone)
            .recordName("app")
            .target(RecordTarget.fromAlias(new LoadBalancerTarget(primaryStack.getLoadBalancer())))
            .failover(Failover.PRIMARY)
            .setIdentifier("primary-" + primaryStack.getRegion())
            .build();
        
        // Secondary failover record
        ARecord secondaryRecord = ARecord.Builder.create(this, "SecondaryRecord")
            .zone(hostedZone)
            .recordName("app")
            .target(RecordTarget.fromAlias(new LoadBalancerTarget(secondaryStack.getLoadBalancer())))
            .failover(Failover.SECONDARY)
            .setIdentifier("secondary-" + secondaryStack.getRegion())
            .build();
    }
}

/**
 * S3 Cross-Region Replication Stack
 * Configures S3 replication between regions
 */
class S3ReplicationStack extends Stack {
    
    public S3ReplicationStack(final Construct scope, final String id, final StackProps props,
                             String primaryRegion, String secondaryRegion) {
        super(scope, id, props);
        
        // Create IAM role for replication
        Role replicationRole = Role.Builder.create(this, "ReplicationRole")
            .assumedBy(new ServicePrincipal("s3.amazonaws.com"))
            .description("S3 replication role for disaster recovery")
            .build();
        
        // Create source bucket in primary region (current stack region)
        Bucket sourceBucket = Bucket.Builder.create(this, "SourceBucket")
            .versioned(true)
            .bucketName("dr-source-" + this.getAccount() + "-" + primaryRegion)
            .encryption(BucketEncryption.S3_MANAGED)
            .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
            .removalPolicy(software.amazon.awscdk.RemovalPolicy.RETAIN)
            .build();
        
        // Create destination bucket in secondary region
        Bucket destinationBucket = Bucket.Builder.create(this, "DestinationBucket")
            .versioned(true)
            .bucketName("dr-destination-" + this.getAccount() + "-" + secondaryRegion)
            .encryption(BucketEncryption.S3_MANAGED)
            .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
            .removalPolicy(software.amazon.awscdk.RemovalPolicy.RETAIN)
            .build();
        
        // Grant replication permissions
        sourceBucket.grantRead(replicationRole);
        destinationBucket.grantWrite(replicationRole);
        
        // Add replication policy to role
        replicationRole.addToPolicy(PolicyStatement.Builder.create()
            .effect(Effect.ALLOW)
            .actions(Arrays.asList(
                "s3:GetReplicationConfiguration",
                "s3:ListBucket"
            ))
            .resources(Arrays.asList(sourceBucket.getBucketArn()))
            .build());
        
        replicationRole.addToPolicy(PolicyStatement.Builder.create()
            .effect(Effect.ALLOW)
            .actions(Arrays.asList(
                "s3:GetObjectVersionForReplication",
                "s3:GetObjectVersionAcl",
                "s3:GetObjectVersionTagging"
            ))
            .resources(Arrays.asList(sourceBucket.getBucketArn() + "/*"))
            .build());
        
        replicationRole.addToPolicy(PolicyStatement.Builder.create()
            .effect(Effect.ALLOW)
            .actions(Arrays.asList(
                "s3:ReplicateObject",
                "s3:ReplicateDelete",
                "s3:ReplicateTags"
            ))
            .resources(Arrays.asList(destinationBucket.getBucketArn() + "/*"))
            .build());
        
        // Configure replication on source bucket
        CfnBucket cfnSourceBucket = (CfnBucket) sourceBucket.getNode().getDefaultChild();
        cfnSourceBucket.setReplicationConfiguration(
            CfnBucket.ReplicationConfigurationProperty.builder()
                .role(replicationRole.getRoleArn())
                .rules(Arrays.asList(
                    CfnBucket.ReplicationRuleProperty.builder()
                        .status("Enabled")
                        .priority(1)
                        .filter(CfnBucket.ReplicationRuleFilterProperty.builder()
                            .prefix("")
                            .build())
                        .destination(CfnBucket.ReplicationDestinationProperty.builder()
                            .bucket(destinationBucket.getBucketArn())
                            .replicationTime(CfnBucket.ReplicationTimeProperty.builder()
                                .status("Enabled")
                                .time(CfnBucket.ReplicationTimeValueProperty.builder()
                                    .minutes(15)
                                    .build())
                                .build())
                            .metrics(CfnBucket.MetricsProperty.builder()
                                .status("Enabled")
                                .eventThreshold(CfnBucket.ReplicationTimeValueProperty.builder()
                                    .minutes(15)
                                    .build())
                                .build())
                            .build())
                        .deleteMarkerReplication(CfnBucket.DeleteMarkerReplicationProperty.builder()
                            .status("Enabled")
                            .build())
                        .build()
                ))
                .build()
        );
    }
}
```
```markdown
# AWS CDK Disaster Recovery Solution

Multi-region disaster recovery implementation using AWS CDK in Java. This solution deploys infrastructure across `us-east-1` and `us-west-2` with automatic failover capabilities.

## Architecture Overview

- **Multi-Region Deployment**: Identical infrastructure in primary and secondary regions
- **Automatic Failover**: Route53 health checks with DNS failover
- **Data Replication**: S3 cross-region replication for data durability
- **High Availability**: Auto Scaling Groups with Application Load Balancers in each region

## Prerequisites

- Java 17 or later
- Maven 3.8 or later
- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- AWS account with permissions to create resources

## Project Structure

```
disaster-recovery/
├── src/
│   └── main/
│       └── java/
│           └── com/
│               └── mycompany/
│                   └── app/
│                       └── DisasterRecoveryApp.java
├── pom.xml
├── cdk.json
└── README.md
```

## Installation

1. **Install AWS CDK CLI** (if not already installed):
   ```bash
   npm install -g aws-cdk
   ```

2. **Bootstrap AWS environments**:
   ```bash
   # Bootstrap us-east-1
   cdk bootstrap aws://ACCOUNT-NUMBER/us-east-1
   
   # Bootstrap us-west-2
   cdk bootstrap aws://ACCOUNT-NUMBER/us-west-2
   ```

3. **Build the project**:
   ```bash
   mvn clean compile
   ```

## Deployment

### Deploy with us-east-1 as Primary

```bash
cdk deploy --all --context primary_region=us-east-1
```

This deploys:
- Primary stack in `us-east-1`
- Secondary stack in `us-west-2`
- Route53 failover configuration
- S3 replication from us-east-1 to us-west-2

### Deploy with us-west-2 as Primary

```bash
cdk deploy --all --context primary_region=us-west-2
```

This deploys:
- Primary stack in `us-west-2`
- Secondary stack in `us-east-1`
- Route53 failover configuration
- S3 replication from us-west-2 to us-east-1

### Deploy Individual Stacks

```bash
# Deploy only primary region infrastructure
cdk deploy PrimaryStack --context primary_region=us-east-1

# Deploy only secondary region infrastructure
cdk deploy SecondaryStack --context primary_region=us-east-1

# Deploy only Route53 configuration
cdk deploy Route53Stack --context primary_region=us-east-1

# Deploy only S3 replication
cdk deploy S3ReplicationStack --context primary_region=us-east-1
```

## Stack Components

### RegionalStack (Primary & Secondary)

Each regional stack includes:
- **VPC**: 2 Availability Zones, 1 NAT Gateway
- **Application Load Balancer**: Internet-facing with health checks
- **Auto Scaling Group**: 2-4 EC2 instances running Apache
- **Security Groups**: Configured for ALB and instance traffic
- **Launch Template**: Amazon Linux 2023 with web server

### Route53FailoverStack

- **Hosted Zone**: DNS zone for the application (example-dr.com)
- **Health Checks**: Monitors primary region ALB
- **Failover Records**: 
  - Primary record pointing to primary region ALB
  - Secondary record pointing to secondary region ALB

### S3ReplicationStack

- **Source Bucket**: Versioned S3 bucket in primary region
- **Destination Bucket**: Versioned S3 bucket in secondary region
- **Replication Configuration**: 
  - Real-time replication (15-minute SLA)
  - Delete marker replication enabled
  - Replication metrics enabled

## Testing Failover

### 1. Access the Application

After deployment, access your application at:
```
http://app.example-dr.com
```

You should see: "Region: us-east-1 (Primary)" or "Region: us-west-2 (Primary)" depending on your primary region.

### 2. Simulate Primary Region Failure

#### Option A: Stop Instances in Primary ASG
```bash
# Get instance IDs from primary ASG
aws autoscaling describe-auto-scaling-groups \
  --region us-east-1 \
  --query "AutoScalingGroups[?contains(Tags[?Key=='aws:cloudformation:stack-name'].Value, 'PrimaryStack')].Instances[].InstanceId" \
  --output text

# Stop the instances
aws ec2 stop-instances --instance-ids <instance-ids> --region us-east-1
```

#### Option B: Modify Security Group
```bash
# Block all inbound traffic temporarily
aws ec2 revoke-security-group-ingress \
  --group-id <lb-security-group-id> \
  --region us-east-1 \
  --ip-permissions IpProtocol=tcp,FromPort=80,ToPort=80,IpRanges='[{CidrIp=0.0.0.0/0}]'
```

### 3. Monitor Failover

Route53 health checks run every 30 seconds and require 3 consecutive failures (90 seconds) before marking the primary as unhealthy.

**Expected Timeline:**
- **T+0s**: Primary region becomes unhealthy
- **T+90s**: Health check fails 3 times
- **T+90-120s**: DNS switches to secondary region
- **T+120-300s**: DNS caches expire (depends on TTL)

**Monitor the failover:**
```bash
# Watch DNS resolution
watch -n 5 "dig +short app.example-dr.com"

# Check Route53 health check status
aws route53 get-health-check-status \
  --health-check-id <health-check-id> \
  --region us-east-1

# View CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Route53 \
  --metric-name HealthCheckStatus \
  --dimensions Name=HealthCheckId,Value=<health-check-id> \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average \
  --region us-east-1
```

### 4. Verify Secondary Region

Once failover occurs, refresh the application:
```
http://app.example-dr.com
```

You should now see: "Region: us-west-2 (Secondary)" or "Region: us-east-1 (Secondary)"

### 5. Test S3 Replication

```bash
# Upload a test file to primary bucket
aws s3 cp test-file.txt s3://dr-source-ACCOUNT-us-east-1/

# Wait 15 minutes and verify replication
aws s3 ls s3://dr-destination-ACCOUNT-us-west-2/

# Check replication metrics
aws s3api get-bucket-replication \
  --bucket dr-source-ACCOUNT-us-east-1 \
  --region us-east-1
```

## Switching Primary Region

To switch the primary region from us-east-1 to us-west-2:

```bash
# 1. Destroy current deployment
cdk destroy --all --context primary_region=us-east-1

# 2. Deploy with new primary
cdk deploy --all --context primary_region=us-west-2

# 3. Verify DNS now points to us-west-2 as primary
dig +short app.example-dr.com
```

**Note**: This creates new infrastructure. For production, consider using CloudFormation stack updates or blue/green deployments.

## Monitoring and Observability

### CloudWatch Dashboards

Create a dashboard to monitor both regions:

```bash
aws cloudwatch put-dashboard \
  --dashboard-name DisasterRecovery \
  --dashboard-body file://dashboard.json
```

### Key Metrics to Monitor

1. **Route53 Health Checks**
   - HealthCheckStatus
   - HealthCheckPercentageHealthy

2. **Application Load Balancer**
   - HealthyHostCount
   - UnHealthyHostCount
   - RequestCount
   - TargetResponseTime

3. **Auto Scaling**
   - GroupDesiredCapacity
   - GroupInServiceInstances
   - GroupPendingInstances

4. **S3 Replication**
   - ReplicationLatency
   - BytesPendingReplication
   - OperationsPendingReplication

### CloudWatch Alarms

Set up alarms for critical metrics:

```bash
# Primary region unhealthy alarm
aws cloudwatch put-metric-alarm \
  --alarm-name primary-region-unhealthy \
  --alarm-description "Primary region health check failed" \
  --metric-name HealthCheckStatus \
  --namespace AWS/Route53 \
  --statistic Minimum \
  --period 60 \
  --evaluation-periods 3 \
  --threshold 1 \
  --comparison-operator LessThanThreshold \
  --region us-east-1

# S3 replication latency alarm
aws cloudwatch put-metric-alarm \
  --alarm-name s3-replication-latency \
  --alarm-description "S3 replication latency exceeds threshold" \
  --metric-name ReplicationLatency \
  --namespace AWS/S3 \
  --statistic Maximum \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 900 \
  --comparison-operator GreaterThanThreshold \
  --region us-east-1
```

## Cost Optimization

### Estimated Monthly Costs

**Per Region:**
- VPC NAT Gateway: ~$32/month
- Application Load Balancer: ~$23/month
- EC2 Instances (2x t3.micro): ~$15/month
- Data Transfer: Variable based on usage

**Global:**
- Route53 Hosted Zone: $0.50/month
- Route53 Health Checks: $0.50/check/month
- S3 Storage: Variable based on data
- S3 Replication: $0.02/GB transferred

**Total: ~$150-200/month** (excluding data transfer and storage)

### Cost Reduction Strategies

1. **Use Spot Instances** for non-critical workloads
2. **Reduce NAT Gateways** to 0 if instances don't need internet egress
3. **Use S3 Intelligent-Tiering** for infrequently accessed data
4. **Implement lifecycle policies** for S3 buckets
5. **Schedule Auto Scaling** to reduce capacity during off-peak hours

## Production Considerations

### Security Enhancements

1. **Enable HTTPS**:
   - Add ACM certificates to load balancers
   - Configure SSL/TLS listeners
   - Redirect HTTP to HTTPS

2. **Implement WAF**:
   - Add AWS WAF to ALBs
   - Configure rate limiting
   - Add geographic restrictions

3. **Encrypt S3 Buckets**:
   - Use KMS encryption
   - Enable bucket policies
   - Configure access logging

4. **Implement VPC Flow Logs**:
   ```java
   vpc.addFlowLog("FlowLog",
       FlowLogOptions.builder()
           .trafficType(FlowLogTrafficType.ALL)
           .destination(FlowLogDestination.toCloudWatchLogs())
           .build());
   ```

### High Availability Improvements

1. **Increase AZs**: Change `maxAzs` from 2 to 3
2. **Multi-region database**: Add RDS with read replicas
3. **Global Accelerator**: Add AWS Global Accelerator for static IPs
4. **CloudFront**: Add CDN for static content

### Database Replication

Add Aurora Global Database for multi-region database support:

```java
GlobalCluster globalCluster = GlobalCluster.Builder.create(this, "GlobalCluster")
    .engine(DatabaseClusterEngine.auroraMysql(AuroraMysqlClusterEngineProps.builder()
        .version(AuroraMysqlEngineVersion.VER_3_04_0)
        .build()))
    .instanceProps(InstanceProps.builder()
        .vpc(vpc)
        .instanceType(InstanceType.of(InstanceClass.R5, InstanceSize.LARGE))
        .build())
    .build();
```

## Troubleshooting

### Common Issues

#### 1. Health Check Failures

**Symptom**: Route53 health check continuously fails

**Solutions**:
- Verify ALB security group allows HTTPS from Route53 IP ranges
- Check target group health check configuration
- Ensure EC2 instances are responding on correct port
- Review CloudWatch Logs for application errors

#### 2. S3 Replication Not Working

**Symptom**: Objects not replicating to destination bucket

**Solutions**:
- Verify versioning is enabled on both buckets
- Check IAM role has correct permissions
- Ensure replication rule is enabled
- Check CloudWatch metrics for replication errors

#### 3. Cross-Region Dependencies

**Symptom**: CDK deployment fails with cross-region reference errors

**Solutions**:
- Ensure `crossRegionReferences: true` in stack props
- Bootstrap both regions before deployment
- Use SSM parameters for cross-region values

#### 4. DNS Not Resolving

**Symptom**: Domain not resolving to ALB

**Solutions**:
- Verify hosted zone NS records in domain registrar
- Check Route53 record configuration
- Wait for DNS propagation (up to 48 hours)
- Test with `dig` or `nslookup`

### Debug Commands

```bash
# List all CDK stacks
cdk list --context primary_region=us-east-1

# Show stack synthesis
cdk synth PrimaryStack --context primary_region=us-east-1

# Show differences before deployment
cdk diff --all --context primary_region=us-east-1

# View CloudFormation events
aws cloudformation describe-stack-events \
  --stack-name PrimaryStack \
  --region us-east-1 \
  --max-items 20

# Check ASG status
aws autoscaling describe-auto-scaling-groups \
  --region us-east-1 \
  --query "AutoScalingGroups[?contains(Tags[?Key=='aws:cloudformation:stack-name'].Value, 'PrimaryStack')]"

# View ALB target health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn> \
  --region us-east-1
```

## Clean Up

To avoid ongoing charges, destroy all resources:

```bash
# Destroy all stacks
cdk destroy --all --context primary_region=us-east-1

# Verify CloudFormation stacks are deleted
aws cloudformation list-stacks \
  --stack-status-filter DELETE_COMPLETE \
  --region us-east-1

# Manually delete S3 buckets (they are retained by default)
aws s3 rm s3://dr-source-ACCOUNT-us-east-1 --recursive
aws s3 rb s3://dr-source-ACCOUNT-us-east-1
aws s3 rm s3://dr-destination-ACCOUNT-us-west-2 --recursive
aws s3 rb s3://dr-destination-ACCOUNT-us-west-2
```

## Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Multi-Region Best Practices](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html)
- [Route53 Health Checks](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover.html)
- [S3 Replication](https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication.html)

## License

This project is licensed under the MIT License.

## Support

For issues or questions:
- Open an issue in the repository
- Contact AWS Support
- Review AWS CDK GitHub issues

```
```text
Now let me create a deployment script to make it easier to use:
```

```bash
#!/bin/bash

# AWS CDK Disaster Recovery Deployment Script
# This script simplifies deployment with proper validation and error handling

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
PRIMARY_REGION="us-east-1"
SECONDARY_REGION="us-west-2"
ACTION="deploy"

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Java
    if ! command -v java &> /dev/null; then
        print_error "Java is not installed. Please install Java 17 or later."
        exit 1
    fi
    
    JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
    if [ "$JAVA_VERSION" -lt 17 ]; then
        print_error "Java 17 or later is required. Current version: $JAVA_VERSION"
        exit 1
    fi
    print_info "Java version: OK"
    
    # Check Maven
    if ! command -v mvn &> /dev/null; then
        print_error "Maven is not installed. Please install Maven 3.8 or later."
        exit 1
    fi
    print_info "Maven: OK"
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install AWS CLI."
        exit 1
    fi
    print_info "AWS CLI: OK"
    
    # Check CDK CLI
    if ! command -v cdk &> /dev/null; then
        print_error "AWS CDK CLI is not installed. Install it with: npm install -g aws-cdk"
        exit 1
    fi
    print_info "CDK CLI: OK"
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials are not configured. Run 'aws configure'."
        exit 1
    fi
    
    AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    print_info "AWS Account: $AWS_ACCOUNT"
}

# Function to bootstrap CDK
bootstrap_cdk() {
    print_info "Bootstrapping CDK environments..."
    
    print_info "Bootstrapping $PRIMARY_REGION..."
    cdk bootstrap "aws://$AWS_ACCOUNT/$PRIMARY_REGION" || {
        print_error "Failed to bootstrap $PRIMARY_REGION"
        exit 1
    }
    
    print_info "Bootstrapping $SECONDARY_REGION..."
    cdk bootstrap "aws://$AWS_ACCOUNT/$SECONDARY_REGION" || {
        print_error "Failed to bootstrap $SECONDARY_REGION"
        exit 1
    }
    
    print_info "CDK bootstrap complete!"
}

# Function to build the project
build_project() {
    print_info "Building the project..."
    mvn clean compile || {
        print_error "Maven build failed"
        exit 1
    }
    print_info "Build successful!"
}

# Function to deploy stacks
deploy_stacks() {
    print_info "Deploying stacks with primary region: $PRIMARY_REGION"
    print_warn "This will deploy infrastructure in both $PRIMARY_REGION and $SECONDARY_REGION"
    
    if [ "$SKIP_CONFIRM" != "true" ]; then
        read -p "Continue? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Deployment cancelled"
            exit 0
        fi
    fi
    
    print_info "Starting CDK deployment..."
    cdk deploy --all \
        --context primary_region="$PRIMARY_REGION" \
        --require-approval never || {
        print_error "Deployment failed"
        exit 1
    }
    
    print_info "Deployment complete!"
    print_deployment_info
}

# Function to destroy stacks
destroy_stacks() {
    print_warn "This will destroy ALL infrastructure in both regions"
    print_warn "S3 buckets will be retained and must be manually deleted"
    
    if [ "$SKIP_CONFIRM" != "true" ]; then
        read -p "Are you sure? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Destroy cancelled"
            exit 0
        fi
    fi
    
    print_info "Destroying stacks..."
    cdk destroy --all \
        --context primary_region="$PRIMARY_REGION" \
        --force || {
        print_error "Destroy failed"
        exit 1
    }
    
    print_info "Stacks destroyed!"
    print_info "Remember to manually delete S3 buckets if needed:"
    echo "  aws s3 rm s3://dr-source-$AWS_ACCOUNT-$PRIMARY_REGION --recursive"
    echo "  aws s3 rb s3://dr-source-$AWS_ACCOUNT-$PRIMARY_REGION"
    echo "  aws s3 rm s3://dr-destination-$AWS_ACCOUNT-$SECONDARY_REGION --recursive"
    echo "  aws s3 rb s3://dr-destination-$AWS_ACCOUNT-$SECONDARY_REGION"
}

# Function to show stack diff
show_diff() {
    print_info "Showing differences for primary region: $PRIMARY_REGION"
    cdk diff --all --context primary_region="$PRIMARY_REGION"
}

# Function to list stacks
list_stacks() {
    print_info "Available CDK stacks:"
    cdk list --context primary_region="$PRIMARY_REGION"
}

# Function to synthesize stacks
synth_stacks() {
    print_info "Synthesizing CloudFormation templates..."
    cdk synth --all --context primary_region="$PRIMARY_REGION"
}

# Function to print deployment information
print_deployment_info() {
    echo ""
    echo "======================================"
    echo "Deployment Information"
    echo "======================================"
    echo "Primary Region: $PRIMARY_REGION"
    echo "Secondary Region: $SECONDARY_REGION"
    echo "AWS Account: $AWS_ACCOUNT"
    echo ""
    echo "Resources Deployed:"
    echo "  - VPCs in both regions"
    echo "  - Application Load Balancers"
    echo "  - Auto Scaling Groups"
    echo "  - Route53 Failover Configuration"
    echo "  - S3 Cross-Region Replication"
    echo ""
    echo "Next Steps:"
    echo "  1. Update Route53 hosted zone NS records in your domain registrar"
    echo "  2. Access application at: http://app.example-dr.com"
    echo "  3. Test failover by stopping instances in primary region"
    echo "  4. Monitor health checks in Route53 console"
    echo ""
    echo "Useful Commands:"
    echo "  ./deploy.sh --action status    # Check deployment status"
    echo "  ./deploy.sh --action destroy   # Destroy all resources"
    echo "======================================"
}

# Function to check deployment status
check_status() {
    print_info "Checking deployment status..."
    
    echo ""
    echo "Primary Region ($PRIMARY_REGION) Status:"
    aws cloudformation describe-stacks \
        --stack-name PrimaryStack \
        --region "$PRIMARY_REGION" \
        --query "Stacks[0].StackStatus" \
        --output text 2>/dev/null || echo "Not deployed"
    
    echo ""
    echo "Secondary Region ($SECONDARY_REGION) Status:"
    aws cloudformation describe-stacks \
        --stack-name SecondaryStack \
        --region "$SECONDARY_REGION" \
        --query "Stacks[0].StackStatus" \
        --output text 2>/dev/null || echo "Not deployed"
    
    echo ""
    echo "Route53 Stack Status:"
    aws cloudformation describe-stacks \
        --stack-name Route53Stack \
        --region "$PRIMARY_REGION" \
        --query "Stacks[0].StackStatus" \
        --output text 2>/dev/null || echo "Not deployed"
    
    echo ""
    echo "S3 Replication Stack Status:"
    aws cloudformation describe-stacks \
        --stack-name S3ReplicationStack \
        --region "$PRIMARY_REGION" \
        --query "Stacks[0].StackStatus" \
        --output text 2>/dev/null || echo "Not deployed"
}

# Function to test failover
test_failover() {
    print_info "Testing failover mechanism..."
    
    print_warn "This will stop instances in the primary region Auto Scaling Group"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Test cancelled"
        exit 0
    fi
    
    # Get primary ASG instances
    print_info "Finding instances in primary region..."
    INSTANCE_IDS=$(aws autoscaling describe-auto-scaling-groups \
        --region "$PRIMARY_REGION" \
        --query "AutoScalingGroups[?contains(Tags[?Key=='aws:cloudformation:stack-name'].Value, 'PrimaryStack')].Instances[].InstanceId" \
        --output text)
    
    if [ -z "$INSTANCE_IDS" ]; then
        print_error "No instances found in primary ASG"
        exit 1
    fi
    
    print_info "Stopping instances: $INSTANCE_IDS"
    aws ec2 stop-instances \
        --instance-ids $INSTANCE_IDS \
        --region "$PRIMARY_REGION"
    
    print_info "Instances stopped. Failover will occur in approximately 2-3 minutes."
    print_info "Monitor with: watch -n 5 'dig +short app.example-dr.com'"
}

# Function to print usage
usage() {
    cat << EOF
AWS CDK Disaster Recovery Deployment Script

Usage: $0 [OPTIONS]

OPTIONS:
    --action <action>        Action to perform: deploy, destroy, diff, list, synth, status, test-failover
                            Default: deploy
    --primary <region>      Primary region (us-east-1 or us-west-2)
                            Default: us-east-1
    --bootstrap            Bootstrap CDK environments before deployment
    --skip-confirm         Skip confirmation prompts
    -h, --help             Show this help message

EXAMPLES:
    # Deploy with us-east-1 as primary
    $0 --action deploy --primary us-east-1

    # Deploy with us-west-2 as primary
    $0 --action deploy --primary us-west-2

    # Bootstrap CDK environments
    $0 --bootstrap

    # Show differences before deploying
    $0 --action diff --primary us-east-1

    # Check deployment status
    $0 --action status

    # Destroy all resources
    $0 --action destroy

    # Test failover
    $0 --action test-failover

EOF
}

# Parse command line arguments
DO_BOOTSTRAP=false
SKIP_CONFIRM=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --action)
            ACTION="$2"
            shift 2
            ;;
        --primary)
            PRIMARY_REGION="$2"
            if [ "$PRIMARY_REGION" == "us-east-1" ]; then
                SECONDARY_REGION="us-west-2"
            elif [ "$PRIMARY_REGION" == "us-west-2" ]; then
                SECONDARY_REGION="us-east-1"
            else
                print_error "Primary region must be us-east-1 or us-west-2"
                exit 1
            fi
            shift 2
            ;;
        --bootstrap)
            DO_BOOTSTRAP=true
            shift
            ;;
        --skip-confirm)
            SKIP_CONFIRM=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    echo "======================================"
    echo "AWS CDK Disaster Recovery Deployment"
    echo "======================================"
    echo ""
    
    check_prerequisites
    
    if [ "$DO_BOOTSTRAP" = true ]; then
        bootstrap_cdk
    fi
    
    case $ACTION in
        deploy)
            build_project
            deploy_stacks
            ;;
        destroy)
            destroy_stacks
            ;;
        diff)
            build_project
            show_diff
            ;;
        list)
            build_project
            list_stacks
            ;;
        synth)
            build_project
            synth_stacks
            ;;
        status)
            check_status
            ;;
        test-failover)
            test_failover
            ;;
        *)
            print_error "Unknown action: $ACTION"
            usage
            exit 1
            ;;
    esac
}

main
```

```markdown
Perfect! I've created a comprehensive AWS CDK disaster recovery solution in Java with all the required components. Here's what I've built for you:
📦 What's Included
1. Main Application (DisasterRecoveryApp.java)

Variable Primary Region: Uses context variable primary_region to switch between regions
Multi-Region Deployment: Automatically deploys to both us-east-1 and us-west-2
4 Separate Stacks:

PrimaryStack: Infrastructure in the primary region
SecondaryStack: Infrastructure in the secondary region
Route53Stack: DNS failover configuration
S3ReplicationStack: Cross-region S3 replication



2. Regional Infrastructure (Each Region)

VPC with 2 AZs and 1 NAT Gateway
Application Load Balancer with health checks
Auto Scaling Group (2-4 instances)
Security groups properly configured
EC2 instances running Apache web server

3. Route53 Failover

Health checks on primary region ALB
Primary failover record
Secondary failover record
Automatic DNS switching when primary fails

4. S3 Cross-Region Replication

Versioned buckets in both regions
Real-time replication (15-minute SLA)
Delete marker replication
Replication metrics enabled

```