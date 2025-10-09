package app;

import app.config.AppConfig;
import app.constructs.*;
import com.hashicorp.cdktf.TerraformOutput;
import com.hashicorp.cdktf.TerraformOutputConfig;
import com.hashicorp.cdktf.providers.aws.provider.AwsProviderConfig;
import software.constructs.Construct;
import com.hashicorp.cdktf.TerraformStack;
import com.hashicorp.cdktf.providers.aws.provider.AwsProvider;

/**
 * CDKTF Java template stack demonstrating basic AWS infrastructure.
 * 
 * This stack creates a simple S3 bucket with proper tagging for
 * cost tracking and resource management.
 */
public class MainStack extends TerraformStack {
    /**
     * Creates a new MainStack with basic AWS resources.
     * 
     * @param scope The construct scope
     * @param id The construct ID
     */

    private final String stackId;

    public MainStack(final Construct scope, final String id, AppConfig config) {
        super(scope, id);
        this.stackId = id;

        // Configure AWS Provider
        new AwsProvider(this, "aws", AwsProviderConfig.builder()
                .region(config.region())
                .build());

        // Create networking infrastructure
        NetworkConstruct network = new NetworkConstruct(
                this,
                config.projectName() + "-network",
                config.networkConfig(),
                config.tags()
        );

        // Create security infrastructure
        SecurityConstruct security = new SecurityConstruct(
                this,
                config.projectName() + "-security",
                config.securityConfig(),
                network.getVpcId(),
                config.tags()
        );

        // Allow ALB to communicate with instances
        security.allowAlbToInstances(80);

        // Create load balancer
        LoadBalancerConstruct loadBalancer = new LoadBalancerConstruct(
                this,
                config.projectName() + "-alb",
                network.getPublicSubnetIds(),
                security.getAlbSecurityGroupId(),
                network.getVpcId(),
                config.existingInstanceIds(),
                config.tags()
        );

        // Create compute resources
        ComputeConstruct compute = new ComputeConstruct(
                this,
                config.projectName() + "-compute",
                config.securityConfig(),
                network.getPrivateSubnetIds(),
                security.getInstanceSecurityGroupId(),
                security.getInstanceProfileArn(),
                security.getKmsKeyId(),
                loadBalancer.getTargetGroupArn(),
                config.tags()
        );

        // Create monitoring
        MonitoringConstruct monitoring = new MonitoringConstruct(
                this,
                config.projectName() + "-monitoring",
                config.monitoringConfig(),
                compute.getAutoScalingGroupName(),
                loadBalancer.getAlbArn(),
                config.tags()
        );

        // Define outputs
        new TerraformOutput(this, "vpc-id", TerraformOutputConfig.builder()
                .value(network.getVpcId())
                .description("ID of the newly created VPC")
                .build());

        new TerraformOutput(this, "public-subnet-ids", TerraformOutputConfig.builder()
                .value(network.getPublicSubnetIds())
                .description("IDs of public subnets")
                .build());

        new TerraformOutput(this, "alb-dns-name", TerraformOutputConfig.builder()
                .value(loadBalancer.getAlbDnsName())
                .description("DNS name of the Application Load Balancer")
                .build());

        new TerraformOutput(this, "alarm-topic-arn", TerraformOutputConfig.builder()
                .value(monitoring.getAlarmTopicArn())
                .description("ARN of the SNS topic for alarms")
                .build());
    }

    public String getStackId() {
        return stackId;
    }
}