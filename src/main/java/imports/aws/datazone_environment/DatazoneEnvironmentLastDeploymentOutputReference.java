package imports.aws.datazone_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.956Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datazoneEnvironment.DatazoneEnvironmentLastDeploymentOutputReference")
public class DatazoneEnvironmentLastDeploymentOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DatazoneEnvironmentLastDeploymentOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DatazoneEnvironmentLastDeploymentOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DatazoneEnvironmentLastDeploymentOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeploymentId() {
        return software.amazon.jsii.Kernel.get(this, "deploymentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeploymentStatus() {
        return software.amazon.jsii.Kernel.get(this, "deploymentStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeploymentType() {
        return software.amazon.jsii.Kernel.get(this, "deploymentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.datazone_environment.DatazoneEnvironmentLastDeploymentFailureReasonsList getFailureReasons() {
        return software.amazon.jsii.Kernel.get(this, "failureReasons", software.amazon.jsii.NativeType.forClass(imports.aws.datazone_environment.DatazoneEnvironmentLastDeploymentFailureReasonsList.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getIsDeploymentComplete() {
        return software.amazon.jsii.Kernel.get(this, "isDeploymentComplete", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getMessages() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "messages", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.datazone_environment.DatazoneEnvironmentLastDeployment getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.datazone_environment.DatazoneEnvironmentLastDeployment.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.datazone_environment.DatazoneEnvironmentLastDeployment value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
