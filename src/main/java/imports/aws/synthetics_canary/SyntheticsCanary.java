package imports.aws.synthetics_canary;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary aws_synthetics_canary}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.537Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.syntheticsCanary.SyntheticsCanary")
public class SyntheticsCanary extends com.hashicorp.cdktf.TerraformResource {

    protected SyntheticsCanary(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SyntheticsCanary(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.synthetics_canary.SyntheticsCanary.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary aws_synthetics_canary} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public SyntheticsCanary(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.synthetics_canary.SyntheticsCanaryConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a SyntheticsCanary resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SyntheticsCanary to import. This parameter is required.
     * @param importFromId The id of the existing SyntheticsCanary that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the SyntheticsCanary to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.synthetics_canary.SyntheticsCanary.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a SyntheticsCanary resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SyntheticsCanary to import. This parameter is required.
     * @param importFromId The id of the existing SyntheticsCanary that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.synthetics_canary.SyntheticsCanary.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putArtifactConfig(final @org.jetbrains.annotations.NotNull imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfig value) {
        software.amazon.jsii.Kernel.call(this, "putArtifactConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRunConfig(final @org.jetbrains.annotations.NotNull imports.aws.synthetics_canary.SyntheticsCanaryRunConfig value) {
        software.amazon.jsii.Kernel.call(this, "putRunConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSchedule(final @org.jetbrains.annotations.NotNull imports.aws.synthetics_canary.SyntheticsCanarySchedule value) {
        software.amazon.jsii.Kernel.call(this, "putSchedule", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVpcConfig(final @org.jetbrains.annotations.NotNull imports.aws.synthetics_canary.SyntheticsCanaryVpcConfig value) {
        software.amazon.jsii.Kernel.call(this, "putVpcConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetArtifactConfig() {
        software.amazon.jsii.Kernel.call(this, "resetArtifactConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeleteLambda() {
        software.amazon.jsii.Kernel.call(this, "resetDeleteLambda", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFailureRetentionPeriod() {
        software.amazon.jsii.Kernel.call(this, "resetFailureRetentionPeriod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRunConfig() {
        software.amazon.jsii.Kernel.call(this, "resetRunConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3Bucket() {
        software.amazon.jsii.Kernel.call(this, "resetS3Bucket", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3Key() {
        software.amazon.jsii.Kernel.call(this, "resetS3Key", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3Version() {
        software.amazon.jsii.Kernel.call(this, "resetS3Version", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStartCanary() {
        software.amazon.jsii.Kernel.call(this, "resetStartCanary", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSuccessRetentionPeriod() {
        software.amazon.jsii.Kernel.call(this, "resetSuccessRetentionPeriod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcConfig() {
        software.amazon.jsii.Kernel.call(this, "resetVpcConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetZipFile() {
        software.amazon.jsii.Kernel.call(this, "resetZipFile", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfigOutputReference getArtifactConfig() {
        return software.amazon.jsii.Kernel.get(this, "artifactConfig", software.amazon.jsii.NativeType.forClass(imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngineArn() {
        return software.amazon.jsii.Kernel.get(this, "engineArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.synthetics_canary.SyntheticsCanaryRunConfigOutputReference getRunConfig() {
        return software.amazon.jsii.Kernel.get(this, "runConfig", software.amazon.jsii.NativeType.forClass(imports.aws.synthetics_canary.SyntheticsCanaryRunConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.synthetics_canary.SyntheticsCanaryScheduleOutputReference getSchedule() {
        return software.amazon.jsii.Kernel.get(this, "schedule", software.amazon.jsii.NativeType.forClass(imports.aws.synthetics_canary.SyntheticsCanaryScheduleOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceLocationArn() {
        return software.amazon.jsii.Kernel.get(this, "sourceLocationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.synthetics_canary.SyntheticsCanaryTimelineList getTimeline() {
        return software.amazon.jsii.Kernel.get(this, "timeline", software.amazon.jsii.NativeType.forClass(imports.aws.synthetics_canary.SyntheticsCanaryTimelineList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.synthetics_canary.SyntheticsCanaryVpcConfigOutputReference getVpcConfig() {
        return software.amazon.jsii.Kernel.get(this, "vpcConfig", software.amazon.jsii.NativeType.forClass(imports.aws.synthetics_canary.SyntheticsCanaryVpcConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfig getArtifactConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "artifactConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getArtifactS3LocationInput() {
        return software.amazon.jsii.Kernel.get(this, "artifactS3LocationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDeleteLambdaInput() {
        return software.amazon.jsii.Kernel.get(this, "deleteLambdaInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExecutionRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "executionRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getFailureRetentionPeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "failureRetentionPeriodInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHandlerInput() {
        return software.amazon.jsii.Kernel.get(this, "handlerInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.synthetics_canary.SyntheticsCanaryRunConfig getRunConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "runConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.synthetics_canary.SyntheticsCanaryRunConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRuntimeVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "runtimeVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3BucketInput() {
        return software.amazon.jsii.Kernel.get(this, "s3BucketInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3KeyInput() {
        return software.amazon.jsii.Kernel.get(this, "s3KeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3VersionInput() {
        return software.amazon.jsii.Kernel.get(this, "s3VersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.synthetics_canary.SyntheticsCanarySchedule getScheduleInput() {
        return software.amazon.jsii.Kernel.get(this, "scheduleInput", software.amazon.jsii.NativeType.forClass(imports.aws.synthetics_canary.SyntheticsCanarySchedule.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getStartCanaryInput() {
        return software.amazon.jsii.Kernel.get(this, "startCanaryInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSuccessRetentionPeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "successRetentionPeriodInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.synthetics_canary.SyntheticsCanaryVpcConfig getVpcConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.synthetics_canary.SyntheticsCanaryVpcConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getZipFileInput() {
        return software.amazon.jsii.Kernel.get(this, "zipFileInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArtifactS3Location() {
        return software.amazon.jsii.Kernel.get(this, "artifactS3Location", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setArtifactS3Location(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "artifactS3Location", java.util.Objects.requireNonNull(value, "artifactS3Location is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDeleteLambda() {
        return software.amazon.jsii.Kernel.get(this, "deleteLambda", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDeleteLambda(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "deleteLambda", java.util.Objects.requireNonNull(value, "deleteLambda is required"));
    }

    public void setDeleteLambda(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "deleteLambda", java.util.Objects.requireNonNull(value, "deleteLambda is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExecutionRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "executionRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExecutionRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "executionRoleArn", java.util.Objects.requireNonNull(value, "executionRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getFailureRetentionPeriod() {
        return software.amazon.jsii.Kernel.get(this, "failureRetentionPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setFailureRetentionPeriod(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "failureRetentionPeriod", java.util.Objects.requireNonNull(value, "failureRetentionPeriod is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHandler() {
        return software.amazon.jsii.Kernel.get(this, "handler", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHandler(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "handler", java.util.Objects.requireNonNull(value, "handler is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRuntimeVersion() {
        return software.amazon.jsii.Kernel.get(this, "runtimeVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRuntimeVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "runtimeVersion", java.util.Objects.requireNonNull(value, "runtimeVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3Bucket() {
        return software.amazon.jsii.Kernel.get(this, "s3Bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3Bucket(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3Bucket", java.util.Objects.requireNonNull(value, "s3Bucket is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3Key() {
        return software.amazon.jsii.Kernel.get(this, "s3Key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3Key(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3Key", java.util.Objects.requireNonNull(value, "s3Key is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3Version() {
        return software.amazon.jsii.Kernel.get(this, "s3Version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3Version(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3Version", java.util.Objects.requireNonNull(value, "s3Version is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getStartCanary() {
        return software.amazon.jsii.Kernel.get(this, "startCanary", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setStartCanary(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "startCanary", java.util.Objects.requireNonNull(value, "startCanary is required"));
    }

    public void setStartCanary(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "startCanary", java.util.Objects.requireNonNull(value, "startCanary is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSuccessRetentionPeriod() {
        return software.amazon.jsii.Kernel.get(this, "successRetentionPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSuccessRetentionPeriod(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "successRetentionPeriod", java.util.Objects.requireNonNull(value, "successRetentionPeriod is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getZipFile() {
        return software.amazon.jsii.Kernel.get(this, "zipFile", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setZipFile(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "zipFile", java.util.Objects.requireNonNull(value, "zipFile is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.synthetics_canary.SyntheticsCanary}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.synthetics_canary.SyntheticsCanary> {
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
        private final imports.aws.synthetics_canary.SyntheticsCanaryConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.synthetics_canary.SyntheticsCanaryConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#artifact_s3_location SyntheticsCanary#artifact_s3_location}.
         * <p>
         * @return {@code this}
         * @param artifactS3Location Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#artifact_s3_location SyntheticsCanary#artifact_s3_location}. This parameter is required.
         */
        public Builder artifactS3Location(final java.lang.String artifactS3Location) {
            this.config.artifactS3Location(artifactS3Location);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#execution_role_arn SyntheticsCanary#execution_role_arn}.
         * <p>
         * @return {@code this}
         * @param executionRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#execution_role_arn SyntheticsCanary#execution_role_arn}. This parameter is required.
         */
        public Builder executionRoleArn(final java.lang.String executionRoleArn) {
            this.config.executionRoleArn(executionRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#handler SyntheticsCanary#handler}.
         * <p>
         * @return {@code this}
         * @param handler Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#handler SyntheticsCanary#handler}. This parameter is required.
         */
        public Builder handler(final java.lang.String handler) {
            this.config.handler(handler);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#name SyntheticsCanary#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#name SyntheticsCanary#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#runtime_version SyntheticsCanary#runtime_version}.
         * <p>
         * @return {@code this}
         * @param runtimeVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#runtime_version SyntheticsCanary#runtime_version}. This parameter is required.
         */
        public Builder runtimeVersion(final java.lang.String runtimeVersion) {
            this.config.runtimeVersion(runtimeVersion);
            return this;
        }

        /**
         * schedule block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#schedule SyntheticsCanary#schedule}
         * <p>
         * @return {@code this}
         * @param schedule schedule block. This parameter is required.
         */
        public Builder schedule(final imports.aws.synthetics_canary.SyntheticsCanarySchedule schedule) {
            this.config.schedule(schedule);
            return this;
        }

        /**
         * artifact_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#artifact_config SyntheticsCanary#artifact_config}
         * <p>
         * @return {@code this}
         * @param artifactConfig artifact_config block. This parameter is required.
         */
        public Builder artifactConfig(final imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfig artifactConfig) {
            this.config.artifactConfig(artifactConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#delete_lambda SyntheticsCanary#delete_lambda}.
         * <p>
         * @return {@code this}
         * @param deleteLambda Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#delete_lambda SyntheticsCanary#delete_lambda}. This parameter is required.
         */
        public Builder deleteLambda(final java.lang.Boolean deleteLambda) {
            this.config.deleteLambda(deleteLambda);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#delete_lambda SyntheticsCanary#delete_lambda}.
         * <p>
         * @return {@code this}
         * @param deleteLambda Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#delete_lambda SyntheticsCanary#delete_lambda}. This parameter is required.
         */
        public Builder deleteLambda(final com.hashicorp.cdktf.IResolvable deleteLambda) {
            this.config.deleteLambda(deleteLambda);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#failure_retention_period SyntheticsCanary#failure_retention_period}.
         * <p>
         * @return {@code this}
         * @param failureRetentionPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#failure_retention_period SyntheticsCanary#failure_retention_period}. This parameter is required.
         */
        public Builder failureRetentionPeriod(final java.lang.Number failureRetentionPeriod) {
            this.config.failureRetentionPeriod(failureRetentionPeriod);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#id SyntheticsCanary#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#id SyntheticsCanary#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * run_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#run_config SyntheticsCanary#run_config}
         * <p>
         * @return {@code this}
         * @param runConfig run_config block. This parameter is required.
         */
        public Builder runConfig(final imports.aws.synthetics_canary.SyntheticsCanaryRunConfig runConfig) {
            this.config.runConfig(runConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#s3_bucket SyntheticsCanary#s3_bucket}.
         * <p>
         * @return {@code this}
         * @param s3Bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#s3_bucket SyntheticsCanary#s3_bucket}. This parameter is required.
         */
        public Builder s3Bucket(final java.lang.String s3Bucket) {
            this.config.s3Bucket(s3Bucket);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#s3_key SyntheticsCanary#s3_key}.
         * <p>
         * @return {@code this}
         * @param s3Key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#s3_key SyntheticsCanary#s3_key}. This parameter is required.
         */
        public Builder s3Key(final java.lang.String s3Key) {
            this.config.s3Key(s3Key);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#s3_version SyntheticsCanary#s3_version}.
         * <p>
         * @return {@code this}
         * @param s3Version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#s3_version SyntheticsCanary#s3_version}. This parameter is required.
         */
        public Builder s3Version(final java.lang.String s3Version) {
            this.config.s3Version(s3Version);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#start_canary SyntheticsCanary#start_canary}.
         * <p>
         * @return {@code this}
         * @param startCanary Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#start_canary SyntheticsCanary#start_canary}. This parameter is required.
         */
        public Builder startCanary(final java.lang.Boolean startCanary) {
            this.config.startCanary(startCanary);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#start_canary SyntheticsCanary#start_canary}.
         * <p>
         * @return {@code this}
         * @param startCanary Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#start_canary SyntheticsCanary#start_canary}. This parameter is required.
         */
        public Builder startCanary(final com.hashicorp.cdktf.IResolvable startCanary) {
            this.config.startCanary(startCanary);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#success_retention_period SyntheticsCanary#success_retention_period}.
         * <p>
         * @return {@code this}
         * @param successRetentionPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#success_retention_period SyntheticsCanary#success_retention_period}. This parameter is required.
         */
        public Builder successRetentionPeriod(final java.lang.Number successRetentionPeriod) {
            this.config.successRetentionPeriod(successRetentionPeriod);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#tags SyntheticsCanary#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#tags SyntheticsCanary#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#tags_all SyntheticsCanary#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#tags_all SyntheticsCanary#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * vpc_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#vpc_config SyntheticsCanary#vpc_config}
         * <p>
         * @return {@code this}
         * @param vpcConfig vpc_config block. This parameter is required.
         */
        public Builder vpcConfig(final imports.aws.synthetics_canary.SyntheticsCanaryVpcConfig vpcConfig) {
            this.config.vpcConfig(vpcConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#zip_file SyntheticsCanary#zip_file}.
         * <p>
         * @return {@code this}
         * @param zipFile Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#zip_file SyntheticsCanary#zip_file}. This parameter is required.
         */
        public Builder zipFile(final java.lang.String zipFile) {
            this.config.zipFile(zipFile);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.synthetics_canary.SyntheticsCanary}.
         */
        @Override
        public imports.aws.synthetics_canary.SyntheticsCanary build() {
            return new imports.aws.synthetics_canary.SyntheticsCanary(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
