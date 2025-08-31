package imports.aws.redshiftserverless_workgroup;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.176Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.redshiftserverlessWorkgroup.RedshiftserverlessWorkgroupConfigParameterOutputReference")
public class RedshiftserverlessWorkgroupConfigParameterOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected RedshiftserverlessWorkgroupConfigParameterOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected RedshiftserverlessWorkgroupConfigParameterOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public RedshiftserverlessWorkgroupConfigParameterOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getParameterKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "parameterKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getParameterValueInput() {
        return software.amazon.jsii.Kernel.get(this, "parameterValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getParameterKey() {
        return software.amazon.jsii.Kernel.get(this, "parameterKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setParameterKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "parameterKey", java.util.Objects.requireNonNull(value, "parameterKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getParameterValue() {
        return software.amazon.jsii.Kernel.get(this, "parameterValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setParameterValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "parameterValue", java.util.Objects.requireNonNull(value, "parameterValue is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.redshiftserverless_workgroup.RedshiftserverlessWorkgroupConfigParameter value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
