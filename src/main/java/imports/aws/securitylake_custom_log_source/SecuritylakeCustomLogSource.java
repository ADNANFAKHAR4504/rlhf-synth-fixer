package imports.aws.securitylake_custom_log_source;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_custom_log_source aws_securitylake_custom_log_source}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.418Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securitylakeCustomLogSource.SecuritylakeCustomLogSource")
public class SecuritylakeCustomLogSource extends com.hashicorp.cdktf.TerraformResource {

    protected SecuritylakeCustomLogSource(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SecuritylakeCustomLogSource(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSource.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_custom_log_source aws_securitylake_custom_log_source} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public SecuritylakeCustomLogSource(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a SecuritylakeCustomLogSource resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SecuritylakeCustomLogSource to import. This parameter is required.
     * @param importFromId The id of the existing SecuritylakeCustomLogSource that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the SecuritylakeCustomLogSource to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSource.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a SecuritylakeCustomLogSource resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SecuritylakeCustomLogSource to import. This parameter is required.
     * @param importFromId The id of the existing SecuritylakeCustomLogSource that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSource.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceConfiguration> __cast_cd4240 = (java.util.List<imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEventClasses() {
        software.amazon.jsii.Kernel.call(this, "resetEventClasses", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceVersion() {
        software.amazon.jsii.Kernel.call(this, "resetSourceVersion", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceAttributesList getAttributes() {
        return software.amazon.jsii.Kernel.get(this, "attributes", software.amazon.jsii.NativeType.forClass(imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceAttributesList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceConfigurationList getConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "configuration", software.amazon.jsii.NativeType.forClass(imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceProviderDetailsList getProviderDetails() {
        return software.amazon.jsii.Kernel.get(this, "providerDetails", software.amazon.jsii.NativeType.forClass(imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceProviderDetailsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "configurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEventClassesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "eventClassesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceNameInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getEventClasses() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "eventClasses", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setEventClasses(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "eventClasses", java.util.Objects.requireNonNull(value, "eventClasses is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceName() {
        return software.amazon.jsii.Kernel.get(this, "sourceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceName", java.util.Objects.requireNonNull(value, "sourceName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceVersion() {
        return software.amazon.jsii.Kernel.get(this, "sourceVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceVersion", java.util.Objects.requireNonNull(value, "sourceVersion is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSource}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSource> {
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
        private final imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_custom_log_source#source_name SecuritylakeCustomLogSource#source_name}.
         * <p>
         * @return {@code this}
         * @param sourceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_custom_log_source#source_name SecuritylakeCustomLogSource#source_name}. This parameter is required.
         */
        public Builder sourceName(final java.lang.String sourceName) {
            this.config.sourceName(sourceName);
            return this;
        }

        /**
         * configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_custom_log_source#configuration SecuritylakeCustomLogSource#configuration}
         * <p>
         * @return {@code this}
         * @param configuration configuration block. This parameter is required.
         */
        public Builder configuration(final com.hashicorp.cdktf.IResolvable configuration) {
            this.config.configuration(configuration);
            return this;
        }
        /**
         * configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_custom_log_source#configuration SecuritylakeCustomLogSource#configuration}
         * <p>
         * @return {@code this}
         * @param configuration configuration block. This parameter is required.
         */
        public Builder configuration(final java.util.List<? extends imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceConfiguration> configuration) {
            this.config.configuration(configuration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_custom_log_source#event_classes SecuritylakeCustomLogSource#event_classes}.
         * <p>
         * @return {@code this}
         * @param eventClasses Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_custom_log_source#event_classes SecuritylakeCustomLogSource#event_classes}. This parameter is required.
         */
        public Builder eventClasses(final java.util.List<java.lang.String> eventClasses) {
            this.config.eventClasses(eventClasses);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_custom_log_source#source_version SecuritylakeCustomLogSource#source_version}.
         * <p>
         * @return {@code this}
         * @param sourceVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_custom_log_source#source_version SecuritylakeCustomLogSource#source_version}. This parameter is required.
         */
        public Builder sourceVersion(final java.lang.String sourceVersion) {
            this.config.sourceVersion(sourceVersion);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSource}.
         */
        @Override
        public imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSource build() {
            return new imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSource(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
