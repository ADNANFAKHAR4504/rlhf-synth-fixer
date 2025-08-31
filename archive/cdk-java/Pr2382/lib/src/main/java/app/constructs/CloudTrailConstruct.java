package app.constructs;

import software.amazon.awscdk.services.cloudtrail.Trail;
import software.amazon.awscdk.services.cloudtrail.ReadWriteType;
import software.amazon.awscdk.services.s3.IBucket;
import software.amazon.awscdk.services.kms.IKey;
import software.amazon.awscdk.services.logs.LogGroup;
import software.amazon.awscdk.services.logs.RetentionDays;
import software.constructs.Construct;
import java.util.UUID;
import app.config.EnvironmentConfig;

/**
 * CloudTrail construct that implements comprehensive logging and monitoring.
 * This construct creates CloudTrail with encryption, log file validation,
 * and CloudWatch integration for real-time monitoring.
 */
public class CloudTrailConstruct extends Construct {
    
    private final Trail cloudTrail;
    private final LogGroup logGroup;
    
    public CloudTrailConstruct(final Construct scope, final String id, 
                              final IBucket s3Bucket, final IKey kmsKey) {
        super(scope, id);
        
        // Create CloudWatch log group for CloudTrail
        this.logGroup = createLogGroup(kmsKey);
        
        // Create CloudTrail with comprehensive logging
        this.cloudTrail = createCloudTrail(s3Bucket, kmsKey);
    }
    
    /**
     * Creates a CloudWatch log group for CloudTrail logs with encryption.
     */
    private LogGroup createLogGroup(final IKey kmsKey) {
    // Use a short random suffix on the physical log group name to avoid
    // collisions with existing global log group names in other accounts/environments.
    final String randomSuffix = UUID.randomUUID().toString().substring(0, 8);
    final String physicalName = EnvironmentConfig.getResourceName("cloudtrail", "log-group") + "-" + randomSuffix;

    return LogGroup.Builder.create(this, EnvironmentConfig.getResourceName("cloudtrail", "log-group"))
        .logGroupName(physicalName)
        .retention(RetentionDays.ONE_YEAR) // Retain logs for compliance
        .encryptionKey(kmsKey)
        .build();
    }
    
    /**
     * Creates CloudTrail with comprehensive security and monitoring settings.
     */
    private Trail createCloudTrail(final IBucket s3Bucket, final IKey kmsKey) {
        // Create a basic multi-region CloudTrail with file validation and CloudWatch integration.
        return Trail.Builder.create(this, EnvironmentConfig.getResourceName("cloudtrail", "trail"))
                .trailName(EnvironmentConfig.getResourceName("cloudtrail", "trail"))
                .bucket(s3Bucket)
                .s3KeyPrefix("cloudtrail-logs/")
                .cloudWatchLogGroup(logGroup)
                .enableFileValidation(true)
                .includeGlobalServiceEvents(true)
                .isMultiRegionTrail(true)
                .managementEvents(ReadWriteType.ALL)
                .build();
    }
    
    // Getters
    public Trail getCloudTrail() { return cloudTrail; }
    public LogGroup getLogGroup() { return logGroup; }
}