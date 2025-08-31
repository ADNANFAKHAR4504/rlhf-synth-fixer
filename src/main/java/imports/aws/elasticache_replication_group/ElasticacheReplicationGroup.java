package imports.aws.elasticache_replication_group;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group aws_elasticache_replication_group}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.169Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticacheReplicationGroup.ElasticacheReplicationGroup")
public class ElasticacheReplicationGroup extends com.hashicorp.cdktf.TerraformResource {

    protected ElasticacheReplicationGroup(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ElasticacheReplicationGroup(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.elasticache_replication_group.ElasticacheReplicationGroup.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group aws_elasticache_replication_group} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public ElasticacheReplicationGroup(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.elasticache_replication_group.ElasticacheReplicationGroupConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a ElasticacheReplicationGroup resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ElasticacheReplicationGroup to import. This parameter is required.
     * @param importFromId The id of the existing ElasticacheReplicationGroup that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the ElasticacheReplicationGroup to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.elasticache_replication_group.ElasticacheReplicationGroup.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a ElasticacheReplicationGroup resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ElasticacheReplicationGroup to import. This parameter is required.
     * @param importFromId The id of the existing ElasticacheReplicationGroup that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.elasticache_replication_group.ElasticacheReplicationGroup.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putLogDeliveryConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.elasticache_replication_group.ElasticacheReplicationGroupLogDeliveryConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.elasticache_replication_group.ElasticacheReplicationGroupLogDeliveryConfiguration> __cast_cd4240 = (java.util.List<imports.aws.elasticache_replication_group.ElasticacheReplicationGroupLogDeliveryConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.elasticache_replication_group.ElasticacheReplicationGroupLogDeliveryConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLogDeliveryConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.elasticache_replication_group.ElasticacheReplicationGroupTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetApplyImmediately() {
        software.amazon.jsii.Kernel.call(this, "resetApplyImmediately", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAtRestEncryptionEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetAtRestEncryptionEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAuthToken() {
        software.amazon.jsii.Kernel.call(this, "resetAuthToken", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAuthTokenUpdateStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetAuthTokenUpdateStrategy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutomaticFailoverEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetAutomaticFailoverEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoMinorVersionUpgrade() {
        software.amazon.jsii.Kernel.call(this, "resetAutoMinorVersionUpgrade", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClusterMode() {
        software.amazon.jsii.Kernel.call(this, "resetClusterMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDataTieringEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetDataTieringEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEngine() {
        software.amazon.jsii.Kernel.call(this, "resetEngine", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEngineVersion() {
        software.amazon.jsii.Kernel.call(this, "resetEngineVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFinalSnapshotIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetFinalSnapshotIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGlobalReplicationGroupId() {
        software.amazon.jsii.Kernel.call(this, "resetGlobalReplicationGroupId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpDiscovery() {
        software.amazon.jsii.Kernel.call(this, "resetIpDiscovery", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogDeliveryConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetLogDeliveryConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaintenanceWindow() {
        software.amazon.jsii.Kernel.call(this, "resetMaintenanceWindow", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMultiAzEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetMultiAzEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkType() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNodeType() {
        software.amazon.jsii.Kernel.call(this, "resetNodeType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNotificationTopicArn() {
        software.amazon.jsii.Kernel.call(this, "resetNotificationTopicArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNumCacheClusters() {
        software.amazon.jsii.Kernel.call(this, "resetNumCacheClusters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNumNodeGroups() {
        software.amazon.jsii.Kernel.call(this, "resetNumNodeGroups", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParameterGroupName() {
        software.amazon.jsii.Kernel.call(this, "resetParameterGroupName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPort() {
        software.amazon.jsii.Kernel.call(this, "resetPort", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreferredCacheClusterAzs() {
        software.amazon.jsii.Kernel.call(this, "resetPreferredCacheClusterAzs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReplicasPerNodeGroup() {
        software.amazon.jsii.Kernel.call(this, "resetReplicasPerNodeGroup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityGroupIds() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityGroupIds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityGroupNames() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityGroupNames", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnapshotArns() {
        software.amazon.jsii.Kernel.call(this, "resetSnapshotArns", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnapshotName() {
        software.amazon.jsii.Kernel.call(this, "resetSnapshotName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnapshotRetentionLimit() {
        software.amazon.jsii.Kernel.call(this, "resetSnapshotRetentionLimit", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnapshotWindow() {
        software.amazon.jsii.Kernel.call(this, "resetSnapshotWindow", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSubnetGroupName() {
        software.amazon.jsii.Kernel.call(this, "resetSubnetGroupName", software.amazon.jsii.NativeType.VOID);
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

    public void resetTransitEncryptionEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetTransitEncryptionEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTransitEncryptionMode() {
        software.amazon.jsii.Kernel.call(this, "resetTransitEncryptionMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserGroupIds() {
        software.amazon.jsii.Kernel.call(this, "resetUserGroupIds", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getClusterEnabled() {
        return software.amazon.jsii.Kernel.get(this, "clusterEnabled", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConfigurationEndpointAddress() {
        return software.amazon.jsii.Kernel.get(this, "configurationEndpointAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngineVersionActual() {
        return software.amazon.jsii.Kernel.get(this, "engineVersionActual", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.elasticache_replication_group.ElasticacheReplicationGroupLogDeliveryConfigurationList getLogDeliveryConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "logDeliveryConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.elasticache_replication_group.ElasticacheReplicationGroupLogDeliveryConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getMemberClusters() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "memberClusters", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrimaryEndpointAddress() {
        return software.amazon.jsii.Kernel.get(this, "primaryEndpointAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReaderEndpointAddress() {
        return software.amazon.jsii.Kernel.get(this, "readerEndpointAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.elasticache_replication_group.ElasticacheReplicationGroupTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.elasticache_replication_group.ElasticacheReplicationGroupTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getApplyImmediatelyInput() {
        return software.amazon.jsii.Kernel.get(this, "applyImmediatelyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAtRestEncryptionEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "atRestEncryptionEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuthTokenInput() {
        return software.amazon.jsii.Kernel.get(this, "authTokenInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuthTokenUpdateStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "authTokenUpdateStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAutomaticFailoverEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "automaticFailoverEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAutoMinorVersionUpgradeInput() {
        return software.amazon.jsii.Kernel.get(this, "autoMinorVersionUpgradeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClusterModeInput() {
        return software.amazon.jsii.Kernel.get(this, "clusterModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDataTieringEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "dataTieringEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEngineInput() {
        return software.amazon.jsii.Kernel.get(this, "engineInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEngineVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "engineVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFinalSnapshotIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "finalSnapshotIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGlobalReplicationGroupIdInput() {
        return software.amazon.jsii.Kernel.get(this, "globalReplicationGroupIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIpDiscoveryInput() {
        return software.amazon.jsii.Kernel.get(this, "ipDiscoveryInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLogDeliveryConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "logDeliveryConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMaintenanceWindowInput() {
        return software.amazon.jsii.Kernel.get(this, "maintenanceWindowInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMultiAzEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "multiAzEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNetworkTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "networkTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNodeTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "nodeTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNotificationTopicArnInput() {
        return software.amazon.jsii.Kernel.get(this, "notificationTopicArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getNumCacheClustersInput() {
        return software.amazon.jsii.Kernel.get(this, "numCacheClustersInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getNumNodeGroupsInput() {
        return software.amazon.jsii.Kernel.get(this, "numNodeGroupsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getParameterGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "parameterGroupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPortInput() {
        return software.amazon.jsii.Kernel.get(this, "portInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPreferredCacheClusterAzsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "preferredCacheClusterAzsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getReplicasPerNodeGroupInput() {
        return software.amazon.jsii.Kernel.get(this, "replicasPerNodeGroupInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReplicationGroupIdInput() {
        return software.amazon.jsii.Kernel.get(this, "replicationGroupIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "securityGroupIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupNamesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "securityGroupNamesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSnapshotArnsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "snapshotArnsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSnapshotNameInput() {
        return software.amazon.jsii.Kernel.get(this, "snapshotNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSnapshotRetentionLimitInput() {
        return software.amazon.jsii.Kernel.get(this, "snapshotRetentionLimitInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSnapshotWindowInput() {
        return software.amazon.jsii.Kernel.get(this, "snapshotWindowInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSubnetGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "subnetGroupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.Object getTransitEncryptionEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "transitEncryptionEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTransitEncryptionModeInput() {
        return software.amazon.jsii.Kernel.get(this, "transitEncryptionModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getUserGroupIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "userGroupIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getAtRestEncryptionEnabled() {
        return software.amazon.jsii.Kernel.get(this, "atRestEncryptionEnabled", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAtRestEncryptionEnabled(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "atRestEncryptionEnabled", java.util.Objects.requireNonNull(value, "atRestEncryptionEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthToken() {
        return software.amazon.jsii.Kernel.get(this, "authToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuthToken(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "authToken", java.util.Objects.requireNonNull(value, "authToken is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthTokenUpdateStrategy() {
        return software.amazon.jsii.Kernel.get(this, "authTokenUpdateStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuthTokenUpdateStrategy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "authTokenUpdateStrategy", java.util.Objects.requireNonNull(value, "authTokenUpdateStrategy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAutomaticFailoverEnabled() {
        return software.amazon.jsii.Kernel.get(this, "automaticFailoverEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAutomaticFailoverEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "automaticFailoverEnabled", java.util.Objects.requireNonNull(value, "automaticFailoverEnabled is required"));
    }

    public void setAutomaticFailoverEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "automaticFailoverEnabled", java.util.Objects.requireNonNull(value, "automaticFailoverEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAutoMinorVersionUpgrade() {
        return software.amazon.jsii.Kernel.get(this, "autoMinorVersionUpgrade", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAutoMinorVersionUpgrade(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "autoMinorVersionUpgrade", java.util.Objects.requireNonNull(value, "autoMinorVersionUpgrade is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClusterMode() {
        return software.amazon.jsii.Kernel.get(this, "clusterMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClusterMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clusterMode", java.util.Objects.requireNonNull(value, "clusterMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDataTieringEnabled() {
        return software.amazon.jsii.Kernel.get(this, "dataTieringEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDataTieringEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "dataTieringEnabled", java.util.Objects.requireNonNull(value, "dataTieringEnabled is required"));
    }

    public void setDataTieringEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "dataTieringEnabled", java.util.Objects.requireNonNull(value, "dataTieringEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngine() {
        return software.amazon.jsii.Kernel.get(this, "engine", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEngine(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "engine", java.util.Objects.requireNonNull(value, "engine is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngineVersion() {
        return software.amazon.jsii.Kernel.get(this, "engineVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEngineVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "engineVersion", java.util.Objects.requireNonNull(value, "engineVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFinalSnapshotIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "finalSnapshotIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFinalSnapshotIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "finalSnapshotIdentifier", java.util.Objects.requireNonNull(value, "finalSnapshotIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGlobalReplicationGroupId() {
        return software.amazon.jsii.Kernel.get(this, "globalReplicationGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGlobalReplicationGroupId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "globalReplicationGroupId", java.util.Objects.requireNonNull(value, "globalReplicationGroupId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIpDiscovery() {
        return software.amazon.jsii.Kernel.get(this, "ipDiscovery", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIpDiscovery(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ipDiscovery", java.util.Objects.requireNonNull(value, "ipDiscovery is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyId", java.util.Objects.requireNonNull(value, "kmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMaintenanceWindow() {
        return software.amazon.jsii.Kernel.get(this, "maintenanceWindow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMaintenanceWindow(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "maintenanceWindow", java.util.Objects.requireNonNull(value, "maintenanceWindow is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getMultiAzEnabled() {
        return software.amazon.jsii.Kernel.get(this, "multiAzEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setMultiAzEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "multiAzEnabled", java.util.Objects.requireNonNull(value, "multiAzEnabled is required"));
    }

    public void setMultiAzEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "multiAzEnabled", java.util.Objects.requireNonNull(value, "multiAzEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNetworkType() {
        return software.amazon.jsii.Kernel.get(this, "networkType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNetworkType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "networkType", java.util.Objects.requireNonNull(value, "networkType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNodeType() {
        return software.amazon.jsii.Kernel.get(this, "nodeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNodeType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "nodeType", java.util.Objects.requireNonNull(value, "nodeType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNotificationTopicArn() {
        return software.amazon.jsii.Kernel.get(this, "notificationTopicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNotificationTopicArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "notificationTopicArn", java.util.Objects.requireNonNull(value, "notificationTopicArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getNumCacheClusters() {
        return software.amazon.jsii.Kernel.get(this, "numCacheClusters", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setNumCacheClusters(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "numCacheClusters", java.util.Objects.requireNonNull(value, "numCacheClusters is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getNumNodeGroups() {
        return software.amazon.jsii.Kernel.get(this, "numNodeGroups", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setNumNodeGroups(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "numNodeGroups", java.util.Objects.requireNonNull(value, "numNodeGroups is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getParameterGroupName() {
        return software.amazon.jsii.Kernel.get(this, "parameterGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setParameterGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "parameterGroupName", java.util.Objects.requireNonNull(value, "parameterGroupName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPort() {
        return software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPort(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "port", java.util.Objects.requireNonNull(value, "port is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getPreferredCacheClusterAzs() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "preferredCacheClusterAzs", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setPreferredCacheClusterAzs(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "preferredCacheClusterAzs", java.util.Objects.requireNonNull(value, "preferredCacheClusterAzs is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getReplicasPerNodeGroup() {
        return software.amazon.jsii.Kernel.get(this, "replicasPerNodeGroup", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setReplicasPerNodeGroup(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "replicasPerNodeGroup", java.util.Objects.requireNonNull(value, "replicasPerNodeGroup is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReplicationGroupId() {
        return software.amazon.jsii.Kernel.get(this, "replicationGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReplicationGroupId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "replicationGroupId", java.util.Objects.requireNonNull(value, "replicationGroupId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroupIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSecurityGroupIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "securityGroupIds", java.util.Objects.requireNonNull(value, "securityGroupIds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroupNames() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "securityGroupNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSecurityGroupNames(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "securityGroupNames", java.util.Objects.requireNonNull(value, "securityGroupNames is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSnapshotArns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "snapshotArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSnapshotArns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "snapshotArns", java.util.Objects.requireNonNull(value, "snapshotArns is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSnapshotName() {
        return software.amazon.jsii.Kernel.get(this, "snapshotName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSnapshotName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "snapshotName", java.util.Objects.requireNonNull(value, "snapshotName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSnapshotRetentionLimit() {
        return software.amazon.jsii.Kernel.get(this, "snapshotRetentionLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSnapshotRetentionLimit(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "snapshotRetentionLimit", java.util.Objects.requireNonNull(value, "snapshotRetentionLimit is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSnapshotWindow() {
        return software.amazon.jsii.Kernel.get(this, "snapshotWindow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSnapshotWindow(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "snapshotWindow", java.util.Objects.requireNonNull(value, "snapshotWindow is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSubnetGroupName() {
        return software.amazon.jsii.Kernel.get(this, "subnetGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSubnetGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "subnetGroupName", java.util.Objects.requireNonNull(value, "subnetGroupName is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getTransitEncryptionEnabled() {
        return software.amazon.jsii.Kernel.get(this, "transitEncryptionEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setTransitEncryptionEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "transitEncryptionEnabled", java.util.Objects.requireNonNull(value, "transitEncryptionEnabled is required"));
    }

    public void setTransitEncryptionEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "transitEncryptionEnabled", java.util.Objects.requireNonNull(value, "transitEncryptionEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTransitEncryptionMode() {
        return software.amazon.jsii.Kernel.get(this, "transitEncryptionMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTransitEncryptionMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "transitEncryptionMode", java.util.Objects.requireNonNull(value, "transitEncryptionMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getUserGroupIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "userGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setUserGroupIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "userGroupIds", java.util.Objects.requireNonNull(value, "userGroupIds is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.elasticache_replication_group.ElasticacheReplicationGroup}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.elasticache_replication_group.ElasticacheReplicationGroup> {
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
        private final imports.aws.elasticache_replication_group.ElasticacheReplicationGroupConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.elasticache_replication_group.ElasticacheReplicationGroupConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#description ElasticacheReplicationGroup#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#description ElasticacheReplicationGroup#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#replication_group_id ElasticacheReplicationGroup#replication_group_id}.
         * <p>
         * @return {@code this}
         * @param replicationGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#replication_group_id ElasticacheReplicationGroup#replication_group_id}. This parameter is required.
         */
        public Builder replicationGroupId(final java.lang.String replicationGroupId) {
            this.config.replicationGroupId(replicationGroupId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#apply_immediately ElasticacheReplicationGroup#apply_immediately}.
         * <p>
         * @return {@code this}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#apply_immediately ElasticacheReplicationGroup#apply_immediately}. This parameter is required.
         */
        public Builder applyImmediately(final java.lang.Boolean applyImmediately) {
            this.config.applyImmediately(applyImmediately);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#apply_immediately ElasticacheReplicationGroup#apply_immediately}.
         * <p>
         * @return {@code this}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#apply_immediately ElasticacheReplicationGroup#apply_immediately}. This parameter is required.
         */
        public Builder applyImmediately(final com.hashicorp.cdktf.IResolvable applyImmediately) {
            this.config.applyImmediately(applyImmediately);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#at_rest_encryption_enabled ElasticacheReplicationGroup#at_rest_encryption_enabled}.
         * <p>
         * @return {@code this}
         * @param atRestEncryptionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#at_rest_encryption_enabled ElasticacheReplicationGroup#at_rest_encryption_enabled}. This parameter is required.
         */
        public Builder atRestEncryptionEnabled(final java.lang.String atRestEncryptionEnabled) {
            this.config.atRestEncryptionEnabled(atRestEncryptionEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#auth_token ElasticacheReplicationGroup#auth_token}.
         * <p>
         * @return {@code this}
         * @param authToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#auth_token ElasticacheReplicationGroup#auth_token}. This parameter is required.
         */
        public Builder authToken(final java.lang.String authToken) {
            this.config.authToken(authToken);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#auth_token_update_strategy ElasticacheReplicationGroup#auth_token_update_strategy}.
         * <p>
         * @return {@code this}
         * @param authTokenUpdateStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#auth_token_update_strategy ElasticacheReplicationGroup#auth_token_update_strategy}. This parameter is required.
         */
        public Builder authTokenUpdateStrategy(final java.lang.String authTokenUpdateStrategy) {
            this.config.authTokenUpdateStrategy(authTokenUpdateStrategy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#automatic_failover_enabled ElasticacheReplicationGroup#automatic_failover_enabled}.
         * <p>
         * @return {@code this}
         * @param automaticFailoverEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#automatic_failover_enabled ElasticacheReplicationGroup#automatic_failover_enabled}. This parameter is required.
         */
        public Builder automaticFailoverEnabled(final java.lang.Boolean automaticFailoverEnabled) {
            this.config.automaticFailoverEnabled(automaticFailoverEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#automatic_failover_enabled ElasticacheReplicationGroup#automatic_failover_enabled}.
         * <p>
         * @return {@code this}
         * @param automaticFailoverEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#automatic_failover_enabled ElasticacheReplicationGroup#automatic_failover_enabled}. This parameter is required.
         */
        public Builder automaticFailoverEnabled(final com.hashicorp.cdktf.IResolvable automaticFailoverEnabled) {
            this.config.automaticFailoverEnabled(automaticFailoverEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#auto_minor_version_upgrade ElasticacheReplicationGroup#auto_minor_version_upgrade}.
         * <p>
         * @return {@code this}
         * @param autoMinorVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#auto_minor_version_upgrade ElasticacheReplicationGroup#auto_minor_version_upgrade}. This parameter is required.
         */
        public Builder autoMinorVersionUpgrade(final java.lang.String autoMinorVersionUpgrade) {
            this.config.autoMinorVersionUpgrade(autoMinorVersionUpgrade);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#cluster_mode ElasticacheReplicationGroup#cluster_mode}.
         * <p>
         * @return {@code this}
         * @param clusterMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#cluster_mode ElasticacheReplicationGroup#cluster_mode}. This parameter is required.
         */
        public Builder clusterMode(final java.lang.String clusterMode) {
            this.config.clusterMode(clusterMode);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#data_tiering_enabled ElasticacheReplicationGroup#data_tiering_enabled}.
         * <p>
         * @return {@code this}
         * @param dataTieringEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#data_tiering_enabled ElasticacheReplicationGroup#data_tiering_enabled}. This parameter is required.
         */
        public Builder dataTieringEnabled(final java.lang.Boolean dataTieringEnabled) {
            this.config.dataTieringEnabled(dataTieringEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#data_tiering_enabled ElasticacheReplicationGroup#data_tiering_enabled}.
         * <p>
         * @return {@code this}
         * @param dataTieringEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#data_tiering_enabled ElasticacheReplicationGroup#data_tiering_enabled}. This parameter is required.
         */
        public Builder dataTieringEnabled(final com.hashicorp.cdktf.IResolvable dataTieringEnabled) {
            this.config.dataTieringEnabled(dataTieringEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#engine ElasticacheReplicationGroup#engine}.
         * <p>
         * @return {@code this}
         * @param engine Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#engine ElasticacheReplicationGroup#engine}. This parameter is required.
         */
        public Builder engine(final java.lang.String engine) {
            this.config.engine(engine);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#engine_version ElasticacheReplicationGroup#engine_version}.
         * <p>
         * @return {@code this}
         * @param engineVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#engine_version ElasticacheReplicationGroup#engine_version}. This parameter is required.
         */
        public Builder engineVersion(final java.lang.String engineVersion) {
            this.config.engineVersion(engineVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#final_snapshot_identifier ElasticacheReplicationGroup#final_snapshot_identifier}.
         * <p>
         * @return {@code this}
         * @param finalSnapshotIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#final_snapshot_identifier ElasticacheReplicationGroup#final_snapshot_identifier}. This parameter is required.
         */
        public Builder finalSnapshotIdentifier(final java.lang.String finalSnapshotIdentifier) {
            this.config.finalSnapshotIdentifier(finalSnapshotIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#global_replication_group_id ElasticacheReplicationGroup#global_replication_group_id}.
         * <p>
         * @return {@code this}
         * @param globalReplicationGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#global_replication_group_id ElasticacheReplicationGroup#global_replication_group_id}. This parameter is required.
         */
        public Builder globalReplicationGroupId(final java.lang.String globalReplicationGroupId) {
            this.config.globalReplicationGroupId(globalReplicationGroupId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#id ElasticacheReplicationGroup#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#id ElasticacheReplicationGroup#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#ip_discovery ElasticacheReplicationGroup#ip_discovery}.
         * <p>
         * @return {@code this}
         * @param ipDiscovery Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#ip_discovery ElasticacheReplicationGroup#ip_discovery}. This parameter is required.
         */
        public Builder ipDiscovery(final java.lang.String ipDiscovery) {
            this.config.ipDiscovery(ipDiscovery);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#kms_key_id ElasticacheReplicationGroup#kms_key_id}.
         * <p>
         * @return {@code this}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#kms_key_id ElasticacheReplicationGroup#kms_key_id}. This parameter is required.
         */
        public Builder kmsKeyId(final java.lang.String kmsKeyId) {
            this.config.kmsKeyId(kmsKeyId);
            return this;
        }

        /**
         * log_delivery_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#log_delivery_configuration ElasticacheReplicationGroup#log_delivery_configuration}
         * <p>
         * @return {@code this}
         * @param logDeliveryConfiguration log_delivery_configuration block. This parameter is required.
         */
        public Builder logDeliveryConfiguration(final com.hashicorp.cdktf.IResolvable logDeliveryConfiguration) {
            this.config.logDeliveryConfiguration(logDeliveryConfiguration);
            return this;
        }
        /**
         * log_delivery_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#log_delivery_configuration ElasticacheReplicationGroup#log_delivery_configuration}
         * <p>
         * @return {@code this}
         * @param logDeliveryConfiguration log_delivery_configuration block. This parameter is required.
         */
        public Builder logDeliveryConfiguration(final java.util.List<? extends imports.aws.elasticache_replication_group.ElasticacheReplicationGroupLogDeliveryConfiguration> logDeliveryConfiguration) {
            this.config.logDeliveryConfiguration(logDeliveryConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#maintenance_window ElasticacheReplicationGroup#maintenance_window}.
         * <p>
         * @return {@code this}
         * @param maintenanceWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#maintenance_window ElasticacheReplicationGroup#maintenance_window}. This parameter is required.
         */
        public Builder maintenanceWindow(final java.lang.String maintenanceWindow) {
            this.config.maintenanceWindow(maintenanceWindow);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#multi_az_enabled ElasticacheReplicationGroup#multi_az_enabled}.
         * <p>
         * @return {@code this}
         * @param multiAzEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#multi_az_enabled ElasticacheReplicationGroup#multi_az_enabled}. This parameter is required.
         */
        public Builder multiAzEnabled(final java.lang.Boolean multiAzEnabled) {
            this.config.multiAzEnabled(multiAzEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#multi_az_enabled ElasticacheReplicationGroup#multi_az_enabled}.
         * <p>
         * @return {@code this}
         * @param multiAzEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#multi_az_enabled ElasticacheReplicationGroup#multi_az_enabled}. This parameter is required.
         */
        public Builder multiAzEnabled(final com.hashicorp.cdktf.IResolvable multiAzEnabled) {
            this.config.multiAzEnabled(multiAzEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#network_type ElasticacheReplicationGroup#network_type}.
         * <p>
         * @return {@code this}
         * @param networkType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#network_type ElasticacheReplicationGroup#network_type}. This parameter is required.
         */
        public Builder networkType(final java.lang.String networkType) {
            this.config.networkType(networkType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#node_type ElasticacheReplicationGroup#node_type}.
         * <p>
         * @return {@code this}
         * @param nodeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#node_type ElasticacheReplicationGroup#node_type}. This parameter is required.
         */
        public Builder nodeType(final java.lang.String nodeType) {
            this.config.nodeType(nodeType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#notification_topic_arn ElasticacheReplicationGroup#notification_topic_arn}.
         * <p>
         * @return {@code this}
         * @param notificationTopicArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#notification_topic_arn ElasticacheReplicationGroup#notification_topic_arn}. This parameter is required.
         */
        public Builder notificationTopicArn(final java.lang.String notificationTopicArn) {
            this.config.notificationTopicArn(notificationTopicArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#num_cache_clusters ElasticacheReplicationGroup#num_cache_clusters}.
         * <p>
         * @return {@code this}
         * @param numCacheClusters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#num_cache_clusters ElasticacheReplicationGroup#num_cache_clusters}. This parameter is required.
         */
        public Builder numCacheClusters(final java.lang.Number numCacheClusters) {
            this.config.numCacheClusters(numCacheClusters);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#num_node_groups ElasticacheReplicationGroup#num_node_groups}.
         * <p>
         * @return {@code this}
         * @param numNodeGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#num_node_groups ElasticacheReplicationGroup#num_node_groups}. This parameter is required.
         */
        public Builder numNodeGroups(final java.lang.Number numNodeGroups) {
            this.config.numNodeGroups(numNodeGroups);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#parameter_group_name ElasticacheReplicationGroup#parameter_group_name}.
         * <p>
         * @return {@code this}
         * @param parameterGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#parameter_group_name ElasticacheReplicationGroup#parameter_group_name}. This parameter is required.
         */
        public Builder parameterGroupName(final java.lang.String parameterGroupName) {
            this.config.parameterGroupName(parameterGroupName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#port ElasticacheReplicationGroup#port}.
         * <p>
         * @return {@code this}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#port ElasticacheReplicationGroup#port}. This parameter is required.
         */
        public Builder port(final java.lang.Number port) {
            this.config.port(port);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#preferred_cache_cluster_azs ElasticacheReplicationGroup#preferred_cache_cluster_azs}.
         * <p>
         * @return {@code this}
         * @param preferredCacheClusterAzs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#preferred_cache_cluster_azs ElasticacheReplicationGroup#preferred_cache_cluster_azs}. This parameter is required.
         */
        public Builder preferredCacheClusterAzs(final java.util.List<java.lang.String> preferredCacheClusterAzs) {
            this.config.preferredCacheClusterAzs(preferredCacheClusterAzs);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#replicas_per_node_group ElasticacheReplicationGroup#replicas_per_node_group}.
         * <p>
         * @return {@code this}
         * @param replicasPerNodeGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#replicas_per_node_group ElasticacheReplicationGroup#replicas_per_node_group}. This parameter is required.
         */
        public Builder replicasPerNodeGroup(final java.lang.Number replicasPerNodeGroup) {
            this.config.replicasPerNodeGroup(replicasPerNodeGroup);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#security_group_ids ElasticacheReplicationGroup#security_group_ids}.
         * <p>
         * @return {@code this}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#security_group_ids ElasticacheReplicationGroup#security_group_ids}. This parameter is required.
         */
        public Builder securityGroupIds(final java.util.List<java.lang.String> securityGroupIds) {
            this.config.securityGroupIds(securityGroupIds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#security_group_names ElasticacheReplicationGroup#security_group_names}.
         * <p>
         * @return {@code this}
         * @param securityGroupNames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#security_group_names ElasticacheReplicationGroup#security_group_names}. This parameter is required.
         */
        public Builder securityGroupNames(final java.util.List<java.lang.String> securityGroupNames) {
            this.config.securityGroupNames(securityGroupNames);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#snapshot_arns ElasticacheReplicationGroup#snapshot_arns}.
         * <p>
         * @return {@code this}
         * @param snapshotArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#snapshot_arns ElasticacheReplicationGroup#snapshot_arns}. This parameter is required.
         */
        public Builder snapshotArns(final java.util.List<java.lang.String> snapshotArns) {
            this.config.snapshotArns(snapshotArns);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#snapshot_name ElasticacheReplicationGroup#snapshot_name}.
         * <p>
         * @return {@code this}
         * @param snapshotName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#snapshot_name ElasticacheReplicationGroup#snapshot_name}. This parameter is required.
         */
        public Builder snapshotName(final java.lang.String snapshotName) {
            this.config.snapshotName(snapshotName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#snapshot_retention_limit ElasticacheReplicationGroup#snapshot_retention_limit}.
         * <p>
         * @return {@code this}
         * @param snapshotRetentionLimit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#snapshot_retention_limit ElasticacheReplicationGroup#snapshot_retention_limit}. This parameter is required.
         */
        public Builder snapshotRetentionLimit(final java.lang.Number snapshotRetentionLimit) {
            this.config.snapshotRetentionLimit(snapshotRetentionLimit);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#snapshot_window ElasticacheReplicationGroup#snapshot_window}.
         * <p>
         * @return {@code this}
         * @param snapshotWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#snapshot_window ElasticacheReplicationGroup#snapshot_window}. This parameter is required.
         */
        public Builder snapshotWindow(final java.lang.String snapshotWindow) {
            this.config.snapshotWindow(snapshotWindow);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#subnet_group_name ElasticacheReplicationGroup#subnet_group_name}.
         * <p>
         * @return {@code this}
         * @param subnetGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#subnet_group_name ElasticacheReplicationGroup#subnet_group_name}. This parameter is required.
         */
        public Builder subnetGroupName(final java.lang.String subnetGroupName) {
            this.config.subnetGroupName(subnetGroupName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#tags ElasticacheReplicationGroup#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#tags ElasticacheReplicationGroup#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#tags_all ElasticacheReplicationGroup#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#tags_all ElasticacheReplicationGroup#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#timeouts ElasticacheReplicationGroup#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.elasticache_replication_group.ElasticacheReplicationGroupTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#transit_encryption_enabled ElasticacheReplicationGroup#transit_encryption_enabled}.
         * <p>
         * @return {@code this}
         * @param transitEncryptionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#transit_encryption_enabled ElasticacheReplicationGroup#transit_encryption_enabled}. This parameter is required.
         */
        public Builder transitEncryptionEnabled(final java.lang.Boolean transitEncryptionEnabled) {
            this.config.transitEncryptionEnabled(transitEncryptionEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#transit_encryption_enabled ElasticacheReplicationGroup#transit_encryption_enabled}.
         * <p>
         * @return {@code this}
         * @param transitEncryptionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#transit_encryption_enabled ElasticacheReplicationGroup#transit_encryption_enabled}. This parameter is required.
         */
        public Builder transitEncryptionEnabled(final com.hashicorp.cdktf.IResolvable transitEncryptionEnabled) {
            this.config.transitEncryptionEnabled(transitEncryptionEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#transit_encryption_mode ElasticacheReplicationGroup#transit_encryption_mode}.
         * <p>
         * @return {@code this}
         * @param transitEncryptionMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#transit_encryption_mode ElasticacheReplicationGroup#transit_encryption_mode}. This parameter is required.
         */
        public Builder transitEncryptionMode(final java.lang.String transitEncryptionMode) {
            this.config.transitEncryptionMode(transitEncryptionMode);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#user_group_ids ElasticacheReplicationGroup#user_group_ids}.
         * <p>
         * @return {@code this}
         * @param userGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_replication_group#user_group_ids ElasticacheReplicationGroup#user_group_ids}. This parameter is required.
         */
        public Builder userGroupIds(final java.util.List<java.lang.String> userGroupIds) {
            this.config.userGroupIds(userGroupIds);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.elasticache_replication_group.ElasticacheReplicationGroup}.
         */
        @Override
        public imports.aws.elasticache_replication_group.ElasticacheReplicationGroup build() {
            return new imports.aws.elasticache_replication_group.ElasticacheReplicationGroup(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
