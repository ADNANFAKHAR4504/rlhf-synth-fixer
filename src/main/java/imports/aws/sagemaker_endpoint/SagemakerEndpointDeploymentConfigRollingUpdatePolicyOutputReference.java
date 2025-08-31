package imports.aws.sagemaker_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.320Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerEndpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicyOutputReference")
public class SagemakerEndpointDeploymentConfigRollingUpdatePolicyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerEndpointDeploymentConfigRollingUpdatePolicyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerEndpointDeploymentConfigRollingUpdatePolicyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerEndpointDeploymentConfigRollingUpdatePolicyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putMaximumBatchSize(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicyMaximumBatchSize value) {
        software.amazon.jsii.Kernel.call(this, "putMaximumBatchSize", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRollbackMaximumBatchSize(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicyRollbackMaximumBatchSize value) {
        software.amazon.jsii.Kernel.call(this, "putRollbackMaximumBatchSize", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetMaximumExecutionTimeoutInSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetMaximumExecutionTimeoutInSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRollbackMaximumBatchSize() {
        software.amazon.jsii.Kernel.call(this, "resetRollbackMaximumBatchSize", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicyMaximumBatchSizeOutputReference getMaximumBatchSize() {
        return software.amazon.jsii.Kernel.get(this, "maximumBatchSize", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicyMaximumBatchSizeOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicyRollbackMaximumBatchSizeOutputReference getRollbackMaximumBatchSize() {
        return software.amazon.jsii.Kernel.get(this, "rollbackMaximumBatchSize", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicyRollbackMaximumBatchSizeOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicyMaximumBatchSize getMaximumBatchSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "maximumBatchSizeInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicyMaximumBatchSize.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaximumExecutionTimeoutInSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "maximumExecutionTimeoutInSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicyRollbackMaximumBatchSize getRollbackMaximumBatchSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "rollbackMaximumBatchSizeInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicyRollbackMaximumBatchSize.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getWaitIntervalInSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "waitIntervalInSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaximumExecutionTimeoutInSeconds() {
        return software.amazon.jsii.Kernel.get(this, "maximumExecutionTimeoutInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaximumExecutionTimeoutInSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maximumExecutionTimeoutInSeconds", java.util.Objects.requireNonNull(value, "maximumExecutionTimeoutInSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getWaitIntervalInSeconds() {
        return software.amazon.jsii.Kernel.get(this, "waitIntervalInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setWaitIntervalInSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "waitIntervalInSeconds", java.util.Objects.requireNonNull(value, "waitIntervalInSeconds is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicy getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicy.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicy value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
