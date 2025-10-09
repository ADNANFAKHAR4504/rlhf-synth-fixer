package app;

import app.constructs.ComputeConstruct;
import app.constructs.NetworkConstruct;
import app.constructs.SecurityConstruct;
import app.constructs.MonitoringConstruct;
import app.constructs.LoadBalancerConstruct;
import com.hashicorp.cdktf.TerraformOutput;
import com.hashicorp.cdktf.TerraformOutputConfig;
import com.hashicorp.cdktf.providers.aws.provider.AwsProviderConfig;
import software.constructs.Construct;
import com.hashicorp.cdktf.TerraformStack;
import com.hashicorp.cdktf.providers.aws.provider.AwsProvider;

/**
 * CDKTF Java template stack demonstrating basic AWS infrastructure.
 */
public class MainStack extends TerraformStack {
    /**
     * Creates a new MainStack with basic AWS resources.
     * 
     * @param scope The construct scope
     * @param id The construct ID
     */

    private final String stackId;

    public MainStack(final Construct scope, final String id, final String region) {
        super(scope, id);
        this.stackId = id;

        // Configure AWS Provider
        new AwsProvider(this, "aws", AwsProviderConfig.builder()
                .region(region)
                .build());

        // Create networking infrastructure
        NetworkConstruct network = new NetworkConstruct(this, "network");

        // Create security infrastructure
        SecurityConstruct security = new SecurityConstruct(this, "security", network.getVpcId());

        // Allow ALB to communicate with instances
        security.allowAlbToInstances(80);

        // Create load balancer
        LoadBalancerConstruct loadBalancer = new LoadBalancerConstruct(this, "alb", network.getPublicSubnetIds(),
                security.getAlbSecurityGroupId(), network.getVpcId()
        );

        // Create compute resources
        ComputeConstruct compute = new ComputeConstruct(this, "compute", network.getPrivateSubnetIds(),
                security, loadBalancer.getTargetGroup().getArn()
        );

        // Create monitoring
        MonitoringConstruct monitoring = new MonitoringConstruct(this, "monitoring", compute.getAutoScalingGroupName(),
                loadBalancer.getAlb().getArn()
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
                .value(loadBalancer.getAlb().getDnsName())
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