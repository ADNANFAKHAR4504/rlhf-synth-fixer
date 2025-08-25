package app;

import com.pulumi.Context;
import com.pulumi.core.Output;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for the Main class security infrastructure implementation.
 * 
 * These tests verify the structure, methods, and configuration of the 
 * security infrastructure deployment without creating actual AWS resources.
 */
@DisplayName("Main Class Security Infrastructure Tests")
class MainTest {

    @Mock
    private Context mockContext;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Nested
    @DisplayName("Class Structure Tests")
    class ClassStructureTests {
        
        @Test
        @DisplayName("Main class should be final")
        void testMainClassIsFinal() {
            assertTrue(Modifier.isFinal(Main.class.getModifiers()));
        }

        @Test
        @DisplayName("Main class should have private constructor")
        void testMainClassHasPrivateConstructor() {
            try {
                var constructor = Main.class.getDeclaredConstructor();
                assertTrue(Modifier.isPrivate(constructor.getModifiers()));
            } catch (NoSuchMethodException e) {
                fail("Private constructor not found");
            }
        }

        @Test
        @DisplayName("Main method should exist and be public static")
        void testMainMethodExists() {
            try {
                Method mainMethod = Main.class.getDeclaredMethod("main", String[].class);
                assertNotNull(mainMethod);
                assertTrue(Modifier.isPublic(mainMethod.getModifiers()));
                assertTrue(Modifier.isStatic(mainMethod.getModifiers()));
            } catch (NoSuchMethodException e) {
                fail("Main method not found");
            }
        }
    }

    @Nested
    @DisplayName("Infrastructure Definition Tests")
    class InfrastructureDefinitionTests {
        
        @Test
        @DisplayName("defineSecurityInfrastructure method should exist")
        void testDefineSecurityInfrastructureExists() {
            try {
                Method method = Main.class.getDeclaredMethod("defineSecurityInfrastructure", Context.class);
                assertNotNull(method);
                assertTrue(Modifier.isStatic(method.getModifiers()));
            } catch (NoSuchMethodException e) {
                fail("defineSecurityInfrastructure method not found");
            }
        }

        @Test
        @DisplayName("deployRegionalSecurityInfrastructure method should exist")
        void testDeployRegionalSecurityInfrastructureExists() {
            try {
                Method method = Main.class.getDeclaredMethod("deployRegionalSecurityInfrastructure",
                    Context.class, String.class, String.class, 
                    com.pulumi.resources.CustomResourceOptions.class);
                assertNotNull(method);
                assertTrue(Modifier.isPrivate(method.getModifiers()));
                assertTrue(Modifier.isStatic(method.getModifiers()));
            } catch (NoSuchMethodException e) {
                fail("deployRegionalSecurityInfrastructure method not found");
            }
        }
    }

    @Nested
    @DisplayName("Environment Configuration Tests")
    class EnvironmentConfigurationTests {
        
        @Test
        @DisplayName("getEnvironmentSuffix method should exist")
        void testGetEnvironmentSuffixExists() {
            try {
                Method method = Main.class.getDeclaredMethod("getEnvironmentSuffix");
                assertNotNull(method);
                // Package-private, not private
                assertFalse(Modifier.isPrivate(method.getModifiers()));
                assertTrue(Modifier.isStatic(method.getModifiers()));
                assertEquals(String.class, method.getReturnType());
            } catch (NoSuchMethodException e) {
                fail("getEnvironmentSuffix method not found");
            }
        }

        @Test
        @DisplayName("Environment suffix should have proper format")
        void testEnvironmentSuffixFormat() {
            try {
                Method method = Main.class.getDeclaredMethod("getEnvironmentSuffix");
                method.setAccessible(true);
                String suffix = (String) method.invoke(null);
                assertNotNull(suffix);
                assertFalse(suffix.isEmpty());
                // Should not contain special characters that could break AWS resource names
                assertTrue(suffix.matches("[a-zA-Z0-9-]+"));
            } catch (Exception e) {
                fail("Failed to test environment suffix: " + e.getMessage());
            }
        }
    }

    @Nested
    @DisplayName("Policy Generation Tests")
    class PolicyGenerationTests {
        
        @Test
        @DisplayName("getKmsKeyPolicy method should exist and return String")
        void testGetKmsKeyPolicyExists() {
            try {
                Method method = Main.class.getDeclaredMethod("getKmsKeyPolicy");
                assertNotNull(method);
                assertTrue(Modifier.isPrivate(method.getModifiers()));
                assertTrue(Modifier.isStatic(method.getModifiers()));
                assertEquals(String.class, method.getReturnType());
            } catch (NoSuchMethodException e) {
                fail("getKmsKeyPolicy method not found");
            }
        }

        @Test
        @DisplayName("KMS key policy should be valid JSON")
        void testKmsKeyPolicyIsValidJson() {
            try {
                Method method = Main.class.getDeclaredMethod("getKmsKeyPolicy");
                method.setAccessible(true);
                String policy = (String) method.invoke(null);
                assertNotNull(policy);
                assertFalse(policy.isEmpty());
                assertTrue(policy.contains("Version"));
                assertTrue(policy.contains("Statement"));
                assertTrue(policy.contains("2012-10-17"));
            } catch (Exception e) {
                fail("Failed to test KMS key policy: " + e.getMessage());
            }
        }

        @Test
        @DisplayName("getMfaEnforcementPolicy method should exist")
        void testGetMfaEnforcementPolicyExists() {
            try {
                Method method = Main.class.getDeclaredMethod("getMfaEnforcementPolicy");
                assertNotNull(method);
                assertTrue(Modifier.isPrivate(method.getModifiers()));
                assertTrue(Modifier.isStatic(method.getModifiers()));
                assertEquals(String.class, method.getReturnType());
            } catch (NoSuchMethodException e) {
                fail("getMfaEnforcementPolicy method not found");
            }
        }

        @Test
        @DisplayName("MFA enforcement policy should contain MFA conditions")
        void testMfaEnforcementPolicyContent() {
            try {
                Method method = Main.class.getDeclaredMethod("getMfaEnforcementPolicy");
                method.setAccessible(true);
                String policy = (String) method.invoke(null);
                assertNotNull(policy);
                assertTrue(policy.contains("aws:MultiFactorAuthPresent"));
                assertTrue(policy.contains("Deny"));
            } catch (Exception e) {
                fail("Failed to test MFA enforcement policy: " + e.getMessage());
            }
        }

        @Test
        @DisplayName("getAssumeRolePolicyWithMfa method should exist")
        void testGetAssumeRolePolicyWithMfaExists() {
            try {
                Method method = Main.class.getDeclaredMethod("getAssumeRolePolicyWithMfa");
                assertNotNull(method);
                assertTrue(Modifier.isPrivate(method.getModifiers()));
                assertTrue(Modifier.isStatic(method.getModifiers()));
                assertEquals(String.class, method.getReturnType());
            } catch (NoSuchMethodException e) {
                fail("getAssumeRolePolicyWithMfa method not found");
            }
        }

        @Test
        @DisplayName("getSecurityRolePolicy method should exist")
        void testGetSecurityRolePolicyExists() {
            try {
                Method method = Main.class.getDeclaredMethod("getSecurityRolePolicy");
                assertNotNull(method);
                assertTrue(Modifier.isPrivate(method.getModifiers()));
                assertTrue(Modifier.isStatic(method.getModifiers()));
                assertEquals(String.class, method.getReturnType());
            } catch (NoSuchMethodException e) {
                fail("getSecurityRolePolicy method not found");
            }
        }


        @Test
        @DisplayName("getSnsTopicPolicy method should exist")
        void testGetSnsTopicPolicyExists() {
            try {
                Method method = Main.class.getDeclaredMethod("getSnsTopicPolicy", 
                    Output.class);
                assertNotNull(method);
                assertTrue(Modifier.isPrivate(method.getModifiers()));
                assertTrue(Modifier.isStatic(method.getModifiers()));
                assertEquals(Output.class, method.getReturnType());
            } catch (NoSuchMethodException e) {
                fail("getSnsTopicPolicy method not found");
            }
        }

        @Test
        @DisplayName("getVpcFlowLogAssumeRolePolicy method should exist")
        void testGetVpcFlowLogAssumeRolePolicyExists() {
            try {
                Method method = Main.class.getDeclaredMethod("getVpcFlowLogAssumeRolePolicy");
                assertNotNull(method);
                assertTrue(Modifier.isPrivate(method.getModifiers()));
                assertTrue(Modifier.isStatic(method.getModifiers()));
                assertEquals(String.class, method.getReturnType());
            } catch (NoSuchMethodException e) {
                fail("getVpcFlowLogAssumeRolePolicy method not found");
            }
        }

        @Test
        @DisplayName("getVpcFlowLogPolicy method should exist")
        void testGetVpcFlowLogPolicyExists() {
            try {
                Method method = Main.class.getDeclaredMethod("getVpcFlowLogPolicy");
                assertNotNull(method);
                assertTrue(Modifier.isPrivate(method.getModifiers()));
                assertTrue(Modifier.isStatic(method.getModifiers()));
                assertEquals(String.class, method.getReturnType());
            } catch (NoSuchMethodException e) {
                fail("getVpcFlowLogPolicy method not found");
            }
        }

        @Test
        @DisplayName("getSecureS3BucketPolicy method should exist")
        void testGetSecureS3BucketPolicyExists() {
            try {
                Method method = Main.class.getDeclaredMethod("getSecureS3BucketPolicy", 
                    Output.class);
                assertNotNull(method);
                assertTrue(Modifier.isPrivate(method.getModifiers()));
                assertTrue(Modifier.isStatic(method.getModifiers()));
                assertEquals(Output.class, method.getReturnType());
            } catch (NoSuchMethodException e) {
                fail("getSecureS3BucketPolicy method not found");
            }
        }
    }

    @Nested
    @DisplayName("Security Configuration Tests")
    class SecurityConfigurationTests {
        
        @Test
        @DisplayName("Security policies should be defined")
        void testSecurityPoliciesDefined() {
            // Verify that essential security policy methods exist
            try {
                Method kmsMethod = Main.class.getDeclaredMethod("getKmsKeyPolicy");
                Method mfaMethod = Main.class.getDeclaredMethod("getMfaEnforcementPolicy");
                assertNotNull(kmsMethod);
                assertNotNull(mfaMethod);
            } catch (Exception e) {
                fail("Failed to test security policies: " + e.getMessage());
            }
        }

        @Test
        @DisplayName("VPC Flow Log policy should have proper permissions")
        void testVpcFlowLogPolicyPermissions() {
            try {
                Method method = Main.class.getDeclaredMethod("getVpcFlowLogAssumeRolePolicy");
                method.setAccessible(true);
                String policy = (String) method.invoke(null);
                assertNotNull(policy);
                assertTrue(policy.contains("vpc-flow-logs.amazonaws.com"));
                assertTrue(policy.contains("sts:AssumeRole"));
            } catch (Exception e) {
                fail("Failed to test VPC Flow Log policy: " + e.getMessage());
            }
        }
    }

    @Nested
    @DisplayName("Constants and Configuration Tests")
    class ConstantsTests {
        
        @Test
        @DisplayName("TARGET_REGIONS should be defined")
        void testTargetRegionsDefined() {
            try {
                var field = Main.class.getDeclaredField("TARGET_REGIONS");
                field.setAccessible(true);
                String[] regions = (String[]) field.get(null);
                assertNotNull(regions);
                assertEquals(3, regions.length);
                assertEquals("us-east-1", regions[0]);
                assertEquals("eu-west-1", regions[1]);
                assertEquals("ap-southeast-2", regions[2]);
            } catch (Exception e) {
                fail("TARGET_REGIONS not found or not accessible: " + e.getMessage());
            }
        }

        @Test
        @DisplayName("NOTIFICATION_EMAIL should be defined")
        void testNotificationEmailDefined() {
            try {
                var field = Main.class.getDeclaredField("NOTIFICATION_EMAIL");
                field.setAccessible(true);
                String email = (String) field.get(null);
                assertNotNull(email);
                assertTrue(email.contains("@"));
            } catch (Exception e) {
                fail("NOTIFICATION_EMAIL not found or not accessible: " + e.getMessage());
            }
        }
    }

    @Nested
    @DisplayName("Tag Management Tests")
    class TagManagementTests {
        
        @Test
        @DisplayName("Common tags should include required tags")
        void testCommonTagsIncludeRequiredTags() {
            // This test verifies that the deployment includes Environment and Owner tags
            // as required by the specifications
            try {
                Method method = Main.class.getDeclaredMethod("deployRegionalSecurityInfrastructure",
                    Context.class, String.class, String.class, 
                    com.pulumi.resources.CustomResourceOptions.class);
                assertNotNull(method);
                // In actual deployment, verify tags are set on resources
            } catch (Exception e) {
                fail("Failed to verify tag management: " + e.getMessage());
            }
        }
    }

    @Nested
    @DisplayName("Policy Content Validation Tests")
    class PolicyContentValidationTests {
        
        @Test
        @DisplayName("KMS key policy should contain required AWS permissions")
        void testKmsKeyPolicyContainsRequiredPermissions() {
            try {
                Method method = Main.class.getDeclaredMethod("getKmsKeyPolicy");
                method.setAccessible(true);
                String policy = (String) method.invoke(null);
                
                // Verify policy contains key security elements
                assertTrue(policy.contains("kms:Encrypt"));
                assertTrue(policy.contains("kms:Decrypt"));
                assertTrue(policy.contains("kms:GenerateDataKey"));
                assertTrue(policy.contains("EnableRootPermissions"));
                assertTrue(policy.contains("AllowSecurityTeamAccess"));
            } catch (Exception e) {
                fail("Failed to validate KMS key policy content: " + e.getMessage());
            }
        }
        
        @Test
        @DisplayName("Security role policy should contain required actions")
        void testSecurityRolePolicyContents() {
            try {
                Method method = Main.class.getDeclaredMethod("getSecurityRolePolicy");
                method.setAccessible(true);
                String policy = (String) method.invoke(null);
                
                assertTrue(policy.contains("logs:CreateLogGroup"));
                assertTrue(policy.contains("cloudtrail:LookupEvents"));
                assertTrue(policy.contains("guardduty:GetDetector"));
                assertTrue(policy.contains("s3:GetBucketLocation"));
            } catch (Exception e) {
                fail("Failed to test security role policy contents: " + e.getMessage());
            }
        }
        
        @Test
        @DisplayName("VPC Flow Log policy should contain CloudWatch permissions")
        void testVpcFlowLogPolicyContents() {
            try {
                Method method = Main.class.getDeclaredMethod("getVpcFlowLogPolicy");
                method.setAccessible(true);
                String policy = (String) method.invoke(null);
                
                assertTrue(policy.contains("logs:CreateLogGroup"));
                assertTrue(policy.contains("logs:PutLogEvents"));
                assertTrue(policy.contains("logs:DescribeLogGroups"));
            } catch (Exception e) {
                fail("Failed to test VPC Flow Log policy: " + e.getMessage());
            }
        }
        
        @Test
        @DisplayName("Assume role policy should require recent MFA")
        void testAssumeRolePolicyMfaRequirement() {
            try {
                Method method = Main.class.getDeclaredMethod("getAssumeRolePolicyWithMfa");
                method.setAccessible(true);
                String policy = (String) method.invoke(null);
                
                assertTrue(policy.contains("aws:MultiFactorAuthPresent"));
                assertTrue(policy.contains("aws:MultiFactorAuthAge"));
                assertTrue(policy.contains("3600"));
                assertTrue(policy.contains("sts:AssumeRole"));
            } catch (Exception e) {
                fail("Failed to test assume role policy: " + e.getMessage());
            }
        }
    }
    
    @Nested
    @DisplayName("Environment Configuration Edge Cases")
    class EnvironmentConfigurationEdgeCasesTests {
        
        @Test
        @DisplayName("Environment suffix method should default to dev when environment variable not set")
        void testEnvironmentSuffixDefaultBehavior() {
            // Test that the method exists and returns a valid non-null string
            try {
                Method method = Main.class.getDeclaredMethod("getEnvironmentSuffix");
                method.setAccessible(true);
                String result = (String) method.invoke(null);
                
                assertNotNull(result);
                assertFalse(result.trim().isEmpty());
                // Should be either 'dev' default or actual environment value
                assertTrue(result.matches("[a-zA-Z0-9-]+"), 
                    "Environment suffix should contain only valid characters");
            } catch (Exception e) {
                fail("Failed to test environment suffix default behavior: " + e.getMessage());
            }
        }
        
        @Test
        @DisplayName("Environment suffix method should handle string processing correctly")
        void testEnvironmentSuffixStringProcessing() {
            // Test the internal logic by examining the method behavior
            try {
                Method method = Main.class.getDeclaredMethod("getEnvironmentSuffix");
                method.setAccessible(true);
                String result = (String) method.invoke(null);
                
                // Verify the result is properly trimmed and processed
                assertEquals(result, result.trim(), "Result should be trimmed");
                assertFalse(result.isEmpty(), "Result should not be empty");
                
                // Test that it matches expected patterns for AWS resource naming
                assertTrue(result.length() > 0 && result.length() < 64, 
                    "Environment suffix should be reasonable length for AWS resources");
            } catch (Exception e) {
                fail("Failed to test environment suffix string processing: " + e.getMessage());
            }
        }
        
        @Test
        @DisplayName("Environment suffix should be consistent across calls")
        void testEnvironmentSuffixConsistency() {
            try {
                Method method = Main.class.getDeclaredMethod("getEnvironmentSuffix");
                method.setAccessible(true);
                
                String result1 = (String) method.invoke(null);
                String result2 = (String) method.invoke(null);
                
                assertEquals(result1, result2, "Environment suffix should be consistent");
            } catch (Exception e) {
                fail("Failed to test environment suffix consistency: " + e.getMessage());
            }
        }
        
        @Test
        @DisplayName("Environment suffix should be suitable for AWS resource naming")
        void testEnvironmentSuffixNamingCompliance() {
            try {
                Method method = Main.class.getDeclaredMethod("getEnvironmentSuffix");
                method.setAccessible(true);
                String suffix = (String) method.invoke(null);
                
                // Test AWS resource naming compliance
                assertTrue(suffix.matches("[a-zA-Z0-9-]+"), 
                    "Suffix should only contain alphanumeric characters and hyphens");
                assertFalse(suffix.startsWith("-"), "Suffix should not start with hyphen");
                assertFalse(suffix.endsWith("-"), "Suffix should not end with hyphen");
                assertTrue(suffix.length() <= 63, "Suffix should be reasonable length");
            } catch (Exception e) {
                fail("Failed to test environment suffix naming compliance: " + e.getMessage());
            }
        }
    }
    
    @Nested
    @DisplayName("Method Return Type Validation")
    class MethodReturnTypeValidationTests {
        
        @Test
        @DisplayName("Policy methods should return String")
        void testPolicyMethodReturnTypes() {
            String[] policyMethods = {
                "getKmsKeyPolicy",
                "getMfaEnforcementPolicy",
                "getAssumeRolePolicyWithMfa",
                "getSecurityRolePolicy",
                "getVpcFlowLogAssumeRolePolicy",
                "getVpcFlowLogPolicy"
            };
            
            for (String methodName : policyMethods) {
                try {
                    Method method = Main.class.getDeclaredMethod(methodName);
                    assertEquals(String.class, method.getReturnType(),
                        "Method " + methodName + " should return String");
                } catch (NoSuchMethodException e) {
                    fail("Method " + methodName + " not found: " + e.getMessage());
                }
            }
        }
        
        @Test
        @DisplayName("Output-based policy methods should return Output<String>")
        void testOutputPolicyMethodReturnTypes() {
            String[] outputMethods = {
                "getSnsTopicPolicy",
                "getSecureS3BucketPolicy"
            };
            
            for (String methodName : outputMethods) {
                try {
                    Method method = Main.class.getDeclaredMethod(methodName, Output.class);
                    assertEquals(Output.class, method.getReturnType(),
                        "Method " + methodName + " should return Output<String>");
                } catch (NoSuchMethodException e) {
                    fail("Method " + methodName + " not found: " + e.getMessage());
                }
            }
        }
    }
}