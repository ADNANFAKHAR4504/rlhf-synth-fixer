package imports.aws.customerprofiles_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.403Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.customerprofilesDomain.CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelectorOutputReference")
public class CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelectorOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelectorOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelectorOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelectorOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAddress() {
        software.amazon.jsii.Kernel.call(this, "resetAddress", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEmailAddress() {
        software.amazon.jsii.Kernel.call(this, "resetEmailAddress", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPhoneNumber() {
        software.amazon.jsii.Kernel.call(this, "resetPhoneNumber", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAddressInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "addressInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAttributeMatchingModelInput() {
        return software.amazon.jsii.Kernel.get(this, "attributeMatchingModelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEmailAddressInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "emailAddressInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPhoneNumberInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "phoneNumberInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAddress() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "address", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAddress(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "address", java.util.Objects.requireNonNull(value, "address is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAttributeMatchingModel() {
        return software.amazon.jsii.Kernel.get(this, "attributeMatchingModel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAttributeMatchingModel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "attributeMatchingModel", java.util.Objects.requireNonNull(value, "attributeMatchingModel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getEmailAddress() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "emailAddress", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setEmailAddress(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "emailAddress", java.util.Objects.requireNonNull(value, "emailAddress is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getPhoneNumber() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "phoneNumber", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setPhoneNumber(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "phoneNumber", java.util.Objects.requireNonNull(value, "phoneNumber is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
