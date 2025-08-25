package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.lang.reflect.InvocationTargetException;

/**
 * Unit tests for WebAppStack class.
 * Tests class structure, method signatures, and basic functionality.
 */
public class WebAppStackTest {

    @BeforeEach
    void setUp() {
        // Setup for each test
    }

    @Test
    void testClassIsFinal() {
        assertTrue(Modifier.isFinal(WebAppStack.class.getModifiers()));
    }

    @Test
    void testConstructorIsPrivate() {
        assertDoesNotThrow(() -> {
            Constructor<WebAppStack> constructor = WebAppStack.class.getDeclaredConstructor();
            assertTrue(Modifier.isPrivate(constructor.getModifiers()));
            
            constructor.setAccessible(true);
            assertThrows(InvocationTargetException.class, constructor::newInstance);
        });
    }

    @Test
    void testMainMethodExists() {
        assertDoesNotThrow(() -> {
            Method mainMethod = WebAppStack.class.getDeclaredMethod("main", String[].class);
            assertTrue(Modifier.isStatic(mainMethod.getModifiers()));
            assertTrue(Modifier.isPublic(mainMethod.getModifiers()));
            assertEquals(void.class, mainMethod.getReturnType());
        });
    }

    @Test
    void testStackMethodExists() {
        assertDoesNotThrow(() -> {
            Method stackMethod = WebAppStack.class.getDeclaredMethod("stack", com.pulumi.Context.class);
            assertTrue(Modifier.isStatic(stackMethod.getModifiers()));
            assertTrue(Modifier.isPublic(stackMethod.getModifiers()));
            assertEquals(void.class, stackMethod.getReturnType());
        });
    }

    @Test
    void testCreateNetworkResourcesMethodExists() {
        assertDoesNotThrow(() -> {
            Method method = WebAppStack.class.getDeclaredMethod("createNetworkResources", 
                String.class, java.util.Map.class);
            assertTrue(Modifier.isStatic(method.getModifiers()));
            assertTrue(Modifier.isPrivate(method.getModifiers()));
            assertEquals("NetworkResources", method.getReturnType().getSimpleName());
        });
    }

    @Test
    void testCreateSecurityResourcesMethodExists() {
        assertDoesNotThrow(() -> {
            Method method = WebAppStack.class.getDeclaredMethod("createSecurityResources", 
                String.class, java.util.Map.class, com.pulumi.aws.ec2.Vpc.class);
            assertTrue(Modifier.isStatic(method.getModifiers()));
            assertTrue(Modifier.isPrivate(method.getModifiers()));
            assertEquals("SecurityResources", method.getReturnType().getSimpleName());
        });
    }

    @Test
    void testCreateComputeResourcesMethodExists() {
        assertDoesNotThrow(() -> {
            // Find the method by searching through all declared methods
            Method[] methods = WebAppStack.class.getDeclaredMethods();
            Method computeMethod = null;
            for (Method method : methods) {
                if (method.getName().equals("createComputeResources")) {
                    computeMethod = method;
                    break;
                }
            }
            assertNotNull(computeMethod);
            assertTrue(Modifier.isStatic(computeMethod.getModifiers()));
            assertTrue(Modifier.isPrivate(computeMethod.getModifiers()));
            assertEquals("ComputeResources", computeMethod.getReturnType().getSimpleName());
        });
    }

    @Test
    void testCreateLoadBalancerResourcesMethodExists() {
        assertDoesNotThrow(() -> {
            Method[] methods = WebAppStack.class.getDeclaredMethods();
            Method lbMethod = null;
            for (Method method : methods) {
                if (method.getName().equals("createLoadBalancerResources")) {
                    lbMethod = method;
                    break;
                }
            }
            assertNotNull(lbMethod);
            assertTrue(Modifier.isStatic(lbMethod.getModifiers()));
            assertTrue(Modifier.isPrivate(lbMethod.getModifiers()));
            assertEquals("LoadBalancerResources", lbMethod.getReturnType().getSimpleName());
        });
    }

    @Test
    void testCreateAutoScalingResourcesMethodExists() {
        assertDoesNotThrow(() -> {
            Method[] methods = WebAppStack.class.getDeclaredMethods();
            Method asgMethod = null;
            for (Method method : methods) {
                if (method.getName().equals("createAutoScalingResources")) {
                    asgMethod = method;
                    break;
                }
            }
            assertNotNull(asgMethod);
            assertTrue(Modifier.isStatic(asgMethod.getModifiers()));
            assertTrue(Modifier.isPrivate(asgMethod.getModifiers()));
            assertEquals(void.class, asgMethod.getReturnType());
        });
    }

    @Test
    void testCreateStorageResourcesMethodExists() {
        assertDoesNotThrow(() -> {
            Method[] methods = WebAppStack.class.getDeclaredMethods();
            Method storageMethod = null;
            for (Method method : methods) {
                if (method.getName().equals("createStorageResources")) {
                    storageMethod = method;
                    break;
                }
            }
            assertNotNull(storageMethod);
            assertTrue(Modifier.isStatic(storageMethod.getModifiers()));
            assertTrue(Modifier.isPrivate(storageMethod.getModifiers()));
            assertEquals("StorageResources", storageMethod.getReturnType().getSimpleName());
        });
    }

    @Test
    void testCreateStackOutputsMethodExists() {
        assertDoesNotThrow(() -> {
            Method[] methods = WebAppStack.class.getDeclaredMethods();
            Method outputsMethod = null;
            for (Method method : methods) {
                if (method.getName().equals("createStackOutputs")) {
                    outputsMethod = method;
                    break;
                }
            }
            assertNotNull(outputsMethod);
            assertTrue(Modifier.isStatic(outputsMethod.getModifiers()));
            assertTrue(Modifier.isPrivate(outputsMethod.getModifiers()));
            assertEquals(void.class, outputsMethod.getReturnType());
        });
    }

    @Test
    void testInnerClassesExist() {
        Class<?>[] innerClasses = WebAppStack.class.getDeclaredClasses();
        assertTrue(innerClasses.length >= 5, "Should have at least 5 inner classes");
        
        boolean hasNetworkResources = false;
        boolean hasSecurityResources = false;
        boolean hasComputeResources = false;
        boolean hasLoadBalancerResources = false;
        boolean hasStorageResources = false;
        
        for (Class<?> innerClass : innerClasses) {
            String name = innerClass.getSimpleName();
            switch (name) {
                case "NetworkResources":
                    hasNetworkResources = true;
                    break;
                case "SecurityResources":
                    hasSecurityResources = true;
                    break;
                case "ComputeResources":
                    hasComputeResources = true;
                    break;
                case "LoadBalancerResources":
                    hasLoadBalancerResources = true;
                    break;
                case "StorageResources":
                    hasStorageResources = true;
                    break;
            }
        }
        
        assertTrue(hasNetworkResources, "Should have NetworkResources inner class");
        assertTrue(hasSecurityResources, "Should have SecurityResources inner class");
        assertTrue(hasComputeResources, "Should have ComputeResources inner class");
        assertTrue(hasLoadBalancerResources, "Should have LoadBalancerResources inner class");
        assertTrue(hasStorageResources, "Should have StorageResources inner class");
    }

    @Test
    void testInnerClassesAreFinalAndPrivate() {
        Class<?>[] innerClasses = WebAppStack.class.getDeclaredClasses();
        
        for (Class<?> innerClass : innerClasses) {
            assertTrue(Modifier.isFinal(innerClass.getModifiers()), 
                innerClass.getSimpleName() + " should be final");
            assertTrue(Modifier.isPrivate(innerClass.getModifiers()), 
                innerClass.getSimpleName() + " should be private");
            assertTrue(Modifier.isStatic(innerClass.getModifiers()), 
                innerClass.getSimpleName() + " should be static");
        }
    }

    @Test
    void testNetworkResourcesClassStructure() {
        assertDoesNotThrow(() -> {
            Class<?> networkResourcesClass = null;
            for (Class<?> innerClass : WebAppStack.class.getDeclaredClasses()) {
                if (innerClass.getSimpleName().equals("NetworkResources")) {
                    networkResourcesClass = innerClass;
                    break;
                }
            }
            assertNotNull(networkResourcesClass);
            
            // Check that it has the expected fields
            var fields = networkResourcesClass.getDeclaredFields();
            assertTrue(fields.length >= 4, "NetworkResources should have at least 4 fields");
            
            boolean hasVpc = false;
            boolean hasSubnet1 = false;
            boolean hasSubnet2 = false;
            for (var field : fields) {
                if (field.getName().equals("vpc")) hasVpc = true;
                if (field.getName().equals("publicSubnet1")) hasSubnet1 = true;
                if (field.getName().equals("publicSubnet2")) hasSubnet2 = true;
            }
            
            assertTrue(hasVpc, "NetworkResources should have vpc field");
            assertTrue(hasSubnet1, "NetworkResources should have publicSubnet1 field");
            assertTrue(hasSubnet2, "NetworkResources should have publicSubnet2 field");
        });
    }

    @Test
    void testSecurityResourcesClassStructure() {
        assertDoesNotThrow(() -> {
            Class<?> securityResourcesClass = null;
            for (Class<?> innerClass : WebAppStack.class.getDeclaredClasses()) {
                if (innerClass.getSimpleName().equals("SecurityResources")) {
                    securityResourcesClass = innerClass;
                    break;
                }
            }
            assertNotNull(securityResourcesClass);
            
            var fields = securityResourcesClass.getDeclaredFields();
            assertTrue(fields.length >= 3, "SecurityResources should have at least 3 fields");
            
            boolean hasAlbSg = false;
            boolean hasInstanceSg = false;
            boolean hasRole = false;
            for (var field : fields) {
                if (field.getName().equals("albSecurityGroup")) hasAlbSg = true;
                if (field.getName().equals("instanceSecurityGroup")) hasInstanceSg = true;
                if (field.getName().equals("instanceRole")) hasRole = true;
            }
            
            assertTrue(hasAlbSg, "SecurityResources should have albSecurityGroup field");
            assertTrue(hasInstanceSg, "SecurityResources should have instanceSecurityGroup field");
            assertTrue(hasRole, "SecurityResources should have instanceRole field");
        });
    }

    @Test
    void testComputeResourcesClassStructure() {
        assertDoesNotThrow(() -> {
            Class<?> computeResourcesClass = null;
            for (Class<?> innerClass : WebAppStack.class.getDeclaredClasses()) {
                if (innerClass.getSimpleName().equals("ComputeResources")) {
                    computeResourcesClass = innerClass;
                    break;
                }
            }
            assertNotNull(computeResourcesClass);
            
            var fields = computeResourcesClass.getDeclaredFields();
            assertTrue(fields.length >= 3, "ComputeResources should have at least 3 fields");
            
            boolean hasAmi = false;
            boolean hasLaunchTemplate = false;
            for (var field : fields) {
                if (field.getName().equals("ami")) hasAmi = true;
                if (field.getName().equals("launchTemplate")) hasLaunchTemplate = true;
            }
            
            assertTrue(hasAmi, "ComputeResources should have ami field");
            assertTrue(hasLaunchTemplate, "ComputeResources should have launchTemplate field");
        });
    }

    @Test
    void testLoadBalancerResourcesClassStructure() {
        assertDoesNotThrow(() -> {
            Class<?> lbResourcesClass = null;
            for (Class<?> innerClass : WebAppStack.class.getDeclaredClasses()) {
                if (innerClass.getSimpleName().equals("LoadBalancerResources")) {
                    lbResourcesClass = innerClass;
                    break;
                }
            }
            assertNotNull(lbResourcesClass);
            
            var fields = lbResourcesClass.getDeclaredFields();
            assertTrue(fields.length >= 3, "LoadBalancerResources should have at least 3 fields");
            
            boolean hasAlb = false;
            boolean hasTargetGroup = false;
            boolean hasListener = false;
            for (var field : fields) {
                if (field.getName().equals("alb")) hasAlb = true;
                if (field.getName().equals("targetGroup")) hasTargetGroup = true;
                if (field.getName().contains("Listener")) hasListener = true;
            }
            
            assertTrue(hasAlb, "LoadBalancerResources should have alb field");
            assertTrue(hasTargetGroup, "LoadBalancerResources should have targetGroup field");
            assertTrue(hasListener, "LoadBalancerResources should have listener fields");
        });
    }

    @Test
    void testStorageResourcesClassStructure() {
        assertDoesNotThrow(() -> {
            Class<?> storageResourcesClass = null;
            for (Class<?> innerClass : WebAppStack.class.getDeclaredClasses()) {
                if (innerClass.getSimpleName().equals("StorageResources")) {
                    storageResourcesClass = innerClass;
                    break;
                }
            }
            assertNotNull(storageResourcesClass);
            
            var fields = storageResourcesClass.getDeclaredFields();
            assertTrue(fields.length >= 2, "StorageResources should have at least 2 fields");
            
            boolean hasBucket = false;
            boolean hasBucketName = false;
            for (var field : fields) {
                if (field.getName().equals("codeBucket")) hasBucket = true;
                if (field.getName().equals("bucketName")) hasBucketName = true;
            }
            
            assertTrue(hasBucket, "StorageResources should have codeBucket field");
            assertTrue(hasBucketName, "StorageResources should have bucketName field");
        });
    }

    @Test
    void testMethodsAreWellStructured() {
        Method[] methods = WebAppStack.class.getDeclaredMethods();
        
        // Count methods by type
        int publicMethods = 0;
        int privateMethods = 0;
        int staticMethods = 0;
        
        for (Method method : methods) {
            if (Modifier.isPublic(method.getModifiers())) publicMethods++;
            if (Modifier.isPrivate(method.getModifiers())) privateMethods++;
            if (Modifier.isStatic(method.getModifiers())) staticMethods++;
        }
        
        // Should have main and stack as public methods, others private
        assertTrue(publicMethods >= 2, "Should have at least 2 public methods (main, stack)");
        assertTrue(privateMethods >= 5, "Should have several private helper methods");
        assertEquals(methods.length, staticMethods, "All methods should be static in utility class");
    }

    @Test
    void testClassHasNoPublicFields() {
        var fields = WebAppStack.class.getFields();
        assertEquals(0, fields.length, "WebAppStack should have no public fields");
    }

    @Test
    void testClassImplementsNoInterfaces() {
        var interfaces = WebAppStack.class.getInterfaces();
        assertEquals(0, interfaces.length, "WebAppStack should implement no interfaces");
    }

    @Test
    void testClassExtendsObject() {
        assertEquals(Object.class, WebAppStack.class.getSuperclass(), 
            "WebAppStack should extend Object directly");
    }
}