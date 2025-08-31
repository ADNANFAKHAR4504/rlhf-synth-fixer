package imports.aws.connect_user;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.394Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.connectUser.ConnectUserPhoneConfigOutputReference")
public class ConnectUserPhoneConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ConnectUserPhoneConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ConnectUserPhoneConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ConnectUserPhoneConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAfterContactWorkTimeLimit() {
        software.amazon.jsii.Kernel.call(this, "resetAfterContactWorkTimeLimit", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoAccept() {
        software.amazon.jsii.Kernel.call(this, "resetAutoAccept", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeskPhoneNumber() {
        software.amazon.jsii.Kernel.call(this, "resetDeskPhoneNumber", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getAfterContactWorkTimeLimitInput() {
        return software.amazon.jsii.Kernel.get(this, "afterContactWorkTimeLimitInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAutoAcceptInput() {
        return software.amazon.jsii.Kernel.get(this, "autoAcceptInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeskPhoneNumberInput() {
        return software.amazon.jsii.Kernel.get(this, "deskPhoneNumberInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPhoneTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "phoneTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getAfterContactWorkTimeLimit() {
        return software.amazon.jsii.Kernel.get(this, "afterContactWorkTimeLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setAfterContactWorkTimeLimit(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "afterContactWorkTimeLimit", java.util.Objects.requireNonNull(value, "afterContactWorkTimeLimit is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAutoAccept() {
        return software.amazon.jsii.Kernel.get(this, "autoAccept", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAutoAccept(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "autoAccept", java.util.Objects.requireNonNull(value, "autoAccept is required"));
    }

    public void setAutoAccept(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "autoAccept", java.util.Objects.requireNonNull(value, "autoAccept is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeskPhoneNumber() {
        return software.amazon.jsii.Kernel.get(this, "deskPhoneNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeskPhoneNumber(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deskPhoneNumber", java.util.Objects.requireNonNull(value, "deskPhoneNumber is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPhoneType() {
        return software.amazon.jsii.Kernel.get(this, "phoneType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPhoneType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "phoneType", java.util.Objects.requireNonNull(value, "phoneType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.connect_user.ConnectUserPhoneConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.connect_user.ConnectUserPhoneConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.connect_user.ConnectUserPhoneConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
