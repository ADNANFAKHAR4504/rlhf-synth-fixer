package imports.aws.computeoptimizer_recommendation_preferences;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.368Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.computeoptimizerRecommendationPreferences.ComputeoptimizerRecommendationPreferencesUtilizationPreferenceOutputReference")
public class ComputeoptimizerRecommendationPreferencesUtilizationPreferenceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ComputeoptimizerRecommendationPreferencesUtilizationPreferenceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ComputeoptimizerRecommendationPreferencesUtilizationPreferenceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public ComputeoptimizerRecommendationPreferencesUtilizationPreferenceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putMetricParameters(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesUtilizationPreferenceMetricParameters>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesUtilizationPreferenceMetricParameters> __cast_cd4240 = (java.util.List<imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesUtilizationPreferenceMetricParameters>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesUtilizationPreferenceMetricParameters __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putMetricParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetMetricParameters() {
        software.amazon.jsii.Kernel.call(this, "resetMetricParameters", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesUtilizationPreferenceMetricParametersList getMetricParameters() {
        return software.amazon.jsii.Kernel.get(this, "metricParameters", software.amazon.jsii.NativeType.forClass(imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesUtilizationPreferenceMetricParametersList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMetricNameInput() {
        return software.amazon.jsii.Kernel.get(this, "metricNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMetricParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "metricParametersInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMetricName() {
        return software.amazon.jsii.Kernel.get(this, "metricName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMetricName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "metricName", java.util.Objects.requireNonNull(value, "metricName is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesUtilizationPreference value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
