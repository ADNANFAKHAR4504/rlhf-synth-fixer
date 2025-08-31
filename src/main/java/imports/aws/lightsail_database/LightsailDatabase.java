package imports.aws.lightsail_database;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database aws_lightsail_database}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.820Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lightsailDatabase.LightsailDatabase")
public class LightsailDatabase extends com.hashicorp.cdktf.TerraformResource {

    protected LightsailDatabase(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LightsailDatabase(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.lightsail_database.LightsailDatabase.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database aws_lightsail_database} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public LightsailDatabase(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.lightsail_database.LightsailDatabaseConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a LightsailDatabase resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LightsailDatabase to import. This parameter is required.
     * @param importFromId The id of the existing LightsailDatabase that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the LightsailDatabase to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lightsail_database.LightsailDatabase.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a LightsailDatabase resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LightsailDatabase to import. This parameter is required.
     * @param importFromId The id of the existing LightsailDatabase that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lightsail_database.LightsailDatabase.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetApplyImmediately() {
        software.amazon.jsii.Kernel.call(this, "resetApplyImmediately", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAvailabilityZone() {
        software.amazon.jsii.Kernel.call(this, "resetAvailabilityZone", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBackupRetentionEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetBackupRetentionEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFinalSnapshotName() {
        software.amazon.jsii.Kernel.call(this, "resetFinalSnapshotName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreferredBackupWindow() {
        software.amazon.jsii.Kernel.call(this, "resetPreferredBackupWindow", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCaCertificateIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "caCertificateIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getCpuCount() {
        return software.amazon.jsii.Kernel.get(this, "cpuCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreatedAt() {
        return software.amazon.jsii.Kernel.get(this, "createdAt", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDiskSize() {
        return software.amazon.jsii.Kernel.get(this, "diskSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngine() {
        return software.amazon.jsii.Kernel.get(this, "engine", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngineVersion() {
        return software.amazon.jsii.Kernel.get(this, "engineVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMasterEndpointAddress() {
        return software.amazon.jsii.Kernel.get(this, "masterEndpointAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMasterEndpointPort() {
        return software.amazon.jsii.Kernel.get(this, "masterEndpointPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRamSize() {
        return software.amazon.jsii.Kernel.get(this, "ramSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecondaryAvailabilityZone() {
        return software.amazon.jsii.Kernel.get(this, "secondaryAvailabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSupportCode() {
        return software.amazon.jsii.Kernel.get(this, "supportCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getApplyImmediatelyInput() {
        return software.amazon.jsii.Kernel.get(this, "applyImmediatelyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZoneInput() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZoneInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBackupRetentionEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "backupRetentionEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBlueprintIdInput() {
        return software.amazon.jsii.Kernel.get(this, "blueprintIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBundleIdInput() {
        return software.amazon.jsii.Kernel.get(this, "bundleIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFinalSnapshotNameInput() {
        return software.amazon.jsii.Kernel.get(this, "finalSnapshotNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMasterDatabaseNameInput() {
        return software.amazon.jsii.Kernel.get(this, "masterDatabaseNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMasterPasswordInput() {
        return software.amazon.jsii.Kernel.get(this, "masterPasswordInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMasterUsernameInput() {
        return software.amazon.jsii.Kernel.get(this, "masterUsernameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPreferredBackupWindowInput() {
        return software.amazon.jsii.Kernel.get(this, "preferredBackupWindowInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPreferredMaintenanceWindowInput() {
        return software.amazon.jsii.Kernel.get(this, "preferredMaintenanceWindowInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPubliclyAccessibleInput() {
        return software.amazon.jsii.Kernel.get(this, "publiclyAccessibleInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRelationalDatabaseNameInput() {
        return software.amazon.jsii.Kernel.get(this, "relationalDatabaseNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSkipFinalSnapshotInput() {
        return software.amazon.jsii.Kernel.get(this, "skipFinalSnapshotInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getAvailabilityZone() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAvailabilityZone(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "availabilityZone", java.util.Objects.requireNonNull(value, "availabilityZone is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getBackupRetentionEnabled() {
        return software.amazon.jsii.Kernel.get(this, "backupRetentionEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setBackupRetentionEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "backupRetentionEnabled", java.util.Objects.requireNonNull(value, "backupRetentionEnabled is required"));
    }

    public void setBackupRetentionEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "backupRetentionEnabled", java.util.Objects.requireNonNull(value, "backupRetentionEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBlueprintId() {
        return software.amazon.jsii.Kernel.get(this, "blueprintId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBlueprintId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "blueprintId", java.util.Objects.requireNonNull(value, "blueprintId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBundleId() {
        return software.amazon.jsii.Kernel.get(this, "bundleId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBundleId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bundleId", java.util.Objects.requireNonNull(value, "bundleId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFinalSnapshotName() {
        return software.amazon.jsii.Kernel.get(this, "finalSnapshotName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFinalSnapshotName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "finalSnapshotName", java.util.Objects.requireNonNull(value, "finalSnapshotName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMasterDatabaseName() {
        return software.amazon.jsii.Kernel.get(this, "masterDatabaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMasterDatabaseName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "masterDatabaseName", java.util.Objects.requireNonNull(value, "masterDatabaseName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMasterPassword() {
        return software.amazon.jsii.Kernel.get(this, "masterPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMasterPassword(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "masterPassword", java.util.Objects.requireNonNull(value, "masterPassword is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMasterUsername() {
        return software.amazon.jsii.Kernel.get(this, "masterUsername", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMasterUsername(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "masterUsername", java.util.Objects.requireNonNull(value, "masterUsername is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPreferredBackupWindow() {
        return software.amazon.jsii.Kernel.get(this, "preferredBackupWindow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPreferredBackupWindow(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "preferredBackupWindow", java.util.Objects.requireNonNull(value, "preferredBackupWindow is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getRelationalDatabaseName() {
        return software.amazon.jsii.Kernel.get(this, "relationalDatabaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRelationalDatabaseName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "relationalDatabaseName", java.util.Objects.requireNonNull(value, "relationalDatabaseName is required"));
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
     * A fluent builder for {@link imports.aws.lightsail_database.LightsailDatabase}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.lightsail_database.LightsailDatabase> {
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
        private final imports.aws.lightsail_database.LightsailDatabaseConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.lightsail_database.LightsailDatabaseConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#blueprint_id LightsailDatabase#blueprint_id}.
         * <p>
         * @return {@code this}
         * @param blueprintId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#blueprint_id LightsailDatabase#blueprint_id}. This parameter is required.
         */
        public Builder blueprintId(final java.lang.String blueprintId) {
            this.config.blueprintId(blueprintId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#bundle_id LightsailDatabase#bundle_id}.
         * <p>
         * @return {@code this}
         * @param bundleId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#bundle_id LightsailDatabase#bundle_id}. This parameter is required.
         */
        public Builder bundleId(final java.lang.String bundleId) {
            this.config.bundleId(bundleId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#master_database_name LightsailDatabase#master_database_name}.
         * <p>
         * @return {@code this}
         * @param masterDatabaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#master_database_name LightsailDatabase#master_database_name}. This parameter is required.
         */
        public Builder masterDatabaseName(final java.lang.String masterDatabaseName) {
            this.config.masterDatabaseName(masterDatabaseName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#master_password LightsailDatabase#master_password}.
         * <p>
         * @return {@code this}
         * @param masterPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#master_password LightsailDatabase#master_password}. This parameter is required.
         */
        public Builder masterPassword(final java.lang.String masterPassword) {
            this.config.masterPassword(masterPassword);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#master_username LightsailDatabase#master_username}.
         * <p>
         * @return {@code this}
         * @param masterUsername Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#master_username LightsailDatabase#master_username}. This parameter is required.
         */
        public Builder masterUsername(final java.lang.String masterUsername) {
            this.config.masterUsername(masterUsername);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#relational_database_name LightsailDatabase#relational_database_name}.
         * <p>
         * @return {@code this}
         * @param relationalDatabaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#relational_database_name LightsailDatabase#relational_database_name}. This parameter is required.
         */
        public Builder relationalDatabaseName(final java.lang.String relationalDatabaseName) {
            this.config.relationalDatabaseName(relationalDatabaseName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#apply_immediately LightsailDatabase#apply_immediately}.
         * <p>
         * @return {@code this}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#apply_immediately LightsailDatabase#apply_immediately}. This parameter is required.
         */
        public Builder applyImmediately(final java.lang.Boolean applyImmediately) {
            this.config.applyImmediately(applyImmediately);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#apply_immediately LightsailDatabase#apply_immediately}.
         * <p>
         * @return {@code this}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#apply_immediately LightsailDatabase#apply_immediately}. This parameter is required.
         */
        public Builder applyImmediately(final com.hashicorp.cdktf.IResolvable applyImmediately) {
            this.config.applyImmediately(applyImmediately);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#availability_zone LightsailDatabase#availability_zone}.
         * <p>
         * @return {@code this}
         * @param availabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#availability_zone LightsailDatabase#availability_zone}. This parameter is required.
         */
        public Builder availabilityZone(final java.lang.String availabilityZone) {
            this.config.availabilityZone(availabilityZone);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#backup_retention_enabled LightsailDatabase#backup_retention_enabled}.
         * <p>
         * @return {@code this}
         * @param backupRetentionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#backup_retention_enabled LightsailDatabase#backup_retention_enabled}. This parameter is required.
         */
        public Builder backupRetentionEnabled(final java.lang.Boolean backupRetentionEnabled) {
            this.config.backupRetentionEnabled(backupRetentionEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#backup_retention_enabled LightsailDatabase#backup_retention_enabled}.
         * <p>
         * @return {@code this}
         * @param backupRetentionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#backup_retention_enabled LightsailDatabase#backup_retention_enabled}. This parameter is required.
         */
        public Builder backupRetentionEnabled(final com.hashicorp.cdktf.IResolvable backupRetentionEnabled) {
            this.config.backupRetentionEnabled(backupRetentionEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#final_snapshot_name LightsailDatabase#final_snapshot_name}.
         * <p>
         * @return {@code this}
         * @param finalSnapshotName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#final_snapshot_name LightsailDatabase#final_snapshot_name}. This parameter is required.
         */
        public Builder finalSnapshotName(final java.lang.String finalSnapshotName) {
            this.config.finalSnapshotName(finalSnapshotName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#id LightsailDatabase#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#id LightsailDatabase#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#preferred_backup_window LightsailDatabase#preferred_backup_window}.
         * <p>
         * @return {@code this}
         * @param preferredBackupWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#preferred_backup_window LightsailDatabase#preferred_backup_window}. This parameter is required.
         */
        public Builder preferredBackupWindow(final java.lang.String preferredBackupWindow) {
            this.config.preferredBackupWindow(preferredBackupWindow);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#preferred_maintenance_window LightsailDatabase#preferred_maintenance_window}.
         * <p>
         * @return {@code this}
         * @param preferredMaintenanceWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#preferred_maintenance_window LightsailDatabase#preferred_maintenance_window}. This parameter is required.
         */
        public Builder preferredMaintenanceWindow(final java.lang.String preferredMaintenanceWindow) {
            this.config.preferredMaintenanceWindow(preferredMaintenanceWindow);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#publicly_accessible LightsailDatabase#publicly_accessible}.
         * <p>
         * @return {@code this}
         * @param publiclyAccessible Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#publicly_accessible LightsailDatabase#publicly_accessible}. This parameter is required.
         */
        public Builder publiclyAccessible(final java.lang.Boolean publiclyAccessible) {
            this.config.publiclyAccessible(publiclyAccessible);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#publicly_accessible LightsailDatabase#publicly_accessible}.
         * <p>
         * @return {@code this}
         * @param publiclyAccessible Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#publicly_accessible LightsailDatabase#publicly_accessible}. This parameter is required.
         */
        public Builder publiclyAccessible(final com.hashicorp.cdktf.IResolvable publiclyAccessible) {
            this.config.publiclyAccessible(publiclyAccessible);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#skip_final_snapshot LightsailDatabase#skip_final_snapshot}.
         * <p>
         * @return {@code this}
         * @param skipFinalSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#skip_final_snapshot LightsailDatabase#skip_final_snapshot}. This parameter is required.
         */
        public Builder skipFinalSnapshot(final java.lang.Boolean skipFinalSnapshot) {
            this.config.skipFinalSnapshot(skipFinalSnapshot);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#skip_final_snapshot LightsailDatabase#skip_final_snapshot}.
         * <p>
         * @return {@code this}
         * @param skipFinalSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#skip_final_snapshot LightsailDatabase#skip_final_snapshot}. This parameter is required.
         */
        public Builder skipFinalSnapshot(final com.hashicorp.cdktf.IResolvable skipFinalSnapshot) {
            this.config.skipFinalSnapshot(skipFinalSnapshot);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#tags LightsailDatabase#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#tags LightsailDatabase#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#tags_all LightsailDatabase#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#tags_all LightsailDatabase#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.lightsail_database.LightsailDatabase}.
         */
        @Override
        public imports.aws.lightsail_database.LightsailDatabase build() {
            return new imports.aws.lightsail_database.LightsailDatabase(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
