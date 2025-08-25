package app.infrastructure;

import com.pulumi.aws.Provider;
import com.pulumi.aws.ec2.SecurityGroup;
import com.pulumi.aws.ec2.SecurityGroupArgs;
import com.pulumi.aws.ec2.SecurityGroupRule;
import com.pulumi.aws.ec2.SecurityGroupRuleArgs;
import com.pulumi.aws.ec2.Vpc;
import com.pulumi.aws.ec2.VpcArgs;
import com.pulumi.aws.kms.Key;
import com.pulumi.aws.kms.KeyArgs;
import com.pulumi.core.Output;
import app.config.EnvironmentConfig;
import app.utils.ResourceNaming;
import app.utils.TaggingPolicy;

import java.util.List;
import java.util.Map;

public class InfrastructureStack {
    private final String stackName;
    private final EnvironmentConfig envConfig;
    private final Provider awsProvider;
    
    public InfrastructureStack(String stackName, EnvironmentConfig envConfig, Provider awsProvider) {
        this.stackName = stackName;
        this.envConfig = envConfig;
        this.awsProvider = awsProvider;
    }
    
    public Vpc createVpc() {
        String vpcName = ResourceNaming.generateResourceName(
            envConfig.getEnvironment(), "vpc", "main"
        );
        
        Map<String, String> vpcConfig = envConfig.getVpcConfig();
        
        return new Vpc(vpcName, VpcArgs.builder()
            .cidrBlock(vpcConfig.get("cidrBlock"))
            .enableDnsHostnames(Boolean.parseBoolean(vpcConfig.get("enableDnsHostnames")))
            .enableDnsSupport(Boolean.parseBoolean(vpcConfig.get("enableDnsSupport")))
            .tags(TaggingPolicy.getResourceTags(envConfig.getEnvironment(), "VPC"))
            .build(), com.pulumi.resources.CustomResourceOptions.builder()
                .provider(awsProvider)
                .build());
    }
    
    public SecurityGroup createSecurityGroups(Vpc vpc) {
        String sgName = ResourceNaming.generateResourceName(
            envConfig.getEnvironment(), "sg", "web"
        );
        
        SecurityGroup webSg = new SecurityGroup(sgName, SecurityGroupArgs.builder()
            .name(sgName)
            .description("Security group for web tier - " + envConfig.getEnvironment())
            .vpcId(vpc.id())
            .tags(TaggingPolicy.getResourceTags(envConfig.getEnvironment(), "SecurityGroup", "Tier", "Web"))
            .build(), com.pulumi.resources.CustomResourceOptions.builder()
                .provider(awsProvider)
                .build());
        
        // Add ingress rules
        new SecurityGroupRule("web-sg-ingress-http", SecurityGroupRuleArgs.builder()
            .type("ingress")
            .fromPort(80)
            .toPort(80)
            .protocol("tcp")
            .cidrBlocks(List.of("0.0.0.0/0"))
            .securityGroupId(webSg.id())
            .build(), com.pulumi.resources.CustomResourceOptions.builder()
                .provider(awsProvider)
                .build());
        
        new SecurityGroupRule("web-sg-ingress-https", SecurityGroupRuleArgs.builder()
            .type("ingress")
            .fromPort(443)
            .toPort(443)
            .protocol("tcp")
            .cidrBlocks(List.of("0.0.0.0/0"))
            .securityGroupId(webSg.id())
            .build(), com.pulumi.resources.CustomResourceOptions.builder()
                .provider(awsProvider)
                .build());
        
        // Add egress rule
        new SecurityGroupRule("web-sg-egress-all", SecurityGroupRuleArgs.builder()
            .type("egress")
            .fromPort(0)
            .toPort(65535)
            .protocol("tcp")
            .cidrBlocks(List.of("0.0.0.0/0"))
            .securityGroupId(webSg.id())
            .build(), com.pulumi.resources.CustomResourceOptions.builder()
                .provider(awsProvider)
                .build());
        
        return webSg;
    }
    
    public Key createKmsKey() {
        String keyName = ResourceNaming.generateResourceName(
            envConfig.getEnvironment(), "kms", "main"
        );
        
        String keyPolicy = """
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": "arn:aws:iam::*:root"
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    }
                ]
            }
            """;
        
        return new Key(keyName, KeyArgs.builder()
            .description("KMS key for " + envConfig.getEnvironment() + " environment encryption")
            .policy(keyPolicy)
            .enableKeyRotation(true)
            .tags(TaggingPolicy.getResourceTags(envConfig.getEnvironment(), "KMSKey"))
            .build(), com.pulumi.resources.CustomResourceOptions.builder()
                .provider(awsProvider)
                .build());
    }
}