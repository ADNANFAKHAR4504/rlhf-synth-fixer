package imports.aws.cloudtrail;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail aws_cloudtrail}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.261Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudtrail.Cloudtrail")
public class Cloudtrail extends com.hashicorp.cdktf.TerraformResource {

    protected Cloudtrail(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Cloudtrail(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.cloudtrail.Cloudtrail.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail aws_cloudtrail} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Cloudtrail(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.cloudtrail.CloudtrailConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Cloudtrail resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Cloudtrail to import. This parameter is required.
     * @param importFromId The id of the existing Cloudtrail that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Cloudtrail to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cloudtrail.Cloudtrail.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Cloudtrail resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Cloudtrail to import. This parameter is required.
     * @param importFromId The id of the existing Cloudtrail that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cloudtrail.Cloudtrail.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAdvancedEventSelector(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.cloudtrail.CloudtrailAdvancedEventSelector>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.cloudtrail.CloudtrailAdvancedEventSelector> __cast_cd4240 = (java.util.List<imports.aws.cloudtrail.CloudtrailAdvancedEventSelector>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.cloudtrail.CloudtrailAdvancedEventSelector __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAdvancedEventSelector", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEventSelector(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.cloudtrail.CloudtrailEventSelector>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.cloudtrail.CloudtrailEventSelector> __cast_cd4240 = (java.util.List<imports.aws.cloudtrail.CloudtrailEventSelector>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.cloudtrail.CloudtrailEventSelector __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEventSelector", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putInsightSelector(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.cloudtrail.CloudtrailInsightSelector>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.cloudtrail.CloudtrailInsightSelector> __cast_cd4240 = (java.util.List<imports.aws.cloudtrail.CloudtrailInsightSelector>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.cloudtrail.CloudtrailInsightSelector __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putInsightSelector", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAdvancedEventSelector() {
        software.amazon.jsii.Kernel.call(this, "resetAdvancedEventSelector", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCloudWatchLogsGroupArn() {
        software.amazon.jsii.Kernel.call(this, "resetCloudWatchLogsGroupArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCloudWatchLogsRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetCloudWatchLogsRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableLogFileValidation() {
        software.amazon.jsii.Kernel.call(this, "resetEnableLogFileValidation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableLogging() {
        software.amazon.jsii.Kernel.call(this, "resetEnableLogging", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEventSelector() {
        software.amazon.jsii.Kernel.call(this, "resetEventSelector", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeGlobalServiceEvents() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeGlobalServiceEvents", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInsightSelector() {
        software.amazon.jsii.Kernel.call(this, "resetInsightSelector", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIsMultiRegionTrail() {
        software.amazon.jsii.Kernel.call(this, "resetIsMultiRegionTrail", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIsOrganizationTrail() {
        software.amazon.jsii.Kernel.call(this, "resetIsOrganizationTrail", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3KeyPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetS3KeyPrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnsTopicName() {
        software.amazon.jsii.Kernel.call(this, "resetSnsTopicName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull imports.aws.cloudtrail.CloudtrailAdvancedEventSelectorList getAdvancedEventSelector() {
        return software.amazon.jsii.Kernel.get(this, "advancedEventSelector", software.amazon.jsii.NativeType.forClass(imports.aws.cloudtrail.CloudtrailAdvancedEventSelectorList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudtrail.CloudtrailEventSelectorList getEventSelector() {
        return software.amazon.jsii.Kernel.get(this, "eventSelector", software.amazon.jsii.NativeType.forClass(imports.aws.cloudtrail.CloudtrailEventSelectorList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHomeRegion() {
        return software.amazon.jsii.Kernel.get(this, "homeRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudtrail.CloudtrailInsightSelectorList getInsightSelector() {
        return software.amazon.jsii.Kernel.get(this, "insightSelector", software.amazon.jsii.NativeType.forClass(imports.aws.cloudtrail.CloudtrailInsightSelectorList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSnsTopicArn() {
        return software.amazon.jsii.Kernel.get(this, "snsTopicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAdvancedEventSelectorInput() {
        return software.amazon.jsii.Kernel.get(this, "advancedEventSelectorInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCloudWatchLogsGroupArnInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudWatchLogsGroupArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCloudWatchLogsRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudWatchLogsRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableLogFileValidationInput() {
        return software.amazon.jsii.Kernel.get(this, "enableLogFileValidationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableLoggingInput() {
        return software.amazon.jsii.Kernel.get(this, "enableLoggingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEventSelectorInput() {
        return software.amazon.jsii.Kernel.get(this, "eventSelectorInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeGlobalServiceEventsInput() {
        return software.amazon.jsii.Kernel.get(this, "includeGlobalServiceEventsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInsightSelectorInput() {
        return software.amazon.jsii.Kernel.get(this, "insightSelectorInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIsMultiRegionTrailInput() {
        return software.amazon.jsii.Kernel.get(this, "isMultiRegionTrailInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIsOrganizationTrailInput() {
        return software.amazon.jsii.Kernel.get(this, "isOrganizationTrailInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3BucketNameInput() {
        return software.amazon.jsii.Kernel.get(this, "s3BucketNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3KeyPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "s3KeyPrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSnsTopicNameInput() {
        return software.amazon.jsii.Kernel.get(this, "snsTopicNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCloudWatchLogsGroupArn() {
        return software.amazon.jsii.Kernel.get(this, "cloudWatchLogsGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCloudWatchLogsGroupArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cloudWatchLogsGroupArn", java.util.Objects.requireNonNull(value, "cloudWatchLogsGroupArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCloudWatchLogsRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "cloudWatchLogsRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCloudWatchLogsRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cloudWatchLogsRoleArn", java.util.Objects.requireNonNull(value, "cloudWatchLogsRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableLogFileValidation() {
        return software.amazon.jsii.Kernel.get(this, "enableLogFileValidation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableLogFileValidation(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableLogFileValidation", java.util.Objects.requireNonNull(value, "enableLogFileValidation is required"));
    }

    public void setEnableLogFileValidation(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableLogFileValidation", java.util.Objects.requireNonNull(value, "enableLogFileValidation is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableLogging() {
        return software.amazon.jsii.Kernel.get(this, "enableLogging", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableLogging(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableLogging", java.util.Objects.requireNonNull(value, "enableLogging is required"));
    }

    public void setEnableLogging(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableLogging", java.util.Objects.requireNonNull(value, "enableLogging is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeGlobalServiceEvents() {
        return software.amazon.jsii.Kernel.get(this, "includeGlobalServiceEvents", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeGlobalServiceEvents(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeGlobalServiceEvents", java.util.Objects.requireNonNull(value, "includeGlobalServiceEvents is required"));
    }

    public void setIncludeGlobalServiceEvents(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeGlobalServiceEvents", java.util.Objects.requireNonNull(value, "includeGlobalServiceEvents is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIsMultiRegionTrail() {
        return software.amazon.jsii.Kernel.get(this, "isMultiRegionTrail", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIsMultiRegionTrail(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "isMultiRegionTrail", java.util.Objects.requireNonNull(value, "isMultiRegionTrail is required"));
    }

    public void setIsMultiRegionTrail(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "isMultiRegionTrail", java.util.Objects.requireNonNull(value, "isMultiRegionTrail is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIsOrganizationTrail() {
        return software.amazon.jsii.Kernel.get(this, "isOrganizationTrail", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIsOrganizationTrail(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "isOrganizationTrail", java.util.Objects.requireNonNull(value, "isOrganizationTrail is required"));
    }

    public void setIsOrganizationTrail(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "isOrganizationTrail", java.util.Objects.requireNonNull(value, "isOrganizationTrail is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyId", java.util.Objects.requireNonNull(value, "kmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3BucketName() {
        return software.amazon.jsii.Kernel.get(this, "s3BucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3BucketName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3BucketName", java.util.Objects.requireNonNull(value, "s3BucketName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3KeyPrefix() {
        return software.amazon.jsii.Kernel.get(this, "s3KeyPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3KeyPrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3KeyPrefix", java.util.Objects.requireNonNull(value, "s3KeyPrefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSnsTopicName() {
        return software.amazon.jsii.Kernel.get(this, "snsTopicName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSnsTopicName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "snsTopicName", java.util.Objects.requireNonNull(value, "snsTopicName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.cloudtrail.Cloudtrail}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.cloudtrail.Cloudtrail> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.cloudtrail.CloudtrailConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.cloudtrail.CloudtrailConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#name Cloudtrail#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#name Cloudtrail#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#s3_bucket_name Cloudtrail#s3_bucket_name}.
         * <p>
         * @return {@code this}
         * @param s3BucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#s3_bucket_name Cloudtrail#s3_bucket_name}. This parameter is required.
         */
        public Builder s3BucketName(final java.lang.String s3BucketName) {
            this.config.s3BucketName(s3BucketName);
            return this;
        }

        /**
         * advanced_event_selector block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#advanced_event_selector Cloudtrail#advanced_event_selector}
         * <p>
         * @return {@code this}
         * @param advancedEventSelector advanced_event_selector block. This parameter is required.
         */
        public Builder advancedEventSelector(final com.hashicorp.cdktf.IResolvable advancedEventSelector) {
            this.config.advancedEventSelector(advancedEventSelector);
            return this;
        }
        /**
         * advanced_event_selector block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#advanced_event_selector Cloudtrail#advanced_event_selector}
         * <p>
         * @return {@code this}
         * @param advancedEventSelector advanced_event_selector block. This parameter is required.
         */
        public Builder advancedEventSelector(final java.util.List<? extends imports.aws.cloudtrail.CloudtrailAdvancedEventSelector> advancedEventSelector) {
            this.config.advancedEventSelector(advancedEventSelector);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#cloud_watch_logs_group_arn Cloudtrail#cloud_watch_logs_group_arn}.
         * <p>
         * @return {@code this}
         * @param cloudWatchLogsGroupArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#cloud_watch_logs_group_arn Cloudtrail#cloud_watch_logs_group_arn}. This parameter is required.
         */
        public Builder cloudWatchLogsGroupArn(final java.lang.String cloudWatchLogsGroupArn) {
            this.config.cloudWatchLogsGroupArn(cloudWatchLogsGroupArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#cloud_watch_logs_role_arn Cloudtrail#cloud_watch_logs_role_arn}.
         * <p>
         * @return {@code this}
         * @param cloudWatchLogsRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#cloud_watch_logs_role_arn Cloudtrail#cloud_watch_logs_role_arn}. This parameter is required.
         */
        public Builder cloudWatchLogsRoleArn(final java.lang.String cloudWatchLogsRoleArn) {
            this.config.cloudWatchLogsRoleArn(cloudWatchLogsRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#enable_log_file_validation Cloudtrail#enable_log_file_validation}.
         * <p>
         * @return {@code this}
         * @param enableLogFileValidation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#enable_log_file_validation Cloudtrail#enable_log_file_validation}. This parameter is required.
         */
        public Builder enableLogFileValidation(final java.lang.Boolean enableLogFileValidation) {
            this.config.enableLogFileValidation(enableLogFileValidation);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#enable_log_file_validation Cloudtrail#enable_log_file_validation}.
         * <p>
         * @return {@code this}
         * @param enableLogFileValidation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#enable_log_file_validation Cloudtrail#enable_log_file_validation}. This parameter is required.
         */
        public Builder enableLogFileValidation(final com.hashicorp.cdktf.IResolvable enableLogFileValidation) {
            this.config.enableLogFileValidation(enableLogFileValidation);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#enable_logging Cloudtrail#enable_logging}.
         * <p>
         * @return {@code this}
         * @param enableLogging Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#enable_logging Cloudtrail#enable_logging}. This parameter is required.
         */
        public Builder enableLogging(final java.lang.Boolean enableLogging) {
            this.config.enableLogging(enableLogging);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#enable_logging Cloudtrail#enable_logging}.
         * <p>
         * @return {@code this}
         * @param enableLogging Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#enable_logging Cloudtrail#enable_logging}. This parameter is required.
         */
        public Builder enableLogging(final com.hashicorp.cdktf.IResolvable enableLogging) {
            this.config.enableLogging(enableLogging);
            return this;
        }

        /**
         * event_selector block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#event_selector Cloudtrail#event_selector}
         * <p>
         * @return {@code this}
         * @param eventSelector event_selector block. This parameter is required.
         */
        public Builder eventSelector(final com.hashicorp.cdktf.IResolvable eventSelector) {
            this.config.eventSelector(eventSelector);
            return this;
        }
        /**
         * event_selector block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#event_selector Cloudtrail#event_selector}
         * <p>
         * @return {@code this}
         * @param eventSelector event_selector block. This parameter is required.
         */
        public Builder eventSelector(final java.util.List<? extends imports.aws.cloudtrail.CloudtrailEventSelector> eventSelector) {
            this.config.eventSelector(eventSelector);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#id Cloudtrail#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#id Cloudtrail#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#include_global_service_events Cloudtrail#include_global_service_events}.
         * <p>
         * @return {@code this}
         * @param includeGlobalServiceEvents Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#include_global_service_events Cloudtrail#include_global_service_events}. This parameter is required.
         */
        public Builder includeGlobalServiceEvents(final java.lang.Boolean includeGlobalServiceEvents) {
            this.config.includeGlobalServiceEvents(includeGlobalServiceEvents);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#include_global_service_events Cloudtrail#include_global_service_events}.
         * <p>
         * @return {@code this}
         * @param includeGlobalServiceEvents Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#include_global_service_events Cloudtrail#include_global_service_events}. This parameter is required.
         */
        public Builder includeGlobalServiceEvents(final com.hashicorp.cdktf.IResolvable includeGlobalServiceEvents) {
            this.config.includeGlobalServiceEvents(includeGlobalServiceEvents);
            return this;
        }

        /**
         * insight_selector block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#insight_selector Cloudtrail#insight_selector}
         * <p>
         * @return {@code this}
         * @param insightSelector insight_selector block. This parameter is required.
         */
        public Builder insightSelector(final com.hashicorp.cdktf.IResolvable insightSelector) {
            this.config.insightSelector(insightSelector);
            return this;
        }
        /**
         * insight_selector block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#insight_selector Cloudtrail#insight_selector}
         * <p>
         * @return {@code this}
         * @param insightSelector insight_selector block. This parameter is required.
         */
        public Builder insightSelector(final java.util.List<? extends imports.aws.cloudtrail.CloudtrailInsightSelector> insightSelector) {
            this.config.insightSelector(insightSelector);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#is_multi_region_trail Cloudtrail#is_multi_region_trail}.
         * <p>
         * @return {@code this}
         * @param isMultiRegionTrail Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#is_multi_region_trail Cloudtrail#is_multi_region_trail}. This parameter is required.
         */
        public Builder isMultiRegionTrail(final java.lang.Boolean isMultiRegionTrail) {
            this.config.isMultiRegionTrail(isMultiRegionTrail);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#is_multi_region_trail Cloudtrail#is_multi_region_trail}.
         * <p>
         * @return {@code this}
         * @param isMultiRegionTrail Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#is_multi_region_trail Cloudtrail#is_multi_region_trail}. This parameter is required.
         */
        public Builder isMultiRegionTrail(final com.hashicorp.cdktf.IResolvable isMultiRegionTrail) {
            this.config.isMultiRegionTrail(isMultiRegionTrail);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#is_organization_trail Cloudtrail#is_organization_trail}.
         * <p>
         * @return {@code this}
         * @param isOrganizationTrail Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#is_organization_trail Cloudtrail#is_organization_trail}. This parameter is required.
         */
        public Builder isOrganizationTrail(final java.lang.Boolean isOrganizationTrail) {
            this.config.isOrganizationTrail(isOrganizationTrail);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#is_organization_trail Cloudtrail#is_organization_trail}.
         * <p>
         * @return {@code this}
         * @param isOrganizationTrail Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#is_organization_trail Cloudtrail#is_organization_trail}. This parameter is required.
         */
        public Builder isOrganizationTrail(final com.hashicorp.cdktf.IResolvable isOrganizationTrail) {
            this.config.isOrganizationTrail(isOrganizationTrail);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#kms_key_id Cloudtrail#kms_key_id}.
         * <p>
         * @return {@code this}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#kms_key_id Cloudtrail#kms_key_id}. This parameter is required.
         */
        public Builder kmsKeyId(final java.lang.String kmsKeyId) {
            this.config.kmsKeyId(kmsKeyId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#s3_key_prefix Cloudtrail#s3_key_prefix}.
         * <p>
         * @return {@code this}
         * @param s3KeyPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#s3_key_prefix Cloudtrail#s3_key_prefix}. This parameter is required.
         */
        public Builder s3KeyPrefix(final java.lang.String s3KeyPrefix) {
            this.config.s3KeyPrefix(s3KeyPrefix);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#sns_topic_name Cloudtrail#sns_topic_name}.
         * <p>
         * @return {@code this}
         * @param snsTopicName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#sns_topic_name Cloudtrail#sns_topic_name}. This parameter is required.
         */
        public Builder snsTopicName(final java.lang.String snsTopicName) {
            this.config.snsTopicName(snsTopicName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#tags Cloudtrail#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#tags Cloudtrail#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#tags_all Cloudtrail#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#tags_all Cloudtrail#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.cloudtrail.Cloudtrail}.
         */
        @Override
        public imports.aws.cloudtrail.Cloudtrail build() {
            return new imports.aws.cloudtrail.Cloudtrail(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
