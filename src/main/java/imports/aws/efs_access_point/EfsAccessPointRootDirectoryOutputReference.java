package imports.aws.efs_access_point;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.142Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.efsAccessPoint.EfsAccessPointRootDirectoryOutputReference")
public class EfsAccessPointRootDirectoryOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EfsAccessPointRootDirectoryOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EfsAccessPointRootDirectoryOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EfsAccessPointRootDirectoryOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCreationInfo(final @org.jetbrains.annotations.NotNull imports.aws.efs_access_point.EfsAccessPointRootDirectoryCreationInfo value) {
        software.amazon.jsii.Kernel.call(this, "putCreationInfo", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCreationInfo() {
        software.amazon.jsii.Kernel.call(this, "resetCreationInfo", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPath() {
        software.amazon.jsii.Kernel.call(this, "resetPath", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.efs_access_point.EfsAccessPointRootDirectoryCreationInfoOutputReference getCreationInfo() {
        return software.amazon.jsii.Kernel.get(this, "creationInfo", software.amazon.jsii.NativeType.forClass(imports.aws.efs_access_point.EfsAccessPointRootDirectoryCreationInfoOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.efs_access_point.EfsAccessPointRootDirectoryCreationInfo getCreationInfoInput() {
        return software.amazon.jsii.Kernel.get(this, "creationInfoInput", software.amazon.jsii.NativeType.forClass(imports.aws.efs_access_point.EfsAccessPointRootDirectoryCreationInfo.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPathInput() {
        return software.amazon.jsii.Kernel.get(this, "pathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPath() {
        return software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "path", java.util.Objects.requireNonNull(value, "path is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.efs_access_point.EfsAccessPointRootDirectory getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.efs_access_point.EfsAccessPointRootDirectory.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.efs_access_point.EfsAccessPointRootDirectory value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
