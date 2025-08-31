package imports.aws.computeoptimizer_recommendation_preferences;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.367Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.computeoptimizerRecommendationPreferences.ComputeoptimizerRecommendationPreferencesConfig")
@software.amazon.jsii.Jsii.Proxy(ComputeoptimizerRecommendationPreferencesConfig.Jsii$Proxy.class)
public interface ComputeoptimizerRecommendationPreferencesConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#resource_type ComputeoptimizerRecommendationPreferences#resource_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getResourceType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#enhanced_infrastructure_metrics ComputeoptimizerRecommendationPreferences#enhanced_infrastructure_metrics}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEnhancedInfrastructureMetrics() {
        return null;
    }

    /**
     * external_metrics_preference block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#external_metrics_preference ComputeoptimizerRecommendationPreferences#external_metrics_preference}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getExternalMetricsPreference() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#inferred_workload_types ComputeoptimizerRecommendationPreferences#inferred_workload_types}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInferredWorkloadTypes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#look_back_period ComputeoptimizerRecommendationPreferences#look_back_period}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLookBackPeriod() {
        return null;
    }

    /**
     * preferred_resource block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#preferred_resource ComputeoptimizerRecommendationPreferences#preferred_resource}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPreferredResource() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#savings_estimation_mode ComputeoptimizerRecommendationPreferences#savings_estimation_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSavingsEstimationMode() {
        return null;
    }

    /**
     * scope block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#scope ComputeoptimizerRecommendationPreferences#scope}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getScope() {
        return null;
    }

    /**
     * utilization_preference block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#utilization_preference ComputeoptimizerRecommendationPreferences#utilization_preference}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUtilizationPreference() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ComputeoptimizerRecommendationPreferencesConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ComputeoptimizerRecommendationPreferencesConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ComputeoptimizerRecommendationPreferencesConfig> {
        java.lang.String resourceType;
        java.lang.String enhancedInfrastructureMetrics;
        java.lang.Object externalMetricsPreference;
        java.lang.String inferredWorkloadTypes;
        java.lang.String lookBackPeriod;
        java.lang.Object preferredResource;
        java.lang.String savingsEstimationMode;
        java.lang.Object scope;
        java.lang.Object utilizationPreference;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesConfig#getResourceType}
         * @param resourceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#resource_type ComputeoptimizerRecommendationPreferences#resource_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder resourceType(java.lang.String resourceType) {
            this.resourceType = resourceType;
            return this;
        }

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesConfig#getEnhancedInfrastructureMetrics}
         * @param enhancedInfrastructureMetrics Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#enhanced_infrastructure_metrics ComputeoptimizerRecommendationPreferences#enhanced_infrastructure_metrics}.
         * @return {@code this}
         */
        public Builder enhancedInfrastructureMetrics(java.lang.String enhancedInfrastructureMetrics) {
            this.enhancedInfrastructureMetrics = enhancedInfrastructureMetrics;
            return this;
        }

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesConfig#getExternalMetricsPreference}
         * @param externalMetricsPreference external_metrics_preference block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#external_metrics_preference ComputeoptimizerRecommendationPreferences#external_metrics_preference}
         * @return {@code this}
         */
        public Builder externalMetricsPreference(com.hashicorp.cdktf.IResolvable externalMetricsPreference) {
            this.externalMetricsPreference = externalMetricsPreference;
            return this;
        }

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesConfig#getExternalMetricsPreference}
         * @param externalMetricsPreference external_metrics_preference block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#external_metrics_preference ComputeoptimizerRecommendationPreferences#external_metrics_preference}
         * @return {@code this}
         */
        public Builder externalMetricsPreference(java.util.List<? extends imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesExternalMetricsPreference> externalMetricsPreference) {
            this.externalMetricsPreference = externalMetricsPreference;
            return this;
        }

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesConfig#getInferredWorkloadTypes}
         * @param inferredWorkloadTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#inferred_workload_types ComputeoptimizerRecommendationPreferences#inferred_workload_types}.
         * @return {@code this}
         */
        public Builder inferredWorkloadTypes(java.lang.String inferredWorkloadTypes) {
            this.inferredWorkloadTypes = inferredWorkloadTypes;
            return this;
        }

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesConfig#getLookBackPeriod}
         * @param lookBackPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#look_back_period ComputeoptimizerRecommendationPreferences#look_back_period}.
         * @return {@code this}
         */
        public Builder lookBackPeriod(java.lang.String lookBackPeriod) {
            this.lookBackPeriod = lookBackPeriod;
            return this;
        }

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesConfig#getPreferredResource}
         * @param preferredResource preferred_resource block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#preferred_resource ComputeoptimizerRecommendationPreferences#preferred_resource}
         * @return {@code this}
         */
        public Builder preferredResource(com.hashicorp.cdktf.IResolvable preferredResource) {
            this.preferredResource = preferredResource;
            return this;
        }

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesConfig#getPreferredResource}
         * @param preferredResource preferred_resource block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#preferred_resource ComputeoptimizerRecommendationPreferences#preferred_resource}
         * @return {@code this}
         */
        public Builder preferredResource(java.util.List<? extends imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesPreferredResource> preferredResource) {
            this.preferredResource = preferredResource;
            return this;
        }

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesConfig#getSavingsEstimationMode}
         * @param savingsEstimationMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#savings_estimation_mode ComputeoptimizerRecommendationPreferences#savings_estimation_mode}.
         * @return {@code this}
         */
        public Builder savingsEstimationMode(java.lang.String savingsEstimationMode) {
            this.savingsEstimationMode = savingsEstimationMode;
            return this;
        }

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesConfig#getScope}
         * @param scope scope block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#scope ComputeoptimizerRecommendationPreferences#scope}
         * @return {@code this}
         */
        public Builder scope(com.hashicorp.cdktf.IResolvable scope) {
            this.scope = scope;
            return this;
        }

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesConfig#getScope}
         * @param scope scope block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#scope ComputeoptimizerRecommendationPreferences#scope}
         * @return {@code this}
         */
        public Builder scope(java.util.List<? extends imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesScope> scope) {
            this.scope = scope;
            return this;
        }

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesConfig#getUtilizationPreference}
         * @param utilizationPreference utilization_preference block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#utilization_preference ComputeoptimizerRecommendationPreferences#utilization_preference}
         * @return {@code this}
         */
        public Builder utilizationPreference(com.hashicorp.cdktf.IResolvable utilizationPreference) {
            this.utilizationPreference = utilizationPreference;
            return this;
        }

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesConfig#getUtilizationPreference}
         * @param utilizationPreference utilization_preference block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#utilization_preference ComputeoptimizerRecommendationPreferences#utilization_preference}
         * @return {@code this}
         */
        public Builder utilizationPreference(java.util.List<? extends imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesUtilizationPreference> utilizationPreference) {
            this.utilizationPreference = utilizationPreference;
            return this;
        }

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesConfig#getDependsOn}
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
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesConfig#getProvisioners}
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
         * @return a new instance of {@link ComputeoptimizerRecommendationPreferencesConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ComputeoptimizerRecommendationPreferencesConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ComputeoptimizerRecommendationPreferencesConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ComputeoptimizerRecommendationPreferencesConfig {
        private final java.lang.String resourceType;
        private final java.lang.String enhancedInfrastructureMetrics;
        private final java.lang.Object externalMetricsPreference;
        private final java.lang.String inferredWorkloadTypes;
        private final java.lang.String lookBackPeriod;
        private final java.lang.Object preferredResource;
        private final java.lang.String savingsEstimationMode;
        private final java.lang.Object scope;
        private final java.lang.Object utilizationPreference;
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
            this.resourceType = software.amazon.jsii.Kernel.get(this, "resourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enhancedInfrastructureMetrics = software.amazon.jsii.Kernel.get(this, "enhancedInfrastructureMetrics", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.externalMetricsPreference = software.amazon.jsii.Kernel.get(this, "externalMetricsPreference", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.inferredWorkloadTypes = software.amazon.jsii.Kernel.get(this, "inferredWorkloadTypes", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lookBackPeriod = software.amazon.jsii.Kernel.get(this, "lookBackPeriod", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.preferredResource = software.amazon.jsii.Kernel.get(this, "preferredResource", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.savingsEstimationMode = software.amazon.jsii.Kernel.get(this, "savingsEstimationMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.scope = software.amazon.jsii.Kernel.get(this, "scope", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.utilizationPreference = software.amazon.jsii.Kernel.get(this, "utilizationPreference", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.resourceType = java.util.Objects.requireNonNull(builder.resourceType, "resourceType is required");
            this.enhancedInfrastructureMetrics = builder.enhancedInfrastructureMetrics;
            this.externalMetricsPreference = builder.externalMetricsPreference;
            this.inferredWorkloadTypes = builder.inferredWorkloadTypes;
            this.lookBackPeriod = builder.lookBackPeriod;
            this.preferredResource = builder.preferredResource;
            this.savingsEstimationMode = builder.savingsEstimationMode;
            this.scope = builder.scope;
            this.utilizationPreference = builder.utilizationPreference;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getResourceType() {
            return this.resourceType;
        }

        @Override
        public final java.lang.String getEnhancedInfrastructureMetrics() {
            return this.enhancedInfrastructureMetrics;
        }

        @Override
        public final java.lang.Object getExternalMetricsPreference() {
            return this.externalMetricsPreference;
        }

        @Override
        public final java.lang.String getInferredWorkloadTypes() {
            return this.inferredWorkloadTypes;
        }

        @Override
        public final java.lang.String getLookBackPeriod() {
            return this.lookBackPeriod;
        }

        @Override
        public final java.lang.Object getPreferredResource() {
            return this.preferredResource;
        }

        @Override
        public final java.lang.String getSavingsEstimationMode() {
            return this.savingsEstimationMode;
        }

        @Override
        public final java.lang.Object getScope() {
            return this.scope;
        }

        @Override
        public final java.lang.Object getUtilizationPreference() {
            return this.utilizationPreference;
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

            data.set("resourceType", om.valueToTree(this.getResourceType()));
            if (this.getEnhancedInfrastructureMetrics() != null) {
                data.set("enhancedInfrastructureMetrics", om.valueToTree(this.getEnhancedInfrastructureMetrics()));
            }
            if (this.getExternalMetricsPreference() != null) {
                data.set("externalMetricsPreference", om.valueToTree(this.getExternalMetricsPreference()));
            }
            if (this.getInferredWorkloadTypes() != null) {
                data.set("inferredWorkloadTypes", om.valueToTree(this.getInferredWorkloadTypes()));
            }
            if (this.getLookBackPeriod() != null) {
                data.set("lookBackPeriod", om.valueToTree(this.getLookBackPeriod()));
            }
            if (this.getPreferredResource() != null) {
                data.set("preferredResource", om.valueToTree(this.getPreferredResource()));
            }
            if (this.getSavingsEstimationMode() != null) {
                data.set("savingsEstimationMode", om.valueToTree(this.getSavingsEstimationMode()));
            }
            if (this.getScope() != null) {
                data.set("scope", om.valueToTree(this.getScope()));
            }
            if (this.getUtilizationPreference() != null) {
                data.set("utilizationPreference", om.valueToTree(this.getUtilizationPreference()));
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
            struct.set("fqn", om.valueToTree("aws.computeoptimizerRecommendationPreferences.ComputeoptimizerRecommendationPreferencesConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ComputeoptimizerRecommendationPreferencesConfig.Jsii$Proxy that = (ComputeoptimizerRecommendationPreferencesConfig.Jsii$Proxy) o;

            if (!resourceType.equals(that.resourceType)) return false;
            if (this.enhancedInfrastructureMetrics != null ? !this.enhancedInfrastructureMetrics.equals(that.enhancedInfrastructureMetrics) : that.enhancedInfrastructureMetrics != null) return false;
            if (this.externalMetricsPreference != null ? !this.externalMetricsPreference.equals(that.externalMetricsPreference) : that.externalMetricsPreference != null) return false;
            if (this.inferredWorkloadTypes != null ? !this.inferredWorkloadTypes.equals(that.inferredWorkloadTypes) : that.inferredWorkloadTypes != null) return false;
            if (this.lookBackPeriod != null ? !this.lookBackPeriod.equals(that.lookBackPeriod) : that.lookBackPeriod != null) return false;
            if (this.preferredResource != null ? !this.preferredResource.equals(that.preferredResource) : that.preferredResource != null) return false;
            if (this.savingsEstimationMode != null ? !this.savingsEstimationMode.equals(that.savingsEstimationMode) : that.savingsEstimationMode != null) return false;
            if (this.scope != null ? !this.scope.equals(that.scope) : that.scope != null) return false;
            if (this.utilizationPreference != null ? !this.utilizationPreference.equals(that.utilizationPreference) : that.utilizationPreference != null) return false;
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
            int result = this.resourceType.hashCode();
            result = 31 * result + (this.enhancedInfrastructureMetrics != null ? this.enhancedInfrastructureMetrics.hashCode() : 0);
            result = 31 * result + (this.externalMetricsPreference != null ? this.externalMetricsPreference.hashCode() : 0);
            result = 31 * result + (this.inferredWorkloadTypes != null ? this.inferredWorkloadTypes.hashCode() : 0);
            result = 31 * result + (this.lookBackPeriod != null ? this.lookBackPeriod.hashCode() : 0);
            result = 31 * result + (this.preferredResource != null ? this.preferredResource.hashCode() : 0);
            result = 31 * result + (this.savingsEstimationMode != null ? this.savingsEstimationMode.hashCode() : 0);
            result = 31 * result + (this.scope != null ? this.scope.hashCode() : 0);
            result = 31 * result + (this.utilizationPreference != null ? this.utilizationPreference.hashCode() : 0);
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
