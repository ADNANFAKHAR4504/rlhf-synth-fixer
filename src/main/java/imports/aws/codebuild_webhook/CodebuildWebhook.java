package imports.aws.codebuild_webhook;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook aws_codebuild_webhook}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.307Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildWebhook.CodebuildWebhook")
public class CodebuildWebhook extends com.hashicorp.cdktf.TerraformResource {

    protected CodebuildWebhook(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodebuildWebhook(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.codebuild_webhook.CodebuildWebhook.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook aws_codebuild_webhook} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public CodebuildWebhook(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.codebuild_webhook.CodebuildWebhookConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a CodebuildWebhook resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CodebuildWebhook to import. This parameter is required.
     * @param importFromId The id of the existing CodebuildWebhook that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the CodebuildWebhook to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.codebuild_webhook.CodebuildWebhook.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a CodebuildWebhook resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CodebuildWebhook to import. This parameter is required.
     * @param importFromId The id of the existing CodebuildWebhook that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.codebuild_webhook.CodebuildWebhook.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putFilterGroup(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.codebuild_webhook.CodebuildWebhookFilterGroup>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.codebuild_webhook.CodebuildWebhookFilterGroup> __cast_cd4240 = (java.util.List<imports.aws.codebuild_webhook.CodebuildWebhookFilterGroup>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.codebuild_webhook.CodebuildWebhookFilterGroup __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFilterGroup", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putScopeConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.codebuild_webhook.CodebuildWebhookScopeConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putScopeConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBranchFilter() {
        software.amazon.jsii.Kernel.call(this, "resetBranchFilter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBuildType() {
        software.amazon.jsii.Kernel.call(this, "resetBuildType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFilterGroup() {
        software.amazon.jsii.Kernel.call(this, "resetFilterGroup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetManualCreation() {
        software.amazon.jsii.Kernel.call(this, "resetManualCreation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScopeConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetScopeConfiguration", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.codebuild_webhook.CodebuildWebhookFilterGroupList getFilterGroup() {
        return software.amazon.jsii.Kernel.get(this, "filterGroup", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_webhook.CodebuildWebhookFilterGroupList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPayloadUrl() {
        return software.amazon.jsii.Kernel.get(this, "payloadUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codebuild_webhook.CodebuildWebhookScopeConfigurationOutputReference getScopeConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "scopeConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_webhook.CodebuildWebhookScopeConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecret() {
        return software.amazon.jsii.Kernel.get(this, "secret", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUrl() {
        return software.amazon.jsii.Kernel.get(this, "url", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBranchFilterInput() {
        return software.amazon.jsii.Kernel.get(this, "branchFilterInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBuildTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "buildTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFilterGroupInput() {
        return software.amazon.jsii.Kernel.get(this, "filterGroupInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getManualCreationInput() {
        return software.amazon.jsii.Kernel.get(this, "manualCreationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProjectNameInput() {
        return software.amazon.jsii.Kernel.get(this, "projectNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codebuild_webhook.CodebuildWebhookScopeConfiguration getScopeConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "scopeConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_webhook.CodebuildWebhookScopeConfiguration.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBranchFilter() {
        return software.amazon.jsii.Kernel.get(this, "branchFilter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBranchFilter(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "branchFilter", java.util.Objects.requireNonNull(value, "branchFilter is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBuildType() {
        return software.amazon.jsii.Kernel.get(this, "buildType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBuildType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "buildType", java.util.Objects.requireNonNull(value, "buildType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getManualCreation() {
        return software.amazon.jsii.Kernel.get(this, "manualCreation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setManualCreation(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "manualCreation", java.util.Objects.requireNonNull(value, "manualCreation is required"));
    }

    public void setManualCreation(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "manualCreation", java.util.Objects.requireNonNull(value, "manualCreation is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProjectName() {
        return software.amazon.jsii.Kernel.get(this, "projectName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProjectName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "projectName", java.util.Objects.requireNonNull(value, "projectName is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.codebuild_webhook.CodebuildWebhook}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.codebuild_webhook.CodebuildWebhook> {
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
        private final imports.aws.codebuild_webhook.CodebuildWebhookConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.codebuild_webhook.CodebuildWebhookConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#project_name CodebuildWebhook#project_name}.
         * <p>
         * @return {@code this}
         * @param projectName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#project_name CodebuildWebhook#project_name}. This parameter is required.
         */
        public Builder projectName(final java.lang.String projectName) {
            this.config.projectName(projectName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#branch_filter CodebuildWebhook#branch_filter}.
         * <p>
         * @return {@code this}
         * @param branchFilter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#branch_filter CodebuildWebhook#branch_filter}. This parameter is required.
         */
        public Builder branchFilter(final java.lang.String branchFilter) {
            this.config.branchFilter(branchFilter);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#build_type CodebuildWebhook#build_type}.
         * <p>
         * @return {@code this}
         * @param buildType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#build_type CodebuildWebhook#build_type}. This parameter is required.
         */
        public Builder buildType(final java.lang.String buildType) {
            this.config.buildType(buildType);
            return this;
        }

        /**
         * filter_group block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#filter_group CodebuildWebhook#filter_group}
         * <p>
         * @return {@code this}
         * @param filterGroup filter_group block. This parameter is required.
         */
        public Builder filterGroup(final com.hashicorp.cdktf.IResolvable filterGroup) {
            this.config.filterGroup(filterGroup);
            return this;
        }
        /**
         * filter_group block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#filter_group CodebuildWebhook#filter_group}
         * <p>
         * @return {@code this}
         * @param filterGroup filter_group block. This parameter is required.
         */
        public Builder filterGroup(final java.util.List<? extends imports.aws.codebuild_webhook.CodebuildWebhookFilterGroup> filterGroup) {
            this.config.filterGroup(filterGroup);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#id CodebuildWebhook#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#id CodebuildWebhook#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#manual_creation CodebuildWebhook#manual_creation}.
         * <p>
         * @return {@code this}
         * @param manualCreation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#manual_creation CodebuildWebhook#manual_creation}. This parameter is required.
         */
        public Builder manualCreation(final java.lang.Boolean manualCreation) {
            this.config.manualCreation(manualCreation);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#manual_creation CodebuildWebhook#manual_creation}.
         * <p>
         * @return {@code this}
         * @param manualCreation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#manual_creation CodebuildWebhook#manual_creation}. This parameter is required.
         */
        public Builder manualCreation(final com.hashicorp.cdktf.IResolvable manualCreation) {
            this.config.manualCreation(manualCreation);
            return this;
        }

        /**
         * scope_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_webhook#scope_configuration CodebuildWebhook#scope_configuration}
         * <p>
         * @return {@code this}
         * @param scopeConfiguration scope_configuration block. This parameter is required.
         */
        public Builder scopeConfiguration(final imports.aws.codebuild_webhook.CodebuildWebhookScopeConfiguration scopeConfiguration) {
            this.config.scopeConfiguration(scopeConfiguration);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.codebuild_webhook.CodebuildWebhook}.
         */
        @Override
        public imports.aws.codebuild_webhook.CodebuildWebhook build() {
            return new imports.aws.codebuild_webhook.CodebuildWebhook(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
