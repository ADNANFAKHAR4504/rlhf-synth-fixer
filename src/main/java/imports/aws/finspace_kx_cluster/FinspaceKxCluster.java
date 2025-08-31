package imports.aws.finspace_kx_cluster;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster aws_finspace_kx_cluster}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.216Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.finspaceKxCluster.FinspaceKxCluster")
public class FinspaceKxCluster extends com.hashicorp.cdktf.TerraformResource {

    protected FinspaceKxCluster(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FinspaceKxCluster(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.finspace_kx_cluster.FinspaceKxCluster.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster aws_finspace_kx_cluster} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public FinspaceKxCluster(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.finspace_kx_cluster.FinspaceKxClusterConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a FinspaceKxCluster resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the FinspaceKxCluster to import. This parameter is required.
     * @param importFromId The id of the existing FinspaceKxCluster that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the FinspaceKxCluster to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.finspace_kx_cluster.FinspaceKxCluster.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a FinspaceKxCluster resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the FinspaceKxCluster to import. This parameter is required.
     * @param importFromId The id of the existing FinspaceKxCluster that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.finspace_kx_cluster.FinspaceKxCluster.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAutoScalingConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.finspace_kx_cluster.FinspaceKxClusterAutoScalingConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putAutoScalingConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCacheStorageConfigurations(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.finspace_kx_cluster.FinspaceKxClusterCacheStorageConfigurations>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.finspace_kx_cluster.FinspaceKxClusterCacheStorageConfigurations> __cast_cd4240 = (java.util.List<imports.aws.finspace_kx_cluster.FinspaceKxClusterCacheStorageConfigurations>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.finspace_kx_cluster.FinspaceKxClusterCacheStorageConfigurations __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCacheStorageConfigurations", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCapacityConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.finspace_kx_cluster.FinspaceKxClusterCapacityConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putCapacityConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCode(final @org.jetbrains.annotations.NotNull imports.aws.finspace_kx_cluster.FinspaceKxClusterCode value) {
        software.amazon.jsii.Kernel.call(this, "putCode", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDatabase(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.finspace_kx_cluster.FinspaceKxClusterDatabase>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.finspace_kx_cluster.FinspaceKxClusterDatabase> __cast_cd4240 = (java.util.List<imports.aws.finspace_kx_cluster.FinspaceKxClusterDatabase>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.finspace_kx_cluster.FinspaceKxClusterDatabase __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putDatabase", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSavedownStorageConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.finspace_kx_cluster.FinspaceKxClusterSavedownStorageConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putSavedownStorageConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putScalingGroupConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.finspace_kx_cluster.FinspaceKxClusterScalingGroupConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putScalingGroupConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTickerplantLogConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.finspace_kx_cluster.FinspaceKxClusterTickerplantLogConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.finspace_kx_cluster.FinspaceKxClusterTickerplantLogConfiguration> __cast_cd4240 = (java.util.List<imports.aws.finspace_kx_cluster.FinspaceKxClusterTickerplantLogConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.finspace_kx_cluster.FinspaceKxClusterTickerplantLogConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTickerplantLogConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.finspace_kx_cluster.FinspaceKxClusterTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVpcConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.finspace_kx_cluster.FinspaceKxClusterVpcConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putVpcConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAutoScalingConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetAutoScalingConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAvailabilityZoneId() {
        software.amazon.jsii.Kernel.call(this, "resetAvailabilityZoneId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCacheStorageConfigurations() {
        software.amazon.jsii.Kernel.call(this, "resetCacheStorageConfigurations", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCapacityConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetCapacityConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCode() {
        software.amazon.jsii.Kernel.call(this, "resetCode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCommandLineArguments() {
        software.amazon.jsii.Kernel.call(this, "resetCommandLineArguments", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDatabase() {
        software.amazon.jsii.Kernel.call(this, "resetDatabase", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExecutionRole() {
        software.amazon.jsii.Kernel.call(this, "resetExecutionRole", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInitializationScript() {
        software.amazon.jsii.Kernel.call(this, "resetInitializationScript", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSavedownStorageConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetSavedownStorageConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScalingGroupConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetScalingGroupConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTickerplantLogConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetTickerplantLogConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.finspace_kx_cluster.FinspaceKxClusterAutoScalingConfigurationOutputReference getAutoScalingConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "autoScalingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterAutoScalingConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.finspace_kx_cluster.FinspaceKxClusterCacheStorageConfigurationsList getCacheStorageConfigurations() {
        return software.amazon.jsii.Kernel.get(this, "cacheStorageConfigurations", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterCacheStorageConfigurationsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.finspace_kx_cluster.FinspaceKxClusterCapacityConfigurationOutputReference getCapacityConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "capacityConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterCapacityConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.finspace_kx_cluster.FinspaceKxClusterCodeOutputReference getCode() {
        return software.amazon.jsii.Kernel.get(this, "code", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterCodeOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreatedTimestamp() {
        return software.amazon.jsii.Kernel.get(this, "createdTimestamp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.finspace_kx_cluster.FinspaceKxClusterDatabaseList getDatabase() {
        return software.amazon.jsii.Kernel.get(this, "database", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterDatabaseList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastModifiedTimestamp() {
        return software.amazon.jsii.Kernel.get(this, "lastModifiedTimestamp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.finspace_kx_cluster.FinspaceKxClusterSavedownStorageConfigurationOutputReference getSavedownStorageConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "savedownStorageConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterSavedownStorageConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.finspace_kx_cluster.FinspaceKxClusterScalingGroupConfigurationOutputReference getScalingGroupConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "scalingGroupConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterScalingGroupConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatusReason() {
        return software.amazon.jsii.Kernel.get(this, "statusReason", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.finspace_kx_cluster.FinspaceKxClusterTickerplantLogConfigurationList getTickerplantLogConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "tickerplantLogConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterTickerplantLogConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.finspace_kx_cluster.FinspaceKxClusterTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.finspace_kx_cluster.FinspaceKxClusterVpcConfigurationOutputReference getVpcConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "vpcConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterVpcConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_cluster.FinspaceKxClusterAutoScalingConfiguration getAutoScalingConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "autoScalingConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterAutoScalingConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZoneIdInput() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZoneIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAzModeInput() {
        return software.amazon.jsii.Kernel.get(this, "azModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCacheStorageConfigurationsInput() {
        return software.amazon.jsii.Kernel.get(this, "cacheStorageConfigurationsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_cluster.FinspaceKxClusterCapacityConfiguration getCapacityConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "capacityConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterCapacityConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_cluster.FinspaceKxClusterCode getCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "codeInput", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterCode.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getCommandLineArgumentsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "commandLineArgumentsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDatabaseInput() {
        return software.amazon.jsii.Kernel.get(this, "databaseInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEnvironmentIdInput() {
        return software.amazon.jsii.Kernel.get(this, "environmentIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExecutionRoleInput() {
        return software.amazon.jsii.Kernel.get(this, "executionRoleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInitializationScriptInput() {
        return software.amazon.jsii.Kernel.get(this, "initializationScriptInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReleaseLabelInput() {
        return software.amazon.jsii.Kernel.get(this, "releaseLabelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_cluster.FinspaceKxClusterSavedownStorageConfiguration getSavedownStorageConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "savedownStorageConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterSavedownStorageConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_cluster.FinspaceKxClusterScalingGroupConfiguration getScalingGroupConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "scalingGroupConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterScalingGroupConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTickerplantLogConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "tickerplantLogConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_cluster.FinspaceKxClusterVpcConfiguration getVpcConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterVpcConfiguration.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAvailabilityZoneId() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZoneId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAvailabilityZoneId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "availabilityZoneId", java.util.Objects.requireNonNull(value, "availabilityZoneId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAzMode() {
        return software.amazon.jsii.Kernel.get(this, "azMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAzMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "azMode", java.util.Objects.requireNonNull(value, "azMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getCommandLineArguments() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "commandLineArguments", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setCommandLineArguments(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "commandLineArguments", java.util.Objects.requireNonNull(value, "commandLineArguments is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEnvironmentId() {
        return software.amazon.jsii.Kernel.get(this, "environmentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEnvironmentId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "environmentId", java.util.Objects.requireNonNull(value, "environmentId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExecutionRole() {
        return software.amazon.jsii.Kernel.get(this, "executionRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExecutionRole(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "executionRole", java.util.Objects.requireNonNull(value, "executionRole is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInitializationScript() {
        return software.amazon.jsii.Kernel.get(this, "initializationScript", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInitializationScript(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "initializationScript", java.util.Objects.requireNonNull(value, "initializationScript is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReleaseLabel() {
        return software.amazon.jsii.Kernel.get(this, "releaseLabel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReleaseLabel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "releaseLabel", java.util.Objects.requireNonNull(value, "releaseLabel is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.finspace_kx_cluster.FinspaceKxCluster}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.finspace_kx_cluster.FinspaceKxCluster> {
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
        private final imports.aws.finspace_kx_cluster.FinspaceKxClusterConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.finspace_kx_cluster.FinspaceKxClusterConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#az_mode FinspaceKxCluster#az_mode}.
         * <p>
         * @return {@code this}
         * @param azMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#az_mode FinspaceKxCluster#az_mode}. This parameter is required.
         */
        public Builder azMode(final java.lang.String azMode) {
            this.config.azMode(azMode);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#environment_id FinspaceKxCluster#environment_id}.
         * <p>
         * @return {@code this}
         * @param environmentId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#environment_id FinspaceKxCluster#environment_id}. This parameter is required.
         */
        public Builder environmentId(final java.lang.String environmentId) {
            this.config.environmentId(environmentId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#name FinspaceKxCluster#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#name FinspaceKxCluster#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#release_label FinspaceKxCluster#release_label}.
         * <p>
         * @return {@code this}
         * @param releaseLabel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#release_label FinspaceKxCluster#release_label}. This parameter is required.
         */
        public Builder releaseLabel(final java.lang.String releaseLabel) {
            this.config.releaseLabel(releaseLabel);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#type FinspaceKxCluster#type}.
         * <p>
         * @return {@code this}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#type FinspaceKxCluster#type}. This parameter is required.
         */
        public Builder type(final java.lang.String type) {
            this.config.type(type);
            return this;
        }

        /**
         * vpc_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#vpc_configuration FinspaceKxCluster#vpc_configuration}
         * <p>
         * @return {@code this}
         * @param vpcConfiguration vpc_configuration block. This parameter is required.
         */
        public Builder vpcConfiguration(final imports.aws.finspace_kx_cluster.FinspaceKxClusterVpcConfiguration vpcConfiguration) {
            this.config.vpcConfiguration(vpcConfiguration);
            return this;
        }

        /**
         * auto_scaling_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#auto_scaling_configuration FinspaceKxCluster#auto_scaling_configuration}
         * <p>
         * @return {@code this}
         * @param autoScalingConfiguration auto_scaling_configuration block. This parameter is required.
         */
        public Builder autoScalingConfiguration(final imports.aws.finspace_kx_cluster.FinspaceKxClusterAutoScalingConfiguration autoScalingConfiguration) {
            this.config.autoScalingConfiguration(autoScalingConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#availability_zone_id FinspaceKxCluster#availability_zone_id}.
         * <p>
         * @return {@code this}
         * @param availabilityZoneId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#availability_zone_id FinspaceKxCluster#availability_zone_id}. This parameter is required.
         */
        public Builder availabilityZoneId(final java.lang.String availabilityZoneId) {
            this.config.availabilityZoneId(availabilityZoneId);
            return this;
        }

        /**
         * cache_storage_configurations block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#cache_storage_configurations FinspaceKxCluster#cache_storage_configurations}
         * <p>
         * @return {@code this}
         * @param cacheStorageConfigurations cache_storage_configurations block. This parameter is required.
         */
        public Builder cacheStorageConfigurations(final com.hashicorp.cdktf.IResolvable cacheStorageConfigurations) {
            this.config.cacheStorageConfigurations(cacheStorageConfigurations);
            return this;
        }
        /**
         * cache_storage_configurations block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#cache_storage_configurations FinspaceKxCluster#cache_storage_configurations}
         * <p>
         * @return {@code this}
         * @param cacheStorageConfigurations cache_storage_configurations block. This parameter is required.
         */
        public Builder cacheStorageConfigurations(final java.util.List<? extends imports.aws.finspace_kx_cluster.FinspaceKxClusterCacheStorageConfigurations> cacheStorageConfigurations) {
            this.config.cacheStorageConfigurations(cacheStorageConfigurations);
            return this;
        }

        /**
         * capacity_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#capacity_configuration FinspaceKxCluster#capacity_configuration}
         * <p>
         * @return {@code this}
         * @param capacityConfiguration capacity_configuration block. This parameter is required.
         */
        public Builder capacityConfiguration(final imports.aws.finspace_kx_cluster.FinspaceKxClusterCapacityConfiguration capacityConfiguration) {
            this.config.capacityConfiguration(capacityConfiguration);
            return this;
        }

        /**
         * code block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#code FinspaceKxCluster#code}
         * <p>
         * @return {@code this}
         * @param code code block. This parameter is required.
         */
        public Builder code(final imports.aws.finspace_kx_cluster.FinspaceKxClusterCode code) {
            this.config.code(code);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#command_line_arguments FinspaceKxCluster#command_line_arguments}.
         * <p>
         * @return {@code this}
         * @param commandLineArguments Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#command_line_arguments FinspaceKxCluster#command_line_arguments}. This parameter is required.
         */
        public Builder commandLineArguments(final java.util.Map<java.lang.String, java.lang.String> commandLineArguments) {
            this.config.commandLineArguments(commandLineArguments);
            return this;
        }

        /**
         * database block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#database FinspaceKxCluster#database}
         * <p>
         * @return {@code this}
         * @param database database block. This parameter is required.
         */
        public Builder database(final com.hashicorp.cdktf.IResolvable database) {
            this.config.database(database);
            return this;
        }
        /**
         * database block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#database FinspaceKxCluster#database}
         * <p>
         * @return {@code this}
         * @param database database block. This parameter is required.
         */
        public Builder database(final java.util.List<? extends imports.aws.finspace_kx_cluster.FinspaceKxClusterDatabase> database) {
            this.config.database(database);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#description FinspaceKxCluster#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#description FinspaceKxCluster#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#execution_role FinspaceKxCluster#execution_role}.
         * <p>
         * @return {@code this}
         * @param executionRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#execution_role FinspaceKxCluster#execution_role}. This parameter is required.
         */
        public Builder executionRole(final java.lang.String executionRole) {
            this.config.executionRole(executionRole);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#id FinspaceKxCluster#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#id FinspaceKxCluster#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#initialization_script FinspaceKxCluster#initialization_script}.
         * <p>
         * @return {@code this}
         * @param initializationScript Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#initialization_script FinspaceKxCluster#initialization_script}. This parameter is required.
         */
        public Builder initializationScript(final java.lang.String initializationScript) {
            this.config.initializationScript(initializationScript);
            return this;
        }

        /**
         * savedown_storage_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#savedown_storage_configuration FinspaceKxCluster#savedown_storage_configuration}
         * <p>
         * @return {@code this}
         * @param savedownStorageConfiguration savedown_storage_configuration block. This parameter is required.
         */
        public Builder savedownStorageConfiguration(final imports.aws.finspace_kx_cluster.FinspaceKxClusterSavedownStorageConfiguration savedownStorageConfiguration) {
            this.config.savedownStorageConfiguration(savedownStorageConfiguration);
            return this;
        }

        /**
         * scaling_group_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#scaling_group_configuration FinspaceKxCluster#scaling_group_configuration}
         * <p>
         * @return {@code this}
         * @param scalingGroupConfiguration scaling_group_configuration block. This parameter is required.
         */
        public Builder scalingGroupConfiguration(final imports.aws.finspace_kx_cluster.FinspaceKxClusterScalingGroupConfiguration scalingGroupConfiguration) {
            this.config.scalingGroupConfiguration(scalingGroupConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#tags FinspaceKxCluster#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#tags FinspaceKxCluster#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#tags_all FinspaceKxCluster#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#tags_all FinspaceKxCluster#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * tickerplant_log_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#tickerplant_log_configuration FinspaceKxCluster#tickerplant_log_configuration}
         * <p>
         * @return {@code this}
         * @param tickerplantLogConfiguration tickerplant_log_configuration block. This parameter is required.
         */
        public Builder tickerplantLogConfiguration(final com.hashicorp.cdktf.IResolvable tickerplantLogConfiguration) {
            this.config.tickerplantLogConfiguration(tickerplantLogConfiguration);
            return this;
        }
        /**
         * tickerplant_log_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#tickerplant_log_configuration FinspaceKxCluster#tickerplant_log_configuration}
         * <p>
         * @return {@code this}
         * @param tickerplantLogConfiguration tickerplant_log_configuration block. This parameter is required.
         */
        public Builder tickerplantLogConfiguration(final java.util.List<? extends imports.aws.finspace_kx_cluster.FinspaceKxClusterTickerplantLogConfiguration> tickerplantLogConfiguration) {
            this.config.tickerplantLogConfiguration(tickerplantLogConfiguration);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#timeouts FinspaceKxCluster#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.finspace_kx_cluster.FinspaceKxClusterTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.finspace_kx_cluster.FinspaceKxCluster}.
         */
        @Override
        public imports.aws.finspace_kx_cluster.FinspaceKxCluster build() {
            return new imports.aws.finspace_kx_cluster.FinspaceKxCluster(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
