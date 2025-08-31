package imports.aws.finspace_kx_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.218Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.finspaceKxCluster.FinspaceKxClusterSavedownStorageConfigurationOutputReference")
public class FinspaceKxClusterSavedownStorageConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected FinspaceKxClusterSavedownStorageConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FinspaceKxClusterSavedownStorageConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public FinspaceKxClusterSavedownStorageConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetSize() {
        software.amazon.jsii.Kernel.call(this, "resetSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetType() {
        software.amazon.jsii.Kernel.call(this, "resetType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVolumeName() {
        software.amazon.jsii.Kernel.call(this, "resetVolumeName", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "sizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVolumeNameInput() {
        return software.amazon.jsii.Kernel.get(this, "volumeNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSize() {
        return software.amazon.jsii.Kernel.get(this, "size", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "size", java.util.Objects.requireNonNull(value, "size is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVolumeName() {
        return software.amazon.jsii.Kernel.get(this, "volumeName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVolumeName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "volumeName", java.util.Objects.requireNonNull(value, "volumeName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_cluster.FinspaceKxClusterSavedownStorageConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterSavedownStorageConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_cluster.FinspaceKxClusterSavedownStorageConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
