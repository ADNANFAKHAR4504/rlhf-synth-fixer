package app;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.customresources.*;
import software.amazon.awscdk.services.iam.*;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Collections;

public class GuardDutyStack extends Stack {

    private final AwsCustomResource guardDutyDetector;

    public GuardDutyStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // Step 1: Create a custom resource to list existing detectors
        AwsCustomResource listDetectors = new AwsCustomResource(this, "ListGuardDutyDetectors",
            AwsCustomResourceProps.builder()
                .onUpdate(AwsSdkCall.builder()
                    .service("GuardDuty")
                    .action("listDetectors")
                    .region(props.getEnv() != null ? props.getEnv().getRegion() : "us-east-1")
                    .physicalResourceId(PhysicalResourceId.of("guardduty-detectors-" + id))
                    .parameters(new HashMap<>())
                    .build())
                .policy(AwsCustomResourcePolicy.fromStatements(Arrays.asList(
                    PolicyStatement.Builder.create()
                        .actions(Arrays.asList("guardduty:ListDetectors"))
                        .resources(Arrays.asList("*"))
                        .effect(Effect.ALLOW)
                        .build()
                )))
                .build());

        // Step 2: Create a custom resource that will either create or update the detector
        Map<String, Object> detectorConfig = new HashMap<>();
        detectorConfig.put("Enable", true);
        detectorConfig.put("FindingPublishingFrequency", "FIFTEEN_MINUTES");
        
        Map<String, Object> s3LogsConfig = new HashMap<>();
        s3LogsConfig.put("Enable", true);
        
        Map<String, Object> kubernetesAuditLogsConfig = new HashMap<>();
        kubernetesAuditLogsConfig.put("Enable", true);
        
        Map<String, Object> scanEc2Config = new HashMap<>();
        scanEc2Config.put("EbsVolumes", true);
        
        Map<String, Object> kubernetesConfig = new HashMap<>();
        kubernetesConfig.put("AuditLogs", kubernetesAuditLogsConfig);
        
        Map<String, Object> malwareProtectionConfig = new HashMap<>();
        malwareProtectionConfig.put("ScanEc2InstanceWithFindings", scanEc2Config);
        
        Map<String, Object> dataSourcesConfig = new HashMap<>();
        dataSourcesConfig.put("S3Logs", s3LogsConfig);
        dataSourcesConfig.put("Kubernetes", kubernetesConfig);
        dataSourcesConfig.put("MalwareProtection", malwareProtectionConfig);
        
        detectorConfig.put("DataSources", dataSourcesConfig);
        
        // This is the main custom resource that handles detector creation/update
        this.guardDutyDetector = new AwsCustomResource(this, "ManageGuardDutyDetector",
            AwsCustomResourceProps.builder()
                .onUpdate(AwsSdkCall.builder()
                    .service("GuardDuty")
                    .action("createDetector") // We'll always try to create
                    .region(props.getEnv() != null ? props.getEnv().getRegion() : "us-east-1")
                    .parameters(detectorConfig)
                    // Set ignoreErrorCodesMatching to ignore AlreadyExists error
                    // This way the custom resource won't fail if a detector already exists
                    .ignoreErrorCodesMatching(".*AlreadyExistsException.*|.*BadRequestException.*")
                    .outputPaths(Arrays.asList("DetectorId")) // Extract detector ID from response if creation succeeds
                    // Use deterministic physical ID to prevent resource replacement during updates
                    .physicalResourceId(PhysicalResourceId.of("guardduty-detector-" + id))
                    .build())
                .policy(AwsCustomResourcePolicy.fromStatements(Arrays.asList(
                    PolicyStatement.Builder.create()
                        .actions(Arrays.asList(
                            "guardduty:CreateDetector", 
                            "guardduty:GetDetector",
                            "guardduty:UpdateDetector",
                            "guardduty:ListDetectors"
                        ))
                        .resources(Arrays.asList("*"))
                        .effect(Effect.ALLOW)
                        .build()
                )))
                .build());

        // Step 3: Update existing detectors using another custom resource
        // This is where we handle the case when a detector already exists
        AwsCustomResource updateExistingDetector = new AwsCustomResource(this, "UpdateExistingGuardDutyDetector",
            AwsCustomResourceProps.builder()
                .onUpdate(AwsSdkCall.builder()
                    .service("GuardDuty")
                    .action("updateDetector")
                    .region(props.getEnv() != null ? props.getEnv().getRegion() : "us-east-1")
                    .parameters(new HashMap<String, Object>() {{
                        put("DetectorId", listDetectors.getResponseField("DetectorIds.0")); // Use the first detector ID found
                        put("Enable", true);
                        put("FindingPublishingFrequency", "FIFTEEN_MINUTES");
                        put("DataSources", dataSourcesConfig);
                    }})
                    // This will only run if a detector ID is found in the list
                    // If the list is empty, this will be skipped
                    .ignoreErrorCodesMatching(".*ResourceNotFoundException.*|.*BadRequestException.*")
                    .physicalResourceId(PhysicalResourceId.of("guardduty-detector-update-" + id))
                    // Update a previous detector if one exists, but don't fail if there isn't one
                    .outputPaths(Arrays.asList("DetectorId")) // Extract detector ID from response
                    .build())
                .policy(AwsCustomResourcePolicy.fromStatements(Arrays.asList(
                    PolicyStatement.Builder.create()
                        .actions(Arrays.asList(
                            "guardduty:UpdateDetector",
                            "guardduty:GetDetector"
                        ))
                        .resources(Arrays.asList("*"))
                        .effect(Effect.ALLOW)
                        .build()
                )))
                .build());
                
        // Make sure the dependencies are set correctly for the custom resources:
        // 1. First list existing detectors
        // 2. Then try to create a detector (will be ignored if it already exists)
        // 3. Finally, update the existing detector with our configuration
        this.guardDutyDetector.getNode().addDependency(listDetectors);
        updateExistingDetector.getNode().addDependency(listDetectors);
        updateExistingDetector.getNode().addDependency(this.guardDutyDetector);
        
        this.addCommonTags();
    }

    private void addCommonTags() {
        Map<String, String> tags = Map.of(
                "Project", "CloudSecurity",
                "Environment", "Production"
        );
        tags.forEach((key, value) -> this.getNode().addMetadata(key, value));
    }

    public AwsCustomResource getGuardDutyDetector() {
        return guardDutyDetector;
    }
}
