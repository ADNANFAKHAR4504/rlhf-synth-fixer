package imports.aws.mq_broker;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker aws_mq_broker}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.901Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mqBroker.MqBroker")
public class MqBroker extends com.hashicorp.cdktf.TerraformResource {

    protected MqBroker(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MqBroker(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.mq_broker.MqBroker.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker aws_mq_broker} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public MqBroker(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.mq_broker.MqBrokerConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a MqBroker resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the MqBroker to import. This parameter is required.
     * @param importFromId The id of the existing MqBroker that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the MqBroker to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.mq_broker.MqBroker.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a MqBroker resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the MqBroker to import. This parameter is required.
     * @param importFromId The id of the existing MqBroker that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.mq_broker.MqBroker.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.mq_broker.MqBrokerConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEncryptionOptions(final @org.jetbrains.annotations.NotNull imports.aws.mq_broker.MqBrokerEncryptionOptions value) {
        software.amazon.jsii.Kernel.call(this, "putEncryptionOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLdapServerMetadata(final @org.jetbrains.annotations.NotNull imports.aws.mq_broker.MqBrokerLdapServerMetadata value) {
        software.amazon.jsii.Kernel.call(this, "putLdapServerMetadata", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLogs(final @org.jetbrains.annotations.NotNull imports.aws.mq_broker.MqBrokerLogs value) {
        software.amazon.jsii.Kernel.call(this, "putLogs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMaintenanceWindowStartTime(final @org.jetbrains.annotations.NotNull imports.aws.mq_broker.MqBrokerMaintenanceWindowStartTime value) {
        software.amazon.jsii.Kernel.call(this, "putMaintenanceWindowStartTime", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.mq_broker.MqBrokerTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putUser(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.mq_broker.MqBrokerUser>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.mq_broker.MqBrokerUser> __cast_cd4240 = (java.util.List<imports.aws.mq_broker.MqBrokerUser>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.mq_broker.MqBrokerUser __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putUser", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetApplyImmediately() {
        software.amazon.jsii.Kernel.call(this, "resetApplyImmediately", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAuthenticationStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetAuthenticationStrategy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoMinorVersionUpgrade() {
        software.amazon.jsii.Kernel.call(this, "resetAutoMinorVersionUpgrade", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDataReplicationMode() {
        software.amazon.jsii.Kernel.call(this, "resetDataReplicationMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDataReplicationPrimaryBrokerArn() {
        software.amazon.jsii.Kernel.call(this, "resetDataReplicationPrimaryBrokerArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeploymentMode() {
        software.amazon.jsii.Kernel.call(this, "resetDeploymentMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEncryptionOptions() {
        software.amazon.jsii.Kernel.call(this, "resetEncryptionOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLdapServerMetadata() {
        software.amazon.jsii.Kernel.call(this, "resetLdapServerMetadata", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogs() {
        software.amazon.jsii.Kernel.call(this, "resetLogs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaintenanceWindowStartTime() {
        software.amazon.jsii.Kernel.call(this, "resetMaintenanceWindowStartTime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPubliclyAccessible() {
        software.amazon.jsii.Kernel.call(this, "resetPubliclyAccessible", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityGroups() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityGroups", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStorageType() {
        software.amazon.jsii.Kernel.call(this, "resetStorageType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSubnetIds() {
        software.amazon.jsii.Kernel.call(this, "resetSubnetIds", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.mq_broker.MqBrokerConfigurationOutputReference getConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "configuration", software.amazon.jsii.NativeType.forClass(imports.aws.mq_broker.MqBrokerConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mq_broker.MqBrokerEncryptionOptionsOutputReference getEncryptionOptions() {
        return software.amazon.jsii.Kernel.get(this, "encryptionOptions", software.amazon.jsii.NativeType.forClass(imports.aws.mq_broker.MqBrokerEncryptionOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mq_broker.MqBrokerInstancesList getInstances() {
        return software.amazon.jsii.Kernel.get(this, "instances", software.amazon.jsii.NativeType.forClass(imports.aws.mq_broker.MqBrokerInstancesList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mq_broker.MqBrokerLdapServerMetadataOutputReference getLdapServerMetadata() {
        return software.amazon.jsii.Kernel.get(this, "ldapServerMetadata", software.amazon.jsii.NativeType.forClass(imports.aws.mq_broker.MqBrokerLdapServerMetadataOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mq_broker.MqBrokerLogsOutputReference getLogs() {
        return software.amazon.jsii.Kernel.get(this, "logs", software.amazon.jsii.NativeType.forClass(imports.aws.mq_broker.MqBrokerLogsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mq_broker.MqBrokerMaintenanceWindowStartTimeOutputReference getMaintenanceWindowStartTime() {
        return software.amazon.jsii.Kernel.get(this, "maintenanceWindowStartTime", software.amazon.jsii.NativeType.forClass(imports.aws.mq_broker.MqBrokerMaintenanceWindowStartTimeOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPendingDataReplicationMode() {
        return software.amazon.jsii.Kernel.get(this, "pendingDataReplicationMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mq_broker.MqBrokerTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.mq_broker.MqBrokerTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mq_broker.MqBrokerUserList getUser() {
        return software.amazon.jsii.Kernel.get(this, "user", software.amazon.jsii.NativeType.forClass(imports.aws.mq_broker.MqBrokerUserList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getApplyImmediatelyInput() {
        return software.amazon.jsii.Kernel.get(this, "applyImmediatelyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuthenticationStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "authenticationStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAutoMinorVersionUpgradeInput() {
        return software.amazon.jsii.Kernel.get(this, "autoMinorVersionUpgradeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBrokerNameInput() {
        return software.amazon.jsii.Kernel.get(this, "brokerNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mq_broker.MqBrokerConfiguration getConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "configurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.mq_broker.MqBrokerConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataReplicationModeInput() {
        return software.amazon.jsii.Kernel.get(this, "dataReplicationModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataReplicationPrimaryBrokerArnInput() {
        return software.amazon.jsii.Kernel.get(this, "dataReplicationPrimaryBrokerArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeploymentModeInput() {
        return software.amazon.jsii.Kernel.get(this, "deploymentModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mq_broker.MqBrokerEncryptionOptions getEncryptionOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptionOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.mq_broker.MqBrokerEncryptionOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEngineTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "engineTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEngineVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "engineVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHostInstanceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "hostInstanceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mq_broker.MqBrokerLdapServerMetadata getLdapServerMetadataInput() {
        return software.amazon.jsii.Kernel.get(this, "ldapServerMetadataInput", software.amazon.jsii.NativeType.forClass(imports.aws.mq_broker.MqBrokerLdapServerMetadata.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mq_broker.MqBrokerLogs getLogsInput() {
        return software.amazon.jsii.Kernel.get(this, "logsInput", software.amazon.jsii.NativeType.forClass(imports.aws.mq_broker.MqBrokerLogs.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mq_broker.MqBrokerMaintenanceWindowStartTime getMaintenanceWindowStartTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "maintenanceWindowStartTimeInput", software.amazon.jsii.NativeType.forClass(imports.aws.mq_broker.MqBrokerMaintenanceWindowStartTime.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPubliclyAccessibleInput() {
        return software.amazon.jsii.Kernel.get(this, "publiclyAccessibleInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "securityGroupsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStorageTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "storageTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSubnetIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "subnetIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
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

    public @org.jetbrains.annotations.Nullable java.lang.Object getUserInput() {
        return software.amazon.jsii.Kernel.get(this, "userInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getApplyImmediately() {
        return software.amazon.jsii.Kernel.get(this, "applyImmediately", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setApplyImmediately(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "applyImmediately", java.util.Objects.requireNonNull(value, "applyImmediately is required"));
    }

    public void setApplyImmediately(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "applyImmediately", java.util.Objects.requireNonNull(value, "applyImmediately is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthenticationStrategy() {
        return software.amazon.jsii.Kernel.get(this, "authenticationStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuthenticationStrategy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "authenticationStrategy", java.util.Objects.requireNonNull(value, "authenticationStrategy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAutoMinorVersionUpgrade() {
        return software.amazon.jsii.Kernel.get(this, "autoMinorVersionUpgrade", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAutoMinorVersionUpgrade(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "autoMinorVersionUpgrade", java.util.Objects.requireNonNull(value, "autoMinorVersionUpgrade is required"));
    }

    public void setAutoMinorVersionUpgrade(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "autoMinorVersionUpgrade", java.util.Objects.requireNonNull(value, "autoMinorVersionUpgrade is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBrokerName() {
        return software.amazon.jsii.Kernel.get(this, "brokerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBrokerName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "brokerName", java.util.Objects.requireNonNull(value, "brokerName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataReplicationMode() {
        return software.amazon.jsii.Kernel.get(this, "dataReplicationMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataReplicationMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataReplicationMode", java.util.Objects.requireNonNull(value, "dataReplicationMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataReplicationPrimaryBrokerArn() {
        return software.amazon.jsii.Kernel.get(this, "dataReplicationPrimaryBrokerArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataReplicationPrimaryBrokerArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataReplicationPrimaryBrokerArn", java.util.Objects.requireNonNull(value, "dataReplicationPrimaryBrokerArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeploymentMode() {
        return software.amazon.jsii.Kernel.get(this, "deploymentMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeploymentMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deploymentMode", java.util.Objects.requireNonNull(value, "deploymentMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngineType() {
        return software.amazon.jsii.Kernel.get(this, "engineType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEngineType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "engineType", java.util.Objects.requireNonNull(value, "engineType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngineVersion() {
        return software.amazon.jsii.Kernel.get(this, "engineVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEngineVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "engineVersion", java.util.Objects.requireNonNull(value, "engineVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHostInstanceType() {
        return software.amazon.jsii.Kernel.get(this, "hostInstanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHostInstanceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "hostInstanceType", java.util.Objects.requireNonNull(value, "hostInstanceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getPubliclyAccessible() {
        return software.amazon.jsii.Kernel.get(this, "publiclyAccessible", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setPubliclyAccessible(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "publiclyAccessible", java.util.Objects.requireNonNull(value, "publiclyAccessible is required"));
    }

    public void setPubliclyAccessible(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "publiclyAccessible", java.util.Objects.requireNonNull(value, "publiclyAccessible is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroups() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "securityGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSecurityGroups(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "securityGroups", java.util.Objects.requireNonNull(value, "securityGroups is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStorageType() {
        return software.amazon.jsii.Kernel.get(this, "storageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStorageType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "storageType", java.util.Objects.requireNonNull(value, "storageType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnetIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSubnetIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "subnetIds", java.util.Objects.requireNonNull(value, "subnetIds is required"));
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
     * A fluent builder for {@link imports.aws.mq_broker.MqBroker}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.mq_broker.MqBroker> {
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
        private final imports.aws.mq_broker.MqBrokerConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.mq_broker.MqBrokerConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#broker_name MqBroker#broker_name}.
         * <p>
         * @return {@code this}
         * @param brokerName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#broker_name MqBroker#broker_name}. This parameter is required.
         */
        public Builder brokerName(final java.lang.String brokerName) {
            this.config.brokerName(brokerName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#engine_type MqBroker#engine_type}.
         * <p>
         * @return {@code this}
         * @param engineType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#engine_type MqBroker#engine_type}. This parameter is required.
         */
        public Builder engineType(final java.lang.String engineType) {
            this.config.engineType(engineType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#engine_version MqBroker#engine_version}.
         * <p>
         * @return {@code this}
         * @param engineVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#engine_version MqBroker#engine_version}. This parameter is required.
         */
        public Builder engineVersion(final java.lang.String engineVersion) {
            this.config.engineVersion(engineVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#host_instance_type MqBroker#host_instance_type}.
         * <p>
         * @return {@code this}
         * @param hostInstanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#host_instance_type MqBroker#host_instance_type}. This parameter is required.
         */
        public Builder hostInstanceType(final java.lang.String hostInstanceType) {
            this.config.hostInstanceType(hostInstanceType);
            return this;
        }

        /**
         * user block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#user MqBroker#user}
         * <p>
         * @return {@code this}
         * @param user user block. This parameter is required.
         */
        public Builder user(final com.hashicorp.cdktf.IResolvable user) {
            this.config.user(user);
            return this;
        }
        /**
         * user block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#user MqBroker#user}
         * <p>
         * @return {@code this}
         * @param user user block. This parameter is required.
         */
        public Builder user(final java.util.List<? extends imports.aws.mq_broker.MqBrokerUser> user) {
            this.config.user(user);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#apply_immediately MqBroker#apply_immediately}.
         * <p>
         * @return {@code this}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#apply_immediately MqBroker#apply_immediately}. This parameter is required.
         */
        public Builder applyImmediately(final java.lang.Boolean applyImmediately) {
            this.config.applyImmediately(applyImmediately);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#apply_immediately MqBroker#apply_immediately}.
         * <p>
         * @return {@code this}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#apply_immediately MqBroker#apply_immediately}. This parameter is required.
         */
        public Builder applyImmediately(final com.hashicorp.cdktf.IResolvable applyImmediately) {
            this.config.applyImmediately(applyImmediately);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#authentication_strategy MqBroker#authentication_strategy}.
         * <p>
         * @return {@code this}
         * @param authenticationStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#authentication_strategy MqBroker#authentication_strategy}. This parameter is required.
         */
        public Builder authenticationStrategy(final java.lang.String authenticationStrategy) {
            this.config.authenticationStrategy(authenticationStrategy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#auto_minor_version_upgrade MqBroker#auto_minor_version_upgrade}.
         * <p>
         * @return {@code this}
         * @param autoMinorVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#auto_minor_version_upgrade MqBroker#auto_minor_version_upgrade}. This parameter is required.
         */
        public Builder autoMinorVersionUpgrade(final java.lang.Boolean autoMinorVersionUpgrade) {
            this.config.autoMinorVersionUpgrade(autoMinorVersionUpgrade);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#auto_minor_version_upgrade MqBroker#auto_minor_version_upgrade}.
         * <p>
         * @return {@code this}
         * @param autoMinorVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#auto_minor_version_upgrade MqBroker#auto_minor_version_upgrade}. This parameter is required.
         */
        public Builder autoMinorVersionUpgrade(final com.hashicorp.cdktf.IResolvable autoMinorVersionUpgrade) {
            this.config.autoMinorVersionUpgrade(autoMinorVersionUpgrade);
            return this;
        }

        /**
         * configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#configuration MqBroker#configuration}
         * <p>
         * @return {@code this}
         * @param configuration configuration block. This parameter is required.
         */
        public Builder configuration(final imports.aws.mq_broker.MqBrokerConfiguration configuration) {
            this.config.configuration(configuration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#data_replication_mode MqBroker#data_replication_mode}.
         * <p>
         * @return {@code this}
         * @param dataReplicationMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#data_replication_mode MqBroker#data_replication_mode}. This parameter is required.
         */
        public Builder dataReplicationMode(final java.lang.String dataReplicationMode) {
            this.config.dataReplicationMode(dataReplicationMode);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#data_replication_primary_broker_arn MqBroker#data_replication_primary_broker_arn}.
         * <p>
         * @return {@code this}
         * @param dataReplicationPrimaryBrokerArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#data_replication_primary_broker_arn MqBroker#data_replication_primary_broker_arn}. This parameter is required.
         */
        public Builder dataReplicationPrimaryBrokerArn(final java.lang.String dataReplicationPrimaryBrokerArn) {
            this.config.dataReplicationPrimaryBrokerArn(dataReplicationPrimaryBrokerArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#deployment_mode MqBroker#deployment_mode}.
         * <p>
         * @return {@code this}
         * @param deploymentMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#deployment_mode MqBroker#deployment_mode}. This parameter is required.
         */
        public Builder deploymentMode(final java.lang.String deploymentMode) {
            this.config.deploymentMode(deploymentMode);
            return this;
        }

        /**
         * encryption_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#encryption_options MqBroker#encryption_options}
         * <p>
         * @return {@code this}
         * @param encryptionOptions encryption_options block. This parameter is required.
         */
        public Builder encryptionOptions(final imports.aws.mq_broker.MqBrokerEncryptionOptions encryptionOptions) {
            this.config.encryptionOptions(encryptionOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#id MqBroker#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#id MqBroker#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * ldap_server_metadata block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#ldap_server_metadata MqBroker#ldap_server_metadata}
         * <p>
         * @return {@code this}
         * @param ldapServerMetadata ldap_server_metadata block. This parameter is required.
         */
        public Builder ldapServerMetadata(final imports.aws.mq_broker.MqBrokerLdapServerMetadata ldapServerMetadata) {
            this.config.ldapServerMetadata(ldapServerMetadata);
            return this;
        }

        /**
         * logs block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#logs MqBroker#logs}
         * <p>
         * @return {@code this}
         * @param logs logs block. This parameter is required.
         */
        public Builder logs(final imports.aws.mq_broker.MqBrokerLogs logs) {
            this.config.logs(logs);
            return this;
        }

        /**
         * maintenance_window_start_time block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#maintenance_window_start_time MqBroker#maintenance_window_start_time}
         * <p>
         * @return {@code this}
         * @param maintenanceWindowStartTime maintenance_window_start_time block. This parameter is required.
         */
        public Builder maintenanceWindowStartTime(final imports.aws.mq_broker.MqBrokerMaintenanceWindowStartTime maintenanceWindowStartTime) {
            this.config.maintenanceWindowStartTime(maintenanceWindowStartTime);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#publicly_accessible MqBroker#publicly_accessible}.
         * <p>
         * @return {@code this}
         * @param publiclyAccessible Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#publicly_accessible MqBroker#publicly_accessible}. This parameter is required.
         */
        public Builder publiclyAccessible(final java.lang.Boolean publiclyAccessible) {
            this.config.publiclyAccessible(publiclyAccessible);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#publicly_accessible MqBroker#publicly_accessible}.
         * <p>
         * @return {@code this}
         * @param publiclyAccessible Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#publicly_accessible MqBroker#publicly_accessible}. This parameter is required.
         */
        public Builder publiclyAccessible(final com.hashicorp.cdktf.IResolvable publiclyAccessible) {
            this.config.publiclyAccessible(publiclyAccessible);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#security_groups MqBroker#security_groups}.
         * <p>
         * @return {@code this}
         * @param securityGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#security_groups MqBroker#security_groups}. This parameter is required.
         */
        public Builder securityGroups(final java.util.List<java.lang.String> securityGroups) {
            this.config.securityGroups(securityGroups);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#storage_type MqBroker#storage_type}.
         * <p>
         * @return {@code this}
         * @param storageType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#storage_type MqBroker#storage_type}. This parameter is required.
         */
        public Builder storageType(final java.lang.String storageType) {
            this.config.storageType(storageType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#subnet_ids MqBroker#subnet_ids}.
         * <p>
         * @return {@code this}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#subnet_ids MqBroker#subnet_ids}. This parameter is required.
         */
        public Builder subnetIds(final java.util.List<java.lang.String> subnetIds) {
            this.config.subnetIds(subnetIds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#tags MqBroker#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#tags MqBroker#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#tags_all MqBroker#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#tags_all MqBroker#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#timeouts MqBroker#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.mq_broker.MqBrokerTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.mq_broker.MqBroker}.
         */
        @Override
        public imports.aws.mq_broker.MqBroker build() {
            return new imports.aws.mq_broker.MqBroker(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
