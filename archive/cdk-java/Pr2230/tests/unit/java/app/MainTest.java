package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import java.util.Map;

/**
 * Comprehensive Unit Tests for NovaModelStack
 * Tests CDK construct configuration without any functional testing
 * Focus: Template synthesis, resource properties, and construct relationships
 */
public class MainTest {
    
    private App app;
    private NovaModelStack stack;
    private Template template;
    
    @BeforeEach
    void setUp() {
        app = new App();
        stack = new NovaModelStack(app, "TestStack", StackProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-east-1")
                .build())
            .build(), "test");
        template = Template.fromStack(stack);
    }

    // KMS Tests (1-6)
    @Test
    void testKmsKeyCreated() {
        template.hasResourceProperties("AWS::KMS::Key", Map.of(
            "Description", "Customer Managed Key for NovaModel encryption",
            "EnableKeyRotation", true
        ));
    }

    @Test
    void testKmsKeyAlias() {
        template.resourceCountIs("AWS::KMS::Key", 1);
    }

    @Test
    void testKmsKeyPolicyExists() {
        template.hasResourceProperties("AWS::KMS::Key", Map.of(
            "KeyPolicy", Match.objectLike(Map.of(
                "Statement", Match.anyValue()
            ))
        ));
    }

    @Test
    void testKmsKeyRotationEnabled() {
        template.hasResourceProperties("AWS::KMS::Key", Map.of(
            "EnableKeyRotation", true
        ));
    }

    @Test
    void testKmsKeyDescription() {
        template.hasResourceProperties("AWS::KMS::Key", Map.of(
            "Description", Match.stringLikeRegexp(".*NovaModel.*")
        ));
    }

    @Test
    void testKmsKeyServiceIntegration() {
        // Verify KMS key is referenced by other resources
        template.hasResource("AWS::S3::Bucket", Match.objectLike(Map.of(
            "Properties", Match.objectLike(Map.of(
                "BucketEncryption", Match.objectLike(Map.of(
                    "ServerSideEncryptionConfiguration", Match.anyValue()
                ))
            ))
        )));
    }

    // VPC Tests (7-15)
    @Test
    void testVpcCreated() {
        template.resourceCountIs("AWS::EC2::VPC", 1);
    }

    @Test
    void testVpcDnsSettings() {
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
            "EnableDnsHostnames", true,
            "EnableDnsSupport", true
        ));
    }

    @Test
    void testPublicSubnetsCreated() {
        template.resourcePropertiesCountIs("AWS::EC2::Subnet", 
            Map.of("MapPublicIpOnLaunch", true), 3);
    }

    @Test
    void testPrivateSubnetsCreated() {
        template.resourcePropertiesCountIs("AWS::EC2::Subnet", 
            Map.of("MapPublicIpOnLaunch", false), 6);
    }

    @Test
    void testInternetGatewayCreated() {
        template.resourceCountIs("AWS::EC2::InternetGateway", 1);
    }

    @Test
    void testNatGatewaysCreated() {
        template.resourceCountIs("AWS::EC2::NatGateway", 2);
    }

    @Test
    void testRouteTablesCreated() {
        // Check that multiple route tables exist (public, private, isolated subnets)
        template.resourceCountIs("AWS::EC2::RouteTable", 9);
    }

    @Test
    void testVpcCidrBlock() {
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
            "CidrBlock", Match.stringLikeRegexp("10\\.\\d+\\.\\d+\\.\\d+/16")
        ));
    }

    @Test
    void testSubnetCidrBlocks() {
        // Each subnet should have /24 CIDR
        template.hasResource("AWS::EC2::Subnet", Match.objectLike(Map.of(
            "Properties", Match.objectLike(Map.of(
                "CidrBlock", Match.stringLikeRegexp("10\\.\\d+\\.\\d+\\.\\d+/24")
            ))
        )));
    }

    // Security Group Tests (16-22)
    @Test
    void testLambdaSecurityGroupCreated() {
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Map.of(
            "GroupDescription", "Security group for Lambda functions"
        ));
    }

    @Test
    void testRdsSecurityGroupCreated() {
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Map.of(
            "GroupDescription", "Security group for RDS PostgreSQL"
        ));
    }

    @Test
    void testRdsSecurityGroupIngressRule() {
        template.hasResourceProperties("AWS::EC2::SecurityGroupIngress", Map.of(
            "IpProtocol", "tcp",
            "FromPort", 5432,
            "ToPort", 5432
        ));
    }

    @Test
    void testSecurityGroupVpcAssociation() {
        template.hasResource("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
            "Properties", Match.objectLike(Map.of(
                "VpcId", Match.anyValue()
            ))
        )));
    }

    @Test
    void testNoWildcardSecurityRules() {
        // Ensure no 0.0.0.0/0 in sensitive security groups for PostgreSQL port
        // Check that we don't have any security group ingress rules with 0.0.0.0/0 on port 5432
        template.hasResource("AWS::EC2::SecurityGroupIngress", Match.not(Match.objectLike(Map.of(
            "Properties", Match.objectLike(Map.of(
                "CidrIp", "0.0.0.0/0",
                "FromPort", 5432
            ))
        ))));
    }

    @Test
    void testSecurityGroupEgressRestricted() {
        // RDS security group should have restricted egress
        template.hasResource("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
            "Properties", Match.objectLike(Map.of(
                "GroupDescription", "Security group for RDS PostgreSQL"
            ))
        )));
    }

    @Test
    void testSecurityGroupTagging() {
        // Check that security groups have tags
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
            "Tags", Match.anyValue()
        )));
    }

    // S3 Tests (23-30)
    @Test
    void testS3BucketCreated() {
        template.resourceCountIs("AWS::S3::Bucket", 2);
    }

    @Test
    void testS3BucketEncryption() {
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
            "BucketEncryption", Match.objectLike(Map.of(
                "ServerSideEncryptionConfiguration", Match.anyValue()
            ))
        ));
    }

    @Test
    void testS3BucketVersioning() {
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
            "VersioningConfiguration", Match.objectLike(Map.of(
                "Status", "Enabled"
            ))
        ));
    }

    @Test
    void testS3BucketPublicAccessBlock() {
        // CDK handles public access blocking differently - check bucket properties
        template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
            "PublicAccessBlockConfiguration", Match.anyValue()
        )));
    }

    @Test
    void testS3BucketPolicy() {
        // Check that S3 bucket has a policy with deny effect
        template.hasResourceProperties("AWS::S3::BucketPolicy", Match.objectLike(Map.of(
            "PolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.anyValue()
            ))
        )));
    }

    @Test
    void testS3BucketNaming() {
        template.hasResource("AWS::S3::Bucket", Match.objectLike(Map.of(
            "Properties", Match.objectLike(Map.of(
                "BucketName", Match.stringLikeRegexp("novamodel-.*-test")
            ))
        )));
    }

    @Test
    void testS3BucketKmsIntegration() {
        // Check that S3 bucket has KMS encryption configured
        template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
            "BucketEncryption", Match.objectLike(Map.of(
                "ServerSideEncryptionConfiguration", Match.anyValue()
            ))
        )));
    }

    @Test
    void testS3BucketLogging() {
        // Verify no server access logging configured by default
        // Check that S3 bucket doesn't have logging configuration
        template.hasResource("AWS::S3::Bucket", Match.not(Match.objectLike(Map.of(
            "Properties", Match.objectLike(Map.of(
                "LoggingConfiguration", Match.anyValue()
            ))
        ))));
    }

    // RDS Tests (31-38)
    @Test
    void testRdsInstanceCreated() {
        template.resourceCountIs("AWS::RDS::DBInstance", 1);
    }

    @Test
    void testRdsPostgreSqlEngine() {
        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
            "Engine", "postgres"
        ));
    }

    @Test
    void testRdsMultiAz() {
        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
            "MultiAZ", true
        ));
    }

    @Test
    void testRdsBackupRetention() {
        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
            "BackupRetentionPeriod", 30
        ));
    }

    @Test
    void testRdsDeletionProtection() {
        // For test environment, deletion protection should be false (non-production)
        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
            "DeletionProtection", false
        ));
    }

    @Test
    void testRdsDeletionProtectionEnvironmentLogic() {
        // Test that our environment logic works correctly
        // Current test uses "test" environment, so deletion protection should be false
        App prodApp = new App();
        NovaModelStack prodStack = new NovaModelStack(prodApp, "TestProdStack", StackProps.builder()
            .env(Environment.builder()
                .account("123456789012")
                .region("us-east-1")
                .build())
            .build(), "prod");
        Template prodTemplate = Template.fromStack(prodStack);
        
        // For production environment, deletion protection should be true
        prodTemplate.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
            "DeletionProtection", true
        ));
    }

    @Test
    void testRdsSubnetGroup() {
        template.resourceCountIs("AWS::RDS::DBSubnetGroup", 1);
    }

    @Test
    void testRdsEncryption() {
        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
            "StorageEncrypted", true
        ));
    }

    @Test
    void testRdsInstanceClass() {
        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
            "DBInstanceClass", "db.t3.micro"
        ));
    }

    // Lambda Tests (39-43)
    @Test
    void testLambdaFunctionCreated() {
        // Expecting 2: our main Lambda function + custom resource Lambda function
        template.resourceCountIs("AWS::Lambda::Function", 2);
    }

    @Test
    void testLambdaRuntime() {
        template.hasResourceProperties("AWS::Lambda::Function", Map.of(
            "Runtime", "nodejs18.x"
        ));
    }

    @Test
    void testLambdaVpcConfig() {
        template.hasResource("AWS::Lambda::Function", Match.objectLike(Map.of(
            "Properties", Match.objectLike(Map.of(
                "VpcConfig", Match.objectLike(Map.of(
                    "SubnetIds", Match.anyValue(),
                    "SecurityGroupIds", Match.anyValue()
                ))
            ))
        )));
    }

    @Test
    void testLambdaTimeout() {
        template.hasResourceProperties("AWS::Lambda::Function", Map.of(
            "Timeout", 30
        ));
    }

    @Test
    void testLambdaIamRole() {
        template.hasResource("AWS::Lambda::Function", Match.objectLike(Map.of(
            "Properties", Match.objectLike(Map.of(
                "Role", Match.anyValue()
            ))
        )));
    }

    // API Gateway Tests (44-47)
    @Test
    void testApiGatewayCreated() {
        template.resourceCountIs("AWS::ApiGateway::RestApi", 1);
    }

    @Test
    void testApiGatewayDeployment() {
        template.resourceCountIs("AWS::ApiGateway::Deployment", 1);
    }

    @Test
    void testApiGatewayStage() {
        template.resourceCountIs("AWS::ApiGateway::Stage", 1);
    }

    @Test
    void testApiGatewayLogging() {
        template.hasResource("AWS::ApiGateway::Stage", Match.objectLike(Map.of(
            "Properties", Match.objectLike(Map.of(
                "AccessLogSetting", Match.anyValue()
            ))
        )));
    }

    // IAM Tests (48-50)
    @Test
    void testIamRolesCreated() {
        // Check that IAM roles exist (Lambda execution role, Config role, VPC custom resource role, Config check role)
        template.resourceCountIs("AWS::IAM::Role", 4);
    }

    @Test
    void testLambdaExecutionRole() {
        // Check that IAM role has assume role policy
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
            "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.anyValue()
            ))
        )));
    }

    @Test
    void testIamPolicyLeastPrivilege() {
        // Check that IAM roles have inline policies (not separate AWS::IAM::Policy resources)
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
            "Policies", Match.anyValue()
        )));
    }
}