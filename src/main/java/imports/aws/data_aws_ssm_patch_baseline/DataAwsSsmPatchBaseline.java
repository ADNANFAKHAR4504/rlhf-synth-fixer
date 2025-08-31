package imports.aws.data_aws_ssm_patch_baseline;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ssm_patch_baseline aws_ssm_patch_baseline}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.882Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsSsmPatchBaseline.DataAwsSsmPatchBaseline")
public class DataAwsSsmPatchBaseline extends com.hashicorp.cdktf.TerraformDataSource {

    protected DataAwsSsmPatchBaseline(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsSsmPatchBaseline(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.data_aws_ssm_patch_baseline.DataAwsSsmPatchBaseline.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ssm_patch_baseline aws_ssm_patch_baseline} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DataAwsSsmPatchBaseline(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.data_aws_ssm_patch_baseline.DataAwsSsmPatchBaselineConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DataAwsSsmPatchBaseline resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsSsmPatchBaseline to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsSsmPatchBaseline that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DataAwsSsmPatchBaseline to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_ssm_patch_baseline.DataAwsSsmPatchBaseline.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DataAwsSsmPatchBaseline resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsSsmPatchBaseline to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsSsmPatchBaseline that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_ssm_patch_baseline.DataAwsSsmPatchBaseline.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetDefaultBaseline() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultBaseline", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNamePrefix() {
        software.amazon.jsii.Kernel.call(this, "resetNamePrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOperatingSystem() {
        software.amazon.jsii.Kernel.call(this, "resetOperatingSystem", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ssm_patch_baseline.DataAwsSsmPatchBaselineApprovalRuleList getApprovalRule() {
        return software.amazon.jsii.Kernel.get(this, "approvalRule", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ssm_patch_baseline.DataAwsSsmPatchBaselineApprovalRuleList.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getApprovedPatches() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "approvedPatches", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApprovedPatchesComplianceLevel() {
        return software.amazon.jsii.Kernel.get(this, "approvedPatchesComplianceLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getApprovedPatchesEnableNonSecurity() {
        return software.amazon.jsii.Kernel.get(this, "approvedPatchesEnableNonSecurity", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ssm_patch_baseline.DataAwsSsmPatchBaselineGlobalFilterList getGlobalFilter() {
        return software.amazon.jsii.Kernel.get(this, "globalFilter", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ssm_patch_baseline.DataAwsSsmPatchBaselineGlobalFilterList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getJson() {
        return software.amazon.jsii.Kernel.get(this, "json", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getRejectedPatches() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "rejectedPatches", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRejectedPatchesAction() {
        return software.amazon.jsii.Kernel.get(this, "rejectedPatchesAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ssm_patch_baseline.DataAwsSsmPatchBaselineSourceList getSource() {
        return software.amazon.jsii.Kernel.get(this, "source", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ssm_patch_baseline.DataAwsSsmPatchBaselineSourceList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDefaultBaselineInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultBaselineInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNamePrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "namePrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOperatingSystemInput() {
        return software.amazon.jsii.Kernel.get(this, "operatingSystemInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOwnerInput() {
        return software.amazon.jsii.Kernel.get(this, "ownerInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDefaultBaseline() {
        return software.amazon.jsii.Kernel.get(this, "defaultBaseline", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDefaultBaseline(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "defaultBaseline", java.util.Objects.requireNonNull(value, "defaultBaseline is required"));
    }

    public void setDefaultBaseline(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "defaultBaseline", java.util.Objects.requireNonNull(value, "defaultBaseline is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNamePrefix() {
        return software.amazon.jsii.Kernel.get(this, "namePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNamePrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "namePrefix", java.util.Objects.requireNonNull(value, "namePrefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOperatingSystem() {
        return software.amazon.jsii.Kernel.get(this, "operatingSystem", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOperatingSystem(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "operatingSystem", java.util.Objects.requireNonNull(value, "operatingSystem is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOwner() {
        return software.amazon.jsii.Kernel.get(this, "owner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOwner(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "owner", java.util.Objects.requireNonNull(value, "owner is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.data_aws_ssm_patch_baseline.DataAwsSsmPatchBaseline}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.data_aws_ssm_patch_baseline.DataAwsSsmPatchBaseline> {
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
        private final imports.aws.data_aws_ssm_patch_baseline.DataAwsSsmPatchBaselineConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.data_aws_ssm_patch_baseline.DataAwsSsmPatchBaselineConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ssm_patch_baseline#owner DataAwsSsmPatchBaseline#owner}.
         * <p>
         * @return {@code this}
         * @param owner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ssm_patch_baseline#owner DataAwsSsmPatchBaseline#owner}. This parameter is required.
         */
        public Builder owner(final java.lang.String owner) {
            this.config.owner(owner);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ssm_patch_baseline#default_baseline DataAwsSsmPatchBaseline#default_baseline}.
         * <p>
         * @return {@code this}
         * @param defaultBaseline Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ssm_patch_baseline#default_baseline DataAwsSsmPatchBaseline#default_baseline}. This parameter is required.
         */
        public Builder defaultBaseline(final java.lang.Boolean defaultBaseline) {
            this.config.defaultBaseline(defaultBaseline);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ssm_patch_baseline#default_baseline DataAwsSsmPatchBaseline#default_baseline}.
         * <p>
         * @return {@code this}
         * @param defaultBaseline Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ssm_patch_baseline#default_baseline DataAwsSsmPatchBaseline#default_baseline}. This parameter is required.
         */
        public Builder defaultBaseline(final com.hashicorp.cdktf.IResolvable defaultBaseline) {
            this.config.defaultBaseline(defaultBaseline);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ssm_patch_baseline#id DataAwsSsmPatchBaseline#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ssm_patch_baseline#id DataAwsSsmPatchBaseline#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ssm_patch_baseline#name_prefix DataAwsSsmPatchBaseline#name_prefix}.
         * <p>
         * @return {@code this}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ssm_patch_baseline#name_prefix DataAwsSsmPatchBaseline#name_prefix}. This parameter is required.
         */
        public Builder namePrefix(final java.lang.String namePrefix) {
            this.config.namePrefix(namePrefix);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ssm_patch_baseline#operating_system DataAwsSsmPatchBaseline#operating_system}.
         * <p>
         * @return {@code this}
         * @param operatingSystem Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ssm_patch_baseline#operating_system DataAwsSsmPatchBaseline#operating_system}. This parameter is required.
         */
        public Builder operatingSystem(final java.lang.String operatingSystem) {
            this.config.operatingSystem(operatingSystem);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.data_aws_ssm_patch_baseline.DataAwsSsmPatchBaseline}.
         */
        @Override
        public imports.aws.data_aws_ssm_patch_baseline.DataAwsSsmPatchBaseline build() {
            return new imports.aws.data_aws_ssm_patch_baseline.DataAwsSsmPatchBaseline(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
