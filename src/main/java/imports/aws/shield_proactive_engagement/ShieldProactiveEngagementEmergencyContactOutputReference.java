package imports.aws.shield_proactive_engagement;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.467Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.shieldProactiveEngagement.ShieldProactiveEngagementEmergencyContactOutputReference")
public class ShieldProactiveEngagementEmergencyContactOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ShieldProactiveEngagementEmergencyContactOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ShieldProactiveEngagementEmergencyContactOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public ShieldProactiveEngagementEmergencyContactOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetContactNotes() {
        software.amazon.jsii.Kernel.call(this, "resetContactNotes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPhoneNumber() {
        software.amazon.jsii.Kernel.call(this, "resetPhoneNumber", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContactNotesInput() {
        return software.amazon.jsii.Kernel.get(this, "contactNotesInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEmailAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "emailAddressInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPhoneNumberInput() {
        return software.amazon.jsii.Kernel.get(this, "phoneNumberInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContactNotes() {
        return software.amazon.jsii.Kernel.get(this, "contactNotes", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContactNotes(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "contactNotes", java.util.Objects.requireNonNull(value, "contactNotes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEmailAddress() {
        return software.amazon.jsii.Kernel.get(this, "emailAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEmailAddress(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "emailAddress", java.util.Objects.requireNonNull(value, "emailAddress is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPhoneNumber() {
        return software.amazon.jsii.Kernel.get(this, "phoneNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPhoneNumber(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "phoneNumber", java.util.Objects.requireNonNull(value, "phoneNumber is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.shield_proactive_engagement.ShieldProactiveEngagementEmergencyContact value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
