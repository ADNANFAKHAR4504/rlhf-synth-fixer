package imports.aws.fsx_ontap_storage_virtual_machine;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_storage_virtual_machine aws_fsx_ontap_storage_virtual_machine}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.247Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxOntapStorageVirtualMachine.FsxOntapStorageVirtualMachine")
public class FsxOntapStorageVirtualMachine extends com.hashicorp.cdktf.TerraformResource {

    protected FsxOntapStorageVirtualMachine(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FsxOntapStorageVirtualMachine(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachine.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_storage_virtual_machine aws_fsx_ontap_storage_virtual_machine} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public FsxOntapStorageVirtualMachine(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachineConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a FsxOntapStorageVirtualMachine resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the FsxOntapStorageVirtualMachine to import. This parameter is required.
     * @param importFromId The id of the existing FsxOntapStorageVirtualMachine that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the FsxOntapStorageVirtualMachine to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachine.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a FsxOntapStorageVirtualMachine resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the FsxOntapStorageVirtualMachine to import. This parameter is required.
     * @param importFromId The id of the existing FsxOntapStorageVirtualMachine that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachine.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putActiveDirectoryConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachineActiveDirectoryConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putActiveDirectoryConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachineTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetActiveDirectoryConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetActiveDirectoryConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRootVolumeSecurityStyle() {
        software.amazon.jsii.Kernel.call(this, "resetRootVolumeSecurityStyle", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSvmAdminPassword() {
        software.amazon.jsii.Kernel.call(this, "resetSvmAdminPassword", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachineActiveDirectoryConfigurationOutputReference getActiveDirectoryConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "activeDirectoryConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachineActiveDirectoryConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachineEndpointsList getEndpoints() {
        return software.amazon.jsii.Kernel.get(this, "endpoints", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachineEndpointsList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSubtype() {
        return software.amazon.jsii.Kernel.get(this, "subtype", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachineTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachineTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUuid() {
        return software.amazon.jsii.Kernel.get(this, "uuid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachineActiveDirectoryConfiguration getActiveDirectoryConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "activeDirectoryConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachineActiveDirectoryConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFileSystemIdInput() {
        return software.amazon.jsii.Kernel.get(this, "fileSystemIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRootVolumeSecurityStyleInput() {
        return software.amazon.jsii.Kernel.get(this, "rootVolumeSecurityStyleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSvmAdminPasswordInput() {
        return software.amazon.jsii.Kernel.get(this, "svmAdminPasswordInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getFileSystemId() {
        return software.amazon.jsii.Kernel.get(this, "fileSystemId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFileSystemId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fileSystemId", java.util.Objects.requireNonNull(value, "fileSystemId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRootVolumeSecurityStyle() {
        return software.amazon.jsii.Kernel.get(this, "rootVolumeSecurityStyle", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRootVolumeSecurityStyle(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rootVolumeSecurityStyle", java.util.Objects.requireNonNull(value, "rootVolumeSecurityStyle is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSvmAdminPassword() {
        return software.amazon.jsii.Kernel.get(this, "svmAdminPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSvmAdminPassword(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "svmAdminPassword", java.util.Objects.requireNonNull(value, "svmAdminPassword is required"));
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
     * A fluent builder for {@link imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachine}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachine> {
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
        private final imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachineConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachineConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_storage_virtual_machine#file_system_id FsxOntapStorageVirtualMachine#file_system_id}.
         * <p>
         * @return {@code this}
         * @param fileSystemId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_storage_virtual_machine#file_system_id FsxOntapStorageVirtualMachine#file_system_id}. This parameter is required.
         */
        public Builder fileSystemId(final java.lang.String fileSystemId) {
            this.config.fileSystemId(fileSystemId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_storage_virtual_machine#name FsxOntapStorageVirtualMachine#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_storage_virtual_machine#name FsxOntapStorageVirtualMachine#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * active_directory_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_storage_virtual_machine#active_directory_configuration FsxOntapStorageVirtualMachine#active_directory_configuration}
         * <p>
         * @return {@code this}
         * @param activeDirectoryConfiguration active_directory_configuration block. This parameter is required.
         */
        public Builder activeDirectoryConfiguration(final imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachineActiveDirectoryConfiguration activeDirectoryConfiguration) {
            this.config.activeDirectoryConfiguration(activeDirectoryConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_storage_virtual_machine#id FsxOntapStorageVirtualMachine#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_storage_virtual_machine#id FsxOntapStorageVirtualMachine#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_storage_virtual_machine#root_volume_security_style FsxOntapStorageVirtualMachine#root_volume_security_style}.
         * <p>
         * @return {@code this}
         * @param rootVolumeSecurityStyle Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_storage_virtual_machine#root_volume_security_style FsxOntapStorageVirtualMachine#root_volume_security_style}. This parameter is required.
         */
        public Builder rootVolumeSecurityStyle(final java.lang.String rootVolumeSecurityStyle) {
            this.config.rootVolumeSecurityStyle(rootVolumeSecurityStyle);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_storage_virtual_machine#svm_admin_password FsxOntapStorageVirtualMachine#svm_admin_password}.
         * <p>
         * @return {@code this}
         * @param svmAdminPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_storage_virtual_machine#svm_admin_password FsxOntapStorageVirtualMachine#svm_admin_password}. This parameter is required.
         */
        public Builder svmAdminPassword(final java.lang.String svmAdminPassword) {
            this.config.svmAdminPassword(svmAdminPassword);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_storage_virtual_machine#tags FsxOntapStorageVirtualMachine#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_storage_virtual_machine#tags FsxOntapStorageVirtualMachine#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_storage_virtual_machine#tags_all FsxOntapStorageVirtualMachine#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_storage_virtual_machine#tags_all FsxOntapStorageVirtualMachine#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_storage_virtual_machine#timeouts FsxOntapStorageVirtualMachine#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachineTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachine}.
         */
        @Override
        public imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachine build() {
            return new imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachine(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
