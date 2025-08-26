package app;

import app.components.ComputeStack;
import app.components.NetworkStack;
import app.components.SecurityStack;
import app.components.StorageStack;
import app.config.AppConfig;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResourceOptions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DisplayName("Infrastructure Component Tests")
public class MainTest {

    @Mock
    private AppConfig mockConfig;

    @Mock
    private ComponentResourceOptions mockOptions;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        setupMockConfig();
    }

    private void setupMockConfig() {
        when(mockConfig.getVpcCidrBlock()).thenReturn("10.0.0.0/16");
        when(mockConfig.getPublicSubnetPrimaryCidr()).thenReturn("10.0.1.0/24");
        when(mockConfig.getPublicSubnetSecondaryCidr()).thenReturn("10.0.2.0/24");
        when(mockConfig.getPrivateSubnetPrimaryCidr()).thenReturn("10.0.3.0/24");
        when(mockConfig.getPrivateSubnetSecondaryCidr()).thenReturn("10.0.4.0/24");
        when(mockConfig.getS3BucketNamePrefix()).thenReturn("test-bucket");
        when(mockConfig.getS3WebsiteIndexDocument()).thenReturn("index.html");
        when(mockConfig.getS3WebsiteErrorDocument()).thenReturn("error.html");
        when(mockConfig.getEc2InstanceType()).thenReturn("t3.micro");
        when(mockConfig.getEc2AmiName()).thenReturn("amzn2-ami-hvm-*");
        when(mockConfig.getDefaultEnvironment()).thenReturn("test");
    }

    @Nested
    @DisplayName("NetworkStack Tests")
    class NetworkStackTests {

        @Test
        @DisplayName("Should create NetworkStack with all required outputs")
        void shouldCreateNetworkStackWithOutputs() {
            NetworkStack networkStack = new NetworkStack("test", mockConfig, mockOptions);

            assertNotNull(networkStack, "NetworkStack should be created");
            assertNotNull(networkStack.vpcId, "VPC ID output should not be null");
            assertNotNull(networkStack.publicSubnetPrimaryId, "Public subnet primary ID should not be null");
            assertNotNull(networkStack.publicSubnetSecondaryId, "Public subnet secondary ID should not be null");
            assertNotNull(networkStack.privateSubnetPrimaryId, "Private subnet primary ID should not be null");
            assertNotNull(networkStack.privateSubnetSecondaryId, "Private subnet secondary ID should not be null");
            assertNotNull(networkStack.internetGatewayId, "Internet Gateway ID should not be null");
            assertNotNull(networkStack.publicRouteTableId, "Public Route Table ID should not be null");

            verify(mockConfig).getVpcCidrBlock();
            verify(mockConfig).getPublicSubnetPrimaryCidr();
            verify(mockConfig).getPublicSubnetSecondaryCidr();
            verify(mockConfig).getPrivateSubnetPrimaryCidr();
            verify(mockConfig).getPrivateSubnetSecondaryCidr();
        }

        @Test
        @DisplayName("Should use correct CIDR blocks from config")
        void shouldUseCorrectCidrBlocks() {
            when(mockConfig.getVpcCidrBlock()).thenReturn("192.168.0.0/16");
            when(mockConfig.getPublicSubnetPrimaryCidr()).thenReturn("192.168.1.0/24");

            NetworkStack networkStack = new NetworkStack("test", mockConfig, mockOptions);

            assertNotNull(networkStack);
            verify(mockConfig).getVpcCidrBlock();
            verify(mockConfig).getPublicSubnetPrimaryCidr();
        }

        @Test
        @DisplayName("Should create NetworkStack with custom name")
        void shouldCreateNetworkStackWithCustomName() {
            String customName = "custom-network";
            
            NetworkStack networkStack = new NetworkStack(customName, mockConfig, mockOptions);

            assertNotNull(networkStack, "NetworkStack with custom name should be created");
            assertNotNull(networkStack.vpcId, "VPC ID should be available");
        }
    }

    @Nested
    @DisplayName("SecurityStack Tests")
    class SecurityStackTests {

        @Mock
        private Output<String> mockVpcId;

        @BeforeEach
        void setUp() {
            MockitoAnnotations.openMocks(this);
        }

        @Test
        @DisplayName("Should create SecurityStack with web security group")
        void shouldCreateSecurityStackWithWebSecurityGroup() {
            SecurityStack securityStack = new SecurityStack("test", mockVpcId, mockConfig, mockOptions);

            assertNotNull(securityStack, "SecurityStack should be created");
            assertNotNull(securityStack.webSecurityGroupId, "Web security group ID should not be null");
        }

        @Test
        @DisplayName("Should create SecurityStack with VPC dependency")
        void shouldCreateSecurityStackWithVpcDependency() {
            when(mockVpcId.toString()).thenReturn("vpc-12345");

            SecurityStack securityStack = new SecurityStack("test", mockVpcId, mockConfig, mockOptions);

            assertNotNull(securityStack, "SecurityStack should be created with VPC dependency");
            assertNotNull(securityStack.webSecurityGroupId, "Security group should have ID");
        }

        @Test
        @DisplayName("Should create SecurityStack with custom name")
        void shouldCreateSecurityStackWithCustomName() {
            String customName = "custom-security";
            
            SecurityStack securityStack = new SecurityStack(customName, mockVpcId, mockConfig, mockOptions);

            assertNotNull(securityStack, "SecurityStack with custom name should be created");
            assertNotNull(securityStack.webSecurityGroupId, "Security group ID should be available");
        }
    }

    @Nested
    @DisplayName("StorageStack Tests")
    class StorageStackTests {

        @Test
        @DisplayName("Should create StorageStack with all required outputs")
        void shouldCreateStorageStackWithOutputs() {
            StorageStack storageStack = new StorageStack("test", mockConfig, mockOptions);

            assertNotNull(storageStack, "StorageStack should be created");
            assertNotNull(storageStack.bucketId, "Bucket ID output should not be null");
            assertNotNull(storageStack.bucketArn, "Bucket ARN output should not be null");
            assertNotNull(storageStack.iamRoleArn, "IAM Role ARN output should not be null");
            assertNotNull(storageStack.instanceProfileName, "Instance Profile name should not be null");

            verify(mockConfig).getS3BucketNamePrefix();
            verify(mockConfig).getS3WebsiteIndexDocument();
            verify(mockConfig).getS3WebsiteErrorDocument();
        }

        @Test
        @DisplayName("Should use correct S3 configuration from config")
        void shouldUseCorrectS3Configuration() {
            when(mockConfig.getS3BucketNamePrefix()).thenReturn("my-app-bucket");
            when(mockConfig.getS3WebsiteIndexDocument()).thenReturn("home.html");
            when(mockConfig.getS3WebsiteErrorDocument()).thenReturn("404.html");

            StorageStack storageStack = new StorageStack("test", mockConfig, mockOptions);

            assertNotNull(storageStack);
            verify(mockConfig).getS3BucketNamePrefix();
            verify(mockConfig).getS3WebsiteIndexDocument();
            verify(mockConfig).getS3WebsiteErrorDocument();
        }

        @Test
        @DisplayName("Should create StorageStack with custom name")
        void shouldCreateStorageStackWithCustomName() {
            String customName = "custom-storage";
            
            StorageStack storageStack = new StorageStack(customName, mockConfig, mockOptions);

            assertNotNull(storageStack, "StorageStack with custom name should be created");
            assertNotNull(storageStack.bucketId, "Bucket ID should be available");
            assertNotNull(storageStack.iamRoleArn, "IAM Role ARN should be available");
        }
    }

    @Nested
    @DisplayName("ComputeStack Tests")
    class ComputeStackTests {

        @Mock
        private Output<String> mockSubnetId;
        @Mock
        private Output<String> mockSecurityGroupId;
        @Mock
        private Output<String> mockInstanceProfileName;

        @BeforeEach
        void setUp() {
            MockitoAnnotations.openMocks(this);
        }

        @Test
        @DisplayName("Should create ComputeStack with all required outputs")
        void shouldCreateComputeStackWithOutputs() {
            ComputeStack computeStack = new ComputeStack("test", mockSubnetId, mockSecurityGroupId, 
                    mockInstanceProfileName, mockConfig, mockOptions);

            assertNotNull(computeStack, "ComputeStack should be created");
            assertNotNull(computeStack.instanceId, "Instance ID output should not be null");
            assertNotNull(computeStack.publicIp, "Public IP output should not be null");

            verify(mockConfig).getEc2InstanceType();
            verify(mockConfig).getEc2AmiName();
            verify(mockConfig).getDefaultEnvironment();
        }

        @Test
        @DisplayName("Should use correct EC2 configuration from config")
        void shouldUseCorrectEc2Configuration() {
            when(mockConfig.getEc2InstanceType()).thenReturn("t3.small");
            when(mockConfig.getEc2AmiName()).thenReturn("amzn2-ami-hvm-2.0.*");
            when(mockConfig.getDefaultEnvironment()).thenReturn("production");

            ComputeStack computeStack = new ComputeStack("test", mockSubnetId, mockSecurityGroupId, 
                    mockInstanceProfileName, mockConfig, mockOptions);

            assertNotNull(computeStack);
            verify(mockConfig).getEc2InstanceType();
            verify(mockConfig).getEc2AmiName();
            verify(mockConfig).getDefaultEnvironment();
        }

        @Test
        @DisplayName("Should create ComputeStack with all dependencies")
        void shouldCreateComputeStackWithDependencies() {
            when(mockSubnetId.toString()).thenReturn("subnet-12345");
            when(mockSecurityGroupId.toString()).thenReturn("sg-12345");
            when(mockInstanceProfileName.toString()).thenReturn("instance-profile");

            ComputeStack computeStack = new ComputeStack("test", mockSubnetId, mockSecurityGroupId, 
                    mockInstanceProfileName, mockConfig, mockOptions);

            assertNotNull(computeStack, "ComputeStack should be created with all dependencies");
            assertNotNull(computeStack.instanceId, "Instance ID should be available");
            assertNotNull(computeStack.publicIp, "Public IP should be available");
        }

        @Test
        @DisplayName("Should create ComputeStack with custom name")
        void shouldCreateComputeStackWithCustomName() {
            String customName = "custom-compute";
            
            ComputeStack computeStack = new ComputeStack(customName, mockSubnetId, mockSecurityGroupId, 
                    mockInstanceProfileName, mockConfig, mockOptions);

            assertNotNull(computeStack, "ComputeStack with custom name should be created");
            assertNotNull(computeStack.instanceId, "Instance ID should be available");
        }
    }

    @Nested
    @DisplayName("Integration Between Components")
    class ComponentIntegrationTests {

        @Test
        @DisplayName("Should create all components with interdependencies")
        void shouldCreateAllComponentsWithInterdependencies() {
            NetworkStack networkStack = new NetworkStack("test", mockConfig, mockOptions);
            
            SecurityStack securityStack = new SecurityStack("test", networkStack.vpcId, mockConfig, mockOptions);
            
            StorageStack storageStack = new StorageStack("test", mockConfig, mockOptions);
            
            ComputeStack computeStack = new ComputeStack("test", networkStack.publicSubnetPrimaryId, 
                    securityStack.webSecurityGroupId, storageStack.instanceProfileName, mockConfig, mockOptions);

            assertNotNull(networkStack, "NetworkStack should be created");
            assertNotNull(securityStack, "SecurityStack should be created");
            assertNotNull(storageStack, "StorageStack should be created");
            assertNotNull(computeStack, "ComputeStack should be created");

            assertNotNull(networkStack.vpcId, "VPC ID should be available for SecurityStack");
            assertNotNull(networkStack.publicSubnetPrimaryId, "Subnet ID should be available for ComputeStack");
            assertNotNull(securityStack.webSecurityGroupId, "Security Group ID should be available for ComputeStack");
            assertNotNull(storageStack.instanceProfileName, "Instance Profile should be available for ComputeStack");
        }

        @Test
        @DisplayName("Should verify component dependency chain")
        void shouldVerifyComponentDependencyChain() {
            NetworkStack networkStack = new NetworkStack("test", mockConfig, mockOptions);
            SecurityStack securityStack = new SecurityStack("test", networkStack.vpcId, mockConfig, mockOptions);
            StorageStack storageStack = new StorageStack("test", mockConfig, mockOptions);

            assertNotNull(networkStack.vpcId, "VPC ID required for SecurityStack");
            assertNotNull(networkStack.publicSubnetPrimaryId, "Public subnet required for ComputeStack");
            assertNotNull(securityStack.webSecurityGroupId, "Security group required for ComputeStack");
            assertNotNull(storageStack.instanceProfileName, "Instance profile required for ComputeStack");

            ComputeStack computeStack = new ComputeStack("test", networkStack.publicSubnetPrimaryId,
                    securityStack.webSecurityGroupId, storageStack.instanceProfileName, mockConfig, mockOptions);

            assertNotNull(computeStack, "ComputeStack should be created with all dependencies");
        }
    }
}