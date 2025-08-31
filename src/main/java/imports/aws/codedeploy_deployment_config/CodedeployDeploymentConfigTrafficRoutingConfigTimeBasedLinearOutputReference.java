package imports.aws.codedeploy_deployment_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.318Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codedeployDeploymentConfig.CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinearOutputReference")
public class CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinearOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinearOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinearOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinearOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetInterval() {
        software.amazon.jsii.Kernel.call(this, "resetInterval", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPercentage() {
        software.amazon.jsii.Kernel.call(this, "resetPercentage", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "intervalInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPercentageInput() {
        return software.amazon.jsii.Kernel.get(this, "percentageInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getInterval() {
        return software.amazon.jsii.Kernel.get(this, "interval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setInterval(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "interval", java.util.Objects.requireNonNull(value, "interval is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPercentage() {
        return software.amazon.jsii.Kernel.get(this, "percentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPercentage(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "percentage", java.util.Objects.requireNonNull(value, "percentage is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinear getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinear.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinear value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
