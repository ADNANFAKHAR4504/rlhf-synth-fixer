package imports.aws.fsx_data_repository_association;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association aws_fsx_data_repository_association}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.238Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxDataRepositoryAssociation.FsxDataRepositoryAssociation")
public class FsxDataRepositoryAssociation extends com.hashicorp.cdktf.TerraformResource {

    protected FsxDataRepositoryAssociation(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FsxDataRepositoryAssociation(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociation.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association aws_fsx_data_repository_association} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public FsxDataRepositoryAssociation(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a FsxDataRepositoryAssociation resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the FsxDataRepositoryAssociation to import. This parameter is required.
     * @param importFromId The id of the existing FsxDataRepositoryAssociation that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the FsxDataRepositoryAssociation to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociation.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a FsxDataRepositoryAssociation resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the FsxDataRepositoryAssociation to import. This parameter is required.
     * @param importFromId The id of the existing FsxDataRepositoryAssociation that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociation.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putS3(final @org.jetbrains.annotations.NotNull imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3 value) {
        software.amazon.jsii.Kernel.call(this, "putS3", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBatchImportMetaDataOnCreate() {
        software.amazon.jsii.Kernel.call(this, "resetBatchImportMetaDataOnCreate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeleteDataInFilesystem() {
        software.amazon.jsii.Kernel.call(this, "resetDeleteDataInFilesystem", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImportedFileChunkSize() {
        software.amazon.jsii.Kernel.call(this, "resetImportedFileChunkSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3() {
        software.amazon.jsii.Kernel.call(this, "resetS3", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getAssociationId() {
        return software.amazon.jsii.Kernel.get(this, "associationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3OutputReference getS3() {
        return software.amazon.jsii.Kernel.get(this, "s3", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3OutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBatchImportMetaDataOnCreateInput() {
        return software.amazon.jsii.Kernel.get(this, "batchImportMetaDataOnCreateInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataRepositoryPathInput() {
        return software.amazon.jsii.Kernel.get(this, "dataRepositoryPathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDeleteDataInFilesystemInput() {
        return software.amazon.jsii.Kernel.get(this, "deleteDataInFilesystemInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFileSystemIdInput() {
        return software.amazon.jsii.Kernel.get(this, "fileSystemIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFileSystemPathInput() {
        return software.amazon.jsii.Kernel.get(this, "fileSystemPathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getImportedFileChunkSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "importedFileChunkSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3 getS3Input() {
        return software.amazon.jsii.Kernel.get(this, "s3Input", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getBatchImportMetaDataOnCreate() {
        return software.amazon.jsii.Kernel.get(this, "batchImportMetaDataOnCreate", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setBatchImportMetaDataOnCreate(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "batchImportMetaDataOnCreate", java.util.Objects.requireNonNull(value, "batchImportMetaDataOnCreate is required"));
    }

    public void setBatchImportMetaDataOnCreate(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "batchImportMetaDataOnCreate", java.util.Objects.requireNonNull(value, "batchImportMetaDataOnCreate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataRepositoryPath() {
        return software.amazon.jsii.Kernel.get(this, "dataRepositoryPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataRepositoryPath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataRepositoryPath", java.util.Objects.requireNonNull(value, "dataRepositoryPath is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDeleteDataInFilesystem() {
        return software.amazon.jsii.Kernel.get(this, "deleteDataInFilesystem", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDeleteDataInFilesystem(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "deleteDataInFilesystem", java.util.Objects.requireNonNull(value, "deleteDataInFilesystem is required"));
    }

    public void setDeleteDataInFilesystem(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "deleteDataInFilesystem", java.util.Objects.requireNonNull(value, "deleteDataInFilesystem is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFileSystemId() {
        return software.amazon.jsii.Kernel.get(this, "fileSystemId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFileSystemId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fileSystemId", java.util.Objects.requireNonNull(value, "fileSystemId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFileSystemPath() {
        return software.amazon.jsii.Kernel.get(this, "fileSystemPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFileSystemPath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fileSystemPath", java.util.Objects.requireNonNull(value, "fileSystemPath is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getImportedFileChunkSize() {
        return software.amazon.jsii.Kernel.get(this, "importedFileChunkSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setImportedFileChunkSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "importedFileChunkSize", java.util.Objects.requireNonNull(value, "importedFileChunkSize is required"));
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
     * A fluent builder for {@link imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociation}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociation> {
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
        private final imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#data_repository_path FsxDataRepositoryAssociation#data_repository_path}.
         * <p>
         * @return {@code this}
         * @param dataRepositoryPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#data_repository_path FsxDataRepositoryAssociation#data_repository_path}. This parameter is required.
         */
        public Builder dataRepositoryPath(final java.lang.String dataRepositoryPath) {
            this.config.dataRepositoryPath(dataRepositoryPath);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#file_system_id FsxDataRepositoryAssociation#file_system_id}.
         * <p>
         * @return {@code this}
         * @param fileSystemId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#file_system_id FsxDataRepositoryAssociation#file_system_id}. This parameter is required.
         */
        public Builder fileSystemId(final java.lang.String fileSystemId) {
            this.config.fileSystemId(fileSystemId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#file_system_path FsxDataRepositoryAssociation#file_system_path}.
         * <p>
         * @return {@code this}
         * @param fileSystemPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#file_system_path FsxDataRepositoryAssociation#file_system_path}. This parameter is required.
         */
        public Builder fileSystemPath(final java.lang.String fileSystemPath) {
            this.config.fileSystemPath(fileSystemPath);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#batch_import_meta_data_on_create FsxDataRepositoryAssociation#batch_import_meta_data_on_create}.
         * <p>
         * @return {@code this}
         * @param batchImportMetaDataOnCreate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#batch_import_meta_data_on_create FsxDataRepositoryAssociation#batch_import_meta_data_on_create}. This parameter is required.
         */
        public Builder batchImportMetaDataOnCreate(final java.lang.Boolean batchImportMetaDataOnCreate) {
            this.config.batchImportMetaDataOnCreate(batchImportMetaDataOnCreate);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#batch_import_meta_data_on_create FsxDataRepositoryAssociation#batch_import_meta_data_on_create}.
         * <p>
         * @return {@code this}
         * @param batchImportMetaDataOnCreate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#batch_import_meta_data_on_create FsxDataRepositoryAssociation#batch_import_meta_data_on_create}. This parameter is required.
         */
        public Builder batchImportMetaDataOnCreate(final com.hashicorp.cdktf.IResolvable batchImportMetaDataOnCreate) {
            this.config.batchImportMetaDataOnCreate(batchImportMetaDataOnCreate);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#delete_data_in_filesystem FsxDataRepositoryAssociation#delete_data_in_filesystem}.
         * <p>
         * @return {@code this}
         * @param deleteDataInFilesystem Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#delete_data_in_filesystem FsxDataRepositoryAssociation#delete_data_in_filesystem}. This parameter is required.
         */
        public Builder deleteDataInFilesystem(final java.lang.Boolean deleteDataInFilesystem) {
            this.config.deleteDataInFilesystem(deleteDataInFilesystem);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#delete_data_in_filesystem FsxDataRepositoryAssociation#delete_data_in_filesystem}.
         * <p>
         * @return {@code this}
         * @param deleteDataInFilesystem Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#delete_data_in_filesystem FsxDataRepositoryAssociation#delete_data_in_filesystem}. This parameter is required.
         */
        public Builder deleteDataInFilesystem(final com.hashicorp.cdktf.IResolvable deleteDataInFilesystem) {
            this.config.deleteDataInFilesystem(deleteDataInFilesystem);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#id FsxDataRepositoryAssociation#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#id FsxDataRepositoryAssociation#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#imported_file_chunk_size FsxDataRepositoryAssociation#imported_file_chunk_size}.
         * <p>
         * @return {@code this}
         * @param importedFileChunkSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#imported_file_chunk_size FsxDataRepositoryAssociation#imported_file_chunk_size}. This parameter is required.
         */
        public Builder importedFileChunkSize(final java.lang.Number importedFileChunkSize) {
            this.config.importedFileChunkSize(importedFileChunkSize);
            return this;
        }

        /**
         * s3 block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#s3 FsxDataRepositoryAssociation#s3}
         * <p>
         * @return {@code this}
         * @param s3 s3 block. This parameter is required.
         */
        public Builder s3(final imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3 s3) {
            this.config.s3(s3);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#tags FsxDataRepositoryAssociation#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#tags FsxDataRepositoryAssociation#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#tags_all FsxDataRepositoryAssociation#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#tags_all FsxDataRepositoryAssociation#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_data_repository_association#timeouts FsxDataRepositoryAssociation#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociation}.
         */
        @Override
        public imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociation build() {
            return new imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociation(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
