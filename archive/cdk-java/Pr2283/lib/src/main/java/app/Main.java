package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;

/**
 * Main entry point for the Secure Web Application CDK Java infrastructure.
 *
 * This class serves as the entry point for the CDK application and is responsible
 * for initializing the CDK app and instantiating all the security-focused stacks
 * for a comprehensive web application infrastructure.
 *
 * @version 1.0
 * @since 1.0
 */
public final class Main {

    /**
     * Private constructor to prevent instantiation of utility class.
     */
    private Main() {
        // Utility class should not be instantiated
    }

    /**
     * Main entry point for the CDK application.
     *
     * This method creates a CDK App instance and instantiates all required stacks
     * for a secure web application infrastructure including VPC, security groups,
     * EC2, RDS, S3, CloudTrail, GuardDuty, and VPC endpoints.
     *
     * @param args Command line arguments (not used in this application)
     */
    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from context or default to 'dev'
        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        // Define stack properties with us-west-2 region
        StackProps stackProps = StackProps.builder()
                .env(Environment.builder()
                        .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                        .region("us-west-2")
                        .build())
                .build();

        // Create VPC stack first
        VpcStack vpcStack = new VpcStack(app, "VpcStack" + environmentSuffix, stackProps);

        // Create S3 stack
        S3Stack s3Stack = new S3Stack(app, "S3Stack" + environmentSuffix, stackProps);

        // Create IAM stack with S3 bucket reference
        IamStack iamStack = new IamStack(app, "IamStack" + environmentSuffix, stackProps, 
                                       s3Stack.getAppDataBucket());

        // Create Security Groups stack
        SecurityGroupStack sgStack = new SecurityGroupStack(app, "SecurityGroupStack" + environmentSuffix, 
                                                           stackProps, vpcStack.getVpc());

        // Create EC2 stack
        Ec2Stack ec2Stack = new Ec2Stack(app, "Ec2Stack" + environmentSuffix, stackProps,
                                       vpcStack.getVpc(), sgStack.getWebSecurityGroup(), 
                                       iamStack.getEc2Role());

        // Create RDS stack
        RdsStack rdsStack = new RdsStack(app, "RdsStack" + environmentSuffix, stackProps,
                                       vpcStack.getVpc(), sgStack.getDbSecurityGroup());

        // Create VPC Endpoint stack
        VpcEndpointStack vpcEndpointStack = new VpcEndpointStack(app, "VpcEndpointStack" + environmentSuffix,
                                                                stackProps, vpcStack.getVpc(), 
                                                                s3Stack.getAppDataBucket());

        // Create CloudTrail stack
        CloudTrailStack cloudTrailStack = new CloudTrailStack(app, "CloudTrailStack" + environmentSuffix,
                                                             stackProps);

        // Create GuardDuty stack
        GuardDutyStack guardDutyStack = new GuardDutyStack(app, "GuardDutyStack" + environmentSuffix,
                                                          stackProps);

        // Set up dependencies to ensure proper deployment order
        iamStack.addDependency(s3Stack);
        sgStack.addDependency(vpcStack);
        ec2Stack.addDependency(sgStack);
        ec2Stack.addDependency(iamStack);
        rdsStack.addDependency(sgStack);
        vpcEndpointStack.addDependency(vpcStack);
        vpcEndpointStack.addDependency(s3Stack);

        // Synthesize the CDK app
        app.synth();
    }
}
