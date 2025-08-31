package imports.aws.cloudfront_continuous_deployment_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.229Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontContinuousDeploymentPolicy.CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfigSessionStickinessConfigOutputReference")
public class CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfigSessionStickinessConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfigSessionStickinessConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfigSessionStickinessConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfigSessionStickinessConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIdleTtlInput() {
        return software.amazon.jsii.Kernel.get(this, "idleTtlInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaximumTtlInput() {
        return software.amazon.jsii.Kernel.get(this, "maximumTtlInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIdleTtl() {
        return software.amazon.jsii.Kernel.get(this, "idleTtl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setIdleTtl(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "idleTtl", java.util.Objects.requireNonNull(value, "idleTtl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaximumTtl() {
        return software.amazon.jsii.Kernel.get(this, "maximumTtl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaximumTtl(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maximumTtl", java.util.Objects.requireNonNull(value, "maximumTtl is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudfront_continuous_deployment_policy.CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfigSessionStickinessConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
