package imports.aws.sagemaker_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.319Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerEndpoint.SagemakerEndpointDeploymentConfigOutputReference")
public class SagemakerEndpointDeploymentConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerEndpointDeploymentConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerEndpointDeploymentConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerEndpointDeploymentConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAutoRollbackConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigAutoRollbackConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putAutoRollbackConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putBlueGreenUpdatePolicy(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicy value) {
        software.amazon.jsii.Kernel.call(this, "putBlueGreenUpdatePolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRollingUpdatePolicy(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicy value) {
        software.amazon.jsii.Kernel.call(this, "putRollingUpdatePolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAutoRollbackConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetAutoRollbackConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBlueGreenUpdatePolicy() {
        software.amazon.jsii.Kernel.call(this, "resetBlueGreenUpdatePolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRollingUpdatePolicy() {
        software.amazon.jsii.Kernel.call(this, "resetRollingUpdatePolicy", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigAutoRollbackConfigurationOutputReference getAutoRollbackConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "autoRollbackConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigAutoRollbackConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyOutputReference getBlueGreenUpdatePolicy() {
        return software.amazon.jsii.Kernel.get(this, "blueGreenUpdatePolicy", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicyOutputReference getRollingUpdatePolicy() {
        return software.amazon.jsii.Kernel.get(this, "rollingUpdatePolicy", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigAutoRollbackConfiguration getAutoRollbackConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "autoRollbackConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigAutoRollbackConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicy getBlueGreenUpdatePolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "blueGreenUpdatePolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicy.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicy getRollingUpdatePolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "rollingUpdatePolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicy.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
