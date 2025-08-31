package imports.aws.emr_block_public_access_configuration;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_block_public_access_configuration aws_emr_block_public_access_configuration}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.190Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrBlockPublicAccessConfiguration.EmrBlockPublicAccessConfiguration")
public class EmrBlockPublicAccessConfiguration extends com.hashicorp.cdktf.TerraformResource {

    protected EmrBlockPublicAccessConfiguration(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EmrBlockPublicAccessConfiguration(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.emr_block_public_access_configuration.EmrBlockPublicAccessConfiguration.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_block_public_access_configuration aws_emr_block_public_access_configuration} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public EmrBlockPublicAccessConfiguration(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.emr_block_public_access_configuration.EmrBlockPublicAccessConfigurationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a EmrBlockPublicAccessConfiguration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the EmrBlockPublicAccessConfiguration to import. This parameter is required.
     * @param importFromId The id of the existing EmrBlockPublicAccessConfiguration that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the EmrBlockPublicAccessConfiguration to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.emr_block_public_access_configuration.EmrBlockPublicAccessConfiguration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a EmrBlockPublicAccessConfiguration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the EmrBlockPublicAccessConfiguration to import. This parameter is required.
     * @param importFromId The id of the existing EmrBlockPublicAccessConfiguration that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.emr_block_public_access_configuration.EmrBlockPublicAccessConfiguration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putPermittedPublicSecurityGroupRuleRange(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.emr_block_public_access_configuration.EmrBlockPublicAccessConfigurationPermittedPublicSecurityGroupRuleRange>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.emr_block_public_access_configuration.EmrBlockPublicAccessConfigurationPermittedPublicSecurityGroupRuleRange> __cast_cd4240 = (java.util.List<imports.aws.emr_block_public_access_configuration.EmrBlockPublicAccessConfigurationPermittedPublicSecurityGroupRuleRange>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.emr_block_public_access_configuration.EmrBlockPublicAccessConfigurationPermittedPublicSecurityGroupRuleRange __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPermittedPublicSecurityGroupRuleRange", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPermittedPublicSecurityGroupRuleRange() {
        software.amazon.jsii.Kernel.call(this, "resetPermittedPublicSecurityGroupRuleRange", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.emr_block_public_access_configuration.EmrBlockPublicAccessConfigurationPermittedPublicSecurityGroupRuleRangeList getPermittedPublicSecurityGroupRuleRange() {
        return software.amazon.jsii.Kernel.get(this, "permittedPublicSecurityGroupRuleRange", software.amazon.jsii.NativeType.forClass(imports.aws.emr_block_public_access_configuration.EmrBlockPublicAccessConfigurationPermittedPublicSecurityGroupRuleRangeList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBlockPublicSecurityGroupRulesInput() {
        return software.amazon.jsii.Kernel.get(this, "blockPublicSecurityGroupRulesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPermittedPublicSecurityGroupRuleRangeInput() {
        return software.amazon.jsii.Kernel.get(this, "permittedPublicSecurityGroupRuleRangeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getBlockPublicSecurityGroupRules() {
        return software.amazon.jsii.Kernel.get(this, "blockPublicSecurityGroupRules", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setBlockPublicSecurityGroupRules(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "blockPublicSecurityGroupRules", java.util.Objects.requireNonNull(value, "blockPublicSecurityGroupRules is required"));
    }

    public void setBlockPublicSecurityGroupRules(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "blockPublicSecurityGroupRules", java.util.Objects.requireNonNull(value, "blockPublicSecurityGroupRules is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.emr_block_public_access_configuration.EmrBlockPublicAccessConfiguration}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.emr_block_public_access_configuration.EmrBlockPublicAccessConfiguration> {
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
        private final imports.aws.emr_block_public_access_configuration.EmrBlockPublicAccessConfigurationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.emr_block_public_access_configuration.EmrBlockPublicAccessConfigurationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_block_public_access_configuration#block_public_security_group_rules EmrBlockPublicAccessConfiguration#block_public_security_group_rules}.
         * <p>
         * @return {@code this}
         * @param blockPublicSecurityGroupRules Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_block_public_access_configuration#block_public_security_group_rules EmrBlockPublicAccessConfiguration#block_public_security_group_rules}. This parameter is required.
         */
        public Builder blockPublicSecurityGroupRules(final java.lang.Boolean blockPublicSecurityGroupRules) {
            this.config.blockPublicSecurityGroupRules(blockPublicSecurityGroupRules);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_block_public_access_configuration#block_public_security_group_rules EmrBlockPublicAccessConfiguration#block_public_security_group_rules}.
         * <p>
         * @return {@code this}
         * @param blockPublicSecurityGroupRules Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_block_public_access_configuration#block_public_security_group_rules EmrBlockPublicAccessConfiguration#block_public_security_group_rules}. This parameter is required.
         */
        public Builder blockPublicSecurityGroupRules(final com.hashicorp.cdktf.IResolvable blockPublicSecurityGroupRules) {
            this.config.blockPublicSecurityGroupRules(blockPublicSecurityGroupRules);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_block_public_access_configuration#id EmrBlockPublicAccessConfiguration#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_block_public_access_configuration#id EmrBlockPublicAccessConfiguration#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * permitted_public_security_group_rule_range block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_block_public_access_configuration#permitted_public_security_group_rule_range EmrBlockPublicAccessConfiguration#permitted_public_security_group_rule_range}
         * <p>
         * @return {@code this}
         * @param permittedPublicSecurityGroupRuleRange permitted_public_security_group_rule_range block. This parameter is required.
         */
        public Builder permittedPublicSecurityGroupRuleRange(final com.hashicorp.cdktf.IResolvable permittedPublicSecurityGroupRuleRange) {
            this.config.permittedPublicSecurityGroupRuleRange(permittedPublicSecurityGroupRuleRange);
            return this;
        }
        /**
         * permitted_public_security_group_rule_range block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_block_public_access_configuration#permitted_public_security_group_rule_range EmrBlockPublicAccessConfiguration#permitted_public_security_group_rule_range}
         * <p>
         * @return {@code this}
         * @param permittedPublicSecurityGroupRuleRange permitted_public_security_group_rule_range block. This parameter is required.
         */
        public Builder permittedPublicSecurityGroupRuleRange(final java.util.List<? extends imports.aws.emr_block_public_access_configuration.EmrBlockPublicAccessConfigurationPermittedPublicSecurityGroupRuleRange> permittedPublicSecurityGroupRuleRange) {
            this.config.permittedPublicSecurityGroupRuleRange(permittedPublicSecurityGroupRuleRange);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.emr_block_public_access_configuration.EmrBlockPublicAccessConfiguration}.
         */
        @Override
        public imports.aws.emr_block_public_access_configuration.EmrBlockPublicAccessConfiguration build() {
            return new imports.aws.emr_block_public_access_configuration.EmrBlockPublicAccessConfiguration(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
