I'll help you create a comprehensive, secure AWS infrastructure using Pulumi with Java. This solution will meet all your financial services compliance requirements and security best practices.

## Project Structure

First, let's set up the project structure:

```
financial-infrastructure/
├── src/main/java/com/company/infrastructure/
│   ├── App.java
│   ├── config/
│   │   └── InfrastructureConfig.java
│   ├── networking/
│   │   └── VpcStack.java
│   ├── security/
│   │   ├── IamStack.java
│   │   ├── KmsStack.java
│   │   └── SecurityStack.java
│   ├── compliance/
│   │   ├── ConfigStack.java
│   │   └── CloudTrailStack.java
│   ├── compute/
│   │   └── LambdaStack.java
│   ├── storage/
│   │   ├── S3Stack.java
│   │   └── RdsStack.java
│   └── utils/
│       └── TagUtils.java
├── pom.xml
└── Pulumi.yaml
```

## Maven Configuration (pom.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.company</groupId>
    <artifactId>financial-infrastructure</artifactId>
    <version>1.0.0</version>
    
    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <pulumi.version>0.9.9</pulumi.version>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>com.pulumi</groupId>
            <artifactId>pulumi</artifactId>
            <version>${pulumi.version}</version>
        </dependency>
        <dependency>
            <groupId>com.pulumi</groupId>
            <artifactId>aws</artifactId>
            <version>6.15.0</version>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <source>17</source>
                    <target>17</target>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

## Pulumi Configuration (Pulumi.yaml)

```yaml
name: financial-infrastructure
runtime: java
description: Secure AWS infrastructure for financial services
config:
  aws:region: us-east-1
  financial-infrastructure:environment: production
  financial-infrastructure:companyName: YourCompany
```

## Core Infrastructure Code

### 1. Main Application Entry Point

```java
// src/main/java/com/company/infrastructure/App.java
package com.company.infrastructure;

import com.company.infrastructure.config.InfrastructureConfig;
import com.company.infrastructure.networking.VpcStack;
import com.company.infrastructure.security.KmsStack;
import com.company.infrastructure.security.IamStack;
import com.company.infrastructure.security.SecurityStack;
import com.company.infrastructure.compliance.ConfigStack;
import com.company.infrastructure.compliance.CloudTrailStack;
import com.company.infrastructure.storage.S3Stack;
import com.company.infrastructure.storage.RdsStack;
import com.company.infrastructure.compute.LambdaStack;
import com.pulumi.Pulumi;

public class App {
    public static void main(String[] args) {
        Pulumi.run(ctx -> {
            var config = new InfrastructureConfig(ctx);
            
            // 1. KMS Keys (must be created first for encryption)
            var kmsStack = new KmsStack("kms", config);
            
            // 2. IAM Roles and Policies
            var iamStack = new IamStack("iam", config);
            
            // 3. VPC and Networking
            var vpcStack = new VpcStack("vpc", config);
            
            // 4. Security Groups
            var securityStack = new SecurityStack("security", config, vpcStack);
            
            // 5. S3 Buckets
            var s3Stack = new S3Stack("s3", config, kmsStack);
            
            // 6. CloudTrail (depends on S3)
            var cloudTrailStack = new CloudTrailStack("cloudtrail", config, s3Stack, kmsStack);
            
            // 7. AWS Config (depends on S3 and IAM)
            var configStack = new ConfigStack("config", config, s3Stack, iamStack);
            
            // 8. RDS Database
            var rdsStack = new RdsStack("rds", config, vpcStack, securityStack, kmsStack);
            
            // 9. Lambda Functions
            var lambdaStack = new LambdaStack("lambda", config, vpcStack, securityStack, iamStack, kmsStack);
            
            return null;
        });
    }
}
```

### 2. Configuration Management

```java
// src/main/java/com/company/infrastructure/config/InfrastructureConfig.java
package com.company.infrastructure.config;

import com.pulumi.Context;

public class InfrastructureConfig {
    private final Context ctx;
    private final String environment;
    private final String companyName;
    private final String region;
    
    public InfrastructureConfig(Context ctx) {
        this.ctx = ctx;
        this.environment = ctx.config().require("environment");
        this.companyName = ctx.config().require("companyName");
        this.region = "us-east-1"; // Fixed for financial services compliance
    }
    
    public String getEnvironment() { return environment; }
    public String getCompanyName() { return companyName; }
    public String getRegion() { return region; }
    public Context getContext() { return ctx; }
    
    public String getResourceName(String service, String resource) {
        return String.format("%s-%s-%s-%s", companyName, environment, service, resource);
    }
}
```

### 3. Tag Utilities

```java
// src/main/java/com/company/infrastructure/utils/TagUtils.java
package com.company.infrastructure.utils;

import com.company.infrastructure.config.InfrastructureConfig;
import java.util.Map;

public class TagUtils {
    public static Map<String, String> getStandardTags(InfrastructureConfig config) {
        return Map.of(
            "Environment", config.getEnvironment(),
            "Company", config.getCompanyName(),
            "ManagedBy", "Pulumi",
            "Compliance", "FinancialServices"
        );
    }
    
    public static Map<String, String> getStandardTags(InfrastructureConfig config, String service) {
        var tags = new java.util.HashMap<>(getStandardTags(config));
        tags.put("Service", service);
        return tags;
    }
    
    public static Map<String, String> getStandardTags(InfrastructureConfig config, String service, String component) {
        var tags = new java.util.HashMap<>(getStandardTags(config, service));
        tags.put("Component", component);
        return tags;
    }
}
```

### 4. KMS Stack for Encryption

```java
// src/main/java/com/company/infrastructure/security/KmsStack.java
package com.company.infrastructure.security;

import com.company.infrastructure.config.InfrastructureConfig;
import com.company.infrastructure.utils.TagUtils;
import com.pulumi.aws.kms.Key;
import com.pulumi.aws.kms.KeyArgs;
import com.pulumi.aws.kms.Alias;
import com.pulumi.aws.kms.AliasArgs;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;

public class KmsStack extends ComponentResource {
    private final Key s3Key;
    private final Key rdsKey;
    private final Key lambdaKey;
    private final Key cloudTrailKey;
    private final Key configKey;
    
    public KmsStack(String name, InfrastructureConfig config) {
        super("custom:security:KmsStack", name, ComponentResourceOptions.builder().build());
        
        var tags = TagUtils.getStandardTags(config, "security", "kms");
        
        // S3 KMS Key
        this.s3Key = new Key(config.getResourceName("kms", "s3"), KeyArgs.builder()
            .description("KMS key for S3 bucket encryption")
            .keyUsage("ENCRYPT_DECRYPT")
            .customerMasterKeySpec("SYMMETRIC_DEFAULT")
            .keyRotationEnabled(true)
            .tags(tags)
            .policy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "Enable IAM User Permissions",
                            "Effect": "Allow",
                            "Principal": {
                                "AWS": "arn:aws:iam::%s:root"
                            },
                            "Action": "kms:*",
                            "Resource": "*"
                        },
                        {
                            "Sid": "Allow CloudTrail to encrypt logs",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "cloudtrail.amazonaws.com"
                            },
                            "Action": [
                                "kms:GenerateDataKey*",
                                "kms:DescribeKey"
                            ],
                            "Resource": "*"
                        }
                    ]
                }
                """.formatted(config.getContext().config().require("aws:accountId")))
            .build(), ComponentResourceOptions.builder().parent(this).build());
            
        new Alias(config.getResourceName("kms-alias", "s3"), AliasArgs.builder()
            .name("alias/" + config.getResourceName("s3", "encryption"))
            .targetKeyId(s3Key.keyId())
            .build(), ComponentResourceOptions.builder().parent(this).build());
        
        // RDS KMS Key
        this.rdsKey = new Key(config.getResourceName("kms", "rds"), KeyArgs.builder()
            .description("KMS key for RDS encryption")
            .keyUsage("ENCRYPT_DECRYPT")
            .customerMasterKeySpec("SYMMETRIC_DEFAULT")
            .keyRotationEnabled(true)
            .tags(tags)
            .build(), ComponentResourceOptions.builder().parent(this).build());
            
        new Alias(config.getResourceName("kms-alias", "rds"), AliasArgs.builder()
            .name("alias/" + config.getResourceName("rds", "encryption"))
            .targetKeyId(rdsKey.keyId())
            .build(), ComponentResourceOptions.builder().parent(this).build());
        
        // Lambda KMS Key
        this.lambdaKey = new Key(config.getResourceName("kms", "lambda"), KeyArgs.builder()
            .description("KMS key for Lambda environment variable encryption")
            .keyUsage("ENCRYPT_DECRYPT")
            .customerMasterKeySpec("SYMMETRIC_DEFAULT")
            .keyRotationEnabled(true)
            .tags(tags)
            .build(), ComponentResourceOptions.builder().parent(this).build());
            
        new Alias(config.getResourceName("kms-alias", "lambda"), AliasArgs.builder()
            .name("alias/" + config.getResourceName("lambda", "encryption"))
            .targetKeyId(lambdaKey.keyId())
            .build(), ComponentResourceOptions.builder().parent(this).build());
        
        // CloudTrail KMS Key
        this.cloudTrailKey = new Key(config.getResourceName("kms", "cloudtrail"), KeyArgs.builder()
            .description("KMS key for CloudTrail log encryption")
            .keyUsage("ENCRYPT_DECRYPT")
            .customerMasterKeySpec("SYMMETRIC_DEFAULT")
            .keyRotationEnabled(true)
            .tags(tags)
            .build(), ComponentResourceOptions.builder().parent(this).build());
            
        new Alias(config.getResourceName("kms-alias", "cloudtrail"), AliasArgs.builder()
            .name("alias/" + config.getResourceName("cloudtrail", "encryption"))
            .targetKeyId(cloudTrailKey.keyId())
            .build(), ComponentResourceOptions.builder().parent(this).build());
        
        // Config KMS Key
        this.configKey = new Key(config.getResourceName("kms", "config"), KeyArgs.builder()
            .description("KMS key for AWS Config encryption")
            .keyUsage("ENCRYPT_DECRYPT")
            .customerMasterKeySpec("SYMMETRIC_DEFAULT")
            .keyRotationEnabled(true)
            .tags(tags)
            .build(), ComponentResourceOptions.builder().parent(this).build());
            
        new Alias(config.getResourceName("kms-alias", "config"), AliasArgs.builder()
            .name("alias/" + config.getResourceName("config", "encryption"))
            .targetKeyId(configKey.keyId())
            .build(), ComponentResourceOptions.builder().parent(this).build());
    }
    
    public Key getS3Key() { return s3Key; }
    public Key getRdsKey() { return rdsKey; }
    public Key getLambdaKey() { return lambdaKey; }
    public Key getCloudTrailKey() { return cloudTrailKey; }
    public Key getConfigKey() { return configKey; }
}
```

### 5. VPC Stack

```java
// src/main/java/com/company/infrastructure/networking/VpcStack.java
package com.company.infrastructure.networking;

import com.company.infrastructure.config.InfrastructureConfig;
import com.company.infrastructure.utils.TagUtils;
import com.pulumi.aws.ec2.*;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import java.util.List;

public class VpcStack extends ComponentResource {
    private final Vpc vpc;
    private final Subnet privateSubnetA;
    private final Subnet privateSubnetB;
    private final Subnet publicSubnetA;
    private final Subnet publicSubnetB;
    private final InternetGateway igw;
    private final NatGateway natGatewayA;
    private final NatGateway natGatewayB;
    private final RouteTable privateRouteTableA;
    private final RouteTable privateRouteTableB;
    private final RouteTable publicRouteTable;
    
    public VpcStack(String name, InfrastructureConfig config) {
        super("custom:networking:VpcStack", name, ComponentResourceOptions.builder().build());
        
        var tags = TagUtils.getStandardTags(config, "networking");
        
        // VPC
        this.vpc = new Vpc(config.getResourceName("vpc", "main"), VpcArgs.builder()
            .cidrBlock("10.0.0.0/16")
            .enableDnsHostnames(true)
            .enableDnsSupport(true)
            .tags(TagUtils.getStandardTags(config, "networking", "vpc"))
            .build(), ComponentResourceOptions.builder().parent(this).build());
        
        // Internet Gateway
        this.igw = new InternetGateway(config.getResourceName("igw", "main"), InternetGatewayArgs.builder()
            .vpcId(vpc.id())
            .tags(TagUtils.getStandardTags(config, "networking", "igw"))
            .build(), ComponentResourceOptions.builder().parent(this).build());
        
        // Public Subnets
        this.publicSubnetA = new Subnet(config.getResourceName("subnet", "public-a"), SubnetArgs.builder()
            .vpcId(vpc.id())
            .cidrBlock("10.0.1.0/24")
            .availabilityZone("us-east-1a")
            .mapPublicIpOnLaunch(true)
            .tags(TagUtils.getStandardTags(config, "networking", "public-subnet"))
            .build(), ComponentResourceOptions.builder().parent(this).build());
            
        this.publicSubnetB = new Subnet(config.getResourceName("subnet", "public-b"), SubnetArgs.builder()
            .vpcId(vpc.id())
            .cidrBlock("10.0.2.0/24")
            .availabilityZone("us-east-1b")
            .mapPublicIpOnLaunch(true)
            .tags(TagUtils.getStandardTags(config, "networking", "public-subnet"))
            .build(), ComponentResourceOptions.builder().parent(this).build());
        
        // Elastic IPs for NAT Gateways
        var eipA = new Eip(config.getResourceName("eip", "nat-a"), EipArgs.builder()
            .domain("vpc")
            .tags(TagUtils.getStandardTags(config, "networking", "eip"))
            .build(), ComponentResourceOptions.builder().parent(this).build());
            
        var eipB = new Eip(config.getResourceName("eip", "nat-b"), EipArgs.builder()
            .domain("vpc")
            .tags(TagUtils.getStandardTags(config, "networking", "eip"))
            .build(), ComponentResourceOptions.builder().parent(this).build());
        
        // NAT Gateways
        this.natGatewayA = new NatGateway(config.getResourceName("nat", "a"), NatGatewayArgs.builder()
            .allocationId(eipA.id())
            .subnetId(publicSubnetA.id())
            .tags(TagUtils.getStandardTags(config, "networking", "nat"))
            .build(), ComponentResourceOptions.builder().parent(this).build());
            
        this.natGatewayB = new NatGateway(config.getResourceName("nat", "b"), NatGatewayArgs.builder()
            .allocationId(eipB.id())
            .subnetId(publicSubnetB.id())
            .tags(TagUtils.getStandardTags(config, "networking", "nat"))
            .build(), ComponentResourceOptions.builder().parent(this).build());
        
        // Private Subnets
        this.privateSubnetA = new Subnet(config.getResourceName("subnet", "private-a"), SubnetArgs.builder()
            .vpcId(vpc.id())
            .cidrBlock("10.0.10.0/24")
            .availabilityZone("us-east-1a")
            .tags(TagUtils.getStandardTags(config, "networking", "private-subnet"))
            .build(), ComponentResourceOptions.builder().parent(this).build());
            
        this.privateSubnetB = new Subnet(config.getResourceName("subnet", "private-b"), SubnetArgs.builder()
            .vpcId(vpc.id())
            .cidrBlock("10.0.11.0/24")
            .availabilityZone("us-east-1b")
            .tags(TagUtils.getStandardTags(config, "networking", "private-subnet"))
            .build(), ComponentResourceOptions.builder().parent(this).build());
        
        // Route Tables
        this.publicRouteTable = new RouteTable(config.getResourceName("rt", "public"), RouteTableArgs.builder()
            .vpcId(vpc.id())
            .tags(TagUtils.getStandardTags(config, "networking", "route-table"))
            .build(), ComponentResourceOptions.builder().parent(this).build());
            
        this.privateRouteTableA = new RouteTable(config.getResourceName("rt", "private-a"), RouteTableArgs.builder()
            .vpcId(vpc.id())
            .tags(TagUtils.getStandardTags(config, "networking", "route-table"))
            .build(), ComponentResourceOptions.builder().parent(this).build());
            
        this.privateRouteTableB = new RouteTable(config.getResourceName("rt", "private-b"), RouteTableArgs.builder()
            .vpcId(vpc.id())
            .tags(TagUtils.getStandardTags(config, "networking", "route-table"))
            .build(), ComponentResourceOptions.builder().parent(this).build());
        
        // Routes
        new Route(config.getResourceName("route", "public-igw"), RouteArgs.builder()
            .routeTableId(publicRouteTable.id())
            .destinationCidrBlock("0.0.0.0/0")
            .gatewayId(igw.id())
            .build(), ComponentResourceOptions.builder().parent(this).build());
            
        new Route(config.getResourceName("route", "private-a-nat"), RouteArgs.builder()
            .routeTableId(privateRouteTableA.id())
            .destinationCidrBlock("0.0.0.0/0")
            .natGatewayId(natGatewayA.id())
            .build(), ComponentResourceOptions.builder().parent(this).build());
            
        new Route(config.getResourceName("route", "private-b-nat"), RouteArgs.builder()
            .routeTableId(privateRouteTableB.id())
            .destinationCidrBlock("0.0.0.0/0")
            .natGatewayId(natGatewayB.id())
            .build(), ComponentResourceOptions.builder().parent(this).build());
        
        // Route Table Associations
        new RouteTableAssociation(config.getResourceName("rta", "public-a"), RouteTableAssociationArgs.builder()
            .subnetId(publicSubnetA.id())
            .routeTableId(publicRouteTable.id())
            .build(), ComponentResourceOptions.builder().parent(this).build());
            
        new RouteTableAssociation(config.getResourceName("rta", "public-b"), RouteTableAssociationArgs.builder()
            .subnetId(publicSubnetB.id())
            .routeTableId(publicRouteTable.id())
            .build(), ComponentResourceOptions.builder().parent(this).build());
            
        new RouteTableAssociation(config.getResourceName("rta", "private-a"), RouteTableAssociationArgs.builder()
            .subnetId(privateSubnetA.id())
            .routeTableId(privateRouteTableA.id())
            .build(), ComponentResourceOptions.builder().parent(this).build());
            
        new RouteTableAssociation(config.getResourceName("rta", "private-b"), RouteTableAssociationArgs.builder()
            .subnetId(privateSubnetB.id())
            .routeTableId(privateRouteTableB.id())
            .build(), ComponentResourceOptions.builder().parent(this).build());
    }
    
    // Getters
    public Vpc getVpc() { return vpc; }
    public Subnet getPrivateSubnetA() { return privateSubnetA; }
    public Subnet getPrivateSubnetB() { return privateSubnetB; }
    public Subnet getPublicSubnetA() { return publicSubnetA; }
    public Subnet getPublicSubnetB() { return publicSubnetB; }
    public List<Subnet> getPrivateSubnets() { return List.of(privateSubnetA, privateSubnetB); }
    public List<Subnet> getPublicSubnets() { return List.of(publicSubnetA, publicSubnetB); }
}
```

### 6. IAM Stack with Managed Policies

```java
// src/main/java/com/company/infrastructure/security/IamStack.java
package com.company.infrastructure.security;

import com.company.infrastructure.config.InfrastructureConfig;
import com.company.infrastructure.utils.TagUtils;
import com.pulumi.aws.iam.*;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;

public class IamStack extends ComponentResource {
    private final Role lambdaExecutionRole;
    private final Role configServiceRole;
    private final Role cloudTrailRole;
    
    public IamStack(String name, InfrastructureConfig config) {
        super("custom:security:IamStack", name, ComponentResourceOptions.builder().build());
        
        var tags = TagUtils.getStandardTags(config, "security", "iam");
        
        // Lambda Execution Role
        this.lambdaExecutionRole = new Role(config.getResourceName("role", "lambda-execution"), RoleArgs.builder()
            .assumeRolePolicy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "lambda.amazonaws.com"
                            }
                        }
                    ]
                }
                """)
            .tags(tags)
            .build(), ComponentResourceOptions.builder().parent(this).build());
        
        // Attach managed policies to Lambda role
        new RolePolicyAttachment(config.getResourceName("rpa", "lambda-basic"), RolePolicyAttachmentArgs.builder()
            .role(lambdaExecutionRole.name())
            .policyArn("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole")
            .build(), ComponentResourceOptions.builder().parent(this).build());
            
        new RolePolicyAttachment(config.getResourceName("rpa", "lambda-vpc"), RolePolicyAttachmentArgs.builder()
            .role(lambdaExecutionRole.name())
            .policyArn("arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole")
            .build(), ComponentResourceOptions.builder().parent(this).build());
        
        // AWS Config Service Role
        this.configServiceRole = new Role(config.getResourceName("role", "config-service"), RoleArgs.builder()
            .assumeRolePolicy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "config.amazonaws.com"
                            }
                        }
                    ]
                }
                """)
            .tags(tags)
            .build(), ComponentResourceOptions.builder().parent(this).build());
        
        // Attach managed policy to Config role
        new RolePolicyAttachment(config.getResourceName("rpa", "config-service"), RolePolicyAttachmentArgs.builder()
            .role(configServiceRole.name())
            .policyArn("arn:aws:iam::aws:policy/service-role/AWS_ConfigRole")
            .build(), ComponentResourceOptions.builder().parent(this).build());
        
        // CloudTrail Service Role (if needed for CloudWatch Logs)
        this.cloudTrailRole = new Role(config.getResourceName("role", "cloudtrail"), RoleArgs.builder()
            .assumeRolePolicy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "cloudtrail.amazonaws.com"
                            }
                        }
                    ]
                }
                """)
            .tags(tags)
            .build(), ComponentResourceOptions.builder().parent(this).build());
        
        // Custom policy for CloudTrail to write to CloudWatch Logs
        var cloudTrailLogsPolicy = new Policy(config.getResourceName("policy", "cloudtrail-logs"), PolicyArgs.builder()
            .policy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents",
                                "logs:DescribeLogGroups",
                                "logs:DescribeLogStreams"
                            ],
                            "Resource": "*"
                        }
                    ]
                }
                """)
            .tags(tags)
            .build(), ComponentResourceOptions.builder().parent(this).build());
            
        new RolePolicyAttachment(config.getResourceName("rpa", "cloudtrail-logs"), RolePolicyAttachmentArgs.builder()
            .role(cloudTrailRole.name())
            .policyArn(cloudTrailLogsPolicy.arn())
            .build(), ComponentResourceOptions.builder().parent(this).build());
    }
    
    public Role getLambdaExecutionRole() { return lambdaExecutionRole; }
    public Role getConfigServiceRole() { return configServiceRole; }
    public Role getCloudTrailRole() { return cloudTrailRole; }
}
```

### 7. Security Groups Stack

```java
// src/main/java/com/company/infrastructure/security/SecurityStack.java
package com.company.infrastructure.security;

import com.company.infrastructure.config.InfrastructureConfig;
import com.company.infrastructure.networking.VpcStack;
import com.company.infrastructure.utils.TagUtils;
import com.pulumi.aws.ec2.*;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;

public class SecurityStack extends ComponentResource {
    private final SecurityGroup lambdaSecurityGroup;
    private final SecurityGroup rdsSecurityGroup;
    
    public SecurityStack(String name, InfrastructureConfig config, VpcStack vpcStack) {
        super("custom:security:SecurityStack", name, ComponentResourceOptions.builder().build());
        
        var tags = TagUtils.getStandardTags(config, "security", "sg");
        
        // Lambda Security Group
        this.lambdaSecurityGroup = new SecurityGroup(config.getResourceName("sg", "lambda"), SecurityGroupArgs.builder()
            .name(config.getResourceName("sg", "lambda"))
            .description("Security group for Lambda functions")
            .vpcId(vpcStack.getVpc().id())
            .egress(SecurityGroupEgressArgs.builder()
                .fromPort(0)
                .toPort(0)
                .protocol("-1")
                .cidrBlocks("0.0.0.0/0")
                .description("Allow all outbound traffic")
                .build())
            .tags(tags)
            .build(), ComponentResourceOptions.builder().parent(this).build());
        
        // RDS Security Group
        this.rdsSecurityGroup = new SecurityGroup(config.getResourceName("sg", "rds"), SecurityGroupArgs.builder()
            .name(config.getResourceName("sg", "rds"))
            .description("Security group for RDS database")
            .vpcId(vpcStack.getVpc().id())
            .ingress(SecurityGroupIngressArgs.builder()
                .fromPort(5432)
                .toPort(5432)
                .protocol("tcp")
                .securityGroups(lambdaSecurityGroup.id())
                .description("Allow PostgreSQL from Lambda")
                .build())
            .tags(tags)
            .build(), ComponentResourceOptions.builder().parent(this).build());
    }
    
    public SecurityGroup getLambdaSecurityGroup() { return lambdaSecurityGroup; }
    public SecurityGroup getRdsSecurityGroup() { return rdsSecurityGroup; }
}
```

### 8.