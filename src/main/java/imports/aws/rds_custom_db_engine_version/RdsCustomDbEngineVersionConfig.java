package imports.aws.rds_custom_db_engine_version;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.144Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rdsCustomDbEngineVersion.RdsCustomDbEngineVersionConfig")
@software.amazon.jsii.Jsii.Proxy(RdsCustomDbEngineVersionConfig.Jsii$Proxy.class)
public interface RdsCustomDbEngineVersionConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#engine RdsCustomDbEngineVersion#engine}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEngine();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#engine_version RdsCustomDbEngineVersion#engine_version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEngineVersion();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#database_installation_files_s3_bucket_name RdsCustomDbEngineVersion#database_installation_files_s3_bucket_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDatabaseInstallationFilesS3BucketName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#database_installation_files_s3_prefix RdsCustomDbEngineVersion#database_installation_files_s3_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDatabaseInstallationFilesS3Prefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#description RdsCustomDbEngineVersion#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#filename RdsCustomDbEngineVersion#filename}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFilename() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#id RdsCustomDbEngineVersion#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#kms_key_id RdsCustomDbEngineVersion#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#manifest RdsCustomDbEngineVersion#manifest}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getManifest() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#manifest_hash RdsCustomDbEngineVersion#manifest_hash}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getManifestHash() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#source_image_id RdsCustomDbEngineVersion#source_image_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceImageId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#status RdsCustomDbEngineVersion#status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatus() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#tags RdsCustomDbEngineVersion#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#tags_all RdsCustomDbEngineVersion#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#timeouts RdsCustomDbEngineVersion#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.rds_custom_db_engine_version.RdsCustomDbEngineVersionTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RdsCustomDbEngineVersionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RdsCustomDbEngineVersionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RdsCustomDbEngineVersionConfig> {
        java.lang.String engine;
        java.lang.String engineVersion;
        java.lang.String databaseInstallationFilesS3BucketName;
        java.lang.String databaseInstallationFilesS3Prefix;
        java.lang.String description;
        java.lang.String filename;
        java.lang.String id;
        java.lang.String kmsKeyId;
        java.lang.String manifest;
        java.lang.String manifestHash;
        java.lang.String sourceImageId;
        java.lang.String status;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.rds_custom_db_engine_version.RdsCustomDbEngineVersionTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link RdsCustomDbEngineVersionConfig#getEngine}
         * @param engine Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#engine RdsCustomDbEngineVersion#engine}. This parameter is required.
         * @return {@code this}
         */
        public Builder engine(java.lang.String engine) {
            this.engine = engine;
            return this;
        }

        /**
         * Sets the value of {@link RdsCustomDbEngineVersionConfig#getEngineVersion}
         * @param engineVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#engine_version RdsCustomDbEngineVersion#engine_version}. This parameter is required.
         * @return {@code this}
         */
        public Builder engineVersion(java.lang.String engineVersion) {
            this.engineVersion = engineVersion;
            return this;
        }

        /**
         * Sets the value of {@link RdsCustomDbEngineVersionConfig#getDatabaseInstallationFilesS3BucketName}
         * @param databaseInstallationFilesS3BucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#database_installation_files_s3_bucket_name RdsCustomDbEngineVersion#database_installation_files_s3_bucket_name}.
         * @return {@code this}
         */
        public Builder databaseInstallationFilesS3BucketName(java.lang.String databaseInstallationFilesS3BucketName) {
            this.databaseInstallationFilesS3BucketName = databaseInstallationFilesS3BucketName;
            return this;
        }

        /**
         * Sets the value of {@link RdsCustomDbEngineVersionConfig#getDatabaseInstallationFilesS3Prefix}
         * @param databaseInstallationFilesS3Prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#database_installation_files_s3_prefix RdsCustomDbEngineVersion#database_installation_files_s3_prefix}.
         * @return {@code this}
         */
        public Builder databaseInstallationFilesS3Prefix(java.lang.String databaseInstallationFilesS3Prefix) {
            this.databaseInstallationFilesS3Prefix = databaseInstallationFilesS3Prefix;
            return this;
        }

        /**
         * Sets the value of {@link RdsCustomDbEngineVersionConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#description RdsCustomDbEngineVersion#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link RdsCustomDbEngineVersionConfig#getFilename}
         * @param filename Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#filename RdsCustomDbEngineVersion#filename}.
         * @return {@code this}
         */
        public Builder filename(java.lang.String filename) {
            this.filename = filename;
            return this;
        }

        /**
         * Sets the value of {@link RdsCustomDbEngineVersionConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#id RdsCustomDbEngineVersion#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link RdsCustomDbEngineVersionConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#kms_key_id RdsCustomDbEngineVersion#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link RdsCustomDbEngineVersionConfig#getManifest}
         * @param manifest Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#manifest RdsCustomDbEngineVersion#manifest}.
         * @return {@code this}
         */
        public Builder manifest(java.lang.String manifest) {
            this.manifest = manifest;
            return this;
        }

        /**
         * Sets the value of {@link RdsCustomDbEngineVersionConfig#getManifestHash}
         * @param manifestHash Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#manifest_hash RdsCustomDbEngineVersion#manifest_hash}.
         * @return {@code this}
         */
        public Builder manifestHash(java.lang.String manifestHash) {
            this.manifestHash = manifestHash;
            return this;
        }

        /**
         * Sets the value of {@link RdsCustomDbEngineVersionConfig#getSourceImageId}
         * @param sourceImageId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#source_image_id RdsCustomDbEngineVersion#source_image_id}.
         * @return {@code this}
         */
        public Builder sourceImageId(java.lang.String sourceImageId) {
            this.sourceImageId = sourceImageId;
            return this;
        }

        /**
         * Sets the value of {@link RdsCustomDbEngineVersionConfig#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#status RdsCustomDbEngineVersion#status}.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Sets the value of {@link RdsCustomDbEngineVersionConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#tags RdsCustomDbEngineVersion#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link RdsCustomDbEngineVersionConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#tags_all RdsCustomDbEngineVersion#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link RdsCustomDbEngineVersionConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_custom_db_engine_version#timeouts RdsCustomDbEngineVersion#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.rds_custom_db_engine_version.RdsCustomDbEngineVersionTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link RdsCustomDbEngineVersionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RdsCustomDbEngineVersionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RdsCustomDbEngineVersionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RdsCustomDbEngineVersionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RdsCustomDbEngineVersionConfig#getDependsOn}
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
         * Sets the value of {@link RdsCustomDbEngineVersionConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link RdsCustomDbEngineVersionConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link RdsCustomDbEngineVersionConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link RdsCustomDbEngineVersionConfig#getProvisioners}
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
         * @return a new instance of {@link RdsCustomDbEngineVersionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RdsCustomDbEngineVersionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RdsCustomDbEngineVersionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RdsCustomDbEngineVersionConfig {
        private final java.lang.String engine;
        private final java.lang.String engineVersion;
        private final java.lang.String databaseInstallationFilesS3BucketName;
        private final java.lang.String databaseInstallationFilesS3Prefix;
        private final java.lang.String description;
        private final java.lang.String filename;
        private final java.lang.String id;
        private final java.lang.String kmsKeyId;
        private final java.lang.String manifest;
        private final java.lang.String manifestHash;
        private final java.lang.String sourceImageId;
        private final java.lang.String status;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.rds_custom_db_engine_version.RdsCustomDbEngineVersionTimeouts timeouts;
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
            this.engine = software.amazon.jsii.Kernel.get(this, "engine", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.engineVersion = software.amazon.jsii.Kernel.get(this, "engineVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.databaseInstallationFilesS3BucketName = software.amazon.jsii.Kernel.get(this, "databaseInstallationFilesS3BucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.databaseInstallationFilesS3Prefix = software.amazon.jsii.Kernel.get(this, "databaseInstallationFilesS3Prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.filename = software.amazon.jsii.Kernel.get(this, "filename", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.manifest = software.amazon.jsii.Kernel.get(this, "manifest", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.manifestHash = software.amazon.jsii.Kernel.get(this, "manifestHash", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceImageId = software.amazon.jsii.Kernel.get(this, "sourceImageId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.rds_custom_db_engine_version.RdsCustomDbEngineVersionTimeouts.class));
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
            this.engine = java.util.Objects.requireNonNull(builder.engine, "engine is required");
            this.engineVersion = java.util.Objects.requireNonNull(builder.engineVersion, "engineVersion is required");
            this.databaseInstallationFilesS3BucketName = builder.databaseInstallationFilesS3BucketName;
            this.databaseInstallationFilesS3Prefix = builder.databaseInstallationFilesS3Prefix;
            this.description = builder.description;
            this.filename = builder.filename;
            this.id = builder.id;
            this.kmsKeyId = builder.kmsKeyId;
            this.manifest = builder.manifest;
            this.manifestHash = builder.manifestHash;
            this.sourceImageId = builder.sourceImageId;
            this.status = builder.status;
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
        public final java.lang.String getEngine() {
            return this.engine;
        }

        @Override
        public final java.lang.String getEngineVersion() {
            return this.engineVersion;
        }

        @Override
        public final java.lang.String getDatabaseInstallationFilesS3BucketName() {
            return this.databaseInstallationFilesS3BucketName;
        }

        @Override
        public final java.lang.String getDatabaseInstallationFilesS3Prefix() {
            return this.databaseInstallationFilesS3Prefix;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getFilename() {
            return this.filename;
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
        public final java.lang.String getManifest() {
            return this.manifest;
        }

        @Override
        public final java.lang.String getManifestHash() {
            return this.manifestHash;
        }

        @Override
        public final java.lang.String getSourceImageId() {
            return this.sourceImageId;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
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
        public final imports.aws.rds_custom_db_engine_version.RdsCustomDbEngineVersionTimeouts getTimeouts() {
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

            data.set("engine", om.valueToTree(this.getEngine()));
            data.set("engineVersion", om.valueToTree(this.getEngineVersion()));
            if (this.getDatabaseInstallationFilesS3BucketName() != null) {
                data.set("databaseInstallationFilesS3BucketName", om.valueToTree(this.getDatabaseInstallationFilesS3BucketName()));
            }
            if (this.getDatabaseInstallationFilesS3Prefix() != null) {
                data.set("databaseInstallationFilesS3Prefix", om.valueToTree(this.getDatabaseInstallationFilesS3Prefix()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getFilename() != null) {
                data.set("filename", om.valueToTree(this.getFilename()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getManifest() != null) {
                data.set("manifest", om.valueToTree(this.getManifest()));
            }
            if (this.getManifestHash() != null) {
                data.set("manifestHash", om.valueToTree(this.getManifestHash()));
            }
            if (this.getSourceImageId() != null) {
                data.set("sourceImageId", om.valueToTree(this.getSourceImageId()));
            }
            if (this.getStatus() != null) {
                data.set("status", om.valueToTree(this.getStatus()));
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
            struct.set("fqn", om.valueToTree("aws.rdsCustomDbEngineVersion.RdsCustomDbEngineVersionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RdsCustomDbEngineVersionConfig.Jsii$Proxy that = (RdsCustomDbEngineVersionConfig.Jsii$Proxy) o;

            if (!engine.equals(that.engine)) return false;
            if (!engineVersion.equals(that.engineVersion)) return false;
            if (this.databaseInstallationFilesS3BucketName != null ? !this.databaseInstallationFilesS3BucketName.equals(that.databaseInstallationFilesS3BucketName) : that.databaseInstallationFilesS3BucketName != null) return false;
            if (this.databaseInstallationFilesS3Prefix != null ? !this.databaseInstallationFilesS3Prefix.equals(that.databaseInstallationFilesS3Prefix) : that.databaseInstallationFilesS3Prefix != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.filename != null ? !this.filename.equals(that.filename) : that.filename != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.manifest != null ? !this.manifest.equals(that.manifest) : that.manifest != null) return false;
            if (this.manifestHash != null ? !this.manifestHash.equals(that.manifestHash) : that.manifestHash != null) return false;
            if (this.sourceImageId != null ? !this.sourceImageId.equals(that.sourceImageId) : that.sourceImageId != null) return false;
            if (this.status != null ? !this.status.equals(that.status) : that.status != null) return false;
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
            int result = this.engine.hashCode();
            result = 31 * result + (this.engineVersion.hashCode());
            result = 31 * result + (this.databaseInstallationFilesS3BucketName != null ? this.databaseInstallationFilesS3BucketName.hashCode() : 0);
            result = 31 * result + (this.databaseInstallationFilesS3Prefix != null ? this.databaseInstallationFilesS3Prefix.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.filename != null ? this.filename.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.manifest != null ? this.manifest.hashCode() : 0);
            result = 31 * result + (this.manifestHash != null ? this.manifestHash.hashCode() : 0);
            result = 31 * result + (this.sourceImageId != null ? this.sourceImageId.hashCode() : 0);
            result = 31 * result + (this.status != null ? this.status.hashCode() : 0);
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
