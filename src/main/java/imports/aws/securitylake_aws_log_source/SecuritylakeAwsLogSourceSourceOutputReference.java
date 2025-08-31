package imports.aws.securitylake_aws_log_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.418Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securitylakeAwsLogSource.SecuritylakeAwsLogSourceSourceOutputReference")
public class SecuritylakeAwsLogSourceSourceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SecuritylakeAwsLogSourceSourceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SecuritylakeAwsLogSourceSourceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public SecuritylakeAwsLogSourceSourceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetAccounts() {
        software.amazon.jsii.Kernel.call(this, "resetAccounts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceVersion() {
        software.amazon.jsii.Kernel.call(this, "resetSourceVersion", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAccountsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "accountsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRegionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "regionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceNameInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAccounts() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "accounts", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAccounts(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "accounts", java.util.Objects.requireNonNull(value, "accounts is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getRegions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "regions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setRegions(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "regions", java.util.Objects.requireNonNull(value, "regions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceName() {
        return software.amazon.jsii.Kernel.get(this, "sourceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceName", java.util.Objects.requireNonNull(value, "sourceName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceVersion() {
        return software.amazon.jsii.Kernel.get(this, "sourceVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceVersion", java.util.Objects.requireNonNull(value, "sourceVersion is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.securitylake_aws_log_source.SecuritylakeAwsLogSourceSource value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
