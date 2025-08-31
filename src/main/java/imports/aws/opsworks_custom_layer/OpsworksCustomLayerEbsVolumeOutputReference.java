package imports.aws.opsworks_custom_layer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.006Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opsworksCustomLayer.OpsworksCustomLayerEbsVolumeOutputReference")
public class OpsworksCustomLayerEbsVolumeOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected OpsworksCustomLayerEbsVolumeOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected OpsworksCustomLayerEbsVolumeOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public OpsworksCustomLayerEbsVolumeOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetEncrypted() {
        software.amazon.jsii.Kernel.call(this, "resetEncrypted", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIops() {
        software.amazon.jsii.Kernel.call(this, "resetIops", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRaidLevel() {
        software.amazon.jsii.Kernel.call(this, "resetRaidLevel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetType() {
        software.amazon.jsii.Kernel.call(this, "resetType", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEncryptedInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptedInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIopsInput() {
        return software.amazon.jsii.Kernel.get(this, "iopsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMountPointInput() {
        return software.amazon.jsii.Kernel.get(this, "mountPointInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getNumberOfDisksInput() {
        return software.amazon.jsii.Kernel.get(this, "numberOfDisksInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRaidLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "raidLevelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "sizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEncrypted() {
        return software.amazon.jsii.Kernel.get(this, "encrypted", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEncrypted(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "encrypted", java.util.Objects.requireNonNull(value, "encrypted is required"));
    }

    public void setEncrypted(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "encrypted", java.util.Objects.requireNonNull(value, "encrypted is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIops() {
        return software.amazon.jsii.Kernel.get(this, "iops", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setIops(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "iops", java.util.Objects.requireNonNull(value, "iops is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMountPoint() {
        return software.amazon.jsii.Kernel.get(this, "mountPoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMountPoint(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "mountPoint", java.util.Objects.requireNonNull(value, "mountPoint is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getNumberOfDisks() {
        return software.amazon.jsii.Kernel.get(this, "numberOfDisks", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setNumberOfDisks(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "numberOfDisks", java.util.Objects.requireNonNull(value, "numberOfDisks is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRaidLevel() {
        return software.amazon.jsii.Kernel.get(this, "raidLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRaidLevel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "raidLevel", java.util.Objects.requireNonNull(value, "raidLevel is required"));
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

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.opsworks_custom_layer.OpsworksCustomLayerEbsVolume value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
