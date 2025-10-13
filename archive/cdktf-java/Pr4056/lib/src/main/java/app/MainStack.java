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
        // Network outputs
        new TerraformOutput(this, "vpc-id", TerraformOutputConfig.builder()
                .value(network.getVpcId())
                .description("ID of the newly created VPC")
                .build());

        new TerraformOutput(this, "vpc-cidr", TerraformOutputConfig.builder()
                .value(network.getVpc().getCidrBlock())
                .description("CIDR block of the VPC")
                .build());

        new TerraformOutput(this, "public-subnet-ids", TerraformOutputConfig.builder()
                .value(network.getPublicSubnetIds())
                .description("IDs of public subnets")
                .build());

        new TerraformOutput(this, "private-subnet-ids", TerraformOutputConfig.builder()
                .value(network.getPrivateSubnetIds())
                .description("IDs of private subnets")
                .build());

        // Load Balancer outputs
        new TerraformOutput(this, "alb-dns-name", TerraformOutputConfig.builder()
                .value(loadBalancer.getAlb().getDnsName())
                .description("DNS name of the Application Load Balancer")
                .build());

        new TerraformOutput(this, "alb-arn", TerraformOutputConfig.builder()
                .value(loadBalancer.getAlb().getArn())
                .description("ARN of the Application Load Balancer")
                .build());

        new TerraformOutput(this, "alb-zone-id", TerraformOutputConfig.builder()
                .value(loadBalancer.getAlb().getZoneId())
                .description("Zone ID of the Application Load Balancer")
                .build());

        new TerraformOutput(this, "target-group-arn", TerraformOutputConfig.builder()
                .value(loadBalancer.getTargetGroup().getArn())
                .description("ARN of the Target Group")
                .build());

        new TerraformOutput(this, "alb-listener-arn", TerraformOutputConfig.builder()
                .value(loadBalancer.getHttpListener().getArn())
                .description("ARN of the ALB HTTP Listener")
                .build());

        // Security outputs
        new TerraformOutput(this, "instance-security-group-id", TerraformOutputConfig.builder()
                .value(security.getInstanceSecurityGroupId())
                .description("ID of the instance security group")
                .build());

        new TerraformOutput(this, "alb-security-group-id", TerraformOutputConfig.builder()
                .value(security.getAlbSecurityGroupId())
                .description("ID of the ALB security group")
                .build());

        new TerraformOutput(this, "kms-key-id", TerraformOutputConfig.builder()
                .value(security.getKmsKeyId())
                .description("ID of the KMS encryption key")
                .build());

        new TerraformOutput(this, "kms-key-arn", TerraformOutputConfig.builder()
                .value(security.getKmsKeyArn())
                .description("ARN of the KMS encryption key")
                .build());

        new TerraformOutput(this, "instance-profile-arn", TerraformOutputConfig.builder()
                .value(security.getInstanceProfileArn())
                .description("ARN of the IAM instance profile")
                .build());

        new TerraformOutput(this, "instance-profile-name", TerraformOutputConfig.builder()
                .value(security.getInstanceProfileName())
                .description("Name of the IAM instance profile")
                .build());

        // Compute outputs
        new TerraformOutput(this, "autoscaling-group-name", TerraformOutputConfig.builder()
                .value(compute.getAutoScalingGroupName())
                .description("Name of the Auto Scaling Group")
                .build());

        new TerraformOutput(this, "instance-ids", TerraformOutputConfig.builder()
                .value(compute.getInstanceIds())
                .description("IDs of the migration instances")
                .build());

        // Monitoring outputs
        new TerraformOutput(this, "alarm-topic-arn", TerraformOutputConfig.builder()
                .value(monitoring.getAlarmTopicArn())
                .description("ARN of the SNS topic for alarms")
                .build());

        new TerraformOutput(this, "alarm-names", TerraformOutputConfig.builder()
                .value(monitoring.getAlarmNames())
                .description("Names of CloudWatch alarms")
                .build());

        new TerraformOutput(this, "dashboard-name", TerraformOutputConfig.builder()
                .value(monitoring.getDashboard().getDashboardName())
                .description("Name of the CloudWatch dashboard")
                .build());
    }

    public String getStackId() {
        return stackId;
    }
}