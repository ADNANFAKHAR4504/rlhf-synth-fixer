package imports.aws.customerprofiles_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.403Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.customerprofilesDomain.CustomerprofilesDomainMatchingAutoMergingConsolidationOutputReference")
public class CustomerprofilesDomainMatchingAutoMergingConsolidationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CustomerprofilesDomainMatchingAutoMergingConsolidationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CustomerprofilesDomainMatchingAutoMergingConsolidationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CustomerprofilesDomainMatchingAutoMergingConsolidationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMatchingAttributesListInput() {
        return software.amazon.jsii.Kernel.get(this, "matchingAttributesListInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getMatchingAttributesList() {
        return software.amazon.jsii.Kernel.get(this, "matchingAttributesList", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setMatchingAttributesList(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "matchingAttributesList", java.util.Objects.requireNonNull(value, "matchingAttributesList is required"));
    }

    public void setMatchingAttributesList(final @org.jetbrains.annotations.NotNull java.util.List<java.util.List<java.lang.String>> value) {
        software.amazon.jsii.Kernel.set(this, "matchingAttributesList", java.util.Objects.requireNonNull(value, "matchingAttributesList is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingConsolidation getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingConsolidation.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingConsolidation value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
