package imports.aws.servicecatalog_provisioned_product;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.436Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.servicecatalogProvisionedProduct.ServicecatalogProvisionedProductStackSetProvisioningPreferencesOutputReference")
public class ServicecatalogProvisionedProductStackSetProvisioningPreferencesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ServicecatalogProvisionedProductStackSetProvisioningPreferencesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ServicecatalogProvisionedProductStackSetProvisioningPreferencesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ServicecatalogProvisionedProductStackSetProvisioningPreferencesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAccounts() {
        software.amazon.jsii.Kernel.call(this, "resetAccounts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFailureToleranceCount() {
        software.amazon.jsii.Kernel.call(this, "resetFailureToleranceCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFailureTolerancePercentage() {
        software.amazon.jsii.Kernel.call(this, "resetFailureTolerancePercentage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxConcurrencyCount() {
        software.amazon.jsii.Kernel.call(this, "resetMaxConcurrencyCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxConcurrencyPercentage() {
        software.amazon.jsii.Kernel.call(this, "resetMaxConcurrencyPercentage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRegions() {
        software.amazon.jsii.Kernel.call(this, "resetRegions", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAccountsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "accountsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getFailureToleranceCountInput() {
        return software.amazon.jsii.Kernel.get(this, "failureToleranceCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getFailureTolerancePercentageInput() {
        return software.amazon.jsii.Kernel.get(this, "failureTolerancePercentageInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxConcurrencyCountInput() {
        return software.amazon.jsii.Kernel.get(this, "maxConcurrencyCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxConcurrencyPercentageInput() {
        return software.amazon.jsii.Kernel.get(this, "maxConcurrencyPercentageInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRegionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "regionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAccounts() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "accounts", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAccounts(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "accounts", java.util.Objects.requireNonNull(value, "accounts is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getFailureToleranceCount() {
        return software.amazon.jsii.Kernel.get(this, "failureToleranceCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setFailureToleranceCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "failureToleranceCount", java.util.Objects.requireNonNull(value, "failureToleranceCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getFailureTolerancePercentage() {
        return software.amazon.jsii.Kernel.get(this, "failureTolerancePercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setFailureTolerancePercentage(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "failureTolerancePercentage", java.util.Objects.requireNonNull(value, "failureTolerancePercentage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxConcurrencyCount() {
        return software.amazon.jsii.Kernel.get(this, "maxConcurrencyCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxConcurrencyCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxConcurrencyCount", java.util.Objects.requireNonNull(value, "maxConcurrencyCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxConcurrencyPercentage() {
        return software.amazon.jsii.Kernel.get(this, "maxConcurrencyPercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxConcurrencyPercentage(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxConcurrencyPercentage", java.util.Objects.requireNonNull(value, "maxConcurrencyPercentage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getRegions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "regions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setRegions(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "regions", java.util.Objects.requireNonNull(value, "regions is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductStackSetProvisioningPreferences getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductStackSetProvisioningPreferences.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductStackSetProvisioningPreferences value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
