package imports.aws.glue_job;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job aws_glue_job}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.295Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueJob.GlueJob")
public class GlueJob extends com.hashicorp.cdktf.TerraformResource {

    protected GlueJob(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueJob(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.glue_job.GlueJob.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job aws_glue_job} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public GlueJob(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.glue_job.GlueJobConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a GlueJob resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the GlueJob to import. This parameter is required.
     * @param importFromId The id of the existing GlueJob that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the GlueJob to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.glue_job.GlueJob.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a GlueJob resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the GlueJob to import. This parameter is required.
     * @param importFromId The id of the existing GlueJob that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.glue_job.GlueJob.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCommand(final @org.jetbrains.annotations.NotNull imports.aws.glue_job.GlueJobCommand value) {
        software.amazon.jsii.Kernel.call(this, "putCommand", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putExecutionProperty(final @org.jetbrains.annotations.NotNull imports.aws.glue_job.GlueJobExecutionProperty value) {
        software.amazon.jsii.Kernel.call(this, "putExecutionProperty", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNotificationProperty(final @org.jetbrains.annotations.NotNull imports.aws.glue_job.GlueJobNotificationProperty value) {
        software.amazon.jsii.Kernel.call(this, "putNotificationProperty", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSourceControlDetails(final @org.jetbrains.annotations.NotNull imports.aws.glue_job.GlueJobSourceControlDetails value) {
        software.amazon.jsii.Kernel.call(this, "putSourceControlDetails", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetConnections() {
        software.amazon.jsii.Kernel.call(this, "resetConnections", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefaultArguments() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultArguments", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExecutionClass() {
        software.amazon.jsii.Kernel.call(this, "resetExecutionClass", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExecutionProperty() {
        software.amazon.jsii.Kernel.call(this, "resetExecutionProperty", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGlueVersion() {
        software.amazon.jsii.Kernel.call(this, "resetGlueVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetJobRunQueuingEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetJobRunQueuingEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaintenanceWindow() {
        software.amazon.jsii.Kernel.call(this, "resetMaintenanceWindow", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetMaxCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxRetries() {
        software.amazon.jsii.Kernel.call(this, "resetMaxRetries", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNonOverridableArguments() {
        software.amazon.jsii.Kernel.call(this, "resetNonOverridableArguments", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNotificationProperty() {
        software.amazon.jsii.Kernel.call(this, "resetNotificationProperty", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNumberOfWorkers() {
        software.amazon.jsii.Kernel.call(this, "resetNumberOfWorkers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceControlDetails() {
        software.amazon.jsii.Kernel.call(this, "resetSourceControlDetails", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeout() {
        software.amazon.jsii.Kernel.call(this, "resetTimeout", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWorkerType() {
        software.amazon.jsii.Kernel.call(this, "resetWorkerType", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.glue_job.GlueJobCommandOutputReference getCommand() {
        return software.amazon.jsii.Kernel.get(this, "command", software.amazon.jsii.NativeType.forClass(imports.aws.glue_job.GlueJobCommandOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.glue_job.GlueJobExecutionPropertyOutputReference getExecutionProperty() {
        return software.amazon.jsii.Kernel.get(this, "executionProperty", software.amazon.jsii.NativeType.forClass(imports.aws.glue_job.GlueJobExecutionPropertyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.glue_job.GlueJobNotificationPropertyOutputReference getNotificationProperty() {
        return software.amazon.jsii.Kernel.get(this, "notificationProperty", software.amazon.jsii.NativeType.forClass(imports.aws.glue_job.GlueJobNotificationPropertyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.glue_job.GlueJobSourceControlDetailsOutputReference getSourceControlDetails() {
        return software.amazon.jsii.Kernel.get(this, "sourceControlDetails", software.amazon.jsii.NativeType.forClass(imports.aws.glue_job.GlueJobSourceControlDetailsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_job.GlueJobCommand getCommandInput() {
        return software.amazon.jsii.Kernel.get(this, "commandInput", software.amazon.jsii.NativeType.forClass(imports.aws.glue_job.GlueJobCommand.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getConnectionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "connectionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getDefaultArgumentsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "defaultArgumentsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExecutionClassInput() {
        return software.amazon.jsii.Kernel.get(this, "executionClassInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_job.GlueJobExecutionProperty getExecutionPropertyInput() {
        return software.amazon.jsii.Kernel.get(this, "executionPropertyInput", software.amazon.jsii.NativeType.forClass(imports.aws.glue_job.GlueJobExecutionProperty.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGlueVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "glueVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getJobRunQueuingEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "jobRunQueuingEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMaintenanceWindowInput() {
        return software.amazon.jsii.Kernel.get(this, "maintenanceWindowInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "maxCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxRetriesInput() {
        return software.amazon.jsii.Kernel.get(this, "maxRetriesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getNonOverridableArgumentsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "nonOverridableArgumentsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_job.GlueJobNotificationProperty getNotificationPropertyInput() {
        return software.amazon.jsii.Kernel.get(this, "notificationPropertyInput", software.amazon.jsii.NativeType.forClass(imports.aws.glue_job.GlueJobNotificationProperty.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getNumberOfWorkersInput() {
        return software.amazon.jsii.Kernel.get(this, "numberOfWorkersInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "roleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSecurityConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "securityConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_job.GlueJobSourceControlDetails getSourceControlDetailsInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceControlDetailsInput", software.amazon.jsii.NativeType.forClass(imports.aws.glue_job.GlueJobSourceControlDetails.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWorkerTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "workerTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getConnections() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "connections", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setConnections(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "connections", java.util.Objects.requireNonNull(value, "connections is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getDefaultArguments() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "defaultArguments", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setDefaultArguments(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "defaultArguments", java.util.Objects.requireNonNull(value, "defaultArguments is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExecutionClass() {
        return software.amazon.jsii.Kernel.get(this, "executionClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExecutionClass(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "executionClass", java.util.Objects.requireNonNull(value, "executionClass is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGlueVersion() {
        return software.amazon.jsii.Kernel.get(this, "glueVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGlueVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "glueVersion", java.util.Objects.requireNonNull(value, "glueVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getJobRunQueuingEnabled() {
        return software.amazon.jsii.Kernel.get(this, "jobRunQueuingEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setJobRunQueuingEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "jobRunQueuingEnabled", java.util.Objects.requireNonNull(value, "jobRunQueuingEnabled is required"));
    }

    public void setJobRunQueuingEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "jobRunQueuingEnabled", java.util.Objects.requireNonNull(value, "jobRunQueuingEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMaintenanceWindow() {
        return software.amazon.jsii.Kernel.get(this, "maintenanceWindow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMaintenanceWindow(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "maintenanceWindow", java.util.Objects.requireNonNull(value, "maintenanceWindow is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxCapacity() {
        return software.amazon.jsii.Kernel.get(this, "maxCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxCapacity(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxCapacity", java.util.Objects.requireNonNull(value, "maxCapacity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxRetries() {
        return software.amazon.jsii.Kernel.get(this, "maxRetries", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxRetries(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxRetries", java.util.Objects.requireNonNull(value, "maxRetries is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getNonOverridableArguments() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "nonOverridableArguments", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setNonOverridableArguments(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "nonOverridableArguments", java.util.Objects.requireNonNull(value, "nonOverridableArguments is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getNumberOfWorkers() {
        return software.amazon.jsii.Kernel.get(this, "numberOfWorkers", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setNumberOfWorkers(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "numberOfWorkers", java.util.Objects.requireNonNull(value, "numberOfWorkers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "roleArn", java.util.Objects.requireNonNull(value, "roleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecurityConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "securityConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSecurityConfiguration(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "securityConfiguration", java.util.Objects.requireNonNull(value, "securityConfiguration is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Number getTimeout() {
        return software.amazon.jsii.Kernel.get(this, "timeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTimeout(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "timeout", java.util.Objects.requireNonNull(value, "timeout is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWorkerType() {
        return software.amazon.jsii.Kernel.get(this, "workerType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWorkerType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "workerType", java.util.Objects.requireNonNull(value, "workerType is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.glue_job.GlueJob}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.glue_job.GlueJob> {
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
        private final imports.aws.glue_job.GlueJobConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.glue_job.GlueJobConfig.Builder();
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
         * command block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#command GlueJob#command}
         * <p>
         * @return {@code this}
         * @param command command block. This parameter is required.
         */
        public Builder command(final imports.aws.glue_job.GlueJobCommand command) {
            this.config.command(command);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#name GlueJob#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#name GlueJob#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#role_arn GlueJob#role_arn}.
         * <p>
         * @return {@code this}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#role_arn GlueJob#role_arn}. This parameter is required.
         */
        public Builder roleArn(final java.lang.String roleArn) {
            this.config.roleArn(roleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#connections GlueJob#connections}.
         * <p>
         * @return {@code this}
         * @param connections Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#connections GlueJob#connections}. This parameter is required.
         */
        public Builder connections(final java.util.List<java.lang.String> connections) {
            this.config.connections(connections);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#default_arguments GlueJob#default_arguments}.
         * <p>
         * @return {@code this}
         * @param defaultArguments Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#default_arguments GlueJob#default_arguments}. This parameter is required.
         */
        public Builder defaultArguments(final java.util.Map<java.lang.String, java.lang.String> defaultArguments) {
            this.config.defaultArguments(defaultArguments);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#description GlueJob#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#description GlueJob#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#execution_class GlueJob#execution_class}.
         * <p>
         * @return {@code this}
         * @param executionClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#execution_class GlueJob#execution_class}. This parameter is required.
         */
        public Builder executionClass(final java.lang.String executionClass) {
            this.config.executionClass(executionClass);
            return this;
        }

        /**
         * execution_property block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#execution_property GlueJob#execution_property}
         * <p>
         * @return {@code this}
         * @param executionProperty execution_property block. This parameter is required.
         */
        public Builder executionProperty(final imports.aws.glue_job.GlueJobExecutionProperty executionProperty) {
            this.config.executionProperty(executionProperty);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#glue_version GlueJob#glue_version}.
         * <p>
         * @return {@code this}
         * @param glueVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#glue_version GlueJob#glue_version}. This parameter is required.
         */
        public Builder glueVersion(final java.lang.String glueVersion) {
            this.config.glueVersion(glueVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#id GlueJob#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#id GlueJob#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#job_run_queuing_enabled GlueJob#job_run_queuing_enabled}.
         * <p>
         * @return {@code this}
         * @param jobRunQueuingEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#job_run_queuing_enabled GlueJob#job_run_queuing_enabled}. This parameter is required.
         */
        public Builder jobRunQueuingEnabled(final java.lang.Boolean jobRunQueuingEnabled) {
            this.config.jobRunQueuingEnabled(jobRunQueuingEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#job_run_queuing_enabled GlueJob#job_run_queuing_enabled}.
         * <p>
         * @return {@code this}
         * @param jobRunQueuingEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#job_run_queuing_enabled GlueJob#job_run_queuing_enabled}. This parameter is required.
         */
        public Builder jobRunQueuingEnabled(final com.hashicorp.cdktf.IResolvable jobRunQueuingEnabled) {
            this.config.jobRunQueuingEnabled(jobRunQueuingEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#maintenance_window GlueJob#maintenance_window}.
         * <p>
         * @return {@code this}
         * @param maintenanceWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#maintenance_window GlueJob#maintenance_window}. This parameter is required.
         */
        public Builder maintenanceWindow(final java.lang.String maintenanceWindow) {
            this.config.maintenanceWindow(maintenanceWindow);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#max_capacity GlueJob#max_capacity}.
         * <p>
         * @return {@code this}
         * @param maxCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#max_capacity GlueJob#max_capacity}. This parameter is required.
         */
        public Builder maxCapacity(final java.lang.Number maxCapacity) {
            this.config.maxCapacity(maxCapacity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#max_retries GlueJob#max_retries}.
         * <p>
         * @return {@code this}
         * @param maxRetries Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#max_retries GlueJob#max_retries}. This parameter is required.
         */
        public Builder maxRetries(final java.lang.Number maxRetries) {
            this.config.maxRetries(maxRetries);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#non_overridable_arguments GlueJob#non_overridable_arguments}.
         * <p>
         * @return {@code this}
         * @param nonOverridableArguments Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#non_overridable_arguments GlueJob#non_overridable_arguments}. This parameter is required.
         */
        public Builder nonOverridableArguments(final java.util.Map<java.lang.String, java.lang.String> nonOverridableArguments) {
            this.config.nonOverridableArguments(nonOverridableArguments);
            return this;
        }

        /**
         * notification_property block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#notification_property GlueJob#notification_property}
         * <p>
         * @return {@code this}
         * @param notificationProperty notification_property block. This parameter is required.
         */
        public Builder notificationProperty(final imports.aws.glue_job.GlueJobNotificationProperty notificationProperty) {
            this.config.notificationProperty(notificationProperty);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#number_of_workers GlueJob#number_of_workers}.
         * <p>
         * @return {@code this}
         * @param numberOfWorkers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#number_of_workers GlueJob#number_of_workers}. This parameter is required.
         */
        public Builder numberOfWorkers(final java.lang.Number numberOfWorkers) {
            this.config.numberOfWorkers(numberOfWorkers);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#security_configuration GlueJob#security_configuration}.
         * <p>
         * @return {@code this}
         * @param securityConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#security_configuration GlueJob#security_configuration}. This parameter is required.
         */
        public Builder securityConfiguration(final java.lang.String securityConfiguration) {
            this.config.securityConfiguration(securityConfiguration);
            return this;
        }

        /**
         * source_control_details block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#source_control_details GlueJob#source_control_details}
         * <p>
         * @return {@code this}
         * @param sourceControlDetails source_control_details block. This parameter is required.
         */
        public Builder sourceControlDetails(final imports.aws.glue_job.GlueJobSourceControlDetails sourceControlDetails) {
            this.config.sourceControlDetails(sourceControlDetails);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#tags GlueJob#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#tags GlueJob#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#tags_all GlueJob#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#tags_all GlueJob#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#timeout GlueJob#timeout}.
         * <p>
         * @return {@code this}
         * @param timeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#timeout GlueJob#timeout}. This parameter is required.
         */
        public Builder timeout(final java.lang.Number timeout) {
            this.config.timeout(timeout);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#worker_type GlueJob#worker_type}.
         * <p>
         * @return {@code this}
         * @param workerType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#worker_type GlueJob#worker_type}. This parameter is required.
         */
        public Builder workerType(final java.lang.String workerType) {
            this.config.workerType(workerType);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.glue_job.GlueJob}.
         */
        @Override
        public imports.aws.glue_job.GlueJob build() {
            return new imports.aws.glue_job.GlueJob(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
