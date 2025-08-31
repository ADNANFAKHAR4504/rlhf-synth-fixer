package imports.aws.wafv2_web_acl_logging_configuration;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration aws_wafv2_web_acl_logging_configuration}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.680Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAclLoggingConfiguration.Wafv2WebAclLoggingConfiguration")
public class Wafv2WebAclLoggingConfiguration extends com.hashicorp.cdktf.TerraformResource {

    protected Wafv2WebAclLoggingConfiguration(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Wafv2WebAclLoggingConfiguration(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfiguration.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration aws_wafv2_web_acl_logging_configuration} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Wafv2WebAclLoggingConfiguration(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Wafv2WebAclLoggingConfiguration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Wafv2WebAclLoggingConfiguration to import. This parameter is required.
     * @param importFromId The id of the existing Wafv2WebAclLoggingConfiguration that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Wafv2WebAclLoggingConfiguration to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfiguration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Wafv2WebAclLoggingConfiguration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Wafv2WebAclLoggingConfiguration to import. This parameter is required.
     * @param importFromId The id of the existing Wafv2WebAclLoggingConfiguration that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfiguration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putLoggingFilter(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilter value) {
        software.amazon.jsii.Kernel.call(this, "putLoggingFilter", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRedactedFields(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFields>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFields> __cast_cd4240 = (java.util.List<imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFields>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFields __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRedactedFields", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLoggingFilter() {
        software.amazon.jsii.Kernel.call(this, "resetLoggingFilter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRedactedFields() {
        software.amazon.jsii.Kernel.call(this, "resetRedactedFields", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterOutputReference getLoggingFilter() {
        return software.amazon.jsii.Kernel.get(this, "loggingFilter", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsList getRedactedFields() {
        return software.amazon.jsii.Kernel.get(this, "redactedFields", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFieldsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLogDestinationConfigsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "logDestinationConfigsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilter getLoggingFilterInput() {
        return software.amazon.jsii.Kernel.get(this, "loggingFilterInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilter.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRedactedFieldsInput() {
        return software.amazon.jsii.Kernel.get(this, "redactedFieldsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResourceArnInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getLogDestinationConfigs() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "logDestinationConfigs", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setLogDestinationConfigs(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "logDestinationConfigs", java.util.Objects.requireNonNull(value, "logDestinationConfigs is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResourceArn() {
        return software.amazon.jsii.Kernel.get(this, "resourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setResourceArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "resourceArn", java.util.Objects.requireNonNull(value, "resourceArn is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfiguration}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfiguration> {
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
        private final imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationConfig.Builder();
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
         * AWS Kinesis Firehose Delivery Stream ARNs.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration#log_destination_configs Wafv2WebAclLoggingConfiguration#log_destination_configs}
         * <p>
         * @return {@code this}
         * @param logDestinationConfigs AWS Kinesis Firehose Delivery Stream ARNs. This parameter is required.
         */
        public Builder logDestinationConfigs(final java.util.List<java.lang.String> logDestinationConfigs) {
            this.config.logDestinationConfigs(logDestinationConfigs);
            return this;
        }

        /**
         * AWS WebACL ARN.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration#resource_arn Wafv2WebAclLoggingConfiguration#resource_arn}
         * <p>
         * @return {@code this}
         * @param resourceArn AWS WebACL ARN. This parameter is required.
         */
        public Builder resourceArn(final java.lang.String resourceArn) {
            this.config.resourceArn(resourceArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration#id Wafv2WebAclLoggingConfiguration#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration#id Wafv2WebAclLoggingConfiguration#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * logging_filter block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration#logging_filter Wafv2WebAclLoggingConfiguration#logging_filter}
         * <p>
         * @return {@code this}
         * @param loggingFilter logging_filter block. This parameter is required.
         */
        public Builder loggingFilter(final imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilter loggingFilter) {
            this.config.loggingFilter(loggingFilter);
            return this;
        }

        /**
         * redacted_fields block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration#redacted_fields Wafv2WebAclLoggingConfiguration#redacted_fields}
         * <p>
         * @return {@code this}
         * @param redactedFields redacted_fields block. This parameter is required.
         */
        public Builder redactedFields(final com.hashicorp.cdktf.IResolvable redactedFields) {
            this.config.redactedFields(redactedFields);
            return this;
        }
        /**
         * redacted_fields block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl_logging_configuration#redacted_fields Wafv2WebAclLoggingConfiguration#redacted_fields}
         * <p>
         * @return {@code this}
         * @param redactedFields redacted_fields block. This parameter is required.
         */
        public Builder redactedFields(final java.util.List<? extends imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationRedactedFields> redactedFields) {
            this.config.redactedFields(redactedFields);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfiguration}.
         */
        @Override
        public imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfiguration build() {
            return new imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfiguration(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
