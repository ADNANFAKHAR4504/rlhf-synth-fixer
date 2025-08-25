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