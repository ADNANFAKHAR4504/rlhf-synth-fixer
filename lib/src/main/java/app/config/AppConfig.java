package app.config;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

/**
 * Application configuration class for the Pulumi Java infrastructure application.
 *
 * This class provides static access to configuration properties loaded from
 * the application.properties file located in the resources' directory.
 *
 * <p>Usage example:
 * <pre>
 * String appName = AppConfig.getApplicationName();
 * String primaryRegion = AppConfig.getPrimaryRegion();
 * </pre>
 *
 * @author Pulumi Java Template
 * @version 1.0
 * @since 1.0
 */
public class AppConfig {
    private static final Properties properties = new Properties();

    static {
        try (InputStream input = AppConfig.class.getClassLoader()
                .getResourceAsStream("application.properties")) {
            if (input != null) {
                properties.load(input);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to load configuration", e);
        }
    }

    public static String getPrimaryRegion() {
        return properties.getProperty("aws.primary.region");
    }

    public static String getSecondaryRegion() {
        return properties.getProperty("aws.secondary.region");
    }

    public static String getVpcCidrBlock() {
        return properties.getProperty("vpc.cidr.block");
    }

    public static String getPublicSubnetPrimaryCidr() {
        return properties.getProperty("subnet.public.primary.cidr");
    }

    public static String getPublicSubnetSecondaryCidr() {
        return properties.getProperty("subnet.public.secondary.cidr");
    }

    public static String getPrivateSubnetPrimaryCidr() {
        return properties.getProperty("subnet.private.primary.cidr");
    }

    public static String getPrivateSubnetSecondaryCidr() {
        return properties.getProperty("subnet.private.secondary.cidr");
    }

    public static String getEc2InstanceType() {
        return properties.getProperty("ec2.instance.type");
    }

    public static String getEc2AmiName() {
        return properties.getProperty("ec2.ami.name");
    }

    public static String getEc2AmiOwner() {
        return properties.getProperty("ec2.ami.owner");
    }

    public static String getS3BucketNamePrefix() {
        return properties.getProperty("s3.bucket.name.prefix");
    }

    public static String getS3WebsiteIndexDocument() {
        return properties.getProperty("s3.website.index.document");
    }

    public static String getS3WebsiteErrorDocument() {
        return properties.getProperty("s3.website.error.document");
    }

    public static String getDefaultEnvironment() {
        return properties.getProperty("default.environment");
    }

    public static String getProjectName() {
        return properties.getProperty("project.name");
    }

    public static String getStateBucketName() {
        return properties.getProperty("state.bucket.name");
    }
}