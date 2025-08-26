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

    /**
     * Gets the application name from configuration.
     * 
     * @return the application name
     */
    public static String getApplicationName() {
        return properties.getProperty("app.name");
    }

    /**
     * Gets the application version from configuration.
     * 
     * @return the application version
     */
    public static String getApplicationVersion() {
        return properties.getProperty("app.version");
    }

    /**
     * Gets the application description from configuration.
     * 
     * @return the application description
     */
    public static String getApplicationDescription() {
        return properties.getProperty("app.description");
    }

    /**
     * Gets the primary AWS region from configuration.
     * 
     * @return the primary AWS region
     */
    public static String getPrimaryRegion() {
        return properties.getProperty("aws.primary.region");
    }

    /**
     * Gets the secondary AWS region from configuration.
     * 
     * @return the secondary AWS region
     */
    public static String getSecondaryRegion() {
        return properties.getProperty("aws.secondary.region");
    }
}