IDEAL_RESPONSE.md
Project: IaC – AWS Nova Model Breaking

The following code implements a multi-region fault-tolerant infrastructure using AWS CDK (Java).
It provisions two stacks (us-east-1 and us-west-2) for high availability and disaster recovery.

All code resides in the lib/ folder.

---

## 📄 lib/Main.java

```java
package app;

import java.util.Arrays;
import java.util.Optional;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.ec2.AmazonLinuxCpuType;
import software.amazon.awscdk.services.ec2.AmazonLinuxEdition;
import software.amazon.awscdk.services.ec2.AmazonLinuxGeneration;
import software.amazon.awscdk.services.ec2.AmazonLinuxImageProps;
import software.amazon.awscdk.services.ec2.AmazonLinuxVirt;
import software.amazon.awscdk.services.ec2.IMachineImage;
import software.amazon.awscdk.services.ec2.Instance;
import software.amazon.awscdk.services.ec2.InstanceClass;
import software.amazon.awscdk.services.ec2.InstanceSize;
import software.amazon.awscdk.services.ec2.InstanceType;
import software.amazon.awscdk.services.ec2.IpAddresses;
import software.amazon.awscdk.services.ec2.MachineImage;
import software.amazon.awscdk.services.ec2.Peer;
import software.amazon.awscdk.services.ec2.Port;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetSelection;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.UserData;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.constructs.Construct;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 */
final class TapStackProps {
  private final String environmentSuffix;
  private final StackProps stackProps;

  private TapStackProps(final String envSuffix, final StackProps props) {
    this.environmentSuffix = envSuffix;
    this.stackProps = props != null ? props : StackProps.builder().build();
  }

  public String getEnvironmentSuffix() {
    return environmentSuffix;
  }

  public StackProps getStackProps() {
    return stackProps;
  }

  public static Builder builder() {
    return new Builder();
  }

  public static class Builder {
    private String environmentSuffix;
    private StackProps stackProps;

    public Builder environmentSuffix(final String suffix) {
      this.environmentSuffix = suffix;
      return this;
    }

    public Builder stackProps(final StackProps props) {
      this.stackProps = props;
      return this;
    }

    public TapStackProps build() {
      return new TapStackProps(environmentSuffix, stackProps);
    }
  }
}

/**
 * VPC Infrastructure Stack
 */
class VpcInfrastructureStack extends Stack {
  private final Vpc vpc;
  private final Instance ec2Instance;
  private final SecurityGroup sshSecurityGroup;

  VpcInfrastructureStack(final Construct scope, final String id, final String environmentSuffix,
      final StackProps props) {
    super(scope, id, props);

    this.vpc = Vpc.Builder.create(this, "MainVpc")
        .vpcName("tap-" + environmentSuffix + "-vpc")
        .ipAddresses(IpAddresses.cidr("10.0.0.0/16"))
        .maxAzs(2)
        .enableDnsSupport(true)
        .enableDnsHostnames(true)
        .subnetConfiguration(Arrays.asList(
            SubnetConfiguration.builder()
                .subnetType(SubnetType.PUBLIC)
                .name("PublicSubnet")
                .cidrMask(24)
                .build()))
        .natGateways(0)
        .build();

    this.sshSecurityGroup = SecurityGroup.Builder.create(this, "SshSecurityGroup")
        .securityGroupName("tap-" + environmentSuffix + "-ssh-sg")
        .vpc(vpc)
        .description("Security group for SSH access to EC2 instances")
        .allowAllOutbound(true)
        .build();

    sshSecurityGroup.addIngressRule(
        Peer.ipv4("203.0.113.0/32"),
        Port.tcp(22),
        "SSH access from specific IP");

    Role ec2Role = Role.Builder.create(this, "Ec2Role")
        .roleName("tap-" + environmentSuffix + "-ec2-role")
        .assumedBy(ServicePrincipal.Builder.create("ec2.amazonaws.com").build())
        .managedPolicies(Arrays.asList(
            ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")))
        .build();

    IMachineImage amazonLinuxAmi = MachineImage.latestAmazonLinux2(
        software.amazon.awscdk.services.ec2.AmazonLinux2ImageSsmParameterProps.builder()
            .cpuType(AmazonLinuxCpuType.X86_64)
            .virtualization(AmazonLinuxVirt.HVM)
            .build());

    this.ec2Instance = Instance.Builder.create(this, "WebServerInstance")
        .instanceName("tap-" + environmentSuffix + "-ec2-instance")
        .vpc(vpc)
        .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
        .machineImage(amazonLinuxAmi)
        .securityGroup(sshSecurityGroup)
        .vpcSubnets(SubnetSelection.builder()
            .subnetType(SubnetType.PUBLIC)
            .availabilityZones(Arrays.asList(vpc.getAvailabilityZones().get(0)))
            .build())
        .role(ec2Role)
        .userData(UserData.forLinux())
        .build();

    Tags.of(this).add("Environment", environmentSuffix);
    Tags.of(this).add("Project", "VpcInfrastructure");
    Tags.of(this).add("CreatedBy", "CDK");

    // ---- Outputs ----
    CfnOutput.Builder.create(this, "VpcId")
        .value(vpc.getVpcId())
        .exportName("TapStack-" + environmentSuffix + "-VpcId")
        .build();

    CfnOutput.Builder.create(this, "InstanceId")
        .value(ec2Instance.getInstanceId())
        .exportName("TapStack-" + environmentSuffix + "-InstanceId")
        .build();

    CfnOutput.Builder.create(this, "SecurityGroupId")
        .value(sshSecurityGroup.getSecurityGroupId())
        .exportName("TapStack-" + environmentSuffix + "-SecurityGroupId")
        .build();
  }

  public Vpc getVpc() { return vpc; }
  public Instance getEc2Instance() { return ec2Instance; }
  public SecurityGroup getSshSecurityGroup() { return sshSecurityGroup; }
}

/**
 * Main TapStack
 */
class TapStack extends Stack {
  private final String environmentSuffix;
  private final VpcInfrastructureStack vpcStack;

  TapStack(final Construct scope, final String id, final TapStackProps props) {
    super(scope, id, props != null ? props.getStackProps() : null);

    this.environmentSuffix = Optional.ofNullable(props)
        .map(TapStackProps::getEnvironmentSuffix)
        .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
            .map(Object::toString))
        .orElse("dev");

    this.vpcStack = new VpcInfrastructureStack(
        this,
        "VpcInfrastructure",
        environmentSuffix,
        StackProps.builder()
            .env(props != null ? props.getStackProps().getEnv() : null)
            .description("VpcInfra for " + environmentSuffix)
            .build());
  }

  public String getEnvironmentSuffix() { return environmentSuffix; }
  public VpcInfrastructureStack getVpcStack() { return vpcStack; }
}

/**
 * Entry point
 */
public final class Main {
  private Main() {}

  public static void main(final String[] args) {
    App app = new App();

    String account = System.getenv("CDK_DEFAULT_ACCOUNT");
    if (account == null) account = "123456789012";

    // Deploy East
    new TapStack(app, "TapStack-East", TapStackProps.builder()
        .environmentSuffix("east")
        .stackProps(StackProps.builder()
            .env(Environment.builder().account(account).region("us-east-1").build())
            .build())
        .build());

    // Deploy West
    new TapStack(app, "TapStack-West", TapStackProps.builder()
        .environmentSuffix("west")
        .stackProps(StackProps.builder()
            .env(Environment.builder().account(account).region("us-west-2").build())
            .build())
        .build());

    app.synth();
  }
}
