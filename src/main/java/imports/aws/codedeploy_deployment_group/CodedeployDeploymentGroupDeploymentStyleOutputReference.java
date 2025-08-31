package imports.aws.codedeploy_deployment_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.320Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codedeployDeploymentGroup.CodedeployDeploymentGroupDeploymentStyleOutputReference")
public class CodedeployDeploymentGroupDeploymentStyleOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodedeployDeploymentGroupDeploymentStyleOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodedeployDeploymentGroupDeploymentStyleOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CodedeployDeploymentGroupDeploymentStyleOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDeploymentOption() {
        software.amazon.jsii.Kernel.call(this, "resetDeploymentOption", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeploymentType() {
        software.amazon.jsii.Kernel.call(this, "resetDeploymentType", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeploymentOptionInput() {
        return software.amazon.jsii.Kernel.get(this, "deploymentOptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeploymentTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "deploymentTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeploymentOption() {
        return software.amazon.jsii.Kernel.get(this, "deploymentOption", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeploymentOption(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deploymentOption", java.util.Objects.requireNonNull(value, "deploymentOption is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeploymentType() {
        return software.amazon.jsii.Kernel.get(this, "deploymentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeploymentType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deploymentType", java.util.Objects.requireNonNull(value, "deploymentType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupDeploymentStyle getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupDeploymentStyle.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupDeploymentStyle value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
