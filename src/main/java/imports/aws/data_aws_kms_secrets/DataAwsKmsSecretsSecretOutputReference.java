package imports.aws.data_aws_kms_secrets;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.717Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsKmsSecrets.DataAwsKmsSecretsSecretOutputReference")
public class DataAwsKmsSecretsSecretOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsKmsSecretsSecretOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsKmsSecretsSecretOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsKmsSecretsSecretOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetContext() {
        software.amazon.jsii.Kernel.call(this, "resetContext", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEncryptionAlgorithm() {
        software.amazon.jsii.Kernel.call(this, "resetEncryptionAlgorithm", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGrantTokens() {
        software.amazon.jsii.Kernel.call(this, "resetGrantTokens", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getContextInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "contextInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEncryptionAlgorithmInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptionAlgorithmInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getGrantTokensInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "grantTokensInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "keyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPayloadInput() {
        return software.amazon.jsii.Kernel.get(this, "payloadInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getContext() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "context", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setContext(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "context", java.util.Objects.requireNonNull(value, "context is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEncryptionAlgorithm() {
        return software.amazon.jsii.Kernel.get(this, "encryptionAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEncryptionAlgorithm(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "encryptionAlgorithm", java.util.Objects.requireNonNull(value, "encryptionAlgorithm is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getGrantTokens() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "grantTokens", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setGrantTokens(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "grantTokens", java.util.Objects.requireNonNull(value, "grantTokens is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyId() {
        return software.amazon.jsii.Kernel.get(this, "keyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "keyId", java.util.Objects.requireNonNull(value, "keyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPayload() {
        return software.amazon.jsii.Kernel.get(this, "payload", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPayload(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "payload", java.util.Objects.requireNonNull(value, "payload is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_kms_secrets.DataAwsKmsSecretsSecret value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
