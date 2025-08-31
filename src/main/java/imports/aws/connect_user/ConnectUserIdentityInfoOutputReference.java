package imports.aws.connect_user;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.394Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.connectUser.ConnectUserIdentityInfoOutputReference")
public class ConnectUserIdentityInfoOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ConnectUserIdentityInfoOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ConnectUserIdentityInfoOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ConnectUserIdentityInfoOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetEmail() {
        software.amazon.jsii.Kernel.call(this, "resetEmail", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFirstName() {
        software.amazon.jsii.Kernel.call(this, "resetFirstName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLastName() {
        software.amazon.jsii.Kernel.call(this, "resetLastName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecondaryEmail() {
        software.amazon.jsii.Kernel.call(this, "resetSecondaryEmail", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEmailInput() {
        return software.amazon.jsii.Kernel.get(this, "emailInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFirstNameInput() {
        return software.amazon.jsii.Kernel.get(this, "firstNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLastNameInput() {
        return software.amazon.jsii.Kernel.get(this, "lastNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSecondaryEmailInput() {
        return software.amazon.jsii.Kernel.get(this, "secondaryEmailInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEmail() {
        return software.amazon.jsii.Kernel.get(this, "email", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEmail(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "email", java.util.Objects.requireNonNull(value, "email is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFirstName() {
        return software.amazon.jsii.Kernel.get(this, "firstName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFirstName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "firstName", java.util.Objects.requireNonNull(value, "firstName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastName() {
        return software.amazon.jsii.Kernel.get(this, "lastName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLastName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lastName", java.util.Objects.requireNonNull(value, "lastName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecondaryEmail() {
        return software.amazon.jsii.Kernel.get(this, "secondaryEmail", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSecondaryEmail(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "secondaryEmail", java.util.Objects.requireNonNull(value, "secondaryEmail is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.connect_user.ConnectUserIdentityInfo getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.connect_user.ConnectUserIdentityInfo.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.connect_user.ConnectUserIdentityInfo value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
