package imports.aws.prometheus_workspace_configuration;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_workspace_configuration aws_prometheus_workspace_configuration}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.078Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.prometheusWorkspaceConfiguration.PrometheusWorkspaceConfiguration")
public class PrometheusWorkspaceConfiguration extends com.hashicorp.cdktf.TerraformResource {

    protected PrometheusWorkspaceConfiguration(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected PrometheusWorkspaceConfiguration(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfiguration.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_workspace_configuration aws_prometheus_workspace_configuration} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public PrometheusWorkspaceConfiguration(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfigurationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a PrometheusWorkspaceConfiguration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the PrometheusWorkspaceConfiguration to import. This parameter is required.
     * @param importFromId The id of the existing PrometheusWorkspaceConfiguration that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the PrometheusWorkspaceConfiguration to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfiguration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a PrometheusWorkspaceConfiguration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the PrometheusWorkspaceConfiguration to import. This parameter is required.
     * @param importFromId The id of the existing PrometheusWorkspaceConfiguration that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfiguration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putLimitsPerLabelSet(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfigurationLimitsPerLabelSet>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfigurationLimitsPerLabelSet> __cast_cd4240 = (java.util.List<imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfigurationLimitsPerLabelSet>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfigurationLimitsPerLabelSet __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLimitsPerLabelSet", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfigurationTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetLimitsPerLabelSet() {
        software.amazon.jsii.Kernel.call(this, "resetLimitsPerLabelSet", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRetentionPeriodInDays() {
        software.amazon.jsii.Kernel.call(this, "resetRetentionPeriodInDays", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfigurationLimitsPerLabelSetList getLimitsPerLabelSet() {
        return software.amazon.jsii.Kernel.get(this, "limitsPerLabelSet", software.amazon.jsii.NativeType.forClass(imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfigurationLimitsPerLabelSetList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfigurationTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfigurationTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLimitsPerLabelSetInput() {
        return software.amazon.jsii.Kernel.get(this, "limitsPerLabelSetInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRetentionPeriodInDaysInput() {
        return software.amazon.jsii.Kernel.get(this, "retentionPeriodInDaysInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWorkspaceIdInput() {
        return software.amazon.jsii.Kernel.get(this, "workspaceIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRetentionPeriodInDays() {
        return software.amazon.jsii.Kernel.get(this, "retentionPeriodInDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRetentionPeriodInDays(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "retentionPeriodInDays", java.util.Objects.requireNonNull(value, "retentionPeriodInDays is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWorkspaceId() {
        return software.amazon.jsii.Kernel.get(this, "workspaceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWorkspaceId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "workspaceId", java.util.Objects.requireNonNull(value, "workspaceId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfiguration}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfiguration> {
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
        private final imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfigurationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfigurationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_workspace_configuration#workspace_id PrometheusWorkspaceConfiguration#workspace_id}.
         * <p>
         * @return {@code this}
         * @param workspaceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_workspace_configuration#workspace_id PrometheusWorkspaceConfiguration#workspace_id}. This parameter is required.
         */
        public Builder workspaceId(final java.lang.String workspaceId) {
            this.config.workspaceId(workspaceId);
            return this;
        }

        /**
         * limits_per_label_set block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_workspace_configuration#limits_per_label_set PrometheusWorkspaceConfiguration#limits_per_label_set}
         * <p>
         * @return {@code this}
         * @param limitsPerLabelSet limits_per_label_set block. This parameter is required.
         */
        public Builder limitsPerLabelSet(final com.hashicorp.cdktf.IResolvable limitsPerLabelSet) {
            this.config.limitsPerLabelSet(limitsPerLabelSet);
            return this;
        }
        /**
         * limits_per_label_set block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_workspace_configuration#limits_per_label_set PrometheusWorkspaceConfiguration#limits_per_label_set}
         * <p>
         * @return {@code this}
         * @param limitsPerLabelSet limits_per_label_set block. This parameter is required.
         */
        public Builder limitsPerLabelSet(final java.util.List<? extends imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfigurationLimitsPerLabelSet> limitsPerLabelSet) {
            this.config.limitsPerLabelSet(limitsPerLabelSet);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_workspace_configuration#retention_period_in_days PrometheusWorkspaceConfiguration#retention_period_in_days}.
         * <p>
         * @return {@code this}
         * @param retentionPeriodInDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_workspace_configuration#retention_period_in_days PrometheusWorkspaceConfiguration#retention_period_in_days}. This parameter is required.
         */
        public Builder retentionPeriodInDays(final java.lang.Number retentionPeriodInDays) {
            this.config.retentionPeriodInDays(retentionPeriodInDays);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_workspace_configuration#timeouts PrometheusWorkspaceConfiguration#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfigurationTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfiguration}.
         */
        @Override
        public imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfiguration build() {
            return new imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfiguration(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
