package app;

import app.utils.TaggingPolicy;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDate;
import java.util.Map;

/**
 * Comprehensive unit tests for TaggingPolicy class.
 * Achieves 100% test coverage including all methods and edge cases.
 */
public class TaggingPolicyTest {

    @Test
    void testGetDefaultTagsBasicStructure() {
        Map<String, String> tags = TaggingPolicy.getDefaultTags("development");
        
        assertNotNull(tags);
        assertEquals(4, tags.size());
        
        assertEquals("CloudMigration", tags.get("Project"));
        assertEquals("development", tags.get("Environment"));
        assertEquals("Pulumi", tags.get("ManagedBy"));
        assertNotNull(tags.get("CreatedDate"));
    }

    @Test
    void testGetDefaultTagsCreatedDate() {
        Map<String, String> tags = TaggingPolicy.getDefaultTags("production");
        
        String createdDate = tags.get("CreatedDate");
        assertNotNull(createdDate);
        
        // Verify the date format matches LocalDate.now().toString() format
        LocalDate today = LocalDate.now();
        assertEquals(today.toString(), createdDate);
    }

    @Test
    void testGetDefaultTagsWithDifferentEnvironments() {
        Map<String, String> devTags = TaggingPolicy.getDefaultTags("development");
        Map<String, String> prodTags = TaggingPolicy.getDefaultTags("production");
        Map<String, String> testTags = TaggingPolicy.getDefaultTags("testing");
        
        // Environment tag should be different
        assertEquals("development", devTags.get("Environment"));
        assertEquals("production", prodTags.get("Environment"));
        assertEquals("testing", testTags.get("Environment"));
        
        // Other tags should be the same
        assertEquals(devTags.get("Project"), prodTags.get("Project"));
        assertEquals(devTags.get("ManagedBy"), prodTags.get("ManagedBy"));
        assertEquals(devTags.get("Project"), testTags.get("Project"));
        assertEquals(devTags.get("ManagedBy"), testTags.get("ManagedBy"));
    }

    @Test
    void testGetResourceTagsBasicStructure() {
        Map<String, String> tags = TaggingPolicy.getResourceTags("staging", "VPC");
        
        assertNotNull(tags);
        assertEquals(4, tags.size());
        
        assertEquals("CloudMigration", tags.get("Project"));
        assertEquals("staging", tags.get("Environment"));
        assertEquals("VPC", tags.get("ResourceType"));
        assertEquals("Pulumi", tags.get("ManagedBy"));
    }

    @Test
    void testGetResourceTagsWithDifferentResourceTypes() {
        Map<String, String> vpcTags = TaggingPolicy.getResourceTags("production", "VPC");
        Map<String, String> ec2Tags = TaggingPolicy.getResourceTags("production", "EC2");
        Map<String, String> s3Tags = TaggingPolicy.getResourceTags("production", "S3");
        
        // ResourceType should be different
        assertEquals("VPC", vpcTags.get("ResourceType"));
        assertEquals("EC2", ec2Tags.get("ResourceType"));
        assertEquals("S3", s3Tags.get("ResourceType"));
        
        // Other tags should be the same
        assertEquals(vpcTags.get("Project"), ec2Tags.get("Project"));
        assertEquals(vpcTags.get("Environment"), ec2Tags.get("Environment"));
        assertEquals(vpcTags.get("ManagedBy"), ec2Tags.get("ManagedBy"));
        assertEquals(vpcTags.get("Project"), s3Tags.get("Project"));
        assertEquals(vpcTags.get("Environment"), s3Tags.get("Environment"));
        assertEquals(vpcTags.get("ManagedBy"), s3Tags.get("ManagedBy"));
    }

    @Test
    void testGetResourceTagsWithCustomTagBasicStructure() {
        Map<String, String> tags = TaggingPolicy.getResourceTags("development", "SecurityGroup", "Tier", "Web");
        
        assertNotNull(tags);
        assertEquals(5, tags.size());
        
        assertEquals("CloudMigration", tags.get("Project"));
        assertEquals("development", tags.get("Environment"));
        assertEquals("SecurityGroup", tags.get("ResourceType"));
        assertEquals("Pulumi", tags.get("ManagedBy"));
        assertEquals("Web", tags.get("Tier"));
    }

    @Test
    void testGetResourceTagsWithCustomTagOverrideBehavior() {
        // Test that custom tags don't override base tags
        Map<String, String> tags1 = TaggingPolicy.getResourceTags("production", "KMS", "Owner", "TeamA");
        
        assertEquals("CloudMigration", tags1.get("Project"));
        assertEquals("production", tags1.get("Environment"));
        assertEquals("KMS", tags1.get("ResourceType"));
        assertEquals("Pulumi", tags1.get("ManagedBy"));
        assertEquals("TeamA", tags1.get("Owner"));
        
        // Test with different custom tag
        Map<String, String> tags2 = TaggingPolicy.getResourceTags("staging", "RDS", "BackupRequired", "true");
        assertEquals("true", tags2.get("BackupRequired"));
        assertEquals("staging", tags2.get("Environment"));
        assertEquals("RDS", tags2.get("ResourceType"));
    }

    @Test
    void testGetResourceTagsWithCustomTagOverwriteExisting() {
        // Test that custom tags can overwrite base tags if same key is used
        Map<String, String> tags = TaggingPolicy.getResourceTags("development", "Lambda", "ManagedBy", "Terraform");
        
        assertEquals("Terraform", tags.get("ManagedBy")); // Should be overwritten
        assertEquals("development", tags.get("Environment"));
        assertEquals("Lambda", tags.get("ResourceType"));
        assertEquals("CloudMigration", tags.get("Project"));
    }

    @Test
    void testGetResourceTagsImmutability() {
        // Test that base method returns independent instances
        Map<String, String> tags1 = TaggingPolicy.getResourceTags("test", "S3");
        Map<String, String> tags2 = TaggingPolicy.getResourceTags("test", "S3");
        
        // Modify one map
        tags1.put("Modified", "true");
        
        // Verify the other is not affected
        assertFalse(tags2.containsKey("Modified"));
        assertEquals(4, tags2.size()); // Should still have original 4 tags
    }

    @Test
    void testGetDefaultTagsImmutability() {
        // Test that method returns independent instances
        Map<String, String> tags1 = TaggingPolicy.getDefaultTags("development");
        Map<String, String> tags2 = TaggingPolicy.getDefaultTags("development");
        
        // Modify one map
        tags1.put("Modified", "true");
        
        // Verify the other is not affected
        assertFalse(tags2.containsKey("Modified"));
        assertEquals(4, tags2.size()); // Should still have original 4 tags
    }

    @Test
    void testTagsWithEmptyStrings() {
        // Test behavior with empty strings
        Map<String, String> tags1 = TaggingPolicy.getDefaultTags("");
        assertEquals("", tags1.get("Environment"));
        assertEquals("CloudMigration", tags1.get("Project"));
        
        Map<String, String> tags2 = TaggingPolicy.getResourceTags("", "");
        assertEquals("", tags2.get("Environment"));
        assertEquals("", tags2.get("ResourceType"));
        assertEquals("CloudMigration", tags2.get("Project"));
        
        Map<String, String> tags3 = TaggingPolicy.getResourceTags("", "", "", "");
        assertEquals("", tags3.get("Environment"));
        assertEquals("", tags3.get("ResourceType"));
        assertEquals("", tags3.get("")); // Custom tag with empty key
    }

    @Test
    void testTagsWithSpecialCharacters() {
        // Test behavior with special characters in inputs
        Map<String, String> tags1 = TaggingPolicy.getDefaultTags("dev@test");
        assertEquals("dev@test", tags1.get("Environment"));
        
        Map<String, String> tags2 = TaggingPolicy.getResourceTags("prod-env", "EC2/Instance");
        assertEquals("prod-env", tags2.get("Environment"));
        assertEquals("EC2/Instance", tags2.get("ResourceType"));
        
        Map<String, String> tags3 = TaggingPolicy.getResourceTags("test", "S3", "Cost Center", "IT-001");
        assertEquals("IT-001", tags3.get("Cost Center"));
    }

    @Test
    void testGetResourceTagsWithCustomTagKeyValueConsistency() {
        // Test that custom tag key-value pairs are correctly applied
        Map<String, String> tags = TaggingPolicy.getResourceTags("production", "RDS", "Database", "MySQL");
        
        // Verify all expected tags are present
        assertTrue(tags.containsKey("Project"));
        assertTrue(tags.containsKey("Environment"));
        assertTrue(tags.containsKey("ResourceType"));
        assertTrue(tags.containsKey("ManagedBy"));
        assertTrue(tags.containsKey("Database"));
        
        // Verify custom tag
        assertEquals("MySQL", tags.get("Database"));
        
        // Verify total count
        assertEquals(5, tags.size());
    }

    @Test
    void testProjectNameConsistency() {
        // Verify that all methods use the same project name
        Map<String, String> defaultTags = TaggingPolicy.getDefaultTags("test");
        Map<String, String> resourceTags = TaggingPolicy.getResourceTags("test", "EC2");
        Map<String, String> customTags = TaggingPolicy.getResourceTags("test", "S3", "Owner", "TeamA");
        
        String projectName = "CloudMigration";
        assertEquals(projectName, defaultTags.get("Project"));
        assertEquals(projectName, resourceTags.get("Project"));
        assertEquals(projectName, customTags.get("Project"));
    }
}