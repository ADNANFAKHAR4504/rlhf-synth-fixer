package imports.aws.data_aws_sesv2_email_identity;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.872Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsSesv2EmailIdentity.DataAwsSesv2EmailIdentityDkimSigningAttributesOutputReference")
public class DataAwsSesv2EmailIdentityDkimSigningAttributesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsSesv2EmailIdentityDkimSigningAttributesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsSesv2EmailIdentityDkimSigningAttributesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsSesv2EmailIdentityDkimSigningAttributesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCurrentSigningKeyLength() {
        return software.amazon.jsii.Kernel.get(this, "currentSigningKeyLength", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomainSigningPrivateKey() {
        return software.amazon.jsii.Kernel.get(this, "domainSigningPrivateKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomainSigningSelector() {
        return software.amazon.jsii.Kernel.get(this, "domainSigningSelector", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastKeyGenerationTimestamp() {
        return software.amazon.jsii.Kernel.get(this, "lastKeyGenerationTimestamp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNextSigningKeyLength() {
        return software.amazon.jsii.Kernel.get(this, "nextSigningKeyLength", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSigningAttributesOrigin() {
        return software.amazon.jsii.Kernel.get(this, "signingAttributesOrigin", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTokens() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "tokens", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_sesv2_email_identity.DataAwsSesv2EmailIdentityDkimSigningAttributes getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_sesv2_email_identity.DataAwsSesv2EmailIdentityDkimSigningAttributes.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_sesv2_email_identity.DataAwsSesv2EmailIdentityDkimSigningAttributes value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
