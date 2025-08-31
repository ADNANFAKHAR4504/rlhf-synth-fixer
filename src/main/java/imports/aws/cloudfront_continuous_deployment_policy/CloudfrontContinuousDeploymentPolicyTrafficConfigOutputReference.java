package imports.aws.cloudfront_continuous_deployment_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.229Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontContinuousDeploymentPolicy.CloudfrontContinuousDeploymentPolicyTrafficConfigOutputReference")
public class CloudfrontContinuousDeploymentPolicyTrafficConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudfrontContinuousDeploymentPolicyTrafficConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudfrontContinuousDeploymentPolicyTrafficConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public CloudfrontContinuousDeploymentPolicyTrafficConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putSingleHeaderConfig(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.cloudfront_continuous_deployment_policy.CloudfrontContinuousDeploymentPolicyTrafficConfigSingleHeaderConfig>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.cloudfront_continuous_deployment_policy.CloudfrontContinuousDeploymentPolicyTrafficConfigSingleHeaderConfig> __cast_cd4240 = (java.util.List<imports.aws.cloudfront_continuous_deployment_policy.CloudfrontContinuousDeploymentPolicyTrafficConfigSingleHeaderConfig>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.cloudfront_continuous_deployment_policy.CloudfrontContinuousDeploymentPolicyTrafficConfigSingleHeaderConfig __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSingleHeaderConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSingleWeightConfig(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.cloudfront_continuous_deployment_policy.CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfig>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.cloudfront_continuous_deployment_policy.CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfig> __cast_cd4240 = (java.util.List<imports.aws.cloudfront_continuous_deployment_policy.CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfig>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.cloudfront_continuous_deployment_policy.CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfig __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSingleWeightConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetSingleHeaderConfig() {
        software.amazon.jsii.Kernel.call(this, "resetSingleHeaderConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSingleWeightConfig() {
        software.amazon.jsii.Kernel.call(this, "resetSingleWeightConfig", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_continuous_deployment_policy.CloudfrontContinuousDeploymentPolicyTrafficConfigSingleHeaderConfigList getSingleHeaderConfig() {
        return software.amazon.jsii.Kernel.get(this, "singleHeaderConfig", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_continuous_deployment_policy.CloudfrontContinuousDeploymentPolicyTrafficConfigSingleHeaderConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_continuous_deployment_policy.CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfigList getSingleWeightConfig() {
        return software.amazon.jsii.Kernel.get(this, "singleWeightConfig", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_continuous_deployment_policy.CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfigList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSingleHeaderConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "singleHeaderConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSingleWeightConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "singleWeightConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudfront_continuous_deployment_policy.CloudfrontContinuousDeploymentPolicyTrafficConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
