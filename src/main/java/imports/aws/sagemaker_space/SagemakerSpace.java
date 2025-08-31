package imports.aws.sagemaker_space;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space aws_sagemaker_space}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.340Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerSpace.SagemakerSpace")
public class SagemakerSpace extends com.hashicorp.cdktf.TerraformResource {

    protected SagemakerSpace(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerSpace(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.sagemaker_space.SagemakerSpace.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space aws_sagemaker_space} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public SagemakerSpace(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a SagemakerSpace resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SagemakerSpace to import. This parameter is required.
     * @param importFromId The id of the existing SagemakerSpace that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the SagemakerSpace to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.sagemaker_space.SagemakerSpace.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a SagemakerSpace resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SagemakerSpace to import. This parameter is required.
     * @param importFromId The id of the existing SagemakerSpace that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.sagemaker_space.SagemakerSpace.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putOwnershipSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceOwnershipSettings value) {
        software.amazon.jsii.Kernel.call(this, "putOwnershipSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSpaceSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceSpaceSettings value) {
        software.amazon.jsii.Kernel.call(this, "putSpaceSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSpaceSharingSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceSpaceSharingSettings value) {
        software.amazon.jsii.Kernel.call(this, "putSpaceSharingSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOwnershipSettings() {
        software.amazon.jsii.Kernel.call(this, "resetOwnershipSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSpaceDisplayName() {
        software.amazon.jsii.Kernel.call(this, "resetSpaceDisplayName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSpaceSettings() {
        software.amazon.jsii.Kernel.call(this, "resetSpaceSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSpaceSharingSettings() {
        software.amazon.jsii.Kernel.call(this, "resetSpaceSharingSettings", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getHomeEfsFileSystemUid() {
        return software.amazon.jsii.Kernel.get(this, "homeEfsFileSystemUid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceOwnershipSettingsOutputReference getOwnershipSettings() {
        return software.amazon.jsii.Kernel.get(this, "ownershipSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceOwnershipSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsOutputReference getSpaceSettings() {
        return software.amazon.jsii.Kernel.get(this, "spaceSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceSpaceSharingSettingsOutputReference getSpaceSharingSettings() {
        return software.amazon.jsii.Kernel.get(this, "spaceSharingSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSharingSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUrl() {
        return software.amazon.jsii.Kernel.get(this, "url", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDomainIdInput() {
        return software.amazon.jsii.Kernel.get(this, "domainIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceOwnershipSettings getOwnershipSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "ownershipSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceOwnershipSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSpaceDisplayNameInput() {
        return software.amazon.jsii.Kernel.get(this, "spaceDisplayNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSpaceNameInput() {
        return software.amazon.jsii.Kernel.get(this, "spaceNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSettings getSpaceSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "spaceSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSharingSettings getSpaceSharingSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "spaceSharingSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSharingSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomainId() {
        return software.amazon.jsii.Kernel.get(this, "domainId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDomainId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "domainId", java.util.Objects.requireNonNull(value, "domainId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSpaceDisplayName() {
        return software.amazon.jsii.Kernel.get(this, "spaceDisplayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSpaceDisplayName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "spaceDisplayName", java.util.Objects.requireNonNull(value, "spaceDisplayName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSpaceName() {
        return software.amazon.jsii.Kernel.get(this, "spaceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSpaceName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "spaceName", java.util.Objects.requireNonNull(value, "spaceName is required"));
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
     * A fluent builder for {@link imports.aws.sagemaker_space.SagemakerSpace}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.sagemaker_space.SagemakerSpace> {
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
        private final imports.aws.sagemaker_space.SagemakerSpaceConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.sagemaker_space.SagemakerSpaceConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#domain_id SagemakerSpace#domain_id}.
         * <p>
         * @return {@code this}
         * @param domainId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#domain_id SagemakerSpace#domain_id}. This parameter is required.
         */
        public Builder domainId(final java.lang.String domainId) {
            this.config.domainId(domainId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#space_name SagemakerSpace#space_name}.
         * <p>
         * @return {@code this}
         * @param spaceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#space_name SagemakerSpace#space_name}. This parameter is required.
         */
        public Builder spaceName(final java.lang.String spaceName) {
            this.config.spaceName(spaceName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#id SagemakerSpace#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#id SagemakerSpace#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * ownership_settings block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#ownership_settings SagemakerSpace#ownership_settings}
         * <p>
         * @return {@code this}
         * @param ownershipSettings ownership_settings block. This parameter is required.
         */
        public Builder ownershipSettings(final imports.aws.sagemaker_space.SagemakerSpaceOwnershipSettings ownershipSettings) {
            this.config.ownershipSettings(ownershipSettings);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#space_display_name SagemakerSpace#space_display_name}.
         * <p>
         * @return {@code this}
         * @param spaceDisplayName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#space_display_name SagemakerSpace#space_display_name}. This parameter is required.
         */
        public Builder spaceDisplayName(final java.lang.String spaceDisplayName) {
            this.config.spaceDisplayName(spaceDisplayName);
            return this;
        }

        /**
         * space_settings block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#space_settings SagemakerSpace#space_settings}
         * <p>
         * @return {@code this}
         * @param spaceSettings space_settings block. This parameter is required.
         */
        public Builder spaceSettings(final imports.aws.sagemaker_space.SagemakerSpaceSpaceSettings spaceSettings) {
            this.config.spaceSettings(spaceSettings);
            return this;
        }

        /**
         * space_sharing_settings block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#space_sharing_settings SagemakerSpace#space_sharing_settings}
         * <p>
         * @return {@code this}
         * @param spaceSharingSettings space_sharing_settings block. This parameter is required.
         */
        public Builder spaceSharingSettings(final imports.aws.sagemaker_space.SagemakerSpaceSpaceSharingSettings spaceSharingSettings) {
            this.config.spaceSharingSettings(spaceSharingSettings);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#tags SagemakerSpace#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#tags SagemakerSpace#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#tags_all SagemakerSpace#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#tags_all SagemakerSpace#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.sagemaker_space.SagemakerSpace}.
         */
        @Override
        public imports.aws.sagemaker_space.SagemakerSpace build() {
            return new imports.aws.sagemaker_space.SagemakerSpace(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
