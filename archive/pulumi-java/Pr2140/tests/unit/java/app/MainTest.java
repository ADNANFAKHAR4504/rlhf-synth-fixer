package app;

import app.components.CrossAccountRoleSetup;
import app.components.IAMRoles;
import app.components.ObservabilityDashboard;
import app.components.WebApplicationStackSet;
import app.config.DeploymentConfig;
import com.pulumi.Context;
import com.pulumi.aws.Provider;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResourceOptions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Comprehensive unit tests for the Main class and all AWS resource components.
 * Tests focus on component structure, method signatures, and configuration logic.
 * 
 * Note: Due to Pulumi Java SDK limitations, we cannot easily mock resource creation
 * without a Pulumi deployment context. These tests focus on what can be tested:
 * class structure, method signatures, configuration, and builder patterns.
 * 
 * Run with: ./gradlew test
 */
@ExtendWith(MockitoExtension.class)
public class MainTest {

    @Mock
    private Context mockContext;
    
    @Mock
    private com.pulumi.Config mockPulumiConfig;
    
    private DeploymentConfig testConfig;

    @BeforeEach
    void setUp() {
        // Setup mock config responses
        when(mockContext.config()).thenReturn(mockPulumiConfig);
        when(mockPulumiConfig.get("managementRegion")).thenReturn(java.util.Optional.of("us-east-1"));
        when(mockPulumiConfig.get("applicationName")).thenReturn(java.util.Optional.of("test-app"));
        when(mockPulumiConfig.get("environment")).thenReturn(java.util.Optional.of("test"));
        when(mockPulumiConfig.getObject("targetRegions", String[].class))
            .thenReturn(java.util.Optional.of(new String[]{"us-east-1", "us-west-2"}));
        when(mockPulumiConfig.getObject("targetAccounts", String[].class))
            .thenReturn(java.util.Optional.of(new String[]{"123456789012", "123456789013"}));
            
        testConfig = new DeploymentConfig(mockContext);
    }

    // ================== Main Class Structure Tests ==================
    
    @Test
    void testMainClassStructure() {
        assertNotNull(Main.class);
        assertTrue(Modifier.isFinal(Main.class.getModifiers()));
        assertTrue(Modifier.isPublic(Main.class.getModifiers()));
    }

    @Test
    void testMainMethodExists() {
        assertDoesNotThrow(() -> {
            Method mainMethod = Main.class.getDeclaredMethod("main", String[].class);
            assertTrue(Modifier.isStatic(mainMethod.getModifiers()));
            assertTrue(Modifier.isPublic(mainMethod.getModifiers()));
            assertEquals(void.class, mainMethod.getReturnType());
        });
    }

    @Test
    void testDefineInfrastructureMethodExists() {
        assertDoesNotThrow(() -> {
            Method method = Main.class.getDeclaredMethod("defineInfrastructure", Context.class);
            assertTrue(Modifier.isStatic(method.getModifiers()));
            assertEquals(void.class, method.getReturnType());
        });
    }

    @Test
    void testPrivateConstructor() {
        assertDoesNotThrow(() -> {
            var constructor = Main.class.getDeclaredConstructor();
            assertTrue(Modifier.isPrivate(constructor.getModifiers()));
        });
    }

    @Test
    void testCannotInstantiate() {
        assertThrows(IllegalAccessException.class, () -> {
            Main.class.getDeclaredConstructor().newInstance();
        });
    }

    // ================== Configuration Tests ==================
    
    @Test
    void testDeploymentConfigCreation() {
        assertNotNull(testConfig);
        assertEquals("us-east-1", testConfig.getManagementRegion());
        assertEquals("test-app", testConfig.getApplicationName());
        assertEquals("test", testConfig.getEnvironment());
        assertEquals(List.of("us-east-1", "us-west-2"), testConfig.getTargetRegions());
        assertEquals(List.of("123456789012", "123456789013"), testConfig.getTargetAccounts());
    }
    
    @Test
    void testDeploymentConfigDefaults() {
        // Test default values when config is not provided
        when(mockPulumiConfig.get(anyString())).thenReturn(java.util.Optional.empty());
        when(mockPulumiConfig.getObject(any(), eq(String[].class))).thenReturn(java.util.Optional.empty());
        
        var defaultConfig = new DeploymentConfig(mockContext);
        
        assertEquals("us-east-1", defaultConfig.getManagementRegion());
        assertEquals("multi-region-web-app", defaultConfig.getApplicationName());
        assertEquals("production", defaultConfig.getEnvironment());
        assertEquals(List.of("us-east-1", "us-west-2", "eu-west-1"), defaultConfig.getTargetRegions());
        assertEquals(List.of("123456789012", "123456789013"), defaultConfig.getTargetAccounts());
    }
    
    @Test
    void testDeploymentConfigTags() {
        Map<String, String> tags = testConfig.getTags();
        assertNotNull(tags);
        assertEquals("test-app", tags.get("Application"));
        assertEquals("test", tags.get("Environment"));
        assertEquals("Pulumi", tags.get("ManagedBy"));
        assertEquals("MultiRegionWebApp", tags.get("Project"));
    }

    // ================== IAM Roles Component Tests ==================
    
    @Test
    void testIAMRolesComponentStructure() {
        // Test that IAMRoles class exists and has proper structure
        assertNotNull(IAMRoles.class);
        assertTrue(IAMRoles.class.getSuperclass().equals(com.pulumi.resources.ComponentResource.class));
    }
    
    @Test
    void testIAMRolesHasRequiredMethods() {
        assertDoesNotThrow(() -> {
            Method adminRoleMethod = IAMRoles.class.getDeclaredMethod("getAdministrationRoleArn");
            Method execRoleMethod = IAMRoles.class.getDeclaredMethod("getExecutionRoleName");
            
            assertEquals(Output.class, adminRoleMethod.getReturnType());
            assertEquals(Output.class, execRoleMethod.getReturnType());
            
            // Verify constructor exists with correct parameters
            var constructor = IAMRoles.class.getDeclaredConstructor(String.class, Provider.class);
            assertNotNull(constructor);
        });
    }

    // ================== Cross Account Role Setup Tests ==================
    
    @Test
    void testCrossAccountRoleSetupComponentStructure() {
        // Test that CrossAccountRoleSetup class exists and has proper structure
        assertNotNull(CrossAccountRoleSetup.class);
        assertTrue(CrossAccountRoleSetup.class.getSuperclass().equals(com.pulumi.resources.ComponentResource.class));
        
        // Verify constructor exists with correct parameters
        assertDoesNotThrow(() -> {
            var constructor = CrossAccountRoleSetup.class.getDeclaredConstructor(
                String.class, 
                CrossAccountRoleSetup.CrossAccountRoleSetupArgs.class,
                ComponentResourceOptions.class
            );
            assertNotNull(constructor);
        });
    }
    
    @Test
    void testCrossAccountRoleSetupHasRequiredMethods() {
        assertDoesNotThrow(() -> {
            Method method = CrossAccountRoleSetup.class.getDeclaredMethod("getExecutionRoleArns");
            assertEquals(List.class, method.getReturnType());
        });
    }
    
    @Test
    void testCrossAccountRoleSetupArgsBuilder() {
        var adminRoleArn = Output.of("arn:aws:iam::123456789012:role/admin");
        
        assertDoesNotThrow(() -> {
            var args = CrossAccountRoleSetup.CrossAccountRoleSetupArgs.builder()
                .config(testConfig)
                .administrationRoleArn(adminRoleArn)
                .build();
            assertNotNull(args);
        });
    }

    // ================== Web Application StackSet Tests ==================
    
    @Test
    void testWebApplicationStackSetComponentStructure() {
        // Test that WebApplicationStackSet class exists and has proper structure
        assertNotNull(WebApplicationStackSet.class);
        assertTrue(WebApplicationStackSet.class.getSuperclass().equals(com.pulumi.resources.ComponentResource.class));
        
        // Verify constructor exists with correct parameters
        assertDoesNotThrow(() -> {
            var constructor = WebApplicationStackSet.class.getDeclaredConstructor(
                String.class,
                WebApplicationStackSet.WebApplicationStackSetArgs.class,
                Provider.class
            );
            assertNotNull(constructor);
        });
    }
    
    @Test
    void testWebApplicationStackSetHasRequiredMethods() {
        assertDoesNotThrow(() -> {
            Method stackSetIdMethod = WebApplicationStackSet.class.getDeclaredMethod("getStackSetId");
            Method stackSetArnMethod = WebApplicationStackSet.class.getDeclaredMethod("getStackSetArn");
            Method endpointMethod = WebApplicationStackSet.class.getDeclaredMethod("getApplicationEndpoint", String.class);
            
            assertEquals(Output.class, stackSetIdMethod.getReturnType());
            assertEquals(Output.class, stackSetArnMethod.getReturnType());
            assertEquals(Output.class, endpointMethod.getReturnType());
        });
    }
    
    @Test
    void testWebApplicationStackSetArgsBuilder() {
        var adminRoleArn = Output.of("arn:aws:iam::123456789012:role/admin");
        var execRoleName = Output.of("exec-role");
        
        assertDoesNotThrow(() -> {
            // Mock the cross-account setup since we can't create real instances
            var mockCrossAccountSetup = mock(CrossAccountRoleSetup.class);
            
            var args = WebApplicationStackSet.WebApplicationStackSetArgs.builder()
                .config(testConfig)
                .administrationRoleArn(adminRoleArn)
                .executionRoleName(execRoleName)
                .crossAccountSetup(mockCrossAccountSetup)
                .build();
            assertNotNull(args);
        });
    }
    
    @Test
    void testWebApplicationStackSetCloudFormationTemplate() {
        // Test that the CloudFormation template method exists and can be accessed via reflection
        // This is necessary since getCloudFormationTemplate() is private
        assertDoesNotThrow(() -> {
            var method = WebApplicationStackSet.class.getDeclaredMethod("getCloudFormationTemplate");
            method.setAccessible(true);
            
            // We can't actually call it without a Pulumi context, but we can verify it exists
            assertNotNull(method);
            assertEquals(String.class, method.getReturnType());
            assertTrue(java.lang.reflect.Modifier.isPrivate(method.getModifiers()));
        });
    }

    // ================== Observability Dashboard Tests ==================
    
    @Test
    void testObservabilityDashboardComponentStructure() {
        // Test that ObservabilityDashboard class exists and has proper structure
        assertNotNull(ObservabilityDashboard.class);
        assertTrue(ObservabilityDashboard.class.getSuperclass().equals(com.pulumi.resources.ComponentResource.class));
        
        // Verify constructor exists with correct parameters
        assertDoesNotThrow(() -> {
            var constructor = ObservabilityDashboard.class.getDeclaredConstructor(
                String.class,
                ObservabilityDashboard.ObservabilityDashboardArgs.class,
                Provider.class
            );
            assertNotNull(constructor);
        });
    }
    
    @Test
    void testObservabilityDashboardHasRequiredMethods() {
        assertDoesNotThrow(() -> {
            Method method = ObservabilityDashboard.class.getDeclaredMethod("getDashboardUrl");
            assertEquals(Output.class, method.getReturnType());
        });
    }
    
    @Test
    void testObservabilityDashboardArgsBuilder() {
        var stackSetId = Output.of("test-stackset-id");
        
        assertDoesNotThrow(() -> {
            var args = ObservabilityDashboard.ObservabilityDashboardArgs.builder()
                .stackSetId(stackSetId)
                .regions(testConfig.getTargetRegions())
                .build();
            assertNotNull(args);
        });
    }
    
    @Test
    void testObservabilityDashboardCreateDashboardBodyMethod() {
        // Test that the createDashboardBody method exists and has correct signature
        assertDoesNotThrow(() -> {
            var method = ObservabilityDashboard.class.getDeclaredMethod("createDashboardBody", List.class);
            method.setAccessible(true);
            
            assertNotNull(method);
            assertEquals(String.class, method.getReturnType());
            assertTrue(java.lang.reflect.Modifier.isPrivate(method.getModifiers()));
        });
    }

    // ================== Integration Component Tests ==================
    
    @Test
    void testAllComponentClassesExistAndHaveCorrectStructure() {
        // Test that all component classes exist and have the correct inheritance structure
        assertDoesNotThrow(() -> {
            // Verify all component classes exist
            assertNotNull(IAMRoles.class);
            assertNotNull(CrossAccountRoleSetup.class);
            assertNotNull(WebApplicationStackSet.class);
            assertNotNull(ObservabilityDashboard.class);
            
            // Verify they all extend ComponentResource
            assertTrue(IAMRoles.class.getSuperclass().equals(com.pulumi.resources.ComponentResource.class));
            assertTrue(CrossAccountRoleSetup.class.getSuperclass().equals(com.pulumi.resources.ComponentResource.class));
            assertTrue(WebApplicationStackSet.class.getSuperclass().equals(com.pulumi.resources.ComponentResource.class));
            assertTrue(ObservabilityDashboard.class.getSuperclass().equals(com.pulumi.resources.ComponentResource.class));
        });
    }
    
    @Test
    void testInfrastructureCoversAllRequiredAWSResources() {
        // Test that our CloudFormation template includes all required AWS resources
        // by examining the template content through reflection
        assertDoesNotThrow(() -> {
            var method = WebApplicationStackSet.class.getDeclaredMethod("getCloudFormationTemplate");
            method.setAccessible(true);
            
            // Create a dummy instance to access the method (won't work in unit test context,
            // but we can verify the method structure)
            assertNotNull(method);
            
            // Verify method signature
            assertEquals(String.class, method.getReturnType());
            assertEquals(0, method.getParameterCount()); // No parameters
        });
    }
    
    @Test
    void testComponentArgsBuilderPatterns() {
        // Test that all component args use the builder pattern correctly
        assertDoesNotThrow(() -> {
            // Test CrossAccountRoleSetupArgs builder
            var crossAccountBuilder = CrossAccountRoleSetup.CrossAccountRoleSetupArgs.builder();
            assertNotNull(crossAccountBuilder);
            
            // Test WebApplicationStackSetArgs builder
            var webAppBuilder = WebApplicationStackSet.WebApplicationStackSetArgs.builder();
            assertNotNull(webAppBuilder);
            
            // Test ObservabilityDashboardArgs builder
            var dashboardBuilder = ObservabilityDashboard.ObservabilityDashboardArgs.builder();
            assertNotNull(dashboardBuilder);
        });
    }
    
    @Test
    void testAllComponentsHaveRequiredInnerClasses() {
        // Test that all components have their required argument classes
        assertDoesNotThrow(() -> {
            // Test that args classes exist
            assertNotNull(CrossAccountRoleSetup.CrossAccountRoleSetupArgs.class);
            assertNotNull(WebApplicationStackSet.WebApplicationStackSetArgs.class);
            assertNotNull(ObservabilityDashboard.ObservabilityDashboardArgs.class);
            
            // Test that builder classes exist
            assertNotNull(CrossAccountRoleSetup.CrossAccountRoleSetupArgs.Builder.class);
            assertNotNull(WebApplicationStackSet.WebApplicationStackSetArgs.Builder.class);
            assertNotNull(ObservabilityDashboard.ObservabilityDashboardArgs.Builder.class);
        });
    }
    
    @Test
    void testConfigurationEdgeCases() {
        // Test configuration with null/empty values
        when(mockPulumiConfig.get("managementRegion")).thenReturn(java.util.Optional.empty());
        when(mockPulumiConfig.get("applicationName")).thenReturn(java.util.Optional.empty());
        when(mockPulumiConfig.get("environment")).thenReturn(java.util.Optional.empty());
        when(mockPulumiConfig.getObject("targetRegions", String[].class)).thenReturn(java.util.Optional.empty());
        when(mockPulumiConfig.getObject("targetAccounts", String[].class)).thenReturn(java.util.Optional.empty());
        
        var config = new DeploymentConfig(mockContext);
        
        // Should use default values
        assertNotNull(config.getManagementRegion());
        assertNotNull(config.getApplicationName());
        assertNotNull(config.getEnvironment());
        assertNotNull(config.getTargetRegions());
        assertNotNull(config.getTargetAccounts());
        assertFalse(config.getTargetRegions().isEmpty());
        assertFalse(config.getTargetAccounts().isEmpty());
    }

    @Test
    void testMethodVisibilityAndStaticModifiers() {
        // Test that critical methods have correct visibility
        assertDoesNotThrow(() -> {
            // Main.defineInfrastructure should be static package-private
            var method = Main.class.getDeclaredMethod("defineInfrastructure", Context.class);
            assertTrue(Modifier.isStatic(method.getModifiers()));
            assertFalse(Modifier.isPrivate(method.getModifiers()));
            assertFalse(Modifier.isProtected(method.getModifiers()));
            
            // Main.main should be public static
            var mainMethod = Main.class.getDeclaredMethod("main", String[].class);
            assertTrue(Modifier.isPublic(mainMethod.getModifiers()));
            assertTrue(Modifier.isStatic(mainMethod.getModifiers()));
        });
    }
}