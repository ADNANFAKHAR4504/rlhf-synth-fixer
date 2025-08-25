Building a Secure Multi-Region Web Application with AWS and Pulumi Java
I'll help you create a robust, secure multi-region web application using Pulumi with Java. This solution will deploy across us-east-1 and us-west-1 with intelligent auto-scaling and comprehensive security.

Project Structure
secure-multi-region-app/
├── src/main/java/
│   └── com/example/
│       └── Main.java
├── build.gradle
├── Pulumi.yaml
├── application/
│   ├── app.zip
│   └── Dockerfile
└── README.md

```yaml
1. Pulumi.yaml Configuration
name: secure-multi-region-webapp
runtime: java
description: Secure multi-region web application with auto-scaling
template:
  config:
    aws:region:
      description: Primary AWS region
      default: us-east-1
    app:primaryRegion:
      description: Primary deployment region
      default: us-east-1
    app:secondaryRegion:
      description: Secondary deployment region  
      default: us-west-1
    app:environment:
      description: Environment name
      default: production
    app:minInstances:
      description: Minimum number of instances
      default: "2"
    app:maxInstances:
      description: Maximum number of instances
      default: "10"
    app:targetCpuUtilization:
      description: Target CPU utilization for auto-scaling
      default: "70"

```


2. build.gradle Dependencies
plugins {
    id 'application'
    id 'java'
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'com.pulumi:pulumi:0.9.9'
    implementation 'com.pulumi:aws:6.22.2'
    implementation 'com.google.code.gson:gson:2.10.1'
    testImplementation 'org.junit.jupiter:junit-jupiter:5.9.2'
    testImplementation 'org.mockito:mockito-core:5.1.1'
}

application {
    mainClass = 'com.example.Main'
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(11)
    }
}

test {
    useJUnitPlatform()
}

jar {
    manifest {
        attributes(
            'Main-Class': 'com.example.Main'
        )
    }
    from {
        configurations.runtimeClasspath.collect { it.isDirectory() ? it : zipTree(it) }
    }
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}

```java
3. Main Pulumi Java Application
package com.example;

import com.pulumi.Pulumi;
import com.pulumi.aws.Provider;
import com.pulumi.aws.ProviderArgs;
import com.pulumi.aws.ec2.SecurityGroup;
import com.pulumi.aws.ec2.SecurityGroupArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupIngressArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupEgressArgs;
import com.pulumi.aws.elasticbeanstalk.Application;
import com.pulumi.aws.elasticbeanstalk.ApplicationArgs;
import com.pulumi.aws.elasticbeanstalk.ApplicationVersion;
import com.pulumi.aws.elasticbeanstalk.ApplicationVersionArgs;
import com.pulumi.aws.elasticbeanstalk.Environment;
import com.pulumi.aws.elasticbeanstalk.EnvironmentArgs;
import com.pulumi.aws.elasticbeanstalk.inputs.EnvironmentSettingArgs;
import com.pulumi.aws.iam.Role;
import com.pulumi.aws.iam.RoleArgs;
import com.pulumi.aws.iam.RolePolicyAttachment;
import com.pulumi.aws.iam.RolePolicyAttachmentArgs;
import com.pulumi.aws.iam.InstanceProfile;
import com.pulumi.aws.iam.InstanceProfileArgs;
import com.pulumi.aws.s3.Bucket;
import com.pulumi.aws.s3.BucketArgs;
import com.pulumi.aws.s3.BucketObject;
import com.pulumi.aws.s3.BucketObjectArgs;
import com.pulumi.aws.s3.BucketPublicAccessBlock;
import com.pulumi.aws.s3.BucketPublicAccessBlockArgs;
import com.pulumi.aws.s3.BucketServerSideEncryptionConfiguration;
import com.pulumi.aws.s3.BucketServerSideEncryptionConfigurationArgs;
import com.pulumi.aws.s3.inputs.BucketServerSideEncryptionConfigurationRuleArgs;
import com.pulumi.aws.s3.inputs.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs;
import com.pulumi.aws.route53.Zone;
import com.pulumi.aws.route53.ZoneArgs;
import com.pulumi.aws.route53.Record;
import com.pulumi.aws.route53.RecordArgs;
import com.pulumi.aws.route53.inputs.RecordFailoverRoutingPolicyArgs;
import com.pulumi.aws.cloudwatch.MetricAlarm;
import com.pulumi.aws.cloudwatch.MetricAlarmArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;

import java.util.List;
import java.util.Map;

public class Main {
    
    public static void main(String[] args) {
        Pulumi.run(ctx -> {
            
            // Get configuration values
            var config = ctx.config();
            var primaryRegion = config.get("primaryRegion").orElse("us-east-1");
            var secondaryRegion = config.get("secondaryRegion").orElse("us-west-1");
            var environment = config.get("environment").orElse("production");
            var minInstances = Integer.parseInt(config.get("minInstances").orElse("2"));
            var maxInstances = Integer.parseInt(config.get("maxInstances").orElse("10"));
            var targetCpuUtilization = Integer.parseInt(config.get("targetCpuUtilization").orElse("70"));
            
            // Common tags for all resources
            var commonTags = Map.of(
                "Environment", environment,
                "Project", "secure-multi-region-webapp",
                "ManagedBy", "Pulumi",
                "Security", "High",
                "Compliance", "Required"
            );
            
            // Create providers for both regions
            var primaryProvider = new Provider("primary-provider", ProviderArgs.builder()
                .region(primaryRegion)
                .defaultTags(Map.of("tags", commonTags))
                .build());
                
            var secondaryProvider = new Provider("secondary-provider", ProviderArgs.builder()
                .region(secondaryRegion)
                .defaultTags(Map.of("tags", commonTags))
                .build());
            
            // Create S3 bucket for application artifacts
            var artifactBucket = new Bucket("app-artifacts-bucket", BucketArgs.builder()
                .bucket("secure-webapp-artifacts-" + System.currentTimeMillis())
                .tags(commonTags)
                .build(), ComponentResourceOptions.builder()
                .provider(primaryProvider)
                .build());
            
            // Enable S3 bucket encryption
            var bucketEncryption = new BucketServerSideEncryptionConfiguration("bucket-encryption",
                BucketServerSideEncryptionConfigurationArgs.builder()
                    .bucket(artifactBucket.id())
                    .rules(BucketServerSideEncryptionConfigurationRuleArgs.builder()
                        .applyServerSideEncryptionByDefault(
                            BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs.builder()
                                .sseAlgorithm("AES256")
                                .build())
                        .build())
                    .build(), ComponentResourceOptions.builder()
                    .provider(primaryProvider)
                    .build());
            
            // Block public access to S3 bucket
            var bucketPublicAccessBlock = new BucketPublicAccessBlock("bucket-pab",
                BucketPublicAccessBlockArgs.builder()
                    .bucket(artifactBucket.id())
                    .blockPublicAcls(true)
                    .blockPublicPolicy(true)
                    .ignorePublicAcls(true)
                    .restrictPublicBuckets(true)
                    .build(), ComponentResourceOptions.builder()
                    .provider(primaryProvider)
                    .build());
            
            // Create sample application zip
            var appVersion = new BucketObject("app-version", BucketObjectArgs.builder()
                .bucket(artifactBucket.id())
                .key("app-v1.0.zip")
                .source(new com.pulumi.asset.FileAsset("application/app.zip"))
                .tags(commonTags)
                .build(), ComponentResourceOptions.builder()
                .provider(primaryProvider)
                .dependsOn(bucketEncryption)
                .build());
            
            // Create IAM role for Elastic Beanstalk EC2 instances
            var ec2Role = new Role("eb-ec2-role", RoleArgs.builder()
                .assumeRolePolicy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "ec2.amazonaws.com"
                            },
                            "Action": "sts:AssumeRole"
                        }
                    ]
                }
                """)
                .tags(commonTags)
                .build());
            
            // Attach necessary policies to EC2 role
            var webTierPolicy = new RolePolicyAttachment("eb-web-tier-policy",
                RolePolicyAttachmentArgs.builder()
                    .role(ec2Role.name())
                    .policyArn("arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier")
                    .build());
            
            var workerTierPolicy = new RolePolicyAttachment("eb-worker-tier-policy",
                RolePolicyAttachmentArgs.builder()
                    .role(ec2Role.name())
                    .policyArn("arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier")
                    .build());
            
            var multicontainerDockerPolicy = new RolePolicyAttachment("eb-multicontainer-docker-policy",
                RolePolicyAttachmentArgs.builder()
                    .role(ec2Role.name())
                    .policyArn("arn:aws:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker")
                    .build());
            
            // Create instance profile
            var instanceProfile = new InstanceProfile("eb-instance-profile",
                InstanceProfileArgs.builder()
                    .role(ec2Role.name())
                    .build());
            
            // Create IAM service role for Elastic Beanstalk
            var serviceRole = new Role("eb-service-role", RoleArgs.builder()
                .assumeRolePolicy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "elasticbeanstalk.amazonaws.com"
                            },
                            "Action": "sts:AssumeRole"
                        }
                    ]
                }
                """)
                .tags(commonTags)
                .build());
            
            var serviceRolePolicy = new RolePolicyAttachment("eb-service-role-policy",
                RolePolicyAttachmentArgs.builder()
                    .role(serviceRole.name())
                    .policyArn("arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkService")
                    .build());
            
            var enhancedHealthPolicy = new RolePolicyAttachment("eb-enhanced-health-policy",
                RolePolicyAttachmentArgs.builder()
                    .role(serviceRole.name())
                    .policyArn("arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth")
                    .build());
            
            // Create security group for web servers
            var webSecurityGroup = new SecurityGroup("web-security-group", SecurityGroupArgs.builder()
                .description("Security group for web servers")
                .ingress(
                    SecurityGroupIngressArgs.builder()
                        .protocol("tcp")
                        .fromPort(80)
                        .toPort(80)
                        .cidrBlocks("0.0.0.0/0")
                        .description("HTTP access")
                        .build(),
                    SecurityGroupIngressArgs.builder()
                        .protocol("tcp")
                        .fromPort(443)
                        .toPort(443)
                        .cidrBlocks("0.0.0.0/0")
                        .description("HTTPS access")
                        .build()
                )
                .egress(SecurityGroupEgressArgs.builder()
                    .protocol("-1")
                    .fromPort(0)
                    .toPort(0)
                    .cidrBlocks("0.0.0.0/0")
                    .description("All outbound traffic")
                    .build())
                .tags(commonTags)
                .build(), ComponentResourceOptions.builder()
                .provider(primaryProvider)
                .build());
            
            // Create Route 53 hosted zone for failover
            var hostedZone = new Zone("webapp-zone", ZoneArgs.builder()
                .name("secure-webapp.example.com")
                .tags(commonTags)
                .build(), ComponentResourceOptions.builder()
                .provider(primaryProvider)
                .build());
            
            // Deploy to primary region
            var primaryDeployment = createRegionalDeployment(
                "primary",
                primaryProvider,
                artifactBucket,
                appVersion,
                instanceProfile,
                serviceRole,
                webSecurityGroup,
                commonTags,
                environment,
                minInstances,
                maxInstances,
                targetCpuUtilization
            );
            
            // Deploy to secondary region
            var secondaryDeployment = createRegionalDeployment(
                "secondary", 
                secondaryProvider,
                artifactBucket,
                appVersion,
                instanceProfile,
                serviceRole,
                webSecurityGroup,
                commonTags,
                environment,
                minInstances,
                maxInstances,
                targetCpuUtilization
            );
            
            // Create Route 53 records for failover
            var primaryRecord = new Record("primary-record", RecordArgs.builder()
                .zoneId(hostedZone.zoneId())
                .name("secure-webapp.example.com")
                .type("CNAME")
                .ttl(60)
                .records(primaryDeployment.endpointUrl())
                .setIdentifier("primary")
                .failoverRoutingPolicy(RecordFailoverRoutingPolicyArgs.builder()
                    .type("PRIMARY")
                    .build())
                .build(), ComponentResourceOptions.builder()
                .provider(primaryProvider)
                .build());
            
            var secondaryRecord = new Record("secondary-record", RecordArgs.builder()
                .zoneId(hostedZone.zoneId())
                .name("secure-webapp.example.com")
                .type("CNAME")
                .ttl(60)
                .records(secondaryDeployment.endpointUrl())
                .setIdentifier("secondary")
                .failoverRoutingPolicy(RecordFailoverRoutingPolicyArgs.builder()
                    .type("SECONDARY")
                    .build())
                .build(), ComponentResourceOptions.builder()
                .provider(secondaryProvider)
                .build());
            
            // Export important outputs
            ctx.export("primaryEndpoint", primaryDeployment.endpointUrl());
            ctx.export("secondaryEndpoint", secondaryDeployment.endpointUrl());
            ctx.export("hostedZoneId", hostedZone.zoneId());
            ctx.export("domainName", hostedZone.name());
            ctx.export("artifactBucket", artifactBucket.bucket());
        });
    }
    
    private static RegionalDeployment createRegionalDeployment(
            String regionName,
            Provider provider,
            Bucket artifactBucket,
            BucketObject appVersion,
            InstanceProfile instanceProfile,
            Role serviceRole,
            SecurityGroup webSecurityGroup,
            Map<String, String> tags,
            String environment,
            int minInstances,
            int maxInstances,
            int targetCpuUtilization) {
        
        // Create Elastic Beanstalk application
        var application = new Application(regionName + "-webapp", ApplicationArgs.builder()
            .description("Secure multi-region web application - " + regionName)
            .tags(tags)
            .build(), ComponentResourceOptions.builder()
            .provider(provider)
            .build());
        
        // Create application version
        var applicationVersion = new ApplicationVersion(regionName + "-app-version",
            ApplicationVersionArgs.builder()
                .application(application.name())
                .bucket(artifactBucket.bucket())
                .key(appVersion.key())
                .tags(tags)
                .build(), ComponentResourceOptions.builder()
                .provider(provider)
                .dependsOn(appVersion)
                .build());
        
        // Create Elastic Beanstalk environment with auto-scaling
        var ebEnvironment = new Environment(regionName + "-env", EnvironmentArgs.builder()
            .application(application.name())
            .solutionStackName("64bit Amazon Linux 2 v3.4.0 running Python 3.8")
            .version(applicationVersion.name())
            .tier("WebServer")
            .settings(
                // Instance configuration
                EnvironmentSettingArgs.builder()
                    .namespace("aws:autoscaling:launchconfiguration")
                    .name("IamInstanceProfile")
                    .value(instanceProfile.name())
                    .build(),
                EnvironmentSettingArgs.builder()
                    .namespace("aws:autoscaling:launchconfiguration")
                    .name("InstanceType")
                    .value("t3.medium")
                    .build(),
                EnvironmentSettingArgs.builder()
                    .namespace("aws:autoscaling:launchconfiguration")
                    .name("SecurityGroups")
                    .value(webSecurityGroup.id())
                    .build(),
                
                // Auto Scaling configuration
                EnvironmentSettingArgs.builder()
                    .namespace("aws:autoscaling:asg")
                    .name("MinSize")
                    .value(String.valueOf(minInstances))
                    .build(),
                EnvironmentSettingArgs.builder()
                    .namespace("aws:autoscaling:asg")
                    .name("MaxSize")
                    .value(String.valueOf(maxInstances))
                    .build(),
                
                // Auto Scaling triggers
                EnvironmentSettingArgs.builder()
                    .namespace("aws:autoscaling:trigger")
                    .name("MeasureName")
                    .value("CPUUtilization")
                    .build(),
                EnvironmentSettingArgs.builder()
                    .namespace("aws:autoscaling:trigger")
                    .name("Statistic")
                    .value("Average")
                    .build(),
                EnvironmentSettingArgs.builder()
                    .namespace("aws:autoscaling:trigger")
                    .name("Unit")
                    .value("Percent")
                    .build(),
                EnvironmentSettingArgs.builder()
                    .namespace("aws:autoscaling:trigger")
                    .name("UpperThreshold")
                    .value(String.valueOf(targetCpuUtilization + 10))
                    .build(),
                EnvironmentSettingArgs.builder()
                    .namespace("aws:autoscaling:trigger")
                    .name("LowerThreshold")
                    .value(String.valueOf(targetCpuUtilization - 10))
                    .build(),
                EnvironmentSettingArgs.builder()
                    .namespace("aws:autoscaling:trigger")
                    .name("ScaleUpIncrement")
                    .value("2")
                    .build(),
```