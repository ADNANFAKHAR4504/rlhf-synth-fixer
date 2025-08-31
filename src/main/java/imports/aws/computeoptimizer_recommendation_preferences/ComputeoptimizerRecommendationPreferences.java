package imports.aws.computeoptimizer_recommendation_preferences;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences aws_computeoptimizer_recommendation_preferences}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.367Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.computeoptimizerRecommendationPreferences.ComputeoptimizerRecommendationPreferences")
public class ComputeoptimizerRecommendationPreferences extends com.hashicorp.cdktf.TerraformResource {

    protected ComputeoptimizerRecommendationPreferences(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ComputeoptimizerRecommendationPreferences(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferences.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences aws_computeoptimizer_recommendation_preferences} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public ComputeoptimizerRecommendationPreferences(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a ComputeoptimizerRecommendationPreferences resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ComputeoptimizerRecommendationPreferences to import. This parameter is required.
     * @param importFromId The id of the existing ComputeoptimizerRecommendationPreferences that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the ComputeoptimizerRecommendationPreferences to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferences.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a ComputeoptimizerRecommendationPreferences resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ComputeoptimizerRecommendationPreferences to import. This parameter is required.
     * @param importFromId The id of the existing ComputeoptimizerRecommendationPreferences that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferences.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putExternalMetricsPreference(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesExternalMetricsPreference>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesExternalMetricsPreference> __cast_cd4240 = (java.util.List<imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesExternalMetricsPreference>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesExternalMetricsPreference __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putExternalMetricsPreference", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPreferredResource(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesPreferredResource>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesPreferredResource> __cast_cd4240 = (java.util.List<imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesPreferredResource>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesPreferredResource __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPreferredResource", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putScope(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesScope>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesScope> __cast_cd4240 = (java.util.List<imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesScope>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesScope __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putScope", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putUtilizationPreference(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesUtilizationPreference>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesUtilizationPreference> __cast_cd4240 = (java.util.List<imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesUtilizationPreference>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesUtilizationPreference __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putUtilizationPreference", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetEnhancedInfrastructureMetrics() {
        software.amazon.jsii.Kernel.call(this, "resetEnhancedInfrastructureMetrics", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExternalMetricsPreference() {
        software.amazon.jsii.Kernel.call(this, "resetExternalMetricsPreference", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInferredWorkloadTypes() {
        software.amazon.jsii.Kernel.call(this, "resetInferredWorkloadTypes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLookBackPeriod() {
        software.amazon.jsii.Kernel.call(this, "resetLookBackPeriod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreferredResource() {
        software.amazon.jsii.Kernel.call(this, "resetPreferredResource", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSavingsEstimationMode() {
        software.amazon.jsii.Kernel.call(this, "resetSavingsEstimationMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScope() {
        software.amazon.jsii.Kernel.call(this, "resetScope", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUtilizationPreference() {
        software.amazon.jsii.Kernel.call(this, "resetUtilizationPreference", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesExternalMetricsPreferenceList getExternalMetricsPreference() {
        return software.amazon.jsii.Kernel.get(this, "externalMetricsPreference", software.amazon.jsii.NativeType.forClass(imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesExternalMetricsPreferenceList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesPreferredResourceList getPreferredResource() {
        return software.amazon.jsii.Kernel.get(this, "preferredResource", software.amazon.jsii.NativeType.forClass(imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesPreferredResourceList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesScopeList getScope() {
        return software.amazon.jsii.Kernel.get(this, "scope", software.amazon.jsii.NativeType.forClass(imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesScopeList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesUtilizationPreferenceList getUtilizationPreference() {
        return software.amazon.jsii.Kernel.get(this, "utilizationPreference", software.amazon.jsii.NativeType.forClass(imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesUtilizationPreferenceList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEnhancedInfrastructureMetricsInput() {
        return software.amazon.jsii.Kernel.get(this, "enhancedInfrastructureMetricsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getExternalMetricsPreferenceInput() {
        return software.amazon.jsii.Kernel.get(this, "externalMetricsPreferenceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInferredWorkloadTypesInput() {
        return software.amazon.jsii.Kernel.get(this, "inferredWorkloadTypesInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLookBackPeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "lookBackPeriodInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPreferredResourceInput() {
        return software.amazon.jsii.Kernel.get(this, "preferredResourceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResourceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSavingsEstimationModeInput() {
        return software.amazon.jsii.Kernel.get(this, "savingsEstimationModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getScopeInput() {
        return software.amazon.jsii.Kernel.get(this, "scopeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUtilizationPreferenceInput() {
        return software.amazon.jsii.Kernel.get(this, "utilizationPreferenceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEnhancedInfrastructureMetrics() {
        return software.amazon.jsii.Kernel.get(this, "enhancedInfrastructureMetrics", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEnhancedInfrastructureMetrics(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "enhancedInfrastructureMetrics", java.util.Objects.requireNonNull(value, "enhancedInfrastructureMetrics is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInferredWorkloadTypes() {
        return software.amazon.jsii.Kernel.get(this, "inferredWorkloadTypes", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInferredWorkloadTypes(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "inferredWorkloadTypes", java.util.Objects.requireNonNull(value, "inferredWorkloadTypes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLookBackPeriod() {
        return software.amazon.jsii.Kernel.get(this, "lookBackPeriod", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLookBackPeriod(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lookBackPeriod", java.util.Objects.requireNonNull(value, "lookBackPeriod is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResourceType() {
        return software.amazon.jsii.Kernel.get(this, "resourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setResourceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "resourceType", java.util.Objects.requireNonNull(value, "resourceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSavingsEstimationMode() {
        return software.amazon.jsii.Kernel.get(this, "savingsEstimationMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSavingsEstimationMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "savingsEstimationMode", java.util.Objects.requireNonNull(value, "savingsEstimationMode is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferences}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferences> {
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
        private final imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#resource_type ComputeoptimizerRecommendationPreferences#resource_type}.
         * <p>
         * @return {@code this}
         * @param resourceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#resource_type ComputeoptimizerRecommendationPreferences#resource_type}. This parameter is required.
         */
        public Builder resourceType(final java.lang.String resourceType) {
            this.config.resourceType(resourceType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#enhanced_infrastructure_metrics ComputeoptimizerRecommendationPreferences#enhanced_infrastructure_metrics}.
         * <p>
         * @return {@code this}
         * @param enhancedInfrastructureMetrics Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#enhanced_infrastructure_metrics ComputeoptimizerRecommendationPreferences#enhanced_infrastructure_metrics}. This parameter is required.
         */
        public Builder enhancedInfrastructureMetrics(final java.lang.String enhancedInfrastructureMetrics) {
            this.config.enhancedInfrastructureMetrics(enhancedInfrastructureMetrics);
            return this;
        }

        /**
         * external_metrics_preference block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#external_metrics_preference ComputeoptimizerRecommendationPreferences#external_metrics_preference}
         * <p>
         * @return {@code this}
         * @param externalMetricsPreference external_metrics_preference block. This parameter is required.
         */
        public Builder externalMetricsPreference(final com.hashicorp.cdktf.IResolvable externalMetricsPreference) {
            this.config.externalMetricsPreference(externalMetricsPreference);
            return this;
        }
        /**
         * external_metrics_preference block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#external_metrics_preference ComputeoptimizerRecommendationPreferences#external_metrics_preference}
         * <p>
         * @return {@code this}
         * @param externalMetricsPreference external_metrics_preference block. This parameter is required.
         */
        public Builder externalMetricsPreference(final java.util.List<? extends imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesExternalMetricsPreference> externalMetricsPreference) {
            this.config.externalMetricsPreference(externalMetricsPreference);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#inferred_workload_types ComputeoptimizerRecommendationPreferences#inferred_workload_types}.
         * <p>
         * @return {@code this}
         * @param inferredWorkloadTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#inferred_workload_types ComputeoptimizerRecommendationPreferences#inferred_workload_types}. This parameter is required.
         */
        public Builder inferredWorkloadTypes(final java.lang.String inferredWorkloadTypes) {
            this.config.inferredWorkloadTypes(inferredWorkloadTypes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#look_back_period ComputeoptimizerRecommendationPreferences#look_back_period}.
         * <p>
         * @return {@code this}
         * @param lookBackPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#look_back_period ComputeoptimizerRecommendationPreferences#look_back_period}. This parameter is required.
         */
        public Builder lookBackPeriod(final java.lang.String lookBackPeriod) {
            this.config.lookBackPeriod(lookBackPeriod);
            return this;
        }

        /**
         * preferred_resource block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#preferred_resource ComputeoptimizerRecommendationPreferences#preferred_resource}
         * <p>
         * @return {@code this}
         * @param preferredResource preferred_resource block. This parameter is required.
         */
        public Builder preferredResource(final com.hashicorp.cdktf.IResolvable preferredResource) {
            this.config.preferredResource(preferredResource);
            return this;
        }
        /**
         * preferred_resource block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#preferred_resource ComputeoptimizerRecommendationPreferences#preferred_resource}
         * <p>
         * @return {@code this}
         * @param preferredResource preferred_resource block. This parameter is required.
         */
        public Builder preferredResource(final java.util.List<? extends imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesPreferredResource> preferredResource) {
            this.config.preferredResource(preferredResource);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#savings_estimation_mode ComputeoptimizerRecommendationPreferences#savings_estimation_mode}.
         * <p>
         * @return {@code this}
         * @param savingsEstimationMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#savings_estimation_mode ComputeoptimizerRecommendationPreferences#savings_estimation_mode}. This parameter is required.
         */
        public Builder savingsEstimationMode(final java.lang.String savingsEstimationMode) {
            this.config.savingsEstimationMode(savingsEstimationMode);
            return this;
        }

        /**
         * scope block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#scope ComputeoptimizerRecommendationPreferences#scope}
         * <p>
         * @return {@code this}
         * @param scope scope block. This parameter is required.
         */
        public Builder scope(final com.hashicorp.cdktf.IResolvable scope) {
            this.config.scope(scope);
            return this;
        }
        /**
         * scope block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#scope ComputeoptimizerRecommendationPreferences#scope}
         * <p>
         * @return {@code this}
         * @param scope scope block. This parameter is required.
         */
        public Builder scope(final java.util.List<? extends imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesScope> scope) {
            this.config.scope(scope);
            return this;
        }

        /**
         * utilization_preference block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#utilization_preference ComputeoptimizerRecommendationPreferences#utilization_preference}
         * <p>
         * @return {@code this}
         * @param utilizationPreference utilization_preference block. This parameter is required.
         */
        public Builder utilizationPreference(final com.hashicorp.cdktf.IResolvable utilizationPreference) {
            this.config.utilizationPreference(utilizationPreference);
            return this;
        }
        /**
         * utilization_preference block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#utilization_preference ComputeoptimizerRecommendationPreferences#utilization_preference}
         * <p>
         * @return {@code this}
         * @param utilizationPreference utilization_preference block. This parameter is required.
         */
        public Builder utilizationPreference(final java.util.List<? extends imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesUtilizationPreference> utilizationPreference) {
            this.config.utilizationPreference(utilizationPreference);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferences}.
         */
        @Override
        public imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferences build() {
            return new imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferences(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
