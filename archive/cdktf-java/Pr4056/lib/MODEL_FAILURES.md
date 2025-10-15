# MODEL FAILURES

#### 1. KMS Key Missing Resource Policy for Auto Scaling Service

**Model Response:**
Lines 447-451 - Created KMS key without a resource policy, only basic configuration:
```java
this.kmsKey = new KmsKey(this, "kms-key", KmsKeyConfig.builder()
    .description("KMS key for VPC migration encryption")
    .enableKeyRotation(true)
    .tags(mergeTags(tags, Map.of("Name", id + "-kms-key")))
    .build());
```

**Actual Implementation:**
SecurityConstruct.java:40-94 - **Critical deployment fix**: Added comprehensive KMS resource policy that grants necessary permissions to Auto Scaling and EC2 services:
```java
String kmsPolicy = String.format("""
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "Enable IAM User Permissions",
                "Effect": "Allow",
                "Principal": {"AWS": "arn:aws:iam::%s:root"},
                "Action": "kms:*",
                "Resource": "*"
            },
            {
                "Sid": "Allow Auto Scaling to use the key",
                "Effect": "Allow",
                "Principal": {"Service": "autoscaling.amazonaws.com"},
                "Action": ["kms:Decrypt", "kms:Encrypt", "kms:ReEncrypt*", ...],
                "Resource": "*"
            },
            {
                "Sid": "Allow EC2 service to use the key",
                "Effect": "Allow",
                "Principal": {"Service": "ec2.amazonaws.com"},
                "Action": ["kms:Decrypt", "kms:Encrypt", "kms:ReEncrypt*", ...],
                "Resource": "*"
            }
        ]
    }
    """, currentIdentity.getAccountId());

this.kmsKey = new KmsKey(this, "kms-key", KmsKeyConfig.builder()
    .policy(kmsPolicy)  // Critical fix
    ...
```

**Impact:** Without this policy, Auto Scaling Group fails to launch instances with error: **"Client.InternalError: Client error on launch"** or **"KMS.DisabledException: The request was rejected because the specified KMS key is not enabled"**. This completely blocks infrastructure deployment.

---

#### 2. Launch Template Block Device Encryption Parameters - Type Mismatch

**Model Response:**
Lines 744-749 - Used boolean types for `encrypted` and `deleteOnTermination`:
```java
.ebs(LaunchTemplateBlockDeviceMappingsEbs.builder()
    .encrypted(true)              // boolean type
    .kmsKeyId(kmsKeyId)
    .volumeSize(30)
    .volumeType("gp3")
    .deleteOnTermination(true)    // boolean type
    .build())
```

**Actual Implementation:**
ComputeConstruct.java:147-150 - **Critical type fix**: CDKTF requires string types for these parameters:
```java
.ebs(LaunchTemplateBlockDeviceMappingsEbs.builder()
    .encrypted("true")              // string type
    .volumeSize(30)
    .volumeType("gp3")
    .deleteOnTermination("true")    // string type
    .build())
```

**Impact:** Terraform deployment fails with validation error: **"Error: Incorrect attribute value type"**. Launch template cannot be created.

---

#### 3. Launch Template Missing KMS Key in Block Device Mappings

**Model Response:**
Line 746 - Included `.kmsKeyId(kmsKeyId)` in launch template EBS configuration.

**Actual Implementation:**
ComputeConstruct.java:143-153 - **Removed `kmsKeyId` parameter** from launch template block device mappings entirely. KMS encryption is handled at the instance level via the root block device configuration in the Instance resource (line 202).

**Impact:** Launch templates don't support KMS key ID in block device mappings in the same way as EC2 instances. Including it causes deployment error: **"ValidationError: Invalid parameter combination"**. The fix ensures encryption works correctly through instance-level configuration.

---

#### 4. Target Group Deregistration Delay - Type Mismatch

**Model Response:**
Line 890 - Set deregistration delay as integer value:
```java
.deregistrationDelay(300)
```

**Actual Implementation:**
LoadBalancerConstruct.java:59 - **Critical type fix**: CDKTF requires string type:
```java
.deregistrationDelay("300")
```

**Impact:** Terraform plan fails with error: **"Error: Incorrect attribute value type. Expected string, got number"**. Target group cannot be created.

---

#### 5. Application Load Balancer Invalid Parameter

**Model Response:**
Line 869 - Configured ALB with `.enableCrossZoneLoadBalancing(true)`:
```java
this.applicationLoadBalancer = new Lb(this, "alb", LbConfig.builder()
    .name(id + "-alb")
    .internal(false)
    .loadBalancerType("application")
    .securityGroups(List.of(securityGroupId))
    .subnets(subnetIds)
    .enableDeletionProtection(false)
    .enableHttp2(true)
    .enableCrossZoneLoadBalancing(true)  // Invalid for ALB
    .tags(mergeTags(tags, Map.of("Name", id + "-alb")))
    .build());
```

**Actual Implementation:**
LoadBalancerConstruct.java:29-38 - **Removed invalid parameter**. Cross-zone load balancing is always enabled for Application Load Balancers and cannot be configured:
```java
this.applicationLoadBalancer = Lb.Builder.create(this, "alb")
    .name(albName)
    .internal(false)
    .loadBalancerType("application")
    .securityGroups(List.of(securityGroupId))
    .subnets(subnetIds)
    .enableDeletionProtection(false)
    .enableHttp2(true)
    // enableCrossZoneLoadBalancing removed - not valid for ALB
    .tags(mergeTags(Map.of("Name", id + "-alb")))
    .build();
```

**Impact:** Deployment fails with error: **"ValidationException: Cross-zone load balancing is always enabled for application load balancers"** or **"InvalidParameterException: Unknown parameter"**.

---

#### 6. Launch Template User Data - Missing Byte Conversion

**Model Response:**
Line 673 - Used text block directly without converting to bytes:
```java
String userData = Base64.getEncoder().encodeToString("""
    #!/bin/bash
    # Install CloudWatch agent
    ...
    """);
```

**Actual Implementation:**
ComputeConstruct.java:60-115 - **Added `.getBytes()` conversion**:
```java
String userData = Base64.getEncoder().encodeToString("""
    #!/bin/bash
    ...
    """.getBytes());
```

**Impact:** Java compilation fails with error: **"incompatible types: String cannot be converted to byte[]"**. Build process cannot complete.

---

#### 7. Missing HTTP Server Configuration in User Data Script

**Model Response:**
Lines 674-712 - User data script only configured CloudWatch agent monitoring without any web server or health check endpoint setup.

**Actual Implementation:**
ComputeConstruct.java:62-75 - **Added critical HTTP server setup** before CloudWatch configuration:
```java
#!/bin/bash
# Update system
yum update -y

# Install and start web server
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Create health check endpoint
echo "OK" > /var/www/html/health

# Create index page
echo "<h1>VPC Migration Instance</h1>" > /var/www/html/index.html
echo "<p>Instance is running successfully</p>" >> /var/www/html/index.html

# Install CloudWatch agent
...
```

**Impact:** Without HTTP server setup, ALB health checks fail continuously (checking `/health` endpoint). All instances are marked **unhealthy** and removed from target group. The infrastructure deploys but is **completely non-functional** - no traffic can be served.

---

#### 8. CloudWatch Alarm LoadBalancer Dimension - Incorrect ARN Parsing

**Model Response:**
Lines 1022, 1045 - Extracted only the load balancer name from ARN:
```java
String albName = albArn.substring(albArn.lastIndexOf("/") + 1);
```

**Actual Implementation:**
MonitoringConstruct.java:73,95 - **Fixed to extract full load balancer suffix** including type and ID:
```java
String albDimension = albArn.substring(albArn.indexOf("loadbalancer/") + "loadbalancer/".length());
```

**Impact:** CloudWatch alarms are created but **never trigger** because the dimension value is incorrect. For ARN `arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/alb-alb/8336abac49632ae1`, the model extracts only `"8336abac49632ae1"` but AWS requires `"app/alb-alb/8336abac49632ae1"`. Alarms appear healthy but monitoring is completely broken.

---
