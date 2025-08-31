package imports.aws.instance;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.392Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.instance.InstanceEphemeralBlockDeviceOutputReference")
public class InstanceEphemeralBlockDeviceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected InstanceEphemeralBlockDeviceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected InstanceEphemeralBlockDeviceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public InstanceEphemeralBlockDeviceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetNoDevice() {
        software.amazon.jsii.Kernel.call(this, "resetNoDevice", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVirtualName() {
        software.amazon.jsii.Kernel.call(this, "resetVirtualName", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeviceNameInput() {
        return software.amazon.jsii.Kernel.get(this, "deviceNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNoDeviceInput() {
        return software.amazon.jsii.Kernel.get(this, "noDeviceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVirtualNameInput() {
        return software.amazon.jsii.Kernel.get(this, "virtualNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeviceName() {
        return software.amazon.jsii.Kernel.get(this, "deviceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeviceName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deviceName", java.util.Objects.requireNonNull(value, "deviceName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getNoDevice() {
        return software.amazon.jsii.Kernel.get(this, "noDevice", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setNoDevice(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "noDevice", java.util.Objects.requireNonNull(value, "noDevice is required"));
    }

    public void setNoDevice(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "noDevice", java.util.Objects.requireNonNull(value, "noDevice is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVirtualName() {
        return software.amazon.jsii.Kernel.get(this, "virtualName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVirtualName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "virtualName", java.util.Objects.requireNonNull(value, "virtualName is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.instance.InstanceEphemeralBlockDevice value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
