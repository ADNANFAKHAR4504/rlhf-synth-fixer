package imports.aws.autoscaling_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.100Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingPolicy.AutoscalingPolicyConfig")
@software.amazon.jsii.Jsii.Proxy(AutoscalingPolicyConfig.Jsii$Proxy.class)
public interface AutoscalingPolicyConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#autoscaling_group_name AutoscalingPolicy#autoscaling_group_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAutoscalingGroupName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#name AutoscalingPolicy#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#adjustment_type AutoscalingPolicy#adjustment_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAdjustmentType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#cooldown AutoscalingPolicy#cooldown}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getCooldown() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#enabled AutoscalingPolicy#enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#estimated_instance_warmup AutoscalingPolicy#estimated_instance_warmup}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getEstimatedInstanceWarmup() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#id AutoscalingPolicy#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#metric_aggregation_type AutoscalingPolicy#metric_aggregation_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMetricAggregationType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#min_adjustment_magnitude AutoscalingPolicy#min_adjustment_magnitude}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinAdjustmentMagnitude() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#policy_type AutoscalingPolicy#policy_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPolicyType() {
        return null;
    }

    /**
     * predictive_scaling_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#predictive_scaling_configuration AutoscalingPolicy#predictive_scaling_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfiguration getPredictiveScalingConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#scaling_adjustment AutoscalingPolicy#scaling_adjustment}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getScalingAdjustment() {
        return null;
    }

    /**
     * step_adjustment block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#step_adjustment AutoscalingPolicy#step_adjustment}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStepAdjustment() {
        return null;
    }

    /**
     * target_tracking_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#target_tracking_configuration AutoscalingPolicy#target_tracking_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfiguration getTargetTrackingConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AutoscalingPolicyConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AutoscalingPolicyConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AutoscalingPolicyConfig> {
        java.lang.String autoscalingGroupName;
        java.lang.String name;
        java.lang.String adjustmentType;
        java.lang.Number cooldown;
        java.lang.Object enabled;
        java.lang.Number estimatedInstanceWarmup;
        java.lang.String id;
        java.lang.String metricAggregationType;
        java.lang.Number minAdjustmentMagnitude;
        java.lang.String policyType;
        imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfiguration predictiveScalingConfiguration;
        java.lang.Number scalingAdjustment;
        java.lang.Object stepAdjustment;
        imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfiguration targetTrackingConfiguration;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link AutoscalingPolicyConfig#getAutoscalingGroupName}
         * @param autoscalingGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#autoscaling_group_name AutoscalingPolicy#autoscaling_group_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder autoscalingGroupName(java.lang.String autoscalingGroupName) {
            this.autoscalingGroupName = autoscalingGroupName;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#name AutoscalingPolicy#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyConfig#getAdjustmentType}
         * @param adjustmentType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#adjustment_type AutoscalingPolicy#adjustment_type}.
         * @return {@code this}
         */
        public Builder adjustmentType(java.lang.String adjustmentType) {
            this.adjustmentType = adjustmentType;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyConfig#getCooldown}
         * @param cooldown Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#cooldown AutoscalingPolicy#cooldown}.
         * @return {@code this}
         */
        public Builder cooldown(java.lang.Number cooldown) {
            this.cooldown = cooldown;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyConfig#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#enabled AutoscalingPolicy#enabled}.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyConfig#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#enabled AutoscalingPolicy#enabled}.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyConfig#getEstimatedInstanceWarmup}
         * @param estimatedInstanceWarmup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#estimated_instance_warmup AutoscalingPolicy#estimated_instance_warmup}.
         * @return {@code this}
         */
        public Builder estimatedInstanceWarmup(java.lang.Number estimatedInstanceWarmup) {
            this.estimatedInstanceWarmup = estimatedInstanceWarmup;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#id AutoscalingPolicy#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyConfig#getMetricAggregationType}
         * @param metricAggregationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#metric_aggregation_type AutoscalingPolicy#metric_aggregation_type}.
         * @return {@code this}
         */
        public Builder metricAggregationType(java.lang.String metricAggregationType) {
            this.metricAggregationType = metricAggregationType;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyConfig#getMinAdjustmentMagnitude}
         * @param minAdjustmentMagnitude Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#min_adjustment_magnitude AutoscalingPolicy#min_adjustment_magnitude}.
         * @return {@code this}
         */
        public Builder minAdjustmentMagnitude(java.lang.Number minAdjustmentMagnitude) {
            this.minAdjustmentMagnitude = minAdjustmentMagnitude;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyConfig#getPolicyType}
         * @param policyType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#policy_type AutoscalingPolicy#policy_type}.
         * @return {@code this}
         */
        public Builder policyType(java.lang.String policyType) {
            this.policyType = policyType;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyConfig#getPredictiveScalingConfiguration}
         * @param predictiveScalingConfiguration predictive_scaling_configuration block.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#predictive_scaling_configuration AutoscalingPolicy#predictive_scaling_configuration}
         * @return {@code this}
         */
        public Builder predictiveScalingConfiguration(imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfiguration predictiveScalingConfiguration) {
            this.predictiveScalingConfiguration = predictiveScalingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyConfig#getScalingAdjustment}
         * @param scalingAdjustment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#scaling_adjustment AutoscalingPolicy#scaling_adjustment}.
         * @return {@code this}
         */
        public Builder scalingAdjustment(java.lang.Number scalingAdjustment) {
            this.scalingAdjustment = scalingAdjustment;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyConfig#getStepAdjustment}
         * @param stepAdjustment step_adjustment block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#step_adjustment AutoscalingPolicy#step_adjustment}
         * @return {@code this}
         */
        public Builder stepAdjustment(com.hashicorp.cdktf.IResolvable stepAdjustment) {
            this.stepAdjustment = stepAdjustment;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyConfig#getStepAdjustment}
         * @param stepAdjustment step_adjustment block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#step_adjustment AutoscalingPolicy#step_adjustment}
         * @return {@code this}
         */
        public Builder stepAdjustment(java.util.List<? extends imports.aws.autoscaling_policy.AutoscalingPolicyStepAdjustment> stepAdjustment) {
            this.stepAdjustment = stepAdjustment;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyConfig#getTargetTrackingConfiguration}
         * @param targetTrackingConfiguration target_tracking_configuration block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_policy#target_tracking_configuration AutoscalingPolicy#target_tracking_configuration}
         * @return {@code this}
         */
        public Builder targetTrackingConfiguration(imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfiguration targetTrackingConfiguration) {
            this.targetTrackingConfiguration = targetTrackingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingPolicyConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AutoscalingPolicyConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AutoscalingPolicyConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AutoscalingPolicyConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AutoscalingPolicyConfig {
        private final java.lang.String autoscalingGroupName;
        private final java.lang.String name;
        private final java.lang.String adjustmentType;
        private final java.lang.Number cooldown;
        private final java.lang.Object enabled;
        private final java.lang.Number estimatedInstanceWarmup;
        private final java.lang.String id;
        private final java.lang.String metricAggregationType;
        private final java.lang.Number minAdjustmentMagnitude;
        private final java.lang.String policyType;
        private final imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfiguration predictiveScalingConfiguration;
        private final java.lang.Number scalingAdjustment;
        private final java.lang.Object stepAdjustment;
        private final imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfiguration targetTrackingConfiguration;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.autoscalingGroupName = software.amazon.jsii.Kernel.get(this, "autoscalingGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.adjustmentType = software.amazon.jsii.Kernel.get(this, "adjustmentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cooldown = software.amazon.jsii.Kernel.get(this, "cooldown", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.estimatedInstanceWarmup = software.amazon.jsii.Kernel.get(this, "estimatedInstanceWarmup", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.metricAggregationType = software.amazon.jsii.Kernel.get(this, "metricAggregationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.minAdjustmentMagnitude = software.amazon.jsii.Kernel.get(this, "minAdjustmentMagnitude", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.policyType = software.amazon.jsii.Kernel.get(this, "policyType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.predictiveScalingConfiguration = software.amazon.jsii.Kernel.get(this, "predictiveScalingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfiguration.class));
            this.scalingAdjustment = software.amazon.jsii.Kernel.get(this, "scalingAdjustment", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.stepAdjustment = software.amazon.jsii.Kernel.get(this, "stepAdjustment", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.targetTrackingConfiguration = software.amazon.jsii.Kernel.get(this, "targetTrackingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfiguration.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.autoscalingGroupName = java.util.Objects.requireNonNull(builder.autoscalingGroupName, "autoscalingGroupName is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.adjustmentType = builder.adjustmentType;
            this.cooldown = builder.cooldown;
            this.enabled = builder.enabled;
            this.estimatedInstanceWarmup = builder.estimatedInstanceWarmup;
            this.id = builder.id;
            this.metricAggregationType = builder.metricAggregationType;
            this.minAdjustmentMagnitude = builder.minAdjustmentMagnitude;
            this.policyType = builder.policyType;
            this.predictiveScalingConfiguration = builder.predictiveScalingConfiguration;
            this.scalingAdjustment = builder.scalingAdjustment;
            this.stepAdjustment = builder.stepAdjustment;
            this.targetTrackingConfiguration = builder.targetTrackingConfiguration;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAutoscalingGroupName() {
            return this.autoscalingGroupName;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getAdjustmentType() {
            return this.adjustmentType;
        }

        @Override
        public final java.lang.Number getCooldown() {
            return this.cooldown;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.Number getEstimatedInstanceWarmup() {
            return this.estimatedInstanceWarmup;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getMetricAggregationType() {
            return this.metricAggregationType;
        }

        @Override
        public final java.lang.Number getMinAdjustmentMagnitude() {
            return this.minAdjustmentMagnitude;
        }

        @Override
        public final java.lang.String getPolicyType() {
            return this.policyType;
        }

        @Override
        public final imports.aws.autoscaling_policy.AutoscalingPolicyPredictiveScalingConfiguration getPredictiveScalingConfiguration() {
            return this.predictiveScalingConfiguration;
        }

        @Override
        public final java.lang.Number getScalingAdjustment() {
            return this.scalingAdjustment;
        }

        @Override
        public final java.lang.Object getStepAdjustment() {
            return this.stepAdjustment;
        }

        @Override
        public final imports.aws.autoscaling_policy.AutoscalingPolicyTargetTrackingConfiguration getTargetTrackingConfiguration() {
            return this.targetTrackingConfiguration;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("autoscalingGroupName", om.valueToTree(this.getAutoscalingGroupName()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getAdjustmentType() != null) {
                data.set("adjustmentType", om.valueToTree(this.getAdjustmentType()));
            }
            if (this.getCooldown() != null) {
                data.set("cooldown", om.valueToTree(this.getCooldown()));
            }
            if (this.getEnabled() != null) {
                data.set("enabled", om.valueToTree(this.getEnabled()));
            }
            if (this.getEstimatedInstanceWarmup() != null) {
                data.set("estimatedInstanceWarmup", om.valueToTree(this.getEstimatedInstanceWarmup()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getMetricAggregationType() != null) {
                data.set("metricAggregationType", om.valueToTree(this.getMetricAggregationType()));
            }
            if (this.getMinAdjustmentMagnitude() != null) {
                data.set("minAdjustmentMagnitude", om.valueToTree(this.getMinAdjustmentMagnitude()));
            }
            if (this.getPolicyType() != null) {
                data.set("policyType", om.valueToTree(this.getPolicyType()));
            }
            if (this.getPredictiveScalingConfiguration() != null) {
                data.set("predictiveScalingConfiguration", om.valueToTree(this.getPredictiveScalingConfiguration()));
            }
            if (this.getScalingAdjustment() != null) {
                data.set("scalingAdjustment", om.valueToTree(this.getScalingAdjustment()));
            }
            if (this.getStepAdjustment() != null) {
                data.set("stepAdjustment", om.valueToTree(this.getStepAdjustment()));
            }
            if (this.getTargetTrackingConfiguration() != null) {
                data.set("targetTrackingConfiguration", om.valueToTree(this.getTargetTrackingConfiguration()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.autoscalingPolicy.AutoscalingPolicyConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AutoscalingPolicyConfig.Jsii$Proxy that = (AutoscalingPolicyConfig.Jsii$Proxy) o;

            if (!autoscalingGroupName.equals(that.autoscalingGroupName)) return false;
            if (!name.equals(that.name)) return false;
            if (this.adjustmentType != null ? !this.adjustmentType.equals(that.adjustmentType) : that.adjustmentType != null) return false;
            if (this.cooldown != null ? !this.cooldown.equals(that.cooldown) : that.cooldown != null) return false;
            if (this.enabled != null ? !this.enabled.equals(that.enabled) : that.enabled != null) return false;
            if (this.estimatedInstanceWarmup != null ? !this.estimatedInstanceWarmup.equals(that.estimatedInstanceWarmup) : that.estimatedInstanceWarmup != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.metricAggregationType != null ? !this.metricAggregationType.equals(that.metricAggregationType) : that.metricAggregationType != null) return false;
            if (this.minAdjustmentMagnitude != null ? !this.minAdjustmentMagnitude.equals(that.minAdjustmentMagnitude) : that.minAdjustmentMagnitude != null) return false;
            if (this.policyType != null ? !this.policyType.equals(that.policyType) : that.policyType != null) return false;
            if (this.predictiveScalingConfiguration != null ? !this.predictiveScalingConfiguration.equals(that.predictiveScalingConfiguration) : that.predictiveScalingConfiguration != null) return false;
            if (this.scalingAdjustment != null ? !this.scalingAdjustment.equals(that.scalingAdjustment) : that.scalingAdjustment != null) return false;
            if (this.stepAdjustment != null ? !this.stepAdjustment.equals(that.stepAdjustment) : that.stepAdjustment != null) return false;
            if (this.targetTrackingConfiguration != null ? !this.targetTrackingConfiguration.equals(that.targetTrackingConfiguration) : that.targetTrackingConfiguration != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.autoscalingGroupName.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.adjustmentType != null ? this.adjustmentType.hashCode() : 0);
            result = 31 * result + (this.cooldown != null ? this.cooldown.hashCode() : 0);
            result = 31 * result + (this.enabled != null ? this.enabled.hashCode() : 0);
            result = 31 * result + (this.estimatedInstanceWarmup != null ? this.estimatedInstanceWarmup.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.metricAggregationType != null ? this.metricAggregationType.hashCode() : 0);
            result = 31 * result + (this.minAdjustmentMagnitude != null ? this.minAdjustmentMagnitude.hashCode() : 0);
            result = 31 * result + (this.policyType != null ? this.policyType.hashCode() : 0);
            result = 31 * result + (this.predictiveScalingConfiguration != null ? this.predictiveScalingConfiguration.hashCode() : 0);
            result = 31 * result + (this.scalingAdjustment != null ? this.scalingAdjustment.hashCode() : 0);
            result = 31 * result + (this.stepAdjustment != null ? this.stepAdjustment.hashCode() : 0);
            result = 31 * result + (this.targetTrackingConfiguration != null ? this.targetTrackingConfiguration.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
