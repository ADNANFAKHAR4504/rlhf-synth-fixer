package imports.aws.codedeploy_deployment_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.320Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codedeployDeploymentGroup.CodedeployDeploymentGroupBlueGreenDeploymentConfigOutputReference")
public class CodedeployDeploymentGroupBlueGreenDeploymentConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodedeployDeploymentGroupBlueGreenDeploymentConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodedeployDeploymentGroupBlueGreenDeploymentConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CodedeployDeploymentGroupBlueGreenDeploymentConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDeploymentReadyOption(final @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigDeploymentReadyOption value) {
        software.amazon.jsii.Kernel.call(this, "putDeploymentReadyOption", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putGreenFleetProvisioningOption(final @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigGreenFleetProvisioningOption value) {
        software.amazon.jsii.Kernel.call(this, "putGreenFleetProvisioningOption", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTerminateBlueInstancesOnDeploymentSuccess(final @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigTerminateBlueInstancesOnDeploymentSuccess value) {
        software.amazon.jsii.Kernel.call(this, "putTerminateBlueInstancesOnDeploymentSuccess", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDeploymentReadyOption() {
        software.amazon.jsii.Kernel.call(this, "resetDeploymentReadyOption", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGreenFleetProvisioningOption() {
        software.amazon.jsii.Kernel.call(this, "resetGreenFleetProvisioningOption", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTerminateBlueInstancesOnDeploymentSuccess() {
        software.amazon.jsii.Kernel.call(this, "resetTerminateBlueInstancesOnDeploymentSuccess", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigDeploymentReadyOptionOutputReference getDeploymentReadyOption() {
        return software.amazon.jsii.Kernel.get(this, "deploymentReadyOption", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigDeploymentReadyOptionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigGreenFleetProvisioningOptionOutputReference getGreenFleetProvisioningOption() {
        return software.amazon.jsii.Kernel.get(this, "greenFleetProvisioningOption", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigGreenFleetProvisioningOptionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigTerminateBlueInstancesOnDeploymentSuccessOutputReference getTerminateBlueInstancesOnDeploymentSuccess() {
        return software.amazon.jsii.Kernel.get(this, "terminateBlueInstancesOnDeploymentSuccess", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigTerminateBlueInstancesOnDeploymentSuccessOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigDeploymentReadyOption getDeploymentReadyOptionInput() {
        return software.amazon.jsii.Kernel.get(this, "deploymentReadyOptionInput", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigDeploymentReadyOption.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigGreenFleetProvisioningOption getGreenFleetProvisioningOptionInput() {
        return software.amazon.jsii.Kernel.get(this, "greenFleetProvisioningOptionInput", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigGreenFleetProvisioningOption.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigTerminateBlueInstancesOnDeploymentSuccess getTerminateBlueInstancesOnDeploymentSuccessInput() {
        return software.amazon.jsii.Kernel.get(this, "terminateBlueInstancesOnDeploymentSuccessInput", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigTerminateBlueInstancesOnDeploymentSuccess.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
