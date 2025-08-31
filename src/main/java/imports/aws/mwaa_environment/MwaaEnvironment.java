package imports.aws.mwaa_environment;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment aws_mwaa_environment}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.922Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mwaaEnvironment.MwaaEnvironment")
public class MwaaEnvironment extends com.hashicorp.cdktf.TerraformResource {

    protected MwaaEnvironment(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MwaaEnvironment(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.mwaa_environment.MwaaEnvironment.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment aws_mwaa_environment} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public MwaaEnvironment(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.mwaa_environment.MwaaEnvironmentConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a MwaaEnvironment resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the MwaaEnvironment to import. This parameter is required.
     * @param importFromId The id of the existing MwaaEnvironment that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the MwaaEnvironment to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.mwaa_environment.MwaaEnvironment.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a MwaaEnvironment resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the MwaaEnvironment to import. This parameter is required.
     * @param importFromId The id of the existing MwaaEnvironment that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.mwaa_environment.MwaaEnvironment.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putLoggingConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putLoggingConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetworkConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.mwaa_environment.MwaaEnvironmentNetworkConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putNetworkConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.mwaa_environment.MwaaEnvironmentTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAirflowConfigurationOptions() {
        software.amazon.jsii.Kernel.call(this, "resetAirflowConfigurationOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAirflowVersion() {
        software.amazon.jsii.Kernel.call(this, "resetAirflowVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEndpointManagement() {
        software.amazon.jsii.Kernel.call(this, "resetEndpointManagement", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnvironmentClass() {
        software.amazon.jsii.Kernel.call(this, "resetEnvironmentClass", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKey() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKey", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLoggingConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetLoggingConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxWebservers() {
        software.amazon.jsii.Kernel.call(this, "resetMaxWebservers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxWorkers() {
        software.amazon.jsii.Kernel.call(this, "resetMaxWorkers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinWebservers() {
        software.amazon.jsii.Kernel.call(this, "resetMinWebservers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinWorkers() {
        software.amazon.jsii.Kernel.call(this, "resetMinWorkers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPluginsS3ObjectVersion() {
        software.amazon.jsii.Kernel.call(this, "resetPluginsS3ObjectVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPluginsS3Path() {
        software.amazon.jsii.Kernel.call(this, "resetPluginsS3Path", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequirementsS3ObjectVersion() {
        software.amazon.jsii.Kernel.call(this, "resetRequirementsS3ObjectVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequirementsS3Path() {
        software.amazon.jsii.Kernel.call(this, "resetRequirementsS3Path", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSchedulers() {
        software.amazon.jsii.Kernel.call(this, "resetSchedulers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStartupScriptS3ObjectVersion() {
        software.amazon.jsii.Kernel.call(this, "resetStartupScriptS3ObjectVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStartupScriptS3Path() {
        software.amazon.jsii.Kernel.call(this, "resetStartupScriptS3Path", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWebserverAccessMode() {
        software.amazon.jsii.Kernel.call(this, "resetWebserverAccessMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWeeklyMaintenanceWindowStart() {
        software.amazon.jsii.Kernel.call(this, "resetWeeklyMaintenanceWindowStart", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getCreatedAt() {
        return software.amazon.jsii.Kernel.get(this, "createdAt", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDatabaseVpcEndpointService() {
        return software.amazon.jsii.Kernel.get(this, "databaseVpcEndpointService", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mwaa_environment.MwaaEnvironmentLastUpdatedList getLastUpdated() {
        return software.amazon.jsii.Kernel.get(this, "lastUpdated", software.amazon.jsii.NativeType.forClass(imports.aws.mwaa_environment.MwaaEnvironmentLastUpdatedList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationOutputReference getLoggingConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "loggingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mwaa_environment.MwaaEnvironmentNetworkConfigurationOutputReference getNetworkConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "networkConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.mwaa_environment.MwaaEnvironmentNetworkConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "serviceRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mwaa_environment.MwaaEnvironmentTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.mwaa_environment.MwaaEnvironmentTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWebserverUrl() {
        return software.amazon.jsii.Kernel.get(this, "webserverUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWebserverVpcEndpointService() {
        return software.amazon.jsii.Kernel.get(this, "webserverVpcEndpointService", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getAirflowConfigurationOptionsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "airflowConfigurationOptionsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAirflowVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "airflowVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDagS3PathInput() {
        return software.amazon.jsii.Kernel.get(this, "dagS3PathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEndpointManagementInput() {
        return software.amazon.jsii.Kernel.get(this, "endpointManagementInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEnvironmentClassInput() {
        return software.amazon.jsii.Kernel.get(this, "environmentClassInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExecutionRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "executionRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfiguration getLoggingConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "loggingConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxWebserversInput() {
        return software.amazon.jsii.Kernel.get(this, "maxWebserversInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxWorkersInput() {
        return software.amazon.jsii.Kernel.get(this, "maxWorkersInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinWebserversInput() {
        return software.amazon.jsii.Kernel.get(this, "minWebserversInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinWorkersInput() {
        return software.amazon.jsii.Kernel.get(this, "minWorkersInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mwaa_environment.MwaaEnvironmentNetworkConfiguration getNetworkConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "networkConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.mwaa_environment.MwaaEnvironmentNetworkConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPluginsS3ObjectVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "pluginsS3ObjectVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPluginsS3PathInput() {
        return software.amazon.jsii.Kernel.get(this, "pluginsS3PathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRequirementsS3ObjectVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "requirementsS3ObjectVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRequirementsS3PathInput() {
        return software.amazon.jsii.Kernel.get(this, "requirementsS3PathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSchedulersInput() {
        return software.amazon.jsii.Kernel.get(this, "schedulersInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceBucketArnInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceBucketArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStartupScriptS3ObjectVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "startupScriptS3ObjectVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStartupScriptS3PathInput() {
        return software.amazon.jsii.Kernel.get(this, "startupScriptS3PathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWebserverAccessModeInput() {
        return software.amazon.jsii.Kernel.get(this, "webserverAccessModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWeeklyMaintenanceWindowStartInput() {
        return software.amazon.jsii.Kernel.get(this, "weeklyMaintenanceWindowStartInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getAirflowConfigurationOptions() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "airflowConfigurationOptions", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAirflowConfigurationOptions(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "airflowConfigurationOptions", java.util.Objects.requireNonNull(value, "airflowConfigurationOptions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAirflowVersion() {
        return software.amazon.jsii.Kernel.get(this, "airflowVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAirflowVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "airflowVersion", java.util.Objects.requireNonNull(value, "airflowVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDagS3Path() {
        return software.amazon.jsii.Kernel.get(this, "dagS3Path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDagS3Path(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dagS3Path", java.util.Objects.requireNonNull(value, "dagS3Path is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpointManagement() {
        return software.amazon.jsii.Kernel.get(this, "endpointManagement", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEndpointManagement(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "endpointManagement", java.util.Objects.requireNonNull(value, "endpointManagement is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEnvironmentClass() {
        return software.amazon.jsii.Kernel.get(this, "environmentClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEnvironmentClass(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "environmentClass", java.util.Objects.requireNonNull(value, "environmentClass is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExecutionRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "executionRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExecutionRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "executionRoleArn", java.util.Objects.requireNonNull(value, "executionRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKey() {
        return software.amazon.jsii.Kernel.get(this, "kmsKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKey", java.util.Objects.requireNonNull(value, "kmsKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxWebservers() {
        return software.amazon.jsii.Kernel.get(this, "maxWebservers", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxWebservers(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxWebservers", java.util.Objects.requireNonNull(value, "maxWebservers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxWorkers() {
        return software.amazon.jsii.Kernel.get(this, "maxWorkers", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxWorkers(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxWorkers", java.util.Objects.requireNonNull(value, "maxWorkers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinWebservers() {
        return software.amazon.jsii.Kernel.get(this, "minWebservers", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinWebservers(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minWebservers", java.util.Objects.requireNonNull(value, "minWebservers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinWorkers() {
        return software.amazon.jsii.Kernel.get(this, "minWorkers", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinWorkers(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minWorkers", java.util.Objects.requireNonNull(value, "minWorkers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPluginsS3ObjectVersion() {
        return software.amazon.jsii.Kernel.get(this, "pluginsS3ObjectVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPluginsS3ObjectVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "pluginsS3ObjectVersion", java.util.Objects.requireNonNull(value, "pluginsS3ObjectVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPluginsS3Path() {
        return software.amazon.jsii.Kernel.get(this, "pluginsS3Path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPluginsS3Path(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "pluginsS3Path", java.util.Objects.requireNonNull(value, "pluginsS3Path is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRequirementsS3ObjectVersion() {
        return software.amazon.jsii.Kernel.get(this, "requirementsS3ObjectVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRequirementsS3ObjectVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "requirementsS3ObjectVersion", java.util.Objects.requireNonNull(value, "requirementsS3ObjectVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRequirementsS3Path() {
        return software.amazon.jsii.Kernel.get(this, "requirementsS3Path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRequirementsS3Path(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "requirementsS3Path", java.util.Objects.requireNonNull(value, "requirementsS3Path is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSchedulers() {
        return software.amazon.jsii.Kernel.get(this, "schedulers", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSchedulers(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "schedulers", java.util.Objects.requireNonNull(value, "schedulers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceBucketArn() {
        return software.amazon.jsii.Kernel.get(this, "sourceBucketArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceBucketArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceBucketArn", java.util.Objects.requireNonNull(value, "sourceBucketArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStartupScriptS3ObjectVersion() {
        return software.amazon.jsii.Kernel.get(this, "startupScriptS3ObjectVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStartupScriptS3ObjectVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "startupScriptS3ObjectVersion", java.util.Objects.requireNonNull(value, "startupScriptS3ObjectVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStartupScriptS3Path() {
        return software.amazon.jsii.Kernel.get(this, "startupScriptS3Path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStartupScriptS3Path(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "startupScriptS3Path", java.util.Objects.requireNonNull(value, "startupScriptS3Path is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getWebserverAccessMode() {
        return software.amazon.jsii.Kernel.get(this, "webserverAccessMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWebserverAccessMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "webserverAccessMode", java.util.Objects.requireNonNull(value, "webserverAccessMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWeeklyMaintenanceWindowStart() {
        return software.amazon.jsii.Kernel.get(this, "weeklyMaintenanceWindowStart", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWeeklyMaintenanceWindowStart(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "weeklyMaintenanceWindowStart", java.util.Objects.requireNonNull(value, "weeklyMaintenanceWindowStart is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.mwaa_environment.MwaaEnvironment}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.mwaa_environment.MwaaEnvironment> {
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
        private final imports.aws.mwaa_environment.MwaaEnvironmentConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.mwaa_environment.MwaaEnvironmentConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#dag_s3_path MwaaEnvironment#dag_s3_path}.
         * <p>
         * @return {@code this}
         * @param dagS3Path Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#dag_s3_path MwaaEnvironment#dag_s3_path}. This parameter is required.
         */
        public Builder dagS3Path(final java.lang.String dagS3Path) {
            this.config.dagS3Path(dagS3Path);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#execution_role_arn MwaaEnvironment#execution_role_arn}.
         * <p>
         * @return {@code this}
         * @param executionRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#execution_role_arn MwaaEnvironment#execution_role_arn}. This parameter is required.
         */
        public Builder executionRoleArn(final java.lang.String executionRoleArn) {
            this.config.executionRoleArn(executionRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#name MwaaEnvironment#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#name MwaaEnvironment#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * network_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#network_configuration MwaaEnvironment#network_configuration}
         * <p>
         * @return {@code this}
         * @param networkConfiguration network_configuration block. This parameter is required.
         */
        public Builder networkConfiguration(final imports.aws.mwaa_environment.MwaaEnvironmentNetworkConfiguration networkConfiguration) {
            this.config.networkConfiguration(networkConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#source_bucket_arn MwaaEnvironment#source_bucket_arn}.
         * <p>
         * @return {@code this}
         * @param sourceBucketArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#source_bucket_arn MwaaEnvironment#source_bucket_arn}. This parameter is required.
         */
        public Builder sourceBucketArn(final java.lang.String sourceBucketArn) {
            this.config.sourceBucketArn(sourceBucketArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#airflow_configuration_options MwaaEnvironment#airflow_configuration_options}.
         * <p>
         * @return {@code this}
         * @param airflowConfigurationOptions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#airflow_configuration_options MwaaEnvironment#airflow_configuration_options}. This parameter is required.
         */
        public Builder airflowConfigurationOptions(final java.util.Map<java.lang.String, java.lang.String> airflowConfigurationOptions) {
            this.config.airflowConfigurationOptions(airflowConfigurationOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#airflow_version MwaaEnvironment#airflow_version}.
         * <p>
         * @return {@code this}
         * @param airflowVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#airflow_version MwaaEnvironment#airflow_version}. This parameter is required.
         */
        public Builder airflowVersion(final java.lang.String airflowVersion) {
            this.config.airflowVersion(airflowVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#endpoint_management MwaaEnvironment#endpoint_management}.
         * <p>
         * @return {@code this}
         * @param endpointManagement Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#endpoint_management MwaaEnvironment#endpoint_management}. This parameter is required.
         */
        public Builder endpointManagement(final java.lang.String endpointManagement) {
            this.config.endpointManagement(endpointManagement);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#environment_class MwaaEnvironment#environment_class}.
         * <p>
         * @return {@code this}
         * @param environmentClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#environment_class MwaaEnvironment#environment_class}. This parameter is required.
         */
        public Builder environmentClass(final java.lang.String environmentClass) {
            this.config.environmentClass(environmentClass);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#id MwaaEnvironment#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#id MwaaEnvironment#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#kms_key MwaaEnvironment#kms_key}.
         * <p>
         * @return {@code this}
         * @param kmsKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#kms_key MwaaEnvironment#kms_key}. This parameter is required.
         */
        public Builder kmsKey(final java.lang.String kmsKey) {
            this.config.kmsKey(kmsKey);
            return this;
        }

        /**
         * logging_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#logging_configuration MwaaEnvironment#logging_configuration}
         * <p>
         * @return {@code this}
         * @param loggingConfiguration logging_configuration block. This parameter is required.
         */
        public Builder loggingConfiguration(final imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfiguration loggingConfiguration) {
            this.config.loggingConfiguration(loggingConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#max_webservers MwaaEnvironment#max_webservers}.
         * <p>
         * @return {@code this}
         * @param maxWebservers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#max_webservers MwaaEnvironment#max_webservers}. This parameter is required.
         */
        public Builder maxWebservers(final java.lang.Number maxWebservers) {
            this.config.maxWebservers(maxWebservers);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#max_workers MwaaEnvironment#max_workers}.
         * <p>
         * @return {@code this}
         * @param maxWorkers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#max_workers MwaaEnvironment#max_workers}. This parameter is required.
         */
        public Builder maxWorkers(final java.lang.Number maxWorkers) {
            this.config.maxWorkers(maxWorkers);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#min_webservers MwaaEnvironment#min_webservers}.
         * <p>
         * @return {@code this}
         * @param minWebservers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#min_webservers MwaaEnvironment#min_webservers}. This parameter is required.
         */
        public Builder minWebservers(final java.lang.Number minWebservers) {
            this.config.minWebservers(minWebservers);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#min_workers MwaaEnvironment#min_workers}.
         * <p>
         * @return {@code this}
         * @param minWorkers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#min_workers MwaaEnvironment#min_workers}. This parameter is required.
         */
        public Builder minWorkers(final java.lang.Number minWorkers) {
            this.config.minWorkers(minWorkers);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#plugins_s3_object_version MwaaEnvironment#plugins_s3_object_version}.
         * <p>
         * @return {@code this}
         * @param pluginsS3ObjectVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#plugins_s3_object_version MwaaEnvironment#plugins_s3_object_version}. This parameter is required.
         */
        public Builder pluginsS3ObjectVersion(final java.lang.String pluginsS3ObjectVersion) {
            this.config.pluginsS3ObjectVersion(pluginsS3ObjectVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#plugins_s3_path MwaaEnvironment#plugins_s3_path}.
         * <p>
         * @return {@code this}
         * @param pluginsS3Path Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#plugins_s3_path MwaaEnvironment#plugins_s3_path}. This parameter is required.
         */
        public Builder pluginsS3Path(final java.lang.String pluginsS3Path) {
            this.config.pluginsS3Path(pluginsS3Path);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#requirements_s3_object_version MwaaEnvironment#requirements_s3_object_version}.
         * <p>
         * @return {@code this}
         * @param requirementsS3ObjectVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#requirements_s3_object_version MwaaEnvironment#requirements_s3_object_version}. This parameter is required.
         */
        public Builder requirementsS3ObjectVersion(final java.lang.String requirementsS3ObjectVersion) {
            this.config.requirementsS3ObjectVersion(requirementsS3ObjectVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#requirements_s3_path MwaaEnvironment#requirements_s3_path}.
         * <p>
         * @return {@code this}
         * @param requirementsS3Path Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#requirements_s3_path MwaaEnvironment#requirements_s3_path}. This parameter is required.
         */
        public Builder requirementsS3Path(final java.lang.String requirementsS3Path) {
            this.config.requirementsS3Path(requirementsS3Path);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#schedulers MwaaEnvironment#schedulers}.
         * <p>
         * @return {@code this}
         * @param schedulers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#schedulers MwaaEnvironment#schedulers}. This parameter is required.
         */
        public Builder schedulers(final java.lang.Number schedulers) {
            this.config.schedulers(schedulers);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#startup_script_s3_object_version MwaaEnvironment#startup_script_s3_object_version}.
         * <p>
         * @return {@code this}
         * @param startupScriptS3ObjectVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#startup_script_s3_object_version MwaaEnvironment#startup_script_s3_object_version}. This parameter is required.
         */
        public Builder startupScriptS3ObjectVersion(final java.lang.String startupScriptS3ObjectVersion) {
            this.config.startupScriptS3ObjectVersion(startupScriptS3ObjectVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#startup_script_s3_path MwaaEnvironment#startup_script_s3_path}.
         * <p>
         * @return {@code this}
         * @param startupScriptS3Path Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#startup_script_s3_path MwaaEnvironment#startup_script_s3_path}. This parameter is required.
         */
        public Builder startupScriptS3Path(final java.lang.String startupScriptS3Path) {
            this.config.startupScriptS3Path(startupScriptS3Path);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#tags MwaaEnvironment#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#tags MwaaEnvironment#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#tags_all MwaaEnvironment#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#tags_all MwaaEnvironment#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#timeouts MwaaEnvironment#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.mwaa_environment.MwaaEnvironmentTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#webserver_access_mode MwaaEnvironment#webserver_access_mode}.
         * <p>
         * @return {@code this}
         * @param webserverAccessMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#webserver_access_mode MwaaEnvironment#webserver_access_mode}. This parameter is required.
         */
        public Builder webserverAccessMode(final java.lang.String webserverAccessMode) {
            this.config.webserverAccessMode(webserverAccessMode);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#weekly_maintenance_window_start MwaaEnvironment#weekly_maintenance_window_start}.
         * <p>
         * @return {@code this}
         * @param weeklyMaintenanceWindowStart Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#weekly_maintenance_window_start MwaaEnvironment#weekly_maintenance_window_start}. This parameter is required.
         */
        public Builder weeklyMaintenanceWindowStart(final java.lang.String weeklyMaintenanceWindowStart) {
            this.config.weeklyMaintenanceWindowStart(weeklyMaintenanceWindowStart);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.mwaa_environment.MwaaEnvironment}.
         */
        @Override
        public imports.aws.mwaa_environment.MwaaEnvironment build() {
            return new imports.aws.mwaa_environment.MwaaEnvironment(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
