package imports.aws.sesv2_account_vdm_attributes;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes aws_sesv2_account_vdm_attributes}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.455Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2AccountVdmAttributes.Sesv2AccountVdmAttributes")
public class Sesv2AccountVdmAttributes extends com.hashicorp.cdktf.TerraformResource {

    protected Sesv2AccountVdmAttributes(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Sesv2AccountVdmAttributes(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.sesv2_account_vdm_attributes.Sesv2AccountVdmAttributes.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes aws_sesv2_account_vdm_attributes} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Sesv2AccountVdmAttributes(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.sesv2_account_vdm_attributes.Sesv2AccountVdmAttributesConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Sesv2AccountVdmAttributes resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Sesv2AccountVdmAttributes to import. This parameter is required.
     * @param importFromId The id of the existing Sesv2AccountVdmAttributes that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Sesv2AccountVdmAttributes to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.sesv2_account_vdm_attributes.Sesv2AccountVdmAttributes.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Sesv2AccountVdmAttributes resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Sesv2AccountVdmAttributes to import. This parameter is required.
     * @param importFromId The id of the existing Sesv2AccountVdmAttributes that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.sesv2_account_vdm_attributes.Sesv2AccountVdmAttributes.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putDashboardAttributes(final @org.jetbrains.annotations.NotNull imports.aws.sesv2_account_vdm_attributes.Sesv2AccountVdmAttributesDashboardAttributes value) {
        software.amazon.jsii.Kernel.call(this, "putDashboardAttributes", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putGuardianAttributes(final @org.jetbrains.annotations.NotNull imports.aws.sesv2_account_vdm_attributes.Sesv2AccountVdmAttributesGuardianAttributes value) {
        software.amazon.jsii.Kernel.call(this, "putGuardianAttributes", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDashboardAttributes() {
        software.amazon.jsii.Kernel.call(this, "resetDashboardAttributes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGuardianAttributes() {
        software.amazon.jsii.Kernel.call(this, "resetGuardianAttributes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.sesv2_account_vdm_attributes.Sesv2AccountVdmAttributesDashboardAttributesOutputReference getDashboardAttributes() {
        return software.amazon.jsii.Kernel.get(this, "dashboardAttributes", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_account_vdm_attributes.Sesv2AccountVdmAttributesDashboardAttributesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sesv2_account_vdm_attributes.Sesv2AccountVdmAttributesGuardianAttributesOutputReference getGuardianAttributes() {
        return software.amazon.jsii.Kernel.get(this, "guardianAttributes", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_account_vdm_attributes.Sesv2AccountVdmAttributesGuardianAttributesOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sesv2_account_vdm_attributes.Sesv2AccountVdmAttributesDashboardAttributes getDashboardAttributesInput() {
        return software.amazon.jsii.Kernel.get(this, "dashboardAttributesInput", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_account_vdm_attributes.Sesv2AccountVdmAttributesDashboardAttributes.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sesv2_account_vdm_attributes.Sesv2AccountVdmAttributesGuardianAttributes getGuardianAttributesInput() {
        return software.amazon.jsii.Kernel.get(this, "guardianAttributesInput", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_account_vdm_attributes.Sesv2AccountVdmAttributesGuardianAttributes.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVdmEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "vdmEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVdmEnabled() {
        return software.amazon.jsii.Kernel.get(this, "vdmEnabled", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVdmEnabled(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "vdmEnabled", java.util.Objects.requireNonNull(value, "vdmEnabled is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.sesv2_account_vdm_attributes.Sesv2AccountVdmAttributes}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.sesv2_account_vdm_attributes.Sesv2AccountVdmAttributes> {
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
        private final imports.aws.sesv2_account_vdm_attributes.Sesv2AccountVdmAttributesConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.sesv2_account_vdm_attributes.Sesv2AccountVdmAttributesConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes#vdm_enabled Sesv2AccountVdmAttributes#vdm_enabled}.
         * <p>
         * @return {@code this}
         * @param vdmEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes#vdm_enabled Sesv2AccountVdmAttributes#vdm_enabled}. This parameter is required.
         */
        public Builder vdmEnabled(final java.lang.String vdmEnabled) {
            this.config.vdmEnabled(vdmEnabled);
            return this;
        }

        /**
         * dashboard_attributes block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes#dashboard_attributes Sesv2AccountVdmAttributes#dashboard_attributes}
         * <p>
         * @return {@code this}
         * @param dashboardAttributes dashboard_attributes block. This parameter is required.
         */
        public Builder dashboardAttributes(final imports.aws.sesv2_account_vdm_attributes.Sesv2AccountVdmAttributesDashboardAttributes dashboardAttributes) {
            this.config.dashboardAttributes(dashboardAttributes);
            return this;
        }

        /**
         * guardian_attributes block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes#guardian_attributes Sesv2AccountVdmAttributes#guardian_attributes}
         * <p>
         * @return {@code this}
         * @param guardianAttributes guardian_attributes block. This parameter is required.
         */
        public Builder guardianAttributes(final imports.aws.sesv2_account_vdm_attributes.Sesv2AccountVdmAttributesGuardianAttributes guardianAttributes) {
            this.config.guardianAttributes(guardianAttributes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes#id Sesv2AccountVdmAttributes#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes#id Sesv2AccountVdmAttributes#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.sesv2_account_vdm_attributes.Sesv2AccountVdmAttributes}.
         */
        @Override
        public imports.aws.sesv2_account_vdm_attributes.Sesv2AccountVdmAttributes build() {
            return new imports.aws.sesv2_account_vdm_attributes.Sesv2AccountVdmAttributes(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
