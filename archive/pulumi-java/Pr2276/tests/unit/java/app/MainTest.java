package app;

import app.config.AppConfig;
import com.pulumi.Context;
import com.pulumi.Config;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("Infrastructure Component Tests")
public class MainTest {

    @Mock
    private Context mockContext;
    
    @Mock
    private Config mockConfig;

    private AppConfig appConfig;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        when(mockContext.config()).thenReturn(mockConfig);
        appConfig = new AppConfig(mockContext);
    }

    @Nested
    @DisplayName("AppConfig Tests")
    class AppConfigTests {

        @Test
        @DisplayName("Should get default environment from config")
        void shouldGetDefaultEnvironment() {
            when(mockConfig.require("environment")).thenReturn("development");
            
            String environment = appConfig.getDefaultEnvironment();
            
            assertEquals("development", environment);
            verify(mockConfig).require("environment");
        }

        @Test
        @DisplayName("Should get primary region from config")
        void shouldGetPrimaryRegion() {
            when(mockConfig.require("primaryRegion")).thenReturn("us-east-1");
            
            String region = appConfig.getPrimaryRegion();
            
            assertEquals("us-east-1", region);
            verify(mockConfig).require("primaryRegion");
        }

        @Test
        @DisplayName("Should get secondary region from config")
        void shouldGetSecondaryRegion() {
            when(mockConfig.require("secondaryRegion")).thenReturn("us-west-2");
            
            String region = appConfig.getSecondaryRegion();
            
            assertEquals("us-west-2", region);
            verify(mockConfig).require("secondaryRegion");
        }

        @Test
        @DisplayName("Should get VPC CIDR block from config")
        void shouldGetVpcCidrBlock() {
            when(mockConfig.require("vpcCidrBlock")).thenReturn("10.0.0.0/16");
            
            String cidr = appConfig.getVpcCidrBlock();
            
            assertEquals("10.0.0.0/16", cidr);
            verify(mockConfig).require("vpcCidrBlock");
        }

        @Test
        @DisplayName("Should get public subnet primary CIDR from config")
        void shouldGetPublicSubnetPrimaryCidr() {
            when(mockConfig.require("publicSubnetPrimaryCidr")).thenReturn("10.0.1.0/24");
            
            String cidr = appConfig.getPublicSubnetPrimaryCidr();
            
            assertEquals("10.0.1.0/24", cidr);
            verify(mockConfig).require("publicSubnetPrimaryCidr");
        }

        @Test
        @DisplayName("Should get public subnet secondary CIDR from config")
        void shouldGetPublicSubnetSecondaryCidr() {
            when(mockConfig.require("publicSubnetSecondaryCidr")).thenReturn("10.0.2.0/24");
            
            String cidr = appConfig.getPublicSubnetSecondaryCidr();
            
            assertEquals("10.0.2.0/24", cidr);
            verify(mockConfig).require("publicSubnetSecondaryCidr");
        }

        @Test
        @DisplayName("Should get private subnet primary CIDR from config")
        void shouldGetPrivateSubnetPrimaryCidr() {
            when(mockConfig.require("privateSubnetPrimaryCidr")).thenReturn("10.0.3.0/24");
            
            String cidr = appConfig.getPrivateSubnetPrimaryCidr();
            
            assertEquals("10.0.3.0/24", cidr);
            verify(mockConfig).require("privateSubnetPrimaryCidr");
        }

        @Test
        @DisplayName("Should get private subnet secondary CIDR from config")
        void shouldGetPrivateSubnetSecondaryCidr() {
            when(mockConfig.require("privateSubnetSecondaryCidr")).thenReturn("10.0.4.0/24");
            
            String cidr = appConfig.getPrivateSubnetSecondaryCidr();
            
            assertEquals("10.0.4.0/24", cidr);
            verify(mockConfig).require("privateSubnetSecondaryCidr");
        }

        @Test
        @DisplayName("Should get EC2 AMI name from config")
        void shouldGetEc2AmiName() {
            when(mockConfig.require("amiName")).thenReturn("amzn2-ami-hvm-*");
            
            String amiName = appConfig.getEc2AmiName();
            
            assertEquals("amzn2-ami-hvm-*", amiName);
            verify(mockConfig).require("amiName");
        }

        @Test
        @DisplayName("Should get EC2 instance type from config")
        void shouldGetEc2InstanceType() {
            when(mockConfig.require("instanceType")).thenReturn("t3.micro");
            
            String instanceType = appConfig.getEc2InstanceType();
            
            assertEquals("t3.micro", instanceType);
            verify(mockConfig).require("instanceType");
        }

        @Test
        @DisplayName("Should get S3 bucket name prefix from config")
        void shouldGetS3BucketNamePrefix() {
            when(mockConfig.require("bucketNamePrefix")).thenReturn("web-hosting-bucket");
            
            String prefix = appConfig.getS3BucketNamePrefix();
            
            assertEquals("web-hosting-bucket", prefix);
            verify(mockConfig).require("bucketNamePrefix");
        }

        @Test
        @DisplayName("Should get S3 website index document from config")
        void shouldGetS3WebsiteIndexDocument() {
            when(mockConfig.require("websiteIndexDocument")).thenReturn("index.html");
            
            String indexDoc = appConfig.getS3WebsiteIndexDocument();
            
            assertEquals("index.html", indexDoc);
            verify(mockConfig).require("websiteIndexDocument");
        }

        @Test
        @DisplayName("Should get S3 website error document from config")
        void shouldGetS3WebsiteErrorDocument() {
            when(mockConfig.require("websiteErrorDocument")).thenReturn("error.html");
            
            String errorDoc = appConfig.getS3WebsiteErrorDocument();
            
            assertEquals("error.html", errorDoc);
            verify(mockConfig).require("websiteErrorDocument");
        }

        @Test
        @DisplayName("Should get project name from config")
        void shouldGetProjectName() {
            when(mockConfig.require("projectName")).thenReturn("WebHosting");
            
            String projectName = appConfig.getProjectName();
            
            assertEquals("WebHosting", projectName);
            verify(mockConfig).require("projectName");
        }
    }

    @Nested
    @DisplayName("Configuration Validation Tests")
    class ConfigurationValidationTests {

        @Test
        @DisplayName("Should validate CIDR block format")
        void shouldValidateCidrBlockFormat() {
            when(mockConfig.require("vpcCidrBlock")).thenReturn("10.0.0.0/16");
            
            String cidr = appConfig.getVpcCidrBlock();
            
            assertTrue(cidr.matches("^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$"), 
                    "CIDR block should match expected format");
        }

        @Test
        @DisplayName("Should validate instance type format")
        void shouldValidateInstanceTypeFormat() {
            when(mockConfig.require("instanceType")).thenReturn("t3.micro");
            
            String instanceType = appConfig.getEc2InstanceType();
            
            assertTrue(instanceType.matches("^[a-z][0-9]+\\.[a-z]+$"), 
                    "Instance type should match expected format");
        }

        @Test
        @DisplayName("Should validate AMI name pattern")
        void shouldValidateAmiNamePattern() {
            when(mockConfig.require("amiName")).thenReturn("amzn2-ami-hvm-*");
            
            String amiName = appConfig.getEc2AmiName();
            
            assertTrue(amiName.contains("amzn") && amiName.contains("ami"), 
                    "AMI name should contain expected keywords");
        }

        @Test
        @DisplayName("Should validate HTML document extensions")
        void shouldValidateHtmlDocuments() {
            when(mockConfig.require("websiteIndexDocument")).thenReturn("index.html");
            when(mockConfig.require("websiteErrorDocument")).thenReturn("error.html");
            
            String indexDoc = appConfig.getS3WebsiteIndexDocument();
            String errorDoc = appConfig.getS3WebsiteErrorDocument();
            
            assertTrue(indexDoc.endsWith(".html"), "Index document should be HTML");
            assertTrue(errorDoc.endsWith(".html"), "Error document should be HTML");
        }

        @Test
        @DisplayName("Should validate region format")
        void shouldValidateRegionFormat() {
            when(mockConfig.require("primaryRegion")).thenReturn("us-east-1");
            when(mockConfig.require("secondaryRegion")).thenReturn("us-west-2");
            
            String primaryRegion = appConfig.getPrimaryRegion();
            String secondaryRegion = appConfig.getSecondaryRegion();
            
            assertTrue(primaryRegion.matches("^[a-z]+-[a-z]+-[0-9]+$"), 
                    "Primary region should match AWS region format");
            assertTrue(secondaryRegion.matches("^[a-z]+-[a-z]+-[0-9]+$"), 
                    "Secondary region should match AWS region format");
        }
    }

    @Nested
    @DisplayName("Component Integration Logic Tests")
    class ComponentIntegrationLogicTests {

        @Test
        @DisplayName("Should have all required configuration for NetworkStack")
        void shouldHaveNetworkStackConfiguration() {
            setupNetworkStackConfig();
            
            assertNotNull(appConfig.getVpcCidrBlock());
            assertNotNull(appConfig.getPublicSubnetPrimaryCidr());
            assertNotNull(appConfig.getPublicSubnetSecondaryCidr());
            assertNotNull(appConfig.getPrivateSubnetPrimaryCidr());
            assertNotNull(appConfig.getPrivateSubnetSecondaryCidr());
        }

        @Test
        @DisplayName("Should have all required configuration for ComputeStack")
        void shouldHaveComputeStackConfiguration() {
            setupComputeStackConfig();
            
            assertNotNull(appConfig.getEc2InstanceType());
            assertNotNull(appConfig.getEc2AmiName());
            assertNotNull(appConfig.getDefaultEnvironment());
        }

        @Test
        @DisplayName("Should have all required configuration for StorageStack")
        void shouldHaveStorageStackConfiguration() {
            setupStorageStackConfig();
            
            assertNotNull(appConfig.getS3BucketNamePrefix());
            assertNotNull(appConfig.getS3WebsiteIndexDocument());
            assertNotNull(appConfig.getS3WebsiteErrorDocument());
        }

        @Test
        @DisplayName("Should verify subnet CIDR blocks are within VPC CIDR")
        void shouldVerifySubnetCidrsWithinVpcCidr() {
            when(mockConfig.require("vpcCidrBlock")).thenReturn("10.0.0.0/16");
            when(mockConfig.require("publicSubnetPrimaryCidr")).thenReturn("10.0.1.0/24");
            when(mockConfig.require("publicSubnetSecondaryCidr")).thenReturn("10.0.2.0/24");
            when(mockConfig.require("privateSubnetPrimaryCidr")).thenReturn("10.0.3.0/24");
            when(mockConfig.require("privateSubnetSecondaryCidr")).thenReturn("10.0.4.0/24");
            
            String vpcCidr = appConfig.getVpcCidrBlock();
            String pubSubnet1 = appConfig.getPublicSubnetPrimaryCidr();
            String pubSubnet2 = appConfig.getPublicSubnetSecondaryCidr();
            String privSubnet1 = appConfig.getPrivateSubnetPrimaryCidr();
            String privSubnet2 = appConfig.getPrivateSubnetSecondaryCidr();
            
            assertTrue(vpcCidr.startsWith("10.0."), "VPC should be in 10.0.x.x range");
            assertTrue(pubSubnet1.startsWith("10.0."), "Public subnet 1 should be in VPC range");
            assertTrue(pubSubnet2.startsWith("10.0."), "Public subnet 2 should be in VPC range");
            assertTrue(privSubnet1.startsWith("10.0."), "Private subnet 1 should be in VPC range");
            assertTrue(privSubnet2.startsWith("10.0."), "Private subnet 2 should be in VPC range");
        }

        private void setupNetworkStackConfig() {
            when(mockConfig.require("vpcCidrBlock")).thenReturn("10.0.0.0/16");
            when(mockConfig.require("publicSubnetPrimaryCidr")).thenReturn("10.0.1.0/24");
            when(mockConfig.require("publicSubnetSecondaryCidr")).thenReturn("10.0.2.0/24");
            when(mockConfig.require("privateSubnetPrimaryCidr")).thenReturn("10.0.3.0/24");
            when(mockConfig.require("privateSubnetSecondaryCidr")).thenReturn("10.0.4.0/24");
        }

        private void setupComputeStackConfig() {
            when(mockConfig.require("instanceType")).thenReturn("t3.micro");
            when(mockConfig.require("amiName")).thenReturn("amzn2-ami-hvm-*");
            when(mockConfig.require("environment")).thenReturn("development");
        }

        private void setupStorageStackConfig() {
            when(mockConfig.require("bucketNamePrefix")).thenReturn("web-hosting-bucket");
            when(mockConfig.require("websiteIndexDocument")).thenReturn("index.html");
            when(mockConfig.require("websiteErrorDocument")).thenReturn("error.html");
        }
    }
}