package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.113Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetRowLevelPermissionDataSetOutputReference")
public class QuicksightDataSetRowLevelPermissionDataSetOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightDataSetRowLevelPermissionDataSetOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightDataSetRowLevelPermissionDataSetOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightDataSetRowLevelPermissionDataSetOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetFormatVersion() {
        software.amazon.jsii.Kernel.call(this, "resetFormatVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNamespace() {
        software.amazon.jsii.Kernel.call(this, "resetNamespace", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatus() {
        software.amazon.jsii.Kernel.call(this, "resetStatus", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getArnInput() {
        return software.amazon.jsii.Kernel.get(this, "arnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFormatVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "formatVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNamespaceInput() {
        return software.amazon.jsii.Kernel.get(this, "namespaceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPermissionPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "permissionPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "statusInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "arn", java.util.Objects.requireNonNull(value, "arn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFormatVersion() {
        return software.amazon.jsii.Kernel.get(this, "formatVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFormatVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "formatVersion", java.util.Objects.requireNonNull(value, "formatVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNamespace() {
        return software.amazon.jsii.Kernel.get(this, "namespace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNamespace(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "namespace", java.util.Objects.requireNonNull(value, "namespace is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPermissionPolicy() {
        return software.amazon.jsii.Kernel.get(this, "permissionPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPermissionPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "permissionPolicy", java.util.Objects.requireNonNull(value, "permissionPolicy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStatus(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "status", java.util.Objects.requireNonNull(value, "status is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionDataSet getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionDataSet.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionDataSet value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
