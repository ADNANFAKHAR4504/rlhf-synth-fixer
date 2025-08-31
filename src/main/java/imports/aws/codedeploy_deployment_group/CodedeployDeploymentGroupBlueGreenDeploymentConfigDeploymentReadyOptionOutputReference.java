package imports.aws.codedeploy_deployment_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.320Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codedeployDeploymentGroup.CodedeployDeploymentGroupBlueGreenDeploymentConfigDeploymentReadyOptionOutputReference")
public class CodedeployDeploymentGroupBlueGreenDeploymentConfigDeploymentReadyOptionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodedeployDeploymentGroupBlueGreenDeploymentConfigDeploymentReadyOptionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodedeployDeploymentGroupBlueGreenDeploymentConfigDeploymentReadyOptionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CodedeployDeploymentGroupBlueGreenDeploymentConfigDeploymentReadyOptionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetActionOnTimeout() {
        software.amazon.jsii.Kernel.call(this, "resetActionOnTimeout", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWaitTimeInMinutes() {
        software.amazon.jsii.Kernel.call(this, "resetWaitTimeInMinutes", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getActionOnTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "actionOnTimeoutInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getWaitTimeInMinutesInput() {
        return software.amazon.jsii.Kernel.get(this, "waitTimeInMinutesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getActionOnTimeout() {
        return software.amazon.jsii.Kernel.get(this, "actionOnTimeout", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setActionOnTimeout(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "actionOnTimeout", java.util.Objects.requireNonNull(value, "actionOnTimeout is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getWaitTimeInMinutes() {
        return software.amazon.jsii.Kernel.get(this, "waitTimeInMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setWaitTimeInMinutes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "waitTimeInMinutes", java.util.Objects.requireNonNull(value, "waitTimeInMinutes is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigDeploymentReadyOption getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigDeploymentReadyOption.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigDeploymentReadyOption value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
