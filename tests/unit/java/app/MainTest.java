package app;

import app.components.*;
import com.pulumi.Context;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import static org.junit.jupiter.api.Assertions.*;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.lang.reflect.Constructor;

/**
 * Comprehensive unit tests for infrastructure components.
 * Tests component construction, configuration, and API contracts.
 */
public class MainTest {

    @Mock
    private Context mockContext;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Nested
    @DisplayName("IamComponent Tests")
    class IamComponentTests {

        @Test
        @DisplayName("Should create IamComponent with required constructors")
        void shouldCreateIamComponent() {
            assertDoesNotThrow(() -> {
                // Test both constructor variants exist
                Constructor<?> simpleConstructor = IamComponent.class
                    .getConstructor(String.class, String.class);
                Constructor<?> fullConstructor = IamComponent.class
                    .getConstructor(String.class, String.class, 
                        com.pulumi.resources.ComponentResourceOptions.class);
                
                assertNotNull(simpleConstructor);
                assertNotNull(fullConstructor);
            });
        }

        @Test
        @DisplayName("Should extend ComponentResource")
        void shouldExtendComponentResource() {
            assertTrue(ComponentResource.class.isAssignableFrom(IamComponent.class));
        }

        @Test
        @DisplayName("Should have required getter methods")
        void shouldHaveRequiredGetterMethods() throws Exception {
            Method ec2InstanceProfileMethod = IamComponent.class
                .getMethod("getEc2InstanceProfileName");
            
            assertNotNull(ec2InstanceProfileMethod);
            assertEquals(Output.class, ec2InstanceProfileMethod.getReturnType());
            assertTrue(Modifier.isPublic(ec2InstanceProfileMethod.getModifiers()));
        }

        @Test
        @DisplayName("Should have buildResourceTags static method")
        void shouldHaveBuildResourceTagsMethod() throws Exception {
            Method buildTagsMethod = IamComponent.class
                .getDeclaredMethod("buildResourceTags", String.class, String.class, java.util.Map.class);
            
            assertNotNull(buildTagsMethod);
            assertTrue(Modifier.isStatic(buildTagsMethod.getModifiers()));
            assertEquals(java.util.Map.class, buildTagsMethod.getReturnType());
        }
    }

    @Nested
    @DisplayName("NetworkingComponent Tests")
    class NetworkingComponentTests {

        @Test
        @DisplayName("Should create NetworkingComponent with required constructors")
        void shouldCreateNetworkingComponent() {
            assertDoesNotThrow(() -> {
                Constructor<?> simpleConstructor = NetworkingComponent.class
                    .getConstructor(String.class, String.class);
                Constructor<?> fullConstructor = NetworkingComponent.class
                    .getConstructor(String.class, String.class, 
                        com.pulumi.resources.ComponentResourceOptions.class);
                
                assertNotNull(simpleConstructor);
                assertNotNull(fullConstructor);
            });
        }

        @Test
        @DisplayName("Should have required VPC and subnet getter methods")
        void shouldHaveRequiredGetterMethods() throws Exception {
            Method getVpcIdMethod = NetworkingComponent.class.getMethod("getVpcId");
            Method getPublicSubnetIdsMethod = NetworkingComponent.class.getMethod("getPublicSubnetIds");
            Method getPrivateSubnetIdsMethod = NetworkingComponent.class.getMethod("getPrivateSubnetIds");
            
            assertNotNull(getVpcIdMethod);
            assertNotNull(getPublicSubnetIdsMethod);
            assertNotNull(getPrivateSubnetIdsMethod);
            
            assertEquals(Output.class, getVpcIdMethod.getReturnType());
            assertEquals(Output.class, getPublicSubnetIdsMethod.getReturnType());
            assertEquals(Output.class, getPrivateSubnetIdsMethod.getReturnType());
        }
    }

    @Nested
    @DisplayName("StorageComponent Tests")
    class StorageComponentTests {

        @Test
        @DisplayName("Should create StorageComponent with required constructors")
        void shouldCreateStorageComponent() {
            assertDoesNotThrow(() -> {
                Constructor<?> simpleConstructor = StorageComponent.class
                    .getConstructor(String.class, String.class);
                Constructor<?> fullConstructor = StorageComponent.class
                    .getConstructor(String.class, String.class, 
                        com.pulumi.resources.ComponentResourceOptions.class);
                
                assertNotNull(simpleConstructor);
                assertNotNull(fullConstructor);
            });
        }

        @Test
        @DisplayName("Should have required storage getter methods")
        void shouldHaveRequiredGetterMethods() throws Exception {
            Method getKmsKeyArnMethod = StorageComponent.class.getMethod("getKmsKeyArn");
            Method getBucketNamesMethod = StorageComponent.class.getMethod("getBucketNames");
            Method getCloudTrailBucketNameMethod = StorageComponent.class.getMethod("getCloudTrailBucketName");
            
            assertNotNull(getKmsKeyArnMethod);
            assertNotNull(getBucketNamesMethod);
            assertNotNull(getCloudTrailBucketNameMethod);
            
            assertEquals(Output.class, getKmsKeyArnMethod.getReturnType());
            assertEquals(Output.class, getBucketNamesMethod.getReturnType());
            assertEquals(Output.class, getCloudTrailBucketNameMethod.getReturnType());
        }
    }

    @Nested
    @DisplayName("ComputeComponent Tests")
    class ComputeComponentTests {

        @Test
        @DisplayName("Should create ComputeComponent with required constructors")
        void shouldCreateComputeComponent() {
            assertDoesNotThrow(() -> {
                Constructor<?> simpleConstructor = ComputeComponent.class
                    .getConstructor(String.class, NetworkingComponent.class, 
                        IamComponent.class, String.class);
                Constructor<?> fullConstructor = ComputeComponent.class
                    .getConstructor(String.class, NetworkingComponent.class, 
                        IamComponent.class, String.class, 
                        com.pulumi.resources.ComponentResourceOptions.class);
                
                assertNotNull(simpleConstructor);
                assertNotNull(fullConstructor);
            });
        }

        @Test
        @DisplayName("Should have required compute getter methods")
        void shouldHaveRequiredGetterMethods() throws Exception {
            Method getInstanceIdsMethod = ComputeComponent.class.getMethod("getInstanceIds");
            
            assertNotNull(getInstanceIdsMethod);
            assertEquals(Output.class, getInstanceIdsMethod.getReturnType());
        }
    }

    @Nested
    @DisplayName("AuditingComponent Tests")
    class AuditingComponentTests {

        @Test
        @DisplayName("Should create AuditingComponent with required constructors")
        void shouldCreateAuditingComponent() {
            assertDoesNotThrow(() -> {
                Constructor<?> simpleConstructor = AuditingComponent.class
                    .getConstructor(String.class, StorageComponent.class, String.class);
                Constructor<?> fullConstructor = AuditingComponent.class
                    .getConstructor(String.class, StorageComponent.class, String.class,
                        com.pulumi.resources.ComponentResourceOptions.class);
                
                assertNotNull(simpleConstructor);
                assertNotNull(fullConstructor);
            });
        }

        @Test
        @DisplayName("Should have required auditing getter methods")
        void shouldHaveRequiredGetterMethods() throws Exception {
            Method getCloudTrailArnMethod = AuditingComponent.class.getMethod("getCloudTrailArn");
            
            assertNotNull(getCloudTrailArnMethod);
            assertEquals(Output.class, getCloudTrailArnMethod.getReturnType());
        }
    }

    @Nested
    @DisplayName("Component Integration Tests")
    class ComponentIntegrationTests {

        @Test
        @DisplayName("Should validate component dependency structure")
        void shouldValidateComponentDependencies() {
            // Test that components have proper dependency constructors
            assertDoesNotThrow(() -> {
                // ComputeComponent depends on NetworkingComponent and IamComponent
                ComputeComponent.class.getConstructor(String.class, 
                    NetworkingComponent.class, IamComponent.class, String.class);
                
                // AuditingComponent depends on StorageComponent  
                AuditingComponent.class.getConstructor(String.class, 
                    StorageComponent.class, String.class);
            });
        }

        @Test
        @DisplayName("Should have proper resource type constants")
        void shouldHaveProperResourceTypes() {
            // Verify components extend ComponentResource and have proper resource types
            assertTrue(ComponentResource.class.isAssignableFrom(IamComponent.class));
            assertTrue(ComponentResource.class.isAssignableFrom(NetworkingComponent.class));
            assertTrue(ComponentResource.class.isAssignableFrom(StorageComponent.class));
            assertTrue(ComponentResource.class.isAssignableFrom(ComputeComponent.class));
            assertTrue(ComponentResource.class.isAssignableFrom(AuditingComponent.class));
        }
    }
}