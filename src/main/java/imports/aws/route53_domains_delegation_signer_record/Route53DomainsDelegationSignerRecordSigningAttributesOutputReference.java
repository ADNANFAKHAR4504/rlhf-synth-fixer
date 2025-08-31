package imports.aws.route53_domains_delegation_signer_record;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.196Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53DomainsDelegationSignerRecord.Route53DomainsDelegationSignerRecordSigningAttributesOutputReference")
public class Route53DomainsDelegationSignerRecordSigningAttributesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Route53DomainsDelegationSignerRecordSigningAttributesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Route53DomainsDelegationSignerRecordSigningAttributesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Route53DomainsDelegationSignerRecordSigningAttributesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getAlgorithmInput() {
        return software.amazon.jsii.Kernel.get(this, "algorithmInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getFlagsInput() {
        return software.amazon.jsii.Kernel.get(this, "flagsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPublicKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "publicKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getAlgorithm() {
        return software.amazon.jsii.Kernel.get(this, "algorithm", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setAlgorithm(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "algorithm", java.util.Objects.requireNonNull(value, "algorithm is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getFlags() {
        return software.amazon.jsii.Kernel.get(this, "flags", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setFlags(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "flags", java.util.Objects.requireNonNull(value, "flags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPublicKey() {
        return software.amazon.jsii.Kernel.get(this, "publicKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPublicKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "publicKey", java.util.Objects.requireNonNull(value, "publicKey is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.route53_domains_delegation_signer_record.Route53DomainsDelegationSignerRecordSigningAttributes value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
