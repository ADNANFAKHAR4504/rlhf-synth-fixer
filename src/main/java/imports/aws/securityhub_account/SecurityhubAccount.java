package imports.aws.securityhub_account;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_account aws_securityhub_account}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.369Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securityhubAccount.SecurityhubAccount")
public class SecurityhubAccount extends com.hashicorp.cdktf.TerraformResource {

    protected SecurityhubAccount(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SecurityhubAccount(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.securityhub_account.SecurityhubAccount.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_account aws_securityhub_account} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public SecurityhubAccount(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.securityhub_account.SecurityhubAccountConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_account aws_securityhub_account} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public SecurityhubAccount(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a SecurityhubAccount resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SecurityhubAccount to import. This parameter is required.
     * @param importFromId The id of the existing SecurityhubAccount that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the SecurityhubAccount to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.securityhub_account.SecurityhubAccount.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a SecurityhubAccount resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SecurityhubAccount to import. This parameter is required.
     * @param importFromId The id of the existing SecurityhubAccount that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.securityhub_account.SecurityhubAccount.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetAutoEnableControls() {
        software.amazon.jsii.Kernel.call(this, "resetAutoEnableControls", software.amazon.jsii.NativeType.VOID);
    }

    public void resetControlFindingGenerator() {
        software.amazon.jsii.Kernel.call(this, "resetControlFindingGenerator", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableDefaultStandards() {
        software.amazon.jsii.Kernel.call(this, "resetEnableDefaultStandards", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAutoEnableControlsInput() {
        return software.amazon.jsii.Kernel.get(this, "autoEnableControlsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getControlFindingGeneratorInput() {
        return software.amazon.jsii.Kernel.get(this, "controlFindingGeneratorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableDefaultStandardsInput() {
        return software.amazon.jsii.Kernel.get(this, "enableDefaultStandardsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAutoEnableControls() {
        return software.amazon.jsii.Kernel.get(this, "autoEnableControls", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAutoEnableControls(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "autoEnableControls", java.util.Objects.requireNonNull(value, "autoEnableControls is required"));
    }

    public void setAutoEnableControls(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "autoEnableControls", java.util.Objects.requireNonNull(value, "autoEnableControls is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getControlFindingGenerator() {
        return software.amazon.jsii.Kernel.get(this, "controlFindingGenerator", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setControlFindingGenerator(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "controlFindingGenerator", java.util.Objects.requireNonNull(value, "controlFindingGenerator is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableDefaultStandards() {
        return software.amazon.jsii.Kernel.get(this, "enableDefaultStandards", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableDefaultStandards(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableDefaultStandards", java.util.Objects.requireNonNull(value, "enableDefaultStandards is required"));
    }

    public void setEnableDefaultStandards(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableDefaultStandards", java.util.Objects.requireNonNull(value, "enableDefaultStandards is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.securityhub_account.SecurityhubAccount}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.securityhub_account.SecurityhubAccount> {
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
        private imports.aws.securityhub_account.SecurityhubAccountConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config().count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config().count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config().dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config().forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config().lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config().provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config().provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_account#auto_enable_controls SecurityhubAccount#auto_enable_controls}.
         * <p>
         * @return {@code this}
         * @param autoEnableControls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_account#auto_enable_controls SecurityhubAccount#auto_enable_controls}. This parameter is required.
         */
        public Builder autoEnableControls(final java.lang.Boolean autoEnableControls) {
            this.config().autoEnableControls(autoEnableControls);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_account#auto_enable_controls SecurityhubAccount#auto_enable_controls}.
         * <p>
         * @return {@code this}
         * @param autoEnableControls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_account#auto_enable_controls SecurityhubAccount#auto_enable_controls}. This parameter is required.
         */
        public Builder autoEnableControls(final com.hashicorp.cdktf.IResolvable autoEnableControls) {
            this.config().autoEnableControls(autoEnableControls);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_account#control_finding_generator SecurityhubAccount#control_finding_generator}.
         * <p>
         * @return {@code this}
         * @param controlFindingGenerator Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_account#control_finding_generator SecurityhubAccount#control_finding_generator}. This parameter is required.
         */
        public Builder controlFindingGenerator(final java.lang.String controlFindingGenerator) {
            this.config().controlFindingGenerator(controlFindingGenerator);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_account#enable_default_standards SecurityhubAccount#enable_default_standards}.
         * <p>
         * @return {@code this}
         * @param enableDefaultStandards Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_account#enable_default_standards SecurityhubAccount#enable_default_standards}. This parameter is required.
         */
        public Builder enableDefaultStandards(final java.lang.Boolean enableDefaultStandards) {
            this.config().enableDefaultStandards(enableDefaultStandards);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_account#enable_default_standards SecurityhubAccount#enable_default_standards}.
         * <p>
         * @return {@code this}
         * @param enableDefaultStandards Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_account#enable_default_standards SecurityhubAccount#enable_default_standards}. This parameter is required.
         */
        public Builder enableDefaultStandards(final com.hashicorp.cdktf.IResolvable enableDefaultStandards) {
            this.config().enableDefaultStandards(enableDefaultStandards);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_account#id SecurityhubAccount#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_account#id SecurityhubAccount#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.securityhub_account.SecurityhubAccount}.
         */
        @Override
        public imports.aws.securityhub_account.SecurityhubAccount build() {
            return new imports.aws.securityhub_account.SecurityhubAccount(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.securityhub_account.SecurityhubAccountConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.securityhub_account.SecurityhubAccountConfig.Builder();
            }
            return this.config;
        }
    }
}
