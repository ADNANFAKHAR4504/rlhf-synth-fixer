package imports.aws.lightsail_database;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.821Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lightsailDatabase.LightsailDatabaseConfig")
@software.amazon.jsii.Jsii.Proxy(LightsailDatabaseConfig.Jsii$Proxy.class)
public interface LightsailDatabaseConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#blueprint_id LightsailDatabase#blueprint_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBlueprintId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#bundle_id LightsailDatabase#bundle_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBundleId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#master_database_name LightsailDatabase#master_database_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMasterDatabaseName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#master_password LightsailDatabase#master_password}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMasterPassword();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#master_username LightsailDatabase#master_username}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMasterUsername();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#relational_database_name LightsailDatabase#relational_database_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRelationalDatabaseName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#apply_immediately LightsailDatabase#apply_immediately}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getApplyImmediately() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#availability_zone LightsailDatabase#availability_zone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZone() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#backup_retention_enabled LightsailDatabase#backup_retention_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBackupRetentionEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#final_snapshot_name LightsailDatabase#final_snapshot_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFinalSnapshotName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#id LightsailDatabase#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#preferred_backup_window LightsailDatabase#preferred_backup_window}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPreferredBackupWindow() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#preferred_maintenance_window LightsailDatabase#preferred_maintenance_window}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPreferredMaintenanceWindow() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#publicly_accessible LightsailDatabase#publicly_accessible}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPubliclyAccessible() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#skip_final_snapshot LightsailDatabase#skip_final_snapshot}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSkipFinalSnapshot() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#tags LightsailDatabase#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#tags_all LightsailDatabase#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LightsailDatabaseConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LightsailDatabaseConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LightsailDatabaseConfig> {
        java.lang.String blueprintId;
        java.lang.String bundleId;
        java.lang.String masterDatabaseName;
        java.lang.String masterPassword;
        java.lang.String masterUsername;
        java.lang.String relationalDatabaseName;
        java.lang.Object applyImmediately;
        java.lang.String availabilityZone;
        java.lang.Object backupRetentionEnabled;
        java.lang.String finalSnapshotName;
        java.lang.String id;
        java.lang.String preferredBackupWindow;
        java.lang.String preferredMaintenanceWindow;
        java.lang.Object publiclyAccessible;
        java.lang.Object skipFinalSnapshot;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getBlueprintId}
         * @param blueprintId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#blueprint_id LightsailDatabase#blueprint_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder blueprintId(java.lang.String blueprintId) {
            this.blueprintId = blueprintId;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getBundleId}
         * @param bundleId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#bundle_id LightsailDatabase#bundle_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder bundleId(java.lang.String bundleId) {
            this.bundleId = bundleId;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getMasterDatabaseName}
         * @param masterDatabaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#master_database_name LightsailDatabase#master_database_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder masterDatabaseName(java.lang.String masterDatabaseName) {
            this.masterDatabaseName = masterDatabaseName;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getMasterPassword}
         * @param masterPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#master_password LightsailDatabase#master_password}. This parameter is required.
         * @return {@code this}
         */
        public Builder masterPassword(java.lang.String masterPassword) {
            this.masterPassword = masterPassword;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getMasterUsername}
         * @param masterUsername Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#master_username LightsailDatabase#master_username}. This parameter is required.
         * @return {@code this}
         */
        public Builder masterUsername(java.lang.String masterUsername) {
            this.masterUsername = masterUsername;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getRelationalDatabaseName}
         * @param relationalDatabaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#relational_database_name LightsailDatabase#relational_database_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder relationalDatabaseName(java.lang.String relationalDatabaseName) {
            this.relationalDatabaseName = relationalDatabaseName;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getApplyImmediately}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#apply_immediately LightsailDatabase#apply_immediately}.
         * @return {@code this}
         */
        public Builder applyImmediately(java.lang.Boolean applyImmediately) {
            this.applyImmediately = applyImmediately;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getApplyImmediately}
         * @param applyImmediately Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#apply_immediately LightsailDatabase#apply_immediately}.
         * @return {@code this}
         */
        public Builder applyImmediately(com.hashicorp.cdktf.IResolvable applyImmediately) {
            this.applyImmediately = applyImmediately;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getAvailabilityZone}
         * @param availabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#availability_zone LightsailDatabase#availability_zone}.
         * @return {@code this}
         */
        public Builder availabilityZone(java.lang.String availabilityZone) {
            this.availabilityZone = availabilityZone;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getBackupRetentionEnabled}
         * @param backupRetentionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#backup_retention_enabled LightsailDatabase#backup_retention_enabled}.
         * @return {@code this}
         */
        public Builder backupRetentionEnabled(java.lang.Boolean backupRetentionEnabled) {
            this.backupRetentionEnabled = backupRetentionEnabled;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getBackupRetentionEnabled}
         * @param backupRetentionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#backup_retention_enabled LightsailDatabase#backup_retention_enabled}.
         * @return {@code this}
         */
        public Builder backupRetentionEnabled(com.hashicorp.cdktf.IResolvable backupRetentionEnabled) {
            this.backupRetentionEnabled = backupRetentionEnabled;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getFinalSnapshotName}
         * @param finalSnapshotName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#final_snapshot_name LightsailDatabase#final_snapshot_name}.
         * @return {@code this}
         */
        public Builder finalSnapshotName(java.lang.String finalSnapshotName) {
            this.finalSnapshotName = finalSnapshotName;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#id LightsailDatabase#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getPreferredBackupWindow}
         * @param preferredBackupWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#preferred_backup_window LightsailDatabase#preferred_backup_window}.
         * @return {@code this}
         */
        public Builder preferredBackupWindow(java.lang.String preferredBackupWindow) {
            this.preferredBackupWindow = preferredBackupWindow;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getPreferredMaintenanceWindow}
         * @param preferredMaintenanceWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#preferred_maintenance_window LightsailDatabase#preferred_maintenance_window}.
         * @return {@code this}
         */
        public Builder preferredMaintenanceWindow(java.lang.String preferredMaintenanceWindow) {
            this.preferredMaintenanceWindow = preferredMaintenanceWindow;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getPubliclyAccessible}
         * @param publiclyAccessible Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#publicly_accessible LightsailDatabase#publicly_accessible}.
         * @return {@code this}
         */
        public Builder publiclyAccessible(java.lang.Boolean publiclyAccessible) {
            this.publiclyAccessible = publiclyAccessible;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getPubliclyAccessible}
         * @param publiclyAccessible Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#publicly_accessible LightsailDatabase#publicly_accessible}.
         * @return {@code this}
         */
        public Builder publiclyAccessible(com.hashicorp.cdktf.IResolvable publiclyAccessible) {
            this.publiclyAccessible = publiclyAccessible;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getSkipFinalSnapshot}
         * @param skipFinalSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#skip_final_snapshot LightsailDatabase#skip_final_snapshot}.
         * @return {@code this}
         */
        public Builder skipFinalSnapshot(java.lang.Boolean skipFinalSnapshot) {
            this.skipFinalSnapshot = skipFinalSnapshot;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getSkipFinalSnapshot}
         * @param skipFinalSnapshot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#skip_final_snapshot LightsailDatabase#skip_final_snapshot}.
         * @return {@code this}
         */
        public Builder skipFinalSnapshot(com.hashicorp.cdktf.IResolvable skipFinalSnapshot) {
            this.skipFinalSnapshot = skipFinalSnapshot;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#tags LightsailDatabase#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_database#tags_all LightsailDatabase#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDatabaseConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LightsailDatabaseConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LightsailDatabaseConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LightsailDatabaseConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LightsailDatabaseConfig {
        private final java.lang.String blueprintId;
        private final java.lang.String bundleId;
        private final java.lang.String masterDatabaseName;
        private final java.lang.String masterPassword;
        private final java.lang.String masterUsername;
        private final java.lang.String relationalDatabaseName;
        private final java.lang.Object applyImmediately;
        private final java.lang.String availabilityZone;
        private final java.lang.Object backupRetentionEnabled;
        private final java.lang.String finalSnapshotName;
        private final java.lang.String id;
        private final java.lang.String preferredBackupWindow;
        private final java.lang.String preferredMaintenanceWindow;
        private final java.lang.Object publiclyAccessible;
        private final java.lang.Object skipFinalSnapshot;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.blueprintId = software.amazon.jsii.Kernel.get(this, "blueprintId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bundleId = software.amazon.jsii.Kernel.get(this, "bundleId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.masterDatabaseName = software.amazon.jsii.Kernel.get(this, "masterDatabaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.masterPassword = software.amazon.jsii.Kernel.get(this, "masterPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.masterUsername = software.amazon.jsii.Kernel.get(this, "masterUsername", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.relationalDatabaseName = software.amazon.jsii.Kernel.get(this, "relationalDatabaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.applyImmediately = software.amazon.jsii.Kernel.get(this, "applyImmediately", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.availabilityZone = software.amazon.jsii.Kernel.get(this, "availabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.backupRetentionEnabled = software.amazon.jsii.Kernel.get(this, "backupRetentionEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.finalSnapshotName = software.amazon.jsii.Kernel.get(this, "finalSnapshotName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.preferredBackupWindow = software.amazon.jsii.Kernel.get(this, "preferredBackupWindow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.preferredMaintenanceWindow = software.amazon.jsii.Kernel.get(this, "preferredMaintenanceWindow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.publiclyAccessible = software.amazon.jsii.Kernel.get(this, "publiclyAccessible", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.skipFinalSnapshot = software.amazon.jsii.Kernel.get(this, "skipFinalSnapshot", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.blueprintId = java.util.Objects.requireNonNull(builder.blueprintId, "blueprintId is required");
            this.bundleId = java.util.Objects.requireNonNull(builder.bundleId, "bundleId is required");
            this.masterDatabaseName = java.util.Objects.requireNonNull(builder.masterDatabaseName, "masterDatabaseName is required");
            this.masterPassword = java.util.Objects.requireNonNull(builder.masterPassword, "masterPassword is required");
            this.masterUsername = java.util.Objects.requireNonNull(builder.masterUsername, "masterUsername is required");
            this.relationalDatabaseName = java.util.Objects.requireNonNull(builder.relationalDatabaseName, "relationalDatabaseName is required");
            this.applyImmediately = builder.applyImmediately;
            this.availabilityZone = builder.availabilityZone;
            this.backupRetentionEnabled = builder.backupRetentionEnabled;
            this.finalSnapshotName = builder.finalSnapshotName;
            this.id = builder.id;
            this.preferredBackupWindow = builder.preferredBackupWindow;
            this.preferredMaintenanceWindow = builder.preferredMaintenanceWindow;
            this.publiclyAccessible = builder.publiclyAccessible;
            this.skipFinalSnapshot = builder.skipFinalSnapshot;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getBlueprintId() {
            return this.blueprintId;
        }

        @Override
        public final java.lang.String getBundleId() {
            return this.bundleId;
        }

        @Override
        public final java.lang.String getMasterDatabaseName() {
            return this.masterDatabaseName;
        }

        @Override
        public final java.lang.String getMasterPassword() {
            return this.masterPassword;
        }

        @Override
        public final java.lang.String getMasterUsername() {
            return this.masterUsername;
        }

        @Override
        public final java.lang.String getRelationalDatabaseName() {
            return this.relationalDatabaseName;
        }

        @Override
        public final java.lang.Object getApplyImmediately() {
            return this.applyImmediately;
        }

        @Override
        public final java.lang.String getAvailabilityZone() {
            return this.availabilityZone;
        }

        @Override
        public final java.lang.Object getBackupRetentionEnabled() {
            return this.backupRetentionEnabled;
        }

        @Override
        public final java.lang.String getFinalSnapshotName() {
            return this.finalSnapshotName;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getPreferredBackupWindow() {
            return this.preferredBackupWindow;
        }

        @Override
        public final java.lang.String getPreferredMaintenanceWindow() {
            return this.preferredMaintenanceWindow;
        }

        @Override
        public final java.lang.Object getPubliclyAccessible() {
            return this.publiclyAccessible;
        }

        @Override
        public final java.lang.Object getSkipFinalSnapshot() {
            return this.skipFinalSnapshot;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("blueprintId", om.valueToTree(this.getBlueprintId()));
            data.set("bundleId", om.valueToTree(this.getBundleId()));
            data.set("masterDatabaseName", om.valueToTree(this.getMasterDatabaseName()));
            data.set("masterPassword", om.valueToTree(this.getMasterPassword()));
            data.set("masterUsername", om.valueToTree(this.getMasterUsername()));
            data.set("relationalDatabaseName", om.valueToTree(this.getRelationalDatabaseName()));
            if (this.getApplyImmediately() != null) {
                data.set("applyImmediately", om.valueToTree(this.getApplyImmediately()));
            }
            if (this.getAvailabilityZone() != null) {
                data.set("availabilityZone", om.valueToTree(this.getAvailabilityZone()));
            }
            if (this.getBackupRetentionEnabled() != null) {
                data.set("backupRetentionEnabled", om.valueToTree(this.getBackupRetentionEnabled()));
            }
            if (this.getFinalSnapshotName() != null) {
                data.set("finalSnapshotName", om.valueToTree(this.getFinalSnapshotName()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getPreferredBackupWindow() != null) {
                data.set("preferredBackupWindow", om.valueToTree(this.getPreferredBackupWindow()));
            }
            if (this.getPreferredMaintenanceWindow() != null) {
                data.set("preferredMaintenanceWindow", om.valueToTree(this.getPreferredMaintenanceWindow()));
            }
            if (this.getPubliclyAccessible() != null) {
                data.set("publiclyAccessible", om.valueToTree(this.getPubliclyAccessible()));
            }
            if (this.getSkipFinalSnapshot() != null) {
                data.set("skipFinalSnapshot", om.valueToTree(this.getSkipFinalSnapshot()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lightsailDatabase.LightsailDatabaseConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LightsailDatabaseConfig.Jsii$Proxy that = (LightsailDatabaseConfig.Jsii$Proxy) o;

            if (!blueprintId.equals(that.blueprintId)) return false;
            if (!bundleId.equals(that.bundleId)) return false;
            if (!masterDatabaseName.equals(that.masterDatabaseName)) return false;
            if (!masterPassword.equals(that.masterPassword)) return false;
            if (!masterUsername.equals(that.masterUsername)) return false;
            if (!relationalDatabaseName.equals(that.relationalDatabaseName)) return false;
            if (this.applyImmediately != null ? !this.applyImmediately.equals(that.applyImmediately) : that.applyImmediately != null) return false;
            if (this.availabilityZone != null ? !this.availabilityZone.equals(that.availabilityZone) : that.availabilityZone != null) return false;
            if (this.backupRetentionEnabled != null ? !this.backupRetentionEnabled.equals(that.backupRetentionEnabled) : that.backupRetentionEnabled != null) return false;
            if (this.finalSnapshotName != null ? !this.finalSnapshotName.equals(that.finalSnapshotName) : that.finalSnapshotName != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.preferredBackupWindow != null ? !this.preferredBackupWindow.equals(that.preferredBackupWindow) : that.preferredBackupWindow != null) return false;
            if (this.preferredMaintenanceWindow != null ? !this.preferredMaintenanceWindow.equals(that.preferredMaintenanceWindow) : that.preferredMaintenanceWindow != null) return false;
            if (this.publiclyAccessible != null ? !this.publiclyAccessible.equals(that.publiclyAccessible) : that.publiclyAccessible != null) return false;
            if (this.skipFinalSnapshot != null ? !this.skipFinalSnapshot.equals(that.skipFinalSnapshot) : that.skipFinalSnapshot != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.blueprintId.hashCode();
            result = 31 * result + (this.bundleId.hashCode());
            result = 31 * result + (this.masterDatabaseName.hashCode());
            result = 31 * result + (this.masterPassword.hashCode());
            result = 31 * result + (this.masterUsername.hashCode());
            result = 31 * result + (this.relationalDatabaseName.hashCode());
            result = 31 * result + (this.applyImmediately != null ? this.applyImmediately.hashCode() : 0);
            result = 31 * result + (this.availabilityZone != null ? this.availabilityZone.hashCode() : 0);
            result = 31 * result + (this.backupRetentionEnabled != null ? this.backupRetentionEnabled.hashCode() : 0);
            result = 31 * result + (this.finalSnapshotName != null ? this.finalSnapshotName.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.preferredBackupWindow != null ? this.preferredBackupWindow.hashCode() : 0);
            result = 31 * result + (this.preferredMaintenanceWindow != null ? this.preferredMaintenanceWindow.hashCode() : 0);
            result = 31 * result + (this.publiclyAccessible != null ? this.publiclyAccessible.hashCode() : 0);
            result = 31 * result + (this.skipFinalSnapshot != null ? this.skipFinalSnapshot.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
