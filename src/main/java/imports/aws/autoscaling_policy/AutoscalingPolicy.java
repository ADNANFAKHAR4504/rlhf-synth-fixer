package imports.aws.autoscaling_policy;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy aws_autoscaling_policy}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.100Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingPolicy.AutoscalingPolicy")
public class AutoscalingPolicy extends com.hashicorp.cdktf.TerraformResource {

    protected AutoscalingPolicy(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AutoscalingPolicy(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.autoscaling_policy.AutoscalingPolicy.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy aws_autoscaling_policy} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public AutoscalingPolicy(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.autoscaling_policy.AutoscalingPolicyConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a AutoscalingPolicy resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AutoscalingPolicy to import. This parameter is required.
     * @param importFromId The id of the existing AutoscalingPolicy that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the AutoscalingPolicy to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.autoscaling_policy.AutoscalingPolicy.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a AutoscalingPolicy resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AutoscalingPolicy to import. This parameter is required.
     * @param importFromId The id of the existing AutoscalingPolicy that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.autoscaling_policy.AutoscalingPolicy.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putPredictiveScalingConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putPredictiveScalingConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putStepAdjustment(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.autoscaling_policy.AutoscalingPolicyStepAdjustment>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.autoscaling_policy.AutoscalingPolicyStepAdjustment> __cast_cd4240 = (java.util.List<imports.aws.autoscaling_policy.AutoscalingPolicyStepAdjustment>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.autoscaling_policy.AutoscalingPolicyStepAdjustment __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putStepAdjustment", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTargetTrackingConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putTargetTrackingConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAdjustmentType() {
        software.amazon.jsii.Kernel.call(this, "resetAdjustmentType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCooldown() {
        software.amazon.jsii.Kernel.call(this, "resetCooldown", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEstimatedInstanceWarmup() {
        software.amazon.jsii.Kernel.call(this, "resetEstimatedInstanceWarmup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMetricAggregationType() {
        software.amazon.jsii.Kernel.call(this, "resetMetricAggregationType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinAdjustmentMagnitude() {
        software.amazon.jsii.Kernel.call(this, "resetMinAdjustmentMagnitude", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPolicyType() {
        software.amazon.jsii.Kernel.call(this, "resetPolicyType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPredictiveScalingConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetPredictiveScalingConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScalingAdjustment() {
        software.amazon.jsii.Kernel.call(this, "resetScalingAdjustment", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStepAdjustment() {
        software.amazon.jsii.Kernel.call(this, "resetStepAdjustment", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetTrackingConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetTargetTrackingConfiguration", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfigurationOutputReference getPredictiveScalingConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "predictiveScalingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_policy.AutoscalingPolicyStepAdjustmentList getStepAdjustment() {
        return software.amazon.jsii.Kernel.get(this, "stepAdjustment", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_policy.AutoscalingPolicyStepAdjustmentList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationOutputReference getTargetTrackingConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "targetTrackingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAdjustmentTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "adjustmentTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAutoscalingGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "autoscalingGroupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getCooldownInput() {
        return software.amazon.jsii.Kernel.get(this, "cooldownInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "enabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getEstimatedInstanceWarmupInput() {
        return software.amazon.jsii.Kernel.get(this, "estimatedInstanceWarmupInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMetricAggregationTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "metricAggregationTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinAdjustmentMagnitudeInput() {
        return software.amazon.jsii.Kernel.get(this, "minAdjustmentMagnitudeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPolicyTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "policyTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfiguration getPredictiveScalingConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "predictiveScalingConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getScalingAdjustmentInput() {
        return software.amazon.jsii.Kernel.get(this, "scalingAdjustmentInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getStepAdjustmentInput() {
        return software.amazon.jsii.Kernel.get(this, "stepAdjustmentInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfiguration getTargetTrackingConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "targetTrackingConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfiguration.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAdjustmentType() {
        return software.amazon.jsii.Kernel.get(this, "adjustmentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAdjustmentType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "adjustmentType", java.util.Objects.requireNonNull(value, "adjustmentType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAutoscalingGroupName() {
        return software.amazon.jsii.Kernel.get(this, "autoscalingGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAutoscalingGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "autoscalingGroupName", java.util.Objects.requireNonNull(value, "autoscalingGroupName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getCooldown() {
        return software.amazon.jsii.Kernel.get(this, "cooldown", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setCooldown(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "cooldown", java.util.Objects.requireNonNull(value, "cooldown is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnabled() {
        return software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getEstimatedInstanceWarmup() {
        return software.amazon.jsii.Kernel.get(this, "estimatedInstanceWarmup", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setEstimatedInstanceWarmup(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "estimatedInstanceWarmup", java.util.Objects.requireNonNull(value, "estimatedInstanceWarmup is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMetricAggregationType() {
        return software.amazon.jsii.Kernel.get(this, "metricAggregationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMetricAggregationType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "metricAggregationType", java.util.Objects.requireNonNull(value, "metricAggregationType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinAdjustmentMagnitude() {
        return software.amazon.jsii.Kernel.get(this, "minAdjustmentMagnitude", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinAdjustmentMagnitude(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minAdjustmentMagnitude", java.util.Objects.requireNonNull(value, "minAdjustmentMagnitude is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPolicyType() {
        return software.amazon.jsii.Kernel.get(this, "policyType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPolicyType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "policyType", java.util.Objects.requireNonNull(value, "policyType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getScalingAdjustment() {
        return software.amazon.jsii.Kernel.get(this, "scalingAdjustment", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setScalingAdjustment(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "scalingAdjustment", java.util.Objects.requireNonNull(value, "scalingAdjustment is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.autoscaling_policy.AutoscalingPolicy}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.autoscaling_policy.AutoscalingPolicy> {
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
        private final imports.aws.autoscaling_policy.AutoscalingPolicyConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.autoscaling_policy.AutoscalingPolicyConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#autoscaling_group_name AutoscalingPolicy#autoscaling_group_name}.
         * <p>
         * @return {@code this}
         * @param autoscalingGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#autoscaling_group_name AutoscalingPolicy#autoscaling_group_name}. This parameter is required.
         */
        public Builder autoscalingGroupName(final java.lang.String autoscalingGroupName) {
            this.config.autoscalingGroupName(autoscalingGroupName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#name AutoscalingPolicy#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#name AutoscalingPolicy#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#adjustment_type AutoscalingPolicy#adjustment_type}.
         * <p>
         * @return {@code this}
         * @param adjustmentType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#adjustment_type AutoscalingPolicy#adjustment_type}. This parameter is required.
         */
        public Builder adjustmentType(final java.lang.String adjustmentType) {
            this.config.adjustmentType(adjustmentType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#cooldown AutoscalingPolicy#cooldown}.
         * <p>
         * @return {@code this}
         * @param cooldown Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#cooldown AutoscalingPolicy#cooldown}. This parameter is required.
         */
        public Builder cooldown(final java.lang.Number cooldown) {
            this.config.cooldown(cooldown);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#enabled AutoscalingPolicy#enabled}.
         * <p>
         * @return {@code this}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#enabled AutoscalingPolicy#enabled}. This parameter is required.
         */
        public Builder enabled(final java.lang.Boolean enabled) {
            this.config.enabled(enabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#enabled AutoscalingPolicy#enabled}.
         * <p>
         * @return {@code this}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#enabled AutoscalingPolicy#enabled}. This parameter is required.
         */
        public Builder enabled(final com.hashicorp.cdktf.IResolvable enabled) {
            this.config.enabled(enabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#estimated_instance_warmup AutoscalingPolicy#estimated_instance_warmup}.
         * <p>
         * @return {@code this}
         * @param estimatedInstanceWarmup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#estimated_instance_warmup AutoscalingPolicy#estimated_instance_warmup}. This parameter is required.
         */
        public Builder estimatedInstanceWarmup(final java.lang.Number estimatedInstanceWarmup) {
            this.config.estimatedInstanceWarmup(estimatedInstanceWarmup);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#id AutoscalingPolicy#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#id AutoscalingPolicy#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#metric_aggregation_type AutoscalingPolicy#metric_aggregation_type}.
         * <p>
         * @return {@code this}
         * @param metricAggregationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#metric_aggregation_type AutoscalingPolicy#metric_aggregation_type}. This parameter is required.
         */
        public Builder metricAggregationType(final java.lang.String metricAggregationType) {
            this.config.metricAggregationType(metricAggregationType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#min_adjustment_magnitude AutoscalingPolicy#min_adjustment_magnitude}.
         * <p>
         * @return {@code this}
         * @param minAdjustmentMagnitude Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#min_adjustment_magnitude AutoscalingPolicy#min_adjustment_magnitude}. This parameter is required.
         */
        public Builder minAdjustmentMagnitude(final java.lang.Number minAdjustmentMagnitude) {
            this.config.minAdjustmentMagnitude(minAdjustmentMagnitude);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#policy_type AutoscalingPolicy#policy_type}.
         * <p>
         * @return {@code this}
         * @param policyType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#policy_type AutoscalingPolicy#policy_type}. This parameter is required.
         */
        public Builder policyType(final java.lang.String policyType) {
            this.config.policyType(policyType);
            return this;
        }

        /**
         * predictive_scaling_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#predictive_scaling_configuration AutoscalingPolicy#predictive_scaling_configuration}
         * <p>
         * @return {@code this}
         * @param predictiveScalingConfiguration predictive_scaling_configuration block. This parameter is required.
         */
        public Builder predictiveScalingConfiguration(final imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfiguration predictiveScalingConfiguration) {
            this.config.predictiveScalingConfiguration(predictiveScalingConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#scaling_adjustment AutoscalingPolicy#scaling_adjustment}.
         * <p>
         * @return {@code this}
         * @param scalingAdjustment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#scaling_adjustment AutoscalingPolicy#scaling_adjustment}. This parameter is required.
         */
        public Builder scalingAdjustment(final java.lang.Number scalingAdjustment) {
            this.config.scalingAdjustment(scalingAdjustment);
            return this;
        }

        /**
         * step_adjustment block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#step_adjustment AutoscalingPolicy#step_adjustment}
         * <p>
         * @return {@code this}
         * @param stepAdjustment step_adjustment block. This parameter is required.
         */
        public Builder stepAdjustment(final com.hashicorp.cdktf.IResolvable stepAdjustment) {
            this.config.stepAdjustment(stepAdjustment);
            return this;
        }
        /**
         * step_adjustment block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#step_adjustment AutoscalingPolicy#step_adjustment}
         * <p>
         * @return {@code this}
         * @param stepAdjustment step_adjustment block. This parameter is required.
         */
        public Builder stepAdjustment(final java.util.List<? extends imports.aws.autoscaling_policy.AutoscalingPolicyStepAdjustment> stepAdjustment) {
            this.config.stepAdjustment(stepAdjustment);
            return this;
        }

        /**
         * target_tracking_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#target_tracking_configuration AutoscalingPolicy#target_tracking_configuration}
         * <p>
         * @return {@code this}
         * @param targetTrackingConfiguration target_tracking_configuration block. This parameter is required.
         */
        public Builder targetTrackingConfiguration(final imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfiguration targetTrackingConfiguration) {
            this.config.targetTrackingConfiguration(targetTrackingConfiguration);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.autoscaling_policy.AutoscalingPolicy}.
         */
        @Override
        public imports.aws.autoscaling_policy.AutoscalingPolicy build() {
            return new imports.aws.autoscaling_policy.AutoscalingPolicy(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
