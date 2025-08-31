package imports.aws.efs_access_point;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.141Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.efsAccessPoint.EfsAccessPointRootDirectoryCreationInfoOutputReference")
public class EfsAccessPointRootDirectoryCreationInfoOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EfsAccessPointRootDirectoryCreationInfoOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EfsAccessPointRootDirectoryCreationInfoOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EfsAccessPointRootDirectoryCreationInfoOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getOwnerGidInput() {
        return software.amazon.jsii.Kernel.get(this, "ownerGidInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getOwnerUidInput() {
        return software.amazon.jsii.Kernel.get(this, "ownerUidInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPermissionsInput() {
        return software.amazon.jsii.Kernel.get(this, "permissionsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getOwnerGid() {
        return software.amazon.jsii.Kernel.get(this, "ownerGid", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setOwnerGid(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "ownerGid", java.util.Objects.requireNonNull(value, "ownerGid is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getOwnerUid() {
        return software.amazon.jsii.Kernel.get(this, "ownerUid", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setOwnerUid(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "ownerUid", java.util.Objects.requireNonNull(value, "ownerUid is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPermissions() {
        return software.amazon.jsii.Kernel.get(this, "permissions", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPermissions(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "permissions", java.util.Objects.requireNonNull(value, "permissions is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.efs_access_point.EfsAccessPointRootDirectoryCreationInfo getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.efs_access_point.EfsAccessPointRootDirectoryCreationInfo.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.efs_access_point.EfsAccessPointRootDirectoryCreationInfo value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
