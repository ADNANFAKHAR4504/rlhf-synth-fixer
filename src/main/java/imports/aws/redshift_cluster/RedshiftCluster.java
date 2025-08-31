package imports.aws.redshift_cluster;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster aws_redshift_cluster}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.153Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.redshiftCluster.RedshiftCluster")
public class RedshiftCluster extends com.hashicorp.cdktf.TerraformResource {

    protected RedshiftCluster(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected RedshiftCluster(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.redshift_cluster.RedshiftCluster.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster aws_redshift_cluster} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public RedshiftCluster(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.redshift_cluster.RedshiftClusterConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a RedshiftCluster resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the RedshiftCluster to import. This parameter is required.
     * @param importFromId The id of the existing RedshiftCluster that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the RedshiftCluster to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.redshift_cluster.RedshiftCluster.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a RedshiftCluster resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the RedshiftCluster to import. This parameter is required.
     * @param importFromId The id of the existing RedshiftCluster that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.redshift_cluster.RedshiftCluster.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putLogging(final @org.jetbrains.annotations.NotNull imports.aws.redshift_cluster.RedshiftClusterLogging value) {
        software.amazon.jsii.Kernel.call(this, "putLogging", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSnapshotCopy(final @org.jetbrains.annotations.NotNull imports.aws.redshift_cluster.RedshiftClusterSnapshotCopy value) {
        software.amazon.jsii.Kernel.call(this, "putSnapshotCopy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.redshift_cluster.RedshiftClusterTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAllowVersionUpgrade() {
        software.amazon.jsii.Kernel.call(this, "resetAllowVersionUpgrade", software.amazon.jsii.NativeType.VOID);
    }

    public void resetApplyImmediately() {
        software.amazon.jsii.Kernel.call(this, "resetApplyImmediately", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAquaConfigurationStatus() {
        software.amazon.jsii.Kernel.call(this, "resetAquaConfigurationStatus", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutomatedSnapshotRetentionPeriod() {
        software.amazon.jsii.Kernel.call(this, "resetAutomatedSnapshotRetentionPeriod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAvailabilityZone() {
        software.amazon.jsii.Kernel.call(this, "resetAvailabilityZone", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAvailabilityZoneRelocationEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetAvailabilityZoneRelocationEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClusterParameterGroupName() {
        software.amazon.jsii.Kernel.call(this, "resetClusterParameterGroupName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClusterPublicKey() {
        software.amazon.jsii.Kernel.call(this, "resetClusterPublicKey", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClusterRevisionNumber() {
        software.amazon.jsii.Kernel.call(this, "resetClusterRevisionNumber", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClusterSubnetGroupName() {
        software.amazon.jsii.Kernel.call(this, "resetClusterSubnetGroupName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClusterType() {
        software.amazon.jsii.Kernel.call(this, "resetClusterType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClusterVersion() {
        software.amazon.jsii.Kernel.call(this, "resetClusterVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDatabaseName() {
        software.amazon.jsii.Kernel.call(this, "resetDatabaseName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefaultIamRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultIamRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetElasticIp() {
        software.amazon.jsii.Kernel.call(this, "resetElasticIp", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEncrypted() {
        software.amazon.jsii.Kernel.call(this, "resetEncrypted", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEndpoint() {
        software.amazon.jsii.Kernel.call(this, "resetEndpoint", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnhancedVpcRouting() {
        software.amazon.jsii.Kernel.call(this, "resetEnhancedVpcRouting", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFinalSnapshotIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetFinalSnapshotIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIamRoles() {
        software.amazon.jsii.Kernel.call(this, "resetIamRoles", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogging() {
        software.amazon.jsii.Kernel.call(this, "resetLogging", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaintenanceTrackName() {
        software.amazon.jsii.Kernel.call(this, "resetMaintenanceTrackName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetManageMasterPassword() {
        software.amazon.jsii.Kernel.call(this, "resetManageMasterPassword", software.amazon.jsii.NativeType.VOID);
    }

    public void resetManualSnapshotRetentionPeriod() {
        software.amazon.jsii.Kernel.call(this, "resetManualSnapshotRetentionPeriod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMasterPassword() {
        software.amazon.jsii.Kernel.call(this, "resetMasterPassword", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMasterPasswordSecretKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetMasterPasswordSecretKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMasterPasswordWo() {
        software.amazon.jsii.Kernel.call(this, "resetMasterPasswordWo", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMasterPasswordWoVersion() {
        software.amazon.jsii.Kernel.call(this, "resetMasterPasswordWoVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMasterUsername() {
        software.amazon.jsii.Kernel.call(this, "resetMasterUsername", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMultiAz() {
        software.amazon.jsii.Kernel.call(this, "resetMultiAz", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNumberOfNodes() {
        software.amazon.jsii.Kernel.call(this, "resetNumberOfNodes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOwnerAccount() {
        software.amazon.jsii.Kernel.call(this, "resetOwnerAccount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPort() {
        software.amazon.jsii.Kernel.call(this, "resetPort", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreferredMaintenanceWindow() {
        software.amazon.jsii.Kernel.call(this, "resetPreferredMaintenanceWindow", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPubliclyAccessible() {
        software.amazon.jsii.Kernel.call(this, "resetPubliclyAccessible", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSkipFinalSnapshot() {
        software.amazon.jsii.Kernel.call(this, "resetSkipFinalSnapshot", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnapshotArn() {
        software.amazon.jsii.Kernel.call(this, "resetSnapshotArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnapshotClusterIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetSnapshotClusterIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnapshotCopy() {
        software.amazon.jsii.Kernel.call(this, "resetSnapshotCopy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnapshotIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetSnapshotIdentifier", software.amazon.jsii.NativeType.VOID);
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

    public void resetVpcSecurityGroupIds() {
        software.amazon.jsii.Kernel.call(this, "resetVpcSecurityGroupIds", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getClusterNamespaceArn() {
        return software.amazon.jsii.Kernel.get(this, "clusterNamespaceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.redshift_cluster.RedshiftClusterClusterNodesList getClusterNodes() {
        return software.amazon.jsii.Kernel.get(this, "clusterNodes", software.amazon.jsii.NativeType.forClass(imports.aws.redshift_cluster.RedshiftClusterClusterNodesList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDnsName() {
        return software.amazon.jsii.Kernel.get(this, "dnsName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.redshift_cluster.RedshiftClusterLoggingOutputReference getLogging() {
        return software.amazon.jsii.Kernel.get(this, "logging", software.amazon.jsii.NativeType.forClass(imports.aws.redshift_cluster.RedshiftClusterLoggingOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMasterPasswordSecretArn() {
        return software.amazon.jsii.Kernel.get(this, "masterPasswordSecretArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.redshift_cluster.RedshiftClusterSnapshotCopyOutputReference getSnapshotCopy() {
        return software.amazon.jsii.Kernel.get(this, "snapshotCopy", software.amazon.jsii.NativeType.forClass(imports.aws.redshift_cluster.RedshiftClusterSnapshotCopyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.redshift_cluster.RedshiftClusterTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.redshift_cluster.RedshiftClusterTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAllowVersionUpgradeInput() {
        return software.amazon.jsii.Kernel.get(this, "allowVersionUpgradeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getApplyImmediatelyInput() {
        return software.amazon.jsii.Kernel.get(this, "applyImmediatelyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAquaConfigurationStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "aquaConfigurationStatusInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getAutomatedSnapshotRetentionPeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "automatedSnapshotRetentionPeriodInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZoneInput() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZoneInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAvailabilityZoneRelocationEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZoneRelocationEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClusterIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "clusterIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClusterParameterGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "clusterParameterGroupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClusterPublicKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "clusterPublicKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClusterRevisionNumberInput() {
        return software.amazon.jsii.Kernel.get(this, "clusterRevisionNumberInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClusterSubnetGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "clusterSubnetGroupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClusterTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "clusterTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClusterVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "clusterVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDatabaseNameInput() {
        return software.amazon.jsii.Kernel.get(this, "databaseNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDefaultIamRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultIamRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getElasticIpInput() {
        return software.amazon.jsii.Kernel.get(this, "elasticIpInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEncryptedInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptedInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEndpointInput() {
        return software.amazon.jsii.Kernel.get(this, "endpointInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnhancedVpcRoutingInput() {
        return software.amazon.jsii.Kernel.get(this, "enhancedVpcRoutingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFinalSnapshotIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "finalSnapshotIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIamRolesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "iamRolesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.redshift_cluster.RedshiftClusterLogging getLoggingInput() {
        return software.amazon.jsii.Kernel.get(this, "loggingInput", software.amazon.jsii.NativeType.forClass(imports.aws.redshift_cluster.RedshiftClusterLogging.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMaintenanceTrackNameInput() {
        return software.amazon.jsii.Kernel.get(this, "maintenanceTrackNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getManageMasterPasswordInput() {
        return software.amazon.jsii.Kernel.get(this, "manageMasterPasswordInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getManualSnapshotRetentionPeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "manualSnapshotRetentionPeriodInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMasterPasswordInput() {
        return software.amazon.jsii.Kernel.get(this, "masterPasswordInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMasterPasswordSecretKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "masterPasswordSecretKmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMasterPasswordWoInput() {
        return software.amazon.jsii.Kernel.get(this, "masterPasswordWoInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMasterPasswordWoVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "masterPasswordWoVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMasterUsernameInput() {
        return software.amazon.jsii.Kernel.get(this, "masterUsernameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMultiAzInput() {
        return software.amazon.jsii.Kernel.get(this, "multiAzInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNodeTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "nodeTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getNumberOfNodesInput() {
        return software.amazon.jsii.Kernel.get(this, "numberOfNodesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOwnerAccountInput() {
        return software.amazon.jsii.Kernel.get(this, "ownerAccountInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPortInput() {
        return software.amazon.jsii.Kernel.get(this, "portInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPreferredMaintenanceWindowInput() {
        return software.amazon.jsii.Kernel.get(this, "preferredMaintenanceWindowInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPubliclyAccessibleInput() {
        return software.amazon.jsii.Kernel.get(this, "publiclyAccessibleInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSkipFinalSnapshotInput() {
        return software.amazon.jsii.Kernel.get(this, "skipFinalSnapshotInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSnapshotArnInput() {
        return software.amazon.jsii.Kernel.get(this, "snapshotArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSnapshotClusterIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "snapshotClusterIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.redshift_cluster.RedshiftClusterSnapshotCopy getSnapshotCopyInput() {
        return software.amazon.jsii.Kernel.get(this, "snapshotCopyInput", software.amazon.jsii.NativeType.forClass(imports.aws.redshift_cluster.RedshiftClusterSnapshotCopy.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSnapshotIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "snapshotIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getVpcSecurityGroupIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "vpcSecurityGroupIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAllowVersionUpgrade() {
        return software.amazon.jsii.Kernel.get(this, "allowVersionUpgrade", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAllowVersionUpgrade(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "allowVersionUpgrade", java.util.Objects.requireNonNull(value, "allowVersionUpgrade is required"));
    }

    public void setAllowVersionUpgrade(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "allowVersionUpgrade", java.util.Objects.requireNonNull(value, "allowVersionUpgrade is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getAquaConfigurationStatus() {
        return software.amazon.jsii.Kernel.get(this, "aquaConfigurationStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAquaConfigurationStatus(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "aquaConfigurationStatus", java.util.Objects.requireNonNull(value, "aquaConfigurationStatus is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getAutomatedSnapshotRetentionPeriod() {
        return software.amazon.jsii.Kernel.get(this, "automatedSnapshotRetentionPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setAutomatedSnapshotRetentionPeriod(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "automatedSnapshotRetentionPeriod", java.util.Objects.requireNonNull(value, "automatedSnapshotRetentionPeriod is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAvailabilityZone() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAvailabilityZone(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "availabilityZone", java.util.Objects.requireNonNull(value, "availabilityZone is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAvailabilityZoneRelocationEnabled() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZoneRelocationEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAvailabilityZoneRelocationEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "availabilityZoneRelocationEnabled", java.util.Objects.requireNonNull(value, "availabilityZoneRelocationEnabled is required"));
    }

    public void setAvailabilityZoneRelocationEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "availabilityZoneRelocationEnabled", java.util.Objects.requireNonNull(value, "availabilityZoneRelocationEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClusterIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "clusterIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClusterIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clusterIdentifier", java.util.Objects.requireNonNull(value, "clusterIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClusterParameterGroupName() {
        return software.amazon.jsii.Kernel.get(this, "clusterParameterGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClusterParameterGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clusterParameterGroupName", java.util.Objects.requireNonNull(value, "clusterParameterGroupName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClusterPublicKey() {
        return software.amazon.jsii.Kernel.get(this, "clusterPublicKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClusterPublicKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clusterPublicKey", java.util.Objects.requireNonNull(value, "clusterPublicKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClusterRevisionNumber() {
        return software.amazon.jsii.Kernel.get(this, "clusterRevisionNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClusterRevisionNumber(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clusterRevisionNumber", java.util.Objects.requireNonNull(value, "clusterRevisionNumber is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClusterSubnetGroupName() {
        return software.amazon.jsii.Kernel.get(this, "clusterSubnetGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClusterSubnetGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clusterSubnetGroupName", java.util.Objects.requireNonNull(value, "clusterSubnetGroupName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClusterType() {
        return software.amazon.jsii.Kernel.get(this, "clusterType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClusterType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clusterType", java.util.Objects.requireNonNull(value, "clusterType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClusterVersion() {
        return software.amazon.jsii.Kernel.get(this, "clusterVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClusterVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clusterVersion", java.util.Objects.requireNonNull(value, "clusterVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDatabaseName() {
        return software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDatabaseName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "databaseName", java.util.Objects.requireNonNull(value, "databaseName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultIamRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "defaultIamRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefaultIamRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defaultIamRoleArn", java.util.Objects.requireNonNull(value, "defaultIamRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getElasticIp() {
        return software.amazon.jsii.Kernel.get(this, "elasticIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setElasticIp(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "elasticIp", java.util.Objects.requireNonNull(value, "elasticIp is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEncrypted() {
        return software.amazon.jsii.Kernel.get(this, "encrypted", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEncrypted(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "encrypted", java.util.Objects.requireNonNull(value, "encrypted is required"));
    }

    public void setEncrypted(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "encrypted", java.util.Objects.requireNonNull(value, "encrypted is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "endpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEndpoint(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "endpoint", java.util.Objects.requireNonNull(value, "endpoint is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnhancedVpcRouting() {
        return software.amazon.jsii.Kernel.get(this, "enhancedVpcRouting", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnhancedVpcRouting(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enhancedVpcRouting", java.util.Objects.requireNonNull(value, "enhancedVpcRouting is required"));
    }

    public void setEnhancedVpcRouting(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enhancedVpcRouting", java.util.Objects.requireNonNull(value, "enhancedVpcRouting is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFinalSnapshotIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "finalSnapshotIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFinalSnapshotIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "finalSnapshotIdentifier", java.util.Objects.requireNonNull(value, "finalSnapshotIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getIamRoles() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "iamRoles", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setIamRoles(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "iamRoles", java.util.Objects.requireNonNull(value, "iamRoles is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyId", java.util.Objects.requireNonNull(value, "kmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMaintenanceTrackName() {
        return software.amazon.jsii.Kernel.get(this, "maintenanceTrackName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMaintenanceTrackName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "maintenanceTrackName", java.util.Objects.requireNonNull(value, "maintenanceTrackName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getManageMasterPassword() {
        return software.amazon.jsii.Kernel.get(this, "manageMasterPassword", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setManageMasterPassword(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "manageMasterPassword", java.util.Objects.requireNonNull(value, "manageMasterPassword is required"));
    }

    public void setManageMasterPassword(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "manageMasterPassword", java.util.Objects.requireNonNull(value, "manageMasterPassword is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getManualSnapshotRetentionPeriod() {
        return software.amazon.jsii.Kernel.get(this, "manualSnapshotRetentionPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setManualSnapshotRetentionPeriod(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "manualSnapshotRetentionPeriod", java.util.Objects.requireNonNull(value, "manualSnapshotRetentionPeriod is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMasterPassword() {
        return software.amazon.jsii.Kernel.get(this, "masterPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMasterPassword(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "masterPassword", java.util.Objects.requireNonNull(value, "masterPassword is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMasterPasswordSecretKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "masterPasswordSecretKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMasterPasswordSecretKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "masterPasswordSecretKmsKeyId", java.util.Objects.requireNonNull(value, "masterPasswordSecretKmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMasterPasswordWo() {
        return software.amazon.jsii.Kernel.get(this, "masterPasswordWo", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMasterPasswordWo(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "masterPasswordWo", java.util.Objects.requireNonNull(value, "masterPasswordWo is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMasterPasswordWoVersion() {
        return software.amazon.jsii.Kernel.get(this, "masterPasswordWoVersion", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMasterPasswordWoVersion(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "masterPasswordWoVersion", java.util.Objects.requireNonNull(value, "masterPasswordWoVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMasterUsername() {
        return software.amazon.jsii.Kernel.get(this, "masterUsername", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMasterUsername(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "masterUsername", java.util.Objects.requireNonNull(value, "masterUsername is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getMultiAz() {
        return software.amazon.jsii.Kernel.get(this, "multiAz", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setMultiAz(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "multiAz", java.util.Objects.requireNonNull(value, "multiAz is required"));
    }

    public void setMultiAz(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "multiAz", java.util.Objects.requireNonNull(value, "multiAz is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNodeType() {
        return software.amazon.jsii.Kernel.get(this, "nodeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNodeType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "nodeType", java.util.Objects.requireNonNull(value, "nodeType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getNumberOfNodes() {
        return software.amazon.jsii.Kernel.get(this, "numberOfNodes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setNumberOfNodes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "numberOfNodes", java.util.Objects.requireNonNull(value, "numberOfNodes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOwnerAccount() {
        return software.amazon.jsii.Kernel.get(this, "ownerAccount", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOwnerAccount(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ownerAccount", java.util.Objects.requireNonNull(value, "ownerAccount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPort() {
        return software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPort(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "port", java.util.Objects.requireNonNull(value, "port is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPreferredMaintenanceWindow() {
        return software.amazon.jsii.Kernel.get(this, "preferredMaintenanceWindow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPreferredMaintenanceWindow(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "preferredMaintenanceWindow", java.util.Objects.requireNonNull(value, "preferredMaintenanceWindow is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getSkipFinalSnapshot() {
        return software.amazon.jsii.Kernel.get(this, "skipFinalSnapshot", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSkipFinalSnapshot(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "skipFinalSnapshot", java.util.Objects.requireNonNull(value, "skipFinalSnapshot is required"));
    }

    public void setSkipFinalSnapshot(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "skipFinalSnapshot", java.util.Objects.requireNonNull(value, "skipFinalSnapshot is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSnapshotArn() {
        return software.amazon.jsii.Kernel.get(this, "snapshotArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSnapshotArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "snapshotArn", java.util.Objects.requireNonNull(value, "snapshotArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSnapshotClusterIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "snapshotClusterIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSnapshotClusterIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "snapshotClusterIdentifier", java.util.Objects.requireNonNull(value, "snapshotClusterIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSnapshotIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "snapshotIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSnapshotIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "snapshotIdentifier", java.util.Objects.requireNonNull(value, "snapshotIdentifier is required"));
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

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getVpcSecurityGroupIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "vpcSecurityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setVpcSecurityGroupIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "vpcSecurityGroupIds", java.util.Objects.requireNonNull(value, "vpcSecurityGroupIds is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.redshift_cluster.RedshiftCluster}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.redshift_cluster.RedshiftCluster> {
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
        private final imports.aws.redshift_cluster.RedshiftClusterConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.redshift_cluster.RedshiftClusterConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_identifier RedshiftCluster#cluster_identifier}.
         * <p>
         * @return {@code this}
         * @param clusterIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_identifier RedshiftCluster#cluster_identifier}. This parameter is required.
         */
        public Builder clusterIdentifier(final java.lang.String clusterIdentifier) {
            this.config.clusterIdentifier(clusterIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#node_type RedshiftCluster#node_type}.
         * <p>
         * @return {@code this}
         * @param nodeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#node_type RedshiftCluster#node_type}. This parameter is required.
         */
        public Builder nodeType(final java.lang.String nodeType) {
            this.config.nodeType(nodeType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#allow_version_upgrade RedshiftCluster#allow_version_upgrade}.
         * <p>
         * @return {@code this}
         * @param allowVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#allow_version_upgrade RedshiftCluster#allow_version_upgrade}. This parameter is required.
         */
        public Builder allowVersionUpgrade(final java.lang.Boolean allowVersionUpgrade) {
            this.config.allowVersionUpgrade(allowVersionUpgrade);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#allow_version_upgrade RedshiftCluster#allow_version_upgrade}.
         * <p>
         * @return {@code this}
         * @param allowVersionUpgrade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#allow_version_upgrade RedshiftCluster#allow_version_upgrade}. This parameter is required.
         */
        public Builder allowVersionUpgrade(final com.hashicorp.cdktf.IResolvable allowVersionUpgrade) {
            this.config.allowVersionUpgrade(allowVersionUpgrade);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#apply_immediately RedshiftCluster#apply_immediately}.
         * <p>
         * @return {@code this}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#apply_immediately RedshiftCluster#apply_immediately}. This parameter is required.
         */
        public Builder applyImmediately(final java.lang.Boolean applyImmediately) {
            this.config.applyImmediately(applyImmediately);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#apply_immediately RedshiftCluster#apply_immediately}.
         * <p>
         * @return {@code this}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#apply_immediately RedshiftCluster#apply_immediately}. This parameter is required.
         */
        public Builder applyImmediately(final com.hashicorp.cdktf.IResolvable applyImmediately) {
            this.config.applyImmediately(applyImmediately);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#aqua_configuration_status RedshiftCluster#aqua_configuration_status}.
         * <p>
         * @return {@code this}
         * @param aquaConfigurationStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#aqua_configuration_status RedshiftCluster#aqua_configuration_status}. This parameter is required.
         */
        public Builder aquaConfigurationStatus(final java.lang.String aquaConfigurationStatus) {
            this.config.aquaConfigurationStatus(aquaConfigurationStatus);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#automated_snapshot_retention_period RedshiftCluster#automated_snapshot_retention_period}.
         * <p>
         * @return {@code this}
         * @param automatedSnapshotRetentionPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#automated_snapshot_retention_period RedshiftCluster#automated_snapshot_retention_period}. This parameter is required.
         */
        public Builder automatedSnapshotRetentionPeriod(final java.lang.Number automatedSnapshotRetentionPeriod) {
            this.config.automatedSnapshotRetentionPeriod(automatedSnapshotRetentionPeriod);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#availability_zone RedshiftCluster#availability_zone}.
         * <p>
         * @return {@code this}
         * @param availabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#availability_zone RedshiftCluster#availability_zone}. This parameter is required.
         */
        public Builder availabilityZone(final java.lang.String availabilityZone) {
            this.config.availabilityZone(availabilityZone);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#availability_zone_relocation_enabled RedshiftCluster#availability_zone_relocation_enabled}.
         * <p>
         * @return {@code this}
         * @param availabilityZoneRelocationEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#availability_zone_relocation_enabled RedshiftCluster#availability_zone_relocation_enabled}. This parameter is required.
         */
        public Builder availabilityZoneRelocationEnabled(final java.lang.Boolean availabilityZoneRelocationEnabled) {
            this.config.availabilityZoneRelocationEnabled(availabilityZoneRelocationEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#availability_zone_relocation_enabled RedshiftCluster#availability_zone_relocation_enabled}.
         * <p>
         * @return {@code this}
         * @param availabilityZoneRelocationEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#availability_zone_relocation_enabled RedshiftCluster#availability_zone_relocation_enabled}. This parameter is required.
         */
        public Builder availabilityZoneRelocationEnabled(final com.hashicorp.cdktf.IResolvable availabilityZoneRelocationEnabled) {
            this.config.availabilityZoneRelocationEnabled(availabilityZoneRelocationEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_parameter_group_name RedshiftCluster#cluster_parameter_group_name}.
         * <p>
         * @return {@code this}
         * @param clusterParameterGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_parameter_group_name RedshiftCluster#cluster_parameter_group_name}. This parameter is required.
         */
        public Builder clusterParameterGroupName(final java.lang.String clusterParameterGroupName) {
            this.config.clusterParameterGroupName(clusterParameterGroupName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_public_key RedshiftCluster#cluster_public_key}.
         * <p>
         * @return {@code this}
         * @param clusterPublicKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_public_key RedshiftCluster#cluster_public_key}. This parameter is required.
         */
        public Builder clusterPublicKey(final java.lang.String clusterPublicKey) {
            this.config.clusterPublicKey(clusterPublicKey);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_revision_number RedshiftCluster#cluster_revision_number}.
         * <p>
         * @return {@code this}
         * @param clusterRevisionNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_revision_number RedshiftCluster#cluster_revision_number}. This parameter is required.
         */
        public Builder clusterRevisionNumber(final java.lang.String clusterRevisionNumber) {
            this.config.clusterRevisionNumber(clusterRevisionNumber);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_subnet_group_name RedshiftCluster#cluster_subnet_group_name}.
         * <p>
         * @return {@code this}
         * @param clusterSubnetGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_subnet_group_name RedshiftCluster#cluster_subnet_group_name}. This parameter is required.
         */
        public Builder clusterSubnetGroupName(final java.lang.String clusterSubnetGroupName) {
            this.config.clusterSubnetGroupName(clusterSubnetGroupName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_type RedshiftCluster#cluster_type}.
         * <p>
         * @return {@code this}
         * @param clusterType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_type RedshiftCluster#cluster_type}. This parameter is required.
         */
        public Builder clusterType(final java.lang.String clusterType) {
            this.config.clusterType(clusterType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_version RedshiftCluster#cluster_version}.
         * <p>
         * @return {@code this}
         * @param clusterVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#cluster_version RedshiftCluster#cluster_version}. This parameter is required.
         */
        public Builder clusterVersion(final java.lang.String clusterVersion) {
            this.config.clusterVersion(clusterVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#database_name RedshiftCluster#database_name}.
         * <p>
         * @return {@code this}
         * @param databaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#database_name RedshiftCluster#database_name}. This parameter is required.
         */
        public Builder databaseName(final java.lang.String databaseName) {
            this.config.databaseName(databaseName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#default_iam_role_arn RedshiftCluster#default_iam_role_arn}.
         * <p>
         * @return {@code this}
         * @param defaultIamRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#default_iam_role_arn RedshiftCluster#default_iam_role_arn}. This parameter is required.
         */
        public Builder defaultIamRoleArn(final java.lang.String defaultIamRoleArn) {
            this.config.defaultIamRoleArn(defaultIamRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#elastic_ip RedshiftCluster#elastic_ip}.
         * <p>
         * @return {@code this}
         * @param elasticIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#elastic_ip RedshiftCluster#elastic_ip}. This parameter is required.
         */
        public Builder elasticIp(final java.lang.String elasticIp) {
            this.config.elasticIp(elasticIp);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#encrypted RedshiftCluster#encrypted}.
         * <p>
         * @return {@code this}
         * @param encrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#encrypted RedshiftCluster#encrypted}. This parameter is required.
         */
        public Builder encrypted(final java.lang.Boolean encrypted) {
            this.config.encrypted(encrypted);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#encrypted RedshiftCluster#encrypted}.
         * <p>
         * @return {@code this}
         * @param encrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#encrypted RedshiftCluster#encrypted}. This parameter is required.
         */
        public Builder encrypted(final com.hashicorp.cdktf.IResolvable encrypted) {
            this.config.encrypted(encrypted);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#endpoint RedshiftCluster#endpoint}.
         * <p>
         * @return {@code this}
         * @param endpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#endpoint RedshiftCluster#endpoint}. This parameter is required.
         */
        public Builder endpoint(final java.lang.String endpoint) {
            this.config.endpoint(endpoint);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#enhanced_vpc_routing RedshiftCluster#enhanced_vpc_routing}.
         * <p>
         * @return {@code this}
         * @param enhancedVpcRouting Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#enhanced_vpc_routing RedshiftCluster#enhanced_vpc_routing}. This parameter is required.
         */
        public Builder enhancedVpcRouting(final java.lang.Boolean enhancedVpcRouting) {
            this.config.enhancedVpcRouting(enhancedVpcRouting);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#enhanced_vpc_routing RedshiftCluster#enhanced_vpc_routing}.
         * <p>
         * @return {@code this}
         * @param enhancedVpcRouting Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#enhanced_vpc_routing RedshiftCluster#enhanced_vpc_routing}. This parameter is required.
         */
        public Builder enhancedVpcRouting(final com.hashicorp.cdktf.IResolvable enhancedVpcRouting) {
            this.config.enhancedVpcRouting(enhancedVpcRouting);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#final_snapshot_identifier RedshiftCluster#final_snapshot_identifier}.
         * <p>
         * @return {@code this}
         * @param finalSnapshotIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#final_snapshot_identifier RedshiftCluster#final_snapshot_identifier}. This parameter is required.
         */
        public Builder finalSnapshotIdentifier(final java.lang.String finalSnapshotIdentifier) {
            this.config.finalSnapshotIdentifier(finalSnapshotIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#iam_roles RedshiftCluster#iam_roles}.
         * <p>
         * @return {@code this}
         * @param iamRoles Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#iam_roles RedshiftCluster#iam_roles}. This parameter is required.
         */
        public Builder iamRoles(final java.util.List<java.lang.String> iamRoles) {
            this.config.iamRoles(iamRoles);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#id RedshiftCluster#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#id RedshiftCluster#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#kms_key_id RedshiftCluster#kms_key_id}.
         * <p>
         * @return {@code this}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#kms_key_id RedshiftCluster#kms_key_id}. This parameter is required.
         */
        public Builder kmsKeyId(final java.lang.String kmsKeyId) {
            this.config.kmsKeyId(kmsKeyId);
            return this;
        }

        /**
         * logging block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#logging RedshiftCluster#logging}
         * <p>
         * @return {@code this}
         * @param logging logging block. This parameter is required.
         */
        public Builder logging(final imports.aws.redshift_cluster.RedshiftClusterLogging logging) {
            this.config.logging(logging);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#maintenance_track_name RedshiftCluster#maintenance_track_name}.
         * <p>
         * @return {@code this}
         * @param maintenanceTrackName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#maintenance_track_name RedshiftCluster#maintenance_track_name}. This parameter is required.
         */
        public Builder maintenanceTrackName(final java.lang.String maintenanceTrackName) {
            this.config.maintenanceTrackName(maintenanceTrackName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#manage_master_password RedshiftCluster#manage_master_password}.
         * <p>
         * @return {@code this}
         * @param manageMasterPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#manage_master_password RedshiftCluster#manage_master_password}. This parameter is required.
         */
        public Builder manageMasterPassword(final java.lang.Boolean manageMasterPassword) {
            this.config.manageMasterPassword(manageMasterPassword);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#manage_master_password RedshiftCluster#manage_master_password}.
         * <p>
         * @return {@code this}
         * @param manageMasterPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#manage_master_password RedshiftCluster#manage_master_password}. This parameter is required.
         */
        public Builder manageMasterPassword(final com.hashicorp.cdktf.IResolvable manageMasterPassword) {
            this.config.manageMasterPassword(manageMasterPassword);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#manual_snapshot_retention_period RedshiftCluster#manual_snapshot_retention_period}.
         * <p>
         * @return {@code this}
         * @param manualSnapshotRetentionPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#manual_snapshot_retention_period RedshiftCluster#manual_snapshot_retention_period}. This parameter is required.
         */
        public Builder manualSnapshotRetentionPeriod(final java.lang.Number manualSnapshotRetentionPeriod) {
            this.config.manualSnapshotRetentionPeriod(manualSnapshotRetentionPeriod);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#master_password RedshiftCluster#master_password}.
         * <p>
         * @return {@code this}
         * @param masterPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#master_password RedshiftCluster#master_password}. This parameter is required.
         */
        public Builder masterPassword(final java.lang.String masterPassword) {
            this.config.masterPassword(masterPassword);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#master_password_secret_kms_key_id RedshiftCluster#master_password_secret_kms_key_id}.
         * <p>
         * @return {@code this}
         * @param masterPasswordSecretKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#master_password_secret_kms_key_id RedshiftCluster#master_password_secret_kms_key_id}. This parameter is required.
         */
        public Builder masterPasswordSecretKmsKeyId(final java.lang.String masterPasswordSecretKmsKeyId) {
            this.config.masterPasswordSecretKmsKeyId(masterPasswordSecretKmsKeyId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#master_password_wo RedshiftCluster#master_password_wo}.
         * <p>
         * @return {@code this}
         * @param masterPasswordWo Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#master_password_wo RedshiftCluster#master_password_wo}. This parameter is required.
         */
        public Builder masterPasswordWo(final java.lang.String masterPasswordWo) {
            this.config.masterPasswordWo(masterPasswordWo);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#master_password_wo_version RedshiftCluster#master_password_wo_version}.
         * <p>
         * @return {@code this}
         * @param masterPasswordWoVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#master_password_wo_version RedshiftCluster#master_password_wo_version}. This parameter is required.
         */
        public Builder masterPasswordWoVersion(final java.lang.Number masterPasswordWoVersion) {
            this.config.masterPasswordWoVersion(masterPasswordWoVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#master_username RedshiftCluster#master_username}.
         * <p>
         * @return {@code this}
         * @param masterUsername Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#master_username RedshiftCluster#master_username}. This parameter is required.
         */
        public Builder masterUsername(final java.lang.String masterUsername) {
            this.config.masterUsername(masterUsername);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#multi_az RedshiftCluster#multi_az}.
         * <p>
         * @return {@code this}
         * @param multiAz Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#multi_az RedshiftCluster#multi_az}. This parameter is required.
         */
        public Builder multiAz(final java.lang.Boolean multiAz) {
            this.config.multiAz(multiAz);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#multi_az RedshiftCluster#multi_az}.
         * <p>
         * @return {@code this}
         * @param multiAz Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#multi_az RedshiftCluster#multi_az}. This parameter is required.
         */
        public Builder multiAz(final com.hashicorp.cdktf.IResolvable multiAz) {
            this.config.multiAz(multiAz);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#number_of_nodes RedshiftCluster#number_of_nodes}.
         * <p>
         * @return {@code this}
         * @param numberOfNodes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#number_of_nodes RedshiftCluster#number_of_nodes}. This parameter is required.
         */
        public Builder numberOfNodes(final java.lang.Number numberOfNodes) {
            this.config.numberOfNodes(numberOfNodes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#owner_account RedshiftCluster#owner_account}.
         * <p>
         * @return {@code this}
         * @param ownerAccount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#owner_account RedshiftCluster#owner_account}. This parameter is required.
         */
        public Builder ownerAccount(final java.lang.String ownerAccount) {
            this.config.ownerAccount(ownerAccount);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#port RedshiftCluster#port}.
         * <p>
         * @return {@code this}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#port RedshiftCluster#port}. This parameter is required.
         */
        public Builder port(final java.lang.Number port) {
            this.config.port(port);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#preferred_maintenance_window RedshiftCluster#preferred_maintenance_window}.
         * <p>
         * @return {@code this}
         * @param preferredMaintenanceWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#preferred_maintenance_window RedshiftCluster#preferred_maintenance_window}. This parameter is required.
         */
        public Builder preferredMaintenanceWindow(final java.lang.String preferredMaintenanceWindow) {
            this.config.preferredMaintenanceWindow(preferredMaintenanceWindow);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#publicly_accessible RedshiftCluster#publicly_accessible}.
         * <p>
         * @return {@code this}
         * @param publiclyAccessible Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#publicly_accessible RedshiftCluster#publicly_accessible}. This parameter is required.
         */
        public Builder publiclyAccessible(final java.lang.Boolean publiclyAccessible) {
            this.config.publiclyAccessible(publiclyAccessible);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#publicly_accessible RedshiftCluster#publicly_accessible}.
         * <p>
         * @return {@code this}
         * @param publiclyAccessible Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#publicly_accessible RedshiftCluster#publicly_accessible}. This parameter is required.
         */
        public Builder publiclyAccessible(final com.hashicorp.cdktf.IResolvable publiclyAccessible) {
            this.config.publiclyAccessible(publiclyAccessible);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#skip_final_snapshot RedshiftCluster#skip_final_snapshot}.
         * <p>
         * @return {@code this}
         * @param skipFinalSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#skip_final_snapshot RedshiftCluster#skip_final_snapshot}. This parameter is required.
         */
        public Builder skipFinalSnapshot(final java.lang.Boolean skipFinalSnapshot) {
            this.config.skipFinalSnapshot(skipFinalSnapshot);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#skip_final_snapshot RedshiftCluster#skip_final_snapshot}.
         * <p>
         * @return {@code this}
         * @param skipFinalSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#skip_final_snapshot RedshiftCluster#skip_final_snapshot}. This parameter is required.
         */
        public Builder skipFinalSnapshot(final com.hashicorp.cdktf.IResolvable skipFinalSnapshot) {
            this.config.skipFinalSnapshot(skipFinalSnapshot);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#snapshot_arn RedshiftCluster#snapshot_arn}.
         * <p>
         * @return {@code this}
         * @param snapshotArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#snapshot_arn RedshiftCluster#snapshot_arn}. This parameter is required.
         */
        public Builder snapshotArn(final java.lang.String snapshotArn) {
            this.config.snapshotArn(snapshotArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#snapshot_cluster_identifier RedshiftCluster#snapshot_cluster_identifier}.
         * <p>
         * @return {@code this}
         * @param snapshotClusterIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#snapshot_cluster_identifier RedshiftCluster#snapshot_cluster_identifier}. This parameter is required.
         */
        public Builder snapshotClusterIdentifier(final java.lang.String snapshotClusterIdentifier) {
            this.config.snapshotClusterIdentifier(snapshotClusterIdentifier);
            return this;
        }

        /**
         * snapshot_copy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#snapshot_copy RedshiftCluster#snapshot_copy}
         * <p>
         * @return {@code this}
         * @param snapshotCopy snapshot_copy block. This parameter is required.
         */
        public Builder snapshotCopy(final imports.aws.redshift_cluster.RedshiftClusterSnapshotCopy snapshotCopy) {
            this.config.snapshotCopy(snapshotCopy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#snapshot_identifier RedshiftCluster#snapshot_identifier}.
         * <p>
         * @return {@code this}
         * @param snapshotIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#snapshot_identifier RedshiftCluster#snapshot_identifier}. This parameter is required.
         */
        public Builder snapshotIdentifier(final java.lang.String snapshotIdentifier) {
            this.config.snapshotIdentifier(snapshotIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#tags RedshiftCluster#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#tags RedshiftCluster#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#tags_all RedshiftCluster#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#tags_all RedshiftCluster#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#timeouts RedshiftCluster#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.redshift_cluster.RedshiftClusterTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#vpc_security_group_ids RedshiftCluster#vpc_security_group_ids}.
         * <p>
         * @return {@code this}
         * @param vpcSecurityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_cluster#vpc_security_group_ids RedshiftCluster#vpc_security_group_ids}. This parameter is required.
         */
        public Builder vpcSecurityGroupIds(final java.util.List<java.lang.String> vpcSecurityGroupIds) {
            this.config.vpcSecurityGroupIds(vpcSecurityGroupIds);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.redshift_cluster.RedshiftCluster}.
         */
        @Override
        public imports.aws.redshift_cluster.RedshiftCluster build() {
            return new imports.aws.redshift_cluster.RedshiftCluster(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
