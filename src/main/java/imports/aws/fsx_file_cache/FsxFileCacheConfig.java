package imports.aws.fsx_file_cache;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.244Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxFileCache.FsxFileCacheConfig")
@software.amazon.jsii.Jsii.Proxy(FsxFileCacheConfig.Jsii$Proxy.class)
public interface FsxFileCacheConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#file_cache_type FsxFileCache#file_cache_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFileCacheType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#file_cache_type_version FsxFileCache#file_cache_type_version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFileCacheTypeVersion();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#storage_capacity FsxFileCache#storage_capacity}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getStorageCapacity();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#subnet_ids FsxFileCache#subnet_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnetIds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#copy_tags_to_data_repository_associations FsxFileCache#copy_tags_to_data_repository_associations}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCopyTagsToDataRepositoryAssociations() {
        return null;
    }

    /**
     * data_repository_association block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#data_repository_association FsxFileCache#data_repository_association}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDataRepositoryAssociation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#id FsxFileCache#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#kms_key_id FsxFileCache#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * lustre_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#lustre_configuration FsxFileCache#lustre_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLustreConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#security_group_ids FsxFileCache#security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#tags FsxFileCache#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#tags_all FsxFileCache#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#timeouts FsxFileCache#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_file_cache.FsxFileCacheTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FsxFileCacheConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxFileCacheConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxFileCacheConfig> {
        java.lang.String fileCacheType;
        java.lang.String fileCacheTypeVersion;
        java.lang.Number storageCapacity;
        java.util.List<java.lang.String> subnetIds;
        java.lang.Object copyTagsToDataRepositoryAssociations;
        java.lang.Object dataRepositoryAssociation;
        java.lang.String id;
        java.lang.String kmsKeyId;
        java.lang.Object lustreConfiguration;
        java.util.List<java.lang.String> securityGroupIds;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.fsx_file_cache.FsxFileCacheTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link FsxFileCacheConfig#getFileCacheType}
         * @param fileCacheType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#file_cache_type FsxFileCache#file_cache_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder fileCacheType(java.lang.String fileCacheType) {
            this.fileCacheType = fileCacheType;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheConfig#getFileCacheTypeVersion}
         * @param fileCacheTypeVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#file_cache_type_version FsxFileCache#file_cache_type_version}. This parameter is required.
         * @return {@code this}
         */
        public Builder fileCacheTypeVersion(java.lang.String fileCacheTypeVersion) {
            this.fileCacheTypeVersion = fileCacheTypeVersion;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheConfig#getStorageCapacity}
         * @param storageCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#storage_capacity FsxFileCache#storage_capacity}. This parameter is required.
         * @return {@code this}
         */
        public Builder storageCapacity(java.lang.Number storageCapacity) {
            this.storageCapacity = storageCapacity;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheConfig#getSubnetIds}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#subnet_ids FsxFileCache#subnet_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder subnetIds(java.util.List<java.lang.String> subnetIds) {
            this.subnetIds = subnetIds;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheConfig#getCopyTagsToDataRepositoryAssociations}
         * @param copyTagsToDataRepositoryAssociations Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#copy_tags_to_data_repository_associations FsxFileCache#copy_tags_to_data_repository_associations}.
         * @return {@code this}
         */
        public Builder copyTagsToDataRepositoryAssociations(java.lang.Boolean copyTagsToDataRepositoryAssociations) {
            this.copyTagsToDataRepositoryAssociations = copyTagsToDataRepositoryAssociations;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheConfig#getCopyTagsToDataRepositoryAssociations}
         * @param copyTagsToDataRepositoryAssociations Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#copy_tags_to_data_repository_associations FsxFileCache#copy_tags_to_data_repository_associations}.
         * @return {@code this}
         */
        public Builder copyTagsToDataRepositoryAssociations(com.hashicorp.cdktf.IResolvable copyTagsToDataRepositoryAssociations) {
            this.copyTagsToDataRepositoryAssociations = copyTagsToDataRepositoryAssociations;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheConfig#getDataRepositoryAssociation}
         * @param dataRepositoryAssociation data_repository_association block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#data_repository_association FsxFileCache#data_repository_association}
         * @return {@code this}
         */
        public Builder dataRepositoryAssociation(com.hashicorp.cdktf.IResolvable dataRepositoryAssociation) {
            this.dataRepositoryAssociation = dataRepositoryAssociation;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheConfig#getDataRepositoryAssociation}
         * @param dataRepositoryAssociation data_repository_association block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#data_repository_association FsxFileCache#data_repository_association}
         * @return {@code this}
         */
        public Builder dataRepositoryAssociation(java.util.List<? extends imports.aws.fsx_file_cache.FsxFileCacheDataRepositoryAssociation> dataRepositoryAssociation) {
            this.dataRepositoryAssociation = dataRepositoryAssociation;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#id FsxFileCache#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#kms_key_id FsxFileCache#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheConfig#getLustreConfiguration}
         * @param lustreConfiguration lustre_configuration block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#lustre_configuration FsxFileCache#lustre_configuration}
         * @return {@code this}
         */
        public Builder lustreConfiguration(com.hashicorp.cdktf.IResolvable lustreConfiguration) {
            this.lustreConfiguration = lustreConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheConfig#getLustreConfiguration}
         * @param lustreConfiguration lustre_configuration block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#lustre_configuration FsxFileCache#lustre_configuration}
         * @return {@code this}
         */
        public Builder lustreConfiguration(java.util.List<? extends imports.aws.fsx_file_cache.FsxFileCacheLustreConfiguration> lustreConfiguration) {
            this.lustreConfiguration = lustreConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheConfig#getSecurityGroupIds}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#security_group_ids FsxFileCache#security_group_ids}.
         * @return {@code this}
         */
        public Builder securityGroupIds(java.util.List<java.lang.String> securityGroupIds) {
            this.securityGroupIds = securityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#tags FsxFileCache#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#tags_all FsxFileCache#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#timeouts FsxFileCache#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.fsx_file_cache.FsxFileCacheTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheConfig#getDependsOn}
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
         * Sets the value of {@link FsxFileCacheConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link FsxFileCacheConfig#getProvisioners}
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
         * @return a new instance of {@link FsxFileCacheConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxFileCacheConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxFileCacheConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxFileCacheConfig {
        private final java.lang.String fileCacheType;
        private final java.lang.String fileCacheTypeVersion;
        private final java.lang.Number storageCapacity;
        private final java.util.List<java.lang.String> subnetIds;
        private final java.lang.Object copyTagsToDataRepositoryAssociations;
        private final java.lang.Object dataRepositoryAssociation;
        private final java.lang.String id;
        private final java.lang.String kmsKeyId;
        private final java.lang.Object lustreConfiguration;
        private final java.util.List<java.lang.String> securityGroupIds;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.fsx_file_cache.FsxFileCacheTimeouts timeouts;
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
            this.fileCacheType = software.amazon.jsii.Kernel.get(this, "fileCacheType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fileCacheTypeVersion = software.amazon.jsii.Kernel.get(this, "fileCacheTypeVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.storageCapacity = software.amazon.jsii.Kernel.get(this, "storageCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.subnetIds = software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.copyTagsToDataRepositoryAssociations = software.amazon.jsii.Kernel.get(this, "copyTagsToDataRepositoryAssociations", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dataRepositoryAssociation = software.amazon.jsii.Kernel.get(this, "dataRepositoryAssociation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lustreConfiguration = software.amazon.jsii.Kernel.get(this, "lustreConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.securityGroupIds = software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_file_cache.FsxFileCacheTimeouts.class));
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
            this.fileCacheType = java.util.Objects.requireNonNull(builder.fileCacheType, "fileCacheType is required");
            this.fileCacheTypeVersion = java.util.Objects.requireNonNull(builder.fileCacheTypeVersion, "fileCacheTypeVersion is required");
            this.storageCapacity = java.util.Objects.requireNonNull(builder.storageCapacity, "storageCapacity is required");
            this.subnetIds = java.util.Objects.requireNonNull(builder.subnetIds, "subnetIds is required");
            this.copyTagsToDataRepositoryAssociations = builder.copyTagsToDataRepositoryAssociations;
            this.dataRepositoryAssociation = builder.dataRepositoryAssociation;
            this.id = builder.id;
            this.kmsKeyId = builder.kmsKeyId;
            this.lustreConfiguration = builder.lustreConfiguration;
            this.securityGroupIds = builder.securityGroupIds;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
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
        public final java.lang.String getFileCacheType() {
            return this.fileCacheType;
        }

        @Override
        public final java.lang.String getFileCacheTypeVersion() {
            return this.fileCacheTypeVersion;
        }

        @Override
        public final java.lang.Number getStorageCapacity() {
            return this.storageCapacity;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnetIds() {
            return this.subnetIds;
        }

        @Override
        public final java.lang.Object getCopyTagsToDataRepositoryAssociations() {
            return this.copyTagsToDataRepositoryAssociations;
        }

        @Override
        public final java.lang.Object getDataRepositoryAssociation() {
            return this.dataRepositoryAssociation;
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
        public final java.lang.Object getLustreConfiguration() {
            return this.lustreConfiguration;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroupIds() {
            return this.securityGroupIds;
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
        public final imports.aws.fsx_file_cache.FsxFileCacheTimeouts getTimeouts() {
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

            data.set("fileCacheType", om.valueToTree(this.getFileCacheType()));
            data.set("fileCacheTypeVersion", om.valueToTree(this.getFileCacheTypeVersion()));
            data.set("storageCapacity", om.valueToTree(this.getStorageCapacity()));
            data.set("subnetIds", om.valueToTree(this.getSubnetIds()));
            if (this.getCopyTagsToDataRepositoryAssociations() != null) {
                data.set("copyTagsToDataRepositoryAssociations", om.valueToTree(this.getCopyTagsToDataRepositoryAssociations()));
            }
            if (this.getDataRepositoryAssociation() != null) {
                data.set("dataRepositoryAssociation", om.valueToTree(this.getDataRepositoryAssociation()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getLustreConfiguration() != null) {
                data.set("lustreConfiguration", om.valueToTree(this.getLustreConfiguration()));
            }
            if (this.getSecurityGroupIds() != null) {
                data.set("securityGroupIds", om.valueToTree(this.getSecurityGroupIds()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
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
            struct.set("fqn", om.valueToTree("aws.fsxFileCache.FsxFileCacheConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxFileCacheConfig.Jsii$Proxy that = (FsxFileCacheConfig.Jsii$Proxy) o;

            if (!fileCacheType.equals(that.fileCacheType)) return false;
            if (!fileCacheTypeVersion.equals(that.fileCacheTypeVersion)) return false;
            if (!storageCapacity.equals(that.storageCapacity)) return false;
            if (!subnetIds.equals(that.subnetIds)) return false;
            if (this.copyTagsToDataRepositoryAssociations != null ? !this.copyTagsToDataRepositoryAssociations.equals(that.copyTagsToDataRepositoryAssociations) : that.copyTagsToDataRepositoryAssociations != null) return false;
            if (this.dataRepositoryAssociation != null ? !this.dataRepositoryAssociation.equals(that.dataRepositoryAssociation) : that.dataRepositoryAssociation != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.lustreConfiguration != null ? !this.lustreConfiguration.equals(that.lustreConfiguration) : that.lustreConfiguration != null) return false;
            if (this.securityGroupIds != null ? !this.securityGroupIds.equals(that.securityGroupIds) : that.securityGroupIds != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
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
            int result = this.fileCacheType.hashCode();
            result = 31 * result + (this.fileCacheTypeVersion.hashCode());
            result = 31 * result + (this.storageCapacity.hashCode());
            result = 31 * result + (this.subnetIds.hashCode());
            result = 31 * result + (this.copyTagsToDataRepositoryAssociations != null ? this.copyTagsToDataRepositoryAssociations.hashCode() : 0);
            result = 31 * result + (this.dataRepositoryAssociation != null ? this.dataRepositoryAssociation.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.lustreConfiguration != null ? this.lustreConfiguration.hashCode() : 0);
            result = 31 * result + (this.securityGroupIds != null ? this.securityGroupIds.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
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
