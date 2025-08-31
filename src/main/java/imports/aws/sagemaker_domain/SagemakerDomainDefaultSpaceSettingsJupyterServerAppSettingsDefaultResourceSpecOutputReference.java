package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.306Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettingsDefaultResourceSpecOutputReference")
public class SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettingsDefaultResourceSpecOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettingsDefaultResourceSpecOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettingsDefaultResourceSpecOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettingsDefaultResourceSpecOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetInstanceType() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLifecycleConfigArn() {
        software.amazon.jsii.Kernel.call(this, "resetLifecycleConfigArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSagemakerImageArn() {
        software.amazon.jsii.Kernel.call(this, "resetSagemakerImageArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSagemakerImageVersionAlias() {
        software.amazon.jsii.Kernel.call(this, "resetSagemakerImageVersionAlias", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSagemakerImageVersionArn() {
        software.amazon.jsii.Kernel.call(this, "resetSagemakerImageVersionArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLifecycleConfigArnInput() {
        return software.amazon.jsii.Kernel.get(this, "lifecycleConfigArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSagemakerImageArnInput() {
        return software.amazon.jsii.Kernel.get(this, "sagemakerImageArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSagemakerImageVersionAliasInput() {
        return software.amazon.jsii.Kernel.get(this, "sagemakerImageVersionAliasInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSagemakerImageVersionArnInput() {
        return software.amazon.jsii.Kernel.get(this, "sagemakerImageVersionArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceType() {
        return software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceType", java.util.Objects.requireNonNull(value, "instanceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLifecycleConfigArn() {
        return software.amazon.jsii.Kernel.get(this, "lifecycleConfigArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLifecycleConfigArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lifecycleConfigArn", java.util.Objects.requireNonNull(value, "lifecycleConfigArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSagemakerImageArn() {
        return software.amazon.jsii.Kernel.get(this, "sagemakerImageArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSagemakerImageArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sagemakerImageArn", java.util.Objects.requireNonNull(value, "sagemakerImageArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSagemakerImageVersionAlias() {
        return software.amazon.jsii.Kernel.get(this, "sagemakerImageVersionAlias", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSagemakerImageVersionAlias(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sagemakerImageVersionAlias", java.util.Objects.requireNonNull(value, "sagemakerImageVersionAlias is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSagemakerImageVersionArn() {
        return software.amazon.jsii.Kernel.get(this, "sagemakerImageVersionArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSagemakerImageVersionArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sagemakerImageVersionArn", java.util.Objects.requireNonNull(value, "sagemakerImageVersionArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
