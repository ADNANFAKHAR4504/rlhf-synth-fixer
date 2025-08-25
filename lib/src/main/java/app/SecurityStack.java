package app;

import app.InfrastructureConfig;
import app.VpcStack;
import app.TagUtils;
import com.pulumi.aws.ec2.*;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;
import java.util.List;

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
            .tags(tags)
            .build(), CustomResourceOptions.builder().parent(this).build());
        
        // RDS Security Group
        this.rdsSecurityGroup = new SecurityGroup(config.getResourceName("sg", "rds"), SecurityGroupArgs.builder()
            .name(config.getResourceName("sg", "rds"))
            .description("Security group for RDS database")
            .vpcId(vpcStack.getVpc().id())
            .tags(tags)
            .build(), CustomResourceOptions.builder().parent(this).build());
    }
    
    public SecurityGroup getLambdaSecurityGroup() { return lambdaSecurityGroup; }
    public SecurityGroup getRdsSecurityGroup() { return rdsSecurityGroup; }
}