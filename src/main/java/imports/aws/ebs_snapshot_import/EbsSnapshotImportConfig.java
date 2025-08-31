package imports.aws.ebs_snapshot_import;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.064Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ebsSnapshotImport.EbsSnapshotImportConfig")
@software.amazon.jsii.Jsii.Proxy(EbsSnapshotImportConfig.Jsii$Proxy.class)
public interface EbsSnapshotImportConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * disk_container block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#disk_container EbsSnapshotImport#disk_container}
     */
    @org.jetbrains.annotations.NotNull imports.aws.ebs_snapshot_import.EbsSnapshotImportDiskContainer getDiskContainer();

    /**
     * client_data block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#client_data EbsSnapshotImport#client_data}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ebs_snapshot_import.EbsSnapshotImportClientData getClientData() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#description EbsSnapshotImport#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#encrypted EbsSnapshotImport#encrypted}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEncrypted() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#id EbsSnapshotImport#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#kms_key_id EbsSnapshotImport#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#permanent_restore EbsSnapshotImport#permanent_restore}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPermanentRestore() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#role_name EbsSnapshotImport#role_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoleName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#storage_tier EbsSnapshotImport#storage_tier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStorageTier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#tags EbsSnapshotImport#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#tags_all EbsSnapshotImport#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#temporary_restore_days EbsSnapshotImport#temporary_restore_days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTemporaryRestoreDays() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#timeouts EbsSnapshotImport#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ebs_snapshot_import.EbsSnapshotImportTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EbsSnapshotImportConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EbsSnapshotImportConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EbsSnapshotImportConfig> {
        imports.aws.ebs_snapshot_import.EbsSnapshotImportDiskContainer diskContainer;
        imports.aws.ebs_snapshot_import.EbsSnapshotImportClientData clientData;
        java.lang.String description;
        java.lang.Object encrypted;
        java.lang.String id;
        java.lang.String kmsKeyId;
        java.lang.Object permanentRestore;
        java.lang.String roleName;
        java.lang.String storageTier;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Number temporaryRestoreDays;
        imports.aws.ebs_snapshot_import.EbsSnapshotImportTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link EbsSnapshotImportConfig#getDiskContainer}
         * @param diskContainer disk_container block. This parameter is required.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#disk_container EbsSnapshotImport#disk_container}
         * @return {@code this}
         */
        public Builder diskContainer(imports.aws.ebs_snapshot_import.EbsSnapshotImportDiskContainer diskContainer) {
            this.diskContainer = diskContainer;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportConfig#getClientData}
         * @param clientData client_data block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#client_data EbsSnapshotImport#client_data}
         * @return {@code this}
         */
        public Builder clientData(imports.aws.ebs_snapshot_import.EbsSnapshotImportClientData clientData) {
            this.clientData = clientData;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#description EbsSnapshotImport#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportConfig#getEncrypted}
         * @param encrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#encrypted EbsSnapshotImport#encrypted}.
         * @return {@code this}
         */
        public Builder encrypted(java.lang.Boolean encrypted) {
            this.encrypted = encrypted;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportConfig#getEncrypted}
         * @param encrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#encrypted EbsSnapshotImport#encrypted}.
         * @return {@code this}
         */
        public Builder encrypted(com.hashicorp.cdktf.IResolvable encrypted) {
            this.encrypted = encrypted;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#id EbsSnapshotImport#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#kms_key_id EbsSnapshotImport#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportConfig#getPermanentRestore}
         * @param permanentRestore Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#permanent_restore EbsSnapshotImport#permanent_restore}.
         * @return {@code this}
         */
        public Builder permanentRestore(java.lang.Boolean permanentRestore) {
            this.permanentRestore = permanentRestore;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportConfig#getPermanentRestore}
         * @param permanentRestore Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#permanent_restore EbsSnapshotImport#permanent_restore}.
         * @return {@code this}
         */
        public Builder permanentRestore(com.hashicorp.cdktf.IResolvable permanentRestore) {
            this.permanentRestore = permanentRestore;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportConfig#getRoleName}
         * @param roleName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#role_name EbsSnapshotImport#role_name}.
         * @return {@code this}
         */
        public Builder roleName(java.lang.String roleName) {
            this.roleName = roleName;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportConfig#getStorageTier}
         * @param storageTier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#storage_tier EbsSnapshotImport#storage_tier}.
         * @return {@code this}
         */
        public Builder storageTier(java.lang.String storageTier) {
            this.storageTier = storageTier;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#tags EbsSnapshotImport#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#tags_all EbsSnapshotImport#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportConfig#getTemporaryRestoreDays}
         * @param temporaryRestoreDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#temporary_restore_days EbsSnapshotImport#temporary_restore_days}.
         * @return {@code this}
         */
        public Builder temporaryRestoreDays(java.lang.Number temporaryRestoreDays) {
            this.temporaryRestoreDays = temporaryRestoreDays;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#timeouts EbsSnapshotImport#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.ebs_snapshot_import.EbsSnapshotImportTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportConfig#getDependsOn}
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
         * Sets the value of {@link EbsSnapshotImportConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportConfig#getProvisioners}
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
         * @return a new instance of {@link EbsSnapshotImportConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EbsSnapshotImportConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EbsSnapshotImportConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EbsSnapshotImportConfig {
        private final imports.aws.ebs_snapshot_import.EbsSnapshotImportDiskContainer diskContainer;
        private final imports.aws.ebs_snapshot_import.EbsSnapshotImportClientData clientData;
        private final java.lang.String description;
        private final java.lang.Object encrypted;
        private final java.lang.String id;
        private final java.lang.String kmsKeyId;
        private final java.lang.Object permanentRestore;
        private final java.lang.String roleName;
        private final java.lang.String storageTier;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Number temporaryRestoreDays;
        private final imports.aws.ebs_snapshot_import.EbsSnapshotImportTimeouts timeouts;
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
            this.diskContainer = software.amazon.jsii.Kernel.get(this, "diskContainer", software.amazon.jsii.NativeType.forClass(imports.aws.ebs_snapshot_import.EbsSnapshotImportDiskContainer.class));
            this.clientData = software.amazon.jsii.Kernel.get(this, "clientData", software.amazon.jsii.NativeType.forClass(imports.aws.ebs_snapshot_import.EbsSnapshotImportClientData.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encrypted = software.amazon.jsii.Kernel.get(this, "encrypted", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.permanentRestore = software.amazon.jsii.Kernel.get(this, "permanentRestore", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.roleName = software.amazon.jsii.Kernel.get(this, "roleName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.storageTier = software.amazon.jsii.Kernel.get(this, "storageTier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.temporaryRestoreDays = software.amazon.jsii.Kernel.get(this, "temporaryRestoreDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.ebs_snapshot_import.EbsSnapshotImportTimeouts.class));
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
            this.diskContainer = java.util.Objects.requireNonNull(builder.diskContainer, "diskContainer is required");
            this.clientData = builder.clientData;
            this.description = builder.description;
            this.encrypted = builder.encrypted;
            this.id = builder.id;
            this.kmsKeyId = builder.kmsKeyId;
            this.permanentRestore = builder.permanentRestore;
            this.roleName = builder.roleName;
            this.storageTier = builder.storageTier;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.temporaryRestoreDays = builder.temporaryRestoreDays;
            this.timeouts = builder.timeouts;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final imports.aws.ebs_snapshot_import.EbsSnapshotImportDiskContainer getDiskContainer() {
            return this.diskContainer;
        }

        @Override
        public final imports.aws.ebs_snapshot_import.EbsSnapshotImportClientData getClientData() {
            return this.clientData;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getEncrypted() {
            return this.encrypted;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final java.lang.Object getPermanentRestore() {
            return this.permanentRestore;
        }

        @Override
        public final java.lang.String getRoleName() {
            return this.roleName;
        }

        @Override
        public final java.lang.String getStorageTier() {
            return this.storageTier;
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
        public final java.lang.Number getTemporaryRestoreDays() {
            return this.temporaryRestoreDays;
        }

        @Override
        public final imports.aws.ebs_snapshot_import.EbsSnapshotImportTimeouts getTimeouts() {
            return this.timeouts;
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

            data.set("diskContainer", om.valueToTree(this.getDiskContainer()));
            if (this.getClientData() != null) {
                data.set("clientData", om.valueToTree(this.getClientData()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getEncrypted() != null) {
                data.set("encrypted", om.valueToTree(this.getEncrypted()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getPermanentRestore() != null) {
                data.set("permanentRestore", om.valueToTree(this.getPermanentRestore()));
            }
            if (this.getRoleName() != null) {
                data.set("roleName", om.valueToTree(this.getRoleName()));
            }
            if (this.getStorageTier() != null) {
                data.set("storageTier", om.valueToTree(this.getStorageTier()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTemporaryRestoreDays() != null) {
                data.set("temporaryRestoreDays", om.valueToTree(this.getTemporaryRestoreDays()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
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
            struct.set("fqn", om.valueToTree("aws.ebsSnapshotImport.EbsSnapshotImportConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EbsSnapshotImportConfig.Jsii$Proxy that = (EbsSnapshotImportConfig.Jsii$Proxy) o;

            if (!diskContainer.equals(that.diskContainer)) return false;
            if (this.clientData != null ? !this.clientData.equals(that.clientData) : that.clientData != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.encrypted != null ? !this.encrypted.equals(that.encrypted) : that.encrypted != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.permanentRestore != null ? !this.permanentRestore.equals(that.permanentRestore) : that.permanentRestore != null) return false;
            if (this.roleName != null ? !this.roleName.equals(that.roleName) : that.roleName != null) return false;
            if (this.storageTier != null ? !this.storageTier.equals(that.storageTier) : that.storageTier != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.temporaryRestoreDays != null ? !this.temporaryRestoreDays.equals(that.temporaryRestoreDays) : that.temporaryRestoreDays != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
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
            int result = this.diskContainer.hashCode();
            result = 31 * result + (this.clientData != null ? this.clientData.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.encrypted != null ? this.encrypted.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.permanentRestore != null ? this.permanentRestore.hashCode() : 0);
            result = 31 * result + (this.roleName != null ? this.roleName.hashCode() : 0);
            result = 31 * result + (this.storageTier != null ? this.storageTier.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.temporaryRestoreDays != null ? this.temporaryRestoreDays.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
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
